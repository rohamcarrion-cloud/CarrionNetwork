# Production security baseline — 008A.1

Status: proposed architecture and locally reviewed artifacts, September 29, 2026.
No VPS connection, host configuration, DNS, TLS issuance or deployment is authorized
in this milestone. The supplied Hostinger inventory is owner-provided, not live verified.
008A.2 requires human review of [the checklist](DEPLOYMENT_CHECKLIST.md) and
[bootstrap runbook](VPS_BOOTSTRAP.md). This document makes no compliance claim.

## Architecture decision

One Ubuntu 24.04 KVM 4 VPS, Docker Compose, three long-running services:

```text
Internet -> Caddy :80/:443 -> static Creator Studio
                         -> /api/* (strip /api) -> Node :3010 -> PostgreSQL :5432
                                                     -> private /media bind
```

No Vite server, Kubernetes, Redis, queues or extra microservices. Caddy and API
share `edge`; API and PostgreSQL share an `internal` database network. Caddy
cannot directly reach the database. API has outbound internet via edge (future
SSRF risk); private network does not protect SQL from a compromised API.
Only host SSH 22 and proxy TCP 80/443 are intended public. No UDP port published.
PostgreSQL and API have no host port mapping. Never use production with the local
`compose.yaml`, which contains development credentials and a loopback DB port.

Caddy is selected over NGINX for integrated certificate issuance/renewal and a
small readable routing configuration. NGINX is viable but needs a separate
certificate lifecycle. Build the Studio into the proxy image and keep `/api` as
its same-origin API base. `PUBLIC_BASE_URL=https://CANONICAL_DOMAIN/api` preserves
existing feed/enclosure identities. Do not derive it from Host/X-Forwarded headers.
Caddy forwards the request and supplies forwarded headers; there is no preceding
trusted proxy in this topology. Application must not trust arbitrary client
forwarded IPs if rate limiting is later added. Do not configure broad trusted proxies.

API handles feeds, public artwork and MP3 GET/HEAD/Range/conditional RSS responses.
Never mount media into Caddy or use a static public media root. Existing public
representations remain accessible after unpublish/archive; emergency revocation
is not implemented. No proxy response buffering/cache/transformation is added.
100 MiB proxy request cap matches MP3 cap; images remain 10 MiB and JSON is bounded
by application code. Uploads are buffered in memory with two concurrent slots;
2 GiB API limit is an initial safety budget, not a capacity guarantee. Load-test
large uploads/slow clients and resource failures before open creator registration.
Node's default request timeouts may reject slow 100 MiB uploads; measure and tune
explicitly before changing upload ceilings.

## Directory and permission model

| Path under /srv/carrionnetwork | Owner / mode                         | Persistence and backup                                                                  |
| ------------------------------ | ------------------------------------ | --------------------------------------------------------------------------------------- |
| root directory                 | deploy:deploy 0750                   | Stable, never Git                                                                       |
| app/releases/COMMIT            | deploy:deploy 0750                   | Replaceable clean source checkout; immutable release after review; GitHub source backup |
| deployment/                    | deploy:deploy 0750                   | Reviewed Compose/scripts, release digest/SHA manifests; backup metadata                 |
| config/                        | deploy:deploy 0700                   | Persistent; secrets files 0600; encrypted recovery backup                               |
| config/caddy/                  | numeric 1000:1000 0700               | Writable Caddy state; backup with certificate state                                     |
| data/media/                    | numeric 1000:1000 0700               | Persistent originals/public representations; files 0600; essential backup               |
| data/postgres/                 | selected image postgres UID:GID 0700 | Persistent live cluster; never copy live files as logical backup                        |
| data/caddy/                    | numeric 1000:1000 0700               | Persistent ACME private keys/certificates; sensitive backup                             |
| backups/postgres/              | deploy:deploy 0700                   | Dumps/checksums 0600; rotate and export encrypted                                       |
| backups/recovery/              | deploy:deploy 0700                   | Matched SQL/media/config manifests; separate retention                                  |
| logs/                          | deploy:deploy 0700                   | Sanitized incident exports only; restricted retention                                   |

Container UID 1000 is deliberate; verify collisions with deploy UID on target.
Postgres official image starts with root to set ownership then drops to postgres;
read-only root/capability removal is not applied blindly to its entrypoint. Inspect
the selected image's UID/GID before preparing bind paths; do not assume Alpine
matches Debian. Routine deployments run as deploy, never root; initial directory
ownership preparation is a system-administration task. Deploy has Docker root
capability regardless of Unix path ownership. No production data, credentials,
dumps, logs or generated certificates belong in Git/build contexts.

## Docker, database and secrets

API/proxy: non-root, read-only root, tmpfs, all capabilities dropped,
no-new-privileges, PID/memory/CPU limits, bounded local logs, health checks,
unless-stopped. Migration tool is one-shot and not started by normal deployment.
No privileged mode, host network, socket mount or application access to Docker.
Postgres: private network, persistent bind, health check, bounded resources/logs.
Compose reservations are planning hints, not admission guarantees; limits share
four CPUs and leave RAM for host/cache/backups. Health checks do not auto-restart
an unhealthy but running container; alert and investigate rather than restart-loop.

Dedicated database `carrion_network`, administrative role `carrion_admin`, schema
owner/login `carrion_migrator`, runtime `carrion_app`. Admin is never in API env.
Provision roles with `deploy/postgres/roles.sql`, set passwords interactively,
then deliberately run migrations 001–007 as migrator. Execute runtime grants
after each reviewed migration; runtime gets table DML/sequence use, not schema
creation/ownership/role administration. No per-user PostgreSQL RLS exists; Node
workspace/show authorization is authoritative. This bounds DDL compromise but
runtime SQL compromise can still read/change all application data. Migration ledger
has no content checksums; keep immutable source/image provenance and review diffs.
Do not grant future tables automatically. Integration tests need CREATEDB and must
never run with production identities or against production.

First-stage secrets: off-checkout env files 0600 in config/0700, deploy-owned.
Compose mounted admin secret is a host file, not encrypted secret storage.
API/migrator DATABASE_URL lives in container environment and is visible to Docker
administrators; do not print `docker inspect`, expanded Compose config or env.
Generate independent 32-byte hexadecimal passwords using `openssl rand -hex 32`
into protected files under `umask 077`, never terminal transcripts; compose URLs
locally without shell tracing. Store recovery copies in an owner-controlled password
manager/encrypted offline backup. No current session signing secret exists: tokens
are random and only SHA-256 hashes stored. Do not invent required auth env values.

Inventory: DB admin/runtime/migrator passwords; SSH private/deploy GitHub read-only
key; optional registry read-only token; ACME account/TLS keys; encrypted backup key.
Future email/object-storage/payment/directory credentials need separate scoped
secrets when those features exist. Never place secrets in `VITE_*` build arguments:
they become public JS. Rotate DB roles with maintenance/reload and new env files,
verify connection health, then revoke old values. Updating POSTGRES_PASSWORD_FILE
alone does not change an existing cluster password. Rotate SSH/registry access by
establishing/testing replacement before removing old keys. Exposure: revoke first,
rotate all derived access, invalidate sessions if auth data exposed, preserve evidence,
scan history/images/logs and coordinate any history cleanup separately (no force push
in this milestone). Removing a leaked file from latest Git does not revoke it.

## Web baseline and operational gates

Caddy enforces HTTPS/HTTP redirect; verify redirects do not expose internal 8443.
HSTS is deliberately deferred until TLS, renewal and canonical hostname are proven:
start `max-age=300`, extend after observation, no includeSubDomains/preload without
separate domain review. Static Studio CSP restricts scripts/connect/media to self,
allows blob previews and inline styles needed by React, disallows framing/objects.
API media's existing restrictive CSP is preserved. Smoke-test CSP in browser; add
report-only staging if future assets require broader rules. nosniff, no-referrer,
Permissions-Policy and static X-Frame-Options are supplied. No cookie auth currently;
CSRF exposure is lower with explicit bearer headers, revisit with any cookie migration.

Monitor daily: container state/health, `/api/health` (DB query), disk/inodes (>70%
warning, >85% urgent), DB connections, backup age/failure, TLS expiry (<21 days),
SSH failures/journal, memory/OOM and upload errors. Check after every deployment.
Caddy access logging is disabled because URI query strings carry original filenames;
operational TLS/error logs remain and may include request URI context on failures;
restrict access and review/redact private query values before exports. Add sanitized path/status/latency logging with no query,
Authorization, cookies, request/response body or user email before enabling access logs.
API `server.js` currently logs full unexpected Error objects: DB detail can contain
personal fields; `media.js` logs orphan storage UUID/error code. This milestone does
not change application logging. Sanitized allowlisted error logging and auth throttling
are open-public-registration blockers, alongside abuse quotas/takedown operations.
Retain operational logs initially 14 days where possible; Docker's bounded local
rotation is size-based, not a guaranteed time retention. Restrict incident exports.
External uptime and alert delivery are future work, not already configured.

## Supply chain

Commit package-lock.json; `npm ci` in both image builds, never npm install on VPS.
Use reviewed Node 22 supported patch image and Caddy 2.10+ (request_body feature),
PostgreSQL 17 matching current development major. Require tag plus immutable digest
for build bases and deployed custom images. Artifact templates intentionally contain
no resolved production digest. Build linux/amd64 on macOS with buildx; record commit,
base digests, lock checksum, platform and resulting image digest. Audit with `npm audit`
and review native sharp/WASM decoder changes. Do not automatically apply major updates.
Periodically rebuild with reviewed patch bases, scan images, test, restore rehearsal,
then staged deployment. Major Postgres upgrades require pg_upgrade/dump restore planning,
not changing the image on existing data. Review Ubuntu security updates weekly,
schedule reboot after access/recovery checks; urgent remotely exploitable issues
receive prompt containment/patching and regression checks. GitHub/registry compromise:
pause release, verify signed/known provenance out of band and rotate deployment access.

## Authoritative operational references

Reviewed September 29, 2026:

- [Docker group root-level privileges](https://docs.docker.com/engine/install/linux-postinstall/)
- [Docker published ports bypass UFW](https://docs.docker.com/engine/network/packet-filtering-firewalls/)
- [Caddy automatic HTTPS](https://caddyserver.com/docs/automatic-https)
- [Caddy proxy forwarding](https://caddyserver.com/docs/caddyfile/directives/reverse_proxy)
- [Caddy body limits](https://caddyserver.com/docs/caddyfile/directives/request_body)
- [PostgreSQL logical backup](https://www.postgresql.org/docs/17/backup-dump.html)
- [Ubuntu OpenSSH guidance](https://documentation.ubuntu.com/server/how-to/security/openssh-server/)

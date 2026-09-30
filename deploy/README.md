# Prepared production artifacts — not deployed

Read [security baseline](../docs/security/SECURITY_BASELINE.md),
[bootstrap](../docs/security/VPS_BOOTSTRAP.md) and
[acceptance checklist](../docs/security/DEPLOYMENT_CHECKLIST.md) before use.
These files are intended for a human-reviewed 008A.2. No script performs SSH,
firewall setup or OS changes. Do not run operational scripts on macOS.

## Image/release preparation

Build from repository root with reviewed immutable base digests. Node must be a
supported Node 22 patch Debian slim image (sharp compatible); proxy uses Caddy 2.10+
Alpine; DB uses PostgreSQL 17 Alpine matching data layout. Never use latest.

```sh
# Substitute reviewed registry references/digests; these are not executable defaults.
docker buildx build --platform linux/amd64 --build-arg NODE_IMAGE=NODE_TAG_AT_DIGEST -f deploy/Dockerfile.api -t REGISTRY_API_COMMIT --push .
docker buildx build --platform linux/amd64 --build-arg NODE_IMAGE=NODE_TAG_AT_DIGEST --build-arg CADDY_IMAGE=CADDY_TAG_AT_DIGEST -f deploy/Dockerfile.proxy -t REGISTRY_PROXY_COMMIT --push .
```

Record resulting custom image digests, base versions/digests, lock checksum, commit
and platform in private deployment manifest. No production secrets are build args.
Proxy image embeds Studio `/api` same-origin base, reviewed Caddy config; no Vite dev
server. Validate Caddy with chosen image (`caddy validate --config ... --adapter caddyfile`)
using example.invalid/contact environment without requesting certificates. Test actual
proxy path stripping, HTTP redirect and TLS/media behavior in staged acceptance.

## Deliberate DB initialization (008A.2 only)

Install production Compose/scripts/SQL under /srv/carrionnetwork/deployment and protected
config as documented. Helpers require deploy user/Linux stat/flock, filled env/digests,
existing bind paths and local Docker access; scripts do not source env values as shell
code. Initial administrator is official-image bootstrap superuser, private DB only.
Secret FILE initializes a new cluster only. Local socket admin access is restricted to
container/Docker operators and should be verified against actual pg_hba; no password
is placed in command argv.

Using the explicit production env/file arguments each time:

1. `docker compose --env-file /srv/carrionnetwork/config/production.env -f /srv/carrionnetwork/deployment/compose.production.yaml up -d --wait postgres`
2. Run roles.sql via `exec -T postgres psql -U carrion_admin -d carrion_network -v ON_ERROR_STOP=1`
   with file redirected from deployment/postgres/roles.sql. Run once on new cluster;
   no automatic idempotent role overwrite. Stop on error and inspect partial provisioning.
3. Interactive `exec postgres psql -U carrion_admin -d carrion_network`: `\password carrion_migrator`
   and `\password carrion_app`. Supply protected generated values, matching env files.
   Passwords are not SQL/command history values. Verify SCRAM host auth and separate roles.
4. Human approves migration diff and backup: `--profile tools run --rm migrate` applies
   001–007 with per-file transactional ledger/advisory lock. Never migrate on API startup.
5. Run runtime-grants.sql as migrator (or admin) in this DB after migrations. Test runtime
   connection and DDL denial in isolated local rehearsal; triggers need runtime table DML.
   Runtime does not own objects; migration tool env is never mounted into API.
6. Take verified recovery set/manifest before initial or subsequent release. Run
   `deploy.sh --reviewed-release VERIFIED_BACKUP_MANIFEST`. This validates/pulls,
   checks schema using migrator, then starts healthy API/proxy; it never applies DDL.
   Manifest existence is a guard, not proof of restoration: owner must review its evidence.
7. Complete HTTPS/browser/public/private checks and record exact release digests/SHA.
   `up --wait` detects health failure but is not functional acceptance or rollback.

No delete/down-volume or automatic rollback operations. Keep last known-good release
images/digests and preserve DB/media; only roll back code compatible with current schema.
Compose content changes must be copied/reviewed into deployment before running helpers.

## Backups and restore

`backup-postgres.sh` creates atomic custom-format SQL dump, validates archive listing,
adds SHA-256 and rotates only completed daily dumps older than 13 days. This is not
a media/config backup or restore test. Schedule and add tested failure notification
in 008A.2; see [recovery plan](../docs/security/BACKUP_RECOVERY.md) for matched sets,
encryption/off-server copy and lock coordination. The admin local socket method does
not grant app credentials extra privileges.

`restore-postgres.sh --new-recovery-database DUMP carrion_recovery_NAME` verifies checksum
and restores to a newly created DB only. It refuses existing DB implicitly via createdb;
never cleans/drops/promotes live data. Public database CONNECT is revoked before loading. Regrant runtime privileges and
explicit recovery-app CONNECT, restore corresponding media separately and perform isolated checks.
Failed restore leaves new database for manual investigation, not destructive retry.

## Local validation

Application gates: npm test, npm run test:integration (disposable DBs only), npm run
test:web, npm run typecheck, npm run build, npm run format:check. Run `bash -n` on every
script, shellcheck when available, Prettier on YAML/Markdown. Compose quiet rendering
can use placeholder image env and `config --no-env-resolution --quiet` to avoid needing
host secrets; normal validation requires protected env files and must never print them.
Container builds/Caddy/runtime grants/backup restore tests require available local
Docker or isolated DB, never the production VPS in 008A.1.

BuildKit may emit InvalidDefaultArgInFrom warnings: the Dockerfiles intentionally
require reviewed base-image arguments and provide no floating production default.
The custom proxy removes the upstream binary file capability (`setcap -r`) so Caddy
can execute under cap_drop ALL; it binds only high internal ports.

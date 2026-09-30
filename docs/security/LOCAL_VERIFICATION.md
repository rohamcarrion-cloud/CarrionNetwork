# 008A.1 local verification — September 29, 2026

Repository origin verified as rohamcarrion-cloud/CarrionNetwork, main, clean initial
working tree; fetched origin/main and observed HEAD divergence 0/0. Initial commit
22abc4d (Milestone 007). Inspected migrations 001–007, existing domain/media/RSS/Studio
architecture, HTTP/auth/storage/authorization/logging code, dev Compose, env template,
lockfile and ignores. No application code/schema/dependencies changed.

| Gate                                               | Result                                                                                                                                               |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| npm test                                           | 13 passed, no failure/skip                                                                                                                           |
| npm run test:integration                           | 17 passed, no failure/skip; disposable DB migrations, authorization, media/RSS                                                                       |
| npm run test:web                                   | 33 passed across 4 files                                                                                                                             |
| npm run typecheck                                  | Passed                                                                                                                                               |
| npm run build                                      | Passed                                                                                                                                               |
| npm run format:check                               | Passed                                                                                                                                               |
| npm run test:e2e                                   | 12 passed, desktop/mobile Chromium; existing workflows                                                                                               |
| npm audit                                          | 0 known vulnerabilities at time of check; not proof of absence                                                                                       |
| Production YAML/Markdown Prettier                  | Passed                                                                                                                                               |
| bash -n (all five shell files)                     | Passed                                                                                                                                               |
| ShellCheck v0.11.0 (-x, scripts working directory) | Passed                                                                                                                                               |
| Production Compose rendering                       | Passed with no-env-resolution and dummy interpolation values; no secrets printed                                                                     |
| Rendered Compose safety assertions                 | API/DB no ports; only proxy 80/443; DB internal; API/proxy UID1000/read-only/cap_drop ALL; one proxy tmpfs mount                                     |
| Both custom Docker image builds                    | Passed for linux/amd64 on local Docker Desktop; npm ci/build stages                                                                                  |
| Caddy production config validation                 | Passed with example.invalid values, no public ACME issuance                                                                                          |
| Isolated restricted-role migration rehearsal       | 001–007 applied as carrion_migrator; runtime grants applied                                                                                          |
| Runtime DDL negative check                         | CREATE TABLE rejected with permission denied for schema public                                                                                       |
| Local production-image HTTP/HTTPS rehearsal        | Passed (see below)                                                                                                                                   |
| Logical dump/restore rehearsal                     | Custom archive listed and restored transactionally as migrator into new carrion_recovery_test; 7 ledger entries, 1 creator, 1 publication, 1 artwork |
| Diff/secret/artifact review                        | No real credentials, runtime media, dumps or generated build/test output staged                                                                      |

## Additional infrastructure rehearsal

Used a new local Docker network and disposable PostgreSQL container, no DB host port,
separate from existing developer containers. The disposable DB used test-only trust
host authentication to exercise SQL grants; this does **not** validate production
SCRAM credentials, secret-file provisioning or pg_hba. Production specifies SCRAM.
API used runtime role, read-only root, UID1000/cap_drop ALL/no-new-privileges, tmpfs media.
Proxy used the same controls, only loopback test ports 18080/18443 and a temporary
`tls internal` override with example.invalid. No public CA/DNS/VPS was involved.

Passed: registration and personal workspace trigger; login; built Studio SPA fallback;
image/MP3 validation/upload; publish/feed creation; anonymous private original rejected;
Caddy /api prefix stripping; canonical HTTPS RSS URLs; RSS ETag 304; artwork HEAD;
MP3 HEAD and 10-byte Range/206; HTTP 308 Location uses canonical HTTPS without internal 8443. Node HTTPS test client accepted temporary CA. Real Chromium login/dashboard
through Caddy passed with enforcing Studio CSP and no browser console/page errors.
No visual design acceptance or Safari/physical-device certification is claimed.

Initial upstream Caddy failed execution with cap_drop ALL because its binary carried
a file capability. Custom proxy Dockerfile now removes that capability and validation/
runtime passed. Initial YAML formatting exposed a flow-sequence tmpfs comma ambiguity;
proxy tmpfs now uses a single block item and rendered configuration was asserted.
BuildKit warns InvalidDefaultArgInFrom because base image arguments are intentionally
mandatory without floating defaults. Existing Playwright emits NO_COLOR/FORCE_COLOR
warnings. Native macOS LibreSSL curl failed against the local test TLS certificate;
Node HTTPS and Chromium succeeded. No claim that public TLS has been validated.

Local build bases (verification evidence, not approved production version choices):

- node:22-bookworm-slim@sha256:43ac6c60b8f89723f746e8a92ce91abd5017e627ce1ddfe4238355d3a30b772c
- caddy:2.10.2-alpine@sha256:4c6e91c6ed0e2fa03efd5b44747b625fec79bc9cd06ac5235a779726618e530d
- Existing local postgres:17-alpine image; deployment requires separately reviewed digest.

The production operational scripts were prepared and statically checked, not executed.
Rehearsal used independent local test commands against disposable resources. SQL-only
restore does not certify full matched media/config recovery, backup timer/alert/export,
SSH/UFW/IPv6, production image vulnerability scanning, real DNS/TLS issuance/renewal,
resource capacity or live VPS security. Those remain explicit 008A.2 acceptance gates.
Temporary local rehearsal containers/network/data were removed; existing developer
containers were left untouched. Built local test image cache remains available.

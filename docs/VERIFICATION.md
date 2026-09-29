# Foundation verification

## 2026-09-28 — Mac handoff and Milestone 006

This section supersedes the historical Windows/WSL environment notes below.
The Mac is now the primary development environment; do not use the retired WSL
browser-library override. Plain `npm run test:e2e` launches native macOS Chromium.

Handoff verified `/Users/rohamcarrion/Developer/CarrionNetwork`, origin
`git@github.com:rohamcarrion-cloud/CarrionNetwork.git`, clean `main` at `207c55d`,
and zero ahead/behind after `git fetch origin`. Node v26.4.0 on darwin/arm64
satisfies >=22.22.0; npm 12.0.2 and `npm ls --depth=0` reported the locked dependency
tree without missing/invalid packages. No dependency or Mac-only configuration
changes were required. `LD_LIBRARY_PATH` was unset. Docker PostgreSQL 17 was healthy
on loopback port 5434. The new Mac database initially had no migration ledger;
applying 001–005 initialized it successfully, then `db:check` passed. Baseline:
8 backend tests, 14 API results, 21 frontend tests, types, build and all 8 existing
browser workflows passed before implementation.

| Final gate | Result |
| --- | --- |
| `db:migrate`, repeat, `db:check` | Six migrations; rerun no-op; separate-process ledger check passes |
| Fresh/populated migration verification | 006 applies fresh and over populated 005; image/audio rows, both covers, audio association, GUID and historical publication preserved |
| 006 rollback | Injected failure after 006 SQL rolls back its tables and ledger; unmodified migration then applies successfully |
| Migration durability | New connections, stable ledger timestamps, ordered 007–009 probes, rollback, repaired retry and missing-file detection pass |
| `npm test` | 8 passed |
| `npm run test:integration` | 16 passed (parent plus 15 subtests), no failures/skips |
| `npm run test:web` | 26 passed |
| `npm run typecheck` | Passed |
| `npm run format:check` | Passed |
| `npm run build` | Passed |
| `npm run test:e2e` | 10 passed: 5 desktop + 5 mobile Chromium workflows |

Publishing coverage includes authorization, missing metadata/audio, source/workspace
constraints, ready state, concurrent retry deduplication, snapshot immutability,
stable GUID/time/URL, unpublish/archive/republish, protected Episode/source/representation
deletion, irreversible unused retirement, missing-object failure and recovery.
Anonymous public GET/HEAD/ranges resolve only retained ready representations.
Original asset IDs/storage keys and unpublished representations cannot resolve;
private delivery still requires authentication. Full/open/suffix/clamped/invalid
ranges and HEAD metadata/body behavior are covered. Existing CRUD, image, audio,
cover, authentication and lifecycle assertions remain in place; old generic-PATCH
publishing assertions now require the explicit validated operation.

Frontend coverage adds readiness/validation, publish, failure/retry, unpublish,
republish, stable snapshot display, unavailable media and readiness-read retries.
Browser acceptance covers Account → Show → artwork → Episode → upload/assign MP3 →
save → publish → reload/session restore → unpublish → republish, plus public HEAD,
Range and private path rejection. Prior image/audio workflows and both localhost
hostnames still pass. Desktop/mobile publishing screenshots were inspected and
have no horizontal overflow. Browser fixtures and screenshots remain ignored.

During development the new browser test filled a title before navigation completed;
waiting for the new-editor heading fixed the race. Invalid `exact` options in new
Testing Library role selectors were removed. Neither issue weakened assertions.
Playwright emits only the existing NO_COLOR/FORCE_COLOR warning. Browser coverage
is native macOS Chromium and Pixel 7 emulation, not physical devices or Safari.
Rollback checks are transactional tests, not down-migration or backup recovery.

See [Publishing architecture](PUBLISHING_ARCHITECTURE.md) for retention and future
boundaries. RSS, distribution, processing/transcoding, CDN, automated scheduling,
analytics, emergency takedown and production deployment remain unimplemented.

## Historical verification records



## Media Library Foundation — September 28, 2026

Image assets are implemented with private filesystem storage, full image decoding,
workspace-scoped APIs and nullable show/episode cover foreign keys. Prior results
below are historical; this section records the current milestone.

| Gate | Result |
| --- | --- |
| `npm run db:migrate` | Passed; migration 004 applied, final rerun applied none; four ledger rows verified. |
| `npm run db:check` | Passed; four committed migration records. |
| `npm test` | Passed; validation and media/storage test files. |
| `npm run test:integration` | 13 passed, 0 failed (parent plus 12 subtests). |
| Migration persistence/rollback | Passed within integration suite, including repaired retry and reconnect checks. |
| `npm run test:web` | 18 passed, 0 failed. |
| `npm run typecheck` | Passed. |
| `npm run format:check` | Passed. |
| `npm run build` | Passed; production bundle generated. |
| Desktop/mobile Playwright | 6 passed, 0 failed, including existing Podcast Core workflows. |

API tests cover authenticated image upload, verified MIME, corrupt/truncated and
oversized files, unsupported SVG, filename path sanitization, byte retrieval,
metadata/alt text, pagination, unauthorized reads/writes/content access, cross-workspace
cover rejection at both API and SQL layers, replacement/detachment, and referenced
asset deletion. Unit tests cover JPEG/PNG/WebP decoding, dimension limits and
filesystem key containment, collision refusal, round trips and idempotent deletion.
The populated-foundation migration test preserves legacy media metadata/artwork
keys and existing podcast identities. Migration probes verify transactional DDL
rollback and ledger persistence across new connections.

The new browser workflow runs Account → Library upload/alt text → Show cover →
Episode upload/custom cover → Reload/session restore. It then rejects referenced
delete, replaces the show cover, detaches the episode cover, verifies retained
assets, deletes an unused image, and signs in as a second creator to verify an
empty isolated library and a 404 for the first workspace. Both desktop and mobile
check horizontal overflow. Screenshots were captured in `web/test-results/` and
reviewed. Original podcast CRUD, seasons, lifecycle and both loopback hostnames
remain covered. Browser runs use temporary databases and temporary media stores.

The first browser run exposed two test assumptions: the new test navigated away
before sign-in completed, and the old test expected Media Library to be a planned
module. Waiting for the authenticated dashboard and moving the planned-module
assertion to Distribution resolved them. All six final workflows pass. Restricted
sandbox attempts to reach PostgreSQL returned EPERM; approved database runs pass.
A daemon restart interrupted result reporting; final database and browser gates
were completed afterward.

Browser command in this WSL environment:

```bash
# Retired WSL-only command; use plain npm run test:e2e on this Mac.
```

Remaining limits: previews use original image bytes scaled with CSS; no generated
variants, cloud adapter, audio processing or public delivery. Filesystem and SQL
operations are not a distributed transaction; crash/orphan recovery and coordinated
backups are documented in [Media Library architecture](MEDIA_LIBRARY_ARCHITECTURE.md).
No production deployment or cross-browser certification is claimed. Git metadata
remains unavailable in this workspace; changes are local files, not a commit.


## 2026-09-27 — Initial handoff step 1 attempt

Added `api/test/integration.test.js` and `npm run test:integration` to exercise
the real HTTP server and PostgreSQL queries. The server now exports its instance
without listening on import; running it directly still starts the API as before.
Tests bind to an ephemeral loopback port.

The suite creates a unique temporary database and runs the existing migration
runner twice. This verifies migration application and rerun behavior without
changing application data in the configured database. Cleanup closes the HTTP
server and pool and drops the temporary database, including after failures.
If the process is forcibly terminated, a `carrion_test_*` database may remain;
inspect it before removing it manually. No schema changes were made.

The tests cover signup, duplicate accounts, invalid input, password hashing,
login, hashed session storage, expiry, logout, draft CRUD, stable GUIDs,
ignored browser-supplied ownership/publishing fields, anonymous access,
cross-account isolation, editor/producer permissions, and cascading deletion.

Verification results:

- `npm ci`: passed; installed the existing locked dependencies.
- `npm test`: passed. Direct execution of the validation test file also
  confirmed all three validation tests pass.
- `node --check api/test/integration.test.js`: passed.
- Integration suite without a connection URL: fails with configuration guidance.
- Integration attempt using the example local database URL outside the sandbox:
  blocked by `ECONNREFUSED 127.0.0.1:5434`.
- Docker/Compose commands report Docker is unavailable in this WSL distro.
  PostgreSQL client tools exist, but no local server executable was found.

This initial attempt left step 1 pending. The successful follow-up below
supersedes that blocker.


## 2026-09-27 — Docker follow-up: step 1 complete

Docker is now available in WSL. The local `postgres:17-alpine` service is
healthy and exposed at `127.0.0.1:5434`. Verification used Node.js v24.21.0,
npm 11.19.0, Docker 29.8.0, and Docker Compose v5.5.1.

| Check | Result |
| --- | --- |
| `docker compose up -d --wait` | Passed; existing PostgreSQL container healthy. |
| `docker compose ps` | Confirmed healthy service and loopback port mapping. |
| `npm run db:migrate` | Passed; existing migration already applied, no new migration needed. |
| Query `schema_migrations` | Confirmed `001_foundation.sql` is recorded. |
| `npm test` | Passed; runner reported one passing test file. |
| `node api/src/validation.test.js` | All three validation tests passed individually. |
| `node --check api/test/integration.test.js` | Passed. |
| `npm run test:integration` | 10 passed, 0 failed, 0 skipped: parent test plus nine subtests. |
| Query databases matching `carrion_test_%` after the run | Zero rows; no temporary test databases remain. |

The integration run verified fresh migration application and a second no-op
run in an isolated database, database-backed HTTP health, signup and password
hashing, login and hashed sessions, draft CRUD and stable GUIDs, ownership
protection, anonymous and cross-account isolation, team editing versus owner-only
deletion, cascading deletion, session expiry, and logout. It started the real
HTTP server on an ephemeral loopback port; no separate API process on port 3010
was needed. Existing application records were not used as test fixtures.

The first attempts inside the restricted agent sandbox encountered Docker
socket permission denial and database connection `EPERM`. The approved runs
outside the sandbox passed. These were sandbox access restrictions, not a
recurrence of the earlier unavailable-Docker or connection-refused problem.
Dependencies were already installed; `npm ci` was not repeated in this follow-up.

### Repeat the verification

From the project root in WSL, with Node.js 22+ and Docker Desktop running:

```bash
[ -f .env ] || cp .env.example .env
docker compose up -d --wait
npm ci
npm run db:migrate
npm test
npm run test:integration
```

Use a local development connection in `.env`. The integration suite prefers
`TEST_DATABASE_URL` if set; otherwise it uses `DATABASE_URL`. Its database role
must be able to create databases. The suite creates and drops a unique test
database; `db:migrate` applies migrations to the configured application database.
Do not point these development commands at production.

**Handoff step 1 is complete.** The next implementation milestone is the React
creator studio. Object storage, media processing, publishing, RSS, and later
product features remain unimplemented. This result verifies the local foundation,
not production deployment, performance, or full security readiness. No API code
or schema changes were required for this follow-up.

## 2026-09-27 — Creator Studio and migration durability

### Infrastructure discrepancy resolved before frontend implementation

The manual output contained two different result sets. The query of
`public.schema_migrations` returned **one row**, `001_foundation.sql`. The
following query of `pg_database` for `carrion_test_%` returned **zero rows**, which
confirmed test cleanup. Rechecking `current_database()` and `current_schema()`
returned `carrion_network` and `public`; the ledger timestamp was
`2026-09-28 01:59:32.828526+00` (September 27 in the local Chicago timezone).
There was no missing migration record to repair.

The runner did have a misleading success-log risk: it logged “Applied” before
COMMIT. It now logs only after commit, explicitly uses `public.schema_migrations`,
prints the target database/schema/server port, and verifies the ledger against
SQL files. `npm run db:check` performs a check without applying migrations and
fails for pending/missing records or applied files missing from disk.

The expanded integration suite checks tracking from a new database connection,
original timestamps remaining stable, ordered fixture migrations `002` and `003`,
no-op reruns, rollback of both SQL effects and tracking after an intentionally
failing `004`, absence of a false success log, and successful retry after repair.
It also checks missing-file detection. Fixture migrations never touch the
application database. The production schema still has only `001_foundation.sql`.
PostgreSQL's normal transaction guarantees and Compose's persistent named volume
remain in place; this milestone does not simulate power loss or backup recovery.

### Creator Studio implementation

Added an independent React/TypeScript/Vite npm workspace under `web/`. It includes
signup/sign-in/sign-out, tab session restoration, protected routes, a responsive
application shell, dashboard counts from real shows, show and episode draft CRUD,
read-only creator profile, connection health, and clearly labeled future modules.
The frontend uses only existing endpoints. No API route or schema changes were
needed. Shared HTTP transport, typed inputs/responses, reusable forms/states, and
feature modules are documented in
[CREATOR_STUDIO_ARCHITECTURE.md](CREATOR_STUDIO_ARCHITECTURE.md).

The API client handles HTTP errors, connection failures, cancellation, timeouts,
and empty 204 responses. Session expiry removes local authentication; transient
restoration failures preserve the token for retry. Failed mutations preserve
form inputs. Delete actions require explicit confirmation and are hidden from
non-owners. Server permissions remain authoritative.

### Verification record

- Initial infrastructure gate: `db:migrate`, `db:check`, and all **11** API
  integration results passed (parent plus ten subtests).
- `npm test`: passed; `node api/src/validation.test.js` exposes the three
  individual validation cases.
- `npm run typecheck`: passed with strict TypeScript, including browser test sources.
- `npm run test:web`: **14 passed** across transport and component tests.
- `npm run build`: passed; deployable assets emitted to `web/dist`.
- Dependency installs: successful; npm reported zero known vulnerabilities.
- `npm run format:check`: passed. No lint configuration exists; strict type
  checks, formatting, tests, and production build are configured gates.
- Browser tests are configured for desktop and mobile Chromium, with a separate
  production test build, real API, and unique PostgreSQL database. Initial run
  could not launch Chromium because WSL lacks `libnspr4.so`. Browser download
  succeeded; `playwright install-deps chromium` requires interactive sudo. The
  approved fallback downloaded `libnspr4`, `libnss3`, and `libasound2t64` into
  `/tmp/carrion-browser-libs` and extracted them without changing system packages.
  With those libraries on `LD_LIBRARY_PATH`, both desktop and mobile browser
  scenarios passed against the real API and database. Test server cleanup was
  checked after the initial failure and final successful run: zero
  `carrion_test_%` databases remained.

The browser suite covers signup/sign-in, both kinds of draft create/edit/delete,
GUID stability, session reload, mobile navigation, placeholders, connection health,
sign-out, and protected browser history. It captures desktop/mobile dashboard
screenshots for visual inspection. Both screenshots were inspected. Review found
that navigation needed to reset scroll and move focus to the main content;
that was corrected, and the browser suite now also checks the scroll position.
The layouts have no horizontal overflow at the tested desktop and mobile sizes.
Browser coverage is Chromium desktop and Pixel 7 emulation, not physical-device,
Safari, or Firefox certification.

To repeat the browser run in this session without a system library install:

```bash
# Retired WSL-only command; use plain npm run test:e2e on this Mac.
```

The temporary library path is machine/session-specific and is not a project
runtime dependency. For normal future setup, run
`npx playwright install-deps chromium` with sudo in an interactive WSL terminal,
then `npm run test:e2e`. The production app itself does not require Chromium.

Final checks: the application ledger still contains only `001_foundation.sql`;
all 11 API integration results, 3 validation cases, 14 frontend tests, strict
TypeScript checks, formatting checks, production build, and both desktop/mobile
browser workflows pass. No API endpoint or application schema changes were made.
Creator Studio milestone 2 is complete within the documented draft-only scope.

## 2026-09-27 — Podcast Core Domain

This section supersedes the earlier draft-only scope and single-migration ledger.
The user manually accepted registration, login, Studio load, show creation, and
episode creation before this milestone. New domain workflows were verified
automatically; no additional human acceptance is claimed.

### Database and API

`001_foundation.sql` remains unchanged. Applied `002_podcast_domain.sql` and
`003_publication_history.sql` to the configured local application database.
`db:migrate` reports the three committed ledger entries; a subsequent run is a
no-op. `db:check` verifies all three from a separate process/connection. Existing
users receive personal workspaces and existing shows retain ownership and IDs.

The integration suite now starts with a populated foundation schema, upgrades it,
and asserts preserved episode GUID, show/workspace ownership, optional season,
and scheduled time. It also verifies persisted ledger timestamps across fresh
connections, ordered future probe migrations, rollback of both failed SQL and its
ledger row, no false success logging, repaired retry, and missing-file detection.
Probe migrations `004`–`006` exist only in disposable databases. Failure rollback
is transactional per file; this is not a down-migration or backup/restore test.

Domain coverage includes authentication, session expiry/revocation, ownership
protection, unrelated-account isolation, scoped editor/producer grants, metadata
validation, optional seasons, duplicate season numbers, cross-show rejection in
both HTTP and SQL, season CRUD, stable GUIDs, scheduling validation, publication
history across archive transitions, protected deletion, pagination, status/season
filters, sort validation, and unsafe URL rejection.

### Final gates

| Check | Result |
| --- | --- |
| `npm run db:migrate` | Passed; 3 migrations, final rerun applied none. |
| `npm run db:check` | Passed; all 3 committed migration records verified. |
| `npm test` | Passed; existing validation test file retained. |
| `npm run test:integration` | 12 passed, 0 failed (parent plus 11 subtests). |
| `npm run test:web` | 16 passed, 0 failed. |
| `npm run typecheck` | Passed. |
| `npm run format:check` | Passed; now includes all API source/test files. |
| `npm run build` | Passed; production bundle generated. |
| Desktop/mobile Playwright | 4 passed, 0 failed. |

Browser workflows exercise Account → Show → Season → Episode, episode type and
number, persisted season association, schedule/cancel, detaching the season,
GUID stability, edit/delete, reload restoration, navigation, logout, and protected
history. API tests independently create an episode without any season. Both
`localhost` and `127.0.0.1` are exercised in desktop and mobile browsers against
the same-origin `/api` proxy, using a real API and disposable PostgreSQL database.
The API's exact-origin CORS policy remains unchanged for explicit cross-origin
clients. Session storage remains origin-specific.

The first sandbox attempts could not access local PostgreSQL (`EPERM`); approved
runs passed. Chromium still needs the previously documented WSL libraries. The
successful browser command was:

```bash
# Retired WSL-only command; use plain npm run test:e2e on this Mac.
```

An initial browser test used an exact text-label selector for a select whose label
contained option text. Switching to its accessible combobox role/name fixed the
test; both complete workflows pass. Browser coverage remains desktop Chromium
and Pixel 7 emulation, not physical-device/Safari/Firefox certification.

### Scope and remaining limitations

Published/scheduled statuses are editorial state only. There is no background
scheduler, public RSS, media readiness check, audio upload, asset selection,
distribution, analytics, or monetization in this milestone. Studio explains this.
Media attachment, RSS identity, future team grants, and distribution separation
are documented in [PODCAST_DOMAIN.md](PODCAST_DOMAIN.md). Collections currently
load all API pages for Studio lists; incremental rendering is a future scale task.
No new packages were needed. The environment does not expose usable Git metadata,
so verification is against the files in the shared workspace, not a commit diff.

## 2026-09-28 — Podcast Audio Foundation

Migration `005_episode_audio.sql` is applied to the local database; a subsequent
`db:migrate` is a no-op and `db:check` verifies all five ledger entries. Migrations
001–004 remain unchanged. Integration verification upgrades a populated 004 schema
and compares the existing image row and Episode cover relationship before/after
005. Separate connections verify ledger durability; disposable probe migrations
006–008 verify ordering, rollback of SQL and ledger, repaired retry and missing-file
detection. This is transactional failure testing, not backup/power-loss recovery.

| Gate | Result |
| --- | --- |
| `npm run db:migrate` | Passed; 005 applied, final rerun no-op |
| `npm run db:check` | Passed; five migrations verified |
| `npm test` | Passed; three test files, including MP3 validation/ranges and existing images |
| `npm run test:integration` | 14 passed, zero failures/skips (parent plus 13 subtests) |
| `npm run test:web` | 21 passed |
| `npm run typecheck` | Passed |
| `npm run format:check` | Passed |
| `npm run build` | Passed |
| Desktop/mobile Playwright | Eight passed |

Audio API checks cover valid MP3, MIME mismatch, unsupported/corrupt/empty content,
configured size enforcement with Content-Length and chunked transfer, duration,
workspace isolation, optional/assigned/replaced/detached primary audio, typed SQL
and API FK rejection, protected references, unused deletion, authorized retrieval,
and full/open/suffix/clamped/invalid HTTP ranges. Unit checks also exercise tagged
MP3, variable bitrates, MPEG-2/2.5 sample rates and malformed range numbers. Original
image validation, covers, authentication and podcast lifecycle tests remain intact.

Frontend checks cover audio upload/filter controls, metadata, preview, retry after
preview failure, upload/deletion errors, assignment, replacement and detachment.
Retry buttons explicitly use button type to avoid submitting an enclosing editor.
Browser acceptance runs Account → Library upload → HTML5 metadata load → Show →
Episode assignment → save/reload → blocked referenced deletion → upload replacement
→ retained old asset → detach → valid draft → unused deletion → account isolation.
Existing image cover and domain workflows pass on both desktop Chromium and Pixel 7
emulation, including localhost/127.0.0.1 proxy checks. Browser metadata is asserted;
audible output, physical devices, Safari and Firefox are not certified.

Commands requiring local network access ran with sandbox approval. Chromium used
the now-retired WSL library override as in
prior milestones. npm installed `mpg123-decoder` successfully and reported zero
known vulnerabilities. No FFmpeg, cloud provider or processing pipeline was added.
See [Audio architecture](AUDIO_ARCHITECTURE.md) for bounded in-memory uploads,
approximate frame duration, private blob previews, format restrictions and deferred
production/public RSS capabilities.

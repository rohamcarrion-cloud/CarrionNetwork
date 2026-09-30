# Carrion Network — Creator Studio

Carrion Network is a creator-first podcast platform with a React/TypeScript
studio and a separate Node.js/PostgreSQL API. Creators can register, sign in,
manage shows, optional seasons, and episodes, and restore their session on a tab reload.
Image files are stored privately on the filesystem; binary data is not stored in PostgreSQL.

The Creator Studio includes Dashboard, Shows, Episodes, Media Library,
Distribution, Analytics, Audience, Monetization, and Settings. Shows and Episodes
support podcast metadata, optional seasons, and editorial lifecycle management. Future modules clearly identify unavailable
capabilities; they do not display fabricated analytics or pretend to publish.
Settings displays the current creator profile and API connection health.

**Milestone 007 — RSS Feed & Public Podcast Publishing:** each Show has a stable
feed identity. Studio can enable a public RSS feed of published Episode snapshots,
with safe public artwork and existing MP3 representations. Feed publishing is
separate from directory submission. See [RSS architecture](docs/RSS_ARCHITECTURE.md)
and [verification](docs/VERIFICATION.md). This Mac is the primary environment.

## Local setup

Use Node.js **22.22+ (24 LTS recommended)**, npm, and Docker with Compose.
On macOS, run these commands natively with Docker Desktop running. No WSL browser-library environment overrides are needed.
From the project root:

```bash
[ -f .env ] || cp .env.example .env
[ -f web/.env ] || cp web/.env.example web/.env
docker compose up -d --wait
npm ci
npm run db:migrate
npm run db:check
npm run dev
```

In a second terminal in the same directory:

```bash
npm run dev:web
```

Open **http://localhost:5173** or **http://127.0.0.1:5173**. Create an account, then sign in. The API runs at
`http://localhost:3010`; PostgreSQL is bound to `127.0.0.1:5434`. Compose starts
only PostgreSQL. The root `npm run dev` and `npm start` still run only the API.

The environment files above are created only if missing:

| File       | Setting             | Purpose                                                                                                                      |
| ---------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `.env`     | `DATABASE_URL`      | API/application migration connection; keep secret.                                                                           |
| `.env`     | `MEDIA_STORAGE_DIR` | Private original and representation storage directory, default `./var/media`; back up with the database.                     |
| `.env`     | `PUBLIC_BASE_URL`   | Canonical API delivery base for RSS/artwork/enclosures; HTTPS outside loopback, include `/api` if your public proxy uses it. |
| `.env`     | `PORT`              | API port, default 3010.                                                                                                      |
| `.env`     | `WEB_ORIGIN`        | Exact allowed frontend origin, default `http://localhost:5173`.                                                              |
| `web/.env` | `VITE_API_URL`      | Public API base path, default `/api`; never include secrets.                                                                 |

Vite proxies `/api` to `http://127.0.0.1:3010`, so either frontend hostname works
without CORS configuration changes. If an existing `web/.env` sets an absolute
`VITE_API_URL`, change it to `/api` and restart Vite. For a different API port,
start Vite with `API_PROXY_TARGET=http://127.0.0.1:<port>`. Explicit cross-origin
deployments still require an exact `WEB_ORIGIN`. Browser sessions remain scoped
to their origin; switching hostnames requires signing in again. No database credentials enter the
frontend bundle. The Compose password is for local development only.

```bash
curl --fail http://localhost:3010/health
```

Expected response: `{"status":"ok"}`. Stop each dev server with Ctrl+C and
PostgreSQL with `docker compose stop`. The named `carrion_pg` volume preserves
data across container restarts; `docker compose down -v` deletes that data.

## Checks and production build

```bash
npm test
npm run test:integration
npm run typecheck
npm run format:check
npm run test:web
npm run build
# First browser-test setup; Linux may also need Playwright's OS dependencies:
npx playwright install chromium
npm run test:e2e
```

`npm run build` type-checks and generates `web/dist`. No lint task is configured;
TypeScript strict checks, Prettier formatting, frontend tests, and the build are
the current gates.
The Playwright suite builds a separate `web/dist-e2e` and tests it on desktop
and mobile Chromium against the real API with an isolated database. Ports 3011
and 5174 must be free. Both database suites prefer `TEST_DATABASE_URL`, otherwise
`DATABASE_URL`, and require a database role with `CREATEDB`. They remove their
temporary `carrion_test_*` databases; a forcibly terminated run can leave one
behind. Application data is not used as test fixtures.

For deployment, route `/api/*` through your reverse proxy to the API with `/api`
stripped, or set an absolute `VITE_API_URL` at build time with exact API CORS.
Serve `web/dist` with SPA fallback to `index.html` and keep API secrets on the server. Vite preview is for local inspection, not a production server.

## Migration tracking

`npm run db:migrate` logs the database/schema target, applies pending files, and
checks the resulting ledger. `npm run db:check` verifies the ledger without
applying SQL and fails for missing/pending migration records or missing files.

Use the same database when inspecting the ledger manually:

```bash
docker compose exec -T postgres psql -U carrion -d carrion_network \
  -c 'SELECT current_database(), current_schema();' \
  -c 'SELECT name, applied_at FROM public.schema_migrations ORDER BY name;'
```

The earlier “0 rows” result was from the separate query for leftover temporary
test databases; the ledger query returned `001_foundation.sql`. The current ledger has `001_foundation.sql`, `002_podcast_domain.sql`, and
`003_publication_history.sql`, plus `004_media_assets.sql`, `005_episode_audio.sql`, `006_publishable_media.sql` and `007_podcast_rss.sql`. New migrations start at `008_description.sql`.
Keep names zero-padded and ordered, keep applied files immutable, and never put
`BEGIN`/`COMMIT` in them. The runner owns each transaction and reports “Applied”
only after SQL and its tracking row commit together. See the regression coverage
and limitations in [VERIFICATION](docs/VERIFICATION.md).

## Try the API

```bash
curl -X POST http://localhost:3010/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"you@example.com","password":"replace-with-a-long-password","display_name":"Roham"}'

curl -X POST http://localhost:3010/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"you@example.com","password":"replace-with-a-long-password"}'
```

Copy the returned token into your local shell as `TOKEN`, then:

```bash
curl -X POST http://localhost:3010/shows \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"title":"BusinessMind with Roham Carrion","description":"Business, building, and leadership."}'

curl -H "Authorization: Bearer $TOKEN" http://localhost:3010/shows
```

Use the returned show ID at `POST /shows/:id/episodes` with a JSON `title` and
optional `description`. `GET /shows/:id/episodes` lists episodes with pagination and optional status/season filters. `PATCH` and
`DELETE` operate on `/shows/:id` and `/episodes/:id`; `GET /auth/me` and
`POST /auth/logout` complete the basic account flow. Show owners and team
members can edit; only owners can delete. Team membership is in the schema but
invitations and role management are not exposed yet.

## Architecture and next milestone

- `api/`: authentication, authorization, SQL migrations, and podcast domain API.
- `web/src/api/`: typed contracts and the shared HTTP client; all fetch calls live here.
- `web/src/auth/`: session restoration, authentication forms, and auth context.
- `web/src/components/`: responsive shell, common states, and podcast forms.
- `web/src/features/`: dashboard, shows, episodes, settings, and future module pages.
- `web/e2e/`: isolated real-API browser verification.

Browser sessions use the existing bearer-token API. Tokens stay in memory and
`sessionStorage`, allowing reload restoration within the tab; there is no
cross-tab persistent login. Protected routes validate `/auth/me` before showing
creator data. A 401 clears the session; connection failures keep it and offer
retry. The API remains the authority for access permissions. See
[Creator Studio architecture](docs/CREATOR_STUDIO_ARCHITECTURE.md) for tradeoffs
and the exact backend work required next.

The core model and API are specified in [Podcast Domain](docs/PODCAST_DOMAIN.md).
Use `POST /shows/:id/seasons` with `{ "title": "Season one", "season_number": 1 }`
to create an optional season. Episodes accept `season_id` or null, type, number,
explicit override, status, and `publish_at`. Shows support podcast metadata.
Only never-published drafts can be deleted; shows containing episodes must be
archived or emptied first. Scheduling records editorial intent and runs no background job. Episode publication
uses `POST /episodes/:id/publish`, with saved podcast metadata and valid MP3 audio.
Unpublish archives the Episode and preserves existing media URLs; Republish restores
the first snapshot. Later Episode edits do not overwrite that snapshot.

Media Library supports private JPEG/PNG/WebP and MP3 uploads, filtered/paginated browsing, previews,
alt text and safe deletion. Shows and episodes select reusable workspace images;
removing a cover preserves the asset. Image uploads are limited to 10 MiB, 10,000 pixels
per side and 40 megapixels. Open Media Library to upload, then choose the image
in the show or episode editor and save. See [Media Library architecture](docs/MEDIA_LIBRARY_ARCHITECTURE.md)
for API examples, storage/backup requirements, legacy data migration and future variants.
Episodes optionally select one primary workspace audio asset. Upload or choose MP3
in the Episode audio section, then save. Replacement/detachment preserve originals;
referenced audio cannot be deleted. MP3 defaults to 100 MiB, configurable via
`AUDIO_MAX_UPLOAD_BYTES`. Original private bytes use the same filesystem adapter
and authenticated delivery with single HTTP byte-range support. Studio downloads
previews on demand into temporary blob URLs. See [Audio architecture](docs/AUDIO_ARCHITECTURE.md)
for format restrictions, metadata, resource limits and private/public boundaries.
The Episode editor displays publishing readiness, validation errors and publication
state. Add Show author/category/description, Episode description, attach MP3, save,
then Publish. `GET /episodes/:id/publication` reports readiness; public URLs resolve
only explicitly published representations.
To enable RSS, add a Show website URL, a supported top-level podcast category, and
square RGB JPEG/PNG Show artwork (1400–3000 pixels, no transparency). Save, then
use **Enable RSS** in the Show's RSS publishing section. Copy/View Feed exposes
`PUBLIC_BASE_URL/feeds/:stable-UUID.xml`. Empty feeds are allowed. Episode Publish,
Unpublish and Republish automatically update inclusion; GUID and enclosure identity
remain stable. Optional unsuitable Episode artwork is omitted with a warning.
Archiving the Show hides its feed; existing media URLs remain available.

Audio processing, automatic scheduling, directory submission, analytics and
monetization remain future milestones. No Apple or Spotify API is integrated.

The Horizons material in `docs/` supplies brand and product reference only.
The studio reuses its dark violet/lavender palette with a new architecture;
PocketBase and the old exported database are not dependencies.

This local milestone does not establish public-signup readiness. Email
verification, rate limiting, password reset, deployment security, observability,
and backup/restore procedures remain future work.

## Troubleshooting and project records

Docker Desktop on macOS supplies PostgreSQL. If Docker becomes unavailable, start
Docker Desktop. Use `docker compose ps` and
`docker compose logs postgres` to inspect health. Connection refusal usually
means a stopped database or incorrect URL/port. Docker socket permission errors
or `EPERM` in a restricted agent sandbox may require approved execution outside
that sandbox. Browser connection errors can also indicate a mismatched
`VITE_API_URL`/`WEB_ORIGIN` pair.

See [VERIFICATION](docs/VERIFICATION.md) for recorded results and
[JESSY_HANDOFF](docs/JESSY_HANDOFF.md) for the implementation sequence.

## Production foundation — Milestone 008A.1

Production is designed for one Hostinger VPS using Caddy, the built Creator Studio,
Node API and private PostgreSQL. No deployment or VPS configuration occurs here.
Start with the [security baseline](docs/security/SECURITY_BASELINE.md),
[deployment artifacts](deploy/README.md), and the human-reviewed
[008A.2 bootstrap runbook](docs/security/VPS_BOOTSTRAP.md).
Application launch gaps and recovery acceptance are explicit in the
[deployment checklist](docs/security/DEPLOYMENT_CHECKLIST.md).

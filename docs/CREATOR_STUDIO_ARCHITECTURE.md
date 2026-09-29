# Creator Studio architecture

## Boundaries and decisions

The npm workspace `web/` owns React, TypeScript, Vite, routing, and browser tests.
The existing root API scripts and PostgreSQL schema remain independent. A single
root lockfile pins both workspaces. Vite compiles browser assets only; it never
imports API modules or server secrets. The default public `VITE_API_URL` is `/api`; Vite development/preview proxy it to
loopback API port 3010 (overridable with `API_PROXY_TARGET`). Both local hostnames
work without CORS. Explicit cross-origin builds use the API's exact `WEB_ORIGIN`.

React Router supplies nested protected routes and a common responsive shell.
Direct URLs require the static host to fall back to `index.html`. The sidebar
becomes a toggled navigation panel on smaller viewports. Native labels, keyboard
focus styles, a skip link, status/alert regions, and reduced-motion styles are
included. System fonts avoid a runtime dependency on external font services;
the palette and geometric accents derive from `brand-reference.css`.

`src/api/types.ts` describes the API response and podcast input contracts.
`src/api/client.ts` is the only browser fetch layer. It applies bearer tokens,
JSON handling, a 15-second timeout, cancellation, and normalized API/network
errors. Feature components call named client methods instead of constructing
URLs. The lightweight `useResource` hook cancels abandoned reads and suppresses
stale results. Route changes refetch data and mutations reload affected views;
there is no optimistic cache to reconcile at this scale. Forms retain inputs on
failure, disable duplicate submissions, and expose save/deletion feedback.

## Authentication and authorization

Registration and login are separate backend operations. Successful registration
leads to sign-in with a success message; it does not pretend to create a session.
The auth provider holds the authenticated profile and restores the tab's token
from `sessionStorage`, validating `/auth/me`. Network/server failures offer retry
without discarding a valid token. An authenticated 401 clears local auth and
redirects to sign-in with an internal return path. Login credential failures do
not invoke the session-expiry handler. Sign-out revokes the server session first;
on connection failure the UI retains the session and offers sign-out again.

A token is readable by same-origin JavaScript. This is a deliberate compatibility
choice for the existing bearer API, not a claim of production authentication
hardening. Session storage is tab-scoped; closing a tab does not revoke the
server session, which still expires according to the API's 14-day policy.
If storage is blocked, the session works only in memory. A future secure,
HttpOnly cookie design requires coordinated API/CORS/CSRF changes. No password
or profile is persisted in browser storage. Authorization remains on the server;
the UI hides deletion from non-owners but does not treat that as a security check.

## Existing endpoint mapping

| Studio flow | Existing API |
| --- | --- |
| Sign up / sign in | `POST /auth/register`, `POST /auth/login` |
| Restore profile / sign out | `GET /auth/me`, `POST /auth/logout` |
| Dashboard and shows list | `GET /shows` |
| Create / view / edit / delete show | `POST /shows`, `GET/PATCH/DELETE /shows/:id` |
| List / create episode in a show | `GET/POST /shows/:id/episodes` |
| View / edit / delete episode | `GET/PATCH/DELETE /episodes/:id` |
| Connectivity in settings | `GET /health` |

The Episodes navigation lists shows first and loads episodes for the selected
show. There is no invented global `GET /episodes` endpoint. Dashboard counts are
computed from the actual accessible shows: total shows, show drafts, and shared
shows. No listen counts, revenue, delivery claims, or simulated data are manufactured. Owners and team members can edit; owners alone can delete.
The editor checks that an episode belongs to its URL's show. GUIDs are displayed
read-only and never sent as draft input. Podcast inputs include metadata, optional season association, and editorial status.
The API validates lifecycle changes; ownership, GUIDs, and publication history
remain server-controlled.

## Podcast domain and future boundaries

[Podcast Core Domain](PODCAST_DOMAIN.md) is the authoritative specification for
workspaces, metadata, lifecycle, deletion, API pagination/filtering, media
attachments, RSS identity, and distribution boundaries. `PodcastForm` exposes
common controls and puts secondary metadata in a disclosure. `Seasons` supports
optional season creation and empty-season removal; episodes can remain unseasoned.
The API also supports season editing. Status filters help separate active work
from archives. Collections are fetched in bounded API pages; incremental rendering
for very large libraries remains a scaling improvement.

`002_podcast_domain.sql` and `003_publication_history.sql` extend the foundation
without editing `001`. Registration atomically creates a personal workspace.
Existing show-member permissions remain scoped to that show's children. Workspace
teams/invitations are future work; no broad workspace grants are inferred from a
show membership.

[Media Library](MEDIA_LIBRARY_ARCHITECTURE.md) now provides workspace-scoped image
uploads and reusable cover selection. Nullable composite foreign keys protect
show/episode artwork and workspace identity. A filesystem adapter stores bytes;
Studio previews fetch authenticated blobs and revoke their object URLs. The
shared picker supports existing assets, upload, replacement and detachment.
Library browsing renders 24 assets per page; original images are CSS-scaled.
No blobs belong in domain records. RSS, delivery jobs, destination state, transcript and
chapter resources, analytics, and monetization remain separate future features.

## Migration guarantees and limits

The runner holds a PostgreSQL session advisory lock, selects the `public` schema,
orders SQL filenames, and commits each migration's SQL and ledger row in one
transaction. “Applied” is printed after COMMIT. `db:check` does not apply pending
SQL and fails when files and tracking rows differ. Target logging names the
database/schema and server-side port (5432 inside Docker, mapped to host 5434),
without exposing connection credentials.

Regression tests use independent connections to verify committed tracking and
unchanged timestamps, ordered future migrations, no-op reruns, failed migration
rollback, no false success message, and corrected migration retry. The Compose
named volume supplies database persistence. These checks are not a backup/restore
or power-loss durability test, and the ledger does not checksum already-applied
SQL. Keep applied migration files immutable, add new numbered files for changes,
and avoid transaction-control or nontransactional commands in migration SQL.

## Verification tools

Strict TypeScript checks and the Vite build cover source and browser tests.
Vitest/Testing Library cover transport, authentication, route protection, drafts,
permissions, empty states, and failure/retry behavior. Playwright exercises a
production browser bundle against a real API and isolated PostgreSQL database
on desktop and mobile Chromium, saving dashboard screenshots in ignored test
results. Existing API validation/integration tests remain separate gates.

Framework references: [Vite setup](https://vite.dev/guide/) and
[React Router declarative routing](https://reactrouter.com/start/declarative/routing).

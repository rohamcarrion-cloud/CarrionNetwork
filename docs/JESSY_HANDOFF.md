# Carrion Network handoff

## Current milestone: 007 — RSS Feed & Public Podcast Publishing

The manually accepted Creator Studio baseline (registration, login, show and
episode creation) has evolved into a workspace/show/optional-season/episode model.
Read [README](../README.md), [Podcast Domain](PODCAST_DOMAIN.md), and
[Creator Studio architecture](CREATOR_STUDIO_ARCHITECTURE.md) before extending it.
The Horizons export remains design reference only.

Start PostgreSQL, run `npm run db:migrate` and `npm run db:check`, then run
`npm run dev` and `npm run dev:web` in separate terminals. Both localhost:5173 and
127.0.0.1:5173 work through `/api`. Update any old `web/.env` absolute API URL to
`VITE_API_URL=/api`. Sessions are origin-scoped, so changing hostname requires login.

## Implemented

- Personal workspaces created atomically with accounts, existing data backfilled.
- Show podcast metadata, scoped slugs, editorial statuses, timestamps.
- Optional seasons with same-show relational integrity and CRUD API.
- Episode types, numbering, explicit inheritance, season association, release time.
- Lifecycle validation and durable first-publication history; published records
  cannot cycle through archive to become deletable drafts.
- Authenticated, scoped CRUD; safe deletion; paginated/filterable/sortable lists.
- Studio show/episode editors, lifecycle controls, optional season management,
  show selection, status filters, and API error handling.
- Migrations `002_podcast_domain.sql` and `003_publication_history.sql`; `001`
  remains untouched. `004_media_assets.sql` adds the Media Library; `005_episode_audio.sql` adds audio; `006_publishable_media.sql` adds representations and snapshots; `007_podcast_rss.sql` adds feeds and public artwork; future migrations begin at `008`.

See [VERIFICATION](VERIFICATION.md) for native Mac gate results. The Mac checkout
of `rohamcarrion-cloud/CarrionNetwork` is the primary environment. Start from a clean,
synchronized `main`; preserve published history. Node must satisfy package.json
(>=22.22.0). `npm ls --depth=0` verifies locked installations; use `npm ci` when
installing. Chromium runs natively using `npm run test:e2e`, without the old WSL
library override. Database/browser suites create and clean disposable databases.

Read [Publishing architecture](PUBLISHING_ARCHITECTURE.md) before changing lifecycle,
media identity or delivery. Publish validates saved metadata and MP3, atomically
creates a retained snapshot, and enables an opaque public media URL. Unpublish
archives/withdraws discovery but keeps audio links working. Republish restores the
same snapshot, GUID and URL. Metadata/audio edits do not replace published bytes.

## Media Library handoff

Read [Media Library architecture](MEDIA_LIBRARY_ARCHITECTURE.md) for endpoints,
validation, legacy preservation, deletion ordering and future preview variants.
Sharp is the new image decoder dependency (`npm ci`). Set `MEDIA_STORAGE_DIR`
if the private local default `./var/media` is unsuitable. Back up both files and
PostgreSQL. No cloud account is needed. Studio uses original images for previews.

Try Account → Media Library → Upload → Show editor → Choose cover → Save →
Episode editor → Choose optional cover → Save → Reload. Replace and remove covers;
assets remain in the library. Delete a referenced asset to see the safe rejection,
then detach all covers before deleting it. Alt text is editable in the library.
Workspace owners alone access media; show collaborators receive no implicit grant.
Existing legacy media metadata and raw artwork values are preserved for manual
import, not exposed as verified new images.

## Next boundaries

No audio processing, directory distribution, analytics, or monetization is implemented.
Separate public GET/HEAD/Range delivery is implemented for retained ready publications. A scheduled status does not start a job; published
is editorial state, not proof of delivery. Plan the next milestone explicitly.

The intended media hierarchy is workspace Media Library → show artwork, optional
episode artwork, primary episode audio, and other creator assets. Image covers now use workspace-checked composite foreign keys and a replaceable
filesystem storage adapter; add separate contracts for future asset types.
Do not store image/audio blobs on shows or episodes. Preserve episode GUIDs.

Public RSS now uses validated metadata and configured canonical URLs. Later scheduling/distribution need transactional jobs, destination state
and external retry/reconciliation semantics. Current synchronous publishing is retry-safe. Keep delivery state separate from editorial status. Workspace
membership/invitations and ownership transfer need explicit migrations and grants;
current show memberships must not silently grant workspace-wide access.

Production service hardening and backup/restore testing remain separate work;
this milestone provides the domain foundation, not a deployment certification.


## Podcast Audio Foundation — 2026-09-28

MP3 original uploads now share the Media Library and filesystem adapter with images.
Episodes have one optional, workspace/type-constrained primary audio reference.
Creators can browse/filter, upload, preview, assign, replace, detach and safely
delete unused audio. Image cover behavior remains supported.

Read [Audio architecture](AUDIO_ARCHITECTURE.md) before changing upload limits,
formats or delivery. Default audio limit is 100 MiB (`AUDIO_MAX_UPLOAD_BYTES`);
validation checks frames and decodes in a bounded worker without FFmpeg. Original
audio is private. Range-capable API delivery does not make files public; Studio
previews use authenticated downloads and temporary blob URLs.

Original assets must not be permanently coupled to public RSS enclosures. Milestone 006 now implements
separate publishable representations and public delivery; processing remains future work.
Directory distribution, processing, transcripts, chapters, analytics and monetization
remain deferred. See [Verification](VERIFICATION.md) for milestone gate results.

## RSS publishing handoff — 007

Read [RSS architecture](RSS_ARCHITECTURE.md) before extending feeds. `PUBLIC_BASE_URL`
is now operational: use your canonical HTTPS API base, with any proxy prefix.
Loopback HTTP remains supported for local development; do not use localhost URLs
for directory submission. The new Show RSS section reports readiness, reserved
stable URL, Copy/View controls and explicit Enable RSS. Saving an enabled Show
updates public channel metadata and validates its artwork. Archived Shows return
404; empty feeds are valid. No existing Show is enabled by migration.

Feed items use retained publication snapshots. New number/season/type/cover fields
are captured at publishing; existing 006 snapshots gain upgrade-time values only
for these new fields. Original snapshot values and public audio identities survive.
RSS uses a GUID-specific MP3 alias of the existing representation route so shared
bytes do not produce duplicate enclosure URLs. Private Library routes remain private.
Public artwork is explicit and retained; optional invalid Episode art is omitted
with a warning. Show artwork must meet the documented JPEG/PNG/size/RGB policy.

Current namespace scope is RSS 2.0 + iTunes + Atom self-link. ETags support 304;
unchanged polls do not change lastBuildDate. Next work should explicitly choose
between feed extensions, publication editions, directory submission or operational
hardening. Do not infer authorization for directory integrations from RSS publishing.

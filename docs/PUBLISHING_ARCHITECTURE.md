# Publishable media and publishing — Milestone 006

## Four separate concepts

| Concept | Responsibility |
| --- | --- |
| Original `media_assets` row | Private, validated creator upload, with immutable storage identity and bytes. Library and preview authorization remain unchanged. |
| Episode | Editable editorial metadata, primary original audio association, stable GUID and show/workspace identity. |
| `publishable_media` | Immutable audio representation with its own UUID, source provenance, profile, storage key, MIME, byte length and duration. |
| `episode_publications` | Retained publication snapshot, representation association, first publication time and discovery eligibility (`active`). |

Migration `006_publishable_media.sql` adds the last two tables. Migrations 001–005
are unchanged. Existing editorially published Episodes retain their timestamps and
status but receive **no automatic publication or public URL**. An authorized
creator must deliberately publish them. Existing images, originals and cover/audio
relationships survive the upgrade.

The synchronous `original-mp3-v1` profile references the validated original's
write-once object. There is no byte copy or transcoding. This is an explicit choice
of equivalent bytes, not a permanent identity coupling: representation UUID,
storage key and enclosure metadata are independent columns. Future profiles can
point at different processed objects from the same original. `(source, profile)`
is unique for safe retries. Multiple Episodes may deliberately publish the same
representation. It stays accessible while its retained publication history exists.

Readiness is separate from editorial status. Representations have `ready` and
`retired` states; unused pending/failed job states are not invented. The API reports
`ready:false` plus actionable issues when metadata, original, representation or
storage is unavailable. A ready database row is not a promise of perpetual storage
availability. Current filesystem checks verify size; they do not continuously
re-decode or checksum stored audio. Upload validation remains authoritative, and
out-of-band changes to files are unsupported.

## Operations and validation

- `GET /episodes/:id/publication`: authenticated `{publication, ready, issues}`.
- `POST /episodes/:id/publish`: authenticated explicit operation; returns the same
  fields plus `episode`. No request body is required.
- `POST /episodes/:id/unpublish`: authenticated, repeatable withdrawal/archive.

Show owners and existing scoped editor/producer members can perform these
operations, consistent with existing editorial permissions. This grants no access
to unrelated workspaces or private Library browsing. First publishing requires a
valid same-workspace Show; nonempty Show title, description, author, language and
category; Episode title and description; and a ready, validated MP3 primary asset
whose stored byte length matches. Category is still free text, not directory
certification. Artwork, website, season and episode numbers are optional in this
foundation. Feed/directory-specific validation is future work.

The publishing transaction locks the Episode and reads locked Show/original
metadata, resolves or creates the representation, inserts its snapshot and changes
editorial status together. An Episode row lock serializes duplicate/concurrent
requests. A unique source/profile key also deduplicates representation creation
across Episodes. Errors roll back all SQL effects. Publishing never writes or
removes files. Failures return 422 with `{error, code: 'publication_not_ready',
issues: [{field,message}]}`; inaccessible resources return 404 and unauthenticated
requests 401. Existing CRUD errors remain compatible.

Generic Episode creation/PATCH cannot transition into published. An already
published Episode remains editable. Explicit Publish means publish **now**,
including a previously scheduled Episode. Scheduling retains its existing future
time validation but runs no background job.

## Snapshot and lifecycle decisions

The first snapshot captures GUID, Episode title, description, resolved explicit
flag, first publication timestamp and representation reference. Enclosure MIME,
length and duration are immutable on the representation. Milestone 007 extends this same snapshot with number, season number, episode type
and optional artwork source. Channel metadata stays live. See [RSS architecture](RSS_ARCHITECTURE.md)
for upgrade-time backfill and public artwork policy.

| Action | Editorial state | Publication | Existing media URL |
| --- | --- | --- | --- |
| First Publish | published | Snapshot created, active | Enabled |
| Publish retry | published | Same snapshot and identity | Same URL |
| Unpublish | archived | Retained, inactive | Still enabled |
| Archive via PATCH | archived | Retained, inactive | Still enabled |
| Republish | published | Original snapshot active again | Same URL |
| Edit metadata/audio | unchanged | Original snapshot unchanged | Same URL/bytes |

Republish restores the **retained snapshot**, not unsaved or later edited draft
values. Studio explicitly explains this. Publishing corrected editions or audio
replacements is deliberately deferred; it requires a version/edition policy and
an explicit operation. It must not silently mutate a previously delivered URL.
The GUID and first-publication time remain stable across all transitions.

Unpublishing disables future discovery (`active=false`) but cannot recall downloads
and does not break existing podcast-client media links. Milestone 007 exposes explicitly enabled Show RSS feeds with active published
Episodes only; archived Shows return 404. Show archival currently remains an editorial
operation and does not revoke audio. Emergency takedown/revocation is a separate,
not-yet-implemented operation, not an accidental side effect of unpublishing.

Only never-published drafts can be deleted. Publication snapshots cannot be deleted
or changed (except active/updated_at). Composite foreign keys enforce workspace
and audio type; published representation references require state `ready` even
when inactive. Consequently historical representations cannot be retired/deleted,
and source assets remain protected even after detaching current Episode audio.
Unreferenced representations may be retired; retirement is irreversible and must
precede deletion. There is no creator-facing representation deletion endpoint.
Removing such a row never implies deleting its potentially shared storage object.

## Public delivery boundary

`GET /public/media/:representationUUID` and `HEAD` are separate from Studio's
bearer-authenticated `/workspaces/:workspace/media/:asset/content`. The opaque
UUID is stable and unguessable. Resolution requires a ready representation with
at least one retained publication. An arbitrary Library asset ID, original storage
key, unreferenced representation or unknown UUID yields no public bytes. Neither
filenames nor filesystem paths are returned. Publication responses omit storage keys.

GET returns verified `audio/mpeg`, Content-Length, Accept-Ranges, nosniff and a
restrictive CSP. Single normal/open/suffix byte ranges return 206; invalid, multiple
or unsatisfiable ranges return 416 with `Content-Range: bytes */size`. HEAD returns
full metadata and no body (Range is ignored for HEAD). Missing stored media yields
503 without removing history. Streams are bounded by requested offsets and client
abort/error handling closes the stream. Multipart ranges and If-Range are deferred.
Public responses currently use `no-store`; private delivery keeps `private, no-store`.

The API supplies an API-relative path, not a filesystem path. Local Vite exposes
it as `/api/public/media/:id`. A deployment must retain its API mount. RSS now uses configured `PUBLIC_BASE_URL`
with HTTPS outside loopback, never an untrusted Host header. No directory is mounted as static public storage.

## Future insertion points and limits

- Processing jobs can own pending/running/failure/retry state and emit a new
  profile/representation after normalization or transcoding. Episode GUID remains
  unchanged. A profile identifies a reproducible output recipe/version.
- The storage adapter (`put`, `get`, `stream`, `stat`, `delete`) can move to object
  storage; provider Range reads and metadata checks replace local file operations.
  A storage migration must preserve representation bytes and stable delivery IDs.
- A CDN can front the public resolver with an explicit cache/takedown policy.
  The current no-store policy makes no CDN invalidation promises.
- RSS now consumes active publication snapshots and immutable enclosure metadata
  with explicit Show opt-in, canonical URLs and feed validation. Distribution
  submissions/jobs and external outcomes belong outside Episode editorial status.
- Analytics can key events to Episode GUID/publication and representation, without
  logging Studio bearer tokens or changing identities for retries.

No processing queue, transcoding, normalization, automatic scheduler,
directory integration, CDN, analytics or emergency media takedown is implemented.
RSS and explicit public artwork are implemented in Milestone 007.
Backups must preserve SQL and storage together. Operational recovery from missing
or tampered files, public-service rate limits and production deployment hardening
remain separate work. Chromium verification is native macOS desktop and mobile
emulation, not physical iOS/Safari or Firefox certification.

## RSS integration — 007

Feed generation consumes these retained publication rows; it does not publish
Episodes independently. The original media URL remains valid. RSS adds the alias
`/public/media/:representationUUID/:episodeGUID.mp3`, checked against the existing
publication relationship, so each item has a stable, distinct enclosure URL even
when bytes are shared. Enabled-feed publication prepares suitable Episode artwork
within the same SQL transaction. Unpublish changes current feed inclusion and
preserves both enclosure aliases. See [RSS architecture](RSS_ARCHITECTURE.md).

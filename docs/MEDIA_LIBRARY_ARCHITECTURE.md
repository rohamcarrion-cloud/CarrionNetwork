# Media Library — Images and Audio

## Boundaries

The library supports reusable, private JPEG, PNG and WebP still images and MP3 audio.
See [Audio architecture](AUDIO_ARCHITECTURE.md) for migration 005, format validation,
limits, typed Episode relationships and future public delivery boundaries.
No audio processing, transcoding, RSS enclosures, distribution, analytics or
monetization is implemented. There is no cloud-provider requirement.

`api/src/media.js` owns upload validation, asset metadata and deletion policy.
`api/src/storage.js` implements the asynchronous `put(key, bytes)`, `get(key)`,
`stream(key, {start,end}?)` and `delete(key)` contract using a private filesystem directory. Replace this adapter
with S3-compatible storage, R2 or B2 without changing show/episode business logic.
The storage key is opaque, server-generated and independent of the filename.
`MEDIA_STORAGE_DIR` defaults to `./var/media` relative to the API working directory.
It must be private to the service, outside the static web root, and backed up
alongside PostgreSQL. The adapter creates directories/files with restrictive
permissions and refuses keys outside its UUID-shaped namespace.

## Data and migration

`004_media_assets.sql` upgrades the foundation's unused media placeholder.
Existing rows retain their IDs, storage keys, MIME, size, state and timestamps;
their owner becomes their personal workspace, and their type becomes `legacy`.
They are not listed as verified images. Existing raw show artwork keys are retained
in `legacy_show_artwork` for manual import; the `shows.artwork_key` column is removed.
No legacy bytes are assumed to exist in the new store or silently certified as images.
Previous migrations remain unchanged.

Assets have workspace, type, original filename, storage key, verified MIME,
byte size, dimensions, alt text and timestamps. `asset_type` is extensible text;
future transcripts, documents and promotional assets can add their own
validation and workflows. Uploads create verified `image` or `audio` records. Audio adds duration; dimensions remain null.

Shows and episodes have nullable `cover_asset_id`. Composite foreign keys enforce
workspace and image type, not only asset existence. Episodes additionally carry
workspace IDs constrained to their parent show. Indexes support scoped browsing
and cover reference checks. A missing episode cover represents future show-cover
fallback; no duplicate record is created. Replacing/detaching/deleting a podcast
record never deletes the image. Archived records also retain their references.

## HTTP contract

All routes require a valid bearer session and ownership of the named workspace.
Show membership does not grant workspace media permissions. Workspace invitations
and expanded media grants remain future work. A creator's current personal
workspace ID equals their user ID; the Studio uses that mapping.

| Method and path | Body / result |
| --- | --- |
| `POST /workspaces/:workspace/media?filename=cover.png` | Raw image/MP3 bytes; matching MIME Content-Type; returns `{asset}` (201) |
| `GET /workspaces/:workspace/media` | `{items,pagination}`; `type=all`, `type=image` or `type=audio`; default all |
| `GET /workspaces/:workspace/media/:id` | `{asset}` metadata |
| `PATCH /workspaces/:workspace/media/:id` | JSON `{alt_text}`; up to 2,000 characters |
| `GET /workspaces/:workspace/media/:id/content` | Private authenticated original bytes; single HTTP Range support |
| `DELETE /workspaces/:workspace/media/:id` | 204; 409 if referenced by a show, episode or publishable representation |

List supports limit 1–100 (default 24), nonnegative offset, sort `created_at`,
`original_filename` or `size_bytes`, and direction `asc`/`desc` (default `desc`).
ID breaks sorting ties. Offset pagination is practical for this first version;
concurrent inserts may shift pages. Podcast create/update accepts `cover_asset_id`
as an image UUID or null. Missing fields leave existing relationships unchanged.

## Validation and failure behavior

Image uploads are bounded to 10 MiB while reading, regardless of Content-Length.
Sharp/libvips detects format and fully decodes pixels, rather than trusting a
filename or header. Declared MIME must match detected JPEG/PNG/WebP. Images must
be nonempty, at most 10,000 pixels per side and 40 million pixels total; animated,
corrupt, unsupported and truncated inputs are rejected. Filename paths and control
characters are removed for display only; filenames never determine storage paths.

Files are written before inserting their metadata; failed inserts clean up the
file. Deletion removes metadata first, under PostgreSQL FK protection, then bytes.
Concurrent attachment/deletion is serialized by database foreign-key locks. A
failed file removal is logged with its opaque key and leaves an inaccessible
orphan, not a referenced asset with missing bytes. Process crashes can also leave
orphans between database/filesystem operations. A future reconciliation job can
compare store keys to metadata; this milestone does not claim atomic transactions
across PostgreSQL and storage. Backups/restores must include both.

Content is never exposed as a public directory or bearer token in a URL. Responses
use private/no-store caching, nosniff and a restrictive CSP. Studio retrieves bytes
through its authenticated API client and revokes object URLs on unmount/change.
Two concurrent uploads are allowed per API process. Global quotas, request rate
limiting and production operational hardening remain future work. MP3 has its own
configurable limit; see the audio document.

## Studio and future variants

`web/src/features/Media.tsx` provides library cards, upload, pagination, sorting,
preview, dimensions, size/date, alt text editing, deletion confirmation and the
shared cover picker. Show and episode forms reuse that picker for existing assets
or direct upload. Save the podcast form to persist the selected relationship.
Uploads themselves are retained even if the form is canceled.

The Studio currently displays the original image scaled with CSS. This avoids a
new processing pipeline but can download up to 10 MiB per card. Future bounded
preview generation, EXIF orientation normalization, cropping and responsive
variants belong beside `validateImage` in the media service, with variant keys
stored separately and delivered through the same authorized storage boundary.
Show/Episode business logic should continue referencing the parent asset only.

## Publication retention — Milestone 006

Private Library originals remain distinct from `publishable_media` and publication
snapshots. Source provenance foreign keys prevent deleting an original retained by
a representation even after an Episode detaches it. Storage identity and original
bytes are immutable; alt text remains editable. Initial MP3 representations share
the write-once original object but have independent UUIDs and enclosure metadata.
Public delivery requires a ready representation with retained publication history;
arbitrary Library IDs and original storage keys cannot resolve publicly. See
[Publishing architecture](PUBLISHING_ARCHITECTURE.md). Never garbage-collect an
object solely because one reference disappeared; check original and representation
references. There is no automatic representation/object garbage collection today.

## Public RSS artwork — 007

Enabling a Show feed or saving/publishing into an enabled feed can create explicit
`public_artwork` representations for suitable selected images. The independent
UUID and matching `.png`/`.jpg` URL expose only that representation. There is no
public Library listing or original-content bypass. Existing artwork URLs and source
references remain protected after replacement or archival. No new Library records
or image conversions are created. See [RSS architecture](RSS_ARCHITECTURE.md).

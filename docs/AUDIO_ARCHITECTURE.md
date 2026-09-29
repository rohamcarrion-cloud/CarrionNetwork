# Podcast Audio Foundation

## Original assets and episode relationships

Migration `005_episode_audio.sql` extends `media_assets` with `duration_seconds`
and an audio metadata constraint. Audio reuses workspace, original filename,
opaque storage key, MIME, byte size, state and timestamps. No binary data lives in
PostgreSQL. Images and legacy records are preserved; migrations 001–004 are unchanged.

`episodes.primary_audio_asset_id` is nullable. Its composite foreign key includes
workspace and a generated constant `audio` type; both SQL and API reject images
and assets from another workspace. Draft creation needs no audio. Missing update
fields preserve assignments; null detaches. Replacement/detachment never deletes
assets. Referenced assets, including archived episodes' audio, return 409 on delete.
Database FK locking protects concurrent assignment versus deletion.

Foundation `audio_key`, `audio_bytes` and `audio_mime` fields remain untouched for
legacy compatibility; they are not editable, imported, or used by the new delivery
path. New audio resolves exclusively through the primary asset relationship.

## Supported format and validation

Only MP3 with declared `Content-Type: audio/mpeg` is supported. Filename extensions
are not evidence. MPEG-1/2/2.5 Layer III CBR/VBR streams are accepted with standard
indexed bitrates, a consistent sample rate/channel count, and at least two frames.
Free-format streams, Layer I/II, concatenated streams with changing parameters,
APE tags, WAV, AAC/M4A, Ogg and other formats are deliberately unsupported.
Optional leading ID3v2 (2/3/4) and trailing ID3v1 tags are bounded and skipped;
tag contents are not extracted or certified. Unknown trailing bytes are rejected.

A complete frame walk rejects broken headers, incomplete frames and non-audio
payloads. `mpg123-decoder` decodes frames in an isolated Node worker; reported
decode errors and streams yielding no samples are rejected. This is validation,
not transcoding: PCM is discarded and the original bytes are stored unchanged.
The decoder is a small WASM dependency, with no FFmpeg or external executable.
See the [upstream decoder documentation](https://github.com/eshaz/wasm-audio-decoders/tree/main/src/mpg123-decoder).

Duration is the sum of frame sample counts divided by sample rate, including
encoder delay/padding and any metadata frame. It is an approximate encoded-stream
duration, not a sample-accurate gapless playback duration. Bitrate, embedded artwork
and tag text are intentionally not persisted. Validation detects structural and
decoder-reported corruption; MP3 has no universal integrity checksum, so it cannot
prove that every bit matches the creator's intended recording.

Unsupported MIME returns 415, invalid content 400, and empty/oversized content 413.
Validation workers have a 120-second deadline and are terminated after completion.
Tests generate a tiny valid silent MP3 in code; no temporary recordings are committed.

## Limits and storage

`AUDIO_MAX_UPLOAD_BYTES` defaults to **104857600 (100 MiB)**, independently of the
10 MiB image limit. Set it in the API environment (`.env.example` documents it);
valid values are integer bytes from 1 through 1073741824. Restart the API after
changing deployment configuration. Both declared Content-Length and bytes actually
read are bounded. Two uploads may be active per API process; additional uploads
return 503 and can be retried. This is a local resource guard, not per-user quotas.

Uploads are currently buffered in memory, with temporary copies during validation.
Do not raise the limit without budgeting memory per active upload. The API client's
upload/content timeout is five minutes; metadata requests retain 15 seconds.
Proxy body-size limits, buffering, upload/read timeouts, concurrency across processes,
storage quotas and disk capacity need coordinated production configuration.

The existing filesystem adapter remains the only provider. `MEDIA_STORAGE_DIR`
defaults to ignored `var/media/`; filenames never become paths. Adapter operations
are `put(key, bytes)`, `get(key)`, `stream(key, {start,end}?)`, `stat(key)`, and `delete(key)`.
Byte offsets are inclusive. Delivery streams only the requested bytes, rather than
loading a podcast into API memory. S3-compatible/R2/B2 adapters can implement the
same contract with object keys and provider Range reads; domain code has no
provider-specific URLs or credentials. Backups must include database and storage.
The existing write-before-insert and metadata-before-file-delete compensation
rules remain; crashes can leave inaccessible orphan files requiring reconciliation.

## Authenticated development delivery and Studio

The existing `/workspaces/:workspace/media` routes accept images and MP3 uploads.
Listing supports `type=all|image|audio` (API default `all`); legacy assets remain
excluded. Studio starts in Images for compatibility and offers All/Images/Audio.
Audio cards show filename, MP3 type, seconds, size and upload date. Preview is
explicitly requested so browsing does not download every audio file. Episode audio
and cover pickers are separate and type-filtered. Upload-and-select retains the
asset even if the form is canceled; save persists the episode relationship.

Content routes require bearer authentication and workspace ownership on every
request, including Range requests. Tokens are never put in URLs. Unauthenticated
requests return 401 and unrelated accounts receive 404. The response uses verified
MIME, private/no-store caching and nosniff. Single `bytes=start-end`, open-ended and
suffix ranges return 206 with Content-Range, Content-Length and Accept-Ranges.
Malformed, multiple and unsatisfiable ranges return 416 with `bytes */size`.
Full requests return 200. Multipart ranges and conditional If-Range are not supported.

Because native audio controls cannot attach the current bearer header, Studio
fetches the full asset on demand and creates a temporary blob URL. HTML5 playback
and seeking then occur locally; the Studio player does not itself use HTTP Range.
URLs are revoked and in-flight requests canceled on unmount/change. Preview incurs
browser memory/download cost proportional to file size. The authenticated endpoint's
Range support is independently exercised by integration tests.

## Publishable boundary — Milestone 006

Original → Episode → explicit Publish → publishable representation → public delivery.

`publishable_media` snapshots the MP3 storage identity and enclosure metadata,
initially using the original write-once object. `episode_publications` retains the
first published Episode values and representation. Both have identities separate
from editable original association and Episode metadata. The original remains
private through Studio routes. Explicitly published representations alone resolve
through `/public/media/:id` with GET, HEAD and byte ranges.

See [Publishing architecture](PUBLISHING_ARCHITECTURE.md) for validation, concurrency,
retention, unpublish/republish semantics and future processing/CDN/RSS insertion
points. Detaching or changing current primary audio cannot change published audio
or allow deletion of its source. Republish restores the retained snapshot.

Direct-to-object-storage and resumable uploads should use staged/untrusted objects,
a finalize/validation step and authorization before making assets selectable.
Neither is implemented here. Also deferred: RSS generation, directory distribution,
Spotify/Apple integrations, transcoding, waveform generation, normalization,
transcription, chapters, analytics and monetization.

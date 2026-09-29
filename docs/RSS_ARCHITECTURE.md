# RSS feed and public podcast publishing — Milestone 007

## Standards reviewed on September 28, 2026

This milestone implements RSS 2.0, the iTunes podcast namespace
(`http://www.itunes.com/dtds/podcast-1.0.dtd`) and an Atom self-link
(`http://www.w3.org/2005/Atom`). It emits UTF-8 XML with escaped plain-text metadata,
not creator-supplied XML or HTML. Channel title, description and website link are
required by the [RSS 2.0 specification](https://www.rssboard.org/rss-specification).
The generator includes optional language, copyright, category, image,
lastBuildDate and generator fields.

Apple's [RSS requirements](https://podcasters.apple.com/support/823-podcast-requirements)
call for stable GUIDs, public media, HEAD/Range support and enclosure URL/byte-length/
MIME attributes. Duplicate enclosure URLs can cause Episodes to be ignored. Its
[tag guide](https://help.apple.com/itc/podcasts_connect/en.lproj/itcb54353390.html)
informs our iTunes author, explicit, type, duration, episode/season and artwork tags.
Enclosure URLs have an MP3 extension; dates use UTC RFC-style dates. The Show
description is limited to 4,000 UTF-8 bytes for this feed profile. Serial Shows
require episode numbers on their published snapshots.

Show artwork follows Apple's [Show Cover specifications](https://podcasters.apple.com/support/5514-show-cover-template):
square JPEG/PNG, 1400–3000 pixels, no alpha channel. We require RGB and preserve
original validated bytes. We support one of the 19 top-level
[Apple categories](https://podcasters.apple.com/support/1691-apple-podcasts-categories)
with exact spelling. Multiple categories and subcategories are deferred.

The [Podcasting 2.0 namespace](https://github.com/Podcastindex-org/podcast-namespace/blob/main/docs/1.0.md)
was reviewed. No `podcast:*` elements are emitted yet: transcripts, chapters,
funding, alternate enclosures and other optional extensions need their own data
contracts. This is a conservative feed profile, not certification or directory
submission. An empty RSS channel is supported locally, but Apple submission
requires at least one Episode and a publicly reachable feed.

## Data and identity

```text
Show (permanent feed UUID, live channel metadata)
  → RSS Feed
    → active Episode publication snapshot
      → immutable publishable MP3 representation
        → public enclosure delivery
```

`007_podcast_rss.sql` adds `shows.feed_id` (random UUID, unique and immutable) and
`feed_enabled` (false by default). Every existing Show gets an identity but no
Show or artwork becomes public during migration. The feed URL is:

`PUBLIC_BASE_URL/feeds/:feedUUID.xml`

It contains neither the workspace ID nor a mutable title/slug. The identifier
survives Show edits, archive/restore and process restarts. Enable/refresh is
idempotent. The deployment base is configuration, not request Host or forwarded
headers. Set `PUBLIC_BASE_URL` to the canonical API delivery base, including a
proxy prefix if needed: for example `https://podcasts.example/api`. HTTPS is
required except for loopback HTTP development. Local default is
`http://localhost:3010`; browser tests use `http://127.0.0.1:5174/api`.
Changing this setting changes absolute URLs; a production host migration requires
retaining redirects/old media URLs and a separately reviewed feed-migration plan.

The existing `episode_publications` table is extended with episode number, season
number, episode type and optional cover asset reference. New publications capture
these once with the existing snapshot. For pre-007 publications, the migration
captures those previously unsnapshotted values from the Episode at upgrade time.
It temporarily disables only the snapshot guard within its migration transaction
for this backfill, then restores it. Existing titles, descriptions, GUIDs, explicit
settings, publication timestamps, representation references and URLs remain intact.

All item values come from the publication and its immutable representation. Later
Episode edits or Season renumbering do not silently change published RSS values.
Corrected editions remain deferred. Channel metadata is deliberately live: saving
an enabled Show updates its channel after validation. Save the Show before enabling
RSS; the operation does not publish unsaved editor inputs.

## Eligibility and creator operations

Authenticated Show owners and existing scoped editor/producer members use:

| Operation | Behavior |
| --- | --- |
| `GET /shows/:id/feed` | Stable URL, enabled/ready flags, validation issues, optional-art warnings and eligible Episode count |
| `POST /shows/:id/feed` | Validate saved Show, prepare explicit artwork representations, enable RSS and set Show status published atomically |
| Existing Show archive | Public feed returns 404; retains feed identity and existing media |
| Existing Show restore to published | Revalidates saved details and restores the same enabled feed |

Enabling requires Show title, description, author, language, website URL, a
supported category, valid Show artwork and configured delivery base. A Show may
have zero published Episodes (including a drafts-only Show) and expose an empty
feed. Publishing a Show using its old editorial status selector alone does not
enable RSS: explicit opt-in protects existing private cover images.

Items require an active publication, a published Episode and a ready representation.
Drafts, scheduled Episodes, archived/unpublished Episodes and legacy editorial-only
publications do not appear. Existing Publish adds an item; Unpublish removes it;
Republish restores the same snapshot/GUID/representation. No RSS-specific Episode
publishing system or scheduler exists. Show archival returns 404 rather than an
empty channel, allowing restoration without presenting removal as item deletion.
Clients may retain previously downloaded data; neither archive nor unpublish can
recall it. We do not emit directory-removal directives.

Show saves and publishing into an enabled feed validate/prep artwork in the same
SQL transaction as their existing operations. Invalid mandatory Show metadata
rolls back the change with 422 and structured issues. Unpublish remains possible
when storage is unavailable. Public reads never perform writes or publish assets.

## Enclosure and artwork boundaries

RSS enclosures use the existing public resolver with a stable alias:

`/public/media/:representationUUID/:episodeGUID.mp3`

The alias verifies that the retained publication actually links that GUID and
representation. It provides distinct URLs when two Episodes intentionally share
one representation, without duplicating bytes or changing either identity.
Milestone 006's `/public/media/:representationUUID` remains supported unchanged.
Both paths preserve GET/HEAD/Range and retention after unpublish. Enclosure length
and MIME come directly from the representation; duration rounds its approximate
encoded-stream duration to seconds (minimum one).

`public_artwork` is an explicit immutable representation table, with independent
UUID, source provenance, workspace/type foreign key, storage identity, MIME, byte
length and dimensions. It initially references the original write-once object;
no duplicate Library row or resized copy is created. Representations are created
only by authorized RSS enable, saved cover changes on enabled Shows, or Episode
publishing into an enabled feed. Repeated operations reuse the source's existing
representation. Public artwork resolves only by this UUID through
`/public/artwork/:UUID.png` or `.jpg` with matching extension. GET, HEAD,
Last-Modified and Range are supported. Library IDs/storage keys never resolve there,
and private Library paths still require authentication.

Show art is emitted in `itunes:image` and the standard RSS image object (without
oversized RSS width/height attributes). Valid optional Episode art is emitted as
an item-level `itunes:image`. Missing or unsuitable optional art is omitted, with
an authenticated Studio warning; clients may fall back to the channel art. A
small/transparent/WebP legacy Episode cover therefore cannot block an otherwise
valid feed. Missing or unsuitable **Show** artwork is blocking.

Published artwork identities/rows are immutable and retained, including old Show
covers after replacement, so cached artwork URLs continue to work. Its source
cannot be deleted even after the current cover is detached. No arbitrary asset
publication endpoint or static storage directory exists. Emergency takedown and
retention/garbage-collection policy remain separate work.

## Determinism and caching

`rss.js` generates XML independently of HTTP routing. Invalid XML 1.0 code points
are stripped; the five XML metacharacters are escaped in text and attributes.
Item order is publication time descending with GUID tie-breaker. Feed reads use a
repeatable-read, read-only transaction for a consistent Show/items snapshot.

The body is deterministic for unchanged stored state/configuration. `lastBuildDate`
and HTTP Last-Modified use the latest Show/publication update or referenced artwork
creation, including
inactive publication timestamps so removal changes the feed version. Draft Episode
edits do not affect either. No request-time timestamp is inserted.

A SHA-256 ETag hashes the complete UTF-8 XML. GET and HEAD support If-None-Match
(weak comparison, lists, and wildcard) and return bodyless 304 on a match. Responses
use `application/rss+xml; charset=utf-8` and
`Cache-Control: public, max-age=0, must-revalidate`. HEAD reports the same full
Content-Length without a body. Last-Modified is informational: If-Modified-Since
alone does not produce 304, avoiding lost changes within one second and configuration
changes absent from database timestamps. An archived/disabled feed returns 404
even with a previously matching ETag.

Feeds are generated on demand, with no external cache or network validator. The
public renderer uses committed ready representation metadata, not file decoding
on every poll. Missing storage may still make a media URL return 503; it does not
silently remove an Episode or rewrite its history. Feed size is currently unbounded
by item count; large-catalog performance and explicit retention/window policy are
future work, rather than silently truncating publication history.

## Verification and next boundaries

Offline tests parse XML with the existing jsdom DOMParser, check namespaces,
escaping, exact data, isolation, feed identity, snapshot stability and cache behavior.
Database tests upgrade populated 006 data, inject failure after 007 SQL, verify
rollback of both schema and ledger, retry and reconnect. Desktop/mobile Chromium
flows open actual RSS and fetch real artwork/enclosures with isolated databases.
No automated gate depends on a remote validator.

For a future deployed feed, manually inspect its XML, fetch artwork and enclosure
HEAD/Range responses anonymously, and optionally submit its public URL to the
[RSS validator](https://validator.w3.org/feed/). Directory-specific validation and
review still apply; do not claim that local tests constitute Apple/Spotify approval.

Future extensions can add `podcast:*` output to the generator only after defining
its source data and authorization. Directory distribution consumes this feed URL;
Apple/Spotify APIs, submission automation, processing/transcoding, normalization,
CDN caching, analytics and automatic scheduling are not implemented here.

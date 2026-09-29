# Podcast Core Domain

## Ownership and identity

An account creates one personal workspace atomically through a database trigger.
Existing accounts and shows are backfilled by `002_podcast_domain.sql`. Workspace
IDs initially equal their owner's UUID, but are separate relational identities.
Shows belong to a workspace and retain `owner_id` for compatibility; a composite
foreign key enforces their agreement. The current API chooses the authenticated
creator's workspace when creating a show, never a supplied owner/workspace ID.
`GET /workspaces` returns owned workspaces. Workspace switching, transfer,
workspace-wide membership, and invitations are intentionally deferred.

Existing `show_members` editor/producer grants remain scoped to one show and its
seasons/episodes. A grant does not reveal other shows or the owner's workspace.
Both roles can edit; only the owner can delete. Unauthorized item access returns
404. Authentication is required for all domain routes. This milestone preserves
the existing bearer-session model; it does not claim full public-service hardening.

Show slugs are unique within a workspace; episode slugs within a show. Automatic
slugs include a random suffix and stay stable on title edits. Explicit slug edits
are allowed, so future public routes must implement redirects or use immutable
IDs. Episode GUIDs remain server-generated and immutable through the API. Future
RSS and analytics must reference IDs/GUIDs rather than mutable titles or slugs.

## Metadata

Shows have title, description (plain text, 5,000 characters), short description
(300), author (200), language (canonical language tag, default `en`), category
(optional free text, 100), explicit flag (default false), show type (`episodic` or
`serial`), HTTP(S) website URL, copyright, timestamps, and editorial status.
Category is not a claimed directory taxonomy: map and validate it against each
destination's taxonomy in the distribution milestone. Author is display metadata,
not an authorization principal. No HTML description rendering is supported.

Episodes have title, description, optional positive episode number, type (`full`,
`trailer`, `bonus`), nullable explicit override, optional season, `publish_at`,
status, GUID, and timestamps. A null explicit flag inherits the show's setting;
the first publication snapshot resolves `COALESCE(episode.explicit, show.explicit)`.
Episode numbers are descriptive and may repeat (trailers/bonuses are a common
reason); slugs and GUIDs provide unique identities.

Seasons have a title, description, positive season number unique per show, and
timestamps. Seasons are organizational rather than publishable resources and
have no independent publication status. A composite foreign key on
`(season_id, show_id)` makes cross-show assignments impossible, including direct
SQL writes. Episodes can omit a season. Deleting a nonempty season fails until
its episodes are reassigned or detached.

## Lifecycle and deletion

Shows: `draft`, `published`, `archived`. A show is not scheduled as a whole.
Episodes: `draft`, `scheduled`, `published`, `archived`.

Scheduling requires an explicit future timezone-bearing ISO timestamp.
Explicit publishing validates metadata/audio and publishes now. `publish_at` is the editorial
release time; `published_at` records the first publication transition and survives
archive/restore. The older `scheduled_at` field is retained for compatibility but
is no longer written; clients use `publish_at`. Existing scheduled/published
records are backfilled without discarding their original timestamps.

Drafts may be scheduled, published, or archived; schedules can be cancelled back
to draft. Never-published archives can return to draft. Once published, a record
can only stay published, be archived, or be restored to published. Database
triggers preserve first-publication history and enforce deletion protection even
if an archive is later edited. PATCH operations lock the record in a transaction
to validate transitions against the latest committed state.

Editorial status and media readiness are separate. Milestone 006 adds explicit
publishing and retained snapshots; see [Publishing architecture](PUBLISHING_ARCHITECTURE.md).
Generic PATCH cannot transition an Episode to published. Unpublish archives and
withdraws discovery eligibility; Republish restores the same snapshot and audio.
Existing media URLs remain usable. Milestone 007 adds opt-in public Show RSS feeds.
There is no scheduler, public Episode HTML page or directory submission. A scheduled time passing does not publish automatically.

Only never-published drafts may be permanently deleted. A show with episodes
cannot be deleted; the database restricts the relationship. Empty seasons and
show memberships may cascade when an empty draft show is deleted. Archive is the
normal preservation path. Future media references must restrict asset deletion
while attached. No automatic deletion of storage objects is implied by domain CRUD.

## API contract

| Resource | Routes |
| --- | --- |
| Workspaces | `GET /workspaces` |
| Shows | `GET/POST /shows`, `GET/PATCH/DELETE /shows/:id` |
| Seasons | `GET/POST /shows/:id/seasons`, `GET/PATCH/DELETE /seasons/:id` |
| Episodes | `GET/POST /shows/:id/episodes`, `GET/PATCH/DELETE /episodes/:id` |
| Publication | `GET /episodes/:id/publication`, `POST /episodes/:id/publish`, `POST /episodes/:id/unpublish` |

Creates return 201, reads/updates 200, deletes 204. Singular responses use `show`,
`season`, or `episode`; lists use `items` and
`pagination: {limit, offset, has_more}`. Default limit is 25, maximum 100. Offset
must be a nonnegative safe integer. Ordering has an ID tiebreaker; concurrent
writes can still shift offset pages. Cursor pagination is a future scaling change.

Lists accept `sort=created_at|updated_at|title`, `direction=asc|desc` (default
descending). Seasons additionally accept `season_number` (their default);
episodes accept `publish_at|episode_number`. Show/episode lists accept `status`.
Episode lists accept `season_id=<uuid>` or `season_id=none`. Invalid filters and
sort fields return 400. SQL sort identifiers come only from allowlists.

Validation errors are 400; missing/expired authentication is 401; owner-only
deletes return 403 for members; inaccessible records return 404; duplicate slugs,
season numbers, protected deletion, or relational conflicts return 409. Errors
retain `{error: string}` for client compatibility. Protected fields such as IDs,
owner, workspace, GUID, and raw storage keys are never taken from request bodies.
The validated `cover_asset_id` relationship is editable.
Unknown fields are ignored for compatibility; a PATCH with no supported field is
rejected. Studio uses the API's pagination contract to load accessible collections
in pages, then applies local status/title controls. Very large libraries will need
server-driven incremental list rendering rather than loading all pages.

## Future Media Library and distribution boundaries

```text
Workspace → Media Library (object storage + asset metadata)
              ├── show artwork
              ├── episode artwork
              ├── episode audio
              └── other creator assets
```

Show and episode IDs are the attachment anchors. The image milestone adds nullable
`cover_asset_id` relationships with composite workspace/type foreign keys. Creators
select existing images or upload to their personal workspace. Episodes may select
custom artwork; a null cover indicates future show-artwork fallback without a
copied asset. Object keys and metadata live on `media_assets`, never image blobs
or paths on show/episode records. Legacy show artwork keys are archived for manual
import; legacy audio columns remain untouched and unused by the new media path. See
[Media Library architecture](MEDIA_LIBRARY_ARCHITECTURE.md) for the implemented
storage, authorization, validation and deletion contracts. Migration 005 adds nullable `primary_audio_asset_id` with a composite workspace/audio
foreign key. Drafts need no audio. Assignment, replacement and detachment are
independent of asset deletion; references block deletion. See [Audio architecture](AUDIO_ARCHITECTURE.md).
Original uploads remain distinct from `publishable_media` representations and `episode_publications` snapshots.

Transcripts and chapters should be versioned episode child resources, optionally
referencing source/derived assets. A show has a feed configuration resource;
distribution destinations and per-episode publication attempts belong in separate
child tables with provider IDs, timestamps, retries, and errors. A stable GUID
survives republishing and artwork changes. Analytics should retain episode identity
across archives. Audio processing, directory distribution, analytics, and monetization
remain future milestones.

## Migrations

`001_foundation.sql` is unchanged. `002` adds/backfills the core domain. `003`
protects publication history. `004` upgrades media metadata and adds image covers.
`005` adds original MP3 assets and primary Episode audio.
`006` adds publishable representations and retained publication snapshots.
Applied migrations are immutable; `007` adds feed identities, explicit artwork representations and snapshot feed fields;
the next change uses `008_...sql`. The existing runner wraps each file and its ledger insertion
in one transaction, using a session advisory lock. Failure rolls back that file;
already committed earlier files remain applied. There are no automatic destructive
down migrations. Production recovery requires a reviewed forward repair or a tested
backup restore. Integration probes verify rollback, repaired retries, persistence
across connections, ordered application, and no-op reruns.

## Show feed identity and snapshot metadata

`shows.feed_id` is a permanent UUID independent of workspace ID and mutable slug.
`feed_enabled` defaults false, including migrated Shows. `POST /shows/:id/feed`
validates saved details/artwork and opts into RSS while setting editorial Show
status published. `GET /shows/:id/feed` reports readiness. These operations use
existing Show permissions. Archived Shows have no publicly available feed.
Publication number, season number, type and artwork source now remain fixed with
the existing snapshot; Channel metadata is live. See [RSS architecture](RSS_ARCHITECTURE.md).

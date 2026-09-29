-- Opt-in feeds: migration never publishes an existing Show or private artwork.
ALTER TABLE shows ADD COLUMN feed_id uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  ADD COLUMN feed_enabled boolean NOT NULL DEFAULT false;
CREATE FUNCTION guard_feed_identity() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.feed_id IS DISTINCT FROM OLD.feed_id THEN
    RAISE EXCEPTION 'Feed identity is immutable' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER shows_feed_identity BEFORE UPDATE ON shows FOR EACH ROW EXECUTE FUNCTION guard_feed_identity();

-- Extend the existing publication snapshot, not a parallel Episode lifecycle.
ALTER TABLE episode_publications
  ADD COLUMN episode_number integer CHECK (episode_number > 0),
  ADD COLUMN season_number integer CHECK (season_number > 0),
  ADD COLUMN episode_type text NOT NULL DEFAULT 'full' CHECK (episode_type IN ('full','trailer','bonus')),
  ADD COLUMN cover_asset_id uuid,
  ADD COLUMN cover_asset_type text NOT NULL DEFAULT 'image' CHECK (cover_asset_type='image'),
  ADD FOREIGN KEY (cover_asset_id,workspace_id,cover_asset_type)
    REFERENCES media_assets(id,workspace_id,asset_type) ON DELETE RESTRICT;
-- These fields had no publication values in 006. Capture their upgrade-time values
-- once, preserving every pre-existing snapshot column and public media identity.
ALTER TABLE episode_publications DISABLE TRIGGER publication_snapshot;
UPDATE episode_publications p SET episode_number=e.episode_number,
  episode_type=e.episode_type, cover_asset_id=e.cover_asset_id,
  season_number=(SELECT season_number FROM seasons WHERE id=e.season_id)
  FROM episodes e WHERE e.id=p.episode_id;
ALTER TABLE episode_publications ENABLE TRIGGER publication_snapshot;

CREATE TABLE public_artwork (
  id uuid PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES workspaces(id),
  source_media_asset_id uuid NOT NULL UNIQUE,
  media_type text NOT NULL DEFAULT 'image' CHECK (media_type='image'),
  storage_key text NOT NULL,
  mime_type text NOT NULL CHECK (mime_type IN ('image/jpeg','image/png')),
  size_bytes bigint NOT NULL CHECK (size_bytes > 0),
  width integer NOT NULL CHECK (width BETWEEN 1400 AND 3000),
  height integer NOT NULL CHECK (height=width),
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (source_media_asset_id,workspace_id,media_type)
    REFERENCES media_assets(id,workspace_id,asset_type) ON DELETE RESTRICT
);
CREATE FUNCTION guard_public_artwork() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Published artwork is retained and immutable' USING ERRCODE='23514';
END $$;
CREATE TRIGGER public_artwork_history BEFORE UPDATE OR DELETE ON public_artwork FOR EACH ROW EXECUTE FUNCTION guard_public_artwork();
CREATE INDEX publications_representation ON episode_publications(representation_id);

-- Existing editorial publication history is preserved, never silently exposed.
ALTER TABLE episodes ADD UNIQUE (id, workspace_id);
CREATE TABLE publishable_media (
  id uuid PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES workspaces(id),
  source_media_asset_id uuid NOT NULL,
  media_type text NOT NULL DEFAULT 'audio' CHECK (media_type='audio'),
  profile text NOT NULL CHECK (length(profile) BETWEEN 1 AND 100),
  storage_key text NOT NULL,
  mime_type text NOT NULL CHECK (mime_type='audio/mpeg'),
  size_bytes bigint NOT NULL CHECK (size_bytes > 0),
  duration_seconds double precision NOT NULL CHECK (duration_seconds > 0 AND duration_seconds < 'Infinity'::double precision),
  state text NOT NULL DEFAULT 'ready' CHECK (state IN ('ready','retired')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (source_media_asset_id, workspace_id, media_type)
    REFERENCES media_assets(id, workspace_id, asset_type) ON DELETE RESTRICT,
  UNIQUE (source_media_asset_id, profile),
  UNIQUE (id, workspace_id, state)
);
CREATE TABLE episode_publications (
  episode_id uuid PRIMARY KEY,
  workspace_id uuid NOT NULL,
  representation_id uuid NOT NULL,
  representation_state text GENERATED ALWAYS AS ('ready'::text) STORED,
  guid uuid NOT NULL UNIQUE,
  title text NOT NULL CHECK (length(trim(title)) > 0),
  description text NOT NULL CHECK (length(trim(description)) > 0),
  explicit boolean NOT NULL,
  published_at timestamptz NOT NULL,
  active boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (episode_id, workspace_id) REFERENCES episodes(id, workspace_id) ON DELETE RESTRICT,
  FOREIGN KEY (representation_id, workspace_id, representation_state)
    REFERENCES publishable_media(id, workspace_id, state) ON DELETE RESTRICT ON UPDATE RESTRICT
);
-- Historical enclosures cannot be deleted/retired, even after withdrawal.
CREATE FUNCTION guard_publication_snapshot() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP='DELETE' THEN
    RAISE EXCEPTION 'Publication history cannot be deleted' USING ERRCODE='23514';
  END IF;
  IF TG_OP='UPDATE' AND (to_jsonb(NEW)-'active'-'updated_at'-'representation_state') IS DISTINCT FROM (to_jsonb(OLD)-'active'-'updated_at'-'representation_state') THEN
    RAISE EXCEPTION 'Publication snapshot is immutable' USING ERRCODE='23514';
  END IF;
  IF TG_OP='INSERT' AND NOT EXISTS (SELECT 1 FROM episodes WHERE id=NEW.episode_id AND guid=NEW.guid) THEN
    RAISE EXCEPTION 'Publication GUID must match Episode' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER publication_snapshot BEFORE INSERT OR UPDATE OR DELETE ON episode_publications FOR EACH ROW EXECUTE FUNCTION guard_publication_snapshot();
CREATE FUNCTION guard_representation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP='DELETE' THEN
    IF OLD.state <> 'retired' THEN
      RAISE EXCEPTION 'Retire unused representations before deletion' USING ERRCODE='23514';
    END IF;
    RETURN OLD;
  END IF;
  IF (to_jsonb(NEW)-'state'-'updated_at') IS DISTINCT FROM (to_jsonb(OLD)-'state'-'updated_at') OR OLD.state='retired' AND NEW.state<>'retired' THEN
    RAISE EXCEPTION 'Representation bytes and identity are immutable' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER representation_history BEFORE UPDATE OR DELETE ON publishable_media FOR EACH ROW EXECUTE FUNCTION guard_representation();
-- Storage objects are write-once. Metadata edits may not change their identity.
CREATE FUNCTION guard_original_bytes() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF ROW(NEW.id,NEW.workspace_id,NEW.asset_type,NEW.storage_key,NEW.mime_type,NEW.size_bytes,NEW.duration_seconds,NEW.state)
    IS DISTINCT FROM ROW(OLD.id,OLD.workspace_id,OLD.asset_type,OLD.storage_key,OLD.mime_type,OLD.size_bytes,OLD.duration_seconds,OLD.state) THEN
    RAISE EXCEPTION 'Original media identity and bytes are immutable' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER original_bytes BEFORE UPDATE ON media_assets FOR EACH ROW EXECUTE FUNCTION guard_original_bytes();
CREATE FUNCTION guard_episode_publication() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP='UPDATE' AND (NEW.guid IS DISTINCT FROM OLD.guid OR (OLD.published_at IS NOT NULL AND ROW(NEW.show_id,NEW.workspace_id) IS DISTINCT FROM ROW(OLD.show_id,OLD.workspace_id))) THEN
    RAISE EXCEPTION 'Episode identity is immutable' USING ERRCODE='23514';
  END IF;
  IF NEW.status='published' AND (TG_OP='INSERT' OR OLD.status<>'published') AND NOT EXISTS (
    SELECT 1 FROM episode_publications WHERE episode_id=NEW.id AND active
  ) THEN
    RAISE EXCEPTION 'Use the publishing operation' USING ERRCODE='23514';
  END IF;
  IF NEW.status='archived' THEN
    UPDATE episode_publications SET active=false, updated_at=now() WHERE episode_id=NEW.id AND active;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER episodes_publication BEFORE INSERT OR UPDATE ON episodes FOR EACH ROW EXECUTE FUNCTION guard_episode_publication();

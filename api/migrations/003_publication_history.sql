-- Publication identity survives archive/restore and cannot become deletable again.
ALTER TABLE shows ADD COLUMN published_at timestamptz;
UPDATE shows SET published_at=created_at WHERE status='published';
UPDATE episodes SET published_at=publish_at WHERE status='published' AND published_at IS NULL;
CREATE FUNCTION guard_podcast_history() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.status <> 'draft' OR OLD.published_at IS NOT NULL THEN
      RAISE EXCEPTION 'Only never-published drafts may be deleted' USING ERRCODE='23514';
    END IF;
    RETURN OLD;
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.published_at IS NOT NULL THEN
    NEW.published_at := OLD.published_at;
    IF NEW.status NOT IN ('published','archived') THEN
      RAISE EXCEPTION 'Published records may only be published or archived' USING ERRCODE='23514';
    END IF;
  END IF;
  IF NEW.status='published' AND NEW.published_at IS NULL THEN
    NEW.published_at := now();
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER shows_history BEFORE INSERT OR UPDATE OR DELETE ON shows FOR EACH ROW EXECUTE FUNCTION guard_podcast_history();
CREATE TRIGGER episodes_history BEFORE INSERT OR UPDATE OR DELETE ON episodes FOR EACH ROW EXECUTE FUNCTION guard_podcast_history();

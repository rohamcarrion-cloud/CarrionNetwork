-- Preserve existing creator data; each creator receives a personal workspace.
CREATE TABLE workspaces (
  id uuid PRIMARY KEY,
  owner_id uuid NOT NULL UNIQUE REFERENCES users(id),
  name text NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 200),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, owner_id)
);
INSERT INTO workspaces (id, owner_id, name) SELECT id, id, display_name FROM users;
CREATE FUNCTION create_personal_workspace() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO workspaces (id, owner_id, name) VALUES (NEW.id, NEW.id, NEW.display_name);
  RETURN NEW;
END $$;
CREATE TRIGGER users_workspace AFTER INSERT ON users FOR EACH ROW EXECUTE FUNCTION create_personal_workspace();
ALTER TABLE shows ADD COLUMN workspace_id uuid;
UPDATE shows SET workspace_id = owner_id;
ALTER TABLE shows ALTER COLUMN workspace_id SET NOT NULL;
ALTER TABLE shows ADD FOREIGN KEY (workspace_id, owner_id) REFERENCES workspaces(id, owner_id);
ALTER TABLE shows DROP CONSTRAINT shows_slug_key;
ALTER TABLE shows ADD UNIQUE (workspace_id, slug);
ALTER TABLE shows
  ADD COLUMN short_description text NOT NULL DEFAULT '' CHECK (length(short_description) <= 300),
  ADD COLUMN author text NOT NULL DEFAULT '' CHECK (length(author) <= 200),
  ADD COLUMN language text NOT NULL DEFAULT 'en' CHECK (length(language) BETWEEN 2 AND 35),
  ADD COLUMN category text NOT NULL DEFAULT '' CHECK (length(category) <= 100),
  ADD COLUMN explicit boolean NOT NULL DEFAULT false,
  ADD COLUMN show_type text NOT NULL DEFAULT 'episodic' CHECK (show_type IN ('episodic','serial')),
  ADD COLUMN website_url text NOT NULL DEFAULT '' CHECK (length(website_url) <= 2048),
  ADD COLUMN copyright text NOT NULL DEFAULT '' CHECK (length(copyright) <= 300);
CREATE TABLE seasons (
  id uuid PRIMARY KEY,
  show_id uuid NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (length(trim(title)) BETWEEN 1 AND 200),
  season_number integer NOT NULL CHECK (season_number > 0),
  description text NOT NULL DEFAULT '' CHECK (length(description) <= 5000),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (show_id, season_number),
  UNIQUE (id, show_id)
);
ALTER TABLE episodes
  ADD COLUMN season_id uuid,
  ADD COLUMN episode_number integer CHECK (episode_number > 0),
  ADD COLUMN episode_type text NOT NULL DEFAULT 'full' CHECK (episode_type IN ('full','trailer','bonus')),
  ADD COLUMN explicit boolean,
  ADD COLUMN publish_at timestamptz,
  ADD FOREIGN KEY (season_id, show_id) REFERENCES seasons(id, show_id) ON DELETE RESTRICT;
UPDATE episodes SET publish_at = COALESCE(published_at, scheduled_at, created_at) WHERE status IN ('scheduled','published');
ALTER TABLE episodes ADD CHECK (status NOT IN ('scheduled','published') OR publish_at IS NOT NULL);
ALTER TABLE episodes DROP CONSTRAINT episodes_show_id_fkey;
ALTER TABLE episodes ADD FOREIGN KEY (show_id) REFERENCES shows(id) ON DELETE RESTRICT;
CREATE INDEX episodes_season_idx ON episodes(season_id, show_id);
CREATE INDEX episodes_lifecycle_idx ON episodes(show_id, status, publish_at DESC, id);
CREATE INDEX shows_workspace_idx ON shows(workspace_id, created_at DESC, id);

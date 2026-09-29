-- Upgrade the foundation placeholder without losing legacy asset metadata.
ALTER TABLE media_assets
  ADD COLUMN workspace_id uuid REFERENCES workspaces(id),
  ADD COLUMN asset_type text NOT NULL DEFAULT 'legacy' CHECK (length(asset_type) BETWEEN 1 AND 50),
  ADD COLUMN original_filename text NOT NULL DEFAULT 'Legacy asset' CHECK (length(original_filename) BETWEEN 1 AND 255),
  ADD COLUMN width integer CHECK (width > 0),
  ADD COLUMN height integer CHECK (height > 0),
  ADD COLUMN alt_text text NOT NULL DEFAULT '' CHECK (length(alt_text) <= 2000),
  ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();
UPDATE media_assets SET workspace_id=owner_id;
ALTER TABLE media_assets ALTER COLUMN workspace_id SET NOT NULL;
ALTER TABLE media_assets DROP COLUMN owner_id;
ALTER TABLE media_assets ALTER COLUMN asset_type SET DEFAULT 'image';
ALTER TABLE media_assets ALTER COLUMN state SET DEFAULT 'ready';
ALTER TABLE media_assets ADD UNIQUE (id, workspace_id, asset_type);
-- Preserve any pre-library path values for manual import; business records use FKs only.
CREATE TABLE legacy_show_artwork AS SELECT id AS show_id, workspace_id, artwork_key FROM shows WHERE artwork_key IS NOT NULL;
ALTER TABLE shows DROP COLUMN artwork_key;
CREATE INDEX media_workspace_created ON media_assets(workspace_id, created_at DESC, id);
ALTER TABLE shows ADD UNIQUE (id, workspace_id);
ALTER TABLE shows ADD COLUMN cover_asset_id uuid,
  ADD COLUMN cover_asset_type text GENERATED ALWAYS AS ('image'::text) STORED,
  ADD FOREIGN KEY (cover_asset_id, workspace_id, cover_asset_type)
    REFERENCES media_assets(id, workspace_id, asset_type) ON DELETE RESTRICT;
ALTER TABLE episodes ADD COLUMN workspace_id uuid;
UPDATE episodes e SET workspace_id=s.workspace_id FROM shows s WHERE s.id=e.show_id;
ALTER TABLE episodes ALTER COLUMN workspace_id SET NOT NULL;
ALTER TABLE episodes ADD FOREIGN KEY (show_id, workspace_id) REFERENCES shows(id, workspace_id);
ALTER TABLE episodes ADD COLUMN cover_asset_id uuid,
  ADD COLUMN cover_asset_type text GENERATED ALWAYS AS ('image'::text) STORED,
  ADD FOREIGN KEY (cover_asset_id, workspace_id, cover_asset_type)
    REFERENCES media_assets(id, workspace_id, asset_type) ON DELETE RESTRICT;
CREATE INDEX shows_cover_asset ON shows(cover_asset_id) WHERE cover_asset_id IS NOT NULL;
CREATE INDEX episodes_cover_asset ON episodes(cover_asset_id) WHERE cover_asset_id IS NOT NULL;

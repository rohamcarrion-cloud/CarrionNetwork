-- Original uploads remain independent of any future publishable representation.
ALTER TABLE media_assets ADD COLUMN duration_seconds double precision;
ALTER TABLE media_assets ADD CONSTRAINT media_audio_metadata CHECK (
  asset_type <> 'audio' OR (
    mime_type = 'audio/mpeg' AND size_bytes > 0 AND
    duration_seconds IS NOT NULL AND duration_seconds > 0 AND
    duration_seconds < 'Infinity'::double precision AND width IS NULL AND height IS NULL
  )
);
ALTER TABLE episodes ADD COLUMN primary_audio_asset_id uuid,
  ADD COLUMN primary_audio_asset_type text GENERATED ALWAYS AS ('audio'::text) STORED,
  ADD FOREIGN KEY (primary_audio_asset_id, workspace_id, primary_audio_asset_type)
    REFERENCES media_assets(id, workspace_id, asset_type) ON DELETE RESTRICT;
CREATE INDEX episodes_primary_audio ON episodes(primary_audio_asset_id)
  WHERE primary_audio_asset_id IS NOT NULL;

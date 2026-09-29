CREATE TABLE users (
  id uuid PRIMARY KEY,
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  display_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT email_lowercase CHECK (email = lower(email))
);

CREATE TABLE sessions (
  token_hash text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX sessions_user_idx ON sessions (user_id);

CREATE TABLE shows (
  id uuid PRIMARY KEY,
  owner_id uuid NOT NULL REFERENCES users(id),
  title text NOT NULL CHECK (length(trim(title)) BETWEEN 1 AND 200),
  slug text NOT NULL UNIQUE,
  description text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  artwork_key text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX shows_owner_idx ON shows (owner_id, created_at DESC);

CREATE TABLE show_members (
  show_id uuid NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('editor','producer')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (show_id, user_id)
);
CREATE INDEX show_members_user_idx ON show_members (user_id, show_id);

CREATE TABLE episodes (
  id uuid PRIMARY KEY,
  show_id uuid NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (length(trim(title)) BETWEEN 1 AND 250),
  slug text NOT NULL,
  description text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','scheduled','published','archived')),
  guid uuid NOT NULL UNIQUE,
  audio_key text,
  audio_bytes bigint CHECK (audio_bytes > 0),
  audio_mime text,
  duration_seconds integer CHECK (duration_seconds > 0),
  scheduled_at timestamptz,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (show_id, slug)
);
CREATE INDEX episodes_show_idx ON episodes (show_id, created_at DESC);
CREATE INDEX episodes_public_idx ON episodes (show_id, published_at DESC) WHERE status = 'published';

CREATE TABLE media_assets (
  id uuid PRIMARY KEY,
  owner_id uuid NOT NULL REFERENCES users(id),
  storage_key text NOT NULL UNIQUE,
  mime_type text NOT NULL,
  size_bytes bigint NOT NULL CHECK (size_bytes > 0),
  state text NOT NULL DEFAULT 'pending' CHECK (state IN ('pending','processing','ready','failed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE playback_events (
  id bigint GENERATED ALWAYS AS IDENTITY,
  episode_id uuid NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
  event_kind text NOT NULL CHECK (event_kind IN ('start','progress','complete')),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id, occurred_at)
) PARTITION BY RANGE (occurred_at);
CREATE TABLE playback_events_default PARTITION OF playback_events DEFAULT;
CREATE INDEX playback_events_episode_idx ON playback_events_default (episode_id, occurred_at DESC);

export interface User {
  id: string;
  email: string;
  display_name: string;
}
export interface PodcastInput {
  primary_audio_asset_id?: string | null;
  cover_asset_id?: string | null;
  title: string;
  description: string;
  slug?: string;
  status?: 'draft' | 'scheduled' | 'published' | 'archived';
  short_description?: string;
  author?: string;
  language?: string;
  category?: string;
  explicit?: boolean | null;
  show_type?: 'episodic' | 'serial';
  website_url?: string;
  copyright?: string;
  season_id?: string | null;
  episode_number?: number | null;
  episode_type?: 'full' | 'trailer' | 'bonus';
  publish_at?: string | null;
  published_at?: string | null;
}
export interface Show extends PodcastInput {
  id: string;
  owner_id: string;
  slug: string;
  status: 'draft' | 'published' | 'archived';
  created_at: string;
  updated_at: string;
  my_role?: 'owner' | 'editor' | 'producer';
}
export interface Episode extends PodcastInput {
  id: string;
  show_id: string;
  slug: string;
  guid: string;
  status: 'draft' | 'scheduled' | 'published' | 'archived';
  created_at: string;
  updated_at: string;
}
export interface Credentials {
  email: string;
  password: string;
}

export interface Season {
  id: string;
  show_id: string;
  title: string;
  season_number: number;
  description: string;
}

export interface MediaAsset {
  id: string;
  workspace_id: string;
  asset_type: string;
  original_filename: string;
  mime_type: string;
  size_bytes: string;
  duration_seconds?: number | null;
  width: number | null;
  height: number | null;
  alt_text: string;
  created_at: string;
  updated_at: string;
}

export interface PublicationState {
  ready: boolean;
  issues: Array<{ field: string; message: string }>;
  publication: null | {
    episode_id: string;
    representation_id: string;
    guid: string;
    title: string;
    description: string;
    published_at: string;
    active: boolean;
    state: 'ready' | 'retired';
    media_url: string;
  };
}

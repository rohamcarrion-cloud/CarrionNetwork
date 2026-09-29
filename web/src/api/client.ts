import type { FeedState, PublicationState } from './types';
import type {
  MediaAsset,
  Credentials,
  PodcastInput,
  Episode,
  Show,
  User,
  Season,
} from './types';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export function createApi(
  token: string | null,
  onExpired: () => void,
  base = import.meta.env.VITE_API_URL || '/api',
) {
  async function request<T>(
    path: string,
    options: {
      method?: string;
      body?: unknown;
      signal?: AbortSignal;
      public?: boolean;
      binary?: boolean;
    } = {},
  ): Promise<T> {
    let response: Response;
    try {
      response = await fetch(`${base.replace(/\/$/, '')}${path}`, {
        method: options.method || 'GET',
        headers: {
          ...(token && !options.public
            ? { Authorization: `Bearer ${token}` }
            : {}),
          ...(options.body !== undefined
            ? {
                'Content-Type':
                  options.body instanceof File
                    ? options.body.type
                    : 'application/json',
              }
            : {}),
        },
        body:
          options.body instanceof File
            ? options.body
            : options.body === undefined
              ? undefined
              : JSON.stringify(options.body),
        signal: options.signal
          ? AbortSignal.any([
              options.signal,
              AbortSignal.timeout(
                options.body instanceof File || options.binary ? 300000 : 15000,
              ),
            ])
          : AbortSignal.timeout(
              options.body instanceof File || options.binary ? 300000 : 15000,
            ),
      });
    } catch (error) {
      if (options.signal?.aborted) throw error;
      throw new ApiError(
        'Cannot reach Carrion Network. Check your connection and try again.',
        0,
      );
    }
    if (response.status === 401 && token && !options.public) onExpired();
    if (response.status === 204) return undefined as T;
    if (options.binary && response.ok) return (await response.blob()) as T;
    let data;
    try {
      data = await response.json();
    } catch {
      throw new ApiError(
        'The server returned an unexpected response. Please try again.',
        response.status,
      );
    }
    if (!response.ok)
      throw new ApiError(
        data.error || 'Your request could not be completed.',
        response.status,
      );
    return data as T;
  }
  async function all<T>(
    path: string,
    signal?: AbortSignal,
  ): Promise<{ items: T[] }> {
    const items: T[] = [];
    let offset = 0;
    while (true) {
      const page = await request<{
        items: T[];
        pagination?: { has_more: boolean };
      }>(`${path}?limit=100&offset=${offset}`, { signal });
      items.push(...page.items);
      if (!page.pagination?.has_more) return { items };
      offset += page.items.length;
    }
  }
  return {
    media: (
      workspace: string,
      offset = 0,
      sort = 'created_at',
      signal?: AbortSignal,
      type = 'image',
    ) =>
      request<{ items: MediaAsset[]; pagination: { has_more: boolean } }>(
        `/workspaces/${workspace}/media?limit=24&offset=${offset}&sort=${sort}&type=${type}`,
        { signal },
      ),
    asset: (workspace: string, id: string) =>
      request<{ asset: MediaAsset }>(`/workspaces/${workspace}/media/${id}`),
    mediaContent: (workspace: string, id: string, signal?: AbortSignal) =>
      request<Blob>(`/workspaces/${workspace}/media/${id}/content`, {
        binary: true,
        signal,
      }),
    uploadMedia: (workspace: string, file: File) =>
      request<{ asset: MediaAsset }>(
        `/workspaces/${workspace}/media?filename=${encodeURIComponent(file.name)}`,
        { method: 'POST', body: file },
      ),
    updateAsset: (workspace: string, id: string, alt_text: string) =>
      request<{ asset: MediaAsset }>(`/workspaces/${workspace}/media/${id}`, {
        method: 'PATCH',
        body: { alt_text },
      }),
    deleteAsset: (workspace: string, id: string) =>
      request<void>(`/workspaces/${workspace}/media/${id}`, {
        method: 'DELETE',
      }),
    seasons: (showId: string, signal?: AbortSignal) =>
      all<Season>(`/shows/${encodeURIComponent(showId)}/seasons`, signal),
    createSeason: (
      showId: string,
      body: { title: string; season_number: number },
    ) =>
      request<{ season: Season }>(`/shows/${showId}/seasons`, {
        method: 'POST',
        body,
      }),
    deleteSeason: (id: string) =>
      request<void>(`/seasons/${id}`, { method: 'DELETE' }),
    login: (body: Credentials) =>
      request<{ token: string; user: User }>('/auth/login', {
        method: 'POST',
        body,
        public: true,
      }),
    register: (body: Credentials & { display_name: string }) =>
      request<{ user: User }>('/auth/register', {
        method: 'POST',
        body,
        public: true,
      }),
    me: (signal?: AbortSignal) =>
      request<{ user: User }>('/auth/me', { signal }),
    logout: () => request<void>('/auth/logout', { method: 'POST' }),
    health: (signal?: AbortSignal) =>
      request<{ status: string }>('/health', { signal, public: true }),
    shows: (signal?: AbortSignal) => all<Show>('/shows', signal),
    show: (id: string, signal?: AbortSignal) =>
      request<{ show: Show }>(`/shows/${encodeURIComponent(id)}`, { signal }),
    feed: (id: string, signal?: AbortSignal) =>
      request<FeedState>(`/shows/${encodeURIComponent(id)}/feed`, { signal }),
    enableFeed: (id: string) =>
      request<FeedState>(`/shows/${encodeURIComponent(id)}/feed`, {
        method: 'POST',
      }),
    createShow: (body: PodcastInput) =>
      request<{ show: Show }>('/shows', { method: 'POST', body }),
    updateShow: (id: string, body: PodcastInput) =>
      request<{ show: Show }>(`/shows/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body,
      }),
    deleteShow: (id: string) =>
      request<void>(`/shows/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    episodes: (showId: string, signal?: AbortSignal) =>
      all<Episode>(`/shows/${encodeURIComponent(showId)}/episodes`, signal),
    episode: (id: string, signal?: AbortSignal) =>
      request<{ episode: Episode }>(`/episodes/${encodeURIComponent(id)}`, {
        signal,
      }),
    createEpisode: (showId: string, body: PodcastInput) =>
      request<{ episode: Episode }>(
        `/shows/${encodeURIComponent(showId)}/episodes`,
        { method: 'POST', body },
      ),
    updateEpisode: (id: string, body: PodcastInput) =>
      request<{ episode: Episode }>(`/episodes/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body,
      }),
    publication: (id: string, signal?: AbortSignal) =>
      request<PublicationState>(
        `/episodes/${encodeURIComponent(id)}/publication`,
        { signal },
      ),
    publish: (id: string) =>
      request<PublicationState>(`/episodes/${encodeURIComponent(id)}/publish`, {
        method: 'POST',
      }),
    unpublish: (id: string) =>
      request<PublicationState>(
        `/episodes/${encodeURIComponent(id)}/unpublish`,
        { method: 'POST' },
      ),
    deleteEpisode: (id: string) =>
      request<void>(`/episodes/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      }),
  };
}
export type Api = ReturnType<typeof createApi>;

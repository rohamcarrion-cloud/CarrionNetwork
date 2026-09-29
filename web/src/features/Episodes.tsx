import { useCallback, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import { useAuth } from '../auth/AuthProvider';
import type { Show } from '../api/types';
import {
  ActionLink,
  EmptyState,
  ErrorNotice,
  Loading,
  PageHeader,
  useResource,
} from '../components/ui';
import { DeleteRecord, PodcastForm } from '../components/PodcastForm';

export function EpisodeList({ show }: { show: Show }) {
  const { api } = useAuth();
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState('newest');
  const resource = useResource(
    useCallback(
      (signal: AbortSignal) => api.episodes(show.id, signal),
      [api, show.id],
    ),
  );
  return (
    <section className="episode-section">
      <div className="section-heading">
        <h2>Episodes</h2>
        <ActionLink to={`/shows/${show.id}/episodes/new`}>
          New episode
        </ActionLink>
      </div>
      <div className="form-actions">
        <label>
          Filter episode status
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            {['draft', 'scheduled', 'published', 'archived'].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label>
          Episode order
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="newest">Newest first</option>
            <option value="title">Title</option>
          </select>
        </label>
      </div>
      {resource.loading ? (
        <Loading label="Loading episodes…" />
      ) : resource.error ? (
        <ErrorNotice message={resource.error} retry={resource.retry} />
      ) : resource.data?.items.length ? (
        <div className="panel episode-list">
          {status && !resource.data.items.some((e) => e.status === status) && (
            <p>No episodes match this status.</p>
          )}
          {resource.data.items
            .filter((episode) => !status || episode.status === status)
            .sort((a, b) =>
              sort === 'title'
                ? a.title.localeCompare(b.title)
                : b.created_at.localeCompare(a.created_at),
            )
            .map((episode) => (
              <Link
                key={episode.id}
                className="episode-row"
                to={`/shows/${show.id}/episodes/${episode.id}`}
              >
                <div>
                  <h3>{episode.title}</h3>
                  <p>{episode.description || 'No description yet'}</p>
                </div>
                <span className="badge">{episode.status}</span>
                <span aria-hidden="true">→</span>
              </Link>
            ))}
        </div>
      ) : (
        <EmptyState
          title="The next conversation is yours"
          action={
            <ActionLink to={`/shows/${show.id}/episodes/new`}>
              Draft an episode
            </ActionLink>
          }
        >
          Start with an episode title and description. Audio uploads and
          publishing are coming in a later milestone.
        </EmptyState>
      )}
    </section>
  );
}
export function Episodes() {
  const { api } = useAuth();
  const [params, setParams] = useSearchParams();
  const resource = useResource(
    useCallback((signal: AbortSignal) => api.shows(signal), [api]),
  );
  const show =
    resource.data?.items.find((show) => show.id === params.get('show')) ||
    resource.data?.items[0];
  return (
    <>
      <PageHeader
        title="Your episodes"
        description="Build your next conversation, one draft at a time."
      />
      {resource.loading ? (
        <Loading label="Loading your shows…" />
      ) : resource.error ? (
        <ErrorNotice message={resource.error} retry={resource.retry} />
      ) : show ? (
        <>
          <label className="show-selector">
            Show
            <select
              value={show.id}
              onChange={(event) => setParams({ show: event.target.value })}
            >
              {resource.data?.items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
            </select>
          </label>
          <EpisodeList key={show.id} show={show} />
        </>
      ) : (
        <EmptyState
          title="Every episode needs a home"
          action={<ActionLink to="/shows/new">Create a show</ActionLink>}
        >
          Create your first show, then add episode drafts here.
        </EmptyState>
      )}
    </>
  );
}
export function EpisodeEditor({ create = false }: { create?: boolean }) {
  const { showId = '', episodeId = '' } = useParams();
  const { api, user } = useAuth();
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);
  const resource = useResource(
    useCallback(
      async (signal: AbortSignal) => {
        const { show } = await api.show(showId, signal);
        const episode = create
          ? undefined
          : (await api.episode(episodeId, signal)).episode;
        if (episode && episode.show_id !== show.id)
          throw new Error(
            'This episode belongs to a different show. Open it from its show page.',
          );
        const { items: seasons } = await api.seasons(showId, signal);
        return { show, episode, seasons };
      },
      [api, showId, episodeId, create],
    ),
  );
  if (resource.loading) return <Loading label="Loading episode editor…" />;
  if (resource.error)
    return <ErrorNotice message={resource.error} retry={resource.retry} />;
  if (!resource.data) return null;
  const { show, episode } = resource.data;
  return (
    <>
      <Link className="back-link" to={`/shows/${showId}`}>
        ← {show.title}
      </Link>
      <PageHeader
        eyebrow={show.title}
        title={create ? 'Draft a new episode' : episode!.title}
        description="Give your next conversation a title and a story."
      />
      {saved && (
        <p className="notice success" role="status">
          Episode saved.
        </p>
      )}
      <PodcastForm
        key={episode?.updated_at || 'new'}
        kind="episode"
        initial={episode}
        seasons={resource.data.seasons}
        onCancel={() => navigate(`/shows/${showId}`)}
        onSave={async (draft) => {
          if (create) {
            const { episode } = await api.createEpisode(showId, draft);
            navigate(`/shows/${showId}/episodes/${episode.id}`, {
              replace: true,
            });
          } else {
            await api.updateEpisode(episodeId, draft);
            setSaved(true);
            resource.retry();
          }
        }}
      />
      {episode && (
        <div className="panel episode-meta">
          <span className="badge">{episode.status}</span>
          <p>
            Episode GUID <code>{episode.guid}</code>
          </p>
          <small>
            This identifier stays the same when you edit your draft.
          </small>
        </div>
      )}
      {episode &&
        episode.status === 'draft' &&
        !episode.published_at &&
        show.owner_id === user?.id && (
          <DeleteRecord
            kind="episode"
            title={episode.title}
            onDelete={async () => {
              await api.deleteEpisode(episodeId);
              navigate(`/shows/${showId}`, { replace: true });
            }}
          />
        )}
    </>
  );
}

import { ShowFeed } from './ShowFeed';
import { useCallback, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { Radio, ArrowUpRight } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import {
  ActionLink,
  EmptyState,
  ErrorNotice,
  Loading,
  PageHeader,
  useResource,
} from '../components/ui';
import { DeleteRecord, PodcastForm } from '../components/PodcastForm';
import { Seasons } from './Seasons';
import { EpisodeList } from './Episodes';

export function Shows() {
  const { api } = useAuth();
  const [status, setStatus] = useState('');
  const resource = useResource(
    useCallback((signal: AbortSignal) => api.shows(signal), [api]),
  );
  return (
    <>
      <PageHeader
        title="Your shows"
        description="A home for every idea worth sharing."
        action={<ActionLink to="/shows/new">Create a show</ActionLink>}
      />
      <label className="show-selector">
        Filter show status
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {['draft', 'published', 'archived'].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </label>
      {resource.loading ? (
        <Loading label="Loading shows…" />
      ) : resource.error ? (
        <ErrorNotice message={resource.error} retry={resource.retry} />
      ) : resource.data?.items.length ? (
        <div className="show-grid">
          {status && !resource.data.items.some((s) => s.status === status) && (
            <p>No shows match this status.</p>
          )}
          {resource.data.items
            .filter((show) => !status || show.status === status)
            .map((show) => (
              <Link
                className="panel show-card"
                key={show.id}
                to={`/shows/${show.id}`}
              >
                <span className="show-art">
                  <Radio size={40} />
                </span>
                <span className="badge">{show.status}</span>
                <h2>{show.title}</h2>
                <p>
                  {show.description || 'Add a description to tell your story.'}
                </p>
                <span className="text-link">
                  Manage show <ArrowUpRight size={16} />
                </span>
              </Link>
            ))}
        </div>
      ) : (
        <EmptyState
          title="Make room for your first show"
          action={<ActionLink to="/shows/new">Create a show</ActionLink>}
        >
          Start with a title and a short description. Your show stays a draft
          while you build it.
        </EmptyState>
      )}
    </>
  );
}
export function NewShow() {
  const { api } = useAuth();
  const navigate = useNavigate();
  return (
    <>
      <Link className="back-link" to="/shows">
        ← All shows
      </Link>
      <PageHeader
        title="Create a show"
        description="Big conversations begin with a small first step."
      />
      <PodcastForm
        kind="show"
        onSave={async (draft) => {
          const { show } = await api.createShow(draft);
          navigate(`/shows/${show.id}`, {
            replace: true,
            state: { created: true },
          });
        }}
        onCancel={() => navigate('/shows')}
      />
    </>
  );
}
export function ShowDetail() {
  const { id = '' } = useParams();
  const { api, user } = useAuth();
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);
  const resource = useResource(
    useCallback((signal: AbortSignal) => api.show(id, signal), [api, id]),
  );
  if (resource.loading) return <Loading label="Loading show…" />;
  if (resource.error)
    return <ErrorNotice message={resource.error} retry={resource.retry} />;
  if (!resource.data) return null;
  const { show } = resource.data;
  return (
    <>
      <Link className="back-link" to="/shows">
        ← All shows
      </Link>
      <PageHeader
        eyebrow={`${show.status.toUpperCase()} / ${show.owner_id === user?.id ? 'YOUR SHOW' : 'SHARED SHOW'}`}
        title={show.title}
        description="Shape your show and build its next episode."
      />
      {saved && (
        <p className="notice success" role="status">
          Show saved.
        </p>
      )}
      <PodcastForm
        key={show.updated_at}
        kind="show"
        initial={show}
        onSave={async (draft) => {
          await api.updateShow(id, draft);
          setSaved(true);
          resource.retry();
        }}
      />
      <ShowFeed
        key={show.updated_at}
        showId={show.id}
        onChange={resource.retry}
      />
      <Seasons showId={show.id} owner={show.owner_id === user?.id} />
      <EpisodeList show={show} />
      {show.status === 'draft' &&
        !show.published_at &&
        show.owner_id === user?.id && (
          <DeleteRecord
            kind="show"
            title={show.title}
            onDelete={async () => {
              await api.deleteShow(id);
              navigate('/shows', { replace: true });
            }}
          />
        )}
    </>
  );
}

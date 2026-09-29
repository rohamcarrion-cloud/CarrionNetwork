import { useCallback } from 'react';
import { Link } from 'react-router';
import { Radio, FileText, Users, ArrowUpRight } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import {
  ActionLink,
  EmptyState,
  ErrorNotice,
  Loading,
  PageHeader,
  useResource,
} from '../components/ui';

export function Dashboard() {
  const { api, user } = useAuth();
  const resource = useResource(
    useCallback((signal: AbortSignal) => api.shows(signal), [api]),
  );
  return (
    <>
      <PageHeader
        eyebrow="YOUR CREATIVE HOME"
        title={`Welcome back, ${user?.display_name}.`}
        description="Your next great conversation starts with an idea."
        action={<ActionLink to="/shows/new">Create a show</ActionLink>}
      />
      <section className="hero panel">
        <div>
          <span className="badge">MAKE SOMETHING THAT MATTERS</span>
          <h2>
            Your voice.
            <br />
            <span>Your next chapter.</span>
          </h2>
          <p>
            Bring your ideas together. Shape a show.
            <br />
            Start drafting the stories only you can tell.
          </p>
          <Link className="text-link" to="/shows">
            Open your shows <ArrowUpRight size={18} />
          </Link>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <Radio size={100} strokeWidth={1} />
        </div>
      </section>
      {resource.loading ? (
        <Loading />
      ) : resource.error ? (
        <ErrorNotice message={resource.error} retry={resource.retry} />
      ) : (
        resource.data && (
          <>
            <section className="stats" aria-label="Show overview">
              {[
                {
                  label: 'Your shows',
                  value: resource.data.items.length,
                  icon: Radio,
                },
                {
                  label: 'Show drafts',
                  value: resource.data.items.filter(
                    (show) => show.status === 'draft',
                  ).length,
                  icon: FileText,
                },
                {
                  label: 'Shared with you',
                  value: resource.data.items.filter(
                    (show) => show.owner_id !== user?.id,
                  ).length,
                  icon: Users,
                },
              ].map(({ label, value, icon: Icon }) => (
                <div className="panel stat" key={label}>
                  <Icon size={20} />
                  <strong>{value}</strong>
                  <span>{label}</span>
                </div>
              ))}
            </section>
            <div className="section-heading">
              <h2>Recent shows</h2>
              <Link to="/shows">View all shows →</Link>
            </div>
            {resource.data.items.length ? (
              <div className="show-grid">
                {resource.data.items.slice(0, 3).map((show) => (
                  <Link
                    className="panel show-card"
                    key={show.id}
                    to={`/shows/${show.id}`}
                  >
                    <span className="show-art">
                      <Radio size={36} />
                    </span>
                    <span className="badge">{show.status}</span>
                    <h3>{show.title}</h3>
                    <p>{show.description || 'A new story is taking shape.'}</p>
                    <span className="text-link">
                      Open show <ArrowUpRight size={16} />
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState
                title="Your first show starts here"
                action={
                  <ActionLink to="/shows/new">
                    Create your first show
                  </ActionLink>
                }
              >
                Give your show a name and start shaping its story. You can add
                episode drafts as you go.
              </EmptyState>
            )}
          </>
        )
      )}
    </>
  );
}

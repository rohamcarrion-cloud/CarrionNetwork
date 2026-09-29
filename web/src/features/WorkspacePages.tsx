import { useCallback } from 'react';
import { useAuth } from '../auth/AuthProvider';
import {
  ActionLink,
  EmptyState,
  ErrorNotice,
  Loading,
  PageHeader,
  useResource,
} from '../components/ui';

export const futureModules = {
  distribution: {
    title: 'Distribution',
    headline: 'Your stories, ready for the world',
    description:
      'RSS feeds and podcast directory distribution will arrive with publishing. Keep building your show and episode drafts in the meantime.',
  },
  analytics: {
    title: 'Analytics',
    headline: 'Understand the impact of your voice',
    description:
      'Listening insights will become available after publishing and playback measurement are connected. There is no audience data to report yet.',
  },
  audience: {
    title: 'Audience',
    headline: 'Conversations build community',
    description:
      'Listener and subscription tools are planned for a future milestone. Today, focus on the shows your audience will come for.',
  },
  monetization: {
    title: 'Monetization',
    headline: 'Make room for what comes next',
    description:
      'Creator revenue tools are planned for a future milestone. Payments, subscriptions, and sponsorships are not available yet.',
  },
};
export function FutureModule({
  module,
}: {
  module: keyof typeof futureModules;
}) {
  const content = futureModules[module];
  return (
    <>
      <PageHeader
        title={content.title}
        description="The next chapter of your creator workspace."
      />
      <span className="badge planned">PLANNED · NOT AVAILABLE YET</span>
      <EmptyState
        title={content.headline}
        action={<ActionLink to="/shows">Back to your shows</ActionLink>}
      >
        {content.description}
      </EmptyState>
    </>
  );
}
export function Settings() {
  const { user, api } = useAuth();
  const health = useResource(
    useCallback((signal: AbortSignal) => api.health(signal), [api]),
  );
  return (
    <>
      <PageHeader
        title="Settings"
        description="Your creator identity and workspace connection."
      />
      <section className="panel settings-panel">
        <h2>Creator profile</h2>
        <dl>
          <dt>Display name</dt>
          <dd>{user?.display_name}</dd>
          <dt>Email address</dt>
          <dd>{user?.email}</dd>
        </dl>
        <p>Profile editing and password changes are not available yet.</p>
      </section>
      <section className="panel settings-panel">
        <h2>API connection</h2>
        {health.loading ? (
          <Loading label="Checking the connection…" />
        ) : health.error ? (
          <ErrorNotice message={health.error} retry={health.retry} />
        ) : (
          <>
            <p className="connection">
              <span className="status-dot" />
              Connected to Carrion Network
            </p>
            <button className="button secondary" onClick={health.retry}>
              Check again
            </button>
          </>
        )}
      </section>
      <section className="panel settings-panel">
        <h2>Your session</h2>
        <p>
          Your sign-in is restored when you reload this tab. Sign out from the
          sidebar when you finish on a shared device.
        </p>
      </section>
    </>
  );
}

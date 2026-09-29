import { useCallback, useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { ErrorNotice, Loading, useResource } from '../components/ui';
export function ShowFeed({
  showId,
  onChange,
}: {
  showId: string;
  onChange: () => void;
}) {
  const { api } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const state = useResource(
    useCallback(
      (signal: AbortSignal) => api.feed(showId, signal),
      [api, showId],
    ),
  );
  async function enable() {
    setBusy(true);
    setError('');
    try {
      await api.enableFeed(showId);
      onChange();
      state.retry();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(state.data!.feed_url!);
      setCopied(true);
      setError('');
    } catch {
      setError('Could not copy. Select and copy the feed URL below.');
    }
  }
  return (
    <section className="panel episode-meta" aria-label="RSS publishing">
      <h2>RSS publishing</h2>
      {state.loading ? (
        <Loading label="Checking feed readiness…" />
      ) : state.error ? (
        <ErrorNotice message={state.error} retry={state.retry} />
      ) : (
        state.data && (
          <>
            <p role="status">
              {!state.data.ready
                ? 'Feed needs attention'
                : !state.data.enabled
                  ? 'Ready to enable RSS'
                  : state.data.published_episodes
                    ? 'Feed ready'
                    : 'No published Episodes yet'}
            </p>
            <p>
              {state.data.published_episodes} published Episodes eligible for
              RSS.
            </p>
            {state.data.feed_url && (
              <label>
                RSS Feed URL
                <input
                  readOnly
                  value={state.data.feed_url}
                  onFocus={(e) => e.target.select()}
                />
              </label>
            )}
            {state.data.issues.length > 0 && (
              <ul>
                {state.data.issues.map((i) => (
                  <li key={i.field}>{i.message}</li>
                ))}
              </ul>
            )}
            {!!state.data.warnings?.length && (
              <ul>
                {state.data.warnings.map((i) => (
                  <li key={i.field}>
                    Optional Episode artwork omitted: {i.message}
                  </li>
                ))}
              </ul>
            )}
            {error && <ErrorNotice message={error} />}
            {copied && <p role="status">Feed URL copied.</p>}
            <div className="form-actions">
              {state.data.feed_url && (
                <button
                  type="button"
                  className="button secondary"
                  onClick={copy}
                >
                  Copy Feed URL
                </button>
              )}
              {state.data.enabled &&
                state.data.ready &&
                state.data.feed_url && (
                  <a
                    className="button secondary"
                    href={state.data.feed_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View Feed
                  </a>
                )}
              {!state.data.enabled && (
                <button
                  type="button"
                  className="button"
                  disabled={busy || !state.data.ready}
                  onClick={enable}
                >
                  {busy ? 'Enabling…' : 'Enable RSS'}
                </button>
              )}
            </div>
            <p>
              Enabling RSS publishes saved Show details and artwork. Published
              Episodes appear automatically. Archiving the Show hides the feed;
              unpublishing an Episode removes it. Existing media links remain
              available.
            </p>
            <p>
              RSS artwork requires square JPEG or PNG, 1400–3000 pixels, RGB
              with no transparency. An empty feed is allowed; directory
              submission needs published Episodes and a publicly reachable host.
              Directory submission is not included.
            </p>
          </>
        )
      )}
    </section>
  );
}

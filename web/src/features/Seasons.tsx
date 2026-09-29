import { useCallback, useState, type FormEvent } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { useResource, ErrorNotice, Loading } from '../components/ui';
export function Seasons({ showId, owner }: { showId: string; owner: boolean }) {
  const { api } = useAuth();
  const resource = useResource(
    useCallback(
      (signal: AbortSignal) => api.seasons(showId, signal),
      [api, showId],
    ),
  );
  const [title, setTitle] = useState('');
  const [number, setNumber] = useState('1');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.createSeason(showId, { title, season_number: Number(number) });
      setTitle('');
      resource.retry();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel draft-form">
      <h2>Seasons (optional)</h2>
      <p>Episodes can belong directly to this show or to a season.</p>
      {error && <ErrorNotice message={error} />}
      {resource.error && (
        <ErrorNotice message={resource.error} retry={resource.retry} />
      )}
      {resource.loading ? (
        <Loading label="Loading seasons…" />
      ) : (
        resource.data?.items.map((s) => (
          <p key={s.id}>
            {s.season_number}. {s.title}{' '}
            {owner && (
              <button
                type="button"
                disabled={busy}
                className="button secondary"
                onClick={async () => {
                  setBusy(true);
                  setError('');
                  try {
                    await api.deleteSeason(s.id);
                    resource.retry();
                  } catch (e) {
                    setError((e as Error).message);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                Remove empty season {s.season_number}
              </button>
            )}
          </p>
        ))
      )}
      <form onSubmit={submit}>
        <fieldset disabled={busy}>
          <label>
            Season title
            <input
              required
              maxLength={200}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>
          <label>
            Season number
            <input
              required
              type="number"
              min="1"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
            />
          </label>
          <button className="button">Add season</button>
        </fieldset>
      </form>
    </section>
  );
}

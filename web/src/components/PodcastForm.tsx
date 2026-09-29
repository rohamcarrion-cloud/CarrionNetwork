import { useState, type FormEvent } from 'react';
import type { PodcastInput, Season } from '../api/types';
import { CoverPicker } from '../features/Media';
import { ErrorNotice } from './ui';

export function PodcastForm({
  initial,
  kind,
  onSave,
  onCancel,
  seasons = [],
}: {
  initial?: PodcastInput;
  seasons?: Season[];
  kind: 'show' | 'episode';
  onSave: (draft: PodcastInput) => Promise<void>;
  onCancel?: () => void;
}) {
  const [title, setTitle] = useState(initial?.title || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [metadata, setMetadata] = useState<Partial<PodcastInput>>({});
  const value = (key: keyof PodcastInput, fallback = '') =>
    String(
      metadata[key] !== undefined
        ? (metadata[key] ?? '')
        : (initial?.[key] ?? fallback),
    );
  const update = (key: keyof PodcastInput, value: unknown) =>
    setMetadata((current) => ({ ...current, [key]: value }));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    if (!title.trim()) {
      setError('Please enter a title.');
      return;
    }
    setBusy(true);
    try {
      await onSave({
        ...metadata,
        title: title.trim(),
        description: description.trim(),
      });
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="panel draft-form" onSubmit={submit}>
      <h2>{initial ? `Edit ${kind}` : `Your ${kind} details`}</h2>
      <p>You can keep refining these details as your idea takes shape.</p>
      {error && <ErrorNotice message={error} />}
      <fieldset disabled={busy}>
        <label>
          Title
          <input
            name="title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
            maxLength={kind === 'show' ? 200 : 250}
            placeholder={
              kind === 'show'
                ? 'Give your show a name'
                : 'What is this episode about?'
            }
          />
        </label>
        <label>
          Description
          <textarea
            name="description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={5000}
            rows={6}
            placeholder="Tell the story behind your idea…"
          />
        </label>
        <small>{description.length.toLocaleString()} / 5,000 characters</small>
        <CoverPicker
          id={value('cover_asset_id')}
          onChange={(id) => update('cover_asset_id', id)}
          kind={kind}
        />
        <label>
          Status
          <select
            value={value('status', 'draft')}
            onChange={(e) => update('status', e.target.value)}
          >
            <option
              value="draft"
              disabled={
                !!initial?.published_at || initial?.status === 'published'
              }
            >
              Draft
            </option>
            {kind === 'episode' && (
              <option
                value="scheduled"
                disabled={
                  !!initial?.published_at || initial?.status === 'published'
                }
              >
                Scheduled
              </option>
            )}
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </label>
        <small>
          Status records editorial intent. Public feeds and distribution are not
          available yet.
        </small>
        {kind === 'episode' && (
          <>
            <label>
              Season
              <select
                value={value('season_id')}
                onChange={(e) => update('season_id', e.target.value || null)}
              >
                <option value="">No season</option>
                {seasons.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.season_number}. {s.title}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Episode number
              <input
                type="number"
                min="1"
                value={value('episode_number')}
                onChange={(e) =>
                  update(
                    'episode_number',
                    e.target.value ? Number(e.target.value) : null,
                  )
                }
              />
            </label>
            <label>
              Episode type
              <select
                value={value('episode_type', 'full')}
                onChange={(e) => update('episode_type', e.target.value)}
              >
                {['full', 'trailer', 'bonus'].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </label>
            <label>
              Publish date and time (your local time)
              <input
                type="datetime-local"
                value={
                  value('publish_at')
                    ? (() => {
                        const d = new Date(value('publish_at'));
                        return new Date(
                          d.getTime() - d.getTimezoneOffset() * 60000,
                        )
                          .toISOString()
                          .slice(0, 16);
                      })()
                    : ''
                }
                onChange={(e) =>
                  update(
                    'publish_at',
                    e.target.value
                      ? new Date(e.target.value).toISOString()
                      : null,
                  )
                }
              />
            </label>
          </>
        )}
        <label>
          Explicit content
          <select
            value={value('explicit', kind === 'show' ? 'false' : '')}
            onChange={(e) =>
              update(
                'explicit',
                e.target.value === '' ? null : e.target.value === 'true',
              )
            }
          >
            {kind === 'episode' && <option value="">Inherit from show</option>}
            <option value="false">Clean</option>
            <option value="true">Explicit</option>
          </select>
        </label>
        <details>
          <summary>More podcast details</summary>
          <label>
            Slug
            <input
              value={value('slug')}
              onChange={(e) => update('slug', e.target.value)}
              maxLength={80}
              placeholder="Generated from title when creating"
            />
          </label>
          {kind === 'show' && (
            <>
              {(
                [
                  'short_description',
                  'author',
                  'language',
                  'category',
                  'website_url',
                  'copyright',
                ] as const
              ).map((key) => (
                <label key={key}>
                  {
                    {
                      short_description: 'Short summary',
                      author: 'Author / creator',
                      language: 'Language',
                      category: 'Category',
                      website_url: 'Website URL',
                      copyright: 'Copyright',
                    }[key]
                  }
                  <input
                    value={value(key, key === 'language' ? 'en' : '')}
                    onChange={(e) => update(key, e.target.value)}
                  />
                </label>
              ))}
              <label>
                Show type
                <select
                  value={value('show_type', 'episodic')}
                  onChange={(e) => update('show_type', e.target.value)}
                >
                  <option value="episodic">Episodic</option>
                  <option value="serial">Serial</option>
                </select>
              </label>
            </>
          )}
        </details>
        <div className="form-actions">
          <button className="button" disabled={busy}>
            {busy ? 'Saving…' : initial ? 'Save changes' : `Create ${kind}`}
          </button>
          {onCancel && (
            <button
              className="button secondary"
              type="button"
              onClick={onCancel}
            >
              Cancel
            </button>
          )}
        </div>
      </fieldset>
    </form>
  );
}
export function DeleteRecord({
  kind,
  title,
  onDelete,
}: {
  kind: 'show' | 'episode';
  title: string;
  onDelete: () => Promise<void>;
}) {
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function remove() {
    setBusy(true);
    setError('');
    try {
      await onDelete();
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel danger-zone">
      <h2>Delete {kind}</h2>
      <p>
        {kind === 'show'
          ? 'Only empty draft shows can be deleted. Archive shows you want to retain.'
          : 'Only draft episodes can be deleted. Archive published episodes to retain their identity.'}
      </p>
      {error && <ErrorNotice message={error} />}
      {confirm ? (
        <div role="group" aria-label={`Confirm delete ${kind}`}>
          <p>Delete “{title}”? This cannot be undone.</p>
          <div className="form-actions">
            <button className="button danger" disabled={busy} onClick={remove}>
              {busy ? 'Deleting…' : `Confirm delete ${kind}`}
            </button>
            <button
              className="button secondary"
              disabled={busy}
              onClick={() => setConfirm(false)}
            >
              Keep {kind}
            </button>
          </div>
        </div>
      ) : (
        <button className="button danger" onClick={() => setConfirm(true)}>
          Delete {kind}
        </button>
      )}
    </section>
  );
}

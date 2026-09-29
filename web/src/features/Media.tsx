import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import type { MediaAsset } from '../api/types';
import { ErrorNotice, PageHeader } from '../components/ui';

export function ImagePreview({
  id,
  alt = 'Selected cover',
}: {
  id: string;
  alt?: string;
}) {
  const { api, user } = useAuth();
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    let objectUrl = '';
    setUrl('');
    setError('');
    api
      .image(user!.id, id, controller.signal)
      .then((blob) => {
        if (controller.signal.aborted) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch((error) => {
        if (!controller.signal.aborted) setError(error.message);
      });
    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [api, user, id]);
  return error ? (
    <small>{error}</small>
  ) : url ? (
    <img className="media-preview" src={url} alt={alt} />
  ) : (
    <small>Loading image…</small>
  );
}
function AssetCard({
  asset,
  onSelect,
  refresh,
}: {
  asset: MediaAsset;
  onSelect?: (id: string) => void;
  refresh: () => void;
}) {
  const { api, user } = useAuth();
  const [alt, setAlt] = useState(asset.alt_text),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [confirm, setConfirm] = useState(false),
    [saved, setSaved] = useState(false);
  async function act(remove: boolean) {
    setBusy(true);
    setError('');
    setSaved(false);
    try {
      if (remove) {
        await api.deleteAsset(user!.id, asset.id);
        refresh();
      } else {
        await api.updateAsset(user!.id, asset.id, alt);
        setSaved(true);
      }
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <article className="panel media-card">
      <ImagePreview
        id={asset.id}
        alt={asset.alt_text || asset.original_filename}
      />
      <strong>{asset.original_filename}</strong>
      <small>
        {asset.width} × {asset.height} ·{' '}
        {(Number(asset.size_bytes) / 1024).toFixed(1)} KiB
      </small>
      <small>{new Date(asset.created_at).toLocaleDateString()}</small>
      {onSelect ? (
        <button
          type="button"
          className="button secondary"
          onClick={() => onSelect(asset.id)}
        >
          Select {asset.original_filename}
        </button>
      ) : (
        <>
          <label>
            Alt text for {asset.original_filename}
            <textarea
              maxLength={2000}
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
            />
          </label>
          <button
            type="button"
            className="button secondary"
            disabled={busy}
            onClick={() => void act(false)}
          >
            Save alt text
          </button>
          {saved && <small role="status">Alt text saved</small>}
          <button
            type="button"
            className="button danger"
            disabled={busy}
            onClick={() => (confirm ? void act(true) : setConfirm(true))}
          >
            {confirm ? 'Confirm delete image' : 'Delete image'}
          </button>
          {confirm && (
            <button type="button" onClick={() => setConfirm(false)}>
              Keep image
            </button>
          )}
        </>
      )}
      {error && <ErrorNotice message={error} />}
    </article>
  );
}
export function MediaLibrary({
  onSelect,
}: {
  onSelect?: (id: string) => void;
}) {
  const { api, user } = useAuth();
  const [items, setItems] = useState<MediaAsset[]>([]),
    [offset, setOffset] = useState(0),
    [sort, setSort] = useState('created_at'),
    [more, setMore] = useState(false),
    [version, setVersion] = useState(0),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(true);
  const refresh = () => setVersion((v) => v + 1);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    api
      .media(user!.id, offset, sort, controller.signal)
      .then((result) => {
        setItems(result.items);
        setMore(result.pagination.has_more);
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [api, user, offset, sort, version]);
  async function upload(file?: File) {
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      if (file.size > 10 * 1024 * 1024)
        throw new Error('Maximum upload is 10 MiB');
      const { asset } = await api.uploadImage(user!.id, file);
      if (onSelect) onSelect(asset.id);
      else {
        setOffset(0);
        refresh();
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section aria-label="Media Library">
      {!onSelect && (
        <PageHeader
          title="Media Library"
          description="Reusable images for your shows and episodes."
        />
      )}
      <label>
        Upload image
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={busy}
          onChange={(e) => {
            void upload(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
      </label>
      <p>
        JPEG, PNG or WebP · up to 10 MiB · 10,000 pixels per side · 40
        megapixels · still images only.
      </p>
      {busy && <p role="status">Uploading image…</p>}
      {error && <ErrorNotice message={error} retry={refresh} />}
      <label>
        Sort images
        <select
          value={sort}
          onChange={(e) => {
            setSort(e.target.value);
            setOffset(0);
          }}
        >
          <option value="created_at">Newest first</option>
          <option value="original_filename">Filename (Z–A)</option>
          <option value="size_bytes">Largest first</option>
        </select>
      </label>
      {loading ? (
        <p role="status">Loading images…</p>
      ) : (
        <>
          <div className="media-grid">
            {items.map((asset) => (
              <AssetCard
                key={asset.id}
                asset={asset}
                onSelect={onSelect}
                refresh={refresh}
              />
            ))}
          </div>
          {!items.length && <p>No images yet. Upload your first image.</p>}
        </>
      )}
      <div className="form-actions">
        <button
          type="button"
          disabled={loading || offset === 0}
          onClick={() => setOffset(Math.max(0, offset - 24))}
        >
          Previous images
        </button>
        <button
          type="button"
          disabled={loading || !more}
          onClick={() => setOffset(offset + 24)}
        >
          Next images
        </button>
      </div>
    </section>
  );
}
export function CoverPicker({
  id,
  onChange,
  kind,
}: {
  id: string;
  onChange: (id: string | null) => void;
  kind: 'show' | 'episode';
}) {
  const [open, setOpen] = useState(false);
  return (
    <section className="cover-picker" aria-label={`${kind} cover`}>
      <h3>Cover image</h3>
      {id ? (
        <>
          <ImagePreview id={id} />
          <button type="button" onClick={() => onChange(null)}>
            Remove cover
          </button>
        </>
      ) : (
        <p>
          {kind === 'episode'
            ? 'No custom cover. Show artwork will be the future publishing fallback.'
            : 'No cover selected.'}
        </p>
      )}
      <button
        type="button"
        className="button secondary"
        onClick={() => setOpen(!open)}
      >
        {open ? 'Close image picker' : 'Choose or upload cover'}
      </button>
      {open && (
        <MediaLibrary
          onSelect={(id) => {
            onChange(id);
            setOpen(false);
          }}
        />
      )}
    </section>
  );
}

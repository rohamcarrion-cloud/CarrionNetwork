import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { pool, query } from './db.js';
import { filesystemStorage } from './storage.js';
import { categories, xmlText, publicBase, generateFeed } from './rss.js';
const fail = (status, message, issues) => {
  throw Object.assign(new Error(message), {
    status,
    issues,
    kind: 'feed_not_ready',
  });
};
async function artwork(q, id, workspaceId, field, issues) {
  const a = (
    await q(
      "SELECT * FROM media_assets WHERE id=$1 AND workspace_id=$2 AND asset_type='image'",
      [id, workspaceId],
    )
  ).rows[0];
  const issue = (message) => issues.push({ field, message });
  if (!a) {
    issue('Add Show artwork before enabling RSS.');
    return null;
  }
  if (
    a.state !== 'ready' ||
    !['image/jpeg', 'image/png'].includes(a.mime_type) ||
    a.width !== a.height ||
    a.width < 1400 ||
    a.width > 3000
  ) {
    issue('RSS artwork must be a square JPEG or PNG, 1400–3000 pixels.');
    return null;
  }
  try {
    const bytes = await filesystemStorage().get(a.storage_key);
    const meta = await sharp(bytes).metadata();
    if (
      bytes.length !== Number(a.size_bytes) ||
      meta.hasAlpha ||
      meta.space !== 'srgb'
    )
      throw Error();
  } catch {
    issue('RSS artwork must be available, RGB, and have no alpha channel.');
    return null;
  }
  return a;
}
export async function inspectFeed(q, show) {
  const issues = [];
  const warnings = [];
  let base;
  try {
    base = publicBase();
  } catch (e) {
    issues.push({ field: 'configuration', message: e.message });
  }
  if (show.status === 'archived')
    issues.push({
      field: 'status',
      message: 'Restore this archived Show before enabling its feed.',
    });
  for (const field of [
    'title',
    'description',
    'author',
    'language',
    'website_url',
  ])
    if (!xmlText(show[field]).trim())
      issues.push({
        field,
        message: `Add the Show ${field.replaceAll('_', ' ')}.`,
      });
  if (Buffer.byteLength(xmlText(show.description)) > 4000)
    issues.push({
      field: 'description',
      message: 'RSS Show description must be at most 4,000 UTF-8 bytes.',
    });
  if (!categories.includes(show.category))
    issues.push({
      field: 'category',
      message: `Choose an RSS category: ${categories.join(', ')}.`,
    });
  const cover = await artwork(
    q,
    show.cover_asset_id,
    show.workspace_id,
    'cover_asset_id',
    issues,
  );
  const items = (
    await q(
      `SELECT p.*,r.mime_type,r.size_bytes,r.duration_seconds FROM episode_publications p
    JOIN episodes e ON e.id=p.episode_id JOIN publishable_media r ON r.id=p.representation_id
    WHERE e.show_id=$1 AND p.active AND e.status='published' AND r.state='ready'
    ORDER BY p.published_at DESC,p.guid`,
      [show.id],
    )
  ).rows;
  const covers = new Map();
  if (cover) covers.set(cover.id, cover);
  for (const p of items) {
    if (show.show_type === 'serial' && !p.episode_number)
      issues.push({
        field: `episode.${p.guid}`,
        message: `Published episode “${p.title}” needs an episode number for a serial feed. Its snapshot is retained; use an episodic Show until edition updates are supported.`,
      });
    if (p.cover_asset_id && !covers.has(p.cover_asset_id)) {
      const a = await artwork(
        q,
        p.cover_asset_id,
        show.workspace_id,
        `episode.${p.guid}.artwork`,
        warnings,
      );
      if (a) covers.set(a.id, a);
    }
  }
  return { issues, warnings, base, items, covers };
}
export async function prepareFeed(q, show) {
  const state = await inspectFeed(q, show);
  if (state.issues.length)
    fail(422, state.issues.map((i) => i.message).join(' '), state.issues);
  for (const a of state.covers.values()) {
    await q(
      `INSERT INTO public_artwork(id,workspace_id,source_media_asset_id,storage_key,mime_type,size_bytes,width,height)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT(source_media_asset_id) DO NOTHING`,
      [
        randomUUID(),
        show.workspace_id,
        a.id,
        a.storage_key,
        a.mime_type,
        a.size_bytes,
        a.width,
        a.height,
      ],
    );
  }
}
export async function feedState(show) {
  const { issues, warnings, base, items } = await inspectFeed(query, show);
  return {
    feed_url: base ? `${base}/feeds/${show.feed_id}.xml` : null,
    enabled: show.feed_enabled,
    ready: issues.length === 0,
    issues,
    warnings,
    published_episodes: items.length,
  };
}
export async function enableFeed(id) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const q = client.query.bind(client);
    const show = (await q('SELECT * FROM shows WHERE id=$1 FOR UPDATE', [id]))
      .rows[0];
    if (!show) fail(404, 'Show not found');
    await prepareFeed(q, show);
    const updated = (
      await q(
        "UPDATE shows SET feed_enabled=true,status='published',updated_at=CASE WHEN feed_enabled AND status='published' THEN updated_at ELSE now() END WHERE id=$1 RETURNING *",
        [id],
      )
    ).rows[0];
    await client.query('COMMIT');
    return feedState(updated);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
export async function readFeed(feedId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
    const q = client.query.bind(client);
    const show = (
      await q(
        "SELECT * FROM shows WHERE feed_id=$1 AND feed_enabled AND status='published'",
        [feedId],
      )
    ).rows[0];
    if (!show) fail(404, 'Feed not found');
    // Public reads never create representations or reveal private validation details.
    const items = (
      await q(
        `SELECT p.*,r.mime_type,r.size_bytes,r.duration_seconds,
      CASE WHEN a.id IS NOT NULL THEN json_build_object('id',a.id,'mime_type',a.mime_type,'created_at',a.created_at) END AS artwork
      FROM episode_publications p JOIN episodes e ON e.id=p.episode_id
      JOIN publishable_media r ON r.id=p.representation_id
      LEFT JOIN public_artwork a ON a.source_media_asset_id=p.cover_asset_id AND a.workspace_id=p.workspace_id
      WHERE e.show_id=$1 AND p.active AND e.status='published' AND r.state='ready'
      ORDER BY p.published_at DESC,p.guid`,
        [show.id],
      )
    ).rows;
    show.artwork = (
      await q(
        'SELECT id,mime_type,created_at FROM public_artwork WHERE source_media_asset_id=$1 AND workspace_id=$2',
        [show.cover_asset_id, show.workspace_id],
      )
    ).rows[0];
    if (!show.artwork) fail(503, 'Feed temporarily unavailable');
    const last = (
      await q(
        `SELECT greatest($2::timestamptz, max(p.updated_at)) AS changed FROM episode_publications p JOIN episodes e ON e.id=p.episode_id WHERE e.show_id=$1`,
        [show.id, show.updated_at],
      )
    ).rows[0].changed;
    const changed = new Date(
      Math.max(
        last.getTime(),
        new Date(show.artwork.created_at).getTime(),
        ...items
          .filter((p) => p.artwork)
          .map((p) => new Date(p.artwork.created_at).getTime()),
      ),
    );
    const result = generateFeed(show, items, publicBase(), changed);
    await q('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
export async function publicArtwork(id, extension) {
  const row = (await query('SELECT * FROM public_artwork WHERE id=$1', [id]))
    .rows[0];
  if (!row || extension !== (row.mime_type === 'image/png' ? 'png' : 'jpg'))
    fail(404, 'Artwork not found');
  try {
    if (
      (await filesystemStorage().stat(row.storage_key)).size !==
      Number(row.size_bytes)
    )
      throw Error();
  } catch {
    fail(503, 'Artwork temporarily unavailable');
  }
  return row;
}

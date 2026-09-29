import sharp from 'sharp';
import { audioLimit, validateAudio } from './audio.js';
import { randomUUID } from 'node:crypto';
import { query } from './db.js';
import { filesystemStorage } from './storage.js';
const fail = (status, message) => {
  throw Object.assign(new Error(message), { status });
};
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const formats = { jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };

// Future resizing/cropping/variants belong here, independently of podcast logic.
export async function validateImage(bytes, mime) {
  if (!Object.values(formats).includes(mime))
    fail(415, 'Use JPEG, PNG or WebP images');
  if (!bytes.length || bytes.length > MAX_IMAGE_BYTES)
    fail(413, 'Image must be 1 byte to 10 MiB');
  try {
    const image = sharp(bytes, {
      limitInputPixels: 40_000_000,
      failOn: 'warning',
    });
    const meta = await image.metadata();
    if (
      formats[meta.format] !== mime ||
      (meta.pages || 1) !== 1 ||
      !meta.width ||
      !meta.height ||
      meta.width > 10000 ||
      meta.height > 10000
    )
      fail(
        400,
        'Invalid image format or dimensions (maximum 10,000 pixels per side; no animation)',
      );
    // Decode all pixels so truncated/corrupt images cannot pass a header-only check.
    await image.stats();
    return { width: meta.width, height: meta.height };
  } catch (error) {
    if (error.status) throw error;
    fail(400, 'Invalid or oversized image');
  }
}
export async function workspace(id, user) {
  if (
    !(
      await query('SELECT id FROM workspaces WHERE id=$1 AND owner_id=$2', [
        id,
        user.id,
      ])
    ).rowCount
  )
    fail(404, 'Workspace not found');
}
export async function asset(id, workspaceId) {
  const row = (
    await query(
      "SELECT * FROM media_assets WHERE id=$1 AND workspace_id=$2 AND asset_type IN ('image','audio')",
      [id, workspaceId],
    )
  ).rows[0];
  if (!row) fail(404, 'Media asset not found');
  return row;
}
let activeUploads = 0;
export async function upload(request, workspaceId, filename) {
  if (activeUploads >= 2)
    fail(503, 'Upload capacity reached. Try again shortly.');
  activeUploads++;
  try {
    return await uploadAsset(request, workspaceId, filename);
  } finally {
    activeUploads--;
  }
}
async function uploadAsset(request, workspaceId, filename) {
  const mime = request.headers['content-type']
    ?.split(';')[0]
    .trim()
    .toLowerCase();
  const audio = mime === 'audio/mpeg';
  if (!audio && !Object.values(formats).includes(mime))
    fail(415, 'Use JPEG, PNG, WebP or MP3');
  const limit = audio ? audioLimit() : MAX_IMAGE_BYTES;
  if (Number(request.headers['content-length']) > limit)
    fail(413, `Maximum upload is ${limit} bytes`);
  const chunks = [];
  let size = 0;
  for await (const chunk of request.iterator({ destroyOnReturn: false })) {
    size += chunk.length;
    if (size > limit) {
      request.resume();
      fail(413, `Maximum upload is ${limit} bytes`);
    }
    chunks.push(chunk);
  }
  const bytes = Buffer.concat(chunks);
  chunks.length = 0;
  const metadata = audio
    ? await validateAudio(bytes, mime)
    : await validateImage(bytes, mime);
  const { width = null, height = null, duration_seconds = null } = metadata;
  const name =
    (filename || (audio ? 'audio.mp3' : 'image'))
      .split(/[\\/]/)
      .pop()
      .replace(/[\x00-\x1f\x7f]/g, '')
      .trim()
      .slice(0, 255) || (audio ? 'audio.mp3' : 'image');
  const id = randomUUID(),
    key = randomUUID(),
    storage = filesystemStorage();
  await storage.put(key, bytes);
  try {
    return (
      await query(
        'INSERT INTO media_assets(id,workspace_id,original_filename,storage_key,mime_type,size_bytes,width,height,asset_type,duration_seconds) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *',
        [
          id,
          workspaceId,
          name,
          key,
          mime,
          size,
          width,
          height,
          audio ? 'audio' : 'image',
          duration_seconds,
        ],
      )
    ).rows[0];
  } catch (error) {
    await storage.delete(key);
    throw error;
  }
}
export async function listAssets(workspaceId, params) {
  const limit = Number(params.get('limit') || 24),
    offset = Number(params.get('offset') || 0);
  const sort = params.get('sort') || 'created_at',
    direction = params.get('direction') || 'desc';
  if (
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 100 ||
    !Number.isSafeInteger(offset) ||
    offset < 0 ||
    !['created_at', 'original_filename', 'size_bytes'].includes(sort) ||
    !['asc', 'desc'].includes(direction)
  )
    fail(400, 'Invalid pagination or sorting');
  const type = params.get('type') || 'all';
  if (!['all', 'image', 'audio'].includes(type))
    fail(400, 'Invalid media type');
  const rows = (
    await query(
      `SELECT * FROM media_assets WHERE workspace_id=$1 AND asset_type IN ('image','audio') AND ($4='all' OR asset_type=$4) ORDER BY ${sort} ${direction}, id ${direction} LIMIT $2 OFFSET $3`,
      [workspaceId, limit + 1, offset, type],
    )
  ).rows;
  return {
    items: rows.slice(0, limit),
    pagination: { limit, offset, has_more: rows.length > limit },
  };
}
export async function updateAsset(id, workspaceId, data) {
  if (typeof data.alt_text !== 'string' || data.alt_text.length > 2000)
    fail(400, 'Alt text must be at most 2000 characters');
  return (
    (
      await query(
        'UPDATE media_assets SET alt_text=$3,updated_at=now() WHERE id=$1 AND workspace_id=$2 RETURNING *',
        [id, workspaceId, data.alt_text.trim()],
      )
    ).rows[0] || fail(404, 'Media asset not found')
  );
}
export async function deleteAsset(row) {
  // FK locks serialize this with cover assignments. Never delete bytes first.
  try {
    await query('DELETE FROM media_assets WHERE id=$1 AND workspace_id=$2', [
      row.id,
      row.workspace_id,
    ]);
  } catch (error) {
    if (error.code === '23503')
      fail(
        409,
        `${row.asset_type === 'audio' ? 'Audio' : 'Image'} is used by a show, episode, or retained publication. Published media must be retained.`,
      );
    throw error;
  }
  try {
    await filesystemStorage().delete(row.storage_key);
  } catch (error) {
    console.error(
      'Orphaned media file requires cleanup',
      row.storage_key,
      error.code,
    );
  }
}

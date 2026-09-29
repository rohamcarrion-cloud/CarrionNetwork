import sharp from 'sharp';
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
      "SELECT * FROM media_assets WHERE id=$1 AND workspace_id=$2 AND asset_type='image'",
      [id, workspaceId],
    )
  ).rows[0];
  if (!row) fail(404, 'Media asset not found');
  return row;
}
export async function upload(request, workspaceId, filename) {
  const mime = request.headers['content-type']
    ?.split(';')[0]
    .trim()
    .toLowerCase();
  if (!Object.values(formats).includes(mime))
    fail(415, 'Use JPEG, PNG or WebP images');
  if (Number(request.headers['content-length']) > MAX_IMAGE_BYTES)
    fail(413, 'Maximum upload is 10 MiB');
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > MAX_IMAGE_BYTES) fail(413, 'Maximum upload is 10 MiB');
    chunks.push(chunk);
  }
  const bytes = Buffer.concat(chunks);
  const { width, height } = await validateImage(bytes, mime);
  const name =
    (filename || 'image')
      .split(/[\\/]/)
      .pop()
      .replace(/[\x00-\x1f\x7f]/g, '')
      .trim()
      .slice(0, 255) || 'image';
  const id = randomUUID(),
    key = randomUUID(),
    storage = filesystemStorage();
  await storage.put(key, bytes);
  try {
    return (
      await query(
        'INSERT INTO media_assets(id,workspace_id,original_filename,storage_key,mime_type,size_bytes,width,height) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
        [id, workspaceId, name, key, mime, size, width, height],
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
  const rows = (
    await query(
      `SELECT * FROM media_assets WHERE workspace_id=$1 AND asset_type='image' ORDER BY ${sort} ${direction}, id ${direction} LIMIT $2 OFFSET $3`,
      [workspaceId, limit + 1, offset],
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
        'Image is used by a show or episode. Remove its cover relationship first.',
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

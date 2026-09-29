import { randomUUID } from 'node:crypto';
import { pool, query } from './db.js';
import { permission } from './domain.js';
import { filesystemStorage } from './storage.js';

const fail = (status, message, issues) => {
  throw Object.assign(new Error(message), {
    status,
    issues,
    kind: 'publication_not_ready',
  });
};
export async function authorizedEpisode(id, user) {
  const episode = (await query('SELECT * FROM episodes WHERE id=$1', [id]))
    .rows[0];
  if (!episode) fail(404, 'Episode not found');
  await permission(episode.show_id, user.id);
  return episode;
}
async function available(row) {
  if (!row || row.state !== 'ready') return false;
  try {
    return (
      (await filesystemStorage().stat(row.storage_key)).size ===
      Number(row.size_bytes)
    );
  } catch {
    return false;
  }
}
function view(row) {
  if (!row) return null;
  const { storage_key, ...safe } = row;
  return { ...safe, media_url: `/public/media/${row.representation_id}` };
}
async function inspect(q, episode) {
  const publication = (
    await q(
      `SELECT p.*, r.state, r.mime_type, r.size_bytes, r.duration_seconds, r.storage_key
    FROM episode_publications p JOIN publishable_media r ON r.id=p.representation_id WHERE p.episode_id=$1`,
      [episode.id],
    )
  ).rows[0];
  const issues = [];
  const issue = (field, message) => issues.push({ field, message });
  if (publication) {
    if (!(await available(publication)))
      issue(
        'media',
        'Published audio is unavailable. Restore its storage object before retrying.',
      );
    return {
      publication: view(publication),
      issues,
      ready: issues.length === 0,
    };
  }
  const show = (
    await q('SELECT * FROM shows WHERE id=$1 AND workspace_id=$2', [
      episode.show_id,
      episode.workspace_id,
    ])
  ).rows[0];
  for (const field of [
    'title',
    'description',
    'author',
    'language',
    'category',
  ]) {
    if (!show?.[field]?.trim())
      issue(
        `show.${field}`,
        `Add the show ${field.replaceAll('_', ' ')} before publishing.`,
      );
  }
  for (const field of ['title', 'description']) {
    if (!episode[field]?.trim())
      issue(field, `Add the episode ${field} before publishing.`);
  }
  const asset = (
    await q(
      "SELECT * FROM media_assets WHERE id=$1 AND workspace_id=$2 AND asset_type='audio' AND mime_type='audio/mpeg'",
      [episode.primary_audio_asset_id, episode.workspace_id],
    )
  ).rows[0];
  if (!asset)
    issue(
      'primary_audio_asset_id',
      'Attach valid MP3 audio before publishing.',
    );
  else if (!(await available(asset)))
    issue(
      'media',
      'The original audio is unavailable. Restore it or attach another upload.',
    );
  if (asset) {
    const representation = (
      await q(
        "SELECT * FROM publishable_media WHERE source_media_asset_id=$1 AND profile='original-mp3-v1'",
        [asset.id],
      )
    ).rows[0];
    if (representation && !(await available(representation)))
      issue(
        'media',
        'The publishable representation is retired or unavailable.',
      );
  }
  return { publication: null, issues, ready: issues.length === 0, asset, show };
}
export async function readiness(id, user) {
  const episode = await authorizedEpisode(id, user);
  const { publication, issues, ready } = await inspect(query, episode);
  return { publication, issues, ready };
}
export async function publish(id, user, unpublish = false) {
  await authorizedEpisode(id, user);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const q = client.query.bind(client);
    const episode = (
      await q('SELECT * FROM episodes WHERE id=$1 FOR UPDATE', [id])
    ).rows[0];
    if (!episode) fail(404, 'Episode not found');
    // Lock metadata and original against concurrent changes/deletion until commit.
    await q('SELECT id FROM shows WHERE id=$1 FOR SHARE', [episode.show_id]);
    if (unpublish) {
      await q(
        "UPDATE episodes SET status='archived',updated_at=now() WHERE id=$1 AND status<>'archived'",
        [id],
      );
    } else {
      if (episode.primary_audio_asset_id)
        await q('SELECT id FROM media_assets WHERE id=$1 FOR SHARE', [
          episode.primary_audio_asset_id,
        ]);
      const state = await inspect(q, episode);
      if (!state.ready)
        fail(422, state.issues.map((i) => i.message).join(' '), state.issues);
      if (!state.publication) {
        const a = state.asset;
        const representation =
          (
            await q(
              `INSERT INTO publishable_media
          (id,workspace_id,source_media_asset_id,profile,storage_key,mime_type,size_bytes,duration_seconds)
          VALUES($1,$2,$3,'original-mp3-v1',$4,$5,$6,$7)
          ON CONFLICT(source_media_asset_id,profile) DO NOTHING RETURNING *`,
              [
                randomUUID(),
                episode.workspace_id,
                a.id,
                a.storage_key,
                a.mime_type,
                a.size_bytes,
                a.duration_seconds,
              ],
            )
          ).rows[0] ||
          (
            await q(
              "SELECT * FROM publishable_media WHERE source_media_asset_id=$1 AND profile='original-mp3-v1'",
              [a.id],
            )
          ).rows[0];
        if (!(await available(representation)))
          fail(422, 'The publishable representation is not ready.', [
            {
              field: 'media',
              message: 'Representation is retired or unavailable.',
            },
          ]);
        await q(
          `INSERT INTO episode_publications(episode_id,workspace_id,representation_id,guid,title,description,explicit,published_at)
          VALUES($1,$2,$3,$4,$5,$6,$7,COALESCE($8,now()))`,
          [
            id,
            episode.workspace_id,
            representation.id,
            episode.guid,
            episode.title,
            episode.description,
            episode.explicit ?? state.show.explicit,
            episode.published_at,
          ],
        );
      } else {
        await q(
          'UPDATE episode_publications SET active=true,updated_at=now() WHERE episode_id=$1 AND NOT active',
          [id],
        );
      }
      await q(
        "UPDATE episodes SET status='published',publish_at=COALESCE(published_at,now()),updated_at=now() WHERE id=$1 AND status<>'published'",
        [id],
      );
    }
    const updated = (await q('SELECT * FROM episodes WHERE id=$1', [id]))
      .rows[0];
    const { publication, issues, ready } = await inspect(q, updated);
    await q('COMMIT');
    return { episode: updated, publication, issues, ready };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
export async function publicMedia(id) {
  const row = (
    await query(
      `SELECT r.* FROM publishable_media r WHERE r.id=$1 AND r.state='ready'
    AND EXISTS (SELECT 1 FROM episode_publications p WHERE p.representation_id=r.id)`,
      [id],
    )
  ).rows[0];
  if (!row) fail(404, 'Public media not found');
  if (!(await available(row)))
    fail(503, 'Public media temporarily unavailable');
  return row;
}

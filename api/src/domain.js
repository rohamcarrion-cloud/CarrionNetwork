import { randomUUID } from 'node:crypto';
import { pool, query } from './db.js';
import { title, description, slug, uuid } from './validation.js';
const fail = (status, message) => {
  throw Object.assign(new Error(message), { status });
};
const text = (v, max) => {
  if (typeof v !== 'string' || v.length > max)
    fail(400, `Text must be at most ${max} characters`);
  return v.trim();
};
const choice = (v, values) => {
  if (!values.includes(v)) fail(400, `Expected one of: ${values.join(', ')}`);
  return v;
};
const positive = (v) => {
  if (!Number.isInteger(v) || v < 1 || v > 2147483647)
    fail(400, 'Number must be a positive integer');
  return v;
};
const boolean = (v) => {
  if (typeof v !== 'boolean') fail(400, 'Expected a boolean');
  return v;
};
const fields = {
  cover_asset_id: (v) => (v === null ? null : uuid(v)),
  title: (v) => title(v, 200),
  description,
  slug: (v) => {
    if (
      typeof v !== 'string' ||
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v) ||
      v.length > 80
    )
      fail(400, 'Slug must be 1–80 lowercase letters, digits or hyphens');
    return v;
  },
  status: (v) => choice(v, ['draft', 'published', 'archived']),
};
const schemas = {
  shows: {
    ...fields,
    short_description: (v) => text(v, 300),
    author: (v) => text(v, 200),
    language: (v) => {
      if (typeof v !== 'string' || v.length > 35)
        fail(400, 'Language must be a string of at most 35 characters');
      try {
        return Intl.getCanonicalLocales(v)[0] || fail(400, 'Language required');
      } catch {
        fail(400, 'Use a valid language tag such as en or en-US');
      }
    },
    category: (v) => text(v, 100),
    explicit: boolean,
    show_type: (v) => choice(v, ['episodic', 'serial']),
    website_url: (v) => {
      v = text(v, 2048);
      if (v) {
        try {
          const u = new URL(v);
          if (
            !['http:', 'https:'].includes(u.protocol) ||
            u.username ||
            u.password
          )
            throw Error();
        } catch {
          fail(400, 'Website must be an HTTP or HTTPS URL');
        }
      }
      return v;
    },
    copyright: (v) => text(v, 300),
  },
  episodes: {
    ...fields,
    primary_audio_asset_id: (v) => (v === null ? null : uuid(v)),
    title: (v) => title(v, 250),
    status: (v) => choice(v, ['draft', 'scheduled', 'published', 'archived']),
    season_id: (v) => (v === null ? null : uuid(v)),
    episode_number: (v) => (v === null ? null : positive(v)),
    episode_type: (v) => choice(v, ['full', 'trailer', 'bonus']),
    explicit: (v) => (v === null ? null : boolean(v)),
    publish_at: (v) => {
      if (v === null) return null;
      if (
        typeof v !== 'string' ||
        !/^\d{4}-\d\d-\d\dT.*(?:Z|[+-]\d\d:\d\d)$/.test(v) ||
        !Number.isFinite(Date.parse(v))
      )
        fail(400, 'Publish time must be an ISO timestamp with timezone');
      return new Date(v).toISOString();
    },
  },
  seasons: { title: fields.title, description, season_number: positive },
};
export async function permission(id, userId) {
  const result = await query(
    `SELECT s.*, CASE WHEN s.owner_id=$2 THEN 'owner' ELSE m.role END AS my_role FROM shows s LEFT JOIN show_members m ON m.show_id=s.id AND m.user_id=$2 WHERE s.id=$1`,
    [id, userId],
  );
  if (!result.rows[0]?.my_role) fail(404, 'Show not found');
  return result.rows[0];
}
export async function save(table, data, existing, parent, user) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    if (existing) {
      existing = (
        await client.query(`SELECT * FROM ${table} WHERE id=$1 FOR UPDATE`, [
          existing.id,
        ])
      ).rows[0];
      if (!existing) fail(404, 'Record not found');
    }
    const result = await saveRecord(
      client.query.bind(client),
      table,
      data,
      existing,
      parent,
      user,
    );
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
async function saveRecord(query, table, data, existing, parent, user) {
  const values = {};
  for (const [key, validate] of Object.entries(schemas[table]))
    if (data[key] !== undefined) values[key] = validate(data[key]);
  if (!Object.keys(values).length) fail(400, 'No editable fields provided');
  const merged = { ...existing, ...values };
  if (values.cover_asset_id) {
    const workspaceId =
      table === 'shows'
        ? existing?.workspace_id || user.id
        : parent.workspace_id;
    if (
      !(
        await query(
          "SELECT a.id FROM media_assets a JOIN workspaces w ON w.id=a.workspace_id WHERE a.id=$1 AND a.workspace_id=$2 AND a.asset_type='image' AND w.owner_id=$3",
          [values.cover_asset_id, workspaceId, user.id],
        )
      ).rowCount
    )
      fail(400, 'Choose an image from this workspace');
  }
  if (
    values.primary_audio_asset_id &&
    !(
      await query(
        "SELECT a.id FROM media_assets a JOIN workspaces w ON w.id=a.workspace_id WHERE a.id=$1 AND a.workspace_id=$2 AND a.asset_type='audio' AND w.owner_id=$3",
        [values.primary_audio_asset_id, parent.workspace_id, user.id],
      )
    ).rowCount
  )
    fail(400, 'Choose audio from this workspace');
  if (!existing && !values.title) fail(400, 'Title required');
  if (table === 'seasons' && !merged.season_number)
    fail(400, 'Season number required');
  if (table === 'episodes') {
    if (
      merged.season_id &&
      !(
        await query('SELECT id FROM seasons WHERE id=$1 AND show_id=$2', [
          merged.season_id,
          parent.id,
        ])
      ).rowCount
    )
      fail(400, 'Season must belong to this show');
    if (['scheduled', 'published'].includes(merged.status)) {
      if (!merged.publish_at) fail(400, 'Publish date/time required');
      if (
        merged.status === 'scheduled' &&
        (!existing || values.status || values.publish_at) &&
        new Date(merged.publish_at) <= new Date()
      )
        fail(400, 'Scheduled time must be in the future');
      if (
        merged.status === 'published' &&
        new Date(merged.publish_at) > new Date()
      )
        fail(400, 'Published time cannot be in the future');
    }
  }
  if (
    existing?.published_at &&
    values.status &&
    !['published', 'archived'].includes(values.status)
  )
    fail(409, 'Published records can only be archived');
  if (existing) {
    const keys = Object.keys(values);
    return (
      await query(
        `UPDATE ${table} SET ${keys.map((k, i) => `${k}=$${i + 1}`).join(',')}, updated_at=now() WHERE id=$${keys.length + 1} RETURNING *`,
        [...Object.values(values), existing.id],
      )
    ).rows[0];
  }
  values.id = randomUUID();
  if (table === 'shows') {
    values.owner_id = user.id;
    values.workspace_id = user.id;
  } else values.show_id = parent.id;
  if (table !== 'seasons')
    values.slug ??= `${slug(values.title).slice(0, 71)}-${values.id.slice(0, 8)}`;
  if (table === 'episodes') {
    values.guid = randomUUID();
    values.workspace_id = parent.workspace_id;
  }
  return (
    await query(
      `INSERT INTO ${table} (${Object.keys(values).join(',')}) VALUES (${Object.keys(
        values,
      )
        .map((_, i) => `$${i + 1}`)
        .join(',')}) RETURNING *`,
      Object.values(values),
    )
  ).rows[0];
}
export async function list(table, params, user, parent) {
  const limit = Number(params.get('limit') || 25),
    offset = Number(params.get('offset') || 0);
  if (
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 100 ||
    !Number.isSafeInteger(offset) ||
    offset < 0
  )
    fail(400, 'Use limit 1–100 and a nonnegative offset');
  const sort =
    params.get('sort') ||
    (table === 'seasons' ? 'season_number' : 'created_at');
  if (
    ![
      'created_at',
      'updated_at',
      'title',
      ...(table === 'episodes' ? ['publish_at', 'episode_number'] : []),
      ...(table === 'seasons' ? ['season_number'] : []),
    ].includes(sort)
  )
    fail(400, 'Invalid sort field');
  const direction = choice(params.get('direction') || 'desc', ['asc', 'desc']);
  const args = [parent?.id || user.id];
  const where = [
    table === 'shows'
      ? '(t.owner_id=$1 OR EXISTS (SELECT 1 FROM show_members m WHERE m.show_id=t.id AND m.user_id=$1))'
      : 't.show_id=$1',
  ];
  if (params.has('status') && table !== 'seasons') {
    args.push(schemas[table].status(params.get('status')));
    where.push(`t.status=$${args.length}`);
  }
  if (params.has('season_id') && table === 'episodes') {
    const id = params.get('season_id');
    if (id === 'none') where.push('t.season_id IS NULL');
    else {
      args.push(uuid(id));
      where.push(`t.season_id=$${args.length}`);
    }
  }
  args.push(limit + 1, offset);
  const rows = (
    await query(
      `SELECT t.* FROM ${table} t WHERE ${where.join(' AND ')} ORDER BY t.${sort} ${direction} NULLS LAST, t.id ${direction} LIMIT $${args.length - 1} OFFSET $${args.length}`,
      args,
    )
  ).rows;
  return {
    items: rows.slice(0, limit),
    pagination: { limit, offset, has_more: rows.length > limit },
  };
}
export async function remove(table, record, show) {
  if (show.my_role !== 'owner') fail(403, 'Only the owner may delete records');
  if (record.published_at || (record.status && record.status !== 'draft'))
    fail(409, 'Only drafts can be deleted; archive this record instead');
  await query(`DELETE FROM ${table} WHERE id=$1`, [record.id]);
}

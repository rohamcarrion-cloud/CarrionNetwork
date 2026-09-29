import http from 'node:http';
import {
  randomBytes,
  randomUUID,
  createHash,
  scrypt as scryptCallback,
  timingSafeEqual,
} from 'node:crypto';
import { promisify } from 'node:util';
import { pathToFileURL } from 'node:url';
import { pool, query } from './db.js';
import { title, uuid } from './validation.js';
import { permission, save, list, remove } from './domain.js';
import * as media from './media.js';
import { filesystemStorage } from './storage.js';

const scrypt = promisify(scryptCallback);
const fail = (status, message) => {
  throw Object.assign(new Error(message), { status });
};
const hashToken = (token) => createHash('sha256').update(token).digest('hex');

async function passwordHash(password) {
  const salt = randomBytes(16).toString('hex');
  return `${salt}:${(await scrypt(password, salt, 64)).toString('hex')}`;
}
async function validPassword(password, stored) {
  const [salt, digest] = stored.split(':');
  if (!salt || !digest || !/^[0-9a-f]{128}$/.test(digest)) return false;
  const actual = await scrypt(password, salt, 64);
  return timingSafeEqual(actual, Buffer.from(digest, 'hex'));
}
async function readBody(request) {
  if (
    !request.headers['content-type']
      ?.toLowerCase()
      .startsWith('application/json')
  )
    fail(415, 'Expected application/json');
  let raw = '';
  for await (const chunk of request) {
    raw += chunk;
    if (raw.length > 65536) fail(413, 'Request body too large');
  }
  try {
    const body = JSON.parse(raw);
    if (!body || Array.isArray(body) || typeof body !== 'object')
      fail(400, 'Expected a JSON object');
    return body;
  } catch (error) {
    if (error.status) throw error;
    fail(400, 'Invalid JSON');
  }
}
function send(response, status, data) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  response.end(JSON.stringify(data));
}
async function requireUser(request) {
  const token = /^Bearer ([a-f0-9]{64})$/i.exec(
    request.headers.authorization || '',
  )?.[1];
  if (!token) fail(401, 'Sign in required');
  const result = await query(
    'SELECT users.id, users.email, users.display_name FROM sessions JOIN users ON users.id = sessions.user_id WHERE token_hash = $1 AND expires_at > now()',
    [hashToken(token)],
  );
  if (!result.rowCount) fail(401, 'Session expired or invalid');
  return result.rows[0];
}
async function handle(request, response) {
  const origin = process.env.WEB_ORIGIN;
  if (origin && request.headers.origin === origin) {
    response.setHeader('Access-Control-Allow-Origin', origin);
    response.setHeader('Vary', 'Origin');
    response.setHeader(
      'Access-Control-Allow-Headers',
      'Authorization, Content-Type',
    );
    response.setHeader(
      'Access-Control-Allow-Methods',
      'GET, POST, PATCH, DELETE, OPTIONS',
    );
  }
  if (request.method === 'OPTIONS') {
    response.writeHead(204);
    return response.end();
  }
  const path = new URL(request.url, 'http://localhost').pathname;
  if (request.method === 'GET' && path === '/health') {
    await query('SELECT 1');
    return send(response, 200, { status: 'ok' });
  }
  if (request.method === 'POST' && path === '/auth/register') {
    const data = await readBody(request);
    const email =
      typeof data.email === 'string' ? data.email.trim().toLowerCase() : '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254)
      fail(400, 'Valid email required');
    if (
      typeof data.password !== 'string' ||
      data.password.length < 12 ||
      data.password.length > 256
    )
      fail(400, 'Password must be 12–256 characters');
    const name = title(data.display_name, 100);
    const result = await query(
      'INSERT INTO users (id, email, password_hash, display_name) VALUES ($1,$2,$3,$4) RETURNING id,email,display_name',
      [randomUUID(), email, await passwordHash(data.password), name],
    );
    return send(response, 201, { user: result.rows[0] });
  }
  if (request.method === 'POST' && path === '/auth/login') {
    const data = await readBody(request);
    const email =
      typeof data.email === 'string' ? data.email.trim().toLowerCase() : '';
    const found = await query(
      'SELECT id, email, display_name, password_hash FROM users WHERE email=$1',
      [email],
    );
    if (
      !found.rowCount ||
      typeof data.password !== 'string' ||
      !(await validPassword(data.password, found.rows[0].password_hash))
    )
      fail(401, 'Invalid credentials');
    const token = randomBytes(32).toString('hex');
    await query(
      "INSERT INTO sessions (token_hash,user_id,expires_at) VALUES ($1,$2,now() + interval '14 days')",
      [hashToken(token), found.rows[0].id],
    );
    const { password_hash: ignored, ...user } = found.rows[0];
    return send(response, 200, { token, user });
  }
  const user = await requireUser(request);
  if (request.method === 'GET' && path === '/auth/me')
    return send(response, 200, { user });
  if (request.method === 'POST' && path === '/auth/logout') {
    const token = request.headers.authorization.slice(7);
    await query('DELETE FROM sessions WHERE token_hash=$1', [hashToken(token)]);
    return send(response, 204, {});
  }
  const params = new URL(request.url, 'http://localhost').searchParams;
  const mediaRoute =
    /^\/workspaces\/([^/]+)\/media(?:\/([^/]+)(\/content)?)?$/.exec(path);
  if (mediaRoute) {
    const workspaceId = uuid(mediaRoute[1]);
    await media.workspace(workspaceId, user);
    if (!mediaRoute[2]) {
      if (request.method === 'GET')
        return send(response, 200, await media.listAssets(workspaceId, params));
      if (request.method === 'POST')
        return send(response, 201, {
          asset: await media.upload(
            request,
            workspaceId,
            params.get('filename'),
          ),
        });
    } else {
      const row = await media.asset(uuid(mediaRoute[2]), workspaceId);
      if (request.method === 'GET' && mediaRoute[3]) {
        const bytes = await filesystemStorage().get(row.storage_key);
        response.writeHead(200, {
          'Content-Type': row.mime_type,
          'Content-Length': bytes.length,
          'Cache-Control': 'private, no-store',
          'X-Content-Type-Options': 'nosniff',
          'Content-Security-Policy': "default-src 'none'",
        });
        return response.end(bytes);
      }
      if (!mediaRoute[3]) {
        if (request.method === 'GET')
          return send(response, 200, { asset: row });
        if (request.method === 'PATCH')
          return send(response, 200, {
            asset: await media.updateAsset(
              row.id,
              workspaceId,
              await readBody(request),
            ),
          });
        if (request.method === 'DELETE') {
          await media.deleteAsset(row);
          return send(response, 204, {});
        }
      }
    }
  }
  if (path === '/workspaces' && request.method === 'GET') {
    return send(response, 200, {
      items: (
        await query('SELECT * FROM workspaces WHERE owner_id=$1', [user.id])
      ).rows,
    });
  }
  if (path === '/shows') {
    if (request.method === 'GET')
      return send(response, 200, await list('shows', params, user));
    if (request.method === 'POST')
      return send(response, 201, {
        show: await save('shows', await readBody(request), null, null, user),
      });
  }
  const collection = /^\/shows\/([^/]+)\/(episodes|seasons)$/.exec(path);
  if (collection) {
    const show = await permission(uuid(collection[1]), user.id),
      table = collection[2];
    if (request.method === 'GET')
      return send(response, 200, await list(table, params, user, show));
    if (request.method === 'POST')
      return send(response, 201, {
        [table.slice(0, -1)]: await save(
          table,
          await readBody(request),
          null,
          show,
          user,
        ),
      });
  }
  const item = /^\/(shows|episodes|seasons)\/([^/]+)$/.exec(path);
  if (item) {
    const table = item[1],
      id = uuid(item[2]);
    const record =
      table === 'shows'
        ? await permission(id, user.id)
        : (await query(`SELECT * FROM ${table} WHERE id=$1`, [id])).rows[0];
    if (!record) fail(404, 'Record not found');
    const show =
      table === 'shows' ? record : await permission(record.show_id, user.id);
    if (request.method === 'GET')
      return send(response, 200, { [table.slice(0, -1)]: record });
    if (request.method === 'PATCH')
      return send(response, 200, {
        [table.slice(0, -1)]: await save(
          table,
          await readBody(request),
          record,
          show,
          user,
        ),
      });
    if (request.method === 'DELETE') {
      await remove(table, record, show);
      return send(response, 204, {});
    }
  }
  fail(404, 'Route not found');
}

export const server = http.createServer(async (request, response) => {
  try {
    await handle(request, response);
  } catch (error) {
    const status =
      error.status ||
      (['23505', '23503'].includes(error.code)
        ? 409
        : error.code === '23514'
          ? 400
          : 500);
    if (status === 500) console.error(error);
    if (!response.headersSent)
      send(response, status, {
        error:
          status === 500
            ? 'Internal server error'
            : error.code === '23505'
              ? 'Slug or number already exists in this scope'
              : error.code === '23503'
                ? 'Record has related episodes; reassign or delete drafts first, or archive the show'
                : error.message,
      });
    else response.end();
  }
});
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  server.listen(Number(process.env.PORT || 3010), () =>
    console.log(`Carrion Network API listening on ${server.address().port}`),
  );
  process.on('SIGTERM', async () => {
    server.close();
    await pool.end();
  });
}

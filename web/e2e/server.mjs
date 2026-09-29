import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const mediaDirectory = await mkdtemp(join(tmpdir(), 'carrion-browser-media-'));
process.env.MEDIA_STORAGE_DIR = mediaDirectory;
import { runMigrations } from '../../api/src/migration-runner.js';

const connectionString =
  process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
if (!connectionString)
  throw new Error(
    'Set TEST_DATABASE_URL or DATABASE_URL; the role needs CREATEDB permission.',
  );
const admin = new pg.Client({ connectionString });
const database = `carrion_test_${randomUUID().replaceAll('-', '')}`;
let created = false;
let server;
let pool;
let closing = false;
async function cleanup() {
  if (closing) return;
  closing = true;
  try {
    if (server?.listening)
      await new Promise((resolve) => {
        server.close(resolve);
        server.closeAllConnections();
      });
    await pool?.end();
    await rm(mediaDirectory, { recursive: true, force: true });
    if (created) await admin.query(`DROP DATABASE "${database}" WITH (FORCE)`);
  } finally {
    await admin.end();
  }
}
for (const signal of ['SIGTERM', 'SIGINT'])
  process.on(signal, () => {
    void cleanup().then(() => process.exit(0));
  });
try {
  await admin.connect();
  await admin.query(`CREATE DATABASE "${database}"`);
  created = true;
  const url = new URL(connectionString);
  url.pathname = `/${database}`;
  process.env.DATABASE_URL = url.href;
  process.env.WEB_ORIGIN = 'http://127.0.0.1:5174';
  const client = new pg.Client({ connectionString: url.href });
  await client.connect();
  try {
    await runMigrations(
      client,
      fileURLToPath(new URL('../../api/migrations/', import.meta.url)),
    );
  } finally {
    await client.end();
  }
  ({ server } = await import('../../api/src/server.js'));
  ({ pool } = await import('../../api/src/db.js'));
  server.on('error', async (error) => {
    console.error(error.message);
    await cleanup();
    process.exit(1);
  });
  server.listen(3011, '127.0.0.1');
} catch (error) {
  await cleanup();
  throw error;
}

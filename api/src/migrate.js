import { fileURLToPath } from 'node:url';
import { pool } from './db.js';
import { runMigrations } from './migration-runner.js';

let client;
try {
  client = await pool.connect();
  await runMigrations(
    client,
    fileURLToPath(new URL('../migrations/', import.meta.url)),
    {
      checkOnly: process.argv.includes('--check'),
    },
  );
} finally {
  client?.release();
  await pool.end();
}

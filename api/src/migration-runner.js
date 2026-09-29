import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

// SQL files and their ledger entries commit atomically, under one session lock.
export async function runMigrations(
  client,
  directory,
  { checkOnly = false, log = console.log } = {},
) {
  await client.query('SELECT pg_advisory_lock(823709122)');
  try {
    await client.query('SET search_path TO public');
    const identity = (
      await client.query(
        'SELECT current_database() AS database, current_schema() AS schema, inet_server_port() AS port',
      )
    ).rows[0];
    log(
      `Migration target: database=${identity.database} schema=${identity.schema} server_port=${identity.port}`,
    );
    const files = (await readdir(directory))
      .filter((name) => name.endsWith('.sql'))
      .sort();
    if (!checkOnly)
      await client.query(
        'CREATE TABLE IF NOT EXISTS public.schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())',
      );
    const rows = (
      await client.query(
        'SELECT name, applied_at FROM public.schema_migrations ORDER BY name',
      )
    ).rows;
    const unknown = rows.filter((row) => !files.includes(row.name));
    if (unknown.length)
      throw new Error(
        `Applied migration files missing: ${unknown.map((row) => row.name).join(', ')}`,
      );
    const applied = new Set(rows.map((row) => row.name));
    const pending = files.filter((file) => !applied.has(file));
    if (checkOnly && pending.length)
      throw new Error(`Pending migrations: ${pending.join(', ')}`);
    for (const file of pending) {
      await client.query('BEGIN');
      try {
        await client.query(await readFile(join(directory, file), 'utf8'));
        await client.query(
          'INSERT INTO public.schema_migrations (name) VALUES ($1)',
          [file],
        );
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
      log(`Applied ${file}`);
    }
    const ledger = (
      await client.query(
        'SELECT name, applied_at FROM public.schema_migrations ORDER BY name',
      )
    ).rows;
    if (
      ledger.length !== files.length ||
      ledger.some((row, i) => row.name !== files[i] || !row.applied_at)
    ) {
      throw new Error('Migration ledger does not match migration files');
    }
    log(
      `Verified ${ledger.length} migration(s): ${ledger.map((row) => row.name).join(', ')}`,
    );
    return ledger;
  } finally {
    await client.query('SELECT pg_advisory_unlock(823709122)');
  }
}

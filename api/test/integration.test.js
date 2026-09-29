import { silentMp3 } from './helpers/audio.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID, createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import sharp from 'sharp';
import { mkdtemp, copyFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runMigrations } from '../src/migration-runner.js';

const exec = promisify(execFile);
const password = 'a-long-test-password';
const hash = (token) => createHash('sha256').update(token).digest('hex');

test('PostgreSQL migrations and HTTP API', { timeout: 120_000 }, async (t) => {
  const connectionString =
    process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
  assert.ok(
    connectionString,
    'Set TEST_DATABASE_URL or DATABASE_URL to a PostgreSQL database; the user needs CREATEDB permission.',
  );
  const admin = new pg.Client({
    connectionString,
    connectionTimeoutMillis: 5000,
  });
  const database = `carrion_test_${randomUUID().replaceAll('-', '')}`;
  let created = false;
  let pool;
  let server;
  const mediaDirectory = await mkdtemp(join(tmpdir(), 'carrion-media-'));
  process.env.MEDIA_STORAGE_DIR = mediaDirectory;
  const previousUrl = process.env.DATABASE_URL;
  try {
    await admin.connect();
    await admin.query(`CREATE DATABASE "${database}"`);
    created = true;
    const url = new URL(connectionString);
    url.pathname = `/${database}`;
    process.env.DATABASE_URL = url.href;
    const migrate = () =>
      exec(
        process.execPath,
        [fileURLToPath(new URL('../src/migrate.js', import.meta.url))],
        {
          env: { ...process.env, DATABASE_URL: url.href },
          timeout: 30_000,
        },
      );
    await t.test(
      'populated foundation upgrades without losing identities and migrations rerun safely',
      async () => {
        const directory = await mkdtemp(join(tmpdir(), 'carrion-upgrade-'));
        const client = new pg.Client({ connectionString: url.href });
        await client.connect();
        const userId = randomUUID(),
          showId = randomUUID(),
          episodeId = randomUUID(),
          guid = randomUUID();
        try {
          await copyFile(
            fileURLToPath(
              new URL('../migrations/001_foundation.sql', import.meta.url),
            ),
            join(directory, '001_foundation.sql'),
          );
          await runMigrations(client, directory, { log: () => {} });
          await client.query(
            "INSERT INTO users(id,email,password_hash,display_name) VALUES($1,'legacy@example.test','unused','Existing creator')",
            [userId],
          );
          await client.query(
            "INSERT INTO shows(id,owner_id,title,slug) VALUES($1,$2,'Existing show','existing-show')",
            [showId, userId],
          );
          await client.query(
            "INSERT INTO episodes(id,show_id,title,slug,guid,status,scheduled_at) VALUES($1,$2,'Existing episode','existing-episode',$3,'scheduled','2099-01-01T00:00:00Z')",
            [episodeId, showId, guid],
          );
          await client.query(
            "INSERT INTO media_assets(id,owner_id,storage_key,mime_type,size_bytes) VALUES($1,$2,'legacy-key','image/png',123)",
            [randomUUID(), userId],
          );
          await client.query(
            "UPDATE shows SET artwork_key='legacy-key' WHERE id=$1",
            [showId],
          );
          for (const name of [
            '002_podcast_domain.sql',
            '003_publication_history.sql',
            '004_media_assets.sql',
          ]) {
            await copyFile(
              fileURLToPath(new URL('../migrations/' + name, import.meta.url)),
              join(directory, name),
            );
          }
          const upgradeLogs = [];
          await runMigrations(client, directory, {
            log: (message) => upgradeLogs.push(message),
          });
          const imageId = randomUUID();
          await client.query(
            "INSERT INTO media_assets(id,workspace_id,storage_key,mime_type,size_bytes,width,height,original_filename) VALUES($1,$2,$3,'image/png',123,16,16,'existing.png')",
            [imageId, userId, randomUUID()],
          );
          await client.query(
            'UPDATE episodes SET cover_asset_id=$1 WHERE id=$2',
            [imageId, episodeId],
          );
          const beforeImage = (
            await client.query('SELECT * FROM media_assets WHERE id=$1', [
              imageId,
            ])
          ).rows[0];
          const output = upgradeLogs.join('\n') + (await migrate()).stdout;
          const afterImage = (
            await client.query('SELECT * FROM media_assets WHERE id=$1', [
              imageId,
            ])
          ).rows[0];
          assert.deepEqual(afterImage, {
            ...beforeImage,
            duration_seconds: null,
          });
          const upgradedEpisode = (
            await client.query('SELECT * FROM episodes WHERE id=$1', [
              episodeId,
            ])
          ).rows[0];
          assert.equal(upgradedEpisode.cover_asset_id, imageId);
          assert.equal(upgradedEpisode.primary_audio_asset_id, null);
          const legacy = (
            await client.query(
              "SELECT * FROM media_assets WHERE storage_key='legacy-key'",
            )
          ).rows[0];
          assert.equal(legacy.workspace_id, userId);
          assert.equal(legacy.asset_type, 'legacy');
          assert.equal(
            (
              await client.query(
                'SELECT artwork_key FROM legacy_show_artwork WHERE show_id=$1',
                [showId],
              )
            ).rows[0].artwork_key,
            'legacy-key',
          );
          assert.equal(
            (
              await client.query(
                'SELECT cover_asset_id FROM shows WHERE id=$1',
                [showId],
              )
            ).rows[0].cover_asset_id,
            null,
          );
          assert.match(output, /Applied 002_podcast_domain.sql/);
          assert.match(output, /Applied 003_publication_history.sql/);
          assert.doesNotMatch((await migrate()).stdout, /Applied /);
          const migrated = (
            await client.query(
              'SELECT e.*,s.workspace_id FROM episodes e JOIN shows s ON s.id=e.show_id WHERE e.id=$1',
              [episodeId],
            )
          ).rows[0];
          assert.equal(migrated.guid, guid);
          assert.equal(migrated.workspace_id, userId);
          assert.equal(migrated.season_id, null);
          assert.equal(migrated.status, 'scheduled');
          assert.equal(
            migrated.publish_at.toISOString(),
            '2099-01-01T00:00:00.000Z',
          );
          assert.equal(
            (
              await client.query(
                'SELECT owner_id FROM workspaces WHERE id=$1',
                [userId],
              )
            ).rows[0].owner_id,
            userId,
          );
        } finally {
          await client.end();
          await rm(directory, { recursive: true, force: true });
        }
      },
    );
    await t.test(
      'migration ledger persists across connections and future migrations roll back atomically',
      async () => {
        const directory = await mkdtemp(join(tmpdir(), 'carrion-migrations-'));
        const connect = async () => {
          const client = new pg.Client({ connectionString: url.href });
          await client.connect();
          return client;
        };
        let client = await connect();
        const logs = [];
        const options = { log: (message) => logs.push(message) };
        try {
          const initial = (
            await client.query(
              'SELECT name, applied_at FROM public.schema_migrations',
            )
          ).rows;
          assert.deepEqual(
            initial.map((row) => row.name),
            [
              '001_foundation.sql',
              '002_podcast_domain.sql',
              '003_publication_history.sql',
              '004_media_assets.sql',
              '005_episode_audio.sql',
            ],
          );
          assert.ok(initial[0].applied_at instanceof Date);
          await copyFile(
            fileURLToPath(
              new URL('../migrations/001_foundation.sql', import.meta.url),
            ),
            join(directory, '001_foundation.sql'),
          );
          await copyFile(
            fileURLToPath(
              new URL('../migrations/002_podcast_domain.sql', import.meta.url),
            ),
            join(directory, '002_podcast_domain.sql'),
          );
          await copyFile(
            fileURLToPath(
              new URL(
                '../migrations/003_publication_history.sql',
                import.meta.url,
              ),
            ),
            join(directory, '003_publication_history.sql'),
          );
          await copyFile(
            fileURLToPath(
              new URL('../migrations/004_media_assets.sql', import.meta.url),
            ),
            join(directory, '004_media_assets.sql'),
          );
          await copyFile(
            fileURLToPath(
              new URL('../migrations/005_episode_audio.sql', import.meta.url),
            ),
            join(directory, '005_episode_audio.sql'),
          );
          await writeFile(
            join(directory, '006_probe.sql'),
            'CREATE TABLE migration_probe (id integer PRIMARY KEY);',
          );
          await writeFile(
            join(directory, '007_probe.sql'),
            'INSERT INTO migration_probe VALUES (1);',
          );
          await assert.rejects(
            runMigrations(client, directory, { ...options, checkOnly: true }),
            /Pending migrations/,
          );
          await runMigrations(client, directory, options);
          await client.end();
          client = await connect();
          const ledger = await runMigrations(client, directory, {
            ...options,
            checkOnly: true,
          });
          assert.deepEqual(
            ledger.map((row) => row.name),
            [
              '001_foundation.sql',
              '002_podcast_domain.sql',
              '003_publication_history.sql',
              '004_media_assets.sql',
              '005_episode_audio.sql',
              '006_probe.sql',
              '007_probe.sql',
            ],
          );
          assert.equal(
            ledger[0].applied_at.getTime(),
            initial[0].applied_at.getTime(),
          );
          await runMigrations(client, directory, options);
          assert.equal(
            (await client.query('SELECT * FROM migration_probe')).rowCount,
            1,
          );
          await writeFile(
            join(directory, '008_failure.sql'),
            'CREATE TABLE rollback_probe (id integer); SELECT missing_migration_function();',
          );
          await assert.rejects(
            runMigrations(client, directory, options),
            /missing_migration_function/,
          );
          assert.ok(!logs.includes('Applied 008_failure.sql'));
          await client.end();
          client = await connect();
          assert.equal(
            (
              await client.query(
                "SELECT to_regclass('public.rollback_probe') AS name",
              )
            ).rows[0].name,
            null,
          );
          assert.equal(
            (
              await client.query(
                "SELECT * FROM public.schema_migrations WHERE name='008_failure.sql'",
              )
            ).rowCount,
            0,
          );
          await writeFile(
            join(directory, '008_failure.sql'),
            'CREATE TABLE rollback_probe (id integer);',
          );
          await runMigrations(client, directory, options);
          assert.equal(
            (
              await runMigrations(client, directory, {
                ...options,
                checkOnly: true,
              })
            ).length,
            8,
          );
          await rm(join(directory, '008_failure.sql'));
          await assert.rejects(
            runMigrations(client, directory, { ...options, checkOnly: true }),
            /Applied migration files missing/,
          );
        } finally {
          await client.end();
          await rm(directory, { recursive: true, force: true });
        }
      },
    );
    ({ pool } = await import('../src/db.js'));
    ({ server } = await import('../src/server.js'));
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const base = `http://127.0.0.1:${server.address().port}`;
    async function request(method, path, { token, body, status = 200 } = {}) {
      const response = await fetch(base + path, {
        method,
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      const text = await response.text();
      assert.equal(response.status, status, `${method} ${path}: ${text}`);
      return text ? JSON.parse(text) : undefined;
    }
    async function register(email) {
      return (
        await request('POST', '/auth/register', {
          body: { email, password, display_name: 'Creator' },
          status: 201,
        })
      ).user;
    }
    async function login(email) {
      return (
        await request('POST', '/auth/login', { body: { email, password } })
      ).token;
    }
    let owner, outsider, token, outsiderToken, show, episode;
    await t.test('health reaches PostgreSQL', async () => {
      assert.deepEqual(await request('GET', '/health'), { status: 'ok' });
    });
    await t.test(
      'signup normalizes email, validates input, and stores a password hash',
      async () => {
        owner = await register(' Owner@Example.com ');
        assert.equal(owner.email, 'owner@example.com');
        assert.deepEqual(Object.keys(owner).sort(), [
          'display_name',
          'email',
          'id',
        ]);
        const stored = (
          await pool.query('SELECT password_hash FROM users WHERE id=$1', [
            owner.id,
          ])
        ).rows[0];
        assert.match(stored.password_hash, /^[a-f0-9]{32}:[a-f0-9]{128}$/);
        assert.notEqual(stored.password_hash, password);
        await request('POST', '/auth/register', {
          body: {
            email: owner.email.toUpperCase(),
            password,
            display_name: 'Duplicate',
          },
          status: 409,
        });
        for (const body of [
          { email: 'invalid', password, display_name: 'Creator' },
          {
            email: 'new@example.com',
            password: 'short',
            display_name: 'Creator',
          },
          { email: 'new@example.com', password, display_name: ' ' },
        ])
          await request('POST', '/auth/register', { body, status: 400 });
        outsider = await register('outsider@example.com');
        outsiderToken = await login(outsider.email);
      },
    );
    await t.test(
      'login and session lookup reject invalid credentials and tokens',
      async () => {
        for (const body of [
          { email: owner.email, password: 'incorrect-password' },
          { email: 'missing@example.com', password },
        ])
          await request('POST', '/auth/login', { body, status: 401 });
        token = await login(owner.email.toUpperCase());
        assert.match(token, /^[a-f0-9]{64}$/);
        assert.deepEqual(
          (await request('GET', '/auth/me', { token })).user,
          owner,
        );
        const session = (
          await pool.query('SELECT * FROM sessions WHERE user_id=$1', [
            owner.id,
          ])
        ).rows[0];
        assert.equal(session.token_hash, hash(token));
        assert.notEqual(session.token_hash, token);
        assert.ok(session.expires_at > new Date());
        for (const bad of [undefined, 'malformed', '0'.repeat(64)]) {
          await request('GET', '/auth/me', { token: bad, status: 401 });
        }
      },
    );
    await t.test(
      'show and episode drafts support CRUD with server-controlled ownership and GUIDs',
      async () => {
        show = (
          await request('POST', '/shows', {
            token,
            status: 201,
            body: {
              title: 'BusinessMind',
              description: 'First show',
              owner_id: outsider.id,
              status: 'draft',
            },
          })
        ).show;
        assert.equal(show.owner_id, owner.id);
        assert.equal(show.status, 'draft');
        assert.equal(
          (await request('GET', `/shows/${show.id}`, { token })).show.title,
          'BusinessMind',
        );
        assert.deepEqual(
          (await request('GET', '/shows', { token })).items.map((x) => x.id),
          [show.id],
        );
        const edited = (
          await request('PATCH', `/shows/${show.id}`, {
            token,
            body: {
              title: 'New show title',
              owner_id: outsider.id,
              status: 'draft',
            },
          })
        ).show;
        assert.equal(edited.title, 'New show title');
        assert.equal(edited.description, show.description);
        assert.equal(edited.owner_id, owner.id);
        assert.equal(edited.status, 'draft');
        episode = (
          await request('POST', `/shows/${show.id}/episodes`, {
            token,
            status: 201,
            body: {
              title: 'First episode',
              description: 'Original description',
              show_id: randomUUID(),
              guid: randomUUID(),
              status: 'draft',
            },
          })
        ).episode;
        assert.equal(episode.show_id, show.id);
        assert.equal(episode.status, 'draft');
        assert.ok(episode.guid);
        assert.equal(
          (await request('GET', `/episodes/${episode.id}`, { token })).episode
            .id,
          episode.id,
        );
        assert.deepEqual(
          (
            await request('GET', `/shows/${show.id}/episodes`, { token })
          ).items.map((x) => x.id),
          [episode.id],
        );
        const update = (
          await request('PATCH', `/episodes/${episode.id}`, {
            token,
            body: {
              description: 'Updated',
              guid: randomUUID(),
              status: 'draft',
              show_id: randomUUID(),
            },
          })
        ).episode;
        assert.equal(update.description, 'Updated');
        assert.equal(update.title, episode.title);
        assert.equal(update.guid, episode.guid);
        assert.equal(update.show_id, show.id);
        assert.equal(update.status, 'draft');
        for (const path of [`/shows/${show.id}`, `/episodes/${episode.id}`]) {
          await request('PATCH', path, { token, body: {}, status: 400 });
          await request('PATCH', path, {
            token,
            body: { title: ' ' },
            status: 400,
          });
        }
        await request('GET', '/shows/not-a-uuid', { token, status: 400 });
      },
    );
    await t.test(
      'anonymous and unrelated accounts cannot read or mutate drafts',
      async () => {
        assert.deepEqual(
          (await request('GET', '/shows', { token: outsiderToken })).items,
          [],
        );
        for (const [method, path] of [
          ['GET', `/shows/${show.id}`],
          ['PATCH', `/shows/${show.id}`],
          ['DELETE', `/shows/${show.id}`],
          ['GET', `/shows/${show.id}/episodes`],
          ['POST', `/shows/${show.id}/episodes`],
          ['GET', `/episodes/${episode.id}`],
          ['PATCH', `/episodes/${episode.id}`],
          ['DELETE', `/episodes/${episode.id}`],
        ]) {
          await request(method, path, {
            body:
              method === 'PATCH' || method === 'POST'
                ? { title: 'Intrusion' }
                : undefined,
            status: 401,
          });
          await request(method, path, {
            token: outsiderToken,
            body:
              method === 'PATCH' || method === 'POST'
                ? { title: 'Intrusion' }
                : undefined,
            status: 404,
          });
        }
        await request('GET', '/shows', { status: 401 });
        await request('POST', '/shows', {
          body: { title: 'Intrusion' },
          status: 401,
        });
      },
    );
    await t.test(
      'editors and producers can edit but only owners can delete',
      async () => {
        for (const role of ['editor', 'producer']) {
          await pool.query(
            `INSERT INTO show_members (show_id,user_id,role) VALUES ($1,$2,$3)
          ON CONFLICT (show_id,user_id) DO UPDATE SET role=EXCLUDED.role`,
            [show.id, outsider.id, role],
          );
          assert.deepEqual(
            (
              await request('GET', '/shows', { token: outsiderToken })
            ).items.map((x) => x.id),
            [show.id],
          );
          await request('PATCH', `/shows/${show.id}`, {
            token: outsiderToken,
            body: { description: role },
          });
          await request('PATCH', `/episodes/${episode.id}`, {
            token: outsiderToken,
            body: { title: role },
          });
          await request('POST', `/shows/${show.id}/episodes`, {
            token: outsiderToken,
            body: { title: role },
            status: 201,
          });
          await request('DELETE', `/shows/${show.id}`, {
            token: outsiderToken,
            status: 403,
          });
          await request('DELETE', `/episodes/${episode.id}`, {
            token: outsiderToken,
            status: 403,
          });
        }
        await pool.query(
          'DELETE FROM show_members WHERE show_id=$1 AND user_id=$2',
          [show.id, outsider.id],
        );
        await request('GET', `/shows/${show.id}`, {
          token: outsiderToken,
          status: 404,
        });
      },
    );
    await t.test(
      'owner deletion restricts nonempty shows and deletes empty drafts',
      async () => {
        await request('DELETE', `/episodes/${episode.id}`, {
          token,
          status: 204,
        });
        await request('GET', `/episodes/${episode.id}`, { token, status: 404 });
        await request('DELETE', `/shows/${show.id}`, { token, status: 409 });
        const remaining = (
          await request('GET', `/shows/${show.id}/episodes`, { token })
        ).items;
        for (const item of remaining)
          await request('DELETE', `/episodes/${item.id}`, {
            token,
            status: 204,
          });
        await request('DELETE', `/shows/${show.id}`, { token, status: 204 });
        await request('GET', `/shows/${show.id}`, { token, status: 404 });
        assert.equal(
          (
            await pool.query('SELECT * FROM episodes WHERE show_id=$1', [
              show.id,
            ])
          ).rowCount,
          0,
        );
      },
    );
    await t.test(
      'podcast metadata, optional seasons, lifecycle, pagination and isolation',
      async () => {
        const s = (
          await request('POST', '/shows', {
            token,
            status: 201,
            body: {
              title: 'Serial',
              show_type: 'serial',
              language: 'en-US',
              explicit: true,
              author: 'Creator',
              website_url: 'https://example.test',
            },
          })
        ).show;
        assert.equal(s.workspace_id, owner.id);
        const season = (
          await request('POST', `/shows/${s.id}/seasons`, {
            token,
            status: 201,
            body: { title: 'Season one', season_number: 1 },
          })
        ).season;
        await request('POST', `/shows/${s.id}/seasons`, {
          token,
          status: 409,
          body: { title: 'Duplicate', season_number: 1 },
        });
        await request('GET', `/seasons/${season.id}`, {
          token: outsiderToken,
          status: 404,
        });
        const e = (
          await request('POST', `/shows/${s.id}/episodes`, {
            token,
            status: 201,
            body: {
              title: 'Trailer',
              season_id: season.id,
              episode_number: 1,
              episode_type: 'trailer',
            },
          })
        ).episode;
        assert.equal(e.explicit, null);
        await request('DELETE', `/seasons/${season.id}`, {
          token,
          status: 409,
        });
        const other = (
          await request('POST', '/shows', {
            token,
            status: 201,
            body: { title: 'Other' },
          })
        ).show;
        await request('POST', `/shows/${other.id}/episodes`, {
          token,
          status: 400,
          body: { title: 'Wrong season', season_id: season.id },
        });
        await assert.rejects(
          pool.query('UPDATE episodes SET show_id=$1 WHERE id=$2', [
            other.id,
            e.id,
          ]),
          { code: '23503' },
        );
        await request('PATCH', `/episodes/${e.id}`, {
          token,
          status: 400,
          body: { status: 'scheduled' },
        });
        await request('PATCH', `/episodes/${e.id}`, {
          token,
          body: { status: 'scheduled', publish_at: '2099-01-01T12:00:00Z' },
        });
        await request('PATCH', `/episodes/${e.id}`, {
          token,
          status: 400,
          body: { status: 'published' },
        });
        await request('PATCH', `/episodes/${e.id}`, {
          token,
          body: { status: 'published', publish_at: '2026-01-01T12:00:00Z' },
        });
        await request('DELETE', `/episodes/${e.id}`, { token, status: 409 });
        await request('PATCH', `/episodes/${e.id}`, {
          token,
          status: 409,
          body: { status: 'draft' },
        });
        await request('PATCH', `/episodes/${e.id}`, {
          token,
          body: { status: 'archived' },
        });
        await request('PATCH', `/episodes/${e.id}`, {
          token,
          status: 409,
          body: { status: 'draft' },
        });
        await request('PATCH', `/shows/${s.id}`, {
          token,
          body: { status: 'published' },
        });
        await request('PATCH', `/shows/${s.id}`, {
          token,
          body: { status: 'archived' },
        });
        await request('PATCH', `/shows/${s.id}`, {
          token,
          status: 409,
          body: { status: 'draft' },
        });
        for (const body of [
          { language: [] },
          { show_type: 'invalid' },
          { explicit: 'false' },
          { slug: 'Bad Slug' },
        ])
          await request('PATCH', `/shows/${other.id}`, {
            token,
            status: 400,
            body,
          });
        for (const body of [
          { episode_type: 'invalid' },
          { episode_number: 0 },
          { publish_at: 'not-a-date' },
          { status: 'scheduled', publish_at: '2000-01-01T00:00:00Z' },
        ])
          await request('PATCH', `/episodes/${e.id}`, {
            token,
            status: 400,
            body,
          });
        await request('PATCH', `/seasons/${season.id}`, {
          token,
          body: { title: 'Renamed season', season_number: 2 },
        });
        assert.equal(
          (await request('GET', `/shows/${s.id}/seasons`, { token })).items[0]
            .season_number,
          2,
        );
        const emptySeason = (
          await request('POST', `/shows/${s.id}/seasons`, {
            token,
            status: 201,
            body: { title: 'Empty', season_number: 3 },
          })
        ).season;
        await request('DELETE', `/seasons/${emptySeason.id}`, {
          token,
          status: 204,
        });
        await request('GET', `/seasons/${emptySeason.id}`, {
          token,
          status: 404,
        });
        const direct = (
          await request('POST', `/shows/${s.id}/episodes`, {
            token,
            status: 201,
            body: { title: 'No season' },
          })
        ).episode;
        assert.equal(direct.season_id, null);
        const page = await request(
          'GET',
          `/shows/${s.id}/episodes?limit=1&sort=title&direction=asc`,
          { token },
        );
        assert.equal(page.items.length, 1);
        assert.equal(page.pagination.has_more, true);
        assert.equal(
          (
            await request(
              'GET',
              `/shows/${s.id}/episodes?season_id=none&status=draft`,
              { token },
            )
          ).items.length,
          1,
        );
        await request('GET', '/shows?limit=101', { token, status: 400 });
        await request('GET', '/shows?sort=invalid', { token, status: 400 });
        await request('PATCH', `/shows/${s.id}`, {
          token,
          status: 400,
          body: { website_url: 'javascript:alert(1)' },
        });
        assert.equal(
          (await request('GET', '/workspaces', { token })).items[0].owner_id,
          owner.id,
        );
      },
    );
    await t.test(
      'image library validation, isolation, references and persistence',
      async () => {
        const bytes = await sharp({
          create: { width: 32, height: 24, channels: 3, background: '#cc4433' },
        })
          .png()
          .toBuffer();
        const path = `/workspaces/${owner.id}/media`;
        async function uploadImage({
          auth = token,
          content = bytes,
          mime = 'image/png',
          status = 201,
        } = {}) {
          const response = await fetch(
            base + path + '?filename=../../cover.png',
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${auth}`,
                'Content-Type': mime,
              },
              body: content,
            },
          );
          assert.equal(response.status, status);
          return response.json();
        }
        await uploadImage({ auth: '', status: 401 });
        await uploadImage({ auth: outsiderToken, status: 404 });
        await uploadImage({ mime: 'image/jpeg', status: 400 });
        await uploadImage({
          content: Buffer.from('not an image'),
          status: 400,
        });
        await uploadImage({ content: bytes.subarray(0, 40), status: 400 });
        await uploadImage({ mime: 'image/svg+xml', status: 415 });
        await uploadImage({
          content: Buffer.alloc(10 * 1024 * 1024 + 1),
          status: 413,
        });
        const { asset: a } = await uploadImage();
        const { asset: b } = await uploadImage();
        assert.equal(a.original_filename, 'cover.png');
        assert.equal(a.width, 32);
        assert.equal(a.height, 24);
        assert.equal(
          (await request('GET', path + '?limit=1', { token })).pagination
            .has_more,
          true,
        );
        await request('GET', path + '?sort=invalid', { token, status: 400 });
        await request('PATCH', path + '/' + a.id, {
          token,
          body: { alt_text: 'Red cover' },
        });
        assert.equal(
          (await request('GET', path + '/' + a.id, { token })).asset.alt_text,
          'Red cover',
        );
        for (const method of ['GET', 'PATCH', 'DELETE'])
          await request(method, path + '/' + a.id, {
            token: outsiderToken,
            body: method === 'PATCH' ? { alt_text: 'intrusion' } : undefined,
            status: 404,
          });
        for (const auth of ['', outsiderToken])
          assert.equal(
            (
              await fetch(base + path + '/' + a.id + '/content', {
                headers: { Authorization: `Bearer ${auth}` },
              })
            ).status,
            auth ? 404 : 401,
          );
        const content = await fetch(base + path + '/' + a.id + '/content', {
          headers: { Authorization: `Bearer ${token}` },
        });
        assert.deepEqual(Buffer.from(await content.arrayBuffer()), bytes);
        const s = (
          await request('POST', '/shows', {
            token,
            status: 201,
            body: { title: 'Art show', cover_asset_id: a.id },
          })
        ).show;
        const e = (
          await request('POST', `/shows/${s.id}/episodes`, {
            token,
            status: 201,
            body: { title: 'Art episode', cover_asset_id: a.id },
          })
        ).episode;
        await request('DELETE', path + '/' + a.id, { token, status: 409 });
        const foreign = (
          await request('POST', '/shows', {
            token: outsiderToken,
            status: 201,
            body: { title: 'Foreign' },
          })
        ).show;
        await request('PATCH', `/shows/${foreign.id}`, {
          token: outsiderToken,
          status: 400,
          body: { cover_asset_id: a.id },
        });
        await assert.rejects(
          pool.query('UPDATE shows SET cover_asset_id=$1 WHERE id=$2', [
            a.id,
            foreign.id,
          ]),
          { code: '23503' },
        );
        await assert.rejects(
          pool.query('UPDATE episodes SET workspace_id=$1 WHERE id=$2', [
            outsider.id,
            e.id,
          ]),
          { code: '23503' },
        );
        await request('PATCH', `/shows/${s.id}`, {
          token,
          body: { cover_asset_id: b.id },
        });
        await request('DELETE', path + '/' + a.id, { token, status: 409 });
        await request('PATCH', `/episodes/${e.id}`, {
          token,
          body: { cover_asset_id: null },
        });
        assert.equal(
          (await request('GET', `/shows/${s.id}`, { token })).show
            .cover_asset_id,
          b.id,
        );
        assert.equal(
          (await request('GET', `/episodes/${e.id}`, { token })).episode
            .cover_asset_id,
          null,
        );
        await request('GET', path + '/' + a.id, { token });
        await request('DELETE', path + '/' + a.id, { token, status: 204 });
        await request('GET', path + '/' + a.id, { token, status: 404 });
        await request('PATCH', `/shows/${s.id}`, {
          token,
          body: { cover_asset_id: null },
        });
        await request('GET', path + '/' + b.id, { token });
        await request('DELETE', path + '/' + b.id, { token, status: 204 });
      },
    );
    await t.test(
      'audio validation, delivery, typed workspace relationships and lifecycle',
      async () => {
        const bytes = silentMp3();
        const path = `/workspaces/${owner.id}/media`;
        async function upload(
          content = bytes,
          mime = 'audio/mpeg',
          status = 201,
          auth = token,
          workspace = owner.id,
        ) {
          const response = await fetch(
            `${base}/workspaces/${workspace}/media?filename=../../episode.mp3`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${auth}`,
                'Content-Type': mime,
              },
              body: content,
            },
          );
          assert.equal(response.status, status);
          return (await response.json()).asset;
        }
        await upload(bytes, 'audio/wav', 415);
        await upload(bytes, 'image/png', 400);
        await upload(Buffer.from('not audio'), 'audio/mpeg', 400);
        await upload(bytes.subarray(0, bytes.length - 1), 'audio/mpeg', 400);
        await upload(Buffer.alloc(0), 'audio/mpeg', 413);
        process.env.AUDIO_MAX_UPLOAD_BYTES = '100';
        try {
          await upload(bytes, 'audio/mpeg', 413);
          const chunked = await fetch(base + path + '?filename=oversized.mp3', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'audio/mpeg',
            },
            duplex: 'half',
            body: (async function* () {
              yield bytes.subarray(0, 50);
              yield bytes.subarray(50);
            })(),
          });
          assert.equal(chunked.status, 413);
          assert.match((await chunked.json()).error, /Maximum upload/);
        } finally {
          delete process.env.AUDIO_MAX_UPLOAD_BYTES;
        }
        await upload(bytes, 'audio/mpeg', 401, '');
        await upload(bytes, 'audio/mpeg', 404, outsiderToken);
        const a = await upload(),
          b = await upload();
        assert.equal(a.asset_type, 'audio');
        assert.equal(a.mime_type, 'audio/mpeg');
        assert.equal(a.original_filename, 'episode.mp3');
        assert.equal(a.width, null);
        assert.equal(Number(a.size_bytes), bytes.length);
        assert.ok(Math.abs(a.duration_seconds - (40 * 1152) / 44100) < 0.001);
        const foreign = await upload(
          bytes,
          'audio/mpeg',
          201,
          outsiderToken,
          outsider.id,
        );
        const image = await upload(
          await sharp({
            create: { width: 8, height: 8, channels: 3, background: 'red' },
          })
            .png()
            .toBuffer(),
          'image/png',
        );
        const audioList = await request('GET', path + '?type=audio', { token });
        assert.ok(audioList.items.length >= 2);
        assert.ok(audioList.items.every((a) => a.asset_type === 'audio'));
        assert.ok(
          (await request('GET', path + '?type=image', { token })).items.every(
            (a) => a.asset_type === 'image',
          ),
        );
        await request('GET', path + '?type=bad', { token, status: 400 });
        const s = (
          await request('POST', '/shows', {
            token,
            status: 201,
            body: { title: 'Audio show' },
          })
        ).show;
        const e = (
          await request('POST', `/shows/${s.id}/episodes`, {
            token,
            status: 201,
            body: { title: 'Audio episode' },
          })
        ).episode;
        assert.equal(e.primary_audio_asset_id, null);
        for (const id of [image.id, foreign.id]) {
          await request('PATCH', `/episodes/${e.id}`, {
            token,
            status: 400,
            body: { primary_audio_asset_id: id },
          });
          await assert.rejects(
            pool.query(
              'UPDATE episodes SET primary_audio_asset_id=$1 WHERE id=$2',
              [id, e.id],
            ),
            { code: '23503' },
          );
        }
        await request('PATCH', `/shows/${s.id}`, {
          token,
          status: 400,
          body: { cover_asset_id: a.id },
        });
        await request('PATCH', `/episodes/${e.id}`, {
          token,
          body: { primary_audio_asset_id: a.id },
        });
        assert.equal(
          (await request('GET', `/episodes/${e.id}`, { token })).episode
            .primary_audio_asset_id,
          a.id,
        );
        await request('DELETE', path + '/' + a.id, { token, status: 409 });
        const contentUrl = base + path + '/' + a.id + '/content';
        for (const [auth, status] of [
          ['', 401],
          [outsiderToken, 404],
        ]) {
          assert.equal(
            (
              await fetch(contentUrl, {
                headers: {
                  Authorization: `Bearer ${auth}`,
                  Range: 'bytes=0-99',
                },
              })
            ).status,
            status,
          );
        }
        const full = await fetch(contentUrl, {
          headers: { Authorization: `Bearer ${token}` },
        });
        assert.equal(full.status, 200);
        assert.equal(full.headers.get('content-type'), 'audio/mpeg');
        assert.equal(full.headers.get('accept-ranges'), 'bytes');
        assert.deepEqual(Buffer.from(await full.arrayBuffer()), bytes);
        for (const [range, start, end] of [
          ['bytes=0-99', 0, 99],
          ['bytes=100-', 100, bytes.length - 1],
          ['bytes=-10', bytes.length - 10, bytes.length - 1],
          ['bytes=0-999999', 0, bytes.length - 1],
        ]) {
          const response = await fetch(contentUrl, {
            headers: { Authorization: `Bearer ${token}`, Range: range },
          });
          assert.equal(response.status, 206);
          assert.equal(
            response.headers.get('content-range'),
            `bytes ${start}-${end}/${bytes.length}`,
          );
          assert.deepEqual(
            Buffer.from(await response.arrayBuffer()),
            bytes.subarray(start, end + 1),
          );
        }
        for (const range of [
          'bytes=999999-',
          'bytes=4-2',
          'bytes=-0',
          'bytes=0-1,4-5',
          'nonsense',
        ]) {
          const response = await fetch(contentUrl, {
            headers: { Authorization: `Bearer ${token}`, Range: range },
          });
          assert.equal(response.status, 416);
          assert.equal(
            response.headers.get('content-range'),
            `bytes */${bytes.length}`,
          );
        }
        await request('PATCH', `/episodes/${e.id}`, {
          token,
          body: { primary_audio_asset_id: b.id },
        });
        await request('GET', path + '/' + a.id, { token });
        await request('DELETE', path + '/' + b.id, { token, status: 409 });
        await request('PATCH', `/episodes/${e.id}`, {
          token,
          body: { primary_audio_asset_id: null },
        });
        assert.equal(
          (await request('GET', `/episodes/${e.id}`, { token })).episode.status,
          'draft',
        );
        for (const id of [a.id, b.id, image.id])
          await request('DELETE', path + '/' + id, { token, status: 204 });
        await request('GET', path + '/' + a.id, { token, status: 404 });
      },
    );
    await t.test(
      'expired and logged-out sessions cannot be reused',
      async () => {
        const expiring = await login(owner.email);
        await pool.query(
          "UPDATE sessions SET expires_at=now() - interval '1 second' WHERE token_hash=$1",
          [hash(expiring)],
        );
        await request('GET', '/auth/me', { token: expiring, status: 401 });
        await request('POST', '/auth/logout', { token, status: 204 });
        await request('GET', '/auth/me', { token, status: 401 });
        assert.equal(
          (
            await pool.query('SELECT * FROM sessions WHERE token_hash=$1', [
              hash(token),
            ])
          ).rowCount,
          0,
        );
        await request('GET', '/auth/me', { token: outsiderToken });
      },
    );
  } finally {
    await rm(mediaDirectory, { recursive: true, force: true });
    if (previousUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = previousUrl;
    try {
      if (server?.listening)
        await new Promise((resolve, reject) =>
          server.close((error) => (error ? reject(error) : resolve())),
        );
      if (pool) await pool.end();
    } finally {
      try {
        if (created)
          await admin.query(`DROP DATABASE "${database}" WITH (FORCE)`);
      } finally {
        await admin.end();
      }
    }
  }
});

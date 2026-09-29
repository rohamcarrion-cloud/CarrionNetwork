import { test } from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { validateImage } from './media.js';
import { filesystemStorage } from './storage.js';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';

test('fully verifies supported formats and bounded dimensions', async () => {
  for (const [format, mime] of [
    ['png', 'image/png'],
    ['jpeg', 'image/jpeg'],
    ['webp', 'image/webp'],
  ]) {
    const bytes = await sharp({
      create: { width: 12, height: 8, channels: 3, background: 'red' },
    })
      [format]()
      .toBuffer();
    assert.deepEqual(await validateImage(bytes, mime), {
      width: 12,
      height: 8,
    });
    await assert.rejects(validateImage(bytes.subarray(0, 20), mime), {
      status: 400,
    });
  }
  const wide = await sharp({
    create: { width: 10001, height: 1, channels: 3, background: 'red' },
  })
    .png()
    .toBuffer();
  await assert.rejects(validateImage(wide, 'image/png'), { status: 400 });
  await assert.rejects(validateImage(Buffer.from('<svg/>'), 'image/svg+xml'), {
    status: 415,
  });
});
test('filesystem adapter contains keys and supports round trip and idempotent delete', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'storage-test-'));
  try {
    const storage = filesystemStorage(directory),
      key = randomUUID(),
      bytes = Buffer.from('test');
    await storage.put(key, bytes);
    assert.deepEqual(await storage.get(key), bytes);
    await assert.rejects(storage.put(key, bytes), { code: 'EEXIST' });
    assert.throws(() => storage.get('../escape'));
    await storage.delete(key);
    await storage.delete(key);
    await assert.rejects(storage.get(key), { code: 'ENOENT' });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

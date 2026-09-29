import { test } from 'node:test';
import assert from 'node:assert/strict';
import { silentMp3 } from '../test/helpers/audio.js';
import { validateAudio, audioLimit } from './audio.js';
import { byteRange } from './range.js';

test('MP3 full-frame validation, metadata, tags and corrupt content', async () => {
  const bytes = silentMp3();
  assert.ok((await validateAudio(bytes, 'audio/mpeg')).duration_seconds > 1);
  const tagged = Buffer.concat([
    Buffer.from([73, 68, 51, 4, 0, 0, 0, 0, 0, 0]),
    bytes,
    Buffer.concat([Buffer.from('TAG'), Buffer.alloc(125)]),
  ]);
  assert.ok((await validateAudio(tagged, 'audio/mpeg')).duration_seconds > 1);
  for (const bad of [
    bytes.subarray(0, 200),
    bytes.subarray(0, -1),
    Buffer.concat([bytes, Buffer.from('garbage')]),
    Buffer.from('ID3'),
    Buffer.alloc(500),
  ]) {
    await assert.rejects(validateAudio(bad, 'audio/mpeg'), { status: 400 });
  }
  const broken = Buffer.from(bytes);
  broken[418] = 0;
  await assert.rejects(validateAudio(broken, 'audio/mpeg'), { status: 400 });
  await assert.rejects(validateAudio(bytes, 'audio/wav'), { status: 415 });
  await assert.rejects(validateAudio(Buffer.alloc(0), 'audio/mpeg'), {
    status: 413,
  });
});
test('upload limits reject invalid configuration and range parsing is bounded', () => {
  const previous = process.env.AUDIO_MAX_UPLOAD_BYTES;
  process.env.AUDIO_MAX_UPLOAD_BYTES = '-1';
  try {
    assert.throws(audioLimit);
  } finally {
    if (previous === undefined) delete process.env.AUDIO_MAX_UPLOAD_BYTES;
    else process.env.AUDIO_MAX_UPLOAD_BYTES = previous;
  }
  assert.deepEqual(byteRange('bytes=-50', 100), { start: 50, end: 99 });
  for (const value of [
    'bytes=9007199254740993-',
    'bytes=-',
    'bytes=2-1',
    'bytes=100-',
    'bytes=0-1,2-3',
  ])
    assert.throws(() => byteRange(value, 100), { status: 416 });
});

test('accepts variable bitrates and lower MPEG sample rates without trusting duration tags', async () => {
  for (const [versionByte, rate, samplesPerFrame, bitrates] of [
    [0xfb, 44100, 1152, [128, 160]],
    [0xf3, 22050, 576, [80, 96]],
    [0xe3, 11025, 576, [80, 96]],
  ]) {
    const frames = Array.from({ length: 40 }, (_, i) => {
      const frame = Buffer.alloc(
        Math.floor(
          ((versionByte === 0xfb ? 144000 : 72000) * bitrates[i % 2]) / rate,
        ),
      );
      frame.set([255, versionByte, i % 2 ? 0xa0 : 0x90, 0]);
      return frame;
    });
    const metadata = await validateAudio(Buffer.concat(frames), 'audio/mpeg');
    assert.ok(
      Math.abs(metadata.duration_seconds - (40 * samplesPerFrame) / rate) <
        0.001,
    );
  }
});

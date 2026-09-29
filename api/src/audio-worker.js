import { parentPort, workerData } from 'node:worker_threads';
import { MPEGDecoder } from 'mpg123-decoder';

// Require a complete Layer III frame sequence; a permissive decoder alone can
// skip garbage and accept truncated files. ID3v2 and ID3v1 are the only tags.
const bytes = Buffer.from(
  workerData.buffer,
  workerData.byteOffset,
  workerData.byteLength,
);
const invalid = () => {
  throw new Error('Invalid, corrupt or unsupported MP3 content');
};
let decoder;
try {
  let offset = 0,
    end = bytes.length;
  if (bytes.toString('ascii', 0, 3) === 'ID3') {
    const version = bytes[3];
    if (
      ![2, 3, 4].includes(version) ||
      bytes.length < 10 ||
      bytes[4] === 255 ||
      [...bytes.subarray(6, 10)].some((v) => v > 127) ||
      bytes[5] & (version === 2 ? 0x3f : version === 3 ? 0x1f : 0x0f)
    )
      invalid();
    offset = 10 + bytes.subarray(6, 10).reduce((n, v) => n * 128 + v, 0);
    if (version === 4 && bytes[5] & 16) offset += 10;
    if (offset >= end) invalid();
  }
  if (bytes.toString('ascii', end - 128, end - 125) === 'TAG') end -= 128;
  decoder = new MPEGDecoder();
  await decoder.ready;
  let frames = 0,
    duration = 0,
    samples = 0,
    streamRate,
    streamChannels;
  while (offset < end) {
    if (offset + 4 > end) invalid();
    const a = bytes[offset],
      b = bytes[offset + 1],
      c = bytes[offset + 2],
      d = bytes[offset + 3];
    const version = (b >> 3) & 3,
      layer = (b >> 1) & 3,
      bitrateIndex = c >> 4,
      rateIndex = (c >> 2) & 3;
    if (
      a !== 255 ||
      (b & 224) !== 224 ||
      version === 1 ||
      layer !== 1 ||
      !bitrateIndex ||
      bitrateIndex === 15 ||
      rateIndex === 3 ||
      (d & 3) === 2
    )
      invalid();
    const rate =
      [44100, 48000, 32000][rateIndex] /
      (version === 3 ? 1 : version === 2 ? 2 : 4);
    const bitrate = (
      version === 3
        ? [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320]
        : [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160]
    )[bitrateIndex];
    const channels = d >> 6 === 3 ? 1 : 2;
    streamRate ??= rate;
    streamChannels ??= channels;
    if (streamRate !== rate || streamChannels !== channels) invalid();
    const length =
      Math.floor(((version === 3 ? 144000 : 72000) * bitrate) / rate) +
      ((c >> 1) & 1);
    if (offset + length > end) invalid();
    const result = decoder.decode(bytes.subarray(offset, offset + length));
    if (result.errors.length) invalid();
    samples += result.samplesDecoded;
    duration += (version === 3 ? 1152 : 576) / rate;
    frames++;
    offset += length;
  }
  if (frames < 2 || samples === 0) invalid();
  parentPort.postMessage({ metadata: { duration_seconds: duration } });
} catch {
  parentPort.postMessage({
    error: 'Invalid, corrupt or unsupported MP3 content',
  });
} finally {
  decoder?.free();
}

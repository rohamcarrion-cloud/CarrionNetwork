import { Worker } from 'node:worker_threads';

export function audioLimit() {
  const value = Number(process.env.AUDIO_MAX_UPLOAD_BYTES || 100 * 1024 * 1024);
  if (!Number.isSafeInteger(value) || value < 1 || value > 1024 * 1024 * 1024)
    throw new Error('AUDIO_MAX_UPLOAD_BYTES must be 1–1073741824');
  return value;
}
export async function validateAudio(bytes, mime) {
  if (mime !== 'audio/mpeg')
    throw Object.assign(new Error('Use MP3 audio (audio/mpeg)'), {
      status: 415,
    });
  if (!bytes.length || bytes.length > audioLimit())
    throw Object.assign(new Error(`Audio must be 1–${audioLimit()} bytes`), {
      status: 413,
    });
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./audio-worker.js', import.meta.url), {
      workerData: bytes,
    });
    const timer = setTimeout(
      () => finish(new Error('Audio validation timed out')),
      120000,
    );
    let finished = false;
    function finish(error, metadata) {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      void worker.terminate();
      if (error) reject(Object.assign(error, { status: 400 }));
      else resolve(metadata);
    }
    worker.once('message', (result) =>
      finish(result.error ? new Error(result.error) : null, result.metadata),
    );
    worker.once('error', (error) => finish(error));
    worker.once('exit', (code) => {
      if (!finished) finish(new Error(`Audio validation stopped (${code})`));
    });
  });
}

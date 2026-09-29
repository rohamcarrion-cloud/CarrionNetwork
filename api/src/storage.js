import { mkdir, writeFile, readFile, unlink } from 'node:fs/promises';
import { resolve, join } from 'node:path';

// Adapter contract: put(key, bytes), get(key), delete(key). No public paths.
export function filesystemStorage(
  root = process.env.MEDIA_STORAGE_DIR || './var/media',
) {
  const directory = resolve(root);
  const path = (key) => {
    if (!/^[a-f0-9-]{36}$/.test(key)) throw new Error('Invalid storage key');
    return join(directory, key);
  };
  return {
    async put(key, bytes) {
      await mkdir(directory, { recursive: true, mode: 0o700 });
      await writeFile(path(key), bytes, { flag: 'wx', mode: 0o600 });
    },
    get: (key) => readFile(path(key)),
    async delete(key) {
      try {
        await unlink(path(key));
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }
    },
  };
}

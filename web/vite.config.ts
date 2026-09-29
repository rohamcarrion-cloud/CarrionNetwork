import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

const proxy = {
  '/api': {
    target: process.env.API_PROXY_TARGET || 'http://127.0.0.1:3010',
    rewrite: (path: string) => path.replace(/^\/api/, ''),
  },
};

export default defineConfig({
  plugins: [react()],
  server: { host: '127.0.0.1', port: 5173, strictPort: true, proxy },
  preview: { proxy },
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    restoreMocks: true,
  },
});

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 60000,
  workers: 1,
  use: { baseURL: 'http://127.0.0.1:5174', trace: 'retain-on-failure' },
  projects: [
    {
      name: 'desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 1000 },
      },
    },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: [
    {
      command: 'node --env-file-if-exists=../.env e2e/server.mjs',
      url: 'http://127.0.0.1:3011/health',
      reuseExistingServer: false,
      gracefulShutdown: { signal: 'SIGTERM', timeout: 10000 },
    },
    {
      command:
        'npm exec vite -- build --outDir dist-e2e && npm exec vite -- preview --outDir dist-e2e --host 127.0.0.1 --port 5174 --strictPort',
      env: { VITE_API_URL: '/api', API_PROXY_TARGET: 'http://127.0.0.1:3011' },
      url: 'http://127.0.0.1:5174',
      reuseExistingServer: false,
    },
  ],
});

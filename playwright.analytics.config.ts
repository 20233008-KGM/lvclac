import { defineConfig } from '@playwright/test'

process.env.EARLY_ANALYTICS_E2E = '1'
export default defineConfig({
  testDir: './e2e', testMatch: 'early-analytics.spec.ts', workers: 1,
  use: {
    screenshot: 'only-on-failure', trace: 'retain-on-failure',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
  },
  webServer: {
    command: 'npx vite --host 127.0.0.1 --port 4185 --mode test',
    url: 'http://127.0.0.1:4185', reuseExistingServer: false,
    env: { VITE_POSTHOG_KEY: 'phc_early_test', VITE_CLARITY_PROJECT_ID: 'early-test' },
  },
})

import { defineConfig } from '@playwright/test'

const port = 5191
const baseURL = `http://127.0.0.1:${port}`

export default defineConfig({
  testDir: './e2e',
  testMatch: ['per-contract-margin.spec.ts', 'rate-input-precision.spec.ts'],
  workers: 1,
  reporter: 'list',
  use: { baseURL, screenshot: 'only-on-failure', trace: 'retain-on-failure' },
  webServer: {
    command: `npm run dev -- --host 127.0.0.1 --port ${port} --strictPort`,
    url: baseURL,
    reuseExistingServer: false,
  },
})

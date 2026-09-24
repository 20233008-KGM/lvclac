import { defineConfig } from '@playwright/test'
import base from './playwright.config'

// Isolated port: never reuse a preview belonging to another worktree/task.
export default defineConfig({
  ...base,
  testMatch: 'memo-policy.spec.ts',
  use: { ...base.use, baseURL: 'http://127.0.0.1:4186' },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 4186 --strictPort',
    url: 'http://127.0.0.1:4186', reuseExistingServer: false, timeout: 120_000,
  },
})

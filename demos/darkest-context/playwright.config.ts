import { defineConfig, devices } from '@playwright/test';

// Chromium only, headless (PRD §5). Gates serve the built site so every spec
// exercises the same relative-path dist judges will see.
export default defineConfig({
  testDir: './e2e',
  // Gates are stub-mode only (PRD §5): specs tagged @live need real API keys and
  // a dev server, which agents/CI never have — they run only when a human opts
  // in with LIVE=1. Without this fence one @live spec deadlocks every gate.
  grepInvert: process.env.LIVE ? undefined : /@live/,
  use: {
    baseURL: 'http://localhost:4174',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    // Build first: `preview` only serves an existing dist/. A clean checkout
    // (CI, or `rm -rf dist && npm run test:e2e`) has none, so the server would
    // hang and the gate would time out.
    command: 'npm run build && npm run preview -- --port 4174 --strictPort',
    url: 'http://localhost:4174',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});

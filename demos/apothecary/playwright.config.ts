import { defineConfig, devices } from '@playwright/test';

// Chromium only, headless (PRD §2, frozen). Serves the built/preview site
// so the smoke spec exercises the same relative-path dist judges will see.
export default defineConfig({
  testDir: './e2e',
  // Gates are stub-mode only (PRD §4): specs tagged @live need real API keys
  // and a dev server, which agents/CI never have — they run only when a human
  // opts in with LIVE=1 (see e2e/live-smoke.md). Without this fence a single
  // @live spec added by a unit would deadlock every gate in the run.
  grepInvert: process.env.LIVE ? undefined : /@live/,
  use: {
    baseURL: 'http://localhost:4173',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    // Build first: `preview` only serves an existing dist/. A clean checkout
    // (CI, or `rm -rf dist && npm run test:e2e`) has none, so the server
    // would hang and the gate would time out (PR #18 review).
    // E2E=1 adds the harness pages to the build inputs (vite.build-inputs.ts).
    // Without it a build emits the demo home alone, so the deployed dist/ never
    // carries a URL-parameter-driven harness build (PR #33, R2 on vite.config.ts).
    command: 'E2E=1 npm run build && npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});

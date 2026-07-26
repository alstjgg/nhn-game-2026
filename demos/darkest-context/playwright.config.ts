import { defineConfig, devices } from '@playwright/test';

// Chromium only, headless (PRD §5). Gates serve the built site so every spec
// exercises the same relative-path dist judges will see.
//
// ONE port value, and it is overridable. A gate pinned to a literal port fails on
// any machine where that port is taken, and a spec that compares against the same
// literal reports "INV-2 holds" when all it proved is "I happened to own 4174".
// `E2E_PORT=… npm run test:e2e` re-runs the whole suite anywhere; specs take the
// origin off the `baseURL` fixture below, never off a constant of their own.
const PORT = Number(process.env.E2E_PORT ?? 4174);
const ORIGIN = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './e2e',
  // Gates are stub-mode only (PRD §5): specs tagged @live need real API keys and
  // a dev server, which agents/CI never have — they run only when a human opts
  // in with LIVE=1. Without this fence one @live spec deadlocks every gate.
  grepInvert: process.env.LIVE ? undefined : /@live/,
  use: {
    baseURL: ORIGIN,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    // Build first: `preview` only serves an existing dist/. A clean checkout
    // (CI, or `rm -rf dist && npm run test:e2e`) has none, so the server would
    // hang and the gate would time out.
    command: `npm run build && npm run preview -- --port ${PORT} --strictPort`,
    url: ORIGIN,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});

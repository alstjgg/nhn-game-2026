import { defineConfig, devices } from 'playwright/test'

// Chromium only, desktop only, minimum viewport 1280×800 (plan-client-build §2).
// The runner is imported from `playwright/test`: the `playwright` package ships
// it, so `@playwright/test` stays out of devDependencies.
//
// The server is `preview` against a real build (C5, updated 08-04): the §3.7
// pack-copy plugin landed, so a build now emits `data/{scenario,policy}` beside
// the bundle and the e2e boot can fetch its pack.
//
// Two details the flip forces, both deliberate:
//
// - **`--mode development`.** spec-client §5.4 ships the fixtures in DEV builds
//   only, and the suite drives the desk through the fixture stream — a
//   production build would boot the placeholder run and the specs would have no
//   day to play. The build is real either way; only the env mode differs.
// - **its own `--outDir`.** `dist/` is the deploy artefact, and
//   `tests/fixtures/dev-only.test.ts` greps it for fixture strings. The e2e
//   build is not the deploy, so it lands next to it instead of overwriting it.
//   The §3.7 plugin publishes the pack beside the DEPLOY bundle only — that
//   plugin is 윤석's and this run owns no change to it ([u0#c9]) — so
//   `tools/e2e/mirror-pack.mjs` mirrors `dist/data` into this build afterwards.
const PORT = 5174
const OUT_DIR = 'dist-e2e'
const BASE_URL = `http://localhost:${PORT}/nhn-game-2026/`

export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: BASE_URL,
    viewport: { width: 1280, height: 800 },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
  ],
  webServer: {
    command: `npm run build -- --mode development --outDir ${OUT_DIR} --emptyOutDir && node tools/e2e/mirror-pack.mjs ${OUT_DIR} && npm run preview -- --outDir ${OUT_DIR} --port ${PORT} --strictPort`,
    // `--mode development` alone is not enough: `vite build` pins NODE_ENV to
    // production, and `import.meta.env.DEV` follows NODE_ENV first. Without
    // this the fixtures are folded away and the desk boots the placeholder run.
    env: { NODE_ENV: 'development' },
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})

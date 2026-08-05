import { defineConfig, devices } from 'playwright/test'

// Chromium only, desktop only, minimum viewport 1280×800 (plan-client-build §2).
// The runner is imported from `playwright/test`: the `playwright` package ships
// it, so `@playwright/test` stays out of devDependencies.
//
// ── C5 (SPLIT, ruled 08-04) — three hosts, because they prove different things ─
//
// (a) **the fixture round → `npm run dev`.** spec-client §5.4 ships the fixtures
//     in DEV builds only (`driver/demo-run.ts` returns null when
//     `!import.meta.env.DEV`, inv 11), so the §7 run-through and the P0-B
//     captures can only exist on a dev host. That is the `dev` project.
// (b) **the artefact truths → `npm run preview`.** A real production build,
//     served as deployed: the pack loads from `dist/data/` (the §3.7 plugin),
//     nothing reaches a third-party origin (inv 10), no debug or fixture code
//     survived into the bundle (inv 11), the desk boots inside the ~1 s budget.
//     That build is `dist/` itself — the artefact judges see — so this project
//     deliberately gets no `--outDir` of its own.
// (c) a demo-mode build is REJECTED: fixture code in a shipped artefact is
//     exactly what inv 11 prevents.
//
// The per-unit specs keep the host they were written and merged against — a
// dev-MODE build served by `preview` out of its own `--outDir`. u11 may not
// move another unit's oracle to a different host on its way past ([u11#c8]);
// `--mode development` is what keeps the fixtures in that build, and the
// separate out dir is what keeps `dist/` the deploy artefact (which
// `tests/fixtures/dev-only.test.ts` and the preview project both grep).
// `tools/e2e/mirror-pack.mjs` copies the pack the §3.7 plugin published beside
// `dist/` into it, because that plugin is 윤석's and this run owns no change to
// it ([u0#c9]).
const UNIT_PORT = 5174
const PREVIEW_PORT = 5175
const DEV_PORT = 5176
const OUT_DIR = 'dist-e2e'
const unitURL = `http://localhost:${UNIT_PORT}/nhn-game-2026/`
const previewURL = `http://localhost:${PREVIEW_PORT}/nhn-game-2026/`
const devURL = `http://localhost:${DEV_PORT}/nhn-game-2026/`

/** u11's own dev-hosted specs — the §7 run-through and the P0-B captures. */
const DEV_HOSTED = /(acceptance|captures)\.spec\.ts/
const PREVIEW_HOSTED = /preview-smoke\.spec\.ts/

const desktop = { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } }

export default defineConfig({
  testDir: './e2e',
  // NO retries — the race they used to absorb has an owner's ruling now.
  // The residue was TALLY's 900 ms reveal overriding a raise issued in the
  // close→reveal gap; the u7 ruling (민서 08-05, on #116) gives that gap to
  // TALLY outright — it takes the front exactly once, at reveal, and never
  // again until the next run closes. The rule is deterministic, so the suite
  // encodes it instead of retrying around it: every drain waits the reveal
  // out (`e2e/fixtures/harness.ts`, `awaitTallyReveal`) and raises after.
  // A failure here is a real failure; nothing is masked.
  retries: 0,
  use: { viewport: { width: 1280, height: 800 } },
  projects: [
    {
      name: 'chromium',
      testIgnore: [DEV_HOSTED, PREVIEW_HOSTED],
      use: { ...desktop, baseURL: unitURL },
    },
    {
      // Runs AFTER `chromium`, never beside it. `captures.spec.ts` boots the desk
      // ten times, freezes each one and holds the tally count-up for eleven real
      // seconds; `acceptance.spec.ts` drives whole runs. Sharing a worker pool
      // with the unit-hosted suite starved the wall-clock-driven assertions on
      // BOTH sides — `#w-tally [data-tally-state]` sat at `pending` past its 20 s
      // budget, and feed lines were reported outside the viewport mid-scroll.
      //
      // This was invisible until the captures suite began doing real work: it had
      // been failing instantly on a missing reference directory, so it consumed
      // nothing. Serialising the heavy lane is the fix; widening the timeouts
      // would only move the threshold.
      name: 'dev',
      testMatch: DEV_HOSTED,
      dependencies: ['chromium'],
      use: { ...desktop, baseURL: devURL },
    },
    {
      name: 'preview',
      testMatch: PREVIEW_HOSTED,
      use: { ...desktop, baseURL: previewURL },
    },
  ],
  webServer: [
    {
      command: `npm run build -- --mode development --outDir ${OUT_DIR} --emptyOutDir && node tools/e2e/mirror-pack.mjs ${OUT_DIR} && npm run preview -- --outDir ${OUT_DIR} --port ${UNIT_PORT} --strictPort`,
      // `--mode development` alone is not enough: `vite build` pins NODE_ENV to
      // production, and `import.meta.env.DEV` follows NODE_ENV first. Without
      // this the fixtures are folded away and the desk boots the placeholder run.
      env: { NODE_ENV: 'development' },
      url: unitURL,
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
    },
    {
      command: `npm run dev -- --port ${DEV_PORT} --strictPort`,
      url: devURL,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      // The full build, not `vite build` alone: `npm run build` is what the DoD
      // gates on, and its `check` step is what keeps the datapack honest.
      command: `npm run build && npm run preview -- --port ${PREVIEW_PORT} --strictPort`,
      url: previewURL,
      reuseExistingServer: !process.env.CI,
      timeout: 240_000,
    },
  ],
})

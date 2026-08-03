import { defineConfig, devices } from 'playwright/test'

// Chromium only, desktop only, minimum viewport 1280×800 (plan-client-build §2).
// The runner is imported from `playwright/test`: the `playwright` package ships
// it, so `@playwright/test` stays out of devDependencies.
//
// The server is the **dev** server, not `preview`: the physical §3.7 pack-copy
// plugin does not exist yet, so a built `dist/` carries no scenario pack and an
// e2e boot against it could not fetch one. u11 revisits this once §3.7 lands.
const PORT = 5174
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
    command: `npm run dev -- --port ${PORT} --strictPort`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})

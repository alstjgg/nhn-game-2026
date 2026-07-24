import { defineConfig, devices } from '@playwright/test';

// Chromium only, headless (PRD §2, frozen). Serves the built/preview site
// so the smoke spec exercises the same relative-path dist judges will see.
export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:4173',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});

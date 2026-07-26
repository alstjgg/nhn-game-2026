import { defineConfig, devices } from '@playwright/test';

/**
 * Opt-in live integration gate.
 *
 * This config is intentionally separate from playwright.config.ts: it calls the
 * deployed Lambda and therefore consumes Bedrock inference. The Vite process
 * keeps the browser same-origin and forwards /ai/* with the exact Pages Origin
 * accepted by API Gateway.
 */
export default defineConfig({
  testDir: './e2e',
  testMatch: 'live-lambda.spec.ts',
  timeout: 180_000,
  expect: {
    timeout: 15_000,
  },
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: 'http://127.0.0.1:4174',
    viewport: { width: 1280, height: 720 },
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium-live-lambda', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run dev:lambda -- --host 127.0.0.1 --port 4174 --strictPort',
    url: 'http://127.0.0.1:4174',
    reuseExistingServer: false,
    timeout: 120_000,
  },
});

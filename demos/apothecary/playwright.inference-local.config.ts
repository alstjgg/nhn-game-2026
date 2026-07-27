import { defineConfig, devices } from '@playwright/test';

/**
 * Opt-in local Bedrock matrix.
 *
 * This config starts the Lambda handler through its local HTTP adapter and
 * points the game proxy at it. The test consumes four real Bedrock inferences,
 * so it stays out of the default E2E gate.
 */
export default defineConfig({
  testDir: './e2e',
  testMatch: 'local-inference-matrix.spec.ts',
  timeout: 240_000,
  expect: {
    // A live Haiku request can legitimately outlast the regular UI gate.
    // Keep this aligned with the local-only model/deadline overrides above.
    timeout: 75_000,
  },
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: 'http://127.0.0.1:4174',
    viewport: { width: 1600, height: 1000 },
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium-local-inference',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command:
        'AWS_PROFILE=nhn-game AWS_SDK_LOAD_CONFIG=1 LOCAL_MODEL_TIMEOUT_MS=60000 npm --prefix ../../infra/llm-layer run local:api',
      url: 'http://127.0.0.1:8792/ai/health',
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command:
        'APOTHECARY_AI_UPSTREAM_URL=http://127.0.0.1:8792 VITE_DIALOGUE_TIMEOUT_MS=65000 VITE_LIVE_DEADLINE_MS=70000 npm run dev:lambda -- --port 4174 --strictPort',
      url: 'http://127.0.0.1:4174',
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
});

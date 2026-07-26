import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const viteSource = readFileSync(new URL('../../vite.config.ts', import.meta.url), 'utf8');
const mainSource = readFileSync(new URL('../../src/main.ts', import.meta.url), 'utf8');
const playwrightSource = readFileSync(
  new URL('../../playwright.config.ts', import.meta.url),
  'utf8',
);
const lambdaPlaywrightSource = readFileSync(
  new URL('../../playwright.lambda.config.ts', import.meta.url),
  'utf8',
);
const liveLambdaSpecSource = readFileSync(
  new URL('../../e2e/live-lambda.spec.ts', import.meta.url),
  'utf8',
);
const packageJson = JSON.parse(
  readFileSync(new URL('../../package.json', import.meta.url), 'utf8'),
) as { scripts: Record<string, string> };

describe('local deployed-Lambda development mode', () => {
  it('provides a dedicated command without exposing the upstream as VITE data', () => {
    expect(packageJson.scripts['dev:lambda']).toBe(
      'vite --mode lambda --host 127.0.0.1',
    );
    expect(viteSource).toContain('APOTHECARY_AI_UPSTREAM_URL');
    expect(viteSource).not.toContain('VITE_AI_UPSTREAM_URL');
  });

  it('proxies /ai server-side with the exact production Origin', () => {
    expect(viteSource).toContain("'https://alstjgg.github.io'");
    expect(viteSource).toContain("'/ai'");
    expect(viteSource).toMatch(/headers:\s*\{\s*Origin:\s*PAGES_ORIGIN\s*\}/);
  });

  it('allows the Lambda proxy only for loopback clients', () => {
    expect(viteSource).toContain("host: '127.0.0.1'");
    expect(viteSource).toContain('request.socket.remoteAddress');
    expect(viteSource).toContain('shouldRejectAiProxyRequest(');
    expect(viteSource).toContain('response.statusCode = 403');
    expect(viteSource).toContain(
      "plugins: lambdaUpstream ? [loopbackOnlyAiProxy()] : [aiProxy()]",
    );
  });

  it('runs the live Lambda spec only through its dedicated Playwright config', () => {
    expect(packageJson.scripts['test:e2e:lambda']).toBe(
      'playwright test --config playwright.lambda.config.ts',
    );
    expect(playwrightSource).toContain('testIgnore: /live-lambda\\.spec\\.ts$/');
    expect(lambdaPlaywrightSource).toContain(
      "testMatch: 'live-lambda.spec.ts'",
    );
    expect(liveLambdaSpecSource).not.toContain('@live');
  });

  it('uses the live deadline for every prefetched customer', () => {
    expect(mainSource).toContain('{ deadlineMs: LIVE_DEADLINE_MS }');
    expect(mainSource).toContain(
      'generatedDeadlineMs: liveEndpointConfigured ? LIVE_DEADLINE_MS : STUB_DEADLINE_MS',
    );
  });
});

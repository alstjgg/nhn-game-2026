// Keyless tests for the standalone AI server (server/standalone.mjs): routing,
// CORS allowlist, per-IP rate limits, body cap. Vendor keys are stripped for
// the whole suite so no test can ever reach a provider — the LLM paths answer
// 503 by construction, which is itself the asserted keyless behavior.

import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import { createStandaloneServer } from '../../server/standalone.mjs';

const KEY_VARS = ['ANTHROPIC_API_KEY', 'OPENAI_API_KEY'] as const;
const savedKeys: Record<string, string | undefined> = {};

beforeAll(() => {
  for (const k of KEY_VARS) {
    savedKeys[k] = process.env[k];
    delete process.env[k];
  }
});

afterAll(() => {
  for (const k of KEY_VARS) {
    if (savedKeys[k] !== undefined) process.env[k] = savedKeys[k];
  }
});

const servers: Server[] = [];

afterEach(async () => {
  await Promise.all(servers.splice(0).map((s) => new Promise((r) => s.close(r))));
});

async function start(env: Record<string, string | undefined> = {}) {
  const server = createStandaloneServer(env);
  servers.push(server);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address() as AddressInfo;
  return `http://127.0.0.1:${port}`;
}

describe('routing', () => {
  it('GET /ai/health reports keyless capabilities in the contract shape', async () => {
    const base = await start();
    const res = await fetch(`${base}/ai/health`);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      ok: false,
      dialogue: false,
      portrait: false,
      models: { dialogue: 'claude-sonnet-5', portrait: 'gpt-image-1' },
    });
  });

  it('rejects wrong methods and unknown paths', async () => {
    const base = await start();
    expect((await fetch(`${base}/ai/health`, { method: 'POST' })).status).toBe(405);
    expect((await fetch(`${base}/ai/dialogue`)).status).toBe(405);
    expect((await fetch(`${base}/ai/nope`, { method: 'POST' })).status).toBe(404);
  });

  it('POST /ai/dialogue without a key answers 503, never calling a provider', async () => {
    const base = await start();
    const res = await fetch(`${base}/ai/dialogue`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{}',
    });
    expect(res.status).toBe(503);
    expect((await res.json()).error).toMatch(/ANTHROPIC_API_KEY/);
  });
});

describe('CORS allowlist', () => {
  const PAGES = 'https://alstjgg.github.io';

  it('echoes an allowlisted origin and answers preflight', async () => {
    const base = await start({ AI_ALLOWED_ORIGINS: `${PAGES}, https://other.example` });
    const res = await fetch(`${base}/ai/health`, { headers: { origin: PAGES } });
    expect(res.status).toBe(200);
    expect(res.headers.get('access-control-allow-origin')).toBe(PAGES);

    const preflight = await fetch(`${base}/ai/dialogue`, {
      method: 'OPTIONS',
      headers: { origin: PAGES, 'access-control-request-method': 'POST' },
    });
    expect(preflight.status).toBe(204);
    expect(preflight.headers.get('access-control-allow-methods')).toContain('POST');
  });

  it('rejects unknown origins outright (403), and all origins when unconfigured', async () => {
    const strict = await start({ AI_ALLOWED_ORIGINS: PAGES });
    expect((await fetch(`${strict}/ai/health`, { headers: { origin: 'https://evil.example' } })).status).toBe(403);

    const unconfigured = await start();
    expect((await fetch(`${unconfigured}/ai/health`, { headers: { origin: PAGES } })).status).toBe(403);
  });

  it('non-browser requests (no Origin header) are unaffected', async () => {
    const base = await start({ AI_ALLOWED_ORIGINS: PAGES });
    expect((await fetch(`${base}/ai/health`)).status).toBe(200);
  });
});

describe('rate limiting', () => {
  it('caps per-IP requests per route and sets retry-after', async () => {
    const base = await start({ AI_DIALOGUE_LIMIT_PER_MIN: '2' });
    const post = () =>
      fetch(`${base}/ai/dialogue`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{}',
      });
    expect((await post()).status).toBe(503); // under limit → reaches (keyless) handler
    expect((await post()).status).toBe(503);
    const third = await post();
    expect(third.status).toBe(429);
    expect(Number(third.headers.get('retry-after'))).toBeGreaterThan(0);

    // Other routes have their own counters — portrait is not consumed by dialogue hits.
    const portrait = await fetch(`${base}/ai/portrait`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{}',
    });
    expect(portrait.status).toBe(503);
  });
});

describe('body cap', () => {
  it('rejects oversized request bodies with 413', async () => {
    const base = await start();
    const res = await fetch(`${base}/ai/dialogue`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ pad: 'x'.repeat(300 * 1024) }),
    }).catch(() => null);
    // The server may destroy the socket mid-upload; both a 413 response and a
    // reset connection are acceptable rejections. Never a 2xx.
    if (res) expect(res.status).toBe(413);
  });
});

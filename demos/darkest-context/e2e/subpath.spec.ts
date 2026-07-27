// subpath.spec.ts — the relative-asset / Pages-subpath invariant (INV-8, u1).
//
// The demo ships to GitHub Pages under a NESTED path
// (…/nhn-game-2026/demos/darkest-context/), which is why vite.config sets
// `base: './'`. `vite preview` only ever serves dist/ at the ROOT, so it cannot
// catch a base-path regression on its own — apothecary DISCOVERY §3 ("No
// subpath / deploy-verify step"). This spec closes that gap: it serves the built
// dist/ under the real deep prefix and asserts the app boots with zero errors.
//
// Equivalent manual command (apothecary DISCOVERY, verified):
//   npm run build
//   npx vite preview --outDir dist --base /nhn-game-2026/demos/darkest-context/ \
//     --port 4173 --strictPort
//   # open http://localhost:4173/nhn-game-2026/demos/darkest-context/
import { expect, test } from '@playwright/test';
import { createServer, type Server } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, extname, join, normalize, resolve } from 'node:path';
import type { AddressInfo } from 'node:net';

const here = dirname(fileURLToPath(import.meta.url));
const distDir = resolve(here, '..', 'dist');

// The real Pages layout — a root-anchored or hardcoded asset path 404s here.
const PREFIX = '/nhn-game-2026/demos/darkest-context/';

const CONTENT_TYPE: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

let server: Server;
let base: string;

test.beforeAll(async () => {
  server = createServer((req, res) => {
    const url = (req.url ?? '/').split('?')[0];
    if (!url.startsWith(PREFIX)) {
      res.statusCode = 404;
      res.end('outside subpath');
      return;
    }
    let rel = url.slice(PREFIX.length);
    if (rel === '' || rel.endsWith('/')) rel += 'index.html';
    const filePath = normalize(join(distDir, rel));
    if (!filePath.startsWith(distDir) || !existsSync(filePath) || !statSync(filePath).isFile()) {
      res.statusCode = 404;
      res.end('not found');
      return;
    }
    res.setHeader('Content-Type', CONTENT_TYPE[extname(filePath)] ?? 'application/octet-stream');
    createReadStream(filePath).pipe(res);
  });
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
  const { port } = server.address() as AddressInfo;
  base = `http://127.0.0.1:${port}${PREFIX}`;
});

test.afterAll(async () => {
  await new Promise<void>((r) => server.close(() => r()));
});

test.describe('preview under the real Pages subpath (INV-8)', () => {
  test('built dist/ boots under the deep nested path with zero errors', async ({ page }) => {
    expect(existsSync(join(distDir, 'index.html')), 'dist/index.html missing — build first').toBe(
      true,
    );

    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    const external: string[] = [];
    const failed: string[] = [];
    page.on('console', (m) => {
      if (m.type() === 'error') consoleErrors.push(m.text());
    });
    page.on('pageerror', (e) => pageErrors.push(e.message));
    page.on('requestfailed', (r) => failed.push(r.url()));
    page.on('response', (r) => {
      if (r.status() >= 400) failed.push(`${r.status()} ${r.url()}`);
    });
    page.on('request', (req) => {
      const u = req.url();
      if (!/^(data:|blob:|about:)/.test(u) && !u.includes('127.0.0.1') && !u.includes('localhost')) {
        external.push(u);
      }
    });

    const response = await page.goto(base);
    expect(response, 'no navigation response for the subpath').toBeTruthy();
    expect(response!.ok(), `bad status ${response!.status()}`).toBeTruthy();

    // Every relative asset (module bundle + CSS) resolved under the nested base,
    // so the shell mounted.
    const app = page.locator('#app');
    await expect(app).toBeAttached();
    await expect(app).not.toBeEmpty();
    await expect(page.getByTestId('app-shell')).toBeVisible();

    await page.waitForLoadState('networkidle');
    expect(failed, `failed/4xx requests under the subpath: ${failed.join(' | ')}`).toEqual([]);
    expect(external, `external requests: ${external.join(' | ')}`).toEqual([]);
    expect(pageErrors, `page errors: ${pageErrors.join(' | ')}`).toEqual([]);
    expect(consoleErrors, `console errors: ${consoleErrors.join(' | ')}`).toEqual([]);
  });

  test('no emitted asset URL is root-anchored or repo-name-prefixed', async ({ page }) => {
    const requested: string[] = [];
    page.on('request', (r) => requested.push(r.url()));
    await page.goto(base);
    await page.waitForLoadState('networkidle');

    // Everything the page pulled must live under the nested prefix. A `/assets/…`
    // URL (base '/' regression) or a `/nhn-game-2026/assets/…` URL (root-config
    // base copied in) would show up outside it.
    const strays = requested.filter(
      (u) => u.startsWith('http://127.0.0.1') && !u.includes(PREFIX),
    );
    expect(strays, `assets requested outside the subpath: ${strays.join(' | ')}`).toEqual([]);
  });

  test('the harness page also resolves under the subpath', async ({ page }) => {
    const response = await page.goto(`${base}e2e/harness/_scaffold/`);
    expect(response, 'no navigation response').toBeTruthy();
    expect(response!.ok(), `bad status ${response!.status()}`).toBeTruthy();
    await expect(page.getByTestId('harness-scaffold')).toBeVisible();
  });
});

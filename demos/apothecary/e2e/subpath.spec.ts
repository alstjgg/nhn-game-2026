// subpath.spec.ts — the relative-asset / Pages-subpath invariant (u9).
//
// The demo ships to GitHub Pages under a NESTED path (…/nhn-game-2026/demos/
// apothecary/), which is exactly why vite.config sets `base: './'` — every
// emitted asset URL is relative, so the built dist/ must resolve correctly no
// matter how deep the URL is. `vite preview` only ever serves dist/ at the ROOT
// (`/`), so it cannot, on its own, catch a base-path regression. This spec closes
// that gap: it serves the built dist/ UNDER a deep path prefix and asserts the
// app boots there with zero console/page errors and no external requests.
//
// Equivalent manual command (documented in DISCOVERY.md §preview-subpath):
//   npm run build
//   npx vite preview --outDir dist --base /nhn-game-2026/demos/apothecary/ --port 4173 --strictPort
//   # then open http://localhost:4173/nhn-game-2026/demos/apothecary/
import { expect, test } from '@playwright/test';
import { createServer, type Server } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, extname, join, normalize, resolve } from 'node:path';
import type { AddressInfo } from 'node:net';

const here = dirname(fileURLToPath(import.meta.url));
const distDir = resolve(here, '..', 'dist');

// A deliberately deep prefix — mirrors the real Pages layout — so a hard-coded
// or root-anchored asset path would 404 here.
const PREFIX = '/nhn-game-2026/demos/apothecary/';

const CONTENT_TYPE: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
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
    // Strip the Pages prefix, then resolve within dist/ (traversal-guarded).
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

test.describe('preview under a Pages subpath (relative assets, u9)', () => {
  test('built dist/ boots under a deep nested path with zero errors', async ({ page }) => {
    // dist/ must exist — the playwright webServer builds it before any test runs.
    expect(existsSync(join(distDir, 'index.html')), 'dist/index.html missing — build first').toBe(
      true,
    );

    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    const external: string[] = [];
    page.on('console', (m) => {
      if (m.type() === 'error') consoleErrors.push(m.text());
    });
    page.on('pageerror', (e) => pageErrors.push(e.message));
    page.on('request', (req) => {
      const u = req.url();
      if (!/^(data:|blob:|about:)/.test(u) && !u.includes('127.0.0.1') && !u.includes('localhost')) {
        external.push(u);
      }
    });

    const response = await page.goto(base);
    expect(response, 'no navigation response for subpath').toBeTruthy();
    expect(response!.ok(), `bad status ${response!.status()}`).toBeTruthy();

    // The app mounted its shell under the nested base — every relative asset
    // (the module bundle + CSS) resolved, so #app is non-empty and the first
    // phase renders.
    const app = page.locator('#app');
    await expect(app).toBeAttached();
    await expect(app).not.toBeEmpty();
    await expect(page.getByTestId('phase-c1-entrance')).toBeVisible();

    await page.waitForLoadState('networkidle');
    expect(external, `external requests: ${external.join(' | ')}`).toEqual([]);
    expect(pageErrors, `page errors: ${pageErrors.join(' | ')}`).toEqual([]);
    expect(consoleErrors, `console errors: ${consoleErrors.join(' | ')}`).toEqual([]);
  });
});

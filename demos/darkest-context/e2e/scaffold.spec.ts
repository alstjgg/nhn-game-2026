// Scaffold smoke e2e (Playwright, chromium/headless) — darkest-context u1, TDD-Red.
//
// PRD §7 DoD, stub-mode half: the built demo boots with zero console errors and
// makes no network calls. Also pins the two seams later units depend on:
//   · the shell renders a boot slot screens mount into (src/app/shell.ts)
//   · a harness dir under e2e/harness/ is emitted by the build (vite glob seam)
// Relies on baseURL + webServer (build → preview) from playwright.config.ts.
import { expect, test, type Page } from '@playwright/test';

type Watchers = { consoleErrors: string[]; pageErrors: string[]; external: string[] };

function watch(page: Page): Watchers {
  const w: Watchers = { consoleErrors: [], pageErrors: [], external: [] };
  page.on('console', (m) => {
    if (m.type() === 'error') w.consoleErrors.push(m.text());
  });
  page.on('pageerror', (e) => w.pageErrors.push(e.message));
  page.on('request', (req) => {
    const u = req.url();
    if (!/^(data:|blob:|about:)/.test(u) && !u.includes('localhost') && !u.includes('127.0.0.1')) {
      w.external.push(u);
    }
  });
  return w;
}

test.describe('scaffold smoke', () => {
  test('the demo home boots into #app with zero console errors', async ({ page }) => {
    const w = watch(page);

    const response = await page.goto('/');
    expect(response, 'no navigation response').toBeTruthy();
    expect(response!.ok(), `bad status ${response!.status()}`).toBeTruthy();

    const app = page.locator('#app');
    await expect(app).toBeAttached();
    await expect(app).not.toBeEmpty();

    expect(w.pageErrors, `page errors: ${w.pageErrors.join(' | ')}`).toEqual([]);
    expect(w.consoleErrors, `console errors: ${w.consoleErrors.join(' | ')}`).toEqual([]);
  });

  test('the shell renders an empty boot slot for screen units to mount into', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('app-shell')).toBeVisible();
    const slot = page.getByTestId('screen-slot');
    await expect(slot).toBeAttached();
    // u1 registers no screen: the slot exists but nothing has mounted into it.
    await expect(slot.locator(':scope > *')).toHaveCount(0);
  });

  test('the deployed build makes no external network requests (PRD §4-8)', async ({ page }) => {
    const w = watch(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    expect(w.external, `external requests: ${w.external.join(' | ')}`).toEqual([]);
  });

  test('no native text-input control anywhere in the booted DOM (PRD §4-1)', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('input, textarea, [contenteditable]')).toHaveCount(0);
  });

  test('the dummy harness page is emitted by the build and serves standalone', async ({ page }) => {
    const w = watch(page);
    const response = await page.goto('/e2e/harness/_scaffold/');
    expect(response, 'no navigation response for the harness page').toBeTruthy();
    expect(
      response!.ok(),
      `harness page status ${response!.status()} — vite.config.ts did not glob e2e/harness/*/index.html`,
    ).toBeTruthy();
    await expect(page.getByTestId('harness-scaffold')).toBeVisible();
    expect(w.pageErrors, `page errors: ${w.pageErrors.join(' | ')}`).toEqual([]);
    expect(w.consoleErrors, `console errors: ${w.consoleErrors.join(' | ')}`).toEqual([]);
  });
});

// Smoke e2e (Playwright, chromium/headless) for apothecary demo unit u1.
// TDD-Red: fails until the scaffold serves a page that mounts #app with no console errors.
// Smoke definition (demo contract): page loads, no console errors, root element renders.
// Relies on baseURL + webServer configured in playwright.config.ts.
import { expect, test } from '@playwright/test';

test.describe('scaffold smoke', () => {
  test('page loads with no console errors and #app renders', async ({ page }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', (err) => {
      pageErrors.push(err.message);
    });

    const response = await page.goto('/');
    expect(response, 'no navigation response').toBeTruthy();
    expect(response!.ok(), `bad status ${response!.status()}`).toBeTruthy();

    // Root element exists and is non-empty (main.ts mounted into it).
    const app = page.locator('#app');
    await expect(app).toBeAttached();
    await expect(app).not.toBeEmpty();

    // No runtime errors surfaced to the console.
    expect(pageErrors, `page errors: ${pageErrors.join(' | ')}`).toEqual([]);
    expect(consoleErrors, `console errors: ${consoleErrors.join(' | ')}`).toEqual([]);
  });

  test('makes no external network requests (offline-safe demo)', async ({ page }) => {
    const external: string[] = [];
    page.on('request', (req) => {
      const url = req.url();
      if (!/^(data:|blob:|about:)/.test(url) && !url.includes('localhost') && !url.includes('127.0.0.1')) {
        external.push(url);
      }
    });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    expect(external, `external requests: ${external.join(' | ')}`).toEqual([]);
  });
});

// Behavioral TDD-Red e2e for u5 — shared UI primitives (Playwright, chromium/headless).
// This is the honest "green" for card-feel: it drives the card in a real browser and
// asserts the hover / press / selected states and animation vocabulary are actually WIRED,
// not just present as source text (that static half lives in tests/ui/cards.test.ts).
//
// Contract this spec pins (PRD §1.2 card-feel, §1.3 animation vocabulary, §4.1/§4.5):
//   - the served page surfaces interactive `.card` primitives
//   - a card is a real interactive control (button / role="button"), never a form field
//   - clicking a card toggles `.card--selected`
//   - hovering a card changes its computed appearance (hover CSS wired)
//   - cards carry a CSS transition (state changes animate — no instant flips)
//   - zero native form controls anywhere (membrane / cards-never-forms)
import { expect, test, type Page } from '@playwright/test';

async function firstCardStyle(page: Page, prop: string): Promise<string> {
  return page.locator('.card').first().evaluate(
    (el, p) => getComputedStyle(el as Element).getPropertyValue(p),
    prop,
  );
}

test.describe('card primitives (u5)', () => {
  test('renders interactive card primitives with no console errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', (err) => pageErrors.push(err.message));

    const response = await page.goto('/');
    expect(response, 'no navigation response').toBeTruthy();
    expect(response!.ok(), `bad status ${response!.status()}`).toBeTruthy();

    const cards = page.locator('.card');
    await expect(cards.first()).toBeVisible();
    expect(await cards.count(), 'no .card primitives on the page').toBeGreaterThan(0);

    expect(pageErrors, `page errors: ${pageErrors.join(' | ')}`).toEqual([]);
    expect(consoleErrors, `console errors: ${consoleErrors.join(' | ')}`).toEqual([]);
  });

  test('exposes no native form controls anywhere (membrane / cards-never-forms)', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.card').first()).toBeVisible();
    const controls = await page.locator('select, input, textarea').count();
    expect(controls, 'native <select>/<input>/<textarea> present').toBe(0);
  });

  test('a card is an interactive control, not a bare element', async ({ page }) => {
    await page.goto('/');
    const card = page.locator('.card').first();
    await expect(card).toBeVisible();
    const isInteractive = await card.evaluate(
      (el) => el.tagName === 'BUTTON' || el.getAttribute('role') === 'button',
    );
    expect(isInteractive, 'first .card is neither a <button> nor role="button"').toBe(true);
  });

  test('clicking a card toggles the selected state', async ({ page }) => {
    await page.goto('/');
    const card = page.locator('.card').first();
    await expect(card).toBeVisible();
    await expect(card).not.toHaveClass(/card--selected\b/);
    await card.click();
    await expect(card).toHaveClass(/card--selected\b/);
  });

  test('hovering a card changes its appearance (hover-state CSS is wired)', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.card').first()).toBeVisible();

    const props = ['box-shadow', 'transform', 'border-color', 'background-color', 'filter'];
    const before = await Promise.all(props.map((p) => firstCardStyle(page, p)));
    await page.locator('.card').first().hover();
    // allow any hover transition to settle
    await page.waitForTimeout(250);
    const after = await Promise.all(props.map((p) => firstCardStyle(page, p)));

    const changed = props.some((_, i) => before[i] !== after[i]);
    expect(changed, `no computed style changed on hover (${props.join(', ')})`).toBe(true);
  });

  test('cards animate state changes via a CSS transition (no instant flips)', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.card').first()).toBeVisible();
    const duration = await firstCardStyle(page, 'transition-duration');
    // e.g. "0.15s" or "150ms, 150ms" — anything non-empty and not all-zero counts.
    const hasTransition = duration.trim() !== '' && /[1-9]/.test(duration);
    expect(hasTransition, `.card has no non-zero transition-duration (got "${duration}")`).toBe(true);
  });
});

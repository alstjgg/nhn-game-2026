// Behavioral TDD-Red e2e for u7 — asset-pack skin (Playwright, chromium/headless).
// This is the honest "green" for AC2: the sprite sheets are not just referenced in
// source, they actually PAINT in a real browser — computed background-image is a real
// url() (not `none`) and image-rendering is pixelated. The static half (coordinate
// strings, thresholds-in-data, fallback) lives in tests/ui/sprite.test.ts.
//
// ── Contract this spec pins (spec §5 AC2, design §2 D8 / §5) ──
//
// Pages:
//   /e2e/harness/crafting/   the isolated crafting mount (already built into dist).
//                            base.css ships in this bundle, so the shop background is
//                            visible here too (design §0 S3).
//   /                        the game shell — background must survive there as well.
//
// DOM contract (additive only — the u5/u7 card contract is untouched, C5):
//   <body>                                       bg-shop background
//   .crafting__grid                              ui-shelf backdrop panel
//   [data-sprite="ingredient"]  × 8              one decorative span per ingredient card
//   [data-sprite="equip"]       × 3              one per method card (우리기/달이기/빻기)
//   [data-sprite="potion"]      × 1              the vessel / potion result
//   every sprite layer is aria-hidden and is a <span>/<div> — never a form control
//
// NOT asserted here (design §2 D2 ⚠ / §5): the exact `background-position` string —
// Chromium resolves percentages to px in computed style. Nor the equipment in-use
// loop — animation observation belongs to crafting.spec.ts AC8 and must stay unpolluted.
import { expect, test, type Locator, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const HARNESS = '/e2e/harness/crafting/';

const here = dirname(fileURLToPath(import.meta.url));
const ingredientCount = (
  JSON.parse(readFileSync(resolve(here, '..', 'data', 'ingredients.json'), 'utf8')) as unknown[]
).length;
const methodCount = (
  JSON.parse(
    readFileSync(resolve(here, '..', 'data', 'crafting-config.json'), 'utf8'),
  ) as { methods: string[] }
).methods.length;

async function computed(target: Locator | Page, prop: string, selector?: string): Promise<string> {
  const locator = selector ? (target as Page).locator(selector) : (target as Locator);
  return locator.evaluate((el, p) => getComputedStyle(el as Element).getPropertyValue(p), prop);
}

/** Every matched element must paint a real image and render it unsmoothed. */
async function expectPaintedSprites(page: Page, selector: string, count: number): Promise<void> {
  const items = page.locator(selector);
  await expect(items.first()).toBeAttached();
  expect(await items.count(), `expected ${count} × ${selector}`).toBe(count);

  const styles = await items.evaluateAll((els) =>
    els.map((el) => {
      const cs = getComputedStyle(el as Element);
      return {
        image: cs.backgroundImage,
        rendering: cs.imageRendering,
        tag: el.tagName,
        hidden: (el as Element).getAttribute('aria-hidden'),
      };
    }),
  );
  styles.forEach((s, i) => {
    expect(s.image, `${selector}[${i}] has no background-image`).not.toBe('none');
    expect(s.image, `${selector}[${i}] background-image is empty`).not.toBe('');
    expect(s.image, `${selector}[${i}] background-image is not a url()`).toContain('url(');
    expect(s.rendering, `${selector}[${i}] is not image-rendering: pixelated`).toBe('pixelated');
    expect(['SPAN', 'DIV'], `${selector}[${i}] sprite layer is a <${s.tag}>`).toContain(s.tag);
    expect(s.hidden, `${selector}[${i}] sprite layer is not aria-hidden (decorative, A6)`).toBe('true');
  });
}

test.describe('asset pack skin (u7)', () => {
  test('the shop background paints on the crafting harness (E1)', async ({ page }) => {
    await page.goto(HARNESS);
    await expect(page.locator('.crafting')).toBeVisible();

    const image = await computed(page, 'background-image', 'body');
    expect(image, 'body has no background-image').not.toBe('none');
    expect(image, 'body background is not the bg-shop sheet').toContain('bg-shop');
    expect(await computed(page, 'image-rendering', 'body')).toBe('pixelated');
  });

  test('the ingredient shelf panel paints its backdrop (E2)', async ({ page }) => {
    await page.goto(HARNESS);
    const grid = page.locator('.crafting__grid');
    await expect(grid).toBeVisible();

    const image = await computed(grid, 'background-image');
    expect(image, '.crafting__grid has no shelf backdrop').not.toBe('none');
    expect(image, '.crafting__grid backdrop is not the ui-shelf sheet').toContain('ui-shelf');
    expect(await computed(grid, 'image-rendering')).toBe('pixelated');
  });

  test('every ingredient card carries a painted sprite (E3)', async ({ page }) => {
    await page.goto(HARNESS);
    await expect(page.locator('.crafting__grid')).toBeVisible();
    await expectPaintedSprites(page, '[data-sprite="ingredient"]', ingredientCount);
  });

  test('ingredient sprites all come from the ingredient sheets, one cell each (E3)', async ({ page }) => {
    await page.goto(HARNESS);
    await expect(page.locator('.crafting__grid')).toBeVisible();

    const cells = await page.locator('.card[data-group="ingredient"]').evaluateAll((cards) =>
      cards.map((card) => {
        const sprite = card.querySelector('[data-sprite="ingredient"]');
        const cs = sprite ? getComputedStyle(sprite) : null;
        return {
          id: (card as HTMLElement).dataset.id ?? '',
          image: cs?.backgroundImage ?? '',
          position: cs?.backgroundPosition ?? '',
          size: cs?.backgroundSize ?? '',
        };
      }),
    );
    expect(cells.length).toBe(ingredientCount);
    for (const c of cells) {
      expect(c.image, `${c.id} sprite is not an ingredients-* sheet`).toMatch(/ingredients-[12]/);
      expect(c.size, `${c.id} sprite is not scaled to a 4×3 grid`).not.toBe('auto');
    }
    // Distinct ingredients must not all land on the same cell of the same sheet.
    const distinct = new Set(cells.map((c) => `${c.image}|${c.position}`));
    expect(distinct.size, 'all ingredient sprites resolve to the same cell').toBe(ingredientCount);
  });

  test('every method card carries a painted equipment sprite (E4)', async ({ page }) => {
    await page.goto(HARNESS);
    await expect(page.locator('.crafting__methods')).toBeVisible();
    await expectPaintedSprites(page, '[data-sprite="equip"]', methodCount);

    const images = await page
      .locator('[data-sprite="equip"]')
      .evaluateAll((els) => els.map((el) => getComputedStyle(el as Element).backgroundImage));
    for (const image of images) {
      expect(image, 'method sprite is not an equip-* sheet').toMatch(/equip-(teapot|pot|mortar)/);
    }
    expect(new Set(images).size, 'the three methods share one equipment sheet').toBe(methodCount);
  });

  test('the crafting screen shows a painted potion vessel (E5)', async ({ page }) => {
    await page.goto(HARNESS);
    await expect(page.locator('.crafting')).toBeVisible();
    await expectPaintedSprites(page, '[data-sprite="potion"]', 1);

    const image = await computed(page.locator('[data-sprite="potion"]'), 'background-image');
    expect(image, 'vessel sprite is not the potions sheet').toContain('potions');
  });

  test('skinning the screen adds zero console errors and zero failed requests (E6)', async ({ page }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    const failed: string[] = [];
    const badStatus: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', (err) => pageErrors.push(err.message));
    page.on('requestfailed', (req) => failed.push(`${req.url()} — ${req.failure()?.errorText ?? ''}`));
    page.on('response', (res) => {
      if (res.status() >= 400) badStatus.push(`${res.status()} ${res.url()}`);
    });

    const response = await page.goto(HARNESS);
    expect(response!.ok(), `bad status ${response!.status()}`).toBeTruthy();
    await expect(page.locator('.crafting__grid')).toBeVisible();
    await expect(page.locator('[data-sprite="ingredient"]').first()).toBeAttached();
    // give every background-image request time to resolve (or fail)
    await page.waitForLoadState('networkidle');

    expect(pageErrors, `page errors: ${pageErrors.join(' | ')}`).toEqual([]);
    expect(consoleErrors, `console errors: ${consoleErrors.join(' | ')}`).toEqual([]);
    expect(failed, `failed requests: ${failed.join(' | ')}`).toEqual([]);
    expect(badStatus, `4xx/5xx responses (missing assets): ${badStatus.join(' | ')}`).toEqual([]);
  });

  test('the sprite layer adds no form controls and no extra cards (C3/C5 regression floor)', async ({ page }) => {
    await page.goto(HARNESS);
    await expect(page.locator('.crafting__grid')).toBeVisible();

    expect(await page.locator('select, input, textarea').count(), 'native form control present').toBe(0);
    expect(await page.locator('.card[data-group="ingredient"]').count()).toBe(ingredientCount);
    expect(await page.locator('.card[data-group="method"]').count()).toBe(methodCount);
    expect(await page.locator('button[data-action="commit"]').count()).toBe(1);
  });

  test('the shop background also paints on the game shell (E7)', async ({ page }) => {
    const response = await page.goto('/');
    expect(response!.ok(), `bad status ${response!.status()}`).toBeTruthy();
    await page.waitForLoadState('networkidle');

    const image = await computed(page, 'background-image', 'body');
    expect(image, '/ body has no background-image').not.toBe('none');
    expect(image, '/ body background is not the bg-shop sheet').toContain('bg-shop');
  });
});

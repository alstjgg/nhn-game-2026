// Behavioral TDD-Red e2e for u7 — UI primitives, animation vocabulary, asset-slot seam.
// Playwright, chromium/headless, served from the real build (playwright.config.ts).
//
// Why a harness page and not `/`: src/main.ts and index.html are u1-owned and frozen for
// this unit, and apothecary DISCOVERY §"Scope gap: e2e/cards.spec.ts needs a render
// surface" is exactly the trap that creates. u1 left a seam for it — vite.config.ts globs
// `e2e/harness/*/index.html` — so u7 ships its own standalone page and edits nothing
// shared.
//
// ─────────────────────────── HARNESS CONTRACT (u7 must build) ───────────────────────────
// Page: e2e/harness/primitives/index.html + main.ts → served at /e2e/harness/primitives/
// It mounts every primitive once, from a local fixture (no data/ dependency):
//
//   [data-testid="stage"]        .dc-stage
//     [data-testid="stage-bg"]     .dc-stage__bg.slot-bg-dungeon
//     [data-testid="stage-heroes"] .dc-stage__side--heroes  → 3 × .dc-unit[data-unit-id]
//     [data-testid="stage-enemies"].dc-stage__side--enemies → ≥1 × .dc-unit[data-unit-id]
//       each .dc-unit contains .dc-unit__sprite carrying .slot-hero (hero) / .slot-mob (enemy)
//   [data-testid="panel-row"]    → 3 × .dc-unit-panel (button[data-unit-id]) each with a .dc-vial
//   .dc-bubble[data-unit-id]     → .dc-bubble__say + ≥1 .dc-chip[data-item-id]; carries .slot-bubble-frame
//   [data-testid="card-row"]     → one .dc-card of each type: --prompt / --skill / --mcp,
//                                  each carrying .slot-card-frame and holding a .dc-card__icon.slot-card-icon
//   [data-testid="vial-row"]     → 4 × .dc-vial[data-state] (calm|uneasy|limit|overload), .slot-vial
//   Clicking a .dc-unit-panel opens [data-testid="unit-sheet"] (.dc-sheet[data-unit-id]) with
//     [data-testid="sheet-persona"] · [data-testid="sheet-cards"] · [data-testid="sheet-stats"],
//     items as .dc-sheet__item[data-item-id]; the ones the latest `because` cites also
//     carry .dc-sheet__item--cited.
//
//   window.__primitives = {
//     heroIds: string[]; enemyIds: string[];
//     bubbleUnitId: string;      // the unit whose bubble is on screen
//     citedItemIds: string[];    // item ids that unit's latest `because` cites
//   }
//
// The fixture data is the harness's business — the spec reads it from that object so the
// contract is about wiring, never about which Korean line the fixture happens to carry.
import { expect, test, type Page } from '@playwright/test';

const HARNESS = '/e2e/harness/primitives/';

const VIAL_STATES = ['calm', 'uneasy', 'limit', 'overload'] as const;

interface HarnessFixture {
  heroIds: string[];
  enemyIds: string[];
  bubbleUnitId: string;
  citedItemIds: string[];
}

declare global {
  interface Window {
    __primitives?: HarnessFixture;
  }
}

async function open(page: Page): Promise<HarnessFixture> {
  const response = await page.goto(HARNESS);
  expect(response, `no navigation response for ${HARNESS}`).toBeTruthy();
  expect(response!.ok(), `harness status ${response!.status()} — is the page built?`).toBeTruthy();
  await expect(page.getByTestId('stage')).toBeVisible();
  const fixture = await page.evaluate(() => window.__primitives);
  expect(fixture, 'harness does not expose window.__primitives').toBeTruthy();
  return fixture as HarnessFixture;
}

const styleOf = (page: Page, selector: string, prop: string): Promise<string> =>
  page
    .locator(selector)
    .first()
    .evaluate((el, p) => getComputedStyle(el as Element).getPropertyValue(p), prop);

test.describe('u7 primitives', () => {
  // ───────────────────────────── AC1 — own-slice gate ─────────────────────────────

  test('the harness page renders every primitive with zero console errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    page.on('console', (m) => {
      if (m.type() === 'error') consoleErrors.push(m.text());
    });
    page.on('pageerror', (e) => pageErrors.push(e.message));

    await open(page);

    await expect(page.locator('.dc-unit-panel').first()).toBeVisible();
    await expect(page.locator('.dc-bubble').first()).toBeVisible();
    await expect(page.locator('.dc-card').first()).toBeVisible();
    await expect(page.locator('.dc-vial').first()).toBeVisible();

    expect(pageErrors, `page errors: ${pageErrors.join(' | ')}`).toEqual([]);
    expect(consoleErrors, `console errors: ${consoleErrors.join(' | ')}`).toEqual([]);
  });

  // ───────────────────── AC2 — stage / panel+sheet / bubble / card / vial ─────────────────────

  test('the stage is side-view: heroes on the left, enemies on the right', async ({ page }) => {
    const fixture = await open(page);

    const heroes = page.getByTestId('stage-heroes');
    const enemies = page.getByTestId('stage-enemies');
    await expect(heroes).toBeVisible();
    await expect(enemies).toBeVisible();

    expect(await heroes.locator('.dc-unit').count(), 'hero side is empty').toBe(
      fixture.heroIds.length,
    );
    expect(await enemies.locator('.dc-unit').count(), 'enemy side is empty').toBe(
      fixture.enemyIds.length,
    );

    const hb = await heroes.boundingBox();
    const eb = await enemies.boundingBox();
    expect(hb, 'hero side has no box').toBeTruthy();
    expect(eb, 'enemy side has no box').toBeTruthy();
    expect(
      hb!.x + hb!.width,
      `heroes (x=${hb!.x}) are not left of enemies (x=${eb!.x})`,
    ).toBeLessThanOrEqual(eb!.x + 1);
  });

  test('on the stage nobody moves — sprites hold their horizontal position', async ({ page }) => {
    const fixture = await open(page);
    const sprite = page.locator(`.dc-unit[data-unit-id="${fixture.heroIds[0]}"]`);
    const before = await sprite.boundingBox();
    await page.waitForTimeout(900);
    const after = await sprite.boundingBox();
    expect(before && after, 'hero sprite has no box').toBeTruthy();
    // Breathing bob is allowed to move Y. Walking across the stage is not.
    expect(
      Math.abs(after!.x - before!.x),
      `hero drifted horizontally: ${before!.x} → ${after!.x}`,
    ).toBeLessThan(1);
  });

  test('clicking a unit panel opens its sheet: persona, card sentences and stats', async ({
    page,
  }) => {
    const fixture = await open(page);
    const unitId = fixture.bubbleUnitId;

    await expect(page.getByTestId('unit-sheet')).toHaveCount(0);
    await page.locator(`.dc-unit-panel[data-unit-id="${unitId}"]`).click();

    const sheet = page.getByTestId('unit-sheet');
    await expect(sheet).toBeVisible();
    await expect(sheet).toHaveAttribute('data-unit-id', unitId);
    await expect(sheet.getByTestId('sheet-persona')).toBeVisible();
    await expect(sheet.getByTestId('sheet-cards')).toBeVisible();
    await expect(sheet.getByTestId('sheet-stats')).toBeVisible();
    expect(
      await sheet.locator('.dc-sheet__item').count(),
      'sheet lists no items',
    ).toBeGreaterThanOrEqual(fixture.citedItemIds.length);
  });

  test('the sheet highlights exactly the items the latest because cites', async ({ page }) => {
    const fixture = await open(page);
    expect(fixture.citedItemIds.length, 'fixture cites nothing (INV-3)').toBeGreaterThan(0);

    await page.locator(`.dc-unit-panel[data-unit-id="${fixture.bubbleUnitId}"]`).click();
    const cited = page.locator('.dc-sheet__item--cited');
    const ids = await cited.evaluateAll((els) =>
      els.map((el) => (el as HTMLElement).dataset.itemId ?? ''),
    );
    expect([...ids].sort(), 'highlighted items do not match the because ids').toEqual(
      [...fixture.citedItemIds].sort(),
    );
  });

  test('the speech bubble shows its say line and its because chips', async ({ page }) => {
    const fixture = await open(page);
    const bubble = page.locator(`.dc-bubble[data-unit-id="${fixture.bubbleUnitId}"]`);
    await expect(bubble).toBeVisible();
    await expect(bubble.locator('.dc-bubble__say')).not.toBeEmpty();
    expect(
      await bubble.locator('.dc-chip').count(),
      'a displayed decision with no because chip (INV-3)',
    ).toBeGreaterThan(0);
  });

  test('every bubble chip resolves to a real sheet item', async ({ page }) => {
    const fixture = await open(page);
    const bubble = page.locator(`.dc-bubble[data-unit-id="${fixture.bubbleUnitId}"]`);
    const chipIds = await bubble
      .locator('.dc-chip')
      .evaluateAll((els) => els.map((el) => (el as HTMLElement).dataset.itemId ?? ''));
    expect(chipIds.every((id) => id !== ''), 'a chip carries no data-item-id').toBe(true);

    await page.locator(`.dc-unit-panel[data-unit-id="${fixture.bubbleUnitId}"]`).click();
    const itemIds = await page
      .locator('.dc-sheet__item')
      .evaluateAll((els) => els.map((el) => (el as HTMLElement).dataset.itemId ?? ''));
    for (const id of chipIds) {
      expect(itemIds, `chip "${id}" resolves to no sheet item`).toContain(id);
    }
  });

  test('a card renders one tint per type — Prompt, Skill and MCP look different', async ({
    page,
  }) => {
    await open(page);
    const tints: string[] = [];
    for (const kind of ['prompt', 'skill', 'mcp']) {
      const card = page.locator(`.dc-card--${kind}`);
      await expect(card.first(), `no .dc-card--${kind} on the page`).toBeVisible();
      tints.push(
        await card
          .first()
          .evaluate((el) => {
            const cs = getComputedStyle(el as Element);
            return `${cs.backgroundColor}|${cs.borderTopColor}|${cs.color}|${cs.boxShadow}`;
          }),
      );
    }
    expect(new Set(tints).size, `card tints are not distinct: ${tints.join(' ~ ')}`).toBe(3);
  });

  test('a card is a click target that toggles its own selected state', async ({ page }) => {
    await open(page);
    const card = page.locator('.dc-card').first();
    await expect(card).toBeVisible();
    expect(
      await card.evaluate((el) => el.tagName === 'BUTTON' || el.getAttribute('role') === 'button'),
      'a .dc-card is neither <button> nor role="button"',
    ).toBe(true);

    await expect(card).toHaveAttribute('aria-pressed', 'false');
    await card.click();
    await expect(card).toHaveClass(/dc-card--selected/);
    await expect(card).toHaveAttribute('aria-pressed', 'true');
    await card.click();
    await expect(card).not.toHaveClass(/dc-card--selected/);
  });

  test('the gauge vial renders four visually distinct states', async ({ page }) => {
    await open(page);
    const positions: string[] = [];
    for (const state of VIAL_STATES) {
      const vial = page.locator(`.dc-vial[data-state="${state}"]`).first();
      await expect(vial, `no vial for state "${state}"`).toBeVisible();
      positions.push(
        await vial.evaluate((el) => {
          const cs = getComputedStyle(el as Element);
          return `${cs.backgroundPosition}|${cs.getPropertyValue('--cell-col')}|${cs.getPropertyValue('--cell-row')}`;
        }),
      );
    }
    expect(
      new Set(positions).size,
      `vial states share a sheet cell: ${positions.join(' ~ ')}`,
    ).toBe(4);
  });

  // ───────────────────── AC4 — the asset-slot seam, rendered half ─────────────────────

  test('stage, bubble, card and vial each wire their asset-slot class', async ({ page }) => {
    const fixture = await open(page);
    const wiring: [string, string][] = [
      ['[data-testid="stage-bg"]', 'slot-bg-dungeon'],
      [`[data-testid="stage-heroes"] .dc-unit[data-unit-id="${fixture.heroIds[0]}"] .dc-unit__sprite`, 'slot-hero'],
      [`[data-testid="stage-enemies"] .dc-unit[data-unit-id="${fixture.enemyIds[0]}"] .dc-unit__sprite`, 'slot-mob'],
      ['.dc-bubble', 'slot-bubble-frame'],
      ['.dc-card', 'slot-card-frame'],
      ['.dc-card__icon', 'slot-card-icon'],
      ['.dc-vial', 'slot-vial'],
    ];
    for (const [selector, slot] of wiring) {
      const el = page.locator(selector).first();
      await expect(el, `nothing matches ${selector}`).toBeAttached();
      expect(
        await el.evaluate((node, cls) => (node as Element).classList.contains(cls), slot),
        `${selector} does not carry .${slot}`,
      ).toBe(true);
    }
  });

  test('an unconfigured slot still paints — the card and vial CSS-only fallbacks hold', async ({
    page,
  }) => {
    await open(page);
    const slots = [
      'slot-bg-dungeon',
      'slot-hero',
      'slot-mob',
      'slot-bubble-frame',
      'slot-card-frame',
      'slot-card-icon',
      'slot-vial',
    ];
    const report = await page.evaluate((classes) => {
      const out: Record<string, { paint: boolean; box: boolean; pixelated: string }> = {};
      for (const cls of classes) {
        const probe = document.createElement('div');
        probe.className = cls; // deliberately NO --slot-* set: this is the missing-asset case
        document.body.appendChild(probe);
        const cs = getComputedStyle(probe);
        const rect = probe.getBoundingClientRect();
        const opaque = !/rgba\(0,\s*0,\s*0,\s*0\)|transparent/.test(cs.backgroundColor);
        const bordered = ['Top', 'Right', 'Bottom', 'Left'].some(
          (side) => parseFloat(cs.getPropertyValue(`border-${side.toLowerCase()}-width`)) > 0,
        );
        out[cls] = {
          paint: opaque || bordered || cs.backgroundImage !== 'none' || cs.boxShadow !== 'none',
          box: rect.width > 0 && rect.height > 0,
          pixelated: cs.imageRendering,
        };
        probe.remove();
      }
      return out;
    }, slots);

    for (const cls of slots) {
      expect(report[cls]?.paint, `.${cls} renders nothing without its image`).toBe(true);
      expect(report[cls]?.box, `.${cls} collapses to a zero box without its image`).toBe(true);
      expect(report[cls]?.pixelated, `.${cls} is not pixel-rendered`).toBe('pixelated');
    }
  });

  // ───────────────────── AC3 — INV-1 membrane, DOM half ─────────────────────

  test('membrane: no native form control exists anywhere in the primitives', async ({ page }) => {
    await open(page);
    await page.locator('.dc-unit-panel').first().click(); // open the sheet too
    await expect(page.getByTestId('unit-sheet')).toBeVisible();
    await expect(page.locator('input, textarea, select, form, [contenteditable]')).toHaveCount(0);
  });

  test('membrane: every verb is a click target, never a typed field', async ({ page }) => {
    await open(page);
    const verbs = await page
      .locator('.dc-card, .dc-unit-panel')
      .evaluateAll((els) =>
        els.map((el) => ({
          cls: (el as HTMLElement).className,
          ok: el.tagName === 'BUTTON' || el.getAttribute('role') === 'button',
        })),
      );
    expect(verbs.length, 'no interactive primitives on the page').toBeGreaterThan(3);
    for (const v of verbs) {
      expect(v.ok, `"${v.cls}" is not a click target`).toBe(true);
    }
  });

  // ───────────────────── AC5 — the animation vocabulary ─────────────────────

  test('the animation vocabulary is declared once and reachable by class name', async ({
    page,
  }) => {
    await open(page);
    const css = await page.evaluate(() => {
      const keyframes: string[] = [];
      const classes = new Set<string>();
      const walk = (rules: CSSRuleList): void => {
        for (const rule of Array.from(rules)) {
          const kf = rule as CSSKeyframesRule;
          if (typeof kf.name === 'string' && 'length' in (kf.cssRules ?? {})) keyframes.push(kf.name);
          const styleRule = rule as CSSStyleRule;
          if (typeof styleRule.selectorText === 'string') {
            for (const m of styleRule.selectorText.match(/\.[A-Za-z0-9_-]+/g) ?? []) {
              classes.add(m.slice(1));
            }
          }
          const grouping = rule as CSSGroupingRule;
          if (grouping.cssRules && typeof kf.name !== 'string') walk(grouping.cssRules);
        }
      };
      for (const sheet of Array.from(document.styleSheets)) {
        try {
          walk(sheet.cssRules);
        } catch {
          /* cross-origin sheet — none expected in this build */
        }
      }
      return { keyframes, classes: [...classes] };
    });

    const vocab = ['bubble-in', 'bubble-out', 'hit-shake', 'breathe-bob', 'gauge-tint', 'phase-fade'];
    for (const name of vocab) {
      const count = css.keyframes.filter((k) => k === name).length;
      expect(count, `@keyframes ${name} declared ${count} times (want exactly 1)`).toBe(1);
      expect(css.classes, `no .anim-${name} class to reuse`).toContain(`anim-${name}`);
    }
  });

  test('animation: the bubble enters with anim-bubble-in and heroes breathe', async ({ page }) => {
    const fixture = await open(page);

    const bubble = page.locator(`.dc-bubble[data-unit-id="${fixture.bubbleUnitId}"]`);
    await expect(bubble).toHaveClass(/anim-bubble-in/);
    expect(
      await styleOf(page, `.dc-bubble[data-unit-id="${fixture.bubbleUnitId}"]`, 'animation-name'),
      'the bubble class is present but the animation is not wired',
    ).toContain('bubble-in');

    const hero = `.dc-unit[data-unit-id="${fixture.heroIds[0]}"] .dc-unit__sprite`;
    await expect(page.locator(hero)).toHaveClass(/anim-breathe-bob/);
    expect(await styleOf(page, hero, 'animation-name')).toContain('breathe-bob');
  });
});

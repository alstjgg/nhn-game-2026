// Behavioral TDD-Red e2e for u6 — Conversation screen (Playwright, chromium/headless).
// Drives the conversation screen in a real browser through the standalone harness
// (e2e/harness/conversation/index.html, a vite build input served from dist/) and
// pins the acceptance contract AC1–AC9 from .claude/super/units/u6/{spec,design}.md.
//
// RED until the build lands: the screen module, the harness page, and the
// vite build-input wiring do not exist yet, so `goto` 404s / the testids are
// absent. This spec is the honest "green" target — it asserts behaviour is
// WIRED (portrait-enter fires, the line types on, choices are u5 cards, the
// patience meter animates down per question, [관찰] reveals distinct clue cards
// at zero patience cost), never just that source text is present.
//
// Contract pinned (spec §4 · design §4 data-testid hooks):
//   URL:      /e2e/harness/conversation/index.html   (design D10)
//   testids:  portrait · npc-line · patience-meter · patience-fill ·
//             choice-card · observe-btn · clue-shelf · clue-card
//   u5 classes: .anim-portrait-enter · .anim-type-on · .card · .card--clue
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { expect, test, type Locator, type Page } from '@playwright/test';

const HARNESS = '/e2e/harness/conversation/index.html';

// Playwright gate runs with cwd = demos/apothecary (`cd demos/apothecary && npx playwright test`).
const PORTRAITS_DIR = 'public/portraits';
const ROOT_MANIFEST = '../../assets-manifest.json';
const RASTER_RE = /\.(png|jpe?g|webp)$/i;

/** getComputedStyle(transform) → scaleX (matrix `a`), defaulting to 1 for `none`. */
async function scaleX(el: Locator): Promise<number> {
  return el.evaluate((node) => {
    const t = getComputedStyle(node as Element).transform;
    if (!t || t === 'none') return 1;
    const m = t.match(/matrix\(([^)]+)\)/);
    if (m) return parseFloat(m[1].split(',')[0]);
    const m3d = t.match(/matrix3d\(([^)]+)\)/);
    if (m3d) return parseFloat(m3d[1].split(',')[0]);
    return 1;
  });
}

function attachErrorCapture(page: Page): { console: string[]; page: string[] } {
  const sink = { console: [] as string[], page: [] as string[] };
  page.on('console', (msg) => {
    if (msg.type() === 'error') sink.console.push(msg.text());
  });
  page.on('pageerror', (err) => sink.page.push(err.message));
  return sink;
}

test.describe('conversation screen (u6)', () => {
  // AC1 — reachable, driven, zero console errors, active node visible.
  test('AC1 harness loads the conversation screen with no console errors', async ({ page }) => {
    const errs = attachErrorCapture(page);

    const response = await page.goto(HARNESS);
    expect(response, 'no navigation response').toBeTruthy();
    expect(response!.ok(), `bad status ${response!.status()} for ${HARNESS}`).toBeTruthy();

    await expect(page.getByTestId('npc-line')).toBeVisible();
    await expect(page.getByTestId('portrait')).toBeVisible();

    expect(errs.page, `page errors: ${errs.page.join(' | ')}`).toEqual([]);
    expect(errs.console, `console errors: ${errs.console.join(' | ')}`).toEqual([]);
  });

  // AC2 — portrait animates in (u5 portrait-enter), never an instant insert.
  test('AC2 portrait enters via the u5 portrait-enter animation', async ({ page }) => {
    await page.goto(HARNESS);
    const portrait = page.getByTestId('portrait');
    await expect(portrait).toBeVisible();
    await expect(portrait).toHaveClass(/\banim-portrait-enter\b/);

    const animName = await portrait.evaluate(
      (el) => getComputedStyle(el as Element).animationName,
    );
    expect(animName, 'portrait has no keyframe animation applied').toBe('portrait-enter');
  });

  // AC3 — NPC line renders via the u5 type-on animation, TS-orchestrated.
  test('AC3 npc line renders through the type-on animation', async ({ page }) => {
    await page.goto(HARNESS);
    const line = page.getByTestId('npc-line');
    await expect(line).toBeVisible();
    await expect(line).toHaveClass(/\banim-type-on\b/);

    const animName = await line.evaluate((el) => getComputedStyle(el as Element).animationName);
    expect(animName, 'npc line has no type-on keyframe applied').toBe('type-on');

    // The line ends up carrying real text (type-on reveals content, not an empty sweep).
    await expect
      .poll(async () => (await line.textContent())?.trim().length ?? 0, { timeout: 3000 })
      .toBeGreaterThan(0);
  });

  // AC4 — dialogue choices are u5 card primitives; membrane holds (no form controls).
  test('AC4 choices render as u5 cards and no native form controls exist', async ({ page }) => {
    await page.goto(HARNESS);
    const choices = page.getByTestId('choice-card');
    await expect(choices.first()).toBeVisible();
    expect(await choices.count(), 'no choice cards rendered').toBeGreaterThan(0);

    // Every choice card is a u5 `.card` button (brings hover/press/selected vocabulary).
    const firstIsCardButton = await choices.first().evaluate(
      (el) => el.classList.contains('card') &&
        (el.tagName === 'BUTTON' || el.getAttribute('role') === 'button'),
    );
    expect(firstIsCardButton, 'choice card is not a u5 .card button').toBe(true);

    // Membrane / cards-never-forms: no free-text or native selectors anywhere.
    const controls = await page.locator('select, input, textarea').count();
    expect(controls, 'native <select>/<input>/<textarea> present').toBe(0);
  });

  // AC5 — a cost>0 choice animates the patience meter down (transition + scaleX drop).
  test('AC5 selecting a cost>0 choice animates the patience meter down', async ({ page }) => {
    await page.goto(HARNESS);
    const fill = page.getByTestId('patience-fill');
    await expect(fill).toBeVisible();

    // Meter starts full and animates via a CSS transition (not an instant flip).
    const transition = await fill.evaluate(
      (el) => getComputedStyle(el as Element).transitionDuration,
    );
    expect(/[1-9]/.test(transition), `patience-fill has no transition (got "${transition}")`).toBe(true);

    const before = await scaleX(fill);
    expect(before, 'meter should start effectively full').toBeGreaterThan(0.9);

    // First dialogue choice carries a positive patience cost (fixture node 0).
    await page.getByTestId('choice-card').first().click();

    await expect
      .poll(async () => scaleX(fill), { timeout: 3000 })
      .toBeLessThan(before - 0.01);
  });

  // AC6 — [관찰] costs 0 patience and reveals distinct, non-duplicating clue cards.
  test('AC6 [관찰] reveals distinct clue cards without spending patience', async ({ page }) => {
    await page.goto(HARNESS);
    const fill = page.getByTestId('patience-fill');
    const observe = page.getByTestId('observe-btn');
    const clueCards = page.getByTestId('clue-card');
    await expect(observe).toBeVisible();

    const patienceBefore = await scaleX(fill);
    expect(await clueCards.count(), 'clues revealed before observing').toBe(0);

    await observe.click();
    await expect(clueCards.first()).toBeVisible();
    const revealed = await clueCards.count();
    expect(revealed, 'observe revealed no clue cards').toBeGreaterThan(0);

    // Clue cards live in their own shelf and are visually distinct (.card--clue),
    // never mixed in with the dialogue choice cards.
    await expect(page.getByTestId('clue-shelf').getByTestId('clue-card').first()).toBeVisible();
    await expect(clueCards.first()).toHaveClass(/\bcard--clue\b/);
    await expect(page.getByTestId('choice-card').first()).not.toHaveClass(/\bcard--clue\b/);

    // Patience is untouched by observing (0 cost) — allow the meter time to (not) move.
    await page.waitForTimeout(500);
    expect(Math.abs((await scaleX(fill)) - patienceBefore)).toBeLessThan(0.01);

    // Idempotent: re-observing neither duplicates clues nor drops patience.
    await observe.click();
    await page.waitForTimeout(300);
    expect(await clueCards.count(), 're-observe duplicated clue cards').toBe(revealed);
    expect(Math.abs((await scaleX(fill)) - patienceBefore)).toBeLessThan(0.01);
  });

  // AC7 — content is data-driven: committing a choice advances to a different node's
  // line (multi-node dialogue flows from the loader, not a hard-coded string).
  test('AC7 dialogue content is data-driven and advances between nodes', async ({ page }) => {
    await page.goto(HARNESS);
    const line = page.getByTestId('npc-line');
    await expect(line).toBeVisible();

    const firstLine = (await line.textContent())?.trim() ?? '';
    expect(firstLine.length, 'first npc line is empty').toBeGreaterThan(0);

    // Choice labels are real text sourced from data, not blank placeholders.
    const firstLabel = (await page.getByTestId('choice-card').first().textContent())?.trim() ?? '';
    expect(firstLabel.length, 'first choice card has no label').toBeGreaterThan(0);

    // Committing a dialogue choice advances the cursor → the line changes to the next node.
    await page.getByTestId('choice-card').first().click();
    await expect
      .poll(async () => (await line.textContent())?.trim() ?? '', { timeout: 3000 })
      .not.toBe(firstLine);
  });

  // AC8 — portrait asset: CSS placeholder OR a manifested raster under public/portraits.
  test('AC8 any raster portrait under public/portraits is recorded in the manifest', () => {
    if (!existsSync(PORTRAITS_DIR)) return; // CSS placeholder path — nothing to manifest.
    const rasters = readdirSync(PORTRAITS_DIR).filter((f) => RASTER_RE.test(f));
    if (rasters.length === 0) return; // placeholder / no raster art shipped.

    const manifest = JSON.parse(readFileSync(ROOT_MANIFEST, 'utf-8')) as {
      assets: Array<{ file?: string }>;
    };
    for (const raster of rasters) {
      const listed = manifest.assets.some((a) => (a.file ?? '').includes(raster));
      expect(listed, `raster ${raster} lacks an assets-manifest.json entry`).toBe(true);
    }
  });

  // AC9 — the screen runs fully offline: no external network requests through interaction.
  test('AC9 makes no external network requests through interaction', async ({ page }) => {
    const external: string[] = [];
    page.on('request', (req) => {
      const url = req.url();
      if (
        !/^(data:|blob:|about:)/.test(url) &&
        !url.includes('localhost') &&
        !url.includes('127.0.0.1')
      ) {
        external.push(url);
      }
    });

    await page.goto(HARNESS);
    await expect(page.getByTestId('npc-line')).toBeVisible();
    await page.getByTestId('observe-btn').click();
    await page.getByTestId('choice-card').first().click();
    await page.waitForLoadState('networkidle');

    expect(external, `external requests: ${external.join(' | ')}`).toEqual([]);
  });
});

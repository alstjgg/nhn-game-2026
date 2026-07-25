// Behavioral TDD-Red e2e for u6 — Conversation screen (Playwright, chromium/headless).
// Drives the conversation screen in a real browser through the standalone harness
// (e2e/harness/conversation/index.html, a vite build input served from dist/) and
// pins the acceptance contract AC1–AC9 from .claude/super/units/u6/{spec,design}.md.
//
// RED until the build lands: the screen module, the harness page, and the
// vite build-input wiring do not exist yet, so `goto` 404s / the testids are
// absent. This spec is the honest "green" target — it asserts behaviour is
// WIRED (portrait-enter fires, the line types on, choices are u5 cards, a paid
// question tightens the customer's expression tier, [관찰] reveals distinct clue
// cards at zero patience cost), never just that source text is present.
//
// u11 (PRD §2.2 / §3-4): the patience gauge is deleted. Patience is now read off
// the screen root's `data-tier`, so this file's former meter assertions are the
// run's ONLY permitted deletions — their replacements land right here (AC5's
// tier step, AC6's tier invariance, the terminal-node tier invariance below).
//
// Contract pinned (spec §4 · design §4 data-testid hooks):
//   URL:      /e2e/harness/conversation/index.html   (design D10)
//   root:     section.conversation[data-tier="0..3"]  (u11)
//   testids:  portrait · npc-line · choice-card[data-verb] · observe-btn ·
//             clue-shelf · clue-card
//   u5 classes: .anim-portrait-enter · .anim-type-on · .card · .card--clue
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';

const HARNESS = '/e2e/harness/conversation/index.html';
const SCREEN = 'section.conversation';

// Playwright gate runs with cwd = demos/apothecary (`cd demos/apothecary && npx playwright test`).
const PORTRAITS_DIR = 'public/portraits';
const ROOT_MANIFEST = '../../assets-manifest.json';
const RASTER_RE = /\.(png|jpe?g|webp)$/i;

/** The screen root's expression tier as a number; -1 when the attribute is absent. */
async function tierOf(page: Page): Promise<number> {
  const raw = await page.locator(SCREEN).getAttribute('data-tier');
  return raw === null ? -1 : Number(raw);
}

/**
 * Commit the beat's 직접 질문 card. The default harness mounts c1 (budget 5), where
 * only this card's cost (2) crosses a tier floor — 우회 질문 (cost 1) deliberately
 * does not, so it is useless as a patience probe.
 */
async function playDirect(page: Page): Promise<void> {
  const card = page.locator('[data-testid="choice-card"][data-verb="direct"]').first();
  await expect(card, 'no 직접 질문 card in the current hand').toBeEnabled();
  await card.click();
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

  // AC5 (u11 replacement for the meter-drain assertion) — a cost>0 choice spends
  // patience diegetically: the customer's expression tier tightens and no number
  // or bar reports it. The full 0..3 ladder lives in e2e/patience.spec.ts.
  test('AC5 selecting a cost>0 choice raises the expression tier, showing no number', async ({
    page,
  }) => {
    await page.goto(HARNESS);
    await expect(page.locator(SCREEN)).toBeVisible();
    expect(await tierOf(page), 'the screen does not mount at 평온(0)').toBe(0);

    await playDirect(page);
    await expect
      .poll(async () => tierOf(page), { timeout: 3000 })
      .toBe(1);

    // The tier is the whole readout — no gauge slipped back in to report it.
    expect(
      await page
        .locator('[data-testid*="patience"], progress, meter, [role="progressbar"]')
        .count(),
      'a numeric/gauge patience readout exists',
    ).toBe(0);
  });

  // AC6 — [관찰] costs 0 patience and reveals distinct, non-duplicating clue cards.
  test('AC6 [관찰] reveals distinct clue cards without spending patience', async ({ page }) => {
    await page.goto(HARNESS);
    const observe = page.getByTestId('observe-btn');
    const clueCards = page.getByTestId('clue-card');
    await expect(observe).toBeVisible();

    // u11: patience is observable as the expression tier, so "spent nothing"
    // means "the tier never moved" (replaces the deleted meter fill sampling).
    const tierBefore = await tierOf(page);
    expect(tierBefore, 'the screen carries no expression tier').toBeGreaterThanOrEqual(0);
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

    // Patience is untouched by observing (0 cost) — give the tier time to (not) move.
    await page.waitForTimeout(500);
    expect(await tierOf(page), 'observing tightened the expression tier').toBe(tierBefore);

    // Idempotent: re-observing neither duplicates clues nor drops patience.
    await observe.click();
    await page.waitForTimeout(300);
    expect(await clueCards.count(), 're-observe duplicated clue cards').toBe(revealed);
    expect(await tierOf(page), 're-observing tightened the expression tier').toBe(tierBefore);
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

  // Regression (PR #26 review): a dialogue choice is a one-shot commit action,
  // never a toggle. `renderNode()` masks a re-entrant `commitChoice` on every
  // non-terminal node by replacing the cards outright, but the *last* node's
  // cards persist — without an explicit disable-after-commit guard, clicking
  // the same card again re-fires `onToggle(true)` and double-spends patience.
  //
  // u11 AC9: re-expressed meter-free. The 직접 질문 card is used on both beats so
  // the tier is a *sensitive* detector of a second spend — with c1's budget 5 the
  // committed terminal tier is 2 (patience 1), and one more spend of 2 would zero
  // patience and force tier 3 / crafting. A tier that never moves is therefore
  // proof no second commit happened.
  test('terminal-node choice card cannot double-commit on repeated clicks', async ({ page }) => {
    await page.goto(HARNESS);
    const line = page.getByTestId('npc-line');
    const clueCards = page.getByTestId('clue-card');

    const firstLine = (await line.textContent())?.trim() ?? '';
    await playDirect(page); // commit beat 0 → advance
    await expect
      .poll(async () => (await line.textContent())?.trim() ?? '', { timeout: 3000 })
      .not.toBe(firstLine);

    const card = page.locator('[data-testid="choice-card"][data-verb="direct"]').first();
    await card.click(); // commit the terminal beat's 직접 질문
    await expect(card).toBeDisabled();
    await expect.poll(async () => tierOf(page), { timeout: 3000 }).toBe(2);

    const committedTier = await tierOf(page);
    const committedLine = (await line.textContent())?.trim() ?? '';
    const committedClues = await clueCards.count();

    // A native <button disabled> never dispatches click — the HTML spec's
    // click() activation behavior returns early when "actually disabled" —
    // so even a programmatic re-click here must be a strict no-op.
    await card.evaluate((el) => (el as HTMLButtonElement).click());
    await page.waitForTimeout(300);
    expect(
      await tierOf(page),
      're-clicking a committed terminal-beat choice spent patience again',
    ).toBe(committedTier);
    expect((await line.textContent())?.trim() ?? '', 're-click advanced the dialogue').toBe(
      committedLine,
    );
    expect(await clueCards.count(), 're-click re-revealed clues').toBe(committedClues);
    await expect(
      page.locator(SCREEN),
      're-click forced the crafting phase (double spend)',
    ).toHaveAttribute('data-phase', 'conversation');
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

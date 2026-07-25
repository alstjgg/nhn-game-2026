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
import { expect, test, type Locator, type Page } from '@playwright/test';

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

// ─────────────────────────────────────────────────────────────────────────────
// u10 — multiverb beat engine (adapter-driven beat source + 3–4 verb cards).
//
// APPENDED ONLY. Everything above (AC1–AC9 + the terminal-node regression) was
// byte-identical on purpose: u10's spec AC5a required those bodies unchanged,
// and the meter assertions stayed until u11 owned their removal. u11 has now
// landed, so this block reads patience the same way the rest of the file does —
// off the screen root's `data-tier` (see AC12/AC13/AC17 below).
//
// Contract pinned here: .claude/super/units/u10/spec.md §4 rows AC2a–AC5b.
// RED until the beat source lands, `conversation.ts` dispatches on `verb`, the
// harness hands in a stub adapter and exposes `window.__onCompleteCount`, and
// `conversation.css` wraps the npc line in the ui-bubble 9-slice frame.
// ─────────────────────────────────────────────────────────────────────────────

const CUSTOMERS_JSON = 'data/customers.json';
const VERBS = ['indirect', 'direct', 'observe', 'craft'] as const;

interface CustomerFixture {
  observationClues: Array<{ id: string; text: string }>;
}

/**
 * The customer the harness mounts (`customers[0]`) — its real clue vocabulary.
 * `data/customers.json` is a bare ARRAY of customers (that is what
 * `loadCustomers` validates); a `{ customers: [...] }` wrapper is tolerated so
 * this fixture reader survives a future re-shaping of the file.
 */
function harnessCustomer(): CustomerFixture {
  const raw = JSON.parse(readFileSync(CUSTOMERS_JSON, 'utf-8')) as
    | CustomerFixture[]
    | { customers: CustomerFixture[] };
  const customers = Array.isArray(raw) ? raw : raw.customers;
  expect(customers?.length, `no customers in ${CUSTOMERS_JSON}`).toBeGreaterThan(0);
  return customers[0];
}

const card = (page: Page, verb?: string): Locator =>
  verb === undefined
    ? page.locator('[data-testid="choice-card"]')
    : page.locator(`[data-testid="choice-card"][data-verb="${verb}"]`);

/** data-verb of every rendered choice card, in DOM order. */
async function verbsOnScreen(page: Page): Promise<string[]> {
  return card(page).evaluateAll((els) =>
    els.map((el) => el.getAttribute('data-verb') ?? ''),
  );
}

/** Wait for the async beat render (S6) to have painted a full card set. */
async function awaitBeat(page: Page): Promise<void> {
  await expect(page.getByTestId('npc-line')).toBeVisible();
  await expect.poll(async () => card(page).count(), { timeout: 5000 }).toBeGreaterThanOrEqual(3);
}

/** The persistent counter the harness increments inside its onComplete hook. */
async function onCompleteCount(page: Page): Promise<number> {
  return page.evaluate(
    () => (window as unknown as { __onCompleteCount?: number }).__onCompleteCount ?? -1,
  );
}

test.describe('conversation screen — multiverb beats (u10)', () => {
  // AC2a/AC2c — every beat is a 3–4 card hand and every card names its verb.
  test('AC10 every beat renders 3–4 choice cards, each carrying a valid data-verb', async ({
    page,
  }) => {
    await page.goto(HARNESS);

    for (const beat of ['first', 'second'] as const) {
      await awaitBeat(page);
      const verbs = await verbsOnScreen(page);
      expect(verbs.length, `${beat} beat rendered ${verbs.length} cards, want 3–4`).toBeGreaterThanOrEqual(3);
      expect(verbs.length, `${beat} beat rendered ${verbs.length} cards, want 3–4`).toBeLessThanOrEqual(4);
      for (const verb of verbs) {
        expect(VERBS, `card carries data-verb="${verb}"`).toContain(verb);
      }
      if (beat === 'first') {
        // Advance with a paid card (never observe/craft — those do not advance).
        await card(page, 'indirect').first().click();
        await page.waitForTimeout(300);
      }
    }
  });

  // AC2b — the hand is genuinely multiverb, not four flavours of one act.
  test('AC11 each beat mixes at least three distinct verbs including one observe', async ({
    page,
  }) => {
    await page.goto(HARNESS);
    await awaitBeat(page);

    const verbs = await verbsOnScreen(page);
    const distinct = [...new Set(verbs)];
    expect(distinct.length, `only ${distinct.join('/')} on screen`).toBeGreaterThanOrEqual(3);
    expect(
      distinct.some((v) => v === 'indirect' || v === 'direct'),
      'no paid question card (indirect/direct) offered',
    ).toBe(true);
    expect(distinct, 'no observation card offered').toContain('observe');
  });

  // S3 — card ORDER is load-bearing: overlap.spec.ts / full-loop.spec.ts drive
  // the conversation via `choice-card.first()` and expect it to spend patience.
  test('AC12 the first choice card is always a paid question card (S3 ordering)', async ({
    page,
  }) => {
    await page.goto(HARNESS);
    await awaitBeat(page);

    const firstVerb = await card(page).first().getAttribute('data-verb');
    expect(['indirect', 'direct'], `first card is a "${firstVerb}" card`).toContain(firstVerb);

    // And it really is the paid path (u11 replacement for the deleted meter
    // drain): driving the whole conversation through the FIRST card alone spends
    // enough patience to tighten the customer's expression tier. One 우회 질문
    // (cost 1 of budget 5) does not cross a floor on its own, so both beats are
    // played — the point is that the first card is the one that charges.
    expect(await tierOf(page), 'the screen does not mount at 평온(0)').toBe(0);
    await card(page).first().click();
    await awaitBeat(page);
    await card(page).first().click();
    await expect.poll(async () => tierOf(page), { timeout: 3000 }).toBeGreaterThan(0);
  });

  // AC3a/AC3a2 — [관찰] card: real clue text, zero cost, does not advance.
  test('AC13 an observe card reveals real clue text for free without advancing', async ({
    page,
  }) => {
    await page.goto(HARNESS);
    await awaitBeat(page);

    const line = page.getByTestId('npc-line');
    const clueCards = page.getByTestId('clue-card');
    const observeCard = card(page, 'observe').first();
    await expect(observeCard).toBeVisible();

    // u11: patience is observable as the expression tier, so "free" means the
    // tier never moves (replaces the deleted meter fill sampling).
    const tierBefore = await tierOf(page);
    expect(tierBefore, 'the screen carries no expression tier').toBeGreaterThanOrEqual(0);
    const lineBefore = (await line.textContent())?.trim() ?? '';
    expect(await clueCards.count(), 'clues revealed before observing').toBe(0);

    await observeCard.click();
    await expect(clueCards.first()).toBeVisible();
    expect(await clueCards.count(), 'observe card revealed nothing').toBeGreaterThan(0);

    // The shelf shows authored clue TEXT, never a raw `clue_*` id (spec S9).
    const texts = await clueCards.allTextContents();
    const authored = harnessCustomer().observationClues.map((c) => c.text);
    for (const raw of texts) {
      const text = raw.trim();
      expect(/^clue_[a-z_]+$/i.test(text), `clue shelf shows a raw id: ${text}`).toBe(false);
      expect(authored, `clue text not found in customers.json: ${text}`).toContain(text);
    }

    // Zero patience cost — give the tier time to (not) move.
    await page.waitForTimeout(500);
    expect(await tierOf(page), 'observing spent patience').toBe(tierBefore);

    // Does not advance the beat, does not freeze the rest of the hand.
    expect((await line.textContent())?.trim() ?? '', 'observing advanced the beat').toBe(lineBefore);
    await expect(card(page, 'indirect').first()).toBeEnabled();
    await expect(card(page, 'craft').first()).toBeEnabled();
  });

  // AC3b — observe is idempotent through BOTH routes (card and observe-btn).
  test('AC14 re-observing never duplicates a clue card', async ({ page }) => {
    await page.goto(HARNESS);
    await awaitBeat(page);

    const clueCards = page.getByTestId('clue-card');
    const observeCard = card(page, 'observe').first();

    await observeCard.click();
    await expect(clueCards.first()).toBeVisible();
    const revealed = await clueCards.count();

    await observeCard.click();
    await page.waitForTimeout(300);
    expect(await clueCards.count(), 're-clicking the observe card duplicated clues').toBe(revealed);

    await page.getByTestId('observe-btn').click();
    await page.waitForTimeout(300);
    expect(await clueCards.count(), 'observe-btn duplicated the card’s clues').toBe(revealed);
  });

  // AC3c — [조제하러 가기] card is an immediate early exit through onComplete.
  test('AC15 a craft card fires onComplete exactly once and freezes the hand', async ({ page }) => {
    await page.goto(HARNESS);
    await awaitBeat(page);

    expect(
      await onCompleteCount(page),
      'harness exposes no window.__onCompleteCount hook',
    ).toBe(0);

    const craftCard = card(page, 'craft').first();
    await expect(craftCard).toBeVisible();
    await craftCard.click();

    await expect.poll(async () => onCompleteCount(page), { timeout: 3000 }).toBe(1);

    // The beat's cards are frozen afterwards, so a second click cannot re-fire.
    await expect(craftCard).toBeDisabled();
    await craftCard.evaluate((el) => (el as HTMLButtonElement).click());
    await page.waitForTimeout(300);
    expect(await onCompleteCount(page), 'craft card double-fired onComplete').toBe(1);
  });

  // AC4a — the npc line sits inside a 9-slice ui-bubble frame (F8).
  test('AC16 the npc line is wrapped by the ui-bubble border-image frame', async ({ page }) => {
    await page.goto(HARNESS);
    await expect(page.getByTestId('npc-line')).toBeVisible();

    const frame = await page.getByTestId('npc-line').evaluate((el) => {
      let node: Element | null = el as Element;
      for (let hop = 0; hop < 4 && node; hop += 1) {
        const cs = getComputedStyle(node);
        if (cs.borderImageSource.includes('ui-bubble')) {
          return { found: true, slice: cs.borderImageSlice, source: cs.borderImageSource };
        }
        node = node.parentElement;
      }
      return { found: false, slice: '', source: '' };
    });

    expect(frame.found, 'no ancestor of npc-line uses an ui-bubble border-image').toBe(true);
    expect(frame.slice.trim(), 'border-image-slice was never tuned off the 100% default').not.toBe(
      '100%',
    );
  });

  // AC5a — u10 had to KEEP the v1 patience gauge (it was not its deletion to
  // make); u11 removed it and put the diegetic readout in its place. The
  // assertion is inverted rather than dropped, so the multiverb refactor is
  // still pinned to exactly one patience readout — never zero, never two.
  test('AC17 the multiverb hand reports patience only through the expression tier', async ({
    page,
  }) => {
    await page.goto(HARNESS);
    await awaitBeat(page);

    await expect(page.locator(SCREEN)).toHaveAttribute('data-tier', /^[0-3]$/);
    expect(
      await page.locator('[data-testid*="patience"], progress, meter, [role="progressbar"]').count(),
      'a numeric/gauge patience readout survives the multiverb hand',
    ).toBe(0);
    await expect(page.getByTestId('observe-btn')).toBeVisible();
  });

  // F2 — the per-beat fallback is SILENT: a full multiverb interaction logs nothing.
  test('AC18 a full multiverb interaction produces no console or page errors', async ({ page }) => {
    const errs = attachErrorCapture(page);

    await page.goto(HARNESS);
    await awaitBeat(page);
    await card(page, 'observe').first().click();
    await card(page).first().click();
    await page.waitForTimeout(400);
    await awaitBeat(page);
    await card(page, 'observe').first().click();
    await page.getByTestId('observe-btn').click();
    await page.waitForTimeout(400);

    expect(errs.page, `page errors: ${errs.page.join(' | ')}`).toEqual([]);
    expect(errs.console, `console errors: ${errs.console.join(' | ')}`).toEqual([]);
  });
});

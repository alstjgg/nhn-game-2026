// Behavioral TDD-Red e2e for u11 — Diegetic patience (Playwright, chromium/headless).
// Drives the real conversation screen through the standalone harness and pins the
// acceptance contract AC1–AC11 from .claude/super/units/u11/{spec,design}.md:
// the patience gauge is GONE, patience is felt through an expression tier on the
// screen root, the portrait's expression column follows that tier, an ambient
// finger-tap starts at 짜증(2), and 한계(3) hands the phase to crafting.
//
// RED until the build lands: `data-tier` / `data-phase` / `finger-tap` /
// `portrait-cell` do not exist yet, `patience-fill` still does, and the harness
// ignores the query knob — so every behavioural test below fails today.
// These assert BEHAVIOUR (a committed card moves the tier, the tier moves the
// sheet column, the tap animation is CSS-gated), never source text; the three
// static tests are the deletion/balance-as-data receipts the ACs spell out as
// greps (AC2, AC3, AC11).
//
// Contract pinned (spec §3 · design §4):
//   URL:       /e2e/harness/conversation/index.html?customer=<id>&budget=<n>
//              (design D7 harness knob — no params ⇒ today's default mount)
//   root:      section.conversation[data-tier="0..3"][data-phase="conversation"|"crafting"]
//   testids:   finger-tap (aria-hidden) · portrait-cell (u9) · choice-card[data-verb]
//   removed:   patience-meter · patience-fill · --patience
//   deps:      u2 tierFor (thresholds [0.7, 0.4, 0.15] in data/patience-tiers.json)
//              u9 mountPortrait (cell background-position-x = tier × 100/3 %)
//              u10 choice-card[data-verb="direct"] (verbCosts: direct 2, indirect 1)
//
// Tier ladder arithmetic (spec §2 A4/OQ-1 — pinned here so a later content or
// threshold edit fails readably instead of silently weakening the ladder):
//   c1, budget 5, 2 beats: 5 →direct 3 (0.60 → tier 1) →direct 1 (0.20 → tier 2)
//   c2, budget 3, 2 beats: 3 →direct 1 (0.33 → tier 2) →direct 0 (tier 3, forced)
// No single customer walks all four tiers (only 2 paid beats exist), so AC5's
// "all four observed" is a union over the two drive runs, exactly as specced.
import { readFileSync } from 'node:fs';
import { expect, test, type Locator, type Page } from '@playwright/test';

const HARNESS = '/e2e/harness/conversation/index.html';
/** c1: budget 5 → the 0 → 1 → 2 half of the ladder. */
const LADDER_URL = `${HARNESS}?customer=c1&budget=5`;
/** c2: budget 3 → the 2 → 3 drain, ending at 한계 / forced crafting. */
const DRAIN_URL = `${HARNESS}?customer=c2&budget=3`;

const SCREEN = 'section.conversation';

// Playwright gate runs with cwd = demos/apothecary.
const CONVERSATION_TS = 'src/screens/conversation/conversation.ts';
const CONVERSATION_CSS = 'src/styles/conversation.css';
const ANIMATIONS_CSS = 'src/styles/animations.css';
const CONVERSATION_SPEC = 'e2e/conversation.spec.ts';
const FULL_LOOP_SPEC = 'e2e/full-loop.spec.ts';

/** u9 pins the sliced cell's column offset at `tier / (columns - 1)` (4 columns). */
const COLUMN_STEP_PCT = 100 / 3;

function screenOf(page: Page): Locator {
  return page.locator(SCREEN);
}

/** The current tier as a number; -1 when the attribute is absent (RED today). */
async function tierOf(page: Page): Promise<number> {
  const raw = await screenOf(page).getAttribute('data-tier');
  return raw === null ? -1 : Number(raw);
}

/** Open the harness and wait until the first beat is actually on screen. */
async function openHarness(page: Page, url: string): Promise<void> {
  const response = await page.goto(url);
  expect(response?.ok(), `bad status for ${url}`).toBeTruthy();
  await expect(page.getByTestId('npc-line')).toBeVisible();
  await expect(screenOf(page)).toBeVisible();
}

/**
 * Commit the beat's 직접 질문 card — the only card whose cost (2) is big enough to
 * step the tier ladder on both fixtures. Selected by `verb`, never by position:
 * the hand is ordered question → observation → craft, so an index would silently
 * start clicking a free card if u10's order ever changes.
 */
async function playDirect(page: Page): Promise<void> {
  const card = page.locator('[data-testid="choice-card"][data-verb="direct"]').first();
  await expect(card, 'no 직접 질문 card in the current hand').toBeEnabled();
  await card.click();
}

/** Drive one full run, sampling the tier on mount and after every paid commit. */
async function driveTierLadder(page: Page, url: string, commits: number): Promise<number[]> {
  await openHarness(page, url);
  const seen = [await tierOf(page)];
  for (let i = 0; i < commits; i++) {
    const before = seen[seen.length - 1];
    await playDirect(page);
    // The tier is written synchronously inside the commit, but the next beat
    // arrives through the adapter — poll on the attribute, never a fixed wait.
    await expect
      .poll(async () => tierOf(page), { timeout: 3000 })
      .toBeGreaterThan(before);
    seen.push(await tierOf(page));
  }
  return seen;
}

/** getComputedStyle(backgroundPositionX) as a percentage number. */
async function columnPct(cell: Locator): Promise<number> {
  const raw = await cell.evaluate((el) => getComputedStyle(el as Element).backgroundPositionX);
  const match = /^(-?[\d.]+)%$/.exec(raw.trim());
  expect(match, `background-position-x is not a percentage (got "${raw}")`).toBeTruthy();
  return Number(match![1]);
}

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

async function boxOf(el: Locator): Promise<Box> {
  return el.evaluate((node) => {
    const r = (node as Element).getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height };
  });
}

interface TapStyle {
  animationName: string;
  iterationCount: string;
  display: string;
}

async function tapStyle(page: Page): Promise<TapStyle> {
  const tap = page.getByTestId('finger-tap');
  await expect(tap, 'finger-tap element is missing').toHaveCount(1);
  return tap.evaluate((el) => {
    const s = getComputedStyle(el as Element);
    return {
      animationName: s.animationName,
      iterationCount: s.animationIterationCount,
      display: s.display,
    };
  });
}

/** AC4's four sub-checks, run at whatever tier the screen is currently in. */
async function assertNoGaugeUI(page: Page): Promise<void> {
  // (a) no native/ARIA gauge widgets.
  expect(
    await page.locator('progress, meter, [role="progressbar"]').count(),
    'a gauge widget renders patience',
  ).toBe(0);

  // (b) no gauge-flavoured ARIA on anything.
  expect(
    await page.locator('[aria-valuenow], [aria-valuemax], [aria-valuemin]').count(),
    'aria-value* exposes a patience number',
  ).toBe(0);

  // (c) the screen shows no percentage and no n/m score.
  const text = (await screenOf(page).innerText()).trim();
  expect(/\d+\s*%/.test(text), `a percentage is rendered: "${text}"`).toBe(false);
  expect(/\d+\s*\/\s*\d+/.test(text), `an n/m ratio is rendered: "${text}"`).toBe(false);

  // (d) no element still names itself a patience/meter/gauge.
  const named = await page.evaluate(() =>
    [...document.querySelectorAll('*')]
      .filter((el) => {
        const cls = el.getAttribute('class') ?? '';
        const tid = (el as HTMLElement).dataset.testid ?? '';
        return /patience|meter|gauge/i.test(cls) || /patience|meter|gauge/i.test(tid);
      })
      .map((el) => `${el.tagName}.${el.getAttribute('class') ?? ''}`),
  );
  expect(named, `patience/meter/gauge-named elements survive: ${named.join(' | ')}`).toEqual([]);
}

test.describe('diegetic patience (u11)', () => {
  // AC1 — the v1 gauge DOM is gone from the conversation screen entirely.
  test('AC1 the patience meter DOM no longer exists', async ({ page }) => {
    await openHarness(page, HARNESS);

    expect(await page.getByTestId('patience-meter').count(), 'patience-meter survives').toBe(0);
    expect(await page.getByTestId('patience-fill').count(), 'patience-fill survives').toBe(0);
    expect(
      await page.locator('[data-testid*="patience"]').count(),
      'a patience-* testid survives',
    ).toBe(0);
    expect(await page.locator('.patience-meter, .patience-fill').count()).toBe(0);
  });

  // AC4 — PRD invariant §3-4: patience is never a number or a bar, at any tier.
  test('AC4 no numeric or gauge patience UI exists at any tier', async ({ page }) => {
    await openHarness(page, DRAIN_URL);
    await assertNoGaugeUI(page);

    // …and nothing numeric appears once patience is spent down to 한계 either.
    await driveTierLadder(page, DRAIN_URL, 2);
    expect(await tierOf(page), 'drain run did not reach 한계').toBe(3);
    await assertNoGaugeUI(page);
  });

  // AC5 — the tier is the only patience readout: monotone per run, and the two
  // runs together walk 0, 1, 2, 3 (no single run can — see the header arithmetic).
  test('AC5 tier progresses monotonically and both runs cover the 0..3 ladder', async ({
    page,
  }) => {
    const ladder = await driveTierLadder(page, LADDER_URL, 2);
    const drain = await driveTierLadder(page, DRAIN_URL, 2);

    for (const [label, run] of [
      ['c1 ladder', ladder],
      ['c2 drain', drain],
    ] as const) {
      expect(run[0], `${label} did not mount at 평온(0)`).toBe(0);
      for (const tier of run) {
        expect([0, 1, 2, 3], `${label} left the tier union: ${run.join('→')}`).toContain(tier);
      }
      for (let i = 1; i < run.length; i++) {
        expect(
          run[i],
          `${label} healed patience: ${run.join('→')}`,
        ).toBeGreaterThanOrEqual(run[i - 1]);
      }
    }

    // Pinned by the header arithmetic: c1 skips 3, c2 skips 1.
    expect(ladder, 'c1 ladder is not 0 → 1 → 2').toEqual([0, 1, 2]);
    expect(drain, 'c2 drain is not 0 → 2 → 3').toEqual([0, 2, 3]);
    expect([...new Set([...ladder, ...drain])].sort(), 'all four tiers were not observed').toEqual([
      0, 1, 2, 3,
    ]);
    expect(drain[drain.length - 1], 'the drain run must end at 한계(3)').toBe(3);
  });

  // AC6 — every tier change moves the portrait's expression column (u9 setTier),
  // and moves nothing else: the panel and cell boxes are identical throughout.
  test('AC6 the portrait expression column follows the tier without reflow', async ({ page }) => {
    await openHarness(page, LADDER_URL);
    const cell = page.getByTestId('portrait-cell');
    const frame = page.getByTestId('portrait-frame');
    await expect(cell, 'u9 portrait cell is not mounted').toHaveCount(1);

    const cellBox = await boxOf(cell);
    const frameBox = await boxOf(frame);
    let tier = await tierOf(page);
    let column = await columnPct(cell);
    expect(tier, 'mount is not 평온(0)').toBe(0);
    expect(column, 'tier 0 is not on the first sheet column').toBeCloseTo(0, 2);

    for (let i = 0; i < 2; i++) {
      const previousColumn = column;
      const previousTier = tier;
      await playDirect(page);
      await expect
        .poll(async () => tierOf(page), { timeout: 3000 })
        .toBeGreaterThan(previousTier);

      tier = await tierOf(page);
      column = await columnPct(cell);
      expect(column, `tier ${previousTier}→${tier} did not move the column`).not.toBeCloseTo(
        previousColumn,
        2,
      );
      expect(column, `tier ${tier} is off its sheet column`).toBeCloseTo(tier * COLUMN_STEP_PCT, 2);

      // The column swap is a background-position move only (NF5 / u9's promise).
      expect(await boxOf(cell), `tier ${tier} reflowed the portrait cell`).toEqual(cellBox);
      expect(await boxOf(frame), `tier ${tier} reflowed the portrait panel`).toEqual(frameBox);
    }
  });

  // AC7 — the ambient tap is CSS-gated on the root tier: silent at 평온/심드렁,
  // looping from 짜증 on. No JS toggles the animation (see the AC11 static test).
  test('AC7 the finger-tap ambient animation is gated at tier >= 2', async ({ page }) => {
    await openHarness(page, LADDER_URL);

    // tier 0 — 평온: no tapping.
    expect(await tierOf(page)).toBe(0);
    let style = await tapStyle(page);
    expect(
      style.animationName === 'none' || style.display === 'none',
      `tap animates at 평온 (name="${style.animationName}", display="${style.display}")`,
    ).toBe(true);

    // tier 1 — 심드렁: still no tapping.
    await playDirect(page);
    await expect.poll(async () => tierOf(page), { timeout: 3000 }).toBe(1);
    style = await tapStyle(page);
    expect(
      style.animationName === 'none' || style.display === 'none',
      `tap animates at 심드렁 (name="${style.animationName}", display="${style.display}")`,
    ).toBe(true);

    // tier 2 — 짜증: the tap loops forever (Playwright runs with no
    // prefers-reduced-motion, which the global guard would clamp to 1 iteration).
    await playDirect(page);
    await expect.poll(async () => tierOf(page), { timeout: 3000 }).toBe(2);
    style = await tapStyle(page);
    expect(style.animationName, 'no tap keyframe at 짜증').toMatch(/finger-tap/);
    expect(style.display, 'the tap is hidden at 짜증').not.toBe('none');
    expect(style.iterationCount, 'the tap does not loop at 짜증').toBe('infinite');

    // tier 3 — 한계: still tapping.
    await driveTierLadder(page, DRAIN_URL, 2);
    expect(await tierOf(page)).toBe(3);
    style = await tapStyle(page);
    expect(style.animationName, 'no tap keyframe at 한계').toMatch(/finger-tap/);
    expect(style.iterationCount, 'the tap does not loop at 한계').toBe('infinite');
  });

  // AC8 — 한계 hands the phase to crafting through the unchanged u2 reducer rule;
  // with the meter gone the handoff is observable as data-phase + dead cards.
  test('AC8 reaching 한계 forces the crafting phase, meter-free', async ({ page }) => {
    const errs: string[] = [];
    page.on('pageerror', (err) => errs.push(err.message));

    await openHarness(page, DRAIN_URL);
    await expect(screenOf(page)).toHaveAttribute('data-phase', 'conversation');

    await driveTierLadder(page, DRAIN_URL, 2);
    expect(await tierOf(page), 'drain run did not reach 한계').toBe(3);

    await expect(screenOf(page)).toHaveAttribute('data-phase', 'crafting');

    // Every card is dead — the dialogue cannot be played on past 한계.
    const cards = page.getByTestId('choice-card');
    const total = await cards.count();
    expect(total, 'no cards left to freeze').toBeGreaterThan(0);
    for (let i = 0; i < total; i++) {
      await expect(cards.nth(i), `card ${i} is still live after 한계`).toBeDisabled();
    }

    // The line stops advancing, and the customer's exit is silent (§3-5).
    const frozenLine = (await page.getByTestId('npc-line').textContent())?.trim() ?? '';
    await page.waitForTimeout(500);
    expect((await page.getByTestId('npc-line').textContent())?.trim() ?? '').toBe(frozenLine);
    expect(await page.locator('[role="alert"], [data-testid*="error"]').count()).toBe(0);
    expect(
      /error|오류|실패|다시 시도/i.test(await screenOf(page).innerText()),
      'an error/fallback message leaked into the screen',
    ).toBe(false);
    expect(errs, `page errors: ${errs.join(' | ')}`).toEqual([]);
  });

  // AC2 — the meter's CSS left with it (the shared `meter-drain` vocabulary in
  // animations.css is deliberately retained: spec OQ-3, out-of-glob vitest).
  test('AC2 the patience meter CSS is deleted from conversation.css', () => {
    const css = readFileSync(CONVERSATION_CSS, 'utf-8');
    for (const token of ['patience-meter', 'patience-fill', '--patience']) {
      expect(css.includes(token), `conversation.css still mentions ${token}`).toBe(false);
    }
    // The ambient keyframe lives in the vocabulary layer so the global
    // prefers-reduced-motion guard covers it for free (NF2).
    const animations = readFileSync(ANIMATIONS_CSS, 'utf-8');
    expect(
      /@keyframes\s+finger-tap\b/.test(animations),
      'animations.css has no @keyframes finger-tap',
    ).toBe(true);
    expect(
      animations.includes('meter-drain'),
      'meter-drain was deleted (OQ-3: an out-of-glob vitest asserts it)',
    ).toBe(true);
  });

  // AC3 — the only deletions the v2 run permits, with their replacements landed
  // in this same unit (PRD §4 regression floor).
  test('AC3 the meter assertions are gone and replaced in the v1 specs', () => {
    const conversationSpec = readFileSync(CONVERSATION_SPEC, 'utf-8');
    for (const token of ['patience-meter', 'patience-fill', 'scaleX(']) {
      expect(
        conversationSpec.includes(token),
        `conversation.spec.ts still asserts on ${token}`,
      ).toBe(false);
    }
    expect(
      conversationSpec.includes('data-tier'),
      'conversation.spec.ts lost its patience assertions without a tier replacement',
    ).toBe(true);

    const fullLoop = readFileSync(FULL_LOOP_SPEC, 'utf-8');
    expect(fullLoop.includes('patience-fill'), 'full-loop.spec.ts still asserts patience-fill').toBe(
      false,
    );
    expect(
      fullLoop.includes('data-tier'),
      'full-loop.spec.ts lost its patience beat without a tier replacement',
    ).toBe(true);
  });

  // AC11 — balance-as-data: u2 owns every tier threshold, and the tap's timing is
  // CSS's. The screen may only read the tier and stamp it on the root.
  test('AC11 the screen declares no tier maths and no JS animation timing', () => {
    const source = readFileSync(CONVERSATION_TS, 'utf-8');
    // Strip comments: the prose explains the ladder, the code must not encode it.
    const code = source
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .split('\n')
      .filter((line) => !line.trim().startsWith('//'))
      .join('\n');

    const literals = code.match(/\b0\.\d+/g) ?? [];
    expect(literals, `tier threshold literals inlined in conversation.ts: ${literals.join(', ')}`)
      .toEqual([]);
    expect(
      /from\s+'\.\.\/\.\.\/state\/patience-tier(\.ts)?'/.test(code) && code.includes('tierFor'),
      'conversation.ts does not import tierFor from u2',
    ).toBe(true);
    expect(/setTimeout|setInterval/.test(code), 'tier/tap timing runs on a JS timer (NF6)').toBe(
      false,
    );
    for (const token of ['patience-meter', 'patience-fill', 'scaleX']) {
      expect(code.includes(token), `conversation.ts still builds ${token}`).toBe(false);
    }
  });
});

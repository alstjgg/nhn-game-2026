// must-prove.spec.ts — u17, TDD-Red. The SHIP gates: the six PRD §1 must-proves that a
// judge has to be able to see, plus the two §5 "otherwise unreachable" gates and the §7
// stub-mode definition-of-done lines that only the composed app can answer.
//
// Every spec below drives the COMPOSED app at `/` (the shipped page, served from the real
// build by playwright.config.ts). No harness page appears here on purpose: a gate that
// runs on a harness proves the part, not the demo.
//
// Test-title filters the unit gate uses (keep these words OUT of every other title):
//   -g pacing             → PRD §1-3  (first combat < 60s · full run 3–5 min)
//   -g gauge-70           → PRD §5 gate ① (§1-4, §2.5)
//   -g council-cards      → PRD §5 gate ② (§2.6)
//   -g attribution-flip   → PRD §1-1 stub floor
//   -g membrane           → INV-1
//   -g offline            → INV-2 / INV-7 / INV-8
//
// ───────────────────── CONTRACT THIS UNIT MUST BUILD (delta on u15) ─────────────────────
// u15 already ships `/?gate=1` → stub adapter, latency 0, tieBreak `index`,
// walkDurationRef 'walk.testDurationMs' (0 ms), and `window.__app` with
// { mode, tieBreak, bootCount, screenIds, mounted, state, loadout, drain() }.
// u17 adds exactly three seams, all gate-only, all read by src/app/gate.ts alone:
//
//   ?pace=default    (only meaningful together with ?gate=1)
//       Boots the gate seam at DEFAULT tunables instead of the test ones: the authored
//       `walk.durationMs` walk, the authored `latency.stub` adapter delay, the authored
//       readable holds. `drain()` still plays engine beats to the next player click, but
//       it now takes the time a human would watch. Without this flag nothing changes:
//       `?gate=1` alone stays the fast, deterministic boot every other spec uses.
//       This is the ONLY way to measure §1-3's 3–5 minute rule — the fast gate boot
//       deliberately zeroes the very durations that rule is about.
//
//   window.__app.turns : RunTurn[]        live getter
//       Every RESOLVED combat turn of the run so far, in order, each tagged with the tile
//       it belongs to. The record shape is the one the combat screen already keeps for
//       e2e/combat.spec.ts (`window.__combat.turns`) plus `tileId` — u17 forwards it, it
//       does not invent it. This is how a gate reads a NUMBER (gauge) and a FACT (who
//       damaged whom) out of a run that plays across three separate fights.
//
//   [data-testid="app-shell"][data-settled]   "true" | "false"
//       "false" from the moment a phase change starts until nothing inside
//       [data-testid="screen-slot"] is animating or transitioning any more; "true" then.
//       apothecary DISCOVERY §2: the whole suite was green while every screenshot caught a
//       mid-cross-fade frame. A settle flag is the only thing a capture can await, and
//       e2e/full-run.spec.ts's screenshot gate is built on it.
//
// The spec asserts WIRING through those seams and through data attributes — never a Korean
// copy string. The only Korean below is the INV-7 negative match.
import { expect, test, type Page } from '@playwright/test';

const GATE = '/?gate=1';
/** The gate seam at authored tunables — the only boot §1-3 can be timed on. */
const GATE_DEFAULT_PACE = '/?gate=1&pace=default';

/** INV-7: none of this may reach the player on a degraded path. */
const NOISE = /경고|오류|실패|없습니다|타임아웃|warn|error|fail|timeout/i;

/** data/tuning.json gauge.tiers.limit — the number stays data, the rule is §1-4. */
const TIER_LIMIT = 70;

/** PRD §1-3 / §7 — a full run is 3–5 minutes of play at default tunables. */
const RUN_MIN_MS = 3 * 60_000;
const RUN_MAX_MS = 5 * 60_000;

/** data/council.json rewards. */
const T1_FIXED_CARD = 'taunt';
const T4A_DRAFT_CARD = 'grudge';
const T5_DRAFT_CARD = 'dual_slash';

/** data/map.json — path A is the run the pacing rule is stated about. */
const PATH_A = ['t1', 't2', 't3a', 't4a', 't5', 't6', 't7'];

interface DecisionRecord {
  unitId: string;
  actionId: string;
  targetId: string | null;
  because: string[];
  coerced: boolean;
  bucket: string | null;
  corrupted: boolean;
}

interface RunTurn {
  /** Which tile's fight this turn belongs to — u17's addition to the u5 record. */
  tileId: string;
  turn: number;
  decisions: DecisionRecord[];
  phantomIds: string[];
  damage: Array<{ sourceId: string; targetId: string; amount: number }>;
  gauge: Record<string, number>;
}

interface AppState {
  phase: string;
  tileId: string;
  visited: string[];
  party: { unitId: string; hp: number }[];
}

/** One rendered bubble, captured by the init-script observer below. */
interface SeenBubble {
  tileId: string | null;
  unitId: string | null;
  actionId: string | null;
  targetId: string | null;
  tier: string | null;
  sawPhantom: string | null;
  chips: string[];
}

/**
 * The gate seam as THIS unit needs it. It is read through a cast rather than through a
 * `declare global` because e2e/run-flow.spec.ts (u15) already declares `window.__app`
 * with the pre-u17 shape, and two ambient declarations of one property must be identical.
 */
interface AppSeam {
  mode: string;
  tieBreak: string;
  bootCount: number;
  screenIds: string[];
  mounted: string | null;
  state: AppState;
  loadout: Record<string, string[]>;
  /** u17's addition — see the contract note at the top of this file. */
  turns: RunTurn[];
  drain: () => Promise<void>;
}

declare global {
  interface Window {
    /** Test-side only: every combat bubble the app ever rendered, in render order. */
    __seen?: SeenBubble[];
  }
}

/**
 * Records every bubble the run renders, across every fight and every screen remount.
 * Test-side only — installed with addInitScript, so the app never learns it exists.
 * A bubble log is per-fight DOM; the must-proves span three fights, so a query after
 * `drain()` would be reading whichever fight happens to still be mounted.
 */
async function observeBubbles(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const seen: SeenBubble[] = [];
    (window as unknown as { __seen: SeenBubble[] }).__seen = seen;

    const record = (node: Element): void => {
      const el = node as HTMLElement;
      if (el.dataset?.testid !== 'combat-bubble') return;
      seen.push({
        tileId: el.closest('[data-testid="combat-screen"]')?.getAttribute('data-tile-id') ?? null,
        unitId: el.getAttribute('data-unit-id'),
        actionId: el.getAttribute('data-action-id'),
        targetId: el.getAttribute('data-target-id'),
        tier: el.getAttribute('data-tier'),
        sawPhantom: el.getAttribute('data-saw-phantom'),
        chips: [...el.querySelectorAll('.dc-chip')].map(
          (chip) => (chip as HTMLElement).dataset.itemId ?? '',
        ),
      });
    };

    new MutationObserver((records) => {
      for (const r of records) {
        for (const node of r.addedNodes) {
          if (node.nodeType !== 1) continue;
          record(node as Element);
          for (const nested of (node as Element).querySelectorAll?.(
            '[data-testid="combat-bubble"]',
          ) ?? []) {
            record(nested);
          }
        }
      }
      // `document`, not `document.documentElement`: an init script runs before the
      // document element exists, and observing `null` throws before a single bubble
      // has been seen.
    }).observe(document, { childList: true, subtree: true });
  });
}

type Watchers = { consoleErrors: string[]; pageErrors: string[] };

function watch(page: Page): Watchers {
  const w: Watchers = { consoleErrors: [], pageErrors: [] };
  page.on('console', (m) => {
    if (m.type() === 'error') w.consoleErrors.push(m.text());
  });
  page.on('pageerror', (e) => w.pageErrors.push(e.message));
  return w;
}

function expectQuiet(w: Watchers): void {
  expect(w.pageErrors, `page errors: ${w.pageErrors.join(' | ')}`).toEqual([]);
  expect(w.consoleErrors, `console errors: ${w.consoleErrors.join(' | ')}`).toEqual([]);
}

const mounted = (page: Page): Promise<string | null> =>
  page.evaluate(() => (window as unknown as { __app?: AppSeam }).__app?.mounted ?? null);

const state = (page: Page): Promise<AppState> =>
  page.evaluate(() => (window as unknown as { __app: AppSeam }).__app.state);

const turns = (page: Page): Promise<RunTurn[]> =>
  page.evaluate(() => (window as unknown as { __app: AppSeam }).__app.turns);

const loadoutOf = (page: Page): Promise<Record<string, string[]>> =>
  page.evaluate(() => (window as unknown as { __app: AppSeam }).__app.loadout);

const bootOf = (page: Page): Promise<{ mode: string; tieBreak: string; bootCount: number }> =>
  page.evaluate(() => {
    const app = (window as unknown as { __app: AppSeam }).__app;
    return { mode: app.mode, tieBreak: app.tieBreak, bootCount: app.bootCount };
  });

const seen = (page: Page): Promise<SeenBubble[]> => page.evaluate(() => window.__seen ?? []);

const drain = (page: Page): Promise<void> =>
  page.evaluate(() => (window as unknown as { __app: AppSeam }).__app.drain());

async function waitForScreen(page: Page, id: string, timeout = 30_000): Promise<void> {
  await expect
    .poll(() => mounted(page), { message: `screen '${id}' never mounted`, timeout })
    .toBe(id);
}

/** The two player clicks of a card grant, then the confirm (§1-6: click-only). */
async function grantCardTo(page: Page, cardId: string, unitId: string): Promise<void> {
  await page.locator(`[data-testid="draft-row"] [data-card-id="${cardId}"]`).click();
  await page.locator(`[data-testid="target-picker"] [data-unit-id="${unitId}"]`).click();
  await page.getByTestId('training-done').click();
}

/** Screen copy a human can read right now — the INV-7 negative match reads this. */
const copyOnScreen = (page: Page): Promise<string> =>
  page.getByTestId('screen-slot').innerText();

/**
 * Plays path A end to end with the player verbs a judge would use, granting `t2Pick`
 * to `t2Unit` out of the T2 draft. Every wait is event-driven; nothing sleeps.
 *
 * The three optional knobs are PLAYER CHOICES the demo actually offers, not test
 * switches: who takes the T5 draft, and which 휴식 option is pressed at T6. They exist
 * because 「원한」 is only legible on a run that spends the 정리 — see the note on that
 * spec, and DISCOVERY.md's persistent-100 observation.
 */
async function playPathA(
  page: Page,
  options: {
    t2Pick: string;
    t2Unit: string;
    t5Unit?: string;
    restOption?: 'think' | 'clear';
    timeout?: number;
  },
): Promise<void> {
  const wait = options.timeout ?? 30_000;
  const t5Unit = options.t5Unit ?? 'selene';
  const restOption = options.restOption ?? 'think';

  await waitForScreen(page, 'combat', wait);
  await drain(page);

  await waitForScreen(page, 'training', wait);
  await grantCardTo(page, T1_FIXED_CARD, 'selene');

  await drain(page);
  await waitForScreen(page, 'training', wait);
  await grantCardTo(page, options.t2Pick, options.t2Unit);

  await drain(page);
  await waitForScreen(page, 'stage', wait);
  await page.locator('[data-testid="branch-card"][data-tile-id="t3a"]').click();

  await drain(page);
  await waitForScreen(page, 'council', wait);
  await page.getByTestId('council-done').click();

  await drain(page);
  await waitForScreen(page, 'training', wait);
  await grantCardTo(page, T4A_DRAFT_CARD, 'garrett');

  await drain(page);
  await waitForScreen(page, 'combat', wait);
  await drain(page);

  await waitForScreen(page, 'training', wait);
  await grantCardTo(page, T5_DRAFT_CARD, t5Unit);

  await drain(page);
  await waitForScreen(page, 'rest', wait);
  await page.getByTestId(`rest-option-${restOption}`).click();
  await page.getByTestId('rest-done').click();

  await drain(page);
  await waitForScreen(page, 'combat', wait);
  await drain(page);

  await waitForScreen(page, 'end', wait);
}

// ───────────────────────────── PRD §1-3 — pacing (must-prove 3) ─────────────────────────

test.describe('must-prove: tile rhythm', () => {
  test('pacing: the first combat is on screen within 60s of a cold load at default tunables', async ({
    page,
  }) => {
    test.setTimeout(120_000);
    const w = watch(page);

    const started = Date.now();
    await page.goto('/'); // the SHIPPED page — no gate, no tunable override
    await expect(page.getByTestId('combat-screen')).toBeVisible({ timeout: 60_000 });
    const elapsed = Date.now() - started;

    expect(elapsed, `first combat took ${elapsed}ms — §1-3 caps it at 60000ms`).toBeLessThan(
      60_000,
    );
    // Not just mounted: the fight is actually the T1 roster, ready to be watched.
    await expect(page.getByTestId('combat-screen')).toHaveAttribute('data-tile-id', 't1');
    expectQuiet(w);
  });

  test('pacing: a scripted full run clears in 3–5 minutes at default tunables', async ({
    page,
  }) => {
    // The run itself is minutes long by design; the budget below is the assertion, the
    // test timeout is only a backstop.
    test.setTimeout(RUN_MAX_MS + 120_000);
    const w = watch(page);

    const started = Date.now();
    await page.goto(GATE_DEFAULT_PACE);
    await playPathA(page, { t2Pick: 'fearless', t2Unit: 'fiona', timeout: 90_000 });
    const elapsed = Date.now() - started;

    const final = await state(page);
    expect(final.phase).toBe('clear');
    expect(final.visited).toEqual(PATH_A);

    expect(
      elapsed,
      `run cleared in ${Math.round(elapsed / 1000)}s — §1-3/§7 want 180–300s at default ` +
        'tunables (walk.durationMs, latency.stub, readable holds)',
    ).toBeGreaterThanOrEqual(RUN_MIN_MS);
    expect(
      elapsed,
      `run cleared in ${Math.round(elapsed / 1000)}s — §1-3/§7 cap it at 300s`,
    ).toBeLessThanOrEqual(RUN_MAX_MS);

    expectQuiet(w);
  });

  test('pacing: the default-pace gate boot is the SAME boot decision, only slower', async ({
    page,
  }) => {
    // Edge: ?pace=default must not smuggle in live mode or a random tie-break — it
    // changes durations and nothing else (PRD §5: all automated gates run stub/index).
    await page.goto(GATE_DEFAULT_PACE);
    await waitForScreen(page, 'combat', 90_000);

    expect(await bootOf(page)).toEqual({ mode: 'stub', tieBreak: 'index', bootCount: 1 });

    // And it stays gate-only: the shipped page publishes nothing even if asked nicely.
    await page.goto('/?pace=default');
    await expect(page.getByTestId('app-shell')).toBeVisible();
    expect(
      await page.evaluate(() => (window as unknown as { __app?: unknown }).__app === undefined),
    ).toBe(true);
  });
});

// ─────────────────── PRD §5 gate ① — gauge ≥70 + a noise turn, inside T1 ────────────────

test.describe('must-prove: context gauge drama', () => {
  test('gauge-70: playing T1 normally drives at least one unit to gauge ≥70', async ({ page }) => {
    const w = watch(page);
    await observeBubbles(page);
    await page.goto(GATE);

    await waitForScreen(page, 'combat');
    await expect(page.getByTestId('combat-screen')).toHaveAttribute('data-tile-id', 't1');
    await drain(page);

    const t1 = (await turns(page)).filter((t) => t.tileId === 't1');
    expect(t1.length, 'T1 must resolve turns before it is won').toBeGreaterThan(0);

    const peak = t1.reduce((best, turn) => {
      for (const value of Object.values(turn.gauge)) best = Math.max(best, value);
      return best;
    }, 0);
    expect(
      peak,
      `highest gauge in T1 was ${peak} — §2.5 requires the 스팸 골렘 도배 to push one hero ` +
        `to ${TIER_LIMIT} inside the FIRST fight, at default tunables and with no cards`,
    ).toBeGreaterThanOrEqual(TIER_LIMIT);

    expectQuiet(w);
  });

  test('gauge-70: the ≥70 turn renders a corrupted judgment while the stage stays real', async ({
    page,
  }) => {
    const w = watch(page);
    await observeBubbles(page);
    await page.goto(GATE);
    await waitForScreen(page, 'combat');
    await drain(page);

    const t1 = (await turns(page)).filter((t) => t.tileId === 't1');
    const noiseTurn = t1.find((t) => t.decisions.some((d) => d.corrupted));
    expect(
      noiseTurn,
      'a ≥70 hero must judge a POISONED snapshot inside T1 (§1-4, §2.5)',
    ).toBeTruthy();

    const corrupted = noiseTurn!.decisions.filter((d) => d.corrupted);
    for (const decision of corrupted) {
      expect(decision.bucket, 'the canned gauge_noise line answers a poisoned snapshot').toBe(
        'gauge_noise',
      );
      expect(decision.because.length, 'a corrupted judgment still attributes (INV-3)').toBeGreaterThan(
        0,
      );
    }
    expect(
      noiseTurn!.phantomIds.length,
      'the poison must add a body the snapshot can hallucinate',
    ).toBeGreaterThan(0);

    // Visibly renders — a judge sees it, not just the seam (§5 gate ①).
    const bubbles = await seen(page);
    const t1Bubbles = bubbles.filter((b) => b.tileId === 't1');
    expect(
      t1Bubbles.some((b) => b.sawPhantom === 'true'),
      'no bubble on screen was marked as judged on a corrupted snapshot',
    ).toBe(true);
    expect(
      t1Bubbles.some((b) => b.tier === 'limit' || b.tier === 'overload'),
      'no bubble on screen carried the ≥70 tier',
    ).toBe(true);

    // INV-4: the poison is judgment-input only — the phantom never becomes a body.
    const stageIds = await page
      .locator('[data-testid="stage"] .dc-unit')
      .evaluateAll((nodes) => nodes.map((n) => (n as HTMLElement).dataset.unitId ?? ''));
    for (const phantomId of noiseTurn!.phantomIds) {
      expect(stageIds, `phantom ${phantomId} must never reach the stage`).not.toContain(phantomId);
    }

    expect(NOISE.test(await copyOnScreen(page)), 'noise turn must not read as an error').toBe(
      false,
    );
    expectQuiet(w);
  });

  test('gauge-70: the noise turn fires BEFORE T1 is won — a judge cannot skip past it', async ({
    page,
  }) => {
    // Edge: reaching ≥70 on the very turn the fight ends would satisfy a naive
    // threshold check while showing the player nothing (§5: "a judge must never finish
    // the demo without seeing a noise turn").
    await observeBubbles(page);
    await page.goto(GATE);
    await waitForScreen(page, 'combat');
    await drain(page);

    await expect(page.getByTestId('combat-screen')).toHaveAttribute('data-outcome', 'victory');

    const t1 = (await turns(page)).filter((t) => t.tileId === 't1');
    const noiseIndex = t1.findIndex((t) => t.decisions.some((d) => d.corrupted));
    expect(noiseIndex, 'no corrupted turn in T1 at all').toBeGreaterThanOrEqual(0);
    expect(
      noiseIndex,
      'the corrupted turn was the last turn of the fight — it never got played to the player',
    ).toBeLessThan(t1.length - 1);
  });
});

// ─────────────── PRD §5 gate ② — the two council cards, in natural run order ────────────

test.describe('must-prove: council cards fire where the run grants them', () => {
  test('council-cards: 「번역 렌즈」 drafted at T2 reveals the T3a hint before the vote', async ({
    page,
  }) => {
    const w = watch(page);
    await page.goto(GATE);

    // T2-ACQUIRE — the card is drafted by the player, not seeded by a query param.
    await waitForScreen(page, 'combat');
    await drain(page);
    await waitForScreen(page, 'training');
    await grantCardTo(page, T1_FIXED_CARD, 'selene');
    await drain(page);
    await waitForScreen(page, 'training');
    await grantCardTo(page, 'translation_lens', 'selene');
    expect((await loadoutOf(page)).selene).toContain('translation_lens');

    await drain(page);
    await waitForScreen(page, 'stage');
    await page.locator('[data-testid="branch-card"][data-tile-id="t3a"]').click();

    // T3-FIRE — riddle_golem is the agenda with a hintLine.
    await drain(page);
    await waitForScreen(page, 'council');
    await expect(page.getByTestId('council-screen')).toHaveAttribute(
      'data-agenda-id',
      'riddle_golem',
    );

    const hint = page.getByTestId('council-hint');
    await expect(hint, 'the lens must reveal the hint on the composed screen').toBeVisible();
    await expect(hint).not.toBeEmpty();

    // It is a hint, not a post-mortem: on the composed screen `drain()` has already run
    // the whole round, so the ordering claim is read off document order — the hint is
    // rendered ahead of the tally it was supposed to inform, and survives it.
    const hintBeforeTally = await page.evaluate(() => {
      const hint = document.querySelector('[data-testid="council-hint"]');
      const tally = document.querySelector('[data-testid="council-tally"]');
      if (hint === null || tally === null) return null;
      return (hint.compareDocumentPosition(tally) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
    });
    expect(hintBeforeTally, 'the hint must be readable ahead of the tally').toBe(true);
    await expect(hint, 'the hint stays readable through the vote').toBeVisible();

    expectQuiet(w);
  });

  test('council-cards: without the lens the same T3a round shows no hint and no complaint', async ({
    page,
  }) => {
    const w = watch(page);
    await page.goto(GATE);

    await waitForScreen(page, 'combat');
    await drain(page);
    await waitForScreen(page, 'training');
    await grantCardTo(page, T1_FIXED_CARD, 'selene');
    await drain(page);
    await waitForScreen(page, 'training');
    await grantCardTo(page, 'fearless', 'fiona'); // anything but the lens

    await drain(page);
    await waitForScreen(page, 'stage');
    await page.locator('[data-testid="branch-card"][data-tile-id="t3a"]').click();
    await drain(page);
    await waitForScreen(page, 'council');

    await expect(page.getByTestId('council-hint')).toHaveCount(0);
    expect(NOISE.test(await copyOnScreen(page)), 'a missing hint is silent (INV-7)').toBe(false);
    expectQuiet(w);
  });

  test('council-cards: 셀레네+「승부사」 drafted at T2 flips her T3b stance and the outcome', async ({
    browser,
  }) => {
    // The flip is a COMPARISON, so it needs the same run twice: the card is the only
    // difference between the two pages.
    const readT3b = async (t2Pick: string): Promise<{ stance: string | null; winner: string | null }> => {
      const context = await browser.newContext();
      const page = await context.newPage();
      await page.goto(GATE);

      await waitForScreen(page, 'combat');
      await drain(page);
      await waitForScreen(page, 'training');
      await grantCardTo(page, T1_FIXED_CARD, 'garrett');
      await drain(page);
      await waitForScreen(page, 'training');
      await grantCardTo(page, t2Pick, 'selene');

      await drain(page);
      await waitForScreen(page, 'stage');
      await page.locator('[data-testid="branch-card"][data-tile-id="t3b"]').click();
      await drain(page);
      await waitForScreen(page, 'council');
      await expect(page.getByTestId('council-screen')).toHaveAttribute(
        'data-agenda-id',
        'fallen_merchant',
      );

      const bubble = page.locator('[data-testid="stance-bubble"][data-unit-id="selene"]');
      await expect(bubble).toHaveCount(1);
      const stance = await bubble.getAttribute('data-option-id');
      const winner = await page
        .getByTestId('council-tally')
        .getAttribute('data-winning-option-id');

      await context.close();
      return { stance, winner };
    };

    const baseline = await readT3b('translation_lens'); // a card that says nothing here
    const flipped = await readT3b('gambler');

    expect(
      flipped.stance,
      'the card must move 셀레네 herself, not the tally alone (§1-1, §2.6)',
    ).not.toBe(baseline.stance);
    expect(flipped.stance).toBe('op_merchant_save');
    expect(flipped.winner, 'and the moved stance must reach the outcome').not.toBe(
      baseline.winner,
    );
  });
});

// ──────────────── PRD §1-1 stub floor — the two authored attribution flips ──────────────

test.describe('must-prove: attribution flips are reachable by playing', () => {
  test('attribution-flip: 피오나+「겁이 없다」 turns her away from hiding, citing the card', async ({
    page,
  }) => {
    test.setTimeout(180_000);
    const w = watch(page);
    await observeBubbles(page);
    await page.goto(GATE);
    await playPathA(page, { t2Pick: 'fearless', t2Unit: 'fiona' });

    const all = await turns(page);
    const before = all
      .filter((t) => t.tileId === 't1')
      .flatMap((t) => t.decisions)
      .filter((d) => d.unitId === 'fiona');
    const after = all
      .filter((t) => t.tileId !== 't1' && t.tileId !== 't2')
      .flatMap((t) => t.decisions)
      .filter((d) => d.unitId === 'fiona');

    expect(before.length, 'T1 must give 피오나 an un-carded baseline').toBeGreaterThan(0);
    expect(
      before.every((d) => d.actionId !== 'strike'),
      'the shield-hugger baseline: unequipped 피오나 never charges (§1-2)',
    ).toBe(true);

    const charged = after.filter((d) => d.because.includes('fearless'));
    expect(
      charged.length,
      'after the T2 draft, 「겁이 없다」 never fired anywhere in the rest of the run — ' +
        'the authored flip is unreachable by playing (§1-1 stub floor)',
    ).toBeGreaterThan(0);
    expect(
      charged.some((d) => d.actionId === 'strike'),
      'the flip must change the ACTION (shield-hugger → first to charge), not just the chips',
    ).toBe(true);

    // …and the card is cited on screen, as a chip a judge can click (INV-3).
    const bubbles = await seen(page);
    expect(
      bubbles.some((b) => b.unitId === 'fiona' && b.chips.includes('fearless')),
      'no rendered 피오나 bubble cited 「겁이 없다」',
    ).toBe(true);

    expectQuiet(w);
  });

  test('attribution-flip: 가렛+「원한」 retargets onto last_hit_by, citing the card', async ({
    page,
  }) => {
    test.setTimeout(180_000);
    const w = watch(page);
    await observeBubbles(page);
    await page.goto(GATE);
    // grudge lands at T4a — and the run has to be played so 가렛 is still ALLOWED to
    // judge when it matters. T1 pins him at the 폭주 ceiling for the rest of the run
    // (DISCOVERY.md, "the unit that never comes back"), and 생각정리 does not bring him
    // under the 한계 line before the last fight; 정리 does, at the cost of the oldest
    // Prompt card. Both are player verbs the 휴식 screen offers.
    await playPathA(page, {
      t2Pick: 'fearless',
      t2Unit: 'fiona',
      t5Unit: 'fiona',
      restOption: 'clear',
    });

    const all = await turns(page);
    const grudgeTurns = all.filter((t) =>
      t.decisions.some((d) => d.unitId === 'garrett' && d.because.includes('grudge')),
    );
    expect(
      grudgeTurns.length,
      'after the T4a draft, 「원한」 never fired — the authored retarget is unreachable',
    ).toBeGreaterThan(0);

    for (const turn of grudgeTurns) {
      const index = all.indexOf(turn);
      // Who last put damage on 가렛 before he judged this turn.
      let lastHitBy: string | null = null;
      for (const earlier of all.slice(0, index)) {
        for (const hit of earlier.damage) {
          if (hit.targetId === 'garrett') lastHitBy = hit.sourceId;
        }
      }
      expect(lastHitBy, 'the retarget bucket only exists once 가렛 has been hit').not.toBeNull();

      const decision = turn.decisions.find(
        (d) => d.unitId === 'garrett' && d.because.includes('grudge'),
      )!;
      expect(
        decision.targetId,
        '「원한」 must aim him at whoever hit him last, not at the roster order',
      ).toBe(lastHitBy);
      expect(decision.actionId).toBe('strike');
    }

    const bubbles = await seen(page);
    expect(
      bubbles.some((b) => b.unitId === 'garrett' && b.chips.includes('grudge')),
      'no rendered 가렛 bubble cited 「원한」',
    ).toBe(true);

    expectQuiet(w);
  });

  test('attribution-flip: every decision the whole run displays keeps a resolvable chip', async ({
    page,
  }) => {
    test.setTimeout(180_000);
    await observeBubbles(page);
    await page.goto(GATE);
    await playPathA(page, { t2Pick: 'fearless', t2Unit: 'fiona' });

    const all = await turns(page);
    expect(all.length, 'a full run resolves combat turns').toBeGreaterThan(0);
    for (const turn of all) {
      for (const decision of turn.decisions) {
        expect(
          decision.because.length,
          `${turn.tileId} turn ${turn.turn}: ${decision.unitId} displayed a decision with no ` +
            'because (INV-3)',
        ).toBeGreaterThan(0);
      }
    }

    const bubbles = await seen(page);
    expect(bubbles.length).toBeGreaterThan(0);
    for (const bubble of bubbles) {
      expect(
        bubble.chips.filter((id) => id !== '').length,
        `a ${bubble.unitId} bubble rendered with no clickable chip (INV-3)`,
      ).toBeGreaterThan(0);
    }
  });
});

// ───────────────────────── INV-1 / INV-2 / INV-7 / INV-8 — ship gates ──────────────────

test.describe('must-prove: the shipped page', () => {
  test('membrane: no text-entry element exists in any phase of a full run (INV-1)', async ({
    page,
  }) => {
    test.setTimeout(180_000);
    const CONTROLS = 'input, textarea, [contenteditable="true"], [contenteditable=""]';
    await page.goto(GATE);

    const assertClosed = async (where: string): Promise<void> => {
      expect(await page.locator(CONTROLS).count(), `text entry present at ${where}`).toBe(0);
    };

    await waitForScreen(page, 'combat');
    await assertClosed('t1 combat');
    await drain(page);
    await waitForScreen(page, 'training');
    await assertClosed('t1 reward');
    await grantCardTo(page, T1_FIXED_CARD, 'selene');
    await drain(page);
    await waitForScreen(page, 'training');
    await assertClosed('t2 draft');
    await grantCardTo(page, 'fearless', 'fiona');
    await drain(page);
    await waitForScreen(page, 'stage');
    await assertClosed('branch');
    await page.locator('[data-testid="branch-card"][data-tile-id="t3a"]').click();
    await drain(page);
    await waitForScreen(page, 'council');
    await assertClosed('council');
    await page.getByTestId('council-done').click();
    await drain(page);
    await waitForScreen(page, 'training');
    await grantCardTo(page, T4A_DRAFT_CARD, 'garrett');
    await drain(page);
    await waitForScreen(page, 'combat');
    await drain(page);
    await waitForScreen(page, 'training');
    await grantCardTo(page, T5_DRAFT_CARD, 'selene');
    await drain(page);
    await waitForScreen(page, 'rest');
    await assertClosed('rest');
    await page.getByTestId('rest-option-think').click();
    await page.getByTestId('rest-done').click();
    await drain(page);
    await waitForScreen(page, 'combat');
    await drain(page);
    await waitForScreen(page, 'end');
    await assertClosed('end');
  });

  test('offline: the built page makes no network call beyond its own static assets', async ({
    page,
  }) => {
    test.setTimeout(180_000);
    const foreign: string[] = [];
    page.on('request', (request) => {
      const url = request.url();
      if (url.startsWith('data:') || url.startsWith('blob:')) return;
      const origin = new URL(url).origin;
      if (origin !== 'http://localhost:4174' || /\/ai\//.test(new URL(url).pathname)) {
        foreign.push(url);
      }
    });

    await page.goto(GATE);
    await playPathA(page, { t2Pick: 'fearless', t2Unit: 'fiona' });

    expect(
      foreign,
      `the deployed build must call nothing (INV-2, INV-8): ${foreign.join(' | ')}`,
    ).toEqual([]);
  });

  test('offline: with the network cut the whole run still clears, silently (INV-7)', async ({
    page,
    context,
  }) => {
    test.setTimeout(180_000);
    const w = watch(page);
    await page.goto(GATE);
    await waitForScreen(page, 'combat');

    // Everything the shipped build needs is already bundled; cutting the network must
    // therefore be a non-event — and must never surface as text.
    await context.setOffline(true);
    await playPathA(page, { t2Pick: 'fearless', t2Unit: 'fiona' });

    await expect(page.getByTestId('end-screen')).toHaveAttribute('data-result', 'clear');
    expect((await state(page)).phase).toBe('clear');
    expect(NOISE.test(await copyOnScreen(page)), 'degradation must be silent').toBe(false);
    await context.setOffline(false);
    expectQuiet(w);
  });
});

// ─────────────── u16 asset pack — the OWN-SLICE GATE on the COMPOSED page ───────────────
//
// e2e/assets.spec.ts already proves the pack paints on its own harness. That is not the
// same claim as "the shipped page paints it": src/styles/assets.css only reaches the DOM
// because something in the real app import graph pulls in src/assets/slots.ts, and a
// harness-only import leaves `/` painting nothing but u7's CSS-only fallbacks. This is
// the composed-run half of that gate.

test.describe('must-prove: asset pack reaches the shipped page', () => {
  test('a staged hero resolves --slot-hero to a real pack url, not the CSS-only fallback', async ({
    page,
  }) => {
    const w = watch(page);
    await page.goto(GATE);
    await waitForScreen(page, 'combat');

    const sprite = page.locator('[data-testid="combat-sprite"]').first();
    await expect(sprite, 'no staged hero sprite mounted').toBeAttached();

    const slotVar = await sprite.evaluate((el) =>
      getComputedStyle(el as Element).getPropertyValue('--slot-hero').trim(),
    );
    const backgroundImage = await sprite.evaluate((el) =>
      getComputedStyle(el as Element).backgroundImage,
    );

    expect(
      slotVar,
      '--slot-hero is unset on the composed page — assets.css never reached `/`, so the ' +
        'app is stuck on the CSS-only fallback (src/assets/slots.ts is not imported by the ' +
        'app entry graph)',
    ).toMatch(/url\(/);
    expect(
      backgroundImage,
      'the sprite paints no url() background-image — the pack is not lit on the shipped page',
    ).toMatch(/url\(/);
    expect(backgroundImage, 'the sprite must resolve to a .png cell, not an inline gradient').not.toMatch(
      /gradient/,
    );

    expectQuiet(w);
  });

  test('a staged enemy resolves --slot-mob to a real pack url, keyed off the MONSTER id, not the CSS-only fallback', async ({
    page,
  }) => {
    const w = watch(page);
    await page.goto(GATE);
    await waitForScreen(page, 'combat');

    // Enemies never get a `[data-testid="combat-sprite"]` tag (u10 only tags heroes) —
    // reach the enemy sprite through the stage side it is staged on instead.
    const sprite = page
      .locator('[data-testid="stage-enemies"] .dc-unit__sprite')
      .first();
    await expect(sprite, 'no staged enemy sprite mounted').toBeAttached();

    const slotVar = await sprite.evaluate((el) =>
      getComputedStyle(el as Element).getPropertyValue('--slot-mob').trim(),
    );
    const backgroundImage = await sprite.evaluate(
      (el) => getComputedStyle(el as Element).backgroundImage,
    );

    expect(
      slotVar,
      '--slot-mob is unset on the composed page — the enemy element carries its ' +
        'per-encounter instance id on data-unit-id, and assets.css must key the monster ' +
        'sheet off data-monster-id (the MONSTER id) instead for this to resolve',
    ).toMatch(/url\(/);
    expect(
      backgroundImage,
      'the enemy sprite paints no url() background-image — the monster sheet is not lit ' +
        'on the shipped page',
    ).toMatch(/url\(/);
    expect(
      backgroundImage,
      'the enemy sprite must resolve to a .png cell, not an inline gradient',
    ).not.toMatch(/gradient/);

    expectQuiet(w);
  });
});

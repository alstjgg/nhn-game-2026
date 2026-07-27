// Behavioral TDD-Red e2e for u10 — the 전투 screen (PRD §2.5, §2.8, §1-2, INV-3/4/7).
//
// Playwright, chromium/headless, served from the real build (playwright.config.ts).
//
// Why a harness page and not `/`: index.html and src/main.ts are u1-owned and frozen for
// this unit. u1 left the seam — vite.config.ts globs `e2e/harness/*/index.html` — so u10
// ships its own standalone page and edits no shared file (the same move u11 made).
//
// ─────────────────────────── HARNESS CONTRACT (u10 must build) ───────────────────────────
// Page: e2e/harness/combat/index.html + main.ts → served at /e2e/harness/combat/
// Real data via loadBundledGameData() + the authored stub pool from data/decisions.json,
// booted as an automated gate: stub mode, adapter latency 0, `tieBreak` policy `index`
// (PRD §5). No spec below ever races a clock.
//
//   Query params
//     ?tile=t1|t5|t7                default: t1        which roster fights
//     ?gauge=<unitId>:<0-100>       repeatable         seeds ONE hero's starting gauge,
//                                                      e.g. ?gauge=fiona:70 (default 0)
//     ?equip=<unitId>:<cardId>      repeatable         seeds one card on one unit
//     ?scenario=default|victory|defeat|silent          default: default
//         victory — enemy HP seeded low enough that the party wins inside a few turns
//         defeat  — hero HP seeded to 1 so the whole party goes down
//         silent  — the adapter never answers; every judgment must degrade (INV-7)
//
//   Playback is HELD until `window.__combat.start()`. Bubbles then play SEQUENTIALLY —
//   one beat per `step()` — which is the only way to prove "one at a time, in 민첩 order"
//   without racing a timer. Both are harness affordances, never player controls: nothing
//   in the DOM invokes them.
//
//   [data-testid="combat-screen"][data-tile-id][data-turn][data-outcome]
//       data-outcome ∈ ongoing | victory | defeat
//     [data-testid="stage"]                      u7's createStage — heroes left, enemies
//         right, NOBODY MOVES. It contains one `.dc-unit[data-unit-id]` per REAL entity
//         and never a phantom (INV-4).
//     [data-testid="combat-sprite"][data-unit-id][data-pose][data-action]
//         The hero sheet is 4×3 (PRD §2.8): row 1 = 걷기, row 2 = 게이지 tier 대기-포즈
//         (calm|uneasy|limit|overload), row 3 = 액션 (attack|defend|hit|down). The screen
//         picks the CELL through the u7/u1 `--cell-row` / `--cell-col` seam — so the spec
//         reads computed custom properties, not a bespoke class name.
//         data-pose ∈ calm|uneasy|limit|overload   data-action ∈ idle|attack|defend|hit|down
//     [data-testid="combat-hud"]
//         one u7 `.dc-unit-panel[data-unit-id]` per hero, each carrying `.dc-vial[data-state]`
//     [data-testid="combat-bubble"][data-unit-id][data-action-id][data-coerced]
//         [data-tier]        the gauge tier that produced this line
//         [data-target-id]   ABSENT when the answer named no target
//         [data-saw-phantom] "true" only when the snapshot this line was judged on was
//                            corrupted and carried a phantom (PRD §2.5)
//         [data-stutter]     "true" only on the 40–70 tier (PRD §2.5 presentation-only)
//         Built with u7's createBubble, so the chips are `.dc-chip[data-item-id]` and an
//         empty `because` cannot be constructed at all (INV-3).
//     [data-testid="unit-sheet"][data-unit-id]   u7's createUnitSheet; a cited row carries
//         `.dc-sheet__item--cited`
//     [data-testid="phantom-swing"]              허공을 벤다, when a swing found nothing
//
//   Handoff (the screen ANNOUNCES; the reward/defeat UI is another unit's):
//     `combat:victory` → detail { tileId, rosterId }
//     `combat:defeat`  → detail { tileId }
//   Both bubble off [data-testid="combat-screen"] and are mirrored into `handoffs`.
//
//   window.__combat = {
//     tileId: string; rosterId: string;
//     heroIds: string[];            // party order (data/heroes.json order)
//     enemyIds: string[];           // REAL roster instance ids
//     outcome: 'ongoing' | 'victory' | 'defeat';
//     turns: TurnRecord[];          // one per RESOLVED turn, in order
//     handoffs: Handoff[];
//     start: () => void;
//     step: () => Promise<void>;    // exactly one presentation beat
//     drain: () => Promise<void>;   // play to an outcome
//   }
//
// The spec asserts WIRING through that object and through data attributes — never a
// Korean copy string. The only place Korean appears below is the INV-7 negative match.
import { expect, test, type Locator, type Page } from '@playwright/test';

const HARNESS = '/e2e/harness/combat/';

/** INV-7: none of this may reach the player on a degraded path. */
const NOISE = /경고|오류|실패|없습니다|타임아웃|warn|error|fail|timeout/i;

/** The demo party, and their 민첩 from data/heroes.json — execution runs DESCENDING. */
const AGI_ORDER = ['selene', 'fiona', 'garrett'];

/** data/heroes.json 직업 기본 행동 — what a suppressed or timed-out judgment falls back to. */
const CLASS_DEFAULT_ACTION: Record<string, string> = {
  garrett: 'defend',
  fiona: 'wait',
  selene: 'evade',
};

/** PRD §2.8 hero sheet rows: 0 걷기 · 1 게이지 tier 대기-포즈 · 2 액션. */
const POSE_ROW = '1';
const ACTION_ROW = '2';
/** Column order inside each row. */
const POSE_COL: Record<string, string> = { calm: '0', uneasy: '1', limit: '2', overload: '3' };
const ACTION_COL: Record<string, string> = { attack: '0', defend: '1', hit: '2', down: '3' };

/** data/tuning.json gauge.tiers — the numbers stay data; the spec only names the seams. */
const TIER_UNEASY = 40;
const TIER_LIMIT = 70;
const TIER_OVERLOAD = 100;

interface DecisionRecord {
  unitId: string;
  actionId: string;
  targetId: string | null;
  because: string[];
  coerced: boolean;
  /** Which canned bucket answered, or null when nothing was asked. */
  bucket: string | null;
  /** Whether the snapshot this unit judged on was poisoned (PRD §2.5, INV-4). */
  corrupted: boolean;
}

interface TurnRecord {
  turn: number;
  decisions: DecisionRecord[];
  /** Ids that existed ONLY inside a corrupted snapshot. */
  phantomIds: string[];
  damage: Array<{ sourceId: string; targetId: string; amount: number }>;
  gauge: Record<string, number>;
}

interface Handoff {
  type: 'victory' | 'defeat';
  tileId: string;
  rosterId?: string;
}

interface CombatFixture {
  tileId: string;
  rosterId: string;
  heroIds: string[];
  enemyIds: string[];
  outcome: 'ongoing' | 'victory' | 'defeat';
  turns: TurnRecord[];
  handoffs: Handoff[];
}

declare global {
  interface Window {
    __combat?: CombatFixture & {
      start: () => void;
      step: () => Promise<void>;
      drain: () => Promise<void>;
    };
  }
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

function expectClean(w: Watchers): void {
  expect(w.pageErrors, `page errors: ${w.pageErrors.join(' | ')}`).toEqual([]);
  expect(w.consoleErrors, `console errors: ${w.consoleErrors.join(' | ')}`).toEqual([]);
}

/** Loads the harness and returns the published fixture, before anything plays. */
async function open(page: Page, query = ''): Promise<CombatFixture> {
  const response = await page.goto(`${HARNESS}${query}`);
  expect(response, 'no navigation response').toBeTruthy();
  expect(response!.ok(), `bad status ${response!.status()}`).toBeTruthy();
  await expect(page.getByTestId('combat-screen')).toBeVisible();
  const fixture = await page.evaluate(() => window.__combat);
  expect(fixture, 'harness does not expose window.__combat').toBeTruthy();
  return fixture!;
}

const readFixture = (page: Page): Promise<CombatFixture> =>
  page.evaluate(() => window.__combat) as Promise<CombatFixture>;

const start = (page: Page): Promise<void> => page.evaluate(() => window.__combat?.start());
const step = (page: Page): Promise<void> => page.evaluate(() => window.__combat?.step());
const drain = (page: Page): Promise<void> => page.evaluate(() => window.__combat?.drain());

/** Reads a `--cell-row` / `--cell-col` off the computed style of a sprite. */
function cellOf(sprite: Locator, prop: '--cell-row' | '--cell-col'): Promise<string> {
  return sprite.evaluate(
    (el, name) => getComputedStyle(el).getPropertyValue(name).trim(),
    prop,
  );
}

const bubbleOf = (page: Page, unitId: string): Locator =>
  page.locator(`[data-testid="combat-bubble"][data-unit-id="${unitId}"]`);

const spriteOf = (page: Page, unitId: string): Locator =>
  page.locator(`[data-testid="combat-sprite"][data-unit-id="${unitId}"]`);

test.describe('combat screen', () => {
  test('own slice: a scripted stub fight plays to an outcome with zero console errors', async ({
    page,
  }) => {
    const w = watch(page);
    const fixture = await open(page, '?scenario=victory');

    expect(fixture.tileId).toBe('t1');
    expect(fixture.heroIds).toEqual(['garrett', 'fiona', 'selene']);
    expect(fixture.enemyIds.length, 'the roster must stage at least one enemy').toBeGreaterThan(0);
    expect(fixture.turns, 'nothing may resolve before start()').toEqual([]);
    await expect(page.getByTestId('combat-screen')).toHaveAttribute('data-outcome', 'ongoing');

    await start(page);
    await drain(page);

    const settled = await readFixture(page);
    expect(settled.outcome).not.toBe('ongoing');
    expect(settled.turns.length, 'a fight is at least one turn').toBeGreaterThan(0);
    await expect(page.getByTestId('combat-screen')).toHaveAttribute(
      'data-outcome',
      settled.outcome,
    );
    expectClean(w);
  });

  test('sequential: bubbles land one beat at a time, in 민첩-descending order', async ({
    page,
  }) => {
    const w = watch(page);
    await open(page);
    await start(page);

    const bubbles = page.getByTestId('combat-bubble');
    await expect(bubbles, 'the turn is held before the first beat').toHaveCount(0);

    const seen: string[] = [];
    for (let i = 0; i < AGI_ORDER.length; i += 1) {
      await step(page);
      await expect(bubbles, 'one beat may only add one bubble').toHaveCount(i + 1);
      const ids = await bubbles.evaluateAll((nodes) =>
        nodes.map((n) => (n as HTMLElement).dataset.unitId ?? ''),
      );
      seen.splice(0, seen.length, ...ids);
    }

    expect(seen, 'execution order is 민첩 descending (PRD §2.5)').toEqual(AGI_ORDER);
    expectClean(w);
  });

  test('nobody moves: a hero holds its exact stage position across a whole turn', async ({
    page,
  }) => {
    await open(page);
    const unit = page.locator('[data-testid="stage"] .dc-unit[data-unit-id="fiona"]');
    const before = await unit.boundingBox();
    expect(before, 'the party must be staged before the fight starts').toBeTruthy();

    await start(page);
    await drain(page);

    const after = await unit.boundingBox();
    expect(after!.x, 'stationary combat: no horizontal movement (PRD §2.5)').toBeCloseTo(
      before!.x,
      1,
    );
  });

  test('because: every displayed decision carries at least one resolvable chip (INV-3)', async ({
    page,
  }) => {
    const w = watch(page);
    await open(page);
    await start(page);
    await drain(page);

    const bubbles = page.getByTestId('combat-bubble');
    // The rail shows one LIVE line per speaker and keeps the rest as the fight's record
    // (a wall of stacked panels used to bury the line-up), so "a decision is on screen"
    // is asked of a line that has not been spoken past.
    await expect(
      page.locator('[data-testid="combat-bubble"]:not([data-retired="true"])').first(),
    ).toBeVisible();

    // Every decision the fight ever rendered still has to resolve (INV-3).
    const shown = await bubbles.evaluateAll((nodes) =>
      nodes.map((node) => ({
        unitId: (node as HTMLElement).dataset.unitId ?? '',
        chips: [...node.querySelectorAll('.dc-chip')].map(
          (chip) => (chip as HTMLElement).dataset.itemId ?? '',
        ),
      })),
    );
    expect(shown.length, 'the fight must show decisions').toBeGreaterThan(0);
    for (const entry of shown) {
      expect(entry.chips.length, `${entry.unitId} rendered a decision with no chip`).toBeGreaterThan(
        0,
      );
      expect(entry.chips.every((id) => id !== '')).toBe(true);
    }

    // Every chip on screen must resolve to a real row of THAT unit's sheet.
    for (const entry of shown) {
      const rows = await page
        .locator(`[data-testid="unit-sheet"][data-unit-id="${entry.unitId}"] [data-item-id]`)
        .evaluateAll((nodes) => nodes.map((n) => (n as HTMLElement).dataset.itemId ?? ''));
      for (const chipId of entry.chips) {
        expect(rows, `chip "${chipId}" resolves to no sheet row of ${entry.unitId}`).toContain(
          chipId,
        );
      }
    }
    expectClean(w);
  });

  test('because: clicking a chip highlights the matching row in that unit sheet', async ({
    page,
  }) => {
    const w = watch(page);
    await open(page);
    await start(page);
    await step(page);

    const bubble = bubbleOf(page, 'selene');
    await expect(bubble).toBeVisible();
    const chip = bubble.locator('.dc-chip').first();
    const chipId = await chip.getAttribute('data-item-id');
    expect(chipId).toBeTruthy();

    const sheet = page.locator('[data-testid="unit-sheet"][data-unit-id="selene"]');
    const row = sheet.locator(`[data-item-id="${chipId}"]`);
    await expect(row, 'nothing is highlighted before the chip is pressed').not.toHaveClass(
      /dc-sheet__item--cited/,
    );

    await chip.click();

    await expect(sheet).toBeVisible();
    await expect(row, 'the cited row must light up (PRD §2.3, INV-3)').toHaveClass(
      /dc-sheet__item--cited/,
    );
    // Only the cited rows — a highlight on everything proves nothing.
    const lit = await sheet
      .locator('.dc-sheet__item--cited')
      .evaluateAll((nodes) => nodes.map((n) => (n as HTMLElement).dataset.itemId ?? ''));
    expect(lit).toContain(chipId);
    const allRows = await sheet
      .locator('[data-item-id]')
      .evaluateAll((nodes) => nodes.length);
    expect(lit.length, 'the whole sheet must not light up').toBeLessThan(allRows);
    expectClean(w);
  });

  test('fiona-opening: 피오나 defends while unhurt, bubble + because [fiona.default]', async ({
    page,
  }) => {
    const w = watch(page);
    const fixture = await open(page);
    expect(fixture.turns).toEqual([]);

    const unit = page.locator('[data-testid="stage"] .dc-unit[data-unit-id="fiona"]');
    const before = await unit.boundingBox();

    await start(page);
    // Her beat, and no further, so this is provably the OPENING turn.
    for (let i = 0; i < AGI_ORDER.indexOf('fiona') + 1; i += 1) await step(page);

    const bubble = bubbleOf(page, 'fiona');
    await expect(bubble, 'personality must read from the bubble alone (§1-2)').toBeVisible();
    await expect(bubble).toHaveAttribute('data-action-id', 'defend');
    await expect(bubble).toHaveAttribute('data-coerced', 'false');
    await expect(bubble.locator('.dc-chip[data-item-id="fiona.default"]')).toBeVisible();
    await expect(bubble.locator('.dc-bubble__say')).not.toBeEmpty();

    const turn = (await readFixture(page)).turns[0];
    const fiona = turn?.decisions.find((d) => d.unitId === 'fiona');
    expect(fiona, 'the opening turn must record 피오나').toBeTruthy();
    expect(fiona!.actionId, 'she defends — she is not asked to, she chooses to').toBe('defend');
    expect(fiona!.bucket).toBe('opening');
    expect(fiona!.because).toContain('fiona.default');
    expect(fiona!.coerced, 'an authored personality read, not a fallback').toBe(false);

    // "Unhurt" is the whole point of must-prove 2 — she is afraid, not damaged.
    const hurt = turn!.damage.filter((d) => d.targetId === 'fiona');
    expect(hurt, 'she must still be untouched when she chooses to defend').toEqual([]);

    // ...and she did it without moving a pixel.
    const after = await unit.boundingBox();
    expect(after!.x).toBeCloseTo(before!.x, 1);
    expect(after!.y).toBeCloseTo(before!.y, 1);
    expectClean(w);
  });

  test('gauge: the vial state and the 대기-포즈 cell follow the tier', async ({ page }) => {
    const w = watch(page);
    await open(page, `?gauge=garrett:0&gauge=fiona:${TIER_UNEASY}&gauge=selene:${TIER_LIMIT}`);

    const expected: Array<[string, string]> = [
      ['garrett', 'calm'],
      ['fiona', 'uneasy'],
      ['selene', 'limit'],
    ];

    for (const [unitId, tier] of expected) {
      const vial = page.locator(
        `[data-testid="combat-hud"] .dc-unit-panel[data-unit-id="${unitId}"] .dc-vial`,
      );
      await expect(vial, `${unitId} vial`).toHaveAttribute('data-state', tier);

      const sprite = spriteOf(page, unitId);
      await expect(sprite, `${unitId} pose`).toHaveAttribute('data-pose', tier);
      await expect(sprite).toHaveAttribute('data-action', 'idle');
      // §2.8: the 대기-포즈 lives on row 2 of the 4×3 sheet, one column per tier.
      expect(await cellOf(sprite, '--cell-row'), `${unitId} pose row`).toBe(POSE_ROW);
      expect(await cellOf(sprite, '--cell-col'), `${unitId} pose col`).toBe(POSE_COL[tier]);
    }
    expectClean(w);
  });

  test('gauge: the 40–70 tier acts the stutter and nothing else changes', async ({ page }) => {
    const w = watch(page);
    await open(page, `?gauge=fiona:${TIER_UNEASY}`);
    await start(page);
    await drain(page);

    const stuttered = bubbleOf(page, 'fiona').first();
    await expect(stuttered).toHaveAttribute('data-tier', 'uneasy');
    await expect(stuttered, 'presentation-only tier (PRD §2.5)').toHaveAttribute(
      'data-stutter',
      'true',
    );

    // A calm unit in the SAME fight must not stutter — otherwise the tier proves nothing.
    const calm = bubbleOf(page, 'garrett').first();
    await expect(calm).toHaveAttribute('data-tier', 'calm');
    await expect(calm).not.toHaveAttribute('data-stutter', 'true');

    // 40–70 is acting, not corruption: the judgment input is still honest.
    const turn = (await readFixture(page)).turns[0];
    const fiona = turn.decisions.find((d) => d.unitId === 'fiona');
    expect(fiona!.corrupted, 'noise starts at 한계, not 불안 (INV-4)').toBe(false);
    expect(turn.phantomIds).toEqual([]);
    expectClean(w);
  });

  test('noise: a ≥70 turn renders the phantom in the bubble while the hit lands on a real entity', async ({
    page,
  }) => {
    const w = watch(page);
    const fixture = await open(page, `?gauge=fiona:${TIER_LIMIT}`);
    await start(page);
    await drain(page);

    const after = await readFixture(page);
    const noiseTurn = after.turns.find((t) =>
      t.decisions.some((d) => d.unitId === 'fiona' && d.corrupted),
    );
    expect(noiseTurn, 'a ≥70 hero must judge a corrupted snapshot (PRD §2.5)').toBeTruthy();

    const fiona = noiseTurn!.decisions.find((d) => d.unitId === 'fiona')!;
    expect(fiona.bucket, 'the canned gauge_noise line answers a poisoned snapshot').toBe(
      'gauge_noise',
    );
    expect(noiseTurn!.phantomIds.length, 'the poison must add a body').toBeGreaterThan(0);

    // The phantom is IN THE BUBBLE...
    const bubble = bubbleOf(page, 'fiona').first();
    await expect(bubble).toHaveAttribute('data-tier', 'limit');
    await expect(bubble).toHaveAttribute('data-saw-phantom', 'true');

    // ...and NOWHERE in real state: not staged, and never hit (INV-4).
    for (const phantomId of noiseTurn!.phantomIds) {
      expect(fixture.enemyIds, 'a phantom is not a roster entry').not.toContain(phantomId);
      await expect(
        page.locator(`[data-testid="stage"] .dc-unit[data-unit-id="${phantomId}"]`),
        'execution always runs on real state (INV-4)',
      ).toHaveCount(0);
    }

    const real = new Set([...fixture.enemyIds, ...fixture.heroIds]);
    const landed = after.turns.flatMap((t) => t.damage);
    expect(landed.length, 'the fight must actually hit something').toBeGreaterThan(0);
    for (const hit of landed) {
      expect(real, `damage landed on phantom "${hit.targetId}"`).toContain(hit.targetId);
      expect(real, `damage came from phantom "${hit.sourceId}"`).toContain(hit.sourceId);
    }

    // A swing that found nothing is 허공을 벤다, never an error line.
    const copy = await page.evaluate(() => document.body.innerText);
    expect(NOISE.test(copy), `noise on screen: ${copy}`).toBe(false);
    expectClean(w);
  });

  test('gauge: the 100 tier shows the fixed bubble and repeats the 직업 기본 행동', async ({
    page,
  }) => {
    const w = watch(page);
    await open(page, `?gauge=garrett:${TIER_OVERLOAD}`);

    const sprite = spriteOf(page, 'garrett');
    await expect(sprite).toHaveAttribute('data-pose', 'overload');
    expect(await cellOf(sprite, '--cell-col')).toBe(POSE_COL.overload);

    await start(page);
    await drain(page);

    const after = await readFixture(page);
    const mine = after.turns
      .map((t) => t.decisions.find((d) => d.unitId === 'garrett'))
      .filter((d): d is DecisionRecord => d !== undefined);
    expect(mine.length, 'the 100 tier is drama across turns, not one beat').toBeGreaterThan(1);

    for (const decision of mine) {
      expect(decision.actionId, '판단 생략 → 직업 기본 행동 (PRD §2.5)').toBe(
        CLASS_DEFAULT_ACTION.garrett,
      );
      expect(decision.coerced, 'the engine replaced the judgment').toBe(true);
      expect(decision.bucket, 'nothing was asked — the 폭주 pool answers').toBe('overload');
      expect(decision.because.length, 'a fixed bubble still attributes (INV-3)').toBeGreaterThan(0);
    }
    // Fixed bubble: the same line, turn after turn.
    const lines = await bubbleOf(page, 'garrett')
      .locator('.dc-bubble__say')
      .evaluateAll((nodes) => nodes.map((n) => n.textContent ?? ''));
    expect(new Set(lines).size, 'the 폭주 line is fixed').toBe(1);

    // And the party is still fighting around him — no error text anywhere.
    const copy = await page.evaluate(() => document.body.innerText);
    expect(NOISE.test(copy), `noise on screen: ${copy}`).toBe(false);
    expectClean(w);
  });

  test('silent: a forced timeout renders … + the 직업 기본 행동 with no error text (INV-7)', async ({
    page,
  }) => {
    const w = watch(page);
    await open(page, '?scenario=silent');
    await start(page);
    await drain(page);

    const after = await readFixture(page);
    const first = after.turns[0];
    expect(first, 'a timed-out party still takes its turn').toBeTruthy();
    expect(first.decisions.map((d) => d.unitId).sort()).toEqual([...AGI_ORDER].sort());

    for (const decision of first.decisions) {
      expect(decision.coerced, `${decision.unitId} must degrade, not answer`).toBe(true);
      expect(decision.actionId, `${decision.unitId} 직업 기본 행동`).toBe(
        CLASS_DEFAULT_ACTION[decision.unitId],
      );
      expect(decision.because.length, 'even a fallback attributes (INV-3)').toBeGreaterThan(0);
    }

    for (const unitId of AGI_ORDER) {
      const say = bubbleOf(page, unitId).first().locator('.dc-bubble__say');
      await expect(say, `${unitId} must say …`).toHaveText('…');
    }

    const copy = await page.evaluate(() => document.body.innerText);
    expect(NOISE.test(copy), `degradation must be silent (INV-7): ${copy}`).toBe(false);
    await expect(page.locator('[role="alert"], [data-testid="combat-error"]')).toHaveCount(0);
    expectClean(w);
  });

  test('victory: the fight hands the reward off as a combat:victory event', async ({ page }) => {
    const w = watch(page);
    const fixture = await open(page, '?scenario=victory');
    expect(fixture.handoffs, 'nothing is announced before the fight').toEqual([]);

    await start(page);
    await drain(page);

    const after = await readFixture(page);
    expect(after.outcome).toBe('victory');
    await expect(page.getByTestId('combat-screen')).toHaveAttribute('data-outcome', 'victory');

    expect(after.handoffs, 'the screen announces exactly once').toHaveLength(1);
    expect(after.handoffs[0].type).toBe('victory');
    expect(after.handoffs[0].tileId).toBe(fixture.tileId);
    expect(after.handoffs[0].rosterId).toBe(fixture.rosterId);

    // Draining a finished fight must not announce a second time.
    await drain(page);
    expect((await readFixture(page)).handoffs).toHaveLength(1);

    const copy = await page.evaluate(() => document.body.innerText);
    expect(NOISE.test(copy), `noise on screen: ${copy}`).toBe(false);
    expectClean(w);
  });

  test('defeat: a total-party KO routes to the defeat screen event', async ({ page }) => {
    const w = watch(page);
    const fixture = await open(page, '?scenario=defeat');

    await start(page);
    await drain(page);

    const after = await readFixture(page);
    expect(after.outcome).toBe('defeat');
    await expect(page.getByTestId('combat-screen')).toHaveAttribute('data-outcome', 'defeat');

    expect(after.handoffs).toHaveLength(1);
    expect(after.handoffs[0].type).toBe('defeat');
    expect(after.handoffs[0].tileId).toBe(fixture.tileId);

    // Every hero is down, and every one of them shows the 쓰러짐 cell (PRD §2.8 row 3).
    for (const unitId of fixture.heroIds) {
      const sprite = spriteOf(page, unitId);
      await expect(sprite, `${unitId} must render 쓰러짐`).toHaveAttribute('data-action', 'down');
      expect(await cellOf(sprite, '--cell-row'), `${unitId} action row`).toBe(ACTION_ROW);
      expect(await cellOf(sprite, '--cell-col'), `${unitId} 쓰러짐 col`).toBe(ACTION_COL.down);
    }

    const copy = await page.evaluate(() => document.body.innerText);
    expect(NOISE.test(copy), `a defeat is drama, not an error (INV-7): ${copy}`).toBe(false);
    expectClean(w);
  });
});

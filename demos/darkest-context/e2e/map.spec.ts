// Behavioral TDD-Red e2e for u14 — the stage/walk screen, chatter, the branch fork
// and the clear/defeat end screens (PRD §2.4 walk + chatter, §2.5 victory/defeat,
// §2.8 dungeon strip + hero sheet rows).
// Playwright, chromium/headless, served from the real build (playwright.config.ts).
//
// Why a harness page and not `/`: index.html, src/main.ts and vite.config.ts are
// frozen for this unit (u15 wires the shell). u1 left the seam — vite.config.ts
// globs `e2e/harness/*/index.html` — so u14 ships its own standalone page and
// edits no shared file.
//
// ─────────────────────────── HARNESS CONTRACT (u14 must build) ───────────────────────────
// Page: e2e/harness/stage/index.html + main.ts → served at /e2e/harness/stage/
// Real data via loadBundledGameData() + the authored chatter pool from
// data/decisions.json, booted as an automated gate: `createRun({ …,
// walkDurationRef: 'walk.testDurationMs' })` so every walk budget is 0 ms.
//
//   Query params (defaults in brackets)
//     ?path=a|b        [a]      which fork the harness auto-picker takes
//     ?branch=auto|hold [auto]  `hold` leaves the fork standing for a spec click
//     ?scenario=clear|defeat [clear]
//     ?walk=auto|manual [auto]  `manual` holds every walk open for inspection
//     ?gauge=<0-100>   [0]      context gauge applied to every hero
//
//   The auto-branch picker and the tile-resolution script live in the HARNESS,
//   never in src/screens/** — the screen only renders what the FSM publishes.
//
//   [data-testid="stage-screen"][data-phase]
//     [data-testid="walk-bg"].dc-walk__bg.slot-bg-dungeon
//         + .dc-walk__bg--scrolling ONLY while data-phase === "walking"
//     [data-testid="walk-unit"][data-unit-id]        one wrapper per party hero
//       [data-testid="walk-hero"][data-unit-id]      the sprite: .slot-hero.sprite-walk
//       [data-testid="walk-tint"][data-unit-id]      overload dressing, .anim-gauge-tint
//       [data-testid="walk-vial"][data-unit-id][data-state]   the u7 vial HUD
//     [data-testid="chatter-bubble"][data-exchange-id]   one per EXCHANGE, 2–3 per walk
//       [data-testid="chatter-line"][data-unit-id]
//     [data-testid="branch-card"][data-tile-id]      exactly 2 while phase === "branch"
//   [data-testid="end-screen"][data-result="clear"|"defeat"]
//     [data-testid="restart"]                        a <button>
//
//   window.__stage = {
//     state: { …RunState, runId: number };   // runId is harness-owned (RunState has none)
//     chatterLog: Array<{ tileIndex: number; ids: string[] }>;   // one entry per walk
//     unitIds: string[];                     // party order
//     completeWalk: () => void;              // only wired under ?walk=manual
//   }
//
// The spec asserts WIRING through that object and through data-* attributes —
// never a Korean copy string.
import { expect, test, type Page } from '@playwright/test';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..'); // demos/darkest-context/

const HARNESS = '/e2e/harness/stage/';

/** The authored graph (data/map.json): t2 is the one fork, t7 the one terminal. */
const START_TILE = 't1';
const FORK_OPTIONS = ['t3a', 't3b'];
const TILES_PER_RUN = 7;

/** tuning.json → chatter.minPerWalk / maxPerWalk. */
const CHATTER_MIN = 2;
const CHATTER_MAX = 3;

/** Anything a player could press. INV-1: on these screens all of it must be <button>. */
const INTERACTIVE =
  'button, input, select, textarea, a[href], [role="button"], [role="link"], ' +
  '[tabindex], [contenteditable="true"]';

/** The native form controls PRD §4-1 bans outright. */
const NATIVE_FORM = 'input, textarea, select, [contenteditable]';

type Phase = 'idle' | 'walking' | 'tile' | 'branch' | 'clear' | 'defeat';

interface StageState {
  seed: number;
  phase: Phase;
  tileId: string;
  visited: string[];
  party: Array<{ unitId: string; hp: number }>;
  branchOptions: string[];
  /** Harness-owned run counter — `restart` must bump it (RunState carries no runId). */
  runId: number;
}

interface ChatterLogEntry {
  tileIndex: number;
  ids: string[];
}

interface StageFixture {
  state: StageState;
  chatterLog: ChatterLogEntry[];
  unitIds: string[];
  completeWalk: () => void;
}

declare global {
  interface Window {
    __stage?: StageFixture;
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

function expectClean(w: Watchers, where: string): void {
  expect(w.pageErrors, `${where} — page errors: ${w.pageErrors.join(' | ')}`).toEqual([]);
  expect(w.consoleErrors, `${where} — console errors: ${w.consoleErrors.join(' | ')}`).toEqual([]);
}

/**
 * Loads the harness and waits for the published fixture.
 *
 * `vite preview` serves the SPA fallback for an unbuilt page, so a missing
 * harness answers 200 with the demo home — the fixture probe, not the status
 * code, is what actually proves the page exists.
 */
async function open(page: Page, query = ''): Promise<void> {
  const response = await page.goto(`${HARNESS}${query}`);
  expect(response, 'no navigation response').toBeTruthy();
  expect(
    response!.ok(),
    `harness status ${response!.status()} — e2e/harness/stage/index.html is not built`,
  ).toBeTruthy();
  const booted = await page
    .waitForFunction(() => window.__stage !== undefined, undefined, { timeout: 10_000 })
    .then(() => true)
    .catch(() => false);
  expect(
    booted,
    `window.__stage was never published for ${HARNESS}${query} — the stage harness page is missing`,
  ).toBe(true);
}

const readState = (page: Page): Promise<StageState> =>
  page.evaluate(() => window.__stage!.state) as Promise<StageState>;

const readChatterLog = (page: Page): Promise<ChatterLogEntry[]> =>
  page.evaluate(() => window.__stage!.chatterLog) as Promise<ChatterLogEntry[]>;

const readUnitIds = (page: Page): Promise<string[]> =>
  page.evaluate(() => window.__stage!.unitIds) as Promise<string[]>;

const completeWalk = (page: Page): Promise<void> =>
  page.evaluate(() => {
    window.__stage!.completeWalk();
  });

/**
 * Drives a `?walk=manual` run to a terminal phase without touching a clock:
 * every advance is an explicit event hand-back, exactly like INV-6 demands.
 */
async function driveToEnd(page: Page, maxSteps = 24): Promise<StageState> {
  for (let step = 0; step < maxSteps; step += 1) {
    const state = await readState(page);
    if (state.phase === 'clear' || state.phase === 'defeat') return state;
    if (state.phase === 'walking') {
      await completeWalk(page);
      continue;
    }
    if (state.phase === 'branch') {
      await page.getByTestId('branch-card').first().click();
      continue;
    }
    await page.waitForTimeout(20);
  }
  throw new Error(`run never reached clear/defeat within ${maxSteps} steps`);
}

/** INV-1 half of the membrane: no typing surface, and every control is a button. */
async function expectMembrane(page: Page, where: string): Promise<void> {
  const screens = page.locator('[data-testid="stage-screen"], [data-testid="end-screen"]');
  expect(await screens.count(), `${where}: no stage/end screen mounted to inspect`).toBeGreaterThan(
    0,
  );
  await expect(
    screens.locator(NATIVE_FORM),
    `${where}: a native form control reached the screen (PRD §4-1)`,
  ).toHaveCount(0);
  const tags = await screens
    .locator(INTERACTIVE)
    .evaluateAll((nodes) => nodes.map((n) => (n as HTMLElement).tagName.toLowerCase()));
  expect(tags.filter((t) => t !== 'button'), `${where}: non-button control(s)`).toEqual([]);
}

test.describe('stage screen', () => {
  // ── A1 ───────────────────────────────────────────────────────────────────────
  test('the harness boots the walk screen with zero console and page errors', async ({ page }) => {
    const w = watch(page);
    await open(page, '?walk=manual');

    await expect(page.getByTestId('stage-screen')).toBeVisible();
    const unitIds = await readUnitIds(page);
    expect(unitIds.length, 'no party published by the harness').toBeGreaterThan(0);

    const state = await readState(page);
    expect(state.tileId).toBe(START_TILE);
    expect(state.visited).toEqual([]);

    expectClean(w, 'boot');
  });

  // ── A2 ───────────────────────────────────────────────────────────────────────
  test('the scripted a-route reaches the clear screen after 7 tiles', async ({ page }) => {
    const w = watch(page);
    await open(page, '?path=a');

    const end = page.getByTestId('end-screen');
    await expect(end).toBeVisible();
    await expect(end).toHaveAttribute('data-result', 'clear');

    const state = await readState(page);
    expect(state.phase).toBe('clear');
    expect(state.visited).toHaveLength(TILES_PER_RUN);
    expect(state.visited[0]).toBe(START_TILE);
    expect(state.visited).toContain('t3a');
    expect(state.visited).not.toContain('t3b');

    expectClean(w, 'clear route');
  });

  // ── A3 ───────────────────────────────────────────────────────────────────────
  test('the defeat scenario reaches the defeat screen with the whole party at 0 HP', async ({
    page,
  }) => {
    const w = watch(page);
    await open(page, '?scenario=defeat');

    const end = page.getByTestId('end-screen');
    await expect(end).toBeVisible();
    await expect(end).toHaveAttribute('data-result', 'defeat');

    const state = await readState(page);
    expect(state.phase).toBe('defeat');
    expect(state.party.length, 'no party to wipe').toBeGreaterThan(0);
    expect(state.party.every((unit) => unit.hp <= 0), 'defeat with a hero still standing').toBe(
      true,
    );
    expect(state.visited.length, 'defeat cut the run short').toBeLessThan(TILES_PER_RUN);

    expectClean(w, 'defeat route');
  });

  // ── A4 ───────────────────────────────────────────────────────────────────────
  test('walk: the dungeon strip scrolls while the party is walking, and only then', async ({
    page,
  }) => {
    await open(page, '?walk=manual');

    await expect(page.getByTestId('stage-screen')).toHaveAttribute('data-phase', 'walking');
    const bg = page.getByTestId('walk-bg');
    await expect(bg).toBeVisible();
    await expect(bg, 'the strip must consume the u7 asset slot').toHaveClass(/slot-bg-dungeon/);

    const animation = await bg.evaluate((el) => {
      const style = getComputedStyle(el);
      return { name: style.animationName, timing: style.animationTimingFunction };
    });
    expect(animation.name, 'background strip is not animated').not.toBe('none');
    expect(animation.name).toContain('bg-scroll');

    // Held at the fork the strip stands still — scrolling is a walking-phase state.
    await open(page, '?branch=hold');
    await expect(page.getByTestId('branch-card')).toHaveCount(2);
    const parked = page.getByTestId('walk-bg');
    if ((await parked.count()) > 0) {
      await expect(parked).not.toHaveClass(/dc-walk__bg--scrolling/);
    }
  });

  // ── A5 ───────────────────────────────────────────────────────────────────────
  test('walk: every hero sprite runs the steps(4) sprite-walk cycle', async ({ page }) => {
    await open(page, '?walk=manual');
    const unitIds = await readUnitIds(page);

    const heroes = page.locator('[data-testid="walk-hero"][data-unit-id]');
    await expect(heroes).toHaveCount(unitIds.length);
    expect(
      await heroes.evaluateAll((nodes) => nodes.map((n) => (n as HTMLElement).dataset.unitId)),
    ).toEqual(unitIds);

    const styles = await heroes.evaluateAll((nodes) =>
      nodes.map((node) => {
        const style = getComputedStyle(node as HTMLElement);
        return {
          unitId: (node as HTMLElement).dataset.unitId,
          className: (node as HTMLElement).className,
          animationName: style.animationName,
          timing: style.animationTimingFunction,
          cellRow: style.getPropertyValue('--cell-row').trim(),
        };
      }),
    );
    expect(styles.length).toBe(unitIds.length);
    for (const hero of styles) {
      expect(hero.className, `${hero.unitId}: missing .sprite-walk`).toMatch(/\bsprite-walk\b/);
      expect(hero.animationName, `${hero.unitId}: wrong walk cycle`).toBe('sprite-walk');
      expect(hero.timing, `${hero.unitId}: not a 4-step cycle`).toMatch(/steps\(4/);
      expect(hero.cellRow, `${hero.unitId}: not on the walk sheet row`).toBe('0');
    }
  });

  // ── A6 ───────────────────────────────────────────────────────────────────────
  test('walk: the party runs in place — no hero translates across the stage', async ({ page }) => {
    await open(page, '?walk=manual');
    const heroes = page.locator('[data-testid="walk-hero"][data-unit-id]');
    const count = await heroes.count();
    expect(count, 'no hero sprites to sample').toBeGreaterThan(0);

    const sample = async (): Promise<number[]> => {
      const boxes: number[] = [];
      for (let i = 0; i < count; i += 1) {
        const box = await heroes.nth(i).boundingBox();
        expect(box, `hero ${i} has no box`).toBeTruthy();
        boxes.push(Math.round(box!.x));
      }
      return boxes;
    };

    const first = await sample();
    await page.waitForTimeout(500);
    const second = await sample();
    expect(second, 'a hero drifted across the stage during a held walk').toEqual(first);

    const transforms = await heroes.evaluateAll((nodes) =>
      nodes.map((n) => getComputedStyle(n as HTMLElement).transform),
    );
    for (const transform of transforms) {
      if (transform === 'none' || transform === '') continue;
      const numbers = transform.replace(/^\w+\(|\)$/g, '').split(',').map(Number);
      const translateX = numbers.length === 6 ? numbers[4] : numbers[12];
      expect(Math.abs(translateX ?? 0), `hero carries an X translation: ${transform}`).toBeLessThan(
        1,
      );
    }
  });

  // ── A7 ───────────────────────────────────────────────────────────────────────
  test('walk: a high gauge is a tint/shake overlay plus a vial, never a second sprite row', async ({
    page,
  }) => {
    await open(page, '?walk=manual&gauge=85');
    const unitIds = await readUnitIds(page);

    const units = page.locator('[data-testid="walk-unit"][data-unit-id]');
    await expect(units).toHaveCount(unitIds.length);

    for (const unitId of unitIds) {
      const unit = page.locator(`[data-testid="walk-unit"][data-unit-id="${unitId}"]`);
      await expect(unit, `${unitId}: no overload dressing on the wrapper`).toHaveClass(
        /dc-walk__unit--overload/,
      );
      await expect(
        unit.locator('[data-testid="walk-tint"].anim-gauge-tint'),
        `${unitId}: the u7 gauge tint is missing`,
      ).toHaveCount(1);
      await expect(
        page.locator(`[data-testid="walk-vial"][data-unit-id="${unitId}"]`),
        `${unitId}: no vial HUD`,
      ).toHaveAttribute('data-state', 'limit');
    }

    // The sprite itself never changes sheet row — the walk cycle is the only frame source.
    const rowsAtStart = await page
      .locator('[data-testid="walk-hero"][data-unit-id]')
      .evaluateAll((nodes) =>
        nodes.map((n) => getComputedStyle(n as HTMLElement).getPropertyValue('--cell-row').trim()),
      );
    await page.waitForTimeout(400);
    const rowsLater = await page
      .locator('[data-testid="walk-hero"][data-unit-id]')
      .evaluateAll((nodes) =>
        nodes.map((n) => ({
          row: getComputedStyle(n as HTMLElement).getPropertyValue('--cell-row').trim(),
          animationName: getComputedStyle(n as HTMLElement).animationName,
        })),
      );
    expect(rowsAtStart.every((row) => row === '0'), 'a high gauge moved the sprite off row 0').toBe(
      true,
    );
    for (const hero of rowsLater) {
      expect(hero.row, 'the walking sprite switched sheet rows at high gauge').toBe('0');
      expect(hero.animationName, 'the walk cycle was swapped out at high gauge').toBe('sprite-walk');
    }
    expect(await readState(page).then((s) => s.phase)).toBe('walking');
  });

  // ── A8 ───────────────────────────────────────────────────────────────────────
  test('chatter: one walk plays 2 to 3 canned exchanges', async ({ page }) => {
    const w = watch(page);
    await open(page, '?walk=manual');

    const bubbles = page.getByTestId('chatter-bubble');
    const count = await bubbles.count();
    expect(count, 'chatter is below the authored minimum').toBeGreaterThanOrEqual(CHATTER_MIN);
    expect(count, 'chatter is above the authored maximum').toBeLessThanOrEqual(CHATTER_MAX);

    const exchangeIds = await bubbles.evaluateAll((nodes) =>
      nodes.map((n) => (n as HTMLElement).dataset.exchangeId),
    );
    expect(exchangeIds.every((id) => typeof id === 'string' && id.length > 0)).toBe(true);
    expect(new Set(exchangeIds).size, 'the same exchange played twice in one walk').toBe(count);

    // Every exchange speaks: at least one attributed line per bubble.
    for (let i = 0; i < count; i += 1) {
      const lines = bubbles.nth(i).locator('[data-testid="chatter-line"][data-unit-id]');
      expect(await lines.count(), `exchange ${exchangeIds[i]} rendered no lines`).toBeGreaterThan(0);
    }

    const log = await readChatterLog(page);
    expect(log[0]?.tileIndex, 'the first walk is tile index 0').toBe(0);
    expect(log[0]?.ids, 'the log disagrees with the DOM').toEqual(exchangeIds);

    expectClean(w, 'chatter walk');
  });

  // ── A9 ───────────────────────────────────────────────────────────────────────
  test('chatter: two independent runs pick the same exchanges for the same tile index', async ({
    page,
  }) => {
    await open(page, '?path=a');
    await expect(page.getByTestId('end-screen')).toBeVisible();
    const first = await readChatterLog(page);

    expect(first, 'no chatter was logged for a full run').toHaveLength(TILES_PER_RUN);
    expect(first.map((entry) => entry.tileIndex)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    for (const entry of first) {
      expect(entry.ids.length, `tile ${entry.tileIndex}: too few exchanges`).toBeGreaterThanOrEqual(
        CHATTER_MIN,
      );
      expect(entry.ids.length, `tile ${entry.tileIndex}: too many exchanges`).toBeLessThanOrEqual(
        CHATTER_MAX,
      );
    }

    // A second, independent page load of the same route.
    await open(page, '?path=a');
    await expect(page.getByTestId('end-screen')).toBeVisible();
    const second = await readChatterLog(page);

    expect(second, 'chatter is not deterministic across runs').toEqual(first);
  });

  // ── A10 ──────────────────────────────────────────────────────────────────────
  test('branch: the fork offers exactly two cards and clicking one takes that route', async ({
    page,
  }) => {
    const w = watch(page);
    await open(page, '?branch=hold');

    await expect(page.getByTestId('stage-screen')).toHaveAttribute('data-phase', 'branch');
    const cards = page.getByTestId('branch-card');
    await expect(cards, 'a fork is a two-card choice, nothing else').toHaveCount(2);

    const held = await readState(page);
    expect(held.phase).toBe('branch');
    expect(held.branchOptions).toEqual(FORK_OPTIONS);

    const tileIds = await cards.evaluateAll((nodes) =>
      nodes.map((n) => (n as HTMLElement).dataset.tileId),
    );
    expect(tileIds, 'cards do not name the authored fork tiles').toEqual(FORK_OPTIONS);
    expect(
      await cards.evaluateAll((nodes) => nodes.map((n) => (n as HTMLElement).tagName.toLowerCase())),
      'a branch card must be a button (INV-1)',
    ).toEqual(['button', 'button']);

    // Take the b-fork — the route not exercised by A2.
    await page.locator('[data-testid="branch-card"][data-tile-id="t3b"]').click();
    await expect(page.getByTestId('branch-card')).toHaveCount(0);

    const after = await readState(page);
    expect(after.phase, 'the fork survived the choice').not.toBe('branch');
    expect(after.branchOptions, 'branch options linger after the choice').toEqual([]);
    expect(after.visited, 'the chosen fork was not walked').toContain('t3b');
    expect(after.visited).not.toContain('t3a');

    expectClean(w, 'branch choice');
  });

  // ── A11 ──────────────────────────────────────────────────────────────────────
  test('membrane: every control is a button and no native form control ever appears', async ({
    page,
  }) => {
    await open(page, '?walk=manual');
    await expectMembrane(page, 'walking');

    await open(page, '?branch=hold');
    await expect(page.getByTestId('branch-card')).toHaveCount(2);
    await expectMembrane(page, 'fork');

    await page.getByTestId('branch-card').first().click();
    await expect(page.getByTestId('end-screen')).toHaveAttribute('data-result', 'clear');
    await expectMembrane(page, 'clear end screen');

    await open(page, '?scenario=defeat');
    await expect(page.getByTestId('end-screen')).toHaveAttribute('data-result', 'defeat');
    await expectMembrane(page, 'defeat end screen');
  });

  // ── A12a ─────────────────────────────────────────────────────────────────────
  test('clear: restart from the victory screen returns to a fresh run start', async ({ page }) => {
    const w = watch(page);
    await open(page, '?walk=manual&path=a');
    const finished = await driveToEnd(page);
    expect(finished.phase).toBe('clear');

    const end = page.getByTestId('end-screen');
    await expect(end).toHaveAttribute('data-result', 'clear');
    const restart = page.getByTestId('restart');
    expect(
      await restart.evaluate((el) => (el as HTMLElement).tagName.toLowerCase()),
      'restart must be a button (INV-1)',
    ).toBe('button');

    await restart.click();
    await expect(page.getByTestId('end-screen'), 'the end screen outlived the restart').toHaveCount(
      0,
    );

    const fresh = await readState(page);
    expect(fresh.runId, 'restart did not begin a new run').toBe(finished.runId + 1);
    expect(fresh.visited, 'restart kept the old trail').toEqual([]);
    expect(fresh.tileId).toBe(START_TILE);
    expect(fresh.branchOptions).toEqual([]);
    expect(['idle', 'walking'], `restart landed in '${fresh.phase}'`).toContain(fresh.phase);
    await expect(page.getByTestId('stage-screen')).toBeVisible();

    expectClean(w, 'clear → restart');
  });

  // ── A12b ─────────────────────────────────────────────────────────────────────
  test('defeat: restart from the wipe screen returns to a fresh run start', async ({ page }) => {
    const w = watch(page);
    await open(page, '?walk=manual&scenario=defeat');
    const finished = await driveToEnd(page);
    expect(finished.phase).toBe('defeat');

    await expect(page.getByTestId('end-screen')).toHaveAttribute('data-result', 'defeat');
    await page.getByTestId('restart').click();
    await expect(page.getByTestId('end-screen')).toHaveCount(0);

    const fresh = await readState(page);
    expect(fresh.runId).toBe(finished.runId + 1);
    expect(fresh.visited).toEqual([]);
    expect(fresh.tileId).toBe(START_TILE);
    expect(
      fresh.party.some((unit) => unit.hp > 0),
      'a restarted party is still wiped',
    ).toBe(true);
    expect(['idle', 'walking'], `restart landed in '${fresh.phase}'`).toContain(fresh.phase);

    expectClean(w, 'defeat → restart');
  });
});

// ───────────────────────── source guards (INV-6, PRD §2.8) ─────────────────────────
// Static, filesystem-only checks. They fail loudly when the files are absent, so
// neither guard can go vacuously green.

const stripComments = (s: string): string =>
  s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

const walkDir = (dir: string): string[] => {
  let out: string[] = [];
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out = out.concat(walkDir(full));
    else if (/\.(ts|tsx|mts|cts|js|jsx|mjs|cjs)$/.test(entry.name)) out.push(full);
  }
  return out;
};

test.describe('stage source', () => {
  test('walk: the stage and end screens schedule nothing and roll nothing (INV-6)', async () => {
    const dirs = ['src/screens/stage', 'src/screens/end'];
    for (const dir of dirs) {
      expect(existsSync(join(root, dir)), `missing ${dir}`).toBe(true);
    }
    const files = dirs.flatMap((dir) => walkDir(join(root, dir)));
    expect(files.length, 'nothing was scanned — the guard would be vacuous').toBeGreaterThan(0);

    const banned = /\bsetTimeout\b|\bsetInterval\b|\brequestAnimationFrame\b|Date\.now|performance\.now|Math\.random/;
    const hits: string[] = [];
    for (const file of files) {
      const src = stripComments(readFileSync(file, 'utf8'));
      const found = src.match(new RegExp(banned, 'g'));
      if (found) hits.push(`${relative(root, file).split('\\').join('/')}: ${found.join(', ')}`);
    }
    expect(hits, 'a walk must advance on an event, never on a clock').toEqual([]);
  });

  test('walk: stage.css scrolls the background and never translates a hero', async () => {
    const cssPath = join(root, 'src/styles/stage.css');
    expect(existsSync(cssPath), 'missing src/styles/stage.css').toBe(true);
    const css = stripComments(readFileSync(cssPath, 'utf8'));

    const scroll = /@keyframes\s+bg-scroll\s*\{([\s\S]*?)\n\}/.exec(css);
    expect(scroll, 'no @keyframes bg-scroll — the strip cannot scroll').toBeTruthy();
    expect(scroll![1], 'bg-scroll must move the background, not a box').toMatch(
      /background-position/,
    );

    // Any rule whose selector names a hero/sprite must not move it sideways.
    const offenders: string[] = [];
    const ruleRe = /([^{}]+)\{([^{}]*)\}/g;
    let rule: RegExpExecArray | null;
    while ((rule = ruleRe.exec(css)) !== null) {
      const selector = rule[1].trim();
      if (selector.startsWith('@')) continue;
      if (!/hero|sprite|walk-unit/i.test(selector)) continue;
      if (/translateX|translate3d|margin-left|(^|[;\s])left\s*:/i.test(rule[2])) {
        offenders.push(selector);
      }
    }
    expect(offenders, 'heroes run in place — the background moves, they do not').toEqual([]);
  });
});

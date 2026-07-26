// Behavioral TDD-Red e2e for u15 — the COMPOSED app at `/`: routes into the u1 shell,
// one boot decision, and one continuous playable run (PRD §1, §2.2, §2.4, §2.5, §7).
// Playwright, chromium/headless, served from the real build (playwright.config.ts).
//
// Unlike every earlier unit, this spec drives `/` itself: u15 is the unit that owns
// index.html's entry, src/main.ts, src/app/routes.ts and src/app/boot-app.ts, so there
// is no harness page — the thing under test IS the shipped page.
//
// ─────────────────────────── APP CONTRACT (u15 must build) ───────────────────────────
// Page: `/` (index.html → src/main.ts → bootApp)
//
//   Query params — read ONLY by src/app/boot-app.ts (never by a screen), all gate-only:
//     ?gate=1                  automated-gate boot: stub adapter, latency 0, tieBreak
//                              `index`, walkDurationRef 'walk.testDurationMs' (0 ms),
//                              and `window.__app` published. WITHOUT it the page boots
//                              at default tunables and publishes NO test seam.
//     ?scenario=defeat         (gate only) party HP seeded to 1 so T1 wipes the party
//     ?seed=<int>              (gate only) replay seed handed to boot
//
//   Screens are mounted through the u1 registry into [data-testid="screen-slot"], one at
//   a time. Registered ids: stage · combat · training · council · rest · end.
//   Their DOM is each screen unit's own (u10/u11/u12/u14) and is asserted here only where
//   composition is what's being proved.
//
//   window.__app  (present only under ?gate=1)
//     mode:       'stub' | 'live'                 chosen ONCE per page load
//     tieBreak:   'index' | 'random'              chosen with the mode, never separately
//     bootCount:  number                          how many times boot ran — always 1
//     screenIds:  string[]                        the shell registry contents
//     mounted:    string | null                   live getter: screen id in the slot now
//     state:      { phase, tileId, visited: string[], party: {unitId,hp}[] }   live getter
//     loadout:    Record<string, string[]>        live getter: unitId → equipped card ids
//     drain():    Promise<void>                   plays every ENGINE-driven beat pending
//                 (walk, combat turns, council round) and resolves when the app is waiting
//                 on a player click, or when the run reaches clear/defeat. It never clicks
//                 a player verb — 분기/드래프트/장착/휴식/재시작 stay the spec's job (§1-6).
//
// The spec asserts WIRING through that object and through data attributes — never a
// Korean copy string. The only Korean below is the INV-7 negative match.
import { expect, test, type Page } from '@playwright/test';

const GATE = '/?gate=1';

/** INV-7: none of this may reach the player on a degraded path. */
const NOISE = /경고|오류|실패|없습니다|타임아웃|warn|error|fail|timeout/i;

/** PRD §2.4 — the two 7-tile routes through the fixed map. */
const PATH_A = ['t1', 't2', 't3a', 't4a', 't5', 't6', 't7'];
const PATH_B = ['t1', 't2', 't3b', 't4b', 't5', 't6', 't7'];

/** data/council.json rewards — T1 pays a fixed card, T2 fans out three. */
const T1_FIXED_CARD = 'taunt';
const T2_DRAFT = ['fearless', 'gambler', 'translation_lens'];

interface AppState {
  phase: string;
  tileId: string;
  visited: string[];
  party: { unitId: string; hp: number }[];
}

declare global {
  interface Window {
    __app?: {
      mode: string;
      tieBreak: string;
      bootCount: number;
      screenIds: string[];
      mounted: string | null;
      state: AppState;
      loadout: Record<string, string[]>;
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

function expectQuiet(w: Watchers): void {
  expect(w.pageErrors, `page errors: ${w.pageErrors.join(' | ')}`).toEqual([]);
  expect(w.consoleErrors, `console errors: ${w.consoleErrors.join(' | ')}`).toEqual([]);
}

const mounted = (page: Page): Promise<string | null> =>
  page.evaluate(() => window.__app?.mounted ?? null);

const state = (page: Page): Promise<AppState> =>
  page.evaluate(() => window.__app!.state);

const loadout = (page: Page): Promise<Record<string, string[]>> =>
  page.evaluate(() => window.__app!.loadout);

const drain = (page: Page): Promise<void> => page.evaluate(() => window.__app!.drain());

/** Waits for the composition to put `id` in the slot — never a wall-clock sleep. */
async function waitForScreen(page: Page, id: string): Promise<void> {
  await expect
    .poll(() => mounted(page), { message: `screen '${id}' never mounted` })
    .toBe(id);
}

/** The two player clicks of a card grant: pick the card, then aim it at a unit (§2.3). */
async function grantCardTo(page: Page, cardId: string, unitId: string): Promise<void> {
  await page.locator(`[data-testid="draft-row"] [data-card-id="${cardId}"]`).click();
  await page.locator(`[data-testid="target-picker"] [data-unit-id="${unitId}"]`).click();
  await page.getByTestId('training-done').click();
}

test.describe('composed app at /', () => {
  test('plays one continuous run T1 → T7 clear with zero console errors', async ({ page }) => {
    const w = watch(page);
    await page.goto(GATE);

    await expect(page.getByTestId('app-shell')).toBeVisible();
    await expect(page.getByTestId('screen-slot')).toBeAttached();

    // T1 전투 — the run opens on the fight, not on a menu.
    await waitForScreen(page, 'combat');
    await expect(page.getByTestId('combat-screen')).toHaveAttribute('data-tile-id', 't1');
    await drain(page);
    await expect(page.getByTestId('combat-screen')).toHaveAttribute('data-outcome', 'victory');

    // T1 reward — the fixed 「도발」 grant is assigned before the party walks on.
    await waitForScreen(page, 'training');
    await grantCardTo(page, T1_FIXED_CARD, 'garrett');

    // T2 훈련장 — the 3택1 draft.
    await drain(page);
    await waitForScreen(page, 'training');
    await grantCardTo(page, 'fearless', 'fiona');

    // Branch — the run's single player input point (PRD §2.4).
    await drain(page);
    await waitForScreen(page, 'stage');
    await expect(page.getByTestId('branch-card')).toHaveCount(2);
    await page.locator('[data-testid="branch-card"][data-tile-id="t3a"]').click();

    // T3a 퍼즐 → T4a 훈련장.
    await drain(page);
    await waitForScreen(page, 'council');
    await expect(page.getByTestId('council-screen')).toHaveAttribute('data-agenda-id', 'riddle_golem');
    await page.getByTestId('council-done').click();

    await drain(page);
    await waitForScreen(page, 'training');
    await grantCardTo(page, 'grudge', 'garrett');

    // T5 전투 → its draft → T6 휴식 → T7 최종 전투.
    await drain(page);
    await waitForScreen(page, 'combat');
    await expect(page.getByTestId('combat-screen')).toHaveAttribute('data-tile-id', 't5');
    await drain(page);

    await waitForScreen(page, 'training');
    await grantCardTo(page, 'dual_slash', 'selene');

    await drain(page);
    await waitForScreen(page, 'rest');
    await page.getByTestId('rest-option-think').click();
    await page.getByTestId('rest-done').click();

    await drain(page);
    await waitForScreen(page, 'combat');
    await expect(page.getByTestId('combat-screen')).toHaveAttribute('data-tile-id', 't7');
    await drain(page);

    // Clear.
    await waitForScreen(page, 'end');
    await expect(page.getByTestId('end-screen')).toHaveAttribute('data-result', 'clear');
    const final = await state(page);
    expect(final.phase).toBe('clear');
    expect(final.visited).toEqual(PATH_A);

    expectQuiet(w);
  });

  test('mounts through the shell registry — one screen in the slot at a time', async ({ page }) => {
    await page.goto(GATE);
    await waitForScreen(page, 'combat');

    const registry = await page.evaluate(() => window.__app!.screenIds);
    expect(registry.sort()).toEqual(['combat', 'council', 'end', 'rest', 'stage', 'training']);

    const slot = page.getByTestId('screen-slot');
    await expect(slot.locator(':scope > *')).toHaveCount(1);
    expect(registry).toContain(await mounted(page));

    // The shell chrome survives every swap: screens live in the slot, not in #app.
    await drain(page);
    await waitForScreen(page, 'training');
    await expect(page.getByTestId('app-shell')).toBeVisible();
    await expect(slot.locator(':scope > *')).toHaveCount(1);
    expect(registry).toContain(await mounted(page));
  });

  test('boots once: mode and tie-break policy are one decision', async ({ page }) => {
    await page.goto(GATE);
    await waitForScreen(page, 'combat');

    const boot = await page.evaluate(() => ({
      mode: window.__app!.mode,
      tieBreak: window.__app!.tieBreak,
      bootCount: window.__app!.bootCount,
    }));
    expect(boot.bootCount).toBe(1);
    expect(boot.mode).toBe('stub');
    expect(boot.tieBreak).toBe('index');
  });

  test('publishes no test seam on the shipped page (no ?gate)', async ({ page }) => {
    const w = watch(page);
    await page.goto('/');
    await expect(page.getByTestId('app-shell')).toBeVisible();
    expect(await page.evaluate(() => window.__app === undefined)).toBe(true);
    expectQuiet(w);
  });

  test('at default tunables the first combat is on screen within 60s (PRD §1-3)', async ({
    page,
  }) => {
    test.setTimeout(120_000);
    const started = Date.now();
    await page.goto('/');
    await expect(page.getByTestId('combat-screen')).toBeVisible({ timeout: 60_000 });
    expect(Date.now() - started).toBeLessThan(60_000);
  });

  test('keeps the membrane closed across composed phases (INV-1)', async ({ page }) => {
    await page.goto(GATE);
    await waitForScreen(page, 'combat');
    const controls = 'input, textarea, select, [contenteditable="true"]';
    await expect(page.locator(controls)).toHaveCount(0);

    await drain(page);
    await waitForScreen(page, 'training');
    await expect(page.locator(controls)).toHaveCount(0);
  });

  test('rewards: T1 fixed grant → T2 3택1 → the equipped card shows in the sheet and fires later', async ({
    page,
  }) => {
    const w = watch(page);
    await page.goto(GATE);

    // T1 pays exactly one authored card — no draft, no choice of card.
    await waitForScreen(page, 'combat');
    await drain(page);
    await waitForScreen(page, 'training');
    const t1Cards = page.locator('[data-testid="draft-row"] [data-card-id]');
    await expect(t1Cards).toHaveCount(1);
    await expect(t1Cards.first()).toHaveAttribute('data-card-id', T1_FIXED_CARD);
    await grantCardTo(page, T1_FIXED_CARD, 'garrett');
    expect((await loadout(page)).garrett).toContain(T1_FIXED_CARD);

    // T2 fans out the three authored options, in data order (no shuffle).
    await drain(page);
    await waitForScreen(page, 'training');
    const t2Cards = page.locator('[data-testid="draft-row"] [data-card-id]');
    await expect(t2Cards).toHaveCount(3);
    expect(
      await t2Cards.evaluateAll((nodes) =>
        nodes.map((n) => (n as HTMLElement).dataset.cardId ?? ''),
      ),
    ).toEqual(T2_DRAFT);

    await grantCardTo(page, 'translation_lens', 'selene');
    expect((await loadout(page)).selene).toContain('translation_lens');

    // The card changes a LATER branch: 「번역 렌즈」 reveals the puzzle hint (PRD §2.6).
    await drain(page);
    await waitForScreen(page, 'stage');
    await page.locator('[data-testid="branch-card"][data-tile-id="t3a"]').click();
    await drain(page);
    await waitForScreen(page, 'council');
    const hint = page.getByTestId('council-hint');
    await expect(hint).toBeVisible();
    await expect(hint).toHaveAttribute('data-card-id', 'translation_lens');
    await expect(hint).toHaveAttribute('data-unit-id', 'selene');
    await page.getByTestId('council-done').click();

    // …and it is visible on the unit's own sheet at the next fight (PRD §2.3, INV-3).
    await drain(page);
    await waitForScreen(page, 'training');
    await grantCardTo(page, 'grudge', 'garrett');
    await drain(page);
    await waitForScreen(page, 'combat');
    await expect(
      page.locator('[data-testid="unit-sheet"][data-unit-id="selene"] [data-item-id="translation_lens"]'),
    ).toHaveCount(1);

    expectQuiet(w);
  });

  test('rewards: without 「번역 렌즈」 the T3a hint never appears (control)', async ({ page }) => {
    await page.goto(GATE);
    await waitForScreen(page, 'combat');
    await drain(page);
    await waitForScreen(page, 'training');
    await grantCardTo(page, T1_FIXED_CARD, 'garrett');

    await drain(page);
    await waitForScreen(page, 'training');
    await grantCardTo(page, 'fearless', 'fiona');

    await drain(page);
    await waitForScreen(page, 'stage');
    await page.locator('[data-testid="branch-card"][data-tile-id="t3a"]').click();
    await drain(page);
    await waitForScreen(page, 'council');

    await expect(page.getByTestId('council-screen')).toBeVisible();
    await expect(page.getByTestId('council-hint')).toHaveCount(0);
    // INV-7: the absent hint is silent — no notice, no apology.
    await expect(page.getByTestId('council-screen')).not.toHaveText(NOISE);
  });

  test('path-b: T3b 쓰러진 상인 → T4b 휴식 composes to clear as well', async ({ page }) => {
    const w = watch(page);
    await page.goto(GATE);

    await waitForScreen(page, 'combat');
    await drain(page);
    await waitForScreen(page, 'training');
    await grantCardTo(page, T1_FIXED_CARD, 'garrett');

    await drain(page);
    await waitForScreen(page, 'training');
    await grantCardTo(page, 'gambler', 'selene');

    // The other arm of the fork.
    await drain(page);
    await waitForScreen(page, 'stage');
    await page.locator('[data-testid="branch-card"][data-tile-id="t3b"]').click();

    await drain(page);
    await waitForScreen(page, 'council');
    await expect(page.getByTestId('council-screen')).toHaveAttribute(
      'data-agenda-id',
      'fallen_merchant',
    );
    const tally = page.getByTestId('council-tally');
    await expect(tally).toBeVisible();
    expect(
      ['op_merchant_save', 'op_merchant_pass'],
      'the merchant vote must land on an authored option',
    ).toContain(await tally.getAttribute('data-winning-option-id'));
    await page.getByTestId('council-done').click();

    // T4b 휴식 — path B's rest tile, reached without a training stop.
    await drain(page);
    await waitForScreen(page, 'rest');
    await page.getByTestId('rest-option-think').click();
    await expect(page.getByTestId('rest-result')).toBeVisible();
    await page.getByTestId('rest-done').click();

    // Rejoin: T5 → its draft → T6 휴식 → T7.
    await drain(page);
    await waitForScreen(page, 'combat');
    await expect(page.getByTestId('combat-screen')).toHaveAttribute('data-tile-id', 't5');
    await drain(page);
    await waitForScreen(page, 'training');
    await grantCardTo(page, 'dual_slash', 'fiona');

    await drain(page);
    await waitForScreen(page, 'rest');
    await page.getByTestId('rest-option-think').click();
    await page.getByTestId('rest-done').click();

    await drain(page);
    await waitForScreen(page, 'combat');
    await expect(page.getByTestId('combat-screen')).toHaveAttribute('data-tile-id', 't7');
    await drain(page);

    await waitForScreen(page, 'end');
    await expect(page.getByTestId('end-screen')).toHaveAttribute('data-result', 'clear');
    expect((await state(page)).visited).toEqual(PATH_B);

    expectQuiet(w);
  });

  test('defeat: a total-party KO ends the run and 재시작 starts a fresh one from T1', async ({
    page,
  }) => {
    const w = watch(page);
    await page.goto(`${GATE}&scenario=defeat`);

    await waitForScreen(page, 'combat');
    await expect(page.getByTestId('combat-screen')).toHaveAttribute('data-tile-id', 't1');
    await drain(page);
    await expect(page.getByTestId('combat-screen')).toHaveAttribute('data-outcome', 'defeat');

    await waitForScreen(page, 'end');
    const end = page.getByTestId('end-screen');
    await expect(end).toHaveAttribute('data-result', 'defeat');
    const wiped = await state(page);
    expect(wiped.phase).toBe('defeat');
    expect(wiped.party.every((u) => u.hp <= 0)).toBe(true);

    // 재시작 — the last player verb of §1-6.
    await page.getByTestId('restart').click();
    await waitForScreen(page, 'combat');
    const fresh = await state(page);
    expect(fresh.tileId).toBe('t1');
    expect(fresh.visited).toEqual([]);
    expect(Object.values(await loadout(page)).flat()).toEqual([]);

    // A restart replays the run, never the boot: mode/policy were chosen once per load.
    expect(await page.evaluate(() => window.__app!.bootCount)).toBe(1);

    expectQuiet(w);
  });

  test('defeat: the wiped run ends silently — no error copy anywhere (INV-7)', async ({ page }) => {
    await page.goto(`${GATE}&scenario=defeat`);
    await waitForScreen(page, 'combat');
    await drain(page);
    await waitForScreen(page, 'end');
    await expect(page.getByTestId('end-screen')).not.toHaveText(NOISE);
  });
});

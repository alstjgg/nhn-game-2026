// Behavioral TDD-Red e2e for u11 — the council tile (퍼즐 수수께끼 골렘 · 선택이벤트 쓰러진 상인).
// Playwright, chromium/headless, served from the real build (playwright.config.ts).
//
// Why a harness page and not `/`: index.html and src/main.ts are u1-owned and frozen for
// this unit. u1 left the seam — vite.config.ts globs `e2e/harness/*/index.html` — so u11
// ships its own standalone page and edits no shared file.
//
// ─────────────────────────── HARNESS CONTRACT (u11 must build) ───────────────────────────
// Page: e2e/harness/council/index.html + main.ts → served at /e2e/harness/council/
// Real data via loadBundledGameData() + the authored stub pool from data/decisions.json,
// booted as an automated gate (stub mode, latency 0, `index` ties).
//
//   Query params
//     ?agenda=riddle_golem | fallen_merchant     default: riddle_golem
//     ?equip=<unitId>:<cardId>                   repeatable — seeds one card on one unit,
//                                                e.g. ?equip=selene:gambler
//
//   The round is HELD until `window.__council.start()` is called. That is the only way to
//   prove "the 번역 렌즈 hint is on screen BEFORE the vote" without racing a timer — and it
//   is a harness affordance, never a player control: nothing in the DOM invokes it.
//
//   [data-testid="council-screen"][data-agenda-id][data-agenda-kind]
//     [data-testid="council-prompt"]              the authored agenda line
//     [data-testid="council-hint"]                PRESENT ONLY when a council-hint card
//         revealed it; rendered before the round starts, and never as a placeholder
//     [data-testid="council-option"][data-option-id][data-related-stat]
//         one per authored option, in data order — CLOSED and inert: no button, no role,
//         no tabindex, nothing the player can press
//     [data-testid="stance-bubble"][data-unit-id][data-option-id]
//         exactly one per party unit after the round; data-option-id is ABSENT on an
//         abstention (INV-7 — silent, never an error line)
//     [data-testid="council-tally"][data-winning-option-id][data-deciding-unit-id]
//         [data-used-tiebreak]   deciding-unit-id absent on a plain majority
//     [data-testid="council-outcome"][data-card-id][data-gauge-all]
//         data-card-id ABSENT when the branch grants no card
//     [data-testid="council-done"]                the ONLY interactive control on the page
//
//   window.__council = {
//     agendaId: string;
//     unitIds: string[];              // party order
//     optionIds: string[];            // council.json option order
//     answerOptionId: string | null;
//     stanceCalls: Array<{ unitId: string; agendaId: string; hintId: string | null }>;
//     grants: Array<{ agendaId; optionId; correct; cardId; gaugeAll }>;  // every
//         `council:grant` CustomEvent the screen emitted — the screen pays out by
//         announcing, and the draft UI that consumes it is u12's
//     start: () => void;
//   }
//
// The spec asserts WIRING through that object — never a Korean copy string. The only place
// Korean appears below is the INV-7 negative match.
import { expect, test, type Page } from '@playwright/test';

const HARNESS = '/e2e/harness/council/';

/** INV-7: none of this may reach the player on a degraded path. */
const NOISE = /경고|오류|실패|없습니다|warn|error|fail/i;

/** Anything a player could press. The council must own exactly one of them. */
const INTERACTIVE =
  'button, input, select, textarea, a[href], [role="button"], [role="radio"], ' +
  '[role="link"], [tabindex], [contenteditable="true"]';

interface StanceCall {
  unitId: string;
  agendaId: string;
  hintId: string | null;
}

interface GrantDetail {
  agendaId: string;
  optionId: string;
  correct: boolean | null;
  cardId: string | null;
  gaugeAll: number;
}

interface CouncilFixture {
  agendaId: string;
  unitIds: string[];
  optionIds: string[];
  answerOptionId: string | null;
  stanceCalls: StanceCall[];
  grants: GrantDetail[];
}

declare global {
  interface Window {
    __council?: CouncilFixture & { start: () => void };
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

/** Loads the harness and returns the published fixture, before the round runs. */
async function open(page: Page, query = ''): Promise<CouncilFixture> {
  const response = await page.goto(`${HARNESS}${query}`);
  expect(response, 'no navigation response').toBeTruthy();
  expect(response!.ok(), `bad status ${response!.status()}`).toBeTruthy();
  await expect(page.getByTestId('council-screen')).toBeVisible();
  const fixture = await page.evaluate(() => window.__council);
  expect(fixture, 'harness does not expose window.__council').toBeTruthy();
  return fixture!;
}

/** Releases the held stance round and waits for the tally to land. */
async function runRound(page: Page): Promise<void> {
  await page.evaluate(() => window.__council?.start());
  await expect(page.getByTestId('council-tally')).toBeAttached();
}

const readFixture = (page: Page): Promise<CouncilFixture> =>
  page.evaluate(() => window.__council) as Promise<CouncilFixture>;

test.describe('council tile', () => {
  test('one round: each unit states a stance exactly once and is never asked again', async ({
    page,
  }) => {
    const w = watch(page);
    const fixture = await open(page);

    // Held: nothing has been asked, nothing has been counted.
    expect(fixture.stanceCalls).toEqual([]);
    await expect(page.getByTestId('stance-bubble')).toHaveCount(0);
    await expect(page.getByTestId('council-tally')).toHaveCount(0);

    await runRound(page);

    const after = await readFixture(page);
    expect(after.stanceCalls).toHaveLength(fixture.unitIds.length);
    expect(after.stanceCalls.map((call) => call.unitId).sort()).toEqual(
      [...fixture.unitIds].sort(),
    );
    expect(
      new Set(after.stanceCalls.map((call) => call.unitId)).size,
      'a unit asked twice would be round 2',
    ).toBe(fixture.unitIds.length);
    await expect(page.getByTestId('stance-bubble')).toHaveCount(fixture.unitIds.length);

    // The tile is over: pressing continue must not restart the debate.
    await page.getByTestId('council-done').click();
    const settled = await readFixture(page);
    expect(settled.stanceCalls).toHaveLength(fixture.unitIds.length);

    expect(w.pageErrors, `page errors: ${w.pageErrors.join(' | ')}`).toEqual([]);
    expect(w.consoleErrors, `console errors: ${w.consoleErrors.join(' | ')}`).toEqual([]);
  });

  test('no intervention: the only control on the page is the continue button', async ({ page }) => {
    const fixture = await open(page);
    const screen = page.getByTestId('council-screen');

    const beforeRound = screen.locator(INTERACTIVE);
    await expect(beforeRound, 'the player may not steer the vote').toHaveCount(1);
    await expect(beforeRound.first()).toHaveAttribute('data-testid', 'council-done');

    await runRound(page);

    const afterRound = screen.locator(INTERACTIVE);
    await expect(afterRound).toHaveCount(1);
    await expect(afterRound.first()).toHaveAttribute('data-testid', 'council-done');

    // The closed options are display, not choices.
    const options = page.getByTestId('council-option');
    await expect(options).toHaveCount(fixture.optionIds.length);
    await expect(options.locator(INTERACTIVE)).toHaveCount(0);
    expect(
      await options.evaluateAll((nodes) =>
        nodes.map((node) => (node as HTMLElement).tagName.toLowerCase()),
      ),
    ).not.toContain('button');
  });

  test('the vote is counted from the stances alone', async ({ page }) => {
    const fixture = await open(page);
    await runRound(page);

    const optionIds = await page
      .getByTestId('council-option')
      .evaluateAll((nodes) => nodes.map((n) => (n as HTMLElement).dataset.optionId));
    expect(optionIds, 'options render in data order').toEqual(fixture.optionIds);

    const bubbles = await page
      .getByTestId('stance-bubble')
      .evaluateAll((nodes) =>
        nodes.map((n) => ({
          unitId: (n as HTMLElement).dataset.unitId,
          optionId: (n as HTMLElement).dataset.optionId ?? null,
        })),
      );
    expect(bubbles.map((b) => b.unitId)).toEqual(fixture.unitIds);

    const tally = page.getByTestId('council-tally');
    const winner = await tally.getAttribute('data-winning-option-id');
    expect(fixture.optionIds).toContain(winner);

    // 수수께끼 골렘's authored defaults are a real 1-1-1 split, so the deciding vote —
    // not a majority — has to settle it.
    const counts = new Map<string, number>();
    for (const b of bubbles) {
      if (b.optionId) counts.set(b.optionId, (counts.get(b.optionId) ?? 0) + 1);
    }
    const top = Math.max(...fixture.optionIds.map((id) => counts.get(id) ?? 0));
    const leaders = fixture.optionIds.filter((id) => (counts.get(id) ?? 0) === top);
    if (leaders.length > 1) {
      expect(leaders, 'the deciding vote must land on a tied option').toContain(winner);
      expect(await tally.getAttribute('data-deciding-unit-id')).not.toBeNull();
    } else {
      expect(winner).toBe(leaders[0]);
      expect(await tally.getAttribute('data-deciding-unit-id')).toBeNull();
    }
  });

  test('lens: 「번역 렌즈」 equipped on any unit reveals the hint before the vote', async ({
    page,
  }) => {
    // Seeded on the LAST party unit on purpose — "equipped on ANY unit" is the claim.
    const fixture = await open(page, '?equip=selene:translation_lens');
    expect(fixture.agendaId).toBe('riddle_golem');

    const hint = page.getByTestId('council-hint');
    await expect(hint, 'the hint must be on screen while the vote is still held').toBeVisible();
    await expect(hint).not.toBeEmpty();
    await expect(page.getByTestId('council-tally')).toHaveCount(0);
    expect((await readFixture(page)).stanceCalls).toEqual([]);

    await runRound(page);

    await expect(hint, 'the hint stays readable through the vote').toBeVisible();
    const calls = (await readFixture(page)).stanceCalls;
    expect(
      calls.every((call) => call.hintId === 'translation_lens'),
      'every unit reasons with the revealed clue',
    ).toBe(true);
  });

  test('lens: without it there is no hint line and no complaint about missing one', async ({
    page,
  }) => {
    await open(page);
    await expect(page.getByTestId('council-hint')).toHaveCount(0);
    await runRound(page);
    await expect(page.getByTestId('council-hint')).toHaveCount(0);

    const calls = (await readFixture(page)).stanceCalls;
    expect(calls.every((call) => call.hintId === null)).toBe(true);

    const copy = await page.evaluate(() => document.body.innerText);
    expect(NOISE.test(copy), `noise on screen: ${copy}`).toBe(false);
  });

  test('seungbusa: 셀레네 carrying 「승부사」 flips her merchant stance and the outcome', async ({
    page,
  }) => {
    const plain = await open(page, '?agenda=fallen_merchant');
    expect(plain.agendaId).toBe('fallen_merchant');
    await runRound(page);

    const seleneDefault = await page
      .locator('[data-testid="stance-bubble"][data-unit-id="selene"]')
      .getAttribute('data-option-id');
    const defaultWinner = await page
      .getByTestId('council-tally')
      .getAttribute('data-winning-option-id');
    expect(defaultWinner).toBe('op_merchant_pass');
    await expect(page.getByTestId('council-outcome')).not.toHaveAttribute('data-card-id', /.+/);

    await open(page, '?agenda=fallen_merchant&equip=selene:gambler');
    await runRound(page);

    const seleneFlipped = await page
      .locator('[data-testid="stance-bubble"][data-unit-id="selene"]')
      .getAttribute('data-option-id');
    expect(seleneFlipped, 'the card must move her, not the tally alone').not.toBe(seleneDefault);
    expect(seleneFlipped).toBe('op_merchant_save');
    await expect(page.getByTestId('council-tally')).toHaveAttribute(
      'data-winning-option-id',
      'op_merchant_save',
    );
    await expect(page.getByTestId('council-outcome')).toHaveAttribute(
      'data-card-id',
      'compassion',
    );
  });

  test('the outcome leaves the screen as a grant event', async ({ page }) => {
    // 퍼즐 오답 (the authored 1-1-1 lands on 금화): no card, gauge for the whole party.
    const fixture = await open(page, '?agenda=riddle_golem');
    await runRound(page);

    const outcome = page.getByTestId('council-outcome');
    await expect(outcome).toBeVisible();
    await expect(outcome, 'a wrong answer grants no card').not.toHaveAttribute(
      'data-card-id',
      /.+/,
    );
    const gauge = Number(await outcome.getAttribute('data-gauge-all'));
    expect(gauge, 'gauge.puzzleWrong is applied to the whole party').toBeGreaterThan(0);

    const grants = (await readFixture(page)).grants;
    expect(grants, 'the screen announces the grant exactly once').toHaveLength(1);
    expect(grants[0].agendaId).toBe(fixture.agendaId);
    expect(grants[0].cardId).toBeNull();
    expect(grants[0].correct).toBe(false);
    expect(grants[0].gaugeAll).toBe(gauge);
  });

  test('the 구한다 branch grants 「연민」 through the same event', async ({ page }) => {
    await open(page, '?agenda=fallen_merchant&equip=selene:gambler');
    await runRound(page);

    const grants = (await readFixture(page)).grants;
    expect(grants).toHaveLength(1);
    expect(grants[0].optionId).toBe('op_merchant_save');
    expect(grants[0].cardId).toBe('compassion');
    expect(grants[0].gaugeAll).toBe(0);
    expect(grants[0].correct, '선택이벤트 has no right answer').toBeNull();
  });
});

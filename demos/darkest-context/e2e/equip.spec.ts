// Behavioral TDD-Red e2e for u12 — 훈련장 (3택1 + free assignment) and 휴식 (생각정리 / Clear).
// Playwright, chromium/headless, served from the real build (playwright.config.ts).
//
// Why a harness page and not `/`: index.html and src/main.ts are u1-owned and frozen for this
// unit. u1 left the seam — vite.config.ts globs `e2e/harness/*/index.html` — so u12 ships its
// own standalone page and edits no shared file.
//
// ─────────────────────────── HARNESS CONTRACT (u12 must build) ───────────────────────────
// Page: e2e/harness/equip/index.html + main.ts → served at /e2e/harness/equip/
// Real data via loadBundledGameData(). BOTH screens mount on this one page, side by side —
// that is what makes A9 (훈련장 never touches the gauge) observable: the rest screen owns the
// gauge readouts and the 훈련장 renders alongside them without moving a number.
//
//   [data-testid="training-screen"]
//     [data-testid="slot-meter"][data-unit-id]   one per party unit, PERSISTENT (never
//         removed across phases) → 3 rows [data-slot-kind="prompt|skill|mcp"][data-remaining]
//     [data-testid="draft-row"]                  → N × .dc-card[data-card-id], N =
//         tuning.draft.optionCount, ids in grant.optionCardIds order (no shuffle)
//     [data-testid="target-picker"]              ABSENT until a draft card is pressed; on
//         appearance carries .anim-phase-fade and holds exactly one
//         .dc-unit-panel[data-unit-id] per party unit. A unit that cannot take the pressed
//         card is a native `disabled` button carrying data-disabled-reason="duplicate"|"full".
//     [data-testid="training-done"]              continue control
//
//   [data-testid="rest-screen"]
//     [data-testid="rest-option-think"] · [data-testid="rest-option-clear"]  — after a pick
//         BOTH are `disabled` (never removed): one resolution per visit
//     [data-testid="gauge-readout"][data-unit-id][data-gauge]  — rendered from first paint,
//         one per party unit; the rest screen is their only owner
//     [data-testid="rest-result"]                appears after a pick, carries .anim-phase-fade
//     [data-testid="forgotten-card"][data-card-id]  rendered ONLY when a card was forgotten
//     [data-testid="rest-done"]                  continue control
//
//   Party seeding: exactly ONE unit (`dupUnitId`) starts pre-equipped, holding `dupCardId`,
//   and `dupCardId` is one of `draftCardIds`. Every other unit starts empty — that is what
//   makes the slot-meter baseline (A7) and the disabled target (A11) unambiguous.
//
//   `?scenario=no-prompt` boots the same page with a party holding ZERO Prompt cards.
//
//   window.__equip = {
//     unitIds: string[];        // party order
//     draftCardIds: string[];   // grant.optionCardIds, data order
//     dupUnitId: string;        // the pre-equipped unit
//     dupCardId: string;        // the card it already holds
//     gauges: { id: string; gauge: number }[];   // seeded gauges, party order
//   }
//
// The spec asserts WIRING through that object — never a Korean copy string. The only place
// Korean appears below is the A17 negative match, which is the point of INV-7.
import { expect, test, type Page } from '@playwright/test';

const HARNESS = '/e2e/harness/equip/';

/** tuning.slots — the 훈련장 capacity the meter must show on an untouched unit. */
const SLOT_CAPACITY: Record<string, number> = { prompt: 3, skill: 2, mcp: 3 };
const SLOT_KINDS = ['prompt', 'skill', 'mcp'] as const;
const DRAFT_OPTION_COUNT = 3; // tuning.draft.optionCount

/** INV-7's silent half: none of this may reach the player on a degraded path. */
const NOISE = /경고|오류|실패|없습니다|warn|error|fail/i;

interface EquipFixture {
  unitIds: string[];
  draftCardIds: string[];
  dupUnitId: string;
  dupCardId: string;
  gauges: { id: string; gauge: number }[];
}

declare global {
  interface Window {
    __equip?: EquipFixture;
  }
}

interface Watched {
  consoleErrors: string[];
  pageErrors: string[];
}

/** Must be installed BEFORE the first navigation, or boot-time errors escape the net. */
function watch(page: Page): Watched {
  const w: Watched = { consoleErrors: [], pageErrors: [] };
  page.on('console', (m) => {
    if (m.type() === 'error') w.consoleErrors.push(m.text());
  });
  page.on('pageerror', (e) => w.pageErrors.push(e.message));
  return w;
}

/**
 * Opens the harness and enforces INV-1 (A3) on every single load: the player never types,
 * so the page carries no free-text control at all.
 */
async function open(page: Page, query = ''): Promise<EquipFixture> {
  const url = `${HARNESS}${query}`;
  const response = await page.goto(url);
  expect(response, `no navigation response for ${url}`).toBeTruthy();
  expect(response!.ok(), `harness status ${response!.status()} — is the page built?`).toBeTruthy();

  await expect(page.getByTestId('training-screen')).toBeVisible();
  await expect(page.getByTestId('rest-screen')).toBeVisible();

  const controls = page.locator('input, textarea, select, form, [contenteditable]');
  expect(await controls.count(), 'INV-1: the membrane leaks — a free-text control is on screen')
    .toBe(0);

  const fixture = await page.evaluate(() => window.__equip);
  expect(fixture, 'harness does not expose window.__equip').toBeTruthy();
  return fixture as EquipFixture;
}

/** Every gauge readout as `unitId=value`, in DOM order — the A9 byte-identity probe. */
const gaugeSnapshot = (page: Page): Promise<string[]> =>
  page
    .locator('[data-testid="gauge-readout"]')
    .evaluateAll((nodes) =>
      nodes.map((n) => `${(n as HTMLElement).dataset.unitId}=${(n as HTMLElement).dataset.gauge}`),
    );

/** One unit's slot meter as {kind: remaining}. */
async function meterOf(page: Page, unitId: string): Promise<Record<string, number>> {
  return page
    .locator(`[data-testid="slot-meter"][data-unit-id="${unitId}"] [data-slot-kind]`)
    .evaluateAll((nodes) =>
      Object.fromEntries(
        nodes.map((n) => [
          (n as HTMLElement).dataset.slotKind as string,
          Number((n as HTMLElement).dataset.remaining),
        ]),
      ),
    );
}

const sumOf = (meter: Record<string, number>): number =>
  Object.values(meter).reduce((a, b) => a + b, 0);

test.describe('u12 equip', () => {
  // ───────────────────────────── A1 / A2 / A3 — own-slice gate ─────────────────────────
  test('the harness page boots both screens with zero console errors', async ({ page }) => {
    const w = watch(page);
    const fixture = await open(page);

    expect(fixture.unitIds.length, 'party is empty').toBeGreaterThan(0);
    expect(fixture.draftCardIds).toHaveLength(DRAFT_OPTION_COUNT);
    expect(fixture.draftCardIds, 'dupCardId must be one of the draft options').toContain(
      fixture.dupCardId,
    );

    expect(w.pageErrors, `page errors: ${w.pageErrors.join(' | ')}`).toEqual([]);
    expect(w.consoleErrors, `console errors: ${w.consoleErrors.join(' | ')}`).toEqual([]);
  });

  // ─────────────────────────────────── 훈련장 ─────────────────────────────────────────
  test.describe('training', () => {
    test('fans out exactly optionCount cards, in authored data order (A4)', async ({ page }) => {
      const fixture = await open(page);
      const cards = page.locator('[data-testid="draft-row"] .dc-card[data-card-id]');

      await expect(cards).toHaveCount(DRAFT_OPTION_COUNT);
      expect(
        await cards.evaluateAll((nodes) => nodes.map((n) => (n as HTMLElement).dataset.cardId)),
      ).toEqual(fixture.draftCardIds);
    });

    test('shows each unit a 3-row slot meter starting at the tuned capacity (A7)', async ({
      page,
    }) => {
      const fixture = await open(page);

      for (const unitId of fixture.unitIds) {
        const meter = await meterOf(page, unitId);
        expect(Object.keys(meter).sort(), `unit ${unitId}`).toEqual([...SLOT_KINDS].sort());
        if (unitId !== fixture.dupUnitId) {
          expect(meter, `untouched unit ${unitId} should show full capacity`).toEqual(
            SLOT_CAPACITY,
          );
        }
      }
      // The seeded unit spent exactly one slot for the card it already holds.
      expect(sumOf(await meterOf(page, fixture.dupUnitId))).toBe(sumOf(SLOT_CAPACITY) - 1);
    });

    test('withholds the target picker until a card is pressed, then fades it in (A5, A20)', async ({
      page,
    }) => {
      const fixture = await open(page);

      await expect(page.getByTestId('target-picker')).toHaveCount(0);

      await page.locator(`[data-testid="draft-row"] .dc-card[data-card-id="${fixture.dupCardId}"]`).click();

      const picker = page.getByTestId('target-picker');
      await expect(picker).toBeVisible();
      await expect(picker).toHaveClass(/anim-phase-fade/);
      await expect(picker.locator('.dc-unit-panel[data-unit-id]')).toHaveCount(
        fixture.unitIds.length,
      );
      expect(
        await picker
          .locator('.dc-unit-panel[data-unit-id]')
          .evaluateAll((nodes) => nodes.map((n) => (n as HTMLElement).dataset.unitId)),
      ).toEqual(fixture.unitIds);
    });

    test('the engine picks nothing: no loadout moves before the two clicks (A6)', async ({
      page,
    }) => {
      const fixture = await open(page);
      const before = await Promise.all(fixture.unitIds.map((id) => meterOf(page, id)));

      await page.locator(`[data-testid="draft-row"] .dc-card[data-card-id="${fixture.dupCardId}"]`).click();
      await expect(page.getByTestId('target-picker')).toBeVisible();

      const after = await Promise.all(fixture.unitIds.map((id) => meterOf(page, id)));
      expect(after, 'pressing a card already spent a slot somewhere').toEqual(before);
    });

    test('free assignment: any enabled unit takes the card and only its meter moves (A6)', async ({
      page,
    }) => {
      const fixture = await open(page);
      const target = fixture.unitIds.find((id) => id !== fixture.dupUnitId)!;
      const before = await meterOf(page, target);
      const otherId = fixture.unitIds.find((id) => id !== target)!;
      const otherBefore = await meterOf(page, otherId);

      await page.locator(`[data-testid="draft-row"] .dc-card[data-card-id="${fixture.dupCardId}"]`).click();
      await page
        .locator(`[data-testid="target-picker"] .dc-unit-panel[data-unit-id="${target}"]`)
        .click();

      await expect
        .poll(async () => sumOf(await meterOf(page, target)))
        .toBe(sumOf(before) - 1);
      expect(await meterOf(page, otherId), 'an unaimed unit lost a slot').toEqual(otherBefore);
      await expect(page.getByTestId('training-done')).toBeVisible();
    });

    test('a unit already holding the card is disabled with a reason, and clicking it does nothing (A11)', async ({
      page,
    }) => {
      const fixture = await open(page);
      const meterBefore = await meterOf(page, fixture.dupUnitId);

      await page.locator(`[data-testid="draft-row"] .dc-card[data-card-id="${fixture.dupCardId}"]`).click();

      const blocked = page.locator(
        `[data-testid="target-picker"] .dc-unit-panel[data-unit-id="${fixture.dupUnitId}"]`,
      );
      await expect(blocked).toBeDisabled();
      await expect(blocked).toHaveAttribute('data-disabled-reason', 'duplicate');

      // Every other unit stays reachable — the block is per-unit, not a dead end.
      for (const unitId of fixture.unitIds.filter((id) => id !== fixture.dupUnitId)) {
        await expect(
          page.locator(`[data-testid="target-picker"] .dc-unit-panel[data-unit-id="${unitId}"]`),
        ).toBeEnabled();
      }

      await blocked.click({ force: true });
      expect(await meterOf(page, fixture.dupUnitId), 'a disabled target still equipped').toEqual(
        meterBefore,
      );
      await expect(page.getByTestId('target-picker')).toBeVisible();
    });

    test('touches no gauge at all — every readout is byte-identical across draft→assign (A9)', async ({
      page,
    }) => {
      const fixture = await open(page);
      const before = await gaugeSnapshot(page);
      expect(before.length, 'no gauge readouts on the page to compare').toBe(
        fixture.unitIds.length,
      );

      const target = fixture.unitIds.find((id) => id !== fixture.dupUnitId)!;
      await page.locator(`[data-testid="draft-row"] .dc-card[data-card-id="${fixture.dupCardId}"]`).click();
      await page
        .locator(`[data-testid="target-picker"] .dc-unit-panel[data-unit-id="${target}"]`)
        .click();
      await expect(page.getByTestId('training-done')).toBeVisible();

      expect(await gaugeSnapshot(page), '훈련장 moved a gauge').toEqual(before);
    });

    test('offers no discard control anywhere — 강제 배분 is cut (A8)', async ({ page }) => {
      const fixture = await open(page);
      await page.locator(`[data-testid="draft-row"] .dc-card[data-card-id="${fixture.dupCardId}"]`).click();
      await expect(page.getByTestId('target-picker')).toBeVisible();

      expect(await page.locator('[data-testid*="discard"]').count()).toBe(0);
      expect(await page.locator('[class*="discard"]').count()).toBe(0);
    });
  });

  // ─────────────────────────────────── 휴식 ───────────────────────────────────────────
  test.describe('rest', () => {
    test('think-tidy lowers every gauge and forgets nothing', async ({ page }) => {
      const w = watch(page);
      const fixture = await open(page);
      const seeded = new Map(fixture.gauges.map((g) => [g.id, g.gauge]));

      await page.getByTestId('rest-option-think').click();

      const result = page.getByTestId('rest-result');
      await expect(result).toBeVisible();
      await expect(result).toHaveClass(/anim-phase-fade/);

      for (const unitId of fixture.unitIds) {
        const readout = page.locator(`[data-testid="gauge-readout"][data-unit-id="${unitId}"]`);
        await expect(readout).toHaveClass(/anim-gauge-tint/);
        const value = Number(await readout.getAttribute('data-gauge'));
        expect(value, `unit ${unitId}`).toBeLessThanOrEqual(seeded.get(unitId)!);
        expect(value).toBeGreaterThanOrEqual(0);
      }

      await expect(page.getByTestId('forgotten-card')).toHaveCount(0);
      expect(w.consoleErrors, `console errors: ${w.consoleErrors.join(' | ')}`).toEqual([]);
    });

    test('Clear zeroes every gauge and forgets exactly one equipped Prompt card', async ({
      page,
    }) => {
      const fixture = await open(page);

      await page.getByTestId('rest-option-clear').click();
      await expect(page.getByTestId('rest-result')).toBeVisible();

      for (const unitId of fixture.unitIds) {
        await expect(
          page.locator(`[data-testid="gauge-readout"][data-unit-id="${unitId}"]`),
        ).toHaveAttribute('data-gauge', '0');
      }

      const forgotten = page.getByTestId('forgotten-card');
      await expect(forgotten).toHaveCount(1);
      await expect(forgotten).toHaveAttribute('data-card-id', /.+/);
    });

    test('resolves once per visit: both options are disabled after a pick, never removed', async ({
      page,
    }) => {
      await open(page);
      const think = page.getByTestId('rest-option-think');
      const clear = page.getByTestId('rest-option-clear');

      await expect(think).toBeEnabled();
      await expect(clear).toBeEnabled();

      await think.click();

      await expect(think).toBeDisabled();
      await expect(clear).toBeDisabled();
      await expect(think).toHaveCount(1);
      await expect(clear).toHaveCount(1);
      await expect(page.getByTestId('rest-done')).toBeVisible();
    });

    // A17 / INV-7 — the gate runs this by title: `playwright test -g 'clear-no-prompt'`.
    test('clear-no-prompt: gauges reach zero and nothing on the page complains', async ({
      page,
    }) => {
      const w = watch(page);
      const fixture = await open(page, '?scenario=no-prompt');

      await page.getByTestId('rest-option-clear').click();
      await expect(page.getByTestId('rest-result')).toBeVisible();

      for (const unitId of fixture.unitIds) {
        await expect(
          page.locator(`[data-testid="gauge-readout"][data-unit-id="${unitId}"]`),
        ).toHaveAttribute('data-gauge', '0');
      }

      // Nothing was forgotten, and the player is never told so.
      await expect(page.getByTestId('forgotten-card')).toHaveCount(0);

      const copy = await page.evaluate(() => document.body.innerText);
      expect(copy, `the silent fallback spoke up: ${copy.match(NOISE)?.[0] ?? ''}`).not.toMatch(
        NOISE,
      );

      expect(w.pageErrors, `page errors: ${w.pageErrors.join(' | ')}`).toEqual([]);
      expect(w.consoleErrors, `console errors: ${w.consoleErrors.join(' | ')}`).toEqual([]);
    });
  });
});

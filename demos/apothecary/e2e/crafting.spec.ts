// Behavioral TDD-Red e2e for u7 — Crafting screen (Playwright, chromium/headless).
// Drives the real crafting screen in a browser and pins PRD §2 (Crafting) + §1.3
// (weighted 건네기 commit beat) + §4 invariants. The static half (config verbs live in
// data, pure clamp/single-select logic) lives in tests/screens/crafting/selection.test.ts.
//
// ── Contract this spec pins (the build agent implements the screen + harness to match) ──
//
// Harness page — BUILT INTO dist (preview-served, per spec §0 e2e reality):
//   URL  /e2e/harness/crafting/  mounts mountCrafting() in isolation with seeded
//   ingredients (via loadIngredients(data/ingredients.json)) + a fixture OutcomeTable.
//
// window.__crafting  — test API the harness seeds:
//   phase          'crafting' at mount; set to 'handover' by the harness onCommit
//                  (the app-shell seam: persist result + reduce(state,{type:'commit'})).
//   lastCommit     null until commit; then { selection:{ingredientIds,method,declaration},
//                  outcome:{channel,text,arrivalTrigger} } — the CommitResult onCommit got.
//   defaultOutcome the fixture table's `default` Outcome.
//   matchCombo     { ingredientIds[], method, declaration } — a valid 1–3 selection that
//                  MATCHES a fixture entry (its outcome is a specific, non-default row).
//   weirdCombo     { ingredientIds[], method, declaration } — a valid 1–3 selection that
//                  matches NO entry → must resolve to `default` (AC11, no dead-end).
//
// DOM contract (rendered by src/screens/crafting/view.ts):
//   root element        class `crafting`
//   ingredient cards    button.card[data-group="ingredient"][data-id="<id>"]  (one per data row)
//   method cards        button.card[data-group="method"][data-value="<우리기|달이기|빻기>"]
//   declaration cards   button.card[data-group="declaration"][data-value="<정석|실험>"]
//   commit control      button[data-action="commit"]  (the [건네기]; native `disabled` when not ready)
//   selected state      `.card--selected` + aria-pressed="true"
//   commit beat         root gains `crafting--committing` (fires the commit-beat keyframe)
//   committed lock      root gains `crafting--committed`; card groups get pointer-events:none
import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const HARNESS = '/e2e/harness/crafting/';

const here = dirname(fileURLToPath(import.meta.url));
// e2e/ -> demos/apothecary/data/ingredients.json  (the data-driven grid source, F1/AC2).
const ingredientsPath = resolve(here, '..', 'data', 'ingredients.json');

interface Combo {
  ingredientIds: string[];
  method: string;
  declaration: string;
}
interface Outcome {
  channel: string;
  text: string;
  arrivalTrigger: string;
}
interface CraftingApi {
  phase: string;
  lastCommit: { selection: Combo; outcome: Outcome } | null;
  defaultOutcome: Outcome;
  matchCombo: Combo;
  weirdCombo: Combo;
}

function ingredientDataCount(): number {
  const raw = JSON.parse(readFileSync(ingredientsPath, 'utf8')) as unknown[];
  return raw.length;
}

async function gotoHarness(page: Page): Promise<void> {
  const response = await page.goto(HARNESS);
  expect(response, 'no navigation response for crafting harness').toBeTruthy();
  expect(response!.ok(), `harness bad status ${response!.status()}`).toBeTruthy();
  await expect(page.locator('.crafting')).toBeVisible();
}

async function api(page: Page): Promise<CraftingApi> {
  return page.evaluate(() => (window as unknown as { __crafting: CraftingApi }).__crafting);
}

const ingredient = (page: Page, id: string) =>
  page.locator(`button.card[data-group="ingredient"][data-id="${id}"]`);
const method = (page: Page, value: string) =>
  page.locator(`button.card[data-group="method"][data-value="${value}"]`);
const declaration = (page: Page, value: string) =>
  page.locator(`button.card[data-group="declaration"][data-value="${value}"]`);
const commitBtn = (page: Page) => page.locator('button[data-action="commit"]');
const selectedIngredients = (page: Page) =>
  page.locator('button.card[data-group="ingredient"].card--selected');

async function selectCombo(page: Page, combo: Combo): Promise<void> {
  for (const id of combo.ingredientIds) await ingredient(page, id).click();
  await method(page, combo.method).click();
  await declaration(page, combo.declaration).click();
}

test.describe('crafting screen (u7)', () => {
  // AC1 — loads with zero console errors / page errors.
  test('AC1: crafting harness loads with no console or page errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    page.on('console', (m) => {
      if (m.type() === 'error') consoleErrors.push(m.text());
    });
    page.on('pageerror', (e) => pageErrors.push(e.message));

    await gotoHarness(page);

    expect(pageErrors, `page errors: ${pageErrors.join(' | ')}`).toEqual([]);
    expect(consoleErrors, `console errors: ${consoleErrors.join(' | ')}`).toEqual([]);
  });

  // AC2 — ingredient grid renders exactly data length, each a <button>, zero native form controls.
  test('AC2: ingredient grid is data-driven buttons, no native form controls', async ({ page }) => {
    await gotoHarness(page);

    const cards = page.locator('button.card[data-group="ingredient"]');
    await expect(cards.first()).toBeVisible();
    expect(await cards.count(), 'ingredient card count != data/ingredients.json length').toBe(
      ingredientDataCount(),
    );

    // Every ingredient card is a real <button> (membrane / cards-never-forms).
    const allButtons = await cards.evaluateAll((els) => els.every((el) => el.tagName === 'BUTTON'));
    expect(allButtons, 'an ingredient card is not a <button>').toBe(true);

    const formControls = await page.locator('select, input, textarea').count();
    expect(formControls, 'native <select>/<input>/<textarea> present (membrane breach)').toBe(0);
  });

  // AC3 — an ingredient card wires hover, selected (.card--selected + aria-pressed), and a transition.
  test('AC3: ingredient card toggles selected state and has hover + transition wired', async ({
    page,
  }) => {
    await gotoHarness(page);
    const card = page.locator('button.card[data-group="ingredient"]').first();
    await expect(card).toBeVisible();

    // selected toggle
    await expect(card).not.toHaveClass(/card--selected\b/);
    await card.click();
    await expect(card).toHaveClass(/card--selected\b/);
    await expect(card).toHaveAttribute('aria-pressed', 'true');

    // transition wired (no instant flip)
    const duration = await card.evaluate((el) =>
      getComputedStyle(el).getPropertyValue('transition-duration'),
    );
    expect(duration.trim() !== '' && /[1-9]/.test(duration), `no transition (${duration})`).toBe(
      true,
    );

    // hover changes computed appearance
    const props = ['box-shadow', 'transform', 'border-color', 'background-color', 'filter'];
    const read = () =>
      card.evaluate(
        (el, ps) => ps.map((p) => getComputedStyle(el as Element).getPropertyValue(p)),
        props,
      );
    const before = await read();
    await card.hover();
    await page.waitForTimeout(250);
    const after = await read();
    expect(before.some((v, i) => v !== after[i]), 'no computed change on hover').toBe(true);
  });

  // AC4 — 1–3 clamp: a 4th selection is a no-op; deselecting below 1 disables commit.
  test('AC4: ingredient selection clamps at 3 (4th is a no-op) and min-1 gates commit', async ({
    page,
  }) => {
    await gotoHarness(page);
    const ids = await page
      .locator('button.card[data-group="ingredient"]')
      .evaluateAll((els) => els.map((el) => el.getAttribute('data-id')!));
    expect(ids.length, 'need >=4 ingredients to test the clamp').toBeGreaterThanOrEqual(4);

    for (const id of ids.slice(0, 3)) await ingredient(page, id).click();
    await expect(selectedIngredients(page)).toHaveCount(3);

    // 4th click is a no-op — count stays 3 and the 4th card is not selected.
    await ingredient(page, ids[3]).click();
    await expect(selectedIngredients(page)).toHaveCount(3);
    await expect(ingredient(page, ids[3])).not.toHaveClass(/card--selected\b/);

    // Deselect all three -> below the min-1 -> commit disabled (method still needed too).
    for (const id of ids.slice(0, 3)) await ingredient(page, id).click();
    await expect(selectedIngredients(page)).toHaveCount(0);
    await expect(commitBtn(page)).toBeDisabled();
  });

  // AC5 — method is single-select: after any pick exactly one is active; a new pick moves it.
  test('AC5: method group keeps exactly one card active', async ({ page }) => {
    await gotoHarness(page);
    const selectedMethod = page.locator(
      'button.card[data-group="method"].card--selected',
    );
    await expect(selectedMethod).toHaveCount(0);

    await method(page, '우리기').click();
    await expect(selectedMethod).toHaveCount(1);
    await expect(method(page, '우리기')).toHaveClass(/card--selected\b/);

    await method(page, '달이기').click();
    await expect(selectedMethod).toHaveCount(1);
    await expect(method(page, '달이기')).toHaveClass(/card--selected\b/);
    await expect(method(page, '우리기')).not.toHaveClass(/card--selected\b/);
  });

  // AC6 — declaration is two-state with a defined initial default (정석); exactly one always active.
  test('AC6: declaration has a default and stays exactly-one-active', async ({ page }) => {
    await gotoHarness(page);
    const selectedDecl = page.locator(
      'button.card[data-group="declaration"].card--selected',
    );
    // defined initial default, and it is 정석 (spec A5 / config defaultDeclaration).
    await expect(selectedDecl).toHaveCount(1);
    await expect(declaration(page, '정석')).toHaveClass(/card--selected\b/);

    await declaration(page, '실험').click();
    await expect(selectedDecl).toHaveCount(1);
    await expect(declaration(page, '실험')).toHaveClass(/card--selected\b/);
    await expect(declaration(page, '정석')).not.toHaveClass(/card--selected\b/);
  });

  // AC7 — [건네기] is disabled until (>=1 ingredient AND a method); enabled once both hold.
  test('AC7: commit control is gated by the enable predicate', async ({ page }) => {
    await gotoHarness(page);
    const commit = commitBtn(page);

    // declaration defaults to selected, so ingredient + method are the missing halves.
    await expect(commit).toBeDisabled();

    await page.locator('button.card[data-group="ingredient"]').first().click();
    await expect(commit, 'commit enabled with an ingredient but no method').toBeDisabled();

    await method(page, '달이기').click();
    await expect(commit, 'commit still disabled once ingredient + method + default declaration hold')
      .toBeEnabled();
  });

  // AC8 — a valid [건네기] fires a NON-instant commit beat (committing class + animationstart).
  test('AC8: commit fires a weighted animation beat, not an instant swap', async ({ page }) => {
    await gotoHarness(page);
    const { matchCombo } = await api(page);
    await selectCombo(page, matchCombo);
    await expect(commitBtn(page)).toBeEnabled();

    // Record any animationstart in the crafting root + whether the committing class ever appears.
    await page.evaluate(() => {
      const w = window as unknown as { __beat: { anims: string[]; committing: boolean } };
      w.__beat = { anims: [], committing: false };
      const root = document.querySelector('.crafting');
      document.addEventListener(
        'animationstart',
        (e) => w.__beat.anims.push((e as AnimationEvent).animationName),
        true,
      );
      if (root) {
        const obs = new MutationObserver(() => {
          if (root.classList.contains('crafting--committing')) w.__beat.committing = true;
        });
        obs.observe(root, { attributes: true, attributeFilter: ['class'] });
      }
    });

    await commitBtn(page).click();

    await expect
      .poll(async () =>
        page.evaluate(() => {
          const w = window as unknown as { __beat: { anims: string[]; committing: boolean } };
          return w.__beat.anims.length > 0 || w.__beat.committing;
        }),
      )
      .toBe(true);
  });

  // AC9 — after the beat the machine leaves crafting and a DEFINED, sorted-key outcome is handed off.
  test('AC9: commit hands off a defined outcome and leaves the crafting phase', async ({ page }) => {
    await gotoHarness(page);
    const { matchCombo } = await api(page);
    await selectCombo(page, matchCombo);
    await commitBtn(page).click();

    // wait for the onCommit handoff to land.
    await expect.poll(async () => (await api(page)).lastCommit !== null).toBe(true);
    const after = await api(page);

    // defined Outcome (never undefined) with the required string fields.
    expect(after.lastCommit).not.toBeNull();
    const outcome = after.lastCommit!.outcome;
    expect(outcome, 'handed-off outcome is undefined').toBeTruthy();
    expect(typeof outcome.channel).toBe('string');
    expect(typeof outcome.text).toBe('string');
    expect(typeof outcome.arrivalTrigger).toBe('string');

    // ingredient ids handed off are SORTED (canonical key, PRD §2).
    const ids = after.lastCommit!.selection.ingredientIds;
    expect(ids, 'committed ingredientIds not sorted').toEqual([...ids].sort());

    // machine left crafting -> handover, and the crafting screen is gone.
    expect(after.phase, 'phase did not advance past crafting').toBe('handover');
    await expect(page.locator('.crafting')).toHaveCount(0);
  });

  // AC10 — post-commit the selection is locked / irreversible.
  test('AC10: controls lock after commit (irreversibility)', async ({ page }) => {
    await gotoHarness(page);
    const ids = await page
      .locator('button.card[data-group="ingredient"]')
      .evaluateAll((els) => els.map((el) => el.getAttribute('data-id')!));
    // pick exactly two + method + default declaration.
    await ingredient(page, ids[0]).click();
    await ingredient(page, ids[1]).click();
    await method(page, '달이기').click();
    await expect(selectedIngredients(page)).toHaveCount(2);

    await commitBtn(page).click();

    // committed state is applied synchronously (before the beat resolves): CSS lock is in place.
    await expect(page.locator('.crafting')).toHaveClass(/crafting--committed\b/);
    const pe = await page
      .locator('button.card[data-group="ingredient"]')
      .first()
      .evaluate((el) => getComputedStyle(el).pointerEvents);
    expect(pe, 'ingredient cards are not pointer-locked after commit').toBe('none');

    // a forced click on a previously-unselected card must NOT grow the selection.
    if ((await page.locator('.crafting').count()) > 0) {
      await ingredient(page, ids[2]).click({ force: true }).catch(() => {});
      await expect(selectedIngredients(page)).toHaveCount(2);
      await expect(ingredient(page, ids[2])).not.toHaveClass(/card--selected\b/);
    }
  });

  // AC11 — a deliberately unlisted combo resolves to the customer `default` (no dead-end).
  test('AC11: an unlisted combo falls through to the default outcome', async ({ page }) => {
    await gotoHarness(page);
    const { weirdCombo, defaultOutcome } = await api(page);
    await selectCombo(page, weirdCombo);
    await commitBtn(page).click();

    await expect.poll(async () => (await api(page)).lastCommit !== null).toBe(true);
    const after = await api(page);
    expect(after.lastCommit!.outcome, 'unlisted combo did not resolve to default').toEqual(
      defaultOutcome,
    );
  });
});

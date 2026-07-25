// judge-frame.spec.ts — the PR #33 review gate: what a judge actually sees, in
// the frame they see it in.
//
// Every assertion here replaces a finding the R3 panel reproduced on the BUILT
// stub demo at 1280x720 (Playwright's Desktop Chrome default, and the frame the
// 30-60s competition video is captured in):
//
//   1. [건네기] sat 320px below the fold — a judge could finish a diagnosis and
//      find no way to hand the remedy over.
//   2. The crafting phase — the longest one, with the customer standing there
//      waiting — showed an empty brown disc where the face should be, and the
//      entrance beat had no figure at all.
//   3. Customer 3 wore customer 1's exact face (a 2-sheet pool over 3 slots).
//   4. The last question of a conversation got no verbal reply: the tier moved,
//      the cards greyed out and the customer repeated the previous sentence.
//   5. The door-idle beat — the whole PoC question of the run — never happened at
//      judge pace, so the play link could not show the thing it set out to prove.
//   6. Korean lines broke mid-word on every text surface.
//   7. The last frame was a door note with nothing to press, and a wrong remedy
//      never referenced the clues the player had just uncovered.
//
// Drives the deployed stub build (`/`), never a harness: these are properties of
// the artifact judges load.
import { readFileSync } from 'node:fs';
import { expect, test, type Locator, type Page } from '@playwright/test';

const VIEWPORT = { width: 1280, height: 720 };
const TIER_VARIANTS = JSON.parse(readFileSync('data/tier-variants.json', 'utf8')) as Record<
  string,
  string[][]
>;
const FALLBACK = JSON.parse(readFileSync('data/fallback-npcs.json', 'utf8')) as {
  doorIdleHoldMs: number;
  closingLabel: string;
  closingLine: string;
  reopenLabel: string;
  outcomeTable: { nearMiss: { text: string }; default: { text: string } };
  customer: { id: string };
};

test.use({ viewport: VIEWPORT });

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

async function boxOf(locator: Locator): Promise<Box> {
  const box = await locator.boundingBox();
  expect(box, 'element has no layout box').not.toBeNull();
  return box as Box;
}

/** The painted identity of the customer on stage: sheet + palette + mirror. */
async function faceOf(page: Page): Promise<string> {
  const cell = page.locator('.conversation [data-testid="portrait-cell"]').first();
  await expect(cell).toBeVisible();
  return cell.evaluate((node) => {
    const frame = (node as Element).closest('.portrait-frame');
    const cellStyle = getComputedStyle(node as Element);
    const frameStyle = getComputedStyle(frame as Element);
    return [cellStyle.backgroundImage, frameStyle.filter, cellStyle.transform].join('|');
  });
}

async function greet(page: Page): Promise<void> {
  const button = page.getByTestId('entrance-greet');
  await expect(button).toBeVisible({ timeout: 20_000 });
  await button.click();
}

/**
 * Leave the outcome beat the way a player does. Which beat it is depends on the
 * customer's channel — 재방문 hands straight over to the next visit (or to the
 * staged door beat), 문앞 쪽지 waits for the explicit affordance (FR-9) — so this
 * waits for whichever of the three appeared instead of racing the phase swap.
 */
async function advancePastOutcome(page: Page): Promise<void> {
  const cont = page.getByTestId('continue-to-next');
  const entrance = page.getByTestId('entrance-greet');
  const waiting = page.getByTestId('waiting');
  await expect
    .poll(
      async () => (await cont.count()) + (await entrance.count()) + (await waiting.count()),
      { timeout: 20_000 },
    )
    .toBeGreaterThan(0);
  if ((await cont.count()) > 0) await cont.click();
}

/** Commit any legal remedy, so the run reaches the next customer. */
async function craftAndCommit(page: Page): Promise<void> {
  const crafting = page.locator('.crafting').first();
  await expect(crafting).toBeVisible({ timeout: 20_000 });
  await crafting.locator('.crafting__ingredients .card').first().click();
  await crafting.locator('.crafting__methods .card').first().click();
  const commit = crafting.locator('.crafting__commit');
  await expect(commit).toBeEnabled();
  await commit.click();
}

test.describe('the judge frame (1280x720, built stub)', () => {
  test('R3-1 [건네기] is inside the viewport for every customer, never below the fold', async ({
    page,
  }) => {
    await page.goto('/');
    for (let slot = 0; slot < 3; slot += 1) {
      await greet(page);
      // Straight to crafting: this test is about the crafting frame, not dialogue.
      await page.locator('[data-testid="choice-card"][data-verb="craft"]').first().click();
      const crafting = page.locator('.crafting').first();
      await expect(crafting).toBeVisible({ timeout: 20_000 });

      const commit = crafting.locator('.crafting__commit');
      const box = await boxOf(commit);
      expect(
        box.y + box.height,
        `slot ${slot}: [건네기] bottom is ${box.y + box.height} in a ${VIEWPORT.height}px frame`,
      ).toBeLessThanOrEqual(VIEWPORT.height);
      expect(box.y, `slot ${slot}: [건네기] is above the viewport`).toBeGreaterThanOrEqual(0);

      // Nothing the player must reach is clipped: the whole phase fits the frame.
      const phaseBottom = await crafting.evaluate((node) =>
        Math.max(
          ...Array.from((node as Element).querySelectorAll('*')).map(
            (child) => child.getBoundingClientRect().bottom,
          ),
        ),
      );
      expect(
        Math.round(phaseBottom),
        `slot ${slot}: the crafting phase runs past the fold`,
      ).toBeLessThanOrEqual(VIEWPORT.height);

      await craftAndCommit(page);
      if (slot < 2) await advancePastOutcome(page);
    }
  });

  test('R3-2 the customer has a face in the entrance and the crafting beat', async ({ page }) => {
    await page.goto('/');

    // Entrance: u9's framed panel, not three lines of centred text.
    const entrancePanel = page.locator('[data-testid="entrance-portrait"] .portrait-frame');
    await expect(entrancePanel, 'the entrance beat has no figure').toBeVisible({ timeout: 20_000 });
    const entranceBox = await boxOf(entrancePanel);
    expect(entranceBox.height, 'the entrance figure is a text-height box').toBeGreaterThan(100);
    const entranceCell = page.locator('[data-testid="entrance-portrait"] .portrait-frame__cell');
    expect(
      await entranceCell.evaluate((node) => getComputedStyle(node as Element).backgroundImage),
      'the entrance panel paints no sheet',
    ).toContain('fallback-portrait');

    // Two paid questions on c1 (budget 5, direct costs 2) ⇒ tier 2 at the handoff.
    await greet(page);
    for (let press = 0; press < 2; press += 1) {
      const direct = page
        .locator('[data-testid="choice-card"][data-verb="direct"]:not([disabled])')
        .first();
      await expect(direct).toBeEnabled();
      await direct.click();
      await page.waitForTimeout(300);
    }
    const tier = await page.locator('section.conversation').first().getAttribute('data-tier');
    expect(tier, 'two direct questions did not tighten the tier').toBe('2');

    const proceed = page.getByTestId('conversation-proceed');
    if (await proceed.isVisible()) await proceed.click();

    // Crafting: the same sheet, at the tier the conversation ended on.
    const craftPortrait = page.locator('[data-role="portrait"]').first();
    await expect(craftPortrait).toBeVisible({ timeout: 20_000 });
    const painted = await craftPortrait.evaluate((node) => {
      const style = getComputedStyle(node as Element);
      return {
        image: style.backgroundImage,
        position: style.backgroundPosition,
        width: (node as Element).getBoundingClientRect().width,
      };
    });
    expect(painted.image, 'the crafting portrait is still an empty disc').toContain(
      'fallback-portrait',
    );
    // Column index 2 of a 4-column sheet: 2/3 across.
    expect(painted.position, 'the crafting face is not at the conversation tier').toMatch(
      /^66\.6667%/,
    );
    expect(painted.width).toBeGreaterThan(48);
  });

  test('R3-3 no two customers of one playthrough wear the same face', async ({ page }) => {
    await page.goto('/');
    const faces: string[] = [];
    for (let slot = 0; slot < 3; slot += 1) {
      await greet(page);
      faces.push(await faceOf(page));
      await page.locator('[data-testid="choice-card"][data-verb="craft"]').first().click();
      await craftAndCommit(page);
      if (slot < 2) await advancePastOutcome(page);
    }
    expect(new Set(faces).size, `repeated face across the roster:\n${faces.join('\n')}`).toBe(3);
  });

  test('R3-4 the last question re-inks the line at the new tier (no repeated sentence)', async ({
    page,
  }) => {
    await page.goto('/');
    await greet(page);
    const line = page.getByTestId('npc-line');
    await expect(line).toBeVisible({ timeout: 20_000 });

    // Beat 1 → beat 2 (tier 1), then the TERMINAL question (tier 2).
    await page.locator('[data-testid="choice-card"][data-verb="direct"]').first().click();
    await expect
      .poll(async () => page.locator('section.conversation').first().getAttribute('data-tier'))
      .toBe('1');
    const beforeTerminal = ((await line.textContent()) ?? '').trim();

    await page
      .locator('[data-testid="choice-card"][data-verb="direct"]:not([disabled])')
      .first()
      .click();
    await expect
      .poll(async () => page.locator('section.conversation').first().getAttribute('data-tier'))
      .toBe('2');

    const afterTerminal = ((await line.textContent()) ?? '').trim();
    expect(afterTerminal, 'the terminal question got the previous sentence back').not.toBe(
      beforeTerminal,
    );
    // It is the AUTHORED tier-2 variant of that beat, not improvised text.
    const rows = TIER_VARIANTS.c1;
    const row = rows.find((variants) => variants.includes(beforeTerminal));
    expect(row, 'the pre-press line is not an authored variant').toBeTruthy();
    expect(afterTerminal, 'the re-inked line is not the authored tier-2 variant').toBe(
      (row as string[])[2],
    );
  });

  test('R3-5 the door-idle beat is STAGED, so it exists at judge pace', async ({ page }) => {
    await page.goto('/');
    await greet(page);
    // Take the whole first customer at a human pace: the prefetch for customer 2
    // has long since handed over to the bundled pack by the time the door opens,
    // which is exactly the case that used to skip the beat entirely.
    await page.waitForTimeout(2_500);
    await page.locator('[data-testid="choice-card"][data-verb="craft"]').first().click();

    const started = Date.now();
    await craftAndCommit(page);
    const waiting = page.getByTestId('waiting');
    await expect(waiting, 'no door-idle beat between customers at judge pace').toBeVisible({
      timeout: 10_000,
    });
    // Ambient staging only: no countdown, no failure copy (§2.3/§3-5).
    const text = ((await waiting.textContent()) ?? '').trim();
    expect(text, 'the waiting beat leaked a readout').not.toMatch(/\d/);
    expect(text).not.toMatch(/오류|실패|에러|error/i);

    const greeted = page.getByTestId('entrance-greet');
    await expect(greeted).toBeVisible({ timeout: 20_000 });
    const elapsed = Date.now() - started;
    // Long enough to read as staging (the data value, minus the commit beat and
    // phase animations that also sit inside this window).
    expect(elapsed, 'the door beat was a flash, not a beat').toBeGreaterThan(
      FALLBACK.doorIdleHoldMs * 0.6,
    );
    // And bounded: the shop never parks the player.
    expect(elapsed).toBeLessThan(FALLBACK.doorIdleHoldMs + 8_000);
  });

  test('R3-6 Korean text never breaks mid-word', async ({ page }) => {
    await page.goto('/');
    await greet(page);
    const line = page.getByTestId('npc-line');
    await expect(line).toBeVisible({ timeout: 20_000 });
    for (const locator of [line, page.getByTestId('choice-card').first()]) {
      const style = await locator.evaluate((node) => {
        const s = getComputedStyle(node as Element);
        return { wordBreak: s.wordBreak, overflowWrap: s.overflowWrap };
      });
      expect(style.wordBreak, 'Hangul may wrap mid-word here').toBe('keep-all');
      expect(style.overflowWrap, 'no safety net for an unbreakable run').toBe('anywhere');
    }
  });

  test('R3-7 the impatience tap is at the customer, at a readable size', async ({ page }) => {
    await page.goto('/');
    await greet(page);
    // Two paid questions ⇒ tier 2, where the drumming starts.
    for (let press = 0; press < 2; press += 1) {
      const direct = page
        .locator('[data-testid="choice-card"][data-verb="direct"]:not([disabled])')
        .first();
      await expect(direct).toBeEnabled();
      await direct.click();
      await page.waitForTimeout(300);
    }
    await expect
      .poll(async () => page.locator('section.conversation').first().getAttribute('data-tier'))
      .toBe('2');

    const tap = page.getByTestId('finger-tap');
    const tapBox = await boxOf(tap);
    const panelBox = await boxOf(page.locator('.conversation .portrait-frame').first());

    expect(tapBox.width * tapBox.height, 'the tap is still a corner smudge').toBeGreaterThan(600);
    const tapCentre = tapBox.x + tapBox.width / 2;
    const panelCentre = panelBox.x + panelBox.width / 2;
    expect(
      Math.abs(tapCentre - panelCentre),
      'the tap is not at the customer (it used to sit ~600px away)',
    ).toBeLessThan(panelBox.width);
    expect(
      tapBox.y,
      'the tap is not on the counter line under the face',
    ).toBeGreaterThan(panelBox.y + panelBox.height * 0.6);
    expect(
      await tap.evaluate((node) => getComputedStyle(node as Element).animationName),
      'the tap is not animating at 짜증',
    ).toMatch(/finger-tap/);
  });

  test('R3-8 the day ends deliberately: a closing beat, and a way to play again', async ({
    page,
  }) => {
    await page.goto('/');
    for (let slot = 0; slot < 3; slot += 1) {
      await greet(page);
      await page.locator('[data-testid="choice-card"][data-verb="craft"]').first().click();
      await craftAndCommit(page);
      if (slot < 2) await advancePastOutcome(page);
    }

    // The LAST customer's note carries the closing affordance, not a dead end.
    const doorNote = page.getByTestId('door-note');
    await expect(doorNote).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId('continue-to-next')).toHaveCount(0);
    const close = page.getByTestId('close-shop');
    await expect(close, 'the last frame has nothing to press').toBeVisible();
    await expect(close).toHaveText(FALLBACK.closingLabel);

    await close.click();
    const closing = page.getByTestId('closing');
    await expect(closing, 'no closing beat after the last note').toBeVisible();
    await expect(page.getByTestId('closing-line')).toHaveText(FALLBACK.closingLine);

    // ...and the day can be played again (the run is seeded, so it replays).
    const reopen = page.getByTestId('closing-reopen');
    await expect(reopen).toHaveText(FALLBACK.reopenLabel);
    await reopen.click();
    await expect(page.getByTestId('entrance-greet')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId('closing')).toHaveCount(0);
  });

  test('R3-9 a right-herbs/wrong-hand remedy is answered as a near miss', async ({ page }) => {
    // Customer 3's own table (data/fallback-npcs.json): its first intended row is
    // 감초+생강 달이기 [정석]. Same herbs, a different method ⇒ the near-miss line.
    const intended = JSON.parse(readFileSync('data/fallback-npcs.json', 'utf8')) as {
      outcomeTable: { entries: { ingredients: string[]; method: string; declaration: string }[] };
    };
    const row = intended.outcomeTable.entries[0];
    const otherMethod = ['우리기', '달이기', '빻기'].find((m) => m !== row.method) as string;

    await page.goto('/');
    for (let slot = 0; slot < 2; slot += 1) {
      await greet(page);
      await page.locator('[data-testid="choice-card"][data-verb="craft"]').first().click();
      await craftAndCommit(page);
      await advancePastOutcome(page);
    }

    // Customer 3 on stage: pick the intended herbs, prepare them differently.
    await greet(page);
    await page.locator('[data-testid="choice-card"][data-verb="craft"]').first().click();
    const crafting = page.locator('.crafting').first();
    await expect(crafting).toBeVisible({ timeout: 20_000 });
    for (const id of row.ingredients) {
      await crafting.locator(`.crafting__ingredients .card[data-id="${id}"]`).click();
    }
    await crafting.locator(`.crafting__methods .card[data-value="${otherMethod}"]`).click();
    await crafting.locator('.crafting__commit').click();

    const text = page.getByTestId('door-note-text');
    await expect(text).toBeVisible({ timeout: 20_000 });
    await expect(text, 'the near miss was flattened into the "no effect" note').toHaveText(
      FALLBACK.outcomeTable.nearMiss.text,
    );
  });

  // R3 follow-up on src/screens/conversation/conversation.ts:383 (2nd round): the
  // re-ink landed, but the ONE ending that reaches the 한계 row is the forced one
  // (u2 F3: a paid question landing patience on exactly 0), and the forced handover
  // swapped the stage in the same frame the line was written — a per-frame recording
  // showed "약만 주시오." above 50% opacity for ~40ms of a 320ms type-on, inside a
  // phase already fading out. Six of the twelve authored 한계 lines lived only there.
  test('R3-10 the forced handover keeps the 한계 line on stage until the player leaves', async ({
    page,
  }) => {
    await page.goto('/');
    // Customer 1 out of the way via the craft card (an early exit, no spend):
    // customer 2's budget is the shallowest, so it is the deck whose plainest
    // play — one indirect, one direct — lands patience on exactly 0.
    await greet(page);
    await page.locator('[data-testid="choice-card"][data-verb="craft"]').first().click();
    await craftAndCommit(page);
    await advancePastOutcome(page);

    await greet(page);
    const conv = page.locator('section.conversation').first();
    const line = page.getByTestId('npc-line');
    await expect(line).toBeVisible({ timeout: 20_000 });
    const stage = page.locator('[data-phase="conversation"][data-customer]').first();
    const customerId = await stage.getAttribute('data-customer');
    expect(customerId, 'no customer on stage to read a tier table for').toBeTruthy();
    const rows = TIER_VARIANTS[customerId as string];
    expect(rows, `${customerId} has no authored tier variants`).toBeTruthy();

    // Beat 1 → beat 2 on the cheap verb (cost 1), then the terminal question
    // (cost 2) spends the last of the patience: 3 → 2 → 0, forced at 한계.
    await page
      .locator('[data-testid="choice-card"][data-verb="indirect"]:not([disabled])')
      .first()
      .click();
    await expect.poll(async () => conv.getAttribute('data-tier')).toBe('1');
    const beforeTerminal = ((await line.textContent()) ?? '').trim();

    await page
      .locator('[data-testid="choice-card"][data-verb="direct"]:not([disabled])')
      .first()
      .click();
    await expect.poll(async () => conv.getAttribute('data-tier')).toBe('3');
    // The screen's own machine HAS left the conversation (F3 is intact) …
    await expect(conv).toHaveAttribute('data-phase', 'crafting');

    // … and the reply that press earned is on screen: the AUTHORED 한계 variant.
    const row = rows.find((variants) => variants.includes(beforeTerminal));
    expect(row, 'the pre-press line is not an authored variant').toBeTruthy();
    const forced = (row as string[])[3];
    await expect(line, 'the forced ending printed no 한계 line').toHaveText(forced);

    // … and it STAYS: nothing hands the stage over on a clock of its own. Well past
    // the 320ms type-on and any phase animation, the conversation is still the
    // phase on stage, at full opacity, with the crafting screen not yet mounted.
    await page.waitForTimeout(1_500);
    await expect(line, 'the 한계 line was deleted mid-read').toHaveText(forced);
    await expect(page.locator('.crafting'), 'crafting mounted itself over the reply').toHaveCount(0);
    expect(
      await stage.evaluate((node) => getComputedStyle(node as Element).opacity),
      'the conversation phase is fading out under the line',
    ).toBe('1');

    // The player takes the handover — the same affordance the patience-to-spare
    // ending offers, so the forced ending is not a dead end either.
    const proceed = page.getByTestId('conversation-proceed');
    await expect(proceed, 'the forced ending offers no way on').toBeVisible();
    await proceed.click();
    await expect(page.locator('.crafting').first()).toBeVisible({ timeout: 20_000 });
  });
});

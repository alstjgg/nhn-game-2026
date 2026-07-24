// Behavioral e2e for u8 — the app shell + outcome channels + signature overlap
// (Playwright, chromium/headless). Drives the REAL app at `/` (no harness): the
// full five-phase FSM for two customers, both outcome channels, and the §1.4
// overlap. Everything is data-driven from data/outcomes.json — no hard-coded text.
//
// What this pins (PRD §1.1/§1.4/§4.2/§4.6):
//   • `/` loads with zero console/page errors and makes no external requests.
//   • Customer 1 can be driven entrance → conversation → crafting → handover.
//   • The instant customer 2's CONVERSATION begins, customer 1's DELAYED 재방문
//     outcome + a result-arrival notification appear (with a named animation),
//     while customer 1's machine phase flips handover → outcome. Deterministic,
//     predicate-driven (window.__app mirrors the two machines' phases).
//   • Customer 2 reaches the 문앞 쪽지 end screen with its data-driven text.
//   • No native form controls anywhere along the way (membrane §4.1/§4.5).
import { expect, test, type Locator, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

interface Outcome {
  channel: string;
  text: string;
  arrivalTrigger: string;
}
interface OutcomeEntry {
  ingredients: string[];
  method: string;
  declaration: string;
  outcome: Outcome;
}
interface OutcomeTable {
  entries: OutcomeEntry[];
  default: Outcome;
}
interface AppApi {
  customer1Phase: string;
  customer2Phase: string;
  customer1OutcomeDelivered: boolean;
}

const here = dirname(fileURLToPath(import.meta.url));
const outcomes = JSON.parse(
  readFileSync(resolve(here, '..', 'data', 'outcomes.json'), 'utf8'),
) as Record<string, OutcomeTable>;

// The specific (non-default) rows the spec deliberately crafts toward, so the
// asserted outcome text is a known data value (not the fall-through default).
const c1Entry = outcomes.c1.entries[0];
const c2Entry = outcomes.c2.entries[0];

async function appApi(page: Page): Promise<AppApi> {
  return page.evaluate(() => (window as unknown as { __app: AppApi }).__app);
}

function attachErrorCapture(page: Page): { console: string[]; page: string[] } {
  const sink = { console: [] as string[], page: [] as string[] };
  page.on('console', (m) => {
    if (m.type() === 'error') sink.console.push(m.text());
  });
  page.on('pageerror', (e) => sink.page.push(e.message));
  return sink;
}

function attachNetworkCapture(page: Page): string[] {
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
  return external;
}

/** Click through a two-node conversation and press the revealed proceed affordance. */
async function driveConversation(scope: Locator): Promise<void> {
  const line = scope.getByTestId('npc-line');
  await expect(line).toBeVisible();

  const firstLine = (await line.textContent())?.trim() ?? '';
  await scope.getByTestId('choice-card').first().click(); // commit node 0 → advance
  await expect.poll(async () => (await line.textContent())?.trim() ?? '').not.toBe(firstLine);

  await scope.getByTestId('choice-card').first().click(); // commit terminal node
  const proceed = scope.getByTestId('conversation-proceed');
  await expect(proceed).toBeVisible();
  await proceed.click();
}

/** Select an entry's exact combo in a live crafting screen and press [건네기]. */
async function driveCrafting(scope: Locator, entry: OutcomeEntry): Promise<void> {
  await expect(scope.locator('.crafting')).toBeVisible();
  for (const id of entry.ingredients) {
    await scope.locator(`button.card[data-group="ingredient"][data-id="${id}"]`).click();
  }
  await scope.locator(`button.card[data-group="method"][data-value="${entry.method}"]`).click();
  await scope
    .locator(`button.card[data-group="declaration"][data-value="${entry.declaration}"]`)
    .click();
  const commit = scope.locator('button[data-action="commit"]');
  await expect(commit).toBeEnabled();
  await commit.click();
}

async function assertNoFormControls(page: Page): Promise<void> {
  const controls = await page.locator('select, input, textarea').count();
  expect(controls, 'native <select>/<input>/<textarea> present (membrane breach)').toBe(0);
}

test.describe('app shell — outcome channels + overlap (u8)', () => {
  test('overlap: C1 재방문 arrives when C2 conversation begins; C2 ends on 문앞 쪽지', async ({
    page,
  }) => {
    const errs = attachErrorCapture(page);
    const external = attachNetworkCapture(page);

    const response = await page.goto('/');
    expect(response, 'no navigation response for /').toBeTruthy();
    expect(response!.ok(), `bad status ${response!.status()}`).toBeTruthy();

    // ── Customer 1 entrance → conversation ────────────────────────────────
    const c1Entrance = page.getByTestId('phase-c1-entrance');
    await expect(c1Entrance).toBeVisible();
    await c1Entrance.getByTestId('entrance-greet').click();

    const c1Conv = page.getByTestId('phase-c1-conversation');
    await expect(c1Conv).toBeVisible();
    await assertNoFormControls(page);
    await driveConversation(c1Conv);

    // ── Customer 1 crafting → handover (outcome DELAYED) ──────────────────
    const c1Craft = page.getByTestId('phase-c1-crafting');
    await driveCrafting(c1Craft, c1Entry);

    // C2 entrance appears; C1's outcome is still pending (NOT yet delivered) and
    // no 재방문 notification exists — the overlap has not fired.
    const c2Entrance = page.getByTestId('phase-c2-entrance');
    await expect(c2Entrance).toBeVisible();
    await expect(page.getByTestId('revisit-notification')).toHaveCount(0);
    await expect
      .poll(async () => (await appApi(page)).customer1Phase)
      .toBe('handover');

    // ── THE OVERLAP: C2 conversation begins → C1's 재방문 outcome fires now ──
    await c2Entrance.getByTestId('entrance-greet').click();
    const c2Conv = page.getByTestId('phase-c2-conversation');
    await expect(c2Conv).toBeVisible();

    // Every phase change animates (§4.6): the incoming screen carries a named keyframe.
    await expect(c2Conv).toHaveClass(/\bphase-enter\b/);
    expect(
      await c2Conv.evaluate((el) => getComputedStyle(el as Element).animationName),
      'phase change did not animate',
    ).toBe('phase-enter');

    // The delayed result-arrival notification is now on screen, over the live C2
    // conversation (the spatial overlap), carrying C1's channel + data-driven text.
    const notification = page.getByTestId('revisit-notification');
    await expect(notification).toBeVisible();
    await expect(notification).toHaveAttribute('data-channel', c1Entry.outcome.channel); // 재방문

    const arrival = page.getByTestId('arrival-notification');
    await expect(arrival).toBeVisible();
    await expect(arrival).toContainText(c1Entry.outcome.channel);

    // Named animation on the arrival beat (not a silent insert).
    await expect(notification).toHaveClass(/\banim-portrait-enter\b/);
    expect(
      await notification.evaluate((el) => getComputedStyle(el as Element).animationName),
      'revisit notification did not animate in',
    ).toBe('portrait-enter');
    expect(
      await arrival.evaluate((el) => getComputedStyle(el as Element).animationName),
      'arrival banner did not animate in',
    ).toBe('arrival-pop');

    // The 재방문 text is the resolved outcome, straight from data/outcomes.json.
    await expect(page.getByTestId('revisit-text')).toHaveText(c1Entry.outcome.text);

    // Deterministic, predicate-driven (NOT a timer): C1 flipped handover → outcome
    // exactly because C2 reached conversation.
    const overlapApi = await appApi(page);
    expect(overlapApi.customer1Phase, 'C1 outcome not delivered at C2 conversation').toBe('outcome');
    expect(overlapApi.customer2Phase).toBe('conversation');
    expect(overlapApi.customer1OutcomeDelivered).toBe(true);

    // ── Customer 2 conversation → crafting → 문앞 쪽지 end screen ────────────
    await driveConversation(c2Conv);
    const c2Craft = page.getByTestId('phase-c2-crafting');
    await driveCrafting(c2Craft, c2Entry);

    const doorNote = page.getByTestId('door-note');
    await expect(doorNote).toBeVisible();
    await expect(doorNote).toHaveAttribute('data-channel', c2Entry.outcome.channel); // 문앞 쪽지
    await expect(page.getByTestId('door-note-text')).toHaveText(c2Entry.outcome.text);

    // ── Invariants across the whole flow ──────────────────────────────────
    await assertNoFormControls(page);
    await page.waitForLoadState('networkidle');
    expect(external, `external requests: ${external.join(' | ')}`).toEqual([]);
    expect(errs.page, `page errors: ${errs.page.join(' | ')}`).toEqual([]);
    expect(errs.console, `console errors: ${errs.console.join(' | ')}`).toEqual([]);
  });
});

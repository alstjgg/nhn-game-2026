// full-loop.spec.ts — u9's honest final gate (Playwright, chromium/headless).
//
// Where overlap.spec.ts pins the mechanic contract, THIS spec plays the demo the
// way a judge does: it clicks through BOTH customers end to end in the REAL app at
// `/`, observes the signature §1.4 overlap fire mid-play, reaches the 문앞 쪽지 end
// screen — and captures a screenshot of every phase to e2e/artifacts/*.png so the
// build is verifiable by eye, not just by assertion (the green-but-unplayable risk
// DISCOVERY.md calls out). The whole run must complete with ZERO console/page
// errors and ZERO external network requests.
//
// Text is data-driven from data/outcomes.json (no hard-coded balance), matching
// the overlap spec's discipline.
import { expect, test, type Locator, type Page } from '@playwright/test';
import { mkdirSync, readFileSync } from 'node:fs';
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
const artifactsDir = resolve(here, 'artifacts');
const outcomes = JSON.parse(
  readFileSync(resolve(here, '..', 'data', 'outcomes.json'), 'utf8'),
) as Record<string, OutcomeTable>;

// The specific (non-default) rows the spec deliberately crafts toward, so the
// asserted/visible outcome text is a known data value, not the fall-through.
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

/** Capture a full-page screenshot for a named phase into e2e/artifacts/.
 * Settles first: phase swaps cross-fade (the outgoing screen is briefly overlaid,
 * children stagger in), so a shot fired the instant a phase turns "visible" catches
 * a half-faded frame. A short wait past the slow-duration beats lands a clean frame
 * of the settled phase — this is a visual deliverable, not a timing assertion. */
async function shoot(page: Page, name: string): Promise<void> {
  await page.waitForTimeout(700);
  await page.screenshot({ path: resolve(artifactsDir, `${name}.png`), fullPage: true });
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

/** Select an entry's exact combo in a live crafting screen (leaves it ready to commit). */
async function selectCraft(scope: Locator, entry: OutcomeEntry): Promise<void> {
  await expect(scope.locator('.crafting')).toBeVisible();
  for (const id of entry.ingredients) {
    await scope.locator(`button.card[data-group="ingredient"][data-id="${id}"]`).click();
  }
  await scope.locator(`button.card[data-group="method"][data-value="${entry.method}"]`).click();
  await scope
    .locator(`button.card[data-group="declaration"][data-value="${entry.declaration}"]`)
    .click();
  await expect(scope.locator('button[data-action="commit"]')).toBeEnabled();
}

/** Press the weighted [건네기] commit. */
async function commitCraft(scope: Locator): Promise<void> {
  await scope.locator('button[data-action="commit"]').click();
}

async function assertNoFormControls(page: Page): Promise<void> {
  const controls = await page.locator('select, input, textarea').count();
  expect(controls, 'native <select>/<input>/<textarea> present (membrane breach)').toBe(0);
}

test.describe('full loop — both customers end to end (u9 final gate)', () => {
  test.beforeAll(() => {
    mkdirSync(artifactsDir, { recursive: true });
  });

  test('play the whole demo: two customers, the §1.4 overlap, the 문앞 쪽지 ending — zero errors', async ({
    page,
  }) => {
    const errs = attachErrorCapture(page);
    const external = attachNetworkCapture(page);

    const response = await page.goto('/');
    expect(response, 'no navigation response for /').toBeTruthy();
    expect(response!.ok(), `bad status ${response!.status()}`).toBeTruthy();

    // ── PHASE 1 · Customer 1 entrance ─────────────────────────────────────
    const c1Entrance = page.getByTestId('phase-c1-entrance');
    await expect(c1Entrance).toBeVisible();
    await expect(c1Entrance.getByTestId('entrance-problem')).toBeVisible();
    await assertNoFormControls(page);
    await shoot(page, '01-entrance');
    await c1Entrance.getByTestId('entrance-greet').click();

    // ── PHASE 2 · Customer 1 conversation ─────────────────────────────────
    const c1Conv = page.getByTestId('phase-c1-conversation');
    await expect(c1Conv).toBeVisible();
    await expect(c1Conv.locator('.conversation[data-tier]')).toBeVisible();
    await shoot(page, '02-conversation');
    await driveConversation(c1Conv);

    // ── PHASE 3 · Customer 1 crafting ─────────────────────────────────────
    const c1Craft = page.getByTestId('phase-c1-crafting');
    await expect(c1Craft.locator('.crafting')).toBeVisible();
    await shoot(page, '03-crafting'); // the crafting workspace (ingredient/method cards)
    await selectCraft(c1Craft, c1Entry);

    // ── PHASE 4 · the weighted [건네기] / handover ────────────────────────
    // The combo is chosen and [건네기] is glowing-ready: this is the handover
    // decision beat. Shoot it, then commit — the commit unmounts crafting and
    // brings C2 on.
    await shoot(page, '04-handover');
    await commitCraft(c1Craft);

    // C2 entrance appears; C1's outcome is DELAYED (still pending) — no 재방문 yet.
    const c2Entrance = page.getByTestId('phase-c2-entrance');
    await expect(c2Entrance).toBeVisible();
    await expect(page.getByTestId('revisit-notification')).toHaveCount(0);
    await expect.poll(async () => (await appApi(page)).customer1Phase).toBe('handover');

    // ── PHASE 5 · THE OVERLAP — C2 conversation begins → C1's 재방문 arrives ──
    await c2Entrance.getByTestId('entrance-greet').click();
    const c2Conv = page.getByTestId('phase-c2-conversation');
    await expect(c2Conv).toBeVisible();

    const notification = page.getByTestId('revisit-notification');
    await expect(notification).toBeVisible();
    await expect(notification).toHaveAttribute('data-channel', c1Entry.outcome.channel); // 재방문
    await expect(page.getByTestId('arrival-notification')).toContainText(c1Entry.outcome.channel);
    await expect(page.getByTestId('revisit-text')).toHaveText(c1Entry.outcome.text);

    // Deterministic, predicate-driven: C1 flipped handover → outcome BECAUSE C2
    // reached conversation (not a timer).
    const overlap = await appApi(page);
    expect(overlap.customer1Phase, 'C1 outcome not delivered at C2 conversation').toBe('outcome');
    expect(overlap.customer2Phase).toBe('conversation');
    expect(overlap.customer1OutcomeDelivered).toBe(true);
    // Capture the spatial overlap: the 재방문 card floating over the live C2 talk.
    await shoot(page, '05-overlap-revisit');

    // ── PHASE 6 · Customer 2 to the 문앞 쪽지 end screen ───────────────────
    await driveConversation(c2Conv);
    const c2Craft = page.getByTestId('phase-c2-crafting');
    await selectCraft(c2Craft, c2Entry);
    await commitCraft(c2Craft);

    const doorNote = page.getByTestId('door-note');
    await expect(doorNote).toBeVisible();
    await expect(doorNote).toHaveAttribute('data-channel', c2Entry.outcome.channel); // 문앞 쪽지
    await expect(page.getByTestId('door-note-text')).toHaveText(c2Entry.outcome.text);
    // Let the end-beat stagger (heading 120ms + paper 300ms delay, ~320ms each)
    // settle so the paper is fully unfolded in the screenshot.
    await page.waitForTimeout(800);
    await shoot(page, '06-door-note');

    // ── Honest invariants across the WHOLE play-through ───────────────────
    await assertNoFormControls(page);
    await page.waitForLoadState('networkidle');
    expect(external, `external requests: ${external.join(' | ')}`).toEqual([]);
    expect(errs.page, `page errors: ${errs.page.join(' | ')}`).toEqual([]);
    expect(errs.console, `console errors: ${errs.console.join(' | ')}`).toEqual([]);
  });
});

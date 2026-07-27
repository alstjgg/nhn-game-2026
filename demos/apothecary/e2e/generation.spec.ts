// Behavioral TDD-Red e2e for u13 — the app shell's ASYNC GENERATION WIRING
// (Playwright, chromium/headless). PRD §2.3 is the point-6 test: N+1 prefetch,
// silhouette entry, the door-idle waiting beat, the 25s silent fallback, and a
// three-customer roster that still plays in the deployed (stub) build.
//
// Two surfaces are driven:
//
//   1. `/` — the REAL deployed build (dist via preview). Stub-mode by
//      construction (the /ai proxy plugin is `apply:'serve'`), so this is the
//      exact artifact judges load: adapter mode, roster length, the door-idle
//      beat on the SHORT stub deadline, customer 3 playable to its outcome,
//      determinism, zero external requests.
//
//   2. `/e2e/harness/generation/index.html` — the scripted-latency harness
//      (design D10/D11). It mounts the SAME `mountApp()` with injected deps so
//      generation delays and the deadline clock are scripted instead of real.
//
// ── HARNESS CONTRACT this spec reads (u13 build owns the page) ───────────────
//   URL:    /e2e/harness/generation/index.html
//   Query:
//     mode=live|stub        which adapter the boot factory must choose. `live`
//                           feeds createBootAdapter a health-ok probe whose
//                           `createLive` returns the SCRIPTED adapter reporting
//                           mode 'live' — so `?mode=live` still makes zero
//                           network requests.
//     dialogue=ready|hold   scripted state of a PREFETCHED dialogue seed.
//     portrait=ready|hold   scripted state of a PREFETCHED portrait sheet.
//                           `hold` = the promise never settles until released.
//                           Holds apply to PREFETCH (next-customer) calls only;
//                           the customer currently on stage always gets its
//                           beats, so a hold can never freeze live input (FR-6).
//     holdFor=<customerId>  which roster customer's prefetch the holds apply to
//                           (default: the LAST roster entry = customer 3).
//     deadline=<ms>         injected `deps.deadlineMs` (the shell must not read
//                           a hardcoded 25_000 — u5 owns the constant).
//   Globals:
//     window.__testClock  = u5 ManualClock  { advance(ms), now(), pending, scheduled }
//     window.__testScript = { release('dialogue'|'portrait'): void,
//                             readonly held: { dialogue: boolean; portrait: boolean },
//                             readonly calls: { dialogue: number; portrait: number } }
//   `window.__app` is the shell's own hook, extended by u13 (FR-10):
//     customer1Phase · customer2Phase · customer1OutcomeDelivered  (v1, unchanged)
//     adapterMode · rosterIds · waiting · fallbackUsed
//     prefetch: { customerId, dialogue, portrait, startedAtPhase }[]
//
// RED until u13 lands: `data/fallback-npcs.json`, `src/app/roster.ts`, the
// extended `window.__app`, `mountApp(container, deps)` and the harness page (+
// its vite build-input line) do not exist yet — the harness `goto` 404s, the new
// getters read `undefined`, and the roster is still hardcoded to two customers.
import { expect, test, type Locator, type Page } from '@playwright/test';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const demoRoot = resolve(here, '..');
const HARNESS = '/e2e/harness/generation/index.html';

// ── data contracts (assertions are data-driven — never hardcoded copy) ───────

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
interface Choice {
  label: string;
  verb: string;
  patienceCost: number;
  clueReveals?: string[];
}
interface DialogueNode {
  npcLine: string;
  choices: Choice[];
}
interface Customer {
  id: string;
  name: string;
  portrait: string;
  problem: string;
  hiddenCause: string;
  patienceBudget: number;
  dialogueNodes: DialogueNode[];
  observationClues: { id: string; text: string }[];
}
/** data/fallback-npcs.json — customer 3 as balance-as-data (FR-14, G-1/G-4/G-7). */
interface FallbackNpcs {
  seed: number;
  stubDeadlineMs: number;
  liveDeadlineMs: number;
  waitingLine: string;
  portraitPool: string[];
  portraitPoolIndex: number;
  customer: Customer;
  outcomeTable: OutcomeTable;
}

function readJson<T>(...segments: string[]): T | null {
  try {
    return JSON.parse(readFileSync(resolve(demoRoot, ...segments), 'utf8')) as T;
  } catch {
    return null;
  }
}

const outcomes = readJson<Record<string, OutcomeTable>>('data', 'outcomes.json') ?? {};
const seedCustomers = readJson<Customer[]>('data', 'customers.json') ?? [];
const ingredients = readJson<{ id: string }[]>('data', 'ingredients.json') ?? [];
const fallbackRaw = readJson<FallbackNpcs>('data', 'fallback-npcs.json');

/** The specific (non-default) rows the drives craft toward, so texts are known data. */
const c1Entry = outcomes.c1?.entries[0];
const c2Entry = outcomes.c2?.entries[0];

/** Fails THIS test (not the whole file) while data/fallback-npcs.json is absent. */
function fallback(): FallbackNpcs {
  expect(fallbackRaw, 'data/fallback-npcs.json is missing (customer 3 has no data source)')
    .not.toBeNull();
  return fallbackRaw as FallbackNpcs;
}

// ── page-side hook types ────────────────────────────────────────────────────

interface PrefetchProbe {
  customerId: string;
  dialogue: string;
  portrait: string;
  startedAtPhase: string;
}
interface AppApi {
  // v1 getters — name AND meaning must survive u13 (FR-10 / AC-12).
  customer1Phase: string;
  customer2Phase: string;
  customer1OutcomeDelivered: boolean;
  // u13 additions.
  adapterMode: string;
  rosterIds: string[];
  waiting: boolean;
  fallbackUsed: boolean;
  prefetch: PrefetchProbe[];
}
interface ScriptApi {
  held: { dialogue: boolean; portrait: boolean };
  calls: { dialogue: number; portrait: number };
  release(track: 'dialogue' | 'portrait'): void;
}

async function appApi(page: Page): Promise<AppApi> {
  const api = await page.evaluate(() => {
    const app = (window as unknown as { __app?: AppApi }).__app;
    if (!app) return null;
    return {
      customer1Phase: app.customer1Phase,
      customer2Phase: app.customer2Phase,
      customer1OutcomeDelivered: app.customer1OutcomeDelivered,
      adapterMode: app.adapterMode,
      rosterIds: app.rosterIds,
      waiting: app.waiting,
      fallbackUsed: app.fallbackUsed,
      prefetch: app.prefetch,
    } as AppApi;
  });
  expect(api, 'window.__app is not exposed').not.toBeNull();
  return api as AppApi;
}

async function scriptCalls(page: Page): Promise<ScriptApi['calls']> {
  const calls = await page.evaluate(
    () => (window as unknown as { __testScript?: ScriptApi }).__testScript?.calls ?? null,
  );
  expect(calls, 'window.__testScript is not exposed by the generation harness').not.toBeNull();
  return calls as ScriptApi['calls'];
}

async function release(page: Page, track: 'dialogue' | 'portrait'): Promise<void> {
  await page.evaluate((t) => {
    const script = (window as unknown as { __testScript?: ScriptApi }).__testScript;
    if (!script) throw new Error('window.__testScript missing');
    script.release(t as 'dialogue' | 'portrait');
  }, track);
}

async function advanceClock(page: Page, ms: number): Promise<void> {
  await page.evaluate((delta) => {
    const clock = (window as unknown as { __testClock?: { advance(ms: number): void } })
      .__testClock;
    if (!clock) throw new Error('window.__testClock missing');
    clock.advance(delta);
  }, ms);
}

// ── capture helpers (same shape as overlap.spec.ts) ─────────────────────────

function attachErrorCapture(page: Page): { console: string[]; page: string[] } {
  const sink = { console: [] as string[], page: [] as string[] };
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') sink.console.push(`${m.type()}: ${m.text()}`);
  });
  page.on('pageerror', (e) => sink.page.push(e.message));
  return sink;
}

function attachNetworkCapture(page: Page): { external: string[]; ai: string[] } {
  const sink = { external: [] as string[], ai: [] as string[] };
  page.on('request', (req) => {
    const url = req.url();
    if (/\/ai\/(health|dialogue|portrait)/.test(url)) sink.ai.push(url);
    if (
      !/^(data:|blob:|about:)/.test(url) &&
      !url.includes('localhost') &&
      !url.includes('127.0.0.1')
    ) {
      sink.external.push(url);
    }
  });
  return sink;
}

// ── drive helpers ──────────────────────────────────────────────────────────

/**
 * Click through a conversation and press the revealed proceed affordance.
 * The craft card is skipped on purpose — it is an EARLY exit, so a driver that
 * clicked it would never observe the natural end. Returns the npc lines seen,
 * in order (the determinism probe reads them).
 */
async function driveConversation(scope: Locator, maxBeats = 8): Promise<string[]> {
  const line = scope.getByTestId('npc-line');
  await expect(line).toBeVisible({ timeout: 10_000 });
  const seen: string[] = [];

  for (let i = 0; i < maxBeats; i += 1) {
    const before = (await line.textContent())?.trim() ?? '';
    seen.push(before);
    const proceed = scope.getByTestId('conversation-proceed');
    if (await proceed.isVisible()) {
      await proceed.click();
      return seen;
    }
    await scope.locator('[data-testid="choice-card"]:not([data-verb="craft"])').first().click();
    await expect
      .poll(
        async () => {
          if (await scope.getByTestId('conversation-proceed').isVisible()) return true;
          return ((await line.textContent())?.trim() ?? '') !== before;
        },
        { timeout: 5_000 },
      )
      .toBe(true);
  }
  throw new Error('conversation never surfaced its proceed affordance');
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

/** Entrance → conversation → crafting commit for one seeded customer. */
async function driveCustomer(
  page: Page,
  id: string,
  entry: OutcomeEntry,
): Promise<{ lines: string[] }> {
  const entrance = page.getByTestId(`phase-${id}-entrance`);
  await expect(entrance).toBeVisible({ timeout: 15_000 });
  await entrance.getByTestId('entrance-greet').click();
  const conv = page.getByTestId(`phase-${id}-conversation`);
  await expect(conv).toBeVisible();
  const lines = await driveConversation(conv);
  await driveCrafting(page.getByTestId(`phase-${id}-crafting`), entry);
  return { lines };
}

/** Assert nothing on screen reads like a failure, a spinner, or a countdown (FR-8). */
async function assertNoFailureUi(page: Page, scope: Locator): Promise<void> {
  const spinners = await page
    .locator('[role="progressbar"], .spinner, [data-testid*="spinner"], [data-testid*="loading"]')
    .count();
  expect(spinners, 'a spinner/loading affordance is on screen (FR-8: never)').toBe(0);
  const text = (await scope.textContent()) ?? '';
  expect(text, 'failure copy leaked into the waiting beat').not.toMatch(/오류|실패|에러|error/i);
}

// ── source-scan helpers (G-5: FR-2/FR-12/NFR-5/NFR-6 are pinned here, because
// tests/pipeline/ belongs to u5 and is outside this unit's file globs) ───────

function tsFilesUnder(...segments: string[]): string[] {
  const root = resolve(demoRoot, ...segments);
  const out: string[] = [];
  const walk = (dir: string): void => {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      if (statSync(full).isDirectory()) walk(full);
      else if (full.endsWith('.ts')) out.push(full);
    }
  };
  try {
    walk(root);
  } catch {
    /* a missing directory is reported by the caller's expectation on file count */
  }
  return out.sort();
}

interface Hit {
  file: string;
  line: number;
  text: string;
}

/**
 * Grep source lines, ignoring comment-only lines: a doc comment that NAMES a
 * banned pattern (this codebase's comments discuss `setTimeout` and `fetch` at
 * length) is documentation, not a call.
 */
function scanSource(files: readonly string[], pattern: RegExp): Hit[] {
  const hits: Hit[] = [];
  for (const file of files) {
    const lines = readFileSync(file, 'utf8').split('\n');
    lines.forEach((text, index) => {
      const trimmed = text.trim();
      if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) return;
      if (pattern.test(text)) {
        hits.push({ file: relative(demoRoot, file), line: index + 1, text: trimmed });
      }
    });
  }
  return hits;
}

const shellFiles = (): string[] => [...tsFilesUnder('src', 'app'), ...tsFilesUnder('src', 'screens')];
const fmt = (hits: readonly Hit[]): string =>
  hits.map((h) => `${h.file}:${h.line} ${h.text}`).join('\n');

// ═══════════════════════════════════════════════════════════════════════════
test.describe('u13 — boot adapter selection + single injected instance (AC-1)', () => {
  test('AC-1a the deployed build boots the STUB adapter and never touches /ai', async ({
    page,
  }) => {
    const errs = attachErrorCapture(page);
    const net = attachNetworkCapture(page);

    const response = await page.goto('/');
    expect(response?.ok(), `bad status ${response?.status()}`).toBeTruthy();
    await expect(page.getByTestId('phase-c1-entrance')).toBeVisible();

    const api = await appApi(page);
    expect(api.adapterMode, 'deployed dist must be stub-mode by construction').toBe('stub');
    // v1 getters are untouched (FR-10 non-destructive extension).
    expect(api.customer1Phase).toBe('entrance');
    expect(api.customer1OutcomeDelivered).toBe(false);

    await page.waitForLoadState('networkidle');
    expect(net.ai, `PROD probed the proxy: ${net.ai.join(' | ')}`).toEqual([]);
    expect(net.external, `external requests: ${net.external.join(' | ')}`).toEqual([]);
    expect(errs.page, `page errors: ${errs.page.join(' | ')}`).toEqual([]);
    expect(errs.console, `console output: ${errs.console.join(' | ')}`).toEqual([]);
  });

  test('AC-1b screen + shell modules never reach the network themselves (FR-2)', async () => {
    const files = shellFiles();
    expect(files.length, 'no source files found under src/app + src/screens').toBeGreaterThan(0);
    const hits = scanSource(files, /\bfetch\s*\(|XMLHttpRequest|\bimport\s*\(|navigator\.sendBeacon/);
    expect(hits.length, `direct network access in shell/screen code:\n${fmt(hits)}`).toBe(0);
  });

  test('AC-1c health-ok makes the boot factory choose live; the app uses that ONE instance', async ({
    page,
  }) => {
    const net = attachNetworkCapture(page);
    const stub = await page.goto(`${HARNESS}?mode=stub`);
    expect(stub?.ok(), `harness 404 (${stub?.status()}) — page not built`).toBeTruthy();
    await expect(page.getByTestId('phase-c1-entrance')).toBeVisible();
    expect((await appApi(page)).adapterMode).toBe('stub');

    await page.goto(`${HARNESS}?mode=live`);
    await expect(page.getByTestId('phase-c1-entrance')).toBeVisible();
    expect((await appApi(page)).adapterMode, 'health ok must select the live adapter').toBe('live');

    // Every AI call in the app went through the INJECTED instance: the scripted
    // adapter's counters move as soon as a conversation pulls beats or a
    // prefetch starts. A screen that built its own adapter would leave 0.
    await page.getByTestId('phase-c1-entrance').getByTestId('entrance-greet').click();
    await expect(page.getByTestId('phase-c1-conversation')).toBeVisible();
    await expect
      .poll(async () => (await scriptCalls(page)).dialogue, { timeout: 5_000 })
      .toBeGreaterThan(0);
    expect(net.external, `external requests: ${net.external.join(' | ')}`).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
test.describe('u13 — N+1 prefetch trigger + non-blocking input (AC-2, AC-3)', () => {
  test('AC-2a customer 2 prefetch starts the moment customer 1 conversation begins', async ({
    page,
  }) => {
    await page.goto('/');
    const roster = (await appApi(page)).rosterIds;
    expect(roster.length, 'roster must hold three customers').toBe(3);
    expect((await appApi(page)).prefetch, 'nothing may be prefetched before any conversation')
      .toEqual([]);

    await page.getByTestId('phase-c1-entrance').getByTestId('entrance-greet').click();
    await expect(page.getByTestId('phase-c1-conversation')).toBeVisible();

    const entry = (await appApi(page)).prefetch.find((p) => p.customerId === roster[1]);
    expect(entry, `no prefetch for ${roster[1]} at customer 1's conversation start`).toBeTruthy();
    expect(entry!.dialogue, 'dialogue track never left idle').not.toBe('idle');
    expect(entry!.portrait, 'portrait track never left idle').not.toBe('idle');
    expect(entry!.startedAtPhase, 'prefetch must be attributed to the conversation it began in')
      .toContain('conversation');
    // Customer 3 is one step further out — not started yet.
    const early = (await appApi(page)).prefetch.find((p) => p.customerId === roster[2]);
    expect(early?.dialogue ?? 'idle', 'customer 3 prefetched too early (N+2)').toBe('idle');
  });

  test('AC-2b customer 3 prefetch starts the moment customer 2 conversation begins', async ({
    page,
  }) => {
    expect(c1Entry, 'data/outcomes.json c1 has no entries').toBeTruthy();
    await page.goto('/');
    const roster = (await appApi(page)).rosterIds;

    await driveCustomer(page, 'c1', c1Entry!);
    const c2Entrance = page.getByTestId('phase-c2-entrance');
    await expect(c2Entrance).toBeVisible();
    await c2Entrance.getByTestId('entrance-greet').click();
    await expect(page.getByTestId('phase-c2-conversation')).toBeVisible();

    const entry = (await appApi(page)).prefetch.find((p) => p.customerId === roster[2]);
    expect(entry, `no prefetch for ${roster[2]} at customer 2's conversation start`).toBeTruthy();
    expect(entry!.dialogue).not.toBe('idle');
    expect(entry!.portrait).not.toBe('idle');

    // NFR-3: the signature overlap is not delayed by the prefetch trigger.
    const api = await appApi(page);
    expect(api.customer1OutcomeDelivered, 'prefetch trigger delayed the §1.4 overlap').toBe(true);
  });

  test('AC-3 a pending prefetch never blocks conversation input', async ({ page }) => {
    const roster0 = seedCustomers[0]?.id ?? 'c1';
    await page.goto(`${HARNESS}?dialogue=hold&portrait=hold&holdFor=${roster0}&deadline=25000`);
    // holdFor targets customer 1 here on purpose: the customer ON STAGE is
    // customer 1, so this pins that a held prefetch for the *stage* customer's
    // own tracks still cannot freeze the beats the player is clicking through.
    await page.getByTestId('phase-c1-entrance').getByTestId('entrance-greet').click();
    const conv = page.getByTestId('phase-c1-conversation');
    await expect(conv).toBeVisible();

    const line = conv.getByTestId('npc-line');
    await expect(line).toBeVisible({ timeout: 5_000 });
    const before = (await line.textContent())?.trim() ?? '';

    const start = Date.now();
    await conv.locator('[data-testid="choice-card"]:not([data-verb="craft"])').first().click();
    await expect
      .poll(async () => (await line.textContent())?.trim() ?? '', { timeout: 2_000 })
      .not.toBe(before);
    expect(Date.now() - start, 'next beat took longer than 2s while a prefetch was pending')
      .toBeLessThan(2_000);

    const pending = (await appApi(page)).prefetch.some((p) => p.dialogue === 'pending');
    expect(pending, 'the scripted hold did not actually leave a prefetch pending').toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
test.describe('u13 — scenario A: silhouette entry, zero reflow (AC-4)', () => {
  const scenarioA = (id: string): string =>
    `${HARNESS}?dialogue=ready&portrait=hold&holdFor=${id}&deadline=25000`;

  test('AC-4a dialogue ready + portrait late ⇒ the customer enters as a backlit silhouette', async ({
    page,
  }) => {
    expect(c1Entry).toBeTruthy();
    await page.goto(scenarioA(seedCustomers[1]?.id ?? 'c2'));
    await driveCustomer(page, 'c1', c1Entry!);

    // Dialogue was ready, so there is NO door-idle beat — the customer walks in.
    expect((await appApi(page)).waiting, 'waiting beat played although dialogue was ready')
      .toBe(false);
    await expect(page.getByTestId('waiting')).toHaveCount(0);

    const c2Entrance = page.getByTestId('phase-c2-entrance');
    await expect(c2Entrance).toBeVisible();
    await c2Entrance.getByTestId('entrance-greet').click();
    const conv = page.getByTestId('phase-c2-conversation');
    await expect(conv).toBeVisible();

    const cell = conv.getByTestId('portrait-cell');
    await expect(cell).toBeVisible();
    await expect(cell, 'portrait did not enter as a silhouette').toHaveClass(/--silhouette\b/);
    expect(
      await cell.evaluate((el) => getComputedStyle(el as Element).filter),
      '역광 silhouette must be filter: brightness(0) (no compositing)',
    ).toMatch(/brightness\(0\)/);
    // A silhouette is a designed beat, not a failure state.
    await assertNoFailureUi(page, conv);
  });

  test('AC-4b the sheet resolves in the SAME node with an identical layout box', async ({
    page,
  }) => {
    expect(c1Entry).toBeTruthy();
    const errs = attachErrorCapture(page);
    await page.goto(scenarioA(seedCustomers[1]?.id ?? 'c2'));
    await driveCustomer(page, 'c1', c1Entry!);
    await page.getByTestId('phase-c2-entrance').getByTestId('entrance-greet').click();
    const conv = page.getByTestId('phase-c2-conversation');
    await expect(conv).toBeVisible();

    const cell = conv.getByTestId('portrait-cell');
    const frame = conv.getByTestId('portrait-frame');
    await expect(cell).toHaveClass(/--silhouette\b/);
    // Let the phase-enter / portrait-enter keyframes finish before measuring.
    await page.waitForTimeout(900);

    // Stamp the live node so "resolved in the same node" is provable identity,
    // not a same-looking replacement.
    await cell.evaluate((el) => el.setAttribute('data-u13-probe', 'same-node'));
    const boxBefore = {
      conversation: await conv.boundingBox(),
      frame: await frame.boundingBox(),
      cell: await cell.boundingBox(),
    };

    await release(page, 'portrait');
    await expect(cell, 'portrait never resolved after the sheet arrived').not.toHaveClass(
      /--silhouette\b/,
    );
    await page.waitForTimeout(900); // resolve keyframes settle

    expect(
      await conv.locator('[data-testid="portrait-cell"][data-u13-probe="same-node"]').count(),
      'the portrait node was REPLACED on arrival (must resolve in place)',
    ).toBe(1);
    const boxAfter = {
      conversation: await conv.boundingBox(),
      frame: await frame.boundingBox(),
      cell: await cell.boundingBox(),
    };
    expect(boxAfter, 'the portrait arrival reflowed the conversation layout').toEqual(boxBefore);

    // The arrival carries the sheet (not just a class flip).
    expect(
      await cell.evaluate((el) => getComputedStyle(el as Element).backgroundImage),
      'the arrived sheet was never painted into the cell',
    ).toMatch(/url\(/);
    expect(errs.console, `console output: ${errs.console.join(' | ')}`).toEqual([]);
    expect(errs.page, `page errors: ${errs.page.join(' | ')}`).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
test.describe('u13 — scenario B: door-idle beat + silent 25s fallback (AC-5, AC-6)', () => {
  const scenarioB = (id: string): string =>
    `${HARNESS}?dialogue=hold&portrait=hold&holdFor=${id}&deadline=25000`;

  test('AC-5 nothing ready ⇒ the door-idle beat plays with no error UI, spinner or countdown', async ({
    page,
  }) => {
    const data = fallback();
    expect(c1Entry).toBeTruthy();
    const nextId = seedCustomers[1]?.id ?? 'c2';
    await page.goto(scenarioB(nextId));
    await driveCustomer(page, 'c1', c1Entry!);

    const waiting = page.getByTestId('waiting');
    await expect(waiting, 'no door-idle beat when nothing was ready').toBeVisible();
    expect((await appApi(page)).waiting).toBe(true);
    await expect(page.getByTestId(`phase-${nextId}-entrance`)).toHaveCount(0);

    // Ambient line comes from data (waiting.ts owns no copy; u13 owns no copy).
    await expect(page.getByTestId('waiting-line')).toHaveText(data.waitingLine);
    await assertNoFailureUi(page, waiting);
    const residue = ((await waiting.textContent()) ?? '').split(data.waitingLine).join('');
    expect(residue, 'a numeric countdown is on screen (FR-8 forbids it)').not.toMatch(/\d/);
  });

  test('AC-6 the beat holds to 24_999ms on the injected clock, then falls back silently at 25_000', async ({
    page,
  }) => {
    const data = fallback();
    expect(c1Entry).toBeTruthy();
    const errs = attachErrorCapture(page);
    const net = attachNetworkCapture(page);
    const nextId = seedCustomers[1]?.id ?? 'c2';
    await page.goto(scenarioB(nextId));
    await driveCustomer(page, 'c1', c1Entry!);
    await expect(page.getByTestId('waiting')).toBeVisible();

    // One tick short of the live spec deadline: still waiting, nothing fell back.
    await advanceClock(page, 24_999);
    await expect(page.getByTestId('waiting'), 'fell back before the deadline').toBeVisible();
    let api = await appApi(page);
    expect(api.waiting).toBe(true);
    expect(api.fallbackUsed, 'fallback fired early').toBe(false);

    // 25_000 exactly: silent fallback to bundled portrait pool + stub dialogue.
    await advanceClock(page, 1);
    const conv = page.getByTestId(`phase-${nextId}-conversation`);
    const entrance = page.getByTestId(`phase-${nextId}-entrance`);
    await expect
      .poll(async () => (await entrance.count()) + (await conv.count()), { timeout: 10_000 })
      .toBeGreaterThan(0);
    if (await entrance.isVisible()) await entrance.getByTestId('entrance-greet').click();
    await expect(conv, 'play did not continue after the deadline').toBeVisible();

    api = await appApi(page);
    expect(api.fallbackUsed, '__app.fallbackUsed must record the silent degrade').toBe(true);
    expect(api.waiting, 'the waiting beat never ended').toBe(false);
    await expect(page.getByTestId('waiting')).toHaveCount(0);

    // The portrait came from the BUNDLED pool (data/fallback-npcs.json), not a
    // generated sheet, and the dialogue still paints.
    const cellBg = await conv
      .getByTestId('portrait-cell')
      .evaluate((el) => getComputedStyle(el as Element).backgroundImage);
    const pool = data.portraitPool.map((file) => file.replace(/\.[a-z0-9]+$/i, ''));
    expect(pool.length, 'data/fallback-npcs.json has an empty portraitPool').toBeGreaterThan(0);
    expect(
      pool.some((stem) => cellBg.includes(stem)),
      `portrait is not from the bundled pool (${pool.join(', ')}): ${cellBg}`,
    ).toBe(true);
    await expect(conv.getByTestId('npc-line')).toBeVisible();

    // A degrade is content, not an incident (NFR-5) and costs no network (AC-9).
    expect(errs.console, `console output around the fallback: ${errs.console.join(' | ')}`)
      .toEqual([]);
    expect(errs.page, `page errors: ${errs.page.join(' | ')}`).toEqual([]);
    expect(net.external, `external requests: ${net.external.join(' | ')}`).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
test.describe('u13 — roster of three, one code path (AC-10, AC-11, FR-9, FR-14)', () => {
  test('FR-14 data/fallback-npcs.json carries customer 3 entirely as data', async () => {
    const data = fallback();
    expect(typeof data.seed, 'seed must be data (determinism, NFR-6)').toBe('number');
    expect(data.waitingLine.trim().length, 'waitingLine is empty').toBeGreaterThan(0);
    expect(data.waitingLine, 'the ambient line must not read like a countdown').not.toMatch(/\d/);

    // The live path leaves room for the health probe plus a reasoning request.
    expect(data.liveDeadlineMs, 'live comparison deadline is 32s').toBe(32_000);
    expect(data.stubDeadlineMs).toBeGreaterThan(0);
    expect(data.stubDeadlineMs, 'the deployed door-idle beat must be short').toBeLessThanOrEqual(
      8_000,
    );

    // Bundled portrait pool: every file must actually exist in the asset pack.
    expect(data.portraitPool.length, 'portraitPool must offer at least one sheet').toBeGreaterThan(
      0,
    );
    expect(data.portraitPoolIndex, 'stub picks a FIXED index for determinism').toBe(0);
    expect(data.portraitPoolIndex).toBeLessThan(data.portraitPool.length);
    for (const file of data.portraitPool) {
      const found = readJson('assets', file) !== null || (() => {
        try {
          return statSync(resolve(demoRoot, 'assets', file)).isFile();
        } catch {
          return false;
        }
      })();
      expect(found, `portraitPool references a missing asset: assets/${file}`).toBe(true);
    }

    // Customer shape (same schema as data/customers.json — validated by u6's loader).
    const c3 = data.customer;
    expect(c3.id.length).toBeGreaterThan(0);
    expect(seedCustomers.map((c) => c.id), 'customer 3 id collides with a seeded id').not.toContain(
      c3.id,
    );
    expect(c3.name.length).toBeGreaterThan(0);
    expect(c3.problem.length).toBeGreaterThan(0);
    expect(c3.hiddenCause.length).toBeGreaterThan(0);
    expect(c3.patienceBudget, 'patienceBudget must be data').toBeGreaterThan(0);
    expect(c3.dialogueNodes.length, 'customer 3 needs canned dialogue nodes').toBeGreaterThan(0);
    expect(c3.observationClues.length, 'customer 3 needs observation clues').toBeGreaterThan(0);
    for (const node of c3.dialogueNodes) {
      expect(node.npcLine.length).toBeGreaterThan(0);
      expect(node.choices.length).toBeGreaterThan(0);
    }

    // Outcome table (G-1: carried here because data/outcomes.json is out of glob).
    expect(data.outcomeTable.default.text.length, 'outcomeTable.default is required').toBeGreaterThan(
      0,
    );
    expect(data.outcomeTable.entries.length, 'need one craftable row to drive').toBeGreaterThan(0);
    const ids = new Set(ingredients.map((i) => i.id));
    for (const entry of data.outcomeTable.entries) {
      for (const ing of entry.ingredients) {
        expect(ids.has(ing), `outcomeTable references unknown ingredient "${ing}"`).toBe(true);
      }
    }
  });

  test('AC-11 the roster has ONE code path — no mode branch on screen flow', async () => {
    const files = [resolve(demoRoot, 'src', 'app', 'roster.ts'), ...shellFiles()];
    const present = files.filter((f) => {
      try {
        return statSync(f).isFile();
      } catch {
        return false;
      }
    });
    expect(present, 'src/app/roster.ts does not exist').toContain(
      resolve(demoRoot, 'src', 'app', 'roster.ts'),
    );
    const hits = scanSource(present, /mode\s*[=!]==\s*['"](live|stub)['"]|['"](live|stub)['"]\s*[=!]==\s*.*mode/);
    expect(
      hits.length,
      `screen flow branches on adapter mode (only the injected adapter may differ):\n${fmt(hits)}`,
    ).toBe(0);
  });

  test('FR-9 customer 3 arrives only on an explicit player affordance', async ({ page }) => {
    expect(c1Entry && c2Entry).toBeTruthy();
    await page.goto('/');
    const roster = (await appApi(page)).rosterIds;
    await driveCustomer(page, 'c1', c1Entry!);
    await driveCustomer(page, 'c2', c2Entry!);

    // §1.4-5 must stay stable: the 문앞 쪽지 end screen is not swapped by a timer.
    const doorNote = page.getByTestId('door-note');
    await expect(doorNote).toBeVisible();
    const cont = page.getByTestId('continue-to-next');
    await expect(cont, 'no explicit continue affordance after the door note').toBeVisible();
    expect(
      await cont.evaluate((el) => el.tagName.toLowerCase()),
      'the affordance must be a card primitive, not a native form control',
    ).toBe('button');
    await expect(cont).toHaveClass(/\bcard\b/);

    // No auto-transition: the door note is still on stage after a generous wait.
    await page.waitForTimeout(2_500);
    await expect(doorNote, 'customer 3 auto-advanced (flakes §1.4-5)').toBeVisible();
    expect((await appApi(page)).waiting, 'the shop started waiting on its own').toBe(false);
    await expect(page.getByTestId(`phase-${roster[2]}-entrance`)).toHaveCount(0);

    await cont.click();
    await expect
      .poll(
        async () =>
          (await page.getByTestId('waiting').count()) +
          (await page.getByTestId(`phase-${roster[2]}-entrance`).count()),
        { timeout: 10_000 },
      )
      .toBeGreaterThan(0);
  });

  test('AC-10 the deployed stub build plays all THREE customers to the outcome', async ({
    page,
  }) => {
    const data = fallback();
    expect(c1Entry && c2Entry).toBeTruthy();
    const errs = attachErrorCapture(page);
    const net = attachNetworkCapture(page);

    await page.goto('/');
    const roster = (await appApi(page)).rosterIds;
    expect(roster.length).toBe(3);
    expect(roster.slice(0, 2)).toEqual(seedCustomers.slice(0, 2).map((c) => c.id));
    expect(roster[2], 'the third slot must come from data/fallback-npcs.json').toBe(
      data.customer.id,
    );

    await driveCustomer(page, 'c1', c1Entry!);
    await driveCustomer(page, 'c2', c2Entry!);
    await page.getByTestId('continue-to-next').click();

    // The deployed build actually SHOWS the door-idle beat → silent fallback,
    // on the short stub deadline (real clock, so this pins NFR-10 too).
    const waiting = page.getByTestId('waiting');
    await expect(waiting, 'the deployed demo never shows the door-idle beat').toBeVisible();
    await assertNoFailureUi(page, waiting);

    const c3 = roster[2];
    const entrance = page.getByTestId(`phase-${c3}-entrance`);
    await expect(entrance, 'customer 3 never arrived in stub mode').toBeVisible({
      timeout: data.stubDeadlineMs + 6_000,
    });
    await entrance.getByTestId('entrance-greet').click();

    const conv = page.getByTestId(`phase-${c3}-conversation`);
    await expect(conv).toBeVisible();
    const lines = await driveConversation(conv);
    expect(
      lines.some((l) => data.customer.dialogueNodes.some((n) => l.includes(n.npcLine))),
      'customer 3 did not speak its canned dialogue',
    ).toBe(true);

    const entry3 = data.outcomeTable.entries[0];
    await driveCrafting(page.getByTestId(`phase-${c3}-crafting`), entry3);
    await expect(page.getByTestId(`phase-${c3}-outcome`)).toBeVisible();
    await expect(page.locator('body')).toContainText(entry3.outcome.text);

    expect((await appApi(page)).fallbackUsed, 'stub roster must record the fallback').toBe(true);
    expect(await page.locator('select, input, textarea').count(), 'membrane breach').toBe(0);
    expect(net.ai, `the deployed build called the proxy: ${net.ai.join(' | ')}`).toEqual([]);
    expect(net.external, `external requests: ${net.external.join(' | ')}`).toEqual([]);
    expect(errs.page, `page errors: ${errs.page.join(' | ')}`).toEqual([]);
    expect(errs.console, `console output: ${errs.console.join(' | ')}`).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
test.describe('u13 — determinism, no game-logic timers, zero external traffic (AC-7…AC-9, AC-13)', () => {
  test('AC-7 two loads of the same click sequence produce identical observable text', async ({
    page,
  }) => {
    const probe = async (): Promise<{ lines: string[]; labels: string[]; roster: string[] }> => {
      await page.goto('/');
      const roster = (await appApi(page)).rosterIds;
      await page.getByTestId('phase-c1-entrance').getByTestId('entrance-greet').click();
      const conv = page.getByTestId('phase-c1-conversation');
      await expect(conv).toBeVisible();
      const lines: string[] = [];
      const labels: string[] = [];
      for (let i = 0; i < 2; i += 1) {
        await expect(conv.getByTestId('npc-line')).toBeVisible();
        lines.push((await conv.getByTestId('npc-line').textContent())?.trim() ?? '');
        labels.push(...(await conv.getByTestId('choice-card').allTextContents()));
        if (await conv.getByTestId('conversation-proceed').isVisible()) break;
        const before = lines[lines.length - 1];
        await conv.locator('[data-testid="choice-card"]:not([data-verb="craft"])').first().click();
        await expect
          .poll(
            async () =>
              (await conv.getByTestId('conversation-proceed').isVisible()) ||
              ((await conv.getByTestId('npc-line').textContent())?.trim() ?? '') !== before,
            { timeout: 5_000 },
          )
          .toBe(true);
      }
      return { lines, labels, roster };
    };

    const first = await probe();
    const second = await probe();
    expect(first.lines.length, 'no dialogue observed at all').toBeGreaterThan(0);
    expect(second, 'stub mode is not deterministic across reloads').toEqual(first);
  });

  test('AC-8 no generation-wait timer in src/app/** or src/screens/**', async () => {
    // Allowlist = MISSED-ANIMATIONEND cleanup only, pinned to file × constant name.
    // FR-12 names just `EXIT_FALLBACK_MS`; `BEAT_FALLBACK_MS` is the same class of
    // guard (crafting's commit beat, added by the crafting unit) and lives outside
    // u13's file globs, so u13 cannot remove it — recorded in DISCOVERY.md.
    // Anything else here is a generation wait and must fail.
    const ANIMATION_CLEANUP: readonly (readonly [string, string])[] = [
      ['src/app/index.ts', 'EXIT_FALLBACK_MS'],
      ['src/screens/crafting/index.ts', 'BEAT_FALLBACK_MS'],
    ];
    const files = shellFiles();
    const hits = scanSource(files, /\b(setTimeout|setInterval|requestIdleCallback)\b/);
    const offenders = hits.filter(
      (h) => !ANIMATION_CLEANUP.some(([file, name]) => h.file === file && h.text.includes(name)),
    );
    expect(
      offenders.length,
      `timers outside the animation-cleanup allowlist:\n${fmt(offenders)}`,
    ).toBe(0);
  });

  test('AC-8b randomness and time flow only through injected rng/clock (NFR-6)', async () => {
    const files = shellFiles();
    const hits = scanSource(files, /Math\.random\s*\(|Date\.now\s*\(|new Date\s*\(|performance\.now\s*\(/);
    expect(hits.length, `un-injected nondeterminism in shell/screen code:\n${fmt(hits)}`).toBe(0);
  });

  test('NFR-5 degrades are silent — no console.error/warn in shell or screens', async () => {
    const files = shellFiles();
    const hits = scanSource(files, /console\.(error|warn)\s*\(/);
    expect(hits.length, `console noise in shell/screen code:\n${fmt(hits)}`).toBe(0);
  });

  test('AC-13 the built dist keeps relative base and carries no provider names', async () => {
    const bundles: string[] = [];
    const walk = (dir: string): void => {
      for (const name of readdirSync(dir)) {
        const full = join(dir, name);
        if (statSync(full).isDirectory()) walk(full);
        else if (/\.(js|css|html)$/.test(full)) bundles.push(full);
      }
    };
    try {
      walk(resolve(demoRoot, 'dist'));
    } catch {
      /* reported by the expectation below */
    }
    expect(bundles.length, 'dist/ was not built').toBeGreaterThan(0);
    const leaks = bundles.filter((f) => /ANTHROPIC|OPENAI/.test(readFileSync(f, 'utf8')));
    expect(leaks.map((f) => relative(demoRoot, f)), 'provider names leaked into dist').toEqual([]);

    const indexHtml = readFileSync(resolve(demoRoot, 'dist', 'index.html'), 'utf8');
    expect(indexHtml, "dist must keep base:'./' (Pages subpath safety)").not.toMatch(
      /(src|href)="\/(?!\/)/,
    );

    // Review follow-up (PR #33, R2 on src/pipeline/persona.ts:10): the client
    // needs `traitTable` and `verbCosts` from data/generation.json and nothing
    // else. The proxy's prompt scaffolding — styleBible / portraitSheetFormat /
    // tierTones — must never be published, and a DEFAULT import of that JSON is
    // what ships it (the rule is written in src/ui/pixelate.ts:18-24). The guard
    // therefore reads the REAL artifact rather than a single-module test build.
    const generation = JSON.parse(
      readFileSync(resolve(demoRoot, 'data', 'generation.json'), 'utf8'),
    ) as { styleBible: string; portraitSheetFormat: string; tierTones: string[] };
    const serverOnly: readonly (readonly [string, string])[] = [
      ['styleBible', generation.styleBible],
      ['portraitSheetFormat', generation.portraitSheetFormat],
      ...generation.tierTones.map((tone, i): readonly [string, string] => [`tierTones[${i}]`, tone]),
    ];
    for (const [field, prose] of serverOnly) {
      // Compare on a distinctive slice: minification cannot rewrite string
      // contents, so a substring hit is a real leak of that field's prose.
      const needle = prose.slice(0, 24);
      const leaked = bundles.filter((f) => readFileSync(f, 'utf8').includes(needle));
      expect(
        leaked.map((f) => relative(demoRoot, f)),
        `${field} (server-side prompt scaffolding) leaked into dist — check for a default import of data/generation.json`,
      ).toEqual([]);
    }
  });
});

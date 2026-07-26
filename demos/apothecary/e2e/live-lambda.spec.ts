import { expect, test, type Locator, type Page, type Response } from '@playwright/test';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

type Json = Record<string, unknown>;

interface Exchange {
  request: {
    method: string;
    url: string;
    body: Json | null;
  };
  response: {
    status: number;
    headers: Record<string, string>;
    body: Json;
  };
}

interface OutcomeEntry {
  ingredients: string[];
  method: string;
  declaration: string;
  outcome: {
    text: string;
  };
}

interface CustomerEntry {
  id: string;
  problem: string;
}

const here = dirname(fileURLToPath(import.meta.url));
const demoDir = resolve(here, '..');
const artifactDir = resolve(here, 'artifacts', 'live-lambda-2026-07-26');
const customers = JSON.parse(
  readFileSync(resolve(demoDir, 'data', 'customers.json'), 'utf8'),
) as CustomerEntry[];
const outcomes = JSON.parse(
  readFileSync(resolve(demoDir, 'data', 'outcomes.json'), 'utf8'),
) as Record<string, { entries: OutcomeEntry[] }>;
const fallback = JSON.parse(
  readFileSync(resolve(demoDir, 'data', 'fallback-npcs.json'), 'utf8'),
) as {
  customer: CustomerEntry;
  closingLine: string;
  outcomeTable: { entries: OutcomeEntry[] };
};
const c2Problem = customers.find((customer) => customer.id === 'c2')?.problem;
if (c2Problem === undefined) {
  throw new Error('customers.json must contain c2.');
}

function route(response: Response, pathname: string, method: string): boolean {
  return (
    new URL(response.url()).pathname === pathname &&
    response.request().method() === method
  );
}

function dialogueFor(response: Response, problem: string): boolean {
  if (!route(response, '/ai/dialogue', 'POST')) return false;
  const raw = response.request().postData();
  if (raw === null) return false;
  try {
    const body = JSON.parse(raw) as {
      customer?: { problem?: unknown };
    };
    return body.customer?.problem === problem;
  } catch {
    return false;
  }
}

async function exchange(response: Response): Promise<Exchange> {
  let body: Json | null = null;
  const raw = response.request().postData();
  if (raw !== null) body = JSON.parse(raw) as Json;
  return {
    request: {
      method: response.request().method(),
      url: response.url(),
      body,
    },
    response: {
      status: response.status(),
      headers: await response.allHeaders(),
      body: (await response.json()) as Json,
    },
  };
}

function phase(page: Page, customerId: string, name: string): Locator {
  return page.getByTestId(`phase-${customerId}-${name}`);
}

async function screenshot(page: Page, name: string): Promise<void> {
  await page.waitForTimeout(700);
  await page.screenshot({
    path: resolve(artifactDir, name),
    fullPage: true,
  });
}

async function startConversation(page: Page, customerId: string): Promise<Locator> {
  const entrance = phase(page, customerId, 'entrance');
  await expect(entrance).toBeVisible();
  await entrance.getByTestId('entrance-greet').click();
  const conversation = phase(page, customerId, 'conversation');
  await expect(conversation).toBeVisible();
  await expect(conversation.getByTestId('npc-line')).toBeVisible();
  return conversation;
}

async function leaveConversation(conversation: Locator): Promise<void> {
  const craft = conversation.locator(
    '[data-testid="choice-card"][data-verb="craft"]',
  );
  await expect(craft).toBeVisible();
  await craft.click();
}

async function craft(page: Page, customerId: string, entry: OutcomeEntry): Promise<void> {
  const scope = phase(page, customerId, 'crafting');
  await expect(scope.locator('.crafting')).toBeVisible();
  for (const id of entry.ingredients) {
    await scope
      .locator(`button.card[data-group="ingredient"][data-id="${id}"]`)
      .click();
  }
  await scope
    .locator(`button.card[data-group="method"][data-value="${entry.method}"]`)
    .click();
  await scope
    .locator(
      `button.card[data-group="declaration"][data-value="${entry.declaration}"]`,
    )
    .click();
  const commit = scope.locator('button[data-action="commit"]');
  await expect(commit).toBeEnabled();
  await commit.click();
}

test.describe('deployed Lambda + Bedrock full game', () => {
  test('uses c2/c3 dialogue and finishes one complete demo', async ({ page }) => {
    mkdirSync(artifactDir, { recursive: true });

    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    const portraitRequests: string[] = [];
    const dialogueRequests: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    page.on('pageerror', (error) => pageErrors.push(error.message));
    page.on('request', (request) => {
      const pathname = new URL(request.url()).pathname;
      if (pathname === '/ai/portrait') {
        portraitRequests.push(request.url());
      }
      if (pathname === '/ai/dialogue') dialogueRequests.push(request.url());
    });

    const healthPending = page.waitForResponse((response) =>
      route(response, '/ai/health', 'GET'),
    );
    const navigation = await page.goto('/');
    expect(navigation?.ok()).toBe(true);

    const health = await exchange(await healthPending);
    expect(health.response.status).toBe(200);
    expect(health.response.body).toMatchObject({
      ok: true,
      dialogue: true,
      portrait: false,
    });
    expect(String((health.response.body.models as Json).dialogue)).toContain(
      'nova-2-lite',
    );
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            (window as unknown as { __app?: { adapterMode?: string } }).__app
              ?.adapterMode,
        ),
      )
      .toBe('live');

    await screenshot(page, '01-c1-entrance.png');

    const c2DialoguePending = page.waitForResponse((response) =>
      dialogueFor(response, c2Problem),
    );
    const c1Conversation = await startConversation(page, 'c1');
    // Do not wait for C2's network response here. A fast player may leave the
    // current conversation immediately; the app must hold the next entrance
    // until the prefetch settles and still adopt the live seed.
    await leaveConversation(c1Conversation);
    await craft(page, 'c1', outcomes.c1!.entries[0]!);

    const c3DialoguePending = page.waitForResponse((response) =>
      dialogueFor(response, fallback.customer.problem),
    );
    const c2Conversation = await startConversation(page, 'c2');
    const c2Dialogue = await exchange(await c2DialoguePending);
    expect(c2Dialogue.response.status).toBe(200);
    expect(c2Dialogue.response.headers['x-llm-fallback']).toBe('false');
    expect(c2Dialogue.response.headers['x-request-id']).toBeTruthy();
    const c2UiLine = await c2Conversation.getByTestId('npc-line').innerText();
    const c2DialogueUiMatches =
      c2UiLine === String(c2Dialogue.response.body.npcLine);
    expect(c2DialogueUiMatches).toBe(true);
    await screenshot(page, '02-c2-live-dialogue.png');

    await expect(page.getByTestId('revisit-notification')).toBeVisible();
    await screenshot(page, '03-overlap-revisit.png');

    // Likewise, never make C2's handoff depend on awaiting the C3 request in
    // test code. The product's waiting beat owns that pending boundary.
    await leaveConversation(c2Conversation);
    await craft(page, 'c2', outcomes.c2!.entries[0]!);
    await expect(page.getByTestId('door-note-text')).toHaveText(
      outcomes.c2!.entries[0]!.outcome.text,
    );
    await page.getByTestId('continue-to-next').click();

    const c3Conversation = await startConversation(page, 'c3');
    const c3Dialogue = await exchange(await c3DialoguePending);
    expect(c3Dialogue.response.status).toBe(200);
    expect(c3Dialogue.response.headers['x-llm-fallback']).toBe('false');
    expect(c3Dialogue.response.headers['x-request-id']).toBeTruthy();
    const c3UiLine = await c3Conversation.getByTestId('npc-line').innerText();
    const c3DialogueUiMatches =
      c3UiLine === String(c3Dialogue.response.body.npcLine);
    expect(c3DialogueUiMatches).toBe(true);
    await screenshot(page, '04-c3-live-dialogue.png');

    await leaveConversation(c3Conversation);
    await craft(page, 'c3', fallback.outcomeTable.entries[0]!);
    await expect(page.getByTestId('door-note-text')).toHaveText(
      fallback.outcomeTable.entries[0]!.outcome.text,
    );
    await screenshot(page, '05-final-note.png');

    await page.getByTestId('close-shop').click();
    const closingLine = await page.getByTestId('closing-line').innerText();
    const reopenVisible = await page.getByTestId('closing-reopen').isVisible();
    const completedClosing =
      closingLine === fallback.closingLine && reopenVisible;
    expect(completedClosing).toBe(true);
    await screenshot(page, '06-closing.png');

    expect(dialogueRequests).toHaveLength(2);
    expect(portraitRequests).toEqual([]);
    expect(consoleErrors).toEqual([]);
    expect(pageErrors).toEqual([]);

    const evidence = {
      recordedAt: new Date().toISOString(),
      localUrl: 'http://127.0.0.1:4174/',
      adapterMode: await page.evaluate(
        () =>
          (window as unknown as { __app?: { adapterMode?: string } }).__app
            ?.adapterMode,
      ),
      health,
      dialogue: [c2Dialogue, c3Dialogue],
      dialogueUiMatches: {
        c2: c2DialogueUiMatches,
        c3: c3DialogueUiMatches,
      },
      dialogueRequestCount: dialogueRequests.length,
      portraitRequestCount: portraitRequests.length,
      consoleErrors,
      pageErrors,
      completedClosing,
    };
    writeFileSync(
      resolve(artifactDir, 'network-evidence.json'),
      `${JSON.stringify(evidence, null, 2)}\n`,
      'utf8',
    );
  });
});

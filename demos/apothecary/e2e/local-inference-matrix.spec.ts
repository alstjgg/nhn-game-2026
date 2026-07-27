import {
  expect,
  test,
  type Locator,
  type Page,
  type Response,
} from '@playwright/test';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

type Json = Record<string, unknown>;
type Effort = 'low' | 'medium';

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

interface ModelCase {
  id: string;
  label: string;
  slug: string;
  expectLive: boolean;
}

const NOVA_MODEL_ID = 'global.amazon.nova-2-lite-v1:0';
const HAIKU_MODEL_ID =
  'global.anthropic.claude-haiku-4-5-20251001-v1:0';

const modelCases: readonly ModelCase[] = [
  {
    id: NOVA_MODEL_ID,
    label: 'Amazon Nova 2 Lite',
    slug: 'nova-2-lite',
    expectLive: true,
  },
  {
    id: HAIKU_MODEL_ID,
    label: 'Claude Haiku 4.5',
    slug: 'claude-haiku-4-5',
    expectLive: true,
  },
];

const here = dirname(fileURLToPath(import.meta.url));
const demoDir = resolve(here, '..');
const artifactDir = resolve(
  here,
  'artifacts',
  'local-inference-matrix-2026-07-27',
);
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
  const raw = response.request().postData();
  return {
    request: {
      method: response.request().method(),
      url: response.url(),
      body: raw === null ? null : (JSON.parse(raw) as Json),
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

async function selectInference(
  page: Page,
  modelId: string,
  effort: Effort,
): Promise<void> {
  const panel = page.getByTestId('inference-panel');
  await panel.locator(`button[data-model-id="${modelId}"]`).click();
  await panel.locator(`button[data-effort="${effort}"]`).click();
  await expect(
    panel.locator(`button[data-model-id="${modelId}"]`),
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(
    panel.locator(`button[data-effort="${effort}"]`),
  ).toHaveAttribute('aria-pressed', 'true');
}

async function startConversation(
  page: Page,
  customerId: string,
): Promise<Locator> {
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

async function craft(
  page: Page,
  customerId: string,
  entry: OutcomeEntry,
): Promise<void> {
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

function inferenceFrom(exchangeValue: Exchange): Json {
  const inference = exchangeValue.request.body?.inference;
  if (typeof inference !== 'object' || inference === null) {
    throw new Error('dialogue request is missing inference selection');
  }
  return inference as Json;
}

function verifyLiveExchange(
  value: Exchange,
  model: ModelCase,
  effort: Effort,
): void {
  expect(value.response.status).toBe(200);
  expect(inferenceFrom(value)).toEqual({
    modelId: model.id,
    reasoningEffort: effort,
  });
  expect(value.response.headers['x-llm-fallback']).toBe(
    String(!model.expectLive),
  );
  expect(value.response.headers['x-llm-model']).toBe(model.id);
  expect(value.response.headers['x-llm-reasoning-effort']).toBe(effort);
  expect(Number(value.response.headers['x-llm-latency-ms'])).toBeGreaterThan(0);
  if (model.expectLive) {
    expect(
      Number(value.response.headers['x-llm-input-tokens']),
    ).toBeGreaterThan(0);
    expect(
      Number(value.response.headers['x-llm-output-tokens']),
    ).toBeGreaterThan(0);
  } else {
    expect(Number(value.response.headers['x-llm-input-tokens'])).toBe(0);
    expect(Number(value.response.headers['x-llm-output-tokens'])).toBe(0);
  }
}

test.describe('local game inference matrix', () => {
  for (const model of modelCases) {
    test(`${model.label}: low then medium, one request each`, async ({ page }) => {
      mkdirSync(artifactDir, { recursive: true });

      const consoleErrors: string[] = [];
      const pageErrors: string[] = [];
      const dialogueRequests: string[] = [];
      const portraitRequests: string[] = [];
      page.on('console', (message) => {
        if (message.type() === 'error') consoleErrors.push(message.text());
      });
      page.on('pageerror', (error) => pageErrors.push(error.message));
      page.on('request', (request) => {
        const pathname = new URL(request.url()).pathname;
        if (pathname === '/ai/dialogue') dialogueRequests.push(request.url());
        if (pathname === '/ai/portrait') portraitRequests.push(request.url());
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
      await expect(page.getByTestId('inference-connection')).toHaveAttribute(
        'data-state',
        'live',
      );

      await selectInference(page, model.id, 'low');
      const c2Pending = page.waitForResponse((response) =>
        dialogueFor(response, c2Problem),
      );
      const c1Conversation = await startConversation(page, 'c1');
      await leaveConversation(c1Conversation);
      await craft(page, 'c1', outcomes.c1!.entries[0]!);

      await selectInference(page, model.id, 'medium');
      const c3Pending = page.waitForResponse((response) =>
        dialogueFor(response, fallback.customer.problem),
      );
      const c2Conversation = await startConversation(page, 'c2');
      const c2 = await exchange(await c2Pending);
      verifyLiveExchange(c2, model, 'low');
      const c2UiLine = await c2Conversation.getByTestId('npc-line').innerText();
      expect(c2UiLine).toBe(String(c2.response.body.npcLine));
      await screenshot(page, `${model.slug}-low-c2.png`);

      await page
        .getByTestId('inference-panel')
        .locator('summary')
        .click();
      await leaveConversation(c2Conversation);
      await craft(page, 'c2', outcomes.c2!.entries[0]!);
      await expect(page.getByTestId('door-note-text')).toHaveText(
        outcomes.c2!.entries[0]!.outcome.text,
      );
      await page.getByTestId('continue-to-next').click();

      const c3Conversation = await startConversation(page, 'c3');
      const c3 = await exchange(await c3Pending);
      verifyLiveExchange(c3, model, 'medium');
      const c3UiLine = await c3Conversation.getByTestId('npc-line').innerText();
      expect(c3UiLine).toBe(String(c3.response.body.npcLine));
      await page
        .getByTestId('inference-panel')
        .locator('summary')
        .click();
      await screenshot(page, `${model.slug}-medium-c3.png`);

      // The fixed comparison panel is intentionally allowed to overlap the
      // right edge of the stage. Collapse it before interacting with the last
      // crafting grid, exactly as a player would.
      await page
        .getByTestId('inference-panel')
        .locator('summary')
        .click();
      await leaveConversation(c3Conversation);
      await craft(page, 'c3', fallback.outcomeTable.entries[0]!);
      await expect(page.getByTestId('door-note-text')).toHaveText(
        fallback.outcomeTable.entries[0]!.outcome.text,
      );
      await page.getByTestId('close-shop').click();
      await expect(page.getByTestId('closing-line')).toHaveText(
        fallback.closingLine,
      );
      await expect(page.getByTestId('closing-reopen')).toBeVisible();

      await page
        .getByTestId('inference-panel')
        .locator('summary')
        .click();
      const inferenceHistory = await page
        .getByTestId('inference-history')
        .locator('li')
        .allInnerTexts();
      expect(inferenceHistory).toHaveLength(2);
      expect(
        inferenceHistory.every((entry) =>
          entry.endsWith(model.expectLive ? 'LIVE' : '번들 폴백'),
        ),
      ).toBe(true);
      await screenshot(page, `${model.slug}-closing.png`);

      expect(dialogueRequests).toHaveLength(2);
      expect(portraitRequests).toEqual([]);
      expect(consoleErrors).toEqual([]);
      expect(pageErrors).toEqual([]);

      writeFileSync(
        resolve(artifactDir, `${model.slug}-evidence.json`),
        `${JSON.stringify(
          {
            recordedAt: new Date().toISOString(),
            model,
            localUrl: 'http://127.0.0.1:4174/',
            health,
            dialogue: {
              low: {
                customerId: 'c2',
                ...c2,
                uiLine: c2UiLine,
                uiMatches: true,
              },
              medium: {
                customerId: 'c3',
                ...c3,
                uiLine: c3UiLine,
                uiMatches: true,
              },
            },
            inferenceHistory,
            dialogueRequestCount: dialogueRequests.length,
            portraitRequestCount: portraitRequests.length,
            consoleErrors,
            pageErrors,
            completedClosing: true,
          },
          null,
          2,
        )}\n`,
        'utf8',
      );
    });
  }
});

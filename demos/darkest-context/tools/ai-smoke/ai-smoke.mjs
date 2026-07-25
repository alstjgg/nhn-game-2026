#!/usr/bin/env node
// ai-smoke — the human gate for the one path agents cannot execute: a real
// vendor call. It runs ONE /ai/decide and ONE /ai/stance through the ACTUAL
// dev proxy (server/ai-proxy.mjs), so what is verified is the shipped code
// path, not a copy of it.
//
//   Terminal 1:  cd demos/darkest-context
//                ANTHROPIC_API_KEY=... npm run dev
//   Terminal 2:  node tools/ai-smoke/ai-smoke.mjs [--port 5173]
//
// --dry-run composes both requests locally and prints them: no key, no dev
// server, no cost. That is the part automated gates may depend on; the live
// half is always a person with a personal key (CLAUDE.md rule 6).

import { readFileSync } from 'node:fs';

import { isAgentDecision } from '../../src/ai/contract.ts';
import {
  MODELS,
  composeDecidePrompt,
  composeStancePrompt,
  decideTool,
  stanceTool,
} from '../../server/ai-proxy.mjs';

const HERE = new URL('./', import.meta.url);
const DEMO_ROOT = new URL('../../', import.meta.url);

const argv = process.argv.slice(2);
const dryRun = argv.includes('--dry-run');
const port = argv.includes('--port') ? argv[argv.indexOf('--port') + 1] : '5173';
const BASE = `http://localhost:${port}`;

let failed = false;
const fail = (msg) => ((failed = true), console.error(`  x ${msg}`));
const ok = (msg) => console.log(`  ok ${msg}`);

const readJson = (url) => JSON.parse(readFileSync(url, 'utf8'));
const tryData = (name) => {
  try {
    return readJson(new URL(`data/${name}`, DEMO_ROOT));
  } catch {
    return null; // u4 has not shipped this file yet — fall back to the fixture
  }
};
const rows = (source, key) => (Array.isArray(source) ? source : (source?.[key] ?? []));

// ─────────────────────────────── request building ───────────────────────────────

const fixture = readJson(new URL('dry-run-fixture.json', HERE));
const heroesFile = tryData('heroes.json');
const cardsFile = tryData('cards.json');
const councilFile = tryData('council.json');

const cfg = {
  prompting: readJson(new URL('data/prompting.json', DEMO_ROOT)),
  heroes: heroesFile ?? fixture.heroes,
  cards: cardsFile ?? fixture.cards,
};

const heroRows = rows(cfg.heroes, 'heroes');
const cardRows = rows(cfg.cards, 'cards');
const actor = heroRows[0];
const ally = heroRows[1] ?? heroRows[0];
const card = cardRows[0];
if (!actor) {
  console.error('ai-smoke: no hero rows in data/heroes.json or the dry-run fixture.');
  process.exit(1);
}

const view = (hero, hp) => ({
  id: hero.id,
  name: hero.name,
  hp,
  hpMax: hero.stats?.hp ?? hp,
  alive: true,
});

const decideReq = {
  unitId: actor.id,
  equippedCardIds: card ? [card.id] : [],
  snapshot: {
    turn: fixture.decide.turn,
    self: { ...view(actor, fixture.decide.selfHp), gaugeTier: fixture.decide.gaugeTier },
    allies: ally === actor ? [] : [view(ally, fixture.decide.allyHp)],
    enemies: fixture.decide.enemies,
    availableActions: fixture.decide.availableActions,
    corrupted: fixture.decide.corrupted,
  },
};

const agenda = rows(councilFile, 'agendas')[0];
const stanceReq = {
  unitId: ally.id,
  equippedCardIds: card ? [card.id] : [],
  agendaId: agenda?.id ?? fixture.stance.agendaId,
  options: agenda?.options ?? fixture.stance.options,
  hintId: fixture.stance.hintId,
};

const ENDPOINTS = [
  { path: '/ai/decide', model: MODELS.decide, req: decideReq, compose: composeDecidePrompt, tool: decideTool },
  { path: '/ai/stance', model: MODELS.stance, req: stanceReq, compose: composeStancePrompt, tool: stanceTool },
];

const sheetIdsOf = (endpoint) =>
  endpoint.tool(cfg, endpoint.req).input_schema.properties.because.items.enum;

console.log(`ai-smoke — ${dryRun ? 'dry run (structure only)' : `live run against ${BASE}`}`);
console.log(
  `  data: prompting.json + ${heroesFile ? 'data/heroes.json' : 'fixture heroes'} / ` +
    `${cardsFile ? 'data/cards.json' : 'fixture cards'}`,
);
// Key state only — the value itself is never printed, logged or written down.
console.log(`  ANTHROPIC_API_KEY: ${process.env.ANTHROPIC_API_KEY ? 'present' : 'absent'}\n`);

// ────────────────────────────────── dry run ──────────────────────────────────

if (dryRun) {
  ENDPOINTS.forEach((endpoint, i) => {
    const tool = endpoint.tool(cfg, endpoint.req);
    const prompt = endpoint.compose(cfg, endpoint.req);
    console.log(`${i + 1}/2 POST ${endpoint.path} — model ${endpoint.model}`);
    console.log('  request body (client -> proxy; ids, numbers and short labels only):');
    console.log(`    ${JSON.stringify(endpoint.req)}`);
    console.log(`  forced tool: ${tool.name}  required: ${tool.input_schema.required.join(', ')}`);
    console.log(
      `    because.enum: ${JSON.stringify(sheetIdsOf(endpoint))} (minItems ` +
        `${tool.input_schema.properties.because.minItems})`,
    );
    console.log(`    action.enum:  ${JSON.stringify(tool.input_schema.properties.action.enum)}`);
    console.log('  composed system prose (stays server-side):');
    console.log(prompt.system.replace(/^/gm, '    '));
    console.log('  composed user prose (stays server-side):');
    console.log(`${prompt.user.replace(/^/gm, '    ')}\n`);
  });
  console.log('result: DRY RUN OK — structure composed, no call made, no key used.');
  process.exit(0);
}

// ────────────────────────────────── live run ──────────────────────────────────

console.log(`1/3 health — GET ${BASE}/ai/health`);
let health;
try {
  health = await (await fetch(`${BASE}/ai/health`, { signal: AbortSignal.timeout(3000) })).json();
} catch {
  console.error(
    '  x cannot reach the dev server. In terminal 1:\n' +
      '    cd demos/darkest-context && ANTHROPIC_API_KEY=... npm run dev',
  );
  process.exit(1);
}
console.log(`  models: decide=${health.models?.decide} stance=${health.models?.stance}`);
if (!health.ok) fail('the dev server process has no ANTHROPIC_API_KEY in its env');

if (health.ok) {
  for (const [i, endpoint] of ENDPOINTS.entries()) {
    console.log(`${i + 2}/3 ${endpoint.path} — POST (${endpoint.model}, a few seconds)`);
    const started = Date.now();
    const res = await fetch(`${BASE}${endpoint.path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(endpoint.req),
      signal: AbortSignal.timeout(60_000),
    });
    const body = await res.json();
    const seconds = ((Date.now() - started) / 1000).toFixed(1);
    if (!res.ok) {
      fail(`HTTP ${res.status} — ${body.error}`);
    } else if (!isAgentDecision(body, { sheetIds: sheetIdsOf(endpoint) })) {
      fail(`answer failed the shared schema gate: ${JSON.stringify(body).slice(0, 200)}`);
    } else {
      ok(`${seconds}s — action=${body.action}${body.target ? ` target=${body.target}` : ''}`);
      console.log(`      say: "${body.say}"`);
      console.log(`      because: ${body.because.join(', ')} (all resolve to sheet items)`);
    }
  }
} else {
  console.log('2-3/3 skipped — no key on the dev server');
}

console.log(
  failed
    ? '\nresult: FAIL — fix the items above and re-run before trusting the live path'
    : '\nresult: PASS — live path verified end to end through the real proxy',
);
process.exit(failed ? 1 : 0);

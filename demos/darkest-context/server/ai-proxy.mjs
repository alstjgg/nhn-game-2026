// AI dev-proxy — Vite dev-server middleware plugin (PRD §2.1). `apply: 'serve'`
// means the production build and `vite preview` physically lack these routes:
// the deployed Pages demo is stub-mode by construction, with no secrets in it.
//
// Endpoints (dev server only):
//   GET  /ai/health   → { ok, decide, stance, models }
//   POST /ai/decide   → combat turn:   ids + snapshot in, AgentDecision out
//   POST /ai/stance   → council vote:  ids + options  in, Stance out
//
// INV-2 — the key is read from process.env.ANTHROPIC_API_KEY HERE, server-side,
// PER REQUEST (never captured in a module-scope const, so exporting a key after
// the dev server booted still works and a stale process never holds one).
//
// INV-1 — the membrane at the seam: the client posts only ids, numbers and
// short labels. ALL prose is composed in this file from data/prompting.json
// plus the unit/card rows the ids resolve to. Ids that resolve to nothing are
// dropped, never echoed. data/generation.json is untouched image-pipeline data.
//
// INV-4 — forced tool-use, no prose parsing, and zero numeric fields in the
// tool schema: the model picks an enumerated action id and writes one line;
// every number stays engine-side.
//
// INV-3/5 — the answer is gated by `isAgentDecision` imported from
// src/ai/contract.ts: the exact function stub data and live answers pass.

import { readFileSync } from 'node:fs';

import { isAgentDecision } from '../src/ai/contract.ts';

const MODEL = 'claude-sonnet-5';
export const MODELS = { decide: MODEL, stance: MODEL };

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';
const MAX_TOKENS = 512;
const CALL_TIMEOUT_MS = 20_000;

const SHEET_KINDS = ['prompt', 'skill', 'mcp'];

/** Read per request — never a module-scope const (INV-2). */
const apiKey = () => process.env.ANTHROPIC_API_KEY;

/** A data row the request referenced is missing → 503, never a crash. */
class MissingDataError extends Error {
  constructor(message) {
    super(message);
    this.name = 'MissingDataError';
  }
}

const dataFile = (name) => new URL(`../data/${name}`, import.meta.url);
const readData = (name) => {
  try {
    return JSON.parse(readFileSync(dataFile(name), 'utf8'));
  } catch {
    throw new MissingDataError(`data/${name} unreadable`);
  }
};

/** Default cfg: re-read per request, so balance-as-data stays editable in dev. */
const loadCfg = () => ({
  prompting: readData('prompting.json'),
  heroes: readData('heroes.json'),
  cards: readData('cards.json'),
});

// ─────────────────────────────── sheet assembly ───────────────────────────────

/** u4 may ship `{heroes:[…]}` or a bare array; both read the same here. */
function asList(source, key) {
  if (Array.isArray(source)) return source;
  if (source && Array.isArray(source[key])) return source[key];
  throw new MissingDataError(`${key} data unavailable`);
}

function sheetKind(card) {
  const raw = String(card.kind ?? card.type ?? card.slot ?? '').toLowerCase();
  return SHEET_KINDS.includes(raw) ? raw : 'prompt';
}

/**
 * The base-persona TEXT of a hero row.
 *
 * `data/heroes.json` authors the persona as `defaultPrompt.lines` — one belief per
 * line; a single `text` field is accepted too, so a row of either shape composes.
 * Joining them is the whole of it, and it is not cosmetic: the system prose tells the
 * model that the sheet is the entirety of its personality, so an empty persona row
 * means the baseline character (must-prove 1–2, PRD §2.3) was never sent at all.
 */
function personaText(prompt) {
  if (typeof prompt.text === 'string' && prompt.text.trim() !== '') return prompt.text;
  if (Array.isArray(prompt.lines)) return prompt.lines.map(String).join(' ');
  return '';
}

/**
 * The unit's system-prompt sheet: its default prompt plus one line per equipped
 * card, in equip order. An id that resolves to no row is skipped — an
 * unresolvable id must never reach the prose (INV-1).
 *
 * @throws MissingDataError when the hero row carries no persona text at all — a
 *         blank persona is a data/composer disagreement, never a degraded answer.
 */
export function buildSheet(cfg, unitId, cardIds) {
  const heroes = asList(cfg.heroes, 'heroes');
  const cards = asList(cfg.cards, 'cards');
  const hero = heroes.find((h) => h && h.id === unitId);
  if (!hero || !hero.defaultPrompt) throw new MissingDataError('hero row unavailable');

  const persona = personaText(hero.defaultPrompt);
  if (persona.trim() === '') {
    throw new MissingDataError(`hero '${unitId}' carries no base persona text`);
  }

  const sheet = [
    {
      id: String(hero.defaultPrompt.id),
      kind: 'prompt',
      text: persona,
    },
  ];
  for (const id of Array.isArray(cardIds) ? cardIds : []) {
    const card = cards.find((c) => c && c.id === id);
    if (!card) continue;
    sheet.push({ id: String(card.id), kind: sheetKind(card), text: String(card.text ?? '') });
  }
  return sheet;
}

const lines = (value) => (Array.isArray(value) ? value.map(String) : [String(value ?? '')]);

function sheetLines(prompting, sheet) {
  const rules = prompting.sheetAssembly;
  return [
    String(rules.header),
    ...sheet.map((ref) =>
      String(rules.itemFormat)
        .replace('{id}', ref.id)
        .replace('{kind}', String(rules.kindLabels[ref.kind] ?? ref.kind))
        .replace('{text}', ref.text),
    ),
  ];
}

const clampTier = (tier) => Math.max(0, Math.min(3, Number.isInteger(tier) ? tier : 0));

const entityLine = (labels, e) =>
  `${e.name}(${e.id}) ${labels.hp} ${e.hp}/${e.hpMax}${e.alive ? '' : ' ✝'}`;

const listOrNone = (labels, entities) =>
  entities.length === 0 ? String(labels.none) : entities.map((e) => entityLine(labels, e)).join(', ');

// ────────────────────────────── prompt composition ──────────────────────────────

/** Combat prompt. Pure: same cfg + req → same strings, inputs untouched. */
export function composeDecidePrompt(cfg, req) {
  const prompting = cfg.prompting;
  const spec = prompting.decide;
  const labels = spec.labels;
  const snapshot = req.snapshot;
  const sheet = buildSheet(cfg, req.unitId, req.equippedCardIds);
  const tone = String(prompting.tierTones[clampTier(snapshot.self.gaugeTier)]);

  const system = [
    ...lines(spec.role),
    '',
    ...sheetLines(prompting, sheet),
    '',
    `${prompting.sheetAssembly.toneHeader}: ${tone}`,
    '',
    ...lines(prompting.bans),
    '',
    ...lines(spec.task),
  ].join('\n');

  const self = snapshot.self;
  const user = [
    `${spec.situationHeader} — ${labels.turn} ${snapshot.turn}`,
    `${labels.self}: ${entityLine(labels, self)}`,
    ...(self.lastHitBy === undefined ? [] : [`${labels.lastHitBy}: ${self.lastHitBy}`]),
    `${labels.allies}: ${listOrNone(labels, snapshot.allies)}`,
    `${labels.enemies}: ${listOrNone(labels, snapshot.enemies)}`,
    `${labels.actions}: ${snapshot.availableActions
      .map((a) => `${a.id}(${a.label}${a.needsTarget ? `, ${labels.needsTarget}` : ''})`)
      .join(', ')}`,
    ...(snapshot.corrupted ? [String(labels.corrupted)] : []),
  ].join('\n');

  return { system, user };
}

/** Council prompt. Same sheet rules, agenda options instead of a battlefield. */
export function composeStancePrompt(cfg, req) {
  const prompting = cfg.prompting;
  const spec = prompting.stance;
  const labels = spec.labels;
  const sheet = buildSheet(cfg, req.unitId, req.equippedCardIds);

  const system = [
    ...lines(spec.role),
    '',
    ...sheetLines(prompting, sheet),
    '',
    ...lines(prompting.bans),
    '',
    ...lines(spec.task),
  ].join('\n');

  const options = Array.isArray(req.options) ? req.options : [];
  const user = [
    `${spec.situationHeader} — ${labels.agenda}: ${req.agendaId}`,
    `${labels.options}:`,
    ...options.map((o) => `- ${o.id}: ${o.label}`),
    `${labels.hint}: ${req.hintId === undefined ? labels.none : req.hintId}`,
  ].join('\n');

  return { system, user };
}

// ──────────────────────────────── tool schemas ────────────────────────────────

const liveEntityIds = (snapshot) =>
  [snapshot.self, ...snapshot.allies, ...snapshot.enemies].filter((e) => e && e.alive).map((e) => e.id);

/** Combat tool. Enumerated ids only — no numeric property anywhere (INV-4). */
export function decideTool(cfg, req) {
  const spec = cfg.prompting.decide.tool;
  const sheetIds = buildSheet(cfg, req.unitId, req.equippedCardIds).map((ref) => ref.id);
  const actionIds = req.snapshot.availableActions.map((a) => a.id);
  const targetIds = liveEntityIds(req.snapshot);

  return {
    name: String(spec.name),
    description: String(spec.description),
    input_schema: {
      type: 'object',
      additionalProperties: false,
      required: ['action', 'say', 'because'],
      properties: {
        action: { type: 'string', enum: actionIds, description: String(spec.fields.action) },
        ...(targetIds.length === 0
          ? {}
          : { target: { type: 'string', enum: targetIds, description: String(spec.fields.target) } }),
        say: { type: 'string', description: String(spec.fields.say) },
        because: {
          type: 'array',
          minItems: 1,
          items: { type: 'string', enum: sheetIds },
          description: String(spec.fields.because),
        },
      },
    },
  };
}

/** Council tool: option ids, no target — a stance points at nobody. */
export function stanceTool(cfg, req) {
  const spec = cfg.prompting.stance.tool;
  const sheetIds = buildSheet(cfg, req.unitId, req.equippedCardIds).map((ref) => ref.id);
  const optionIds = (Array.isArray(req.options) ? req.options : []).map((o) => o.id);

  return {
    name: String(spec.name),
    description: String(spec.description),
    input_schema: {
      type: 'object',
      additionalProperties: false,
      required: ['action', 'say', 'because'],
      properties: {
        action: { type: 'string', enum: optionIds, description: String(spec.fields.action) },
        say: { type: 'string', description: String(spec.fields.say) },
        because: {
          type: 'array',
          minItems: 1,
          items: { type: 'string', enum: sheetIds },
          description: String(spec.fields.because),
        },
      },
    },
  };
}

// ───────────────────────────────── vendor call ─────────────────────────────────

/** Keep exactly the contract fields; anything the model invents is dropped. */
function pickDecision(input, withTarget) {
  if (typeof input !== 'object' || input === null) return null;
  const picked = { action: input.action, say: input.say, because: input.because };
  if (withTarget && typeof input.target === 'string') picked.target = input.target;
  return picked;
}

async function runToolCall(req, cfg, spec) {
  const key = apiKey();
  if (!key) return { status: 503, body: { error: 'ANTHROPIC_API_KEY not set on the dev server' } };

  let composed;
  let tool;
  try {
    const resolved = cfg ?? loadCfg();
    composed = spec.compose(resolved, req);
    tool = spec.tool(resolved, req);
  } catch (err) {
    // Only our own diagnostics are echoed; anything else is reported by name.
    const detail = err instanceof MissingDataError ? err.message : (err?.name ?? 'Error');
    return { status: 503, body: { error: `ai data unavailable: ${detail}` } };
  }

  const ctx = {
    sheetIds: tool.input_schema.properties.because.items.enum,
    actionIds: tool.input_schema.properties.action.enum,
  };

  // INV-4: forced tool-use lets the model pick an enumerated id and nothing
  // else. An empty enum leaves no legal answer at all, so the call could only
  // come back schema-invalid — refuse before it is spent. 503 ("cannot be
  // composed"), not 502, which means the vendor was reached and failed.
  if (ctx.actionIds.length === 0) {
    return { status: 503, body: { error: 'no action on offer — nothing to decide' } };
  }

  let res;
  try {
    res = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      signal: AbortSignal.timeout(CALL_TIMEOUT_MS),
      headers: {
        'x-api-key': key,
        'anthropic-version': ANTHROPIC_VERSION,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: composed.system,
        messages: [{ role: 'user', content: composed.user }],
        tools: [tool],
        tool_choice: { type: 'tool', name: tool.name },
      }),
    });
  } catch (err) {
    return { status: 502, body: { error: `upstream unreachable (${err?.name ?? 'Error'})` } };
  }

  if (!res.ok) {
    // INV-2: a vendor 4xx quotes the offending request back — which can carry
    // the key and the server-composed prose. Splicing that into the response
    // would push both across the membrane, so the caller gets the status and
    // nothing else (it falls back silently anyway). The detail stays here, in
    // the dev server's own terminal, with the key redacted even from that.
    const detail = String(await res.text().catch(() => '')).slice(0, 500);
    console.error(`[ai-proxy] upstream ${res.status}: ${detail.split(key).join('[key redacted]')}`);
    return { status: 502, body: { error: `upstream rejected the call (${res.status})` } };
  }

  let json;
  try {
    json = await res.json();
  } catch {
    return { status: 502, body: { error: 'upstream returned a non-JSON body' } };
  }

  const block = Array.isArray(json?.content) ? json.content.find((b) => b?.type === 'tool_use') : undefined;
  const answer = pickDecision(block?.input, spec.withTarget);
  if (!isAgentDecision(answer, ctx)) {
    return { status: 502, body: { error: 'model output failed the shared schema gate' } };
  }
  return { status: 200, body: answer };
}

const DECIDE_SPEC = { compose: composeDecidePrompt, tool: decideTool, withTarget: true };
const STANCE_SPEC = { compose: composeStancePrompt, tool: stanceTool, withTarget: false };

/** POST /ai/decide. `cfg` is injectable so tests never need u4's data files. */
export function handleDecide(req, cfg) {
  return runToolCall(req, cfg, DECIDE_SPEC);
}

/** POST /ai/stance. Same forced-tool path, council shape. */
export function handleStance(req, cfg) {
  return runToolCall(req, cfg, STANCE_SPEC);
}

// ─────────────────────────────────── plugin ───────────────────────────────────

function readJson(nodeReq) {
  return new Promise((resolve, reject) => {
    let raw = '';
    nodeReq.on('data', (chunk) => (raw += chunk));
    nodeReq.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (err) {
        reject(err);
      }
    });
    nodeReq.on('error', reject);
  });
}

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify(body));
}

function post(handler) {
  return async (nodeReq, res) => {
    if (nodeReq.method !== 'POST') return send(res, 405, { error: 'POST only' });
    try {
      const { status, body } = await handler(await readJson(nodeReq));
      send(res, status, body);
    } catch (err) {
      send(res, 502, { error: `proxy error (${err?.name ?? 'Error'})` });
    }
  };
}

export function aiProxy() {
  return {
    name: 'darkest-context-ai-proxy',
    apply: 'serve', // dev server only — the build never carries this middleware
    configureServer(server) {
      // PRD §2.1 declares exactly one verb here: the adapter's GET boot probe.
      // Anything else is a request this proxy has no answer for, and is refused
      // the same way /ai/decide refuses a non-POST.
      server.middlewares.use('/ai/health', (nodeReq, res) =>
        nodeReq.method !== 'GET'
          ? send(res, 405, { error: 'GET only' })
          : send(res, 200, {
              ok: !!apiKey(),
              decide: !!apiKey(),
              stance: !!apiKey(),
              models: { ...MODELS },
            }),
      );
      server.middlewares.use('/ai/decide', post(handleDecide));
      server.middlewares.use('/ai/stance', post(handleStance));
    },
  };
}

// AI dev-proxy — Vite dev-middleware plugin (PRD §2.1). PROVIDED INPUT: the v2
// run integrates against this; agents do not rewrite the vendor-call code here.
//
// Endpoints (dev server only — `apply: 'serve'` means the production build and
// `vite preview` never carry these, so the deployed Pages demo is stub-mode by
// construction):
//   GET  /ai/health    → { ok, dialogue, portrait, models }
//   POST /ai/dialogue  → structured game state in, DialogueBeat JSON out (claude-sonnet-5)
//   POST /ai/portrait  → trait strings in, { b64 } 4x2 expression sheet out (gpt-image-1)
//
// Keys are read from process.env HERE, server-side, per request. They never
// reach the client bundle, import.meta.env, or the repo (CLAUDE.md rule 6).
//
// Membrane: the client sends only structured fields (trait strings from
// data/generation.json, choice labels the player clicked). Prose prompts are
// composed in this file, from those fields plus data/generation.json.
// The response schema mirrors src/ai/contract.ts — one schema for stub and live.

import { readFileSync } from 'node:fs';

const GENERATION_JSON = new URL('../data/generation.json', import.meta.url);
// Re-read per request: generation.json is balance-as-data, editable mid-dev.
const gen = () => JSON.parse(readFileSync(GENERATION_JSON, 'utf8'));

const DIALOGUE_MODEL = 'claude-sonnet-5';
const PORTRAIT_MODEL = 'gpt-image-1';
const VERBS = ['indirect', 'direct', 'observe', 'craft'];

// ---------------------------------------------------------------- dialogue --

const BEAT_TOOL = {
  name: 'emit_beat',
  description: '다음 대화 비트를 출력한다.',
  input_schema: {
    type: 'object',
    additionalProperties: false,
    required: ['npcLine', 'choices'],
    properties: {
      npcLine: { type: 'string', description: '손님의 다음 대사 (한국어, 1~3문장)' },
      choices: {
        type: 'array',
        minItems: 4,
        maxItems: 4,
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['label', 'verb'],
          properties: {
            label: { type: 'string', description: '플레이어 선택 카드 문구 (한국어)' },
            verb: { type: 'string', enum: VERBS },
            clueReveals: {
              type: 'array',
              items: { type: 'string' },
              description: 'observe 카드가 밝힐 단서 id (제공된 목록에서만)',
            },
          },
        },
      },
    },
  },
};

function dialogueSystemPrompt(g, tier) {
  const tone = g.tierTones[Math.max(0, Math.min(3, tier))];
  return [
    '너는 조선풍 뒷골목 약방 게임의 손님 역할이다. 플레이어는 약방 주인이다.',
    '손님에게는 겉으로 말하는 증상과 숨기고 싶은 진짜 사정이 있다. 진짜 사정은',
    '절대 먼저 털어놓지 않고, 우회 질문에는 힌트를 흘리고, 직설적인 질문에는',
    '살짝 방어적으로 군다. 대사는 구어체 한국어, 시대극 톤은 가볍게만.',
    `현재 손님의 기분: ${tone}`,
    '',
    'emit_beat 도구로만 답한다. choices는 정확히 4장:',
    '- verb "indirect" 1장: 사정을 에둘러 묻는 우회 질문',
    '- verb "direct" 1장: 핵심을 곧장 찌르는 직접 질문',
    '- verb "observe" 1장: [관찰] 로 시작하는 관찰 행동. 제공된 단서 목록에 남은 단서가',
    '  있으면 그중 하나의 id를 clueReveals에 넣는다. 없으면 clueReveals를 비운다.',
    '- verb "craft" 1장: [조제하러 가기] 카드. label은 정확히 "[조제하러 가기]".',
    '카드 문구는 짧고 클릭할 맛이 나게. 자유 입력을 유도하는 문구는 금지.',
  ].join('\n');
}

function dialogueUserPrompt(req) {
  const history = (req.history ?? [])
    .map((h) => `손님: ${h.npcLine}\n주인(선택): ${h.playerChoiceLabel}`)
    .join('\n');
  return [
    `손님 묘사(외형/성격 소재): ${(req.customer.personaTraits ?? []).join(' ')}`,
    `겉으로 말하는 증상: ${req.customer.problem}`,
    `숨기고 있는 진짜 사정: ${req.customer.hiddenCause}`,
    `아직 밝혀지지 않은 관찰 단서 목록: ${JSON.stringify(req.availableClues ?? [])}`,
    history ? `지금까지의 대화:\n${history}` : '대화 시작: 손님이 방금 들어와 첫 마디를 꺼낸다.',
  ].join('\n\n');
}

async function handleDialogue(req) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return { status: 503, body: { error: 'ANTHROPIC_API_KEY not set' } };
  const g = gen();

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    signal: AbortSignal.timeout(30_000),
    headers: {
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: DIALOGUE_MODEL,
      max_tokens: 1024,
      system: dialogueSystemPrompt(g, req.patienceTier ?? 0),
      messages: [{ role: 'user', content: dialogueUserPrompt(req) }],
      tools: [BEAT_TOOL],
      tool_choice: { type: 'tool', name: 'emit_beat' },
    }),
  });
  if (!res.ok) {
    return { status: 502, body: { error: `anthropic ${res.status}: ${(await res.text()).slice(0, 200)}` } };
  }
  const json = await res.json();
  const beat = json.content?.find((b) => b.type === 'tool_use')?.input;
  if (!beat?.npcLine || !Array.isArray(beat.choices)) {
    return { status: 502, body: { error: 'model returned no beat' } };
  }
  // patienceCost is balance-as-data: stamped here from verbCosts, never model-chosen.
  const choices = beat.choices
    .filter((c) => VERBS.includes(c.verb))
    .map((c) => ({
      label: String(c.label),
      verb: c.verb,
      patienceCost: g.verbCosts[c.verb] ?? 1,
      ...(Array.isArray(c.clueReveals) && c.clueReveals.length ? { clueReveals: c.clueReveals.map(String) } : {}),
    }));
  return { status: 200, body: { npcLine: String(beat.npcLine), choices } };
}

// ---------------------------------------------------------------- portrait --

async function handlePortrait(req) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return { status: 503, body: { error: 'OPENAI_API_KEY not set' } };
  const g = gen();
  const traits = Array.isArray(req.traits) ? req.traits.map(String) : [];
  if (!traits.length) return { status: 400, body: { error: 'traits[] required' } };

  const prompt = `${g.styleBible} ${g.portraitSheetFormat} ${traits.join(' ')}`;
  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    signal: AbortSignal.timeout(180_000),
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: PORTRAIT_MODEL, prompt, size: '1536x1024', quality: 'low', n: 1 }),
  });
  if (!res.ok) {
    return { status: 502, body: { error: `openai ${res.status}: ${(await res.text()).slice(0, 200)}` } };
  }
  const json = await res.json();
  const b64 = json.data?.[0]?.b64_json;
  if (!b64) return { status: 502, body: { error: 'model returned no image' } };
  return { status: 200, body: { b64, prompt } };
}

// ------------------------------------------------------------------ plugin --

function readJson(nodeReq) {
  return new Promise((resolve, reject) => {
    let raw = '';
    nodeReq.on('data', (c) => (raw += c));
    nodeReq.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (e) {
        reject(e);
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
    } catch (e) {
      send(res, 502, { error: String(e?.message ?? e) });
    }
  };
}

export function aiProxy() {
  return {
    name: 'apothecary-ai-proxy',
    apply: 'serve', // dev server only — never part of the build output
    configureServer(server) {
      server.middlewares.use('/ai/health', (nodeReq, res) =>
        send(res, 200, {
          ok: !!(process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY),
          dialogue: !!process.env.ANTHROPIC_API_KEY,
          portrait: !!process.env.OPENAI_API_KEY,
          models: { dialogue: DIALOGUE_MODEL, portrait: PORTRAIT_MODEL },
        }),
      );
      server.middlewares.use('/ai/dialogue', post(handleDialogue));
      server.middlewares.use('/ai/portrait', post(handlePortrait));
    },
  };
}

#!/usr/bin/env node
// ai-smoke — verifies the live AI path through the ACTUAL dev-proxy, end to end.
// Run BEFORE the v2 pipeline run (agents can never test this path themselves).
//
// Terminal 1:  cd demos/apothecary
//              ANTHROPIC_API_KEY=... OPENAI_API_KEY=... npm run dev
// Terminal 2:  node tools/ai-smoke/ai-smoke.mjs [--port 5173]
//
// Checks: /ai/health capabilities → one real dialogue beat (schema-checked)
// → one real portrait sheet (saved to out/portrait-sheet.png for eyeballing).
// Zero dependencies. Cost ≈ a few cents. Exit code 0 = live path verified.

import { writeFile, mkdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const port = (() => {
  const i = process.argv.indexOf('--port');
  return i >= 0 ? process.argv[i + 1] : '5173';
})();
const BASE = `http://localhost:${port}`;

const gen = JSON.parse(await readFile(join(ROOT, '../../data/generation.json'), 'utf8'));
const VERBS = ['indirect', 'direct', 'observe', 'craft'];
let failed = false;
const fail = (msg) => ((failed = true), console.error(`  ✗ ${msg}`));
const ok = (msg) => console.log(`  ✓ ${msg}`);

// -------------------------------------------------------------------- health
console.log(`1/3 health — GET ${BASE}/ai/health`);
let health;
try {
  health = await (await fetch(`${BASE}/ai/health`, { signal: AbortSignal.timeout(3000) })).json();
} catch {
  console.error(`  ✗ dev 서버에 연결할 수 없음. 터미널 1에서 먼저:\n    cd demos/apothecary && ANTHROPIC_API_KEY=... OPENAI_API_KEY=... npm run dev`);
  process.exit(1);
}
console.log(`  dialogue(${health.models?.dialogue}): ${health.dialogue ? 'key OK' : 'NO KEY'} · portrait(${health.models?.portrait}): ${health.portrait ? 'key OK' : 'NO KEY'}`);
if (!health.dialogue) fail('ANTHROPIC_API_KEY가 dev 서버 환경에 없음');
if (!health.portrait) fail('OPENAI_API_KEY가 dev 서버 환경에 없음');

// ------------------------------------------------------------------ dialogue
if (health.dialogue) {
  console.log('2/3 dialogue — POST /ai/dialogue (claude, ~5s)');
  const req = {
    customer: {
      personaTraits: [gen.traitTable.archetypes[0], gen.traitTable.quirks[0]],
      problem: gen.traitTable.ailments[0].problem,
      hiddenCause: gen.traitTable.ailments[0].hiddenCause,
    },
    patienceTier: 0,
    history: [],
    availableClues: [{ id: 'clue_smoke_test', text: '눈 밑이 어둡다.' }],
  };
  const t0 = Date.now();
  const res = await fetch(`${BASE}/ai/dialogue`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(req),
    signal: AbortSignal.timeout(60_000),
  });
  const beat = await res.json();
  const dt = ((Date.now() - t0) / 1000).toFixed(1);
  if (!res.ok) {
    fail(`HTTP ${res.status} — ${beat.error}`);
  } else if (typeof beat.npcLine !== 'string' || !Array.isArray(beat.choices)) {
    fail(`응답 스키마 불일치: ${JSON.stringify(beat).slice(0, 200)}`);
  } else {
    ok(`${dt}s — 손님: "${beat.npcLine}"`);
    for (const c of beat.choices) console.log(`      [${c.verb}·비용${c.patienceCost}] ${c.label}`);
    const verbsSeen = new Set(beat.choices.map((c) => c.verb));
    if (VERBS.every((v) => verbsSeen.has(v))) ok('4개 verb 모두 등장 (multi-verb OK)');
    else fail(`verb 누락: ${VERBS.filter((v) => !verbsSeen.has(v)).join(', ')}`);
  }
} else console.log('2/3 dialogue — 건너뜀 (키 없음)');

// ------------------------------------------------------------------ portrait
if (health.portrait) {
  console.log('3/3 portrait — POST /ai/portrait (gpt-image-1, 수십 초~분)');
  const t0 = Date.now();
  const res = await fetch(`${BASE}/ai/portrait`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ traits: [gen.traitTable.archetypes[0], gen.traitTable.quirks[0]] }),
    signal: AbortSignal.timeout(200_000),
  });
  const sheet = await res.json();
  const dt = ((Date.now() - t0) / 1000).toFixed(1);
  if (!res.ok || !sheet.b64) {
    fail(`HTTP ${res.status} — ${sheet.error ?? 'no image'}`);
  } else {
    const out = join(ROOT, 'out');
    await mkdir(out, { recursive: true });
    const file = join(out, 'portrait-sheet.png');
    await writeFile(file, Buffer.from(sheet.b64, 'base64'));
    ok(`${dt}s — 저장: ${file}`);
    console.log('      눈으로 확인: 4×2 그리드(표정 4열 × 눈뜸/감음 2행), 스타일 E 픽셀톤');
    console.log(`      ※ 이 생성 소요시간(${dt}s)이 §2.3 프리페치/25s 폴백 설계의 실측 근거`);
  }
} else console.log('3/3 portrait — 건너뜀 (키 없음)');

console.log(failed ? '\n결과: FAIL — 위 항목 해결 후 재실행' : '\n결과: PASS — 라이브 경로 검증 완료, v2 런 진행 가능');
process.exit(failed ? 1 : 0);

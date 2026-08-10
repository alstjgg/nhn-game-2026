#!/usr/bin/env node
// Beat driver — runs one beat end to end and makes the wiring visible.
//
//   node drive-beat.mjs <judgment.json> <narration.json> <reporter.json> [--out=DIR] [--dry-run]
//
// WHAT THIS IS. Every call so far has been measured in isolation on hand-authored
// slots. The contract's data-flow map (call contracts §6) says Call 1's free
// output feeds Call 2 and Call 3, and Call 2's output feeds Call 3 and the
// timeline — W1 and W2. That claim had never been executed. This driver executes
// it: three calls, with each one's inputs assembled from the previous outputs
// rather than typed by hand.
//
// WHAT THIS IS NOT — and must not become. There is no state here: no variables,
// no (gate, stance) deltas, no outcome buckets, no edge predicates, no routing.
// The stance comes back and is *recorded*, not applied. That is the engine's job
// (architecture spec §3) and the engine does not exist yet. EXTENDING.md's rule
// stands: do not grow this into a game engine. When the engine arrives, it owns
// state and calls this harness per beat; this file is the seam that shows what
// the engine has to supply.
//
// The three suites are fixtures, not probes — they supply the scenario slots an
// engine would look up. Anything the wiring computes overrides them, and the
// transcript prints both so a reader can see which is which.

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CALL_TYPES, isSoft, stripSoft } from '../lib/calls.mjs';
import { composeArm } from '../lib/compose.mjs';
import { PROMPTS } from '../lib/prompts.mjs';
import { TRANSPORTS } from '../lib/transport.mjs';
import { loadSuite } from '../probe/lib/suite.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const flag = (n) => argv.includes(`--${n}`);
const opt = (n, d) => (argv.find((a) => a.startsWith(`--${n}=`)) ?? `=${d}`).split('=').slice(1).join('=');
const files = argv.filter((a) => !a.startsWith('--'));

const die = (m) => { console.error(`\n✗ ${m}\n`); process.exit(1); };
if (files.length !== 3) die('usage: node drive-beat.mjs <judgment.json> <narration.json> <reporter.json>');

const [J, N, R] = files.map((f) => loadSuite(resolve(f)));
for (const [s, want] of [[J, 'judgment'], [N, 'narration'], [R, 'reporter']]) {
  if (s.call_type !== want) die(`expected a ${want} suite, got call_type "${s.call_type}"`);
}
// One authored temperament per scenario (contract §4). Two different ones here
// would mean the agent judges as one person and writes its report as another.
if ((J.temperament ?? 'neutral') !== (R.temperament ?? 'neutral')) {
  die(`temperament mismatch: judgment "${J.temperament}" vs reporter "${R.temperament}" — same scenario, one temperament`);
}

const transport = TRANSPORTS[flag('dry-run') ? 'dryrun' : 'anthropic'];
const log = [];

/** One call, with the same hard/soft grading and retry budget the runner uses. */
async function call(suite, armName = 'baseline', maxRetries = 2) {
  const spec = CALL_TYPES[suite.call_type];
  const tool = spec.buildTool(suite);
  const { system, user } = composeArm(suite, armName, { prompts: PROMPTS });
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const res = await transport({
      system, user, tool,
      model: suite.model, maxTokens: suite.max_tokens, timeoutMs: suite.timeout_ms,
      dryPayload: spec.dryRunPayload?.(suite, armName),
    });
    if (!res.ok) { if (attempt === maxRetries) die(`${suite.call_type}: ${res.error}`); continue; }
    const problems = spec.validate(res.payload, { suite, arm: armName });
    const hard = problems.filter((p) => !isSoft(p));
    if (hard.length && attempt < maxRetries) continue;
    log.push({
      call: suite.call_type,
      latency_s: Math.round(res.latency_s * 1000) / 1000,
      retries: attempt,
      problems: problems.map(stripSoft),
      payload: res.payload,
    });
    if (hard.length) die(`${suite.call_type} failed validation after ${maxRetries + 1} attempts: ${hard.join('; ')}`);
    return res.payload;
  }
}

const lines = (v) => (Array.isArray(v) ? v : [v ?? '']).filter(Boolean);
const withSlots = (suite, extra) => ({ ...suite, slots: { ...suite.slots, ...extra } });

// ── beat ────────────────────────────────────────────────────────────────────
console.log(`beat: ${J.experiment} → ${N.experiment} → ${R.experiment}${flag('dry-run') ? '  (DRY RUN)' : ''}\n`);

// 1. Judgment — the only call whose inputs are all fixtures.
process.stdout.write('  judgment  … ');
const j = await call(J);
console.log(`${j.stance}  "${j.utterance.slice(0, 40)}…"`);

// 2. Narration. W1: the utterance becomes context and joins the timeline the
//    engine would have rendered. Contract §3 requires TIMELINE_TAIL to already
//    carry both the utterance and the fixed action — that assembly is exactly
//    what the engine will own.
const timelineBefore = lines(J.slots.TIMELINE_EXCERPT);
const utteranceLine = `요원: "${j.utterance}"`;
const narrationSuite = withSlots(N, {
  AGENT_UTTERANCE: j.utterance,
  TIMELINE_TAIL: [...timelineBefore, utteranceLine, N.slots.FIXED_NPC_ACTION],
});
process.stdout.write('  narration … ');
const n = await call(narrationSuite);
console.log(`${n.timeline_entries.length} entries, ${n.npc_lines.length} lines`);

// 3. Reporter. W1 + W2: the round is the scripted beats, the agent's own speech
//    and inner note, and everything Call 2 generated. inner_note reaches the
//    report and nothing else (contract §6).
const experienced = [
  ...timelineBefore,
  `(속으로) ${j.inner_note}`,
  `나는 말했다: "${j.utterance}"`,
  N.slots.FIXED_NPC_ACTION,
  ...n.timeline_entries,
  ...n.npc_lines,
];
process.stdout.write('  reporter  … ');
const r = await call(withSlots(R, { EXPERIENCED: experienced }));
console.log(`facts ${r.facts.length}, body ${r.report_body.length}자\n`);

// ── transcript ──────────────────────────────────────────────────────────────
// The timeline after this beat is what the next beat would mine from (W3).
const timelineAfter = [...timelineBefore, utteranceLine, N.slots.FIXED_NPC_ACTION, ...n.timeline_entries, ...n.npc_lines];
const md = [
  `# Beat transcript — ${J.experiment} → ${N.experiment} → ${R.experiment}`,
  '',
  flag('dry-run') ? '> **DRY RUN — synthesized payloads, no model was called.**\n' : '',
  '> State is not modelled here: the stance is recorded, never applied. No deltas,',
  '> no buckets, no routing. This transcript shows the wiring (W1·W2·W3) only.',
  '',
  '## 1. Judgment',
  '',
  `- **stance** \`${j.stance}\` (rejected \`${j.rejected_stance}\`)`,
  `- **inner_note** ${j.inner_note}`,
  `- **utterance** ${j.utterance}`,
  `- **because** ${j.because_referent} · blocks: ${(j.because_block_ids ?? []).join(', ') || '(없음)'}`,
  '',
  '## 2. Narration — wired from judgment',
  '',
  `\`AGENT_UTTERANCE\` ← judgment.utterance · \`TIMELINE_TAIL\` ← 타임라인 + 요원 발화 + 고정 사건`,
  '',
  ...n.timeline_entries.map((e) => `- ${e}`),
  '',
  ...n.npc_lines.map((l) => `- **${l}**`),
  '',
  '## 3. Reporter — wired from judgment + narration',
  '',
  `\`EXPERIENCED\` ← 스크립트 ${timelineBefore.length}줄 + inner_note + utterance + 고정 사건 + 나레이션 ${n.timeline_entries.length + n.npc_lines.length}줄 = ${experienced.length}줄`,
  '',
  '### facts',
  '',
  ...r.facts.map((f) => `- ${f}`),
  '',
  '### report_body',
  '',
  r.report_body,
  '',
  '## Timeline after this beat (what the next beat mines — W3)',
  '',
  ...timelineAfter.map((t) => `- ${t}`),
  '',
  '## Calls',
  '',
  '| call | latency | retries | problems |',
  '|---|---:|---:|---|',
  ...log.map((c) => `| ${c.call} | ${c.latency_s}s | ${c.retries} | ${c.problems.join('; ') || '—'} |`),
  '',
  `**Beat total: ${log.reduce((a, c) => a + c.latency_s, 0).toFixed(1)}s over ${log.length} calls.**`,
  '',
].join('\n');

const outDir = opt('out', join(HERE, '..', '..', 'planning', 'dday-mechanism', 'runs', 'BEAT-drive'));
mkdirSync(outDir, { recursive: true });
const mdPath = join(outDir, 'beat.md');
writeFileSync(mdPath, md);
writeFileSync(join(outDir, 'beat.json'), `${JSON.stringify({ suites: files, calls: log, timeline_after: timelineAfter }, null, 2)}\n`);
console.log(`→ ${mdPath}`);
console.log('\nNo state was applied. The stance is recorded, not routed — that is the engine\'s job.');

#!/usr/bin/env node
// Pulls everything a mechanism-run read needs into one dump. Formatting and the
// belief coding are the reader's job — this only gathers and counts.
//
//   node .claude/skills/read-mechanism-run/extract.mjs <experiment-id | run-dir>
//
// Deliberately does no interpretation: no verdicts, no "the mechanism worked".
// It prints raw sequences beside N, because that is what the verdict card wants
// (deep-test plan §9.2) and because a rate without its N is how a program talks
// itself into a result.

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';

const REPO = resolve(process.argv[2] === '--repo' ? process.argv[3] : '.');
const arg = process.argv.slice(2).find((a) => !a.startsWith('--') && a !== REPO);
if (!arg) {
  console.error('usage: extract.mjs <experiment-id | run-dir>');
  process.exit(1);
}

const RUNS = join(REPO, 'planning/dday-mechanism/runs');
const SUITES = join(REPO, 'planning/dday-mechanism/suites');

const runDir = existsSync(arg) ? resolve(arg) : join(RUNS, `${arg}-calls`);
if (!existsSync(runDir)) {
  console.error(`no run directory at ${runDir}`);
  process.exit(1);
}
const experiment = basename(runDir).replace(/-calls$/, '');

const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'));

// The suite is matched on its `experiment` field, not its filename — the two
// can legitimately differ.
let suite = null;
for (const f of readdirSync(SUITES).filter((f) => f.endsWith('.json'))) {
  const s = readJson(join(SUITES, f));
  if (s.experiment === experiment) {
    suite = s;
    suite._file = f;
    break;
  }
}

const armFiles = readdirSync(runDir)
  .filter((f) => /^metrics-.*\.json$/.test(f))
  .map((f) => ({ arm: f.replace(/^metrics-|\.json$/g, ''), path: join(runDir, f) }));

// Baseline first, then live, then everything else — the order a reader wants.
const rank = (a) => (a === 'baseline' ? 0 : a === 'live' ? 1 : a === 'placebo' ? 2 : 3);
armFiles.sort((x, y) => rank(x.arm) - rank(y.arm) || x.arm.localeCompare(y.arm));

const C = (n, k) => {
  if (k < 0 || k > n) return 0;
  let r = 1;
  for (let i = 0; i < k; i++) r = (r * (n - i)) / (i + 1);
  return r;
};
/** One-sided Fisher: P(arm2 shows <= its observed misses), margins fixed. */
const fisher = (miss1, n1, miss2, n2) => {
  const F = miss1 + miss2;
  const N = n1 + n2;
  let s = 0;
  for (let k = miss1; k <= Math.min(n1, F); k++) s += (C(n1, k) * C(n2, F - k)) / C(N, F);
  return s;
};

const line = (c = '─') => c.repeat(72);
const out = [];
const say = (s = '') => out.push(s);

say(line('═'));
say(`PROBE  ${experiment}`);
say(line('═'));

if (!suite) {
  say('!! No suite matched this experiment id. Gate, stance labels and block');
  say('!! texts are unavailable — say so in the read rather than guessing them.');
} else {
  const first = readJson(armFiles[0].path);
  say(`suite      ${suite._file}`);
  say(`model      ${suite.model}   template ${suite.template_version}   temperament ${suite.temperament}`);
  say(`channel    ${suite.channel}   call_type ${suite.call_type}`);
  say(`n_per_arm  ${suite.pre_registration?.n_per_arm ?? '?'}   transport ${first.transport ?? '?'}`);
  say('');
  say(`GATE       ${suite.slots?.GATE_QUESTION ?? '(none)'}`);
  say('STANCES');
  for (const s of suite.slots?.STANCE_SET ?? []) say(`  ${s.id}) ${s.label}`);
  say('');
  say('ARMS — what differs');
  for (const { arm } of armFiles) {
    const blocks = suite.arms?.[arm]?.BLOCKS;
    if (blocks === undefined) {
      const overrides = Object.keys(suite.arms?.[arm] ?? {});
      say(`  ${arm}: ${overrides.length ? overrides.join(', ') + ' overridden' : '(no override)'}`);
      for (const k of overrides) say(`      ${k} = ${JSON.stringify(suite.arms[arm][k])}`);
    } else if (!blocks.length) {
      say(`  ${arm}: (없음) — no block`);
    } else {
      for (const b of blocks) say(`  ${arm}: ${b.id} — ${b.text}`);
    }
  }
  say('');
  say(`HYPOTHESIS ${suite.pre_registration?.hypothesis ?? '(none)'}`);
  say(`DROP COND  ${suite.pre_registration?.drop_condition ?? '(none)'}`);
  for (const c of suite.pre_registration?.contingencies ?? []) say(`CONTINGENCY ${c}`);
  if (suite.pre_registration?.not_claimed) say(`NOT CLAIMED ${suite.pre_registration.not_claimed}`);
}

const summary = [];

for (const { arm, path } of armFiles) {
  const m = readJson(path);
  const calls = m.calls ?? [];
  const kept = calls.filter((c) => !c.discarded && !c.failed);
  const bad = calls.filter((c) => c.discarded || c.failed);

  say('');
  say(line('═'));
  say(`ARM  ${arm}   ${kept.length} kept / ${calls.length} attempts`);
  say(line('═'));

  kept.forEach((c, i) => {
    const p = c.payload ?? {};
    say('');
    say(`[${i + 1}] CHOSE ${c.stance}   REJECTED ${c.rejected_stance ?? '—'}   ${c.latency_s}s`);
    say(`    inner_note : ${p.inner_note ?? ''}`);
    say(`    utterance  : ${p.utterance ?? ''}`);
    say(`    referent   : ${c.because_referent ?? ''}`);
    say(`    rej_reason : ${p.rejected_reason ?? ''}`);
    say(`    block_ids  : ${JSON.stringify(c.because_block_ids ?? [])}`);
    if ((c.because_invalid_ids ?? []).length)
      say(`    ^ fabricated: ${c.because_invalid_ids.join(', ')}`);
  });

  if (bad.length) {
    say('');
    say(`-- DISCARDED / FAILED (${bad.length}) — quarantined, never deleted (§3 rule 5)`);
    bad.forEach((c) =>
      say(`   slot ${c.slot}: ${c.discard_reason ?? c.error}${c.payload?.stance ? `  [would-be stance ${c.payload.stance}]` : ''}`),
    );
  }

  const lat = kept.map((c) => c.latency_s).filter((x) => x != null);
  const fabCalls = kept.filter((c) => (c.because_invalid_ids ?? []).length).length;
  const tally = {};
  for (const c of kept) tally[c.stance] = (tally[c.stance] ?? 0) + 1;
  const mode = Object.entries(tally).sort((a, b) => b[1] - a[1])[0] ?? [null, 0];

  say('');
  say(`sequence      ${kept.map((c) => c.stance).join(',') || '(none)'}`);
  say(`tally         ${JSON.stringify(tally)}   mode ${mode[0]} ${mode[1]}/${kept.length}`);
  say(`discards      ${bad.length}/${calls.length}   schema_retries ${m.compliance?.schema_retries_total ?? '?'}   foreign_tool_uses ${m.compliance?.foreign_tool_uses_total ?? '?'}`);
  say(`fabricated    ${fabCalls}/${kept.length} calls, ${m.compliance?.because_invalid_id_total ?? '?'} ids total`);
  if (lat.length)
    say(`latency kept  ${Math.min(...lat).toFixed(2)}–${Math.max(...lat).toFixed(2)}s  mean ${(lat.reduce((a, b) => a + b, 0) / lat.length).toFixed(1)}s`);
  if (m.coverage) say(`coverage      ${JSON.stringify(m.coverage)}`);

  summary.push({ arm, kept: kept.length, attempts: calls.length, tally, mode, discards: bad.length });
}

say('');
say(line('═'));
say('CROSS-ARM — stance signal only. The belief signal is the reader\'s to code.');
say(line('═'));

const base = summary.find((s) => s.arm === 'baseline');
if (!base || !base.kept) {
  say('No baseline arm with kept calls — no comparison is computable.');
} else {
  const target = base.mode[0];
  say(`baseline modal stance = ${target} (${base.mode[1]}/${base.kept})`);
  say('');
  for (const s of summary) {
    if (s.arm === 'baseline' || !s.kept) continue;
    const hit = s.tally[target] ?? 0;
    // Both directions, always. A saturated baseline makes the toward-direction
    // p meaningless (it reads 1.0) while the away-direction carries the whole
    // result — which is exactly the shape A9 predicts, so never print only one.
    const toward = fisher(base.kept - base.mode[1], base.kept, s.kept - hit, s.kept);
    const away = fisher(s.kept - hit, s.kept, base.kept - base.mode[1], base.kept);
    say(`  ${s.arm}: baseline ${target} ${base.mode[1]}/${base.kept}  →  ${target} ${hit}/${s.kept}`);
    say(`    toward ${target}   one-sided p = ${toward.toFixed(5)}`);
    say(`    away from ${target} one-sided p = ${away.toFixed(5)}   ← the live direction when the baseline is saturated`);
    // Where the mass went, since "away" alone does not say which stance gained.
    const gained = Object.entries(s.tally)
      .filter(([k]) => k !== target)
      .sort((a, b) => b[1] - a[1]);
    if (gained.length) {
      const [g, n] = gained[0];
      const gBase = base.tally[g] ?? 0;
      say(`    largest gainer ${g}: ${gBase}/${base.kept} → ${n}/${s.kept}   one-sided p = ${fisher(base.kept - gBase, base.kept, s.kept - n, s.kept).toFixed(5)}`);
    }
  }
  say('');
  say('Read the tally first. A shift away from a saturated baseline mode onto a');
  say('specific other stance is the result; the toward-direction p will read 1.0.');
  const discRates = summary.map((s) => (s.attempts ? s.discards / s.attempts : 0));
  const spread = Math.max(...discRates) - Math.min(...discRates);
  if (spread > 0.15)
    say(`!! DISCARD RATES DIVERGE BY ${(spread * 100).toFixed(0)} POINTS — arms are differently-filtered samples. Plan §8.5 step 4: this voids the arm comparison. Say so.`);
}

console.log(out.join('\n'));

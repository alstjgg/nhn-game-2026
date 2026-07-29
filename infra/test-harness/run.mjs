#!/usr/bin/env node
// Probe runner.
//
//   node run.mjs <suite.json> [options]
//
//   --dry-run           no network, no key, no charge; synthesized payloads
//   --print-prompt=ARM  compose one arm, print it, exit (free; do this first)
//   --arm=NAME          run a single arm instead of all
//   --n=N               override pre_registration.n_per_arm (dry-run only —
//                       measured runs take N from the suite; edit the sheet
//                       to change it, so the change is recorded)
//   --out=DIR           artifact directory (default: planning/dday-mechanism/runs/<EXP>-calls)
//   --max-retries=N     schema retries per call slot (default 2)
//   --force             replace existing artifacts for the arms being run
//
// Order of operations is the run sheet (deep-test plan §7.3): validate the
// pre-registration, verify the arm diff, then and only then spend calls.

import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CALL_TYPES, isSoft, stripSoft } from './lib/calltypes.mjs';
import { composeArm, verifyArmDiff } from './lib/compose.mjs';
import { preflightArtifacts, writeArtifacts } from './lib/record.mjs';
import { loadSuite, validateSuite } from './lib/suite.mjs';
import { TRANSPORTS } from './lib/transport.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..', '..');
const TEMPLATES = join(HERE, 'templates');

const argv = process.argv.slice(2);
const flag = (name) => argv.includes(`--${name}`);
const opt = (name, dflt) => {
  const hit = argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : dflt;
};

const die = (msg) => {
  console.error(`\n✗ ${msg}\n`);
  process.exit(1);
};

const suitePath = argv.find((a) => !a.startsWith('--'));
if (!suitePath) die('usage: node run.mjs <suite.json> [--dry-run] [--print-prompt=ARM]');

const suite = loadSuite(resolve(suitePath));
const spec = CALL_TYPES[suite.call_type] ?? die(`unknown call_type "${suite.call_type}"`);
const composeOpts = { templatesRoot: TEMPLATES };

// ── 1. Pre-registration gate ────────────────────────────────────────────────
const { fatal, warn } = validateSuite(suite);
for (const w of warn) console.warn(`⚠  ${w}`);
if (fatal.length) die(`suite is not runnable:\n   - ${fatal.join('\n   - ')}`);

// ── print-prompt: free inspection, no calls ─────────────────────────────────
const printArm = opt('print-prompt');
if (printArm) {
  if (!suite.arms[printArm]) die(`no arm "${printArm}" (have: ${Object.keys(suite.arms).join(', ')})`);
  const { system, user, temperamentId } = composeArm(suite, printArm, composeOpts);
  console.log(`── SYSTEM (arm ${printArm}, temperament ${temperamentId}) ${'─'.repeat(20)}\n`);
  console.log(system);
  console.log(`\n── USER ${'─'.repeat(48)}\n`);
  console.log(user);
  console.log(`\n── end (${system.length + user.length} chars) ${'─'.repeat(30)}`);
  process.exit(0);
}

// ── 2. Arm diff — arms must differ only in the channel's slot ───────────────
const diffs = verifyArmDiff(suite, composeOpts);
if (diffs.length) {
  die(
    'arm-diff check failed — arms differ outside the injected slot, so any result ' +
      `would be unattributable (§7.3 step 2):\n\n${diffs.join('\n\n')}`,
  );
}
console.log(`✓ arm diff clean — ${Object.keys(suite.arms).length} arms vary only in ${suite.channel}`);

// ── 3. Call loop ───────────────────────────────────────────────────────────
const transportName = flag('dry-run') ? 'dryrun' : 'anthropic';
const transport = TRANSPORTS[transportName];
const maxRetries = Number(opt('max-retries', 2));

// N comes from the pre-registration sheet. A CLI override bypasses the
// validateSuite gate, so it is (a) rejected unless it is a positive integer
// and (b) rejected outright on measured runs — changing N means editing the
// sheet, so the change is recorded (§9.1: the runner enforces, not trusts).
const nRaw = opt('n');
if (nRaw !== undefined) {
  if (!Number.isInteger(Number(nRaw)) || Number(nRaw) <= 0) {
    die(`--n=${nRaw} is not a positive integer`);
  }
  if (!flag('dry-run')) {
    die('--n override is dry-run only. N is pre-registered (§9.1) — edit the suite\'s n_per_arm to change it on a measured run.');
  }
}
const n = nRaw !== undefined ? Number(nRaw) : suite.pre_registration.n_per_arm;
const armNames = opt('arm') ? [opt('arm')] : Object.keys(suite.arms);
const outDir = opt('out', join(REPO, 'planning/dday-mechanism/runs', `${suite.experiment}-calls`));
const tool = spec.buildTool(suite);

// ── 3a. Artifact preflight — before any call is spent ──────────────────────
// writeArtifacts refuses to overwrite, but by the time it runs the calls are
// already paid for and the responses live only in memory — a rerun would burn
// N calls and then lose them (§3 rule 4). Refuse here, next to the arm-diff
// gate, while refusing is still free.
try {
  preflightArtifacts({ outDir, arms: armNames, force: flag('force') });
} catch (e) {
  die(e.message);
}

if (transportName === 'dryrun') console.log('⚠  DRY RUN — synthesized payloads, nothing measured');

const summary = [];
for (const arm of armNames) {
  if (!suite.arms[arm]) die(`no arm "${arm}"`);
  const { system, user, temperamentId } = composeArm(suite, arm, composeOpts);
  const records = [];

  for (let slot = 1; slot <= n; slot++) {
    let accepted = false;
    for (let attempt = 0; attempt <= maxRetries && !accepted; attempt++) {
      const res = await transport({
        system,
        user,
        tool,
        model: suite.model,
        maxTokens: suite.max_tokens,
        timeoutMs: suite.timeout_ms,
        dryPayload: spec.dryRunPayload?.(suite, arm),
      });

      const rec = {
        arm,
        slot,
        template: suite.template_version,
        model: suite.model,
        model_reported: res.model_reported ?? null,
        temperament_id: temperamentId,
        latency_s: res.latency_s == null ? null : Math.round(res.latency_s * 1000) / 1000,
        stop_reason: res.stop_reason ?? null,
        foreign_tool_uses: res.foreign_tool_uses ?? 0,
        schema_retries: attempt,
        payload: res.payload ?? null,
      };

      if (!res.ok) {
        Object.assign(rec, { failed: true, error: res.error });
        records.push(rec);
        process.stdout.write('!');
        continue;
      }

      // Integrity checks (§3). foreign_tool_uses > 0 is structurally impossible
      // on this transport; if it ever fires, the transport changed underneath us.
      const hard = [];
      if (tool && res.stop_reason !== 'tool_use') hard.push(`stop_reason=${res.stop_reason}`);
      if (tool && res.output_tool_calls !== 1) hard.push(`output_tool_calls=${res.output_tool_calls}`);
      if (res.foreign_tool_uses > 0) hard.push(`foreign_tool_uses=${res.foreign_tool_uses}`);

      const problems = spec.validate(res.payload, { suite, arm });
      hard.push(...problems.filter((p) => !isSoft(p)));
      rec.problems = [...hard, ...problems.filter(isSoft).map(stripSoft)];

      if (hard.length) {
        Object.assign(rec, { discarded: true, discard_reason: hard.join('; ') });
        records.push(rec);
        process.stdout.write('x');
        continue;
      }

      Object.assign(rec, spec.summarize(res.payload, { suite, arm }));
      records.push(rec);
      accepted = true;
      process.stdout.write('.');
    }
    if (!accepted) {
      records.push({ arm, slot, failed: true, error: `no valid response in ${maxRetries + 1} attempts` });
      process.stdout.write('X');
    }
  }

  const kept = records.filter((r) => !r.discarded && !r.failed);
  const coverage = spec.coverage?.(kept, suite) ?? null;
  const { md, sequence } = writeArtifacts({
    outDir,
    suite,
    arm,
    records,
    transport: transportName,
    force: flag('force'),
    coverage,
    nEffective: n,
  });
  console.log(`\n✓ ${arm}: ${sequence || '(none kept)'}  → ${md.replace(`${REPO}/`, '')}`);
  summary.push({ arm, sequence, records, coverage });
}

// ── 4. Summary — the shape the verdict card wants ──────────────────────────
console.log(`\n${'─'.repeat(60)}\n${suite.experiment} · ${suite.channel} · template ${suite.template_version} · ${suite.model}`);
console.log(`hypothesis: ${suite.pre_registration.hypothesis}\n`);
for (const s of summary) {
  const lat = s.records.filter((r) => r.latency_s != null).map((r) => r.latency_s);
  const mean = lat.length ? (lat.reduce((a, b) => a + b, 0) / lat.length).toFixed(1) : '—';
  console.log(`  ${s.arm.padEnd(10)} ${(s.sequence || '—').padEnd(18)} mean ${mean}s`);
}
// Stance coverage across every arm run — a sampled diagnostic, never a §3.1
// write-test verdict: absence at probe N is not structural unreachability
// (this program's own caveat — 3/3 is consistent with a true rate of ~37%).
// The write test is a static check on the delta table plus the reachability
// audit (§5.2 B1); this output only flags stances worth checking there.
// Reported only when the whole probe ran, since a single --arm run cannot
// establish it. Arms with zero valid calls contribute nothing (unknown ≠ dead).
const allArms = summary.length === Object.keys(suite.arms).length && summary.length;
const sampled = summary.filter((s) => s.coverage?.status === 'sampled');
if (allArms && summary.every((s) => s.coverage)) {
  if (!sampled.length) {
    console.log('\nstance coverage: unknown — no valid calls in any arm');
  } else {
    const offered = sampled[0].coverage.offered;
    const seen = new Set(sampled.flatMap((s) => s.coverage.selected));
    const unobserved = offered.filter((id) => !seen.has(id));
    console.log(
      `\nstance coverage  offered ${offered.join(',')} · unobserved in every arm: ` +
        `${unobserved.length ? `${unobserved.join(',')}  (diagnostic — the §3.1 write test is a static delta-table check, not this sample)` : 'none'}`,
    );
  }
}

console.log(
  `\nNo verdict is computed here. Sequences go on the verdict card (§9.2);\n` +
    `blind coding (§5.2 B3) happens before any pass/drop call.\n`,
);

// Artifact writers. calls-<arm>.md is PRIMARY and holds verbatim responses;
// metrics-<arm>.json is derived and must be recomputable from it by hand — if the
// two disagree, the JSON is wrong (deep-test plan §7.4).
//
// Nothing here deletes or rewrites. Discarded and failed calls are written in
// place, in sequence, flagged — quarantine, not removal (§3 rule 5).

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const pad = (n) => String(n).padStart(2, '0');

// Called by the runner BEFORE the call loop: existing artifacts must refuse the
// run while refusing is still free. writeArtifacts re-checks as a backstop, but
// by then the calls are paid for — relying on that check alone burns N calls
// and then loses the responses (§3 rule 4).
export function preflightArtifacts({ outDir, arms, force }) {
  if (force) return;
  for (const arm of arms) {
    const clash = [join(outDir, `calls-${arm}.md`), join(outDir, `metrics-${arm}.json`)].filter((p) =>
      existsSync(p),
    );
    if (clash.length) {
      throw new Error(
        `artifacts already exist for arm "${arm}" in ${outDir} — refusing before any call is spent. ` +
          'Raw artifacts are never edited after the fact — use a new experiment id, or --force if you mean to replace an aborted run.',
      );
    }
  }
}

export function writeArtifacts({ outDir, suite, arm, records, transport, force, coverage, nEffective }) {
  mkdirSync(outDir, { recursive: true });
  const md = join(outDir, `calls-${arm}.md`);
  const js = join(outDir, `metrics-${arm}.json`);
  if (!force && (existsSync(md) || existsSync(js))) {
    throw new Error(
      `artifacts already exist for arm "${arm}" in ${outDir}. ` +
        'Raw artifacts are never edited after the fact — use a new experiment id, or --force if you mean to replace an aborted run.',
    );
  }

  const kept = records.filter((r) => !r.discarded && !r.failed);
  const sequence = kept.map((r) => r.stance).join(',');
  const latencies = records.filter((r) => r.latency_s != null).map((r) => r.latency_s);

  writeFileSync(md, renderMarkdown({ suite, arm, records, transport, sequence, coverage, nEffective }));
  writeFileSync(
    js,
    `${JSON.stringify(
      {
        experiment: suite.experiment,
        arm,
        call_type: suite.call_type,
        channel: suite.channel,
        template: suite.template_version,
        model: suite.model,
        transport,
        dry_run: transport === 'dryrun',
        pre_registration: suite.pre_registration,
        // The N this arm actually ran with. Differs from pre_registration only
        // under a --n override, which the runner allows on dry runs alone.
        n_effective: nEffective ?? null,
        n_overridden: nEffective != null && nEffective !== suite.pre_registration.n_per_arm,
        calls: records,
        sequence,
        distribution: tally(kept.map((r) => r.stance)),
        // Sampled stance-coverage diagnostic. NOT §3.1 write-test evidence:
        // that test is a static delta-table check plus the B1 reachability
        // audit; status "unknown" means zero valid calls, not "all dead".
        coverage: coverage ?? null,
        // Human-written, per §5.3. Nulls are deliberate: they make an unfilled
        // log visible instead of absent. Text lives in calls-<arm>.md.
        advisory_logs: { state_variable_shadow: null, mineability: null },
        latency: latencies.length
          ? {
              calls: latencies.length,
              mean_s: round(latencies.reduce((a, b) => a + b, 0) / latencies.length),
              min_s: round(Math.min(...latencies)),
              max_s: round(Math.max(...latencies)),
            }
          : null,
        compliance: {
          discarded_total: records.filter((r) => r.discarded).length,
          failed_total: records.filter((r) => r.failed).length,
          schema_retries_total: records.reduce((a, r) => a + (r.schema_retries ?? 0), 0),
          foreign_tool_uses_total: records.reduce((a, r) => a + (r.foreign_tool_uses ?? 0), 0),
          because_invalid_id_total: records.reduce(
            (a, r) => a + (r.because_invalid_ids?.length ?? 0),
            0,
          ),
        },
      },
      null,
      2,
    )}\n`,
  );
  return { md, js, sequence };
}

function renderMarkdown({ suite, arm, records, transport, sequence, coverage, nEffective }) {
  const pre = suite.pre_registration;
  const L = [];
  L.push(`# ${suite.experiment} — arm \`${arm}\``);
  L.push('');
  if (transport === 'dryrun') {
    L.push('> **DRY RUN — synthesized payloads, no model was called.**');
    L.push('> Not evidence. Present only to prove the pipeline composes and records.');
    L.push('');
  }
  L.push('| field | value |');
  L.push('|---|---|');
  L.push(`| call type | ${suite.call_type} |`);
  L.push(`| channel | ${suite.channel} |`);
  L.push(`| template | ${suite.template_version} |`);
  L.push(`| model | \`${suite.model}\` |`);
  L.push(`| transport | ${transport} |`);
  L.push(`| temperament | ${records[0]?.temperament_id ?? '—'} |`);
  L.push(`| N planned | ${pre.n_per_arm} |`);
  if (nEffective != null && nEffective !== pre.n_per_arm) {
    L.push(`| N run | ${nEffective} — \`--n\` override (dry-run only) |`);
  }
  L.push(`| N kept | ${records.filter((r) => !r.discarded && !r.failed).length} |`);
  L.push('');
  L.push('## Pre-registration');
  L.push('');
  L.push(`- **Hypothesis:** ${pre.hypothesis}`);
  L.push(`- **Drop condition:** ${pre.drop_condition}`);
  for (const c of pre.contingencies ?? []) L.push(`- **Contingency:** ${c}`);
  L.push('');
  L.push('## Calls (verbatim)');
  L.push('');
  records.forEach((r, i) => {
    const tag = r.discarded ? ' — DISCARDED' : r.failed ? ' — FAILED' : '';
    L.push(`### ${pad(i + 1)}${tag}`);
    L.push('');
    L.push(
      `latency ${r.latency_s ?? '—'}s · stop_reason \`${r.stop_reason ?? '—'}\` · ` +
        `schema_retries ${r.schema_retries ?? 0} · foreign_tool_uses ${r.foreign_tool_uses ?? 0}`,
    );
    if (r.problems?.length) L.push(`\nproblems: ${r.problems.join('; ')}`);
    if (r.error) L.push(`\nerror: ${r.error}`);
    L.push('');
    L.push('```json');
    L.push(JSON.stringify(r.payload ?? null, null, 2));
    L.push('```');
    L.push('');
  });
  L.push('## Arm table');
  L.push('');
  L.push('| # | stance | rejected | because.referent | because.block_ids |');
  L.push('|---|---|---|---|---|');
  records.forEach((r, i) => {
    const cell = (v) => String(v ?? '—').replace(/\|/g, '\\|').replace(/\n/g, ' ');
    L.push(
      `| ${pad(i + 1)}${r.discarded || r.failed ? '*' : ''} | ${cell(r.stance)} | ` +
        `${cell(r.rejected_stance)} | ${cell(r.because_referent)} | ${cell((r.because_block_ids ?? []).join(' '))} |`,
    );
  });
  L.push('');
  L.push(`**Sequence (kept calls):** \`${sequence || '—'}\``);
  L.push('');
  if (coverage) {
    if (coverage.status === 'unknown') {
      L.push('**Stance coverage:** unknown — no valid calls in this arm.');
      L.push('');
    } else {
      const unobserved = coverage.unobserved?.length
        ? `\`${coverage.unobserved.join('`, `')}\``
        : 'none';
      L.push(
        `**Stance coverage (sampled diagnostic):** offered \`${coverage.offered.join('`, `')}\` · ` +
          `unobserved in this arm: ${unobserved}`,
      );
      L.push('');
      L.push(
        '> Diagnostic only — absence at this N is not a dead delta row. The architecture ' +
          'spec §3.1 write test is a static check on the delta table plus the reachability ' +
          'audit (§5.2 B1); a stance unobserved across every arm is a lead for that check, ' +
          'not a failure verdict. Carried to the verdict card (§9.2) as a diagnostic.',
      );
      L.push('');
    }
  }
  L.push('## Advisory logs (§5.3)');
  L.push('');
  L.push('_Operator-written. Observation only — these never affect distributions,');
  L.push('boundary laws, or pass/drop judgments._');
  L.push('');
  L.push('**State-variable shadow log** — which candidate variables (architecture spec');
  L.push('§3.1 pool) would this run have moved, and which payload symptom mapped to which?');
  L.push('');
  L.push('**Mineability log** — would `utterance` / `inner_note` survive as mining');
  L.push('material? Block count, specificity (names, quantities, referents), and whether');
  L.push('it says anything the payload did not already say.');
  L.push('');
  L.push('## Pairing verdict');
  L.push('');
  L.push('_Operator writes this against the other arms. Sequences, not rates (§9.2)._');
  L.push('');
  return `${L.join('\n')}`;
}

const tally = (xs) =>
  xs.reduce((acc, x) => ((acc[x] = (acc[x] ?? 0) + 1), acc), {});
const round = (n) => Math.round(n * 1000) / 1000;

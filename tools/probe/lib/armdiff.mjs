// The mechanical arm-diff check — probe-only.
//
// Deep-test plan §7.3 step 2 requires that arms differ ONLY in the injected
// element, "verified by diff, not by intention". That is enforced here rather
// than trusted: every arm is composed twice — once for real, once with its
// channel's permitted slots replaced by a sentinel — and the sentinel versions
// of all arms must be byte-identical. Anything that leaks outside the channel's
// slot shows up as a diff and aborts the run.
//
// This lives under `probe/`, not next to the composer, because "arm" and
// "channel" are experiment vocabulary. The production composer in
// `src/composer/` composes one payload for one beat; it has no second arm to
// compare against and must never grow one.

import { composeArm } from '../../lib/compose.mjs';

/**
 * Slots a probe of a given kind is permitted to vary. Mirrors deep-test plan
 * §7.2 — anything not listed here is frozen and diff-verified across arms.
 */
export const CHANNEL_SLOTS = {
  // Player channels (§4.1) — what the mechanism program is about.
  'C-BLOCK': ['BLOCKS'],
  'C-STRUCT': ['PRIORITY_LIST'],
  // Contingency arm carried on the C-BLOCK pre-registration sheet (§4.1).
  CREDULITY: ['FLAW'],
  // Tier A axis 4 (§5.1) — both player channels on one gate. The axis is
  // definitionally two-slot; everything else stays frozen and diff-verified.
  INTERFERENCE: ['BLOCKS', 'PRIORITY_LIST'],
  // D task (agent prompt test) — NOT player channels. Temperament is a fixture
  // in the mechanism program and must be byte-identical across a probe's arms,
  // so a mechanism suite must never declare these; the diff check is what
  // catches a temperament swap smuggled into a C-BLOCK probe.
  'D-TEMP': ['TEMPERAMENT'],
  'D-INCIDENT': ['INCIDENT'],
  // Shape work legitimately varies nothing in the payload across arms.
  SHAPE: [],
};

/**
 * Verify every arm is identical outside its channel's permitted slots.
 * Returns [] when clean, or a list of human-readable diffs.
 */
export function verifyArmDiff(suite, opts) {
  const permitted = CHANNEL_SLOTS[suite.channel];
  if (!permitted) {
    return [`channel "${suite.channel}" has no slot map — add it to CHANNEL_SLOTS`];
  }
  const names = Object.keys(suite.arms);
  const masked = names.map((n) => {
    const { system, user } = composeArm(suite, n, { ...opts, sentinelSlots: permitted });
    return { name: n, blob: `${system}\n\n${user}` };
  });

  const problems = [];
  const [ref, ...rest] = masked;
  for (const other of rest) {
    if (other.blob === ref.blob) continue;
    const a = ref.blob.split('\n');
    const b = other.blob.split('\n');
    const firstDiff = a.findIndex((line, i) => line !== b[i]);
    problems.push(
      `arms "${ref.name}" and "${other.name}" differ outside the ${suite.channel} slot ` +
        `(${permitted.join(', ') || 'none'}) at line ${firstDiff + 1}:\n` +
        `    ${ref.name}: ${JSON.stringify(a[firstDiff] ?? '<end>')}\n` +
        `    ${other.name}: ${JSON.stringify(b[firstDiff] ?? '<end>')}`,
    );
  }
  return problems;
}

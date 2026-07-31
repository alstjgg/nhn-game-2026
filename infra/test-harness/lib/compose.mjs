// Prompt composition + the mechanical arm-diff check.
//
// Deep-test plan §7.3 step 2 requires that arms differ ONLY in the injected
// element, "verified by diff, not by intention". That is enforced here rather
// than trusted: every arm is composed twice — once for real, once with its
// channel's permitted slots replaced by a sentinel — and the sentinel versions
// of all arms must be byte-identical. Anything that leaks outside the channel's
// slot shows up as a diff and aborts the run.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { CALL_TYPES, CHANNEL_SLOTS } from './calltypes.mjs';

// NUL delimiters so the sentinel can never collide with template text -- but
// as escapes, not literal bytes: a literal NUL makes git treat this file as
// binary (invisible in PR diffs, no line comments).
const SENTINEL = '\u0000<<SLOT>>\u0000';

const read = (p) => readFileSync(p, 'utf8');

/** Fill {SLOT} markers. Any {UPPER_CASE} left over is a template/suite mismatch. */
function fillSlots(text, values) {
  let out = text.replace(/\{([A-Z_]+)\}/g, (m, name) => {
    if (!(name in values)) throw new Error(`template slot {${name}} has no value`);
    return values[name] ?? '';
  });
  const leftover = out.match(/\{[A-Z_]+\}/g);
  if (leftover) throw new Error(`unfilled slots remain: ${leftover.join(', ')}`);
  // Collapse blank runs left by intentionally-empty slots (e.g. neutral
  // temperament, or the credulity arm's removed [결함] line).
  return out.replace(/\n{3,}/g, '\n\n').trim();
}

const renderBlocks = (blocks) =>
  blocks.length ? blocks.map((b) => `${b.id}: ${b.text}`).join('\n') : '(없음)';

const renderPriority = (list) =>
  Array.isArray(list) ? list.map((s, i) => `\n  ${i + 1}) ${s}`).join('') : String(list ?? '');

const renderStanceSet = (set) =>
  (set ?? []).map((s) => `${s.id}. ${s.label}`).join('\n');

const renderTimeline = (t) => (Array.isArray(t) ? t.join('\n') : String(t ?? ''));

const renderNpcs = (npcs) =>
  (npcs ?? []).map((p) => `${p.id} — ${p.name}`).join('\n');

// Slots with structure get a renderer; everything else passes through as a
// string. Keyed by slot name, not call type — a slot renders the same way
// wherever it appears.
const RENDERERS = {
  PRIORITY_LIST: renderPriority,
  BLOCKS: (v) => renderBlocks(v ?? []),
  STANCE_SET: renderStanceSet,
  TIMELINE_EXCERPT: renderTimeline,
  // narration (contracts doc §2)
  TIMELINE_TAIL: renderTimeline,
  SCENE_SYMPTOMS: (v) => (Array.isArray(v) && v.length ? v.join('\n') : '(변화 없음)'),
  PRESENT_NPCS: renderNpcs,
  // reporter (contracts doc §3) — one round's events as lines
  EXPERIENCED: renderTimeline,
};

/**
 * Resolve one arm's slot values. Arm entries override shared suite.slots; that
 * override is exactly what a channel injects, and it is what the diff checks.
 *
 * The slot list comes from the call type's `slots` declaration — nothing here
 * is judgment-specific, so a new call type (reporter, narration) composes
 * without touching this file (EXTENDING.md's claim, made true).
 */
function slotValues(suite, armName, { templatesRoot, sentinelSlots = [] }) {
  const spec = CALL_TYPES[suite.call_type];
  const arm = suite.arms[armName];
  const pick = (k) => (k in arm ? arm[k] : suite.slots?.[k]);

  const temperamentId = arm.temperament ?? suite.temperament ?? 'neutral';

  const raw = {};
  for (const name of spec.slots) {
    if (name === 'TEMPERAMENT') {
      // temperamentDir lets call types share one temperament roster (the
      // reporter reads judgment's files — spec §4 gives both calls the same
      // authored temperament, and two copies would drift silently).
      raw[name] = read(
        join(templatesRoot, spec.temperamentDir ?? spec.templateDir, 'temperament', `${temperamentId}.md`),
      ).trim();
      continue;
    }
    const render = RENDERERS[name] ?? ((v) => String(v ?? ''));
    raw[name] = render(pick(name));
  }

  // Masking a slot this call type does not declare is a no-op by design: arms
  // may vary a slot the template never references, and the diff check will
  // (correctly) find the composed output identical.
  for (const s of sentinelSlots) if (s in raw) raw[s] = SENTINEL;
  return { values: raw, temperamentId };
}

/** Compose one arm into the messages that actually go on the wire. */
export function composeArm(suite, armName, opts) {
  const spec = CALL_TYPES[suite.call_type];
  const dir = join(opts.templatesRoot, spec.templateDir);
  const { values, temperamentId } = slotValues(suite, armName, opts);
  return {
    system: fillSlots(read(join(dir, `base-${suite.template_version}.md`)), values),
    user: fillSlots(read(join(dir, `user-${suite.template_version}.md`)), values),
    temperamentId,
  };
}

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
    return { name: n, blob: `${system}\n\n${user}` };
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

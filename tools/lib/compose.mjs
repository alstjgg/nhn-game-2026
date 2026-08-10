// Prompt composition — slot values → the two message layers.
//
// THIS IS THE PAYLOAD COMPOSER'S PROTOTYPE. Its production home is
// `src/composer/` (physical architecture §3.1), where the same job runs in the
// browser. The renderers and the slot contract below are what moves there; the
// `fs` reads are not — the composer proper receives templates as strings from
// its host, because it has to run where there is no filesystem (§3.2).
//
// The two layers come from two different owners and therefore two different
// roots (see `prompts.mjs`): the system layer belongs to the proxy, the user
// layer ships as data. Composition is the only place they meet.
//
// The probe-only arm-diff check used to live in this file. It now sits in
// `tools/probe/lib/armdiff.mjs` and imports the sentinel seam below — a
// production composer has no notion of arms or channels.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { CALL_TYPES } from './calls.mjs';

// NUL delimiters so the sentinel can never collide with template text -- but
// as escapes, not literal bytes: a literal NUL makes git treat this file as
// binary (invisible in PR diffs, no line comments).
export const SENTINEL = '\u0000<<SLOT>>\u0000';

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

// NPCs render grouped by `side` when the suite marks it. The grouping is not
// cosmetic: room-side characters kept stepping into the agent's seat and
// addressing the person on the line, and a prose rule alone did not stop it —
// the model had to infer the two sides from names. Naming the sides in the
// payload makes the boundary structural. `side` is optional; without it the
// list renders flat, so existing suites are unaffected.
// The labels carry the rule, not just the grouping. Stating it in the distant
// constraint list left a residual leak; stating it beside the names removed it.
//
// The labels moved with the fiction (prompts v0.5/v0.4): the agent is a field
// officer at the site's crisis post, not a night controller in a regional
// situation room. `room` is now "beside the agent", which is what every
// room-side row in the shipped packs already meant — 우는다리 calls the place
// 위기 대응실 in its own draft. The MECHANISM is untouched; only the name of the
// place the two sides sit in.
const SIDE_LABELS = {
  line: '회선 너머 — 요원에게만 말한다',
  room: '요원 곁 — 서로에게만 말한다. 회선 저쪽에는 말을 걸지 않는다',
};
const renderNpcs = (npcs) => {
  const list = npcs ?? [];
  const entry = (p) => `${p.id} — ${p.name}`;
  if (!list.some((p) => p.side)) return list.map(entry).join('\n');
  const groups = [];
  for (const [side, label] of Object.entries(SIDE_LABELS)) {
    const members = list.filter((p) => p.side === side);
    if (members.length) groups.push(`[${label}]\n${members.map(entry).join('\n')}`);
  }
  const rest = list.filter((p) => !(p.side in SIDE_LABELS));
  if (rest.length) groups.push(rest.map(entry).join('\n'));
  return groups.join('\n\n');
};

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
  // The agent speaks only on gate beats. 멈춘회전문 has nineteen beats and at
  // most three carry an utterance — one, on a run that hands nothing over. The
  // other sixteen used to render a labelled section with NOTHING under it,
  // directly above an instruction not to repeat what is not there. An
  // instruction with no anchor is where invention starts. Say the silence out
  // loud instead, the way SCENE_SYMPTOMS says "(변화 없음)".
  //
  // The sentinel names no role: it renders under v0.1–v0.3's `통제관의 발화`
  // header too, and those versions are what live requests until the client's
  // TEMPLATE_VERSION bump lands.
  AGENT_UTTERANCE: (v) =>
    String(v ?? '').trim() ? String(v ?? '') : '(없음 — 이번 비트에 발화는 없었다)',
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
function slotValues(suite, armName, { prompts, sentinelSlots = [] }) {
  const spec = CALL_TYPES[suite.call_type];
  const arm = suite.arms[armName];
  const pick = (k) => (k in arm ? arm[k] : suite.slots?.[k]);

  const temperamentId = arm.temperament ?? suite.temperament ?? 'neutral';

  const raw = {};
  for (const name of spec.slots) {
    if (name === 'TEMPERAMENT') {
      // One flat roster for every call type. Call contracts §6 binds Call 1 and
      // Call 3 to *the same file*; a per-call-type directory could hold two
      // copies, and two copies drift silently. The old `temperamentDir` opt-in
      // existed to defeat that and is gone with the directory that needed it.
      raw[name] = read(join(prompts.temperamentRoot, `${temperamentId}.md`)).trim();
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

/**
 * Compose one arm into the two messages that go on the wire.
 *
 * `opts.prompts` is a {systemRoot, userRoot, temperamentRoot} triple — the
 * ownership split described in `prompts.mjs`. Callers pass `PROMPTS` from
 * there; only the selftest supplies roots of its own.
 */
export function composeArm(suite, armName, opts) {
  const spec = CALL_TYPES[suite.call_type];
  const { prompts } = opts;
  const { values, temperamentId } = slotValues(suite, armName, opts);
  const ver = suite.template_version;
  return {
    system: fillSlots(read(join(prompts.systemRoot, spec.promptDir, `base-${ver}.md`)), values),
    user: fillSlots(read(join(prompts.userRoot, spec.promptDir, `user-${ver}.md`)), values),
    temperamentId,
  };
}

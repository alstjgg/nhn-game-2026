#!/usr/bin/env node
// Datapack lint — pipeline §2 stage 2. Zero calls, zero deps.
//
//   node lint-datapack.mjs <data/scenario/slug-dir>
//
// Three severities, three meanings:
//   ERROR — schema violation or broken reference. The pack is not consumable;
//           a compile mistake. Exit code 1.
//   WARN  — probably a design fault (A12 vocabulary collision, unattributed
//           gate). Flags, never blocks — only the author knows whether an
//           overlap is load-bearing.
//   FLAG  — hardening incomplete (empty buckets/predicates, null meter
//           initials, free-text exposure conditions). Expected for a
//           draft-stage pack; the list is the hardening worklist.
//
// Rule set: docs/dday-datapack-lint-rules.md. Schemas are the law
// (data/scenario/_schema); this script implements the subset of JSON Schema
// they actually use, so the schema files stay the single source of truth.

import { readFileSync } from 'node:fs';
import { join, resolve, basename } from 'node:path';

const packDir = process.argv[2];
if (!packDir) {
  console.error('usage: node lint-datapack.mjs <data/scenario/slug-dir>');
  process.exit(1);
}
const PACK = resolve(packDir);
const SCHEMA_DIR = join(PACK, '..', '_schema');
const FILES = ['meta', 'timeline', 'characters', 'places', 'temperament', 'gates', 'truths', 'score', 'symptoms'];

const errors = [];
const warns = [];
const flags = [];

// ---------- load ----------

const pack = {};
for (const name of FILES) {
  const path = join(PACK, `${name}.json`);
  try {
    pack[name] = JSON.parse(readFileSync(path, 'utf8'));
  } catch (e) {
    errors.push(`${name}.json: cannot read/parse — ${e.message}`);
  }
}
if (errors.length) { report(); process.exit(1); }

// ---------- schema validation (subset used by _schema/*.schema.json) ----------

function validate(schema, data, path, root) {
  if (schema.$ref) {
    const ref = schema.$ref.replace('#/$defs/', '');
    return validate(root.$defs[ref], data, path, root);
  }
  const types = Array.isArray(schema.type) ? schema.type : schema.type ? [schema.type] : null;
  if (types) {
    const t = data === null ? 'null'
      : Array.isArray(data) ? 'array'
      : Number.isInteger(data) ? 'integer'
      : typeof data;
    const ok = types.some((want) =>
      want === t || (want === 'number' && (t === 'integer')) || (want === 'integer' && t === 'integer'));
    if (!ok) { errors.push(`${path}: expected ${types.join('|')}, got ${t}`); return; }
  }
  if (schema.enum && !schema.enum.includes(data)) {
    errors.push(`${path}: ${JSON.stringify(data)} not in enum [${schema.enum.join(', ')}]`);
  }
  if (typeof data === 'string') {
    if (schema.pattern && !new RegExp(schema.pattern).test(data)) {
      errors.push(`${path}: "${data.length > 40 ? data.slice(0, 40) + '…' : data}" fails pattern ${schema.pattern}`);
    }
    if (schema.minLength != null && data.length < schema.minLength) {
      errors.push(`${path}: shorter than minLength ${schema.minLength}`);
    }
  }
  if (Array.isArray(data)) {
    if (schema.minItems != null && data.length < schema.minItems) {
      errors.push(`${path}: ${data.length} items < minItems ${schema.minItems}`);
    }
    if (schema.maxItems != null && data.length > schema.maxItems) {
      errors.push(`${path}: ${data.length} items > maxItems ${schema.maxItems}`);
    }
    if (schema.items) data.forEach((v, i) => validate(schema.items, v, `${path}[${i}]`, root));
  }
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    for (const req of schema.required ?? []) {
      if (!(req in data)) errors.push(`${path}: missing required field "${req}"`);
    }
    for (const [k, v] of Object.entries(data)) {
      if (schema.properties && k in schema.properties) {
        validate(schema.properties[k], v, `${path}.${k}`, root);
      } else if (schema.additionalProperties === false) {
        errors.push(`${path}: unknown field "${k}"`);
      } else if (schema.additionalProperties && typeof schema.additionalProperties === 'object') {
        validate(schema.additionalProperties, v, `${path}.${k}`, root);
      }
    }
  }
}

for (const name of FILES) {
  let schema;
  try {
    schema = JSON.parse(readFileSync(join(SCHEMA_DIR, `${name}.schema.json`), 'utf8'));
  } catch (e) {
    errors.push(`_schema/${name}.schema.json: cannot read/parse — ${e.message}`);
    continue;
  }
  validate(schema, pack[name], name, schema);
}

// ---------- id tables ----------

const gateIds = new Set(pack.gates.gates?.map((g) => g.gate) ?? []);
const truthIds = new Set(pack.truths.truths?.map((t) => t.id) ?? []);
const placeIds = new Set(pack.places.places?.map((p) => p.id) ?? []);

function uniq(list, label) {
  const seen = new Set();
  for (const id of list) {
    if (seen.has(id)) errors.push(`${label}: duplicate id "${id}"`);
    seen.add(id);
  }
}
uniq(pack.timeline.events?.map((e) => e.id) ?? [], 'timeline');
uniq(pack.characters.characters?.map((c) => c.id) ?? [], 'characters');
uniq(pack.gates.gates?.map((g) => g.gate) ?? [], 'gates');
uniq(pack.truths.truths?.map((t) => t.id) ?? [], 'truths');
uniq(pack.places.places?.map((p) => p.id) ?? [], 'places');
uniq(pack.score.units?.map((u) => u.id) ?? [], 'score.units');
uniq(pack.truths.truths?.flatMap((t) => [...t.carriers, ...t.false_leads].map((s) => s.id)) ?? [], 'truths sentence registry');

// ---------- referential integrity (ERROR) ----------

const charIds = new Set(pack.characters.characters?.map((c) => c.id) ?? []);
for (const e of pack.timeline.events ?? []) {
  if (e.place_id && !placeIds.has(e.place_id)) errors.push(`timeline ${e.id}: unknown place_id "${e.place_id}"`);
  for (const p of e.present ?? []) {
    if (!charIds.has(p.char_id)) errors.push(`timeline ${e.id}: present references unknown character "${p.char_id}"`);
  }
}
for (const g of pack.gates.gates ?? []) {
  const stanceIds = new Set(g.stances.map((s) => s.id));
  uniq(g.stances.map((s) => s.id), `${g.gate} stances`);
  if (!stanceIds.has(g.default_stance)) errors.push(`${g.gate}: default_stance "${g.default_stance}" not in stance set`);
  if (g.place_id && !placeIds.has(g.place_id)) errors.push(`${g.gate}: unknown place_id "${g.place_id}"`);
  const condIds = new Set(g.key_conditions.map((k) => k.id));
  uniq(g.key_conditions.map((k) => k.id), `${g.gate} key_conditions`);
  const perCond = new Map([...condIds].map((k) => [k, 0]));
  for (const ex of g.key_examples) {
    if (!condIds.has(ex.for)) errors.push(`${g.gate}: key_example for "${ex.for}" — no such condition`);
    else perCond.set(ex.for, perCond.get(ex.for) + 1);
  }
  for (const [k, n] of perCond) {
    if (n < 2) errors.push(`${g.gate}: condition ${k} has ${n} example(s) — a one-sentence lock is a lottery, need ≥2 (manual §3-5a)`);
  }
  for (const b of g.buckets) {
    for (const s of b.stances) if (!stanceIds.has(s)) errors.push(`${g.gate} bucket ${b.id}: unknown stance "${s}"`);
  }
}
for (const c of pack.characters.characters ?? []) {
  for (const id of c.strands.truth_ids) if (!truthIds.has(id)) errors.push(`${c.id} ${c.name}: strand references unknown truth "${id}"`);
  for (const id of c.strands.gate_ids) if (!gateIds.has(id)) errors.push(`${c.id} ${c.name}: strand references unknown gate "${id}"`);
}
for (const u of pack.score.units ?? []) {
  for (const id of u.attributed_gates) if (!gateIds.has(id)) errors.push(`score ${u.id}: attributed to unknown gate "${id}"`);
}

// ---------- attributability (WARN) — guide §5: 원인 없는 결과는 버그 ----------

const attributed = new Set((pack.score.units ?? []).flatMap((u) => u.attributed_gates));
for (const g of gateIds) {
  if (!attributed.has(g)) warns.push(`gate ${g} is attributed by no score unit — a gate that changes no tally is decoration`);
}

// ---------- A12 — stance ↔ temperament vocabulary collision (WARN) ----------

const STOP = new Set([
  '있다', '없다', '한다', '이다', '그것', '이것', '하나', '먼저', '지금', '어느',
  '아니다', '같은', '만든다', '아니라', '위해', '대해', '통해', '보다', '때는',
  '그렇지', '않다', '경우에는', '사실과', '것이', '멈추고', '확인한다', '확인되면',
]);
const temp = pack.temperament;
const proseTokens = [...new Set(
  [temp.default_disposition, ...temp.clauses.flatMap((c) => [c.condition, c.defeat_condition])]
    .join(' ').match(/[가-힣]{2,}/g) ?? []
)].filter((t) => !STOP.has(t));
const axisTokens = temp.clauses.flatMap((c) => [c.axis, ...c.axis_vocabulary]);

for (const g of pack.gates.gates ?? []) {
  for (const s of g.stances) {
    // axis vocabulary against label AND desc — the lock's own words must not name a stance
    const axisHits = axisTokens.filter((t) => s.label.includes(t) || s.desc.includes(t) || (t.length >= 2 && t.includes(s.label)));
    // whole-temperament prose against label only (prototype behaviour, particles ride along)
    const proseHits = proseTokens.filter((t) => (s.label.includes(t) || t.includes(s.label)) && !axisHits.includes(t));
    const hits = [...axisHits, ...proseHits];
    if (hits.length) warns.push(`A12 ${g.gate} stance ${s.id}) ${s.label} — reuses temperament vocabulary: ${hits.join(' · ')}`);
  }
}

// ---------- W3 — key example species vs condition species (heuristic) ----------
// The key is a condition CLASS (axis × referent × species); an example outside
// the condition's species teaches the player the wrong lock shape and poisons
// anything that derives positives from key_examples (suite generator, oracle).
// Species is inferred from mined_from wording — heuristic, so WARN not ERROR.

const inferSpecies = (minedFrom) =>
  /주관 보고서|자기 서술|자기서술/.test(minedFrom) ? '자기서술'
    : /객관 로그|객관 사건/.test(minedFrom) ? '사실'
      : null;
for (const g of pack.gates.gates ?? []) {
  const condSpecies = new Map(g.key_conditions.map((k) => [k.id, k.species]));
  for (const ex of g.key_examples) {
    const inferred = inferSpecies(ex.mined_from);
    const want = condSpecies.get(ex.for);
    if (inferred && want && inferred !== want) {
      warns.push(`W3 ${g.gate} example for ${ex.for}: mined_from suggests ${inferred}, condition wants ${want} — "${ex.text.slice(0, 24)}…"`);
    }
  }
}

// ---------- W4 — key example carries the targeted clause's axis vocabulary ----------
// Measured: an example that doesn't speak the axis vocabulary opens nothing
// (manual §3-1 — same fact, wrong axis = 0). Stem-matched (first 2 syllables)
// to ride Korean conjugation; heuristic, so WARN.

const clauseVocab = new Map(temp.clauses.map((c) => {
  const stems = [c.axis, ...c.axis_vocabulary]
    .flatMap((t) => t.split(/\s+/))
    .flatMap((t) => (t.length > 2 ? [t, t.slice(0, 2)] : [t]));
  return [c.id, [...new Set(stems)]];
}));
const clauseByRef = (targetsClause) => {
  const m = targetsClause.match(/조건절\s*(\d+)/);
  return m ? `cl${m[1]}` : null;
};
for (const g of pack.gates.gates ?? []) {
  const condClause = new Map(g.key_conditions.map((k) => [k.id, clauseByRef(k.targets_clause)]));
  for (const ex of g.key_examples) {
    const cl = condClause.get(ex.for);
    const stems = cl ? clauseVocab.get(cl) : null;
    if (stems && !stems.some((s) => ex.text.includes(s))) {
      warns.push(`W4 ${g.gate} example for ${ex.for}: text carries no axis vocabulary of ${cl} (${stems.slice(0, 4).join('/')}…) — "${ex.text.slice(0, 24)}…"`);
    }
  }
}

// ---------- symptoms (engine spec §2.2/§6) ----------
// Order + digits are ERRORs whenever entries exist (a malformed symptom file
// is not consumable). Coverage activates once actuator deltas exist: every
// (variable, direction) a bucket delta can produce needs a min:1 entry, or
// the renderer hard-errors at runtime — on exactly the stances that trip it.

const symptoms = pack.symptoms ?? {};
for (const [variable, dirs] of Object.entries(symptoms)) {
  if (variable === 'flags') {
    for (const [id, f] of Object.entries(dirs)) {
      for (const key of ['set', 'unset']) {
        if (typeof f[key] === 'string' && /\d/.test(f[key])) errors.push(`symptoms flags.${id}.${key}: digits in symptom text (I12)`);
      }
    }
    continue;
  }
  for (const [dir, list] of Object.entries(dirs)) {
    for (let i = 1; i < list.length; i++) {
      if (list[i].min > list[i - 1].min) {
        errors.push(`symptoms ${variable}.${dir}: entries not in descending min order (${list[i - 1].min} → ${list[i].min}) — the renderer takes the first match`);
        break;
      }
    }
    for (const e of list) {
      if (/\d/.test(e.text)) errors.push(`symptoms ${variable}.${dir} (min ${e.min}): digits in symptom text (I12)`);
    }
  }
}

const dirOf = (n) => (n > 0 ? 'up' : n < 0 ? 'down' : null);
const reachable = new Set();
const flagReachable = new Set();
for (const g of pack.gates.gates ?? []) {
  for (const b of g.buckets) {
    for (const [variable, delta] of Object.entries(b.deltas)) {
      const dir = dirOf(delta);
      if (dir) reachable.add(`${variable}/${dir}`);
    }
    for (const [id, val] of Object.entries(b.flags ?? {})) {
      flagReachable.add(`${id}/${val ? 'set' : 'unset'}`);
    }
  }
}
for (const e of pack.timeline.events ?? []) {
  if (!e.effects) continue;
  for (const [variable, delta] of Object.entries(e.effects.deltas)) {
    const dir = dirOf(delta);
    if (dir) reachable.add(`${variable}/${dir}`);
  }
  for (const [id, val] of Object.entries(e.effects.flags)) {
    flagReachable.add(`${id}/${val ? 'set' : 'unset'}`);
  }
}
for (const key of reachable) {
  const [variable, dir] = key.split('/');
  const list = symptoms[variable]?.[dir];
  if (!list) errors.push(`symptom coverage: (${variable}, ${dir}) is reachable by an actuator but symptoms.json has no ${variable}.${dir} list (engine spec §6-2 failure ②)`);
  else if (!list.some((e) => e.min === 1)) errors.push(`symptom coverage: ${variable}.${dir} has no min:1 entry — smallest deltas fall through (engine spec §6-2 failure ①)`);
}
for (const key of flagReachable) {
  const [id, kind] = key.split('/');
  if (typeof symptoms.flags?.[id]?.[kind] !== 'string') {
    errors.push(`symptom coverage: flag ${id} can be ${kind} by an actuator (bucket or event effect) but symptoms.json has no flags.${id}.${kind} sentence`);
  }
}

// ---------- hardening-incomplete flags ----------

for (const g of pack.gates.gates ?? []) {
  if (!g.buckets.length) flags.push(`${g.gate}: buckets empty`);
  if (!g.edge_predicates.length) flags.push(`${g.gate}: edge_predicates empty`);
  if (g.availability) flags.push(`${g.gate}: availability is free text — promote to a predicate`);
}
for (const c of pack.characters.characters ?? []) {
  for (const m of c.meters) if (m.initial === null) flags.push(`${c.id} ${c.name}: meter "${m.label}" initial unset`);
}
for (const u of pack.score.units ?? []) {
  if (!u.predicates.length) flags.push(`score ${u.id} (${u.label}): predicates empty`);
}
for (const e of pack.timeline.events ?? []) {
  if (e.exposure.extra_condition) flags.push(`timeline ${e.id}: exposure has free-text extra_condition — promote to a predicate`);
}
for (const p of pack.places.places ?? []) {
  for (const [i, y] of (p.yields ?? []).entries()) {
    if (!y.clock && y.depth_note) flags.push(`${p.id} ${p.name} yield[${i}]: depth is free text ("${y.depth_note}") — promote to a predicate`);
  }
}
if (!Object.keys(symptoms).length) flags.push('symptoms.json empty — authored during hardening; until then state changes have no path to the screen');
const unfilledEffects = (pack.timeline.events ?? []).filter((e) => e.effects === null).length;
if (unfilledEffects) flags.push(`timeline: effects null on ${unfilledEffects} event(s) — machine effects are assigned during gate hardening`);
const unfilledPresent = (pack.timeline.events ?? []).filter((e) => e.present === null).length;
if (unfilledPresent) flags.push(`timeline: present null on ${unfilledPresent} event(s) — beat rosters (Call 2 PRESENT_NPCS) are assigned during gate hardening`);

// ---------- report ----------

function report() {
  console.log(`pack   ${basename(PACK)}  (${FILES.length} files + draft.md)`);
  console.log(`schema ${SCHEMA_DIR}\n`);
  const groups = [
    ['ERROR', errors, '✗'],
    ['WARN', warns, '⚠'],
    ['FLAG (hardening incomplete)', flags, '·'],
  ];
  for (const [title, list, mark] of groups) {
    console.log(`${title}: ${list.length}`);
    for (const line of list) console.log(`  ${mark} ${line}`);
    console.log('');
  }
  if (!errors.length) {
    console.log(flags.length
      ? '✓ pack is consumable. FLAG list above is the hardening worklist.'
      : '✓ pack is consumable and fully hardened.');
  } else {
    console.log('✗ pack is not consumable — fix compile errors above.');
  }
}
report();
process.exit(errors.length ? 1 : 0);

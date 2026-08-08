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
// Rule set: docs/contract-datapack.md §3. Schemas are the law
// (data/scenario/_schema); this script implements the subset of JSON Schema
// they actually use, so the schema files stay the single source of truth.

import { readFileSync } from 'node:fs';
import { join, resolve, basename } from 'node:path';
// The predicate grammar has ONE implementation, and this is how lint reaches it
// rather than carrying a second (contract-datapack §3.6). `datapack:lint` runs
// with `--experimental-strip-types` for this import; the floor that needs
// (Node 22.6) sits under `engines.node`'s `>=22.12`.
import { identifiers, problems } from '../src/shared/predicates.ts';

const packDir = process.argv[2];
if (!packDir) {
  console.error('usage: node lint-datapack.mjs <data/scenario/slug-dir>');
  process.exit(1);
}
const PACK = resolve(packDir);
const SCHEMA_DIR = join(PACK, '..', '_schema');
const FILES = ['meta', 'timeline', 'characters', 'places', 'temperament', 'gates', 'truths', 'score', 'symptoms', 'hardening'];

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

// The subset contract, made loud (#104 review 1(b)): a keyword outside this
// set was NOT checked, and silence would mean a rule written in a normative
// schema simply never runs. Adding a keyword to a schema means teaching the
// validator about it — this error is the reminder.
const KNOWN_KEYWORDS = new Set([
  '$schema', '$id', '$ref', '$defs', 'title', 'description',
  'type', 'enum', 'pattern', 'minLength', 'minimum', 'maximum',
  'minItems', 'maxItems', 'items', 'required', 'properties',
  'additionalProperties', 'anyOf',
]);

function validate(schema, data, path, root) {
  for (const k of Object.keys(schema)) {
    if (!KNOWN_KEYWORDS.has(k)) {
      errors.push(`${path}: schema keyword "${k}" is not implemented by this validator — the rule it states was NOT checked`);
    }
  }
  if (schema.$ref) {
    const ref = schema.$ref.replace('#/$defs/', '');
    return validate(root.$defs[ref], data, path, root);
  }
  if (schema.anyOf) {
    const saved = errors.length;
    for (const branch of schema.anyOf) {
      validate(branch, data, path, root);
      if (errors.length === saved) return;
      errors.length = saved;
    }
    errors.push(`${path}: matches no anyOf branch`);
    return;
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
  if (typeof data === 'number') {
    if (schema.minimum != null && data < schema.minimum) {
      errors.push(`${path}: ${data} < minimum ${schema.minimum}`);
    }
    if (schema.maximum != null && data > schema.maximum) {
      errors.push(`${path}: ${data} > maximum ${schema.maximum}`);
    }
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
// `?? {}` guards: a malformed effects object is already a schema ERROR above —
// this loop must still reach report() instead of crashing and losing it (#104 review 1, repro ②)
for (const e of pack.timeline.events ?? []) {
  if (!e.effects) continue;
  for (const [variable, delta] of Object.entries(e.effects.deltas ?? {})) {
    const dir = dirOf(delta);
    if (dir) reachable.add(`${variable}/${dir}`);
  }
  for (const [id, val] of Object.entries(e.effects.flags ?? {})) {
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

// ---------- E8 — deltas are non-zero integers (engine spec §1.3 / §6-3) ----------
// Symptom lookup matches |Δ| against integer min tiers: a fractional delta
// matches no sentence (runtime hard error §2.3-2) and a zero delta is dropped
// from rendering (§2.3-1) — coverage (E7) sees only (variable, direction) and
// passes both, so the authoring-time check lives here.

const checkDelta = (v, where) => {
  if (!Number.isInteger(v)) errors.push(`E8 ${where}: delta must be an integer — ${v} falls through every symptom min tier (engine spec §1.3)`);
  else if (v === 0) errors.push(`E8 ${where}: delta 0 changes nothing and is dropped from symptom rendering (engine spec §2.3-1) — remove the entry`);
};
for (const g of pack.gates.gates ?? []) {
  for (const b of g.buckets) {
    for (const [variable, v] of Object.entries(b.deltas ?? {})) checkDelta(v, `${g.gate} bucket ${b.id} delta ${variable}`);
  }
}
for (const e of pack.timeline.events ?? []) {
  if (!e.effects) continue;
  for (const [variable, v] of Object.entries(e.effects.deltas ?? {})) checkDelta(v, `timeline ${e.id} effects delta ${variable}`);
}

// ---------- hardening-incomplete flags ----------

for (const g of pack.gates.gates ?? []) {
  if (!g.buckets.length) flags.push(`${g.gate}: buckets empty`);
  if (!g.edge_predicates.length) flags.push(`${g.gate}: edge_predicates empty`);
  if (g.availability) flags.push(`${g.gate}: availability is free text — promote to a predicate`);
}
// F2 covers both halves of a binding: a meter with variable === null is as
// unbound as one with initial === null — a typo'd overlay key used to demote
// variable to null with byte-identical lint output (#104 review 2)
for (const c of pack.characters.characters ?? []) {
  for (const m of c.meters) {
    if (m.variable === null || m.initial === null) {
      flags.push(`${c.id} ${c.name}: meter "${m.label}" unbound (variable: ${m.variable ?? '—'} · initial: ${m.initial ?? '—'})`);
    }
  }
}
for (const u of pack.score.units ?? []) {
  if (!u.predicates.length) flags.push(`score ${u.id} (${u.label}): predicates empty`);
}

/* ── E-P1…E-P4 — the predicate rule set (contract-datapack §3.6) ─────────── */

// Every name a predicate is allowed to say. Flags come from wherever the pack
// SETS one — a gate bucket or a timeline event — and scalars from the meters
// that are actually bound, so an unbound meter (F2) is not a name a predicate
// may read yet.
const settableFlags = new Set();
for (const g of pack.gates.gates ?? []) {
  for (const b of g.buckets ?? []) for (const f of Object.keys(b.flags ?? {})) settableFlags.add(f);
}
// Flags only the fixed timeline sets. These are the ones a condition may not
// read: the timeline fires unconditionally, so `bridge_collapsed` does not mean
// "the bridge fell" — it means the day reached its end, and a predicate that
// branches on it branches on nothing (§3.6).
const timelineOnlyFlags = new Set();
for (const e of pack.timeline.events ?? []) {
  for (const f of Object.keys(e.effects?.flags ?? {})) {
    settableFlags.add(f);
    if (!(pack.gates.gates ?? []).some((g) => (g.buckets ?? []).some((b) => f in (b.flags ?? {})))) {
      timelineOnlyFlags.add(f);
    }
  }
}
const boundScalars = new Set();
for (const c of pack.characters.characters ?? []) {
  for (const m of c.meters) if (m.variable !== null) boundScalars.add(m.variable);
}

for (const u of pack.score.units ?? []) {
  const where = `score ${u.id} (${u.label})`;
  u.predicates.forEach((predicate, i) => {
    for (const problem of problems(predicate)) {
      errors.push(`${where} predicate[${i}]: ${problem} — "${predicate}"`); // E-P1
    }
    for (const name of identifiers(predicate)) {
      if (!settableFlags.has(name) && !boundScalars.has(name)) {
        errors.push(`${where} predicate[${i}]: nothing in the pack sets or binds "${name}"`); // E-P2
      } else if (timelineOnlyFlags.has(name)) {
        // E-P3
        errors.push(
          `${where} predicate[${i}]: "${name}" is set by the fixed timeline alone — it is always true at 21:04, so branching on it branches on nothing. Read an intervention flag instead`,
        );
      }
    }
  });
  // E-P4 — the fallback. A unit whose rules can all miss has no value at all,
  // and one written early makes every rule below it dead: the reader takes the
  // FIRST match and cannot see that the lines after it are unreachable.
  if (u.predicates.length) {
    const fallbacks = u.predicates.filter((p) => p.trim().startsWith('=>'));
    if (!fallbacks.length) errors.push(`${where}: no fallback — every rule can miss, leaving the unit unscored`);
    else if (fallbacks.length > 1) errors.push(`${where}: ${fallbacks.length} fallbacks — all but the first are dead`);
    else if (!u.predicates[u.predicates.length - 1].trim().startsWith('=>')) {
      errors.push(`${where}: the fallback is not last — every rule after it is dead`);
    }
  }
}
/* ── E-P5 — the first run is the worst run (guide §5, manual §5) ─────────── */

// Sibling of E-P3, one step in from it. E-P3 catches a flag the fixed timeline
// always sets; this catches a flag set by DOING NOTHING. An empty handover
// takes `default_stance` at every gate, so whatever those buckets set is on in
// run 1 — and a score rule reading one of them matches before the player has
// touched the game. The unit then never resolves to its `=>` fallback on the
// no-intervention path, which is precisely the 무개입 기준 the draft printed.
// The symptom is quiet and expensive: the baseline column looks authored and
// correct, and no run ever scores it.
//
// Only flags are checked. Meter deltas on a default bucket are fine — symptoms
// are the surface of state, not score — and stay fine exactly because score
// conditions read intervention flags, never scalars.
const defaultStanceFlags = new Map();
for (const g of pack.gates.gates ?? []) {
  const bucket = (g.buckets ?? []).find((b) => (b.stances ?? []).includes(g.default_stance));
  for (const f of Object.keys(bucket?.flags ?? {})) defaultStanceFlags.set(f, g.gate);
}
for (const u of pack.score.units ?? []) {
  u.predicates.forEach((predicate, i) => {
    for (const name of identifiers(predicate)) {
      const gate = defaultStanceFlags.get(name);
      if (gate === undefined) continue;
      errors.push(
        `score ${u.id} (${u.label}) predicate[${i}]: "${name}" is set by ${gate}'s default stance, so an empty handover sets it — this rule matches on run 1 and the unit can never reach its 무개입 baseline. Move the flag off the default stance, or read a different one`,
      );
    }
  });
}

/* ── E-K1/E-K2 — the lock space (manual §3-5, 집필 스킬 §4-7) ─────────────── */

// A key is 축 × 지목 × 인증 종, and the probe measured that a right-axis
// sentence pointed at the wrong thing scores zero. So two axes are NOT two
// locks — the 지목 is what keeps them apart, and a repeated triple is one lock
// wearing two gates' clothes: the same mined sentence opens both, and the
// second gate stops being a question. 우는다리 cuts nine conditions out of two
// axes with no repeat, which is the standard this encodes.
const tripleSeen = new Map();
for (const g of pack.gates.gates ?? []) {
  for (const k of g.key_conditions ?? []) {
    const triple = `${k.axis} × ${k.referent} × ${k.species}`;
    const prior = tripleSeen.get(triple);
    if (prior) {
      errors.push(`${g.gate} ${k.id}: key condition ${triple} repeats ${prior} — one lock on two gates. Vary the 지목`); // E-K1
    } else tripleSeen.set(triple, `${g.gate} ${k.id}`);
  }
}

// E-K2 — clause coverage. A clause no gate targets is a lock with no door; a
// clause EVERY gate targets means one learned axis opens the whole scenario in
// a single run. Only meaningful with two clauses — a one-clause 기질
// necessarily owns every gate, and the schema permits it.
const clauseIds = (pack.temperament.clauses ?? []).map((c) => c.id);
if (clauseIds.length > 1) {
  const gateCount = (pack.gates.gates ?? []).length;
  const byClause = new Map(clauseIds.map((id) => [id, new Set()]));
  for (const g of pack.gates.gates ?? []) {
    for (const k of g.key_conditions ?? []) {
      // `targets_clause` is authored prose ("기질 조건절 1 (두려움 축)") — the
      // ordinal in it is the link, so read that rather than demanding an id.
      const n = /(\d+)/.exec(k.targets_clause ?? '');
      const id = n ? `cl${n[1]}` : null;
      if (id !== null && byClause.has(id)) byClause.get(id).add(g.gate);
    }
  }
  for (const [id, gates] of byClause) {
    if (gates.size === 0) warns.push(`기질 ${id}: no gate targets this clause — a lock with no door`);
    else if (gateCount > 1 && gates.size === gateCount) {
      warns.push(`기질 ${id}: every gate targets this clause — one learned axis opens the whole scenario`);
    }
  }
}

/* ── E-V1 — 갈림길 구조가 플레이어에게 닿는 면에 (가이드 §6-9) ───────────── */

// spec-client §3 invariant 6. `tests/scaffold/no-gate-vocab.test.ts` is the
// authoritative guard: it scans every string in every published file through
// the build plugin's own `publishedContentOf`, so it cannot pass on bytes the
// deploy does not ship. This is NOT a second copy of that — it is the
// WRITER-FACING subset, the authored slots a draft can put prose into that the
// browser then downloads, checked here so the factory's compile→lint gate
// catches a leak in round 1 instead of at `npm test` long afterwards.
//
// Failing safe is the point: if a strip is added later this may over-report,
// which costs one rewording. It can never under-report into a hole, because
// the test above is what actually holds the line.
const GATE_VOCAB = /갈림길|게이트|\bgate\b/i;
const GATE_REF = /\bG[1-9]\d*\b/;
const playerFacing = [];
const say = (where, value) => {
  if (typeof value === 'string' && value.trim()) playerFacing.push([where, value]);
};
say('meta.logline', pack.meta.logline);
for (const e of pack.timeline.events ?? []) {
  say(`timeline ${e.id} 사건`, e.text);
  say(`timeline ${e.id} 런 깊이`, e.exposure?.extra_condition);
}
say('기질 기본 성향', pack.temperament.default_disposition);
for (const c of pack.temperament.clauses ?? []) {
  say(`기질 ${c.id} 조건절`, c.condition);
  say(`기질 ${c.id} 패배 조건`, c.defeat_condition);
}
for (const c of pack.characters.characters ?? []) {
  say(`${c.id} ${c.name} 이해관계`, c.interest);
  for (const k of [...(c.knows ?? []), ...(c.doesnt_know ?? [])]) say(`${c.id} ${c.name} 아는 것`, k);
}
for (const g of pack.gates.gates ?? []) {
  say(`${g.gate} 제목`, g.title);
  say(`${g.gate} 장면`, g.scene);
  say(`${g.gate} question`, g.question);
  for (const s of g.stances ?? []) say(`${g.gate} stance ${s.id}`, s.desc);
  for (const [i, f] of (g.false_leads ?? []).entries()) say(`${g.gate} false_lead[${i}]`, f);
}
for (const [variable, dirs] of Object.entries(pack.symptoms ?? {})) {
  if (variable === 'flags') {
    for (const [id, kinds] of Object.entries(dirs ?? {})) {
      for (const kind of ['set', 'unset']) say(`symptoms flags.${id}.${kind}`, kinds?.[kind]);
    }
  } else {
    for (const dir of ['up', 'down']) {
      for (const e of dirs?.[dir] ?? []) say(`symptoms ${variable}.${dir}`, e.text);
    }
  }
}
for (const [where, value] of playerFacing) {
  const hit = GATE_VOCAB.exec(value) ?? GATE_REF.exec(value);
  if (hit) {
    errors.push(`E-V1 ${where}: gate structure on a player surface — "${hit[0]}" in "${value.slice(0, 32)}…". Say what happened in the world instead (가이드 §6-9)`);
  }
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

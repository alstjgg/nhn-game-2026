# Contract — Scenario Datapack

> **Tier:** `contract-` — a fixed interface between two owners.
> **Producer:** the compile stage (data track, 민서). **Consumer:** the engine
> and the payload composer (architecture track, 윤석).
> **Spec version:** v0.4.

## Where the law lives

This document is the **map**. It is not the law. Read this to understand what a
pack is and why each decision holds; read the schemas to know whether a given
file is valid.

| Artifact | Role | Drift guard |
|---|---|---|
| `data/scenario/_schema/*.schema.json` | **The law.** JSON Schema draft 2020-12, one per pack file. Field-level types are normative here | — |
| `src/shared/datapack.ts` | Transcription, for TypeScript consumers | ✅ **Generated** by `authoring/generate-datapack-types.mjs`; `--check` exits non-zero on drift |
| `docs/scenario/gate-hardening-manual.md` §5 | The law for the **gate card**, which rides into `gates.json` verbatim | lint E1–E5 |
| This document | Map + decisions in force | — |

**Why JSON Schema and not TypeScript.** A TS type is erased at runtime: it
*describes* JSON but cannot *check* it, so code reading a pack through
`datapack.ts` would simply be trusting the data. Packs must be validated where
neither an engine nor a TS build exists — the compile and lint stages, before
anything loads them. Rules like "≥2 key examples per condition" or `^G[0-9]+$`
have no TS expression at all. See physical architecture §3.1.

**When this document and the engine spec disagree**, the data track revises
this document to restore fit — by revision, not by meeting.

## 1. Pack layout

`data/scenario/<slug>/`. This is the compile stage's output and the engine's
input.

| File | Contents | Draft source |
|---|---|---|
| `meta.json` | slug · title · logline · scenario clock (start–end) · D-Day | logline |
| `timeline.json` | fixed events: id · time · surface (call / cctv / onsite / document) · place ref · text · exposure (`visible_from` clock + free-text `extra_condition`) · **`effects`** (scalar deltas + flag set/unset — engine spec §1.2 actuator (b); `null` until hardening) · **`present`** (beat roster, `{char_id, side}`) | fixed timeline (narrative form; machine effects assigned at hardening) |
| `characters.json` | id · role · interest · knows / doesn't-know · ≤2 meters (variable binding + initial, `null` until hardening) · strands (truth/gate refs — attributability input) | characters |
| `places.json` | id · name · yields: ≥2 entries of (clock or depth note → info) | places |
| `temperament.json` | default disposition · ≤2 clauses (axis · **`axis_vocabulary`** · condition · defeat condition) | temperament proposal |
| `gates.json` | the gate card as-is (hardening manual §5): standard form · stance set · `default_stance` · **`key_conditions`** · `key_examples` · false leads · buckets (`deltas` + `flags`) · `edge_predicates` — plus clock/place/scene prose carried from the draft | gate cards |
| `truths.json` | truth → carrier sentences (id + text + where) · false leads. **This file issues sentence ids** (`trN-sN` / `trN-fN`) | hidden truths |
| `score.json` | units (tallies · baseline · attributed gates · predicates) · no-intervention baseline · variance notes | score |
| `symptoms.json` | state change → symptom sentences, per (variable × direction × magnitude band) + flag set/unset. **The only channel by which state reaches the screen** (engine spec §2.2) | — (hardening; compile emits an empty skeleton) |
| `hardening.json` | **Hand-authored source, not compiler output** — hardening values with no home in the draft: meter variable bindings + initials · per-event `effects` and beat rosters · symptoms. Compile merges it into the three files above | — (hardening) |
| `draft.md` | the source draft, moved in verbatim — the pack is self-contained and the draft's home moves with compilation | whole draft |

## 2. Decisions in force

**Keys are stored as conditions (axis × referent × certified species), never as
sentence ids.** What opens a gate is the *class* of sentences satisfying the
condition (hardening manual §3-5); a single blessed string turns deduction into
a lottery. The condition is authoring/lint/oracle metadata — at runtime the
injected sentence simply rides the judgment call and the engine reads only the
stance, so determinism is untouched.

**Compile is extraction, not authoring.** Text fields carry the draft's
sentences verbatim. Anything the draft does not state compiles to `null`/empty —
never to an invented value. No LLM touches this stage: pack sentences are the
mining vein, and a silent paraphrase would break key conditions invisibly.

**Hardening has exactly two homes, and recompile is idempotent (v0.3).** Gate
machinery (buckets · `predicted_shift` · edge predicates) is authored in the
draft's gate cards — that *is* the canonical card form (hardening manual §5) —
and the compiler parses hardened cards. Everything mechanical with no draft home
(meter variable bindings + initials, event effects, symptoms) is authored in
`hardening.json` and merged at compile. Nothing is ever hand-edited in compiler
output, so recompiling from the draft never destroys hardening work.

> Overlay event keys are positional, so drift is guarded twice: `time` catches
> added/split rows, and `text_head` (a prefix of the target event's text, matched
> with `startsWith`) catches same-time rows swapping places — the case `time`
> alone can never see, and 우는다리 already has such a pair (t4 · t5, both 10:40).
> The compiler fails loudly on either mismatch. The overlay is itself
> schema-validated (`hardening.schema.json`, `additionalProperties: false` at
> every level) — it is the pack's only hand-written file, so it gets the
> strictest walls.

**Fields absent from draft-stage gate cards** (buckets · deltas · edge
predicates · meter initials · score predicates) are filled during hardening.
Compile passes them empty/null; lint flags the pack "hardening incomplete".
`symptoms.json` is hardening-stage for the same reason — symptoms attach to
deltas, and the draft format has no symptoms section.

**Exposure conditions beyond the clock stay free text at compile**
(`extra_condition` / `depth_note` / `availability`). They become engine
predicates during hardening; until then lint flags them as incomplete rather
than compile inventing semantics.

**Buckets carry `flags` alongside `deltas` (v0.4).** Caller-facing gates
(G1 · G4 · G7 — the man on the line) discharge through scalar deltas on his
meters. Structural gates (G2 · G3 · G5 · G6) change *world* state, not the
caller's meters — their outcome is a flag set (`logs_saved`, `originals_read`,
…), the same boolean state model as timeline `effects.flags`. Without this slot,
structural gates would harden into empty no-ops. Conditional outcomes (e.g. G6's
cancel succeeding only when `logs_saved` is set) are **not** encoded in buckets —
that resolution belongs to edge predicates and the engine, pending the routing
vocabulary.

**`default_stance` is a required field** of every gate card and rides compile
verbatim. It is the engine's Call-1 fallback *and* the P1 probe's prediction
value (engine spec §5), so it cannot be dropped silently.

**`places.json` exists because the template principle demanded it (v0.1).** The
draft format has a mandatory places section (each place yields ≥2 pieces of info
at different clock depths) and v0 had no file to receive it — a schema hole,
promoted to a file rather than hardcoded anywhere.

## 3. Conformance — the lint stage

A pack is conforming when `lint-datapack.mjs` reports no ERROR. Implementation:
`authoring/lint-datapack.mjs` (zero LLM calls, zero dependencies).
Lint consumes the schemas directly.

```bash
node authoring/lint-datapack.mjs data/scenario/<slug>
# exit 0 = consumable (WARN and FLAG are reported, not blocking)
# exit 1 = at least one ERROR
```

> **If you are tempted to hardcode a rule here, that temptation is a schema
> hole.** Anything expressible as schema goes into the schema instead; this
> section holds only what schema cannot express.

### 3.1 Severity — the three levels mean different things

| Level | Meaning | Disposition |
|---|---|---|
| **ERROR** | Schema violation or broken reference — the pack is not consumable. A compile mistake | exit 1. Fix and recompile |
| **WARN** | Probable design defect — axis-vocabulary collision, a gate nothing attributes to | Flag only, never block. Only the author knows whether a collision is load-bearing (principle A12) |
| **FLAG** | Hardening incomplete — the normal state of a draft-stage pack | The FLAG list *is* the hardening worklist |

### 3.2 ERROR — consumability

| # | Rule | Rationale |
|---|---|---|
| E1 | Each of the 10 files passes its own schema (types · required fields · enums · patterns · counts · minimums), **including the hand-authored `hardening.json`** (`additionalProperties: false` at every level, so a typo'd key is caught rather than ignored). A schema keyword the validator does not recognize is itself an ERROR — otherwise "a rule written in the schema is silently not running" | §1 · #104 review 1(b)·2 |
| E2 | A key's certified species is `사실` or `자기서술` only (schema enum) — emotion and quotation cannot enter the solution path | guide ban-list 4 · manual anti-pattern 5 |
| E3 | No duplicate ids (events · characters · places · gates · truths · the sentence registry · score units; and within a gate, stances and conditions) | — |
| E4 | Referential integrity: `place_id` → places · strands → truths/gates · `attributed_gates` → gates · bucket stance → stance set · `default_stance` → stance set · `key_examples.for` → condition id | — |
| E5 | **≥2 example sentences per condition** — a lock with one key is a raffle, not deduction | manual §3-5a |
| E6 | **Symptom file coherence** — per-direction lists sorted by `min` **descending** (the renderer takes the first match, so order carries meaning) · no digits in symptom sentences (I12) | engine spec §2.2 · §2.3-7 |
| E7 | **Symptom coverage** — for every `(variable, direction)` any actuator can produce (bucket deltas/flags **and** timeline event `effects`), `symptoms.json` must have an entry reaching down to `min: 1`; every flag an event can flip needs a matching `set`/`unset` sentence. Without this, a missing sentence becomes a runtime hard error, and only on the path that actually steps on that delta. Passes vacuously while deltas/effects are empty (pre-hardening) | engine spec §6-2 |
| E8 | **Deltas are non-zero integers.** The symptom lookup matches \|Δ\| against integer `min` bands: a fractional delta matches nothing (§2.3-2 hard error) and `0` drops out of rendering entirely (§2.3-1). E7 only inspects `(variable, direction)`, so it passes this data — exactly the "looks plausible, detonates on one path" class, caught at authoring time. Integer-ness is doubled in the schema (`integer`); non-zero lives only here | engine spec §1.3 · §6-3 |

### 3.3 WARN — design audit

| # | Rule | Rationale |
|---|---|---|
| W1 | **A12** — flag when a stance label or description reuses temperament vocabulary. Axis vocabulary (`axis_vocabulary` + the axis name) is checked against both label and description; whole-token matches from the temperament prose are checked against the label only (same behavior as the `lint-stances.mjs` prototype, accepting particle noise) | RUNLOG A12 · manual §2-5 |
| W2 | **Attributability** — a gate that no score unit attributes to is decoration | guide §5, "an effect with no cause is a bug" |
| W3 | **Example species coherence** — infer each `key_examples` entry's species from its `mined_from` phrasing (subjective report → 자기서술 · objective log → 사실) and compare with the condition's species. Since a key is a condition *class*, a species-mismatched example teaches the wrong lock shape | manual §3-5; promoted after 3 instances in the 우는다리 paper check |
| W4 | **Example axis vocabulary** — flag an example sentence carrying none of its target clause's axis vocabulary (2-syllable stem matching). The same fact scores zero if the axis is off | manual §3-1; promoted after 4 instances in the 우는다리 paper check round 2 |

### 3.4 FLAG — hardening incomplete

| # | Target | What hardening fills |
|---|---|---|
| F1 | `buckets` · `edge_predicates` empty | manual §5 buckets/delta draft |
| F2 | A meter with `variable: null` **or** `initial: null` — either one means unbound | variable binding + initial value |
| F3 | score `predicates` empty | state → aggregate predicate |
| F4 | Free-text exposure conditions (`extra_condition` · `availability` · a place yield's `depth_note`) | promotion to engine predicates |

### 3.5 What lint deliberately does not do

- **Paper check** (manual §6): timeline preemption · fixture slack · escape-hatch
  stances. One human read. The prototype's closing warning ("is there room for
  two readings to land on different stances?") belongs to this pass.
- **The narrative half of the guide's ban list** (items 1 · 2 · 5 · 6 · 7) —
  these need sentence comprehension. The beat-level part of item 7 (a fixed event
  demanding a reply from the controller) is caught by
  `tools/probe/lint-beat.mjs` once a suite exists.
- **Probing** — first gate only, and it belongs to the harness (manual §6).
- **Overlay drift** — owned by the compiler, not lint. `hardening.json`'s event
  keys are positional, so the compiler's double guard (`time` + `text_head`
  `startsWith`) dies on a mismatch. See the boxed note in §2.

### 3.6 Hardening the predicates

F1/F3/F4 all name the same missing thing: a machine-readable form for a
condition over run state.

**The reader exists** — `src/shared/predicates.ts`, with the grammar below.
Nothing AUTHORS one yet: `authoring/compile-datapack.mjs:489` hardcodes
`predicates: []`, so every pack still lints as hardening-incomplete. This
section is what a predicate must look like when that stops being true, and what
the reader will do with it.

**One language, five slots.** `score.predicates` · `edge_predicates` ·
`availability` · `extra_condition` · a place yield's `depth_note` are the same
question asked five times, and one module answers all five so the grammar has a
single definition. The slot is already ratified as `string[]`
(`score.schema.json`), so a grammar that fits inside a string needs no schema
revision — which matters, because `data/scenario/_schema/` is under the live
frozen-input guard. The form:

```
condition            — the F1/F4 form: evaluates to a boolean
condition => value   — the F3 form: evaluates to a tally value
=> value             — F3's fallback; last line only, first match wins
```

with `condition` a conjunction of flag / `not flag` / `scalar <cmp> integer`
over ids the pack itself declares. Identifiers are lower snake_case and `not` is
the one keyword, so it is not a name. Alternation is a second line rather than
an `or`: it forces the author to order the branches, and it keeps a predicate
readable in the draft table cell it is authored in.

Lint reads the grammar THROUGH the reader — `identifiers()` for name resolution
against the compiled pack, `problems()` for syntax — rather than carrying a
second copy of it. A grammar with two implementations is two grammars.

**The reader never throws.** A malformed predicate is `false`, and a malformed
rule inside a `predicates` array is skipped so the rules after it still get
their turn. Rejecting bad authoring is lint's job, at authoring time; a
predicate is evaluated at the close of the day on the player's build, and a
parse error there must cost one row rather than the run. (`clock.ts`'s `mm()`
threw on the authored `21:04+`, the throw unwound through a subscriber into the
driver's `step()`, and the day ended with no `run_end` and no tally at all —
PR #141.)

**An absent name is false, and the two absences differ.** An unset flag is not
in the state at all — the engine writes one only when something sets it — so
absent MEANS false and `not caller_named` reads correctly on a run that never
reached G4. An absent scalar is a meter that was never bound (F2), and a term
naming one is false rather than zero: reading it as 0 would let `fear < 10`
match a variable that does not exist.

**Flags are available now; scalars are not.** F2 is a prerequisite of F3, which
is why `status.md` puts meter binding first: on 우는다리 only 서지형's two
meters are bound (`trust`, `fear`), and the other six characters' twelve meters
carry `variable: null`. A scalar term can name nothing else until that lands,
so a predicate set written today is a set written over flags. That is not a
hardship — the structural gates already emit their outcome as flags, and the
causal gates emit deltas whose *consequences* surface as flags downstream.

**Disaster flags are not conditions.** `bridge_collapsed` · `crowd_on_bridge` ·
`logs_destroyed` · `kang_detained` · `caller_arrested` are set by timeline
events that fire unconditionally, so they do not mean "the bridge fell" — they
mean **the day reached its end**, and a predicate that branches on one branches
on nothing. Branch on the INTERVENTION flags instead (`cancel_requested` is
what "the bridge did not fall" looks like in state). Making the timeline's own
effects conditional is a different change — `effects` is
`additionalProperties: false` over `deltas` and `flags` — and it belongs with
F1, which governs narration rather than scoring.

**The tally's headline is a sum, so the value type carries the axis.** §5.2's
`score` event pairs one `total: number` with rows whose value is
`string | number` (amendment g), and `windows/tally.ts` labels that total 사망 ·
명. That gives the arithmetic for free if authoring holds one rule: **a numeric
unit value counts toward the headline; a string one is a row that reads and
does not sum.** So death tallies are numbers and everything else — an outcome,
an injury count, a detention length — is a string. On 우는다리 the
no-intervention run then totals 24 + 1 + 1 = 26, which is what
`score.json`'s own `baseline_summary` says.

**Two gaps predicates alone will not close**, found while drafting against
우는다리 and worth knowing before the hardening pass starts:

- **G5 is one flag short.** Score unit u6 wants four outcomes (소실 / 사본만 /
  원본 확보 / 원본+증언) and G5's buckets set only `logs_saved` and
  `insider_testimony` — three distinguishable states. The `paperwork` bucket
  needs a flag of its own before "사본만" is expressible. Hardening adds flags,
  not just predicates.
- **부상 has no unit.** `baseline_summary` counts 부상 71 and no score unit
  tallies it, so it can only reach the tally as prose inside another unit's
  label. It wants a unit of its own, with a string value so it stays out of the
  사망 sum.

## 4. Related documents

- Transformation chain and stage ownership: [`plan-pipeline.md`](./plan-pipeline.md) §2
- What the engine does with this pack: [`spec-engine.md`](./spec-engine.md)
- Where the pack physically lives and who may read it: [`spec-physical-architecture.md`](./spec-physical-architecture.md) §3.1, §3.7
- Gate card canonical form: [`scenario/gate-hardening-manual.md`](./scenario/gate-hardening-manual.md) §5
- Handoff status for the first real pack: [`handoffs/datapack.md`](./handoffs/datapack.md)

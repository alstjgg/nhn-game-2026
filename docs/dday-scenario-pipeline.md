# DDAY Scenario-to-Game Pipeline

> **Status:** operating document. The pipeline splits into two tracks, each
> decided by its owner.
> **Agreement works by document, not discussion.** Each owner's spec *is* the
> communication: the other track reads it and builds against it, and changes
> propagate as revisions to the owning document.
> **Binding set:** datapack spec (§3, 민서) ·
> [engine spec](./dday-engine-minimal-spec.md) (윤석 — answers the
> [request](./dday-engine-minimal-request.md)) ·
> [call contracts](./dday-call-contracts.md) (윤석) ·
> [physical architecture](./dday-physical-architecture.md) (윤석) ·
> [architecture spec](./dday-architecture-spec.md) (invariants above both).

## 0. Principles

- **Balance-as-data is the pipeline.** A game = the generic engine + the call
  contracts + one scenario datapack. The pipeline's end product is a `data/`
  pack; engine code does not change when the scenario does (spec §3).
- **Two tracks, two questions.** The data pipeline answers *what form the
  data takes at every point, and what transforms into what*. The architecture
  pipeline answers *how the layers are actually connected, called, and
  driven*. The former binds formats; the latter owns methods.

## 1. Tracks and deliverables

| Track | Owner | Question | Deliverables |
|---|---|---|---|
| **Data pipeline** | 민서 (A) | Every data format between and inside the layers — what turns into what, and what flows where | Transformation chain (§2) · datapack spec (§3) · lint rule set · run-record & meta-state format (what a finished run leaves behind, what persists between runs) · production base prompt template (the D task — the judgment call's default prompt that temperament composes into) · gameplay metric definitions (§5) |
| **Architecture pipeline** | 윤석 (L) | The actual wiring — call paths, data hand-offs, runtime | Bedrock production path · minimal engine, **including score evaluation at the terminal clock** · payload composer (the runtime side of call contracts §6) · full-run driver · **run-loop manager** (multi-run shell: run counter, depth-gated exposure, prompt carry-over, report archive) · gate-card → suite generator · policy-bot runner · **physical architecture** ([the doc](./dday-physical-architecture.md) — §3 layout filled; further changes by revision) |
| **Client** | — (unassigned) | The player-facing surface — how the player watches runs and touches the membrane | Observe surfaces (timeline · CCTV · call panel) · mining + slot-composition UI (pinboard with cap, species/axis tags) · report viewer with the client-driven typewriter · score/tally screen (absorbs report generation, latency rules 4–5) · run-loop shell UI (run history, prompt carry-over view) · the pause structure that binds the §9 latency budget and report cadence (with L) · assets, each entered in `assets-manifest.json` |

### 1.1 Executability check

Data + architecture shipped = the game runs **headless** end to end: draft →
compile → datapack → engine + composer + three calls → scored, repeatable
runs with depth-gated exposure — enough for stages 4–6 and the whole
bake-off. All three tracks shipped = **playable by a human**. The client
consumes and emits only what the other two tracks already bind, so it builds
document-first like everything else; it carries no owner until one is
assigned.

## 2. Data pipeline — the transformation chain

Each stage is defined as a **data transformation**: input format → output
format. The executor of each stage (a skill, a script, the engine) is an
architecture-track artifact (§4); the formats are bound here.

| # | Stage | Transformation | State |
|---|---|---|---|
| 0 | Write | brief + guide → scenario draft (md, `/write-scenario` §4 format, gate cards in yaml) | running |
| 1 | Compile | draft → datapack (§3) | **deterministic script** (`infra/scenario-pipeline/compile-datapack.mjs`, zero deps, zero calls). The draft format (write skill §4) is its parse contract — unparseable drafts fail compile instead of being guessed at. No LLM touches this stage: pack sentences are the mining vein, and a silent paraphrase would break key conditions invisibly |
| 2 | Lint | datapack → violation list (stance↔temperament axis-vocabulary collision · key species / mining position · score attributability · the mechanical half of the guide's ban list) | rules fixed by data track; a stance-lint prototype exists in the harness |
| 3 | Paper check | datapack + draft → verdict memo (hardening manual §6: timeline preemption · fixture slack · escape options) | manual exists; one human pass |
| 4 | Probe | gate card → suite JSON → 30-call metrics | suite format is the harness's existing format, unchanged |
| 5 | Run | datapack → run record (delta journal + timeline + the two reports) | run-record format follows the engine spec |
| 6 | Gameplay measurement | run records × policy → metric report (§5) | report format fixed by data track before first execution |

**Phasing:** P0 = stages 1+2 (compile + lint — drafts become comparable on
paper) → P1 = stage 4 (first-gate probe) → P2 = stages 5+6 (full-run
measurement, once the engine lands). P0 alone covers half the bake-off:
format compliance, rule compliance, structural comparison.

## 3. Datapack spec (v0.3)

`data/scenario/<slug>/`. **This spec is the compile stage's output and the
engine's input.** Where it disagrees with the engine spec, the data track
revises this section to restore fit — by revision, not by meeting.

**Field-level types are normative in `data/scenario/_schema/*.schema.json`**
(JSON Schema draft 2020-12, one schema per file below). This table is the
map; the schemas are the law. The lint stage validates every pack against
them.

| File | Contents | Draft source |
|---|---|---|
| `meta.json` | slug · title · logline · scenario clock (start–end) · D-Day | logline |
| `timeline.json` | fixed events: id · time · surface (call / cctv / onsite / document) · place ref · text · exposure (`visible_from` clock + free-text `extra_condition`) · **effects** (scalar deltas + flag set/unset — engine spec §1.2 actuator (b); `null` until hardening) | fixed timeline (narrative form; machine effects assigned at hardening) |
| `characters.json` | id · role · interest · knows / doesn't-know · ≤2 meters (initial `null` until hardening) · strands (truth/gate refs — attributability input) | characters |
| `places.json` | id · name · yields: ≥2 entries of (clock or depth note → info) | places |
| `temperament.json` | default disposition · ≤2 clauses (axis · **axis_vocabulary** · condition · defeat condition) | temperament proposal |
| `gates.json` | the gate card as-is (hardening manual §5): standard form · stance set · default stance · **key_conditions** · key_examples · false leads · buckets · edge predicates — plus clock/place/scene prose carried from the draft | gate cards |
| `truths.json` | truth → carrier sentences (id + text + where) · false leads. **This file issues sentence ids** (`trN-sN` / `trN-fN`) | hidden truths |
| `score.json` | units (tallies · baseline · attributed gates · predicates) · no-intervention baseline · variance notes | score |
| `symptoms.json` | state change → symptom sentences, per (variable × direction × magnitude band) + flag set/unset — the **only** channel state reaches the screen (engine spec §2.2, added v0.2 on its revision request) | — (hardening; compile emits an empty skeleton) |
| `hardening.json` | **hand-authored source, not compiler output** — hardening values with no home in the draft: meter variable bindings + initials · per-event effects and beat rosters (`present`) · symptoms. Compile merges it into the three files above | — (hardening) |
| `draft.md` | the source draft, moved in verbatim — the pack is self-contained and the draft's home moves with compilation | whole draft |

Decisions in force:

- **Keys are stored as conditions (axis × referent × certified species),
  never as sentence ids.** What opens a gate is the class of sentences
  satisfying the condition (hardening manual §3-5); a single blessed string
  turns deduction into a lottery. The condition is authoring/lint/oracle
  metadata — at runtime the injected sentence simply rides the judgment call
  and the engine reads only the stance, so determinism is untouched.
- Fields absent from draft-stage gate cards (buckets · deltas · edge
  predicates · meter initials · score predicates) are filled during
  hardening. Compile passes them empty/null; lint flags the pack
  "hardening incomplete". `symptoms.json` is hardening-stage for the same
  reason — symptoms attach to deltas, and the draft format has no symptoms
  section; once deltas exist, lint enforces **symptom coverage** (every
  actuator-reachable (variable, direction) needs a `min: 1` entry — engine
  spec §6-2), min-descending entry order, and the no-digits rule (I12).
  Coverage counts **both** actuators: bucket deltas/flags and timeline event
  `effects` — the latter field added in v0.2 so engine spec §1.2's second
  actuator (script event effects) has a data slot instead of a dangling
  declaration.
- `default_stance` is a **required** field of every gate card
  (`gates.schema.json`) and rides compile verbatim — it is the engine's
  Call-1 fallback and the P1 probe's prediction value (engine spec §5).
- **`places.json` added (v0.1).** The draft format has a mandatory places
  section (each place yields ≥2 pieces of info at different clock depths)
  and v0 had no file to receive it — a schema hole by the template
  principle, promoted here.
- **Exposure conditions beyond the clock stay free text at compile**
  (`extra_condition` / `depth_note` / `availability`). They become engine
  predicates during hardening; until then lint flags them as incomplete
  rather than compile inventing semantics.
- Compile is extraction, not authoring: text fields carry the draft's
  sentences verbatim, and anything the draft doesn't state compiles to
  `null`/empty — never to an invented value.
- **Hardening has exactly two homes, and recompile is idempotent (v0.3).**
  Gate machinery (buckets · predicted_shift · edge predicates) is authored
  in the draft's gate cards — that *is* the canonical card form (hardening
  manual §5) — and the compiler parses hardened cards. Everything mechanical
  with no draft home (meter variable bindings + initials, event effects,
  symptoms) is authored in `hardening.json`, merged at compile. Nothing is
  ever hand-edited in compiler output, so recompiling from the draft never
  destroys hardening work. Overlay event keys are positional, so drift is
  guarded twice: `time` catches added/split rows, and `text_head` (a prefix
  of the target event's text, matched with startsWith) catches same-time
  rows swapping places — the case `time` alone can never see, and 우는다리
  already has such a pair (t4·t5, both 10:40). The compiler fails loudly on
  either mismatch (#104 review 3). The overlay itself is schema-validated
  (`hardening.schema.json`, `additionalProperties: false` at every level) —
  it is the pack's only hand-written file, so it gets the strictest walls.
- **Buckets carry `flags` alongside `deltas` (v0.4).** Caller-facing gates
  (G1 · G4 · G7 — the man on the line) discharge through scalar deltas on
  his meters. Structural gates (G2 · G3 · G5 · G6) change *world* state, not
  the caller's meters — their outcome is a flag set (`logs_saved`,
  `originals_read`, …), the same boolean state model as timeline
  `effects.flags`. Without this slot, structural gates would harden into
  empty no-ops. Flag symptom coverage counts both sources; conditional
  outcomes (e.g. G6's cancel succeeding only when `logs_saved` is set) are
  **not** encoded in buckets — that resolution belongs to edge predicates /
  the engine, pending the routing vocabulary.

## 4. Architecture pipeline — the wiring

This document fixes only the scope; the owner decides the methods, and those
decisions propagate as revisions to the engine spec and call contracts.

- **Physical architecture** — the repo layout wrapping all three tracks:
  [dday-physical-architecture.md](./dday-physical-architecture.md). Its tier
  split, constraints, and §3 repo layout are all in force; further changes
  propagate as revisions, like everything else.
- **Bedrock production path** — call contracts v1 on the deployed proxy.
- **Minimal engine** — spec: [engine spec](./dday-engine-minimal-spec.md).
  Its first run doubles as the W4 check (architecture spec §5). Scope
  includes evaluating `score.json` at the terminal clock.
- **Payload composer** — the runtime realization of the call contracts' §6
  supplier/consumer map: datapack + state + player-injected blocks → each
  call's slots.
- **Full-run driver** — the beat driver (`drive-beat.mjs`) extended to a
  whole run: engine ↔ three calls ↔ datapack in one loop.
- **Run-loop manager** — the multi-run shell: run counter, depth-gated
  timeline exposure, prompt carry-over between runs, report archive.
- **Suite generator** — gate card (yaml) → harness suite JSON.
- **Policy-bot runner** — drives full runs under the §5 policies, N runs
  each, emitting run records.

The data track binds only these artifacts' **inputs and outputs** (§2, §3);
internal structure, language, and deployment are the architecture track's.

## 5. Gameplay metrics (defined: data track · executed: architecture track)

Three scripted policies play the same pack N runs each: **random** (inject
anything) · **greedy** (inject whatever stood out in the last report) ·
**oracle** (knows the truths and key conditions — the ceiling).

| Metric | Question | Verdict |
|---|---|---|
| **Policy gap** (oracle − random score) | Does deduction pay? | Gap ≈ 0 means the pack is a brute-force game — redesign gates/vein |
| Score variance (across runs) | Does play change outcomes? | Variance ≈ 0 means the gates are decoration |
| Route coverage | Is the graph alive? | Unvisited edges = dead authoring cost |
| Vein yield (new minable sentences per run) | Does the supply chain turn? | Shares its metric with the Call 2 quality review |
| Near-miss trace rate | Do missed injections leave marks in the reports? | Low means the warmer/colder feedback loop is dead |

Guard: the policy bots measure **gameplay**, not correctness — that oracle
wins is a premise; the measured quantity is the size of the gap.

## 6. Run artifacts (v0) — what execution leaves behind

Data-track deliverables "run-record & meta-state format" and "§5 report
format", bound now so the engine's output side and the policy runner can be
built against them document-first. **Normative schemas:
`data/runs/_schema/*.schema.json`.** Everything here only names surfaces
whose suppliers are already contract-bound (call contracts §2/§4/§6, engine
request §4); engine internals stay the engine's.

| File | Contents | Consumer |
|---|---|---|
| `run-record` | run id · pack slug · policy (null = human) · reached clock · injected blocks · beats (gate · stance · **delta journal** `{variable, before, after, cause}`) · rendered timeline lines (mining surface, W2) · the two reports (W1/W3) · score at terminal clock · fallbacks `{beat, call, code}` (engine spec §5) | metric stage (§5) · report viewer · mining UI |
| `meta-state` | pack slug · run count · max exposure clock reached (drives `visible_from` gating) · carried blocks (prompt carry-over) · report archive | run-loop manager |
| `metric-report` | per-policy rows (n, mean, variance) · policy gap · score variance · route coverage · vein yield · near-miss trace rate · source run ids | bake-off / §5 verdicts |

Decisions in force:

- **Unmeasurable ≠ zero.** Every metric is nullable; a metric that could not
  be computed is `null`, never `0` (A20: no-events-observed is "cannot
  measure", not "no effect").
- Route coverage's denominator comes from hardened `gates.json`
  (buckets/edges) — `null` until hardening lands.
- **Open items, engine-owned (engine request §6):** what ends a run before
  the terminal clock (fixes `reached_clock` semantics) and beat granularity
  per round. These land here as revisions when the engine spec answers.

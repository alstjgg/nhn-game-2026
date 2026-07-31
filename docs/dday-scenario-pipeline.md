# DDAY Scenario-to-Game Pipeline

> **Status:** operating document. The pipeline splits into two tracks, each
> decided by its owner.
> **Agreement works by document, not discussion.** Each owner's spec *is* the
> communication: the other track reads it and builds against it, and changes
> propagate as revisions to the owning document.
> **Binding set:** datapack spec (§3, 민서) ·
> [engine spec](./dday-engine-minimal-request.md) (윤석) ·
> [call contracts](./dday-call-contracts.md) (윤석) ·
> [physical architecture](./dday-physical-architecture.md) (윤석 — layout
> section to fill) ·
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
| **Architecture pipeline** | 윤석 (L) | The actual wiring — call paths, data hand-offs, runtime | Bedrock production path · minimal engine, **including score evaluation at the terminal clock** · payload composer (the runtime side of call contracts §6) · full-run driver · **run-loop manager** (multi-run shell: run counter, depth-gated exposure, prompt carry-over, report archive) · gate-card → suite generator · policy-bot runner · **physical architecture** (fill the layout section of [the physical-architecture doc](./dday-physical-architecture.md)) |
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
| 1 | Compile | draft → datapack (§3) | data track builds the compile skill + JSON schema validator |
| 2 | Lint | datapack → violation list (stance↔temperament axis-vocabulary collision · key species / mining position · score attributability · the mechanical half of the guide's ban list) | rules fixed by data track; a stance-lint prototype exists in the harness |
| 3 | Paper check | datapack + draft → verdict memo (hardening manual §6: timeline preemption · fixture slack · escape options) | manual exists; one human pass |
| 4 | Probe | gate card → suite JSON → 30-call metrics | suite format is the harness's existing format, unchanged |
| 5 | Run | datapack → run record (delta journal + timeline + the two reports) | run-record format follows the engine spec |
| 6 | Gameplay measurement | run records × policy → metric report (§5) | report format fixed by data track before first execution |

**Phasing:** P0 = stages 1+2 (compile + lint — drafts become comparable on
paper) → P1 = stage 4 (first-gate probe) → P2 = stages 5+6 (full-run
measurement, once the engine lands). P0 alone covers half the bake-off:
format compliance, rule compliance, structural comparison.

## 3. Datapack spec (v0)

`data/scenario/<slug>/`. **This spec is the compile stage's output and the
engine's input.** Where it disagrees with the engine spec, the data track
revises this section to restore fit — by revision, not by meeting.

| File | Contents | Draft source |
|---|---|---|
| `meta.json` | title · scenario clock (start–end) · D-Day | logline |
| `timeline.json` | fixed events: time · surface (call / CCTV / on-site) · text · exposure run-depth | fixed timeline |
| `characters.json` | characters: traits (static) · ≤2 meter initial values · knowledge flags | characters |
| `temperament.json` | default disposition · ≤2 conditional clauses (axis vocabulary · defeat condition) | temperament proposal |
| `gates.json` | the gate card as-is: standard form · stance set · buckets · deltas · edge predicates · **key condition** | gate cards |
| `truths.json` | truth → carrier sentence ids · false-lead ids | hidden truths |
| `score.json` | units · predicates · no-intervention baseline score | score |

Decisions in force:

- **Keys are stored as conditions (axis × referent × certified species),
  never as sentence ids.** What opens a gate is the class of sentences
  satisfying the condition (hardening manual §3-5); a single blessed string
  turns deduction into a lottery. The condition is authoring/lint/oracle
  metadata — at runtime the injected sentence simply rides the judgment call
  and the engine reads only the stance, so determinism is untouched.
- Fields absent from draft-stage gate cards (buckets · deltas · edge
  predicates) are filled during hardening. Compile passes them empty; lint
  flags the pack "hardening incomplete".
- Field-level type definitions land as the next revision of this section,
  written together with the compile skill.

## 4. Architecture pipeline — the wiring

This document fixes only the scope; the owner decides the methods, and those
decisions propagate as revisions to the engine spec and call contracts.

- **Physical architecture** — the repo layout wrapping all three tracks:
  [dday-physical-architecture.md](./dday-physical-architecture.md). Its tier
  split and constraints are already in force; the layout section is unfilled
  and is this track's to fill — by revision, like everything else.
- **Bedrock production path** — call contracts v1 on the deployed proxy.
- **Minimal engine** — spec: [engine spec](./dday-engine-minimal-request.md).
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

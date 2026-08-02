# Plan — Scenario-to-Game Pipeline

> **Tier:** `plan-` — normative about the work, not about the artifact. This
> document assigns tracks, owners, and stage order. The *formats* those stages
> produce are bound in the `contract-` documents, not here.
>
> **Agreement works by document, not discussion.** Each owner's spec *is* the
> communication: the other track reads it and builds against it, and changes
> propagate as revisions to the owning document.
>
> **Binding set:**
> [datapack contract](./contract-datapack.md) (민서) ·
> [run-artifact contract](./contract-run-artifacts.md) (민서) ·
> [engine spec](./spec-engine.md) (윤석) ·
> [call contracts](./contract-calls.md) (윤석) ·
> [physical architecture](./spec-physical-architecture.md) (윤석) ·
> [architecture spec](./spec-architecture.md) (invariants above all of them).

## 0. Principles

- **Balance-as-data is the pipeline.** A game = the generic engine + the call
  contracts + one scenario datapack. The pipeline's end product is a `data/`
  pack; engine code does not change when the scenario does (architecture spec §3).
- **Two tracks, two questions.** The data pipeline answers *what form the data
  takes at every point, and what transforms into what*. The architecture
  pipeline answers *how the layers are actually connected, called, and driven*.
  The former binds formats; the latter owns methods.

## 1. Tracks and deliverables

| Track | Owner | Question | Deliverables |
|---|---|---|---|
| **Data pipeline** | 민서 (A) | Every data format between and inside the layers — what turns into what, and what flows where | Transformation chain (§2) · [datapack contract](./contract-datapack.md) incl. the lint ruleset · [run-artifact contract](./contract-run-artifacts.md) (what a finished run leaves behind, what persists between runs) · production base prompt template (the D task — the judgment call's default prompt that temperament composes into) · gameplay metric definitions (§4) |
| **Architecture pipeline** | 윤석 (L) | The actual wiring — call paths, data hand-offs, runtime | Bedrock production path · minimal engine, **including score evaluation at the terminal clock** · payload composer (the runtime side of call contracts §6) · full-run driver · **run-loop manager** (multi-run shell: run counter, depth-gated exposure, prompt carry-over, report archive) · gate-card → suite generator · policy-bot runner · **physical architecture** ([the doc](./spec-physical-architecture.md) — §3 layout filled; further changes by revision) |
| **Client** | — (unassigned) | The player-facing surface — how the player watches runs and touches the membrane | Observe surfaces (timeline · CCTV · call panel) · mining + slot-composition UI (pinboard with cap, species/axis tags) · report viewer with the client-driven typewriter · score/tally screen (absorbs report generation, latency rules 4–5) · run-loop shell UI (run history, prompt carry-over view) · the pause structure that binds the architecture spec §9 latency budget and report cadence (with L) · assets, each entered in `assets-manifest.json` |

### 1.1 Executability check

Data + architecture shipped = the game runs **headless** end to end: draft →
compile → datapack → engine + composer + three calls → scored, repeatable runs
with depth-gated exposure — enough for stages 4–6 and the whole bake-off. All
three tracks shipped = **playable by a human**. The client consumes and emits
only what the other two tracks already bind, so it builds document-first like
everything else; it carries no owner until one is assigned.

## 2. The transformation chain

Each stage is defined as a **data transformation**: input format → output
format. The executor of each stage (a skill, a script, the engine) is an
architecture-track artifact (§3); the formats are bound in the `contract-`
documents.

| # | Stage | Transformation | State |
|---|---|---|---|
| 0 | Write | brief + guide → scenario draft (md, `/write-scenario` §4 format, gate cards in yaml) | running |
| 1 | Compile | draft → datapack ([contract](./contract-datapack.md) §1) | **deterministic script** (`infra/scenario-pipeline/compile-datapack.mjs`, zero deps, zero calls). The draft format (write skill §4) is its parse contract — unparseable drafts fail compile instead of being guessed at. No LLM touches this stage: pack sentences are the mining vein, and a silent paraphrase would break key conditions invisibly |
| 2 | Lint | datapack → violation list | rules bound in [contract](./contract-datapack.md) §3; implemented in `infra/scenario-pipeline/lint-datapack.mjs` |
| 3 | Paper check | datapack + draft → verdict memo (hardening manual §6: timeline preemption · fixture slack · escape options) | manual exists; one human pass |
| 4 | Probe | gate card → suite JSON → 30-call metrics | suite format is the harness's existing format, unchanged |
| 5 | Run | datapack → run record ([contract](./contract-run-artifacts.md) §1) | in progress — [`handoffs/datapack.md`](./handoffs/datapack.md) is the data-track half |
| 6 | Gameplay measurement | run records × policy → metric report (§4) | `metric-report` format bound in [contract](./contract-run-artifacts.md) §1 |

**Phasing:** P0 = stages 1+2 (compile + lint — drafts become comparable on
paper) → P1 = stage 4 (first-gate probe) → P2 = stages 5+6 (full-run
measurement, once the engine lands). P0 alone covers half the bake-off: format
compliance, rule compliance, structural comparison.

## 3. Architecture pipeline — the wiring

This document fixes only the scope; the owner decides the methods, and those
decisions propagate as revisions to the engine spec and call contracts.

- **Physical architecture** — the repo layout wrapping all three tracks:
  [`spec-physical-architecture.md`](./spec-physical-architecture.md). Its tier
  split, constraints, and §3 repo layout are all in force; further changes
  propagate as revisions, like everything else.
- **Bedrock production path** — call contracts v1 on the deployed proxy.
- **Minimal engine** — spec: [`spec-engine.md`](./spec-engine.md). Its first run
  doubles as the W4 check (architecture spec §5). Scope includes evaluating
  `score.json` at the terminal clock.
- **Payload composer** — the runtime realization of the call contracts' §6
  supplier/consumer map: datapack + state + player-injected blocks → each call's
  slots.
- **Full-run driver** — the beat driver (`drive-beat.mjs`) extended to a whole
  run: engine ↔ three calls ↔ datapack in one loop.
- **Run-loop manager** — the multi-run shell: run counter, depth-gated timeline
  exposure, prompt carry-over between runs, report archive.
- **Suite generator** — gate card (yaml) → harness suite JSON.
- **Policy-bot runner** — drives full runs under the §4 policies, N runs each,
  emitting run records.

The data track binds only these artifacts' **inputs and outputs** (§2 and the
two `contract-` documents); internal structure, language, and deployment are the
architecture track's.

## 4. Gameplay metrics (defined: data track · executed: architecture track)

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

Guard: the policy bots measure **gameplay**, not correctness — that oracle wins
is a premise; the measured quantity is the size of the gap.

Output format: `metric-report` in
[`contract-run-artifacts.md`](./contract-run-artifacts.md) §1. Every metric is
nullable, and an uncomputable metric is `null`, never `0`.

# docs/ — how to read this directory

**Start here, then go to [`status.md`](./status.md)** for current phase, active
work, and next steps. Permanent repo rules live in [`/CLAUDE.md`](../CLAUDE.md)
and are not repeated anywhere in this directory.

This directory is written in **English**. Its primary readers are agents, and a
Korean/English split used to run straight through the binding set, forcing a
language boundary in the middle of a dependency chain. Scenario content —
symptom sentences, stance labels, character names, draft prose — stays in Korean
wherever it appears, because that is authored game data rather than
documentation.

## 1. The three tiers

A filename prefix is a claim about the document's **authority**, not its topic.

| Prefix | Means | Test for whether a document belongs here |
|---|---|---|
| **`spec-`** | Normative authority for its domain | Breaking it makes a downstream artifact **defective even if it works** |
| **`contract-`** | A fixed interface between two **named owners** | It has two sides, and one side can build against it **without a meeting** |
| **`plan-`** | Normative about **the work**, not the artifact | It says who builds what, in what order, and how it is verified |

`spec-architecture.md` sits above every other `spec-`. The others are each the
authority for one domain, which may be one track's — `spec-engine.md` is 윤석's,
yet it binds the data track, and that is exactly why it is a `spec-`.

Two folders sit outside the prefix scheme on purpose:

- **`scenario/`** — authoring guides. How a *human* produces conforming material.
- **`handoffs/`** — a handoff has a **lifetime**, not an authority. It closes when
  its exchange closes, then becomes a record.
- **`deliverables/`** — drafts of the competition's required PDFs.

**A contract document is not itself the law.** For most contracts the enforceable
artifact is JSON Schema or code, and the document is the map plus the decisions
in force. Every `contract-` file opens with a "where the law lives" table naming
its normative artifact, its transcriptions, and the drift guard between them.
The principle behind this is physical architecture §3.1: *normative lives in the
artifact that can enforce itself.*

## 2. Document map

| Document | Tier | What it settles | Owner |
|---|---|---|---|
| [`spec-architecture.md`](./spec-architecture.md) | spec | What the system **is** — core loop, game graph, state engine, call inventory, data-flow wirings W1–W4, prompt surface, invariants I1–I13, and the §9 open-parameter binding schedule. **Above both tracks** | 민서 |
| [`spec-engine.md`](./spec-engine.md) | spec | The minimal engine: state model, delta journal, symptom renderer, beat/round boundaries, ordering rules, routing vocabulary, call-failure behavior, acceptance criteria | 윤석 |
| [`spec-physical-architecture.md`](./spec-physical-architecture.md) | spec | Where code physically lives and runs — the two tiers, module boundaries under `src/`, the isomorphism constraint and how the compiler enforces it | 윤석 |
| [`contract-calls.md`](./contract-calls.md) | contract | The three LLM calls' payloads and responses, field order, hard/soft validation, the slot supplier/consumer map | 윤석 |
| [`contract-datapack.md`](./contract-datapack.md) | contract | What a scenario datapack is, file by file, plus the lint ruleset that defines conformance | 민서 |
| [`contract-run-artifacts.md`](./contract-run-artifacts.md) | contract | What a finished run leaves behind: run record, meta-state, metric report | 민서 |
| [`plan-pipeline.md`](./plan-pipeline.md) | plan | The three tracks, their owners and deliverables, the stage-by-stage transformation chain, and gameplay metric definitions | 민서 |
| [`plan-game-design.md`](./plan-game-design.md) | plan | The live game design — pitch, pillars, non-goals, core loop, systems, UX/UI, scope | 윤석 |
| [`plan-mechanism-test.md`](./plan-mechanism-test.md) | plan | The mechanism verification program: testing principles, run integrity, probe harness, decision procedure | 민서 |
| [`status.md`](./status.md) | — | **Mutable project state.** Updated freely by any session. Newest first | shared |
| [`competition.md`](./competition.md) | — | The 5 required deliverables and the rules governing them | shared |
| [`scenario/scenario-generation-guide.md`](./scenario/scenario-generation-guide.md) | guide | Rules injected into a writing session — the physics a scenario must obey | 민서 |
| [`scenario/gate-hardening-manual.md`](./scenario/gate-hardening-manual.md) | guide | Turning gates into verifiable form. **§5 is the canonical gate card** | 민서 |
| [`handoffs/datapack.md`](./handoffs/datapack.md) | handoff | First real pack across the track boundary; §4 is the open checklist | 민서 → 윤석 |
| [`handoffs/llm-lambda-runtime.md`](./handoffs/llm-lambda-runtime.md) | handoff | Lambda/Bedrock runtime handoff | 윤석 |
| [`deliverables/ai-utilization.draft.md`](./deliverables/ai-utilization.draft.md) | deliverable | Machine-drafted section of competition deliverable #4 | shared |

## 3. Where the machine-readable law lives

Do not settle a question about data shape from prose. These are the artifacts
that can enforce themselves.

| Law | Documented by | Transcribed to | Drift guard |
|---|---|---|---|
| `data/scenario/_schema/*.schema.json` | [`contract-datapack.md`](./contract-datapack.md) | `src/shared/datapack.ts` | ✅ generated by `infra/scenario-pipeline/generate-datapack-types.mjs`; `--check` exits non-zero on drift |
| `data/runs/_schema/*.schema.json` | [`contract-run-artifacts.md`](./contract-run-artifacts.md) | — | — |
| [`contract-calls.md`](./contract-calls.md) *(the document is the law)* | itself | `src/shared/contracts.ts` · `infra/test-harness/lib/calltypes.mjs` | ⚠️ **none** — both are hand-written. A disagreement is a bug in one of the two; check both when editing either |
| `data/policy/report-guidance.json` | [`contract-calls.md`](./contract-calls.md) §4 | — | — |
| `docs/scenario/gate-hardening-manual.md` §5 (gate card) | itself | rides into `gates.json` verbatim | lint E1–E5 |

## 4. Open cross-track items

Revision requests and their resolutions live in the **owning** document — that is
how ownership is respected. But they were previously scattered across four
documents with no single place to see them, and one list went stale
undetected. This table is the index; the owning document remains the authority.

| Item | Requester → Responder | Status | Lives in |
|---|---|---|---|
| Consumption confirmation: does the suite generator eat the G1 card, and does the engine load the pack for one full round? **Closing this closes pipeline stage 5** | 민서 → 윤석 | **open** | [`handoffs/datapack.md`](./handoffs/datapack.md) §4-5 |
| Variable binding for the c2–c7 meters — widen the state model, or spec it out of v0? (12 lint FLAGs hang on it) | 민서 → 윤석 | **open** | [`handoffs/datapack.md`](./handoffs/datapack.md) §4-6 |
| Re-widen engine spec §1.1's flag write now that `buckets[].flags` exists? Minimal engine unaffected | 민서 → 윤석 | **open** | [`handoffs/datapack.md`](./handoffs/datapack.md) §4-1 |
| Formal binding of the state variable list | blocked on L's §3.1 visibility probe (not yet run) | deferred | [`spec-engine.md`](./spec-engine.md) §8 · [`spec-architecture.md`](./spec-architecture.md) §9 |
| Timeline length · retry budget · latency budget | blocked on production-payload latency measurement (RUNLOG A4) | deferred | [`spec-engine.md`](./spec-engine.md) §3.2, §5 · [`spec-architecture.md`](./spec-architecture.md) §4 |
| Routing vocabulary — formal shape, and where node names live | blocked on the gate graph | deferred | [`spec-engine.md`](./spec-engine.md) §4.3 |
| Run termination condition · beat granularity — the run-artifact schema holds two nullable slots for these | 민서 → 윤석 | deferred, **not defects** | [`spec-engine.md`](./spec-engine.md) §8 · [`contract-run-artifacts.md`](./contract-run-artifacts.md) §3 |
| Report cadence — L decided once per round; U must ratify | L → U | **open** | [`contract-calls.md`](./contract-calls.md) §7 #2 |
| `facts` grammatical person · report length | L → U | **open** | [`contract-calls.md`](./contract-calls.md) §7 #1, #3 |
| Datapacks do not currently reach the browser; resolution is a build-time copy plugin, not yet built | 윤석, self | **open** | [`spec-physical-architecture.md`](./spec-physical-architecture.md) §3.7 · §3.8 step 3 |
| `contracts.ts` has no drift guard, unlike `datapack.ts` | 윤석, self | **open** | §3 above |
| Client track has no owner — the largest schedule risk | team | **open** | [`status.md`](./status.md) |

`spec-architecture.md` §9 keeps its own binding schedule for spec-level open
parameters; it is not duplicated here.

## 5. Where game-design content comes from

The live design document is [`plan-game-design.md`](./plan-game-design.md). It
was written from material that is now scattered, so when it is thin on a point,
these are the sources:

| Source | Holds |
|---|---|
| [`planning/dday-design-doc.md`](../planning/dday-design-doc.md) | The 07-29 기획서 — the fullest single treatment of pillars, systems, UX/UI, and production workstreams. **Archived**; three claims in it are superseded and its header names them |
| [`planning/concepts/game-concept-dday-simulation.md`](../planning/concepts/game-concept-dday-simulation.md) | The original concept document |
| [`planning/dday-sot.md`](../planning/dday-sot.md) | The 07-28 concept-freeze record and document map at that moment |
| `data/scenario/우는다리/draft.md` | **The shipped scenario itself** — characters, truths, gates, timeline, score. This is the authority on scenario content, not any prose summary |
| [`planning/dday-poc/poc-terror/RESULTS.md`](../planning/dday-poc/poc-terror/RESULTS.md) | Paper-test raw measurements |
| [`planning/dday-mechanism/`](../planning/dday-mechanism/) | The mechanism program: DECISION · EVIDENCE · RUNLOG · run artifacts |

## 6. Renamed 2026-08-02 — redirect table

`planning/` archive files still link to the old names on purpose: their
append-only character and reproducibility are protected by an explicit decision
in `status.md`, so they were not rewritten. Resolve them here.

| Old | New |
|---|---|
| `docs/dday-architecture-spec.md` | [`docs/spec-architecture.md`](./spec-architecture.md) |
| `docs/dday-engine-minimal-spec.md` | [`docs/spec-engine.md`](./spec-engine.md) |
| `docs/dday-physical-architecture.md` | [`docs/spec-physical-architecture.md`](./spec-physical-architecture.md) |
| `docs/dday-call-contracts.md` | [`docs/contract-calls.md`](./contract-calls.md) |
| `docs/dday-datapack-lint-rules.md` | [`docs/contract-datapack.md`](./contract-datapack.md) §3 (absorbed) |
| `docs/dday-scenario-pipeline.md` §3 | [`docs/contract-datapack.md`](./contract-datapack.md) §1–§2 |
| `docs/dday-scenario-pipeline.md` §6 | [`docs/contract-run-artifacts.md`](./contract-run-artifacts.md) |
| `docs/dday-scenario-pipeline.md` §1 §2 §4 §5 | [`docs/plan-pipeline.md`](./plan-pipeline.md) (§4→§3, §5→§4) |
| `docs/dday-mechanism-deep-test.md` | [`docs/plan-mechanism-test.md`](./plan-mechanism-test.md) |
| `docs/dday-handoff-datapack.md` | [`docs/handoffs/datapack.md`](./handoffs/datapack.md) |
| `docs/dday-engine-minimal-request.md` | [`planning/dday-engine-minimal-request.md`](../planning/dday-engine-minimal-request.md) — answered, archived |
| `docs/dday-design-doc.md` | [`planning/dday-design-doc.md`](../planning/dday-design-doc.md) — archived; live successor is [`plan-game-design.md`](./plan-game-design.md) |

## 7. Adding a document

1. **Decide the tier before the name.** Apply the §1 test. If none of the three
   fits, the document is probably a handoff or a guide — do not force a prefix
   onto it.
2. **If it is a `contract-`, name your law.** Open with the "where the law lives"
   table. A contract whose enforceable artifact is only prose should say so
   explicitly, as `contract-calls.md` does.
3. **Add a row to §2**, and to §3 if it introduces a new normative artifact.
4. **Do not restate another document's open items.** Point at them. Duplicated
   open items are what went stale last time — link, and let the owner's document
   be the authority.

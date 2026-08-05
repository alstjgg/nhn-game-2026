# Contract — Run Artifacts

> **Tier:** `contract-` — a fixed interface between two owners.
> **Producer:** the engine and the run-loop manager (architecture track, 윤석).
> **Consumer:** the metric stage, the report viewer, the mining UI (data track,
> 민서, plus the unassigned client track).
> **Version:** v0.

## Where the law lives

| Artifact | Role | Drift guard |
|---|---|---|
| `data/runs/_schema/*.schema.json` | **The law.** `run-record` · `meta-state` · `metric-report` | — |
| This document | Map + decisions in force | — |

Bound document-first, before the engine exists, so that the engine's output side
and the policy-bot runner can be built against it. Everything named here has a
supplier that is already contract-bound ([`contract-calls.md`](./contract-calls.md)
§2/§4/§6, [`spec-engine.md`](./spec-engine.md) §2·§5) — **engine internals stay
the engine's**, and this document never reaches into them.

## 1. The three artifacts

| File | Contents | Consumer |
|---|---|---|
| `run-record` | run id · pack slug · policy (`null` = human) · reached clock · injected blocks · beats (gate · stance · **delta journal** `{variable, before, after, cause}`) · rendered timeline lines (the mining surface, W2) · the two reports (W1/W3), **`null` when Call 3 fell back** · score at terminal clock · fallbacks `{beat, call, code}` (engine spec §5) | metric stage · report viewer · mining UI |
| `meta-state` | pack slug · run count · max exposure clock reached (drives `visible_from` gating) · carried blocks (prompt carry-over) · report archive | run-loop manager |
| `metric-report` | per-policy rows (n, mean, variance) · policy gap · score variance · route coverage · vein yield · near-miss trace rate · source run ids | bake-off verdicts ([`plan-pipeline.md`](./plan-pipeline.md) §4) |

## 2. Decisions in force

**A run that could not report is still a run.** `reports` is nullable. Call 3
falling back does not void the beats, the delta journals, the timeline or —
above all — `fallbacks[]`, the array that documents the failure. Stage 6 is a
measurement program, and a corpus that drops its failed runs measures the wrong
thing. What stays banned is the FABRICATION: `{facts: [], report_body: ""}` is
not lossy but false, and indistinguishable from a genuinely empty report, so the
schema rejects it (`report_body` keeps `minLength: 1` inside the object branch).

**Unmeasurable ≠ zero.** Every metric is nullable. A metric that could not be
computed is `null`, never `0`. This is RUNLOG A20 applied to the output format:
"no events observed" means *cannot measure*, not *no effect*, and a `0` here
would silently license the opposite conclusion.

**Route coverage's denominator comes from hardened `gates.json`**
(buckets/edges) — `null` until hardening lands.

## 3. Open — and why the `null`s are not defects

Two fields are deliberately left nullable pending answers the minimal engine is
out of scope to give. **[`spec-engine.md`](./spec-engine.md) §8 holds the
authoritative statement of both** — why the answer is deferred and what event
unblocks it. Do not restate those answers here; when the engine spec closes
them, this document takes the revision.

| Field | Waiting on |
|---|---|
| `run-record.reached_clock` semantics (and `score` nullability) | the run-termination model, which arrives with the gate graph + ending model |
| beat granularity per round | the client track's pause structure |

## 4. Related documents

- Metric definitions the `metric-report` serves: [`plan-pipeline.md`](./plan-pipeline.md) §4
- Who produces each field: [`spec-engine.md`](./spec-engine.md) §2, §5
- Slot suppliers and consumers upstream of a run: [`contract-calls.md`](./contract-calls.md) §6

# Prerequisites for the first live-provider run

This build ran end to end against the **fixture** provider. Every item below is
invisible while `PROVIDERS` is `{fixture}` and becomes reachable the moment a
real model answers. They were found by the final review panel on
[PR #116](https://github.com/alstjgg/nhn-game-2026/pull/116), each reproduced
against the shipped modules, and each is recorded in its unit's discovery file.
Collected here because they share a trigger, not an owner.

None of them is a defect in what this run shipped. They are the edges a fixture
cannot exercise.

## 1. A literal `{who}` reaches the Call 2 prompt

`src/engine/index.ts:180` calls `renderBeatSymptoms(entries, symptomsPack)` with
no `owners`, so `{who}` is never substituted. Nothing renders today, so no
player sees it — but the string ships into the prompt.
→ [e2.md](./e2.md). Needs an owner map through `createStateCore`, plus a
placeholder rule in `authoring/lint-datapack.mjs` so authoring one goes red.

## 2. A run whose Call 3 fell back cannot be recorded at all

`reports.report_body` has `minLength: 1` in the frozen
`data/runs/_schema/run-record.schema.json`, and the record quotes Call 3
verbatim. `assembleRecord` now throws rather than fabricating
`{facts:[],report_body:""}` — the right call, because the fabricated record was
not lossy but *false*, and indistinguishable from a genuinely empty report.

But the throw takes the whole run with it: 19 beats, 108 timeline lines, the
journals, and **`fallbacks[]` — the array that documents the failure**. Stage 6
is a measurement program; a corpus that silently drops its failed runs measures
the wrong thing.
→ [e9.md](./e9.md) §9. Needs `reports` nullable in the frozen schema. **Size
this as a prerequisite, not a nice-to-have** (r3's ruling).

## 3. A 200 whose `stance` is null or unknown throws out of the step loop

`readJudgment` narrows on `'stance' in body` — a **key** check, not a value
check. A JSON-legal 200 carrying `stance: null`, or an id no bucket claims,
passes the guard and then throws:
`Error: stance 'zzz' resolves to no bucket of gate G1`. No fallback is graded,
no record is written, no artifact lands.

Loud rather than silent, and pre-existing — the ok-but-*absent* stance is fixed
(`da0af4d`), this is the ok-but-*wrong* one.
→ r1, round 3.

## 4. Two malformed-200 shapes surface as the wrong error

- a 200 omitting `report_body` yields `undefined` and is caught only by the
  schema walker, as `expected type string, got undefined`
- a 200 omitting `facts` escapes as a raw `TypeError: result.body.facts is not
  iterable`

Both are caught before disk, so nothing invalid is written; the messages just
name the wrong thing.
→ r3, round 2, folded into [e9.md](./e9.md) §9.

## 5. `mined_from_run` provenance depends on a run-id naming convention

Provenance is derived from the id and matched against the report archive on
`/-r([0-9]+)$/`. The shipped `--run-id` flag can break that: run 1 as
`baseline-a`, run 2 carrying `b-r1-b01` → `THROW: … not in the report archive
[baseline-a]`. Unreachable from the CLI today because `onePass` builds a fresh
memory store per invocation, and loud when it hits.
→ [e9.md](./e9.md) §8. The end-to-end fix is provenance on `Block` plus a
`meta-state.schema.json` revision — both frozen for this run.

## 6. A stored run record rendered to a UI would reintroduce the §8-5 breach

`reports` in the run record is the **raw Call 3 response**, copied verbatim by
the transport wrapper, so it can contain `[속내] …`. That is correct for a
diagnostic log — the player-facing path is filtered by `withholdInnerNote`
before anything is minted or emitted, and the panel verified 227 ViewEvents
carry none of it.

But [contract-run-artifacts](../docs/contract-run-artifacts.md) §1 names
**"report viewer · mining UI"** among this artifact's consumers. The first unit
that renders a stored record onto a player surface must apply the mint-boundary
filter itself, or the breach this run closed returns from the archive instead of
from the engine.
→ r2, round 2.

# U5.2b — the seam carries the stance's own words; the prompt never sees them

> plan-playtest.md **v9** · change list stamped against tree `a6e2a07`
> (2026-08-07, g1-1 merged) — every row re-verified byte-identical at handoff,
> E7 resolved to a verbatim new suite file, and the **entire change list was
> applied to a scratch tree and verified**: `check` green, 1621/1621 tests,
> probe selftest 44/44, build green, A20 clean; then reverted.
> **Wave 1** (re-ordered from "after group 3", 08-07): nothing else in flight
> touches these files, and `g3-1` stamps *after* groups 1–2 land, so it absorbs
> this unit's `docs/spec-client.md` line drift, not the other way round. May
> develop and merge in parallel with `g1-2`, `g1-3`, `g1-6`.
> Executor: Sonnet-class session. Branch `playtest/g4-1-u52b` off current `main`.
> One commit, message: `playtest(U5.2b): report event carries the judged stance's desc`.
> Open a PR; merge nothing (§5.6). Confirm `git config user.email` resolves to the
> `alstjgg` account first (hard rule 1).

## Outcome

The prose a gate's author wrote for each stance (`gates.json` `stances[].desc` —
e.g. *"질문지를 덮는다 — 발신자의 말이 끝날 때까지 끊지 않고 자리를 내준다"*)
survives compilation and rides the `report` event as
`judged?: { stance_id, desc }` — the stance the agent actually took that round,
in player-readable words. Nothing renders yet (that is U5.2c). The judgment
prompt, the payload the proxy validates, and every C-BLOCK measurement stay
byte-identical.

## Why the prompt cannot drift (the load-bearing fact)

`src/composer/compose.ts:88-104` re-projects stances **explicitly** —
`STANCE_SET: view.STANCE_SET.map((stance) => ({ id: stance.id, label: stance.label }))` —
so a widened engine-side `Stance` never reaches the wire. That line is this
unit's hard boundary: it is named in Must-NOT and its file is untouched.

## Scope

May modify (only these nine files, plus the one new file):

- `src/shared/contracts.ts` — `Stance` gains optional `desc`.
- `src/engine/beat/schedule.ts` — `compileGate` stops dropping it.
- `src/engine/index.ts` — `submitStance` returns the stance it resolved (E8).
  The engine is the only party that knows chosen-vs-default (`gateView()`
  deliberately hides `default_stance`, spec-engine §5) — so it reports what it
  resolved rather than the driver re-deriving it.
- `src/driver/ports.ts` — `EnginePort.submitStance` mirrors the new return (E9).
- `src/driver/live-driver.ts` — stores the engine's answer per round; the
  `report` emit carries it.
- `tests/driver/engine-fixtures/rig.ts` — the spy wrapper passes the return
  through (E10).
- `src/shared/view-driver.ts` — the `report` member gains `judged?`.
- `docs/spec-client.md` — the §5.2 fence's `report` line, in lockstep
  (`tests/driver/seam-shapes.test.ts (d)` holds the two to the same
  normalization).
- `tests/engine/beat/views.test.ts` — the one `toEqual` that pins the old shape.
- `tests/driver/engine-judged-stance.test.ts` — **new file** (E7). The name is
  bound: `engine-boundaries.test.ts` (b) requires every unregistered new suite
  under `tests/driver/` to be named `engine-*`.

Must NOT modify:

- `src/composer/compose.ts` — the projection above **is** the prompt guarantee.
- `proxy/**` and `tools/lib/**` — `tests/composer/compose.test.ts` A20 requires
  `git status --porcelain` on them to be empty.
- `src/shared/seam-keys.ts` — and the new field names must not collide with the
  bans: `judged`, `stance_id`, `desc` are clean; never name anything
  `because_*`, `rejected_*`, or `truths*`.
- The ViewEvent union's member count — extend the existing `report` member;
  never add a ninth member (`seam-shapes (e)` counts 8).
- `vite.config.ts` — `stances[].desc` already ships in the published pack
  (verified in `dist/`); no strip change.

Tests turning red, and their disposition:
`tests/engine/beat/views.test.ts:159-162` pins the projected stances without
`desc` — **amended** (E6). `tests/driver/seam-shapes.test.ts` stays green only
if E4 and E5 land with identical text — that pairing is the point of both
(dry-run-verified: the frozen suite accepts the two-line member).
Without E10, `npm run check` fails at `rig.ts:155` (TS2322: the spy wrapper
still declares `void`) — that is why the rig edit is a row, not collateral.

## Change list

**E1 — `src/shared/contracts.ts:23-24`**
current:
```ts
/** A stance the agent may pick at a gate. Per-gate content, never global. */
export type Stance = { id: string; label: string }
```
replace with:
```ts
/**
 * A stance the agent may pick at a gate. Per-gate content, never global.
 * `desc` is the authored player-facing prose (§5.2 `judged`); the composer's
 * slot projection never carries it, so the prompt cannot see it.
 */
export type Stance = { id: string; label: string; desc?: string }
```

**E2 — `src/engine/beat/schedule.ts:109`**
current:
```ts
    stances: authored.stances.map((stance) => ({ id: stance.id, label: stance.label })),
```
replace with:
```ts
    stances: authored.stances.map((stance) => ({ id: stance.id, label: stance.label, desc: stance.desc })),
```
(Plain `desc: stance.desc`, no guard: the authored type requires `desc`
(`src/shared/datapack.ts:146-150`, schema `minLength: 1`), so an undefined-guard
here is comparing `string` to `undefined` — dead code tsc rejects. The
optionality lives only on the seam side, in E1's `Stance.desc?`. E3a's
`...(judged === undefined ? {} : { judged })` is the genuinely optional case —
a `Map.get` — and stays.)

**E3 — `src/driver/live-driver.ts`**, three edits, bottom-up:

E3a — the report emit (currently `:190-200`)
current:
```ts
      if (beat.isRoundLast && beat.roundIndex !== null) {
        const reporter = await call(3, composer.reporter(engine.roundView()), readReporter)
        const report = engine.applyReport(reporter)
        blocks.absorbSentences(report)
        emit({
          type: 'report',
          round: beat.roundIndex,
          facts: report.facts,
          report_body: report.report_body,
        })
      }
```
replace with:
```ts
      if (beat.isRoundLast && beat.roundIndex !== null) {
        const reporter = await call(3, composer.reporter(engine.roundView()), readReporter)
        const report = engine.applyReport(reporter)
        blocks.absorbSentences(report)
        const judged = judgedStances.get(beat.roundIndex)
        emit({
          type: 'report',
          round: beat.roundIndex,
          facts: report.facts,
          report_body: report.report_body,
          ...(judged === undefined ? {} : { judged }),
        })
      }
```

E3b — the judgment site (currently `:177-180`)
current:
```ts
      if (beat.kind === 'gate') {
        const request = composer.judgment(engine.gateView(), membrane.deployed())
        engine.submitStance(await call(1, request, readJudgment))
      }
```
replace with:
```ts
      if (beat.kind === 'gate') {
        const request = composer.judgment(engine.gateView(), membrane.deployed())
        // U5.2b — the engine resolves chosen-vs-default (§5 recovery is its
        // move); keep its words for the round's report event.
        const judged = engine.submitStance(await call(1, request, readJudgment))
        if (beat.roundIndex !== null && judged !== null) {
          judgedStances.set(beat.roundIndex, judged)
        }
      }
```
(Re-designed at stamp, 08-07: the first draft read `beat.gate` here, but the
driver's `BeatCursor` carries no gate (`src/engine/beat/driver.ts:84-90`) and
`gateView()` deliberately hides `default_stance` — the resolution is the
engine's alone, so E8 makes the engine *return* it. Caught by applying the
full change list to a scratch tree, exactly the failure mode §5.7 exists for.)

E3c — the driver-scope state (insert beside the factory's other `let`/`const`
state, immediately above the `finish()` function that currently begins at
`:149`):
```ts
  /** U5.2b — the judged stance per round, in the author's words (§5.2 `judged`). */
  const judgedStances = new Map<number, { stance_id: string; desc: string }>()
```

**E4 — `src/shared/view-driver.ts:29`**
current:
```ts
  | { type: 'report';   round: number; facts: Sentence[]; report_body: Sentence[] }
```
replace with:
```ts
  | { type: 'report';   round: number; facts: Sentence[]; report_body: Sentence[];
                        judged?: { stance_id: string; desc: string } }
```

**E5 — `docs/spec-client.md:192`** — the identical line inside the §5.2 fence
current:
```
  | { type: 'report';   round: number; facts: Sentence[]; report_body: Sentence[] }
```
replace with:
```
  | { type: 'report';   round: number; facts: Sentence[]; report_body: Sentence[];
                        judged?: { stance_id: string; desc: string } }
```

**E6 — `tests/engine/beat/views.test.ts:159-162`**
current:
```ts
    expect(view.STANCE_SET).toEqual([
      { id: 'a', label: 'A' },
      { id: 'b', label: 'B' },
    ])
```
replace with:
```ts
    expect(view.STANCE_SET).toEqual([
      { id: 'a', label: 'A', desc: 'a-desc' },
      { id: 'b', label: 'B', desc: 'b-desc' },
    ])
```
*(Stamp check: the fixture descs are reported as `'a-desc'`/`'b-desc'` at
`tests/engine/beat/fixtures/packs.ts:55-58` — verified against the file before
handoff; if they differ, this PRD is reissued, not adapted.)*

**E7 — `tests/driver/engine-judged-stance.test.ts`** — new file, this exact
content:
```ts
// [u52b] — the `report` event carries the judged stance in the author's words
// (`judged?: { stance_id, desc }`), sourced from the PACK's stances, never
// from model output. A fallback round carries the DEFAULT stance's desc.
import { describe, it, expect } from 'vitest'
import { drain, failingTransport, makeRig, sentinelJudgment } from './engine-fixtures/rig.ts'

describe('[u52b] the report event carries the judged stance', () => {
  it("(a) a judged round: the chosen stance, desc from the pack", async () => {
    const rig = makeRig({ responses: { judgment: { ...sentinelJudgment(), stance: 'escalate' } } })
    const events = await drain(rig)
    const reports = events.flatMap((event) => (event.type === 'report' ? [event] : []))
    expect(reports.length).toBe(1)
    expect(reports[0]?.judged).toEqual({ stance_id: 'escalate', desc: 'b-desc' })
  })

  it("(b) a fallback round: the default stance, desc from the pack", async () => {
    const events = await drain(makeRig({ transport: failingTransport('judgment') }))
    const reports = events.flatMap((event) => (event.type === 'report' ? [event] : []))
    expect(reports.length).toBe(1)
    expect(reports[0]?.judged).toEqual({ stance_id: 'hold', desc: 'a-desc' })
  })
})
```
Why these values are fixed, not chosen: the rig pack's stances are
`hold` (desc `'a-desc'`, the default) and `escalate` (desc `'b-desc'`) at
`tests/driver/engine-fixtures/pack.ts:87-91`; the plain fixture judgment picks
`stances[0]` (= `hold`, `src/transport/fixture.ts:32-33`), so (a) overrides it
to `escalate` — the one stance that proves `judged` follows the **response**,
not the default. (b)'s failing Call 1 makes `call()` return `null`
(`live-driver.ts:130-138`), so E3b's fallback arm picks
`beat.gate.defaultStance` (= `hold`). All four exports the file imports exist
in `engine-fixtures/rig.ts` (`drain:254`, `failingTransport:65`,
`makeRig:225`, `sentinelJudgment:317`).

**E8 — `src/engine/index.ts`**, two edits:

E8a — the `EngineHandle` interface (`:149-150`)
current:
```ts
  /** `null` ⇒ the engine substitutes this gate's authored `default_stance`. */
  submitStance(response: JudgmentResponse | null): void
```
replace with:
```ts
  /**
   * `null` ⇒ the engine substitutes this gate's authored `default_stance`.
   * Returns the stance it resolved — chosen or substituted — in the author's
   * words (U5.2b, §5.2 `judged`); `null` when it carries no `desc`.
   */
  submitStance(response: JudgmentResponse | null): { stance_id: string; desc: string } | null
```

E8b — the implementation (`:282-299`)
current:
```ts
    submitStance(response: JudgmentResponse | null): void {
      const beat = beatNow()
      if (beat.gate === null) throw new Error(`beat ${beat.index} carries no gate`)
      // §5 recovery: the authored default stance, which `gateView()` does not
      // expose — this is why substituting it has to be the engine's move.
      const fallback = response === null
      const stance = fallback ? beat.gate.defaultStance : response.stance
      utterance = fallback ? '' : response.utterance
      if (beat.roundIndex !== null) {
        roundGates.set(beat.roundIndex, {
          utterance,
          inner_note: fallback ? '' : response.inner_note,
        })
      }
      // The journal is the only place a substituted stance is distinguishable
      // from a chosen one after the fact (§2.1's `fallback:call1`).
      beats.submitStance({ stance, utterance, fallback })
    },
```
replace with:
```ts
    submitStance(response: JudgmentResponse | null): { stance_id: string; desc: string } | null {
      const beat = beatNow()
      if (beat.gate === null) throw new Error(`beat ${beat.index} carries no gate`)
      // §5 recovery: the authored default stance, which `gateView()` does not
      // expose — this is why substituting it has to be the engine's move.
      const fallback = response === null
      const stance = fallback ? beat.gate.defaultStance : response.stance
      utterance = fallback ? '' : response.utterance
      if (beat.roundIndex !== null) {
        roundGates.set(beat.roundIndex, {
          utterance,
          inner_note: fallback ? '' : response.inner_note,
        })
      }
      // The journal is the only place a substituted stance is distinguishable
      // from a chosen one after the fact (§2.1's `fallback:call1`).
      beats.submitStance({ stance, utterance, fallback })
      // U5.2b — report what was judged, in the author's words (§5.2 `judged`).
      const judged = beat.gate.stances.find((entry) => entry.id === stance)
      return judged?.desc !== undefined ? { stance_id: judged.id, desc: judged.desc } : null
    },
```
(An unknown `response.stance` — a model answering off the stance set — makes
`find` miss and the method return `null`: the report simply carries no
`judged`, the same tolerance the emit path already has.)

**E9 — `src/driver/ports.ts:54-55`**
current:
```ts
  /** `null` ⇒ the engine substitutes this gate's authored `default_stance`. */
  submitStance(response: JudgmentResponse | null): void
```
replace with:
```ts
  /**
   * `null` ⇒ the engine substitutes this gate's authored `default_stance`.
   * Returns the stance it resolved, in the author's words (U5.2b `judged`).
   */
  submitStance(response: JudgmentResponse | null): { stance_id: string; desc: string } | null
```

**E10 — `tests/driver/engine-fixtures/rig.ts:155-158`**
current:
```ts
    submitStance(response: JudgmentResponse | null): void {
      recorder.log.push({ name: 'engine.submitStance', value: response })
      inner.submitStance(response)
    },
```
replace with:
```ts
    submitStance(response: JudgmentResponse | null): { stance_id: string; desc: string } | null {
      recorder.log.push({ name: 'engine.submitStance', value: response })
      return inner.submitStance(response)
    },
```

## Invariants

- **Byte-identical prompts**: `npm run probe:selftest` and
  `proxy/tests` parity stay green; `git status --porcelain -- proxy tools/lib`
  stays empty (A20).
- **Invariant 6**: `judged` carries a per-gate stance letter and authored prose
  that already ships in the published pack — never a gate id, never a question.
- **Two composition roots**: `tools/driver/run/bind.mjs` consumes events
  tolerantly (its reducer defaults unknown types; `report` is not a case) — no
  change there, but the stamp re-confirms it.
- **Seam bans**: no `because_*`, `rejected_*`, `truths*`, `inner_note`,
  `temperament` key anywhere in the new field.

## Verification

1. `npm run check` — green (core+client tsc over the widened type).
2. `npm run test` — green, including `seam-shapes` (the E4/E5 lockstep),
   `views.test.ts` as amended, and the E7 assertion.
3. `npm run probe:selftest` — 44/44 (prompt parity untouched).
4. `npm run build` — green; `git status --porcelain -- proxy tools/lib` empty.
5. Behavioral: the E7 test **is** the behavioral check (the DEV desk runs the
   fixture loop, which never exercises the live driver — a console check there
   proves nothing; state this in the PR rather than faking one).

## Done when

- [ ] All edits applied; `git diff HEAD~1 --stat` shows exactly the ten listed paths (nine edited + the new E7 suite).
- [ ] Steps 1–4 green, in order.
- [ ] The E7 assertions pass: judged stance on a normal round, default stance's desc on a fallback round.
- [ ] `grep -n 'desc' src/composer/compose.ts` is empty — the projection still strips.
- [ ] PR opened from `playtest/g4-1-u52b`; nothing merged.

## If this PRD is wrong

```
An edit whose stated current text is not at the cited path and line is a defect
in this document, not a puzzle to solve. Do not search for the text elsewhere.
Do not adapt the edit to what you find. Do not skip ahead to the next edit.

Stop at the first mismatch and report:
  - the edits that applied, by path:line
  - the edit that did not, with the text actually present at that path and line
  - the commit you are working from: `git log -1 --format=%h`

Change nothing further, and open no PR. A report of this kind is a completed
run, not a failed one.
```

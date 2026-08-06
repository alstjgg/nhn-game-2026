# U5.2b — the seam carries the stance's own words; the prompt never sees them

> plan-playtest.md **v7** · change list stamped against tree `14dd971` (2026-08-07).
> Groups 1–3 do not touch these files except `docs/spec-client.md` (U3 edits other
> rows) — re-stamp is expected to be line-numbers only, plus the two marked
> fixture checks. **Executes after group 3 merges.**
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

May modify (only these six files):

- `src/shared/contracts.ts` — `Stance` gains optional `desc`.
- `src/engine/beat/schedule.ts` — `compileGate` stops dropping it.
- `src/driver/live-driver.ts` — remembers the judged stance per round; the
  `report` emit carries it.
- `src/shared/view-driver.ts` — the `report` member gains `judged?`.
- `docs/spec-client.md` — the §5.2 fence's `report` line, in lockstep
  (`tests/driver/seam-shapes.test.ts (d)` holds the two to the same
  normalization).
- `tests/engine/beat/views.test.ts` — the one `toEqual` that pins the old shape.

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
if E4 and E5 land with identical text — that pairing is the point of both.

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
    stances: authored.stances.map((stance) => ({
      id: stance.id,
      label: stance.label,
      ...(stance.desc === undefined ? {} : { desc: stance.desc }),
    })),
```
(Spread, not `desc: stance.desc`: a pack whose stance carries no `desc` would
otherwise get an explicit `desc: undefined` key, which survives `toEqual` but
not `toStrictEqual` and changes the object's JSON shape.)

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
        const judgment = await call(1, request, readJudgment)
        engine.submitStance(judgment)
        // U5.2b — remember the round's judged stance in the author's words.
        // Fallback picks the default stance, exactly as submitStance does.
        if (beat.roundIndex !== null && beat.gate !== null) {
          const id = judgment !== null && 'stance' in judgment ? judgment.stance : beat.gate.defaultStance
          const stance = beat.gate.stances.find((entry) => entry.id === id)
          if (stance?.desc !== undefined) {
            judgedStances.set(beat.roundIndex, { stance_id: stance.id, desc: stance.desc })
          }
        }
      }
```
(Executor note: `submitStance`'s own argument stays the raw `judgment` — the
narrowing mirror is `live-driver.ts:72-74`. If `beat.gate`'s type in this file
is not nullable-checked the way shown, stop per §5.7.)

E3c — the driver-scope state (insert beside the factory's other `let`/`const`
state, immediately above the `finish()` function that currently begins near
`:148`):
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

**E7 — behavioral assertion** *(exact suite and insertion point fixed at stamp
time; the shape is decided)*: one assertion added to the existing driver-rig
test that already runs a gate round end-to-end, asserting the emitted `report`
event carries `judged` with the fixture stance's `stance_id` and `desc`, and
that a fixture-fallback run carries the **default** stance's desc.

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

- [ ] All edits applied; `git diff HEAD~1 --stat` shows exactly the six listed files (plus the E7 suite).
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

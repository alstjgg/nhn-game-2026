# g4-2 — U5.2b+: the report's `judged` carries `cited_ids` — the citation, filtered to deployed

> plan-playtest v12 · citations bind to `fa49be6` · branch `playtest/g4-2-u52b-cited`
> commit message: `playtest(U5.2b+): judged carries cited_ids — the citation, filtered to deployed`

## Outcome

The `report` ViewEvent's `judged` field grows a third member, `cited_ids: string[]`
— the block ids the judgment call cited (`because_block_ids`), **filtered to ids
the player actually deployed**. A fallback round (no judgment response) carries
`cited_ids: []`. The client is untouched: U5.2c (next wave) renders this. After
this unit, a player-deployed sentence that the agent cited is distinguishable,
at the seam, from one the agent ignored.

## Scope

May modify:
- `docs/spec-client.md` (one line inside the §5.2 ratified fence)
- `src/shared/view-driver.ts`
- `src/driver/live-driver.ts`
- `tests/driver/engine-judged-stance.test.ts`

Must NOT modify:
- `src/engine/**` — `submitStance` keeps returning `{stance_id, desc} | null`;
  the citation is read by the driver from the response it already holds.
- `src/driver/ports.ts` — the port signature does not change.
- `src/client/**` — rendering is U5.2c's unit.
- `proxy/**` — `because_block_ids` is already a required response field.
- `src/shared/seam-keys.ts`, `src/driver/seam-guard.ts`,
  `tests/driver/engine-leak.test.ts`, `tests/driver/seam-leak-guard.test.ts` —
  these must pass **unchanged**. The new key is named `cited_ids` precisely
  because the `because_*` family is banned on the seam at runtime.

Tests turned red then amended: `tests/driver/engine-judged-stance.test.ts` (its
two expectations gain `cited_ids: []`; a third case is added).
Tests that must stay green unchanged: `tests/driver/seam-shapes.test.ts` (the
spec fence and the module are edited to the same declaration, so the normalised
parity holds), `tests/driver/engine-leak.test.ts` (the sentinel citation id is
filtered out by construction — nothing deploys it).

## Change list

Edits are per file; same-file edits are listed bottom-up.

**1. `docs/spec-client.md:195`** — current:
```
                        judged?: { stance_id: string; desc: string } }
```
replace with:
```
                        judged?: { stance_id: string; desc: string; cited_ids: string[] } }
```

**2. `src/shared/view-driver.ts:30`** — current:
```
                        judged?: { stance_id: string; desc: string } }
```
replace with:
```
                        judged?: { stance_id: string; desc: string; cited_ids: string[] } }
```

**3. `src/driver/live-driver.ts`** — two edits, bottom-up.

3a. `:182` — the block whose first line is
`        // U5.2b — the engine resolves chosen-vs-default (§5 recovery is its`
— current (6 lines, `:182-187`):
```ts
        // U5.2b — the engine resolves chosen-vs-default (§5 recovery is its
        // move); keep its words for the round's report event.
        const judged = engine.submitStance(await call(1, request, readJudgment))
        if (beat.roundIndex !== null && judged !== null) {
          judgedStances.set(beat.roundIndex, judged)
        }
```
replace with:
```ts
        // U5.2b — the engine resolves chosen-vs-default (§5 recovery is its
        // move); keep its words for the round's report event. U5.2b+ — keep
        // the citation too, filtered to ids the player deployed: the model
        // selects among the player's own blocks and cannot mint an id onto
        // the seam (`because_*` itself stays a banned key family there).
        const response = await call(1, request, readJudgment)
        const judged = engine.submitStance(response)
        if (beat.roundIndex !== null && judged !== null) {
          const deployed = new Set(membrane.deployed())
          judgedStances.set(beat.roundIndex, {
            ...judged,
            cited_ids:
              response === null
                ? []
                : response.because_block_ids.filter((id) => deployed.has(id)),
          })
        }
```

3b. `:148-149` — current:
```ts
  /** U5.2b — the judged stance per round, in the author's words (§5.2 `judged`). */
  const judgedStances = new Map<number, { stance_id: string; desc: string }>()
```
replace with:
```ts
  /**
   * U5.2b — the judged stance per round, in the author's words; U5.2b+ adds
   * `cited_ids`, the citation filtered to deployed ids (§5.2 `judged`).
   */
  const judgedStances = new Map<
    number,
    { stance_id: string; desc: string; cited_ids: string[] }
  >()
```

**4. `tests/driver/engine-judged-stance.test.ts`** — replace the whole file with:
```ts
// [u52b] — the `report` event carries the judged stance in the author's words
// (`judged?: { stance_id, desc, cited_ids }`), desc sourced from the PACK's
// stances, never from model output. A fallback round carries the DEFAULT
// stance's desc and an empty citation. [u52b+] — `cited_ids` is the judgment's
// `because_block_ids` filtered to ids the player DEPLOYED: the model selects
// among the player's own blocks and cannot mint an id onto the seam.
import { describe, it, expect } from 'vitest'
import { drain, failingTransport, makeRig, sentinelJudgment } from './engine-fixtures/rig.ts'

describe('[u52b] the report event carries the judged stance', () => {
  it('(a) a judged round: the chosen stance, desc from the pack, nothing cited when nothing was deployed', async () => {
    const rig = makeRig({ responses: { judgment: { ...sentinelJudgment(), stance: 'escalate' } } })
    const events = await drain(rig)
    const reports = events.flatMap((event) => (event.type === 'report' ? [event] : []))
    expect(reports.length).toBe(1)
    expect(reports[0]?.judged).toEqual({ stance_id: 'escalate', desc: 'b-desc', cited_ids: [] })
  })

  it('(b) a fallback round: the default stance, desc from the pack, empty citation', async () => {
    const events = await drain(makeRig({ transport: failingTransport('judgment') }))
    const reports = events.flatMap((event) => (event.type === 'report' ? [event] : []))
    expect(reports.length).toBe(1)
    expect(reports[0]?.judged).toEqual({ stance_id: 'hold', desc: 'a-desc', cited_ids: [] })
  })

  it('(c) cited_ids keeps only deployed ids — a model-minted id never crosses the seam', async () => {
    const rig = makeRig({
      responses: {
        judgment: {
          ...sentinelJudgment(),
          stance: 'escalate',
          because_block_ids: ['b-r1-f01', 'SENTINEL-BECAUSE-BLOCK-ID'],
        },
      },
    })
    rig.blocks.absorbSentences({
      facts: [{ id: 'b-r1-f01', text: '창고 문이 열려 있었다.', species: 'fact' }],
      report_body: [],
    })
    expect(rig.blocks.mine('b-r1-f01')).toBe(true)
    expect(rig.driver.submit({ op: 'deploy', blocks: ['b-r1-f01'] })).toEqual({ ok: true })
    const events = await drain(rig)
    const reports = events.flatMap((event) => (event.type === 'report' ? [event] : []))
    expect(reports[0]?.judged).toEqual({
      stance_id: 'escalate',
      desc: 'b-desc',
      cited_ids: ['b-r1-f01'],
    })
  })
})
```

## Invariants

- **The seam's banned-key families stay banned.** `src/shared/seam-keys.ts`
  bans `because_*` at runtime; the new field is `cited_ids` for exactly that
  reason. Do not rename it to anything starting `because_`, `rejected_`,
  `truths`, or to `inner_note`/`temperament` — the driver's out-edge guard
  (`src/driver/seam-guard.ts`) throws on those.
- **The leak guarantee holds by construction.** `sentinelJudgment()`'s
  `'SENTINEL-BECAUSE-BLOCK-ID'` must never appear in a ViewEvent
  (`tests/driver/engine-leak.test.ts (a)`); the deployed-set filter is what
  keeps it out. If the filter is dropped, that suite goes red — that is
  correct behaviour, not a test to amend.
- **Spec-fence parity.** `tests/driver/seam-shapes.test.ts` normalises the §5.2
  fence in `docs/spec-client.md` against `src/shared/view-driver.ts`. Edits 1
  and 2 must be textually identical inside the declaration.
- **Both composition roots** (`src/client/driver/live/bind.ts`,
  `tools/driver/run/bind.mjs`) bind this same live driver — no per-root edit
  exists or is needed.

## Verification

Run from the worktree root, in order:
1. `npm run check` — expected: green.
2. `npx vitest run` — expected: all green, including
   `tests/driver/engine-judged-stance.test.ts` (3 passed),
   `tests/driver/engine-leak.test.ts`, `tests/driver/seam-shapes.test.ts`,
   `tests/driver/seam-leak-guard.test.ts` unchanged and green.

(No e2e run in this unit — the client is untouched; the author runs the full
suite again on the merge preview.)

## Done when

- [ ] `npm run check` exits 0.
- [ ] `npx vitest run` exits 0.
- [ ] `npx vitest run tests/driver/engine-judged-stance.test.ts` reports 3 passed.
- [ ] Behavioural: test (c) drives the shipped `createEngine` + `createLiveDriver`
      end to end, and the emitted `report` event's `judged.cited_ids` equals
      `['b-r1-f01']` while `'SENTINEL-BECAUSE-BLOCK-ID'` appears nowhere in the
      stream.
- [ ] `grep -rn "cited_ids" src/client` prints nothing (the client is untouched).
- [ ] Exactly one code commit on `playtest/g4-2-u52b-cited`, nothing pushed.

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

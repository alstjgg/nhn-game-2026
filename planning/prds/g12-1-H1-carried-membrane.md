# g12-1 — H1: the committed file is replayed into the new day's membrane

> plan-playtest v13 · citations bind to `f9bae7e` · branch `playtest/h1-carried-membrane`
> commit message: `playtest(H1): the carried file reaches the new run's membrane, seats and all`

## Outcome

On the live desk, a day that opens with a carried agent file can be edited and is
actually flown. Today it can be neither: the ✕ on a carried slot is refused, so
nothing can be released to make room, and the judgment call for every day after
the first carries **no blocks at all**. After this unit the carried sentences sit
in the seats the operator chose, `해제` releases them, and the file the operator
committed is the file the model receives.

## Root cause (author-resolved — do not re-derive)

`createMembrane` is per bound run (`src/driver/live-driver.ts:87`), so a day that
opens holds an empty seat map and an empty deployed set. W4 re-armed the carried
file in the adapter's **view mirror** (`adapter.ts:284-286`) by direct assignment
and never replayed it into the new run's membrane. Two consequences:

- `unslot` hits `if (!slots.has(op.slot)) return deny('empty_slot')`
  (`src/driver/membrane.ts:51-52`), the board keeps its state per R4, and nothing
  releases.
- `membrane.deployed()` — which is what Call 1 carries
  (`live-driver.ts:187`, `composer.judgment(engine.gateView(), membrane.deployed())`)
  — is `[]`. `bindLiveRun`'s `seedCarried` only absorbs and mines the carried
  blocks (`src/client/driver/live/bind.ts:60-65`); it never slots or deploys them.

The fixture loop has always replayed the file as real ops
(`src/client/driver/fixtures/run-loop.ts` `carry()`), which is why the browser
suite is green over this. The live path must do the same.

A second defect rides along: `adapter.ts:285` re-indexes `close.carried` — built
from the **sorted** `deployed` list — into seats `0..n-1`, discarding where the
operator actually put each card.

## Scope

May modify, only these two files:

- `src/client/driver/live/adapter.ts`
- `tests/driver/live-adapter-run-transition.test.ts`
- `DISCOVERY.md` (append only — the one bullet in E5)

Must NOT modify:

- `src/driver/membrane.ts` — `deny('empty_slot')` is correct; the membrane is
  being told the truth for the first time, not loosened.
- `src/client/driver/live/bind.ts` — `seedCarried` mines the deck, which is its
  job. Slotting is the adapter's, because only the adapter knows the seats.
- `src/client/driver/fixtures/run-loop.ts` — the fixture path is already right.
- `src/client/components/slot-board.ts` — the board's refusal on a rejected op is
  R4 and stays.

Test files this unit turns red: `tests/driver/live-adapter-run-transition.test.ts`
only — its `(d)` asserts the old re-indexed seat. It is **amended, not relaxed**
(E4), and the file already carries a `RE-AIMED` marker and is already named in
`DISCOVERY.md:987`, so the `(l)` guard in
`tests/acceptance/discovery-and-frozen-guard.test.ts` stays green either way.

## Change list

Same-file edits are listed **bottom-up**; apply in the order given.

### E1 — `src/client/driver/live/adapter.ts:289-291`

Current text:

```
    bind(opened)
    release()
    kick()
```

Replacement text:

```
    bind(opened)
    // H1 — the three assignments above are a MIRROR, and a mirror is not a
    // membrane. `createMembrane` is per bound run (`driver/live-driver.ts`), so
    // the day that just opened holds an empty seat map and an empty deployed
    // set. Left that way `unslot` answers `empty_slot` and a carried sentence
    // can never be released, and `membrane.deployed()` — what Call 1 carries
    // (`live-driver.ts`, `composer.judgment`) — is empty, so the file the
    // operator committed never reaches the model at all. The fixture loop has
    // always replayed the file as real ops (`fixtures/run-loop.ts` `carry()`).
    // Submitted before `release()`, because `kick()` may step into Call 1.
    for (const [seat, id] of seats) opened.driver.submit({ op: 'slot', block_id: id, slot: seat })
    opened.driver.submit({ op: 'deploy', blocks: [...deployed] })
    release()
    kick()
```

### E2 — `src/client/driver/live/adapter.ts:284-286`

Current text:

```
    mined = close.carried.map((block) => block.id)
    slots = new Map(close.carried.map((block, seat) => [seat, block.id]))
    deployed = close.carried.map((block) => block.id).sort()
```

Replacement text:

```
    mined = close.carried.map((block) => block.id)
    slots = new Map(seats)
    deployed = close.carried.map((block) => block.id).sort()
```

### E3 — `src/client/driver/live/adapter.ts:255`

Current text:

```
    const close = closingState()
```

Replacement text:

```
    const close = closingState()
    // H1 — the operator's own seating, captured BEFORE the mirror is
    // reassigned below. `close.carried` is built from `deployed`, which is
    // sorted, so re-indexing it from 0 moves cards to seats nobody chose.
    const carriedIds = new Set(close.carried.map((block) => block.id))
    const seats: [number, string][] = [...slots.entries()]
      .filter(([, id]) => carriedIds.has(id))
      .sort((left, right) => left[0] - right[0])
```

### E4 — `tests/driver/live-adapter-run-transition.test.ts`

Four edits in this file, listed bottom-up.

**E4a — the `(d)` expectation.** Current text:

```
    expect(adapter.store()).toEqual({ mined: [B1.id], slots: { 0: B1.id }, deployed: [B1.id] })
```

Replacement text:

```
    // RE-AIMED again (08-08, H1): seat 2, not seat 0. The old expectation
    // encoded the re-index that moved a carried card to a seat the operator
    // never chose; the carry now keeps the arrangement it was committed in.
    expect(adapter.store()).toEqual({ mined: [B1.id], slots: { 2: B1.id }, deployed: [B1.id] })
```

**E4b — a new test.** Insert immediately before the line that closes the
`describe('the store the desk shows is the store the new run has', …)` block —
that is, before the final `})` on the last line of the file. Text to insert:

```

  it('(g) the carried file is replayed into the NEW run as real ops, seats and all', async () => {
    // The regression this unit fixes. The adapter's own mirror said the right
    // thing while the run's membrane knew nothing: `unslot` answered
    // `empty_slot` and `membrane.deployed()` — what Call 1 carries — was empty,
    // so every day after the first flew an agent file the model never saw.
    const sent: unknown[] = []
    const adapter = createLiveAdapter({
      first: stubRun(1, [B1, B2]),
      canOpenNext: () => true,
      closeRun: () => {},
      next: async () => stubRun(2, [B1, B2], sent),
    })
    adapter.start()

    adapter.send({ op: 'mine', sentence_id: B1.id } as never)
    adapter.send({ op: 'mine', sentence_id: B2.id } as never)
    adapter.send({ op: 'slot', block_id: B1.id, slot: 2 } as never)
    adapter.send({ op: 'slot', block_id: B2.id, slot: 0 } as never)
    adapter.send({ op: 'deploy', blocks: [B1.id, B2.id] } as never)

    adapter.send({ op: 'new_run' } as never)
    await settle()

    expect(sent).toEqual([
      { op: 'slot', block_id: B2.id, slot: 0 },
      { op: 'slot', block_id: B1.id, slot: 2 },
      { op: 'deploy', blocks: [B1.id, B2.id] },
    ])
    expect(adapter.store().slots).toEqual({ 0: B2.id, 2: B1.id })
  })
```

**E4c — `stubRun` records what it is sent.** Current text:

```
    driver: {
      step: async () => false,
      subscribe: () => () => {},
      submit: () => ({ ok: true }),
      blocks: () => ({ get: (id: string) => store.get(id) }),
    } as never,
```

Replacement text:

```
    driver: {
      step: async () => false,
      subscribe: () => () => {},
      submit: (op: unknown) => {
        sent?.push(op)
        return { ok: true }
      },
      blocks: () => ({ get: (id: string) => store.get(id) }),
    } as never,
```

**E4d — `stubRun`'s signature.** Current text:

```
function stubRun(run: number, blocks: readonly Block[]): BoundRun {
```

Replacement text:

```
function stubRun(run: number, blocks: readonly Block[], sent?: unknown[]): BoundRun {
```

### E5 — `DISCOVERY.md`

Append this bullet as the **last line of the file**, on its own line:

```
- [H1] **A mirror is not a membrane.** W4 re-armed the carried agent file in the live adapter's view mirror (`live/adapter.ts`) and never replayed it into the run that opened. `createMembrane` is per bound run, so the new day held an empty seat map: `unslot` answered `empty_slot` (the operator could not release a carried sentence at all) and `membrane.deployed()` — the value `composer.judgment` carries into Call 1 — was empty, so every day after the first flew a file the model never received. Fixed by submitting the file as real `slot`/`deploy` ops into the opened run, which is what the fixture loop's `carry()` always did. `tests/driver/live-adapter-run-transition.test.ts` `(d)` is RE-AIMED a second time (C17): the carry keeps the operator's seat numbers instead of re-indexing the sorted carry list from 0.
```

## Invariants

- **The membrane rule.** These are structured ops carrying ids the engine minted.
  Nothing here composes text.
- **R4 — a refused op leaves the board untouched.** This unit does not change
  that; it removes the reason the refusal was happening.
- **Op order is load-bearing.** `slot` before `deploy`, and both before
  `release()`/`kick()`, because `kick()` can step the engine into Call 1.
- **`blocks.has()` is `mined.has()`** (`src/driver/blocks.ts:44-45`), and
  `seedCarried` mines every carried id, so both op families ack. If a `slot` op
  is refused, that premise is wrong — stop and report under §5.7 rather than
  loosening the membrane.
- **Two composition roots** (`src/client/driver/live/bind.ts`,
  `tools/driver/run/bind.mjs`) stay in step. This unit touches neither.

## Verification

- `npm run check` — passes.
- `npx vitest run tests/driver/live-adapter-run-transition.test.ts` — all tests
  pass, including the new `(g)`.
- `npx vitest run` — the full suite passes. Report the count.
- `npm run build` — passes.
- Do **not** run playwright. The author runs the browser lanes.

## Done when

- [ ] `git diff --stat` names exactly three files: `adapter.ts`,
      `live-adapter-run-transition.test.ts`, `DISCOVERY.md`.
- [ ] `(g)` passes, and it fails when E1's two `submit` lines are commented out
      (check this once, then restore them).
- [ ] `(d)` asserts `slots: { 2: B1.id }`.
- [ ] `grep -n "new Map(close.carried" src/client/driver/live/adapter.ts` returns
      nothing.
- [ ] Full vitest run is green.
- [ ] **Behavioural:** in `(g)`, the ops the new run receives are exactly the
      operator's two seats followed by the deploy set — that is the agent file
      arriving at the run that will fly it.

## If this PRD is wrong

An edit whose stated current text is not at the cited path and line is a defect
in this document, not a puzzle to solve. Do not search for the text elsewhere.
Do not adapt the edit to what you find. Do not skip ahead to the next edit.

Stop at the first mismatch and report:
  - the edits that applied, by path:line
  - the edit that did not, with the text actually present at that path and line
  - the commit you are working from: `git log -1 --format=%h`

Change nothing further, and open no PR. A report of this kind is a completed
run, not a failed one.

# hf2 — a sentence the desk has shown stays minable, on any day

> plan-playtest v15 · citations bind to `e3c9714` (`origin/main`) · branch `hotfix/past-sentences-stay-minable`
> commit message: `fix(live): every sentence the desk has shown is minable on any later day`

## Outcome

A sentence in a past sitting's REPORTS tab can be mined and seated on any later
day. Today the click is refused: the sentence flashes and nothing happens, which
reads as "the sentence will not select".

## Why (author-resolved — do not re-derive)

민서's ruling, 08-08: **anything the desk has ever shown stays minable.** A line
from day 1 can be deployed on day 4.

**The refusal is real and it is at the membrane, not in the client.**
`bindLiveRun` (`live/bind.ts:70`) builds a **fresh `createBlockStore()` per
run**, and `seedCarried` seeds only the blocks the player deployed. Every other
sentence from an earlier sitting is unknown to today's store, so
`{op: 'mine'}` → `blocks.mine(id)` → `false` → `deny('not_minable')`, and
`windows/reports.ts:137` flashes and gives up. The client is behaving correctly;
the store simply does not know the id.

**This is invisible to `e2e/` by construction.** The DEV fixture loop's store is
one flat object that survives `new_run`, so mining a past sentence already works
there. It is the same blind spot that hid H1 and H2. **This unit is proved at
the driver seam under vitest and nowhere else** — a green browser suite says
nothing about it.

## Design (author-resolved — do not re-derive)

- **The block store's two tiers are what make this safe.** `blocks.ts` holds
  `seen` (id → text, everything shown) and `mined` (the subset the player
  mined). `mine()` reads `seen`; `has()` and `get()` read `mined`. Past
  sentences are seeded into **`seen` only** — never mined — so they become
  minable without becoming deployed, and `composer`'s `BLOCKS` still resolves
  against `mined` alone. **The membrane rule is untouched:** Call 1 still
  carries exactly what the player deployed.
- **The adapter already has the material.** `adapter.ts:121` declares
  `const seen: ViewEvent[] = []` at adapter scope, pushed in `fanout` (`:156`)
  and never cleared — so it holds every event of every run. The sentences are
  derived from it at close, by the same rule `blocks.ts` uses: a `feed` line
  with a `sentence_id`, and a `report`'s `facts` + `report_body`. **Nothing new
  is accumulated and no new state is introduced.**
- **It rides `RunClose`**, beside `carried`, because that is already the channel
  for "what the closing day hands on".
- **Seeding order is `shown` first, then `seedCarried`.** `seedCarried` absorbs
  AND mines; re-absorbing an id it already holds is a `Map.set` and harmless,
  but a carried block must end up mined, so it goes last.
- **`shown` is a superset of `carried`, deliberately.** Not deduplicated against
  it — the two seed different tiers and the overlap is one map write.

## Scope

May modify:

- `src/client/driver/live/adapter.ts` — `RunClose` gains the field; `closingState` fills it
- `src/client/driver/live/bind.ts` — `OpenRunDeps` gains it; `seedShown` seeds it
- `src/client/driver/live/index.ts` — `openRun` threads it
- `tests/driver/live-adapter-run-transition.test.ts` — two added tests

Must NOT modify:

- `src/driver/blocks.ts` · `src/driver/membrane.ts` — the two-tier store and the
  `not_minable` denial are both correct. Nothing about the refusal rule changes;
  what changes is what the store has seen.
- `src/client/windows/reports.ts` — the client is already right. `hotfix/reports-past-tab-identity`
  owns that file in a parallel unit; touching it here would collide.
- `src/client/driver/fixtures/**` — the fixture loop already behaves this way.
- `tests/driver/engine-boundaries.test.ts` — **do not add a new file to
  `tests/driver/`.** That suite's `(b)` requires every file there outside its
  allow-list to be named `engine-*`, and `live-adapter-run-transition.test.ts`
  is already on the allow-list, which is why the new tests go there.

## Change list

Four files, edits listed bottom-up within each file.

### E1 — `src/client/driver/live/adapter.ts`

**E1a — `:241`.** Current text:

```
  function closingState(): RunClose {
    const store = bound.driver.blocks()
    const carried: Block[] = []
    for (const id of deployed) {
      const block = store.get(id)
      if (block !== undefined) carried.push({ id, text: block.text })
    }
    return { reachedClock: clock.at(), carried }
  }
```

Replacement text:

```
  function closingState(): RunClose {
    const store = bound.driver.blocks()
    const carried: Block[] = []
    for (const id of deployed) {
      const block = store.get(id)
      if (block !== undefined) carried.push({ id, text: block.text })
    }
    // Every sentence the desk has EVER shown, derived from the event log rather
    // than from any store: `seen` is adapter-scoped and never cleared, so it
    // spans runs, while each run's block store is built fresh and knows only
    // its own day.
    return { reachedClock: clock.at(), carried, shown: shownFrom(seen) }
  }
```

**E1a-ii — insert the pure half at module scope.** Put this immediately **above**
`export type RunClose = {` (that is, above E1b's block, before it is edited):

```
/**
 * Every sentence a stream has shown, newest text winning, in first-seen order.
 *
 * Pure and exported so it can be tested without driving an adapter: the stub in
 * `tests/driver/live-adapter-run-transition.test.ts` never emits, and a rule
 * this small does not need a run to prove. The rule itself is `blocks.ts`'s own
 * `seen` tier restated — a feed line carrying a `sentence_id`, and a report's
 * facts and body — restated rather than shared because the store exposes no way
 * to enumerate that tier.
 */
export function shownFrom(events: readonly ViewEvent[]): Block[] {
  const byId = new Map<string, string>()
  for (const event of events) {
    if (event.type === 'feed') {
      if (event.line.sentence_id !== undefined) byId.set(event.line.sentence_id, event.line.text)
    } else if (event.type === 'report') {
      for (const sentence of [...event.facts, ...event.report_body]) byId.set(sentence.id, sentence.text)
    }
  }
  return [...byId].map(([id, text]) => ({ id, text }))
}
```

**E1b — `:61`.** Current text:

```
export type RunClose = {
  /** `"HH:MM"` the desk reached — e8 deepens timeline exposure from this. */
  reachedClock: string
  /**
   * The carry-over: the blocks the player DEPLOYED this run, resolved to text.
   * "Prompt carry-over" (plan-pipeline §1) is the composed prompt surviving the
   * day, and the deployed set is that prompt — not everything mined, which
   * would carry material the player looked at and rejected.
   */
  carried: Block[]
}
```

Replacement text:

```
export type RunClose = {
  /** `"HH:MM"` the desk reached — e8 deepens timeline exposure from this. */
  reachedClock: string
  /**
   * The carry-over: the blocks the player DEPLOYED this run, resolved to text.
   * "Prompt carry-over" (plan-pipeline §1) is the composed prompt surviving the
   * day, and the deployed set is that prompt — not everything mined, which
   * would carry material the player looked at and rejected.
   */
  carried: Block[]
  /**
   * Every sentence the desk has shown since boot, across every run — a SUPERSET
   * of `carried` and a different job. `carried` is the file the next day flies;
   * this is only what the next day is allowed to MINE, so that a report the
   * operator can still read on the archive rail is a report they can still mine
   * from (민서, 08-08). Seeded into the new run's `seen` tier and never into
   * `mined`, so nothing here reaches Call 1 unless the operator deploys it.
   */
  shown: Block[]
}
```

### E2 — `src/client/driver/live/bind.ts`

**E2a — `:69`.** Current text:

```
/** Wires one run and hands back what the adapter needs to open it. */
export function bindLiveRun(deps: BindDeps, open: OpenRunDeps): BoundRun {
  const blocks = createBlockStore()
  seedCarried(blocks, open.carried)
```

Replacement text:

```
/** Wires one run and hands back what the adapter needs to open it. */
export function bindLiveRun(deps: BindDeps, open: OpenRunDeps): BoundRun {
  const blocks = createBlockStore()
  // Order matters: `shown` only absorbs, `seedCarried` absorbs AND mines. A
  // carried block appears in both and must end up mined, so it goes last.
  seedShown(blocks, open.shown)
  seedCarried(blocks, open.carried)
```

**E2b — `:59`.** Current text:

```
function seedCarried(blocks: MutableBlockStore, carried: readonly Block[]): void {
```

Replacement text:

```
/**
 * Every sentence the desk has already shown, into this run's `seen` tier only.
 *
 * NOT mined — `mine()` reads `seen` and `has()`/`get()` read `mined`, so an
 * absorbed-but-unmined sentence is exactly "minable, not deployed". That is
 * what lets an operator mine out of a past sitting's report on a later day
 * without any of it reaching Call 1 unbidden.
 *
 * There is deliberately no throw here, unlike `seedCarried`: a carried block
 * that cannot be seeded is a broken carry-over, but a shown sentence that
 * cannot be is just a line the next day will refuse to mine, which is the
 * behaviour this unit is replacing rather than a corruption of it.
 */
export function seedShown(blocks: MutableBlockStore, shown: readonly Block[]): void {
  for (const block of shown) {
    blocks.absorbLine({ kind: 'mark', clock: '00:00', text: block.text, sentence_id: block.id })
  }
}

function seedCarried(blocks: MutableBlockStore, carried: readonly Block[]): void {
```

**E2c — `:42`.** Current text:

```
  carried: readonly Block[]
```

Replacement text:

```
  carried: readonly Block[]
  /** Every sentence shown so far, seeded minable-but-unmined (`RunClose.shown`). */
  shown: readonly Block[]
```

### E3 — `src/client/driver/live/index.ts`

**E3a — `:190`.** Current text:

```
      const next = runLoop.startRun()
      current = next.run
      return openRun(next.carried, next.run)
```

Replacement text:

```
      const next = runLoop.startRun()
      current = next.run
      // `next.carried` is the run loop's carry-over; `close.shown` is the
      // desk's whole history and comes from the closing day, not the loop.
      return openRun(next.carried, next.run, close.shown)
```

**E3b — `:94`.** Current text:

```
  function openRun(carried: readonly Block[], run: number): BoundRun {
    return bindLiveRun(bindDeps, {
      run,
      carried,
      start: deps.start,
      end: deps.end,
      meta: runLoop.metaEvent(),
    })
  }
```

Replacement text:

```
  function openRun(carried: readonly Block[], run: number, shown: readonly Block[] = []): BoundRun {
    return bindLiveRun(bindDeps, {
      run,
      carried,
      // Defaulted, so the FIRST run of a session needs no argument: nothing has
      // been shown yet, and there is no closing day to have collected it.
      shown,
      start: deps.start,
      end: deps.end,
      meta: runLoop.metaEvent(),
    })
  }
```

### E4 — `tests/driver/live-adapter-run-transition.test.ts`

Append at the **end** of the file:

```

/* ══ hf2 — a sentence the desk has shown stays minable ═══════════════════ */

describe('a sentence the desk has shown stays minable on a later day', () => {
  it('(h) every sentence the stream showed is carried out of the close', () => {
    // The defect this pins: each run builds a FRESH block store and only the
    // carried blocks were seeded into it, so a past report's sentence answered
    // `not_minable` on every later day. `e2e/` cannot see it — the fixture
    // loop's store is one flat object that survives `new_run`.
    const shown = shownFrom([
      { type: 'beat_start', beat: 0, clock: '08:50' },
      { type: 'feed', line: { kind: 'radio', clock: '08:51', text: '회선 유지합니다.', sentence_id: 'b-r1-u01' } },
      // A symptom line carries no id and is authored identically every run, so
      // mining one would carry no information — it must not become minable.
      { type: 'feed', line: { kind: 'symptom', clock: '08:52', text: '발신자의 호흡이 얕아졌다' } },
      {
        type: 'report',
        round: 1,
        facts: [{ id: 'b-r1-f01', text: '계측 일지가 반출됐다.', species: 'fact' }],
        report_body: [{ id: 'b-r1-b01', text: '나는 회선을 끊지 않았다.', species: 'selfnarr' }],
      },
    ] as never)

    expect(shown.map((b) => b.id).sort()).toEqual(['b-r1-b01', 'b-r1-f01', 'b-r1-u01'])
    expect(shown.find((b) => b.id === 'b-r1-f01')?.text).toBe('계측 일지가 반출됐다.')
  })

  it('(i) seeding leaves a shown sentence minable and NOT deployed', () => {
    const blocks = createBlockStore()
    seedShown(blocks, [{ id: 'b-r1-f01', text: '계측 일지가 반출됐다.' }])

    // `has()` reads the MINED tier: absorbed is not deployed, so nothing the
    // operator has not mined can reach Call 1.
    expect(blocks.has('b-r1-f01')).toBe(false)
    // …and `mine()` reads the SEEN tier, so the operator can still take it.
    expect(blocks.mine('b-r1-f01')).toBe(true)
    expect(blocks.has('b-r1-f01')).toBe(true)
    expect(blocks.mine('b-r9-f99')).toBe(false)
  })
})
```

**The exports and imports this needs, stated exactly.** In `bind.ts`, E2b's
`seedShown` must be declared `export function seedShown(...)`, not bare
`function` — the test imports it. Then add exactly these three import lines to
`tests/driver/live-adapter-run-transition.test.ts`, beside the ones it already
has; add nothing else and change no existing import:

```
import { shownFrom } from '../../src/client/driver/live/adapter.ts'
import { seedShown } from '../../src/client/driver/live/bind.ts'
import { createBlockStore } from '../../src/driver/blocks.ts'
```

**Neither test drives the adapter, and that is deliberate.** This file's
`stubRun` never calls its subscriber — `subscribe: () => () => {}` — so no
`feed` or `report` event can be pushed through it, and events that did arrive
would sit in `pending` until the clock released them. `(h)` therefore tests
`shownFrom` directly, which is why E1a-ii makes it pure and exported. **Do not
try to make the stub emit.**

## Invariants

- **The membrane rule holds.** Seeding writes the `seen` tier only. `has()`,
  `get()` and therefore `composer`'s `BLOCKS` still read `mined`, so Call 1
  carries exactly what the operator deployed and not one sentence more.
- **`not_minable` still means something.** `membrane.ts`'s denial is unchanged;
  an id the desk never showed is still refused.
- **H1's carry-over is unchanged.** `seedCarried` still absorbs and mines the
  deployed set, still throws when it cannot, and still runs last.
- **The first run is unaffected** — `shown` defaults to `[]`, and nothing has
  been shown before the first day.
- **No new adapter state.** `shown` is derived from the existing `seen` log at
  close; nothing is accumulated in a second place that could disagree with it.
- **`tests/driver/` naming.** No file is added there;
  `live-adapter-run-transition.test.ts` is already on `engine-boundaries.test.ts`'s
  `CLIENT_RUN_SUITES` allow-list.

## Verification

- `npm run check` · `npx vitest run` (expect **1610** — 1608 on `main` plus E4's
  two; report the count you actually get) · `npm run build`.
- Do **not** run playwright. The author runs the browser lanes — and note that a
  green browser suite proves nothing here (see Why).

## Done when

- [ ] `npm run check` clean, `npm run build` clean, full vitest green at 1610.
- [ ] `git diff --name-only HEAD` names exactly the four Scope files.
      `src/client/windows/reports.ts` appears nowhere — a parallel unit owns it.
- [ ] `npx vitest run tests/driver/engine-boundaries.test.ts` is green **with
      that file unmodified**.
- [ ] **Behavioural:** report what `blocks.has(id)` and `blocks.mine(id)` each
      answer for a seeded-but-unmined sentence, read out of `(i)`, not guessed.

---

# Amendment 1 — E3b's citation was off by one

E1–E3a as applied are correct and stay. Only the line number was wrong: `:93`
is the JSDoc closer `*/`, and `openRun`'s declaration is at **`:94`**. E3b now
cites `:94`; its stated current text and replacement text are unchanged.

The executor stopped exactly where it should have, and left the tree in the
inconsistent state that stop produced — E3a passes `close.shown` as a third
argument while `openRun` still takes two. **That is not a defect to work
around: apply E3b and the two halves meet.** Nothing else in the change list
moves, and E4 is still to do.

§5.3 already says every line number cites the stamped tree. What it does not
say, and what caught this author twice in one pair of PRDs, is the shape of the
miss: a citation landing on the closing line of a doc comment reads as correct
when skimmed, because the block above the target looks like the target. When a
change list cites a declaration, the line to verify is the one carrying the
declaration's own keyword.

---

# Amendment 2 — two `bindLiveRun` call sites the Scope never enumerated

E1–E4 as applied are correct and stay. `OpenRunDeps.shown` is a **required**
field, and `bindLiveRun` has two callers besides `openRun` that the Scope did
not name — both test fixtures, both failing `typecheck:test` and then throwing
`shown is not iterable` at runtime. The executor was right to leave them alone.

**`shown` stays required.** Making it optional would have made both errors
vanish, and that is the wrong trade: a caller that omits it silently gets an
empty history, which is exactly the bug this unit exists to fix, returning with
no compile error to announce it. A required field that costs two lines in two
fixtures is the cheaper of the two.

Add `tests/driver/live-desk.test.ts` and `tests/driver/shipped-pack.test.ts`
to Scope's "May modify". Both are on `engine-boundaries.test.ts`'s
`CLIENT_RUN_SUITES` allow-list already, so no naming guard is involved.

## A2a — `tests/driver/shipped-pack.test.ts:125`

Current text:

```
  return bindLiveRun(bindDeps, {
    run,
    carried: [],
    start: displayStamp(META.clock.start),
    end: displayStamp(META.clock.end),
    meta,
  })
```

Replacement text:

```
  return bindLiveRun(bindDeps, {
    run,
    carried: [],
    // A fixture opens one run and shows nothing before it.
    shown: [],
    start: displayStamp(META.clock.start),
    end: displayStamp(META.clock.end),
    meta,
  })
```

## A2b — `tests/driver/live-desk.test.ts:81`

Current text:

```
  return bindLiveRun(bindDeps, { run, carried: [], start: '08:50', end: '21:04', meta })
```

Replacement text:

```
  return bindLiveRun(bindDeps, { run, carried: [], shown: [], start: '08:50', end: '21:04', meta })
```

## A3 — corrected Verification and Done-when

The baseline moved under this PRD while it was being written: `main` was 1608
when the count was chosen and is **1613** now, having taken #199 and #200.

- `npx vitest run` — expect **1615** (1613 on `main` + E4's two).
- [ ] Full vitest green at **1615**.
- [ ] `git diff --name-only HEAD` names exactly the four original Scope files
      plus the two named above, and nothing else.

Every other Done-when line stands.

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

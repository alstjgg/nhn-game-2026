# g11-1 — W4: one DEPLOY — the day ends, you rebuild the file, one press commits it and opens tomorrow

> plan-playtest v13 · citations bind to `991a550` · branch `playtest/w4-one-deploy`
> commit message: `playtest(W4): one DEPLOY — the close unlocks the file, one press commits it and opens the next day`

## Outcome

민서's 08-08 playtest: *"The Agent File has the DEPLOY button at first. Then,
when the simulation finishes, it turns to NEW RUN. No need for two buttons."*

The desk already disables the control for a running day and already locks the
file behind it. What it does not do is give the operator the moment the loop is
built around: at 21:04 the file stays **locked** until NEW RUN is pressed, so
the day's report cannot be mined into the file it was written for. The player
must press NEW RUN, *then* build, *then* press DEPLOY — two presses, in the
wrong order, with the mining window on the wrong side of the boundary.

After this unit there is ONE button, always reading **DEPLOY**:

1. **Disabled while the day runs.** The file is locked; a sentence clicked in
   REPORTS is refused visibly (that is already how `reports.ts` behaves when
   `board.isLocked()`).
2. **Enabled when the day settles.** The file unlocks *at the close*, so the
   day's own report can be mined into it and the seats rearranged.
3. **Disabled the instant it is pressed** — the press commits the file
   (`deploy`) and opens the next day (`new_run`), in that order, because the
   committed set is exactly what the closing run hands forward as `carried`.

And the file the operator committed is the file the next day actually runs
with: both drivers now carry the deployed set into the new run as its seats
**and** as its deployed set. Today the live adapter clears both, so under a
one-press loop the composer would open every day with an empty agent file.

## Scope

May modify: `src/client/components/deploy-button.ts` ·
`src/client/windows/agent-file.ts` · `src/client/driver/run-loop.ts` ·
`src/client/driver/live/adapter.ts` ·
`tests/driver/run-loop-continuity.test.ts` ·
`tests/driver/live-adapter-run-transition.test.ts`.

Must NOT modify: `src/client/components/slot-board.ts` (it is the only module
allowed to mint a `slot`/`unslot`/`deploy` op literal —
`tests/windows/agent-file.test.ts:489-492` — and this unit keeps it that way:
the commit goes through `board.deploy()`) · `src/client/shell/run-state.ts`
(`tests/windows/tally.test.ts:286-292` forbids a phase mutator, and the phase
edges are pinned frame-by-frame at `:122`) ·
`src/client/windows/reports.ts` (the mining gate is already there and already
correct — it refuses on `board.isLocked()`) · **anything under `e2e/`** (see
the section below — the browser suites are the author's).

Known limits, deliberately out of scope: the press does not release the sim
clock. The desk boots paused (`shell/boot.ts:233` `driver.clock.setRate(0)`,
and `index.html:102` marks `data-rate="0"` as `is-on`), so ▶ remains a separate
control. Wiring DEPLOY to the clock needs a repaint path into `game-clock.ts`
that this unit does not open — it is a follow-up 민서 has been asked to rule on.

## Change list

**1. `src/client/components/deploy-button.ts`** — two edits, bottom-up.

1a. `:95-96` — current:
```
    mainLabel: mode === 'deploy' ? DEPLOY_MAIN : NEW_RUN_MAIN,
    subLine: mode === 'deploy' ? DEPLOY_SUB : `${NEW_RUN_SUB}${nextAt}${NEW_RUN_SUB_TAIL}`,
```
replace with:
```
    // W4 — ONE button. The main label never changes: every press of it is a
    // 배치, and the sub line is the only thing that says which day it commits
    // for. `mode` still drives `data-op`, because the op the press actually
    // sends does change — and the membrane census reads it (see the builder).
    mainLabel: DEPLOY_MAIN,
    subLine: mode === 'deploy' ? DEPLOY_SUB : `${NEW_RUN_SUB}${nextAt}${NEW_RUN_SUB_TAIL}`,
```

1b. `:32-35` — current:
```
/** NEW RUN, as the reference prints it — moved in verbatim from `tally.ts`. */
const NEW_RUN_MAIN = 'NEW RUN'
const NEW_RUN_SUB = '다음 시행 · '
const NEW_RUN_SUB_TAIL = '으로'
```
replace with:
```
/**
 * W4 — the second label is gone; only the sub line survives. `NEW RUN` was the
 * NAME of the second press, and there is no second press: the same 배치 both
 * commits the file and opens the day it was built for.
 */
const NEW_RUN_SUB = '다음 시행 · '
const NEW_RUN_SUB_TAIL = '으로'
```

**2. `src/client/windows/agent-file.ts`** — three edits, bottom-up.

2a. `:298-302` — current:
```
    if (event.type !== 'meta') return
    const changedRun = event.run !== run
    run = event.run
    // D10 — the seam carries no `new_run` event; a changed run IS the unlock.
    if (committedRun !== null && event.run !== committedRun) board.unlock()
```
replace with:
```
    if (event.type !== 'meta') return
    const changedRun = event.run !== run
    run = event.run
    // W4 — the unlock moved to the CLOSE (see the `'tally'` branch above): the
    // day's own report has to be minable into the file it was written for, and
    // that window is between 21:04 and the press. A new run therefore arrives
    // with the file already committed — it must stay locked, and only re-date
    // its stamp to the sitting it now serves.
    if (changedRun && board.isLocked()) {
      committedRun = event.run
      committedAt = opensAt
    }
```

2b. `:232-241` — current (the opening of the run-state subscription's
`'tally'` branch):
```
  store.subscribe((state: RunState) => {
    if (state.phase === 'tally' && !closed) {
      closed = true
      settled = false
      counted = false
      lapsed = false
      spent = false
      scoreSeen = false
      armHold()
```
replace with:
```
  store.subscribe((state: RunState) => {
    if (state.phase === 'tally' && !closed) {
      closed = true
      // W4 — the close is what hands the file back. Until now the file stayed
      // locked until NEW RUN, so the day's report could not be mined into the
      // day it was written for; the operator had to open tomorrow before
      // reading today. The file opens at 21:04 and the next press closes it.
      board.unlock()
      settled = false
      counted = false
      lapsed = false
      spent = false
      scoreSeen = false
      armHold()
```

2c. `:154-161` — current (the whole `buildDeployZone` callback):
```
  const zone = buildDeployZone(() => {
    if (currentView.mode === 'next') {
      sendNewRun()
      return
    }
    if (currentView.mode === 'deploy') board.deploy()
    // 'settling' / 'spent': the control is disabled — a click cannot land.
  })
```
replace with:
```
  const zone = buildDeployZone(() => {
    if (currentView.mode === 'next') {
      // W4 — ONE press, TWO ops, and the order is load-bearing. `deploy` must
      // reach the CLOSING run's membrane, because that is what the live
      // adapter harvests into `carried` (`live/adapter.ts` `closingState()`);
      // sent after `new_run` it would name the new day and the file the
      // operator just built would never carry. `board.deploy()` is also the
      // only module allowed to mint the op literal.
      board.deploy()
      sendNewRun()
      return
    }
    if (currentView.mode === 'deploy') board.deploy()
    // 'settling' / 'spent': the control is disabled — a click cannot land.
  })
```

**3. `src/client/driver/run-loop.ts:92-98`** — current (the `carry` function
and its doc comment):
```
  /** Replays the kept meta-state into the new day through the ops that made it. */
  function carry(kept: FixtureStore): void {
    for (const id of kept.mined) inner.send({ op: 'mine', sentence_id: id })
    for (const [slot, id] of Object.entries(kept.slots)) {
      inner.send({ op: 'slot', block_id: id, slot: Number(slot) })
    }
  }
```
replace with:
```
  /**
   * Replays the kept meta-state into the new day through the ops that made it.
   *
   * W4 — `deploy` now replays too. It used to be deliberately dropped ("a new
   * day has not been deployed yet"), which was right while DEPLOY was a press
   * the operator made INSIDE the new day. Under one-press the commit happens
   * before the day opens, so a day that did not carry its deployed set would
   * open with an agent file the composer cannot see.
   */
  function carry(kept: FixtureStore): void {
    for (const id of kept.mined) inner.send({ op: 'mine', sentence_id: id })
    for (const [slot, id] of Object.entries(kept.slots)) {
      inner.send({ op: 'slot', block_id: id, slot: Number(slot) })
    }
    if (kept.deployed.length > 0) inner.send({ op: 'deploy', blocks: [...kept.deployed] })
  }
```

**4. `src/client/driver/live/adapter.ts:279-284`** — current:
```
    // `slots` clears rather than carries because a new day has not been built
    // yet — which is what `SlotBoard.unlock()` assumes on the run change, and
    // why the fixture loop does not carry `deployed` either.
    mined = close.carried.map((block) => block.id)
    slots = new Map()
    deployed = []
```
replace with:
```
    // W4 — the day runs the file the operator committed. `close.carried` IS
    // that file (`closingState()` reads `deployed`), so it re-seats in its own
    // order and re-arms as the new run's deployed set. Clearing both was right
    // while the operator deployed INSIDE the new day; under one-press it would
    // hand the composer an empty file every single day.
    mined = close.carried.map((block) => block.id)
    slots = new Map(close.carried.map((block, seat) => [seat, block.id]))
    deployed = close.carried.map((block) => block.id).sort()
```

**5. `tests/driver/run-loop-continuity.test.ts:61-68`** — current (the whole
`(b)` block):
```
  it('(b) a deploy does NOT carry — the new day has not been deployed yet', () => {
    const driver = booted()
    const id = mintedIds(driver, 0)[0]!
    driver.send({ op: 'mine', sentence_id: id })
    driver.send({ op: 'deploy', blocks: [id] })
    expect(driver.store().deployed).toEqual([id])
    driver.send({ op: 'new_run' })
    expect(driver.store().deployed).toEqual([])
  })
```
replace with:
```
  // RE-AIMED (08-08, W4), never deleted. The claim was "a new day has not been
  // deployed yet", which was true while DEPLOY was a press the operator made
  // INSIDE the new day. One-press moves the commit to before the boundary: the
  // deployed set IS the file the next day runs with, so it carries — exactly
  // like the seats `(a)` already proves carry.
  it('(b) a deploy CARRIES — the committed file is the file the next day runs', () => {
    const driver = booted()
    const id = mintedIds(driver, 0)[0]!
    driver.send({ op: 'mine', sentence_id: id })
    driver.send({ op: 'slot', block_id: id, slot: 0 })
    driver.send({ op: 'deploy', blocks: [id] })
    expect(driver.store().deployed).toEqual([id])
    driver.send({ op: 'new_run' })
    expect(driver.store().deployed, 'the committed file did not carry').toEqual([id])
    expect(driver.store().slots, 'the seats did not carry').toEqual({ 0: id })
  })
```

**6. `tests/driver/live-adapter-run-transition.test.ts:143-146`** — current:
```
    // The deck is the carry-over and nothing else; the board is empty because a
    // new day has not been built yet (`SlotBoard.unlock()` assumes exactly this).
    // A slot surviving here drew a card the deck no longer listed.
    expect(adapter.store()).toEqual({ mined: [B1.id], slots: {}, deployed: [] })
```
replace with:
```
    // RE-AIMED (08-08, W4). The deck is still the carry-over and nothing else —
    // but the carry-over IS the file the operator committed, so it also seats
    // and re-arms. An empty board here would hand the composer an empty agent
    // file on every day after the first.
    expect(adapter.store()).toEqual({ mined: [B1.id], slots: { 0: B1.id }, deployed: [B1.id] })
```

## e2e is the author's, not this unit's

**Do not edit anything under `e2e/`,** and do not run playwright. Several
oracles there encode the two-press loop (the control enabled and the file
unlocked immediately after the press) and will go red on purpose; re-aiming
them belongs to the author, who runs the browser suites on the merge preview.
Report `npm run check` / `npx vitest run` / `npm run build` and stop.

## Invariants

- **`data-op` keeps flipping.** `deploy-button.ts:135` is untouched: the
  control still reads `new_run` in `next`/`spent` and `deploy` otherwise. That
  is what keeps `e2e/a11y.spec.ts:372`'s five-op membrane census green and what
  `harness.newRun()` (`e2e/fixtures/harness.ts:225-232`), `fileAnotherRun`
  (`e2e/reports.spec.ts:122-130`) and `takeNextRun` (`e2e/red-thread.spec.ts`)
  wait on. **Any change that stops the flip is out of scope and will red four
  suites.**
- **One `new_run` send site, disabled first.** `tests/windows/tally.test.ts:272-282`
  greps `agent-file.ts` for exactly one `send({op:'new_run'` and requires the
  FIRST `disabled = true` in the file to precede it. `sendNewRun` is untouched,
  and nothing this unit adds may introduce an earlier-or-later `disabled = true`
  that breaks that ordering.
- **`slot-board.ts` stays the only op minter** — the commit is `board.deploy()`,
  never a literal in the window (`tests/windows/agent-file.test.ts:489-492`).
- **Run-state is not touched.** No new phase, no mutator, no phase-edge change
  (`tests/windows/tally.test.ts:122`, `:286-292`, `:296-300`).
- **Mining needs no gate.** `windows/reports.ts` already refuses and flashes
  when `board.isLocked()`; locking the board for a running day IS the mining
  gate 민서 asked for.
- **The stamp still matches `/^ECHO-\d+ · \d{2}:\d{2}$/`** (`e2e/agent-file.spec.ts:276`).

## Verification

1. `npm run check` — green. 2. `npx vitest run` — green. 3. `npm run build` —
green. Do NOT run playwright (the author runs it on the merge preview).

## Done when

- [ ] All three commands exit 0.
- [ ] `grep -c "NEW_RUN_MAIN" src/client/components/deploy-button.ts` prints 0.
- [ ] `grep -c "send({ op: 'new_run'" src/client/windows/agent-file.ts` prints 1.
- [ ] `npx vitest run tests/driver/ tests/windows/agent-file.test.ts tests/windows/tally.test.ts`
      — all passing.
- [ ] Exactly one code commit on `playtest/w4-one-deploy`, on top of the PRD
      commit already there. Nothing pushed, no PR opened.

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

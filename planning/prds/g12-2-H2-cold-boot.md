# g12-2 — H2: a page load starts a new sitting

> plan-playtest v13 · citations bind to `f9bae7e` · branch `playtest/h2-cold-boot`
> commit message: `playtest(H2): a page load is a new sitting — the run slots clear at boot`

## Outcome

Refreshing the page starts the game over. The desk opens as ECHO-1 with an empty
archive rail, every time. Today a refresh comes back as ECHO-n with n rail tabs
and **nothing readable in any of them**, because the resume restores the
sitting's identity — callsign, run counter, archive list — and cannot restore its
content: the filed report documents live in `windows/reports.ts` and are
persisted nowhere. The mute setting still survives a reload; only the run slots
go.

## Design (author-resolved — do not re-derive)

Three `sessionStorage` slots hold run state, written by two independent layers:

- `ndsp:meta:v1` (`src/client/shell/run-state.ts:78`) — the last `meta` event.
- `dday.meta.<slug>` and `dday.meta.stamp.<slug>`
  (`src/runloop/store.ts:25-35`) — the runloop's `MetaState` and W1's build stamp.

Both are cleared **at boot, before anything reads them**, rather than by changing
how either layer restores. That keeps `createRunState`'s restore path and W1's
stamp mechanism exactly as they are (so `tests/windows/tally.test.ts`'s
persistence block stays green), and puts the whole policy in one place.

`restoredRun()` is **kept and left exported**, with its doc comment amended to
record that it is retired. Nothing calls it. It is not deleted because
`src/client/driver/live/index.ts:108` still cites it by name in the prose that
explains the live path's own resume, and a rewrite of that block is not this
unit's work.

`dday.audio.muted` (`src/client/audio/index.ts:35`) is **not** cleared.

## Scope

May modify, only these files:

- `src/client/shell/run-state.ts`
- `src/client/shell/boot.ts`
- `src/client/driver/live/index.ts`
- `src/runloop/store.ts`
- `docs/spec-client.md`
- `e2e/acceptance.spec.ts`

Must NOT modify:

- `src/client/audio/index.ts` — the mute key survives a restart deliberately.
- `src/runloop/meta-state.ts` and `data/runs/_schema/meta-state.schema.json` —
  the persisted shape does not change; only whether it is read.
- `tests/windows/tally.test.ts` — `createRunState` still restores from whatever
  is in storage. That block must stay green **untouched**; if it goes red, the
  clear landed in the wrong place. Stop and report.
- `src/client/windows/reports.ts` — persisting report documents is the road not
  taken here.

Test files this unit turns red:

- `e2e/acceptance.spec.ts` `#8` — amended in E7, not relaxed. Its `(a)` and `(c)`
  assertions survive unchanged; only `(b)` inverts.
- `e2e/run-loop.spec.ts:533` and `e2e/acceptance.spec.ts` reload sites elsewhere
  are **author-verified**, not yours — you do not run playwright.

The `RE-AIMED` guard (`tests/acceptance/discovery-and-frozen-guard.test.ts` `(l)`)
walks `tests/**/*.test.ts` only, so the `RE-AIMED` comment E7 adds to an `e2e/`
spec needs no `DISCOVERY.md` entry. Do not edit `DISCOVERY.md`.

## Change list

Same-file edits are listed **bottom-up**; apply in the order given.

### E1 — `src/runloop/store.ts:33-35`

Current text:

```
/** The stamp slot beside the state — see `createWebStorageMetaStore`. */
export function stampKey(packSlug: string): string {
  return `${META_KEY_PREFIX}stamp.${packSlug}`
}
```

Replacement text:

```
/** The stamp slot beside the state — see `createWebStorageMetaStore`. */
export function stampKey(packSlug: string): string {
  return `${META_KEY_PREFIX}stamp.${packSlug}`
}

/**
 * H2 — a page load is a new sitting, so both slots go together.
 *
 * The stamp without its state is a claim about nothing, and the state without
 * its stamp reads as another build's and would be dropped on the next load
 * anyway. Clearing is the caller's decision, not the store's: the store still
 * restores faithfully for anyone who wants a resume (the headless path does).
 */
export function clearWebStorageMetaStore(storage: StorageLike, packSlug: string): void {
  storage.removeItem(metaKey(packSlug))
  storage.removeItem(stampKey(packSlug))
}
```

### E2 — `src/client/shell/run-state.ts:181-193`

Current text:

```
/**
 * The run a refresh should re-open on, or `null` for a cold desk.
 *
 * The restore used to lose a race it could not see: `createRunState` rebuilt
 * the state from the slot inside `tally.mount()`, and the driver — always
 * opened at `runs[0]` — then emitted the pack's opening `meta` in the same boot
 * tick and overwrote it (R3 on run-state.ts:151). The persisted run is now read
 * BEFORE the driver is built, so the loop opens on the day the operator left.
 */
export function restoredRun(options: RunStateOptions = {}): number | null {
  const event = restored(options.storage ?? defaultStorage())
  return event !== null && event.type === 'meta' ? event.run : null
}
```

Replacement text:

```
/**
 * The run a refresh should re-open on, or `null` for a cold desk.
 *
 * RETIRED (H2, 08-08) — nothing calls this. Kept because `driver/live/index.ts`
 * still cites it by name as the shape the live path's own resume was modelled
 * on. See `clearRunState()` below for what replaced it and why.
 *
 * The restore used to lose a race it could not see: `createRunState` rebuilt
 * the state from the slot inside `tally.mount()`, and the driver — always
 * opened at `runs[0]` — then emitted the pack's opening `meta` in the same boot
 * tick and overwrote it (R3 on run-state.ts:151). The persisted run is now read
 * BEFORE the driver is built, so the loop opens on the day the operator left.
 */
export function restoredRun(options: RunStateOptions = {}): number | null {
  const event = restored(options.storage ?? defaultStorage())
  return event !== null && event.type === 'meta' ? event.run : null
}

/**
 * H2 — a page load starts a new sitting: this module's slot is dropped before
 * anything reads it.
 *
 * The resume this replaces restored the sitting's IDENTITY — callsign, run
 * counter, archive — from the last `meta` event, and could not restore its
 * CONTENT: the filed report documents live in `windows/reports.ts` and are
 * persisted nowhere. A refresh therefore came back as ECHO-n with n rail tabs
 * and nothing readable in any of them. Restoring them properly means persisting
 * every sitting's whole text; dropping the resume means a judge who refreshes
 * gets the game from the top. The second is the desk we want, and it is the
 * amendment to spec-client §7 #8 that ships with this unit.
 *
 * The audio mute key is deliberately NOT cleared — a restart is not an unmute.
 */
export function clearRunState(options: RunStateOptions = {}): void {
  const storage = options.storage ?? defaultStorage()
  if (!storage) return
  try {
    storage.removeItem(META_KEY)
  } catch {
    // Same contract as `restored()`: a private-mode Storage throws on write,
    // and a desk that cannot clear its slot still has to open.
  }
}
```

### E3 — `src/client/driver/live/index.ts:80`

Current text:

```
  const runLoop: RunLoop = createRunLoop({
```

Replacement text:

```
  // H2 — a page load is a new sitting. Cleared here rather than inside the
  // store, because the store is also the headless path's and that one resumes.
  clearWebStorageMetaStore(deps.storage, deps.slug)

  const runLoop: RunLoop = createRunLoop({
```

### E4 — `src/client/driver/live/index.ts:14`

Current text:

```
import { createWebStorageMetaStore } from '../../../runloop/index.ts'
```

Replacement text:

```
import { clearWebStorageMetaStore, createWebStorageMetaStore } from '../../../runloop/index.ts'
```

### E5 — `src/client/shell/boot.ts:179`

Current text:

```
  // 4 — the five windows and the taskbar, then the computed desk arrangement.
```

Replacement text:

```
  // 4 — the three windows and the taskbar, then the computed desk arrangement.
```

### E6 — `src/client/shell/boot.ts:158-160`

Current text:

```
      ? createRunLoopDriver(fixtures, { openAt: restoredRun() })
      : ((await openLiveDesk(identity)) ??
        createRunLoopDriver([placeholderBootRun(identity)], { openAt: restoredRun() }))
```

Replacement text:

```
      ? createRunLoopDriver(fixtures)
      : ((await openLiveDesk(identity)) ??
        createRunLoopDriver([placeholderBootRun(identity)]))
```

### E7 — `src/client/shell/boot.ts:155`

Current text:

```
  const fixtures = await demoRunLoop({ withoutReports: lapseDrill() })
```

Replacement text:

```
  // H2 — a page load is a new sitting. Before the driver is built, because
  // `createRunState` reads this module's slot the moment it is constructed and
  // the live path reads the runloop's inside `createLiveRunDriver`.
  clearRunState()
  const fixtures = await demoRunLoop({ withoutReports: lapseDrill() })
```

### E8 — `src/client/shell/boot.ts:24`

Current text:

```
import { restoredRun } from './run-state.ts'
```

Replacement text:

```
import { clearRunState } from './run-state.ts'
```

### E9 — `src/client/shell/boot.ts:2`

Current text:

```
// fetch the pack → build the chrome and the five windows → applyLayout →
```

Replacement text:

```
// fetch the pack → build the chrome and the three windows → applyLayout →
```

### E10 — `docs/spec-client.md:337-338`

Current text:

```
8. Refresh mid-run: the multi-run meta-state (counter, archive, carried
   blocks) survives via `sessionStorage`; closing the tab starts clean
```

Replacement text:

```
8. Refresh mid-run: a page load starts a NEW sitting — the run slots in
   `sessionStorage` are cleared at boot (H2, 08-08), because a resume that
   restores the archive rail's identities but not the report documents behind
   them hands back a desk of empty tabs. Closing the tab starts clean
```

### E11 — `docs/spec-client.md:394-396`

Current text:

```
- **Persistence** — `sessionStorage` for meta-state: survives refresh (the
  multi-run loop isn't destroyed by F5), dies with the tab (every judge
  starts clean — `localStorage` would break the run-3 demo staging). 윤석
```

Replacement text:

```
- **Persistence** — `sessionStorage` for meta-state, written but no longer read
  back on load: **F5 starts a new sitting** (H2, 08-08 — the resume could not
  restore the filed reports, so it returned an archive of empty tabs), and the
  slot dies with the tab either way (`localStorage` would break the run-3 demo
  staging). 윤석
```

### E12 — `docs/spec-client.md:269`

Current text:

```
| run counter · carried blocks · report archive | run-loop manager (meta-state, `sessionStorage` — §9) | display + membrane ops against it; arrives as `meta` events |
```

Replacement text:

```
| run counter · carried blocks · report archive | run-loop manager (meta-state, `sessionStorage` — §9; written through, cleared at boot per §7 #8) | display + membrane ops against it; arrives as `meta` events |
```

### E13 — `e2e/acceptance.spec.ts:301`

Current text:

```
  test('#8 meta-state survives F5 and dies with the tab', async ({ page, browser }) => {
```

Replacement text:

```
  test('#8 a page load starts a new sitting, and nothing crosses a tab', async ({ page, browser }) => {
```

### E14 — `e2e/acceptance.spec.ts:326-333`

Current text:

```
    // (b) F5 — the counter, archive and carried blocks come back.
    await page.reload()
    await page.waitForFunction(() => Boolean((window as { __agentFile?: unknown }).__agentFile))
    const after = await meta(page)
    expect(after.run).toBe(before.run)
    expect(after.runs_left).toBe(before.runs_left)
    expect(after.carried).toEqual(before.carried)
    expect(after.archive.map((a) => a.run)).toEqual(before.archive.map((a) => a.run))
```

Replacement text:

```
    // (b) RE-AIMED (08-08, H2) and inverted on purpose: F5 is a RESTART.
    // The resume restored the sitting's identities — callsign, counter, archive
    // — and could not restore the filed report documents, which live in
    // `windows/reports.ts` and are persisted nowhere: the desk came back as
    // ECHO-n with n rail tabs and nothing readable in any of them. The state is
    // still WRITTEN, which is what (a) above proves; it is no longer read back.
    await page.reload()
    await page.waitForFunction(() => Boolean((window as { __agentFile?: unknown }).__agentFile))
    const after = await meta(page)
    expect(after.run, 'F5 resumed the played-out run instead of starting a new sitting').toBe(
      opening.run,
    )
    expect(after.runs_left).toBe(opening.runs_left)
    expect(after.carried).toEqual(opening.carried)
    expect(after.archive.map((a) => a.run)).toEqual(opening.archive.map((a) => a.run))
```

## Invariants

- **`localStorage` stays forbidden** (C4). This unit adds no storage; it removes
  reads.
- **The mute key is not run state.** `dday.audio.muted` must still survive a
  reload — `e2e/shell.spec.ts` and the audio lane depend on it.
- **The clear runs before any read.** `createRunState` reads its slot in its
  constructor and `createLiveRunDriver` reads the runloop's inside itself, which
  is why E7 sits above the driver construction and E3 sits above `createRunLoop`.
- **`tests/windows/tally.test.ts` must stay green untouched.** It exercises
  `createRunState`'s restore directly with an injected storage; the restore path
  is unchanged by design.
- **Two composition roots** stay in step: `src/client/driver/live/bind.ts` and
  `tools/driver/run/bind.mjs`. The headless root must keep resuming — that is
  why E1 puts the clear in a caller-invoked function and not in the store.

## Verification

- `npm run check` — passes.
- `npx vitest run` — the full suite passes, **including
  `tests/windows/tally.test.ts` and `tests/runloop/store.test.ts` unchanged**.
  Report the count.
- `npm run build` — passes.
- Do **not** run playwright. The author runs the browser lanes.

## Done when

- [ ] `git diff --name-only` names exactly six files, and `DISCOVERY.md` is not
      one of them.
- [ ] `grep -rn "restoredRun()" src/` returns nothing (the definition survives;
      no call site does).
- [ ] `grep -n "clearRunState" src/client/shell/boot.ts` shows the import and one
      call, and the call precedes the line building the driver.
- [ ] `npx vitest run tests/windows/tally.test.ts tests/runloop/store.test.ts`
      is green with neither file modified.
- [ ] Full vitest run is green.
- [ ] **Behavioural:** run `npm run build`, then in a node one-liner or a scratch
      vitest, construct a fake `Storage` holding a `ndsp:meta:v1` value, call
      `clearRunState({ storage })`, and show `getItem('ndsp:meta:v1')` is now
      `null` while a second unrelated key set on the same fake storage is
      untouched. Paste the output in your report. Delete any scratch file before
      committing.

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

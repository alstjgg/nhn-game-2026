# U1 — the feed reveals the day line by line; a burst becomes a rhythm

> plan-playtest.md **v7** · change list stamped against tree `14dd971` (2026-08-07),
> **before group 1 merged** — `g1-5` touches `run-feed.ts` (RADIO_TAIL region) and
> `live-feed.test.ts`, so this list is re-stamped after group 1 lands. Shapes hold;
> line numbers move.
> Executor: Sonnet-class session. Branch `playtest/g2-1-u1` off current `main`.
> One commit, message: `playtest(U1): reveal queue paces the feed downstream of fanout`.
> Open a PR; merge nothing (§5.6). Confirm `git config user.email` resolves to the
> `alstjgg` account first (hard rule 1).

## Outcome

When several feed events are due in the same minute, the LIVE FEED reveals them
one at a time — about 0.4 s apart, quickening when many are queued — instead of
landing them in one paint. Pausing the desk pauses the reveal; the day's end, a
seek, a drain, reduced motion, and frozen animations all land instantly and
whole. Time passes instead of stuttering.

## Design (author-resolved; the executor implements exactly this)

The queue lives in `createRunFeed` (`src/client/components/run-feed.ts`),
**downstream of the adapter's fanout** — never in the adapter, whose `kick()`
(`adapter.ts:194-196`) halts the engine while its own queue is non-empty.

- The DOM-applying switch (today's `receive`) is renamed `apply`, unchanged inside.
- A new `receive` enqueues every subscribed event; the prefill loop keeps calling
  `apply` directly (mount catch-up stays instant, per the note at `:277-278`).
- The pacing tick rides the driver's animation pump (`registerAnimation`) — the
  same channel as report-view's typewriter — so it ticks only while the driver's
  clock runs or has ended, which is the point: **pause stops the reveal dead**
  ([u5#c6]'s philosophy, kept).
- Instant-bypass rules, all load-bearing:
  - `motionless()` (frozen animations or `prefers-reduced-motion`) → flush,
  - `!driver.clock.running` at enqueue time → flush (covers the paused desk at
    boot, every rate-0 e2e state, and the ended clock),
  - a `run_end` event → flush (a fixture `drain()` emits it last, so a drained
    run lands whole; the 21:04 terminal lands ON time),
  - `__feed.seek()` → explicit `flush()` after the driver settles (a seek lifts
    the rate to 1 mid-call, so events can enqueue paced and then strand when the
    rate drops back — the explicit flush is what makes every seek-then-assert
    e2e pattern land synchronously, as they all assume).

One structure test is amended: `[u5#c6] (c)` bans `registerAnimation` outright in
the u5 files. The reveal queue is a deliberate contract change to that unit, so
the guard becomes a counted allowance for `run-feed.ts` (mirroring how (b)
already allows it exactly one `requestAnimationFrame`).

## Scope

May modify (only these three files):

- `src/client/components/run-feed.ts`
- `src/client/windows/live-feed.ts`
- `tests/windows/live-feed.test.ts`

Must NOT modify:

- `src/client/driver/live/adapter.ts` — the §5.4 trap: anything held in its
  queue stalls the engine's next `step()`.
- `src/client/shell/announcer.ts` — the toast speaks on the raw stream and may
  now run a beat or two ahead of the paper; that desync is accepted (the feed is
  deliberately not routed through the announcer, per its own header).
- `waiting-marker.ts`, `fallback-notice.ts` — untouched; their events simply
  ride the queue in order.
- Engine data: event timestamps are never edited for pacing.

Tests turning red, and their disposition: `tests/windows/live-feed.test.ts`
`[u5#c6] (c)` — **amended** (E7). Every other u5 guard stays satisfied: no
`setTimeout`, rAF count in `run-feed.ts` stays 1, no new Hangul literal, no
listener, no transform, `.subscribe(`/`.frame(` still present. The e2e suite is
expected green **unchanged** — the bypass rules exist for exactly that — and the
full `npm run test:e2e` run is part of verification because this unit's blast
radius is every spec that reads the feed.

## Change list

All edits in `src/client/components/run-feed.ts` first (bottom-up), then
`live-feed.ts`, then the test.

**E1 — `run-feed.ts:281`**
current:
```ts
  driver.subscribe(receive)
```
replace with:
```ts
  driver.subscribe(receive)
```
(no text change — listed so the executor confirms the subscribe stays on
`receive`, which E4 redefines as the queuing wrapper.)

**E2 — `run-feed.ts:279`**
current:
```ts
  for (const event of driver.frame().events) receive(event)
```
replace with:
```ts
  for (const event of driver.frame().events) apply(event)
```

**E3 — `run-feed.ts:242`**
current:
```ts
  const receive = (event: ViewEvent): void => {
```
replace with:
```ts
  const apply = (event: ViewEvent): void => {
```

**E4 — insert after the `apply` function's closing brace (currently `:275`,
directly above the prefill comment at `:277`)** — new code, verbatim:
```ts
  // U1 — the reveal queue (plan-playtest §1). Downstream of fanout on purpose:
  // pacing here can starve nothing, while the adapter's own queue gates step().
  // Paced only while the sim clock runs; a paused desk, frozen animations,
  // reduced motion, a seek and the day's end all land whole.
  const queue: ViewEvent[] = []
  let sinceReveal = 0

  const motionless = (): boolean => {
    if (animationsFrozen()) return true
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }

  const flush = (): void => {
    while (queue.length > 0) apply(queue.shift()!)
    sinceReveal = 0
  }

  registerAnimation('feed/reveal', (realMs: number) => {
    if (queue.length === 0) return
    if (motionless() || !driver.clock.running) {
      flush()
      return
    }
    sinceReveal += realMs
    if (sinceReveal < revealDelay(queue.length)) return
    sinceReveal = 0
    apply(queue.shift()!)
  })

  const receive = (event: ViewEvent): void => {
    queue.push(event)
    if (event.type === 'run_end' || motionless() || !driver.clock.running) flush()
  }
```

**E5 — insert above `/* ── the window's fanfold ─…` (currently `:117`)** — the
pacing constants, with the other module constants:
```ts
/**
 * Reveal pacing (U1) — real ms between queued lines. A crowded queue quickens:
 * quiet stretches breathe, event crowds still read as a crowd. Feel values,
 * tuned at the group-2 game check.
 */
const REVEAL_MS = 420
const REVEAL_CROWD_MS = 140
const REVEAL_CROWD_AT = 5

const revealDelay = (depth: number): number =>
  depth >= REVEAL_CROWD_AT ? REVEAL_CROWD_MS : REVEAL_MS
```

**E6a — `run-feed.ts:22`**
current:
```ts
import { displayStamp } from '../driver/index.ts'
```
replace with:
```ts
import { animationsFrozen, displayStamp, registerAnimation } from '../driver/index.ts'
```

**E6b — `run-feed.ts:127-131`** (the `RunFeed` interface)
current:
```ts
export interface RunFeed {
  count(): number
  kinds(): string[]
  stamps(): string[]
}
```
replace with:
```ts
export interface RunFeed {
  count(): number
  kinds(): string[]
  stamps(): string[]
  /** Applies everything still queued — the reveal never outlives a seek (U1). */
  flush(): void
}
```

**E6c — `run-feed.ts:292-296`** (the return block)
current:
```ts
  return {
    count: () => lines().length,
    kinds: () => lines().map((li) => (/\bfl-([a-z]+)\b/.exec(li.className) ?? [, ''])[1] ?? ''),
    stamps: () => lines().map((li) => li.querySelector('.fl-t')?.textContent ?? ''),
  }
```
replace with:
```ts
  return {
    count: () => lines().length,
    kinds: () => lines().map((li) => (/\bfl-([a-z]+)\b/.exec(li.className) ?? [, ''])[1] ?? ''),
    stamps: () => lines().map((li) => li.querySelector('.fl-t')?.textContent ?? ''),
    flush,
  }
```

**E6d — `src/client/windows/live-feed.ts:84`** (inside the `__feed` handle)
current:
```ts
      seek: (at: string) => seek(driver, at),
```
replace with:
```ts
      seek: (at: string) => {
        seek(driver, at)
        feed.flush()
      },
```

**E7 — `tests/windows/live-feed.test.ts:344-351`**
current:
```ts
  it('(c) the window registers no animation hook and owns no clock', () => {
    for (const file of SOURCES) {
      const source = code(file)
      expect(source).not.toMatch(/registerAnimation/)
      expect(source).not.toMatch(/new\s+Date\(|performance\.now\(/)
      expect(source).not.toMatch(/createClock\(/)
    }
  })
```
replace with:
```ts
  it('(c) one reveal pump in run-feed (U1) — otherwise no animation hook, no clock', () => {
    for (const file of SOURCES) {
      const source = code(file)
      const hooks = (source.match(/registerAnimation/g) ?? []).length
      const allowed = file.endsWith('run-feed.ts') ? 2 : 0
      expect(`${file}: ${hooks} registerAnimation (max ${allowed})`).toBe(
        `${file}: ${Math.min(hooks, allowed)} registerAnimation (max ${allowed})`,
      )
      expect(source).not.toMatch(/new\s+Date\(|performance\.now\(/)
      expect(source).not.toMatch(/createClock\(/)
    }
  })
```
(2 = the import token plus the one call site; a second call would trip it.)

## Invariants

- **Timestamps are engine data** — the queue delays DOM appends only; no
  `line.clock` is read for pacing decisions or rewritten.
- **No timer of this window's own**: no `setTimeout`/`setInterval`, no second
  `requestAnimationFrame`, no wall-clock read — the pump's `realMs` is the only
  time source, exactly like the typewriter.
- **Order is sacred**: everything flows through one queue in arrival order —
  wait markers, fallback notices, beat bookkeeping included.
- The membrane and invariant 6 are untouched surfaces here; add no text.

## Verification

Run in this order, from the repo root, after committing:

1. `npm run test` — expected: all green, including the amended `[u5#c6] (c)`.
2. `npm run build` — expected: green.
3. `npm run test:e2e` — the **full** suite, expected green unchanged. If any spec
   goes red, stop and report per §5.7 — do not patch specs to pass.
4. Behavioral (DEV): `npm run dev`, press ▶ at ×1 — at a crowded minute the lines
   appear one at a time; press ⏸ mid-burst — the reveal freezes; resume — it
   continues; run the day out (×4 helps) — 21:04 lands and the run completes.

## Done when

- [ ] All edits applied; `git diff HEAD~1 --stat` shows exactly the three listed files.
- [ ] Steps 1–3 green, in order.
- [ ] A same-minute burst visibly reveals line-by-line at ×1, and pause freezes it (check 4).
- [ ] A full DEV day reaches 21:04 and the terminal lines land whole (this is the run-halts guard — §5.7 shape 3).
- [ ] `__feed.seek('21:04')` in the DEV console lands the whole day instantly.
- [ ] PR opened from `playtest/g2-1-u1`; nothing merged.

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

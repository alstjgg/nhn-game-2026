// The BUILD hold — spec-client §5.1's `BUILD → (deploy) RUN`, on the seam.
//
// THE DEFECT. The shell opens the desk with `start()` + `advance(0)`
// (`shell/boot.ts` step 5) so the run's `meta` — the counter, the pips, the
// callsign the fanfold's header prints — is on the chrome the moment the page
// boots. That release also let out everything else stamped at the opening
// minute, and on the demo run that is the case's first script event and 서지형's
// first line. So the LIVE FEED printed the day's opening while the AGENT FILE
// was still empty and ECHO-1 had not gone in — the operator watched the run
// begin before they were given anything to begin it with.
//
// On the LIVE path it cost more than a line. `kick()` steps the next beat as
// soon as nothing is pending and the clock has caught up to the frontier, which
// at boot is both — so Call 1 went to the model with `membrane.deployed()`
// empty: the first gate of every day was judged with no agent file at all, and
// the file the operator then committed only ever reached the beats after it.
//
// Both halves are held at the same place and by the same rule, once per driver
// shape: nothing STAMPED is released and no beat is stepped until a `deploy` op
// arrives. `meta` still goes out at boot — it describes the day rather than
// happening inside it — and `drain()` keeps its override, being the DEV/TEST
// hook no player build hands out.
//
// vitest runs `environment: 'node'`: everything below is driver-level. The
// desk-level half — an empty fanfold that fills on the press — rides
// `e2e/live-feed.spec.ts`.
import { describe, it, expect } from 'vitest'
import { createRunLoopDriver } from '../../src/client/driver/run-loop.ts'
import { createLiveAdapter } from '../../src/client/driver/live/adapter.ts'
import type { BoundRun } from '../../src/client/driver/live/adapter.ts'
import type { FixtureDriver } from '../../src/client/driver/fixture-driver.ts'
import type { FixtureRun } from '../../src/client/driver/fixtures/types.ts'
import type { MembraneOp, ViewEvent } from '../../src/shared/view-driver.ts'

/** A day with a `meta` and two stamped lines at its opening minute. */
function syntheticRun(run: number): FixtureRun {
  const events: ViewEvent[] = [
    { type: 'meta', run, runs_left: 9 - run, carried: [], archive: [] },
    { type: 'beat_start', beat: 1, clock: '08:50' },
    { type: 'feed', line: { kind: 'event', clock: '08:50', text: 'E1' } },
    { type: 'feed', line: { kind: 'npc', clock: '08:50', text: 'Q1', speaker: 'SP' } },
    { type: 'beat_end', beat: 1, clock: '08:50' },
    { type: 'run_end', run },
  ]
  return {
    id: `synthetic-${run}`,
    start: '08:50',
    end: '21:04',
    events,
    responses: {
      slot: { ok: true },
      unslot: { ok: true },
      mine: { ok: true },
      deploy: { ok: true },
      new_run: { ok: true },
    },
  }
}

/** The shell's own opening move (`shell/boot.ts` step 5), verbatim. */
function openDesk(driver: FixtureDriver): ViewEvent[] {
  const seen: ViewEvent[] = []
  driver.subscribe((event) => seen.push(event))
  driver.start()
  driver.advance(0)
  driver.clock.setRate(0)
  return seen
}

const DEPLOY: MembraneOp = { op: 'deploy', blocks: [] }

describe('the BUILD hold — the fixture loop', () => {
  it('(a) the desk opens on `meta` alone: no beat, no line, before the press', () => {
    const seen = openDesk(createRunLoopDriver([syntheticRun(1)]))
    expect(seen.map((event) => event.type)).toEqual(['meta'])
  })

  it('(b) the press releases the day the desk was holding, in stream order', () => {
    const driver = createRunLoopDriver([syntheticRun(1)])
    const seen = openDesk(driver)
    expect(driver.send(DEPLOY).ok).toBe(true)
    // Every one of them, in the order the run authored — the hold is a queue,
    // not a filter. `run_end` is here because this day is one beat long and an
    // unstamped event rides the stamp before it: the release is still "what is
    // DUE at the opening minute", which on a longer day stops at the first
    // stamp the clock has not reached.
    expect(seen.map((event) => event.type)).toEqual([
      'meta',
      'beat_start',
      'feed',
      'feed',
      'beat_end',
      'run_end',
    ])
  })

  it('(c) a held event is not one the desk has SEEN — `frame()` says so too', () => {
    const driver = createRunLoopDriver([syntheticRun(1)])
    openDesk(driver)
    expect(driver.frame().events.map((event) => event.type)).toEqual(['meta'])
    driver.send(DEPLOY)
    expect(driver.frame().events.filter((event) => event.type === 'feed')).toHaveLength(2)
  })

  it('(d) `drain()` overrides the hold, exactly as it overrides the clock', () => {
    const driver = createRunLoopDriver([syntheticRun(1)])
    const seen = openDesk(driver)
    driver.drain()
    expect(seen.map((event) => event.type)).toEqual([
      'meta',
      'beat_start',
      'feed',
      'feed',
      'beat_end',
      'run_end',
    ])
  })

  it('(e) the day after `new_run` opens armed — one press committed them both', () => {
    const driver = createRunLoopDriver([syntheticRun(1), syntheticRun(2)])
    const seen = openDesk(driver)
    driver.send(DEPLOY)
    driver.drain()
    const before = seen.length
    // W4 — the press that opens the next day commits its file on the way out,
    // so the day that arrives is already the file the operator sent. A day that
    // re-held here would sit blank behind a control the operator has no second
    // press for.
    expect(driver.send({ op: 'new_run' }).ok).toBe(true)
    const opened = seen.slice(before).map((event) => event.type)
    expect(opened).toContain('meta')
    expect(opened, 'the second day opened held — nothing would ever release it').toContain('feed')
  })
})

/* ── the live path ───────────────────────────────────────────────────────── */

/**
 * A `LiveDriver` stub that counts its steps and emits one stamped line a beat.
 *
 * The engine is not what is under test here — WHEN it is asked to think is. A
 * step that runs before the press is Call 1 with an empty file behind it, and
 * the count is the only place that shows.
 */
function stubRun(run: number): BoundRun & { steps: () => number } {
  let steps = 0
  let listener: ((event: ViewEvent) => void) | null = null
  const driver = {
    subscribe(fn: (event: ViewEvent) => void) {
      listener = fn
      return () => {
        listener = null
      }
    },
    async step(): Promise<boolean> {
      steps += 1
      listener?.({ type: 'feed', line: { kind: 'event', clock: '08:50', text: `E${steps}` } })
      return steps < 2
    },
    submit: () => ({ ok: true }),
    blocks: () => ({ get: () => undefined }),
  }
  return {
    driver: driver as unknown as BoundRun['driver'],
    start: '08:50',
    end: '21:04',
    meta: { type: 'meta', run, runs_left: 9 - run, carried: [], archive: [] },
    steps: () => steps,
  }
}

/** Lets the adapter's own promise chain settle — `step()` is async. */
const settle = async (): Promise<void> => {
  for (let i = 0; i < 8; i += 1) await Promise.resolve()
}

describe('the BUILD hold — the live adapter', () => {
  it('(f) an unopened day steps NO beat: Call 1 never runs on an empty file', async () => {
    const first = stubRun(1)
    const adapter = createLiveAdapter({
      first,
      canOpenNext: () => true,
      closeRun: () => {},
      next: async () => null,
    })
    const seen: ViewEvent[] = []
    adapter.subscribe((event) => seen.push(event))
    adapter.start()
    adapter.advance(0)
    await settle()

    expect(first.steps(), 'the engine was stepped before the operator committed a file').toBe(0)
    expect(seen.map((event) => event.type)).toEqual(['meta'])
  })

  it('(g) the press starts the thinking, and the line it produces lands', async () => {
    const first = stubRun(1)
    const adapter = createLiveAdapter({
      first,
      canOpenNext: () => true,
      closeRun: () => {},
      next: async () => null,
    })
    const seen: ViewEvent[] = []
    adapter.subscribe((event) => seen.push(event))
    adapter.start()
    adapter.advance(0)
    expect(adapter.send(DEPLOY)).toEqual({ ok: true })
    await settle()

    expect(first.steps()).toBeGreaterThan(0)
    expect(seen.filter((event) => event.type === 'feed').length).toBeGreaterThan(0)
  })
})

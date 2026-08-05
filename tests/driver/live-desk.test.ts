// The live desk, driven the way the shell drives it — the four things the
// suite could not see, because nothing in it ever ran a live run to its end.
//
// `e2e/` drives the DEV fixture loop, `preview-smoke` proves the player build
// boots and carries feed lines, and `live-adapter-run-transition` pins the
// `new_run` seam against a stub. Between them they cover the first frame and
// the turn of the day. What none of them does is PLAY one — and all four
// defects below lived past the point where the coverage stopped:
//
//   (A) the run died on its final beat, silently, so `run_end` never arrived
//   (B) the agent's report painted its opening cursor and never advanced
//   (C) a reload spent a run off the allotment
//   (D) a second MINE on one sentence dealt the card twice
//
// (A) is driven against the REAL engine, composer and pack, because that is
// what it took to see it: the stamp that killed it is authored data, and a stub
// driver invents its own stamps. The transport degrades to e6's fixture
// provider (`proxyBaseUrl: null`), so this needs no key and no network.
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createLiveAdapter } from '../../src/client/driver/live/adapter.ts'
import type { BoundRun } from '../../src/client/driver/live/adapter.ts'
import { bindLiveRun } from '../../src/client/driver/live/bind.ts'
import type { BindDeps } from '../../src/client/driver/live/bind.ts'
import type { LivePack, PackFetch } from '../../src/client/driver/live/pack.ts'
import type { ReportGuidance } from '../../src/shared/report-guidance.ts'
import { createLiveRunDriver } from '../../src/client/driver/live/index.ts'
import { registerAnimation, thawAnimations } from '../../src/client/driver/test-hooks.ts'
import { mm } from '../../src/client/driver/clock.ts'
import type { StorageLike } from '../../src/runloop/index.ts'
import type { FeedLine, ViewEvent } from '../../src/shared/view-driver.ts'
import { displayStamp } from '../../src/client/driver/clock.ts'
import { feedLineModel } from '../../src/client/components/run-feed.ts'
import { waitingModel } from '../../src/client/components/waiting-marker.ts'
import type { FixtureDriver } from '../../src/client/driver/fixture-driver.ts'

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const SLUG = '우는다리'

const readJson = (rel: string): unknown => JSON.parse(fs.readFileSync(path.join(REPO, rel), 'utf8'))

// Asserted to the SAME types the production loader asserts to (`pack.ts:82`),
// not to `never`: the shape is what this file is measuring against, so the pack
// losing a part has to be a type error here rather than an `undefined` that
// only surfaces as a failed assertion halfway through a 19-beat run.
const PACK: LivePack = {
  slug: SLUG,
  timeline: readJson(`data/scenario/${SLUG}/timeline.json`),
  gates: readJson(`data/scenario/${SLUG}/gates.json`),
  characters: readJson(`data/scenario/${SLUG}/characters.json`),
  temperament: readJson(`data/scenario/${SLUG}/temperament.json`),
  symptoms: readJson(`data/scenario/${SLUG}/symptoms.json`),
  // The seventh file, since the tally stopped being empty: `bindLiveRun` builds
  // a scorer over it and the day closes on what it resolves.
  score: readJson(`data/scenario/${SLUG}/score.json`),
} as LivePack

const GUIDANCE = readJson('data/policy/report-guidance.json') as ReportGuidance

/** One run of the real chain, offline — the binder's own wiring, unmodified. */
function realRun(run: number): BoundRun {
  const bindDeps: BindDeps = {
    pack: PACK,
    guidance: GUIDANCE,
    // Unset ⇒ e6's fixture provider (contract-calls §11). No key, no network.
    proxyBaseUrl: null,
    fetch: () => {
      throw new Error('the offline chain must not reach for a network')
    },
  }
  const meta: Extract<ViewEvent, { type: 'meta' }> = {
    type: 'meta',
    run,
    runs_left: 4 - run,
    carried: [],
    archive: [],
  }
  return bindLiveRun(bindDeps, { run, carried: [], start: '08:50', end: '21:04', meta })
}

/** Pumps the adapter like `shell/boot.ts`'s frame callback, until `done`. */
async function pump(driver: FixtureDriver, done: () => boolean, frames = 40_000): Promise<void> {
  for (let i = 0; i < frames && !done(); i += 1) {
    driver.advance(16)
    await Promise.resolve()
  }
  for (let i = 0; i < 50 && !done(); i += 1) await new Promise((resolve) => setTimeout(resolve, 0))
}

describe('(A) the live desk plays its day to the end', () => {
  // The pack's terminal beat is authored `21:04+` — engine/beat/clock.ts's
  // "immediately after this minute". `buildSchedule` keeps the string verbatim
  // on `Beat.clock`, so it reaches the adapter on a `beat_start`.
  it('the authored terminal stamp is one the seam can measure', () => {
    const timeline = PACK as unknown as { timeline: { events: { time: string }[] } }
    const times = timeline.timeline.events.map((e) => e.time)
    expect(times, 'the pack no longer authors a `+` stamp — this guard is measuring nothing').toContain('21:04+')
    expect(mm('21:04+')).toBe(mm('21:04'))
  })

  it('the run reaches run_end with every beat and every round behind it', async () => {
    const adapter = createLiveAdapter({
      first: realRun(1),
      canOpenNext: () => true,
      closeRun: () => {},
      next: async () => null,
    })
    const events: ViewEvent[] = []
    adapter.subscribe((event) => events.push(event))
    adapter.start()
    await pump(adapter, () => events.some((e) => e.type === 'run_end'))

    const types = events.map((e) => e.type)
    // Before the fix this stopped at 18 of 19 — `mm()` threw on `21:04+`
    // inside `absorb`, the throw unwound through the emitter into `step()`,
    // and `kick()`'s catch graded the rejection as a defect and stopped. The
    // desk kept its clock and its feed, so it merely looked slow.
    expect(events.filter((e) => e.type === 'beat_start')).toHaveLength(19)
    expect(types, 'the day never closed — TALLY cannot open without this').toContain('run_end')
    // One per gate: the pack authors 7, and the last round's is the one the
    // death took with it — the run used to stop with 18 beats and 6 reports.
    expect(events.filter((e) => e.type === 'report')).toHaveLength(7)

    // AND THE LEDGER. This comment used to say the opposite — that `score` is
    // not asserted because nothing in the repo builds a `ScorerPort`, so TALLY
    // opened empty on the live desk and on the headless run alike. `bind.ts`
    // now builds one over `score.json`, and this is the guard the gap left
    // behind: the day does not merely close, it closes on a ledger.
    //
    // Without it the sheet still opens — and then holds for the 30 s
    // `HOLD_CEIL` before releasing through the LAPSED path, because `counted`
    // never becomes true (`windows/tally.ts`'s `settleRelease`). An empty
    // ledger is not a missing feature the desk hides; it is a minute of dead
    // air at the end of every run.
    const score = events.find((e) => e.type === 'score')
    expect(score, 'the day closed with no ledger — TALLY has nothing to count').toBeDefined()
    const ledger = score as Extract<ViewEvent, { type: 'score' }>
    expect(ledger.rows).toHaveLength(9)
    // The no-intervention day: 다리 위 24 · 임차복 1 · 둔치 1, which is the
    // 사망 26 `score.json`'s `baseline_summary` has always claimed. The fixture
    // provider takes every gate's default stance, so this run intervenes in
    // nothing — the headline being the baseline is the point.
    expect(ledger.total).toBe(26)
    // §5.2 amendment g, on the real chain: a row's value may be a word.
    expect(ledger.rows.some((row) => typeof row.value === 'string')).toBe(true)
  }, 120_000)
})

describe('(B) the driver pumps the animations the desk registers', () => {
  // `components/report-view.ts` owns no timer: its typewriter is a pure
  // function of elapsed milliseconds arriving through `registerAnimation`, and
  // `tickAnimations` is the only thing that delivers them. The fixture driver
  // pumped it; this facade did not, so the agent's report painted TYPE_START —
  // every sentence empty — and stayed there for the rest of the run.
  it('a registered animation advances while the desk is running', () => {
    thawAnimations()
    let pumped = 0
    const unregister = registerAnimation('tests/live-desk', (realMs) => {
      pumped += realMs
    })
    try {
      const adapter = createLiveAdapter({
        first: realRun(1),
        canOpenNext: () => true,
        closeRun: () => {},
        next: async () => null,
      })
      adapter.start()
      adapter.advance(500)
      expect(pumped, 'the live desk never pumped the report typewriter').toBe(500)
    } finally {
      unregister()
    }
  })

  it('a PAUSED desk holds everything still — the fixture rule, unchanged', () => {
    thawAnimations()
    let pumped = 0
    const unregister = registerAnimation('tests/live-desk-paused', (realMs) => {
      pumped += realMs
    })
    try {
      const adapter = createLiveAdapter({
        first: realRun(1),
        canOpenNext: () => true,
        closeRun: () => {},
        next: async () => null,
      })
      adapter.start()
      adapter.clock.setRate(0)
      adapter.advance(500)
      expect(pumped, 'a paused desk kept animating').toBe(0)
    } finally {
      unregister()
    }
  })
})

describe('(C) a reload resumes the day rather than spending one', () => {
  /** `sessionStorage`, in memory — one tab, across several page loads. */
  function tabStorage(): StorageLike {
    const held = new Map<string, string>()
    return {
      getItem: (key) => held.get(key) ?? null,
      setItem: (key, value) => {
        held.set(key, value)
      },
      removeItem: (key) => {
        held.delete(key)
      },
    }
  }

  /**
   * Serves the pack off disk, the way `dist/data/**` serves it in a build.
   *
   * `LiveRunDeps.fetch` is `typeof globalThis.fetch` because the transport's
   * POST needs the real thing; this path only ever takes the `PackFetch` route
   * through it (`{ok, status, json}`), which is what the stub answers and all
   * the cast is standing in for.
   */
  const diskFetch = (async (url: string | URL) => {
    const rel = decodeURIComponent(new URL(String(url)).pathname).replace(/^\//, '')
    if (!fs.existsSync(path.join(REPO, rel))) return { ok: false, status: 404, json: async () => null }
    return { ok: true, status: 200, json: async () => readJson(rel) }
  }) satisfies PackFetch as unknown as typeof globalThis.fetch

  const boot = (storage: StorageLike): Promise<FixtureDriver> =>
    createLiveRunDriver({
      baseUrl: 'http://localhost/',
      fetch: diskFetch,
      storage,
      slug: SLUG,
      start: '08:50',
      end: '21:04',
      proxyBaseUrl: null,
    })

  it('four page loads in one tab all open RUN 01 with the allotment intact', async () => {
    const storage = tabStorage()
    const seen: { run: number; runsLeft: number }[] = []
    for (let load = 0; load < 4; load += 1) {
      const driver = await boot(storage)
      // The shell's opening move: subscribe, start, then `advance(0)` to
      // release what is due at the opening minute (`shell/boot.ts` step 5).
      const opened: ViewEvent[] = []
      driver.subscribe((event) => opened.push(event))
      driver.start()
      driver.advance(0)

      const meta = opened.find((e) => e.type === 'meta')
      expect(meta, 'the run opened with no meta event to count it').toBeDefined()
      const counted = meta as Extract<ViewEvent, { type: 'meta' }>
      seen.push({ run: counted.run, runsLeft: counted.runs_left })
    }
    // Before the fix: 01/−3 → 02/−2 → 03/−1 → 04/−0, and NEW RUN refused from
    // there on. A judge pressing ⌘R four times lost the game.
    expect(seen).toEqual([
      { run: 1, runsLeft: 3 },
      { run: 1, runsLeft: 3 },
      { run: 1, runsLeft: 3 },
      { run: 1, runsLeft: 3 },
    ])
  }, 120_000)
})

describe('(D) the deck is a set — a repeated MINE deals one card', () => {
  // `blocks.mine()` answers `true` for an id it has already mined, so the
  // membrane acks the second MINE and the ack cannot stand in for the check.
  // `fixture-driver.ts` guards it with `if (!mined.includes(...))`; this is the
  // same guard, and inv 12 is why it has to be the same.
  it('mining one sentence twice leaves one id in the store', async () => {
    const adapter = createLiveAdapter({
      first: realRun(1),
      canOpenNext: () => true,
      closeRun: () => {},
      next: async () => null,
    })
    const events: ViewEvent[] = []
    adapter.subscribe((event) => events.push(event))
    adapter.start()
    await pump(adapter, () => events.some((e) => e.type === 'feed' && e.line.sentence_id !== undefined), 400)

    const line = events.find((e) => e.type === 'feed' && e.line.sentence_id !== undefined)
    expect(line, 'no minable line reached the desk — this guard measured nothing').toBeDefined()
    const id = (line as Extract<ViewEvent, { type: 'feed' }>).line.sentence_id!

    expect(adapter.send({ op: 'mine', sentence_id: id })).toEqual({ ok: true })
    expect(adapter.send({ op: 'mine', sentence_id: id })).toEqual({ ok: true })
    expect(adapter.store().mined).toEqual([id])
  }, 120_000)
})

describe('(E) the clock gutter prints a time, and `21:04+` is not one', () => {
  // The pack's terminal beat is authored `21:04+` — an ORDERING weight, which
  // `mm()` resolves to the same minute as `21:04` because a whole-minute clock
  // has nowhere to put it. The seam carries the authored string, and it reaches
  // the FEED: `beat.clock` becomes each line's `clock` (`engine/feed/feed.ts`),
  // and `run-feed.ts` prints that in the gutter.
  //
  // It only became visible when the run started finishing. Until the `+` parsed,
  // the final beat threw and its lines — the closing tally among them — never
  // arrived, so nothing could have shown it. (A) is why this guard exists.
  it('the stamps the run emits still include the authored `+` on the seam', async () => {
    const adapter = createLiveAdapter({
      first: realRun(1),
      canOpenNext: () => true,
      next: async () => null,
      closeRun: () => {},
    })
    const events: ViewEvent[] = []
    adapter.subscribe((event) => events.push(event))
    adapter.start()
    await pump(adapter, () => events.some((e) => e.type === 'run_end'))

    const plus = events.filter((e) => e.type === 'feed' && e.line.clock.endsWith('+'))
    expect(
      plus.length,
      'the seam no longer carries a `+` stamp — either the pack changed or something normalised it upstream',
    ).toBeGreaterThan(0)
  }, 120_000)

  it('every gutter stamp the feed renders is a bare HH:MM', () => {
    // Both builders, because they are two: `run-feed.ts`'s envelope and
    // `waiting-marker.ts`'s own node, which does not go through it.
    const cases: [authored: string, printed: string][] = [
      ['21:04+', '21:04'],
      ['21:04', '21:04'],
      ['08:50', '08:50'],
    ]
    for (const [authored, printed] of cases) {
      const npc = { kind: 'npc', clock: authored, text: 'x' } as FeedLine
      expect(feedLineModel(npc).stamp, `run-feed printed ${authored} verbatim`).toBe(printed)
      const wait = { kind: 'wait', clock: authored, text: 'x' } as FeedLine
      expect(waitingModel(wait).stamp, `waiting-marker printed ${authored} verbatim`).toBe(printed)
      expect(displayStamp(authored)).toBe(printed)
    }
  })
})

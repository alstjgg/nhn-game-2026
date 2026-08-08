// The pack the deploy actually ships, played end to end — and NOT a second
// copy of `live-desk.test.ts`.
//
// That file plays 우는다리 and states its numbers outright (19 beats, 7 reports,
// a headline of 26, the `21:04+` stamp table). Those literals are the point
// there: they are what caught the terminal-stamp death, and a run whose
// expectations are derived from the same data it reads cannot catch a defect
// that lives in the data. So they stay, aimed at that pack.
//
// What they cannot do is follow `PACK_SLUG`. When the desk moved to 전구간정상
// (08-08), every real-run harness in the suite — this file's sibling,
// `acceptance/fixtures/rig.ts`, `scorer.test.ts` — stayed pointed at 우는다리,
// and the shipped pack went out having never been played. A green suite meant
// a pack that is not deployed is green.
//
// This closes that with the opposite discipline: ONE literal — the slug, read
// from `shell/pack.ts` — and every expectation computed from the named pack's
// own files. It cannot go stale on a slug switch, and it deliberately asserts
// only properties that hold for ANY consumable pack, so it never has to be
// re-authored when the scenario changes.
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createLiveAdapter } from '../../src/client/driver/live/adapter.ts'
import type { BoundRun } from '../../src/client/driver/live/adapter.ts'
import { bindLiveRun } from '../../src/client/driver/live/bind.ts'
import type { BindDeps } from '../../src/client/driver/live/bind.ts'
import type { LivePack } from '../../src/client/driver/live/pack.ts'
import type { ReportGuidance } from '../../src/shared/report-guidance.ts'
import type { ViewEvent } from '../../src/shared/view-driver.ts'
import type { FixtureDriver } from '../../src/client/driver/fixture-driver.ts'
import { displayStamp } from '../../src/client/driver/clock.ts'
import { PACK_SLUG } from '../../src/client/shell/pack.ts'

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

const readJson = (rel: string): unknown => JSON.parse(fs.readFileSync(path.join(REPO, rel), 'utf8'))
const packFile = (part: string): unknown => readJson(`data/scenario/${PACK_SLUG}/${part}.json`)

/** The authored shapes this file measures against — read, never restated. */
interface Meta {
  slug: string
  clock: { start: string; end: string }
}
interface Timeline {
  events: { id: string; time: string; text: string; exposure: { extra_condition: string | null } }[]
}
interface Gates {
  gates: { gate: string; clock?: string | null }[]
}
interface Score {
  units: { id: string; predicates: string[] }[]
}

const META = packFile('meta') as Meta
const TIMELINE = packFile('timeline') as Timeline
const GATES = packFile('gates') as Gates
const SCORE = packFile('score') as Score

// Asserted to the SAME type the production loader asserts to (`pack.ts`), for
// the reason its sibling gives: a pack losing a part must be a type error here,
// not an `undefined` surfacing halfway through the run.
const PACK: LivePack = {
  slug: PACK_SLUG,
  timeline: TIMELINE,
  gates: GATES,
  characters: packFile('characters'),
  temperament: packFile('temperament'),
  symptoms: packFile('symptoms'),
  score: SCORE,
} as unknown as LivePack

const GUIDANCE = readJson('data/policy/report-guidance.json') as ReportGuidance

/**
 * How many beats the day has, derived WITHOUT `buildSchedule`.
 *
 * `buildSchedule` is the thing under test, so counting with it would prove
 * nothing. A beat is one authored stamp — co-timed rows share one (우는다리's
 * t4/t5 both sit at 10:40) and a gate's clock joins the same slot — which is
 * the schedule's contract stated from the data side.
 */
const authoredStamps = new Set<string>([
  ...TIMELINE.events.map((event) => event.time),
  ...GATES.gates.map((gate) => gate.clock).filter((clock): clock is string => typeof clock === 'string'),
])

/**
 * The no-intervention headline the pack itself claims.
 *
 * The fixture provider takes every gate's DEFAULT stance, so a run through it
 * intervenes in nothing and every score rule falls to its `=>` fallback — that
 * is 가이드 §5's "첫 런이 가장 나쁜 런", and `datapack:lint`'s E-P3/E-P5 are
 * what keep it true (no score predicate may read a flag the timeline or a
 * default bucket sets). The headline is the sum of the numeric fallbacks;
 * string-valued units are rows that only read.
 */
const baselineHeadline = SCORE.units.reduce((sum, unit) => {
  const fallback = unit.predicates.find((predicate) => predicate.trim().startsWith('=>'))
  const value = fallback?.slice(fallback.indexOf('=>') + 2).trim() ?? ''
  return /^-?\d+$/.test(value) ? sum + Number(value) : sum
}, 0)

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
  // The band the shell hands the driver: `meta.clock`, with the sub-minute `+`
  // stripped exactly as `shell/pack.ts` strips it before the clock is built.
  return bindLiveRun(bindDeps, {
    run,
    carried: [],
    start: displayStamp(META.clock.start),
    end: displayStamp(META.clock.end),
    meta,
  })
}

/** Pumps the adapter like `shell/boot.ts`'s frame callback, until `done`. */
async function pump(driver: FixtureDriver, done: () => boolean, frames = 40_000): Promise<void> {
  for (let i = 0; i < frames && !done(); i += 1) {
    driver.advance(16)
    await Promise.resolve()
  }
  for (let i = 0; i < 50 && !done(); i += 1) await new Promise((resolve) => setTimeout(resolve, 0))
}

async function playOneRun(): Promise<ViewEvent[]> {
  const adapter = createLiveAdapter({
    first: realRun(1),
    canOpenNext: () => true,
    closeRun: () => {},
    next: async () => null,
  })
  const events: ViewEvent[] = []
  adapter.subscribe((event) => events.push(event))
  adapter.start()
  await pump(adapter, () => events.some((event) => event.type === 'run_end'))
  return events
}

describe('the shipped pack is the pack under test', () => {
  it('(a) `PACK_SLUG` names a pack on disk, and it is the one this file plays', () => {
    const dir = path.join(REPO, 'data', 'scenario', PACK_SLUG)
    expect(fs.existsSync(dir), `PACK_SLUG names "${PACK_SLUG}", which is not a pack directory`).toBe(
      true,
    )
    // `meta.slug` is what the topbar prints (`shell/boot.ts`'s `#caseName`), so
    // a slug that disagrees with its own directory would ship a case name for a
    // scenario nobody can fetch.
    expect(META.slug).toBe(PACK_SLUG)
  })

  it('(b) the day it authors is one the runtime clock can hold', () => {
    // The band is same-day only — `createClock`'s `isEnded()` is
    // `minute >= endMinute`, so a pack whose end sorts before its start boots
    // already finished. `compile-datapack.mjs` refuses a timeline that would
    // cross midnight for this reason; this is the same claim, asserted against
    // the pack the deploy carries rather than against the compiler's input.
    const mmOf = (stamp: string): number => {
      const [hours, minutes] = displayStamp(stamp).split(':').map(Number)
      return hours! * 60 + minutes!
    }
    expect(mmOf(META.clock.end)).toBeGreaterThan(mmOf(META.clock.start))
    const times = TIMELINE.events.map((event) => mmOf(event.time))
    for (const [i, minute] of times.entries()) {
      if (i === 0) continue
      expect(minute, `timeline row ${i + 1} goes backwards in the day`).toBeGreaterThanOrEqual(
        times[i - 1]!,
      )
    }
  })
})

describe('the shipped pack plays its day to the end', () => {
  it('(c) the run reaches run_end with every beat and every gate behind it', async () => {
    const events = await playOneRun()
    const types = events.map((event) => event.type)

    expect(
      events.filter((event) => event.type === 'beat_start'),
      'a beat went missing — the run stopped before the day did',
    ).toHaveLength(authoredStamps.size)
    expect(types, 'the day never closed — TALLY cannot open without run_end').toContain('run_end')
    // One report per gate: a gate is a round, and a round closes on a report.
    expect(events.filter((event) => event.type === 'report')).toHaveLength(GATES.gates.length)
  })

  it('(d) the day closes on a ledger, and an untouched day scores the authored baseline', async () => {
    const events = await playOneRun()
    const score = events.find((event) => event.type === 'score')
    expect(score, 'the day closed with no ledger — TALLY has nothing to count').toBeDefined()

    const ledger = score as Extract<ViewEvent, { type: 'score' }>
    expect(ledger.rows, 'the ledger lost a unit').toHaveLength(SCORE.units.length)
    // The fixture provider intervenes in nothing, so this run IS the record the
    // draft printed. A headline below it would mean a score rule matched before
    // the player did anything — E-P5's defect, seen from the run's side.
    expect(
      ledger.total,
      'the no-intervention run did not score the pack’s own 무개입 기준',
    ).toBe(baselineHeadline)
  })

  // The defect `exposure.extra_condition` was written to prevent, stated from
  // the run's side. A pack authors its branches as co-timed pairs — 전구간정상's
  // 21:22 announcement is either "차량 안에서 대기하십시오" or "차에서
  // 내리십시오", never both — and while the slot was unread BOTH halves reached
  // the feed in the same minute. Derived from the pack, so it holds for any
  // scenario that authors pairs and asserts nothing about a scenario that does
  // not.
  it('(e) a co-timed exclusive pair never both reach one run', async () => {
    /** `not x` → 'neg', a bare `x` → 'pos', silence → null. */
    const polarity = (condition: string, name: string): 'pos' | 'neg' | null => {
      if (new RegExp(`\\bnot\\s+${name}\\b`).test(condition)) return 'neg'
      return new RegExp(`\\b${name}\\b`).test(condition) ? 'pos' : null
    }
    const byTime = new Map<string, Timeline['events']>()
    for (const event of TIMELINE.events) {
      byTime.set(event.time, [...(byTime.get(event.time) ?? []), event])
    }
    const pairs: [Timeline['events'][number], Timeline['events'][number]][] = []
    for (const group of byTime.values()) {
      for (let i = 0; i < group.length; i += 1) {
        for (let j = i + 1; j < group.length; j += 1) {
          const left = group[i]!.exposure.extra_condition ?? ''
          const right = group[j]!.exposure.extra_condition ?? ''
          const names = new Set(`${left} ${right}`.match(/[a-z][a-z0-9_]*/g) ?? [])
          names.delete('not')
          const opposed = [...names].some((name) => {
            const a = polarity(left, name)
            const b = polarity(right, name)
            return a !== null && b !== null && a !== b
          })
          if (opposed) pairs.push([group[i]!, group[j]!])
        }
      }
    }
    expect(
      pairs.length,
      'the pack authors no co-timed exclusive pair — this guard is measuring nothing',
    ).toBeGreaterThan(0)

    const events = await playOneRun()
    const texts = events
      .filter((event): event is Extract<ViewEvent, { type: 'feed' }> => event.type === 'feed')
      .map((event) => event.line.text)
    // EXACT equality, not a prefix: `buildFeed` carries an authored event's
    // text through verbatim, and a pair's two halves routinely share an opening
    // clause (t27/t28 both begin 상황 종료. 사고 개요서 적재물 칸에…), so a
    // prefix match reports a pair as present when only one half played.
    const reached = (event: Timeline['events'][number]): boolean => texts.includes(event.text)

    for (const [left, right] of pairs) {
      expect(
        reached(left) && reached(right),
        `${left.id} and ${right.id} both played at ${left.time} — the run said two opposite things in one minute`,
      ).toBe(false)
    }
  })
})

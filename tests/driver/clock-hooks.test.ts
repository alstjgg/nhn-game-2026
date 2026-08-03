// [u2#c5] — PRD §5 u2: clock pause/seed and animation-freeze hooks exist and pin a
// frame. The reference clock loop (docs/design/phase2-ui/app.js:457–480) is the
// DRIVER's job (spec §8), so its pacing is ported here in TS: MS_PER_SIM_MIN = 105,
// rates ×1 / ×4 / pause. Seeded clock + frozen animations ⇒ byte-identical renders.
import { describe, it, expect, beforeEach } from 'vitest'
import type { ViewEvent } from '../../src/shared/view-driver.ts'
import type { FixtureRun } from '../../src/client/driver/fixtures/types.ts'
import { createFixtureDriver } from '../../src/client/driver/fixture-driver.ts'
import { MS_PER_SIM_MIN, createClock, mm, hhmm } from '../../src/client/driver/clock.ts'
import {
  freezeAnimations,
  thawAnimations,
  animationsFrozen,
  registerAnimation,
  serializeFrame,
} from '../../src/client/driver/test-hooks.ts'

const START = '13:05'
const END = '13:20'

function run(): FixtureRun {
  const events: ViewEvent[] = [
    { type: 'beat_start', beat: 1, clock: '13:05' },
    { type: 'feed', line: { kind: 'event', clock: '13:07', text: 'A' } },
    { type: 'feed', line: { kind: 'radio', clock: '13:10', text: 'B', speaker: 'SP' } },
    { type: 'beat_end', beat: 1, clock: '13:12' },
    { type: 'run_end', run: 1 },
  ]
  return {
    id: 'clock',
    start: START,
    end: END,
    events,
    responses: { slot: { ok: true }, unslot: { ok: true }, mine: { ok: true }, deploy: { ok: true }, new_run: { ok: true } },
  }
}

describe('[u2#c5] the ported clock', () => {
  it('(a) MS_PER_SIM_MIN is the reference pacing constant, 105', () => {
    expect(MS_PER_SIM_MIN).toBe(105)
  })

  it('(b) mm/hhmm round-trip the "HH:MM" stamps the seam uses', () => {
    expect(mm('13:05')).toBe(13 * 60 + 5)
    expect(hhmm(mm('21:04'))).toBe('21:04')
    expect(hhmm(mm('08:50'))).toBe('08:50')
  })

  it('(c) ×1 advances one sim minute per MS_PER_SIM_MIN of real time', () => {
    const clock = createClock({ start: START, end: END, rate: 1 })
    clock.advance(MS_PER_SIM_MIN * 3)
    expect(clock.at()).toBe('13:08')
  })

  it('(d) ×4 advances four sim minutes for the same real time', () => {
    const clock = createClock({ start: START, end: END, rate: 4 })
    clock.advance(MS_PER_SIM_MIN * 3)
    expect(clock.at()).toBe('13:17')
  })

  it('(e) sub-minute remainder accumulates instead of being dropped', () => {
    const clock = createClock({ start: START, end: END, rate: 1 })
    clock.advance(MS_PER_SIM_MIN * 0.6)
    expect(clock.at()).toBe('13:05')
    clock.advance(MS_PER_SIM_MIN * 0.6)
    expect(clock.at()).toBe('13:06')
  })

  it('(f) the clock stops at end and reports ended (reference endRun)', () => {
    const clock = createClock({ start: START, end: END, rate: 4 })
    clock.advance(MS_PER_SIM_MIN * 1000)
    expect(clock.at()).toBe(END)
    expect(clock.ended).toBe(true)
  })
})

describe('[u2#c5] pause hook', () => {
  it('(g) a paused clock does not move, however much real time passes', () => {
    const clock = createClock({ start: START, end: END, rate: 1 })
    clock.pause()
    clock.advance(MS_PER_SIM_MIN * 50)
    expect(clock.at()).toBe(START)
    expect(clock.running).toBe(false)
  })

  it('(h) resume picks up from where it paused, with no banked catch-up', () => {
    const clock = createClock({ start: START, end: END, rate: 1 })
    clock.advance(MS_PER_SIM_MIN * 2)
    clock.pause()
    clock.advance(MS_PER_SIM_MIN * 50)
    clock.resume()
    clock.advance(MS_PER_SIM_MIN * 1)
    expect(clock.at()).toBe('13:08')
  })

  it('(i) rate 0 is pause — the reference treats it as one control', () => {
    const clock = createClock({ start: START, end: END, rate: 1 })
    clock.setRate(0)
    clock.advance(MS_PER_SIM_MIN * 9)
    expect(clock.at()).toBe(START)
  })

  it('(j) a paused driver emits nothing further', () => {
    const seen: ViewEvent[] = []
    const driver = createFixtureDriver(run())
    driver.subscribe((e) => seen.push(e))
    driver.start()
    driver.clock.pause()
    const before = seen.length
    driver.advance(MS_PER_SIM_MIN * 30)
    expect(seen.length).toBe(before)
  })
})

describe('[u2#c5] seed hook', () => {
  it('(k) seed pins the sim clock to an exact minute', () => {
    const clock = createClock({ start: START, end: END, rate: 1 })
    clock.seed('13:11')
    expect(clock.at()).toBe('13:11')
  })

  it('(l) seeding clears the sub-minute accumulator (no half-tick carried in)', () => {
    const clock = createClock({ start: START, end: END, rate: 1 })
    clock.advance(MS_PER_SIM_MIN * 0.9)
    clock.seed('13:11')
    clock.advance(MS_PER_SIM_MIN * 0.9)
    expect(clock.at()).toBe('13:11')
  })

  it('(m) a seeded driver releases exactly the events due at that stamp', () => {
    const seen: ViewEvent[] = []
    const driver = createFixtureDriver(run())
    driver.subscribe((e) => seen.push(e))
    driver.start()
    driver.clock.seed('13:07')
    driver.advance(0)
    expect(seen.map((e) => e.type)).toEqual(['beat_start', 'feed'])
  })
})

describe('[u2#c5] animation-freeze hook', () => {
  beforeEach(() => {
    thawAnimations()
  })

  it('(n) freeze/thaw flips the reported state', () => {
    expect(animationsFrozen()).toBe(false)
    freezeAnimations()
    expect(animationsFrozen()).toBe(true)
    thawAnimations()
    expect(animationsFrozen()).toBe(false)
  })

  it('(o) a registered animation does not tick while frozen', () => {
    let ticks = 0
    const off = registerAnimation('tally', () => (ticks += 1))
    freezeAnimations()
    const driver = createFixtureDriver(run())
    driver.start()
    driver.advance(MS_PER_SIM_MIN * 10)
    off()
    expect(ticks, 'frozen animations still ran').toBe(0)
  })

  it('(p) the same animation ticks once thawed (the freeze is real, not a no-op API)', () => {
    let ticks = 0
    const off = registerAnimation('tally', () => (ticks += 1))
    const driver = createFixtureDriver(run())
    driver.start()
    driver.advance(MS_PER_SIM_MIN * 10)
    off()
    expect(ticks).toBeGreaterThan(0)
  })
})

describe('[u2#c5] the pinned frame is byte-identical', () => {
  beforeEach(() => {
    thawAnimations()
  })

  function pin(seedAt: string): string {
    freezeAnimations()
    const driver = createFixtureDriver(run())
    driver.start()
    driver.clock.seed(seedAt)
    driver.advance(0)
    return serializeFrame(driver.frame())
  }

  it('(q) two independent drivers, same seed + frozen animations, serialise identically', () => {
    expect(pin('13:10')).toBe(pin('13:10'))
  })

  it('(r) the pin survives a different real-time path to the same sim minute', () => {
    freezeAnimations()
    const a = createFixtureDriver(run())
    a.start()
    a.clock.seed('13:10')
    a.advance(0)

    const b = createFixtureDriver(run())
    b.start()
    b.advance(MS_PER_SIM_MIN * 5)
    expect(serializeFrame(b.frame())).toBe(serializeFrame(a.frame()))
  })

  it('(s) a different seed produces a different frame (the pin is not a constant)', () => {
    expect(pin('13:06')).not.toBe(pin('13:12'))
  })

  it('(t) the serialised frame carries no wall-clock or random value', () => {
    const frame = pin('13:10')
    expect(frame).not.toMatch(/\b1[6-9]\d{11}\b/) // no epoch-ms timestamp
    expect(frame.toLowerCase()).not.toContain('math.random')
    expect(frame).toContain('13:10')
  })

  it('(u) frame() is stable across repeated calls with no advance in between', () => {
    freezeAnimations()
    const driver = createFixtureDriver(run())
    driver.start()
    driver.clock.seed('13:10')
    driver.advance(0)
    expect(serializeFrame(driver.frame())).toBe(serializeFrame(driver.frame()))
  })
})

// [e8#A3] — exposure depth is the max clock ever reached, and "unmeasurable ≠ zero"
// (docs/contract-run-artifacts §2 / RUNLOG A20): null never becomes 0 or '00:00'.
import { describe, it, expect } from 'vitest'
import { CLOCK_RE, createMemoryMetaStore, createRunLoop, deeperClock } from '../../src/runloop/index.ts'
import { loadSchema } from './schema.ts'

const SLUG = 'dday-demo'

function loop() {
  return createRunLoop({ store: createMemoryMetaStore(), packSlug: SLUG, totalRuns: 4 })
}

/** Run `n` runs, each reaching the given clock. Returns the final state. */
function runThrough(clocks: (string | null)[]) {
  const rl = loop()
  clocks.forEach((clock, i) => {
    rl.startRun()
    rl.endRun({ runId: `run-${String(i + 1).padStart(4, '0')}`, reachedClock: clock, carried: [] })
  })
  return { rl, state: rl.current() }
}

describe('[e8#A3] exposure_clock_reached is the deepest clock ever reached', () => {
  it('(a) a shallower second run does not rewind the depth', () => {
    expect(runThrough(['13:05', '12:00']).state.exposure_clock_reached).toBe('13:05')
  })

  it('(b) a deeper second run advances it', () => {
    expect(runThrough(['12:00', '13:05']).state.exposure_clock_reached).toBe('13:05')
  })

  it("(c) the '+' suffix (after the end clock) beats the bare clock", () => {
    expect(runThrough(['21:04', '21:04+']).state.exposure_clock_reached).toBe('21:04+')
    expect(runThrough(['21:04+', '21:04']).state.exposure_clock_reached).toBe('21:04+')
  })

  it('(d) startRun() reports the carried exposure clock to the caller', () => {
    const rl = loop()
    rl.startRun()
    rl.endRun({ runId: 'run-0001', reachedClock: '13:05', carried: [] })
    expect(rl.startRun().exposureClock).toBe('13:05')
  })

  it('(e) UNMEASURABLE ≠ ZERO — two null runs leave null, never 0 and never "00:00"', () => {
    const { state } = runThrough([null, null])
    expect(state.exposure_clock_reached).toBeNull()
    expect(state.exposure_clock_reached).not.toBe(0)
    expect(state.exposure_clock_reached).not.toBe('00:00')
    expect(state.exposure_clock_reached).not.toBe('')
  })

  it('(f) a null run does not erase a measured depth', () => {
    expect(runThrough(['13:05', null]).state.exposure_clock_reached).toBe('13:05')
    expect(runThrough([null, '13:05']).state.exposure_clock_reached).toBe('13:05')
  })

  it('(g) a fresh loop reports null exposure, not a fabricated zero', () => {
    const state = loop().current()
    expect(state.exposure_clock_reached).toBeNull()
    expect(state.run_count).toBe(0)
  })
})

describe('[e8#A3] deeperClock() — null-safe max, compare never arithmetic', () => {
  it('(a) picks the later clock in either argument order', () => {
    expect(deeperClock('09:00', '10:00')).toBe('10:00')
    expect(deeperClock('10:00', '09:00')).toBe('10:00')
    expect(deeperClock('13:05', '13:04')).toBe('13:05')
    expect(deeperClock('01:59', '02:00')).toBe('02:00')
  })

  it('(b) equal clocks return that clock', () => {
    expect(deeperClock('13:05', '13:05')).toBe('13:05')
    expect(deeperClock('21:04+', '21:04+')).toBe('21:04+')
  })

  it("(c) '+' orders after the same bare clock but before the next minute", () => {
    expect(deeperClock('21:04+', '21:04')).toBe('21:04+')
    expect(deeperClock('21:04+', '21:05')).toBe('21:05')
  })

  it('(d) null propagates as unmeasurable, never as 0', () => {
    expect(deeperClock(null, null)).toBeNull()
    expect(deeperClock(null, '12:00')).toBe('12:00')
    expect(deeperClock('12:00', null)).toBe('12:00')
    expect(deeperClock(null, null)).not.toBe('00:00')
  })

  it('(e) "00:00" is a real clock, deeper than null and shallower than anything else', () => {
    expect(deeperClock(null, '00:00')).toBe('00:00')
    expect(deeperClock('00:00', '00:01')).toBe('00:01')
  })

  it('(f) a non-null input failing the schema pattern throws RangeError', () => {
    for (const bad of ['7:05', '24:00', '12:60', '13:5', 'abc', '', '13:05++', ' 13:05']) {
      expect(() => deeperClock(bad, '12:00'), `expected throw for ${JSON.stringify(bad)}`).toThrow(RangeError)
      expect(() => deeperClock('12:00', bad), `expected throw for ${JSON.stringify(bad)}`).toThrow(RangeError)
    }
  })
})

describe('[e8#A3] CLOCK_RE mirrors the ratified schema pattern', () => {
  it('(a) is the exact pattern from meta-state.schema.json', () => {
    const schema = loadSchema() as {
      properties: { exposure_clock_reached: { anyOf: { pattern?: string }[] } }
    }
    const pattern = schema.properties.exposure_clock_reached.anyOf.find((b) => b.pattern)?.pattern
    expect(pattern, 'schema no longer carries a clock pattern').toBeTruthy()
    expect(CLOCK_RE.source).toBe(pattern)
  })

  it('(b) accepts bare and + clocks, rejects the malformed ones', () => {
    for (const ok of ['00:00', '13:05', '21:04+', '23:59']) expect(CLOCK_RE.test(ok)).toBe(true)
    for (const bad of ['7:05', '24:00', '12:60', 'abc']) expect(CLOCK_RE.test(bad)).toBe(false)
  })
})

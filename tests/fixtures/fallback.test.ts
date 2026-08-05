// [u2f#c5] — spec-client §7 #7: the fixture carries at least one `fallback`
// event (engine §5 class) at the design target's 17:33 beat, and the run
// CONTINUES past it — a fallback degrades the round, it does not end the day.
import { describe, it, expect } from 'vitest'
import { beatsOf, feedLines, minutes } from './fixture-utils.ts'
import { woodariRun03 } from '../../src/client/driver/fixtures/index.ts'

const events = () => woodariRun03.events
const FALLBACK_CLOCK = '17:33'

const fallbackEvents = () =>
  events().flatMap((e) => (e.type === 'fallback' ? [e] : []))

describe('[u2f#c5] the 17:33 fallback', () => {
  it('(a) a `fallback` feed line exists at 17:33', () => {
    const line = feedLines(events()).filter(
      (l) => l.kind === 'fallback' && l.clock === FALLBACK_CLOCK,
    )
    expect(line.length).toBe(1)
  })

  it('(b) at least one `fallback` ViewEvent is emitted, on call 1 with a non-empty code (A2)', () => {
    const fb = fallbackEvents()
    expect(fb.length).toBeGreaterThan(0)
    for (const e of fb) {
      expect(e.call).toBe(1)
      expect(typeof e.code).toBe('string')
      expect(e.code.length).toBeGreaterThan(0)
    }
  })

  it('(c) the fallback event names the beat that holds the 17:33 line', () => {
    const owner = beatsOf(events()).find((b) =>
      b.lines.some((l) => l.kind === 'fallback' && l.clock === FALLBACK_CLOCK),
    )
    expect(owner).toBeDefined()
    const beats = fallbackEvents().map((e) => e.beat)
    expect(beats).toContain(owner?.beat)
  })

  it('(d) the fallback event precedes the line it explains', () => {
    const all = events()
    const evIdx = all.findIndex((e) => e.type === 'fallback')
    const lineIdx = all.findIndex(
      (e) => e.type === 'feed' && e.line.kind === 'fallback' && e.line.clock === FALLBACK_CLOCK,
    )
    expect(evIdx).toBeGreaterThanOrEqual(0)
    expect(lineIdx).toBeGreaterThan(evIdx)
  })

  it('(e) the wait that failed is closed before the fallback is announced', () => {
    const all = events()
    const evIdx = all.findIndex((e) => e.type === 'fallback')
    const before = all.slice(0, evIdx)
    const lastWaiting = [...before].reverse().find((e) => e.type === 'waiting')
    expect(lastWaiting && lastWaiting.type === 'waiting' ? lastWaiting.active : null).toBe(false)
  })
})

describe('[u2f#c5] the run continues past the fallback', () => {
  it('(f) feed lines with a later clock follow', () => {
    const later = feedLines(events()).filter(
      (l) => minutes(l.clock) > minutes(FALLBACK_CLOCK),
    )
    expect(later.length).toBeGreaterThan(0)
  })

  it('(g) beats keep opening after the fallback beat', () => {
    const beats = beatsOf(events())
    const owner = beats.findIndex((b) =>
      b.lines.some((l) => l.kind === 'fallback' && l.clock === FALLBACK_CLOCK),
    )
    expect(beats.length - owner - 1).toBeGreaterThan(0)
  })

  it('(h) the run still reaches its report, score and `run_end`', () => {
    const types = events().map((e) => e.type)
    expect(types).toContain('report')
    expect(types).toContain('score')
    const end = events().find((e) => e.type === 'run_end')
    expect(end && end.type === 'run_end' ? end.run : null).toBe(3)
  })
})

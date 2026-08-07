// Feed timing (playtest) — a beat's lines drip across the beat's span instead
// of bursting at its opening minute. The engine stamps successive lines
// +STAMP_STRIDE_MIN sim minutes apart, capped one minute short of the next
// beat; the adapter already releases each stamp as the sim clock reaches it,
// so the spread IS the pacing. A beat with no successor keeps its authored
// clock on every line (the `+` case is guarded by live-desk (E)).
import { describe, it, expect } from 'vitest'
import { beatSpans, drain, makeRig } from './engine-fixtures/rig.ts'

/** `min(beat + 5·i, cap)`, printed the way the seam prints it. */
function expected(beatMinute: number, index: number, capMinute: number): string {
  const minute = Math.min(beatMinute + 5 * index, capMinute)
  return `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`
}

describe('[feed-timing] beat lines spread across the beat span', () => {
  it('(a) the gate beat: first line on the beat clock, then +5 a line, capped before 09:30', async () => {
    const events = await drain(makeRig())
    const span = beatSpans(events)[0]!
    const stamps = events
      .slice(span.from, span.to)
      .flatMap((event) => (event.type === 'feed' ? [event.line.clock] : []))
    expect(stamps.length, 'the gate beat emitted too few lines to spread').toBeGreaterThan(1)
    stamps.forEach((stamp, index) => {
      expect(stamp, `line ${index} of the gate beat`).toBe(expected(9 * 60, index, 9 * 60 + 29))
    })
  })

  it('(b) the last beat has no successor and keeps its authored clock whole', async () => {
    const events = await drain(makeRig())
    const spans = beatSpans(events)
    const last = spans[spans.length - 1]!
    const stamps = events
      .slice(last.from, last.to)
      .flatMap((event) => (event.type === 'feed' ? [event.line.clock] : []))
    expect(stamps.length).toBeGreaterThan(0)
    for (const stamp of stamps) expect(stamp).toBe('09:30')
  })
})

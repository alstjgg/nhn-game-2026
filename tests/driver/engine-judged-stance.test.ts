// [u52b] — the `report` event carries the judged stance in the author's words
// (`judged?: { stance_id, desc }`), sourced from the PACK's stances, never
// from model output. A fallback round carries the DEFAULT stance's desc.
import { describe, it, expect } from 'vitest'
import { drain, failingTransport, makeRig, sentinelJudgment } from './engine-fixtures/rig.ts'

describe('[u52b] the report event carries the judged stance', () => {
  it("(a) a judged round: the chosen stance, desc from the pack", async () => {
    const rig = makeRig({ responses: { judgment: { ...sentinelJudgment(), stance: 'escalate' } } })
    const events = await drain(rig)
    const reports = events.flatMap((event) => (event.type === 'report' ? [event] : []))
    expect(reports.length).toBe(1)
    expect(reports[0]?.judged).toEqual({ stance_id: 'escalate', desc: 'b-desc' })
  })

  it("(b) a fallback round: the default stance, desc from the pack", async () => {
    const events = await drain(makeRig({ transport: failingTransport('judgment') }))
    const reports = events.flatMap((event) => (event.type === 'report' ? [event] : []))
    expect(reports.length).toBe(1)
    expect(reports[0]?.judged).toEqual({ stance_id: 'hold', desc: 'a-desc' })
  })
})

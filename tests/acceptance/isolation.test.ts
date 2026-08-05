// [e10] contract-engine-composer §8 criteria 5 and 6 — what crosses, and what does not.
//
// A8/A9. §8-5 is three-way (design D5): the Call 1 `inner_note` must (a) reach
// `RoundView.EXPERIENCED`, (b) appear in no value of the judgment/narration
// payloads — which are the `GateView`/`BeatView` verbatim — and (c) appear on no
// feed line and no timeline event. §8-6 compares rendered BYTES, not identity:
// a shared reference the composer then rendered two ways would pass an identity
// check and still ship two different prompts.
import { beforeAll, describe, expect, it } from 'vitest'
import { driveRound } from './fixtures/rig.ts'
import type { Driven } from './fixtures/rig.ts'

let driven: Driven

beforeAll(async () => {
  driven = await driveRound()
})

const of = (type: string) => driven.requests.filter((request) => request.call_type === type)

/** Every string anywhere inside a value — the deep scan §8-5(b)/(c) needs. */
function strings(value: unknown, out: string[] = []): string[] {
  if (typeof value === 'string') out.push(value)
  else if (Array.isArray(value)) for (const item of value) strings(item, out)
  else if (value !== null && typeof value === 'object') {
    for (const item of Object.values(value as Record<string, unknown>)) strings(item, out)
  }
  return out
}

function innerNote(): string {
  const call1 = driven.responses.find((response) => response.call_type === 'judgment')
  const note = call1?.body['inner_note']
  if (typeof note !== 'string' || note.length === 0) {
    throw new Error('the driven round produced no Call 1 `inner_note` to trace')
  }
  return note
}

describe('§8-5 inner_note reaches Call 3 and nothing else', () => {
  it('§8-5 (a) it appears in RoundView.EXPERIENCED — the reporter payload carries it', () => {
    const note = innerNote()
    const experienced = (of('reporter')[0]!.slots as Record<string, unknown>)['EXPERIENCED']
    expect(strings(experienced).some((line) => line.includes(note))).toBe(true)
  })

  it('§8-5 (b) it appears in no value of any judgment or narration payload', () => {
    const note = innerNote()
    for (const request of [...of('judgment'), ...of('narration')]) {
      const hit = strings(request.slots).filter((text) => text.includes(note))
      expect(hit, `${request.call_type} leaked the inner note`).toEqual([])
    }
  })

  it('§8-5 (b) no GateView or BeatView slot is named for it either', () => {
    for (const request of [...of('judgment'), ...of('narration')]) {
      expect(Object.keys(request.slots as Record<string, unknown>)).not.toContain('INNER_NOTE')
      expect(Object.keys(request.slots as Record<string, unknown>)).not.toContain('inner_note')
    }
  })

  it('§8-5 (c) it appears on no feed line and no timeline event', () => {
    const note = innerNote()
    const leaked = driven.feed.filter((line) => line.text.includes(note))
    expect(leaked, 'the inner note reached the timeline').toEqual([])
    const feedEvents = driven.events.filter((event) => event.type === 'feed')
    expect(strings(feedEvents).filter((text) => text.includes(note))).toEqual([])
  })

  // The `feed`-only scan above is how a leaking run stayed GREEN: the `report`
  // ViewEvent is the OTHER half of the player's out-channel (§2.0's two output
  // surfaces), it carries `Sentence[]` rather than `FeedLine`s, and nothing here
  // looked at it. §5's "reaches the player only through the report" is about the
  // reporter's prose, not about handing the note back verbatim as a minable
  // fact — so the scan is now the whole event stream, by event type, with no
  // allow-list to fall out of date.
  it('§8-5 (c) it appears in NO emitted ViewEvent — `report` included', () => {
    const note = innerNote()
    const offenders = driven.events
      .map((event, index) => ({ index, event }))
      .filter(({ event }) => strings(event).some((text) => text.includes(note)))
      .map(({ index, event }) => `${index}:${event.type}`)
    expect(offenders, 'an emitted ViewEvent carried the inner note').toEqual([])
  })

  it('§8-5 (c) the scan is not vacuous — the run really emitted `report` events', () => {
    const reports = driven.events.filter((event) => event.type === 'report')
    expect(reports.length).toBeGreaterThan(0)
    for (const report of reports) {
      expect(report.type === 'report' && report.facts.length).toBeGreaterThan(0)
    }
  })

  it('§8-5 (c) no minted `f` sentence is the note — a leaked fact would be minable', () => {
    const note = innerNote()
    const facts = driven.events.flatMap((event) => (event.type === 'report' ? event.facts : []))
    expect(facts.length).toBeGreaterThan(0)
    expect(facts.filter((sentence) => sentence.text.includes(note))).toEqual([])
  })

  it('§8-5 the trace is not vacuous — the note is a real, non-trivial string', () => {
    const note = innerNote()
    expect(note.length).toBeGreaterThan(4)
    // If it never reached anything at all, (a) above would be the only guard.
    expect(strings(of('reporter')[0]!.slots).some((text) => text.includes(note))).toBe(true)
  })
})

describe('§8-6 Call 1 and Call 3 get the same temperament', () => {
  it('§8-6 the rendered TEMPERAMENT is byte-identical across the two calls of one round', () => {
    const call1 = (of('judgment')[0]!.slots as Record<string, unknown>)['TEMPERAMENT']
    const call3 = (of('reporter')[0]!.slots as Record<string, unknown>)['TEMPERAMENT']
    expect(JSON.stringify(call1)).toBe(JSON.stringify(call3))
  })

  it('§8-6 it holds for every round the run reached, not just the first', () => {
    const judgments = of('judgment')
    const reporters = of('reporter')
    expect(judgments.length).toBeGreaterThan(0)
    expect(reporters.length).toBeGreaterThan(0)
    const rounds = Math.min(judgments.length, reporters.length)
    for (let round = 0; round < rounds; round += 1) {
      const a = (judgments[round]!.slots as Record<string, unknown>)['TEMPERAMENT']
      const b = (reporters[round]!.slots as Record<string, unknown>)['TEMPERAMENT']
      expect(JSON.stringify(a), `round ${round + 1}`).toBe(JSON.stringify(b))
    }
  })

  it('§8-6 the slot crosses as rendered prose, not as the structured pack', () => {
    const call1 = (of('judgment')[0]!.slots as Record<string, unknown>)['TEMPERAMENT']
    expect(typeof call1).toBe('string')
    expect((call1 as string).length).toBeGreaterThan(0)
  })
})

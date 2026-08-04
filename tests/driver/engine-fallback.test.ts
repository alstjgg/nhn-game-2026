// [e7#A5] — a failed call is an EVENT, and the run keeps going.
//
// Two halves, and both matter:
//
//   1. the seam shape — one `fallback` per failed call, emitted INSIDE that
//      call's `waiting` bracket (spec decision 5), so the client can reword the
//      pause before it clears;
//   2. the recovery — which is the ENGINE's, never the driver's (spec-engine
//      §5). The driver branches once, on `result.ok`, and hands the engine
//      `null`. It does not know what a default stance is, and `gateView()` does
//      not expose one; that asymmetry is the whole argument for where recovery
//      lives.
//
// e6 owns the retry budget (one retry, two attempts), so the driver sees one
// resolved outcome per call and emits at most one `fallback` for it.
import { describe, it, expect } from 'vitest'
import type { ViewEvent } from '../../src/shared/view-driver.ts'
import {
  drain,
  failingTransport,
  feedLines,
  makeRig,
  sentinelJudgment,
  shape,
} from './engine-fixtures/rig.ts'
import { twoRounds } from './engine-fixtures/pack.ts'

function fallbacks(events: ViewEvent[]): Extract<ViewEvent, { type: 'fallback' }>[] {
  return events.flatMap((event) => (event.type === 'fallback' ? [event] : []))
}

describe('[e7#A5] Call 1 fails', () => {
  it('(a) one `fallback{call:1}` lands between the judgment bracket’s two edges', async () => {
    const events = await drain(makeRig({ transport: failingTransport('judgment') }))
    expect(shape(events).slice(0, 4)).toEqual([
      'beat_start',
      'waiting:judgment:on',
      'fallback:1',
      'waiting:judgment:off',
    ])
    expect(fallbacks(events)).toEqual([{ type: 'fallback', call: 1, code: 'LLM_TIMEOUT', beat: 0 }])
  })

  it('(b) the run continues — `step()` still resolves true and the run reaches `run_end`', async () => {
    const rig = makeRig({ transport: failingTransport('judgment') })
    expect(await rig.driver.step()).toBe(true)
    const events = await drain(rig)
    expect(events.filter((event) => event.type === 'run_end').length).toBe(1)
  })

  it('(c) the engine substituted the authored default stance, so no utterance was minted', async () => {
    const events = await drain(makeRig({ transport: failingTransport('judgment') }))
    // The `u` channel is minted from Call 1's utterance and from nothing else;
    // a substituted stance carries no line, so the radio row is absent.
    expect(feedLines(events).filter((line) => line.kind === 'radio')).toEqual([])
    // …and the round still closed, which it could not have without a stance.
    expect(events.filter((event) => event.type === 'report').length).toBe(1)
  })
})

describe('[e7#A5] Call 2 fails', () => {
  it('(a) one `fallback{call:2}` per beat, inside that beat’s narration bracket', async () => {
    const events = await drain(makeRig({ transport: failingTransport('narration') }))
    expect(fallbacks(events).map((event) => event.call)).toEqual([2, 2])
    const beat = shape(events).slice(0, 9)
    expect(beat).toEqual([
      'beat_start',
      'waiting:judgment:on',
      'waiting:judgment:off',
      'feed:event',
      'feed:radio',
      'feed:symptom',
      'waiting:narration:on',
      'fallback:2',
      'waiting:narration:off',
    ])
  })

  it('(b) zero `n`/`q` lines that beat; `event`/`radio`/`symptom` still arrive', async () => {
    const events = await drain(makeRig({ transport: failingTransport('narration') }))
    const lines = feedLines(events)
    const minted = lines.flatMap((line) => (line.sentence_id ?? '').match(/-([nq])\d+$/) ?? [])
    expect(minted).toEqual([])
    expect(lines.map((line) => line.kind)).toEqual([
      'event',
      'radio',
      'symptom',
      'event',
      'symptom',
    ])
  })
})

describe('[e7#A5] Call 3 fails', () => {
  it('(a) one `fallback{call:3}` per round, inside that round’s report bracket', async () => {
    const events = await drain(makeRig({ pack: twoRounds(), transport: failingTransport('reporter') }))
    expect(fallbacks(events).map((event) => event.call)).toEqual([3, 3])
    const tokens = shape(events)
    const at = tokens.indexOf('fallback:3')
    expect(tokens.slice(at - 1, at + 3)).toEqual([
      'waiting:report:on',
      'fallback:3',
      'waiting:report:off',
      'report',
    ])
  })

  it('(b) the run continues past a failed round report', async () => {
    const rig = makeRig({ pack: twoRounds(), transport: failingTransport('reporter') })
    expect(await rig.driver.step()).toBe(true)
    // Beat 1 closes round 0 and its Call 3 fails; the run must not end there.
    expect(await rig.driver.step()).toBe(true)
  })

  it('(c) `facts` are non-empty from the objective log and `report_body` is the substitute', async () => {
    const events = await drain(makeRig({ transport: failingTransport('reporter') }))
    const reports = events.flatMap((event) => (event.type === 'report' ? [event] : []))
    expect(reports.length).toBe(1)
    const report = reports[0]
    expect(report?.facts.length).toBeGreaterThan(0)
    // The objective log — assembled round events — not model output.
    expect(report?.facts.map((sentence) => sentence.text)).toContain('남측 관측소가 신호를 놓쳤다.')
    expect(report?.report_body.length).toBeGreaterThan(0)
    for (const sentence of report?.report_body ?? []) expect(sentence.text.length).toBeGreaterThan(0)
    // Still engine-minted, on their own channels — a substitute is not an excuse
    // to emit an unminable sentence.
    expect(report?.facts.every((s) => /-f\d+$/.test(s.id))).toBe(true)
    expect(report?.report_body.every((s) => /-b\d+$/.test(s.id))).toBe(true)
  })

  // The objective log is NOT `EXPERIENCED`. §5's Call 3 row and contract §5's
  // input table are two different audiences: the prompt gets the `inner_note`,
  // the player's `f` channel does not (call contracts §6, "never shown to the
  // player directly"). Before this guard, a Call 3 fallback minted the note as
  // `facts` with NO model in the loop at all.
  it('(d) the objective log withholds this round’s `inner_note` — it is not Call 3’s prompt', async () => {
    const events = await drain(
      makeRig({
        transport: failingTransport('reporter', 'LLM_TIMEOUT', { judgment: sentinelJudgment() }),
      }),
    )
    const reports = events.flatMap((event) => (event.type === 'report' ? [event] : []))
    expect(reports.length).toBe(1)
    const texts = reports[0]!.facts.map((sentence) => sentence.text)

    expect(texts.filter((text) => text.includes('SENTINEL-INNER-NOTE'))).toEqual([])
    expect(JSON.stringify(events)).not.toContain('SENTINEL-INNER-NOTE')
    // Not vacuous: the SAME Call 1's utterance and the round's script events did
    // reach the log, so this is a withheld line and not an empty assembly.
    expect(texts.some((text) => text.includes('기록을 남긴다.'))).toBe(true)
    expect(texts).toContain('남측 관측소가 신호를 놓쳤다.')
  })
})

describe('[e7#A5] the bracket survives the failure path (A4 on the fallback path)', () => {
  it('(a) every `waiting` is still paired when every call fails', async () => {
    const events = await drain(makeRig({ pack: twoRounds(), transport: failingTransport() }))
    for (const label of ['judgment', 'narration', 'report'] as const) {
      const edges = events.flatMap((e) => (e.type === 'waiting' && e.for === label ? [e.active] : []))
      expect(edges.length).toBeGreaterThan(0)
      expect(edges).toEqual(edges.map((_, index) => index % 2 === 0))
    }
  })

  it('(b) exactly one `fallback` per call — the retry budget is e6’s, not the driver’s', async () => {
    const transport = failingTransport()
    const events = await drain(makeRig({ pack: twoRounds(), transport }))
    expect(fallbacks(events).length).toBe(transport.sent.length)
  })
})

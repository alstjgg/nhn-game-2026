// [e7#A8·A9] — the leak guarantee, enforced in the DRIVER and not in a window.
//
// spec-client §5.2's closing paragraph names what may never appear on the
// stream: `inner_note`, `because_*` / `rejected_*`, `temperament`, and truths
// beyond their exposure. The whole `JudgmentResponse` legitimately crosses into
// the engine — its `inner_note` is Call 3's input (contract §5) — so the check
// cannot live at the ingest edge. It lives on the way OUT, at the driver's one
// emit choke point, which is why a window can be written by anyone and still
// cannot leak.
import { describe, it, expect } from 'vitest'
import { assertSeamClean, createEmitter } from '../../src/driver/index.ts'
import type { FeedLine, Sentence, ViewEvent } from '../../src/shared/view-driver.ts'
import { createFixtureProvider } from '../../src/transport/index.ts'
import {
  SENTINELS,
  allStrings,
  drain,
  makeRig,
  sentinelJudgment,
} from './engine-fixtures/rig.ts'
import { twoRounds } from './engine-fixtures/pack.ts'

/** A9's key families, one representative each. */
const BANNED_KEYS = [
  'inner_note',
  'because_referent',
  'because_block_ids',
  'rejected_stance',
  'rejected_reason',
  'temperament',
  'truths',
  'truths_seen',
] as const

/** Adds a key the seam type cannot name — which is exactly what the guard is for. */
function pollute<T extends object>(value: T, key: string): T {
  return Object.assign({ ...value }, { [key]: 'POLLUTION' })
}

function sentence(): Sentence {
  return { id: 'b-r1-f01', text: '관측소가 신호를 놓쳤다.', species: 'fact' }
}

function line(): FeedLine {
  return { kind: 'event', clock: '09:00', text: '회선이 열렸다.', sentence_id: 't1' }
}

/**
 * Overridden so the fixture reporter does not echo `EXPERIENCED` back verbatim.
 * That echo is a property of the offline double, not of the driver — see
 * `discovery/e7.md`, which records that a *value*-level echo of the note is a
 * reporter-prompt concern the key-level guard cannot and should not catch.
 */
function cleanReporter() {
  return {
    reporter: { facts: ['관측소가 신호를 놓쳤다.'], report_body: '기록을 남겼다. 근거는 회선 기록이다.' },
  }
}

describe('[e7#A8] the private half of Call 1 never reaches the stream', () => {
  it('(a) no sentinel from `inner_note`/`because_*`/`rejected_*` appears anywhere in the stream', async () => {
    const events = await drain(
      makeRig({
        pack: twoRounds(),
        transport: createFixtureProvider({ judgment: sentinelJudgment(), ...cleanReporter() }),
      }),
    )
    const haystack = JSON.stringify(events)
    for (const sentinel of SENTINELS) {
      expect(haystack, `\`${sentinel}\` crossed the seam`).not.toContain(sentinel)
    }
  })

  it('(b) the utterance — the one field of Call 1 that MAY cross — did cross', async () => {
    const events = await drain(
      makeRig({
        transport: createFixtureProvider({ judgment: sentinelJudgment(), ...cleanReporter() }),
      }),
    )
    // Without this the test above would pass on an empty stream.
    expect(allStrings(events)).toContain('기록을 남긴다.')
  })

  it('(c) the guard lives in `src/driver/`, and a polluted event thrown at it throws', () => {
    const polluted: ViewEvent = { type: 'feed', line: pollute(line(), 'inner_note') }
    expect(() => assertSeamClean(polluted)).toThrow(/inner_note/)
  })

  it('(d) a polluted line reaching the driver’s emit choke point takes the STEP down, not a window', async () => {
    const rig = makeRig({
      wrapEngine: (engine) => ({
        ...engine,
        feed: () => engine.feed().map((raw) => pollute(raw, 'rejected_stance')),
      }),
    })
    await expect(rig.driver.step()).rejects.toThrow(/rejected_stance/)
    // Nothing polluted was handed to a subscriber before the throw.
    expect(JSON.stringify(rig.events)).not.toContain('POLLUTION')
  })
})

describe('[e7#A9] the guard is key-level, deep, and array-aware', () => {
  for (const key of BANNED_KEYS) {
    it(`(a:${key}) a \`${key}\` nested inside a report sentence throws`, () => {
      const event: ViewEvent = {
        type: 'report',
        round: 0,
        facts: [sentence(), pollute(sentence(), key)],
        report_body: [],
      }
      expect(() => assertSeamClean(event)).toThrow(new RegExp(key))
    })
  }

  it('(b) a clean event passes and is returned, so the guard cannot be skipped by accident', () => {
    const event: ViewEvent = { type: 'beat_start', beat: 0, clock: '09:00' }
    expect(assertSeamClean(event)).toBe(event)
  })

  it('(c) a cycle does not hang the guard', () => {
    const facts = [sentence()]
    const event: ViewEvent = { type: 'report', round: 0, facts, report_body: facts }
    expect(assertSeamClean(event)).toBe(event)
  })

  it('(d) every emitted event passes the guard — count of invocations === count emitted', () => {
    let guarded = 0
    const emitter = createEmitter((event) => {
      guarded += 1
      return assertSeamClean(event)
    })
    const seen: ViewEvent[] = []
    emitter.subscribe((event) => seen.push(event))

    const stream: ViewEvent[] = [
      { type: 'beat_start', beat: 0, clock: '09:00' },
      { type: 'feed', line: line() },
      { type: 'waiting', active: true, for: 'judgment' },
      { type: 'waiting', active: false, for: 'judgment' },
      { type: 'beat_end', beat: 0, clock: '09:00' },
    ]
    for (const event of stream) emitter.emit(event)

    expect(guarded).toBe(stream.length)
    expect(seen.length).toBe(stream.length)
  })

  it('(e) the guard runs BEFORE any subscriber sees the event', () => {
    const emitter = createEmitter()
    const seen: ViewEvent[] = []
    emitter.subscribe((event) => seen.push(event))
    expect(() => emitter.emit({ type: 'feed', line: pollute(line(), 'because_referent') })).toThrow()
    expect(seen).toEqual([])
  })

  it('(f) unsubscribing stops delivery without disturbing the guard', () => {
    const emitter = createEmitter()
    const seen: ViewEvent[] = []
    const off = emitter.subscribe((event) => seen.push(event))
    emitter.emit({ type: 'beat_start', beat: 0, clock: '09:00' })
    off()
    emitter.emit({ type: 'beat_end', beat: 0, clock: '09:00' })
    expect(seen.length).toBe(1)
  })
})

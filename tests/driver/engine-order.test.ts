// [e7#A1·A2·A3·A4·A6·A7·A13] — the ratified ViewEvent order.
//
// This is the run's first real integration point: e2's state core, e3's beat
// driver, e4's feed builders, e5's composer and e6's transport all run
// unmodified behind `createLiveDriver`. Nothing here re-tests any of them; what
// is asserted is the ORDER the driver puts them in, which is spec-client §5.2
// plus spec-engine §4.1/§4.2 and belongs to no other unit.
import { describe, it, expect } from 'vitest'
import type { ViewEvent } from '../../src/shared/view-driver.ts'
import { createFixtureProvider } from '../../src/transport/index.ts'
import {
  spyOn,
  beatSpans,
  createRecorder,
  drain,
  makeRig,
  recordComposer,
  recordEngine,
  recordTransport,
  shape,
  typesOf,
} from './engine-fixtures/rig.ts'
import { gatelessRun, leadingScriptRun, twoRounds } from './engine-fixtures/pack.ts'

/** A1 — the gate beat, as a full array, not a subsequence. */
const GATE_BEAT = [
  'beat_start',
  'waiting:judgment:on',
  'waiting:judgment:off',
  'feed:event', // the authored script line (`t*`, id inherited)
  'feed:radio', // the utterance (`u`)
  'feed:symptom', // the renderer's output — carries no id, never minable
  'waiting:narration:on',
  'waiting:narration:off',
  'feed:event', // `n` …
  'feed:event',
  'feed:npc', // `q`
  'beat_end',
] as const

/** A2 — the script beat. No `waiting:judgment` anywhere in it. */
const SCRIPT_BEAT = [
  'beat_start',
  'feed:event',
  'feed:symptom',
  'waiting:narration:on',
  'waiting:narration:off',
  'feed:event',
  'feed:event',
  'feed:npc',
  'beat_end',
] as const

function sliceOf(events: ViewEvent[], beat: number): ViewEvent[] {
  const span = beatSpans(events).find((candidate) => candidate.beat === beat)
  if (span === undefined) throw new Error(`no beat ${beat} in the stream`)
  return events.slice(span.from, span.to + 1)
}

describe('[e7#A1] a gate beat emits exactly the ratified sequence', () => {
  it('(a) beat_start → judgment bracket → pre-flush → narration bracket → post-flush → beat_end', async () => {
    const events = await drain(makeRig({ shaped: true }))
    expect(shape(sliceOf(events, 0))).toEqual([...GATE_BEAT])
  })

  it('(b) the utterance reaches the feed on the PRE-narration flush, not after', async () => {
    const events = await drain(makeRig())
    const beat = shape(sliceOf(events, 0))
    expect(beat.indexOf('feed:radio')).toBeLessThan(beat.indexOf('waiting:narration:on'))
  })
})

describe('[e7#A2] a script beat emits exactly the ratified sequence', () => {
  it('(a) no judgment bracket, one narration bracket, two flushes', async () => {
    const events = await drain(makeRig())
    expect(shape(sliceOf(events, 1))).toEqual([...SCRIPT_BEAT])
  })

  it('(b) `waiting(judgment)` never appears on a gateless run at all', async () => {
    const events = await drain(makeRig({ pack: gatelessRun() }))
    const judgments = events.filter((e) => e.type === 'waiting' && e.for === 'judgment')
    expect(judgments).toEqual([])
  })
})

describe('[e7#A3] the round boundary', () => {
  it('(a) the report bracket follows the round’s last beat_end, and the report follows it', async () => {
    const events = await drain(makeRig())
    const tail = shape(events).slice(shape(events).lastIndexOf('beat_end'))
    expect(tail).toEqual(['beat_end', 'waiting:report:on', 'waiting:report:off', 'report', 'run_end'])
  })

  it('(b) exactly one report per round', async () => {
    const events = await drain(makeRig({ pack: twoRounds() }))
    const rounds = events.flatMap((e) => (e.type === 'report' ? [e.round] : []))
    expect(rounds).toEqual([0, 1])
  })

  it('(c) a beat before the first gate owes no report (decision 10)', async () => {
    const events = await drain(makeRig({ shaped: true, pack: leadingScriptRun() }))
    const firstReport = events.findIndex((e) => e.type === 'report')
    const firstJudgment = events.findIndex((e) => e.type === 'waiting' && e.for === 'judgment')
    expect(firstJudgment).toBeGreaterThan(-1)
    expect(firstReport).toBeGreaterThan(firstJudgment)
  })

  it('(d) a run with no gate emits no report at all', async () => {
    const events = await drain(makeRig({ pack: gatelessRun() }))
    expect(typesOf(events)).not.toContain('report')
  })
})

describe('[e7#A4] every `waiting(x,true)` is closed', () => {
  const CASES = ['judgment', 'narration', 'report'] as const

  for (const label of CASES) {
    it(`(a:${label}) the on/off counts match and no two \`on\`s nest`, async () => {
      const events = await drain(makeRig({ pack: twoRounds() }))
      const edges = events.flatMap((e) => (e.type === 'waiting' && e.for === label ? [e.active] : []))
      expect(edges.filter((active) => active).length).toBe(edges.filter((a) => !a).length)
      expect(edges).toEqual(edges.map((_, i) => i % 2 === 0))
    })
  }
})

describe('[e7#A6] `beatView()` is never taken early', () => {
  it('(a) effects < beatView < composer.narration < transport.send(narration), every beat', async () => {
    const recorder = createRecorder()
    await drain(
      makeRig({
        pack: twoRounds(),
        wrapEngine: (engine) => recordEngine(engine, recorder),
        wrapComposer: (composer) => recordComposer(composer, recorder),
        wrapTransport: (transport) => recordTransport(transport, recorder),
      }),
    )

    const names = recorder.names()
    // Walk beat by beat: each `applyBeatEffects` opens a window that its own
    // `beatView` → `composer.narration` → `transport.send:narration` must fill,
    // in that order, before the next `applyBeatEffects`.
    const starts = names.flatMap((name, i) => (name === 'engine.applyBeatEffects' ? [i] : []))
    expect(starts.length).toBe(4)

    starts.forEach((start, ordinal) => {
      const end = starts[ordinal + 1] ?? names.length
      const window = names.slice(start, end)
      const view = window.indexOf('engine.beatView')
      const compose = window.indexOf('composer.narration')
      const send = window.indexOf('transport.send:narration')
      expect(view, `beat ${ordinal}: beatView`).toBeGreaterThan(0)
      expect(compose, `beat ${ordinal}: composer.narration`).toBeGreaterThan(view)
      expect(send, `beat ${ordinal}: transport.send`).toBeGreaterThan(compose)
    })
  })

  it('(b) `submitStance` precedes its beat’s `applyBeatEffects`', async () => {
    const recorder = createRecorder()
    await drain(makeRig({ wrapEngine: (engine) => recordEngine(engine, recorder) }))
    const names = recorder.names()
    expect(names.indexOf('engine.submitStance')).toBeLessThan(
      names.indexOf('engine.applyBeatEffects'),
    )
  })
})

describe('[e7#A7] no view is held across a beat', () => {
  it('(a) each composer call receives the object the immediately preceding view call returned', async () => {
    const recorder = createRecorder()
    await drain(
      makeRig({
        // Shaped, so both gates are asked: unshaped there are no
        // `composer.judgment` entries to pair at all, and the count below
        // would drop to the narration and reporter halves without noticing.
        shaped: true,
        pack: twoRounds(),
        wrapEngine: (engine) => recordEngine(engine, recorder),
        wrapComposer: (composer) => recordComposer(composer, recorder),
      }),
    )

    const PAIRS: Record<string, string> = {
      'composer.judgment': 'engine.gateView',
      'composer.narration': 'engine.beatView',
      'composer.reporter': 'engine.roundView',
    }

    let checked = 0
    recorder.log.forEach((entry, index) => {
      const source = PAIRS[entry.name]
      if (source === undefined) return
      const previous = recorder.log[index - 1]
      expect(previous?.name, `${entry.name} at ${index}`).toBe(source)
      // Identity, not equality: a held or re-cloned view would fail here.
      expect(entry.value).toBe(previous?.value)
      checked += 1
    })
    expect(checked).toBe(2 + 4 + 2)
  })

  it('(b) mutating a delivered view cannot reach the next beat’s payload', async () => {
    const transport = spyOn(createFixtureProvider())
    let mutations = 0
    await drain(
      makeRig({
        pack: twoRounds(),
        transport,
        wrapComposer: (composer) => ({
          judgment: composer.judgment,
          narration: (view) => {
            // Poison the first beat's view only — the caller's mutation, made
            // after the engine handed the object over.
            if (mutations === 0) {
              view.TIMELINE_TAIL.push('MUTATED')
              mutations += 1
            }
            return composer.narration(view)
          },
          reporter: composer.reporter,
        }),
      }),
    )

    const narrations = transport.sent.filter((request) => request.call_type === 'narration')
    expect(narrations.length).toBe(4)
    // The probe fired …
    expect(JSON.stringify(narrations[0])).toContain('MUTATED')
    // … and nothing carried it forward: each beat's view is built fresh.
    for (const request of narrations.slice(1)) {
      expect(JSON.stringify(request)).not.toContain('MUTATED')
    }
  })
})

describe('[e7#A13] `meta` is not this unit’s channel (decision 2)', () => {
  it('(a) no `meta` event is ever emitted by the live driver', async () => {
    const events = await drain(makeRig({ pack: twoRounds() }))
    expect(typesOf(events)).not.toContain('meta')
  })
})

// The binder — one place where the merged `src/**` modules are wired into a
// runnable headless rig, and the only place e7's `createLiveDriver` is called.
//
// WHAT THIS IS NOT. There is no engine logic here. Every delta, every symptom
// sentence, every id, every feed line and every routing decision comes out of
// `src/engine/index.ts`'s `createEngine` — the composition root — through the
// `EngineHandle` it returns; this file only threads the pack data in and keeps
// the run-record's own bookkeeping (the beat-number offset, per-beat journals,
// gate/stance pairing) that is not part of the engine's contract. `buildSchedule`
// below is a second, read-only build, used for exactly one lookup — the
// authored gate's `id` and `defaultStance`, neither of which `GateView`
// exposes — never to drive state; `createEngine` builds and owns its own copy.
//
// The one number this file owns is the beat *number*: `src/engine/beat` indexes
// its schedule from 0 (and the driver's `beat_start`/`beat_end`/`fallback`
// events carry that 0-based cursor verbatim — see `tests/driver/engine-order.test.ts`),
// but the run-record schema pins `beat` to an integer ≥ 1. The offset is
// applied once, in the `recordingEngine` wrapper below, to everything this
// file's own `createLiveDriver` call can see — never inside `src/engine/**`,
// which stays 0-based for every other caller.

import { createEngine } from '../../../src/engine/index.ts'
import { buildSchedule } from '../../../src/engine/beat/index.ts'
import { createComposer } from '../../../src/composer/index.ts'
import { createBlockStore, createLiveDriver } from '../../../src/driver/index.ts'
import { recordingTransport } from './record.mjs'

/**
 * Wires one run and hands back the driver plus the two seams the recorder
 * reads: the `ViewEvent` stream (with the recorder's own `(beat, gate, stance)`
 * annotation interleaved) and the Call 1 / Call 3 payloads, verbatim.
 */
export function bindRun({ pack, guidance, provider, run }) {
  // Read-only — see the file header. Never advanced, never applied to.
  const schedule = buildSchedule(pack.timeline, pack.gates)

  const engine = createEngine({ pack, run })
  const recorder = recordingTransport(provider)
  const events = []
  const journals = []

  // The stance is Call 1's, and the beat it belongs to is the driver's cursor
  // at the moment the call returns. No `ViewEvent` carries the pairing, so the
  // recorder writes it down here, on the same stream, in the same order.
  const transport = {
    mode: recorder.transport.mode,
    async send(request) {
      const result = await recorder.transport.send(request)
      if (request.call_type === 'judgment') {
        const cursor = engine.current()
        const gate = schedule[cursor.index].gate
        events.push({
          type: 'gate_stance',
          beat: cursor.index + 1,
          gate: gate.id,
          stance: result.ok ? result.body.stance : gate.defaultStance,
        })
      }
      return result
    },
  }

  const blocks = createBlockStore()
  const composer = createComposer({ blocks, reportGuidance: guidance })

  // The record-numbering offset, applied once, plus the per-beat journal
  // capture — taken before the real engine resets it on advance. Every other
  // call passes straight through to the real engine; nothing here recomputes
  // a delta, a symptom, an id or a routing decision.
  const recordingEngine = {
    ...engine,
    current: () => ({ ...engine.current(), index: engine.current().index + 1 }),
    advance() {
      journals.push({ beat: engine.current().index + 1, deltas: engine.journal() })
      return engine.advance()
    },
  }

  const driver = createLiveDriver({ engine: recordingEngine, composer, transport, blocks, run })
  driver.subscribe((event) => {
    events.push(event)
  })

  return { driver, events, journals, calls: recorder.calls }
}

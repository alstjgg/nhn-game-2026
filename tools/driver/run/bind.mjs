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
import {
  baselineState,
  createBlockStore,
  createLiveDriver,
  createScorer,
  scoreRecord,
} from '../../../src/driver/index.ts'
import { recordingTransport } from './record.mjs'

/**
 * Carry-over, wired into the run. A block in the run loop's meta-state is one
 * the player mined in an earlier run, so the run it is carried *into* has to
 * know it: the composer resolves `BLOCKS` against this store, and
 * `createMembrane` answers `deny('unknown_block')` to any `slot`/`deploy`
 * naming an id the store never saw. A record whose `injected_blocks` names a
 * block the driver cannot resolve is a record of a run that never had it.
 *
 * The store's only public path into the mined tier is absorb-then-mine, so that
 * is the path taken here — no second store, no reach into the store's
 * internals. `absorbLine` reads `sentence_id` and `text` and nothing else; the
 * `kind`/`clock` below exist to satisfy the `FeedLine` shape. This line is not
 * a view event: it is never emitted, never enters the feed and never reaches
 * `timeline`.
 */
function seedCarried(blocks, carried) {
  for (const block of carried) {
    blocks.absorbLine({ kind: 'mark', clock: '00:00', text: block.text, sentence_id: block.id })
    if (!blocks.mine(block.id)) {
      throw new Error(`carried block ${JSON.stringify(block.id)} could not be seeded into the run`)
    }
  }
}

/**
 * Wires one run and hands back the driver plus the two seams the recorder
 * reads: the `ViewEvent` stream (with the recorder's own `(beat, gate, stance)`
 * annotation interleaved) and the Call 1 / Call 3 payloads, verbatim.
 *
 * `carried` is the run loop's carry-over **for this run** — `[]` on run 1.
 */
export function bindRun({ pack, guidance, provider, run, carried = [] }) {
  // Read-only — see the file header. Never advanced, never applied to.
  const schedule = buildSchedule(pack.timeline, pack.gates)

  const engine = createEngine({ pack, run })
  const recorder = recordingTransport(provider)
  const events = []
  const journals = []

  // The stance is Call 1's, and the beat it belongs to is the driver's cursor
  // at the moment the call returns. No `ViewEvent` carries the pairing, so the
  // recorder writes it down here, on the same stream, in the same order.
  //
  // `ok` is not enough to read a stance off the body. A 200 that lands without
  // one is *unusable*, not a judgment — `readJudgment` in the live driver
  // narrows on `'stance' in body` for exactly that reason, and the recorder has
  // to agree with it or the two disagree about the same call. Reading
  // `result.body.stance` off an ok-but-empty body yielded `undefined`, which is
  // not a legal `beats[].stance`, so `persistRun` refused the whole record and
  // a run with seven correctly-graded fallbacks produced no artifact at all.
  const transport = {
    mode: recorder.transport.mode,
    async send(request) {
      const result = await recorder.transport.send(request)
      if (request.call_type === 'judgment') {
        const cursor = engine.current()
        const gate = schedule[cursor.index].gate
        const judged = result.ok && 'stance' in result.body
        events.push({
          type: 'gate_stance',
          beat: cursor.index + 1,
          gate: gate.id,
          stance: judged ? result.body.stance : gate.defaultStance,
        })
      }
      return result
    },
  }

  const blocks = createBlockStore()
  seedCarried(blocks, carried)
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

  // The same scorer the browser binder builds, over the same pack file — the
  // two roots stay symmetrical, which is what makes a headless replay evidence
  // about the thing the judge plays.
  const baseline = baselineState(pack)
  const scorer = createScorer(pack.score, () => engine.snapshot(), baseline)

  const driver = createLiveDriver({ engine: recordingEngine, composer, transport, blocks, scorer, run })
  driver.subscribe((event) => {
    events.push(event)
  })

  // The record's half of the same reading, deferred: `run-record.schema.json`
  // indexes units by `id` and the §5.2 event carries labels, so neither shape
  // can be recovered from the other (see `src/driver/scorer.ts`). Called after
  // the run, against the state it ended in.
  const score = () => scoreRecord(pack.score, engine.snapshot(), baseline)

  return { driver, events, journals, calls: recorder.calls, score }
}

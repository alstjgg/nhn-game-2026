// The binder — one place where the merged `src/**` modules are wired into a
// runnable headless rig, and the only place e7's `createLiveDriver` is called.
//
// WHAT THIS IS NOT. There is no engine logic here. Every delta, every symptom
// sentence, every id, every feed line and every routing decision comes out of
// `src/engine/**` through the ports those modules already declare; this file
// only supplies the three adapters those ports need (a state core, a round
// assembler, a block store) and threads the pack data in. If a rule can be
// stated about the game, it is not stated here.
//
// The one number this file owns is the beat *number*: `src/engine/beat` indexes
// its schedule from 0, the run-record schema pins `beat` to an integer ≥ 1, so
// the cursor is offset by one on the way out. That is record numbering, not
// state.

import {
  buildSchedule,
  createBeatDriver,
} from '../../../src/engine/beat/index.ts'
import {
  applyEffects,
  initState,
  renderSymptoms as symptomsOf,
} from '../../../src/engine/state/index.ts'
import {
  assembleExperienced,
  buildFeed,
  buildReportSentences,
  createIdAllocator,
} from '../../../src/engine/feed/index.ts'
import { createComposer } from '../../../src/composer/compose.ts'
import { createBlockStore, createLiveDriver } from '../../../src/driver/index.ts'
import { recordingTransport } from './record.mjs'

/** What `applyReport` substitutes when Call 3 never landed (spec-engine §5). */
const NO_REPORT_BODY = '(보고서 없음 — 콜 3 미도달)'

/**
 * The state core, as `StateCorePort`. `applyEffects` / `initState` /
 * the symptom renderer are `src/engine/state`'s; this adapter adds the journal
 * accumulator the port asks for and a beat boundary the recorder can read.
 */
function createStateCore(pack) {
  const state = initState(pack.characters)
  let entries = []

  return {
    applyDeltas: (deltas, cause) => {
      entries = entries.concat(applyEffects(state, { deltas }, cause))
    },
    applyFlags: (flags, cause) => {
      entries = entries.concat(applyEffects(state, { flags }, cause))
    },
    read: (variable) => state.scalars[variable] ?? 0,
    readFlag: (id) => state.flags[id] ?? false,
    journal: () => entries.map((entry) => ({ ...entry })),
    renderSymptoms: () => symptomsOf(entries, pack.symptoms),
    snapshot: () => ({ ...state.scalars, ...state.flags }),
    /** Opens a fresh beat journal. Called by the port's `advance`. */
    openBeat: () => {
      entries = []
    },
  }
}

/**
 * The round accumulator behind `RoundAssemblerPort`. It holds one
 * `RoundInput` per round and hands it to `assembleExperienced` — the §5 table
 * itself is that function's, never restated here.
 */
function createRounds(temperament) {
  const byRound = new Map()

  const ensure = (index) => {
    let held = byRound.get(index)
    if (held === undefined) {
      held = { gate: { utterance: '', inner_note: '' }, beats: [], temperament }
      byRound.set(index, held)
    }
    return held
  }

  return {
    openRound(index, gate) {
      if (index !== null) ensure(index).gate = gate
    },
    addBeat(index, entry) {
      if (index !== null) ensure(index).beats.push(entry)
    },
    addNarration(index, narration) {
      if (index === null) return
      const round = ensure(index)
      const last = round.beats[round.beats.length - 1]
      if (last !== undefined) last.narration = narration
    },
    input: (index) => ensure(index),
  }
}

/**
 * `EnginePort` over the merged leaves. The beat chain, the views and the
 * routing are `createBeatDriver`'s; what this adds is the feed assembly order
 * the §5.2 seam needs — script lines flush before the narration pause, the
 * utterance and Call 2's output flush after it — and the per-beat journal the
 * recorder reads.
 */
function createEnginePort({ pack, schedule, state, ids, rounds, journals }) {
  const assembler = { experienced: (index) => assembleExperienced(rounds.input(index)) }
  const beats = createBeatDriver({ schedule, state, assembler, pack })

  let lines = []
  let utterance = ''

  const beatNow = () => schedule[beats.current().index]

  const scriptLinesOf = (beat) => beat.events.map((event) => ({ id: event.id, text: event.text }))

  return {
    current() {
      const cursor = beats.current()
      return {
        index: cursor.index + 1,
        clock: cursor.clock,
        kind: cursor.kind,
        roundIndex: cursor.roundIndex,
        isRoundLast: cursor.isRoundLast,
      }
    },

    gateView: () => beats.gateView(),
    beatView: () => beats.beatView(),
    roundView: () => beats.roundView(),
    feed: () => lines,

    submitStance(response) {
      const cursor = beats.current()
      const gate = beatNow().gate
      // `null` ⇒ the gate's authored fallback. The driver never knows this id.
      const stance = response === null ? gate.defaultStance : response.stance
      utterance = response === null ? '' : response.utterance
      rounds.openRound(cursor.roundIndex, {
        utterance,
        inner_note: response === null ? '' : response.inner_note,
      })
      beats.submitStance({ stance, utterance })
    },

    applyBeatEffects() {
      beats.applyBeatEffects()
      const beat = beatNow()
      const cursor = beats.current()
      const scriptLines = scriptLinesOf(beat)
      const present = beats.beatView().PRESENT_NPCS

      // The pre-narration flush: authored events only. They carry authored ids,
      // so nothing is allocated here and the post-narration half numbers
      // exactly as a single-pass build would.
      lines = buildFeed({ clock: beat.clock, scriptLines, present }, ids).lines
      beats.recordLines(lines.map((line) => line.text))
      rounds.addBeat(cursor.roundIndex, { scriptLines, present })
    },

    applyNarration(response) {
      const beat = beatNow()
      const cursor = beats.current()
      const view = beats.beatView()
      const narration =
        response === null
          ? undefined
          : { timeline_entries: response.timeline_entries, npc_lines: response.npc_lines }

      const built = buildFeed(
        {
          clock: beat.clock,
          judgment: { utterance },
          narration,
          present: view.PRESENT_NPCS,
          symptoms: view.SCENE_SYMPTOMS,
        },
        ids,
      )
      lines = lines.concat(built.lines)
      beats.recordLines(
        built.lines.filter((line) => line.kind !== 'symptom').map((line) => line.text),
      )
      rounds.addNarration(cursor.roundIndex, narration)
    },

    applyReport(response) {
      const input =
        response === null
          ? { facts: beats.roundView().EXPERIENCED, report_body: NO_REPORT_BODY }
          : { facts: response.facts, report_body: response.report_body }
      return buildReportSentences(input, ids)
    },

    advance() {
      journals.push({ beat: beats.current().index + 1, deltas: state.journal() })
      const moved = beats.advance()
      lines = []
      utterance = ''
      state.openBeat()
      return moved
    },
  }
}

/**
 * Wires one run and hands back the driver plus the two seams the recorder
 * reads: the `ViewEvent` stream (with the recorder's own `(beat, gate, stance)`
 * annotation interleaved) and the Call 1 / Call 3 payloads, verbatim.
 */
export function bindRun({ pack, guidance, provider, run }) {
  const schedule = buildSchedule(pack.timeline, pack.gates)
  const state = createStateCore(pack)
  const ids = createIdAllocator(run)
  const rounds = createRounds(pack.temperament)
  const journals = []
  const events = []

  const engine = createEnginePort({ pack, schedule, state, ids, rounds, journals })
  const recorder = recordingTransport(provider)

  // The stance is Call 1's, and the beat it belongs to is the driver's cursor
  // at the moment the call returns. No `ViewEvent` carries the pairing, so the
  // recorder writes it down here, on the same stream, in the same order.
  const transport = {
    mode: recorder.transport.mode,
    async send(request) {
      const result = await recorder.transport.send(request)
      if (request.call_type === 'judgment') {
        const cursor = engine.current()
        const gate = schedule[cursor.index - 1].gate
        events.push({
          type: 'gate_stance',
          beat: cursor.index,
          gate: gate.id,
          stance: result.ok ? result.body.stance : gate.defaultStance,
        })
      }
      return result
    },
  }

  const blocks = createBlockStore()
  const composer = createComposer({ blocks, reportGuidance: guidance })
  const driver = createLiveDriver({ engine, composer, transport, blocks, run })
  driver.subscribe((event) => {
    events.push(event)
  })

  return { driver, events, journals, calls: recorder.calls }
}

// [e7] — the `EnginePort` the live driver is integrated against.
//
// This is a HARNESS, not product code, and the distinction is load-bearing:
// spec decision 1 says the driver wraps and never mints, so the object that
// binds e2's state core + e3's beat driver + e4's feed builders into one port
// cannot live in `src/driver/` — it would drag id minting inside the driver.
// `src/engine/index.ts` is e0's frozen skeleton and the scaffold suite pins its
// factory as a throwing stub, so it cannot live there either (yet). It lives
// here, and everything it calls is the real merged slice:
//
//   buildSchedule · createBeatDriver · initState · applyEffects ·
//   renderSymptoms · createIdAllocator · buildFeed · classifyNpcLines ·
//   buildReportSentences · assembleExperienced
//
// The only thing this file authors is the glue the engine's own barrel will
// eventually own — see `discovery/e7.md`.
import { buildSchedule } from '../../../src/engine/beat/schedule.ts'
import { createBeatDriver } from '../../../src/engine/beat/driver.ts'
import type { Beat } from '../../../src/engine/beat/schedule.ts'
import type { DeltaEntry, RoundAssemblerPort, StateCorePort } from '../../../src/engine/beat/ports.ts'
import { applyEffects, initState, renderSymptoms } from '../../../src/engine/state/index.ts'
import type { RunState } from '../../../src/engine/state/index.ts'
import {
  assembleExperienced,
  buildFeed,
  buildReportSentences,
  classifyNpcLines,
  createIdAllocator,
} from '../../../src/engine/feed/index.ts'
import type { RoundBeatInput, ScriptLine } from '../../../src/engine/feed/types.ts'
import type {
  JudgmentResponse,
  NarrationResponse,
  PresentNpc,
  ReporterResponse,
} from '../../../src/shared/contracts.ts'
import type { Symptoms } from '../../../src/shared/datapack.ts'
import type { FeedLine } from '../../../src/shared/view-driver.ts'
import type { BeatCursor, EnginePort, ReportSentences } from '../../../src/driver/ports.ts'
import type { EnginePack } from './pack.ts'

/**
 * spec-engine §5's substitute body. The driver asserts only that it is
 * non-empty and segments to at least one block — never the literal.
 */
export const SUBSTITUTE_REPORT_BODY = '보고를 생성하지 못했다. 이 라운드의 기록은 객관 로그로 남는다.'

type BeatRecord = RoundBeatInput & { roundIndex: number | null }

/** The state core, as e3's port sees it, over e2's pure functions. */
function createStateCore(symptomsPack: Symptoms, state: RunState) {
  let entries: DeltaEntry[] = []

  const port: StateCorePort = {
    applyDeltas(deltas, cause) {
      entries.push(...applyEffects(state, { deltas }, cause))
    },
    applyFlags(flags, cause) {
      entries.push(...applyEffects(state, { flags }, cause))
    },
    read: (variable) => state.scalars[variable] ?? 0,
    readFlag: (id) => state.flags[id] ?? false,
    journal: () => [...entries],
    renderSymptoms: () => renderSymptoms(entries, symptomsPack),
    snapshot: () => ({ ...state.scalars, ...state.flags }),
  }

  return {
    port,
    /** The beat boundary: last beat's journal must not colour this beat's symptoms. */
    reset(): void {
      entries = []
    },
  }
}

export type ScriptedEngineDeps = { pack: EnginePack; run?: number }

export function createScriptedEngine(deps: ScriptedEngineDeps): EnginePort {
  const { pack } = deps
  const schedule: Beat[] = buildSchedule(pack.timeline, pack.gates)
  const ids = createIdAllocator(deps.run ?? 1)
  const core = createStateCore(pack.symptoms, initState(pack.characters))

  const records: BeatRecord[] = []
  const roundGates = new Map<number, { utterance: string; inner_note: string }>()

  const assembler: RoundAssemblerPort = {
    experienced(roundIndex: number): string[] {
      return assembleExperienced({
        gate: roundGates.get(roundIndex) ?? { utterance: '', inner_note: '' },
        beats: records.filter((record) => record.roundIndex === roundIndex),
        temperament: pack.temperament,
      })
    },
  }

  const beats = createBeatDriver({ schedule, state: core.port, assembler, pack })

  /** This beat's lines, in mint order. Reset by `advance()` (spec decision 1). */
  let lines: FeedLine[] = []
  let utterance = ''
  let present: PresentNpc[] = []

  function beatNow(): Beat {
    const beat = schedule[beats.current().index]
    if (beat === undefined) throw new Error('the schedule holds no beat at the cursor')
    return beat
  }

  function scriptLinesOf(beat: Beat): ScriptLine[] {
    return beat.events.map((event) => ({ id: event.id, text: event.text }))
  }

  function recordOf(beat: Beat): BeatRecord {
    const held = records[beat.index]
    if (held !== undefined) return held
    const fresh: BeatRecord = {
      roundIndex: beat.roundIndex,
      scriptLines: scriptLinesOf(beat),
      present: [],
    }
    records[beat.index] = fresh
    return fresh
  }

  return {
    current(): BeatCursor {
      return beats.current()
    },

    gateView: () => beats.gateView(),
    beatView: () => beats.beatView(),
    roundView: () => beats.roundView(),

    feed: (): FeedLine[] => [...lines],

    submitStance(response: JudgmentResponse | null): void {
      const beat = beatNow()
      if (beat.gate === null) throw new Error(`beat ${beat.index} carries no gate`)
      // §5 recovery: the authored default stance, which `gateView()` does not
      // expose — this is why substituting it has to be the engine's move.
      const stance = response === null ? beat.gate.defaultStance : response.stance
      utterance = response === null ? '' : response.utterance
      if (beat.roundIndex !== null) {
        roundGates.set(beat.roundIndex, {
          utterance,
          inner_note: response === null ? '' : response.inner_note,
        })
      }
      beats.submitStance({ stance, utterance })
    },

    applyBeatEffects(): void {
      beats.applyBeatEffects()
      const beat = beatNow()
      const view = beats.beatView()
      present = view.PRESENT_NPCS
      const record = recordOf(beat)
      record.present = present
      // The pre-narration slice: authored script lines, the utterance, symptoms
      // (spec decision 1). `narration` is deliberately absent, so no `n`/`q` is
      // minted before Call 2 has answered.
      const built = buildFeed(
        {
          clock: beat.clock,
          scriptLines: record.scriptLines,
          judgment: { utterance },
          present,
          symptoms: view.SCENE_SYMPTOMS,
        },
        ids,
      )
      lines = [...lines, ...built.lines]
    },

    applyNarration(response: NarrationResponse | null): void {
      const beat = beatNow()
      if (response !== null) {
        const record = recordOf(beat)
        record.narration = {
          timeline_entries: response.timeline_entries,
          npc_lines: response.npc_lines,
        }
        for (const entry of response.timeline_entries) {
          lines.push({ kind: 'event', clock: beat.clock, text: entry, sentence_id: ids.next('n') })
        }
        const { kept } = classifyNpcLines(response.npc_lines, { present, utterance })
        for (const npcLine of kept) {
          lines.push({
            kind: 'npc',
            clock: beat.clock,
            speaker: npcLine.speakerName,
            text: npcLine.text,
            sentence_id: ids.next('q'),
          })
        }
      }
      // The timeline window is prose, never symptoms (contract §5's table).
      beats.recordLines(lines.filter((line) => line.kind !== 'symptom').map((line) => line.text))
    },

    applyReport(response: ReporterResponse | null): ReportSentences {
      const beat = beatNow()
      const roundIndex = beat.roundIndex
      if (roundIndex === null) throw new Error(`beat ${beat.index} belongs to no round`)
      // §5 recovery: with no reporter body, facts fall back to the objective
      // log — the assembled round events, which owe nothing to the model.
      const facts = response === null ? assembler.experienced(roundIndex) : response.facts
      const body = response === null ? SUBSTITUTE_REPORT_BODY : response.report_body
      return buildReportSentences({ facts, report_body: body }, ids)
    },

    advance(): boolean {
      const more = beats.advance()
      lines = []
      utterance = ''
      present = []
      core.reset()
      return more
    },
  }
}

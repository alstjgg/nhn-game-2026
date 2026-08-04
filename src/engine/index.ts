/**
 * State engine — deterministic, isomorphic, DOM-free.
 *
 * Owner: 윤석 (architecture track). Stub.
 *
 * Its **public surface** — what the composer may call — is fixed by
 * [contract-engine-composer.md](../../docs/contract-engine-composer.md) §2:
 * `gateView()` · `beatView()` · `roundView()`, each returning a snapshot of
 * plain data, never a live handle into state. That contract also assigns this
 * module the round event assembler (§5). Its internals are this spec's:
 *
 * What lands here, per that spec: the run state, the per-beat delta journal
 * (`{variable, before, after, cause}`), the symptom renderer, and the beat
 * chain — *stance → apply its (gate, stance) delta → resolve the outcome
 * bucket → evaluate that bucket's edge predicates against the **updated**
 * state*. The delta lands before the predicate is read; reversing it changes
 * routing while still looking deterministic, which is why it gets a test of
 * its own.
 *
 * Two properties this module exists to preserve:
 *
 * 1. **Free text has no state authority.** The engine consumes exactly one
 *    field of model output — `stance`. Utterances, inner notes, NPC lines,
 *    reports: rendered, never read for state (W4 / I3).
 * 2. **The engine is indifferent to the variable list.** Variables, delta
 *    tables, and predicates are data. Binding a concrete list with the winning
 *    scenario must touch no code in here; if it does, the engine has absorbed
 *    scenario content.
 *
 * Compiled by `tsconfig.core.json`, which omits the DOM lib — `document`,
 * `window`, and `fetch` do not resolve in this folder, by design.
 *
 * This file carries e0's frozen public surface (the three views, `feed()`)
 * unchanged, plus `createEngine`'s body: the composition root that binds the
 * beat & round driver (`./beat`), the state core (`./state`) and the feed
 * builders (`./feed`) into one object. Nothing beyond this barrel imports
 * those three folders directly — a caller that needs an engine calls
 * `createEngine`, never `createBeatDriver` itself.
 */

import type { FeedLine } from '../shared/view-driver.ts'
import type {
  JudgmentResponse,
  NarrationResponse,
  PresentNpc,
  ReporterResponse,
  Stance,
} from '../shared/contracts.ts'
import type { Symptoms, Temperament } from '../shared/datapack.ts'

import { buildSchedule, createBeatDriver } from './beat/index.ts'
import type {
  Beat,
  BeatCursor,
  BeatPack,
  DeltaEntry,
  RoundAssemblerPort,
  StateCorePort,
} from './beat/index.ts'
import { applyEffects, initState, renderSymptoms as renderBeatSymptoms } from './state/index.ts'
import type { RunState } from './state/index.ts'
import {
  assembleExperienced,
  buildReportSentences,
  classifyNpcLines,
  createIdAllocator,
  buildFeed,
} from './feed/index.ts'
import type { ReportSentences, RoundBeatInput, ScriptLine } from './feed/index.ts'

/**
 * The engine's temperament view — contract-engine-composer §2's
 * `TemperamentPack`, aliased to `datapack.ts`'s `Temperament` rather than
 * re-declared: that file is the one place the shape is authored (§4.1's
 * `default_disposition` + up to 2 `clauses` of
 * `{axis, axis_vocabulary, condition, defeat_condition}`).
 */
export type TemperamentPack = Temperament

/** Everything Call 1 needs that is not the proxy's and not the player's. */
export type GateView = {
  GATE_QUESTION: string
  STANCE_SET: Stance[]
  /** Most recent 6 lines, never a severed beat (§3.2). */
  TIMELINE_EXCERPT: string[]
  /** Structured; the composer renders it (§4). */
  TEMPERAMENT: TemperamentPack
}

/** Everything Call 2 needs. Valid only after the beat's effects are applied. */
export type BeatView = {
  /** Most recent 6 lines, never a severed beat. */
  TIMELINE_TAIL: string[]
  /** This beat's Call 1 `utterance`; `""` on a script beat. */
  AGENT_UTTERANCE: string
  FIXED_NPC_ACTION: string
  PRESENT_NPCS: PresentNpc[]
  /** `renderSymptoms` output — never empty (§2.3-5). */
  SCENE_SYMPTOMS: string[]
}

/** Everything Call 3 needs. Valid only at a round boundary. */
export type RoundView = {
  /** The round event assembler's output (§5). */
  EXPERIENCED: string[]
  /** The SAME value `GateView` carried for this round. */
  TEMPERAMENT: TemperamentPack
}

/**
 * The parts of one scenario datapack the engine reads, beyond what the beat
 * driver already needs (`BeatPack`): the symptom sentence table. Already
 * parsed — nothing here touches a file system (physical §3.2).
 */
export type EnginePack = BeatPack & { symptoms: Symptoms }

/**
 * What the engine needs to construct — decision 15: every cross-module
 * dependency is injected. `run` seeds the sentence-id allocator (spec-engine
 * §5's `(run, channel)` counter); it defaults to 1.
 */
export type EngineDeps = {
  pack: EnginePack
  run?: number
}

export interface Engine {
  gateView(): GateView
  beatView(): BeatView
  roundView(): RoundView
  /** This beat's feed lines, in order, ids already minted. */
  feed(): FeedLine[]
}

/**
 * The engine, as the driver drives it (`EnginePort` in
 * `../driver/ports.ts`, widened structurally rather than imported — the
 * driver depends on the engine, never the other way around). Beyond the four
 * frozen views: the beat cursor and the three ingest points, each of which
 * takes `T | null` — `null` is the fallback path (spec-engine §5).
 */
export interface EngineHandle extends Engine {
  current(): BeatCursor
  /** `null` ⇒ the engine substitutes this gate's authored `default_stance`. */
  submitStance(response: JudgmentResponse | null): void
  applyBeatEffects(): void
  /** `null` ⇒ no `n`/`q` line is minted for this beat. */
  applyNarration(response: NarrationResponse | null): void
  /** `null` ⇒ facts come from the objective log and the body is the substitute. */
  applyReport(response: ReporterResponse | null): ReportSentences
  /** Moves to the next beat. `false` when the run is over. */
  advance(): boolean
  /** This beat's delta journal so far, in application order. Resets on `advance()`. */
  journal(): DeltaEntry[]
}

/** spec-engine §5's substitute report body — used when Call 3 never lands. */
export const SUBSTITUTE_REPORT_BODY =
  '보고를 생성하지 못했다. 이 라운드의 기록은 객관 로그로 남는다.'

/** The state core, as the beat driver's `StateCorePort` sees it, over `./state`'s pure functions. */
function createStateCore(
  symptomsPack: Symptoms,
  state: RunState,
): { port: StateCorePort; reset(): void } {
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
    renderSymptoms: () => renderBeatSymptoms(entries, symptomsPack),
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

type BeatRecord = RoundBeatInput & { roundIndex: number | null }

/**
 * The composition root — decision 15's factory. Binds `./beat`'s schedule and
 * beat driver, `./state`'s pure functions, and `./feed`'s builders into one
 * `EngineHandle`, isomorphic (no DOM, no `fs`, no clock, no randomness of its
 * own beyond the injected `run` seed).
 */
export function createEngine(deps: EngineDeps): EngineHandle {
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

    journal: (): DeltaEntry[] => core.port.journal(),

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

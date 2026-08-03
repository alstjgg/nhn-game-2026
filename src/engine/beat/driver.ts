/**
 * The beat & round driver — the thing that walks a schedule and decides, for
 * every beat, what happens in what order.
 *
 * Two orderings are the whole reason this module exists:
 *
 * - **spec-engine §4.1, the gate beat.** stance → apply that bucket's deltas
 *   and flags → *then* evaluate the edge predicates. Reversing the last two
 *   still looks deterministic and still returns a node, but it routes the run
 *   off the pre-delta state. `submitStance` is written so the state core's own
 *   call log proves the order.
 * - **spec-engine §4.2, every beat.** the beat's effects land, the journal
 *   closes, symptoms render — and only then is Call 2's payload reachable.
 *   `beatView()` throws until `applyBeatEffects()` has run, so a caller cannot
 *   narrate a beat that has not happened yet.
 *
 * The state core arrives by injection (PRD decision 15) — this file imports no
 * concrete engine, only the port type.
 */

import type { BeatView, GateView, RoundView } from '../index.ts'
import type { PresentNpc } from '../../shared/contracts.ts'
import type { BeatPack, RoundAssemblerPort, StateCorePort } from './ports.ts'
import type { Beat, BeatKind, OutcomeBucket, ScheduledGate } from './schedule.ts'
import { BeatPhaseError, StanceResolutionError } from './errors.ts'
import { evaluateEdges } from './predicates.ts'
import { cloneDeep, windowLines } from './views.ts'

/**
 * Where a beat is in its own life.
 *
 * `stance` only ever starts a gate beat; a script beat opens at `effects`.
 * `report` replaces `narration` on a round's last beat — that is what makes
 * `roundView()` legal exactly at a round boundary.
 */
export type BeatPhase = 'stance' | 'effects' | 'narration' | 'report' | 'done'

/** The one field of Call 1's response that has state authority, plus the line. */
export type StanceSubmission = { stance: string; utterance: string }

/** What the stance resolved to, and where the gate routes next. */
export type StanceOutcome = { bucketId: string; nextNode: string | null }

/**
 * The ordered record of calls a run owes. The driver makes none of them — it
 * only says which are due and when, so a transport can be driven, replayed, or
 * counted without a network.
 */
export type BeatStep =
  | { kind: 'judgment'; beat: number }
  | { kind: 'narration'; beat: number }
  | { kind: 'report'; beat: number; round: number }

export type BeatCursor = {
  index: number
  clock: string
  kind: BeatKind
  roundIndex: number | null
  isRoundLast: boolean
}

export type BeatDriverDeps = {
  schedule: Beat[]
  state: StateCorePort
  assembler: RoundAssemblerPort
  pack: BeatPack
}

export interface BeatDriver {
  current(): BeatCursor
  phase(): BeatPhase
  /** A copy of the step log; mutating it cannot reach the driver. */
  steps(): BeatStep[]
  submitStance(submission: StanceSubmission): StanceOutcome
  applyBeatEffects(): void
  /** This beat's narrated lines, for the timeline window. */
  recordLines(lines: readonly string[]): void
  /** Moves to the next beat. `false` when the run is over. */
  advance(): boolean
  gateView(): GateView
  beatView(): BeatView
  roundView(): RoundView
}

export function createBeatDriver(deps: BeatDriverDeps): BeatDriver {
  const { schedule, state, assembler, pack } = deps

  let cursor = 0
  let phase: BeatPhase = openingPhase(schedule[0])
  let utterance = ''
  let symptoms: string[] = []
  const stepLog: BeatStep[] = []
  /** One entry per beat that recorded lines, in beat order. */
  const lineGroups: string[][] = []
  let activeGroup: string[] | null = null

  function beatNow(): Beat {
    const beat = schedule[cursor]
    if (beat === undefined) throw new BeatPhaseError('the schedule holds no beats')
    return beat
  }

  function gateNow(): ScheduledGate {
    const beat = beatNow()
    if (beat.gate === null) {
      throw new BeatPhaseError(`beat ${beat.index} (${beat.clock}) carries no gate`)
    }
    return beat.gate
  }

  function nameOf(charId: string): string {
    const hit = pack.characters.characters.find((character) => character.id === charId)
    return hit === undefined ? charId : hit.name
  }

  /** D2: the co-timed event's own text. D3: the gate's scene, when alone. */
  function fixedAction(beat: Beat): string {
    const authored = beat.events.map((event) => event.text).join('\n')
    if (authored !== '') return authored
    return beat.gate === null ? '' : beat.gate.scene
  }

  function presentNpcs(beat: Beat): PresentNpc[] {
    const roster: PresentNpc[] = []
    for (const event of beat.events) {
      for (const npc of event.present ?? []) {
        roster.push({ id: npc.char_id, name: nameOf(npc.char_id), side: npc.side })
      }
    }
    return roster
  }

  function resolveBucket(gate: ScheduledGate, stance: string): OutcomeBucket {
    const bucket = gate.buckets.find((candidate) => candidate.stances.includes(stance))
    if (bucket === undefined) {
      throw new StanceResolutionError(`stance '${stance}' resolves to no bucket of gate ${gate.id}`)
    }
    return bucket
  }

  return {
    current(): BeatCursor {
      const beat = beatNow()
      return {
        index: beat.index,
        clock: beat.clock,
        kind: beat.kind,
        roundIndex: beat.roundIndex,
        isRoundLast: beat.isRoundLast,
      }
    },

    phase: () => phase,

    steps: () => stepLog.map((step) => ({ ...step })),

    submitStance(submission: StanceSubmission): StanceOutcome {
      if (phase !== 'stance') {
        throw new BeatPhaseError(`submitStance is legal in phase 'stance', not '${phase}'`)
      }
      const beat = beatNow()
      const gate = gateNow()
      const bucket = resolveBucket(gate, submission.stance)
      const cause = `${gate.id}:${bucket.id}`

      // §4.1 — the deltas land BEFORE anything reads state for routing.
      state.applyDeltas(bucket.deltas, cause)
      state.applyFlags(bucket.flags, cause)
      const nextNode = evaluateEdges(gate.edges, state)

      utterance = submission.utterance
      stepLog.push({ kind: 'judgment', beat: beat.index })
      phase = 'effects'
      return { bucketId: bucket.id, nextNode }
    },

    applyBeatEffects(): void {
      if (phase !== 'effects') {
        throw new BeatPhaseError(`applyBeatEffects is legal in phase 'effects', not '${phase}'`)
      }
      const beat = beatNow()

      // §4.2 — every event's effects, in events[] order, deltas before flags.
      for (const event of beat.events) {
        const effects = event.effects
        if (effects === null || effects === undefined) continue
        state.applyDeltas(effects.deltas, event.id)
        state.applyFlags(effects.flags, event.id)
      }
      // Closes this beat's journal, which is what the symptom renderer reads.
      state.journal()
      symptoms = state.renderSymptoms()

      stepLog.push({ kind: 'narration', beat: beat.index })
      if (beat.isRoundLast && beat.roundIndex !== null) {
        phase = 'report'
        stepLog.push({ kind: 'report', beat: beat.index, round: beat.roundIndex })
      } else {
        phase = 'narration'
      }
    },

    recordLines(lines: readonly string[]): void {
      if (phase !== 'narration' && phase !== 'report') {
        throw new BeatPhaseError(`recordLines is legal after this beat's effects, not in '${phase}'`)
      }
      if (activeGroup === null) {
        activeGroup = []
        lineGroups.push(activeGroup)
      }
      activeGroup.push(...lines)
    },

    advance(): boolean {
      if (cursor + 1 >= schedule.length) {
        phase = 'done'
        return false
      }
      cursor += 1
      utterance = ''
      symptoms = []
      activeGroup = null
      phase = openingPhase(schedule[cursor])
      return true
    },

    gateView(): GateView {
      const gate = gateNow()
      return {
        GATE_QUESTION: gate.question,
        STANCE_SET: cloneDeep(gate.stances),
        TIMELINE_EXCERPT: windowLines(lineGroups),
        TEMPERAMENT: cloneDeep(pack.temperament),
      }
    },

    beatView(): BeatView {
      if (phase !== 'narration' && phase !== 'report') {
        throw new BeatPhaseError(`beatView is legal after this beat's effects, not in '${phase}'`)
      }
      const beat = beatNow()
      return {
        TIMELINE_TAIL: windowLines(lineGroups),
        AGENT_UTTERANCE: utterance,
        FIXED_NPC_ACTION: fixedAction(beat),
        PRESENT_NPCS: presentNpcs(beat),
        SCENE_SYMPTOMS: [...symptoms],
      }
    },

    roundView(): RoundView {
      const beat = beatNow()
      if (phase !== 'report' || beat.roundIndex === null) {
        throw new BeatPhaseError(
          `roundView is legal on a round's last beat, not on beat ${beat.index} in phase '${phase}'`,
        )
      }
      return {
        EXPERIENCED: cloneDeep(assembler.experienced(beat.roundIndex)),
        TEMPERAMENT: cloneDeep(pack.temperament),
      }
    },
  }
}

function openingPhase(beat: Beat | undefined): BeatPhase {
  if (beat === undefined) return 'done'
  return beat.kind === 'gate' ? 'stance' : 'effects'
}

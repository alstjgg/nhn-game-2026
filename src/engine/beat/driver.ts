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
import type { Beat, BeatKind, ExcerptLine, OutcomeBucket, ScheduledGate } from './schedule.ts'
import { BeatPhaseError, StanceResolutionError } from './errors.ts'
import { evaluateEdges } from './predicates.ts'
import { holds, problems } from '../../shared/predicates.ts'
import { cloneDeep, windowLines } from './views.ts'

/**
 * Where a beat is in its own life.
 *
 * `stance` only ever starts a gate beat; a script beat opens at `effects`.
 * `report` replaces `narration` on a round's last beat — that is what makes
 * `roundView()` legal exactly at a round boundary.
 */
export type BeatPhase = 'stance' | 'effects' | 'narration' | 'report' | 'done'

/**
 * The one field of Call 1's response that has state authority, plus the line.
 *
 * `fallback` is not a fourth field of the response — Call 1 either landed or it
 * did not, and only the engine knows which, because only the engine holds the
 * authored `default_stance` it substitutes (spec-engine §5). It exists so the
 * journal can say so; see `FALLBACK_CALL1_CAUSE`.
 */
export type StanceSubmission = { stance: string; utterance: string; fallback?: boolean }

/**
 * spec-engine §2.1 · §5 — the `cause` a delta gets when the stance behind it is
 * the authored `default_stance` substituted after Call 1 failed, rather than a
 * stance any model chose.
 *
 * §5's table writes this literal out: "Proceed with `gates.json`'s
 * `default_stance`. That delta entry's `cause` is `"fallback:call1"`". It is
 * load-bearing rather than cosmetic — the journal rides verbatim into the run
 * record, and architecture spec §2's position is that an outcome you cannot
 * explain is a bug. Without it a run where every gate fell back is byte-
 * identical, in the one place attribution is recorded, to a run the model
 * judged; the run record then asserts a model judgment that never happened.
 */
export const FALLBACK_CALL1_CAUSE = 'fallback:call1'

/**
 * spec-engine §2.1 — a script event's deltas are attributed `event:<id>`
 * (`"event:t12"` in the spec's own type comment), never the bare id. The
 * namespace is what keeps an event id from colliding with anything else the
 * grammar admits once a run record is read back.
 */
export const EVENT_CAUSE_PREFIX = 'event:'

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
  /**
   * Is THIS beat's gate actually being asked? (contract-datapack F4)
   *
   * Read once when the beat opens and held, so `current()`, `openingPhase` and
   * `gateView()` cannot disagree with each other inside one beat — the state
   * moves under them as soon as effects land, and a gate that was open for the
   * cursor and closed for the phase machine would be a hang.
   *
   * A gate with no authored `availability` compiles to `''`, which `holds()`
   * answers `true` — so this is inert for every gate that does not use it.
   */
  let gateLive = gateOpen(schedule[0], state)
  let phase: BeatPhase = openingPhase(schedule[0], gateLive)
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
    if (!gateLive) {
      throw new BeatPhaseError(
        `gate ${beat.gate.id} is not available on this run (availability: ${JSON.stringify(beat.gate.availability)})`,
      )
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
    // A gate that is not being asked contributes no scene either: its prose
    // describes the situation the gate is about, and that situation is what
    // `availability` just said is not happening.
    return beat.gate === null || !gateLive ? '' : beat.gate.scene
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
        // What the CALLER must do this beat, which is the only thing a cursor
        // is for: `live-driver.ts` reads this to decide whether Call 1 runs. A
        // gate whose `availability` does not hold is not asked, so it is a
        // script beat to everyone outside this module. `roundIndex` below is
        // deliberately NOT recomputed — the round exists either way, and its
        // report is still owed (`roundGates` already tolerates a round with no
        // submission).
        kind: beat.kind === 'gate' && gateLive ? 'gate' : 'script',
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
      // §2.1: `<gates[].gate>:<stances[].id>`. The STANCE, not the bucket — a
      // bucket is a many-to-one collapse, so `G1:ba` cannot say which of the
      // stances sharing it was chosen, and the journal is where that is
      // recorded for good. §5 outranks the form entirely on the fallback path:
      // the whole point of that entry is that no model chose the stance.
      const cause =
        submission.fallback === true
          ? FALLBACK_CALL1_CAUSE
          : `${gate.id}:${submission.stance}`

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
      // §2.1 fixes the attribution as `event:<events[].id>`; the bare id is a
      // different string, and the run record stores whichever one it was given.
      for (const event of beat.events) {
        const effects = event.effects
        if (effects === null || effects === undefined) continue
        const cause = `${EVENT_CAUSE_PREFIX}${event.id}`
        state.applyDeltas(effects.deltas, cause)
        state.applyFlags(effects.flags, cause)
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
      // Read AFTER the cursor moves and before the phase is set: the previous
      // beat's effects have landed, so this is the state the gate's condition
      // is about.
      gateLive = gateOpen(schedule[cursor], state)
      phase = openingPhase(schedule[cursor], gateLive)
      return true
    },

    gateView(): GateView {
      const gate = gateNow()
      return {
        GATE_QUESTION: gate.question,
        STANCE_SET: cloneDeep(gate.stances),
        // A declared window REPLACES the narrated one: what the agent knows at
        // a gate is authored on the card, not whatever the preceding beats
        // happened to leave inside the prompt budget. A gate that declared
        // nothing compiles to `null` and keeps the old behaviour byte for byte,
        // so this is inert for every pack that has not opted in.
        TIMELINE_EXCERPT:
          gate.excerpt === null ? windowLines(lineGroups) : exposedExcerpt(gate.excerpt, state),
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

/**
 * Does this beat's gate pass its `availability` condition right now?
 *
 * `false` for a beat with no gate, so the one call site can ask the question
 * unconditionally.
 *
 * ── Un-hardened prose opens the gate, it does not close it ──────────────────
 *
 * `availability` is one of `contract-datapack`'s F4 slots: packs may still
 * carry free text there pending promotion — 우는다리's G7 says 특정 가지에서만 —
 * and `datapack:lint` FLAGs it as hardening work. Routing that through
 * `holds()` alone would read it as `false` and silently delete a gate from
 * every run, which is a behaviour change no author asked for. So a condition
 * that does not PARSE is treated as "no condition authored yet" and the gate is
 * asked, exactly as it was before this function existed. Only a real predicate
 * is enforced.
 *
 * That also keeps the state core untouched for every pack that has not opted
 * in: `snapshot()` is reached only when there is a predicate to resolve, so
 * this adds no read to the §4.1 ordering chain.
 */
function gateOpen(beat: Beat | undefined, state: StateCorePort): boolean {
  if (beat?.gate == null) return false
  const condition = beat.gate.availability
  if (condition === '' || problems(condition).length > 0) return true
  return holds(condition, state.snapshot())
}

/**
 * The rows a gate declared, minus the ones this run was never exposed to.
 *
 * Filtered when the view is built rather than when the schedule is, because
 * `extra_condition` is about the run: a run that intervened at an earlier gate
 * must be able to arrive here reading a different window than one that did not,
 * and that property is the reason the conditions were kept in the first place.
 * `gateOpen` above resolves `availability` at this same moment for this same
 * reason — by then the previous beat's effects have landed, so this is the
 * state the gate is asking about.
 *
 * ── Un-hardened prose shows the line, it does not delete it ──────────────────
 *
 * `gateOpen`'s rule again, and `engine/index.ts`'s `exposed()`.
 * `extra_condition` is a `contract-datapack` F4 slot: packs may still carry
 * free text there pending promotion — 우는다리's t5 says 현장(관리동)을 들여다본
 * 런에만 보임 — and `datapack:lint` FLAGs it as hardening work. Routing that
 * through `holds()` alone would read it as `false` and silently delete an
 * authored row from the one prompt the whole gate turns on. So a condition that
 * does not PARSE is treated as "no condition authored yet", and `snapshot()` is
 * reached only where there is a real predicate to resolve.
 */
function exposedExcerpt(lines: readonly ExcerptLine[], state: StateCorePort): string[] {
  const shown: string[] = []
  for (const line of lines) {
    const condition = line.condition
    if (condition === null || condition === '' || problems(condition).length > 0) {
      shown.push(line.text)
    } else if (holds(condition, state.snapshot())) {
      shown.push(line.text)
    }
  }
  return shown
}

function openingPhase(beat: Beat | undefined, gateLive: boolean): BeatPhase {
  if (beat === undefined) return 'done'
  // An unavailable gate opens where a script beat opens: its co-timed events
  // still fire, Call 1 never runs, and no stance is ever submitted for it.
  return beat.kind === 'gate' && gateLive ? 'stance' : 'effects'
}

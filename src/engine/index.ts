/**
 * State engine — deterministic, isomorphic, DOM-free.
 *
 * Owner: 윤석 (architecture track). IMPLEMENTED — the header said "Stub." from
 * the e0 skeleton and was never updated when e2/e3/e4 filled it in. The public
 * surface below is live and `createEngine` is bound by the composition root.
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
import type { PredicateState } from '../shared/predicates.ts'

import { buildSchedule, createBeatDriver, eventExposed, parseClock } from './beat/index.ts'
import type {
  Beat,
  BeatCursor,
  BeatPack,
  DeltaEntry,
  RoundAssemblerPort,
  ScheduledGate,
  StanceOrigin,
  StateCorePort,
} from './beat/index.ts'
import { applyEffects, initState, renderSymptoms as renderBeatSymptoms } from './state/index.ts'
import type { RunState } from './state/index.ts'
import {
  assembleExperienced,
  assembleObjectiveLog,
  buildReportSentences,
  classifyNpcLines,
  createIdAllocator,
  buildFeed,
  withholdInnerNote,
} from './feed/index.ts'
import type { ReportSentences, RoundBeatInput, RoundInput, ScriptLine } from './feed/index.ts'

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
  /**
   * `null` ⇒ the engine substitutes this gate's authored `default_stance`.
   * Returns the stance it resolved — chosen or substituted — in the author's
   * words (U5.2b, §5.2 `judged`); `null` when it carries no `desc`.
   */
  submitStance(response: JudgmentResponse | null): { stance_id: string; desc: string } | null
  /**
   * This gate resolves to its authored `default_stance` WITHOUT Call 1 being
   * made, because the agent was handed nothing to judge with.
   *
   * Same return as `submitStance`, and deliberately not a flag on it: `null`
   * there means a call failed, and the two must stay tellable apart in the run
   * record (`BASELINE_CALL1_CAUSE`). It takes no argument because the line the
   * agent speaks is the PACK's — the caller knows the handover was empty and
   * nothing else, and a client that could pass an utterance here would be a
   * client that could put words in the agent's mouth.
   */
  submitBaseline(): { stance_id: string; desc: string } | null
  applyBeatEffects(): void
  /** `null` ⇒ no `n`/`q` line is minted for this beat. */
  applyNarration(response: NarrationResponse | null): void
  /** `null` ⇒ facts come from the objective log and the body is the substitute. */
  applyReport(response: ReporterResponse | null): ReportSentences
  /** Moves to the next beat. `false` when the run is over. */
  advance(): boolean
  /** This beat's delta journal so far, in application order. Resets on `advance()`. */
  journal(): DeltaEntry[]
  /**
   * Every scalar and flag the run holds right now, flattened.
   *
   * The state core has answered this since e3 (`StateCorePort.snapshot()`); it
   * was simply never on the handle, so nothing outside the beat driver could
   * ask. `src/shared/predicates.ts` is what wants it — a predicate reads the
   * run's state and the run's state is here — and reading is all it can do:
   * the returned object is a fresh copy, so a caller cannot write state through
   * the accessor that was added to observe it.
   */
  snapshot(): PredicateState
}

/** spec-engine §5's substitute report body — used when Call 3 never lands. */
export const SUBSTITUTE_REPORT_BODY =
  '무전이 끊겨 보고가 도착하지 않았다. 요원은 홀로 판단했다. 이 라운드는 현장 기록으로만 남는다.'

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

  /** This round's §5 input table, shared by both assemblies below. */
  function roundInput(roundIndex: number): RoundInput {
    return {
      gate: roundGates.get(roundIndex) ?? { utterance: '', inner_note: '' },
      beats: records.filter((record) => record.roundIndex === roundIndex),
      temperament: pack.temperament,
    }
  }

  const assembler: RoundAssemblerPort = {
    experienced: (roundIndex: number): string[] => assembleExperienced(roundInput(roundIndex)),
    objectiveLog: (roundIndex: number): string[] => assembleObjectiveLog(roundInput(roundIndex)),
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

  /**
   * The FEED's half of the exposure question — the rule itself is
   * `eventExposed` (`beat/driver.ts`), which the beat driver reads for
   * `FIXED_NPC_ACTION` and `PRESENT_NPCS`. It used to be written out here, and
   * being written out here is how it came to be read on one surface only: the
   * paper printed the branch that happened while the prompt was handed every
   * branch the pack authored, including the endings this run did not reach.
   *
   * ── Why here, and why once ────────────────────────────────────────────────
   *
   * `recordOf` memoises per beat and is first called from `applyBeatEffects()`,
   * after `beats.applyBeatEffects()` — so the state this reads already carries
   * this beat's own effects, and a later `recordOf` for narration returns the
   * same record rather than re-deciding against a state that has moved on. The
   * driver freezes its own copy at the tail of that same call, which is what
   * makes the two answers the same answer rather than two agreeing ones.
   */
  function scriptLinesOf(beat: Beat): ScriptLine[] {
    return beat.events
      .filter((event) => eventExposed(event.exposure?.extra_condition, core.port))
      .map((event) => ({ id: event.id, text: event.text }))
  }

  /**
   * A beat's lines drip across its span instead of bursting at its opening
   * minute: the adapter releases each stamp as the sim clock reaches it, so
   * spread stamps ARE the feed's timing. Successive lines advance by a stride
   * of sim minutes, capped one minute short of the next beat so no line
   * outruns the beat that follows. A beat with no successor — or an authored
   * `+` stamp, whose tie-break a whole-minute reprint would drop — keeps its
   * authored clock on every line. Feel value, tuned in play.
   */
  const STAMP_STRIDE_MIN = 5

  let stampBeat = -1
  let stampMinute = 0
  let stampCap = -1

  function nextStamp(beat: Beat): string {
    if (stampBeat !== beat.index) {
      stampBeat = beat.index
      const next = schedule[beat.index + 1]
      if (next === undefined || beat.clock.endsWith('+')) {
        stampCap = -1
      } else {
        stampMinute = parseClock(beat.clock)
        stampCap = Math.max(stampMinute, Math.ceil(parseClock(next.clock)) - 1)
      }
    }
    if (stampCap < 0) return beat.clock
    const minute = stampMinute
    stampMinute = Math.min(stampMinute + STAMP_STRIDE_MIN, stampCap)
    return `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`
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

  /** This beat's gate — the same refusal both ingest points owe their caller. */
  function gateNowOrThrow(): ScheduledGate & { roundIndex: number | null } {
    const beat = beatNow()
    if (beat.gate === null) throw new Error(`beat ${beat.index} carries no gate`)
    return { ...beat.gate, roundIndex: beat.roundIndex }
  }

  /**
   * The one body behind `submitStance` and `submitBaseline`.
   *
   * Three things happen here and they happen in one place on purpose: the
   * round's utterance is remembered for Call 3, the beat driver is told where
   * the stance came from, and the author's own words for it are handed back.
   * The three paths differ ONLY in what they pass in — which is the whole
   * claim, and a second copy of this body would be a way for one of them to
   * quietly stop being true.
   */
  function resolveGate(
    gate: ScheduledGate & { roundIndex: number | null },
    stance: string,
    spoken: string,
    innerNote: string,
    origin: StanceOrigin,
  ): { stance_id: string; desc: string } | null {
    utterance = spoken
    if (gate.roundIndex !== null) {
      roundGates.set(gate.roundIndex, { utterance, inner_note: innerNote })
    }
    // The journal is the only place a substituted stance is distinguishable
    // from a chosen one after the fact — and, since x14, the only place the two
    // ways of substituting one are distinguishable from each other (§2.1).
    beats.submitStance({ stance, utterance, origin })
    // U5.2b — report what was judged, in the author's words (§5.2 `judged`).
    const judged = gate.stances.find((entry) => entry.id === stance)
    return judged?.desc !== undefined ? { stance_id: judged.id, desc: judged.desc } : null
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

    snapshot: (): PredicateState => core.port.snapshot(),

    submitStance(response: JudgmentResponse | null): { stance_id: string; desc: string } | null {
      const gate = gateNowOrThrow()
      // §5 recovery: the authored default stance, which `gateView()` does not
      // expose — this is why substituting it has to be the engine's move.
      return response === null
        ? resolveGate(gate, gate.defaultStance, '', '', 'fallback')
        : resolveGate(gate, response.stance, response.utterance, response.inner_note, 'model')
    },

    submitBaseline(): { stance_id: string; desc: string } | null {
      const gate = gateNowOrThrow()
      // The SAME authored default as the fallback path above, arrived at for
      // the opposite reason — nothing was handed over, so there was nothing to
      // ask about. `baselineUtterance` is never empty (`schedule.ts`), so the
      // agent still speaks here: an unshaped agent taking the baseline is the
      // design, an agent that goes silent reads as a broken one.
      //
      // No `inner_note`. That slot is the agent's private deliberation and no
      // deliberation happened — Call 1 was not made. An authored line standing
      // in for one would be the engine inventing the agent's interior.
      return resolveGate(gate, gate.defaultStance, gate.baselineUtterance, '', 'baseline')
    },

    applyBeatEffects(): void {
      beats.applyBeatEffects()
      const beat = beatNow()
      const view = beats.beatView()
      present = view.PRESENT_NPCS
      const record = recordOf(beat)
      record.present = present
      // The round assembler classifies npc lines against THIS beat's utterance,
      // exactly as `buildFeed` does below — `''` on a script beat. Recording it
      // per beat is what keeps the two from diverging (contract §5).
      record.judgment = { utterance }
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
      lines = [...lines, ...built.lines.map((line) => ({ ...line, clock: nextStamp(beat) }))]
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
          lines.push({ kind: 'event', clock: nextStamp(beat), text: entry, sentence_id: ids.next('n') })
        }
        const { kept } = classifyNpcLines(response.npc_lines, { present, utterance })
        for (const npcLine of kept) {
          lines.push({
            kind: 'npc',
            clock: nextStamp(beat),
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
      // log — the assembled round events, which owe nothing to the model. NOT
      // `experienced()`: that one carries the `inner_note`, and `facts` are
      // minted, emitted and minable (see `withholdInnerNote`).
      const facts = response === null ? assembler.objectiveLog(roundIndex) : response.facts
      const body = response === null ? SUBSTITUTE_REPORT_BODY : response.report_body
      // The membrane, held on both paths: a reporter that echoed its own prompt
      // would put the note back on the `f` channel by itself.
      const note = roundGates.get(roundIndex)?.inner_note ?? ''
      return buildReportSentences({ facts: withholdInnerNote(facts, note), report_body: body }, ids)
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

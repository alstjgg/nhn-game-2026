/**
 * The beat schedule — `timeline.json` events × gate clocks, folded into one
 * ordered list of beats, with round membership already resolved.
 *
 * The rules it encodes (spec-engine §3.1 plus the decisions the doc left open):
 *
 * - **D1** one clock tick = one beat. Two events at the same clock are one
 *   beat, and they keep their `events[]` order.
 * - **D2** a gate absorbs a co-timed event rather than standing beside it, so
 *   Call 2 on that beat still has a fixed NPC action to honour.
 * - **D3** a gate with no co-timed event gets a beat of its own, with an empty
 *   event list; the gate's `scene` carries the fixed action instead.
 * - **decision 10** a beat before the first gate belongs to no round —
 *   `roundIndex` is `null` and no report is ever owed for it.
 * - **A7** a round runs from its gate up to (not including) the next gate; the
 *   last beat of the run closes the last round.
 *
 * Edge predicates compile here, not at routing time: a datapack that cannot
 * route fails before the first beat, never mid-run.
 */

import type { Stance } from '../../shared/contracts.ts'
import type { Gates, Timeline } from '../../shared/datapack.ts'
import { parseClock } from './clock.ts'
import { compileEdges } from './predicates.ts'
import type { CompiledEdge } from './predicates.ts'

export type TimelineEvent = Timeline['events'][number]
type AuthoredGate = Gates['gates'][number]

/** One `(stance set → deltas/flags)` bucket, as authored. */
export type OutcomeBucket = AuthoredGate['buckets'][number]

/** A beat either carries a gate (Call 1 runs) or it does not (§3.1). */
export type BeatKind = 'script' | 'gate'

/** A gate, with its predicates already compiled. */
export type ScheduledGate = {
  id: string
  question: string
  /** Prose in front of the card; the Call-2 fallback when nothing is co-timed. */
  scene: string
  stances: Stance[]
  defaultStance: string
  /**
   * What the agent says at this gate when it was handed nothing — the one line
   * an UNSHAPED agent speaks, never a model's (see `driver.ts`'s `baseline`
   * origin).
   *
   * Resolved once, here, and never empty. `compileGate` prefers the authored
   * `baseline_utterance` and falls back to the DEFAULT STANCE'S OWN LABEL,
   * which is not a degraded substitute: a label is already written in the
   * agent's 해라체 as the action it takes and the reason it takes it — 멈춘회전문's
   * G1 `a` opens `달리 볼 까닭이 없으므로`. An agent reasoning from temperament
   * alone says exactly that, so the authored field is an escape hatch for a
   * label that reads badly aloud, not the normal path.
   *
   * Resolved at BUILD time, unlike `availability` below, because nothing about
   * it can move during a run: the label and the default are both authored, and
   * a line that changed between two beats of one run would be a second agent.
   */
  baselineUtterance: string
  buckets: OutcomeBucket[]
  edges: CompiledEdge[]
  /**
   * `availability` (contract-datapack F4) — the condition under which this gate
   * is asked at all. `''` means always, which is what a gate that authored none
   * compiles to.
   *
   * It CANNOT be resolved here. A gate's availability reads flags earlier gates
   * set inside the same run (우는다리's G7 is available only where G4 named the
   * caller), and this schedule is built once, before the first beat. So it is
   * carried as a compiled string and evaluated when the beat opens — see
   * `driver.ts`'s `gateLive`. That is also why an unavailable beat stays a
   * `kind: 'gate'` beat here: round membership is assigned at build time off
   * exactly this field, and a beat that changed kind mid-run would renumber the
   * rounds the reports are owed against.
   */
  availability: string
}

export type Beat = {
  index: number
  clock: string
  /** `parseClock(clock)` — the sort key, kept so callers need not re-parse. */
  minutes: number
  kind: BeatKind
  /** In `timeline.json` order. Empty on a gate-only beat (D3). */
  events: TimelineEvent[]
  gate: ScheduledGate | null
  /** `null` before the first gate — that beat is in no round (decision 10). */
  roundIndex: number | null
  /** True on the last beat of a round: the beat that owes Call 3. */
  isRoundLast: boolean
}

type Slot = { events: TimelineEvent[]; gate: ScheduledGate | null }

/**
 * @throws {ClockFormatError} on a malformed clock anywhere in the pack.
 * @throws {PredicateSyntaxError} on a gate whose `edge_predicates` do not compile.
 */
export function buildSchedule(timeline: Timeline, gates: Gates): Beat[] {
  const slots = new Map<string, Slot>()
  const slotAt = (clock: string): Slot => {
    const held = slots.get(clock)
    if (held !== undefined) return held
    const fresh: Slot = { events: [], gate: null }
    slots.set(clock, fresh)
    return fresh
  }

  for (const event of timeline.events) slotAt(event.time).events.push(event)
  for (const authored of gates.gates) {
    if (authored.clock === null || authored.clock === undefined) continue
    slotAt(authored.clock).gate = compileGate(authored)
  }

  const ordered = [...slots.entries()]
    .map(([clock, slot]) => ({ clock, minutes: parseClock(clock), slot }))
    .sort((left, right) => left.minutes - right.minutes)

  const beats: Beat[] = ordered.map(({ clock, minutes, slot }, index) => ({
    index,
    clock,
    minutes,
    kind: slot.gate === null ? 'script' : 'gate',
    events: slot.events,
    gate: slot.gate,
    roundIndex: null,
    isRoundLast: false,
  }))

  return assignRounds(beats)
}

function compileGate(authored: AuthoredGate): ScheduledGate {
  const stances = authored.stances.map((stance) => ({
    id: stance.id,
    label: stance.label,
    desc: stance.desc,
  }))
  // See `ScheduledGate.baselineUtterance`. The label is looked up rather than
  // indexed: `default_stance` is a schema pattern (`^[a-z]$`) and nothing
  // upstream promises it names a stance that exists, so a pack that mis-authors
  // it gets an empty line here — never a crash, and never another stance's.
  const authoredBaseline = (authored.baseline_utterance ?? '').trim()
  const defaultLabel = stances.find((stance) => stance.id === authored.default_stance)?.label ?? ''
  return {
    id: authored.gate,
    question: authored.question,
    scene: authored.scene ?? '',
    stances,
    defaultStance: authored.default_stance,
    baselineUtterance: authoredBaseline !== '' ? authoredBaseline : defaultLabel,
    buckets: authored.buckets,
    edges: compileEdges(authored.edge_predicates),
    availability: authored.availability ?? '',
  }
}

/** A gate opens a round; the beat before the next gate closes it. */
function assignRounds(beats: Beat[]): Beat[] {
  let round = -1
  for (const beat of beats) {
    if (beat.kind === 'gate') round += 1
    beat.roundIndex = round < 0 ? null : round
  }
  beats.forEach((beat, index) => {
    if (beat.roundIndex === null) return
    const next = beats[index + 1]
    beat.isRoundLast = next === undefined || next.roundIndex !== beat.roundIndex
  })
  return beats
}

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
  buckets: OutcomeBucket[]
  edges: CompiledEdge[]
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
  return {
    id: authored.gate,
    question: authored.question,
    scene: authored.scene ?? '',
    stances: authored.stances.map((stance) => ({ id: stance.id, label: stance.label })),
    defaultStance: authored.default_stance,
    buckets: authored.buckets,
    edges: compileEdges(authored.edge_predicates),
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

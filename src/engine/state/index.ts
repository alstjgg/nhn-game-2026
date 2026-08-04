/**
 * State core — run state, the delta journal, and the symptom renderer.
 * Deterministic, isomorphic, DOM-free (compiled by `tsconfig.core.json`).
 *
 * Spec: [spec-engine](../../../docs/spec-engine.md) §1.1 · §1.1a · §1.2 · §1.3
 * (state model and the two actuators), §2.1 (journal entry), §2.3 (the
 * renderer contract, items 1–7).
 *
 * The shapes below are what `tests/engine/state/**` pins and what e3 takes by
 * injection (decision 15). `src/engine/index.ts` re-exports nothing from here
 * yet.
 */

import type { Characters, Symptoms } from '../../shared/datapack.ts'

/** §2.1 — recorded every beat. `cause` uses pack ids (`G7:c`, `event:t12`). */
export type DeltaEntry = {
  variable: string
  before: number | boolean
  after: number | boolean
  cause: string
}

/** §1.1 — the provisional variable set, held as data so the engine stays indifferent to it. */
export type RunState = {
  scalars: Record<string, number>
  flags: Record<string, boolean>
  /** Scenario minutes. */
  clock: number
  route: { node: string; beat: number; visited: string[] }
}

/**
 * §1.2 — the shape both actuators carry: a gate bucket's `(gate, stance)`
 * delta and a script event's `effects`. `null` is the pre-hardening event.
 */
export type Effects = {
  deltas?: Record<string, number>
  flags?: Record<string, boolean>
} | null

/** Variable → the name of the character owning it, for `{who}` (§2.2). */
export type SymptomOwners = Record<string, string>

/** §2.3-5 — the renderer never returns an empty array. */
const NO_CHANGE = '(변화 없음)'

/** §2.3-4 — the beat shows at most this many sentences. */
const MAX_SENTENCES = 3

/** §2.2 — the placeholder substituted with the variable owner's name. */
const WHO = '{who}'

/** §2.3-7 — I12: a single ASCII digit anywhere in the output is a hard error. */
const DIGIT = /[0-9]/

type Direction = 'up' | 'down'
type Transition = 'set' | 'unset'
type Band = { min: number; text: string }

/** §2.3-3 — a reduced journal entry carrying its own sort key. */
type Candidate = {
  /** 0 for scalars, 1 for flags. */
  kindRank: 0 | 1
  magnitude: number
  /** Order of appearance in the journal. */
  order: number
  text: string
}

/**
 * §1.1a — seed `scalars` from the meters whose `variable` **and** `initial`
 * are bound. Unbound meters are authoring annotation, not state.
 */
export function initState(characters: Characters): RunState {
  const scalars: Record<string, number> = {}
  for (const character of characters.characters) {
    for (const meter of character.meters) {
      if (meter.variable === null || meter.initial === null) continue
      scalars[meter.variable] = meter.initial
    }
  }
  return { scalars, flags: {}, clock: 0, route: { node: '', beat: 0, visited: [] } }
}

/**
 * §1.2 · §4.2 — apply one actuator's effects to `state` (deltas, then flags),
 * returning this application's journal entries in order of appearance.
 */
export function applyEffects(state: RunState, effects: Effects, cause: string): DeltaEntry[] {
  if (effects === null) return []
  const journal: DeltaEntry[] = []
  for (const [variable, delta] of Object.entries(effects.deltas ?? {})) {
    const before = state.scalars[variable] ?? 0
    const after = before + delta
    state.scalars[variable] = after
    journal.push({ variable, before, after, cause })
  }
  for (const [variable, after] of Object.entries(effects.flags ?? {})) {
    const before = state.flags[variable] ?? false
    state.flags[variable] = after
    journal.push({ variable, before, after, cause })
  }
  return journal
}

/** §2.3 — journal → the beat's `SCENE_SYMPTOMS`. Never returns an empty array. */
export function renderSymptoms(
  journal: DeltaEntry[],
  pack: Symptoms,
  owners?: SymptomOwners,
): string[] {
  const candidates: Candidate[] = []
  journal.forEach((entry, order) => {
    const candidate = reduce(entry, order, pack, owners)
    if (candidate !== null) candidates.push(candidate)
  })

  const output = candidates
    .slice()
    .sort(bySortKey)
    .slice(0, MAX_SENTENCES)
    .map((candidate) => candidate.text)

  for (const sentence of output) {
    if (DIGIT.test(sentence)) {
      throw new Error(`symptom sentence contains a digit (I12): ${sentence}`)
    }
  }

  return output.length === 0 ? [NO_CHANGE] : output
}

/**
 * §2.3-1 — reduce one entry to `(variable, direction, magnitude)` and resolve
 * its sentence (§2.3-2). `null` means the entry was dropped before matching.
 */
function reduce(
  entry: DeltaEntry,
  order: number,
  pack: Symptoms,
  owners?: SymptomOwners,
): Candidate | null {
  if (typeof entry.before === 'boolean' || typeof entry.after === 'boolean') {
    // §2.3-1's drop, read for what it says rather than for the arithmetic it
    // happens to be phrased in: "state did not move, so there is no symptom to
    // show". The rule computes a magnitude, and flags have none, so the literal
    // wording only ever reached scalars — but a `true → true` write moved
    // nothing either, and rendering "발신자가 통화가 기록되고 있음을 알아챘다" for
    // the second of two buckets asserting the same flag shows the player a
    // change that did not happen. The 우는다리 pack's own idiom (G3 and G5 each
    // assert one flag from two buckets) is one authoring edit away from it, and
    // §6-2 lint is static — it cannot see which pair of buckets a run visits.
    // The entry stays in the journal; §2.1 records ATTEMPTS to change state.
    if (entry.before === entry.after) return null
    const transition: Transition = entry.after === true ? 'set' : 'unset'
    const text = flagSentence(pack, entry.variable, transition)
    return { kindRank: 1, magnitude: 0, order, text: substitute(text, entry.variable, owners) }
  }
  const magnitude = Math.abs(entry.after - entry.before)
  // §2.3-1: a no-op delta is dropped here, a stage *before* rule 2's hard error.
  if (magnitude === 0) return null
  const direction: Direction = entry.after > entry.before ? 'up' : 'down'
  const text = scalarSentence(pack, entry.variable, direction, magnitude)
  return { kindRank: 0, magnitude, order, text: substitute(text, entry.variable, owners) }
}

/** §2.3-3 — `(kind_rank, −magnitude, order of appearance in the journal)`. */
function bySortKey(a: Candidate, b: Candidate): number {
  if (a.kindRank !== b.kindRank) return a.kindRank - b.kindRank
  if (a.magnitude !== b.magnitude) return b.magnitude - a.magnitude
  return a.order - b.order
}

/**
 * §2.3-2 — the first match in the authored array's own order. The renderer
 * trusts that the array is already in `min` descending order and does not
 * defensively sort; lint (§6-2) is the basis for that trust.
 */
function scalarSentence(
  pack: Symptoms,
  variable: string,
  direction: Direction,
  magnitude: number,
): string {
  const table: { up?: Band[]; down?: Band[] } | undefined = pack[variable]
  const bands = direction === 'up' ? table?.up : table?.down
  for (const band of bands ?? []) {
    if (magnitude >= band.min) return band.text
  }
  throw new Error(
    `no symptom sentence for ${variable} ${direction} at magnitude ${magnitude} (§2.3-2)`,
  )
}

/** §2.3-2 — the flag leg of the same hard error. */
function flagSentence(pack: Symptoms, variable: string, transition: Transition): string {
  const flags: Record<string, { set?: string | null; unset?: string | null }> | undefined =
    pack.flags
  const sentence = flags?.[variable]?.[transition]
  if (sentence === undefined || sentence === null) {
    throw new Error(`no symptom sentence for flag ${variable} ${transition} (§2.3-2)`)
  }
  return sentence
}

/** §2.2 — `{who}` becomes the name of the character owning the variable. */
function substitute(text: string, variable: string, owners?: SymptomOwners): string {
  const who = owners?.[variable]
  return who === undefined ? text : text.split(WHO).join(who)
}

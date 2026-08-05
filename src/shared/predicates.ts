// Pack predicates — the machine-readable form of a condition over run state.
//
// `contract-datapack.md` §3.6: F1/F3/F4 all name the same missing thing, asked
// five times — `score.predicates` · `edge_predicates` · `availability` ·
// `extra_condition` · a place yield's `depth_note`. This module is the one
// reader for all five, so the language has exactly one definition.
//
// It lives in `src/shared/` because both sides need it and the import direction
// (`client → driver → composer → engine → shared`) allows nothing else: the
// driver's scorer reads `score.predicates`, and the engine will read the other
// four. A copy in `src/driver/` would be unreachable from the engine.
//
// ── Total by construction, and that is not a style choice ───────────────────
//
// Nothing here throws. A predicate is authored data, and a malformed one is an
// authoring defect that `npm run datapack:lint` is meant to catch BEFORE a pack
// ships — `problems()` below is what lets it, so lint never re-implements this
// grammar. At run time the answer to a broken predicate is `false`, never an
// exception.
//
// The reason is on the record. `clock.ts`'s `mm()` threw on the authored stamp
// `21:04+`; the throw unwound through a subscriber into the driver's `step()`,
// and the run died on its final beat with no `run_end`, no score and no tally
// (PR #141). Predicates are evaluated at exactly that moment — the close of the
// day, on the player's build, against data no test fixture wrote. A parse error
// there must cost one row, not the run.

/**
 * The state a predicate reads: the engine's own snapshot shape
 * (`src/engine/beat/ports.ts`'s `StateCorePort.snapshot()`), scalars and flags
 * flattened into one map.
 */
export type PredicateState = Record<string, number | boolean>

/** What a `=>` predicate resolves to. Numbers sum into the tally headline. */
export type PredicateValue = string | number

/**
 * `not` is the language's one keyword and therefore not a name.
 *
 * Without this it is a perfectly good identifier, so `'not '` — a negation
 * someone forgot to finish — parses as a flag LITERALLY CALLED `not`, reads
 * false because no pack sets it, and never reports a problem. The predicate
 * looks like it works and silently answers the opposite of what was meant.
 */
const RESERVED = new Set(['not'])

const IDENT = /^[a-z][a-z0-9_]*$/
const COMPARATORS = ['>=', '<=', '==', '>', '<'] as const

type Comparator = (typeof COMPARATORS)[number]

type Term =
  | { kind: 'flag'; name: string; negated: boolean }
  | { kind: 'scalar'; name: string; comparator: Comparator; operand: number }

/** A parsed predicate. `condition: null` is the unconditional `=> value` form. */
type Parsed = {
  condition: Term[] | null
  value: PredicateValue | null
  problems: string[]
}

/**
 * `'24'` → `24`, `'참고인'` → `'참고인'`.
 *
 * This one line decides the tally's arithmetic: §5.2's `score` event pairs one
 * `total: number` with rows whose value is `string | number` (amendment g), and
 * a numeric unit value is what sums into the 사망 headline while a string one
 * is a row that only reads (`contract-datapack` §3.6). Integers only — a
 * decimal body count is not a thing, and leaving floats out keeps "did the
 * author mean a number here?" from ever being a judgement call.
 */
function readValue(raw: string): PredicateValue {
  const text = raw.trim()
  return /^-?\d+$/.test(text) ? Number(text) : text
}

/** One term, or the reason it is not one. */
function readTerm(raw: string): { term: Term | null; problem: string | null } {
  const text = raw.trim()
  if (text === '') return { term: null, problem: 'empty term' }

  const named = (name: string): boolean => IDENT.test(name) && !RESERVED.has(name)

  if (text.startsWith('not ')) {
    const name = text.slice(4).trim()
    if (!named(name)) return { term: null, problem: `'${name}' is not an identifier` }
    return { term: { kind: 'flag', name, negated: true }, problem: null }
  }

  // Longest-first, so `>=` is never read as `>` with a stray `=` after it.
  for (const comparator of COMPARATORS) {
    const at = text.indexOf(comparator)
    if (at === -1) continue
    const name = text.slice(0, at).trim()
    const operand = text.slice(at + comparator.length).trim()
    if (!named(name)) return { term: null, problem: `'${name}' is not an identifier` }
    if (!/^-?\d+$/.test(operand)) {
      return { term: null, problem: `'${operand}' is not an integer` }
    }
    return { term: { kind: 'scalar', name, comparator, operand: Number(operand) }, problem: null }
  }

  if (!named(text)) return { term: null, problem: `'${text}' is not an identifier` }
  return { term: { kind: 'flag', name: text, negated: false }, problem: null }
}

/**
 * The whole grammar, in one place.
 *
 * There is no `or` and no parenthesis, deliberately: alternation is a second
 * predicate in the array, which forces the author to ORDER the branches and
 * keeps each one readable in the draft table cell it is authored in.
 */
function parse(predicate: string): Parsed {
  const problems: string[] = []
  const arrow = predicate.indexOf('=>')
  const head = (arrow === -1 ? predicate : predicate.slice(0, arrow)).trim()
  const value = arrow === -1 ? null : readValue(predicate.slice(arrow + 2))

  if (arrow !== -1 && String(value).trim() === '') problems.push('`=>` with no value')

  if (head === '') return { condition: null, value, problems }

  const condition: Term[] = []
  for (const piece of head.split(' and ')) {
    const { term, problem } = readTerm(piece)
    if (term === null) problems.push(problem ?? 'unreadable term')
    else condition.push(term)
  }
  return { condition, value, problems }
}

function met(term: Term, state: PredicateState): boolean {
  const held = state[term.name]
  if (term.kind === 'flag') {
    // An unset flag is absent from the snapshot, not present-and-false — the
    // engine only writes a flag when something sets it. Absent therefore MEANS
    // false, which is what makes `not caller_named` read correctly on a run
    // that never reached G4.
    const on = held === true
    return term.negated ? !on : on
  }
  // A scalar's absence has no natural value the way a flag's does: it means the
  // meter was never bound (`variable: null` — lint F2, and twelve of 우는다리's
  // fourteen are), so there is no number to compare. `false` rather than 0,
  // which would let `fear < 10` match a variable that does not exist.
  if (typeof held !== 'number') return false
  switch (term.comparator) {
    case '>=':
      return held >= term.operand
    case '<=':
      return held <= term.operand
    case '==':
      return held === term.operand
    case '>':
      return held > term.operand
    case '<':
      return held < term.operand
  }
}

/**
 * Does this condition hold? The F1/F4 form — `edge_predicates`, `availability`,
 * `extra_condition`, a place yield's `depth_note`.
 *
 * A malformed condition is `false`. An unconditional predicate (`''`) is `true`.
 */
export function holds(condition: string, state: PredicateState): boolean {
  const parsed = parse(condition)
  if (parsed.problems.length > 0) return false
  if (parsed.condition === null) return true
  return parsed.condition.every((term) => met(term, state))
}

/**
 * The F3 form — `score.predicates`. First match wins; `null` when none does.
 *
 * `null` rather than the unit's `baseline`, deliberately: falling back to the
 * baseline needs `score.json`'s shape, and a module that knows the shape of one
 * caller's data is no longer the reader for the other four slots. The caller
 * decides what an unmatched unit means.
 *
 * Ordering is the author's and is not corrected here — an unconditional
 * predicate written first wins over every line below it. Lint owns that (a
 * fallback belongs last); at run time the rule is simply "first match".
 */
export function resolve(
  predicates: readonly string[],
  state: PredicateState,
): PredicateValue | null {
  for (const predicate of predicates) {
    const parsed = parse(predicate)
    if (parsed.problems.length > 0 || parsed.value === null) continue
    if (parsed.condition === null || parsed.condition.every((term) => met(term, state))) {
      return parsed.value
    }
  }
  return null
}

/**
 * Every identifier this predicate names, in order, without repeats.
 *
 * This exists so `authoring/lint-datapack.mjs` can resolve names against the
 * compiled pack — a flag no bucket sets, a scalar no meter binds — WITHOUT
 * carrying a second copy of the grammar. One parser, two callers.
 */
export function identifiers(predicate: string): string[] {
  const parsed = parse(predicate)
  return [...new Set((parsed.condition ?? []).map((term) => term.name))]
}

/**
 * Why this predicate is unreadable, or `[]` when it reads.
 *
 * The other half of lint's half: `identifiers()` answers "are these names
 * real?", this answers "is this a predicate at all?". Both have to come from
 * here, because a grammar with two implementations has two grammars.
 */
export function problems(predicate: string): string[] {
  return parse(predicate).problems
}

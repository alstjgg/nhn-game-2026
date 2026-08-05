/**
 * Edge predicates — `gates.json`'s `edge_predicates`, compiled once at
 * schedule-build time and evaluated against the state core afterwards.
 *
 * The vocabulary is deliberately tiny (spec-engine §4.3):
 *
 * ```
 * <variable> >= <int> -> <node>      # also <=, >, <, ==
 * <flag> == true      -> <node>
 * else                -> <node>
 * ```
 *
 * No conjunction, no arithmetic, no free text. Two rules follow:
 * a non-empty array must end with `else` (decision D5), and an unparseable
 * line is a **build-time** error — a datapack that cannot route must not reach
 * a running game and fail mid-beat.
 */

import type { StateCorePort } from './ports.ts'
import { PredicateSyntaxError } from './errors.ts'

export type CompareOp = '>=' | '<=' | '==' | '>' | '<'

/** One compiled routing edge. Evaluated first-true, top to bottom. */
export type CompiledEdge =
  | { kind: 'cmp'; variable: string; op: CompareOp; value: number; node: string }
  | { kind: 'flag'; flag: string; node: string }
  | { kind: 'else'; node: string }

const ARROW = '->'
const ELSE = 'else'
const FLAG_LITERAL = 'true'

/** `<identifier> <op> <rest>`; `rest` is validated separately. */
const COMPARISON = /^([A-Za-z_][A-Za-z_0-9]*)\s*(>=|<=|==|>|<)\s*(.+)$/
const INTEGER = /^-?\d+$/

const COMPARE_OPS: CompareOp[] = ['>=', '<=', '==', '>', '<']

/**
 * @throws {PredicateSyntaxError} on an unparseable line, on an `else` that is
 * not last, or on a non-empty array with no `else` at all.
 */
export function compileEdges(lines: readonly string[]): CompiledEdge[] {
  const edges = lines.map((line) => compileEdge(line))
  const last = edges.length - 1
  edges.forEach((edge, at) => {
    if (edge.kind === ELSE && at !== last) {
      throw new PredicateSyntaxError(`'else' must be the last edge predicate, not line ${at}`)
    }
  })
  if (edges.length > 0 && edges[last]!.kind !== ELSE) {
    throw new PredicateSyntaxError('a non-empty edge_predicates array must end with an else predicate')
  }
  return edges
}

function compileEdge(line: string): CompiledEdge {
  const at = line.indexOf(ARROW)
  if (at < 0 || line.indexOf(ARROW, at + ARROW.length) >= 0) {
    throw new PredicateSyntaxError(`edge predicate needs exactly one '->': ${JSON.stringify(line)}`)
  }
  const left = line.slice(0, at).trim()
  const node = line.slice(at + ARROW.length).trim()
  if (node === '') {
    throw new PredicateSyntaxError(`edge predicate has no target node: ${JSON.stringify(line)}`)
  }
  if (left === ELSE) return { kind: ELSE, node }

  const parts = COMPARISON.exec(left)
  if (parts === null) {
    throw new PredicateSyntaxError(`edge predicate does not parse: ${JSON.stringify(line)}`)
  }
  const name = parts[1]!
  const op = toCompareOp(parts[2]!, line)
  const right = parts[3]!.trim()

  if (right === FLAG_LITERAL) {
    if (op !== '==') {
      throw new PredicateSyntaxError(`a flag predicate must use '==': ${JSON.stringify(line)}`)
    }
    return { kind: 'flag', flag: name, node }
  }
  if (!INTEGER.test(right)) {
    throw new PredicateSyntaxError(
      `the right side must be an integer or 'true': ${JSON.stringify(line)}`,
    )
  }
  return { kind: 'cmp', variable: name, op, value: Number(right), node }
}

function toCompareOp(raw: string, line: string): CompareOp {
  const hit = COMPARE_OPS.find((op) => op === raw)
  if (hit === undefined) {
    throw new PredicateSyntaxError(`unknown comparison operator in ${JSON.stringify(line)}`)
  }
  return hit
}

/**
 * First-true, top to bottom, against **whatever the state core holds now** —
 * the caller is responsible for having applied this beat's deltas first
 * (spec-engine §4.1). Returns `null` when no edge matches, which includes the
 * empty array a pre-hardening gate ships (decision D5).
 */
export function evaluateEdges(edges: readonly CompiledEdge[], state: StateCorePort): string | null {
  for (const edge of edges) {
    if (edge.kind === ELSE) return edge.node
    if (edge.kind === 'flag') {
      if (state.readFlag(edge.flag)) return edge.node
      continue
    }
    if (compare(state.read(edge.variable), edge.op, edge.value)) return edge.node
  }
  return null
}

function compare(left: number, op: CompareOp, right: number): boolean {
  switch (op) {
    case '>=':
      return left >= right
    case '<=':
      return left <= right
    case '==':
      return left === right
    case '>':
      return left > right
    case '<':
      return left < right
  }
}

/**
 * `{TEMPERAMENT}` renderer — structured `Temperament` pack → the prose the
 * bare slot in `proxy/prompts/judgment/base-v0.4.md` and
 * `proxy/prompts/reporter/base-v0.2.md` expects (contract-engine-composer §4).
 *
 * Pure function of the pack — no fs, no DOM, no clock, no randomness — so the
 * same pack always yields the same bytes (contract §4 invariant 3), and Call 1
 * (GateView) and Call 3 (RoundView) can share one renderer over one value
 * (invariant 1) instead of two copies that can drift.
 *
 * The exact prose SHAPE below is **provisional / 잠정** — contract §4.1 names
 * it "the one item in this contract a work unit must not resolve on its own"
 * and reserves it for S + D. This renderer only has to satisfy §4's four
 * invariants (byte-identical across calls, never empty, deterministic, ships
 * its own header — the slot is bare in both templates) plus carry every
 * authored field without dropping any of them. When S + D land the ratified
 * shape, only the body of this function changes; the export stays the same.
 */
import type { Temperament } from './datapack.ts'

/** The header this renderer supplies — {TEMPERAMENT} sits bare in its templates. */
const HEADER = '[기질]'

export function renderTemperament(pack: Temperament): string {
  if (typeof pack !== 'object' || pack === null) {
    throw new Error('renderTemperament: pack must be a Temperament object')
  }
  if (typeof pack.default_disposition !== 'string') {
    throw new Error('renderTemperament: default_disposition must be a string')
  }
  if (!Array.isArray(pack.clauses)) {
    throw new Error('renderTemperament: clauses must be an array')
  }

  const lines: string[] = [HEADER, '', pack.default_disposition]

  for (const clause of pack.clauses) {
    lines.push('', clause.condition, clause.defeat_condition)
  }

  return lines.join('\n')
}

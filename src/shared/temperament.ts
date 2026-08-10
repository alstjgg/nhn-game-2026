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
 *
 * The header text below is the one exemplar the spec gives (probe fixture
 * `tools/probe/fixtures/temperament/k1.md`, design decision 6): S + D still
 * own the final call, but this is not a placeholder invented by this unit.
 *
 * D4 / spec S5: this renderer is **total** — no validation, no throw.
 * Validation of authored data is `authoring/lint-datapack.mjs`'s job; a
 * malformed field is guarded and skipped here (never coerced into the
 * prompt), not raised as an error.
 */
import type { Temperament } from './datapack.ts'

/** contract §4's name for the renderer's input — a local alias, not a new type. */
export type TemperamentPack = Temperament

/** The header this renderer supplies — {TEMPERAMENT} sits bare in its templates. */
const HEADER = '**너의 기질 — 이것은 협상 대상이 아니다.**'

function str(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

export function renderTemperament(pack: TemperamentPack): string {
  const lines: string[] = [HEADER]

  // No blank line between the header and the disposition. Every probe fixture
  // this renderer is measured against — `k1.md`, `k2.md`, `dome-base.md` —
  // attaches the body directly under the header, and a pack whose measurements
  // were taken on one shape should not ship on another. The clause separators
  // below stay: nothing was ever measured with more than one paragraph.
  const disposition = str(pack?.default_disposition)
  if (disposition) {
    lines.push(disposition)
  }

  const clauses = Array.isArray(pack?.clauses) ? pack.clauses : []
  for (const clause of clauses) {
    if (clause == null || typeof clause !== 'object') continue
    const condition = str((clause as { condition?: unknown }).condition)
    const defeatCondition = str((clause as { defeat_condition?: unknown }).defeat_condition)
    if (!condition && !defeatCondition) continue
    lines.push('')
    if (condition) lines.push(condition)
    if (defeatCondition) lines.push(defeatCondition)
  }

  return lines.join('\n')
}

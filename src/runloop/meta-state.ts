/**
 * `MetaState` — the run-loop manager's artifact (contract-run-artifacts §1).
 *
 * `data/runs/_schema/meta-state.schema.json` is the law on this shape; the
 * declarations here mirror it and must not drift from it. Field names are the
 * schema's, snake_case included.
 *
 * Exposure depth follows contract-run-artifacts §2, "unmeasurable ≠ zero": a
 * run that reached no clock contributes `null`, never `0` and never `'00:00'`.
 */

import type { Block } from '../shared/contracts.ts'

export type MetaState = {
  pack_slug: string
  run_count: number
  /** Max clock ever reached across runs, or `null` before any run has one. */
  exposure_clock_reached: string | null
  /** Blocks carried into the next run's prompt. */
  carried_blocks: Block[]
  /** Archived run ids — the index for past-report browsing/mining. */
  report_archive: string[]
}

/**
 * The clock grammar, mirroring `exposure_clock_reached`'s schema pattern
 * byte-for-byte. `HH:MM`, optionally suffixed `+` (past the end clock).
 */
export const CLOCK_RE = /^([01][0-9]|2[0-3]):[0-5][0-9]\+?$/

function checkClock(value: string | null): void {
  if (value !== null && !CLOCK_RE.test(value)) {
    throw new RangeError(`not a clock: ${JSON.stringify(value)}`)
  }
}

/**
 * Null-safe max of two clocks — a comparison, never arithmetic. Fixed-width
 * `HH:MM` makes lexicographic order the same as chronological order, and the
 * `+` suffix sorts after its bare clock but before the next minute.
 *
 * `null` means unmeasurable: it yields to any real clock and, when both sides
 * are unmeasurable, stays `null` rather than collapsing to a fabricated zero.
 */
export function deeperClock(a: string | null, b: string | null): string | null {
  checkClock(a)
  checkClock(b)
  if (a === null) return b
  if (b === null) return a
  return a >= b ? a : b
}

export function emptyMetaState(packSlug: string): MetaState {
  return {
    pack_slug: packSlug,
    run_count: 0,
    exposure_clock_reached: null,
    carried_blocks: [],
    report_archive: [],
  }
}

/** A deep copy — accessors hand these out so callers cannot reach through. */
export function cloneMetaState(state: MetaState): MetaState {
  return {
    pack_slug: state.pack_slug,
    run_count: state.run_count,
    exposure_clock_reached: state.exposure_clock_reached,
    carried_blocks: state.carried_blocks.map((b) => ({ id: b.id, text: b.text })),
    report_archive: [...state.report_archive],
  }
}

function isBlock(value: unknown): value is Block {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false
  const b = value as Record<string, unknown>
  return typeof b.id === 'string' && b.id.length > 0 && typeof b.text === 'string' && b.text.length > 0
}

/**
 * Structural guard for a payload that came back from a store — anything a
 * previous version, another pack, or a hand-edit could have left behind is
 * rejected here so the loop falls back to a fresh state instead of throwing.
 */
export function isMetaState(value: unknown): value is MetaState {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false
  const v = value as Record<string, unknown>

  if (typeof v.pack_slug !== 'string' || v.pack_slug.length === 0) return false
  if (typeof v.run_count !== 'number' || !Number.isInteger(v.run_count) || v.run_count < 0) return false

  const clock = v.exposure_clock_reached
  if (clock !== null && !(typeof clock === 'string' && CLOCK_RE.test(clock))) return false

  if (!Array.isArray(v.carried_blocks) || !v.carried_blocks.every(isBlock)) return false
  if (!Array.isArray(v.report_archive)) return false
  if (!v.report_archive.every((r) => typeof r === 'string' && r.length > 0)) return false

  return true
}

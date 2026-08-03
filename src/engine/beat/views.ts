/**
 * The two things every view slot needs: a deep copy, and the timeline window.
 *
 * **Snapshots, not handles.** `gateView` / `beatView` / `roundView` promise
 * plain data that no caller can use to reach back into engine state (contract
 * engine ⟷ composer §2). A shallow copy would keep that promise only at the
 * top level, so the clone here is total.
 *
 * **The window never severs a beat.** Lines are recorded per beat, and the cap
 * is applied by dropping whole oldest beats. A beat that alone exceeds the cap
 * is emitted whole rather than cut in half — a half-beat reads as a lie about
 * what happened.
 */

import { TIMELINE_CAP_LINES } from './caps.ts'

function cloneUnknown(value: unknown): unknown {
  if (Array.isArray(value)) return value.map((item) => cloneUnknown(item))
  if (value !== null && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [key, item] of Object.entries(value)) out[key] = cloneUnknown(item)
    return out
  }
  return value
}

/** A deep copy sharing no object or array instance with `value`. */
export function cloneDeep<T>(value: T): T {
  return cloneUnknown(value) as T
}

/**
 * The most recent lines within the cap, oldest first, whole beats only.
 *
 * @param groups one entry per beat that recorded lines, in beat order.
 */
export function windowLines(groups: readonly (readonly string[])[]): string[] {
  const kept: string[][] = []
  let total = 0
  for (let at = groups.length - 1; at >= 0; at -= 1) {
    const group = groups[at]!
    if (kept.length > 0 && total + group.length > TIMELINE_CAP_LINES) break
    kept.unshift([...group])
    total += group.length
  }
  return kept.flat()
}

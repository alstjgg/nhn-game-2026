// The invariant-12 enforcement point — spec-client §3 inv 12 and the §5.2
// closing paragraph: the driver, not the windows, is where the guarantee lives
// that the private half of a call never reaches a view.
//
// The seam types already make the banned fields unspeakable, but fixtures and
// (later) a live engine bind hand it plain objects, so the shape is re-checked
// at run time on the way out of the driver and before any subscriber sees it.
import type { ViewEvent } from '../../shared/view-driver.ts'

/** Whole keys that may never cross the seam. */
const BANNED_EXACT: readonly string[] = ['inner_note', 'temperament', 'truths']

/** Key families that may never cross the seam. */
const BANNED_PREFIX: readonly string[] = ['because_', 'rejected_']

function isBanned(key: string): boolean {
  return BANNED_EXACT.includes(key) || BANNED_PREFIX.some((p) => key.startsWith(p))
}

function walk(node: unknown, seen: WeakSet<object>, path: string): void {
  if (node === null || typeof node !== 'object') return
  if (seen.has(node)) return
  seen.add(node)

  if (Array.isArray(node)) {
    node.forEach((item, i) => walk(item, seen, `${path}[${i}]`))
    return
  }

  for (const [key, value] of Object.entries(node)) {
    const here = path ? `${path}.${key}` : key
    if (isBanned(key)) {
      throw new Error(`view-driver seam leak: \`${key}\` may not cross the seam (at ${here})`)
    }
    walk(value, seen, here)
  }
}

/**
 * Throws — naming the offending key — if anything reachable from `event`
 * carries a field the seam forbids. Deep, array-aware and cycle-safe.
 */
export function assertSeamClean(event: ViewEvent): void {
  walk(event, new WeakSet<object>(), '')
}

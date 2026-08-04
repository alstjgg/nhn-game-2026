/**
 * The invariant-12 enforcement point for the LIVE driver — spec-client §5.2's
 * closing paragraph: the driver, not the windows, is where the guarantee lives
 * that the private half of a call never reaches a view.
 *
 * `src/client/driver/seam-guard.ts` holds the same rule for the fixture driver.
 * The duplication is deliberate (spec decision 7): `src/client/**` is frozen and
 * the isomorphic core may not reach into it, so the rule is re-stated here
 * rather than imported. Consolidating both into `src/shared/` is a later unit's
 * call — recorded in `discovery/e7.md`.
 *
 * The whole `JudgmentResponse` legitimately crosses into the engine (its
 * `inner_note` is Call 3's input, contract-engine-composer §5), which is exactly
 * why the check belongs on the driver's *out*-edge and nowhere else.
 */

import type { ViewEvent } from '../shared/view-driver.ts'

/** Whole keys that may never cross the seam. */
const BANNED_EXACT: readonly string[] = ['inner_note', 'temperament']

/** Key families that may never cross the seam. */
const BANNED_PREFIX: readonly string[] = ['because_', 'rejected_', 'truths']

function isBanned(key: string): boolean {
  return BANNED_EXACT.includes(key) || BANNED_PREFIX.some((prefix) => key.startsWith(prefix))
}

function walk(node: unknown, seen: WeakSet<object>, path: string): void {
  if (node === null || typeof node !== 'object') return
  if (seen.has(node)) return
  seen.add(node)

  if (Array.isArray(node)) {
    node.forEach((item, index) => walk(item, seen, `${path}[${index}]`))
    return
  }

  for (const [key, value] of Object.entries(node)) {
    const here = path === '' ? key : `${path}.${key}`
    if (isBanned(key)) {
      throw new Error(`view-driver seam leak: \`${key}\` may not cross the seam (at ${here})`)
    }
    walk(value, seen, here)
  }
}

/**
 * Throws — naming the offending key — if anything reachable from `event` carries
 * a field the seam forbids. Deep, array-aware and cycle-safe.
 *
 * Returns the event it was given, so the guarded value is the only thing a
 * caller has to emit: skipping the guard becomes a visible edit, not an
 * omission.
 */
export function assertSeamClean(event: ViewEvent): ViewEvent {
  walk(event, new WeakSet<object>(), '')
  return event
}

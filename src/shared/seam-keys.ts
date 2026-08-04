/**
 * The view-driver seam's banned-key rule — one definition, both drivers.
 *
 * spec-client §5.2's closing paragraph puts the guarantee on the driver: "the
 * driver, not the windows, is where that guarantee is enforced (invariant 12)".
 * There are two drivers — the fixture one at `src/client/driver/` and the live
 * one at `src/driver/` — and until now each carried its own copy of the rule.
 *
 * The copies had DRIFTED. `truths` was a whole-key ban on the client side and a
 * prefix ban on the live side, so a key like `truths_hidden` passed the fixture
 * driver and threw in the live one — the two modes were no longer
 * pixel-identical in the one place inv 12 exists to keep them so. No leak ever
 * shipped, because the live path was the stricter of the two, but "the strict
 * one happens to be the one that matters" is not a guarantee.
 *
 * The duplication was deliberate when it was written (`discovery/e7.md`): the
 * isomorphic core may not reach into `src/client/**`, and that glob was frozen
 * for the engine run. `src/shared/` is the resolution both notes pointed at —
 * neither side reaches into the other, and both already depend on it.
 *
 * The union is taken at its STRICTEST in every case, so consolidation can only
 * catch more than either copy did alone.
 */

/** Whole keys that may never cross the seam. */
export const BANNED_EXACT: readonly string[] = ['inner_note', 'temperament']

/**
 * Key families that may never cross the seam.
 *
 * `truths` is here rather than in `BANNED_EXACT` because it is the stricter of
 * the two forms the drivers had: it bans `truths` itself and any `truths*`
 * sibling an engine might grow. Nothing in the seam types or the fixtures uses a
 * `truths`-prefixed key for anything legitimate.
 */
export const BANNED_PREFIX: readonly string[] = ['because_', 'rejected_', 'truths']

/** Whether `key` is one the seam forbids, by whole name or by family. */
export function isBannedSeamKey(key: string): boolean {
  return BANNED_EXACT.includes(key) || BANNED_PREFIX.some((prefix) => key.startsWith(prefix))
}

/**
 * Throws — naming the offending key and its path — if anything reachable from
 * `node` carries a field the seam forbids. Deep, array-aware and cycle-safe.
 *
 * Takes `unknown` rather than `ViewEvent` so that this module imports nothing:
 * `view-driver.ts` is asserted to be a leaf, and a shared rule that pulled it in
 * would put a second edge into the seam module's neighbourhood for no gain.
 */
export function assertNoBannedSeamKeys(node: unknown): void {
  walk(node, new WeakSet<object>(), '')
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
    if (isBannedSeamKey(key)) {
      throw new Error(`view-driver seam leak: \`${key}\` may not cross the seam (at ${here})`)
    }
    walk(value, seen, here)
  }
}

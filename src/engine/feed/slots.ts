/**
 * The two supplier sets §8-1's closure needs that are not view types.
 *
 * §8-1 asks that every slot in call contracts §6's supplier table resolve to
 * exactly one of `GateView ∪ BeatView ∪ RoundView ∪ ComposerDeps ∪
 * PROXY_OWNED_SLOTS`. Three of those five are declared as types in
 * `src/engine/index.ts`; the other two were named by the criterion but never
 * written down anywhere. They are transcribed here, from §6's own rows, so the
 * closure test has a real target instead of restating the table against itself.
 *
 * Both names are §8-1's wording, not inventions. Whoever lands the composer
 * should re-point at these rather than keeping a second copy — the whole value
 * of the criterion is that it fails the moment §6 gains a slot nobody assigned.
 */

/**
 * §6 row 1 — the default prompt authored by the D task. These never cross the
 * engine seam at all; the proxy fills them.
 */
export const PROXY_OWNED_SLOTS: readonly string[] = ['FLAW', 'INCIDENT', 'PRIORITY_LIST']

/**
 * The slots the composer supplies from its own dependencies rather than from an
 * engine view: `BLOCKS` comes from the player's mined selection, and
 * `REPORT_GUIDANCE` is read from policy data.
 */
export const COMPOSER_DEP_SLOTS: readonly string[] = ['BLOCKS', 'REPORT_GUIDANCE']

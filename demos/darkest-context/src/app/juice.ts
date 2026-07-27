// u17 — the juice layer's one seam into the composition.
//
// `src/styles/juice.css` is the whole of the motion pass; this module exists so it has
// exactly ONE importer in `src/**` (a stylesheet nobody imports ships nowhere, and a
// stylesheet three modules import is a stylesheet nobody owns), and so the phase
// entrance can be re-armed per mount.
//
// Re-arming is the reason a bare CSS rule would not do: the class has to be removed and
// re-added for the animation to restart when a screen replaces another screen in the
// same slot.

import '../styles/juice.css';

/** The phase-entrance class `juice.css` declares. */
export const JUICE_PHASE_CLASS = 'dc-juice-phase';

/**
 * Plays the phase entrance on a screen that has just taken the slot. Reading
 * `offsetWidth` between the remove and the add is the standard restart: it forces the
 * style flush that makes the browser treat the second add as a new animation.
 */
export function playPhaseEntrance(element: HTMLElement): void {
  element.classList.remove(JUICE_PHASE_CLASS);
  void element.offsetWidth;
  element.classList.add(JUICE_PHASE_CLASS);
}

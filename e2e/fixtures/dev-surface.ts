// [u11#c12] C14/C15 — the DEV-only surfaces that sit ON TOP of the desk, and
// how a spec that MEASURES the desk gets them out of the way.
//
// `vite.config.ts` folds `__DEBUG_PANE__` to `mode !== 'production'`, so every
// e2e host except `preview` boots with u9d's pane mounted. The pane is
// `position:fixed; left:0; bottom:0; max-width:46vw; max-height:42vh` — it
// covers the bottom-left quadrant of a 1280x800 desk, which is exactly where
// LIVE FEED's resize grip and its lower body live. A pointer press there lands
// on the pane, not on the window, and a geometry oracle written against the
// player's desk reads a window that "cannot be resized" or "does not raise".
//
// C14 already rules this for captures ("a shot with the pane visible is an
// INVALID shot, not a finding — it covers the desk in dev"), and C15 rules the
// same class of harness state on element shots. This is the same artefact in
// the pointer path, so it gets the same treatment: hide the DEV-only pane and
// measure the desk the player actually gets. Nothing is skipped and no assert
// is loosened — the pane is absent from the player bundle by inv 11, and
// `e2e/debug-pane.spec.ts` (which owns the pane's own contract) never calls
// this.
import type { Page } from 'playwright/test'

/** The pane's root and the class the flag-on mount also carries. */
const PANE_SELECTOR = '#debug-pane,.debug-pane'

/**
 * Hides u9d's DEV-only debug pane for the rest of the page's life.
 *
 * Style-only: the pane stays mounted, keeps recording, and is still reachable
 * to any assert that wants it — it simply stops covering the desk.
 */
export async function hideDebugPane(page: Page): Promise<void> {
  await page.addStyleTag({ content: `${PANE_SELECTOR}{display:none!important}` })
}

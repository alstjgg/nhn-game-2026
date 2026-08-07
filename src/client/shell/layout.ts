// [u3#c2] The default desk arrangement — a pure function of the viewport.
//
// Ported from docs/design/phase2-ui/app.js `applyLayout()` (lines 98..122):
// the same column ratios (.265 / .395), the same 94px chrome band, the same
// .565 split between REPORTS and BLOCK STORE, the same 14/16px gutters. The
// reference read the ambient viewport and wrote straight into the DOM; here
// the viewport is an argument and the arrangement is the return value, so the
// desk can be computed — and asserted — without a DOM at all.
//
// TALLY IS A FLOATING SHEET AGAIN (u7, 08-04 — see discovery/u7.md).
// u3 originally deviated here: it parked TALLY in a 26 %-of-desk band under
// the three columns so that all five windows could tile at once ([u3#c1]).
// u7 ships the window's contents, and the band cannot hold them — at 1280×800
// it is 180 px tall against 415 px of ledger (head · headline · one rule per
// scored axis · verdict · the wait line and NEW RUN), so the ledger, the wait
// line and the window's only button all render below the frame. C9 forbids
// that ("nothing off-screen in the default layout"), u1's shipped `.tly-*`
// skin is sized for the reference's tall sheet, and u7 may write neither CSS
// nor inline geometry — so the band is not a fixable shape, and this file goes
// back to the reference's own arrangement (app.js line 122):
//
//   set('tally', max(20,(W-730)/2), TOP+16, 730, min(626, H-16))
//
// which is why the three columns take the whole desk height again. The premise
// of u3's deviation is gone with it: TALLY boots hidden (u7 mounts it closed)
// and comes up only at 21:04, so it buries nothing while the day is running,
// and it is the reference's "the tally owns the screen at end of run".
//
// Floors keep every box positive below the supported 1280×800 minimum (C9):
// out of support degrades, it never inverts.

/** The four desk windows, in the order the taskbar and the registry use. */
export const WINDOW_KEYS = ['feed', 'file', 'rep'] as const

export type WindowKey = (typeof WINDOW_KEYS)[number]

/**
 * The desk's READING order — the order the arrangement below puts the windows
 * in on screen, row by row and left to right: LIVE FEED (x14) · REPORTS (x369)
 * · AGENT FILE (x891) on the top row, BLOCK STORE under REPORTS, and the TALLY
 * sheet, which is hidden until 21:04, last.
 *
 * `#desktop`'s child order follows THIS, not `WINDOW_KEYS`. Tab used to walk
 * the registry order (feed · file · store · rep) while the desk was laid out
 * feed · rep · file · store, so three of the four window transitions sent focus
 * somewhere the eye did not predict — WCAG 2.4.3 Focus Order (Level A), and the
 * defect `e2e/a11y.spec.ts` quarantined under `test.fail` because u9 was not
 * allowed to touch u3's shell. The registry/taskbar order is unchanged.
 */
export const DESK_ORDER: readonly WindowKey[] = ['feed', 'rep', 'file']

export interface Viewport {
  width: number
  height: number
}

/** A desk box in CSS pixels — written out as `--x/--y/--w/--h`. */
export interface WinRect {
  x: number
  y: number
  w: number
  h: number
}

/** Chrome band: top row 47 + taskbar 29 + air. Nothing may sit above it. */
const TOP = 94
/** Desk margin against the viewport edges. */
const GUTTER = 14
/** Air between two columns. */
const GAP = 16
const COL_A_RATIO = 0.265
const COL_B_RATIO = 0.395
const MIN_W = 240
const MIN_H = 120

const px = (value: number): number => Math.round(value)

export function applyLayout(viewport: Viewport): Record<WindowKey, WinRect> {
  const W = Math.max(MIN_W * 2 + GUTTER * 2, px(viewport.width))
  const deskH = Math.max(MIN_H, px(viewport.height) - TOP - GUTTER)

  const colA = px(W * COL_A_RATIO)
  const colB = px(W * COL_B_RATIO)
  const xB = GUTTER + colA + GAP
  const xC = xB + colB + GAP
  const colC = Math.max(MIN_W, W - xC - GUTTER)

  const colH = deskH

  return {
    feed: { x: GUTTER, y: TOP, w: colA, h: colH },
    rep: { x: xB, y: TOP, w: colB, h: colH },
    file: { x: xC, y: TOP, w: colC, h: colH },
  }
}

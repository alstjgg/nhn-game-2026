// [u3#c2] The default desk arrangement — a pure function of the viewport.
//
// Ported from docs/design/phase2-ui/app.js `applyLayout()` (lines 98..122):
// the same column ratios (.265 / .395), the same 94px chrome band, the same
// 14/16px gutters. The reference read the ambient viewport and wrote straight
// into the DOM; here the viewport is an argument and the arrangement is the
// return value, so the desk can be computed — and asserted — without a DOM at
// all.
//
// THREE COLUMNS, FULL HEIGHT (T1, 08-07). The desk this file lays out has held
// five windows, then four, and now three: u7 floated TALLY back out of the
// column band it was parked in, U3 dissolved TALLY into the AGENT FILE and the
// report, and T1 dissolved BLOCK STORE into REPORTS. What is left tiles without
// a special case — LIVE FEED, REPORTS and AGENT FILE side by side, each taking
// the whole desk height — so the arrangement below is the reference's own again
// and the .565 split that once cut REPORTS in half is gone with the window it
// made room for.
//
// `DESK_ORDER` below must move with these rects: the focus-order assert in
// `e2e/a11y.spec.ts` compares tab order to them row-major.
//
// Floors keep every box positive below the supported 1280×800 minimum (C9):
// out of support degrades, it never inverts.

/** The three desk windows, in the order the taskbar and the registry use. */
export const WINDOW_KEYS = ['feed', 'file', 'rep'] as const

export type WindowKey = (typeof WINDOW_KEYS)[number]

/**
 * The desk's READING order — the order the arrangement below puts the windows
 * in on screen, left to right in one row: LIVE FEED · REPORTS · AGENT FILE.
 *
 * `#desktop`'s child order follows THIS, not `WINDOW_KEYS`. Tab used to walk
 * the registry order while the desk was laid out in another, so window
 * transitions sent focus somewhere the eye did not predict — WCAG 2.4.3 Focus
 * Order (Level A). `e2e/a11y.spec.ts` quarantined that defect under
 * `test.fail` while u9 was forbidden from touching u3's shell; the quarantine
 * is lifted and the assert compares tab order to the rects row-major, so this
 * export drifting from the arrangement below is a real red. The
 * registry/taskbar order is unchanged.
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

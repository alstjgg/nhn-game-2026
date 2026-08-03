// [u3#c2] The default desk arrangement — a pure function of the viewport.
//
// Ported from docs/design/phase2-ui/app.js `applyLayout()` (lines 98..122):
// the same column ratios (.265 / .395), the same 94px chrome band, the same
// .565 split between REPORTS and BLOCK STORE, the same 14/16px gutters. The
// reference read the ambient viewport and wrote straight into the DOM; here
// the viewport is an argument and the arrangement is the return value, so the
// desk can be computed — and asserted — without a DOM at all.
//
// ONE DEVIATION from the reference, and it is deliberate (discovery/u3.md):
// the reference floats TALLY as a 730-wide sheet over the middle of the desk,
// which it can only do because it boots with `w-tally` hidden and opens it at
// run end. u3 puts all five windows on the desk at once ([u3#c1]), so a
// floating sheet would bury BLOCK STORE's title bar and its own would be
// buried in turn. TALLY keeps its wide-sheet proportions and takes the band
// under the three columns instead: the desk tiles, and every window is
// reachable without moving another one first.
//
// Floors keep every box positive below the supported 1280×800 minimum (C9):
// out of support degrades, it never inverts.

/** The five desk windows, in the order the taskbar and the registry use. */
export const WINDOW_KEYS = ['feed', 'file', 'store', 'rep', 'tally'] as const

export type WindowKey = (typeof WINDOW_KEYS)[number]

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
/**
 * Air between the column band and the TALLY band. Wider than a gutter on
 * purpose: it is a rule between two parts of the desk, and it keeps a window
 * nudged one step down off the title bar of the one below it.
 */
const BAND_GAP = 30
const COL_A_RATIO = 0.265
const COL_B_RATIO = 0.395
/** REPORTS' share of the middle column's height; BLOCK STORE takes the rest. */
const REP_RATIO = 0.565
/** TALLY is a centred sheet, not a column — the reference keeps it wide and flat. */
const TALLY_W = 730
/** The share of the desk's height the TALLY band takes under the columns. */
const TALLY_RATIO = 0.26
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

  const tallyH = Math.max(MIN_H, px(deskH * TALLY_RATIO))
  const colH = Math.max(MIN_H, deskH - tallyH - BAND_GAP)
  const hRep = px(colH * REP_RATIO)
  const hStore = Math.max(MIN_H, colH - hRep - GUTTER)

  const tallyW = Math.max(MIN_W, Math.min(TALLY_W, W - GUTTER * 2))
  const tallyX = Math.max(GUTTER, px((W - tallyW) / 2))

  return {
    feed: { x: GUTTER, y: TOP, w: colA, h: colH },
    rep: { x: xB, y: TOP, w: colB, h: hRep },
    store: { x: xB, y: TOP + hRep + GUTTER, w: colB, h: hStore },
    file: { x: xC, y: TOP, w: colC, h: colH },
    tally: { x: tallyX, y: TOP + colH + BAND_GAP, w: tallyW, h: tallyH },
  }
}

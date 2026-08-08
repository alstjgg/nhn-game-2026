// [u3#c2] The default desk arrangement — a pure function of the viewport.
//
// Ported from docs/design/phase2-ui/app.js `applyLayout()` (lines 98..122):
// the same column ratios (.265 / .395), the same 94px chrome band, the same
// 14/16px gutters. The reference read the ambient viewport and wrote straight
// into the DOM; here the viewport is an argument and the arrangement is the
// return value, so the desk can be computed — and asserted — without a DOM at
// all.
//
// TWO COLUMNS (T3, 08-08). The desk this file lays out has held five windows,
// then four, then three: u7 floated TALLY back out of the column band it was
// parked in, U3 dissolved TALLY into the AGENT FILE and the report, and T1
// dissolved BLOCK STORE into REPORTS. Those were subtractions — the desk kept
// its shape and lost a column each time, which left REPORTS as the middle of
// three narrow strips.
//
// That is the wrong desk for what REPORTS became. It is where the day is read,
// where sentences are mined, and where cause will be shown; LIVE FEED is a
// ticker that is watched rather than read closely. So REPORTS takes the left
// column outright and the right column is split — the feed above, the file
// below, the file larger because it is worked in and the feed only scrolls.
//
// TWO THIRDS (x1, 08-08). T3 gave REPORTS half the desk; 민서 asked for two
// thirds, and the type scale went up 1.5× in the same breath. Both push the
// same way: REPORTS is the one window here whose content is PROSE, and prose
// at 1.5× in a half-width column wraps to ribbon. The right column pays — it
// carries a ticker that scrolls by nature and a document that is paged, and
// neither needs width the way a mined paragraph does.
//
// `DESK_ORDER` below must move with these rects: the focus-order assert in
// `e2e/a11y.spec.ts` sorts the windows row-major and compares that to tab
// order, and this desk has two rows rather than one.
//
// Floors keep every box positive below the supported 1280×800 minimum (C9):
// out of support degrades, it never inverts.

/** The three desk windows, in the order the taskbar and the registry use. */
export const WINDOW_KEYS = ['feed', 'file', 'rep'] as const

export type WindowKey = (typeof WINDOW_KEYS)[number]

/**
 * The desk's READING order — the order the arrangement below puts the windows
 * on screen, row by row and left to right: REPORTS (the left column) and LIVE
 * FEED (top right) share the first row; AGENT FILE (bottom right) is the
 * second.
 *
 * `#desktop`'s child order follows THIS, not `WINDOW_KEYS`. Tab used to walk
 * the registry order while the desk was laid out in another, so window
 * transitions sent focus somewhere the eye did not predict — WCAG 2.4.3 Focus
 * Order (Level A). `e2e/a11y.spec.ts` quarantined that defect under
 * `test.fail` while u9 was forbidden from touching u3's shell; the quarantine
 * is lifted and the assert now sorts the windows row-major — by `top`, and by
 * `left` inside a 24 px row tolerance — and compares that to tab order. This
 * export drifting from the arrangement below is a real red, and under a
 * two-row desk it is the ROW that decides, not the x alone. The
 * registry/taskbar order is unchanged.
 */
export const DESK_ORDER: readonly WindowKey[] = ['rep', 'feed', 'file']

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

/**
 * Chrome band: top row 71 + taskbar 44 + air. Nothing may sit above it.
 *
 * x1 (08-08) — 94 → 133. This number is not a measurement, it is a promise
 * about `styles/shell.css`, and the 1.5× type scale broke it: `.tb-row-1` went
 * 47 → 71 and `.tb-row-2` 29 → 44, so a desk that still started at 94 would
 * have put REPORTS and LIVE FEED under the taskbar. The 18 px of air between
 * the bar and the first window is unchanged — it is desk margin, not type.
 */
const TOP = 133
/** Desk margin against the viewport edges. */
const GUTTER = 14
/** Air between two columns. */
const GAP = 16
/** REPORTS' share of the desk width. The right column is the remainder. */
const COL_LEFT_RATIO = 0.5
/**
 * LIVE FEED's share of the right column's height; AGENT FILE takes the rest.
 *
 * Sized from what the FILE needs, not from taste. C1 made it a paged document
 * and its two pages measure 413px (cover) and 487px (the agent's own page,
 * whose four slots alone are 216) against a body that is the window less its
 * title bar. At .42 the file got 392 and clipped both — 교신 지침 off the cover
 * and the page control off the window entirely, which is C9 ("nothing
 * off-screen in the default layout") and would have left no way to turn the
 * page at all. At .25 the file gets 507 and both pages fit whole.
 *
 * The feed pays for it, and can: it is a ticker that scrolls, and the one
 * window here whose content is endless by nature. The file is a document that
 * has to be read entire.
 *
 * x1 (08-08) — .2 → .28, and the sentence above no longer holds. Two thirds of
 * the desk to REPORTS and 1.5× type together put the agent's page at 655 px
 * against a sheet of 389: the file scrolls now whatever this ratio says, and
 * `win-agent-file.css` pins the page control so that is survivable. Once the
 * file is scrolling either way, holding the feed at .2 buys the file nothing
 * and costs the feed everything — it measured 82 px of body, two lines, which
 * is not a ticker. .28 restores the three lines the desk was designed to show
 * and leaves the file the same scroll it already had.
 */
const ROW_TOP_RATIO = 0.3
const MIN_W = 240
const MIN_H = 120

const px = (value: number): number => Math.round(value)

export function applyLayout(viewport: Viewport): Record<WindowKey, WinRect> {
  const W = Math.max(MIN_W * 2 + GUTTER * 2, px(viewport.width))
  const deskH = Math.max(MIN_H * 2 + GAP, px(viewport.height) - TOP - GUTTER)

  const left = Math.max(MIN_W, px(W * COL_LEFT_RATIO))
  const xRight = GUTTER + left + GAP
  const right = Math.max(MIN_W, W - xRight - GUTTER)

  // The right column is split, so the floor is per HALF: a desk short enough
  // to squeeze one of them still gets two positive boxes, never an inverted
  // one (C9 — out of support degrades, it never inverts).
  const topH = Math.max(MIN_H, px((deskH - GAP) * ROW_TOP_RATIO))
  const yBottom = TOP + topH + GAP
  const bottomH = Math.max(MIN_H, deskH - topH - GAP)

  return {
    rep: { x: GUTTER, y: TOP, w: left, h: deskH },
    feed: { x: xRight, y: TOP, w: right, h: topH },
    file: { x: xRight, y: yBottom, w: right, h: bottomH },
  }
}

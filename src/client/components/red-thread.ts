// [u8] RedThread — the PURE half of the evidence-thread overlay.
//
// Ported from `docs/design/phase2-ui/app.js:566–602` (`visibleRect` 567 ·
// `drawThreads` 576): the clip predicate, the sag and the quadratic path are
// the reference's own numbers, rewritten as plain functions over plain records.
//
// This module is deliberately DOM-free — no element, no measurement, no global.
// It takes rectangles that somebody else already measured and returns the plans
// the renderer paints, so the whole geometry of the string is testable in node
// (design §3, [u8#c7]).
//
// Matching is id-exact and nothing else: `data-block-id` ↔ `data-sentence-id`
// through a single map lookup (spec-client §3 inv 3, [u8#c4]). There is no
// text comparison, no normalisation and no fuzzy fallback anywhere below — a
// slot whose source id was never rendered is simply not threaded.

/** A viewport-space rectangle, in the shape `getBoundingClientRect` reports. */
export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

export interface Pt {
  x: number
  y: number
}

/**
 * One end of a thread: the authored id, the node's own rect, and the rect of
 * the enclosing document body it must stay inside. `clip` is `null` when the
 * owning frame is shut or folded away — that end cannot be pinned at all.
 */
export interface AnchorSpec {
  id: string
  rect: Rect
  clip: Rect | null
}

export interface ThreadInput {
  /** `data-block-id` ends, in document order; duplicates of an id are folded. */
  slotAnchors: readonly AnchorSpec[]
  /** `data-sentence-id` ends, in document order. */
  sourceAnchors: readonly AnchorSpec[]
  /** Optional narrowing set from the driver — never widens (design E). */
  slotted?: readonly string[]
  /** The tally owns the screen while it is up: no string crosses it. */
  tallyOpen: boolean
}

export interface ThreadPlan {
  blockId: string
  /** The `d` of the quadratic, drawn source → slot. */
  d: string
  /** `[slot end, source end]` — where the two pins sit. */
  pins: readonly [Pt, Pt]
}

/* ── the reference's geometry (app.js:576–601), named ─────────────────────── */

export const THREAD_SAG_MAX = 46
export const THREAD_SAG_RATIO = 0.12
export const THREAD_SAG_BASE = 14
export const THREAD_PIN_R = 2.6
/** The slot pin sits just inside the card's left edge. */
export const THREAD_OFFSET_A = 6
/** The source pin sits just inside the sentence's right edge. */
export const THREAD_OFFSET_B = 4
/** The slack the clip predicate allows on the body's top and bottom edges. */
export const THREAD_CLIP_PAD = 2

const left = (r: Rect): number => r.x
const right = (r: Rect): number => r.x + r.width
const top = (r: Rect): number => r.y
const bottom = (r: Rect): number => r.y + r.height
const middle = (r: Rect): number => r.y + r.height / 2

/**
 * The reference's `visibleRect`: an anchor whose frame is shut, or which has
 * scrolled out of its document body, has no visible rect and yields no thread.
 */
export function clipRect(anchor: AnchorSpec): Rect | null {
  const body = anchor.clip
  if (body === null) return null
  const r = anchor.rect
  if (bottom(r) < top(body) + THREAD_CLIP_PAD) return null
  if (top(r) > bottom(body) - THREAD_CLIP_PAD) return null
  if (right(r) < left(body)) return null
  if (left(r) > right(body)) return null
  return r
}

/** `min(46, |dx| · .12) + 14` — the further apart, the deeper the string hangs. */
export function sagFor(x1: number, x2: number): number {
  return Math.min(THREAD_SAG_MAX, Math.abs(x1 - x2) * THREAD_SAG_RATIO) + THREAD_SAG_BASE
}

/** The reference quadratic, drawn from the source end `b` to the slot end `a`. */
export function pathFor(a: Pt, b: Pt): string {
  const mx = (a.x + b.x) / 2
  const my = (a.y + b.y) / 2 + sagFor(a.x, b.x)
  return `M${b.x} ${b.y} Q ${mx} ${my} ${a.x} ${a.y}`
}

/**
 * First node wins, and the fold keeps first-occurrence order: u4 writes the
 * same id on the `.slot` cell AND on its `.slot-pin`, so a node-count gate
 * would draw every thread twice (design B). An empty id is never an anchor.
 */
function foldById(anchors: readonly AnchorSpec[]): ReadonlyMap<string, AnchorSpec> {
  return new Map(
    anchors
      .filter((a, i, all) => a.id !== '' && all.findIndex((other) => other.id === a.id) === i)
      .map((a) => [a.id, a] as const),
  )
}

function allowSet(ids: readonly string[]): ReadonlySet<string> {
  return new Set(ids)
}

function planFor(slot: AnchorSpec, source: AnchorSpec): ThreadPlan | null {
  const ra = clipRect(slot)
  const rb = clipRect(source)
  if (ra === null || rb === null) return null
  const a: Pt = { x: left(ra) + THREAD_OFFSET_A, y: middle(ra) }
  const b: Pt = { x: right(rb) - THREAD_OFFSET_B, y: middle(rb) }
  return { blockId: slot.id, d: pathFor(a, b), pins: [a, b] }
}

/**
 * One plan per DISTINCT filled slot id, in slot-anchor order (design B). A slot
 * is planned only when a source anchor carries the identical id and both ends
 * are visible; everything else is silently dropped.
 */
export function planThreads(input: ThreadInput): ThreadPlan[] {
  if (input.tallyOpen) return []
  const sources = foldById(input.sourceAnchors)
  const slots = foldById(input.slotAnchors)
  const narrowing = input.slotted === undefined ? null : allowSet(input.slotted)
  return [...slots.values()].flatMap((slot) => {
    if (narrowing !== null && !narrowing.has(slot.id)) return []
    const source = sources.get(slot.id)
    if (source === undefined) return []
    const plan = planFor(slot, source)
    return plan === null ? [] : [plan]
  })
}

// [u8] The RedThread layer — the DOM half of the evidence-thread overlay.
//
// Ported from `docs/design/phase2-ui/app.js:566–602`. The reference re-drew the
// whole overlay on every desk event; this does the same, coalesced into one
// animation frame, and reads its endpoints straight out of the DOM:
//
//   endpoint A  `data-block-id`     — u4's filled slot (its `.slot-pin` first)
//   endpoint B  `data-sentence-id`  — u6's rendered source sentence
//
// It owns no state of its own ([u8#c7]): every redraw re-measures the anchors
// and re-derives every plan, so unslotting, collapsing, closing, scrolling or
// dragging need no bookkeeping here — the next frame simply tells the truth.
//
// The host is `index.html`'s `<svg id="threads" aria-hidden="true">`, already
// `position:fixed; z-index:460; pointer-events:none` in `shell.css`. The skin
// is element-driven (`#threads path` / `#threads circle`), so this file emits
// bare nodes and writes no styles at all (C11, [u8#c5]).
import { THREAD_PIN_R, planThreads } from '../components/red-thread.ts'
import type { AnchorSpec, Rect, ThreadPlan } from '../components/red-thread.ts'

const SVG_NS = 'http://www.w3.org/2000/svg'

// u4 writes the id on the `.slot` cell AND on the `.slot-pin` inside it, so
// document order puts the cell first and the fold keeps it: the reference ends
// its string 6px inside the slotted CARD (`app.js:583` reads `.bcard`), while
// `.slot-pin` is only the red dot the card's skin prints at its top-right
// corner (`desktop.css:405`). The overlay draws its own pins at the endpoints.
const SLOT_SELECTORS = ['[data-block-id]'] as const
const SOURCE_SELECTORS = ['[data-sentence-id]'] as const
const SLOT_ATTR = 'data-block-id'
const SOURCE_ATTR = 'data-sentence-id'

const WIN = '.win'
const WIN_BODY = '.win-body'
const HIDDEN = 'hidden'
const COLLAPSED = 'collapsed'

export interface ThreadLayerOptions {
  /** The existing `#threads` host — never created here, never re-styled. */
  host: SVGSVGElement
  /** Anchor and observer scope. Defaults to the whole document. */
  root?: ParentNode
  /** The driver's slotted ids, when the caller has them: narrows, never widens. */
  slotted?: () => Iterable<string>
}

export interface ThreadLayer {
  /** Re-measures and re-paints synchronously, cancelling any pending frame. */
  redraw(): void
  /** How many threads the last paint drew. */
  count(): number
  destroy(): void
}

declare global {
  interface Window {
    __threads?: ThreadLayer
  }
}

/** A plain record — the pure module never sees a live `DOMRect`. */
function rectOf(node: Element): Rect {
  const r = node.getBoundingClientRect()
  return { x: r.x, y: r.y, width: r.width, height: r.height }
}

/**
 * The reference's `visibleRect` guard, first half: the enclosing frame's body
 * rect, or `null` when the frame is shut, folded, or absent altogether. Cached
 * per redraw — five frames, measured once each however many anchors they hold.
 */
function bodyRect(node: Element, cache: Map<Element, Rect | null>): Rect | null {
  const win = node.closest(WIN)
  if (win === null) return null
  const cached = cache.get(win)
  if (cached !== undefined) return cached
  const body = win.querySelector(WIN_BODY)
  const shut = win.classList.contains(HIDDEN) || win.classList.contains(COLLAPSED)
  const value = body === null || shut ? null : rectOf(body)
  cache.set(win, value)
  return value
}

function anchorsFor(
  root: ParentNode,
  selectors: readonly string[],
  attribute: string,
  cache: Map<Element, Rect | null>,
  accept?: (id: string) => boolean,
): AnchorSpec[] {
  const out: AnchorSpec[] = []
  for (const selector of selectors) {
    for (const node of Array.from(root.querySelectorAll(selector))) {
      const id = node.getAttribute(attribute)
      if (id === null || (accept !== undefined && !accept(id))) continue
      out.push({ id, rect: rectOf(node), clip: bodyRect(node, cache) })
    }
  }
  return out
}

function svgNodesFor(plan: ThreadPlan): SVGElement[] {
  const path = document.createElementNS(SVG_NS, 'path')
  path.setAttribute('d', plan.d)
  return [
    path,
    ...plan.pins.map((pin) => {
      const circle = document.createElementNS(SVG_NS, 'circle')
      circle.setAttribute('cx', String(pin.x))
      circle.setAttribute('cy', String(pin.y))
      circle.setAttribute('r', String(THREAD_PIN_R))
      return circle
    }),
  ]
}

export function createThreadLayer(options: ThreadLayerOptions): ThreadLayer {
  const host = options.host
  const root: ParentNode = options.root ?? document
  let pending = 0
  let alive = true
  let drawn = 0

  function plans(): ThreadPlan[] {
    const cache = new Map<Element, Rect | null>()
    const slotAnchors = anchorsFor(root, SLOT_SELECTORS, SLOT_ATTR, cache)
    const wanted = new Set(slotAnchors.map((a) => a.id))
    const sourceAnchors = anchorsFor(root, SOURCE_SELECTORS, SOURCE_ATTR, cache, (id) => wanted.has(id))
    return planThreads({
      slotAnchors,
      sourceAnchors,
      slotted: options.slotted === undefined ? undefined : Array.from(options.slotted()),
      tallyOpen: false, // the TALLY sheet is gone (U3) — field ledgered for u8
    })
  }

  function draw(): void {
    host.setAttribute('viewBox', `0 0 ${window.innerWidth} ${window.innerHeight}`)
    const drawing = plans()
    host.replaceChildren(...drawing.flatMap(svgNodesFor))
    drawn = drawing.length
  }

  function schedule(): void {
    if (!alive || pending !== 0) return
    pending = requestAnimationFrame(() => {
      pending = 0
      draw()
    })
  }

  function redraw(): void {
    if (pending !== 0) {
      cancelAnimationFrame(pending)
      pending = 0
    }
    draw()
  }

  // Every desk signal collapses into the same dirty flag: window geometry and
  // window state are `style` / `class` writes ([u3]'s manager), a grip resize
  // and a re-layout resize the bodies, and a scrolled body moves its anchors.
  // Our own writes into the host are ignored, or the overlay would re-arm
  // itself every frame forever.
  const mutations = new MutationObserver((records) => {
    if (records.every((record) => host.contains(record.target))) return
    schedule()
  })
  mutations.observe(root as Node, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['style', 'class'],
  })

  const sizes = new ResizeObserver(() => schedule())
  for (const body of Array.from(root.querySelectorAll(WIN_BODY))) sizes.observe(body)

  const onViewport = (): void => schedule()
  window.addEventListener('resize', onViewport)
  document.addEventListener('scroll', onViewport, { capture: true, passive: true })

  function destroy(): void {
    alive = false
    mutations.disconnect()
    sizes.disconnect()
    window.removeEventListener('resize', onViewport)
    document.removeEventListener('scroll', onViewport, { capture: true })
    if (pending !== 0) {
      cancelAnimationFrame(pending)
      pending = 0
    }
    host.replaceChildren()
    drawn = 0
  }

  draw()
  return { redraw, count: () => drawn, destroy }
}

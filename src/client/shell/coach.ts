// The onboarding walk's coach mark — the plate, the leader and the scrim.
//
// WHY THIS OVERLAY IS ALLOWED TO EXIST. `shell/tutorial.ts` spent forty lines
// arguing that the walk must NOT be an overlay, and every word of that argument
// is still true: a class riding the element cannot be off by a pixel and cannot
// intercept a click, while an overlay has to track a rect through two scroll
// containers, a window drag and a page turn. What changed is not the argument,
// it is the requirement. That mark was SILENT — a window or a control glowing
// red in turn, with no sentence anywhere on the screen — so the operator watched
// the desk point at something and had to guess what it was pointing out. A walk
// that has to SAY something needs somewhere to print it, and printed copy needs
// a plate. A plate is DOM.
//
// So the two costs are PAID here rather than avoided:
//
//   the rect  — this module owns no cached geometry. A mark holds a SELECTOR and
//               never an element, and every measure pass re-resolves it and
//               re-measures from scratch, exactly as `shell/thread-layer.ts`
//               does: every desk signal collapses into one dirty flag and one
//               animation frame, and the next frame simply tells the truth. It
//               has to be that way — REPORTS repaints its sentences on every
//               typewriter tick and the AGENT FILE rebuilds its whole page on
//               `turn()`, so an element captured once is stale within a frame.
//   the click  — the scrim and the leader are one `pointer-events:none` SVG, and
//               only the plate takes pointer events. The desk stays fully
//               operable underneath a mark, which is load-bearing rather than
//               polite: most steps come down when the operator DOES the thing
//               the mark points at, so a mark that swallowed that press would
//               deadlock its own walk.
//
// WHAT IT IS NOT. Not a window: no title bar controls, no `--z`, not in
// `WINDOW_REGISTRY`, not in the taskbar, never seen by `applyLayout` —
// `shell/confirm.ts` argues that case at length and this plate stands on the
// same footing. Not modal either, and that is where it parts company with the
// confirmation plate: nothing is made `inert`, focus is not trapped, and the
// desk behind it keeps working. Not a product tour: no step counter, no ◂/▸,
// and nothing persisted (a page load is a new sitting — H2 — and gets the walk
// again).
//
// The skin is `styles/coach.css` and every colour and size lives in
// `styles/tokens.css` behind it. This file writes geometry and nothing else, and
// it writes it as custom properties — the pattern `shell/window-manager.ts`'s
// `setPx` established and `tests/shell/shell-source.test.ts` [C12/inv 8] (c)
// pins.
import { button, el } from './dom.ts'

/* ── the surface `shell/tutorial.ts` is written against ──────────────────── */

/** One mark: what it points at, what it says, and what puts it out. */
export interface CoachMark {
  /**
   * The target, as a selector. Resolved fresh on every measure pass — the desk
   * re-renders under a mark constantly (REPORTS repaints per typewriter tick,
   * the file rebuilds its page on `turn()`), so a mark holds a SELECTOR and
   * never an element.
   */
  target: string
  /** The one line the plate prints. */
  says: string
  /**
   * Which side of the target the plate prefers. The layer flips it when the
   * preferred side has no room in the viewport, so this is a preference and
   * never a guarantee.
   */
  side?: 'left' | 'right' | 'above' | 'below'
}

export interface CoachHandle {
  /**
   * Puts the mark up and resolves when it comes down.
   *
   * Resolves `'closed'`  — the operator pressed 확인했습니다.
   * Resolves `'released'` — one of `until` settled first (the operator did the
   *                         thing the mark was pointing at).
   * Resolves `'skipped'`  — the operator pressed 튜토리얼 건너뛰기. The caller
   *                         MUST stop the walk on this.
   *
   * `until` is raced against the two buttons. An empty list means the plate can
   * only be closed or skipped.
   */
  show(mark: CoachMark, until?: readonly Promise<unknown>[]): Promise<'closed' | 'released' | 'skipped'>
  /** Tears the whole layer down — the scrim, the leader, any live plate. */
  destroy(): void
}

/** How a plate came down, derived from the contract above so it cannot drift. */
type Outcome = Awaited<ReturnType<CoachHandle['show']>>

/* ── the plate's fixed copy ──────────────────────────────────────────────── */

// x8 — THE PLATE CARRIES THE LESSON AND NOTHING ELSE (민서, 08-09).
//
// It had a header band reading `안내` and two worded buttons, 확인했습니다 and
// 튜토리얼 건너뛰기. All three are gone. Every one of them was the terminal
// talking about itself: `안내` labelled a plate whose only content is already an
// instruction, and the two labels spent a whole row spelling out what a check and
// a fast-forward say on their own. On a bar that is trying to teach four gestures
// inside the first minute, a word that is not the lesson is in the way of it.
//
// So the words survive only as ACCESSIBLE NAMES. A control whose face is a glyph
// still has to answer "what is this" to anyone not looking at it, and these two
// are the same two answers they always were.
const OK_LABEL = '확인했습니다'
const SKIP_LABEL = '튜토리얼 건너뛰기'

/**
 * The two faces.
 *
 * ▶▶ AND NOT ⏩, which is what was asked for and is the one place this deviates.
 * U+23E9 is emoji-presentation by default: the platform paints it as a colour
 * glyph, blue-black on every desktop this ships to, and the brief for the button
 * is a white/grey mark on a dark box. A colour emoji cannot be white or grey —
 * it ignores `color` entirely — so the one property the design actually asks for
 * is the one property that glyph cannot have. Two U+25B6 triangles read as
 * fast-forward, inherit `currentColor`, and match the desk's monochrome-plus-red
 * palette. One constant if the literal emoji is wanted anyway.
 */
const OK_GLYPH = '✓'
const SKIP_GLYPH = '▶▶'

/** Referenced by `aria-labelledby` — one plate at a time. */
const SAYS_ID = 'coachSays'

/* ── geometry ────────────────────────────────────────────────────────────── */

const SVG_NS = 'http://www.w3.org/2000/svg'

// The same three names `thread-layer.ts` asks the desk by. A target inside a
// window the operator has shut is not on the screen, whatever its rect says.
const WIN = '.win'
const WIN_BODY = '.win-body'
const HIDDEN = 'hidden'
const COLLAPSED = 'collapsed'

/** How far outside the target the hole is cut, so the mark does not crop it. */
const HOLE_PAD = 6
/** The air between the hole and the plate's near edge — the leader's length. */
const PLATE_GAP = 14
/** No plate edge ever comes closer than this to a viewport edge. */
const EDGE = 12

type Side = NonNullable<CoachMark['side']>
const SIDES: readonly Side[] = ['right', 'left', 'below', 'above']
const OPPOSITE: Record<Side, Side> = { right: 'left', left: 'right', above: 'below', below: 'above' }
/** Where a plate goes when the mark does not say. */
const PREFERRED: Side = 'right'

/** A plain record — nothing here holds a live `DOMRect` across a frame. */
interface Rect {
  x: number
  y: number
  width: number
  height: number
}

/** A resolved target: the node, its rect, and the box its window clips it to. */
interface Found {
  node: Element
  rect: Rect
  clip: Rect | null
}

function rectOf(node: Element): Rect {
  const r = node.getBoundingClientRect()
  return { x: r.x, y: r.y, width: r.width, height: r.height }
}

const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max)

const right = (r: Rect): number => r.x + r.width
const bottom = (r: Rect): number => r.y + r.height

function grow(r: Rect, by: number): Rect {
  return { x: r.x - by, y: r.y - by, width: r.width + by * 2, height: r.height + by * 2 }
}

/** The overlap of two boxes, or `null` when they do not touch. */
function intersect(a: Rect, b: Rect): Rect | null {
  const x = Math.max(a.x, b.x)
  const y = Math.max(a.y, b.y)
  const w = Math.min(right(a), right(b)) - x
  const h = Math.min(bottom(a), bottom(b)) - y
  return w <= 0 || h <= 0 ? null : { x, y, width: w, height: h }
}

/** `a` sits entirely inside `b` vertically — the axis every scroller here scrolls. */
function spannedBy(a: Rect, b: Rect): boolean {
  return a.y >= b.y && bottom(a) <= bottom(b)
}

/**
 * The custom-property geometry write, copied from `shell/window-manager.ts`'s
 * `setPx`. The shell is not allowed to write `top` / `left` / `width` / `height`
 * (that guard is what keeps every position in this build inspectable in one
 * place — the sheet), so the plate's box is two custom properties and
 * `coach.css` spends them.
 */
const setPx = (node: HTMLElement, prop: string, value: number): void => {
  node.style.setProperty(prop, `${Math.round(value)}px`)
}

/** An axis-aligned box as a closed subpath, on whole pixels for a crisp hairline. */
function boxPath(r: Rect): string {
  const l = Math.round(r.x)
  const t = Math.round(r.y)
  const rt = Math.round(right(r))
  const b = Math.round(bottom(r))
  return `M${l} ${t}H${rt}V${b}H${l}Z`
}

/**
 * The target, or `null` when the desk has taken it away.
 *
 * Three ways a step can lose its target, and all three are answered here rather
 * than in the caller, so a step can never strand the walk: the selector resolves
 * to nothing; it resolves inside a window the operator has shut or folded, which
 * is the question `thread-layer.ts`'s `bodyRect()` asks in these same three class
 * names; or it has been scrolled clean out of the `.win-body` that clips it. The
 * plate still goes up in all three — centred, with no hole and no leader.
 */
function resolveTarget(selector: string): Found | null {
  const node = document.querySelector(selector)
  if (node === null) return null
  const win = node.closest(WIN)
  if (win !== null && (win.classList.contains(HIDDEN) || win.classList.contains(COLLAPSED))) return null
  const body = win === null ? null : win.querySelector(WIN_BODY)
  // Only a target INSIDE the body is clipped by it. A whole window is a legal
  // target (steps 4 and 5 point at LIVE FEED and REPORTS as objects), and a
  // window's own rect is deliberately larger than its body's.
  const clip = body !== null && body !== node && body.contains(node) ? rectOf(body) : null
  const rect = rectOf(node)
  if (rect.width === 0 || rect.height === 0) return null
  if (clip !== null && intersect(rect, clip) === null) return null
  return { node, rect, clip }
}

/** The hole to cut for `found`, clipped to its window and to the viewport. */
function holeFor(found: Found, view: Rect): Rect | null {
  const padded = grow(found.rect, HOLE_PAD)
  const inWindow = found.clip === null ? padded : intersect(padded, found.clip)
  return inWindow === null ? null : intersect(inWindow, view)
}

/** How much room there is beside the hole on `side`. */
function room(side: Side, hole: Rect, view: Rect): number {
  if (side === 'right') return view.width - right(hole)
  if (side === 'left') return hole.x
  if (side === 'above') return hole.y
  return view.height - bottom(hole)
}

/** How much room a plate of `w`×`h` needs on `side`, gap and margin included. */
function need(side: Side, w: number, h: number): number {
  return (side === 'left' || side === 'right' ? w : h) + PLATE_GAP + EDGE
}

/**
 * The side the plate actually goes on.
 *
 * Preference first, then its opposite — a flip reads as the same plate on the
 * other side of the same thing, where a jump to a perpendicular side reads as a
 * different mark. Only if neither axis-mate fits do the other two get a look,
 * and if nothing fits at all the roomiest side wins and the caller clamps: a
 * plate half off the screen is worse than a plate over its own target.
 */
function sideFor(prefer: Side, hole: Rect, view: Rect, w: number, h: number): Side {
  const order: Side[] = [prefer, OPPOSITE[prefer], ...SIDES.filter((s) => s !== prefer && s !== OPPOSITE[prefer])]
  let best = order[0]!
  let bestSlack = Number.NEGATIVE_INFINITY
  for (const side of order) {
    const slack = room(side, hole, view) - need(side, w, h)
    if (slack >= 0) return side
    if (slack > bestSlack) {
      best = side
      bestSlack = slack
    }
  }
  return best
}

/** Where the plate's top-left corner goes: beside the hole, never off the screen. */
function place(hole: Rect | null, view: Rect, w: number, h: number, prefer: Side): Rect {
  // No hole means no anchor, so the plate is the only thing on the screen that
  // the step is about: it goes in the middle.
  if (hole === null) {
    return { x: (view.width - w) / 2, y: (view.height - h) / 2, width: w, height: h }
  }
  const side = sideFor(prefer, hole, view, w, h)
  const midX = hole.x + hole.width / 2 - w / 2
  const midY = hole.y + hole.height / 2 - h / 2
  let x = midX
  let y = midY
  if (side === 'right') x = right(hole) + PLATE_GAP
  else if (side === 'left') x = hole.x - PLATE_GAP - w
  else if (side === 'above') y = hole.y - PLATE_GAP - h
  else y = bottom(hole) + PLATE_GAP
  return {
    x: clamp(x, EDGE, Math.max(EDGE, view.width - w - EDGE)),
    y: clamp(y, EDGE, Math.max(EDGE, view.height - h - EDGE)),
    width: w,
    height: h,
  }
}

/**
 * The leader: a straight line between the nearest points of the two boxes.
 *
 * `null` when the plate has been clamped on top of its own hole — there is no
 * line to draw between a thing and itself, and a stub of red inside the plate
 * would read as a defect rather than as a pointer.
 */
function leaderPath(hole: Rect, plate: Rect): string | null {
  if (intersect(hole, plate) !== null) return null
  const ax = clamp(hole.x + hole.width / 2, plate.x, right(plate))
  const ay = clamp(hole.y + hole.height / 2, plate.y, bottom(plate))
  const bx = clamp(plate.x + plate.width / 2, hole.x, right(hole))
  const by = clamp(plate.y + plate.height / 2, hole.y, bottom(hole))
  return `M${Math.round(ax)} ${Math.round(ay)}L${Math.round(bx)} ${Math.round(by)}`
}

/** The operator has asked for less movement. */
function still(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Brings the target into view before the mark is measured against it.
 *
 * This is `tutorial.ts`'s `reveal()`, moved here and made stricter. The AGENT
 * FILE's page is taller than its window (1.5× type in a third-width column), so
 * `#btnDeploy` sits under the fold of `.file-sheet` on first paint and a slot's
 * 해제 may be anywhere in the same sheet — and pointing at something off-screen
 * is pointing at nothing. The extra strictness is the CLIP test: an element
 * scrolled out of an `overflow:hidden` body still reports a rect inside the
 * viewport, so the viewport test alone passes for a target nobody can see.
 *
 * Once per mark, on the first pass where the target resolves. It is never
 * re-asserted: after that the operator owns the scrollbar, and a mark that kept
 * dragging the page back would be fighting the person it is teaching.
 */
function reveal(found: Found, view: Rect): void {
  if (spannedBy(found.rect, view) && (found.clip === null || spannedBy(found.rect, found.clip))) return
  found.node.scrollIntoView({ block: 'center', behavior: still() ? 'auto' : 'smooth' })
}

/* ── the layer ───────────────────────────────────────────────────────────── */

function svgPath(className: string): SVGPathElement {
  const node = document.createElementNS(SVG_NS, 'path')
  node.setAttribute('class', className)
  return node
}

interface Plate {
  root: HTMLElement
  ok: HTMLButtonElement
  skip: HTMLButtonElement
}

/**
 * One plate, built fresh per mark.
 *
 * Rebuilt rather than re-filled, for two reasons that both matter: a
 * screen reader announces a dialog that ARRIVES, and would say nothing at all
 * if the same node quietly swapped its sentence eight times; and the entrance
 * belongs to the plate, so a new plate replays it and a moved plate does not.
 *
 * THE MEMBRANE HOLDS HERE TOO (spec-client §3 invariant 1, and
 * `tests/shell/no-free-text.test.ts` at source level): two real `<button>`s and
 * static text. No `<input>`, nothing contenteditable, nothing the operator can
 * type into.
 */
function buildPlate(says: string): Plate {
  const root = el('section', 'coach-plate')
  // A dialog, but NOT `aria-modal`: the desk behind this plate is live and the
  // operator is expected to use it. Claiming modality would be a lie to the
  // screen reader about the only thing that matters here — that the thing the
  // plate is pointing at can still be pressed.
  root.setAttribute('role', 'dialog')
  // The step's own line IS the accessible name now, and `aria-describedby` goes
  // with the header that used to hold it: naming the dialog and then describing
  // it with the same sentence would read the instruction out twice.
  root.setAttribute('aria-labelledby', SAYS_ID)

  const line = el('p', 'coach-says', says)
  line.id = SAYS_ID

  // ONE ROW, in reading order: the sentence, the way past it, the way through
  // it. 건너뛰기 is to the LEFT of the check, so the DOM order below is also the
  // visual order and also the tab order — the quiet answer is reached first,
  // which is the property the old two-button footer had for the same reason.
  //
  // `button()` writes the label to `title`, which AT treats as a last-resort
  // fallback. A control whose text content is `✓` needs an actual name, so the
  // `aria-label` is set on top of it rather than left to the tooltip.
  const skip = button('coach-skip', SKIP_LABEL, SKIP_GLYPH)
  skip.setAttribute('aria-label', SKIP_LABEL)
  const ok = button('coach-ok', OK_LABEL, OK_GLYPH)
  ok.setAttribute('aria-label', OK_LABEL)

  root.append(line, skip, ok)
  return { root, ok, skip }
}

interface Live {
  mark: CoachMark
  plate: Plate
  /** Whether this mark has already had its one scroll-into-view. */
  revealed: boolean
  settle: (how: Outcome) => void
}

/** Mounts the layer into `app` (never into `index.html`) and hands back the handle. */
export function createCoach(app: HTMLElement): CoachHandle {
  const layer = el('div')
  layer.id = 'coach'

  // One SVG for both the scrim and the leader, and it is `aria-hidden`: what it
  // draws is where to look, and where to look is not something to read out.
  const cut = document.createElementNS(SVG_NS, 'svg')
  cut.setAttribute('class', 'coach-cut')
  cut.setAttribute('aria-hidden', 'true')
  // The scrim is ONE path with `fill-rule:evenodd` — the viewport rect, then the
  // hole's rect. Even-odd makes the second subpath a hole, so the target reads
  // at full brightness and the rest of the desk is dimmed; and because the whole
  // SVG is `pointer-events:none` the hole is not a hole in the CLICK path
  // either. Every pixel of the desk stays pressable, dimmed or not.
  const scrim = svgPath('coach-scrim')
  const edge = svgPath('coach-edge')
  const lead = svgPath('coach-lead')
  cut.append(scrim, edge, lead)
  layer.append(cut)
  app.append(layer)

  let live: Live | null = null
  let pending = 0
  let alive = true

  function blank(): void {
    for (const node of [scrim, edge, lead]) node.setAttribute('d', '')
  }

  function draw(): void {
    if (live === null) return
    const view: Rect = { x: 0, y: 0, width: window.innerWidth, height: window.innerHeight }
    cut.setAttribute('viewBox', `0 0 ${view.width} ${view.height}`)

    const found = resolveTarget(live.mark.target)
    if (found !== null && !live.revealed) {
      live.revealed = true
      // The scroll it may start is what re-arms this pass: a smooth scroll
      // fires `scroll` all the way down, and the capture-phase listener below
      // turns every one of those into another frame, so the mark rides the
      // movement instead of having to predict where it lands.
      reveal(found, view)
    }
    const hole = found === null ? null : holeFor(found, view)

    scrim.setAttribute('d', hole === null ? boxPath(view) : `${boxPath(view)}${boxPath(hole)}`)
    edge.setAttribute('d', hole === null ? '' : boxPath(hole))

    // Measured, never assumed: the plate's height is one line of Korean at
    // whatever width the sheet gives it, and that is a question only layout can
    // answer.
    const size = rectOf(live.plate.root)
    const box = place(hole, view, size.width, size.height, live.mark.side ?? PREFERRED)
    setPx(live.plate.root, '--coach-x', box.x)
    setPx(live.plate.root, '--coach-y', box.y)
    lead.setAttribute('d', hole === null ? '' : (leaderPath(hole, box) ?? ''))
  }

  function schedule(): void {
    if (!alive || pending !== 0) return
    pending = requestAnimationFrame(() => {
      pending = 0
      draw()
    })
  }

  // Every desk signal collapses into the same dirty flag, exactly as
  // `thread-layer.ts` collects them: window geometry and window state are
  // `style` / `class` writes (the window manager's), a grip drag or a re-layout
  // resizes the bodies, a scrolled body moves its anchors, and a re-render moves
  // everything. Our own writes into the layer are ignored, or the mark would
  // re-arm itself every frame forever. No timer takes part in this: the shell is
  // allowed exactly one `setInterval` and it is the driver pump in `boot.ts`.
  const mutations = new MutationObserver((records) => {
    if (records.every((record) => layer.contains(record.target))) return
    schedule()
  })
  mutations.observe(document.body, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['style', 'class'],
  })

  const sizes = new ResizeObserver(() => schedule())
  for (const body of Array.from(document.querySelectorAll(WIN_BODY))) sizes.observe(body)

  const onViewport = (): void => schedule()
  window.addEventListener('resize', onViewport)
  document.addEventListener('scroll', onViewport, { capture: true, passive: true })

  /**
   * Puts the mark up and resolves when it comes down. See `CoachHandle`.
   *
   * ONE PLATE AT A TIME. A second `show()` while one is up is a bug in the
   * caller — the walk awaits each plate — so this answers the second call at
   * once instead of stacking two plates over one desk, the same guard
   * `openConfirm` keeps for the same reason. `'closed'` and not `'skipped'`:
   * a guard must not be able to end the walk.
   */
  function show(mark: CoachMark, until: readonly Promise<unknown>[] = []): Promise<Outcome> {
    if (live !== null) return Promise.resolve<Outcome>('closed')

    const plate = buildPlate(mark.says)
    layer.append(plate.root)
    layer.classList.add('coach-up')
    // The plate joins the size watch as well as the window bodies: where it goes
    // depends on how tall it is, and how tall it is depends on where its one
    // Korean line wraps. A late web-font swap re-wraps it, and a plate that was
    // placed against the height it had before that is anchored to nothing.
    // Writing `--coach-x` / `--coach-y` cannot change its size, so this cannot
    // feed itself.
    sizes.observe(plate.root)

    return new Promise<Outcome>((resolve) => {
      let done = false
      const settle = (how: Outcome): void => {
        if (done) return
        done = true
        live = null
        sizes.unobserve(plate.root)
        plate.root.remove()
        layer.classList.remove('coach-up')
        blank()
        resolve(how)
      }
      live = { mark, plate, revealed: false, settle }

      plate.ok.addEventListener('click', () => settle('closed'))
      plate.skip.addEventListener('click', () => settle('skipped'))
      // ESCAPE, and only from inside the plate. The plate is not modal, so it
      // traps nothing and owes no keyboard exit (WCAG 2.1.2) — but an operator
      // whose focus is on 확인했습니다 and who reaches for Escape means "put
      // this away", and that is what 확인했습니다 does. Bound on the plate and
      // NOT in the capture phase on purpose: a coach mark that ate the desk's
      // Escape would be blocking the desk with a key instead of a scrim.
      plate.root.addEventListener('keydown', (event: KeyboardEvent) => {
        if (event.key === 'Escape') settle('closed')
      })
      // Raced, never sequenced: the step ends on whichever of its gates settles
      // first, or on a button. A gate that REJECTS is swallowed rather than
      // treated as an outcome — the plate then rests on its two buttons, which
      // is still a way forward, where a rejection turned into `'released'` would
      // advance the walk on a failure.
      for (const gate of until) void Promise.resolve(gate).then(() => settle('released'), () => {})

      schedule()
      // `preventScroll`, because the plate is `position:fixed` and has nothing
      // to be scrolled into view — and because a focus that scrolled a window
      // body would move the very target this mark has just measured.
      requestAnimationFrame(() => plate.ok.focus({ preventScroll: true }))
    })
  }

  /**
   * Tears the whole layer down.
   *
   * A live plate settles `'skipped'`, which is the one outcome the caller MUST
   * stop the walk on. Anything else would leave the walk awaiting a plate that
   * no longer exists — or worse, advancing into the next step against a layer
   * that has been removed from the document.
   */
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
    live?.settle('skipped')
    layer.remove()
  }

  return { show, destroy }
}

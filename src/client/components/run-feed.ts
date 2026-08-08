// [u5] RunFeed — the LIVE FEED window's fanfold.
//
// Ported from docs/design/phase2-ui/index.html lines 149..175 (the fanfold
// body: two sprockets, `#feedScroll`, head / `#feedList` / tail) and app.js
// lines 404..456 (`MARKS` · `feedLine` · `pushFeed` · `prefillFeed`). Two
// things changed, and both are the point of the criteria:
//
//  * the reference walked a module-global array from its own sim loop; here
//    every line arrives on the DRIVER's event stream and lands only when the
//    driver's clock releases it ([u5#c6]). This module owns no timer, no clock
//    and no wall-clock read — its only inputs are `subscribe` and `frame`.
//  * the reference closed an open wait whenever any non-wait line was pushed;
//    the seam states it outright (`waiting active:false`), so that event is the
//    only thing that resolves a marker here ([u5#c4]).
//
// The line MODEL is kept apart from the DOM on purpose: `feedLineModel` is
// pure, so inv 2's digit scan ([u5#c3]) runs in `environment: 'node'`.
//
// Renders only ([u5#c9]): `line.text` and `line.speaker` reach the document
// untouched — nothing here slices, pads, counts or reformats them.
import type { FeedKind, FeedLine, FixtureDriver, ViewEvent } from '../driver/index.ts'
import { animationsFrozen, displayStamp, registerAnimation } from '../driver/index.ts'
import { el } from '../shell/dom.ts'
import { FALLBACK_CLASS, fallbackNoticeLine } from './fallback-notice.ts'
import type { FallbackClass } from './fallback-notice.ts'
import { tallyLineText } from './tally-line.ts'
import { waitingModel } from './waiting-marker.ts'

/* ── the model ───────────────────────────────────────────────────────────── */

/** The per-kind mark, ported verbatim from `app.js:405`. */
export const FEED_MARKS: Record<FeedKind, string> = {
  event: '▸',
  radio: '◈',
  npc: '—',
  symptom: '·',
  wait: '',
  fallback: '※',
  mark: '',
}

/** One rendered fragment of a line's content column. */
export type FeedPart =
  | { p: 'text' | 'label' | 'quote' | 'span' | 'cite'; text: string }
  | { p: 'dots' }

/**
 * U5.4 — the citation mark's fixed half. `인수인계` because that is the section
 * of the AGENT FILE the slots live in; the operator reads the same word in both
 * windows and the number is the whole cross-reference.
 */
const CITE_LABEL = '인수인계'

/** Everything the renderer needs about one line — and nothing about the run. */
export interface FeedNode {
  kind: FeedKind
  /** The line's own classes. The green band is INSTANCE state, never here. */
  classes: readonly string[]
  mark: string
  /** The gutter stamp; `null` on a `mark` line, which is one column wide. */
  stamp: string | null
  parts: readonly FeedPart[]
  /** `data-*` attributes the line carries: state, never text. */
  data: Readonly<Record<string, string>>
}

/** The radio label's fixed half — the callsign half arrives per sitting (M1). */
const RADIO_TAIL = ' · 무전'
/** A beat that produced no symptom still prints one line (spec-client §7 #2). */
const EMPTY_SYMPTOM = '(변화 없음)'

const envelope = (kind: FeedKind, clock: string, parts: FeedPart[]): FeedNode => ({
  kind,
  classes: ['fl', `fl-${kind}`],
  mark: FEED_MARKS[kind],
  // The gutter prints a TIME, and `21:04+` is not one — see `displayStamp`.
  stamp: kind === 'mark' ? null : displayStamp(clock),
  parts,
  data: {},
})

/**
 * The projection every line goes through. An unknown kind is refused here and
 * is a type error at the call site — there is no fallback render.
 */
export function feedLineModel(line: FeedLine, callsign = 'ECHO-1'): FeedNode {
  const kind = line.kind
  if (!Object.prototype.hasOwnProperty.call(FEED_MARKS, kind)) {
    throw new Error(`live feed: '${String(kind)}' is not a FeedKind`)
  }
  switch (kind) {
    case 'radio': {
      const parts: FeedPart[] = [
        { p: 'label', text: `${callsign}${RADIO_TAIL}` },
        { p: 'text', text: line.text },
      ]
      // U5.4 — the slots the agent cited, named the way the AGENT FILE names
      // them. It says WHICH sentence reached the agent and nothing about how:
      // the operator reads the slot and judges the conduct themselves. An
      // absent or empty citation prints no mark at all — never an empty one.
      const slots = line.cited_slots ?? []
      if (slots.length > 0) {
        const numbered = [...slots].sort((a, b) => a - b).map((s) => String(s + 1).padStart(2, '0'))
        parts.push({ p: 'cite', text: `${CITE_LABEL} ${numbered.join(' · ')}` })
      }
      return envelope(kind, line.clock, parts)
    }
    case 'npc':
      return envelope(kind, line.clock, [
        { p: 'label', text: `${line.speaker ?? ''} ` },
        { p: 'quote', text: line.text },
      ])
    case 'mark':
      return envelope(kind, line.clock, [{ p: 'span', text: line.text }])
    case 'wait':
      return waitingModel(line)
    case 'event':
    case 'symptom':
    case 'fallback':
      return envelope(kind, line.clock, [{ p: 'text', text: line.text }])
    default: {
      const unhandled: never = kind
      throw new Error(`live feed: unhandled FeedKind ${String(unhandled)}`)
    }
  }
}

/** The line a beat prints when it closed without a single symptom. */
export function emptySymptomModel(clock: string): FeedNode {
  return {
    ...envelope('symptom', clock, [{ p: 'text', text: EMPTY_SYMPTOM }]),
    data: { empty: '1' },
  }
}

/**
 * Reveal pacing (U1) — real ms before the NEXT queued line, priced by how much
 * it asks the player to read. The anchor is Korean subtitle reading speed
 * (~12 hangul chars/sec — the cap the Netflix Korean style guide sets; the
 * Brysbaert 2019 reading-rate meta-analysis lands average adult silent reading
 * in the same band), clamped so bare marks still tick and a long quote cannot
 * stall the paper. A crowded queue quickens: quiet stretches breathe, event
 * crowds still read as a crowd — and the feed cannot fall unboundedly behind
 * a sim that emits faster than anyone reads. Feel values, tuned in play.
 */
const REVEAL_CHAR_MS = 100
const REVEAL_MIN_MS = 600
const REVEAL_MAX_MS = 2400
const REVEAL_CROWD_AT = 5
const REVEAL_CROWD_DIV = 2

/** What the queued event will actually print — only `feed` lines carry prose. */
const revealChars = (event: ViewEvent): number =>
  event.type === 'feed' ? event.line.text.length + (event.line.speaker?.length ?? 0) : 0

const revealDelay = (next: ViewEvent, depth: number): number => {
  const paced = Math.min(REVEAL_MAX_MS, Math.max(REVEAL_MIN_MS, revealChars(next) * REVEAL_CHAR_MS))
  return depth >= REVEAL_CROWD_AT ? paced / REVEAL_CROWD_DIV : paced
}

/**
 * The reveal holds while an arrived report is being read: REPORTS types its
 * document the moment the `report` event lands on the seam, and the feed
 * printing over it defeats the reading. Lines keep queueing under the hold;
 * every flush bypass overrides it. Feel value, tuned in play.
 */
const REPORT_HOLD_MS = 9000

/* ── the window's fanfold ────────────────────────────────────────────────── */

/** The head's first line — the stock, as the reference prints it. */
const HEAD_STOCK = '연속용지 · 상황실 무전 기록'
/** The head's second line — what this window is, and is not ([u5#c7]). */
const HEAD_NOTE = '열람 전용 — 이 창은 조작되지 않습니다'
/** The sitting the header names arrives on the `meta` event, never from here (C3). */
const HEAD_SEP = ' · '

/**
 * Following the tail is CONDITIONAL (U2). The reference pinned the fanfold to
 * its tail on every push, which makes reading anything but the last screen
 * impossible: scroll back and the next line — or a webfont reflow — drags the
 * paper out of your hands again. So the feed follows only while the paper is
 * ALREADY at its tail, and lets go the moment the operator scrolls away, the
 * way a real fanfold does when a hand comes down on it. Scrolling back to the
 * tail re-attaches, so the resting state is still "it runs on its own".
 *
 * The slack is what still counts as the tail: a fractional line-height leaves
 * `scrollTop + clientHeight` a pixel or two short of `scrollHeight` even when
 * the paper is pinned, and a trackpad's momentum overshoots by about as much.
 */
const FOLLOW_SLACK_PX = 32

/**
 * What the behind-indicator says. It carries the count because that is the live
 * feed's whole claim — the run does not stop for the reader, and a number
 * climbing at the foot of the paper says so more plainly than the tail moving
 * on its own ever did.
 *
 * It is a READING, not a control ([u5#c7]): the way back to the tail is the
 * scrollbar the operator just used to leave it, and the window goes on printing
 * `열람 전용 — 이 창은 조작되지 않습니다` without lying.
 *
 * `미열람` rather than anything from the 회신 family — `무전 회신 대기 중`,
 * `무전 회신 도착`, `회신 불량` each already name one specific event, and this
 * counts every kind the run prints. It is the window's own word (`열람 전용`)
 * turned back on the reader: what the paper holds that they have not read yet.
 */
const behindLabel = (missed: number): string => `▾ 미열람 ${missed}줄`

/** The handle the e2e suite reads the landed lines back through. */
export interface RunFeed {
  count(): number
  kinds(): string[]
  stamps(): string[]
  /** Applies everything still queued — the reveal never outlives a seek (U1). */
  flush(): void
  /** Whether the paper is still following its tail (U2) — read by e2e only. */
  following(): boolean
}

function partNode(part: FeedPart): Node {
  switch (part.p) {
    case 'cite':
      return el('span', 'fl-cite', part.text)
    case 'label':
      return el('b', undefined, part.text)
    case 'quote':
      return el('q', undefined, part.text)
    case 'span':
      return el('span', undefined, part.text)
    case 'dots': {
      const dots = el('span', 'dots')
      dots.append(el('i'), el('i'), el('i'))
      return dots
    }
    case 'text':
      return document.createTextNode(part.text)
    default: {
      const unhandled: never = part
      throw new Error(`live feed: unhandled feed part ${String(unhandled)}`)
    }
  }
}

function lineElement(node: FeedNode, band: boolean): HTMLLIElement {
  const li = el('li', node.classes.join(' '))
  if (band) li.classList.add('band')
  for (const [key, value] of Object.entries(node.data)) li.setAttribute(`data-${key}`, value)

  if (node.stamp !== null) li.append(el('div', 'fl-t', node.stamp))

  const content = el('div', 'fl-c')
  if (node.kind !== 'mark') content.dataset.mark = node.mark
  content.append(...node.parts.map(partNode))
  li.append(content)
  return li
}

export function createRunFeed(host: HTMLElement, driver: FixtureDriver): RunFeed {
  const left = el('div', 'sprocket left')
  const right = el('div', 'sprocket right')
  left.setAttribute('aria-hidden', 'true')
  right.setAttribute('aria-hidden', 'true')

  const stock = el('div', undefined, HEAD_STOCK)
  const head = el('div', 'feed-head')
  head.append(stock, el('div', undefined, HEAD_NOTE))

  const list = el('ol')
  list.id = 'feedList'
  // A running record an operator may be listening to rather than watching: new
  // lines are announced where they land, politely and additions-only, instead
  // of being re-read as toasts (R2 on index.html:125).
  list.setAttribute('role', 'log')
  list.setAttribute('aria-live', 'polite')
  list.setAttribute('aria-relevant', 'additions')
  const tail = el('div', 'feed-tail')
  tail.id = 'feedTail'

  const scroll = el('div', 'feed-scroll')
  scroll.id = 'feedScroll'
  scroll.append(head, list, tail)

  // The behind-indicator. It sits OUTSIDE the scrolling box on purpose: it is
  // chrome pinned to the window's foot, not a line of the record — the fanfold
  // holds nothing but what the run printed ([u5#c7]). Hidden from the a11y tree
  // because it reports a VIEWPORT state: `#feedList` is a `role="log"`, so a
  // reader listening to the run is never behind it and has nothing to catch up.
  const behind = el('div', 'feed-behind')
  behind.id = 'feedBehind'
  behind.hidden = true
  behind.setAttribute('aria-hidden', 'true')

  host.append(left, right, scroll, behind)

  // Instance state: the green band alternates down the page (app.js:434) and a
  // beat is watched for symptoms so a silent one still prints a line.
  let band = false
  let symptoms = 0
  let stamp = ''
  let answered = false
  let callsign = 'ECHO-1'
  let pending: { cls: FallbackClass; code: string } | null = null

  const openWait = (): Element | null => list.querySelector('li.fl-wait:not(.resolved)')

  const motionless = (): boolean => {
    if (animationsFrozen()) return true
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }

  /* ── following the tail (U2) ─────────────────────────────────────────────
     `attached` is the last thing the OPERATOR said with the scrollbar, and
     `missed` is what the run printed while they were reading further up. */
  let attached = true
  let missed = 0

  const atTail = (): boolean =>
    scroll.scrollHeight - scroll.scrollTop - scroll.clientHeight <= FOLLOW_SLACK_PX

  const paintBehind = (): void => {
    behind.hidden = attached || missed === 0
    behind.textContent = behindLabel(missed)
  }

  /** Pin the fanfold to its tail — the reference's `pushFeed` catch-up. */
  const follow = (): void => {
    if (!attached) return
    // Instant, against the sheet's `scroll-behavior:smooth`. A smooth catch-up
    // is still in flight when the next line lands, and every frame of it sits
    // short of the tail — which is exactly what `atTail` reads as a hand coming
    // down on the paper. The feed would let go of itself. Only `jump` animates.
    scroll.scrollTo({ top: scroll.scrollHeight, behavior: 'instant' })
  }

  /**
   * Re-read attachment from the paper itself. One question, asked the same way
   * everywhere: is it at its tail? `follow` lands there instantly, so the feed's
   * own pinning answers yes and never detaches itself.
   *
   * Re-attaching deliberately does NOT scroll — the operator may be mid-gesture,
   * and pulling the last few pixels out from under them is the snap this whole
   * change is about. The next line pins it.
   */
  const reread = (): void => {
    const tail = atTail()
    if (tail === attached) return
    attached = tail
    if (tail) missed = 0
    paintBehind()
  }

  // The unit's ONE listener ([u5#c7]). It is passive, it only reads an offset
  // this window already owns, and it hands the player no control: nothing about
  // it is reachable except by scrolling paper that was always scrollable. It is
  // for RESPONSE — the indicator answering the gesture instead of the next line
  // — and never the sole reading, because it runs a frame behind the scroll it
  // reports and `append` cannot afford to be that late (see there).
  scroll.addEventListener('scroll', reread, { passive: true })

  const append = (node: FeedNode): void => {
    // BEFORE the line lands, while `scrollHeight` still describes the paper the
    // operator is actually looking at — and because a `scroll` event runs a
    // frame behind the gesture that caused it. A line arriving inside that frame
    // would otherwise follow on a reading already one gesture out of date, and
    // yank the reader to the tail: the exact failure this all exists to stop.
    reread()

    if (node.kind === 'event' || node.kind === 'npc') band = !band
    list.append(lineElement(node, (node.kind === 'event' || node.kind === 'npc') && band))
    if (node.stamp !== null && node.stamp !== '') stamp = node.stamp
    if (!attached) {
      missed += 1
      paintBehind()
    }
    follow()
  }

  const appendLine = (line: FeedLine): void => {
    // The seam declares the wait over (`waiting active:false`) one event BEFORE
    // the answer itself — same minute, but the paper is still blank. The marker
    // stands in for the missing answer, so it comes down when the answer lands,
    // not a beat earlier; the seam event is still the only thing that ends it.
    if (answered) {
      for (const marker of list.querySelectorAll('li.fl-wait:not(.resolved)')) {
        marker.classList.add('resolved')
      }
      answered = false
    }
    if (pending !== null && line.kind !== 'fallback') {
      append(feedLineModel(fallbackNoticeLine(pending.cls, line.clock)))
      pending = null
    }
    const node = feedLineModel(line, callsign)
    if (pending !== null) {
      append({ ...node, data: { 'fallback-class': pending.cls, 'fallback-code': pending.code } })
      pending = null
    } else {
      append(node)
    }
    if (line.kind === 'symptom') symptoms += 1
  }

  const apply = (event: ViewEvent): void => {
    switch (event.type) {
      case 'meta':
        callsign = `ECHO-${Math.max(1, event.run)}`
        stock.textContent = HEAD_STOCK + HEAD_SEP + callsign
        break
      case 'beat_start':
        symptoms = 0
        break
      case 'beat_end':
        if (symptoms === 0) append(emptySymptomModel(event.clock))
        break
      case 'feed':
        appendLine(event.line)
        break
      case 'fallback':
        // spec-client §7 #7. The engine names the CALL that failed (1 · 2 · 3)
        // and the error code; `fallback-notice.ts` is the only place that turns
        // one into a class. The class rides the fallback line the event pairs
        // with — and if no such line follows, the next line flushes it as a
        // notice of its own, so a fallback is never silent.
        pending = { cls: FALLBACK_CLASS[event.call], code: event.code }
        break
      case 'waiting':
        if (!event.active) {
          answered = true
        } else if (openWait() === null) {
          append({ ...waitingModel(event.for), stamp })
        }
        break
      case 'score':
        // The day's count, from the ledger the run actually scored — see
        // `tally-line.ts` for why it is not a timeline event any more. It reuses
        // the last stamp the same way an opening wait marker does: the seam's
        // `score` carries no clock, and the day is over, so the line belongs to
        // the minute the run closed on rather than to one of its own.
        append({
          ...envelope('event', '', [{ p: 'text', text: tallyLineText(event) }]),
          stamp,
        })
        break
      default:
        // `report` and `run_end` belong to other windows.
        break
    }
  }

  // U1 — the reveal queue (plan-playtest §1). Downstream of fanout on purpose:
  // pacing here can starve nothing, while the adapter's own queue gates step().
  // Paced only while the sim clock runs; a paused desk, frozen animations,
  // reduced motion, a seek and the day's end all land whole.
  const queue: ViewEvent[] = []
  let sinceReveal = 0
  let holdMs = 0

  const flush = (): void => {
    while (queue.length > 0) apply(queue.shift()!)
    sinceReveal = 0
    holdMs = 0
  }

  registerAnimation('feed/reveal', (realMs: number) => {
    if (queue.length === 0) return
    // A frozen pump never ticks, so the frozen case can only flush at enqueue
    // (below); this in-pump check catches a mid-run reduced-motion flip.
    if (motionless() || !driver.clock.running) {
      flush()
      return
    }
    if (holdMs > 0) {
      holdMs -= realMs
      return
    }
    sinceReveal += realMs
    if (sinceReveal < revealDelay(queue[0]!, queue.length)) return
    sinceReveal = 0
    apply(queue.shift()!)
  })

  // The settle watchdog: alive only while the queue is non-empty. The pump
  // rides the driver's animation channel, which stops with the clock — so a
  // clock that stops with lines still queued (the live boot pauses right
  // after its opening fanout) would strand them forever without this.
  let settling = false
  const settle = (): void => {
    settling = false
    if (queue.length === 0) return
    if (!driver.clock.running && !driver.clock.ended) {
      flush()
      return
    }
    settling = true
    requestAnimationFrame(settle)
  }

  const receive = (event: ViewEvent): void => {
    if (event.type === 'report') holdMs = REPORT_HOLD_MS
    queue.push(event)
    if (event.type === 'run_end' || motionless() || !driver.clock.running) {
      flush()
      return
    }
    if (!settling) {
      settling = true
      requestAnimationFrame(settle)
    }
  }

  // The reference's `prefillFeed`: everything the driver already released is
  // laid down without animation budget, then the tail is caught up once.
  for (const event of driver.frame().events) apply(event)
  requestAnimationFrame(follow)
  driver.subscribe(receive)

  // Following the tail is a MEASUREMENT, not a schedule: the fanfold's own
  // height is watched, so the paper stays at its tail when the layout settles
  // after the lines have landed — a webfont swapping in reflows the whole run.
  // The observer reads size and moves the scroll; it lands nothing, and the
  // only clock in this window is still the driver's ([u5#c6]). It goes through
  // `follow`, so a reflow can no longer yank a detached reader to the tail —
  // that was the second half of the old pin, and the harder half to escape.
  new ResizeObserver(follow).observe(list)

  const lines = (): HTMLLIElement[] => [...list.querySelectorAll('li')]

  return {
    count: () => lines().length,
    kinds: () => lines().map((li) => (/\bfl-([a-z]+)\b/.exec(li.className) ?? [, ''])[1] ?? ''),
    stamps: () => lines().map((li) => li.querySelector('.fl-t')?.textContent ?? ''),
    flush,
    following: () => attached,
  }
}

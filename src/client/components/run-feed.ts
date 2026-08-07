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
import { displayStamp } from '../driver/index.ts'
import { el } from '../shell/dom.ts'
import { FALLBACK_CLASS, fallbackNoticeLine } from './fallback-notice.ts'
import type { FallbackClass } from './fallback-notice.ts'
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
  | { p: 'text' | 'label' | 'quote' | 'span'; text: string }
  | { p: 'dots' }

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
    case 'radio':
      return envelope(kind, line.clock, [
        { p: 'label', text: `${callsign}${RADIO_TAIL}` },
        { p: 'text', text: line.text },
      ])
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

/* ── the window's fanfold ────────────────────────────────────────────────── */

/** The head's first line — the stock, as the reference prints it. */
const HEAD_STOCK = '연속용지 · 상황실 무전 기록'
/** The head's second line — what this window is, and is not ([u5#c7]). */
const HEAD_NOTE = '열람 전용 — 이 창은 조작되지 않습니다'
/** The run the header names arrives on the `meta` event, never from here (C3). */
const RUN_PREFIX = ' · RUN '

/** The handle the e2e suite reads the landed lines back through. */
export interface RunFeed {
  count(): number
  kinds(): string[]
  stamps(): string[]
}

function partNode(part: FeedPart): Node {
  switch (part.p) {
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
  host.append(left, right, scroll)

  // Instance state: the green band alternates down the page (app.js:434) and a
  // beat is watched for symptoms so a silent one still prints a line.
  let band = false
  let symptoms = 0
  let stamp = ''
  let answered = false
  let callsign = 'ECHO-1'
  let pending: { cls: FallbackClass; code: string } | null = null

  const openWait = (): Element | null => list.querySelector('li.fl-wait:not(.resolved)')

  /** Pin the fanfold to its tail — the reference's `pushFeed` catch-up. */
  const follow = (): void => {
    scroll.scrollTop = scroll.scrollHeight
  }

  const append = (node: FeedNode): void => {
    if (node.kind === 'event' || node.kind === 'npc') band = !band
    list.append(lineElement(node, (node.kind === 'event' || node.kind === 'npc') && band))
    if (node.stamp !== null && node.stamp !== '') stamp = node.stamp
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

  const receive = (event: ViewEvent): void => {
    switch (event.type) {
      case 'meta':
        callsign = `ECHO-${Math.max(1, event.run)}`
        stock.textContent = HEAD_STOCK + RUN_PREFIX + String(event.run)
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
      default:
        // `report` · `score` · `run_end` belong to other windows.
        break
    }
  }

  // The reference's `prefillFeed`: everything the driver already released is
  // laid down without animation budget, then the tail is caught up once.
  for (const event of driver.frame().events) receive(event)
  requestAnimationFrame(follow)
  driver.subscribe(receive)

  // Following the tail is a MEASUREMENT, not a schedule: the fanfold's own
  // height is watched, so the paper stays at its tail when the layout settles
  // after the lines have landed — a webfont swapping in reflows the whole run.
  // The observer reads size and moves the scroll; it lands nothing, and the
  // only clock in this window is still the driver's ([u5#c6]).
  new ResizeObserver(follow).observe(list)

  const lines = (): HTMLLIElement[] => [...list.querySelectorAll('li')]

  return {
    count: () => lines().length,
    kinds: () => lines().map((li) => (/\bfl-([a-z]+)\b/.exec(li.className) ?? [, ''])[1] ?? ''),
    stamps: () => lines().map((li) => li.querySelector('.fl-t')?.textContent ?? ''),
  }
}

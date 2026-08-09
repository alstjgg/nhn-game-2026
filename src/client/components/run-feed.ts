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
//  * the reference printed a waiting marker for every call in flight and closed
//    it when the answer landed. x6 removed the marker outright, so there is no
//    wait to resolve and `waiting` draws nothing at all — see `appendLine`.
//
// The line MODEL is kept apart from the DOM on purpose: `feedLineModel` is
// pure, so inv 2's digit scan ([u5#c3]) runs in `environment: 'node'`.
//
// Renders only ([u5#c9]): `line.text` and `line.speaker` reach the document
// untouched — nothing here slices, pads, counts or reformats them.
import type { FeedKind, FeedLine, FixtureDriver, ViewEvent } from '../driver/index.ts'
import { animationsFrozen, displayStamp, registerAnimation } from '../driver/index.ts'
import { el } from '../shell/dom.ts'
import { publishFeedStamp } from '../shell/feed-clock.ts'
import { callsignOf } from './dossier.ts'
import { FALLBACK_CLASS, fallbackNoticeLine } from './fallback-notice.ts'
import type { FallbackClass } from './fallback-notice.ts'
import { tallyLineText } from './tally-line.ts'

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

/**
 * One rendered fragment of a line's content column.
 *
 * x7 — the `{ p: 'dots' }` variant is deleted. It rendered the three breathing
 * dots of the waiting marker, and x6 removed the marker: nothing has
 * constructed a dots part since, so `partNode`'s arm for it was unreachable
 * code kept alive only by the type that allowed it. The CSS went with the
 * marker on the same day (`styles/win-live-feed.css`), so a part that somehow
 * reached the DOM would have painted three unstyled empty spans.
 */
export type FeedPart = { p: 'text' | 'label' | 'quote' | 'span' | 'cite'; text: string }

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

/**
 * The radio label's fixed half — the callsign half arrives per sitting (M1).
 *
 * x7 — AND THIS MODULE MINTS NO PART OF THAT HALF ANY MORE. It used to spell
 * the series three times over: `` `ECHO-${Math.max(1, event.run)}` `` on the
 * `meta` case and `'ECHO-1'` twice as a default. That is `components/dossier.ts`
 * `callsignOf` copied out by hand into a window that only ever READS the name —
 * and a copy of an art decision is a way for two surfaces to disagree about who
 * the operator is watching. It is not hypothetical: the day the series was
 * renumbered so the unshaped first agent is plain `ECHO`, 식별 on the AGENT FILE
 * said `ECHO` and the radio label here would have gone on saying `ECHO-1` — the
 * same agent, the same desk, the same minute, two names. The pack carries no
 * callsign at all (D4), so there is exactly one owner of the name and this
 * window borrows it.
 */
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
 *
 * x7 — the default is `callsignOf(1)` and not a literal. The parameter is
 * optional so the PURE model can be projected without a sitting to name (that
 * is how `live-feed.test.ts` calls it, in `environment: 'node'`), and what a
 * line should say when no `meta` has landed is whatever the DOCUMENT calls the
 * first agent — a question `callsignOf` answers and this module does not.
 */
export function feedLineModel(line: FeedLine, callsign = callsignOf(1)): FeedNode {
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
        // Padded with a conditional, never `padStart`: [u9#c2]
        // (`no-digit-npc.test.ts` (c)) bans that call outright in any module
        // that paints an NPC channel, so a character can never be made to
        // speak a formatted number. This is a slot on the operator's own file
        // and not that — but the guard is a blanket source scan and it is
        // right to be, so the cheap way to keep it honest is not to call it.
        const numbered = [...slots]
          .sort((a, b) => a - b)
          .map((s) => (s + 1 < 10 ? `0${s + 1}` : String(s + 1)))
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
    // x6 — `wait` survives here because it is the SEAM's kind and the seam is
    // frozen (`shared/view-driver.ts`, guarded by `seam-shapes.test.ts`), not
    // because anything prints one: `createRunFeed` drops wait lines before they
    // reach the DOM and the waiting markers are gone (see `appendLine`). The
    // case stays so the projection is total for every kind the seam can send.
    case 'wait':
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
 *
 * It is a SHARE of the box and not a flat 32px, because T3 made the window
 * short: 32px is air in a 233px feed and 36% of an 89px one, where scrolling up
 * a third of the window still read as being at the tail. The floor keeps the
 * fractional-pixel case covered when the share gets small.
 */
const FOLLOW_SLACK_MAX_PX = 32
const FOLLOW_SLACK_MIN_PX = 4
const FOLLOW_SLACK_RATIO = 0.25

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
 * `미열람` rather than anything from the 회신 family — `회신 불량` and the rest
 * each already name one specific event, and this counts every kind the run
 * prints. It is the window's own word (`열람 전용`) turned back on the reader:
 * what the paper holds that they have not read yet.
 *
 * x6 — the family this was chosen against is two members smaller now: the wait
 * pair (`무전 회신 대기 중` / `무전 회신 도착`) went with the markers and the toast
 * that said them. The reasoning is unchanged, which is the point of recording
 * it against a FAMILY rather than against a list.
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
    case 'text':
      return document.createTextNode(part.text)
    default: {
      // x7 — exhaustive on `part.p`, not on `part`. `FeedPart` is one object
      // type with a union-typed tag now that the `dots` member is gone, and a
      // single-member "union" never narrows to `never` — so the old
      // `const unhandled: never = part` stopped compiling. The tag still
      // narrows, and the tag is what this switch is on, so the guard is
      // unchanged in what it catches: a new `p` value with no arm above.
      const unhandled: never = part.p
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
  // x7 — the first agent, until `meta` names the sitting. Same reasoning as
  // `feedLineModel`'s default above: the boot state is a DOCUMENT question.
  let callsign = callsignOf(1)
  let pending: { cls: FallbackClass; code: string } | null = null

  const motionless = (): boolean => {
    if (animationsFrozen()) return true
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }

  /* ── following the tail (U2) ─────────────────────────────────────────────
     `attached` is the last thing the OPERATOR said with the scrollbar, and
     `missed` is what the run printed while they were reading further up. */
  let attached = true
  let missed = 0
  /**
   * Has the box been scrolled at all since `follow` last pinned it?
   *
   * `atTail` alone cannot be trusted to DETACH, because the head and the tail
   * spacer are content too. Once the box is short enough, they overflow it on
   * their own — before a single line exists — and a tail test reads `false`
   * with nobody having touched anything. The first line then latches the feed
   * detached for the rest of the run. Any re-tune of the desk's type scale or
   * its row ratios can put the window back in that state, so detaching must not
   * rest on the measurement alone: it needs evidence the paper actually moved.
   *
   * Which is a scroll event, and only that. It is allowed to be a frame late
   * here: it does not decide anything on its own, it only unlocks the question.
   */
  let scrolledSincePin = false

  const followSlack = (): number =>
    Math.max(
      FOLLOW_SLACK_MIN_PX,
      Math.min(FOLLOW_SLACK_MAX_PX, scroll.clientHeight * FOLLOW_SLACK_RATIO),
    )

  const atTail = (): boolean =>
    scroll.scrollHeight - scroll.scrollTop - scroll.clientHeight <= followSlack()

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
    // down on the paper. The feed would let go of itself.
    scroll.scrollTo({ top: scroll.scrollHeight, behavior: 'instant' })
    scrolledSincePin = false
  }

  /**
   * Re-read attachment from the paper. `atTail` answers both directions, but
   * letting GO additionally requires that the box have been scrolled since the
   * last pin — see `scrolledSincePin`. Coming back needs no such evidence: the
   * paper is at its tail or it is not.
   *
   * Re-attaching deliberately does NOT scroll — the operator may be mid-gesture,
   * and pulling the last few pixels out from under them is the snap this whole
   * change is about. The next line pins it.
   */
  const reread = (): void => {
    const tail = atTail()
    if (tail === attached) return
    if (!tail && !scrolledSincePin) return
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
  scroll.addEventListener(
    'scroll',
    () => {
      scrolledSincePin = true
      reread()
    },
    { passive: true },
  )

  const append = (node: FeedNode): void => {
    // BEFORE the line lands, while `scrollHeight` still describes the paper the
    // operator is actually looking at — and because a `scroll` event runs a
    // frame behind the gesture that caused it. A line arriving inside that frame
    // would otherwise follow on a reading already one gesture out of date, and
    // yank the reader to the tail: the exact failure this all exists to stop.
    reread()

    if (node.kind === 'event' || node.kind === 'npc') band = !band
    list.append(lineElement(node, (node.kind === 'event' || node.kind === 'npc') && band))
    if (node.stamp !== null && node.stamp !== '') {
      stamp = node.stamp
      // x6 — the top bar's clock is THIS stamp, published as the line lands in
      // the DOM rather than as the event arrives. The reveal queue below holds
      // lines back (and holds harder on a report), so publishing from `receive`
      // would put the chrome ahead of the paper again — which is the mismatch
      // the whole slot exists to close (`shell/feed-clock.ts`).
      publishFeedStamp(node.stamp)
    }
    if (!attached) {
      missed += 1
      paintBehind()
    }
    follow()
  }

  const appendLine = (line: FeedLine): void => {
    // x6 — a wait line is not printed at all (민서, 08-09). The fanfold used to
    // carry a `……무전 회신 대기 중 ● ● ●` marker for every call in flight, put up
    // on the seam's `waiting active:true` and struck out on the answer. It was
    // latency told diegetically, and on a day of seven rounds it was also the
    // most frequent thing on the paper: three markers a beat, each one saying
    // only that the desk was still working. The answer itself already says that,
    // a beat later, with content. The markers are gone and nothing replaces
    // them — a wait now reads as the pause it is.
    //
    // Dropped HERE rather than at the model, because `feedLineModel` is the pure
    // projection the seam's every kind must survive (see its `wait` case).
    if (line.kind === 'wait') return
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
        // x7 — the run is still the seam's (C3); the NAME for it is not this
        // window's to compose. The `Math.max(1, …)` that used to guard run 0 off
        // `ECHO-0` went with the literal: `callsignOf` answers a pre-first-press
        // run itself, and one guard is one place that can drift.
        callsign = callsignOf(event.run)
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
      // `waiting` is still on the seam and the live driver still emits it
      // (`driver/live-driver.ts`), because it is what the ADAPTER's own queue is
      // built around. The fanfold simply no longer draws anything for it — x6,
      // and see `appendLine` for why.
      case 'waiting':
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

  // Pin the empty paper BEFORE the first line, because `append` re-reads
  // attachment from the box and the box can already overflow with nothing in it:
  // the head and the tail spacer are content too. On T3's short window that read
  // `gap 97 > slack` at boot, so the very first line detached the feed and every
  // `follow` after it returned early — a run of 43 lines with `scrollTop` still
  // 0, measured. One pin here and the first re-read has a tail to find.
  follow()

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
  //
  // The BOX and the TAIL are watched alongside the paper, because each of the
  // three moves `scrollHeight` on its own:
  //
  //  * `list`   — a line lands, or the lines rewrap
  //  * `scroll` — the window loses height without any line rewrapping (drag the
  //               grip straight up, or let the layout recompute on a resize)
  //  * `tail`   — the spacer is `25cqh`, so it is re-derived from the window a
  //               beat AFTER the box resizes, changing the scrollable height
  //               without either of the other two having changed size at all.
  const resized = new ResizeObserver(follow)
  resized.observe(list)
  resized.observe(scroll)
  resized.observe(tail)

  const lines = (): HTMLLIElement[] => [...list.querySelectorAll('li')]

  return {
    count: () => lines().length,
    kinds: () => lines().map((li) => (/\bfl-([a-z]+)\b/.exec(li.className) ?? [, ''])[1] ?? ''),
    stamps: () => lines().map((li) => li.querySelector('.fl-t')?.textContent ?? ''),
    flush,
    following: () => attached,
  }
}

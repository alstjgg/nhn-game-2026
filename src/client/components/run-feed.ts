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
// x11 (민서, 08-10) — and the paper TYPES now. A line no longer appears whole
// and then waits its turn; it is printed character by character at a constant
// rate, one line at a time, with a short pause after a row and a longer one when
// the desk clock moves (see the pacing block below). Three consequences are
// worth having in the header, because each of them is load-bearing somewhere
// else in the desk:
//
//  * the arithmetic is `components/typewriter.ts`'s, run at a pace of this
//    window's own. There is no third copy of a type cursor on this desk.
//  * `#feedList` is a live region, so the typing half is hidden from the a11y
//    tree and each line carries a complete sr-only twin — see `lineElement`.
//  * the day now ENDS by draining rather than by dumping: `run_end` no longer
//    flushes, and what the feed still owes is published to `shell/feed-drain.ts`
//    so the ending can wait for the tail. 민서: "if the tail is still typing,
//    nothing should stop it, not even the ending."
//
// x12 (민서, 08-10) — AND THE PAPER IS NOW THE THING OTHER WINDOWS WAIT FOR. The
// same lag that made the ending wait made REPORTS arrive early: a `report`
// typed the round's write-up while the fanfold was still printing the beats it
// describes. So the pump publishes where it has GOT TO — `shell/feed-reach.ts`,
// a cue per `report` and one for the `score` — and REPORTS holds its document
// until the paper is there. This window is unchanged in what it prints and in
// what it costs; it simply says so out loud. See `apply`, which is the only
// publisher, and the pacing block below for the hold that went the other way.
//
// The line MODEL is kept apart from the DOM on purpose: `feedLineModel` is
// pure, so inv 2's digit scan ([u5#c3]) runs in `environment: 'node'`.
//
// Renders only ([u5#c9]): `line.text` and `line.speaker` reach the document
// untouched — nothing here slices, pads, counts or reformats them. x8 gives an
// `npc` line a fixed tail AROUND its quote (see `feedLineModel`); the frame is
// chrome authored beside the run text, never derived from it.
import type { FeedKind, FeedLine, FixtureDriver, ViewEvent } from '../driver/index.ts'
import { animationsFrozen, displayStamp, mm, registerAnimation } from '../driver/index.ts'
import { el } from '../shell/dom.ts'
import { publishFeedStamp } from '../shell/feed-clock.ts'
import { publishFeedPending } from '../shell/feed-drain.ts'
import { publishFeedMounted, publishFeedReached } from '../shell/feed-reach.ts'
import { callsignOf } from './dossier.ts'
import { FALLBACK_CLASS, fallbackNoticeLine } from './fallback-notice.ts'
import type { FallbackClass } from './fallback-notice.ts'
import { tallyLineText } from './tally-line.ts'
import { TYPE_START, typeCursor } from './typewriter.ts'
import type { TypePace } from './typewriter.ts'

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

/**
 * x8 — what closes an NPC line, and the whole of the reframe (민서, 08-10).
 *
 * Call 2 writes what an NPC says back to the AGENT over the line. The fanfold
 * is the agent's own radio record, so the line the operator reads is the agent
 * relaying that answer — not a character speaking into the room. `— 표기웅 "…"`
 * is a screenplay slug and read as one; `— 표기웅 "…"라고 답한다` reads as the
 * desk being told what was said, which is what actually happened.
 *
 * `말한다` and not `답한다`, though a reply is what this usually is: Call 2
 * "generates the reaction" to the fixed event (`contract-calls.md` §3), and a
 * reaction is not always an answer — the roster can speak to the scene or to
 * each other. The neutral verb is true of every line the call can produce, and
 * a frame that is false on some of them is the screenplay problem again.
 *
 * No subject particle, deliberately. Korean picks 이/가 by the name's final
 * 받침, and choosing between them means reading the last codepoint of
 * `speaker` — deriving from run text, which is the one thing [u5#c9] says this
 * window never does. The name sits against the gutter's own `—` instead.
 */
const NPC_RELAY_TAIL = '라고 말한다'

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
        { p: 'text', text: NPC_RELAY_TAIL },
      ])
    case 'mark':
      return envelope(kind, line.clock, [{ p: 'span', text: line.text }])
    // x6 — `wait` survives here because it is the SEAM's kind and the seam is
    // frozen (`shared/view-driver.ts`, guarded by `seam-shapes.test.ts`), not
    // because anything prints one: `createRunFeed` drops wait lines before they
    // reach the DOM and the waiting markers are gone (see `appendLine`). The
    // case stays so the projection is total for every kind the seam can send.
    //
    // x8 — and `symptom` is now the second such kind, for the same reason and
    // by the same mechanism. It is still on the seam and still reaches Call 2 as
    // `SCENE_SYMPTOMS` (the only channel state change has at all —
    // `contract-calls.md` §3 rule 5); it simply no longer lands on the paper.
    case 'wait':
    case 'symptom':
    case 'event':
    case 'fallback':
      return envelope(kind, line.clock, [{ p: 'text', text: line.text }])
    default: {
      const unhandled: never = kind
      throw new Error(`live feed: unhandled FeedKind ${String(unhandled)}`)
    }
  }
}

/* ── pacing (U1) ─────────────────────────────────────────────────────────── */

/* How the paper prints, x11 (민서, 08-10) — and what it replaces.

   The old pump landed each line WHOLE and then waited 600–2400 ms before the
   next one, priced by how much that next line asked the player to read
   (`REVEAL_CHAR_MS` · `REVEAL_MIN_MS` · `REVEAL_MAX_MS`), with a crowd divisor
   that halved the wait once five events were queued. Two things were wrong with
   it and both are why this block exists:

    * the divisor made the beats with the MOST to read go by FASTEST. A crowded
      queue is a busy minute of the run — three lines of an argument in the room
      — and it was exactly the stretch the pump decided to hurry through.
    * a line that appears whole is a page of a document. This window is a radio
      record printing as the desk hears it.

   NOTHING REPLACES THE DIVISOR, and the lag it bounded is accepted now. Its
   stated job was to keep the feed from falling unboundedly behind a sim that
   emits faster than anyone reads, and the two ways that could hurt are both
   closed: the top bar publishes the PAPER's stamp rather than the sim clock's
   (`shell/feed-clock.ts` — x6), so a backlog never shows as two clocks
   disagreeing; and there is no player-reachable fast-forward at all, because
   `windows/live-feed.ts` gates the whole `__feed` handle behind
   `import.meta.env.DEV` and the bundler folds it out of the player build. What
   is left is a queue that drains slower than it fills for a while and then
   catches up in the quiet — measured at ~51 s of paper against the demo day's
   77 s of sim at ×1, and `live-feed.test.ts` pins that ratio to the constants
   below so a re-tune cannot quietly put the paper behind the day.            */

/**
 * The pause after a ROW.
 *
 * The typewriter's `msBetween` is the beat between two sentences of one
 * document; here a "sentence" is a whole feed line, so this is the beat between
 * two utterances and is priced higher than the report body's 130 ms. Same
 * reasoning `slot-board.ts` records for its own pair: the pause only reads as a
 * pause while it is worth a dozen-odd characters of the rate beside it, and at
 * 16 ms/char this is worth 16 of them — a row boundary, not a stop.
 */
const FEED_ROW_MS = 260

/**
 * Real milliseconds one character costs on the fanfold.
 *
 * x12 — SLOWER THAN THE DESK'S READING PACE, and no longer borrowed from it
 * (민서, 08-10 — "the typing speed pace is a little fast"). x11 spread
 * `READING_PACE` here on the strength of that constant's own note, "the feed
 * arriving at the speed a radio delivers it". Played, 11 ms/char read as a
 * machine dumping a line rather than a transmission being received: the eye
 * arrives at the end of the row before the row has finished being a row.
 *
 * The ceiling is arithmetic and it is close. The demo day prints ~1560
 * characters into 77 s of sim at ×1, and the paper may not end the run behind
 * the desk — the ending waits on it. A teletype's own 100 ms/char would be 156 s
 * of typing and is impossible; 16 lands the day's paper at ~57 s, and
 * `live-feed.test.ts` recomputes that sum from these constants against the real
 * fixture and holds the ratio under 0.8 so the next re-tune cannot cross it
 * quietly.
 *
 * The reading still happens in the PAUSES. This rate only has to make the
 * characters look like they are arriving rather than appearing.
 */
const FEED_MS_PER_CHAR = 16

/**
 * The feed's pace: this window's own rate and its own row beat.
 *
 * Both numbers differ from `READING_PACE` now, so it is spelled out rather than
 * spread — a spread would say "the report's pace, with one change" and that is
 * no longer true of either field.
 */
export const FEED_PACE: TypePace = { msPerChar: FEED_MS_PER_CHAR, msBetween: FEED_ROW_MS }

/**
 * The pause when the DESK CLOCK MOVES — the in-world time between two lines,
 * priced as real time and capped hard.
 *
 * Proportional, because a line stamped 33 minutes after the one above it should
 * not arrive as if it were the next breath; capped, because the player must not
 * be made to wait for a run that is happening whether they watch or not. The
 * pause has one job: to make the next line feel like it took time to happen.
 *
 * The cap is NOT optional, and the shipped pack is the argument. `멈춘회전문`'s
 * gaps run 0 to 33 sim-minutes, so raw proportionality would make the last pause
 * thirty times the first; the demo fixture (`driver/fixtures/woodari-run03.ts`,
 * which is what e2e drives) has gaps of 89. Opening at 240 ms and adding 24 ms a
 * minute, the cap binds from 28 minutes up and the whole spread is 264 → 900 ms
 * — a factor of 3.4 between the shortest hop and the longest silence of the day.
 *
 * The OPENING term is why a one-minute hop is not 24 ms: what the operator reads
 * is that the clock moved at all, and a pause too short to notice would make the
 * proportional part the only signal, which the small gaps do not carry.
 */
const GAP_OPEN_MS = 240
const GAP_MS_PER_MIN = 24
const GAP_MAX_MS = 900

/**
 * The pause the paper owes a line stamped `to` when the last one printed said
 * `from`. Pure, so the day's whole cost can be summed under `environment:
 * 'node'` — see `live-feed.test.ts`.
 *
 * Zero before the first line, zero within a minute, and zero BACKWARDS: the seam
 * is ordered by clock, but a `score` line reuses the last stamp and a run that
 * ever emitted out of order would owe a negative pause, which is not a thing.
 */
export function feedGapMs(from: string, to: string): number {
  if (from === '' || to === '' || from === to) return 0
  const delta = mm(to) - mm(from)
  if (delta <= 0) return 0
  return Math.min(GAP_MAX_MS, GAP_OPEN_MS + delta * GAP_MS_PER_MIN)
}

/**
 * Does this kind arrive character by character, or land whole?
 *
 * `mark` is the ruled divider the fanfold prints between rounds — chrome, not
 * something the desk heard, and the reference sets it as a rule across the page
 * rather than as a line of the record.
 *
 * `fallback` lands whole too, and that is the judgement this note is here to
 * record (x11). A fallback notice is the ABSENCE of a transmission — the answer
 * that never came — and typing it out would give the missing reply the same
 * arriving-now animation as a real one. It is the desk reporting on itself, in
 * the same breath as the `※` and the hatched band it prints on, and it should
 * read as stamped rather than as spoken.
 */
export const typesOut = (kind: FeedKind): boolean => kind !== 'mark' && kind !== 'fallback'

/**
 * The two kinds the fanfold DROPS — one owner, and two readers of it.
 *
 * x8 put `symptom` beside x6's `wait`; the reasons are at `appendLine`, which is
 * where the drop happens. It is a named predicate rather than a condition
 * spelled out there because the reveal pump asks the same question a second
 * time (`printsFeedLine`): a dropped line prints nothing, so the pump may not
 * charge time for it, and two copies of "which kinds are undrawn" would be two
 * ways for the paper and its clock to disagree about what a beat contains.
 */
const isUndrawn = (line: FeedLine): boolean => line.kind === 'wait' || line.kind === 'symptom'

/**
 * Will this queued event put a line on the paper?
 *
 * THE PUMP CHARGES TIME FOR NOTHING ELSE (x11, 민서 08-10). It used to charge one
 * delay per QUEUED EVENT, and `revealChars` answered 0 for everything that was
 * not a feed line, so every one of them fell to the 600 ms floor: `beat_start`,
 * the four `waiting` edges of a gate beat and `beat_end` were five or six events
 * that printed nothing and cost three seconds of dead air between the lines that
 * did. With the crowd divisor gone that dead air would have doubled.
 *
 * A `fallback` EVENT is not a printing event either, though a notice may follow
 * it: it only arms `pending`, and the line that carries the class is the next
 * `feed` event, which is charged as itself.
 */
export function printsFeedLine(event: ViewEvent): boolean {
  if (event.type === 'score') return true
  return event.type === 'feed' && !isUndrawn(event.line)
}

/* THE REPORT HOLD IS GONE (x12, 민서 08-10), and what replaced it runs the
   other way round.

   `REPORT_HOLD_MS = 9000` STOPPED THE FANFOLD for nine seconds whenever a
   `report` event arrived, so the operator could read the write-up without the
   paper printing over it. It was sized when the reveal landed lines whole and
   the feed trailed the seam by a beat or two: pausing the one that was slightly
   ahead let the two surfaces meet.

   x11 inverted that. The paper types now, at reading pace, and it reaches a
   round's report tens of seconds after the seam emits it — so the hold was
   stopping the surface that was already BEHIND, for the benefit of the one that
   had overtaken it, and every hold put it further behind the next one.

   The gate REPLACED it rather than joining it. Both could not stand: a hold is
   the paper waiting for the document, the gate is the document waiting for the
   paper (`shell/feed-reach.ts`), and running both would be two surfaces each
   waiting for the other to move — nine seconds of stopped paper added to every
   round of a lag the stopping is what caused. The reading the hold was buying
   is bought by the gate for free, and more honestly: the write-up now types
   over a fanfold that has just finished saying what it is about, instead of one
   that has been frozen mid-round.                                            */

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
  /**
   * Applies everything still queued — the reveal never outlives a seek (U1) —
   * AND settles the line that is typing. x11: `flush()` is a promise that
   * `textContent` is complete the instant it returns, which is what every test
   * and every e2e read that follows a flush is built on.
   */
  flush(): void
  /** Whether the paper is still following its tail (U2) — read by e2e only. */
  following(): boolean
}

/**
 * The sr-only twin's classes.
 *
 * `.sr-only` is the shared recipe, and it lives in `styles/shell.css` beside
 * `#toast` — the desk's other heard-but-never-seen node — because it was that
 * rule first and the constraints its comment records (a 1px box rather than
 * zero area, no `margin` because the token lint owns that property) are the same
 * constraints here. A second copy of the declarations would be a second thing to
 * get wrong the next time one of them is questioned.
 */
const SR_LINE_CLASS = 'fl-sr sr-only'

/** Everything a line renders as text, in order — what the live region reads. */
const lineText = (node: FeedNode): string => node.parts.map((part) => part.text).join('')

/**
 * The first `chars` characters of a line's parts, in order — the type cursor's
 * view of the content column.
 *
 * THE ONE PLACE THIS MODULE RESHAPES RUN TEXT, and it is a PREFIX taken from 0:
 * never a middle, never a pad, never a reformat. [u5#c9] bans string transforms
 * on `line.text` outright and `live-feed.test.ts` (b) now names this the single
 * exemption, with the shape of the call pinned — because what a typewriter does
 * is show a prefix of what it is about to show, and nothing about the line it
 * finally shows is derived: `settleTyping` repaints the whole of `node.parts`,
 * and the sr-only twin has carried the complete text since the first frame.
 *
 * A part that has not been reached yet is ABSENT rather than empty. An empty
 * `<q>` still renders its quote marks, so an npc line would open with a pair of
 * bare quotes and then fill them — the frame arriving before the utterance.
 */
export function typedParts(parts: readonly FeedPart[], chars: number): FeedPart[] {
  const out: FeedPart[] = []
  let left = chars
  for (const part of parts) {
    if (left <= 0) break
    out.push(left >= part.text.length ? part : { ...part, text: part.text.slice(0, left) })
    left -= part.text.length
  }
  return out
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

/**
 * One row of the fanfold, and the content column the type cursor writes into.
 *
 * x11 — THE ROW IS TWO COLUMNS AND A TWIN. `#feedList` is a `role="log"` with
 * `aria-live="polite"` / `aria-relevant="additions"`, which is the whole reason
 * a reader listening to the run hears it at all (R2 on index.html:125) — and a
 * live region whose text node is rewritten every frame is a line re-announced
 * per character. Neither of the desk's other typing surfaces sits in one
 * (`components/report-view.ts`, `components/slot-board.ts`), so this is the
 * first time the cost has come due, and it is paid by splitting the row:
 *
 *  * `.fl-c` keeps its class, its `data-mark` and its part structure — every
 *    e2e selector on this window reads it, and they stay correct because a
 *    finished line is exactly what it always was — and gains `aria-hidden`.
 *  * `.fl-sr` carries the complete text, landed at once, so the region announces
 *    the line once and says all of it.
 *
 * The stamp is deliberately NOT hidden: it is a sibling column, it lands whole,
 * and it is the only part of the row a reader has to hear in place.
 */
function lineElement(
  node: FeedNode,
  band: boolean,
  typed: boolean,
): { li: HTMLLIElement; content: HTMLElement } {
  const li = el('li', node.classes.join(' '))
  if (band) li.classList.add('band')
  for (const [key, value] of Object.entries(node.data)) li.setAttribute(`data-${key}`, value)

  if (node.stamp !== null) li.append(el('div', 'fl-t', node.stamp))

  const content = el('div', 'fl-c')
  if (node.kind !== 'mark') content.dataset.mark = node.mark
  content.setAttribute('aria-hidden', 'true')
  // A typed row opens EMPTY — the cursor writes it from the next tick on. The
  // gutter mark is `::before` on this node, so what the operator sees in that
  // first frame is the print head and nothing after it.
  if (!typed) content.append(...node.parts.map(partNode))
  li.append(content, el('div', SR_LINE_CLASS, lineText(node)))
  return { li, content }
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

  // Instance state: the green band alternates down the page (app.js:434).
  //
  // x8 — the symptom watch is gone with the symptom line. It counted a beat's
  // symptoms so a silent one could still print `(변화 없음)`; nothing prints
  // either now, so `beat_start` / `beat_end` carry nothing for this window.
  let band = false
  let stamp = ''
  // x7 — the first agent, until `meta` names the sitting. Same reasoning as
  // `feedLineModel`'s default above: the boot state is a DOCUMENT question.
  let callsign = callsignOf(1)
  /**
   * The sitting the paper is printing, off the `meta` it has APPLIED (x12).
   *
   * Not the one that has arrived. Every cue this window publishes carries it
   * (`shell/feed-reach.ts` — a round number repeats every sitting), and the run
   * a cue belongs to is the run whose `meta` the paper has already got past —
   * which is what the seam's own ordering guarantees it is, since `meta` opens
   * the day the reports below it belong to. Reading an arrival here would name
   * the next day's run on a report still queued from the last one.
   *
   * `0` before the first `meta`, exactly as `windows/reports.ts` holds it, so a
   * pre-first-press cue is never mistaken for run 1's.
   */
  let run = 0
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

  /**
   * The desk's clock, moved by a line the run has REACHED.
   *
   * x6 — the top bar's clock is this stamp, published as the line lands rather
   * than as the event arrives. The reveal queue holds lines back, so publishing
   * from `receive` would put the chrome ahead of the paper — the mismatch the
   * whole slot exists to close (`shell/feed-clock.ts`). x12: it used to hold
   * harder on a report, and that clause is deleted rather than reworded — the
   * report hold is gone (see where `REPORT_HOLD_MS` was), and the reasoning here
   * never depended on it, only on there being a queue at all.
   *
   * x8 — and it is called for the lines the fanfold DROPS as well as the ones it
   * prints (민서, 08-10), which is why it is a function now. Dropping the
   * symptom line took the desk clock with it the first time: the demo day's last
   * minute belongs to a beat whose only line is a symptom, so the clock stopped
   * at 21:00 on a run that reaches 21:04, and the 집계 line — which reuses this
   * stamp because `score` carries no clock of its own — was stamped with it.
   * A dropped line is still a minute the run got to. It is not a line the reader
   * has to wait for, and it is dropped inside the reveal pump, so this stays in
   * step with the paper either way.
   */
  const advanceStamp = (at: string | null): void => {
    if (at === null || at === '') return
    stamp = at
    publishFeedStamp(at)
  }

  /* ── the reveal queue and the type cursor (U1) ───────────────────────────
     Downstream of fanout on purpose: pacing here can starve nothing, while the
     adapter's own queue gates step(). Paced only while the sim clock runs or has
     ENDED; a paused desk, frozen animations, reduced motion and a seek all land
     whole. Declared above the append path because everything below publishes to
     it — the count, and the one line that is still arriving. */
  const queue: ViewEvent[] = []
  /** The pause owed before the next line lands — a row's, or the desk clock's. */
  let pauseMs = 0
  /** Has the head line's desk-clock pause already been charged? See `printNext`. */
  let gapPaid = false

  /** The line still arriving. One at a time, always — see `append`. */
  let typing: { content: HTMLElement; parts: readonly FeedPart[]; lengths: number[]; elapsed: number } | null =
    null

  /**
   * What the feed still owes the paper (x11) — queued events plus the line being
   * typed, published on every change so `shell/ending.ts` can wait for the tail.
   *
   * The count is taken while the event being applied is STILL IN THE QUEUE (see
   * `printNext` and `flush`, which shift after applying, not before): a step
   * that settled one line and started the next would otherwise publish 0 in
   * between, and 0 is the transition the ending is waiting for. It would come
   * down over a fanfold that had a line half-typed.
   */
  const publishPending = (): void => {
    publishFeedPending(queue.length + (typing === null ? 0 : 1))
  }

  /**
   * Land the arriving line whole, now.
   *
   * Every way a line can stop typing runs through here — the cursor finishing,
   * a flush, a seek, and the next line starting (`append` opens with it, which
   * is what makes "one at a time" true rather than merely usual). There is no
   * second writer of `typing`, so there is no state to leave half-painted.
   */
  const settleTyping = (): void => {
    if (typing === null) return
    const landing = typing
    typing = null
    landing.content.replaceChildren(...landing.parts.map(partNode))
    publishPending()
    follow()
  }

  const append = (node: FeedNode): boolean => {
    settleTyping()
    // BEFORE the line lands, while `scrollHeight` still describes the paper the
    // operator is actually looking at — and because a `scroll` event runs a
    // frame behind the gesture that caused it. A line arriving inside that frame
    // would otherwise follow on a reading already one gesture out of date, and
    // yank the reader to the tail: the exact failure this all exists to stop.
    reread()

    if (node.kind === 'event' || node.kind === 'npc') band = !band
    const typed = typesOut(node.kind)
    const { li, content } = lineElement(
      node,
      (node.kind === 'event' || node.kind === 'npc') && band,
      typed,
    )
    list.append(li)
    // The whole row is ONE sentence to the cursor: a feed line is one utterance,
    // so `msBetween` is the pause after the row rather than a beat inside it —
    // which is also why the line is still "arriving" through that pause, and
    // still counted as owed.
    if (typed) typing = { content, parts: node.parts, lengths: [lineText(node).length], elapsed: 0 }
    advanceStamp(node.stamp)
    if (!attached) {
      missed += 1
      paintBehind()
    }
    follow()
    return true
  }

  const appendLine = (line: FeedLine): boolean => {
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
    //
    // x8 — a symptom line is not printed either (민서, 08-10), and the reasoning
    // rhymes. The symptoms were the engine's delta journal rendered into
    // sentences, printed in italic under every beat: on most beats they said
    // `(변화 없음)`, and on the rest they reported a weaker thing than the line
    // directly above them already does. The citation mark over the utterance
    // (`인수인계 01 · 03`) names the slots the agent actually cited, which is the
    // signal the operator is looking for — whether their handover reached the
    // agent. The symptoms sat in the noisiest slot on the paper saying less.
    //
    // They are NOT deleted upstream: `SCENE_SYMPTOMS` is the only channel state
    // change has into Call 2 at all (`contract-calls.md` §3, rule 5), so the
    // model still knows how the roster is behaving. Only the print is gone.
    //
    // x11 — the drop is `isUndrawn` (see there) rather than the kinds spelled
    // out here, because the reveal pump has to ask the same question before it
    // charges anyone time. Everything else about this guard is unchanged, and
    // the clock still moves on the way out: a dropped line is a minute the run
    // reached (see `advanceStamp`).
    if (isUndrawn(line)) {
      advanceStamp(displayStamp(line.clock))
      return false
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
    return true
  }

  /**
   * Applies one event, and answers WHETHER IT PUT A LINE ON THE PAPER.
   *
   * x11 — the answer is the pump's whole accounting. Time is charged for a line,
   * never for an event: everything that lands nothing (`meta`, the `waiting`
   * edges, a `fallback` arming its class, the beat boundaries, `report`,
   * `run_end`, and a dropped `wait`/`symptom` line) is consumed for free. See
   * `printsFeedLine`, which answers the same question one step earlier so the
   * pump can look at the head of the queue before it commits to a pause.
   *
   * x12 — AND IT IS THE ONE PLACE THE PAPER SAYS WHERE IT HAS GOT TO. Every cue
   * `shell/feed-reach.ts` carries is published from an arm below, which is not
   * tidiness: it is what makes the gate release on every path without any of
   * them being taught about it. `flush()` is a run through `apply`, so a seek, a
   * reduced-motion desk, frozen animations, a halted clock and the mount-time
   * prefill all land the cues with the lines they belong to. The one rule this
   * places on future edits is the one stated here — a cue is published where the
   * event is APPLIED, never where it arrives.
   */
  const apply = (event: ViewEvent): boolean => {
    switch (event.type) {
      case 'meta':
        // x7 — the run is still the seam's (C3); the NAME for it is not this
        // window's to compose. The `Math.max(1, …)` that used to guard run 0 off
        // `ECHO-0` went with the literal: `callsignOf` answers a pre-first-press
        // run itself, and one guard is one place that can drift.
        callsign = callsignOf(event.run)
        // x12 — the sitting every cue below is stamped with. See `run`.
        run = event.run
        stock.textContent = HEAD_STOCK + HEAD_SEP + callsign
        return false
      case 'feed':
        return appendLine(event.line)
      case 'fallback':
        // spec-client §7 #7. The engine names the CALL that failed (1 · 2 · 3)
        // and the error code; `fallback-notice.ts` is the only place that turns
        // one into a class. The class rides the fallback line the event pairs
        // with — and if no such line follows, the next line flushes it as a
        // notice of its own, so a fallback is never silent.
        pending = { cls: FALLBACK_CLASS[event.call], code: event.code }
        return false
      // `waiting` is still on the seam and the live driver still emits it
      // (`driver/live-driver.ts`), because it is what the ADAPTER's own queue is
      // built around. The fanfold simply no longer draws anything for it — x6,
      // and see `appendLine` for why. x11: and it costs nothing to consume,
      // which is the same claim one layer down — `return false` is the pump
      // being told this event bought no paper.
      case 'waiting':
        return false
      case 'score': {
        // The day's count, from the ledger the run actually scored — see
        // `tally-line.ts` for why it is not a timeline event any more. It reuses
        // the last stamp the same way an opening wait marker does: the seam's
        // `score` carries no clock, and the day is over, so the line belongs to
        // the minute the run closed on rather than to one of its own.
        const printed = append({
          ...envelope('event', '', [{ p: 'text', text: tallyLineText(event) }]),
          stamp,
        })
        // x12 — and the terminal record's count-up waits for this. The ledger's
        // headline and this 집계 line are two printings of ONE count (the same
        // pairing `shell/ending.ts` reasons about when it waits for the tail),
        // so the record rolling to the day's number while the paper had not yet
        // said it was the outcome arriving ahead of its own last line.
        // Published AFTER the append, so the line is on the page — it is still
        // typing, which is right: the two now count up together.
        publishFeedReached({ at: 'score', run })
        return printed
      }
      case 'report':
        // Nothing is drawn and nothing is charged — the write-up is REPORTS's
        // document, and this window has never printed a word of it. What is new
        // in x12 is that walking past the event is itself the news: the paper
        // has printed everything the seam emitted before this report, which is
        // the round's last beat, so the round is now readable without the
        // document describing beats the operator has not seen.
        publishFeedReached({ at: 'report', run, round: event.round })
        return false
      default:
        // `run_end` belongs to another window — and since x8 so do `beat_start`
        // / `beat_end`, which this window watched only to decide whether a beat
        // owed a `(변화 없음)` line. Nothing is owed now.
        return false
    }
  }

  /**
   * The desk has stopped for the operator — as opposed to having ENDED.
   *
   * `settle` has always drawn this line (`!running && !ended`); until x11 the
   * pump drew a different one (`!running`) and dumped the rest of the day the
   * moment the clock reached 21:04. They are one predicate now, and the reason
   * is the whole of x11: an ended run still has paper to print, and a paused one
   * has an operator waiting who asked for everything to stop.
   */
  const halted = (): boolean => !driver.clock.running && !driver.clock.ended

  const flush = (): void => {
    // Bounded by the queue's own length: `apply` never pushes, so this cannot
    // run away — but an unbounded synchronous loop is a frozen desk rather than
    // a slow one, and the bound costs a line.
    let guard = queue.length
    while (queue.length > 0 && guard > 0) {
      guard -= 1
      apply(queue[0]!)
      queue.shift()
    }
    // x11 — AND THE TYPEWRITER. A flush is a promise that the paper is complete
    // the instant it returns: `windows/live-feed.ts` hands `flush` to `seek`,
    // and every test and e2e read that follows one reads `textContent`.
    settleTyping()
    pauseMs = 0
    gapPaid = false
    publishPending()
  }

  /**
   * One step of the paper: consume everything that prints nothing, then take the
   * next line — after the pause the desk clock owes it.
   *
   * The free loop is where x11's second half lives. Non-printing events are
   * shifted off the head and cost NOTHING, so a gate beat's `beat_start`, four
   * `waiting` edges and `beat_end` no longer sit between two lines charging a
   * reveal delay each. A dropped `symptom` goes the same way — free, but through
   * `apply`, because it still has to move the desk clock on its way out. That is
   * why symptoms stay in the queue instead of being filtered at `receive`:
   * publishing their stamp on arrival would put the chrome ahead of the paper,
   * which is the exact bug x6 fixed.
   */
  const printNext = (): void => {
    let guard = queue.length
    while (queue.length > 0 && guard > 0 && !printsFeedLine(queue[0]!)) {
      guard -= 1
      apply(queue[0]!)
      queue.shift()
      publishPending()
    }
    if (queue.length === 0) return

    // The desk-clock pause is charged BEFORE the line lands, because it is the
    // time between two lines and not a beat after one: a pause taken afterwards
    // would sit under the new minute instead of in front of it. `gapPaid` is how
    // the pump remembers it has already paid for the head it is standing in
    // front of — without it, the recomputed pause would re-arm forever, since
    // the stamp it is measured against only moves when the line lands.
    const head = queue[0]!
    const at = head.type === 'feed' ? displayStamp(head.line.clock) : stamp
    if (!gapPaid) {
      gapPaid = true
      const owed = feedGapMs(stamp, at)
      if (owed > 0) {
        pauseMs = owed
        return
      }
    }
    const printed = apply(head)
    queue.shift()
    gapPaid = false
    publishPending()
    // A line that lands WHOLE still breathes afterwards. A typed one carries the
    // same pause inside its cursor (`FEED_PACE.msBetween`), which is why this is
    // only for the kinds `typesOut` refuses.
    if (printed && typing === null) pauseMs = FEED_PACE.msBetween
  }

  registerAnimation('feed/reveal', (realMs: number) => {
    if (queue.length === 0 && typing === null) return
    // A frozen pump never ticks, so the frozen case can only flush at enqueue
    // (below); this in-pump check catches a mid-run reduced-motion flip. The
    // clock half is `halted()` and not `!running`: an ENDED run goes on draining
    // at its own pace, and `shell/ending.ts` waits for it (x11).
    if (motionless() || halted()) {
      flush()
      return
    }
    if (typing !== null) {
      typing.elapsed += realMs
      const cursor = typeCursor(TYPE_START, typing.elapsed, typing.lengths, FEED_PACE)
      if (cursor.done) settleTyping()
      else typing.content.replaceChildren(...typedParts(typing.parts, cursor.chars).map(partNode))
      return
    }
    if (pauseMs > 0) {
      pauseMs -= realMs
      return
    }
    printNext()
  })

  // The settle watchdog: alive only while the feed still owes something. The
  // pump rides the driver's animation channel, which stops with the clock — so a
  // clock that stops with lines still queued (the live boot pauses right
  // after its opening fanout) would strand them forever without this.
  //
  // x11 — "owes something" now includes a line mid-type. The clock pausing
  // between two characters would otherwise leave the row half-written with no
  // tick coming to finish it, which is the failure `slot-board.ts`'s watchdog
  // note describes at length.
  let settling = false
  const settle = (): void => {
    settling = false
    if (queue.length === 0 && typing === null) return
    if (halted()) {
      flush()
      return
    }
    settling = true
    requestAnimationFrame(settle)
  }

  const arm = (): void => {
    if (settling) return
    settling = true
    requestAnimationFrame(settle)
  }

  const receive = (event: ViewEvent): void => {
    // x12 — and NOTHING IS DONE WITH THE EVENT HERE. A `report` used to arm the
    // nine-second hold from this line (see the block where `REPORT_HOLD_MS`
    // was); it now rides the queue like everything else and is announced when
    // the pump walks past it, which is the whole of the cue.
    queue.push(event)
    publishPending()
    // x11 — `run_end` NO LONGER FLUSHES (민서, 08-10). The day used to end by
    // dumping: the terminal batch arrived, the whole backlog printed in one
    // frame, and the ending veil came down over a fanfold that had just thrown
    // its tail onto the page. It was survivable only while the crowd divisor
    // kept the backlog small. The three bypasses that remain are each a promise
    // this window cannot keep any other way: frozen animations (the pump never
    // ticks, so enqueue is the only path a line has), reduced motion (a promise
    // that nothing animates) and a HALTED clock (the operator stopped the desk).
    if (motionless() || halted()) {
      flush()
      return
    }
    arm()
  }

  // Pin the empty paper BEFORE the first line, because `append` re-reads
  // attachment from the box and the box can already overflow with nothing in it:
  // the head and the tail spacer are content too. On T3's short window that read
  // `gap 97 > slack` at boot, so the very first line detached the feed and every
  // `follow` after it returned early — a run of 43 lines with `scrollTop` still
  // 0, measured. One pin here and the first re-read has a tail to find.
  follow()

  // x12 — THERE IS PAPER ON THIS DESK, said before a word of it is printed.
  // `shell/feed-reach.ts` answers every cue as already-reached until a fanfold
  // announces itself, because a desk with no LIVE FEED must not hang the
  // documents that would otherwise wait for it. This is where that stops being
  // true, and it is above the prefill so there is no window in which this window
  // exists and its cues are answered for an absent one.
  publishFeedMounted()

  // The reference's `prefillFeed`: everything the driver already released is
  // laid down without animation budget, then the tail is caught up once.
  //
  // x11 — and WHOLE. The prefill is what the driver released before this window
  // existed, so none of it is arriving now; `flush` is what settles the cursor
  // the last of those lines would otherwise have opened (the queue it drains is
  // empty here — `subscribe` has not been called yet).
  for (const event of driver.frame().events) apply(event)
  flush()
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

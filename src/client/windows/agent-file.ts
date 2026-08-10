// [u4] AGENT FILE — 요원 파일 · 프롬프트 편성 (spec-client §4).
//
// The window assembles four components and owns nothing else: the ruled file
// head, the §0–§5 dossier, the deploy zone and the stamp. The membrane state
// lives in the SlotBoard (one owner, `components/slot-board.ts`); the run state
// this file keeps is the two things the seam tells it — the current run, and
// the run it deployed for.
//
// U3 (playtest g3-1) — TALLY dissolves: this window also drives the day's
// turn. `shell/run-state.ts`'s `'tally'` phase now means "the day is closed,
// awaiting the turn", and its two surfaces are the terminal record (REPORTS)
// and this window's merged deploy control. The hold/settle logic below is
// ported from `windows/tally.ts` (deleted this unit) with its DOM targets
// retargeted from the old wait line and its own new-run button onto the one
// control `components/deploy-button.ts` now builds.
//
// Import-safe by contract (u3): no DOM at module scope, no stylesheet import,
// no sibling window import, nothing from engine or composer (C8 / inv 12), and
// no fixture module — carried ids resolve through the report index (D13).
import type { FixtureDriver, Sentence } from '../driver/index.ts'
import { animationsFrozen } from '../driver/index.ts'
import { button, el, must } from '../shell/dom.ts'
import { deployCopy, openConfirm } from '../shell/confirm.ts'
import { announce } from '../shell/announcer.ts'
import { fetchScenarioIdentity } from '../shell/pack.ts'
import { PORTAL } from '../shell/portal-identity.ts'
import { createRunState, hasFiledReport } from '../shell/run-state.ts'
import type { RunPhase, RunState } from '../shell/run-state.ts'
import { blockCardModel, setPickedBlockId } from '../components/block-card.ts'
import {
  agentModel,
  buildDossier,
  callsignOf,
  coverModel,
  filedModel,
  nextCallsignOf,
} from '../components/dossier.ts'
import { SLOT_CAP, createSlotBoard, usedIds } from '../components/slot-board.ts'
import { buildDeployStamp, buildDeployZone, deployView } from '../components/deploy-button.ts'
import type { DeployMode } from '../components/deploy-button.ts'
import { PACE, settleRelease } from '../components/score-tally.ts'

// x6b — THE LAST PRINTED WAIT LINE (민서, 08-09, playtest).
//
// `const WAITING = '……보고서 정리 중'` stood here, and its own comment gave it
// away: "verbatim from `windows/tally.ts` — diegetic, never a spinner". It was
// the mechanism x6 removed from the fanfold, wearing the same `……` leader,
// mounted in a different window — which is why a sweep of the feed did not find
// it. It printed under the DEPLOY control for the length of the settle hold.
//
// The note is BLANK across the hold now, and nothing the operator could act on
// went with it: the control is disabled for that whole stretch whatever the
// line says, and the moment the release lands the note becomes the one thing
// in the loop worth reading — FILED_NOTE's instruction, LAPSED_TAIL's degraded
// day, or SPENT. A wait line reports that the desk is still working; a release
// reports what happened. Only the second is news.
//
// `SAY_HOLD_TAIL` below survives on purpose. It is not drawn either (the live
// region is clipped off-screen since x6b) and it is the one channel where the
// hold is worth saying: a screen-reader operator cannot see that the button is
// disabled, so silence there would be a dead control with no explanation.
/**
 * The line the control settles on once the run's report is on the desk.
 *
 * x5 — was `${callsign} 보고서가 부검 창에 도착했습니다`, which reported a fact the
 * REPORTS window had already announced by filling itself in. This is the one
 * moment in the loop where the operator has something to DO and no prompt
 * telling them, so the line is the instruction instead. It names no callsign
 * because it is about the NEXT agent, not the one who just came back.
 */
const FILED_NOTE = '인수 인계 완료 후 요원을 파견하여 시뮬레이션을 재시도 하십시오'
/** …and the line it settles on when the hold ran out and none came. */
const LAPSED_TAIL = ' 보고서는 아직 부검 창에 없습니다 — 다음 시행은 열려 있습니다'
/** The allotment is spent: `new_run` was refused, and the loop has no next day. */
const SPENT = '잔여 시행 없음 — 마지막 집계입니다'

/** WHAT THE DESK SAYS while the hold runs — the wait line only PRINTS. See the
 * fuller note this was ported from at `windows/tally.ts` (u7, pre-U3). */
const SAY_HOLD_TAIL = ' 집계 대기 · 보고서 정리 중'
const SAY_FILED_TAIL = ' 집계 완료 · 다음 시행을 시작할 수 있습니다'
const SAY_LAPSED_TAIL = ' 보고서가 도착하지 않았습니다 · 다음 시행을 시작할 수 있습니다'

/** The dev/test handle, exactly as `shell/boot.ts` exposes `window.__shell`. */
export interface AgentFileHandle {
  slots(): (string | null)[]
  place(blockId: string, slot: number): void
  clear(slot: number): void
  deployed(): boolean
  /** Seeds the id→Sentence index a `report` event would otherwise fill. */
  index(sentence: Sentence): void
  /** Arms the pick channel a slot press consumes. */
  pick(blockId: string | null): void
  /** The run loop's own phase, off the moved run-state store (u7, ported). */
  phase(): RunPhase
  /** The run-loop numbers as the `meta` event carries them. */
  meta(): { run: number; runs_left: number; carried: string[]; archive: { run: number; label: string }[] }
}

declare global {
  interface Window {
    __agentFile?: AgentFileHandle
  }
}

const FILE_TITLE = '현장 요원 운용 파일'
/** U5.3 — what a past page says when that sitting went out with an empty file. */
const FILED_EMPTY = '배치된 문장 없음'
/** What the file's own doc-number line is called (reference `fh-doc`). */
const DOC_CAPTION = '문서번호 '

/** Mounts this window's contents into the frame body the shell built. */
export function mount(host: HTMLElement, driver: FixtureDriver): void {
  const store = createRunState(driver)

  const sentences = new Map<string, Sentence>()
  /**
   * U5.3 — what each sitting flew, by run. Written at exactly two sites (see
   * the two `filed.set` calls below), each of which knows its run without doing
   * arithmetic on the authority's numbers ([u7#c3]). Never persisted: H2 makes
   * a page load a new sitting, so the session is exactly the span these pages
   * are about.
   */
  const filed = new Map<number, string[]>()
  let run = 0
  let slug = ''
  let opensAt = driver.clock.at()
  let committedRun: number | null = null
  let committedAt: string | null = null
  let committedIncoming = false
  /**
   * H3 — the file on the desk belongs to the agent AFTER `run`.
   *
   * True from the moment the day closes until the `meta` that opens the next
   * one, and false the rest of the time. The desk knows this before the run
   * loop does, because 21:04 is when the operator gets the file back: what they
   * mine into it from then on is the NEXT agent's handover, and heading that
   * page with the callsign of the agent who has just come home is what made a
   * sitting read as ECHO-1, ECHO-1, ECHO-2, ECHO-3.
   *
   * `runs_left` gates it (see the `'tally'` branch): on the last day of an
   * allotment there is no next agent, so the page stays the one that flew.
   */
  let incoming = false

  /**
   * `ECHO-n` for the agent this file is being built for — or `''` while the
   * page is waiting for one.
   *
   * H3 (08-09, 민서) — the incoming page opens UNNAMED. It briefly opened
   * headed `nextCallsignOf(run)`, which is a name the run loop has not issued:
   * true by arithmetic, and a promise the desk has no authority to make. The
   * blank says the honest thing — this file is for whoever is sent next, and
   * nobody has been sent yet — and the press is what fills it in
   * (`typeCallsign`, from `sendNewRun`). `nextCallsignOf` is still what answers
   * it there, at the one moment the operator has committed to the send.
   */
  const onDesk = (): string => (incoming ? typedCallsign : callsignOf(run))

  /**
   * What the incoming page's 호출부호 row currently shows — `''` until the
   * press, then the new callsign one character at a time. Drawing state only:
   * nothing downstream reads it, and `committedRun` (not this) is what dates
   * the chop.
   */
  let typedCallsign = ''

  /**
   * H3 — the run whose page is owed a filing, held from the close until the
   * settle. `null` means nothing is owed: either no day has closed, or the day
   * that closed was the last of the allotment and has no successor to hand to.
   */
  let closingRun: number | null = null

  /**
   * The naming's own pace — DELIBERATELY not the typewriter's 11 ms.
   *
   * A callsign is six characters. At the reading pace `components/typewriter.ts`
   * sets for prose it lands in 66 ms, which is not a reveal — it is a repaint
   * with extra steps, and measured on the desk it read as the name simply
   * appearing. The handover types at prose pace because it IS prose and the
   * operator is reading it; this is a single short token doing one job, which is
   * to be WATCHED arriving on a page that has been blank since 21:04. So it gets
   * a pace of its own rather than a share of one tuned for sentences.
   */
  const CALLSIGN_MS_PER_CHAR = 80

  /**
   * The beat between the agent being NAMED and the file being chopped shut
   * (x7, 민서 08-09). Long enough for the finished name to register as its own
   * event; short enough that the press still feels like one gesture.
   */
  const NAMED_TO_CHOP_MS = 700

  /** The operator asked for no motion, or the determinism gate is closed. */
  const motionless = (): boolean =>
    animationsFrozen() || window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // U3 — the merged control's own turn state, ported from `windows/tally.ts`.
  let closed = false
  let settled = false
  let counted = false
  let lapsed = false
  let spent = false
  let scoreSeen = false
  let hold: ReturnType<typeof setTimeout> | null = null
  let countTimer: ReturnType<typeof setTimeout> | null = null
  /**
   * The control's note while the day is closed — blank across the hold since
   * x6b, then FILED_NOTE/LAPSED_TAIL/SPENT on the release. `deployView` cannot
   * derive it purely (design #5), so
   * `sync()` re-applies it on every render instead of relying on caller order.
   * `sync()` runs from more triggers than the settle wiring alone (the
   * identity fetch's own `.then()` below is one), and any of them landing
   * AFTER a direct `noteEl.textContent` write would silently blank it again.
   */
  let settleNote = ''

  /**
   * The document's number, as EVERY page prints it.
   *
   * C1 — one document across every agent, so the number names the document and
   * not the run. The run used to be its last segment.
   *
   * x7 — a function, not the one `.fh-doc` element it used to be. See
   * `buildHead` below for why the head had to stop being a single node, and why
   * this is the one place its text is composed: two heads printing two
   * different numbers is the failure a second literal would buy.
   */
  const docText = (): string => `${DOC_CAPTION}${PORTAL.portalCode}/AF/${slug}`

  const board = createSlotBoard({
    emit: (op) => driver.send(op).ok,
    resolve: (blockId) => sentences.get(blockId) ?? null,
    onChange: () => {
      // R5 — the stamp is dated once, at the moment the file closed.
      if (board.isLocked() && committedRun === null) {
        committedRun = run
        committedAt = opensAt
        // H3 — …and it is stamped for whoever the file was being built for. A
        // press made after 21:04 commits the INCOMING agent's file, and the
        // chop has to name them and not the agent whose day has just ended.
        committedIncoming = incoming
      }
      if (!board.isLocked()) {
        committedRun = null
        committedAt = null
        committedIncoming = false
      }
      sync()
    },
  })

  let currentView = deployView({ slots: board.cells(), deployed: false, run, at: opensAt })

  /* ══ x10 — THE CUE ON THE SECOND PAGE'S DEPLOY ═══════════════════════════ */

  /**
   * Whether the MOUNTED page is the live page AND the live page is page 2 of 2
   * — the only geometry the blink is allowed to run in (민서, 08-10).
   *
   * Written by `turn()` alone, because `turn()` is the only place both numbers
   * exist: `viewing` after its clamp, and `pages().length`. `deployView` is NOT
   * asked (D1 keeps it pure — a view model that took a page index would be
   * learning the document's shape to decide a colour), and the stylesheet cannot
   * ask either. So the condition is computed where it is known and handed on as
   * a class.
   *
   * "The second page" is a real condition and not a shorthand for "the live
   * page". The live page is always the last one, but its INDEX is 1 only during
   * the first sitting — `filed` is empty, so `pages()` returns [cover, live].
   * The moment a run files a record the live page becomes index 2, then 3, and
   * the cue is over for the rest of the session even without the latch below.
   * That is the requirement as asked, and it is also the honest reading of it:
   * the cue exists because the FIRST press is the one nothing on the desk tells
   * the operator to make (see the note in `styles/win-agent-file.css`). By day
   * two they have made it once, and a control that kept blinking after that
   * would be a desk nagging someone who has already learned the gesture.
   */
  let liveOnSecondPage = false

  /**
   * The cue is SPENT — a latch, and it never re-arms this session.
   *
   * Set by the press itself (see `buildDeployZone`'s handler below), before the
   * 배치 확인 plate goes up and regardless of how that question is answered.
   * 민서, 08-10, asked what "if toggled" leaves behind and the answer settles
   * both halves: *"Press stops it, but I don't know if it stays red, because it
   * brings up an alert screen. Follow what color it becomes normally."* So the
   * press ends the blink and nothing here paints anything afterwards — the
   * control goes back to wearing whatever state it would have worn, which after
   * a committed file is `.btn-deploy:disabled`'s `opacity:.3`.
   *
   * A LATCH AND NOT A RECOMPUTATION, and that is the load-bearing word. Every
   * other condition in `paintCue` is derived state that can come back: the plate
   * is answered 취소, the file is never committed, the mode is still `deploy`,
   * the page is still page 2 of 2 — and a cue recomputed from those facts would
   * resume the instant the question came down, which is a button that argues with
   * a press it already received. The press spent the cue. It was one gesture's
   * worth of attention and it has been paid.
   */
  let cueSpent = false

  /**
   * Paints the cue, and it is the ONE writer of that class.
   *
   * Called from both renderers (`turn()` and `sync()`) rather than from one,
   * because neither knows everything on its own and they run in either order:
   * `turn()` owns the page geometry, `sync()` is what re-renders the control's
   * mode and `disabled`, and each fires from triggers the other does not (see
   * `sync()`'s own note on how many callers it has).
   *
   * `mode === 'deploy'` is what keeps it off a day in flight — `settling`,
   * `next` and `spent` are the three other faces the merged control wears
   * (`components/deploy-button.ts`), and a blink on any of them would be the desk
   * inviting a press it is about to refuse. `!disabled` is not redundant with it:
   * inside `deploy` the control is disabled the moment the file is committed, and
   * `sendNewRun()` writes `disabled` directly without going through a render at
   * all. The rule is simply "never blink a button that cannot be pressed", and it
   * is cheaper to read the attribute than to re-derive the reasons for it.
   *
   * It reads `deployBtn`, which is `const` and declared BELOW this function — safe
   * because both renderers only run once the control exists (every caller of
   * `turn()` and `sync()` is a listener, a subscription or the final `sync()` at
   * the foot of `mount`, all of them after the zone is built). Written as a
   * function rather than inlined into the two renderers for that reason as much as
   * for brevity: one condition, one writer, and no second copy of it to drift.
   */
  function paintCue(): void {
    const cued = liveOnSecondPage && !cueSpent && currentView.mode === 'deploy' && !deployBtn.disabled
    deployBtn.classList.toggle('is-cued', cued)
  }

  function sync(): void {
    // x7 — the head is on every page now, so the doc number is repainted on
    // whichever page is MOUNTED rather than written into one long-lived
    // element. It has to be repainted here and not left to `turn()`: `sync()`
    // runs from triggers `turn()` does not (the board's own `onChange`, the
    // store subscription, `sendNewRun`), and the pack identity that fills the
    // slug in resolves asynchronously (`fetchScenarioIdentity` at the foot of
    // this file) — a page mounted with an unresolved slug would keep printing
    // `…/AF/` for ever if only a rebuild could correct it.
    const doc = sheet.querySelector<HTMLElement>('.fh-doc')
    if (doc !== null) doc.textContent = docText()
    const view = deployView({
      slots: board.cells(),
      deployed: board.isLocked(),
      run: committedRun ?? run,
      incoming: committedRun === null ? incoming : committedIncoming,
      at: committedAt ?? opensAt,
      closed,
      releasable: settled,
      spent,
      nextAt: opensAt,
    })
    currentView = view
    zone.render(view)
    stamp.render(view)
    // Applied AFTER `zone.render()`, every time: `deployView`'s own note is
    // blank once the day is closed, so this is what actually carries the
    // settle text, immune to how many other things call `sync()` meanwhile.
    if (closed) noteEl.textContent = settleNote
    // x10 — …and after it for the same reason: `zone.render()` is what sets the
    // control's `disabled`, and the cue reads that.
    paintCue()
  }

  /**
   * W4 — the press IS the start.
   *
   * The topbar's ×1 / ×4 / pause left with this unit: a day is not a recording
   * the operator scrubs, it is something they commit a file to and then watch.
   * So the one thing that sets the clock going is a committed file, and 21:04
   * is the one thing that stops it (`driver/clock.ts` halts at `end`). The
   * desk boots held at 0 — ECHO-1 does not go in until the operator says so.
   */
  function startDay(): void {
    driver.clock.setRate(1)
  }

  /**
   * What the press does once it has been confirmed.
   *
   * Split out of the handler below so the confirmation can sit in front of it
   * without the two commit paths drifting apart. `mode` is the one captured at
   * press time, never re-read: the plate holds the desk `inert` while it is up,
   * so nothing can move the control under the question it is asking.
   */
  function commitFile(mode: DeployMode): void {
    // THE CLOCK GOES FIRST, and it is not a formality.
    //
    // The driver holds the run's own stream until this very `deploy` reaches it
    // (`driver/run-loop.ts`, `driver/live/adapter.ts` — the BUILD hold), so the
    // op below is what releases the day's opening minute. Released onto a desk
    // whose clock is still at 0, that batch lands whole and instantly: the feed
    // bypasses its reveal queue whenever the sim is paused (`run-feed.ts`,
    // `receive`), so the press would slap four lines onto the fanfold in one
    // frame. Starting the clock first puts them through the reveal at reading
    // pace, which is the way every other minute of the day arrives.
    //
    // Nothing can escape in the gap: a running clock releases nothing while the
    // hold is on, and the hold only comes off on the op.
    if (mode === 'next') {
      // H3 — the press plays out in order: the agent is NAMED, then the chop
      // lands on the file, then the day starts. The page has been blank since
      // the settle and this is the moment it gets an occupant, so the naming
      // goes first; a chop on an unnamed file would be a receipt for nobody.
      //
      // W4 — ONE press, TWO ops, and the order is load-bearing. `deploy` must
      // reach the CLOSING run's membrane, because that is what the live
      // adapter harvests into `carried` (`live/adapter.ts` `closingState()`);
      // sent after `new_run` it would name the new day and the file the
      // operator just built would never carry. `board.deploy()` is also the
      // only module allowed to mint the op literal.
      typeCallsign(() => {
        // x7 — A BEAT BETWEEN THE NAMING AND THE CHOP (민서, 08-09).
        //
        // The name finished typing and the stamp landed in the same frame, so
        // the two read as one event and the naming — the thing the operator has
        // been waiting the whole hold for — was over before it registered. The
        // pause lets the filled-in name be seen on its own page before the file
        // is closed over it. Order of operations, not decoration: 파견 완료 is a
        // receipt for a file made out to somebody, so the somebody goes first.
        //
        // `setTimeout` and not the animation pump, for the reason this file has
        // now recorded twice: at this moment the day is over and the driver's
        // clock is neither running nor ended, so a pump-driven continuation
        // never fires and the press silently does nothing.
        window.setTimeout(() => {
          board.deploy()
          // …and the clock starts before the op, still. The adapter bypasses
          // the feed's reveal queue whenever the sim is paused, so releasing
          // the opening minute against a stopped clock slaps it onto the
          // fanfold in one frame. Nothing escapes in the gap: a running clock
          // releases nothing while the hold is on, and the hold only comes off
          // on the op.
          startDay()
          sendNewRun()
        }, NAMED_TO_CHOP_MS)
      })
      return
    }
    startDay()
    board.deploy()
    // H3 — the press records NOTHING any more. A page is a sitting that is
    // OVER, and the two writes that used to happen here and on the next `meta`
    // both ran a press too late: the record of what ECHO-1 flew appeared only
    // once ECHO-2's day had opened, so between 21:04 and the press the desk
    // held no page for the day it had just played and headed the file the
    // operator was mining into with the callsign of the agent who had already
    // come home. Both are now written where they are true — the close (see the
    // `'tally'` branch below).
  }

  const zone = buildDeployZone(() => {
    // x10 — THE PRESS SPENDS THE CUE, and it spends it HERE: on the press, not on
    // the commit. What follows this line is a question (배치 확인) and the answer
    // may be 취소, but the blink was asking for a press and it got one — resuming
    // it behind the plate, or bringing it back when the plate comes down, would
    // both be the desk repeating a request the operator has already answered.
    // Painted in the same tick, so the cue is off before the plate is up.
    //
    // Unconditional, above the mode gate below: a disabled button raises no click
    // at all, so every press that reaches this line is one the control was
    // offering — and the cue only ever runs on the one that is.
    cueSpent = true
    paintCue()
    const mode = currentView.mode
    // 'settling' / 'spent': the control is disabled — a click cannot land.
    if (mode !== 'deploy' && mode !== 'next') return
    // x2 — the press asks first, and it asks on BOTH committing modes. The
    // control's main label is `DEPLOY` in every one of them (W4 retired the
    // NEW RUN label, not the op), so "the activated DEPLOY" is this press
    // whichever day it falls on. Gating `deploy` alone would have put the
    // question in front of ECHO-1 and nobody after — from day 2 the commit
    // arrives in `next` mode, and that is the press that carries a file the
    // operator has actually revised.
    // x7 — the plate names NO agent, so `onDesk()` no longer reaches it.
    //
    // x5 had it name the one it was about to send, and H3 pointed that at the
    // INCOMING agent so the question and the page could not name two different
    // ones. Both were right about the risk and it is simply gone: the page is
    // blank until the press names it, so on the first press there was no name
    // to agree with. The question asks whether the HANDOVER is finished; the
    // file is what says who carries it.
    void openConfirm(must('#app'), deployCopy()).then((confirmed) => {
      if (confirmed) commitFile(mode)
    })
  })
  const stamp = buildDeployStamp()
  // Direct handles onto the control's own note and button, exactly as
  // `windows/tally.ts` once owned its wait line and new-run button outright —
  // the settle text below is written straight to the DOM, not through
  // `deployView` (design #5: the note is the one thing it cannot derive purely).
  const noteEl = zone.root.querySelector<HTMLElement>('#deployState')!
  const deployBtn = zone.root.querySelector<HTMLButtonElement>('#btnDeploy')!
  // C1 — the file is a document with pages, and exactly one page is mounted.
  // Page 0 is the cover: the document's own number and title, then everything
  // true of every agent. Page 1 is the agent on the desk, and it is the last
  // page, which is where the DEPLOY control lives — the last page is the agent
  // who has not gone out yet. U5.3 appends a page per agent after this one; the
  // only thing this unit owes it is that `pages` is a list.
  /**
   * A FRESH file head — the document's number, then the form's own name.
   *
   * x7 — a builder, and that is the whole point of it. The head was ONE element
   * built once in this closure and appended to the cover, and a node has one
   * parent: appending it to the filed pages and the agent's page as well would
   * have MOVED it each time, so the last page `pages()` happened to build would
   * take the head and every page before it would silently lose the one it had
   * a moment ago. A document is headed on every page, so every page builds its
   * own — and both this and `sync()`'s repaint read `docText()`, so no two of
   * them can print different numbers.
   */
  function buildHead(options: { skip?: boolean } = {}): HTMLElement {
    const head = el('div', 'file-head')
    const left = el('div', 'fh-left')
    left.append(el('div', 'fh-doc', docText()), el('div', 'fh-title', FILE_TITLE))
    head.append(left)
    // x7 — 건너뛰기 rides IN the head, in its right-hand corner (민서, 08-09).
    //
    // It was a block of its own between the head and the dossier, and the head
    // is the only thing on this page that does not move while the cover prints.
    // But a row of its own is a row that GOES: the control removes itself when
    // the reveal lands, its block collapsed, and the whole document jumped up a
    // line at the exact moment the reader reached the end of it.
    //
    // Inside the head it costs no row at all. `.file-head` is already a
    // `space-between` flex with `align-items:flex-end`, so the button lands
    // opposite 문서번호 · 현장 요원 운용 파일 and sits on the same baseline band;
    // when it goes, the head keeps its height because `.fh-left` — the taller
    // child — is what sets it. Nothing below it moves by a pixel.
    if (options.skip === true) head.append(buildCoverSkip())
    return head
  }

  const sheet = el('div', 'file-sheet')
  // Each leaf keeps `pg-turn` — that is the skin both share and what the sheet
  // paints — and gains a name of its own, because DIRECTION is not a thing
  // `disabled` can be read for. Both leaves are `pg-turn`, so the only way to
  // tell them apart used to be which one was disabled, and that inverts as the
  // reader moves: on the cover it is ‹ that is out, on the last page it is ›.
  // Anything pointing at "the next leaf" from outside this window (the tutorial
  // does) would therefore have pointed at ‹ half the time.
  const pgPrev = button('pg-turn pg-prev', '이전 장', '‹')
  const pgNext = button('pg-turn pg-next', '다음 장', '›')
  const pgCount = el('span', 'pg-count')
  const nav = el('div', 'pg-nav')
  nav.append(pgPrev, pgCount, pgNext)

  let viewing = 0

  /* ══ x10 — THE CUE ON THE PAGE TURN ══════════════════════════════════════ */

  /**
   * How long the desk stays quiet after the cover is readable before it points at
   * the way out (민서, 08-10): *"After the cover typing is finished, wait 1 second.
   * If the user does not click the next page button during that 1 second, blink a
   * transparent box with a red borderline around the next page button."*
   *
   * The wait is the design and not a debounce. An operator who reaches for `›`
   * the moment they finish reading never sees the cue at all, which is the desk
   * letting them act first; the second is what tells the two apart. It is
   * deliberately the same figure as the blink's own cycle (`pgCue`,
   * `styles/win-agent-file.css`) because 민서 gave both as one second in one
   * breath, but they are not the same number in the same sense — this one is a
   * silence, that one is a rate — so it is declared here and the cycle is declared
   * in the sheet, and neither is derived from the other.
   */
  const PG_CUE_ARM_MS = 1000

  /**
   * The wait is over: the cover has been readable for `PG_CUE_ARM_MS` and nobody
   * turned the page. One-way — see `armPgCue` for why nothing disarms it.
   */
  let pgCueArmed = false

  /**
   * The turn is SPENT — a latch, and it never re-arms this session.
   *
   * ITS OWN LATCH, not a second reader of `cueSpent`. The two cues answer two
   * different gestures and are spent by two different presses: `cueSpent` is spent
   * by DEPLOY, this by `›`. Sharing one flag would mean the DEPLOY press retired a
   * hint for a control it is not on, and — the direction that actually bites — the
   * page turn would retire the DEPLOY cue that the turn is what mounts. The cue on
   * the arrow exists precisely to produce that press; if it also cancelled the next
   * one, following the first hint would take the second away.
   *
   * Set by the press itself, unconditionally, exactly as `cueSpent` is: a disabled
   * button raises no click, so every press that reaches the handler is one the arrow
   * was offering, and the cue only ever runs on an arrow that is.
   */
  let pgCueSpent = false

  /** The pending 1 s wait, or `null`. Cleared on entry, like `coverTimer`. */
  let pgCueTimer: ReturnType<typeof setTimeout> | null = null

  /**
   * Starts the 1 s wait — the ONE place the cue is armed.
   *
   * TWO CALLERS AND THEY ARE THE TWO WAYS THE COVER BECOMES READABLE: `landCover()`
   * (the reveal ran to its last character, or 건너뛰기 landed it), and
   * `mountCover()` (the cover arrived whole with nothing to land).
   *
   * `viewing !== 0` IS THE GUARD THAT MATTERS, and it exists for `landCover`'s
   * THIRD caller. `turn()` lands the reveal whenever any page other than the cover
   * is mounted — that is the whole of "turning away and back shows it whole" — and
   * that call must not arm anything: the operator who has turned the page has
   * already done the thing this cue would be asking for, so hinting at `›` there
   * would be the desk pointing at a gesture it just watched. `turn()` assigns
   * `viewing = clamped` before it reaches that branch, so reading `viewing` here
   * answers it without `landCover` needing a parameter or the callers needing to
   * agree on one. The cover is always page 0 (`pages()` builds it first), so
   * `viewing === 0` is exactly "the cover is the mounted page".
   *
   * `!coverDone` keeps it off a reveal that is still printing. Both callers set or
   * check that first, so this is belt-and-braces — kept because it makes "the cue
   * cannot run over the typing" a property readable at this one site rather than
   * one traced through two callers.
   *
   * `motionless()` is NOT consulted, and that is a decision rather than an
   * omission (민서, 08-10 — the intent is "once the cover is readable, point at the
   * way out"). Under `prefers-reduced-motion` `mountCover` sets `coverDone` with no
   * typing at all, so the cover is readable the instant it is mounted, and that is
   * the operator who most needs the mark: they got no reveal, no 건너뛰기, no beat
   * of motion to tell them the document had finished — just a page of prose and no
   * indication that there is anything after it. The BLINK degrades to a static red
   * box under the same media query (`@keyframes pgCue` ends at `opacity:1`), so
   * what they get is a still mark and not a flashing one, which is the honest
   * reading of both requests at once. It arms in the e2e lane too, where
   * `motionless()` is the determinism gate — harmless, because `harness.ts`'s
   * `boot()` clicks `›` at once and spends the latch a second before the wait ends.
   *
   * NOTHING DISARMS IT. If the operator leaves the cover inside the second the
   * timer still fires and `pgCueArmed` still latches — `paintPgCue` is the
   * authority on whether that means anything, and it answers no while another page
   * is mounted. One writer decides; the arm only says the wait is over.
   */
  function armPgCue(): void {
    if (!coverDone || viewing !== 0 || pgCueArmed || pgCueSpent || pgCueTimer !== null) return
    pgCueTimer = setTimeout(() => {
      pgCueTimer = null
      pgCueArmed = true
      paintPgCue()
    }, PG_CUE_ARM_MS)
  }

  /**
   * Paints the page-turn cue, and it is the ONE writer of that class.
   *
   * Same discipline as `paintCue` above and for the same reason: the answer is a
   * conjunction of facts that change from different places, so it is computed in
   * one function called from each of them rather than added and removed at every
   * trigger. Three callers — the wait's own timer (`pgCueArmed` flips), the `›`
   * press (`pgCueSpent` flips), and `turn()`'s tail (the mounted page and the
   * arrow's `disabled` both change there).
   *
   * `!pgNext.disabled` is the same rule the DEPLOY cue keeps — never blink a
   * control that cannot be pressed. It cannot fire today (`pages()` always returns
   * at least the cover and the agent's page, so the cover is never the last one and
   * `›` is never out on it), and it is asserted rather than reasoned about because
   * a document that ever had one page would otherwise hint at a dead arrow.
   *
   * Reads `pgNext`, declared above; safe for the reason `paintCue`'s note gives —
   * every caller is a listener or a timer, all of them after the nav is built.
   */
  function paintPgCue(): void {
    const cued = pgCueArmed && !pgCueSpent && coverDone && viewing === 0 && !pgNext.disabled
    pgNext.classList.toggle('is-cued', cued)
  }

  /**
   * A finished sitting's file — what went out with them, as ONE PARAGRAPH.
   *
   * x5. U5.3 built this as a stack of bordered cells, each with its slot number
   * down the left. That was the four-box reading of the handover, kept alive on
   * the one page the operator reads a shift's work back from — and x4 had
   * already taken it off the live page for being exactly that (see the note in
   * `components/slot-board.ts`). The numbers are gone with the boxes: a slot
   * index is an address for putting something IN, and nothing goes into a page
   * whose run is over. What a past agent was handed is a paragraph, so it reads
   * as one.
   *
   * These are still NOT slots: no `.slot`, no `.slot-pin`, and above all no
   * `data-block-id`, which is what `shell/thread-layer.ts:28` selects slot
   * anchors by — a past page is invisible to the thread layer by construction,
   * so do not add the attribute for symmetry. `blockCardModel` is still what
   * resolves the text, because F1's fallback for an unresolvable id is already
   * its job; only the card's markup is dropped.
   */
  function filedHost(ids: readonly string[]): HTMLElement {
    const host = el('div', 'filed-file')
    if (ids.length === 0) {
      host.append(el('div', 'filed-empty', FILED_EMPTY))
      return host
    }
    const para = el('p', 'filed-para')
    // Built element by element the sentences would abut with no separator, the
    // same whitespace-text-node problem `components/dossier.ts` documents.
    for (const [index, id] of ids.entries()) {
      if (index > 0) para.append(document.createTextNode(' '))
      para.append(el('span', 'filed-s', blockCardModel(id, sentences.get(id) ?? null).text))
    }
    host.append(para)
    return host
  }

  /* ══ x7 — THE COVER TYPES ITSELF OUT ═══════════════════════════════════ */

  /**
   * THE COVER IS READ, NOT SKIMMED (민서, 08-09).
   *
   * The cover carries the agent's whole posting order and it is the only page
   * that explains the loop the operator is standing in — and it arrived WHOLE,
   * a block of prose the eye slides off in the second before the hand reaches
   * the page turn. Printed a character at a time it is paced like something
   * being dictated down a line: short beat between words, longer between lines,
   * and the operator reads it because for that stretch there is nothing else on
   * the page to do.
   *
   * ONCE PER SESSION, on first arrival at the cover (민서's ruling). Turning
   * away and back shows it whole and instant — `turn()` lands it the moment
   * another page is mounted, because a reveal that resumed mid-sentence on the
   * way back would be a document that had un-printed itself. A new day or a new
   * agent does not re-type it either: the cover is the same page all sitting.
   *
   * The title block never types. 문서번호 and 현장 요원 운용 파일 are printed on
   * the form before anyone fills it in, so they are simply there — `collectCover`
   * walks the dossier alone and never the head.
   *
   * NOTHING WAITS ON IT. The DEPLOY control is on the LAST page, so a reveal
   * running on page 1 gates no op the operator could want. That is the licence
   * `typeCallsign` below does NOT have (it precedes an op, and its note is the
   * fuller telling of why that matters).
   */

  /**
   * The cover's own pace — DELIBERATELY not `components/typewriter.ts`'s.
   *
   * The shared arithmetic is the desk's READING pace (`MS_PER_CHAR` 11, one
   * `MS_BETWEEN` pause per sentence) and it is tuned for a feed the operator is
   * watching arrive at the speed a radio delivers it. The cover is the opposite
   * job — a document the operator is being made to slow down over — and it
   * wants a beat the shared model has no term for at all: a short one between
   * WORDS. So the numbers are local, exactly as `CALLSIGN_MS_PER_CHAR` above is
   * local and for the same kind of reason. This is not a second typewriter on
   * the desk: nothing else on the cover types, and the two surfaces never share
   * a screen.
   *
   * It sums to 18.7 s for the whole cover — 18,696 ms of scheduled waits, over
   * the 308 characters (67 of them spaces) that `components/dossier.ts`'s
   * `coverModel()` prints as 12 text runs across 10 rows. That is deliberate and
   * it is also exactly why 건너뛰기 exists.
   *
   * x10 — THE FIGURE IS RECOMPUTED, because it had gone stale and a stale total
   * is worse than none. This paragraph said "roughly a quarter-minute", which
   * was true of the rates it was written against (11.6 s at 22/45) and stopped
   * being true the moment x7 doubled them — at 45/130 the same page took 22.5 s
   * and the comment still claimed fifteen. So the rule this leaves behind: a
   * comment that states a TOTAL is a function of the constants under it and has
   * to be recomputed with them, or it becomes a number the next reader trusts
   * and measures nothing against.
   */
  // SLOWED (x7, 민서 08-09, measured on the built page): 22 → 45 per character
  // and 45 → 130 per word. At 22 ms a clause fanned out faster than it could be
  // read — the eye arrived after the sentence had, which defeats the whole
  // reason the cover types at all. The between-lines pause was right at 340 and
  // is untouched; what was wrong was the rate WITHIN a line, so that is the only
  // thing that moved. The word pause had to move with it: at 45 it was barely
  // two characters' worth and did not read as a pause once the characters
  // themselves cost 45.
  //
  // …AND EASED BACK ~20% (x10, 민서 08-10): 45 → 36 per character, 130 → 104 per
  // word. Two adjustments to the same two numbers in two days, so the reading is
  // written down rather than left to be inferred from the arithmetic: 22 was too
  // fast and 45 OVERSHOT. 민서's words for the current pace are "just a little
  // bit slow" — not wrong, not unreadable, a beat longer than the reading it is
  // pacing, which is what an overcorrection feels like from the other side. x7
  // fixed a real failure and went past the middle doing it; 36 is the middle it
  // was reaching for (22 → 45 → 36), and it keeps the thing x7 bought, because a
  // clause still lands behind the eye rather than ahead of it.
  //
  // The two rates moved TOGETHER and by the same fraction, for x7's own reason
  // above: the word pause only reads as a pause while it is worth about three
  // characters of the rate beside it, so 130 left against 36 would have started
  // to read as a stop between 어절 rather than a breath. 104 is 130 × 0.8, which
  // holds the ratio x7 chose (2.9×) rather than inventing a new one.
  //
  // COVER_MS_LINE and COVER_LEAD_MS are deliberately untouched. The 340 between
  // lines was ruled correct at x7 and nothing has happened to it since; the 420
  // lead is not a rate at all but staging — it is what makes the page be SEEN
  // blank before the first character lands, and shortening it would take the
  // reveal's opening away without making the reveal faster to read.
  const COVER_MS_PER_CHAR = 36
  const COVER_MS_WORD = 104
  const COVER_MS_LINE = 340
  /** A beat before the first character, so the page is seen blank first. */
  const COVER_LEAD_MS = 420
  /** How often the reveal re-asks whether the boot sweep has let go. */
  const COVER_SWEEP_STEP = 120

  /** The control that lands the reveal, and the name it announces itself by. */
  const COVER_SKIP = '건너뛰기'
  const COVER_SKIP_LABEL = '문서 표시를 건너뛰고 전문을 인쇄합니다'

  /** One LINE of the cover, and the text node it is printed into. */
  interface CoverLine {
    node: Text
    text: string
    /**
     * Whether a ROW ends here — the only place the long between-lines pause is
     * owed (x7, 08-09).
     *
     * A row is not a text node. `.sect-line` holds one now, but the moment any
     * of it carries inline markup — `<b>ECHO</b>` in 사건 개요 — the same
     * sentence arrives as three nodes, and a reveal that paused at every node
     * boundary would stop dead twice in the middle of a sentence. So the pause
     * is keyed to the ROW the node sits in, not to the node.
     */
    breaks: boolean
  }

  /** The block a run of text belongs to — one ROW of the printed cover. */
  const COVER_ROW = '.sect-line, .sect-note, .sect-hd h4, .sect-rows dt, .sect-rows dd'

  /** The mounted cover's lines, in reading order — empty on every other page. */
  let coverLines: CoverLine[] = []
  /** Where the reveal has got to: the line being printed, and how much of it. */
  let coverLine = 0
  let coverChars = 0
  /** Spent — the cover prints whole from here on, this session. */
  let coverDone = false
  let coverTimer: ReturnType<typeof setTimeout> | null = null

  /**
   * The cover's lines, in reading order: every text node under the dossier,
   * split again on any authored `\n`.
   *
   * Read off the BUILT PAGE rather than off `coverModel()`, so this window
   * holds no copy of the sibling's copy and no assumption about its markup —
   * whatever `components/dossier.ts` prints (a title, its flag, a body line,
   * the red note) is a line here, and a rewrite of the cover changes nothing on
   * this side. The `\n` split is what keeps that true both ways: the cover's
   * clauses are one element per line, and a section ever written instead as one
   * body with newlines in it still gets its pause BETWEEN the clauses rather
   * than only at the end of the block.
   *
   * The whitespace-only nodes are skipped, not typed: they are the separators
   * `components/dossier.ts` writes between its elements (see `spaced` there),
   * they carry no reading, and blanking them would close the gaps the document
   * is spaced with.
   */
  function collectCover(page: HTMLElement): CoverLine[] {
    const dossier = page.querySelector<HTMLElement>('#dossier')
    if (dossier === null) return []
    const walker = document.createTreeWalker(dossier, NodeFilter.SHOW_TEXT)
    const texts: Text[] = []
    for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) {
      const value = node.nodeValue ?? ''
      if (value.trim().length === 0) continue
      // x7 — a `.sect-flag` skip stood here. The badges typed along with the
      // prose, so their text blanked while the bordered box stayed painted and
      // the cover showed empty rectangles in the right margin for the length of
      // the reveal (민서, screenshot 08-09). Excluding them fixed that; then the
      // badges themselves were removed outright, so there is nothing left to
      // exclude. Kept as a note because "the reveal must not blank form
      // furniture" is the rule, and the next thing printed beside a heading
      // will meet it again.
      texts.push(node as Text)
    }

    const found: CoverLine[] = []
    for (const [index, node] of texts.entries()) {
      // The row this run belongs to, and whether it is the LAST run in it —
      // the two facts the between-lines pause is owed to. A node with no row
      // ancestor stands alone and therefore ends its own row.
      const row = node.parentElement?.closest(COVER_ROW) ?? null
      const next = texts[index + 1] ?? null
      const nextRow = next?.parentElement?.closest(COVER_ROW) ?? null
      const lastInRow = row === null || nextRow !== row

      const parts = (node.nodeValue ?? '').split('\n')
      for (const [part, text] of parts.entries()) {
        const last = part === parts.length - 1
        // An authored `\n` always breaks; the final run of a row breaks because
        // the row does. Everything else is mid-sentence and pauses per word.
        found.push({ node, text: last ? text : `${text}\n`, breaks: last ? lastInRow : true })
      }
    }
    return found
  }

  /**
   * Prints the cover as far as the reveal has got — the ONE writer of it.
   *
   * Written per NODE rather than per line, because a line is not always a whole
   * node: `collectCover` may split one text node into several lines, and
   * assigning each of them separately would leave a node holding only its last
   * line. The value is composed and then assigned once.
   */
  function paintCover(): void {
    const value = new Map<Text, string>()
    for (const [index, line] of coverLines.entries()) {
      const shown =
        coverDone || index < coverLine
          ? line.text
          : index > coverLine
            ? ''
            : line.text.slice(0, coverChars)
      value.set(line.node, `${value.get(line.node) ?? ''}${shown}`)
    }
    for (const [node, text] of value) node.nodeValue = text
  }

  /**
   * Prints the rest of the cover at once and retires the control.
   *
   * Three callers, and they are the three ways a reveal ends: the 건너뛰기
   * press, the last character, and the operator turning off the cover (the
   * reveal is per session, so leaving the page spends it).
   *
   * The control is REMOVED rather than disabled, and not only because a dead
   * button is nothing to leave on a page: `tally.test.ts` (g) reads the FIRST
   * `disabled = true` in this file and requires it to be the one that closes
   * the DEPLOY control before `new_run` leaves, so a `disabled` written up here
   * would silently take that guard's meaning away.
   */
  function landCover(): void {
    if (coverTimer !== null) {
      clearTimeout(coverTimer)
      coverTimer = null
    }
    coverDone = true
    paintCover()
    sheet.querySelector<HTMLElement>('.cover-skip')?.remove()
    // x10 — the cover is readable, so the wait before the page-turn cue starts
    // here. Two of this function's three callers are the reveal ENDING on the
    // mounted cover; the third is `turn()` landing it on the way to another page,
    // and `armPgCue` declines that one itself by reading `viewing`. See its note.
    armPgCue()
  }

  /** One character — or, at the end of a line, the beat before the next one. */
  function stepCover(): void {
    coverTimer = null
    const line = coverLines[coverLine]
    if (line === undefined) {
      landCover()
      return
    }
    const printed = line.text[coverChars] ?? ''
    const typed = coverChars + 1
    let wait = COVER_MS_PER_CHAR
    if (typed >= line.text.length) {
      coverLine += 1
      coverChars = 0
      // x7 — the long pause is owed to a ROW's end, not a node's. A sentence
      // carrying inline markup is several nodes and must read as one line.
      if (line.breaks) wait = COVER_MS_LINE
    } else {
      coverChars = typed
      // A word ends where its space was just printed. 한국어 breaks by 어절 and
      // the spaces are where the reader's eye already stops, so this is the
      // pause the prose itself asks for rather than one imposed on it.
      if (printed === ' ') wait = COVER_MS_WORD
    }
    paintCover()
    if (coverLine >= coverLines.length) {
      landCover()
      return
    }
    coverTimer = setTimeout(stepCover, wait)
  }

  /**
   * Starts the reveal ON A TIMER — never on the driver's animation pump.
   *
   * `registerAnimation`/`tickAnimations` fire only while the driver's clock is
   * RUNNING or ENDED (`driver/fixture-driver.ts`), and at boot it is NEITHER:
   * W4 holds the day until the file is committed, so the clock sits at rate 0
   * from the first paint until DEPLOY. A cover riding that pump would never
   * receive a tick and would sit BLANK for the whole of the build phase — the
   * page the operator is meant to read before pressing anything, permanently
   * empty. It is the same trap that soft-locked the DEPLOY press this morning;
   * `typeCallsign` below carries the full telling and this is the second
   * surface it has now saved. `setTimeout` survives a stopped clock.
   *
   * It waits the boot sweep out first. `components/desktop-dressing.ts` holds
   * every window `visibility:hidden` until the door, the manual and the entry
   * animations are done with the screen, and a cover that typed itself behind
   * that curtain would be half over before anybody saw a character of it.
   */
  function startCover(): void {
    if (coverDone || coverTimer !== null || motionless()) return
    if (document.body.classList.contains('booting')) {
      // THE RETRY MUST RELEASE THE LATCH IT SET (x7, fixed 08-09).
      //
      // This armed `startCover` directly, and the guard above rejects a call
      // while `coverTimer` is non-null. So the retry fired, re-entered, found
      // its OWN timer id still stored, and returned — the reveal died after
      // exactly one attempt and the cover sat BLANK for the whole session. Not
      // "did not type": empty, because `paintCover()` had already printed zero
      // characters over it.
      //
      // The e2e suite could not see it. `boot()` presses 건너뛰기 before every
      // test, which lands the document whole, so every spec in the file was
      // reading a cover the reveal had never touched. It took opening the built
      // page in a browser. `stepCover` clears the latch on entry for this same
      // reason; the retry now does too.
      coverTimer = setTimeout(() => {
        coverTimer = null
        startCover()
      }, COVER_SWEEP_STEP)
      return
    }
    coverTimer = setTimeout(() => {
      coverTimer = null
      stepCover()
    }, COVER_LEAD_MS)
  }

  /**
   * Re-aims the reveal at the cover that is actually on the sheet.
   *
   * `turn()` rebuilds every page from scratch, so the nodes the reveal was
   * printing into are thrown away by the identity fetch's own `turn()`, by each
   * `meta`, and by every page turn. The reveal therefore keeps no DOM across a
   * build — it keeps a POSITION, and the freshly built cover is re-collected
   * and re-printed to that position here. Same discipline as `typeCallsign`,
   * which repaints through `turn` rather than holding on to a row.
   */
  function mountCover(page: HTMLElement): void {
    // The two contracts that are NOT skips, and the reason they are checked
    // here rather than at the press: an operator who asked for no motion, and
    // the e2e determinism gate, both get the document whole and never see a
    // character of it typed. `motionless()` answers for both.
    if (motionless()) coverDone = true
    coverLines = collectCover(page)
    paintCover()
    startCover()
    // x10 — the OTHER way the cover becomes readable, and the reason this call is
    // here as well as in `landCover`: on the motionless path `coverDone` is set two
    // lines up and `landCover` is never reached at all, so a cue armed only from
    // there would never arm for a reduced-motion operator — the one who has had no
    // reveal, no 건너뛰기 and no beat of motion to say the document is finished.
    // `armPgCue` is self-guarding (`coverDone`, `viewing`, the two latches, its own
    // pending timer), so calling it on every mount of the cover is idempotent.
    armPgCue()
  }

  /**
   * 건너뛰기 — the ONE gesture that lands the reveal.
   *
   * Only this press skips it. A click anywhere else on the page must not, or a
   * reader who clicks to raise the window loses the document they were reading
   * (민서). A real `<button>`, so it is a tab stop and answers Enter and Space
   * without a line of key handling: the desk's a11y census fails a div with a
   * click handler on it outright, and rightly.
   */
  function buildCoverSkip(): HTMLButtonElement {
    const node = button('cover-skip', COVER_SKIP_LABEL, COVER_SKIP)
    node.id = 'coverSkip'
    node.addEventListener('click', () => landCover())
    return node
  }

  /**
   * The document, in order: the cover, then a page per finished agent, then the
   * agent on the desk.
   *
   * U5.3 · H3 — a record is a sitting that is OVER, and `filed` holds nothing
   * else: the entry is written at 21:04 (the `'tally'` branch below) and the
   * live page moves on to the incoming agent in the same breath. So there is no
   * `flown >= run` filter to apply any more — the last day of an allotment
   * files no entry at all, because it has no successor to hand the page to, and
   * its own page stays live to the end of the sitting.
   */
  function pages(): HTMLElement[] {
    // x7 — EVERY page is headed. It is one document with a number on it, and a
    // reader who turned past the cover was holding unheaded sheets: no
    // 문서번호, no 현장 요원 운용 파일, nothing saying which file the page they
    // are reading belongs to. `buildHead()` is a builder for exactly this
    // reason — see its note on the node that a single head would have been.
    // …and the cover's head carries 건너뛰기 in its corner while there is
    // something to skip. In the head rather than under it, so that landing the
    // reveal costs no row and the document does not jump — see `buildHead`.
    const cover = el('div', 'file-page')
    cover.append(buildHead({ skip: !coverDone && !motionless() }))
    cover.append(buildDossier(coverModel(), board.root))

    const past: HTMLElement[] = []
    for (const flown of [...filed.keys()].sort((a, b) => a - b)) {
      const ids = filed.get(flown) ?? []
      const page = el('div', 'file-page')
      page.append(
        buildHead(),
        buildDossier(filedModel({ callsign: callsignOf(flown) }), filedHost(ids)),
      )
      past.push(page)
    }

    const agent = el('div', 'file-page')
    agent.append(buildHead())
    agent.append(buildDossier(agentModel({ slotCap: SLOT_CAP, callsign: onDesk() }), board.root))
    agent.append(zone.root)

    return [cover, ...past, agent]
  }

  /** Mounts the page being viewed, and nothing else. */
  function turn(to?: 'last'): void {
    const built = pages()
    // Clamped with conditionals, never `Math.max`: `tally.test.ts` (f) bans
    // that call outright in this file so a driver-fed number (`run`,
    // `runs_left`, `carried`, `archive`) cannot be quietly clamped. A page
    // index is none of those, but the guard is a blanket source scan and it is
    // right to be — the cheap way to keep it honest is not to reach for the
    // call at all.
    const last = built.length - 1
    // U5.3 — a new sitting opens on its own page, which is always the last one.
    // Left alone, `viewing` would keep the index it had and the operator would
    // land on a page with no DEPLOY on it. Assigned, never `Math.max`-ed.
    if (to === 'last') viewing = last
    const clamped = viewing < 0 ? 0 : viewing > last ? last : viewing
    viewing = clamped
    // x10 — the cue's page condition, decided here because this is the only
    // place that holds both numbers. Two comparisons and no arithmetic, so the
    // `Math.max` ban (see above) is not even in reach: the mounted page is the
    // LAST one (which is where `zone.root` is appended — `pages()`), and the last
    // one is index 1, which is only true while no run has filed a record.
    liveOnSecondPage = clamped === 1 && clamped === last
    sheet.replaceChildren(built[clamped]!)
    // x7 — the reveal lives on the MOUNTED cover and nowhere else. Page 0 is
    // handed the freshly built one to go on printing into; every other page
    // lands it, which is the whole of "turning away and back shows it whole".
    // `coverLines` is cleared first so a timer still in flight cannot paint
    // into a cover that was thrown away with the last build.
    if (clamped === 0) {
      mountCover(built[clamped]!)
    } else {
      coverLines = []
      landCover()
    }
    // x1 — a turned page opens at its head. The sheet scrolls now (1.5× type in
    // a third-width column: `win-agent-file.css`), and `replaceChildren` leaves
    // the scroll offset where the last page left it, so turning onto a page
    // landed the reader halfway down a document they had not read yet.
    sheet.scrollTop = 0
    pgCount.textContent = `${clamped + 1} / ${built.length}`
    pgPrev.disabled = clamped === 0
    pgNext.disabled = clamped === built.length - 1
    // x10 — the page has moved, so the cue is re-asked. `turn()` runs from
    // triggers `sync()` does not (both page arrows, the identity fetch, every
    // `turn('last')`), which is why both renderers call it.
    paintCue()
    // …and the page-turn cue with it, for the two facts this function is the only
    // one to change: which page is mounted, and whether `›` is out on it (both
    // written a few lines up). `sync()` deliberately does NOT call this one — the
    // deploy zone's mode and `disabled` say nothing about the cover.
    paintPgCue()
  }

  pgPrev.addEventListener('click', () => {
    viewing -= 1
    turn()
  })
  pgNext.addEventListener('click', () => {
    // x10 — THE PRESS SPENDS THE CUE, permanently, for the session. The blink was
    // asking for exactly this gesture and it got it; bringing it back on any later
    // return to the cover would be the desk repeating a request it has an answer
    // to. Set before `turn()` so the single writer at that function's tail sees the
    // latch already down and takes the class off in the same frame as the turn.
    //
    // Unconditional, like the DEPLOY press's own latch: a disabled `›` raises no
    // click, so every press that lands here is one the arrow was offering.
    pgCueSpent = true
    viewing += 1
    turn()
  })

  host.append(stamp.root, sheet, nav)

  function dropHold(): void {
    if (hold === null) return
    clearTimeout(hold)
    hold = null
  }

  function armHold(): void {
    dropHold()
    hold = setTimeout(() => {
      hold = null
      lapsed = true
      settle()
    }, PACE.HOLD_CEIL)
  }

  function settle(): void {
    if (settled) return
    const release = settleRelease({ counted, filed: hasFiledReport(store.get()), lapsed })
    if (release === 'hold') return
    settled = true
    dropHold()
    // H3 — THE PAGE TURNS HERE, and this is the whole of the fix.
    //
    // The day is over AND it has finished reporting: the record is final and
    // the report is in, which is exactly what `settleRelease` above decides. So
    // the agent who flew it becomes a record — their page written with the file
    // they actually went out with — and the operator is handed the next agent's
    // page, blank, with the handover typing itself on (`board.revealHandover`).
    //
    // Blank is the point. The page is headed for an agent the run loop has not
    // named yet, and `onDesk()` answers `''` until the press names them, so the
    // desk never puts a callsign on a file it cannot yet promise to send. The
    // press types it (`sendNewRun`).
    //
    // `closingRun` is null on the last day of an allotment: no page is filed
    // and none is opened, because there is no agent after this one and a page
    // headed for someone who can never be sent is a promise the desk cannot
    // keep. That agent's own page simply stays live to the end of the sitting.
    if (closingRun !== null) {
      filed.set(closingRun, usedIds(board.cells()))
      closingRun = null
      incoming = true
      turn('last')
      // x10 (민서, 08-10) — and REPORTS holds the tear while this types. The
      // reveal is the operator being read their inheritance; a sentence torn out
      // of the record and seated into a file that is still arriving would land in
      // a paragraph the page has not finished drawing. The signal is the board's
      // own `isRevealing()`, read by `windows/reports.ts`'s `onMine` — nothing is
      // pushed from here, and nothing here waits on it either (the note above on
      // `typeCallsign` is why: the progression is never hostage to an animation).
      board.revealHandover()
    }
    const who = callsignOf(store.get().meta.run)
    if (release === 'filed') {
      settleNote = FILED_NOTE
      sync()
      announce(`${who}${SAY_FILED_TAIL}`)
    } else {
      // …and the lapse is SAID, above all: it is the release nothing else on
      // the desk echoes, and the one that hands back a degraded day.
      settleNote = `${who}${LAPSED_TAIL}`
      sync()
      announce(`${who}${SAY_LAPSED_TAIL}`)
    }
  }

  /**
   * H3 — the press names the agent, on the page it has been holding blank.
   *
   * `nextCallsignOf(run)` is safe HERE in a way it was not on the settle: the
   * operator has committed the file and the op is going out, so the agent this
   * types is the one being sent. It is document art either way (the pack
   * carries no callsign — D4), so no number of the authority's is derived; the
   * seam's own `meta` arrives moments later and `callsignOf(run)` takes over
   * with the identical string, which is why the row does not flicker across it.
   *
   * The row is already red — `.rd-code` is `--seal-2` on every page — so the
   * red the operator sees is the callsign's own ink arriving, not a highlight.
   */
  function typeCallsign(onDone: () => void): void {
    const full = nextCallsignOf(run)
    if (motionless()) {
      typedCallsign = full
      turn('last')
      onDone()
      return
    }
    // ON A TIMER, NOT ON THE ANIMATION PUMP — and this is the important line in
    // the function (08-09).
    //
    // It rode `registerAnimation` first, which was wrong in a way that only the
    // desk lane could show: that pump ticks only while the driver's clock is
    // RUNNING or ENDED (`driver/fixture-driver.ts`), and at the moment of this
    // press the day is over. In a played day the clock has ended and it ticks;
    // under `window.__shell.drain()` — which flushes the stream without ever
    // advancing the clock to the terminal minute — it does not, so the
    // continuation below never ran, `sendNewRun()` was never called, and the
    // desk sat in `tally` for ever. Eight `run-loop.spec.ts` tests, and a press
    // that silently does nothing is the worst failure this control has.
    //
    // The lesson generalises past the bug: THE PROGRESSION MAY NOT BE HOSTAGE TO
    // AN ANIMATION. A reveal is allowed to be skipped, slowed or frozen; the op
    // it precedes has to leave regardless. `setTimeout` is the guarantee — it
    // survives a stopped clock and it still fires in a hidden tab (throttled,
    // which only makes the naming slower, never lost). The handover's reveal can
    // ride the pump precisely because nothing waits on it.
    let chars = 0
    const step = (): void => {
      chars += 1
      typedCallsign = chars >= full.length ? full : full.slice(0, chars)
      // The dossier is rebuilt to repaint one row, exactly as every other
      // change to this page is painted — `turn` is the window's only renderer
      // and a second path into the sheet is how two of them drift apart.
      turn('last')
      if (chars < full.length) {
        window.setTimeout(step, CALLSIGN_MS_PER_CHAR)
        return
      }
      onDone()
    }
    window.setTimeout(step, CALLSIGN_MS_PER_CHAR)
  }

  function sendNewRun(): void {
    // Disabled BEFORE the op leaves: one activation is exactly one `new_run`,
    // and the way back in is the next run's `run_end` ([u7#c3]).
    deployBtn.disabled = true
    // …but a REFUSED op never comes back that way, and swallowing the response
    // would leave the control dead with no explanation. `send()`'s answer is
    // the only signal the client gets, so a refusal is rendered: the
    // allotment is spent, and the control says so.
    if (driver.send({ op: 'new_run' }).ok) return
    spent = true
    settleNote = SPENT
    sync()
    announce(SPENT)
  }

  // The day's turn: `store`'s `'tally'` phase means the day is closed,
  // awaiting NEW RUN. Ported from `windows/tally.ts`'s `store.subscribe`.
  store.subscribe((state: RunState) => {
    if (state.phase === 'tally' && !closed) {
      closed = true
      // H3 — THE PAGE TURNS HERE, and this is the whole of the fix.
      //
      // The day is over, so the agent who flew it is a record: their page is
      // written with the file they actually went out with, and the file the
      // operator gets back is the next agent's, opened on a page of their own
      // and already holding the handover — the board keeps its sentences
      // through the unlock below, which is exactly what the operator is meant
      // to revise. The press that follows commits it and turns nothing.
      //
      // `runsLeft` is the seam's own word for "this is the last day" (it is
      // `totalRuns - run_count`, so it reads 0 there and nowhere else — the
      // audio's ending cue hangs off the same field). On that day no page is
      // filed and none is opened: there is no agent after this one, and a page
      // headed for someone who can never be sent is a promise the desk cannot
      // keep. The last agent's own page simply stays live.
      // H3 (08-09, 민서) — the page does NOT turn here any more.
      //
      // It used to turn at 21:04, on the same event that closes the day. That
      // put the new page up while the terminal record was still counting itself
      // out beside it, so two surfaces were resolving at once and the operator
      // was handed a file to revise before the day they were revising had
      // finished reporting. The turn now waits for the settle — the record
      // final, the report in — which is `settle()` below. `closingRun` is what
      // carries the day's identity across that gap, because by then `run` may
      // already have moved on.
      closingRun = state.meta.runsLeft > 0 ? run : null
      // W4 — the close is what hands the file back. Until now the file stayed
      // locked until NEW RUN, so the day's report could not be mined into the
      // day it was written for; the operator had to open tomorrow before
      // reading today. The file opens at 21:04 and the next press closes it.
      board.unlock()
      settled = false
      counted = false
      lapsed = false
      spent = false
      scoreSeen = false
      armHold()
      // x6b — blank, not a wait line. See the note at the head of this file.
      settleNote = ''
      // H3 — …and the desk turns to it. The document grew a page a moment ago
      // and the DEPLOY control went with it, so a file left on the page it was
      // on would leave the operator holding a read-only record with nothing to
      // press. This is the jump the `meta` handler used to make on the press.
      if (incoming) turn('last')
      sync()
      // The stream's own close line lands in the SAME tick this fires
      // (`shell/announcer.ts`'s `run_end` handler) — a second write here would
      // replace it before anything reads it. `PACE.OPEN_DELAY` later the two
      // lines queue (R2 on the pre-U3 `windows/tally.ts:135`, ported).
      const who = callsignOf(store.get().meta.run)
      setTimeout(() => {
        if (!settled) announce(`${who}${SAY_HOLD_TAIL}`)
      }, PACE.OPEN_DELAY)
      return
    }
    if (state.phase !== 'tally' && closed) {
      closed = false
      settled = false
      counted = false
      lapsed = false
      spent = false
      scoreSeen = false
      settleNote = ''
      dropHold()
      if (countTimer !== null) {
        clearTimeout(countTimer)
        countTimer = null
      }
      sync()
      return
    }
    if (state.phase !== 'tally') return
    // `counted` is derived from wall-clock time since the `score` event, not
    // from a cross-window callback (C8) — design #4. REPORTS calls
    // `tally.run()` the instant it sees `score` (it owns no timer of its own
    // — inv 12's sibling rule), so `components/score-tally.ts`'s own cadence
    // sums to `PACE.TOTAL_MS − PACE.OPEN_DELAY` from that same tick (the
    // 900 ms `OPEN_DELAY` is already inside `settleMs`'s budget, just with
    // nothing left here to spend it waiting). This timer matches that sum.
    if (state.score !== null && !scoreSeen) {
      scoreSeen = true
      countTimer = setTimeout(() => {
        countTimer = null
        counted = true
        settle()
      }, PACE.TOTAL_MS - PACE.OPEN_DELAY)
    }
    // …and a report that lands after the count-up releases the settle it was
    // holding.
    settle()
  })

  driver.subscribe((event) => {
    if (event.type === 'report') {
      for (const sentence of [...event.facts, ...event.report_body]) {
        sentences.set(sentence.id, sentence)
      }
      board.render()
      return
    }
    if (event.type !== 'meta') return
    const changedRun = event.run !== run
    // U5.3 — the run the desk was showing until this event. Read BEFORE the
    // assignment below, and used only to tell the desk's FIRST meta apart from
    // a real change of sitting. It is a comparison, not a derivation: no number
    // here is computed from the authority's ([u7#c3]).
    const previous = run
    run = event.run
    // W4 — the unlock moved to the CLOSE (see the `'tally'` branch above): the
    // day's own report has to be minable into the file it was written for, and
    // that window is between 21:04 and the press. A new run therefore arrives
    // with the file already committed — it must stay locked, and only re-date
    // its stamp to the sitting it now serves.
    if (changedRun && board.isLocked()) {
      committedRun = event.run
      committedAt = opensAt
      // H3 — and the agent this stamp names is no longer an incoming one: the
      // run loop has just named them, so `run` alone says who they are. The
      // chop's text does not change across this line — that is the point, the
      // page and the stamp read the same before and after the press — only the
      // way it is derived does.
      committedIncoming = false
    }
    // H3 — the file that was the NEXT agent's is now the agent's. Cleared here
    // rather than where `closed` is (the `'tally'` branch's own reset above),
    // because that branch runs on the same `meta` and runs FIRST — `run` is
    // still the closing day's there, and clearing it a tick early would head
    // the live page with the agent who has already come home for exactly one
    // render.
    if (changedRun) incoming = false
    // H3 — and the typed name is spent with it. `onDesk()` reads `callsignOf`
    // once `incoming` is false, so this only matters for the NEXT close: a
    // blank page that opened holding the last press's string would show it for
    // one render before the reveal overwrote it.
    if (changedRun) typedCallsign = ''
    // M1 — §0's callsign is per sitting, so only a changed run re-prints the
    // dossier; an archive-only `meta` must not re-parent the live slot board.
    // U5.3 — …and a NEW sitting opens on its own page. The jump is conditional
    // because the desk's first meta is a changed run too (0 → 1), and C1 opens
    // the file on its COVER; an unconditional jump would open every boot on the
    // agent's page and take `e2e/agent-file.spec.ts`'s own `boot()` with it.
    if (changedRun) turn(previous > 0 ? 'last' : undefined)
    sync()
  })

  // D2 — identity is pack-fed, never a literal. The structure is already up;
  // this re-prints it with the two fields the pack owns. A pack the shell has
  // already read cannot fail here, and if it did the head simply stays unnamed.
  //
  // x6 — the clock band left with 임무's old body (a posting order does not
  // print the shift's hours), so what the cover reads from the pack now is the
  // doc number alone. `identity.end` is no longer used here; the topbar clock
  // is where the day's terminal time is printed.
  void fetchScenarioIdentity()
    .then((identity) => {
      slug = identity.slug
      opensAt = identity.start
      turn()
      sync()
    })
    .catch(() => undefined)

  // DEV/TEST only — see `shell/boot.ts`'s note on `window.__shell` (inv 11).
  if (import.meta.env.DEV) {
    window.__agentFile = {
      slots: () => board.cells(),
      place: (blockId, slot) => board.place(blockId, slot),
      clear: (slot) => board.clear(slot),
      deployed: () => board.isLocked(),
      index: (sentence) => {
        sentences.set(sentence.id, sentence)
        board.render()
      },
      pick: (blockId) => setPickedBlockId(blockId),
      phase: () => store.get().phase,
      meta: () => {
        const meta = store.get().meta
        return { run: meta.run, runs_left: meta.runsLeft, carried: [...meta.carried], archive: [...meta.archive] }
      },
    }
  }

  sync()
}

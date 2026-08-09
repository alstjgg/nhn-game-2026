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
        board.deploy()
        // …and the clock starts before the op, still. The adapter bypasses the
        // feed's reveal queue whenever the sim is paused, so releasing the
        // opening minute against a stopped clock slaps it onto the fanfold in
        // one frame. Nothing escapes in the gap: a running clock releases
        // nothing while the hold is on, and the hold only comes off on the op.
        startDay()
        sendNewRun()
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
    // x5 — the plate names the agent it is about to send out.
    // H3 — which is the agent the last page carries, and after 21:04 that is
    // the INCOMING one: the press in `next` mode commits the file the operator
    // has just built out of the day's report, and it flies with the agent who
    // has not gone out yet. `onDesk()` is the same string the page is headed
    // with, so the question and the page cannot name two different agents.
    void openConfirm(must('#app'), deployCopy(onDesk())).then((confirmed) => {
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
  function buildHead(): HTMLElement {
    const head = el('div', 'file-head')
    const left = el('div', 'fh-left')
    left.append(el('div', 'fh-doc', docText()), el('div', 'fh-title', FILE_TITLE))
    head.append(left)
    return head
  }

  const sheet = el('div', 'file-sheet')
  const pgPrev = button('pg-turn', '이전 장', '‹')
  const pgNext = button('pg-turn', '다음 장', '›')
  const pgCount = el('span', 'pg-count')
  const nav = el('div', 'pg-nav')
  nav.append(pgPrev, pgCount, pgNext)

  let viewing = 0

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
   * It sums to roughly a quarter-minute for the whole cover. That is deliberate
   * and it is also exactly why 건너뛰기 exists.
   */
  const COVER_MS_PER_CHAR = 22
  const COVER_MS_WORD = 45
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
  }

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
    const found: CoverLine[] = []
    for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) {
      const value = node.nodeValue ?? ''
      if (value.trim().length === 0) continue
      const parts = value.split('\n')
      for (const [index, part] of parts.entries()) {
        const last = index === parts.length - 1
        found.push({ node: node as Text, text: last ? part : `${part}\n` })
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
      wait = COVER_MS_LINE
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
      coverTimer = setTimeout(startCover, COVER_SWEEP_STEP)
      return
    }
    coverTimer = setTimeout(stepCover, COVER_LEAD_MS)
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
    const cover = el('div', 'file-page')
    cover.append(buildHead())
    // …and the skip goes ABOVE the text, not under it, for two reasons that
    // point the same way. It is where the reader's eye already is when the page
    // is still blank, so the way out is offered before the wait rather than at
    // the end of it — and, decisively, it is the only place on this page that
    // DOES NOT MOVE: the cover grows downward as it prints, so a control below
    // the text drifts under the cursor for the whole reveal, and a pointer
    // (or an e2e click, which waits for a stable box) would be chasing it.
    // It is on the page only while there is something to skip.
    if (!coverDone && !motionless()) cover.append(buildCoverSkip())
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
  }

  pgPrev.addEventListener('click', () => {
    viewing -= 1
    turn()
  })
  pgNext.addEventListener('click', () => {
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

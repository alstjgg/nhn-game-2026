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
import { button, el, must } from '../shell/dom.ts'
import { openConfirm } from '../shell/confirm.ts'
import { announce } from '../shell/announcer.ts'
import { fetchScenarioIdentity } from '../shell/pack.ts'
import { PORTAL } from '../shell/portal-identity.ts'
import { createRunState, hasFiledReport } from '../shell/run-state.ts'
import type { RunPhase, RunState } from '../shell/run-state.ts'
import { blockCardModel, buildBlockCard, pad2, setPickedBlockId } from '../components/block-card.ts'
import { agentModel, buildDossier, callsignOf, coverModel, filedModel } from '../components/dossier.ts'
import { SLOT_CAP, createSlotBoard, usedIds } from '../components/slot-board.ts'
import { buildDeployStamp, buildDeployZone, deployView } from '../components/deploy-button.ts'
import type { DeployMode } from '../components/deploy-button.ts'
import { PACE, settleRelease } from '../components/score-tally.ts'

/** The wait line, verbatim from `windows/tally.ts` — diegetic, never a spinner. */
const WAITING = '……보고서 정리 중'
/** The line the control settles on once the run's report is on the desk. */
const FILED_TAIL = ' 보고서가 부검 창에 도착했습니다'
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
  let band = ''
  let committedRun: number | null = null
  let committedAt: string | null = null

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
   * The control's note while the day is closed (WAITING/FILED_TAIL/
   * LAPSED_TAIL/SPENT) — `deployView` cannot derive it purely (design #5), so
   * `sync()` re-applies it on every render instead of relying on caller order.
   * `sync()` runs from more triggers than the settle wiring alone (the
   * identity fetch's own `.then()` below is one), and any of them landing
   * AFTER a direct `noteEl.textContent` write would silently blank it again.
   */
  let settleNote = ''

  const docLine = el('div', 'fh-doc')

  const board = createSlotBoard({
    emit: (op) => driver.send(op).ok,
    resolve: (blockId) => sentences.get(blockId) ?? null,
    onChange: () => {
      // R5 — the stamp is dated once, at the moment the file closed.
      if (board.isLocked() && committedRun === null) {
        committedRun = run
        committedAt = opensAt
      }
      if (!board.isLocked()) {
        committedRun = null
        committedAt = null
      }
      sync()
    },
  })

  let currentView = deployView({ slots: board.cells(), deployed: false, run, at: opensAt })

  function sync(): void {
    // C1 — one document across every agent, so the number names the document
    // and not the run. The run used to be its last segment.
    docLine.textContent = `${DOC_CAPTION}${PORTAL.portalCode}/AF/${slug}`
    const view = deployView({
      slots: board.cells(),
      deployed: board.isLocked(),
      run: committedRun ?? run,
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
    if (mode === 'next') {
      // W4 — ONE press, TWO ops, and the order is load-bearing. `deploy` must
      // reach the CLOSING run's membrane, because that is what the live
      // adapter harvests into `carried` (`live/adapter.ts` `closingState()`);
      // sent after `new_run` it would name the new day and the file the
      // operator just built would never carry. `board.deploy()` is also the
      // only module allowed to mint the op literal.
      board.deploy()
      sendNewRun()
      startDay()
      return
    }
    board.deploy()
    // U5.3 — write site 1: the OPENING commit, which belongs to the agent on
    // the desk right now. In practice this is ECHO-1's alone — after a
    // `new_run` the file arrives already committed and this mode never comes
    // round again — and without it the first sitting would never get a page,
    // which is the first comparison the operator would reach for.
    filed.set(run, usedIds(board.cells()))
    startDay()
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
    void openConfirm(must('#app')).then((confirmed) => {
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
  const head = el('div', 'file-head')
  const left = el('div', 'fh-left')
  left.append(docLine, el('div', 'fh-title', FILE_TITLE))
  head.append(left)

  const sheet = el('div', 'file-sheet')
  const pgPrev = button('pg-turn', '이전 장', '‹')
  const pgNext = button('pg-turn', '다음 장', '›')
  const pgCount = el('span', 'pg-count')
  const nav = el('div', 'pg-nav')
  nav.append(pgPrev, pgCount, pgNext)

  let viewing = 0

  /**
   * A finished sitting's file — the cards that went out, read-only.
   *
   * U5.3. These are NOT slots: no `.slot`, no `.slot-pin`, and above all no
   * `data-block-id`, which is what `shell/thread-layer.ts:28` selects slot
   * anchors by. `buildBlockCard` writes `data-block`, so a past page is
   * invisible to the thread layer by construction — do not add the attribute
   * for symmetry. An id the index cannot resolve gets F1's fallback text from
   * `blockCardModel`, which is already its job.
   */
  function filedHost(ids: readonly string[]): HTMLElement {
    const host = el('div', 'filed-file')
    if (ids.length === 0) {
      host.append(el('div', 'filed-empty', FILED_EMPTY))
      return host
    }
    for (const [index, id] of ids.entries()) {
      const cell = el('div', 'filed-cell')
      cell.append(
        el('span', 'filed-no', pad2(index + 1)),
        buildBlockCard(blockCardModel(id, sentences.get(id) ?? null), { inSlot: true }),
      )
      host.append(cell)
    }
    return host
  }

  /**
   * The document, in order: the cover, then a page per finished agent, then the
   * agent on the desk.
   *
   * U5.3 — a record is shown as a PAST page only while its sitting is behind
   * the current one. The current agent's own file is recorded the moment it is
   * committed (it has to be — that is when it is knowable), and it is the live
   * page until the run moves on, so `flown >= run` is what keeps it from
   * appearing twice.
   */
  function pages(): HTMLElement[] {
    const cover = el('div', 'file-page')
    cover.append(head, buildDossier(coverModel(band), board.root))

    const past: HTMLElement[] = []
    for (const flown of [...filed.keys()].sort((a, b) => a - b)) {
      if (flown >= run) continue
      const ids = filed.get(flown) ?? []
      const page = el('div', 'file-page')
      page.append(
        buildDossier(filedModel({ callsign: callsignOf(flown), deployed: ids.length }), filedHost(ids)),
      )
      past.push(page)
    }

    const agent = el('div', 'file-page')
    agent.append(buildDossier(agentModel({ slotCap: SLOT_CAP, callsign: callsignOf(run) }), board.root))
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
    const who = callsignOf(store.get().meta.run)
    if (release === 'filed') {
      settleNote = `${who}${FILED_TAIL}`
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
      settleNote = WAITING
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
      // U5.3 — write site 2. The file committed at the close reached the
      // CLOSING run's membrane (W4's op order), but what it carries is the
      // file the operator built after 21:04 — the INCOMING agent's. So it is
      // filed under `event.run`, which is the same re-pointing the stamp does
      // on the two lines above: page inventory and stamp date cannot disagree,
      // because one branch decides both.
      filed.set(event.run, usedIds(board.cells()))
    }
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
  void fetchScenarioIdentity()
    .then((identity) => {
      slug = identity.slug
      opensAt = identity.start
      band = `${identity.start} → ${identity.end}`
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

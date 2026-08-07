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
import { el } from '../shell/dom.ts'
import { announce } from '../shell/announcer.ts'
import { fetchScenarioIdentity } from '../shell/pack.ts'
import { PORTAL } from '../shell/portal-identity.ts'
import { createRunState, hasFiledReport } from '../shell/run-state.ts'
import type { RunPhase, RunState } from '../shell/run-state.ts'
import { pad2, setPickedBlockId } from '../components/block-card.ts'
import { buildDossier, callsignOf, dossierModel } from '../components/dossier.ts'
import type { DossierInput } from '../components/dossier.ts'
import { SLOT_CAP, createSlotBoard } from '../components/slot-board.ts'
import { buildDeployStamp, buildDeployZone, deployView } from '../components/deploy-button.ts'
import { PACE, settleRelease } from '../components/score-tally.ts'

/** The wait line, verbatim from `windows/tally.ts` — diegetic, never a spinner. */
const WAITING = '……보고서 정리 중'
/** The line the control settles on once the run's report is on the desk. */
const FILED_TAIL = ' 보고서가 부검 창에 도착했습니다'
/** …and the line it settles on when the hold ran out and none came. */
const LAPSED_TAIL = ' 보고서는 아직 부검 창에 없습니다 — 다음 시행은 열려 있습니다'
const RUN_CAPTION = 'RUN '
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
/** What the file's own doc-number line is called (reference `fh-doc`). */
const DOC_CAPTION = '문서번호 '

/** Mounts this window's contents into the frame body the shell built. */
export function mount(host: HTMLElement, driver: FixtureDriver): void {
  const store = createRunState(driver)

  const sentences = new Map<string, Sentence>()
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
  const callsignLine = el('div', 'fh-v', callsignOf(run))

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

  function dossierInput(): DossierInput {
    return { slotCap: SLOT_CAP, callsign: callsignOf(run), clockBand: band, slotHost: board.root }
  }

  let currentView = deployView({ slots: board.cells(), deployed: false, run, at: opensAt })

  function sync(): void {
    docLine.textContent = `${DOC_CAPTION}${PORTAL.portalCode}/AF/${slug}/${pad2(run)}`
    callsignLine.textContent = callsignOf(run)
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

  const zone = buildDeployZone(() => {
    if (currentView.mode === 'next') {
      sendNewRun()
      return
    }
    if (currentView.mode === 'deploy') board.deploy()
    // 'settling' / 'spent': the control is disabled — a click cannot land.
  })
  const stamp = buildDeployStamp()
  // Direct handles onto the control's own note and button, exactly as
  // `windows/tally.ts` once owned its wait line and new-run button outright —
  // the settle text below is written straight to the DOM, not through
  // `deployView` (design #5: the note is the one thing it cannot derive purely).
  const noteEl = zone.root.querySelector<HTMLElement>('#deployState')!
  const deployBtn = zone.root.querySelector<HTMLButtonElement>('#btnDeploy')!
  let dossier = buildDossier(dossierModel(dossierInput()), board.root)

  const head = el('div', 'file-head')
  const left = el('div', 'fh-left')
  left.append(docLine, el('div', 'fh-title', FILE_TITLE))
  const right = el('div', 'fh-right')
  right.append(el('div', 'fh-k', '호출부호'), callsignLine)
  head.append(left, right)

  host.append(stamp.root, head, dossier, zone.root)

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
    const runLabel = pad2(store.get().meta.run)
    if (release === 'filed') {
      settleNote = `${RUN_CAPTION}${runLabel}${FILED_TAIL}`
      sync()
      announce(`${RUN_CAPTION}${runLabel}${SAY_FILED_TAIL}`)
    } else {
      // …and the lapse is SAID, above all: it is the release nothing else on
      // the desk echoes, and the one that hands back a degraded day.
      settleNote = `${RUN_CAPTION}${runLabel}${LAPSED_TAIL}`
      sync()
      announce(`${RUN_CAPTION}${runLabel}${SAY_LAPSED_TAIL}`)
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
      const runLabel = pad2(store.get().meta.run)
      setTimeout(() => {
        if (!settled) announce(`${RUN_CAPTION}${runLabel}${SAY_HOLD_TAIL}`)
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
    run = event.run
    // D10 — the seam carries no `new_run` event; a changed run IS the unlock.
    if (committedRun !== null && event.run !== committedRun) board.unlock()
    // M1 — §0's callsign is per sitting, so only a changed run re-prints the
    // dossier; an archive-only `meta` must not re-parent the live slot board.
    if (changedRun) {
      const next = buildDossier(dossierModel(dossierInput()), board.root)
      dossier.replaceWith(next)
      dossier = next
    }
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
      const next = buildDossier(dossierModel(dossierInput()), board.root)
      dossier.replaceWith(next)
      dossier = next
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

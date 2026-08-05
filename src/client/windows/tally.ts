// [u7] TALLY — 집계 · 시행 결과 (spec-client §4 TALLY row, §5.1, §6).
//
// The window is wiring and nothing else: it binds the run state to the §5.2
// stream (`shell/run-state.ts`), hands `components/score-tally.ts` a model when
// the run closes, and owns the two controls the reference puts under the
// ledger — the diegetic wait line and NEW RUN.
//
// Ported from docs/design/phase2-ui/index.html 219..258 (the ledger markup) and
// app.js 457..480 / 603..662 (`endRun` → `runTally` → `newRun`). The reference
// mutated a module-global run state in `newRun()`; here NEW RUN emits
// `{op:'new_run'}` and then waits — the run counter, the pips, the carried
// blocks and the archive all move on the `meta` event that comes back, and on
// nothing else (§5.3, [u7#c3]).
//
// Import-safe by contract (u3): no DOM at module scope, no stylesheet import,
// no sibling window import, nothing from engine or composer (C8 / inv 12), and
// no fixture module.
import type { FixtureDriver } from '../driver/index.ts'
import { announce } from '../shell/announcer.ts'
import { button, el } from '../shell/dom.ts'
import { fetchScenarioIdentity } from '../shell/pack.ts'
import { PORTAL } from '../shell/portal-identity.ts'
import { createRunState, hasFiledReport } from '../shell/run-state.ts'
import type { MetaState, RunPhase, RunState, ScoreState } from '../shell/run-state.ts'
import { PACE, createScoreTally, settleRelease } from '../components/score-tally.ts'
import type { TallyModel, TallyState } from '../components/score-tally.ts'

/** The wait line, verbatim from the reference — diegetic, never a spinner. */
const WAITING = '……보고서 정리 중'

/** What the ledger is called, and what it grades against (reference `tly-*`). */
const DOC_CAPTION = '집계표 '
const TITLE_AT = '시 '
const TITLE_TAIL = '분 시점 집계'
const SUB = '기준선 대비 — 무개입 하루가 기준이다'

/**
 * The headline axis. The `score` event carries `total` and nothing about what
 * the total counts, so the caption is ported from the design target
 * (data.js `TALLY.headline`) rather than invented per run — see discovery/u7.md.
 */
const HEADLINE_LABEL = '사망'
const HEADLINE_UNIT = '명'

/** NEW RUN, as the reference prints it. */
const NEW_RUN_MAIN = 'NEW RUN'
const NEW_RUN_SUB = '다음 시행 · '
const NEW_RUN_SUB_TAIL = '으로'

/** The line the ledger settles on once the run's report is on the desk. */
const FILED_TAIL = ' 보고서가 부검 창에 도착했습니다'
/** …and the line it settles on when the hold ran out and none came. */
const LAPSED_TAIL = ' 보고서는 아직 부검 창에 없습니다 — 다음 시행은 열려 있습니다'
const RUN_CAPTION = 'RUN '

/** The allotment is spent: `new_run` was refused, and the loop has no next day. */
const SPENT = '잔여 시행 없음 — 마지막 집계입니다'

/**
 * WHAT THE DESK SAYS while the hold runs — the wait line only PRINTS.
 *
 * The hold and both of its releases are purely client-side: `announcer.ts`
 * routes off the §5.2 stream, and the stream has no event for "the ledger let
 * the day go". So an operator driving by ear got the run's close and then up to
 * 30 s of nothing, after which a tab stop appeared and the wait line changed to
 * the OPPOSITE meaning — silently, both times. A desk that is deliberately
 * holding and a desk that has hung were indistinguishable in the accessible
 * tree (R2 on tally.ts:135).
 *
 * These go through `#toast`, the desk's ONE live region, and not through a
 * second `aria-live` on `.tly-wait`: two polite regions carrying the same
 * sentence make assistive tech speak it twice. The wait line stays a plain node
 * an operator can browse to; the toast is what is spoken.
 *
 * The release lines both end on NEW RUN, because the control's own arrival is
 * mute — it is `disabled` while the hold is up, so it is not even a tab stop
 * until the release puts it back in the order.
 */
const SAY_HOLD_TAIL = ' 집계 대기 · 보고서 정리 중'
const SAY_FILED_TAIL = ' 집계 완료 · 다음 시행을 시작할 수 있습니다'
const SAY_LAPSED_TAIL = ' 보고서가 도착하지 않았습니다 · 다음 시행을 시작할 수 있습니다'

/** The dev/test handle, exactly as `shell/boot.ts` exposes `window.__shell`. */
export interface TallyHandle {
  state(): TallyState
  rows(): number
  phase(): RunPhase
  /**
   * Whether the run's close has REACHED its reveal — false from the close, true
   * once the `PACE.OPEN_DELAY` callback has run.
   *
   * The reveal is what the u7 ruling gives TALLY the front for, and until now a
   * spec could only infer it from `#w-tally` losing `.hidden`. That is the same
   * fact only when the sheet was hidden to begin with: `show(true)` clicks the
   * taskbar *only* on a hidden window, so a TALLY the operator already opened by
   * hand reveals with no class change and no front-taking at all, and a wait on
   * the class answers instantly — before the gap it exists to wait out.
   *
   * A flag the reveal itself sets has neither shape. DEV/TEST only, like every
   * member of this handle (inv 11).
   */
  revealed(): boolean
  /** The run-loop numbers as the `meta` event carries them. */
  meta(): { run: number; runs_left: number; carried: string[]; archive: { run: number; label: string }[] }
}

declare global {
  interface Window {
    __tally?: TallyHandle
  }
}

const pad2 = (value: number): string => String(value).padStart(2, '0')

/** Mounts this window's contents into the frame body the shell built. */
export function mount(host: HTMLElement, driver: FixtureDriver): void {
  const store = createRunState(driver)
  const win = host.closest('.win')

  let slug = ''
  let title = ''

  const wait = el('div', 'tly-wait', WAITING)
  wait.id = 'tlyWait'

  const newRun = button('btn-newrun', NEW_RUN_MAIN, '')
  newRun.id = 'btnNewRun'
  // The `new_run` op's control, marked for the PRD §4 membrane census.
  newRun.dataset.op = 'new_run'
  newRun.disabled = true
  const newRunSub = el('span', 'bn-sub')
  newRun.append(el('span', 'bn-main', NEW_RUN_MAIN), newRunSub)

  // The count-up is the FLOOR of the wait and `PACE.HOLD_CEIL` is its CEILING
  // (R4 on score-tally.ts:258, rounds 1 and 2). The ledger reaches `final` on
  // its own ~9 s cadence, but the line that says the report is on the desk —
  // and the NEW RUN that ends the day — wait for the run's own `report`, which
  // the engine's worst case puts up to 30 s out. Until then the diegetic wait
  // line stays up: that is the beat that exists to absorb the generation. Past
  // the ceiling the day is handed back anyway, degraded and honest — NEW RUN
  // opens and the green "it arrived" line is NOT printed, because nothing
  // arrived. `settleRelease()` owns that decision; this window owns the clock.
  let settled = false
  let counted = false
  let lapsed = false
  let hold: ReturnType<typeof setTimeout> | null = null

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
    const run = pad2(store.get().meta.run)
    if (release === 'filed') {
      wait.classList.add('done')
      wait.textContent = `${RUN_CAPTION}${run}${FILED_TAIL}`
      announce(`${RUN_CAPTION}${run}${SAY_FILED_TAIL}`)
    } else {
      // No `.done`: the settled-green is the arrival's mark, and this is not one.
      wait.textContent = `${RUN_CAPTION}${run}${LAPSED_TAIL}`
      // …and the lapse is SAID, above all: it is the release nothing else on the
      // desk echoes, and the one that hands back a degraded day.
      announce(`${RUN_CAPTION}${run}${SAY_LAPSED_TAIL}`)
    }
    newRun.disabled = false
  }

  const tally = createScoreTally({
    host,
    onFinal: () => {
      counted = true
      settle()
    },
  })

  const foot = el('div', 'tly-foot')
  foot.append(wait, newRun)
  host.append(foot)

  newRun.addEventListener('click', () => {
    // Disabled BEFORE the op leaves: one activation is exactly one `new_run`,
    // and the way back in is the next run's `run_end` ([u7#c3]).
    newRun.disabled = true
    // …but a REFUSED op never comes back that way, and swallowing the response
    // left the desk on a dead button with the sheet still up (R3 on
    // tally.ts:106). `send()`'s answer is the only signal the client gets, so a
    // refusal is rendered: the allotment is spent, and the ledger says so.
    if (driver.send({ op: 'new_run' }).ok) return
    wait.classList.add('done')
    wait.textContent = SPENT
    // The refusal is client-side too: the button the operator just pressed goes
    // dead and the only answer is a line they may not be looking at.
    announce(SPENT)
  })

  /** This window's taskbar button, once the desk has built one. */
  function taskButton(): HTMLElement | null {
    return document.querySelector<HTMLElement>('.task[data-win="tally"]')
  }

  /** The taskbar's own attention mark, when the desk has a taskbar. */
  function alert(on: boolean): void {
    taskButton()?.classList.toggle('alert', on)
  }

  /**
   * Reveal goes through the taskbar, exactly as the operator's would: the desk
   * owns z-order, and the reference's `openWin()` raised the window as it
   * unhid it. TALLY is a sheet over the middle of the desk (shell/layout.ts),
   * so a reveal that only dropped `.hidden` would surface *underneath* whatever
   * window the operator last touched. Closing needs no such help — a hidden
   * window has no stacking to lose — and a desk with no taskbar yet (the unit
   * tests mount the window bare) falls back to the class.
   */
  function show(open: boolean): void {
    if (open && win?.classList.contains('hidden')) taskButton()?.click()
    if (win) win.classList.toggle('hidden', !open)
    alert(open)
  }

  function modelOf(meta: MetaState, score: ScoreState): TallyModel {
    return {
      doc: `${DOC_CAPTION}${PORTAL.portalCode}/TL/${slug}/${pad2(meta.run)}`,
      title,
      sub: SUB,
      run: meta.run,
      headline: {
        label: HEADLINE_LABEL,
        value: score.total,
        unit: HEADLINE_UNIT,
        // NO BASELINE ON THE SEAM, SO NONE ON THE PAPER (R1 on tally.ts:218).
        // This window used to `fetch` `data/scenario/<slug>/score.json` for the
        // baseline column and the summary note. `architecture-map.md:93` assigns
        // that file to the ENGINE — the pack's only view consumer is `meta.json`
        // (:85) — and inv 12 says windows consume `ViewEvent`s only, so the read
        // was a second in-channel the driver never saw and `assertSeamClean`
        // could not inspect. The ratified §5.2 fence (`src/shared/view-driver.ts`)
        // may not be widened from a client unit either, so the baseline waits on
        // the seam owner rather than being smuggled in here.
        baseline: null,
      },
      rows: score.rows.map((row) => ({
        label: row.label,
        value: String(row.value),
        baseline: null,
        delta: 'flat' as const,
      })),
      note: null,
      verdict: null,
    }
  }

  let closing = false
  let revealed = false
  let printed = false

  function print(state: RunState): void {
    if (printed || state.score === null) return
    printed = true
    tally.run(modelOf(state.meta, state.score))
  }

  function closed(): void {
    closing = true
    revealed = false
    printed = false
    counted = false
    settled = false
    lapsed = false
    // The ceiling runs from the close, so the whole hold — count-up included —
    // is bounded by one number the operator can feel the end of.
    armHold()
    tally.open()
    wait.classList.remove('done')
    wait.textContent = WAITING
    newRun.disabled = true
    // The reference waits 900 ms at 21:04 before the ledger comes up; the desk
    // needs the beat to register that the feed has stopped.
    setTimeout(() => {
      if (!closing) return
      revealed = true
      show(true)
      print(store.get())
      // The hold is now up, and it is said HERE rather than at the close: the
      // stream's own `run_end` line ("시뮬레이션 종료 · 집계 개시") is announced
      // in the close's tick, and a second write in that same tick would replace
      // it before anything read it. 900 ms later the two lines queue.
      if (!settled) announce(`${RUN_CAPTION}${pad2(store.get().meta.run)}${SAY_HOLD_TAIL}`)
    }, PACE.OPEN_DELAY)
  }

  function opened(): void {
    closing = false
    revealed = false
    printed = false
    counted = false
    settled = false
    lapsed = false
    dropHold()
    show(false)
    tally.reset()
    wait.classList.remove('done')
    wait.textContent = WAITING
    newRun.disabled = true
  }

  opened()

  store.subscribe((state: RunState) => {
    if (state.phase === 'tally' && !closing) {
      closed()
      return
    }
    if (state.phase !== 'tally' && closing) {
      opened()
      return
    }
    // The ledger cannot reach FINAL before the `score` event: if 21:04 arrived
    // first, the count-up starts the moment the score does (spec §3 inv 5).
    if (state.phase !== 'tally' || !revealed) return
    print(state)
    // …and a report that lands AFTER the count-up has finished releases the
    // settle it was holding.
    settle()
  })

  // `meta.json` — the ONE pack file the consumer map gives the view shell
  // (`architecture-map.md:85`), read through the shell's own helper.
  void fetchScenarioIdentity()
    .then((identity) => {
      slug = identity.slug
      const [hour, minute] = identity.end.split(':')
      title = `${hour ?? ''}${TITLE_AT}${minute ?? ''}${TITLE_TAIL}`
      newRunSub.textContent = `${NEW_RUN_SUB}${identity.start}${NEW_RUN_SUB_TAIL}`
    })
    .catch(() => undefined)

  // DEV/TEST only — see `shell/boot.ts`'s note on `window.__shell` (inv 11).
  if (import.meta.env.DEV) {
    window.__tally = {
      state: () => tally.state(),
      rows: () => tally.rows(),
      phase: () => store.get().phase,
      revealed: () => revealed,
      meta: () => {
        const meta = store.get().meta
        return { run: meta.run, runs_left: meta.runsLeft, carried: [...meta.carried], archive: [...meta.archive] }
      },
    }
  }
}

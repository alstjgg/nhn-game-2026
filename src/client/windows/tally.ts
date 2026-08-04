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
import { button, el } from '../shell/dom.ts'
import { fetchScenarioIdentity } from '../shell/pack.ts'
import { PORTAL } from '../shell/portal-identity.ts'
import { createRunState } from '../shell/run-state.ts'
import type { MetaState, RunPhase, RunState, ScoreState } from '../shell/run-state.ts'
import { PACE, baselineIndex, createScoreTally } from '../components/score-tally.ts'
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
const RUN_CAPTION = 'RUN '

/** The dev/test handle, exactly as `shell/boot.ts` exposes `window.__shell`. */
export interface TallyHandle {
  state(): TallyState
  rows(): number
  phase(): RunPhase
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

  let baselines = new Map<string, string>()
  let note: string | null = null
  let slug = ''
  let title = ''

  const wait = el('div', 'tly-wait', WAITING)
  wait.id = 'tlyWait'

  const newRun = button('btn-newrun', NEW_RUN_MAIN, '')
  newRun.id = 'btnNewRun'
  newRun.disabled = true
  const newRunSub = el('span', 'bn-sub')
  newRun.append(el('span', 'bn-main', NEW_RUN_MAIN), newRunSub)

  const tally = createScoreTally({
    host,
    onFinal: () => {
      wait.classList.add('done')
      wait.textContent = `${RUN_CAPTION}${pad2(store.get().meta.run)}${FILED_TAIL}`
      newRun.disabled = false
    },
  })

  const foot = el('div', 'tly-foot')
  foot.append(wait, newRun)
  host.append(foot)

  newRun.addEventListener('click', () => {
    // Disabled BEFORE the op leaves: one activation is exactly one `new_run`,
    // and the way back in is the next run's `run_end` ([u7#c3]).
    newRun.disabled = true
    driver.send({ op: 'new_run' })
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
        baseline: baselines.get(HEADLINE_LABEL) ?? null,
      },
      rows: score.rows.map((row) => ({
        label: row.label,
        value: String(row.value),
        baseline: baselines.get(row.label) ?? null,
        delta: 'flat' as const,
      })),
      note,
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
    }, PACE.OPEN_DELAY)
  }

  function opened(): void {
    closing = false
    revealed = false
    printed = false
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
    if (state.phase === 'tally' && revealed) print(state)
  })

  void fetchScenarioIdentity()
    .then((identity) => {
      slug = identity.slug
      const [hour, minute] = identity.end.split(':')
      title = `${hour ?? ''}${TITLE_AT}${minute ?? ''}${TITLE_TAIL}`
      newRunSub.textContent = `${NEW_RUN_SUB}${identity.start}${NEW_RUN_SUB_TAIL}`
      return fetch(new URL(`data/scenario/${identity.slug}/score.json`, document.baseURI))
    })
    .then((response) => (response.ok ? (response.json() as Promise<unknown>) : null))
    .then((raw) => {
      baselines = baselineIndex(raw)
      const summary = (raw as { baseline_summary?: unknown } | null)?.baseline_summary
      note = typeof summary === 'string' ? summary : null
    })
    .catch(() => undefined)

  // DEV/TEST only — see `shell/boot.ts`'s note on `window.__shell` (inv 11).
  if (import.meta.env.DEV) {
    window.__tally = {
      state: () => tally.state(),
      rows: () => tally.rows(),
      phase: () => store.get().phase,
      meta: () => {
        const meta = store.get().meta
        return { run: meta.run, runs_left: meta.runsLeft, carried: [...meta.carried], archive: [...meta.archive] }
      },
    }
  }
}

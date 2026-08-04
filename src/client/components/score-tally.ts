// [u7] ScoreTally — the 집계표 ledger and its ~9 s count-up (spec-client §6).
//
// Ported from docs/design/phase2-ui/app.js `countUp` (604) and `runTally` (614)
// onto u1's shipped `.tly-*` / `.tr-*` / `.th-*` skin: the ruled head, one
// headline number that counts up on a cubic ease-out, one rule per scored axis
// arriving in cadence, and the verdict stamp last.
//
// Two things are deliberately NOT the reference's:
//
// - **The settle is derived, not the literal 1400 ms.** The reference's own
//   README calls the count-up "deliberately paced to ~9 s — long enough to
//   cover a report call", and 900 + 500 + rows*640 + 1400 is 7.9 s for the
//   demo's ledger. `settleMs` solves for the 9 s target instead and clamps, so
//   `run_end → final` lands on `TOTAL_MS` for every ledger the seam can carry
//   (spec-client §3 inv 5, latency rule 3).
// - **The cadence is injected.** The reference drove it off the browser frame
//   callback; here it runs on a `Scheduler`, because 21:04 ends the driver's
//   clock and `advance()` early-returns once it has — a tally that rode the
//   driver's pump could never finish. There is no spinner anywhere: the wait
//   is diegetic and the window owns its line.
//
// Import-safe by contract (u3): no DOM at module scope, no stylesheet import,
// no sibling window import, nothing from engine or composer (C8 / inv 12).
import { el } from '../shell/dom.ts'

export type TallyState = 'pending' | 'counting' | 'final'

/** One ruled line of the ledger — a scored axis and what it cost. */
export interface TallyRowModel {
  label: string
  value: string
  /** The no-intervention baseline from the pack, or `null` when unmatched. */
  baseline: string | null
  delta: 'good' | 'flat' | 'bad'
}

export interface TallyModel {
  /** The document number printed above the head. */
  doc: string
  title: string
  sub: string
  run: number
  headline: { label: string; value: number; unit: string; baseline: string | null }
  rows: TallyRowModel[]
  /** The pack's baseline summary, printed beside the stamp. */
  note: string | null
  /** The stamp, when the seam or the pack supplies one. */
  verdict: string | null
}

/** Somewhere to hang a delay and a frame — real timers in the browser. */
export interface Scheduler {
  at(ms: number, fn: () => void): () => void
  frame(fn: (now: number) => void): () => void
}

/**
 * The cadence, in real milliseconds.
 *
 * `OPEN_DELAY` is `endRun`'s 900 ms wait before the window opens; `LEAD`,
 * `ROW_STEP` and `VERDICT_AFTER` are `runTally`'s 500 / 640 / +300; `COUNT_MS`
 * is `countUp`'s 3400. `TOTAL_MS` is the README's ~9 s target, which the
 * settle is solved against — the FLOOR of the wait.
 *
 * `HOLD_CEIL` is its CEILING: the longest the window may hold the day closed
 * waiting on the run's `report`. The engine's one retry puts the generation's
 * worst case near 30 s (`e2e/run-loop.spec.ts:488`), so a wait that has run
 * past it has stopped being a beat. The waiting rhythm is long, never endless
 * (R4 on score-tally.ts:258, round 2).
 */
export const PACE = {
  OPEN_DELAY: 900,
  LEAD: 500,
  ROW_STEP: 640,
  VERDICT_AFTER: 300,
  COUNT_MS: 3400,
  TOTAL_MS: 9000,
  HOLD_CEIL: 30_000,
} as const

/** What the ledger's wait line may do while the hold is up. */
export type SettleRelease =
  /** The beat is still running: the count-up, or the report, or both are out. */
  | 'hold'
  /** The count-up finished AND the run's report is on the desk. */
  | 'filed'
  /** `HOLD_CEIL` passed with no report — release the day, claim nothing. */
  | 'lapsed'

/**
 * The hold's whole decision, as a pure function of the three facts the window
 * has. Between the floor and the ceiling the wait belongs to the report:
 * `counted` alone never releases (that was the round-1 defect — a wall clock
 * announcing a delivery it never checked), and `filed` alone never cuts the
 * count-up short. Past the ceiling the desk is given back regardless, because a
 * player who is never handed the day back has been handed a bug, not a beat.
 */
export function settleRelease(input: { counted: boolean; filed: boolean; lapsed: boolean }): SettleRelease {
  if (input.counted && input.filed) return 'filed'
  return input.lapsed ? 'lapsed' : 'hold'
}

/** The settle may never race the count-up, nor leave the desk waiting. */
const SETTLE_FLOOR = 1400
const SETTLE_CEIL = 6000

const clamp = (value: number, low: number, high: number): number =>
  value < low ? low : value > high ? high : value

/**
 * How long the ledger sits finished-but-not-final, solved so that
 * `OPEN_DELAY + LEAD + rows*ROW_STEP + settleMs(rows)` is the 9 s target for
 * every row count the demo's ledger reaches, and inside ±1.5 s beyond it.
 */
export function settleMs(rowCount: number): number {
  return clamp(PACE.TOTAL_MS - PACE.OPEN_DELAY - PACE.LEAD - rowCount * PACE.ROW_STEP, SETTLE_FLOOR, SETTLE_CEIL)
}

/** The reference's cubic ease-out, clamped at both ends — a frame may lag. */
export function countUpAt(to: number, k: number): number {
  const at = clamp(k, 0, 1)
  const eased = 1 - (1 - at) ** 3
  return Math.round(to * eased)
}

// `baselineIndex()` lived here and read `data/scenario/<slug>/score.json` for
// the ledger's 기준 column. REMOVED (R1 on tally.ts:218): `architecture-map.md`
// §2.1 assigns `score.json` to the engine and gives the view exactly one pack
// file (`meta.json`), and inv 12 says a window consumes `ViewEvent`s only. The
// baseline belongs on the seam or nowhere; a resolver kept "for later" here
// would just be the same in-channel with the fetch moved one file away.

/** The mark each delta prints in the `.tr-d` column (reference `runTally`). */
const DELTA_MARK: Record<TallyRowModel['delta'], string> = { good: '▲', flat: '=', bad: '▼' }

/** `기준 ` — the ledger's own caption for a baseline cell. */
const BASELINE_CAPTION = '기준 '

const pad2 = (value: number): string => String(value).padStart(2, '0')

/** Real timers: `setTimeout` for the cadence, `requestAnimationFrame` for the count. */
function browserScheduler(): Scheduler {
  return {
    at(ms: number, fn: () => void): () => void {
      const id = setTimeout(fn, ms)
      return () => clearTimeout(id)
    },
    frame(fn: (now: number) => void): () => void {
      let id = requestAnimationFrame(function step(now: number): void {
        fn(now)
        id = requestAnimationFrame(step)
      })
      return () => cancelAnimationFrame(id)
    },
  }
}

export interface ScoreTally {
  /** The ledger root — it carries `data-tally-state`. */
  readonly root: HTMLElement
  state(): TallyState
  /** The run has closed: the ledger is on the desk with nothing counted yet. */
  open(): void
  /** Runs the whole cadence for `model`, ending in `final`. */
  run(model: TallyModel): void
  /** Back to an empty ledger for the next run. */
  reset(): void
  /** How many ruled lines are printed right now. */
  rows(): number
}

export interface ScoreTallyOptions {
  host: HTMLElement
  scheduler?: Scheduler
  onFinal?: () => void
}

export function createScoreTally(options: ScoreTallyOptions): ScoreTally {
  const scheduler = options.scheduler ?? browserScheduler()
  const root = options.host

  const doc = el('div', 'tly-doc')
  const title = el('h3')
  const sub = el('div', 'tly-sub')
  const head = el('div', 'tly-head')
  head.append(doc, title, sub)

  const headKey = el('div', 'th-k')
  const big = el('span')
  big.id = 'tlyBig'
  const unit = el('i')
  const headValue = el('div', 'th-v')
  headValue.append(big, unit)
  const headBaseline = el('div', 'th-b')
  const headline = el('div', 'tly-headline')
  headline.append(headKey, headValue, headBaseline)

  const body = el('tbody')
  body.id = 'tlyRows'
  const table = el('table', 'tly-table')
  table.append(body)

  const stamp = el('div', 'tv-stamp')
  const note = el('p')
  const verdict = el('div', 'tly-verdict')
  verdict.id = 'tlyVerdict'
  verdict.append(stamp, note)

  root.append(head, headline, table, verdict)

  let state: TallyState = 'pending'
  let cancels: (() => void)[] = []

  function paint(next: TallyState): void {
    state = next
    root.dataset.tallyState = next
  }

  function stop(): void {
    for (const cancel of cancels) cancel()
    cancels = []
  }

  function later(ms: number, fn: () => void): void {
    cancels.push(scheduler.at(ms, fn))
  }

  /** The headline climbs to `to` on the reference's ease-out, then stops dead. */
  function countUp(to: number): void {
    let from: number | null = null
    const cancel = scheduler.frame((now: number) => {
      if (from === null) from = now
      const k = (now - from) / PACE.COUNT_MS
      big.textContent = String(countUpAt(to, k))
      if (k >= 1) cancel()
    })
    cancels.push(cancel)
  }

  function rowNode(row: TallyRowModel, index: number): HTMLElement {
    const tr = el('tr')
    tr.append(
      el('td', 'tr-i', pad2(index + 1)),
      el('td', 'tr-l', row.label),
      el('td', 'tr-v', row.value),
      el('td', `tr-d ${row.delta}`, DELTA_MARK[row.delta]),
    )
    // The seam carries no baseline; the pack does, matched by label. An axis it
    // does not name simply prints no baseline cell (design D6).
    if (row.baseline !== null) tr.append(el('td', 'tr-b', `${BASELINE_CAPTION}${row.baseline}`))
    return tr
  }

  function reset(): void {
    stop()
    body.replaceChildren()
    big.textContent = String(0)
    verdict.classList.remove('in')
    paint('pending')
  }

  function run(model: TallyModel): void {
    stop()
    doc.textContent = model.doc
    title.textContent = model.title
    sub.textContent = model.sub
    headKey.textContent = model.headline.label
    unit.textContent = model.headline.unit
    headBaseline.textContent =
      model.headline.baseline === null ? '' : `${BASELINE_CAPTION}${model.headline.baseline}`
    stamp.textContent = model.verdict ?? ''
    stamp.hidden = model.verdict === null
    note.textContent = model.note ?? ''

    big.textContent = String(0)
    verdict.classList.remove('in')
    body.replaceChildren(...model.rows.map(rowNode))
    paint('counting')
    countUp(model.headline.value)

    const printed = model.rows.length
    for (const [i, tr] of [...body.children].entries()) {
      later(PACE.LEAD + i * PACE.ROW_STEP, () => tr.classList.add('in'))
    }
    const ruled = PACE.LEAD + printed * PACE.ROW_STEP
    later(ruled + PACE.VERDICT_AFTER, () => verdict.classList.add('in'))
    later(ruled + settleMs(printed), () => {
      paint('final')
      options.onFinal?.()
    })
  }

  paint('pending')

  return {
    root,
    state: () => state,
    open: () => reset(),
    run,
    reset,
    rows: () => body.children.length,
  }
}

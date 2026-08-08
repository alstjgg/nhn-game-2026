// [u7] ScoreTally — the day's 집계, printed as record lines (spec-client §6).
//
// Ported from docs/design/phase2-ui/app.js `countUp` (604) and `runTally` (614).
//
// ── x4 (08-08): the ledger became a record ──────────────────────────────────
//
// U3 dissolved the TALLY window and filed this thing at the foot of 현장 기록,
// where it went on looking like the sheet it used to be: a centred head with a
// 집계표 title and a subtitle, a 66px headline number in its own boxed row, and
// a zebra-striped table with a 기준 column and ▲/=/▼ marks. Two documents on one
// piece of paper, and the second one shouted.
//
// It prints as LINES now, in the 현장 기록 column's own format — the same grid,
// the same dotted rule between rows, the sentence starting on the same x. What
// changes is the ink: every line is seal red and bold, because these are the
// only lines on the page that are not a report of what someone saw. One line
// each, in the order the day is read out:
//
//     23시 12분 시점 집계
//     터널에서 나오지 못한 사람: 59명
//     오세라: 사망 · 아홉 번째 문 안쪽
//     …
//     총 사망자 수 60명
//
// WHAT WENT WITH THE TABLE. The 기준 column and the ▲/=/▼ mark are gone, on
// 민서's call (08-08): the record format has one column, and a baseline folded
// into the same line would double every row's length for a comparison the
// operator did not ask for. The seam still carries `baseline` and
// `baseline_total` — the engine's contract is untouched — but nothing on the
// desk renders them any more, so the "무개입 하루 대비" reading now lives only in
// what the day itself says.
//
// The count-up survives, moved onto the closing line's number and given only
// the time that line actually has (`countMs`) — see the cadence note below.
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

/**
 * One record line — a scored axis and what it came to.
 *
 * `value` keeps the seam's own union rather than a pre-stringified label,
 * because the NUMBER/WORD distinction is what decides whether the unit is
 * printed (see `lineOf`). Stringifying upstream would throw that away and leave
 * this module guessing from the characters.
 */
export interface TallyRowModel {
  label: string
  value: string | number
}

export interface TallyModel {
  /** The document number printed above the lines. */
  doc: string
  /** The record's opening line — `"23시 12분 시점 집계"`. */
  title: string
  run: number
  /** The closing line: `label`, the total, and the unit the total counts in. */
  headline: { label: string; value: number; unit: string }
  rows: TallyRowModel[]
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
 * x4 keeps every one of them at its ported value and re-aims two: `VERDICT_AFTER`
 * is now the beat between the last axis line and the CLOSING line (the verdict
 * stamp it was named for went with the table), and `COUNT_MS` became a CEILING
 * rather than a duration, because the closing line no longer starts counting at
 * t=0 — see `countMs`.
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

/**
 * How long the CLOSING line's number has to climb.
 *
 * x4 — the count-up used to start with the ledger and run `COUNT_MS` flat,
 * because the headline was the first thing on the sheet. It is the last line
 * now, landing `VERDICT_AFTER` after the final axis line, and everything after
 * that point belongs to the settle. Given the whole of `COUNT_MS` it would have
 * been mid-climb when `final` fired and the desk announced 집계 완료 over a
 * number still moving — by up to 2.3 s on a nine-row day.
 *
 * So the ported 3400 becomes the CEILING and the settle's own remainder the
 * budget. The number always lands on `final`, never after it, whatever the
 * ledger's length. `Math.max` is not reachable here: `settleMs` floors at 1400
 * and `VERDICT_AFTER` is 300, so the remainder is never negative — and the
 * blanket ban in `tests/windows/tally.test.ts` (f) means it could not be used
 * even if it were.
 */
export function countMs(rowCount: number): number {
  return clamp(settleMs(rowCount) - PACE.VERDICT_AFTER, 0, PACE.COUNT_MS)
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

/** What separates an axis from its outcome on a record line. */
const AXIS_JOIN = ': '
/** …and what separates the closing line's caption from its number. */
const TOTAL_JOIN = ' '

/**
 * One axis, as a line.
 *
 * The unit rides a NUMBER and nothing else. That is not a guess about the
 * scenario: `contract-datapack` §3.6 has authoring write a body count as a
 * number and every other outcome as a word, which is the same predicate
 * `components/tally-line.ts` sums the feed's closing line by. So a counted axis
 * reads `터널에서 나오지 못한 사람: 59명` and a qualitative one reads
 * `차우진: 사망 · 하행 4.2km 갓길` — with no unit invented for it.
 */
export function lineOf(row: TallyRowModel, unit: string): string {
  const tail = typeof row.value === 'number' ? unit : ''
  return `${row.label}${AXIS_JOIN}${row.value}${tail}`
}

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
  /** The record root — it carries `data-tally-state`. */
  readonly root: HTMLElement
  state(): TallyState
  /** The run has closed: the record is on the desk with nothing counted yet. */
  open(): void
  /** Runs the whole cadence for `model`, ending in `final`. */
  run(model: TallyModel): void
  /** Back to an empty record for the next run. */
  reset(): void
  /** How many AXIS lines are printed right now — the open and close are not axes. */
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

  // The document number, and then nothing but lines. What used to sit here —
  // `.tly-head`'s centred 집계표 title with its subtitle, `.tly-headline`'s boxed
  // 66px number, `.tly-table`'s zebra rows, `.tly-verdict`'s stamp — is gone
  // whole: five blocks of sheet furniture that announced a second document
  // inside the first one.
  const doc = el('div', 'tly-doc')

  const openLine = el('li', 'tly-line tl-open')
  const openText = el('span', 'tl-s')
  openLine.append(openText)

  /** The closing line, split so ONLY its number moves while it counts. */
  const big = el('b')
  big.id = 'tlyBig'
  const totalCaption = el('span', 'tl-cap')
  const totalUnit = el('span', 'tl-unit')
  const closeLine = el('li', 'tly-line tl-close')
  const closeText = el('span', 'tl-s')
  closeText.append(totalCaption, big, totalUnit)
  closeLine.append(closeText)

  const lines = el('ol', 'tly-lines')
  lines.id = 'tlyRows'

  root.append(doc, lines)

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

  /** The closing line's number climbs to `to` on the reference's ease-out. */
  function countUp(to: number, overMs: number): void {
    let from: number | null = null
    const cancel = scheduler.frame((now: number) => {
      if (from === null) from = now
      const k = overMs <= 0 ? 1 : (now - from) / overMs
      big.textContent = String(countUpAt(to, k))
      if (k >= 1) cancel()
    })
    cancels.push(cancel)
  }

  /** One axis, as a line of the record. `.tl-s` starts on the facts' own x. */
  function rowNode(row: TallyRowModel, unit: string): HTMLElement {
    const line = el('li', 'tly-line')
    line.append(el('span', 'tl-s', lineOf(row, unit)))
    return line
  }

  function reset(): void {
    stop()
    lines.replaceChildren()
    openLine.classList.remove('in')
    closeLine.classList.remove('in')
    big.textContent = String(0)
    paint('pending')
  }

  function run(model: TallyModel): void {
    stop()
    doc.textContent = model.doc
    openText.textContent = model.title
    totalCaption.textContent = `${model.headline.label}${TOTAL_JOIN}`
    totalUnit.textContent = model.headline.unit
    big.textContent = String(0)

    const axes = model.rows.map((row) => rowNode(row, model.headline.unit))
    openLine.classList.remove('in')
    closeLine.classList.remove('in')
    // The record is BUILT whole and revealed in cadence, exactly as the table's
    // rows were: every line is in the document from the first frame, so the
    // 현장 기록 column above it never reflows as the day is read out.
    lines.replaceChildren(openLine, ...axes, closeLine)
    paint('counting')

    // The opening line IS the record arriving — it does not wait on `LEAD`, the
    // way the old sheet's head did not wait on it either.
    openLine.classList.add('in')

    const printed = axes.length
    for (const [i, line] of axes.entries()) {
      later(PACE.LEAD + i * PACE.ROW_STEP, () => line.classList.add('in'))
    }
    const ruled = PACE.LEAD + printed * PACE.ROW_STEP
    later(ruled + PACE.VERDICT_AFTER, () => {
      closeLine.classList.add('in')
      countUp(model.headline.value, countMs(printed))
    })
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
    // The open and the close are not axes: a caller asking "how many rows did
    // the day score" must not be handed two more than the seam sent.
    rows: () => lines.querySelectorAll('.tly-line:not(.tl-open):not(.tl-close)').length,
  }
}

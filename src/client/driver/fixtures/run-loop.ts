// [u7] The demo LOOP — RUN 03 and the two days after it (spec-client §5.1).
//
// `woodari-run03.ts` is one day. The loop is what `new_run` opens onto, and it
// is authored HERE rather than in the client, because the run counter, the
// remaining allotment, the carried blocks and the archive are the run-loop
// manager's numbers: the client mirrors them and never computes them (§5.3).
//
// The days after RUN 03 replay RUN 03's stream — that is what a loop is, and it
// keeps every rendered string the authored one (C3: no synthetic content is
// minted here). What moves run to run is exactly the meta-state: the counter,
// the pips, one more filed report in the archive, and one more block carried
// out of the run before.
//
// The archive lists every run the desk has a file for, the one just opened
// included — `windows/reports.ts` otherwise synthesises an unlabelled rail
// entry for the current run, and a labelled one reads better than a blank
// (see discovery/u7.md).
import type { ViewEvent } from '../../../shared/view-driver.ts'
import type { FixtureRun } from './types.ts'
import { woodariRun03 } from './woodari-run03.ts'
import { reportOf } from './woodari-reports.ts'
import { ARCHIVE, CARRIED, RUN, RUNS_LEFT, WOODARI_SCORE_ROWS, WOODARI_SCORE_TOTAL } from './woodari-meta.ts'

/** How many days the demo loop covers, RUN 03 included. */
const DAYS = 3

/** The run's own report — the day is the same day, so the autopsy is too. */
const FILED = reportOf(3)

/** Blocks the operator keeps out of a finished run, in report order. */
const HARVEST: string[] = FILED.report_body.map((sentence) => sentence.id)

/** RUN 03's day, with its opening meta and its three closing events removed. */
const DAY: ViewEvent[] = woodariRun03.events.filter(
  (event) =>
    event.type !== 'meta' && event.type !== 'report' && event.type !== 'score' && event.type !== 'run_end',
)

const pad2 = (value: number): string => String(value).padStart(2, '0')

/** `RUN 0N / HH:MM — HH:MM` — run and time, and nothing else (inv 6). */
function label(run: number): string {
  return `RUN ${pad2(run)} / ${woodariRun03.start} — ${woodariRun03.end}`
}

function archiveThrough(run: number): { run: number; label: string }[] {
  const filed = [...ARCHIVE]
  for (let earlier = RUN; earlier <= run; earlier += 1) filed.push({ run: earlier, label: label(earlier) })
  return filed
}

function metaOf(run: number): ViewEvent {
  const spent = run - RUN
  return {
    type: 'meta',
    run,
    runs_left: RUNS_LEFT - spent,
    carried: [...CARRIED, ...HARVEST.slice(0, spent)],
    archive: archiveThrough(run),
  }
}

function dayOf(run: number): FixtureRun {
  return {
    id: `woodari-run${pad2(run)}`,
    start: woodariRun03.start,
    end: woodariRun03.end,
    events: [
      metaOf(run),
      ...DAY,
      { type: 'report', round: run, facts: FILED.facts, report_body: FILED.report_body },
      { type: 'score', total: WOODARI_SCORE_TOTAL, rows: WOODARI_SCORE_ROWS },
      { type: 'run_end', run },
    ],
    responses: woodariRun03.responses,
  }
}

/** The demo loop: the authored RUN 03, then the days it opens onto. */
export const woodariRunLoop: FixtureRun[] = [
  woodariRun03,
  ...Array.from({ length: DAYS - 1 }, (_, i) => dayOf(RUN + i + 1)),
]

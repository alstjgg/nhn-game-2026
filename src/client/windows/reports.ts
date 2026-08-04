// [u6] REPORTS — 부검 · 리포트 (spec-client §4 REPORTS row, §7 #4/#5).
//
// The window is wiring and nothing else: it subscribes to the §5.2 seam, keeps
// the filed reports by round, and hands three collaborators their inputs —
// `report-archive.ts` (the run/time rail), `report-view.ts` (the two documents
// and the replay) and `minable-sentence.ts` (the marks and the mine reducer).
//
// What it deliberately does NOT do: re-segment or re-classify anything (the
// sentences arrive with their authored ids and species, §5.2), keep a clock or
// a timer of its own (the driver's pump is the only one), reach into a sibling
// window (mining emits an op at the seam; where the card lands is the store's
// business), or touch engine/composer (C8 / inv 12).
import type { FixtureDriver } from '../driver/index.ts'
import { deriveMarks, mine } from '../components/minable-sentence.ts'
import type { MarkSets } from '../components/minable-sentence.ts'
import { createArchiveRail } from '../components/report-archive.ts'
import type { ArchiveEntry } from '../components/report-archive.ts'
import { createReportView } from '../components/report-view.ts'
import type { ReportModel } from '../components/report-view.ts'

/** A rail identity — the archive entries, plus any run that has filed a report. */
function railEntries(archive: readonly ArchiveEntry[], filed: readonly number[]): ArchiveEntry[] {
  const listed = new Set(archive.map((entry) => entry.run))
  const extra = [...filed].filter((run) => !listed.has(run)).sort((a, b) => a - b)
  return [...archive, ...extra.map((run) => ({ run, label: '' }))]
}

/** Two rails are the same rail when they offer the same runs under the same labels. */
function sameRail(a: readonly ArchiveEntry[], b: readonly ArchiveEntry[]): boolean {
  return a.length === b.length && a.every((entry, i) => entry.run === b[i]?.run && entry.label === b[i]?.label)
}

/** Mounts this window's contents into the frame body the shell built. */
export function mount(host: HTMLElement, driver: FixtureDriver): void {
  const filed = new Map<number, ReportModel>()
  let archive: ArchiveEntry[] = []
  let carried: string[] = []
  let rendered: ArchiveEntry[] = []
  let active: number | null = null

  const marks = (): MarkSets => deriveMarks(driver.store(), carried)

  const rail = createArchiveRail({
    onSelect: (run: number) => {
      active = run
      drawDocument()
    },
  })

  const view = createReportView({
    host,
    rail: rail.root,
    onMine: (id: string) => {
      const outcome = mine(id, marks())
      for (const op of outcome.ops) driver.send(op)
      view.refresh(marks())
      for (const effect of outcome.effects) view.tear(effect.tear)
    },
  })

  /**
   * The selected run's filed report, or an empty document when none exists.
   *
   * The replay belongs to a report's FIRST arrival and to nothing else. NEW RUN
   * used to re-animate it: the next day's `meta` re-entered `sync()`, the rail
   * gained an entry, and the still-selected document blanked itself and re-typed
   * for ~4 s over the opening of a day the operator had already moved on to
   * (R4 on windows/reports.ts:90). A round replays once, then repaints whole.
   */
  const replayed = new Set<number>()

  function drawDocument(): void {
    if (active === null) return
    const model = filed.get(active) ?? { round: active, facts: [], report_body: [] }
    const first = model.report_body.length > 0 && !replayed.has(model.round)
    if (first) replayed.add(model.round)
    view.render(model, marks(), { replay: first })
  }

  function sync(): void {
    const entries = railEntries(archive, [...filed.keys()])
    if (entries.length === 0) return
    if (active === null || !entries.some((entry) => entry.run === active)) {
      active = entries[entries.length - 1]?.run ?? null
    }
    if (active === null) return
    if (sameRail(entries, rendered)) rail.select(active)
    else {
      rail.render(entries, active)
      rendered = entries
    }
    drawDocument()
  }

  driver.subscribe((event) => {
    if (event.type === 'meta') {
      archive = [...event.archive]
      carried = [...event.carried]
      sync()
      return
    }
    if (event.type !== 'report') return
    filed.set(event.round, { round: event.round, facts: event.facts, report_body: event.report_body })
    active = event.round
    sync()
  })
}

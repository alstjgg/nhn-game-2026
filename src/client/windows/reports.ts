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
//
// U3 (playtest g3-1) — TALLY dissolves: the day's results now land here, as a
// fourth collaborator. `components/score-tally.ts` survives whole; this window
// only hands it a host and a model. The record renders from the `score` event
// alone (inv 6 / inv 12) — no pack read, and `report-view.ts` is not edited:
// its own render cycle only ever replaces `#factsList`'s and the body's
// children, so the record survives every repaint as a sibling article.
import type { FixtureDriver, ViewEvent } from '../driver/index.ts'
import { callsignOf } from '../components/dossier.ts'
import { deriveMarks, mine, sentenceState } from '../components/minable-sentence.ts'
import type { MarkSets } from '../components/minable-sentence.ts'
import { createArchiveRail } from '../components/report-archive.ts'
import type { ArchiveEntry } from '../components/report-archive.ts'
import { createReportView } from '../components/report-view.ts'
import type { ReportModel } from '../components/report-view.ts'
import { el } from '../shell/dom.ts'
import { fetchScenarioIdentity } from '../shell/pack.ts'
import { PORTAL } from '../shell/portal-identity.ts'
import { pad2 } from '../components/block-card.ts'
import { getSlotBoard, SLOT_CAP } from '../components/slot-board.ts'
import { createScoreTally } from '../components/score-tally.ts'
import type { TallyModel, TallyRowModel } from '../components/score-tally.ts'

/** What the record is called, and what it grades against — relocated verbatim
 * from `windows/tally.ts` (u7, pre-U3). */
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

/**
 * ▲ / = / ▼ — and ONLY for an axis that counts, ported verbatim from
 * `windows/tally.ts`. A word has no vocabulary for "changed"; a changed
 * outcome shows as itself, beside the 기준 cell holding what it changed FROM.
 */
const deltaOf = (
  value: string | number,
  baseline: string | number | null,
): TallyRowModel['delta'] => {
  if (baseline === null) return 'flat'
  if (typeof value !== 'number' || typeof baseline !== 'number') return 'flat'
  if (value === baseline) return 'flat'
  return value < baseline ? 'good' : 'bad'
}

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

  // U3 — the terminal record's own identity, tracked the same way `meta`
  // already feeds the callsign below. There is ONE record: the next `score`
  // replaces it whole (design #1).
  let run = 0
  let slug = ''
  let title = ''
  let record: HTMLElement | null = null

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
      const m = marks()
      const state = sentenceState(id, m)
      // Settled — it is in a file already, today's or an earlier day's.
      if (state === 'slotted' || state === 'carried') return

      // ONE gesture (08-08 playtest): a single activation tears the sentence
      // out AND seats it in the first free slot. `채굴` is no longer a resting
      // state the operator has to click through — 해제 is the only way back
      // into it. `slot-board.ts` stays the only membrane owner (`place()` runs
      // planOps); a refusal is SHOWN, never swallowed.
      const board = getSlotBoard()
      const slots = driver.store().slots
      const seat = [...Array(SLOT_CAP).keys()].find((i) => slots[i] === undefined)
      if (board === null || seat === undefined || board.isLocked()) {
        // No seat to tear it into: the file is full, or committed. Mining it
        // anyway would strand the sentence in a state with nowhere to go.
        view.flash(id)
        return
      }

      if (state === 'unmined') {
        const outcome = mine(id, m)
        const landed = outcome.ops.every((op) => driver.send(op).ok)
        if (!landed) {
          view.refresh(marks())
          view.flash(id)
          return
        }
        for (const effect of outcome.effects) view.tear(effect.tear)
      }

      board.place(id, seat)
      view.refresh(marks())
      if (board.cells()[seat] !== id) view.flash(id)
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

  /** The terminal record's model, built from the `score` event alone. */
  function scoreModel(event: Extract<ViewEvent, { type: 'score' }>): TallyModel {
    return {
      doc: `${DOC_CAPTION}${PORTAL.portalCode}/TL/${slug}/${pad2(run)}`,
      title,
      sub: SUB,
      run,
      headline: {
        label: HEADLINE_LABEL,
        value: event.total,
        unit: HEADLINE_UNIT,
        baseline: String(event.baseline_total),
      },
      rows: event.rows.map((row) => ({
        label: row.label,
        value: String(row.value),
        baseline: row.baseline === null ? null : String(row.baseline),
        delta: deltaOf(row.value, row.baseline),
      })),
      note: null,
      verdict: null,
    }
  }

  driver.subscribe((event) => {
    if (event.type === 'meta') {
      archive = [...event.archive]
      carried = [...event.carried]
      run = event.run
      view.brand(callsignOf(event.run))
      sync()
      return
    }
    if (event.type === 'score') {
      // Unmineable by construction: no `.min` node, no `sentence_id` — this
      // is a terminal, autopsy-window record, not a source document.
      const docFacts = host.querySelector('article.doc-facts')
      if (docFacts === null) return
      record?.remove()
      record = el('article', 'terminal-record')
      record.setAttribute('aria-label', '시행 결과')
      docFacts.append(record)
      const tally = createScoreTally({ host: record })
      tally.open()
      tally.run(scoreModel(event))
      return
    }
    if (event.type !== 'report') return
    filed.set(event.round, { round: event.round, facts: event.facts, report_body: event.report_body })
    active = event.round
    sync()
  })

  // The record's headline needs the pack's own end-of-day stamp — the ONE
  // pack file the consumer map gives the view shell (`architecture-map.md:85`),
  // read through the shell's own helper, exactly as `windows/tally.ts` once did.
  void fetchScenarioIdentity()
    .then((identity) => {
      slug = identity.slug
      const [hour, minute] = identity.end.split(':')
      title = `${hour ?? ''}${TITLE_AT}${minute ?? ''}${TITLE_TAIL}`
    })
    .catch(() => undefined)

  // Slotting has to repaint the marks, and no event says it happened: `slot` is
  // a membrane op the AGENT FILE's board sends, and this window subscribes to
  // `meta` and `report` only. `onMine` above calls `view.refresh()` for its own
  // op; there was no counterpart, so a sentence placed in a slot kept whatever
  // it had rendered as until the next report arrived.
  //
  // Watched rather than told, exactly as BLOCK STORE watches for `mine` — a
  // window may not reach into a sibling (C8), so the observer is the seam that
  // is left. `stamp` guards it: nothing repaints on a frame that changed no
  // mark, and `refresh()` walks the anchors, so an unguarded call every frame
  // would be a per-frame DOM walk over the whole document.
  const slotStamp = (): string => {
    const store = driver.store()
    return `${Object.values(store.slots).join(',')}|${store.mined.join(',')}|${carried.join(',')}`
  }
  let marked = slotStamp()
  const watch = (): void => {
    const next = slotStamp()
    if (next !== marked) {
      marked = next
      view.refresh(marks())
    }
    requestAnimationFrame(watch)
  }
  requestAnimationFrame(watch)
}

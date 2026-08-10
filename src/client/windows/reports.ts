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
//
// x12 (민서, 08-10) — WHAT ARRIVES IS NOT WHAT IS SHOWN, and that is the one
// structural change since. This window took the §5.2 stream literally: a
// `report` typed the round's write-up in the frame the seam emitted it, and a
// `score` started the record's count-up in the same beat. Since x11 the LIVE
// FEED types its lines and paces them, so at that moment the fanfold is still
// tens of seconds back, printing the beats the write-up is about — the day's
// outcome appearing above a paper still printing what caused it.
//
// So the ARRIVING document waits for the paper: `shell/feed-reach.ts` publishes
// where the fanfold has got to, and `afterPaper` below holds each report until
// the feed has walked past that round's `report` event — which is the round's
// last beat printed. The record's count-up waits for the `score` the same way,
// because the fanfold mints the 집계 line from it and the two are one count.
//
// NOTHING ELSE WAITS. A report already in the archive, one the operator picks
// off the rail, a document redrawn because the rail reconciled — all of them
// draw synchronously, exactly as before. The gate is on arrival and on nothing
// else, because what it protects is the ORDER two surfaces say a thing in, and
// a document being re-read has no order left to protect.
import type { FixtureDriver, ViewEvent } from '../driver/index.ts'
import { callsignOf } from '../components/dossier.ts'
import { deriveMarks, mine, repaintMines, sentenceState } from '../components/minable-sentence.ts'
import type { MarkSets } from '../components/minable-sentence.ts'
import { createArchiveRail } from '../components/report-archive.ts'
import type { ArchiveEntry } from '../components/report-archive.ts'
import { accumulated, createReportView } from '../components/report-view.ts'
import type { ReportModel } from '../components/report-view.ts'
import { el } from '../shell/dom.ts'
import { feedReached } from '../shell/feed-reach.ts'
import type { FeedCue } from '../shell/feed-reach.ts'
import { fetchScenarioIdentity } from '../shell/pack.ts'
import { PORTAL } from '../shell/portal-identity.ts'
import { pad2 } from '../components/block-card.ts'
import { getSlotBoard, SLOT_CAP } from '../components/slot-board.ts'
import { createScoreTally } from '../components/score-tally.ts'
import type { TallyModel } from '../components/score-tally.ts'

/** What the record is called, and what it grades against — relocated verbatim
 * from `windows/tally.ts` (u7, pre-U3). */
const DOC_CAPTION = '집계표 '
const TITLE_AT = '시 '
const TITLE_TAIL = '분 시점 집계'

/**
 * The closing line's caption and unit. The `score` event carries `total` and
 * nothing about what the total counts, so the caption is design-target copy
 * (data.js `TALLY.headline`) rather than something invented per run — see
 * discovery/u7.md.
 *
 * x4 — `사망` became `총 사망자 수`, because the line is prose now and not the
 * key half of a key/value row: the record closes on 「총 사망자 수 60명」.
 */
const HEADLINE_LABEL = '총 사망자 수'
const HEADLINE_UNIT = '명'

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
  // W2 — keyed by SITTING (the run), not by round. A live day files seven
  // reports into ONE of these entries.
  const filed = new Map<number, ReportModel>()
  /** Which rounds each sitting has already filed — a replayed stream files none twice. */
  const rounds = new Map<number, Set<number>>()
  let archive: ArchiveEntry[] = []
  let carried: string[] = []
  let rendered: ArchiveEntry[] = []
  let active: number | null = null

  // U3 — the terminal record's own identity, tracked the same way `meta`
  // already feeds the callsign below. W2 — one record per SITTING, stored with
  // it; `mountRecord()` keeps exactly one of them on the page.
  let run = 0
  let slug = ''
  let title = ''
  const records = new Map<number, HTMLElement>()

  const marks = (): MarkSets => deriveMarks(driver.store(), carried)

  /**
   * x12 — the arrival queue: land `work` once the fanfold has printed its way to
   * `cue`, and never out of turn.
   *
   * A CHAIN AND NOT A BARE `await`, because a day files seven reports and the
   * document ACCUMULATES: `accumulated(held, slice)` folds each round onto the
   * one before it and `view.append` grows the page in place, so two rounds that
   * landed in the wrong order would file the day's text out of sequence and
   * replay the wrong slice. The cues themselves already resolve in stream order
   * — the feed publishes them as it walks the queue — so the chain is not what
   * makes the ordering true; it is what stops a future cue, a slower one, or a
   * flush landing several at once from making it false.
   *
   * The chain NEVER REJECTS. Each link swallows its own failure, because a
   * report whose render threw would otherwise take every later round of the day
   * with it — a window stuck on a document that stopped growing, with nothing on
   * the desk to say why. One broken round is a bad frame; a broken chain is a
   * dead window.
   *
   * `queueMicrotask` is not an option and neither is a timer: what is being
   * waited for is another window's paper, which is real time.
   */
  let paper: Promise<void> = Promise.resolve()
  const afterPaper = (cue: FeedCue, work: () => void): void => {
    paper = paper
      .then(() => feedReached(cue))
      .then(work)
      .catch((cause: unknown) => {
        console.error('the document behind the paper never landed', cause)
      })
  }

  /**
   * Is the desk holding the tear right now?
   *
   * x10 (민서, 08-10) — mining is unavailable while the previous ECHO's 인수인계
   * 사항 is typing itself onto the incoming agent's page. The reveal happens in
   * the AGENT FILE and mining happens here, so the fact has to cross a window
   * boundary; it crosses the way this window ALREADY reaches the board a dozen
   * lines below, through `getSlotBoard()`'s singleton.
   *
   * That idiom rather than a `<body>` class or a new module of shared state:
   * `onMine` already asks the board `isLocked()`, which is the same kind of
   * question about the same object, and the board is the only thing on the desk
   * that knows a reveal is running. A body class would be a SECOND copy of that
   * knowledge, written by a component that writes no body classes today, and a
   * copy is exactly what can be left behind — a class nobody removed is a desk
   * where mining never comes back. Read straight off the owner, the hold cannot
   * outlive the thing it is about. (C8 is not bent by this: no window reaches
   * into a sibling window. The board is a `components/` module with a published
   * surface, and this window has consumed it since u6.)
   *
   * `null` — no board mounted — is not a hold. Nothing is drawing.
   */
  const mineHeld = (): boolean => getSlotBoard()?.isRevealing() ?? false

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

      // x10 — …and HELD while the handover is still arriving (민서, 08-10). The
      // gesture stops HERE, above the seat arithmetic and above `mine()`, which
      // is what makes the hold airtight rather than decorative: this is the only
      // path on the desk that reaches the `mine` op, both the click and the
      // keydown come through it (`components/report-view.ts` binds both to this
      // one callback), and the op cannot be reached by any gesture that does not.
      //
      // Silent, exactly as the `slotted`/`carried` line above is silent, and for
      // the same reason: those are the states that paint `aria-disabled`, this is
      // the third, and a control that says it is unavailable owes no flash when
      // it is pressed anyway. `view.flash` is kept for the REFUSALS below, which
      // are cases the sentence looked live for.
      //
      // Read at the moment of the gesture, never a stored copy — see `mineHeld`.
      if (board !== null && board.isRevealing()) return

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
          paintMarks()
          view.flash(id)
          return
        }
        for (const effect of outcome.effects) view.tear(effect.tear)
      }

      board.place(id, seat)
      paintMarks()
      if (board.cells()[seat] !== id) view.flash(id)
    },
  })

  /**
   * The marks on the page, plus whether the tear is available at all.
   *
   * The ONE repaint path in this window, so there is no way to refresh the marks
   * and leave the hold behind: `view.refresh` writes each sentence's own state,
   * `repaintMines` writes the desk's answer over the top, and both read the same
   * `marks()` snapshot taken here. Called on a mine, on a refused mine, and on
   * every frame the watcher at the foot of this file sees a change.
   */
  function paintMarks(): void {
    const m = marks()
    view.refresh(m)
    repaintMines(host, m, mineHeld())
  }

  /**
   * The selected run's filed report, or an empty document when none exists.
   *
   * The replay belongs to a report's FIRST arrival and to nothing else. NEW RUN
   * used to re-animate it: the next day's `meta` re-entered `sync()`, the rail
   * gained an entry, and the still-selected document blanked itself and re-typed
   * for ~4 s over the opening of a day the operator had already moved on to
   * (R4 on windows/reports.ts:90). A round replays once, then repaints whole.
   */
  const replayed = new Set<string>()

  /**
   * x6 — the sittings that have CLOSED, by run. `score` is the run's terminal
   * (every day of the loop files one: `driver/fixtures/run-loop.ts:122`), and it
   * is the only thing on the seam that says "this day is over". `report-view.ts`
   * holds the 검인 chop until the sitting it certifies is in here — a day files
   * seven reports and the receipt belongs to the day, not to the first of them.
   *
   * Keyed by SITTING, exactly as `filed` is and as `replayed`'s first half is.
   *
   * NOT seeded from `event.archive`, which is the obvious shortcut and is wrong
   * twice over. The fixture loop lists the run just OPENED in its own archive
   * (`fixtures/run-loop.ts:87` walks `RUN..run` inclusive, and its header says
   * so), so seeding would seal the live day at boot and put the chop straight
   * back under round 1 — the defect this set exists to remove. And a day
   * archived by an EARLIER session files no `report` either: its document draws
   * empty, and the view's own "there is a transmission to certify" half keeps it
   * blank whatever this set holds.
   */
  const scored = new Set<number>()

  function drawDocument(): void {
    if (active === null) return
    // The document being drawn belongs to `active`, so the signature and
    // 무전 기록's subtitle are that sitting's agent — not the desk's current
    // one. This is the only place both facts are known at once, which is why
    // the `meta` handler no longer brands (E1).
    view.brand(callsignOf(active))
    const model = filed.get(active) ?? { round: active, facts: [], report_body: [] }
    // W2 — the replay key is `sitting:round`, not the round alone: two
    // sittings both have a round 1, and the second one's arrival must not read
    // as "already replayed".
    const key = `${active}:${model.round}`
    const first = model.report_body.length > 0 && !replayed.has(key)
    if (first) replayed.add(key)
    // x6 — the seal BEFORE the draw, so the render's first reconciliation
    // already knows what it is looking at. The chop is per-sitting: the rail
    // can hand back any past day and every past day has closed, so only the one
    // still being played comes back unsealed.
    view.seal(scored.has(active))
    view.render(model, marks(), { replay: first })
    mountRecord()
  }

  /** Exactly one record is on the page: the active sitting's, or none. */
  function mountRecord(): void {
    const docFacts = host.querySelector('article.doc-facts')
    if (docFacts === null) return
    for (const [sitting, node] of records) {
      if (sitting === active) {
        if (node.parentElement !== docFacts) docFacts.append(node)
      } else {
        node.remove()
      }
    }
  }

  /**
   * `draw: false` — the rail is reconciled but the document is left alone,
   * because `view.append()` has just grown it in place. Redrawing there would
   * blank the sitting and re-type it, which is the very thing the `replayed`
   * set exists to prevent (R4 on windows/reports.ts:90).
   */
  function sync(draw = true): void {
    // A sitting the desk has a file for is one that filed a report OR earned a
    // record. The lapse drill files no report at all, and its record still
    // belongs to a day the operator can select.
    // …plus the sitting on the desk right now, which has filed nothing yet and
    // earned no record. Without it a day has no tab of its own until its first
    // report lands, so the rail offers every past sitting and not the one being
    // played. `run` is 0 only before the first `meta`, and a rail entry for run
    // 0 would be a sitting that does not exist.
    const live = run > 0 ? [run] : []
    const entries = railEntries(archive, [...new Set([...filed.keys(), ...records.keys(), ...live])])
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
    if (draw) drawDocument()
  }

  /**
   * The terminal record's model, built from the `score` event alone.
   *
   * x4 — `row.value` rides across in the seam's own `string | number` union
   * instead of being stringified here, because `score-tally.ts` decides the
   * unit off exactly that distinction. `row.baseline` and `event.baseline_total`
   * are read by nothing now: the 기준 column left with the table (see that
   * module's header). They stay on the seam, unread by the view.
   */
  function scoreModel(event: Extract<ViewEvent, { type: 'score' }>): TallyModel {
    return {
      doc: `${DOC_CAPTION}${PORTAL.portalCode}/TL/${slug}/${pad2(run)}`,
      title,
      run,
      headline: { label: HEADLINE_LABEL, value: event.total, unit: HEADLINE_UNIT },
      rows: event.rows.map((row) => ({ label: row.label, value: row.value })),
    }
  }

  driver.subscribe((event) => {
    if (event.type === 'meta') {
      archive = [...event.archive]
      carried = [...event.carried]
      // x5 — a NEW SITTING takes the rail. `sync()` keeps whatever `active`
      // already names as long as the rail still offers it, which is right for
      // every other reason the rail reconciles (an archive-only `meta`, a
      // re-selection) and wrong for the one that matters: the operator presses
      // 파견, the day restarts, and the desk left them reading the day they had
      // just finished with while the new one filled in on a tab behind it. The
      // AGENT FILE already turns to the new agent's page on this same event
      // (`turn('last')`); this is REPORTS keeping step with it.
      if (event.run !== run) active = event.run
      run = event.run
      // The callsign is NOT branded here any more. `brand()` re-writes the
      // signature and 무전 기록's subtitle on the document that is mounted, and
      // the mounted document is the SELECTED sitting's — which is not
      // necessarily this event's run. Branding on `meta` signed every archived
      // report with whoever was on duty when it was opened. `drawDocument()`
      // owns it now, because that is where the selection is known.
      sync()
      return
    }
    if (event.type === 'score') {
      // x6 — the day is over. This is the ONE thing on the seam that says so,
      // and the 검인 chop in 무전 기록 waits on it: the receipt belongs to the
      // sitting, and a sitting is seven reports.
      scored.add(run)
      // Unmineable by construction: no `.min` node, no `sentence_id` — this
      // is a terminal, autopsy-window record, not a source document.
      //
      // W2 — the record belongs to its SITTING and is stored with it. It used
      // to be one element the next `score` replaced whole, so a past day's
      // document was read under the latest day's 집계표. Exactly one is ever
      // mounted: `mountRecord()` attaches the active sitting's and detaches
      // every other.
      records.get(run)?.remove()
      const node = el('article', 'terminal-record')
      node.setAttribute('aria-label', '시행 결과')
      records.set(run, node)
      // The scored day takes the rail and the record mounts under it. Going
      // through `sync()` rather than straight to `mountRecord()` is what covers
      // a day that filed NO report (`?drill=tally-lapse`): without a rail
      // identity of its own, that sitting was never the active one and its
      // record had nowhere to land.
      active = run
      // `draw: false`, and then mount by hand. `score` lands in the same beat
      // as the day's own report, which at that moment is still writing itself
      // out — a redraw here repaints the body whole and kills the replay
      // mid-sentence (`e2e/reports.spec.ts:334`). The rail still reconciles, so
      // a day that filed no report still takes its identity.
      sync(false)
      mountRecord()
      // x6 — and seal by hand, for the same reason the record mounts by hand:
      // `draw: false` never reaches `drawDocument()`, which is where a sitting
      // normally learns whether it has closed. Nothing is stamped in this beat —
      // the day's own report is mid-sentence and the view holds the chop until
      // that replay finishes.
      view.seal(scored.has(active))
      const tally = createScoreTally({ host: node })
      tally.open()
      // x12 — THE RECORD IS ON THE DESK NOW; THE NUMBER IS NOT. `open()` leaves
      // it `pending` — the article mounted, blank, waiting — and the count-up
      // runs when the fanfold has printed its way to this same `score`, which is
      // where it mints the day's 집계 line. The record and that line are two
      // printings of one count, and the ledger rolling to a total the paper had
      // not reached yet was the outcome arriving ahead of its own last sentence.
      //
      // The MODEL is built here and not in there. It is this day's — `run`,
      // `slug` and the event's own rows — and by the time the paper catches up
      // the desk may be on the next sitting; a model read late would be the same
      // event scored against whatever `run` had become.
      const record = scoreModel(event)
      const sitting = run
      afterPaper({ at: 'score', run: sitting }, () => tally.run(record))
      return
    }
    if (event.type !== 'report') return
    // W2 — the seam types `report` with a ROUND, and a live day has seven of
    // them (`tests/driver/live-desk.test.ts:126`). The SITTING it belongs to is
    // the run `meta` last named; pairing the two here is what collapses seven
    // rail tabs into one accumulating document. A round is filed once — a
    // replayed stream must not double the day.
    //
    // x12 — captured HERE and read inside the gate, because that is the pairing
    // itself: the run the desk was on when the round arrived. The whole body
    // below runs behind the paper, `rounds` and `filed` included — deliberately.
    // Filing the round early and drawing it late would leave the two out of
    // step, and a rail reconcile in between (a `meta` arriving, a tab pressed)
    // reaches `drawDocument()`, which would then paint a round the fanfold has
    // not printed the beats of — the gate defeated by the one path that does not
    // go through it.
    const sitting = run
    afterPaper({ at: 'report', run: sitting, round: event.round }, () => {
      const seen = rounds.get(sitting) ?? new Set<number>()
      if (seen.has(event.round)) return
      seen.add(event.round)
      rounds.set(sitting, seen)

      const held = filed.get(sitting) ?? null
      const slice: ReportModel = {
        round: event.round,
        facts: event.facts,
        report_body: event.report_body,
      }
      const whole = accumulated(held, slice)
      filed.set(sitting, whole)

      // The sitting already on the desk GROWS; any other case draws whole.
      if (held !== null && active === sitting) {
        replayed.add(`${sitting}:${event.round}`)
        view.append(slice, whole, marks())
        sync(false)
        return
      }
      active = sitting
      sync()
    })
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
  //
  // x10 — the HOLD rides the same stamp, and it has to: the reveal is not an
  // event either, and both of its edges have to reach the page. Its start is what
  // marks every sentence `aria-disabled`, and its end is what takes that back —
  // including the ends nothing else on the desk hears about, the watchdog's and
  // an interrupted reveal's, because the stamp is asking the board what is true
  // now rather than being told what happened. This is also why a stuck gate is
  // not reachable from here: the watcher runs for the life of the window, so the
  // frame after `isRevealing()` goes false is a frame that repaints.
  const slotStamp = (): string => {
    const store = driver.store()
    return `${Object.values(store.slots).join(',')}|${store.mined.join(',')}|${carried.join(',')}|${mineHeld()}`
  }
  let marked = slotStamp()
  const watch = (): void => {
    const next = slotStamp()
    if (next !== marked) {
      marked = next
      paintMarks()
    }
    requestAnimationFrame(watch)
  }
  requestAnimationFrame(watch)
}

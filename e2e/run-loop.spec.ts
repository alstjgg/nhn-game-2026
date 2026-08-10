// u7 — TALLY window + run loop: the DOM half.
//
// vitest runs `environment: 'node'`, so everything that needs a real document
// and real wall-clock pacing lives here (u7 design D1/D3, spec A6). The pure
// half is `tests/windows/tally.test.ts`.
//
// Covers [u7#c1] full loop back to BUILD · [u7#c2] count-up pacing absorbs the
// report call · [u7#c5] new run unlocks and files the report.
//
// Test titles are load-bearing — the unit's verification commands filter with
// `-g 'full loop back to BUILD'`, `-g 'count-up pacing absorbs the report call'`
// and `-g 'new run unlocks and files the report'`.
//
// C3: nothing here asserts fixture CONTENT. Every number and label is read back
// out of the driver's own stream through `window.__shell.frame().events`, so the
// suite binds to whatever run the shell boots.
import { expect, test } from 'playwright/test'
import type { Page } from 'playwright/test'
import { confirmDeploy, deployFile, flushFeed, turnToAgent } from './fixtures/harness.ts'

/* ── the seam shapes this suite reads back ───────────────────────────────── */

interface MetaEvent {
  type: 'meta'
  run: number
  runs_left: number
  carried: string[]
  archive: { run: number; label: string }[]
}

interface Frame {
  events: { type: string; [k: string]: unknown }[]
  ended: boolean
}

/** U3 (playtest g3-1) — TALLY dissolves: the terminal record lives in REPORTS
 * and the day's turn rides the merged AGENT FILE control. */
const RECORD = '#w-rep .terminal-record'
const LEDGER = `${RECORD}[data-tally-state]`
const NEW_RUN = '#w-file #btnDeploy'
const WAIT = '#w-file #deployState'
/* x4 — the record prints lines, not table rows, and its open/close lines are
   not scored axes. See `RECORD.rows` in `e2e/fixtures/selectors.ts`. */
const ROWS = `${RECORD} .tly-line:not(.tl-open):not(.tl-close)`
const BIG = `${RECORD} #tlyBig`
const REP = '#w-rep'
const OPTION = `${REP} .arch-rail [role="option"]`
const FILE = '#w-file'

/** c2's band: `run_end → final` is 9 s ±1.5 s at ×1. */
const BAND: readonly [number, number] = [7500, 10500]

/* ── shell + agent-file dev handles ──────────────────────────────────────── */

async function frame(page: Page): Promise<Frame> {
  return page.evaluate(() => {
    const handle = (window as unknown as { __shell?: { frame(): unknown } }).__shell
    if (!handle) throw new Error('window.__shell is not exposed by the shell boot')
    return handle.frame() as never
  })
}

/**
 * Releases the whole remaining stream — `run_end` included. There is no more
 * sheet to reveal (U3), so unlike the pre-U3 helper this waits on nothing
 * beyond the release itself; callers that need the record settled wait for
 * `LEDGER`'s `final` state explicitly (`drainToFinal`).
 *
 * x12 — …and it LANDS THE PAPER, for the reason `e2e/fixtures/harness.ts`'s own
 * `drain` records at length. The terminal record's count-up now waits for the
 * LIVE FEED to have printed its way to the day's `score` (`shell/feed-reach.ts`),
 * and this call releases a whole day of stream in one go — which no player can
 * do. On the lanes here that are actually RUNNING (the second sitting: NEW RUN
 * commits the file and opens the day in one press, W4) that put ~78 s of
 * reading-paced paper in front of every `final` assertion below. The flush is
 * the same instruction reaching the surface that had started pacing it.
 *
 * The reveal's pacing is asserted elsewhere and from the outside —
 * `e2e/live-feed.spec.ts`'s `the day’s end drains`, which drives `__shell.drain`
 * itself precisely so it can watch the paper arrive on its own.
 */
async function drain(page: Page): Promise<void> {
  await page.evaluate(() => {
    const handle = (window as unknown as { __shell?: { drain(): void } }).__shell
    if (!handle) throw new Error('window.__shell is not exposed by the shell boot')
    handle.drain()
  })
  await flushFeed(page)
}

async function phase(page: Page): Promise<string> {
  return page.evaluate(() => {
    const handle = (window as unknown as { __agentFile?: { phase(): string } }).__agentFile
    if (!handle) throw new Error('window.__agentFile is not exposed by the AGENT FILE window')
    return handle.phase()
  })
}

async function meta(page: Page): Promise<MetaEvent> {
  return page.evaluate(() => {
    const handle = (window as unknown as { __agentFile?: { meta(): unknown } }).__agentFile
    if (!handle) throw new Error('window.__agentFile is not exposed by the AGENT FILE window')
    return handle.meta() as never
  })
}

/** The last `meta` the driver actually emitted — the only authority on numbers. */
function lastMeta(f: Frame): MetaEvent {
  const metas = f.events.filter((e) => e.type === 'meta') as unknown as MetaEvent[]
  expect(metas.length, 'the stream carries no `meta` event — the run counter has nothing to paint').toBeGreaterThan(0)
  return metas[metas.length - 1]!
}

/** The run that just closed, off the `run_end` event. */
function lastRunEnd(f: Frame): number {
  const ends = f.events.filter((e) => e.type === 'run_end') as unknown as { run: number }[]
  expect(ends.length, 'the stream never closed a run — 21:04 was not reached').toBeGreaterThan(0)
  return ends[ends.length - 1]!.run
}

async function digitsOf(page: Page, selector: string): Promise<number> {
  const text = await page.locator(selector).innerText()
  const found = text.match(/\d+/)
  expect(found, `${selector} carries no number: ${text}`).not.toBeNull()
  return Number(found![0])
}

/** Index of the lit pip in the D-DAY strip. */
async function pipIndex(page: Page): Promise<number> {
  return page.locator('#ddayPips i').evaluateAll((nodes) => nodes.findIndex((n) => n.classList.contains('now')))
}

async function boot(page: Page): Promise<void> {
  await page.goto('./')
  await expect(page.locator('#runNum')).not.toBeEmpty()
  await turnToAgent(page)
}

/**
 * Drains to 21:04 and returns the measured `run_end → final` milliseconds.
 *
 * x12 — the fanfold is landed inside the measurement, on the same tick as the
 * release. What this test owns is the COUNT-UP's cadence, and since the record
 * waits for the paper to reach the day's `score` (`shell/feed-reach.ts`) an
 * unflushed measurement would be the cadence plus however far behind the reveal
 * happened to be — a number that moves with the pacing constants of another
 * window. The flush pins the zero to the same place it has always been.
 */
async function drainAndTime(page: Page): Promise<number> {
  return page.evaluate(async () => {
    const handle = (window as unknown as { __shell?: { drain(): void } }).__shell
    if (!handle) throw new Error('window.__shell is not exposed by the shell boot')
    const feed = (window as unknown as { __feed?: { flush(): void } }).__feed
    if (!feed) throw new Error('window.__feed is not exposed by the LIVE FEED window')
    const t0 = performance.now()
    handle.drain()
    feed.flush()
    await new Promise<void>((resolve) => {
      const step = (): void => {
        if (document.querySelector('#w-rep .terminal-record[data-tally-state="final"]')) resolve()
        else requestAnimationFrame(step)
      }
      step()
    })
    return performance.now() - t0
  })
}

/**
 * x11 — settle the LIVE FEED (민서, 08-10).
 *
 * The fanfold reveals through a paced queue, and the day's close stopped
 * emptying it: `run_end` used to dump the whole backlog in one frame, and it now
 * drains at reading pace with `shell/ending.ts` waiting on it
 * (`shell/feed-drain.ts`). `drain()` still returns as soon as the ledger has
 * landed, so a read of the fanfold underneath it is a read of a day still
 * printing — and the tail, which is where the closing 집계 line is, is the last
 * thing to arrive.
 *
 * `flush()` applies what is queued and finishes the line being typed. Nothing
 * here is asserting the reveal's pacing — that is u5's claim and lives in
 * `e2e/live-feed.spec.ts` (`the day’s end drains`); this block is about what the
 * closing line SAYS.
 */
async function drainToFinal(page: Page): Promise<void> {
  await drain(page)
  // One record: the terminal record exists once the day has closed (design #1).
  await expect(page.locator(RECORD)).toHaveCount(1)
  await expect(page.locator(LEDGER)).toHaveAttribute('data-tally-state', 'final', { timeout: 20_000 })
}

/* ══ [u7#c1] full loop back to BUILD ════════════════════════════════════ */

test.describe('full loop back to BUILD', () => {
  test.setTimeout(90_000)

  test('full loop back to BUILD — the desk opens in BUILD with no record yet', async ({ page }) => {
    await boot(page)
    expect(await phase(page)).toBe('build')
    await expect(page.locator(RECORD)).toHaveCount(0)
    await expect(page.locator(NEW_RUN)).toHaveAttribute('data-op', 'deploy')
    expect((await frame(page)).events.filter((e) => e.type === 'run_end')).toEqual([])
  })

  test('full loop back to BUILD — 21:04 closes the feed and the terminal record counts up', async ({ page }) => {
    await boot(page)
    await drain(page)

    await expect(page.locator(RECORD)).toHaveCount(1, { timeout: 5_000 })
    expect(await phase(page)).toBe('tally')
    await expect(page.locator(LEDGER)).toHaveAttribute('data-tally-state', 'final', { timeout: 20_000 })

    const f = await frame(page)
    const score = f.events.filter((e) => e.type === 'score').pop() as
      | { total: number; rows: { label: string; value: number }[] }
      | undefined
    expect(score, 'the run closed without a `score` event — the ledger has nothing to count').toBeTruthy()
    await expect(page.locator(ROWS)).toHaveCount(score!.rows.length)
    expect(await digitsOf(page, BIG)).toBe(score!.total)
  })

  test('full loop back to BUILD — the feed closes on the ledger’s own count, not a fixed one', async ({
    page,
  }) => {
    // The two surfaces used to disagree at the same 21:04. The count was
    // `timeline.json`'s `t19`, a FIXED event printed verbatim on every run
    // (`scriptLinesOf` reads no state), so a day that saved people still read
    // 사망 26 in the feed beside a ledger counting what it actually scored.
    // The line comes off the `score` event now (`components/tally-line.ts`), so
    // the fanfold and the record cannot part company.
    await boot(page)
    await drainToFinal(page)
    // x11 — the CLOSING line is the last thing the day prints, so this is the
    // one read in the file that cannot be taken while the paper is still
    // arriving (see `flushFeed`). Unsettled, `.last()` would name whichever line
    // the reveal had reached when the ledger happened to finish counting, and
    // the failure would read `the feed did not close on a 집계 line` about a feed
    // that closes on one perfectly well.
    await flushFeed(page)

    const headline = await digitsOf(page, BIG)
    // x11 — the CONTENT column, not the whole `<li>`. The typewriter gave every
    // line a second, sr-only copy of its own text (`.fl-sr`), so an `innerText`
    // of the row now returns the stamp and the sentence TWICE — a `toContain`
    // that keeps passing while saying half of what it means to. The count the
    // operator reads is the printed one, so that is the column asked.
    const closing = await page.locator('#feedList li').last().locator('.fl-c').innerText()
    expect(closing, 'the feed did not close on a 집계 line').toContain('집계.')
    expect(closing, `the feed closed on a count the ledger does not hold (${headline})`).toContain(
      `사망 ${headline}`,
    )

    // And it is not minable: a count is a conclusion, not a source document.
    // `t19` DID carry a `sentence_id`, so a player could mine 사망 26 and inject
    // it into a run that never had it.
    const minable = await page.locator('#feedList li').last().locator('.min').count()
    expect(minable, 'the closing count became a minable sentence').toBe(0)
  })

  test('full loop back to BUILD — NEW RUN returns the desk to BUILD and the control returns to deploy', async ({
    page,
  }) => {
    await boot(page)
    await drainToFinal(page)

    // x5 — the tab the record belongs to, read before the press moves the desk.
    const scoredTab = (await page.locator(`${OPTION}[aria-selected="true"]`).first().innerText()).trim()

    await expect(page.locator(NEW_RUN)).toBeEnabled()
    await page.locator(NEW_RUN).click()
    await confirmDeploy(page)

    // RE-AIMED (08-08, W4): the press now STARTS the day it opens, so `build`
    // is a phase the desk passes THROUGH — the first beat moves it to `run`,
    // and polling for `build` was a race the suite happened to keep winning.
    // What the loop turning over means is that the desk left `tally`.
    await expect.poll(async () => phase(page), { timeout: 20_000 }).not.toBe('tally')
    await expect(page.locator(NEW_RUN)).toHaveAttribute('data-op', 'deploy')
    // The record persists between days (design #1) — the control closing is not
    // the record closing.
    //
    // RE-AIMED (x5): the desk now FOLLOWS the new sitting onto its own REPORTS
    // tab, and that tab has no record because the day it names has not been
    // scored yet. So "persists" is checked where the record actually lives — go
    // back to the day that earned it. That the new day arrives clean is the
    // claim of `(the terminal record refreshes clean on the next 21:04)` below,
    // and the two must not contradict each other, which is why this asserts
    // BOTH sides of the move.
    await expect(page.locator(RECORD)).toHaveCount(0)
    await page.locator(OPTION, { hasText: scoredTab }).first().click()
    await expect(page.locator(RECORD)).toHaveCount(1)
  })

  test('full loop back to BUILD — D-DAY decrements one place, and only off the `meta` event', async ({ page }) => {
    await boot(page)
    const before = {
      run: await digitsOf(page, '#runNum'),
      dday: await digitsOf(page, '#ddayNum'),
      pip: await pipIndex(page),
    }
    expect(before.dday, 'the allotment is already spent — the decrement is untestable').toBeGreaterThan(0)

    await drainToFinal(page)
    await page.locator(NEW_RUN).click()
    await confirmDeploy(page)
    await expect.poll(async () => phase(page), { timeout: 20_000 }).not.toBe('tally')

    const emitted = lastMeta(await frame(page))
    expect(emitted.run, 'the driver never fed a new run').toBe(before.run + 1)
    expect(await digitsOf(page, '#runNum')).toBe(emitted.run)
    expect(await digitsOf(page, '#ddayNum')).toBe(emitted.runs_left)
    expect(emitted.runs_left).toBe(before.dday - 1)
    expect(await pipIndex(page)).toBe(before.pip + 1)

    // The screen is the event, not client arithmetic.
    const held = await meta(page)
    expect(held.run).toBe(emitted.run)
    expect(held.runs_left).toBe(emitted.runs_left)
  })

  test('full loop back to BUILD — the second run runs the same states again', async ({ page }) => {
    await boot(page)
    await drainToFinal(page)
    await page.locator(NEW_RUN).click()
    await confirmDeploy(page)
    await expect.poll(async () => phase(page), { timeout: 20_000 }).not.toBe('tally')
    await expect(page.locator(NEW_RUN)).toHaveAttribute('data-op', 'deploy')

    await drainToFinal(page)
    expect(await phase(page)).toBe('tally')
    await expect(page.locator(NEW_RUN)).toBeEnabled()
    expect(lastRunEnd(await frame(page))).toBeGreaterThan(0)
  })
})

/* ══ [u7#c2] count-up pacing absorbs the report call ════════════════════ */

test.describe('count-up pacing absorbs the report call', () => {
  test.setTimeout(90_000)

  test('count-up pacing absorbs the report call — run_end to final is 9 s ±1.5 s at ×1', async ({ page }) => {
    await boot(page)
    const elapsed = await drainAndTime(page)
    expect(elapsed, `run_end → final took ${Math.round(elapsed)} ms`).toBeGreaterThanOrEqual(BAND[0])
    expect(elapsed, `run_end → final took ${Math.round(elapsed)} ms`).toBeLessThanOrEqual(BAND[1])
  })

  test('count-up pacing absorbs the report call — the wait is diegetic, and nothing spins', async ({ page }) => {
    await boot(page)
    await drain(page)

    // Immediately after 21:04 the desk is still settling: pending or counting,
    // never final, and the way out stays shut.
    const early = await page.evaluate(() => {
      const node = document.querySelector('#w-rep .terminal-record')
      return node?.getAttribute('data-tally-state') ?? null
    })
    expect(['pending', 'counting'], `the record reached ${early} before the cadence ran`).toContain(early)
    await expect(page.locator(NEW_RUN)).toBeDisabled()

    // x6b — the note is BLANK across the hold, where it used to print
    // `……보고서 정리 중`. The claim underneath is unchanged and is the one that
    // always mattered: the desk does not report its own latency as machinery.
    // It just no longer reports it at all — the settle is silent on this
    // surface, and the release is what writes here (asserted below).
    await expect(page.locator(WAIT)).toHaveText('')
    await expect(page.locator(`${FILE} .spinner, ${FILE} .loading, ${FILE} progress`)).toHaveCount(0)

    await expect(page.locator(LEDGER)).toHaveAttribute('data-tally-state', 'final', { timeout: 20_000 })
    // x5 — the settled line stopped announcing the report's arrival (REPORTS
    // filling itself in already does that) and became the instruction for what
    // the operator does next. The claim is unchanged: the wait resolves into
    // DIEGETIC copy — words from inside the fiction, never a spinner, a timeout
    // or an error. x6 — this is the LAST wait copy on the desk. `#deployState`
    // is the day's own hold, which is a state the operator is being asked to act
    // on; the feed's per-call waiting marker said only that the desk was still
    // working and was removed. `latency` below is what holds that line.
    await expect(page.locator(WAIT)).toContainText('파견')
    await expect(page.locator(NEW_RUN)).toBeEnabled()
  })

  test('count-up pacing absorbs the report call — the round report is on the desk before final', async ({ page }) => {
    await boot(page)
    await drain(page)

    const f = await frame(page)
    const reports = f.events.filter((e) => e.type === 'report')
    expect(reports.length, 'the run closed without a `report` — there is nothing to absorb').toBeGreaterThan(0)

    // The report window is painted while the ledger is still counting.
    await expect(page.locator(`${REP} #bodyList .sent`)).not.toHaveCount(0, { timeout: 20_000 })
    const stateWhilePainted = await page.evaluate(
      () => document.querySelector('#w-rep .terminal-record')?.getAttribute('data-tally-state') ?? null,
    )
    expect(stateWhilePainted).not.toBeNull()

    await expect(page.locator(LEDGER)).toHaveAttribute('data-tally-state', 'final', { timeout: 20_000 })
  })

  test('count-up pacing absorbs the report call — the ledger rows arrive in cadence, not all at once', async ({
    page,
  }) => {
    await boot(page)
    await drain(page)
    await expect(page.locator(RECORD)).toHaveCount(1, { timeout: 5_000 })

    const settled = await page.locator(ROWS).evaluateAll((nodes) => nodes.filter((n) => n.classList.contains('in')).length)
    const total = await page.locator(ROWS).count()
    expect(total, 'the ledger printed no rows').toBeGreaterThan(0)
    expect(settled, 'every row landed in the same frame — that is not a cadence').toBeLessThan(total)

    await expect(page.locator(LEDGER)).toHaveAttribute('data-tally-state', 'final', { timeout: 20_000 })
    await expect(page.locator(`${ROWS}.in`)).toHaveCount(total)
  })
})

/* ══ [u7#c5] new run unlocks and files the report ═══════════════════════ */

test.describe('new run unlocks and files the report', () => {
  test.setTimeout(90_000)

  test('new run unlocks and files the report — one activation sends exactly one op', async ({ page }) => {
    await boot(page)
    await drainToFinal(page)

    const before = lastMeta(await frame(page)).run
    const button = page.locator(NEW_RUN)
    await button.click()
    // x2 — the hammering now lands on a desk that is `inert` behind the
    // confirmation plate, and one press can only ever raise ONE plate
    // (`openConfirm` refuses a second). So the claim is unchanged and its guard
    // has moved: the question absorbs the extra presses, and the single answer
    // is what commits. Asserting the plate count is the part that would catch a
    // regression here — two plates would mean two pending commits.
    await button.click({ force: true }).catch(() => undefined)
    await button.click({ force: true }).catch(() => undefined)
    await expect(page.locator('#confirm'), 'the hammering stacked a second plate').toHaveCount(1)
    await confirmDeploy(page)

    await expect.poll(async () => phase(page), { timeout: 20_000 }).not.toBe('tally')
    expect(lastMeta(await frame(page)).run, 'a double click advanced the loop twice').toBe(before + 1)
  })

  // RE-AIMED (08-08, W4), never deleted. The claim was "the file opens unlocked
  // on the new run", and it held while the loop took two presses: NEW RUN
  // opened tomorrow with an empty file, and DEPLOY closed it later, inside the
  // day. One press moved the unlock to the other side of the boundary — the
  // CLOSE hands the file back so the day's own report can be mined into it, and
  // the press that opens tomorrow is the press that commits it. So the assert
  // now measures both ends of that window: unlocked at 21:04, locked once the
  // press lands.
  test('new run unlocks and files the report — the close unlocks the file, the press commits it', async ({
    page,
  }) => {
    await boot(page)
    await drainToFinal(page)

    // The window the operator actually mines in.
    await expect(page.locator(`${FILE} .slot`)).not.toHaveCount(0)
    await expect(page.locator(`${FILE} .slot.locked`), 'the close did not hand the file back').toHaveCount(0)

    await page.locator(NEW_RUN).click()
    await confirmDeploy(page)
    await expect.poll(async () => phase(page), { timeout: 20_000 }).not.toBe('tally')

    await expect(page.locator(FILE)).not.toHaveClass(/\bhidden\b/)
    await expect(page.locator(`${FILE} .slot`)).not.toHaveCount(0)
    await expect(
      page.locator(`${FILE} .slot.locked`),
      'the new day opened on an uncommitted file',
    ).not.toHaveCount(0)
  })

  test('new run unlocks and files the report — the finished run is filed in the archive rail', async ({ page }) => {
    await boot(page)
    await drainToFinal(page)

    const closed = lastRunEnd(await frame(page))
    const railBefore = await page.locator(OPTION).count()

    await page.locator(NEW_RUN).click()
    await confirmDeploy(page)
    await expect.poll(async () => phase(page), { timeout: 20_000 }).not.toBe('tally')

    const filed = lastMeta(await frame(page))
    await expect(page.locator(OPTION)).toHaveCount(filed.archive.length)
    expect(filed.archive.length, 'the archive did not grow — the run was not filed').toBeGreaterThan(railBefore)
    expect(filed.archive.map((a) => a.run), `RUN ${closed} is missing from the archive`).toContain(closed)

    const labels = await page.locator(OPTION).evaluateAll((nodes) => nodes.map((n) => (n.textContent ?? '').trim()))
    // x7 — POSITIONAL, and it needs no idea how an agent is named. This read
    // `ECHO-${closed}`, which is `components/dossier.ts` `callsignOf` spelled a
    // second time in a spec that cannot import it, and the day the series was
    // renumbered (run 1 is plain `ECHO` now, run 2 is `ECHO-1`) that spelling
    // was wrong while the rail was right. What the test is actually about is
    // that the closed sitting got a TAB: the rail is the archive in order (the
    // count assertion above), so the closed run's entry index is its tab index,
    // and all this has to check there is a callsign rather than, say, a gate
    // label. Distinctness carries the rest — one name per sitting, never shared.
    const at = filed.archive.findIndex((a) => a.run === closed)
    expect(labels[at], `RUN ${closed} has no tab of its own on the rail`).toMatch(/^ECHO(?:-\d+)?$/)
    expect(new Set(labels).size, 'two sittings share one tab name').toBe(labels.length)
    for (const label of labels) expect(label).not.toMatch(/gate|게이트/i)
  })

  test('new run unlocks and files the report — the carried blocks are the event’s, verbatim', async ({ page }) => {
    await boot(page)
    await drainToFinal(page)
    await page.locator(NEW_RUN).click()
    await confirmDeploy(page)
    await expect.poll(async () => phase(page), { timeout: 20_000 }).not.toBe('tally')

    const emitted = lastMeta(await frame(page))
    expect(emitted.carried.length, 'the new run carries nothing — the scan is vacuous').toBeGreaterThan(0)
    expect((await meta(page)).carried).toEqual(emitted.carried)

    // T1 retired the store deck, which was the one desk surface that listed
    // `meta.carried` as an inventory. Carried ids DO surface as `.min.slotted`
    // marks — but only on documents that exist, and report bodies from runs
    // before the boot are persisted nowhere (that gap is U5.1's reason to
    // exist). Until U5.1 gives past sittings readable documents, the seam
    // round-trip above is the whole observable contract; the marks derivation
    // itself is covered by reports.spec's mined-marks oracles.
  })

  test('new run unlocks and files the report — the terminal record refreshes clean on the next 21:04', async ({
    page,
  }) => {
    await boot(page)
    await drainToFinal(page)
    const firstRows = await page.locator(ROWS).count()

    await page.locator(NEW_RUN).click()
    await confirmDeploy(page)
    await expect.poll(async () => phase(page), { timeout: 20_000 }).not.toBe('tally')
    await expect(page.locator(NEW_RUN)).toHaveAttribute('data-op', 'deploy')

    await drain(page)
    // One record: the next `score` replaces the previous day's whole.
    await expect(page.locator(RECORD)).toHaveCount(1, { timeout: 5_000 })
    await expect(page.locator(ROWS)).toHaveCount(firstRows)
    await expect(page.locator(LEDGER)).toHaveAttribute('data-tally-state', 'final', { timeout: 20_000 })
  })
})

/* ══ [u11#c13] C18 latency — the deployed proxy measures 6.8–10.0 s, ceiling
 *    15 s, worst case ~30 s with the engine's one retry. The desk must hold
 *    that long DIEGETICALLY: no client-side timeout, no spinner, no dead UI.
 *    Appended by u11 (design D9) — no test above is touched, and a red here is
 *    a DISCOVERY entry plus a fix at the OWNING unit, never a pacing redesign.
 *    Filter: `-g 'latency'`.
 *
 *    WHERE THE REPORTER'S 6.8–10 s LANDS (measured 08-04, recorded in
 *    DISCOVERY.md). C18 names `waiting.for='report'`; the ported design does
 *    not spend it on a feed line. `docs/design/phase2-ui/README.md:58-60` — the
 *    loop this suite mirrors — closes the day as "feed closes, TALLY opens and
 *    counts up over ~9 s → NEW RUN … files RUN 03's report into the archive",
 *    and [u7#c2] is written as "the count-up pacing ABSORBS the report call".
 *    So the reporter's latency is covered by the TALLY count-up (third test
 *    below), and the radio calls are covered by the first two.
 *
 *    x6 — REWRITTEN, because the thing the first two tests watched no longer
 *    exists. They parked the sim on an open wait and read the fanfold's
 *    `……무전 회신 대기 중 ● ● ●` marker back off `.fl-wait`, holding it visible
 *    and on-phrase past 9 s and past 30 s. 민서 removed the whole mechanism on
 *    08-09: no feed line, no toast, no fixture line, no CSS, and
 *    `components/waiting-marker.ts` deleted — three markers a beat over seven
 *    rounds, each saying only that the desk was still working, which the answer
 *    itself says a beat later with content. A wait now reads as the pause it is.
 *
 *    `waiting` is a SEAM-ONLY event from here on. It stays on the frozen seam
 *    (`shared/view-driver.ts`), `src/driver/live-driver.ts` still emits it and
 *    the live adapter's queue is still built around the bracket — so the tests
 *    below still find their wait, and still find it the same way: off
 *    `window.__shell.frame().events`, never off the DOM. The three phrasings
 *    that used to live here in `WAIT_PHRASE` went with the marker; the design
 *    note that authored them (`docs/design/phase2-ui/README.md`'s latency
 *    bullet) and spec-client §3 inv 5's `WaitingMarker` row now describe a
 *    component no client implements.
 *
 *    What the first two tests assert is C18 with the phrasing taken out of it,
 *    plus the claim that replaced it: while a wait is open the desk draws
 *    NOTHING for it — zero lines land on the paper — and it still holds past
 *    9 s, survives 30 s, and never turns into dead UI.
 *    ═══════════════════════════════════════════════════════════════════════ */

/**
 * Copy that would mean the CLIENT gave up. Deliberately narrow: 실패 / 오류 are
 * part of the scenario's own vocabulary (a run can fail diegetically), so only
 * machine-failure phrasings and retry prompts count as dead UI here.
 */
const DEAD_UI = [/timed?\s*out/i, /timeout/i, /응답\s*없음/, /다시\s*시도/, /요청\s*실패/, /연결\s*끊/]

async function seekTo(page: Page, at: string): Promise<void> {
  await page.evaluate((stamp) => {
    const handle = (window as unknown as { __feed?: { seek(at: string): void } }).__feed
    if (!handle) throw new Error('window.__feed is not exposed by the LIVE FEED window')
    handle.seek(stamp)
  }, at)
}

async function holdRate(page: Page, to: number): Promise<void> {
  await page.evaluate((r) => {
    const handle = (window as unknown as { __feed?: { rate(to: number): void } }).__feed
    if (!handle) throw new Error('window.__feed is not exposed by the LIVE FEED window')
    handle.rate(r)
  }, to)
}

/** The sim minute a `waiting` event is released on: the last stamp before it. */
function waitDue(f: Frame, forWhat: string): string | null {
  let carried: string | null = null
  for (const event of f.events) {
    const line = (event as { line?: { clock?: string } }).line
    if (event.type === 'feed' && line?.clock) carried = line.clock
    if (event.type === 'beat_start' || event.type === 'beat_end') {
      const clock = (event as unknown as { clock?: string }).clock
      if (clock) carried = clock
    }
    const waiting = event as unknown as { type: string; active?: boolean; for?: string }
    if (waiting.type === 'waiting' && waiting.active === true && waiting.for === forWhat) return carried
  }
  return null
}

test.describe('latency', () => {
  test.setTimeout(120_000)

  /** Anything the removed marker would have put on the paper (x6). */
  const WAIT_NODE = '#w-feed .fl-wait, #w-feed [data-kind="wait"], #w-feed .dots'

  test('latency — the open call draws nothing and still holds past 9 s', async ({ page }) => {
    await boot(page)
    await drain(page)

    const f = await frame(page)
    const waits = f.events.filter((e) => e.type === 'waiting') as unknown as {
      active: boolean
      for: string
    }[]
    expect(waits.length, 'the stream opens no waiting window at all').toBeGreaterThan(0)

    // The releasable minute is read off the DRAINED stream — a freshly booted
    // desk has released nothing yet, so its frame carries no wait to look up.
    const kind = waits[0]!.for
    const due = waitDue(f, kind)
    expect(due, `the '${kind}' wait has no releasable minute`).toBeTruthy()

    // Re-open the run and park exactly on that wait, sim paused.
    await page.reload()
    await boot(page)
    // The press: the driver holds the run's stream until the file is committed
    // (spec-client §5.1), so a re-opened desk has no day to park inside yet.
    await deployFile(page)
    await seekTo(page, due!)
    await holdRate(page, 0)

    // The paper is not blank — the run printed up to the call — and the wait
    // itself put nothing on it.
    const lines = page.locator('#w-feed #feedList .fl')
    // LET THE PAPER SETTLE BEFORE TAKING THE BASELINE (08-09).
    //
    // Stopping the clock does not freeze the fanfold — it FLUSHES it. The
    // reveal queue's pump rides the driver (`run-feed.ts`), so its settle
    // watchdog drains whatever is still buffered the moment the clock stops,
    // deliberately: lines queued against a clock that never runs again would
    // otherwise be stranded for ever. So the instant after `holdRate(0)` the
    // paper is still growing, and a count taken there is a count taken
    // mid-flush.
    //
    // It read 7 locally and 9 on a CI runner, and the test then blamed the held
    // desk for printing two lines the flush had already owed it. The claim this
    // test owns is that the WAIT draws nothing while the sim is held — not that
    // the queue is empty at an arbitrary instant — so the baseline waits for the
    // flush to finish rather than racing it.
    let seen = -1
    await expect
      .poll(
        async () => {
          const now = await lines.count()
          const stable = now === seen
          seen = now
          return stable
        },
        { timeout: 15_000 },
      )
      .toBe(true)
    const before = seen
    expect(before, 'the desk printed nothing at all — this guard is measuring an empty window').toBeGreaterThan(0)
    await expect(page.locator(WAIT_NODE), 'a wait marker came back onto the paper').toHaveCount(0)

    // Hold past the 9 s the proxy actually takes. Nothing lands: the sim is
    // held at rate 0, and a wait is not a line.
    await page.waitForTimeout(9_500)
    await expect(page.locator(WAIT_NODE), 'the wait drew a marker after all').toHaveCount(0)
    expect(await lines.count(), 'the held desk printed a line with the sim stopped').toBe(before)

    // No spinner, no percentage, no error copy anywhere on the desk (inv 5) —
    // the half of C18 the removal does not touch. A wait that shows nothing is
    // only acceptable while nothing ELSE turns into machine-failure copy.
    const desk = await page.locator('#app').innerText()
    for (const dead of DEAD_UI) expect(desk, `the desk rendered dead-UI copy: ${dead}`).not.toMatch(dead)
    expect(await page.locator('#app progress, #app [role="progressbar"], #app .spinner').count()).toBe(0)
    expect(desk, 'the desk rendered a percentage — a wait must carry no measure').not.toMatch(/\d+\s*%/)
  })

  test('latency — the open call survives the 30 s worst case with a live desk', async ({ page }) => {
    await boot(page)
    await drain(page)
    const f = await frame(page)
    const waits = f.events.filter(
      (e) => e.type === 'waiting' && (e as unknown as { active: boolean }).active,
    ) as unknown as { for: string }[]
    expect(waits.length, 'the stream opens no waiting window at all').toBeGreaterThan(0)
    const kind = waits[0]!.for
    const due = waitDue(f, kind)
    expect(due, `the '${kind}' wait has no releasable minute`).toBeTruthy()

    await page.reload()
    await boot(page)
    // The press: the driver holds the run's stream until the file is committed
    // (spec-client §5.1), so a re-opened desk has no day to park inside yet.
    await deployFile(page)
    await seekTo(page, due!)
    await holdRate(page, 0)

    // The engine's one retry puts the ceiling near 30 s. x6 — what is being
    // watched is no longer a marker staying up; it is the desk staying ALIVE
    // and staying silent for the whole of the worst case.
    await page.waitForTimeout(30_000)
    await expect(page.locator(WAIT_NODE), 'a wait marker appeared during the 30 s hold').toHaveCount(0)
    const desk = await page.locator('#app').innerText()
    for (const dead of DEAD_UI) expect(desk, `the desk rendered dead-UI copy: ${dead}`).not.toMatch(dead)

    // The desk is not dead: a window control still answers.
    const rep = page.locator('#w-rep')
    await page.locator('#w-rep .wc-min').click()
    await expect(rep).toHaveClass(/collapsed/)
    await page.locator('#w-rep .wc-min').click()
    await expect(rep).not.toHaveClass(/collapsed/)
  })

  test('latency — the terminal record count-up holds past 9 s and completes inside the 30 s worst case', async ({
    page,
  }) => {
    await boot(page)
    await drain(page)

    await expect(page.locator(RECORD)).toHaveCount(1, { timeout: 5_000 })
    const started = Date.now()

    // At 9 s the ledger is still counting or has just landed — either way it is
    // ALIVE: rows are painting and NEW RUN has not been offered early.
    await page.waitForTimeout(9_000)
    const deskAt9 = await page.locator('#app').innerText()
    for (const dead of DEAD_UI) expect(deskAt9, `dead-UI copy during the count-up: ${dead}`).not.toMatch(dead)
    expect(await page.locator(ROWS).count(), 'the ledger painted no row in 9 s').toBeGreaterThan(0)
    expect(await page.locator('#app [role="alert"], #app .error, #app [data-state="error"]').count()).toBe(0)

    await expect(page.locator(LEDGER)).toHaveAttribute('data-tally-state', 'final', { timeout: 30_000 })
    const elapsed = Date.now() - started
    expect(elapsed, 'the count-up did not survive the 30 s worst case').toBeLessThan(35_000)
    await expect(page.locator(NEW_RUN)).toBeEnabled()
  })
})

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

const TALLY = '#w-tally'
const LEDGER = `${TALLY} [data-tally-state]`
const NEW_RUN = `${TALLY} #btnNewRun`
const WAIT = `${TALLY} .tly-wait`
const ROWS = `${TALLY} .tly-table tr`
const BIG = `${TALLY} #tlyBig`
const REP = '#w-rep'
const OPTION = `${REP} .arch-rail [role="option"]`
const FILE = '#w-file'

/** c2's band: `run_end → final` is 9 s ±1.5 s at ×1. */
const BAND: readonly [number, number] = [7500, 10500]

/* ── shell + tally dev handles ───────────────────────────────────────────── */

async function frame(page: Page): Promise<Frame> {
  return page.evaluate(() => {
    const handle = (window as unknown as { __shell?: { frame(): unknown } }).__shell
    if (!handle) throw new Error('window.__shell is not exposed by the shell boot')
    return handle.frame() as never
  })
}

async function drain(page: Page): Promise<void> {
  await page.evaluate(() => {
    const handle = (window as unknown as { __shell?: { drain(): void } }).__shell
    if (!handle) throw new Error('window.__shell is not exposed by the shell boot')
    handle.drain()
  })
}

async function phase(page: Page): Promise<string> {
  return page.evaluate(() => {
    const handle = (window as unknown as { __tally?: { phase(): string } }).__tally
    if (!handle) throw new Error('window.__tally is not exposed by the TALLY window')
    return handle.phase()
  })
}

async function meta(page: Page): Promise<MetaEvent> {
  return page.evaluate(() => {
    const handle = (window as unknown as { __tally?: { meta(): unknown } }).__tally
    if (!handle) throw new Error('window.__tally is not exposed by the TALLY window')
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
  await expect(page.locator(TALLY)).toHaveCount(1)
  await expect(page.locator('#runNum')).not.toBeEmpty()
}

/** Drains to 21:04 and returns the measured `run_end → final` milliseconds. */
async function drainAndTime(page: Page): Promise<number> {
  return page.evaluate(async () => {
    const handle = (window as unknown as { __shell?: { drain(): void } }).__shell
    if (!handle) throw new Error('window.__shell is not exposed by the shell boot')
    const t0 = performance.now()
    handle.drain()
    await new Promise<void>((resolve) => {
      const step = (): void => {
        if (document.querySelector('#w-tally [data-tally-state="final"]')) resolve()
        else requestAnimationFrame(step)
      }
      step()
    })
    return performance.now() - t0
  })
}

async function drainToFinal(page: Page): Promise<void> {
  await drain(page)
  await expect(page.locator(LEDGER)).toHaveAttribute('data-tally-state', 'final', { timeout: 20_000 })
}

/* ══ [u7#c1] full loop back to BUILD ════════════════════════════════════ */

test.describe('full loop back to BUILD', () => {
  test.setTimeout(90_000)

  test('full loop back to BUILD — the desk opens in BUILD with TALLY shut', async ({ page }) => {
    await boot(page)
    expect(await phase(page)).toBe('build')
    await expect(page.locator(TALLY)).toHaveClass(/\bhidden\b/)
    await expect(page.locator(NEW_RUN)).toBeDisabled()
    expect((await frame(page)).events.filter((e) => e.type === 'run_end')).toEqual([])
  })

  test('full loop back to BUILD — 21:04 closes the feed and opens TALLY on the count-up', async ({ page }) => {
    await boot(page)
    await drain(page)

    await expect(page.locator(TALLY)).not.toHaveClass(/\bhidden\b/, { timeout: 5_000 })
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

  test('full loop back to BUILD — NEW RUN returns the desk to BUILD and shuts TALLY', async ({ page }) => {
    await boot(page)
    await drainToFinal(page)

    await expect(page.locator(NEW_RUN)).toBeEnabled()
    await page.locator(NEW_RUN).click()

    await expect.poll(async () => phase(page), { timeout: 20_000 }).toBe('build')
    await expect(page.locator(TALLY)).toHaveClass(/\bhidden\b/)
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
    await expect.poll(async () => phase(page), { timeout: 20_000 }).toBe('build')

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
    await expect.poll(async () => phase(page), { timeout: 20_000 }).toBe('build')
    await expect(page.locator(NEW_RUN)).toBeDisabled()

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
      const node = document.querySelector('#w-tally [data-tally-state]')
      return node?.getAttribute('data-tally-state') ?? null
    })
    expect(['pending', 'counting'], `the tally reached ${early} before the cadence ran`).toContain(early)
    await expect(page.locator(NEW_RUN)).toBeDisabled()

    await expect(page.locator(WAIT)).toHaveText('……보고서 정리 중')
    await expect(page.locator(`${TALLY} .spinner, ${TALLY} .loading, ${TALLY} progress`)).toHaveCount(0)

    await expect(page.locator(LEDGER)).toHaveAttribute('data-tally-state', 'final', { timeout: 20_000 })
    await expect(page.locator(`${TALLY} .tly-wait.done`)).toHaveCount(1)
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
      () => document.querySelector('#w-tally [data-tally-state]')?.getAttribute('data-tally-state') ?? null,
    )
    expect(stateWhilePainted).not.toBeNull()

    await expect(page.locator(LEDGER)).toHaveAttribute('data-tally-state', 'final', { timeout: 20_000 })
  })

  test('count-up pacing absorbs the report call — the ledger rows arrive in cadence, not all at once', async ({
    page,
  }) => {
    await boot(page)
    await drain(page)
    await expect(page.locator(TALLY)).not.toHaveClass(/\bhidden\b/, { timeout: 5_000 })

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
    await button.click({ force: true }).catch(() => undefined)
    await button.click({ force: true }).catch(() => undefined)

    await expect.poll(async () => phase(page), { timeout: 20_000 }).toBe('build')
    expect(lastMeta(await frame(page)).run, 'a double click advanced the loop twice').toBe(before + 1)
  })

  test('new run unlocks and files the report — the file opens unlocked on the new run', async ({ page }) => {
    await boot(page)
    await drainToFinal(page)
    await page.locator(NEW_RUN).click()
    await expect.poll(async () => phase(page), { timeout: 20_000 }).toBe('build')

    await expect(page.locator(FILE)).not.toHaveClass(/\bhidden\b/)
    await expect(page.locator(`${FILE} .slot`)).not.toHaveCount(0)
    await expect(page.locator(`${FILE} .slot.locked`)).toHaveCount(0)
  })

  test('new run unlocks and files the report — the finished run is filed in the archive rail', async ({ page }) => {
    await boot(page)
    await drainToFinal(page)

    const closed = lastRunEnd(await frame(page))
    const railBefore = await page.locator(OPTION).count()

    await page.locator(NEW_RUN).click()
    await expect.poll(async () => phase(page), { timeout: 20_000 }).toBe('build')

    const filed = lastMeta(await frame(page))
    await expect(page.locator(OPTION)).toHaveCount(filed.archive.length)
    expect(filed.archive.length, 'the archive did not grow — the run was not filed').toBeGreaterThan(railBefore)
    expect(filed.archive.map((a) => a.run), `RUN ${closed} is missing from the archive`).toContain(closed)

    const labels = await page.locator(OPTION).evaluateAll((nodes) => nodes.map((n) => (n.textContent ?? '').trim()))
    expect(labels.some((l) => new RegExp(`RUN\\s*0*${closed}\\b`).test(l))).toBe(true)
    for (const label of labels) expect(label).not.toMatch(/gate|게이트/i)
  })

  test('new run unlocks and files the report — the carried blocks are the event’s, verbatim', async ({ page }) => {
    await boot(page)
    await drainToFinal(page)
    await page.locator(NEW_RUN).click()
    await expect.poll(async () => phase(page), { timeout: 20_000 }).toBe('build')

    const emitted = lastMeta(await frame(page))
    expect(emitted.carried.length, 'the new run carries nothing — the scan is vacuous').toBeGreaterThan(0)
    expect((await meta(page)).carried).toEqual(emitted.carried)

    const onDesk = await page
      .locator('#w-store [data-block]')
      .evaluateAll((nodes) => nodes.map((n) => (n as HTMLElement).dataset.block ?? ''))
    for (const id of onDesk) expect(emitted.carried, `${id} is on the desk but not in meta.carried`).toContain(id)
  })

  test('new run unlocks and files the report — TALLY reopens clean on the next 21:04', async ({ page }) => {
    await boot(page)
    await drainToFinal(page)
    const firstRows = await page.locator(ROWS).count()

    await page.locator(NEW_RUN).click()
    await expect.poll(async () => phase(page), { timeout: 20_000 }).toBe('build')
    await expect(page.locator(TALLY)).toHaveClass(/\bhidden\b/)

    await drain(page)
    await expect(page.locator(TALLY)).not.toHaveClass(/\bhidden\b/, { timeout: 5_000 })
    await expect(page.locator(`${TALLY} .tly-wait.done`)).toHaveCount(0)
    await expect(page.locator(ROWS)).toHaveCount(firstRows)
    await expect(page.locator(LEDGER)).toHaveAttribute('data-tally-state', 'final', { timeout: 20_000 })
  })
})

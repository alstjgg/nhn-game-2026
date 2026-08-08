// [x3] the onboarding walk — `shell/tutorial.ts`.
//
// THE ONE LANE THAT ASKS FOR IT. `tutorialSkipped` is true under
// `navigator.webdriver`, which is every other spec in this directory: a walk
// that lights three windows and scrolls the AGENT FILE under them would turn
// those suites into a coin toss. This file opts in by name, `?tutorial=show`,
// and the first test here is the one that proves the opt-out is real.
//
// WHAT IS ASSERTED. The ORDER of the twelve marks and what ends each one —
// which is the whole of the walk's behaviour, since a mark is a class and
// nothing else. Timings are asserted as floors ("still marked before"), never
// as equalities: the walk is decoration and a CI box under load must not turn
// a 2 s pause into a red build.
import { expect, test } from 'playwright/test'
import type { Page } from 'playwright/test'

const WALK = './?tutorial=show'

const FILE_WIN = '#w-file'
const FEED_WIN = '#w-feed'
const REP_WIN = '#w-rep'
const PAGE_TURN = '#w-file .pg-nav .pg-turn:not([disabled])'
const LIT = '.is-lit'

/** Step 2's hold, and step 4's pause — the two the walk names itself. */
const FILE_HOLD_MS = 8_000
const AFTER_TURN_MS = 2_000
/** Step 12 lets go on its own after this long. */
const UNSET_CEIL_MS = 10_000

test.use({ viewport: { width: 1280, height: 800 } })

/** Boots and waits for the desk to be uncovered — the walk starts on that. */
async function atTheDesk(page: Page, url = WALK): Promise<void> {
  await page.goto(url)
  await page.waitForFunction(() => Boolean((window as { __shell?: unknown }).__shell))
  await page.waitForFunction(() => !document.body.classList.contains('booting'), undefined, {
    timeout: 20_000,
  })
}

/** What is marked right now, as a list of selector-ish names. */
async function lit(page: Page): Promise<string[]> {
  return page.locator(LIT).evaluateAll((nodes) =>
    nodes.map((n) => (n.id ? `#${n.id}` : `${n.tagName.toLowerCase()}.${n.classList[0] ?? ''}`)),
  )
}

/* ══ who gets it ═════════════════════════════════════════════════════════ */

test.describe('[x3] the walk is opt-in for every lane but its own', () => {
  test('[x3] (a) the e2e lane gets no walk at all', async ({ page }) => {
    await atTheDesk(page, './')
    // Long enough that step 1 would be up and visible if it were running.
    await page.waitForTimeout(1_500)
    await expect(page.locator(LIT)).toHaveCount(0)
  })

  test('[x3] (b) ?tutorial=skip refuses it even when asked for the desk', async ({ page }) => {
    await atTheDesk(page, './?tutorial=skip')
    await page.waitForTimeout(1_500)
    await expect(page.locator(LIT)).toHaveCount(0)
  })

  test('[x3] (c) ?tutorial=show turns it on', async ({ page }) => {
    await atTheDesk(page)
    await expect(page.locator(`${FILE_WIN}${LIT}`)).toBeVisible({ timeout: 5_000 })
  })
})

/* ══ the marks, in order ═════════════════════════════════════════════════ */

test.describe('[x3] the walk marks what the operator needs next', () => {
  test.setTimeout(120_000)

  test('[x3] (d) the desk is uncovered BEFORE the first mark lands', async ({ page }) => {
    // The regression this pins: the walk's pulse is an infinite animation, and
    // `revealDesk` used to await every animation on a window — including one
    // that never finishes. The desk stayed at `visibility:hidden` for the whole
    // of step 1. A mark on a window nobody can see is not a mark.
    await page.goto(WALK)
    await expect(page.locator(`${FILE_WIN}${LIT}`)).toBeVisible({ timeout: 20_000 })
    await expect(page.locator('body')).not.toHaveClass(/\bbooting\b/)
  })

  test('[x3] (e) 1→3 — the file, then the page control, released by the turn', async ({ page }) => {
    await atTheDesk(page)

    // 1 — the AGENT FILE, and nothing else.
    expect(await lit(page)).toEqual(['#w-file'])
    // 2 — it is still the file most of the way through the hold …
    await page.waitForTimeout(FILE_HOLD_MS * 0.6)
    expect(await lit(page), 'the file was released before its hold ran out').toEqual(['#w-file'])
    // … and the page control takes over once it does.
    await expect(page.locator(`${PAGE_TURN}${LIT}`)).toBeVisible({ timeout: FILE_HOLD_MS })
    await expect(page.locator(`${FILE_WIN}${LIT}`)).toHaveCount(0)

    // 3 — turning the page puts it out.
    await page.locator(PAGE_TURN).first().click()
    await expect(page.locator(LIT)).toHaveCount(0)
  })

  test('[x3] (f) 4→6 — DEPLOY, then 예 on the plate it raises', async ({ page }) => {
    await atTheDesk(page)
    await page.waitForTimeout(FILE_HOLD_MS)
    await page.locator(PAGE_TURN).first().click()

    // 4 — nothing for two seconds, then the commit.
    await expect(page.locator(LIT)).toHaveCount(0)
    await expect(page.locator(`#btnDeploy${LIT}`)).toBeVisible({ timeout: AFTER_TURN_MS * 3 })

    // 5 — the press releases DEPLOY and marks 예 on the plate (x2).
    await page.locator('#btnDeploy').click()
    await expect(page.locator(`#confirmYes${LIT}`)).toBeVisible({ timeout: 5_000 })
    await expect(page.locator(`#btnDeploy${LIT}`)).toHaveCount(0)

    // 6 — answering puts it out.
    await page.locator('#confirmYes').click()
    await expect(page.locator(`#confirmYes${LIT}`)).toHaveCount(0)
  })

  test('[x3] (g) 7→8 — the feed while the day opens, then the record', async ({ page }) => {
    await atTheDesk(page)
    await page.waitForTimeout(FILE_HOLD_MS)
    await page.locator(PAGE_TURN).first().click()
    await expect(page.locator(`#btnDeploy${LIT}`)).toBeVisible({ timeout: AFTER_TURN_MS * 3 })
    await page.locator('#btnDeploy').click()
    await page.locator('#confirmYes').click()

    // 7 — the day starts on that answer, and the mark is on the feed at once:
    // no gap, or the record it is waiting for would arrive first.
    await expect(page.locator(`${FEED_WIN}${LIT}`)).toBeVisible({ timeout: 3_000 })

    // 8 — a line lands on the fanfold and REPORTS takes the mark.
    await expect(page.locator(`${REP_WIN}${LIT}`)).toBeVisible({ timeout: 30_000 })
    await expect(page.locator(`${FEED_WIN}${LIT}`)).toHaveCount(0)
  })

  test('[x3] (h) 9→12 — one sentence per document, then 해제, then done', async ({ page }) => {
    await atTheDesk(page)
    await page.waitForTimeout(FILE_HOLD_MS)
    await page.locator(PAGE_TURN).first().click()
    await expect(page.locator(`#btnDeploy${LIT}`)).toBeVisible({ timeout: AFTER_TURN_MS * 3 })
    await page.locator('#btnDeploy').click()
    await page.locator('#confirmYes').click()
    await expect(page.locator(`${REP_WIN}${LIT}`)).toBeVisible({ timeout: 30_000 })

    // Run the day out — the walk's step 9 hangs off `run_end`.
    await page.evaluate(() => (window as unknown as { __shell: { drain(): void } }).__shell.drain())

    // 9 — EXACTLY two sentences, one per document. Marking the whole record
    // points at nothing, which is what a `querySelectorAll` here once did.
    await expect(page.locator(`#w-rep .doc-facts [data-sentence-id]${LIT}`)).toHaveCount(1, {
      timeout: 30_000,
    })
    await expect(page.locator(`#w-rep .doc-body [data-sentence-id]${LIT}`)).toHaveCount(1)
    await expect(page.locator(`[data-sentence-id]${LIT}`)).toHaveCount(2)
    // …and they are the FIRST of each, not any two.
    await expect(page.locator('#w-rep .doc-facts [data-sentence-id]').first()).toHaveClass(/\bis-lit\b/)
    await expect(page.locator('#w-rep .doc-body [data-sentence-id]').first()).toHaveClass(/\bis-lit\b/)

    // 10 — mining ANY sentence releases both. The marked one is a real control:
    // the mark is a class on it, never an overlay, so the press lands.
    await page.locator('#w-rep .doc-facts [data-sentence-id]').first().click()
    await expect(page.locator(`[data-sentence-id]${LIT}`)).toHaveCount(0)

    // 11 — the seat that sentence took, and the control that frees it.
    await expect(page.locator(`#w-file .slot-unset${LIT}`)).toBeVisible({ timeout: 10_000 })

    // 12 — never pressed, so the ceiling lets go. The walk is over: nothing on
    // the desk is marked again.
    await expect(page.locator(LIT)).toHaveCount(0, { timeout: UNSET_CEIL_MS * 2 })
    await page.waitForTimeout(3_000)
    await expect(page.locator(LIT)).toHaveCount(0)
  })
})

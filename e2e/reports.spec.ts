// u6 — REPORTS window: the DOM half.
//
// vitest runs `environment: 'node'`, so everything that needs a real document
// lives here (u6 design D1). The pure half is `tests/windows/reports.test.ts`.
//
// Covers [u6#c1] report renders once after the last beat · [u6#c2] typewriter
// is replay · [u6#c4] archive segmentation and highlight marks · [u6#c7] a11y.
//
// Test titles are load-bearing — the unit's verification commands filter with
// `-g 'report renders once after the last beat'`, `-g 'typewriter is replay'`,
// `-g 'archive segmentation and highlight marks'` and `-g 'a11y'`.
//
// C3 (placeholder fixtures being retired): NOTHING here asserts fixture
// CONTENT. Every expectation is read back out of the driver's own stream
// through `window.__shell.frame().events`, so the suite binds to whatever run
// the shell boots — placeholder today, u2f's 우는다리 material tomorrow.
import { expect, test } from 'playwright/test'
import type { Locator, Page } from 'playwright/test'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { awaitRecordFinal, confirmDeploy, deployFile, mineFirst, raiseWindow, turnToAgent } from './fixtures/harness.ts'

/* ── the seam shapes this suite reads back ───────────────────────────────── */

interface Sentence {
  id: string
  text: string
  species: string
  axis?: string
}

interface ReportEvent {
  type: 'report'
  round: number
  facts: Sentence[]
  report_body: Sentence[]
}

interface MetaEvent {
  type: 'meta'
  run: number
  runs_left: number
  carried: string[]
  archive: { run: number; label: string }[]
}

interface Frame {
  events: { type: string; [k: string]: unknown }[]
  store: { mined: string[]; slots: Record<number, string>; deployed: string[] }
}

const REP = '#w-rep'
const BODY = `${REP} #bodyList`
const FACTS = `${REP} #factsList`
const RAIL = `${REP} .arch-rail`
const OPTION = `${RAIL} [role="option"]`

/* ── the four sources this unit owns (source-level guards for c2) ────────── */

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const UNIT_FILES = [
  'src/client/components/minable-sentence.ts',
  'src/client/components/report-archive.ts',
  'src/client/components/report-view.ts',
  'src/client/windows/reports.ts',
]

function unitSources(): { file: string; text: string }[] {
  return UNIT_FILES.map((f) => ({
    file: f,
    text: fs.existsSync(path.join(REPO, f)) ? fs.readFileSync(path.join(REPO, f), 'utf8') : '',
  }))
}

/* ── shell handles (u3's dev/test surface) ───────────────────────────────── */

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
  // U3 — no more sheet to reveal; wait the record out to final instead.
  await awaitRecordFinal(page)
}

/** Boot the desk with REPORTS raised. `reduced` freezes the typewriter's replay. */
async function boot(page: Page, opts: { reduced: boolean }): Promise<void> {
  if (opts.reduced) await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('./')
  await expect(page.locator(REP)).toBeVisible()
  await turnToAgent(page)
  await page.locator(`${REP} .win-bar`).click()
}

function reportsOf(f: Frame): ReportEvent[] {
  return f.events.filter((e) => e.type === 'report') as unknown as ReportEvent[]
}

/**
 * C17 / [u11#c12] — RE-AIMED support (08-04), never deleted.
 *
 * u6 was written against a fixture that opened with SEVERAL filed reports in
 * the stream. u7's run loop opens on ONE day: the desk boots RUN 03, files its
 * report when the day ends, and the next document only exists once the operator
 * takes the next run (`#btnNewRun` on the TALLY sheet, u7). So the two switch
 * oracles below stopped having a second run to switch TO — not because the
 * REPORTS window lost the ability, but because nothing had filed a second
 * document yet.
 *
 * The fix is to play the loop the way the operator does before asserting, so
 * the asserts themselves stay exactly as u6 wrote them.
 */
async function fileAnotherRun(page: Page): Promise<void> {
  await drain(page)
  const newRun = page.locator('#w-file #btnDeploy')
  await expect(newRun, 'the day never unlocked NEW RUN').toHaveAttribute('data-op', 'new_run', { timeout: 30_000 })
  await expect(newRun, 'the day never unlocked NEW RUN').toBeEnabled({ timeout: 30_000 })
  await newRun.click()
  await confirmDeploy(page)
  await drain(page)
  await page.locator(`${REP} .win-bar`).click()
}

function metaOf(f: Frame): MetaEvent | null {
  const metas = f.events.filter((e) => e.type === 'meta') as unknown as MetaEvent[]
  return metas.length > 0 ? metas[metas.length - 1]! : null
}

/** The run the rail says is selected right now. */
async function activeRun(page: Page): Promise<number> {
  const label = await page.locator(`${OPTION}[aria-selected="true"]`).first().innerText()
  const digits = label.match(/\d+/)
  expect(digits, `the selected archive option carries no RUN number: ${label}`).not.toBeNull()
  return Number(digits![0])
}

async function reportForActiveRun(page: Page): Promise<ReportEvent> {
  const run = await activeRun(page)
  const report = reportsOf(await frame(page)).filter((r) => r.round === run).pop()
  expect(report, `the stream carries no report for the selected RUN ${run}`).toBeTruthy()
  return report!
}

async function anchorIds(locator: Locator): Promise<string[]> {
  return locator.evaluateAll((nodes) => nodes.map((n) => (n as HTMLElement).dataset.sentenceId ?? ''))
}

async function minedCount(page: Page): Promise<number> {
  return Number((await page.locator(`${REP} #minedCount`).innerText()).replace(/\D/g, ''))
}

/* ══ [u6#c1] report renders once after the last beat ════════════════════ */

test.describe('report renders once after the last beat', () => {
  test.beforeEach(async ({ page }) => {
    await boot(page, { reduced: true })
  })

  test('report renders once after the last beat — the stream carries a complete report event', async ({
    page,
  }) => {
    await drain(page)
    const reports = reportsOf(await frame(page))
    expect(reports.length, 'the boot run emits no `report` event — nothing to render').toBeGreaterThan(0)
    for (const r of reports) {
      expect(Array.isArray(r.facts)).toBe(true)
      expect(Array.isArray(r.report_body)).toBe(true)
      expect(r.facts.length + r.report_body.length).toBeGreaterThan(0)
      for (const s of [...r.facts, ...r.report_body]) {
        expect(typeof s.id).toBe('string')
        expect(s.id.length).toBeGreaterThan(0)
        expect(typeof s.text).toBe('string')
      }
    }
  })

  test('report renders once after the last beat — nothing renders before the beat lands', async ({
    page,
  }) => {
    // Non-vacuity: the window is mounted and its skeleton is up — it is the
    // CONTENT that has not arrived, not the pane.
    await expect(page.locator(`${REP} .rep-grid`)).toHaveCount(1)
    expect(reportsOf(await frame(page)), 'a report was already released at the opening minute').toEqual([])
    await expect(page.locator(`${BODY} .sent`)).toHaveCount(0)
    await expect(page.locator(`${FACTS} li`)).toHaveCount(0)
  })

  // x6 — the DOM half of the seal rule; the rule itself is proved under node
  // (`tests/windows/reports.test.ts`, `[x6]`). A 검인 chop is a receipt for the
  // SITTING, and the sitting is not received until the driver's `score` — its
  // terminal — has landed. Reduced motion is on in this describe, so the replay
  // is finished on its first paint and `score` is the only thing left to wait
  // for: exactly the case that used to stamp a blank sheet.
  test('report renders once after the last beat — the 검인 chop waits for the day to close', async ({
    page,
  }) => {
    const chop = page.locator(`${REP} .sig-stamp`)
    await expect(chop, 'the signature block never mounted — the oracle is vacuous').toHaveCount(1)
    await expect(chop, 'a 수신 완료 chop on a day that has filed nothing').toBeHidden()

    await drain(page)
    await expect(chop).toHaveClass(/\bon\b/)
    await expect(chop).toBeVisible()
  })

  test('report renders once after the last beat — both panes render the event, in event order', async ({
    page,
  }) => {
    await drain(page)
    const report = await reportForActiveRun(page)

    await expect(page.locator(`${FACTS} li`)).toHaveCount(report.facts.length)
    await expect(page.locator(`${BODY} .sent`)).toHaveCount(report.report_body.length)
    expect(await anchorIds(page.locator(`${FACTS} .min`))).toEqual(report.facts.map((s) => s.id))
    expect(await anchorIds(page.locator(`${BODY} .sent`))).toEqual(report.report_body.map((s) => s.id))
  })

  test('report renders once after the last beat — no data-sentence-id appears twice', async ({ page }) => {
    await drain(page)
    const ids = await anchorIds(page.locator(`${REP} [data-sentence-id]`))
    expect(ids.length).toBeGreaterThan(0)
    expect(ids).not.toContain('')
    expect(new Set(ids).size).toBe(ids.length)
  })

  test('report renders once after the last beat — replaying the stream adds no node and no rail entry', async ({
    page,
  }) => {
    await drain(page)
    const before = {
      facts: await page.locator(`${FACTS} li`).count(),
      body: await page.locator(`${BODY} .sent`).count(),
      rail: await page.locator(OPTION).count(),
    }
    expect(before.body).toBeGreaterThan(0)

    await drain(page)
    await drain(page)
    await expect(page.locator(`${FACTS} li`)).toHaveCount(before.facts)
    await expect(page.locator(`${BODY} .sent`)).toHaveCount(before.body)
    await expect(page.locator(OPTION)).toHaveCount(before.rail)
  })

  test('report renders once after the last beat — two documents side by side on white bond', async ({
    page,
  }) => {
    await drain(page)
    await expect(page.locator(`${REP} .win-body.paper.bond`)).toHaveCount(1)
    await expect(page.locator(`${REP} .rep-grid > .doc.doc-facts`)).toHaveCount(1)
    await expect(page.locator(`${REP} .rep-grid > .doc.doc-body`)).toHaveCount(1)

    const facts = await page.locator(`${REP} .doc-facts`).boundingBox()
    const body = await page.locator(`${REP} .doc-body`).boundingBox()
    expect(facts && body).toBeTruthy()
    expect(facts!.x).toBeLessThan(body!.x)
    expect(facts!.x + facts!.width).toBeLessThanOrEqual(body!.x + 1)
  })

  // x6 — INVERTED. This case used to require a red ledger rule down the report
  // side, painted as a gradient band at x=33–34px with the prose indented 34px
  // to clear it. The rule is gone: it was a decoration nothing was written
  // against, and the indent it needed put 무전 기록 20px off 현장 기록's axis, so
  // the pane the operator reads as one spread was visibly two.
  //
  // What is asserted instead is the thing the rule cost — the two panes hang
  // from the same left edge — plus the rule's absence, so it cannot come back
  // without this reading again.
  test('report renders once after the last beat — the two panes hang from one left edge, with no ledger rule', async ({
    page,
  }) => {
    await drain(page)
    const pane = async (sel: string): Promise<{ paint: string; padding: string }> =>
      page.locator(`${REP} ${sel}`).evaluate((n) => {
        const style = getComputedStyle(n as HTMLElement)
        return { paint: style.backgroundImage, padding: style.paddingLeft }
      })

    const facts = await pane('.doc-facts')
    const body = await pane('.doc-body')
    expect(body.padding, `무전 기록 is indented off 현장 기록's axis`).toBe(facts.padding)

    // No red band anywhere in the body pane's paint. `.doc-facts` keeps its own
    // gradient (a grey edge shade at 96%), which is why the assert is on colour
    // and not on the mere presence of a gradient.
    const reds = [...body.paint.matchAll(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/g)].map((m) => ({
      r: Number(m[1]),
      g: Number(m[2]),
      b: Number(m[3]),
    }))
    expect(reds.some((c) => c.r > c.g + 20 && c.r > c.b + 20), `a red rule is back: ${body.paint}`).toBe(false)
  })
})

/* ══ [u6#c2] typewriter is replay ═══════════════════════════════════════ */

test.describe('typewriter is replay', () => {
  test('typewriter is replay — with motion reduced the first paint is already the whole body', async ({
    page,
  }) => {
    await boot(page, { reduced: true })
    await drain(page)
    const report = await reportForActiveRun(page)

    const painted = await page
      .locator(`${BODY} .sent`)
      .evaluateAll((nodes) => nodes.map((n) => (n.textContent ?? '').trim()))
    expect(painted).toEqual(report.report_body.map((s) => s.text.trim()))
    await expect(page.locator(`${REP} .caret`)).toHaveCount(0)
  })

  test('typewriter is replay — the event is complete while the body is still being written', async ({
    page,
  }) => {
    await boot(page, { reduced: false })

    // Drain and read the DOM in the SAME task: the report event is whole in the
    // driver's stream, yet the pane has not finished writing it out.
    const snapshot = await page.evaluate(() => {
      const handle = (window as unknown as { __shell?: { drain(): void; frame(): unknown } }).__shell
      if (!handle) throw new Error('window.__shell is not exposed by the shell boot')
      handle.drain()
      const painted = document.querySelector('#w-rep #bodyList')?.textContent ?? ''
      return { painted: painted.length, frame: handle.frame() as Frame }
    })

    const report = reportsOf(snapshot.frame).pop()
    expect(report, 'the boot run emits no `report` event — nothing to replay').toBeTruthy()
    const whole = report!.report_body.map((s) => s.text).join('').length
    expect(whole).toBeGreaterThan(0)
    expect(snapshot.painted, 'the pane painted the whole body synchronously — that is not a replay').toBeLessThan(
      whole,
    )
  })

  test('typewriter is replay — the replay completes off the driver pump, and the caret is cleaned up', async ({
    page,
  }) => {
    await boot(page, { reduced: false })
    await drain(page)
    const report = await reportForActiveRun(page)

    // The pump only ticks while the clock runs. RE-AIMED (08-08, W4): there is
    // no ▶ any more — the operator starts the day by committing a file to it.
    //
    // RE-AIMED AGAIN (x5): the clock is started through the LIVE FEED's own rate
    // hook, exactly as the next case does, rather than by pressing DEPLOY. The
    // press opens the NEXT sitting, and REPORTS now follows the new sitting onto
    // its own tab — so the document whose replay this case is about would be
    // unmounted mid-poll. What is under test here is the PUMP: a partially typed
    // body finishes, and the caret is cleaned up when it does. That the press
    // starts the day is `run-loop.spec.ts`'s claim and is asserted there.
    await page.evaluate(() => {
      const feed = (window as unknown as { __feed?: { rate(to: number): void } }).__feed
      if (!feed) throw new Error('window.__feed is not exposed by the LIVE FEED window')
      feed.rate(4)
    })

    await expect
      .poll(
        async () =>
          (await page.locator(`${BODY} .sent`).evaluateAll((nodes) =>
            nodes.map((n) => (n.textContent ?? '').trim()).join(''),
          )).length,
        { timeout: 30_000 },
      )
      .toBe(report.report_body.map((s) => s.text.trim()).join('').length)
    await expect(page.locator(`${REP} .caret`)).toHaveCount(0)
  })

  // ADDED 08-05 (R4 on windows/reports.ts:55): every oracle above reaches the
  // report through `drain()`, a dev/test hook no player ever calls. The one path
  // the player HAS — the clock running into 21:04 — was the one path never
  // asserted, and it was the one that painted the whole body in a single frame.
  test('typewriter is replay — it plays on the path the player takes, with the clock closing the run', async ({
    page,
  }) => {
    await boot(page, { reduced: false })
    // The press first: the driver holds the run's stream until the file is
    // committed (spec-client §5.1), so an unopened day has nothing to seek into.
    await deployFile(page)
    // One sim-minute short of the terminal, then let the clock run there itself.
    await page.evaluate(() => {
      const feed = (window as unknown as { __feed?: { seek(at: string): void; rate(to: number): void } }).__feed
      if (!feed) throw new Error('window.__feed is not exposed by the LIVE FEED window')
      feed.seek('21:03')
      feed.rate(4)
    })

    // The body must be caught PART-written: 0 < painted < whole.
    let partial = 0
    await expect
      .poll(
        async () => {
          const painted = await page.locator(BODY).evaluate((n) => (n.textContent ?? '').length)
          if (painted > 0 && partial === 0) partial = painted
          return painted
        },
        { timeout: 30_000, intervals: [40] },
      )
      .toBeGreaterThan(0)

    // The total comes from the EVENT, never from the pane — the pane is exactly
    // what is under test, and mid-replay it reads short.
    const report = reportsOf(await frame(page)).pop()
    expect(report, 'the run filed no report event — the oracle is vacuous').toBeTruthy()
    const whole = report!.report_body.map((s) => s.text).join('').length
    expect(whole).toBeGreaterThan(0)
    expect(
      partial,
      'the report painted whole in one frame on the clock path — the write-out is not watchable',
    ).toBeLessThan(whole)
  })

  // ADDED 08-05 (R4 on windows/reports.ts:90): NEW RUN re-entered `sync()`, the
  // rail gained an entry, and the document the tally had just sent the operator
  // to read blanked itself and re-typed for ~4 s over the next day's opening.
  test('typewriter is replay — opening the next day does not re-type the document already on the desk', async ({
    page,
  }) => {
    await boot(page, { reduced: false })
    await drain(page)
    const report = reportsOf(await frame(page)).pop()
    expect(report, 'the boot run filed no report event — the oracle is vacuous').toBeTruthy()
    const whole = report!.report_body.map((s) => s.text).join('').length
    expect(whole).toBeGreaterThan(0)

    // Let the replay finish first: what must not happen is a SECOND write-out.
    await page.evaluate(() => {
      const feed = (window as unknown as { __feed?: { rate(to: number): void } }).__feed
      if (!feed) throw new Error('window.__feed is not exposed by the LIVE FEED window')
      feed.rate(4)
    })
    await expect
      .poll(async () => page.locator(BODY).evaluate((n) => (n.textContent ?? '').length), { timeout: 30_000 })
      .toBeGreaterThanOrEqual(whole)

    // x5 — the day this document belongs to, remembered before the press. The
    // desk now follows the NEW sitting onto its own tab, so the filed document
    // is one tab back; the defect this case guards has always been about what
    // happens to that document, not about which tab is in front.
    const filedTab = (await page.locator(`${OPTION}[aria-selected="true"]`).first().innerText()).trim()

    const newRun = page.locator('#w-file #btnDeploy')
    await expect(newRun, 'the day never unlocked NEW RUN').toHaveAttribute('data-op', 'new_run', { timeout: 30_000 })
    await expect(newRun, 'the day never unlocked NEW RUN').toBeEnabled({ timeout: 30_000 })
    await newRun.click()
    await confirmDeploy(page)

    // The desk moved. Come back to the day that filed it — and it must be whole
    // ON ARRIVAL and stay whole: a re-typed document reads 0 on the first
    // sample, a re-typing one dips on a later sample. Both are caught below.
    await expect(page.locator(`${OPTION}[aria-selected="true"]`).first()).not.toHaveText(filedTab)
    await page.locator(OPTION, { hasText: filedTab }).first().click()

    const samples: number[] = []
    for (let i = 0; i < 8; i += 1) {
      samples.push(await page.locator(BODY).evaluate((n) => (n.textContent ?? '').length))
      await page.waitForTimeout(250)
    }
    expect(
      Math.min(...samples),
      'the filed document was wiped and re-typed when the next day opened',
    ).toBeGreaterThanOrEqual(whole)
  })

  test('typewriter is replay — the unit owns no timer of its own', () => {
    const sources = unitSources()
    expect(sources.filter((s) => s.text.trim().length === 0).map((s) => s.file)).toEqual([])
    expect(sources.filter((s) => /\b(?:setTimeout|setInterval)\s*\(/.test(s.text)).map((s) => s.file)).toEqual([])
  })

  test('typewriter is replay — the unit never reads a stream of its own', () => {
    const sources = unitSources()
    expect(sources.filter((s) => s.text.trim().length === 0).map((s) => s.file)).toEqual([])
    expect(
      sources.filter((s) => /\b(?:fetch|WebSocket|EventSource)\s*\(/.test(s.text)).map((s) => s.file),
    ).toEqual([])
  })
})

/* ══ [u6#c4] archive segmentation and highlight marks ═══════════════════ */

test.describe('archive segmentation and highlight marks', () => {
  test.beforeEach(async ({ page }) => {
    await boot(page, { reduced: true })
    await drain(page)
    // The record lands in REPORTS (U3) — raising it is the point now, not a
    // workaround. See `raiseWindow`.
    await raiseWindow(page, 'rep')
  })

  test('archive segmentation and highlight marks — the rail is segmented by run and time', async ({
    page,
  }) => {
    const meta = metaOf(await frame(page))
    expect(meta, 'the boot run emits no `meta` event — the rail has nothing to segment').toBeTruthy()
    expect(meta!.archive.length, 'the archive is empty — the rail scan is vacuous').toBeGreaterThan(0)

    // C17 / [u11#c12] — RE-AIMED (08-04), never deleted and not loosened: the
    // rail carries one segment per run the desk KNOWS, which is the archive
    // plus any run whose report the stream has already filed. u6 measured that
    // against a fixture whose archive already contained the filed run; u7's run
    // loop keeps the archive to the days BEFORE the current one and files the
    // current day's report as it ends, so the rail is legitimately one longer
    // after a drain. Both halves are still counted, and the per-entry label
    // check below is untouched.
    const filed = [...new Set(reportsOf(await frame(page)).map((r) => r.round))]
    const known = [...new Set([...meta!.archive.map((a) => a.run), ...filed])]
    await expect(page.locator(OPTION)).toHaveCount(known.length)
    const labels = await page.locator(OPTION).evaluateAll((nodes) => nodes.map((n) => (n.textContent ?? '').trim()))
    // x5 — the tab is the CALLSIGN and nothing else, so the per-entry check
    // inverts: it used to prove the label's time span reached the tab, and now
    // it proves that no part of the seam's `label` does. That field is the
    // authority's, and what it holds depends on which authority is driving —
    // `RUN 03 / 08:50 — 21:04` from the fixture loop, `전구간정상-r3` from the live
    // adapter. Neither is something this rail promises to render.
    for (const [i, entry] of meta!.archive.entries()) {
      expect(labels[i]).toMatch(new RegExp(`ECHO-${entry.run}\\b`))
      const span = entry.label.replace(/^\s*RUN\s*\d+\s*[/·]\s*/i, '').trim()
      expect(span.length, 'the fixture label is empty — this check is vacuous').toBeGreaterThan(0)
      expect(labels[i]!.replace(/\s+/g, ' ')).not.toContain(span.replace(/\s+/g, ' '))
    }
  })

  test('archive segmentation and highlight marks — no gate label reaches the player surface', async ({
    page,
  }) => {
    await expect(page.locator(OPTION), 'the rail is empty — the gate-label scan is vacuous').not.toHaveCount(0)
    const text = await page.locator(REP).innerText()
    expect(text).not.toMatch(/gate|게이트/i)
    const attrs = await page
      .locator(`${REP} *`)
      .evaluateAll((nodes) =>
        nodes.flatMap((n) => [...(n as HTMLElement).attributes].map((a) => `${a.name}=${a.value}`)),
      )
    expect(attrs.filter((a) => /gate|게이트/i.test(a))).toEqual([])
  })

  test('archive segmentation and highlight marks — exactly one segment reads as selected', async ({ page }) => {
    await expect(page.locator(`${OPTION}[aria-selected="true"]`)).toHaveCount(1)

    const count = await page.locator(OPTION).count()
    if (count > 1) {
      const paints = await page
        .locator(OPTION)
        .evaluateAll((nodes) =>
          nodes.map((n) => ({
            selected: (n as HTMLElement).getAttribute('aria-selected') === 'true',
            paint: getComputedStyle(n as HTMLElement).backgroundColor,
          })),
        )
      const on = paints.find((p) => p.selected)!
      const off = paints.find((p) => !p.selected)!
      expect(on.paint, 'the selected segment is not visually distinct').not.toBe(off.paint)
    }
  })

  test('archive segmentation and highlight marks — switching runs re-renders that run’s document', async ({
    page,
  }) => {
    // C17 / [u11#c12] — the second document is TAKEN, not assumed (see
    // `fileAnotherRun`). The assert itself is u6's, unchanged.
    await fileAnotherRun(page)
    const reports = reportsOf(await frame(page))
    const rounds = [...new Set(reports.map((r) => r.round))]
    expect(rounds.length, 'the stream carries fewer than two runs — the switch is untestable').toBeGreaterThan(1)

    for (const round of rounds) {
      await page.locator(OPTION).filter({ hasText: new RegExp(`ECHO-${round}\\b`) }).first().click()
      await expect(page.locator(`${OPTION}[aria-selected="true"]`)).toHaveCount(1)
      expect(await activeRun(page)).toBe(round)

      const report = reports.filter((r) => r.round === round).pop()!
      expect(await anchorIds(page.locator(`${BODY} .sent`))).toEqual(report.report_body.map((s) => s.id))
      expect(await anchorIds(page.locator(`${FACTS} .min`))).toEqual(report.facts.map((s) => s.id))
    }
  })

  test('archive segmentation and highlight marks — mined marks survive a run switch, keyed by id', async ({
    page,
  }) => {
    // C17 / [u11#c12] — same re-aim as the switch oracle above: play the loop
    // until a second document exists, then assert exactly what u6 asserted.
    await fileAnotherRun(page)
    const reports = reportsOf(await frame(page))
    const rounds = [...new Set(reports.map((r) => r.round))]
    expect(rounds.length).toBeGreaterThan(1)

    const home = rounds[rounds.length - 1]!
    const away = rounds[0]!
    const target = reports.filter((r) => r.round === home).pop()!.report_body[0]!

    await page.locator(OPTION).filter({ hasText: new RegExp(`ECHO-${home}\\b`) }).first().click()
    // One gesture (08-08): the click tears the sentence out AND seats it, so
    // the mark it leaves is `slotted`. The mine op still reaches the seam —
    // which is what this test is about.
    await page.locator(`${BODY} [data-sentence-id="${target.id}"]`).click()
    await expect(page.locator(`${BODY} [data-sentence-id="${target.id}"]`)).toHaveClass(/\bslotted\b/)
    expect((await frame(page)).store.mined).toContain(target.id)

    // C17 / [u11#c12] — RE-AIMED (08-04), never deleted. This step proved "the
    // rail really switched documents" by looking for the HOME id to disappear.
    // That reading was only ever available because u6's fixture gave each run a
    // different body; u7's loop files the SAME autopsy every day, and
    // spec-client §5.2's amendment makes that correct rather than lazy —
    // "authored script lines … are run-independent (same sentence = same block
    // across runs)". So the switch is proved where it is unambiguous — the
    // rail's own selection and a re-rendered body — and the id-keyed mark, which
    // is what this test is actually about, is still asserted below.
    await page.locator(OPTION).filter({ hasText: new RegExp(`ECHO-${away}\\b`) }).first().click()
    expect(await activeRun(page), 'the rail did not switch to the other run').toBe(away)
    await expect(page.locator(`${BODY} .sent`), 'the away document rendered nothing').not.toHaveCount(0)

    await page.locator(OPTION).filter({ hasText: new RegExp(`ECHO-${home}\\b`) }).first().click()
    await expect(page.locator(`${BODY} [data-sentence-id="${target.id}"]`)).toHaveClass(/\bslotted\b/)

    // Every mark on screen is a mark the STORE holds — nothing positional.
    // Both marks imply mined: `.min.mined` is a sentence whose seat was freed,
    // `.min.slotted` one that still holds one.
    const marked = await anchorIds(page.locator(`${REP} .min.mined, ${REP} .min.slotted`))
    expect(marked.length, 'no mark is on screen — the store oracle is vacuous').toBeGreaterThan(0)
    const store = (await frame(page)).store.mined
    for (const id of marked) expect(store).toContain(id)
  })

  test('archive segmentation and highlight marks — previously-slotted sentences carry the slotted mark', async ({
    page,
  }) => {
    await expect(page.locator(`${REP} .min`), 'nothing is rendered — the mark scan is vacuous').not.toHaveCount(0)
    const f = await frame(page)
    // 08-08: the one mark split in two. TODAY's file is 배치 (`.slotted`); a
    // sitting the operator already deployed is 과거 배치 (`.carried`). Each
    // mark answers to its OWN set — that is the whole point of the split.
    const slotted = new Set(Object.values(f.store.slots))
    const carried = new Set(metaOf(f)?.carried ?? [])
    for (const id of await anchorIds(page.locator(`${REP} .min.slotted`))) expect([...slotted]).toContain(id)
    for (const id of await anchorIds(page.locator(`${REP} .min.carried`))) expect([...carried]).toContain(id)

    const rendered = new Set(await anchorIds(page.locator(`${REP} [data-sentence-id]`)))
    const onScreen = await anchorIds(page.locator(`${REP} .min.slotted, ${REP} .min.carried`))
    for (const id of [...slotted, ...carried]) {
      if (rendered.has(id)) expect(onScreen).toContain(id)
    }
  })
})

/* ══ [u6#c7] a11y ══════════════════════════════════════════════════════ */

test.describe('a11y', () => {
  test.beforeEach(async ({ page }) => {
    await boot(page, { reduced: true })
    await drain(page)
    // The record lands in REPORTS (U3) — raising it is the point now, not a
    // workaround. See `raiseWindow`.
    await raiseWindow(page, 'rep')
  })

  test('a11y — every sentence is a keyboard-reachable button', async ({ page }) => {
    const sentences = page.locator(`${REP} .min`)
    await expect(sentences).not.toHaveCount(0)
    const roles = await sentences.evaluateAll((nodes) =>
      nodes.map((n) => ({
        role: (n as HTMLElement).getAttribute('role'),
        tabindex: (n as HTMLElement).getAttribute('tabindex'),
      })),
    )
    for (const r of roles) {
      expect(r.role).toBe('button')
      expect(r.tabindex).toBe('0')
    }
  })

  test('a11y — Enter mines the focused sentence and Space mines the next one', async ({ page }) => {
    const report = await reportForActiveRun(page)
    expect(report.report_body.length, 'need two body sentences to test both keys').toBeGreaterThan(1)
    const [first, second] = report.report_body

    // One gesture (08-08): each key mines AND seats, so the mark left behind is
    // `slotted`. `#minedCount` counts the mined set, which both keys still grow.
    const before = await minedCount(page)
    await page.locator(`${BODY} [data-sentence-id="${first!.id}"]`).focus()
    await page.keyboard.press('Enter')
    await expect(page.locator(`${BODY} [data-sentence-id="${first!.id}"]`)).toHaveClass(/\bslotted\b/)
    expect(await minedCount(page)).toBe(before + 1)

    await page.locator(`${BODY} [data-sentence-id="${second!.id}"]`).focus()
    await page.keyboard.press(' ')
    await expect(page.locator(`${BODY} [data-sentence-id="${second!.id}"]`)).toHaveClass(/\bslotted\b/)
    expect(await minedCount(page)).toBe(before + 2)
    expect((await frame(page)).store.mined).toEqual([first!.id, second!.id])
  })

  test('a11y — a seated sentence is settled, and re-activating it is a no-op', async ({ page }) => {
    const report = await reportForActiveRun(page)
    const target = report.report_body[0]!
    const node = page.locator(`${BODY} [data-sentence-id="${target.id}"]`)

    // RE-AIMED (08-08). This used to assert a mined sentence stays ENABLED,
    // because T1 made it the pick control for a second click. One gesture
    // retires that step: the click seats the sentence, and a sentence sitting
    // in the file is a dead end until 해제 frees the seat.
    await node.click()
    await expect(node).toHaveAttribute('aria-disabled', 'true')

    const after = await minedCount(page)
    await node.focus()
    await page.keyboard.press('Enter')
    await node.click({ force: true })
    expect(await minedCount(page)).toBe(after)
    expect((await frame(page)).store.mined.filter((id) => id === target.id)).toHaveLength(1)
  })

  test('a11y — the archive rail is a listbox with an announced selection', async ({ page }) => {
    const rail = page.locator(RAIL)
    await expect(rail).toHaveAttribute('role', 'listbox')
    const label = await rail.getAttribute('aria-label')
    expect(label ?? '').not.toBe('')

    const options = page.locator(OPTION)
    await expect(options).not.toHaveCount(0)
    await expect(page.locator(`${OPTION}[aria-selected="true"]`)).toHaveCount(1)
    await expect(page.locator(`${OPTION}[tabindex="0"]`)).toHaveCount(1)
  })

  test('a11y — the rail moves selection by keyboard with a roving tabindex', async ({ page }) => {
    const options = page.locator(OPTION)
    const count = await options.count()
    expect(count, 'need two archive segments to move selection').toBeGreaterThan(1)

    await options.first().click()
    await expect(options.first()).toHaveAttribute('aria-selected', 'true')

    await page.keyboard.press('ArrowRight')
    await expect(options.nth(1)).toHaveAttribute('aria-selected', 'true')
    await expect(options.first()).toHaveAttribute('aria-selected', 'false')
    await expect(page.locator(`${OPTION}[tabindex="0"]`)).toHaveCount(1)
    await expect(options.nth(1)).toHaveAttribute('tabindex', '0')

    await page.keyboard.press('Home')
    await expect(options.first()).toHaveAttribute('aria-selected', 'true')
    await page.keyboard.press('End')
    await expect(options.nth(count - 1)).toHaveAttribute('aria-selected', 'true')
  })

  test('a11y — the window opens no free-text surface (spec-client §3 inv 1)', async ({ page }) => {
    await expect(page.locator(`${REP} .min`), 'nothing is rendered — the inv-1 scan is vacuous').not.toHaveCount(0)
    await expect(page.locator(`${REP} input, ${REP} textarea, ${REP} select`)).toHaveCount(0)
    await expect(page.locator(`${REP} [contenteditable]`)).toHaveCount(0)
  })
})

/* ── T1 — the report is the pick surface; the store window is gone ───────── */

test.describe('slotting from the report (T1)', () => {
  test.beforeEach(async ({ page }) => {
    await boot(page, { reduced: true })
    await drain(page)
    await raiseWindow(page, 'rep')
  })

  test('one activation of a report sentence seats it in the file, by id', async ({ page }) => {
    const id = await mineFirst(page)
    await expect.poll(async () => (await frame(page)).store.slots[0]).toBe(id)
    await raiseWindow(page, 'rep')
    await expect(page.locator(`${REP} [data-sentence-id="${id}"]`).first()).toHaveClass(/\bslotted\b/)
  })

  test('a11y — slotting and unslotting complete with the keyboard alone, zero pointer events', async ({ page }) => {
    // The id is TAKEN without acting on it: `mineFirst` clicks, and one gesture
    // means that click would already have done the slotting this test is about.
    const target = page.locator(`${REP} .min[data-sentence-id]`).first()
    await expect(target, 'no mineable sentence is on the REPORTS pane').toBeVisible({ timeout: 20_000 })
    const id = (await target.getAttribute('data-sentence-id'))!
    await page.evaluate(() => {
      const win = window as unknown as { __pointerEvents?: number }
      win.__pointerEvents = 0
      for (const type of ['click', 'mousedown', 'mouseup', 'pointerdown', 'pointerup']) {
        document.addEventListener(
          type,
          (event) => {
            // A keyboard-activated button fires a click with no coordinates;
            // only a real pointer carries them.
            const pointer = event as MouseEvent
            if (pointer.detail > 0 || pointer.clientX > 0 || pointer.clientY > 0) {
              win.__pointerEvents = (win.__pointerEvents ?? 0) + 1
            }
          },
          true,
        )
      }
    })
    await page.locator(`${REP} [data-sentence-id="${id}"]`).first().focus()
    await page.keyboard.press('Enter')
    await expect.poll(async () => (await frame(page)).store.slots[0]).toBe(id)
    await page.locator('#w-file .slot[data-slot="0"] .slot-unset').focus()
    await page.keyboard.press('Enter')
    await expect.poll(async () => (await frame(page)).store.slots[0]).toBeUndefined()
    await expect(page.locator(`${REP} [data-sentence-id="${id}"]`).first()).toHaveClass(/\bmined\b/)
    expect(
      await page.evaluate(() => (window as unknown as { __pointerEvents?: number }).__pointerEvents),
      'the keyboard path fired a pointer event',
    ).toBe(0)
  })
})

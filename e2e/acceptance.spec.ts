// u11 — spec-client §7 items 1–12, the acceptance run-through.
//
// This file IS §7. Every other e2e spec proves a MECHANISM inside one unit's
// slice; this one walks the day once, end to end, and asserts each of the
// twelve sentences by observable outcome (design D3). Nothing here imports a
// unit spec's helpers, and nothing here re-tests a mechanism a unit already
// pins — a red in this file means the RUN-THROUGH broke, and per [u11#c8] the
// fix belongs to the owning unit, never to this file.
//
// HOST: `npm run dev` (C5(a)). Fixtures are DEV-only by design —
// `driver/demo-run.ts` returns null when `!import.meta.env.DEV` (inv 11 / §5.4)
// — so the fixture round CANNOT run on a player build. The artefact truths
// (pack from dist/data, zero third-party, no debug/fixture code in the bundle)
// are asserted separately by `e2e/preview-smoke.spec.ts` per C5(b).
//
// Test titles are load-bearing — [u11#c1]/[u11#c2]/[u11#c3] filter with
// `-g 'acceptance 1-7'`, `-g 'acceptance 8'` and `-g 'acceptance 9-12'`, and
// Playwright matches the DESCRIBE title concatenated with the test title, so
// every test below inherits its filter from its describe. Do not rename one.
//
// C3: no fixture CONTENT is asserted. Every id, number and label is read back
// out of the driver's own stream through `window.__shell.frame()`, so the suite
// binds to whatever run the shell boots.
import { expect, test } from 'playwright/test'
import type { Page } from 'playwright/test'
import {
  CHROME,
  DEBUG,
  EMPTY_SYMPTOM,
  FEED,
  FILE,
  FREE_TEXT,
  RECORD,
  REPORTS,
  WIN,
  WINDOWS,
} from './fixtures/selectors.ts'
import {
  boot,
  confirmDeploy,
  drain,
  eventsOfType,
  frame,
  lastMeta,
  mineFirst,
  meta,
  newRun,
  rate,
  seedClock,
  seek,
  tallyPhase,
  tallyState,
  watchWire,
} from './fixtures/harness.ts'
import type { Frame, StreamEvent } from './fixtures/harness.ts'

/** Symptom lines the stream published, grouped by the beat they landed in. */
function symptomsPerBeat(f: Frame): number[] {
  const counts: number[] = []
  let open: number | null = null
  for (const event of f.events) {
    if (event.type === 'beat_start') {
      open = 0
      continue
    }
    if (event.type === 'beat_end') {
      if (open !== null) counts.push(open)
      open = null
      continue
    }
    if (event.type !== 'feed' || open === null) continue
    const line = (event as { line?: { kind?: string } }).line
    if (line?.kind === 'symptom') open += 1
  }
  return counts
}

/**
 * Feed lines as the DOM actually painted them. The kind rides the `fl-<kind>`
 * class (`components/run-feed.ts`), which is also how u5's own handle reads it.
 */
async function domLines(page: Page): Promise<{ kind: string; text: string }[]> {
  return page.locator(FEED.line).evaluateAll((nodes) =>
    nodes.map((n) => ({
      kind: (/\bfl-([a-z]+)\b/.exec((n as HTMLElement).className) ?? [, ''])[1] ?? '',
      text: (n.textContent ?? '').trim(),
    })),
  )
}

/* ══ engine-verification half — §7 #1–#7 ═══════════════════════════════════ */

test.describe('acceptance 1-7', () => {
  test('#1 pack loads and the chrome shows title, counter and clock', async ({ page }) => {
    await boot(page)

    // The pack reached the browser: the case name is the pack's, never a literal.
    await expect(page.locator(CHROME.caseName)).not.toBeEmpty()
    const caseName = await page.locator(CHROME.caseName).innerText()
    expect(caseName.trim().length, 'the chrome title is empty — the pack did not load').toBeGreaterThan(0)

    // Counter and clock are painted from the driver, not from markup defaults.
    await expect(page.locator(CHROME.runNum)).not.toBeEmpty()
    await expect(page.locator(CHROME.ddayNum)).not.toBeEmpty()
    await expect(page.locator(CHROME.clockDigits)).toHaveText(/\d{2}:\d{2}/)

    const f = await frame(page)
    expect(f.events.length, 'the driver published no events at open').toBeGreaterThan(0)
    expect(await page.locator(CHROME.runNum).innerText()).toContain(String(lastMeta(f).run))
  })

  test('#2 a full round plays in stream order, ≤3 symptoms a beat, no digit, (변화 없음) when empty', async ({
    page,
  }) => {
    await boot(page)
    await drain(page)

    const f = await frame(page)

    // (a) stream order — the DOM's feed lines are the stream's feed lines, in order.
    const streamText = eventsOfType(f, 'feed').map(
      (e) => ((e as { line?: { text?: string } }).line?.text ?? '').trim(),
    )
    const painted = (await domLines(page)).map((l) => l.text)
    expect(painted.length, 'the feed painted nothing after a full round').toBeGreaterThan(0)
    const order = streamText.filter((t) => t.length > 0 && painted.some((p) => p.includes(t)))
    let cursor = -1
    for (const text of order) {
      const at = painted.findIndex((p, i) => i > cursor && p.includes(text))
      expect(at, `feed line out of stream order: ${text}`).toBeGreaterThan(cursor)
      cursor = at
    }

    // (b) ≤3 symptom lines per beat (§7 #2).
    const perBeat = symptomsPerBeat(f)
    expect(perBeat.length, 'the round played no beats').toBeGreaterThan(0)
    expect(Math.max(...perBeat)).toBeLessThanOrEqual(3)

    // (c) invariant 2 — no digit renders for NPC state on the player surface.
    // The clock stamp is chrome, not state: it is excluded by selector, exactly
    // as u9's inv-2 assert does.
    const npcLines = (await domLines(page)).filter((l) => ['npc', 'symptom'].includes(l.kind))
    expect(npcLines.length, 'the round painted no NPC or symptom line — the scan is vacuous').toBeGreaterThan(0)
    const digits = await page
      .locator('#w-feed .fl-npc .fl-c, #w-feed .fl-symptom .fl-c')
      .evaluateAll((nodes) => nodes.map((n) => n.textContent ?? '').filter((t) => /\d/.test(t)))
    expect(digits, 'a digit reached an NPC or symptom line (inv 2)').toEqual([])

    // (d) the empty symptom set renders its own copy, never a blank line.
    const emptyBeats = perBeat.filter((n) => n === 0).length
    if (emptyBeats > 0) {
      await expect(page.locator(FEED.list)).toContainText(EMPTY_SYMPTOM)
    }
  })

  test("#3 the gate's judgment is observable in the debug pane, its symptoms on the player pane", async ({
    page,
  }) => {
    await boot(page)
    await drain(page)

    // The pane is flag-on in DEV; it reads the driver's stream, nothing else.
    await expect(page.locator(DEBUG.pane)).toHaveCount(1)
    await expect(page.locator(`${DEBUG.pane} ${DEBUG.events}`)).toHaveCount(1)
    const paneText = await page.locator(`${DEBUG.pane} ${DEBUG.events}`).innerText()

    const f = await frame(page)

    // The gate beat's OWN result: §5.2's ratified union carries no `judgment`
    // event, so what the pane can show is the raw stream the gate produced. If
    // a judgment-shaped event ever rides the stream, its delta/bucket/edge must
    // be on the pane. (The §7 #3-vs-§5.2 gap itself is a DISCOVERY entry, not a
    // thing this suite may invent an event type to paper over.)
    const judgments = f.events.filter((e) =>
      ['judgment', 'gate', 'gate_result'].includes(String(e.type)),
    ) as StreamEvent[]
    for (const judgment of judgments) {
      for (const key of ['delta', 'bucket', 'edge']) {
        const value = judgment[key]
        if (value === undefined || value === null) continue
        expect(paneText, `the debug pane does not show the gate's ${key}`).toContain(String(value))
      }
    }

    // The pane is a window on the DRIVER, not a second source of truth.
    const beats = eventsOfType(f, 'beat_end')
    expect(beats.length, 'the round closed no beat, so no gate ever fired').toBeGreaterThan(0)
    expect(paneText.length, 'the debug pane shows nothing at all').toBeGreaterThan(0)
    for (const beat of beats.slice(-1)) {
      expect(paneText, 'the debug pane does not show the gate beat').toContain(String(beat.beat))
    }

    // The player pane sees the SYMPTOMS of that judgment, never its numbers.
    const symptoms = await page.locator('#w-feed .fl-symptom').count()
    expect(symptoms, 'the gate produced no visible symptom on the player pane').toBeGreaterThan(0)
  })

  test("#4 the round report renders exactly once, after the round's last beat", async ({ page }) => {
    await boot(page)
    await drain(page)

    const f = await frame(page)
    const reports = eventsOfType(f, 'report')
    expect(reports.length, 'the round published no report').toBeGreaterThan(0)

    // exactly once: every published sentence id appears on the pane once.
    const ids = await page.locator(REPORTS.sentence).evaluateAll((nodes) =>
      nodes.map((n) => (n as HTMLElement).dataset.sentenceId ?? ''),
    )
    const seen = new Map<string, number>()
    for (const id of ids) seen.set(id, (seen.get(id) ?? 0) + 1)
    expect([...seen.entries()].filter(([, n]) => n > 1), 'a report sentence rendered twice').toEqual([])

    // after the last beat: the report event follows the final `beat_end`.
    const lastBeatEnd = f.events.map((e) => e.type).lastIndexOf('beat_end')
    const firstReport = f.events.findIndex((e) => e.type === 'report')
    expect(lastBeatEnd, 'the round never closed a beat').toBeGreaterThan(-1)
    expect(firstReport, 'the report landed before the last beat closed').toBeGreaterThan(lastBeatEnd)
  })

  test('#5 a mined sentence reaches the store, slots, and rides the deploy op by canonical id', async ({
    page,
  }) => {
    // Reduced motion: the mining click must land on a settled sentence, and the
    // desk honouring the preference is itself part of the shipped behaviour.
    // §7 #5 is the loop's own sentence — the mined sentence slots into the NEXT
    // run's composition — so the day CLOSES first: that is what files the
    // report and hands the file back. RE-AIMED (08-08, W4): this used to press
    // NEW RUN to reach the same state, and under one-press that press is the
    // one that COMMITS the file, so mining after it is refused by design.
    await boot(page, { reduced: true })
    await drain(page)

    const id = await mineFirst(page)

    // store — the card is keyed by the sentence's own authored id.
    expect((await frame(page)).store.mined, 'the mined id never reached the seam').toContain(id)

    // slot — the same id seats on the board, off the same gesture (08-08).
    await expect(page.locator(`${FILE.board} [data-block-id="${id}"]`).first()).toBeVisible()
    expect(Object.values((await frame(page)).store.slots)).toContain(id)

    // deploy — the op carries the canonical id, unchanged.
    await page.locator(FILE.deploy).click()
    await confirmDeploy(page)
    await expect(page.locator(FILE.stamp)).toBeVisible()
    expect((await frame(page)).store.deployed, 'the deploy op dropped the canonical id').toContain(id)

    // …and the pane is the surface that shows it (§7 #5's "debug pane").
    await expect(page.locator(`${DEBUG.pane} ${DEBUG.ops}`)).toHaveCount(1)
  })

  test('#6 the terminal clock is reached and the score renders', async ({ page }) => {
    // C18 — the count-up is a ~9 s diegetic beat and must be allowed to run;
    // the budget here is the 30 s worst case plus boot, never a shortened pace.
    test.setTimeout(120_000)
    await boot(page)

    // §7 #6 is about the CLOCK reaching its terminal minute, not about the
    // stream running out: `drain()` releases the stream while the clock stands
    // still. The C16 hook is what actually moves the sim clock there.
    await seedClock(page, '21:04')
    await drain(page)

    await expect(page.locator(CHROME.clockDigits)).toContainText('21:04')
    await expect(page.locator(RECORD.root)).toHaveCount(1)

    // The run has entered its closing phase…
    await expect
      .poll(async () => tallyPhase(page), { timeout: 20_000, message: 'the run never entered its tally phase' })
      .toBe('tally')
    // …and the LEDGER counts up and settles. `phase()` answers the RUN's phase
    // (`build|run|report|tally`); `pending|counting|final` is the ledger's own
    // state, which is what "the score renders" means (u7's `state()`, the same
    // value `[data-tally-state]` carries). C18: the count-up holds past 9 s, so
    // this waits it out rather than shortening it.
    await expect(page.locator(RECORD.ledger)).toHaveAttribute('data-tally-state', 'final', { timeout: 40_000 })
    expect(await tallyState(page), 'the ledger handle disagrees with the DOM').toBe('final')
    await expect(page.locator(RECORD.big)).toHaveText(/\d/)
  })

  test('#7 a forced fallback line renders and the run continues', async ({ page }) => {
    await boot(page)
    await drain(page)

    const f = await frame(page)
    const fallbacks = eventsOfType(f, 'feed').filter(
      (e) => (e as { line?: { kind?: string } }).line?.kind === 'fallback',
    )
    expect(fallbacks.length, 'the fixture stream forces no fallback line (engine §5)').toBeGreaterThan(0)

    const lines = await domLines(page)
    const at = lines.findIndex((l) => l.kind === 'fallback')
    expect(at, 'the forced fallback never rendered on the feed').toBeGreaterThan(-1)
    expect(lines.length - at, 'the run stopped at the fallback instead of continuing').toBeGreaterThan(1)
    expect((await frame(page)).events.map((e) => e.type)).toContain('run_end')
  })
})

/* ══ persistence — §7 #8 (C4: sessionStorage, never localStorage) ══════════ */

test.describe('acceptance 8', () => {
  test('#8 a page load starts a new sitting, and nothing crosses a tab', async ({ page, browser }) => {
    await boot(page)
    // The desk's OPENING meta — what a tab that never played would show. The
    // fixture opens mid-campaign, so "clean" means "this baseline", not "empty".
    const opening = await meta(page)

    // RE-AIMED (08-05, R3 on shell/run-state.ts:151), never weakened: this used
    // to capture `before` after `drain()` alone, so `before` WAS the opening
    // meta and (b) below passed identically whether the restore worked or the
    // desk cold-booted. One `new_run` moves the state off the pack baseline
    // first, so the assertions can now tell the two apart.
    await newRun(page)
    const before = await meta(page)
    expect(before.archive.length + before.run, 'nothing happened to persist').toBeGreaterThan(0)
    expect(before.run, 'the state never left the pack baseline — the restore check is vacuous').not.toBe(
      opening.run,
    )

    // (a) the tab's own storage is where it went — C4.
    const stored = await page.evaluate(() => ({
      session: Object.keys(window.sessionStorage),
      local: Object.keys(window.localStorage),
    }))
    expect(stored.session.length, 'no meta-state reached sessionStorage').toBeGreaterThan(0)
    expect(stored.local, 'localStorage is forbidden everywhere (C4)').toEqual([])

    // (b) RE-AIMED (08-08, H2) and inverted on purpose: F5 is a RESTART.
    // The resume restored the sitting's identities — callsign, counter, archive
    // — and could not restore the filed report documents, which live in
    // `windows/reports.ts` and are persisted nowhere: the desk came back as
    // ECHO-n with n rail tabs and nothing readable in any of them. The state is
    // still WRITTEN, which is what (a) above proves; it is no longer read back.
    await page.reload()
    await page.waitForFunction(() => Boolean((window as { __agentFile?: unknown }).__agentFile))
    const after = await meta(page)
    expect(after.run, 'F5 resumed the played-out run instead of starting a new sitting').toBe(
      opening.run,
    )
    expect(after.runs_left).toBe(opening.runs_left)
    expect(after.carried).toEqual(opening.carried)
    expect(after.archive.map((a) => a.run)).toEqual(opening.archive.map((a) => a.run))

    // (c) closing the tab starts clean — sessionStorage does not cross
    // contexts, so a new tab opens on the pack's own baseline, never on the
    // played-out state the first tab persisted.
    const fresh = await browser.newContext({ viewport: { width: 1280, height: 800 } })
    const tab = await fresh.newPage()
    try {
      await tab.goto(page.url())
      await tab.waitForFunction(() => Boolean((window as { __agentFile?: unknown }).__agentFile))
      const clean = await meta(tab)
      expect(clean.run, 'a new tab resumed the old tab\'s run counter').toBe(opening.run)
      expect(clean.carried, 'a new tab inherited the old tab\'s carried blocks').toEqual(opening.carried)
      expect(clean.archive.map((a) => a.run)).toEqual(opening.archive.map((a) => a.run))
    } finally {
      await fresh.close()
    }
  })
})

/* ══ shell half — §7 #9–#12 ════════════════════════════════════════════════ */

test.describe('acceptance 9-12', () => {
  test('#9 five windows drag, resize, collapse and close, and the default layout fits 1280x800', async ({
    page,
  }) => {
    await boot(page)

    // default layout: nothing off-screen at the minimum viewport (C9).
    const boxes = await page.locator(WIN.any).evaluateAll((nodes) =>
      nodes
        .filter((n) => !n.classList.contains('hidden'))
        .map((n) => {
          const r = n.getBoundingClientRect()
          return { id: n.id, left: r.left, top: r.top, right: r.right, bottom: r.bottom }
        }),
    )
    for (const box of boxes) {
      expect(box.left, `${box.id} starts off the left edge`).toBeGreaterThanOrEqual(0)
      expect(box.top, `${box.id} starts above the desk`).toBeGreaterThanOrEqual(0)
      expect(box.right, `${box.id} runs past 1280`).toBeLessThanOrEqual(1280)
      expect(box.bottom, `${box.id} runs past 800`).toBeLessThanOrEqual(800)
    }

    const win = page.locator(WINDOWS.rep)

    // drag by the title bar
    const start = (await win.boundingBox())!
    await page.locator(`${WINDOWS.rep} ${WIN.bar}`).hover()
    await page.mouse.down()
    // Up, not down: REPORTS is full column height since T1, and +40 would push
    // its corner grip below the 800px viewport — the resize drag would land on
    // nothing and this test would report a mechanism failure that is really a
    // geometry one.
    await page.mouse.move(start.x + 60, start.y - 40, { steps: 8 })
    await page.mouse.up()
    const dragged = (await win.boundingBox())!
    expect(Math.abs(dragged.x - start.x) + Math.abs(dragged.y - start.y), 'the window did not drag').toBeGreaterThan(4)

    // resize by the corner grip
    const grip = page.locator(`${WINDOWS.rep} ${WIN.grip}`)
    const gripBox = (await grip.boundingBox())!
    await page.mouse.move(gripBox.x + gripBox.width / 2, gripBox.y + gripBox.height / 2)
    await page.mouse.down()
    await page.mouse.move(gripBox.x + 80, gripBox.y + 60, { steps: 8 })
    await page.mouse.up()
    const resized = (await win.boundingBox())!
    expect(Math.abs(resized.width - dragged.width), 'the window did not resize').toBeGreaterThan(4)

    // collapse to the title bar, from the keyboard (controls are reachable)
    const collapse = page.locator(`${WINDOWS.rep} ${WIN.collapse}`)
    await collapse.focus()
    await expect(collapse).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(win).toHaveClass(/collapsed/)
    await page.keyboard.press('Enter')
    await expect(win).not.toHaveClass(/collapsed/)

    // close to the taskbar, and the taskbar brings it back
    const close = page.locator(`${WINDOWS.rep} ${WIN.close}`)
    await close.focus()
    await page.keyboard.press('Enter')
    await expect(win).toBeHidden()
    await page.locator(`${WIN.task}[data-win="rep"]`).click()
    await expect(win).toBeVisible()

    // every window offers the same three controls
    for (const selector of Object.values(WINDOWS)) {
      await expect(page.locator(`${selector} ${WIN.bar}`)).toHaveCount(1)
      await expect(page.locator(`${selector} ${WIN.collapse}`)).toHaveCount(1)
      await expect(page.locator(`${selector} ${WIN.close}`)).toHaveCount(1)
    }
  })

  test('#10 red threads connect every filled slot by authored id and re-draw during a drag', async ({ page }) => {
    await boot(page, { reduced: true })
    // RE-AIMED (08-08, W4): a thread needs a FILLED slot, and the window in
    // which a slot can be filled is the one the close opens — the press that
    // used to open it now commits the file instead.
    await drain(page)

    await mineFirst(page)

    const filled = await page.locator(FILE.filled).count()
    expect(filled, 'no slot was filled, so no thread can be measured').toBeGreaterThan(0)

    const threads = () =>
      page.evaluate(() => {
        const handle = (window as unknown as { __threads?: { count(): number; redraw(): void } }).__threads
        if (!handle) throw new Error('window.__threads is not exposed by the shell boot')
        return handle.count()
      })
    await expect.poll(threads, { message: 'the thread layer drew nothing for a filled slot' }).toBe(filled)

    const geometry = () =>
      page.locator(`${CHROME.threads} path, ${CHROME.threads} line`).evaluateAll((nodes) =>
        nodes.map((n) => n.getAttribute('d') ?? `${n.getAttribute('x1')},${n.getAttribute('y1')}`),
      )
    const before = await geometry()
    expect(before.length, 'the thread layer painted no geometry').toBeGreaterThan(0)

    const box = (await page.locator(WINDOWS.file).boundingBox())!
    await page.locator(`${WINDOWS.file} ${WIN.bar}`).hover()
    await page.mouse.down()
    await page.mouse.move(box.x - 40, box.y + 30, { steps: 10 })
    await page.mouse.up()

    await expect
      .poll(geometry, { message: 'the threads did not re-draw during the drag' })
      .not.toEqual(before)
    expect(await threads(), 'the drag lost a thread').toBe(filled)
  })

  test('#11 the webfonts are self-hosted and the page makes no third-party request', async ({ page, baseURL }) => {
    const wire = watchWire(page, baseURL!)
    await boot(page)
    await drain(page)

    expect(wire.thirdParty(), 'the desk reached a third-party origin (inv 10)').toEqual([])

    // every loaded face came from our own assets path
    const faces = await page.evaluate(() =>
      [...document.styleSheets].flatMap((sheet) => {
        try {
          return [...(sheet.cssRules ?? [])]
            .filter((r) => r.constructor.name === 'CSSFontFaceRule')
            .map((r) => r.cssText)
        } catch {
          return []
        }
      }),
    )
    expect(faces.length, 'no @font-face reached the document — the fonts are not self-hosted').toBeGreaterThan(0)
    for (const face of faces) {
      expect(face, 'a @font-face points off-origin').not.toMatch(/https?:\/\//)
      expect(face).toMatch(/assets\/fonts\//)
    }
  })

  test('#12 no free-text surface exists on the player surface and the pane is flag-gated', async ({ page }) => {
    await boot(page)
    await drain(page)

    // inv 1 — not one free-text surface in the rendered document.
    expect(await page.locator(FREE_TEXT).count(), 'a free-text surface reached the player (inv 1)').toBe(0)

    // …and the desk absorbs typing without changing a text node. No click first:
    // `#desktop` is `display:contents` (a faithful port), so it has no box to
    // click — the keystrokes go wherever the shell put focus, which is the point.
    const snapshot = () => page.locator(CHROME.app).innerText()
    const before = await snapshot()
    await page.keyboard.type('침입 텍스트')
    expect(await snapshot(), 'typing changed the desk — something accepted text').toBe(before)

    // inv 11 — the pane exists only because DEV set the flag; the player build's
    // absence of its code is asserted by preview-smoke and flag-off-bundle.
    const flagged = await page.evaluate(() => document.querySelectorAll('#debug-pane').length)
    expect(flagged, 'the debug pane is missing on the flag-ON host').toBe(1)
  })
})

/* Kept honest: `rate` and `seek` are the harness's pacing controls; the
 * run-through drains instead of waiting out ~77 s of sim time. Referenced here
 * so a future item that needs mid-run pacing does not re-invent them. */
void rate
void seek

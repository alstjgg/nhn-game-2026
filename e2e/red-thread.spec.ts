// u8 — RedThread overlay: the DOM half.
//
// vitest runs `environment: 'node'` and u8 adds no jsdom devDep (C2), so every
// assertion that needs real geometry — `getBoundingClientRect`, a live drag, a
// scrolled window body, computed `z-index` — lives here. The pure half is
// `tests/components/red-thread.test.ts` (u8 design §3).
//
// Covers [u8#c1] every filled slot threaded by id · [u8#c2] re-drawn DURING
// drag / on resize / collapse / close · [u8#c3] one shared stacking context and
// clipping to the visible rect.
//
// Test titles are load-bearing — the unit's verification commands filter with
// `-g 'every filled slot is threaded by id'`, `-g 'endpoints track windows
// during drag'` and `-g 'clipped to visible rect'`. Do NOT rename a describe
// block without updating `.claude/super/units/u8.md`.
//
// C3: nothing here asserts fixture CONTENT. The suite reads the ids the booted
// run actually renders (`#w-rep [data-sentence-id]`) and threads those, so it
// survives u2f replacing placeholder content wholesale. The one literal id used
// for the negative case is the authored grammar `b-r<run>-<channel><nn>`.
//
// It must pass against BOTH servers (dev today, `npm run preview` once u11
// re-points `playwright.config.ts` per C5) — nothing below assumes a dev server.
import { expect, test } from 'playwright/test'
import type { Page } from 'playwright/test'
import { awaitTallyReveal, expectTallyOpen } from './fixtures/harness.ts'

const THREADS = '#threads'
const PATH = `${THREADS} path`
const PIN = `${THREADS} circle`
const FILE = '#w-file'
const REP = '#w-rep'
const TALLY = '#w-tally'

/** An id in the authored grammar that no report can have minted (c1 negative). */
const ABSENT_ID = 'b-r9-f99'

interface ThreadsHandle {
  redraw(): void
  count(): number
}
type Handles = {
  __threads?: ThreadsHandle
  __shell?: { frame(): unknown; drain(): void }
  __feed?: { rate(to: number): void }
  __agentFile?: {
    slots(): (string | null)[]
    place(id: string, slot: number): void
    clear(slot: number): void
    index(s: { id: string; text: string; species: string; axis?: string }): void
  }
}

interface Box {
  x: number
  y: number
  width: number
  height: number
}

/* ── shell handles (u3's dev/test surface, u4's window handle) ───────────── */

async function drain(page: Page): Promise<void> {
  await page.evaluate(() => {
    const handle = (window as unknown as Handles).__shell
    if (!handle) throw new Error('window.__shell is not exposed by the shell boot')
    handle.drain()
  })
  // u7 ruling — the close→reveal gap belongs to TALLY; see `awaitTallyReveal`.
  await awaitTallyReveal(page)
}

/** Force one synchronous redraw, then let the layer's own rAF settle. */
async function redraw(page: Page): Promise<void> {
  await page.evaluate(() => {
    const handle = (window as unknown as Handles).__threads
    if (!handle) throw new Error('window.__threads is not exposed by the thread layer')
    handle.redraw()
  })
  await page.evaluate(() => new Promise<void>((r) => requestAnimationFrame(() => r())))
}

/**
 * Holds the desk still — the transport's OWN pause, not a test-only freeze.
 *
 * C17 / [u11#c12] — RE-AIMED (08-04, u11 attempt 2). Every oracle in this file
 * measures GEOMETRY, and geometry needs two or three reads of the same state:
 * a path, the anchor it lands on, the window that carries it. A running desk
 * keeps beating between those reads — a new line lands, REPORTS re-renders, an
 * anchor leaves its window's visible rect and [u8#c3] correctly clips the
 * thread away — and the oracle then compares frame N with frame N+k. That is
 * the u11 attempt-1 flake (`endpointsOf(undefined)` under full-suite load,
 * green in isolation) and its two siblings under load.
 *
 * `rate(0)` is pause, one of the three speeds the driver's clock accepts
 * (`windows/live-feed.ts:41` — "0 is pause"), i.e. exactly what the operator's
 * ⏸ does. Nothing this file proves depends on the clock advancing: threads are
 * drawn from slots and anchors, re-drawn on drag/resize/collapse/close, and
 * clipped to the visible rect — all clock-free. So the desk is stopped, not
 * mocked, and every check below still runs against the real mechanism.
 */
async function holdStill(page: Page): Promise<void> {
  await page.evaluate(() => {
    const handle = (window as unknown as Handles).__feed
    if (!handle) throw new Error('window.__feed is not exposed by the LIVE FEED window')
    handle.rate(0)
  })
}

/**
 * Boot the desk with the report rendered and the thread layer mounted.
 * `reducedMotion` freezes u6's typewriter so sentence anchors are final.
 */
async function boot(page: Page): Promise<void> {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('./')
  await expect(page.locator(FILE)).toBeVisible()
  await expect(page.locator(REP)).toBeVisible()
  await page.waitForFunction(() => (window as unknown as Handles).__threads !== undefined)
  await page.waitForFunction(() => (window as unknown as Handles).__agentFile !== undefined)
  await drain(page)
  await takeNextRun(page)
  await expect(page.locator(`${REP} [data-sentence-id]`).first()).toBeVisible()
  await holdStill(page)
}

/**
 * Leaves the TALLY the way the run's own loop leaves it — NEW RUN.
 *
 * C17 / [u11#c12] — RE-AIMED (08-04, u11 attempt 2). This is the setup the
 * file's flakiness lived in. The code here used to close the sheet with its
 * `.wc-close` button, under a comment that said so explicitly: "u7 — the unit
 * that will keep the tally shut until the run ends — has not landed, so the
 * suite closes it the way the operator does". u7 has landed since, and
 * `drain()` flushes the run to its TERMINAL — which is exactly the phase in
 * which u7 OPENS the tally and keeps it open. Closing it by hand fought the run
 * state instead of leaving it: any frame that followed put the sheet straight
 * back up, and while it is up `planThreads` returns [] for EVERY thread, by
 * design ([u8#c1], reference `app.js:579`).
 *
 * That, not the thread layer, was every red in this file: measured 1 in 5
 * full-suite runs and ~60 % under a loaded `--repeat-each`, across the MID-drag,
 * REPORTS-drag and TALLY-open oracles alike, and `#w-tally` read
 * `win win-tally focused` — no `hidden` — at the moment of every single one.
 *
 * `#btnNewRun` is the loop's own way out: it files the closing report, carries
 * the blocks and starts the next day, so the desk is in a RUN phase where the
 * tally is shut because the run says so — and with the clock held at 0 it never
 * reaches the next 21:04. Nothing is skipped and no thread rule is relaxed.
 */
async function takeNextRun(page: Page): Promise<void> {
  await expect(page.locator(TALLY), 'the run ended but the TALLY sheet never came up').not.toHaveClass(
    /\bhidden\b/,
    { timeout: 30_000 },
  )
  const newRun = page.locator(`${TALLY} #btnNewRun`)
  await expect(newRun, 'the tally never unlocked NEW RUN').toBeEnabled({ timeout: 30_000 })
  await newRun.click()
  await expect(page.locator(TALLY), 'NEW RUN did not put the tally away').toHaveClass(/\bhidden\b/, {
    timeout: 20_000,
  })
}

/** The sentence ids the booted run actually rendered, in document order (C3). */
async function sourceIds(page: Page): Promise<string[]> {
  const ids = await page
    .locator(`${REP} [data-sentence-id]`)
    .evaluateAll((nodes) => nodes.map((n) => (n as HTMLElement).dataset.sentenceId ?? ''))
  expect(ids.length, 'the booted report renders no sentence anchor — nothing to thread').toBeGreaterThan(1)
  return ids
}

async function place(page: Page, id: string, slot: number): Promise<void> {
  await page.evaluate(
    ([blockId, index]) => {
      const handle = (window as unknown as Handles).__agentFile
      if (!handle) throw new Error('window.__agentFile is not exposed by the AGENT FILE window')
      handle.place(blockId as string, index as number)
    },
    [id, slot] as [string, number],
  )
}

async function clear(page: Page, slot: number): Promise<void> {
  await page.evaluate((index) => {
    const handle = (window as unknown as Handles).__agentFile
    if (!handle) throw new Error('window.__agentFile is not exposed by the AGENT FILE window')
    handle.clear(index)
  }, slot)
}

/**
 * Fill `n` slots with the first `n` rendered sentence ids; returns those ids.
 *
 * The AGENT FILE body scrolls — its dossier stands above the board, so at the
 * default arrangement the slots sit below the fold. An anchor scrolled out of
 * its window body has no visible rect and therefore no thread, by the very rule
 * [u8#c3] pins (reference `app.js:567`), so the suite brings the board into
 * view exactly as the operator would before asserting anything about a string.
 */
async function thread(page: Page, n: number): Promise<string[]> {
  const ids = (await sourceIds(page)).slice(0, n)
  for (const [i, id] of ids.entries()) await place(page, id, i)
  await page.locator(`${FILE} .slot.filled`).last().scrollIntoViewIfNeeded()
  await redraw(page)
  return ids
}

/* ── geometry helpers ────────────────────────────────────────────────────── */

async function box(page: Page, selector: string): Promise<Box> {
  const b = await page.locator(selector).first().boundingBox()
  expect(b, `${selector} has no bounding box`).not.toBeNull()
  return b!
}

/** `[[x2,y2],[x1,y1]]` of a path: the `M` start and the `Q` end point. */
function endpointsOf(d: string): [number, number][] {
  const nums = [...d.matchAll(/-?\d+(?:\.\d+)?/g)].map((m) => Number(m[0]))
  expect(nums.length, `unparseable path data: ${d}`).toBe(6)
  return [
    [nums[0]!, nums[1]!],
    [nums[4]!, nums[5]!],
  ]
}

async function pathData(page: Page): Promise<string[]> {
  return page.locator(PATH).evaluateAll((nodes) => nodes.map((n) => n.getAttribute('d') ?? ''))
}

/**
 * The first path's `d` once the layer has drawn it — or a failure saying WHY
 * there is none.
 *
 * C17 / [u11#c12] — RE-AIMED (08-04, u11 attempt 2). "no thread is drawn" on
 * its own is unactionable: the string can be missing because the layer has not
 * redrawn yet, because an anchor left its window's visible rect ([u8#c3],
 * correct), or because the TALLY is up and owns the screen ([u8#c1], also
 * correct). So the read waits a few frames for the layer's own rAF instead of
 * demanding the string in whichever frame it happened to sample — it never
 * CALLS `redraw()`, so [u8#c2] is still what is proven — and a real miss is
 * reported with the state that decided it. That report is what found the cause
 * of this file's flake: `tally` read `win win-tally focused` every time.
 */
async function threadPath(page: Page): Promise<string> {
  const deadline = Date.now() + 5000
  for (;;) {
    const [d] = await pathData(page)
    if (d) return d
    if (Date.now() >= deadline) break
    await page.waitForTimeout(50)
  }
  const why = await page.evaluate(
    ([fileSelector, repSelector]) => {
      const rect = (selector: string): unknown => {
        const node = document.querySelector(selector)
        if (!node) return null
        const r = node.getBoundingClientRect()
        return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }
      }
      const win = (selector: string): unknown => ({
        box: rect(selector),
        body: rect(`${selector} .win-body`),
        scrollTop: (document.querySelector(`${selector} .win-body`) as HTMLElement | null)?.scrollTop ?? null,
        className: document.querySelector(selector)?.className ?? null,
      })
      const frame = (window as unknown as Handles).__shell?.frame() as
        | { store?: { slots?: Record<number, string> } }
        | undefined
      return {
        threads: (window as unknown as Handles).__threads?.count() ?? null,
        slots: (window as unknown as Handles).__agentFile?.slots() ?? null,
        // the layer's narrowing set is the DRIVER's store, not the DOM
        // (`shell/boot.ts:106`) — the two can disagree
        driverSlots: frame?.store?.slots ?? null,
        // `planThreads` returns [] outright while the tally is up ([u8#c1]) —
        // the FIRST thing to check when every thread is gone at once
        tally: document.querySelector('#w-tally')?.className ?? null,
        body: document.body.className,
        file: win(fileSelector as string),
        slot: rect(`${fileSelector} .slot.filled`),
        rep: win(repSelector as string),
        source: rect(`${repSelector} [data-sentence-id]`),
      }
    },
    [FILE, REP] as [string, string],
  )
  throw new Error(`no thread is drawn after 5 s — ${JSON.stringify(why)}`)
}

/** The single path's slot-side endpoint (the `Q` end, `rectA.left + 6`). */
async function slotEndpoint(page: Page): Promise<[number, number]> {
  return endpointsOf(await threadPath(page))[1]
}

/**
 * ONE coherent reading of the thread and the anchors it joins.
 *
 * The desk does not hold still: the run keeps beating while a test measures, so
 * REPORTS and AGENT FILE re-render between two awaits. Reading `d` in one round
 * trip and a `boundingBox()` in the next therefore compares a path drawn at
 * frame N with a rect measured at frame N+k — and if a beat scrolled either
 * anchor out of its window's visible rect in between, [u8#c3] correctly clips
 * the thread away and the path read comes back EMPTY (the u11 attempt-1 flake:
 * `endpointsOf(undefined)` under full-suite load, green in isolation).
 *
 * So redraw and read inside a SINGLE page task: `d` and both rects then belong
 * to the same frame by construction. If the anchors are momentarily out of view
 * the snapshot answers `null` and the caller polls — never a redesign of the
 * clipping rule, which is the very behaviour [u8#c3] pins.
 */
interface ThreadSnapshot {
  d: string
  boxes: Box[]
}

async function threadSnapshot(page: Page, selectors: string[]): Promise<ThreadSnapshot> {
  let snapshot: ThreadSnapshot | null = null
  await expect
    .poll(
      async () => {
        snapshot = await page.evaluate(
          ([pathSelector, wanted]) => {
            const handle = (window as unknown as Handles).__threads
            if (!handle) throw new Error('window.__threads is not exposed by the thread layer')
            handle.redraw()
            const path = document.querySelector(pathSelector as string)
            if (!path) return null
            const boxes: Box[] = []
            for (const selector of wanted as string[]) {
              const node = document.querySelector(selector)
              if (!node) return null
              const r = node.getBoundingClientRect()
              boxes.push({ x: r.x, y: r.y, width: r.width, height: r.height })
            }
            return { d: path.getAttribute('d') ?? '', boxes }
          },
          [PATH, selectors] as [string, string[]],
        )
        return snapshot !== null
      },
      { message: 'no thread and its anchors were ever readable in one frame', timeout: 15_000 },
    )
    .toBe(true)
  return snapshot!
}

function near(actual: number, expected: number, tol = 2): void {
  expect(Math.abs(actual - expected), `expected ${actual} within ${tol} of ${expected}`).toBeLessThanOrEqual(
    tol,
  )
}

/* ══ [u8#c1] every filled slot is threaded by id ═════════════════════════ */

test.describe('every filled slot is threaded by id', () => {
  test.beforeEach(async ({ page }) => {
    await boot(page)
  })

  test('every filled slot is threaded by id — one path per filled slot, two pins each', async ({
    page,
  }) => {
    await expect(page.locator(PATH)).toHaveCount(0)
    const ids = await thread(page, 2)
    expect(ids).toHaveLength(2)
    await expect(page.locator(PATH)).toHaveCount(2)
    await expect(page.locator(PIN)).toHaveCount(4)
  })

  test('every filled slot is threaded by id — both pins land on the two anchors', async ({ page }) => {
    const [id] = await thread(page, 1)
    await expect(page.locator(PATH)).toHaveCount(1)

    const {
      d,
      boxes: [slotBox, srcBox],
    } = await threadSnapshot(page, [
      `${FILE} .slot-pin[data-block-id="${id}"], ${FILE} [data-block-id="${id}"]`,
      `${REP} [data-sentence-id="${id}"]`,
    ])
    const [source, slot] = endpointsOf(d)

    near(slot[0], slotBox.x + 6)
    near(slot[1], slotBox.y + slotBox.height / 2)
    near(source[0], srcBox.x + srcBox.width - 4)
    near(source[1], srcBox.y + srcBox.height / 2)
  })

  test('every filled slot is threaded by id — the id on two slot nodes still draws one thread', async ({
    page,
  }) => {
    // u4 writes `data-block-id` on BOTH the `.slot` cell and its `.slot-pin`.
    const [id] = await thread(page, 1)
    await expect(page.locator(`${FILE} [data-block-id="${id}"]`)).toHaveCount(2)
    await expect(page.locator(PATH)).toHaveCount(1)
  })

  test('every filled slot is threaded by id — unslotting removes exactly that thread', async ({ page }) => {
    const ids = await thread(page, 2)
    await expect(page.locator(PATH)).toHaveCount(2)

    await clear(page, 0)
    await redraw(page)
    await expect(page.locator(PATH)).toHaveCount(1)
    await expect(page.locator(PIN)).toHaveCount(2)

    // the survivor is the OTHER id: its source anchor still owns an endpoint
    const {
      d,
      boxes: [srcBox],
    } = await threadSnapshot(page, [`${REP} [data-sentence-id="${ids[1]}"]`])
    const [source] = endpointsOf(d)
    near(source[0], srcBox.x + srcBox.width - 4)
    near(source[1], srcBox.y + srcBox.height / 2)
  })

  test('every filled slot is threaded by id — a slot whose source id has no anchor draws nothing', async ({
    page,
  }) => {
    // Matching never falls back to text: an id the report never rendered is
    // simply not drawn ([u8#c4], asserted end to end here).
    await page.evaluate((id) => {
      const handle = (window as unknown as Handles).__agentFile
      if (!handle) throw new Error('window.__agentFile is not exposed by the AGENT FILE window')
      handle.index({ id, text: '—', species: 'fact' })
    }, ABSENT_ID)
    await place(page, ABSENT_ID, 0)
    await redraw(page)

    await expect(page.locator(`${FILE} [data-block-id="${ABSENT_ID}"]`).first()).toBeVisible()
    await expect(page.locator(`${REP} [data-sentence-id="${ABSENT_ID}"]`)).toHaveCount(0)
    await expect(page.locator(PATH)).toHaveCount(0)
  })

  test('every filled slot is threaded by id — an empty file draws no thread at all', async ({ page }) => {
    await redraw(page)
    await expect(page.locator(PATH)).toHaveCount(0)
    await expect(page.locator(PIN)).toHaveCount(0)
  })

  test('every filled slot is threaded by id — while the TALLY is open no thread crosses it', async ({
    page,
  }) => {
    await thread(page, 2)
    await expect(page.locator(PATH)).toHaveCount(2)

    await page.locator('#taskbar [data-win="tally"]').click()
    // Opened by hand, mid-run — no close crossed, so there is no reveal to
    // wait out. Visibility is the whole assertion (`expectTallyOpen`), and it
    // is the harness that knows how the sheet spells "hidden".
    await expectTallyOpen(page)
    await redraw(page)
    await expect(page.locator(PATH)).toHaveCount(0)
  })
})

/* ══ [u8#c2] endpoints track windows during drag ═════════════════════════ */

test.describe('endpoints track windows during drag', () => {
  test.beforeEach(async ({ page }) => {
    await boot(page)
    await thread(page, 1)
    await expect(page.locator(PATH)).toHaveCount(1)
  })

  test('endpoints track windows during drag — the endpoint moves MID-drag, before mouseup', async ({
    page,
  }) => {
    const bar = await box(page, `${FILE} .win-bar`)
    const before = await slotEndpoint(page)
    const windowBefore = await box(page, FILE)
    const start = { x: bar.x + bar.width / 2, y: bar.y + bar.height / 2 }
    const dx = -80
    const dy = 60

    await page.mouse.move(start.x, start.y)
    await page.mouse.down()
    // three intermediate moves and NO mouseup — the string must already follow
    await page.mouse.move(start.x + dx / 3, start.y + dy / 3)
    await page.mouse.move(start.x + (dx * 2) / 3, start.y + (dy * 2) / 3)
    await page.mouse.move(start.x + dx, start.y + dy)
    await page.waitForTimeout(50)

    await expect(page.locator(FILE)).toHaveClass(/\bdragging\b/)
    const during = await slotEndpoint(page)
    // C17 / [u11#c12] — RE-AIMED (08-04), never deleted: the endpoint is
    // compared to what the WINDOW did, not to what the pointer asked for. u3's
    // drag clamp (`window-manager.ts:105` — `maxY = innerHeight - height +
    // EDGE_SLACK`) leaves AGENT FILE 54 px of downward travel at the finished
    // desk arrangement (y 94, h 692, viewport 800), so a 60 px pull moves the
    // window 54 px and a string that tracks it perfectly still reads 54. The
    // contract this test owns is "the endpoint tracks the window MID-drag", and
    // that is now what it measures — a lagging string still fails, and the
    // window is asserted to have actually moved so the check cannot go vacuous.
    const windowDuring = await box(page, FILE)
    const movedX = windowDuring.x - windowBefore.x
    const movedY = windowDuring.y - windowBefore.y
    expect(Math.abs(movedX), 'the window did not move at all — the drag never started').toBeGreaterThan(8)
    expect(Math.abs(movedY), 'the window did not move at all — the drag never started').toBeGreaterThan(8)
    near(during[0] - before[0], movedX)
    near(during[1] - before[1], movedY)

    await page.mouse.up()
    await redraw(page)
    const after = await slotEndpoint(page)
    near(after[0], during[0])
    near(after[1], during[1])
  })

  test('endpoints track windows during drag — dragging the REPORTS window moves the source end', async ({
    page,
  }) => {
    const bar = await box(page, `${REP} .win-bar`)
    const [before] = endpointsOf(await threadPath(page))
    const start = { x: bar.x + bar.width / 2, y: bar.y + bar.height / 2 }
    // Downward: u3's manager clamps a window's top to the chrome band
    // (`window-manager.ts:33` CHROME_BAND = 76) and REPORTS opens at y 94, so a
    // 40px drag UP is absorbed by the clamp after 18px — the string would track
    // the window faithfully and the assertion would still read as a failure.
    const dy = 40

    await page.mouse.move(start.x, start.y)
    await page.mouse.down()
    await page.mouse.move(start.x, start.y + dy / 2)
    await page.mouse.move(start.x, start.y + dy)
    await page.waitForTimeout(50)

    const [during] = endpointsOf(await threadPath(page))
    near(during[1] - before[1], dy)
    await page.mouse.up()
  })

  test('endpoints track windows during drag — a viewport resize re-draws and re-fits the viewBox', async ({
    page,
  }) => {
    const before = await slotEndpoint(page)
    await page.setViewportSize({ width: 1440, height: 900 })
    await expect(page.locator(PATH)).toHaveCount(1)
    await expect
      .poll(async () => (await page.locator(THREADS).getAttribute('viewBox')) ?? '')
      .toBe('0 0 1440 900')

    // The layer re-draws on its OWN rAF after the resize re-flows the desk —
    // that self-driven convergence is the claim, so nothing forces a redraw
    // here. But a one-shot read can land mid-convergence under a loaded worker
    // pool (measured: endpoint at the old layout, slot box at the new one), so
    // the read polls until the thread has re-fit to where the slot now is.
    await expect
      .poll(async () => {
        const [x] = await slotEndpoint(page)
        const b = await box(page, `${FILE} [data-block-id]`)
        return Math.abs(x - (b.x + 6))
      }, { message: 'the slot endpoint never re-fit to the resized layout' })
      .toBeLessThanOrEqual(2)
    const after = await slotEndpoint(page)
    expect(after[0] === before[0] && after[1] === before[1]).toBe(false)
  })

  test('endpoints track windows during drag — collapsing a window drops its threads', async ({ page }) => {
    await page.locator(`${FILE} .wc-min`).click()
    await expect(page.locator(FILE)).toHaveClass(/\bcollapsed\b/)
    await expect(page.locator(PATH)).toHaveCount(0)

    await page.locator(`${FILE} .wc-min`).click()
    await expect(page.locator(FILE)).not.toHaveClass(/\bcollapsed\b/)
    await expect(page.locator(PATH)).toHaveCount(1)
  })

  test('endpoints track windows during drag — closing a window drops its threads', async ({ page }) => {
    await page.locator(`${REP} .wc-close`).click()
    await expect(page.locator(REP)).toHaveClass(/\bhidden\b/)
    await expect(page.locator(PATH)).toHaveCount(0)
    await expect(page.locator(PIN)).toHaveCount(0)
  })

  test('endpoints track windows during drag — a resize by the grip re-draws within a frame', async ({
    page,
  }) => {
    const grip = await box(page, `${FILE} .win-grip`)
    const before = await slotEndpoint(page)
    await page.mouse.move(grip.x + grip.width / 2, grip.y + grip.height / 2)
    await page.mouse.down()
    await page.mouse.move(grip.x + 120, grip.y + 90)
    await page.waitForTimeout(50)
    const during = await slotEndpoint(page)
    expect(before[0] !== during[0] || before[1] !== during[1]).toBe(true)
    await page.mouse.up()
  })
})

/* ══ [u8#c3] clipped to visible rect ═════════════════════════════════════ */

test.describe('clipped to visible rect', () => {
  test.beforeEach(async ({ page }) => {
    await boot(page)
  })

  test('clipped to visible rect — the overlay is a direct child of #app, over every window', async ({
    page,
  }) => {
    await expect(page.locator(`#app > svg${THREADS}`)).toHaveCount(1)
    const layering = await page.evaluate(() => {
      const svg = document.querySelector('#threads')!
      const style = getComputedStyle(svg)
      const wins = [...document.querySelectorAll('.win')].map((w) =>
        Number(getComputedStyle(w).zIndex || '0'),
      )
      return {
        position: style.position,
        pointerEvents: style.pointerEvents,
        z: Number(style.zIndex || '0'),
        maxWin: Math.max(...wins),
        stacked: svg.closest('#desktop') !== null,
      }
    })
    expect(layering.position).toBe('fixed')
    expect(layering.pointerEvents).toBe('none')
    expect(layering.stacked, '#threads sits inside #desktop — that is a second stacking context').toBe(false)
    expect(layering.z).toBeGreaterThan(layering.maxWin)
  })

  test('clipped to visible rect — the overlay never intercepts a pointer', async ({ page }) => {
    await thread(page, 1)
    const { d } = await threadSnapshot(page, [])
    const [, slot] = endpointsOf(d)
    const hit = await page.evaluate(
      ([x, y]) => document.elementFromPoint(x as number, y as number)?.closest('#threads') !== null,
      slot as [number, number],
    )
    expect(hit, 'a point on the thread hit-tests to the overlay — it must be pointer-transparent').toBe(false)
  })

  test('clipped to visible rect — a source scrolled out of its body drops exactly that thread', async ({
    page,
  }) => {
    const ids = await thread(page, 2)
    await expect(page.locator(PATH)).toHaveCount(2)

    // C17 / [u11#c12] — RE-AIMED (08-04, integration). This case used to end at
    // `test.skip(!scrolled, …)` "the REPORTS body does not overflow in this run",
    // which meant [u8#c3]'s ONE scroll-out oracle never ran in the full suite.
    // The stated reason was not the real one, and measuring it says so: REPORTS
    // DOES overflow at the finished arrangement (`article.doc.doc-facts`,
    // scrollHeight 491 over clientHeight 298 — 193 px of travel). What the old
    // setup scrolled was `.win-body`, and `.win-body` is `overflow-y: hidden` —
    // `scrollTop` on it is a no-op, so `scrolled` was false EVERY run and the
    // skip fired unconditionally. REPORTS puts its two documents in `article.doc`
    // columns and those are the scrollers.
    //
    // So the precondition is MADE, not hoped for: find the sentence's own
    // scroller, and move it exactly far enough to lift that sentence clear of
    // the body's top edge — `clipRect` drops an anchor whose bottom is above
    // `body.top + THREAD_CLIP_PAD` (2). Scrolling by the minimum needed, rather
    // than to the end, is what keeps this a ONE-thread test: the second sentence
    // sits BELOW the first in the same column, so it rides up by the same amount
    // and stays inside. Every branch that cannot reach the precondition returns
    // a reason and fails the assert below — nothing is skipped.
    const CLEAR = 8
    const setup = await page.evaluate(
      ([id, clear]) => {
        const node = document.querySelector(`#w-rep [data-sentence-id="${id}"]`) as HTMLElement | null
        const body = document.querySelector('#w-rep .win-body') as HTMLElement | null
        if (!node || !body) return { ok: false, why: 'REPORTS renders no anchor for the first threaded sentence' }

        const scrolls = (el: HTMLElement): boolean =>
          /auto|scroll/.test(getComputedStyle(el).overflowY) && el.scrollHeight > el.clientHeight + 1
        let scroller = node.parentElement
        while (scroller && scroller !== body && !scrolls(scroller)) scroller = scroller.parentElement
        if (!scroller || scroller === body) {
          return { ok: false, why: 'no scrollable ancestor between the sentence and .win-body — nothing can scroll out' }
        }

        const need = node.getBoundingClientRect().bottom - body.getBoundingClientRect().top + (clear as number)
        const range = scroller.scrollHeight - scroller.clientHeight
        if (range < need) {
          return { ok: false, why: `the sentence's column scrolls ${range}px but needs ${Math.ceil(need)}px to clear the body's top edge` }
        }
        scroller.scrollTop = need

        const r = node.getBoundingClientRect()
        const b = body.getBoundingClientRect()
        if (!(r.bottom < b.top)) {
          return { ok: false, why: `the sentence is still inside the body after scrolling (bottom ${r.bottom} vs body top ${b.top})` }
        }
        return { ok: true, why: '' }
      },
      [ids[0], CLEAR] as [string, number],
    )
    expect(
      setup.ok,
      `the [u8#c3] scroll-out precondition could not be reached, so the criterion is not being measured: ${setup.why}`,
    ).toBe(true)

    await redraw(page)
    await expect(page.locator(PATH)).toHaveCount(1)
    await expect(page.locator(PIN)).toHaveCount(2)

    // No stray line: the survivor's source end is still inside the body rect.
    const inside = await page.evaluate(() => {
      const d = document.querySelector('#threads path')?.getAttribute('d') ?? ''
      const n = [...d.matchAll(/-?\d+(?:\.\d+)?/g)].map((m) => Number(m[0]))
      const b = document.querySelector('#w-rep .win-body')!.getBoundingClientRect()
      return n.length === 6 && n[1]! >= b.top - 2 && n[1]! <= b.bottom + 2
    })
    expect(inside, 'the surviving thread starts outside the REPORTS body — a stray line').toBe(true)
  })

  test('clipped to visible rect — the viewBox tracks the viewport', async ({ page }) => {
    await thread(page, 1)
    await expect
      .poll(async () => (await page.locator(THREADS).getAttribute('viewBox')) ?? '')
      .toBe('0 0 1280 800')
  })

  test('clipped to visible rect — the overlay carries only <path> and <circle> nodes', async ({ page }) => {
    await thread(page, 2)
    const tags = await page
      .locator(`${THREADS} > *`)
      .evaluateAll((nodes) => [...new Set(nodes.map((n) => n.tagName.toLowerCase()))])
    expect(tags.sort()).toEqual(['circle', 'path'])
    await expect(page.locator(THREADS)).toHaveAttribute('aria-hidden', 'true')
  })
})

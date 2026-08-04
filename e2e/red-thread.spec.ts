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
  // The TALLY owns the screen when it is open — it must be closed for any
  // thread to exist at all (reference app.js:579). u3's desk opens all five
  // windows at boot (`e2e/a11y.spec.ts:44` pins that every one of them is
  // visible) and u7 — the unit that will keep the tally shut until the run
  // ends — has not landed, so the suite closes it the way the operator does,
  // exactly as the reference does at `app.js:652`. discovery/u8.md §6.
  if (!((await page.locator(TALLY).getAttribute('class')) ?? '').split(' ').includes('hidden')) {
    await page.locator(`${TALLY} .wc-close`).click()
  }
  await expect(page.locator(TALLY)).toHaveClass(/\bhidden\b/)
  await expect(page.locator(`${REP} [data-sentence-id]`).first()).toBeVisible()
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

/** The single path's slot-side endpoint (the `Q` end, `rectA.left + 6`). */
async function slotEndpoint(page: Page): Promise<[number, number]> {
  const [d] = await pathData(page)
  expect(d, 'no thread is drawn').toBeTruthy()
  return endpointsOf(d!)[1]
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

    const slotBox = await box(page, `${FILE} .slot-pin[data-block-id="${id}"], ${FILE} [data-block-id="${id}"]`)
    const srcBox = await box(page, `${REP} [data-sentence-id="${id}"]`)
    const [source, slot] = endpointsOf((await pathData(page))[0]!)

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
    const srcBox = await box(page, `${REP} [data-sentence-id="${ids[1]}"]`)
    const [source] = endpointsOf((await pathData(page))[0]!)
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
    await expect(page.locator(TALLY)).not.toHaveClass(/\bhidden\b/)
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
    near(during[0] - before[0], dx)
    near(during[1] - before[1], dy)

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
    const [before] = endpointsOf((await pathData(page))[0]!)
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

    const [during] = endpointsOf((await pathData(page))[0]!)
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

    const after = await slotEndpoint(page)
    const slotBox = await box(page, `${FILE} [data-block-id]`)
    near(after[0], slotBox.x + 6)
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
    const [, slot] = endpointsOf((await pathData(page))[0]!)
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

    // Scroll the REPORTS body until the FIRST threaded sentence leaves it.
    const scrolled = await page.evaluate((id) => {
      const node = document.querySelector(`#w-rep [data-sentence-id="${id}"]`)
      const body = document.querySelector('#w-rep .win-body') as HTMLElement | null
      if (!node || !body) return false
      body.scrollTop = body.scrollHeight
      const r = node.getBoundingClientRect()
      const b = body.getBoundingClientRect()
      return r.bottom < b.top + 2 || r.top > b.bottom - 2
    }, ids[0])
    test.skip(!scrolled, 'the REPORTS body does not overflow in this run — nothing can scroll out of view')

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

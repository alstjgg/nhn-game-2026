// u3 — the shell: topbar (clock · D-DAY · case) · taskbar · window manager ·
// applyLayout · desktop dressing.
//
// Covers [u3#c1] window ops · [u3#c2] default layout · [u3#c3] topbar ·
// [u3#c4] single stacking context · [u3#c5] a11y · [u3#c10] empty window bodies
// · desktop dressing / overlay hosts.
//
// Test titles are load-bearing: the unit's verification commands filter with
// `-g 'window ops'`, `-g 'default layout fits 1280x800'`, `-g 'topbar'`,
// `-g 'single stacking context'` and `-g 'a11y'`. Do not rename a describe
// block without updating `.claude/super/units/u3.md`.
//
// Contract this suite pins (design.md for this run is stale — see tests.md):
//   • window keys/ids: feed→#w-feed · file→#w-file · store→#w-store ·
//     rep→#w-rep, each `.win[data-win=<key>]`
//   • `window.__shell` — dev/test handle: `{ frame(): Frame; drain(): void }`,
//     `frame()` delegating straight to the driver so "driver-fed" is testable.
//
// C3 (placeholder fixtures): nothing here asserts synthetic fixture CONTENT.
// The two literals that do appear — `우는다리` and `21:04` — are frozen repo
// data (`data/scenario/우는다리/meta.json`), not fixture text, and `21:04` is
// named by the acceptance criterion itself.
import { expect, test } from 'playwright/test'
import type { Locator, Page } from 'playwright/test'
import { hideDebugPane } from './fixtures/dev-surface.ts'
import { turnToAgent } from './fixtures/harness.ts'

/** The four windows, in the taskbar order the registry must emit. */
const WINDOWS = [
  { key: 'feed', id: 'w-feed' },
  { key: 'file', id: 'w-file' },
  { key: 'rep', id: 'w-rep' },
] as const

const VIEWPORT = { width: 1280, height: 800 }

interface Rect {
  x: number
  y: number
  width: number
  height: number
}

// C15 / C17 / [u11#c12] — RE-AIMED (08-04), never deleted. This helper waited
// for all FIVE windows to be VISIBLE. `#w-tally` boots `class="win hidden"` and
// comes up only at 21:04 — u7 made it a floating sheet again and C15 rules that
// display:none-by-class before its phase is CORRECT behaviour, not a bug. So the
// wait is now: every window is ATTACHED, and every window not held by its phase
// is visible. Nothing is skipped; the desk census below still counts all five.
/** Boot the shell and wait until every window is on the desk. */
async function boot(page: Page): Promise<void> {
  await page.goto('./')
  for (const w of WINDOWS) {
    const window = page.locator(`#${w.id}`)
    await expect(window).toBeAttached()
    if (!(await window.evaluate((n) => n.classList.contains('hidden')))) await expect(window).toBeVisible()
  }
  // …and until the desk itself is handed over: `desktop-dressing.ts` holds
  // `<body class="booting">` while the entry animation runs, and a box measured
  // under that animation is the reveal's transformed box, not the layout's.
  await page.waitForFunction(() => !document.body.classList.contains('booting'), undefined, { timeout: 20_000 })
  // C14 / [u11#c12] — the DEV-only debug pane covers the bottom-left quadrant
  // (46vw × 42vh, fixed): LIVE FEED's grip and its lower body sit under it, so
  // a pointer press there hits the pane. See `fixtures/dev-surface.ts`.
  await hideDebugPane(page)
  await turnToAgent(page)
}

function win(page: Page, id: string): Locator {
  return page.locator(`#${id}`)
}

async function box(locator: Locator): Promise<Rect> {
  const b = await locator.boundingBox()
  if (!b) throw new Error('expected the element to have a layout box')
  return b
}

/** The driver's own view of the world, through the shell's test handle. */
async function frame(page: Page): Promise<{
  clock: string
  minute: number
  rate: number
  running: boolean
  ended: boolean
  events: { type: string; [k: string]: unknown }[]
}> {
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

/** Press and hold from `from`, step to `to`, release. */
async function dragFrom(page: Page, from: Rect, dx: number, dy: number): Promise<void> {
  const sx = from.x + from.width / 2
  const sy = from.y + from.height / 2
  await page.mouse.move(sx, sy)
  await page.mouse.down()
  await page.mouse.move(sx + dx / 2, sy + dy / 2, { steps: 4 })
  await page.mouse.move(sx + dx, sy + dy, { steps: 4 })
  await page.mouse.up()
}

/* ══ [u3#c1] window ops ══════════════════════════════════════════════════ */

test.describe('window ops', () => {
  test.beforeEach(async ({ page }) => {
    await boot(page)
  })

  test('window ops — the desk carries exactly the three spec §4 windows', async ({ page }) => {
    await expect(page.locator('.win')).toHaveCount(3)
    const keys = await page.locator('.win').evaluateAll((nodes) =>
      nodes.map((n) => (n as HTMLElement).dataset.win ?? ''),
    )
    expect([...keys].sort()).toEqual([...WINDOWS.map((w) => w.key)].sort())
  })

  test('window ops — every window carries the WindowFrame chrome', async ({ page }) => {
    for (const w of WINDOWS) {
      const node = win(page, w.id)
      await expect(node.locator('.win-tab')).toHaveCount(1)
      await expect(node.locator('.win-bar')).toHaveCount(1)
      await expect(node.locator('.win-bar h2')).toHaveCount(1)
      await expect(node.locator('.win-ctl .wc-min')).toHaveCount(1)
      await expect(node.locator('.win-ctl .wc-close')).toHaveCount(1)
      await expect(node.locator('.win-body')).toHaveCount(1)
      // g13-3 — two of three. The AGENT FILE is a fixed sheet and builds no
      // grip: its two pages are sized to its body, so any shrink clips the
      // page-turn control and takes page 2 off the window with it (C9). The
      // count is pinned PER WINDOW, not summed, so a grip appearing on the
      // sheet and a grip vanishing from the other two both read here.
      await expect(node.locator('.win-grip')).toHaveCount(w.id === 'w-file' ? 0 : 1)
    }
  })

  test('window ops — every window drags by its title bar', async ({ page }) => {
    for (const w of WINDOWS) {
      const node = win(page, w.id)
      const before = await box(node)
      await dragFrom(page, await box(node.locator('.win-bar')), 40, 30)
      const after = await box(node)
      expect(Math.round(after.x - before.x)).toBe(40)
      expect(Math.round(after.y - before.y)).toBe(30)
      expect(Math.round(after.width)).toBe(Math.round(before.width))
      expect(Math.round(after.height)).toBe(Math.round(before.height))
    }
  })

  test('window ops — dragging a window does not start from its controls', async ({ page }) => {
    const node = win(page, 'w-file')
    const before = await box(node)
    await dragFrom(page, await box(node.locator('.wc-min')), 60, 40)
    const after = await box(node)
    // The press landed on `—`: the window collapsed, it did not travel.
    expect(Math.round(after.x)).toBe(Math.round(before.x))
    expect(Math.round(after.y)).toBe(Math.round(before.y))
  })

  test('window ops — every window resizes by its corner grip, except the sheet', async ({ page }) => {
    for (const w of WINDOWS) {
      // g13-3 — the AGENT FILE is a fixed sheet: it builds no grip, and the
      // census above pins that per window. Skipping it here is the shape of
      // that decision, not a relaxation of this claim — `a11y.spec.ts` holds
      // the other half, that the sheet does not resize from the keyboard
      // either.
      if (w.id === 'w-file') continue
      const node = win(page, w.id)
      const before = await box(node)
      await dragFrom(page, await box(node.locator('.win-grip')), 50, 40)
      const after = await box(node)
      expect(after.width).toBeGreaterThan(before.width + 30)
      expect(after.height).toBeGreaterThan(before.height + 20)
      expect(Math.round(after.x)).toBe(Math.round(before.x))
      expect(Math.round(after.y)).toBe(Math.round(before.y))
    }
  })

  test('window ops — resizing clamps to a floor and never inverts', async ({ page }) => {
    const node = win(page, 'w-rep')
    await dragFrom(page, await box(node.locator('.win-grip')), -4000, -4000)
    const after = await box(node)
    expect(after.width).toBeGreaterThan(0)
    expect(after.height).toBeGreaterThan(0)
  })

  test('window ops — `—` collapses to the title bar and restores', async ({ page }) => {
    for (const w of WINDOWS) {
      const node = win(page, w.id)
      const open = await box(node)
      await node.locator('.wc-min').click()
      await expect(node).toHaveClass(/\bcollapsed\b/)
      await expect(node.locator('.win-body')).toBeHidden()
      const collapsed = await box(node)
      expect(collapsed.height).toBeLessThan(open.height)
      await expect(node.locator('.win-bar')).toBeVisible()

      await node.locator('.wc-min').click()
      await expect(node).not.toHaveClass(/\bcollapsed\b/)
      await expect(node.locator('.win-body')).toBeVisible()
    }
  })

  test('window ops — `×` closes the window to the taskbar', async ({ page }) => {
    for (const w of WINDOWS) {
      const node = win(page, w.id)
      const task = page.locator(`.task[data-win="${w.key}"]`)
      await expect(task).toHaveClass(/\bopen\b/)

      await node.locator('.wc-close').click()
      await expect(node).toBeHidden()
      await expect(task).toHaveCount(1)
      await expect(task).not.toHaveClass(/\bopen\b/)
    }
    // Closed to the taskbar, not destroyed.
    await expect(page.locator('.win')).toHaveCount(3)
    await expect(page.locator('.task')).toHaveCount(3)
  })

  test('window ops — the taskbar reopens a closed window', async ({ page }) => {
    const node = win(page, 'w-feed')
    const task = page.locator('.task[data-win="feed"]')
    await node.locator('.wc-close').click()
    await expect(node).toBeHidden()

    await task.click()
    await expect(node).toBeVisible()
    await expect(node).toHaveClass(/\bfocused\b/)
    await expect(task).toHaveClass(/\bopen\b/)
    await expect(task).toHaveClass(/\bfocused\b/)
  })

  test('window ops — the taskbar raises an unfocused window before hiding it', async ({ page }) => {
    const store = win(page, 'w-feed')
    const task = page.locator('.task[data-win="feed"]')

    // Focus something else, so LIVE FEED is open but not focused.
    await win(page, 'w-file').locator('.win-bar').click()
    await expect(store).not.toHaveClass(/\bfocused\b/)

    // First click raises …
    await task.click()
    await expect(store).toBeVisible()
    await expect(store).toHaveClass(/\bfocused\b/)

    // … the second, on the already-focused window, hides it.
    await task.click()
    await expect(store).toBeHidden()
    await expect(task).not.toHaveClass(/\bopen\b/)
  })

  test('window ops — reopening a collapsed window restores it expanded', async ({ page }) => {
    const node = win(page, 'w-rep')
    await node.locator('.wc-min').click()
    await expect(node).toHaveClass(/\bcollapsed\b/)
    await node.locator('.wc-close').click()
    await expect(node).toBeHidden()

    await page.locator('.task[data-win="rep"]').click()
    await expect(node).toBeVisible()
    await expect(node).not.toHaveClass(/\bcollapsed\b/)
  })

  test('window ops — a dragged window survives a collapse/expand round trip', async ({ page }) => {
    const node = win(page, 'w-feed')
    await dragFrom(page, await box(node.locator('.win-bar')), 60, 20)
    const moved = await box(node)
    await node.locator('.wc-min').click()
    await node.locator('.wc-min').click()
    const after = await box(node)
    expect(Math.round(after.x)).toBe(Math.round(moved.x))
    expect(Math.round(after.y)).toBe(Math.round(moved.y))
  })

  // C17 / [u11#c12] — RE-AIMED (08-04), never deleted. "The bodies are empty in
  // THIS UNIT" was true of u3 and is false of the finished desk on purpose:
  // u4–u7 were commissioned to fill exactly these five bodies. The u3-scoped
  // claim is measured where it stays permanently true — at u3's own merge, by
  // `tests/shell/shell-source.test.ts` — and what this browser check can still
  // prove is the other half of the same contract: the shell built a body for
  // every window and each one is now mounted by its owning unit, none a stub.
  test('window ops — [u3#c10] window bodies are empty in this unit', async ({ page }) => {
    for (const w of WINDOWS) {
      const body = win(page, w.id).locator('.win-body')
      await expect(body, `${w.id} has no body`).toHaveCount(1)
      const children = await body.evaluate((n) => n.childElementCount)
      expect(children, `${w.id} body was never mounted by its owning unit`).toBeGreaterThan(0)
    }
  })
})

/* ══ [u3#c2] applyLayout ═════════════════════════════════════════════════ */

test.describe('default layout fits 1280x800', () => {
  test('default layout fits 1280x800 — no window falls outside the viewport', async ({ page }) => {
    await boot(page)
    expect(page.viewportSize()).toEqual(VIEWPORT)
    for (const w of WINDOWS) {
      const b = await box(win(page, w.id))
      expect(b.x, `${w.id}.left`).toBeGreaterThanOrEqual(0)
      expect(b.y, `${w.id}.top`).toBeGreaterThanOrEqual(0)
      expect(b.x + b.width, `${w.id}.right`).toBeLessThanOrEqual(VIEWPORT.width)
      expect(b.y + b.height, `${w.id}.bottom`).toBeLessThanOrEqual(VIEWPORT.height)
      expect(b.width).toBeGreaterThan(0)
      expect(b.height).toBeGreaterThan(0)
    }
  })

  test('default layout fits 1280x800 — no window sits under the topbar', async ({ page }) => {
    await boot(page)
    const bar = await box(page.locator('#topbar'))
    for (const w of WINDOWS) {
      const b = await box(win(page, w.id))
      expect(b.y, `${w.id} overlaps the chrome`).toBeGreaterThanOrEqual(bar.y + bar.height - 1)
    }
  })

  test('default layout fits 1280x800 — nothing is hard-positioned in the markup', async ({ page }) => {
    await boot(page)
    const inline = await page.locator('.win').evaluateAll((nodes) =>
      nodes.map((n) => (n as HTMLElement).getAttribute('style') ?? ''),
    )
    // The geometry is written at runtime as custom properties by applyLayout;
    // no literal top/left/width/height may be pinned in the markup.
    for (const style of inline) {
      expect(style).not.toMatch(/(^|;)\s*(top|left|width|height)\s*:/)
    }
    const html = await page.evaluate(() => document.documentElement.outerHTML)
    expect(html).toBeTruthy()
  })

  test('default layout fits 1280x800 — the arrangement is computed from the viewport', async ({ page }) => {
    await boot(page)
    const at1280 = []
    for (const w of WINDOWS) at1280.push(await box(win(page, w.id)))

    await page.setViewportSize({ width: 1600, height: 900 })
    await page.evaluate(() => window.dispatchEvent(new Event('resize')))
    await page.waitForTimeout(150)

    const at1600 = []
    for (const w of WINDOWS) at1600.push(await box(win(page, w.id)))

    // A viewport-derived layout must react; a hard-coded one cannot.
    expect(at1600).not.toEqual(at1280)
    for (let i = 0; i < WINDOWS.length; i += 1) {
      const b = at1600[i]!
      expect(b.x, `${WINDOWS[i]!.id}.left @1600`).toBeGreaterThanOrEqual(0)
      expect(b.x + b.width, `${WINDOWS[i]!.id}.right @1600`).toBeLessThanOrEqual(1600)
      expect(b.y + b.height, `${WINDOWS[i]!.id}.bottom @1600`).toBeLessThanOrEqual(900)
    }
  })

  test('default layout fits 1280x800 — the four windows do not stack on one spot', async ({ page }) => {
    await boot(page)
    const origins = new Set<string>()
    for (const w of WINDOWS) {
      const b = await box(win(page, w.id))
      origins.add(`${Math.round(b.x)}:${Math.round(b.y)}`)
    }
    // Four distinct desk columns is the floor the reference arrangement produces.
    expect(origins.size).toBeGreaterThanOrEqual(3)
  })
})

/* ══ [u3#c3] topbar ══════════════════════════════════════════════════════ */

test.describe('topbar', () => {
  test.beforeEach(async ({ page }) => {
    await boot(page)
  })

  test('topbar — portal identity names the portal, the operator and the case', async ({ page }) => {
    const bar = page.locator('#topbar')
    await expect(bar).toBeVisible()
    for (const id of ['#portalName', '#portalCode', '#opName', '#caseName']) {
      await expect(bar.locator(id)).not.toBeEmpty()
    }
    // The case comes from the frozen scenario pack, not from a fixture.
    await expect(bar.locator('#caseName')).toContainText('우는다리')
  })

  test('topbar — the clock reads HH:MM and runs toward the 21:04 terminal', async ({ page }) => {
    await expect(page.locator('#clockDigits')).toHaveText(/^\d{2}:\d{2}$/)
    await expect(page.locator('#clockUnit .clk-term')).toContainText('21:04')
  })

  test('topbar — the clock time is driver-fed, never view-computed', async ({ page }) => {
    for (let i = 0; i < 3; i += 1) {
      const f = await frame(page)
      const shown = (await page.locator('#clockDigits').textContent())?.trim()
      expect(shown).toBe(f.clock)
      await page.waitForTimeout(200)
    }
  })

  // RE-AIMED (08-08, W4), never deleted. These two asserted the transport row:
  // that ×1 / ×4 / pause existed, marked exactly one of themselves, and drove
  // the DRIVER's clock rather than a view-local one. W4 removed the row — a day
  // is not a recording the operator scrubs — so what they measure now is the
  // claim that replaced it: the desk is held until a file is committed, and
  // DEPLOY is what sets it running. The "drives the driver's clock, not a
  // view-local one" half survives intact; only the control changed.
  test('topbar — the desk is held until a file is committed, and DEPLOY starts it', async ({ page }) => {
    // Held: the clock does not advance on its own, however long we watch.
    expect((await frame(page)).rate, 'the desk booted already running').toBe(0)
    const held = (await frame(page)).minute
    await page.waitForTimeout(700)
    expect((await frame(page)).minute, 'the clock advanced with no file committed').toBe(held)

    await page.locator('#w-file #btnDeploy').click()

    await expect.poll(async () => (await frame(page)).rate, { timeout: 2000 }).toBe(1)
    await expect.poll(async () => (await frame(page)).minute, { timeout: 8000 }).toBeGreaterThan(held)
  })

  test('topbar — the desk offers no transport control at all', async ({ page }) => {
    // The membrane's own logic: a day runs because a file was committed to it,
    // so there is nothing here to scrub with. `.clk-rate` survives as the slot
    // the audio toggle mounts into, and that toggle is not a rate.
    await expect(page.locator('.rate-btn')).toHaveCount(0)
    await expect(page.locator('.clk-rate [data-rate]')).toHaveCount(0)
    await expect(page.locator('.clk-rate .snd-btn')).toHaveCount(1)
  })

  test('topbar — the progress fill tracks the clock and never leaves the bar', async ({ page }) => {
    const barBox = await box(page.locator('.clk-bar'))
    const fill = page.locator('#clockFill')
    const ratio = async (): Promise<number> => (await box(fill)).width / barBox.width

    const r0 = await ratio()
    expect(r0).toBeGreaterThanOrEqual(0)
    expect(r0).toBeLessThanOrEqual(1)

    // RE-AIMED (08-08, W4): the fill needs the clock MOVING, and the only thing
    // that starts it now is a committed file. ×4 is gone, so the wait widens to
    // match ×1 rather than the transport's fast-forward.
    await page.locator('#w-file #btnDeploy').click()
    const m0 = (await frame(page)).minute
    await expect
      .poll(async () => {
        const f = await frame(page)
        return f.minute - m0 >= 20 || f.ended
      }, { timeout: 40000 })
      .toBe(true)

    const r1 = await ratio()
    expect(r1).toBeGreaterThanOrEqual(r0)
    expect(r1).toBeLessThanOrEqual(1)
  })

  test('topbar — the D-DAY unit shows the run, the remainder and one pip per run', async ({ page }) => {
    await expect(page.locator('#runNum')).toHaveText(/^RUN \d{2}$/)
    await expect(page.locator('#ddayNum')).toHaveText(/^[−-]\d{2}$/)

    const pips = page.locator('#ddayPips i')
    const total = await pips.count()
    expect(total).toBeGreaterThan(0)

    const run = Number(((await page.locator('#runNum').textContent()) ?? '').replace(/\D/g, ''))
    const remaining = Number(((await page.locator('#ddayNum').textContent()) ?? '').replace(/\D/g, ''))
    // run + remaining = the whole allotment, and the pips render exactly that.
    expect(total).toBe(run + remaining)
    await expect(page.locator('#ddayPips i.now')).toHaveCount(1)
    await expect(page.locator('#ddayPips i.spent')).toHaveCount(run - 1)
  })

  test('topbar — the run counter is fed by the driver `meta` event', async ({ page }) => {
    await drain(page)
    const events = (await frame(page)).events
    const meta = [...events].reverse().find((e) => e.type === 'meta') as
      | { run: number; runs_left: number }
      | undefined
    expect(meta, 'the fixture stream must carry a `meta` event').toBeTruthy()

    await expect
      .poll(async () => ((await page.locator('#runNum').textContent()) ?? '').trim(), { timeout: 3000 })
      .toBe(`RUN ${String(meta!.run).padStart(2, '0')}`)
    await expect(page.locator('#ddayPips i')).toHaveCount(meta!.run + meta!.runs_left)
  })

  test('topbar — the taskbar carries one toggle per window in registry order', async ({ page }) => {
    const taskbar = page.locator('#taskbar')
    await expect(taskbar).toBeVisible()
    const keys = await taskbar.locator('.task').evaluateAll((nodes) =>
      nodes.map((n) => (n as HTMLElement).dataset.win ?? ''),
    )
    expect(keys).toEqual(WINDOWS.map((w) => w.key))
  })

  test('topbar — desktop dressing and the u8 overlay hosts are present', async ({ page }) => {
    for (const id of ['#wallpaper', '#threads', '#grain', '#vignette', '#sweep', '#toast']) {
      await expect(page.locator(id)).toHaveCount(1)
    }
    // Dressing is decoration: it must not be announced.
    for (const id of ['#wallpaper', '#threads', '#grain', '#vignette', '#sweep']) {
      await expect(page.locator(id)).toHaveAttribute('aria-hidden', 'true')
    }
    await expect(page.locator('#toast')).toHaveAttribute('role', 'status')
  })
})

/* ══ [u3#c4] single stacking context ═════════════════════════════════════ */

test.describe('single stacking context', () => {
  test.beforeEach(async ({ page }) => {
    await boot(page)
  })

  test('single stacking context — #desktop is display:contents', async ({ page }) => {
    const display = await page
      .locator('#desktop')
      .evaluate((n) => getComputedStyle(n).display)
    expect(display).toBe('contents')
  })

  test('single stacking context — no ancestor of a window creates one', async ({ page }) => {
    const offenders = await page.locator('.win').evaluateAll((nodes) => {
      const bad: string[] = []
      const creates = (el: Element): string[] => {
        const s = getComputedStyle(el)
        const hits: string[] = []
        if (s.zIndex !== 'auto') hits.push(`z-index:${s.zIndex}`)
        if (s.position === 'fixed' || s.position === 'sticky') hits.push(`position:${s.position}`)
        if (s.opacity !== '1') hits.push(`opacity:${s.opacity}`)
        if (s.transform !== 'none') hits.push(`transform:${s.transform}`)
        if (s.filter !== 'none') hits.push(`filter:${s.filter}`)
        if (s.mixBlendMode !== 'normal') hits.push(`mix-blend-mode:${s.mixBlendMode}`)
        if (s.isolation === 'isolate') hits.push('isolation:isolate')
        if (s.willChange !== 'auto') hits.push(`will-change:${s.willChange}`)
        if (/(paint|layout|strict|content)/.test(s.contain)) hits.push(`contain:${s.contain}`)
        return hits
      }
      for (const node of nodes) {
        let p = node.parentElement
        while (p && p !== document.documentElement) {
          for (const hit of creates(p)) bad.push(`${node.id} < ${p.tagName}#${p.id || '?'}: ${hit}`)
          p = p.parentElement
        }
      }
      return bad
    })
    expect(offenders).toEqual([])
  })

  test('single stacking context — raising REPORTS puts it above AGENT FILE', async ({ page }) => {
    const rep = win(page, 'w-rep')
    const file = win(page, 'w-file')

    // Park AGENT FILE on top of REPORTS so the two genuinely overlap.
    //
    // RE-AIMED (08-08, T3). This used to drag REPORTS onto AGENT FILE. Under the
    // two-column desk REPORTS is the full-height left column (640x692 at
    // 1280x800) and AGENT FILE is the shorter box bottom-right, so dragging the
    // tall window down to the short one's origin puts its bottom ~326px past the
    // viewport; the manager clamps, the overlap never forms, and the probe reads
    // whatever is actually under it. Moving the SMALL window over the LARGE one
    // is the same claim with a geometry that exists.
    const repBox = await box(rep)
    const fileBar = await box(file.locator('.win-bar'))
    const fileBox = await box(file)
    // Overlap REPORTS' right edge rather than covering it: the file's own title
    // bar has to stay reachable AFTER REPORTS is raised over it, or the second
    // click below has nothing to hit.
    await dragFrom(
      page,
      fileBar,
      repBox.x + repBox.width - 120 - fileBox.x,
      repBox.y + 40 - fileBox.y,
    )

    const probe = { x: repBox.x + repBox.width - 60, y: repBox.y + 90 }
    const topAt = async (): Promise<string> =>
      page.evaluate(
        (p) => document.elementFromPoint(p.x, p.y)?.closest('.win')?.id ?? 'none',
        probe,
      )

    await rep.locator('.win-bar').click({ position: { x: 20, y: 8 } })
    expect(await topAt()).toBe('w-rep')

    // …at a point PAST REPORTS' right edge, which REPORTS cannot be covering.
    await file.locator('.win-bar').click({ position: { x: 200, y: 8 } })
    expect(await topAt()).toBe('w-file')

    await rep.locator('.win-bar').click({ position: { x: 20, y: 8 } })
    expect(await topAt()).toBe('w-rep')
  })

  test('single stacking context — focus raises the --z of exactly one window', async ({ page }) => {
    const zOf = async (id: string): Promise<number> =>
      page.evaluate(
        (i) => Number(getComputedStyle(document.getElementById(i)!).getPropertyValue('--z')),
        id,
      )

    const raised = 'w-rep'
    await win(page, raised).locator('.win-bar').click({ position: { x: 20, y: 8 } })
    const raisedZ = await zOf(raised)
    for (const w of WINDOWS.filter((x) => x.id !== raised)) {
      expect(await zOf(w.id)).toBeLessThan(raisedZ)
    }
    await expect(page.locator('.win.focused')).toHaveCount(1)
  })

  test('single stacking context — a pointer press anywhere in a window raises it', async ({ page }) => {
    const feed = win(page, 'w-feed')
    await win(page, 'w-file').locator('.win-bar').click({ position: { x: 20, y: 8 } })
    await expect(feed).not.toHaveClass(/\bfocused\b/)

    const b = await box(feed)
    await page.mouse.click(b.x + b.width / 2, b.y + b.height - 20)
    await expect(feed).toHaveClass(/\bfocused\b/)
  })
})

/* ══ [u3#c5] a11y ════════════════════════════════════════════════════════ */

test.describe('a11y', () => {
  test.beforeEach(async ({ page }) => {
    await boot(page)
  })

  test('a11y — the chrome and the desk carry landmark roles', async ({ page }) => {
    await expect(page.getByRole('banner')).toHaveCount(1)
    await expect(page.getByRole('main')).toHaveCount(1)
    const nav = page.getByRole('navigation')
    await expect(nav).toHaveCount(1)
    await expect(nav).toHaveAttribute('aria-label', /.+/)
  })

  test('a11y — each window is a named region', async ({ page }) => {
    const regions = page.getByRole('region', { includeHidden: true })
    await expect(regions).toHaveCount(3)
    const names = await page.locator('.win').evaluateAll((nodes) =>
      nodes.map((n) => n.getAttribute('aria-label') ?? n.getAttribute('aria-labelledby') ?? ''),
    )
    expect(names.filter((n) => n.trim() === '')).toEqual([])
  })

  test('a11y — every window control is a real button and keyboard reachable', async ({ page }) => {
    // RE-AIMED (08-08, W4): the three rate buttons left the topbar with the
    // transport, so the census is three windows' controls plus three task
    // buttons. The claim — every one of them is a real button and reachable —
    // is unchanged.
    const controls = page.locator('.wc, .task')
    const count = await controls.count()
    expect(count).toBe(3 * 2 + 3)
    const meta = await controls.evaluateAll((nodes) =>
      nodes.map((n) => ({
        tag: n.tagName.toLowerCase(),
        type: n.getAttribute('type'),
        tabindex: n.getAttribute('tabindex'),
        name: (n.getAttribute('aria-label') ?? n.getAttribute('title') ?? n.textContent ?? '').trim(),
        disabled: (n as HTMLButtonElement).disabled === true,
      })),
    )
    for (const m of meta) {
      expect(m.tag).toBe('button')
      expect(m.type).toBe('button')
      expect(m.tabindex === null || Number(m.tabindex) >= 0).toBe(true)
      expect(m.name.length, 'every control needs an accessible name').toBeGreaterThan(0)
    }
  })

  test('a11y — the title bar move handle is focusable and moves with the arrow keys', async ({ page }) => {
    const node = win(page, 'w-feed')
    const bar = node.locator('.win-bar')
    await expect(bar).toHaveAttribute('tabindex', '0')

    const before = await box(node)
    await bar.focus()
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ArrowDown')
    const after = await box(node)
    expect(after.x).toBeGreaterThan(before.x)
    expect(after.y).toBeGreaterThan(before.y)
  })

  test('a11y — the collapse and close controls work from the keyboard', async ({ page }) => {
    const node = win(page, 'w-rep')
    await node.locator('.wc-min').focus()
    await page.keyboard.press('Enter')
    await expect(node).toHaveClass(/\bcollapsed\b/)

    await node.locator('.wc-close').focus()
    await page.keyboard.press('Enter')
    await expect(node).toBeHidden()

    await page.locator('.task[data-win="rep"]').focus()
    await page.keyboard.press('Enter')
    await expect(node).toBeVisible()
  })

  test('a11y — focused controls paint a visible focus ring', async ({ page }) => {
    // Establish keyboard modality so :focus-visible applies.
    await page.keyboard.press('Tab')
    const ringed = await page.evaluate(() => {
      const snap = (el: Element): string => {
        const s = getComputedStyle(el)
        return `${s.outlineStyle}|${s.outlineWidth}|${s.outlineColor}|${s.boxShadow}`
      }
      const out: { sel: string; changed: boolean }[] = []
      const heldByPhase: string[] = []
      // `.snd-btn` stands where `.rate-btn` did (W4 retired the transport) — the
      // row still has a control in it, so the sweep still visits one.
      const targets = [...document.querySelectorAll<HTMLElement>('.snd-btn, .task, .wc, .win-bar')]
      for (const el of targets) {
        // C15 / C17 / [u11#c12] — RE-AIMED (08-04): a control with no layout box
        // cannot take focus, so `el.focus()` is a no-op and the snapshot could
        // only ever be unchanged. The three that reported here were #w-tally's
        // bar and its two controls — the sheet boots `class="win hidden"` and
        // comes up at 21:04, which C15 rules CORRECT. Nothing is skipped: the
        // held ones are reported and pinned to that window below.
        if (el.getClientRects().length === 0) {
          heldByPhase.push(`${el.closest('.win')?.id ?? '(no window)'} ${el.className}`)
          continue
        }
        const before = snap(el)
        el.focus()
        const after = snap(el)
        el.blur()
        out.push({
          sel: `${el.className}`,
          changed: after !== before && !/^none\|0px/.test(after),
        })
      }
      return { out, heldByPhase }
    })
    expect(ringed.out.length).toBeGreaterThan(0)
    expect(ringed.out.filter((r) => !r.changed)).toEqual([])
    // U3 — no window is phase-held any more (TALLY is gone).
    expect(ringed.heldByPhase).toEqual([])
  })

  test('a11y — tab order follows the visual order of the chrome', async ({ page }) => {
    const order = await page.evaluate(() => {
      const tabbable = [
        ...document.querySelectorAll<HTMLElement>('#topbar button, #topbar [tabindex="0"]'),
      ]
      return tabbable.map((el) => {
        const r = el.getBoundingClientRect()
        return { top: Math.round(r.top), left: Math.round(r.left) }
      })
    })
    expect(order.length).toBeGreaterThan(0)
    for (let i = 1; i < order.length; i += 1) {
      const prev = order[i - 1]!
      const cur = order[i]!
      const sameRow = Math.abs(cur.top - prev.top) < 8
      const forwards = sameRow ? cur.left >= prev.left : cur.top > prev.top
      expect(forwards, `chrome tab stop ${i} goes backwards`).toBe(true)
    }
  })

  test('a11y — a closed window is removed from the tab order', async ({ page }) => {
    const node = win(page, 'w-feed')
    await node.locator('.wc-close').click()
    await expect(node).toBeHidden()
    const reachable = await node.evaluate((n) => {
      const s = getComputedStyle(n)
      return s.display !== 'none' && s.visibility !== 'hidden'
    })
    expect(reachable).toBe(false)
  })

  test('a11y — the shell introduces no free-text surface', async ({ page }) => {
    await expect(page.locator('input, textarea, select, [contenteditable]')).toHaveCount(0)
  })
})

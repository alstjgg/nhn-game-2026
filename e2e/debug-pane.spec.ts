// u9d — the debug pane, flag-on. Covers [u9d#c1] (raw tables of the current
// ViewEvent / MembraneOp stream, spec-client §6 `DebugPane` + §2.1) and the DOM
// half of [u9d#c4] (invariant 1 — no free-text surface, even flag-on).
//
// Test titles are load-bearing: the unit's verification command filters with
// `-g 'flag-on shows raw stream'`. Do not rename a test without updating
// `.claude/super/units/u9d.md`.
//
// The e2e harness runs the DEV server (playwright.config.ts), so the build flag
// is ON here. The flag-OFF half — that none of this code reaches the player
// bundle (invariant 11) — is `tests/debug/flag-off-bundle.test.ts`, because only
// a real `vite build` can prove exclusion.
//
// Contract this suite pins (see `.claude/super/units/u9d/tests.md`):
//   • root `#debug-pane`, carrying `data-pane="nhn:debug-pane"`, mounted as a
//     direct child of <body> — never inside the desk
//   • two tables: `[data-debug-table="events"]` (seq · clock · type · payload)
//     and `[data-debug-table="ops"]` (seq · op · payload)
//   • rows `tr[data-debug-row]`, cells `[data-debug-cell="<column>"]`; the
//     payload cell is raw `JSON.stringify` of the rest of the record
//   • an empty table renders one `[data-debug-empty]` row
//   • `window.__debug` — dev-only handle: `{ noteOp(op): void; refresh(): void }`.
//     `noteOp` is OBSERVATION ONLY: it records into the pane and never reaches
//     the driver (invariant 12).
//
// C3 (placeholder fixtures): nothing here asserts synthetic fixture CONTENT.
// The event count and types come from the driver frame at runtime, never from a
// literal in this file.
import { expect, test } from 'playwright/test'
import type { Page } from 'playwright/test'

const PANE = '#debug-pane'
const MARKER = 'nhn:debug-pane'
const EVENTS = '[data-debug-table="events"]'
const OPS = '[data-debug-table="ops"]'

const WINDOW_IDS = ['w-feed', 'w-file', 'w-store', 'w-rep', 'w-tally'] as const

interface ShellHandleLike {
  frame(): { events: { type: string }[]; store: { mined: string[]; slots: Record<number, string>; deployed: string[] } }
  drain(): void
}

interface DebugHandleLike {
  noteOp(op: unknown): void
  refresh(): void
}

declare global {
  interface Window {
    __shell?: ShellHandleLike
    __debug?: DebugHandleLike
  }
}

/** Boot the desk and wait until the flag-on pane is on screen. */
async function boot(page: Page): Promise<void> {
  await page.goto('./')
  await expect(page.locator('#w-feed')).toBeVisible()
  await expect(page.locator(PANE)).toBeVisible()
  await page.waitForFunction(() => Boolean(window.__debug) && Boolean(window.__shell))
}

/** The driver's own view of the world, straight off the shell handle. */
async function driverEventTypes(page: Page): Promise<string[]> {
  return page.evaluate(() => (window.__shell?.frame().events ?? []).map((e) => e.type))
}

/** One column of one table, top to bottom. */
async function column(page: Page, table: string, cell: string): Promise<string[]> {
  return page
    .locator(`${table} tr[data-debug-row] [data-debug-cell="${cell}"]`)
    .allTextContents()
    .then((xs) => xs.map((x) => x.trim()))
}

test.describe('debug pane', () => {
  test('flag-on shows raw stream — the pane mounts with both raw tables', async ({ page }) => {
    await boot(page)

    await expect(page.locator(PANE)).toHaveAttribute('data-pane', MARKER)
    await expect(page.locator(`body > ${PANE}`), 'the pane must not live inside the desk').toBeAttached()

    await expect(page.locator(`${PANE} ${EVENTS}`)).toBeVisible()
    await expect(page.locator(`${PANE} ${OPS}`)).toBeVisible()

    const eventHeads = await page.locator(`${EVENTS} thead th`).allTextContents()
    expect(eventHeads.map((h) => h.trim().toLowerCase())).toEqual(['seq', 'clock', 'type', 'payload'])

    const opHeads = await page.locator(`${OPS} thead th`).allTextContents()
    expect(opHeads.map((h) => h.trim().toLowerCase())).toEqual(['seq', 'op', 'payload'])
  })

  test('flag-on shows raw stream — the ViewEvent table mirrors the driver frame', async ({ page }) => {
    await boot(page)

    const types = await driverEventTypes(page)
    expect(types.length, 'the driver released no event to mirror').toBeGreaterThan(0)

    const rows = page.locator(`${EVENTS} tr[data-debug-row]`)
    await expect(rows).toHaveCount(types.length)
    expect(await column(page, EVENTS, 'type')).toEqual(types)
    expect(await column(page, EVENTS, 'seq')).toEqual(types.map((_, i) => String(i + 1)))

    // The clock column is the seam's own stamp, rendered raw.
    for (const clock of await column(page, EVENTS, 'clock')) expect(clock).toMatch(/^(\d{2}:\d{2}|—|-)$/)

    // The payload cell is RAW: parseable JSON that carries the event's own
    // fields (no prose, no formatting).
    const payloads = await column(page, EVENTS, 'payload')
    expect(payloads).toHaveLength(types.length)
    for (const [i, raw] of payloads.entries()) {
      const parsed: unknown = JSON.parse(raw)
      expect(parsed, `row ${i} payload is not an object`).toBeInstanceOf(Object)
      expect(Object.keys(parsed as Record<string, unknown>).length).toBeGreaterThan(0)
    }

    // Draining the rest of the stream keeps the table in step with the driver.
    await page.evaluate(() => {
      window.__shell?.drain()
      window.__debug?.refresh()
    })
    const after = await driverEventTypes(page)
    await expect(rows).toHaveCount(after.length)
    expect(await column(page, EVENTS, 'type')).toEqual(after)
  })

  test('flag-on shows raw stream — the MembraneOp table records ops', async ({ page }) => {
    await boot(page)

    // Nothing has been sent yet: an explicit empty row, not a blank table.
    await expect(page.locator(`${OPS} [data-debug-empty]`)).toBeVisible()
    await expect(page.locator(`${OPS} tr[data-debug-row]`)).toHaveCount(0)

    // spec-client §7 item 5 — the deploy op's canonical ids are observable here.
    await page.evaluate(() => {
      window.__debug?.noteOp({ op: 'deploy', blocks: ['b-r1-f01', 'b-r1-f02'] })
      window.__debug?.noteOp({ op: 'mine', sentence_id: 'b-r1-f03' })
    })

    const opRows = page.locator(`${OPS} tr[data-debug-row]`)
    await expect(opRows).toHaveCount(2)
    await expect(page.locator(`${OPS} [data-debug-empty]`)).toHaveCount(0)

    expect(await column(page, OPS, 'op')).toEqual(['deploy', 'mine'])
    expect(await column(page, OPS, 'seq')).toEqual(['1', '2'])

    const payloads = await column(page, OPS, 'payload')
    const deploy = JSON.parse(payloads[0]!) as { blocks?: string[] }
    expect(deploy.blocks).toEqual(['b-r1-f01', 'b-r1-f02'])
    const mine = JSON.parse(payloads[1]!) as { sentence_id?: string }
    expect(mine.sentence_id).toBe('b-r1-f03')

    // Invariant 12 — the pane OBSERVES. Recording an op must not reach the
    // driver or move the meta-state.
    const store = await page.evaluate(() => window.__shell?.frame().store)
    expect(store?.mined).toEqual([])
    expect(store?.deployed).toEqual([])
    expect(Object.keys(store?.slots ?? {})).toEqual([])
  })

  test('flag-on shows raw stream — no free-text surface, and the desk is untouched', async ({ page }) => {
    await boot(page)

    // [u9d#c4] invariant 1 — even flag-on, the pane opens no writable surface.
    await expect(page.locator(`${PANE} input, ${PANE} textarea, ${PANE} select, ${PANE} form`)).toHaveCount(0)
    await expect(page.locator(`${PANE} [contenteditable]`)).toHaveCount(0)
    await expect(page.locator('input, textarea, select')).toHaveCount(0)

    // The desk keeps all five windows; the pane is additive, not a replacement.
    //
    // C15 / C17 / [u11#c12] — RE-AIMED (08-04), never deleted: all five are
    // still checked. `#w-tally` boots `class="win hidden"` and comes up at
    // 21:04 (u7), which C15 rules CORRECT behaviour rather than a bug, so the
    // tally is asserted to be ON THE DESK — attached, and held only by its own
    // phase class — instead of being asserted visible before its phase.
    for (const id of WINDOW_IDS) {
      const node = page.locator(`#${id}`)
      await expect(node).toBeAttached()
      if (await node.evaluate((n) => n.classList.contains('hidden'))) {
        expect(id, 'a window is hidden and it is not the phase-held tally').toBe('w-tally')
      } else {
        await expect(node).toBeVisible()
      }
    }
  })
})

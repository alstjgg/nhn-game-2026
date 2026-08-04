// u11 — the acceptance harness: boot, drive, settle/freeze, and watch the wire.
//
// Everything §7 needs to WALK the day lives here, so `acceptance.spec.ts` reads
// as the twelve sentences of the spec and nothing else (design D6/SRP). No unit
// spec's helpers are imported — u11 proves the run-through, not another unit's
// mechanism (design D3).
//
// The dev-only handles this harness drives, all pre-existing:
//   • `window.__shell`     u3 — `{ frame(), drain() }`, the driver undecorated.
//   • `window.__feed`      u5 — `{ count(), kinds(), stamps(), seek(at), rate(r) }`.
//   • `window.__tally`     u7 — `{ state(), rows(), phase(), meta() }`.
//   • `window.__agentFile` u4 — `{ slots(), place(), clear(), deployed(), … }`.
//   • `window.__threads`   u8 — `{ redraw(), count(), destroy() }`.
//   • `window.__debug`     u9d — `{ noteOp(op), refresh() }` (flag-on only).
import { expect } from 'playwright/test'
import type { Page, Request } from 'playwright/test'

/* ── the seam shapes this suite reads back (C3: never fixture CONTENT) ───── */

export interface Sentence {
  id: string
  text: string
  species: string
  axis?: string
}

export interface StreamEvent {
  type: string
  [k: string]: unknown
}

export interface Frame {
  events: StreamEvent[]
  store: { mined: string[]; slots: Record<number, string>; deployed: string[] }
  ended?: boolean
}

export interface MetaEvent {
  type: 'meta'
  run: number
  runs_left: number
  carried: string[]
  archive: { run: number; label: string }[]
}

/* ── boot ────────────────────────────────────────────────────────────────── */

/**
 * Goes to the desk and waits until the shell has mounted and exposed itself.
 *
 * `reduced` asks for `prefers-reduced-motion`, which the desk honours by
 * settling its replays instantly (u6's own suite boots the same way). Without
 * it a sentence never reaches Playwright's "stable" state — the paper breathes
 * — and an honest click on it can never land.
 */
export async function boot(page: Page, opts: { reduced?: boolean } = {}): Promise<void> {
  if (opts.reduced) await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('./')
  await page.waitForFunction(() => Boolean((window as { __shell?: unknown }).__shell))
  await expect(page.locator('.win')).toHaveCount(5)
  await settled(page)
}

/**
 * Waits for the boot sweep to hand the desk over.
 *
 * The desk's own signal, not a sleep: `components/desktop-dressing.ts` holds
 * `<body class="booting">` until every window's ENTRY animation has finished
 * and its box is final, then drops the class. Measuring geometry before that
 * measures the entry animation — the windows are still under a `scale(.985)`
 * that puts their transformed bottom edge ~3 px past the desk (measured 08-04),
 * which is the reveal, not the layout.
 */
export async function settled(page: Page): Promise<void> {
  await page.waitForFunction(() => !document.body.classList.contains('booting'), undefined, { timeout: 20_000 })
}

/** The two rAFs the capture protocol calls "first paint" (C14). */
export async function firstPaint(page: Page): Promise<void> {
  await page.evaluate(
    () => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r()))),
  )
}

/* ── driver handles ──────────────────────────────────────────────────────── */

export async function frame(page: Page): Promise<Frame> {
  return page.evaluate(() => {
    const handle = (window as unknown as { __shell?: { frame(): unknown } }).__shell
    if (!handle) throw new Error('window.__shell is not exposed by the shell boot')
    return handle.frame() as never
  })
}

export async function drain(page: Page): Promise<void> {
  await page.evaluate(() => {
    const handle = (window as unknown as { __shell?: { drain(): void } }).__shell
    if (!handle) throw new Error('window.__shell is not exposed by the shell boot')
    handle.drain()
  })
}

/** Jumps the sim clock to `at` and releases everything due by then (u5's seek). */
export async function seek(page: Page, at: string): Promise<void> {
  await page.evaluate((stamp) => {
    const handle = (window as unknown as { __feed?: { seek(at: string): void } }).__feed
    if (!handle) throw new Error('window.__feed is not exposed by the LIVE FEED window')
    handle.seek(stamp)
  }, at)
}

export async function rate(page: Page, to: number): Promise<void> {
  await page.evaluate((r) => {
    const handle = (window as unknown as { __feed?: { rate(to: number): void } }).__feed
    if (!handle) throw new Error('window.__feed is not exposed by the LIVE FEED window')
    handle.rate(r)
  }, to)
}

export async function tallyPhase(page: Page): Promise<string> {
  return page.evaluate(() => {
    const handle = (window as unknown as { __tally?: { phase(): string } }).__tally
    if (!handle) throw new Error('window.__tally is not exposed by the TALLY window')
    return handle.phase()
  })
}

/**
 * The LEDGER's own state — `pending | counting | final`.
 *
 * Distinct from `phase()`, which answers the RUN's phase
 * (`build | run | report | tally`, `shell/run-state.ts`). The count-up finishing
 * is a ledger fact, so §7 #6 reads it here and on `[data-tally-state]`, not off
 * the run phase.
 */
export async function tallyState(page: Page): Promise<string> {
  return page.evaluate(() => {
    const handle = (window as unknown as { __tally?: { state(): string } }).__tally
    if (!handle) throw new Error('window.__tally is not exposed by the TALLY window')
    return handle.state()
  })
}

export async function meta(page: Page): Promise<MetaEvent> {
  return page.evaluate(() => {
    const handle = (window as unknown as { __tally?: { meta(): unknown } }).__tally
    if (!handle) throw new Error('window.__tally is not exposed by the TALLY window')
    return handle.meta() as never
  })
}

/* ── stream readers ──────────────────────────────────────────────────────── */

export function eventsOfType(f: Frame, type: string): StreamEvent[] {
  return f.events.filter((e) => e.type === type)
}

/** The last `meta` the driver emitted — the only authority on run numbers. */
export function lastMeta(f: Frame): MetaEvent {
  const metas = eventsOfType(f, 'meta') as unknown as MetaEvent[]
  expect(metas.length, 'the stream carries no `meta` event').toBeGreaterThan(0)
  return metas[metas.length - 1]!
}

/** Every sentence the stream has published, body and facts alike, by id. */
export function sentencesOf(f: Frame): Sentence[] {
  const out: Sentence[] = []
  for (const event of eventsOfType(f, 'report')) {
    for (const key of ['facts', 'report_body'] as const) {
      const list = (event as unknown as Record<string, Sentence[] | undefined>)[key]
      if (Array.isArray(list)) out.push(...list)
    }
  }
  return out
}

/* ── membrane ops the run-through performs ───────────────────────────────── */

/**
 * Clicks the first mineable sentence and answers its canonical id.
 *
 * `.min` is the mineable anchor (u6); the body arrives through a typewriter
 * REPLAY, so the wait is on visibility, not on presence.
 */
export async function mineFirst(page: Page): Promise<string> {
  const target = page.locator('#w-rep .min[data-sentence-id]').first()
  await expect(target, 'no mineable sentence is on the REPORTS pane').toBeVisible({ timeout: 20_000 })
  const id = await target.getAttribute('data-sentence-id')
  expect(id, 'a mineable sentence carries no data-sentence-id').toBeTruthy()
  await target.click()
  return id!
}

/**
 * Closes the day and starts the next one — the design script's "Full loop":
 * 21:04 → TALLY counts up → NEW RUN unlocks the file, carries the blocks and
 * files the closing report into the archive. This is what puts a mineable
 * report on the desk with an UNLOCKED file to slot into (§7 #5).
 */
export async function newRun(page: Page): Promise<void> {
  await drain(page)
  await expect(page.locator('#w-tally [data-tally-state]')).toHaveAttribute('data-tally-state', 'final', {
    timeout: 30_000,
  })
  await page.locator('#w-tally #btnNewRun').click()
  await expect(page.locator('#w-tally')).toHaveClass(/\bhidden\b/, { timeout: 20_000 })
}

/** Seeds the SIM clock through the C16 hook — the only way to REACH 21:04. */
export async function seedClock(page: Page, at: string): Promise<void> {
  await page.evaluate((stamp) => {
    const handle = (window as unknown as { __shell?: { clock?: { seed(at: string): void } } }).__shell
    if (!handle?.clock) {
      throw new Error('window.__shell.clock is not exposed — the C16 sim-clock hook is missing')
    }
    handle.clock.seed(stamp)
  }, at)
}

/** Seats `blockId` in `slot` through the store card, keyboard-free. */
export async function slotBlock(page: Page, blockId: string, slot = 0): Promise<void> {
  await page.locator(`#w-store #storeList .bcard[data-block="${blockId}"]`).click()
  await page.locator(`#w-file .slot[data-slot="${slot}"]`).click()
}

/* ── the wire (items 11 + preview smoke) ─────────────────────────────────── */

export interface WireLog {
  /** Every request whose origin is not the page's own. */
  thirdParty(): string[]
  all(): string[]
}

/** Starts recording requests; call before `goto`. */
export function watchWire(page: Page, baseURL: string): WireLog {
  const all: string[] = []
  const foreign: string[] = []
  const origin = new URL(baseURL).origin
  page.on('request', (req: Request) => {
    const url = req.url()
    all.push(url)
    if (url.startsWith('data:') || url.startsWith('blob:')) return
    if (!url.startsWith(origin)) foreign.push(url)
  })
  return { thirdParty: () => [...foreign], all: () => [...all] }
}

/* ── capture protocol (C14/C15) ──────────────────────────────────────────── */

export const DEFAULT_SEEK_MS = 2000

/**
 * FREEZE = seek-and-pause, never `animation:none` (C14): a paused animation
 * with a negative delay holds the frame the reference held, while
 * `animation:none` would leave every `animation … both` reveal invisible and
 * match a blank build shot falsely.
 */
export async function freezeAt(page: Page, seekMs: number = DEFAULT_SEEK_MS): Promise<void> {
  await page.addStyleTag({
    content:
      `*,*::before,*::after{animation-play-state:paused!important;` +
      `animation-delay:-${seekMs}ms!important;` +
      `transition-duration:0s!important;transition-delay:0s!important}` +
      // capture-side only — the build itself carries no such rule (C14 PANE)
      `#debug-pane,.debug-pane{display:none!important}`,
  })
}

/**
 * SETTLE = install-after-first-paint (C14). Installing before `goto` stalls
 * boot and yields a black frame. Returns the settle mode actually achieved so a
 * capture can record it.
 */
export async function settle(page: Page, seekMs: number = DEFAULT_SEEK_MS): Promise<'virtual-clock' | 'wallclock'> {
  await firstPaint(page)
  await freezeAt(page, seekMs)
  try {
    await page.clock.install()
    return 'virtual-clock'
  } catch {
    return 'wallclock'
  }
}

/** Advances real time under whichever settle mode is in force. */
export async function advance(page: Page, mode: 'virtual-clock' | 'wallclock', ms: number): Promise<void> {
  if (mode === 'virtual-clock') await page.clock.runFor(ms)
  else await page.waitForTimeout(ms)
}

/**
 * C15 — installing the clock is NOT enough: a boot-paused app can hold windows
 * in a pre-mount state that element screenshots refuse. Run far enough forward
 * that mount has COMPLETED before any element shot is taken.
 */
export async function runToMount(page: Page, mode: 'virtual-clock' | 'wallclock'): Promise<number> {
  await advance(page, mode, 3000)
  return page.evaluate(() => document.querySelectorAll('.win').length)
}

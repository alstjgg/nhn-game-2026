// u11 — frontend-mod P0-B: the BUILD side of the ten paired shots.
//
// The reference side is already rendered (`.claude/super/reference-shots/`, all
// ten names). This spec produces the matching build side under
// `.claude/super/build-shots/` with the IDENTICAL protocol — C14, verbatim:
//
//   · SETTLE  install-after-first-paint. `page.clock.install()` before `goto`
//             stalls boot and yields a black frame (u8's finding). goto → two
//             rAFs → install → runFor.
//   · MOUNT   C15 — installing alone is not enough: run far enough forward that
//             mount has COMPLETED, or element screenshots refuse a pre-mount
//             box. On a visibility failure, fall back to a full-page shot
//             CLIPPED to the measured rect and record the mode.
//   · FREEZE  seek-and-pause (`animation-play-state:paused` +
//             `animation-delay:-Nms`), NEVER `animation:none` — desktop.css:574
//             reveals `.tly-table tr` from opacity:0, so `animation:none` leaves
//             every row invisible and matches a blank build shot FALSELY.
//   · PANE    the debug pane is hidden for every shot. A shot with the pane
//             visible is an INVALID shot, not a finding.
//
// `#w-tally` is `display:none` by class until the tally phase — CORRECT
// behaviour, not a bug (C15). Its two shots seed the sim clock to the terminal
// minute through the C16 hook (`window.__shell.clock`) instead of racing ×4.
//
// HOST: `npm run dev` — C5(d), the fixture round only exists in DEV.
//
// Titles are load-bearing: [u11#c5] runs the whole file.
import { expect, test } from 'playwright/test'
import type { Page } from 'playwright/test'
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { advance, freezeAt, firstPaint, runToMount } from './fixtures/harness.ts'

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

/** The run's shot dirs live in `.claude/super/`, which is not tracked in a
 *  worktree — resolve through the git COMMON dir so a worktree run finds the
 *  same reference side the dashboard PR shows. */
function superDir(): string {
  const candidate = path.join(REPO, '.claude/super')
  if (fs.existsSync(path.join(candidate, 'reference-shots'))) return candidate
  const common = execFileSync('git', ['rev-parse', '--path-format=absolute', '--git-common-dir'], {
    cwd: REPO,
    encoding: 'utf8',
  }).trim()
  return path.join(path.dirname(common), '.claude/super')
}

const REFERENCE_DIR = path.join(superDir(), 'reference-shots')
const OUT_DIR = process.env.SHOT_OUT ?? path.join(superDir(), 'build-shots')
const NOTE = path.join(OUT_DIR, 'capture-note.md')

interface Shot {
  /** Basename — must pair 1:1 with `reference-shots/<name>.png`. */
  readonly name: string
  /** Element to frame, or null for the whole 1280×800 desk. */
  readonly selector: string | null
  /** Freeze seek in ms (C14: 2000 default, boot-scanline 400). */
  readonly seekMs?: number
  /** Real ms to run after install, before the shot. */
  readonly tickMs?: number
  /** Seed the sim clock to this stamp before shooting (C16 hook). */
  readonly seedAt?: string
  /** Extra real ms after the seed — the count-up's own runtime. */
  readonly holdMs?: number
}

/** The ten reference basenames, ported from `.claude/build-shots.js` verbatim. */
const SHOTS: readonly Shot[] = [
  { name: 'boot-scanline', selector: null, seekMs: 400, tickMs: 400 },
  { name: 'shell-desktop-1280x800', selector: null },
  { name: 'topbar-clock-dday', selector: '#topbar' },
  { name: 'win-agent-file', selector: '#w-file' },
  { name: 'win-live-feed', selector: '#w-feed' },
  { name: 'win-reports', selector: '#w-rep' },
  { name: 'win-block-store', selector: '#w-store' },
  { name: 'red-thread-overlay', selector: null },
  { name: 'win-tally', selector: '#w-tally', seedAt: '21:04' },
  { name: 'tally-countup-final', selector: '#w-tally', seedAt: '21:04', holdMs: 11_000 },
]

function note(line: string): void {
  fs.mkdirSync(OUT_DIR, { recursive: true })
  if (!fs.existsSync(NOTE)) {
    fs.writeFileSync(
      NOTE,
      '# P0-B build-side capture note\n\n' +
        'One line per shot: settle mode, framing mode, mounted windows. A `clipped`\n' +
        'framing is the C15-sanctioned fallback for an element box Playwright\n' +
        'refuses while the boxes themselves measure non-zero.\n\n',
    )
  }
  fs.appendFileSync(NOTE, `${line}\n`)
}

/** C16 — seed the sim clock through the DEV-only hook, never by racing ×4. */
async function seedClock(page: Page, at: string): Promise<void> {
  await page.evaluate((stamp) => {
    const handle = (window as unknown as { __shell?: { clock?: { seed(at: string): void } } }).__shell
    if (!handle?.clock) {
      throw new Error('window.__shell.clock is not exposed — the C16 sim-clock hook is missing')
    }
    handle.clock.seed(stamp)
  }, at)
  await page.evaluate(() => {
    const handle = (window as unknown as { __shell?: { drain(): void } }).__shell
    handle?.drain()
  })
}

test.describe('captures', () => {
  test.describe.configure({ timeout: 120_000 })

  for (const shot of SHOTS) {
    test(`captures — ${shot.name} pairs with its reference shot`, async ({ page }) => {
      expect(
        fs.existsSync(path.join(REFERENCE_DIR, `${shot.name}.png`)),
        `no reference shot named ${shot.name}.png under ${REFERENCE_DIR}`,
      ).toBe(true)

      const errors: string[] = []
      page.on('pageerror', (e) => errors.push(String(e)))

      // SETTLE — install strictly AFTER first paint (C14).
      await page.goto('./', { waitUntil: 'networkidle' })
      await firstPaint(page)
      await freezeAt(page, shot.seekMs)
      let mode: 'virtual-clock' | 'wallclock' = 'wallclock'
      try {
        await page.clock.install()
        mode = 'virtual-clock'
      } catch {
        mode = 'wallclock'
      }

      // MOUNT — run far enough that mount COMPLETES before any element shot.
      const mounted = shot.tickMs != null ? (await advance(page, mode, shot.tickMs), 0) : await runToMount(page, mode)
      if (shot.name !== 'boot-scanline') {
        const count = await page.evaluate(() => document.querySelectorAll('.win').length)
        expect(count, `only ${count}/5 windows mounted — the shot would capture a stalled boot`).toBe(5)
      }

      if (shot.seedAt) {
        await seedClock(page, shot.seedAt)
        await advance(page, mode, shot.holdMs ?? 1000)
        await expect(page.locator('#w-tally'), 'the tally never left its hidden phase').not.toHaveClass(/hidden/)
      }

      // PANE — a shot with the pane visible is invalid, not a finding.
      await expect(page.locator('#debug-pane')).toBeHidden()

      fs.mkdirSync(OUT_DIR, { recursive: true })
      const out = path.join(OUT_DIR, `${shot.name}.png`)
      let framing = shot.selector ? 'element' : 'full-page'
      if (shot.selector) {
        const rect = await page.locator(shot.selector).evaluate((n) => {
          const r = n.getBoundingClientRect()
          return { x: r.x, y: r.y, width: r.width, height: r.height }
        })
        expect(rect.width, `${shot.selector} measures zero width — the port, not the harness, is broken`).toBeGreaterThan(0)
        expect(rect.height, `${shot.selector} measures zero height`).toBeGreaterThan(0)
        try {
          await page.locator(shot.selector).screenshot({ path: out, timeout: 10_000 })
        } catch {
          // C15 — sanctioned fallback: clip the full page to the measured rect.
          framing = 'clipped'
          await page.screenshot({ path: out, clip: rect })
        }
      } else {
        await page.screenshot({ path: out, fullPage: false })
      }

      expect(fs.existsSync(out), `${shot.name}.png was not written`).toBe(true)
      expect(fs.statSync(out).size, `${shot.name}.png is empty`).toBeGreaterThan(1024)
      expect(errors, `the page threw while capturing ${shot.name}`).toEqual([])
      note(`- \`${shot.name}\` — settle=${mode}, framing=${framing}, windows=${mounted || 5}`)
    })
  }

  test('captures — the build side names exactly the reference side, one for one', async () => {
    const png = (dir: string): string[] =>
      fs
        .readdirSync(dir)
        .filter((f) => f.endsWith('.png'))
        .sort()
    expect(fs.existsSync(REFERENCE_DIR), `reference shots are missing at ${REFERENCE_DIR}`).toBe(true)
    const reference = png(REFERENCE_DIR)
    expect(reference.length, 'the reference side is not the expected ten shots').toBe(10)
    expect(SHOTS.map((s) => `${s.name}.png`).sort()).toEqual(reference)
    expect(fs.existsSync(OUT_DIR), 'no build-side shots were produced').toBe(true)
    expect(png(OUT_DIR)).toEqual(reference)
  })
})

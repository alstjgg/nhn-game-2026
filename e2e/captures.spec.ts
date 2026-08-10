// u11 — frontend-mod P0-B: the BUILD side of the ten paired shots.
//
// The reference side is already rendered (`.claude/super/reference-shots/`, all
// ten names). This spec produces the matching build side under
// `.claude/super/build-shots/` with the IDENTICAL protocol — C14, verbatim:
//
//   · SETTLE  install-after-first-paint. `page.clock.install()` before `goto`
//             stalls boot and yields a black frame (u8's finding). goto → two
//             rAFs → HAND-OVER → install → runFor.
//   · HANDOVER the desk is only shootable once `<body class="booting">` is gone:
//             `shell.css:172` is `body.booting .win{visibility:hidden}`, and
//             `components/desktop-dressing.ts:revealDesk` drops the class only
//             when every window's ENTRY animation has RESOLVED. `freezeAt`
//             pauses exactly those animations, so freezing before the hand-over
//             pins the desk under that rule for ever — the windows keep their
//             layout boxes (a count/rect guard still passes) yet paint nothing,
//             and the refused element shot gets recorded as a "clipped"
//             framing of empty desk. That was attempt 1's ten blank shots.
//             `boot-scanline` is the ONE shot that wants the sweep, so it is
//             the one shot that does not wait.
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
import { fileURLToPath } from 'node:url'
import { advance, freezeAt, firstPaint, runToMount, settled, turnToAgent } from './fixtures/harness.ts'

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

// The reference side is TRACKED IN THE REPO (`e2e/reference-shots/`).
//
// It used to live in `.claude/super/reference-shots/`, the super-pipeline's
// runtime state — which CLAUDE.md rule 4 gitignores. That made these ten tests
// pass on exactly one machine (the one that ran the pipeline) and fail
// everywhere else, including CI and any fresh clone; the pipeline's own shots
// have since been lost with that directory, so there was nothing left to point
// at. Nothing detected it because no workflow ran Playwright at all.
//
// What the pair means has moved with it, deliberately. The original reference
// side was a render of the design target, and comparing against it was a
// one-time PORTING check that has already served its purpose. The tracked
// baseline is a VISUAL-REGRESSION baseline: these ten framed surfaces must keep
// rendering, non-empty and error-free, as the engine gets bound in behind them.
// That is the check with value for the work that is still ahead.
//
// Regenerate deliberately, never as a side effect of a normal run:
//   CAPTURE_BASELINE=1 SHOT_OUT=e2e/reference-shots \
//     npx playwright test e2e/captures.spec.ts --project=dev
//
// `CAPTURE_BASELINE` exists because the pairing preconditions below would
// otherwise make the baseline unbootstrappable: each shot asserts its reference
// twin EXISTS before it captures, which is exactly the assert a first run cannot
// satisfy. It suppresses only those preconditions — every liveness assert (the
// file was written, it is non-empty, the page threw nothing) still runs, so a
// baseline can never be refreshed from a broken desk.
const REFERENCE_DIR = path.join(REPO, 'e2e/reference-shots')
const OUT_DIR = process.env.SHOT_OUT ?? path.join(REPO, 'test-results/build-shots')

/** Refreshing the tracked baseline — see the note above. */
const BASELINE = process.env.CAPTURE_BASELINE === '1'
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
  /**
   * This shot IS the boot sweep — do not wait for the hand-over, and do not
   * expect a mounted desk. Exactly one shot in the table.
   */
  readonly underSweep?: boolean
  /**
   * The reference frames a thread crossing REPORTS → AGENT FILE. Nothing on a
   * freshly booted desk is slotted, so these two shots seat the run's own first
   * blocks through u4's dev handle before freezing (never fixture CONTENT, C3).
   */
  readonly threaded?: boolean
}

/** The ten reference basenames, ported from `.claude/build-shots.js` verbatim. */
const SHOTS: readonly Shot[] = [
  { name: 'boot-scanline', selector: null, seekMs: 400, tickMs: 400, underSweep: true },
  { name: 'shell-desktop-1280x800', selector: null, threaded: true },
  { name: 'topbar-clock-dday', selector: '#topbar' },
  { name: 'win-agent-file', selector: '#w-file' },
  { name: 'win-live-feed', selector: '#w-feed' },
  { name: 'win-reports', selector: '#w-rep' },
  { name: 'red-thread-overlay', selector: null, threaded: true },
  { name: 'terminal-record', selector: '#w-rep .terminal-record', seedAt: '21:04' },
  { name: 'terminal-record-final', selector: '#w-rep .terminal-record', seedAt: '21:04', holdMs: 11_000 },
]

/** The note describes THIS run — it is rewritten once per worker, not grown. */
let noteOpened = false

function note(line: string): void {
  fs.mkdirSync(OUT_DIR, { recursive: true })
  if (!noteOpened) {
    fs.writeFileSync(
      NOTE,
      '# P0-B build-side capture note\n\n' +
        'One line per shot: settle mode, framing mode, mounted windows. A `clipped`\n' +
        'framing is the C15-sanctioned fallback for an element Playwright refuses to\n' +
        'shoot while it IS painting (computed `visibility:visible`, non-zero box) —\n' +
        'never a stand-in for a window the boot sweep is still hiding.\n\n',
    )
    noteOpened = true
  }
  fs.appendFileSync(NOTE, `${line}\n`)
}

interface DeskState {
  readonly booting: boolean
  readonly windows: { readonly id: string; readonly visibility: string }[]
}

/** What the desk is actually PAINTING — the guard attempt 1 did not have. */
async function deskState(page: Page): Promise<DeskState> {
  return page.evaluate(() => ({
    booting: document.body.classList.contains('booting'),
    windows: [...document.querySelectorAll('.win')].map((w) => ({
      id: w.id,
      visibility: getComputedStyle(w).visibility,
    })),
  }))
}

/**
 * Seats the run's own first two blocks so the thread the reference frames
 * exists. Uses u4's and u8's dev handles — the same ones `e2e/red-thread.spec.ts`
 * drives — and reads the ids off the rendered report, never off the fixture (C3).
 */
async function drawThread(page: Page): Promise<{ count: number; ids: string[]; filled: number }> {
  await page.evaluate(() => {
    const handle = (window as unknown as { __shell?: { drain(): void } }).__shell
    if (!handle) throw new Error('window.__shell is not exposed by the shell boot')
    handle.drain()
  })
  await expect(
    page.locator('#w-rep [data-sentence-id]').first(),
    'the booted report renders no sentence anchor — nothing to thread',
  ).toBeAttached({ timeout: 20_000 })

  const ids = await page.evaluate(() => {
    const w = window as unknown as { __agentFile?: { place(id: string, slot: number): void } }
    if (!w.__agentFile) throw new Error('window.__agentFile is not exposed by the AGENT FILE window')
    const found = [...document.querySelectorAll('#w-rep [data-sentence-id]')]
      .map((n) => (n as HTMLElement).dataset.sentenceId ?? '')
      .filter(Boolean)
      .slice(0, 2)
    found.forEach((id, i) => w.__agentFile!.place(id, i))
    return found
  })

  // [u8#c3] — an anchor outside its window's visible rect has no thread, and
  // the AGENT FILE board sits below its dossier. Bring it into view the way the
  // operator would, exactly as `e2e/red-thread.spec.ts` does, THEN redraw.
  // C1 — the board is on the agent's page; the file opens on its cover.
  await turnToAgent(page)
  const filledSlots = page.locator('#w-file .slot.filled')
  const filled = await filledSlots.count()
  if (filled > 0) await filledSlots.last().scrollIntoViewIfNeeded()

  const count = await page.evaluate(() => {
    const w = window as unknown as { __threads?: { redraw(): void; count(): number } }
    if (!w.__threads) throw new Error('window.__threads is not exposed by the thread layer')
    w.__threads.redraw()
    return w.__threads.count()
  })
  await firstPaint(page)
  return { count, ids, filled }
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
  // x12 — LAND THE PAPER BEFORE FRAMING WHAT WAITS ON IT, the same move and the
  // same reasoning as `#coverSkip` above.
  //
  // The terminal record's count-up now holds until the LIVE FEED has printed its
  // way to the day's `score` (`shell/feed-reach.ts`) — the ledger's headline and
  // the fanfold's 집계 line are two printings of one count. The drain above
  // releases the whole day in one call, so the reveal has some 78 s of
  // reading-paced paper to get through, and the two record shots — one at 1 s,
  // one at 11 s — would both frame the same blank `pending` article. They did:
  // the pair came out byte-identical, which is the only reason this was caught,
  // since the suite pairs names and sizes rather than pixels.
  //
  // Flushing here puts the count-up's zero back where the reference shots were
  // taken from, and it is the honest instruction: this lane has already said
  // "release everything now" one line above.
  await page.evaluate(() => {
    const feed = (window as unknown as { __feed?: { flush(): void } }).__feed
    feed?.flush()
  })
}

test.describe('captures', () => {
  test.describe.configure({ timeout: 120_000 })

  for (const shot of SHOTS) {
    test(`captures — ${shot.name} pairs with its reference shot`, async ({ page }) => {
      if (!BASELINE) {
        expect(
          fs.existsSync(path.join(REFERENCE_DIR, `${shot.name}.png`)),
          `no reference shot named ${shot.name}.png under ${REFERENCE_DIR}`,
        ).toBe(true)
      }

      const errors: string[] = []
      page.on('pageerror', (e) => errors.push(String(e)))

      // SETTLE — install strictly AFTER first paint (C14), and after the desk
      // has been handed over (see HANDOVER above) for every shot but the sweep.
      await page.goto('./', { waitUntil: 'networkidle' })
      await firstPaint(page)
      if (!shot.underSweep) {
        await settled(page)
        if (shot.threaded) {
          const drawn = await drawThread(page)
          expect(
            drawn.count,
            `no thread was drawn — the shot would miss what the reference frames ` +
              `(ids=${JSON.stringify(drawn.ids)}, filled slots=${drawn.filled})`,
          ).toBeGreaterThan(0)
        }
      }
      let mode: 'virtual-clock' | 'wallclock' = 'wallclock'
      try {
        await page.clock.install()
        mode = 'virtual-clock'
      } catch {
        mode = 'wallclock'
      }
      await freezeAt(page, shot.seekMs)

      // MOUNT — run far enough that mount COMPLETES before any element shot.
      let mounted: number
      if (shot.tickMs != null) {
        await advance(page, mode, shot.tickMs)
        mounted = (await deskState(page)).windows.length
      } else {
        mounted = await runToMount(page, mode)
      }
      if (!shot.underSweep) {
        const desk = await deskState(page)
        expect(
          desk.booting,
          'the desk is still under the boot sweep: `body.booting .win{visibility:hidden}` keeps every layout box ' +
            'while painting nothing, so this shot would frame an empty desk (attempt-1 finding)',
        ).toBe(false)
        expect(
          desk.windows.length,
          `only ${desk.windows.length}/3 windows mounted — the shot would capture a stalled boot`,
        ).toBe(3)
        expect(
          desk.windows.filter((w) => w.visibility === 'hidden').map((w) => w.id),
          'a mounted window computes visibility:hidden — it occupies its box but paints nothing',
        ).toEqual([])
      }

      // x7 — LAND THE COVER BEFORE FRAMING IT.
      //
      // The AGENT FILE's cover types itself out now (`windows/agent-file.ts`),
      // and a capture installs a VIRTUAL clock, which virtualises the timers the
      // reveal steps on. `runToMount` then advances it by however much the mount
      // happened to cost, so `win-agent-file` — which frames `#w-file` on its
      // cover, since only `threaded` shots turn to the agent's page — would pair
      // its reference against a half-printed page, at a different fraction every
      // run. Nothing would FAIL (this suite pairs names and sizes, not pixels),
      // which is what makes it worth guarding: the shots are a competition
      // artifact and a silently wrong one is the bad case.
      //
      // Pressing the operator's own control rather than reaching into the
      // window: `#coverSkip` is the 건너뛰기 button, and it is removed once the
      // reveal has landed, so the `count()` guard covers both "already whole"
      // and "this shot is not on the cover". `underSweep` is exempt — that shot
      // IS the boot sweep and the desk has not been handed over yet.
      if (!shot.underSweep) {
        const skip = page.locator('#coverSkip')
        if ((await skip.count()) > 0) await skip.click()
      }

      if (shot.seedAt) {
        await seedClock(page, shot.seedAt)
        await advance(page, mode, shot.holdMs ?? 1000)
        await expect(page.locator('#w-rep .terminal-record'), 'the terminal record never landed').toHaveCount(1)
      }

      // PANE — a shot with the pane visible is invalid, not a finding.
      await expect(page.locator('#debug-pane')).toBeHidden()

      fs.mkdirSync(OUT_DIR, { recursive: true })
      const out = path.join(OUT_DIR, `${shot.name}.png`)
      let framing = shot.selector ? 'element' : 'full-page'
      if (shot.selector) {
        const framed = await page.locator(shot.selector).evaluate((n) => {
          const r = n.getBoundingClientRect()
          const s = getComputedStyle(n)
          return {
            x: r.x,
            y: r.y,
            width: r.width,
            height: r.height,
            visibility: s.visibility,
            display: s.display,
          }
        })
        expect(framed.width, `${shot.selector} measures zero width — the port, not the harness, is broken`).toBeGreaterThan(0)
        expect(framed.height, `${shot.selector} measures zero height`).toBeGreaterThan(0)
        // A refused element shot is only ever a Playwright quirk to work around
        // once the element is genuinely PAINTING. While it is not, the clipped
        // fallback silently crops a window-shaped rectangle of bare desk and
        // calls it a shot — attempt 1's eight false "clipped" framings.
        expect(
          framed.visibility,
          `${shot.selector} computes visibility:${framed.visibility} — it holds its box but paints nothing, ` +
            'so no framing of it is a shot of the window',
        ).toBe('visible')
        expect(framed.display, `${shot.selector} computes display:none — it is not on the desk`).not.toBe('none')
        const rect = { x: framed.x, y: framed.y, width: framed.width, height: framed.height }
        try {
          await page.locator(shot.selector).screenshot({ path: out, timeout: 10_000 })
        } catch {
          // C15 — sanctioned fallback for a PAINTING element Playwright refuses.
          framing = 'clipped'
          await page.screenshot({ path: out, clip: rect })
        }
      } else {
        await page.screenshot({ path: out, fullPage: false })
      }

      expect(fs.existsSync(out), `${shot.name}.png was not written`).toBe(true)
      expect(fs.statSync(out).size, `${shot.name}.png is empty`).toBeGreaterThan(1024)
      expect(errors, `the page threw while capturing ${shot.name}`).toEqual([])
      note(`- \`${shot.name}\` — settle=${mode}, framing=${framing}, windows=${mounted}`)
    })
  }

  test('captures — the build side names exactly the reference side, one for one', async () => {
    const png = (dir: string): string[] =>
      fs
        .readdirSync(dir)
        .filter((f) => f.endsWith('.png'))
        .sort()
    // No baseline special-case: refreshing writes INTO the reference dir, so
    // `OUT_DIR === REFERENCE_DIR` and every assert below holds on its own. The
    // count and the name-for-name pairing still bind in that mode, which is what
    // keeps a refresh from quietly shipping nine shots.
    expect(fs.existsSync(REFERENCE_DIR), `reference shots are missing at ${REFERENCE_DIR}`).toBe(true)
    const reference = png(REFERENCE_DIR)
    expect(reference.length, 'the reference side is not the expected nine shots').toBe(9)
    expect(SHOTS.map((s) => `${s.name}.png`).sort()).toEqual(reference)
    expect(fs.existsSync(OUT_DIR), 'no build-side shots were produced').toBe(true)
    expect(png(OUT_DIR)).toEqual(reference)
  })

  test('captures — no two shots of one surface are the same frame', async () => {
    // INT-7: the reference renderer once overshot the tally count-up, so
    // `win-tally` and `tally-countup-final` were byte-identical and the pair
    // silently compared one reference frame against two build states. Names
    // that frame the same surface at different moments must differ in content
    // — on both sides.
    const pairs: readonly [string, string][] = [['terminal-record.png', 'terminal-record-final.png']]
    for (const dir of [REFERENCE_DIR, OUT_DIR].filter((d) => fs.existsSync(d))) {
      for (const [a, b] of pairs) {
        const fa = path.join(dir, a)
        const fb = path.join(dir, b)
        if (!fs.existsSync(fa) || !fs.existsSync(fb)) continue
        expect(
          fs.readFileSync(fa).equals(fs.readFileSync(fb)),
          `${a} and ${b} under ${dir} are byte-identical — two names, one frame`,
        ).toBe(false)
      }
    }
  })
})

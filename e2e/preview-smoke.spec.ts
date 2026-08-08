// u11 — C5(b): the PREVIEW smoke, against `npm run preview` of a real build.
//
// The C5 split (08-04) says the preview directive was always about ARTEFACT
// TRUTHS, never about the fixture round: `driver/demo-run.ts` returns null when
// `!import.meta.env.DEV`, so a player build boots an empty desk — no feed
// lines, 0 mined, no thread — by design (inv 11 / §5.4 / u2f#c9). This file
// therefore asserts what only a BUILT artefact can prove and deliberately does
// NOT attempt the §7 round; that lives in `acceptance.spec.ts` on the dev host.
//
// Titles are load-bearing: [u11#c10] runs the whole file.
import { expect, test } from 'playwright/test'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { watchWire } from './fixtures/harness.ts'
import { CHROME, FREE_TEXT, WIN } from './fixtures/selectors.ts'

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DIST = path.join(REPO, 'dist')

/**
 * The proxy origin this repo declares, read from the same `.env.production` the
 * build read. `null` when unset — in which case nothing external is admitted and
 * inv 10 binds exactly as it did before the endpoint existed.
 */
function declaredProxyOrigin(): string | null {
  const file = path.join(REPO, '.env.production')
  if (!fs.existsSync(file)) return null
  const match = /^\s*VITE_PROXY_BASE_URL\s*=\s*(\S+)\s*$/m.exec(fs.readFileSync(file, 'utf8'))
  if (match === null) return null
  try {
    return new URL(match[1]!).origin
  } catch {
    return null
  }
}

/** Every emitted CODE artefact — `dist/data/**` is the pack, not code. */
function bundleCode(): string[] {
  const out: string[] = []
  const walk = (dir: string): void => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) walk(full)
      else if (/\.(js|mjs|css|html)$/.test(entry.name)) out.push(full)
    }
  }
  walk(DIST)
  return out.filter((f) => !path.relative(DIST, f).split(path.sep).includes('data'))
}

test.describe('preview smoke', () => {
  test('preview smoke — the shell boots from the built artefact', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(String(e)))

    await page.goto('./')
    await expect(page.locator(CHROME.app)).toHaveCount(1)
    await expect(page.locator(WIN.any)).toHaveCount(3)
    await expect(page.locator(CHROME.caseName)).not.toBeEmpty()
    expect(errors, 'the built desk threw on boot').toEqual([])
  })

  test('preview smoke — the pack is served from dist/data/', async ({ page }) => {
    const packRequests: string[] = []
    page.on('response', (res) => {
      if (/\/data\/(scenario|policy)\//.test(res.url())) packRequests.push(`${res.status()} ${res.url()}`)
    })

    await page.goto('./')
    await expect(page.locator(CHROME.caseName)).not.toBeEmpty()

    expect(
      fs.existsSync(path.join(DIST, 'data/scenario')),
      'the §3.7 pack-copy plugin emitted no dist/data/scenario',
    ).toBe(true)
    expect(packRequests.length, 'the built desk fetched no pack from dist/data/').toBeGreaterThan(0)
    expect(packRequests.filter((r) => !r.startsWith('200')), 'a pack request did not answer 200').toEqual([])
  })

  test('preview smoke — the built page reaches no third-party origin (inv 10)', async ({ page, baseURL }) => {
    const wire = watchWire(page, baseURL!)
    await page.goto('./')
    await expect(page.locator(WIN.any)).toHaveCount(3)
    await page.waitForLoadState('networkidle')
    // The LLM tier is the one origin inv 10 admits, and it is admitted by NAME:
    // the host comes from the same `.env.production` the build read, so a second
    // origin — or a stale one after a stack recreation — still fails here.
    // Reaching it is the point; whether it ANSWERS is not this test's business,
    // and from localhost it will not (the proxy is origin-locked to Pages).
    const declared = declaredProxyOrigin()
    const foreign = wire.thirdParty().filter((url) => declared === null || !url.startsWith(declared))
    expect(foreign, 'the player build reached a third-party origin').toEqual([])
  })

  test('preview smoke — no debug-pane and no fixture code reached the bundle (inv 11)', async () => {
    expect(fs.existsSync(DIST), 'no dist/ to grep — run `npm run build` first').toBe(true)
    const files = bundleCode()
    expect(files.length, 'dist/ emitted no code at all').toBeGreaterThan(0)

    const needles = [
      'nhn:debug-pane',
      'data-debug-table',
      'debug-pane',
      'woodari',
      'createFixtureDriver',
      'freezeAnimations',
      'installClockHook',
      // u3's dev/test driver handle. It was shipping — `window.__shell={frame:
      // …,drain:…}` was in `dist/assets/index-*.js` — precisely because this
      // list did not name it, so no gate could see it. `shell/boot.ts` now folds
      // the whole assignment away outside DEV, and the needle keeps it that way.
      '__shell',
      // …and its four siblings. `__shell` was gated first and named here alone,
      // which left a gate that could see one handle and not the rest: the window
      // handles `__feed`/`__tally`/`__agentFile` and the shell's `__threads` were
      // all still in `dist/assets/index-*.js`. Each assignment now folds away
      // outside DEV and each name is a needle, so the list and the rule cover the
      // same set.
      '__feed',
      '__tally',
      '__agentFile',
      '__threads',
    ]
    const hits: string[] = []
    for (const file of files) {
      const source = fs.readFileSync(file, 'utf8')
      for (const needle of needles) {
        if (source.includes(needle)) hits.push(`${path.relative(REPO, file)} ← ${JSON.stringify(needle)}`)
      }
    }
    expect(hits, 'the player build carries debug, fixture or test-hook code').toEqual([])
  })

  test('preview smoke — the built page carries no free-text surface (inv 1)', async ({ page }) => {
    await page.goto('./')
    await expect(page.locator(WIN.any)).toHaveCount(3)
    expect(await page.locator(FREE_TEXT).count(), 'a free-text surface reached the player build').toBe(0)
  })

  test('preview smoke — the load budget holds at ~1 s', async ({ page }) => {
    const started = Date.now()
    await page.goto('./', { waitUntil: 'load' })
    await expect(page.locator(CHROME.app)).toHaveCount(1)
    const elapsed = Date.now() - started

    const timing = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
      return nav ? nav.loadEventEnd - nav.startTime : null
    })
    expect(elapsed, `the built page took ${elapsed} ms to reach load (§7 #11 budget ~1 s)`).toBeLessThan(1500)
    if (timing !== null) expect(timing, 'the navigation timing exceeds the ~1 s budget').toBeLessThan(1500)
  })

  test('preview smoke — the player build boots the LIVE desk, not a fixture', async ({ page }) => {
    await page.goto('./')
    await expect(page.locator(WIN.any)).toHaveCount(3)

    // This asserted ZERO feed lines until 2026-08-05, and it was right to: a
    // player build had no driver behind it, so a line on the desk could only
    // have come from a fixture that failed to tree-shake. `src/client/driver/live/`
    // gave the desk an engine, and an empty desk became the bug instead of the
    // guarantee.
    //
    // inv 11 itself has not moved, and it is not measured by counting lines —
    // the sibling test greps the bundle for fixture and debug-pane needles, which
    // is the check that can actually tell the two apart. What survives here is
    // the browser-side half: the desk that booted is the LIVE one.
    // Waited for, not sampled. The claim is "there is a run behind this desk",
    // and the live path fetches a pack and opens a run loop before it can show
    // one — so counting at first paint measures machine load, not the claim. It
    // sampled zero once under a full-suite run and passed 3/3 alone (08-08).
    await expect(
      page.locator('#w-feed #feedList .fl').first(),
      'the player build booted a desk with no run behind it',
    ).toBeAttached({ timeout: 15_000 })

    // The run counter is the tell. e8's run loop opens on its own allotment;
    // the placeholder stream `shell/boot-run.ts` hardcodes RUN 3 of 10, so these
    // two can never be confused for one another.
    await expect(page.locator('#ddayUnit')).toContainText('RUN 01')
    await expect(page.locator('#ddayUnit')).toContainText('/ 4')
  })
})

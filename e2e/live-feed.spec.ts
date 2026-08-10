// [u5] LIVE FEED — the rendered half: a whole fixture round on the fanfold, the
// silent wait, the 17:33 fallback, clock-landed lines, and a surface the player
// cannot touch.
//
// Covers [u5#c2] round renders in order · [u5#c4] silent waiting ·
// [u5#c5] fallback line · [u5#c6] lines land on the clock ·
// [u5#c7] untouchable during a run.
//
// Test titles are load-bearing: the unit's verification commands filter with
// `-g 'round renders in order'`, `-g 'silent waiting'`, `-g 'fallback line'`,
// `-g 'lines land on the clock'` and `-g 'untouchable during a run'`. Do not
// rename a describe block without updating `.claude/super/units/u5.md`.
//
// x6 — `diegetic waiting` became `silent waiting` when the wait markers were
// removed; see that block for why the rename was safe to make.
//
// The two handles this suite drives:
//   • `window.__shell` — u3's: `{ frame(), drain() }`, the driver undecorated.
//   • `window.__feed`  — u5's: `{ seek(at), rate(r), count(), kinds(), stamps() }`.
//     ×1 is ~77 s of real time for the whole day, so `seek` is the only way to
//     reach 21:04 inside an e2e budget (design D13).
//
// C3: no synthetic fixture literal is asserted. The Korean strings that appear
// are the *client's own* component states (`(변화 없음)`) and the reference
// marks, not run content. The wait phrasings used to be on that list; x6 took
// them off it by taking them out of the client.
import { expect, test } from 'playwright/test'
import type { Page } from 'playwright/test'
import { deployFile } from './fixtures/harness.ts'

const FEED = '#w-feed'
const LIST = '#w-feed #feedList'
const SCROLL = '#w-feed #feedScroll'

/**
 * The marks as they must reach `.fl-c[data-mark]` — app.js:405's table with the
 * one deviation x10 (민서, 08-10) declared: the radio prints none. The attribute
 * is still WRITTEN, empty, so the 21px gutter stays reserved and the agent's
 * text keeps the left edge every other kind's body text sits on.
 */
const MARKS: Record<string, string> = {
  event: '▸',
  radio: '',
  npc: '—',
  symptom: '·',
  wait: '',
  fallback: '※',
  mark: '',
}

const EMPTY_SYMPTOM = '(변화 없음)'

interface StreamLine {
  kind: string
  clock: string
  text: string
  speaker?: string
}

interface DomLine {
  kind: string
  stamp: string | null
  mark: string | null
  text: string
  empty: boolean
  band: boolean
  resolved: boolean
}

const mm = (stamp: string): number => {
  const m = /^(\d{2}):(\d{2})$/.exec(stamp)
  if (!m) throw new Error(`not an HH:MM stamp: ${JSON.stringify(stamp)}`)
  return Number(m[1]) * 60 + Number(m[2])
}

/** Boot the desk and wait until the feed window has built its fanfold. */
async function boot(page: Page): Promise<void> {
  await page.goto('./')
  await expect(page.locator(FEED)).toBeVisible()
  await expect(page.locator(SCROLL)).toHaveCount(1)
  await expect(page.locator(LIST)).toHaveCount(1)
  await page.waitForFunction(() => Boolean((window as unknown as { __feed?: unknown }).__feed))
}

async function frame(page: Page): Promise<{
  clock: string
  minute: number
  rate: number
  ended: boolean
  events: { type: string; [k: string]: unknown }[]
  store: unknown
}> {
  return page.evaluate(() => {
    const h = (window as unknown as { __shell?: { frame(): unknown } }).__shell
    if (!h) throw new Error('window.__shell is not exposed by the shell boot')
    return h.frame() as never
  })
}

/** The `feed` lines the driver has released so far, in stream order. */
async function streamLines(page: Page): Promise<StreamLine[]> {
  const f = await frame(page)
  return f.events
    .filter((e) => e.type === 'feed')
    .map((e) => (e as unknown as { line: StreamLine }).line)
}

async function seek(page: Page, at: string): Promise<void> {
  await page.evaluate((to) => {
    const h = (window as unknown as { __feed?: { seek(at: string): void } }).__feed
    if (!h) throw new Error('window.__feed is not exposed by the LIVE FEED window')
    h.seek(to)
  }, at)
}

async function setRate(page: Page, rate: 0 | 1 | 4): Promise<void> {
  await page.evaluate((r) => {
    const h = (window as unknown as { __feed?: { rate(r: number): void } }).__feed
    if (!h) throw new Error('window.__feed is not exposed by the LIVE FEED window')
    h.rate(r)
  }, rate)
}

async function domLines(page: Page): Promise<DomLine[]> {
  return page.locator(`${LIST} li`).evaluateAll((nodes) =>
    nodes.map((n) => {
      const li = n as HTMLElement
      const kind = (li.className.match(/\bfl-([a-z]+)\b/) ?? [, ''])[1] ?? ''
      const stampNode = li.querySelector('.fl-t')
      const content = li.querySelector('.fl-c')
      return {
        kind,
        stamp: stampNode ? (stampNode.textContent ?? '').trim() : null,
        mark: content ? content.getAttribute('data-mark') : null,
        text: (content?.textContent ?? '').trim(),
        empty: li.dataset.empty === '1' || content?.getAttribute('data-empty') === '1',
        band: li.classList.contains('band'),
        resolved: li.classList.contains('resolved'),
      }
    }),
  )
}

/**
 * Rendered lines that came off the stream — the client's own states removed.
 * The 21:04 집계 line is one of them: minted from the `score` event
 * (`tally-line.ts`, #183), not a stream line; run-loop.spec asserts it on
 * its own.
 */
const streamRendered = (lines: DomLine[]): DomLine[] =>
  lines.filter((l) => !l.empty && !l.text.startsWith('집계. '))

/* ══ the day opens on the press, never before it ══════════════════════════ */

test.describe('the day opens on the press', () => {
  // THE DEFECT (fixed 2026-08-09). The shell opens the desk with `advance(0)`
  // so the run's `meta` reaches the chrome at boot, and that release used to
  // carry the whole opening MINUTE with it — on the demo run, the case's first
  // script event and 서지형's first line. The fanfold printed the day's opening
  // while the AGENT FILE was still empty and ECHO-1 had not gone in, which is
  // the one edge spec-client §5.1 names outright: `BUILD → (deploy) RUN`.
  //
  // The driver holds it now (`tests/driver/build-hold.test.ts` pins that side,
  // including the half that costs a model call). This is the operator's own
  // view of the same claim: the paper the desk boots with is blank, and the
  // press is what puts the first line on it.
  test('the day opens on the press — the fanfold is empty until the file is committed', async ({ page }) => {
    await boot(page)

    // The window is up and the head is printed — the stock is not a run line.
    await expect(page.locator(`${FEED} .feed-head`)).toHaveCount(1)
    await expect(page.locator(`${LIST} li`), 'the run printed before it was opened').toHaveCount(0)

    // …and the desk still knows which day it is: `meta` is not run content, so
    // the counter, the pips and the callsign are all on the desk at boot.
    const opened = await frame(page)
    expect(opened.events.map((e) => e.type)).toContain('meta')
    expect(
      opened.events.filter((e) => e.type === 'feed'),
      'the driver released a feed line into an unopened day',
    ).toEqual([])

    await deployFile(page)

    await expect(page.locator(`${LIST} li`).first()).toBeAttached({ timeout: 10_000 })
    // The first line is the run's own first line, not a client-minted one —
    // whatever the pack authors at its opening minute.
    const first = (await domLines(page))[0]!
    const stream = await streamLines(page)
    expect(stream.length, 'the press released nothing').toBeGreaterThan(0)
    expect(first.text).toBe(stream[0]!.text)
  })
})

/* ══ [u5#c2] a full fixture round renders in stream order ═════════════════ */

test.describe('round renders in order', () => {
  test.beforeEach(async ({ page }) => {
    await boot(page)
    // The day does not open until the file is committed — the driver holds the
    // run's own stream until a `deploy` op arrives (spec-client §5.1), so a
    // fanfold read before the press is an empty one by contract.
    await deployFile(page)
    await setRate(page, 0)
    await seek(page, '21:04')
  })

  test('round renders in order — every stream line lands, in stream order', async ({ page }) => {
    const stream = await streamLines(page)
    expect(stream.length).toBeGreaterThan(30)

    const rendered = streamRendered(await domLines(page))
    expect(rendered.map((l) => l.kind)).toEqual(stream.map((l) => l.kind))
    expect(rendered.filter((l) => l.kind !== 'mark').map((l) => l.stamp)).toEqual(
      stream.filter((l) => l.kind !== 'mark').map((l) => l.clock),
    )
  })

  test('round renders in order — each line shows the engine text verbatim', async ({ page }) => {
    const stream = await streamLines(page)
    const rendered = streamRendered(await domLines(page))
    for (let i = 0; i < stream.length; i += 1) {
      expect(rendered[i]?.text).toContain(stream[i]!.text)
      if (stream[i]!.speaker) expect(rendered[i]?.text).toContain(stream[i]!.speaker!)
    }
  })

  test('round renders in order — every line carries its kind mark', async ({ page }) => {
    for (const line of await domLines(page)) {
      if (line.kind === 'mark') continue
      expect(`${line.kind}:${line.mark ?? ''}`).toBe(`${line.kind}:${MARKS[line.kind] ?? ''}`)
    }
  })

  // x10 (민서, 08-10) — the radio's `◈` and its `ECHO-n · 무전` caption both went
  // (`MARKS` above carries the empty mark; this pins the other half). The caption
  // repeated on every radio line the name the fanfold header prints once per run.
  // What must be on the paper is the utterance, and after it nothing but the
  // U5.4 citation — the DOM half of `live-feed.test.ts`'s `[u5#c1] (i)`.
  test('round renders in order — a radio line prints the utterance alone, uncaptioned', async ({ page }) => {
    await expect(page.locator(`${LIST} li.fl-radio .fl-c b`)).toHaveCount(0)

    const spoken = (await streamLines(page)).filter((l) => l.kind === 'radio')
    expect(spoken.length).toBeGreaterThan(0)

    // Read in ONE pass, not row by row: an uncited line has no `.fl-cite` at
    // all, and asking a Playwright locator for the text of nothing waits for it
    // to appear until the test times out. Absence is the thing being measured,
    // so it has to be read as absence.
    const printed = await page.locator(`${LIST} li.fl-radio`).evaluateAll((rows) =>
      rows.map((row) => {
        const content = row.querySelector('.fl-c')
        return {
          text: (content?.textContent ?? '').trim(),
          cite: (row.querySelector('.fl-cite')?.textContent ?? '').trim(),
          mark: content?.getAttribute('data-mark') ?? null,
        }
      }),
    )
    expect(printed.length).toBe(spoken.length)

    for (let i = 0; i < spoken.length; i += 1) {
      // Nothing before the utterance …
      expect(printed[i]!.text.startsWith(spoken[i]!.text)).toBe(true)
      // … and nothing after it but the citation, when there is one.
      expect(printed[i]!.text.slice(spoken[i]!.text.length).trim()).toBe(printed[i]!.cite)
      // The gutter is empty, not absent: the column is still reserved.
      expect(printed[i]!.mark).toBe('')
    }
  })

  test('round renders in order — no beat shows more than three symptom lines', async ({ page }) => {
    const lines = await domLines(page)
    const overloaded: number[] = []
    let beat = 0
    let symptoms = 0
    for (const line of lines) {
      if (line.kind === 'event') {
        if (symptoms > 3) overloaded.push(beat)
        beat += 1
        symptoms = 0
      }
      if (line.kind === 'symptom') symptoms += 1
    }
    if (symptoms > 3) overloaded.push(beat)
    expect(overloaded).toEqual([])
  })

  test('round renders in order — a symptom-free beat renders the empty state', async ({ page }) => {
    const lines = await domLines(page)
    const empties = lines.filter((l) => l.empty)
    expect(empties.length).toBeGreaterThan(0)
    for (const e of empties) {
      expect(e.kind).toBe('symptom')
      expect(e.text).toContain(EMPTY_SYMPTOM)
    }
  })

  test('round renders in order — the head and the tail frame the fanfold', async ({ page }) => {
    await expect(page.locator(`${FEED} .feed-head`)).toHaveCount(1)
    await expect(page.locator(`${FEED} .feed-tail`)).toHaveCount(1)
    await expect(page.locator(`${FEED} .sprocket`)).toHaveCount(2)
  })

  test('round renders in order — the band alternates across event and npc lines', async ({ page }) => {
    const banded = (await domLines(page)).filter((l) => l.kind === 'event' || l.kind === 'npc')
    expect(banded.length).toBeGreaterThan(4)
    expect(banded.some((l) => l.band)).toBe(true)
    expect(banded.some((l) => !l.band)).toBe(true)
  })
})

/* ══ [u5#c4] waiting is SILENT — x6 ═══════════════════════════════════════
   The criterion used to read "waiting is diegetic, never a spinner", and the
   feed carried `……무전 회신 대기 중 ● ● ●` for every call in flight: latency told
   as a radio waiting for its answer rather than as a percentage. Half of that
   survives — no spinner, no percentage, still true and still checked below.
   The other half is gone (민서, 08-09). On a seven-round day three markers a
   beat were the most frequent thing on the paper, and each one said only that
   the desk was still working; the answer says that a beat later, with content.

   So the describe is `silent waiting` now, not `diegetic waiting`. The old
   title was load-bearing for a `-g` filter in `.claude/super/units/u5.md` —
   that file no longer exists (`.claude/super/` is gitignored runtime state),
   which is why this rename is safe to make. The header above was updated with
   it. `WAIT_PHRASE` left this file with the markers: nothing in the client
   authors those three strings any more, so a test that named them would be the
   only place they still lived.                                                */

test.describe('silent waiting', () => {
  test.beforeEach(async ({ page }) => {
    await boot(page)
    // The day does not open until the file is committed — the driver holds the
    // run's own stream until a `deploy` op arrives (spec-client §5.1), so a
    // fanfold read before the press is an empty one by contract.
    await deployFile(page)
    await setRate(page, 0)
  })

  test('silent waiting — an open wait draws nothing at all, and still no spinner', async ({ page }) => {
    // 09:25 opens the judgment wait; the reply lands at 09:26. Parked between
    // the two, on the one frame that used to be guaranteed to show a marker.
    await seek(page, '09:25')
    await expect(page.locator(`${LIST} li.fl-wait`)).toHaveCount(0)
    await expect(page.locator(`${FEED} .dots`)).toHaveCount(0)
    // The half of [u5#c4] that outlived the marker: an open call may not be
    // reported as a machine measuring itself, and now may not be reported at
    // all. A regression that brought back a spinner INSTEAD of the marker would
    // pass a count-0 check on `.fl-wait` alone, so both are asserted.
    await expect(
      page.locator(`${FEED} [role=progressbar], ${FEED} .spinner, ${FEED} progress`),
    ).toHaveCount(0)
  })

  test('silent waiting — no marker at any beat that used to open one', async ({ page }) => {
    // The same seven stamps the old "never two open markers at once" test
    // walked. The claim inverted with the mechanism: the ceiling was one, and
    // it is now zero.
    for (const at of ['09:25', '11:30', '14:20', '16:41', '17:31', '20:12', '21:04']) {
      await seek(page, at)
      expect(await page.locator(`${LIST} li.fl-wait, ${FEED} .dots`).count()).toBe(0)
    }
  })

  test('silent waiting — the answer still lands, so the pause reads as a pause', async ({ page }) => {
    // What replaces the marker is nothing, and this is the test that proves
    // "nothing" is a pause and not a break: the paper is quiet across the wait
    // and then the reply arrives on it. Without this, a feed that had stopped
    // dead at 09:25 would satisfy every assertion above.
    await seek(page, '09:25')
    const before = (await domLines(page)).length
    await seek(page, '09:26')
    const after = await domLines(page)
    expect(after.length).toBeGreaterThan(before)
    expect(after.some((l) => l.kind === 'radio')).toBe(true)
  })

  test('silent waiting — deterministic lines land instantly, as they always did', async ({ page }) => {
    await seek(page, '08:52')
    await expect(page.locator(`${LIST} li.fl-wait`)).toHaveCount(0)
    expect((await domLines(page)).length).toBeGreaterThanOrEqual(4)
  })
})

/* ══ [u5#c5] the 17:33 fallback renders, and the day carries on ═══════════ */

test.describe('fallback line', () => {
  test.beforeEach(async ({ page }) => {
    await boot(page)
    // The day does not open until the file is committed — the driver holds the
    // run's own stream until a `deploy` op arrives (spec-client §5.1), so a
    // fanfold read before the press is an empty one by contract.
    await deployFile(page)
    await setRate(page, 0)
  })

  test('fallback line — the forced fallback renders as a ※ feed line', async ({ page }) => {
    await seek(page, '17:35')
    const fallback = page.locator(`${LIST} li.fl-fallback`)
    await expect(fallback).toHaveCount(1)
    await expect(fallback.locator('.fl-c')).toHaveAttribute('data-mark', '※')
    await expect(fallback.locator('.fl-t')).toHaveText('17:33')
  })

  test('fallback line — the engine §5 class rides on the node, the code never on text', async ({ page }) => {
    await seek(page, '17:35')
    const fallback = page.locator(`${LIST} li.fl-fallback`).first()
    const cls = await fallback.getAttribute('data-fallback-class')
    expect(['fatal', 'local', 'supply-cut']).toContain(cls)
    const code = await fallback.getAttribute('data-fallback-code')
    expect((code ?? '').length).toBeGreaterThan(0)
    const text = ((await fallback.locator('.fl-c').textContent()) ?? '').trim()
    expect(text).not.toContain(code ?? ' ')
  })

  test('fallback line — the run continues: later lines still land', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(String(e)))
    await seek(page, '21:04')
    const lines = await domLines(page)
    const at = lines.findIndex((l) => l.kind === 'fallback')
    expect(at).toBeGreaterThanOrEqual(0)
    expect(lines.length - at - 1).toBeGreaterThan(1)
    expect(errors).toEqual([])
  })

  // DELETED (08-09, x6): 'fallback line — the open wait it answers is resolved
  // by it'. It seeked to 17:35 and required no unresolved `.fl-wait` — a claim
  // about a marker that 17:33's fallback took down. With no marker put up in
  // the first place the assertion is vacuously true, and a vacuous check reads
  // like coverage. What the fallback does to the paper is still pinned by the
  // two tests above (it renders as a ※ line, and the day carries on past it),
  // and that no wait is drawn anywhere is `silent waiting`'s beat, not this
  // block's.
})

/* ══ [u5#c6] lines land on the game clock, not on a timer of their own ════ */

test.describe('lines land on the clock', () => {
  test.beforeEach(async ({ page }) => {
    await boot(page)
    // The day does not open until the file is committed — the driver holds the
    // run's own stream until a `deploy` op arrives (spec-client §5.1), so a
    // fanfold read before the press is an empty one by contract.
    await deployFile(page)
  })

  test('lines land on the clock — a paused clock lands nothing', async ({ page }) => {
    await setRate(page, 0)
    // The press opened the day at ×1, so a pause here catches the reveal queue
    // mid-flight: `run-feed.ts` flushes what is queued when the sim stops, and
    // a count taken in that same frame would read short and then grow — which
    // is the very thing this test would report as a line landing on a paused
    // clock. The claim is about what lands AFTER the desk has settled.
    await page.waitForTimeout(500)
    const before = (await domLines(page)).length
    await page.waitForTimeout(2200)
    expect((await domLines(page)).length).toBe(before)
    expect((await frame(page)).rate).toBe(0)
  })

  test('lines land on the clock — nothing renders ahead of the driver clock', async ({ page }) => {
    await setRate(page, 1)
    await page.waitForTimeout(1200)
    await setRate(page, 0)
    const now = mm((await frame(page)).clock)
    const ahead = (await domLines(page))
      .filter((l) => l.stamp)
      .filter((l) => mm(l.stamp!) > now)
      .map((l) => l.stamp)
    expect(ahead).toEqual([])
  })

  test('lines land on the clock — running the clock lands new lines', async ({ page }) => {
    await setRate(page, 0)
    await seek(page, '08:50')
    const before = (await domLines(page)).length
    await setRate(page, 4)
    await expect.poll(async () => (await domLines(page)).length, { timeout: 10_000 }).toBeGreaterThan(before)
    await setRate(page, 0)
  })

  test('lines land on the clock — seeking to 21:04 lands every line exactly once', async ({ page }) => {
    await setRate(page, 0)
    await seek(page, '21:04')
    const stream = await streamLines(page)
    const lines = await domLines(page)

    expect(streamRendered(lines).length).toBe(stream.length)

    const keys = lines.map((l) => `${l.stamp ?? '—'}|${l.text}`)
    const dupes = keys.filter((k, i) => keys.indexOf(k) !== i)
    expect(dupes).toEqual([])
  })

  test('lines land on the clock — the test handle agrees with the DOM', async ({ page }) => {
    await setRate(page, 0)
    await seek(page, '21:04')
    const lines = await domLines(page)
    const handle = await page.evaluate(() => {
      const h = (window as unknown as {
        __feed?: { count(): number; kinds(): string[]; stamps(): string[] }
      }).__feed
      if (!h) throw new Error('window.__feed is not exposed by the LIVE FEED window')
      return { count: h.count(), kinds: h.kinds(), stamps: h.stamps() }
    })
    expect(handle.count).toBe(lines.length)
    expect(handle.kinds).toEqual(lines.map((l) => l.kind))
    expect(handle.stamps.length).toBe(lines.length)
  })

  test('lines land on the clock — a reload lands the backlog once, not twice', async ({ page }) => {
    await setRate(page, 0)
    await seek(page, '12:00')
    const first = (await domLines(page)).length
    await seek(page, '12:00')
    expect((await domLines(page)).length).toBe(first)
  })
})

/* ══ [u5#c7] the feed is untouchable during a run ═════════════════════════ */

test.describe('untouchable during a run', () => {
  test.beforeEach(async ({ page }) => {
    await boot(page)
    // The day does not open until the file is committed — the driver holds the
    // run's own stream until a `deploy` op arrives (spec-client §5.1), so a
    // fanfold read before the press is an empty one by contract.
    await deployFile(page)
    await setRate(page, 0)
    await seek(page, '21:04')
  })

  test('untouchable during a run — no mining surface exists on any line', async ({ page }) => {
    await expect(page.locator(`${LIST} [data-sentence-id]`)).toHaveCount(0)
    await expect(page.locator(`${LIST} .minable`)).toHaveCount(0)
    await expect(page.locator(`${LIST} [onclick]`)).toHaveCount(0)
    await expect(page.locator(`${LIST} button, ${LIST} a, ${LIST} input`)).toHaveCount(0)
  })

  test('untouchable during a run — clicking lines changes neither the store nor the DOM', async ({ page }) => {
    const storeBefore = JSON.stringify((await frame(page)).store)
    const htmlBefore = await page.locator(LIST).innerHTML()

    const lines = page.locator(`${LIST} li`)
    const total = await lines.count()
    for (const i of [1, Math.floor(total / 2), total - 2]) {
      const target = lines.nth(Math.max(0, i))
      if (await target.isVisible()) await target.click({ force: true })
    }

    expect(JSON.stringify((await frame(page)).store)).toBe(storeBefore)
    expect(await page.locator(LIST).innerHTML()).toBe(htmlBefore)
  })

  test('untouchable during a run — the feed follows its tail as lines land', async ({ page }) => {
    await expect
      .poll(
        async () =>
          page.locator(SCROLL).evaluate((n) => {
            const el = n as HTMLElement
            return el.scrollHeight - (el.scrollTop + el.clientHeight)
          }),
        { timeout: 5_000 },
      )
      .toBeLessThanOrEqual(2)
  })

  test('untouchable during a run — the window body scrolls, the page does not', async ({ page }) => {
    const overflow = await page.evaluate(() => ({
      x: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      y: document.documentElement.scrollHeight - document.documentElement.clientHeight,
    }))
    expect(overflow.x).toBeLessThanOrEqual(0)
    expect(overflow.y).toBeLessThanOrEqual(0)
  })
})

/* ══ U5.4 — the citation mark ════════════════════════════════════════════ */

test.describe('[U5.4] the agent line names the slots that moved it', () => {
  test('[U5.4] (a) a cited radio line carries the slot mark, an uncited one does not', async ({ page }) => {
    await boot(page)
    await deployFile(page)
    // Release the day up to the fixture's cited line (09:26).
    await page.evaluate(() => {
      const handle = (window as unknown as { __feed?: { seek(at: string): void } }).__feed
      if (!handle) throw new Error('window.__feed is not exposed by the LIVE FEED window')
      handle.seek('09:30')
    })

    const cites = page.locator(`${LIST} li.fl-radio .fl-cite`)
    await expect(cites.first()).toHaveText('인수인계 02')

    // The 08:51 radio line cites nothing and must carry no mark — the mark is
    // absent, not empty.
    const firstRadio = page.locator(`${LIST} li.fl-radio`).first()
    await expect(firstRadio.locator('.fl-cite')).toHaveCount(0)

    // It is a readout, not a control: no membrane op rides it.
    await expect(page.locator(`${LIST} .fl-cite[data-op]`)).toHaveCount(0)
  })
})

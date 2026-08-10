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
// x11 — THE PAPER IS TYPED NOW, AND IT NO LONGER DUMPS (민서, 08-10). Two
// changes run underneath this whole file:
//
//  * a line's content column `.fl-c` fills character by character, and carries
//    `aria-hidden="true"` so a `role="log"` does not re-announce the line once
//    per keystroke. A new sr-only sibling `.fl-sr` holds the COMPLETE text and
//    lands in one go, so a reader hears each line exactly once. Any read of a
//    line's text therefore has to name which of the two columns it means —
//    reading the `<li>` reads both and double-counts (see `domLines`).
//  * the day's end no longer flushes. `run_end` used to dump the whole reveal
//    queue in one frame; it now drains at reading pace and the ending veil waits
//    for it (`shell/feed-drain.ts`, `shell/ending.ts`). So "the stream is fully
//    released" and "the paper has finished printing" are two different moments,
//    and a test that wants the settled paper says so — see `flushFeed`.
//
// The two handles this suite drives:
//   • `window.__shell` — u3's: `{ frame(), drain() }`, the driver undecorated.
//   • `window.__feed`  — u5's: `{ seek(at), rate(r), flush(), count(), kinds(),
//     stamps() }`. ×1 is ~77 s of real time for the whole day, so `seek` is the
//     only way to reach 21:04 inside an e2e budget (design D13).
//
// C3: no synthetic fixture literal is asserted. The Korean strings that appear
// are the *client's own* component states (`(변화 없음)`) and the reference
// marks, not run content. The wait phrasings used to be on that list; x6 took
// them off it by taking them out of the client.
import { expect, test } from 'playwright/test'
import type { Page } from 'playwright/test'
import { deployFile, flushFeed } from './fixtures/harness.ts'

const FEED = '#w-feed'
const LIST = '#w-feed #feedList'
const SCROLL = '#w-feed #feedScroll'

/** The reference marks (app.js:405) as they must reach `.fl-c[data-mark]`. */
const MARKS: Record<string, string> = {
  event: '▸',
  radio: '◈',
  npc: '—',
  symptom: '·',
  wait: '',
  fallback: '※',
  mark: '',
}

/**
 * Kinds the seam carries that the fanfold does NOT print, so a stream/DOM
 * comparison has to subtract them before it can mean anything.
 *
 * `wait` since x6 (the waiting marker was removed outright) and `symptom` since
 * x8 (민서, 08-10) — both are dropped in `run-feed.ts`'s `appendLine`, before a
 * node is ever built. Neither is gone from the engine: symptoms are still the
 * delta journal and still reach Call 2 as `SCENE_SYMPTOMS`.
 *
 * `(변화 없음)` used to be named here too, as the copy a symptom-free beat
 * printed. Nothing mints it any longer.
 */
const UNDRAWN_KINDS = ['wait', 'symptom']

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
  /** The TYPED column `.fl-c` — what the paper shows. Partial mid-reveal. */
  text: string
  /** x11 — the sr-only column `.fl-sr`: the complete text, landed at once. */
  announced: string
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

/**
 * The released lines the fanfold is supposed to PRINT — `streamLines` minus the
 * kinds the client drops. This is the side of a stream/DOM comparison that has
 * to move when a kind stops being drawn; `streamRendered` below is the other.
 */
async function drawnStreamLines(page: Page): Promise<StreamLine[]> {
  return (await streamLines(page)).filter((l) => !UNDRAWN_KINDS.includes(l.kind))
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

/**
 * x11 — settle the paper (민서, 08-10). Applies everything still queued AND
 * finishes the line being typed, so the read after it sees complete text.
 *
 * `seek` already ends with this call (`windows/live-feed.ts`), which is why the
 * seeking blocks below need no extra settle; what needs one is any lane that
 * released the stream WITHOUT seeking — the day's own close, since `run_end`
 * stopped dumping the queue. Calling it is not a way of dodging the reveal: the
 * reveal's own pacing is asserted by `the day’s end drains` at the foot of this
 * file, on purpose and in exactly one place, so every other test here can be
 * about what the paper SAYS rather than about when it got there.
 *
 * The helper itself is `flushFeed` from `./fixtures/harness.ts`. It was three
 * identical copies in three specs on the day the reveal became a typewriter;
 * x11 folded it in, because a helper copied three times is three places for the
 * next change to miss.
 */
/**
 * x11 — `text` is the TYPED column and nothing else (민서, 08-10).
 *
 * It was already `.fl-c` and stays there, which is now a decision rather than a
 * convenience: `li.textContent` would concatenate the stamp, the half-typed
 * column and the sr-only copy of the same sentence, so every `includes` in this
 * file would go on passing while measuring a string no surface ever shows.
 * `announced` carries the sr-only column beside it so a caller can compare the
 * two — which is the only honest way to check a line's text as such.
 */
async function domLines(page: Page): Promise<DomLine[]> {
  return page.locator(`${LIST} li`).evaluateAll((nodes) =>
    nodes.map((n) => {
      const li = n as HTMLElement
      const kind = (li.className.match(/\bfl-([a-z]+)\b/) ?? [, ''])[1] ?? ''
      const stampNode = li.querySelector('.fl-t')
      const content = li.querySelector('.fl-c')
      const spoken = li.querySelector('.fl-sr')
      return {
        kind,
        stamp: stampNode ? (stampNode.textContent ?? '').trim() : null,
        mark: content ? content.getAttribute('data-mark') : null,
        text: (content?.textContent ?? '').trim(),
        announced: (spoken?.textContent ?? '').trim(),
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
 *
 * x8 — the `!l.empty` clause went with the `(변화 없음)` line, the only node
 * that ever carried `data-empty` (민서, 08-10). The client mints exactly one
 * kind of line of its own now, and this filter names it.
 */
const streamRendered = (lines: DomLine[]): DomLine[] =>
  lines.filter((l) => !l.text.startsWith('집계. '))

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
    // x11 — SETTLED BEFORE IT IS READ (민서, 08-10). The `<li>` is attached the
    // instant the line lands, and since the reveal became a typewriter its
    // content column is empty in that same frame and fills over the next second
    // or so. Comparing it to the stream's text there compares a prefix, and the
    // failure would read as "the press printed the wrong line" — which is not
    // what would have happened. The claim is about WHICH line opens the day, so
    // the paper is allowed to finish the sentence before it is asked.
    await flushFeed(page)
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
    const stream = await drawnStreamLines(page)
    expect(stream.length).toBeGreaterThan(30)

    const rendered = streamRendered(await domLines(page))
    expect(rendered.map((l) => l.kind)).toEqual(stream.map((l) => l.kind))
    expect(rendered.filter((l) => l.kind !== 'mark').map((l) => l.stamp)).toEqual(
      stream.filter((l) => l.kind !== 'mark').map((l) => l.clock),
    )
  })

  test('round renders in order — each line shows the engine text verbatim', async ({ page }) => {
    const stream = await drawnStreamLines(page)
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

  // x8 — the §7 #2 cap is counted on the STREAM now (민서, 08-10). It was read
  // off the DOM, which is no longer possible and, worse, would still pass:
  // a paper with zero symptom lines never exceeds three. The cap governs what
  // the engine renders into `SCENE_SYMPTOMS` for Call 2, and that is where it
  // is still real, so that is where it is measured.
  test('round renders in order — no beat produces more than three symptom lines', async ({ page }) => {
    const lines = await streamLines(page)
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

  // x8 — this was 'a symptom-free beat renders the empty state', and it held the
  // `(변화 없음)` line: a beat that moved nothing still printed one, so the
  // player was told the beat had closed. The line is gone with the whole symptom
  // channel, and what remains to hold is the negative — that the channel really
  // is shut at the DOM, and that it is shut against symptoms that are genuinely
  // being produced. Without the second half this would pass on a broken feed.
  test('round renders in order — the symptom channel is closed at the paper', async ({ page }) => {
    const produced = (await streamLines(page)).filter((l) => l.kind === 'symptom')
    expect(produced.length, 'the round produced no symptom — the assert is vacuous').toBeGreaterThan(0)

    const lines = await domLines(page)
    expect(lines.filter((l) => l.kind === 'symptom')).toEqual([])
    expect(lines.filter((l) => l.text.includes('(변화 없음)'))).toEqual([])
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
    // x8 — derived, not the bare `>= 4` this used to carry. That number was
    // read off the fixture when a symptom line was among the four; dropping the
    // symptom channel made it three, and a hand-lowered constant would have
    // hidden the next such change instead of catching it. What the test means
    // is that everything the driver has RELEASED and the client DRAWS is
    // already on the paper — so it asks exactly that.
    const drawn = await drawnStreamLines(page)
    expect(drawn.length, 'nothing had been released by 08:52 — the assert is vacuous').toBeGreaterThan(0)
    expect(streamRendered(await domLines(page)).length).toBe(drawn.length)
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

    // x11 — BOTH COLUMNS, and no `??` default (민서, 08-10).
    //
    // The claim is that the operator is never shown the engine's error code, and
    // since the reveal became a typewriter there are two surfaces that could
    // show it: `.fl-c`, which is what the paper prints, and the sr-only `.fl-sr`
    // beside it, which is what a reader hears. Scoping to `.fl-c` alone would
    // leave the announced half of the line unchecked from the day it exists —
    // the code could reach the operator through the one channel this suite
    // could not see.
    //
    // The default that used to sit here was a literal NUL byte, rendered as a
    // space by anything that prints the file. It made the whole spec `data` to
    // file(1), which makes plain `grep` skip it SILENTLY with no match and no
    // warning, and it was a vacuous assertion besides: nothing contains a NUL,
    // so a missing `data-fallback-code` would have turned this line into a no-op
    // instead of a failure. The attribute is asserted non-empty one line above,
    // so the guard reads it as the non-null it has just been proved to be.
    const printed = ((await fallback.locator('.fl-c').textContent()) ?? '').trim()
    const spoken = ((await fallback.locator('.fl-sr').textContent()) ?? '').trim()
    expect(printed, 'the fallback code was printed on the paper').not.toContain(code!)
    expect(spoken, 'the fallback code was announced to the reader').not.toContain(code!)
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
    const stream = await drawnStreamLines(page)
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
    // x11 — the beforeEach seeks to 21:04, and `seek` settles the typewriter as
    // well as the queue (`windows/live-feed.ts`), so the `innerHTML` taken here
    // is of a paper that has stopped writing itself. Without that it would be a
    // snapshot of a line mid-word, and the compare below would report the
    // typewriter as "a click changed the DOM" — a false accusation against the
    // one claim [u5#c7] actually makes.
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

/* ══ x11 — the two columns of a line (민서, 08-10) ═════════════════════════
   ADDED with the typewriter. The reveal became character-by-character, which
   put a `role="log"` in an impossible position: a live region with
   `aria-relevant="additions"` announces what is added, and a column that grows
   one character at a time is one addition per character. A reader got the line
   spelled to them.

   So the line has two columns now. `.fl-c` is the paper — typed, and
   `aria-hidden="true"` so the log never sees it grow — and `.fl-sr` is an
   sr-only sibling holding the complete text, appended once. Neither is
   redundant and neither is decoration: the operator reads one and hears the
   other, and this block is what keeps them saying the same thing.

   It exists because every OTHER text assertion in this file reads `.fl-c`
   alone. That is right — those are claims about the paper — but it means the
   announced column has no reader anywhere in the suite, and an `.fl-sr` that
   silently emptied, doubled, or fell behind its own line would break nothing.
                                                                              */

test.describe('the line’s two columns', () => {
  test.beforeEach(async ({ page }) => {
    await boot(page)
    await deployFile(page)
    await setRate(page, 0)
    await seek(page, '21:04')
  })

  test('the line’s two columns — the typed one is hidden from the log, the announced one is not', async ({
    page,
  }) => {
    const shape = await page.locator(`${LIST} li`).evaluateAll((nodes) =>
      nodes.map((n) => {
        const li = n as HTMLElement
        const typed = li.querySelectorAll('.fl-c')
        const spoken = li.querySelectorAll('.fl-sr')
        return {
          where: li.className,
          typed: typed.length,
          spoken: spoken.length,
          typedHidden: typed[0]?.getAttribute('aria-hidden') ?? null,
          spokenHidden: spoken[0]?.getAttribute('aria-hidden') ?? null,
        }
      }),
    )
    expect(shape.length, 'the day printed nothing — the whole block is vacuous').toBeGreaterThan(0)

    for (const line of shape) {
      expect(line.typed, `${line.where} does not have exactly one content column`).toBe(1)
      expect(line.spoken, `${line.where} has no sr-only twin — a reader never hears it`).toBe(1)
      expect(
        line.typedHidden,
        `${line.where}: the typed column is in the log, so it is announced per keystroke`,
      ).toBe('true')
      expect(
        line.spokenHidden,
        `${line.where}: the announced column is itself hidden — the line is silent`,
      ).not.toBe('true')
    }

    // The log's own attributes are unchanged and are half of why the split was
    // needed at all: additions-only is what turns a growing node into a stream
    // of announcements.
    await expect(page.locator(LIST)).toHaveAttribute('role', 'log')
    await expect(page.locator(LIST)).toHaveAttribute('aria-relevant', 'additions')
  })

  test('the line’s two columns — what is announced is the engine text, in stream order', async ({
    page,
  }) => {
    // Derived from the stream, exactly as `round renders in order — each line
    // shows the engine text verbatim` derives the PAPER's side. Same run, same
    // index, same expectation: the two columns are two printings of one line, so
    // anything true of one at index i has to be true of the other at index i.
    const stream = await drawnStreamLines(page)
    expect(stream.length, 'the day released nothing — the compare is vacuous').toBeGreaterThan(0)

    const rendered = streamRendered(await domLines(page))
    for (let i = 0; i < stream.length; i += 1) {
      expect(rendered[i]?.announced, `line ${i} announces nothing at all`).not.toBe('')
      expect(rendered[i]?.announced).toContain(stream[i]!.text)
      if (stream[i]!.speaker) expect(rendered[i]?.announced).toContain(stream[i]!.speaker!)
    }
  })
})

/* ══ x11 — the day ends by draining, not by dumping (민서, 08-10) ══════════
   ADDED as the replacement for a claim that used to be carried in a COMMENT
   and is now false. `e2e/acceptance.spec.ts` #6 reasoned, in prose, that
   "seeking to the terminal minute ends the run, so every queued line lands
   whole in the same turn as the drain above" — true while `run-feed.ts` flushed
   its whole queue on `run_end`, and the reason the chrome's clock could be read
   in the frame after a drain. The dump is gone: the fanfold now drains at
   reading pace after the clock ends and `shell/ending.ts` waits for it
   (`shell/feed-drain.ts`).

   A behaviour that only one comment described was a behaviour nothing was
   holding. This is the assertion that behaviour should have had, and it is
   written from the outside — no handle is asked what it owes, the paper is
   simply watched to see whether it arrived all at once.                       */

test.describe('the day’s end drains', () => {
  test('the day’s end drains — the close does not dump the queue, and the paper catches up on its own', async ({
    page,
  }) => {
    test.setTimeout(180_000)
    await boot(page)
    // The press opens the day at ×1 and leaves it running, which is the premise
    // of the whole test: a PAUSED desk is flushed by the feed's settle watchdog
    // by design (lines queued against a clock that never runs again would be
    // stranded), so a drain at rate 0 would legitimately dump and this would be
    // measuring the wrong mechanism.
    await deployFile(page)
    expect((await frame(page)).rate, 'the day did not open running — the drain would flush').toBeGreaterThan(0)

    // Release the WHOLE remaining stream in one call. `driver.drain()` emits
    // every event synchronously — `run_end` included — so if the reveal queue
    // still dumped on close, the paper would be complete in the very next frame.
    await page.evaluate(() => {
      const h = (window as unknown as { __shell?: { drain(): void } }).__shell
      if (!h) throw new Error('window.__shell is not exposed by the shell boot')
      h.drain()
    })

    const drawn = await drawnStreamLines(page)
    expect(drawn.length, 'the drain released nothing to print').toBeGreaterThan(30)
    const straightAfter = streamRendered(await domLines(page)).length
    expect(
      straightAfter,
      'the day dumped its queue: the whole stream was on the paper in the frame it closed',
    ).toBeLessThan(drawn.length)

    // …and it is a drain and not a stall: the paper finishes on its own, with no
    // flush, no seek and nothing else touching it. The budget is generous on
    // purpose — the reveal is priced in reading time and the crowd divisor that
    // used to halve it on the busiest beats is gone (that was the point), so the
    // tail of a seven-round day is minutes of real paper, not seconds.
    await expect
      .poll(async () => streamRendered(await domLines(page)).length, { timeout: 150_000 })
      .toBe(drawn.length)
  })
})

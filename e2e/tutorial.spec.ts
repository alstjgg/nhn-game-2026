// [x3] the onboarding walk — `shell/tutorial.ts` + `shell/coach.ts`.
//
// THE ONE LANE THAT ASKS FOR IT. `tutorialSkipped` is true under
// `navigator.webdriver`, which is every other spec in this directory: a walk
// that dims the desk and scrolls the AGENT FILE under a plate would turn those
// suites into a coin toss. This file opts in by name, `?tutorial=show`, and the
// first three tests are the ones that prove the opt-out is real.
//
// WHAT IS ASSERTED. The ORDER of the eight plates, the LINE each one prints,
// and what brings each one down — which is the whole of the walk's behaviour
// now that the mark carries copy. The copy is the point of the rewrite: a plate
// on the right target saying the wrong sentence is precisely the failure this
// suite exists to catch, so every step asserts its text and not merely that
// something appeared.
//
// AND THE ONE THING NO SOURCE GUARD CAN PROVE. The scrim must not swallow the
// press it is pointing at. Most plates come down when the operator DOES the
// thing the mark names, so a layer that ate that click would deadlock its own
// walk — and `pointer-events:none` in a stylesheet is a declaration, while a
// click landing on the control underneath is a fact. (f) and (g) below are that
// fact, in a browser.
//
// WHERE THE WALK STARTS (x8). The first plate is the LIVE FEED and it does not
// appear until the day is running, so the build phase — the file, its page turn,
// the press that commits it — is unnarrated. Three plates used to live there and
// (e) is the assertion of their ABSENCE, which is the only kind that proves a cut
// landed. Every test that needs a later plate therefore has to DRIVE the desk to
// the first one; `walkTo` does that.
//
// Timings are asserted as CEILINGS on a wait, never as equalities: the walk is
// decoration and a CI box under load must not turn a slow frame into a red
// build. Nothing here waits a fixed number of milliseconds for a plate — the
// old walk's eight-second hold is gone and plates advance on presses.
import { expect, test } from 'playwright/test'
import type { Locator, Page } from 'playwright/test'
import { confirmDeploy, drain, settled, tallyPhase } from './fixtures/harness.ts'

const WALK = './?tutorial=show'

/* The layer, and the plate's three moving parts. */
const LAYER = '#coach'
const PLATE = '.coach-plate'
const SAYS = '#coachSays'
const OK = '.coach-ok'
const SKIP = '.coach-skip'
/** The hole's own edge, and the line from the plate to it. */
const EDGE = '.coach-edge'
const LEAD = '.coach-lead'

/* What each plate points at — the same eight targets `tutorial.ts` names. */
const DEPLOY = '#btnDeploy'
/* NOT a target any more, and kept because the suite still has to DRIVE it: x8
   took the build phase out of the walk, so the page turn and the first commit
   are things this spec performs to reach the first plate rather than things the
   walk talks about. */
const PAGE_NEXT = '#w-file .pg-nav .pg-next'
const FEED_WIN = '#w-feed'
const REP_WIN = '#w-rep'
const FACTS_HEAD = '#w-rep .doc-facts .doc-hd h3'
const BODY_HEAD = '#w-rep .doc-body .doc-hd h3'
const FIRST_BODY = '#w-rep .doc-body [data-sentence-id]'
const HANDOVER = '#w-file [data-sect="handover"]'
const UNSET = '#w-file .slot-unset'

/**
 * The eight lines, in order, verbatim from `shell/tutorial.ts`.
 *
 * Duplicated here ON PURPOSE rather than imported. A spec that read the copy out
 * of the module it is testing would pass whatever the module said, including a
 * typo — the whole value of this list is that it was typed out separately from
 * the thing it checks, so the two have to be made to agree by hand.
 */
const SAID = [
  '라이브 피드에서 현장 상황을 확인하세요',
  '요원의 보고를 확인하세요',
  '객관적 사실이 기록됩니다',
  '요원의 생각과 판단이 기록됩니다',
  '기록에서 주요 정보를 추출하세요',
  '주요 정보가 다음 요원 인수인계 사항으로 넘겨집니다',
  '인수인계를 해제할 수 있습니다',
  '인수 인계를 완료한 뒤 요원을 파견하세요',
] as const

/** How long any one plate may take to arrive. Generous: a gate may wait on a day. */
const PLATE_MS = 30_000
/** …and the gates that wait for the simulation to produce something. */
const DAY_MS = 60_000

test.use({ viewport: { width: 1280, height: 800 } })

/* ══ helpers ═════════════════════════════════════════════════════════════ */

/** Boots with the walk asked for, and waits for the desk to be uncovered. */
async function atTheDesk(page: Page, url = WALK): Promise<void> {
  await page.goto(url)
  await page.waitForFunction(() => Boolean((window as { __shell?: unknown }).__shell))
  await settled(page)
}

/** The line the plate that is up is printing. */
function says(page: Page): Locator {
  return page.locator(SAYS)
}

/** Waits for the plate printing `line` — the walk having reached that step. */
async function plate(page: Page, line: string, timeout = PLATE_MS): Promise<void> {
  await expect(says(page), `the walk never reached the plate saying “${line}”`).toHaveText(line, {
    timeout,
  })
}

/**
 * Closes the plate that is up with 확인했습니다 and waits for the next line.
 *
 * Waits on the NEXT line rather than on the plate's disappearance: the layer
 * rebuilds the plate per mark, so "gone then present" is a state the two frames
 * either side of an advance both fail to see reliably. The line is the identity.
 */
async function acknowledge(page: Page, next: string, timeout = PLATE_MS): Promise<void> {
  await page.locator(OK).click()
  await plate(page, next, timeout)
}

/**
 * Commits the file and gets the day running.
 *
 * The 배치 확인 plate is still in the way and the walk deliberately puts NO
 * plate on it (민서's call: no popup on the modal, and plate 3 is not re-shown
 * if it is cancelled). So this is the ordinary commit, unchanged by the walk.
 */
async function commit(page: Page): Promise<void> {
  await page.locator(DEPLOY).click()
  await confirmDeploy(page)
}

/**
 * Drives the desk to the first plate, then walks to `line`.
 *
 * x8 — REACHING plate 1 is now work. The walk says nothing during the build
 * phase, so the page turn and the commit are performed here rather than being
 * released by a plate: the AGENT FILE's own opening is what teaches them, and
 * this spec is standing in for an operator who has read it.
 */
async function walkTo(page: Page, line: string): Promise<void> {
  const stop = SAID.indexOf(line as (typeof SAID)[number])
  expect(stop, `“${line}” is not one of the eight plates`).toBeGreaterThanOrEqual(0)

  // Nothing is on screen yet — assert that, because it is the whole of x8.
  await expect(page.locator(PLATE), 'a plate was up before the day started').toHaveCount(0)
  await page.locator(PAGE_NEXT).click()
  await commit(page)
  await plate(page, SAID[0]!, DAY_MS)

  for (let at = 0; at < stop; at += 1) {
    if (at === 0) {
      // 1 → 2: the day has to be over with both documents filed, and the FIXTURE
      // day files its one report at ~78 s — measured, not guessed: the demo run
      // reports once, near the close, where a live day files seven across the
      // shift. So the rest of the day is RELEASED here rather than waited out.
      //
      // Sound because every gate in this walk latches: the report and the
      // `run_end` both land while plate 1 is still up, and the walk then steps
      // through 2, 3 and 4 in order exactly as it would have if the day had run
      // its length. (h) is the test that proves the gates themselves hold shut
      // and (m) the one that proves nothing appears mid-day; every other test
      // only needs to get PAST them, and paying 80 real seconds each to do it
      // would put minutes of sleep in this file.
      await drain(page)
      await acknowledge(page, SAID[1]!, DAY_MS)
      continue
    }
    if (at === 4) {
      // 5 → 6: something must be SEATED in 인수인계 사항. A mine seats it (W3 —
      // one gesture mines and seats), and the gate reads the seat rather than
      // the click, so this has to be a mine that actually lands.
      await page.locator(FIRST_BODY).first().click()
      await plate(page, SAID[5]!)
      continue
    }
    await acknowledge(page, SAID[at + 1]!)
  }
}

/* ══ who gets it ═════════════════════════════════════════════════════════ */

test.describe('[x3] the walk is opt-in for every lane but its own', () => {
  test('[x3] (a) the e2e lane gets no walk at all', async ({ page }) => {
    await atTheDesk(page, './')
    // Long enough that plate 1 would be up and visible if it were running.
    await page.waitForTimeout(1_500)
    await expect(page.locator(PLATE)).toHaveCount(0)
    // The layer itself must not even be mounted — `installTutorial` returns
    // before it builds anything.
    await expect(page.locator(LAYER)).toHaveCount(0)
  })

  test('[x3] (b) ?tutorial=skip refuses it even when asked for the desk', async ({ page }) => {
    await atTheDesk(page, './?tutorial=skip')
    await page.waitForTimeout(1_500)
    await expect(page.locator(PLATE)).toHaveCount(0)
    await expect(page.locator(LAYER)).toHaveCount(0)
  })

  test('[x3] (c) ?tutorial=show turns it on — but not until the day is running', async ({ page }) => {
    await atTheDesk(page)
    // x8 — the layer is MOUNTED and empty. That pair is the whole of the change:
    // the walk is armed and watching, and the build phase is its own.
    await expect(page.locator(LAYER)).toHaveCount(1)
    await expect(page.locator(PLATE)).toHaveCount(0)
    await page.waitForTimeout(1_500)
    await expect(page.locator(PLATE), 'a plate appeared during the build phase').toHaveCount(0)

    // …and it speaks the moment the day does.
    await page.locator(PAGE_NEXT).click()
    await commit(page)
    await expect(page.locator(PLATE)).toBeVisible({ timeout: DAY_MS })
    await expect(says(page)).toHaveText(SAID[0]!)
  })
})

/* ══ the plates, in order ════════════════════════════════════════════════ */

test.describe('[x3] the walk says what the operator needs next', () => {
  test.setTimeout(240_000)

  test('[x3] (d) the desk is uncovered BEFORE the first plate lands', async ({ page }) => {
    // The regression this pins, carried over from the walk this replaces: the
    // old mark's pulse was an INFINITE animation, and `revealDesk` awaits every
    // animation on a window — including one that never finishes. The desk stayed
    // at `visibility:hidden` for the whole of step 1. A plate over a desk nobody
    // can see is not a plate.
    //
    // x8 moved the first plate past the commit, so the two no longer race and the
    // ORDER is trivially satisfied. What is still worth pinning is the property
    // underneath it: the curtain comes up on its own, without the walk having said
    // anything, and the desk is fully operable when it does — an operator has to
    // be able to turn the page and commit the file with no plate to guide them.
    await page.goto(WALK)
    await expect(page.locator('body')).not.toHaveClass(/\bbooting\b/, { timeout: 20_000 })
    await expect(page.locator(PLATE)).toHaveCount(0)
    await expect(page.locator(PAGE_NEXT)).toBeVisible()
    await page.locator(PAGE_NEXT).click()
    await expect(page.locator(DEPLOY)).toBeAttached()
  })

  test('[x3] (e) the build phase is unnarrated, and the modal is unmarked', async ({ page }) => {
    // x8 — three plates used to live here: the file's head line, the page
    // control, and the commit. This is what replaced them, and it is an assertion
    // of ABSENCE, which is the only kind that can prove a cut actually landed.
    await atTheDesk(page)
    await expect(page.locator(PLATE)).toHaveCount(0)

    await page.locator(PAGE_NEXT).click()
    await expect(page.locator(PLATE), 'a plate followed the page turn').toHaveCount(0)

    // `#btnDeploy` sits under the fold of `.file-sheet` on first paint, and with
    // no plate to scroll it into view the operator now reaches it themselves —
    // so it has to be reachable without one.
    await page.locator(DEPLOY).click()
    // The 배치 확인 plate is up, and the walk puts NO plate on it: the coach layer
    // must never be the thing on top of the irreversible question.
    await expect(page.locator('#confirmYes')).toBeVisible({ timeout: 10_000 })
    await expect(page.locator(PLATE)).toHaveCount(0)

    await confirmDeploy(page)
    // …and the first thing it ever says is the LIVE FEED.
    await plate(page, SAID[0]!, DAY_MS)
    await expect(page.locator(FEED_WIN)).toBeVisible()
    // The hole is cut and the leader drawn: an empty `d` on either is a plate
    // pointing at nothing, which is the centred fallback for an unresolved target.
    await expect(page.locator(EDGE)).not.toHaveAttribute('d', '')
    await expect(page.locator(LEAD)).not.toHaveAttribute('d', '')
  })

  test('[x3] (f) the plate does not swallow the press it points at', async ({ page }) => {
    // THE load-bearing property of the whole design, re-aimed by x8 onto the
    // earliest plate that still ends on a press. It used to be proved on the page
    // turn; the walk no longer has a plate there, so it is proved on the MINE —
    // plate 5 sits beside a sentence in 무전 기록 and comes down when that
    // sentence is clicked, which is a click on a thing under the scrim.
    await atTheDesk(page)
    await walkTo(page, SAID[4]!)
    await expect(says(page)).toHaveText(SAID[4]!)

    // The press lands THROUGH the layer, with no force and no JS dispatch —
    // Playwright's default click does a real hit test, so a scrim in the way
    // would fail this outright rather than quietly passing.
    await page.locator(FIRST_BODY).first().click()

    // …and both halves happened: the sentence really seated, and the plate let go
    // of it rather than having to be acknowledged.
    await expect(page.locator(UNSET)).toHaveCount(1)
    await plate(page, SAID[5]!)
  })

  test('[x3] (g) 해제 is pressable under its own plate too', async ({ page }) => {
    // The second press-released plate, and the one whose control the operator has
    // no other reason to touch — so if the scrim ate this one nothing else on the
    // desk would reveal it.
    await atTheDesk(page)
    await walkTo(page, SAID[6]!)
    await expect(page.locator(UNSET)).toBeVisible()
    await page.locator(UNSET).click()
    await expect(page.locator(UNSET), 'the seat survived its own 해제').toHaveCount(0)
    await plate(page, SAID[7]!)
  })

  test('[x3] (h) 1 → 4 — the gates hold shut until the day has produced something', async ({ page }) => {
    // THE gate test. Every other test drains past these two gates; this one
    // proves they were shut, which is the claim that matters: a plate saying
    // 객관적 사실이 기록됩니다 over an empty 현장 기록 column says the opposite of
    // what it means, and a plate about REPORTS before any report exists points
    // at a blank window.
    await atTheDesk(page)
    await walkTo(page, SAID[0]!)
    await expect(page.locator(FEED_WIN)).toBeVisible()

    // The day is seconds old and has filed nothing. Acknowledging plate 1 must
    // therefore leave NO plate on the desk — plates 2 and 3 are both waiting.
    // Asserted as a COUNT and not as "not that text": the layer rebuilds the
    // plate per mark, so in the gap there is no `#coachSays` to have text at all.
    // The 현장 기록 HEADING is built at boot and is always on the page — it is
    // the document's furniture, and plate 3 points at it precisely because it is
    // stable. What is empty this early is the column UNDER it, which is the thing
    // the gate is protecting the copy from.
    await expect(page.locator(`${REP_WIN} .doc-facts [data-sentence-id]`)).toHaveCount(0)
    await page.locator(OK).click()
    await expect(page.locator(PLATE)).toHaveCount(0)
    // Still nothing a beat later — this is the assertion that would fail if a
    // gate were merely slow rather than actually closed.
    await page.waitForTimeout(2_000)
    await expect(page.locator(PLATE)).toHaveCount(0)

    // Now give the day its report and its close. Both gates open, and the walk
    // catches up in order.
    await drain(page)
    await plate(page, SAID[1]!, DAY_MS)
    await expect(page.locator(REP_WIN)).toBeVisible()

    // 3 — the record is on the page by the time its plate names it.
    await acknowledge(page, SAID[2]!, DAY_MS)
    await expect(page.locator(FACTS_HEAD)).toBeVisible()

    // 4 — the other document. The difference between the two is the lesson.
    await acknowledge(page, SAID[3]!)
    await expect(page.locator(BODY_HEAD)).toBeVisible()

    // NOT asserted, and deliberately: that plate 3 waits specifically for
    // `run_end` as distinct from the report. The fixture day files its one
    // report ~4 s before it closes, so the two gates cannot be told apart in
    // this lane without a wait so tight it would flake. What is proved above is
    // that BOTH were shut while the day had produced nothing, which is the
    // property that protects the copy.
  })

  test('[x3] (i) 5 → 6 — the gate is a SEATED sentence, not a click', async ({ page }) => {
    await atTheDesk(page)
    await walkTo(page, SAID[4]!)
    await expect(page.locator(FIRST_BODY).first()).toBeVisible()

    // Nothing is in the file yet, so plate 6 cannot be up.
    await expect(page.locator(UNSET)).toHaveCount(0)
    await expect(says(page)).toHaveText(SAID[4]!)

    // The mine seats the sentence (W3 — one gesture mines AND seats), which is
    // what opens the gate. This is why the walk reads the seat and not the
    // press: a click on a sentence while the file is LOCKED is refused and
    // seats nothing, and gating on the click would raise plate 6 over an empty
    // 인수인계 사항.
    await page.locator(FIRST_BODY).first().click()
    await plate(page, SAID[5]!)
    await expect(page.locator(HANDOVER)).toBeVisible()
    await expect(page.locator(UNSET)).toHaveCount(1)
  })

  test('[x3] (j) 7 → 8 — 해제, then the press that closes the walk', async ({ page }) => {
    await atTheDesk(page)
    await walkTo(page, SAID[6]!)
    await expect(page.locator(UNSET)).toBeVisible()

    // 7 lets go on 해제 itself — another press that has to land through the
    // layer, and one the operator has no other reason to make.
    await page.locator(UNSET).click()
    await plate(page, SAID[7]!)

    // 8 is the last thing the walk has to say. Acknowledging it ends the walk,
    // and the layer must go with it: a scrim left dimming a desk nobody can
    // lift is worse than no walk at all.
    await page.locator(OK).click()
    await expect(page.locator(PLATE)).toHaveCount(0)
    await expect(page.locator(LAYER)).toHaveCount(0)
  })

  test('[x3] (m) NOTHING interrupts the day — the walk is silent while the sim runs', async ({ page }) => {
    // 민서's rule, 08-09, and the reason plates 2–5 were moved off the day's
    // first `report` and onto its close: while the simulation is running the
    // operator is reading the LIVE FEED, and the walk does not talk over it.
    //
    // The plate that USED to break this is the REPORTS one. A live day files
    // seven reports across the shift, so gating on the first of them raised a
    // plate and dimmed the desk mid-day — one plate after having told the
    // operator to watch the feed.
    await atTheDesk(page)
    await walkTo(page, SAID[0]!)
    // The operator reads the LIVE FEED plate, dismisses it, and settles in.
    await page.locator(OK).click()
    await expect(page.locator(PLATE)).toHaveCount(0)

    // Now run the day forward on the SIM clock rather than the wall clock, in
    // steps, and stop as soon as it has filed a report. `__shell.clock.advance`
    // drains the stream once the clock ends, so the loop has to stop short of
    // 21:04 for this to be a mid-day measurement at all. The fixture's report
    // lands ~4.6 s of real time before the close, so a 2 s step cannot straddle
    // both events — it is guaranteed to land inside that window.
    // WATCHED, not sampled. Polling for a mid-day moment is a race here: the
    // fixture files its one report a few seconds before 21:04, so a sampling loop
    // can step straight over the window it is trying to measure. An observer
    // inside the page cannot miss it — and it proves the stronger claim anyway,
    // which is that no plate was mounted at ANY point while the run was live,
    // rather than that none was up at one sampled instant.
    //
    // The run's own phase is the guard on the recorder, read from the AGENT
    // FILE's dev handle: `'tally'` is the day being over, so a plate seen while
    // the phase is anything else is the walk talking over the simulation. That
    // also removes the race at the other end — plate 5 is SUPPOSED to arrive
    // once the phase turns, and it must not be recorded as a violation.
    await page.evaluate(() => {
      const w = window as unknown as {
        __sawPlate?: boolean
        __plateObs?: MutationObserver
        __agentFile?: { phase(): string }
      }
      w.__sawPlate = false
      w.__plateObs = new MutationObserver(() => {
        if (w.__agentFile?.phase() === 'tally') return
        if (document.querySelector('.coach-plate')) w.__sawPlate = true
      })
      w.__plateObs.observe(document.body, { childList: true, subtree: true })
    })

    // Let the shift run its full length, in real time, exactly as a player would
    // sit through it. ~82 s: 784 sim minutes at MS_PER_SIM_MIN.
    await expect
      .poll(() => tallyPhase(page), { timeout: 150_000, intervals: [1_000] })
      .toBe('tally')

    const sawPlate = await page.evaluate(() => {
      const w = window as unknown as { __sawPlate?: boolean; __plateObs?: MutationObserver }
      w.__plateObs?.disconnect()
      return w.__sawPlate === true
    })
    expect(sawPlate, 'the walk raised a plate while the simulation was still running').toBe(false)

    // The day really did produce a report on the way past — otherwise there was
    // nothing for the old gate to have fired on and this proves nothing.
    await expect(page.locator(`${REP_WIN} .doc-facts [data-sentence-id]`).first()).toBeVisible({
      timeout: DAY_MS,
    })
    // And now that it is over, the walk picks back up — on REPORTS, the plate
    // whose gate this test just proved was shut for the whole shift.
    await plate(page, SAID[1]!, DAY_MS)
  })
})

/* ══ the way out ═════════════════════════════════════════════════════════ */

test.describe('[x3] 튜토리얼 건너뛰기 ends the walk, not the step', () => {
  test.setTimeout(120_000)

  test('[x3] (k) the skip takes the whole layer down and it never comes back', async ({ page }) => {
    await atTheDesk(page)
    // x8 — the first plate is the LIVE FEED, so the skip cannot be pressed until
    // the day is running. Reached the long way rather than through `walkTo`,
    // because what is being tested is the FIRST plate's skip and `walkTo` would
    // acknowledge it.
    await page.locator(PAGE_NEXT).click()
    await commit(page)
    await plate(page, SAID[0]!, DAY_MS)

    await page.locator(SKIP).click()
    await expect(page.locator(PLATE)).toHaveCount(0)
    await expect(page.locator(LAYER)).toHaveCount(0)

    // And it stays gone THROUGH the beats that would each have raised a plate.
    // A skip that only closed the current mark would look identical to
    // 확인했습니다 until the walk reached its next gate, which is the regression
    // this is here for.
    await drain(page)
    await expect(page.locator(PLATE)).toHaveCount(0)
    await expect(page.locator(LAYER)).toHaveCount(0)
    // The desk is fully playable after a skip — the walk was never in the way.
    await expect(page.locator('#w-rep .doc-facts [data-sentence-id]').first()).toBeVisible({
      timeout: DAY_MS,
    })
  })

  test('[x3] (l) the skip is reachable from a later plate too', async ({ page }) => {
    // The affordance is on every plate, not only the first — an operator who
    // has read half of them and wants out must not have to click through the rest.
    await atTheDesk(page)
    await walkTo(page, SAID[3]!)
    await expect(page.locator(SKIP)).toBeVisible()
    await page.locator(SKIP).click()
    await expect(page.locator(LAYER)).toHaveCount(0)
  })
})

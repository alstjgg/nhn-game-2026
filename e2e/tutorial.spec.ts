// [x3] the onboarding walk — `shell/tutorial.ts` + `shell/coach.ts`.
//
// THE ONE LANE THAT ASKS FOR IT. `tutorialSkipped` is true under
// `navigator.webdriver`, which is every other spec in this directory: a walk
// that dims the desk and scrolls the AGENT FILE under a plate would turn those
// suites into a coin toss. This file opts in by name, `?tutorial=show`, and the
// first three tests are the ones that prove the opt-out is real.
//
// WHAT IS ASSERTED. The ORDER of the eleven plates, the LINE each one prints,
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
// Timings are asserted as CEILINGS on a wait, never as equalities: the walk is
// decoration and a CI box under load must not turn a slow frame into a red
// build. Nothing here waits a fixed number of milliseconds for a plate — the
// old walk's eight-second hold is gone and plates advance on presses.
import { expect, test } from 'playwright/test'
import type { Locator, Page } from 'playwright/test'
import { confirmDeploy, drain, settled } from './fixtures/harness.ts'

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

/* What each plate points at — the same eleven targets `tutorial.ts` names. */
const FILE_TITLE = '#w-file .fh-title'
const PAGE_NEXT = '#w-file .pg-nav .pg-next'
const DEPLOY = '#btnDeploy'
const FEED_WIN = '#w-feed'
const REP_WIN = '#w-rep'
const FACTS_HEAD = '#w-rep .doc-facts .doc-hd h3'
const BODY_HEAD = '#w-rep .doc-body .doc-hd h3'
const FIRST_BODY = '#w-rep .doc-body [data-sentence-id]'
const HANDOVER = '#w-file [data-sect="handover"]'
const UNSET = '#w-file .slot-unset'

/**
 * The eleven lines, in order, verbatim from `shell/tutorial.ts`.
 *
 * Duplicated here ON PURPOSE rather than imported. A spec that read the copy out
 * of the module it is testing would pass whatever the module said, including a
 * typo — the whole value of this list is that it was typed out separately from
 * the thing it checks, so the two have to be made to agree by hand.
 */
const SAID = [
  '현장 요원 운용 파일입니다',
  '페이지를 넘겨보세요',
  '요원을 파견하세요',
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

/** Walks from the first plate to `line`, acknowledging everything in between. */
async function walkTo(page: Page, line: string): Promise<void> {
  const stop = SAID.indexOf(line as (typeof SAID)[number])
  expect(stop, `“${line}” is not one of the eleven plates`).toBeGreaterThanOrEqual(0)

  await plate(page, SAID[0]!)
  for (let at = 0; at < stop; at += 1) {
    // The three plates whose GATE is an act, not a press. Acknowledging them is
    // not enough — the next plate is waiting on the desk to do something.
    if (at === 1) {
      // 2 → 3: the page must actually turn. `#btnDeploy` is built onto the
      // agent's page and does not exist while the cover is mounted.
      await page.locator(PAGE_NEXT).click()
      await plate(page, SAID[2]!)
      continue
    }
    if (at === 2) {
      // 3 → 4: the simulation must start, which is the commit and its plate.
      await commit(page)
      await plate(page, SAID[3]!, DAY_MS)
      continue
    }
    if (at === 3) {
      // 4 → 5: the day has to file a report, and the FIXTURE day files its
      // first one at ~78 s — measured, not guessed: the demo run reports once,
      // near the close, where a live day files seven across the shift. So the
      // rest of the day is RELEASED here rather than waited out.
      //
      // That is sound because every gate in this walk latches: the `report` and
      // the `run_end` both land while plate 4 is still up, and the walk then
      // steps through 5, 6 and 7 in order exactly as it would have if the day
      // had run its length. (h) is the test that proves the gates themselves
      // hold shut; every other test only needs to get PAST them, and paying 80
      // real seconds each to do it would put four minutes of sleep in this file.
      await drain(page)
      await acknowledge(page, SAID[4]!, DAY_MS)
      continue
    }
    if (at === 4) {
      // 5 → 6: the day is already over — the drain above closed it.
      await acknowledge(page, SAID[5]!, DAY_MS)
      continue
    }
    if (at === 7) {
      // 8 → 9: something must be SEATED in 인수인계 사항. A mine seats it (W3 —
      // one gesture mines and seats), and the gate reads the seat rather than
      // the click, so this has to be a mine that actually lands.
      await page.locator(FIRST_BODY).first().click()
      await plate(page, SAID[8]!)
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

  test('[x3] (c) ?tutorial=show turns it on', async ({ page }) => {
    await atTheDesk(page)
    await expect(page.locator(PLATE)).toBeVisible({ timeout: PLATE_MS })
    await expect(says(page)).toHaveText(SAID[0]!)
  })
})

/* ══ the plates, in order ════════════════════════════════════════════════ */

test.describe('[x3] the walk says what the operator needs next', () => {
  test.setTimeout(180_000)

  test('[x3] (d) the desk is uncovered BEFORE the first plate lands', async ({ page }) => {
    // The regression this pins, carried over from the walk this replaces: the
    // old mark's pulse was an INFINITE animation, and `revealDesk` awaits every
    // animation on a window — including one that never finishes. The desk stayed
    // at `visibility:hidden` for the whole of step 1. A plate over a desk nobody
    // can see is not a plate.
    //
    // Nothing in `coach.css` loops now (`tests/shell/tutorial-observer.test.ts`
    // holds that at source level), so this is the browser's half of the same
    // claim: the plate and the uncovered desk arrive together.
    await page.goto(WALK)
    await expect(page.locator(PLATE)).toBeVisible({ timeout: 20_000 })
    await expect(page.locator('body')).not.toHaveClass(/\bbooting\b/)
  })

  test('[x3] (e) 1 → 2 — the file, then the control that turns it', async ({ page }) => {
    await atTheDesk(page)

    // 1 — the file's own head line, and the plate points at it.
    await plate(page, SAID[0]!)
    await expect(page.locator(FILE_TITLE)).toBeVisible()
    // The hole is cut and the leader drawn: a plate with an empty `d` on either
    // is a plate pointing at nothing, which is the state the centred fallback
    // produces when a target cannot be resolved.
    await expect(page.locator(EDGE)).not.toHaveAttribute('d', '')
    await expect(page.locator(LEAD)).not.toHaveAttribute('d', '')

    // 2 — 확인했습니다 advances, and the next plate names the page control.
    await acknowledge(page, SAID[1]!)
    await expect(page.locator(PAGE_NEXT)).toBeVisible()
  })

  test('[x3] (f) the plate does not swallow the press it points at', async ({ page }) => {
    // THE load-bearing property of the whole design. The scrim covers the desk
    // and the plate sits beside the control, so if either took the pointer the
    // walk would deadlock at its own second step: plate 2 comes down on the
    // turn, and the turn is a click on the thing under the scrim.
    await atTheDesk(page)
    await plate(page, SAID[0]!)
    await acknowledge(page, SAID[1]!)

    // The press lands THROUGH the layer, with no force and no JS dispatch —
    // Playwright's default click does a real hit test, so a scrim in the way
    // would fail this outright rather than quietly passing.
    await page.locator(PAGE_NEXT).click()

    // …and both halves happened: the page really turned, and the plate let go
    // of it rather than having to be acknowledged.
    await expect(page.locator(DEPLOY)).toBeAttached()
    await plate(page, SAID[2]!)
  })

  test('[x3] (g) DEPLOY is pressable under its own plate, and the modal is unmarked', async ({ page }) => {
    await atTheDesk(page)
    await walkTo(page, SAID[2]!)

    // `#btnDeploy` sits under the fold of `.file-sheet` on first paint (the
    // page is taller than the window), so this also proves the coach scrolled
    // its target into view — an un-revealed target would not be clickable.
    await expect(page.locator(DEPLOY)).toBeInViewport()
    await page.locator(DEPLOY).click()

    // The 배치 확인 plate is up, and the walk puts NO plate on it: the coach
    // layer must not be the thing on top of the irreversible question.
    await expect(page.locator('#confirmYes')).toBeVisible({ timeout: 10_000 })
    await expect(page.locator(PLATE)).toHaveCount(0)

    await confirmDeploy(page)
    // The day is running, and plate 4 arrives on its own.
    await plate(page, SAID[3]!, DAY_MS)
  })

  test('[x3] (h) 4 → 7 — the gates hold shut until the day has produced something', async ({ page }) => {
    // THE gate test. Every other test drains past these two gates; this one
    // proves they were shut, which is the claim that matters: a plate saying
    // 객관적 사실이 기록됩니다 over an empty 현장 기록 column says the opposite of
    // what it means, and a plate about REPORTS before any report exists points
    // at a blank window.
    await atTheDesk(page)
    await walkTo(page, SAID[3]!)
    await expect(page.locator(FEED_WIN)).toBeVisible()

    // The day is seconds old and has filed nothing. Acknowledging plate 4 must
    // therefore leave NO plate on the desk — plates 5 and 6 are both waiting.
    // Asserted as a COUNT and not as "not that text": the layer rebuilds the
    // plate per mark, so in the gap there is no `#coachSays` to have text at all.
    // The 현장 기록 HEADING is built at boot and is always on the page — it is
    // the document's furniture, and plate 6 points at it precisely because it is
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
    await plate(page, SAID[4]!, DAY_MS)
    await expect(page.locator(REP_WIN)).toBeVisible()

    // 6 — the record is on the page by the time its plate names it.
    await acknowledge(page, SAID[5]!, DAY_MS)
    await expect(page.locator(FACTS_HEAD)).toBeVisible()

    // 7 — the other document. The difference between the two is the lesson.
    await acknowledge(page, SAID[6]!)
    await expect(page.locator(BODY_HEAD)).toBeVisible()

    // NOT asserted, and deliberately: that plate 6 waits specifically for
    // `run_end` as distinct from the report. The fixture day files its one
    // report ~4 s before it closes, so the two gates cannot be told apart in
    // this lane without a wait so tight it would flake. What is proved above is
    // that BOTH were shut while the day had produced nothing, which is the
    // property that protects the copy.
  })

  test('[x3] (i) 8 → 9 — the gate is a SEATED sentence, not a click', async ({ page }) => {
    await atTheDesk(page)
    await walkTo(page, SAID[7]!)
    await expect(page.locator(FIRST_BODY).first()).toBeVisible()

    // Nothing is in the file yet, so plate 9 cannot be up.
    await expect(page.locator(UNSET)).toHaveCount(0)
    await expect(says(page)).toHaveText(SAID[7]!)

    // The mine seats the sentence (W3 — one gesture mines AND seats), which is
    // what opens the gate. This is why the walk reads the seat and not the
    // press: a click on a sentence while the file is LOCKED is refused and
    // seats nothing, and gating on the click would raise plate 9 over an empty
    // 인수인계 사항.
    await page.locator(FIRST_BODY).first().click()
    await plate(page, SAID[8]!)
    await expect(page.locator(HANDOVER)).toBeVisible()
    await expect(page.locator(UNSET)).toHaveCount(1)
  })

  test('[x3] (j) 10 → 11 — 해제, then the press that closes the walk', async ({ page }) => {
    await atTheDesk(page)
    await walkTo(page, SAID[9]!)
    await expect(page.locator(UNSET)).toBeVisible()

    // 10 lets go on 해제 itself — another press that has to land through the
    // layer, and one the operator has no other reason to make.
    await page.locator(UNSET).click()
    await plate(page, SAID[10]!)

    // 11 is the last thing the walk has to say. Acknowledging it ends the walk,
    // and the layer must go with it: a scrim left dimming a desk nobody can
    // lift is worse than no walk at all.
    await page.locator(OK).click()
    await expect(page.locator(PLATE)).toHaveCount(0)
    await expect(page.locator(LAYER)).toHaveCount(0)
  })
})

/* ══ the way out ═════════════════════════════════════════════════════════ */

test.describe('[x3] 튜토리얼 건너뛰기 ends the walk, not the step', () => {
  test.setTimeout(120_000)

  test('[x3] (k) the skip takes the whole layer down and it never comes back', async ({ page }) => {
    await atTheDesk(page)
    await plate(page, SAID[0]!)

    await page.locator(SKIP).click()
    await expect(page.locator(PLATE)).toHaveCount(0)
    await expect(page.locator(LAYER)).toHaveCount(0)

    // And it stays gone THROUGH the beats that would each have raised a plate.
    // A skip that only closed the current mark would look identical to
    // 확인했습니다 until the walk reached its next gate, which is the regression
    // this is here for.
    await page.locator(PAGE_NEXT).click()
    await commit(page)
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
    // has read four of them and wants out must not have to click seven more.
    await atTheDesk(page)
    await walkTo(page, SAID[3]!)
    await expect(page.locator(SKIP)).toBeVisible()
    await page.locator(SKIP).click()
    await expect(page.locator(LAYER)).toHaveCount(0)
  })
})

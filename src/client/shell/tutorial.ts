// The portal's onboarding walk — eight coach marks, once per page load.
//
// WHAT IT IS NOT. Still not a game tutorial. This portal's fiction is that the
// operator is a new hire on their first shift, and the thing being introduced
// is the PORTAL — which window holds what, which control commits, where a
// sentence goes when you press it. So it teaches the way an internal system
// teaches: it points at what you would use next and gets out of the way.
//
// WHY IT NO LONGER WORKS IN SILENCE. The walk this replaces lit its target with
// a pulsing red ring and carried no copy at all, on the argument — set out at
// length in the header it is replacing — that a coach mark is a product-tour
// bubble and that an overlay would sit on top of the very controls it points
// at. That argument was sound and it lost to the one thing it could not do. A
// window that glows red tells a first-time player that something is WRONG; it
// does not tell them what to read. And the desk has about sixty seconds to teach
// three windows and a mine (CLAUDE.md: the judge experience is the optimisation
// target), which is not enough time for anyone to infer a gesture from a colour.
// Only copy carries that. So the ring is gone and every step says one line.
//
// WHERE IT STARTS, AND WHY SO LATE (x8). The first plate is the LIVE FEED, and it
// does not appear until the day is running — so the whole build phase, the file
// and its page turn and the press that commits it, happens unnarrated. That is
// deliberate: the AGENT FILE introduces itself now (a cover that types its own
// incident brief, a handover that materialises row by row, a press that names the
// agent and then stamps it), and a plate over a document performing its own
// opening is a second voice over the first.
//
// WHAT WAS TRADED. The old walk mounted no DOM — a mark was one class on an
// element the desk already owned — and that property is spent: `shell/coach.ts`
// mounts a scrim, a leader line and a plate with two buttons in it, and this
// module is what puts them up. The guards that pinned "mounts nothing" are
// re-aimed rather than deleted, because the rest of the contract is intact and
// it is the part that was load-bearing:
//
// WHAT WAS KEPT. The walk sends no op, drives no clock and opens no run. Every
// beat it advances on is something the desk was already doing — a press the
// operator makes, a `report` landing, `run_end` off the §5.2 stream. The layer
// is non-blocking by construction (the scrim and the leader take no pointer
// events), so the desk stays fully operable under a plate and an operator who
// ignores the walk plays exactly the game they would have played without it.
// Delete this module and the desk plays identically — which is still the
// property that makes it safe to have this in the tree this close to the
// deadline.
//
// ONCE. `runTutorial` is called once from `bootShell` and a page load is a new
// sitting (H2), so "once per session" and "once per load" are the same promise.
// Nothing is persisted: a judge who reloads gets the walk again, which is the
// behaviour a demo wants and the opposite of what a `localStorage` flag gives.
import { createCoach } from './coach.ts'
import type { CoachMark } from './coach.ts'
import type { FixtureDriver, Frame } from '../driver/index.ts'
import { must } from './dom.ts'

/* ── what each plate points at ───────────────────────────────────────────── */

/**
 * The commit, and the ONLY thing this walk still names inside the AGENT FILE.
 *
 * The file's head line and the page control were targets too, until x8 took the
 * build phase out of the walk (see the table in `runTutorial`). `pg-next` and
 * `.fh-title` are anchors `windows/agent-file.ts` and its own suite still own —
 * nothing here reads them any more.
 */
const DEPLOY = '#btnDeploy'
const FEED_WIN = '#w-feed'
const REP_WIN = '#w-rep'
/** The two documents' headings. 현장 기록 is `.doc-facts`, 무전 기록 is `.doc-body`. */
const FACTS_HEAD = '#w-rep .doc-facts .doc-hd h3'
const BODY_HEAD = '#w-rep .doc-body .doc-hd h3'
/** The first sentence of each document. */
const FIRST_FACT = '#w-rep .doc-facts [data-sentence-id]'
const FIRST_BODY = '#w-rep .doc-body [data-sentence-id]'
/**
 * A SEATED sentence in the file — the outcome of a mine, not the gesture.
 *
 * This is deliberately not `pressed('[data-sentence-id]')`, which is the obvious
 * reading of "or mines any sentence" and is wrong twice over.
 *
 * It fires when no mine happened. Mining is REFUSED while the day is running:
 * `windows/reports.ts`'s `onMine` bails when `board.isLocked()` and only flashes
 * the sentence, and the board stays locked from the commit until 21:04. So a
 * click on a sentence during the day is a click on nothing — and it would still
 * have latched, taking plate 5 down unread and pointing plate 6 at a 인수인계
 * 사항 with nothing in it.
 *
 * And it misses a mine that did happen. A sentence is a `role="button"` span
 * with its own `keydown` handler (`components/report-view.ts`), not a real
 * `<button>`, so a keyboard mine raises no click at all and an operator working
 * by keyboard would sit at that gate forever.
 *
 * A filled seat has neither problem: it is the state the gesture EXISTS to
 * produce, it cannot be reached by a refused mine, and it does not care which
 * device produced it. The class is the one `components/slot-board.ts` builds a
 * filled slot with — read off the DOM, not imported, so the ban on this module
 * importing `components/` still holds.
 */
const SEAT = '#w-file .slot.filled'
/** 인수인계 사항, by name — `components/dossier.ts` slugs the section `handover`.
 *  The same string finds it on a live page and on a past one, which is the point
 *  of naming it rather than selecting the `operable` STATE it used to be found
 *  by: that state is what a past page loses when it becomes `filed`. */
const HANDOVER = '#w-file [data-sect="handover"]'
/** The control that takes a seated sentence back out. */
const UNSET = '#w-file .slot-unset'

/* ── who gets the walk ───────────────────────────────────────────────────── */

/**
 * `?tutorial=show` forces it on, `?tutorial=skip` forces it off, and the e2e
 * lane is off by default.
 *
 * The default matters: `navigator.webdriver` is every spec under `e2e/`, and
 * those specs measure a desk. A walk that dims the desk and scrolls the AGENT
 * FILE to its DEPLOY zone underneath them would turn 200-odd assertions into a
 * coin toss. `e2e/tutorial.spec.ts` is the one lane that asks for it, and it
 * asks by name — the same shape `shell/sign-in.ts` uses for the door.
 */
export function tutorialSkipped(host: Window): boolean {
  const flag = new URLSearchParams(host.location.search).get('tutorial')
  if (flag === 'show') return false
  if (flag === 'skip') return true
  return host.navigator.webdriver === true
}

/* ── the primitives a gate is built from ─────────────────────────────────── */

/** Resolves when a matching element is pressed — capture, so nothing can eat it. */
function pressed(selector: string): Promise<void> {
  return new Promise((resolve) => {
    const onClick = (event: Event): void => {
      const target = event.target as Element | null
      if (!target?.closest?.(selector)) return
      document.removeEventListener('click', onClick, true)
      resolve()
    }
    document.addEventListener('click', onClick, true)
  })
}

/** Resolves once a matching element exists (the day's first filed fact). */
function appears(selector: string): Promise<void> {
  return new Promise((resolve) => {
    if (document.querySelector(selector)) {
      resolve()
      return
    }
    const observer = new MutationObserver(() => {
      if (!document.querySelector(selector)) return
      observer.disconnect()
      resolve()
    })
    observer.observe(document.body, { childList: true, subtree: true })
  })
}

/** Resolves on the first stream event the predicate accepts. */
function streamed(driver: FixtureDriver, accepts: (event: Frame['events'][number]) => boolean): Promise<void> {
  return new Promise((resolve) => {
    let done = false
    driver.subscribe((event) => {
      if (done || !accepts(event)) return
      done = true
      resolve()
    })
  })
}

/* ── the walk ────────────────────────────────────────────────────────────── */

export interface TutorialPorts {
  driver: FixtureDriver
  /** Resolves at the hand-over, when the desk is what the operator is looking at. */
  deskReady: Promise<void>
}

/** One beat of the walk: what must already be true, the plate, what lets it go. */
interface Beat {
  /**
   * The gate in front of this plate. Awaited before it goes up; a gate that has
   * already settled resolves at once, which is exactly the behaviour the walk
   * wants — see the arming block in `runTutorial`.
   */
  after?: Promise<unknown>
  mark: CoachMark
  /**
   * What takes the plate down early, besides its own 확인했습니다.
   *
   * A THUNK, not an array, and the deferral is doing real work. Most of these
   * are latches armed up front, because the same trigger is ALSO the gate in
   * front of a later plate and a gate must be armed early or it is missed. The
   * two that are only ever releases — 해제 on plate 7, the closing DEPLOY on
   * plate 8 — bind their listener when the thunk runs, which is when the plate
   * goes up. That difference is deliberate: nothing downstream waits on either,
   * so there is nothing to latch for, and a release already satisfied before
   * its plate is shown would take the plate down before it could be read.
   */
  until?: () => readonly Promise<unknown>[]
}

/**
 * Walks the eight plates and then never runs again.
 *
 * Deliberately NOT awaited by `bootShell`: the walk outlives boot by minutes,
 * and every plate is decoration over a desk that is fully playable without it.
 * An operator who reads none of the copy still reaches the end of it — the
 * beats that wait on a press wait on presses that are the only way forward
 * anyway (mine a sentence, commit the file). The one that is not is 해제, and that
 * plate closes on its own button rather than on a stopwatch, which is what the old
 * walk's ten-second ceiling was standing in for.
 *
 * Every plate also carries 튜토리얼 건너뛰기. That is what `'skipped'` reports,
 * and it ends the walk wherever it lands — not the step.
 */
export async function runTutorial(ports: TutorialPorts): Promise<void> {
  const { driver, deskReady } = ports

  // ─────────────────────────────────────────────────────────────────────────
  // ARM EVERY GATE HERE. AWAIT IT LATE. Do not move these down into the beats
  // that consume them, however much they look like they belong there.
  //
  // The §5.2 stream has no replay and a press is not recorded anywhere, so
  // these are all one-shot: a listener bound at the step that consumes it is
  // bound AFTER the only thing it was waiting for. And they genuinely do fire
  // early, in ordinary play — `run_end` arrives while the operator is still
  // reading the LIVE FEED plate, since the walk goes deliberately quiet for the
  // whole of the day and that plate is the one they are left with. Armed up here
  // it latches, and a gate that has already settled by the time the walk reaches
  // it resolves at once, which is the walk catching up rather than stalling.
  //
  // The old walk armed `run_end` here for exactly this reason and nothing else.
  // The rule did not change; the number of gates that need it did.
  // ─────────────────────────────────────────────────────────────────────────
  const deployPressed = pressed(DEPLOY)
  const dayClosed = streamed(driver, (event) => event.type === 'run_end')
  const seated = appears(SEAT)

  /**
   * The day is over AND both documents have something in them.
   *
   * One gate for plates 5 through 8, because all four of them are about a record
   * that has to exist before they can name it — the window, its two columns, and
   * the first sentence of the second one. `appears()` resolves the instant its
   * selector matches, so the conjunction settles at whichever of the three is
   * last, and after that every later plate is guaranteed its target.
   *
   * There is deliberately no `report` gate any more. See the note on plate 5.
   */
  const dayFiled = Promise.all([dayClosed, appears(FIRST_FACT), appears(FIRST_BODY)])

  /**
   * The day is under way — the first beat or the first line of it.
   *
   * The one gate armed off another rather than up front, and the timing is the
   * point: the run's stream is HELD until the `deploy` op reaches it (the BUILD
   * hold, `driver/run-loop.ts`), so subscribing at the press cannot be late,
   * while subscribing at boot could be early — `boot.ts` releases the opening
   * minute with `advance(0)` before this module exists. Chained off the press,
   * the subscription is bound one microtask after the capture-phase click and
   * the op does not leave until 예 on the 배치 확인 plate, so there is a whole
   * gesture of margin.
   *
   * AND IF THE OPERATOR ANSWERS 취소, NOTHING FIRES. That is deliberate and it
   * is the whole of the cancel story: there is no plate on the 배치 확인 modal,
   * and since x8 there is no plate on the press either. The walk simply waits
   * here for the press the operator eventually makes, which is self-healing
   * rather than a stall — the only way out of the file is to commit it. This
   * reads like an oversight. It is not.
   */
  const simStarted = deployPressed.then(() =>
    streamed(driver, (event) => event.type === 'beat_start' || event.type === 'feed'),
  )

  await deskReady

  // `#app` and not `document.body`: the layer belongs inside the portal's own
  // root, the way every other thing the shell mounts does. `must` throws if it
  // is missing, and `installTutorial` swallows that — a broken index.html is a
  // boot bug worth a console line, not worth the desk.
  const coach = createCoach(must('#app'))

  // Sides point INWARD across the desk's two columns (`shell/layout.ts`):
  // REPORTS holds the left column whole, the LIVE FEED and the AGENT FILE split
  // the right. So a plate on the file or the feed prefers `left` and a plate on
  // the record prefers `right`, and neither ends up off the edge. The coach
  // flips a side that has no room, so this is a preference and not a promise.
  //
  // The copy is the user's, character for character, including the space in
  // `인수 인계` on the last plate. The only edit sanctioned anywhere in this table
  // is 인수인게 → 인수인계 on the 인수인계 사항 and 해제 plates.
  //
  // ─── THE BUILD PHASE IS UNNARRATED (x8, 민서 08-09) ───────────────────────
  //
  // Three plates opened this walk and all three are gone: the file's head line
  // (현장 요원 운용 파일입니다), the page control (페이지를 넘겨보세요) and the
  // commit (요원을 파견하세요). Every one of them pointed into the AGENT FILE
  // before the day had started, and the AGENT FILE is the one window on this desk
  // that now introduces ITSELF — the cover types its incident brief out on first
  // arrival, the handover rows materialise one at a time, and the press names the
  // agent and then stamps the chop as two separate beats. A plate narrating a
  // document that is in the middle of performing its own opening is a second
  // voice over the first.
  //
  // WHAT THAT COSTS, stated rather than discovered: the operator is no longer
  // TOLD to turn the page or to press DEPLOY, and the walk cannot say a word
  // until they have worked both out — `simStarted` is chained off the press, so
  // nothing appears at all until the day is running. The walk is now strictly the
  // debrief: what the day produced, and what to do with it.
  const walk: readonly Beat[] = [
    // 1 — the day is running, and the feed is where it arrives. THE LAST PLATE
    // UNTIL 21:04, and the one the operator is meant to dismiss and then watch
    // the shift out under.
    {
      after: simStarted,
      mark: { target: FEED_WIN, says: '라이브 피드에서 현장 상황을 확인하세요', side: 'left' },
    },

    // ─── NOTHING INTERRUPTS THE DAY ──────────────────────────────────────────
    //
    // 민서, 08-09: the operator is watching the LIVE FEED, and the walk does not
    // talk over it. Every plate from here on waits for 21:04.
    //
    // This plate used to be gated on the day's FIRST `report`, which is what the
    // flow as first written asked for — "when the first REPORTS start coming
    // in". On this desk that lands mid-shift: a live day files seven of them
    // across the day, so the walk raised a plate and dimmed the desk in the
    // middle of the one stretch of the game the operator is supposed to be
    // reading. It also read as a contradiction — the plate before it says to
    // watch the feed, and then something covers part of the desk to say look
    // somewhere else.
    //
    // So the whole tail of the walk hangs off `dayFiled`, and the run of plates
    // 2 → 5 is the debrief: the window, the two documents in it, and the gesture
    // that moves a sentence out of them. `report` is no longer subscribed to at
    // all — the record's own DOM is what says the day produced something, which
    // is also the only thing these four plates actually need to be true.
    // ─────────────────────────────────────────────────────────────────────────

    // 2 — the day is over, and the day's report is read in REPORTS.
    {
      after: dayFiled,
      mark: { target: REP_WIN, says: '요원의 보고를 확인하세요', side: 'right' },
    },

    // 3 — the first of its two documents. `dayFiled` already guarantees the
    // column has something in it, so a plate saying 객관적 사실이 기록됩니다
    // cannot be raised over an empty one and say the opposite of what it means.
    {
      mark: { target: FACTS_HEAD, says: '객관적 사실이 기록됩니다', side: 'right' },
    },

    // 4 — the other document, and the difference between them is the lesson.
    { mark: { target: BODY_HEAD, says: '요원의 생각과 판단이 기록됩니다', side: 'right' } },

    // 5 — the gesture, pointed at a SENTENCE rather than at the column, because
    // a sentence is the unit that moves. It points at the first line of 무전
    // 기록 and lets go on any sentence anywhere: an operator who read the line
    // and mined a different one has understood it exactly as well, and holding
    // the plate up at them would be the terminal arguing with a correct answer.
    {
      mark: { target: FIRST_BODY, says: '기록에서 주요 정보를 추출하세요', side: 'right' },
      until: () => [seated],
    },

    // 6 — where it went. Gated on a SEATED sentence, because that is what puts
    // anything in 인수인계 사항 at all: W3 made one gesture mine AND seat, so the
    // seat is the mine's own outcome and the section has something in it to
    // point at. Gating on the click instead would raise this plate over an empty
    // section every time the operator tried to mine during the day, when the
    // file is locked and the gesture is refused — see `SEAT`.
    {
      after: seated,
      mark: { target: HANDOVER, says: '주요 정보가 다음 요원 인수인계 사항으로 넘겨집니다', side: 'left' },
    },

    // 7 — …and that it is reversible. No gate: 해제 rides a filled slot, and the
    // mine that opened plate 6 is what filled one. The listener binds here and
    // not up front for the reason `Beat.until` gives — an operator who cleared a
    // slot on their own has still not been TOLD they could.
    {
      mark: { target: UNSET, says: '인수인계를 해제할 수 있습니다', side: 'left' },
      until: () => [pressed(UNSET)],
    },

    // 8 — the walk closes on the control the day opened on, and this release could
    // not be armed up front even if the rule wanted it to be: `deployPressed`
    // was spent on the press that started this day, and what this plate is
    // waiting for is the NEXT one. Bound at show time it can only mean the press
    // that opens tomorrow.
    //
    // If the operator has already pressed it — nothing here holds them back —
    // the plate stays up on its own button. That is correct: it is the last
    // thing the walk has to say, and 확인했습니다 is a way out of it.
    {
      mark: { target: DEPLOY, says: '인수 인계를 완료한 뒤 요원을 파견하세요', side: 'left' },
      until: () => [pressed(DEPLOY)],
    },
  ]

  try {
    for (const beat of walk) {
      if (beat.after !== undefined) await beat.after
      // The skip is checked on every plate and nowhere else: 튜토리얼 건너뛰기
      // ends the WALK, so the loop returns out of the middle of the table and
      // the `finally` below takes the layer with it. `'closed'` and
      // `'released'` are the same thing to the caller — the plate came down,
      // carry on — and only the coach knows which button did it.
      if ((await coach.show(beat.mark, beat.until?.())) === 'skipped') return
    }
  } finally {
    // By any route — the last plate, a skip, or a throw out of the layer.
    // The scrim is the one thing here that would be visible after the walk is
    // over, and a dimmed desk nobody can lift is worse than no walk at all.
    coach.destroy()
  }
}

/**
 * Mounts the walk, unless this lane is not getting one.
 *
 * Fire-and-forget by design (see `runTutorial`), and its failure is swallowed:
 * a walk that throws must not take the desk with it. Nothing downstream of this
 * call depends on it having run.
 */
export function installTutorial(host: Window, ports: TutorialPorts): void {
  if (tutorialSkipped(host)) return
  void runTutorial(ports).catch((cause) => {
    console.error('the onboarding walk stopped early', cause)
  })
}

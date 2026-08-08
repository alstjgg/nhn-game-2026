// The portal's onboarding walk — twelve marks, once per session.
//
// WHAT IT IS NOT. It is not a game tutorial. This portal's fiction is that the
// operator is a new hire on their first shift, and the thing being introduced
// is the PORTAL — which window holds what, which control commits, where a
// sentence goes when you press it. So it teaches the way an internal system
// teaches: it points at what you would use next and gets out of the way. There
// is no narrator, no coach mark, no "Next ▸", and nothing to dismiss.
//
// IT IS AN OBSERVER, exactly like `audio/index.ts` (plan-audio §2). It sends no
// op, mounts no control, and nothing imports it. Every step it advances on is
// something the desk was already doing: a press the operator makes, a line
// landing on the fanfold, `run_end` off the §5.2 stream. Delete this module and
// the desk plays identically — which is the property that makes it safe to add
// this late.
//
// WHAT A MARK IS. One class, `is-lit`, and the ring `styles/tutorial.css`
// paints for it. Not an overlay: an overlay would have to track a rect through
// two scroll containers, a window drag and a page turn, and it would sit on top
// of the very controls it points at. The class rides the element, so it cannot
// be off by a pixel and it cannot intercept a click. What it costs is that a
// re-render drops it — REPORTS repaints its sentences, the file re-mounts its
// page — so a live step re-asserts its mark whenever the DOM moves. See
// `light()`.
//
// ONCE. `runTutorial` is called once from `bootShell` and a page load is a new
// sitting (H2), so "once per session" and "once per load" are the same promise.
// Nothing is persisted: a judge who reloads gets the walk again, which is the
// behaviour a demo wants and the opposite of what a `localStorage` flag gives.
import type { FixtureDriver, Frame } from '../driver/index.ts'

/* ── what each step points at ────────────────────────────────────────────── */

const FILE_WIN = '#w-file'
const FEED_WIN = '#w-feed'
const REP_WIN = '#w-rep'
/** The page control, enabled leaves only. On the cover that is `›` alone. */
const PAGE_TURN = '#w-file .pg-nav .pg-turn:not([disabled])'
const DEPLOY = '#btnDeploy'
const CONFIRM_YES = '#confirmYes'
/** The first sentence of 현장 기록, and the first of 무전 기록. */
const FIRST_FACT = '#w-rep .doc-facts [data-sentence-id]'
const FIRST_BODY = '#w-rep .doc-body [data-sentence-id]'
/** Any sentence, anywhere in the record — step 10 ends on whichever is mined. */
const ANY_SENTENCE = '[data-sentence-id]'
const UNSET = '#w-file .slot-unset'
/** The fanfold itself — step 8 ends when a line is printed onto it. */
const FEED_LIST = '#feedList'

/** The air between two marks when a step does not name its own. */
const GAP_MS = 1_000
/** Step 2 — how long the file is held up before the page control is named. */
const FILE_HOLD_MS = 8_000
/** Step 4 — the pause after the page turns, before DEPLOY is named. */
const AFTER_TURN_MS = 2_000
/** Step 12 — the walk lets go of 해제 on its own if it is never pressed. */
const UNSET_CEIL_MS = 10_000
const LIT = 'is-lit'

/* ── who gets the walk ───────────────────────────────────────────────────── */

/**
 * `?tutorial=show` forces it on, `?tutorial=skip` forces it off, and the e2e
 * lane is off by default.
 *
 * The default matters: `navigator.webdriver` is every spec under `e2e/`, and
 * those specs measure a desk. A walk that lights three windows and scrolls the
 * AGENT FILE to its DEPLOY zone underneath them would turn 200-odd assertions
 * into a coin toss. `e2e/tutorial.spec.ts` is the one lane that asks for it, and
 * it asks by name — the same shape `shell/sign-in.ts` uses for the door.
 */
export function tutorialSkipped(host: Window): boolean {
  const flag = new URLSearchParams(host.location.search).get('tutorial')
  if (flag === 'show') return false
  if (flag === 'skip') return true
  return host.navigator.webdriver === true
}

/* ── the primitives a step is built from ─────────────────────────────────── */

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })

/**
 * Lights every element the selectors currently resolve to, and keeps them lit
 * until the returned disposer runs.
 *
 * The re-application is the point. A mark is a class on a live element, and the
 * desk re-renders under it constantly — `windows/reports.ts` repaints a
 * sentence on every typewriter tick, `windows/agent-file.ts` rebuilds its page
 * on `turn()`, and the slot board replaces a slot's contents whenever it
 * changes. A mark applied once would survive none of that, and a mark applied
 * to a target that does not exist yet (`#confirmYes`) would never land at all.
 *
 * A MutationObserver rather than a timer, and not only because
 * `tests/shell/shell-source.test.ts (a)` forbids the shell a `setInterval`.
 * `childList` + `subtree` is EXACTLY the event this needs — a re-render is a
 * child-list mutation and nothing else is — so the mark is re-applied when the
 * DOM moves and never in between. `attributes` is deliberately not observed:
 * `classList.add` would then re-enter this callback on every mark it sets.
 */
function light(selectors: readonly string[]): () => void {
  let lit: Element[] = []
  const apply = (): void => {
    // ONE element per selector, always the first. Step 9 names "the first
    // sentence of 현장 기록 and the first of 무전 기록", and a `querySelectorAll`
    // there marked all fifteen sentences in the record — which points at
    // nothing, because pointing at everything is not pointing. Every other step
    // resolves to a single element anyway, so the rule costs them nothing.
    const found = selectors
      .map((sel) => document.querySelector(sel))
      .filter((node): node is Element => node !== null)
    for (const node of lit) if (!found.includes(node)) node.classList.remove(LIT)
    for (const node of found) node.classList.add(LIT)
    lit = found
  }
  apply()
  const observer = new MutationObserver(apply)
  observer.observe(document.body, { childList: true, subtree: true })
  return () => {
    observer.disconnect()
    for (const node of lit) node.classList.remove(LIT)
    lit = []
  }
}

/**
 * Brings the first match into view if it is not already there.
 *
 * Needed because two of the twelve marks are below a fold. The AGENT FILE's
 * page is taller than its window since x1 (1.5× type in a third-width column),
 * so DEPLOY sits under the scroll on first paint, and 해제 rides a slot that may
 * be anywhere in the same sheet. Pointing at something off-screen is pointing
 * at nothing.
 */
function reveal(selector: string): void {
  const node = document.querySelector(selector)
  if (!node) return
  const box = node.getBoundingClientRect()
  const inside = box.top >= 0 && box.bottom <= window.innerHeight
  if (inside) return
  node.scrollIntoView({ block: 'center', behavior: 'smooth' })
}

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

/** Resolves once a matching element exists (the confirmation plate's 예). */
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

/**
 * Resolves when a line is printed onto the fanfold.
 *
 * DOM, not the `feed` event, and the difference is the whole of step 8. The
 * stream fires several minutes' worth of events inside the first second of a
 * running day — `advance()` releases everything due — so a mark that ended on
 * the first `feed` event ended before it was ever painted: measured at zero
 * frames of LIVE FEED. What the step is about is the operator SEEING records
 * start to arrive, and that is a child landing in `#feedList`.
 *
 * Armed at the start of its own step, never at boot: the fanfold already
 * carries the opening minute's lines by the time the day is committed, so
 * "the first record" can only mean the first one after this.
 */
function feedGrew(): Promise<void> {
  return new Promise((resolve) => {
    const list = document.querySelector(FEED_LIST)
    if (!list) {
      resolve()
      return
    }
    const observer = new MutationObserver((records) => {
      if (!records.some((record) => record.addedNodes.length > 0)) return
      observer.disconnect()
      resolve()
    })
    observer.observe(list, { childList: true })
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

/**
 * One mark: light it, wait for whatever ends it, put it out.
 *
 * `until` is raced, never sequenced — step 12 ends on a press OR a ceiling, and
 * the first of them wins.
 */
async function mark(selectors: readonly string[], until: readonly Promise<unknown>[]): Promise<void> {
  reveal(selectors[0]!)
  const out = light(selectors)
  try {
    await Promise.race(until)
  } finally {
    out()
  }
}

/* ── the walk ────────────────────────────────────────────────────────────── */

export interface TutorialPorts {
  driver: FixtureDriver
  /** Resolves at the hand-over, when the desk is what the operator is looking at. */
  deskReady: Promise<void>
}

/**
 * Walks the twelve marks and then never runs again.
 *
 * Deliberately NOT awaited by `bootShell`: the walk outlives boot by minutes,
 * and every one of its steps is decoration over a desk that is fully playable
 * without it. An operator who ignores it entirely still reaches the end of it —
 * the steps that wait on a press are the steps whose press is the only way
 * forward anyway (turn the page, commit the file, mine a sentence), which is
 * why the walk needs no skip control: following the game IS following the walk.
 *
 * The one exception is step 12, which waits on 해제 — a control the operator has
 * no reason to press. That is the step with a ceiling.
 */
export async function runTutorial(ports: TutorialPorts): Promise<void> {
  const { driver, deskReady } = ports

  // `run_end` is armed HERE, before the first mark, not inside the step that
  // consumes it. It is a single event on a stream with no replay: a listener
  // bound at step 9 would be bound after the only thing it is waiting for.
  const dayClosed = streamed(driver, (event) => event.type === 'run_end')

  await deskReady

  // 1 — the file, bottom right: the document this shift is about.
  // 2 — …then the control that turns it, held for eight seconds first.
  await mark([FILE_WIN], [sleep(FILE_HOLD_MS)])
  // 3 — the operator turns the page, and the mark lets go.
  await mark([PAGE_TURN], [pressed(PAGE_TURN)])

  // 4 — two seconds later, the press that commits the file.
  await sleep(AFTER_TURN_MS)
  // 5 — the press raises the confirmation plate (x2), and 예 is marked on it.
  await mark([DEPLOY], [pressed(DEPLOY)])
  await appears(CONFIRM_YES)
  // 6 — answering puts it out.
  await mark([CONFIRM_YES], [pressed(CONFIRM_YES)])

  // 7 — the day starts on that answer, and the feed is where it arrives. NO
  // gap here: the mark belongs to the moment the simulation starts, and the
  // moment the simulation starts is the moment 예 is pressed.
  await mark([FEED_WIN], [feedGrew()])

  // 8 — the first record is in, and the record is read in REPORTS.
  await sleep(GAP_MS)
  await mark([REP_WIN], [dayClosed])

  // 9 — the day is over. The two documents it filed, one sentence each.
  // 10 — mining any sentence at all puts both out.
  await sleep(GAP_MS)
  await mark([FIRST_FACT, FIRST_BODY], [pressed(ANY_SENTENCE)])

  // 11 — a seated sentence can be taken back out.
  // 12 — pressed, or ten seconds, whichever comes first. Then the walk is over.
  await sleep(GAP_MS)
  await mark([UNSET], [pressed(UNSET), sleep(UNSET_CEIL_MS)])
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

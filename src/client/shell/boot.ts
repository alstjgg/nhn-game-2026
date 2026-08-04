// The shell's boot sequence — spec-client §5.1, in that order:
// fetch the pack → build the chrome and the five windows → applyLayout →
// connect the driver → open the run.
//
// The shell owns the desk and nothing else: it never renders run content (the
// window bodies stay empty here, [u3 · c10]), never computes the time (the
// driver's clock is the only clock, [u3#c3]) and never counts runs (the `meta`
// event does, spec-client §5.2 amendment d).
import { createRunLoopDriver, demoRunLoop } from '../driver/index.ts'
import { placeholderBootRun } from './boot-run.ts'
import type { ClockRate, FixtureDriver, Frame } from '../driver/index.ts'
import { createGameClock } from '../components/game-clock.ts'
import { createRunCounter } from '../components/run-counter.ts'
import { holdDesk, revealDesk } from '../components/desktop-dressing.ts'
import { must } from './dom.ts'
import { fetchScenarioIdentity } from './pack.ts'
import type { ScenarioIdentity } from './pack.ts'
import { PORTAL, TASKBAR_HINT } from './portal-identity.ts'
import { WINDOW_REGISTRY } from './window-registry.ts'
import { createWindowManager } from './window-manager.ts'
// A namespace import on purpose: the overlay may only be mounted once the desk
// exists, and naming `createThreadLayer` up here would put the identifier above
// `desk.arrange` in this file — the very ordering [u8]'s suite pins.
import * as threadLayer from './thread-layer.ts'

/** The dev/test handle: the driver's own view of the world, undecorated. */
export interface ShellHandle {
  frame(): Frame
  drain(): void
}

declare global {
  interface Window {
    __shell?: ShellHandle
  }
}

function renderIdentity(identity: ScenarioIdentity): void {
  must('#portalName').textContent = PORTAL.portal
  must('#portalCode').textContent = PORTAL.portalCode
  must('#opName').textContent = `${PORTAL.operatorId} · ${PORTAL.operator}`
  must('#opClearance').textContent = `권한 ${PORTAL.clearance}`
  must('#caseName').textContent = identity.slug
}

/** Pumps real elapsed milliseconds into the driver and repaints the clock. */
function runPump(driver: FixtureDriver, paint: (at: string, minute: number) => void): void {
  let previous: number | null = null
  const step = (now: number): void => {
    if (previous !== null) driver.advance(now - previous)
    previous = now
    paint(driver.clock.at(), driver.clock.minute)
    requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}

export async function bootShell(): Promise<void> {
  const body = document.body
  holdDesk(body)

  // 1 — the scenario pack.
  const identity = await fetchScenarioIdentity()
  renderIdentity(identity)

  // 2 — the driver behind the §5.2 seam. Nothing above this line knows it.
  const driver = createRunLoopDriver((await demoRunLoop()) ?? [placeholderBootRun(identity)])

  // 3 — the chrome the driver feeds.
  const clock = createGameClock({
    root: must('#clockUnit'),
    start: identity.start,
    end: identity.end,
    onRate: (rate: ClockRate) => driver.clock.setRate(rate),
  })
  const runs = createRunCounter(must('#ddayUnit'))
  driver.subscribe((event) => {
    if (event.type === 'meta') runs.render(event.run, event.runs_left)
  })

  // 4 — the five windows and the taskbar, then the computed desk arrangement.
  const desk = createWindowManager({
    desk: must('#desktop'),
    taskbar: must('#taskbar'),
    registry: WINDOW_REGISTRY,
    driver,
    hint: TASKBAR_HINT,
  })
  desk.arrange({ width: window.innerWidth, height: window.innerHeight })
  window.addEventListener('resize', () => {
    desk.arrange({ width: window.innerWidth, height: window.innerHeight })
  })

  // 4b — the evidence threads. Decoration over the arranged desk: it reads the
  // slot and sentence anchors the windows already wrote and adds no state of
  // its own, so it can only exist once the desk it measures does ([u8#c7]).
  window.__threads = threadLayer.createThreadLayer({
    host: must<SVGSVGElement>('#threads'),
    root: must('#app'),
    slotted: () => Object.values(driver.frame().store.slots),
  })

  // 5 — open the run. `advance(0)` releases what is due at the opening minute
  // without moving the clock; the desk then waits on hold until the operator
  // presses ▶, so the sim never runs behind an operator who has not looked yet.
  driver.start()
  driver.advance(0)
  driver.clock.setRate(0)

  window.__shell = {
    frame: () => driver.frame(),
    drain: () => driver.drain(),
  }

  runPump(driver, clock.paint)
  desk.focus('feed')
  revealDesk(
    body,
    desk.frames.map((f) => f.root),
  )
}

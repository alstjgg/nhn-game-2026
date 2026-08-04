// The shell's boot sequence — spec-client §5.1, in that order:
// fetch the pack → build the chrome and the five windows → applyLayout →
// connect the driver → open the run.
//
// The shell owns the desk and nothing else: it never renders run content (the
// window bodies stay empty here, [u3 · c10]), never computes the time (the
// driver's clock is the only clock, [u3#c3]) and never counts runs (the `meta`
// event does, spec-client §5.2 amendment d).
import { createRunLoopDriver, demoRunLoop, installClockHook } from '../driver/index.ts'
import { placeholderBootRun } from './boot-run.ts'
import type { ClockHook, ClockRate, FixtureDriver, Frame } from '../driver/index.ts'
import { createGameClock } from '../components/game-clock.ts'
import { createRunCounter } from '../components/run-counter.ts'
import { holdDesk, revealDesk } from '../components/desktop-dressing.ts'
import { createAnnouncer } from './announcer.ts'
import { must } from './dom.ts'
import { fetchScenarioIdentity } from './pack.ts'
import type { ScenarioIdentity } from './pack.ts'
import { PORTAL, TASKBAR_HINT } from './portal-identity.ts'
import { restoredRun } from './run-state.ts'
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
  /**
   * The C16 sim-clock hook — seed/advance/at. Present in DEV/TEST builds only
   * (inv 11): the player build never installs it, so this stays undefined and
   * the name is folded out of the bundle with the guarded call site below.
   */
  clock?: ClockHook
}

declare global {
  interface Window {
    __shell?: ShellHandle
  }
}

/**
 * DEV DRILL — `?drill=tally-lapse` boots the demo loop with its `report` events
 * withheld, so the tally's hold reaches `PACE.HOLD_CEIL` and LAPSES. That is the
 * one release the desk owns end to end and the one the authored loop can never
 * produce, so `e2e/a11y.spec.ts` has no other way to watch the announcement land
 * (R2 on `windows/tally.ts:135`).
 *
 * DEV/TEST only, exactly like `__shell` below (inv 11): `import.meta.env.DEV` is
 * a constant the bundler folds, so the player build drops the read and the
 * fixture branch behind it. The shell owns the read because a driver module may
 * touch no DOM global (`tests/driver/import-direction.test.ts (j)`).
 */
const LAPSE_DRILL = 'tally-lapse'

function lapseDrill(): boolean {
  if (!import.meta.env.DEV) return false
  return new URLSearchParams(window.location.search).get('drill') === LAPSE_DRILL
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
  // The loop opens on the run the tab left off at (§7 #8): the persisted `meta`
  // is read here, before the driver exists, because the opening `meta` of
  // `runs[0]` would otherwise land in the same tick and overwrite the restore.
  const driver = createRunLoopDriver(
    (await demoRunLoop({ withoutReports: lapseDrill() })) ?? [placeholderBootRun(identity)],
    { openAt: restoredRun() },
  )

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
  // 3b — the live region. `#toast` has been in the markup since u3 and nothing
  // ever wrote to it, so an operator driving the desk by ear heard none of the
  // state changes (R2 on index.html:125). It is bound before the windows mount
  // so the opening `meta` is announced like every later one.
  createAnnouncer(must('#toast'), driver)

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
  // `createThreadLayer` carries the mount side effect, so the call stays
  // unconditional; only the dev handle it hands back is gated (inv 11, same rule
  // as `__shell` below).
  const threads = threadLayer.createThreadLayer({
    host: must<SVGSVGElement>('#threads'),
    root: must('#app'),
    slotted: () => Object.values(driver.frame().store.slots),
  })
  if (import.meta.env.DEV) window.__threads = threads

  // 5 — open the run. `advance(0)` releases what is due at the opening minute
  // without moving the clock; the desk then waits on hold until the operator
  // presses ▶, so the sim never runs behind an operator who has not looked yet.
  driver.start()
  driver.advance(0)
  driver.clock.setRate(0)

  // The dev/test handle, and the C16 sim-clock hook that rides it — DEV/TEST
  // only. `import.meta.env.DEV` is a constant the bundler folds, so the player
  // build drops the whole block and every name in it (inv 11).
  //
  // The gate used to cover the clock hook alone, which left
  // `window.__shell={frame,drain}` — a live driver handle — in the shipped
  // artefact, and inv 11's needle list could not see it either. [u3] routed that
  // decision here and it is answered the way inv 11 answers the debug pane: a
  // surface that exists to test the desk does not ship with the desk. Every spec
  // that uses `__shell` keeps working — the e2e unit host is a
  // `--mode development` build, where this is true.
  //
  // `clock` is listed first only so the C16 install stays inside the three-line
  // window `tests/driver/clock-hook-determinism.test.ts (j)` reads back from a
  // call site when it looks for this guard.
  if (import.meta.env.DEV) {
    window.__shell = {
      clock: installClockHook(driver),
      frame: () => driver.frame(),
      drain: () => driver.drain(),
    }
  }

  runPump(driver, clock.paint)
  desk.focus('feed')
  revealDesk(
    body,
    desk.frames.map((f) => f.root),
  )
}

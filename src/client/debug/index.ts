// The debug pane's entry — spec-client §6 `DebugPane`, invariants 11 and 12.
//
// It is a READER. The only thing it consumes is driver OUTPUT, taken off the
// shell's dev handle (`window.__shell.frame()`, the driver's own undecorated
// view); it never drives the stream, never sends an op and never touches the
// clock. `noteOp` is observation only: the caller records what it already sent,
// and the record stops here — nothing on this side of the seam can move the
// meta-state.
//
// Reached from `src/client/main.ts` by a dynamic import behind the static
// `__DEBUG_PANE__` guard, and from nowhere else. That single reference is what
// lets the player build drop the whole module (inv 11).
import type { MembraneOp, ViewEvent } from '../driver/index.ts'
import { PANE_ID, mountPane } from './pane.ts'

/** The dev-only handle the pane publishes for tooling and the e2e harness. */
export interface DebugHandle {
  /** Records an op for display. It never reaches the driver (inv 12). */
  noteOp(op: MembraneOp): void
  /** Repaints both tables from the current driver frame. */
  refresh(): void
  /** Shows or flips the pane's own visibility. Returns the new state. */
  toggle(on?: boolean): boolean
}

/**
 * The query flag that puts the pane ON SCREEN.
 *
 * The pane covers the desk's bottom-left quadrant, so a dev run that is looking
 * at the GAME wants it out of the way — it stays mounted and recording, but
 * paints nothing unless `?debug` (or `?debug=1`) is on the URL. Flip it live
 * with `window.__debug.toggle()`.
 */
const SHOW_PARAM = 'debug'

/** Whether this page load asked for the pane to be on screen. */
function askedFor(): boolean {
  const value = new URLSearchParams(window.location.search).get(SHOW_PARAM)
  return value !== null && value !== '0' && value !== 'false'
}

declare global {
  interface Window {
    __debug?: DebugHandle
  }
}

/** The stream as the driver sees it right now — empty until the shell boots. */
function currentEvents(): readonly ViewEvent[] {
  const snapshot = window.__shell?.frame()
  return snapshot ? snapshot.events : []
}

export function startDebugPane(): void {
  if (document.getElementById(PANE_ID) !== null) return

  const view = mountPane(document.body, askedFor())
  const ops: MembraneOp[] = []
  let painted = -1

  const paint = (): void => {
    const events = currentEvents()
    painted = events.length
    view.render(events, ops)
  }

  // The shell boots asynchronously and the stream only ever grows, so polling
  // the frame's length on the animation frame keeps the tables in step without
  // the pane subscribing to — let alone driving — the driver.
  const follow = (): void => {
    if (currentEvents().length !== painted) paint()
    requestAnimationFrame(follow)
  }

  paint()
  requestAnimationFrame(follow)

  window.__debug = {
    noteOp(op: MembraneOp): void {
      ops.push(op)
      paint()
    },
    refresh: paint,
    toggle(on?: boolean): boolean {
      const next = on ?? !view.visible()
      view.setVisible(next)
      return next
    },
  }
}

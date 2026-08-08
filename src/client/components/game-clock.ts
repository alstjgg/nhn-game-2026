// [u3#c3] GameClock — the topbar's sim clock (spec-client §4 chrome row, §6).
//
// Ported from docs/design/phase2-ui/app.js `paintClock()` (line 171). One thing
// changed, and it is the point of the criterion: the reference kept the time in
// a module-global `S.clock` and ticked it from its own loop, while here the time
// arrives from the DRIVER's clock every frame. The view owns no clock, no timer
// and no wall-clock read.
//
// W4 dropped the other half of the port, `initRate()` (line 201) — the ×1 / ×4 /
// pause row. A day is not a recording to scrub: DEPLOY starts it and 21:04 stops
// it, so this view now pushes nothing at all.
import { mm } from '../driver/index.ts'
import { must } from '../shell/dom.ts'

export interface GameClockView {
  /** Repaints from the driver's own `at()` / `minute`. */
  paint(at: string, minute: number): void
}

export interface GameClockOptions {
  /** `#clockUnit` — the chrome container index.html provides. */
  root: HTMLElement
  /** The scenario's opening stamp — the left end of the progress bar. */
  start: string
  /** The scenario's terminal stamp — the right end, and the run's hard stop. */
  end: string
}

/**
 * W4 — the rate control is gone, and with it the last thing this view PUSHED.
 *
 * The topbar offered ×1 / ×4 / pause, ported from the design target's own
 * transport row. A day is not a recording to scrub: the operator commits a file
 * and watches it run, so the only thing that may set the clock going is DEPLOY
 * (`windows/agent-file.ts`), and 21:04 is the only thing that stops it. What is
 * left here reads the driver's clock and paints it — the view now owns no
 * control at all, which is what it always claimed in its header.
 */
export function createGameClock(options: GameClockOptions): GameClockView {
  const digits = must('#clockDigits', options.root)
  const fill = must('#clockFill', options.root)
  const term = must('.clk-term', options.root)

  const from = mm(options.start)
  const to = mm(options.end)
  const span = Math.max(1, to - from)
  term.textContent = `→ ${options.end}`

  let painted: string | null = null

  return {
    paint(at: string, minute: number): void {
      if (at === painted) return
      painted = at
      digits.textContent = at
      digits.classList.remove('tick')
      void digits.offsetWidth
      digits.classList.add('tick')
      const ratio = Math.min(1, Math.max(0, (minute - from) / span))
      // u1's `.clk-bar i` transitions its own width; the fill is the one piece
      // of chrome geometry the skin leaves to the runtime (see discovery/u3.md).
      fill.style.setProperty('width', `${(ratio * 100).toFixed(2)}%`)
    },
  }
}

// [u3#c3] GameClock — the topbar's sim clock (spec-client §4 chrome row, §6).
//
// Ported from docs/design/phase2-ui/app.js `paintClock()` / `initRate()`
// (lines 171..201). One thing changed, and it is the point of the criterion:
// the reference kept the time in a module-global `S.clock` and ticked it from
// its own loop, while here the time arrives from the DRIVER's clock every
// frame and the rate buttons push ×1 / ×4 / pause back into it. The view owns
// no clock, no timer and no wall-clock read.
import type { ClockRate } from '../driver/index.ts'
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
  /** Pushed straight at the driver's clock; the view never keeps a rate. */
  onRate: (rate: ClockRate) => void
}

/** `data-rate` → the driver's rate, or null when the attribute is not one. */
function readRate(value: string | undefined): ClockRate | null {
  switch (value) {
    case '0':
      return 0
    case '1':
      return 1
    case '4':
      return 4
    default:
      return null
  }
}

export function createGameClock(options: GameClockOptions): GameClockView {
  const digits = must('#clockDigits', options.root)
  const fill = must('#clockFill', options.root)
  const term = must('.clk-term', options.root)
  const buttons = [...options.root.querySelectorAll<HTMLButtonElement>('.rate-btn')]

  const from = mm(options.start)
  const to = mm(options.end)
  const span = Math.max(1, to - from)
  term.textContent = `→ ${options.end}`

  for (const node of buttons) {
    node.addEventListener('click', () => {
      const rate = readRate(node.dataset.rate)
      if (rate === null) return
      for (const other of buttons) other.classList.toggle('is-on', other === node)
      options.onRate(rate)
    })
  }

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

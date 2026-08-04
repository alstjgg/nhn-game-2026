// [u3#c3] RunCounter — the D-DAY unit (spec-client §4 chrome row, §6).
//
// Ported from docs/design/phase2-ui/app.js `renderChrome()` (lines 171..186):
// `RUN nn`, the `−nn` remainder and one pip per run of the allotment, the
// current one lit. The reference read a module-global `RUNSTATE`; here the
// numbers arrive ONLY on the driver's `meta` event (view-driver seam §5.2,
// amendment d), which is why the unit paints nothing until the first one
// lands — a run counter the view could compute for itself would be a lie.
import { el, must } from '../shell/dom.ts'

export interface RunCounterView {
  /** `run` = the run now on the desk, `runsLeft` = what the allotment has after it. */
  render(run: number, runsLeft: number): void
}

const pad = (value: number): string => String(Math.max(0, Math.trunc(value))).padStart(2, '0')

export function createRunCounter(root: HTMLElement): RunCounterView {
  const runNum = must('#runNum', root)
  const runTotal = must('#runTotal', root)
  const ddayNum = must('#ddayNum', root)
  const pips = must('#ddayPips', root)

  return {
    render(run: number, runsLeft: number): void {
      const total = Math.max(1, Math.trunc(run) + Math.trunc(runsLeft))
      runNum.textContent = `RUN ${pad(run)}`
      runTotal.textContent = String(total)
      ddayNum.textContent = `−${pad(runsLeft)}`

      const marks: HTMLElement[] = []
      for (let i = 1; i <= total; i += 1) {
        const state = i < run ? 'spent' : i === run ? 'now' : ''
        marks.push(el('i', state))
      }
      pips.replaceChildren(...marks)
    },
  }
}

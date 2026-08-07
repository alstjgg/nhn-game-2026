// The desk's LIVE REGION — what an operator who is not watching pixels hears.
//
// `index.html` has carried `<div id="toast" role="status" aria-live="polite">`
// since u3, and nothing ever wrote to it: 30 s of a real run produced zero
// mutations, so the whole desk announced nothing at all while `e2e/a11y.spec.ts`
// asserted the region's ATTRIBUTES and read as tested (R2 on index.html:125).
// This module is what the channel carries.
//
// What it announces is the state an operator cannot afford to miss and cannot
// infer from a document they are already reading: a new day opening, a wait
// opening and resolving, a fallback degrading the round, the report landing,
// the day closing onto the tally. The FEED itself is not routed through here —
// it is a running log, and a log belongs in `role="log"` on its own list
// (`components/run-feed.ts`), not re-read as a toast.
//
// Everything below is driven off the §5.2 stream. The one exception is
// `announce()`, which the deploy control calls with the membrane's own answer:
// `deploy` has no event echo on the ratified seam (`shell/run-state.ts` says the
// same thing about the BUILD→RUN edge), so the op's acknowledgement is the only
// signal there is.
import type { FixtureDriver, ViewEvent } from '../driver/index.ts'

/** How long a line stays on the visible toast; the live region keeps its text. */
const SHOW_MS = 4000

const RUN_OPENED = (run: number) => `RUN ${String(run).padStart(2, '0')} 시작`
const WAIT_OPEN = '무전 회신 대기 중'
const WAIT_DONE = '무전 회신 도착'
const FALLBACK: Record<1 | 2 | 3, string> = {
  1: '회신 불량',
  2: '네트워크 지연 중',
  3: '서버 이상 — 요원과 재접선 시도 중',
}
const REPORT_FILED = '보고서가 부검 창에 도착했습니다'
const RUN_CLOSED = '시뮬레이션 종료 — 결과는 현장 기록으로'

let region: HTMLElement | null = null
let hide: ReturnType<typeof setTimeout> | null = null

/**
 * Says `text` on the desk's live region. A no-op before the shell has bound one,
 * so a window that announces can be mounted bare in a unit test.
 */
export function announce(text: string): void {
  if (region === null || text.length === 0) return
  // Re-writing the same string is not an announcement — assistive tech only
  // speaks a CHANGE. A zero-width reset makes a repeat land as one.
  if (region.textContent === text) region.textContent = ''
  region.textContent = text
  region.classList.add('on')
  if (hide !== null) clearTimeout(hide)
  hide = setTimeout(() => {
    region?.classList.remove('on')
  }, SHOW_MS)
}

/** The line an event is worth saying out loud, or `null` for the ones that are not. */
export function announcementOf(event: ViewEvent): string | null {
  switch (event.type) {
    case 'meta':
      return RUN_OPENED(event.run)
    case 'waiting':
      return event.active ? WAIT_OPEN : WAIT_DONE
    case 'fallback':
      return FALLBACK[event.call]
    case 'report':
      return REPORT_FILED
    case 'run_end':
      return RUN_CLOSED
    default:
      return null
  }
}

/** Binds the live region to the stream. Returns the unsubscribe the shell owns. */
export function createAnnouncer(host: HTMLElement, driver: FixtureDriver): () => void {
  region = host
  return driver.subscribe((event: ViewEvent) => {
    const line = announcementOf(event)
    if (line !== null) announce(line)
  })
}

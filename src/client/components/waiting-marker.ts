// [u5#c4] WaitingMarker — latency, told diegetically.
//
// spec-client §3 inv 5 and the design README's latency note (lines 74..76): a
// model call in flight is a radio waiting for its answer, never a spinner and
// never a percentage. The reference prints `……<phrase>` followed by three
// breathing dots (app.js:428) and hides the whole line once the answer lands
// (`.fl-wait.resolved{display:none}`), so the wait leaves no scar in the log.
//
// The seam says WHAT is being waited for (`waiting.for`), and that is the only
// thing that picks the phrasing — nothing here measures or counts.
//
// Depends on `run-feed.ts` for TYPES ONLY: the node shape is shared, the module
// graph stays one-directional (run-feed imports this file, never the reverse).
import type { FeedLine } from '../driver/index.ts'
import { displayStamp } from '../driver/index.ts'
import type { FeedNode } from './run-feed.ts'

/** The three `waiting.for` values the seam ships, and what the feed says. */
export const WAIT_PHRASE = {
  judgment: '무전 회신 대기 중',
  narration: '현장 상황 수신 대기 중',
  report: '보고서 회신 대기 중',
} as const

export type WaitFor = keyof typeof WAIT_PHRASE

/** The reference's leader (app.js:428) — the wait carries no mark of its own. */
const WAIT_LEAD = '……'

/**
 * The open marker, either for a `wait` line off the stream or for a bare
 * `waiting` event that arrived without one.
 *
 * `mark` is empty by the same contract that keeps `FEED_MARKS.wait` empty: the
 * dots are the mark. Both are pinned by `[u5#c1]`.
 */
export function waitingModel(input: WaitFor | FeedLine): FeedNode {
  let text: string
  let clock: string
  if (typeof input === 'string') {
    text = WAIT_PHRASE[input]
    clock = ''
  } else {
    text = input.text
    clock = displayStamp(input.clock)
  }
  return {
    kind: 'wait',
    classes: ['fl', 'fl-wait'],
    mark: '',
    stamp: clock,
    parts: [{ p: 'text', text: WAIT_LEAD + text }, { p: 'dots' }],
    data: {},
  }
}

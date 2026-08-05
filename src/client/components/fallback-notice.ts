// [u5#c5] FallbackNotice — the engine §5 fallback, as the feed shows it.
//
// spec-client §7 #7: a forced fallback renders as a `※` feed line and the run
// carries on. The engine names the CALL that failed (1 · 2 · 3) and the error
// code; this module is the only place that turns the call into a class name and
// the class into a player-facing label.
//
// The code itself never becomes text (inv 2 / [u5#c3]): it rides the node as
// data, so an operator can read it off the DOM and a player never sees it.
import type { FeedLine } from '../driver/index.ts'

/** The three §5 classes, in the order the engine's calls are numbered. */
export type FallbackClass = 'fatal' | 'local' | 'supply-cut'

/** Engine §5 call → fallback class. The event carries the call, never the class. */
export const FALLBACK_CLASS: Record<1 | 2 | 3, FallbackClass> = {
  1: 'fatal',
  2: 'local',
  3: 'supply-cut',
}

/**
 * What the feed says when a fallback event arrives with no line of its own —
 * the notice is the client's own state, not authored run content, so it is
 * digit-free like every other NPC-channel surface.
 */
export const FALLBACK_LABEL: Record<FallbackClass, string> = {
  fatal: '회신 실패 — 기본 응답으로 대체',
  local: '일부 회신 실패 — 해당 구간만 기본 응답',
  'supply-cut': '보급 중단 — 남은 회신은 기본 응답',
}

/** The line the feed prints for an unpaired fallback event. */
export function fallbackNoticeLine(cls: FallbackClass, clock: string): FeedLine {
  return { kind: 'fallback', clock, text: FALLBACK_LABEL[cls] }
}

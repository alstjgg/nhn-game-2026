// The LIVE FEED's closing 집계 line — assembled from the `score` event.
//
// ── Why this file exists ────────────────────────────────────────────────────
//
// The day's count used to be prose: `timeline.json`'s `t19`, authored at
// `21:04+` as "집계. 사망 26(다리 위 24 · 관리동의 임차복 1 · 낙하 구간 아래
// 둔치 노점상 1) · 부상 71 …". A timeline event is a FIXED event — the engine
// prints every one of them verbatim (`scriptLinesOf`), no run state consulted —
// so that line said 26 on every run the desk has ever played, while the ledger
// beside it counted what the run actually scored. A capped-entry day printed
// 사망 26 in the feed and 사망 9 in 집계표, from the same 21:04.
//
// 26 is not a wrong number: it is the BASELINE, the day where nothing the agent
// did set a flag (`src/driver/scorer.ts` `baselineState`). It is wrong only in
// the place that reports what happened. So the feed's line is derived from the
// same `score` event the ledger renders, and the baseline keeps its own place —
// the ledger's `기준` column, where a counterfactual belongs.
//
// ── What it is not ──────────────────────────────────────────────────────────
//
// Not a second ledger. It prints the headline and the axes that COUNT, because
// that is what "집계" names and what the two surfaces disagreed about; the
// qualitative outcomes (서지형의 결말 · 계측 일지 원본 · 노민석의 이름) are the
// ledger's rows and are not restated here. Nor is it minable: the line carries
// no `sentence_id`, on the same rule as REPORTS' terminal record. `t19` DID
// carry one, so a player could mine "사망 26" and inject it into the next run —
// a fact the run it came from may never have had.
//
// No arithmetic (§5.3): `total` arrives summed by the scorer and is printed as
// it came. This module only chooses words and separators.
//
// Pure by contract — no DOM, no driver, no clock. `windows/live-feed.ts` and
// `components/run-feed.ts` own all three.
import { deathsOf } from '../../shared/predicates.ts'
import type { ViewEvent } from '../driver/index.ts'

type ScoreEvent = Extract<ViewEvent, { type: 'score' }>

/** What the line calls itself, and the axis the headline counts. */
const CAPTION = '집계. '
const HEADLINE_LABEL = '사망'

/** The breakdown's brackets and its separator — the authored line's own. */
const OPEN = '('
const CLOSE = ')'
const JOIN = ' · '
const END = '.'

/**
 * The closing line's text, from the ledger the run actually scored.
 *
 * A row is in the breakdown when it is one of the headline's PARTS, decided by
 * the same `deathsOf` the scorer summed the headline with — so the brackets
 * always add up to the number in front of them, and the two can never drift.
 * That covers both halves of the rule: a body count (`터널에서 나오지 못한
 * 사람 63`) and a named person the day killed (`오세라 1`), while a row that
 * only reads — `강필주`'s 6시간 구금, `부상자`'s 71명, a survivor — stays out.
 *
 * The prose row is printed as its COUNT, not its words: this line is the
 * headline's arithmetic shown, and `오세라 사망 · 아홉 번째 문 안쪽` inside the
 * brackets would be prose in a place where every other part is a number. The
 * words are the ledger's own row, three lines below.
 *
 * A ledger with no counting row prints the headline alone rather than empty
 * brackets. Still no arithmetic (§5.3): `total` arrives summed and is printed
 * as it came — `deathsOf` reads one authored value at a time and adds nothing.
 */
export function tallyLineText(event: ScoreEvent): string {
  const counted = event.rows.filter((row) => typeof row.value === 'number' || deathsOf(row.value) > 0)
  const headline = `${CAPTION}${HEADLINE_LABEL} ${event.total}`
  if (counted.length === 0) return `${headline}${END}`
  const parts = counted.map((row) => `${row.label} ${deathsOf(row.value)}`)
  return `${headline}${OPEN}${parts.join(JOIN)}${CLOSE}${END}`
}

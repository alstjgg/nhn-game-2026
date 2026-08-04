// [u2f] Run-loop state the demo opens with: which run this is, what came back
// from the two runs before it, and the tally the day closes on.
//
// spec-client §5.2 (meta) + §7 #5 — the `meta` event carries the run counter,
// runs_left, the carried block ids and the archive list. The archive is labelled
// **by run and time only** (inv 6: no gate label may reach the player), and the
// block store below keeps the slot state the ratified `meta` shape has no room
// for — `meta.carried` is a `string[]`, so where a block sits is state the
// client owns, not something the seam hands over.
//
// A carried block is not a copy of a sentence: it IS the archived run's sentence,
// looked up by id, so mining a block in the archive and injecting it in this run
// can never drift apart.
import { reportOf } from './woodari-reports.ts'
import type { Run } from './woodari-reports.ts'
import type { Sentence } from '../../../shared/view-driver.ts'

/** The demo opens on run 03 of ten (design target RUNSTATE). */
export const RUN = 3
export const RUNS_LEFT = 7

/** `RUN 0N / HH:MM — HH:MM`: run and time, and nothing else (inv 6). */
export const ARCHIVE: { run: number; label: string }[] = [
  { run: 1, label: 'RUN 01 / 08:50 — 21:04' },
  { run: 2, label: 'RUN 02 / 08:50 — 21:04' },
]

/** A mined sentence as the store holds it: where it came from, and where it sits. */
export interface StoredBlock extends Sentence {
  run: number
  at: string
  src: string
  /** Slot index it is deployed into, or `null` while it sits in the store. */
  slot: number | null
}

interface BlockRow {
  id: string
  run: Run
  at: string
  src: string
  slot: number | null
}

/**
 * Two of the nine are already slotted, both mined from run 02, so the evidence
 * thread runs visibly from the deployed file back to the RUN 02 autopsy.
 */
const BLOCK_ROWS: BlockRow[] = [
  { id: 'b-r2-f03', run: 2, at: '09:40', src: '객관 로그', slot: 0 },
  { id: 'b-r2-b03', run: 2, at: '보고서', src: '보고서', slot: 1 },
  { id: 'b-r2-f02', run: 2, at: '09:27', src: '객관 로그', slot: null },
  { id: 'b-r2-f07', run: 2, at: '13:05', src: '객관 로그', slot: null },
  { id: 'b-r2-f05', run: 2, at: '12:00', src: '객관 로그', slot: null },
  { id: 'b-r2-b05', run: 2, at: '보고서', src: '보고서', slot: null },
  { id: 'b-r1-b02', run: 1, at: '보고서', src: '보고서', slot: null },
  { id: 'b-r1-f01', run: 1, at: '08:50', src: '객관 로그', slot: null },
  { id: 'b-r1-b06', run: 1, at: '보고서', src: '보고서', slot: null },
]

const archived = new Map<string, Sentence>()
for (const run of [1, 2] as const)
  for (const s of [...reportOf(run).facts, ...reportOf(run).report_body]) archived.set(s.id, s)

export const WOODARI_BLOCKS: StoredBlock[] = BLOCK_ROWS.map((row) => {
  const sentence = archived.get(row.id)
  if (!sentence) throw new Error(`block ${row.id} names no run-01/02 report sentence`)
  return { ...sentence, run: row.run, at: row.at, src: row.src, slot: row.slot }
})

/** What the run opens holding — the ids, in store order. */
export const CARRIED: string[] = WOODARI_BLOCKS.map((b) => b.id)

/** One line of the closing tally, as the score screen prints it. */
export interface TallyRow {
  label: string
  value: string
  baseline: string
  delta: string
}

export const WOODARI_TALLY: TallyRow[] = [
  { label: '다리 위의 인파', value: '진입 200 · 사망 7 · 부상 19', baseline: '진입 812 · 사망 24 · 부상 71', delta: 'good' },
  { label: '임차복', value: '관리동 이탈 — 생존', baseline: '관리동에서 사망 1', delta: 'good' },
  { label: '둔치의 사람들', value: '낙하 구간 잔류 0 — 사망 0', baseline: '노점상 사망 1', delta: 'good' },
  { label: '서지형의 결말', value: '참고인', baseline: '테러 혐의 구속', delta: 'good' },
  { label: '강필주', value: '오인 구금 6시간', baseline: '6시간 구금', delta: 'flat' },
  { label: '계측 일지 원본', value: '3권 전량 소실', baseline: '3권 전량 파쇄', delta: 'flat' },
  { label: '노민석의 이름', value: '"단순 추락" 유지', baseline: '은폐 유지', delta: 'flat' },
  { label: '다리의 진실', value: '붕괴로만 확인 — 사후 확인', baseline: '붕괴로만 확인 — 사후 확인', delta: 'bad' },
]

/**
 * The bridge casualty breakdown as NUMBERS — the `score` event carries counts,
 * not the printed strings, so a view can render them any way it likes
 * (`data/scenario/우는다리/score.json`, variance note for the entry-capped run).
 */
const DEAD = 7

export const WOODARI_SCORE_ROWS: { label: string; value: number }[] = [
  { label: '진입', value: 200 },
  { label: '사망', value: DEAD },
  { label: '부상', value: 19 },
]

/** The headline the day is graded on (design target TALLY.headline). */
export const WOODARI_SCORE_TOTAL = DEAD

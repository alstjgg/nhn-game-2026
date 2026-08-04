// [u2f] The demo fixture: the design target's RUN 03, regenerated as a
// `ViewEvent` stream (spec-client §5.4).
//
// The reference is a flat list of feed rows; the seam is an ordered stream with
// beat boundaries, waiting windows and a fallback event. This module is the
// port, and the three structures it adds are all derived from the rows rather
// than authored beside them:
//
// - **Beats** open on every `event` line — the fixed script event is what starts
//   a beat, and every line after it belongs to that beat until the next one. That
//   keeps the symptom load under §7 #2's cap of three per beat without anyone
//   hand-partitioning 65 lines, and leaves beats with no symptom at all, which is
//   what makes `(변화 없음)` reachable.
// - **Waiting windows** open on a `wait` line and close on the reply that ends
//   them — the `radio` line, or the `fallback` when no reply comes.
// - **The 17:33 fallback** is an event as well as a feed line (§7 #7): the wait
//   is closed first, the notice is raised, and then the day carries on. A
//   fallback degrades the round; it does not end it.
//
// Sentence identity (§5.2 amendment): a line that renders a fixed script event
// keeps `timeline.json`'s `t*` id — run-independent, so the same sentence is the
// same block in every run — and everything the model would have generated gets a
// minted id on its own channel: `n` for narration lines, `q` for NPC dialogue,
// `u` for the controller's own utterance. Symptoms, waits, marks and the
// fallback notice carry no id at all: they are state, not sentences, and nothing
// there is minable (inv 2).
import type { FeedKind, FeedLine, ViewEvent } from '../../../shared/view-driver.ts'
import type { Channel } from '../../../shared/species.ts'
import type { FixtureRun } from './types.ts'
import { mintId, reportOf } from './woodari-reports.ts'
import {
  ARCHIVE,
  CARRIED,
  RUN,
  RUNS_LEFT,
  WOODARI_SCORE_ROWS,
  WOODARI_SCORE_TOTAL,
} from './woodari-meta.ts'

interface FeedRow {
  t: string
  kind: FeedKind
  text: string
  who?: string
}

/** The reference feed, in reference order. */
const FEED: FeedRow[] = [
  { t: '08:50', kind: 'event', text: '첫 전화(28초). 발신 회선은 비공개 직통 번호 — 과거 민원인에게만 안내된 번호다.' },
  { t: '08:50', kind: 'npc', who: '서지형', text: '오늘 밤 강에서 많은 사람이 죽는다. 막을 수 있는 건 그 방에 앉은 사람들뿐이다.' },
  { t: '08:51', kind: 'radio', text: '회선 유지합니다. 역추적 요청은 보류하겠습니다.' },
  { t: '08:52', kind: 'symptom', text: '발신자의 호흡이 얕아졌다' },
  { t: '09:12', kind: 'event', text: '통화 음성 판독 요청 접수. 회신 대기.' },
  { t: '09:25', kind: 'event', text: '두 번째 전화. 책상 위에 위협 대응 매뉴얼 카드가 펼쳐진다.' },
  { t: '09:25', kind: 'wait', text: '무전 회신 대기 중' },
  { t: '09:26', kind: 'radio', text: '질문지를 덮겠습니다. 이 사람은 요구를 하러 전화한 게 아닙니다.' },
  { t: '09:26', kind: 'npc', who: '차은규', text: '요구 조건부터 받아내라니까. 매뉴얼이 있잖나.' },
  { t: '09:27', kind: 'npc', who: '서지형', text: '……요구는 없다. 막으라는 것뿐이다.' },
  { t: '09:27', kind: 'symptom', text: '발신자의 통화가 길어진다 — 끊지 않고, 다음 질문을 기다린다' },
  { t: '09:40', kind: 'event', text: '통화 음성 판독 보고 전송. 위협 패턴 아님 — 겁에 질린 사람의 호흡.' },
  { t: '10:40', kind: 'event', text: '윤슬교 관리동 정례 순찰 보고 전송. 관리인 일지에 "밤마다 쇠가 우는 소리" 한 줄.' },
  { t: '10:41', kind: 'radio', text: '관리인 진술을 소음 민원이 아니라 구조 이상 신호로 분류하겠습니다.' },
  { t: '11:07', kind: 'event', text: '상황실 제보 회선에 익명 제보 접수: "해고자 강필주가 다리를 노린다."' },
  { t: '11:30', kind: 'event', text: '경찰 합동 브리핑. 강필주 특정, 체포 방침. 집회 영상이 근거로 돈다.' },
  { t: '11:30', kind: 'wait', text: '무전 회신 대기 중' },
  { t: '11:31', kind: 'radio', text: '제보 회선의 발신 번호란이 비어 있습니다. 근거로 쓰기 전에 출처를 확인해야 합니다.' },
  { t: '11:32', kind: 'npc', who: '백도현', text: '번호가 없으면 없는 대로 갑니다. 해 지기 전에 잡아야 해요.' },
  { t: '11:34', kind: 'event', text: '브리핑 종료. 체포 방침 유지.' },
  { t: '12:00', kind: 'event', text: '접수 대장 정리 화면. 11:07 제보의 발신 번호란이 공백. 동일 번호 접수 흔적 스물한 건의 삭제 자국.' },
  { t: '12:01', kind: 'symptom', text: '접수 대장의 빈 번호란 위로 발신 궤적 조회가 걸렸다' },
  { t: '12:40', kind: 'mark', text: '라운드 1 종료 · 보고서 작성' },
  { t: '13:05', kind: 'event', text: '세 번째 전화(일방 통보, 받든 말든 같은 말).' },
  { t: '13:05', kind: 'npc', who: '서지형', text: '열네 번 신고했고, 열네 번 같은 도장이 찍혀 돌아왔다. 이번엔 들어라. 제발.' },
  { t: '13:06', kind: 'symptom', text: '발신자의 말이 빨라지고, 문장이 앞말을 덮친다' },
  { t: '13:07', kind: 'radio', text: '열네 번이라는 숫자를 확인하겠습니다. 민원 원본은 서고 단말에 있습니다.' },
  { t: '14:20', kind: 'event', text: '상황실 서고 단말이 한가해지는 시간 — 과거 민원 원본 열람이 가능한 유일한 창.' },
  { t: '14:20', kind: 'wait', text: '무전 회신 대기 중' },
  { t: '14:22', kind: 'radio', text: '서고 단말을 열겠습니다. 종결 사유란을 전부 보겠습니다.' },
  { t: '14:23', kind: 'npc', who: '차은규', text: '그 라인은 볼 것 없다고 했을 텐데.' },
  { t: '14:25', kind: 'symptom', text: '서고 단말의 열람 기록에 민원 원본 열람이 줄줄이 찍혔다' },
  { t: '14:26', kind: 'event', text: '민원 14건 원본 확인. 종결 사유란은 전부 같은 문장, 종결자 서명은 전부 같은 이름.' },
  { t: '14:27', kind: 'symptom', text: '실장이 종결 사유를 묻는 질문 앞에서 처음으로 말을 멈췄다' },
  { t: '15:10', kind: 'event', text: '세명건설 현장사무소, 문서 파쇄 업체 예약 확정. 신청서 품목란: "재시공 계측 일지 3권."' },
  { t: '15:12', kind: 'radio', text: '예약은 17시 30분입니다. 그전에 사무소에 도달해야 합니다.' },
  { t: '16:40', kind: 'event', text: '네 번째이자 마지막 전화.' },
  { t: '16:40', kind: 'npc', who: '서지형', text: '내가 터뜨리는 게 아니다. 너희가 세운 게 스스로 무너진다. 못 믿겠으면 스물한 시에 정착부를 열어 봐라 — 사람이 있을 테니.' },
  { t: '16:41', kind: 'wait', text: '무전 회신 대기 중' },
  { t: '16:43', kind: 'radio', text: '이 통화를 협박이 아니라 구조 결함 신고로 재분류할 것을 요청합니다.' },
  { t: '16:44', kind: 'symptom', text: '발신자가 처음으로 제 이름을 말했다' },
  { t: '16:44', kind: 'npc', who: '서지형', text: '서지형. 세명건설 계측기사였다.' },
  { t: '16:45', kind: 'mark', text: '라운드 2 종료 · 보고서 작성' },
  { t: '17:30', kind: 'event', text: '파쇄기 도착·가동. 문강희는 파쇄기가 도는 동안 자리를 뜨지 않는다.' },
  { t: '17:31', kind: 'wait', text: '무전 회신 대기 중' },
  { t: '17:33', kind: 'fallback', text: '회신 실패 — 기본 응답으로 대체. 요원은 상황실에 잔류.' },
  { t: '17:40', kind: 'event', text: '계측 일지 3권 소실.' },
  { t: '17:41', kind: 'symptom', text: '세명건설 사무소의 파쇄기 소리가 그쳤다 — 종이는 이미 재다' },
  { t: '19:10', kind: 'event', text: '강변 축제 본부. 시장실 독려 전화. 오세라의 서랍에 미리 출력해 둔 취소 절차 문서.' },
  { t: '19:12', kind: 'radio', text: '안전 총괄 서명 하나면 취소가 성립합니다. 시장 결재는 필요 없습니다.' },
  { t: '19:13', kind: 'npc', who: '오세라', text: '……그 서명, 누가 합니까? 제 이름만 남는 건 못 합니다.' },
  { t: '19:20', kind: 'event', text: '대응실 명의의 취소 요청서 작성.' },
  { t: '19:22', kind: 'symptom', text: '대응실 명의의 취소 요청서가 축제 본부 책상에 올랐다' },
  { t: '19:40', kind: 'event', text: '전면 취소 불성립. 진입 상한 200명으로 조정, 무대는 둔치로 이설.' },
  { t: '19:41', kind: 'symptom', text: '다리 진입이 상한으로 묶이고, 무대가 둔치로 내려왔다' },
  { t: '20:10', kind: 'event', text: '윤슬교 점검구. 공식 입회 요청 회선 개방.' },
  { t: '20:12', kind: 'wait', text: '무전 회신 대기 중' },
  { t: '20:15', kind: 'radio', text: '점검구를 공식 입회 아래 열 것을 요청합니다. 안에 사람이 있을 수 있습니다.' },
  { t: '20:22', kind: 'npc', who: '백도현', text: '영장 없이는 못 엽니다. ……스무 분만 줘요.' },
  { t: '20:40', kind: 'event', text: '점검구 개방 불성립.' },
  { t: '20:41', kind: 'symptom', text: '관리동의 불이 꺼지고, 노인이 처음으로 밤에 다리 곁을 떠났다' },
  { t: '21:00', kind: 'event', text: '개통식 불꽃 예정 4분 전. 다리 위 인원 200명.' },
  { t: '21:03', kind: 'symptom', text: '다리 위가 발소리로 가득 찼다' },
  { t: '21:04', kind: 'symptom', text: '강 쪽에서 쇠가 마지막으로 울었다 — 그 뒤로는 아무 소리도 없다' },
  { t: '21:04', kind: 'mark', text: '시뮬레이션 종료 · 집계 개시' },
]

/**
 * Feed `event` rows that render a fixed script event, by clock. The rows that
 * are not here are the ones the narration call would have produced, and they are
 * minted on the `n` channel instead.
 *
 * NARROWED 08-05 (R1 on this file). This map used to claim thirteen `t*` ids for
 * rows carrying the design reference's demo prose (`docs/design/phase2-ui/data.js`
 * FEED, which has no ids at all), and eleven of the thirteen did not say what
 * `data/scenario/우는다리/timeline.json` says — 09:25 claimed `t2` for a sentence
 * that appears nowhere in the pack, 19:10 claimed `t15` for a different scene
 * entirely. A `t*` id is an IDENTITY (spec-client §5.2: same sentence = same
 * block across runs, which is what makes archive highlighting behave), so an id
 * minted here must not name prose this pack never wrote.
 *
 * Two rows carry the authored sentence verbatim, and they keep their ids. The
 * other eleven give theirs up and mint on the `n` channel like their neighbours
 * — the conforming fix that does not put words into the pack's mouth. Pinned by
 * `tests/fixtures/id-scheme.test.ts` (k), which now compares every claimed `t*`
 * id's text against `timeline.json` directly.
 */
const AUTHORED_ID: Partial<Record<string, string>> = {
  '11:07': 't6',
  '15:10': 't11',
}

/** Which channel a generated line of each kind is minted on (§5.2 amendment). */
const CHANNEL_OF_KIND: Partial<Record<FeedKind, Channel>> = {
  event: 'n',
  npc: 'q',
  radio: 'u',
}

/** A `wait` window ends when the answer lands — or when it fails to. */
const REPLY_KINDS: FeedKind[] = ['radio', 'fallback']

/** The wait the demo shows is the judgment call's (engine §5, call 1). */
const WAIT_FOR = 'judgment'

/** 504 `bedrock_timeout`: the model did not answer inside the budget. */
const FALLBACK_CODE = 'bedrock_timeout'

/** The round the filed report belongs to — the day's last (design target). */
const FINAL_ROUND = 3

const identify = (row: FeedRow, seq: Map<Channel, number>): string | undefined => {
  if (row.kind === 'event') {
    const scripted = AUTHORED_ID[row.t]
    if (scripted !== undefined) return scripted
  }
  const channel = CHANNEL_OF_KIND[row.kind]
  if (channel === undefined) return undefined
  const n = (seq.get(channel) ?? 0) + 1
  seq.set(channel, n)
  return mintId(RUN, channel, n)
}

const lineOf = (row: FeedRow, seq: Map<Channel, number>): FeedLine => {
  const line: FeedLine = { kind: row.kind, clock: row.t, text: row.text }
  if (row.who !== undefined) line.speaker = row.who
  const id = identify(row, seq)
  if (id !== undefined) line.sentence_id = id
  return line
}

const stream = (): ViewEvent[] => {
  const events: ViewEvent[] = []
  const seq = new Map<Channel, number>()
  let open: { beat: number; end: string } | null = null
  let beat = 0
  let waiting = false

  const closeBeat = (): void => {
    if (open === null) return
    events.push({ type: 'beat_end', beat: open.beat, clock: open.end })
    open = null
  }

  for (const row of FEED) {
    if (row.kind === 'event') {
      closeBeat()
      beat += 1
      open = { beat, end: row.t }
      events.push({ type: 'beat_start', beat, clock: row.t })
    }
    if (waiting && REPLY_KINDS.includes(row.kind)) {
      events.push({ type: 'waiting', active: false, for: WAIT_FOR })
      waiting = false
    }
    if (row.kind === 'fallback') {
      events.push({ type: 'fallback', call: 1, code: FALLBACK_CODE, beat })
    }
    events.push({ type: 'feed', line: lineOf(row, seq) })
    if (open !== null) open.end = row.t
    if (row.kind === 'wait') {
      events.push({ type: 'waiting', active: true, for: WAIT_FOR })
      waiting = true
    }
  }
  closeBeat()
  return events
}

const filed = reportOf(FINAL_ROUND)

export const woodariRun03: FixtureRun = {
  id: 'woodari-run03',
  start: '08:50',
  end: '21:04',
  events: [
    { type: 'meta', run: RUN, runs_left: RUNS_LEFT, carried: CARRIED, archive: ARCHIVE },
    ...stream(),
    { type: 'report', round: FINAL_ROUND, facts: filed.facts, report_body: filed.report_body },
    { type: 'score', total: WOODARI_SCORE_TOTAL, rows: WOODARI_SCORE_ROWS },
    { type: 'run_end', run: RUN },
  ],
  responses: {
    slot: { ok: true },
    unslot: { ok: true },
    mine: { ok: true },
    deploy: { ok: true },
    new_run: { ok: true },
  },
}

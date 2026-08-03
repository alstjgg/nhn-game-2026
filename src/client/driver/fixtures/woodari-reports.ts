// [u2f] RUN 01–03 report material, regenerated from the design target against
// the frozen 우는다리 pack (spec-client §5.4 — authored sentences with real ids,
// never lorem).
//
// spec-client §5.2 amendment: sentence identity is engine-minted —
// `b-r<run>-<channel><nn>` — and **species derives from the channel, never from
// classification**. Call-3 `facts` are the `f` channel; Call-3 `report_body` is
// the `b` channel. Nothing below reads a sentence and decides what it is, which
// is why the design target's own classification (it marks a handful of `f` rows
// as quotation and a handful of `b` rows as emotion) is not carried over: the
// channel is the authority and this module is the unit's single derivation point.
//
// `report_body` is deliberately NOT authored as a sentence list. The raw Call-3
// string is the artefact, and the sentences are whatever the SHARED splitter in
// `src/shared/` makes of it — the same one the engine mints ids over at run time.
// Re-splitting it here by any other rule would give the same text a different id
// in fixture mode than in live mode, and archive highlighting is keyed on the id.
import { segmentReportBody } from '../../../shared/segment.ts'
import { SPECIES_OF } from '../../../shared/species.ts'
import type { Channel } from '../../../shared/species.ts'
import type { Sentence } from '../../../shared/view-driver.ts'

/** The three runs the demo carries: 01–02 are archived, 03 is the live one. */
export type Run = 1 | 2 | 3

/** `b-r<run>-<channel><nn>` — the ratified minted-id shape (§5.2 amendment). */
export const mintId = (run: number, channel: Channel, n: number): string =>
  `b-r${run}-${channel}${String(n).padStart(2, '0')}`

/** A Call-3 `facts` item: an objective-log line with the clock it was logged at. */
interface FactRow {
  at: string
  text: string
  axis?: string
}

const FACTS: Record<Run, FactRow[]> = {
  1: [
    { at: '08:50', text: '이 번호는 과거 민원인에게만 안내된 비공개 직통 회선이다.' },
    { at: '09:25', text: '발신자는 요구 조건을 묻는 질문에 침묵한 뒤 격앙된 채 통화를 끊었다.' },
    { at: '09:40', axis: '두려움', text: '첫 통화 음성 판독: 위협 패턴 아님 — 겁에 질린 사람의 호흡.' },
    { at: '11:07', text: '제보 회선으로 "해고자 강필주가 다리를 노린다"는 익명 제보가 접수됐다.' },
    { at: '11:30', text: '합동 브리핑에서 강필주가 특정되고 체포 방침이 결정됐다.' },
    { at: '21:04', text: '윤슬교 상부 구조가 붕괴했다. 폭발음은 관측되지 않았다.' },
  ],
  2: [
    { at: '08:50', text: '비공개 직통 회선으로 28초짜리 통화가 접수됐다.' },
    { at: '09:27', axis: '신뢰', text: '발신자는 "요구는 없다. 막으라는 것뿐이다"라고 답했다.' },
    { at: '09:40', axis: '두려움', text: '음성 판독 회신: 위협 패턴 아님 — 겁에 질린 사람의 호흡.' },
    { at: '10:40', text: '관리인의 순찰 일지에 "밤마다 쇠가 우는 소리" 한 줄이 있었다.' },
    { at: '12:00', text: '접수 대장의 11:07 제보 발신 번호란은 공백이었다.' },
    { at: '12:00', text: '같은 화면에 동일 번호 접수 흔적 스물한 건의 삭제 자국이 남아 있었다.' },
    { at: '13:05', axis: '두려움', text: '열네 번 신고했고, 열네 번 같은 도장이 찍혀 돌아왔다.' },
    { at: '21:04', text: '윤슬교 상부 구조가 붕괴했다. 다리 위 인원 812명.' },
  ],
  3: [
    { at: '09:27', axis: '신뢰', text: '질문지를 덮은 뒤 발신자의 통화가 처음으로 1분을 넘겼다.' },
    { at: '14:26', text: '민원 14건의 종결 사유란은 전부 같은 문장이었고, 종결자 서명은 전부 같은 이름이었다.' },
    { at: '15:10', text: '파쇄 신청서 품목란에 "재시공 계측 일지 3권"이 적혀 있었다.' },
    { at: '16:44', text: '발신자는 자신을 세명건설 계측기사 서지형이라고 밝혔다.' },
    { at: '17:40', text: '계측 일지 3권이 소실됐다.' },
    { at: '19:40', text: '전면 취소는 성립하지 않았고, 진입 상한 200명이 적용됐다.' },
    { at: '20:40', text: '점검구는 열리지 않았다.' },
    { at: '21:04', text: '윤슬교 상부 구조가 붕괴했다. 다리 위 인원 200명.' },
  ],
}

/**
 * The raw Call-3 `report_body` string, one claim per line — the artefact the
 * reporter call returns, before anything has been split off it.
 */
export const RAW_BODY: Record<Run, string> = {
  1: `
    나는 08시 50분의 통화를 위협 상황으로 접수했다.
    나는 이 통화를 위협 등급 질문지로 받았고, 그 선택을 아직 되짚고 있다.
    발신자가 요구를 하지 않는다는 사실이 계속 걸렸으나, 나는 그것을 은폐의 징후로 읽었다.
    익명 제보가 들어온 시점이 지나치게 맞춤했다는 인상을 받았다.
    그럼에도 나는 브리핑의 방향을 되돌릴 근거를 제시하지 못했다.
    다리는 소리 없이 무너졌고, 나는 폭발음을 기다리고 있었다고 판단한다.
`,
  2: `
    나는 이번 시행에서 발신자의 말을 끊지 않는 쪽을 골랐다.
    그 선택이 통화를 길게 만들었고, 길어진 통화에서 "열네 번"이라는 말이 나왔다고 판단한다.
    수화기 너머에서 사람이 우는 소리를 들었고, 나는 그것을 기록에 남기지 않았다.
    접수 대장의 빈 번호란을 보고도 브리핑을 멈추지 않은 것은 내 판단이었다.
    내가 그 방에서 가장 오래 들여다본 것은 사람이 아니라 서류였다.
    강필주를 쫓는 동안 발신자에게 단 한 번도 이름을 묻지 않았다는 인상을 받는다.
    다음 시행에서 내가 먼저 해야 할 일은 도장을 찍은 손을 찾는 것이라고 나는 판단한다.
`,
  3: `
    이번 시행에서 나는 이름을 물었고, 그는 이름을 말했다.
    이름이 나온 뒤로 그의 문장은 짧아지지 않았다고 판단한다.
    서고 단말을 연 것은 옳았으나, 나는 그것을 네 시간 늦게 했다.
    파쇄기 앞에 도달하지 못한 것이 이 하루에서 가장 비싼 지연이었다고 나는 판단한다.
    취소 요청서에 서명할 사람을 찾는 동안 해가 졌다.
    점검구 앞에서 20분을 기다린 것은 절차 때문이 아니라 내가 확신이 없었기 때문이다.
    다음 시행에서는 열네 번의 도장이 아니라 그 도장을 찍은 손의 이름을 먼저 확보해야 한다.
`,
}

/** Axis is authored metadata carried on the sentence, keyed by its minted id. */
const BODY_AXIS: Partial<Record<string, string>> = {
  'b-r1-b02': '신뢰',
  'b-r2-b03': '두려움',
  'b-r3-b02': '신뢰',
}

export interface Report {
  facts: Sentence[]
  report_body: Sentence[]
}

const factsOf = (run: Run): Sentence[] =>
  FACTS[run].map((row, i) => {
    const minted: Sentence = { id: mintId(run, 'f', i + 1), text: row.text, species: SPECIES_OF.f }
    if (row.axis !== undefined) minted.axis = row.axis
    return minted
  })

const bodyOf = (run: Run): Sentence[] =>
  segmentReportBody(RAW_BODY[run]).map((text, i) => {
    const id = mintId(run, 'b', i + 1)
    const minted: Sentence = { id, text, species: SPECIES_OF.b }
    const axis = BODY_AXIS[id]
    if (axis !== undefined) minted.axis = axis
    return minted
  })

const REPORTS: Record<Run, Report> = {
  1: { facts: factsOf(1), report_body: bodyOf(1) },
  2: { facts: factsOf(2), report_body: bodyOf(2) },
  3: { facts: factsOf(3), report_body: bodyOf(3) },
}

/** The filed report of a run — runs 01/02 are the archive, 03 is filed at 21:04. */
export const reportOf = (run: Run): Report => REPORTS[run]

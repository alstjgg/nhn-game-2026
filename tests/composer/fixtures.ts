// [e5] fixtures — hand-written literals only (spec S7).
//
// No datapack read, no `planning/**` suite: the composer must not depend on
// scenario data (A19), so neither may its fixtures. Every factory returns a
// FRESH object graph so A17 can mutate a view's arrays without leaking the
// mutation into the next test.
import type { GateView, BeatView, RoundView, TemperamentPack } from '../../src/engine/index.ts'
import type { Block } from '../../src/shared/contracts.ts'
import type { ReportGuidance } from '../../src/shared/report-guidance.ts'

/**
 * Block ids deliberately mix ASCII and Hangul (A10): UTF-16 code-unit order
 * puts every ASCII id before '블럭-01', and `localeCompare` would not
 * necessarily agree — which is exactly the drift D4 bans.
 */
export const BLOCK_TEXT: Record<string, string> = {
  'b-r1-f01': '오전 3시 12분, 남측 관측소가 신호를 놓쳤다고 보고했다.',
  'b-r1-n02': '보고자는 당직 교대 직후였다.',
  'b-r1-a03': '같은 시각 북측 회선은 조용했다.',
  'B-upper': '대문자 id — 코드 유닛 정렬에서 소문자보다 앞선다.',
  '블럭-01': '한글 id — ASCII 뒤에 온다.',
}

export function makeBlockStore(): { get(id: string): Block | undefined } {
  const map = new Map<string, Block>(
    Object.entries(BLOCK_TEXT).map(([id, text]) => [id, { id, text }]),
  )
  return { get: (id: string) => map.get(id) }
}

export function makeTemperament(): TemperamentPack {
  return {
    default_disposition: '너는 확인되지 않은 말을 옮기기 전에 한 번 더 센다.',
    clauses: [
      {
        id: 'c1',
        axis: '지워짐',
        axis_vocabulary: ['지워지다', '남지 않다'],
        condition: '네 판단이 기록에 남지 않을 것 같으면, 너는 남기는 쪽을 고른다.',
        defeat_condition: '단, 남기는 일이 사람을 위태롭게 할 때는 그렇지 않다.',
      },
    ],
  }
}

export function makeReportGuidance(): ReportGuidance {
  return {
    id: 'report-guidance',
    version: 'v0.1',
    purpose: '라운드 기록을 남긴다.',
    facts: { max_items: 5, policy: '관찰된 것만 쓴다.' },
    report_body: {
      format: 'markdown',
      length: { min_chars: 200, max_chars: 800 },
      policy: '판단의 이유를 쓴다.',
    },
  }
}

export function makeGateView(): GateView {
  return {
    GATE_QUESTION: '남측 보고를 상부에 올릴 것인가?',
    STANCE_SET: [
      { id: 'hold', label: '보류한다' },
      { id: 'escalate', label: '올린다' },
      { id: 'verify', label: '먼저 확인한다' },
    ],
    TIMELINE_EXCERPT: [
      '03:12 남측 관측소 보고 수신.',
      '03:14 통제관이 회선을 열었다.',
    ],
    TEMPERAMENT: makeTemperament(),
  }
}

export function makeBeatView(): BeatView {
  return {
    TIMELINE_TAIL: ['03:14 통제관이 회선을 열었다.', '03:15 에이전트가 응답했다.'],
    AGENT_UTTERANCE: '확인이 먼저입니다.',
    FIXED_NPC_ACTION: '통제관이 남측 회선을 다시 호출한다.',
    PRESENT_NPCS: [
      { id: 'controller', name: '통제관', side: 'room' },
      { id: 'south-post', name: '남측 관측소', side: 'line' },
    ],
    SCENE_SYMPTOMS: ['회선 잡음이 커졌다.'],
  }
}

/** A script beat: `AGENT_UTTERANCE: ''` is legal and passes through (S4). */
export function makeScriptBeatView(): BeatView {
  const view = makeBeatView()
  view.AGENT_UTTERANCE = ''
  return view
}

export function makeRoundView(): RoundView {
  return {
    EXPERIENCED: [
      '03:12 남측 관측소 보고 수신.',
      '03:15 에이전트가 확인을 요구했다.',
      '03:20 남측 회선이 응답하지 않았다.',
    ],
    TEMPERAMENT: makeTemperament(),
  }
}

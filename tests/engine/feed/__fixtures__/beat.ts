// [e4] Fixtures for the feed + round assembler suite.
//
// One beat, one round, one report — shared by every test file so the id
// sequence asserted in `id.golden.test.ts` is the same sequence the behavioural
// tests exercise. Text is deliberately boring: the tests assert ids, order and
// isolation, never prose.
import type { PresentNpc } from '../../../../src/shared/contracts.ts'
import type { TemperamentPack } from '../../../../src/engine/index.ts'
import type { BeatFeedInput, RoundInput } from '../../../../src/engine/feed/index.ts'

/** Two NPCs are on stage; `ghost` deliberately is not. */
export const PRESENT: readonly PresentNpc[] = [
  { id: 'n1', name: '박 주임', side: 'room' },
  { id: 'n2', name: '이 반장', side: 'line' },
] as const

export const CLOCK = '09:14'

export const SCRIPT_LINE = { id: 't3', text: '무전기에서 잡음이 흘러나온다.' } as const

export const UTTERANCE = '지금은 문을 열지 않는다.'

/** The one field Call 3 may see and nothing else may (§8-5). Unique on purpose. */
export const INNER_NOTE = 'INNER_NOTE_SENTINEL_9f3a — 문을 열면 내가 책임진다는 게 무섭다.'

export const TIMELINE_ENTRIES = [
  '복도 끝에서 발소리가 멈춘다.',
  '누군가 손잡이를 두 번 흔든다.',
] as const

/** Index 1 is the foreign speaker that decision 9 drops on the way to the timeline. */
export const NPC_LINES = [
  'n1: 문 좀 열어주세요.',
  'ghost: 나도 여기 있었어.',
  'n2: 조용히 해.',
] as const

export const FOREIGN_NPC_LINE = NPC_LINES[1]
export const FOREIGN_NPC_TEXT = '나도 여기 있었어.'

export const SYMPTOM = '손끝이 미세하게 떨린다.'

export const TEMPERAMENT: TemperamentPack = {
  default_disposition: '결정을 미루고 규정을 먼저 확인한다.',
  clauses: [
    {
      id: 'c1',
      axis: '두려움',
      axis_vocabulary: ['책임', '문책'],
      condition: '책임이 자기에게 돌아올 조짐이 보이면 판단을 유보한다.',
      defeat_condition: '단, 눈앞에서 사람이 다칠 때는 그렇지 않다.',
    },
  ],
}

export const GOLDEN_BEAT: BeatFeedInput = {
  clock: CLOCK,
  scriptLines: [SCRIPT_LINE],
  judgment: { utterance: UTTERANCE },
  narration: {
    timeline_entries: [...TIMELINE_ENTRIES],
    npc_lines: [...NPC_LINES],
  },
  present: PRESENT,
  symptoms: [SYMPTOM],
}

export const GOLDEN_REPORT = {
  facts: [
    '09시 14분, 3층 비상문이 잠긴 채로 확인되었다.',
    '통제실은 문을 열지 않기로 결정했다.',
  ],
  report_body: [
    '오전 근무는 평소와 같았다. 하지만 3층에서 소리가 들렸다.',
    '- 비상문은 잠겨 있었다.',
    '나는 문을 열지 않았다',
  ].join('\n'),
} as const

export const GOLDEN_ROUND: RoundInput = {
  gate: { utterance: UTTERANCE, inner_note: INNER_NOTE },
  beats: [
    {
      scriptLines: [SCRIPT_LINE],
      narration: {
        timeline_entries: [...TIMELINE_ENTRIES],
        npc_lines: [...NPC_LINES],
      },
      present: PRESENT,
    },
  ],
  temperament: TEMPERAMENT,
}

/** A beat with no dialogue at all — §6's "empty PRESENT_NPCS is legal" case. */
export const EMPTY_ROSTER_BEAT: BeatFeedInput = {
  clock: CLOCK,
  narration: {
    timeline_entries: ['팩스 한 장이 트레이 위로 떨어진다.'],
    npc_lines: ['n1: 이건 뭐죠?', 'ghost: 받아 적어.'],
  },
  present: [],
}

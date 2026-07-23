import { describe, expect, it } from 'vitest'

import type { CharacterBible, GeneratedScene, WorldState } from '../ai/contracts.ts'
import { WorldRevisionConflictError, WorldStore } from './store.ts'

describe('WorldStore', () => {
  it('adds a model-authored newcomer under optimistic revision control', () => {
    const store = new WorldStore(worldFixture())
    const next = store.addResident(0, characterFixture('newcomer', '새롬', 'player'))

    expect(next.revision).toBe(1)
    expect(next.residents.map((resident) => resident.id)).toContain('newcomer')
    expect(() => store.addResident(0, characterFixture('late', '늦음', 'player')))
      .toThrow(WorldRevisionConflictError)
  })

  it('applies only the mutations explicitly authored by the approved scene', () => {
    const store = new WorldStore(worldFixture())
    const next = store.applyScene(0, sceneFixture())

    expect(next.revision).toBe(1)
    expect(next.residents.find((resident) => resident.id === 'nabi')?.mood).toBe('조심스러운 기대')
    expect(next.relationships[0]?.affinity).toBeCloseTo(.15)
    expect(next.memories[0]?.summary).toContain('리본')
    expect(next.recentScenes[0]?.id).toBe('scene-ribbon')
  })
})

function worldFixture(): WorldState {
  return {
    id: 'world-test',
    revision: 0,
    title: '바람 종이 정원',
    premise: '바람의 방향을 소리로 기억하는 작은 주민들이 산다.',
    locationDescription: '낮은 언덕과 긴 리본이 있는 종이 정원이다.',
    atmosphere: '산뜻하고 조용함',
    clock: '첫 오후',
    residents: [
      characterFixture('nabi', '나비', 'npc'),
      characterFixture('sori', '소리', 'npc'),
    ],
    relationships: [],
    memories: [],
    openThreads: [],
    recentScenes: [],
  }
}

function characterFixture(id: string, name: string, kind: 'npc' | 'player'): CharacterBible {
  return {
    id,
    kind,
    name,
    epithet: '바람 끝을 듣는 아이',
    essence: '몸을 기울여 아주 작은 움직임을 오래 바라본다.',
    origin: '종이 언덕의 접힌 틈에서 깨어났다.',
    traits: [
      { id: 'long-listener', label: '긴 귀기울임', description: '오래 기다린다.', visibleEvidence: '긴 선', behavioralEffect: '대답 전에 멈춘다.', confidence: .9 },
      { id: 'wind-friend', label: '바람친화', description: '흐름을 따른다.', visibleEvidence: '얇은 꼬리', behavioralEffect: '바람 쪽으로 움직인다.', confidence: .8 },
    ],
    drives: ['바람이 전하는 신호를 이해하기'],
    needs: ['서두르지 않는 동행'],
    boundaries: ['갑작스러운 큰 소리'],
    abilities: ['리본의 미세한 떨림 읽기'],
    visibleSignals: ['몸 끝이 바람 쪽으로 휜다'],
    voice: { rhythm: '긴 쉼 뒤 짧게', vocabulary: '바람과 방향 비유', sampleLine: '조금만, 먼저 들어 볼래?' },
    motion: { idle: '끝부분이 천천히 흔들린다.', approach: '옆으로 반원을 그린다.', delight: '두 번 가볍게 뛴다.', discomfort: '몸을 낮춘다.' },
    mood: '차분함',
    currentGoal: '오늘 바람의 방향을 기록하기',
    homePosition: { x: id === 'nabi' ? .3 : .7, y: .68 },
    design: {
      silhouette: '길쭉한 잎사귀',
      palette: ['#79b7bc', '#f4bc55', '#382f2a'],
      body: { kind: 'ellipse', cx: 50, cy: 58, rx: 24, ry: 35, fill: '#79b7bc', stroke: '#382f2a', strokeWidth: 2.5, opacity: 1 },
      parts: [],
      faceAnchors: { leftEye: { x: 42, y: 51 }, rightEye: { x: 58, y: 51 }, mouth: { x: 50, y: 63 } },
      expressivePartIds: [],
      idleMotions: [{ targetPartId: null, property: 'translateY', from: -2, to: 2, durationMs: 2200, delayMs: 0 }],
    },
  }
}

function sceneFixture(): GeneratedScene {
  return {
    id: 'scene-ribbon',
    title: '한 리본의 두 방향',
    summary: '나비와 소리가 같은 리본을 서로 다른 방식으로 읽었다.',
    participantIds: ['nabi', 'sori'],
    beats: [
      {
        id: 'beat-one', startMs: 0, durationMs: 700, statusText: '둘이 리본을 바라본다.',
        actions: [{ kind: 'look', actorId: 'nabi', targetId: 'sori' }],
      },
      {
        id: 'beat-two', startMs: 700, durationMs: 900, statusText: '나비가 조용히 말한다.',
        actions: [{ kind: 'speak', actorId: 'nabi', text: '같이 들어 볼래?' }],
      },
    ],
    mutations: [
      { kind: 'mood', actorId: 'nabi', mood: '조심스러운 기대', reason: '소리가 기다려 주었다.' },
      { kind: 'relationship', actorId: 'nabi', targetId: 'sori', affinityDelta: .15, trustDelta: .1, tensionDelta: 0, label: '함께 듣는 사이', reason: '리본을 함께 관찰했다.' },
      { kind: 'memory', actorId: 'nabi', visibility: 'private', summary: '소리와 리본을 함께 봤다.', interpretation: '기다려 주는 친구일지도 모른다.', salience: .7 },
    ],
    observationTitle: '같은 리본, 다른 귀',
    observationBody: '둘은 정답을 맞히지 않고 서로의 기다리는 방식을 배웠다.',
  }
}

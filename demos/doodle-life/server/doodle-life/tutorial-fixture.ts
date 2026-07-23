import type {
  CharacterDesignSpec,
  DoodleReading,
  EngineEffect,
  GeneratedGarden,
  NpcReaction,
  QuestContract,
  QuestVerdict,
} from '../../src/doodle-life/contracts.ts'

const outline = '#4c4038'

export function tutorialGarden(): GeneratedGarden {
  const world: GeneratedGarden['world'] = {
    id: 'garden_wind_notes',
    revision: 0,
    title: '바람 음표 정원',
    premise: '몸짓과 소리의 빈칸을 관찰하고, 그 사이를 살아 움직이는 그림으로 잇는 정원.',
    locationDescription: '높은 리본 풍경과 건너편 작은 종, 얕은 물길과 씨앗 등이 놓인 종이 정원이다.',
    atmosphere: '세 번째 박자를 기다리는 낮은 바람',
    residents: [
      {
        id: 'npc_soso',
        name: '소소',
        epithet: '마지막 박자를 기다리는 긴잎',
        essence: '도착하지 않은 마지막 소리를 위해 늘 자기 옆 한 자리를 비워 둔다.',
        voiceStyle: '긴 쉼 뒤에 문제의 반복 횟수를 또렷하게 말한다.',
        repeatedBehavior: '몸을 수평으로 길게 펴 높은 리본 풍경을 향하지만 끝내 닿지 못하고, 건너편 종의 마지막 박자를 기다린다.',
        silhouetteFamily: 'elongated',
        aspectRatio: 'wide',
        supportMode: 'two-point',
        homePosition: { x: 43, y: 58 },
        design: sosoDesign(),
      },
      {
        id: 'npc_dari',
        name: '다리',
        epithet: '세 발로 물길의 틈을 재는 씨앗',
        essence: '한 발이 닿을 때마다 다른 두 발이 안전한 다음 자리를 계산한다.',
        voiceStyle: '짧은 거리와 순서를 세어 말한다.',
        repeatedBehavior: '세 갈래 다리를 번갈아 내밀어 얕은 물길을 건너려다 끊긴 디딤 자국 앞에서 멈춘다.',
        silhouetteFamily: 'multi-leg',
        aspectRatio: 'tall',
        supportMode: 'multi-point',
        homePosition: { x: 18, y: 72 },
        design: dariDesign(),
      },
      {
        id: 'npc_muru',
        name: '무루',
        epithet: '가운데로 날씨를 통과시키는 고리',
        essence: '자기 몸의 빈 공간에 빛과 빗소리를 잠시 머물게 한다.',
        voiceStyle: '둥글게 되풀이하다 마지막 단어만 작게 놓는다.',
        repeatedBehavior: '고리 몸을 굴려 씨앗 등불 앞을 맴돌며, 빗방울이 닿을 때마다 빈 가운데를 기울여 가린다.',
        silhouetteFamily: 'hollow-ring',
        aspectRatio: 'balanced',
        supportMode: 'rolling',
        homePosition: { x: 78, y: 68 },
        design: muruDesign(),
      },
    ],
    props: [
      {
        id: 'ribbon_chime',
        label: '높은 리본 풍경',
        kind: 'chime',
        position: { x: 58, y: 18 },
        state: '세 번 울림',
        visibleClue: '소소의 몸보다 훨씬 높은 곳에서 리본이 세 차례 흔들린다.',
      },
      {
        id: 'far_bell',
        label: '건너편 작은 종',
        kind: 'bell',
        position: { x: 88, y: 45 },
        state: '두 번만 울림',
        visibleClue: '리본 풍경이 세 번 흔들려도 이 종에는 두 개의 파문만 남는다.',
      },
      {
        id: 'broken_steps',
        label: '끊긴 디딤 자국',
        kind: 'bridge',
        position: { x: 29, y: 78 },
        state: '가운데 한 칸 비어 있음',
        visibleClue: '다리의 세 번째 발이 닿을 곳만 물 위에서 비어 있다.',
      },
      {
        id: 'seed_lamp',
        label: '씨앗 등불',
        kind: 'lamp',
        position: { x: 72, y: 81 },
        state: '비가 올 때마다 희미해짐',
        visibleClue: '빗방울이 닿은 면부터 빛이 접히고, 마른 쪽에는 작은 빛점이 남는다.',
      },
    ],
    relationships: [
      { sourceNpcId: 'npc_soso', targetNpcId: 'npc_dari', label: '서로 다른 박자를 기다려 주는 사이' },
      { sourceNpcId: 'npc_dari', targetNpcId: 'npc_muru', label: '빈 곳의 크기를 함께 재는 사이' },
      { sourceNpcId: 'npc_muru', targetNpcId: 'npc_soso', label: '들어온 소리를 오래 품어 주는 사이' },
    ],
    gardenStates: [],
    creatures: [],
    records: [],
  }

  return {
    world,
    quests: [
      sosoQuest(),
      {
        questId: 'quest_dari_missing_step',
        ownerNpcId: 'npc_dari',
        observerNpcId: 'npc_muru',
        title: '세 번째 발이 머무를 자리',
        problemState: '얕은 물길의 가운데 디딤 자국 하나가 사라져 다리가 세 번째 발을 놓지 못한다.',
        primaryPurpose: '끊긴 두 가장자리 사이에 몸을 지탱할 연속된 자리를 만든다.',
        primarySolutions: [
          { allOf: [['bridge', 'connect'], ['grip']] },
          { allOf: [['stretch'], ['connect', 'carry']] },
        ],
        bonusPurpose: '다리의 세 발 순서에 맞춰 차례로 지지한다.',
        bonusSolutions: [{ allOf: [['rhythm', 'wait']] }],
        partialAffordances: ['bridge', 'connect', 'stretch', 'grip'],
        unexpectedEffects: [{
          affordance: 'roll',
          effects: [
            gardenEffect('broken_steps', 'water-linked', '굴러간 자리에 둥근 물결 길이 잠시 남는다.'),
            relation('다리가 발견한 둥근 우회로', '건너지는 못했지만 다리는 굴러가는 리듬을 기억한다.', 0.04),
          ],
        }],
        clues: {
          dialogue: ['첫째, 둘째 발은 마른데 셋째 발만 갈 곳이 없어.'],
          behavior: ['두 발을 고정한 채 남은 발로 빈 물 위를 세 번 더듬는다.'],
          environment: ['양쪽 디딤 자국 사이에서 가운데 한 칸만 물결에 지워져 있다.'],
          observationFocus: '양쪽 가장자리 · 비어 있는 지지 자리',
          visibleTarget: '끊긴 디딤 자국',
          visibleTiming: '세 번째 발을 내딛을 때',
        },
        outcomes: {
          full: [
            prop('broken_steps', '세 발의 순서대로 단단해짐', '세 발이 닿는 순간마다 길이 차례로 단단해진다.'),
            gardenEffect('broken_steps', 'path-opened', '물길 위에 세 박자의 길이 열린다.'),
            relation('세 발이 기억한 길', '새 생명체가 다리의 걸음 순서까지 받아 주었다.', 0.18),
          ],
          success: [
            prop('broken_steps', '건널 수 있게 이어짐', '비어 있던 자리가 이어져 물길을 건널 수 있다.'),
            gardenEffect('broken_steps', 'path-opened', '정원에 새로운 건넘 길이 남는다.'),
            relation('가운데를 이어 준 몸', '다리는 자기 발보다 먼저 빈 곳을 살핀 생명체를 기억한다.', 0.12),
          ],
          partial: [
            prop('broken_steps', '한쪽만 닿음', '한쪽 가장자리는 붙잡았지만 반대편까지 이어지지 않는다.'),
            relation('반쯤 놓인 세 번째 자리', '다리는 다음에는 어느 쪽을 더 이어야 할지 알게 되었다.', 0.06),
          ],
          fallbackUnexpected: [
            gardenEffect(null, 'unexpected-spark', '새 생명체가 물가에서 자기만의 움직임을 발견한다.'),
            relation('물가에서 시작된 다른 걸음', '부탁과는 달랐지만 다리는 낯선 이동을 한참 바라보았다.', 0.03),
          ],
        },
      },
      {
        questId: 'quest_muru_seed_lamp',
        ownerNpcId: 'npc_muru',
        observerNpcId: 'npc_soso',
        title: '비가 지나가도 남는 작은 밝음',
        problemState: '씨앗 등불은 빗방울이 닿을 때마다 한 면씩 어두워지고 마지막 빛점을 잃는다.',
        primaryPurpose: '빗방울을 피하거나 걸러 내면서 남은 밝음을 씨앗 등불에 돌려준다.',
        primarySolutions: [
          { allOf: [['shelter', 'shade', 'filter'], ['light', 'reflect']] },
          { allOf: [['absorb'], ['light', 'carry']] },
        ],
        bonusPurpose: '무루의 빈 가운데를 가리지 않고 날씨가 지나갈 틈을 남긴다.',
        bonusSolutions: [{ allOf: [['wait', 'filter']] }],
        partialAffordances: ['shelter', 'shade', 'filter', 'light', 'reflect', 'absorb'],
        unexpectedEffects: [{
          affordance: 'signal',
          effects: [
            gardenEffect('seed_lamp', 'unexpected-spark', '씨앗 등불 대신 고리 몸 주위에 작은 신호가 돈다.'),
            relation('고리 둘레를 돈 첫 신호', '무루는 밝음 대신 도착한 신호를 빈 가운데에 품었다.', 0.04),
          ],
        }],
        clues: {
          dialogue: ['빗소리가 한 번 지날 때마다 이 씨앗의 밝음도 한 면씩 접혀.'],
          behavior: ['무루가 빈 가운데를 기울여 빗방울은 통과시키고 씨앗 쪽만 가려 본다.'],
          environment: ['젖은 면은 어둡고 마른 가장자리에는 작은 빛점 하나가 남아 있다.'],
          observationFocus: '젖는 면 · 남아 있는 작은 빛점',
          visibleTarget: '씨앗 등불',
          visibleTiming: '빗방울이 지나갈 때마다',
        },
        outcomes: {
          full: [
            prop('seed_lamp', '비 속에서도 고르게 빛남', '날씨가 지나갈 틈과 씨앗을 지킬 밝음이 함께 남는다.'),
            gardenEffect('seed_lamp', 'light-kindled', '고리 안팎으로 부드러운 빛길이 생긴다.'),
            relation('빈 가운데를 지킨 밝음', '무루는 자기 빈 곳까지 이해한 생명체를 오래 기억한다.', 0.18),
          ],
          success: [
            prop('seed_lamp', '빗방울 뒤에도 빛점이 남음', '접히던 마지막 빛점이 다시 씨앗 위에 머문다.'),
            gardenEffect('seed_lamp', 'light-kindled', '정원 아래쪽에 작은 빛이 남는다.'),
            relation('마지막 빛점을 돌려준 몸', '무루와 씨앗 사이에 비가 와도 사라지지 않는 밝음이 생겼다.', 0.12),
          ],
          partial: [
            prop('seed_lamp', '한 면만 마름', '한 면은 지켰지만 밝음을 돌려줄 움직임이 더 필요하다.'),
            relation('젖지 않은 한 면', '무루는 다음 그림에서 밝음이 어디로 갈지 기다린다.', 0.06),
          ],
          fallbackUnexpected: [
            gardenEffect(null, 'unexpected-spark', '새 생명체의 색이 빗물 위에 잠깐 번진다.'),
            relation('빗물에 남은 다른 색', '부탁은 남았지만 무루는 물 위의 새 색을 기록했다.', 0.03),
          ],
        },
      },
    ],
  }
}

export function sosoQuest(): QuestContract {
  return {
    questId: 'quest_soso_last_note',
    ownerNpcId: 'npc_soso',
    observerNpcId: 'npc_dari',
    title: '기다리던 마지막 박자',
    problemState: '높은 리본 풍경은 세 번 울리지만 건너편 작은 종에는 마지막 소리가 도착하지 않는다.',
    primaryPurpose: '소리의 근원에 접근하고 받은 신호를 건너편까지 전한다.',
    primarySolutions: [
      { allOf: [['glide', 'float'], ['echo', 'carry_signal', 'signal']] },
      { allOf: [['stretch', 'climb'], ['echo', 'carry_signal', 'signal']] },
    ],
    bonusPurpose: '소소와 같은 박자에 귀 기울인다.',
    bonusSolutions: [{ allOf: [['listen', 'rhythm', 'wait']] }],
    partialAffordances: ['glide', 'float', 'stretch', 'climb', 'echo', 'carry_signal', 'signal'],
    unexpectedEffects: [
      {
        affordance: 'light',
        effects: [
          gardenEffect('ribbon_chime', 'light-kindled', '울림 대신 리본 끝에 작은 빛이 켜진다.'),
          relation('소리 대신 도착한 빛', '소소는 마지막 박자를 기다리며 새 빛의 깜박임도 세기 시작했다.', 0.04),
        ],
      },
      {
        affordance: 'roll',
        effects: [
          gardenEffect('far_bell', 'unexpected-spark', '새 생명체가 종 아래를 한 바퀴 돌며 낮은 떨림을 만든다.'),
          relation('종 아래의 둥근 한 바퀴', '소소는 다른 리듬으로 도착한 움직임을 자리에 남겼다.', 0.04),
        ],
      },
    ],
    clues: {
      dialogue: ['높은 리본 풍경이 세 번 울면, 건너편 작은 종은 늘 마지막 소리를 놓쳐.'],
      behavior: ['몸을 길게 펴 위를 향하지만 닿지 못한 뒤, 옆자리를 비운 채 마지막 박자를 기다린다.'],
      environment: ['높은 리본은 세 번 흔들리지만 건너편 종 주위에는 파문이 두 개만 남는다.'],
      observationFocus: '높은 곳 · 끊긴 마지막 소리',
      visibleTarget: '높은 리본 풍경과 건너편 작은 종',
      visibleTiming: '리본 풍경이 세 번째 울릴 때',
    },
    outcomes: {
      full: [
        prop('far_bell', '세 번 모두 울림', '받은 울림이 건너편 종까지 세 번 모두 도착한다.'),
        gardenEffect('far_bell', 'sound-restored', '두 소품 사이에 세 박자의 바람 소리가 남는다.'),
        relation('소소가 기다리던 마지막 박자', '새 생명체가 높은 울림을 받고 소소와 같은 박자로 건너편에 전했다.', 0.2),
      ],
      success: [
        prop('far_bell', '세 번째 소리까지 도착', '끊기던 마지막 소리가 건너편 종에 닿는다.'),
        gardenEffect('far_bell', 'sound-restored', '정원에 세 번째 종소리가 돌아온다.'),
        relation('끊긴 소리를 이어 준 몸', '소소는 새 생명체가 만든 소리의 길을 기억한다.', 0.13),
      ],
      partial: [
        prop('ribbon_chime', '새 생명체가 가까이 닿음', '높은 울림에는 닿았지만 건너편까지 전해지지는 않는다.'),
        relation('높은 곳까지 온 첫 시도', '소소는 어느 구간까지 이어졌는지 몸짓으로 다시 보여 주었다.', 0.06),
      ],
      fallbackUnexpected: [
        gardenEffect(null, 'unexpected-spark', '새 생명체가 부탁과 다른 자기만의 움직임으로 정원에 태어난다.'),
        relation('소소 옆에 생긴 새로운 박자', '마지막 소리는 남았지만 소소는 낯선 움직임을 위한 자리를 비워 두었다.', 0.03),
      ],
    },
  }
}

export function tutorialReading(verdict: QuestVerdict): DoodleReading {
  if (verdict === 'full') {
    return reading([
      feature('wide_membrane', '바람을 오래 받는 넓은 막', '몸 양옆의 넓고 얇은 면이 공기를 받는 형태입니다.', { x: 0.05, y: 0.24, width: 0.56, height: 0.35 }, ['glide']),
      feature('hollow_tail', '울림을 넘기는 빈 고리', '꼬리 쪽에 속이 빈 고리가 연속해서 이어집니다.', { x: 0.58, y: 0.48, width: 0.34, height: 0.31 }, ['echo']),
      feature('cupped_pair', '먼 소리에 열린 한 쌍', '머리 위 두 오목한 면이 같은 방향을 향합니다.', { x: 0.34, y: 0.05, width: 0.28, height: 0.25 }, ['listen']),
    ])
  }
  if (verdict === 'success') {
    return reading([
      feature('floating_body', '가볍게 떠오르는 큰 빈 몸', '닫힌 외곽 안의 넓은 빈 면이 위로 뜨는 형태입니다.', { x: 0.12, y: 0.12, width: 0.52, height: 0.58 }, ['float']),
      feature('signal_funnel', '한쪽으로 모아 보내는 통로', '넓게 열린 입구가 반대편의 좁은 끝으로 이어집니다.', { x: 0.55, y: 0.32, width: 0.38, height: 0.32 }, ['signal']),
    ])
  }
  if (verdict === 'partial') {
    return reading([
      feature('long_reach', '멀리 뻗는 긴 몸', '하나의 긴 선이 몸 중심에서 위쪽 끝까지 이어집니다.', { x: 0.23, y: 0.08, width: 0.3, height: 0.82 }, ['stretch']),
      feature('steady_foot', '한곳을 짚는 넓은 끝', '아래쪽 끝이 넓게 퍼져 몸을 받칩니다.', { x: 0.18, y: 0.78, width: 0.42, height: 0.17 }, ['grip']),
    ])
  }
  return reading([
    feature('bright_patch', '안쪽에서 번지는 밝은 면', '가운데 노란 면이 바깥 선보다 밝게 모여 있습니다.', { x: 0.25, y: 0.2, width: 0.48, height: 0.5 }, ['light']),
    feature('short_feet', '짧게 교차하는 두 지지점', '아래쪽의 짧은 선 두 개가 서로 다른 방향을 짚습니다.', { x: 0.28, y: 0.7, width: 0.4, height: 0.22 }, []),
  ])
}

export function uncertainFallbackReading(): DoodleReading {
  return {
    name: '여백이',
    essence: '아직 움직임을 단정하지 않고 자기 선의 다음 모습을 기다리는 생명.',
    visibleFeatures: [
      feature('visible_mass', '한데 모인 선의 덩어리', '그림 가운데에 실제 잉크가 모인 영역이 있습니다.', { x: 0.18, y: 0.2, width: 0.64, height: 0.55 }, []),
      feature('open_edge', '바깥으로 열린 선끝', '오른쪽 가장자리에서 닫히지 않은 선끝이 보입니다.', { x: 0.62, y: 0.3, width: 0.25, height: 0.35 }, []),
    ],
    motionHints: [
      { featureId: 'visible_mass', motion: 'pulse', anchor: { x: 0.5, y: 0.5 }, description: '전체 형태가 아주 작게 숨 쉬듯 움직입니다.' },
    ],
    uncertainties: [
      { region: { x: 0.12, y: 0.12, width: 0.76, height: 0.72 }, reason: '판독 요청이 끝나지 않아 보이는 기능을 안전하게 확정하지 않았습니다.' },
    ],
  }
}

export function tutorialReaction(actorId: string, verdict: QuestVerdict, creatureId: string): NpcReaction {
  const owner = actorId === 'npc_soso'
  return {
    actorId,
    emotion: verdict === 'full' ? 'delighted' : verdict === 'success' ? 'relieved' : 'curious',
    grounding: owner
      ? '확정된 결과와 소소가 기다리던 마지막 박자에만 반응한다.'
      : '다리는 소소와 생명체 사이의 달라진 리듬을 짧게 관찰한다.',
    commands: owner
      ? [
        { kind: 'look', actorId, targetId: creatureId },
        {
          kind: 'speak',
          actorId,
          text: verdict === 'full'
            ? '세 번째 소리가 왔어. 내가 비워 둔 자리와 같은 박자야.'
            : verdict === 'success'
              ? '마지막 소리가 건너갔어. 네 몸이 길이 되었구나.'
              : verdict === 'partial'
                ? '높은 곳까지는 닿았어. 건너편이 아직 한 박자를 기다려.'
                : '다른 움직임이 왔네. 이 자리도 비워 두길 잘했어.',
        },
        { kind: 'gesture', actorId, gesture: verdict === 'full' ? 'listen' : 'nod' },
      ]
      : [
        { kind: 'look', actorId, targetId: creatureId },
        { kind: 'speak', actorId, text: '모양은 처음 보지만, 어느 빈 곳을 향하는지는 발끝으로 느껴져.' },
        { kind: 'gesture', actorId, gesture: 'settle' },
      ],
  }
}

function reading(features: DoodleReading['visibleFeatures']): DoodleReading {
  return {
    name: '바람고리',
    essence: '넓은 면으로 바람을 받고 빈 고리를 따라 멀리 있는 떨림을 옮기는 생명.',
    visibleFeatures: features,
    motionHints: features.slice(0, 3).map((item, index) => ({
      featureId: item.id,
      motion: (index === 0 ? 'flutter' : index === 1 ? 'lag' : 'pulse') as 'flutter' | 'lag' | 'pulse',
      anchor: { x: item.region.x + item.region.width / 2, y: item.region.y + item.region.height / 2 },
      description: index === 0 ? '넓은 면이 작은 진폭으로 펄럭입니다.' : '읽힌 부위가 몸의 이동보다 조금 늦게 따라옵니다.',
    })),
    uncertainties: [],
  }
}

function feature(
  id: string,
  label: string,
  evidence: string,
  region: { x: number; y: number; width: number; height: number },
  affordances: DoodleReading['visibleFeatures'][number]['affordances'],
): DoodleReading['visibleFeatures'][number] {
  return {
    id,
    label,
    description: label,
    evidence,
    region,
    confidence: affordances.length > 0 ? 0.91 : 0.72,
    affordances,
  }
}

function prop(targetId: string, state: string, description: string): EngineEffect {
  return { kind: 'prop-state', targetId, state, description }
}

function gardenEffect(
  targetId: string | null,
  state: Extract<EngineEffect, { kind: 'garden-state' }>['state'],
  description: string,
): EngineEffect {
  return { kind: 'garden-state', targetId, state, description }
}

function relation(title: string, summary: string, affinityDelta: number): EngineEffect {
  return { kind: 'relationship-record', title, summary, affinityDelta }
}

function sosoDesign(): CharacterDesignSpec {
  return {
    silhouette: '긴 잎 두 장이 수평으로 포개지고 한쪽 끝만 위로 뻗은 몸',
    palette: ['#8f78ae', '#d9c5e8', outline],
    body: {
      kind: 'path',
      d: 'M 6 55 C 19 29 47 28 72 39 C 88 46 101 35 112 15 C 115 42 105 69 80 76 C 51 84 22 77 6 55 Z',
      fill: '#8f78ae', stroke: outline, strokeWidth: 3, opacity: 1,
    },
    parts: [
      { id: 'lower_leaf', shape: { kind: 'path', d: 'M 15 63 C 38 88 79 91 102 65 C 76 74 45 73 15 63 Z', fill: '#d9c5e8', stroke: outline, strokeWidth: 2, opacity: 1 }, zIndex: -1 },
      { id: 'ribbon_tip', shape: { kind: 'line', x1: 108, y1: 21, x2: 119, y2: 4, linecap: 'round', fill: '#d9c5e8', stroke: '#d9c5e8', strokeWidth: 7, opacity: 1 }, zIndex: 1 },
      { id: 'front_foot', shape: { kind: 'line', x1: 34, y1: 75, x2: 27, y2: 96, linecap: 'round', fill: outline, stroke: outline, strokeWidth: 5, opacity: 1 }, zIndex: -1 },
      { id: 'back_foot', shape: { kind: 'line', x1: 75, y1: 76, x2: 82, y2: 95, linecap: 'round', fill: outline, stroke: outline, strokeWidth: 5, opacity: 1 }, zIndex: -1 },
    ],
    faceAnchors: { leftEye: { x: 47, y: 52 }, rightEye: { x: 62, y: 50 }, mouth: { x: 55, y: 61 } },
    expressivePartIds: ['lower_leaf', 'ribbon_tip'],
    idleMotions: [
      { targetPartId: 'ribbon_tip', property: 'rotate', from: -5, to: 7, durationMs: 2200, delayMs: 0 },
      { targetPartId: null, property: 'scale', from: 0.98, to: 1.02, durationMs: 3400, delayMs: 200 },
    ],
  }
}

function dariDesign(): CharacterDesignSpec {
  return {
    silhouette: '작은 삼각 몸에서 길이가 다른 세 다리가 갈라진 몸',
    palette: ['#d8895c', '#f1c875', outline],
    body: {
      kind: 'polygon',
      points: [{ x: 48, y: 18 }, { x: 76, y: 53 }, { x: 50, y: 67 }, { x: 22, y: 52 }],
      fill: '#d8895c', stroke: outline, strokeWidth: 3, opacity: 1,
    },
    parts: [
      { id: 'leg_left', shape: { kind: 'line', x1: 35, y1: 58, x2: 13, y2: 101, linecap: 'round', fill: outline, stroke: outline, strokeWidth: 7, opacity: 1 }, zIndex: -1 },
      { id: 'leg_mid', shape: { kind: 'line', x1: 50, y1: 64, x2: 49, y2: 110, linecap: 'round', fill: outline, stroke: outline, strokeWidth: 7, opacity: 1 }, zIndex: -1 },
      { id: 'leg_right', shape: { kind: 'line', x1: 65, y1: 58, x2: 86, y2: 98, linecap: 'round', fill: outline, stroke: outline, strokeWidth: 7, opacity: 1 }, zIndex: -1 },
      { id: 'seed_cap', shape: { kind: 'ellipse', cx: 48, cy: 20, rx: 13, ry: 7, fill: '#f1c875', stroke: outline, strokeWidth: 2, opacity: 1 }, zIndex: 1 },
    ],
    faceAnchors: { leftEye: { x: 40, y: 43 }, rightEye: { x: 56, y: 43 }, mouth: { x: 48, y: 53 } },
    expressivePartIds: ['leg_left', 'leg_mid', 'leg_right'],
    idleMotions: [
      { targetPartId: 'leg_left', property: 'rotate', from: -3, to: 4, durationMs: 1700, delayMs: 0 },
      { targetPartId: 'leg_right', property: 'rotate', from: 3, to: -4, durationMs: 1700, delayMs: 400 },
    ],
  }
}

function muruDesign(): CharacterDesignSpec {
  return {
    silhouette: '가운데가 완전히 빈 굵은 고리와 바깥쪽 작은 빗받이 판',
    palette: ['#67a595', '#bde0c8', outline],
    body: {
      kind: 'ellipse',
      cx: 50, cy: 50, rx: 38, ry: 38,
      fill: 'none', stroke: '#67a595', strokeWidth: 12, opacity: 1,
    },
    parts: [
      { id: 'inner_rim', shape: { kind: 'ellipse', cx: 50, cy: 50, rx: 21, ry: 21, fill: 'none', stroke: '#bde0c8', strokeWidth: 6, opacity: 1 }, zIndex: 2 },
      { id: 'rain_plate', shape: { kind: 'polygon', points: [{ x: 73, y: 18 }, { x: 107, y: 29 }, { x: 83, y: 42 }], fill: '#bde0c8', stroke: outline, strokeWidth: 3, opacity: 1 }, zIndex: 1 },
    ],
    faceAnchors: { leftEye: { x: 30, y: 50 }, rightEye: { x: 70, y: 50 }, mouth: { x: 50, y: 79 } },
    expressivePartIds: ['inner_rim', 'rain_plate'],
    idleMotions: [
      { targetPartId: 'rain_plate', property: 'rotate', from: -4, to: 5, durationMs: 2900, delayMs: 300 },
      { targetPartId: null, property: 'rotate', from: -1, to: 1, durationMs: 4200, delayMs: 0 },
    ],
  }
}

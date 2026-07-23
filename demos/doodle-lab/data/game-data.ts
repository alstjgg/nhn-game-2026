/**
 * Static showcase content and tuning for Doodle Life.
 *
 * Keeping these values outside the runtime logic makes the matching rules and
 * demo pacing inspectable without reading the renderer or analyzer.
 */

export const TRAIT_VALUES = {
  movement: ['걷기', '구르기', '활공', '헤엄치기'],
  skill: ['탐색', '운반', '수리', '교감'],
  temperament: ['호기심', '다정함', '꼼꼼함', '느긋함'],
  place: ['정원', '연못', '공방', '광장'],
  habit: ['발광', '노래', '통통 튀기', '달라붙기'],
} as const

export type TraitAxis = keyof typeof TRAIT_VALUES

export type TraitValueMap = {
  [Axis in TraitAxis]: (typeof TRAIT_VALUES)[Axis][number]
}

export type TraitValue = TraitValueMap[TraitAxis]

export type TraitSet = {
  [Axis in TraitAxis]: TraitValueMap[Axis]
}

export type TraitRequirement = {
  [Axis in TraitAxis]: {
    readonly axis: Axis
    readonly value: TraitValueMap[Axis]
  }
}[TraitAxis]

export type ResidentShape = 'pebble' | 'sprout' | 'droplet' | 'cloud' | 'doodle'

export interface GardenSpot {
  readonly x: number
  readonly y: number
}

export interface ResidentDefinition {
  readonly id: string
  readonly name: string
  readonly color: string
  readonly accent: string
  readonly shape: ResidentShape
  readonly size: number
  readonly home: GardenSpot
  readonly traits: TraitSet
  readonly introduction: string
  readonly idleBehaviors: readonly string[]
}

export interface RequestBehavior {
  readonly id: string
  readonly text: string
  readonly motion: 'tap' | 'glance' | 'curl' | 'sway' | 'reach' | 'pause'
}

export interface RequestReactionCopy {
  readonly exact: readonly string[]
  readonly partial: readonly string[]
  readonly miss: readonly string[]
}

export interface HiddenRequestDefinition {
  readonly id: string
  readonly order: number
  readonly requesterId: string
  readonly dialogue: readonly string[]
  readonly behaviors: readonly RequestBehavior[]
  /** Internal matching data. Never render this as a request label. */
  readonly requirements: readonly TraitRequirement[]
  readonly reactions: RequestReactionCopy
  readonly observation: {
    readonly title: string
    readonly body: string
  }
}

export interface EventActorRule {
  readonly label: string
  readonly requirement: TraitRequirement
}

export type GardenTime = '낮' | '해질녘' | '밤'

export interface EmergentEventTemplate {
  readonly id: string
  readonly title: string
  readonly actorA: EventActorRule
  readonly actorB: EventActorRule
  readonly prop: string
  readonly time: GardenTime
  readonly scene: string
  readonly observation: string
}

export interface AnalyzerTraitReasonCopy {
  readonly movement: Record<TraitValueMap['movement'], string>
  readonly skill: Record<TraitValueMap['skill'], string>
  readonly temperament: Record<TraitValueMap['temperament'], string>
  readonly place: Record<TraitValueMap['place'], string>
  readonly habit: Record<TraitValueMap['habit'], string>
}

export const SHOWCASE_CONFIG = {
  title: 'Doodle Life',
  drawingSeconds: 40,
  timerMode: 'soft',
  interpretationCardCount: 3,
  maximumResidents: 6,
  requestCount: 2,
  canvas: {
    width: 720,
    height: 480,
  },
  brushWidths: [4, 9, 16],
  palette: ['#34443c', '#f06f5f', '#f4bd4f', '#79a96b', '#5e91b8', '#8d72ad'],
} as const

export const ANALYZER_TUNING = {
  samplingStep: 8,
  overlapGridSize: 18,
  orientationDominance: 1.35,
  densityReference: 0.22,
  longStrokeReference: 260,
  manyStrokesReference: 11,
  colorVarietyReference: 4,
  brightLuminance: 0.68,
  warmColorWeight: 0.2,
  coolColorWeight: 0.2,
  evidenceStrokeLimit: 3,
} as const

export const STARTER_RESIDENTS = [
  {
    id: 'bangul',
    name: '방울',
    color: '#708a9a',
    accent: '#d9edf2',
    shape: 'droplet',
    size: 0.94,
    home: { x: 76, y: 72 },
    traits: {
      movement: '구르기',
      skill: '수리',
      temperament: '꼼꼼함',
      place: '연못',
      habit: '통통 튀기',
    },
    introduction: '연못가의 돌을 매일 같은 박자로 두드리는 작은 주민.',
    idleBehaviors: ['물가의 둥근 돌을 고른다.', '돌 하나를 세 번 두드리고 귀를 기울인다.'],
  },
  {
    id: 'mongle',
    name: '몽글',
    color: '#d99a76',
    accent: '#ffe0bd',
    shape: 'cloud',
    size: 1.08,
    home: { x: 27, y: 76 },
    traits: {
      movement: '걷기',
      skill: '교감',
      temperament: '느긋함',
      place: '정원',
      habit: '노래',
    },
    introduction: '그네에서 조는 척하다가 누군가 다가오면 콧노래를 건넨다.',
    idleBehaviors: ['그네의 박자에 맞춰 몸을 좌우로 흔든다.', '눈을 감고 아주 짧게 흥얼거린다.'],
  },
  {
    id: 'soso',
    name: '소소',
    color: '#8f78aa',
    accent: '#e6d8ff',
    shape: 'sprout',
    size: 0.88,
    home: { x: 58, y: 64 },
    traits: {
      movement: '활공',
      skill: '탐색',
      temperament: '호기심',
      place: '광장',
      habit: '달라붙기',
    },
    introduction: '바람이 바뀔 때마다 높은 곳에 붙어 정원 끝을 살핀다.',
    idleBehaviors: ['풍향 리본 끝에 매달려 멀리 본다.', '낯선 소리가 나면 잎 귀를 세운다.'],
  },
  {
    id: 'dubu',
    name: '두부',
    color: '#70a994',
    accent: '#dbf3c7',
    shape: 'pebble',
    size: 1,
    home: { x: 11, y: 57 },
    traits: {
      movement: '헤엄치기',
      skill: '운반',
      temperament: '다정함',
      place: '공방',
      habit: '발광',
    },
    introduction: '공방과 연못 사이로 작은 물건을 나르며 은은하게 빛난다.',
    idleBehaviors: ['떨어진 단추를 등에 올려 공방으로 옮긴다.', '그늘에 들어가면 몸 가장자리가 희미하게 빛난다.'],
  },
] as const satisfies readonly ResidentDefinition[]

export const REQUESTS = [
  {
    id: 'cold-stone-night',
    order: 0,
    requesterId: 'bangul',
    dialogue: [
      '밤이 오면 돌멩이 소리까지 조금 차가워져.',
      '누가 옆에 오래 있어 준다면… 어두워도 덜 떨릴 것 같아.',
    ],
    behaviors: [
      { id: 'tap-stone', text: '돌멩이를 톡… 톡… 두드린다.', motion: 'tap' },
      { id: 'watch-shadow', text: '어두운 구석을 자꾸 흘끔거린다.', motion: 'glance' },
      { id: 'hold-shoulders', text: '바람이 불면 몸을 작게 말아 어깨를 감싼다.', motion: 'curl' },
    ],
    requirements: [
      { axis: 'temperament', value: '다정함' },
      { axis: 'habit', value: '발광' },
    ],
    reactions: {
      exact: [
        '방울의 돌 두드리기가 멈춘다. 빛 가까이 몸을 붙이고, 접혀 있던 어깨가 천천히 펴진다.',
        '방울이 새 주민 곁에 돌 하나를 내려놓는다. 오늘 밤은 그 돌을 두드리지 않아도 될 것 같다.',
      ],
      partial: [
        '방울의 어깨가 조금 풀린다. 하지만 바람이 불자 다시 몸을 작게 만다.',
        '돌 두드리는 간격이 느려진다. 방울은 새 주민과 어두운 구석을 번갈아 바라본다.',
      ],
      miss: [
        '방울이 반갑게 인사하지만 돌을 다시 톡, 톡 두드린다. 아직 기다리는 몸짓이 남아 있다.',
        '둘은 잠깐 나란히 앉는다. 방울은 웃고도 어두운 구석을 한 번 더 흘끔거린다.',
      ],
    },
    observation: {
      title: '돌 소리가 멎은 밤',
      body: '방울은 밝기만이 아니라, 어둠 속에 오래 머물 다정한 곁을 기다리고 있었다.',
    },
  },
  {
    id: 'wind-over-the-wall',
    order: 1,
    requesterId: 'soso',
    dialogue: [
      '담장 너머에서 처음 듣는 바람 소리가 나.',
      '혼자 날아가면 금방 놓쳐 버려. 같은 소리를 함께 듣는 친구라면 좋을 텐데.',
    ],
    behaviors: [
      { id: 'reach-ribbon', text: '높은 풍향 리본을 향해 몸을 길게 뻗는다.', motion: 'reach' },
      { id: 'listen-together', text: '바람이 불 때마다 옆자리를 비워 둔 채 귀를 기울인다.', motion: 'pause' },
      { id: 'ride-gust', text: '짧게 떠올랐다가 누군가를 기다리듯 제자리로 돌아온다.', motion: 'sway' },
    ],
    requirements: [
      { axis: 'movement', value: '활공' },
      { axis: 'skill', value: '교감' },
    ],
    reactions: {
      exact: [
        '둘이 같은 돌풍에 올라탄다. 소소는 처음으로 담장보다 친구 쪽을 오래 바라본다.',
        '새 주민이 바람의 박자를 받아 주자 소소의 잎 귀가 활짝 펼쳐진다.',
      ],
      partial: [
        '소소가 반걸음 가까워진다. 함께 듣고 싶다는 빈자리는 아직 조금 남아 있다.',
        '둘의 몸이 잠깐 같은 방향으로 기운다. 다음 돌풍에는 박자가 맞을지도 모른다.',
      ],
      miss: [
        '소소는 새 주민에게 담장 너머를 가리켜 보인다. 대답을 기다리며 리본에 다시 매달린다.',
        '둘은 서로 다른 바람을 듣는다. 그래도 소소는 이번엔 옆자리를 완전히 비워 두지 않는다.',
      ],
    },
    observation: {
      title: '둘이 탄 바람',
      body: '소소가 찾던 것은 빠른 날개보다, 같은 소리에 반응해 줄 동행이었다.',
    },
  },
] as const satisfies readonly HiddenRequestDefinition[]

export const EMERGENT_EVENTS = [
  {
    id: 'first-night-song',
    title: '빛을 따라온 한 소절',
    actorA: { label: '빛을 품은 주민', requirement: { axis: 'habit', value: '발광' } },
    actorB: { label: '노래하는 주민', requirement: { axis: 'habit', value: '노래' } },
    prop: '그네',
    time: '해질녘',
    scene: '{actorA}의 빛이 그네 밑을 스치자 {actorB}가 잠에서 깨어 짧은 노래를 붙인다.',
    observation: '서로 약속한 적 없는 빛과 노래가 정원의 저녁 인사가 되었다.',
  },
  {
    id: 'wind-listening-duet',
    title: '같은 바람을 들은 둘',
    actorA: { label: '마음을 맞추는 주민', requirement: { axis: 'skill', value: '교감' } },
    actorB: { label: '노래하는 주민', requirement: { axis: 'habit', value: '노래' } },
    prop: '바람 종',
    time: '해질녘',
    scene: '{actorA}가 바람 종의 떨림에 귀를 기울이자 {actorB}가 같은 높이의 콧노래로 화답한다.',
    observation: '서로 다른 모습의 두 주민이 같은 바람을 듣는 동안 정원에 새로운 화음이 머물렀다.',
  },
  {
    id: 'pond-bounce-parade',
    title: '연못의 동그란 행진',
    actorA: { label: '물길을 아는 주민', requirement: { axis: 'movement', value: '헤엄치기' } },
    actorB: { label: '튀어 오르는 주민', requirement: { axis: 'habit', value: '통통 튀기' } },
    prop: '연잎',
    time: '낮',
    scene: '{actorA}가 만든 잔물결 위로 {actorB}가 연잎을 하나씩 건너뛴다.',
    observation: '잔잔한 물길도 누군가의 발밑에서는 신나는 행진로가 된다.',
  },
  {
    id: 'workshop-question',
    title: '고친 풍경의 첫 질문',
    actorA: { label: '고치는 주민', requirement: { axis: 'skill', value: '수리' } },
    actorB: { label: '궁금한 주민', requirement: { axis: 'temperament', value: '호기심' } },
    prop: '바람 풍경',
    time: '낮',
    scene: '{actorA}가 풍경을 고치는 동안 {actorB}가 나사마다 코를 대고 이유를 묻는다.',
    observation: '고치는 손과 묻는 눈이 만나자 낡은 풍경에 전에 없던 음이 생겼다.',
  },
  {
    id: 'kite-tail-friend',
    title: '꼬리에 매달린 산책',
    actorA: { label: '바람을 타는 주민', requirement: { axis: 'movement', value: '활공' } },
    actorB: { label: '붙어 다니는 주민', requirement: { axis: 'habit', value: '달라붙기' } },
    prop: '풍향 리본',
    time: '해질녘',
    scene: '{actorB}가 {actorA}의 꼬리 끝을 붙잡자 둘이 리본처럼 정원 위를 한 바퀴 돈다.',
    observation: '혼자 타던 바람에 작은 승객 하나가 생겼다.',
  },
] as const satisfies readonly EmergentEventTemplate[]

export const AUTO_NAMES = [
  '잔불',
  '보리',
  '포실',
  '누리',
  '모아',
  '단추',
  '파도',
  '해온',
  '도토',
  '라온',
  '후추',
  '자몽',
  '여울',
  '토리',
  '마루',
  '콩비',
  '초롱',
  '나비',
  '구름',
  '소금',
  '봄비',
  '오후',
  '푸름',
  '모찌',
] as const

export const ANALYZER_COPY = {
  cardTitles: [
    '몽실한 여백씨',
    '반달콩',
    '종이숲 꼬물이',
    '겹선 조약돌',
    '바람결 씨앗',
    '느린 파문이',
    '모서리 단추',
    '살랑 점박이',
    '동그란 새벽이',
  ],
  cardSummaries: [
    '선 사이의 작은 망설임까지 몸짓으로 간직한 생명으로 읽혔어요.',
    '종이 위를 건너며 주변의 박자를 천천히 배우는 생명으로 읽혔어요.',
    '서로 다른 흔적을 한 몸에 포개어 품은 생명으로 읽혔어요.',
    '여백을 겁내지 않고 자기만의 속도로 움직이는 생명으로 읽혔어요.',
    '색과 선이 만난 자리를 오래 기억하는 생명으로 읽혔어요.',
  ],
  emptyReason: '아직 선이 아주 적어서, 시작점과 남겨 둔 여백을 조심스럽게 읽었어요.',
  reasons: {
    movement: {
      걷기: '아래쪽을 길게 가로지른 획이 바닥을 차분히 짚는 몸짓처럼 보여요.',
      구르기: '되돌아 겹친 선이 몸을 둥글게 말아 앞으로 옮기는 흔적 같아요.',
      활공: '위로 뻗은 획과 넓게 남은 여백이 바람을 타는 몸짓처럼 보여요.',
      헤엄치기: '좌우로 이어지는 선의 흐름이 잔잔한 물결을 가르는 꼬리처럼 보여요.',
    },
    skill: {
      탐색: '중심에서 가장자리로 뻗은 선들이 주변을 하나씩 살피는 더듬이 같아요.',
      운반: '중심을 감싸며 모인 획이 무언가를 소중히 받쳐 든 품처럼 보여요.',
      수리: '끊긴 자리로 되돌아와 포갠 획이 틈을 꼼꼼히 잇는 손길 같아요.',
      교감: '서로 다른 방향과 색의 선이 한곳에서 만나 박자를 주고받고 있어요.',
    },
    temperament: {
      호기심: '종이의 낯선 가장자리까지 나아간 선에서 망설임보다 궁금함이 먼저 보여요.',
      다정함: '따뜻한 색이 중심을 감싸고, 가까운 선끼리 자리를 내어 주고 있어요.',
      꼼꼼함: '짧은 선을 여러 번 겹쳐 빈틈을 채운 자국이 세심하게 남아 있어요.',
      느긋함: '길게 이어진 획과 넉넉한 여백이 서두르지 않는 호흡처럼 보여요.',
    },
    place: {
      정원: '아래쪽에 내려앉은 선과 풀빛이 흙 가까이에 머물고 싶어 하는 듯해요.',
      연못: '차가운 색과 옆으로 번진 획이 물가에 누운 잔물결을 닮았어요.',
      공방: '여러 선이 중심에서 맞물린 자리가 작은 작업대처럼 단단해 보여요.',
      광장: '가운데로 고르게 모인 색과 선이 모두가 지나는 자리를 만들고 있어요.',
    },
    habit: {
      발광: '밝고 따뜻한 색이 겹친 자리에서 종이 안쪽의 빛이 새어 나오는 듯해요.',
      노래: '비슷한 길이의 획이 반복되어 조용한 후렴처럼 리듬을 만들어요.',
      '통통 튀기': '짧고 위아래로 선 획들이 바닥을 차례로 박차는 박자처럼 보여요.',
      달라붙기: '여러 획이 같은 자리를 거듭 지나며 서로 놓치지 않으려는 듯해요.',
    },
  } satisfies AnalyzerTraitReasonCopy,
} as const

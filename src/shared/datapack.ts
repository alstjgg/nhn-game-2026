/**
 * Datapack types — the shape of one scenario's contents.
 *
 * ⚠ GENERATED FILE — do not edit by hand.
 * Source: `data/scenario/_schema/*.schema.json` (normative — pipeline §3,
 * physical §3.1). Regenerate with
 * `node authoring/generate-datapack-types.mjs`;
 * `--check` fails on drift. If this file and the schemas disagree, this
 * file is stale — never the other way around.
 *
 * Constraints TS cannot express (patterns, minItems, non-zero deltas) live in
 * the schemas and in lint-datapack.mjs; this file carries structure only. The
 * engine never reads a file — datapacks arrive already parsed (physical
 * §3.2), so nothing here may import `fs` or `fetch`.
 */

/** datapack meta.json — 시나리오 식별과 시계 */
export type Meta = {
  /** 데이터팩 디렉터리 이름. data/scenario/<slug>/ */
  slug: string;
  title: string;
  /** 초안 §1 로그라인 원문 */
  logline: string;
  /** 시나리오 시계 — 고정 타임라인의 첫 사건과 종료 시계 */
  clock: {
    start: string;
    end: string;
  };
  /** D-Day 표기. 초안에 날짜가 없으면 null */
  dday?: string | null;
};

/** datapack timeline.json — 무개입 고정 타임라인 */
export type Timeline = {
  events: Array<{
    /** 이 사건이 상태에 새기는 효과 — 엔진 명세 §1.2 액추에이터 (b)의 데이터 슬롯. 초안에는 사건의 서사형만 있으므로 컴파일 시 null; 게이트 하드닝 단계에서 기계형이 붙는다(린트가 미완 플래그). 증상 커버리지 린트(E7)의 소스. object/null 평탄형인 이유: 객체 키워드는 null에 no-op이라 anyOf와 의미 동일하면서 위반 진단이 필드 단위로 정확해진다 (#104 리뷰 1(a)) */
    effects: {
      /** 스칼라 변수 → 비-0 정수 델타. 버킷 델타와 같은 map 형태(매뉴얼 §5 · 엔진 명세 §1.3 — 0 금지는 린트 E8이 잡는다) */
      deltas: Record<string, number>;
      /** 플래그 id → set(true)/unset(false) */
      flags: Record<string, boolean>;
    } | null;
    /** 이 비트의 등장 인물 — Call 2 PRESENT_NPCS의 데이터 슬롯. side는 장식이 아니다(콜 계약 §3: line=회선 너머 · room=상황실 안 — 화자 오배정을 0으로 만든 유일한 수단). null = 하드닝 전 · 빈 배열 = NPC 대사 없는 비트. 하드닝 오버레이가 채운다. array/null 평탄형 — effects와 같은 근거 */
    present: Array<{
      char_id: string;
      side: "line" | "room";
    }> | null;
    id: string;
    time: string;
    /** 사건이 관측되는 표면 — 통화 / CCTV / 현장 / 문서·기록 화면 */
    surface: "call" | "cctv" | "onsite" | "document";
    /** places.json의 장소 id. 특정 장소에 속하지 않으면 null */
    place_id?: string | null;
    /** 사건 서술 원문 — 채굴 광맥이 되는 문장 */
    text: string;
    exposure: {
      /** 이 시계까지 생존한 런에만 보인다. null = 초반 런에도 보임 */
      visible_from: string | null;
      /** 시계 외 추가 노출 조건의 자유 서술(예: 현장을 들여다본 런). 하드닝 시 술어로 승격 — 린트가 미완 플래그를 단다 */
      extra_condition?: string | null;
    };
  }>;
};

/** datapack characters.json — 인물 */
export type Characters = {
  characters: Array<{
    id: string;
    name: string;
    age?: number | null;
    role: string;
    /** 이해관계 — 이 인물이 지키려는 것 */
    interest: string;
    knows: Array<string>;
    doesnt_know: Array<string>;
    /** 눈금 — 인물당 최대 2 (가이드 §5) */
    meters: Array<{
      id: string;
      label: string;
      /** 엔진 상태 변수 이름(델타·증상 키가 이 이름을 쓴다). 하드닝 오버레이가 바인딩 — 초안 단계에는 null */
      variable: string | null;
      /** 초기값. 하드닝 오버레이가 채운다 — 초안 단계에는 null(린트가 미완 플래그) */
      initial: number | null;
    }>;
    /** 걸치는 줄기 — 이 인물이 걸친 진실·갈림길. 린트의 소급성 검사 입력 */
    strands: {
      truth_ids: Array<string>;
      gate_ids: Array<string>;
    };
  }>;
};

/** datapack places.json — 장소와 장소별 정보 산출 */
export type Places = {
  places: Array<{
    id: string;
    name: string;
    /** 어떤 정보가 그곳에서만 나오는지 한 줄(집필 스킬 §4-4) */
    desc: string;
    yields: Array<{
      /** 이 정보가 나오는 시계. 시계로 특정되지 않으면 null + depth_note */
      clock: string | null;
      /** 시계로 못 적는 깊이 조건의 자유 서술(예: 재방문한 런, 깊은 런). 하드닝 시 술어로 승격 */
      depth_note: string | null;
      /** 그곳에서만 나오는 정보 */
      info: string;
    }>;
  }>;
};

/** datapack temperament.json — 기질 (기본 성향 + 조건절) */
export type Temperament = {
  /** 기본 성향 산문 — 무개입 시 에이전트의 판단 습관 */
  default_disposition: string;
  /** · minItems 0 — 그래프 선행 방식은 조건절을 쓰지 않는다(자물쇠 대신 자명한 앎). */
  clauses: Array<{
    id: string;
    /** 축 이름(두려움, 지워짐, …) */
    axis: string;
    /** 이 축의 전유 어휘. 세계의 다른 곳(특히 stance 라벨)에 흔하면 자물쇠가 무뎌진다(가이드 §4-2) */
    axis_vocabulary: Array<string>;
    /** 조건절 본문 */
    condition: string;
    /** 패배 조건 — '단, …할 때는 그렇지 않다'(가이드 §4-1) */
    defeat_condition: string;
  }>;
};

/** datapack gates.json — 게이트 카드 (정본: gate-hardening-manual §5) */
export type Gates = {
  gates: Array<{
    gate: string;
    /** 초안의 갈림길 제목(「…」) */
    title?: string | null;
    /** 이 갈림길이 서는 시각. 무개입 선에 없는 게이트는 null 가능 */
    clock?: string | null;
    /** places.json의 장소 id */
    place_id?: string | null;
    /** 무개입 선에 없는 게이트의 등장 조건 자유 서술(예: 특정 가지에서만). 하드닝 시 술어로 승격 */
    availability?: string | null;
    /** 카드 앞의 산문 — 장면과 긴장 */
    scene?: string | null;
    /** 카드 뒤의 산문 — 통과/실패 가지의 결과 */
    branch_note?: string | null;
    standard_form: string;
    question: string;
    stances: Array<{
      id: string;
      label: string;
      desc: string;
    }>;
    default_stance: string;
    /** 열쇠는 조건 클래스다(축 × 지목 × 인증 종) — 문장이 아니다 */
    key_conditions?: Array<{
      id: string;
      axis: string;
      referent: string;
      species: "사실" | "자기서술";
      targets_clause: string;
    }>;
    /** 조건마다 2개 이상 — 린트가 조건별 개수를 검사한다 */
    key_examples?: Array<{
      for: string;
      text: string;
      /** 채굴 위치 — 반드시 이 게이트 이전 */
      mined_from: string;
    }>;
    /** 예: c → d */
    predicted_shift?: string | null;
    /** 옳은 정서, 틀린 사람 — 미끼 문장과 위치 */
    false_leads: Array<string>;
    /** 하드닝 산출물. 컴파일 시 빈 배열 허용 — 린트가 미완 플래그 */
    buckets: Array<{
      id: string;
      stances: Array<string>;
      /** 변수명 → 비-0 정수 delta (엔진 명세 §1.3 — 증상 룩업이 정수 min 구간 매치라 소수는 어떤 문장에도 안 걸리고 0은 렌더 탈락. 0 금지는 린트 E8이 잡는다). 초안 수준이면 충분(정본 §5) */
      deltas: Record<string, number>;
      /** 구조 결과 — 게이트 stance가 세계 상태에 남기는 플래그 (timeline effects.flags와 같은 상태 모델). 인과 통화 게이트는 deltas, 구조 게이트는 flags가 주 배출구다 */
      flags: Record<string, boolean>;
    }>;
    /** 하드닝 산출물. 컴파일 시 빈 배열 허용 — 린트가 미완 플래그 */
    edge_predicates: Array<string>;
  }>;
};

/** datapack truths.json — 숨겨진 진실과 운반 문장 레지스트리 */
export type Truths = {
  truths: Array<{
    id: string;
    /** 진실 한 문장 */
    statement: string;
    /** 그 진실을 실어 나르는 문장 3개 이상(집필 스킬 §4-5) */
    carriers: Array<{
      id: string;
      /** 문장 원문 */
      text: string;
      /** 그 문장이 나오는 자리 — 표면 · 시계 깊이 · 몇 번째 런쯤 */
      where: string;
    }>;
    /** 거짓 단서 — 옳은 정서, 틀린 사람 */
    false_leads: Array<{
      id: string;
      text: string;
      where: string;
    }>;
  }>;
};

/** datapack score.json — 집계 단위와 무개입 기준 */
export type Score = {
  units: Array<{
    id: string;
    label: string;
    /** 무엇이 집계되나 */
    tallies: string;
    /** 무개입 기준값 — 구체적인 숫자로 */
    baseline: string;
    /** 이 단위가 소급되는 갈림길 */
    attributed_gates: Array<string>;
    /** 하드닝 산출물 — 상태 → 집계값 술어. 컴파일 시 빈 배열 허용(린트가 미완 플래그) */
    predicates: Array<string>;
  }>;
  /** 무개입 기준 점수 요약 — 고정 타임라인이 예정대로 일어난 결과 */
  baseline_summary: string;
  variance_notes?: {
    /** 못 막은 런들끼리 점수가 갈리는 방식 */
    failed_runs: Array<string>;
    /** 막은 런에 남는 값 */
    saved_runs: Array<string>;
  };
};

/** datapack symptoms.json — 상태 변화 → 증상 문장 (엔진 명세 §2.2) */
export type Symptoms = ({
  flags?: Record<string, {
    /** false→true 시 증상 문장 */
    set?: string | null;
    /** true→false 시 증상 문장 */
    unset?: string | null;
  }>;
} & Record<string, {
  up?: Array<{
    /** 적용되는 최소 변화량 |after−before|. min:1 항목이 방향의 바닥을 받친다(커버리지 린트) */
    min: number;
    /** 증상 문장. 숫자 금지(I12 — 린트가 잡는다). {who}는 변수 소유 인물 이름으로 치환 */
    text: string;
  }>;
  down?: Array<{
    /** 적용되는 최소 변화량 |after−before|. min:1 항목이 방향의 바닥을 받친다(커버리지 린트) */
    min: number;
    /** 증상 문장. 숫자 금지(I12 — 린트가 잡는다). {who}는 변수 소유 인물 이름으로 치환 */
    text: string;
  }>;
}>);

/** One scenario's full pack — `data/scenario/<slug>/`, keyed by file. */
export type Datapack = {
  meta: Meta;
  timeline: Timeline;
  characters: Characters;
  places: Places;
  temperament: Temperament;
  gates: Gates;
  truths: Truths;
  score: Score;
  symptoms: Symptoms;
};

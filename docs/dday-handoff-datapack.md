# 데이터팩 핸드오프 — 두 트랙 경계의 첫 실물 교환 (준비분)

> **지위:** pipeline §2 stage 5의 데이터 트랙 측 준비 문서. 시나리오는
> **우는다리**로 확정(08-01, 민서 결정). 아키텍처 트랙의 소비 확인(스위트
> 생성기 · 엔진 로드)이 남은 절반이며, §4가 그 확인 목록이다.
> **대상 팩:** `data/scenario/우는다리/` — 린트 ERROR 0, G1 하드닝 완료.

## 1. 엔진 로드 — 파일별 소비자와 상태

| 파일 | 엔진/컴포저가 읽는 것 | 상태 |
|---|---|---|
| `gates.json` | G1: stance 셋 · `default_stance`(콜 실패 fallback + 프로브 예측) · buckets 3 · deltas | ✅ G1 하드닝 완료. `edge_predicates`는 빈 배열 — 라우팅 어휘(§4-2) 대기 |
| `characters.json` | 눈금의 **변수 바인딩**: c1 서지형 `trust`(초기 40) · `fear`(초기 55) | ✅ 엔진 명세 §1.1의 잠정 변수 이름에 맞춤 — 재바인딩 시 오버레이만 수정 |
| `symptoms.json` | 증상 렌더러 룩업 (명세 §2.2 형식) | ✅ G1 도달 가능 (변수,방향) 전부 커버 — 커버리지 린트 통과 |
| `timeline.json` | 고정 사건 렌더 · 노출 게이팅 · `effects` · `present` | ✅ G1 라운드(t1–t6) 비트 명단 채움. effects는 전부 null(G1 라운드에 이벤트 효과 없음 — 의도) |
| `temperament.json` | Call 1·3의 `TEMPERAMENT` (같은 파일) | ✅ |
| `meta.json` / `places.json` / `truths.json` / `score.json` | 시계 · 장소 · 오라클 메타데이터 · 종료 집계 | ✅ (score `predicates`는 하드닝 잔여) |

전 파일이 파싱된 객체로 소비 가능(엔진은 파일을 읽지 않는다 — 물리 §3.2).
로딩은 `client`(fetch)/`tools`(fs) 소관.

## 2. 스위트 생성기 — 게이트 카드 → 프로브 스위트 매핑

G1 카드로 사람 검증 완료. 카드의 모든 소비 필드가 존재한다:

| 스위트 슬롯/암 | 팩 소스 |
|---|---|
| `GATE_QUESTION` | `gates[].question` |
| `STANCE_SET` (`{id, label}`) | `gates[].stances`에서 desc 제외 투영 |
| 기본 분포 예측값 | `gates[].default_stance` + `predicted_shift` |
| live 주입 암 | `gates[].key_examples` (조건별 ≥2 — 린트 E5가 보증) |
| placebo 암 (같은 축, 지목 오도) | `gates[].false_leads` |
| `TIMELINE_EXCERPT` 픽스처 | `timeline.events` 중 `time ≤ 게이트 clock`이고 노출 조건상 1런에 보이는 것 — G1(09:25): t1·t2 |
| 기질 픽스처 | `temperament.json` (하네스는 md 픽스처를 쓰므로 생성기가 산문 조립: `default_disposition` + 조건절) |

## 3. 컴포저 슬롯 ⟷ 팩 — 계약 §6 supplier 대조에서 결정·발견한 것

1. **`FIXED_NPC_ACTION` := 그 비트 고정 사건의 `text`** (바인딩 결정). 계약의
   요건("이미 일어난 것으로 서술된 문장", 통제관 응답 비요구 — §6.1은 저작
   규칙 + `lint-beat`가 검사)을 타임라인 사건 문장이 그대로 충족한다.
   별도 필드를 만들지 않는다.
2. **`PRESENT_NPCS` := `timeline.events[].present`** (v0.3 신설). `{char_id,
   side}` — side(line/room)는 화자 오배정을 0으로 만든 유일한 수단이라
   데이터에 산다. 하드닝 오버레이가 채우고, 린트가 인물 참조를 검사한다.
3. **비인물 화자 주의**: t6(11:07 익명 제보)의 발신자는 인물이 아니므로
   `present`에 없다 — 계약 §3의 soft 처리(명단 밖 화자 드롭)가 안전망이고,
   사건 텍스트 자체가 제보 내용을 이미 실어 나른다.
4. **`REPORT_GUIDANCE`의 소재가 없다** — 계약은 "`data/`의 분량·형식 정책"
   이라고만 적었고 데이터팩(시나리오 종속)도 아니고 어느 파일도 아니다.
   시나리오 무관 정책이므로 `data/policy/report-guidance.json` 같은 팩 밖
   자리를 제안 — §4 확인 후 §3 개정 없이 별도 파일로 간다.

## 4. 윤석 귀환 시 확인 목록

1. `timeline.events[].effects` 형태 확인 (스칼라 델타 map + 플래그 —
   #102 코멘트에서 요청함).
2. **라우팅 어휘** — `edge_predicates`가 가리킬 노드/술어의 형태. 이것이
   와야 G1 하드닝의 마지막 필드가 닫힌다. 최소 엔진(게이트 1)은 빈 배열로
   돌 수 있는지도 함께.
3. `datapack.ts` = `_schema/` 전사 합의 (#102 코멘트).
4. `REPORT_GUIDANCE` 소재 (§3-4).
5. 소비 확인 실행: 스위트 생성기가 G1 카드를 먹는가 · 엔진이 이 팩을
   로드해 §7 판정 1(라운드 1회 완주)을 도는가 — **이 둘이 통과하면 stage
   5가 닫힌다.**

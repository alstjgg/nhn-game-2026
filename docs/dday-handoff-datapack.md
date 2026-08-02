# 데이터팩 핸드오프 — 두 트랙 경계의 첫 실물 교환 (준비분)

> **지위:** pipeline §2 stage 5의 데이터 트랙 측 준비 문서. 시나리오는
> **우는다리**로 확정(08-01, 민서 결정). 아키텍처 트랙의 소비 확인(스위트
> 생성기 · 엔진 로드)이 남은 절반이며, §4가 그 확인 목록이다.
> **대상 팩:** `data/scenario/우는다리/` — 린트 ERROR 0, **G1–G7 하드닝
> 완료**(buckets · predicted_shift · 비트 명단 · 사건 효과 · 증상). 남은
> FLAG는 전부 §4의 어휘/상태모델 확인에 걸려 있다.

## 1. 엔진 로드 — 파일별 소비자와 상태

| 파일 | 엔진/컴포저가 읽는 것 | 상태 |
|---|---|---|
| `gates.json` | G1–G7: stance 셋 · `default_stance`(콜 실패 fallback + 프로브 예측) · `predicted_shift` · buckets(deltas + **flags**) | ✅ 전 게이트 하드닝 완료. 통화 게이트(G1·G4·G7)는 trust/fear 델타, 구조 게이트(G2·G3·G5·G6)는 플래그 배출(§3-5). `edge_predicates`는 빈 배열 — 라우팅 어휘(§4-2) 대기 |
| `characters.json` | 눈금의 **변수 바인딩**: c1 서지형 `trust`(초기 40) · `fear`(초기 55) | ✅ 엔진 명세 §1.1의 잠정 변수 이름에 맞춤 — 재바인딩 시 오버레이만 수정. c2–c7 눈금은 미바인딩(§4-6) |
| `symptoms.json` | 증상 렌더러 룩업 (명세 §2.2 형식) | ✅ 도달 가능 (변수,방향) 4방향 + 플래그 16종 set 문장 전부 커버 — 커버리지 린트 통과 |
| `timeline.json` | 고정 사건 렌더 · 노출 게이팅 · `effects` · `present` | ✅ 전 사건(t1–t19) 비트 명단 채움. effects: 세계를 바꾸는 5건(파쇄 t13 · 구금 t14 · 체포 t16 · 개막 t17 · 파단 t18)은 플래그, 나머지 14건은 명시적 무효과(`{}` — 초안 자기검사 5 그대로) |
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
5. **buckets에 `flags` 슬롯 신설** (pipeline §3 v0.4 결정). 구조 게이트
   (G2·G3·G5·G6)의 결과는 발신자 눈금이 아니라 세계 상태다 — `logs_saved`
   `originals_read` `entry_capped` 같은 플래그를 배출하며, 상태 모델은
   timeline `effects.flags`와 동일(불리언 set). 조건부 결과(G6의 취소가
   `logs_saved`일 때만 성립하는 것 등)는 buckets에 **넣지 않았다** — 그
   해석은 edge predicate/엔진 몫이다.

## 4. 확인 목록 — 08-02 #102 답신 반영

1. ~~`timeline.events[].effects` 형태 확인~~ **✅ 승인** (명세 §1.2에
   액추에이터 → 데이터 소재 표 신설 · §4.2 적용 시점 확정: effects →
   journal → 증상 → Call 2). **후속 1건:** 답신이 buckets에 flags 슬롯이
   없다는 전제로 §1.1의 flag write를 스크립트 이벤트 전용으로 좁혔는데,
   같은 날 v0.4가 그 슬롯을 신설했다(§3-5) — 슬롯이 생겼으니 §1.1을
   되넓힐지는 윤석 판단. 최소 엔진은 무관하다(G1 버킷은 플래그 무배출).
2. ~~라우팅 어휘~~ **✅ 답변** — 명세 §4.3 신설: 한 줄 한 술어
   `<변수> <비교> <정수> -> <노드>` · 비교 5종 · flag는 `== true` ·
   마지막 줄 `else` 필수 · 위에서 아래로 첫 참 · **빈 배열 = 런 종료로
   유효**(G1은 비운 채 엔진 투입 가능). 단 문법은 잠정 — **노드 이름의
   소재가 게이트 그래프와 함께 와야** edge_predicates 저작이 열린다.
   score `predicates` · 노출 조건 승격이 같은 언어를 쓰는지는 미정.
3. ~~`datapack.ts` = `_schema/` 전사~~ **✅ 수용** (물리 §3.1 + #103 스텁
   주석 뒤집음). **후속(민서 소유, 물리 §3.1에 "알려진 gap"으로 기록됨):**
   전사 drift를 잡는 장치 — `_schema/`에서 `datapack.ts`를 **생성**하거나,
   린트에 필드 집합 대조를 넣거나. `datapack.ts` 재작성 때 함께 푼다.
4. ~~`REPORT_GUIDANCE` 소재~~ **✅ 합의** — 팩 밖
   `data/policy/report-guidance.json`. 파일 저작은 데이터 트랙 몫으로 남음.
5. **소비 확인 실행 (열림):** 스위트 생성기가 G1 카드를 먹는가 · 엔진이 이
   팩을 로드해 §7 판정 1(라운드 1회 완주)을 도는가 — **이 둘이 통과하면
   stage 5가 닫힌다.**
6. **c2–c7 눈금의 변수 바인딩 여부 (열림):** 엔진 §1.1 상태 모델은 잠정
   trust/fear뿐이라 NPC 눈금은 미바인딩으로 남겼다(FLAG 12건). 상태
   모델을 넓힐지, v0에서는 스펙아웃할지의 결정 사안. (답신은 v0.4 커밋
   이전에 작성되어 이 항목을 보지 못했다.)

**받은 개정 요청 1건 — 처리함:** delta는 비-0 정수 (명세 §1.3·§6-3).
스키마 `integer` 강화 + 린트 E8 신설(0 금지 포함). 명세 §2.3-1의
`magnitude 0 → 렌더 탈락` 결정과 정합.

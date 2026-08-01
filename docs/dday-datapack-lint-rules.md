# 데이터팩 린트 룰셋

> **지위:** [pipeline](./dday-scenario-pipeline.md) §2 stage 2의 룰 정의.
> 구현: `infra/scenario-pipeline/lint-datapack.mjs` (무료 — 콜 0회, 의존성 0).
> 형식의 정본은 `data/scenario/_schema/*.schema.json` — 린트는 그 스키마를
> 그대로 소비한다. 룰을 더하고 싶은 유혹이 스키마로 표현 가능하면 스키마를
> 개정한다(템플릿 원칙: 하드코딩 유혹 = 스키마 구멍).

## 등급 — 셋의 의미가 다르다

| 등급 | 의미 | 처분 |
|---|---|---|
| **ERROR** | 스키마 위반·깨진 참조 — 팩이 소비 불가. 컴파일 실수 | exit 1. 고치고 다시 컴파일 |
| **WARN** | 설계 결함 개연 — A12 어휘 충돌, 소급 안 되는 게이트 | 플래그만, 차단하지 않는다. 부하가 걸린 중복인지는 저자만 안다(A12 원칙) |
| **FLAG** | 하드닝 미완 — 초안 단계 팩의 정상 상태 | 그 목록이 곧 하드닝 작업 목록이다 |

## 룰

### ERROR — 소비 가능성

| # | 룰 | 근거 |
|---|---|---|
| E1 | 8파일 각각이 자기 스키마를 통과한다 (타입·필수 필드·enum·패턴·개수) | pipeline §3 |
| E2 | 열쇠의 인증 종은 `사실 \| 자기서술`뿐 (스키마 enum) — 감정·인용이 정답 경로에 못 들어온다 | 가이드 금지 목록 4 · 매뉴얼 안티패턴 5 |
| E3 | id 중복 없음 (사건·인물·장소·게이트·진실·문장 레지스트리·점수 단위, 게이트 내 stance·조건) | — |
| E4 | 참조 무결성: `place_id` → places · strands → truths/gates · `attributed_gates` → gates · bucket stance → stance 셋 · `default_stance` → stance 셋 · `key_examples.for` → 조건 id | — |
| E5 | **조건마다 예시 문장 2개 이상** — 하나뿐인 자물쇠는 추리가 아니라 제비뽑기 | 매뉴얼 §3-5a (형식이 강제) |

### WARN — 설계 감사

| # | 룰 | 근거 |
|---|---|---|
| W1 | **A12** — stance 라벨·설명이 기질 어휘를 재사용하면 플래그. 축 어휘(`axis_vocabulary`+축 이름)는 라벨·설명 양쪽, 기질 산문 전체 토큰은 라벨만(프로토타입 `lint-stances.mjs`와 동일 거동, 조사 소음 감수) | RUNLOG A12 · 매뉴얼 §2-5 |
| W2 | **소급성** — 어떤 점수 단위도 소급하지 않는 게이트는 장식이다 | 가이드 §5 "원인 없는 결과는 버그" |

### FLAG — 하드닝 미완

| # | 대상 | 하드닝이 채울 것 |
|---|---|---|
| F1 | `buckets` · `edge_predicates` 빈 배열 | 매뉴얼 §5 buckets/delta 초안 |
| F2 | 눈금 `initial: null` | 초기값 |
| F3 | 점수 `predicates` 빈 배열 | 상태 → 집계값 술어 |
| F4 | 자유 서술 노출 조건 (`extra_condition` · `availability` · 장소 yield의 `depth_note`) | 엔진 술어로 승격 |

## 린트가 하지 않는 것

- **종이 검사** (매뉴얼 §6): 타임라인 선점 · 픽스처 여유 · 탈출구 stance —
  사람 1회 독해. 프로토타입의 마지막 줄 경고("두 해석이 서로 다른 stance에
  내릴 자리가 있는가")가 이쪽이다.
- **가이드 금지 목록의 서사 절반** (1·2·5·6·7번) — 문장 독해가 필요해서
  기계 검사 대상이 아니다. 비트 층위의 7번(통제관 응답 요구)은 스위트가
  생기면 `infra/test-harness/lint-beat.mjs`가 잡는다.
- **프로브** — 첫 게이트만, 하네스 소관 (매뉴얼 §6).

## 사용

```bash
node infra/scenario-pipeline/lint-datapack.mjs data/scenario/<slug>
```

exit 0 = 소비 가능 (WARN·FLAG는 보고만) · exit 1 = ERROR 존재.

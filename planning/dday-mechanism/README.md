# 메커니즘 실측 프로그램 — 진입점

> DDAY의 AI 메커니즘 후보를 실제 모델 호출로 측정한 기록이다.
> 이 폴더는 계획 문서가 아니라 **측정 기록**이다. 실험 계획은
> [`docs/plan-mechanism-test.md`](../../docs/plan-mechanism-test.md)에 있다.

## 지금 상태 (2026-07-31 · 검증 프로그램 종료)

**C-BLOCK 채택 · C-STRUCT 완전 제거 (UI 포함).** 문장 블록 한 줄을 넣으면
에이전트의 stance가 `경청 → 공감`으로 9/10 이동했다 (S1, one-sided Fisher
`p=0.0000595`; placebo-controlled·label-independent·negative control clean).
우선순위 목록 조작은 두 독립 프로그램 — 이 계열 8개 구성·190개 유효 응답,
overnight 프로그램의 placebo-controlled 4개 probe — 모두에서 목표 방향의
효과가 없었다.

placebo control(P1a)과 program-wide negative control(P2)은 완료됐다. blind
coding과 player-visible 확인은 07-30 회의에서 생략을 결정했다
([회의록](../meetings/2026-07-30-mechanism-close-spec-first.md)). 대외 문구는
"현재 가장 강한 실측 근거를 가진 기본 메커니즘"까지만 쓴다.

## 무엇부터 읽나

| 순서 | 문서 | 언제 읽나 |
|---:|---|---|
| 1 | [REPORT.md](REPORT.md) | **여기부터.** 두 프로그램을 통합한 최종 판정 카드 — 메커니즘별 결론·경계 법칙·open item disposition |
| 2 | [MECHANISM-DIRECTION-DECISION.md](MECHANISM-DIRECTION-DECISION.md) | 방향 결정문 — 무엇을 만들고 무엇을 안 만드나 |
| 3 | [MECHANISM-DIRECTION-EVIDENCE.md](MECHANISM-DIRECTION-EVIDENCE.md) | 그 결정의 수치·raw·한계. §5는 C-STRUCT 실험 계보 부록 |
| 4 | [RUNLOG.md](RUNLOG.md) | 운영 규칙(A#)과 append-only 실행 로그 |
| 5 | [RUNBOOK-overnight.md](RUNBOOK-overnight.md) | 직접 run을 돌릴 때의 절차와 명령 |

`suites/`와 `runs/`는 사람이 읽는 문서가 아니다. suite JSON은 사전등록,
`runs/*/calls-*.md`와 `metrics-*.json`은 하네스가 생성한 원자료다. 판독은
`node .claude/skills/read-mechanism-run/extract.mjs <EXPERIMENT-ID>`로 한다.

## Source of truth 우선순위

문서끼리 어긋나면 위가 이긴다.

1. [RUNLOG.md](RUNLOG.md) — `A#` amendment가 deep-test plan보다 우선한다
2. 각 suite의 사전등록 (`suites/*.json`)
3. 각 run의 raw `calls-*.md`
4. 각 run의 `metrics-*.json`
5. DECISION / EVIDENCE — 위 자료를 연결한 요약이며 raw를 대체하지 않는다

**raw artifact는 수정하거나 삭제하지 않는다.** 측정 이력이다. RUNLOG는
append-only다. 실패한 구성도 지우지 않는다 — 무엇을 시도했고 무엇이 안 됐는지가
결과의 신뢰도를 만든다.

## 현재 유효한 운영 규칙

전문은 [RUNLOG.md](RUNLOG.md) `## Amendments in force`에 있다. 남은 C-BLOCK
검증에 그대로 적용되는 것들:

| ID | 규칙 |
|---|---|
| A5 | empty-block arm의 조작된 block id는 compliance 수치이지 trace evidence가 아니다 |
| A12 | stance는 behavior orientation이며 temperament의 어휘를 재사용하지 않는다 |
| A13 | probe 간 configuration lever는 하나만 바꾸고 baseline을 다시 측정한다 |
| A14 | saturation 판정은 예측한 stance에 대해서만 한다 |
| A18 | stance는 해당 gate의 실제 output field에서 서로 다른 행동으로 표현될 수 있어야 한다 |
| A20 | drop condition은 floor를 지켜야 하며 검정력에서 도출한다 |
| A21 | 폐기 표본은 stance-neutral하지 않다 — tally를 함께 보고한다 |
| A22 | fixture의 여유는 탈출 경로이며 gate보다 강하게 작동할 수 있다 |

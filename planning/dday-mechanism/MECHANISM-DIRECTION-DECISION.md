# 메커니즘 방향 결정 — C-BLOCK 채택, C-STRUCT 중단

> 결정일: 2026-07-30
> 결정자: 윤석
> 상태: 제품 방향 결정 · 증거는 provisional

## 1. 결정

DDAY의 기본 AI 메커니즘은 **C-BLOCK**으로 가져간다.

```text
플레이어의 문장 블록 선택
  → 에이전트의 상황 해석
  → stance와 행동 변화
  → 플레이어가 확인할 수 있는 결과
```

**C-STRUCT 우선순위 재배열 테스트는 중단한다.**

- 추가 stance·gate·priority rewrite와 live/placebo 실행을 하지 않는다.
- priority UI는 서사 정리 용도로 남길 수 있지만, 순서 변경 효과를 약속하지
  않는다.
- 기존 suite와 raw artifact는 모두 보존한다.
- 이는 제품·연구 우선순위 결정이며, C-STRUCT의 보편적 실패 판정은 아니다.

## 2. 판단 근거

| 채널 | 관찰 | 현재 판단 |
|---|---|---|
| C-BLOCK | S1에서 공감 `0/10 → 9/10`, belief `0/10 → 10/10` | 가장 강한 실측 근거. 제품 core로 채택 |
| C-STRUCT | 결정 시점 7개 구성·180개 유효 응답에서 목표 방향의 비교 효과 없음 | 추가 탐색의 정보가치가 낮아 중단 |

C-BLOCK의 S1 raw stance sequence는 baseline
`c,c,c,c,c,c,c,c,c,c`, live `d,d,d,d,d,d,c,d,d,d`였다
(one-sided Fisher `p=0.0000595`). 반면 C-STRUCT의 가장 큰 독립 비교는
baseline `b14/20`, live `b12/20`, placebo `b11/20`으로 목표 방향 증가가
없었다.

결정 뒤 이미 준비돼 있던 C-STRUCT gate rewrite의 baseline 10회가 한 번 더
실행됐다. 내부 이유는 더 잘 갈렸지만 player-visible 행동은 여전히 분리되지
않아 결정을 바꾸지 않았다. 따라서 누계는 8개 구성·190개 유효 응답이지만,
중단 결정의 근거 표본은 7개 구성·180개다.

수치, raw sequence, 실험별 진단과 한계는
[증거 부록](MECHANISM-DIRECTION-EVIDENCE.md)에 분리했다.

## 3. 해석

지금까지의 C-STRUCT probe는 각 구성 안에서 한 변수만 바꾸고 raw를 보존했기
때문에 무효한 테스트는 아니다. 다만 결과를 본 뒤 구성을 계속 바꾸면 연구자
자유도가 커지고, 자연스러운 게임 문장보다 “통과하는 프롬프트”를 찾게 될
위험이 커진다.

현재는 C-STRUCT를 더 탐색하는 것보다, 이미 강한 신호가 나온 C-BLOCK의
attribution과 실제 게임 표면을 검증하는 편이 낫다.

## 4. 제품 범위

**Core**

- 문장 블록의 획득·선택·주입
- 블록에 따른 belief/stance 변화
- 변화가 대사·행동·후속 상태에 드러나는 피드백

**제외**

- priority reorder를 핵심 조작으로 홍보
- C-STRUCT 효과를 대회 evidence로 사용
- priority-depth 퍼즐과 C-BLOCK×C-STRUCT 간섭 테스트

## 5. C-BLOCK에 남은 검증

C-BLOCK은 제품 방향으로 채택했지만 아직 “공식 검증 완료”는 아니다.

1. **Placebo control** — 의미가 아니라 문장 추가 자체가 만든 효과인지 구분
2. **Program-wide negative control** — 무관한 조작에도 하네스가 차이를
   만드는지 확인
3. **B3a blind coding** — arm을 가린 독립 판독
4. **Player-visible/Tier-B** — stance 변화가 실제 게임 결과에 충분히 드러나는지
   확인

따라서 대외 문구는 **“현재 가장 강한 실측 근거를 가진 기본 메커니즘”**으로
쓴다. “C-BLOCK 전체가 검증됐다”는 표현은 위 항목이 끝날 때까지 쓰지 않는다.

## 6. C-STRUCT 재개 조건

다음 조건을 모두 만족하는 새 연구 질문이 있을 때만 재개한다.

- 실제 제품에서 priority reorder가 꼭 필요하다.
- 자연스럽게 상호 배타적인 행동과 player-visible output이 있다.
- baseline floor/ceiling과 검정력을 먼저 확인한다.
- 기존 J1 최적화를 이어가지 않고, held-out confirmatory run을 사전 고정한다.

## 7. 문서 체계

1. 이 문서 — 현재 결정과 작업 범위
2. [증거 부록](MECHANISM-DIRECTION-EVIDENCE.md) — 핵심 수치·해석·한계
3. [C-STRUCT 상세 handoff](CSTRUCT-J1-TEST-HANDOFF.md) — 190개 호출의 실험
   계보와 raw index
4. [RUNLOG](RUNLOG.md) — append-only 운영 규칙과 source of truth

이 문서는 raw 결과나 RUNLOG를 대체하지 않는다.

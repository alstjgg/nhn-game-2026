# 메커니즘 방향 결정 — 증거 부록

> 기준일: 2026-07-30
> 상태: provisional · pre-negative-control · 공식 verdict 아님
> 연결 문서: [방향 결정문](MECHANISM-DIRECTION-DECISION.md)

## 1. 이 문서의 역할

이 부록은 C-BLOCK 채택과 C-STRUCT 중단 판단에 직접 사용한 실측만 요약한다.
모든 호출과 진단 계보는 [C-STRUCT 상세 handoff](CSTRUCT-J1-TEST-HANDOFF.md),
운영 규칙은 [RUNLOG](RUNLOG.md)를 따른다.

belief, reason, player-visible 행동 수치는 probe 판독자가 수동 코딩했으며
blind가 아니다. 독립 B3a 전에는 보조 신호로만 읽는다.

## 2. C-BLOCK 근거 — `S1-stanceset-J1`

### Probe

Gate:

> 회선 A의 첫 통화다. 첫 마디로 무엇을 하는가?

| ID | stance |
|---|---|
| a | 추궁 — 묻고, 답을 받아낸다 |
| b | 압박 — 이쪽의 권한을 드러내 물러서게 한다 |
| c | 경청 — 말이 끝날 때까지 개입하지 않는다 |
| d | 공감 — 전달되는 내용이 아니라 말하는 사람에게 향한다 |

| arm | block | prompt |
|---|---|---:|
| baseline | `(없음)` | 1,263 chars |
| live | `f_script` — “회선 저쪽 사람은 시켜서 읽고 있다. 읽지 않으면 자기가 다칠까 봐 겁내고 있다.” | 1,314 chars |

arm 간 차이는 `[알려진 것]`의 `f_script` 한 줄뿐이다.

### Signals

| measured on | baseline | live | one-sided p |
|---|---:|---:|---:|
| stance `d 공감` | 0/10 | 9/10 | 0.0000595 |
| coercion/fear belief | 0/10 | 10/10 | 0.0000054 |
| 안전 여부를 직접 묻는 utterance | 0/10 | 3/10 | 탐색적 |

Raw sequences:

- stance — baseline `c,c,c,c,c,c,c,c,c,c`
- stance — live `d,d,d,d,d,d,c,d,d,d`
- coercion/fear belief — baseline `R,R,R,R,R,R,R,R,R,R`
- coercion/fear belief — live `F,F,F,F,F,F,F,F,F,F`
- 안전 질문 — baseline `N,N,N,N,N,N,N,N,N,N`
- 안전 질문 — live `N,N,N,N,N,Y,N,Y,N,Y`

`R/F`, `N/Y`는 이 부록에서 각각 belief 비채택/채택, 안전 질문 없음/있음을
표시한 수동 코딩 기호다.

Compliance:

| arm | kept | discards | schema retries | foreign tools |
|---|---:|---:|---:|---:|
| baseline | 10/10 | 0 | 0 | 0 |
| live | 10/10 | 0 | 0 | 0 |

관찰된 흐름은 다음과 같다.

```text
f_script 추가
  → caller를 강요받고 겁먹은 사람으로 해석
  → 경청(c)에서 공감(d)으로 이동
  → 일부 응답에서 안전 확인 질문으로 표면화
```

### 한계

- placebo arm이 없다.
- timeline이 이미 “준비된 문장을 읽는다”는 cue를 포함한다. `f_script`는
  여기에 강요·공포를 추가한 구성이다.
- player-visible 안전 질문은 live 3/10으로 stance 이동 9/10보다 약하다.
- belief와 utterance 수동 코딩은 probe 작성자와 독립적이지 않다.
- 한 gate와 한 block species의 결과를 C-BLOCK 전체로 일반화할 수 없다.

Artifacts:

- [suite](suites/S1-stanceset-J1.json)
- [baseline raw](runs/S1-stanceset-J1-calls/calls-baseline.md)
- [live raw](runs/S1-stanceset-J1-calls/calls-live.md)
- [RUNLOG S1](RUNLOG.md)

## 3. C-STRUCT 근거

### 측정 범위

중단 결정 시점에는 7개 configuration, 180개 유효 응답이 있었다.

| experiment | measured arms | target `b` |
|---|---|---|
| `J1-A` | baseline/live/placebo N10 | 0/10 → 0/10 · placebo 0/10 |
| `J1-S2` | baseline/live/placebo N10 | 5/10 → 4/10 · placebo 2/10 |
| `J1-FRESH` | baseline/live/placebo N10 | 0/10 → 0/10 · placebo 0/10 |
| `FRESH-2STANCE` | baseline N10 | 7/10 · headroom 부족으로 중단 |
| `...-SOURCE` | baseline N10 | 5/10 · calibration |
| `...-SOURCE-N20` | baseline/live/placebo N20 | 14/20 → 12/20 · placebo 11/20 |
| `...-ORIENT` | baseline N10 | 6/10 · player-visible 선제 행동 0/6 |

결정 뒤 이미 준비된 `...-ORIENT-DISPATCH` baseline N10이 한 번 실행됐다.
따라서 보존된 전체 누계는 8개 configuration, 190개 유효 응답이다. 이
후속 baseline은 `a,a,a,b,b,b,b,b,a,b`였고, 실제 선제 조치는 b 6개 중
1개뿐이라 live/placebo를 실행하지 않았다.

### 비교 arm의 raw stance

`J1-A`

- baseline `a,a,c,a,a,a,c,c,c,c`
- live `c,c,a,c,c,d,a,a,a,c`
- placebo `a,c,a,a,c,a,c,a,c,c`

`J1-S2`

- baseline `b,b,a,b,b,a,a,b,a,a`
- live `a,b,a,a,b,a,a,a,b,b`
- placebo `a,a,a,b,a,a,a,a,b,a`

`J1-FRESH`

- baseline `c,a,c,c,c,c,a,c,c,c`
- live `c,c,c,c,c,c,c,c,c,c`
- placebo `c,c,c,a,c,a,a,c,c,c`

`...-SOURCE-N20`

- baseline `b,b,b,a,b,b,b,b,b,b,b,a,b,a,a,b,b,b,a,a`
- live `b,b,a,a,b,b,a,b,b,a,b,a,b,b,a,a,a,b,b,b`
- placebo `a,a,a,b,b,b,a,b,a,b,b,a,a,a,b,b,b,a,b,b`

Target-direction one-sided Fisher:

| experiment | baseline → live | p |
|---|---:|---:|
| `J1-A` | b 0/10 → 0/10 | 1.0 |
| `J1-S2` | b 5/10 → 4/10 | 0.81508 |
| `J1-FRESH` | b 0/10 → 0/10 | 1.0 |
| `...-SOURCE-N20` | b 14/20 → 12/20 | 0.83987 |

어느 full comparison에서도 target `b`가 증가하지 않았다. 이는 “효과가
0임을 증명”한 equivalence test가 아니라, 사전 방향의 증가 신호를 관찰하지
못했다는 뜻이다.

### 무엇이 순서보다 강했나

- K1의 fear/procedure 조건
- 첫 전화의 구체적인 붕괴 시각·장소
- 출처 질문과 위험 질문이 모두 검증에 기여한다는 의미 중첩
- 두 행동을 연속 수행할 수 있어 비용 충돌이 사라지는 가역성
- base의 `[결함]`, `[내력]`, `[책임]` lean
- `09:40 → 13:00`의 3시간 20분 여유

모델이 목록 순서를 못 읽은 것은 아니다. 실제 응답은 우선순위 번호를
명시하기도 했다. 문제는 J1에서 위치보다 위 요인들이 판단과 출력에 더 강하게
작용했다는 점이다.

### 해석 한계

- 0/10 floor 또는 높은 baseline 때문에 일부 구성은 효과를 볼 검정력이 없었다.
- `...-SOURCE-N20`도 baseline 14/20에서 유의해지려면 live가 최소 19/20이어야
  해 25pp 미만 효과를 탐지할 수 없었다.
- discarded payload의 stance가 중립적이지 않았다. 자세한 tally는 RUNLOG
  A18을 따른다.
- 여러 configuration을 탐색했으므로 이후의 nominal `p≤0.05`는 독립
  confirmatory run 없이 증거로 승격할 수 없다.
- ORIENT와 ORIENT-DISPATCH의 reason/action 코딩은 수동·비blind다.

## 4. 중단 판단의 범위

지금까지의 probe는 각 suite 안에서 arm 차이를 한 요소로 제한하고,
calibration을 confirmatory p-value에 합치지 않았으며, 실패한 구성도
보존했다. 따라서 기존 결과를 사후 조작된 테스트로 폐기할 이유는 없다.

다만 구성 탐색을 계속할수록 연구자 자유도가 커지고 실제 게임 문장의
ecological validity가 낮아진다. 현재 데이터가 지지하는 판단은 다음이다.

> J1에서 자연스럽고 player-visible한 C-STRUCT 구성을 찾지 못했고, 추가
> 탐색의 정보가치가 C-BLOCK 검증과 구현에 쓰는 비용보다 낮아졌다.

이는 C-STRUCT의 보편적 실패 verdict가 아니라 program pause다.

## 5. Artifact index

- [방향 결정문](MECHANISM-DIRECTION-DECISION.md)
- [C-STRUCT 상세 handoff](CSTRUCT-J1-TEST-HANDOFF.md)
- [RUNLOG](RUNLOG.md)
- [S1 suite](suites/S1-stanceset-J1.json)
- [S1 baseline raw](runs/S1-stanceset-J1-calls/calls-baseline.md)
- [S1 live raw](runs/S1-stanceset-J1-calls/calls-live.md)

이 부록은 raw artifact와 append-only RUNLOG를 대체하지 않는다.

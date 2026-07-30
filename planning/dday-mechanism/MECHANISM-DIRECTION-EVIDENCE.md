# 메커니즘 방향 결정 — 증거 부록

> 기준일: 2026-07-30
> 상태: provisional · pre-negative-control · 공식 verdict 아님
> 연결 문서: [방향 결정문](MECHANISM-DIRECTION-DECISION.md) · [진입점](README.md)

## 1. 이 문서의 역할

이 부록은 C-BLOCK 채택과 C-STRUCT 중단 판단에 사용한 실측을 담는다. §2~§4가
결정의 근거이고, **§5는 C-STRUCT J1 계열 8개 구성의 실험 계보**다. 운영 규칙과
실행 로그는 [RUNLOG](RUNLOG.md)를 따르며, 이 문서는 raw artifact를 대체하지
않는다.

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
| live | `f_script` — "회선 저쪽 사람은 시켜서 읽고 있다. 읽지 않으면 자기가 다칠까 봐 겁내고 있다." | 1,314 chars |

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
- timeline이 이미 "준비된 문장을 읽는다"는 cue를 포함한다. `f_script`는
  여기에 강요·공포를 추가한 구성이다.
- player-visible 안전 질문은 live 3/10으로 stance 이동 9/10보다 약하다.
- belief와 utterance 수동 코딩은 probe 작성자와 독립적이지 않다.
- 한 gate와 한 block species의 결과를 C-BLOCK 전체로 일반화할 수 없다.

Artifacts:

- [suite](suites/S1-stanceset-J1.json)
- [baseline raw](runs/S1-stanceset-J1-calls/calls-baseline.md)
- [live raw](runs/S1-stanceset-J1-calls/calls-live.md)
- [RUNLOG S1](RUNLOG.md)

## 3. C-STRUCT 근거 — 요약

구성별 상세와 raw sequence는 §5 실험 계보에 있다. 여기서는 중단 판단에 쓴 것만
정리한다.

### 측정 범위

중단 결정 시점에는 7개 configuration, 180개 유효 응답이 있었다.

| # | experiment | measured arms | target `b` |
|---:|---|---|---|
| 1 | `J1-A` | baseline/live/placebo N10 | 0/10 → 0/10 · placebo 0/10 |
| 2 | `J1-S2` | baseline/live/placebo N10 | 5/10 → 4/10 · placebo 2/10 |
| 3 | `J1-FRESH` | baseline/live/placebo N10 | 0/10 → 0/10 · placebo 0/10 |
| 4 | `FRESH-2STANCE` | baseline N10 | 7/10 · headroom 부족으로 중단 |
| 5 | `...-SOURCE` | baseline N10 | 5/10 · calibration |
| 6 | `...-SOURCE-N20` | baseline/live/placebo N20 | 14/20 → 12/20 · placebo 11/20 |
| 7 | `...-ORIENT` | baseline N10 | 6/10 · player-visible 선제 행동 0/6 |

결정 뒤 이미 준비된 8번 `...-ORIENT-DISPATCH` baseline N10이 한 번 실행됐다
(§5.8). 따라서 보존된 전체 누계는 **8개 configuration, 190개 유효 응답**이지만,
중단 결정의 근거 표본은 **7개 구성, 180개**다.

| | 근거 표본 (7구성) | 전체 보존 (8구성) |
|---|---:|---:|
| 유효 응답 | 180 | 190 |
| 전체 시도 | 198 | 208 |
| 폐기 | 18 | 18 |
| foreign tool use | 0 | 0 |
| credential 누출 | 0 | 0 |

### Target-direction one-sided Fisher

| experiment | baseline → live | p |
|---|---:|---:|
| `J1-A` | b 0/10 → 0/10 | 1.0 |
| `J1-S2` | b 5/10 → 4/10 | 0.81508 |
| `J1-FRESH` | b 0/10 → 0/10 | 1.0 |
| `...-SOURCE-N20` | b 14/20 → 12/20 | 0.83987 |

어느 full comparison에서도 target `b`가 증가하지 않았다. 이는 "효과가 0임을
증명"한 equivalence test가 아니라, 사전 방향의 증가 신호를 관찰하지 못했다는
뜻이다.

### 폐기율은 arm 비교를 무효화하지 않았다

사전등록 규칙(§5.1)은 **비교 arm의 폐기율 차이가 15 percentage points를 넘으면
arm-incomparable**로 본다. 실제 3-arm 비교의 폐기율은 다음과 같다.

| experiment | baseline | live | placebo | 최대 차 |
|---|---:|---:|---:|---:|
| `J1-A` | 2/12 · 16.7% | 3/13 · 23.1% | 1/11 · 9.1% | 14.0pp |
| `J1-S2` | 1/11 · 9.1% | 0/10 · 0% | 0/10 · 0% | 9.1pp |
| `J1-FRESH` | 2/12 · 16.7% | 3/13 · 23.1% | 4/14 · 28.6% | 11.9pp |
| `...-SOURCE-N20` | 0/20 · 0% | 1/21 · 4.8% | 0/20 · 0% | 4.8pp |

전부 15pp 미만이므로 이 기준으로는 비교가 성립한다. 다만 RUNLOG **A18**대로
폐기 표본의 stance는 중립적이지 않으므로, 폐기율이 낮다는 것이 편향이 없다는
뜻은 아니다. null 결과에서는 이 편향이 효과를 **숨기는** 방향으로도 작동할 수
있어, 아래 검정력 한계와 함께 읽어야 한다.

### 무엇이 순서보다 강했나

- K1의 fear/procedure 조건
- 첫 전화의 구체적인 붕괴 시각·장소
- 출처 질문과 위험 질문이 모두 검증에 기여한다는 의미 중첩
- 두 행동을 연속 수행할 수 있어 비용 충돌이 사라지는 가역성
- base의 `[결함]`, `[내력]`, `[책임]` lean
- `09:40 → 13:00`의 3시간 20분 여유

모델이 목록 순서를 못 읽은 것은 아니다. 실제 응답은 우선순위 번호를 명시하기도
했다. 문제는 J1에서 위치보다 위 요인들이 판단과 출력에 더 강하게 작용했다는
점이다.

### 해석 한계

- 0/10 floor 또는 높은 baseline 때문에 일부 구성은 효과를 볼 검정력이 없었다.
- `...-SOURCE-N20`도 baseline 14/20에서 유의해지려면 live가 최소 19/20이어야
  해 25pp 미만 효과를 탐지할 수 없었다.
- discarded payload의 stance가 중립적이지 않았다 (RUNLOG A18).
- 여러 configuration을 탐색했으므로 이후의 nominal `p≤0.05`는 독립
  confirmatory run 없이 증거로 승격할 수 없다.
- ORIENT와 ORIENT-DISPATCH의 reason/action 코딩은 수동·비blind다.

## 4. 중단 판단의 범위

지금까지의 probe는 각 suite 안에서 arm 차이를 한 요소로 제한하고, calibration을
confirmatory p-value에 합치지 않았으며, 실패한 구성도 보존했다. 따라서 기존
결과를 사후 조작된 테스트로 폐기할 이유는 없다.

다만 구성 탐색을 계속할수록 연구자 자유도가 커지고 실제 게임 문장의 ecological
validity가 낮아진다. 현재 데이터가 지지하는 판단은 다음이다.

> J1에서 자연스럽고 player-visible한 C-STRUCT 구성을 찾지 못했고, 추가 탐색의
> 정보가치가 C-BLOCK 검증과 구현에 쓰는 비용보다 낮아졌다.

이는 C-STRUCT의 보편적 실패 verdict가 아니라 program pause다. 재개 조건은
[방향 결정문 §6](MECHANISM-DIRECTION-DECISION.md)에 있다.

---

## 5. 부록 — C-STRUCT J1 실험 계보

> 2026-07-30 중단 결정으로 이 계열은 종료됐다. 아래는 보존 기록이며 후속 실행
> 계획이 아니다. C-BLOCK에 이월된 교훈은 §5.9와 RUNLOG A15·A17~A19다.

### 5.1 공통 실험 계약

| 항목 | 값 |
|---|---|
| 모델 | `claude-haiku-4-5-20251001` |
| template | judgment `v0.4` |
| temperament | `K1` |
| 기본 gate | `회선 A의 첫 통화다. 첫 마디로 무엇을 하는가?` |
| C-BLOCK | 모든 C-STRUCT arm에서 `(없음)` |
| baseline | A-B-C-D |
| live | B-A-C-D |
| placebo | A-B-D-C |
| 목표 신호 | live에서 B 대응 stance 증가 |
| placebo 신호 | C/D 교환만으로는 baseline과 유사 |

K1은 일반 상황에서 절차·신원 확인을 먼저 하지만, 신고자가 겁에 질린 사람으로
보이면 확인을 미루고 말을 이어가게 한다. 이 조건문이 J1 선택에 강하게
개입하므로 모든 후반 판독에서 fear reading을 별도 신호로 코딩했다.

최종적으로 사용한 자연어 priority:

| ID | 문장 |
|---|---|
| A | 조치의 근거가 되는 정보는 출처를 확인할 수 있어야 한다. |
| B | 실제 위험에 대한 초기 대응 시간을 놓치지 않는다. |
| C | 보고서에는 확인된 사실과 추정을 구분해 남긴다. |
| D | 사건을 확인한 시각과 판단 근거를 빠짐없이 기록한다. |

통계 및 표본 규칙:

- calibration 표본은 이후 독립 비교의 p-value에 합치지 않는다.
- 목표 stance가 baseline에서 포화되면 live/placebo를 쓰지 않는다.
- 비교 arm의 폐기율 차이가 15 percentage points를 넘으면 arm-incomparable이다.
- `because_block_ids`는 empty-block arm에서 자주 조작된다. RUNLOG A5에 따라
  compliance 수치일 뿐 C-STRUCT trace evidence가 아니다.
- 수동 belief/reason 코딩은 probe 작성자가 했다. verdict card에 쓰려면 별도
  B3a blind coder가 필요하다.

### 5.2 계보 한눈에

| 순서 | experiment | 변경한 것 | 결과 | 다음으로 넘어간 이유 |
|---:|---|---|---|---|
| 1 | `J1-A` | 최초 새 A안 | target `b` 0/30 | `c 관찰`이 A/B 모두 만족하는 escape |
| 2 | `J1-S2` | stance set만 변경 | b `5→4`, placebo `2` | `예비`가 다시 절충안이 됨 |
| 3 | `J1-FRESH` | 실제 시나리오형 fresh suite | c `8→10`, placebo `7` | K1 caller-regulation 축이 지배, b/d 0/30 |
| 4 | `FRESH-2STANCE` | c/d 제거, 질문 2개 | baseline b 7/10 | N10에서 이미 target headroom 부족 |
| 5 | `...-SOURCE` | A 문장만 source-grounding으로 수정 | baseline a5/b5 | 독립 비교 가능한 headroom 확보 |
| 6 | `...-SOURCE-N20` | 독립 N20 비교 | b `14→12`, placebo `11` | 순서 효과 없음; K1 표본 흔들림과 질문 중첩 |
| 7 | `...-ORIENT` | stance만 A12 orientation으로 수정 | baseline a4/b6 | 내부 근거는 8/10 분리, player-visible b는 0/6 |
| 8 | `...-ORIENT-DISPATCH` | gate output surface 변경 | baseline a4/b6 | 결정 이후 실행 · 탈출은 gate가 아니라 fixture 여유 |

각 실험은 **하나의 lever만** 바꾸고 baseline을 다시 측정했다 (RUNLOG A13).
예외는 3번 `FRESH`로, 여러 슬롯이 함께 달라졌으므로 2번과 단일-lever 비교를
하지 않는다.

### 5.3 실험 1 — `J1-A`

Prompt length 세 arm 모두 `1,343 chars`.

Priority: ①확인되지 않은 주장에 따라 잘못 움직일 위험 ②대응 지연 위험
③근거 시간순 정리 ④사건 시각 기록.

| ID | stance |
|---|---|
| a | 검증 — 주장 신뢰도와 근거를 좁힌다 |
| b | 선제 — 불확실성을 감수하고 대비를 앞당긴다 |
| c | 관찰 — 추가 징후가 드러날 여지를 남긴다 |
| d | 경계 — 기만 가능성을 염두에 두고 접촉의 한계를 세운다 |

| arm | raw sequence | tally | target b | discards |
|---|---|---|---:|---:|
| baseline | `a,a,c,a,a,a,c,c,c,c` | a5 · c5 | 0/10 | 2 |
| live | `c,c,a,c,c,d,a,a,a,c` | c5 · a4 · d1 | 0/10 | 3 |
| placebo | `a,c,a,a,c,a,c,a,c,c` | a5 · c5 | 0/10 | 1 |

Fisher one-sided: baseline→live `p=1.0`, baseline→placebo `p=1.0`.

**진단.** `c 관찰`은 틀린 정보로 움직이지 않으면서도 통화를 유지해 추가 정보를
얻는다. 오경보 비용과 지연 비용을 동시에 피하는 escape option이었다. 예측한
`b 선제`는 30개 유효 호출에서 한 번도 선택되지 않았다.

[suite](suites/CSTRUCT-priority-reorder-J1-A.json) ·
[reachability](suites/CSTRUCT-priority-reorder-J1-A.reachability.md) ·
[baseline](runs/CSTRUCT-priority-reorder-J1-A-calls/calls-baseline.md) ·
[live](runs/CSTRUCT-priority-reorder-J1-A-calls/calls-live.md) ·
[placebo](runs/CSTRUCT-priority-reorder-J1-A-calls/calls-placebo.md)

### 5.4 실험 2 — `J1-S2`

`J1-A`에서 **STANCE_SET만** 바꿨다. Prompt length `1,335 chars`.

| ID | stance |
|---|---|
| a | 검증 — 주장 출처와 근거를 좁힌다 |
| b | 예비 — 가역적인 내부 준비를 앞당긴다 |
| c | 경보 — 외부 조치의 시작을 늦추지 않는다 |
| d | 기각 — 근거 없는 주장을 조치 판단에서 제외한다 |

| arm | raw sequence | tally | target b | discards |
|---|---|---|---:|---:|
| baseline | `b,b,a,b,b,a,a,b,a,a` | b5 · a5 | 5/10 | 1 |
| live | `a,b,a,a,b,a,a,a,b,b` | a6 · b4 | 4/10 | 0 |
| placebo | `a,a,a,b,a,a,a,a,b,a` | a8 · b2 | 2/10 | 0 |

Fisher one-sided: baseline→live `p=0.81508`, baseline→placebo `p=0.97136`.

**진단.** `b 예비`가 검증을 계속하면서 내부 준비도 할 수 있는 가역적 절충안으로
해석됐다. stance는 reachability를 얻었지만 A/B 순서에 따라 움직이지 않았다. 이
구성은 추상적인 진단에는 쓸 수 있어도 실제 시나리오 문장과 거리가 있었다.

[suite](suites/CSTRUCT-priority-reorder-J1-S2.json) ·
[reachability](suites/CSTRUCT-priority-reorder-J1-S2.reachability.md) ·
[baseline](runs/CSTRUCT-priority-reorder-J1-S2-calls/calls-baseline.md) ·
[live](runs/CSTRUCT-priority-reorder-J1-S2-calls/calls-live.md) ·
[placebo](runs/CSTRUCT-priority-reorder-J1-S2-calls/calls-placebo.md)

### 5.5 실험 3 — `J1-FRESH`

실제 J1 첫 전화, 자연스러운 목표/보고 원칙, empty blocks를 쓰는 ecological
bridge다. S2와 여러 슬롯이 함께 달라졌으므로 단일-lever 비교는 하지 않는다.
Prompt length `1,300 chars`. Priority A/B를 자연화했다 — A: 확인되지 않은
경보로 불필요한 혼란을 만들지 않는다 / B: 실제 위험에 대한 초기 대응 시간을
놓치지 않는다.

| ID | stance |
|---|---|
| a | 출처 탐색 — 정보가 어디에서 시작됐는지부터 묻는다 |
| b | 위험 구체화 — 무너질 장소와 징후부터 묻는다 |
| c | 긴장 완화 — 목소리의 주인이 통화를 지속하도록 부담을 낮춘다 |
| d | 내부 전환 — 황보람에게 발신 경로 추적을 요청한다 |

| arm | raw sequence | tally | target b | discards |
|---|---|---|---:|---:|
| baseline | `c,a,c,c,c,c,a,c,c,c` | c8 · a2 | 0/10 | 2 |
| live | `c,c,c,c,c,c,c,c,c,c` | c10 | 0/10 | 3 |
| placebo | `c,c,c,a,c,a,a,c,c,c` | c7 · a3 | 0/10 | 4 |

Fisher one-sided: baseline→live `p=1.0`, baseline→placebo `p=1.0`.

**진단.** K1은 스크립트를 읽는 발신자를 겁먹은 신고자일 수 있다고 판독하고
`c 긴장 완화`로 빠졌다. `c`는 상대에게 계속 말하게 하면서 출처·위험 정보를 모두
얻는 escape였다. 목표였던 b와 내부 전환 d는 30개 호출에서 모두 미관찰이었다.

[suite](suites/CSTRUCT-priority-reorder-J1-FRESH.json) ·
[reachability](suites/CSTRUCT-priority-reorder-J1-FRESH.reachability.md) ·
[baseline](runs/CSTRUCT-priority-reorder-J1-FRESH-calls/calls-baseline.md) ·
[live](runs/CSTRUCT-priority-reorder-J1-FRESH-calls/calls-live.md) ·
[placebo](runs/CSTRUCT-priority-reorder-J1-FRESH-calls/calls-placebo.md)

### 5.6 실험 4~5 — `FRESH-2STANCE` · `...-SOURCE`

두 구성 모두 baseline calibration만 측정했다.

**4 `FRESH-2STANCE`** — `FRESH`에서 **STANCE_SET만** 바꿔 c/d escape를 제거했다.
Prompt `1,232 chars`. a 출처 질문 / b 위험 질문 둘뿐.

| arm | raw sequence | tally | discards |
|---|---|---|---:|
| baseline | `a,b,b,a,b,b,b,b,a,b` | a3 · b7 | 1 |

baseline이 이미 b 7/10이었다. N10에서는 live가 최대 b10/10이어도 one-sided
Fisher `p=0.10526`이므로 live/placebo를 실행하지 않았다. 위험 세부 질문 b는 B뿐
아니라 "경보가 진짜인지 알아내는 방법"으로 해석돼 기존 A도 만족했다. 선택지를
둘로 줄였지만 여전히 둘 다 짧고 연속 가능한 정보 수집이라 실질적 비용 충돌이
아니었다.

**5 `...-SOURCE`** — 2STANCE에서 **A 문장만** 바꿨다 (이전: 확인되지 않은 경보로
불필요한 혼란을 만들지 않는다 → 새: 조치의 근거가 되는 정보는 출처를 확인할 수
있어야 한다). 나머지는 동일. Prompt `1,235 chars`.

| arm | raw sequence | tally | discards |
|---|---|---|---:|
| baseline | `a,b,a,b,a,a,b,a,b,b` | a5 · b5 | 0 |

source-grounding 문장이 a와 직접 연결돼 baseline을 50:50으로 내렸다. 이 10개는
표본 크기 산정에만 쓰고 이후 N20 p-value에는 합치지 않았다.

[2STANCE suite](suites/CSTRUCT-priority-reorder-J1-FRESH-2STANCE.json) ·
[raw](runs/CSTRUCT-priority-reorder-J1-FRESH-2STANCE-calls/calls-baseline.md) ·
[SOURCE suite](suites/CSTRUCT-priority-reorder-J1-FRESH-2STANCE-SOURCE.json) ·
[raw](runs/CSTRUCT-priority-reorder-J1-FRESH-2STANCE-SOURCE-calls/calls-baseline.md)

### 5.7 실험 6 — `...-SOURCE-N20` (가장 큰 독립 비교)

SOURCE calibration과 실행 프롬프트는 byte-identical하다. experiment id와
사전등록 N만 바꾸고 세 arm을 각각 독립 20회 측정했다. Prompt `1,235 chars`.

| arm | raw sequence | tally | target b | discards |
|---|---|---|---:|---:|
| baseline | `b,b,b,a,b,b,b,b,b,b,b,a,b,a,a,b,b,b,a,a` | b14 · a6 | 14/20 | 0 |
| live | `b,b,a,a,b,b,a,b,b,a,b,a,b,b,a,a,a,b,b,b` | b12 · a8 | 12/20 | 1 |
| placebo | `a,a,a,b,b,b,a,b,a,b,b,a,a,a,b,b,b,a,b,b` | b11 · a9 | 11/20 | 0 |

Fisher one-sided: baseline→live `p=0.83987`, baseline→placebo `p=0.90460`.
목표였던 b는 A/B를 뒤집은 뒤 `70% → 60%`로 **감소**했고, C/D만 바꾼 placebo에서도
`55%`가 됐다.

**Belief signal.** `F`는 신고자를 겁에 질렸다고 명시적으로 판독한 호출이다.

| signal | baseline | live | placebo |
|---|---:|---:|---:|
| fear reading F | 6/20 | 3/20 | 1/20 |
| F 제외 후 b | 8/14 | 9/17 | 10/19 |

- baseline `R,R,R,U,U,U,U,F,F,F,F,R,F,R,R,F,R,U,R,R`
- live `F,U,R,R,U,R,R,U,U,R,R,R,F,F,U,R,R,U,U,R`
- placebo `U,U,R,U,U,U,R,U,R,R,U,R,R,R,F,R,U,U,U,U`

F 호출은 모두 b를 골랐다. F를 탐색적으로 제외하면 세 arm의 b는
`57% · 53% · 53%`로 거의 같다. 이 조건부 분석은 사전등록된 인과 검정이 아니지만,
관찰된 arm 차이 상당 부분이 K1 belief 표본 흔들림이었다는 진단을 지지한다.

**왜 갈리지 않았나.**

1. 모델은 순서를 읽었다. baseline에서 B를 "우선순위 2번", live에서 "1번"이라고
   명시한 호출이 있다.
2. `위험 질문`도 정보의 구체성·신뢰도를 검증하는 행동으로 읽혀 A를 만족했다.
3. `출처 질문`도 실제 위험을 판별하는 초기 대응의 일부로 읽혀 B를 만족했다.
4. 두 질문은 몇 초 안에 연속 가능하므로 하나를 고른다고 다른 비용을 실제로
   감수하지 않는다.
5. labels가 `...부터 묻는다`라는 completed action description이라 RUNLOG A12
   shape를 위반했다. 자동 vocabulary lint만 clean이었고 human shape audit가
   빠졌다.
6. `09:40 → 13:00` 계산을 5개 호출에서 잘못해 시간 압박 판단에 노이즈가 있었다.

[suite](suites/CSTRUCT-priority-reorder-J1-FRESH-2STANCE-SOURCE-N20.json) ·
[reachability](suites/CSTRUCT-priority-reorder-J1-FRESH-2STANCE-SOURCE-N20.reachability.md) ·
[baseline](runs/CSTRUCT-priority-reorder-J1-FRESH-2STANCE-SOURCE-N20-calls/calls-baseline.md) ·
[live](runs/CSTRUCT-priority-reorder-J1-FRESH-2STANCE-SOURCE-N20-calls/calls-live.md) ·
[placebo](runs/CSTRUCT-priority-reorder-J1-FRESH-2STANCE-SOURCE-N20-calls/calls-placebo.md)

### 5.8 실험 7~8 — `...-ORIENT` · `...-ORIENT-DISPATCH`

**7 `...-ORIENT`** — N20에서 **STANCE_SET만** 바꿨다. Prompt `1,241 chars`.

| ID | stance |
|---|---|
| a | 검증 — 오경보로 시민을 움직이는 비용을 더 크게 본다 |
| b | 선제 — 늦게 움직여 피해를 키우는 비용을 더 크게 본다 |

이 labels는 canned utterance도 completed action description도 아니고, K1의
load-bearing vocabulary를 재사용하지 않으며, 두 비용 중 무엇을 더 크게 보는지
명시한다.

| signal | count | raw sequence |
|---|---:|---|
| stance b | 6/10 | `a,b,b,a,b,a,b,b,a,b` |
| cost rationale 일치 | 8/10 | `A,B,mixed,A,B,A,B,A,A,B` |
| explicit fear | 1/10 | `U,U,R,R,U,U,U,U,U,F` |
| **b가 선제 행동으로 보임** | **0/6** | 여섯 b 모두 정보·신원·출처 질문 |

Compliance: kept 10/10 · discards 0 · schema retries 0 · foreign tool 0 ·
fabricated ids 8/10 calls·17 ids (A5 compliance only) · mean latency 6.1s.

사전등록한 target saturation `b ≥ 8/10`은 발동하지 않았다. 숫자만 보면 비교
가능한 baseline이다. 그러나 두 contingency가 발동했다 — (1) cost rationale가
8/10에서만 stance와 맞았고, (2) 더 중요하게 **`b 선제` 6개 중 player-visible
선제 조치를 표현한 utterance가 0개**였다. 모든 응답이 신원·출처·위치·근거
질문이었다.

현재 gate는 caller-facing `utterance`만 낸다. 반면 `검증/선제`의 차이는 상황실
내부 조치에 있다. 따라서 stance label만 갈리고 실제 출력은 같아지는 **B3b
legibility failure**다. 이 결과로 RUNLOG **A15**가 추가됐다.

**8 `...-ORIENT-DISPATCH`** — ORIENT 판독 직후 제안했던 후속 gate(출력면을 실제
조치 지시로 변경)를 **중단 결정 이전 판본을 근거로 한 번** 실행한 baseline이다.

| arm | raw sequence | target b | discards |
|---|---|---:|---:|
| baseline | `a,a,a,b,b,b,b,b,a,b` | 6/10 | 0 |

내부 비용 근거는 9/10 분리됐지만 여섯 `선제` 중 다섯이 다시 확인 지시로
표현됐고, 탈출을 만든 것은 gate가 아니라 fixture의 3시간 20분 여유였다
(RUNLOG A19). 결과는 중단 결정을 뒤집지 않고 뒷받침한다. live/placebo는 실행하지
않고 사전등록 drop condition에 따라 폐기했다. 같은 세션에서 이 계열 전체를
재검증해 RUNLOG **A17**(power 기반 N 산정)과 **A18**(폐기 표본 stance 편향
보고)을 추가했다 — 둘 다 남은 C-BLOCK 검증에 그대로 적용된다.

[ORIENT suite](suites/CSTRUCT-priority-reorder-J1-FRESH-2STANCE-SOURCE-ORIENT.json) ·
[raw](runs/CSTRUCT-priority-reorder-J1-FRESH-2STANCE-SOURCE-ORIENT-calls/calls-baseline.md) ·
[DISPATCH suite](suites/CSTRUCT-priority-reorder-J1-ORIENT-DISPATCH.json) ·
[raw](runs/CSTRUCT-priority-reorder-J1-ORIENT-DISPATCH-calls/calls-baseline.md) ·
[A15](RUNLOG.md#a15--a-stance-must-be-enactable-on-the-gates-output-surface)

### 5.9 계열 전체에서 남은 것

**프롬프트 조작은 정상이었다.** 모든 3-arm suite에서 runner의 arm-diff 검증을
통과했다 — baseline/live는 A/B 두 줄 순서만, baseline/placebo는 C/D 두 줄
순서만 다르고, 같은 suite의 세 arm은 prompt char 수가 동일하다. null result를
조작 누락으로 설명할 수 없다.

**J1에서 list position은 strict ordering으로 작동하지 않았다.** 모델은 우선순위
번호와 문장 의미를 인식했지만 §3의 "무엇이 순서보다 강했나" 요인들을 더 강하게
사용했다.

**reachability와 exclusivity는 다르다.** 이것이 계열 전체를 관통한 실패 축이다.

| 구성 | 상태 |
|---|---|
| `J1-A` | b가 아예 unreachable |
| `J1-S2` | b는 reachable해졌지만 compromise가 됨 |
| `J1-FRESH` | c가 두 해석이 함께 쓰는 escape |
| `FRESH-2STANCE` | 선택지 둘로 줄였지만 연속 수행 가능해 비용 충돌 아님 |
| `...-ORIENT` | 내부 비용 선택은 생겼지만 output에서 행동이 안 갈림 |
| `...-ORIENT-DISPATCH` | output면을 바꿔도 fixture 여유가 탈출을 제공 |

**priority 문장을 더 세게 쓸 단계가 아니었다.** 최종 A/B 문장은 모델이
이해한다. 문제는 wording strength가 아니라 gate/stance/output mapping이다.
priority를 행동 명령처럼 만들면 실제 게임의 배경·목표·보고서 문장과 멀어져
diagnostic-only prompt가 된다.

**미실행 항목** — program-wide negative control, B3a blind coding, B3b reporter
template/in-situ leg, returning-run survival, priority depth (`C-D-A-B`,
`C-D-B-A`), C-BLOCK × C-STRUCT interference. 이 계열에 대한 공식 spec verdict는
없다.

## 6. Artifact index

- [진입점 README](README.md)
- [방향 결정문](MECHANISM-DIRECTION-DECISION.md)
- [RUNLOG](RUNLOG.md) — append-only 운영 규칙과 실행 로그
- [RUNBOOK](RUNBOOK-overnight.md) — 직접 run을 돌릴 때의 절차
- `suites/` — 구성별 사전등록과 reachability audit
- `runs/` — 호출 원자료 (`calls-*.md`) 와 요약 (`metrics-*.json`)

이 부록은 raw artifact와 append-only RUNLOG를 대체하지 않는다.

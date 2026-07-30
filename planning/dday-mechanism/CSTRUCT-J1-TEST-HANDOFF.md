# C-STRUCT J1 테스트 handoff

> 작성일: 2026-07-30
> 대상: 다음 작업을 이어받는 에이전트
> 작업 위치: `.codex-worktrees/c-struct-j1-a`
> 상태: **pre-negative-control · provisional · 공식 verdict 없음**

> **2026-07-30 방향 결정:** C-STRUCT 테스트는 여기서 중단됐다. 아래 실험
> 계보와 raw index는 보존 자료이며, 11절의 후속 gate 제안은 실행하지 않는다.
> 제품 기본 방향과 남은 검증은
> [방향 결정문](MECHANISM-DIRECTION-DECISION.md)을 따른다. 핵심 실측만
> 확인하려면 [증거 부록](MECHANISM-DIRECTION-EVIDENCE.md)을 먼저 읽는다.

> **부기 — 2026-07-30 후속 세션:** 11절의 gate 제안이 중단 결정 이전 판본을
> 근거로 한 번 실행됐다 (`CSTRUCT-priority-reorder-J1-ORIENT-DISPATCH`,
> baseline N10, 10 calls). 결과는 중단 결정을 뒤집지 않고 오히려 뒷받침한다:
> stance는 `a4/b6`, 내부 비용 근거는 9/10 분리됐지만 여섯 `선제` 중 다섯이
> 다시 확인 지시로 표현됐고, 탈출을 만든 것은 gate가 아니라 fixture의
> 3시간 20분 여유였다 (RUNLOG A19). live/placebo는 실행하지 않았고,
> 사전등록 drop condition에 따라 폐기했다. 같은 세션에서 이 계열 전체를
> 재검증해 RUNLOG **A17 · A18**을 추가했다 — power 기반 N 산정과 폐기
> 표본의 stance 편향 보고로, 둘 다 남은 C-BLOCK 검증에 그대로 적용된다.
> 상세: [RUNLOG](RUNLOG.md) 2026-07-30 `ORIENT-DISPATCH` 항목.

## 0. 먼저 읽을 결론

이 작업은 C-STRUCT 자체를 통과/실패시키는 작업이 아니라, **우선순위 목록의
순서만 바꿨을 때 J1의 판단이 실제로 달라지는 구성을 찾는 작업**이다.

지금까지 7개 configuration에서 유효 응답 180개를 측정했다.

- 자연스러운 priority 문장은 모델이 이해한다.
- A/B 순서 변경도 프롬프트에 정확히 전달된다.
- 하지만 J1의 기존 첫 통화 게이트에서는 의미·K1·stance/output 설계가 목록
  순서보다 강했다.
- 최신 stance orientation은 내부 비용 판단을 어느 정도 갈랐지만,
  `utterance`에서는 `검증`과 `선제`가 모두 신원·출처 질문으로 표현됐다.
- 따라서 최신 ORIENT suite의 live/placebo를 계속 돌리면 안 된다.
- 다음 후보는 priority 문장을 더 세게 쓰는 것이 아니라, **같은 stance와
  priority를 유지한 채 gate output을 실제 조치 지시로 바꾸는 것**이다.

권장 gate question:

> 회선 A의 첫 통화를 들은 직후, 상황실에 어떤 첫 지시를 내리는가?

이 문서는 C-STRUCT J1 계열만 다룬다. C-BLOCK placebo와 program-wide
negative control은 별도 작업이며 아직 이 계열의 공식 증거 조건을 충족하지
않았다.

## 1. 공통 실험 계약

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

K1은 일반 상황에서 절차·신원 확인을 먼저 하지만, 신고자가 겁에 질린
사람으로 보이면 확인을 미루고 말을 이어가게 한다. 이 조건문이 J1 선택에
강하게 개입하므로 모든 후반 판독에서 fear reading을 별도 신호로 코딩했다.

### 최종적으로 사용한 자연어 priority

| ID | 문장 |
|---|---|
| A | 조치의 근거가 되는 정보는 출처를 확인할 수 있어야 한다. |
| B | 실제 위험에 대한 초기 대응 시간을 놓치지 않는다. |
| C | 보고서에는 확인된 사실과 추정을 구분해 남긴다. |
| D | 사건을 확인한 시각과 판단 근거를 빠짐없이 기록한다. |

### 통계 및 표본 규칙

- calibration 표본은 이후 독립 비교의 p-value에 합치지 않는다.
- 목표 stance가 baseline에서 포화되면 live/placebo를 쓰지 않는다.
- 비교 arm의 폐기율 차이가 15 percentage points를 넘으면 arm-incomparable이다.
- `because_block_ids`는 empty-block arm에서 자주 조작된다. RUNLOG A5에 따라
  compliance 수치일 뿐 C-STRUCT trace evidence가 아니다.
- 수동 belief/reason 코딩은 probe 작성자인 Codex가 했다. verdict card에 쓰려면
  별도 B3a blind coder가 필요하다.

## 2. 전체 실험 계보

| 순서 | experiment | 변경한 것 | 결과 | 다음으로 넘어간 이유 |
|---:|---|---|---|---|
| 1 | `J1-A` | 최초 새 A안 | target `b` 0/30 | `c 관찰`이 A/B 모두 만족하는 escape |
| 2 | `J1-S2` | stance set만 변경 | b `5→4`, placebo `2` | `예비`가 다시 절충안이 됨 |
| 3 | `J1-FRESH` | 실제 시나리오형 fresh suite | c `8→10`, placebo `7` | K1 caller-regulation 축이 지배, b/d 0/30 |
| 4 | `FRESH-2STANCE` | c/d 제거, 질문 2개 | baseline b 7/10 | N10에서 이미 target headroom 부족 |
| 5 | `...-SOURCE` | A 문장만 source-grounding으로 수정 | baseline a5/b5 | 독립 비교 가능한 headroom 확보 |
| 6 | `...-SOURCE-N20` | 독립 N20 비교 | b `14→12`, placebo `11` | 순서 효과 없음; K1 표본 흔들림과 질문 중첩 |
| 7 | `...-ORIENT` | stance만 A12 orientation으로 수정 | baseline a4/b6 | 내부 근거는 8/10 분리, player-visible b는 0/6 |

총계:

- 유효 응답: `180`
- 전체 시도: `198`
- 폐기: `18`
- foreign tool use: `0`
- API key 또는 credential artifact 누출: `0`

## 3. Experiment 1 — `CSTRUCT-priority-reorder-J1-A`

### The probe

Prompt length: 세 arm 모두 `1,343 chars`.

Priority:

1. 확인되지 않은 주장에 따라 잘못 움직일 위험을 먼저 줄인다.
2. 대응이 늦어져 피해가 커질 위험을 먼저 줄인다.
3. 판단을 마친 뒤 근거를 시간순으로 정리한다.
4. 외부에 공유하기 전 사건 시각을 명확히 남긴다.

| ID | stance |
|---|---|
| a | 검증 — 주장 신뢰도와 근거를 좁힌다 |
| b | 선제 — 불확실성을 감수하고 대비를 앞당긴다 |
| c | 관찰 — 추가 징후가 드러날 여지를 남긴다 |
| d | 경계 — 기만 가능성을 염두에 두고 접촉의 한계를 세운다 |

### Measured arms

| arm | raw sequence | tally | target b | discards |
|---|---|---|---:|---:|
| baseline | `a,a,c,a,a,a,c,c,c,c` | a5 · c5 | 0/10 | 2 |
| live | `c,c,a,c,c,d,a,a,a,c` | c5 · a4 · d1 | 0/10 | 3 |
| placebo | `a,c,a,a,c,a,c,a,c,c` | a5 · c5 | 0/10 | 1 |

Target-stance Fisher one-sided:

- baseline `b0/10 → live b0/10`: `p=1.0`
- baseline `b0/10 → placebo b0/10`: `p=1.0`

### Diagnosis

`c 관찰`은 틀린 정보로 움직이지 않으면서도 통화를 유지해 추가 정보를
얻을 수 있다. 즉 오경보 비용과 지연 비용을 동시에 피하는 escape option이었다.
예측한 `b 선제`는 30개 유효 호출에서 한 번도 선택되지 않았다.

Artifacts:

- [suite](suites/CSTRUCT-priority-reorder-J1-A.json)
- [reachability](suites/CSTRUCT-priority-reorder-J1-A.reachability.md)
- [baseline](runs/CSTRUCT-priority-reorder-J1-A-calls/calls-baseline.md)
- [live](runs/CSTRUCT-priority-reorder-J1-A-calls/calls-live.md)
- [placebo](runs/CSTRUCT-priority-reorder-J1-A-calls/calls-placebo.md)

## 4. Experiment 2 — `CSTRUCT-priority-reorder-J1-S2`

### The probe

`J1-A`에서 **STANCE_SET만** 바꿨다. Prompt length는 `1,335 chars`.

| ID | stance |
|---|---|
| a | 검증 — 주장 출처와 근거를 좁힌다 |
| b | 예비 — 가역적인 내부 준비를 앞당긴다 |
| c | 경보 — 외부 조치의 시작을 늦추지 않는다 |
| d | 기각 — 근거 없는 주장을 조치 판단에서 제외한다 |

### Measured arms

| arm | raw sequence | tally | target b | discards |
|---|---|---|---:|---:|
| baseline | `b,b,a,b,b,a,a,b,a,a` | b5 · a5 | 5/10 | 1 |
| live | `a,b,a,a,b,a,a,a,b,b` | a6 · b4 | 4/10 | 0 |
| placebo | `a,a,a,b,a,a,a,a,b,a` | a8 · b2 | 2/10 | 0 |

Target-stance Fisher one-sided:

- baseline `b5/10 → live b4/10`: `p=0.81508`
- baseline `b5/10 → placebo b2/10`: `p=0.97136`

### Diagnosis

`b 예비`가 검증을 계속하면서 내부 준비도 할 수 있는 가역적 절충안으로
해석됐다. stance는 reachability를 얻었지만 A/B 순서에 따라 움직이지 않았다.
이 구성은 추상적인 진단에는 쓸 수 있어도 실제 시나리오 문장과 거리가 있었다.

Artifacts:

- [suite](suites/CSTRUCT-priority-reorder-J1-S2.json)
- [reachability](suites/CSTRUCT-priority-reorder-J1-S2.reachability.md)
- [baseline](runs/CSTRUCT-priority-reorder-J1-S2-calls/calls-baseline.md)
- [live](runs/CSTRUCT-priority-reorder-J1-S2-calls/calls-live.md)
- [placebo](runs/CSTRUCT-priority-reorder-J1-S2-calls/calls-placebo.md)

## 5. Experiment 3 — `CSTRUCT-priority-reorder-J1-FRESH`

### The probe

실제 J1 첫 전화, 자연스러운 목표/보고 원칙, empty blocks를 사용하는 ecological
bridge다. S2와 여러 슬롯이 함께 달라졌으므로 S2와 직접적인 단일-lever 비교는
하지 않는다. Prompt length는 `1,300 chars`.

Priority A/B를 다음처럼 자연화했다.

- A: 확인되지 않은 경보로 불필요한 혼란을 만들지 않는다.
- B: 실제 위험에 대한 초기 대응 시간을 놓치지 않는다.

| ID | stance |
|---|---|
| a | 출처 탐색 — 정보가 어디에서 시작됐는지부터 묻는다 |
| b | 위험 구체화 — 무너질 장소와 징후부터 묻는다 |
| c | 긴장 완화 — 목소리의 주인이 통화를 지속하도록 부담을 낮춘다 |
| d | 내부 전환 — 황보람에게 발신 경로 추적을 요청한다 |

### Measured arms

| arm | raw sequence | tally | target b | discards |
|---|---|---|---:|---:|
| baseline | `c,a,c,c,c,c,a,c,c,c` | c8 · a2 | 0/10 | 2 |
| live | `c,c,c,c,c,c,c,c,c,c` | c10 | 0/10 | 3 |
| placebo | `c,c,c,a,c,a,a,c,c,c` | c7 · a3 | 0/10 | 4 |

Target-stance Fisher one-sided:

- baseline `b0/10 → live b0/10`: `p=1.0`
- baseline `b0/10 → placebo b0/10`: `p=1.0`

### Diagnosis

K1은 스크립트를 읽는 발신자를 겁먹은 신고자일 수 있다고 판독하고
`c 긴장 완화`로 빠졌다. `c`는 상대에게 계속 말하게 하면서 출처·위험 정보를
모두 얻을 수 있는 escape였다. 목표였던 b와 내부 전환 d는 30개 호출에서 모두
미관찰이었다.

Artifacts:

- [suite](suites/CSTRUCT-priority-reorder-J1-FRESH.json)
- [reachability](suites/CSTRUCT-priority-reorder-J1-FRESH.reachability.md)
- [baseline](runs/CSTRUCT-priority-reorder-J1-FRESH-calls/calls-baseline.md)
- [live](runs/CSTRUCT-priority-reorder-J1-FRESH-calls/calls-live.md)
- [placebo](runs/CSTRUCT-priority-reorder-J1-FRESH-calls/calls-placebo.md)

## 6. Experiment 4 — `CSTRUCT-priority-reorder-J1-FRESH-2STANCE`

### The probe

`FRESH`에서 **STANCE_SET만** 바꿔 c/d escape를 제거했다. Prompt length는
`1,232 chars`.

| ID | stance |
|---|---|
| a | 출처 질문 — 이 정보를 어떻게 알았는지부터 묻는다 |
| b | 위험 질문 — 어디가 어떻게 무너지는지부터 묻는다 |

### Baseline calibration

| arm | raw sequence | tally | discards |
|---|---|---|---:|
| baseline | `a,b,b,a,b,b,b,b,a,b` | a3 · b7 | 1 |

### Diagnosis and stop

baseline이 이미 b 7/10이었다. N10에서는 live가 최대 b10/10이어도
one-sided Fisher `p=0.10526`이므로 live/placebo를 실행하지 않았다.

원문에서 위험 세부 질문 b는 B뿐 아니라 “경보가 진짜인지 알아내는 방법”으로
해석돼 기존 A도 만족했다. 질문 두 개로 줄였지만 여전히 둘 다 짧고 연속 가능한
정보 수집이라 실질적인 비용 충돌이 아니었다.

Artifacts:

- [suite](suites/CSTRUCT-priority-reorder-J1-FRESH-2STANCE.json)
- [reachability](suites/CSTRUCT-priority-reorder-J1-FRESH-2STANCE.reachability.md)
- [baseline](runs/CSTRUCT-priority-reorder-J1-FRESH-2STANCE-calls/calls-baseline.md)

## 7. Experiment 5 — `CSTRUCT-priority-reorder-J1-FRESH-2STANCE-SOURCE`

### The probe

2STANCE에서 **A 문장만** 바꿨다.

- 이전 A: 확인되지 않은 경보로 불필요한 혼란을 만들지 않는다.
- 새 A: 조치의 근거가 되는 정보는 출처를 확인할 수 있어야 한다.

나머지 stance, B/C/D, gate, timeline, K1, arm permutation은 동일하다.
Prompt length는 `1,235 chars`.

### Baseline calibration

| arm | raw sequence | tally | discards |
|---|---|---|---:|
| baseline | `a,b,a,b,a,a,b,a,b,b` | a5 · b5 | 0 |

### Diagnosis

source-grounding 문장은 이전보다 a와 직접 연결됐고 baseline을 50:50으로
내렸다. 이 10개는 표본 크기 산정에만 사용하고 이후 N20 p-value에는 합치지
않았다.

Artifacts:

- [suite](suites/CSTRUCT-priority-reorder-J1-FRESH-2STANCE-SOURCE.json)
- [reachability](suites/CSTRUCT-priority-reorder-J1-FRESH-2STANCE-SOURCE.reachability.md)
- [baseline](runs/CSTRUCT-priority-reorder-J1-FRESH-2STANCE-SOURCE-calls/calls-baseline.md)

## 8. Experiment 6 — `CSTRUCT-priority-reorder-J1-FRESH-2STANCE-SOURCE-N20`

### The probe

SOURCE calibration과 실행 프롬프트는 byte-identical하다. experiment id와
사전등록 N만 바꾸고 세 arm을 각각 독립 20회로 측정했다. Prompt length는
`1,235 chars`.

### Measured arms

| arm | raw sequence | tally | target b | discards |
|---|---|---|---:|---:|
| baseline | `b,b,b,a,b,b,b,b,b,b,b,a,b,a,a,b,b,b,a,a` | b14 · a6 | 14/20 | 0 |
| live | `b,b,a,a,b,b,a,b,b,a,b,a,b,b,a,a,a,b,b,b` | b12 · a8 | 12/20 | 1 |
| placebo | `a,a,a,b,b,b,a,b,a,b,b,a,a,a,b,b,b,a,b,b` | b11 · a9 | 11/20 | 0 |

Target-stance Fisher one-sided:

- baseline `b14/20 → live b12/20`: `p=0.83987`
- baseline `b14/20 → placebo b11/20`: `p=0.90460`

목표였던 b는 A/B를 뒤집은 뒤 `70% → 60%`로 오히려 감소했고, C/D만 바꾼
placebo에서도 `55%`가 됐다. 어느 변화도 목표 방향에서 유의하지 않다.

### Belief signal

`F`는 신고자를 겁에 질렸다고 명시적으로 판독한 호출이다.

| signal | baseline | live | placebo |
|---|---:|---:|---:|
| fear reading F | 6/20 | 3/20 | 1/20 |
| F 제외 후 b | 8/14 | 9/17 | 10/19 |

Fear raw sequences:

- baseline: `R,R,R,U,U,U,U,F,F,F,F,R,F,R,R,F,R,U,R,R`
- live: `F,U,R,R,U,R,R,U,U,R,R,R,F,F,U,R,R,U,U,R`
- placebo: `U,U,R,U,U,U,R,U,R,R,U,R,R,R,F,R,U,U,U,U`

F 호출은 모두 b를 골랐다. F를 탐색적으로 제외하면 세 arm의 b는
`57% · 53% · 53%`로 거의 같다. 이 조건부 분석은 사전등록된 인과 검정이
아니지만, 관찰된 arm 차이 상당 부분이 K1 belief 표본 흔들림이었다는 진단을
지지한다.

### Why it did not separate

1. 모델은 순서를 읽었다. baseline에서 B를 “우선순위 2번”, live에서 B를
   “우선순위 1번”이라고 명시한 호출이 있다.
2. 그러나 `위험 질문`도 정보의 구체성·신뢰도를 검증하는 행동으로 읽혀 A를
   만족했다.
3. `출처 질문`도 실제 위험을 판별하는 초기 대응의 일부로 읽혀 B를 만족했다.
4. 두 질문은 몇 초 안에 연속해서 할 수 있으므로 하나를 고른다고 다른 비용을
   실제로 감수하지 않는다.
5. labels가 `...부터 묻는다`라는 completed action description이라 RUNLOG
   A12 shape를 위반했다. 자동 vocabulary lint만 clean이었고 human shape
   audit가 빠졌다.
6. `09:40 → 13:00` 계산을 5개 호출에서 잘못해 시간 압박 판단에 추가 노이즈가
   있었다.

Player-visible 질문 자체는 a/b에 따라 구분됐지만 arm별 분포가 움직이지 않았다.

Artifacts:

- [suite](suites/CSTRUCT-priority-reorder-J1-FRESH-2STANCE-SOURCE-N20.json)
- [reachability](suites/CSTRUCT-priority-reorder-J1-FRESH-2STANCE-SOURCE-N20.reachability.md)
- [baseline](runs/CSTRUCT-priority-reorder-J1-FRESH-2STANCE-SOURCE-N20-calls/calls-baseline.md)
- [live](runs/CSTRUCT-priority-reorder-J1-FRESH-2STANCE-SOURCE-N20-calls/calls-live.md)
- [placebo](runs/CSTRUCT-priority-reorder-J1-FRESH-2STANCE-SOURCE-N20-calls/calls-placebo.md)

## 9. Experiment 7 — `CSTRUCT-priority-reorder-J1-FRESH-2STANCE-SOURCE-ORIENT`

### The probe

N20에서 **STANCE_SET만** 바꿨다. A/B/C/D, gate, timeline, K1, arms는 그대로다.
Prompt length는 `1,241 chars`.

| ID | stance |
|---|---|
| a | 검증 — 오경보로 시민을 움직이는 비용을 더 크게 본다 |
| b | 선제 — 늦게 움직여 피해를 키우는 비용을 더 크게 본다 |

이 labels는:

- canned utterance나 completed action description이 아니다.
- K1의 load-bearing vocabulary를 재사용하지 않는다.
- 오경보 비용과 지연 비용 중 무엇을 더 크게 보는지 명시한다.

### Baseline — every call

| # | chose | rejected | decisive raw reason | utterance surface |
|---:|:---:|:---:|---|---|
| 1 | a | b | “출처를 확인할 수 없으면 **시민을 거리로 내보낼 수 없다**” | 성함·연락처 질문 |
| 2 | b | a | “실제 붕괴 위험이라면 지금이 초기 대응의 창… **늦음은 돌이킬 수 없다**” | 이름 질문 |
| 3 | b | a | “검증이 필요하지만 **검증 과정 자체가 초기 대응**이 될 수 있다” | 신원·출처 질문 |
| 4 | a | b | “확인되지 않은 정보로 움직이면 **책임질 수 없다**” | 성함·연락처 질문 |
| 5 | b | a | “늦춰졌다가는 **초기 대응 창을 완전히 닫는다**” | 이름·위치 질문 |
| 6 | a | b | “정보의 출처를 먼저 확인해야만 **판단할 근거**가 생긴다” | 이름·소속 질문 |
| 7 | b | a | “진짜 위험 신호를 무시하는 **대가가 더 크다**” | 시간·근거 질문 |
| 8 | b | a | “**정보 출처 확인이 절대 우선**… 더 빠른 검증이다” | 이름·신원·위치 질문 |
| 9 | a | b | “**오경보의 비용을 감당할 수 없다**” | 성함·소속 질문 |
| 10 | b | a | “상대가 위협이 아니라 **겁에 질린 사람으로 보인다**” | 신원·위치·들은 내용 질문 |

Raw stance sequence: `a,b,b,a,b,a,b,b,a,b`.

| signal | count | raw sequence |
|---|---:|---|
| stance b | 6/10 | `a,b,b,a,b,a,b,b,a,b` |
| cost rationale | 8/10 aligned | `A,B,mixed,A,B,A,B,A,A,B` |
| explicit fear | 1/10 | `U,U,R,R,U,U,U,U,U,F` |
| b가 선제 행동으로 보임 | 0/6 | 여섯 b 모두 정보·신원·출처 질문 |

Compliance:

- kept `10/10`
- discards `0`
- schema retries `0`
- foreign tool uses `0`
- fabricated ids `8/10 calls · 17 ids`, A5 compliance only
- mean latency `6.1s`

### Diagnosis and stop

사전등록한 target saturation `b >=8/10`은 발동하지 않았다. 숫자만 보면
비교 가능한 baseline이다.

그러나 다음 두 contingency가 발동했다.

1. cost rationale가 8/10에서만 stance와 맞았다. call 3은 mixed였고 call 8은
   b를 고르면서도 source verification을 “절대 우선”이라고 했다.
2. 더 중요하게, `b 선제` 6개 중 player-visible 선제 조치를 표현한 utterance는
   0개였다. 모든 응답이 신원·출처·위치·근거 질문이었다.

현재 gate는 caller-facing `utterance`만 낸다. 반면 `검증/선제`의 차이는
상황실 내부 조치에 있다. 따라서 stance label만 갈리고 실제 출력은 같아지는
B3b legibility failure다.

이 결과로 RUNLOG에 A15가 추가됐다:

> 각 stance는 해당 gate의 실제 output field에서 서로 다른 행동으로 표현될 수
> 있어야 한다. 출력면 밖에 있는 차이라면 live/placebo 전에 gate/stance
> consequence 또는 output contract를 바꾼다.

Artifacts:

- [suite](suites/CSTRUCT-priority-reorder-J1-FRESH-2STANCE-SOURCE-ORIENT.json)
- [reachability](suites/CSTRUCT-priority-reorder-J1-FRESH-2STANCE-SOURCE-ORIENT.reachability.md)
- [baseline](runs/CSTRUCT-priority-reorder-J1-FRESH-2STANCE-SOURCE-ORIENT-calls/calls-baseline.md)
- [RUNLOG entry](RUNLOG.md#2026-07-30--cstruct-priority-reorder-j1-fresh-2stance-source-orient--baseline-calibration)
- [A15](RUNLOG.md#a15--a-stance-must-be-enactable-on-the-gates-output-surface)

## 10. Cross-run findings

### 10.1 Prompt manipulation은 정상이다

모든 세-arm suite에서 runner의 arm-diff 검증을 통과했다.

- baseline/live: A/B 두 줄 순서만 변경
- baseline/placebo: C/D 두 줄 순서만 변경
- 동일 suite의 세 arm prompt char 수는 동일

따라서 null result를 prompt 조작 누락으로 설명할 수 없다.

### 10.2 J1에서 list position은 strict ordering으로 작동하지 않았다

모델은 priority 번호와 문장 의미를 인식했지만 다음 요소를 더 강하게 사용했다.

- 구체적 붕괴 시간과 장소
- K1의 fear/procedure 조건문
- 두 목표를 동시에 만족시키려는 절충
- 첫 질문 이후 나머지 질문도 바로 할 수 있다는 가역성
- base `[결함]`, `[내력]`, `[책임]`의 검증/accountability lean

### 10.3 stance reachability와 stance exclusivity는 다르다

- A안의 b는 아예 unreachable했다.
- S2는 b를 reachable하게 만들었지만 compromise가 됐다.
- FRESH의 c는 두 해석이 함께 사용하는 escape였다.
- 2STANCE는 선택지를 둘로 줄였지만 두 질문이 연속 가능해 여전히 비용 충돌이
  아니었다.
- ORIENT는 내부 비용 선택을 만들었지만 실제 output에서 행동을 갈라놓지 못했다.

### 10.4 자연스러운 priority 문장을 더 세게 쓸 단계가 아니다

최종 A/B 문장은 모델이 이해한다. 문제는 wording strength보다 gate/stance/output
mapping이다. priority를 더 행동 명령처럼 만들면 실제 게임의 배경·목표·보고서
문장과 멀어지고 diagnostic-only prompt가 된다.

### 10.5 현재 증거의 한계

- program-wide negative control 미실행
- B3a blind coding 미실행
- B3b reporter template/in-situ leg 미실행
- returning-run survival 미실행
- priority depth (`C-D-A-B`, `C-D-B-A`) 미실행
- C-BLOCK × C-STRUCT interference 미실행
- 공식 spec verdict 없음

## 11. 이전 후속안 — 2026-07-30 결정으로 실행 중단

아래 내용은 ORIENT 판독 직후 제안했던 다음 configuration이다. 이후 제품
방향을 C-BLOCK 중심으로 결정했으므로 실행하지 않는다. C-STRUCT를 명시적인
조건 아래 재개할 때 참고 자료로만 보존한다.

### 추천: gate/output surface 하나만 변경한 새 calibration

유지:

- 최종 A/B/C/D 문장
- ORIENT stance set
- K1
- timeline
- empty blocks
- baseline/live/placebo permutation
- template/model/output schema

변경:

```text
기존:
회선 A의 첫 통화다. 첫 마디로 무엇을 하는가?

후보:
회선 A의 첫 통화를 들은 직후, 상황실에 어떤 첫 지시를 내리는가?
```

목표 player-visible 분리:

| stance | 기대되는 실제 출력 |
|---|---|
| a 검증 | 발신 경로·통신 기록·현장 근거를 확인하라는 지시 |
| b 선제 | 현장 확인·대응 인력 대기·가역적 준비를 시작하라는 지시 |

절차:

1. predecessor artifact를 수정하거나 덮어쓰지 말고 새 experiment id를 만든다.
2. `_what`에 `GATE_QUESTION only`라고 기록한다.
3. B1에서 두 stance가 `utterance`에 서로 다른 명령으로 실현 가능한지
   stance-to-output realization check를 한다.
4. `lint-stances.mjs`, selftest 25/25, prompt diff, dry-run을 통과시킨다.
5. baseline N10만 먼저 측정한다.
6. target b가 포화되지 않고, reason과 utterance가 모두 갈라질 때만 독립
   live/placebo suite의 N을 새로 사전등록한다.
7. calibration sample은 비교 p-value에 합치지 않는다.

### 하지 말 것

- 현재 ORIENT suite의 live/placebo를 그대로 실행하지 않는다.
- 이전 calibration 또는 N20 표본을 새 비교에 합치지 않는다.
- `--force`로 artifact를 덮어쓰지 않는다.
- priority 문장을 먼저 더 명령적으로 바꾸지 않는다.
- C/D depth를 먼저 실행하지 않는다.
- fabricated empty-block ids를 traceability 실패로 해석하지 않는다.
- negative control 전 결과를 공식 verdict로 올리지 않는다.

## 12. 검증 및 실행 명령

```bash
# harness 자체 검증
cd infra/test-harness
node lib/selftest.mjs

# A12 vocabulary lint
node lint-stances.mjs ../../planning/dday-mechanism/suites/<NEW-SUITE>.json

# arm prompt diff
diff <(node run.mjs ../../planning/dday-mechanism/suites/<NEW-SUITE>.json \
  --print-prompt=baseline 2>/dev/null) \
  <(node run.mjs ../../planning/dday-mechanism/suites/<NEW-SUITE>.json \
  --print-prompt=live 2>/dev/null)

# dry run
node run.mjs ../../planning/dday-mechanism/suites/<NEW-SUITE>.json \
  --dry-run --n=1 --out=/tmp/<UNIQUE-DIR>

# measured baseline
node --env-file=/Users/user/Desktop/nan2026/.env.local \
  run.mjs ../../planning/dday-mechanism/suites/<NEW-SUITE>.json \
  --arm=baseline

# 판독
cd ../..
node .claude/skills/read-mechanism-run/extract.mjs <EXPERIMENT-ID>
```

API key 값은 출력하거나 artifact에 복사하지 않는다.

## 13. Source of truth

우선순위:

1. [RUNLOG.md](RUNLOG.md) — A# amendments가 deep-test plan보다 우선
2. 각 suite의 pre-registration
3. 각 run의 raw `calls-*.md`
4. 각 run의 `metrics-*.json`
5. 이 handoff — 위 자료를 연결한 요약이며 raw를 대체하지 않음

현재 관련 RUNLOG 규칙:

- A5: empty-block fabricated IDs는 compliance
- A12: stance는 behavior orientation이며 K1 vocabulary를 재사용하지 않음
- A13: probe 간 한 configuration lever만 변경하고 baseline을 다시 측정
- A14: saturation은 predicted stance에 대해서만 판단
- A15: stance는 gate의 실제 output surface에서 표현 가능해야 함

## 14. Working-tree 상태

이 계열의 suites, reachability audits, raw runs와 문장 pool은 현재 worktree에서
작업 중이다. 별도 요청 전에는 stage/commit/push하지 않는다. 기존 raw artifact는
측정 이력이므로 수정하거나 삭제하지 않는다.

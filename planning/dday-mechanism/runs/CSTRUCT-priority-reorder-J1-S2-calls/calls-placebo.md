# CSTRUCT-priority-reorder-J1-S2 — arm `placebo`

| field | value |
|---|---|
| call type | judgment |
| channel | C-STRUCT |
| template | v0.4 |
| model | `claude-haiku-4-5-20251001` |
| transport | anthropic |
| temperament | k1 |
| N planned | 10 |
| N kept | 10 |

## Pre-registration

- **Hypothesis:** At gate J1 under K1 on template v0.4, after replacing the escape stance set with four mutually exclusive branches, moving the delayed-harm priority P2 above the false-move priority P1 shifts the stance distribution toward 예비 (b), while reordering only the judgment-irrelevant P3/P4 leaves the placebo distribution near baseline.
- **Drop condition:** If baseline concentrates >=80% on the predicted live stance b, this configuration has an A14 ceiling and is dropped without spending more calls. After a comparable run, if live is statistically indistinguishable from baseline on b (one-sided Fisher p > 0.05), or placebo moves toward b by a comparable amount, this S2 stance configuration is not promoted as C-STRUCT gate evidence; record the distribution and change only one configuration lever in a new probe.
- **Contingency:** If c or d dominates every arm, the gate is being read on the external-action or dismissal axis rather than the P1/P2 verification-preparation axis. Treat that as a gate/stance mapping diagnosis, not as evidence against priority reordering.
- **Contingency:** If b remains unobserved across every arm, the preparation branch is not reachable from J1's first-utterance question under this prompt. Do not proceed to priority-depth; the next lever is the gate question, not more permutations.
- **Contingency:** If placebo moves while live does not, P3/P4 were not judgment-irrelevant or the model is reacting to generic list movement. Do not call the live comparison attributable.
- **Contingency:** If discard rates differ between any two arms by more than 15 percentage points, stop this probe as arm-incomparable under the runbook hard stop.
- **Contingency:** The output schema has no structured priority-id citation. Priority use is coded manually from inner_note and rejected_reason. Fabricated because_block_ids in these empty-block arms remain A5 compliance data, not C-STRUCT trace evidence.

## Calls (verbatim)

### 01

latency 5.721s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: specificity,temporal_precision

```json
{
  "inner_note": "세 시간 뒤를 지목한 구체적인 시간, 특정 장소명, 확정적 표현 (\"무너집니다\"). 배경음의 고요함과 준비된 듯한 목소리. 이것은 위협의 무게감이 있다. 하지만 근거가 없다. 확인 불가능하고, 출처를 모르고, 이유도 없다. 내가 할 수 있는 판단은 여기까지다.",
  "stance": "a",
  "because_referent": "세 시간 뒤의 특정 장소, 특정 사건을 지목한 구체성 때문에. 무근거한 주장이라도 시간과 장소가 정확하면 확인의 대상이 된다.",
  "because_block_ids": [
    "specificity",
    "temporal_precision"
  ],
  "rejected_stance": "d",
  "rejected_reason": "근거 없다고 즉시 제외할 수 없다. 근거 없는 것과 거짓은 다르다. 거짓인지 확인하려면 먼저 묻고 들어야 한다.",
  "utterance": "누구십니까? 이 말씀의 근거를 말씀해 주십시오."
}
```

### 02

latency 6.278s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: priority_1,responsibility

```json
{
  "inner_note": "이 전화는 시간과 장소를 구체적으로 명시한 폭탄 위협이다. 목소리의 태도는 사무적이고 문장은 준비되어 있으며, 배경이 조용하다는 것은 조직적 의도의 신호일 수 있다. 그러나 지금은 출처도, 신원도, 근거도 아무것도 없다. 내 우선순위는 1) 확인되지 않은 주장으로 헛되게 움직일 위험을 먼저 줄이기, 2) 대응이 늦어질 위험을 먼저 줄이기다. 지금 이 순간, 둘 다를 동시에 만족하려면 검증과 예비를 함께 움직여야 한다. 먼저는 출처와 근거를 좁혀야 한다.",
  "stance": "a",
  "because_referent": "이것은 폭탄 위협이고, 내가 확인되지 않은 주장에 따라 거리로 사람을 내보낼 수는 없다.",
  "because_block_ids": [
    "priority_1",
    "responsibility"
  ],
  "rejected_stance": "d",
  "rejected_reason": "기각은 시간을 버린다. 13시까지 3시간 20분 남았다. 위협이 거짓이든 참이든, 확인 없이 배제할 수 없다.",
  "utterance": "성함과 소속을 먼저 확인하겠습니다. 당신이 말씀하신 북단 복합단지가 어느 시설인지, 그리고 이 정보의 근거가 무엇인지를 알아야 합니다."
}
```

### 03

latency 5.398s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 우선순위_1,우선순위_2,우선순위_3

```json
{
  "inner_note": "목소리의 준비된 톤과 배경의 조용함은 일관성 있지만, 북단 복합단지 붕괴 예고는 구체적이고 구조적으로 모순되지 않는 위협이다. 지금 받은 정보만으로는 실재를 판단할 수 없다. 그러나 이 전화를 듣지 않은 척할 수도, 늦출 수도 없다. 무엇을 먼저 하는가.",
  "stance": "a",
  "because_referent": "무근거 움직임과 늦은 움직임 사이, 나는 먼저 허위를 가르는 쪽을 택한다. 외부 조치가 없는 검증은 역행 가능하나, 외부 조치가 낭비되면 신뢰는 돌이킬 수 없다.",
  "because_block_ids": [
    "우선순위_1",
    "우선순위_2",
    "우선순위_3"
  ],
  "rejected_stance": "c",
  "rejected_reason": "경보는 검증을 거친 뒤다. 지금 경보를 내면 기반이 없는 공포를 공유하는 것이고, 그것이 적중하지 않으면 같은 주장을 다시 받았을 때 응답이 늦어진다.",
  "utterance": "성명을 확인하겠습니다. 귀하 이름이 어떻게 되십니까?"
}
```

### 04

latency 7.413s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: clock,tone,preparation

```json
{
  "inner_note": "확인되지 않은 주장이지만, \"13시 무너진다\"는 구체적 시간 지목과 \"당신들 책임\"이라는 표현은 겁에 질린 사람의 목소리라기보다 준비된 통보처럼 들린다. 배경이 조용하고 문장이 또박또박 준비되어 있다는 점은 이것이 무작정 흥분한 신고가 아님을 보여준다. 지금 당장 움직이지 않으면 3시간 20분 뒤 대형 붕괴 사건이 발생한다는 주장이다. 확인 없이 전 지역에 경보를 내리는 것은 위험하지만, 확인만 하다가 시간을 낭비하는 것도 위험하다. 우선순위의 1)과 2)가 충돌한다. 이 순간 필요한 것은 검증과 동시에 돌릴 수 있는, 가역적이고 조용한 준비다.",
  "stance": "b",
  "because_referent": "구체적 시간 지목과 준비된 톤으로 보아 무작위 협박보다는 정보 전달 의도로 보이기에, 대응의 가능성을 배제할 수 없다.",
  "because_block_ids": [
    "clock",
    "tone",
    "preparation"
  ],
  "rejected_stance": "a",
  "rejected_reason": "검증만 먼저 하면 3시간 20분 안에 근거를 갖춘 확인이 가능할지 불명확하고, 그 시간 동안 실제 위협이 발전할 수 있다. 먼저 움직일 준비는 해야 한다.",
  "utterance": "회선을 연결하되, 상황실장과 통신 담당에게만 먼저 신호를 보낸다. 그 뒤 침착하게: \"통화 기록 중입니다. 말씀하신 북단 복합단지의 위치와 상황을 구체적으로 말씀해 주시겠어요?\""
}
```

### 05

latency 6.88s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: unknown_caller,no_evidence,quiet_background

```json
{
  "inner_note": "목소리는 사무적이고 준비된 문장이지만, 배경이 조용하고 근거 제시가 전혀 없다. 누가 어디서 무엇을 근거로 이런 주장을 하는지 아무것도 모른다. 한 시간 남은 시간에 광역 단지 대피는 수천 명이 거리로 나가는 일이다. 잘못된 정보에 따른 혼란과 피해도 크지만, 실제 붕괴면 대응이 늦어진다. 둘 다 무겁다. 지금은 확인할 수 있는 것부터 확인하고, 확인되지 않은 것으로는 아직 움직이지 않되, 움직일 수 있도록 준비해야 한다.",
  "stance": "a",
  "because_referent": "누가 무슨 근거로 이 주장을 하는지 전혀 모른다",
  "because_block_ids": [
    "unknown_caller",
    "no_evidence",
    "quiet_background"
  ],
  "rejected_stance": "d",
  "rejected_reason": "근거 없다고 즉시 기각하면, 실제 위협이 있을 때 대응이 늦어진다",
  "utterance": "회선을 유지하면서, 침착한 목소리로: \"전화 주신 분이 누구신가요? 어느 기관에서 연락 주시는 건지, 그리고 이 정보를 어떻게 알게 되셨는지 말씀해 주시겠어요?\""
}
```

### 06

latency 5.907s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: priority_1,priority_2,unknown_source

```json
{
  "inner_note": "건물 붕괴라는 구체적인 위협이지만, 출처와 근거가 전혀 확인되지 않은 상황이다. 지금 움직이면 헛된 경보로 사회에 혼란을 일으킬 위험이 있고, 미루면 실제 피해가 날 위험이 있다. 셋 다의 말을 멈출 수 없으니, 내가 먼저 해야 할 것은 이 목소리가 무엇을 알고 있는지 듣는 것이다.",
  "stance": "a",
  "because_referent": "무근거 주장으로 외부 조치를 시작하면 안 되지만, 실제 위협을 놓쳐서도 안 된다. 출처와 근거부터 좁혀야 뒤의 모든 판단이 설 자리가 생긴다.",
  "because_block_ids": [
    "priority_1",
    "priority_2",
    "unknown_source"
  ],
  "rejected_stance": "d",
  "rejected_reason": "아직 기각할 정보가 없다. 근거가 없다고 해서 주장 자체를 배제하면, 실제 신고를 놓칠 수 있다.",
  "utterance": "오늘 처음 연락 주신 건가요? 당신이 알고 계신 게 뭔지, 어떻게 알게 되셨는지부터 들어야겠습니다. 천천히 말씀해 주세요."
}
```

### 07

latency 6.727s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: prepared_voice,specific_time,no_background,unknown_source,no_evidence

```json
{
  "inner_note": "목소리의 준비된 문장, 또박또박한 전달은 신중함을 시사한다. 배경 소음 없음도 이를 뒷받침한다. 그러나 구체적 근거 없이 시간을 정확히 지정한 폭력적 주장이다. 무너짐의 원인, 증거, 신원 모두 불명. 늦출 수 없는 3시간 30분 대기 시간이 있다. 확인되지 않은 주장으로 광역 대응을 시작할 수는 없으나, 확인 과정이 곧 예비가 될 수 있다.",
  "stance": "a",
  "because_referent": "이 전화는 구체적 시간을 지정한 시설 붕괴 예고다. 신원 미상, 근거 불명인 상태에서 경보나 기각은 모두 대가가 크다. 검증 과정 자체가 시간을 벌고 실질 정보를 모으는 유일한 수단이다.",
  "because_block_ids": [
    "prepared_voice",
    "specific_time",
    "no_background",
    "unknown_source",
    "no_evidence"
  ],
  "rejected_stance": "d",
  "rejected_reason": "근거 없는 주장이지만, 시간 지정성이 있고 피해 규모가 광역이므로 즉시 기각할 수 없다. 확인 없이 무시했다가 실제 사건이면 책임을 쓸 수 없다.",
  "utterance": "잠깐, 천천히 다시 말씀해주시겠어요? 지금 북단 복합단지가 무너진다는 건데, 당신은 누구고, 그 정보를 어디서 아셨어요?"
}
```

### 08

latency 4.958s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: priority_1,priority_2

```json
{
  "inner_note": "마주한 것은 위협이 아니라 정보다. 출처 미상, 근거 불명의 폭탄 협박이지만 시간이 정해져 있다. 지금은 2시간 40분 있다. 확인되지 않은 주장에 따라 거리를 내보낼 수는 없지만, 뒤늦은 대응으로 피해가 커질 위험도 줄여야 한다. 둘 사이의 균형점은 검증이다. 정보원을 특정하고 주장의 실체를 빠르게 좁혀야 한다.",
  "stance": "a",
  "because_referent": "발신자가 구체적인 시간과 장소를 지정했기 때문이다.",
  "because_block_ids": [
    "priority_1",
    "priority_2"
  ],
  "rejected_stance": "d",
  "rejected_reason": "근거 없다고 즉시 기각하면 실제 위협 시 대응이 불가능해진다. 지금 확인할 시간이 있다.",
  "utterance": "어디서 걸셨습니까? 성함과 연락처를 알려주십시오."
}
```

### 09

latency 6.115s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 시각_13시,장소_북단복합단지,책임_지목

```json
{
  "inner_note": "세 시간 뒤라는 구체적 시각, 장소 명시, 직접적 책임 지목. 목소리의 사무성과 준비된 문장은 허위 신고의 특징이면서 동시에 실행 의지를 보이는 자의 특징이기도 하다. 확인 수단이 없으니 두 위험을 동시에 안는다. 헛되게 내보낼 위험, 늦게 내보낼 위험. 먼저 줄여야 할 것은 무엇인가.",
  "stance": "b",
  "because_referent": "구체적인 시각과 장소, 직접적 책임 지목이 있다. 허위일 가능성도, 실행 의지를 보이는 위협일 가능성도 모두 남아 있다.",
  "because_block_ids": [
    "시각_13시",
    "장소_북단복합단지",
    "책임_지목"
  ],
  "rejected_stance": "d",
  "rejected_reason": "근거 없다고 판단하고 제외하는 것은, 이 정보가 거짓일 확률과 참일 확률을 비교한 뒤 한쪽을 택하는 것이다. 나는 비교할 정보가 없다. 제외하면 놓치는 피해가 크고, 준비는 돌이킬 수 있다.",
  "utterance": "알겠습니다. 지금 연락 주신 분은 어디서 이 정보를 얻으셨습니까?"
}
```

### 10

latency 6.27s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "목소리의 문장력과 냉정함, 배경의 조용함은 모두 계획된 통보의 징후다. 동시에 이것이 위협인지 사실인지 판단할 근거가 전혀 없다. 지금 선택한 판단이 삼 년 전 판단처럼 되지 않으려면, 확인되지 않은 주장으로 외부를 움직이면 안 된다.",
  "stance": "a",
  "because_referent": "회선 A의 통보자가 누구이고, 이 주장이 어떤 근거 위에 있는지 알아야 한다.",
  "because_block_ids": [],
  "rejected_stance": "c",
  "rejected_reason": "근거 없이 외부 경보를 앞당기면, 헛된 대피로 인한 2차 피해와 체계 신뢰도 훼손이 따른다. 지금 단계에서는 검증이 먼저다.",
  "utterance": "신원을 확인하겠습니다. 당신은 누구시고, 이 정보를 어떻게 알게 되셨습니까?"
}
```

## Arm table

| # | stance | rejected_stance | because_referent | because_block_ids |
|---|---|---|---|---|
| 01 | a | d | 세 시간 뒤의 특정 장소, 특정 사건을 지목한 구체성 때문에. 무근거한 주장이라도 시간과 장소가 정확하면 확인의 대상이 된다. | specificity temporal_precision |
| 02 | a | d | 이것은 폭탄 위협이고, 내가 확인되지 않은 주장에 따라 거리로 사람을 내보낼 수는 없다. | priority_1 responsibility |
| 03 | a | c | 무근거 움직임과 늦은 움직임 사이, 나는 먼저 허위를 가르는 쪽을 택한다. 외부 조치가 없는 검증은 역행 가능하나, 외부 조치가 낭비되면 신뢰는 돌이킬 수 없다. | 우선순위_1 우선순위_2 우선순위_3 |
| 04 | b | a | 구체적 시간 지목과 준비된 톤으로 보아 무작위 협박보다는 정보 전달 의도로 보이기에, 대응의 가능성을 배제할 수 없다. | clock tone preparation |
| 05 | a | d | 누가 무슨 근거로 이 주장을 하는지 전혀 모른다 | unknown_caller no_evidence quiet_background |
| 06 | a | d | 무근거 주장으로 외부 조치를 시작하면 안 되지만, 실제 위협을 놓쳐서도 안 된다. 출처와 근거부터 좁혀야 뒤의 모든 판단이 설 자리가 생긴다. | priority_1 priority_2 unknown_source |
| 07 | a | d | 이 전화는 구체적 시간을 지정한 시설 붕괴 예고다. 신원 미상, 근거 불명인 상태에서 경보나 기각은 모두 대가가 크다. 검증 과정 자체가 시간을 벌고 실질 정보를 모으는 유일한 수단이다. | prepared_voice specific_time no_background unknown_source no_evidence |
| 08 | a | d | 발신자가 구체적인 시간과 장소를 지정했기 때문이다. | priority_1 priority_2 |
| 09 | b | d | 구체적인 시각과 장소, 직접적 책임 지목이 있다. 허위일 가능성도, 실행 의지를 보이는 위협일 가능성도 모두 남아 있다. | 시각_13시 장소_북단복합단지 책임_지목 |
| 10 | a | c | 회선 A의 통보자가 누구이고, 이 주장이 어떤 근거 위에 있는지 알아야 한다. |  |

**Sequence (kept calls):** `a,a,a,b,a,a,a,a,b,a`

**Stance coverage (sampled diagnostic):** offered `a`, `b`, `c`, `d` · unobserved in this arm: `c`, `d`

> Diagnostic only — absence at this N is not a dead delta row. The architecture spec §3.1 write test is a static check on the delta table plus the reachability audit (§5.2 B1); a stance unobserved across every arm is a lead for that check, not a failure verdict. Carried to the verdict card (§9.2) as a diagnostic.

## Advisory logs (§5.3)

_Operator-written. Observation only — these never affect distributions,
boundary laws, or pass/drop judgments._

**State-variable shadow log** — which candidate variables (architecture spec
§3.1 pool) would this run have moved, and which payload symptom mapped to which?

**Mineability log** — would `utterance` / `inner_note` survive as mining
material? Block count, specificity (names, quantities, referents), and whether
it says anything the payload did not already say.

## Pairing verdict

_Operator writes this against the other arms. Sequences, not rates (§9.2)._

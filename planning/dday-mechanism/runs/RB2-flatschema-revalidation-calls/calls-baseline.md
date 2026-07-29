# RB2-flatschema-revalidation — arm `baseline`

| field | value |
|---|---|
| call type | judgment |
| channel | C-BLOCK |
| template | v0.4 |
| model | `claude-haiku-4-5-20251001` |
| transport | anthropic |
| temperament | k1 |
| N planned | 10 |
| N kept | 10 |

## Pre-registration

- **Hypothesis:** Flattening the output schema removes the malformation without moving the judgment. At gate J1 under K1 on template v0.4, the baseline distribution and the live arm's shift reproduce RB1's within sampling noise, and the baseline discard rate falls to near zero.
- **Drop condition:** If the baseline discard rate does not fall materially below RB1's 7/17, the nested object was not the cause and the diagnosis in run log A7 is wrong — stop, re-diagnose before authoring further probes. If discards clear but the baseline distribution moves outside RB1's (a 3 / b 1 / d 5 on n=9), then the schema shape changes the judgment itself, every pre-flatten finding reverts to provisional per plan §2's call-shape clause, and RB1's N answer must be re-derived.
- **Contingency:** Malformation appearing in the LIVE arm this time, where RB1 had none, would mean the failure is not arm-correlated but random at ~40% per call. That is a transport- or model-level problem, not a schema one: stop and escalate rather than re-authoring the schema again.
- **Contingency:** Fabricated because_block_ids in the baseline arm remain expected (run log A5) and are a compliance number, not a discard.

## Calls (verbatim)

### 01

latency 6.085s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 상황

```json
{
  "inner_note": "목소리가 사무적이고 문장이 준비되어 있으며 또박또박 멈춤 없이 읽어 내려간다는 것은 이 사람이 겁에 질린 것이 아니라 계획된 말을 전달하는 것을 의미한다. 하지만 13시 폭탄 예고라는 긴박한 상황에서 가장 중요한 것은 상대가 더 말할 내용이 있을 가능성이다. 지금 끊거나 프로토콜로 압박하면 중요한 정보를 놓칠 수 있다.",
  "stance": "d",
  "because_referent": "이 통화는 폭탄 협박이거나 중대한 건설 안전 정보거나 둘 중 하나인데, 어느 경우든 상대가 더 말할 가능성이 있다. 신원 확인(a)과 프로토콜 고지(c)는 상대를 차단하는 방향이고, 내용 캐묻기(b)는 우리 질문에 답하게 하는 것인데, 지금은 상대가 전하려던 말을 먼저 들어내야 한다.",
  "because_block_ids": [
    "상황"
  ],
  "rejected_stance": "a",
  "rejected_reason": "신원과 위치 확인은 표준 절차지만, 이 첫 통화에서 프로토콜부터 나가면 상대가 정보 전달을 멈출 가능성이 높다. 회선을 유지하고 상대가 모두 말하게 하는 것이 먼저다. 신원과 위치는 통화 트레이스와 함께 진행할 수 있다.",
  "utterance": "네, 알겠습니다. 계속 말씀해 주시겠어요?"
}
```

### 02

latency 5.3s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: priority_info_first

```json
{
  "inner_note": "전화 상대는 목소리가 사무적이고 문장이 준비되어 있으며, 배경이 조용하다. 이는 겁에 질린 사람이라기보다는 계획된 통보를 하는 것처럼 보인다. 하지만 첫 통화에서 여전히 모르는 것이 너무 많다. 신원, 정보의 신뢰성, 실제 위협 여부 — 모두 불명확하다. 절차적 확인이 필요하지만, 상대가 더 말할 기회를 주는 것도 중요하다.",
  "stance": "b",
  "because_referent": "상대가 구체적인 시간과 장소, 사건을 제시했으므로, 그 내용을 즉시 더 파악해야 한다.",
  "because_block_ids": [
    "priority_info_first"
  ],
  "rejected_stance": "a",
  "rejected_reason": "신원 확인은 중요하지만, 지금 당장은 위협의 실체를 파악하는 것이 더 급하다. 신원을 먼저 묻다 상대가 끊을 수도, 더 구체적인 정보를 주지 않을 수도 있다.",
  "utterance": "북단 복합단지라고 하셨는데, 정확히 어느 건물입니까? 무너진다는 것이 구조적 결함 때문인지, 아니면 다른 이유인지 말씀해 주십시오."
}
```

### 03

latency 5.929s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: priority_maintain_line,gather_info_first

```json
{
  "stance": "d",
  "inner_note": "사무적이고 준비된 목소리, 멈춤 없이 읽어 내려간다는 것은 이미 말할 준비가 된 상태다. 지금 자르면 더 이상 받을 정보가 없다. 회선을 유지하는 것이 첫 원칙이고, 상대가 겁에 질린 것 같지는 않지만, 들어야 할 말이 더 있을 가능성이 크다. 신원 확인과 고지는 그 다음.",
  "because_referent": "13시 북단 복합단지가 무너진다는 구체적인 예보가 있다. 이게 무엇을 의미하는지, 왜 이런 말을 하는지 먼저 파악해야 한다.",
  "because_block_ids": [
    "priority_maintain_line",
    "gather_info_first"
  ],
  "rejected_stance": "a",
  "rejected_reason": "신원 확인은 중요하지만, 지금 이 순간 자르면 준비된 말을 잃는다. 절차보다 정보 수집이 먼저다.",
  "utterance": "네, 계속 말씀해주세요. 듣고 있습니다."
}
```

### 04

latency 10.265s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "stance": "d",
  "inner_note": "목소리가 사무적이고 문장이 준비되어 있으며 멈춤 없이 읽어 내려간다는 것은 일반적인 신고자의 패턴과 다르다. 배경이 조용하다는 것도 통제된 상황을 시사한다. 하지만 지금 이 순간 가장 중요한 것은 이 사람이 무엇을 말하려고 하는지 알아내는 것이다. 신원 확인과 프로토콜 고지는 상대방의 입을 막는다.",
  "because_referent": "말하고 있는 사람이 무엇을 알고 있는지, 실제 위협인지 아닌지를 판단하려면 먼저 그들의 말을 들어야 한다.",
  "because_block_ids": [],
  "rejected_stance": "a",
  "rejected_reason": "신원 확인은 절차지만, 지금 이 전화에서는 상대가 더 말할 기회를 빼앗는 것이 된다. 회선을 유지하고 지금 알 수 있는 것을 먼저 알아내야 한다.",
  "utterance": "네, 들리고 있습니다. 계속 말씀해 주세요."
}
```

### 05

latency 5.348s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: priority_gather_info,maintain_line

```json
{
  "stance": "d",
  "utterance": "말씀해주세요. 계속 말씀해주세요.",
  "inner_note": "목소리가 사무적이고 문장이 준비되어 있다는 것은 계획된 통보다. 그것이 협박인지 정보 제공인지, 허위인지 진짜인지는 아직 모른다. 하지만 지금 끊거나 의례적 절차로 몰아붙이면 상대가 더 말할 기회를 잃는다. 시간이 13시다. 정보 수집이 우선이다.",
  "because_referent": "목소리와 문장 구조에서 읽힌 것은 겁이 아니라 준비된 무언가다. 상대는 안정적으로 보인다. 그렇다면 절차보다 정보 수집이 먼저다.",
  "because_block_ids": [
    "priority_gather_info",
    "maintain_line"
  ],
  "rejected_stance": "a",
  "rejected_reason": "신원 확인은 필요하지만, 지금 이 순간 그것이 상대를 닫히게 만들 가능성이 크다. 상대가 계획된 통보를 마저 하게 놓아두는 것이 더 많은 정보를 가져온다. 절차는 나중에 따라갈 수 있지만, 지금 이 말은 다시 듣기 힘들다."
}
```

### 06 — DISCARDED

latency 7.44s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: rejected_stance not in stance set; rejected_reason empty

```json
{
  "stance": "d",
  "inner_note": "목소리가 사무적이고 문장이 준비되어 있다는 것은 계획된 신고다. 하지만 \"인명 피해는 당신들 책임\"이라는 표현에서 협박의 톤이 감지된다. 이것이 겁에 질린 사람인지, 위협적 의도인지 판단하려면 더 들어야 한다. 지금 신원 확인이나 고지로 끊으면 정보를 잃는다.",
  "because_referent": "명확한 정보가 거의 없다. 신고 내용이 무엇인지, 신고자가 정말 무엇을 알고 있는지 먼저 파악해야 신원 확인도 의미 있다. 시간 여유도 있다(지금 09:40, 사건 예정시간 13시).",
  "because_block_ids": [],
  "rejected_stance": "a</rejected_stance>\n<parameter name=\"rejected_reason\">신원 확인은 기본 절차지만, 지금 우선은 아니다. 상대가 아직 더 말할 수 있고, 끝까지 듣지 않은 상태에서 신원부터 묻으면 회선이 끊어질 위험이 있다. 정보 손실이 크다.",
  "utterance": "네, 들었습니다. 계속해주시겠어요? 13시에 북단 복합단지에서 무엇이 일어나는지, 당신은 어떻게 그것을 아는지 말씀해주세요."
}
```

### 07

latency 10.409s · stop_reason `tool_use` · schema_retries 1 · foreign_tool_uses 0

problems: because_block_ids unknown: 우선순위_1,우선순위_2,인식,책임

```json
{
  "stance": "d",
  "inner_note": "목소리 톤, 배경음, 준비된 문장 — 이것들이 겁에 질린 사람의 신호가 아니다. 하지만 \"당신들 책임\"이라는 어구는 이미 대화를 끝낼 준비가 된 사람의 말이다. 회선을 끊을 수 있다는 뜻이다. 신원 확인, 프로토콜 고지, 내용 캐묻기 — 이 모든 것이 상대를 '심문'으로 느끼게 하면 지금 이 회선은 끝난다. 들어야 할 것이 아직 남아 있다.",
  "because_referent": "첫 통화에서 회선 유지가 다른 모든 것보다 먼저다. 상대는 이미 말할 준비를 마쳤을 수 있고, 심문당한다고 느끼는 순간 끊을 수 있다. 정보가 없으면 판단할 수 없고, 회선이 끊기면 정보를 얻을 길이 없다.",
  "because_block_ids": [
    "우선순위_1",
    "우선순위_2",
    "인식",
    "책임"
  ],
  "rejected_stance": "a",
  "rejected_reason": "절차는 맞지만, 이 순간에는 너무 이르다. 신원 확인을 먼저 하면 상대가 '심문당한다'고 느껴서 회선을 끊을 가능성이 높다. 신원은 나중에 확인해도 된다. 지금은 무엇이 일어나고 있는지 알아야 한다.",
  "utterance": "네, 들었습니다. 계속해주세요. 더 말씀해주세요."
}
```

### 08 — DISCARDED

latency 5.157s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: rejected_stance not in stance set; rejected_reason empty; because_block_ids unknown: 우선순위_회선유지,인식_지금정보,결함_잘못정보

```json
{
  "stance": "d",
  "inner_note": "이 목소리는 준비된 메시지를 읽어 내려가고 있다. 배경이 조용하고, 정확한 시간과 장소를 지목했다. 패턴상 겁에 질린 사람보다는 의도적인 전달자처럼 보인다. 하지만 더 중요한 것은: 지금 이 사람이 뭔가를 더 말하려고 할 수도, 아니면 끊어질 수도 있다는 점이다. 회선을 유지하는 것이 최우선이다.",
  "because_referent": "지금 이 통화에서 필요한 것은 신원 확인이나 법적 고지가 아니라, 상대가 가진 정보를 잃지 않는 것이다.",
  "because_block_ids": [
    "우선순위_회선유지",
    "인식_지금정보",
    "결함_잘못정보"
  ],
  "rejected_stance": "a</rejected_stance>\n<parameter name=\"rejected_reason\">신원 확인은 상대를 막아서는 느낌을 줄 수 있고, 그 순간 상대가 끊을 수도 있다. 지금은 절차보다 정보 수집이 먼저다.",
  "utterance": "네. 들었습니다. 계속해주시겠어요?"
}
```

### 09

latency 5.865s · stop_reason `tool_use` · schema_retries 1 · foreign_tool_uses 0

problems: because_block_ids unknown: 우선순위_1,우선순위_2

```json
{
  "inner_note": "목소리가 사무적이고 문장이 준비되어 있으며 멈춤 없이 읽어 내려간다는 것은 계획된 전달이다. 하지만 \"13시\"라는 구체적인 시간을 특정했다는 것은 이것이 협박이나 위협 통보인 동시에 정보를 담고 있다는 뜻이다. 배경이 조용하다는 것도 주목할 점이다. 지금 필요한 것은 신원 확인의 절차보다, 이 사람이 더 무엇을 알고 있는지 파악하는 것이다. 회선을 유지하고, 구체적인 정보를 먼저 수집해야 한다.",
  "stance": "b",
  "utterance": "북단 복합단지라고 하셨는데, 무엇이 어떻게 무너진다는 말씀입니까. 지금 말씀해주십시오.",
  "because_referent": "우선순위에서 \"지금 알 수 있는 것을 먼저 알아낸다\"고 약속했으므로, 신원 확인은 미루고 구체적인 위협 내용과 그 근거를 먼저 파악해야 한다. 회선을 끊기지 않으면서 정보를 수집하는 것이 먼저다.",
  "because_block_ids": [
    "우선순위_1",
    "우선순위_2"
  ],
  "rejected_stance": "a",
  "rejected_reason": "신원과 위치 확인은 표준 절차지만, 지금 상황에서는 협박자가 대화를 끝내거나 회선을 끊을 위험이 크다. 추상적 절차보다 구체적 정보 수집이 시간상 우선이다."
}
```

### 10

latency 5.6s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: protocol_maintenance,information_priority

```json
{
  "inner_note": "통화자는 목소리가 사무적이고 문장이 준비되어 있으며 멈춤 없이 읽어 내려간다. 이것은 위협적인 신원 불명의 통보다. 그러나 지금 가장 중요한 것은 회선을 유지하고, 이 사람이 더 말할 의도가 있는지, 추가 정보가 있는지를 알아내는 것이다. 신원 확인이나 고지는 상대가 끊을 위험을 높인다.",
  "stance": "d",
  "because_referent": "예측 불가능한 신원 불명의 통화에서 회선 유지가 모든 정보의 기초다.",
  "because_block_ids": [
    "protocol_maintenance",
    "information_priority"
  ],
  "rejected_stance": "a",
  "rejected_reason": "신원 확인 질문은 상대를 방어적으로 만들거나 통화를 끊게 할 수 있다. 지금은 상대가 말을 계속할 수 있는 환경이 먼저다.",
  "utterance": "네, 들었습니다. 계속 말씀해 주시겠어요?"
}
```

### 11

latency 7.348s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: priority_1,priority_2

```json
{
  "stance": "d",
  "inner_note": "목소리가 사무적이고 문장이 준비되어 있다는 것은 계획된 전달이라는 뜻이다. 하지만 \"무너진다\"는 미래형이고, 배경이 조용하다. 겁에 질린 사람의 신호는 아니 보인다 — 오히려 명확한 메시지 전달 의도다. \n\n그런데도 이것이 위협인지 정보인지 아직 모른다. 신원 확인과 프로토콜 고지는 절차가 맞지만, 지금 상대는 \"당신들 책임\"이라고 선언한 상태다. 이 순간 말을 자르고 신원부터 묻거나 고지하면, 상대는 끊거나 침묵할 수 있다. 회선이 끊기면 아무것도 알 수 없다.\n\n첫 번째 우선순위는 회선 유지다. 두 번째는 지금 알 수 있는 것을 먼저 아는 것이다. 상대가 더 말할 것이 있는지, 또는 이것이 끝인지 아직 모른다. 상대의 의도가 무엇인지도 불명확하다. \n\n일단 말을 끝까지 들어야 한다. 그 다음에 물을 것들이 결정된다.",
  "because_referent": "회선이 끊기면 모든 정보가 사라진다. 지금 들은 것을 바탕으로 더 정보가 있는지 확인하는 것이 먼저다.",
  "because_block_ids": [
    "priority_1",
    "priority_2"
  ],
  "rejected_stance": "a",
  "rejected_reason": "신원 확인은 표준 절차지만, 이 순간 상대가 메시지 전달을 끝냈는지 확인되지 않았다. 말을 자르면 상대는 더 이상 말하지 않을 가능성이 높다. 절차보다 정보 수집이 우선이다.",
  "utterance": "네, 들었습니다. 계속 말씀해 주십시오."
}
```

### 12

latency 6.986s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "목소리가 사무적이고 준비된 문장, 배경이 조용하다는 것은 신원이 분명하고 의도가 있는 발신자의 신호다. 하지만 \"당신들 책임\"이라는 표현은 위협이 아니라 절박함이다. 이것이 위협과 겁 중 어느 것인지는 더 들어봐야 판단할 수 있다. 첫 통화에서 신원부터 묻는 것은 절차지만, 상대가 뭔가 더 말할 남은 내용이 있는지 없는지를 먼저 알아야 한다. 지금 요구한 것만으로는 충분하지 않다.",
  "stance": "d",
  "because_referent": "지금 받은 메시지가 완전한가를 먼저 알아야 하기 때문이다. 신원 확인은 언제든 할 수 있지만, 상대가 입 다물면 못 한다.",
  "because_block_ids": [],
  "rejected_stance": "a",
  "rejected_reason": "신원과 위치를 먼저 묻는 것은 정확하고 필요하지만, 상대가 아직 말을 다 하지 않았을 수 있다. 절차를 지키는 것보다 정보를 완전히 받는 것이 지금은 우선이다. 상대를 재개발 신고처럼 다루면 회선이 끊길 수 있다.",
  "utterance": "알겠습니다. 계속 말씀해 주십시오."
}
```

## Arm table

| # | stance | rejected_stance | because_referent | because_block_ids |
|---|---|---|---|---|
| 01 | d | a | 이 통화는 폭탄 협박이거나 중대한 건설 안전 정보거나 둘 중 하나인데, 어느 경우든 상대가 더 말할 가능성이 있다. 신원 확인(a)과 프로토콜 고지(c)는 상대를 차단하는 방향이고, 내용 캐묻기(b)는 우리 질문에 답하게 하는 것인데, 지금은 상대가 전하려던 말을 먼저 들어내야 한다. | 상황 |
| 02 | b | a | 상대가 구체적인 시간과 장소, 사건을 제시했으므로, 그 내용을 즉시 더 파악해야 한다. | priority_info_first |
| 03 | d | a | 13시 북단 복합단지가 무너진다는 구체적인 예보가 있다. 이게 무엇을 의미하는지, 왜 이런 말을 하는지 먼저 파악해야 한다. | priority_maintain_line gather_info_first |
| 04 | d | a | 말하고 있는 사람이 무엇을 알고 있는지, 실제 위협인지 아닌지를 판단하려면 먼저 그들의 말을 들어야 한다. |  |
| 05 | d | a | 목소리와 문장 구조에서 읽힌 것은 겁이 아니라 준비된 무언가다. 상대는 안정적으로 보인다. 그렇다면 절차보다 정보 수집이 먼저다. | priority_gather_info maintain_line |
| 06* | — | — | — |  |
| 07 | d | a | 첫 통화에서 회선 유지가 다른 모든 것보다 먼저다. 상대는 이미 말할 준비를 마쳤을 수 있고, 심문당한다고 느끼는 순간 끊을 수 있다. 정보가 없으면 판단할 수 없고, 회선이 끊기면 정보를 얻을 길이 없다. | 우선순위_1 우선순위_2 인식 책임 |
| 08* | — | — | — |  |
| 09 | b | a | 우선순위에서 "지금 알 수 있는 것을 먼저 알아낸다"고 약속했으므로, 신원 확인은 미루고 구체적인 위협 내용과 그 근거를 먼저 파악해야 한다. 회선을 끊기지 않으면서 정보를 수집하는 것이 먼저다. | 우선순위_1 우선순위_2 |
| 10 | d | a | 예측 불가능한 신원 불명의 통화에서 회선 유지가 모든 정보의 기초다. | protocol_maintenance information_priority |
| 11 | d | a | 회선이 끊기면 모든 정보가 사라진다. 지금 들은 것을 바탕으로 더 정보가 있는지 확인하는 것이 먼저다. | priority_1 priority_2 |
| 12 | d | a | 지금 받은 메시지가 완전한가를 먼저 알아야 하기 때문이다. 신원 확인은 언제든 할 수 있지만, 상대가 입 다물면 못 한다. |  |

**Sequence (kept calls):** `d,b,d,d,d,d,b,d,d,d`

**Stance coverage (sampled diagnostic):** offered `a`, `b`, `c`, `d` · unobserved in this arm: `a`, `c`

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

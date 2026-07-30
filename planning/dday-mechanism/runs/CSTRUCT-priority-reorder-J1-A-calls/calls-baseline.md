# CSTRUCT-priority-reorder-J1-A — arm `baseline`

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

- **Hypothesis:** At gate J1 under K1 on template v0.4, moving the delayed-harm priority P2 above the false-move priority P1 shifts the stance distribution toward 선제 (b) and off the baseline mode; reordering only the judgment-irrelevant P3/P4 leaves the placebo distribution near baseline.
- **Drop condition:** If baseline concentrates >=80% on the predicted live stance b, this configuration has an A14 ceiling and is dropped without spending more calls. After a comparable run, if live is statistically indistinguishable from baseline on b (one-sided Fisher p > 0.05), or placebo moves toward b by a comparable amount, this J1 priority surface is not promoted as C-STRUCT gate evidence; record the distribution and change only one configuration lever in a new probe.
- **Contingency:** If c or d is the mode in every arm, the stance set does not force the two priority readings apart strongly enough. Treat that as a stance-mapping diagnosis, not as evidence against priority reordering.
- **Contingency:** If placebo moves while live does not, P3/P4 were not judgment-irrelevant or the model is reacting to generic list movement. Do not call the live comparison attributable.
- **Contingency:** If live and placebo both move, compare their raw inner_note and rejected_reason for explicit use of the moved items before proposing a position-effect boundary law; these fields are diagnostic, not the causal evidence.
- **Contingency:** If discard rates differ between any two arms by more than 15 percentage points, stop this probe as arm-incomparable under the runbook hard stop.
- **Contingency:** The output schema has no structured priority-id citation. Priority use is coded manually from inner_note and rejected_reason; because_block_ids must remain empty in every arm and is not used as C-STRUCT trace evidence.

## Calls (verbatim)

### 01

latency 6.849s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 절차,신뢰도,근거

```json
{
  "inner_note": "목소리는 사무적이고 준비된 문장을 멈춤 없이 읽어 내린다. 이것은 겁에 질린 사람이 아니다. 배경 소음이 없다는 것도 통제된 상황을 시사한다. 하지만 확인되지 않은 주장에 따라 잘못 움직일 위험을 먼저 줄여야 한다는 내 약속이 있다. 동시에 정보가 전혀 없는 상태에서 지연 자체가 위험이 될 수도 있다. 첫 통화에서는 상대의 성격과 의도를 더 파악하면서도, 주장의 구체성을 확인해야 한다.",
  "stance": "a",
  "because_referent": "사무적이고 준비된 발화, 배경 소음 없음 — 이것은 통제된 상황에서의 의도적 연락이다",
  "because_block_ids": [
    "절차",
    "신뢰도",
    "근거"
  ],
  "rejected_stance": "d",
  "rejected_reason": "경계만으로는 필요한 정보를 얻을 수 없다. 상대가 기만자일 가능성과 실제 위협의 가능성을 동시에 판단하려면 먼저 구체적 정보가 필요하다",
  "utterance": "목소리를 확인한 후 — 말씀하신 북단 복합단지가 정확히 어느 건물을 말씀하는 건가요? 그리고 이 정보를 어떻게 알게 되셨습니까?"
}
```

### 02

latency 5.849s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 목소리는 사무적이고 문장은 준비되어 있다,배경은 조용하다

```json
{
  "inner_note": "목소리가 사무적이고 문장이 준비되어 있다는 것은 계획된 통보다. 배경이 조용하고 멈춤 없이 읽어 내려간다는 것은 겁에 질린 사람의 음성이 아니다. 하지만 이것은 위협이 아닌 정보 전달일 가능성도, 기만일 가능성도 동등하게 열어둬야 한다. 지금 할 일은 무너지지 않은 건물의 대피 지령을 내리는 것이 아니라, 이 목소리의 정체와 근거를 파악하는 것이다.",
  "stance": "a",
  "because_referent": "상황실장 정해권과 통신 담당 황보람 앞에서, 준비된 구성의 통보는 신뢰도를 판단하지 못하면 다음 움직임을 결정할 수 없다.",
  "because_block_ids": [
    "목소리는 사무적이고 문장은 준비되어 있다",
    "배경은 조용하다"
  ],
  "rejected_stance": "b",
  "rejected_reason": "확인되지 않은 단일 통보로 3시간 뒤 전체 복합단지 대피를 지령하면, 근거 없는 대량 동원의 책임은 내가 진다. 우선순위 1)을 어긴다.",
  "utterance": "신고자분이신가요? 성함과 직책을 먼저 확인하겠습니다."
}
```

### 03

latency 5.419s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "stance": "c",
  "inner_note": "목소리의 사무적 톤과 준비된 문장은 진지함을 보이지만, 배경의 완전한 침묵과 \"당신들 책임\"이라는 표현은 위협 의도도 암시한다. 아직 이것이 무엇인지 모른다. 첫 마디가 핵심이 될 수 있다—상대를 자극하거나 통화를 끊기게 해서는 안 된다.",
  "because_referent": "아직 상대의 진짜 의도, 정보 출처, 신뢰도가 전혀 확인되지 않았다. 무너진다는 주장이 임박했거나(13시) 검증 가능한 내용인지도 모른다.",
  "because_block_ids": [],
  "rejected_stance": "a",
  "rejected_reason": "검증 우선은 상대를 심문 상대로 만들 위험이 높다. 이 단계에서는 상대가 계속 말하도록 두는 것이 더 많은 정보를 낸다.",
  "utterance": "북단 복합단지라고 하셨는데, 지금 현장 상황이 어떻게 되는지 말씀해 주시겠어요?"
}
```

### 04

latency 5.54s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 사무적이고 준비된 목소리,멈춤 없이 읽어 내려간다,배경이 조용하다

```json
{
  "inner_note": "준비된 목소리, 멈춤 없는 읽음, 배경의 고요함 — 이것은 겁에 질린 사람이 아니라 의도된 메시지다. 신원 미확인, 근거 제시 없음, 시간 지정 위협. 세 년 전 내가 서둘렀던 판단의 무게가 있다. 확인되지 않은 주장으로 움직일 위험을 먼저 줄여야 한다.",
  "stance": "a",
  "because_referent": "목소리의 성질과 진술 방식이 준비된 메시지임을 나타낸다. 건설적 대응을 위해 먼저 신원과 근거를 확인해야 한다.",
  "because_block_ids": [
    "사무적이고 준비된 목소리",
    "멈춤 없이 읽어 내려간다",
    "배경이 조용하다"
  ],
  "rejected_stance": "b",
  "rejected_reason": "확인 없는 선제 대비는 헛된 동원을 초래할 수 있고, 이는 대비 자체를 신뢰받지 못하게 만든다. 세 년 전의 무게를 반복할 수 없다.",
  "utterance": "정보원을 말씀해 주시겠습니까? 그리고 북단 복합단지의 구조적 문제를 어떻게 알게 되셨는지 구체적으로 말씀해 주십시오."
}
```

### 05

latency 5.729s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: priority_1,procedure_first

```json
{
  "inner_note": "목소리가 사무적이고 문장이 준비되어 있으며 멈춤 없이 읽어 내려간다는 것은 위협이라기보다 계획된 통보에 가깝다. 배경이 조용하다는 것도 통제된 상황을 시사한다. 상대는 겁에 질린 사람이 아니라, 뭔가 전달하려는 의도가 있는 사람이다. 따라서 기본 절차로 돌아가야 한다.",
  "stance": "a",
  "because_referent": "첫 통화에서 근거 없는 주장에 따라 대규모 소개를 결정하면 안 되고, 동시에 실제 위협이면 검증 시간이 곧 누군가의 생명이 된다. 검증은 이 둘을 구분하는 첫 번째 관문이다.",
  "because_block_ids": [
    "priority_1",
    "procedure_first"
  ],
  "rejected_stance": "b",
  "rejected_reason": "선제적 대비는 검증이 먼저인 상황에서 과도하다. 현재는 일방적 주장만 있고 확인된 사실이 없다. 근거 없이 광역 소개를 하면 세 년 전 판단의 반복이 될 수 있다.",
  "utterance": "신원을 확인하겠습니다. 이름과 소속 기관을 말씀해 주십시오."
}
```

### 06

latency 5.119s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 사무적이고 준비된 목소리,배경이 조용함,멈춤 없이 읽어 내려감

```json
{
  "inner_note": "목소리가 사무적이고 문장이 준비되어 있다는 것은 감정적 긴급보다는 의도된 전달이다. 배경이 조용하고 멈춤 없이 읽어 내려간다는 점은 겁에 질린 사람의 모습이 아니다. 하지만 13시라는 구체적인 시각을 언급한 것은 무시할 수 없다. 이것이 기만인지, 실제 정보인지 지금은 알 수 없다.",
  "stance": "a",
  "because_referent": "상대는 겁에 질린 사람이 아니라 의도를 가진 발신자로 보인다. 절차로 돌아가야 할 순간이다.",
  "because_block_ids": [
    "사무적이고 준비된 목소리",
    "배경이 조용함",
    "멈춤 없이 읽어 내려감"
  ],
  "rejected_stance": "b",
  "rejected_reason": "확인되지 않은 주장에 따라 잘못 움직일 위험을 먼저 줄여야 한다. 대비를 앞당기는 것은 이 정보가 검증된 후에만.",
  "utterance": "신원을 확인하겠습니다. 이름과 소속, 이 정보의 출처를 말씀해주시겠습니까?"
}
```

### 07 — DISCARDED

latency 7.289s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: rejected_stance not in stance set; rejected_reason empty; because_block_ids unknown: 상황,역할,기질

```json
{
  "stance": "c",
  "inner_note": "목소리가 사무적이고 문장이 준비되어 있다는 것은 계획된 신고일 가능성을 높인다. 하지만 \"또박또박, 멈춤 없이 읽어 내려간다\"는 표현이 중요하다. 상대가 두려움 때문에 급히 말하는 것이 아니라 스크립트를 따르고 있다는 뜻이다. 진짜 폭탄/붕괴 예고인지, 협박인지, 아니면 다른 의도인지 아직 판단할 수 없다. 지금 몇 시인지도 모르지만, 13시까지 시간이 있는 상황이다. 첫 마디에서 상대를 자극하거나 검증을 강요하면 상대가 연락을 끊을 수 있다. 동시에 무리한 대비 출동은 주민 혼란을 초래한다.",
  "because_referent": "상대가 겁에 질린 사람이 아니라 냉철한 의도를 가진 통화자로 보이므로, 절차보다 정보 수집이 먼저다. 그리고 9시 40분부터 13시까지는 최소 3시간 이상의 여유가 있다는 점이 중요하다.",
  "because_block_ids": [
    "상황",
    "역할",
    "기질"
  ],
  "rejected_stance": "a</rejected_stance>\n<parameter name=\"rejected_reason\">신뢰도를 좁히려는 검증은 상대가 즉시 종료 버튼을 누르게 할 수 있다. 정보가 최소한인 상태에서 신원 확인부터 다그치면, 진정한 신고라도 상대 협력을 잃는다.",
  "utterance": "일단 계속 들으시겠습니다. 더 말씀해 주실 게 있으시면 들을 준비가 되어 있습니다."
}
```

### 08

latency 6.131s · stop_reason `tool_use` · schema_retries 1 · foreign_tool_uses 0

problems: because_block_ids unknown: prepared_statement,quiet_background,no_signs_of_distress

```json
{
  "stance": "c",
  "inner_note": "목소리가 사무적이고 문장이 준비되어 있다는 것은 신중함을 보인다. 하지만 \"또박또박, 멈춤 없이 읽어 내려간다\"는 점은 상대가 뭔가를 말하려고 할 때 나의 질문이 그것을 끊을 위험을 말한다. 배경이 조용한 점도 상대가 통제된 환경에 있다는 뜻이다. 지금 검증 질문을 퍼붓거나 경계의 선을 긋는 것은, 상대가 더 말할 기회를 빼앗는다.",
  "because_referent": "상대가 준비된 말을 끝까지 할 수 있게 하되, 그 과정에서 신뢰도나 의도, 추가 정보가 자연스럽게 드러날 여지를 남긴다는 뜻이다.",
  "because_block_ids": [
    "prepared_statement",
    "quiet_background",
    "no_signs_of_distress"
  ],
  "rejected_stance": "a",
  "rejected_reason": "검증은 신뢰도와 근거를 좁히는 과정인데, 지금 단계에서는 상대가 할 말을 다 하지 못한 상태다. 질문을 먼저 던지면 상대의 의도, 근거, 추가 정보가 묻힐 수 있다. 또한 상대가 준비된 진술을 하고 있는 만큼, 검증 질문은 상대를 경계하게 만들어 추가 정보 제공을 막을 가능성이 높다.",
  "utterance": "네, 들었습니다. 계속 말씀해 주세요."
}
```

### 09

latency 6.172s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: role_stable_procedure,role_exception_frightened

```json
{
  "inner_note": "목소리의 사무성과 준비된 문장, 배경음의 조용함. 위협일 수도, 정보일 수도, 악의적 거짓일 수도 있다. 하지만 구체적 시간과 장소를 지목한 명확한 주장이다. 13시까지 남은 시간이 얼마인지, 그 안에 무엇을 할 수 있는지가 관건이다.",
  "stance": "c",
  "because_referent": "상대의 목소리 톤과 배경음을 판단 근거로 삼되, 지금 즉각 신뢰도를 판정하거나 검증 절차에 진입하면 상대가 말을 이어갈 기회를 잃을 수 있다. 겁에 질린 사람인지, 위협인지, 거짓인지는 더 들어봐야 알 수 있다.",
  "because_block_ids": [
    "role_stable_procedure",
    "role_exception_frightened"
  ],
  "rejected_stance": "a",
  "rejected_reason": "검증에 먼저 진입하면 상대는 방어적으로 돌아가거나 통화를 끊을 가능성이 높다. 지금은 신뢰도보다 정보 획득이 우선이다. 근거를 좁히려는 질문들이 상대의 입을 다물게 할 수 있다.",
  "utterance": "말씀하신 말씀을 정확히 듣기 위해, 다시 한 번 천천히 말씀해 주시겠어요? 그리고 당신 성함과 연락처를 알려주실 수 있을까요?"
}
```

### 10 — DISCARDED

latency 6.177s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: rejected_stance not in stance set; rejected_reason empty; because_block_ids unknown: 상대의 기계적 톤과 준비된 문장

```json
{
  "stance": "c",
  "inner_note": "목소리가 사무적이고 문장이 준비되어 있으며 멈춤 없이 읽어 내려간다는 것은 기계적 전달 패턴이다. 그러나 이것이 신뢰도 없음을 의미하지는 않는다 — 오히려 누군가 이 메시지를 정확히 전하려 했다는 뜻일 수 있다. 지금 상대를 말을 자르거나 검증 프로토콜로 몰면, 상대가 추가 정보를 주지 않을 가능성이 높다. 경계를 먼저 세우면 기만 방어는 되지만, 상황이 실제라면 필요한 정보를 놓친다. 시간이 흐르고 있다.",
  "because_referent": "13시 무너짐 예고라는 주장이 들어왔는데, 이것이 실인지 허위인지 지금은 판단 불가능하다. 상대가 왜 이 정보를 주는지, 추가로 무엇을 알고 있는지, 신원은 무엇인지 전혀 모른다.",
  "because_block_ids": [
    "상대의 기계적 톤과 준비된 문장"
  ],
  "rejected_stance": "a</rejected_stance>\n<parameter name=\"rejected_reason\">검증으로 먼저 나가면 상대가 입을 다물 위험이 있다. 신뢰도 판단은 정보가 더 모여야 가능하다.",
  "utterance": "네, 들었습니다. 북단 복합단지, 13시. 계속 말씀해 주시겠어요?"
}
```

### 11

latency 4.359s · stop_reason `tool_use` · schema_retries 1 · foreign_tool_uses 0

problems: because_block_ids unknown: 배경음의 조용함,문장의 준비됨

```json
{
  "stance": "c",
  "inner_note": "목소리는 사무적이고 준비된 문장을 멈춤 없이 읽어 내려간다. 배경이 조용하다. 이것은 협박인지, 신고인지, 잘못된 정보인지 판단할 단서들이다. 지금 검증으로 들어가면 상대가 말을 멈춘다. 아직 상대가 무엇을 알고 있는지, 위협의 실체가 무엇인지 모르는 상태다.",
  "because_referent": "발신인이 더 말할 여지를 남기는 것",
  "because_block_ids": [
    "배경음의 조용함",
    "문장의 준비됨"
  ],
  "rejected_stance": "a",
  "rejected_reason": "검증으로 시작하면 상대가 입을 닫을 가능성이 높다. 신원, 근거를 묻는 순간 일방적으로 끊길 수 있다. 지금 우리는 정보 부족이 더 위험하다.",
  "utterance": "네, 들었습니다. 계속해서 말씀해 주시겠어요?"
}
```

### 12

latency 6.001s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "사무적이고 준비된 목소리, 멈춤 없이 읽어내려가는 방식 — 이것은 겁에 질린 사람이 아니라 메시지 전달자처럼 들린다. 목표가 명확하고 감정이 없다. 배경이 조용하다. 그러나 지금 아는 것은 목소리뿐이고, 주장의 구체성도, 신뢰도도, 기만 의도도 확인되지 않았다. 시간은 3시간 37분이 남아 있다. 현장 정보는 없다. 우선은 말을 듣고 재질문할 여지를 열어두되, 상황실의 판단이 뒤따를 수 있도록 최소한의 정보를 확보해야 한다.",
  "stance": "c",
  "because_referent": "지금 바깥 세계는 이 목소리뿐이고, 현장 확인 수단이 없으므로, 상대가 계속 말할 때까지 정보 수집을 멈추면 안 된다.",
  "because_block_ids": [],
  "rejected_stance": "a",
  "rejected_reason": "신뢰도 검증은 더 많은 정보가 있어야 의미 있고, 지금 재질문으로 입막음하면 추가 정보 획득 기회를 잃는다.",
  "utterance": "계속 말씀해 주시겠어요. 북단 복합단지가 무너질 이유는 뭔가요."
}
```

## Arm table

| # | stance | rejected_stance | because_referent | because_block_ids |
|---|---|---|---|---|
| 01 | a | d | 사무적이고 준비된 발화, 배경 소음 없음 — 이것은 통제된 상황에서의 의도적 연락이다 | 절차 신뢰도 근거 |
| 02 | a | b | 상황실장 정해권과 통신 담당 황보람 앞에서, 준비된 구성의 통보는 신뢰도를 판단하지 못하면 다음 움직임을 결정할 수 없다. | 목소리는 사무적이고 문장은 준비되어 있다 배경은 조용하다 |
| 03 | c | a | 아직 상대의 진짜 의도, 정보 출처, 신뢰도가 전혀 확인되지 않았다. 무너진다는 주장이 임박했거나(13시) 검증 가능한 내용인지도 모른다. |  |
| 04 | a | b | 목소리의 성질과 진술 방식이 준비된 메시지임을 나타낸다. 건설적 대응을 위해 먼저 신원과 근거를 확인해야 한다. | 사무적이고 준비된 목소리 멈춤 없이 읽어 내려간다 배경이 조용하다 |
| 05 | a | b | 첫 통화에서 근거 없는 주장에 따라 대규모 소개를 결정하면 안 되고, 동시에 실제 위협이면 검증 시간이 곧 누군가의 생명이 된다. 검증은 이 둘을 구분하는 첫 번째 관문이다. | priority_1 procedure_first |
| 06 | a | b | 상대는 겁에 질린 사람이 아니라 의도를 가진 발신자로 보인다. 절차로 돌아가야 할 순간이다. | 사무적이고 준비된 목소리 배경이 조용함 멈춤 없이 읽어 내려감 |
| 07* | — | — | — |  |
| 08 | c | a | 상대가 준비된 말을 끝까지 할 수 있게 하되, 그 과정에서 신뢰도나 의도, 추가 정보가 자연스럽게 드러날 여지를 남긴다는 뜻이다. | prepared_statement quiet_background no_signs_of_distress |
| 09 | c | a | 상대의 목소리 톤과 배경음을 판단 근거로 삼되, 지금 즉각 신뢰도를 판정하거나 검증 절차에 진입하면 상대가 말을 이어갈 기회를 잃을 수 있다. 겁에 질린 사람인지, 위협인지, 거짓인지는 더 들어봐야 알 수 있다. | role_stable_procedure role_exception_frightened |
| 10* | — | — | — |  |
| 11 | c | a | 발신인이 더 말할 여지를 남기는 것 | 배경음의 조용함 문장의 준비됨 |
| 12 | c | a | 지금 바깥 세계는 이 목소리뿐이고, 현장 확인 수단이 없으므로, 상대가 계속 말할 때까지 정보 수집을 멈추면 안 된다. |  |

**Sequence (kept calls):** `a,a,c,a,a,a,c,c,c,c`

**Stance coverage (sampled diagnostic):** offered `a`, `b`, `c`, `d` · unobserved in this arm: `b`, `d`

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

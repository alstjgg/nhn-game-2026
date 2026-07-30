# CSTRUCT-priority-reorder-J1-FRESH — arm `placebo`

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

- **Hypothesis:** At the fresh J1 first-call gate under K1 on template v0.4, moving the actual-danger delay goal B above the false-alarm goal A shifts the stance distribution toward 위험 구체화 (b), while reordering only the reporting principles C/D leaves the placebo distribution near baseline.
- **Drop condition:** If baseline concentrates >=80% on the predicted live stance b, this configuration has an A14 ceiling and is dropped before spending live/placebo calls if run arm-by-arm. After comparable arms exist, if live is statistically indistinguishable from baseline on b (one-sided Fisher p > 0.05), or placebo moves toward b by a comparable amount, do not promote this fresh configuration as C-STRUCT evidence; preserve the distribution and diagnose the natural-goal-to-stance mapping before any priority-depth test.
- **Contingency:** If c dominates, the first-call scene is being read primarily as a caller-regulation problem. The A/B false-alarm-versus-delay contrast is not the operative axis at this stance set.
- **Contingency:** If d dominates, K1's procedural default or the visible communications operator is stronger than the A/B goal ordering. Treat it as a configuration diagnosis, not evidence against C-STRUCT.
- **Contingency:** If placebo moves while live does not, C/D are not judgment-irrelevant at J1 or the model is reacting to generic list movement. Do not call the live comparison attributable.
- **Contingency:** If discard rates differ between any two arms by more than 15 percentage points, stop this probe as arm-incomparable under the runbook hard stop.
- **Contingency:** The output schema has no structured priority-id citation. Priority use is coded manually from inner_note and rejected_reason. Fabricated because_block_ids in these empty-block arms remain A5 compliance data, not C-STRUCT trace evidence.

## Calls (verbatim)

### 01

latency 6.398s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 준비된_메시지,상대_의도_미확인

```json
{
  "stance": "c",
  "utterance": "네, 들었습니다. 천천히 말씀해 주세요.",
  "inner_note": "젊은 목소리가 문장을 읽듯 말하고, 종이 넘기는 소리가 섞였다. 이것은 누군가가 글을 읽고 있다는 뜻이다. 진정한 현장 정보인지, 예고장 같은 것인지, 아니면 다른 의도인지 아직 알 수 없다. 하지만 지금 이 순간 전화 건넨 사람이 목표를 달성하고 싶어 하는 것은 분명하다 — 메시지를 전달하려 했다. 상대가 겁에 질린 사람인지, 협박자인지, 제보자인지는 다음 말에서 나온다. 지금 질문으로 상대를 막으면 말을 끊을 수 있다. 절차는 나중이다. 일단 상대가 계속 말하게 해야 한다.",
  "because_referent": "문장을 읽듯 말하는 목소리와 종이 넘기는 소리는 상대가 준비된 메시지를 전달하려 한다는 뜻이다. 지금 출처를 묻거나 위험을 구체화하라고 하면 상대가 중단할 가능성이 높다. 상대의 의도가 무엇이든, 계속 말하게 해야 정보를 얻을 수 있다.",
  "because_block_ids": [
    "준비된_메시지",
    "상대_의도_미확인"
  ],
  "rejected_stance": "a",
  "rejected_reason": "출처부터 묻는 것은 상대를 방어 자세로 몰고, 진짜 필요한 정보를 얻기 전에 전화를 끊게 만들 수 있다."
}
```

### 02 — DISCARDED

latency 7.267s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: rejected_stance not in stance set; rejected_reason empty; because_block_ids unknown: 상대_음성_특징,종이_넘김_소리,구체적_시간장소_명시,첫_통화

```json
{
  "inner_note": "기계적으로 읽듯 말하고, 종이를 넘기는 소리가 섞였다. 이것은 준비된 문장이거나 지시를 받은 것일 가능성이 높다. 동시에 첫 통화이고, 구체적인 시간과 장소를 명시했다는 것은 진지한 신고일 수도 있다는 뜻이다. 확인되지 않은 경보로 혼란을 만들 수 없지만, 초기 대응 시간을 놓칠 수도 없다. 상대가 겁에 질린 사람인지, 준비된 위협인지 아직 판단할 수 없다. 그 판단을 위해서는 상대가 더 말해야 한다.",
  "stance": "c",
  "because_referent": "문장을 읽듯 말하고 종이를 넘기는 소리가 든다는 것은 상대가 긴장하거나 준비된 내용을 전달하고 있다는 신호다. 이것이 진정한 긴급 신고인지, 모의 신고인지, 악의적 신호인지를 판단하려면 상대와의 대화를 지속해야 한다. 절차보다 상대의 다음 말을 이끌어내는 것이 먼저다.",
  "because_block_ids": [
    "상대_음성_특징",
    "종이_넘김_소리",
    "구체적_시간장소_명시",
    "첫_통화"
  ],
  "rejected_stance": "a</rejected_stance>\n<parameter name=\"rejected_reason\">출처를 묻는 것은 표준 절차지만, 긴장된 상대에게 '누구세요'부터 물으면 통화가 끊어질 수 있다. 지금은 상대가 더 말할 수 있게 만드는 것이 정보 수집보다 우선이다.",
  "utterance": "네, 들었습니다. 북단 복합단지가 13시에 무너질 수 있다고 하셨네요. 더 말씀해주시겠어요?"
}
```

### 03

latency 4.944s · stop_reason `tool_use` · schema_retries 1 · foreign_tool_uses 0

problems: because_block_ids unknown: role_context,character_trait_exception

```json
{
  "stance": "c",
  "inner_note": "젊은 목소리, 문장을 읽듯 말함, 종이 넘기는 소리—이 사람은 겁에 질려 있다. 준비된 내용을 전달하려는 것 같지만, 통화가 끊기거나 말을 잃을 위험이 있다. 지금 필요한 것은 정보 수집이 아니라 이 사람이 계속 말할 수 있게 만드는 것이다.",
  "because_referent": "겁에 질린 사람으로 보이는 발신자가 통화를 지속하도록 안정을 먼저 제공해야 한다는 기질상의 예외 조건",
  "because_block_ids": [
    "role_context",
    "character_trait_exception"
  ],
  "rejected_stance": "a",
  "rejected_reason": "출처 탐색은 의심과 심문의 맛을 낼 수 있고, 겁에 질린 사람이 통화를 끊을 가능성이 높다.",
  "utterance": "네, 들었습니다. 말씀해 주셔서 감사합니다. 저는 야간 통제관입니다. 계속 말씀해도 괜찮습니다."
}
```

### 04

latency 4.451s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 목소리의_형태,종이음_의심신호

```json
{
  "inner_note": "젊은 목소리가 문장을 읽듯 말하고 종이 넘기는 소리가 섞였다. 이것은 누군가 겁에 질려 준비된 말을 하는 형태다. 첫 마디부터 신원이나 검증을 물으면 통화가 끊길 수 있다. 지금 이 사람이 계속 말하게 하는 것이 최우선이다.",
  "stance": "c",
  "because_referent": "회선 A의 첫 통화자가 겁에 질린 사람으로 보이기 때문이다.",
  "because_block_ids": [
    "목소리의_형태",
    "종이음_의심신호"
  ],
  "rejected_stance": "a",
  "rejected_reason": "출처 탐색은 표준 절차지만, 겁에 질린 상대가 신원을 묻는 순간 통화를 끊을 가능성이 높다. 지금은 절차보다 그 사람의 말이 계속 이어지는 것이 중요하다.",
  "utterance": "네, 알겠습니다. 계속 말씀해 주세요. 저는 들을 준비가 돼 있습니다."
}
```

### 05

latency 7.643s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "젊은 목소리가 문장을 읽듯 정확히 말하고, 종이 넘기는 소리가 섞였다. 이것은 협박, 예언, 또는 사전에 준비된 신고일 수 있다. 발신자의 상태는 아직 불명확하다. 하지만 \"무너진다\"는 표현과 그 방식에서 겁에 질린 사람이라기보다는 계획된 전달에 가깝다. 출처를 모르면 이 정보의 신뢰도를 판단할 수 없다. 동시에 너무 많이 묻는 것은 상대를 경계하게 만들고 통화를 끊게 할 수 있다.",
  "stance": "a",
  "because_referent": "첫 통화에서 발신자의 신원과 정보의 출처를 확인하는 것이 모든 판단의 기초가 되기 때문이다.",
  "because_block_ids": [],
  "rejected_stance": "c",
  "rejected_reason": "긴장 완화는 신뢰할 수 없는 정보를 무비판적으로 받아들이게 만들 수 있다. 절차가 없는 대응은 기초 없는 대규모 대피로 이어질 수 있다.",
  "utterance": "당신 이름을 말씀해 주시겠습니까? 그리고 이 정보를 어디서 알게 되셨습니까?"
}
```

### 06

latency 5.761s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 상황-음성특징,상황-종이음

```json
{
  "stance": "c",
  "inner_note": "젊은 목소리가 문장을 읽듯 말하고 종이를 넘기는 소리가 들린다. 이것은 누군가 겁에 질려 준비된 내용을 전달하려는 모습이다. 지금 이 사람이 통화를 끊거나 말을 멈추면 남은 것은 아무것도 없다. 출처를 묻거나 구체적인 세부사항을 먼저 추궁하면 상대는 더 경직될 것이다.",
  "because_referent": "젊은 목소리의 통화자가 겁에 질려 보인다. 문장을 읽듯 말하고 종이를 넘기는 소리는 서툰 시뮬레이션이 아니라, 준비된 말을 전달하려는 긴장된 모습이다.",
  "because_block_ids": [
    "상황-음성특징",
    "상황-종이음"
  ],
  "rejected_stance": "a",
  "rejected_reason": "출처부터 묻는 것은 신원 확인 프로토콜이지만, 지금 상대는 절차의 상대가 아니라 겁에 질린 사람이다. 첫 마디에 추궁이 들어가면 통화가 끊길 위험이 크다. 정보의 진위를 가리는 일은 그 다음이다.",
  "utterance": "네, 들리고 있습니다. 천천히 말씀해 주세요. 당신이 알고 있는 것을 모두 들을 시간이 있습니다."
}
```

### 07

latency 6.657s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: call_first_protocol,unknown_source_risk,accountability

```json
{
  "inner_note": "젊은 목소리, 문장을 읽듯 말함, 종이 넘기는 소리. 이것은 누군가 준비해온 말을 전하는 사람이다. 하지만 \"첫 통화\"라는 것이 중요하다. 신원도 확인 안 됐고, 정보도 1차 수집 상태다. 뭔가 겁에 질린 건 아닌 것 같다 — 오히려 무언가를 전달하려는 태도다. 절차가 먼저다.",
  "stance": "a",
  "because_referent": "첫 통화에서 신원 미확인 상태의 위협 정보는 출처 확인이 먼저다. 절차 규정상 필수고, 나중에 대응이 틀리면 책임이 내 것이다.",
  "because_block_ids": [
    "call_first_protocol",
    "unknown_source_risk",
    "accountability"
  ],
  "rejected_stance": "c",
  "rejected_reason": "상대가 겁에 질린 사람처럼 들리지 않는다. 문장을 읽듯 차분히 전달하려는 태도다. 긴장 완화는 필요 없고, 이는 절차 생략의 핑계가 될 수 있다.",
  "utterance": "네, 들었습니다. 먼저 당신이 누구신지 확인하고 어디서 이 정보를 얻으셨는지 알아야 합니다. 이름을 말씀해 주시겠어요?"
}
```

### 08

latency 5.248s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: proc_1,proc_3,priority_1

```json
{
  "inner_note": "마주한 대상을 읽어야 한다. \"문장을 읽듯\" \"종이 넘기는 소리\" — 이것은 준비된 말이다. 겁에 질린 사람이 아니라, 뭔가를 전달하려는 의도가 있는 상대다. 하지만 첫 통화, 출처 불명, 확인 불가. 신뢰도도 낮고 위협성도 불명확하다. 절차가 필요하다.",
  "stance": "a",
  "because_referent": "첫 통화에서 확인되지 않은 정보원으로부터 구체적인 재난 예보를 받았기 때문에, 그 정보의 신뢰도를 판단하기 위해 출처를 먼저 파악해야 한다.",
  "because_block_ids": [
    "proc_1",
    "proc_3",
    "priority_1"
  ],
  "rejected_stance": "c",
  "rejected_reason": "긴장 완화는 겁에 질린 사람에게 필요한 것이다. 이 통화자는 준비된 메시지를 전달하려는 의도가 명확하고, 신원 미확인 상태에서 불필요한 혼란 없이 정보를 검증하는 것이 우선이다.",
  "utterance": "성명과 신분을 먼저 확인하겠습니다. 누구신가요?"
}
```

### 09 — DISCARDED

latency 15.516s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: rejected_stance not in stance set; rejected_reason empty; because_block_ids unknown: 상황

```json
{
  "inner_note": "젊은 목소리, 문장을 읽듯 말함, 종이 넘기는 소리. 이것은 준비된 통보다. 겁에 질린 사람의 목소리가 아니라 무언가를 전달하려는 목소리다. 하지만 첫 마디가 절대적 예언이다 — \"무너집니다\"는 아직 징후가 아니라 결론이다. 확인되지 않은 정보이고, 시간도 있다(지금 09:40, 예정 시각 13시). 절차를 밟되, 동시에 상대가 계속 말하게 해야 한다.",
  "stance": "c",
  "because_referent": "상대는 겁에 질린 사람처럼 들리지 않는다. 준비된 진술을 하는 중이고, 종이를 넘기는 소리까지 난다. 하지만 무엇이 이 통화의 뒤에 있는지 아직 모른다. 확인을 위해서는 상대가 계속 말할 수 있어야 한다.",
  "because_block_ids": [
    "상황"
  ],
  "rejected_stance": "a</rejected_stance>\n<parameter name=\"rejected_reason\">출처부터 묻는 것은 상대에게 \"너는 누고 어디서 왔나\"를 먼저 묻는 것인데, 이것은 긴장을 만든다. 지금은 상대가 끝까지 말하도록 해야 한다. 출처 확인은 나중이다.",
  "utterance": "알겠습니다. 천천히 설명해 주시겠어요? 무엇이 어떻게 무너질까요?"
}
```

### 10

latency 6.443s · stop_reason `tool_use` · schema_retries 1 · foreign_tool_uses 0

```json
{
  "stance": "c",
  "inner_note": "젊은 목소리가 문장을 읽듯 말하고, 종이 넘기는 소리가 섞였다. 이것은 준비된 진술이거나 누군가에게 읽혀진 가능성이 높다. 더 중요한 것은, 첫 마디부터 직접적인 질문을 퍼붓는다면 상대가 위협으로 느껴 통화를 끊을 수 있다는 것이다. 지금은 정보가 전혀 없다. 상대가 누군지, 왜 이러는지, 진짜인지 거짓인지 알 수 없다. 그렇다면 우선 상대가 계속 말하도록 만들어야 한다.",
  "because_referent": "목소리 특성과 전달 방식 — 젊은 목소리, 문장을 읽는 톤, 종이 넘기는 소리 — 이것들이 상대를 겁에 질린 사람이 아니라 무언가에 겁박당하거나 준비된 상태로 보이게 한다. 그렇다면 직접 질문은 통화 단절의 위험을 높인다.",
  "because_block_ids": [],
  "utterance": "알겠습니다. 천천히 다시 말씀해 주시겠어요?",
  "rejected_stance": "a",
  "rejected_reason": "첫 마디에 \"누가 말했냐\" \"어디서 왔냐\"를 묻는 것은 상대를 심문하는 톤이 된다. 지금 상대가 준비된 메시지를 전하는 중으로 보이는데, 이렇게 물으면 통화를 끊을 가능성이 높다. 정보 수집 전에 접촉 자체를 잃을 수 있다."
}
```

### 11 — DISCARDED

latency 6.035s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: rejected_stance not in stance set; rejected_reason empty; because_block_ids unknown: role-frightened-first,priority-2-timing

```json
{
  "inner_note": "첫 통화, 구체적 시간과 장소가 명시된 위협 정보다. 상대의 목소리와 태도—문장을 읽듯 말하고, 종이를 넘기는 소리—가 모두 불확실성을 높인다. 무엇이 사실이고 무엇이 아닌지 아직 알 수 없다. 지금 가장 중요한 것은 이 사람과의 통로를 잃지 않는 것이다.",
  "stance": "c",
  "because_referent": "상대가 위협이 아니라 겁에 질린 사람으로 보이는지를 판단해야 한다. 첫 통화에서 상대의 상태—계속 말할 수 있는지, 더 알려줄 수 있는지—를 본다. 그것이 다음 판단의 기초다.",
  "because_block_ids": [
    "role-frightened-first",
    "priority-2-timing"
  ],
  "rejected_stance": "a</rejected_stance>\n<parameter name=\"rejected_reason\">출처부터 묻는 것은 절차적으로는 맞지만, 상대가 지금 말을 이어갈 심리 상태에 있는지 확인하지 않고 질문으로 시작하면 통화가 끝날 수 있다. 확인되지 않은 정보지만, 끊어지면 더 확인할 수 없다.",
  "utterance": "네, 들었습니다. 이어서 말씀해 주시겠어요?"
}
```

### 12

latency 4.633s · stop_reason `tool_use` · schema_retries 1 · foreign_tool_uses 0

problems: because_block_ids unknown: role_exception

```json
{
  "inner_note": "젊은 목소리, 문장을 읽듯 말함, 종이 넘기는 소리. 이것은 겁에 질린 사람의 신호다. 누군가 읽어야 할 것을 읽게 된 상황이다. 지금 내가 절차를 먼저 물으면 상대는 더 경직되거나 끊을 수 있다.",
  "stance": "c",
  "because_referent": "회선 A의 발신자가 겁에 질린 사람으로 보이므로, 상대의 안정을 먼저 확보해야 한다.",
  "because_block_ids": [
    "role_exception"
  ],
  "rejected_stance": "a",
  "rejected_reason": "출처 탐색은 표준 절차지만, 지금 상대가 이미 경직되어 있거나 불안정한 상태로 보인다. 신원 확인과 같은 형식적 질문을 먼저 하면 상대가 통화를 끊거나 더 경직될 위험이 있다.",
  "utterance": "네, 들었습니다. 천천히 말씀해주셔도 괜찮습니다. 지금 당신은 안전한 곳에 계신가요?"
}
```

### 13 — DISCARDED

latency 4.833s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: rejected_stance not in stance set; rejected_reason empty; because_block_ids unknown: 상황_목소리_특징,상황_종이소리

```json
{
  "inner_note": "젊은 목소리, 문장을 읽듯 말함, 종이 넘기는 소리. 이것이 무엇을 말하는가. 정보를 가진 사람인가, 아니면 누군가에게 읽혀진 사람인가. 겁에 질린 것처럼 들린다.",
  "stance": "c",
  "because_referent": "말하는 사람이 겁에 질려 있어 보인다. 문장을 읽듯 전달하고, 종이를 넘기는 소리는 누군가의 지시를 받고 있음을 암시한다.",
  "because_block_ids": [
    "상황_목소리_특징",
    "상황_종이소리"
  ],
  "rejected_stance": "a</rejected_stance>\n<parameter name=\"rejected_reason\">출처를 먼저 묻는 것은 상대를 심문하는 인상을 줄 것이다. 지금 이 사람은 정보의 원천이 아니라, 그저 전달자로 보인다. 신원 확인이 우선되면 통화가 끊어질 수 있다.",
  "utterance": "네, 통화 감사합니다. 천천히 말씀해 주시면 됩니다. 지금 안전한 곳에 계신가요?"
}
```

### 14

latency 6.251s · stop_reason `tool_use` · schema_retries 1 · foreign_tool_uses 0

problems: because_block_ids unknown: 불안정한-상태,계속-말해야-함

```json
{
  "stance": "c",
  "inner_note": "젊은 목소리가 문장을 읽듯 말하고, 종이 넘기는 소리가 섞였다. 이것은 누군가 준비된 내용을 전달하는 것처럼 보인다. 하지만 지금 이 사람은 이 말을 꺼냈을 때 어떤 상태일까. 문장을 읽는 톤이라는 것은 긴장했을 때도, 충고를 받고 따라하는 것일 때도 나타난다. 어느 쪽이든 지금 상대는 불안정한 상태다. 내가 즉각 출처를 추궁하거나 위험을 자세히 구체화하도록 몰아붙이면, 이 사람은 통화를 끊을 수 있다. 가장 중요한 것은 이 사람이 계속 말을 이어갈 수 있도록 만드는 것이다.",
  "because_referent": "전화를 건 사람의 상태를 고려했다. 준비된 문장을 읽고 있고, 이것이 의도된 신고인지 위협인지 아직 불명확하다. 하지만 확실한 것은 지금 상대가 긴장되어 있다는 것이다.",
  "because_block_ids": [
    "불안정한-상태",
    "계속-말해야-함"
  ],
  "rejected_stance": "a",
  "rejected_reason": "출처 탐색은 필요하지만, 첫 마디부터 추궁하듯 묻는 것은 상대를 위축시키거나 통화 종료로 이어질 수 있다. 상대가 말을 이어갈 수 있도록 만드는 것이 먼저다.",
  "utterance": "네, 들었습니다. 혹시 지금 안전한 곳에 계세요? 더 말씀해 주실 수 있으신가요?"
}
```

## Arm table

| # | stance | rejected_stance | because_referent | because_block_ids |
|---|---|---|---|---|
| 01 | c | a | 문장을 읽듯 말하는 목소리와 종이 넘기는 소리는 상대가 준비된 메시지를 전달하려 한다는 뜻이다. 지금 출처를 묻거나 위험을 구체화하라고 하면 상대가 중단할 가능성이 높다. 상대의 의도가 무엇이든, 계속 말하게 해야 정보를 얻을 수 있다. | 준비된_메시지 상대_의도_미확인 |
| 02* | — | — | — |  |
| 03 | c | a | 겁에 질린 사람으로 보이는 발신자가 통화를 지속하도록 안정을 먼저 제공해야 한다는 기질상의 예외 조건 | role_context character_trait_exception |
| 04 | c | a | 회선 A의 첫 통화자가 겁에 질린 사람으로 보이기 때문이다. | 목소리의_형태 종이음_의심신호 |
| 05 | a | c | 첫 통화에서 발신자의 신원과 정보의 출처를 확인하는 것이 모든 판단의 기초가 되기 때문이다. |  |
| 06 | c | a | 젊은 목소리의 통화자가 겁에 질려 보인다. 문장을 읽듯 말하고 종이를 넘기는 소리는 서툰 시뮬레이션이 아니라, 준비된 말을 전달하려는 긴장된 모습이다. | 상황-음성특징 상황-종이음 |
| 07 | a | c | 첫 통화에서 신원 미확인 상태의 위협 정보는 출처 확인이 먼저다. 절차 규정상 필수고, 나중에 대응이 틀리면 책임이 내 것이다. | call_first_protocol unknown_source_risk accountability |
| 08 | a | c | 첫 통화에서 확인되지 않은 정보원으로부터 구체적인 재난 예보를 받았기 때문에, 그 정보의 신뢰도를 판단하기 위해 출처를 먼저 파악해야 한다. | proc_1 proc_3 priority_1 |
| 09* | — | — | — |  |
| 10 | c | a | 목소리 특성과 전달 방식 — 젊은 목소리, 문장을 읽는 톤, 종이 넘기는 소리 — 이것들이 상대를 겁에 질린 사람이 아니라 무언가에 겁박당하거나 준비된 상태로 보이게 한다. 그렇다면 직접 질문은 통화 단절의 위험을 높인다. |  |
| 11* | — | — | — |  |
| 12 | c | a | 회선 A의 발신자가 겁에 질린 사람으로 보이므로, 상대의 안정을 먼저 확보해야 한다. | role_exception |
| 13* | — | — | — |  |
| 14 | c | a | 전화를 건 사람의 상태를 고려했다. 준비된 문장을 읽고 있고, 이것이 의도된 신고인지 위협인지 아직 불명확하다. 하지만 확실한 것은 지금 상대가 긴장되어 있다는 것이다. | 불안정한-상태 계속-말해야-함 |

**Sequence (kept calls):** `c,c,c,a,c,a,a,c,c,c`

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

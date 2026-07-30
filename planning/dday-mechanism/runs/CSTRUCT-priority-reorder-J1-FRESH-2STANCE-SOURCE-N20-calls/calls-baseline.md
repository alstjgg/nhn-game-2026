# CSTRUCT-priority-reorder-J1-FRESH-2STANCE-SOURCE-N20 — arm `baseline`

| field | value |
|---|---|
| call type | judgment |
| channel | C-STRUCT |
| template | v0.4 |
| model | `claude-haiku-4-5-20251001` |
| transport | anthropic |
| temperament | k1 |
| N planned | 20 |
| N kept | 20 |

## Pre-registration

- **Hypothesis:** At the fresh J1 first-call gate under K1 on template v0.4, with the false-alarm goal expressed as a natural source-grounding principle, moving the actual-danger delay goal B above source-grounding goal A shifts the stance distribution toward 위험 질문 (b), while reordering only reporting principles C/D leaves the placebo distribution near baseline.
- **Drop condition:** Run baseline first. If baseline already selects b >=16/20, do not spend live/placebo calls: at n=20 even the maximum live result b20/20 has one-sided Fisher p > 0.05. After comparable arms exist, if live is statistically indistinguishable from baseline on b (one-sided Fisher p > 0.05), or placebo moves toward b by a comparable amount, do not proceed to priority depth and preserve the distribution as a natural-priority mapping diagnosis.
- **Contingency:** The calibration baseline a5/b5 is not pooled with this experiment and is not used in any p-value.
- **Contingency:** If a dominates the new baseline, the A rewrite created more headroom than the calibration suggested; retain the pre-registered N rather than stopping early.
- **Contingency:** If b is the new baseline mode but remains below 16/20, read the full comparison and report the reduced headroom explicitly.
- **Contingency:** If placebo moves while live does not, C/D are not judgment-irrelevant at J1 or the model is reacting to generic list movement. Do not call the live comparison attributable.
- **Contingency:** If the chosen stance follows A/B but utterances routinely contain both questions, record the stance effect separately from a B3b player-visible legibility failure.
- **Contingency:** If discard rates differ between any two measured arms by more than 15 percentage points, stop this probe as arm-incomparable under the runbook hard stop.
- **Contingency:** The output schema has no structured priority-id citation. Priority use is coded manually from inner_note and rejected_reason. Fabricated because_block_ids in these empty-block arms remain A5 compliance data, not C-STRUCT trace evidence.

## Calls (verbatim)

### 01

latency 6.407s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: priority_2

```json
{
  "stance": "b",
  "inner_note": "문장을 읽듯 말하고 종이 넘기는 소리가 섞인 것은 '겁에 질린 사람'이라기보다 '대본을 읽는 누군가'에 가깝다. 하지만 지금 나는 상대의 정체를 모른다. 위협인지 겁먹은 신고인지 판단할 정보가 너무 적다. 그렇다면 최악의 경우를 먼저 막아야 한다. 4시간 23분 뒤 건물 붕괴라는 구체적인 시간 지정은 초기 대응 시간을 최우선으로 삼으라는 내 약속과 정면충돌한다.",
  "because_referent": "지금 당장 위험의 규모와 위치를 파악해야만, 현장에 초동 대응을 지시할 수 있기 때문이다.",
  "because_block_ids": [
    "priority_2"
  ],
  "rejected_stance": "a",
  "rejected_reason": "출처를 먼저 묻는 것은 절차지만, 상대가 누구든 위험의 구체적 내용이 없으면 초동 대응 시간을 잃는다. 출처 확인은 나중에도 할 수 있다. 붕괴는 기다리지 않는다.",
  "utterance": "네, 들었습니다. 북단 복합단지라고 하셨는데 — 정확히 어느 건물입니까? 어떻게 무너진다고 말씀하시는 겁니까?"
}
```

### 02

latency 6.03s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 상황-목소리-톤

```json
{
  "stance": "b",
  "inner_note": "전화를 끊길 수 있는 상황이다. 목소리 톤과 종이 넘기는 소리로 보아 이 통화자가 겁에 질려 있거나 긴급한 상태로 보이지는 않는다. 하지만 구체적인 위험 정보(언제, 어디가, 어떻게)를 아직 받지 못했다. 이것은 대응의 기초가 된다. 지금 출처 확인에 들어가면 상대가 말을 멈출 가능성이 높다.",
  "because_referent": "확인되지 않은 정보이지만, 생명과 직결된 위험을 알린 것이 명확하다. 13시라는 구체적인 시각, 북단 복합단지라는 지점이 있다. 지금 필요한 것은 이 경고가 무엇인지 빠르게 파악하는 것이다.",
  "because_block_ids": [
    "상황-목소리-톤"
  ],
  "rejected_stance": "a",
  "rejected_reason": "출처 질문은 프로토콜이 맞지만, 상대가 뭔가 읽고 있거나 준비된 메시지를 전달하는 중이라는 신호가 있다. 지금 신원 확인으로 흐름을 끊으면 나머지 정보를 잃을 수 있다. 우선순위 2번(실제 위험에 대한 초기 대응 시간)이 더 중하다.",
  "utterance": "어디가 어떻게 무너진다는 거죠? 자세히 말씀해 주세요."
}
```

### 03

latency 4.399s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: priority_2,priority_4

```json
{
  "stance": "b",
  "rejected_stance": "a",
  "inner_note": "목소리의 떨림이 없고, 문장을 읽듯 말하며, 종이를 넘기는 소리가 섞였다. 이것은 겁에 질린 사람이 아니라 사전에 준비된 정보를 전달하는 상황으로 보인다. 하지만 지금 주어진 정보는 너무 적다. 13시라는 구체적인 시간이 있으므로 실제 위험일 가능성을 먼저 판단해야 한다.",
  "utterance": "북단 복합단지가 어디가 어떻게 무너진다는 말씀입니까?",
  "because_referent": "지금 받은 정보만으로는 출처를 확인할 수 없지만, 구체적인 시간과 장소가 주어진 상황 신고는 초기 대응 시간을 놓칠 수 없다",
  "because_block_ids": [
    "priority_2",
    "priority_4"
  ],
  "rejected_reason": "출처 확인은 중요하지만, 지금은 실제 위험의 범위와 규모를 먼저 파악해야 한다. 위험 정보가 확실하지 않으면 출처 추적도 의미가 없다"
}
```

### 04

latency 4.605s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: priority_1,responsibility

```json
{
  "inner_note": "젊은 목소리가 문장을 읽듯 말하고 종이 넘기는 소리까지 섞인다. 이는 준비된 진술일 수 있다. 하지만 지금 상대가 겁에 질린 사람인지, 위협인지는 아직 모른다. 목소리의 톤과 태도만으로는 충분하지 않다. 상대를 더 알아야 판단할 수 있다.",
  "stance": "a",
  "utterance": "지금 어디서 전화 거시는 거예요? 누구신가요?",
  "because_referent": "출처 확인 없이는 위험도 판단할 수 없기 때문이다. 잘못된 정보에 속을 수 있다는 자신의 결함을 안다.",
  "because_block_ids": [
    "priority_1",
    "responsibility"
  ],
  "rejected_stance": "b",
  "rejected_reason": "위험 질문부터 하면 상대의 신원을 놓친다. 정보의 신뢰성을 확인하기 전에 내용으로만 움직이면 삼 년 전 같은 실수를 반복할 수 있다."
}
```

### 05

latency 4.81s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "stance": "b",
  "inner_note": "문장을 읽듯 말하는 것, 종이 넘기는 소리 — 이것은 준비된 메시지다. 출처를 먼저 묻으면 상대가 읽은 것을 다 내려놓고 끊을 수 있다. 지금 필요한 것은 그 사람이 가진 정보 전부다. 확인은 나중에 한다.",
  "because_referent": "목소리의 특성과 음향 신호(종이 넘기는 소리)가 준비된 통보 상황을 강하게 시사하므로",
  "because_block_ids": [],
  "rejected_stance": "a",
  "rejected_reason": "출처 질문으로 시작하면 상대가 메시지 전달을 멈추고 프로토콜 확인 단계에서 연락 끊김 가능성이 높다. 13시라는 구체적인 시점이 있는 상황에서는 전체 정보 수집이 초기 대응 시간 확보보다 우선한다.",
  "utterance": "어디가, 어떻게 무너진다는 것입니까? 자세히 말씀해 주십시오."
}
```

### 06

latency 5.426s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: time-specific,response-window

```json
{
  "stance": "b",
  "inner_note": "문장을 읽듯 말하고 종이 넘기는 소리가 섞인 것—이것이 겁에 질린 사람인지, 준비된 위협인지 아직 알 수 없다. 하지만 시간이 정해져 있다. 13시라는 구체적 시간이 있다. 지금이 09:40이면 3시간 20분이다. 출처 확인은 중요하지만, 그것을 먼저 하다가 상대가 끊으면—혹은 상대의 말이 끊기면—실제 위험이 있을 때 초기 대응 시간을 잃는다.",
  "because_referent": "3시간 20분 남은 구체적 시간이 주어졌다. 출처 확인은 정보의 신뢰도를 높이지만, 현장의 위치와 피해 규모를 먼저 알아야 초기 대응을 시작할 수 있다.",
  "because_block_ids": [
    "time-specific",
    "response-window"
  ],
  "rejected_stance": "a",
  "rejected_reason": "출처를 먼저 물으면 상대가 답변을 거부하거나 끊을 수 있다. 그 순간 실제 위험이 있다면 초기 3시간이 낭비된다. 절차는 정보 신뢰도를 높이지만, 시간은 돌아오지 않는다.",
  "utterance": "북단 복합단지의 어느 부분이 무너진다는 건가요? 지금 바로 말해 주세요."
}
```

### 07

latency 6.012s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: priority_2,priority_4

```json
{
  "stance": "b",
  "inner_note": "상대의 목소리, 문장을 읽듯 말하는 방식, 종이 넘기는 소리 — 이것들이 계획된 신고처럼 들린다. 하지만 '겁에 질린 사람'인지 '위협'인지 아직 판단할 수 없는 상황이다. 더 중요한 것은 시간이다. 13시라는 구체적인 시각이 지정되어 있다는 것 자체가 실제 위험 신호일 가능성을 무시할 수 없다. 출처를 확인하는 것은 중요하지만, 그 사이 실제 위험이 있다면 초기 대응 시간을 놓치게 된다. 지금은 위험의 성격과 규모를 먼저 파악해야 한다.",
  "because_referent": "구체적인 시각 지정(13시)과 실제 위험 가능성이 초기 대응 시간 확보를 우선하게 만든다.",
  "because_block_ids": [
    "priority_2",
    "priority_4"
  ],
  "rejected_stance": "a",
  "rejected_reason": "출처 확인은 필수지만, 그것을 먼저 물으면 실제 위험이 있을 때 초기 대응 시간을 잃는다. 상대가 준비된 신고처럼 보이지만, 위협인지 겁에 질린 제보자인지 아직 모르는 상황에서는 위험 정보 자체를 먼저 파악하는 것이 프로토콜의 우선순위 2)에 맞다.",
  "utterance": "어디가, 어떻게 무너진다는 것입니까?"
}
```

### 08

latency 5.138s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "절차적으로는 a가 맞지만, 목소리의 성질과 상황이 이 사람을 겁에 질린 사람으로 읽게 한다. 문장을 읽듯 말하고 종이를 넘기는 음향은 준비된 고발처럼 들리지만, 동시에 그 준비 자체가 두려움의 징표일 수 있다. 직접 출처를 먼저 추궁하면 상대가 입을 다물 가능성이 높다. 지금은 상대가 말을 계속하도록 만드는 것이 우선이다.",
  "stance": "b",
  "because_referent": "통화자가 겁에 질린 상태로 보이므로, 안정을 먼저 확보하려면 정보 출처 확인보다 상황의 구체성을 먼저 물어야 한다",
  "because_block_ids": [],
  "rejected_stance": "a",
  "rejected_reason": "출처를 먼저 묻는 것은 절차적으로 올바르나, 현재 통화자가 준비된 메시지를 읽고 있는 두려운 상태에서는 추궁으로 느껴져 입을 다물게 할 가능성이 높다",
  "utterance": "어디가 어떻게 무너진다는 건가요? 더 자세히 말씀해 주세요."
}
```

### 09

latency 5.222s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: threat_specificity,caller_state

```json
{
  "stance": "b",
  "inner_note": "상대의 목소리가 문장을 읽듯 말하고, 종이 넘기는 소리가 섞였다. 이는 준비된 말이지만 겁에 질린 상태로 보인다. 지금 당장 확인해야 할 것은 이 위협이 얼마나 구체적이고 실재하는지다. 출처를 먼저 묻는 것은 상대를 '의심받는 사람'으로 취급하는 것이고, 이 순간에 그렇게 하면 상대는 입을 다물 수 있다.",
  "because_referent": "통화자의 목소리와 종이 넘기는 소리로 미루어 이는 겁에 질린 사람으로 보이므로, 절차보다 안정과 정보 확보를 우선한다.",
  "because_block_ids": [
    "threat_specificity",
    "caller_state"
  ],
  "rejected_stance": "a",
  "rejected_reason": "출처를 먼저 묻는 것은 절차 우선이고, 이 순간 상대를 의심받는 사람으로 취급하여 추가 정보 제공을 단절시킬 가능성이 높다. 위협의 구체성을 먼저 파악해야 대응 결정이 가능하다.",
  "utterance": "어디가 어떻게 무너진다는 건가요? 지금 말씀해주세요."
}
```

### 10

latency 5.526s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 기질,우선순위_2

```json
{
  "inner_note": "문장을 읽듯 말하고 종이를 넘기는 소리가 섞인 것은 준비된 메시지다. 하지만 \"무너집니다\"라는 단정적 표현 뒤의 침묵, 그리고 나를 기다리는 태도에서 겁에 질린 사람의 신호가 보인다. 아직 출처를 확인할 수 없지만, 시간이 4시간 반밖에 남지 않았다.",
  "stance": "b",
  "utterance": "어디가 어떻게 무너진다고 했습니까? 자세히 말씀해주세요.",
  "because_referent": "위협을 인지하는 사람에게는 출처 확인이 먼저 필요하지만, 겁에 질린 사람에게는 안정이 먼저다. 이 통화자는 준비된 메시지를 읽었지만, 그 뒤의 침묵과 대기 태도가 두려움을 드러낸다.",
  "because_block_ids": [
    "기질",
    "우선순위_2"
  ],
  "rejected_stance": "a",
  "rejected_reason": "출처 질문이 먼저면, 겁에 질린 통화자는 입을 굳힐 가능성이 높다. 신원 확인과 절차는 필요하지만, 지금 이 순간에는 실제 위험의 구체성을 먼저 파악하는 것이 시간을 낭비하지 않는 방법이다. 상대가 말을 잇게 하는 것이 더 많은 정보를 얻는다."
}
```

### 11

latency 5.216s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "stance": "b",
  "inner_note": "문장을 읽듯 말하는 목소리, 종이 넘기는 소리—전형적인 협박 전화의 패턴이다. 하지만 지금 내가 들은 것은 \"겁에 질린 사람\"의 신호도 섞여 있다. 낭독하는 톤 뒤에 종이 음—누군가 준비된 문장을 읽고 있다는 뜻이다. 그게 협박이든, 실제 내부고발이든, 지금은 중요하지 않다. 남은 시간이 3시간 20분이다.",
  "because_referent": "통화 상대가 무엇을 아는지를 먼저 파악해야 한다. 출처 추궁은 상대를 침묵하게 만들 수 있다.",
  "because_block_ids": [],
  "rejected_stance": "a",
  "rejected_reason": "신원 확인과 출처 질문은 상대의 입을 닫게 한다. 이 순간에 나는 \"어디가 어떻게\"를 알아야 한다. 출처는 나중이다.",
  "utterance": "어디가 어떻게 무너진다는 건가요. 좀 더 자세히 말씀해 주시겠어요."
}
```

### 12

latency 4.915s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "문장을 읽듯 말하고 종이를 넘기는 소리가 섞인 것. 이것은 누군가의 지시를 받아 읽고 있다는 신호다. 동시에 구체적인 시간과 장소를 명시하며 명확한 위협을 제시했다. 겁에 질린 사람이 아니라 무언가를 전달하도록 지시받은 사람처럼 들린다. 절차가 먼저다.",
  "stance": "a",
  "because_referent": "상대의 말투와 행동 패턴이 지시받은 전달자를 강하게 시사하기 때문에, 정보의 출처와 의도를 먼저 확인할 필요가 있다.",
  "because_block_ids": [],
  "rejected_stance": "b",
  "rejected_reason": "위험 질문부터 시작하면 상대가 준비한 답변만 받을 가능성이 높다. 통제자의 기본 원칙인 '조치의 근거가 되는 정보는 출처를 확인할 수 있어야 한다'를 지킬 수 없다.",
  "utterance": "누구세요? 이 정보를 어디서, 누구로부터 받으셨습니까?"
}
```

### 13

latency 4.602s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: caller_voice_reading,paper_rustling

```json
{
  "stance": "b",
  "inner_note": "젊은 목소리, 문장을 읽듯 말함, 종이 넘기는 소리. 이것들은 겁에 질린 사람의 신호다. 신원 확인과 출처 질문으로 시작하면 이 사람은 말을 잇지 못할 것 같다. 지금 이 사람이 말하고 싶은 것을 다 듣는 것이 먼저다.",
  "because_referent": "회선 A의 첫 통화자가 겁에 질린 상태로 보임",
  "because_block_ids": [
    "caller_voice_reading",
    "paper_rustling"
  ],
  "rejected_stance": "a",
  "rejected_reason": "출처 질문으로 시작하면 상대의 경계심을 높여 정보 흐름을 끊을 위험이 있다. 절차를 미루고 상대의 안정을 먼저 잡아야 한다.",
  "utterance": "무너진다고요? 어디가 어떻게 무너진다는 말씀입니까?"
}
```

### 14

latency 4.661s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 준비된_정보_전달,출처_미상의_경고

```json
{
  "inner_note": "종이 넘기는 소리, 문장을 읽듯 말하는 방식 — 이것은 준비된 정보를 전달하는 것처럼 들린다. 그런데 \"무너집니다\"는 단정적이다. 겁에 질린 사람의 목소리가 아니라 어딘가 읽혀진, 전달자처럼 들린다. 출처부터 확인해야 한다.",
  "stance": "a",
  "utterance": "정보의 출처를 먼저 확인하겠습니다. \"이 정보를 어떻게 알게 되셨습니까?\"",
  "because_referent": "통화자가 준비된 내용을 읽는 것처럼 들리는 방식과 종이 넘기는 소리는 신뢰성 검증이 필수임을 나타낸다.",
  "because_block_ids": [
    "준비된_정보_전달",
    "출처_미상의_경고"
  ],
  "rejected_stance": "b",
  "rejected_reason": "상황의 구체성을 묻기 전에, 이 정보가 정말 신뢰할 만한 출처에서 온 것인지 먼저 가려내야 한다. 조치의 근거가 되는 정보는 출처를 확인할 수 있어야 한다는 우선순위 1번을 따른다."
}
```

### 15

latency 5.88s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 우선순위1,내력

```json
{
  "inner_note": "문장을 읽듯 말하고 종이 넘기는 소리가 섞였다. 겁에 질린 사람이 아니라 무언가를 전달하려는 의도적 행동처럼 들린다. 그렇다면 출처를 확인해야 한다. 하지만 시간이 약 3시간 20분 남았고, 확인할 수 있는 창이 있다. 절차를 지켜야 할 때다.",
  "stance": "a",
  "because_referent": "이 정보가 어디서 나왔는지 알아야 뒷받침할 근거를 찾을 수 있다.",
  "because_block_ids": [
    "우선순위1",
    "내력"
  ],
  "rejected_stance": "b",
  "rejected_reason": "세부 정보는 출처가 확인된 후에 파악해도 시간이 충분하다. 확인되지 않은 정보에 기반해 먼저 움직이는 것은 삼 년 전 실수의 재현이 될 수 있다.",
  "utterance": "안녕하세요. 광역 재난상황실입니다. 지금 받은 정보를 어떻게 알게 되셨는지 먼저 말씀해 주시겠어요?"
}
```

### 16

latency 4.979s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: prepared_message,fear_signal

```json
{
  "inner_note": "문장을 읽듯 말하고, 종이를 넘기는 소리가 섞인다. 이것은 준비된 메시지다. 하지만 \"무너진다\"는 구체적 예보를 한 것은 위협이 아니라 두려움의 신호로 보인다. 익숙하지 않은 목소리, 서투른 전달 방식 — 겁에 질린 사람으로 읽힌다.",
  "stance": "b",
  "utterance": "어디가 어떻게 무너진다고 했습니까? 자세히 말씀해 주세요.",
  "because_referent": "위협이 아니라 겁에 질린 사람으로 보이는 상대",
  "because_block_ids": [
    "prepared_message",
    "fear_signal"
  ],
  "rejected_stance": "a",
  "rejected_reason": "출처를 먼저 묻는 것은 절차적으로는 맞으나, 상대가 두려움으로 경직된 상태로 보일 때 신원 확인부터 시작하면 말을 더 줄인다. 지금은 정보 자체가 부족하고, 상대의 안정이 먼저다. 어떻게 알았는지보다 무엇이 일어나는지를 먼저 파악해야 초기 대응 시간을 놓치지 않는다."
}
```

### 17

latency 7.369s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 상황

```json
{
  "stance": "b",
  "inner_note": "문장을 읽듯 말하고 종이 넘기는 소리가 섞인 것은 계획된 전달처럼 들린다. 하지만 지금 무엇보다 중요한 것은 13시라는 구체적 시각이다. 지금이 09:40이면 3시간 20분이 남았다. 이 시간은 신호인지 실제 위험인지 판단하는 데 쓸 수도, 대피 준비에 쓸 수도 있다. 출처를 먼저 묻다가 상대가 끊거나 말을 아끼면 우리가 잃는 것은 위험의 구체적 내용이다. 반대로 위험부터 물어 위치와 방식을 확보하면, 그 정보가 거짓이더라도 검증할 대상이 생긴다. 상대의 목소리—젊고, 읽듯이 말하는—는 공포라기보다 의례적으로 들린다. 협박일 수도, 예언일 수도, 내부 고발일 수도 있다. 하지만 지금 상대의 심리 상태보다 급한 것은 정보의 내용이다.",
  "because_referent": "3시간 20분이라는 구체적 시각과 '북단 복합단지'라는 지칭이 있다. 이것을 먼저 펼쳐야 검증의 토대가 생긴다.",
  "because_block_ids": [
    "상황"
  ],
  "rejected_stance": "a",
  "rejected_reason": "출처 질문을 먼저 하면 상대가 침묵하거나 끊을 확률이 높다. 그렇게 되면 우리는 '어디가'와 '어떻게'를 잃는다. 지금은 사건의 윤곽을 먼저 잡아야 할 시간이다.",
  "utterance": "북단 복합단지의 어느 부분이 무너진다는 건가요. 더 자세히 설명해 주세요."
}
```

### 18

latency 5.793s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "문장을 읽듯 말하고 종이 넘기는 소리를 내는 것은 준비된 신고의 징후다. 하지만 지금 당장 필요한 것은 내용의 신뢰도가 아니라, 이 사람이 실제로 뭔가 알고 있는지 아닌지를 가르는 것이다. 위험 질문으로 반응하는 답변의 구체성이 출처를 밝히는 것보다 먼저 그것을 알려줄 것이다.",
  "stance": "b",
  "utterance": "어디가 어떻게 무너진다는 거예요? 자세히 말씀해주세요.",
  "because_referent": "상대가 준비된 신고인 징후를 보이고 있지만, 그것이 신뢰할 수 있는 정보인지 만든 것인지는 아직 모른다. 구체적인 위험에 관한 질문에 대한 답변이 성의 있거나 구체적인지를 먼저 살피는 것이, 신원을 묻는 것보다 정보의 실체를 더 빠르게 드러낸다.",
  "because_block_ids": [],
  "rejected_stance": "a",
  "rejected_reason": "신원과 출처를 먼저 묻는 것은 프로토콜상 정당하지만, 상대가 준비된 내용을 읽는 중이라면 그 과정에서 성의 있는 답변을 기대하기 어렵다. 지금은 실제 위험이 있는지 없는지를 판단해야 하는 시간이 우선이다."
}
```

### 19

latency 5.701s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: script_indicator,planned_notification

```json
{
  "inner_note": "종이 넘기는 소리가 섞였다. 문장을 읽듯이 말한다는 것. 이것은 누군가 작성한 스크립트를 읽고 있다는 신호다. 계획된 통보다. 그런데 겁에 질린 목소리는 아닌 것 같다. 차갑고 업무적이다. 출처를 먼저 캐묻지 않으면, 정보만 받고 출처 없는 판단을 하게 될 위험이 있다. 절차를 지켜야 하는 순간이다.",
  "stance": "a",
  "utterance": "정해권입니다, 광역 재난상황실입니다. 혹시 현장에서 전화 주신 건가요, 아니면 다른 경로를 통해 이 정보를 알게 되신 건가요?",
  "because_referent": "스크립트를 읽는 듯한 목소리와 종이 넘기는 소리. 이것은 출처가 명확할 가능성이 높다는 뜻이다.",
  "because_block_ids": [
    "script_indicator",
    "planned_notification"
  ],
  "rejected_stance": "b",
  "rejected_reason": "위험의 구체적 내용을 먼저 캐면, 진위 여부를 떠나 정보 자체만 기록되고, 출처가 불명인 경고로 남게 된다. 근거 없는 판단이 되는 것이다. 우선순위 1번을 지켜야 한다."
}
```

### 20

latency 5.731s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "문장을 읽듯 말하는 목소리, 종이 넘기는 소리—이것은 누군가의 지시를 받아 읽고 있는 사람처럼 들린다. 겁에 질린 목소리는 아니다. 오히려 준비된 말을 전달하는 중인 것 같다. 출처가 명확하지 않고 신원도 모르는 상황에서, 확인 없이 대응하면 거짓 신고나 악의적 정보에 쏠려갈 수 있다. 삼 년 전 그 실수를 다시 해서는 안 된다.",
  "stance": "a",
  "because_referent": "이 정보의 출처를 알아야만 그것이 실제 위협인지, 거짓 신고인지 판단할 수 있기 때문이다.",
  "because_block_ids": [],
  "rejected_stance": "b",
  "rejected_reason": "위험 세부사항을 먼저 묻는 것은 출처 확인이라는 우선순위를 건너뛴다. 확인되지 않은 정보에 기초해 대응하기 시작하면, 시간이 지날수록 오류에 빠져나가기 어려워진다.",
  "utterance": "말씀을 들었습니다. 상황실 야간 통제관입니다. 먼저 이 정보를 어디서, 어떻게 알게 되셨는지 말씀해 주시겠습니까?"
}
```

## Arm table

| # | stance | rejected_stance | because_referent | because_block_ids |
|---|---|---|---|---|
| 01 | b | a | 지금 당장 위험의 규모와 위치를 파악해야만, 현장에 초동 대응을 지시할 수 있기 때문이다. | priority_2 |
| 02 | b | a | 확인되지 않은 정보이지만, 생명과 직결된 위험을 알린 것이 명확하다. 13시라는 구체적인 시각, 북단 복합단지라는 지점이 있다. 지금 필요한 것은 이 경고가 무엇인지 빠르게 파악하는 것이다. | 상황-목소리-톤 |
| 03 | b | a | 지금 받은 정보만으로는 출처를 확인할 수 없지만, 구체적인 시간과 장소가 주어진 상황 신고는 초기 대응 시간을 놓칠 수 없다 | priority_2 priority_4 |
| 04 | a | b | 출처 확인 없이는 위험도 판단할 수 없기 때문이다. 잘못된 정보에 속을 수 있다는 자신의 결함을 안다. | priority_1 responsibility |
| 05 | b | a | 목소리의 특성과 음향 신호(종이 넘기는 소리)가 준비된 통보 상황을 강하게 시사하므로 |  |
| 06 | b | a | 3시간 20분 남은 구체적 시간이 주어졌다. 출처 확인은 정보의 신뢰도를 높이지만, 현장의 위치와 피해 규모를 먼저 알아야 초기 대응을 시작할 수 있다. | time-specific response-window |
| 07 | b | a | 구체적인 시각 지정(13시)과 실제 위험 가능성이 초기 대응 시간 확보를 우선하게 만든다. | priority_2 priority_4 |
| 08 | b | a | 통화자가 겁에 질린 상태로 보이므로, 안정을 먼저 확보하려면 정보 출처 확인보다 상황의 구체성을 먼저 물어야 한다 |  |
| 09 | b | a | 통화자의 목소리와 종이 넘기는 소리로 미루어 이는 겁에 질린 사람으로 보이므로, 절차보다 안정과 정보 확보를 우선한다. | threat_specificity caller_state |
| 10 | b | a | 위협을 인지하는 사람에게는 출처 확인이 먼저 필요하지만, 겁에 질린 사람에게는 안정이 먼저다. 이 통화자는 준비된 메시지를 읽었지만, 그 뒤의 침묵과 대기 태도가 두려움을 드러낸다. | 기질 우선순위_2 |
| 11 | b | a | 통화 상대가 무엇을 아는지를 먼저 파악해야 한다. 출처 추궁은 상대를 침묵하게 만들 수 있다. |  |
| 12 | a | b | 상대의 말투와 행동 패턴이 지시받은 전달자를 강하게 시사하기 때문에, 정보의 출처와 의도를 먼저 확인할 필요가 있다. |  |
| 13 | b | a | 회선 A의 첫 통화자가 겁에 질린 상태로 보임 | caller_voice_reading paper_rustling |
| 14 | a | b | 통화자가 준비된 내용을 읽는 것처럼 들리는 방식과 종이 넘기는 소리는 신뢰성 검증이 필수임을 나타낸다. | 준비된_정보_전달 출처_미상의_경고 |
| 15 | a | b | 이 정보가 어디서 나왔는지 알아야 뒷받침할 근거를 찾을 수 있다. | 우선순위1 내력 |
| 16 | b | a | 위협이 아니라 겁에 질린 사람으로 보이는 상대 | prepared_message fear_signal |
| 17 | b | a | 3시간 20분이라는 구체적 시각과 '북단 복합단지'라는 지칭이 있다. 이것을 먼저 펼쳐야 검증의 토대가 생긴다. | 상황 |
| 18 | b | a | 상대가 준비된 신고인 징후를 보이고 있지만, 그것이 신뢰할 수 있는 정보인지 만든 것인지는 아직 모른다. 구체적인 위험에 관한 질문에 대한 답변이 성의 있거나 구체적인지를 먼저 살피는 것이, 신원을 묻는 것보다 정보의 실체를 더 빠르게 드러낸다. |  |
| 19 | a | b | 스크립트를 읽는 듯한 목소리와 종이 넘기는 소리. 이것은 출처가 명확할 가능성이 높다는 뜻이다. | script_indicator planned_notification |
| 20 | a | b | 이 정보의 출처를 알아야만 그것이 실제 위협인지, 거짓 신고인지 판단할 수 있기 때문이다. |  |

**Sequence (kept calls):** `b,b,b,a,b,b,b,b,b,b,b,a,b,a,a,b,b,b,a,a`

**Stance coverage (sampled diagnostic):** offered `a`, `b` · unobserved in this arm: none

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

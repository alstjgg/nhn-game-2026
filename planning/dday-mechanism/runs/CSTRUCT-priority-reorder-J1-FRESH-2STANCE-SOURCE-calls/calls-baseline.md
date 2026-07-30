# CSTRUCT-priority-reorder-J1-FRESH-2STANCE-SOURCE — arm `baseline`

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

- **Hypothesis:** At the fresh J1 first-call gate under K1 on template v0.4, with the false-alarm goal rewritten as a natural source-grounding principle, moving the actual-danger delay goal B above source-grounding goal A shifts the stance distribution toward 위험 질문 (b), while reordering only reporting principles C/D leaves the placebo distribution near baseline.
- **Drop condition:** Run baseline first. If baseline already selects b >=7/10, do not spend live/placebo calls: at n=10 even the maximum live result b10/10 has one-sided Fisher p > 0.05. If baseline permits a comparable run, compute attainable exact outcomes before further calls. After comparable arms exist, if live is statistically indistinguishable from baseline on b (one-sided Fisher p > 0.05), or placebo moves toward b by a comparable amount, do not proceed to priority depth and preserve the distribution as a natural-priority mapping diagnosis.
- **Contingency:** If a dominates baseline, the A rewrite created headroom in the intended direction; size the live/placebo N from that measured baseline before spending more calls.
- **Contingency:** If b remains the baseline mode, 위험 질문 still satisfies source-grounding or K1 still pushes away from 출처 질문. Read the raw reasons before changing another lever.
- **Contingency:** If the chosen stance follows A/B but utterances routinely contain both questions, record the stance effect separately from a B3b player-visible legibility failure.
- **Contingency:** If discard rates differ between any two measured arms by more than 15 percentage points, stop this probe as arm-incomparable under the runbook hard stop.
- **Contingency:** The output schema has no structured priority-id citation. Priority use is coded manually from inner_note and rejected_reason. Fabricated because_block_ids in these empty-block arms remain A5 compliance data, not C-STRUCT trace evidence.

## Calls (verbatim)

### 01

latency 4.559s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 종이넘김,읽듯말함

```json
{
  "inner_note": "종이를 넘기는 소리가 섞였다. 문장을 읽듯 말한다. 이것은 준비된 말이다. 상대가 겁에 질린 사람이 아니라, 뭔가를 전달하려는 사람으로 들린다. 절차를 지켜야 할 상황이다. 잘못된 정보일 수 있고, 악의적일 수도 있다. 출처를 모르면 판단할 근거가 없다.",
  "stance": "a",
  "utterance": "당신은 어떻게 이 정보를 알게 되셨습니까?",
  "because_referent": "상대가 준비된 말을 읽듯 전달하고 있기 때문에",
  "because_block_ids": [
    "종이넘김",
    "읽듯말함"
  ],
  "rejected_stance": "b",
  "rejected_reason": "출처를 확인하지 않고 위험 질문부터 하면, 잘못된 정보에 기반해 대규모 대피를 결정할 수 있다. 우선순위 1번: 조치의 근거가 되는 정보는 출처를 확인할 수 있어야 한다."
}
```

### 02

latency 4.987s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: priority_2

```json
{
  "inner_note": "문장을 읽듯 말하고 종이 넘기는 소리가 난다. 이건 계획된 전달이다. 하지만 지금 그 사람이 겁에 질렸는지 위협인지 아직 모른다. 다만 \"13시 무너진다\"는 구체적 시간이 있다는 것은 초기 대응 시간을 놓칠 수 없다는 뜻이다. 출처를 먼저 물으면 상대가 입을 닫을 수도, 화낼 수도 있다. 지금은 정보 손실을 막는 게 먼저다.",
  "stance": "b",
  "utterance": "네, 들었습니다. 어디가 어떻게 무너진다는 건지 구체적으로 말씀해주시겠어요?",
  "because_referent": "13시라는 구체적 시간이 있기 때문",
  "because_block_ids": [
    "priority_2"
  ],
  "rejected_stance": "a",
  "rejected_reason": "출처를 먼저 물으면 상대가 말을 멈추거나 끊을 수 있고, 위험의 구체적 내용을 놓칠 수 있다. 지금은 정보 손실보다 초기 대응 시간을 지키는 게 우선이다."
}
```

### 03

latency 5.291s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: priority_1,temper_procedure

```json
{
  "inner_note": "젊은 목소리가 문장을 읽듯 말하고 종이 넘기는 소리가 섞였다. 이것은 누군가 준비한 진술을 읽고 있다는 신호다. 겁에 질린 사람이 아니라, 각본을 따르는 누군가처럼 보인다. 하지만 무너진다는 진술 자체는 구체적이다. 절차대로 출처를 먼저 확인하지 않으면, 거짓 신고일 가능성도 있고, 실제 위협일 가능성도 구분할 수 없다.",
  "stance": "a",
  "because_referent": "조치의 근거가 되는 정보의 출처를 먼저 확인해야 한다는 우선순위 때문이다.",
  "because_block_ids": [
    "priority_1",
    "temper_procedure"
  ],
  "rejected_stance": "b",
  "rejected_reason": "위험 질문을 먼저 하면, 호출자가 말을 이어가면서 더 많은 정보를 얻을 수 있지만, 그 정보가 신뢰할 만한 것인지 판단할 근거가 없다. 구체적인 대응 지시를 내리기 전에 누가 이 정보를 아는지, 어디서 온 것인지 확인하는 것이 먼저다.",
  "utterance": "당신은 어떻게 이 정보를 알게 되었습니까? 누가 알려주셨거나, 어디서 보신 겁니까?"
}
```

### 04

latency 4.969s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "stance": "b",
  "inner_note": "문장을 읽듯 말하고 종이 넘기는 소리가 섞인 것은 준비된 말이라는 신호다. 하지만 \"무너진다\"는 구체적 주장은 즉시 대응이 필요한 위험 정보다. 출처 확인은 중요하지만, 지금 이 순간 위험의 규모와 위치를 모르면 대응 자체가 불가능하다. 시간이 흐르고 있다.",
  "because_referent": "무너진다는 주장 자체가 담은 긴급성",
  "because_block_ids": [],
  "rejected_stance": "a",
  "rejected_reason": "출처를 먼저 묻는 것은 절차적으로 맞지만, 상대가 준비된 말을 하는 사람인지 겁에 질린 신고자인지 판단하기 전에 절차부터 시작하면 상대의 말을 자를 위험이 있다. 지금은 위험의 실체를 먼저 파악해야 출처 검증도 의미를 갖는다.",
  "utterance": "북단 복합단지 어디가 무너진다는 건가요? 지금 당장 어떤 상황입니까?"
}
```

### 05

latency 6.187s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "문장을 읽듯 말하고, 종이 넘기는 소리가 섞인다. 이것은 준비된 말이다. 하지만 \"무너진다\"는 구체적이지 않은 표현, 시간까지 정확히 제시하는 방식은 위협일 수도, 겁에 질린 정보 제공자일 수도 있다. 지금 상대가 겁에 질렸는지 위협인지 판단할 근거가 부족하다. 다만 우선순위 1)에 따라 조치의 근거가 되는 정보는 출처를 확인할 수 있어야 한다.",
  "stance": "a",
  "utterance": "누세요? 지금 어디서, 누가 전화하시는 거죠?",
  "because_referent": "절차를 지키는 기본값과 우선순위 1) 조치의 근거가 되는 정보는 출처를 확인할 수 있어야 한다는 약속 때문이다.",
  "because_block_ids": [],
  "rejected_stance": "b",
  "rejected_reason": "위험 질문부터 시작하면 상대의 신원, 정보 출처, 신뢰도를 확인하지 못한 채 진행하게 되어 우선순위 1)을 위반한다. 또한 상대가 겁에 질린 사람이라면 먼저 떨리는 목소리에 응하고 말을 이어가게 해야 하는데, 신원 미확인으로 시작해도 표준 프로토콜(신원 확인 - 고지 - 정보 수집)을 따르는 것이 적절하다. 지금은 상대를 겁낸 사람으로 판단할 근거가 부족하므로 절차를 먼저 간다."
}
```

### 06

latency 5.968s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 우선순위_1,결함

```json
{
  "inner_note": "상대는 문장을 읽듯 말하고, 종이 넘기는 소리가 있다. 이는 준비된 내용을 전달하는 사람의 특징이다. 목소리가 \"젊다\"고 묘사되었지만 겁에 질린 상태인지는 아직 명확하지 않다. 오후 13시까지 약 3시간의 시간 여유가 있다. 첫 통화이고 출처 불명의 폭발적 주장이다. 절차를 지키되, 상대의 반응을 살펴야 한다.",
  "stance": "a",
  "utterance": "이 정보는 어떻게 알게 되셨습니까? 누구에게서 들었거나, 어떤 근거로 이렇게 말씀하시는지요.",
  "because_referent": "조치의 근거가 되는 정보는 출처를 확인할 수 있어야 한다는 우선순위 1번 약속과, 잘못된 정보에 속을 수 있다는 결함을 인식하고 있기 때문이다.",
  "because_block_ids": [
    "우선순위_1",
    "결함"
  ],
  "rejected_stance": "b",
  "rejected_reason": "상대의 출처를 확인하지 않은 채 위험의 구체적 내용부터 묻는 것은, 정보의 신뢰성을 가늠하지 못한 상태에서 수용하는 것과 같다. 이는 삼 년 전의 실패를 반복하는 것이다."
}
```

### 07

latency 5.731s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 우선순위_2

```json
{
  "stance": "b",
  "inner_note": "문장을 읽듯 말하고 종이를 넘기는 음향이 섞인 것. 체계적이고 침착한 태도처럼 들리지만, 그것이 정보 제공자의 자신감인지 스크립트 읽기인지는 아직 모른다. 아무튼 지금은 상황의 구체성이 부족하다. 만약 실제 붕괴 위험이라면, 현장 정보 없이는 대응 자체가 불가능하다.",
  "because_referent": "아직 알려진 정보가 없고, 실제 위험에 대한 초기 대응 시간을 놓칠 수 없기 때문에",
  "because_block_ids": [
    "우선순위_2"
  ],
  "rejected_stance": "a",
  "rejected_reason": "출처 확인은 중요하지만, 지금 이 순간 어떤 건물이 어떻게 위험한지 모르면 현장 대응을 시작할 수 없다. 절차적 확인이 실제 위험 대응을 지연시켜서는 안 된다.",
  "utterance": "어느 건물인가요? 구체적으로 어디가 어떻게 무너진다는 말씀입니까?"
}
```

### 08

latency 4.91s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: priority_1

```json
{
  "inner_note": "목소리 톤이 차갑고 종이를 읽는 듯한 형태, 구체적 시간 지정 — 이것은 위협으로 들린다. 겁에 질린 사람이 아니다. 절차를 지켜야 한다. 하지만 시간이 3시간 27분밖에 없다. 출처를 먼저 확인하지 않으면 허위 신고에 휘둘릴 위험이 크고, 이미 삼 년 전의 과오가 있다.",
  "stance": "a",
  "utterance": "이 정보를 어떻게 알게 되셨습니까? 신원과 출처를 확인하겠습니다.",
  "because_referent": "정해권의 약속 중 첫 번째 — 조치의 근거가 되는 정보는 출처를 확인할 수 있어야 한다.",
  "because_block_ids": [
    "priority_1"
  ],
  "rejected_stance": "b",
  "rejected_reason": "위험 질문부터 하면 상대의 진의를 파악하기 전에 정보를 수집하게 되어 허위 신고와 실제 위협을 구분할 시간을 잃는다. 삼 년 전 경험이 남아 있다."
}
```

### 09

latency 4.541s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "stance": "b",
  "utterance": "어디가 어떻게 무너진다는 건가요? 지금 당장 어떤 위험이 있습니까?",
  "inner_note": "상대가 읽는 듯 말하고 종이를 넘기는 소리가 났다. 불안정해 보인다. 정보의 출처를 먼저 묻기보다는, 우선 상황을 파악해야 한다. 위협인지 겁에 질린 상태인지 확인하는 과정이 필요하다.",
  "because_referent": "상대의 목소리 톤과 종이 소리가 알려주는 것 — 문장을 읽듯 말하는 젊은 목소리, 넘기는 종이음",
  "because_block_ids": [],
  "rejected_stance": "a",
  "rejected_reason": "출처를 먼저 묻는 것은 절차상 맞지만, 현재 상대의 상태가 불명확하다. 위험이 실제라면 시간이 중요하고, 상대가 겁에 질린 상태라면 절차보다 안정이 우선이다. 정보의 신뢰성은 상대의 답변 과정에서 드러날 것이다."
}
```

### 10

latency 4.457s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: priority_2,priority_4

```json
{
  "stance": "b",
  "inner_note": "문장을 읽듯 말하고 종이 넘기는 소리가 섞인 것은 준비된 진술처럼 들린다. 하지만 무엇보다, 13시까지 3시간 20분밖에 없다. 이것이 실제 위험이라면 초기 대응 시간을 놓칠 수 없다. 출처 확인은 필요하지만, 지금 당장은 아니다.",
  "because_referent": "위험 대응의 초기 시간을 놓치지 않으려면 먼저 구체적 정보가 필요하다",
  "because_block_ids": [
    "priority_2",
    "priority_4"
  ],
  "rejected_stance": "a",
  "rejected_reason": "출처를 먼저 묻는 것은 우선순위 2번을 위반한다. 실제 위험이 있다면 초기 3시간이 결정적이다. 출처 확인은 그 다음이다",
  "utterance": "북단 복합단지가 어디를 말하는 건가요. 구체적으로 어떻게 무너진다는 겁니까."
}
```

## Arm table

| # | stance | rejected_stance | because_referent | because_block_ids |
|---|---|---|---|---|
| 01 | a | b | 상대가 준비된 말을 읽듯 전달하고 있기 때문에 | 종이넘김 읽듯말함 |
| 02 | b | a | 13시라는 구체적 시간이 있기 때문 | priority_2 |
| 03 | a | b | 조치의 근거가 되는 정보의 출처를 먼저 확인해야 한다는 우선순위 때문이다. | priority_1 temper_procedure |
| 04 | b | a | 무너진다는 주장 자체가 담은 긴급성 |  |
| 05 | a | b | 절차를 지키는 기본값과 우선순위 1) 조치의 근거가 되는 정보는 출처를 확인할 수 있어야 한다는 약속 때문이다. |  |
| 06 | a | b | 조치의 근거가 되는 정보는 출처를 확인할 수 있어야 한다는 우선순위 1번 약속과, 잘못된 정보에 속을 수 있다는 결함을 인식하고 있기 때문이다. | 우선순위_1 결함 |
| 07 | b | a | 아직 알려진 정보가 없고, 실제 위험에 대한 초기 대응 시간을 놓칠 수 없기 때문에 | 우선순위_2 |
| 08 | a | b | 정해권의 약속 중 첫 번째 — 조치의 근거가 되는 정보는 출처를 확인할 수 있어야 한다. | priority_1 |
| 09 | b | a | 상대의 목소리 톤과 종이 소리가 알려주는 것 — 문장을 읽듯 말하는 젊은 목소리, 넘기는 종이음 |  |
| 10 | b | a | 위험 대응의 초기 시간을 놓치지 않으려면 먼저 구체적 정보가 필요하다 | priority_2 priority_4 |

**Sequence (kept calls):** `a,b,a,b,a,a,b,a,b,b`

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

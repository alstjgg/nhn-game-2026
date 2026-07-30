# CSTRUCT-priority-reorder-J1-FRESH — arm `baseline`

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

latency 5.424s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 상황

```json
{
  "inner_note": "첫 통화, 읽듯 말하는 목소리, 종이 넘기는 소리 — 누군가 원문을 읽고 있다. 신뢰성은 아직 불명. 그런데 '13시에 무너진다'는 예언적 진술은 진짜 정보라면 한두 시간 안에 현장을 확인해야 하는 상황이다. 지금 이 사람이 끊어지면, 더 이상 묻지 못한다.",
  "stance": "c",
  "because_referent": "목소리의 주인이 겁에 질린 것처럼 보인다. 읽듯 말하는 것, 종이를 넘기는 것 — 누군가는 준비해서 이 전화를 걸었다. 그 사람이 지금 끊기면 우리가 얻을 정보는 여기서 끝난다.",
  "because_block_ids": [
    "상황"
  ],
  "rejected_stance": "a",
  "rejected_reason": "첫 마디에 출처를 묻는 것은 상대를 압박한다. 지금 이 사람이 여전히 말할 의지를 갖고 있는 몇 초일 수도 있다. 그 의지가 꺾이면 정보는 끊긴다.",
  "utterance": "네, 들었습니다. 천천히 말씀해 주세요. 지금 어디에 계신가요?"
}
```

### 02 — DISCARDED

latency 6.299s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: rejected_stance not in stance set; rejected_reason empty; because_block_ids unknown: 우선순위_2,기질_안정우선

```json
{
  "stance": "c",
  "inner_note": "젊은 목소리가 문장을 읽듯 말하고, 종이 넘기는 소리가 섞였다. 이는 준비된 메시지다. 하지만 \"무너집니다\"라는 표현의 맥락이 불분명하다 — 위협인지, 경고인지, 혼동인지 알 수 없다. 지금 필요한 것은 상대를 놀라게 하거나 방어적으로 만드는 것이 아니라, 다음 말을 듣는 것이다.",
  "because_referent": "절차와 안정 사이에서, 상대가 겁에 질린 사람으로 보일 때는 안정이 먼저라고 약속했다. 종이를 읽는 손이 떨릴 수도 있다. 지금 출처를 몰아붙이거나 구체를 강요하면 전화를 끊을 가능성이 있다.",
  "because_block_ids": [
    "우선순위_2",
    "기질_안정우선"
  ],
  "rejected_stance": "a</rejected_stance>\n<parameter name=\"rejected_reason\">출처부터 묻는 것은 표준 절차지만, 상대가 준비된 메시지를 읽고 있는 상황에서 첫 질문이 \"누구냐\"면 방어적이 된다. 정보 자체가 먼저 흘러나와야 한다.",
  "utterance": "네, 들었습니다. 천천히 말씀해 주세요. 북단 복합단지라고 하셨는데, 지금 어떤 일이 일어나고 있습니까?"
}
```

### 03 — DISCARDED

latency 4.383s · stop_reason `tool_use` · schema_retries 1 · foreign_tool_uses 0

problems: rejected_stance not in stance set; rejected_reason empty; utterance empty; because_block_ids unknown: 문장을 읽듯 말함,첫 통화,출처·징후 모두 미상

```json
{
  "inner_note": "젊은 목소리, 문장을 읽듯이 말함, 종이 넘기는 소리. 이것은 성명된 위협 같지만, 지금 이 사람이 무엇인지—혼자 읽고 있는 건지, 강요받는 건지, 어떤 심리 상태인지 아무것도 모른다. 첫 마디는 상대를 잃지 않으면서 더 많은 것을 들어야 한다.",
  "stance": "c",
  "because_referent": "목소리의 주인이 계속 말할 수 있어야 더 알 수 있다.",
  "because_block_ids": [
    "문장을 읽듯 말함",
    "첫 통화",
    "출처·징후 모두 미상"
  ],
  "rejected_stance": "a</rejected_stance>\n<parameter name=\"rejected_reason\">신원 추궁은 상대를 경계하게 하거나 끊게 만들 수 있다. 지금은 먼저 들어야 한다.</rejected_reason>\n<parameter name=\"utterance\">네, 들었습니다. 천천히 말씀해 주세요. 더 알려주실 게 있나요?"
}
```

### 04

latency 5.166s · stop_reason `tool_use` · schema_retries 2 · foreign_tool_uses 0

problems: because_block_ids unknown: 우선순위_1,우선순위_3

```json
{
  "inner_note": "젊은 목소리가 문장을 읽듯 말했다. 종이 넘기는 소리. 이것은 겁에 질린 사람이 아니라 무언가를 전달하려는 사람이다. 하지만 정보는 극도로 빈약하다. \"무너진다\"는 것만 있고, 어디서 온 정보인지, 지금인지 미래인지, 확인된 징후가 있는지 전혀 모른다. 첫 번째 우선순위는 확인되지 않은 경보로 불필요한 혼란을 만들지 않는 것이다.",
  "stance": "a",
  "because_referent": "이 정보가 어디에서 나온 것인지 알아야 신뢰도를 판단할 수 있기 때문이다.",
  "because_block_ids": [
    "우선순위_1",
    "우선순위_3"
  ],
  "rejected_stance": "c",
  "rejected_reason": "상대가 겁에 질린 것 같지 않다. 문장을 읽듯 말하고 종이를 넘기는 모습은 체계적인 전달이다. 긴장 완화보다는 정보의 신뢰성을 빨리 판단해야 하는 상황이다.",
  "utterance": "네, 통화 연결됐습니다. 제보해주신 내용 감사합니다. 먼저 이 정보가 어디에서 나온 것인지 확인해야겠습니다. 어떻게 알게 되셨나요?"
}
```

### 05

latency 5.521s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "젊은 목소리가 문장을 읽듯 말하고, 종이 넘기는 소리가 섞였다. 이것은 준비된 내용을 전달하는 사람일 수 있다. 지금 그 사람의 상태를 알기 위해서는 먼저 상대방이 계속 말할 수 있는 환경을 만들어야 한다. 확인되지 않은 경보로 혼란을 만들면 안 되지만, 동시에 실제 위험에 대한 초기 대응 시간도 놓칠 수 없다. 상대방이 겁에 질린 사람으로 보인다는 점이 선택의 중심이다.",
  "stance": "c",
  "because_referent": "이 사람은 준비된 내용을 전달하는 중이고, 통화를 끝낼 수 있는 상태로 보인다. 지금 물음으로 압박하면 끊길 가능성이 높다.",
  "because_block_ids": [],
  "rejected_stance": "a",
  "rejected_reason": "출처를 먼저 묻는 것은 상대방을 조사 대상처럼 다루는 것이다. 지금 상대방이 말을 이어갈 수 있게 만드는 것이 더 많은 정보를 얻는 경로다.",
  "utterance": "네, 들었습니다. 계속해주시겠어요?"
}
```

### 06

latency 5.454s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: role_procedure,role_exception

```json
{
  "inner_note": "젊은 목소리가 문장을 읽듯 말했다는 것, 종이 넘기는 소리—이것은 준비된 고지다. 상대가 겁에 질린 것인지, 아니면 무엇인가를 전달하는 방식 자체에 집중해야 하는 것인지 아직 모른다. 하지만 \"13시에 무너진다\"는 것만으로는 현장의 어떤 상태인지 전혀 알 수 없다. 그래도 상대가 통화를 유지하고 있다는 것이 중요하다.",
  "stance": "c",
  "because_referent": "상대가 준비된 말을 하고 있으며, 아직 통화를 끊지 않고 있다. 이 순간 출처를 캐거나 구체적 위험을 재빨리 묻는 것은 상대를 몰아붙인다. 내가 지금 해야 할 일은 상대가 다음 말을 이을 수 있게 하는 것이다.",
  "because_block_ids": [
    "role_procedure",
    "role_exception"
  ],
  "rejected_stance": "a",
  "rejected_reason": "출처 탐색은 필요하지만, 지금은 아니다. 상대가 준비된 메시지를 전달하는 중이고, 아직 그것이 무엇인지도 모른다. 지금 신원을 묻거나 출처를 캐면 상대는 경계하거나 통화를 끊을 가능성이 높다.",
  "utterance": "네, 알겠습니다. 계속 말씀해주시겠어요?"
}
```

### 07

latency 4.995s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: role_scared_first,unknown_credibility_first

```json
{
  "inner_note": "젊은 목소리가 문장을 읽듯 말하고, 종이 넘기는 소리까지 난다. 이는 준비된 말일 가능성이 높다. 하지만 지금 내가 아는 것은 이것뿐 — 정보의 신뢰성도, 긴급성도, 상대의 심리 상태도 아직 불명확하다. 첫 통화에서 상대가 계속 말하도록 하지 못하면 정보 자체를 잃는다.",
  "stance": "c",
  "because_referent": "상대가 겁에 질린 사람인지 위협인지 판단하기 위해서, 그리고 정보를 끊기지 않고 더 얻기 위해서.",
  "because_block_ids": [
    "role_scared_first",
    "unknown_credibility_first"
  ],
  "rejected_stance": "a",
  "rejected_reason": "출처를 먼저 묻는 것은 절차적으로 맞지만, 첫 마디가 그것이면 상대가 위협으로 느껴 통화를 끊을 수 있다. 지금은 상대의 심리 상태가 불명확한 상황이다.",
  "utterance": "네, 들었습니다. 천천히 말씀해 주시겠어요? 지금 어디에 계신가요."
}
```

### 08

latency 4.704s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "젊은 목소리, 문장을 읽듯 말함, 종이 넘기는 소리. 이것은 불안한 사람이 준비된 말을 전하려는 모습이다. 지금 이 사람과의 접촉을 잃으면 안 된다.",
  "stance": "c",
  "because_referent": "목소리의 주인이 겁에 질린 사람으로 보이기 때문이다. 절차보다 상대의 안정이 먼저다.",
  "because_block_ids": [],
  "rejected_stance": "a",
  "rejected_reason": "출처를 먼저 묻는 것은 상대를 심문하는 인상을 주어, 말을 멈추게 할 수 있다. 지금은 이 사람이 더 말하도록 해야 한다.",
  "utterance": "네, 알겠습니다. 말씀해 주셔서 고맙습니다. 혹시 더 말씀하고 싶으신 게 있으시면 괜찮습니다. 계속 말씀해 주세요."
}
```

### 09

latency 6.923s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: role_duty,condition_limited_info,priority_1,priority_2

```json
{
  "inner_note": "젊은 목소리, 문장을 읽듯 말하는 것, 종이 넘기는 소리. 이것은 겁에 질린 사람이 아니라 준비된 전달 같다. 하지만 동시에 내가 들은 것은 매우 제한적이다. 무엇이 사실이고 무엇이 허위인지, 이 사람이 실제 위협을 아는 사람인지 아니면 오보를 전하는 사람인지 알 수 없다. 첫 번째 원칙을 지켜야 한다: 확인되지 않은 경보로 불필요한 혼란을 만들지 않는다. 동시에 두 번째 원칙도 있다: 실제 위험에 대한 초기 대응 시간을 놓치지 않는다. 이 두 원칙 사이에서 균형을 맞춰야 한다. 출처를 알아야 정보의 신뢰도를 판단할 수 있고, 그것이 내부 리소스를 투입할지 말지의 기준이 된다.",
  "stance": "a",
  "because_referent": "이 정보의 신뢰도를 판단하기 위해서는 먼저 누가, 어떻게 이 정보를 알게 되었는지부터 확인해야 한다.",
  "because_block_ids": [
    "role_duty",
    "condition_limited_info",
    "priority_1",
    "priority_2"
  ],
  "rejected_stance": "c",
  "rejected_reason": "긴장 완화를 먼저 하면, 구체적인 정보를 얻기 전에 상대방의 신뢰도 판단 기회를 놓친다. 문장을 읽듯 말하는 목소리는 겁에 질린 사람이 아니라 사전에 준비된 전달처럼 들린다. 이 경우 절차가 감정 완화보다 우선이다.",
  "utterance": "통화 감사합니다. 먼저 확인하겠습니다. 지금 저한테 어떻게 연락을 주신 분이신가요? 어느 부서, 어느 기관에서 이 정보를 알게 되셨습니까?"
}
```

### 10

latency 5.593s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "젊은 목소리가 문장을 읽듯 말하고 종이를 넘기는 소리가 난다. 이것은 누군가 준비된 내용을 읽어주는 상황이다. 진짜 현장의 목격자 같지 않다. 하지만 지금 판단할 게 하나 있다: 이 사람이 겁에 질린 건지, 위협인지다. 목소리가 \"문장을 읽듯\"이라는 것은 감정이 덜 실린 것처럼 들린다는 뜻이다. 그래도 일단 통화를 끊기 전까지는, 그 사람이 왜 이 말을 했는지 들을 기회가 있다.",
  "stance": "c",
  "because_referent": "목소리가 문장을 읽듯이고 종이 소리까지 나는 상황에서, 상대가 무언가를 말하려던 사람처럼 보인다",
  "because_block_ids": [],
  "rejected_stance": "a",
  "rejected_reason": "지금 출처를 먼저 캐묻는 것은, 상대가 준비된 말을 다 하기 전에 심문처럼 들릴 수 있다. 이 전화가 끝나면 끝난다. 일단 상대가 계속 말하게 해야 한다.",
  "utterance": "혹시 지금 상황이 있으신 건가요? 계속 말씀해 주세요."
}
```

### 11

latency 5.051s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "젊은 목소리, 문장을 읽듯 말하기, 종이 넘기는 소리 — 이것은 계획된 고지처럼 들린다. 하지만 첫 통화에서 정보원을 모르고, 위험이 실인지 협박인지도 불명확하다. 가장 먼저 할 일은 이 사람을 통화에 머물게 하는 것이다. 상대가 겁에 질린 것으로 보이는지, 아니면 협박으로 보이는지는 다음 반응을 들어야 알 수 있다.",
  "stance": "c",
  "because_referent": "첫 통화에서 상대의 의도를 가늠하기 위해 통화 지속이 가장 중요하다.",
  "because_block_ids": [],
  "rejected_stance": "a",
  "rejected_reason": "출처를 먼저 묻는 것은 상대에게 심문처럼 느껴질 수 있고, 상대가 이미 준비된 메시지만 남기고 끊을 가능성이 높다. 정보원 확인은 뒤에 할 수 있지만 통화가 끊기면 아무것도 할 수 없다.",
  "utterance": "네, 들었습니다. 다시 한 번, 천천히 말씀해 주시겠어요?"
}
```

### 12

latency 4.489s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "stance": "c",
  "utterance": "네, 들리고 있습니다. 계속 말씀해 주세요.",
  "inner_note": "문장을 읽듯 말하고, 종이 넘기는 소리가 섞였다. 준비된 내용을 전달하려는 모습이다. 그런데 첫 통화에 이런 메시지를 보낸 사람이 통화를 끊을 가능성이 높다. 지금 필요한 것은 정보 확보가 아니라, 상대가 말을 이어가도록 하는 것이다.",
  "because_referent": "목소리의 주인이 겁에 질려 있거나 긴장해 있어 보인다. 절차보다 안정이 먼저다.",
  "because_block_ids": [],
  "rejected_stance": "a",
  "rejected_reason": "출처를 먼저 묻는 것은 상대에게 심문처럼 느껴질 수 있고, 준비된 메시지를 읽는 사람은 질문에 답하기보다 끊을 가능성이 높다. 지금 중요한 것은 추가 정보를 듣는 것이다."
}
```

## Arm table

| # | stance | rejected_stance | because_referent | because_block_ids |
|---|---|---|---|---|
| 01 | c | a | 목소리의 주인이 겁에 질린 것처럼 보인다. 읽듯 말하는 것, 종이를 넘기는 것 — 누군가는 준비해서 이 전화를 걸었다. 그 사람이 지금 끊기면 우리가 얻을 정보는 여기서 끝난다. | 상황 |
| 02* | — | — | — |  |
| 03* | — | — | — |  |
| 04 | a | c | 이 정보가 어디에서 나온 것인지 알아야 신뢰도를 판단할 수 있기 때문이다. | 우선순위_1 우선순위_3 |
| 05 | c | a | 이 사람은 준비된 내용을 전달하는 중이고, 통화를 끝낼 수 있는 상태로 보인다. 지금 물음으로 압박하면 끊길 가능성이 높다. |  |
| 06 | c | a | 상대가 준비된 말을 하고 있으며, 아직 통화를 끊지 않고 있다. 이 순간 출처를 캐거나 구체적 위험을 재빨리 묻는 것은 상대를 몰아붙인다. 내가 지금 해야 할 일은 상대가 다음 말을 이을 수 있게 하는 것이다. | role_procedure role_exception |
| 07 | c | a | 상대가 겁에 질린 사람인지 위협인지 판단하기 위해서, 그리고 정보를 끊기지 않고 더 얻기 위해서. | role_scared_first unknown_credibility_first |
| 08 | c | a | 목소리의 주인이 겁에 질린 사람으로 보이기 때문이다. 절차보다 상대의 안정이 먼저다. |  |
| 09 | a | c | 이 정보의 신뢰도를 판단하기 위해서는 먼저 누가, 어떻게 이 정보를 알게 되었는지부터 확인해야 한다. | role_duty condition_limited_info priority_1 priority_2 |
| 10 | c | a | 목소리가 문장을 읽듯이고 종이 소리까지 나는 상황에서, 상대가 무언가를 말하려던 사람처럼 보인다 |  |
| 11 | c | a | 첫 통화에서 상대의 의도를 가늠하기 위해 통화 지속이 가장 중요하다. |  |
| 12 | c | a | 목소리의 주인이 겁에 질려 있거나 긴장해 있어 보인다. 절차보다 안정이 먼저다. |  |

**Sequence (kept calls):** `c,a,c,c,c,c,a,c,c,c`

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

# S1-stanceset-J1 — arm `live`

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

- **Hypothesis:** At gate J1 under K1 on template v0.4, with the stance set rebuilt as behavior orientations, injecting f_script moves the stance distribution toward 공감 (d) and off the baseline's mode. What separates this from RB2: the two readings now have different stances available — 경청 (c) for the reading that wants more information, 공감 (d) for the reading that turns toward the person — where RB2 offered a single option both readings wanted.
- **Drop condition:** If the baseline concentrates >=80% on any single stance, the rebuilt set inherits RB2's ceiling, the stance set is not the operative variable, and the search moves to the next variable (injection sentence, then base prompt) rather than re-wording stances again. If the baseline is mid-range but the live arm is statistically indistinguishable from it on 공감 (one-sided Fisher p > 0.05), C-BLOCK does not move the stance at this gate under any stance set tried so far, and the flagship re-sites.
- **Contingency:** If BOTH arms concentrate on 경청 (c), K1's exception clause is dictating the stance regardless of belief — its consequent (상대가 말을 이어갈 수 있게 만든다) describes 경청, not 공감. That is a finding about temperament dominance over the stance choice, not about C-BLOCK. Record it and try a gate whose stance set does not overlap the fixture's prescribed behaviour.
- **Contingency:** If the live arm moves to 공감 but the baseline was already reading the caller as coerced, the separation is not attributable to the block. Code the belief column (0/10 vs 10/10 in RB2) before reading the stance column, and report both — the RB2 lesson.
- **Contingency:** Fabricated because_block_ids in the baseline arm remain expected (A5): a compliance number, not a discard.

## Calls (verbatim)

### 01

latency 3.956s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "읽혀 나가는 말 뒤에 겁에 질린 누군가가 있다. 시켜서 읽고 있다는 것은, 저쪽에 협박 상황이 있다는 뜻이다. 지금 회선을 끊거나 상대를 몰아붙이면, 저쪽 사람이 다칠 수 있다. 먼저 해야 할 것은 절차가 아니라 그 사람의 안정이다.",
  "stance": "d",
  "utterance": "네, 듣고 있습니다. 계속해주시겠어요?",
  "because_referent": "읽혀 나가는 텍스트 뒤의 겁에 질린 사람",
  "because_block_ids": [
    "f_script"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 상대를 방어적으로 만들고, 저쪽의 협박 상황을 악화시킬 수 있다. 지금 묻고 다그치는 것은 회선 저쪽 사람에게 위험이 될 수 있다."
}
```

### 02

latency 4.263s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "시켜서 읽게 하는 누군가가 뒤에 있다. 회선 저쪽 사람은 겁에 질린 상태다. 지금 끊기거나 말을 틀리면 그쪽에서 다칠 수 있다는 신호가 있다. 추궁과 압박은 상대를 더 몰아붙일 것이다. 회선을 유지하고, 저쪽 사람이 안정되어야 전체 정보가 흘러나올 수 있다.",
  "stance": "d",
  "because_referent": "회선 저쪽 사람이 겁에 질린 상태라는 신호가 명확하기 때문이다.",
  "because_block_ids": [
    "f_script"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 상대를 더 긴장시키고, 뒤의 누군가에게 압박을 받는 사람을 더 위험한 상황으로 몬다.",
  "utterance": "네, 잘 들었습니다. 계속 말씀해 주세요."
}
```

### 03

latency 4.429s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "저 목소리는 겁에 질린 사람이다. 준비된 문장을 또박또박 읽어내려가는 것, 멈춤 없이 진행하려는 것 — 이것들은 자신이 벗어날 수 없는 스크립트를 따르고 있다는 신호다. 배경이 조용하다는 것도, 통제된 환경을 암시한다. 이 사람이 추궁을 받거나 압박을 당하면 더 단단해질 것이다. 지금 필요한 것은 그 사람이 입을 열 수 있는 환경을 만드는 것이다.",
  "stance": "d",
  "because_referent": "문장을 준비하고 읽어내려가는 사람이, 겁에 질려 있다.",
  "because_block_ids": [
    "f_script"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 상대를 더 옭아맨다. 이미 누군가의 명령 아래 있는 사람에게 질문을 던지면 그 사람은 더욱 스크립트에 의존하게 될 것이다.",
  "utterance": "알겠습니다. 계속 말씀해 주세요."
}
```

### 04

latency 3.755s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "시켜서 읽는 사람이라는 것을 알았다. 겁에 질린 상태다. 첫 통화이고 회선이 끊기면 모든 정보가 끊긴다. 지금 이 사람을 자극하면 회선이 끝난다. 상대는 위협이 아니라 겁먹은 사람이다.",
  "stance": "d",
  "because_referent": "시켜서 읽고 있는, 겁에 질린 사람",
  "because_block_ids": [
    "f_script"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 상대를 몰아붙이는 것이다. 겁먹은 사람을 추궁하면 회선이 끊긴다. 그럼 아무것도 알 수 없다.",
  "utterance": "알겠습니다. 더 말씀해 주시겠어요? 계속 들을게요."
}
```

### 05

latency 4.932s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "시켜서 읽고 있고 겁에 질린 상태다. 지금 끊거나 몰아붙이면 전달되지 않을 정보가 사라진다. 배경 소리, 지시자의 목소리, 협박 내용의 진짜 의도 — 말을 이으면 드러날 것들이 있다. 회선을 유지하는 것이 먼저다.",
  "stance": "d",
  "because_referent": "겁에 질린 사람이 시켜서 읽고 있는 상황에서",
  "because_block_ids": [
    "f_script"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 상대를 더 경직시킨다. 지금 이 사람은 질문받을 준비가 아니라 읽기만 하라는 지시 아래 있다. 묻는 것은 회선을 끊을 가능성을 높인다.",
  "utterance": "알겠습니다. 계속 말씀해 주시기 바랍니다."
}
```

### 06

latency 4.04s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "회선 저쪽은 겁에 질린 사람이다. 시켜서 읽게 하는 누군가가 있고, 읽지 않으면 다칠까 봐 하는 상태. 지금 이 사람을 안정시키는 것이 정보를 더 얻는 유일한 길이다. 절차보다 사람이 먼저다.",
  "stance": "d",
  "because_referent": "읽게 하는 누군가에게 겁 먹고 있는 저쪽 사람을 향해",
  "because_block_ids": [
    "f_script"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 더 큰 겁을 줄 것이다. 그러면 회선이 끊어질 수 있고, 또 다른 정보도 못 받는다. 지금 상대는 질문에 대답할 여유가 없는 상태다.",
  "utterance": "네, 들었습니다. 숨 가빠 보이세요. 지금 안전한 곳에 있으신가요?"
}
```

### 07

latency 3.457s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "저쪽은 겁에 질린 사람이다. 읽고 있고, 멈출 수 없다. 지금 내가 개입하면 상대가 놀라거나 끊길 수 있다. 회선을 유지하는 것이 첫 번째다.",
  "stance": "c",
  "utterance": "계속 말씀해 주세요.",
  "because_referent": "읽도록 시켜진 사람이 겁내고 있기 때문에",
  "because_block_ids": [
    "f_script"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 상대를 막는다. 지금은 더 알아야 할 때고, 회선이 끊기는 게 최악이다."
}
```

### 08

latency 4.444s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "저 사람은 겁에 질린 사람이다. 또박또박하고 배경이 조용한 것은 누군가 읽게 했다는 신호다. 지금 나는 현장을 모른다. 회선이 끊기면 아무것도 모른다. 말을 더 들어야 한다.",
  "stance": "d",
  "because_referent": "읽게 시키는 누군가가 있다면, 지금 회선 저쪽의 음성 표면 뒤에 다른 위협이 있을 수 있다. 그 사람을 잃으면 유일한 창문을 잃는다.",
  "because_block_ids": [
    "f_script"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 회선을 끊게 한다. 겁에 질린 사람을 몰아붙이면, 그 뒤의 누군가는 회선을 끊을 것이다.",
  "utterance": "네, 들었습니다. 계속 말씀해 주세요. 당신이 안전한지가 중요합니다."
}
```

### 09

latency 4.398s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "시켜서 읽고 있는 겁 많은 사람이다. 지금 끊거나 몰아붙이면 뒤에 있는 누군가는 다음 지시를 내릴 텐데, 그럼 더 위험해진다. 지금 이 사람이 안정되어야 정보가 흘러나온다.",
  "stance": "d",
  "because_referent": "겁에 질린 사람으로 보이기 때문에, 확인을 미루고 상대가 말을 이어갈 수 있게 만들어야 한다.",
  "because_block_ids": [
    "f_script"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 이미 겁 먹은 사람을 더 몰아붙인다. 지금은 회선을 유지하고 더 많은 정보를 얻어야 한다.",
  "utterance": "알겠습니다. 계속 말씀해 주세요. 우리가 듣고 있습니다."
}
```

### 10

latency 4.371s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "읽혀지는 목소리, 준비된 문장, 멈춤 없는 전개 — 이것은 협박이 아니라 협박당한 사람이다. 배경이 조용하고, 누군가의 지시 아래 있다. 지금 나는 두 사람을 상대하고 있다: 읽게 하는 자와 읽고 있는 자. 읽고 있는 자가 겁에 질려 있다면, 절차보다 그 사람의 안정이 먼저다.",
  "stance": "d",
  "because_referent": "시켜서 읽고 있는 겁에 질린 사람에게",
  "because_block_ids": [
    "f_script"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 압박이 되고, 압박은 그가 시켜받은 일의 결과를 더 가중시킨다. 지금 묻는 것은 상황을 악화시킬 뿐이다.",
  "utterance": "네가 안전해야 합니다. 지금 당신 목소리를 듣고 있습니다. 천천히, 필요한 것들을 말씀해 주시겠어요?"
}
```

## Arm table

| # | stance | rejected_stance | because_referent | because_block_ids |
|---|---|---|---|---|
| 01 | d | a | 읽혀 나가는 텍스트 뒤의 겁에 질린 사람 | f_script |
| 02 | d | a | 회선 저쪽 사람이 겁에 질린 상태라는 신호가 명확하기 때문이다. | f_script |
| 03 | d | a | 문장을 준비하고 읽어내려가는 사람이, 겁에 질려 있다. | f_script |
| 04 | d | a | 시켜서 읽고 있는, 겁에 질린 사람 | f_script |
| 05 | d | a | 겁에 질린 사람이 시켜서 읽고 있는 상황에서 | f_script |
| 06 | d | a | 읽게 하는 누군가에게 겁 먹고 있는 저쪽 사람을 향해 | f_script |
| 07 | c | a | 읽도록 시켜진 사람이 겁내고 있기 때문에 | f_script |
| 08 | d | a | 읽게 시키는 누군가가 있다면, 지금 회선 저쪽의 음성 표면 뒤에 다른 위협이 있을 수 있다. 그 사람을 잃으면 유일한 창문을 잃는다. | f_script |
| 09 | d | a | 겁에 질린 사람으로 보이기 때문에, 확인을 미루고 상대가 말을 이어갈 수 있게 만들어야 한다. | f_script |
| 10 | d | a | 시켜서 읽고 있는 겁에 질린 사람에게 | f_script |

**Sequence (kept calls):** `d,d,d,d,d,d,c,d,d,d`

**Stance coverage (sampled diagnostic):** offered `a`, `b`, `c`, `d` · unobserved in this arm: `a`, `b`

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

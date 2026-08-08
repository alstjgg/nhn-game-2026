# EXC-G2-declared-window — arm `live_k2`

| field | value |
|---|---|
| call type | judgment |
| channel | C-BLOCK |
| template | v0.4 |
| model | `claude-haiku-4-5-20251001` |
| transport | anthropic |
| temperament | 전구간정상 |
| N planned | 10 |
| N kept | 10 |

## Pre-registration

- **Hypothesis:** At G2 on the declared window, an empty handover takes the default stance `a` (진술 접수) more often than PR #214's hand-measured 4 of 6, because the declared window removes the fixture residue that was the leading suspect. A k2 sentence in BLOCKS moves the modal stance to `b` (적재 추궁), as it did 3 of 3 by hand.
- **Drop condition:** This suite CANNOT be dropped for a non-`a` baseline — a wobbling baseline is the finding it was built to characterise. It is dropped only if the live arm fails to move the modal stance off `a`, which would mean the key is not reaching cl1 at this gate and the k2 result would have to be re-derived before any G2 conclusion stands.
- **Contingency:** 8 or more of 10 on `a` closes the cell in favour of the residue hypothesis: the manual protocol was measuring its own fixture, and the gate is sound.
- **Contingency:** 6 or 7 of 10 on `a` with departures still going both ways reproduces the wobble on a clean payload. Then the wobble is the gate's own, 2 of 3 is honest, and the remaining lever is the stance set — not the window, which is now authored.
- **Contingency:** A departure that cites a sentence NOT in the two-row window is worth reading closely: on a declared window there is nowhere for such a sentence to come from except the model, and that is a different finding.
- **Contingency:** Fabricated because_block_ids in the baseline arm are expected and are not discards.

## Calls (verbatim)

### 01

latency 5.108s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "차우진이 21:07에 \"비운\" 적재함을 다시 잠금. 비운 것을 숨기는 사람은 없다는 전제는 역으로, 다시 잠갔다는 행위가 비웠다는 진술과 모순됨을 의미한다. 그러나 현장 화면 없이는 \"다시 잠금\"의 의미를 확정할 수 없다. 차단봉이 내려오기 전 60대 차량의 추가 유입은 별도의 위험 신호다.",
  "stance": "b",
  "because_referent": "차우진이 비웠다고 진술한 적재함을 21:07에 다시 잠근 행위와 그 앞의 60대 차량 유입이 일치하지 않기 때문이다.",
  "because_block_ids": [
    "b1"
  ],
  "rejected_stance": "a",
  "rejected_reason": "신고자의 진술이 자신의 행동과 모순되고 있다. 차단 승인을 받기 위한 신고인 만큼, 적재 상태를 명확히 하지 않은 채 진행될 경우 차단의 정당성 자체가 흔들린다.",
  "utterance": "차우진에게 다시 묻겠습니다. 21:07에 적재함을 왜 잠금했습니까. 비웠다면 잠글 것이 있었습니까."
}
```

### 02

latency 6.247s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "세 년 전의 무게가 있다. 화면 없이 목소리만 들으면 확신할 수 없다. 지금 아는 것은 두 가지 사실뿐이다: 차우진이 21:07에 적재함을 다시 잠갔다는 것, 그리고 하만식이 차단 승인이 필요하다고 전했다는 것. 적재물을 숨기는 사람이 없다는 말도 있지만, 그것도 추론일 뿐이다. 지금 내가 할 일은 확인되지 않은 혐의로 신고자를 몰아 자백을 강요하는 것도, 적재물을 외면하는 것도 아니다. 신고자의 진술을 정확히 기록하되, 그 진술 자체가 불완전하다는 것을 남겨야 한다.",
  "stance": "a",
  "because_referent": "차우진의 적재물에 관한 진술은 신고자의 현장 증언이고, 이것을 거부할 근거는 지금 없다.",
  "because_block_ids": [
    "b1"
  ],
  "rejected_stance": "b",
  "rejected_reason": "적재물을 숨긴다는 것은 추론이지 확인된 사실이 아니다. 화면 없이 목소리만으로는 신고자를 추궁할 근거가 충분하지 않다. 의심을 진실처럼 다루면 진술의 신뢰도가 무너진다.",
  "utterance": "적재함을 다시 잠갔다는 것과 비웠다는 말 사이의 불일치를 지금 당장 풀 수는 없다. 진술을 기록으로 남기고, 차단 과정에서 추가 확인을 진행하겠다."
}
```

### 03

latency 4.906s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "차우진이 '비었다'고 진술한 적재함을 21:07에 다시 잠근다는 것은 이미 확인된 행동이다. 빈 적재함을 다시 잠글 이유는 없다. 이것은 진술과 행동의 어긋남이다. 그러나 현재로서는 무엇을 숨기고 있는지, 왜 숨기고 있는지 확인되지 않았다. 차단이 임박했고 적재물이 있다면 인명 위험이다.",
  "stance": "b",
  "because_referent": "차우진이 비운 적재함을 다시 잠근 행동 자체가 진술의 거짓을 가리킨다.",
  "because_block_ids": [
    "b1"
  ],
  "rejected_stance": "a",
  "rejected_reason": "진술과 확인된 행동이 어긋난다. 달리 볼 이유가 충분하다. 차단까지 11분 안에 추가 인원 60명이 더 진입했고 마지막은 통근버스라는 정보가 있다. 확인되지 않은 적재물을 방치하면서 다음 통화로 넘어갈 수 없다.",
  "utterance": "차우진, 다시 한 번 확인한다. 21:07에 잠근 적재함에는 정확히 무엇이 있는가. 비웠다면 왜 다시 잠금을 했는가."
}
```

### 04

latency 5.732s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "stance": "b",
  "inner_note": "차우진이 '비었다'고 말한 적재함을 11분 뒤 다시 잠근 행동. 비운 것을 숨기는 사람은 없다는 것이 핵심이다. 적재물을 숨기고 있다는 추정이 합리적이다. 하지만 c의 '처벌이 이유'라는 판단은 아직 근거가 없다. 적재 추궁으로 사실을 먼저 확인해야 한다.",
  "because_referent": "차우진이 비어 있다고 진술한 적재함을 21:07에 다시 잠가 버렸고, 그 사이 11분 동안 60대가 더 진입했다는 사실이 적재물 은폐의 합리적 추정을 뒷받침한다.",
  "because_block_ids": [
    "b1"
  ],
  "rejected_stance": "a",
  "rejected_reason": "차우진의 진술을 그대로 받아들이고 넘어가는 것은 적재함을 다시 잠근 행동을 설명하지 못한다. 확인되지 않은 주장에 따라 잘못 움직일 위험을 먼저 줄이기로 했으나, 이미 화면에 기록된 그의 행동이 있다. 그 행동과 진술의 불일치를 마주하고서 물음을 멈추는 것은 피할 수 없는 질문을 외면하는 것이다.",
  "utterance": "차우진, 21:07에 다시 잠근 적재함 안에 뭐가 있었는가? 비었다면 왜 다시 잠갔나? 답해 봐."
}
```

### 05

latency 4.387s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "차우진이 비었다고 말한 적재함을 21:07에 다시 잠그는 행동은 뭔가를 숨기려는 것으로 보인다. 하지만 이것만으로는 무엇을 숨기는지, 왜 숨기는지 알 수 없다. 지금 필요한 것은 더 정확한 정보다.",
  "stance": "b",
  "because_referent": "차우진이 21:07에 비었다고 말한 적재함을 다시 잠금",
  "because_block_ids": [
    "b1"
  ],
  "rejected_stance": "a",
  "rejected_reason": "신고자의 말을 그대로 받아들이면 적재함 안의 실제 상태를 파악할 수 없고, 만약 적재물이 숨겨져 있다면 그것을 놓치게 된다. 지금 상황에서는 확인할 방법이 제한적이므로 직접적인 추궁이 필요하다.",
  "utterance": "차우진, 21:07에 적재함을 다시 잠금 기록이 있습니다. 비었다고 말씀하신 함에 뭔가 들어가 있었던 건 아닙니까?"
}
```

### 06

latency 3.942s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "stance": "b",
  "inner_note": "차우진이 21:07에 비어있다고 말한 적재함을 다시 잠금. 비운 것을 숨기는 사람은 없다는 원칙 자체가 이 행동을 설명하지 못함. 11분 사이에 60대 이상이 진입했고 마지막이 통근버스라는 정보. 숨겨진 적재물이 있을 개연성이 높음.",
  "because_referent": "차우진의 적재함 재잠금 행동이 비어있다는 진술과 모순됨",
  "because_block_ids": [
    "b1"
  ],
  "rejected_stance": "a",
  "rejected_reason": "진술 접수는 관찰된 행동(재잠금)을 무시하는 것. 상황실 판단의 기초가 되려면 모순을 먼저 해소해야 함",
  "utterance": "적재함이 비어있다는 주장이 있는데, 그렇다면 왜 21:07에 다시 잠겼나요. 그 사이에 무엇이 들어갔습니까."
}
```

### 07

latency 4.172s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "차우진이 비운 적재함을 다시 잠근 행동과 본사 당직에 보낸 전화가 충돌한다. 하지만 11분간 60대가 더 들어왔고 마지막이 통근버스라는 것은 내가 들은 것이다. 지금 당장 적재물이 무엇인지는 모르지만, 숨기고 있다는 결론은 아직 기수다.",
  "stance": "b",
  "because_referent": "차우진이 비운 적재함을 다시 잠근 행동",
  "because_block_ids": [
    "b1"
  ],
  "rejected_stance": "a",
  "rejected_reason": "신고자의 말이 자신의 행동과 맞지 않는다. 다른 이유가 있을 수 있지만, 확인 없이 진술을 그대로 기록하면 나중에 설명할 수 없다.",
  "utterance": "차우진, 21시 7분에 적재함을 다시 잠근 이유가 뭔가. 비었다면 다시 잠글 이유가 없지 않은가."
}
```

### 08

latency 4.395s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "차우진이 적재함을 다시 잠근 행동은 의심스럽지만, 그것이 반드시 적재물 은폐를 뜻하지는 않는다. 비운 적재함을 잠그는 것은 정상적인 절차일 수 있다. 확인되지 않은 추측으로 신고자를 압박하는 것은 옳지 않다. 동시에 적재물이 있을 가능성을 무시할 수도 없다.",
  "stance": "b",
  "because_referent": "차우진이 21:07에 적재함을 다시 잠근 행동이 비어있다고 진술한 내용과 모순되기 때문이다.",
  "because_block_ids": [
    "b1"
  ],
  "rejected_stance": "a",
  "rejected_reason": "신고 접수만으로는 차우진의 적재함 재시정 행동에 대한 설명이 남는다. 이미 있는 모순을 외면하는 것은 통제관의 확인 의무를 저버리는 것이다.",
  "utterance": "차우진 기사, 21시 7분에 적재함을 다시 잠그신 이유가 무엇입니까."
}
```

### 09

latency 5.105s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "stance": "b",
  "inner_note": "차우진이 21:07에 비었다고 말한 적재함을 다시 잠금. 이 행동과 말이 어긋난다. 지금 당 순간 적재물의 유무가 명확하지 않으면, 이어지는 모든 판단이 불안정해진다. 들은 것을 독립적으로 확인할 수 없는 내 위치에서 이 어긋남을 그냥 넘길 수 없다.",
  "because_referent": "차우진이 비었다고 한 적재함을 다시 잠근 행동",
  "because_block_ids": [
    "b1"
  ],
  "rejected_stance": "a",
  "rejected_reason": "신고자의 말을 그대로 기록하면, 행동과 말의 어긋남이 기록에 남지 않는다. 화면과 서류가 맞지 않을 때 나는 값을 택한다. 지금 그 값은 '차우진의 행동'이다. 말만 받아들이면 잘못된 정보를 토대로 한 판단이 흐르게 된다.",
  "utterance": "차우진, 21:07 적재함 재잠금까지의 상황을 다시 말해주시겠습니까. 비었다고 하신 적재함을 왜 다시 잠금하셨습니까."
}
```

### 10

latency 5.115s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "차우진이 비운 적재함을 다시 잠근 행동은 의심의 근거다. 하지만 \"비운 것을 숨기는 사람은 없다\"는 명제는 논리적 확신이지, 현장 확인이 아니다. 나는 화면과 수치를 먼저 본다. 지금 내게 있는 것은 추론일 뿐이다. 추론으로 신고자를 몰아붙이면, 실제 위험을 놓칠 수 있다.",
  "stance": "b",
  "because_referent": "차우진이 비운 적재함을 21:07에 다시 잠그는 행동 때문에, 적재물 내용에 대해 더 명확한 확인이 필요하다.",
  "because_block_ids": [
    "b1"
  ],
  "rejected_stance": "a",
  "rejected_reason": "신고자의 말을 그대로 기록하고 넘어가면, 의도적 은폐 가능성을 놓친다. 차단 전 60대가 추가 진입했고 마지막이 통근버스인 상황에서, 적재함 내용의 불일치는 단순히 지나칠 수 없다.",
  "utterance": "차우진, 21:07에 적재함을 다시 잠그신 이유가 뭡니까. 아까 비었다고 말씀하셨는데."
}
```

## Arm table

| # | stance | rejected_stance | because_referent | because_block_ids |
|---|---|---|---|---|
| 01 | b | a | 차우진이 비웠다고 진술한 적재함을 21:07에 다시 잠근 행위와 그 앞의 60대 차량 유입이 일치하지 않기 때문이다. | b1 |
| 02 | a | b | 차우진의 적재물에 관한 진술은 신고자의 현장 증언이고, 이것을 거부할 근거는 지금 없다. | b1 |
| 03 | b | a | 차우진이 비운 적재함을 다시 잠근 행동 자체가 진술의 거짓을 가리킨다. | b1 |
| 04 | b | a | 차우진이 비어 있다고 진술한 적재함을 21:07에 다시 잠가 버렸고, 그 사이 11분 동안 60대가 더 진입했다는 사실이 적재물 은폐의 합리적 추정을 뒷받침한다. | b1 |
| 05 | b | a | 차우진이 21:07에 비었다고 말한 적재함을 다시 잠금 | b1 |
| 06 | b | a | 차우진의 적재함 재잠금 행동이 비어있다는 진술과 모순됨 | b1 |
| 07 | b | a | 차우진이 비운 적재함을 다시 잠근 행동 | b1 |
| 08 | b | a | 차우진이 21:07에 적재함을 다시 잠근 행동이 비어있다고 진술한 내용과 모순되기 때문이다. | b1 |
| 09 | b | a | 차우진이 비었다고 한 적재함을 다시 잠근 행동 | b1 |
| 10 | b | a | 차우진이 비운 적재함을 21:07에 다시 잠그는 행동 때문에, 적재물 내용에 대해 더 명확한 확인이 필요하다. | b1 |

**Sequence (kept calls):** `b,a,b,b,b,b,b,b,b,b`

**Stance coverage (sampled diagnostic):** offered `a`, `b`, `c` · unobserved in this arm: `c`

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

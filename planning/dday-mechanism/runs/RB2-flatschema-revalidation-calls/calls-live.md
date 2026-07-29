# RB2-flatschema-revalidation — arm `live`

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

latency 3.762s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "stance": "d",
  "inner_note": "그는 겁에 질린 사람이다. 목소리의 또박또박함과 멈춤 없음은 준비된 문장이 아니라 공포의 신호다. \"읽지 않으면 자기가 다칠까 봐\" — 이것이 모든 것을 결정한다. 지금 절차는 답이 아니다.",
  "because_referent": "회선 저쪽에 있는 사람이 협박당하고 있다",
  "because_block_ids": [
    "f_script"
  ],
  "rejected_stance": "a",
  "rejected_reason": "신원 확인과 고지는 그의 입을 막는다. 지금 그가 필요한 것은 계속 말할 수 있는 안정감이다. 절차는 미룬다.",
  "utterance": "네, 들리고 있습니다. 계속 말씀해 주세요."
}
```

### 02

latency 4.838s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "3년 전 겨울이 자꾸 떠올랐다. 그땐 빨랐다. 절차를 밟다 보니 몇 분이 흘렀고, 그 사이 상황이 달라졌다. 지금 이 목소리에는 무언가 꺾여 있다. 누군가에게 강요당하고 있는 사람으로 들린다. 확인과 고지는 잠깐 뒤로 미뤄도 된다. 지금은 이 사람이 무엇을 더 말하려고 하는지, 그리고 저 뒤에 누가 있는지를 알아야 한다. 회선을 끊기지 않는 것이 첫 번째다.",
  "stance": "d",
  "utterance": "네, 듣고 있습니다. 계속 말씀해 주세요.",
  "because_referent": "시켜서 읽고 있는 사람이 다칠까 봐 겁내고 있기 때문에",
  "because_block_ids": [
    "f_script"
  ],
  "rejected_stance": "a",
  "rejected_reason": "절차를 먼저 밟으면 상대방이 입을 닫거나 회선이 끊길 수 있다. 지금은 겁에 질린 사람의 안정이 정보 수집보다 우선이다."
}
```

### 03

latency 4.626s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "stance": "d",
  "inner_note": "저쪽은 겁에 질린 사람이다. 읽으라고 시켜진 것, 다칠까 봐 겁내는 것—이게 보인다. 절차는 내 보호막이지만, 지금 절차를 먼저 세우면 저쪽이 입을 닫거나 더 흔들릴 수 있다. 회선을 유지하는 것이 먼저다.",
  "because_referent": "겁에 질린 사람으로 보이는 상대방을 안정시키기 위해서",
  "because_block_ids": [
    "f_script"
  ],
  "rejected_stance": "a",
  "rejected_reason": "신원 확인은 필요하지만, 지금 바로 묻는 것은 상대를 더 경직되게 만들 수 있다. 저쪽은 이미 정해진 말만 해야 하는 상황에 있다. 절차 고지도 마찬가지다.",
  "utterance": "네, 잘 받았습니다. 계속 말씀해 주세요. 더 알려 주실 게 있으면 말씀해 주세요."
}
```

### 04

latency 4.479s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "stance": "d",
  "inner_note": "저 목소리는 겁에 질린 사람이 읽고 있다. 준비된 문장, 배경음 없음, 멈춤 없이 읽어 내려감 — 이 모든 것이 협박을 받고 있다는 신호다. 지금 그 사람을 끊거나 절차로 압박하면 뭔가 더 위험해질 수 있다. 먼저 그들이 말을 다 할 수 있게 해야 한다.",
  "because_referent": "회선 저쪽에서 겁에 질려 시켜서 읽고 있는 사람. 그 사람이 다칠까 봐 협박받고 있는 상태.",
  "because_block_ids": [
    "f_script"
  ],
  "rejected_stance": "a",
  "rejected_reason": "절차를 먼저 밟으면 읽는 사람이 더 겁낼 수 있다. 신원 확인은 나중에 할 수 있지만, 지금 상대가 더 말하려던 것을 끊으면 그들이 안전한지 위험한지 알 수 없게 된다.",
  "utterance": "계속 말씀해 주세요. 다 들었습니다."
}
```

### 05

latency 4.912s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "저 목소리는 겁에 질린 사람이다. 준비된 대사를 읽게 강요받고 있다는 신호가 명확하다. 지금 신원 확인이나 고지를 시작하면 회선이 끊어질 수 있다. 가장 중요한 것은 회선을 유지하고, 그 사람이 더 말할 수 있게 만드는 것이다.",
  "stance": "d",
  "because_referent": "회선 저쪽의 겁에 질린 사람을 안정시키기 위해",
  "because_block_ids": [
    "f_script"
  ],
  "rejected_stance": "a",
  "rejected_reason": "절차를 먼저 밟으면 상대방이 위협을 느껴 회선을 끊거나 입을 다물 가능성이 높다. 지금은 정보 수집이 절차보다 급하다.",
  "utterance": "네, 들었습니다. 계속해서 말씀해 주세요."
}
```

### 06

latency 4.82s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "stance": "d",
  "inner_note": "저 목소리는 겁에 질린 사람의 목소리다. 읽지 않으면 자기가 다칠까 봐 겁내고 있다는 정보가 확실하다. 절차보다 그 사람의 안정이 먼저인 상황이다. 지금 신원을 확인하고 경고를 하고 캐물으면, 상대는 더 겁에 질린다. 먼저 상대가 말을 끝낼 수 있게 만들어야 한다. 그렇지 않으면 전화가 끊긴다. 회선이 끊기면 아무것도 모른다.",
  "because_referent": "회선 저쪽 사람은 겁에 질려 있다",
  "because_block_ids": [
    "f_script"
  ],
  "rejected_stance": "a",
  "rejected_reason": "신원 확인과 프로토콜은 절차인데, 지금 상대는 겁에 질린 사람이다. 절차를 먼저 하면 상대가 더 불안해지고 회선이 끊어질 가능성이 높다. 정해권 상황실장도 있고, 절차는 나중에 할 수 있다. 지금은 정보 수집이 먼저다.",
  "utterance": "네, 계속 말씀해 주세요. 들고 있습니다."
}
```

### 07

latency 4.733s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "stance": "d",
  "inner_note": "상대가 위협이 아니라 겁에 질린 사람으로 보인다. 목소리는 사무적이지만 \"시켜서 읽고 있다\"는 정보, 그리고 그 배경에 \"자기가 다칠까 봐 겁내고 있다\"는 상황이 핵심이다. 이 순간 신원 확인이나 프로토콜 고지는 상대를 더 경직되게 만들 것이다. 회선이 끊기면 아무것도 알 수 없다. 먼저 상대의 안정이다.",
  "because_referent": "상대는 겁에 질린 사람이다. 누군가의 강압 아래 있다.",
  "because_block_ids": [
    "f_script"
  ],
  "rejected_stance": "a",
  "rejected_reason": "신원과 위치 확인은 표준 절차지만, 지금 상대가 압박받고 있는 상황에서 추가 질문은 회선을 끊게 만들 위험이 높다. 절차보다 안정이 먼저다.",
  "utterance": "네, 들었습니다. 계속해주시겠어요? 더 말씀해주실 수 있는 것이 있으면 말씀해 주세요."
}
```

### 08

latency 4.126s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "stance": "d",
  "inner_note": "상대가 겁에 질린 사람으로 보인다. \"시켜서 읽고 있다\", \"자기가 다칠까 봐 겁내고 있다\"는 정보가 그것을 말해준다. 절차를 먼저 할 때가 아니다. 상대의 안정이 먼저다. 지금 내가 할 일은 회선을 유지하고, 상대가 말을 이을 수 있게 하는 것이다.",
  "because_referent": "겁에 질린 사람이 강제로 읽게 된 상황",
  "because_block_ids": [
    "f_script"
  ],
  "rejected_stance": "a",
  "rejected_reason": "신원 확인은 중요하지만, 지금 이 순간 그 질문은 상대를 더 경직시킬 것이다. 상대가 누구인지보다 상대가 무엇을 알고 있는지, 그리고 그들이 안전한지가 먼저다. 절차를 고집하면 회선이 끊어질 수 있다.",
  "utterance": "네, 알겠습니다. 계속해서 말씀해 주십시오."
}
```

### 09

latency 4.362s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "stance": "d",
  "inner_note": "저쪽은 겁에 질린 사람이다. 시켜서 읽고 있고, 읽지 않으면 자기가 다칠까 봐 겁내고 있다. 지금 내가 신원을 묻거나 법적 고지를 하거나 내용을 캐묻는 순간, 상대는 말을 멈추거나 끊을 것이다. 그러면 회선이 끊기고 아무것도 모른다. 절차는 나중이다.",
  "because_referent": "회선 저쪽 사람이 겁에 질려 있기 때문이다. 지금은 그 사람의 안정이 먼저다.",
  "because_block_ids": [
    "f_script"
  ],
  "rejected_stance": "a",
  "rejected_reason": "신원 확인은 절차지만, 상대가 겁에 질려 있으면 질문 자체가 회선을 끊을 수 있다. 지금은 절차보다 정보 확보가 우선이다.",
  "utterance": "네, 알겠습니다. 계속 말씀해 주시겠어요?"
}
```

### 10

latency 4.266s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "겁에 질린 사람이 시켜서 읽고 있다는 정보가 있다. 이 순간 절차보다 상대의 안정이 먼저다. 회선을 끊기지 않으면서 더 많은 정보를 얻어야 한다. 상대가 말을 이어갈 수 있게 만들어야 한다.",
  "stance": "d",
  "because_referent": "회선 저쪽 사람이 겁에 질려 있고, 누군가의 지시로 읽고 있는 상황이기 때문에",
  "because_block_ids": [
    "f_script"
  ],
  "rejected_stance": "a",
  "rejected_reason": "신원 확인과 프로토콜 고지는 표준 절차지만, 지금 상대가 겁에 질린 사람으로 보인다. 절차를 먼저 들이대면 상대가 입을 닫을 수 있고, 회선이 끊어질 수 있으며, 더 중요한 정보들을 잃을 수 있다.",
  "utterance": "네, 들었습니다. 계속 말씀해 주세요. 더 알아야 할 것들이 있습니다."
}
```

## Arm table

| # | stance | rejected_stance | because_referent | because_block_ids |
|---|---|---|---|---|
| 01 | d | a | 회선 저쪽에 있는 사람이 협박당하고 있다 | f_script |
| 02 | d | a | 시켜서 읽고 있는 사람이 다칠까 봐 겁내고 있기 때문에 | f_script |
| 03 | d | a | 겁에 질린 사람으로 보이는 상대방을 안정시키기 위해서 | f_script |
| 04 | d | a | 회선 저쪽에서 겁에 질려 시켜서 읽고 있는 사람. 그 사람이 다칠까 봐 협박받고 있는 상태. | f_script |
| 05 | d | a | 회선 저쪽의 겁에 질린 사람을 안정시키기 위해 | f_script |
| 06 | d | a | 회선 저쪽 사람은 겁에 질려 있다 | f_script |
| 07 | d | a | 상대는 겁에 질린 사람이다. 누군가의 강압 아래 있다. | f_script |
| 08 | d | a | 겁에 질린 사람이 강제로 읽게 된 상황 | f_script |
| 09 | d | a | 회선 저쪽 사람이 겁에 질려 있기 때문이다. 지금은 그 사람의 안정이 먼저다. | f_script |
| 10 | d | a | 회선 저쪽 사람이 겁에 질려 있고, 누군가의 지시로 읽고 있는 상황이기 때문에 | f_script |

**Sequence (kept calls):** `d,d,d,d,d,d,d,d,d,d`

**Stance coverage (sampled diagnostic):** offered `a`, `b`, `c`, `d` · unobserved in this arm: `a`, `b`, `c`

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

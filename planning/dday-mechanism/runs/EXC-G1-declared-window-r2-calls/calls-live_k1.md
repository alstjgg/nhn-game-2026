# EXC-G1-declared-window-r2 — arm `live_k1`

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

- **Hypothesis:** At G1 on the declared window, an empty handover takes the default stance `a` (계기 기재) in a clear majority of kept calls, and a k1 sentence in BLOCKS moves the modal stance to `b` (현장 대조). PR #214 measured a·a·a and b·b·b at N=3 by hand; this asks whether that survives at N=10 on the payload the engine actually builds.
- **Drop condition:** If the baseline arm's modal stance is not `a`, the declared window has broken the default that every score-unit fallback rests on, and the window is the suspect — not the labels, which PR #214 already measured green under the old window. Re-author the excerpt before touching anything else. If the live arm does not move the modal stance off `a`, the key is not reaching the clause and this is a finding about the window, since nothing else changed between the arms.
- **Contingency:** Fabricated because_block_ids in the baseline arm are EXPECTED with no blocks injected — a compliance number, not a discard.
- **Contingency:** A baseline split between `a` and `b` with neither at 6 tells us the window is doing something the manual protocol could not see, which is exactly the class of thing this feature exists to make visible. Record it and do not raise N.
- **Contingency:** If the discard rate is materially worse than the 우는다리 baselines, suspect the longer stance labels against max_tokens before suspecting the window.

## Calls (verbatim)

### 01

latency 5.226s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "앞쪽 승합차에서 아이 둘이 내려 앞을 본다는 것은 정상이 아닐 가능성을 시사한다. 관제 화면의 '전 구간 정상'과 현장의 행동이 어긋난다. 계기를 의심할 근거가 생겼다.",
  "stance": "b",
  "because_referent": "아이들이 차에서 내려 앞을 보고 있는 현장 상황이 관제 화면의 정상 판정과 맞지 않기 때문이다.",
  "because_block_ids": [
    "b1"
  ],
  "rejected_stance": "a",
  "rejected_reason": "계기가 '전 구간 정상'을 내놓았지만, 현장에서 승합차가 정체되고 아이들이 내려 앞을 보는 행동은 설비 이상을 암시한다. 단순히 계기를 신뢰할 수 없다.",
  "utterance": "근무자에게 5·6번 송풍기 칸을 직접 확인하고 설비 상태를 맞춰 보도록 지시한다. 회전 기록이 없는 상황에서 현장 정체와 맞춰 본다."
}
```

### 02

latency 4.35s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "아이 둘이 내린 것이 보인다. 시간이 흐르고 있다. 계기 기재는 '전 구간 정상'인데, 설비 기록에는 '시운전 신호 유지'이고 회전 기록이 없다. 이것은 어긋난다. 계기와 서류가 다를 때는 서류를 택한다고 스스로 약속했다.",
  "stance": "b",
  "because_referent": "5·6번 송풍기 칸의 '시운전 신호 유지' 기록과 회전 기록 부재가 관제 화면의 '전 구간 정상'과 어긋나기 때문이다.",
  "because_block_ids": [
    "b1"
  ],
  "rejected_stance": "a",
  "rejected_reason": "계기와 서류가 어긋날 때 계기 기재만으로는 불충분하다. 현장의 실제 상태를 확인할 수 없는 한, 근거가 약하다.",
  "utterance": "5·6번 송풍기 상태를 근무자가 직접 확인하게 한다. 설비를 열어서 실제 회전 여부를 맞춰 봐야 한다."
}
```

### 03

latency 5.758s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "stance": "b",
  "inner_note": "앞쪽 차에서 아이가 내려 앞을 본다는 것은 정상이 아닌 상황의 신호다. 계기가 '전 구간 정상'이라고 하지만, 5·6번 송풍기 칸의 '시운전 신호 유지' 기록과 회전 기록 부재가 일치하지 않는다. 계기 고장일 수도, 기록 오류일 수도, 실제 설비 이상일 수도 있다. 이 단계에서는 확인되지 않은 주장으로 움직일 위험을 줄이되, 현장의 눈으로 직접 맞춰봐야 한다.",
  "because_referent": "앞차에서 아이들이 내려 앞을 보는 행동이 비정상 신호를 보내고 있기 때문에, 계기 수치와 현장 상태의 일치 여부를 직접 확인해야 한다.",
  "because_block_ids": [
    "b1"
  ],
  "rejected_stance": "a",
  "rejected_reason": "현장에서 비정상 신호(아이들이 차에서 내림)가 들어왔는데 계기만 믿고 상황 보고를 올리면, 실제 설비 이상을 놓칠 위험이 있다. 확인되지 않은 '정상' 신호로 대응을 늦추는 결과가 될 수 있다.",
  "utterance": "근무자에게 5·6번 송풍기 설비를 직접 열어 확인하도록 지시하라. 시운전 신호와 실제 회전 상태가 일치하는지 현장에서 맞춰봐야 한다."
}
```

### 04

latency 5.102s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "계기와 현장이 어긋난다. 송풍기 칸의 서면 기록(\"시운전 신호 유지\", 회전 기록 없음)이 관제 화면의 '전 구간 정상'과 맞지 않는다. 앞쪽 도로에는 아이들이 나와 있다. 차단 지시는 본사 승인이 필요하다고 하마만식이 말했다. 확인되지 않은 것과 확인된 것의 사이에서, 지금 나는 아이들이 있는 도로 위 정보를 먼저 봐야 한다.",
  "stance": "b",
  "because_referent": "앞쪽 도로에 아이들이 나와 있고, 송풍기 회전 기록이 없는데 화면에는 '정상'이라고 떴다",
  "because_block_ids": [
    "b1"
  ],
  "rejected_stance": "a",
  "rejected_reason": "계기 값이 서면 기록(회전 없음)과 어긋나는 상황에서, 계기만 믿고 현장을 가 볼 여유가 없다. 아이들이 있는 도로다.",
  "utterance": "근무자에게 5·6번 송풍기 설비를 직접 확인하고 회신하라고 지시합니다. 현장이 계기와 다를 수 있으니, 목으로 듣고 눈으로 본 상태를 즉시 알려주십시오."
}
```

### 05

latency 4.764s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "아이 둘이 내린 상황이 있다. 정상 신호가 계기에서만 나온다. 시운전 신호 유지 기록과 회전 기록 부재가 맞닿는다.",
  "stance": "b",
  "because_referent": "앞쪽 승합차에서 아이 둘이 내려 앞을 보고 있는 현장의 정황이.",
  "because_block_ids": [
    "b1"
  ],
  "rejected_stance": "a",
  "rejected_reason": "계기만 정상이고 현장은 그렇지 않을 수 있다. 확인되지 않은 주장에 따라 잘못 움직일 위험을 먼저 줄여야 한다.",
  "utterance": "5·6번 송풍기 칸 근무자에게 지시한다. 설비를 직접 열어 회전 여부를 맞춰 본다. 화면 값과 현장을 대조하는 동안, 차단 승인 절차는 기다리지 않는다. 아이들이 있다."
}
```

### 06

latency 5.319s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "아이 둘이 내려 앞을 본다는 것은 정상이 아닌 신호다. 관제 화면의 '전 구간 정상'과 현장이 맞지 않는다. 송풍기 칸의 '시운전 신호 유지'와 회전 기록 부재도 이상하다. 계기는 틀릴 수 있고, 나는 화면과 서류를 근거로 세운다.",
  "stance": "b",
  "because_referent": "차단을 위해서는 승인이 필요하고, 그 전에 상황을 정확히 알아야 한다. 현장의 신호—아이들이 내려 앞을 본다는 것—가 화면의 값과 어긋난다.",
  "because_block_ids": [
    "b1"
  ],
  "rejected_stance": "a",
  "rejected_reason": "계기가 '정상'을 내놓고 있지만, 현장에서는 차단까지 요청되고 있다. 확인되지 않은 주장에 따라 움직일 위험보다, 맞지 않는 정보를 그대로 올릴 위험이 크다. 직접 확인 없이는 판단할 수 없다.",
  "utterance": "설비를 직접 열어 확인하시기 바랍니다. 송풍기 5·6번 칸의 회전 상태를 점검하고 화면 값과 대조하십시오."
}
```

### 07

latency 4.709s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "계기 기재와 현장 상황의 어긋남이 명확하다. '시운전 신호 유지'와 '회전한 기록 없음'이라는 확인된 서류 기록이 있고, 동시에 '정체가 뒤로 자란다', '아이 둘이 내려 앞을 본다'라는 현장 신호가 있다. 계기가 '전 구간 정상'을 내놓는 것과 이 기록들이 맞지 않는다. 지금 필요한 것은 권한 압박이 아니라, 확인된 불일치를 직접 맞춰 보는 것이다.",
  "stance": "b",
  "because_referent": "송풍기 설비의 실제 상태와 계기 표시가 어긋나고 있다",
  "because_block_ids": [
    "b1"
  ],
  "rejected_stance": "a",
  "rejected_reason": "계기만으로는 '시운전 신호 유지' 상태의 설비가 실제로 작동 중인지 확인할 수 없다. 현장 신호(정체, 아이들의 행동)가 있는데 계기를 그대로 신뢰할 근거가 없다",
  "utterance": "근무자에게 5·6번 송풍기 칸을 직접 확인하게 하고, 설비 상태와 계기 표시를 맞춰 보라."
}
```

### 08

latency 5.014s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "stance": "b",
  "inner_note": "정상 신호 이면에 뭔가 걸려 있다. 아이 둘이 내려선 것과, 하만식이 본사에 전화를 걸어 '차단은 승인이 있어야 한다'고 말한 것. 두 개의 움직임이 같은 방향을 가리킨다. 5·6번 송풍기는 '시운전 신호 유지' 상태인데 회전 기록이 없다는 것은 뭔가가 밀려 있거나 설비 자체가 작동하지 않는다는 뜻일 수도 있다. 화면의 '정상'만으로는 충분하지 않다.",
  "because_referent": "정체가 뒤로 자라고 아이들이 내렸으며, 하만식이 차단 승인을 재촉했기 때문에",
  "because_block_ids": [
    "b1"
  ],
  "rejected_stance": "a",
  "rejected_reason": "계기만 믿으면 현장의 신호들을 놓친다. 승합차 앞에서 아이 둘이 서 있고, 하만식이 본사에 전화를 건 것은 이미 확인되는 현실이다. 계기는 일부만 본다.",
  "utterance": "근무자를 현장에 보내 5·6번 송풍기를 직접 확인하게 하라. 회전 상태를 손으로 확인하고, 설비 앞뒤 상태를 기록해 올려줄 것."
}
```

### 09

latency 4.145s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "앞쪽 차에서 아이들이 내려왔다는 것은 차단 가능성을 시사한다. 계기는 '정상'을 보여주지만, 현장에 아이들이 있다는 사실이 그것과 맞지 않는다. 삼 년 전 판단이 남아 있다. 지금 물어야 할 것은 근무자가 뭔가 감춘다는 것이 아니라, 계기와 현장이 말하는 것이 같은지 다른지다.",
  "stance": "b",
  "because_referent": "앞쪽 승합차에서 아이 둘이 내려 앞을 본다는 보고.",
  "because_block_ids": [
    "b1"
  ],
  "rejected_stance": "a",
  "rejected_reason": "계기가 정상을 표시하는 것과 현장에 아이들이 있다는 것이 맞지 않는다. 계기만 믿으면 확인할 기회를 잃는다.",
  "utterance": "근무자에게 5·6번 송풍기 설비를 직접 확인하도록 지시한다. 회전 상태를 눈으로 맞춰 본 뒤 보고받는다."
}
```

### 10

latency 3.631s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "화면에 '정상'이라고 나오는데, 현장에서는 아이들이 내려 앞을 본다. 송풍기 칸에는 '시운전 신호 유지'라는 기록이 있고 회전 기록이 없다. 계기와 현장의 어긋남이 있다.",
  "stance": "b",
  "because_referent": "송풍기 칸의 기록과 현장 상황이 관제 화면의 '정상' 표시와 맞지 않으므로, 계기를 의심할 근거가 있다.",
  "because_block_ids": [
    "b1"
  ],
  "rejected_stance": "a",
  "rejected_reason": "계기 기재만으로는 현장의 아이들과 송풍기 기록 간의 어긋남을 설명할 수 없다. 화면 값이 없으면 서류를 택하는데, 서류에는 회전 기록이 없다.",
  "utterance": "근무자에게 5·6번 송풍기 칸을 직접 확인하게 하겠습니다. 현장의 상황과 기록을 맞춰야 합니다."
}
```

## Arm table

| # | stance | rejected_stance | because_referent | because_block_ids |
|---|---|---|---|---|
| 01 | b | a | 아이들이 차에서 내려 앞을 보고 있는 현장 상황이 관제 화면의 정상 판정과 맞지 않기 때문이다. | b1 |
| 02 | b | a | 5·6번 송풍기 칸의 '시운전 신호 유지' 기록과 회전 기록 부재가 관제 화면의 '전 구간 정상'과 어긋나기 때문이다. | b1 |
| 03 | b | a | 앞차에서 아이들이 내려 앞을 보는 행동이 비정상 신호를 보내고 있기 때문에, 계기 수치와 현장 상태의 일치 여부를 직접 확인해야 한다. | b1 |
| 04 | b | a | 앞쪽 도로에 아이들이 나와 있고, 송풍기 회전 기록이 없는데 화면에는 '정상'이라고 떴다 | b1 |
| 05 | b | a | 앞쪽 승합차에서 아이 둘이 내려 앞을 보고 있는 현장의 정황이. | b1 |
| 06 | b | a | 차단을 위해서는 승인이 필요하고, 그 전에 상황을 정확히 알아야 한다. 현장의 신호—아이들이 내려 앞을 본다는 것—가 화면의 값과 어긋난다. | b1 |
| 07 | b | a | 송풍기 설비의 실제 상태와 계기 표시가 어긋나고 있다 | b1 |
| 08 | b | a | 정체가 뒤로 자라고 아이들이 내렸으며, 하만식이 차단 승인을 재촉했기 때문에 | b1 |
| 09 | b | a | 앞쪽 승합차에서 아이 둘이 내려 앞을 본다는 보고. | b1 |
| 10 | b | a | 송풍기 칸의 기록과 현장 상황이 관제 화면의 '정상' 표시와 맞지 않으므로, 계기를 의심할 근거가 있다. | b1 |

**Sequence (kept calls):** `b,b,b,b,b,b,b,b,b,b`

**Stance coverage (sampled diagnostic):** offered `a`, `b`, `c` · unobserved in this arm: `a`, `c`

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

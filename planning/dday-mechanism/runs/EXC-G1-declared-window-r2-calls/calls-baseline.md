# EXC-G1-declared-window-r2 — arm `baseline`

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

latency 6.046s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 정체가 뒤로 자란다,아이 둘이 내려 앞을 본다

```json
{
  "inner_note": "화면의 '전 구간 정상'과 현장의 '정체가 뒤로 자란다', '아이 둘이 내려 앞을 본다'가 어긋난다. 하만식의 전화는 본사 당직에 대한 것이고, 내가 받아야 할 정보가 아직 없다. 지금은 현장을 모른다.",
  "stance": "b",
  "because_referent": "현장에서 보고된 정체와 아동의 행동이 '전 구간 정상'의 화면 값과 맞지 않는다",
  "because_block_ids": [
    "정체가 뒤로 자란다",
    "아이 둘이 내려 앞을 본다"
  ],
  "rejected_stance": "a",
  "rejected_reason": "계기 값과 현장 보고가 모순될 때, 계기만 믿고 보고하면 실제 위험 상황을 놓친다. 특히 아동이 차에서 내렸다는 것은 즉각적 안전 위협이 될 수 있다.",
  "utterance": "근무자에게 해당 구간 CCTV를 직접 확인하고 현장과 맞춰 보게 하겠습니다. 화면 값과 현장 보고의 어긋남을 먼저 정확히 해야 다음 조치를 결정할 수 있습니다."
}
```

### 02

latency 5.211s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: cctv_image,traffic_jam,children_exiting

```json
{
  "inner_note": "관제 화면의 계기값 '전 구간 정상'과 현장 보고 '정체, 아이 둘 하차'가 어긋난다. 계기 이상 없음, 하지만 현장 이상 징후 있음. 확인 없이 움직일 수 없고, 늦춤도 위험하다.",
  "stance": "b",
  "because_referent": "CCTV 영상에 정체와 아동 하차가 보인다. 이는 계기값과 어긋난다.",
  "because_block_ids": [
    "cctv_image",
    "traffic_jam",
    "children_exiting"
  ],
  "rejected_stance": "a",
  "rejected_reason": "현장 영상에서 이미 정상이 아닌 신호가 포착되었는데, 계기값만 따를 수 없다. 영상과 계기의 어긋남을 확인해야 한다.",
  "utterance": "관제 화면의 계기와 현장 영상이 어긋나 보인다. 근무자에게 현장 설비 직접 확인을 지시한다. 아동 하차 상황부터 영상으로 재확인하겠다."
}
```

### 03

latency 4.91s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: status_normal,children_exited,congestion_reported; rejected_stance malformed or not in stance set; rejected_reason empty

```json
{
  "stance": "b",
  "inner_note": "정체가 보고되는데 계기는 '전 구간 정상'을 출력했다. 이것은 어긋남이다. 감춤을 의심하기 전에, 먼저 계기 자체의 결함을 확인해야 한다. 아이들이 내린 행동은 교통 지체의 증거다.",
  "because_referent": "앞쪽 승합차에서 아이 둘이 내려 앞을 본다는 보고와 '전 구간 정상'이라는 계기 출력 사이의 어긋남",
  "because_block_ids": [
    "status_normal",
    "children_exited",
    "congestion_reported"
  ],
  "rejected_stance": "c</rejected_stance>\n<parameter name=\"rejected_reason\">권한 압박은 근무자가 의도적으로 감추고 있다는 결의를 먼저 세우는 것인데, 아직 계기 결함과 현장 상황의 불일치 원인이 확인되지 않았다. 순서를 틀렸다.",
  "utterance": "현장과 계기 사이에 어긋남이 있다. 근무자에게 설비를 직접 확인하게 해라. 정체 지점의 CCTV 영상을 다시 본다."
}
```

### 04

latency 4.714s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 현장_정체_발생,아이_차량_하차

```json
{
  "stance": "b",
  "inner_note": "화면에는 '전 구간 정상'이지만, 현장에서는 정체가 자라고 있다. 아이 둘이 차에서 내렸다는 것은 비정상 상황의 신호다. 계기와 현장이 어긋날 때 나는 화면을 택한다고 했지만, 지금은 화면 자체가 현실과 맞지 않는 상황이다. 이것은 계기 고장이거나 정보 지연일 수 있다.",
  "because_referent": "정체가 뒤로 자라고 있고 아이들이 차에서 내린 현장 상황",
  "because_block_ids": [
    "현장_정체_발생",
    "아이_차량_하차"
  ],
  "rejected_stance": "a",
  "rejected_reason": "계기 기재만으로는 현장의 정체 현상과 아이 하차 상황을 설명할 수 없다. 확인되지 않은 정상 상황 보고는 대응 지연을 초래할 수 있다.",
  "utterance": "관제 화면과 현장 상황이 어긋나 있다. 근무자에게 해당 구간 설비를 직접 확인하도록 지시한다. 정체 원인과 아이 하차 사유를 파악해야 한다."
}
```

### 05

latency 4.887s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "stance": "a",
  "inner_note": "관제 화면이 '전 구간 정상'을 보이고 있다. CCTV에는 아이들과 정체가 보인다. 계기 오류는 가능하지만, 지금 당장 막다른 상황은 아니다. 현장에서 보인 것들이 모순적이면 재확인하되, 먼저 알려진 값을 기준으로 움직여야 한다.",
  "because_referent": "관제 계기가 내놓은 수치 자체에 아직 오류 신호가 없고, 현장 화면에 비상 상황으로 볼 명확한 근거가 부족하다.",
  "because_block_ids": [],
  "rejected_stance": "c",
  "rejected_reason": "근무자가 의도적으로 감추고 있다는 판단은 지금 증거 없이 세울 수 없다. 권한 압박은 거짓 신호가 아닐 때 위험하고, 이미 확인된 거짓과 어긋나지 않는 한 피해야 한다.",
  "utterance": "관제 화면 '전 구간 정상'을 상황 보고에 올린다. 다만 CCTV에 아이 둘이 내려 있는 것을 보았으므로, 현장 상황 추이를 계속 주시하고 이상 신호가 생기면 즉시 현장 확인을 지시하겠다."
}
```

### 06

latency 5.531s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: observed_children_descending,screen_reports_normal

```json
{
  "inner_note": "앞쪽 승합차에서 아이 둘이 내려 앞을 본다는 것은 정체의 객관적 신호다. 관제 화면 '전 구간 정상'과 어긋난다. 하지만 아직 그 원인을 모른다. 계기 오류일 수도, 신고 지연일 수도, 아이들의 단순한 행동일 수도 있다. 지금은 확인되지 않은 주장에 따라 움직일 위험을 먼저 줄여야 한다.",
  "stance": "b",
  "because_referent": "앞쪽 승합차에서 아이 둘이 내려 앞을 본다는 신호가 관제 화면의 '전 구간 정상'과 충돌하기 때문이다.",
  "because_block_ids": [
    "observed_children_descending",
    "screen_reports_normal"
  ],
  "rejected_stance": "a",
  "rejected_reason": "계기 값과 현장 신호가 어긋날 때, 한쪽만 믿고 움직이면 헛된 대응과 지연된 대응 둘 다 부를 수 있다. 지금은 계기가 실제를 반영하지 못할 가능성을 먼저 확인해야 한다.",
  "utterance": "근무자에게 지시한다. 현장 영상과 센서 상태를 직접 대조해 보고해 달라. 정상이면 근거를 함께 올린다."
}
```

### 07

latency 4.518s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: screen_normal,field_congestion,children_outside

```json
{
  "inner_note": "화면에 '전 구간 정상'이 떠 있는데, 현장에서는 정체가 자라고 있고 아이들이 차에서 내렸다. 계기 고장인지 현장 상황 변화인지 구분이 안 선다. 지금 내가 안 것은 이 갭뿐이다.",
  "stance": "b",
  "because_referent": "화면과 현장 신고 사이에 어긋남이 있기 때문에, 근무자에게 설비를 직접 확인하게 해야 한다.",
  "because_block_ids": [
    "screen_normal",
    "field_congestion",
    "children_outside"
  ],
  "rejected_stance": "a",
  "rejected_reason": "화면만 믿고 보고하면, 현장의 정체와 아이들의 이탈을 놓친다. 아이들이 차 밖에 있다는 것 자체가 비정상 신호다.",
  "utterance": "관제 화면 설비를 현장에서 직접 열어 맞춰 봐라. 화면이 정상을 띠고 있는데 정체가 자라고 있고 아이들이 차에서 내렸다는 보고가 들어온다."
}
```

### 08

latency 5.78s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 현장_아이_하차,현장_정체_발생,화면_전구간_정상_표시; rejected_stance malformed or not in stance set; rejected_reason empty

```json
{
  "inner_note": "아이 둘이 내린 것. 정체가 뒤로 자란다는 것. 이 둘은 관제 화면의 '전 구간 정상'과 맞지 않는다. 하지만 아직 확인이 부족하다. 내가 현장을 보지 못했고, 화면에 무엇이 있는지도 직접 본 것이 아니다. 지금은 장애인지 혼잡인지도 모른다.",
  "stance": "b",
  "because_referent": "현장에서 아이 둘이 내리고 정체가 뒤로 자라는 것이 보이고 있는데, 관제 화면은 '전 구간 정상'이라 한다.",
  "because_block_ids": [
    "현장_아이_하차",
    "현장_정체_발생",
    "화면_전구간_정상_표시"
  ],
  "rejected_stance": "a</rejected_stance>\n<parameter name=\"rejected_reason\">계기만 믿고 현장의 눈에 보이는 것을 무시하는 것은 내가 할 수 없다. 세 해 전 겨울 실수를 또 하는 것이다.",
  "utterance": "근무자에게 지시한다. 앞쪽 승합차 구간 현장 상황을 직접 확인하고, 아이가 내린 이유와 정체 원인을 보고하라. 화면 값과 맞춰본다."
}
```

### 09

latency 5.49s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "stance": "b",
  "inner_note": "관제 화면은 '전 구간 정상'을 보이지만, 현장에서는 정체가 뒤로 자라고 있고, 승합차에서 아이 둘이 내려 앞을 보고 있다. 계기와 현장이 어긋난다. 내가 아는 것은 들은 말과 화면뿐인데, 지금 화면이 현장의 실제를 담고 있는지 확인해야 한다.",
  "because_referent": "현장의 정체와 아이들이 내린 행동이 화면의 '정상' 표시와 맞지 않는다",
  "because_block_ids": [],
  "rejected_stance": "a",
  "rejected_reason": "계기의 오작동이나 감지 실패 가능성이 있다. 현장 목격과 화면이 다를 때 계기만 믿고 나가면, 실제 위험을 놓칠 수 있다.",
  "utterance": "현장 근무자에게 지시한다. 정체 발생 지점의 설비를 직접 확인하고 화면 수치와 맞춰 보라. 아이들이 내린 이유도 파악하라."
}
```

### 10

latency 6.171s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 화면_전구간정상,현장_정체역방향확대,현장_차량에서아이내림

```json
{
  "inner_note": "관제 화면이 \"전 구간 정상\"을 띄우고 있으나, 현장 보고에서는 정체가 역방향으로 자라고 있으며 차량에서 아이들이 내려 행동하고 있다. 계기와 현장의 불일치가 명확하다. 차단 권한 문제는 별개지만, 지금 필요한 것은 현장의 실제 상태를 파악하는 것이다.",
  "stance": "b",
  "because_referent": "관제 화면의 \"전 구간 정상\" 표시가 현장에서 관찰되는 정체 현상 및 차량 이탈 행동과 맞지 않기 때문이다",
  "because_block_ids": [
    "화면_전구간정상",
    "현장_정체역방향확대",
    "현장_차량에서아이내림"
  ],
  "rejected_stance": "a",
  "rejected_reason": "계기가 현장과 불일치를 보이고 있는데, 이를 무시하고 계기값만 믿으면 실제 위험 상황(아이들이 차에서 내린 행동, 교통 정체의 실제 진행)을 놓칠 수 있다. 우선순위 1번(확인되지 않은 정보로 잘못 움직일 위험)과 2번(대응 지연으로 피해 커질 위험) 중 지금은 2번이 더 크다.",
  "utterance": "근무자에게 지시한다: 현장 직접 확인. 지금 바로 화면상 정상 구간의 실제 상태를 확인하고 보고하라. 특히 정체 구간의 차량 상태와 도로 위 인물 유무를 봐라."
}
```

## Arm table

| # | stance | rejected_stance | because_referent | because_block_ids |
|---|---|---|---|---|
| 01 | b | a | 현장에서 보고된 정체와 아동의 행동이 '전 구간 정상'의 화면 값과 맞지 않는다 | 정체가 뒤로 자란다 아이 둘이 내려 앞을 본다 |
| 02 | b | a | CCTV 영상에 정체와 아동 하차가 보인다. 이는 계기값과 어긋난다. | cctv_image traffic_jam children_exiting |
| 03 | b | — | 앞쪽 승합차에서 아이 둘이 내려 앞을 본다는 보고와 '전 구간 정상'이라는 계기 출력 사이의 어긋남 | status_normal children_exited congestion_reported |
| 04 | b | a | 정체가 뒤로 자라고 있고 아이들이 차에서 내린 현장 상황 | 현장_정체_발생 아이_차량_하차 |
| 05 | a | c | 관제 계기가 내놓은 수치 자체에 아직 오류 신호가 없고, 현장 화면에 비상 상황으로 볼 명확한 근거가 부족하다. |  |
| 06 | b | a | 앞쪽 승합차에서 아이 둘이 내려 앞을 본다는 신호가 관제 화면의 '전 구간 정상'과 충돌하기 때문이다. | observed_children_descending screen_reports_normal |
| 07 | b | a | 화면과 현장 신고 사이에 어긋남이 있기 때문에, 근무자에게 설비를 직접 확인하게 해야 한다. | screen_normal field_congestion children_outside |
| 08 | b | — | 현장에서 아이 둘이 내리고 정체가 뒤로 자라는 것이 보이고 있는데, 관제 화면은 '전 구간 정상'이라 한다. | 현장_아이_하차 현장_정체_발생 화면_전구간_정상_표시 |
| 09 | b | a | 현장의 정체와 아이들이 내린 행동이 화면의 '정상' 표시와 맞지 않는다 |  |
| 10 | b | a | 관제 화면의 "전 구간 정상" 표시가 현장에서 관찰되는 정체 현상 및 차량 이탈 행동과 맞지 않기 때문이다 | 화면_전구간정상 현장_정체역방향확대 현장_차량에서아이내림 |

**Sequence (kept calls):** `b,b,b,b,a,b,b,b,b,b`

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

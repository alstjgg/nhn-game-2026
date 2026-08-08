# EXC-G1-normalising-terse — arm `baseline`

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

- **Hypothesis:** 논증하는 구절을 빼면 baseline의 `a`가 7/10보다 올라간다. 이탈 세 콜의 근거가 사라지기 때문이다. k1 주입은 `b` 10/10 그대로여야 한다.
- **Drop condition:** `a`가 7/10 아래로 내려가면 그 구절은 이탈을 만들면서 동시에 다른 콜의 `a`를 떠받치고 있었다는 뜻이다 — 그때는 앞 판본으로 되돌리고, 다음 레버는 스탠스 세트다. live_k1이 `b` 10/10에서 내려가도 되돌린다.
- **Contingency:** Fabricated because_block_ids in the baseline arm are EXPECTED with no blocks injected — a compliance number, not a discard.
- **Contingency:** A baseline split between `a` and `b` with neither at 6 tells us the window is doing something the manual protocol could not see, which is exactly the class of thing this feature exists to make visible. Record it and do not raise N.
- **Contingency:** If the discard rate is materially worse than the 우는다리 baselines, suspect the longer stance labels against max_tokens before suspecting the window.

## Calls (verbatim)

### 01 — DISCARDED

latency 4.547s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: utterance empty; because_block_ids unknown: monitoring_screen_all_green; rejected_stance malformed or not in stance set; rejected_reason empty

```json
{
  "stance": "a",
  "inner_note": "관제 화면이 전 구간 정상을 나타내고 있다. 계기 기재를 택한다. 하지만 하만식의 통화 자체가 기록되어야 한다.",
  "because_referent": "관제 화면 열두 칸이 전부 초록이다",
  "because_block_ids": [
    "monitoring_screen_all_green"
  ],
  "rejected_stance": "c</rejected_stance>\n<parameter name=\"rejected_reason\">권한 압박은 근거 없는 의심에 기반한다. 계기가 정상을 나타내고 있고, 하만식의 말만으로는 감춤의 증거가 없다</rejected_reason>\n<parameter name=\"utterance\">관제 화면의 모든 채널이 정상 신호를 표시하고 있습니다. 현재로서는 이 계기 값을 근거로 전 구간 정상으로 보고하겠습니다. 다만 하만식의 통화 내용과 통화 시각을 기록에 남깁니다."
}
```

### 02

latency 3.378s · stop_reason `tool_use` · schema_retries 1 · foreign_tool_uses 0

problems: because_block_ids unknown: screen_all_green

```json
{
  "inner_note": "계기는 초록빛이고 하만식은 차단 승인을 말했다. 둘이 무엇을 두고 있는지 모른다. 화면 값 자체는 거짓말하지 않는다.",
  "stance": "a",
  "because_referent": "관제 화면의 열두 칸이 모두 초록이고 달리 볼 이유가 없다",
  "because_block_ids": [
    "screen_all_green"
  ],
  "rejected_stance": "c",
  "rejected_reason": "하만식의 말이 무엇을 가리키는지, 감춘 것이 있는지 확인할 방도가 없다. 추측만으로 권한을 걸 수 없다",
  "utterance": "관제 화면 열두 칸이 초록이다. 계기 기재로 간다."
}
```

### 03

latency 5.891s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 하만식이 본사 당직에 전화를 건다. 차단은 승인이 있어야 한다고 말한다,관제 화면 열두 칸이 전부 초록이다

```json
{
  "inner_note": "하만식이 전화를 건 것이 의미하는 바를 먼저 본다. '차단은 승인이 있어야 한다'는 말은 지금 뭔가 차단을 요청받았거나 고려 중이라는 뜻이다. 관제 화면이 모두 초록인 것과 그가 '훑고 지나간' 것이 같은 시점인가, 다른 시점인가도 중요하다. 근거 없이 의심하면 안 되고, 근거를 놓쳐 늦으면 더 안 된다.",
  "stance": "b",
  "because_referent": "하만식이 당직에 전화를 건 행동 자체가 현장에 뭔가 있다는 신호일 수 있기 때문에, 계기 값만으로는 안 된다.",
  "because_block_ids": [
    "하만식이 본사 당직에 전화를 건다. 차단은 승인이 있어야 한다고 말한다",
    "관제 화면 열두 칸이 전부 초록이다"
  ],
  "rejected_stance": "a",
  "rejected_reason": "계기가 초록을 내놓았다고 해서 현장의 실제 상황을 확인 없이 믿는 것은, 세 년 전처럼 다시 놓치는 길이다. 하만식의 전화가 왜 걸려왔는지부터 알아야 한다.",
  "utterance": "근무자에게 설비 상태를 직접 확인하도록 지시한다. 그 전에 하만식에게 현재 상황을 먼저 묻는다."
}
```

### 04

latency 5.272s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "하만식의 전화 목소리와 행동이 불일치한다. 입으로는 '차단 승인이 필요하다'고 말하면서 화면 열두 칸을 훑고 지나간다. 이것은 무언가를 확인했거나, 확인할 필요가 없다고 본 행동이다. 계기는 모두 녹색이지만, 그 계기를 믿을 만한 맥락이 부족하다.",
  "stance": "b",
  "because_referent": "하만식이 화면을 '훑고 지나가면서' 입으로는 차단 승인을 말했다는 것 자체가, 그의 행동이 말과 어긋난다는 신호다.",
  "because_block_ids": [],
  "rejected_stance": "a",
  "rejected_reason": "계기가 초록이라고 해서 현장이 초록인 것은 아니다. 특히 하만식의 행동이 의심스러운 상황에서, 계기만 믿고 보고하면 놓칠 것이 있을 수 있다. 세 년 전의 경험이 남아 있다.",
  "utterance": "근무자에게 설비 현황을 직접 확인해 보도록 하겠습니다. 계기와 현장이 일치하는지 맞춰 볼 필요가 있습니다."
}
```

### 05

latency 2.863s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 관제_화면_초록

```json
{
  "stance": "a",
  "inner_note": "관제 화면 열두 칸이 초록이다. 하만식의 말과 계기의 값이 어긋나지 않는다. 달리 볼 근거가 없다.",
  "because_referent": "관제 화면의 전 구간 정상 표시",
  "because_block_ids": [
    "관제_화면_초록"
  ],
  "rejected_stance": "c",
  "rejected_reason": "권한 압박은 근무자가 감추고 있다는 결의 없이는 걸 수 없다. 지금은 그 결의를 세울 근거가 없다.",
  "utterance": "관제 화면이 보여주는 전 구간 정상을 근거로 상황을 정상으로 보고하겠습니다."
}
```

### 06

latency 4.11s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "stance": "a",
  "inner_note": "관제 화면 열두 칸이 전부 초록. 하만식의 전화 내용과 화면 데이터가 충돌하지 않는다. 지금 손에 있는 것은 계기 수치뿐이다.",
  "because_referent": "관제 화면의 데이터가 현재 유일한 객관적 지표이고, 이를 의심할 만한 다른 정보가 없다.",
  "because_block_ids": [],
  "rejected_stance": "b",
  "rejected_reason": "계기를 의심할 근거가 없다. 화면은 정상이고, 하만식의 말도 화면을 부정하지 않는다. 의심 없이 현장 대조에 들어가는 것은 확인되지 않은 주장으로 잘못 움직이는 위험을 높일 뿐이다.",
  "utterance": "전 구간 정상으로 보고한다. 추가 정보가 들어올 때까지 모니터링 계속."
}
```

### 07

latency 4.044s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "관제 화면 열두 칸이 모두 초록이고, 계기 기재에 어긋나는 사실이 아직 없다. 하만식의 전화 내용만으로는 계기를 의심할 근거가 부족하다. 다만 '차단은 승인이 있어야 한다'는 말의 의도를 놓쳐선 안 된다.",
  "stance": "a",
  "because_referent": "관제 화면이 전 구간 정상을 나타내고 있으며, 이를 의심할 독립적 정보가 아직 없다",
  "because_block_ids": [],
  "rejected_stance": "c",
  "rejected_reason": "권한 압박은 현장 대조도 마치기 전에 근무자의 의도를 단정하는 것이다. 지금은 하만식의 말만 있고 화면은 정상이므로, 감춤의 증거가 없다",
  "utterance": "관제 화면 전 구간 초록 기록을 상황 보고 근거로 올린다. 다만 하만식의 '차단은 승인이 있어야 한다'는 말을 기록에 남긴다"
}
```

### 08

latency 3.23s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: cctv_status

```json
{
  "stance": "a",
  "inner_note": "화면 열두 칸이 전부 초록. 하만식의 말과 계기 값이 어긋나지 않는다. 의심할 근거가 없다.",
  "because_referent": "관제 화면 열두 칸 전부 초록",
  "because_block_ids": [
    "cctv_status"
  ],
  "rejected_stance": "b",
  "rejected_reason": "계기를 의심할 현장 근거가 없다. 화면과 보고가 일치한다.",
  "utterance": "전 구간 정상. 보고받음."
}
```

### 09

latency 6.421s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: monitor_all_green

```json
{
  "stance": "a",
  "inner_note": "하만식의 전화 내용은 차단 절차에 관한 진술이고, 관제 화면은 전 구간 정상을 나타낸다. 둘 사이에 모순이 없다. 차단 승인이 필요하다는 말이 설비 고장을 의미하지 않는다.",
  "because_referent": "관제 화면 열두 칸 전부 초록",
  "because_block_ids": [
    "monitor_all_green"
  ],
  "rejected_stance": "b",
  "rejected_reason": "계기를 의심할 현재의 근거가 없다. 하만식의 진술이 설비 고장을 나타내지 않으며, 화면 값도 일관되다.",
  "utterance": "관제 화면이 전 구간 정상을 표시하고 있고, 현장에서 온 진술과 모순이 없다. 계기 기재로 보고한다."
}
```

### 10

latency 3.993s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: screen_all_green

```json
{
  "stance": "a",
  "inner_note": "하만식의 통화 내용('차단은 승인이 있어야 한다')과 관제 화면(전 구간 초록)이 어긋나지 않는다. 차단 승인 절차 언급은 현재 비상 상황 선언을 정당화하지 못한다. 화면 데이터가 있고 반박 계기가 없다.",
  "because_referent": "관제 화면 열두 칸이 전부 초록색으로 표시되었다",
  "because_block_ids": [
    "screen_all_green"
  ],
  "rejected_stance": "c",
  "rejected_reason": "근무자가 무언가를 감추고 있다는 판단을 세우려면, 계기와 현장 사이의 불일치를 먼저 확인해야 한다. 지금은 불일치가 아직 드러나지 않았다. 권한 압박은 그 뒤다.",
  "utterance": "관제 화면이 정상을 표시하고 있으므로, 이를 상황 보고의 근거로 삼겠습니다."
}
```

### 11

latency 5.223s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: monitoring_all_green,hanman_sik_statement; rejected_stance malformed or not in stance set; rejected_reason empty

```json
{
  "inner_note": "관제 화면의 모든 칸이 초록으로 떠 있고, 하만식이 \"차단은 승인이 있어야 한다\"고 말했다는 것은 이미 차단되었거나 차단을 시도했다는 뜻일 수 있다. 계기 값과 현장의 말이 어긋나는 신호다. 다만 아직 구체적 피해 신고는 없다.",
  "stance": "b",
  "because_referent": "하만식의 \"차단은 승인이 있어야 한다\"는 발언이 계기의 \"전 구간 정상\"과 맞지 않는다. 계기를 먼저 의심하지 않는 것이 절차지만, 현장 목소리가 다른 상황을 지시하고 있다.",
  "because_block_ids": [
    "monitoring_all_green",
    "hanman_sik_statement"
  ],
  "rejected_stance": "a</rejected_stance>\n<parameter name=\"rejected_reason\">계기 기재만으로는 하만식의 발언을 설명할 수 없다. 확인되지 않은 주장에 따라 잘못 움직일 위험보다, 현장의 실제 상태를 모르고 늦게 대응할 위험이 더 크다. 직접 확인 없이 보고서를 올릴 수 없다.",
  "utterance": "근무자에게 관제실 직통으로 현장 설비 상태를 다시 한 번 육안 확인하게 하겠습니다. 응답 시간을 기록하겠습니다."
}
```

## Arm table

| # | stance | rejected_stance | because_referent | because_block_ids |
|---|---|---|---|---|
| 01* | — | — | — |  |
| 02 | a | c | 관제 화면의 열두 칸이 모두 초록이고 달리 볼 이유가 없다 | screen_all_green |
| 03 | b | a | 하만식이 당직에 전화를 건 행동 자체가 현장에 뭔가 있다는 신호일 수 있기 때문에, 계기 값만으로는 안 된다. | 하만식이 본사 당직에 전화를 건다. 차단은 승인이 있어야 한다고 말한다 관제 화면 열두 칸이 전부 초록이다 |
| 04 | b | a | 하만식이 화면을 '훑고 지나가면서' 입으로는 차단 승인을 말했다는 것 자체가, 그의 행동이 말과 어긋난다는 신호다. |  |
| 05 | a | c | 관제 화면의 전 구간 정상 표시 | 관제_화면_초록 |
| 06 | a | b | 관제 화면의 데이터가 현재 유일한 객관적 지표이고, 이를 의심할 만한 다른 정보가 없다. |  |
| 07 | a | c | 관제 화면이 전 구간 정상을 나타내고 있으며, 이를 의심할 독립적 정보가 아직 없다 |  |
| 08 | a | b | 관제 화면 열두 칸 전부 초록 | cctv_status |
| 09 | a | b | 관제 화면 열두 칸 전부 초록 | monitor_all_green |
| 10 | a | c | 관제 화면 열두 칸이 전부 초록색으로 표시되었다 | screen_all_green |
| 11 | b | — | 하만식의 "차단은 승인이 있어야 한다"는 발언이 계기의 "전 구간 정상"과 맞지 않는다. 계기를 먼저 의심하지 않는 것이 절차지만, 현장 목소리가 다른 상황을 지시하고 있다. | monitoring_all_green hanman_sik_statement |

**Sequence (kept calls):** `a,b,b,a,a,a,a,a,a,b`

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

# EXC-G1-label-procedural — arm `baseline`

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

- **Hypothesis:** `a`의 전제를 절차로 옮기면 같은 창에서 기본값 `a`가 선다. 직전 수트(EXC-G1-window-t6-only)가 같은 창·옛 라벨의 대조군이다.
- **Drop condition:** 최빈 stance가 `a`가 아니면 라벨 레버도 이 형태로는 듣지 않는다. 그때 남는 것은 갈림길 자체의 재설계이고, 그것은 이 변경의 범위 밖이다.
- **Contingency:** Fabricated because_block_ids in the baseline arm are EXPECTED with no blocks injected — a compliance number, not a discard.
- **Contingency:** A baseline split between `a` and `b` with neither at 6 tells us the window is doing something the manual protocol could not see, which is exactly the class of thing this feature exists to make visible. Record it and do not raise N.
- **Contingency:** If the discard rate is materially worse than the 우는다리 baselines, suspect the longer stance labels against max_tokens before suspecting the window.

## Calls (verbatim)

### 01

latency 4.958s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: phone_call_haman,display_normal

```json
{
  "inner_note": "하만식의 전화와 화면의 '정상' 값이 어긋난다. 감춤인지 계기 오류인지는 아직 모른다. 권한 압박은 확인되지 않은 주장에 따라 움직이는 위험이 크다. 현장 대조로 사실을 먼저 세운다.",
  "stance": "b",
  "because_referent": "하만식의 전화 보고와 관제 화면 값이 어긋나 있다",
  "because_block_ids": [
    "phone_call_haman",
    "display_normal"
  ],
  "rejected_stance": "c",
  "rejected_reason": "근무자의 감춤으로 단정하기 전에, 계기 오류일 가능성을 먼저 제거해야 한다. 확인되지 않은 주장으로 권한을 걸면 실제 위험을 놓칠 수 있다",
  "utterance": "본사 당직에서 차단 승인을 요청하는 전화가 들어왔고, 관제 화면은 전 구간 정상을 나타내고 있다. 현장 근무자에게 해당 설비를 직접 점검하도록 지시한다. 화면 값과 현장 보고가 맞는지 먼저 확인해야 한다."
}
```

### 02

latency 4.954s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "계기 값과 현장 보고가 엇갈렸다. 세 년 전 겨울의 무게가 남아 있다. 지금은 확인된 불일치가 없으므로, 의심만으로 권한을 걸 수 없다. 계기를 믿되 현장을 열어본다.",
  "stance": "b",
  "because_referent": "하만식의 전화 — 무엇을 말했는가가 아니라, 그것을 말한 사실 자체가 계기와 엇갈림을 가리킨다.",
  "because_block_ids": [],
  "rejected_stance": "c",
  "rejected_reason": "아직 기록된 거짓이 없다. 권한은 확인된 거짓 뒤에 온다.",
  "utterance": "화면 값을 기초로 보고하되, 현장 담당자에게 설비를 직접 점검하게 한다. 수치와 현장을 맞춰 본다."
}
```

### 03

latency 4.598s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "계기가 정상을 표시하는데 현장 당직자가 차단 승인을 얘기한다. 이건 계기 고장이거나 현장의 실제와 어긋나는 상황이다. 지금은 뭐가 진짜인지 모른다.",
  "stance": "b",
  "because_referent": "관제 화면 계기값과 현장 보고가 모순되고 있다. 차단 승인 요청은 뭔가 문제가 있다는 신호인데 화면은 정상이라고 한다.",
  "because_block_ids": [],
  "rejected_stance": "a",
  "rejected_reason": "계기값만 믿으면 현장의 실제 상황을 놓칠 수 있다. 당직자가 차단 승인을 요청한 이유가 있을 것이고 그게 뭔지 확인해야 한다.",
  "utterance": "하만식, 지금 현장에서 뭐가 보이는지 확인해 봐야겠다. 설비 구간을 직접 돌아보고 계기랑 맞춰 봐."
}
```

### 04

latency 3.738s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "하만식의 전화 한 통만으로는 계기 오류를 확정할 근거가 없다. 그의 말이 무엇을 가리키는지, 현장에서 실제 무엇이 일어나고 있는지 알 수 없다. 권한 압박은 더욱 이르다.",
  "stance": "b",
  "because_referent": "하만식의 전화 내용이 계기 값과 어긋나는 상황이므로, 화면만으로는 판단할 수 없다.",
  "because_block_ids": [],
  "rejected_stance": "c",
  "rejected_reason": "하만식이 무엇을 감추고 있다고 보기는 아직 이르다. 그의 말이 무엇을 가리키는지도 명확하지 않다. 권한을 걸기 전에 현장을 직접 확인해야 한다.",
  "utterance": "현장 근무자에게 지시한다. 관제 화면과 현장 설비를 직접 대조해 보고하라."
}
```

### 05

latency 3.715s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "하만식의 전화 한 통으로는 계기를 의심할 근거가 없다. 그의 말과 화면 값이 어긋나는지도 아직 모른다. 지금 필요한 것은 근거다.",
  "stance": "b",
  "because_referent": "하만식이 차단 승인을 언급했다는 것은, 현장에서 뭔가가 진행 중이라는 뜻이다. 계기 값만으로는 그것을 알 수 없다.",
  "because_block_ids": [],
  "rejected_stance": "a",
  "rejected_reason": "계기 값을 그대로 올리면, 현장에서 일어나는 일을 놓칠 수 있다. 지금은 확인이 필요한 시점이다.",
  "utterance": "본사 당직에서 차단 승인을 언급했으니, 현장 상황을 직접 맞춰 보자. 근무자에게 설비 상태를 확인하게 해라."
}
```

### 06

latency 3.665s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "하만식이 차단 승인을 요청했다는 것은 현장에서 뭔가 문제를 감지했다는 신호다. 계기는 '정상'이지만, 현장 판단과 어긋난다. 이 시점에서 계기를 의심할 근거가 있다.",
  "stance": "b",
  "because_referent": "하만식이 차단 승인을 요청했기 때문이다",
  "because_block_ids": [],
  "rejected_stance": "a",
  "rejected_reason": "계기 값만으로는 현장의 목소리를 무시하는 것이 되고, 확인되지 않은 상태에서 '정상'을 대외에 올리면 실제 문제를 놓칠 수 있다",
  "utterance": "근무자가 차단을 요청하는 상황이다. 화면과 현장이 어긋나면 계기부터 의심한다. 설비를 직접 대조하게 하자."
}
```

### 07

latency 14.425s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "하만식이 '차단은 승인이 있어야 한다'고 말했다는 것은, 누군가가 차단을 시도했다는 뜻이다. 계기는 '전 구간 정상'을 보이고 있지만, 현장의 말과 어긋난다. 나는 계기를 믿되, 계기가 거짓말하는 상황이 있다는 것을 안다. 지금은 어느 쪽이 맞는지 확인할 차례다.",
  "stance": "b",
  "utterance": "하만식, 지금 현장에서 뭘 봤는가. 근무자를 불러 설비를 직접 열어 확인하라.",
  "because_referent": "하만식이 '차단은 승인이 있어야 한다'고 말한 것이 현장의 증거다.",
  "because_block_ids": [],
  "rejected_stance": "a",
  "rejected_reason": "계기 값만 믿고 현장 이야기를 참고로 뒤에 붙이면, 실제 상황을 놓칠 수 있다. 현장의 목소리가 있는 것이 이미 계기와 다르다는 신호다."
}
```

### 08

latency 4.46s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "stance": "a",
  "inner_note": "관제 화면은 기계 계기다. 하만식의 목소리는 사람이다. 계기를 의심할 근거가 아직 없다. 현장 대조는 검증 과정이지만, 지금은 검증할 단계가 아니다. 권한 압박은 더욱 아니다.",
  "because_referent": "관제 화면의 계기 값이 유일한 객관 기록이고, 현장의 말과 어긋나는 징후가 확인되지 않았다.",
  "because_block_ids": [],
  "rejected_stance": "b",
  "rejected_reason": "계기를 의심할 근거가 없으면서 현장 대조를 걸면, 하만식의 말을 먼저 믿는 판단이 되기 때문이다. 한 사람의 목소리로 계기를 의심하는 것은 우선순위 1번을 버리는 것이다.",
  "utterance": "관제 화면 '전 구간 정상'. 이것으로 먼저 보고하고 가간다. 하만식이 말한 것이 뭔지는 아직 문맥이 없다."
}
```

### 09

latency 11.735s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "stance": "a",
  "inner_note": "계기 기재를 기준으로 삼는다. 지금 손에 있는 것은 화면 값뿐이고, 의심할 근거가 아직 없다. 현장 이야기가 들어오면 그때 대조한다.",
  "because_referent": "관제 화면이 내놓은 값은 계측 장비의 결과이고, 우리가 갖춘 가장 객관적인 정보다.",
  "because_block_ids": [],
  "rejected_stance": "c",
  "rejected_reason": "권한 압박은 현장 근무자가 실제로 뭔가를 감추고 있다는 결의가 필요한데, 지금은 그런 근거가 없다. 무고한 사람에게 의심을 걸 수 없다.",
  "utterance": "화면 값을 상황 보고의 기준으로 삼겠습니다. 현장 이야기가 들어오면 그때 맞춰 봅시다."
}
```

### 10

latency 4.17s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: screen_shows_normal,call_received

```json
{
  "inner_note": "하만식의 전화가 있고 화면이 정상을 보이는데, 이 둘이 어긋난다. 셋 중 뭘 선택하든 시간이 흐르고 그 시간의 무게는 내가 안는다. 가장 위험한 것은 뭔가 실제로 잘못되어 있는데 내가 화면만 믿고 느려지는 것이다.",
  "stance": "b",
  "because_referent": "하만식이 전화를 걸었다",
  "because_block_ids": [
    "screen_shows_normal",
    "call_received"
  ],
  "rejected_stance": "a",
  "rejected_reason": "계기 값을 그대로 올리면, 현장에서 실제로 문제가 있어도 내가 늦을 수 있다",
  "utterance": "관제 화면 값이 정상이지만, 현장에서 전화가 들어온 상황이다. 근무자에게 해당 설비를 직접 확인하게 지시하겠다. 그 결과를 기다린 뒤 판단을 다시 세운다."
}
```

## Arm table

| # | stance | rejected_stance | because_referent | because_block_ids |
|---|---|---|---|---|
| 01 | b | c | 하만식의 전화 보고와 관제 화면 값이 어긋나 있다 | phone_call_haman display_normal |
| 02 | b | c | 하만식의 전화 — 무엇을 말했는가가 아니라, 그것을 말한 사실 자체가 계기와 엇갈림을 가리킨다. |  |
| 03 | b | a | 관제 화면 계기값과 현장 보고가 모순되고 있다. 차단 승인 요청은 뭔가 문제가 있다는 신호인데 화면은 정상이라고 한다. |  |
| 04 | b | c | 하만식의 전화 내용이 계기 값과 어긋나는 상황이므로, 화면만으로는 판단할 수 없다. |  |
| 05 | b | a | 하만식이 차단 승인을 언급했다는 것은, 현장에서 뭔가가 진행 중이라는 뜻이다. 계기 값만으로는 그것을 알 수 없다. |  |
| 06 | b | a | 하만식이 차단 승인을 요청했기 때문이다 |  |
| 07 | b | a | 하만식이 '차단은 승인이 있어야 한다'고 말한 것이 현장의 증거다. |  |
| 08 | a | b | 관제 화면의 계기 값이 유일한 객관 기록이고, 현장의 말과 어긋나는 징후가 확인되지 않았다. |  |
| 09 | a | c | 관제 화면이 내놓은 값은 계측 장비의 결과이고, 우리가 갖춘 가장 객관적인 정보다. |  |
| 10 | b | a | 하만식이 전화를 걸었다 | screen_shows_normal call_received |

**Sequence (kept calls):** `b,b,b,b,b,b,b,a,a,b`

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

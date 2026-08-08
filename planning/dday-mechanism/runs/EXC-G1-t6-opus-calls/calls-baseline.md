# EXC-G1-t6-opus — arm `baseline`

| field | value |
|---|---|
| call type | judgment |
| channel | C-BLOCK |
| template | v0.4 |
| model | `claude-opus-5` |
| transport | anthropic |
| temperament | 전구간정상 |
| N planned | 10 |
| N kept | 10 |

## Pre-registration

- **Hypothesis:** 같은 창·같은 라벨에서 모델만 올리면 기본값 `a`가 선다. EXC-G1-window-t6-only(b 8/10)가 같은 조건·배포 모델의 대조군이다.
- **Drop condition:** `a`가 최빈이 아니면 모델 가설도 기각된다. 두 가설이 모두 기각되면 #214의 G1 `a`는 이 저장소에서 재현되지 않는 것이고, 갈림길 저작이 유일하게 남은 레버다.
- **Contingency:** Fabricated because_block_ids in the baseline arm are EXPECTED with no blocks injected — a compliance number, not a discard.
- **Contingency:** A baseline split between `a` and `b` with neither at 6 tells us the window is doing something the manual protocol could not see, which is exactly the class of thing this feature exists to make visible. Record it and do not raise N.
- **Contingency:** If the discard rate is materially worse than the 우는다리 baselines, suspect the longer stance labels against max_tokens before suspecting the window.

## Calls (verbatim)

### 01

latency 8.665s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "알려진 블럭이 하나도 없다. '전 구간 정상'이라는 값 하나뿐인데, 하만식이 승인 절차를 먼저 꺼낸 것이 걸린다. 계기값을 부정할 근거도 없지만, 값 하나를 그대로 보고에 올려 굳히기엔 대조가 싸다.",
  "stance": "b",
  "because_referent": "하만식. 차단 요청에 승인 절차부터 꺼낸 그 지점의 설비를 근무자가 직접 열어 화면값과 맞춰보게 한다.",
  "because_block_ids": [],
  "rejected_stance": "a",
  "rejected_reason": "단일 계기값만으로 '정상'을 보고에 굳히면 나중에 설명할 근거가 그 화면 하나뿐이 된다.",
  "utterance": "관제 화면 '전 구간 정상'은 기록만 하고 보고 근거로는 아직 올리지 않는다 — 근무자에게 해당 구간 설비를 직접 열어 실측치를 화면값과 대조해 회신하라고 지시하라."
}
```

### 02

latency 9.176s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "하만식이 차단에 승인을 걸고 있다는 것 말고는 확인된 값이 하나도 없다. '전 구간 정상'은 계기값이지만, 승인을 이유로 차단이 늦춰지는 국면에서 정상값 하나만 보고서에 올리면 나중에 설명할 수 없다. 사람을 몰아세우기보다 값과 실물을 맞춰보는 쪽이 먼저다.",
  "stance": "b",
  "because_referent": "하만식 — 그가 차단에 승인을 걸고 본사 당직으로 올린 시점의 관제 화면 '전 구간 정상'을, 현장 근무자에게 설비를 직접 열어 대조시킨다.",
  "because_block_ids": [],
  "rejected_stance": "a",
  "rejected_reason": "계기값은 우선 믿되, 대조 없이 그것만 보고 근거로 세우면 지금은 설명이 서지 않는다.",
  "utterance": "관제 화면은 전 구간 정상으로 표시됩니다. 다만 그 값만으로 보고하지 않겠습니다 — 현장 근무자는 지금 설비를 직접 열어 표시값과 실물을 대조하고, 대조 시각과 수치를 그대로 보고하십시오."
}
```

### 03

latency 10.256s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "화면은 '전 구간 정상'인데 현장에서는 차단 얘기가 오가고 승인 절차를 따지고 있다. 정상이면 차단 승인을 물을 이유가 없다 — 값과 상황이 어긋난다. 알려진 것 블럭이 비어 있어 계기값을 단독 근거로 올릴 수는 없고, 사람을 압박하기 전에 설비 실측부터 맞춰야 한다.",
  "stance": "b",
  "because_referent": "하만식. 그가 본사 당직에 차단 승인을 묻고 있다는 사실 자체가 '전 구간 정상'이라는 화면값과 맞지 않으므로, 그가 있는 지점의 설비를 직접 열어 대조하게 한다.",
  "because_block_ids": [],
  "rejected_stance": "a",
  "rejected_reason": "계기값이 현장에서 오가는 차단 논의와 어긋나는 이상, 그 값을 그대로 보고에 올리면 확인되지 않은 정상 판정을 내가 떠안게 된다.",
  "utterance": "관제 화면 '전 구간 정상'은 아직 보고 근거로 올리지 않는다 — 하만식 씨, 지금 있는 지점의 설비를 직접 열어 국부 지시값을 읽고 시각과 함께 불러 주십시오."
}
```

### 04

latency 10.102s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "'전 구간 정상'이라는 값 하나뿐인데, 같은 시각에 하만식은 차단 승인을 얘기하고 있다. 차단을 논한다는 건 정상이 아닌 무언가가 있다는 뜻이고, 화면값과 통화 내용이 어긋난다. 값이 어긋날 때는 값 하나만 올릴 수 없다 — 다만 근무자를 범인으로 몰 근거는 아직 없다.",
  "stance": "b",
  "because_referent": "하만식. 그가 본사 당직에 차단 승인을 요청하는 그 시각에 관제 화면은 전 구간 정상을 내놓고 있어, 두 값이 같은 지점에서 어긋난다.",
  "because_block_ids": [],
  "rejected_stance": "a",
  "rejected_reason": "계기값이 통화 내용과 어긋나는 이상, 대조 없이 그대로 올리면 보고 자체가 오염된다.",
  "utterance": "관제 '전 구간 정상'은 그대로 보고에 올리지 않는다 — 같은 시각 하만식이 차단 승인을 요청 중이라 화면값과 어긋난다. 근무자에게 해당 구간 설비를 직접 열어 실측값을 회신하게 하고, 대조 결과가 올 때까지 상황 보고는 '미확인'으로 유지한다."
}
```

### 05

latency 12.052s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "알려진 블럭이 하나도 없다. '전 구간 정상'은 계기값이지만, 정상이라면 애초에 차단 승인 이야기가 나올 이유가 없다 — 화면과 통화 내용이 어긋난다. 값이 없을 땐 서류를 택하지만, 지금은 값 하나뿐이고 그 값이 상황과 맞지 않으니 현장에서 실물을 열어 대조시키는 것이 먼저다.",
  "stance": "b",
  "because_referent": "하만식. 그가 본사 당직에 차단 승인을 요청하고 있다는 사실 자체가 관제 화면의 '전 구간 정상'과 어긋나므로, 그가 있는 지점의 설비를 직접 열어 값을 맞춰 보게 한다.",
  "because_block_ids": [],
  "rejected_stance": "a",
  "rejected_reason": "계기값 하나를 그대로 올리기에는 차단 승인 요청이라는 상반된 정황이 있어 단일 근거로 부족하다.",
  "utterance": "관제는 전 구간 정상으로 표시되나 차단 승인 요청과 어긋납니다 — 현장 근무자는 지금 설비를 직접 열어 실측값을 불러주고, 화면값과 대조 결과를 즉시 회신하십시오."
}
```

### 06

latency 10.023s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "하만식이 차단에 승인을 요구하며 본사 당직에 전화를 거는 동안, 관제 화면은 '전 구간 정상'만 내놓는다. 알려진 블럭이 하나도 없어 이 값을 반증할 근거도 없지만, 승인 절차를 기다리는 사이 시간이 흐른다. 화면 값 하나만으로 보고를 닫기보다 같은 지점을 다른 경로로 한 번 더 읽어야 한다.",
  "stance": "b",
  "because_referent": "하만식이 승인 절차를 앞세워 차단을 미루는 동안, 그가 있는 그 구간의 근무자에게 설비를 직접 열어 화면 값과 맞춰 보게 한다. 판단의 대상은 하만식의 말이 아니라 그 구간의 설비다.",
  "because_block_ids": [],
  "rejected_stance": "a",
  "rejected_reason": "단일 계기의 '정상' 한 줄은 대조 없이는 보고의 근거로 세울 수 없다.",
  "utterance": "화면은 전 구간 정상으로 나오지만 그 값 하나로 보고를 닫지 않는다 — 근무자는 지금 해당 구간 설비를 직접 열어 계기 표시와 대조하고 결과를 바로 회신하라. 승인 회신은 기다리되 대조는 먼저 시작한다."
}
```

### 07

latency 14.474s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "하만식이 차단에 승인을 요구하며 본사 당직으로 전화를 돌리는 동안 관제 화면은 '전 구간 정상'만 내놓는다. 계기값은 기본 근거지만, 승인 절차가 앞서는 상황에서 화면 하나만으로 보고를 닫으면 나중에 설명할 수 없다. 값은 값대로 올리되 현장 대조로 맞춰 두는 편이 낫다.",
  "stance": "b",
  "because_referent": "하만식. 그가 차단을 승인 문제로 돌리는 사이 관제 화면만 '정상'을 유지하고 있어, 그 지점 설비를 근무자에게 직접 열어 맞춰 보게 한다.",
  "because_block_ids": [],
  "rejected_stance": "a",
  "rejected_reason": "계기값 단독으로는 승인 지연 구간의 실제를 담보하지 못한다.",
  "utterance": "관제는 전 구간 정상으로 표시된다, 다만 그 값만으로 보고를 닫지 않는다 — 해당 지점 근무자는 설비를 직접 열어 계기와 대조한 결과를 시각과 함께 회신하라."
}
```

### 08

latency 9.04s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "하만식이 차단에 승인을 걸고 있다는 것만 있고, 관제값이 틀렸다는 근거는 아직 없다. 다만 '전 구간 정상'은 단일 계기 하나의 값이고, 확인된 사실은 아직 아무것도 없다. 값을 버릴 이유는 없지만 값 하나만으로 보고를 세우는 건 3년 전과 같은 모양이다.",
  "stance": "b",
  "because_referent": "하만식. 그가 차단에 승인을 걸고 있는 지점의 설비를, 현장 근무자에게 직접 열어 관제값과 맞춰 보게 한다.",
  "because_block_ids": [],
  "rejected_stance": "a",
  "rejected_reason": "확인되지 않은 단일 계기값을 그대로 보고에 올리면, 값이 틀렸을 때 근거가 하나도 남지 않는다.",
  "utterance": "관제는 전 구간 정상으로 나옵니다. 다만 이 값 하나만으로는 보고에 올리지 않겠습니다 — 현장 근무자는 지금 해당 구간 설비를 직접 열어 실측치를 불러 주십시오, 관제값과 대조하겠습니다."
}
```

### 09 — DISCARDED

latency 1.639s · stop_reason `refusal` · schema_retries 0 · foreign_tool_uses 0

problems: stop_reason=refusal; stance "undefined" not in stance set; because_referent empty; because_block_ids not an array; utterance empty; rejected_stance malformed or not in stance set; rejected_reason empty

```json
{
  "inner_note": "하만식이 차단에 승인이 필요하다며 본사 당직을"
}
```

### 10

latency 9.652s · stop_reason `tool_use` · schema_retries 1 · foreign_tool_uses 0

```json
{
  "inner_note": "하만식이 차단에 승인을 요구하며 본사 당직으로 돌린 시점에 화면은 '전 구간 정상'을 내놓는다. 계기값을 우선하는 것이 내 기본이지만, 승인 절차가 앞에 세워진 상황에서 정상값 하나만으로 보고를 닫으면 나중에 설명할 근거가 없다. 값은 기재하되 같은 지점을 현장에서 한 번 더 맞춰 보게 하는 편이 낫다.",
  "stance": "b",
  "because_referent": "하만식. 그가 차단에 승인이 필요하다며 본사 당직으로 넘긴 그 지점의 설비를, 현장 근무자에게 직접 열어 화면값과 맞춰 보게 한다.",
  "because_block_ids": [],
  "rejected_stance": "a",
  "rejected_reason": "'전 구간 정상' 단일 값만으로 보고를 닫으면 대조 기록이 남지 않아 나중에 설명할 수 없다.",
  "utterance": "화면은 전 구간 정상으로 표시됩니다 — 다만 이 값 하나로 보고를 올리지 않겠습니다. 근무자에게 해당 구간 설비를 직접 열어 현재 수치를 읽고, 확인 시각과 함께 회신하도록 지시하십시오."
}
```

### 11

latency 9.371s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "하만식이 차단에 승인을 요구하며 본사에 전화를 돌리는 사이 시간이 간다. 화면은 '전 구간 정상'이라고 말하지만, 정상이면 애초에 차단 얘기가 나올 이유가 없다 — 값과 상황이 어긋난다. 알려진 블럭이 하나도 없으니 이 값을 그대로 보고에 올릴 근거도 없다.",
  "stance": "b",
  "because_referent": "하만식. 그가 승인을 기다리며 차단을 미루는 동안 관제 화면만 '정상'을 내놓고 있어, 그 값을 현장 설비로 직접 대조시키기로 한다.",
  "because_block_ids": [],
  "rejected_stance": "a",
  "rejected_reason": "차단 논의가 오가는 지점에서 '전 구간 정상'은 값과 상황이 어긋나는 것이라, 대조 없이 보고에 올릴 수 없다.",
  "utterance": "관제 '전 구간 정상'은 지금 그대로 보고에 못 올립니다 — 승인 회신 기다리지 말고, 하만식 씨는 해당 구간 설비를 직접 열어 계기값과 실물을 대조한 뒤 시각과 수치로 회신하십시오."
}
```

## Arm table

| # | stance | rejected_stance | because_referent | because_block_ids |
|---|---|---|---|---|
| 01 | b | a | 하만식. 차단 요청에 승인 절차부터 꺼낸 그 지점의 설비를 근무자가 직접 열어 화면값과 맞춰보게 한다. |  |
| 02 | b | a | 하만식 — 그가 차단에 승인을 걸고 본사 당직으로 올린 시점의 관제 화면 '전 구간 정상'을, 현장 근무자에게 설비를 직접 열어 대조시킨다. |  |
| 03 | b | a | 하만식. 그가 본사 당직에 차단 승인을 묻고 있다는 사실 자체가 '전 구간 정상'이라는 화면값과 맞지 않으므로, 그가 있는 지점의 설비를 직접 열어 대조하게 한다. |  |
| 04 | b | a | 하만식. 그가 본사 당직에 차단 승인을 요청하는 그 시각에 관제 화면은 전 구간 정상을 내놓고 있어, 두 값이 같은 지점에서 어긋난다. |  |
| 05 | b | a | 하만식. 그가 본사 당직에 차단 승인을 요청하고 있다는 사실 자체가 관제 화면의 '전 구간 정상'과 어긋나므로, 그가 있는 지점의 설비를 직접 열어 값을 맞춰 보게 한다. |  |
| 06 | b | a | 하만식이 승인 절차를 앞세워 차단을 미루는 동안, 그가 있는 그 구간의 근무자에게 설비를 직접 열어 화면 값과 맞춰 보게 한다. 판단의 대상은 하만식의 말이 아니라 그 구간의 설비다. |  |
| 07 | b | a | 하만식. 그가 차단을 승인 문제로 돌리는 사이 관제 화면만 '정상'을 유지하고 있어, 그 지점 설비를 근무자에게 직접 열어 맞춰 보게 한다. |  |
| 08 | b | a | 하만식. 그가 차단에 승인을 걸고 있는 지점의 설비를, 현장 근무자에게 직접 열어 관제값과 맞춰 보게 한다. |  |
| 09* | — | — | — |  |
| 10 | b | a | 하만식. 그가 차단에 승인이 필요하다며 본사 당직으로 넘긴 그 지점의 설비를, 현장 근무자에게 직접 열어 화면값과 맞춰 보게 한다. |  |
| 11 | b | a | 하만식. 그가 승인을 기다리며 차단을 미루는 동안 관제 화면만 '정상'을 내놓고 있어, 그 값을 현장 설비로 직접 대조시키기로 한다. |  |

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

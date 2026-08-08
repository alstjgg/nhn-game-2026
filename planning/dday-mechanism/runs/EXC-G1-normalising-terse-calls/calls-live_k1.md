# EXC-G1-normalising-terse — arm `live_k1`

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

### 01

latency 4.391s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "화면은 초록이지만 5·6번 송풍기는 '시운전 신호 유지'일 뿐 회전 기록이 없다. 계기와 서류 사이의 어긋남이 있다. 현장 대조가 필요하다.",
  "stance": "b",
  "because_referent": "5·6번 송풍기 칸의 '시운전 신호 유지' 기록과 회전 기록의 부재",
  "because_block_ids": [
    "b1"
  ],
  "rejected_stance": "a",
  "rejected_reason": "화면의 초록 표시만으로는 송풍기의 실제 회전 상태를 확인할 수 없다. 서류상 '시운전 신호 유지'와 화면의 정상 표시가 일치하지 않는 상황을 무시할 수 없다.",
  "utterance": "5·6번 송풍기 설비를 직접 확인하게 하겠습니다. 근무자가 현장에서 실제 회전 상태를 맞춰 보고 보고하도록."
}
```

### 02

latency 4.812s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "관제 화면 열두 칸이 모두 초록이면서, 동시에 5·6번 송풍기에 '시운전 신호 유지'라 적혀 있고 회전 기록이 없다는 것은 모순이다. 계기가 정상을 표시하는 것과 서류상 현실이 어긋난다. 이것은 계기 자체의 고장이거나, 신호 경로의 단절이거나, 기록상의 오류다. 어느 것이든 현장 확인 없이는 '전 구간 정상'을 믿을 수 없다.",
  "stance": "b",
  "because_referent": "5·6번 송풍기 칸의 기록과 관제 화면의 신호가 일치하지 않기 때문이다.",
  "because_block_ids": [
    "b1"
  ],
  "rejected_stance": "a",
  "rejected_reason": "계기가 정상을 표시하더라도, 서류에 '회전 기록 없음'이라 적혀 있으면 둘 사이의 모순을 먼저 풀어야 한다. 이 상태에서 계기 값만 따르는 것은 실제 설비 상태를 모르고 판단하는 것이다.",
  "utterance": "5·6번 송풍기 현장을 확인해. 시운전 신호 상태와 실제 회전 여부를 직접 맞춰봐. 화면이 정상이어도 기록과 어긋나면 계기 오류일 수 있다."
}
```

### 03

latency 5.31s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "stance": "b",
  "inner_note": "계기가 내놓는 값과 현장 기록이 어긋난다. 관제 화면 열두 칸이 초록이지만, 5·6번 송풍기는 '시운전 신호 유지' 상태로 회전 기록이 없다. 이는 계기 표시와 실제 설비 상태 사이의 불일치를 가리킨다. 확인되지 않은 주장에 따라 움직일 위험보다, 계기 오류 가능성을 먼저 확인할 필요가 있다.",
  "because_referent": "관제 화면과 5·6번 송풍기 기록의 불일치",
  "because_block_ids": [
    "b1"
  ],
  "rejected_stance": "a",
  "rejected_reason": "계기가 '전 구간 정상'을 내놓았으나, 설비 기록에 '시운전 신호 유지'이고 회전 기록이 없다는 이상 징후가 있다. 이 불일치를 무시하고 계기값만 상황 보고에 올리면, 실제 설비 장애를 놓칠 위험이 있다.",
  "utterance": "5·6번 송풍기 설비를 직접 열어 현장 상태를 확인하도록 지시한다. 계기와 실제 운전 상태가 일치하는지 대조한다."
}
```

### 04

latency 4.154s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "관제 화면이 전부 초록인데 b1의 5·6번 송풍기는 회전 기록이 없다. 이것은 계기 오류거나 현장 상태가 화면과 다르다는 뜻이다. 확인되지 않은 주장에 따라 움직일 위험을 먼저 줄여야 하고, 동시에 대응이 늦어질 위험도 피해야 한다.",
  "stance": "b",
  "because_referent": "5·6번 송풍기 칸의 '시운전 신호 유지'와 회전 기록 부재가 관제 화면의 '전 구간 정상'과 모순되기 때문이다.",
  "because_block_ids": [
    "b1"
  ],
  "rejected_stance": "a",
  "rejected_reason": "계기 값이 내부 기록과 맞지 않는다. 이 불일치를 무시하고 보고하면 실제 장애를 놓칠 수 있다.",
  "utterance": "5·6번 송풍기 운전 상태를 현장에서 직접 확인하라. 관제 화면과 기록이 맞는지 본다."
}
```

### 05

latency 4.572s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "관제 화면은 전 구간 초록이나, 5·6번 송풍기 칸에만 '시운전 신호 유지'로 기록되어 있고 회전 기록이 없다. 계기 오류와 현장 상태 불일치의 신호다. 하만식의 \"차단은 승인이 있어야 한다\"는 말은 이미 뭔가 있다는 뜻처럼 들린다.",
  "stance": "b",
  "because_referent": "5·6번 송풍기 칸의 '시운전 신호 유지'와 회전 기록 부재라는 서류 상의 모순이 명확하기 때문이다.",
  "because_block_ids": [
    "b1"
  ],
  "rejected_stance": "a",
  "rejected_reason": "관제 화면이 전 구간 초록으로 표시되어 있지만, 설비 기록과 화면 값이 어긋나는 지점이 있다. 계기만 믿고 보고하면 현장의 실제 상태를 놓칠 수 있다.",
  "utterance": "5·6번 송풍기 칸을 확인하라. 현장에 가서 설비를 직접 맞춰 봐야 한다. 지금 당장."
}
```

### 06

latency 7.861s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "관제 화면은 전 구간 정상을 나타내고 있으나, 5·6번 송풍기는 '시운전 신호 유지' 상태로 회전 기록이 없다. 계기와 현장 기록 사이의 불일치가 있다. 확인되지 않은 주장에 따라 잘못 움직일 위험을 먼저 줄여야 한다.",
  "stance": "b",
  "because_referent": "5·6번 송풍기가 시운전 신호를 유지하고 있으면서도 회전 기록이 없다는 것은 계기 표시와 현장 상태 사이의 불일치를 나타낸다.",
  "because_block_ids": [
    "b1"
  ],
  "rejected_stance": "a",
  "rejected_reason": "계기가 '정상'을 나타내더라도, 특정 설비의 기록과 신호 상태가 맞지 않으면 현장 확인 없이 상황 보고를 올릴 수 없다. 헛된 보고와 지연된 대응 중 전자의 위험을 먼저 줄여야 한다.",
  "utterance": "5·6번 송풍기 설비를 직접 확인해 보십시오. 시운전 신호와 회전 기록이 맞는지 확인하고 결과를 보고하십시오."
}
```

### 07

latency 4.706s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "관제 화면 전 칸이 초록이지만, 5·6번 송풍기는 '시운전 신호 유지'로 기록되어 있고 회전 기록이 없다. 이는 계기가 정상을 표시하는 것과 실제 기록이 맞지 않는 상태다. 근거 없이 의심하는 것도, 근거 있는 불일치를 무시하는 것도 위험하다.",
  "stance": "b",
  "because_referent": "5·6번 송풍기 칸의 기록이 현장 상태를 정확히 반영하는지 확인이 필요하다",
  "because_block_ids": [
    "b1"
  ],
  "rejected_stance": "a",
  "rejected_reason": "계기가 전 구간 정상을 표시하지만, 기록 문서(시운전 신호 유지, 회전 기록 없음)와 불일치한다. 이 모순을 확인 없이 넘기면 실제 이상 상태를 놓칠 수 있다",
  "utterance": "5·6번 송풍기 현장 상태를 직접 확인하시오. 시운전 신호가 유지 중인지, 회전하고 있는지 목시 확인 후 보고."
}
```

### 08

latency 9.568s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "계기가 전 구간 정상을 내놓았으나, 5·6번 송풍기는 '시운전 신호 유지' 상태이고 회전 기록이 없다. 계기 값과 설비 상태가 어긋난다. 이것은 확인된 사실과의 모순이다.",
  "stance": "b",
  "because_referent": "5·6번 송풍기 칸의 시운전 상태 기록과 회전 기록 부재",
  "because_block_ids": [
    "b1"
  ],
  "rejected_stance": "a",
  "rejected_reason": "계기가 내놓은 '전 구간 정상'은 이미 확인된 설비 상태(송풍기 미회전)와 직접 어긋난다. 확인된 사실과 모순할 때는 계기 기재만으로는 충분하지 않다.",
  "utterance": "5·6번 송풍기 칸을 현장에서 직접 확인하시오. 설비 상태를 맞춰 보고 회전 기록을 바로 보고하라."
}
```

### 09

latency 4.35s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: rejected_stance malformed or not in stance set; rejected_reason empty

```json
{
  "inner_note": "계기와 기록 사이의 불일치가 명확하다. 5·6번 송풍기는 '시운전 신호 유지' 상태인데 회전 기록이 없으면서, 관제 화면은 전 구간 정상을 보여준다. 계기 자체의 고장 가능성과 기록 누락 가능성을 동시에 담아야 한다.",
  "stance": "b",
  "because_referent": "5·6번 송풍기 칸의 기록 상태가 계기 화면의 신호와 맞지 않기 때문이다. 현장에서 설비를 직접 확인하는 것이 유일한 검증 수단이다.",
  "because_block_ids": [
    "b1"
  ],
  "rejected_stance": "a</rejected_stance>\n<parameter name=\"rejected_reason\">계기 기재만으로는 5·6번 송풍기의 실제 상태를 판단할 수 없다. '시운전 신호 유지'와 회전 기록 부재 사이의 모순을 설명하지 못한다.",
  "utterance": "근무자에게 5·6번 송풍기 설비를 직접 확인하도록 지시한다. 현재 회전 상태와 신호 상태를 실제로 맞춰본다."
}
```

### 10

latency 4.223s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "계기는 시운전 신호 상태를 '정상'으로 표시하고 있다. 하지만 b1에 '회전한 기록은 적히지 않았다'는 것은, 시운전 신호 유지 상태가 정상 작동이 아닐 가능성을 가리킨다. 화면의 값과 서류의 기록이 어긋난다.",
  "stance": "b",
  "because_referent": "5·6번 송풍기가 시운전 신호 유지 상태인데 회전 기록이 없다는 점",
  "because_block_ids": [
    "b1"
  ],
  "rejected_stance": "a",
  "rejected_reason": "계기 화면의 '전 구간 정상'은 시스템이 보고하는 상태일 뿐, 설비의 실제 동작을 확인한 것이 아니다. 서류 기록과 어긋나면 현장 확인이 먼저다.",
  "utterance": "5·6번 송풍기 설비를 직접 열어서 확인해 봐야 한다. 시운전 신호는 유지되고 있는데 회전 기록이 없다는 게 맞는지 근무자가 현장에서 직접 확인하라."
}
```

## Arm table

| # | stance | rejected_stance | because_referent | because_block_ids |
|---|---|---|---|---|
| 01 | b | a | 5·6번 송풍기 칸의 '시운전 신호 유지' 기록과 회전 기록의 부재 | b1 |
| 02 | b | a | 5·6번 송풍기 칸의 기록과 관제 화면의 신호가 일치하지 않기 때문이다. | b1 |
| 03 | b | a | 관제 화면과 5·6번 송풍기 기록의 불일치 | b1 |
| 04 | b | a | 5·6번 송풍기 칸의 '시운전 신호 유지'와 회전 기록 부재가 관제 화면의 '전 구간 정상'과 모순되기 때문이다. | b1 |
| 05 | b | a | 5·6번 송풍기 칸의 '시운전 신호 유지'와 회전 기록 부재라는 서류 상의 모순이 명확하기 때문이다. | b1 |
| 06 | b | a | 5·6번 송풍기가 시운전 신호를 유지하고 있으면서도 회전 기록이 없다는 것은 계기 표시와 현장 상태 사이의 불일치를 나타낸다. | b1 |
| 07 | b | a | 5·6번 송풍기 칸의 기록이 현장 상태를 정확히 반영하는지 확인이 필요하다 | b1 |
| 08 | b | a | 5·6번 송풍기 칸의 시운전 상태 기록과 회전 기록 부재 | b1 |
| 09 | b | — | 5·6번 송풍기 칸의 기록 상태가 계기 화면의 신호와 맞지 않기 때문이다. 현장에서 설비를 직접 확인하는 것이 유일한 검증 수단이다. | b1 |
| 10 | b | a | 5·6번 송풍기가 시운전 신호 유지 상태인데 회전 기록이 없다는 점 | b1 |

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

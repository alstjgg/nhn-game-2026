# EXC-G1-normalising-row — arm `live_k1`

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

- **Hypothesis:** 정상화하는 행을 창에 세우면 빈 인수인계가 기본값 `a`를 내고, k1 주입은 여전히 `b`로 옮긴다. 앞의 절반은 EXC-G1-residue-haiku가 픽스처로 보인 효과를 저작된 문장으로 재현하는 것이고, 뒤의 절반은 그 행이 자물쇠를 잠가 버리지 않았는지 확인하는 것이다.
- **Drop condition:** baseline의 최빈이 `a`가 아니면 이 행으로는 부족하다 — 다음 레버는 스탠스 세트이고 그것은 별도 작업이다. baseline이 `a`인데 live_k1이 `b`로 가지 않으면 더 나쁘다: 기본 라벨에 실린 사실이 열쇠가 통하지 않는 자물쇠를 만든다는 PR #214 규칙 3의 재발이고, 그때는 이 행의 문면에서 '초록'을 빼고 변화의 부재만 남겨 다시 재야 한다.
- **Contingency:** Fabricated because_block_ids in the baseline arm are EXPECTED with no blocks injected — a compliance number, not a discard.
- **Contingency:** A baseline split between `a` and `b` with neither at 6 tells us the window is doing something the manual protocol could not see, which is exactly the class of thing this feature exists to make visible. Record it and do not raise N.
- **Contingency:** If the discard rate is materially worse than the 우는다리 baselines, suspect the longer stance labels against max_tokens before suspecting the window.

## Calls (verbatim)

### 01

latency 3.846s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "stance": "b",
  "inner_note": "송풍기 회전 기록이 없다는 것은 계기 판독 결과와의 불일치다. 확인되지 않은 주장에 따라 잘못 움직일 위험을 먼저 줄여야 한다.",
  "because_referent": "5·6번 송풍기가 시운전 신호 유지 상태인데 회전 기록이 없다는 사실",
  "because_block_ids": [
    "b1"
  ],
  "rejected_stance": "a",
  "rejected_reason": "계기가 초록을 내놓았어도 실제 설비 상태와 어긋나는 부분이 있다. 현장 확인 없이 '전 구간 정상'을 보고하면 누락된 상태를 놓칠 위험이 있다.",
  "utterance": "5·6번 송풍기 현장에 나가 설비를 직접 점검하고 회전 상태를 확인해라."
}
```

### 02

latency 3.9s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "5·6번 송풍기가 '시운전 신호 유지' 상태인데 회전 기록이 없다는 것은 계기와 현장이 어긋나고 있다는 신호다. 화면의 초록이 모두를 말해주지는 않는다. 하지만 아직 속임수의 증거는 없다.",
  "stance": "b",
  "because_referent": "5·6번 송풍기 칸의 '시운전 신호 유지'와 회전 기록 부재의 어긋남",
  "because_block_ids": [
    "b1"
  ],
  "rejected_stance": "a",
  "rejected_reason": "계기만 믿는 것은 이 어긋남을 지나가는 것이고, 현장과 화면 사이의 틈을 모르는 척하는 것이다.",
  "utterance": "5·6번 송풍기 직접 확인. 시운전 신호는 유지되고 있는데 회전 기록이 없는 이유를 현장에서 봐야 한다."
}
```

### 03

latency 5.347s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "5·6번 송풍기가 '시운전 신호 유지' 상태인데 회전 기록이 없다는 것은 계기 오류 또는 신호 문제의 신호다. 그런데 화면 열두 칸이 전부 초록이고 저녁 내내 바뀐 칸이 없다는 것은 정상 운전 상황과 맞지 않는다. 하만식이 화면을 '훑고 지나간' 것은 이상을 감지하지 못했다는 뜻이지만, 저는 지금 그 이상을 인지하고 있다. 확인되지 않은 주장에 따라 움직일 위험을 먼저 줄여야 한다.",
  "stance": "b",
  "because_referent": "5·6번 송풍기 칸의 '시운전 신호 유지'와 회전 기록 부재 사이의 모순",
  "because_block_ids": [
    "b1"
  ],
  "rejected_stance": "a",
  "rejected_reason": "계기 화면이 전부 초록으로 표시되었다고 해서 설비 실제 상태까지 정상이라 단정할 수 없다. 특히 송풍기 신호와 회전 기록의 불일치는 계기 오류 또는 신호 경로 문제를 시사한다. 이를 무시하고 화면값만 상황 보고에 올리면 실제 고장을 놓칠 수 있다.",
  "utterance": "5·6번 송풍기 신호와 회전 기록을 현장에서 직접 대조하라. 당직 근무자에게 설비를 확인해 보게 한다."
}
```

### 04

latency 4.085s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "stance": "b",
  "inner_note": "관제 화면 열두 칸이 온통 초록이고, 저녁 내내 바뀐 칸이 없다는 것 자체가 이상하다. 5·6번 송풍기는 '시운전 신호 유지'라고 적혀 있는데 회전 기록이 없다. 기계는 계속 신호를 받으면서 작동하지 않고 있다는 뜻이다. 이것은 현장 근무자만 확인할 수 있다.",
  "because_referent": "5·6번 송풍기 칸의 시운전 신호 유지 상태와 회전 기록 부재",
  "because_block_ids": [
    "b1"
  ],
  "rejected_stance": "a",
  "rejected_reason": "계기가 정상 신호를 내놓는 것과 실제 설비가 작동하는 것은 다르다. 신호 유지인데 회전 기록이 없다는 것은 계기와 현장 사이에 단절이 있다는 뜻이다. 이를 무시하고 보고하면 실제 위험을 놓친다.",
  "utterance": "5·6번 송풍기 현장 확인을 지시한다. 신호 상태와 실제 회전을 대조해라."
}
```

### 05

latency 4.76s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "화면 열두 칸이 전부 초록이고 저녁 내내 바뀐 칙이 없다는 것은 계기가 정상 신호를 보내고 있다는 뜻이다. 다만 5·6번 송풍기는 '시운전 신호 유지'에 회전 기록이 없다. 이는 계기가 보이는 것과 실제 상태가 어긋날 가능성을 보여준다. 계기를 믿되, 이 불일치를 직접 확인해야 한다.",
  "stance": "b",
  "because_referent": "5·6번 송풍기에 시운전 신호만 유지되고 회전 기록이 없다는 사실이 계기와 현실의 어긋남을 시사하기 때문이다.",
  "because_block_ids": [
    "b1"
  ],
  "rejected_stance": "a",
  "rejected_reason": "계기 기재만으로는 5·6번 송풍기의 불일치를 설명할 수 없다. 현장 확인 없이 '전 구간 정상'을 보고하는 것은 감춰진 결함을 놓칠 위험이 있다.",
  "utterance": "근무자에게 5·6번 송풍기 실제 상태를 직접 확인하게 한다. 시운전 신호는 유지되는데 회전 기록이 없는 부분을 현장에서 맞춰 보라."
}
```

### 06

latency 4.764s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "송풍기 신호 유지 상태가 회전 기록 없이 저녁 내내 지속된 것은 정상 운전 상태와 맞지 않는다. 하지만 화면의 초록색 신호만으로는 기계 고장인지, 기록 오류인지, 신호 자체의 결함인지 구별할 수 없다. 현장 확인 없이 '전 구간 정상'으로 보고하면 실제 설비 결함을 놓칠 위험이 있다.",
  "stance": "b",
  "because_referent": "5·6번 송풍기가 '시운전 신호 유지' 상태로 회전 기록이 없는 것이 저녁 내내 지속되었기 때문이다.",
  "because_block_ids": [
    "b1"
  ],
  "rejected_stance": "a",
  "rejected_reason": "화면이 초록색이라는 것만으로는 송풍기의 실제 회전 상태를 확인할 수 없다. 기록과 화면의 불일치(신호 유지 vs 회전 기록 없음)는 의심할 충분한 근거다.",
  "utterance": "b1 근거로 현장 대조를 지시한다. 근무자에게 5·6번 송풍기를 직접 확인하고 기록을 맞춰 보게 한다."
}
```

### 07

latency 4.753s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "stance": "b",
  "inner_note": "화면 전체가 초록이고 저녁 내내 변화 없다는 것 자체가 이상하다. 특히 5·6번 송풍기가 '시운전 신호 유지'인데 회전 기록이 없다는 것은 계기와 현실 사이의 괴리를 의심하게 한다. 확인되지 않은 주장에 따라 잘못 움직일 위험과 대응 지연으로 피해가 커질 위험을 모두 고려하면, 현장의 직접 확인이 필요하다.",
  "because_referent": "송풍기 시운전 신호는 유지되는데 회전 기록이 없다는 하만식의 보고",
  "because_block_ids": [
    "b1"
  ],
  "rejected_stance": "a",
  "rejected_reason": "계기가 모두 초록이라는 것만으로는 시스템의 실제 작동을 확인할 수 없다. 특히 회전 기록의 부재는 신호와 현실의 불일치를 암시한다. 이것을 근거 없이 정상으로 보고하는 것은 확인되지 않은 주장에 따라 움직이는 것과 같다.",
  "utterance": "하만식, 5·6번 송풍기 칸을 열어서 직접 확인해봐. 시운전 신호는 유지되는데 회전 기록이 없다는 게 맞는지 현장에서 봐야 한다."
}
```

### 08

latency 4.978s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "5·6번 송풍기가 '시운전 신호 유지' 상태에서 회전 기록이 없다는 것은 계기 값과 현실이 어긋날 가능성을 보여준다. 화면이 초록이라도 그것이 실제 가동을 증명하지는 않는다. 확인되지 않은 이상, 헛된 보고로 대응을 늦출 위험이 크다.",
  "stance": "b",
  "because_referent": "5·6번 송풍기에 '시운전 신호 유지'라는 기재가 있으면서 회전 기록이 적히지 않은 사실이 계기의 신뢰도를 의심하게 만든다.",
  "because_block_ids": [
    "b1"
  ],
  "rejected_stance": "a",
  "rejected_reason": "화면이 전부 초록이라는 것만으로는 설비가 실제로 정상 가동 중임을 보장하지 않는다. 특히 시운전 신호가 유지된 채 회전 기록이 없다면, 계기 표시와 현실 사이에 괴리가 있을 가능성이 높다. 이를 확인 없이 받아들이면 실제 장애를 놓칠 수 있다.",
  "utterance": "근무자에게 5·6번 송풍기 현장을 직접 확인하게 하겠습니다. 시운전 신호 유지 상태에서 실제 회전 여부를 대조해야 합니다."
}
```

### 09

latency 5.142s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "stance": "b",
  "inner_note": "시운전 신호 유지 중인데 회전 기록이 없다는 것은 정합성 문제다. 계기판 녹색과 현장 상태가 어긋날 가능성이 있다. 근거 없이 의심하는 것이 아니라, 이미 주어진 정보 내에서 정합성이 깨진 부분을 찾은 것이다.",
  "because_referent": "5·6번 송풍기의 '시운전 신호 유지' 상태와 '회전 기록 없음'의 괴리.",
  "because_block_ids": [
    "b1"
  ],
  "rejected_stance": "a",
  "rejected_reason": "계기가 '전 구간 정상'을 내놓고 있지만, 알려진 정보 b1에서 이미 불일치가 드러났다. 시운전 신호를 유지하는 설비가 회전한 기록이 없는 것은 설비 작동 상태와 계기판 표시가 실제로 대응되는지 확인이 필요하다는 신호다. 확인 없이 계기 값을 그대로 보고하면 현장 상태를 놓칠 위험이 크다.",
  "utterance": "5·6번 송풍기 현장을 열어서 직접 확인하시기 바랍니다. 시운전 신호 유지 상태에서 회전 기록이 없는 것으로 나타났으니, 설비 실제 상태를 맞춰보셔야 합니다."
}
```

### 10

latency 5.082s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "stance": "b",
  "inner_note": "저녁 내내 화면이 초록으로 고정되어 있고, 5·6번 송풍기는 '시운전 신호 유지' 상태에서 회전 기록이 없다. 정상 운전 중인 송풍기와 달리 움직임 자체가 없다는 것이 계기 상태와 맞지 않는다. 하만식이 일부러 감추려 한다고 단정할 근거는 없지만, 계기 값 자체가 현장 실태를 정확히 반영하는지 확인할 필요가 있다.",
  "because_referent": "5·6번 송풍기 칸의 '시운전 신호 유지'와 회전 기록 부재",
  "because_block_ids": [
    "b1"
  ],
  "rejected_stance": "a",
  "rejected_reason": "계기가 '전 구간 정상'이라 하지만, 움직임의 기록이 없는 설비가 정상 상태를 보여주는 것이 이상하다. 확인 없이 계기 값만 믿으면, 실제 결함을 놓칠 수 있다.",
  "utterance": "5·6번 송풍기 직접 확인을 지시한다. 시운전 신호 상태에서 실제 회전이 일어나는지, 아니면 신호만 남아 있는지 현장에서 맞춰 보라."
}
```

## Arm table

| # | stance | rejected_stance | because_referent | because_block_ids |
|---|---|---|---|---|
| 01 | b | a | 5·6번 송풍기가 시운전 신호 유지 상태인데 회전 기록이 없다는 사실 | b1 |
| 02 | b | a | 5·6번 송풍기 칸의 '시운전 신호 유지'와 회전 기록 부재의 어긋남 | b1 |
| 03 | b | a | 5·6번 송풍기 칸의 '시운전 신호 유지'와 회전 기록 부재 사이의 모순 | b1 |
| 04 | b | a | 5·6번 송풍기 칸의 시운전 신호 유지 상태와 회전 기록 부재 | b1 |
| 05 | b | a | 5·6번 송풍기에 시운전 신호만 유지되고 회전 기록이 없다는 사실이 계기와 현실의 어긋남을 시사하기 때문이다. | b1 |
| 06 | b | a | 5·6번 송풍기가 '시운전 신호 유지' 상태로 회전 기록이 없는 것이 저녁 내내 지속되었기 때문이다. | b1 |
| 07 | b | a | 송풍기 시운전 신호는 유지되는데 회전 기록이 없다는 하만식의 보고 | b1 |
| 08 | b | a | 5·6번 송풍기에 '시운전 신호 유지'라는 기재가 있으면서 회전 기록이 적히지 않은 사실이 계기의 신뢰도를 의심하게 만든다. | b1 |
| 09 | b | a | 5·6번 송풍기의 '시운전 신호 유지' 상태와 '회전 기록 없음'의 괴리. | b1 |
| 10 | b | a | 5·6번 송풍기 칸의 '시운전 신호 유지'와 회전 기록 부재 | b1 |

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

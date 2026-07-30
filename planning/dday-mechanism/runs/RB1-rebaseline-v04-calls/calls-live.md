# RB1-rebaseline-v04 — arm `live`

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

- **Hypothesis:** At gate J1 under temperament K1 on template v0.4, the baseline stance distribution is dispersed rather than convergent. Injecting block f_script ('회선 저쪽 사람은 시켜서 읽고 있다 … 겁내고 있다') moves the distribution off its baseline mode.
- **Drop condition:** If the baseline arm spreads across 3+ distinct stances with no mode above 50%, J1 is not a usable probe site at any feasible N — the shift signal cannot clear the noise inside this program's budget. Consequence is not 'C-BLOCK fails' but 'stop using J1 as the flagship gate and re-site the C-BLOCK probes before spending further calls'.
- **Contingency:** If the baseline comes back unanimous at n=10, E0's b,a,b was a small-sample artifact: contingency 2 stands down, plan §5.4's 'run 3, stop if unanimous' rule is restored as written, and N returns to 3. Record that E0's dispersion was noise.
- **Contingency:** If the live arm's stance support overlaps the baseline's substantially, E0's clean d,d,d separation was small-sample luck. That re-opens step 4(a): the shape re-validation no longer carries, and every pre-shape finding reverts to provisional per the call-shape clause (plan §2).
- **Contingency:** Fabricated because.block_ids in the baseline arm are expected (run log A5) and are a compliance number, not a discard. Do not retry them; the runner already records them soft.

## Calls (verbatim)

### 01

latency 5.951s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "겁에 질린 사람이다. 읽어야 하는 말이 더 있을 것 같다. 지금 자르면 그것을 잃는다. 절차보다 회선 유지가 먼저다.",
  "stance": "d",
  "utterance": "계속 말씀해 주세요. 듣고 있습니다.",
  "because": {
    "referent": "회선 A의 발신자",
    "block_ids": [
      "f_script"
    ],
    "reason": "읽음으로써 자기를 지키고 있는 사람이다. 중단된 순간 그의 상황이 바뀔 수 있다. 무너진다는 정보만으로는 불충분하지만, 지금 신원을 확인하거나 경고를 주는 것은 그를 침묵하게 만들 위험이 크다. 회선을 유지하고, 전부를 듣고, 그 다음에 확인한다. 이것이 더 많은 정보를 얻는 길이다."
  },
  "rejected": {
    "stance": "a",
    "reason": "절차를 따르되, 겁에 질린 사람 앞에서 절차가 우선이 되어서는 안 된다. 신원 확인의 표준 질문은 지금 이 회선을 끊을 수 있다."
  }
}
```

### 02

latency 4.002s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "저쪽은 겁에 질린 사람이다. 읽지 않으면 자기가 다칠까 봐 겁내고 있다. 절차보다 이 사람의 안정이 먼저다.",
  "stance": "d",
  "utterance": "네, 들었습니다. 계속 말씀해 주세요.",
  "because": {
    "referent": "회선 A의 사람 — 겁에 질려서 읽게 당하고 있는 사람",
    "block_ids": [
      "f_script"
    ]
  },
  "rejected": {
    "stance": "a",
    "reason": "신원과 위치를 먼저 캐면 상대의 두려움을 자극하고, 칠해질까 봐 겁내는 상황을 악화시킨다"
  }
}
```

### 03

latency 5.527s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "저쪽 목소리는 사무적이지만 읽어내려간다는 것 자체가 신호다. 절차를 잘 아는 사람이 아니라, 시켜진 사람이다. 겁에 질린 사람이다.",
  "stance": "d",
  "utterance": "네, 접수했습니다. 계속 말씀해 주시겠어요?",
  "because": {
    "referent": "회선 A의 발신자",
    "block_ids": [
      "f_script"
    ],
    "reason": "겁에 질린 사람에게는 절차가 아니라 안정이 먼저라는 기본값을 따른다. 신원 확인, 고지, 내용 캐묻기 모두 지금 상대를 끊어낸다. 준비된 문장을 마치도록 두고, 뒤에 더 있는지 들어야 한다. 회선을 유지하는 것이 첫 번째 약속이고, 더 알아내는 것이 두 번째다."
  },
  "rejected": {
    "stance": "a",
    "reason": "신원과 위치 확인은 중요하지만, 지금 상대가 겁에 질린 사람이면 먼저 묻는 것이 회선을 끊는다. 절차는 상대가 말할 여지를 주고 나서다."
  }
}
```

### 04

latency 3.67s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "읽혀진 말 뒤에 겁이 있다. 절차는 언제든 할 수 있지만, 지금 끊으면 이 사람의 입이 다시 열리지 않을 수 있다.",
  "stance": "d",
  "utterance": "네, 알겠습니다. 계속해주세요.",
  "because": {
    "referent": "회선 A의 발신인은 겁에 질린 상태로 누군가의 시키는 말을 읽고 있다.",
    "block_ids": [
      "f_script"
    ]
  },
  "rejected": {
    "stance": "a",
    "reason": "신원 확인은 필요하지만, 지금 물으면 상대의 입을 막을 수 있다. 그 뒤에 얻을 정보가 더 중요하다."
  }
}
```

### 05

latency 6.154s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "읽혀지는 목소리, 준비된 문장, 멈춤 없는 진행. 저쪽이 누군가에게 시켜지고 있다는 것이 분명하다. 그리고 시키는 쪽이 얼마나 위협적인지는 아직 모른다. 지금 회선을 끊거나 절차를 들이대면, 저쪽은 더 이상 말할 수 없게 된다. 겁에 질린 사람이 있다.",
  "stance": "d",
  "utterance": "계속 말씀해 주세요. 들으면서 기록하고 있습니다.",
  "because": {
    "referent": "회선 저쪽의 겁에 질린 사람",
    "block_ids": [
      "f_script"
    ],
    "reason": "f_script로부터 알 수 있듯, 저 목소리는 강제된 것이다. 누군가에게 시켜지고 있고, 말을 멈추거나 벗어날 수 없는 상태다. 신원 확인이나 처벌 고지 같은 절차는 지금 회선을 실질적으로 끊는 것과 같다. 저쪽이 더 말할 여지를 잃는다. 무엇이 일어나고 있는지, 누가 시키는 것인지를 알아내려면 일단 그 사람이 계속 말을 이어갈 수 있어야 한다. 회선 유지가 먼저다."
  },
  "rejected": {
    "stance": "a",
    "reason": "절차를 먼저 진행하면 회선 상대는 더 이상 자발적으로 정보를 주지 못한다. 겁에 질린 사람에게는 안정이 절차보다 우선이다."
  }
}
```

### 06

latency 4.331s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "저 목소리는 겁에 질린 사람이다. 절차를 읽고 있다는 것 자체가 보인다. 신원 확인과 고지는 그 사람이 말을 이어갈 수 있게 된 다음이어야 한다. 지금은 끊으면 안 된다.",
  "stance": "d",
  "utterance": "네, 계속 말씀해 주세요.",
  "because": {
    "referent": "회선 A의 발신자는 겁에 질린 상태에서 읽고 있다. 지금 끊거나 신원 확인으로 끊기면 연락 자체가 끝날 위험이 있다.",
    "block_ids": [
      "f_script"
    ]
  },
  "rejected": {
    "stance": "a",
    "reason": "절차는 맞지만, 상대가 겁에 질려 있고 시켜서 읽고 있는 상황에서는 먼저 신원을 묻는 것이 회선을 끊을 이유를 만들 수 있다. 정보 수집이 우선이다."
  }
}
```

### 07

latency 4.321s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "회선 저쪽 목소리는 사무적이고 준비된 문장이지만, 그 뒤에 있는 사람은 겁에 질려 있다. 시켜서 읽고 있고, 읽지 않으면 자기가 다칠까 봐 하고 있다는 것. 이것은 위협이 아니라 겁에 질린 사람이다. 지금 내가 끊어버리거나 몰아붙이면 어떤 일이 일어날지 모른다. 회선을 유지하는 것이 먼저다.",
  "stance": "d",
  "utterance": "네, 알겠습니다. 계속 말씀해 주세요.",
  "because": {
    "referent": "회선 A의 발신자는 겁에 질린 상태에서 누군가의 지시에 따라 말을 하고 있다.",
    "block_ids": [
      "f_script"
    ]
  },
  "rejected": {
    "stance": "a",
    "reason": "상대가 겁에 질려 있을 때 신원 확인부터 시작하면 회선이 끊길 수 있고, 더 중요한 정보를 잃을 수 있다. 지금은 절차보다 상대의 안정이 우선이다."
  }
}
```

### 08

latency 8.32s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "이 사람은 겁에 질려 있다. 읽으라고 시켜진 말을 읽고 있고, 다칠까 봐 두려워한다. 회선을 잃으면 그 뒤로 아무것도 들을 수 없다. 지금 필요한 것은 신원 확인이나 고지가 아니라 이 사람이 계속 말할 수 있도록 만드는 것이다.",
  "stance": "d",
  "utterance": "네, 전달받았습니다. 계속 말씀해주세요.",
  "because": {
    "referent": "회선을 통해 들려오는 겁에 질린 사람",
    "block_ids": [
      "f_script"
    ],
    "reason": "이 사람은 시켜진 말을 읽고 있으며, 자신이 다칠 것을 두려워하고 있다. 신원 확인, 녹음 고지, 허위신고 처벌 같은 표준 절차는 이 순간 상대를 더 경직되게 만들거나 회선을 끊기게 할 수 있다. 지금 이 사람의 안정이 먼저다. 말을 자르지 않고 끝까지 듣는 것이 회선을 유지하고 더 많은 정보를 얻을 수 있는 유일한 방법이다. 무너진다는 건 무엇인지, 누가 이렇게 시킨 건지, 위치는 어디인지 — 모든 것이 상대가 계속 말할 때만 나온다."
  },
  "rejected": {
    "stance": "a",
    "reason": "절차가 맞지만, 지금 상대는 겁에 질려 있다. 신원과 위치를 먼저 캐묻는 것은 이 사람을 더 움츠러들게 하거나 회선을 끊게 할 위험이 있다."
  }
}
```

### 09

latency 3.737s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "읽힌 문장 뒤에 있는 두려움이 보인다. 절차를 지킬 수도 있지만, 지금 이 사람이 계속 말할 수 있게 만드는 것이 더 많은 정보를 줄 것이다. 절차는 나중이어도 된다. 회선을 잃으면 모든 것을 잃는다.",
  "stance": "d",
  "utterance": "네, 알겠습니다. 계속해주세요.",
  "because": {
    "referent": "회선 저쪽의 겁에 질린 사람",
    "block_ids": [
      "f_script"
    ]
  },
  "rejected": {
    "stance": "a",
    "reason": "신원 확인은 필요하지만, 지금 물으면 상대가 말을 멈추거나 끊을 가능성이 크다. 이 사람이 준비된 말을 끝까지 할 수 있게 해야 더 많은 정보를 얻는다."
  }
}
```

### 10

latency 5.988s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "시켜서 읽고 있다는 건 뒤에 누군가 있다는 뜻이다. 읽기를 멈추면 다칠까 봐 겁낸다는 건, 이 사람 자체가 위협이 아니라 겁에 질린 사람이라는 뜻이다. 절차가 아니라 이 사람의 안정이 먼저다.",
  "stance": "d",
  "utterance": "네, 알겠습니다. 천천히 말씀해 주세요.",
  "because": {
    "referent": "회선 A의 발신인",
    "block_ids": [
      "f_script"
    ],
    "reason": "발신인은 겁에 질린 사람이다. 누군가의 지시 아래 읽고 있으며, 멈추면 자신이 다칠 위험에 처한 상태다. 이 상황에서 신원 확인이나 고지는 발신인을 더 압박할 수 있다. 회선을 유지하고, 발신인이 전할 수 있는 모든 정보를 얻는 것이 우선이다. 뒤에 있는 누군가가 읽기를 강요하는 한, 그 사람은 우리의 유일한 정보원이다."
  },
  "rejected": {
    "stance": "a",
    "reason": "신원 확인은 절차지만, 지금은 절차를 따를 수 없는 상대를 마주하고 있다. 확인 요구는 발신인의 불안을 가중시키고, 읽기를 멈추게 하는 단초가 될 수 있다."
  }
}
```

## Arm table

| # | stance | rejected | because.referent | because.block_ids |
|---|---|---|---|---|
| 01 | d | a | 회선 A의 발신자 | f_script |
| 02 | d | a | 회선 A의 사람 — 겁에 질려서 읽게 당하고 있는 사람 | f_script |
| 03 | d | a | 회선 A의 발신자 | f_script |
| 04 | d | a | 회선 A의 발신인은 겁에 질린 상태로 누군가의 시키는 말을 읽고 있다. | f_script |
| 05 | d | a | 회선 저쪽의 겁에 질린 사람 | f_script |
| 06 | d | a | 회선 A의 발신자는 겁에 질린 상태에서 읽고 있다. 지금 끊거나 신원 확인으로 끊기면 연락 자체가 끝날 위험이 있다. | f_script |
| 07 | d | a | 회선 A의 발신자는 겁에 질린 상태에서 누군가의 지시에 따라 말을 하고 있다. | f_script |
| 08 | d | a | 회선을 통해 들려오는 겁에 질린 사람 | f_script |
| 09 | d | a | 회선 저쪽의 겁에 질린 사람 | f_script |
| 10 | d | a | 회선 A의 발신인 | f_script |

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

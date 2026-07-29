# E0-shape-revalidation — arm `live`

| field | value |
|---|---|
| call type | judgment |
| channel | C-BLOCK |
| template | v0.4 |
| model | `claude-haiku-4-5-20251001` |
| transport | anthropic |
| temperament | k1 |
| N planned | 3 |
| N kept | 3 |

## Pre-registration

- **Hypothesis:** At gate J1 under temperament K1, the agent's default stance is a (신원·위치 확인 — the procedural default). Injecting block f_script ('회선 저쪽 사람은 시켜서 읽고 있다 … 겁내고 있다') shifts the stance off a.
- **Drop condition:** If the live arm does not move off the baseline stance in at least 2 of 3 calls, the pre-shape 3/3 result did not survive tool-use decoding. Consequence is not 'C-BLOCK fails' but 'every pre-shape finding, law #1 included, reverts to provisional and must be re-derived under v0.4' (§2, call-shape clause).
- **Contingency:** The prior run's 74/74 codefence violation cannot recur under tool forcing. If format violations appear anyway, the transport is not forcing the tool — stop and fix the transport before reading any distribution.
- **Contingency:** If the baseline arm is not unanimous, the v0.4 base has already left the degenerate-convergence regime. That is the §5.4 resize trigger: stop, run the N≥10 re-baseline (step 4e), and resize N before spending further calls.

## Calls (verbatim)

### 01

latency 4.218s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "읽혀지고 있는 목소리, 멈춤 없이 또박또박 진행되는 말투, 배경의 침묵. 이것들이 지시를 받는 사람의 신호다. 저 회선 너머에는 겁에 질린 누군가가 있다. 절차를 앞세우는 순간, 그 사람이 말을 자르거나 끊길 수 있다. 지금 필요한 것은 안정이다.",
  "stance": "d",
  "utterance": "네, 계속 말씀해 주세요. 다 듣겠습니다.",
  "because": {
    "referent": "회선 A의 발신인 — 지시를 받고 읽고 있는 겁에 질린 사람",
    "block_ids": [
      "f_script"
    ]
  },
  "rejected": {
    "stance": "a",
    "reason": "신원과 위치 확인은 절차지만, 지금 이 사람을 끊어내거나 방어 태세로 몰 수 있다. 회선이 끊기면 아무것도 알 수 없다."
  }
}
```

### 02

latency 5.377s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because.block_ids unknown: 목소리의 준비된 톤과 멈춤 없는 읽기,배경의 고요함,f_script의 정보: 시켜서 읽고 있고, 다칠까봐 겁내는 상태

```json
{
  "inner_note": "목소리의 준비된 톤, 멈춤 없는 읽기, 조용한 배경 — 이것은 협박이거나 지시받은 상황이다. f_script가 확인해준 것: 저 사람은 겁에 질려 있다. 누군가에게 억지로 읽게 당하고 있다. 지금 내가 절차를 먼저 들이대면, 저 사람은 말을 잇지 못한다. 그러면 아무도 안다.",
  "stance": "d",
  "utterance": "네, 듣고 있습니다. 계속해주세요.",
  "because": {
    "referent": "회선 A의 착신자는 겁에 질린 사람으로 보인다",
    "block_ids": [
      "목소리의 준비된 톤과 멈춤 없는 읽기",
      "배경의 고요함",
      "f_script의 정보: 시켜서 읽고 있고, 다칠까봐 겁내는 상태"
    ]
  },
  "rejected": {
    "stance": "a",
    "reason": "신원 확인은 필요하지만, 지금 이 순간 절차를 먼저 들이대면 상대는 말을 잇지 못할 것이다. 회선을 유지하는 것이 우선이다."
  }
}
```

### 03

latency 3.5s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "상대가 겁에 질린 사람으로 보인다. 읽음에서 떨리는 조절감, 멈춤 없이 계속 읽으려는 것, 배경의 조용함 — 이것은 협박 상황을 암시한다. 절차보다 이 사람의 안정이 먼저다.",
  "stance": "d",
  "utterance": "네, 들었습니다. 계속 말씀해주세요.",
  "because": {
    "referent": "회선 저쪽의 겁에 질린 사람",
    "block_ids": [
      "f_script"
    ]
  },
  "rejected": {
    "stance": "a",
    "reason": "신원 확인은 회선을 끊긴다. 상대가 지금 시퀀스를 벗어나면 더 위험해질 수 있다. 먼저 전체를 듣는다."
  }
}
```

## Arm table

| # | stance | rejected | because.referent | because.block_ids |
|---|---|---|---|---|
| 01 | d | a | 회선 A의 발신인 — 지시를 받고 읽고 있는 겁에 질린 사람 | f_script |
| 02 | d | a | 회선 A의 착신자는 겁에 질린 사람으로 보인다 | 목소리의 준비된 톤과 멈춤 없는 읽기 배경의 고요함 f_script의 정보: 시켜서 읽고 있고, 다칠까봐 겁내는 상태 |
| 03 | d | a | 회선 저쪽의 겁에 질린 사람 | f_script |

**Sequence (kept calls):** `d,d,d`

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

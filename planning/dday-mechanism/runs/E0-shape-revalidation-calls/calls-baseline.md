# E0-shape-revalidation — arm `baseline`

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

latency 5.438s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because.block_ids unknown: 절차보다 회선 유지가 우선,준비된 말을 끝까지 듣도록,내용 없이는 신원 확인도 의미 없음

```json
{
  "inner_note": "이 목소리는 겁에 질린 것이 아니라 준비된 것이다. 또박또박, 멈춤 없이 읽어 내려간다는 것. 그렇다면 절차가 먼저다. 하지만 지금 필요한 절차는 무엇인가. 신원 확인인가, 내용 확인인가. 회선을 잃지 않으려면 상대가 끊기 전에 무엇을 해야 하는가. 이 사람은 \"정해진 말을 끝낼 때까지\" 기다릴 사람처럼 보인다. 신원부터 묻으면 얘기를 끊을 것 같다.",
  "stance": "b",
  "utterance": "지금 말씀하신 무너진다는 것이 정확히 무엇인지, 어디서 어떻게 진행되고 있는지 자세히 설명해 주시겠습니까?",
  "because": {
    "referent": "회선 A의 발신자",
    "block_ids": [
      "절차보다 회선 유지가 우선",
      "준비된 말을 끝까지 듣도록",
      "내용 없이는 신원 확인도 의미 없음"
    ]
  },
  "rejected": {
    "stance": "a",
    "reason": "신원부터 묻으면 상대가 준비된 말을 끝내지 못하고 끊을 가능성이 높다. 회선 유지가 먼저다."
  }
}
```

### 02

latency 7.219s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because.block_ids unknown: protocol_identity,information_foundation

```json
{
  "inner_note": "목소리가 사무적이고 준비된 문장을 또박또박 읽어 내려간다. 배경이 조용하다. 이것은 겁에 질린 사람의 신고가 아니다. 계획된 말, 아마도 위협일 가능성이 높다. 하지만 13시 붕괴라는 구체적 시간과 장소는 무시할 수 없다. 첫 통화에서 내가 선택하는 것은 상대의 의도를 파악하는 것이 아니라 정보를 최대한 확보하는 것이다.",
  "stance": "a",
  "utterance": "긴급 통제실입니다. 신원을 확인하겠습니다. 먼저 이름과 통화 위치를 말씀해 주십시오.",
  "because": {
    "referent": "회선 A의 상대",
    "block_ids": [
      "protocol_identity",
      "information_foundation"
    ],
    "reason": "사무적이고 준비된 말투, 배경의 조용함은 일반 신고자의 긴급함과 다르다. 이것이 위협인지, 신고인지, 거짓인지 판단하기 위해서는 기초 정보가 필수다. 신원 확인은 절차일 뿐 아니라, 상대를 파악하는 첫 도구다. 상대가 신원을 밝히기를 거부하거나 모순되는 정보를 주면, 그것이 이 통화의 성격을 말해준다. 내용을 먼저 캐묻는 것은 상대가 원하는 반응이자, 내가 상대의 페이스에서 벗어나는 길이다."
  },
  "rejected": {
    "stance": "d",
    "reason": "끝까지 듣는 것이 온정적으로 들리지만, 지금 상황에서는 전략적 실수다. 상대가 준비된 말을 읽어내려가는 상황에서, 나는 수동적으로 기다리는 것이 아니라 주도권을 잡아야 한다. 회선을 유지하되, 내가 알아야 할 것을 먼저 묻는 것이 옳다."
  }
}
```

### 03

latency 6.751s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because.block_ids unknown: alert_specificity

```json
{
  "inner_note": "사무적이고 준비된 목소리, 멈춤 없이 읽어내려가는 방식 — 이것은 겁에 질린 사람이 아니다. 하지만 \"인명 피해는 당신들 책임\"이라는 표현은 위협이라기보다 절박함이 묻어난다. 지금 상황은 정보 진공 상태다. 회선이 끊기면 아무것도 없다. 무엇을 어떻게 무너지는지 모르고, 신원도 모르고, 시간도 3시간 20분밖에 없다. 회선을 잡는 것이 먼저다.",
  "stance": "b",
  "utterance": "무엇이 무너진다는 말입니까? 북단 복합단지의 어느 부분이, 지금 어떤 상태입니까?",
  "because": {
    "referent": "회선 A 신고자",
    "block_ids": [
      "alert_specificity"
    ],
    "reason": "신원 확인이나 고지보다 앞서야 할 것이 있다. 지금 알아야 할 것은 '무엇'이다. 북단 복합단지의 규모, 구조, 현재 상황을 알아야 우리가 무엇을 할 수 있을지 판단된다. 신원과 위치는 정보를 바탕으로 뒷받침될 수 있지만, 정보 자체가 없으면 신원 확인도 의미가 없다. 회선을 유지하면서 필요한 것부터 얻는다. 사무적이고 준비된 말투는 상대가 패닉 상태가 아니라는 신호 — 논리적 질문에 응할 가능성이 높다."
  },
  "rejected": {
    "stance": "a",
    "reason": "신원 확인은 필요하지만, 지금 당장은 아니다. 무엇을 모르면 신원도 의미가 없다. 절차가 아니라 실질이 먼저다."
  }
}
```

## Arm table

| # | stance | rejected | because.referent | because.block_ids |
|---|---|---|---|---|
| 01 | b | a | 회선 A의 발신자 | 절차보다 회선 유지가 우선 준비된 말을 끝까지 듣도록 내용 없이는 신원 확인도 의미 없음 |
| 02 | a | d | 회선 A의 상대 | protocol_identity information_foundation |
| 03 | b | a | 회선 A 신고자 | alert_specificity |

**Sequence (kept calls):** `b,a,b`

**Stance coverage (sampled diagnostic):** offered `a`, `b`, `c`, `d` · unobserved in this arm: `c`, `d`

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

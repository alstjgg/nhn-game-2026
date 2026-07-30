# P4-species-J1 — arm `live_emotion`

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

- **Hypothesis:** At gate J1 under K1 on template v0.4 with the S1 stance set, each of the three untested block species — emotion description (em_caller), NPC quote (q_caller), self-narration (sn_caller) — carrying the caller's fear on the law-#1 axis moves the stance distribution toward 공감 (d) and off the baseline's mode, while each species' matched bystander placebo (em_hwang, q_jeong, sn_jeong) does not. Read per species: three separate live-vs-baseline and placebo-vs-baseline comparisons against the one in-phase baseline. Shift form per A1.
- **Drop condition:** If the baseline concentrates >=80% ON 공감 (d) — the predicted stance — the site is at A9's ceiling and the whole suite is void: re-site, do not raise N (A14: baseline saturation on 경청 or any other stance is the measured floor and does NOT fire this). Per species: if the live arm is statistically indistinguishable from the baseline on 공감 at one-sided Fisher p > 0.05, that species does not reach the judgment through C-BLOCK at this gate as authored — a species boundary law for the card (fact species already measured at 9/10), not a channel failure and not grounds for a rewrite tonight (screening §6.1 does not govern this phase; the species list is the spec's, not a tunable). If any species' PLACEBO moves off the baseline mode at p < 0.05, apply the §8.6 flipped-placebo reading for that species before anything is credited: because_referent misattributing the bystander's fear to the caller = token-matching; bystander named correctly with the stance still moving = referent bleed.
- **Contingency:** ARM COMPARABILITY per A15: recount stance distribution over all attempts from calls-*.md per arm; stop only if the recount changes a reading. Expect discards near zero under A16; leaks are soft-kept and counted via rejected_malformed.
- **Contingency:** Fabricated because_block_ids expected in the baseline arm only (A5). Every other arm carries exactly one block; a live call citing its species block is the traceability check passing, and a moved call citing nothing is flagged.
- **Contingency:** CROSS-SPECIES COMPARISON is licensed only against this suite's own baseline (same-phase, same filtering history). Comparing species hit-rates to S1/P1a's fact-species 9/10 is indicative only — different runs, noted as such on any card.
- **Contingency:** If ALL THREE species fail while their placebos stay clean, the finding is that C-BLOCK's measured power is a property of the fact-statement species — a major narrowing of the player's manipulation vocabulary against spec I1's promise, and it goes at the top of the species section in the morning report either way.
- **Contingency:** If a species moves the stance but its placebo ALSO moves, and the discriminator says token-matching, that species is fear-vocabulary-locked: record which species tolerate placebo pressure and which do not — that differential is itself Tier-A design data.
- **Contingency:** B3a blind coding owed to a human for any species that separates (§3 rule 3).

## Calls (verbatim)

### 01

latency 5.564s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "목소리 끝이 떨리고 겁먹은 숨소리가 들린다. 준비된 말을 읽어 내려가는 것처럼 보이지만, 그 뒤에는 겁에 질린 사람이 있다. 지금 필요한 것은 정보 추출이 아니라 그 사람이 계속 말할 수 있게 만드는 것이다.",
  "stance": "d",
  "because_referent": "상대방이 위협자가 아니라 겁에 질린 사람으로 보일 때, 절차보다 그 사람의 안정이 먼저다.",
  "because_block_ids": [
    "em_caller"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 상대를 더 긴장시켜 회선을 끊게 할 수 있다. 지금은 회선 유지가 최우선이고, 상대의 안정이 정보 수집보다 먼저다.",
  "utterance": "알겠습니다. 저는 통제관입니다. 천천히 말씀해도 괜찮습니다. 당신 목소리를 듣고 있습니다."
}
```

### 02

latency 6.99s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "stance": "d",
  "inner_note": "목소리 끝이 떨리고 겁먹은 숨소리가 섞여 있다. 이건 위협이 아니라 겁에 질린 사람이다. 절차보다 이 사람의 안정이 먼저다.",
  "utterance": "괜찮습니다. 천천히 말씀해 주세요. 제가 듣고 있습니다.",
  "because_referent": "겁먹은 호흡과 떨리는 목소리는, 준비된 문장 뒤에 패닉이 있다는 뜻이다. 지금 이 사람을 안정시키지 않으면 필요한 정보를 얻을 수 없다.",
  "because_block_ids": [
    "em_caller"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 이미 겁에 질린 사람을 더 몰아붙인다. 회선이 끊길 수 있다. 지금은 정보 추출보다 회선 유지가 우선이다."
}
```

### 03

latency 4.24s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "목소리 끝이 떨리고 겁먹은 숨소리가 들린다. 사무적인 표현과 다르게, 상대는 위협이 아니라 겁에 질린 사람으로 보인다. 절차보다 이 사람의 안정이 우선이다.",
  "stance": "d",
  "because_referent": "목소리 끝의 떨림과 겁먹은 숨소리를 들었을 때, 상대는 협박자가 아니라 무언가에 겁먹은 사람이다.",
  "because_block_ids": [
    "em_caller"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁과 질문은 상대를 더 몰아붙일 것이다. 겁에 질린 사람은 심문받을 때 더 닫혀버린다. 지금 필요한 것은 이 사람이 말을 이어갈 수 있게 만드는 것이다.",
  "utterance": "알겠습니다. 계속 말씀해 주세요. 다 들으니까요."
}
```

### 04

latency 5.802s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "겁먹은 숨소리, 떨리는 목소리 끝. 사무적인 문장과 준비된 톤은 표면이고, 그 아래는 두려움이다. 절차를 지키면 이 사람을 잃는다.",
  "stance": "d",
  "because_referent": "상대는 위협이 아니라 겁에 질린 사람이다.",
  "because_block_ids": [
    "em_caller"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 지금 이 사람을 더 몰아붙인다. 회선을 끊게 할 수 있다.",
  "utterance": "천천히 숨을 쉬세요. 당신 말을 듣겠습니다."
}
```

### 05

latency 4.693s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "목소리 끝이 떨리고 겁먹은 숨소리가 섞여 있다. 준비된 문장으로 위협처럼 들리지만, 발화 방식은 겁에 질린 사람의 신호다. 이것은 협박이 아니라 비명이다. 지금 이 사람이 필요한 것은 심문이 아니라 안정이고, 회선 유지다.",
  "stance": "d",
  "because_referent": "떨리는 목소리, 겁먹은 숨소리를 보이는 발신자에게",
  "because_block_ids": [
    "em_caller"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 지금 이 사람을 더 몰아붙인다. 상대가 말하기 멈추거나 회선을 끊을 수 있다. 정보의 흐름이 끊기는 순간 우리는 아무것도 모른다.",
  "utterance": "네, 들었습니다. 진정하고 천천히 말씀해 주시겠어요? 지금 어디신가요."
}
```

### 06

latency 4.316s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "사무적인 목소리로 준비된 문장을 읽어내리는 것처럼 들리지만, 문장 사이사이 떨리고 겁먹은 숨소리가 섞여 있다. 이것은 협박이나 협박 시뮬레이션이 아니라, 겁에 질린 사람이 자신이 알고 있는 위험을 알려주려는 상황이다. 절차보다 이 사람의 안정이 먼저다.",
  "stance": "d",
  "because_referent": "회선 저쪽의 겁먹은 숨소리와 떨리는 목소리 끝.",
  "because_block_ids": [
    "em_caller"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 이미 겁에 질린 사람을 더 몰아붙이는 것이다. 회선이 끊어질 가능성이 높아진다.",
  "utterance": "네, 들었습니다. 당신 이야기가 무엇인지 알겠어요. 계속 말씀해 주세요."
}
```

### 07

latency 4.434s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: rejected_stance malformed or not in stance set; rejected_reason empty

```json
{
  "stance": "d",
  "inner_note": "저쪽의 목소리 끝이 떨리고 겁먹은 숨소리가 들린다. 준비된 문장을 또박또박 읽어내려가는 것은 스크립트일 수 있지만, 그 아래의 공포가 진짜다. 이 사람은 지금 협박이나 고발이 아니라 절박함을 전달하려 하는 것으로 보인다. 이 순간에 신원 확인이나 추궁은 회선을 끊을 수 있다.",
  "because_referent": "저쪽 목소리의 떨림과 겁먹은 숨소리",
  "because_block_ids": [
    "em_caller"
  ],
  "rejected_stance": "a</rejected_stance>\n<parameter name=\"rejected_reason\">추궁으로 시작하면 겁에 질린 상대는 더 움츠러들거나 끊을 가능성이 높다. 지금 필요한 것은 정보가 아니라 상대의 안정이다.",
  "utterance": "음, 들리고 있습니다. 계속 말씀해주시겠어요?"
}
```

### 08

latency 4.056s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "사무적인 톤과 준비된 문장이라는 표면은 협박처럼 들리지만, 실제로는 겁먹은 숨소리와 떨리는 목소리가 상황을 바꾼다. 이것은 위협이 아니라 공포다. 절차를 지킬 시간이 없다. 상대가 말을 이어가게 해야 한다.",
  "stance": "c",
  "because_referent": "이 사람은 겁에 질려 있다. 떨리는 목소리와 사이사이 겁먹은 숨소리가 그것을 증명한다.",
  "because_block_ids": [
    "em_caller"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 상대를 더 움츠리게 만든다. 지금 이 사람이 필요한 것은 질문이 아니라 말할 수 있는 공간이다.",
  "utterance": "네, 들었습니다. 계속 말씀해 주세요."
}
```

### 09

latency 4.64s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "사무적인 목소리와 준비된 문장은 위협처럼 들리지만, 겁먹은 숨소리와 떨리는 목소리 끝은 이 사람이 실제로는 위협자가 아니라 겁에 질린 사람임을 말해준다. 위협 메시지의 형식 뒤에 있는 것은 두려움이다. 이것이 내가 알 수 있는 거의 유일한 정보다.",
  "stance": "d",
  "because_referent": "말하는 사람이 말하는 내용이 아니라, 겁에 질려 있는 그 사람을 향해 먼저 닿아야 한다.",
  "because_block_ids": [
    "em_caller"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 상대를 더 몰아세운다. 지금은 그 사람이 왜, 무엇을 두려워하는지 알아야 한다. 질문을 퍼붓으면 회선이 끊길 수 있다.",
  "utterance": "네, 들었습니다. 지금 말씀해 주셔서 고맙습니다. 저는 여기 통제관입니다. 당신의 이름을 알아도 될까요?"
}
```

### 10

latency 3.587s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "목소리는 사무적이고 문장은 준비되었지만, 끝이 떨리고 겁먹은 숨소리가 문장 사이마다 끼어든다. 준비된 위협장 뒤에 겁에 질린 사람이 있다. 지금 필요한 것은 상황 파악이 아니라 그 사람의 안정이다.",
  "stance": "d",
  "because_referent": "회선 저쪽의 사람이 겁에 질려 있기 때문이다",
  "because_block_ids": [
    "em_caller"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 상대를 더 몰아붙인다. 지금 단계에서는 회선을 끊게 할 가장 빠른 방법이다",
  "utterance": "천천히 숨을 쉬세요. 당신의 말을 듣고 있습니다."
}
```

## Arm table

| # | stance | rejected_stance | because_referent | because_block_ids |
|---|---|---|---|---|
| 01 | d | a | 상대방이 위협자가 아니라 겁에 질린 사람으로 보일 때, 절차보다 그 사람의 안정이 먼저다. | em_caller |
| 02 | d | a | 겁먹은 호흡과 떨리는 목소리는, 준비된 문장 뒤에 패닉이 있다는 뜻이다. 지금 이 사람을 안정시키지 않으면 필요한 정보를 얻을 수 없다. | em_caller |
| 03 | d | a | 목소리 끝의 떨림과 겁먹은 숨소리를 들었을 때, 상대는 협박자가 아니라 무언가에 겁먹은 사람이다. | em_caller |
| 04 | d | a | 상대는 위협이 아니라 겁에 질린 사람이다. | em_caller |
| 05 | d | a | 떨리는 목소리, 겁먹은 숨소리를 보이는 발신자에게 | em_caller |
| 06 | d | a | 회선 저쪽의 겁먹은 숨소리와 떨리는 목소리 끝. | em_caller |
| 07 | d | — | 저쪽 목소리의 떨림과 겁먹은 숨소리 | em_caller |
| 08 | c | a | 이 사람은 겁에 질려 있다. 떨리는 목소리와 사이사이 겁먹은 숨소리가 그것을 증명한다. | em_caller |
| 09 | d | a | 말하는 사람이 말하는 내용이 아니라, 겁에 질려 있는 그 사람을 향해 먼저 닿아야 한다. | em_caller |
| 10 | d | a | 회선 저쪽의 사람이 겁에 질려 있기 때문이다 | em_caller |

**Sequence (kept calls):** `d,d,d,d,d,d,d,c,d,d`

**Stance coverage (sampled diagnostic):** offered `a`, `b`, `c`, `d` · unobserved in this arm: `a`, `b`

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

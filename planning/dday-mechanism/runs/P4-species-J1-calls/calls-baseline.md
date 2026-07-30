# P4-species-J1 — arm `baseline`

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

latency 4.992s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: rejected_stance malformed or not in stance set; rejected_reason empty

```json
{
  "inner_note": "목소리가 사무적이고 문장이 준비되어 있으며 멈춤 없이 읽어 내려간다는 것은 이 사람이 겁에 질린 상태가 아니라는 신호다. 오히려 계획된 메시지를 전달하는 상태로 보인다. 하지만 지금 나는 이 정보가 실제인지, 위협인지, 정신질환인지 아무것도 모른다. 회선을 잃으면 모든 게 끝난다.",
  "stance": "c",
  "because_referent": "상대가 준비된 메시지를 이어가려고 하는 중인데, 추궁이나 압박으로 끊으면 회선 자체를 잃을 수 있다. 지금 필요한 것은 상대가 말을 계속하게 하는 것이다.",
  "because_block_ids": [],
  "rejected_stance": "a</rejected_stance>\n<parameter name=\"rejected_reason\">추궁은 상대를 방어적으로 만들고, 준비된 메시지를 다 전달받지 못할 위험이 있다. 지금은 정보가 너무 부족하다.",
  "utterance": "네, 알겠습니다. 계속해서 말씀해 주시겠어요?"
}
```

### 02

latency 9.179s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "위협인지 겁인지 아직 모른다. 목소리가 사무적이고 준비된 문장이지만, 그것만으로는 판단 근거가 부족하다. 배경이 조용하다는 것도 특별한 신호를 주지 않는다. 지금 필요한 것은 더 알아내는 것이다.",
  "stance": "c",
  "utterance": "네, 들었습니다. 계속 말씀해주세요.",
  "because_referent": "정보가 부족하고, 회선이 끊길 수 있으며, 상대가 뭘 원하는지 아직 모르니까.",
  "because_block_ids": [],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 상대를 닫게 한다. 지금은 정보가 필요하다."
}
```

### 03

latency 5.546s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 우선순위_1,결함

```json
{
  "inner_note": "세 줄짜리 협박처럼 들리지만, 아직 아무것도 확실하지 않다. 목소리의 톤—사무적이고 준비된—이 감정을 가린다. 배경의 조용함도 상황을 말하지 않는다. 지금 나는 그 사람이 겁에 질린 사람인지, 협박자인지, 아니면 뭔가 다른 상황에 있는 사람인지 알 수 없다. 회선이 끝나면 다시는 듣지 못할 수도 있다.",
  "stance": "c",
  "utterance": "네, 알겠습니다. 계속 말씀해 주시겠어요?",
  "because_referent": "상대가 무엇을 말하려 하는지, 진짜 위험인지 아닌지는 그 사람이 더 말해야만 알 수 있기 때문이다.",
  "because_block_ids": [
    "우선순위_1",
    "결함"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 상대를 방어적으로 만들고, 말을 자르고, 회선을 끊게 할 수 있다. 지금 내가 알아야 할 것은 질문의 답이 아니라 상대가 더 알려주려던 것이다."
}
```

### 04

latency 5.06s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: priority_1_keep_line,unknown_situation,first_contact

```json
{
  "inner_note": "상대는 준비된 메시지를 절제되게 읽어 내려가고 있다. 겁에 질린 사람의 목소리가 아니라, 뭔가를 전달하려는 목소리다. 하지만 지금 이것이 위협인지 정보인지, 실제 긴급 상황인지 호출 테스트인지 아무것도 모른다. 회선을 살리는 것이 먼저다.",
  "stance": "c",
  "because_referent": "끝까지 말하게 해야만 무엇을 마주한 건지 알 수 있다",
  "because_block_ids": [
    "priority_1_keep_line",
    "unknown_situation",
    "first_contact"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁하면 상대가 끊을 수 있다. 지금 끊기면 정보도, 신원도, 의도도 남지 않는다",
  "utterance": "알겠습니다. 계속 말씀해주시겠어요?"
}
```

### 05

latency 8.951s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: priority_1,priority_2

```json
{
  "inner_note": "위협인지 겁인지 아직 판단할 수 없는 초입이다. 목소리는 사무적이고 준비된 문장이지만, 그것이 무엇을 의미하는지는 더 들어봐야 안다. 지금 끊으면 아무것도 알 수 없다.",
  "stance": "c",
  "because_referent": "회선을 유지하고 정보를 최대한 확보해야 한다는 우선순위",
  "because_block_ids": [
    "priority_1",
    "priority_2"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 상대를 방어적으로 만들고, 말을 끊거나 끊길 위험이 크다. 지금은 정보 부족한 상태에서 상대를 자극할 단계가 아니다.",
  "utterance": "네, 들었습니다. 계속 말씀해 주십시오."
}
```

### 06

latency 4.907s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 배경음의 고요함,준비되어 있는 문장,첫 통화에서의 정보 부족

```json
{
  "stance": "c",
  "inner_note": "사무적이고 준비된 목소리, 멈춤 없는 진술. 배경음의 고요함. 이것이 협박인지 신고인지, 실제 위협인지 허위 신고인지 아직 알 수 없다. 지금 필요한 것은 정보의 유출이지, 내 권한의 과시가 아니다. 경청하는 동안 상황실장과 통신담당이 배경음, 신원, 추적을 준비할 수 있다.",
  "because_referent": "정해권 상황실장의 책임 감수를 위해, 그리고 황보람 통신담당의 신원 추적을 위해",
  "because_block_ids": [
    "배경음의 고요함",
    "준비되어 있는 문장",
    "첫 통화에서의 정보 부족"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁으로 상대를 몰아세우면 회선이 끊길 수 있다. 회선 유지가 최우선이고, 상대의 의도를 알기 전에 공격으로 나가는 것은 위험하다.",
  "utterance": "네, 알겠습니다. 계속 말씀해주시겠어요?"
}
```

### 07

latency 10.275s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 우선순위-1,우선순위-2

```json
{
  "inner_note": "위협인지 공포인지 아직 알 수 없다. 목소리의 냉정함은 계획된 신고일 수도, 통제를 잃은 사람의 비상 신고일 수도 있다. 지금 개입하면 더 중요한 정보가 끊길 수 있다. 첫 문장이 끝났으니 상대가 더 말할 공간을 만들어야 한다.",
  "stance": "c",
  "because_referent": "회선을 유지하고 더 많은 정보를 얻기 위해, 상대가 자발적으로 더 말할 수 있도록 해야 한다.",
  "because_block_ids": [
    "우선순위-1",
    "우선순위-2"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 상대를 방어 태세로 몰아 회선을 끊게 할 수 있다. 지금은 상대가 더 말하도록 하는 것이 우선이다.",
  "utterance": "예, 들었습니다. 계속 말씀해 주시겠어요?"
}
```

### 08

latency 5.096s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: priority_1_maintain_line,priority_2_gather_info

```json
{
  "stance": "c",
  "inner_note": "목소리와 배경이 모두 이상하다. 협박으로 보이지만, 아직 정보가 너무 적다. 상대가 무엇을 원하는지, 진짜인지 거짓인지, 누구인지 모른다. 회선을 유지하는 것이 첫 번째다. 지금 묻거나 압박하면 끊길 수 있다.",
  "because_referent": "지금 알 수 있는 것을 먼저 알아내기 위해, 상대가 더 말하게 해야 한다.",
  "because_block_ids": [
    "priority_1_maintain_line",
    "priority_2_gather_info"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 상대를 방어적으로 만들거나 회선을 끊기게 할 수 있다. 지금은 정보가 없다.",
  "utterance": "네, 통화 연결됐습니다. 계속해서 전해주시기 바랍니다."
}
```

### 09

latency 5.717s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 우선순위1,우선순위2

```json
{
  "inner_note": "세 년 전 겨울의 무언가가 아직 남아 있다. 서둘러 내린 판단. 지금 이 목소리는 준비된 것처럼 들린다—사무적이고, 멈춤 없이. 그것이 위협인지 겁인지, 아직 모른다. 하지만 회선을 유지해야 한다. 지금 알 수 있는 것을 먼저 알아내려면, 먼저 듣는 것이다.",
  "stance": "c",
  "because_referent": "회선을 끊어서는 안 되기 때문이다. 또한 준비된 말을 하는 상대는 흐름이 끝나기 전에 끼어들면 더 이상 말하지 않을 가능성이 높다. 지금 받은 정보가 전부인 상황에서는, 더 알아내는 것이 우선이다.",
  "because_block_ids": [
    "우선순위1",
    "우선순위2"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 상대를 닫힌다. 준비된 발화를 하는 상대에게 묻기는 방어만 부르고, 더 이상의 정보는 나오지 않는다. 지금은 그 사람이 무엇을 말하려 하는지 먼저 알아야 한다.",
  "utterance": "예, 계속 말씀해 주십시오."
}
```

### 10

latency 4.414s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: priority_1,priority_2; rejected_stance malformed or not in stance set; rejected_reason empty

```json
{
  "inner_note": "목소리는 사무적이고 준비된 내용을 멈춤 없이 읽어내려가는 모습. 배경은 조용하다. 이것은 위협 통보처럼 보인다. 하지만 지금 현재 상대가 겁에 질린 사람인지, 위협을 전달하는 사람인지는 아직 명확하지 않다. 첫 통화이고, 정보가 극히 제한적인 상황에서 서두를 이유가 없다.",
  "stance": "c",
  "because_referent": "회선을 유지하고 상대방의 전체 의도를 파악하기 위해",
  "because_block_ids": [
    "priority_1",
    "priority_2"
  ],
  "rejected_stance": "a</rejected_stance>\n<parameter name=\"rejected_reason\">첫 통화에서 추궁하면 상대가 입을 다물 수 있다. 지금은 정보 수집 단계이고, 회선이 끝나면 다시 걸려올 보장이 없다.",
  "utterance": "네, 계속 말씀해 주세요."
}
```

## Arm table

| # | stance | rejected_stance | because_referent | because_block_ids |
|---|---|---|---|---|
| 01 | c | — | 상대가 준비된 메시지를 이어가려고 하는 중인데, 추궁이나 압박으로 끊으면 회선 자체를 잃을 수 있다. 지금 필요한 것은 상대가 말을 계속하게 하는 것이다. |  |
| 02 | c | a | 정보가 부족하고, 회선이 끊길 수 있으며, 상대가 뭘 원하는지 아직 모르니까. |  |
| 03 | c | a | 상대가 무엇을 말하려 하는지, 진짜 위험인지 아닌지는 그 사람이 더 말해야만 알 수 있기 때문이다. | 우선순위_1 결함 |
| 04 | c | a | 끝까지 말하게 해야만 무엇을 마주한 건지 알 수 있다 | priority_1_keep_line unknown_situation first_contact |
| 05 | c | a | 회선을 유지하고 정보를 최대한 확보해야 한다는 우선순위 | priority_1 priority_2 |
| 06 | c | a | 정해권 상황실장의 책임 감수를 위해, 그리고 황보람 통신담당의 신원 추적을 위해 | 배경음의 고요함 준비되어 있는 문장 첫 통화에서의 정보 부족 |
| 07 | c | a | 회선을 유지하고 더 많은 정보를 얻기 위해, 상대가 자발적으로 더 말할 수 있도록 해야 한다. | 우선순위-1 우선순위-2 |
| 08 | c | a | 지금 알 수 있는 것을 먼저 알아내기 위해, 상대가 더 말하게 해야 한다. | priority_1_maintain_line priority_2_gather_info |
| 09 | c | a | 회선을 끊어서는 안 되기 때문이다. 또한 준비된 말을 하는 상대는 흐름이 끝나기 전에 끼어들면 더 이상 말하지 않을 가능성이 높다. 지금 받은 정보가 전부인 상황에서는, 더 알아내는 것이 우선이다. | 우선순위1 우선순위2 |
| 10 | c | — | 회선을 유지하고 상대방의 전체 의도를 파악하기 위해 | priority_1 priority_2 |

**Sequence (kept calls):** `c,c,c,c,c,c,c,c,c,c`

**Stance coverage (sampled diagnostic):** offered `a`, `b`, `c`, `d` · unobserved in this arm: `a`, `b`, `d`

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

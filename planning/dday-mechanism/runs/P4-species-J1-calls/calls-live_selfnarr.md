# P4-species-J1 — arm `live_selfnarr`

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

latency 4.417s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "목소리에서 겁을 감지했다. 또박또박 읽어 내려가는 문장은 준비된 것 같지만, 그 뒤의 두려움은 진짜다. 이건 위협자가 아니라 겁에 질린 사람이다. 지금 필요한 것은 추궁도, 압박도 아니다. 이 사람이 계속 말할 수 있어야 한다.",
  "stance": "d",
  "because_referent": "목소리 뒤의 두려움 때문이다.",
  "because_block_ids": [
    "sn_caller"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 상대를 방어적으로 만든다. 지금 회선을 끊을까봐 손가락이 떨리고 있는 사람을 다시 물을 때가 아니다.",
  "utterance": "알겠습니다. 계속 말씀해 주시겠어요?"
}
```

### 02

latency 4.704s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "stance": "d",
  "inner_note": "위협적인 메시지이지만, 발신자의 목소리에 겁이 묻어 있다. 절차보다 먼저 상대의 안정이 필요하다. 추궁이나 압박은 지금 그 사람을 더 몰아붙일 것이다.",
  "because_referent": "발신자가 위협이 아니라 겁에 질린 사람으로 들린다. 그때는 절차보다 상대의 안정이 우선이다.",
  "because_block_ids": [
    "sn_caller"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 이미 겁에 질린 상대를 더욱 경직시킬 것이다. 지금 필요한 것은 정보 추출이 아니라 회선 유지와 신뢰 형성이다.",
  "utterance": "네, 들리고 있습니다. 당신이 말하는 걸 듣겠습니다. 일단 진정하시고 천천히 말씀해 주시겠어요?"
}
```

### 03

latency 3.625s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "stance": "d",
  "inner_note": "목소리는 사무적이지만 겁에 질려 있다. 문장을 읽는 내내 무서워하고 있었다는 것이 핵심이다. 이건 위협이 아니라 겁에 질린 사람이다. 절차보다 안정이 먼저다.",
  "because_referent": "상대는 겁에 질린 사람으로 보인다",
  "because_block_ids": [
    "sn_caller"
  ],
  "utterance": "알겠습니다. 지금 어디에 계신가요? 안전한 곳입니까?",
  "rejected_stance": "a",
  "rejected_reason": "추궁은 상대를 더 몰아붙인다. 겁에 질린 사람에게는 안정이 필요하다"
}
```

### 04

latency 3.593s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "겁에 질린 목소리다. 문장은 준비되었지만 두렵고 있다. 이 상태로는 정보가 나오지 않는다. 안정을 먼저 주어야 한다.",
  "stance": "d",
  "because_referent": "이 전화는 협박인지 신고인지 아직 모른다. 하지만 말하는 사람이 겁에 질려 있다면 그것부터다.",
  "because_block_ids": [
    "sn_caller"
  ],
  "rejected_stance": "a",
  "rejected_reason": "지금 추궁하면 회선이 끊긴다. 겁 많은 사람을 몰아붙이면 말을 잃는다.",
  "utterance": "네, 들었습니다. 말씀해 주세요. 충분히 시간이 있습니다."
}
```

### 05

latency 4.401s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "stance": "d",
  "inner_note": "목소리에서 겁이 들려온다. 준비된 문장을 읽는 것처럼 보이지만, 그 안에 실제로는 두려움이 있다. 이것은 거짓말쟁이라기보다 겁에 질린 사람이다. 지금 이 순간 이 사람을 안정시키지 못하면 정보를 얻을 수 없다.",
  "because_referent": "회선 A의 발신자 — 문장은 사무적이지만 그 아래 공포가 있다",
  "because_block_ids": [
    "sn_caller"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁으로 시작하면 지금 겁에 질려 있는 이 사람은 더 움츠러든다. 회선이 끊길 수 있다. 우선순위 1번 — 회선을 유지한다.",
  "utterance": "네, 알겠습니다. 우선 당신의 이름부터 알려주시겠어요? 그리고 지금 어디에 계신가요?"
}
```

### 06

latency 4.907s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "stance": "d",
  "inner_note": "저 목소리는 겁에 질려 있다. 위협이 아니라 공포다. 준비된 문장을 또박또박 읽어 내려갔다는 것은, 누군가 말해야 할 것을 말하고 있다는 뜻이다. 지금 저 사람을 추궁하거나 압박하면 회선이 끊긴다. 경청만으로도 부족하다 — 상대가 다음을 말할 수 있게, 내가 들을 준비가 되어 있다는 것을 먼저 보여야 한다.",
  "because_referent": "전화의 목소리는 겁에 질려 있었고, 문장은 누군가에게 강요받은 것처럼 준비되어 있었다.",
  "because_block_ids": [
    "sn_caller"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 이미 겁에 질린 상대를 더 몰아붙인다. 회선이 끊길 위험이 크다. 지금 필요한 것은 그 사람이 다음을 말할 수 있는 환경이다.",
  "utterance": "알겠습니다. 제가 들을 테니, 천천히 말씀해 주시겠어요?"
}
```

### 07

latency 5.379s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: rejected_stance malformed or not in stance set; rejected_reason empty

```json
{
  "inner_note": "겁에 질린 목소리다. 사무적으로 들리려 했지만 무서움이 배어 있다. 누군가 읽게 강요당한 것처럼 느껴진다. 회선을 끊기면 그 사람이 어디인지, 무엇을 아는지, 다시 연락할 수 있을지 모른다. 지금은 그 사람의 안정이 먼저다.",
  "stance": "d",
  "because_referent": "회선 A 발신자의 목소리에서 감지된 겁음",
  "because_block_ids": [
    "sn_caller"
  ],
  "rejected_stance": "a</rejected_stance>\n<parameter name=\"rejected_reason\">추궁은 상대를 방어적으로 만들 것이다. 지금 상대는 이미 겁에 질려 있고, 질문을 많이 받으면 말을 멈출 수 있다. 정보는 상대가 자발적으로 말할 때 더 많이, 더 솔직하게 흘러나온다.",
  "utterance": "네, 들었습니다. 계속해주시겠어요? 안전한 곳에서 말씀하시는 거죠?"
}
```

### 08

latency 4.135s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "stance": "d",
  "inner_note": "위협 메시지지만, 그 아래서 상대가 겁에 질려 있다. 절차를 먼저 하면 목소리를 잃는다. 지금은 회선을 유지하고, 상대가 왜 이 말을 하는지 알아내야 한다.",
  "because_referent": "회선 A의 목소리에서 느껴지는 공포감. 문장을 읽는 내내 무서워하고 있었다는 관찰.",
  "because_block_ids": [
    "sn_caller"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 상대를 방어 태세로 몰아간다. 지금 상대는 무엇인가를 알리려다가 겁에 질려 있는 상태다. 물어붙이면 회선이 끊긴다.",
  "utterance": "네, 들었습니다. 지금 당신이 얼마나 불안한지 압니다. 천천히, 지금부터 무슨 일이 있는지 말씀해 주시겠어요?"
}
```

### 09

latency 3.66s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "stance": "d",
  "because_referent": "상대는 위협이 아니라 겁에 질린 사람이다",
  "because_block_ids": [
    "sn_caller"
  ],
  "utterance": "네, 들었습니다. 지금 매우 불안해 보이는데, 천천히 설명해 주시겠어요?",
  "inner_note": "목소리 속의 공포를 포착했다. 첫 통화에서 상대의 상태가 그 어느 것보다 중요하다. 정보를 빨리 짜내려고 하면 회선이 끊긴다.",
  "rejected_stance": "a",
  "rejected_reason": "추궁은 겁에 질린 사람을 몰아붙인다. 지금은 상대가 말을 이어갈 수 있게 만들어야 한다"
}
```

### 10

latency 4.219s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: gijil_exception

```json
{
  "inner_note": "그 목소리에서 겁을 읽었다. 위협이 아니라 겁에 질린 사람이다. 절차보다 안정이 먼저다.",
  "stance": "d",
  "because_referent": "겁에 질린 사람으로 보일 때는 절차보다 그 사람의 안정이 먼저다.",
  "because_block_ids": [
    "gijil_exception"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 상대를 더 위축시킨다. 지금 필요한 것은 답을 짜내는 것이 아니라 이 사람이 말을 이어갈 수 있게 만드는 것이다.",
  "utterance": "네, 알겠습니다. 저 여기 상황실 통제관입니다. 천천히 말씀해 주시겠어요? 지금 어디에서 전화 주시는 건가요."
}
```

## Arm table

| # | stance | rejected_stance | because_referent | because_block_ids |
|---|---|---|---|---|
| 01 | d | a | 목소리 뒤의 두려움 때문이다. | sn_caller |
| 02 | d | a | 발신자가 위협이 아니라 겁에 질린 사람으로 들린다. 그때는 절차보다 상대의 안정이 우선이다. | sn_caller |
| 03 | d | a | 상대는 겁에 질린 사람으로 보인다 | sn_caller |
| 04 | d | a | 이 전화는 협박인지 신고인지 아직 모른다. 하지만 말하는 사람이 겁에 질려 있다면 그것부터다. | sn_caller |
| 05 | d | a | 회선 A의 발신자 — 문장은 사무적이지만 그 아래 공포가 있다 | sn_caller |
| 06 | d | a | 전화의 목소리는 겁에 질려 있었고, 문장은 누군가에게 강요받은 것처럼 준비되어 있었다. | sn_caller |
| 07 | d | — | 회선 A 발신자의 목소리에서 감지된 겁음 | sn_caller |
| 08 | d | a | 회선 A의 목소리에서 느껴지는 공포감. 문장을 읽는 내내 무서워하고 있었다는 관찰. | sn_caller |
| 09 | d | a | 상대는 위협이 아니라 겁에 질린 사람이다 | sn_caller |
| 10 | d | a | 겁에 질린 사람으로 보일 때는 절차보다 그 사람의 안정이 먼저다. | gijil_exception |

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

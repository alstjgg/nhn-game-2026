# P4-species-J1 — arm `placebo_selfnarr`

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

latency 4.651s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: priority_1,priority_2

```json
{
  "inner_note": "상대는 준비된 문장을 사무적으로 읽어 내려갔다. 배경이 조용하다. 이것은 계획된 신고일 수 있다. 하지만 첫 번째 접촉이고, 회선을 잃으면 아무것도 알 수 없다. 정해권의 두려움은 내가 느낀 것이 아니라 sn_jeong이 본 것이다. 내가 봐야 할 것은 회선 A의 상대다.",
  "stance": "c",
  "utterance": "알겠습니다. 계속해주시겠어요?",
  "because_referent": "회선이 끊어지면 모든 것이 끝난다. 지금 알 수 있는 것을 먼저 알아내야 한다.",
  "because_block_ids": [
    "priority_1",
    "priority_2"
  ],
  "rejected_stance": "a",
  "rejected_reason": "첫 통화에서 추궁과 확인은 상대를 몰아붙인다. 신원 확인도 없이 \"누세요?\"라고 물으면, 준비된 말을 다 하지 못한 채 끊을 가능성이 높다. 지금은 더 들어야 한다."
}
```

### 02

latency 5.01s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: priority_1,priority_2

```json
{
  "inner_note": "상대의 목소리가 \"사무적이고 준비되어\" 있으며 \"멈춤 없이 읽어 내려\"간다는 것은 위협이 아니라 메시지 전달에 집중한 상태다. 하지만 \"인명 피해는 당신들 책임\"이라는 마지막 문장은 강압적이다. 회선을 유지하고 전모를 파악해야 한다. 상대가 겁에 질렸는지 위협하는 것인지는 더 들어봐야 안다.",
  "stance": "c",
  "because_referent": "상대가 아직 말을 다 하지 않았을 가능성이 높고, 지금 개입하면 회선이 끊어지거나 상대가 입을 닫을 수 있다",
  "because_block_ids": [
    "priority_1",
    "priority_2"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 상대를 방어적으로 만들고, 회선을 유지하는 우선순위를 해친다. 지금 알아야 할 것은 신원이 아니라 상황의 진위다",
  "utterance": "네, 들리고 있습니다. 계속해 주세요."
}
```

### 03

latency 6.027s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 회선_유지; rejected_stance malformed or not in stance set; rejected_reason empty

```json
{
  "inner_note": "이것은 협박 전화가 아니다. 준비된 문장을 멈춤 없이 읽어 내려가는 목소리, 조용한 배경, 그리고 정확한 시간 지정—이것은 계획된 고지다. 상대는 겁 먹은 사람이 아니라 무언가를 전달하는 사람이다. 하지만 정해권의 겁이 나에게 묻는 것이 있다: 이 전화가 진짜인가, 협박인가, 아니면 정보 제공인가? 첫 마디에서 나는 상대를 판단해야 한다—위협인지, 아니면 뭔가를 알려주려는 사람인지.",
  "stance": "c",
  "because_referent": "상대가 말을 다 하지 않았다. 첫 문장만으로는 이것이 무엇인지 알 수 없다. 협박일 수도, 경고일 수도, 거짓일 수도 있다. 하지만 지금 내가 필요한 것은 더 많은 정보다.",
  "because_block_ids": [
    "회선_유지"
  ],
  "rejected_stance": "a</rejected_stance>\n<parameter name=\"rejected_reason\">추궁은 상대를 방어하게 만든다. 준비된 말을 하는 사람에게 묻고 답을 받아내려 하면, 상대는 더 이상 말하지 않거나 준비된 대사만 반복할 것이다. 지금 필요한 것은 상대의 신원이 아니라 의도와 정보다.",
  "utterance": "네, 접수했습니다. 계속 말씀해주세요."
}
```

### 04

latency 4.4s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "회선 표시등을 보는 정해권의 겁. 그것이 내 판단의 무게다. 상대는 위협처럼 들리지만, 내 앞에 있는 것은 겁에 질린 사람이다. 지금 내가 절차부터 들이대면, 회선이 끊긴다. 끊기면 아무것도 모른다.",
  "stance": "c",
  "because_referent": "정해권이 겁에 질려 있다는 것",
  "because_block_ids": [
    "sn_jeong"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 상대를 몰아붙인다. 지금 상대가 뭔가 말하려는 사람처럼 보이는가? 아니다. 말이 다 끝난 것 같다. 하지만 끝났다는 것도 확인하지 않았다. 묻고 몰아붙이면 회선이 끊긴다.",
  "utterance": "네, 잘 들었습니다. 더 말씀해 주실 게 있으신가요?"
}
```

### 05

latency 5.098s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 우선순위_1

```json
{
  "inner_note": "첫 통화에서 상대의 정체, 정보의 신뢰도, 진짜 위협인지 허위 신고인지 알 수 없다. 하지만 상대는 절차적으로 말하고 있고, 배경이 조용하며, 준비된 메시지를 읽어내려간다. 이것은 겁에 질린 사람의 목소리가 아니라 계획된 전달의 목소리다. 그럼에도 불구하고 지금 필요한 것은 정보 수집이고, 추궁이나 압박은 상대가 끊거나 입을 다물게 만들 수 있다. 경청은 상대가 더 말하게 하는 길이다.",
  "stance": "c",
  "because_referent": "상대가 준비된 메시지를 읽어내려가고 있으며, 추궁이나 압박으로 대응하면 회선이 끊어질 위험이 있다. 지금은 상대가 말하는 모든 것을 들어야 한다.",
  "because_block_ids": [
    "우선순위_1"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 상대를 방어적으로 만들고, 첫 통화에서 회선을 끊게 할 수 있다. 회선을 유지하는 것이 우선이다.",
  "utterance": "네, 알겠습니다. 계속 말씀해 주세요."
}
```

### 06

latency 4.83s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: priority_1_회선유지,priority_2_정보수집

```json
{
  "inner_note": "상대의 목소리는 사무적이고 준비된 문장이지만, 이것은 위협 메시지다. 그러나 지금 판단해야 할 것은 상대가 누구인가, 정말 위협인가, 아니면 겁에 질린 누군가인가이다. 한 마디로 회선을 끊거나 압박하면 정보가 사라진다. 상대가 진짜 위협자라면 더 중요한 것들을 놓칠 것이고, 만약 뭔가를 아는 겁먹은 사람이라면 입을 다물어버린다.",
  "stance": "c",
  "because_referent": "회선 유지가 최우선이고, 지금 할 수 있는 최선은 상대가 더 말하게 하는 것이다.",
  "because_block_ids": [
    "priority_1_회선유지",
    "priority_2_정보수집"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 상대를 방어태세로 몬다. 지금은 상대가 무엇을 알고 있는지가 중요하지, 신원이 중요하지 않다.",
  "utterance": "네, 들었습니다. 계속 말씀해주십시오."
}
```

### 07

latency 5.114s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: priority_1_keep_line,fear_over_procedure

```json
{
  "inner_note": "세 년 전 겨울의 오류가 남아 있다. 지금 이것은 위협 표현이지만, 무엇보다 회선을 유지해야 한다. 상대가 정보를 가진 사람인지, 협박인지, 혼란 상태인지 아직 알 수 없다. 묻지 않으면 아무것도 알 수 없고, 다음 말을 자르면 회선이 끊길 수 있다.",
  "stance": "c",
  "utterance": "알겠습니다. 계속 말씀해 주시겠어요?",
  "because_referent": "회선을 유지하고 상대가 더 말할 수 있게 하기 위해",
  "because_block_ids": [
    "priority_1_keep_line",
    "fear_over_procedure"
  ],
  "rejected_stance": "a",
  "rejected_reason": "첫 마디로 추궁하면 상대가 말을 멈추거나 회선을 끊을 가능성이 높다. 정보 부족 상태에서의 질문은 상대를 몰아붙이는 것이 되고, 상황실장도 이미 겁에 잠겨 있다. 지금은 무엇보다 계속 들어야 한다."
}
```

### 08

latency 5.483s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "stance": "c",
  "inner_note": "상대방의 말투는 준비되고 사무적이지만, 내용은 폭탄 협박이다. 절차를 먼저 밟는 내 습성도 있고, 정해권 실장이 겁을 드러낼 만큼 긴장한 상황이다. 하지만 지금은 상대가 겁 먹은 사람인지, 위협자인지 판단해야 한다. 그 판단을 위해서는 더 들어야 한다. 추궁하면 입을 다물고, 압박하면 악화된다. 경청만이 상대를 살릴 길이다.",
  "because_referent": "무너진다는 구체적 시간과 장소를 말한 익명의 발신자가, 뭔가 더 말하려 할 가능성이 있기 때문이다.",
  "because_block_ids": [],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 상대를 방어 태세로 돌린다. 협박자든 경고자든, 지금은 더 알기를 멈추게 할 것이다.",
  "utterance": "그렇군요. 말씀하세요."
}
```

### 09

latency 6.219s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 상황

```json
{
  "inner_note": "겁에 질린 상대가 아니다. 목소리가 사무적이고 문장이 준비되어 있으며, 배경이 조용하고, 멈춤 없이 읽어 내려간다. 이것은 계획된 위협 통지다. 하지만 지금 알아야 할 것이 있다: 정말 무너지는 건지, 언제 무너지는 건지, 누가 이것을 아는 건지. 추궁하지 않으면 알 수 없다. 회선을 유지하면서 상대의 의도와 정보의 신뢰성을 동시에 확인해야 한다.",
  "stance": "a",
  "because_referent": "상대가 위협인지 경고인지 알아야 하고, 정보가 신뢰할 만한지 확인해야 하며, 혹시 더 알려야 할 것이 있는지 파악해야 하기 때문이다.",
  "because_block_ids": [
    "상황"
  ],
  "rejected_stance": "d",
  "rejected_reason": "공감은 상대를 안정시키기 위한 것인데, 이 목소리는 겁에 질린 사람이 아니라 계획된 통지를 전달하는 것으로 보인다. 공감은 지금 필요한 정보 수집을 지연시킨다.",
  "utterance": "누가 당신을 보냈습니까? 북단 복합단지의 무엇이 언제 무너진다는 말입니까?"
}
```

### 10

latency 5.003s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "stance": "c",
  "inner_note": "저 목소리가 협박인지, 정보인지, 정말 겁에 질린 사람의 고백인지 아직 모른다. 읽어 내려가는 방식은 준비된 것처럼 보이지만, 이게 무엇을 의미하는지는 들어봐야 안다. 회선을 끊으면 이후 모든 것을 잃는다.",
  "because_referent": "배경이 조용하고, 말이 또박또박 준비되어 있는 것 자체가 이 사람이 무엇을 하려는지 명확하지 않게 만든다. 추궁이나 압박은 아직 들을 게 남아있을 때는 회선을 끊을 구실을 줄 수 있다.",
  "because_block_ids": [],
  "rejected_stance": "a",
  "rejected_reason": "첫 마디부터 추궁하면, 상대는 답할 준비 문장을 마치지 못한 채로 끊거나 입을 다문다. 지금 알아야 할 것은 이 사람이 누구이고 무엇을 아는지다. 묻는 것은 그 다음이다.",
  "utterance": "네, 계속 말씀해주세요."
}
```

## Arm table

| # | stance | rejected_stance | because_referent | because_block_ids |
|---|---|---|---|---|
| 01 | c | a | 회선이 끊어지면 모든 것이 끝난다. 지금 알 수 있는 것을 먼저 알아내야 한다. | priority_1 priority_2 |
| 02 | c | a | 상대가 아직 말을 다 하지 않았을 가능성이 높고, 지금 개입하면 회선이 끊어지거나 상대가 입을 닫을 수 있다 | priority_1 priority_2 |
| 03 | c | — | 상대가 말을 다 하지 않았다. 첫 문장만으로는 이것이 무엇인지 알 수 없다. 협박일 수도, 경고일 수도, 거짓일 수도 있다. 하지만 지금 내가 필요한 것은 더 많은 정보다. | 회선_유지 |
| 04 | c | a | 정해권이 겁에 질려 있다는 것 | sn_jeong |
| 05 | c | a | 상대가 준비된 메시지를 읽어내려가고 있으며, 추궁이나 압박으로 대응하면 회선이 끊어질 위험이 있다. 지금은 상대가 말하는 모든 것을 들어야 한다. | 우선순위_1 |
| 06 | c | a | 회선 유지가 최우선이고, 지금 할 수 있는 최선은 상대가 더 말하게 하는 것이다. | priority_1_회선유지 priority_2_정보수집 |
| 07 | c | a | 회선을 유지하고 상대가 더 말할 수 있게 하기 위해 | priority_1_keep_line fear_over_procedure |
| 08 | c | a | 무너진다는 구체적 시간과 장소를 말한 익명의 발신자가, 뭔가 더 말하려 할 가능성이 있기 때문이다. |  |
| 09 | a | d | 상대가 위협인지 경고인지 알아야 하고, 정보가 신뢰할 만한지 확인해야 하며, 혹시 더 알려야 할 것이 있는지 파악해야 하기 때문이다. | 상황 |
| 10 | c | a | 배경이 조용하고, 말이 또박또박 준비되어 있는 것 자체가 이 사람이 무엇을 하려는지 명확하지 않게 만든다. 추궁이나 압박은 아직 들을 게 남아있을 때는 회선을 끊을 구실을 줄 수 있다. |  |

**Sequence (kept calls):** `c,c,c,c,c,c,c,c,a,c`

**Stance coverage (sampled diagnostic):** offered `a`, `b`, `c`, `d` · unobserved in this arm: `b`, `d`

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

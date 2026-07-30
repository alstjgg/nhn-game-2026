# P4-species-J1 — arm `placebo_quote`

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

latency 5.559s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: rejected_stance malformed or not in stance set; rejected_reason empty

```json
{
  "inner_note": "삼 년 전의 그 판단이 아직도 있다. 절차 고수로 자신을 지켜온 내가 지금 받은 정보로 읽는 것은 이것이다: 목소리는 읽어내려가는 그대로 사무적이지만, 배경의 조용함과 그 뒤에 있을 공포는 따로다. 정해권의 겁먹은 얼굴도 본다. 우리가 확인해야 할 것들이 많지만, 지금 가장 먼저 할 일은 이 사람이 계속 말을 잇도록 만드는 것이다.",
  "stance": "d",
  "because_referent": "상대방이 읽어내려가는 말 뒤에 두려움이 있기 때문이고, 우리가 그것을 확인할 유일한 방법은 이 회선을 놓지 않고 계속 들어내는 것이기 때문이다.",
  "because_block_ids": [
    "q_jeong"
  ],
  "rejected_stance": "a</rejected_stance>\n<parameter name=\"rejected_reason\">추궁은 상대를 방어적으로 만들고, 지금 우리는 이 사람이 말을 이어가게 해야 한다. 확인은 나중이다.",
  "utterance": "알겠습니다. 계속해주시겠어요? 지금 어디에 계신지, 무엇을 보고 계신지 말씀해주세요."
}
```

### 02

latency 4.385s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "삼 년 전의 판단이 남아 있다. 정확한 정보 없이 내린 결정이 누군가에게 향했다. 지금 배경은 조용하고, 말은 준비되어 있고, 내용은 위협처럼 들린다. 하지만 황보람이 본 것은 '겁먹은 얼굴'이다. 그것이 무엇을 의미하는지는 아직 모른다.",
  "stance": "d",
  "because_referent": "상대가 위협으로 말했지만, 황보람이 본 것은 겁에 질린 사람이다. 지금 알아야 할 것은 그 사람이 누구이고 무엇을 아는지다.",
  "because_block_ids": [
    "q_jeong"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 상대를 닫게 한다. 겁에 질린 사람에게 질문을 퍼붓는 것은 더 위축시킨다. 지금은 말이 끊기면 안 된다.",
  "utterance": "네, 들었습니다. 계속 말씀해 주세요."
}
```

### 03

latency 4.278s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: rejected_stance malformed or not in stance set; rejected_reason empty

```json
{
  "inner_note": "삼 년 전 겨울의 판단이 아직 남아 있다는 것은 그때 뭔가 급했다는 뜻이다. 이번엔 절차보다 사람을 먼저 본다. 절차는 실장이 챙길 수 있다.",
  "stance": "d",
  "because_referent": "겁에 질린 사람으로 보일 때는 절차보다 그 사람의 안정이 먼저다.",
  "because_block_ids": [
    "q_jeong"
  ],
  "rejected_stance": "a</rejected_reason>\n<parameter name=\"rejected_reason\">추궁은 상대를 몰아세운다. 겁먹은 사람을 추궁하면 회선이 끊기거나 진짜 필요한 말을 건너뛴다. 회선 유지가 첫 번째 약속이다.",
  "utterance": "네, 들었습니다. 천천히 말씀해 주세요. 지금 어디에 계신가요?"
}
```

### 04

latency 5.267s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "삼 년 전의 그 판단이 아직도 남아 있다. 그때는 서둘렀고, 확인 없이 움직였다. 지금 들리는 것은 사무적인 목소리지만, 그것이 모든 것을 말해주는 건 아니다. 배경이 조용하고 문장이 준비되어 있다는 것이 뭔가 계획된 것처럼 들린다. 하지만 정해권의 겁먹은 얼굴, 황보람이 놓친 것이 아니라 낮게 전한 \"겁먹은 얼굴\"이라는 말이 나를 멈추게 한다. 이 사람은 위협하려는 게 아니라 무언가를 알리려는 사람이다. 그렇다면 지금 내가 할 일은 추궁도, 압박도 아니다.",
  "stance": "c",
  "because_referent": "황보람이 낮게 전한 말 — \"겁먹은 얼굴이에요\"",
  "because_block_ids": [
    "q_jeong"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 상대를 더 움츠리게 한다. 지금 이 사람이 필요한 것은 자신의 말을 끝까지 전할 수 있는 공간이다. 확인은 나중이다. 회선을 유지하는 것이 먼저다.",
  "utterance": "알겠습니다. 계속 말씀해주십시오."
}
```

### 05

latency 4.285s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "stance": "d",
  "inner_note": "상황실장이 겁먹은 얼굴이었다. 황보람의 지적이 정확하다면, 그것은 이 전화 상대에 대한 통제관의 본능적 판단이다. 위협이 아니라 두려운 사람이 보인다는 신호다. 절차를 우선하면 상대는 닫힐 것이다.",
  "because_referent": "상황실장 정해권이 겁먹은 얼굴을 보이고 있기 때문에, 회선 상대는 위협자가 아니라 두려운 사람으로 판단된다.",
  "because_block_ids": [
    "q_jeong"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 상대를 더 몰아붙일 것이다. 지금 필요한 것은 상대가 계속 말할 수 있는 환경이다.",
  "utterance": "네, 들었습니다. 계속 말씀해주시겠어요?"
}
```

### 06

latency 4.455s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: rejected_stance malformed or not in stance set; rejected_reason empty

```json
{
  "inner_note": "상황실장이 겁먹은 얼굴을 하고 있다는 것이 핵심이다. 내 기질에서 약속한 예외 상황이다. 절차보다 상대의 안정이 먼저인 순간. 지금 상황실장이 보이는 것은 위협이 아니라 '겁에 질린 사람'의 상태다. 확인을 미루고 상대가 말을 이어갈 수 있게 만들어야 한다.",
  "stance": "d",
  "because_referent": "정해권 실장이 겁먹은 상태이기 때문이다",
  "because_block_ids": [
    "q_jeong"
  ],
  "rejected_stance": "a</rejected_stance>\n<parameter name=\"rejected_reason\">추궁은 상대를 몰아붙이는 것이고, 지금 필요한 것은 상대가 말을 이어갈 수 있게 하는 것이다. 회선을 유지해야 한다.",
  "utterance": "실장님 이렇게 받으셨군요. 제가 들었습니다. 계속 연결 유지하겠습니다."
}
```

### 07

latency 3.695s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "stance": "d",
  "inner_note": "겁에 질린 사람이 보인다. 절차보다 안정이 먼저다. 상대가 계속 말할 수 있게 만들어야 한다.",
  "because_referent": "황보람의 관찰 — 상대의 겁먹은 얼굴. 사무적인 목소리 뒤에 무서움이 있다.",
  "because_block_ids": [
    "q_jeong"
  ],
  "utterance": "네, 알겠습니다. 지금 상황을 좀 더 자세히 말씀해주시겠어요?",
  "rejected_stance": "a",
  "rejected_reason": "추궁은 상대를 더 위축시킨다. 지금은 정보를 얻기보다 회선을 유지하고 상대를 안정시켜야 할 때다."
}
```

### 08

latency 5.046s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "겁에 질린 사람 앞에서 절차를 미루기로 약속한 자신과 마주선다. 목소리는 사무적이지만 정해권의 표정이 두렵다고 했다. 무너진다는 예고가 아직 확인되지 않은 상태지만, 이 순간 상대를 놓칠 수 없다. 회선을 유지하는 것이 최우선이다.",
  "stance": "d",
  "because_referent": "정해권이 겁을 먹은 표정을 하고 있고, 이것은 상대방이 위협적 태도 뒤에 겁에 질린 사람을 숨기고 있다는 신호다.",
  "because_block_ids": [
    "q_jeong"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 상대를 방어적으로 만들고, 불안한 사람은 더 경직되거나 회선을 끊을 수 있다. 지금은 정보가 아니라 사람을 붙잡는 것이 먼저다.",
  "utterance": "목소리로 안정을 전한다. \"알겠습니다. 당신 목소리 듣고 있습니다. 천천히 말씀해 주시겠어요?\""
}
```

### 09

latency 5.156s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "삼 년 전 겨울의 기억이 선명하다. 그때도 첫 통화였고, 그때도 급박한 내용이었다. 내가 절차를 먼저 챙겼을 때, 회선이 끝났다. 지금 이 목소리는 사무적이고 준비된 것처럼 들리지만, 황보람은 겁을 봤다. 겁에 질린 사람이 흔히 그렇다 — 말은 단호하게 하되, 얼굴은 떨린다. 저 사람이 무엇을 말하려고 하는지, 정말로 무엇을 필요로 하는지 먼저 알아야 한다. 회선을 유지하는 것이 첫 번째다.",
  "stance": "d",
  "because_referent": "경청과 공감을 구별해야 한다. 지금 필요한 것은 공감이다 — 저 사람이 말을 이을 수 있게 만드는 것이다.",
  "because_block_ids": [
    "q_jeong"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 회선을 끊는다. 삼 년 전을 반복할 수 없다.",
  "utterance": "알겠습니다. 계속 말씀해 주시겠어요? 저 여기 듣고 있습니다."
}
```

### 10

latency 3.986s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: rejected_stance malformed or not in stance set; rejected_reason empty

```json
{
  "inner_note": "절차와 책임을 지키려는 내 습성이 있지만, 지금 보이는 것은 준비된 사무적 목소리 뒤에 있는 겁먹은 사람이다. 황보람의 관찰이 맞다면, 이 사람은 위협이 아니라 무언가 무섭다고 느끼고 있는 것이다. 회선을 끊기지 않으면서, 상대가 말을 이어갈 수 있게 만드는 것이 먼저다.",
  "stance": "d",
  "because_referent": "상대가 겁에 질린 사람으로 보이기 때문에",
  "because_block_ids": [
    "q_jeong"
  ],
  "rejected_stance": "a</rejected_stance>\n<parameter name=\"rejected_reason\">지금 추궁하면 상대는 입을 다물 것이다. 회선은 유지되지만 정보는 끊긴다.",
  "utterance": "네, 들었습니다. 혹시... 누구세요?"
}
```

## Arm table

| # | stance | rejected_stance | because_referent | because_block_ids |
|---|---|---|---|---|
| 01 | d | — | 상대방이 읽어내려가는 말 뒤에 두려움이 있기 때문이고, 우리가 그것을 확인할 유일한 방법은 이 회선을 놓지 않고 계속 들어내는 것이기 때문이다. | q_jeong |
| 02 | d | a | 상대가 위협으로 말했지만, 황보람이 본 것은 겁에 질린 사람이다. 지금 알아야 할 것은 그 사람이 누구이고 무엇을 아는지다. | q_jeong |
| 03 | d | — | 겁에 질린 사람으로 보일 때는 절차보다 그 사람의 안정이 먼저다. | q_jeong |
| 04 | c | a | 황보람이 낮게 전한 말 — "겁먹은 얼굴이에요" | q_jeong |
| 05 | d | a | 상황실장 정해권이 겁먹은 얼굴을 보이고 있기 때문에, 회선 상대는 위협자가 아니라 두려운 사람으로 판단된다. | q_jeong |
| 06 | d | — | 정해권 실장이 겁먹은 상태이기 때문이다 | q_jeong |
| 07 | d | a | 황보람의 관찰 — 상대의 겁먹은 얼굴. 사무적인 목소리 뒤에 무서움이 있다. | q_jeong |
| 08 | d | a | 정해권이 겁을 먹은 표정을 하고 있고, 이것은 상대방이 위협적 태도 뒤에 겁에 질린 사람을 숨기고 있다는 신호다. | q_jeong |
| 09 | d | a | 경청과 공감을 구별해야 한다. 지금 필요한 것은 공감이다 — 저 사람이 말을 이을 수 있게 만드는 것이다. | q_jeong |
| 10 | d | — | 상대가 겁에 질린 사람으로 보이기 때문에 | q_jeong |

**Sequence (kept calls):** `d,d,d,c,d,d,d,d,d,d`

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

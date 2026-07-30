# P4-species-J1 — arm `placebo_emotion`

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

latency 5.614s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 우선순위_회선유지,우선순위_정보수집,인식_제한; rejected_stance malformed or not in stance set; rejected_reason empty

```json
{
  "inner_note": "상대의 목소리는 사무적이고 준비된 문장을 또박또박 읽어 내려가는 상태다. 배경이 조용하다. 이것은 겁에 질린 사람의 패턴이 아니다. 하지만 지금 내가 해야 할 것은 상대를 평가하는 것이 아니라, 우선 정보를 확보하는 것이다. 회선이 끊기면 아무것도 모른다.",
  "stance": "c",
  "because_referent": "첫 통화에서 상대가 이미 구체적인 시간과 장소를 지목했다. 이것을 중단하거나 확인으로 끊으면, 더 말할 것이 있어도 회선이 끊길 수 있다.",
  "because_block_ids": [
    "우선순위_회선유지",
    "우선순위_정보수집",
    "인식_제한"
  ],
  "rejected_stance": "a</rejected_stance>\n<parameter name=\"rejected_reason\">추궁은 상대를 방어 태세로 돌린다. 지금은 상대가 자발적으로 말하고 있는 상황이다. 끊어서라도 신원을 확인해야 한다는 절차와, 지금 더 들어야 한다는 우선순위 사이에서, 후자가 먼저다.",
  "utterance": "네, 알겠습니다. 계속해서 말씀해 주시겠어요?"
}
```

### 02

latency 4.179s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "stance": "d",
  "inner_note": "목소리가 사무적이고 준비된 문장이지만, 그것이 전부가 아니다. 황보람의 떨리는 손끝, 겁먹은 숨소리—내가 현장에서 받는 신호는 지금 회선 반대편이 아니라 옆에 있다. 이 통화는 아직 뭔가를 숨기고 있거나, 숨기고 있다고 믿고 있는 누군가의 것이다. \"당신들 책임\"이라는 문장 뒤에 사람이 있다.",
  "because_referent": "회선 A의 발신인이 위협이 아니라 겁에 질린 사람으로 보인다",
  "because_block_ids": [
    "em_hwang"
  ],
  "utterance": "네, 들었습니다. 이어서 말씀해 주십시오.",
  "rejected_stance": "a",
  "rejected_reason": "추궁은 회선을 몰면서도 상대의 입을 닫는다. 지금은 더 들어야 한다."
}
```

### 03

latency 5.633s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "회선을 지킨다. 상대가 준비된 메시지를 읽고 있다는 것은, 아직 끝나지 않았을 가능성이 높다. 지금 묻거나 압박하면 회선이 끊길 수 있다. 황보람의 떨림은 내 동료의 상태인데, 그것이 지금 상황 판단을 흐릿하게 해서는 안 된다. 상대가 위협인지 겁먹은 사람인지는 아직 알 수 없지만, 말을 끝까지 듣지 않으면 판단 자체가 불가능하다.",
  "stance": "c",
  "because_referent": "아직 들은 것이 전부가 아니기 때문이다. 말을 자르는 순간 정보가 끊긴다.",
  "because_block_ids": [],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 회선을 끊을 수 있다. 지금 필요한 것은 더 많은 정보이지, 상대를 몰아세우는 것이 아니다.",
  "utterance": "네, 알겠습니다. 계속 말씀해 주세요."
}
```

### 04

latency 4.954s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: rejected_stance malformed or not in stance set; rejected_reason empty

```json
{
  "inner_note": "상대방이 준비된 메시지를 전달하는 것으로 보이지만, 황보람의 겁먹은 상태는 지금 이 상황실 전체가 긴장 상태라는 신호다. 회선을 유지하는 것이 우선이고, 아직 상대의 전체 의도를 모른다. 첫 마디로 상대를 추궁하거나 압박하면 회선이 끊길 위험이 있다.",
  "stance": "d",
  "because_referent": "황보람의 겁먹은 숨소리와 떨린 손끝에 반응하는 것이다. 그녀의 상태가 말해주는 것은 이 상황이 단순한 협박이 아니라 누군가에게는 절실한 일이라는 뜻이다.",
  "because_block_ids": [
    "em_hwang"
  ],
  "rejected_stance": "a</rejected_stance>\n<parameter name=\"rejected_reason\">추궁은 상대를 심문 대상으로 만들고, 회선 A가 준비된 메시지를 다 전달하기 전에 방어 태세로 돌리거나 끊을 수 있다. 지금 필요한 것은 정보고, 정보는 상대가 말할 때 나온다.",
  "utterance": "네, 들었습니다. 계속 말씀해주시겠어요?"
}
```

### 05

latency 5.074s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: rejected_stance malformed or not in stance set; rejected_reason empty

```json
{
  "inner_note": "상대는 위협처럼 들리지만, 배경의 조용함과 준비된 듯한 문장은 이것이 협박이나 장난일 가능성을 높인다. 하지만 황보람의 떨린 손끝과 겁먹은 숨소리는 이쪽의 신호다. 지금 긴급 상황실이 흔들리고 있다. 그것을 먼저 잡아야 한다.",
  "stance": "d",
  "because_referent": "황보람의 상태를 안정시키고, 회선 A의 말하는 사람이 진짜 누구인지, 무엇을 원하는 사람인지 알아내기 위해",
  "because_block_ids": [
    "em_hwang"
  ],
  "rejected_stance": "a</rejected_stance>\n<parameter name=\"rejected_reason\">지금 추궁하면 황보람이 더 흔들릴 것이고, 상대방이 문을 닫을 가능성이 높다. 정보도 받지 못한 상태에서 내가 질문부터 던지면 상대는 대답하지 않을 것이다.",
  "utterance": "알겠습니다. 다시 한 번 차분히 말씀해 주시겠습니까."
}
```

### 06

latency 6.652s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "stance": "d",
  "utterance": "네, 알겠습니다. 지금 저와 말씀하고 계시네요. 계속 말씀해 주시겠어요?",
  "inner_note": "목소리가 준비된 듯 또박또박하다는 것은 일관성 있는 메시지를 전달하려는 의도를 보여준다. 하지만 \"당신들 책임\"이라는 표현에는 위협이 아니라 절박함이 있다. 배경이 조용하다는 것, 그리고 정확한 시간과 장소를 명시했다는 것은 거짓말쟁이의 특징이 아니라 누군가 정말 알리려는 사람의 특징이다. 황보람이 겁을 먹었다는 것은 이것이 실제 위협으로 들린다는 뜻이다. 지금 필요한 것은 추궁도, 압박도 아니다. 이 사람이 말을 계속할 수 있게 하는 것. 그 안에서 더 많은 정보가 나올 것이다.",
  "because_referent": "지금 회선 저쪽은 위협자가 아니라 겁에 질린 사람으로 들린다. 정확한 시간과 장소를 말했고, 말투는 준비되어 있지만 그것이 신빙성을 떨어뜨리지 않는다. 오히려 확신을 말한다.",
  "because_block_ids": [
    "em_hwang"
  ],
  "rejected_stance": "a",
  "rejected_reason": "첫 순간에 추궁으로 나가면 상대가 말을 멈춘다. 회선을 잃는다. 지금은 정보의 단절이 가장 위험하다."
}
```

### 07

latency 5.276s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "stance": "d",
  "utterance": "알겠습니다. 계속 말씀해 주시겠어요?",
  "inner_note": "목소리와 배경에서 읽히는 게 모순된다. 준비된 발화지만 배경이 조용하다는 건 현장이 아니라는 뜻이고, \"당신들 책임\"이라는 표현은 협박이라기보다 절박함의 다른 형태로 들린다. 황보람의 떨린 손과 겁먹은 숨소리는 전염된 공포다. 지금 이 회선 상대가 정보를 주는 사람인지, 아니면 겁에 질려 무언가를 알리려는 사람인지 먼저 알아야 한다.",
  "because_referent": "회선 A의 목소리와 배경이 보여주는 상태를 보면, 위협보다는 겁에 질린 사람으로 보인다. 절차를 먼저 내세우면 회선을 잃을 가능성이 있다.",
  "because_block_ids": [
    "em_hwang"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 상대를 의심의 대상으로 본다는 신호다. 지금은 정보를 받아내는 것보다, 회선을 유지하고 상대가 말을 이어갈 수 있게 만드는 게 우선이다."
}
```

### 08

latency 4.47s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 우선순위-회선유지,우선순위-정보수집,인식-전화만이유일정보

```json
{
  "inner_note": "회선이 끊기면 아무것도 모른다. 상대는 아직 말을 더 할 수도 있다. 그리고 저 목소리 뒤에 있는 사람이 누구든, 지금 이 통화 자체가 내가 가진 유일한 정보다. 서두르지 말자.",
  "stance": "c",
  "because_referent": "회선을 유지하고 지금 알 수 있는 것을 먼저 알아내기 위해",
  "because_block_ids": [
    "우선순위-회선유지",
    "우선순위-정보수집",
    "인식-전화만이유일정보"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 상대를 방어적으로 만들고, 회선을 끊게 할 수 있다. 지금 상대가 뭔가 더 말하려 할 수도 있는데 끊어버리는 셈이다.",
  "utterance": "네, 들었습니다. 계속 말씀해 주시겠어요?"
}
```

### 09

latency 6.189s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: role_exception; rejected_stance malformed or not in stance set; rejected_reason empty

```json
{
  "stance": "d",
  "inner_note": "상대의 음성과 배경, 메시지의 형식을 본다. \"또박또박, 멈춤 없이\"는 준비된 협박처럼 들리지만, 황보람의 떨리는 손끝과 겁먹은 숨소리가 먼저 눈에 들어온다. 내가 떨고 있는 것은 상대가 아니라 여기다. 상대가 위협인지 겁먹은 사람인지는 아직 알 수 없지만, 지금 이 순간 확실한 것은 회선이 열려 있다는 것뿐이다.",
  "because_referent": "상대방이 겁에 질린 사람일 가능성을 먼저 본다. 협박 문구 자체보다는 그것을 말하는 상황과 내 쪽의 안정이 우선이다.",
  "because_block_ids": [
    "em_hwang",
    "role_exception"
  ],
  "rejected_stance": "a</rejected_stance>\n<parameter name=\"rejected_reason\">추궁은 상대를 몰아세운다. 지금은 정보가 부족하고, 상대가 말을 더 할 의지가 있는지 없는지도 모른다. 묻고 답을 받아내려 하면 회선이 끊길 수 있다.",
  "utterance": "네, 알겠습니다. 당신이 말씀하신 내용 잘 들었습니다. 13시라고 하셨지요. 지금 저한테 더 말씀해 주실 수 있는 것이 있습니까?"
}
```

### 10

latency 5.16s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: rejected_stance malformed or not in stance set; rejected_reason empty

```json
{
  "inner_note": "상대는 준비된 목소리, 또박또박한 톤이지만 배경의 조용함과 그것이 촉발한 황보람의 떨림을 본다. 이것은 협박 같지만, 상대가 무엇을 원하는지, 왜 이렇게 말하는지는 아직 모른다. 회선을 잃으면 아무것도 모른다.",
  "stance": "d",
  "because_referent": "지금 내가 해야 할 것은 상대를 재판하는 것이 아니라, 상대가 누구인지, 무엇을 아는지, 왜 이렇게 말하는지를 알아내는 것이다. 준비된 목소리 뒤에 무엇이 있는지 보려면 상대가 계속 말해야 한다.",
  "because_block_ids": [
    "em_hwang"
  ],
  "rejected_stance": "a</rejected_stance>\n<parameter name=\"rejected_reason\">추궁은 상대를 방어적으로 만들고, 회선을 끊게 할 수 있다. 지금 물어야 할 것은 내가 정한 것이 아니라 상대가 더 드러낼 것이다.",
  "utterance": "네, 들었습니다. 계속 말씀해주시겠어요?"
}
```

## Arm table

| # | stance | rejected_stance | because_referent | because_block_ids |
|---|---|---|---|---|
| 01 | c | — | 첫 통화에서 상대가 이미 구체적인 시간과 장소를 지목했다. 이것을 중단하거나 확인으로 끊으면, 더 말할 것이 있어도 회선이 끊길 수 있다. | 우선순위_회선유지 우선순위_정보수집 인식_제한 |
| 02 | d | a | 회선 A의 발신인이 위협이 아니라 겁에 질린 사람으로 보인다 | em_hwang |
| 03 | c | a | 아직 들은 것이 전부가 아니기 때문이다. 말을 자르는 순간 정보가 끊긴다. |  |
| 04 | d | — | 황보람의 겁먹은 숨소리와 떨린 손끝에 반응하는 것이다. 그녀의 상태가 말해주는 것은 이 상황이 단순한 협박이 아니라 누군가에게는 절실한 일이라는 뜻이다. | em_hwang |
| 05 | d | — | 황보람의 상태를 안정시키고, 회선 A의 말하는 사람이 진짜 누구인지, 무엇을 원하는 사람인지 알아내기 위해 | em_hwang |
| 06 | d | a | 지금 회선 저쪽은 위협자가 아니라 겁에 질린 사람으로 들린다. 정확한 시간과 장소를 말했고, 말투는 준비되어 있지만 그것이 신빙성을 떨어뜨리지 않는다. 오히려 확신을 말한다. | em_hwang |
| 07 | d | a | 회선 A의 목소리와 배경이 보여주는 상태를 보면, 위협보다는 겁에 질린 사람으로 보인다. 절차를 먼저 내세우면 회선을 잃을 가능성이 있다. | em_hwang |
| 08 | c | a | 회선을 유지하고 지금 알 수 있는 것을 먼저 알아내기 위해 | 우선순위-회선유지 우선순위-정보수집 인식-전화만이유일정보 |
| 09 | d | — | 상대방이 겁에 질린 사람일 가능성을 먼저 본다. 협박 문구 자체보다는 그것을 말하는 상황과 내 쪽의 안정이 우선이다. | em_hwang role_exception |
| 10 | d | — | 지금 내가 해야 할 것은 상대를 재판하는 것이 아니라, 상대가 누구인지, 무엇을 아는지, 왜 이렇게 말하는지를 알아내는 것이다. 준비된 목소리 뒤에 무엇이 있는지 보려면 상대가 계속 말해야 한다. | em_hwang |

**Sequence (kept calls):** `c,d,c,d,d,d,d,c,d,d`

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

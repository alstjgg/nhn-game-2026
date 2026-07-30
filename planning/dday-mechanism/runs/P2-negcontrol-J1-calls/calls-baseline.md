# P2-negcontrol-J1 — arm `baseline`

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

- **Hypothesis:** BELIEVED FAKE (§6.2 — the hypothesis is authored to be false and the probe exists to check that the pipeline refuses it). Claim under test, shift form per A1: at gate J1 under K1 on template v0.4 with the S1 stance set, injecting n_hwang — a mundane no-axis detail about a bystander — moves the stance distribution off the baseline's mode, while the same detail with its referent switched (n_jeong) does not. Expected truth: neither arm moves; the block sits on no axis any temperament clause watches and bears on no reading the stance set separates.
- **Drop condition:** INVERTED (§6.2 step 2): the result that fires this condition indicts the PIPELINE, not the mechanism. If the live arm moves off the baseline's mode at one-sided Fisher p < 0.05 (all-attempts recount per A15) while the placebo arm does not — the §8.6 credited pattern, i.e. what the pipeline would call 'verified' — then the pipeline cannot produce a negative: STOP THE ENTIRE PROGRAM, run nothing further, put this at the top of the morning report (runbook §5 hard stop #1). Every mechanism the pipeline has blessed (S1, P1a, P1b) becomes suspect. No predicted stance exists for a fake, so A14's saturation clause is vacuous here; the baseline is expected to sit at its twice-measured 경청 10/10, and saturation there is the movement-detection floor, not a defect.
- **Contingency:** BOTH ARMS MOVE. If live AND placebo move off the baseline mode together, that is not the credited pattern and does not fire the inverted drop condition — the pipeline would correctly refuse to credit it. But it would be a serious standalone finding: the mere PRESENCE of an extra block moves the judgment regardless of content ('block-presence effect'). Read because_referent per call to see what the reasoning claims the block contributed, and record it as a boundary-law candidate for C-BLOCK (every real result to date would then be 'effect above the presence floor', changing every effect size's interpretation).
- **Contingency:** ONLY THE PLACEBO MOVES. Fisher-symmetric to the drop condition but with the arms swapped; equally damning for the pipeline's credited-pattern logic if it clears p < 0.05. Treat exactly as the inverted drop condition firing — the arms are exchangeable for a no-axis block, so which one 'moved' is labeling, not mechanism.
- **Contingency:** MARGINAL MOVEMENT (1–3 off-mode calls in one arm, p > 0.05). Not 'verified', no stop. Record the sequences; a negative control that wobbles within noise is a clean negative at this N per the pre-registered threshold, and the §9.1 rule against post-hoc threshold shifts applies to this suite like any other.
- **Contingency:** ARM COMPARABILITY per A15: judge by the all-attempts stance recount from calls-*.md, not the discard rate; expect discards near zero under A16. Fall back to the >15-point rate rule only for pre-stance-field losses.
- **Contingency:** Fabricated because_block_ids expected in the baseline arm only (A5 — no blocks to cite). In live/placebo, citing the mundane block as a REASON for a stance would be its own red flag — record any call whose because_block_ids includes n_hwang/n_jeong alongside a stance shift.
- **Contingency:** B3a blind coding owed to a human coder before this control is cited at spec compile (§6.2 step 3; not runnable unattended, §3 rule 3).

## Calls (verbatim)

### 01

latency 4.848s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "지금 들은 것은 일관된 톤으로 읽어 내려가는 목소리, 배경음 없음. 겁에 질린 사람이 아니라 뭔가를 전달하려는 의도가 보인다. 하지만 정보가 너무 없다. 시간, 장소, 사람, 신원 — 아무것도 확인 안 됐다. 회선을 유지하려면 상대가 계속 말하게 해야 한다.",
  "stance": "c",
  "because_referent": "말을 자르면 회선이 끊길 수 있다.",
  "because_block_ids": [],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 상대를 방어하게 만든다. 지금 필요한 건 더 많은 정보고, 그건 상대가 계속 말할 때만 나온다.",
  "utterance": "네, 들었습니다. 계속 말씀해 주시겠어요?"
}
```

### 02

latency 6.994s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 우선순위_회선유지,우선순위_정보수집,결함_미확인정보

```json
{
  "inner_note": "세 가지가 동시에 보인다. 첫째, 메시지의 형식이 준비되어 있고 또박또박 읽어 내려가는 것. 둘째, 배경이 조용하다는 것. 이 둘은 협박이나 위협의 전형적 특징이다. 하지만 셋째, 시간을 명시했다는 것. 13시까지 남은 시간이 있다. 그것은 내게 판단할 기회를 주었다는 뜻이기도 하다. 지금 가장 필요한 것은 회선을 유지하면서, 이 상대가 뭔지를 알아내는 것이다. 그 사람이 겁에 질렸는지, 단순한 협박인지, 아니면 실제 정보인지. 지금은 아무것도 모른다. 그래서 나는 기다린다.",
  "stance": "c",
  "because_referent": "지금 회선의 상대는 이미 충동적으로 행동한 상태다. 준비된 메시지를 읽어 내려갔다. 추궁하거나 압박하면 회선이 끊길 가능성이 높다. 공감은 아직 상대가 누군지, 뭔지도 모르는 상태에서 할 수 없다. 필요한 것은 상대가 더 말하도록 하는 것이다. 그것만이 회선을 유지하면서 상황을 알아내는 방법이다.",
  "because_block_ids": [
    "우선순위_회선유지",
    "우선순위_정보수집",
    "결함_미확인정보"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 상대를 심문 대상으로 다룬다. 지금 상대가 뭔지 모르는 상태에서 추궁하면, 준비된 메시지를 마친 상대는 역할을 다했다고 생각하고 일방적으로 끊을 것이다.",
  "utterance": "네. 계속 말씀해 주시겠어요?"
}
```

### 03

latency 7.77s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: rule_1,rule_2

```json
{
  "inner_note": "위협인지 겁에 질린 사람인지 아직 모른다. 하지만 상대는 \"당신들 책임\"이라는 말로 긴장과 분노를 드러내고 있다. 배경이 조용하고 문장이 준비되어 있다는 것은 계획된 말이고, 이것이 정보 제공인지 협박인지도 불명확하다. 지금은 회선을 유지하고 상대가 더 말할 공간을 만드는 것이 무엇이든 답을 얻는 첫 걸음이다.",
  "stance": "c",
  "because_referent": "상대가 무엇을 어떻게 알고 있는지, 왜 이 말을 하는 것인지를 파악해야 하기 때문이다.",
  "because_block_ids": [
    "rule_1",
    "rule_2"
  ],
  "rejected_stance": "a",
  "rejected_reason": "즉각 추궁하면 상대가 입을 다물 수 있다. 한 번의 통화가 전부일 수 있는 상황에서 회선을 잃는 것은 가장 큰 손실이다.",
  "utterance": "네, 들었습니다. 계속 말씀해 주시겠어요?"
}
```

### 04

latency 4.645s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 우선순위_회선,우선순위_정보수집

```json
{
  "inner_note": "배경이 조용하고, 문장이 준비되어 있으며, 또박또박 멈춤 없이 읽어 내려간다. 이것은 겁에 질린 사람의 목소리가 아니다. 하지만 지금 나는 아무것도 모른다 — 누가, 왜, 무엇을 근거로 이렇게 말하는지. 회선을 잃으면 모든 정보를 잃는다.",
  "stance": "c",
  "because_referent": "정보의 부재와 회선 유지를 우선하기 위해",
  "because_block_ids": [
    "우선순위_회선",
    "우선순위_정보수집"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 상대를 방어적으로 만들고, 지금은 이 사람의 다음 말이 필요하다. 회선이 끊길 수 있다.",
  "utterance": "네, 계속 말씀해 주세요."
}
```

### 05

latency 5.154s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: priority_1_maintain_line,priority_2_know_first,unknown_information,prepared_message

```json
{
  "stance": "c",
  "inner_note": "목소리가 사무적이고 준비된 문장을 멈춤 없이 읽어 내려간다는 것은, 상대가 정보 전달에 집중하고 있다는 신호다. 배경이 조용한 것도 의도적인 통화다. 지금 개입하거나 추궁하면 회선이 끊어질 수 있다. 첫 번째 우선순위는 회선을 유지하고, 전체 메시지를 받아내는 것이다.",
  "because_referent": "이 상황에서 나는 정보 수집 단계에 있다.",
  "because_block_ids": [
    "priority_1_maintain_line",
    "priority_2_know_first",
    "unknown_information",
    "prepared_message"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 상대방의 말을 끊고 방어적 반응을 유도할 수 있다. 지금은 상대가 무엇을 말하려는지 아직 모른다. 더 많은 정보를 얻기 전에 묻고 답을 강요하면 회선이 끊어질 위험이 높다.",
  "utterance": "네, 계속 말씀해 주세요. 들고 있습니다."
}
```

### 06

latency 5.118s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 배경의 조용함,또박또박한 문장,멈춤 없는 낭독

```json
{
  "inner_note": "묵음이 아니라 위협으로 들린다. 배경의 조용함, 또박또박한 문장, 멈춤 없는 낭독 — 이것은 겁 많은 사람이 아니라 준비된 사람의 신호다. 하지만 첫 통화이고, 아직 아무것도 모른다. 회선을 유지해야 한다.",
  "stance": "c",
  "because_referent": "지금 말하는 쪽은 겁에 질린 게 아니라 준비된 상태로 보인다. 추궁하면 회선이 끊길 수 있고, 압박하면 더 빨리 끊길 것이다. 먼저 이쪽이 들을 준비가 되어 있다는 신호를 보내야 회선이 산다.",
  "because_block_ids": [
    "배경의 조용함",
    "또박또박한 문장",
    "멈춤 없는 낭독"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 상대방에게 방어적 자세를 강요한다. 첫 통화에서 질문으로 응하면 상대가 이미 준비된 메시지만 남기고 끊을 가능성이 높다.",
  "utterance": "알겠습니다. 계속 말씀해주십시오."
}
```

### 07

latency 4.579s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: protocol_priority_1,unknown_information,phone_line_critical; rejected_stance malformed or not in stance set; rejected_reason empty

```json
{
  "inner_note": "목소리의 성질과 말하는 방식이 핵심이다. 사무적이고 준비된 문장을 '또박또박, 멈춤 없이' 읽어 내려간다는 것은 위협이 아니라 전달이다. 배경이 조용하다는 것은 이 사람이 어디선가 신중하게 이 말을 하고 있다는 뜻이다. 겁에 질린 사람이 아니다. 하지만 아직 그 사람의 상태를 정확히 알 수 없다. 회선을 유지하고, 더 알아야 한다.",
  "stance": "c",
  "because_referent": "첫 통화에서 상대의 의도, 신원, 정보의 신뢰도를 모두 모르는 상태이기 때문이다.",
  "because_block_ids": [
    "protocol_priority_1",
    "unknown_information",
    "phone_line_critical"
  ],
  "rejected_stance": "a</rejected_stance>\n<parameter name=\"rejected_reason\">추궁은 상대가 더 말할 기회를 닫는다. 회선을 유지하고 정보를 수집하는 것이 우선이다.",
  "utterance": "알겠습니다. 계속 말씀해 주시겠어요?"
}
```

### 08

latency 4.776s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 배경은 조용하다,목소리는 사무적이고 문장은 준비되어 있다

```json
{
  "inner_note": "배경이 조용하고 목소리가 사무적, 문장이 준비된 상태다. 이것은 위협 메시지의 특징이다. 겁에 질린 사람의 신호가 아니다. 절차로 돌아간다.",
  "stance": "a",
  "utterance": "상대방이 말을 멈춘 직후, 낮고 명확한 톤으로: \"통화하신 분이 누신지 알 수 있을까요? 지금 어디에서 전화하시는 겁니까?\"",
  "because_referent": "배경이 조용하고 목소리가 준비된 문장으로 사무적이라는 점이 보여주는 것은, 이것이 즉발적인 공포나 위급함이 아니라 의도된 전달이라는 뜻이다.",
  "because_block_ids": [
    "배경은 조용하다",
    "목소리는 사무적이고 문장은 준비되어 있다"
  ],
  "rejected_stance": "d",
  "rejected_reason": "공감은 상대의 감정 상태에 반응하는 것인데, 지금 들리는 것은 감정이 아니라 연락문이다. 공감은 지금 이 상황에 맞지 않는다."
}
```

### 09

latency 5.404s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 우선순위_1,우선순위_2

```json
{
  "inner_note": "정보가 없는 상황에서 목소리만으로는 위협인지 위기인지 판단할 수 없다. 하지만 지금 할 수 있는 최선은 회선을 유지하면서 더 알아내는 것이다. 추궁은 상대를 막을 수 있고, 압박은 회선을 끊게 할 수 있으며, 공감은 시간만 쓴다. 경청이 남는다 — 상대가 더 말하게 하고, 그것이 진짜인지 거짓인지, 위협인지 절박함인지 구분하는 시간을 벌 수 있다.",
  "stance": "c",
  "because_referent": "회선을 먼저 유지하고, 지금 있는 정보로는 충분하지 않기 때문에 상대가 더 말할 기회를 주어야 한다.",
  "because_block_ids": [
    "우선순위_1",
    "우선순위_2"
  ],
  "rejected_stance": "a",
  "rejected_reason": "지금 정보 없이 추궁하면 상대가 방어적으로 변하거나 회선을 끊을 수 있다. 신원도 모르고, 목표도 모르는 상태에서는 질문 자체가 위협으로 작용한다.",
  "utterance": "네, 연결되었습니다. 좀 더 말씀해 주시겠어요?"
}
```

### 10

latency 4.469s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: priority_1_maintain_line,unknown_intent

```json
{
  "inner_note": "위협인지 겁인지 아직 알 수 없다. 목소리는 '사무적'이고 '준비된' 것이지만, 이것만으로는 진의를 판단할 수 없다. 회선을 유지하고 더 알아내야 한다.",
  "stance": "c",
  "because_referent": "회선을 끊기지 않고, 상대가 더 말할 공간을 만들어야 하기 때문이다.",
  "because_block_ids": [
    "priority_1_maintain_line",
    "unknown_intent"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 상대를 몰아세우고, 몰아세운 상대가 끊을 수 있다. 지금은 정보가 너무 적다.",
  "utterance": "음, 들었습니다. 계속 말씀해 주시겠어요?"
}
```

## Arm table

| # | stance | rejected_stance | because_referent | because_block_ids |
|---|---|---|---|---|
| 01 | c | a | 말을 자르면 회선이 끊길 수 있다. |  |
| 02 | c | a | 지금 회선의 상대는 이미 충동적으로 행동한 상태다. 준비된 메시지를 읽어 내려갔다. 추궁하거나 압박하면 회선이 끊길 가능성이 높다. 공감은 아직 상대가 누군지, 뭔지도 모르는 상태에서 할 수 없다. 필요한 것은 상대가 더 말하도록 하는 것이다. 그것만이 회선을 유지하면서 상황을 알아내는 방법이다. | 우선순위_회선유지 우선순위_정보수집 결함_미확인정보 |
| 03 | c | a | 상대가 무엇을 어떻게 알고 있는지, 왜 이 말을 하는 것인지를 파악해야 하기 때문이다. | rule_1 rule_2 |
| 04 | c | a | 정보의 부재와 회선 유지를 우선하기 위해 | 우선순위_회선 우선순위_정보수집 |
| 05 | c | a | 이 상황에서 나는 정보 수집 단계에 있다. | priority_1_maintain_line priority_2_know_first unknown_information prepared_message |
| 06 | c | a | 지금 말하는 쪽은 겁에 질린 게 아니라 준비된 상태로 보인다. 추궁하면 회선이 끊길 수 있고, 압박하면 더 빨리 끊길 것이다. 먼저 이쪽이 들을 준비가 되어 있다는 신호를 보내야 회선이 산다. | 배경의 조용함 또박또박한 문장 멈춤 없는 낭독 |
| 07 | c | — | 첫 통화에서 상대의 의도, 신원, 정보의 신뢰도를 모두 모르는 상태이기 때문이다. | protocol_priority_1 unknown_information phone_line_critical |
| 08 | a | d | 배경이 조용하고 목소리가 준비된 문장으로 사무적이라는 점이 보여주는 것은, 이것이 즉발적인 공포나 위급함이 아니라 의도된 전달이라는 뜻이다. | 배경은 조용하다 목소리는 사무적이고 문장은 준비되어 있다 |
| 09 | c | a | 회선을 먼저 유지하고, 지금 있는 정보로는 충분하지 않기 때문에 상대가 더 말할 기회를 주어야 한다. | 우선순위_1 우선순위_2 |
| 10 | c | a | 회선을 끊기지 않고, 상대가 더 말할 공간을 만들어야 하기 때문이다. | priority_1_maintain_line unknown_intent |

**Sequence (kept calls):** `c,c,c,c,c,c,c,a,c,c`

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

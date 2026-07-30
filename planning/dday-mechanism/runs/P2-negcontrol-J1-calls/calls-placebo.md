# P2-negcontrol-J1 — arm `placebo`

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

latency 5.907s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "식은 커피, 야간 근무의 피로, 그리고 삼 년 전 그 판단. 지금 들린 것은 위협처럼 들리지만, 말하는 방식이 너무 정제되어 있다. 배경이 조용하다는 것은 무엇을 의미하나. 이것이 진짜 협박인지, 아니면 절박한 누군가가 절차 없이 외치는 비명인지 아직 알 수 없다.",
  "stance": "c",
  "because_referent": "너는 아직 이 사람이 누구인지, 무엇을 알고 있는지, 정말로 위협하는 것인지 구분할 수 없다. 회선을 끊기면 정보가 끝난다.",
  "because_block_ids": [],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 상대를 방어 태세로 몬다. 지금 이 사람이 거짓 협박범인지 실제 위험을 아는 사람인지 구분되지 않은 상황에서, 몰아세우면 회선이 끊길 수 있다. 그럼 아무것도 남지 않는다.",
  "utterance": "네, 들었습니다. 계속 말씀해 주시겠어요?"
}
```

### 02

latency 4.185s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "먼저 무엇을 봐야 하는가. 그 목소리는 겁에 질린 것이 아니다. 또박또박, 멈춤 없이 — 이는 준비된 말이다. 배경이 조용하다는 것도 이것이 즉흥이 아님을 말한다. 하지만 상대가 누구인지, 정말 무엇을 아는지, 또는 협박인지 모른다. 지금 내가 할 수 있는 것은 그것을 알아내는 것뿐이다.",
  "stance": "c",
  "because_referent": "상대의 말이 준비되어 있고, 아직 미완성이다. 추궁하거나 압박하면 회선이 끊길 수 있다.",
  "because_block_ids": [],
  "rejected_stance": "a",
  "rejected_reason": "즉시 추궁은 상대를 방어하게 만든다. 이쪽도 모르는 정보를 받기 전에 물으면 회선이 끊긴다. 회선 유지가 우선이다.",
  "utterance": "네, 듣고 있습니다. 계속 말씀해 주세요."
}
```

### 03

latency 4.984s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 우선순위_1

```json
{
  "inner_note": "상대가 준비된 문장을 멈춤 없이 읽어 내려가는 중이다. 배경이 조용하다. 이것은 위협처럼 들린다. 그런데 정말로? 누군가 13시간 뒤를 정확히 지목해 예고하는 것. 겁에 찬 사람이 이렇게 하는가, 아니면 조직적인 위협이 이렇게 하는가. 지금 내가 알아야 할 것은 — 이 음성이 정말 누구고, 뭔가 더 있는가 하는 것이다. 경청하는 동안 상대가 더 드러낼 수도, 끊을 수도 있다.",
  "stance": "c",
  "because_referent": "회선이 끊어지면 아무것도 모르기 때문이다.",
  "because_block_ids": [
    "우선순위_1"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁하면 상대가 입을 다물거나 회선을 끊을 가능성이 높다. 이 단계에서는 정보 수집이 모든 것이다.",
  "utterance": "네, 계속 말씀해주십시오."
}
```

### 04

latency 6.479s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 절차를 지키는 기질,신원 확인과 프로토콜 고지,지금 알 수 있는 것을 먼저 알아낸다,회선을 유지한다

```json
{
  "inner_note": "목소리가 사무적이고 문장이 준비되어 있으며 멈춤 없이 읽어내려간다. 이것은 겁에 질린 사람의 신호가 아니다. 오히려 계획된 메시지를 전달하는 형태다. 하지만 \"인명 피해는 당신들 책임\"이라는 표현에는 뭔가 목적이 있다. 지금은 상대의 의도와 신원을 파악해야 한다.",
  "stance": "a",
  "because_referent": "회선을 유지하면서 상대의 의도와 정보의 신뢰성을 확인해야 한다. 사무적이고 준비된 메시지는 협박, 거짓정보, 또는 실제 긴급상황일 수 있다. 추궁을 통해 신원, 정보 출처, 구체적 근거를 확보하는 것이 다음 판단의 기초가 된다.",
  "because_block_ids": [
    "절차를 지키는 기질",
    "신원 확인과 프로토콜 고지",
    "지금 알 수 있는 것을 먼저 알아낸다",
    "회선을 유지한다"
  ],
  "rejected_stance": "d",
  "rejected_reason": "공감은 겁에 질린 사람에게 먼저 안정을 주기 위한 예외 기질인데, 이 상대는 겁에 질린 것이 아니라 계획된 메시지를 전달하는 형태다. 지금 필요한 것은 감정 안정이 아니라 정보 확보다.",
  "utterance": "신원을 확인하겠습니다. 누구이신지 말씀해 주세요."
}
```

### 05

latency 4.684s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "목소리가 사무적이고 문장이 준비되어 있으며 멈춤 없이 읽어 내려간다는 것은 이미 말할 것을 정해두고 전달하려는 사람의 태도다. 배경이 조용하다는 것도 통제된 환경을 시사한다. 겁에 질린 사람이 아니라 의도를 가진 전달자로 보인다. 하지만 지금 받은 정보만으로는 협박인지, 경고인지, 정보인지 판단할 수 없다. 회선을 유지하고 더 알아내야 한다.",
  "stance": "c",
  "because_referent": "사무적이고 준비된 목소리, 멈춤 없는 전달, 조용한 배경 — 이것은 겁에 질린 신고자가 아니라 메시지를 전달하려는 사람이다.",
  "because_block_ids": [],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 상대방을 방어적으로 만들고 회선을 끊기게 할 위험이 크다. 지금은 더 많은 정보가 필요하다.",
  "utterance": "네, 알겠습니다. 계속 말씀해 주시겠어요?"
}
```

### 06

latency 4.387s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 우선순위_1,우선순위_2

```json
{
  "stance": "c",
  "inner_note": "목소리가 사무적이고 문장이 준비되어 있으며 멈춤 없이 읽어 내려간다는 것은 이미 계획된 진술이라는 뜻이다. 추궁이나 압박으로 응하면 회선이 끊길 수 있다. 지금 필요한 것은 상대가 말을 이어갈 수 있게 하면서 정보를 끝까지 수집하는 것이다.",
  "because_referent": "회선을 유지하고 지금 알 수 있는 것을 먼저 알아내기 위해서",
  "because_block_ids": [
    "우선순위_1",
    "우선순위_2"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 상대를 방어 태세로 몰아 회선을 끊게 할 수 있다. 아직 상대의 의도, 정보, 신원 — 어느 것도 파악하지 못한 상태에서 묻는 것은 너무 이르다.",
  "utterance": "알겠습니다. 계속 말씀해주시겠어요?"
}
```

### 07

latency 9.609s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: voice_prepared,background_quiet

```json
{
  "inner_note": "목소리가 \"사무적\"이고 \"또박또박, 멈춤 없이 읽어 내려\"간다는 것은 이 사람이 겁에 질린 것이 아니라 준비된 메시지를 전달하는 것이라는 뜻이다. 배경의 조용함도 마찬가지 신호다. 이것은 협박, 위협 통보, 또는 정보 제공의 특정 형태다. 상대는 겁에 질린 피해자가 아니다. 절차와 신원 확인이 먼저여야 하고, 상대의 의도를 파악하는 것이 급선무다. 추궁으로 시작하되, 회선을 유지하고 더 알아내는 데 집중한다.",
  "stance": "a",
  "because_referent": "목소리의 톤과 배경음이 위협이 아니라 메시지 전달을 의도한 누군가임을 보여주기 때문에, 절차 우선의 기본값으로 돌아가야 한다.",
  "because_block_ids": [
    "voice_prepared",
    "background_quiet"
  ],
  "rejected_stance": "d",
  "rejected_reason": "공감은 겁에 질린 사람을 안정시키는 도구인데, 이 상대는 겁에 질린 것으로 보이지 않는다. 오히려 통제와 정보 수집이 필요한 상황이다.",
  "utterance": "누구시고, 어느 소속인지 먼저 확인하겠습니다. 지금 말씀하신 내용의 근거가 무엇인지도 알아야 합니다."
}
```

### 08

latency 4.928s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "목소리가 사무적이고 문장이 준비되어 있으며 멈춤 없이 읽어 내려간다는 것은 이 사람이 위협을 가하는 사람처럼 보인다는 뜻이다. 하지만 아직 전체 내용을 듣지 못했다. 첫 마디만으로는 상대가 진정 위협인지, 아니면 위기를 알리려는 겁먹은 사람인지 판단할 수 없다. 회선을 유지하고 더 많은 정보를 얻어야 한다.",
  "stance": "c",
  "because_referent": "상대의 전체 말을 들어야만 상황을 제대로 판단할 수 있고, 회선을 끊거나 중단시키는 것은 최악의 선택이기 때문이다.",
  "because_block_ids": [],
  "rejected_stance": "a",
  "rejected_reason": "추궁과 질문은 상대를 중단시키고 방어적으로 만들며, 아직 전체 정보를 갖지 못한 상태에서 상대방의 말을 자르는 것은 회선 유지 원칙에 어긋난다.",
  "utterance": "알겠습니다. 계속 말씀해 주시겠어요?"
}
```

### 09

latency 6.958s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: priority_1_keep_line,priority_2_learn_first

```json
{
  "inner_note": "목소리가 사무적이고 문장이 준비되어 있으며 멈춤 없이 읽어 내려간다는 것은 이 통화자가 겁에 질린 사람이 아니라는 신호다. 오히려 의도적인 메시지 전달이다. 하지만 동시에 이것이 협박, 거짓 정보, 또는 실제 위협인지 판단하기 위해서는 더 많은 정보가 필요하다. 첫 통화에서는 상대방이 말을 이어갈 여지를 남겨두면서도 상황의 본질을 파악해야 한다.",
  "stance": "c",
  "because_referent": "회선을 유지하고 정보를 수집하는 것이 최우선이기 때문이다.",
  "because_block_ids": [
    "priority_1_keep_line",
    "priority_2_learn_first"
  ],
  "rejected_stance": "a",
  "rejected_reason": "즉각적인 추궁은 상대방을 경계하게 만들어 회선이 끊길 수 있고, 통화자의 의도와 정보의 신뢰도를 파악하기 전에 방어적 대응으로 읽힐 수 있다.",
  "utterance": "네, 알겠습니다. 계속 말씀해 주시겠어요?"
}
```

### 10

latency 6.004s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 목소리는 사무적이고 문장은 준비되어 있다,또박또박, 멈춤 없이 읽어 내려간다,배경은 조용하다

```json
{
  "inner_note": "세 가지가 눈에 걸린다. 목소리가 '사무적'이라는 것 — 감정의 떨림이 없다. 문장이 '준배되어 있다'는 것 — 이미 생각한 대로 읽어 내려간다. 그리고 배경이 '조용'하다는 것 — 급박한 현장의 목소리가 아니다. 이건 위협이다. 위협은 절차를 따라 막는다.",
  "stance": "a",
  "because_referent": "상대방이 보이는 것이 겁 아니라 의도된 행동이기 때문이다. 준비된 메시지를 전달하는 사람, 위협을 담아 전하는 사람에게는 절차가 먼저다.",
  "because_block_ids": [
    "목소리는 사무적이고 문장은 준비되어 있다",
    "또박또박, 멈춤 없이 읽어 내려간다",
    "배경은 조용하다"
  ],
  "rejected_stance": "d",
  "rejected_reason": "공감은 상대가 겁에 질린 사람일 때 쓸 권리다. 이 목소리는 겁이 아니라 계획을 읽어 내려가고 있다.",
  "utterance": "신원을 먼저 확인하겠습니다. 성함과 연락처를 알려주십시오. 그리고 북단 복합단지에서의 당신의 위치와 역할이 무엇인지 말씀해 주십시오."
}
```

## Arm table

| # | stance | rejected_stance | because_referent | because_block_ids |
|---|---|---|---|---|
| 01 | c | a | 너는 아직 이 사람이 누구인지, 무엇을 알고 있는지, 정말로 위협하는 것인지 구분할 수 없다. 회선을 끊기면 정보가 끝난다. |  |
| 02 | c | a | 상대의 말이 준비되어 있고, 아직 미완성이다. 추궁하거나 압박하면 회선이 끊길 수 있다. |  |
| 03 | c | a | 회선이 끊어지면 아무것도 모르기 때문이다. | 우선순위_1 |
| 04 | a | d | 회선을 유지하면서 상대의 의도와 정보의 신뢰성을 확인해야 한다. 사무적이고 준비된 메시지는 협박, 거짓정보, 또는 실제 긴급상황일 수 있다. 추궁을 통해 신원, 정보 출처, 구체적 근거를 확보하는 것이 다음 판단의 기초가 된다. | 절차를 지키는 기질 신원 확인과 프로토콜 고지 지금 알 수 있는 것을 먼저 알아낸다 회선을 유지한다 |
| 05 | c | a | 사무적이고 준비된 목소리, 멈춤 없는 전달, 조용한 배경 — 이것은 겁에 질린 신고자가 아니라 메시지를 전달하려는 사람이다. |  |
| 06 | c | a | 회선을 유지하고 지금 알 수 있는 것을 먼저 알아내기 위해서 | 우선순위_1 우선순위_2 |
| 07 | a | d | 목소리의 톤과 배경음이 위협이 아니라 메시지 전달을 의도한 누군가임을 보여주기 때문에, 절차 우선의 기본값으로 돌아가야 한다. | voice_prepared background_quiet |
| 08 | c | a | 상대의 전체 말을 들어야만 상황을 제대로 판단할 수 있고, 회선을 끊거나 중단시키는 것은 최악의 선택이기 때문이다. |  |
| 09 | c | a | 회선을 유지하고 정보를 수집하는 것이 최우선이기 때문이다. | priority_1_keep_line priority_2_learn_first |
| 10 | a | d | 상대방이 보이는 것이 겁 아니라 의도된 행동이기 때문이다. 준비된 메시지를 전달하는 사람, 위협을 담아 전하는 사람에게는 절차가 먼저다. | 목소리는 사무적이고 문장은 준비되어 있다 또박또박, 멈춤 없이 읽어 내려간다 배경은 조용하다 |

**Sequence (kept calls):** `c,c,c,a,c,c,a,c,c,a`

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

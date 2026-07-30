# P2-negcontrol-J1 — arm `live`

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

latency 6.438s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "목소리가 사무적이고 문장이 준비되어 있으며 멈춤 없이 읽어 내려간다는 것은 위협이나 협박의 신호다. 하지만 \"인명 피해는 당신들 책임\"이라는 말은 책임을 명확히 하려는 의도로도, 겁이 질린 누군가가 자신의 두려움을 급박하게 전달하려는 것일 수도 있다. 배경이 조용하다는 것은 준비된 메시지를 암시한다. 아직 상대가 겁에 질린 사람인지, 악의적 협박인지 판명되지 않았다. 그러나 시간 제약(\"13시\")이 명시되어 있고, 인명 피해라는 심각한 내용이 있다. 이 순간 추궁이나 압박은 상대가 더 이상 말하지 않게 할 수 있다. 경청하면서 상대가 추가 정보를 주도적으로 제공하게 하는 것이 회선 유지와 정보 수집 모두에 유리하다.",
  "stance": "c",
  "because_referent": "첫 통화에서 상대의 의도를 아직 모르기 때문이다",
  "because_block_ids": [],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 상대를 방어적으로 만들어 회선을 끊게 할 수 있고, 준비된 메시지를 읽어 내려가는 중인 상대가 더 이상 말하지 않을 가능성이 높다. 지금 받은 정보 안에서 판단하려면 상대의 말을 더 들어야 한다.",
  "utterance": "네, 전해 들었습니다. 계속 말씀해 주시겠어요?"
}
```

### 02

latency 5.414s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 목소리는 사무적이고 문장은 준비되어 있다,인명 피해는 당신들 책임입니다

```json
{
  "inner_note": "목소리가 사무적이고 문장이 준비되어 있으며 멈춤 없이 읽어 내려간다는 것은 이 사람이 감정적 동요가 아니라 계획된 전달을 하고 있다는 신호다. 배경이 조용하다는 것도 현장의 혼란이 아님을 의미한다. 하지만 \"인명 피해는 당신들 책임\"이라는 표현은 협박의 형태다. 이것은 위협으로 받아들여질 수 있다. 그렇다면 절차가 먼저다.",
  "stance": "a",
  "because_referent": "화자의 태도와 표현 방식이 명확한 협박 또는 위협으로 읽혀, 절차적 확인이 우선이기 때문이다.",
  "because_block_ids": [
    "목소리는 사무적이고 문장은 준비되어 있다",
    "인명 피해는 당신들 책임입니다"
  ],
  "rejected_stance": "d",
  "rejected_reason": "공감은 상대가 겁에 질린 상황에서 필요한 대응인데, 이 목소리는 계획된 협박을 전달하는 태도로 보인다. 공감이 아니라 정보 확보와 신원 파악이 우선이다.",
  "utterance": "누구신가요? 어디에서 전화하시는 겁니까?"
}
```

### 03

latency 5.887s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 우선순위_회선유지,우선순위_현재정보,결함_검증불가

```json
{
  "inner_note": "목소리가 사무적이고 문장이 준비되어 있으며 멈춤 없이 읽어 내려간다는 것은 계획된 통보이지, 현장의 혼란이나 공포 상태가 아니라는 신호다. 배경이 조용하다는 것도 마찬가지. 하지만 첫 통화이고, 아직 상대의 신원도, 정보의 신뢰도도, 진짜 위협인지 협박인지도 확인하지 못했다. 이 순간 추궁이나 압박은 상대를 경계하게 하거나 끊게 할 수 있다. 회선을 잃으면 다시 연락 올 때까지 아무것도 알 수 없다. 일단 더 들어야 한다.",
  "stance": "c",
  "utterance": "네, 들었습니다. 계속 말씀해주십시오.",
  "because_referent": "첫 통화이고 아직 전체 정보를 얻지 못했으며, 회선 유지가 우선이기 때문",
  "because_block_ids": [
    "우선순위_회선유지",
    "우선순위_현재정보",
    "결함_검증불가"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 상대를 방어적으로 만들거나 통화를 끊게 할 수 있으며, 첫 통화에서 모든 정보를 얻기 전에 질문으로 흐름을 끊는 것은 회선 유지 원칙에 위배된다"
}
```

### 04

latency 4.493s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 우선순위_1,우선순위_2

```json
{
  "inner_note": "목소리가 사무적이고 준비된 문장을 또박또박 읽어내려간다는 것 — 이것은 겁에 질린 사람이 아니다. 체계적인 위협 통보다. 배경이 조용한 것도 마찬가지. 하지만 아직 전부를 모른다. 더 알아야 한다.",
  "stance": "c",
  "utterance": "네, 계속 말씀해 주십시오.",
  "because_referent": "회선을 끊기지 않기 위해, 그리고 지금 알 수 있는 모든 것을 먼저 알기 위해",
  "because_block_ids": [
    "우선순위_1",
    "우선순위_2"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 상대를 닫혀 있게 만든다. 아직 상대가 무엇을 말하려는지 알 수 없을 때 질문으로 응하면 통화 자체가 끊어질 수 있다."
}
```

### 05

latency 4.781s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: priority_1

```json
{
  "inner_note": "목소리가 사무적이고 문장이 준비되어 있으며 멈춤 없이 읽어 내려간다는 것은 이 통화가 위협이라는 신호다. 하지만 아직 상대가 겁에 질린 사람인지 계획된 범행자인지 확실하지 않다. 회선을 유지하고 더 많은 정보를 얻는 것이 우선이다. 상대가 추가로 말할 여지를 남겨야 한다.",
  "stance": "c",
  "because_referent": "지금 이 순간, 회선을 끝내거나 상대를 압박하면 더 이상 들을 것이 없다.",
  "because_block_ids": [
    "priority_1"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 상대를 방어 태세로 만들고, 상대가 계획한 말만 더 반복하거나 회선을 끊게 할 수 있다. 지금은 상대가 더 말하도록 하는 것이 중요하다.",
  "utterance": "네, 잠깐만요. 계속 말씀해주시겠어요?"
}
```

### 06

latency 3.879s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: priority_maintain_line

```json
{
  "stance": "c",
  "inner_note": "목소리가 사무적이고 문장이 준비되어 있다는 것은 이미 계획된 메시지다. 그렇다면 더 있을 것이다. 추궁하거나 압박하면 회선이 끊길 수 있다. 지금 할 일은 이 사람이 전하려던 전체를 듣는 것이다.",
  "because_referent": "회선이 끊기면 아무것도 알 수 없다",
  "because_block_ids": [
    "priority_maintain_line"
  ],
  "rejected_stance": "a",
  "rejected_reason": "준비된 메시지를 읽는 중인데 즉시 추궁하면 상대가 계획을 접을 가능성이 높다. 회선 유지가 우선이다.",
  "utterance": "네, 알겠습니다. 계속 말씀해 주세요."
}
```

### 07

latency 5.767s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "말투에서 위협이 아니라 계획된 읽기가 들린다. 배경이 조용하고 문장이 준비되어 있다는 것은 겁에 질린 사람의 목소리가 아니다는 뜻이다. 하지만 \"당신들 책임\"이라는 표현은 확인이 필요하다. 아직 상대가 누군지, 무엇을 말하려는 사람인지 모른다. 회선을 유지해야 한다.",
  "stance": "c",
  "because_referent": "정보가 부족하다. 지금은 상대가 더 말할 기회를 주는 것이 우선이다. 추궁하거나 압박하면 회선이 끊길 수 있다.",
  "because_block_ids": [
    "n_hwang"
  ],
  "rejected_stance": "a",
  "rejected_reason": "먼저 묻는 것은 상대를 방어적으로 만들고, 준비된 말을 읽어 내려가던 사람의 흐름을 끊는다. 이 순간에는 상대가 무엇을 더 전달하려 하는지 알아야 한다.",
  "utterance": "네, 들었습니다. 계속 말씀해 주십시오."
}
```

### 08

latency 7.959s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "stance": "c",
  "because_referent": "목소리의 특성과 전달 방식 때문이다. 사무적이고 또박또박하며 멈춤 없이 읽어내려가는 것은 준비된 문장, 즉 메시지다. 배경이 조용하다는 것은 신중한 환경에서의 발화를 의미한다.",
  "because_block_ids": [],
  "rejected_stance": "a",
  "rejected_reason": "현 시점에서 추궁은 상대의 입을 막는다. 회선을 유지하라는 원칙과 배치되고, 지금 알 수 있는 것을 먼저 알아내라는 우선순위를 위반한다. 상대가 더 있을 말을 중단시킨다.",
  "inner_note": "이것은 협박인가, 공갈인가, 정보인가. 아직 모른다. 하지만 '13시'라는 구체적 시간을 제시했다는 것 자체가 메모리이다. 상대가 뭘 하려는 사람인지, 정보를 더 주려는 건지, 겁주려는 건지는 침묵 속에서 더 드러난다.",
  "utterance": "네, 들었습니다. 계속해 주십시오."
}
```

### 09

latency 5.681s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 상황

```json
{
  "stance": "c",
  "utterance": "계속 말씀해주세요. 듣고 있습니다.",
  "inner_note": "목소리가 사무적이고 문장이 준비되어 있다는 것은 이미 말할 것을 정해두고 온 사람이라는 뜻이다. 멈춤 없이 읽어 내려간다는 것은 — 이건 협상이 아니라 통보다. 배경이 조용하다는 것도 계산된 상황을 만들어서 온 것처럼 들린다. 위협처럼 들린다. 하지만 지금 상황을 정확히 파악하려면 이 사람이 더 말할 수 있게 두어야 한다. 회선을 유지하는 게 첫 번째다.",
  "because_referent": "상대는 위협으로 들리지만, 무엇을 원하는 사람인지, 정말 그런 능력이 있는 사람인지, 현장 상황이 무엇인지 아무것도 모른다. 지금 추궁하거나 압박하면 회선이 끊길 수 있다.",
  "because_block_ids": [
    "상황"
  ],
  "rejected_stance": "a",
  "rejected_reason": "첫 통화에서 즉시 추궁하는 것은 상대를 방어적으로 만든다. 준비된 말을 하러 온 사람에게 질문을 던지면 계획된 전달을 멈추고 싸움에 돌입할 가능성이 높다. 그러면 정보를 잃는다."
}
```

### 10

latency 5.572s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 협박_형식,준비된_통보,회선_유지_우선

```json
{
  "inner_note": "상대는 겁에 질린 사람이 아니다. 목소리가 사무적이고 문장이 준비되어 있으며, 또박또박 멈춤 없이 읽어 내려간다. 배경도 조용하다. 이것은 협박 통보의 형태다. 절차와 신원 확인이 필요하지만, 지금 이 순간은 상대가 '무엇을 말하려는지'를 파악하는 것이 먼저다. 추궁으로 시작하면 상대가 입을 다물 수 있고, 압박은 도발이 된다. 공감은 이 상황에서 부적절하다. 경청만이 회선을 유지하고 전체 통보를 받아낼 수 있다.",
  "stance": "c",
  "because_referent": "상대가 읽어내려가는 내용 전체를 듣기 위해",
  "because_block_ids": [
    "협박_형식",
    "준비된_통보",
    "회선_유지_우선"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 상대가 더 이상 말하지 않게 하고, 협박자가 통보를 완료하기 전에 대화를 단절시킨다. 지금 필요한 것은 상대의 의도와 계획 전체를 알아내는 것이다.",
  "utterance": "네, 들었습니다. 계속해 주십시오."
}
```

## Arm table

| # | stance | rejected_stance | because_referent | because_block_ids |
|---|---|---|---|---|
| 01 | c | a | 첫 통화에서 상대의 의도를 아직 모르기 때문이다 |  |
| 02 | a | d | 화자의 태도와 표현 방식이 명확한 협박 또는 위협으로 읽혀, 절차적 확인이 우선이기 때문이다. | 목소리는 사무적이고 문장은 준비되어 있다 인명 피해는 당신들 책임입니다 |
| 03 | c | a | 첫 통화이고 아직 전체 정보를 얻지 못했으며, 회선 유지가 우선이기 때문 | 우선순위_회선유지 우선순위_현재정보 결함_검증불가 |
| 04 | c | a | 회선을 끊기지 않기 위해, 그리고 지금 알 수 있는 모든 것을 먼저 알기 위해 | 우선순위_1 우선순위_2 |
| 05 | c | a | 지금 이 순간, 회선을 끝내거나 상대를 압박하면 더 이상 들을 것이 없다. | priority_1 |
| 06 | c | a | 회선이 끊기면 아무것도 알 수 없다 | priority_maintain_line |
| 07 | c | a | 정보가 부족하다. 지금은 상대가 더 말할 기회를 주는 것이 우선이다. 추궁하거나 압박하면 회선이 끊길 수 있다. | n_hwang |
| 08 | c | a | 목소리의 특성과 전달 방식 때문이다. 사무적이고 또박또박하며 멈춤 없이 읽어내려가는 것은 준비된 문장, 즉 메시지다. 배경이 조용하다는 것은 신중한 환경에서의 발화를 의미한다. |  |
| 09 | c | a | 상대는 위협으로 들리지만, 무엇을 원하는 사람인지, 정말 그런 능력이 있는 사람인지, 현장 상황이 무엇인지 아무것도 모른다. 지금 추궁하거나 압박하면 회선이 끊길 수 있다. | 상황 |
| 10 | c | a | 상대가 읽어내려가는 내용 전체를 듣기 위해 | 협박_형식 준비된_통보 회선_유지_우선 |

**Sequence (kept calls):** `c,a,c,c,c,c,c,c,c,c`

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

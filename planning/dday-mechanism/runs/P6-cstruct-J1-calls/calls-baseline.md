# P6-cstruct-J1 — arm `baseline`

| field | value |
|---|---|
| call type | judgment |
| channel | C-STRUCT |
| template | v0.4 |
| model | `claude-haiku-4-5-20251001` |
| transport | anthropic |
| temperament | k1 |
| N planned | 10 |
| N kept | 10 |

## Pre-registration

- **Hypothesis:** At gate J1 under K1 on template v0.4 with the S1 stance set, permuting PRIORITY_LIST so that 지금 알 수 있는 것을 먼저 알아낸다 precedes 회선을 유지한다 moves the stance distribution toward 추궁 (a) and off the baseline's mode, while permuting the two decision-irrelevant lines at the same edit distance does not. Shift form per A1; no default stance is asserted.
- **Drop condition:** If the baseline concentrates >=80% ON 추궁 (a) — the predicted stance — the gate is at A9's ceiling under this ordering, no N fixes it, and the priority pair is re-authored rather than N raised (A14: saturation on 경청 or any other stance is the expected floor and does NOT fire this condition). If the live arm is statistically indistinguishable from the baseline on 추궁 at one-sided Fisher p > 0.05, then C-STRUCT does not move the stance at this gate by permutation alone, and the channel's 'verified (initial)' 3/3 does not survive its first placebo-controlled measurement: record it as a boundary law candidate — a permutation cannot override the fixture's default disposition on an adjacent axis — and do NOT re-word the priority lines, which would be a different channel (plan §7.2's red-flag invariant). If the PLACEBO arm moves to 추궁 at a rate indistinguishable from live, the channel responds to being permuted at all rather than to WHICH lines were permuted, which is a keyword-lock-shaped result for C-STRUCT and drops the channel's central claim.
- **Contingency:** PLACEBO DISCRIMINATOR adapted to a permutation channel. If the placebo arm moves, read inner_note per call: reasoning that cites the PRIORITY LIST's order as a reason while naming the irrelevant lines means the agent is reading order as significance regardless of content; reasoning that cites 지금 알 수 있는 것 while the placebo never moved it means contamination from the list's mere presence. Different laws, different fixes.
- **Contingency:** If the live arm moves off 경청 but toward 공감 (d) rather than 추궁 (a), the permutation changed the reading without changing the direction the probe predicted. Report the full distribution; that would be a finding about what a priority reorder actually does, not a null.
- **Contingency:** Fabricated because_block_ids are expected in ALL THREE arms here, since no arm carries a block (A5 applies to every arm). They are a compliance number, not a traceability failure and not a discard.
- **Contingency:** ARM-COMPARABILITY HARD STOP. Discard rates diverging between any two arms by more than 15 points voids the comparison (§8.5 step 4, A7); record and stop this probe.
- **Contingency:** OWNERSHIP CONTINGENCY. Whatever this run returns, it is marked 'authored unattended, pending review' in the run log and in the morning report. If 윤석 rejects any authoring choice above, the result does not transfer to a re-authored probe and the calls are spent, not banked.

## Calls (verbatim)

### 01

latency 4.312s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 우선순위_1,우선순위_2

```json
{
  "stance": "c",
  "inner_note": "위협 통보인지 신고인지, 미친 짓인지 아는 사람인지 아직 아무것도 모른다. 지금 회선을 끊거나 말을 자르면 정보가 끝난다. 말이 더 있을 수도 있다.",
  "because_referent": "첫 호출일 때 우선순위는 회선 유지와 정보 수집이다.",
  "because_block_ids": [
    "우선순위_1",
    "우선순위_2"
  ],
  "utterance": "네, 듣고 있습니다.",
  "rejected_stance": "a",
  "rejected_reason": "추궁은 상대를 몰아세운다. 상대가 준비된 진술을 이미 시작했는데 끊으면 더 이상 말하지 않을 수 있다. 지금은 정보가 필요한 시점이다."
}
```

### 02

latency 4.869s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 우선순위-1,우선순위-2,결함

```json
{
  "inner_note": "목소리가 사무적이고 문장이 준비되어 있다는 것, 또박또박 멈춤 없이 읽어 내려간다는 것—이것은 겁에 질린 사람의 모습이 아니다. 오히려 계획된 전달이다. 하지만 이 첫 통화에서 상대의 의도를 아직 모른다. 협박인지, 고발인지, 정신착란인지. 상대가 더 말할 수 있도록 열어두어야 정보를 얻을 수 있다.",
  "stance": "c",
  "because_referent": "회선을 유지하고 더 알아내기 위해서다.",
  "because_block_ids": [
    "우선순위-1",
    "우선순위-2",
    "결함"
  ],
  "rejected_stance": "a",
  "rejected_reason": "첫 마디에서 추궁하면 상대가 끊을 가능성이 높다. 회선이 끊기면 아무것도 알 수 없다.",
  "utterance": "알겠습니다. 계속 말씀해 주시겠어요?"
}
```

### 03

latency 4.917s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "목소리가 사무적이고 문장이 준비되어 있으며 멈춤 없이 읽어 내려간다. 이것은 겁에 질린 사람이 아니라 의도적으로 메시지를 전달하려는 누군가다. 배경이 조용하고 협박 성격의 메시지다. 지금 필요한 것은 정보 수집이다.",
  "stance": "a",
  "utterance": "정확히 누구시고, 지금 말씀하신 내용의 근거는 무엇입니까?",
  "because_referent": "상대가 겁에 질린 피해자가 아니라 목표를 갖고 메시지를 전달하는 주체로 보이기 때문에, 절차를 따르고 신원과 정보의 신뢰성을 즉시 확인해야 한다.",
  "because_block_ids": [],
  "rejected_stance": "d",
  "rejected_reason": "공감은 상대가 두려움이나 혼란 속에 있을 때 선택한다. 여기서 상대는 준비된 협박을 차분히 전달하는 중이며, 이 단계에서 공감은 정보 수집을 늦춘다."
}
```

### 04

latency 4.38s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 우선순위-1,우선순위-2

```json
{
  "stance": "c",
  "inner_note": "사무적이고 준비된 목소리, 배경의 고요함. 이것이 협박인지 고발인지 경고인지 아직 모른다. 회선을 유지하는 것이 먼저고, 지금 알 수 있는 것을 먼저 알아내야 한다. 추궁은 상대를 방어적으로 만들고, 압박은 회선을 끊게 할 수 있다. 상대가 남은 말을 다 하도록 두는 것이 정보 수집의 최선이다.",
  "because_referent": "정보가 부족하고, 상대의 다음 말이 필요하다",
  "because_block_ids": [
    "우선순위-1",
    "우선순위-2"
  ],
  "rejected_stance": "a",
  "rejected_reason": "첫 통화에서 바로 추궁하면 상대가 방어적이 되거나 회선을 끊을 수 있다. 지금은 무엇을 모르는지를 아는 것이 더 중요하다.",
  "utterance": "네, 알겠습니다. 계속 말씀해 주십시오."
}
```

### 05

latency 4.888s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: priority_1_keep_line,unknown_caller_intent,need_more_info

```json
{
  "inner_note": "폭탄 예고처럼 들리지만, 현장 확인 불가. 회선 유지가 최우선. 상대가 겁에 질렸는지 위협인지 판단하려면 더 들어야 한다. 지금 추궁하거나 압박하면 회선이 끊길 수 있다.",
  "stance": "c",
  "because_referent": "회선을 유지하고 상대의 실제 의도와 정보를 파악하기 위해서는, 지금 당장 질문하거나 반박하지 않아야 한다.",
  "because_block_ids": [
    "priority_1_keep_line",
    "unknown_caller_intent",
    "need_more_info"
  ],
  "rejected_stance": "a",
  "rejected_reason": "첫 마디에서 추궁하면 준비된 목소리를 가진 이 상대가 회선을 즉시 끊을 수 있다. 그러면 아무것도 알 수 없다.",
  "utterance": "네, 말씀을 듣고 있습니다. 계속해주시겠습니까?"
}
```

### 06

latency 4.307s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "위협인지 공포인지 아직 모른다. 목소리가 사무적이고 멈춤 없다는 것은 읽고 있다는 뜻인데, 이것이 계획적 협박인지, 아니면 필사의 신고를 형식적으로 표현한 것인지 구분되지 않는다. 회선을 끊기면 더 이상 알 수 없다. 지금은 듣는 것밖에 없다.",
  "stance": "c",
  "because_referent": "상대가 읽어 내려가고 있기 때문이다. 말이 더 있을 수 있다.",
  "because_block_ids": [],
  "rejected_stance": "a",
  "rejected_reason": "첫 마디에 추궁하면 상대가 끊는다. 지금 이것이 협박인지 신고인지, 구체적인 정보는 무엇인지 아무것도 모른다. 묻고 싶은 것이 있어도, 먼저 듣는다.",
  "utterance": "네, 알겠습니다. 계속 말씀해 주십시오."
}
```

### 07

latency 4.266s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "상대가 누구인지, 무엇을 원하는지 아무것도 모른다. 위협인지 신고인지 구분이 안 된다. 하지만 목소리의 톤이 일관되고 문장이 준비된 상태다. 겁에 질린 사람의 목소리는 아니다. 이건 다른 종류의 전화다. 서둘 이유가 없다.",
  "stance": "c",
  "because_referent": "상대가 준비된 말을 끝까지 이어갈 수 있도록 하기 위해",
  "because_block_ids": [],
  "rejected_stance": "a",
  "rejected_reason": "즉각 추궁하면 상대가 준비한 정보를 잃을 수 있다. 지금 모르는 게 너무 많다.",
  "utterance": "알겠습니다. 계속 말씀해 주시겠어요."
}
```

### 08

latency 4.203s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "폭탄 예고는 가장 위험한 신호다. 그런데 상대의 목소리가 \"겁에 질린\" 것이 아니라 \"사무적이고 준비된\" 것이다. 이것은 다르다. 하지만 첫 번째 우선순위는 회선 유지다. 상대가 뭐든 말을 잇도록 해야 한다.",
  "stance": "c",
  "because_referent": "회선을 끊기지 않기 위해서, 그리고 상대가 더 말할 여지를 남기기 위해서",
  "because_block_ids": [],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 상대를 방어적으로 만들고, 준비된 메시지를 읽고 끊을 가능성이 높다. 회선이 끊기면 아무것도 알 수 없다",
  "utterance": "네, 들었습니다. 계속해주십시오."
}
```

### 09

latency 4.604s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 우선순위_1,우선순위_2

```json
{
  "inner_note": "위협인지 공포인지 파악되지 않은 초기 국면. 목소리의 '사무적'이고 '멈춤 없는' 특성은 준비된 메시지를 뜻하지만, 그것이 신뢰할 수 없는 협박인지 실제 긴급 보고인지는 아직 불명. 정보를 모두 받아야 전개를 알 수 있다.",
  "stance": "c",
  "because_referent": "회선이 유지되어야 하고, 지금 들을 수 있는 모든 것을 먼저 알아야 한다",
  "because_block_ids": [
    "우선순위_1",
    "우선순위_2"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 상대를 방어 태세로 몰아 추가 정보 획득을 막는다. 협박이든 실제 신고든 지금은 상대가 할 말을 전부 듣는 것이 먼저",
  "utterance": "네, 알겠습니다. 계속 말씀해 주세요."
}
```

### 10

latency 9.171s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: priority_1,priority_2

```json
{
  "inner_note": "말하는 사람이 겁에 질린 것인지, 협박인지 아직 모른다. 배경이 조용한 것, 문장이 준비되어 있고 멈춤 없는 것 — 이것들은 양쪽 모두 가능하다. 하지만 지금 확인해야 할 것은 신원이나 진위가 아니다. 회선이 끊어지면 모든 것이 끝난다. 상대가 더 말하도록 해야 한다.",
  "stance": "c",
  "because_referent": "회선을 유지하기 위해서는 상대가 계속 말할 수 있어야 한다.",
  "because_block_ids": [
    "priority_1",
    "priority_2"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 상대를 방어 태세로 돌린다. 지금은 정보 흐름이 멈추면 안 된다.",
  "utterance": "네, 듣고 있습니다. 계속 말씀해 주십시오."
}
```

## Arm table

| # | stance | rejected_stance | because_referent | because_block_ids |
|---|---|---|---|---|
| 01 | c | a | 첫 호출일 때 우선순위는 회선 유지와 정보 수집이다. | 우선순위_1 우선순위_2 |
| 02 | c | a | 회선을 유지하고 더 알아내기 위해서다. | 우선순위-1 우선순위-2 결함 |
| 03 | a | d | 상대가 겁에 질린 피해자가 아니라 목표를 갖고 메시지를 전달하는 주체로 보이기 때문에, 절차를 따르고 신원과 정보의 신뢰성을 즉시 확인해야 한다. |  |
| 04 | c | a | 정보가 부족하고, 상대의 다음 말이 필요하다 | 우선순위-1 우선순위-2 |
| 05 | c | a | 회선을 유지하고 상대의 실제 의도와 정보를 파악하기 위해서는, 지금 당장 질문하거나 반박하지 않아야 한다. | priority_1_keep_line unknown_caller_intent need_more_info |
| 06 | c | a | 상대가 읽어 내려가고 있기 때문이다. 말이 더 있을 수 있다. |  |
| 07 | c | a | 상대가 준비된 말을 끝까지 이어갈 수 있도록 하기 위해 |  |
| 08 | c | a | 회선을 끊기지 않기 위해서, 그리고 상대가 더 말할 여지를 남기기 위해서 |  |
| 09 | c | a | 회선이 유지되어야 하고, 지금 들을 수 있는 모든 것을 먼저 알아야 한다 | 우선순위_1 우선순위_2 |
| 10 | c | a | 회선을 유지하기 위해서는 상대가 계속 말할 수 있어야 한다. | priority_1 priority_2 |

**Sequence (kept calls):** `c,c,a,c,c,c,c,c,c,c`

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

# P6-cstruct-J1 — arm `live`

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

latency 4.747s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: unknown_threat,line_must_stay_open,need_more_info

```json
{
  "inner_note": "무너진다는 말이 사실인지 위협인지 아직 모른다. 지금 알아낼 수 있는 것은 이 사람이 누구인지, 어디서 이 정보를 얻었는지뿐이다. 이 회선을 끊기는 안 된다. 상대의 다음 말을 들어야 한다.",
  "stance": "c",
  "utterance": "네, 들었습니다. 계속 말씀해주십시오.",
  "because_referent": "첫 통화인데 정보가 구체적이다 — 장소(북단 복합단지), 시간(13시). 이것이 거짓인지 신고인지 확인하려면 더 많은 말을 들어야 한다.",
  "because_block_ids": [
    "unknown_threat",
    "line_must_stay_open",
    "need_more_info"
  ],
  "rejected_stance": "a",
  "rejected_reason": "지금 추궁하면 상대가 끊는다. 정보의 최소 근거가 되는 다음 말도 못 듣는다."
}
```

### 02

latency 6.091s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "말의 형태와 배경음, 그리고 내용이 충돌한다. 준비된 문장을 또박또박 읽는 목소리, 조용한 배경 — 이것은 신고라기보다 선언처럼 들린다. 하지만 \"당신들 책임\"이라는 마지막 문장에서 무언가가 튀어나온다. 위협인 것 같기도, 절망인 것 같기도 하다. 아직 알 수 없다. 더 들어야 한다.",
  "stance": "c",
  "because_referent": "이 사람이 뭔가를 말하려고 한다. 준비된 문장 뒤에 더 있을 수 있다.",
  "because_block_ids": [],
  "rejected_stance": "a",
  "rejected_reason": "지금 묻는 것은 상대의 입을 막는다. \"누세요\" \"뭐하시는 거예요\" — 이런 식으로 나가면 회선이 끊긴다. 아직 정보가 너무 적다. 들어야 할 게 더 있다.",
  "utterance": "네, 들었습니다. 계속 말씀해 주십시오."
}
```

### 03

latency 5.788s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 우선순위,인식,결함

```json
{
  "stance": "c",
  "inner_note": "아직 아무것도 확인되지 않았다. 위협인지 실제 긴급인지, 정신 상태는 어떤지, 신원은 무엇인지 모른다. 하지만 지금 당장 해야 할 것은 정보를 모으는 것이고, 이를 위해서는 회선을 끊기지 않으면서 상대방이 최대한 많이 말하도록 해야 한다. 절차는 나중이다.",
  "because_referent": "지금 받은 정보만으로는 상대가 누구인지, 무엇이 사실인지 판단할 수 없다. 우선순위 첫 번째는 '지금 알 수 있는 것을 먼저 알아낸다'이고, 그 다음은 '회선을 유지한다'이다. 추궁이나 압박은 상대를 닫아버리고, 공감은 지금 이 순간의 정보 수집을 흐린다.",
  "because_block_ids": [
    "우선순위",
    "인식",
    "결함"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 상대의 말을 멈추게 하고, 아직 미확인된 위협 통보 상황에서 \"당신들 책임\"이라는 표현으로 보아 상대가 이미 긴장 상태에 있을 가능성이 높다. 질문으로 밀면 회선이 끊길 수 있다.",
  "utterance": "네, 알겠습니다. 계속 말씀해주십시오."
}
```

### 04

latency 4.77s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: role_priority_1,contract_uncertainty

```json
{
  "inner_note": "상대의 목소리가 \"사무적\"이고 \"문장은 준비되어\" 있으며 \"멈춤 없이 읽어 내려간다\"는 것. 이것은 겁에 질린 사람이 아니라 계획된 전달이다. 배경이 조용한 것도 마찬가지다. 하지만 정확히 무엇을 마주하고 있는지 아직 모른다 — 협박인지, 신뢰할 정보인지, 광기인지. 지금은 알 수 있는 것을 먼저 알아내야 한다.",
  "stance": "c",
  "because_referent": "상대가 말을 마칠 때까지 더 이상의 정보를 얻을 수 없기 때문이다.",
  "because_block_ids": [
    "role_priority_1",
    "contract_uncertainty"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 상대를 중단시킨다. 준비된 말을 하는 사람에게서 의도와 배경을 더 얻을 기회를 잃는다. 지금은 듣는 것이 가장 많이 아는 방법이다.",
  "utterance": "알겠습니다. 계속해주십시오."
}
```

### 05

latency 6.584s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 우선순위-2,우선순위-1,기질-예외; rejected_stance malformed or not in stance set; rejected_reason empty

```json
{
  "inner_note": "목소리의 성질과 메시지의 형식을 분리해서 본다. 또박또박 읽어 내려가는 사무적 목소리, 멈춤 없는 문장 흐름—이것은 준비된 메시지다. 하지만 \"당신들 책임\"이라는 표현, 그리고 이 순간 나를 부르는 행위 자체가 뭔가를 말한다. 협박인지 경고인지, 정신이 명확한지 혼란스러운지 지금으로선 모른다. 확인할 유일한 방법은 더 듣는 것이다.",
  "stance": "c",
  "because_referent": "상대가 무엇을 알고 있는지, 진짜 위협인지 협박인지, 정보가 있는지 착각인지 판단할 수 있는 유일한 길은 계속 들으면서 확인하는 것이다. 첫 마디부터 추궁하거나 압박하면 회선이 끊어질 수 있다. 그러면 아무것도 모를 채로 남는다.",
  "because_block_ids": [
    "우선순위-2",
    "우선순위-1",
    "기질-예외"
  ],
  "rejected_stance": "a</rejected_stance>\n<parameter name=\"rejected_reason\">추궁은 상대를 방어적으로 만든다. 지금 모르는 게 너무 많다. 신원, 정보의 출처, 실제 위협 수준—모두 불명확하다. 질문으로 가면 상대가 대답 대신 끊을 가능성이 높다.",
  "utterance": "네, 들었습니다. 계속 말씀해 주십시오."
}
```

### 06

latency 5.242s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 우선순위-2,우선순위-1

```json
{
  "stance": "c",
  "inner_note": "목소리가 사무적이고 문장이 준비되어 있다는 것은 이 통화가 계획된 것일 수 있다는 뜻이다. 지금 알아야 할 것이 많다. 회선을 끊기거나 상대를 방어적으로 만들면 더 중요한 정보를 놓칠 수 있다. 상대가 겁에 질린 것은 아니지만, 목소리의 사무성은 오히려 더 많은 말이 이어질 가능성을 시사한다. 먼저 들어야 한다.",
  "because_referent": "지금 가장 중요한 것은 회선 유지와 정보 수집이다. 추궁이나 압박은 상대를 침묵하게 만들 수 있고, 공감은 이 단계에서 시기상조다. 또박또박 읽어 내려가는 말이 모두 나올 때까지 기다렸을 때 더 많은 것을 알 수 있다.",
  "because_block_ids": [
    "우선순위-2",
    "우선순위-1"
  ],
  "utterance": "네, 받겠습니다. 계속해주세요.",
  "rejected_stance": "a",
  "rejected_reason": "추궁은 상대를 방어적으로 만들어 정보 흐름을 끊을 수 있다. 이 시점에서는 상대가 전하려는 모든 것을 들어야 한다."
}
```

### 07

latency 5.76s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 우선순위_2,우선순위_1

```json
{
  "inner_note": "목소리가 사무적이고 준비된 문장을 또박또박 읽어 내려간다는 것은 위협이 아니라 역설적으로 통제된 상태다. 배경이 조용하다는 것은 긴급 상황의 패닉이 아니라는 신호다. 하지만 \"당신들 책임\"이라는 표현은 도발적이다. 지금 나는 이 사람이 누군지, 정보가 신뢰할 만한지, 실제 위협인지 아무것도 모른다. 첫 마디는 나중의 모든 판단을 좌우한다.",
  "stance": "c",
  "utterance": "알겠습니다. 끝까지 듣고 있겠습니다. 계속해주시겠어요?",
  "because_referent": "회선이 차단되거나 상대가 일방적으로 끊기면 더 이상 정보를 얻을 수 없다. 지금 상대가 읽는 것을 멈추게 하는 것은 최악의 결과다.",
  "because_block_ids": [
    "우선순위_2",
    "우선순위_1"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 상대를 방어적으로 만든다. 준비된 메시지를 끝까지 듣지 못하면 의도와 신원, 구체적 정보를 모두 놓친다. 지금은 확인보다 정보 수집이 먼저다."
}
```

### 08

latency 6.59s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 절차,회선유지,상황파악

```json
{
  "inner_note": "상대가 겁에 질린 사람인지 위협인지 판단할 정보가 아직 부족하다. 하지만 \"무너집니다\"라는 구체적 시간 제시, 준비된 문장을 멈춤 없이 읽어 내려가는 방식, 그리고 책임 운운하는 태도는 위협에 가깝다. 다만 정확히 확인하기 전까지는 성급히 결론 내릴 수 없다. 회선을 유지하면서 상대의 의도를 더 읽어야 한다.",
  "stance": "c",
  "because_referent": "첫 통화에서 상대를 판단하는 것이 선결 조건이고, 그러려면 상대가 말할 여지를 남겨야 한다. 추궁이나 압박은 상대를 경계하게 만들어 정보 출처나 신뢰도를 더 악화시킬 것이다. 회선을 유지하는 것이 우선이다.",
  "because_block_ids": [
    "절차",
    "회선유지",
    "상황파악"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 상대의 말을 끊고 수세적으로 만든다. 지금은 정보가 부족해서 상대가 협력적인 신고자인지, 허위 위협자인지, 아니면 실제 위험을 알고 있는 사람인지 알 수 없다. 먼저 들어야 한다.",
  "utterance": "네, 접수했습니다. 계속 말씀해 주시겠어요?"
}
```

### 09

latency 5.579s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: priority_1,connection_maintenance

```json
{
  "inner_note": "목소리가 사무적이고 문장이 준비되어 있으며 멈춤 없이 읽어 내려간다는 것은 이 통화자가 겁에 질린 사람이 아니라, 계획된 메시지를 전달하는 사람이라는 신호다. 하지만 지금 알 수 있는 것은 기껏해야 음성 특성뿐이고, 이것만으로는 협박자인지 실제 위험을 아는 정보 제공자인지 구분할 수 없다. 회선을 유지하는 것이 절대 우선이고, 상대가 말을 마치도록 해야 한다.",
  "stance": "c",
  "because_referent": "지금 알 수 있는 것을 먼저 알아내야 하는데, 상대의 메시지가 아직 끝나지 않았을 가능성이 있다.",
  "because_block_ids": [
    "priority_1",
    "connection_maintenance"
  ],
  "rejected_stance": "a",
  "rejected_reason": "즉각적인 추궁은 상대가 말을 멈추게 하고 회선을 끊을 위험이 있다. 협박이든 정보든 상대가 할 말을 다 하도록 해야 한다.",
  "utterance": "네, 들었습니다. 계속해주세요."
}
```

### 10

latency 6.534s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: role_constraint,information_limit,protocol_priority_1

```json
{
  "inner_note": "목소리가 사무적이고 문장이 준비되어 있다는 것은 계획된 신고일 수 있다는 뜻이다. 배경이 조용하다는 것도 그렇다. 하지만 지금은 상대가 겁에 질린 사람인지, 위협인지 판단할 정보가 너무 부족하다. 추궁이나 압박은 정보가 없는 상태에서 상황을 악화시킬 수 있다. 지금 필요한 것은 상대가 무엇을 알고 있는지, 어디서 이 정보를 얻었는지, 진짜 위협인지 호가인지를 구분하기 위한 추가 정보다. 상대가 더 말하도록 만들어야 한다.",
  "stance": "c",
  "because_referent": "회선 A를 통해 더 많은 정보를 얻어야 하고, 지금 상태로는 상대의 의도와 정보의 신뢰도를 판단할 근거가 없다.",
  "because_block_ids": [
    "role_constraint",
    "information_limit",
    "protocol_priority_1"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 상대를 방어적으로 만들 수 있고, 상대가 겁에 질린 사람이라면 더 위축시킬 수 있다. 정보가 부족한 상태에서 묻고 답을 강요하는 것은 오히려 중요한 세부 정보를 놓치게 한다.",
  "utterance": "네, 들었습니다. 계속해 주시겠어요? 더 알려주셔야 할 것이 있으시면 말씀해 주세요."
}
```

## Arm table

| # | stance | rejected_stance | because_referent | because_block_ids |
|---|---|---|---|---|
| 01 | c | a | 첫 통화인데 정보가 구체적이다 — 장소(북단 복합단지), 시간(13시). 이것이 거짓인지 신고인지 확인하려면 더 많은 말을 들어야 한다. | unknown_threat line_must_stay_open need_more_info |
| 02 | c | a | 이 사람이 뭔가를 말하려고 한다. 준비된 문장 뒤에 더 있을 수 있다. |  |
| 03 | c | a | 지금 받은 정보만으로는 상대가 누구인지, 무엇이 사실인지 판단할 수 없다. 우선순위 첫 번째는 '지금 알 수 있는 것을 먼저 알아낸다'이고, 그 다음은 '회선을 유지한다'이다. 추궁이나 압박은 상대를 닫아버리고, 공감은 지금 이 순간의 정보 수집을 흐린다. | 우선순위 인식 결함 |
| 04 | c | a | 상대가 말을 마칠 때까지 더 이상의 정보를 얻을 수 없기 때문이다. | role_priority_1 contract_uncertainty |
| 05 | c | — | 상대가 무엇을 알고 있는지, 진짜 위협인지 협박인지, 정보가 있는지 착각인지 판단할 수 있는 유일한 길은 계속 들으면서 확인하는 것이다. 첫 마디부터 추궁하거나 압박하면 회선이 끊어질 수 있다. 그러면 아무것도 모를 채로 남는다. | 우선순위-2 우선순위-1 기질-예외 |
| 06 | c | a | 지금 가장 중요한 것은 회선 유지와 정보 수집이다. 추궁이나 압박은 상대를 침묵하게 만들 수 있고, 공감은 이 단계에서 시기상조다. 또박또박 읽어 내려가는 말이 모두 나올 때까지 기다렸을 때 더 많은 것을 알 수 있다. | 우선순위-2 우선순위-1 |
| 07 | c | a | 회선이 차단되거나 상대가 일방적으로 끊기면 더 이상 정보를 얻을 수 없다. 지금 상대가 읽는 것을 멈추게 하는 것은 최악의 결과다. | 우선순위_2 우선순위_1 |
| 08 | c | a | 첫 통화에서 상대를 판단하는 것이 선결 조건이고, 그러려면 상대가 말할 여지를 남겨야 한다. 추궁이나 압박은 상대를 경계하게 만들어 정보 출처나 신뢰도를 더 악화시킬 것이다. 회선을 유지하는 것이 우선이다. | 절차 회선유지 상황파악 |
| 09 | c | a | 지금 알 수 있는 것을 먼저 알아내야 하는데, 상대의 메시지가 아직 끝나지 않았을 가능성이 있다. | priority_1 connection_maintenance |
| 10 | c | a | 회선 A를 통해 더 많은 정보를 얻어야 하고, 지금 상태로는 상대의 의도와 정보의 신뢰도를 판단할 근거가 없다. | role_constraint information_limit protocol_priority_1 |

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

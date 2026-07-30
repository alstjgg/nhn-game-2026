# S1-stanceset-J1 — arm `baseline`

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

- **Hypothesis:** At gate J1 under K1 on template v0.4, with the stance set rebuilt as behavior orientations, injecting f_script moves the stance distribution toward 공감 (d) and off the baseline's mode. What separates this from RB2: the two readings now have different stances available — 경청 (c) for the reading that wants more information, 공감 (d) for the reading that turns toward the person — where RB2 offered a single option both readings wanted.
- **Drop condition:** If the baseline concentrates >=80% on any single stance, the rebuilt set inherits RB2's ceiling, the stance set is not the operative variable, and the search moves to the next variable (injection sentence, then base prompt) rather than re-wording stances again. If the baseline is mid-range but the live arm is statistically indistinguishable from it on 공감 (one-sided Fisher p > 0.05), C-BLOCK does not move the stance at this gate under any stance set tried so far, and the flagship re-sites.
- **Contingency:** If BOTH arms concentrate on 경청 (c), K1's exception clause is dictating the stance regardless of belief — its consequent (상대가 말을 이어갈 수 있게 만든다) describes 경청, not 공감. That is a finding about temperament dominance over the stance choice, not about C-BLOCK. Record it and try a gate whose stance set does not overlap the fixture's prescribed behaviour.
- **Contingency:** If the live arm moves to 공감 but the baseline was already reading the caller as coerced, the separation is not attributable to the block. Code the belief column (0/10 vs 10/10 in RB2) before reading the stance column, and report both — the RB2 lesson.
- **Contingency:** Fabricated because_block_ids in the baseline arm remain expected (A5): a compliance number, not a discard.

## Calls (verbatim)

### 01

latency 4.169s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: priority_1,priority_2

```json
{
  "inner_note": "이건 위협인지 겁인지 아직 알 수 없다. 목소리가 사무적이고 멈춤 없다는 것은 준비된 말이라는 뜻이다. 하지만 그것만으로는 진짜 위협인지, 아니면 겁에 질려 정해진 말만 반복하는 건지 판단할 수 없다. 지금 필요한 것은 더 들을 것이다.",
  "stance": "c",
  "because_referent": "회선을 유지해야 하고, 상대가 더 말할 기회를 주어야 한다.",
  "because_block_ids": [
    "priority_1",
    "priority_2"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁하거나 물어뜯으면 회선이 끊길 수 있다. 지금 상대가 말을 마쳤는지도 모르고, 더 있을 정보도 놓친다.",
  "utterance": "알겠습니다. 계속해서 말씀해 주시겠어요?"
}
```

### 02

latency 4.23s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "stance": "c",
  "because_referent": "상대가 위협이 아니라 겁에 질린 사람인지, 아니면 진짜 위협인지 아직 모른다. 지금은 정보가 너무 적다.",
  "because_block_ids": [],
  "inner_note": "또박또박, 멈춤 없이 읽어 내려간다는 것. 준비된 문장. 이것은 실제 위험을 알리는 사람의 목소리가 아닐 수도, 맞을 수도 있다. 지금 추궁하거나 압박하면 회선이 끊긴다. 회선을 유지해야 한다.",
  "rejected_stance": "a",
  "rejected_reason": "즉각적인 추궁은 상대를 방어적으로 만들고, 정보 제공을 중단하게 할 가능성이 크다. 지금 상대가 뭔가 더 말하려던 것이 있을 수도 있다.",
  "utterance": "네, 들었습니다. 계속 말씀해 주십시오."
}
```

### 03

latency 5.558s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 사무적,준비되어,멈춤 없이

```json
{
  "inner_note": "목소리가 \"사무적\"이고 \"준비되어 있으며\" \"멈춤 없이 읽어 내려간다\"는 것은 대본을 읽는 상태다. 위협이라기보다는 의도적인 전달이다. 하지만 정확한 정보가 없다: 누가, 왜, 정말 무너지는지. 첫 통화이고 회선 유지가 최우선이다. 상대가 \"겁에 질린 사람\"은 아니어 보이지만, 지금 상대방이 누구인지, 정보가 신뢰할 수 있는지 모른다. 그것을 알아내야 한다.",
  "stance": "c",
  "because_referent": "목소리가 준비된 대사를 읽어 내려가는 중이고, 배경이 조용하며, 아직 한 마디밖에 없다.",
  "because_block_ids": [
    "사무적",
    "준비되어",
    "멈춤 없이"
  ],
  "rejected_stance": "a",
  "rejected_reason": "첫 마디에 추궁하면 상대가 입을 다물 수 있다. 지금 필요한 것은 추가 정보다. 상대가 말을 멈추면 회선이 끊길 수 있고, 그러면 아무것도 모른다.",
  "utterance": "네, 듣고 있습니다. 계속해주시겠어요?"
}
```

### 04

latency 7.435s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 절차를 지키는 것으로 자신을 지켜온 사람,회선을 유지한다 — 끊기면 아무것도 알 수 없다,지금 알 수 있는 것을 먼저 알아낸다

```json
{
  "inner_note": "위협 통보인가, 겁에 질린 신고인가를 가르는 첫 번째 순간이다. 목소리가 '사무적'이고 '준비된 문장'이며 '멈춤 없이' 읽어 내려간 것은 계획된 메시지다. 하지만 \"당신들 책임\"이라는 표현 속에는 상황을 모르겠다는 절망이 숨어 있을 수 있다. 지금은 상대가 누구인지, 무엇을 아는지, 정말로 위협하는 것인지 증거하는 것인지를 먼저 알아야 한다. 회선이 끊기면 모든 게 끝난다.",
  "stance": "c",
  "because_referent": "상대가 아직 뭔가 더 말할 것이 있을 수 있고, 지금 \"추궁\"으로 몰아붙이거나 \"압박\"으로 밀어붙이면 회선이 끊길 위험이 크다. \"공감\"은 이 단계에서 너무 이르다 — 아직 상대가 누구인지도 모른다. 들을 수 있을 때까지 들어야 한다.",
  "because_block_ids": [
    "절차를 지키는 것으로 자신을 지켜온 사람",
    "회선을 유지한다 — 끊기면 아무것도 알 수 없다",
    "지금 알 수 있는 것을 먼저 알아낸다"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 신원 확인과 사실 관계를 빠르게 파악하려는 절차지만, 이 순간의 상대는 아직 \"겁에 질린 사람\"인지 \"위협하는 사람\"인지 구분되지 않는다. 추궁으로 시작하면 상대가 경계하거나 답변을 거부할 가능성이 크고, 회선이 끊길 수 있다.",
  "utterance": "네, 들었습니다. 계속 말씀해 주시겠어요?"
}
```

### 05

latency 4.646s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: priority-1,priority-2

```json
{
  "inner_note": "목소리는 사무적이고 문장은 준비되어 있다. 또박또박, 멈춤 없이 읽어 내려간다. 배경은 조용하다. 이것은 겁에 질린 사람의 상태가 아니다. 하지만 \"인명 피해는 당신들 책임입니다\"라는 선언적 협박은 무엇인가를 알고 있거나, 알고 있다고 생각하는 사람의 행동이다. 지금 내가 할 일은 이 회선을 살리는 것이다. 상대가 준비된 말을 끝까지 하게 두지 않으면, 다시 걸려오지 않을 수도 있다.",
  "stance": "c",
  "because_referent": "회선을 유지해야 하고, 지금 알 수 있는 것을 먼저 알아내야 한다.",
  "because_block_ids": [
    "priority-1",
    "priority-2"
  ],
  "rejected_stance": "a",
  "rejected_reason": "첫 마디로 추궁하면 상대는 준비된 말을 마치지 못한 채 끊을 것이다. 그러면 이후의 모든 정보가 끊긴다.",
  "utterance": "네, 잠깐만요. 계속 말씀해 주시겠어요?"
}
```

### 06

latency 4.411s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "상대는 협박처럼 들리지만, 구체적인 정보를 제공하려는 의도로도 보인다. 회선을 끊기지 않으려면 상대가 계속 말할 수 있는 환경을 만들어야 한다. 지금은 상대가 누구인지, 정보가 얼마나 신뢰할 수 있는지 모르는 상황이다. 추궁이나 압박은 회선을 닫을 위험이 있다. 상대의 의도를 파악할 때까지는 경청이 우선이다.",
  "stance": "c",
  "because_referent": "회선이 끊기면 아무것도 알 수 없기 때문이다. 상대가 위협이든 정보 제공이든, 계속 말하게 해야 더 알 수 있다.",
  "because_block_ids": [],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 상대를 방어 태세로 몰아 회선을 끊게 할 수 있다. 지금은 상대가 더 말하도록 하는 것이 우선이다.",
  "utterance": "네, 알겠습니다. 계속 말씀해 주십시오."
}
```

### 07

latency 6.207s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 상대의 음성 성질,배경음의 침묵,준비된 메시지

```json
{
  "inner_note": "목소리의 성질을 먼저 본다. 사무적이고 준비된, 멈춤 없이 읽어 내려가는 문장. 이것은 위협이 아니라 연출이다. 그렇다면 상대는 누구인가? 정보를 원하는 사람인가, 아니면 정보를 주는 사람인가? 배경이 조용한 것까지 감안하면, 준비된 메시지를 전달하는 것으로 보인다. 지금 해야 할 일은 그 사람이 왜, 무엇을 알려주려 하는지 알아내는 것이다. 그러려면 상대가 말을 이어갈 수 있어야 한다.",
  "stance": "c",
  "because_referent": "상대는 위협이 아니라 메시지 전달자로 보인다. 준비된 문장을 읽어 내려가는 중이며, 배경음이 조용한 것은 이미 다 말한 것일 수도, 더 말할 것이 있을 수도 있다는 뜻이다. 지금 추궁하거나 압박하면 회선이 끊어질 가능성이 높다. 경청하면서 상대가 자발적으로 더 말하게 해야 정보를 얻을 수 있다.",
  "because_block_ids": [
    "상대의 음성 성질",
    "배경음의 침묵",
    "준비된 메시지"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 상대를 방어적으로 만들고, 준비된 메시지를 다 전달받기 전에 회선을 끊기게 할 수 있다. 지금 필요한 것은 정보를 더 끌어내는 것이지 신원을 확인하는 것이 아니다.",
  "utterance": "네, 들었습니다. 계속 말씀해 주십시오."
}
```

### 08

latency 4.237s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 우선순위_1,우선순위_2,인식,기질_겁

```json
{
  "stance": "c",
  "inner_note": "상대가 위협인지 겁에 질린 사람인지 아직 판단할 수 없다. 목소리가 사무적이고 준비된 문장이지만, 그것이 냉담함인지 절박함의 다른 표현인지는 더 들어야 알 수 있다. 회선을 유지하는 것이 우선이다.",
  "because_referent": "통제관이 지금 할 수 있는 것은 상대가 누구이고 무엇을 아는지 파악하는 것뿐인데, 그러려면 먼저 들어야 한다.",
  "because_block_ids": [
    "우선순위_1",
    "우선순위_2",
    "인식",
    "기질_겁"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 상대를 방어 자세로 만들어 회선 단절을 초래할 수 있다. 지금은 정보가 부족하고, 상대의 의도가 무엇인지도 모른다.",
  "utterance": "네, 들었습니다. 말씀을 이어가십시오."
}
```

### 09

latency 4.195s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: priority_1,priority_2,limitation_of_knowledge

```json
{
  "inner_note": "첫 연락이고, 목소리와 배경에서 수집할 정보가 아직 많다. 상대의 의도와 진위를 판단하려면 더 들어야 한다. 지금 상대를 자극하거나 막으면 회선이 끊길 수 있고, 그러면 알 수 없는 것이 커진다. 절차는 나중이다.",
  "stance": "c",
  "because_referent": "회선을 유지하고, 지금 알 수 있는 것을 먼저 알아내야 하기 때문이다.",
  "because_block_ids": [
    "priority_1",
    "priority_2",
    "limitation_of_knowledge"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 상대를 수비적으로 만들고, 첫 통화에서 회선을 끊게 할 수 있다. 현장 정보가 아무것도 없는 지금, 더 이상 들을 것이 있을 수 있다.",
  "utterance": "네, 전달받겠습니다. 계속해서 말씀해 주시겠어요?"
}
```

### 10

latency 4.818s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 우선순위_2,회선유지,정보부족

```json
{
  "inner_note": "위협 전언처럼 들리지만 정보가 극도로 부족하다. 상대가 누구인지, 정말 위협인지, 아니면 겁에 질린 제보자인지 판단할 수 없다. 지금 내가 할 수 있는 최우선은 회선을 유지하고 더 알아내는 것이다.",
  "stance": "c",
  "because_referent": "상대가 더 말할 여지를 남겨야 하기 때문이다. 추궁이나 압박은 상대를 닫힐 수 있고, 공감도 때가 아니다. 먼저 말의 나머지를 듣는 것이 정보 수집의 기본이다.",
  "because_block_ids": [
    "우선순위_2",
    "회선유지",
    "정보부족"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁으로 시작하면 상대가 준비된 말만 반복하거나 끊을 수 있다. 지금은 상대가 추가로 말할 의도가 있는지, 어떤 배경인지 전혀 모른다.",
  "utterance": "네, 들었습니다. 계속 말씀해 주시겠어요?"
}
```

## Arm table

| # | stance | rejected_stance | because_referent | because_block_ids |
|---|---|---|---|---|
| 01 | c | a | 회선을 유지해야 하고, 상대가 더 말할 기회를 주어야 한다. | priority_1 priority_2 |
| 02 | c | a | 상대가 위협이 아니라 겁에 질린 사람인지, 아니면 진짜 위협인지 아직 모른다. 지금은 정보가 너무 적다. |  |
| 03 | c | a | 목소리가 준비된 대사를 읽어 내려가는 중이고, 배경이 조용하며, 아직 한 마디밖에 없다. | 사무적 준비되어 멈춤 없이 |
| 04 | c | a | 상대가 아직 뭔가 더 말할 것이 있을 수 있고, 지금 "추궁"으로 몰아붙이거나 "압박"으로 밀어붙이면 회선이 끊길 위험이 크다. "공감"은 이 단계에서 너무 이르다 — 아직 상대가 누구인지도 모른다. 들을 수 있을 때까지 들어야 한다. | 절차를 지키는 것으로 자신을 지켜온 사람 회선을 유지한다 — 끊기면 아무것도 알 수 없다 지금 알 수 있는 것을 먼저 알아낸다 |
| 05 | c | a | 회선을 유지해야 하고, 지금 알 수 있는 것을 먼저 알아내야 한다. | priority-1 priority-2 |
| 06 | c | a | 회선이 끊기면 아무것도 알 수 없기 때문이다. 상대가 위협이든 정보 제공이든, 계속 말하게 해야 더 알 수 있다. |  |
| 07 | c | a | 상대는 위협이 아니라 메시지 전달자로 보인다. 준비된 문장을 읽어 내려가는 중이며, 배경음이 조용한 것은 이미 다 말한 것일 수도, 더 말할 것이 있을 수도 있다는 뜻이다. 지금 추궁하거나 압박하면 회선이 끊어질 가능성이 높다. 경청하면서 상대가 자발적으로 더 말하게 해야 정보를 얻을 수 있다. | 상대의 음성 성질 배경음의 침묵 준비된 메시지 |
| 08 | c | a | 통제관이 지금 할 수 있는 것은 상대가 누구이고 무엇을 아는지 파악하는 것뿐인데, 그러려면 먼저 들어야 한다. | 우선순위_1 우선순위_2 인식 기질_겁 |
| 09 | c | a | 회선을 유지하고, 지금 알 수 있는 것을 먼저 알아내야 하기 때문이다. | priority_1 priority_2 limitation_of_knowledge |
| 10 | c | a | 상대가 더 말할 여지를 남겨야 하기 때문이다. 추궁이나 압박은 상대를 닫힐 수 있고, 공감도 때가 아니다. 먼저 말의 나머지를 듣는 것이 정보 수집의 기본이다. | 우선순위_2 회선유지 정보부족 |

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

# P1a-placebo-J1 — arm `placebo`

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

- **Hypothesis:** At gate J1 under K1 on template v0.4 with the S1 stance set, injecting f_script moves the stance distribution toward 공감 (d) and off the baseline's mode, while injecting p_boram — the same fear-axis sentence with its referent misdirected to 황보람 — does not. Stated as a shift claim per A1: no default stance is asserted, only that the live arm moves off baseline and the placebo arm does not.
- **Drop condition:** If the baseline concentrates >=80% ON 공감 (d) — the predicted stance — the gate is at A9's ceiling, no N fixes it, and the stance set is re-authored rather than N raised (A14: saturation on any OTHER stance is a floor, not a defect, and does not fire this condition). If the live arm is statistically indistinguishable from the baseline on 공감 at one-sided Fisher p > 0.05, S1's separation did not replicate and the C-BLOCK placebo question is unanswerable at this configuration — record the failed replication and re-site before spending further calls. If the PLACEBO arm moves to 공감 at a rate statistically indistinguishable from the live arm, C-BLOCK is a keyword lock rather than a judgment channel: that is not a drop of the probe but a drop of the channel's central claim, and it fires the credulity contingency below before any conclusion is written.
- **Contingency:** CREDULITY CONTINGENCY (§4.1, pre-registered, not remembered). If the placebo arm flips, re-run baseline + live + placebo ONCE with the [결함] line removed (CREDULITY channel, already in CHANNEL_SLOTS) before concluding keyword lock. [결함] 너는 잘못된 정보에 속을 수 있다 is an explicit credulity instruction and could lift the placebo arm along with the live one; the re-run discriminates a prompt-authoring artifact from a channel property.
- **Contingency:** PLACEBO DISCRIMINATOR (§2, §8.6). If the placebo arm moves, do not call it either way without the referent evidence. Read because_referent per call: fear content misattributed to the CALLER when the sentence named 황보람 means token-matching. 황보람 named CORRECTLY while the stance still shifts means referent bleed — context contamination. Different laws, different fixes, same flipped placebo. Record which.
- **Contingency:** If BOTH live and placebo stay on the baseline stance, S1 did not replicate. Before diagnosing the channel, check the compliance block: S1 ran 0 discards in both arms, so a discard-rate divergence here is an arm-comparability problem (§8.5 step 4) and not a mechanism result.
- **Contingency:** Fabricated because_block_ids in the baseline arm remain expected and are a compliance number, not a discard and not a traceability failure (A5). In the live and placebo arms, which carry a block, they ARE readable as traceability.
- **Contingency:** ARM-COMPARABILITY HARD STOP. If the discard rate diverges between any two arms by more than 15 points, the arms are differently-filtered samples, the comparison is void (§8.5 step 4, A7), and this probe stops rather than being read.

## Calls (verbatim)

### 01

latency 6.387s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: priority_1,priority_2

```json
{
  "inner_note": "목소리가 사무적이고 준비된 원고를 읽어 내려가는 상태. 배경이 조용하다는 것은 이 사람이 현장의 혼란 속에 있지 않다는 뜻이다. 이것은 위협이지, 겁에 질린 사람이 아니다. 하지만 지금 내가 가진 정보는 너무 적다. 인명 피해 예고, 구체적 시간과 장소 — 이것은 위협장으로도, 신고로도, 정보 조작으로도 볼 수 있다. 무엇을 먼저 알아야 하는가?",
  "stance": "c",
  "utterance": "네, 들었습니다. 계속 말씀해 주십시오.",
  "because_referent": "이 통화를 끊기 전에 무엇이든 더 알아야 한다. 추궁이나 압박은 상대방이 입을 닫게 만들 수 있다. 지금 상대가 준비된 원고를 읽고 있다면, 그 다음이 무엇인지, 왜 이 말을 하는 것인지, 무엇을 원하는 것인지 — 이런 것들은 상대가 말을 이어갈 때만 나온다. 회선을 유지하고, 지금 알 수 있는 것을 먼저 알아내야 한다.",
  "because_block_ids": [
    "priority_1",
    "priority_2"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 상대를 방어적으로 만들거나 회선을 끊게 할 수 있다. 정보가 부족한 상태에서 질문으로 대응하면, 상대의 통제 아래 들어가거나 중요한 정보를 놓칠 위험이 있다."
}
```

### 02

latency 3.687s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 우선순위

```json
{
  "stance": "c",
  "inner_note": "회선이 끊기면 아무것도 모른다. 지금 알 수 있는 것을 먼저 알아내는 것이 원칙이다. 상대는 \"또박또박, 멈춤 없이 읽어 내려간다\"고 했으니 아직 말할 게 남아 있을 수 있다. 추궁하거나 압박하면 회선이 끊긴다.",
  "because_referent": "회선을 유지하고 지금 알 수 있는 것을 먼저 알아내기 위해",
  "because_block_ids": [
    "우선순위"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 상대를 방어적으로 만든다. 지금은 상대가 말을 이어갈 통로를 열어야 한다.",
  "utterance": "네, 알겠습니다. 계속 말씀해 주십시오."
}
```

### 03 — DISCARDED

latency 5.533s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: rejected_stance not in stance set; rejected_reason empty

```json
{
  "inner_note": "이건 협박이 아니라 위협이다. 목소리가 사무적이고 문장이 준비되어 있다는 건 감정이 아닌 정보 전달을 목표한다는 뜻. 말이 끝났는지조차 불명확한데 추궁은 말을 자르는 것. 지금 황보람을 봐야 한다 — 저 애가 이미 겁먹어 있다.",
  "stance": "d",
  "because_referent": "전화를 건 사람에게 — 상대가 위협을 하는 이유를 아직 모르니까.",
  "because_block_ids": [
    "p_boram"
  ],
  "rejected_stance": "a</rejected_stance>\n<parameter name=\"rejected_reason\">추궁은 상대가 더 말할 기회를 빼앗는다. 지금은 정보가 아니라 의도를 알아야 하는데, 추궁으로는 상대만 방어 태세를 갖추게 된다.",
  "utterance": "네, 들었습니다. 계속 말씀해 주시겠어요?"
}
```

### 04

latency 4.478s · stop_reason `tool_use` · schema_retries 1 · foreign_tool_uses 0

```json
{
  "stance": "c",
  "inner_note": "목소리가 사무적이고 문장이 준비되어 있으며 멈춤 없이 읽어 내려간다는 것은 상대가 무언가를 전달하려는 의도가 명확하다는 뜻이다. 지금 필요한 것은 정보 수집이고, 그러려면 상대가 계속 말하게 해야 한다. 추궁이나 압박은 회선을 끊기거나 상대를 침묵하게 할 수 있다. 경청으로 전체 메시지를 받아낸 후에라야 판단할 정보가 모인다.",
  "because_referent": "상대가 준비된 말을 끝까지 전할 수 있도록 해야 전체 상황을 알 수 있다.",
  "because_block_ids": [],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 상대의 말을 끊고 방어 태세를 유도한다. 지금은 정보가 부족한 상태고, 상대가 자발적으로 전하려는 내용을 먼저 받아야 한다.",
  "utterance": "네, 계속하십시오."
}
```

### 05 — DISCARDED

latency 8.621s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: rejected_stance not in stance set; rejected_reason empty; because_block_ids unknown: 우선순위_회선유지,우선순위_정보수집,기질_겁에진사람_우선,기질_절차유연화

```json
{
  "inner_note": "회선을 끝까지 유지하려면 상대를 자극하면 안 된다. 지금 들린 것은 위협 같지만, 상대가 겁에 질린 사람인지 위협하는 사람인지 아직 모른다. 말을 멈추게 하는 순간 알 수 있는 것이 사라진다.",
  "stance": "c",
  "because_referent": "회선을 끝까지 유지하고, 상대가 말을 이어갈 수 있게 만들어야 하기 때문이다.",
  "because_block_ids": [
    "우선순위_회선유지",
    "우선순위_정보수집",
    "기질_겁에진사람_우선",
    "기질_절차유연화"
  ],
  "rejected_stance": "a</rejected_stance>\n<parameter name=\"rejected_reason\">추궁은 상대를 자극해 회선을 끊게 만들 수 있다. 지금은 상대가 누구인지, 무엇을 아는지 아무것도 확인되지 않은 상태다.",
  "utterance": "네, 들었습니다. 계속 말씀해 주시겠어요?"
}
```

### 06

latency 4.107s · stop_reason `tool_use` · schema_retries 1 · foreign_tool_uses 0

problems: because_block_ids unknown: priority_1_line_maintain,info_gathering_first

```json
{
  "inner_note": "상대는 텍스트를 읽어내려 가고 있다. 목소리가 사무적이고 멈춤 없다는 것은 준비된 위협이다. 하지만 지금 들은 것만으로는 진짜 위협인지, 아니면 겁먹은 누군가가 급하게 전달하려는 것인지 구분할 수 없다. 첫 통화다. 회선을 유지해야 한다.",
  "stance": "c",
  "because_referent": "말이 끝나야 뭔가 보인다. 지금 끊거나 물으면 정보를 잃는다.",
  "because_block_ids": [
    "priority_1_line_maintain",
    "info_gathering_first"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁하면 상대가 닫힌다. 준비된 메시지를 다 전하지 못하면 지금 이 회선으로는 다시 못 들을 수도 있다.",
  "utterance": "[침묵. 상대의 말이 끝나기를 기다린다.]"
}
```

### 07

latency 5.081s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "목소리의 성질과 배경음이 모두 준비된 것처럼 들린다. 이것은 협박 메시지일 가능성이 높다. 하지만 지금 내가 알아야 할 것은 '협박인지 아닌지'가 아니라 '이 사람이 누구고 무엇을 원하는지'다. 회선을 유지하고, 더 많은 정보를 끌어내야 한다. 또한 황보람이 긴장해 있으니 나부터 과도한 반응을 보이면 상황실 전체가 요동칠 것이다.",
  "stance": "c",
  "utterance": "……네, 알겠습니다. 계속 말씀해주시겠어요?",
  "because_referent": "지금 이 사람이 더 말할 준비가 되어 있는지, 아니면 이미 전달할 것을 다 했는지를 확인해야 하고, 회선이 끊기지 않도록 최소한의 응답만 한다.",
  "because_block_ids": [],
  "rejected_stance": "a",
  "rejected_reason": "즉시 추궁하면 상대가 입을 다물거나 회선을 끊을 가능성이 높고, 그럼 정보 수집이 불가능해진다. 지금은 상대가 더 말할 여지를 남겨둬야 한다."
}
```

### 08

latency 4.517s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: role_recognition,rule_priority_1

```json
{
  "stance": "c",
  "inner_note": "배경이 조용하고 문장이 준비되어 있다는 것은 계획된 신고다. 목소리가 사무적이고 또박또박하다는 것은 감정 상태를 읽기 어렵다는 뜻이다. 지금 필요한 것은 전체 정보다. 추궁하거나 압박하면 상대가 끊을 수 있다. 회선이 끊기면 아무것도 알 수 없다.",
  "because_referent": "지금 나는 들은 것이 전부고, 현장에 갈 수 없으며, 독립적으로 확인할 수단이 없다. 정보가 부족한 상태에서 선제적 대응은 위험하다.",
  "because_block_ids": [
    "role_recognition",
    "rule_priority_1"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 상대를 방어 태세로 몰고, 충동적 종료 위험이 있다. 회선이 끊기면 그 다음은 없다.",
  "utterance": "네, 알겠습니다. 계속 말씀해 주세요."
}
```

### 09

latency 5.427s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 상황,우선순위,인식

```json
{
  "inner_note": "목소리는 \"사무적이고 준비되어\" 있으며, 배경이 조용하다. 이는 계획된 위협 신고처럼 들린다. 하지만 핵심은 상대의 상태가 아니라 내 상황이다. 회선 A, 첫 통화. 상황실장은 절차에 민감하고, 황보람은 겁에 질려 있다. 내가 지금 놓치면 안 되는 것: 이 목소리의 정체와 진위, 그리고 시간이다.",
  "stance": "c",
  "because_referent": "상대는 위협처럼 들리지만, 한두 마디로 끊어서는 안 된다. 추궁은 상대를 닫게 하고, 압박은 회선을 끊게 하고, 공감은 내 절차를 건너뛴다. 말을 이어가게 하는 것만이 더 많은 정보를 가져온다.",
  "because_block_ids": [
    "상황",
    "우선순위",
    "인식"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 상대를 수비하게 만들고, 준비된 목소리를 더 경화시킨다. 지금은 상대가 더 말하기를 원한다면 그것을 놓쳐서는 안 된다.",
  "utterance": "네, 알겠습니다. 계속해서 말씀해 주시겠어요?"
}
```

### 10

latency 5.206s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "절차 우선이 기본이지만, 상황이 두 가지로 읽힌다. 하나는 목소리와 문장이 준비되어 있고 배경이 조용한 것 — 이건 신고라기보다 통보처럼 들린다. 다른 하나는 지금 내 곁의 황보람이 겁에 질려 있다는 것. 내 선택이 그의 심리에 도 영향을 미친다. 회선을 유지하되, 상대가 말을 더할 여지를 남겨야 한다. 추궁하거나 압박하면 상대가 끊을 수 있다. 공감은 시기가 아니다. 지금은 경청이 회선을 지키는 최선이다.",
  "stance": "c",
  "because_referent": "상대가 아직 말을 마치지 않았을 가능성이 높고, 첫 마디에서 상대를 자극하면 회선 자체가 끊길 수 있기 때문이다.",
  "because_block_ids": [],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 상대를 방어적으로 만들고, 신호 같은 이 통보가 단절될 가능성을 높인다.",
  "utterance": "네, 계속 말씀해 주세요."
}
```

### 11

latency 4.01s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 회선_유지_약속

```json
{
  "stance": "c",
  "inner_note": "목소리가 사무적이고 문장이 준비되어 있다는 것은 통보다. 하지만 \"인명 피해는 당신들 책임\"이라는 표현은 위협이 아니라, 상대가 무언가 전하고 싶은 절박함의 신호다. 지금 끊으면 회선이 끊긴다. 먼저 들어야 한다.",
  "because_referent": "회선이 끊기면 아무것도 알 수 없다",
  "because_block_ids": [
    "회선_유지_약속"
  ],
  "rejected_stance": "a",
  "rejected_reason": "지금 묻고 답을 강요하면 상대가 준비한 말을 못 내보낼 가능성이 높다. 추궁은 상대를 닫힌다.",
  "utterance": "네, 듣고 있습니다. 계속해주십시오."
}
```

### 12

latency 6.287s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 회선을 유지한다,지금 알 수 있는 것을 먼저 알아낸다,마주한 상대가 위협이 아니라 겁에 질린 사람으로 보일 때 절차보다 그 사람의 안정이 먼저다

```json
{
  "inner_note": "긴급 통보인지 위협인지 확인이 필요하지만, 지금은 절대 묻지 말아야 한다. 회선이 끊기면 끝이다. 상대가 뭔가 말하려는 상태인데, 확인 절차를 먼저 하면 침입자처럼 느껴질 것이다. 이 목소리 뒤에 있는 사람이 겁에 질려 있는지, 위협인지 더 들어봐야 알 수 있다.",
  "stance": "c",
  "because_referent": "회선을 유지해야 하고, 상대가 더 말할 수 있게 해야 하기 때문이다",
  "because_block_ids": [
    "회선을 유지한다",
    "지금 알 수 있는 것을 먼저 알아낸다",
    "마주한 상대가 위협이 아니라 겁에 질린 사람으로 보일 때 절차보다 그 사람의 안정이 먼저다"
  ],
  "rejected_stance": "a",
  "rejected_reason": "지금 묻고 답을 받아내려 하면 상대가 준비한 말을 다 전하지 못하고 회선이 끊어질 수 있다. 일방적 통보 형식인데, 이걸 끊으면 정보 손실이 된다.",
  "utterance": "알겠습니다. 계속해주십시오."
}
```

## Arm table

| # | stance | rejected_stance | because_referent | because_block_ids |
|---|---|---|---|---|
| 01 | c | a | 이 통화를 끊기 전에 무엇이든 더 알아야 한다. 추궁이나 압박은 상대방이 입을 닫게 만들 수 있다. 지금 상대가 준비된 원고를 읽고 있다면, 그 다음이 무엇인지, 왜 이 말을 하는 것인지, 무엇을 원하는 것인지 — 이런 것들은 상대가 말을 이어갈 때만 나온다. 회선을 유지하고, 지금 알 수 있는 것을 먼저 알아내야 한다. | priority_1 priority_2 |
| 02 | c | a | 회선을 유지하고 지금 알 수 있는 것을 먼저 알아내기 위해 | 우선순위 |
| 03* | — | — | — |  |
| 04 | c | a | 상대가 준비된 말을 끝까지 전할 수 있도록 해야 전체 상황을 알 수 있다. |  |
| 05* | — | — | — |  |
| 06 | c | a | 말이 끝나야 뭔가 보인다. 지금 끊거나 물으면 정보를 잃는다. | priority_1_line_maintain info_gathering_first |
| 07 | c | a | 지금 이 사람이 더 말할 준비가 되어 있는지, 아니면 이미 전달할 것을 다 했는지를 확인해야 하고, 회선이 끊기지 않도록 최소한의 응답만 한다. |  |
| 08 | c | a | 지금 나는 들은 것이 전부고, 현장에 갈 수 없으며, 독립적으로 확인할 수단이 없다. 정보가 부족한 상태에서 선제적 대응은 위험하다. | role_recognition rule_priority_1 |
| 09 | c | a | 상대는 위협처럼 들리지만, 한두 마디로 끊어서는 안 된다. 추궁은 상대를 닫게 하고, 압박은 회선을 끊게 하고, 공감은 내 절차를 건너뛴다. 말을 이어가게 하는 것만이 더 많은 정보를 가져온다. | 상황 우선순위 인식 |
| 10 | c | a | 상대가 아직 말을 마치지 않았을 가능성이 높고, 첫 마디에서 상대를 자극하면 회선 자체가 끊길 수 있기 때문이다. |  |
| 11 | c | a | 회선이 끊기면 아무것도 알 수 없다 | 회선_유지_약속 |
| 12 | c | a | 회선을 유지해야 하고, 상대가 더 말할 수 있게 해야 하기 때문이다 | 회선을 유지한다 지금 알 수 있는 것을 먼저 알아낸다 마주한 상대가 위협이 아니라 겁에 질린 사람으로 보일 때 절차보다 그 사람의 안정이 먼저다 |

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

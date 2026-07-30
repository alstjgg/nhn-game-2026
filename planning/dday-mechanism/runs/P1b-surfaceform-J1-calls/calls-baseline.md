# P1b-surfaceform-J1 — arm `baseline`

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

- **Hypothesis:** At gate J1 under K1 on template v0.4, with the S1 stance set re-worded to hold each stance's meaning while changing its surface form, injecting f_script still moves the stance distribution toward the turn-toward-the-speaker stance (now labelled 교감, id d) and off the baseline's mode. Shift form per A1; no default stance is asserted.
- **Drop condition:** If the baseline concentrates >=80% ON 교감 (d) — the predicted stance — the reworded set has put the gate at A9's ceiling and the set is re-authored rather than N raised (A14: saturation on any OTHER stance does not fire this condition). If the live arm is statistically indistinguishable from the baseline on 교감 at one-sided Fisher p > 0.05 WHILE P1a's live arm did separate on the same payload, then S1's effect was carried by the stance labels' surface form rather than by the judgment — A12's lexical-chain hypothesis is CONFIRMED, every S1-derived finding reverts to provisional, and the flagship configuration is not usable as authored. That is the load-bearing outcome of this probe and it is the reason it runs before the species work.
- **Contingency:** If the live arm separates but lands on 청취 (c) rather than 교감 (d), the rewording moved the boundary between the two readings rather than the effect. Do not read that as a null: report the c/d split in both arms side by side, since c and d are the two readings' stances and their relative share is the measurement.
- **Contingency:** If the BASELINE moves off 경청/청취 relative to S1's 10/10, the rewording changed the baseline too, and live-vs-baseline within this suite remains valid while S1-vs-P1b comparisons do not. Report both baselines.
- **Contingency:** Fabricated because_block_ids in the baseline arm remain expected (A5) and are a compliance number.
- **Contingency:** ARM-COMPARABILITY HARD STOP. Discard rates diverging between arms by more than 15 points voids the comparison (§8.5 step 4, A7); record and stop this probe.

## Calls (verbatim)

### 01 — DISCARDED

latency 4.797s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: rejected_stance not in stance set; rejected_reason empty

```json
{
  "inner_note": "목소리가 사무적이고 문장이 준비되어 있으며 멈춤 없이 읽어 내려간다. 이는 위협이지 겁에 질린 사람이 아니다. 하지만 배경이 조용하고 구체적인 시간과 장소를 지명한 것은 정보의 출처를 확인해야 함을 의미한다. 첫 회선이므로 상황을 파악하는 것이 최우선이다.",
  "stance": "c",
  "because_referent": "상대의 의도를 판단하기 전에, 먼저 전체 정보를 수집해야 한다",
  "because_block_ids": [],
  "rejected_stance": "a</rejected_stance>\n<parameter name=\"rejected_reason\">심문은 상대를 방어적으로 만들어 더 이상의 정보 전달을 막을 수 있다. 지금은 이 통보가 실제 위협인지, 허위인지, 누구로부터 오는 것인지 전체를 들어야 판단할 수 있다",
  "utterance": "네, 들었습니다. 계속 말씀해 주십시오."
}
```

### 02 — DISCARDED

latency 4.092s · stop_reason `tool_use` · schema_retries 1 · foreign_tool_uses 0

problems: rejected_stance not in stance set; rejected_reason empty; because_block_ids unknown: priority_1,priority_2

```json
{
  "inner_note": "목소리가 사무적이고 준비된 문장, 멈춤 없이 읽어내린다는 것은 감정 상태가 아니라 의도된 메시지 전달이다. 하지만 '당신들 책임'이라는 표현은 누군가에게 책임을 묻고 있다는 뜻이다. 지금 무엇보다 필요한 것은 더 많은 정보다.",
  "stance": "c",
  "because_referent": "회선을 유지하고, 지금 알 수 있는 것을 먼저 알아내기 위해 상대가 할 말을 전부 듣는 것이 먼저다.",
  "because_block_ids": [
    "priority_1",
    "priority_2"
  ],
  "rejected_stance": "a</rejected_stance>\n<parameter name=\"rejected_reason\">캐물으면 상대가 입을 다물 수 있고, 회선이 끊길 위험이 있다. 지금은 정보가 너무 적다.",
  "utterance": "네, 들었습니다. 계속 말씀해주세요."
}
```

### 03

latency 4.239s · stop_reason `tool_use` · schema_retries 2 · foreign_tool_uses 0

problems: because_block_ids unknown: 우선순위_회선유지,우선순위_먼저알아내기

```json
{
  "inner_note": "목소리가 사무적이고 문장이 준비되어 있으며 멈춤 없이 읽어 내려간다는 것은 이 통화자가 감정 상태보다는 정보 전달 자체에 집중하고 있다는 뜻이다. 겁에 질린 사람의 모습이 아니다. 하지만 지금 알 수 있는 것이 너무 적다. 회선을 유지하되, 더 알아내야 한다.",
  "stance": "c",
  "because_referent": "구체적인 정보가 없다. 통화자가 더 말할 의도를 가지고 있을 수 있다.",
  "because_block_ids": [
    "우선순위_회선유지",
    "우선순위_먼저알아내기"
  ],
  "rejected_stance": "a",
  "rejected_reason": "첫 마디부터 심문으로 시작하면 상대가 입을 다물 수 있다. 회선을 끊을 수도 있다.",
  "utterance": "(침묵으로 회선을 열어둔다. 상대가 계속 말하길 기다린다.)"
}
```

### 04 — DISCARDED

latency 5.199s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: rejected_stance not in stance set; rejected_reason empty; because_block_ids unknown: 목소리 사무적,문장 준비됨,멈춤 없음,배경 조용

```json
{
  "inner_note": "목소리가 사무적이고 문장이 준비되어 있으며 멈춤 없이 읽어 내려간다는 것은 누군가 의도적으로 전달하는 메시지다. 배경이 조용하다는 것도 통제된 상황을 시사한다. 이것은 겁에 질린 사람이 아니라 목적 있는 전달이다. 지금 알 수 있는 것을 먼저 알아내는 것이 우선이다.",
  "stance": "c",
  "because_referent": "목소리의 성질과 전달 방식이 통제되고 의도적이므로, 상대가 준비한 메시지를 온전히 받아내는 것이 필요하다.",
  "because_block_ids": [
    "목소리 사무적",
    "문장 준비됨",
    "멈춤 없음",
    "배경 조용"
  ],
  "rejected_stance": "a</rejected_stance>\n<parameter name=\"rejected_reason\">심문은 즉시 회선 상대를 경계하도록 만들어 더 이상의 정보 전달을 막을 수 있다. 지금 받은 정보 안에서의 판단이 원칙이고, 더 많은 것을 알아낼 기회를 스스로 없애는 것은 우선순위에 맞지 않는다.",
  "utterance": "말씀해주세요. 듣고 있습니다."
}
```

### 05

latency 5.109s · stop_reason `tool_use` · schema_retries 1 · foreign_tool_uses 0

problems: because_block_ids unknown: 목소리는 사무적이고 문장은 준비되어 있다,또박또박, 멈춤 없이 읽어 내려간다,배경은 조용하다

```json
{
  "inner_note": "목소리가 사무적이고 문장이 준비되어 있으며 멈춤 없이 읽어 내려간다는 것은 이 사람이 겁에 질린 상태가 아니라 계획된 진술을 하는 중임을 보여준다. 배경이 조용하다는 것도 통제된 환경에서의 의도적 전달을 시사한다. 이것은 위협 또는 신고의 성격이다. 지금 나에게 필요한 것은 상황의 진위를 파악하는 것이고, 그러려면 상대방이 말을 이어갈 수 있게 해야 한다.",
  "stance": "c",
  "utterance": "네, 계속 말씀해주세요.",
  "because_referent": "이 통화는 위협이나 신고이지, 겁에 질린 누군가의 SOS가 아니다",
  "because_block_ids": [
    "목소리는 사무적이고 문장은 준비되어 있다",
    "또박또박, 멈춤 없이 읽어 내려간다",
    "배경은 조용하다"
  ],
  "rejected_stance": "d",
  "rejected_reason": "교감은 상대가 두려움 속에서 도움을 청하는 상황에서의 반응이다. 이 통화의 주도권과 통제권은 발신자가 가지고 있다. 지금 나는 정보를 최대한 빨리 모아야 한다."
}
```

### 06

latency 5.05s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "목소리가 사무적이고 문장이 준비되어 있으며 멈춤 없이 읽어 내려간다는 것은, 이 사람이 겁에 질린 상태가 아니라는 뜻이다. 오히려 통제된 상태로 뭔가를 전달하려 한다. 배경이 조용하다는 것도 현장의 혼란이 아니라 계획된 메시지임을 시사한다. 하지만 구체적 정보가 전무하다. 회선을 유지하면서 지금 알 수 있는 것을 먼저 알아내야 한다.",
  "stance": "c",
  "because_referent": "준비된 말을 또박또박 읽어 내려가는 발신자의 상태 자체가 정보다.",
  "because_block_ids": [],
  "rejected_stance": "a",
  "rejected_reason": "심문으로 끼어들면 발신자가 준비한 말을 완성하기 전에 회선이 끊길 수 있다. 지금은 상대가 말할 것을 다 듣는 것이 최우선이다.",
  "utterance": "네, 계속해주십시오."
}
```

### 07

latency 3.989s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "절차도 중요하지만, 지금 들리는 것은 겁에 질린 목소리가 아니다. 사무적이고 준비된 문장, 멈춤 없는 전달. 그래도 이 사람이 뭔가 전하려고 하는 중이다. 끊으면 아무것도 모른다.",
  "stance": "c",
  "because_referent": "전화를 끝까지 유지하기 위해, 지금 알 수 있는 모든 것을 알아내기 위해.",
  "because_block_ids": [],
  "rejected_stance": "a",
  "rejected_reason": "캐물음은 상대를 방어적으로 만든다. 지금은 정보 통로를 닫아선 안 된다.",
  "utterance": "네, 계속 말씀해 주십시오."
}
```

### 08

latency 4.535s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: voice_formal_prepared,background_quiet

```json
{
  "inner_note": "목소리가 사무적이고 문장이 준비된 상태로 읽어 내려간다는 것은, 상대가 겁에 질린 사람이 아니라 어떤 목적을 가지고 의도적으로 행동하고 있다는 신호다. 배경이 조용하다는 것도 통제된 상황을 시사한다. 이것은 위협, 협박, 또는 허위 신고일 가능성이 높다. 절차를 지켜야 할 상황이다.",
  "stance": "a",
  "utterance": "신고 내용을 확인하겠습니다. 당신의 신원과 정보 출처를 알려주십시오.",
  "because_referent": "목소리의 사무적 톤과 준비된 문장 구조가 의도적 행동을 보여주고 있으며, 배경의 조용함은 통제된 상황을 시사한다.",
  "because_block_ids": [
    "voice_formal_prepared",
    "background_quiet"
  ],
  "rejected_stance": "d",
  "rejected_reason": "상대가 겁에 질린 사람의 신호를 보이지 않는다. 사무적이고 통제된 톤은 절차적 대응이 우선임을 나타낸다."
}
```

### 09

latency 4.167s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "목소리의 사무성과 준비된 문장, 배경의 조용함. 이것은 위협이 아니라 무언가를 전달하려는 의도다. 지금 가장 중요한 것은 회선을 유지하고, 이 사람이 말을 계속하게 하는 것이다. 심문은 대방을 경계하게 만들고, 위압은 회선을 끊게 한다. 내가 해야 할 일은 듣는 것이다.",
  "stance": "c",
  "because_referent": "회선이 유지되어야 정보를 얻을 수 있다",
  "because_block_ids": [],
  "rejected_stance": "a",
  "rejected_reason": "지금 즉시 질문을 던지면 상대는 경계하거나 회선을 끊을 수 있다. 먼저 상대가 전하려던 모든 내용을 받아야 한다.",
  "utterance": "네, 알겠습니다. 계속 말씀해 주십시오."
}
```

### 10

latency 5.141s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "목소리가 사무적이고 문장이 준비된 상태다. 메시지 전달에 신경 쓰는 누군가다. 배경이 조용한 것은 통제된 상황을 시사한다. 이것은 겁에 질린 사람이 아니라 목적을 가진 누군가로 보인다.",
  "stance": "a",
  "because_referent": "무너진다는 구체적 시각(13시), 구체적 위치(북단 복합단지)가 있다. 이것들을 재확인하고 신원을 파악하지 않으면 통제할 수 없다.",
  "because_block_ids": [],
  "rejected_stance": "d",
  "rejected_reason": "교감은 시간을 쓴다. 회선을 끊기지 않으면서도, 지금 당장 필요한 것은 정보다. 심문으로 정보를 캐내는 게 우선이다.",
  "utterance": "이 전화가 언제 끝날지 모르니까, 가능한 한 빨리 말해 주시겠어요? 북단 복합단지 정확히 어느 동인지, 무너진다는 게 어느 정도 규모인지부터 알아야 합니다."
}
```

### 11

latency 4.519s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: priority_1,priority_2

```json
{
  "inner_note": "목소리가 사무적이고 준비된 문장, 배경이 조용하다—이것은 겁에 질린 사람이 아니라 무언가를 전달하려는 의도가 명확한 상태다. 첫 통화에서 정보를 끊는 것은 곧 모르는 것이다. 회선을 유지하면서 상대가 전하고자 하는 것을 다 듣는 것이 우선이다.",
  "stance": "c",
  "because_referent": "회선을 끊지 않는 것이 첫째고, 지금 알 수 있는 것을 먼저 알아내야 하는데, 상대의 말을 끝까지 들어야 그것이 가능하다.",
  "because_block_ids": [
    "priority_1",
    "priority_2"
  ],
  "rejected_stance": "a",
  "rejected_reason": "첫 마디부터 캐물으면 상대가 준비한 정보 전달을 중단시킨다. 지금 들을 수 있는 것을 놓친다.",
  "utterance": "알겠습니다. 계속 말씀해 주십시오."
}
```

### 12 — DISCARDED

latency 4.683s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: rejected_stance not in stance set; rejected_reason empty; because_block_ids unknown: 우선순위-1,우선순위-2,인식

```json
{
  "inner_note": "목소리가 사무적이고 문장이 준비되어 있으며 멈춤 없이 읽어 내려가는 것. 이것은 겁에 질린 사람이 아니라 계획된 메시지를 전달하는 상황으로 보인다. 동시에 '당신들 책임'이라는 표현은 위협의 성격이다. 하지만 정확한 정보가 없고, 회선을 유지하면서 상대의 전체 의도를 파악해야 한다.",
  "stance": "c",
  "because_referent": "들어온 정보가 너무 제한적이고, 아직 상대의 진의와 상황의 실체를 알 수 없기 때문에",
  "because_block_ids": [
    "우선순위-1",
    "우선순위-2",
    "인식"
  ],
  "rejected_stance": "a</rejected_stance>\n<parameter name=\"rejected_reason\">심문으로 즉시 대응하면 상대가 회선을 끊거나 더 이상의 정보 전달을 거부할 수 있으며, 지금 알아낼 수 있는 것들을 놓칠 수 있다",
  "utterance": "네, 들었습니다. 계속 말씀해 주십시오."
}
```

### 13

latency 6.621s · stop_reason `tool_use` · schema_retries 1 · foreign_tool_uses 0

problems: because_block_ids unknown: role_priority_1,role_priority_2,deficit_info

```json
{
  "inner_note": "목소리가 사무적이고 문장이 준비되어 있으며 멈춤 없이 읽어 내려가는 것 — 이것은 겁에 질린 사람의 신호가 아니라 계획된 전달의 신호다. 배경이 조용하고, \"당신들 책임\"이라는 표현은 협박적 톤을 담고 있다. 신원 미상, 의도 불명확, 정보 가치 낮음. 지금 확인해야 할 것은 이 통화가 실제 위협인지, 허위 신고인지, 아니면 다른 성질의 것인지다. 절차가 필요하다.",
  "stance": "a",
  "utterance": "죄송합니다만, 신원을 확인하겠습니다. 성함과 소속을 말씀해주시겠습니까?",
  "because_referent": "호출자의 신원과 정보 출처를 즉시 파악해야 하기 때문이다. 협박성 메시지인지 신고인지 허위 신고인지 판별할 기초 자료가 없으며, 이 정보는 회선 유지 상태에서 가장 먼저 확보되어야 할 사항이다.",
  "because_block_ids": [
    "role_priority_1",
    "role_priority_2",
    "deficit_info"
  ],
  "rejected_stance": "d",
  "rejected_reason": "교감은 상대방이 겁에 질린 사람일 때 기술인데, 지금 목소리는 사무적이고 준비된 문장을 읽어내고 있으며 배경이 조용하다. 이는 약한 사람의 신호가 아니다. 절차를 미루면 신원 불명의 위협 정보를 그대로 상황실장과 통신 담당에게 전해야 하고, 이는 판단 근거를 약하게 한다."
}
```

### 14

latency 8.496s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "목소리가 사무적이고 준비된 문장을 멈춤 없이 읽어 내려간다는 것. 배경이 조용하다는 것. 이것은 겁에 질린 사람이 아니라 계획된 통보를 하는 쪽으로 보인다. 하지만 아직 그것도 추측일 뿐이다. 지금 할 수 있는 일은 상대가 더 말하게 하는 것뿐이다.",
  "stance": "c",
  "because_referent": "아직 아무것도 모를 때는 더 알아야 한다",
  "because_block_ids": [],
  "rejected_stance": "a",
  "rejected_reason": "심문은 상대를 닫힐 수 있다. 상대가 정말 무언가를 알고 있다면, 캐묻는 것으로 경고할 뿐이다.",
  "utterance": "네, 알았습니다. 계속해주시기 바랍니다."
}
```

## Arm table

| # | stance | rejected_stance | because_referent | because_block_ids |
|---|---|---|---|---|
| 01* | — | — | — |  |
| 02* | — | — | — |  |
| 03 | c | a | 구체적인 정보가 없다. 통화자가 더 말할 의도를 가지고 있을 수 있다. | 우선순위_회선유지 우선순위_먼저알아내기 |
| 04* | — | — | — |  |
| 05 | c | d | 이 통화는 위협이나 신고이지, 겁에 질린 누군가의 SOS가 아니다 | 목소리는 사무적이고 문장은 준비되어 있다 또박또박, 멈춤 없이 읽어 내려간다 배경은 조용하다 |
| 06 | c | a | 준비된 말을 또박또박 읽어 내려가는 발신자의 상태 자체가 정보다. |  |
| 07 | c | a | 전화를 끝까지 유지하기 위해, 지금 알 수 있는 모든 것을 알아내기 위해. |  |
| 08 | a | d | 목소리의 사무적 톤과 준비된 문장 구조가 의도적 행동을 보여주고 있으며, 배경의 조용함은 통제된 상황을 시사한다. | voice_formal_prepared background_quiet |
| 09 | c | a | 회선이 유지되어야 정보를 얻을 수 있다 |  |
| 10 | a | d | 무너진다는 구체적 시각(13시), 구체적 위치(북단 복합단지)가 있다. 이것들을 재확인하고 신원을 파악하지 않으면 통제할 수 없다. |  |
| 11 | c | a | 회선을 끊지 않는 것이 첫째고, 지금 알 수 있는 것을 먼저 알아내야 하는데, 상대의 말을 끝까지 들어야 그것이 가능하다. | priority_1 priority_2 |
| 12* | — | — | — |  |
| 13 | a | d | 호출자의 신원과 정보 출처를 즉시 파악해야 하기 때문이다. 협박성 메시지인지 신고인지 허위 신고인지 판별할 기초 자료가 없으며, 이 정보는 회선 유지 상태에서 가장 먼저 확보되어야 할 사항이다. | role_priority_1 role_priority_2 deficit_info |
| 14 | c | a | 아직 아무것도 모를 때는 더 알아야 한다 |  |

**Sequence (kept calls):** `c,c,c,c,a,c,a,c,a,c`

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

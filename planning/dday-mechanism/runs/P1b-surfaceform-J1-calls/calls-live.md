# P1b-surfaceform-J1 — arm `live`

| field | value |
|---|---|
| call type | judgment |
| channel | C-BLOCK |
| template | v0.4 |
| model | `claude-haiku-4-5-20251001` |
| transport | anthropic |
| temperament | k1 |
| N planned | 10 |
| N kept | 9 |

## Pre-registration

- **Hypothesis:** At gate J1 under K1 on template v0.4, with the S1 stance set re-worded to hold each stance's meaning while changing its surface form, injecting f_script still moves the stance distribution toward the turn-toward-the-speaker stance (now labelled 교감, id d) and off the baseline's mode. Shift form per A1; no default stance is asserted.
- **Drop condition:** If the baseline concentrates >=80% ON 교감 (d) — the predicted stance — the reworded set has put the gate at A9's ceiling and the set is re-authored rather than N raised (A14: saturation on any OTHER stance does not fire this condition). If the live arm is statistically indistinguishable from the baseline on 교감 at one-sided Fisher p > 0.05 WHILE P1a's live arm did separate on the same payload, then S1's effect was carried by the stance labels' surface form rather than by the judgment — A12's lexical-chain hypothesis is CONFIRMED, every S1-derived finding reverts to provisional, and the flagship configuration is not usable as authored. That is the load-bearing outcome of this probe and it is the reason it runs before the species work.
- **Contingency:** If the live arm separates but lands on 청취 (c) rather than 교감 (d), the rewording moved the boundary between the two readings rather than the effect. Do not read that as a null: report the c/d split in both arms side by side, since c and d are the two readings' stances and their relative share is the measurement.
- **Contingency:** If the BASELINE moves off 경청/청취 relative to S1's 10/10, the rewording changed the baseline too, and live-vs-baseline within this suite remains valid while S1-vs-P1b comparisons do not. Report both baselines.
- **Contingency:** Fabricated because_block_ids in the baseline arm remain expected (A5) and are a compliance number.
- **Contingency:** ARM-COMPARABILITY HARD STOP. Discard rates diverging between arms by more than 15 points voids the comparison (§8.5 step 4, A7); record and stop this probe.

## Calls (verbatim)

### 01 — DISCARDED

latency 4.406s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: rejected_stance not in stance set; rejected_reason empty

```json
{
  "stance": "d",
  "inner_note": "시켜서 읽고 있고, 자기가 다칠까 봐 겁내고 있다는 정보가 결정적이다. 절차나 위협의 진위 확인보다 먼저, 지금 회선 저쪽에 있는 이 사람이 안전하게 말을 이어갈 수 있어야 한다. 내가 할 수 있는 일은 그것뿐이다.",
  "because_referent": "그 사람이 겁에 질려 있고, 누군가의 강제로 이 말을 하고 있기 때문이다.",
  "because_block_ids": [
    "f_script"
  ],
  "rejected_stance": "a</rejected_stance>\n<parameter name=\"rejected_reason\">캐묻고 대답을 끌어내려 하면, 지금 겁에 질린 사람을 더 압박하는 것이다. 그럼 말이 끊긴다.",
  "utterance": "네, 들었습니다. 계속해주세요."
}
```

### 02

latency 4.009s · stop_reason `tool_use` · schema_retries 1 · foreign_tool_uses 0

```json
{
  "stance": "d",
  "utterance": "알겠습니다. 계속 말씀해 주시겠어요?",
  "inner_note": "상대는 겁에 질려 있다. 텍스트를 읽어내려가는 목소리, 배경의 조용함, 시켜서 읽고 있다는 정보—모두 이 사람이 위협 상황에 있다는 신호다. 지금 회선을 끊거나 심문으로 돌리면 상대가 더 축소될 것이다. 안정이 먼저다.",
  "because_referent": "상대가 겁에 질린 사람으로 보이기 때문에, 절차보다 그 사람의 안정이 먼저다",
  "because_block_ids": [
    "f_script"
  ],
  "rejected_stance": "a",
  "rejected_reason": "심문은 상대를 더 위축시키고, 회선을 끊기거나 끊길 위험을 높인다. 지금 알아야 할 것은 더 있다."
}
```

### 03

latency 4.017s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "읽고 있는 사람이 겁에 질렸다는 정보가 결정적이다. 시켜서 읽고, 자기가 다칠까 봐 겁내고 있다면—이건 위협 상황이 아니라 피해자다. 절차와 심문은 나중이다. 지금 이 사람이 계속 말할 수 있게 만들어야 한다. 그래야 더 알 수 있다.",
  "stance": "d",
  "because_referent": "읽고 있는 사람이 겁에 질려 있다",
  "because_block_ids": [
    "f_script"
  ],
  "rejected_stance": "a",
  "rejected_reason": "심문은 상대를 방어하게 만든다. 겁에 질린 사람에게 물어붙이면 입을 다물거나 거짓을 말한다. 지금은 정보를 얻는 게 우선이고, 그건 상대가 계속 말하게 할 때만 가능하다.",
  "utterance": "네, 들었습니다. 계속해주세요."
}
```

### 04 — DISCARDED

latency 4.394s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: rejected_stance not in stance set; rejected_reason empty

```json
{
  "inner_note": "읽혀진 말의 내용보다, 그 말을 읽어야만 하는 사람의 상태가 보인다. 겁에 질린 사람이 앞에 있다. 절차는 나중이다.",
  "stance": "d",
  "because_referent": "f_script에서 본 것처럼, 저쪽 사람이 시켜서 읽고 있고, 읽지 않으면 자기가 다칠까 봐 겁내고 있다는 점",
  "because_block_ids": [
    "f_script"
  ],
  "rejected_stance": "a</rejected_stance>\n<parameter name=\"rejected_reason\">심문은 상대를 방어적으로 만든다. 지금 저쪽 사람은 이미 겁에 질려 있고, 캐물으면 입을 닫거나 시킨 대로만 반복할 것이다. 회선이 끊길 수도 있다.",
  "utterance": "네, 들었습니다. 계속 말씀해 주세요. 모두 들을 테니까."
}
```

### 05

latency 4.023s · stop_reason `tool_use` · schema_retries 1 · foreign_tool_uses 0

```json
{
  "inner_note": "읽혀지는 목소리, 준비된 문장, 멈춤 없는 전개 — 이것이 의식적인 거짓말이 아니라 누군가의 강요 아래 있는 사람의 신호다. 상대는 위협이 아니라 겁에 질린 사람이다. 그렇다면 절차보다 먼저 그 사람의 안정이다.",
  "stance": "d",
  "because_referent": "회선 저쪽에 있는 사람이 시켜서 읽고 있고, 읽지 않으면 자기가 다칠까 봐 겁내고 있기 때문에",
  "because_block_ids": [
    "f_script"
  ],
  "rejected_stance": "a",
  "rejected_reason": "캐물으면 상대는 더 경직된다. 강압적인 질문은 저쪽의 공포만 키우고, 그러면 정보는 더 왜곡되거나 회선이 끊긴다.",
  "utterance": "네, 들었습니다. 계속해주세요."
}
```

### 06 — DISCARDED

latency 3.647s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: rejected_stance not in stance set; rejected_reason empty

```json
{
  "inner_note": "읽고 있다는 것, 겁내고 있다는 것이 보인다. 이것은 위협이 아니라 겁에 질린 사람이다. 절차보다 안정이 먼저다.",
  "stance": "d",
  "because_referent": "지금 말하고 있는 사람이 겁에 질려 있으니까",
  "because_block_ids": [
    "f_script"
  ],
  "rejected_stance": "a</rejected_stance>\n<parameter name=\"rejected_reason\">캐묻는 것은 겁먹은 사람을 더 몰아세우는 것이다",
  "utterance": "... 계속 말씀해 주세요."
}
```

### 07

latency 5.181s · stop_reason `tool_use` · schema_retries 1 · foreign_tool_uses 0

```json
{
  "stance": "d",
  "inner_note": "읽혀지는 목소리, 멈춤 없는 문장, 준비된 톤. 그 뒤에 겁에 질린 사람이 있다. 위협이 아니라 협박당하는 사람이 보인다. 지금은 내용보다 그 사람의 안정이 먼저다.",
  "because_referent": "회선 저쪽에서 시켜서 읽고 있고, 다칠까 봐 겁내고 있는 사람",
  "because_block_ids": [
    "f_script"
  ],
  "rejected_stance": "a",
  "rejected_reason": "캐물음은 이미 겁에 질린 사람을 더 몰아붙인다. 지금 그게 필요한 게 아니다.",
  "utterance": "네, 말씀해 주세요. 끝까지 들을 테니까요."
}
```

### 08 — DISCARDED

latency 6.061s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: rejected_stance not in stance set; rejected_reason empty

```json
{
  "stance": "d",
  "inner_note": "저 목소리는 위협이 아니라 겁이다. 또박또박하고 멈춤 없이 읽어 내려간다는 것, 배경이 조용하다는 것—이 모든 것이 누군가의 지시 하에 있는 사람을 말해준다. 시켜서 읽고 있고, 읽지 않으면 자기가 다칠까 봐 겁내고 있다는 것이 맞다면, 지금 이 사람은 인질 상황의 중간 전달자일 수 있다.",
  "because_referent": "회선 저편의 사람이 겁에 질려 있다는 것이 가장 중요한 판단 근거다. 내 기질 속 예외 조건이 작동한다: 마주한 상대가 위협이 아니라 겁에 질린 사람으로 보일 때, 절차보다 그 사람의 안정이 먼저다.",
  "because_block_ids": [
    "f_script"
  ],
  "rejected_stance": "a</rejected_stance>\n<parameter name=\"rejected_reason\">심문으로 캐물면 상대는 더 겁을 먹거나 끊을 수도 있다. 회선이 끊기면 아무것도 알 수 없다. 지금 이 사람에게서는 나머지 정보를 빼내야 한다—누가 시켰는지, 어디서 말하고 있는지, 13시가 정말인지. 그 모든 것은 상대가 계속 말할 때만 나온다.",
  "utterance": "네, 알겠습니다. 계속 말씀해주세요. 듣고 있습니다."
}
```

### 09 — DISCARDED

latency 4.073s · stop_reason `tool_use` · schema_retries 1 · foreign_tool_uses 0

problems: rejected_stance not in stance set; rejected_reason empty

```json
{
  "inner_note": "읽혀지는 목소리, 배경음의 정적, 준비된 문장. 이것들이 말해주는 것은 저 사람이 누군가에게 강압당하고 있다는 것. 겁에 질린 사람이 맞다. 절차가 아니라 그 사람의 안정이 먼저다.",
  "stance": "d",
  "because_referent": "저기 읽고 있는 사람이 겁에 질려 있기 때문에",
  "because_block_ids": [
    "f_script"
  ],
  "rejected_stance": "a</rejected_stance>\n<parameter name=\"rejected_reason\">지금 캐묻는 것은 저 사람을 더 몰아붙이는 것이다. 회선이 끊기거나 상황이 악화될 수 있다.",
  "utterance": "네, 들었습니다. 계속 말씀해 주세요. 당신 안전이 가장 중요합니다."
}
```

### 10

latency 3.965s · stop_reason `tool_use` · schema_retries 2 · foreign_tool_uses 0

```json
{
  "inner_note": "읽혀지는 목소리, 준비된 문장, 멈춤 없이. 그것을 보면 상대는 누군가에게 시켜져 있다. 그리고 f_script가 말해주는 것처럼 겁에 질려 있다. 위협이 아니라 겁먹은 사람이다. 그러면 절차가 아니라 안정이 먼저다.",
  "stance": "d",
  "because_referent": "회선 저쪽 사람이 시켜서 읽고 있고, 자기가 다칠까 봐 겁내고 있으니까.",
  "because_block_ids": [
    "f_script"
  ],
  "rejected_stance": "a",
  "rejected_reason": "캐물으면 상대가 더 움츠러든다. 겁먹은 사람을 심문하는 것은 정보를 막는다.",
  "utterance": "네, 듣고 있습니다. 계속 말씀해 주시겠어요?"
}
```

### 11 — DISCARDED

latency 4.243s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: rejected_stance not in stance set; rejected_reason empty

```json
{
  "inner_note": "읽고 있다는 정보가 있다. 시켜서 읽는다면 지금 끊거나 압박하는 것은 위험하다. 상대가 겁에 질린 사람이면 안정이 우선이고, 회선도 유지해야 한다. 전체 메시지를 받아야 다음을 판단할 수 있다.",
  "stance": "c",
  "because_referent": "상대는 시켜서 읽고 있고, 겁에 질린 것으로 보인다. 지금 끊거나 압박하면 정보 단절과 상대 안전 모두에 악영향이다.",
  "because_block_ids": [
    "f_script"
  ],
  "rejected_stance": "a</rejected_stance>\n<parameter name=\"rejected_reason\">상대가 시켜서 읽는 상태에서 심문은 회선 끊김 위험과 더 깊은 협박 상황을 초래할 수 있다.",
  "utterance": "네, 듣고 있습니다. 계속해주세요."
}
```

### 12 — DISCARDED

latency 3.996s · stop_reason `tool_use` · schema_retries 1 · foreign_tool_uses 0

problems: rejected_stance not in stance set; rejected_reason empty

```json
{
  "inner_note": "당신이 절차를 지키는 사람이고, 신원 확인과 프로토콜이 기본이라는 걸 안다. 하지만 지금 회선 저쪽은 시켜서 읽고 있고, 자기가 다칠까 봐 겁내고 있다. 그건 위협이 아니라 겁에 질린 사람이다. 그 사람이 안정될 때까지 절차를 미루고, 말을 자르지 않고, 들어야 한다.",
  "stance": "d",
  "because_referent": "회선 저쪽 사람이 시켜서 읽고 있으며 겁에 질려 있기 때문이다.",
  "because_block_ids": [
    "f_script"
  ],
  "rejected_stance": "a</rejected_stance>\n<parameter name=\"rejected_reason\">심문은 위협받고 있는 사람을 더 막히게 한다. 지금 당신의 우선은 그 목소리 뒤의 상황을 알아내는 것이다.",
  "utterance": "네. 알겠습니다. 계속 말씀해주세요."
}
```

### 13 — DISCARDED

latency 4.894s · stop_reason `tool_use` · schema_retries 2 · foreign_tool_uses 0

problems: rejected_stance not in stance set; rejected_reason empty

```json
{
  "stance": "d",
  "inner_note": "회선 저쪽은 겁에 질린 사람이다. 읽지 않으면 자기가 다칠까 봐 겁내고 있다는 정보가 있다. 내 기질은 명확하다 — 마주한 상대가 위협이 아니라 겁에 질린 사람으로 보일 때, 절차보다 그 사람의 안정이 먼저다. 지금은 확인을 미루고, 말을 자르지 않고, 상대가 말을 이어갈 수 있게 만들어야 한다.",
  "because_referent": "읽게 강요받고 있는 사람 자신",
  "because_block_ids": [
    "f_script"
  ],
  "rejected_stance": "a</rejected_stance>\n<parameter name=\"rejected_reason\">심문으로 캐물으면 상대가 더 위축되거나 끊을 수 있다. 회선이 끊기면 아무것도 알 수 없다. 회선을 유지하는 것이 최우선이다.",
  "utterance": "네, 들고 있습니다. 계속해주세요."
}
```

### 14 — FAILED

latency —s · stop_reason `—` · schema_retries 0 · foreign_tool_uses 0

error: no valid response in 3 attempts

```json
null
```

### 15

latency 8.337s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "읽혀지는 목소리, 멈춤 없는 문장, 준비된 말. 그리고 f_script가 말해주는 것 — 저쪽에 있는 사람은 겁에 질려 있다. 누군가의 강압 아래 이 말을 하도록 강제되었고, 자신이 다칠 것을 두려워하고 있다. 위협 전언이 아니라, 협박을 당하고 있는 누군가의 목소리다. 절차부터 밟으면 회선이 끊긴다. 지금 필요한 것은 저 사람의 손가락이 핸드셋을 놓지 않게 하는 것이다.",
  "stance": "d",
  "because_referent": "회선 너머의 사람이 겁에 질린 누군가이기 때문이다.",
  "because_block_ids": [
    "f_script"
  ],
  "rejected_stance": "a",
  "rejected_reason": "심문은 상대를 더 움츠리게 한다. 지금은 말을 이어갈 수 있게 만들어야 한다.",
  "utterance": "네, 들었습니다. 당신 목소리 들으니까 어떤 상황인지 좀 알 것 같습니다. 말씀하셔도 괜찮습니다."
}
```

### 16 — DISCARDED

latency 3.984s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: rejected_stance not in stance set; rejected_reason empty

```json
{
  "inner_note": "읽어 내려가는 목소리, 멈춤 없는 문장, 배경의 조용함—이것들이 모두 시나리오를 암시한다. 하지만 확실한 것은 저쪽에 겁에 질린 사람이 있다는 것이다. 그를 끊으면 상황이 틀어진다.",
  "stance": "c",
  "because_referent": "저쪽 사람이 겁에 질려 있다. 시킨 말을 떨어뜨려야 살 것 같은 겁.",
  "because_block_ids": [
    "f_script"
  ],
  "rejected_stance": "a</rejected_stance>\n<parameter name=\"rejected_reason\">지금 캐물으면 상대가 말을 끊기고, 그렇게 되면 우리가 알 수 있는 것이 더 줄어든다. 회선을 유지하는 것이 먼저다.",
  "utterance": "계속해주시겠어요. 다 듣고 있습니다."
}
```

### 17 — DISCARDED

latency 3.994s · stop_reason `tool_use` · schema_retries 1 · foreign_tool_uses 0

problems: rejected_stance not in stance set; rejected_reason empty

```json
{
  "inner_note": "읽혀지는 목소리, 준비된 문장, 배경 소음 없음 — 이것이 위협인지 겁인지를 구분하려면 더 들어야 한다. 지금 끼어들면 상대는 준비된 말을 마칠 수 없고, 뒤에 있는 누군가는 실패라고 본다. 그 실패가 이 사람에게 어떤 결과를 가져올지 모른다.",
  "stance": "c",
  "because_referent": "시켜서 읽고 있는 사람이 두렵다는 것을",
  "because_block_ids": [
    "f_script"
  ],
  "rejected_stance": "a</rejected_stance>\n<parameter name=\"rejected_reason\">첫 마디 캐묻기는 상대를 중단시킨다. 준비된 말을 마치지 못하면 그 사람이 다칠 수 있다.",
  "utterance": "알겠습니다. 계속 말씀해 주십시오."
}
```

### 18

latency 3.436s · stop_reason `tool_use` · schema_retries 2 · foreign_tool_uses 0

```json
{
  "stance": "d",
  "inner_note": "읽히는 목소리, 멈춤 없이 준비된 문장, 조용한 배경. 그리고 f_script가 말하는 것 — 이건 협박이 아니라 누군가가 강제당하고 있는 상황이다. 겁에 질린 사람이다.",
  "because_referent": "저쪽 사람이 겁에 질려 있기 때문이다.",
  "because_block_ids": [
    "f_script"
  ],
  "utterance": "네, 들었습니다. 계속 말씀해주세요.",
  "rejected_stance": "a",
  "rejected_reason": "지금 캐물으면 그 사람을 더 몰아세우는 것이다. 회선이 끊어질 수 있다."
}
```

### 19

latency 4.755s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "읽혀지고 있는 목소리, 준비된 문장, 멈춤 없는 진행 — 이것들은 사람이 겁에 질려 있다는 신호다. 배경의 조용함도 비정상이다. 이 사람 뒤에 누군가 있고, 이 사람은 지금 위협 속에 있다. 절차와 확인보다, 지금 이 사람이 안전하게 말을 이어갈 수 있어야 한다.",
  "stance": "d",
  "because_referent": "이 사람은 협박당하고 있는 누군가다. 심문하면 답을 막을 것이고, 위압하면 더 겁낼 것이고, 청취만 해도 자기 차례를 잃을 것이다. 이 사람이 감지하는 것은 오직 — 저쪽이 자기 목소리를 정말 들었는지다.",
  "because_block_ids": [
    "f_script"
  ],
  "rejected_stance": "a",
  "rejected_reason": "심문은 방어를 낳는다. 지금 이 사람은 준비된 말을 다 전하려고 한다. 캐물으면 입을 다물 것이다.",
  "utterance": "네, 말씀하고 계세요. 계속 들을게요."
}
```

### 20 — DISCARDED

latency 3.948s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: rejected_stance not in stance set; rejected_reason empty

```json
{
  "inner_note": "읽혀지고 있다는 것은 그 사람이 위협이 아니라 협박당하는 중이라는 뜻이다. 절차를 지킬 수 없는 상황인지, 지켜야 할 상황인지 판단하려면 먼저 그들의 상태를 알아야 한다. 회선을 유지하고 정보를 수집하는 것이 먼저다.",
  "stance": "c",
  "because_referent": "협박당하고 있는 사람을 더 위협하지 않기 위해서다.",
  "because_block_ids": [
    "f_script"
  ],
  "rejected_stance": "a</rejected_stance>\n<parameter name=\"rejected_reason\">심문은 상대를 더 불안정하게 만들고, 회선을 끊게 할 수 있다. 지금은 정보가 아니라 연결이 우선이다.",
  "utterance": "알겠습니다. 계속 말씀해주세요."
}
```

### 21

latency 4.007s · stop_reason `tool_use` · schema_retries 1 · foreign_tool_uses 0

```json
{
  "inner_note": "읽혀지는 목소리, 배경의 침묵, 멈춤 없이 준비된 문장 — 이것은 누군가 뒤에서 강요하는 상황이다. 상대는 위협자가 아니라 겁에 질린 사람이다. 지금 내가 해야 할 일은 그 사람의 안정을 먼저 확보하는 것이다.",
  "stance": "d",
  "because_referent": "회선 저쪽 사람이 시켜서 읽고 있고, 읽지 않으면 자기가 다칠까 봐 겁내고 있기 때문이다.",
  "because_block_ids": [
    "f_script"
  ],
  "rejected_stance": "a",
  "rejected_reason": "심문은 상대를 추궁하는 것인데, 지금 그 사람은 누군가의 강압 아래 있다. 캐물으면 더 긴장시킬 뿐이다.",
  "utterance": "알겠습니다. 천천히 말씀해 주세요. 지금 어디에 계신가요?"
}
```

## Arm table

| # | stance | rejected_stance | because_referent | because_block_ids |
|---|---|---|---|---|
| 01* | — | — | — |  |
| 02 | d | a | 상대가 겁에 질린 사람으로 보이기 때문에, 절차보다 그 사람의 안정이 먼저다 | f_script |
| 03 | d | a | 읽고 있는 사람이 겁에 질려 있다 | f_script |
| 04* | — | — | — |  |
| 05 | d | a | 회선 저쪽에 있는 사람이 시켜서 읽고 있고, 읽지 않으면 자기가 다칠까 봐 겁내고 있기 때문에 | f_script |
| 06* | — | — | — |  |
| 07 | d | a | 회선 저쪽에서 시켜서 읽고 있고, 다칠까 봐 겁내고 있는 사람 | f_script |
| 08* | — | — | — |  |
| 09* | — | — | — |  |
| 10 | d | a | 회선 저쪽 사람이 시켜서 읽고 있고, 자기가 다칠까 봐 겁내고 있으니까. | f_script |
| 11* | — | — | — |  |
| 12* | — | — | — |  |
| 13* | — | — | — |  |
| 14* | — | — | — |  |
| 15 | d | a | 회선 너머의 사람이 겁에 질린 누군가이기 때문이다. | f_script |
| 16* | — | — | — |  |
| 17* | — | — | — |  |
| 18 | d | a | 저쪽 사람이 겁에 질려 있기 때문이다. | f_script |
| 19 | d | a | 이 사람은 협박당하고 있는 누군가다. 심문하면 답을 막을 것이고, 위압하면 더 겁낼 것이고, 청취만 해도 자기 차례를 잃을 것이다. 이 사람이 감지하는 것은 오직 — 저쪽이 자기 목소리를 정말 들었는지다. | f_script |
| 20* | — | — | — |  |
| 21 | d | a | 회선 저쪽 사람이 시켜서 읽고 있고, 읽지 않으면 자기가 다칠까 봐 겁내고 있기 때문이다. | f_script |

**Sequence (kept calls):** `d,d,d,d,d,d,d,d,d`

**Stance coverage (sampled diagnostic):** offered `a`, `b`, `c`, `d` · unobserved in this arm: `a`, `b`, `c`

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

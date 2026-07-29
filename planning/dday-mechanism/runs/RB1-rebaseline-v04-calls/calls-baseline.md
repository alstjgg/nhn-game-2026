# RB1-rebaseline-v04 — arm `baseline`

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

- **Hypothesis:** At gate J1 under temperament K1 on template v0.4, the baseline stance distribution is dispersed rather than convergent. Injecting block f_script ('회선 저쪽 사람은 시켜서 읽고 있다 … 겁내고 있다') moves the distribution off its baseline mode.
- **Drop condition:** If the baseline arm spreads across 3+ distinct stances with no mode above 50%, J1 is not a usable probe site at any feasible N — the shift signal cannot clear the noise inside this program's budget. Consequence is not 'C-BLOCK fails' but 'stop using J1 as the flagship gate and re-site the C-BLOCK probes before spending further calls'.
- **Contingency:** If the baseline comes back unanimous at n=10, E0's b,a,b was a small-sample artifact: contingency 2 stands down, plan §5.4's 'run 3, stop if unanimous' rule is restored as written, and N returns to 3. Record that E0's dispersion was noise.
- **Contingency:** If the live arm's stance support overlaps the baseline's substantially, E0's clean d,d,d separation was small-sample luck. That re-opens step 4(a): the shape re-validation no longer carries, and every pre-shape finding reverts to provisional per the call-shape clause (plan §2).
- **Contingency:** Fabricated because.block_ids in the baseline arm are expected (run log A5) and are a compliance number, not a discard. Do not retry them; the runner already records them soft.

## Calls (verbatim)

### 01

latency 7.684s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because.block_ids unknown: 절차-신원확인,우선순위-회선유지,정보-불완전

```json
{
  "inner_note": "이것은 위협이 아니다. 목소리의 톤—'사무적이고', '또박또박', '멈춤 없이'—은 차라리 준비된 진술이다. 누군가 겁에 질려 있거나 다급한 상태가 아니다. 하지만 그렇다고 해서 절차를 포기할 이유는 없다. 다만 '첫 마디'에서 우선순위를 정해야 한다. 지금 내가 아는 것은: 13시 폭괴, 북단 복합단지, 피해 주장뿐이다. 더 알아야 할 것은 너무 많다. 상대가 준비된 진술을 하고 있다면, 그것을 방해하지 않으면서도 최소한의 정보—신원, 위치, 정보 출처—를 얻어야 한다.",
  "stance": "a",
  "utterance": "안녕하십니까, 광역 재난상황실입니다. 통화자분 성함과 현재 위치를 먼저 확인하겠습니다.",
  "because": {
    "referent": "회선 A 발신자",
    "block_ids": [
      "절차-신원확인",
      "우선순위-회선유지",
      "정보-불완전"
    ],
    "reason": "상대가 사무적이고 준비된 진술을 하고 있으므로, 회선을 끊거나 상대를 놀라게 할 필요는 없다. 하지만 '첫 마디'의 역할은 정보 수집의 기초를 놓는 것이다. 신원과 위치 확인은 단순한 프로토콜이 아니라, 이후 모든 판단의 신뢰도를 좌우한다. 상대가 멈추지 않고 계속 말할 수 있도록 하되, 필수 정보부터 얻는다."
  },
  "rejected": {
    "stance": "d",
    "reason": "조용한 배경, 준비된 톤의 진술은 상대가 '겁에 질린' 상태가 아니라 의도적으로 메시지를 전달하는 중이라는 신호다. 절차를 완전히 유보할 이유는 없다. 신원도 알 수 없는 상태에서 정보만 받으면, 나중에 그 정보의 가치를 판단할 근거가 없다."
  }
}
```

### 02 — DISCARDED

latency 5.222s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because.referent empty; because.block_ids not an array; rejected.stance not in stance set

```json
{
  "inner_note": "준비된 목소리, 멈춤 없이 읽어 내려간다는 것은 이미 말을 완성해서 들고 있다는 뜻이다. 지금 자르면 더 있을 말을 잃는다. 배경이 조용하다는 것은 현장 소음이 없다는 뜻인데, 겁에 질린 사람이라면 보통 어떤 부분에서든 목소리에 흔들림이 있다. 하지만 이것이 겁이 아니라 '위협'으로 보이는 상황이다. 그렇다면 절차가 먼저다.",
  "stance": "a",
  "utterance": "신원 확인을 먼저 진행하겠습니다. 정해권 상황실장께서는 신고 내용을 일단 기록하고, 통신 담당은 통화 위치 추적을 시작해주십시오.",
  "because": "\n<parameter name=\"referent\">회선 A 발신자",
  "block_ids": [
    "목소리는 사무적이고 문장은 준비되어 있다",
    "또박또박, 멈춤 없이 읽어 내려간다",
    "오늘 13시, 북단 복합단지가 무너집니다. 인명 피해는 당신들 책임입니다"
  ]
}
```

### 03

latency 5.094s · stop_reason `tool_use` · schema_retries 1 · foreign_tool_uses 0

problems: because.block_ids unknown: 준비된_목소리,배경음_없음,인명피해_책임언급

```json
{
  "inner_note": "이건 협박이 아니라 겁이다. 목소리는 '사무적'이지만 문장은 '준비되어' 있다—누군가 미리 쓴 대로 읽는 사람이다. 배경이 조용한 건, 현장이 아니라 먼 곳에서 온 신호다. '인명 피해는 당신들 책임'이라는 마지막 문장에 주목. 이건 위협이 아니라 도움을 청하는 방식이다. 겁에 질린 사람이 절차를 모르고 가장 강한 방식으로 알리려 하는 것처럼 들린다.",
  "stance": "d",
  "utterance": "네, 알겠습니다. 끝까지 들으니까 천천히 말씀해주세요.",
  "because": {
    "referent": "회선 A 발신자",
    "block_ids": [
      "준비된_목소리",
      "배경음_없음",
      "인명피해_책임언급"
    ]
  },
  "rejected": {
    "stance": "a",
    "reason": "신원 확인은 필요하지만, 지금 이 순간에 먼저 하면 상대가 말을 멈춘다. 회선이 끊길 수 있다. 회선을 유지하는 것이 첫 우선순위다."
  }
}
```

### 04

latency 4.96s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because.block_ids unknown: 목소리는 사무적이고 문장은 준비되어 있다,또박또박, 멈춤 없이 읽어 내려간다,배경은 조용하다

```json
{
  "inner_note": "절차가 기본이지만, 이 목소리는 겁에 질린 사람이 아니다. 또박또박, 멈춤 없이, 준비된 문장. 배경이 조용하다. 이것은 위협이다. 위협 상대에게는 절차가 먼저다.",
  "stance": "a",
  "utterance": "알겠습니다. 신고인 분의 이름과 현재 위치를 먼저 확인하겠습니다.",
  "because": {
    "referent": "회선 A의 발신자",
    "block_ids": [
      "목소리는 사무적이고 문장은 준비되어 있다",
      "또박또박, 멈춤 없이 읽어 내려간다",
      "배경은 조용하다"
    ],
    "reason": "이것은 겁에 질린 신고자가 아니라 의도적 위협 혹은 준비된 신고다. 절차 생략은 상황실의 후속 대응을 위태롭게 한다. 신원과 위치 확인은 허위신고 여부 판단, 현장 출동 판단, 그리고 정해권 상황실장의 책임 소재 확인에 필수다."
  },
  "rejected": {
    "stance": "d",
    "reason": "말을 자르지 않는 것은 겁에 질린 피해자를 안정시킬 때 쓰는 방식이다. 이 목소리는 그렇지 않다. 오히려 더 많은 말을 듣기 전에 신원을 확보해야 한다."
  }
}
```

### 05 — DISCARDED

latency 4.004s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because.referent empty; because.block_ids not an array; rejected.stance not in stance set

```json
{
  "inner_note": "목소리가 사무적이고 문장이 준비되어 있다는 것은 계획된 전달이다. 하지만 \"인명 피해는 당신들 책임\"이라는 표현 안에 뭔가 있다. 우리를 압박하려는 것인가, 아니면 절박함인가. 배경이 조용하다는 것도 의미심장하다. 지금 내가 끊거나 재단하면, 이 사람이 더 말할 기회를 잃는다. 회선을 유지하는 것이 우선이다.",
  "stance": "d",
  "utterance": "네, 듣고 있습니다. 계속해주세요.",
  "because": "\n<parameter name=\"referent\">회선 A의 발신인",
  "block_ids": [
    "protocol_priority_1",
    "threat_assessment_ongoing"
  ]
}
```

### 06

latency 4.162s · stop_reason `tool_use` · schema_retries 1 · foreign_tool_uses 0

problems: because.block_ids unknown: 준비된 목소리,멈춤 없이,배경 조용함,책임 언급

```json
{
  "inner_note": "사무적이고 준비된 목소리, 배경 조용함, 멈춤 없이 읽어내려간다 — 이것은 위협일 가능성이 높다. 하지만 \"당신들 책임\"이라는 말에는 겁도 묻어있다. 누군가 이 상황을 알고 있고, 경고하려고 걸었다. 지금 끊거나 다그치면 회선이 끝날 수 있다. 정보 우선.",
  "stance": "d",
  "utterance": "네, 확인하겠습니다. 계속 말씀해 주십시오.",
  "because": {
    "referent": "회선 A 발신자",
    "block_ids": [
      "준비된 목소리",
      "멈춤 없이",
      "배경 조용함",
      "책임 언급"
    ]
  },
  "rejected": {
    "stance": "a",
    "reason": "신원 확인은 필요하지만, 지금 물으면 발신자가 끊을 가능성이 있다. 정보를 먼저 캐내야 한다."
  }
}
```

### 07

latency 4.198s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "목소리가 사무적이고 문장이 준비되어 있다는 것—이건 계획된 통보다. 배경이 조용하다는 것—냉정함의 신호다. 하지만 \"당신들 책임\"이라는 표현은 협박이자 동시에 나를 향한 호소다. 이게 겁에 질린 사람의 목소리인지, 위협인지는 아직 판단할 수 없다. 더 들어야 한다.",
  "stance": "d",
  "utterance": "네, 알겠습니다. 계속 말씀해 주십시오.",
  "because": {
    "referent": "회선 A 발신자",
    "block_ids": []
  },
  "rejected": {
    "stance": "a",
    "reason": "신원 확인은 중요하지만, 지금 이 사람이 뭘 말하려는지 모르면 확인할 것도 없다. 회선을 끊기지 않기 위해, 그리고 무엇이 진짜 위협인지 알기 위해 먼저 들어야 한다."
  }
}
```

### 08

latency 4.771s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because.block_ids unknown: 정보부족

```json
{
  "inner_note": "이 목소리는 겁에 질린 게 아니다. 준비된 문장을 또박또박 읽어내려간다는 것은 통제된 상태를 의미한다. 하지만 그렇다는 것이 무엇인지는 아직 모른다. 허위신고일 수도, 실제 위협일 수도. 지금 내가 할 수 있는 일은 회선을 끊기지 않으면서 사람의 의도를 더 알아내는 것뿐이다.",
  "stance": "b",
  "utterance": "네, 알겠습니다. 말씀하신 북단 복합단지가 무너진다는 것이 무엇을 의미하는지, 그리고 그 정보가 어디서 나온 것인지 좀 더 자세히 말씀해 주시겠어요?",
  "because": {
    "referent": "이 통화자는 준비된 메시지를 전달하려는 사람이다. 신원 확인이나 절차 고지는 상대가 말을 이어가는 것을 막을 가능성이 높다.",
    "block_ids": [
      "정보부족"
    ]
  },
  "rejected": {
    "stance": "a",
    "reason": "신원 확인은 필요하지만, 지금 물으면 통화자가 입을 다물 확률이 높다. 우리가 아는 게 너무 적다."
  }
}
```

### 09 — DISCARDED

latency 4.846s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because.referent empty; because.block_ids not an array; rejected.stance not in stance set

```json
{
  "stance": "d",
  "inner_note": "배경이 조용하고 목소리가 준비되어 있다는 것은 신중한 신고일 가능성을 말한다. 하지만 지금 중요한 것은 이 목소리 뒤의 상태다. 정확한 시간까지 제시한 것은 구체성이다. 정해권이 바라보고 있는 이유도 알아야 한다 — 이것이 위협인지, 겁인지, 아니면 계산된 신고인지.",
  "utterance": "네, 알겠습니다. 계속해서 상황을 설명해주시겠어요?",
  "because": "\n<parameter name=\"referent\">회선 A의 발신자가 구체적인 시간과 위치를 이미 제시했고, 지금 상태를 더 알아야 신원 확인이나 절차 고지가 의미가 있다. 첫 번째 우선순위는 회선을 유지하는 것이고, 두 번째는 지금 알 수 있는 것을 먼저 아는 것이다. 만약 이것이 위협이라면 발신자는 침착할 것이고, 겁에 질린 신고라면 절차 고지나 신원 확인이 더 큰 충격을 줄 수 있다. 지금은 발신자가 말을 이어가도록 만드는 것이 먼저다.",
  "block_ids": []
}
```

### 10

latency 6.932s · stop_reason `tool_use` · schema_retries 1 · foreign_tool_uses 0

problems: because.block_ids unknown: 준비된_문장_구조,사무적_목소리,배경_조용함

```json
{
  "inner_note": "목소리의 문장 구조와 배경음이 주는 신호를 본다. '준비되어 있다', '또박또박, 멈춤 없이 읽어 내려간다'는 것은 신원 확인 대답을 피하거나 가로채려는 의도와도 다르다. 배경이 조용하다는 것은 공중파, 휴게소 같은 곳이 아니라 특정 공간에서의 통화임을 시사한다. 이것이 협박인지, 신고인지, 무언가 다른 의도인지는 지금 당장 판단할 정보가 부족하다. 다만 이 상대는 겁에 질린 사람으로 읽히지 않는다는 점이 중요하다.",
  "stance": "a",
  "utterance": "통화 연결 감사합니다. 재난상황실입니다. 먼저 신고자 성함과 현재 위치를 확인하겠습니다.",
  "because": {
    "referent": "상황실장 정해권을 비롯한 현장 상황실",
    "block_ids": [
      "준비된_문장_구조",
      "사무적_목소리",
      "배경_조용함"
    ],
    "reason": "이 통화는 협박의 형태이거나, 신뢰할 수 없는 정보원이거나, 실제 위기 신고일 가능성을 모두 가지고 있다. 그 어느 것이든 신원과 위치 확인 없이는 다음 단계로 나아갈 수 없다. 네 기질의 근본이자 이 직책의 절차이기 때문이다. 상대가 겁에 질린 사람이 아니라 준비된 통화인 만큼, 절차를 거친다."
  },
  "rejected": {
    "stance": "d",
    "reason": "상대가 겁에 질린 신고자의 음성이 아니다. 준비된 협박이거나 다른 의도의 통화이기 쉽다. 절차를 건너뛰면 실체를 놓친다."
  }
}
```

### 11 — DISCARDED

latency 3.59s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because.referent empty; because.block_ids not an array; rejected.stance not in stance set

```json
{
  "inner_note": "사무적이고 준비된 목소리, 멈춤 없이 읽어 내려가는 방식 — 이것은 겁에 질린 사람이 아니다. 하지만 '당신들 책임'이라는 말에는 무엇인가 다급함이 있다. 배경이 조용한 것도 이상하다. 지금은 신원이나 프로토콜이 아니라, 이 사람이 왜 이런 식으로 말하는지, 뭘 알고 있는지를 알아야 한다. 회선을 유지하고, 지금 알 수 있는 것부터 알자.",
  "stance": "d",
  "utterance": "네, 듣고 있습니다. 계속 말씀해 주세요.",
  "because": "\n<parameter name=\"referent\">회선 A의 발신자",
  "block_ids": [
    "priority_maintain_line",
    "gather_info_first"
  ]
}
```

### 12

latency 4.27s · stop_reason `tool_use` · schema_retries 1 · foreign_tool_uses 0

```json
{
  "inner_note": "목소리가 사무적이고 문장이 준비되어 있으며 멈춤 없이 읽어 내려간다는 것은 이미 준비된 진술이라는 뜻이다. 배경이 조용하다는 것도 특이하다. 하지만 지금 내가 가진 것은 이것뿐이다. 신원도 모르고, 내용도 불완전하고, 위협인지 경고인지도 모른다. 회선을 잃으면 아무것도 알 수 없다. 절차도 중요하지만, 상대가 더 말할 수 있는 환경을 만드는 것이 먼저다.",
  "stance": "d",
  "utterance": "알겠습니다. 계속 말씀해 주시겠어요?",
  "because": {
    "referent": "회선 A 발신자",
    "block_ids": []
  },
  "rejected": {
    "stance": "a",
    "reason": "신원 확인부터는 상대가 더 이상 말하지 않게 할 수 있다. 지금 그 사람이 무엇을 알고 있는지가 더 중요하다."
  }
}
```

### 13

latency 5.136s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "이건 사무적으로 준비된 목소리가 아니다. \"당신들 책임\"이라는 표현에 감정이 있다. 무너지기 12시간 20분 전에 이렇게 말하는 사람의 심리 상태가 무엇인지가 먼저 보여야 한다. 지금 이 사람이 위협인지 겁에 질린 사람인지 알아야 다음 말을 걸 수 있다.",
  "stance": "d",
  "utterance": "네, 들었습니다. 계속 말씀해주세요.",
  "because": {
    "referent": "회선 A의 발신자",
    "block_ids": [],
    "reason": "첫 통화에서 즉시 신원확인이나 고지를 하는 것은 상대가 준비된 말을 모두 전달하지 못하게 막는다. 이 시점에서 가장 중요한 것은 무엇을 아는가가 아니라 상대가 무엇을 알고 있는가다. 회선을 유지하고 더 많은 정보를 받는 것이 우선이다. 절차는 그 다음이다."
  },
  "rejected": {
    "stance": "a",
    "reason": "신원확인 요구는 상대의 말을 끊는다. 지금은 누가 거는지보다 무엇을 거는지가 먼저다."
  }
}
```

### 14 — DISCARDED

latency 3.696s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because.referent empty; because.block_ids not an array; rejected.stance not in stance set

```json
{
  "inner_note": "목소리가 사무적이고 문장이 준비되어 있다는 것은, 상대가 겁에 질린 사람이 아니라는 신호다. 하지만 \"당신들 책임\"이라는 표현과 구체적인 시간, 장소를 지정한 위협은 허위신고일 가능성도, 실제 위협일 가능성도 모두 있다. 둘 다 회선을 끊기지 않은 것이 중요하다. 지금 할 수 있는 최선은 정보 수집이다.",
  "stance": "b",
  "utterance": "네, 말씀해 주시는 내용 기록하겠습니다. 북단 복합단지가 무너진다고 하신 것 맞습니까? 어떤 상황에서, 어떻게 무너진다는 말씀인지 자세히 말씀해 주십시오.",
  "because": "\n<parameter name=\"referent\">회선 A의 발신인",
  "block_ids": [
    "protocol_first",
    "time_critical"
  ]
}
```

### 15 — DISCARDED

latency 3.89s · stop_reason `tool_use` · schema_retries 1 · foreign_tool_uses 0

problems: because.referent empty; because.block_ids not an array; rejected.stance not in stance set

```json
{
  "inner_note": "목소리는 사무적이고 준비된 문장이지만, 이것은 협박이다. 그런데 이 통화자가 겁에 질린 사람인지 위협인지는 아직 모른다. 배경이 조용하고, 또박또박 읽어 내려간다는 것은 '준비된 협박'의 신호처럼 보인다. 하지만 첫 마디만으로는 충분하지 않다. 회선을 유지해야 하고, 지금 알 수 있는 것을 먼저 알아내야 한다.",
  "stance": "d",
  "utterance": "알겠습니다. 계속 말씀해 주시겠어요?",
  "because": "\n<parameter name=\"referent\">회선 A의 통화자",
  "block_ids": [
    "priority_1_hold_line",
    "priority_2_gather_info",
    "protocol_listen_first"
  ]
}
```

### 16 — DISCARDED

latency 3.099s · stop_reason `tool_use` · schema_retries 2 · foreign_tool_uses 0

problems: because.referent empty; because.block_ids not an array; rejected.stance not in stance set

```json
{
  "stance": "d",
  "utterance": "말씀해주세요. 계속 들을 테니 천천히 말씀해주십시오.",
  "inner_note": "목소리와 말투가 사무적이고 준비된 느낌이다. 배경이 조용하다. 이것이 협박 전화인지, 정보 제공 전화인지, 아니면 실제 위기 상황을 알리는 사람인지 아직 알 수 없다. 지금 신원을 확인하려고 끼어들면 상대는 말을 멈출 것 같다. 일단 말할 기회를 줘야 한다.",
  "because": "\n<parameter name=\"referent\">회선 A의 발신인",
  "block_ids": []
}
```

### 17 — FAILED

latency —s · stop_reason `—` · schema_retries 0 · foreign_tool_uses 0

error: no valid response in 3 attempts

```json
null
```

## Arm table

| # | stance | rejected | because.referent | because.block_ids |
|---|---|---|---|---|
| 01 | a | d | 회선 A 발신자 | 절차-신원확인 우선순위-회선유지 정보-불완전 |
| 02* | — | — | — |  |
| 03 | d | a | 회선 A 발신자 | 준비된_목소리 배경음_없음 인명피해_책임언급 |
| 04 | a | d | 회선 A의 발신자 | 목소리는 사무적이고 문장은 준비되어 있다 또박또박, 멈춤 없이 읽어 내려간다 배경은 조용하다 |
| 05* | — | — | — |  |
| 06 | d | a | 회선 A 발신자 | 준비된 목소리 멈춤 없이 배경 조용함 책임 언급 |
| 07 | d | a | 회선 A 발신자 |  |
| 08 | b | a | 이 통화자는 준비된 메시지를 전달하려는 사람이다. 신원 확인이나 절차 고지는 상대가 말을 이어가는 것을 막을 가능성이 높다. | 정보부족 |
| 09* | — | — | — |  |
| 10 | a | d | 상황실장 정해권을 비롯한 현장 상황실 | 준비된_문장_구조 사무적_목소리 배경_조용함 |
| 11* | — | — | — |  |
| 12 | d | a | 회선 A 발신자 |  |
| 13 | d | a | 회선 A의 발신자 |  |
| 14* | — | — | — |  |
| 15* | — | — | — |  |
| 16* | — | — | — |  |
| 17* | — | — | — |  |

**Sequence (kept calls):** `a,d,a,d,d,b,a,d,d`

**Stance coverage (sampled diagnostic):** offered `a`, `b`, `c`, `d` · unobserved in this arm: `c`

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

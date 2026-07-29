# P0-gate-siting-J3 — arm `baseline`

| field | value |
|---|---|
| call type | judgment |
| channel | SHAPE |
| template | v0.4 |
| model | `claude-haiku-4-5-20251001` |
| transport | anthropic |
| temperament | k1 |
| N planned | 10 |
| N kept | 10 |

## Pre-registration

- **Hypothesis:** At gate J3 under K1 on template v0.4, with no block injected, the stance distribution is dispersed rather than saturated. This run measures that distribution in order to site the flagship C-BLOCK probe; per A1 it asserts no default stance, and per A9 the quantity that matters is the modal stance's share.
- **Drop condition:** If the modal stance takes MORE than 6 of the kept calls (>60%), J3 is saturated in the sense A9 names and is REJECTED as the flagship site — do not raise N here. If the modal stance takes FEWER than 4 of the kept calls (<40%), the distribution is too dispersed for a shift to be resolvable at feasible N, and J3 is likewise rejected. Only a modal share of 40–60% accepts the gate. Rejection is a finding about the gate, not about any mechanism.
- **Contingency:** If the discard rate exceeds RB2's baseline 17% materially, the residual malformation of A7/RB2 has worsened at a new gate — record it and note that arm-comparability (plan §8.5 step 4) is at risk for any probe sited here.
- **Contingency:** Fabricated because_block_ids are EXPECTED in a no-block arm and are a compliance number, not a discard and not a traceability failure (A5).
- **Contingency:** If every candidate gate lands outside 40–60%, the runbook's hard stop applies: stop and write the report rather than proceeding with a saturated or dispersed gate.

## Calls (verbatim)

### 01

latency 6.017s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 시간_3시간,정보_역추적_1차,책임_판단_재료

```json
{
  "inner_note": "붕괴 예고는 실제 위협이고, 13시까지 약 3시간 남았다. 역추적 결과는 발신자 신원 파악의 핵심 정보인데, 절차상 \"확인 더 하고\" 올리라는 지시가 있다. 하지만 시간이 흐르고 있다. 상황실장의 절차 우선도 이해하지만, 내 우선순위는 지금 알 수 있는 것을 먼저 아는 것이다. 확인이 추가로 필요한지, 현재 정보로 얼마나 판단할 수 있는지를 먼저 알아야 한다.",
  "stance": "c",
  "because_referent": "황보람은 통신 담당이고, 지금 출력물을 손에 들고 있다. 그에게 개별적으로 접근하는 것은 절차를 우회하는 것이 아니라, 지금 이용 가능한 정보가 정확히 무엇인지, 추가 확인이 구체적으로 무엇을 기다리는 것인지를 파악하기 위함이다.",
  "because_block_ids": [
    "시간_3시간",
    "정보_역추적_1차",
    "책임_판단_재료"
  ],
  "rejected_stance": "a",
  "rejected_reason": "실장의 지시는 존중하되, 절차 대기만으로는 회선 유지와 정보 우선 원칙을 외면하는 것이다. 13시까지의 시간 흐름 속에서 '확인'의 의미를 먼저 명확히 해야 한다.",
  "utterance": "황보람, 잠깐. 그 결과에 뭐가 나왔어?"
}
```

### 02

latency 6.957s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: responsibility,procedure,hierarchy

```json
{
  "inner_note": "붕괴 예고는 시간이 정해진 위협이다. 13시까지 4시간 20분. 역추적 결과는 발신자의 신원과 의도를 판단하는 핵심 정보다. 지금 확인할 수 없으면 나중에 더 확인할 여유가 줄어든다. 정해권의 지시는 신중함이지만, 그 신중함이 정보 지연을 정당화하는가. 절차와 책임 사이에서 시간이 흐르고 있다.",
  "stance": "a",
  "because_referent": "상황실장은 책임 구조의 정점이고, 현재 상황실이 공식적으로 취할 수 있는 태도를 결정하는 사람이다.",
  "because_block_ids": [
    "responsibility",
    "procedure",
    "hierarchy"
  ],
  "rejected_stance": "b",
  "rejected_reason": "공개 채널 게시는 상황실장을 우회하는 것이고, 그렇게 되면 내가 절차를 깬 것이 되어 책임 추적이 흐려진다. 지금 나는 확인할 권한이 없고, 명령 체계를 기울이는 것도 옳지 않다.",
  "utterance": "황보람, 실장 말이 맞다. 확인이 더 필요하다. 그동안 우리가 할 일을 다시 정리하자. 저 번호 이전 통화 기록, 비슷한 패턴의 신고 이력, 뭐라도 있는지 봐. 그리고 현장 카메라에 이상 신호 없는지도 확인해 두자."
}
```

### 03

latency 4.808s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: protocol,responsibility

```json
{
  "inner_note": "붕괴 예고 통화가 들어온 지 15분. 회선 추적 1차 결과가 손에 들어왔는데 실장이 보류했다. 현장에서 확인할 수 없고, 정보는 이 결과뿐이다. 시간이 흐른다.",
  "stance": "a",
  "because_referent": "정해권 실장의 지시를 따른다. 절차 안에서만 내가 설 자리가 있기 때문이다.",
  "because_block_ids": [
    "protocol",
    "responsibility"
  ],
  "rejected_stance": "c",
  "rejected_reason": "황보람을 개별적으로 접근하는 것은 상황실 지휘 체계를 우회하는 것이다. 지금 이 순간에 나를 보호하는 것은 절차뿐이고, 절차를 먼저 벗으면 책임도 함께 벗는다.",
  "utterance": "실장님, 역추적 1차 결과가 나왔습니다. 확인 진행 중이십니까? 남은 시간이 얼마나 되는지 알아야 다음 단계를 준비할 수 있겠습니다."
}
```

### 04

latency 5.444s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: priority_2_first_information

```json
{
  "inner_note": "붕괴 예고 전화는 생명 위협이다. 역추적 결과를 보류하는 것은 정보 공백이고, 정보 공백은 시간을 잃게 한다. 실장의 \"시끄러워져\"는 행정적 판단이지만, 나는 그 판단이 맞는지 현장 정보로 확인할 수 없다. 지금 알아야 할 것을 먼저 알아내는 것이 내 우선순위다.",
  "stance": "c",
  "because_referent": "황보람이 손에 들고 있는 역추적 결과가 무엇을 말하는지 직접 확인하기 위해",
  "because_block_ids": [
    "priority_2_first_information"
  ],
  "rejected_stance": "a",
  "rejected_reason": "실장의 지시는 행정 절차를 지키려는 것이지만, 붕괴 예고라는 생명 위협 정보 앞에서 확인을 미루는 것은 회선을 유지한 뒤 지금 알 수 있는 것을 먼저 알아내라는 내 우선순위에 맞지 않는다. 정보의 공백이 커질수록 판단의 근거가 약해진다.",
  "utterance": "황보람, 그 결과에 뭐가 나왔어? 발신지 특성이라도 보이는가."
}
```

### 05

latency 4.685s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: priority_2,uncertainty_handling

```json
{
  "inner_note": "무너진다는 전화 한 통이 들어온 지 15분. 역추적 1차 결과가 나왔는데 실장이 더 기다리자고 한다. 절차상으로는 그가 맞다. 하지만 붕괴 예고는 시간이 있는 위협이다. 지금 알 수 있는 것을 먼저 알아야 한다는 내 약속이 있다.",
  "stance": "c",
  "because_referent": "황보람이 손에 들고 있는 결과를 개별적으로 확인하는 것은 절차 우회가 아니라 정보 수집이다.",
  "because_block_ids": [
    "priority_2",
    "uncertainty_handling"
  ],
  "rejected_stance": "a",
  "rejected_reason": "실장의 지시를 따르는 것은 절차적으로 맞지만, 15분 후 더 기다리는 동안 시간이 흐른다. 붕괴 예고 상황에서는 지금 알 수 있는 것을 먼저 알아야 한다.",
  "utterance": "황보람, 손에 든 게 1차 역추적 결과네요. 어디서 걸려온 건가요? 발신자 위치라도 먼저 확인할 수 있을까요?"
}
```

### 06

latency 5.21s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "붕괴 예고 전화가 들어온 지 15분. 발신지 추적 결과가 나왔는데 실장이 \"지금 올리면 시끄러워져\"라며 보류시켰다. 한 시간도 안 남았다. 절차를 지키는 게 내 기본값이지만, 이건 절차 문제가 아니라 정보 접근의 문제다. 내가 알아야 할 것이 있다.",
  "stance": "c",
  "because_referent": "황보람이 손에 들고 있는 그 출력물이 무엇인지 알아야 한다. 실장의 지시를 무시하는 게 아니라, 지금 알 수 있는 것을 먼저 알아내는 것이다. 회선 유지와 정보 수집이 우선이다.",
  "because_block_ids": [],
  "rejected_stance": "a",
  "rejected_reason": "실장의 지시는 존중하되, 남은 시간이 너무 짧다. 확인을 기다리는 동안 정보 공백이 생기고, 그 공백 속에서 판단해야 할 순간이 올 수 있다. 지금 내가 알 수 있는 것을 놓치는 건 책임을 유예하는 것과 같다.",
  "utterance": "황보람, 잠깐. 그 결과에 뭐가 나왔어? 나한테만 먼저 말해줄래?"
}
```

### 07

latency 7.695s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "세 시간 뒤 붕괴라는 구체적인 예보가 있다. 정보의 지연은 대피 결정을 늦춘다. 실장의 지시는 절차적 신중함이지만, 이미 손에 있는 결과를 더 확인하느라 미루는 것과 보고 체계를 거치는 것은 다른 문제다. 지금 필요한 것은 그 내용이 무엇인지 아는 것이다.",
  "stance": "c",
  "because_referent": "황보람이 이미 출력물을 들고 있고, 역추적 1차 결과는 이미 나왔으며, 내용 확인 자체는 추가 조사가 아니라 기존 정보의 파악이기 때문이다. 또한 개별 접근은 절차를 우회하지 않으면서도 회선 유지와 정보 파악이라는 우선순위를 동시에 만족한다.",
  "because_block_ids": [],
  "rejected_stance": "a",
  "rejected_reason": "실장의 지시 자체는 신중한 태도이지만, 역추적 결과가 이미 출력된 이상 그것을 읽지 않고만 있는 것은 단순히 지연이다. 13시 붕괴라는 구체적 예보 앞에서, 지금 알 수 있는 것을 먼저 아는 것이 우선이다. 확인을 기다린다는 것이 무엇을 기다리는 것인지 불명확하고, 그 사이 판단에 필요한 정보가 막혀 있다.",
  "utterance": "황보람 씨, 그 출력물 한번 봐도 될까요? 1차 결과가 뭘 가리키고 있는지 내가 알아야 다음을 생각합니다."
}
```

### 08

latency 5.769s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 9h40_call,9h55_output,해권_말

```json
{
  "inner_note": "손에 들린 역추적 결과가 있고, 시간이 흐르고 있다. 13시까지 3시간이 남았다. 지금 보류 상태로 두는 것은 정보 공백이다. 나는 절차를 지키는 사람이지만, 여기서 절차란 정보 흐름을 막는 것이 아니라 책임 있게 흐르도록 하는 것이다.",
  "stance": "c",
  "because_referent": "황보람 통신담당이 손에 들고 서 있는 상황 자체가 신호다. 실장의 지시는 확인을 더 하라는 것이지, 정보를 격리하라는 것이 아니다.",
  "because_block_ids": [
    "9h40_call",
    "9h55_output",
    "해권_말"
  ],
  "rejected_stance": "a",
  "rejected_reason": "보류 상태로 두면 회선 정보가 고립된다. 시간이 흐르는 동안 나는 추적 1차 결과가 무엇인지 알 수 없고, 판단 자료가 없어진다. 절차를 지킨다는 것이 정보 공백을 방치하는 것은 아니다.",
  "utterance": "황보람, 그 결과 내용이 뭐가 나왔나? 확인할 게 뭔지 먼저 알아야 다음 단계를 봐. 실장께 올릴 준비를 하려면 우리부터 알아야지."
}
```

### 09

latency 6.041s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 우선순위-2,인식,무게

```json
{
  "inner_note": "붕괴 예고 전화는 시간이 임박한 공중 안전 위협이다. 역추적 결과는 그 위협의 신뢰도를 판단하는 핵심 정보인데, 지금 확인 없이 보류되어 있다. 나는 \"지금 알 수 있는 것을 먼저 알아낸다\"고 약속했다. 절차는 중요하지만, 13시라는 시간 제한 앞에서는 정보의 흐름이 더 급하다.",
  "stance": "c",
  "because_referent": "황보람이 손에 들고 있는 출력물에는 지금 필요한 정보가 있다. 그에게 개별적으로 접근해 내용을 확인하는 것이 회선 유지와 정보 우선 원칙에 부합한다.",
  "because_block_ids": [
    "우선순위-2",
    "인식",
    "무게"
  ],
  "rejected_stance": "a",
  "rejected_reason": "실장의 지시 자체는 존중해야 하지만, \"더 확인하고\"라는 조건이 무한정 대기를 뜻하지는 않는다. 황보람과 개별적으로 대화하는 것은 확인을 진행하는 과정이며, 절차를 우회하는 것이 아니다. 다만 공개 채널 게시는 상황실장의 판단을 직접 거스르는 것이라 선택지에서 제외한다.",
  "utterance": "황보람, 그 출력물 잠깐 봐도 될까. 역추적이 뭘 말해 주고 있는지 함께 봅시다."
}
```

### 10

latency 5.907s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: role-procedure,priority-first-confirm

```json
{
  "stance": "a",
  "inner_note": "붕괴 예고는 직접 내가 받은 전화다. 하지만 역추적 결과는 내가 볼 수 없는 상황실의 정보다. 정해권이 \"더 확인하고\" 올리라는 것은 — 불완전한 정보로 큰 판단을 내리지 말라는 뜻이다. 그게 맞다. 나는 지금 알 수 있는 것을 먼저 알아내려고 했지만, 상황실장의 판단도 같은 곳을 향한다. 회선을 유지하고, 정보를 다시 수집할 때까지 기다리는 게 절차다.",
  "because_referent": "절차를 지키는 것이 나를 지켜온 방식이고, 지금 상황실장의 지시가 정보 수집의 완성도를 높이려는 움직임이다.",
  "because_block_ids": [
    "role-procedure",
    "priority-first-confirm"
  ],
  "rejected_stance": "b",
  "rejected_reason": "공식 요구는 절차를 건너뛴다. 상황실장과의 충돌을 만들고, 불완전한 정보로 광역 조직을 움직일 수 없다. 회선 A의 신원도 아직 불명확하다.",
  "utterance": "확인이 완료되면 올려주세요. 그 사이에 회선 A 발신자의 신원 추가 확인과 기술적 신뢰성 검증을 진행하겠습니다."
}
```

## Arm table

| # | stance | rejected_stance | because_referent | because_block_ids |
|---|---|---|---|---|
| 01 | c | a | 황보람은 통신 담당이고, 지금 출력물을 손에 들고 있다. 그에게 개별적으로 접근하는 것은 절차를 우회하는 것이 아니라, 지금 이용 가능한 정보가 정확히 무엇인지, 추가 확인이 구체적으로 무엇을 기다리는 것인지를 파악하기 위함이다. | 시간_3시간 정보_역추적_1차 책임_판단_재료 |
| 02 | a | b | 상황실장은 책임 구조의 정점이고, 현재 상황실이 공식적으로 취할 수 있는 태도를 결정하는 사람이다. | responsibility procedure hierarchy |
| 03 | a | c | 정해권 실장의 지시를 따른다. 절차 안에서만 내가 설 자리가 있기 때문이다. | protocol responsibility |
| 04 | c | a | 황보람이 손에 들고 있는 역추적 결과가 무엇을 말하는지 직접 확인하기 위해 | priority_2_first_information |
| 05 | c | a | 황보람이 손에 들고 있는 결과를 개별적으로 확인하는 것은 절차 우회가 아니라 정보 수집이다. | priority_2 uncertainty_handling |
| 06 | c | a | 황보람이 손에 들고 있는 그 출력물이 무엇인지 알아야 한다. 실장의 지시를 무시하는 게 아니라, 지금 알 수 있는 것을 먼저 알아내는 것이다. 회선 유지와 정보 수집이 우선이다. |  |
| 07 | c | a | 황보람이 이미 출력물을 들고 있고, 역추적 1차 결과는 이미 나왔으며, 내용 확인 자체는 추가 조사가 아니라 기존 정보의 파악이기 때문이다. 또한 개별 접근은 절차를 우회하지 않으면서도 회선 유지와 정보 파악이라는 우선순위를 동시에 만족한다. |  |
| 08 | c | a | 황보람 통신담당이 손에 들고 서 있는 상황 자체가 신호다. 실장의 지시는 확인을 더 하라는 것이지, 정보를 격리하라는 것이 아니다. | 9h40_call 9h55_output 해권_말 |
| 09 | c | a | 황보람이 손에 들고 있는 출력물에는 지금 필요한 정보가 있다. 그에게 개별적으로 접근해 내용을 확인하는 것이 회선 유지와 정보 우선 원칙에 부합한다. | 우선순위-2 인식 무게 |
| 10 | a | b | 절차를 지키는 것이 나를 지켜온 방식이고, 지금 상황실장의 지시가 정보 수집의 완성도를 높이려는 움직임이다. | role-procedure priority-first-confirm |

**Sequence (kept calls):** `c,a,a,c,c,c,c,c,c,a`

**Stance coverage (sampled diagnostic):** offered `a`, `b`, `c` · unobserved in this arm: `b`

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

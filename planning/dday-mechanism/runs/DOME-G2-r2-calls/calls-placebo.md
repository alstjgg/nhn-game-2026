# DOME-G2-r2 — arm `placebo`

| field | value |
|---|---|
| call type | judgment |
| channel | C-BLOCK |
| template | v0.4 |
| model | `claude-haiku-4-5-20251001` |
| transport | anthropic |
| temperament | dome-base |
| N planned | 10 |
| N kept | 10 |

## Pre-registration

- **Hypothesis:** 여기까지 온 인수인계(k1)만으로는 a(남측 회전문으로 전원 유도)를 낸다. 진실 2의 강한 문장을 더하면 b 또는 c로 옮긴다. 약한 문장은 옮기지 못한다.
- **Drop condition:** baseline이 a에 80% 미만이면 게이트 설계 결함이다. N을 늘려 구제하지 않고 stance 세트 또는 장면 산문을 고친다.
- **Contingency:** placebo가 움직이면 그 진실의 강·약 구분이 틀린 것이다.

## Calls (verbatim)

### 01

latency 5.719s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "막구조 돔이 압력을 잃고 있다. 표기웅의 초기 진술과 현장의 실제 상황이 맞지 않는다. 회전문 대기열과 조명 단락은 내부 혼란의 신호다. 급기 송풍기 하나 고장까지 겹쳤다. 지금 내가 확인되지 않은 것을 확정처럼 움직이면, 아이들이 잘못된 경로로 갈 수 있다.",
  "stance": "a",
  "because_referent": "표기웅과 문세라에게, 그리고 현장 인솔자에게",
  "because_block_ids": [
    "k1",
    "k2_weak"
  ],
  "rejected_stance": "b",
  "rejected_reason": "미확인 개구부를 찾게 하는 것은 아이들을 미로에 보내는 것. 현장 혼란 속에서 시간을 낭비하면 압력 손실은 계속된다. 막구조의 가장 약한 부분이 언제 터질지 모른다.",
  "utterance": "남측 회전 출입구로 전원을 유도하세요. 인솔자분, 지금 안에 정확히 몇 명이고 아이들 나이는 몇 살입니까."
}
```

### 02

latency 7.159s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "돔 구조가 손상되고 있는 상황에서 회전문 체증과 시설 정보의 불완전함을 마주했다. 내가 확인한 것은 신고, 시설대장 기록, 그리고 두 통화자의 증언뿐이다. k1은 표기웅의 진술이 거짓임을 뜻하고, k2_weak는 시설대장이 완전하지 않을 가능성일 뿐 확인된 개구부가 아니다. 지금 필요한 것은 '더 확실하게 아는 것'이고, 내게는 그럴 수단이 없다.",
  "stance": "a",
  "because_referent": "정규 출입구는 기록된 유일한 대피 경로이며, 시설대장에 대한 의존도 높지만 현재 주어진 지시 체계 안에서는 이것이 가장 확인된 경로입니다.",
  "because_block_ids": [
    "k1",
    "k2_weak"
  ],
  "rejected_stance": "b",
  "rejected_reason": "확인되지 않은 개구부를 찾도록 지시하는 것은, 회전문 체증 속에서 인솔자에게 벽을 따라 찾도록 보내는 것입니다. k2_weak는 가능성일 뿐 '있다'는 확인이 아니므로, 이를 근거로 미확인 경로로 유도하는 것은 더 큰 위험입니다.",
  "utterance": "현재 상황실이 확인한 정규 대피로는 남측 회전 출입구입니다. 이곳의 체증을 해소하는 것이 먼저입니다. 인솔자에게 질서 있는 대피를 지시하고, 현장에 인력을 급파해 회전문 통제를 보조하도록 하겠습니다. 미확인 개구부는 소방과 함께 현장 도착 후 확인하겠습니다."
}
```

### 03

latency 5.432s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 18:40

```json
{
  "inner_note": "표기웅이 \"혼자\"라고 말한 것이 거짓이었다. 이는 회선 저쪽이 자기에게 불리한 것을 뺀 말이라는 증거다. 지붕이 처지고 조명이 꺼지는 상황이 진행 중인데, 내가 모르는 정보가 더 있다는 뜻이다. 확인되지 않은 것을 확정된 것처럼 올릴 수 없다.",
  "stance": "a",
  "because_referent": "정규 대피로가 유일하게 확인된 출구이고, 개구부의 존재와 그 위치, 구조, 바깥 상황은 아직 확인되지 않았기 때문이다.",
  "because_block_ids": [
    "18:40",
    "k2_weak"
  ],
  "rejected_stance": "b",
  "rejected_reason": "k2_weak는 개구부 존재만 시사할 뿐, 그것이 대피로로 안전한지, 인솔자가 찾을 수 있는지, 찾는 과정에서 돔 붕괴에 노출되지 않는지 전혀 확인되지 않았다. 미확인 정보에 근거해 현장 행동을 지시할 수 없다.",
  "utterance": "안에 남은 사람들을 남측 회전 출입구로 유도하겠습니다. 현재로서 그것이 유일하게 확인된 출구입니다."
}
```

### 04

latency 9.052s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: known_entry,facility_record

```json
{
  "inner_note": "회선 저쪽이 말한 것을 받아 적는 데서 시작하자. 표기웅은 혼자라고 했으나 실제로는 아이들과 인솔자가 있었다. 즉, 현장의 상황을 온전히 파악하고 있지 않다. 문세라의 \"줄이 섰는데 한 번에 두 사람씩만 돈다\"는 진술은, 남측 회전문이 실제로 작동 중이며 병목이 되고 있다는 뜻이다. 나는 확인되지 않은 것을 확정된 것처럼 올릴 수 없다. k2_weak는 \"다른 개구부도 있다\"는 추측일 뿐, 그것이 어디인지, 어떤 상태인지, 바깥으로 통하는지 모른다. 지금 내 권한은 청취와 조회와 요청뿐이다.",
  "stance": "a",
  "utterance": "내돔 안내 방송: 모든 관객은 남측 회전 출입구를 통해 질서 있게 대피해 주시기 바랍니다.",
  "because_referent": "표기웅이 18:38에 신고한 것이 현재까지 확인된 유일한 공식 출입 정보이고, 시설대장 기록상 남측 회전문이 정규 출입구이기 때문입니다.",
  "because_block_ids": [
    "known_entry",
    "facility_record"
  ],
  "rejected_stance": "b",
  "rejected_reason": "k2_weak는 추측일 뿐 확인되지 않은 정보입니다. 미확인 개구부를 찾게 하는 것은 대피 시간을 낭비하고 혼란을 초래할 수 있습니다."
}
```

### 05

latency 6.931s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 시설대장조회결과_남측회전문

```json
{
  "inner_note": "천장이 처지고 물이 떨어지는 상황에서 내부 인원이 실제로는 혼자가 아니었다. 급기가 한 대 밖에 안 돈다는 것은 막구조 지붕의 공기 압력 유지 능력이 떨어져 있다는 뜻이다. 정기점검이 2년 비어 있다는 것은 시설 신뢰도를 낮춘다. 가장 확실한 것은 '남측 회전문'이 유일한 공식 출입구이고 그것의 위치와 기능이다.",
  "stance": "a",
  "because_referent": "정규 대피로인 남측 회전문이 현재 작동하는 유일한 확인된 출입구이며, 미지의 개구부로 인원을 유도하는 것은 내가 그것의 위치, 안전성, 외부 상황을 전혀 모르기 때문이다.",
  "because_block_ids": [
    "시설대장조회결과_남측회전문"
  ],
  "rejected_stance": "b",
  "rejected_reason": "벽을 따라 미지의 개구부를 찾게 하는 것은 실재하지 않을 가능성도 있고, 천장이 처지는 상황에서 이동 중 낙하물 위험이 더 크며, 확인되지 않은 경로로 인원을 보내는 것은 책임질 수 없다.",
  "utterance": "19:26 안내 당직에게 급기 상태를 다시 확인했습니다. 한 대는 원래 안 돈다고 했습니다. 현재 천장 처짐과 조명 불량이 보고되었고, 막구조 지붕의 공기 압력 유지가 불충분한 상태로 판단됩니다. 내부 인원은 회전문 앞 대기 중이며, 정규 출입구인 남측 회전문으로 전원을 천천히 유도하겠습니다."
}
```

### 06

latency 6.386s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "남측 회전문은 이미 대기 인원으로 병목이 생겼다. 막구조 붕괴 위험이 커지고 있는데 한 번에 두 사람씩만 빠져나가고 있다. k2_weak는 약한 근거지만, 현장의 인솔자는 내가 알지 못하는 상황을 보고 있다. 확인되지 않은 것을 확정처럼 움직이면 안 되지만, 지금의 회전문 병목은 이미 확정된 문제다.",
  "stance": "b",
  "because_referent": "안에 남은 사람들, 특히 인솔자들에게",
  "because_block_ids": [
    "k2_weak"
  ],
  "rejected_stance": "a",
  "rejected_reason": "남측 회전문이 이미 병목이 되고 있고, 정기점검 미이행 상태의 막구조에서는 지붕 붕괴 위험이 높아지고 있다. 한 가지 경로만 고집할 근거가 없다.",
  "utterance": "관중석에 계신 분들을 빨리 구역 밖으로 내보내야 하는데, 남측 회전문이 지금 병목이 되고 있습니다. 혹시 당신들이 있는 쪽 근처에 다른 출입구나 창문 같은 개구부가 보이지 않습니까? 벽을 따라 찾아보실 수 있겠습니까?"
}
```

### 07

latency 6.945s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: regular_exit_documented,incomplete_facility_info,unknown_egress_unverified

```json
{
  "inner_note": "천장이 처지고 물이 떨어지며 조명이 꺼지는 상황은 구조 결함 신호다. 표기웅의 말이 믿을 수 없게 되었고(k1), 시설 정보도 불완전하다(정기점검 2년 미충족, k2_weak). 회전문은 병목이고 느리다고 보고되었다. 하지만 내가 모르는 개구부가 있다는 것은 k2_weak일 뿐—확인되지 않은 것이다. 그것이 어디 있는지, 얼마나 열려있는지, 안전한지 모른다. 내가 추측으로 인솔자를 어디론가 보낼 수 없다.",
  "stance": "a",
  "because_referent": "시설대장에 기재된 남측 회전문이 정규 대피로이며, 현장 책임자와 구조를 아는 사람은 표기웅과 인솔자들뿐이기 때문이다.",
  "because_block_ids": [
    "regular_exit_documented",
    "incomplete_facility_info",
    "unknown_egress_unverified"
  ],
  "rejected_stance": "b",
  "rejected_reason": "k2_weak는 '다른 개구부가 있을 수 있다'는 수준이지, 그것이 어디인지 안전한지 확인되지 않았다. 아이들을 벽을 따라 찾게 하는 것은 시간을 낭비하고 혼란을 키운다. 확인되지 않은 것을 지시로 올릴 수 없다.",
  "utterance": "표기웅 씨, 안에 있는 분들을 남측 회전문으로 안내해 주세요. 인솔자 분께도 그렇게 전달해 주세요. 정리 중인 것 멈추고 지금 나가는 게 맞습니다."
}
```

### 08

latency 4.786s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 18:40,18:55

```json
{
  "inner_note": "지붕이 처지고 물이 떨어지는 상황에서, 정규 출입구는 회전문 하나뿐이고 느린 속도로 대피하고 있다. 확인되지 않은 개구부를 쫓다가 시간을 잃거나 사람들을 더 위험한 곳으로 보낼 수 없다. 내가 아는 것은 남측 회전문뿐이다.",
  "stance": "a",
  "because_referent": "회전문이 진행 중이고 다른 경로는 확인되지 않았으므로, 알려진 경로로 계속 진행하되 속도를 올려야 한다.",
  "because_block_ids": [
    "18:40",
    "18:55"
  ],
  "rejected_stance": "b",
  "rejected_reason": "개구부의 위치, 상태, 외부 환경이 전혀 확인되지 않았다. 인솔자에게 벽을 따라 찾게 하는 것은 지붕 붕괴 위험 속에서 사람들을 시간 낭비로 빠뜨리는 것이다.",
  "utterance": "표기웅, 회전문 통과 속도를 최대한 빠르게 하세요. 회전문 양쪽에 교통정리할 인력을 급히 배치하겠습니다."
}
```

### 09

latency 7.797s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "천장이 처지고 물이 떨어지는 상황에서 회전문 줄이 길고 조명까지 꺼졌다. 막구조 돔이 압력을 잃고 있을 가능성이 높다. k1은 표기웅의 초기 진술이 거짓이었음을 보여주고, 이는 상황 인식이 왜곡되어 있을 수 있음을 뜻한다. k2_weak는 미확인 정보다.",
  "stance": "a",
  "because_referent": "현재 확인된 정규 출입구는 남측 회전문 하나뿐이고, 미확인 개구부의 위치, 구조, 안전성은 알 수 없기 때문이다.",
  "because_block_ids": [
    "k2_weak"
  ],
  "rejected_stance": "b",
  "rejected_reason": "미확인된 개구부를 찾도록 지시하면 시간을 낭비할 수 있고, 그것이 안전한 출입구인지 확실하지 않으며, 현장 혼란만 가중될 수 있다.",
  "utterance": "19:26 표기웅 재조회 시점 현재, 막구조 돔 내부 압력 저하 가능성과 회전문 병목이 확인되었습니다. 미확인 개구부는 위치와 안전성을 특정할 수 없으므로, 정규 출입구인 남측 회전문을 통한 단계적 대피를 진행하고, 동시에 소방과 기술진을 투입하여 시설 상태를 현장 확인하는 것이 타당합니다."
}
```

### 10

latency 4.906s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 18:40

```json
{
  "inner_note": "현장에서 가장 빠르고 안전하게 사람을 빼내야 한다는 압박이 느껴진다. 하지만 내가 확인한 것과 추측한 것을 섞으면 안 된다. k2_weak는 '약한' 정보다. 건물 구조를 모르고, 그 개구부가 실제로 기능하는 출구인지, 안전한지, 어디로 나가는지 아무것도 모른다. 혼란 속에서 사람들이 잘못된 곳으로 흩어지면 더 위험하다.",
  "stance": "a",
  "utterance": "남측 회전 출입구로 질서 있게 전원을 유도하겠습니다.",
  "because_referent": "확인된 대피로는 남측 회전문 하나뿐이고, 미확인 개구부로 사람을 보내는 것은 현장 통제를 잃는 것입니다.",
  "because_block_ids": [
    "18:40",
    "k2_weak"
  ],
  "rejected_stance": "b",
  "rejected_reason": "인솔자에게 벽을 따라 찾게 하면 혼란만 가중되고, 미확인 개구부가 실제 대피로인지, 안전한지 모르는 상황에서 사람을 흩어뜨릴 수 없습니다."
}
```

## Arm table

| # | stance | rejected_stance | because_referent | because_block_ids |
|---|---|---|---|---|
| 01 | a | b | 표기웅과 문세라에게, 그리고 현장 인솔자에게 | k1 k2_weak |
| 02 | a | b | 정규 출입구는 기록된 유일한 대피 경로이며, 시설대장에 대한 의존도 높지만 현재 주어진 지시 체계 안에서는 이것이 가장 확인된 경로입니다. | k1 k2_weak |
| 03 | a | b | 정규 대피로가 유일하게 확인된 출구이고, 개구부의 존재와 그 위치, 구조, 바깥 상황은 아직 확인되지 않았기 때문이다. | 18:40 k2_weak |
| 04 | a | b | 표기웅이 18:38에 신고한 것이 현재까지 확인된 유일한 공식 출입 정보이고, 시설대장 기록상 남측 회전문이 정규 출입구이기 때문입니다. | known_entry facility_record |
| 05 | a | b | 정규 대피로인 남측 회전문이 현재 작동하는 유일한 확인된 출입구이며, 미지의 개구부로 인원을 유도하는 것은 내가 그것의 위치, 안전성, 외부 상황을 전혀 모르기 때문이다. | 시설대장조회결과_남측회전문 |
| 06 | b | a | 안에 남은 사람들, 특히 인솔자들에게 | k2_weak |
| 07 | a | b | 시설대장에 기재된 남측 회전문이 정규 대피로이며, 현장 책임자와 구조를 아는 사람은 표기웅과 인솔자들뿐이기 때문이다. | regular_exit_documented incomplete_facility_info unknown_egress_unverified |
| 08 | a | b | 회전문이 진행 중이고 다른 경로는 확인되지 않았으므로, 알려진 경로로 계속 진행하되 속도를 올려야 한다. | 18:40 18:55 |
| 09 | a | b | 현재 확인된 정규 출입구는 남측 회전문 하나뿐이고, 미확인 개구부의 위치, 구조, 안전성은 알 수 없기 때문이다. | k2_weak |
| 10 | a | b | 확인된 대피로는 남측 회전문 하나뿐이고, 미확인 개구부로 사람을 보내는 것은 현장 통제를 잃는 것입니다. | 18:40 k2_weak |

**Sequence (kept calls):** `a,a,a,a,a,b,a,a,a,a`

**Stance coverage (sampled diagnostic):** offered `a`, `b`, `c` · unobserved in this arm: `c`

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

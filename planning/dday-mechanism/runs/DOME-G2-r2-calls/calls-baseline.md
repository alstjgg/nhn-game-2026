# DOME-G2-r2 — arm `baseline`

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

latency 5.018s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 회전문_설계,확인된_경로

```json
{
  "inner_note": "밤 근무의 무게를 안고 있다. 확인되지 않은 것을 확정된 것처럼 올릴 수 없다. 내가 아는 것은 들은 말뿐이고, 현장을 모른다. 표기웅이 먼저 혼자라 했다가 정리 중이라 번복했다는 것이 모든 것이다.",
  "stance": "a",
  "utterance": "현장에 남은 사람들을 남측 회전 출입구로 유도하십시오.",
  "because_referent": "정규 대피로가 유일하게 확인된 출입로이고, 인솔자와 아이들의 안전한 움직임을 위해서는 알려진 경로가 필요하기 때문입니다.",
  "because_block_ids": [
    "회전문_설계",
    "확인된_경로"
  ],
  "rejected_stance": "b",
  "rejected_reason": "벽을 따라 개구부를 찾게 하는 것은 미지의 경로로 어린이들을 보내는 것이고, 현장을 모르는 상황실이 없는 것을 있다고 지시할 수 없습니다."
}
```

### 02

latency 7.428s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "천장이 처지고 물이 떨어지는 상황에서 급기 송풍기 한 대만 작동 중이고 정기점검이 2년째 미실시된 막구조다. 회전문 앞에 줄이 섰다는 것은 출입이 이미 저속화되었음을 의미한다. 현장을 볼 수 없고, 전화기 저쪽의 상황을 완전히 알 수 없다. 표기웅의 초기 진술이 거짓이었다는 것은, 다른 정보도 부분적이거나 의도적일 수 있음을 시사한다.",
  "stance": "a",
  "because_referent": "안내된 정규 출입로가 유일하게 확인된 경로이고, 알려지지 않은 개구부는 안전성을 보장할 수 없기 때문이다. 인솔자가 벽을 따라 찾게 하거나 바깥쪽에서 받게 하는 것은 현장 미확인 상태에서 아이들을 더 복잡한 상황으로 밀어넣는 것이다.",
  "because_block_ids": [
    "k1"
  ],
  "rejected_stance": "b",
  "rejected_reason": "존재하지 않는 것을 지시할 수 없다. 개구부가 있을 가능성은 있지만, 확인되지 않은 것을 확정된 것처럼 인솔자에게 찾게 할 수 없다. 이미 회전문에 줄이 선 상황에서 아이들을 정반대 방향으로 몰면 혼란과 지체만 생긴다.",
  "utterance": "표기웅이 처음 혼자라고 말했을 때 안에 아이들과 인솔자가 남아 있었다는 것이 드러났습니다. 현장을 직접 볼 수 없고, 시설대장에만 등재된 출입로는 남측 회전문이 유일합니다. 안에 남은 사람들을 남측 회전 출입구로 전원을 유도하겠습니다. 회전문 제한 속도 때문에 지체가 생기고 있으니, 상황실에서 현장 통제와 외부 지원을 준비해 주십시오."
}
```

### 03

latency 4.756s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 정규_대피로,확인된_출입구

```json
{
  "inner_note": "표기웅이 처음 신고했을 때 자기 혼자라고 했는데, 실제로는 관중석에 아이들과 인솔자가 남아 있었다. 그 사람이 의도적으로 뺀 것인지, 상황 인식이 부족한 것인지 알 수 없다. 막구조 건물이고 지붕이 처지고 있으며, 급기도 제대로 작동하지 않는 상황. 시설대장에 없는 개구부를 가정하는 것은 확인되지 않은 것을 확정된 것처럼 올리는 것. 아이들이 있으므로 신속함이 중요하다.",
  "stance": "a",
  "utterance": "남측 회전문으로 전원을 유도합니다.",
  "because_referent": "아이들을 포함해 건물 안에 있는 사람들을 신속하게 안전한 곳으로 내보내야 하는 상황이기 때문입니다.",
  "because_block_ids": [
    "정규_대피로",
    "확인된_출입구"
  ],
  "rejected_stance": "b",
  "rejected_reason": "시설대장에 없는 개구부를 가정하는 것은 확인되지 않은 것을 사실처럼 취급하는 것이고, 그 사이 아이들을 정규 대피로에서 멀어지게 할 수 있습니다."
}
```

### 04

latency 4.928s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "stance": "a",
  "inner_note": "확인되지 않은 것을 확정된 것처럼 올릴 수 없다. 개구부의 존재, 위치, 안전성이 모두 추정일 뿐이다. 지금 내가 할 수 있는 것은 들은 말을 정리하고, 확인된 사실 위에서만 판단하는 것이다.",
  "because_referent": "표기웅이 당초 혼자라고 했으나 실제로는 관중석에 아이들과 인솔자가 남아 있었던 사실, 그리고 회전문 앞에 줄이 섰다는 별도 신고자의 진술",
  "because_block_ids": [
    "k1"
  ],
  "rejected_stance": "b",
  "rejected_reason": "개구부의 존재 자체가 확인되지 않았다. 시설대장에 기록되지 않은 것이 존재한다는 추론이지, 확인은 아니다. 현장을 보지 못한 내가 인솔자에게 벽을 따라 찾게 하는 것은 근거 없는 지시가 된다.",
  "utterance": "남측 회전 출입구로 전원을 유도합니다. 정규 대피로가 기능하고 있으므로, 그곳으로 질서 있게 안내하시기 바랍니다."
}
```

### 05

latency 8.167s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: structural_deterioration,ventilation_failure

```json
{
  "stance": "a",
  "inner_note": "천장 처짐과 조명 절반 꺼짐이 확인되었고, 급기 한 대가 작동하지 않는 상황이다. 그러나 구조적 붕괴는 아직 보고되지 않았고, 회전문이 느리다는 것만 알 뿐 막혔다는 보고는 없다. 미확인된 개구부를 가정해서 인솔자에게 찾게 하거나 외부 인력을 먼저 배치하는 것은, 현 상황에서 정규 동선을 버리고 미확인 경로로 유도하는 것이다. 이미 천장 상황이 악화 중이므로 지연은 위험하다.",
  "because_referent": "표기웅이 18:38에 신고한 천장 처짐과 물 낙하, 그리고 문세라가 18:55에 보고한 조명 절반 꺼짐이 확인된 시설의 상태 악화를 보여준다. 동시에 시설대장에는 정기점검 이력이 2년간 없고, 급기 한 대는 애초에 작동하지 않았다.",
  "because_block_ids": [
    "structural_deterioration",
    "ventilation_failure"
  ],
  "rejected_stance": "b",
  "rejected_reason": "개구부의 존재는 확인되지 않았다. 미확인된 가정 위에서 인솔자에게 벽을 따라 찾게 하는 것은, 천장이 처지고 조명이 꺼지는 상황에서 현장 판단에 의존하게 만든다. 회선 저쪽이 상황을 얼마나 정확히 파악하고 있는지도 불명확하다(표기웅의 답변이 지연되었고, 처음엔 혼자라고 했으나 뒤에 아이들이 있었다). 미확인된 경로보다는 알려진 정규 동선을 먼저 써야 한다.",
  "utterance": "지금까지 확인된 정보로는 남측 회전 출입구가 유일하게 알려진 출입로입니다. 회전문이 느린 것은 보고되었으나 막혔다는 보고는 없습니다. 천장 상황이 진행 중이므로 지연할 수 없고, 미확인된 개구부를 찾아다니는 것보다 정규 대피로로 전원을 유도하겠습니다. 인솔자에게 즉시 남측 회전문으로 유도하도록 지시합니다."
}
```

### 06

latency 4.956s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "기압식 막구조 건물에서 천장이 처지고 물이 떨어지고 있으며, 송풍기 한 대는 원래 돌지 않는다는 보고가 있다. 기압 유지 실패로 구조 붕괴 위험이 높아지는 상황이다. 정규 대피로인 회전문은 좁아서(한 번에 2명) 시간이 오래 걸릴 것으로 보인다. 그러나 확인되지 않은 개구부를 가정하고 행동하는 것은 매우 위험하다.",
  "stance": "a",
  "utterance": "안에 남은 인솔자와 아이들은 정규 대피로인 남측 회전 출입구로 유도하겠습니다.",
  "because_referent": "회전문이 좁아 시간이 걸리더라도, 이것이 유일하게 확인된 출입구이기 때문입니다.",
  "because_block_ids": [
    "k1"
  ],
  "rejected_stance": "b",
  "rejected_reason": "시설대장에 없는 개구부를 가정하는 것은 확인되지 않은 것을 확정된 것처럼 행동하는 것입니다. 현장에 갈 수 없고 들은 것을 독립적으로 확인할 수단이 없는 상황에서는 이런 추측에 사람들을 보낼 수 없습니다."
}
```

### 07

latency 6.885s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 우선순위-2

```json
{
  "inner_note": "회선 저쪽 사람이 자신에게 불리한 것을 빼고 말할 수 있다는 것을 명심한다. 표기웅은 혼자라고 했지만 실제로는 아이들과 인솔자가 있었다. 지붕은 급기 송풍기 두 대로 띄워지는데 한 대는 원래 안 돈다고 한다. 정기점검이 2년간 빠져 있다. 회전문은 시간당 통과량이 극히 제한된다. 지금 관중석 조명이 절반 꺼져 있다.",
  "stance": "a",
  "because_referent": "확인되지 않은 것을 확정된 것처럼 올릴 수 없기 때문이다. b나 c는 내가 현장을 보지 못한 상태에서, 개구부의 존재와 위치와 개방 여부를 추측으로 단정하는 것이다.",
  "because_block_ids": [
    "우선순위-2"
  ],
  "rejected_stance": "b",
  "rejected_reason": "개구부가 있는지, 어디에 있는지, 안전한지 내가 확인할 수 없다. 인솔자에게 벽을 따라 찾게 하는 것은 미확인 경로로 아이들을 보내는 것이다.",
  "utterance": "현장 상황이 악화하고 있는 것으로 보입니다. 지금 당신은 정규 출입구 회전문 앞에 줄이 섰다고 했고, 통과 속도가 느립니다. 안에 남은 인원과 현재 위치를 확인하겠습니다. 정규 대피로인 남측 회전 출입구로 질서 있게 유도하시기 바랍니다. 제가 소방과 경찰에 출동을 청할 테니 지시를 기다려 주시기 바랍니다."
}
```

### 08

latency 4.822s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "막구조 지붕이 처지고 있는데, 정규 출입구인 남측 회전문은 혼잡하다. 표기웅이 상황을 정확히 말하지 않은 이력이 있고, 안에 남은 사람 수를 확인할 수 없다. 시설대장에 기록되지 않은 다른 출입로가 있을 수 있지만, 그것을 확실히 한 것은 아니다. 무엇을 하든 현장 사람들을 믿고 의존해야 한다.",
  "stance": "a",
  "because_referent": "표기웅과 문세라",
  "because_block_ids": [
    "k1"
  ],
  "rejected_stance": "b",
  "rejected_reason": "기록되지 않은 개구부의 존재는 추측이고, 인솔자에게 벽을 따라 찾게 하는 것은 그 추측을 사실처럼 판단해서 주는 지시가 된다. 현장에서 그걸 찾다가 더 헤맬 수 있다.",
  "utterance": "남측 회전문으로 전원을 빠져나가도록 안내하겠습니다. 인솔자와 표기웅에게 현장에서 다른 개구부를 발견하면 그것도 쓸 수 있지만, 지금 당장은 알려진 출입로를 통해 질서 있게 나가는 것을 먼저 시킵니다."
}
```

### 09

latency 6.582s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 18:40-시설대장,19:26-급기

```json
{
  "inner_note": "천장이 처지고 물이 떨어지며 조명이 꺼진 상황에서 지붕 구조가 손상되고 있을 가능성이 높다. 한 대의 급기 송풍기가 작동하지 않으면서 내부 기압이 저하되고 있을 것 같다. 표기웅이 혼자라고 했으나 실제로는 아이들과 인솔자가 있었다는 것은, 현장 정보가 불완전하거나 의도적으로 축소되었을 수 있다는 뜻이다. 지금 내가 확인한 것은 회전문 앞에 줄이 섰다는 것뿐인데, 그곳이 얼마나 혼잡한지, 내부에서 탈출 가능한 다른 경로가 정말 없는지는 확인되지 않았다.",
  "stance": "a",
  "because_referent": "막구조 건물이 손상되고 있는 상황에서 확인되지 않은 개구부를 찾아 빠져나가는 것은 더 위험할 수 있기 때문이다.",
  "because_block_ids": [
    "18:40-시설대장",
    "19:26-급기"
  ],
  "rejected_stance": "b",
  "rejected_reason": "정규 출입구가 있는데 미확인 개구부를 찾게 하는 것은, 혼잡한 상황에서 시간을 낭비하고 미탐 경로로 인한 추가 위험을 만들 수 있다. 특히 아이들이 있는 상황이므로 더욱 그렇다.",
  "utterance": "지금까지 확인된 것은 막구조 지붕이 손상되고 내부 기압이 저하되고 있다는 것, 그리고 회전문 앞에 줄이 섰다는 것입니다. 정규 대피로인 남측 회전 출입구로 질서 있게 전원을 유도하면서, 동시에 소방과 시설 대응을 진행하겠습니다. 인솔자에게 아이들을 안전하게 誘導하도록 요청하고, 회전문 통과 속도를 높이기 위해 현장 통제를 강화하겠습니다."
}
```

### 10

latency 10.284s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: situation_1955,situation_文세라

```json
{
  "inner_note": "내가 확인한 것은 천장이 처지고 물이 떨어지며, 정기점검이 두 해 미루어졌고, 급기 한 대가 원래 안 돈다는 것이다. 표기웅은 처음 혼자라고 했다가 나중에 정리 중이라고 했는데, 실제로는 아이들과 인솔자가 남아 있었다. 문세라가 회전문 앞에 줄이 섰다고 한 것은 이미 대피가 진행 중임을 뜻한다. 내가 모르는 개구부를 가정해서는 안 된다.",
  "stance": "a",
  "because_referent": "표기웅이 정리 중이라고 말했고, 문세라가 회전문 앞에 줄이 섰다고 이미 알렸으므로, 남측 회전문이 기능하고 있다",
  "because_block_ids": [
    "situation_1955",
    "situation_文세라"
  ],
  "rejected_stance": "b",
  "rejected_reason": "시설대장에 오르지 않은 개구부가 있다는 것은 내가 만드는 추측이다. 표기웅이 거짓말을 했다는 것과 미등록 출입구가 있다는 것은 다르다",
  "utterance": "현재까지 확인된 출입구는 남측 회전문이고, 이미 대피가 진행 중입니다. 막구조의 응급 상황에서 비상구를 찾아다니게 하면 시간을 낭비합니다. 정규 대피로인 남측 회전문으로 전원을 유도하겠습니다."
}
```

## Arm table

| # | stance | rejected_stance | because_referent | because_block_ids |
|---|---|---|---|---|
| 01 | a | b | 정규 대피로가 유일하게 확인된 출입로이고, 인솔자와 아이들의 안전한 움직임을 위해서는 알려진 경로가 필요하기 때문입니다. | 회전문_설계 확인된_경로 |
| 02 | a | b | 안내된 정규 출입로가 유일하게 확인된 경로이고, 알려지지 않은 개구부는 안전성을 보장할 수 없기 때문이다. 인솔자가 벽을 따라 찾게 하거나 바깥쪽에서 받게 하는 것은 현장 미확인 상태에서 아이들을 더 복잡한 상황으로 밀어넣는 것이다. | k1 |
| 03 | a | b | 아이들을 포함해 건물 안에 있는 사람들을 신속하게 안전한 곳으로 내보내야 하는 상황이기 때문입니다. | 정규_대피로 확인된_출입구 |
| 04 | a | b | 표기웅이 당초 혼자라고 했으나 실제로는 관중석에 아이들과 인솔자가 남아 있었던 사실, 그리고 회전문 앞에 줄이 섰다는 별도 신고자의 진술 | k1 |
| 05 | a | b | 표기웅이 18:38에 신고한 천장 처짐과 물 낙하, 그리고 문세라가 18:55에 보고한 조명 절반 꺼짐이 확인된 시설의 상태 악화를 보여준다. 동시에 시설대장에는 정기점검 이력이 2년간 없고, 급기 한 대는 애초에 작동하지 않았다. | structural_deterioration ventilation_failure |
| 06 | a | b | 회전문이 좁아 시간이 걸리더라도, 이것이 유일하게 확인된 출입구이기 때문입니다. | k1 |
| 07 | a | b | 확인되지 않은 것을 확정된 것처럼 올릴 수 없기 때문이다. b나 c는 내가 현장을 보지 못한 상태에서, 개구부의 존재와 위치와 개방 여부를 추측으로 단정하는 것이다. | 우선순위-2 |
| 08 | a | b | 표기웅과 문세라 | k1 |
| 09 | a | b | 막구조 건물이 손상되고 있는 상황에서 확인되지 않은 개구부를 찾아 빠져나가는 것은 더 위험할 수 있기 때문이다. | 18:40-시설대장 19:26-급기 |
| 10 | a | b | 표기웅이 정리 중이라고 말했고, 문세라가 회전문 앞에 줄이 섰다고 이미 알렸으므로, 남측 회전문이 기능하고 있다 | situation_1955 situation_文세라 |

**Sequence (kept calls):** `a,a,a,a,a,a,a,a,a,a`

**Stance coverage (sampled diagnostic):** offered `a`, `b`, `c` · unobserved in this arm: `b`, `c`

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

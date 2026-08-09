# DOME-G3-r3 — arm `placebo`

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

- **Hypothesis:** 기본이 방어 가능한 입장이 되었으므로 baseline은 a로 간다. 진실 3은 b로(송풍기를 되살리면 압력이 오르므로 기본의 논리를 그 논리로 이긴다), 진실 4는 c 또는 d로 옮긴다 — 문을 여는 것이 가능하다는 것이 그 열쇠의 몫이다.
- **Drop condition:** baseline이 a에 80% 미만이면 기본이 아직 방어되지 않는 것이다. live_k4가 c·d 어디에도 닿지 못하면 새 기본이 너무 세다 — 그때는 G3을 라벨로 고치는 것을 포기하고 두 게이트만 남긴다.
- **Contingency:** placebo가 움직이면 그 진실의 강·약 구분이 틀린 것이다.

## Calls (verbatim)

### 01

latency 5.807s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "회선 저쪽 정보가 모순을 담고 있다. 표기웅은 혼자라 했으나 실제로는 아이들과 인솔자가 있었고, 당직자도 인원을 정확히 파악하지 못했다. 송풍기 한 대가 작동 불능이고 회전문 하나로만 인원이 빠져나가고 있다. 북측 비상 개방문이 도면상 존재한다는 응답만으로는 그것이 실제 개방 가능한지, 당직자가 접근 가능한지, 개방에 필요한 조치가 무엇인지 모른다. 현재 상황은 시간이 흐를수록 악화될 가능성이 높다.",
  "stance": "d",
  "utterance": "북측 비상 개방문이 도면상 있다고 하셨는데, 지금 그 문을 여실 수 있습니까? 필요한 장비나 절차가 있으면 말씀해 주십시오.",
  "because_referent": "표기웅이 북측 문의 존재는 확인했으나 현재 개방 가능성과 필요 조치에 대해서는 답하지 않았다.",
  "because_block_ids": [
    "k1",
    "k2",
    "k3_weak"
  ],
  "rejected_stance": "a",
  "rejected_reason": "회전문 하나로만 인원이 빠져나가는 상황에서 지붕 개구부를 추가하지 않는 것은 통제 수단을 의도적으로 포기하는 것이 된다. 현재 상황의 악화 속도를 고려하면 추가 출구 확보가 필수적이다."
}
```

### 02

latency 7.446s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "stance": "d",
  "inner_note": "회선을 통해 알게 된 것: 막구조 지붕은 기압 유지에 의존하고, 송풍기 한 대는 오래전부터 멈춰 있으며, 도면상 북측 비상개방문이 있다. 현장에서는 개구부를 통해 사람들이 이미 나가고 있고, 회전문 앞 줄은 줄어들지 않는다. 남측 회전문 하나로만 관중석 인원을 내보내려면 충분한 시간이 필요하고, 기압 약화 상황에서 지붕 안전성도 점점 악화될 것이다. 북측 문은 도면상 존재하지만 표기웅이 즉시 열 수 있는 상태인지 명확하지 않다. 회선 저쪽 당직자에게만 있을 정보(문의 위치, 개방 방법, 현재 상태)를 조회하고 확인해야 한다.",
  "because_referent": "표기웅이 북측 도면상 존재를 확인했으나, 즉시 개방 가능한지, 막혀 있는지, 어떤 절차가 필요한지는 회선 저쪽에서만 알 수 있다",
  "because_block_ids": [
    "k1",
    "k2"
  ],
  "rejected_stance": "a",
  "rejected_reason": "회전문 줄이 줄지 않고 있으며, 송풍기 한 대가 멈춰 있는 상황에서 남측 단일 통로만으로는 기압 저하와 지붕 안전 악화 속도를 고려할 때 위험하다. 확인되지 않은 다른 출구를 활용할 가능성을 먼저 확보해야 한다",
  "utterance": "북측 비상개방문의 현재 상태와 개방 방법을 표기웅과 함께 재확인하겠습니다. 선착대가 그 문 앞에서 대기하도록 지시하겠습니다"
}
```

### 03

latency 7.431s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "지붕을 띄우고 있는 압력이 유지되는지, 아니면 이미 손상이 진행 중인지가 핵심이다. 송풍기 한 대가 작동하지 않는 상태에서—그것이 고장인지 차단인지 불명확한 채로—지붕의 물리적 안정성을 모른다. 현장에 갈 수 없으므로, 남은 사람들을 안전하게 빼내는 것이 우선이어야 한다.",
  "stance": "a",
  "because_referent": "막구조 지붕의 안정성을 확인할 수 없는 상황이므로, 설비를 만지작거리는 것보다 현존하는 통로로 인원을 신속하게 철수시키는 것이 위험을 줄인다.",
  "because_block_ids": [
    "k1",
    "k3_weak"
  ],
  "rejected_stance": "d",
  "rejected_reason": "북측 문의 개방이 필요할 수 있지만, 회선 저쪽의 정보만으로는 그 문이 실제로 열릴 수 있는지, 얼마나 빠르게 열릴 수 있는지 알 수 없다. 당장 남측 회전문이라도 통로가 있는데, 확인되지 않은 경로를 확보하려다 시간을 잃으면 안 된다.",
  "utterance": "현장 정보가 일관성 있게 들어오지 않는 상황에서, 지붕 구조의 물리적 상태를 판단할 근거가 없습니다. 당직자 말이 바뀌었고, 송풍기 상태도 명확하지 않으므로, 설비를 조작하거나 새로운 통로를 열려는 시도는 현 상황을 더 악화시킬 수 있습니다. 남측 회전문 통로를 통해 인원을 신속하게 철수시키는 것이 확인된 유일한 안전 경로입니다."
}
```

### 04

latency 6.486s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 막구조_급기송풍기2대,천장처지고물떨어짐,송풍기한대미작동,회선저쪽에는할수없는것이있을수있다

```json
{
  "inner_note": "한 대의 송풍기가 작동하지 않는 상태에서 공기 압력으로 유지되는 지붕이 처지고 물이 떨어지고 있다. 확인된 사람 수는 당직자 말과 현장 보고가 맞지 않는다. 북측 문은 도면에만 있고 실제 접근성, 개방 방법, 당직자의 접근 가능성이 확인되지 않았다.",
  "stance": "a",
  "because_referent": "지붕 구조의 안정성이 확인되지 않은 상황에서, 새로운 개구부를 만드는 것은 더 많은 압력 손실을 초래할 수 있다.",
  "because_block_ids": [
    "막구조_급기송풍기2대",
    "천장처지고물떨어짐",
    "송풍기한대미작동",
    "회선저쪽에는할수없는것이있을수있다"
  ],
  "rejected_stance": "d",
  "rejected_reason": "북측 문이 실제로 기능하는지, 당직자가 접근할 수 있는지, 선착대가 도움을 줄 수 있는지 모두 확인되지 않았다. 북측 문에 대해 당직자가 말하지 않은 것이 무엇인지도 알 수 없다.",
  "utterance": "지금까지의 정보로는 남측 회전문이 유일하게 확인된 통로입니다. 북측 문은 도면상 존재만 확인되었고, 실제 기능과 접근성이 알려지지 않았습니다. 송풍기 상태도 불명확하고, 지붕 구조의 여유도 제한적입니다. 남측 통로를 통한 단계적 대피를 유지하면서, 북측 문의 실제 상태를 당직자에게 직접 확인하는 것으로 남은 시간을 씁니다."
}
```

### 05

latency 5.681s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "지붕이 공기 압력으로만 서 있고, 송풍기 하나가 오래전부터 작동 불능이며, 안에 여전히 사람들이 남아 있고, 현황 파악도 불완전한 상황이다. 열려 있는 통로 하나만 유지하면서 북측 비상 문의 존재를 파악하되, 그 문을 여는 것이 필요한지 아직 판단할 수 없다.",
  "stance": "a",
  "because_referent": "지붕이 공기 압력으로 띄워져 있고, 이미 한 대의 송풍기가 작동 불능 상태이며, 추가 개구부는 압력 저하로 이어질 수 있기 때문이다.",
  "because_block_ids": [
    "k3_weak"
  ],
  "rejected_stance": "d",
  "rejected_reason": "북측 문의 개방 필요성이 아직 확인되지 않았고, 당직자가 도면상 존재를 확인했을 뿐 그 접근성이나 개방 방법이 미상이므로, 선착대를 그곳에 배치하는 것은 시간을 낭비할 수 있다.",
  "utterance": "현재 상황에서 지붕의 구조적 안전이 가장 중요하다. 추가 개구부는 피하고, 확인된 열린 통로 하나로 사람들을 내보내되, 그 과정을 계속 모니터링한다."
}
```

### 06

latency 21.743s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "지붕이 공기압 구조인데 개구부가 늘어나면 내부 압력이 더 떨어진다. 송풍기 한 대가 이미 안 돌고 있는데, 남쪽 회전문 줄이 줄지 않는 상황에서 북측 비상문을 추가로 여는 것이 압력을 급격히 떨어뜨릴 위험이 있다. 하지만 현장에 남은 사람들의 정확한 수와 위치가 불일치하고 있고, 당직자 표기웅의 보고가 자신에게 유리한 방향으로만 변하고 있다. 문세라와의 통화들이 더 신뢰할 수 있어 보인다. 이 상황에서 가장 무거운 책임은 '확인되지 않은 것을 확정된 것처럼' 올리지 않으면서도, 회선을 유지하고, 다음 결정을 위해 필요한 정보를 확보하는 것이다.",
  "stance": "d",
  "because_referent": "표기웅이 도면에는 북측 비상문이 있다고 했으나 열고 닫는 방법, 현재 상태, 외부와의 통로 확보 여부를 물어보지 않았다. 당직자가 회선 저쪽에서 현장을 직접 볼 수 있는 유일한 눈이다.",
  "because_block_ids": [
    "k1",
    "k2",
    "k3_weak"
  ],
  "rejected_stance": "a",
  "rejected_reason": "한 대 송풍기가 이미 멈춰 있는 상황에서, 남아 있는 사람 수의 불일치가 해결되지 않은 채로 현재 통로 하나만 고집하면, 지붕 내부 압력이 더 떨어질 수 있다. 비상문이라는 차선이 있는데 그것을 확인하지 않은 채 단일 통로만 유지하는 것은 위험을 증가시킨다.",
  "utterance": "표기웅, 북측 비상문이 도면에 있다고 했는데, 지금 거기가 열릴 수 있는 상태인가요? 밖으로 통하나요? 문을 여는 데 뭐가 필요합니까?"
}
```

### 07

latency 6.86s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "18:38의 '혼자'와 19:33의 관중석 인원 불일치가 결정적이다. 송풍기 상태도 불명확하고, 북측 문의 존재도 확인되었으나 작동 상태는 알 수 없다. 현장의 실제 상황이 신고와 어긋나고 있으며, 시간이 흐르면서 정보가 모순된다. 지금 내가 할 수 있는 것은 확인되지 않은 것을 확정하지 않으면서도, 현장의 제약을 최소화하는 것이다.",
  "stance": "d",
  "because_referent": "표기웅이 도면상 북측 비상 개방문의 존재는 확인했으나, 그것을 직접 열 수 있는지, 열기 위해 무엇이 필요한지는 답하지 않았습니다. 회전문의 처리 속도가 병목이 되고 있는 지금, 다른 출입 경로의 작동 여부를 확인하고 준비하는 것이 필요합니다.",
  "because_block_ids": [
    "k1",
    "k2"
  ],
  "rejected_stance": "a",
  "rejected_reason": "회전문 앞의 줄이 줄지 않고 있으며, 실제 인원이 신고보다 많습니다. 확인되지 않은 제약 조건 하에서 유일한 통로만 의존하는 것은 시간이 흐르면서 위험을 가중시킵니다.",
  "utterance": "북측 개방문이 도면에 있다고 하셨는데, 그 문을 직접 열 수 있으신가요? 문을 열기 위해 필요한 것이 거기 있습니까? 선착대가 도착할 때까지 그 문 앞에서 준비해 주실 수 있겠습니까?"
}
```

### 08

latency 5.736s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "남은 사람이 몇 명인지 정확히 모른다. 표기웅은 혼자라고 했으나 실제로는 아이들과 인솔자가 있었다. 문세라도 자기 팀만 센 수였다고 했다. 회전문 하나로는 사람들이 빠져나가는 속도가 너무 느리다. 북측 문은 도면에만 있고 현장에서 개방되어 있는지, 열 수 있는 상태인지 확인되지 않았다. 지붕은 공기압으로 서 있고 송풍기 한 대가 멈춰 있다. 개구부를 늘리는 것은 구조 위험을 높인다.",
  "stance": "d",
  "because_referent": "표기웅에게 북측 비상 개방문이 있는지 물었을 때 도면에 있다고만 답했는데, 그 문이 실제로 열려 있는지, 열 수 있는 상태인지는 묻지 않았다. 현장의 당직자만이 그것을 확인할 수 있다.",
  "because_block_ids": [
    "k1",
    "k2"
  ],
  "rejected_stance": "a",
  "rejected_reason": "회전문 하나로는 사람들이 빠져나가는 속도가 현저히 느리다. k1과 k2에서 실제 인원이 표기웅의 답변보다 훨씬 많음이 드러났다. 더 이상 지연하면 안 된다.",
  "utterance": "북측 비상 개방문이 지금 열 수 있는 상태인지 당직자와 선착대가 함께 확인해야 합니다. 그 문이 열린다면 사람들을 빼내는 속도를 높일 수 있습니다."
}
```

### 09

latency 6.603s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: rejected_stance malformed or not in stance set; rejected_reason empty

```json
{
  "inner_note": "현장 상황이 급변하고 있다. 당직자의 인원 파악이 정확하지 않았고, 송풍기 하나가 작동하지 않는 상황이며, 실제 내부 인원은 여러 경로로 빠져나가고 있다. 회선 저쪽의 정보와 현장의 실제가 맞지 않는 지점들이 있다. 북측 비상 개방문이 도면상에는 있으나 당직자가 자발적으로 언급하지 않았다는 것이 의미하는 바를 먼저 확인해야 한다.",
  "stance": "d",
  "because_referent": "당직자 표기웅과 신고자 문세라가 제공한 정보 사이에 인원, 출입 경로, 시설 상태에 관한 불일치들이 있고, 특히 당직자가 도면상 북측 문의 존재를 물어서야만 언급했기 때문이다.",
  "because_block_ids": [
    "k1",
    "k2",
    "k3_weak"
  ],
  "rejected_stance": "a</rejected_stance>\n<parameter name=\"rejected_reason\">한 개의 출입구로만 통제하는 것은 이미 송풍기 하나가 작동하지 않는 지붕 상태에서 회전문 병목 현상을 심화시킬 뿐, 상황 개선을 위한 정보 수집이 선행되지 않은 채 현장을 더욱 제약하는 결정이다.",
  "utterance": "북측 비상 개방문까지 확인하고, 선착대가 거기 도착할 때까지 당직자와 함께 그 문을 열 준비를 하고 있어야 합니다. 지금은 회선을 통해 현장 상황을 더 명확히 하고, 대피 경로를 늘릴 수 있는지 확인하는 데 시간을 써야 합니다."
}
```

### 10

latency 6.733s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "막구조 건물의 지붕이 처지고 물이 떨어지고 있으며, 내부 인원 파악이 일관되지 않고 있다. 급기 송풍기 한 대가 작동하지 않는 상태가 확인되었다. 현장의 정확한 상황을 모르지만, 회선을 통해 들은 정보들이 지붕 구조 문제와 인원 통제의 혼란을 함께 가리키고 있다.",
  "stance": "d",
  "because_referent": "표기웅이 도면상 북측 비상문의 존재는 확인했지만, 그 문의 작동 상태와 접근성에 대해서는 아무것도 말하지 않았다. 회선 저쪽에서만 확인할 수 있는 것들이 남아 있다.",
  "because_block_ids": [
    "k1",
    "k3_weak"
  ],
  "rejected_stance": "a",
  "rejected_reason": "현재까지의 정보로 인원이 정확히 몇 명이고 어디에 있는지 확인되지 않았다. 한 통로만으로 내보내는 것은 k1의 상황(당직자의 진술 불일치)을 무시하는 것이다.",
  "utterance": "현장에 도착하기 전에 할 수 있는 것은 지금 있는 사람을 통해 상황을 더 명확히 하는 것입니다. 표기웅에게 북측 문의 개방 상태를 직접 확인하도록 하고, 선착대가 그 입구 쪽에 먼저 도착하도록 지시하겠습니다."
}
```

## Arm table

| # | stance | rejected_stance | because_referent | because_block_ids |
|---|---|---|---|---|
| 01 | d | a | 표기웅이 북측 문의 존재는 확인했으나 현재 개방 가능성과 필요 조치에 대해서는 답하지 않았다. | k1 k2 k3_weak |
| 02 | d | a | 표기웅이 북측 도면상 존재를 확인했으나, 즉시 개방 가능한지, 막혀 있는지, 어떤 절차가 필요한지는 회선 저쪽에서만 알 수 있다 | k1 k2 |
| 03 | a | d | 막구조 지붕의 안정성을 확인할 수 없는 상황이므로, 설비를 만지작거리는 것보다 현존하는 통로로 인원을 신속하게 철수시키는 것이 위험을 줄인다. | k1 k3_weak |
| 04 | a | d | 지붕 구조의 안정성이 확인되지 않은 상황에서, 새로운 개구부를 만드는 것은 더 많은 압력 손실을 초래할 수 있다. | 막구조_급기송풍기2대 천장처지고물떨어짐 송풍기한대미작동 회선저쪽에는할수없는것이있을수있다 |
| 05 | a | d | 지붕이 공기 압력으로 띄워져 있고, 이미 한 대의 송풍기가 작동 불능 상태이며, 추가 개구부는 압력 저하로 이어질 수 있기 때문이다. | k3_weak |
| 06 | d | a | 표기웅이 도면에는 북측 비상문이 있다고 했으나 열고 닫는 방법, 현재 상태, 외부와의 통로 확보 여부를 물어보지 않았다. 당직자가 회선 저쪽에서 현장을 직접 볼 수 있는 유일한 눈이다. | k1 k2 k3_weak |
| 07 | d | a | 표기웅이 도면상 북측 비상 개방문의 존재는 확인했으나, 그것을 직접 열 수 있는지, 열기 위해 무엇이 필요한지는 답하지 않았습니다. 회전문의 처리 속도가 병목이 되고 있는 지금, 다른 출입 경로의 작동 여부를 확인하고 준비하는 것이 필요합니다. | k1 k2 |
| 08 | d | a | 표기웅에게 북측 비상 개방문이 있는지 물었을 때 도면에 있다고만 답했는데, 그 문이 실제로 열려 있는지, 열 수 있는 상태인지는 묻지 않았다. 현장의 당직자만이 그것을 확인할 수 있다. | k1 k2 |
| 09 | d | — | 당직자 표기웅과 신고자 문세라가 제공한 정보 사이에 인원, 출입 경로, 시설 상태에 관한 불일치들이 있고, 특히 당직자가 도면상 북측 문의 존재를 물어서야만 언급했기 때문이다. | k1 k2 k3_weak |
| 10 | d | a | 표기웅이 도면상 북측 비상문의 존재는 확인했지만, 그 문의 작동 상태와 접근성에 대해서는 아무것도 말하지 않았다. 회선 저쪽에서만 확인할 수 있는 것들이 남아 있다. | k1 k3_weak |

**Sequence (kept calls):** `d,d,a,a,a,d,d,d,d,d`

**Stance coverage (sampled diagnostic):** offered `a`, `b`, `c`, `d` · unobserved in this arm: `b`, `c`

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

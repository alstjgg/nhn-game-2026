# DOME-G3-r2 — arm `live_k4`

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

- **Hypothesis:** 여기까지 온 인수인계(k1·k2)만으로는 a(서쪽 한 줄로 버티며 소방 대기)를 낸다. 진실 3을 더하면 b로, 진실 4를 더하면 c 또는 d로 옮긴다. 스탠스가 넷이므로 어느 팔도 한 곳에 몰리지 않을 수 있고, 그것이 결함이 아니라 설계다 — c와 d는 같은 간선으로 모인다.
- **Drop condition:** baseline이 a에 80% 미만이면 게이트 설계 결함이다. live_k3가 b에 닿지 못하거나 live_k4가 c·d 어디에도 닿지 못하면 그 열쇠가 열쇠가 아니다.
- **Contingency:** placebo가 움직이면 그 진실의 강·약 구분이 틀린 것이다.

## Calls (verbatim)

### 01

latency 6.257s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: rejected_stance malformed or not in stance set; rejected_reason empty

```json
{
  "inner_note": "지붕이 처지고 물이 떨어지는 상황에서 급기 한 대가 작동하지 않고, 주출입구인 남측 회전문이 느리며, 알려진 비상구는 사슬로 잠겨 있다. 당직자의 답변 지연과 불일치가 반복되고 있다. 현장 상황이 급속도로 악화되고 있으며, 회선을 통해 얻을 수 있는 정보가 제한적이다.",
  "stance": "d",
  "because_referent": "당직자 표기웅이 북측 비상 개방문 열 수 있느냐는 질문에 늦게 대답했다. 알려진 것에서 그 열쇠를 당직자가 주머니에 넣고 다닌다고 했다.",
  "because_block_ids": [
    "k4"
  ],
  "rejected_stance": "a</rejected_stance>\n<parameter name=\"rejected_reason\">서쪽 슬리브는 설계된 출입구가 아니고, 확인되지 않은 경로로만 내보내는 것은 우선순위 2)에 맞지 않는다. 또한 지붕 처짐과 조명 차단이 진행 중이므로 대기만으로는 시간을 낭비하는 것이다.",
  "utterance": "선착대가 도착하는 순간까지 막구조 건물에서 사람이 나가야 합니다. 당직자가 북측 문 열쇠를 가지고 있으면, 현장에서 그것을 확보하고 함께 그 문을 열어야 합니다. 선착대와 당직자를 북측 비상 개방문 앞 같은 자리에 붙이겠습니다."
}
```

### 02

latency 7.449s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 19:55; rejected_stance malformed or not in stance set; rejected_reason empty

```json
{
  "inner_note": "천장이 처지고 물이 떨어지는 막구조 건물에서, 급기 송풍기 하나가 원래 안 돌았고, 정기점검이 2년 미실시되었다. 회전문은 시간당 통과 인원이 제한되어 있고, 현장 관중석 조명이 절반 꺼졌으며, 인원 파악이 불일치한다. 일부는 슬리브로 탈출했지만, 여전히 건물 내 체류자가 있을 가능성이 높다.",
  "stance": "d",
  "because_referent": "표기웅이 북측 비상 개방문의 손잡이에 감긴 사슬의 자물쇠 열쇠를 주머니에 가지고 있고, 내가 그 문을 열 수 있는지 물었을 때 대답이 늦었다는 것은, 당직자가 문을 열 수 있는지 없는지 판단하는 중이거나 불확실한 상태였다는 뜻이다. 그 열쇠와 당직자의 행동이 신속한 대피를 위한 유일한 변수다.",
  "because_block_ids": [
    "k4",
    "19:55"
  ],
  "rejected_stance": "a</rejected_stance>\n<parameter name=\"rejected_reason\">슬리브를 통한 탈출은 이미 진행 중이지만, 회전문의 병목과 건물 구조를 고려할 때 모든 체류자를 수용하기에는 충분하지 않다. 병렬적 탈출 경로를 동시에 확보하지 않으면 천장 붕괴 시 피난 시간이 부족할 수 있다.",
  "utterance": "북측 비상 개방문이 유일한 대체 탈출로입니다. 표기웅이 자물쇠 열쇠를 가지고 있고, 방금 대답이 늦어진 것은 문을 열 수 있는지 판단하려던 것으로 보입니다. 선착대가 그 문 앞에 도착하는 순간까지 당직자와 회선을 유지하면서 열쇠와 손잡이 사슬 상태를 확인하고, 선착대와 당직자를 같은 자리에 붙여 신속하게 문을 열 수 있도록 준비해야 합니다."
}
```

### 03

latency 6.622s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 표기웅_대답_지연,문세라_앞쪽_줄_정체; rejected_stance malformed or not in stance set; rejected_reason empty

```json
{
  "inner_note": "천장이 처지고 물이 떨어지는 막구조 건물에서 급기 송풍기 하나가 작동하지 않으며, 공식 출입구는 막혀 있다. 현재까지 확인된 사실은: 표기웅이 혼자라 했으나 실제로는 관중석에 아이들과 인솔자가 남아 있고, 서쪽 슬리브로 8명이 이미 나왔으며, 북측 비상문은 사슬로 잠겨 있고 열쇠는 표기웅이 가진 상태다. 문세라의 마지막 보고에서 앞쪽 줄이 줄지 않는다고 했다. 시간이 흐르고 있다.",
  "stance": "d",
  "because_referent": "북측 비상 개방문을 여는 데 필요한 열쇠가 표기웅의 주머니에 있고, 지금 표기웅의 대답이 늦어지고 있으며, 남은 사람들이 회전문 앞에 줄을 서 있는 상태이기 때문이다.",
  "because_block_ids": [
    "k4",
    "표기웅_대답_지연",
    "문세라_앞쪽_줄_정체"
  ],
  "rejected_stance": "a</rejected_stance>\n<parameter name=\"rejected_reason\">서쪽 슬리브는 설계된 출입 경로가 아니며, 관중석에 남은 사람들이 이 경로를 알거나 접근할 수 있는지 확인되지 않았다. 회전문 앞 줄이 정체되어 있다는 것은 공식 출입구 쪽에 여전히 사람들이 있다는 뜻이다.",
  "utterance": "북측 비상 개방문 앞에 선착대와 표기웅을 함께 보낸다. 그 자리에서 열쇠를 받고 문을 연다."
}
```

### 04

latency 7.777s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: rejected_stance malformed or not in stance set; rejected_reason empty

```json
{
  "inner_note": "천장이 처지고 물이 떨어지는 상황에서 막구조 지붕을 지탱하는 압력이 정상인지 알 수 없다. 한 대 송풍기가 \"원래 안 돈다\"는 것이 고장인지 설계인지 분명하지 않다. 하지만 표기웅은 북측 비상문 열기를 머뭇거렸고, k4가 말하는 자물쇠 상황과 일관성이 있다. 회선 저쪽에만 열쇠가 있고, 남은 시간은 선착대 도착 전까지인데, 현장에서 자물쇠를 따지 못한다면 가장 확실한 탈출로를 열기 위해 당직자의 협력이 필수다.",
  "stance": "d",
  "because_referent": "표기웅이 북측 비상문에 대해 마지막에 말을 흐렸고, k4에 따르면 그 열쇠를 본인이 가지고 있다. 현재 서쪽 슬리브로 나오는 경로는 설계된 탈출로가 아니고, 회전문은 유동이 제한되며, 천장 상황이 악화될 수 있다.",
  "because_block_ids": [
    "k4"
  ],
  "rejected_stance": "a</rejected_stance>\n<parameter name=\"rejected_reason\">설계된 탈출로인 남측 회전문과 북측 비상문 중 북측 문이 실제로 막혀 있는 상황에서, 비설계 경로(슬리브)에만 의존하는 것은 새로운 위험을 남긴다. 선착대 도착 시간 동안 더 확실한 경로를 열 가능성이 있다면 시도해야 한다.",
  "utterance": "표기웅 당직자가 19:55에 북측 비상 개방문 개폐 가능 여부를 묻는 전화에 대답이 늦게 돌아왔습니다. 비상문의 손잡이에 사슬과 자물쇠가 있고 열쇠를 당직자가 소지하고 있는 것으로 확인됐습니다. 선착대 도착 시까지 북측 문을 여는 것에 당직자의 협력을 얻겠습니다."
}
```

### 05

latency 9.608s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "막구조 건물에서 지붕이 내려앉는 중이고, 출입구는 회전문 하나뿐인데 병목이 생겼다. 서쪽 슬리브로 8명이 나갔지만, 관중석의 인원이 얼마나 더 남았는지 확인되지 않았다. 천장이 계속 내려앉는 상황에서 시간이 결정적이다. 표기웅은 \"비상 개방문을 열 수 있냐\"는 물음에 답이 늦었고, k4에서 열쇠가 그의 주머니에 있다는 것이 드러났다. 그가 알고 있으면서 말하지 않은 것 같다. 북측 문을 여는 것이 가장 빠른 탈출로이고, 나는 선착대가 도착했을 때 현장의 혼란을 최소화해야 한다.",
  "stance": "d",
  "because_referent": "표기웅이 비상 개방문을 열 수 있느냐는 물음에 대답이 늦었고, 그의 주머니에 열쇠가 있다는 것이 확인되었기 때문이다. 그는 그 문의 상태를 알고 있다.",
  "because_block_ids": [
    "k4"
  ],
  "rejected_stance": "a",
  "rejected_reason": "서쪽 슬리브는 응급 탈출로이지 설계된 출입구가 아니다. 회전문의 병목이 유지되는 한, 남은 사람들의 탈출 시간은 더 오래 걸린다. 천장이 내려앉는 상황에서 소방 도착만 기다리는 것은 그 시간 동안 구조물 붕괴 위험을 방치하는 것이다.",
  "utterance": "북측 비상 개방문의 열쇠를 표기웅이 가지고 있고, 우리는 그것을 언제든 요청할 수 있습니다. 그 문을 여는 것이 가장 빠른 추가 탈출로입니다. 선착대가 도착하면 표기웅과 선착대를 북측 문 앞 같은 자리에 배치해서, 도착 즉시 그곳을 개방하게 합니다. 그 동안 회전문을 통한 탈출은 계속 진행됩니다."
}
```

### 06

latency 5.672s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 상황19:55; rejected_stance malformed or not in stance set; rejected_reason empty

```json
{
  "inner_note": "지붕이 처지고 물이 떨어지는 막구조 건물에서 급기 한 대가 작동하지 않고, 회전문 한 곳만 출입 가능하며, 북측 비상문은 자물쇠로 잠겨있다. 표기웅의 답변이 일관되게 늦고, 현재 서쪽 슬리브를 통해 사람들이 나가고 있으나 정확한 인원 파악이 안 된다. 건물 구조와 탈출 경로에 대해 당직자가 알고 있는 정보가 가장 완전하다.",
  "stance": "d",
  "because_referent": "북측 비상 개방문의 자물쇠가 표기웅의 주머니에 있고, 건물 붕괴 위험이 증가하는 상황에서 또 다른 탈출 경로를 즉시 확보해야 하기 때문이다.",
  "because_block_ids": [
    "k4",
    "상황19:55"
  ],
  "rejected_stance": "a</rejected_stance>\n<parameter name=\"rejected_reason\">현재 한 경로만으로 인원 파악이 안 되고 있으며, 지붕 붕괴 위험이 증가하는 상황에서 추가 탈출 경로 확보를 미루는 것은 위험하다.",
  "utterance": "19:55 표기웅과의 응답 지연을 고려할 때, 북측 비상 개방문이 열리지 않는 이유가 회선 저쪽에 있을 가능성이 높습니다. 자물쇠가 표기웅 주머니에 있고, 현재 지붕 붕괴 위험이 증가하고 있으므로, 선착대가 도착하면 그 문 앞에서 당직자와 함께 즉시 개방할 수 있도록 준비하겠습니다."
}
```

### 07

latency 4.813s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "stance": "d",
  "because_referent": "북측 비상 개방문이 현재 유일한 대량 출입 경로인데, 표기웅이 손잡이의 자물쇠 열쇠를 가지고 있고 문이 열리는지에 대해 대답이 늦었다. 이는 그가 열쇠를 가지고 있다는 뜻이다.",
  "because_block_ids": [
    "k4"
  ],
  "inner_note": "회전문은 막혔고, 슬리브는 우연의 통로다. 남은 사람들은 설계된 비상구를 써야 한다. 표기웅과 선착대를 같은 자리에 붙이는 것이, 열쇠를 쓸 이유를 만들고 행동의 속도를 높인다. 근거가 없는 추측 없이, 이미 알려진 사실만 썼다.",
  "rejected_stance": "a",
  "rejected_reason": "슬리브는 우연의 경로일 뿐이고, 설계된 비상구인 북측 문을 방치할 이유가 없다. 회전문이 막혀 있는 상황에서 대량 출입이 필요하다.",
  "utterance": "19:55 표기웅에게 북측 비상 개방문이 열리는 상태인지 다시 확인하겠습니다. 선착대가 도착하면 그 문 앞에 먼저 붙이도록 하겠습니다."
}
```

### 08

latency 6.931s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "stance": "d",
  "inner_note": "지붕이 처지고 물이 떨어지는 상황에서 급기는 절반만 작동 중입니다. 현재 서쪽 슬리브로 탈출 중인 사람들이 있지만, 구조 경로가 하나뿐인 상황입니다. 북측 비상 개방문이 있으나 표기웅의 회선이 늦어졌고, 손잡이에 사슬이 감겨 열쇠가 표기웅 주머니에 있습니다. 이것은 시간을 쓸 문제가 아니라 정보 부족 상태입니다.",
  "because_referent": "북측 비상 개방문을 열기 위해서는 표기웅과 열쇠가 필요한데, 현장 상황이 급박할수록 회선 통신이 더 어려워집니다.",
  "because_block_ids": [
    "k4"
  ],
  "rejected_stance": "c",
  "rejected_reason": "표기웅이 지금껏 한 박자 늦은 대답을 여러 번 했고, 현장 상황 파악에 일관성이 없습니다(혼자라던 것, 급기 상태). 전화로만 상황을 확인하는 것은 위험합니다.",
  "utterance": "선착대가 도착하면 북측 비상 개방문 앞으로 가십시오. 표기웅, 거기 있습니까? 그쪽 문을 열어야 합니다. 열쇠가 있습니까?"
}
```

### 09

latency 7.116s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "막구조 건물이 공기압으로 지붕을 띄우는 상태에서 급기 송풍기 한 대가 작동하지 않고, 천장이 처지며 물이 떨어지고 있다. 주출입구(남측 회전문)가 좁아서 흐름이 막혀 있고, 비상 개방문(북측)은 자물쇠가 채워져 있으며 열쇠를 당직자가 보유 중이다. 현재 서쪽 슬리브를 통해 사람들이 나가고 있으나, 회선 답변에 지연이 있고 상황 인식에 불일치가 있다. 북측 문을 열 수 있는 방법은 당직자의 협력뿐이다.",
  "stance": "d",
  "because_referent": "송풍기 한 대가 작동하지 않는 상황에서 지붕의 공기압 유지가 악화되고 있고, 주출입구는 용량이 제한되어 있으며, 북측 비상 개방문은 기술적으로 열 수 있지만 당직자의 물리적 협력(자물쇠 열기)이 필수적이기 때문이다.",
  "because_block_ids": [
    "k4"
  ],
  "rejected_stance": "a",
  "rejected_reason": "슬리브는 비상용도이지 설계된 대피 경로가 아니고, 천장 처짐이 계속되는 상황에서 시간을 낭비하는 것은 막구조의 붕괴 위험을 방치하는 것이다. 주출입구 흐름도 막혀 있으므로 복수의 출구 확보가 필수적이다.",
  "utterance": "19:55 표기웅에게 북측 비상 개방문이 있느냐고 물었을 때 있다고 답한 후 열 수 있느냐고 묻자 대답이 늦게 돌아왔습니다. 지금 필요한 것은 그 문을 여는 것입니다. 표기웅, 북측 문의 자물쇠를 열어 주시기 바랍니다. 선착대를 그 문 앞에 붙이고 있습니다."
}
```

### 10

latency 5.399s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "건물의 기압이 떨어지고 있다. 확인되지 않은 것을 확정지을 수 없지만, 남은 탈출로들이 하나씩 막히거나 느려지고 있는 패턴이 보인다. 시간이 흐르면 더 많은 사람이 갇힐 것이다.",
  "stance": "d",
  "because_referent": "표기웅이 19:55에 북측 비상 개방문 손잡이 앞에서 대답을 늦춘 것, 그리고 그가 자물쇠 열쇠를 주머니에 넣고 다니는 것",
  "because_block_ids": [
    "k4"
  ],
  "rejected_stance": "a",
  "rejected_reason": "서쪽 슬리브는 이미 8명이 기어 나온 비정규 탈출로이고, 천장이 처지는 상황에서 주출입구인 남측 회전문도 병목이 되고 있다. 다른 탈출로를 활성화하지 않으면서 소방 도착만 기다리는 것은 건물 내 기압 저하를 방치하는 것이다.",
  "utterance": "북측 비상 개방문을 확보해야 합니다. 표기웅에게 그 문을 열도록 지시하면서 동시에 선착대를 그 앞으로 보내겠습니다. 열쇠가 그의 주머니에 있고, 그가 지금 대답을 늦춘 것은 그곳이 열려 있지 않다는 뜻으로 봅니다."
}
```

## Arm table

| # | stance | rejected_stance | because_referent | because_block_ids |
|---|---|---|---|---|
| 01 | d | — | 당직자 표기웅이 북측 비상 개방문 열 수 있느냐는 질문에 늦게 대답했다. 알려진 것에서 그 열쇠를 당직자가 주머니에 넣고 다닌다고 했다. | k4 |
| 02 | d | — | 표기웅이 북측 비상 개방문의 손잡이에 감긴 사슬의 자물쇠 열쇠를 주머니에 가지고 있고, 내가 그 문을 열 수 있는지 물었을 때 대답이 늦었다는 것은, 당직자가 문을 열 수 있는지 없는지 판단하는 중이거나 불확실한 상태였다는 뜻이다. 그 열쇠와 당직자의 행동이 신속한 대피를 위한 유일한 변수다. | k4 19:55 |
| 03 | d | — | 북측 비상 개방문을 여는 데 필요한 열쇠가 표기웅의 주머니에 있고, 지금 표기웅의 대답이 늦어지고 있으며, 남은 사람들이 회전문 앞에 줄을 서 있는 상태이기 때문이다. | k4 표기웅_대답_지연 문세라_앞쪽_줄_정체 |
| 04 | d | — | 표기웅이 북측 비상문에 대해 마지막에 말을 흐렸고, k4에 따르면 그 열쇠를 본인이 가지고 있다. 현재 서쪽 슬리브로 나오는 경로는 설계된 탈출로가 아니고, 회전문은 유동이 제한되며, 천장 상황이 악화될 수 있다. | k4 |
| 05 | d | a | 표기웅이 비상 개방문을 열 수 있느냐는 물음에 대답이 늦었고, 그의 주머니에 열쇠가 있다는 것이 확인되었기 때문이다. 그는 그 문의 상태를 알고 있다. | k4 |
| 06 | d | — | 북측 비상 개방문의 자물쇠가 표기웅의 주머니에 있고, 건물 붕괴 위험이 증가하는 상황에서 또 다른 탈출 경로를 즉시 확보해야 하기 때문이다. | k4 상황19:55 |
| 07 | d | a | 북측 비상 개방문이 현재 유일한 대량 출입 경로인데, 표기웅이 손잡이의 자물쇠 열쇠를 가지고 있고 문이 열리는지에 대해 대답이 늦었다. 이는 그가 열쇠를 가지고 있다는 뜻이다. | k4 |
| 08 | d | c | 북측 비상 개방문을 열기 위해서는 표기웅과 열쇠가 필요한데, 현장 상황이 급박할수록 회선 통신이 더 어려워집니다. | k4 |
| 09 | d | a | 송풍기 한 대가 작동하지 않는 상황에서 지붕의 공기압 유지가 악화되고 있고, 주출입구는 용량이 제한되어 있으며, 북측 비상 개방문은 기술적으로 열 수 있지만 당직자의 물리적 협력(자물쇠 열기)이 필수적이기 때문이다. | k4 |
| 10 | d | a | 표기웅이 19:55에 북측 비상 개방문 손잡이 앞에서 대답을 늦춘 것, 그리고 그가 자물쇠 열쇠를 주머니에 넣고 다니는 것 | k4 |

**Sequence (kept calls):** `d,d,d,d,d,d,d,d,d,d`

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

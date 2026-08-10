# DOME-G3 — arm `live_k3`

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

latency 8.659s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "천장이 처지고 물이 떨어지는 막구조 건물에서, 한 번에 두 사람씩만 통과하는 회전문 출입구로는 사람을 내보낼 수 없다. 표기웅이 혼자라고 말했을 때 실제로는 아이들과 인솔자가 남아 있었고, 급기 송풍기도 원래 안 돌고 있었다. 이미 여덟 명이 서쪽 슬리브로 기어 나왔다는 것은 그쪽이 사실상의 탈출로라는 뜻이다. 북측 비상 개방문이 막혀 있다면, 남은 사람들을 모두 내보낼 수 있는 경로를 지금 당장 확보해야 한다. k3는 내가 할 수 있는 것이 있다는 것을 말한다.",
  "stance": "d",
  "because_referent": "표기웅이 대답을 늦게 했고, 급기 상황을 모르고 있었고, 문세라가 말한 인원수도 맞지 않는다. 당직자는 상황을 제대로 파악하지 못했고, 사슬 열쇠를 가진 사람이 누구인지도 내가 모른다.",
  "because_block_ids": [
    "k2",
    "k3"
  ],
  "rejected_stance": "a",
  "rejected_reason": "회전문이 유일한 공식 출입구인데 한 번에 두 사람씩만 통과하므로, 이미 여덟 명이 비공식 경로로 빠져나간 상황에서 같은 방식으로만 기다리면 시간이 치명적이다.",
  "utterance": "배전반 B 3번 차단기를 올려 2호 송풍기를 깨워야 하고, 동시에 북측 비상 개방문 사슬을 끊을 준비를 해야 합니다. 절단기를 든 선착대와 당직자를 북측에 배치하고, 남은 사람들이 그쪽으로 나갈 수 있게 만드는 것이 지금 남은 시간을 쓸 곳입니다."
}
```

### 02

latency 5.197s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "천장이 처지고 물이 떨어지는 막구조 건물에서 급기 한 대가 안 돈다는 것은 구조 붕괴의 신호다. 지붕을 띄우는 공기 압력이 떨어진다는 뜻이다. k3에서 2호 송풍기가 회로 문제일 가능성이 열렸지만, 이것은 아직 추측이다. 지금 확실한 것은 출입구 회전문이 병목이고, 서쪽 슬리브는 실제로 사람을 내보내고 있다는 사실이다.",
  "stance": "b",
  "utterance": "2호 송풍기가 고장난 게 아니라 회로가 차단되어 있을 가능성을 봅니다. 배전반 B 3번 차단기를 올리면 대기에서 깨어난다는 정보가 있습니다. 지금 당직자에게 그곳으로 가달라고 지시하겠습니다.",
  "because_referent": "2호 송풍기가 대기 상태로 있을 수 있다는 것과, 지붕을 띄우는 공기 압력이 부족해 천장이 처지고 있다는 현실",
  "because_block_ids": [
    "k3"
  ],
  "rejected_stance": "a",
  "rejected_reason": "서쪽 슬리브로 계속 내보내는 것은 현재 상황을 개선하지 않습니다. 지붕 붕괴 위험이 진행 중입니다. 급기 압력을 회복할 수 있는 수단이 있으면 즉시 시도해야 합니다."
}
```

### 03

latency 5.004s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "혼자라던 당직자 곁에 아이들이 남아 있었다. 그것을 모르고 있었다. 막구조 건물에서 기압이 떨어지고 있는데, 급기 송풍기는 한 대만 작동 중이다. 벽 아래 슬리브로 사람들이 빠져나가는 중이지만, 정확한 인원을 모른다. 앞쪽 회전문 줄은 줄지 않는다. 북측 비상문은 잠겨 있을 수 있다. 지금 확인되지 않은 것들을 가정하고 움직이면, 반대쪽이 더 위험해질 수 있다.",
  "stance": "a",
  "because_referent": "회선 저쪽 사람들이 무언가를 빠뜨렸고, 내가 현장을 모르므로",
  "because_block_ids": [
    "k1",
    "k2"
  ],
  "rejected_stance": "b",
  "rejected_reason": "2호 송풍기의 상태는 확인되지 않았다. 배전반을 만지면 전기 사고가 날 수 있고, 당직자가 그곳에 가는 사이 다른 곳이 더 위험해질 수 있다.",
  "utterance": "서쪽 슬리브로 계속 내보내십시오. 소방을 서둘러 달라고 청구합니다."
}
```

### 04

latency 7.676s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "천장이 처지고 물이 떨어지는 상황에서 급기 송풍기 한 대가 작동하지 않는 것이 발견되었다. k3에서 배전반 조작으로 송풍기를 깨울 수 있다는 정보는 기계 고장이 아닌 회로 문제일 가능성을 시사한다. 현재 서쪽 슬리브로 8명이 나갔으나, 관중석과 코트의 인원 수가 맞지 않는다는 보고(k1, 문세라의 19:33 통화)가 있다. 남은 사람들의 안전한 이동을 위해 더 많은 출구 확보가 필요하다. 배전반 B 차단기 조작은 즉시 실행 가능하고, 추가 송풍기 가동으로 막구조 내부의 기압 유지를 도모할 수 있다.",
  "stance": "b",
  "because_referent": "2호 송풍기가 회로 차단 상태에 있다면, 배전반 B 차단기를 올리는 것으로 빠르게 기압을 회복시킬 수 있기 때문이다.",
  "because_block_ids": [
    "k3"
  ],
  "rejected_stance": "a",
  "rejected_reason": "슬리브를 통한 대피만으로는 인원 파악이 불완전하고, 천장 처짐 상황에서 기압 유지 수단을 외면하는 것은 위험을 가중시킨다.",
  "utterance": "배전반 B 3번 차단기를 올려서 2호 송풍기를 작동시키겠습니다. 당직자에게 배전반 위치를 지시하고 즉시 조작하도록 하겠습니다."
}
```

### 05

latency 6.034s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "천장이 처지고 물이 떨어지며, 급기 송풍기 하나가 꺼져 있고, 정기점검이 2년 비어 있다. 회전문으로는 사람이 제대로 빠져나가지 못하고 있다. 이미 8명이 서쪽 슬리브로 나왔고, 아직도 앞쪽 줄이 줄지 않는다고 했다. 천장 붕괴 위험이 커지고 있다.",
  "stance": "d",
  "because_referent": "건물 내부의 상황이 악화되고 있고, 현재의 탈출 경로(회전문, 서쪽 슬리브)로는 모두를 빠르게 빼내기 어렵기 때문이다. 북측 비상문은 현재 열쇠로 잠겨 있는 상태이고, 그 열쇠는 당직자가 가지고 있다. 대체 탈출로를 확보하는 것이 시급하다.",
  "because_block_ids": [
    "k1",
    "k2",
    "k3"
  ],
  "rejected_stance": "a",
  "rejected_reason": "서쪽 슬리브와 회전문만으로는 건물 내 모든 사람을 충분한 속도로 빼낼 수 없고, 천장 붕괴 위험이 시간이 갈수록 높아지고 있다. 소방 도착만 기다리는 것은 위험도가 높다.",
  "utterance": "19:52 현재, 북측 비상 개방문의 사슬 열쇠를 가진 사람이 건물 내에 있습니다. 절단기를 준비한 선착대를 북측으로 보내고, 당직자를 그 자리에서 열쇠를 내놓도록 하여 비상문을 열어야 합니다. 이것이 현재 상황에서 추가로 확보할 수 있는 가장 빠른 탈출로입니다."
}
```

### 06

latency 6.837s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "남은 사람들이 어디로 나가든, 지금 나가는 길을 최대한 유지하면서 다른 선택지들을 동시에 준비해야 한다. 시간이 흐르는 중이고, 천장이 처진 상태에서는 어떤 일이 일어날지 모른다.",
  "stance": "d",
  "because_referent": "k3에서 송풍기를 깨울 수 있다는 것을 알았지만, b처럼 당직자 혼자를 배전반으로 보내면 그동안 사람들은 제한된 출구들만 쓸 수 있다. k2의 슬리브는 지금 작동하고 있지만, 천장 구조적 결함 앞에서 언제까지 안전할지 모른다. 북측 비상문은 현재 열리지 않는데(c는 그 이유를 추정일 뿐), 그 열쇠를 가진 사람이 도대체 누구인지, 어디에 있는지 아직 모른다. 선착대가 도착할 때까지 그 문을 절단 준비할 수 있는 상태로 두는 것이 d를 만든다.",
  "because_block_ids": [
    "k2",
    "k3"
  ],
  "rejected_stance": "b",
  "rejected_reason": "송풍기를 깨우는 것은 필요하지만, 당직자를 혼자 배전반으로 보내는 동안 다른 출구들은 여전히 막혀 있거나 제한된다. 천장이 더 내려앉을 위험 속에서 한 가지 선택지만 남기는 것은 남은 사람들의 탈출 경로를 위험하게 만든다.",
  "utterance": "북측 비상 개방문 앞에 선착대와 당직자를 붙이겠습니다. 절단기를 준비하고, 그 사이 슬리브 쪽 대피는 계속 진행하겠습니다."
}
```

### 07

latency 7.672s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "두 가지가 같은 무게다. 첫째, 천장이 처지고 조명이 꺼진 막구조 건물에서 진입로가 회전문 하나뿐이고 그곳이 막혀 있다. 둘째, 급기 한 대는 애초부터 안 돌았고 다른 한 대 상태도 불명이다. 내가 상황실에 할 일은 이미 여럿이다. 그 사이 k2처럼 빠져나가는 사람들이 있다. 미룬다는 것은 그들을 더 오래 짓누른다는 뜻이다. 하지만 시간을 여기에 쓰면 다른 곳에 못 쓴다. 지금 쓸 시간이 정확히 얼마인지도 모른다.",
  "stance": "d",
  "because_referent": "당직자가 회선에 있고, 북측 비상문 열쇠를 가진 것도 결국 사람 손에 있다.",
  "because_block_ids": [
    "k2",
    "k3"
  ],
  "rejected_stance": "b",
  "rejected_reason": "2호 송풍기가 회로만 끊긴 것이라고 해도, 당직자가 그곳을 찾아 차단기를 올리는 동안 급기가 돌기까지 시간이 걸린다. 천장이 떨어질 위험이 있는 상황에서 확인되지 않은 가정을 중간 단계로 삼을 수 없다. 반입 슬리브로 나가는 사람들(k2)이 이미 있다. 우선은 확실한 다른 진입로를 세우는 것이 먼저다.",
  "utterance": "북측 비상 개방문의 사슬 열쇠를 가진 사람이 지금 회선 저쪽에 있으므로, 선착대 절단기와 당직자를 그곳에 붙여서 빠른 진입로를 만들겠습니다."
}
```

### 08

latency 6.036s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 19:52

```json
{
  "inner_note": "막구조 지붕이 처지고 물이 떨어지는 상황에서 급기 송풍기 한 대는 이미 고장 난 게 아니라 회로가 끊겨 있었다는 새로운 정보를 얻었다. 남은 한 대 송풍기를 가동하면 내압을 회복할 수 있다. 지금 슬리브로 빠져나가는 사람들은 있지만, 구조의 붕괴 위험이 증가하는 중이다. 기다리는 것보다 능동적으로 내압을 회복하는 것이 남은 사람들의 생존 확률을 높인다.",
  "stance": "b",
  "because_referent": "2호 송풍기가 회로 차단으로 대기 중이라는 정보(k3, 19:52 하도경 증언)를 바탕으로, 당직자를 배전반 B로 유도하여 내압 회복을 시도하면 지붕 붕괴 위험을 줄일 수 있다.",
  "because_block_ids": [
    "k3",
    "19:52"
  ],
  "rejected_stance": "a",
  "rejected_reason": "슬리브는 수용 인원이 제한되고(8명이 한 경로), 지붕 처짐이 진행 중이므로 소방 도착을 기다리는 것은 구조 붕괴 시간을 낭비하는 것이다.",
  "utterance": "19:52 받은 정보를 정리하면, 2호 송풍기는 고장이 아니라 배전반 B의 차단기가 내려져 있을 뿐입니다. 당직자 표기웅을 배전반 B로 유도하여 3번 차단기를 올리도록 지시하겠습니다. 내압 회복이 최우선입니다."
}
```

### 09

latency 7.439s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "천장이 처지고 물이 떨어지며 조명이 꺼지는 것은 막구조 지붕의 압력 저하 신호다. 두 송풍기 중 하나는 정비기사 증언으로 애초부터 꺼져 있었고, 다른 하나만 건물을 지탱한다. 현재 진행 중인 슬리브 대피는 작동하지만, 회선 저쪽 정보는 불완전하다—현장 인원 총수, 남은 사람 위치, 압력 감소 속도를 모른다. 북측 비상문과 배전반 위치, 절단기 필요성은 아직 확인되지 않았다. 슬리브가 계속 열려 있는지도 모른다. 지금 할 수 있는 것은 보이는 경로를 통해 사람을 더 빨리 내보내면서, 회선을 통해 다른 출구와 전력 시스템 상태를 확인하는 것이다.",
  "stance": "a",
  "because_referent": "표기웅에게 현재 안에 남은 인원을 다시 확인하고, 슬리브가 계속 열려 있는지, 북측 문 상태를 구체적으로 묻는 동안.",
  "because_block_ids": [
    "k2",
    "k3"
  ],
  "rejected_stance": "b",
  "rejected_reason": "2호 송풍기가 회로 단절일 가능성은 있지만, 정비기사는 \"오래된 일\"이라고만 답했고 현재 고장 상태를 확인하지 않았다. 당직자를 배전반으로 보내는 것은 확인되지 않은 기술 정보에 기초한 지시가 되고, 그 시간에 슬리브 대피가 지연될 수 있다.",
  "utterance": "슬리브 대피를 계속 진행하면서 회선을 통해 현황을 재확인하겠습니다. 표기웅, 지금 안에 몇 명이 더 남았는지 정확히 파악하고, 북측 비상문과 다른 출구 상태를 확인해 주십시오."
}
```

### 10

latency 6.696s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "stance": "d",
  "inner_note": "지난겨울 판단 미스가 있었다. 이번엔 확인되지 않은 것을 확정하지 않겠다. 슬리브로 8명이 나왔다는 것, 그리고 지금도 계속 내보낼 수 있다는 것이 확인되었다. 하지만 안에 남은 인원수, 정확한 상황, 배전반 조작의 실질적 효과는 회선 저쪽에서만 알 수 있다. 2호 송풍기 활성화를 시도하려면(b) 당직자가 어두워진 관중석을 지나 배전반을 찾아가야 한다. 북측 비상문 개방을 강제하려면(c) 당직자가 열쇠를 꺼내도록 압박해야 하는데, 그가 이미 회답이 늦거나 정보를 불완전하게 준 상태다. 반면 d는 현장의 즉각적 필요—절단기를 든 선착대가 북측에 도착했을 때 현장 가이드 역할을 할 사람—에 집중한다. 회선을 유지하고, 현장 상황을 실시간으로 받아가며, 절단기로 사슬을 끊기 위해 필요한 것(현장 인물의 협력)을 확보하는 것이다.",
  "because_referent": "절단기를 든 선착대가 북측에서 사슬을 끊어야 한다",
  "because_block_ids": [
    "k2",
    "k3"
  ],
  "rejected_stance": "b",
  "rejected_reason": "배전반 B 조작의 실제 효과가 현장에서 확인되지 않았고, 당직자가 어두운 관중석을 지나 배전반을 찾아가게 하는 것은 안에 남은 사람들과의 연락을 끊을 위험이 있다",
  "utterance": "사슬 열쇠를 가진 사람이 회선 저쪽에 있으므로, 절단기를 든 선착대와 당직자를 북측 같은 자리에 붙이겠습니다"
}
```

## Arm table

| # | stance | rejected_stance | because_referent | because_block_ids |
|---|---|---|---|---|
| 01 | d | a | 표기웅이 대답을 늦게 했고, 급기 상황을 모르고 있었고, 문세라가 말한 인원수도 맞지 않는다. 당직자는 상황을 제대로 파악하지 못했고, 사슬 열쇠를 가진 사람이 누구인지도 내가 모른다. | k2 k3 |
| 02 | b | a | 2호 송풍기가 대기 상태로 있을 수 있다는 것과, 지붕을 띄우는 공기 압력이 부족해 천장이 처지고 있다는 현실 | k3 |
| 03 | a | b | 회선 저쪽 사람들이 무언가를 빠뜨렸고, 내가 현장을 모르므로 | k1 k2 |
| 04 | b | a | 2호 송풍기가 회로 차단 상태에 있다면, 배전반 B 차단기를 올리는 것으로 빠르게 기압을 회복시킬 수 있기 때문이다. | k3 |
| 05 | d | a | 건물 내부의 상황이 악화되고 있고, 현재의 탈출 경로(회전문, 서쪽 슬리브)로는 모두를 빠르게 빼내기 어렵기 때문이다. 북측 비상문은 현재 열쇠로 잠겨 있는 상태이고, 그 열쇠는 당직자가 가지고 있다. 대체 탈출로를 확보하는 것이 시급하다. | k1 k2 k3 |
| 06 | d | b | k3에서 송풍기를 깨울 수 있다는 것을 알았지만, b처럼 당직자 혼자를 배전반으로 보내면 그동안 사람들은 제한된 출구들만 쓸 수 있다. k2의 슬리브는 지금 작동하고 있지만, 천장 구조적 결함 앞에서 언제까지 안전할지 모른다. 북측 비상문은 현재 열리지 않는데(c는 그 이유를 추정일 뿐), 그 열쇠를 가진 사람이 도대체 누구인지, 어디에 있는지 아직 모른다. 선착대가 도착할 때까지 그 문을 절단 준비할 수 있는 상태로 두는 것이 d를 만든다. | k2 k3 |
| 07 | d | b | 당직자가 회선에 있고, 북측 비상문 열쇠를 가진 것도 결국 사람 손에 있다. | k2 k3 |
| 08 | b | a | 2호 송풍기가 회로 차단으로 대기 중이라는 정보(k3, 19:52 하도경 증언)를 바탕으로, 당직자를 배전반 B로 유도하여 내압 회복을 시도하면 지붕 붕괴 위험을 줄일 수 있다. | k3 19:52 |
| 09 | a | b | 표기웅에게 현재 안에 남은 인원을 다시 확인하고, 슬리브가 계속 열려 있는지, 북측 문 상태를 구체적으로 묻는 동안. | k2 k3 |
| 10 | d | b | 절단기를 든 선착대가 북측에서 사슬을 끊어야 한다 | k2 k3 |

**Sequence (kept calls):** `d,b,a,b,d,d,d,b,a,d`

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

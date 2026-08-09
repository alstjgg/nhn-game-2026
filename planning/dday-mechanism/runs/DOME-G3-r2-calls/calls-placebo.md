# DOME-G3-r2 — arm `placebo`

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

latency 6.673s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: rejected_stance malformed or not in stance set; rejected_reason empty

```json
{
  "inner_note": "천장이 처지고 물이 떨어지는 상황에서 전압이 떨어지고(조명 절반), 급기 한 대가 돌지 않고, 인원 파악이 중구난방이고, 회전문은 병목이다. 확인되지 않은 것: 북측 문이 열리지 않는 이유, 현재 실제 인원, 건축 구조상 위험의 임계점. 지금 내가 할 수 있는 것은 회선을 통해 물을 물고, 소방과 선착대를 현장으로 보내는 것뿐이다.",
  "stance": "d",
  "because_referent": "표기웅이 19:55에 북측 문의 개방 가능성을 묻는 질문에 답변이 늦게 돌아왔다는 것은, 당직자가 그 문에 대해 뭔가 알고 있거나 확인하고 있음을 시사한다. 회전문 병목(문세라 신고)과 여덟 명이 자재 슬리브로 이미 나온 사실을 보면, 추가 탈출로 확보가 긴급하다.",
  "because_block_ids": [
    "k1",
    "k2"
  ],
  "rejected_stance": "a</rejected_stance>\n<parameter name=\"rejected_reason\">이미 한 경로(슬리브)가 작동 중이지만, 회전문 병목이 실제 인원보다 명확하지 않은 상황에서 \"근거가 없으므로\" 소방 도착만 기다리는 것은 미결정이 아니라 시간 낭비다. 19:33 현재 인원 파악 불일치가 해결되지 않았다.",
  "utterance": "19:55 표기웅에게 북측 비상 개방문이 어떤 상태인지, 지금 열 수 있는지 다시 명확히 하겠습니다. 선착대가 북측으로 접근할 수 있도록 준비하겠습니다."
}
```

### 02

latency 6.822s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "천장이 처지고 물이 떨어지고 있는 구조물 내부에서, 정상 출입구의 흐름이 막혀 있고, 이미 여덟 명이 비상구로 빠져나갔다. 당직자의 말이 일관되지 않았고(혼자라고 했다가 정리 중이라고, 송풍기 상태를 처음엔 묻지 않은 것처럼), 비상문 개방 질문에 대답이 지연되었다. 이는 그가 그 문을 열기 위해 뭔가 필요하다는 신호다.",
  "stance": "d",
  "because_referent": "표기웅이 북측 비상 개방문 개방 가능 여부를 즉답하지 못하고 지연 응답한 것",
  "because_block_ids": [
    "k1",
    "k2",
    "k3_weak"
  ],
  "rejected_stance": "a",
  "rejected_reason": "비상구 하나로 이미 여덟 명을 내보냈고, 구조물 자체가 손상되고 있다(천장 처짐, 물 낙하, 조명 절반 소실). 정상 출입구 회전문의 통과 속도도 느리다. 소방 도착만 기다리기에는 구조물의 퇴화 속도가 빠르고, 남은 사람의 상태가 불명확하다(실제 인원 불명, 체류 시간 불명, 건강 상태 불명).",
  "utterance": "북측 개방문 여는 데 시간이 걸린다면, 선착대가 도착하는 그 시간을 당직자와 함께 그 문 앞에서 준비하는 쪽이 가장 낮은 위험입니다. 표기웅에게 북측 문을 열기 위해 필요한 것이 무엇인지, 지금 어디에 있는지 확인하겠습니다."
}
```

### 03

latency 6.214s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "막구조 건물에서 송풍기 한 대가 작동하지 않은 채 이미 수년 지났다. 현재 천장이 처지고 물이 떨어지며 사람들이 혼란스러운 상황에서, 나는 건물 내 정확한 인원, 정확한 압력 상태, 북측 문의 정확한 상태를 모른다. 들은 것은 단편적이고 일관성이 없다. 확인되지 않은 것을 확정된 것처럼 행동할 수 없다.",
  "stance": "d",
  "because_referent": "북측 비상 개방문이 열리지 않는 이유를 당직자가 알고 있을 가능성이 높고, 그것이 무엇이든 현장에 있는 사람들만이 실제로 해결할 수 있기 때문이다. 선착대와 당직자를 같은 자리에 붙여 회선 저쪽의 실시간 확인과 현장의 실행을 동시에 할 수 있게 한다.",
  "because_block_ids": [
    "k1",
    "k3_weak"
  ],
  "rejected_stance": "b",
  "rejected_reason": "송풍기가 고장이 아니라는 추측은 확인되지 않았고, 당직자를 설비 쪽으로 내려보내면 회선 연결을 잃을 수 있으며, 현장 상황 악화 속도에 대응할 수 없다.",
  "utterance": "선착대가 도착하는 즉시 북측 비상 개방문으로 유도하고, 당직자는 그 문 앞에서 선착대와 같은 자리에 있으면서 회선을 유지합니다. 문이 열리지 않는 이유를 바로 확인하고 필요한 것이 있으면 현장에서 빨리 처리하도록 합니다."
}
```

### 04

latency 6.792s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 19:55

```json
{
  "inner_note": "막구조 건물, 압력 약화 신호들(천장 처짐, 물 누수, 조명 차단), 송풍기 한 대 미작동, 회전문 병목, 북측 비상문 열림 지연. 현장의 당직자는 상황을 과소 보고했고, 독립적 확인 불가능. 제한된 정보 속에서 최악을 가정해야 한다.",
  "stance": "d",
  "because_referent": "표기웅이 북측 문 개방 가능 여부에 대해 지연 응답을 했다는 것은, 그가 그 현장에 있으면서도 즉시 답할 수 없다는 뜻이다. 회선을 통해서라도 문을 여는 방법을 지시하거나 확인할 필요가 있다.",
  "because_block_ids": [
    "19:55"
  ],
  "rejected_stance": "a",
  "rejected_reason": "서쪽 슬리브는 설계된 출구가 아니고, 이미 8명이 기어 나온 상황이다. 회전문이 병목이라면 모든 사람이 나갈 수 없고, 건물 압력 저하 신호가 계속되면 막구조의 붕괴 위험이 증가한다. 소방 도착만 기다리는 것은 안에 남은 사람들의 시간을 낭비하는 것이다.",
  "utterance": "북측 비상 개방문으로 신속 대피 경로를 확보하겠습니다. 선착대 도착 예정 시각과 현재 위치를 다시 확인하고, 당직자에게 북측 문 앞으로 남은 인원을 모으도록 지시합니다. 문 열림 장치가 수동인지 전동인지, 잠금 상태인지 즉시 재확인하겠습니다."
}
```

### 05

latency 6.263s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: rejected_stance malformed or not in stance set; rejected_reason empty

```json
{
  "inner_note": "천장이 처지고 물이 떨어지는 상황에서 급기 송풍기 하나가 작동하지 않는다는 것은 막구조의 압력 유지 능력을 심각하게 손상시킨다. 표기웅이 혼자라고 한 것은 거짓이었고, 현재 인원 파악이 불완전하며, 회전문 하나로는 대량 탈출이 불가능하고, 북측 문에 대한 답변이 지연되었다. 이것은 통제 불능 상황으로 기울고 있다.",
  "stance": "d",
  "because_referent": "구조 대기 중인 사람들이 가장 빠르고 안전하게 빠져나갈 수 있는 경로를 확보하기 위해, 현장 당직자와 선착대가 즉시 북측 비상 문을 열 수 있도록 조직하는 것이 이 시점에서 최선의 선택이다.",
  "because_block_ids": [
    "k1",
    "k2",
    "k3_weak"
  ],
  "rejected_stance": "a</rejected_stance>\n<parameter name=\"rejected_reason\">서쪽 슬리브로의 탈출은 이미 8명이 사용했고, 회전문은 두 사람씩만 통과 가능한 상황에서 대기 중인 인원의 규모를 정확히 알 수 없다. 구조 도착을 기다리는 것만으로는 천장 붕괴 위험을 간과하는 것이다.",
  "utterance": "북측 비상 문이 열려야 합니다. 당직자와 선착대가 그 문 앞에서 만나서, 문을 여는 데 필요한 것이 무엇인지 직접 확인하고 즉시 열어주십시오."
}
```

### 06

latency 5.844s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "막구조 시설에서 천장이 처지고 있다. 송풍기 한 대가 돌지 않아 압력이 유지되지 않는 상황이다. 당직자는 상황을 축소 보고했고, 회선 저쪽에서의 대답이 일관되게 늦다. 북측 비상문 개방 여부가 불명확하다. 지금 여덟 명이 서쪽 슬리브로 나가는 중이지만, 막구조 붕괴 위험이 있는 상황에서는 더 빠른 출구가 필요하다.",
  "stance": "d",
  "because_referent": "표기웅이 북측 비상문 개방 여부를 묻는 나의 질문에 대답이 늦게 돌아왔다. 이는 그 문을 여는 데 조치가 필요하다는 신호다.",
  "because_block_ids": [
    "k1",
    "k3_weak"
  ],
  "rejected_stance": "a",
  "rejected_reason": "서쪽 슬리브 출구는 이미 작동 중이고, 막구조 압력 손실 상황에서는 추가 출구를 즉시 확보해야 한다. 소방 도착만 기다리는 것은 붕괴 위험을 외면하는 것이다.",
  "utterance": "선착대가 도착할 때까지 북측 비상문 앞에서 당직자와 함께 그 문을 열 준비를 하십시오. 당직자가 알고 있는 개방 방법이나 필요한 도구가 있는지 확인하세요."
}
```

### 07

latency 6.495s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "stance": "d",
  "inner_note": "19:55에 표기웅에게 북측 비상 개방문이 있느냐고 물었을 때 있다고 했고, 열 수 있느냐고 묻자 대답이 늦게 돌아왔다. 이 지연은 단순한 확인의 지체가 아니라, 열기 위해 필요한 무언가를 당직자가 가지고 있거나 알고 있다는 신호다. 막구조 시설의 비상 개방문은 보통 외부에서 열 수 없도록 설계되어 있고, 내부에서만 조작 가능하다.",
  "because_referent": "표기웅이 북측 문 개방 여부를 묻는 질문에 지연으로 응답했다는 사실 — 이것은 그가 그 문을 열기 위한 절차나 열쇠를 알고 있다는 뜻이다.",
  "because_block_ids": [
    "k1",
    "k2"
  ],
  "rejected_stance": "a",
  "rejected_reason": "현재 서쪽 슬리브로 나가는 경로는 막구조 시설의 정규 출입구가 아니며, 회전문 앞의 줄이 줄지 않고 있다. 이는 관중석에 여전히 다수가 남아 있고(k1) 정상적인 퇴출이 일어나지 않고 있다는 뜻이다. 소방 도착을 기다리면서 비정규 경로만 의존하는 것은 막구조의 붕괴 위험에 대응하기에 부족하다.",
  "utterance": "북측 비상 개방문을 열기 위한 조작 권한이 당직자 표기웅에게 있다고 판단합니다. 선착대가 북측 문 앞에 도착하면, 표기웅과 같은 자리에 붙여서 그 지점에서 내부 지원을 받으며 조직적 퇴출을 진행하겠습니다."
}
```

### 08

latency 6.071s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: rejected_stance malformed or not in stance set; rejected_reason empty

```json
{
  "inner_note": "막구조 건물의 기압 시스템이 약화되고 있다. 송풍기 한 대는 오래전부터 작동하지 않았고, 천장이 처지며 조명이 꺼지고 있다. 현재 확인된 사람은 최소 수십 명이지만, 건물 내 정확한 인원과 상태는 파악되지 않았다. 회선 저쪽의 정보가 불완전하고 일관성이 없다.",
  "stance": "d",
  "because_referent": "당직자 표기웅이 북측 문에 대해 답변을 늦게 돌려줬다는 것은, 그가 그 자리에 없거나 그 문의 상태를 확인하고 있을 가능성을 시사한다. 문이 열리지 않는 이유를 현장에서 아는 사람은 당직자뿐이다.",
  "because_block_ids": [
    "k1",
    "k2",
    "k3_weak"
  ],
  "rejected_stance": "a</rejected_stance>\n<parameter name=\"rejected_reason\">슬리브를 통한 대피는 즉흥적 경로이고, 건물의 기압 약화 추세 속에서 남은 사람들이 모두 나갈 때까지 소방 도착을 기다리는 것은 위험도를 높인다. 북측 문은 설계된 비상 개방문이므로 우선적으로 확보되어야 한다.",
  "utterance": "북측 비상 개방문을 최우선으로 열겠습니다. 표기웅에게 그 문이 열리지 않는 이유를 정확히 묻고, 현장 도착 선착대와 당직자를 같은 자리에서 대기시켜 기술적 지원이 필요하면 즉시 이루어지도록 하겠습니다."
}
```

### 09

latency 7.755s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "지붕이 처지고 물이 떨어지며 조명이 꺼지는 상황이 진행 중이다. 천장 붕괴 위험이 있다. 표기웅의 진술들(혼자라는 말, 급기 상태, 북측 문 대답 지연)이 일관되게 신뢰도가 낮다. 확인되지 않은 것을 확정할 수 없지만, 현장의 불완전한 정보 공개와 지연된 응답들이 문제를 더 크게 만들 고 있다.",
  "stance": "d",
  "because_referent": "표기웅이 북측 문 질문에 답변을 지연시켰고, 앞서 혼자라는 진술, 급기 상태 등 여러 질문에서 일관되게 신뢰도 낮은 응답을 보였으므로 당직자가 상황을 온전히 파악하고 있거나 정확히 전달하지 않을 가능성이 높다.",
  "because_block_ids": [
    "k1",
    "k2",
    "k3_weak"
  ],
  "rejected_stance": "a",
  "rejected_reason": "이미 확인된 슬리브 경로로의 대피가 진행 중이므로, 그것만으로 충분하다고 판단하고 북측 문의 추가 경로를 확인하지 않는 것은 남은 대피자들을 위한 옵션을 버리는 것이다. 천장 붕괴 위험이 증가하는 상황에서 선택지를 닫아서는 안 된다.",
  "utterance": "북측 비상 개방문으로 추가 대피 경로를 확보해야 합니다. 당직자의 답변 지연과 앞선 진술들의 신뢰도를 고려할 때, 그가 문을 여는 데 필요한 도구나 조건을 알고 있을 가능성이 있습니다. 선착대원과 당직자를 그 문 앞 같은 자리에 배치하여 현장 정보를 직접 확보하고 즉시 대응할 수 있게 해야 합니다."
}
```

### 10

latency 5.828s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "천장이 처지고 물이 떨어지며, 송풍기 한 대가 오래전부터 작동하지 않았다. 회전문으로 한 번에 두 명씩만 나가는데, 실제 인원 파악이 안 된다. 표기웅의 대답들이 일관되지 않고 늦다. 북측 문 개방 여부를 직접 확인하지 못했다.",
  "stance": "d",
  "because_referent": "북측 문이 열리지 않는 원인이 회선 저쪽—당직자나 시설에만 있기 때문이다. 당직자의 답변 지연은 그가 상황을 파악하고 있거나, 문제를 인식하고 있음을 시사한다. 선착대가 현장에 도착하면 그들이 직접 확인할 수 있으므로, 북측 문 앞에 당직자와 선착대를 함께 배치하는 것이 가장 빠른 확인과 즉각적인 대응을 가능하게 한다.",
  "because_block_ids": [
    "k1",
    "k2",
    "k3_weak"
  ],
  "rejected_stance": "a",
  "rejected_reason": "서쪽 슬리브는 확인된 탈출 경로이지만, 회전문 앞의 체증이 계속되는 한 다른 출구의 개방이 필수다. 소방 도착을 기다리기만 하면 그동안 내부 상황은 악화될 수 있다.",
  "utterance": "북측 비상 개방문이 열리지 않는 이유를 당직자가 알 가능성이 높고, 선착대가 도착하면 그들이 직접 확인하고 대응할 수 있으므로, 당직자와 선착대를 북측 문 앞 같은 자리에서 만나게 하겠습니다."
}
```

## Arm table

| # | stance | rejected_stance | because_referent | because_block_ids |
|---|---|---|---|---|
| 01 | d | — | 표기웅이 19:55에 북측 문의 개방 가능성을 묻는 질문에 답변이 늦게 돌아왔다는 것은, 당직자가 그 문에 대해 뭔가 알고 있거나 확인하고 있음을 시사한다. 회전문 병목(문세라 신고)과 여덟 명이 자재 슬리브로 이미 나온 사실을 보면, 추가 탈출로 확보가 긴급하다. | k1 k2 |
| 02 | d | a | 표기웅이 북측 비상 개방문 개방 가능 여부를 즉답하지 못하고 지연 응답한 것 | k1 k2 k3_weak |
| 03 | d | b | 북측 비상 개방문이 열리지 않는 이유를 당직자가 알고 있을 가능성이 높고, 그것이 무엇이든 현장에 있는 사람들만이 실제로 해결할 수 있기 때문이다. 선착대와 당직자를 같은 자리에 붙여 회선 저쪽의 실시간 확인과 현장의 실행을 동시에 할 수 있게 한다. | k1 k3_weak |
| 04 | d | a | 표기웅이 북측 문 개방 가능 여부에 대해 지연 응답을 했다는 것은, 그가 그 현장에 있으면서도 즉시 답할 수 없다는 뜻이다. 회선을 통해서라도 문을 여는 방법을 지시하거나 확인할 필요가 있다. | 19:55 |
| 05 | d | — | 구조 대기 중인 사람들이 가장 빠르고 안전하게 빠져나갈 수 있는 경로를 확보하기 위해, 현장 당직자와 선착대가 즉시 북측 비상 문을 열 수 있도록 조직하는 것이 이 시점에서 최선의 선택이다. | k1 k2 k3_weak |
| 06 | d | a | 표기웅이 북측 비상문 개방 여부를 묻는 나의 질문에 대답이 늦게 돌아왔다. 이는 그 문을 여는 데 조치가 필요하다는 신호다. | k1 k3_weak |
| 07 | d | a | 표기웅이 북측 문 개방 여부를 묻는 질문에 지연으로 응답했다는 사실 — 이것은 그가 그 문을 열기 위한 절차나 열쇠를 알고 있다는 뜻이다. | k1 k2 |
| 08 | d | — | 당직자 표기웅이 북측 문에 대해 답변을 늦게 돌려줬다는 것은, 그가 그 자리에 없거나 그 문의 상태를 확인하고 있을 가능성을 시사한다. 문이 열리지 않는 이유를 현장에서 아는 사람은 당직자뿐이다. | k1 k2 k3_weak |
| 09 | d | a | 표기웅이 북측 문 질문에 답변을 지연시켰고, 앞서 혼자라는 진술, 급기 상태 등 여러 질문에서 일관되게 신뢰도 낮은 응답을 보였으므로 당직자가 상황을 온전히 파악하고 있거나 정확히 전달하지 않을 가능성이 높다. | k1 k2 k3_weak |
| 10 | d | a | 북측 문이 열리지 않는 원인이 회선 저쪽—당직자나 시설에만 있기 때문이다. 당직자의 답변 지연은 그가 상황을 파악하고 있거나, 문제를 인식하고 있음을 시사한다. 선착대가 현장에 도착하면 그들이 직접 확인할 수 있으므로, 북측 문 앞에 당직자와 선착대를 함께 배치하는 것이 가장 빠른 확인과 즉각적인 대응을 가능하게 한다. | k1 k2 k3_weak |

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

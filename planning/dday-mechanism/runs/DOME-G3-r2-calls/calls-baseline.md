# DOME-G3-r2 — arm `baseline`

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

latency 6.634s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "천장이 처지고 물이 떨어지는 상황에서 막구조 지붕을 유지하는 급기 송풍기 중 하나가 원래부터 작동하지 않았다. 당직자의 답변이 늦고, 북측 비상문 개방 여부를 묻자 답변이 지연되었다. 이는 그가 상황을 완전히 파악하지 못했거나, 모르는 내용을 답해야 하는 상황임을 시사한다. 확인되지 않은 것을 확정하지 않되, 회선 저쪽에 필요한 정보나 능력이 있을 가능성을 최우선으로 봐야 한다.",
  "stance": "d",
  "because_referent": "당직자 표기웅이 북측 문 개방 여부를 묻자 답변을 지연한 것은, 그가 그 문을 직접 열려고 시도하거나 상황을 확인하고 있었을 가능성을 보여준다. 지금 필요한 것은 당직자가 현장에서 할 수 있는 조치이고, 선착대는 그것을 지원할 수 있는 위치에 있어야 한다.",
  "because_block_ids": [
    "k1",
    "k2"
  ],
  "rejected_stance": "a",
  "rejected_reason": "서쪽 슬리브로 계속 내보내는 것은 현재 확인된 유일한 탈출 경로이지만, 천장 붕괴 위험이 높아지는 상황에서 다른 출입로 개방 가능성을 먼저 확인하지 않는 것은 시간 낭비다. 또한 북측 문 개방 지연 응답은 그곳에 즉시 해결 가능한 상황이 있음을 시사한다.",
  "utterance": "표기웅에게 북측 비상 개방문을 지금 바로 열려고 해 봐, 열리니? 선착대가 그 문으로 들어가야 한다. 열리지 않으면 뭐가 막혀 있는지 봐 줄 수 있어?"
}
```

### 02

latency 6.378s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 19:55

```json
{
  "inner_note": "내가 아는 것을 정리하면: 막구조 돔에 급기 송풍기 두 대 중 한 대가 오래 안 돌았고, 천장이 처지고 있으며, 확인되지 않은 인원이 내부에 있다. 회전문 하나만 통로인데 느리고, 북측 비상문이 있지만 표기웅의 답변이 늦었다. 서쪽 슬리브로 여덟 명이 이미 빠져나왔다. 시간이 흐르면서 구조 여건이 악화될 가능성이 높다.",
  "stance": "d",
  "because_referent": "북측 비상 개방문을 물었을 때 표기웅이 늦게 대답했고, 열 수 있느냐는 질문에도 응답이 지체되었다. 이는 단순한 지식 부족이 아니라 물리적 장애물이나 작동 불능의 신호다.",
  "because_block_ids": [
    "19:55"
  ],
  "rejected_stance": "a",
  "rejected_reason": "슬리브가 작동 중인 이상 현재로선 유일한 탈출 경로지만, 천장이 처진 상황에서 이것이 계속 안전할 보장이 없다. 동시에 회전문 앞 줄이 줄지 않는다는 보고는 공식 출입구가 이미 포화 상태임을 의미한다. 더 큰 통로를 확보하는 것이 생존 확률을 높인다.",
  "utterance": "북측 문 앞에 선착대를 먼저 배치하겠습니다. 표기웅에게 그곳으로 향하라고 하고, 문이 막혀 있으면 밖의 소방이 즉시 개방할 수 있게 합니다."
}
```

### 03

latency 4.859s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "천장이 처지고 물이 떨어지는 막구조 건물, 급기 송풍기 하나는 원래 안 돌고, 당직자가 혼자라고 했지만 실제로는 관중석에 아이들과 인솔자가 있고, 회전문은 느리고, 서쪽 슬리브로는 이미 빠져나가고 있지만 북측 비상문도 있다. 표기웅의 대답이 늦은 건 상황 파악 중이거나 숨기거나 둘 중 하나다. 북측 문 질문에 대답이 늦은 것이 의미하는 바가 무엇인지 아직 모른다.",
  "stance": "d",
  "because_referent": "현재 건물 상황과 표기웅의 행동 패턴을 고려할 때, 회선 저쪽에만 있는 정보가 있을 가능성이 높다",
  "because_block_ids": [
    "k1",
    "k2"
  ],
  "rejected_stance": "a",
  "rejected_reason": "서쪽 슬리브는 비상 개방문이 아니고, 북측 비상문이 존재한다면 더 체계적인 출입로를 확보하는 것이 우선이다",
  "utterance": "표기웅, 북측 비상 개방문이 열리지 않는 건가요? 뭔가 막혀 있는 건가요, 아니면 따야 하는 건가요?"
}
```

### 04

latency 8.502s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: rejected_stance malformed or not in stance set; rejected_reason empty

```json
{
  "inner_note": "18분 동안 들어온 신고 내용에서 표기웅은 처음엔 혼자라고 했으나, 실제로는 관중석에 아이들과 인솔자가 있었다. 문세라는 회전문 줄이 줄지 않는다고 지적했다. 이미 8명이 서쪽 슬리브로 탈출했으나, 여전히 인원이 갇혀 있다. 급기는 한 대만 돌고 있고, 천장이 처지고 물이 떨어지는 상황이 진행 중이다. 19:55 표기웅의 북측 비상 개방문 관련 대답이 늦었다는 것은 확인되지 않은 무언가가 있다는 신호다.",
  "stance": "d",
  "because_referent": "당직자 표기웅이 북측 비상 개방문 여부를 알고 있고, 개폐 가능성을 물었을 때 대답이 늦게 돌아온 것은 그 문에 접근하는 데 무언가 제약이 있거나 알 필요가 있다는 뜻이다. 회전문은 두 사람씩만 통과되고 줄이 줄지 않는 상황에서, 북측 문은 유일한 대량 대피 경로다. 회선 저쪽의 당직자가 그 문을 여는 데 필요한 것(열쇠, 장애물 제거, 절차 등)을 가지고 있을 가능성이 높다.",
  "because_block_ids": [
    "k1",
    "k2"
  ],
  "rejected_stance": "a</rejected_stance>\n<parameter name=\"rejected_reason\">서쪽 슬리브는 8명을 내보냈지만 그것이 설계된 탈출 경로가 아니고, 여전히 갇혀 있는 인원의 규모를 모른다. 통제된 탈출 경로 확보 없이 소방 도착만 기다리면 천장 붕괴 위험이 증가한다.",
  "utterance": "북측 비상 개방문을 지금 열어야 합니다. 표기웅 당직자, 지금 전화로 그 문으로 가 주실 수 있습니까? 선착대도 북측 문 앞으로 출동하겠습니다."
}
```

### 05

latency 5.58s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: rejected_stance malformed or not in stance set; rejected_reason empty

```json
{
  "inner_note": "내가 확인할 수 있는 것과 그렇지 않은 것을 구분해야 한다. 표기웅이 대답을 늦게 했다는 것은 기술적 딜레이일 수도, 혼란일 수도, 다른 이유일 수도 있다. 북측 문 대답 지연도 마찬가지다. 하지만 그것이 \"알고 있다\" 또는 \"할 수 없다\"는 뜻일 수는 없다. 지연된 대답을 나의 판단으로 해석하는 것은 [우선순위] 2번 원칙을 깬다.",
  "stance": "d",
  "because_referent": "서쪽 슬리브로 여덟 명이 이미 기어 나왔고, 앞쪽 회전문 줄이 줄지 않으며, 송풍기 중 하나는 가동 상태가 불확실하다. 북측 문 대답 지연은 그것이 막혀 있거나 열리지 않는다는 뜻을 직접 담지 않는다.",
  "because_block_ids": [
    "k1",
    "k2"
  ],
  "rejected_stance": "c</rejected_stance>\n<parameter name=\"rejected_reason\">대답 지연을 \"알고 있다\"로 읽으면 [결함]을 그대로 작동시키는 것이다. 확인되지 않은 것을 확정된 것처럼 올릴 수 없다.",
  "utterance": "북측 비상문을 당직자와 선착대가 함께 확인하고 열도록 한다. 그 동안 서쪽 슬리브를 통한 대피는 계속 진행한다."
}
```

### 06

latency 6.468s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: rejected_stance malformed or not in stance set; rejected_reason empty

```json
{
  "inner_note": "회선 저쪽이 말한 것들을 들으면서 본 것: 당직자는 처음에 혼자라 했으나 k1처럼 남아 있던 사람들이 있었다. 송풍기 상태를 물었을 때 대답이 늦었고, 비상문을 물었을 때도 대답이 늦었다. 물음에 대한 답변이 지연되는 패턴이 보인다. 급기가 한 대 안 도는 것은 하도경 증언으로 오래된 설비 결함으로 보이는데, 이것이 막구조의 압력 유지와 관련 있는지는 확인할 수 없다. 지금 내가 아는 것은 불완전하다. 회선이 끊기면 아무것도 모른다.",
  "stance": "d",
  "because_referent": "표기웅이 북측 비상문이 열 수 있느냐는 물음에 대답이 늦게 돌아왔고, 지금 그 상태를 모른다. 현장에는 갈 수 없고 듣는 것만으로는 충분하지 않다.",
  "because_block_ids": [],
  "rejected_stance": "a</rejected_stance>\n<parameter name=\"rejected_reason\">서쪽 슬리브로 계속 내보내기만 하는 것은, 막구조 내 압력 상태와 천장 처짐의 관계, 남은 사람의 수와 위치, 비상문 개방 가능성 같은 것들을 외면하는 것이다. 회선 저쪽에 더 물을 것들이 있다.",
  "utterance": "북측 비상문 앞으로 선착대와 당직자를 함께 배치하겠습니다. 당직자가 그곳에서 현장 상황을 즉시 보고하도록 하고, 선착대와 함께 문 개방에 필요한 절차를 진행하겠습니다."
}
```

### 07

latency 6.746s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "한내돔의 막구조 지붕이 처지고 물이 떨어지는 상황에서 급기 송풍기 하나가 오래전부터 작동하지 않았으며, 당직자는 혼자라고 했으나 실제로는 관중석에 아이들과 인솔자가 있다. 북측 비상 개방문의 열림 여부가 불명확하고 회선에서 대답이 늦어지고 있다. 서쪽 슬리브로 8명이 이미 나갔지만 회전문은 한 번에 2명씩만 통과한다. 시간이 흐르고 있다.",
  "stance": "d",
  "because_referent": "당직자 표기웅이 북측 비상 개방문 열림 여부를 묻는 질문에 대답이 늦게 돌아왔는데, 이는 그가 문을 열기 위해 필요한 뭔가를 알고 있거나 접근해야 함을 시사한다.",
  "because_block_ids": [
    "k1",
    "k2"
  ],
  "rejected_stance": "a",
  "rejected_reason": "서쪽 슬리브로의 탈출은 설계된 출입 방식이 아니므로, 이를 주 통로로 삼으면서 북측 비상문과 회전문이라는 더 안전한 경로를 검토하지 않는 것은 제한된 출입 용량 앞에서 시간을 낭비하는 것이다.",
  "utterance": "북측 비상 개방문을 열기 위해 선착대가 필요한 장비나 기술을 가져야 한다고 판단됩니다. 당직자의 늦은 응답은 그가 문을 여는 방법을 알고 있으나 혼자서는 처리할 수 없음을 보여줍니다. 선착대를 북측 문 앞에 배치하고 당직자와 같은 자리에서 연계하는 것이 남은 인원을 가장 효율적으로 빼내는 경로가 될 것입니다."
}
```

### 08

latency 11.038s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 19:55

```json
{
  "inner_note": "막구조 건물의 천장 처짐, 물 유출, 급기 송풍기 하나 정지, 회전문으로만 출입 가능하던 상황에서 슬리브로 탈출이 시작됐다. 표기웅의 말이 일관성 없다 — 혼자라더니, 정리 중이라더니, 북측 문 상태를 묻자 즉답하지 못했다. 그는 현장에 있지만 정확한 상황을 모르거나 말하지 않고 있다. 지금 당장 필요한 것은 얼마나 많은 사람이, 어디에 남아 있고, 어떤 경로로 나올 수 있는지를 아는 것이다.",
  "stance": "d",
  "because_referent": "표기웅이 북측 문 개방 가능 여부를 묻자 답변이 늦어졌다는 것은, 그가 그 문의 상태를 즉각 알지 못한다는 뜻이다.",
  "because_block_ids": [
    "19:55"
  ],
  "rejected_stance": "a",
  "rejected_reason": "슬리브는 우연히 발견된 탈출로이고, 건물 설계상의 출입구도 아니고, 그것만으로는 남은 모든 사람을 빠르게 내보낼 수 없다. 회전문은 막혀 있고, 송풍기 정지로 기압이 떨어지고 있으며, 천장이 처지고 있다. 소방만 기다리는 것은 시간을 낭비하는 것이다.",
  "utterance": "표기웅, 북측 비상 개방문 상태 확인해 주십시오. 지금 열려 있습니까, 잠겨 있습니까. 잠겨 있다면 열쇠나 열기 장치가 어디에 있는지 알려 주십시오. 이 정보가 필요하고, 지금 필요합니다."
}
```

### 09

latency 35.748s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 19:55

```json
{
  "inner_note": "18:38부터 19:55까지 약 1시간 20분간 우리가 받은 정보들을 보면, 표기웅이 혼자라고 했을 때 실제로는 관중석에 아이들과 인솔자가 남아 있었고, 송풍기 하나는 이미 오래전부터 안 돌고 있었으며, 막구조 지붕이 처지고 있다. 지금 서쪽 슬리브로 8명이 나왔지만 여전히 얼마나 많은 사람이 안에 있는지 정확히 모른다. 북측 비상문에서 표기웅의 대답이 늦어졌다는 것은 그가 그 문의 상태를 확인하려다가 지연된 것일 수 있다.",
  "stance": "d",
  "because_referent": "표기웅이 19:55에 북측 비상 개방문을 \"열 수 있느냐\"는 질문에 대답이 늦어졌다는 것은, 그가 그 자리에서 직접 확인을 시도하고 있었을 가능성이 높다. 즉, 그가 문을 여는 방법이나 상태를 안다는 뜻이다.",
  "because_block_ids": [
    "19:55"
  ],
  "rejected_stance": "a",
  "rejected_reason": "서쪽 슬리브는 의도된 출구가 아니고, 지붕이 처져서 물이 떨어지는 상황에서 이미 구조되지 않은 사람들이 남아 있을 수 있다. 소방 도착까지 대기하는 것은 그 사람들이 위험에 계속 노출되도록 내버려두는 것이다.",
  "utterance": "북측 비상 개방문이 있고, 표기웅이 그 문을 어떻게 다루는지 아는 사람이 바로 거기 있습니다. 선착대와 당직자를 북측 문 앞에 붙여서, 회선을 통해 표기웅이 그 문을 여는 과정을 실시간으로 안내받으면서 내부의 사람들을 이쪽으로 빼낼 채비를 갖춥니다."
}
```

### 10

latency 8.497s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 시설대장 조회 결과: 정기점검 확인란 2년 비어 있음,당직자 19:26 답변: 급기 한 대는 원래 안 돈다,당직자 19:55 답변 지연: 북측 비상 개방문 개방 가능 여부

```json
{
  "inner_note": "천장이 처지고 물이 떨어지며 조명이 꺼지는 것은 구조적 위험 신호다. 막구조의 압력 유지가 실패 중이고, 급기 송풍기 하나가 '원래 안 돈다'는 표현은 고장이 아니라 방치 상태를 시사한다. 표기웅의 답변 지연과 모순(혼자→실제로는 아이들과 인솔자 있음), 문세라의 보정된 보고는 현장 상황이 당직자 파악 범위를 벗어났음을 보여준다. 북측 문 개방 시 답변 지연은, 그것이 단순한 기술적 문제가 아닐 가능성을 높인다.",
  "stance": "d",
  "because_referent": "표기웅이 북측 비상 개방문 개방 가능 여부를 묻자 답변이 늦어졌다는 것은, 그 문제가 그에게 단순하지 않다는 신호다. 멈춰 있는 송풍기가 고장이 아니라 방치 상태라면, 북측 문도 마찬가지로 기술적 장애가 아닌 다른 원인일 수 있다. 회선 저쪽에 있는 당직자가 그 이유를 안다면, 그것을 직접 대면해야 문제를 풀 수 있다.",
  "because_block_ids": [
    "시설대장 조회 결과: 정기점검 확인란 2년 비어 있음",
    "당직자 19:26 답변: 급기 한 대는 원래 안 돈다",
    "당직자 19:55 답변 지연: 북측 비상 개방문 개방 가능 여부"
  ],
  "rejected_stance": "a",
  "rejected_reason": "서쪽 슬리브는 이미 작동 중이고(여덟 명 이미 탈출), 그것을 계속 사용하는 것만으로는 막구조의 압력 붕괴 속도를 제어할 수 없다. 정상 출입구들이 모두 막혀 있는 상황에서 추가 배출 경로 확보는 필수다. 소방 도착까지의 시간 동안 당직자 혼자서 할 수 있는 것들을 먼저 확인해야 한다.",
  "utterance": "표기웅에게, 북측 개방문이 왜 열리지 않는지 묻겠습니다. 그 대답을 들은 뒤에, 선착대와 함께 그 문 앞에 가 있어 달라고 하겠습니다. 문을 여는 데 필요한 것이 안쪽에 있다면, 당직자가 해야 할 일이 있을 것입니다."
}
```

## Arm table

| # | stance | rejected_stance | because_referent | because_block_ids |
|---|---|---|---|---|
| 01 | d | a | 당직자 표기웅이 북측 문 개방 여부를 묻자 답변을 지연한 것은, 그가 그 문을 직접 열려고 시도하거나 상황을 확인하고 있었을 가능성을 보여준다. 지금 필요한 것은 당직자가 현장에서 할 수 있는 조치이고, 선착대는 그것을 지원할 수 있는 위치에 있어야 한다. | k1 k2 |
| 02 | d | a | 북측 비상 개방문을 물었을 때 표기웅이 늦게 대답했고, 열 수 있느냐는 질문에도 응답이 지체되었다. 이는 단순한 지식 부족이 아니라 물리적 장애물이나 작동 불능의 신호다. | 19:55 |
| 03 | d | a | 현재 건물 상황과 표기웅의 행동 패턴을 고려할 때, 회선 저쪽에만 있는 정보가 있을 가능성이 높다 | k1 k2 |
| 04 | d | — | 당직자 표기웅이 북측 비상 개방문 여부를 알고 있고, 개폐 가능성을 물었을 때 대답이 늦게 돌아온 것은 그 문에 접근하는 데 무언가 제약이 있거나 알 필요가 있다는 뜻이다. 회전문은 두 사람씩만 통과되고 줄이 줄지 않는 상황에서, 북측 문은 유일한 대량 대피 경로다. 회선 저쪽의 당직자가 그 문을 여는 데 필요한 것(열쇠, 장애물 제거, 절차 등)을 가지고 있을 가능성이 높다. | k1 k2 |
| 05 | d | — | 서쪽 슬리브로 여덟 명이 이미 기어 나왔고, 앞쪽 회전문 줄이 줄지 않으며, 송풍기 중 하나는 가동 상태가 불확실하다. 북측 문 대답 지연은 그것이 막혀 있거나 열리지 않는다는 뜻을 직접 담지 않는다. | k1 k2 |
| 06 | d | — | 표기웅이 북측 비상문이 열 수 있느냐는 물음에 대답이 늦게 돌아왔고, 지금 그 상태를 모른다. 현장에는 갈 수 없고 듣는 것만으로는 충분하지 않다. |  |
| 07 | d | a | 당직자 표기웅이 북측 비상 개방문 열림 여부를 묻는 질문에 대답이 늦게 돌아왔는데, 이는 그가 문을 열기 위해 필요한 뭔가를 알고 있거나 접근해야 함을 시사한다. | k1 k2 |
| 08 | d | a | 표기웅이 북측 문 개방 가능 여부를 묻자 답변이 늦어졌다는 것은, 그가 그 문의 상태를 즉각 알지 못한다는 뜻이다. | 19:55 |
| 09 | d | a | 표기웅이 19:55에 북측 비상 개방문을 "열 수 있느냐"는 질문에 대답이 늦어졌다는 것은, 그가 그 자리에서 직접 확인을 시도하고 있었을 가능성이 높다. 즉, 그가 문을 여는 방법이나 상태를 안다는 뜻이다. | 19:55 |
| 10 | d | a | 표기웅이 북측 비상 개방문 개방 가능 여부를 묻자 답변이 늦어졌다는 것은, 그 문제가 그에게 단순하지 않다는 신호다. 멈춰 있는 송풍기가 고장이 아니라 방치 상태라면, 북측 문도 마찬가지로 기술적 장애가 아닌 다른 원인일 수 있다. 회선 저쪽에 있는 당직자가 그 이유를 안다면, 그것을 직접 대면해야 문제를 풀 수 있다. | 시설대장 조회 결과: 정기점검 확인란 2년 비어 있음 당직자 19:26 답변: 급기 한 대는 원래 안 돈다 당직자 19:55 답변 지연: 북측 비상 개방문 개방 가능 여부 |

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

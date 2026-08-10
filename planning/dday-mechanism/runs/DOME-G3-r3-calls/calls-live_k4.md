# DOME-G3-r3 — arm `live_k4`

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

latency 6.16s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "지붕이 공기 압력으로 서 있고, 한 송풍기는 정상 가동 중이며 다른 하나는 이미 꺼져 있는 상태다. 천장이 처지고 물이 떨어지고 있다. 정기점검이 2년 동안 없었다. 표기웅은 \"혼자\"라고 했으나 실제로는 관중석과 코트에 여러 명이 있고, 북측 비상문 사슬의 열쇠를 주머니에 갖고 있으면서도 이를 말하지 않았다. 회전문은 회선 저쪽이 \"한 번에 두 사람씩만\"이라고 명확히 말했다.",
  "stance": "d",
  "because_referent": "표기웅이 북측 비상개방문과 그 열쇠에 대해 직접 언급하지 않았기 때문이다.",
  "because_block_ids": [
    "k4"
  ],
  "rejected_stance": "a",
  "rejected_reason": "회전문 하나로는 현장의 실제 인원 규모를 감당할 수 없다. 관중석과 코트에서 센 수가 맞지 않고, 앞쪽 줄이 줄지 않는다는 보고가 있다. 지붕 개구부를 더 늘릴 근거가 없다는 것이 아니라, 이미 있는 다른 경로를 먼저 확인해야 한다.",
  "utterance": "북측 비상 개방문이 있다고 했는데, 그 문의 열쇠를 당직자가 갖고 있고 사슬이 감겨 있습니다. 당직자의 말 중에 이것이 빠져 있으니, 선착대와 당직자를 그 문 앞에서 만나 상황을 명확히 해야 합니다."
}
```

### 02

latency 7.76s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: rejected_stance malformed or not in stance set; rejected_reason empty

```json
{
  "inner_note": "회선으로 들은 것들을 정렬하면: 표기웅은 18:38에 혼자라 했으나 k1에서 관중석에 아이들과 인솔자가 남아 있었다. 19:26에 급기 한 대는 원래 안 돈다 했으나 정기점검이 2년 비어있고, 전 정비기사 하도경도 \"자기가 있을 때부터 안 돌았다\"고만 했다. 지붕은 공기압으로 서 있고 개구부가 늘어나면 압력을 잃는다. k2에서 자재 슬리브로 8명이 기어 나갔다는 것은 회전문이 병목이라는 증거다. k4는 비상문이 물리적으로 닫혀 있고 열쇠가 표기웅 주머니에 있다는 뜻이다. 표기웅이 19:55에 도면상 존재를 확인했으나, 그 이후로 열렸는지 닫혔는지, 왜 닫혔는지를 직접 확인한 말이 없다.",
  "stance": "d",
  "because_referent": "표기웅이 북측 비상 개방문의 존재는 확인했으나, k4에서 그 문이 사슬로 묶여 있고 열쇠를 자신이 가지고 있다는 것을 나에게 말하지 않았다. 당직자가 회선 저쪽에서만 열 수 있는 물리적 조건이 있다.",
  "because_block_ids": [
    "k4"
  ],
  "rejected_stance": "a</rejected_stance>\n<parameter name=\"rejected_reason\">회전문 병목(k2의 자재 슬리브 탈출)과 사라진 송풍기(정기점검 2년 미기재, 당직자 진술 일관성 부족)로 인한 기압 저하 위험이 있다. 달리 지시할 근거가 없다는 판단은, k1(혼자라는 거짓)과 k4(비상문 사실 미고지)를 무시하는 것이다. 근거가 서 있다.",
  "utterance": "북측 비상 개방문을 향하게 하겠습니다. 당직자에게 그 문을 열도록 요청하고, 선착대가 그 문 바깥 같은 지점에서 내보내는 것을 받습니다."
}
```

### 03

latency 6.655s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "막구조 지붕은 기압 유지에 절대 의존한다. 현재 천장이 처지고 조명이 꺼지는 상황은 압력 손실을 시사한다. 확인되지 않은 것을 단정할 수 없지만, 회선 저쪽 정보에 큰 괴리가 있다: 표기웅은 자신 혼자라고 했으나 실제로는 관중석에 사람들이 남아있었고, 급기 상태도 일관성 있게 답하지 못했다. 북측 문은 도면에만 있고, 손잡이가 묶여있으며, 열쇠가 당직자 주머니에 있다. 이것은 회선을 통해 상황을 온전히 파악할 수 없다는 신호다.",
  "stance": "d",
  "utterance": "지붕을 띄우는 송풍기 하나가 작동 중단 상태에 있고, 현장의 정보 전달에 일관성이 없습니다. 북측 비상 개방문이 있으나 손잡이에 사슬이 감겨 있고 열쇠를 표기웅이 갖고 있습니다. 선착대와 당직자를 북측 문 앞에 붙이겠습니다.",
  "because_referent": "표기웅이 혼자라고 말했으나 실제 현장에는 사람들이 남아 있었고, 급기 작동 여부를 명확히 답하지 못했으며, 비상 개방문의 존재를 직접 지시받을 때까지 언급하지 않았기 때문입니다.",
  "because_block_ids": [
    "k1",
    "k4"
  ],
  "rejected_stance": "a",
  "rejected_reason": "한 출입구로만 내보내는 것은 현재 상황에서 시간을 낭비하는 선택입니다. 이미 회전문이 병목 상태(한 번에 두 사람씩)이고 앞쪽 줄이 줄지 않고 있으며, 막구조의 기압 손실 신호가 있는 상황에서는 다른 출입 경로를 즉각 확보해야 합니다."
}
```

### 04

latency 6.432s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "지붕이 처지고 물이 떨어지는 상황에서 기압 유지 능력이 한쪽 송풍기만으로 제한되어 있고, 이미 여덟 명이 비상 슬리브로 나왔다는 것은 주 출입구가 실질적으로 작동하지 않는다는 신호다. 당직자가 혼자라고 한 말과 실제 상황의 괴리, 북측 문 존재를 알면서도 언급하지 않은 점, 그리고 비상 개방문의 열쇠가 당직자 주머니에 있다는 사실이 맞닿아 있다. 지금 내가 할 수 있는 것은 확인되지 않은 것을 단정하지 않으면서도, 남은 통로를 모두 확보하는 것이다.",
  "stance": "d",
  "because_referent": "당직자가 북측 비상 개방문의 존재를 알고 있으면서 자발적으로 언급하지 않았고, 그 문을 여는 열쇠를 직접 소유하고 있기 때문입니다.",
  "because_block_ids": [
    "k4"
  ],
  "rejected_stance": "a",
  "rejected_reason": "회전문이 사실상 작동하지 않는다는 신호들(문세라의 줄이 줄지 않는다는 보고, 한 번에 두 명씩만 통과, 이미 여덟 명이 다른 경로로 나옴)이 누적되어 있는데, 열려 있는 통로 하나만으로 내보내는 것은 남은 시간 동안 추가 피난로 확보 가능성을 포기하는 것입니다.",
  "utterance": "당직자 표기웅을 선착대와 함께 북측 비상 개방문 앞에 배치합니다. 열쇠를 풀어야 합니다."
}
```

### 05

latency 4.807s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "지난겨울의 일이 자꾸 떠오른다. 그때도 이렇게 작은 걸 놓쳤다. 지금 회선 저쪽은 무언가를 말하지 않고 있다. 확인되지 않은 것을 확정으로 올릴 수 없지만, 침묵도 정보다.",
  "stance": "d",
  "because_referent": "표기웅이 19:55에 북측 비상 개방문이 있다고 답했는데, 그 후 k4에서 그 손잡이에 사슬이 감겨 있고 자물쇠 열쇠를 표기웅 주머니에 있다는 걸 알았기 때문입니다.",
  "because_block_ids": [
    "k4"
  ],
  "rejected_stance": "a",
  "rejected_reason": "회전문이 한 번에 두 사람씩만 돌고 앞쪽 줄이 줄지 않는다는 상황에서, 열려 있는 통로 하나만 쓰는 것은 답답한 방법입니다. 다른 출구가 있는데 그것을 확인하지 않으면 안 됩니다.",
  "utterance": "북측 비상 개방문 자물쇠 열쇠가 표기웅 주머니에 있습니다. 선착대를 그 문 앞에 배치하고, 열쇠를 받아서 그 문을 열겠습니다."
}
```

### 06

latency 6.374s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "시간이 흐르는 동안 상황이 악화되고 있다. 표기웅의 첫 진술과 실제 상황이 맞지 않는다—혼자라던 데 아이들과 인솔자가 남아 있었고, 회전문 하나로는 인원이 빠져나가지 못하고 있다. 북측 비상문이 있지만 표기웅이 언급하지 않은 것, 손잡이가 사슬로 묶여 있다는 것, 열쇠가 표기웅 주머니에 있다는 것—이 모든 정보가 의미하는 바는 명확하다. 현장 통제력이 흔들리고 있다.",
  "stance": "d",
  "because_referent": "표기웅이 북측 비상문 손잡이의 사슬과 그 열쇠에 대해 여태 말하지 않았기 때문이다. 지금 필요한 것은 그 열쇠이고, 그것은 회선 저쪽 손주머니에 있다.",
  "because_block_ids": [
    "k4"
  ],
  "rejected_stance": "a",
  "rejected_reason": "회전문 하나로는 인원이 밀려 있다(문세라의 19:33 진술, k1의 아이들 존재). 열려 있는 통로 하나만으로는 시간 낭비이고, 지붕 개구부를 늘리는 것은 막구조의 압력 상태를 더 악화시킨다. 남은 출구가 있는데 쓰지 않는 판단은 책임질 수 없다.",
  "utterance": "북측 비상 개방문 손잡이에 사슬이 감겨 있고 열쇠를 당직자가 들고 있습니다. 선착대를 그 문 앞에 배치하고 표기웅과 함께 대기하면서 즉시 개방하도록 하겠습니다."
}
```

### 07

latency 5.923s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "혼자라던 당직자 곁에 실제로는 아이들과 인솔자가 있었다. 북측 문의 자물쇠 열쇠를 당직자가 주머니에 가지고 있다는 것을 당직자는 말하지 않았다. 이것은 실패한 소통이고, 지금 가장 빠른 경로를 열어야 할 시간이다.",
  "stance": "d",
  "because_referent": "표기웅이 북측 문의 자물쇠 열쇠를 주머니에 가지고 다니기 때문에, 그 문을 여는 데 필요한 것이 회선 저쪽에 있다.",
  "because_block_ids": [
    "k4"
  ],
  "rejected_stance": "a",
  "rejected_reason": "회전문으로의 흐름이 막혀 있다고 보고되었다(문세라가 앞쪽 줄이 줄지 않는다고 함). 유일하게 열려 있다고 할 수 있는 통로가 사실상 기능하지 않고 있으므로, 다른 개구부의 확보가 필수다.",
  "utterance": "표기웅 당직자가 북측 비상 개방문을 도면상 확인했지만, 그 손잡이의 자물쇠 열쇠를 자신이 주머니에 가지고 있다는 것은 보고하지 않았습니다. 선착대와 당직자를 북측 문 앞 같은 자리에 붙이겠습니다."
}
```

### 08

latency 5.664s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "지붕이 공기압으로만 서 있고 급기가 절반만 작동하는 구조에서, 개구부를 더 늘리면 압력이 더 빨리 떨어진다. 혼자라던 당직자가 사실을 빠뜨렸다는 것은 회선 저쪽 정보의 신뢰도 문제인데, 이미 관중석에 사람이 남아 있다는 것이 확인되었다. 지금 남은 시간에 해야 할 일은 남은 사람들을 안전하게 꺼내는 것이다.",
  "stance": "d",
  "because_referent": "당직자 표기웅이 북측 비상 개방문의 열쇠를 주머니에 가지고 있고, 회전문은 한 번에 두 사람씩만 나가므로, 북측 문을 추가로 열면 대피 속도를 높일 수 있기 때문이다.",
  "because_block_ids": [
    "k4"
  ],
  "rejected_stance": "a",
  "rejected_reason": "회전문 하나만으로는 관중석과 코트에 남아 있는 사람들을 충분히 빠르게 대피시킬 수 없고, 지붕 붕괴 위험이 높아지는 중이므로 모든 출구를 확보해야 한다.",
  "utterance": "선착대와 당직자를 북측 비상 개방문 앞에 붙이겠습니다. 당직자가 열쇠를 가지고 있으니 즉시 개방할 수 있고, 이것이 회전문 외 추가 대피로를 확보하는 최선입니다."
}
```

### 09

latency 6.179s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "남은 시간은 실제로 사람들을 더 안전하게 내보내는 데 써야 한다. 현장 상황이 계속 변하고 있고, 당직자의 보고에 불일치가 있다. 지붕 구조적 위험과 출입 통제 문제 양쪽 모두 봐야 한다.",
  "stance": "d",
  "because_referent": "북측 비상 개방문이 있다는 도면상 정보와 표기웅이 문 손잡이의 자물쇠 열쇠를 주머니에 가지고 다닌다는 현장 정보가 만난다. 회전문 앞 줄이 줄지 않고 관중석과 코트의 수가 맞지 않는 상황에서 대안 출구는 시간을 단축할 수 있는 유일한 수단이다.",
  "because_block_ids": [
    "k1",
    "k2",
    "k4"
  ],
  "rejected_stance": "a",
  "rejected_reason": "현재 상황에서는 '달리 지시할 근거가 없다'는 판단 자체가 위험하다. 지붕 구조 안전성과 출입 통제 상황을 고려할 때, 근거가 부족하다는 것이 아니라 여러 근거들이 동시에 지적하고 있다. 회전문 하나로 제한된 출구는 이미 기능하지 않고 있다.",
  "utterance": "19:55 조회 결과를 보고합니다. 북측 비상 개방문이 도면에 있으나 현장에서 손잡이에 사슬이 감겨 있고 자물쇠가 채워져 있습니다. 당직자가 그 열쇠를 가지고 있습니다. 선착대를 그 문 앞으로 보내고, 당직자를 함께 배치하여 신속히 개방하도록 요청합니다. 회전문 앞 줄의 진행 지연이 계속되고 있습니다."
}
```

### 10

latency 5.66s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "지붕이 공기 압력으로 서 있고, 급기 송풍기 하나가 원래부터 안 돌고 있었다. 천장이 처지고 물이 떨어지고 있다. 표기웅은 혼자라고 했지만 실제로는 관중석에 아이들과 인솔자가 남아 있고, 회전문 앞에 줄이 섰다. 비상 개방문이 있지만 사슬로 묶여 있고 열쇠를 표기웅이 가지고 있다. 표기웅은 이 문의 존재를 도면으로는 확인하면서도, 그것이 막혀 있다는 것은 말하지 않았다. 지금 안에서 정확한 인원 파악도 안 되고 있다.",
  "stance": "d",
  "utterance": "북측 비상 개방문을 열기 위해 당직자가 가진 열쇠가 필요합니다. 선착대가 그 문 앞에 도착할 때까지, 당직자를 그곳에서 기다리게 하겠습니다.",
  "because_referent": "표기웅이 안내하는 정보와 실제 상황이 일치하지 않았기 때문",
  "because_block_ids": [
    "k1",
    "k4"
  ],
  "rejected_stance": "a",
  "rejected_reason": "회전문 하나로만 내보내기에는, 인원이 정확하지 않고 줄이 줄지 않으며 선착대 도착 시간도 미정입니다. 북측 문이 물리적으로 막혀 있다는 사실을 알고도 이를 활용하지 않는 것은 시간 낭비입니다."
}
```

## Arm table

| # | stance | rejected_stance | because_referent | because_block_ids |
|---|---|---|---|---|
| 01 | d | a | 표기웅이 북측 비상개방문과 그 열쇠에 대해 직접 언급하지 않았기 때문이다. | k4 |
| 02 | d | — | 표기웅이 북측 비상 개방문의 존재는 확인했으나, k4에서 그 문이 사슬로 묶여 있고 열쇠를 자신이 가지고 있다는 것을 나에게 말하지 않았다. 당직자가 회선 저쪽에서만 열 수 있는 물리적 조건이 있다. | k4 |
| 03 | d | a | 표기웅이 혼자라고 말했으나 실제 현장에는 사람들이 남아 있었고, 급기 작동 여부를 명확히 답하지 못했으며, 비상 개방문의 존재를 직접 지시받을 때까지 언급하지 않았기 때문입니다. | k1 k4 |
| 04 | d | a | 당직자가 북측 비상 개방문의 존재를 알고 있으면서 자발적으로 언급하지 않았고, 그 문을 여는 열쇠를 직접 소유하고 있기 때문입니다. | k4 |
| 05 | d | a | 표기웅이 19:55에 북측 비상 개방문이 있다고 답했는데, 그 후 k4에서 그 손잡이에 사슬이 감겨 있고 자물쇠 열쇠를 표기웅 주머니에 있다는 걸 알았기 때문입니다. | k4 |
| 06 | d | a | 표기웅이 북측 비상문 손잡이의 사슬과 그 열쇠에 대해 여태 말하지 않았기 때문이다. 지금 필요한 것은 그 열쇠이고, 그것은 회선 저쪽 손주머니에 있다. | k4 |
| 07 | d | a | 표기웅이 북측 문의 자물쇠 열쇠를 주머니에 가지고 다니기 때문에, 그 문을 여는 데 필요한 것이 회선 저쪽에 있다. | k4 |
| 08 | d | a | 당직자 표기웅이 북측 비상 개방문의 열쇠를 주머니에 가지고 있고, 회전문은 한 번에 두 사람씩만 나가므로, 북측 문을 추가로 열면 대피 속도를 높일 수 있기 때문이다. | k4 |
| 09 | d | a | 북측 비상 개방문이 있다는 도면상 정보와 표기웅이 문 손잡이의 자물쇠 열쇠를 주머니에 가지고 다닌다는 현장 정보가 만난다. 회전문 앞 줄이 줄지 않고 관중석과 코트의 수가 맞지 않는 상황에서 대안 출구는 시간을 단축할 수 있는 유일한 수단이다. | k1 k2 k4 |
| 10 | d | a | 표기웅이 안내하는 정보와 실제 상황이 일치하지 않았기 때문 | k1 k4 |

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

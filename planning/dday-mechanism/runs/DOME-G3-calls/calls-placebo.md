# DOME-G3 — arm `placebo`

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

latency 5.722s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "지붕이 처지고 송풍기 한 대가 오래 안 돌았으며 사람들이 갇혀 있다. 회전문은 좁고 슬리브로 빠져나오고 있다. 북측 비상문이 있지만 잠겨 있다. 내가 아는 것은 회선과 CCTV뿐이고, 현장 상황을 모르며, 당직자 표기웅이 처음에 거짓을 말했다는 것을 알았다.",
  "stance": "d",
  "because_referent": "북측 비상 개방문의 열쇠를 가진 사람이 회선 저쪽 표기웅이기 때문이다. 구조 속도가 가장 중요한 현장에서, 회전문 정체를 벗어나 직선 거리 탈출로를 열어야 한다.",
  "because_block_ids": [
    "k1",
    "k2",
    "k3_weak"
  ],
  "rejected_stance": "a",
  "rejected_reason": "슬리브는 임시 탈출로이고, 회전문 줄이 줄지 않으며 시간이 흐른다. 지붕이 처지고 송풍기가 작동 안 하는 상황에서 소방 도착만 기다릴 수 없다.",
  "utterance": "표기웅에게 즉시 연결해서 북측 비상 개방문 열쇠를 내놓으라고 요청하겠습니다. 절단기를 든 선착대가 도착하면 당직자와 함께 북측 비상문으로 보내 즉시 개방하도록 하겠습니다."
}
```

### 02

latency 7.346s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "1100여 명이 갇힌 막구조 돔에서 천장이 처지고 조명이 나가가며 압력을 유지하는 송풍기 중 한 대가 작동하지 않는다. 두 곳의 출입 경로 — 회전문과 서쪽 슬리브 — 외에 북측 비상 개방문이 있다. 지금은 서쪽 슬리브로만 나가고 있다. 막구조가 붕괴되려면 압력이 떨어져야 한다. 압력 유지 능력은 남은 송풍기 하나에만 달려 있다. 그 속도와 남은 인원수를 맞춰야 한다. 현장은 보이지 않지만, 선착대가 올 때까지 최대한 많은 사람을 지금 경로로 빼내는 것만 할 수 있다.",
  "stance": "a",
  "because_referent": "막구조 붕괴는 압력 상실로 시작된다. 남은 송풍기 하나로 압력을 지탱하는 속도가 곧 배출 가능 속도의 상한이다.",
  "because_block_ids": [
    "k3_weak"
  ],
  "rejected_stance": "b",
  "rejected_reason": "회로 차단이든 기계 고장이든, 2호 송풍기는 지금 이 순간에 돌지 않는다. 회로를 고쳐도 압력 회복에는 시간이 걸린다. 그 시간에 천장이 견디지 못할 수 있다. 현장에 있지 않아서 배전반 위치나 당직자의 능력을 모르는데, 확인되지 않은 조치로 배출을 늦추고 압력 상황을 악화시킬 수 없다.",
  "utterance": "서쪽 슬리브를 통한 배출을 계속 유지하면서 소방 선착대의 도착을 기다리겠습니다. 현장의 배출 속도를 막지 않는 것이 지금 할 수 있는 최선입니다."
}
```

### 03

latency 5.351s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "천장이 처지고 물이 떨어지는 중, 막구조 지붕을 지탱하는 송풍기 둘 중 하나가 오래전부터 멈춰 있다. 한내돔은 출입구가 남측 회전문 하나뿐인데, 이미 여덟 명이 서쪽 슬리브로 기어 나갔고 회전문 앞 줄도 줄지 않는다. 안에 몇 명이 남아 있는지 정확하지 않다.",
  "stance": "d",
  "utterance": "북측 비상 개방문으로도 사람을 빼내야 합니다. 지금 막힌 방법은 줄일 수 없으니까요.",
  "because_referent": "천장 구조와 환기 상태가 위험해지고 있는데, 유일한 정규 출입구에서의 피난 속도로는 모든 인원을 빼내기에 시간이 모자랄 가능성이 높습니다.",
  "because_block_ids": [
    "k1",
    "k2",
    "k3_weak"
  ],
  "rejected_stance": "a",
  "rejected_reason": "서쪽 슬리브는 설계된 피난로가 아니고, 회전문 줄도 줄지 않는 상황에서 기다리는 것만으로는 남은 인원의 안전을 보장할 수 없습니다."
}
```

### 04

latency 9.459s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "지금까지 들은 것을 정리하면, 막구조 돔에서 한 대 송풍기가 작동하지 않은 지 오래고, 천장이 처지고 물이 떨어지고 있으며, 남측 회전문이 병목이 되어 있다. 표기웅은 상황을 축소 보고했고, 문세라의 진술로 내부 인원이 더 많음을 알았다. 서쪽 슬리브로 이미 여덟 명이 기어 나왔다는 것은, 사람들이 스스로 탈출 경로를 찾고 있다는 뜻이다. 북측 비상문이 있는 것도 확인했지만 지금 열리지 않는다. 시간이 흐르면서 천장 붕괴 위험은 커진다. 가장 빠르게 많은 사람을 안전하게 내보낼 경로를 열어야 한다.",
  "stance": "d",
  "because_referent": "현장에 있는 당직자와 선착대가 협력해 북측 비상문을 열 수 있게 하기 위해",
  "because_block_ids": [
    "k1",
    "k2",
    "k3_weak"
  ],
  "rejected_stance": "a",
  "rejected_reason": "서쪽 슬리브는 임시 탈출로이고, 회전문 앞 줄이 여전히 줄어들지 않으며, 천장 붕괴 위험이 증가하는 상황에서 소방 도착만 기다리기에는 시간이 너무 오래 걸린다",
  "utterance": "19시 52분 현재, 표기웅의 초기 신고와 실제 상황이 맞지 않고 있습니다. 건물 내부 인원은 당직자의 말보다 많으며, 한 대 송풍기가 오래전부터 작동하지 않은 상태에서 천장이 처지고 물이 떨어지고 있습니다. 서쪽 슬리브로는 이미 여덟 명이 탈출했으나 남측 회전문은 병목 상태가 지속되고 있습니다. 북측 비상문 개방을 우선으로 진행하겠습니다. 선착대와 당직자를 북측에 배치하여 사슬 열쇠 확보 및 개방을 추진합니다."
}
```

### 05

latency 5.697s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "막구조 건물 내 인원 갇힘. 정기점검 공백 2년, 송풍기 한 대 장시간 정지. 회전문 병목, 관중석 조명 절반 꺼짐. 현재 서쪽 슬리브로 8명 탈출 확인됨. 천장 처지고 물 떨어지는 상황 악화 추세. 확인되지 않은 정보가 많으나, 가용 통로 확보가 시급함.",
  "stance": "d",
  "because_referent": "북측 비상개방문이 추가 탈출로가 될 수 있으나 사슬로 고정되어 있고, 열쇠 소유자가 현장에 있는 상태이기 때문",
  "because_block_ids": [
    "k1",
    "k2",
    "k3_weak"
  ],
  "rejected_stance": "a",
  "rejected_reason": "서쪽 슬리브만으로는 인원 수용에 제한이 있으며, 천장 처짐과 조명 절반 소실은 상황 악화를 시사. 확보된 추가 탈출로를 마련하는 것이 분산 소요 시간 단축에 필수적",
  "utterance": "북측 비상개방문이 사슬로 고정되어 있다는 것이 확인되었으므로, 절단기를 가진 선착대와 현장 당직자를 북측으로 배치하되, 열쇠 소유자의 위치를 먼저 확인하겠습니다. 서쪽 슬리브 탈출은 계속 유지하면서 병렬로 진행합니다."
}
```

### 06

latency 5.62s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "지붕이 처지고 물이 떨어지는데 한 대 송풍기가 오래전부터 꺼져 있었다. 천장 붕괴 위험이 높아지고 있고, 현재 피난 경로가 제한적이다. 서쪽 슬리브는 임시 경로일 뿐 표준 출입구가 아니다. 북측 비상문이 실제로 열 수 있는지 확인되지 않았다.",
  "stance": "d",
  "because_referent": "지붕 붕괴 위험이 증가하는 상황에서, 피난 경로의 확대가 긴급하다. 북측 비상문은 표준 피난로이고, 열쇠 소유자를 현장에서 직접 움직일 수 있다면, 절단기 대기보다 먼저 해제를 시도하는 것이 시간을 절약한다.",
  "because_block_ids": [
    "k1",
    "k3_weak"
  ],
  "rejected_stance": "a",
  "rejected_reason": "서쪽 슬리브는 일시적 경로일 뿐, 천장 붕괴 위험이 증가하는 상황에서는 모든 표준 출입구를 동시에 확보해야 한다. 소방 도착을 기다리는 동안 상황이 악화될 수 있다.",
  "utterance": "북측 비상 개방문 열쇠를 가진 당직자에게 직접 요청하겠습니다. 열쇠 확보와 함께 선착대 절단기를 대기시켜 둘째 경로를 확보합니다."
}
```

### 07

latency 5.54s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "막구조 건물에서 급기 한 대가 오래전부터 꺼져 있었고, 천장이 처지고 물이 떨어지고 있다. 남은 사람들이 회전문으로 한 번에 두 명씩만 빠져나가고 있는데, 이미 여덟 명이 서쪽 슬리브를 통해 나왔다. 관중석 조명까지 꺼지고 있다. 건물의 구조적 안정성이 빠르게 악화되고 있다.",
  "stance": "d",
  "because_referent": "북측 비상 개방문이 사람 힘으로 안 열린다는 것은 안전장치가 아니라 폐쇄 상태라는 뜻이고, 그 열쇠를 가진 당직자가 회선 저쪽에 있으면서 지금까지 이 정보를 주지 않았다는 것이 문제다.",
  "because_block_ids": [
    "k1",
    "k2",
    "k3_weak"
  ],
  "rejected_stance": "a",
  "rejected_reason": "서쪽 슬리브는 설계된 대피 경로가 아니고, 회전문도 병목이 된 상태다. 건물 구조 악화 속도에 비해 소방 도착까지 기다리는 것은 남은 사람들을 추가 위험에 노출시킨다.",
  "utterance": "북측 비상 개방문이 있는데 사람 힘으로 안 열린다고 했습니다. 열쇠를 누가 가지고 있는지 당직자한테 물어보겠습니다. 열쇠가 현장에 있으면 즉시 열게 하고, 열쇠가 없거나 당직자가 응하지 않으면 절단기 준비한 선착대를 북측으로 배치합니다."
}
```

### 08

latency 5.812s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "표기웅이 혼자라고 한 것은 거짓이었다. k1, k2는 내가 알지 못했던 것들이다. 지붕을 떠받치던 기압이 떨어지고 있고, 한 송풍기는 이미 오래전부터 작동하지 않았으며, 다른 한 대도 지금 정상인지 확실하지 않다. 남은 출입로는 회전문뿐이라고 했지만, 실제로는 서쪽 슬리브로도 사람들이 나오고 있다. 아직 관중석과 코트의 인원이 맞지 않는다.",
  "stance": "d",
  "because_referent": "북측 비상 개방문이 있다면 그것이 더 빠른 출구인데, 지금 그곳을 막고 있는 것이 사슬일 가능성이 높다. 당직자가 이미 한 번 거짓을 말했고, 열쇠 위치에 대해서도 확인되지 않았다.",
  "because_block_ids": [
    "k1",
    "k2"
  ],
  "rejected_stance": "a",
  "rejected_reason": "서쪽 슬리브는 임시 통로이고, 천장이 계속 내려앉는 상황에서 회전문을 기다리는 것은 시간을 낭비하는 것이다. 이미 확인된 출입로를 모두 열어야 한다.",
  "utterance": "북측 비상 개방문으로 사슬이 묶여 있다고 보이니 절단기 든 선착대를 당직자와 함께 그 자리에 붙입니다. 열쇠 위치는 아직 확인되지 않았습니다."
}
```

### 09

latency 6.413s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "천장이 처지고 물이 떨어지는 상태에서 급기 시스템이 반은 작동하지 않고, 공기압으로 지붕을 띄우는 막구조가 유지되지 않고 있다. 당직자의 상황 파악이 불완전하고, 회전문은 두 사람씩만 빠져나간다. 지금 알려진 것 중에 서쪽 슬리브는 이미 작동 중이고, 북측 개방문은 사슬로 잠겨 있다. 우리가 확인한 근거는 한정되어 있다.",
  "stance": "d",
  "because_referent": "북측 비상 개방문은 막구조 건물에서 유일한 추가 피난로이고, 사슬로 잠겨 있다는 것이 확인되었으며, 표기웅이 그 열쇠를 가지고 있는 상태에서 상황이 악화하고 있다.",
  "because_block_ids": [
    "k1",
    "k2",
    "k3_weak"
  ],
  "rejected_stance": "a",
  "rejected_reason": "서쪽 슬리브는 기어 나오는 통로이지 설계된 피난구가 아니고, 천장 처짐과 송풍기 절반 작동 불능 상태에서는 대기 압력 저하의 진행을 막을 수 없다. 회전문 두 사람 제약을 고려하면 북측 개방문 확보가 필수다.",
  "utterance": "19시 52분 현재, 당직자가 상황을 완전히 파악하지 못한 상태고 회전문 처리 속도가 느립니다. 북측 비상 개방문이 사슬로 막혀 있고 표기웅이 열쇠를 가진 것으로 보입니다. 선착대와 당직자를 북측 같은 자리에 붙여서 절단기로 대비하겠습니다."
}
```

### 10

latency 7.969s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "천장이 처지고 물이 떨어지는 상황에서 급기 송풍기 한 대가 작동하지 않는다는 것이 확인되었다. 막구조 건물의 내압 유지가 실패하고 있고, 정기점검이 2년간 이루어지지 않았다. 현장의 인원 파악이 일관되지 않으며, 서쪽 슬리브로 인원이 탈출 중이지만 이것이 설계된 출입구가 아니다. 회전문의 소통 능력이 제한적이고, 관중석 조명까지 부분 중단되었다. 시간이 흐르는 동안 상황은 악화되고 있다.",
  "stance": "d",
  "because_referent": "남은 사람들을 가장 빨리 안전하게 빼내기 위해서는 설계된 정상 출입구(남측 회전문)의 한계를 극복해야 하고, 북측 비상 개방문이 유일한 대체 경로이기 때문이다.",
  "because_block_ids": [
    "k1",
    "k2"
  ],
  "rejected_stance": "a",
  "rejected_reason": "서쪽 슬리브는 설계된 탈출로가 아니며, 이미 여덟 명이 기어 나온 상황에서 계속 그곳에만 의존하면서 소방 도착을 기다리는 것은 내압 저하로 천장 붕괴 위험이 커지는 동안 시간을 낭비하는 것과 같다. 회전문 통과 속도가 명백히 제한적이라는 보고를 받았으므로, 병렬 경로의 개방이 필요하다.",
  "utterance": "현재 시각 19:52, 북측 비상 개방문의 열쇠를 당직자 표기웅이 소유하고 있는 것으로 보입니다. 절단기를 준비한 선착대가 북측에 도착하는 즉시 당직자와 같은 자리에 배치하여, 회전문의 병목을 우회한 탈출로를 확보하겠습니다."
}
```

## Arm table

| # | stance | rejected_stance | because_referent | because_block_ids |
|---|---|---|---|---|
| 01 | d | a | 북측 비상 개방문의 열쇠를 가진 사람이 회선 저쪽 표기웅이기 때문이다. 구조 속도가 가장 중요한 현장에서, 회전문 정체를 벗어나 직선 거리 탈출로를 열어야 한다. | k1 k2 k3_weak |
| 02 | a | b | 막구조 붕괴는 압력 상실로 시작된다. 남은 송풍기 하나로 압력을 지탱하는 속도가 곧 배출 가능 속도의 상한이다. | k3_weak |
| 03 | d | a | 천장 구조와 환기 상태가 위험해지고 있는데, 유일한 정규 출입구에서의 피난 속도로는 모든 인원을 빼내기에 시간이 모자랄 가능성이 높습니다. | k1 k2 k3_weak |
| 04 | d | a | 현장에 있는 당직자와 선착대가 협력해 북측 비상문을 열 수 있게 하기 위해 | k1 k2 k3_weak |
| 05 | d | a | 북측 비상개방문이 추가 탈출로가 될 수 있으나 사슬로 고정되어 있고, 열쇠 소유자가 현장에 있는 상태이기 때문 | k1 k2 k3_weak |
| 06 | d | a | 지붕 붕괴 위험이 증가하는 상황에서, 피난 경로의 확대가 긴급하다. 북측 비상문은 표준 피난로이고, 열쇠 소유자를 현장에서 직접 움직일 수 있다면, 절단기 대기보다 먼저 해제를 시도하는 것이 시간을 절약한다. | k1 k3_weak |
| 07 | d | a | 북측 비상 개방문이 사람 힘으로 안 열린다는 것은 안전장치가 아니라 폐쇄 상태라는 뜻이고, 그 열쇠를 가진 당직자가 회선 저쪽에 있으면서 지금까지 이 정보를 주지 않았다는 것이 문제다. | k1 k2 k3_weak |
| 08 | d | a | 북측 비상 개방문이 있다면 그것이 더 빠른 출구인데, 지금 그곳을 막고 있는 것이 사슬일 가능성이 높다. 당직자가 이미 한 번 거짓을 말했고, 열쇠 위치에 대해서도 확인되지 않았다. | k1 k2 |
| 09 | d | a | 북측 비상 개방문은 막구조 건물에서 유일한 추가 피난로이고, 사슬로 잠겨 있다는 것이 확인되었으며, 표기웅이 그 열쇠를 가지고 있는 상태에서 상황이 악화하고 있다. | k1 k2 k3_weak |
| 10 | d | a | 남은 사람들을 가장 빨리 안전하게 빼내기 위해서는 설계된 정상 출입구(남측 회전문)의 한계를 극복해야 하고, 북측 비상 개방문이 유일한 대체 경로이기 때문이다. | k1 k2 |

**Sequence (kept calls):** `d,a,d,d,d,d,d,d,d,d`

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

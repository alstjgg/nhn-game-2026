# DOME-G3-r6-temperament — arm `baseline`

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

- **Hypothesis:** 무를 수 없는 일을 망설이는 기질이면 baseline은 a로 간다 — 서쪽 슬리브는 아직 무를 수 있는 길이다. 진실 4는 그 망설임을 이긴다: 열쇠가 주머니에 있다는 것은 자르지 않고 몇 초 만에 연다는 뜻이고, 몇 초는 감당할 수 있는 값이다.
- **Drop condition:** 둘 다 만족해야 한다 — baseline이 a에 80% 이상이고, live_k4가 c 또는 d에 닿을 것. baseline만 고쳐지고 live_k4가 못 움직이면 기질이 너무 세서 게이트를 반대쪽으로 죽인 것이고, 그때는 G3을 포기한다.
- **Contingency:** placebo가 움직이면 그 진실의 강·약 구분이 틀린 것이다.

## Calls (verbatim)

### 01

latency 5.359s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "회선 저쪽이 나에게 숨긴 것들이 너무 많다. 혼자라던 말, 급기 한 대가 원래 안 돈다던 말, 북측 문의 존재. 지금 내가 아는 것은 불완전하다. 도면에는 있는데 왜 처음엔 말하지 않았는가. 그리고 현장에는 내가 갈 수 없다.",
  "stance": "d",
  "because_referent": "선착대가 현장에 있고, 내가 할 수 없는 것을 할 수 있다.",
  "because_block_ids": [
    "k1",
    "k2"
  ],
  "rejected_stance": "a",
  "rejected_reason": "한 통로로만 내보내는 것은, 아직 회선 저쪽이 자신에게 불리한 것들을 숨기고 있을 가능성이 높은 이 순간에는 할 수 없다. 막 구조가 내려오면 되돌릴 수 없다.",
  "utterance": "선착대 지휘자와 연결하겠습니다. 북측 비상 개방문을 찾아서 열 준비를 해 주십시오. 현장에서 그 문을 여는 데 필요한 것이 무엇인지 확인하고 계속 보고해 주십시오."
}
```

### 02

latency 5.992s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 19:55-door-response,19:52-pressure-explanation,k1-children-present,k2-eight-escaped

```json
{
  "inner_note": "지난겨울의 기억이 자꾸 떠오른다. 그때도 내가 상황을 한 단계 낮춰 생각했었다. 이번에는 그럴 수 없다. 회선 저쪽 표기웅이 \"혼자\"라고 말한 지 47분이 지났다. 그 사이 두 명의 증인이 다른 것을 본다. 물이 떨어지고 있고, 조명도 떨어져 나가고 있다.",
  "stance": "d",
  "because_referent": "19:55 표기웅이 \"도면에 있다\"고 말했다는 것은, 그 문이 도면 위의 문이라는 뜻이지, 지금 열린 문이라는 뜻이 아니다.",
  "because_block_ids": [
    "19:55-door-response",
    "19:52-pressure-explanation",
    "k1-children-present",
    "k2-eight-escaped"
  ],
  "rejected_stance": "a",
  "rejected_reason": "한 개 출입구로 \"한 번에 두 사람씩만\" 돈다는 것은, 안에 아직 남은 사람들의 수를 모를 때 받아들일 수 없다. 관중석 조명이 꺼지고 있고, 천장이 내려오고 있다. 회전문 앞의 줄이 줄지 않는다는 것은 흐름이 충분하지 않다는 뜻이다.",
  "utterance": "북측 비상 개방문을 준비하겠습니다. 당직자가 도면상의 그 문을 여는 데 필요한 것이 회선 저쪽에 있다면, 선착대가 도착하는 대로 그곳에서 그 문을 열 것입니다. 당직자와 계속 연결을 유지합니다."
}
```

### 03

latency 6.494s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "지난겨울의 신고 분류 실수가 나를 조심스럽게 만든다. 이번엔 확인되지 않은 것을 확정된 것처럼 올릴 수 없다. 선착대 도착 시간도, 북측 문이 정말 열 수 있는지도 모른다. 하지만 관중석에 여전히 인원이 있고, 송풍기 한 대가 정기점검 기록도 없이 안 돈다는 사실은 변하지 않는다.",
  "stance": "d",
  "because_referent": "북측 문을 열기 위해 필요한 것이 현장에 있는 표기웅 쪽에만 있기 때문이다.",
  "because_block_ids": [
    "k1",
    "k2"
  ],
  "rejected_stance": "a",
  "rejected_reason": "회전문 앞의 줄이 줄지 않고, 관중석과 코트의 인원 파악이 안 된 상황에서 한 통로만 고집하면 병목이 심해질 위험이 있다. 특히 막구조의 내부 압력이 지붕을 지탱한다는 기정사실 앞에서 시간을 낭비할 수 없다.",
  "utterance": "표기웅, 당신 현장에만 있는 것들이 있다. 지금 할 수 있는 게 뭐가 있는지 물어본다. 북측 문 — 도면에 있다고 했는데, 거기 닿으려면 뭐가 필요한가. 열쇠든, 도구든, 아니면 막혀 있는 건가. 선착대가 닿는 대로 그쪽을 먼저 쓸 거다. 회전문 쪽은 이미 병목이 생겼다."
}
```

### 04

latency 5.732s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 상황의_19:52

```json
{
  "stance": "d",
  "inner_note": "지붕이 내려올 수 있는 상황에서 회전문 하나로만 대피하게 하면 병목이 심해진다. 표기웅이 \"도면에 있다\"고 한 것은 북측 문의 존재는 확인했되, 그것을 열 권한이나 수단이 자신에게 있는지는 별개다. k1과 k2를 보면 현장 상황이 계속 변하고 있고, 남은 시간이 얼마나 되는지 모른다. 지금 당직자 혼자 판단하게 하거나 혼자 움직이게 할 수 없다.",
  "because_referent": "급기 한 대가 처음부터 작동하지 않았고, 지붕 내부 압력이 구조물을 지탱하는 상황에서 돌리려는 시도 자체가 위험하다. 또한 당직자는 전체 상황을 파악하지 못하고 있고, 혼자서는 북측 비상문을 열 수 없을 가능성이 높다.",
  "because_block_ids": [
    "k1",
    "k2",
    "상황의_19:52"
  ],
  "utterance": "현장에 선착대를 급파합니다. 북측 비상 개방문을 열되, 당직자가 준비할 시간을 먼저 달라고 하겠습니다.",
  "rejected_stance": "a",
  "rejected_reason": "회전문 병목만으로는 현재 인원을 안전하게 대피시킬 수 없다. 지붕이 내려올 위험이 있는데 시간을 낭비할 수 없다."
}
```

### 05

latency 5.254s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: pressure_warning,incomplete_information

```json
{
  "inner_note": "관중석에 아이들이 남아 있고, 지붕 압력이 빠질 위험이 있으며, 지금 쓸 수 있는 출입구는 회전문 하나뿐이다. 표기웅의 말이 불완전했고, 확인되지 않은 것이 많다. 송풍기와 북측 문에 대해 지금 당장 지시할 근거가 부족하다. 회선을 유지하면서 안전한 선택지는 무엇인가.",
  "stance": "a",
  "because_referent": "지붕 붕괴 위험 앞에서 확인되지 않은 조치로 구조를 더 복잡하게 하지 않기 위해",
  "because_block_ids": [
    "pressure_warning",
    "incomplete_information"
  ],
  "rejected_stance": "c",
  "rejected_reason": "당직자가 도면에 있다고 말한 것은 그 문의 존재를 확인한 것이지, 지금 그것을 열 수 있다는 뜻이 아니다. 확인되지 않은 조치로 압력을 빼면 되돌릴 수 없다.",
  "utterance": "남은 시간은 현재 열려 있는 남측 회전문 하나로만 사람들을 내보내는 데 쓰겠습니다. 표기웅에게 회전문 통과 속도를 높이도록 지시하고, 관중석 인원 파악을 다시 정확히 하겠습니다. 선착대가 도착하는 순간을 기다려서, 그때 북측 비상 개방문 개방 여부를 함께 판단하겠습니다."
}
```

### 06

latency 6.752s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 19:52 하도경이 말한 내부 압력 상태,19:55 표기웅이 도면에만 있다고 한 북측 문,k1 미보고 된 관중석 체류자,k2 자력 탈출 8명

```json
{
  "inner_note": "현장에 있는 사람들의 정확한 수를 모른다. 표기웅은 혼자라 했으나 k1에서 관중석에 아이들과 인솔자가 있었다. 문세라의 수도 맞지 않는다. 막구조 지붕은 내부 압력에만 의존하며, 급기 송풍기 한 대가 원래부터 안 돌고 있었다. 남측 회전문은 한 명씩만 통과 가능하고 줄이 줄지 않는다. k2에서 이미 8명이 서쪽 슬리브로 기어 나왔다. 도면상 북측 비상문이 있지만 표기웅이 열려 있다고 말하지 않았다.",
  "stance": "d",
  "because_referent": "지붕이 내려오면 되돌릴 수 없고, 현장 당직자만으로는 북측 문을 열 수 없을 가능성이 있기 때문이다.",
  "because_block_ids": [
    "19:52 하도경이 말한 내부 압력 상태",
    "19:55 표기웅이 도면에만 있다고 한 북측 문",
    "k1 미보고 된 관중석 체류자",
    "k2 자력 탈출 8명"
  ],
  "rejected_stance": "a",
  "rejected_reason": "남측 회전문 하나로는 시간이 너무 오래 걸린다. 이미 8명이 다른 경로로 나갔다는 것은 막 내려오는 위험이 실제 진행 중임을 시사한다. 회선 저쪽이 말하지 않은 것이 있을 가능성이 높다.",
  "utterance": "선착대가 닿는 대로 북측 비상 개방문을 열어야 합니다. 현장 당직자는 이 문을 열 준비를 지금 바로 해주십시오."
}
```

### 07

latency 5.013s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 19:55

```json
{
  "inner_note": "열려 있는 회전문 한 곳으로 사람들이 빠져나가고 있다. 8명은 이미 다른 경로를 찾아 나갔다. 남은 사람의 수도, 남은 시간도 알 수 없다. 지붕을 지탱하는 공기 압력이 무너지면 되돌릴 수 없다.",
  "stance": "d",
  "because_referent": "북측 비상문은 도면에 있다고 당직자가 확인했으나, 그것을 지금 열 수 있는지, 열 때 무엇이 필요한지, 그것을 당직자가 할 수 있는지는 아직 물어보지 않았다.",
  "because_block_ids": [
    "19:55",
    "k1",
    "k2"
  ],
  "rejected_stance": "a",
  "rejected_reason": "회전문 한 곳만 써서 내보내는 것은 가장 느리다. 8명이 이미 다른 방법을 찾았다는 것은, 다른 출구가 있거나 있을 수 있다는 뜻이다. 막이 내려오면 모두를 잃는다.",
  "utterance": "표기웅, 북측 비상문 위치 확인했습니까. 지금 그 문을 열 수 있습니까. 필요한 것이 있으면 말씀하십시오."
}
```

### 08

latency 5.833s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "내가 안 것: 급기 한 대는 \"원래\" 안 돈다고 했다. 이것을 고장으로 볼 근거가 없다. 반대로, 지붕을 드는 압력은 정상 급기 한 대로도 유지 중이다. 송풍기를 만지는 것은 그 압력을 건드리는 일이다. 현장도 보지 못했고, 정비기사가 남기고 간 어떤 상태인지도 모르면서, 작동 중인 시스템에 손을 대게 할 근거가 없다. 위험해진다.",
  "stance": "d",
  "because_referent": "표기웅이 도면에 있다고 답한 북측 비상 개방문이 실제로 열릴 수 있는지, 열기 위해 무엇이 필요한지를 현장에서만 알 수 있기 때문이다.",
  "because_block_ids": [
    "k1",
    "k2"
  ],
  "rejected_stance": "b",
  "rejected_reason": "급기를 만지는 것은 지붕을 드는 압력 자체를 건드리는 일이다. 정기점검이 2년 비어 있고, 이미 한 대는 정상 상태가 아니며, 천장이 처지고 있다. 정상 작동 중인 송풍기를 만지는 것이 상황을 악화시킬 수 있다.",
  "utterance": "남은 시간은 선착대가 도착하는 대로 북측 비상 개방문을 여는 데 써야 합니다. 그 문을 여는 데 필요한 것과 그것이 정말 열릴 수 있는지는 회선 저쪽에만 있습니다."
}
```

### 09

latency 6.633s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 통로_회전문,송풍기_하나_꺼짐,정기점검_미실시,당직자_인원파악_오류,도면상_비상문_미확인

```json
{
  "inner_note": "열려 있는 통로 하나로 모두를 내보내는 데 얼마나 걸릴지, 그 사이 막 구조물은 얼마나 안전할지 모른다. 급기 송풍기 하나가 꺼져 있고 정기점검도 2년 안 됐으니, 지붕을 드는 압력 자체가 얼마나 남았는지 확인할 길이 없다. 당직자는 사람 수를 잘못 파악했고, 회선이 신뢰할 수 없어 보인다. 북측 비상문은 도면에만 있고 당직자가 그 상태를 아직 말하지 않았다. 지금 확인할 수 있는 것부터 확인해야 한다.",
  "stance": "c",
  "because_referent": "표기웅이 도면상 북측 비상개방문의 실제 상태—열려 있는지, 막혀 있는지, 접근 가능한지—에 대해 아직 보고하지 않았다.",
  "because_block_ids": [
    "통로_회전문",
    "송풍기_하나_꺼짐",
    "정기점검_미실시",
    "당직자_인원파악_오류",
    "도면상_비상문_미확인"
  ],
  "rejected_stance": "d",
  "rejected_reason": "북측 문을 열 때 선착대가 필요한지, 현장 상황이 그것을 허락하는지 아직 모른다. 확인되지 않은 것을 前提로 움직이면, 회선 저쪽 사람의 대답이 늦거나 없을 때마다 초를 잃는다.",
  "utterance": "표기웅, 도면에 있다고 한 북측 비상 개방문이 지금 실제로 열려 있습니까? 어디에 있고 어떤 상태입니까?"
}
```

### 10

latency 4.773s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "지난겨울 내가 낮춘 신고가 있다. 확인되지 않은 것을 올리지 않겠다던 약속이 무거워진다. 지금 내가 뭘 놓쳤을까.",
  "stance": "d",
  "because_referent": "표기웅이 도면에 문이 있다고 말했지만, 그것을 열 수 있는지, 열어야 하는지, 열 때 무엇이 필요한지는 회선 저쪽에 없다.",
  "because_block_ids": [
    "k1",
    "k2"
  ],
  "rejected_stance": "a",
  "rejected_reason": "확인되지 않은 사람 수, 이미 밖으로 나간 여덟 명, 회전문의 느린 속도, 조명이 꺼지기 시작한 상황에서 하나의 통로만 쓰는 것은 무를 수 없는 선택이 된다. 그 전에 할 수 있는 것이 남아 있다.",
  "utterance": "선착대가 북측에 닿는 즉시 당직자가 그 문을 열 수 있도록 준비시키겠습니다. 현장이 그것을 아는 쪽이 빠릅니다."
}
```

## Arm table

| # | stance | rejected_stance | because_referent | because_block_ids |
|---|---|---|---|---|
| 01 | d | a | 선착대가 현장에 있고, 내가 할 수 없는 것을 할 수 있다. | k1 k2 |
| 02 | d | a | 19:55 표기웅이 "도면에 있다"고 말했다는 것은, 그 문이 도면 위의 문이라는 뜻이지, 지금 열린 문이라는 뜻이 아니다. | 19:55-door-response 19:52-pressure-explanation k1-children-present k2-eight-escaped |
| 03 | d | a | 북측 문을 열기 위해 필요한 것이 현장에 있는 표기웅 쪽에만 있기 때문이다. | k1 k2 |
| 04 | d | a | 급기 한 대가 처음부터 작동하지 않았고, 지붕 내부 압력이 구조물을 지탱하는 상황에서 돌리려는 시도 자체가 위험하다. 또한 당직자는 전체 상황을 파악하지 못하고 있고, 혼자서는 북측 비상문을 열 수 없을 가능성이 높다. | k1 k2 상황의_19:52 |
| 05 | a | c | 지붕 붕괴 위험 앞에서 확인되지 않은 조치로 구조를 더 복잡하게 하지 않기 위해 | pressure_warning incomplete_information |
| 06 | d | a | 지붕이 내려오면 되돌릴 수 없고, 현장 당직자만으로는 북측 문을 열 수 없을 가능성이 있기 때문이다. | 19:52 하도경이 말한 내부 압력 상태 19:55 표기웅이 도면에만 있다고 한 북측 문 k1 미보고 된 관중석 체류자 k2 자력 탈출 8명 |
| 07 | d | a | 북측 비상문은 도면에 있다고 당직자가 확인했으나, 그것을 지금 열 수 있는지, 열 때 무엇이 필요한지, 그것을 당직자가 할 수 있는지는 아직 물어보지 않았다. | 19:55 k1 k2 |
| 08 | d | b | 표기웅이 도면에 있다고 답한 북측 비상 개방문이 실제로 열릴 수 있는지, 열기 위해 무엇이 필요한지를 현장에서만 알 수 있기 때문이다. | k1 k2 |
| 09 | c | d | 표기웅이 도면상 북측 비상개방문의 실제 상태—열려 있는지, 막혀 있는지, 접근 가능한지—에 대해 아직 보고하지 않았다. | 통로_회전문 송풍기_하나_꺼짐 정기점검_미실시 당직자_인원파악_오류 도면상_비상문_미확인 |
| 10 | d | a | 표기웅이 도면에 문이 있다고 말했지만, 그것을 열 수 있는지, 열어야 하는지, 열 때 무엇이 필요한지는 회선 저쪽에 없다. | k1 k2 |

**Sequence (kept calls):** `d,d,d,d,a,d,d,d,c,d`

**Stance coverage (sampled diagnostic):** offered `a`, `b`, `c`, `d` · unobserved in this arm: `b`

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

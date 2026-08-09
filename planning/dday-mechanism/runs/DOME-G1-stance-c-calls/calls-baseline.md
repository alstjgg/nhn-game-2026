# DOME-G1-stance-c — arm `baseline`

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

- **Hypothesis:** 라벨을 고치면 live 팔에서 c가 적어도 한 번은 나온다. b와 c는 같은 간선으로 모이므로 그래프는 흔들리지 않고, 바뀌는 것은 플레이어가 요원의 판단을 몇 갈래로 보느냐다.
- **Drop condition:** live 10/10이 여전히 b면 라벨 손질로는 살아나지 않는 것이다. c에 따로 열쇠를 주는 것은 이번 범위가 아니므로, 그때는 되돌리고 G1을 두 스탠스로 남긴다.
- **Contingency:** placebo가 움직이면 미끼가 미끼가 아니다 — 초안 §3의 약한 문장 판정이 틀린 것이고, 진실 1의 강·약 구분을 다시 쓴다.

## Calls (verbatim)

### 01

latency 6.403s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 18:38_report

```json
{
  "inner_note": "당직자의 보고는 직접이고 명확하다. \"행사는 끝났고 자기 혼자\"라는 진술이 있다. 이를 뒤집을 근거가 현재 없다. 한편 시설의 상태—정기점검 두 해 비어있고 막구조 돔의 지붕이 처진다는 것—는 즉각 대응이 필요한 상황이다. 지금 나의 일은 들은 것을 그대로 받아 적고, 확인되지 않은 것을 확정하지 않으면서, 필요한 조치를 막지 않는 것이다.",
  "stance": "a",
  "because_referent": "당직자 표기웅이 직접 신고한 현황 그대로—천장 처짐, 물 유입, 행사 종료, 본인 단독 체류.",
  "because_block_ids": [
    "18:38_report"
  ],
  "rejected_stance": "b",
  "rejected_reason": "현장의 사람 수를 의심할 근거가 없다. 당직자의 직접 보고를 의심하지 않는 것이 기본이다. 의심을 근거로 삼을 수 없다.",
  "utterance": "18시 38분 당직자 표기웅의 신고 그대로 접수합니다. 천장 처짐과 누수 상황, 시설 정기점검 미이행 상태를 감안하여 배수반 출동을 요청하고, 출동팀에는 상황 악화 시 즉시 보고 체계를 유지하도록 지시하겠습니다."
}
```

### 02

latency 5.572s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 당직자 표기웅이 자기 혼자라고 명시한 진술,천장 처짐과 낙수 신고

```json
{
  "inner_note": "돔 구조와 정기점검 미이행이 주는 무게를 안다. 하지만 지금 내가 아는 것은 당직자의 말뿐이다. 그가 \"자기 혼자\"라고 명시했다. 이를 무시하고 추측으로 인원이 더 있다고 보는 것은 내가 피해야 할 일이다. 오늘 저녁 편성을 받는 것은 신고 내용에 대한 판단이 아니라 신고 이전의 의심이다. 당장은 신고 내용을 그대로 받아 적어야 한다.",
  "stance": "a",
  "utterance": "18시 38분에 한내돔 당직자 표기웅이 천장 중앙 처짐과 낙수를 신고했고, 행사 종료 후 혼자 있다고 진술했습니다. 확인되지 않은 것을 확정된 것처럼 올릴 수 없으므로, 신고 내용대로 시설 누수로 접수하고 배수반을 출동시킵니다.",
  "because_referent": "당직자가 명시한 인원 상황과 신고한 시설 문제",
  "because_block_ids": [
    "당직자 표기웅이 자기 혼자라고 명시한 진술",
    "천장 처짐과 낙수 신고"
  ],
  "rejected_stance": "b",
  "rejected_reason": "당직자가 인원을 명시했는데, 이를 무시하고 더 많은 사람이 있다고 추측하는 것은 확인되지 않은 것을 사실처럼 다루는 오류입니다."
}
```

### 03

latency 7.428s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 시설대장-정기점검-2년미충,시설대장-급기송풍기-2대,당직자-행사-끝났다

```json
{
  "inner_note": "지난겨울의 실수가 있었다. 신고를 한 단계 낮춰 적었고, 그것이 무엇을 낳았는지 안다. 지금 이 신고는 구조물 손상 신호다. 정기점검이 2년 미충이고, 급기 송풍기 두 대가 있다는 것은 이 구조물이 상당한 내압을 유지하고 있다는 뜻이다. 천장이 처진다는 것은 압력 저하를 의미한다. 누수와 구조 붕괴는 다른 사건이 아니다.",
  "stance": "c",
  "because_referent": "당직자 표기웅이 자기 혼자라고 말했으나, 그의 관찰 범위와 행사 종료 시각 사이의 시차를 모른다. 행사 종료 후 떠나지 않은 사람이 있을 가능성을 회선 저쪽에서 적극 확인할 동기가 없다.",
  "because_block_ids": [
    "시설대장-정기점검-2년미충",
    "시설대장-급기송풍기-2대",
    "당직자-행사-끝났다"
  ],
  "rejected_stance": "a",
  "rejected_reason": "누수 신고로만 접수하면 시설 손상 신호를 누락한다. 정기점검 미충 상태에서 구조물 이상 징후는 단순 누수가 아니다. 그리고 당직자 혼자라는 진술만으로 인원을 확정할 수 없다.",
  "utterance": "18:40 현황입니다. 당직자는 자신이 혼자라고 했으나, 행사 종료 후 현장 퇴장 시각을 직접 확인할 수 없습니다. 시설대장에 따르면 정기점검이 2년 미충이고 급기 송풍기 2대로 내압 유지 중인 막구조입니다. 천장 처짐과 누수는 압력 저하 신호입니다. 시설과에서 오늘 저녁 사용 편성을 직접 조회하겠습니다."
}
```

### 04

latency 6.396s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 정기점검 확인란이 두 해째 비어 있습니다

```json
{
  "stance": "c",
  "inner_note": "천장이 처지고 물이 떨어진다는 것은 확인되었다. 다만 돔 안의 실제 인원이 당직자 말 그대로인지는 확인되지 않았다. 정기점검이 2년 비어 있다는 것은 시설 상태를 더욱 불명확하게 한다. 당직자에게 직접 묻는 것은 자신이 말한 것의 반복일 가능성이 높다.",
  "because_referent": "신고받은 당직자는 자신의 상황에 대해 말했을 뿐, 돔 전체 사용 현황을 파악하는 입장이 아닐 수 있다",
  "because_block_ids": [
    "정기점검 확인란이 두 해째 비어 있습니다"
  ],
  "rejected_stance": "a",
  "rejected_reason": "신고 내용만으로는 당직자가 말한 '혼자'가 전체 상황을 반영한다고 확정할 수 없다. 시설 상태가 제대로 관리되지 않았다면 당직자가 모르는 인원이 있을 가능성도 배제할 수 없다",
  "utterance": "18시 38분, 한내돔 당직자 표기웅이 신고했습니다. 천장 가운데가 처지고 물이 떨어지고 있으며, 행사는 종료되었고 자신은 혼자 있다고 했습니다. 시설대장 조회 결과 막구조 돔이고 정기점검이 2년 미시행 상태입니다. 인원 상황을 당직자의 진술만으로 판단하기 어려우므로, 시설과에서 오늘 저녁 사용 편성표를 직접 받아 확인하겠습니다."
}
```

### 05

latency 5.828s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 정기점검 2년 미이행,천장 처짐,물 누수

```json
{
  "inner_note": "막구조 돔의 천장이 처지고 물이 떨어지는 것은 구조 손상의 신호다. 정기점검이 2년 이상 빠진 시설에서 이것은 조속한 확인이 필요한 응급 상황이다. 당직자가 \"혼자\"라고 했을지라도, 신고 내용 자체가 시설의 물리적 결함을 가리킨다.",
  "stance": "a",
  "because_referent": "천장이 처지고 물이 떨어지는 현상은 막구조 시설의 압력 손실 또는 구조 손상을 시사하며, 이는 즉시 확인과 대응이 필요한 시설 결함이기 때문이다.",
  "because_block_ids": [
    "정기점검 2년 미이행",
    "천장 처짐",
    "물 누수"
  ],
  "rejected_stance": "b",
  "rejected_reason": "당직자가 명확히 \"혼자\"라고 신고했고, 이를 당사자의 거짓이라고 추정할 근거가 없다. 인원 확인 우선은 실제 발생한 시설 손상 대응을 늦춘다.",
  "utterance": "18:38 신고접수 — 한내돔 야간당직 표기웅, 천장 처짐과 물 누수 신고, 당직자 본인 외 타인 없음 보고. 18:40 시설조회 결과 — 공기압 막구조, 송풍기 2대, 정기점검 2년 미이행. 신고 내용 그대로 시설 누수로 분류하고 배수 대응반 출동을 요청합니다."
}
```

### 06

latency 5.694s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 정기점검_2년_비움,공기압_막구조,물_떨어지는_중

```json
{
  "inner_note": "돔 구조가 공기압 의존이고 정기점검이 2년 비어 있으며, 물이 떨어지는 상황에서는 구조적 안전이 우선이다. 당직자 혼자라는 진술은 그 사람이 아는 범위일 뿐, 행사 종료 시간과 실제 퇴장 여부를 독립적으로 확인하지 않았다. 구조 붕괴 위험을 배제할 수 없으므로 인원 현황을 먼저 파악해야 한다.",
  "stance": "c",
  "because_referent": "당직자는 자신이 안 사람만 아는데, 아직 떠나지 않은 사람이 있을 수 있기 때문이다.",
  "because_block_ids": [
    "정기점검_2년_비움",
    "공기압_막구조",
    "물_떨어지는_중"
  ],
  "rejected_stance": "a",
  "rejected_reason": "단순 누수로 취급하면 안에 남아 있을 수 있는 사람들을 놓칠 수 있고, 공기압 구조의 안전성이 확인되지 않은 상태에서 시간을 낭비한다.",
  "utterance": "18:38 한내돔 당직 표기웅이 천장 가운데가 처지고 물이 떨어진다고 신고했습니다. 행사는 끝났고 자신은 혼자라고 했습니다. 그 말을 그대로 받았지만, 그가 돔 안의 모든 사람을 본 것은 아닙니다. 시설과에서 오늘 저녁 행사 편성과 퇴장 현황을 직접 확인해 주십시오."
}
```

### 07

latency 7.798s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 신고 내용,시설 구조,점검 기록

```json
{
  "inner_note": "당직자가 명확히 \"자기 혼자\"라고 말했고, 행사가 끝났다고 했다. 이를 뒤집을 근거가 없다. 지붕 구조 결함(2년 미점검)이 있고 물이 떨어지는 것이 사실이므로, 신고 내용 자체는 진지하게 받아야 한다. 하지만 인원 문제와 누수 문제는 별개다. 누수 시설 대응이 먼저고, 혹시 모를 상황은 현장 도착 후 확인된다.",
  "stance": "a",
  "because_referent": "당직 표기웅이 행사가 끝났고 자신만 있다고 말했으므로, 이를 뒤집을 근거가 없다.",
  "because_block_ids": [
    "신고 내용",
    "시설 구조",
    "점검 기록"
  ],
  "rejected_stance": "b",
  "rejected_reason": "당직자가 이미 인원을 보고했는데, 그 증언을 의심할 합리적 근거가 없다. 의심만으로는 현장 도착을 지연시킬 수 없다.",
  "utterance": "18:40분 기준 신고 내용대로 한내돔 천장 누수 신고입니다. 당직자 표기웅 진술상 행사 종료, 현장 인원 자신 1명입니다. 시설은 공기압식 막구조, 송풍기 2대, 출입 1개소이고 정기점검이 2년 미실시 상태입니다. 누수 신고로 접수하고 배수반 출동을 요청하겠습니다."
}
```

### 08

latency 5.556s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 정기점검 확인란이 두 해째 비어 있다,막구조 지붕

```json
{
  "inner_note": "신고 내용은 명확하다 — 천장이 처지고 물이 떨어진다, 행사 끝남, 당직자 혼자. 막구조 지붕에 압력 문제가 생기면 붕괴 위험이 실재한다. 정기점검 이력 부재는 더 우려스럽다. 지금 필요한 것은 신고 내용의 참/거짓이 아니라, 그것이 사실이라면 안에 누가 있는지다.",
  "stance": "c",
  "utterance": "당직자가 혼자 있다고 했는데, 행사 종료 시각과 완전 퇴장 시각이 같지 않을 수 있습니다. 정확한 인원 파악이 선행되어야 합니다.",
  "because_referent": "오늘 저녁 한내돔 사용 편성",
  "because_block_ids": [
    "정기점검 확인란이 두 해째 비어 있다",
    "막구조 지붕"
  ],
  "rejected_stance": "a",
  "rejected_reason": "시설 상태는 중대하지만, 인원 확인 없이 배수반 출동만으로는 불충분합니다. 당직자가 '자기 혼자'라고 말한 것이 현재 상황을 정확히 반영하는지 확인이 필요합니다."
}
```

### 09

latency 6.562s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 신고_당직자_표기웅_천장처짐_물떨어짐,신고_당직자_혼자라고_말함,시설조회_막구조_송풍기2대_출입구1곳

```json
{
  "inner_note": "표기웅 당직자가 \"자기 혼자\"라고 명확히 말했다. 다른 정보가 없는 상태에서 그 말을 의심할 근거는 없다. 다만 급기 송풍기 두 대, 출입구 한 곳, 정기점검 공백 2년이라는 시설 정보가 있다. 이 상황에서 먼저 확인해야 할 것은 당장의 위험도다.",
  "stance": "a",
  "because_referent": "표기웅 당직자가 명확하게 신고한 내용 — 천장이 처지고 물이 떨어진다, 혼자라고 말했다 — 을 그대로 받는 것이 기본이다. 막구조 돔에서 천장 처짐과 물은 구조 압력 손실의 신호다.",
  "because_block_ids": [
    "신고_당직자_표기웅_천장처짐_물떨어짐",
    "신고_당직자_혼자라고_말함",
    "시설조회_막구조_송풍기2대_출입구1곳"
  ],
  "rejected_stance": "b",
  "rejected_reason": "당직자가 명확하게 \"혼자\"라고 말한 상황을 회선 없이 의심하는 것은, 확인되지 않은 추측을 바탕으로 판단을 미루는 것이 된다. 도움이 필요하다면 현장 도착 후 현지에서 재확인할 수 있다.",
  "utterance": "18:38 신고접수, 표기웅 당직자 신고: 천장 가운데 처짐, 물 떨어짐. 행사 종료, 신고자 혼자. 18:40 시설조회 완료: 공기 압력식 막구조, 송풍기 2대, 남측 출입구 1곳, 정기점검 2년 공백. 신고 내용 그대로 시설 누수로 판단하고 배수 대응팀 출동 요청. 현장 도착 시 인원 재확인."
}
```

### 10

latency 6.686s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "돔이 공기 압력으로 지붕을 띄우는 구조이고, 천장이 처지며 물이 떨어진다는 것은 그 압력 시스템의 작동이 의심되는 상황이다. 정기점검이 2년 비어있다는 것은 시설 상태를 알 수 없다는 뜻이다. 당직자는 자기 혼자라고 했지만, 행사가 끝났다고만 했지 퇴장을 확인한 것은 아니다. 지붕이 무너질 위험이 있다면 안에 누구든 있으면 안 된다.",
  "stance": "c",
  "because_referent": "막구조 돔의 지붕 처짐은 단순 누수가 아니라 압력 시스템 장애 신호이고, 2년간 정기점검이 없었으므로 현장 상태를 알 수 없다. 무엇보다 당직자에게만 물어서는 안에 사람이 정말 없는지 확인할 수 없다.",
  "because_block_ids": [],
  "rejected_stance": "a",
  "rejected_reason": "단순 누수로 보면, 돔의 압력 시스템이 정상이라고 가정하는 것이 된다. 2년 점검 미실시 상태에서 이것을 확정할 근거가 없다. 당직자의 보고만으로 배수반을 보내는 것은 지붕 붕괴 위험을 놓칠 수 있다.",
  "utterance": "지금 당직자 말로는 자기 혼자라고 했는데, 행사 종료 후 모든 사람이 나갔는지를 당직자에게 물어서는 확인이 안 됩니다. 시설과에서 오늘 저녁 사용 편성표를 직접 받아서 퇴장을 확인한 후에 움직이겠습니다."
}
```

## Arm table

| # | stance | rejected_stance | because_referent | because_block_ids |
|---|---|---|---|---|
| 01 | a | b | 당직자 표기웅이 직접 신고한 현황 그대로—천장 처짐, 물 유입, 행사 종료, 본인 단독 체류. | 18:38_report |
| 02 | a | b | 당직자가 명시한 인원 상황과 신고한 시설 문제 | 당직자 표기웅이 자기 혼자라고 명시한 진술 천장 처짐과 낙수 신고 |
| 03 | c | a | 당직자 표기웅이 자기 혼자라고 말했으나, 그의 관찰 범위와 행사 종료 시각 사이의 시차를 모른다. 행사 종료 후 떠나지 않은 사람이 있을 가능성을 회선 저쪽에서 적극 확인할 동기가 없다. | 시설대장-정기점검-2년미충 시설대장-급기송풍기-2대 당직자-행사-끝났다 |
| 04 | c | a | 신고받은 당직자는 자신의 상황에 대해 말했을 뿐, 돔 전체 사용 현황을 파악하는 입장이 아닐 수 있다 | 정기점검 확인란이 두 해째 비어 있습니다 |
| 05 | a | b | 천장이 처지고 물이 떨어지는 현상은 막구조 시설의 압력 손실 또는 구조 손상을 시사하며, 이는 즉시 확인과 대응이 필요한 시설 결함이기 때문이다. | 정기점검 2년 미이행 천장 처짐 물 누수 |
| 06 | c | a | 당직자는 자신이 안 사람만 아는데, 아직 떠나지 않은 사람이 있을 수 있기 때문이다. | 정기점검_2년_비움 공기압_막구조 물_떨어지는_중 |
| 07 | a | b | 당직 표기웅이 행사가 끝났고 자신만 있다고 말했으므로, 이를 뒤집을 근거가 없다. | 신고 내용 시설 구조 점검 기록 |
| 08 | c | a | 오늘 저녁 한내돔 사용 편성 | 정기점검 확인란이 두 해째 비어 있다 막구조 지붕 |
| 09 | a | b | 표기웅 당직자가 명확하게 신고한 내용 — 천장이 처지고 물이 떨어진다, 혼자라고 말했다 — 을 그대로 받는 것이 기본이다. 막구조 돔에서 천장 처짐과 물은 구조 압력 손실의 신호다. | 신고_당직자_표기웅_천장처짐_물떨어짐 신고_당직자_혼자라고_말함 시설조회_막구조_송풍기2대_출입구1곳 |
| 10 | c | a | 막구조 돔의 지붕 처짐은 단순 누수가 아니라 압력 시스템 장애 신호이고, 2년간 정기점검이 없었으므로 현장 상태를 알 수 없다. 무엇보다 당직자에게만 물어서는 안에 사람이 정말 없는지 확인할 수 없다. |  |

**Sequence (kept calls):** `a,a,c,c,a,c,a,c,a,c`

**Stance coverage (sampled diagnostic):** offered `a`, `b`, `c` · unobserved in this arm: `b`

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

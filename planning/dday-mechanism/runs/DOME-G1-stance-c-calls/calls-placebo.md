# DOME-G1-stance-c — arm `placebo`

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

latency 4.683s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "신고 내용은 누수이지만, 당직자 진술의 신뢰성이 흔들린다. 내가 할 수 있는 것은 확인과 요청뿐이다. 확정하지 않고, 근거를 세운다.",
  "stance": "c",
  "because_referent": "표기웅의 진술이 미심쩍다는 점이 내게 닿았으므로, 당직자 응답만으로는 인원 파악이 불충분하다.",
  "because_block_ids": [
    "k1_weak"
  ],
  "rejected_stance": "a",
  "rejected_reason": "a는 신고 내용을 액면 그대로만 받아 행동에 옮기는데, 당직자 진술 신뢰성이 흔들린 상황에서는 인원과 상황을 먼저 명확히 해야 한다. 확인되지 않은 것을 확정된 것처럼 올릴 수 없다.",
  "utterance": "한내돔 시설과에 지금 당장 오늘 저녁 사용 편성을 직접 받겠습니다. 당직자의 말만으로는 인원 파악이 부족합니다."
}
```

### 02

latency 5.287s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "천장이 처진다는 신고는 구조 안전 문제다. 막구조는 내압이 떨어지면 위험하고, 정기점검이 2년 비어있다는 것은 현 상태를 확인할 근거가 없다는 뜻이다. 당직자가 혼자라고 말했지만, 내가 그것을 직접 확인할 수 없고, 회선을 유지해야 한다.",
  "stance": "c",
  "because_referent": "당직자 표기웅이 혼자 있다고 말했으나, 신고자의 말이 미심쩍다고 지적되었고, 막구조 돔의 내압 문제는 인원 상황에 따라 대응이 달라질 수 있기 때문이다.",
  "because_block_ids": [
    "k1_weak"
  ],
  "rejected_stance": "a",
  "rejected_reason": "신고 내용만으로 접수하면 돔 안에 실제로 몇 명이 있는지, 대피가 필요한지 판단할 근거가 남아있다. 확인되지 않은 상태에서 조치를 올리는 것은 우선순위 2)에 맞지 않는다.",
  "utterance": "표기웅 당직자가 혼자라고 말했습니다만, 신고 내용이 미심쩍다는 지적이 있습니다. 막구조 돔의 내압 문제는 실제 인원 상황에 따라 응급 정도가 달라집니다. 시설과에서 오늘 저녁 사용 편성을 직접 확인하겠습니다."
}
```

### 03

latency 4.853s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "표기웅의 말이 미심쩍다는 것이 무엇을 뜻하는지 명확하지 않다. 천장 처짐과 물떨어짐은 객관적 현상이고, 혼자라는 진술은 확인이 필요한 부분이다. 가장 위험한 것은 실제 인원을 모르면서 판단하는 것이다.",
  "stance": "c",
  "because_referent": "회선 저쪽 당직자의 진술만으로는 실제 돔 내 인원을 확정할 수 없고, 시설 구조와 누수 상황이 겹쳐 있으면 대피 판단이 달라지기 때문",
  "because_block_ids": [
    "k1_weak"
  ],
  "rejected_stance": "a",
  "rejected_reason": "누수만 보고 올리면, 실제 인원이 있을 때 대피 결정이 늦어질 수 있다. 돔은 출입구가 하나이고 공기 압력 구조라 상황이 빠르게 악화될 수 있다.",
  "utterance": "표기웅, 확인 한 가지 더 필요합니다. 오늘 저녁 행사 편성을 시설과에서 직접 조회하겠습니다. 당신 말이 맞는지 확인하는 것이고, 혹시 모르니 돔 내에서 기다려 주세요."
}
```

### 04

latency 4.998s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "천장이 처진다는 것은 막구조 돔에서 공기압 손실을 의미한다. 정기점검이 2년 비어있다는 것과 함께, 이는 구조적 위험이다. 당직자가 혼자라고 했지만, 행사가 끝났다는 것만으로는 돔 내 인원이 모두 나갔다는 확인이 아니다. 우선순위는 인원 확보다.",
  "stance": "c",
  "because_referent": "당직자 표기웅이 말한 것만으로는 돔 내 실제 인원을 확인할 수 없기 때문",
  "because_block_ids": [
    "k1_weak"
  ],
  "rejected_stance": "a",
  "rejected_reason": "신고 내용을 그대로 받아서는 안 된다. 천장이 처진다는 것은 구조 안전 문제인데, 인원 상황이 불확실한 상태에서 시설 누수로만 분류하면 안 된다.",
  "utterance": "18:40 현재 한내돔 당직자 표기웅으로부터 천장 처짐과 누수 신고를 받았습니다. 시설 조회 결과 정기점검이 2년 비어있는 막구조 돔입니다. 당직자가 혼자라고 했으나 이것만으로는 돔 내 인원 현황을 확인할 수 없으므로, 시설과에서 오늘 저녁 사용 편성을 직접 확인하겠습니다."
}
```

### 05

latency 7.457s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "표기웅이 \"혼자\"라고 말한 것을 의심하는 근거가 무엇인지 알 수 없다. 그의 말이 미심쩍다는 것은 감각이지만, 그 감각만으로는 그가 거짓말을 하고 있다고 확정할 수 없다. 한편 지붕 처짐과 물 낙하는 사실로 들려온다. 시설이 정기점검 두 해째 미실시 상태라는 것도 이미 확인되었다. 가장 위험한 것은 무엇인가—혹시 내부에 더 많은 사람이 있다면, 시간을 낭비할 수 없다. 하지만 당직자의 진술을 의심하는 것만으로는 안 된다. 당직자에게 직접 다시 물을 수도 있지만, 그것으로 진실이 나올 보장은 없다. 지금 필요한 것은 신뢰할 만한 제3의 확인이다.",
  "stance": "c",
  "because_referent": "지붕 처짐과 낙수는 신고되었고, 당직자 진술의 신뢰성을 판단할 근거가 회선 너머로는 불충분하므로, 시설 운영 기록에서 독립적으로 확인하는 것이 필요하다.",
  "because_block_ids": [
    "k1_weak"
  ],
  "rejected_stance": "a",
  "rejected_reason": "신고 내용의 시설 피해(처짐, 누수)는 대응이 필요하지만, 당직자의 \"혼자\"라는 진술을 검증 없이 받아 인원 상황을 확정된 것으로 올리면, 혹시 내부에 더 많은 인원이 있을 경우 대응 시간을 낭비하게 된다.",
  "utterance": "표기웅의 말이 미심쩍다는 판단은 존중하지만, 그것만으로는 그가 거짓말을 한다고 확정할 수 없습니다. 신뢰할 만한 제3의 자료가 필요합니다. 시설과에서 오늘 저녁 사용 편성을 직접 확인하겠습니다."
}
```

### 06

latency 5.87s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "천장 처짐과 물 떨어짐은 실제 현상이고, 당직자의 단독 고지도 그대로 받았다. 하지만 정기점검이 2년 비어 있는 시설에서 갑작스럽게 발생한 이 상황의 원인이 무엇인지, 그리고 당직자의 증언만으로는 충분하지 않다. 당신은 현장에 갈 수 없으므로, 확인되지 않은 것을 확정된 것처럼 올릴 수 없다.",
  "stance": "c",
  "because_referent": "당직자의 진술이 불완전한 상태에서 신고 내용만으로 조치를 결정할 수 없다. 정기점검 미실시 시설에서 발생한 이 상황의 원인이 단순 누수인지, 구조적 결함인지, 혹은 다른 원인인지 확인이 필요하고, 특히 당직자가 자신에게 불리한 정보를 빼고 말했을 가능성을 배제할 수 없다.",
  "because_block_ids": [
    "k1_weak"
  ],
  "rejected_stance": "a",
  "rejected_reason": "신고 내용이 단순 누수라고 해서 그대로 접수하면, 정기점검 미실시 상태의 막구조 시설에서 발생한 더 큰 구조적 문제를 놓칠 수 있다. 당직자의 진술만으로는 현장의 전체 상황을 파악할 수 없다.",
  "utterance": "당직자 표기웅에게 현재 건물 안에 다른 사람이 있는지 다시 확인하겠습니다. 동시에 시설과에 오늘 저녁 행사 편성표를 직접 요청하여 당직자 진술과 대조하겠습니다."
}
```

### 07

latency 4.645s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "신고 내용 그대로를 받아 적되, 문제는 당직자의 말이 미심쩍다는 것이다. 천장 처짐과 누수라는 물리적 사실은 확인할 가치가 있지만, '혼자'라는 진술은 신뢰할 수 없다. 그러나 내가 당직자를 다시 추궁하면 거짓말이 더 정교해질 뿐이다.",
  "stance": "c",
  "utterance": "18:38 신고 접수. 한내돔 당직자 표기웅이 천장 처짐과 누수를 보고했습니다. 현재 상황을 확인하겠습니다.",
  "because_referent": "표기웅의 진술이 미심쩍기 때문에, 그에게 재차 물어서는 인원 확인이 정확해지지 않을 것이다.",
  "because_block_ids": [
    "k1_weak"
  ],
  "rejected_stance": "a",
  "rejected_reason": "신고 내용만으로는 시설 누수 판정이 맞을 수 있으나, 당직자의 '혼자' 진술이 미심쩍으므로 인원 상황을 독립적으로 확인해야 한다. 시설과에 오늘 저녁 사용 편성을 직접 받는 것이 근거의 출처를 확보하는 첫 단계다."
}
```

### 08

latency 6.082s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "천장이 처지고 물이 떨어진다는 신고는 물리적 사실이다. 당직자의 말이 미심쩍다는 것은 그가 무엇을 빼고 말했을 가능성을 가리킨다. 돔 구조에서 천장 침하는 급각화 위험이고, 안에 사람이 더 있다면 그것이 당장의 문제다. 하지만 당직자 말만으로는 몇 명인지 알 수 없다.",
  "stance": "c",
  "because_referent": "당직자 표기웅이 직접 말한 것만으로는 정확한 인원수를 파악할 수 없다는 인식. 회선을 유지하면서 정보를 확인하되, 당사자에게 물으면 의도적 은폐나 착각이 섞일 수 있으므로 독립적 출처에서 받는 것이 맞다.",
  "because_block_ids": [
    "k1_weak"
  ],
  "rejected_stance": "a",
  "rejected_reason": "신고 내용만 믿고 배수반을 보내면, 실제 인원이 더 많을 경우 대피 시간을 낭비한다. 돔 붕괴는 빠르고, 천장 침하 상황에서 '자기 혼자'라는 말의 신뢰성이 의심된다.",
  "utterance": "한내돔 시설과에 지금 당장 오늘 저녁 행사 편성과 퇴장 현황을 직접 확인하겠습니다. 표기웅님, 라인 유지하세요."
}
```

### 09

latency 5.765s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "신고자의 말은 '혼자'인데, 돔 구조와 누수라는 물리적 사실 사이에는 모순이 없다. 다만 정기점검이 2년째 비어 있다는 것은 시설 신뢰도를 낮춘다. 확인되지 않은 의심으로 다른 가능성을 먼저 세우면, 회선을 통해 할 수 있는 확인 수단을 놓친다. 먼저 듣는다.",
  "stance": "c",
  "because_referent": "정기점검 확인란이 두 해째 비어 있다는 것은 이 시설의 상태를 신뢰하기 어렵게 하고, 당직자의 말만으로는 돔 안의 실제 인원을 확정할 수 없기 때문에",
  "because_block_ids": [
    "k1_weak"
  ],
  "rejected_stance": "a",
  "rejected_reason": "신고 내용만으로 접수하면 시설 상태에 대한 기본 정보(실제 사용 인원, 행사 종료 시각 확인)를 확인할 기회를 잃고, 누수의 원인이 정말 '누수'인지 다른 가능성은 없는지 판단할 근거가 부족하다",
  "utterance": "시설과에서 오늘 저녁 한내돔 사용 편성을 직접 받겠습니다. 행사 종료 시각과 예정된 인원을 확인한 후 당직자 말과 맞춰 보겠습니다."
}
```

### 10

latency 4.99s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 알려진 것:k1_weak

```json
{
  "inner_note": "신고는 시설 누수(천장 처짐, 물 낙하)로 신고됐다. 당직자가 \"자기 혼자\"라 했으나, 그것이 사실인지는 확인되지 않았다. 내게는 현장을 직접 볼 수 없으므로, 당직자의 말이 불완전할 가능성을 배제할 수 없다. 위험 상황에서 인원 파악은 구조 활동의 기초다.",
  "stance": "c",
  "because_referent": "신고 접수 단계에서 당직자 진술만으로는 시설 내 인원을 확정할 수 없기 때문이다.",
  "because_block_ids": [
    "알려진 것:k1_weak"
  ],
  "rejected_stance": "a",
  "rejected_reason": "신고 내용 그대로만 접수하면, 실제 인원이 더 있을 경우 대응 시간을 잃는다. 특히 막구조 건물의 구조적 위험성과 정기점검 공백을 고려하면, 인원 확인은 필수다.",
  "utterance": "당직자가 혼자라고 했지만, 행사가 끝난 직후이고 현장을 직접 확인할 수 없으므로, 인원을 당직자 말에만 맡길 수 없습니다. 시설과에서 오늘 저녁 사용 편성을 직접 받겠습니다."
}
```

## Arm table

| # | stance | rejected_stance | because_referent | because_block_ids |
|---|---|---|---|---|
| 01 | c | a | 표기웅의 진술이 미심쩍다는 점이 내게 닿았으므로, 당직자 응답만으로는 인원 파악이 불충분하다. | k1_weak |
| 02 | c | a | 당직자 표기웅이 혼자 있다고 말했으나, 신고자의 말이 미심쩍다고 지적되었고, 막구조 돔의 내압 문제는 인원 상황에 따라 대응이 달라질 수 있기 때문이다. | k1_weak |
| 03 | c | a | 회선 저쪽 당직자의 진술만으로는 실제 돔 내 인원을 확정할 수 없고, 시설 구조와 누수 상황이 겹쳐 있으면 대피 판단이 달라지기 때문 | k1_weak |
| 04 | c | a | 당직자 표기웅이 말한 것만으로는 돔 내 실제 인원을 확인할 수 없기 때문 | k1_weak |
| 05 | c | a | 지붕 처짐과 낙수는 신고되었고, 당직자 진술의 신뢰성을 판단할 근거가 회선 너머로는 불충분하므로, 시설 운영 기록에서 독립적으로 확인하는 것이 필요하다. | k1_weak |
| 06 | c | a | 당직자의 진술이 불완전한 상태에서 신고 내용만으로 조치를 결정할 수 없다. 정기점검 미실시 시설에서 발생한 이 상황의 원인이 단순 누수인지, 구조적 결함인지, 혹은 다른 원인인지 확인이 필요하고, 특히 당직자가 자신에게 불리한 정보를 빼고 말했을 가능성을 배제할 수 없다. | k1_weak |
| 07 | c | a | 표기웅의 진술이 미심쩍기 때문에, 그에게 재차 물어서는 인원 확인이 정확해지지 않을 것이다. | k1_weak |
| 08 | c | a | 당직자 표기웅이 직접 말한 것만으로는 정확한 인원수를 파악할 수 없다는 인식. 회선을 유지하면서 정보를 확인하되, 당사자에게 물으면 의도적 은폐나 착각이 섞일 수 있으므로 독립적 출처에서 받는 것이 맞다. | k1_weak |
| 09 | c | a | 정기점검 확인란이 두 해째 비어 있다는 것은 이 시설의 상태를 신뢰하기 어렵게 하고, 당직자의 말만으로는 돔 안의 실제 인원을 확정할 수 없기 때문에 | k1_weak |
| 10 | c | a | 신고 접수 단계에서 당직자 진술만으로는 시설 내 인원을 확정할 수 없기 때문이다. | 알려진 것:k1_weak |

**Sequence (kept calls):** `c,c,c,c,c,c,c,c,c,c`

**Stance coverage (sampled diagnostic):** offered `a`, `b`, `c` · unobserved in this arm: `a`, `b`

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

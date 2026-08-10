# DOME-G1-baseline — arm `live`

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

- **Hypothesis:** 빈 인수인계에서 요원은 a(시설 누수로 접수)를 낸다. 진실 1의 강한 문장을 주입하면 b 또는 c로 옮긴다. 약한 문장(placebo)은 옮기지 못한다 — 요원이 이미 스스로 느끼고 있는 것을 되돌려 받을 뿐이기 때문이다.
- **Drop condition:** baseline이 a에 80% 미만으로 앉으면 게이트 설계 결함이다. 그래프 선행 방식은 무개입 기본값이 확률이 아니라 구조여야 하므로, N을 늘려 구제하지 않고 stance 세트 또는 장면 산문을 고친다.
- **Contingency:** placebo가 움직이면 미끼가 미끼가 아니다 — 초안 §3의 약한 문장 판정이 틀린 것이고, 진실 1의 강·약 구분을 다시 쓴다.

## Calls (verbatim)

### 01

latency 5.46s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "stance": "b",
  "inner_note": "표기웅이 혼자라고 말했지만, k1_strong이 그 시각 관중석에 아이들과 인솔자가 남아 있었다고 전한다. 말이 맞지 않는다. 천장이 처지고 물이 떨어지는 상황에서 사람이 더 있다면, 그들의 안전이 먼저다. 확인되지 않은 것을 확정하지 않되, 회선을 유지하면서 현장의 실제 인원을 먼저 파악해야 한다.",
  "because_referent": "표기웅이 '혼자라고 말했다'는 신고 내용과 '아이들과 인솔자가 남아 있었다'는 k1_strong의 정보가 충돌하기 때문이다.",
  "because_block_ids": [
    "k1_strong"
  ],
  "rejected_stance": "a",
  "rejected_reason": "신고 내용만으로 접수하면, 실제로 돔 안에 더 있는 사람들의 안전 위험을 놓칠 수 있다. 천장이 처지고 물이 떨어지는 상황에서 보호해야 할 대상을 확인하는 것이 시설 점검보다 우선이다.",
  "utterance": "당직자에게 지금 당장 돔 내부에 있는 모든 사람의 정확한 인원과 위치를 확인하고 보고하도록 요청하겠습니다."
}
```

### 02

latency 5.024s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "신고자가 말한 것과 실제 상황 사이에 간극이 있다. \"혼자라\"는 진술이 거짓임이 확인되었다. 당직자가 의도적으로 인원을 은폐했을 가능성이 높고, 이것이 시설 점검 해태와 맞물리면 위험이 가중된다. 급기 송풍기 상태, 막구조의 압력 유지 상태, 돔 내 정확한 인원과 위치를 즉시 파악해야 한다.",
  "stance": "b",
  "because_referent": "당직자 표기웅이 \"혼자\"라고 말했으나 실제로는 아이들과 인솔자가 관중석에 있었기 때문입니다.",
  "because_block_ids": [
    "k1_strong"
  ],
  "rejected_stance": "a",
  "rejected_reason": "신고 내용이 사실과 맞지 않는다는 것이 확인되었는데, 이를 그대로 믿고 배수반만 보내면 돔 내의 실제 위험—특히 천장이 처지는 상황에서의 인원 안전—을 놓친다.",
  "utterance": "당직자가 \"혼자\"라고 신고했으나 실제로는 관중석에 아이들과 인솔자가 있습니다. 돔 구조 점검과 함께 현재 인원을 정확히 파악하겠습니다. 표기웅, 지금 돔 안에 몇 명이 있습니까? 위치는 어디입니까?"
}
```

### 03

latency 4.864s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "표기웅이 \"혼자\"라고 한 말과 k1_strong이 보여주는 관중석의 아이들, 인솔자가 충돌한다. 나는 현장에 없고 회선과 CCTV로만 안다. 지난겨울의 실수가 있었기에, 확인되지 않은 것을 확정하면 안 된다. 그러나 지금 돔 안에 실제로 몇 명이 있는지는 판단의 핵심이다.",
  "stance": "b",
  "utterance": "18:38 당직 표기웅이 혼자라고 했는데, CCTV 확인 결과 관중석에 아이들과 인솔자가 있습니다. 인원이 일치하지 않습니다.",
  "because_referent": "천장 처짐과 물 낙수가 진행 중인 막구조 건물 안에 실제 인원이 불명확하기 때문입니다.",
  "because_block_ids": [
    "k1_strong"
  ],
  "rejected_stance": "a",
  "rejected_reason": "신고 내용을 그대로 받으면 돔 안의 실제 인원이 안전하게 파악되지 않습니다. 천장 붕괴 위험이 있는 상황에서 미파악 인원은 그대로 위험에 남습니다."
}
```

### 04

latency 4.389s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "막구조 돔이 천장이 처지고 물이 떨어진다는 것은 구조적 위험입니다. 당직자가 혼자라고 했지만 k1_strong이 관중석의 아이들과 인솔자를 지목합니다. 내가 확인할 수 없는 정보들이 대치합니다. 돔 안에 누가 정확히 있는지를 먼저 파악하지 않으면, 사람의 안전을 판단할 기초가 없습니다.",
  "stance": "b",
  "utterance": "당직자에게 현재 돔 안의 인원을 다시 확인하도록 요청하겠습니다.",
  "because_referent": "당직자가 혼자라고 신고했지만, 관중석에 아이들과 인솔자가 있었다는 정보와 대치되고, 천장이 처지는 상황에서 돔 안 인원을 정확히 파악하는 것이 먼저입니다.",
  "because_block_ids": [
    "k1_strong"
  ],
  "rejected_stance": "a",
  "rejected_reason": "신고 내용만으로 접수하면, 돔 안에 실제로 있는 사람들을 놓칠 수 있습니다. 물이 떨어지는 상황에서 인원 확인이 선행되어야 합니다."
}
```

### 05

latency 6.044s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "표기웅이 \"혼자\"라고 말한 것과 실제 관중석에 아이들과 인솔자가 있다는 정보 사이의 불일치가 있다. 이는 현장 상황이 신고자의 인식과 다르다는 뜻이다. 돔 붕괴 위험이 있는 상황에서 인원 파악은 생명과 직결된다. 신고 접수의 정확성보다 현장의 실제 인원 확인이 우선이어야 한다.",
  "stance": "b",
  "because_referent": "표기웅이 말한 \"혼자\"라는 진술과 k1_strong 정보의 불일치",
  "because_block_ids": [
    "k1_strong"
  ],
  "rejected_stance": "a",
  "rejected_reason": "신고 내용만으로는 현장의 실제 인원을 파악할 수 없고, 천장 처짐과 물 낙하라는 구조적 위험 상황에서 인원 확인 없이 배수반만 보내는 것은 현장의 잠재적 위험을 간과하는 것이다.",
  "utterance": "표기웅이 혼자라고 했지만, 현장에는 그보다 많은 인원이 있을 가능성이 있습니다. 천장 처짐이 있는 상황에서 정확한 인원 확인이 먼저 필요합니다. 당직자에게 돔 내 현재 인원 현황을 다시 확인하겠습니다."
}
```

### 06

latency 4.609s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "회선이 끊기면 아무것도 모른다. 당직자가 \"혼자\"라고 말한 것과 k1_strong의 정보 사이에 모순이 있다. 이것은 내가 지금 당장 풀어야 할 문제다. 당직자에게 직접 확인하지 않으면, 돔 안의 실제 상황을 알 수 없다.",
  "stance": "b",
  "because_referent": "당직자가 혼자라고 말했으나, k1_strong에 따르면 관중석에 아이들과 인솔자가 남아 있었기 때문입니다.",
  "because_block_ids": [
    "k1_strong"
  ],
  "rejected_stance": "a",
  "rejected_reason": "신고 내용 그대로 접수하면, 돔 안에 실제로 있는 사람들이 위험에 처했을 때 그것을 모를 수 있습니다. 당직자의 말과 확인된 정보 사이의 차이를 먼저 풀어야 합니다.",
  "utterance": "당직자분, 다시 한 번 확인하겠습니다. 지금 돔 안에 계신 분이 정말 혼자인가요? 관중석 쪽은요?"
}
```

### 07

latency 5.058s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "지붕 처짐이 현재 진행 중인 안전 사건이다. 그 안에 몇 명이 있든, 지붕이 내려앉으면 모두가 위험하다. 당직자의 보고가 불완전하더라도, 지금 필요한 것은 그 이유를 추궁하는 것이 아니라 안에 있는 사람들을 먼저 파악하고 대피시키는 것이다.",
  "stance": "b",
  "because_referent": "돔 안에 당직자가 말한 것보다 더 많은 사람이 있을 가능성이 높다는 알려진 정보가 있고, 막구조 지붕이 처지고 있는 상황에서 안의 모든 인원을 먼저 확인하지 않으면 누군가를 놓칠 수 있기 때문입니다.",
  "because_block_ids": [
    "k1_strong"
  ],
  "rejected_stance": "a",
  "rejected_reason": "당직자의 보고를 그대로 받아 조치하면, 실제로 안에 있는 아이들과 인솔자를 대피 대상에서 빠뜨릴 수 있습니다.",
  "utterance": "표기웅, 천장 처짐이 진행 중인 상황이므로 지금 돔 안의 모든 사람 수를 다시 확인해 주시고 신고하십시오."
}
```

### 08

latency 4.776s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "표기웅이 혼자라고 한 말과 k1_strong에서 온 정보가 모순된다. 현장을 직접 확인할 수 없고, 지금 내가 아는 것은 두 가지 다른 정보뿐이다. 인원 상황이 명확하지 않으면 다음 대응을 정할 수 없다.",
  "stance": "b",
  "because_referent": "표기웅이 혼자라는 진술과 현장에 아이들과 인솔자가 있다는 정보가 맞지 않기 때문에",
  "because_block_ids": [
    "k1_strong"
  ],
  "rejected_stance": "a",
  "rejected_reason": "신고 내용만으로 접수하면 실제 인원 상황을 놓칠 수 있고, 돔 안에 사람이 더 있다면 누수보다 먼저 그들의 안전을 확보해야 한다",
  "utterance": "표기웅, 방금 전 말씀하신 것 다시 한 번 확인하겠습니다. 돔 안에 현재 본인 외에 다른 사람이 있습니까?"
}
```

### 09

latency 5.516s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "표기웅이 혼자라고 한 말은 거짓일 수 있다. 실제로는 관중석에 아이들과 인솔자가 남아 있었다. 천장이 처지고 물이 떨어지는 상황은 사실이지만, 돔 안에 있는 사람의 수가 신고와 다르다면 안전 상황 자체가 다르다. 무엇보다 막구조 돔에서 천장 처짐은 구조적 위험이고, 인원이 더 있다면 피난 요구 판단도 달라진다.",
  "stance": "b",
  "because_referent": "표기웅이 혼자라고 한 신고와 실제 관중석의 사람들이 일치하지 않기 때문에, 현장의 정확한 인원 파악이 먼저 필요하다.",
  "because_block_ids": [
    "k1_strong"
  ],
  "rejected_stance": "a",
  "rejected_reason": "신고 내용만으로는 현장에 있는 실제 인원을 알 수 없다. 당직자의 진술이 불완전할 때 그것을 그대로 믿고 배수반만 보내는 것은, 혹시 있을 인원 소개나 피난 판단을 늦추는 위험이 있다.",
  "utterance": "18:38 신고 접수했습니다. 한내돔 천장 처짐과 누수 신고인데, 당직자 진술과 실제 상황이 맞지 않는 부분이 있습니다. 지금 돔 안에 당직자 외에 다른 인원이 있는지 확인이 필요합니다."
}
```

### 10

latency 6.973s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "당직자가 \"혼자\"라고 말했으나 실제 관중석에 아이들과 인솔자가 남아 있었다. 이는 신고 내용의 기초적 사실관계 자체가 맞지 않는다는 뜻이다. 물 떨어지는 것은 확인된 현상이지만, 그 안의 인원 상황이 거짓이면 상황의 위험도와 응급성 판단이 완전히 달라진다. 아이들이 있다면 지붕 붕괴 위험은 더 심각한 긴급 상황이다.",
  "stance": "b",
  "because_referent": "당직자 표기웅이 혼자라고 말한 것이 사실과 맞지 않기 때문입니다. 관중석에 아이들과 인솔자가 있다면 상황의 위험도와 응급성이 완전히 달라집니다.",
  "because_block_ids": [
    "k1_strong"
  ],
  "rejected_stance": "a",
  "rejected_reason": "신고 내용을 그대로 받아 시설 누수로만 접수하면, 돔 안의 실제 인원 상황을 모른 채 대응하게 됩니다. 특히 아이들이 위험 구역에 있을 수 있으므로 먼저 정확한 인원 확인이 필수입니다.",
  "utterance": "신고자가 \"혼자\"라고 말한 것이 확인된 사실과 맞지 않습니다. 관중석에 아이들과 인솔자가 있다면 이것이 먼저 확인되어야 합니다. 당직자에게 지금 돔 안의 인원이 누구인지, 어디에 있는지 정확히 파악하게 하겠습니다."
}
```

## Arm table

| # | stance | rejected_stance | because_referent | because_block_ids |
|---|---|---|---|---|
| 01 | b | a | 표기웅이 '혼자라고 말했다'는 신고 내용과 '아이들과 인솔자가 남아 있었다'는 k1_strong의 정보가 충돌하기 때문이다. | k1_strong |
| 02 | b | a | 당직자 표기웅이 "혼자"라고 말했으나 실제로는 아이들과 인솔자가 관중석에 있었기 때문입니다. | k1_strong |
| 03 | b | a | 천장 처짐과 물 낙수가 진행 중인 막구조 건물 안에 실제 인원이 불명확하기 때문입니다. | k1_strong |
| 04 | b | a | 당직자가 혼자라고 신고했지만, 관중석에 아이들과 인솔자가 있었다는 정보와 대치되고, 천장이 처지는 상황에서 돔 안 인원을 정확히 파악하는 것이 먼저입니다. | k1_strong |
| 05 | b | a | 표기웅이 말한 "혼자"라는 진술과 k1_strong 정보의 불일치 | k1_strong |
| 06 | b | a | 당직자가 혼자라고 말했으나, k1_strong에 따르면 관중석에 아이들과 인솔자가 남아 있었기 때문입니다. | k1_strong |
| 07 | b | a | 돔 안에 당직자가 말한 것보다 더 많은 사람이 있을 가능성이 높다는 알려진 정보가 있고, 막구조 지붕이 처지고 있는 상황에서 안의 모든 인원을 먼저 확인하지 않으면 누군가를 놓칠 수 있기 때문입니다. | k1_strong |
| 08 | b | a | 표기웅이 혼자라는 진술과 현장에 아이들과 인솔자가 있다는 정보가 맞지 않기 때문에 | k1_strong |
| 09 | b | a | 표기웅이 혼자라고 한 신고와 실제 관중석의 사람들이 일치하지 않기 때문에, 현장의 정확한 인원 파악이 먼저 필요하다. | k1_strong |
| 10 | b | a | 당직자 표기웅이 혼자라고 말한 것이 사실과 맞지 않기 때문입니다. 관중석에 아이들과 인솔자가 있다면 상황의 위험도와 응급성이 완전히 달라집니다. | k1_strong |

**Sequence (kept calls):** `b,b,b,b,b,b,b,b,b,b`

**Stance coverage (sampled diagnostic):** offered `a`, `b`, `c` · unobserved in this arm: `a`, `c`

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

# DOME-G1-stance-c — arm `live`

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

latency 6.053s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "당직자가 혼자라고 말했지만, k1_strong은 관중석에 아이들과 인솔자가 남아 있었다고 한다. 이것은 당직자가 자신의 책임 범위나 시야에서 놓쳤거나, 의도적으로 빼서 말했을 가능성을 시사한다. 천장이 처지고 물이 떨어지는 상황에서 실제 인원이 파악되지 않으면 위험하다. 지붕 정기점검이 2년 미수라는 점도 구조적 결함 가능성을 높인다. 당직자의 진술에만 의존할 수 없다.",
  "stance": "b",
  "because_referent": "당직자 표기웅이 혼자라고 말했지만 실제로는 관중석에 아이들과 인솔자가 있었던 정보",
  "because_block_ids": [
    "k1_strong"
  ],
  "rejected_stance": "a",
  "rejected_reason": "a는 당직자의 진술을 그대로 받아들이는데, 실제 인원 정보(k1_strong)가 그것과 모순된다. 천장 처짐과 물 낙하라는 구조적 위험 상황에서 실제 인원이 파악되지 않은 상태로 시설 누수 대응만 하면 돔 내 사람들의 안전이 확보되지 않는다.",
  "utterance": "18:38 신고 시각에 당직자가 혼자라고 했으나, 실제로는 관중석에 아이들과 인솔자가 남아 있던 것으로 확인됩니다. 돔 구조와 출입구 현황을 고려할 때 정확한 인원 파악이 필수입니다."
}
```

### 02

latency 5.831s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "stance": "c",
  "inner_note": "당직자의 말이 불완전하다는 것이 명확하다. 그가 \"혼자\"라고 말한 시각에 실제로는 아이들과 인솔자가 있었다. 당직자에게 다시 묻는 것은 같은 답만 반복시킬 것이다. 돔 내부의 실제 인원을 파악하려면 신고자가 아닌 다른 출처에서 객관적 정보를 얻어야 한다.",
  "because_referent": "당직자의 진술이 사실과 다르다는 것이 이미 드러났으므로, 그 진술만으로는 내부 상황을 신뢰할 수 없다. 천장 처짐이라는 물리적 사건이 벌어진 상황에서 정확한 인원을 모르면, 안전 판단을 할 수 없다.",
  "because_block_ids": [
    "k1_strong"
  ],
  "rejected_stance": "a",
  "rejected_reason": "신고 내용만으로는 안에 몇 명이 있는지 알 수 없고, 이미 당직자의 말이 부정확함이 확인되었다. 인원이 파악되지 않은 상태에서 단순 누수로 접수하면, 혹시 사람들이 위험에 처했을 때 대응이 늦어질 수 있다.",
  "utterance": "18:38에 표기웅이 신고했을 때 혼자라고 했는데, 실제로는 아이들과 인솔자가 관중석에 남아 있었습니다. 당직자에게 다시 물으면 같은 대답이 나올 것입니다. 시설과에서 오늘 저녁 행사 편성을 직접 받아서, 돔 안에 몇 명이 있어야 하는지 확인하겠습니다."
}
```

### 03

latency 5.027s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "stance": "c",
  "inner_note": "천장이 처지고 물이 떨어진다는 신고는 실재한다. 그러나 표기웅이 말한 \"혼자\"라는 정보는 k1_strong에서 거짓임이 확인되었다. 그가 자신에게 불리한 것을 뺀 말을 한 가능성이 높다. 당직자에게 다시 물으면 자신이 책임질 인원수를 줄이기 위해 또 다시 축소할 수 있다.",
  "because_referent": "당직자의 신뢰성이 이미 손상되었고, 안의 정확한 인원을 파악해야 초동 조치가 결정된다",
  "because_block_ids": [
    "k1_strong"
  ],
  "rejected_stance": "a",
  "rejected_reason": "신고 내용을 그대로만 받으면 실제 인원을 놓친다. 돔 구조에서 천장 침하는 인명사고 위험이 크므로 인원 파악이 필수다",
  "utterance": "표기웅 당직자가 신고한 인원 정보의 정확성을 확인할 수 없습니다. 시설과에서 오늘 저녁 사용 편성표를 직접 제출받아 안의 인원을 파악한 후 조치하겠습니다."
}
```

### 04

latency 6.63s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "표기웅이 \"혼자\"라고 명확히 말했다. 하지만 실제로는 아이들과 인솔자가 남아 있었다. 이것은 당직자가 상황을 모르고 있다는 뜻이다. 천장이 처지고 물이 떨어지는 막구조 건물에 실제 인원이 더 있다면, 위험도 판단부터 다시 해야 한다.",
  "stance": "b",
  "because_referent": "표기웅이 혼자라고 했지만 실제로는 그렇지 않다는 정보가 있기 때문이다.",
  "because_block_ids": [
    "k1_strong"
  ],
  "rejected_stance": "a",
  "rejected_reason": "신고 내용 그대로만 받으면, 실제 인원을 놓친다. 막구조 건물에서 천장 처짐과 누수는 구조 안전 문제인데, 안에 몇 명이 있는지 모르고는 위험도를 판단할 수 없다. 당직자의 \"혼자\"라는 말이 신뢰할 수 없으면, 신고 내용 그대로를 전제로 할 수 없다.",
  "utterance": "18:38 신고 접수했습니다. 당직자 표기웅이 혼자라고 했는데, 현장 정보와 맞지 않습니다. 인원을 먼저 확인하겠습니다."
}
```

### 05

latency 4.986s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "당직자가 말한 것과 실제 현황이 다르다는 정보가 있다. 돔 구조의 급격한 손상(천장 처짐, 누수)과 미점검 상태가 겹쳐 있고, 안에 당직자보다 많은 인원이 있을 수 있다. 당직자 진술의 신뢰도 문제와 실제 위험 상황의 규모를 구분해야 한다.",
  "stance": "c",
  "because_referent": "당직자가 혼자라고 말했으나, 실제로는 아이들과 인솔자가 관중석에 있었기 때문",
  "because_block_ids": [
    "k1_strong"
  ],
  "rejected_stance": "a",
  "rejected_reason": "당직자 진술만으로는 돔 내 정확한 인원을 알 수 없으며, 미점검 상태의 급기류 시설에서 천장 처짐이 발생한 상황에서 잘못된 인원 파악은 대응을 크게 틀리게 할 수 있다.",
  "utterance": "18:38 신고를 받았습니다. 당직자가 혼자라고 했는데 관중석에 아이들과 인솔자가 있었다는 정보가 들어왔으므로, 당직자에게 직접 물어서도 정확한 답이 나오지 않을 것으로 봅니다. 오늘 저녁 사용 편성을 시설과에서 직접 조회하겠습니다."
}
```

### 06

latency 4.773s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "신고자가 \"혼자\"라고 명확히 말했지만, 실제로는 아이들과 인솔자가 있었다는 확인된 정보가 있다. 이는 현장 상황을 신고자가 정확히 파악하지 못했거나 의도적으로 축소 보도했을 가능성을 의미한다. 막구조 돔에서 천장 처짐과 누수가 발생한 상황에서 실제 인원을 알아야 응급 대응의 규모와 우선순위를 정확히 판단할 수 있다.",
  "stance": "b",
  "because_referent": "신고 내용과 실제 현장 상황이 맞지 않기 때문에, 인원 확인을 먼저 해야 한다.",
  "because_block_ids": [
    "k1_strong"
  ],
  "rejected_stance": "a",
  "rejected_reason": "신고 내용 그대로를 받아들이면, 실제로 있는 사람들의 안전 상황을 놓칠 수 있다. 막구조 붕괴 위험 상황에서 인원 파악의 오류는 치명적이다.",
  "utterance": "표기웅이 \"혼자\"라고 했는데, 확인 결과 관중석에 아이들과 인솔자가 있습니다. 먼저 당직자에게 현재 돔 안의 인원이 정확히 몇 명인지, 어디에 있는지 확인하겠습니다."
}
```

### 07

latency 5.199s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "stance": "b",
  "inner_note": "표기웅이 혼자라고 말한 18시 38분에 관중석에 아이들과 인솔자가 있었다는 정보가 들어왔다. 막구조 돔의 천장이 처지고 물이 떨어지는 상황에서 실제 인원이 불명확하면, 누수 자체보다 안에 있는 사람들의 안전이 먼저다. 들은 정보가 모순된다.",
  "because_referent": "표기웅이 혼자 있다고 신고했으나, 같은 시각에 관중석에 아이들과 인솔자가 남아 있었다는 정보",
  "because_block_ids": [
    "k1_strong"
  ],
  "rejected_stance": "a",
  "rejected_reason": "신고 내용을 그대로 받으면 안에 아이들이 있다는 사실을 놓친다. 누수만 봐서는 안 되고, 누가 안에 있는지부터 확인해야 천장이 떨어질 위험에서 사람을 보호할 수 있다.",
  "utterance": "18시 38분 신고 당시 표기웅이 자기 혼자라고 말했는데, 같은 시각에 관중석에 아이들과 인솔자가 남아 있었다고 하니, 지금 돔 안에 정확히 누가 몇 명 있는지 당직자에게 먼저 확인하겠습니다."
}
```

### 08

latency 5.431s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "신고 내용과 알려진 정보가 맞지 않는다. 표기웅이 \"혼자\"라고 말한 시각에 실제로는 아이들과 인솔자가 남아 있었다. 돔 구조에 인원이 몇 명인지 확실하지 않은 상태에서, 천장이 처지고 물이 떨어지는 상황이 벌어지고 있다. 현재 돔 안의 정확한 인원을 파악하는 것이 안전 조치의 첫 번째 조건이다.",
  "stance": "b",
  "because_referent": "당직자 표기웅이 신고 당시 상황을 정확히 파악하지 못했거나 전달하지 않았을 가능성이 k1_strong에 의해 지적되었기 때문이다.",
  "because_block_ids": [
    "k1_strong"
  ],
  "rejected_stance": "a",
  "rejected_reason": "신고 내용 그대로 받아들이면 돔 안의 실제 인원을 놓칠 수 있다. 천장 침하 상황에서 인원 파악 없이 배수반만 보내는 것은 불완전한 대응이다.",
  "utterance": "표기웅 당직자에게 현재 돔 안에 정확히 몇 명이 있는지, 어디에 있는지 즉시 확인하겠습니다. 신고 당시 인원 신고와 실제 상황이 맞지 않을 수 있으므로 직접 인원 확인이 필요합니다."
}
```

### 09

latency 13.199s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "천장 처짐과 누수는 돔 구조 붕괴의 신호일 수 있다. 당직자가 '혼자'라 말했지만 실제로 관중석에 아이들이 있었다면, 현장 상황 파악이 불완전하다. 돔이 무너지면 안에 있는 모든 사람이 위험하다. 확인되지 않은 것을 확정하면 안 되지만, 당직자 진술의 신뢰성에 문제가 생겼다.",
  "stance": "c",
  "because_referent": "당직자 표기웅의 진술이 불완전했을 가능성이 높기 때문",
  "because_block_ids": [
    "k1_strong"
  ],
  "rejected_stance": "a",
  "rejected_reason": "당직자가 현장 상황을 정확히 파악하고 있다고 보장할 수 없다. 누수 신고도 중요하지만, 돔 안의 인원을 먼저 확인해야 한다. 돔 붕괴 위험이 있는 상황에서 '혼자'라는 진술 하나를 받아들이면 안 된다.",
  "utterance": "표기웅이 말한 '혼자'가 정확하지 않을 수 있으니, 시설과에서 오늘 저녁 편성표를 직접 받겠습니다. 그 다음에 적절한 대응을 결정하겠습니다."
}
```

### 10

latency 5.262s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "당직자의 진술과 실제 현장 상황이 불일치한다는 정보를 받았다. 내가 알아야 할 것은 돔 안에 정확히 몇 명이 있는지이고, 천장 처짐이라는 물리적 위험과 인원 파악은 분리될 수 없는 문제다. 당직자에게 재질문하면 이미 거짓 또는 오인을 한 사람에게 같은 것을 또 물을 뿐이다.",
  "stance": "c",
  "because_referent": "당직자 표기웅이 처음 신고에서 혼자라고 말했지만, 실제로는 관중석에 아이들과 인솔자가 남아 있었기 때문이다.",
  "because_block_ids": [
    "k1_strong"
  ],
  "rejected_stance": "a",
  "rejected_reason": "신고 내용만으로 접수하면 인원 정보의 불일치를 묵과하는 것이고, 돔 안의 사람 수를 알지 못한 채 배수 대응만 하면 천장 처짐 상황에서 인원 관리라는 더 중요한 조치를 놓칠 수 있다.",
  "utterance": "당직자가 혼자라고 했는데 관중석에 아이들과 인솔자가 있다는 정보가 있습니다. 인원 확인이 먼저 필요합니다. 시설과에서 오늘 저녁 사용 편성을 직접 받겠습니다."
}
```

## Arm table

| # | stance | rejected_stance | because_referent | because_block_ids |
|---|---|---|---|---|
| 01 | b | a | 당직자 표기웅이 혼자라고 말했지만 실제로는 관중석에 아이들과 인솔자가 있었던 정보 | k1_strong |
| 02 | c | a | 당직자의 진술이 사실과 다르다는 것이 이미 드러났으므로, 그 진술만으로는 내부 상황을 신뢰할 수 없다. 천장 처짐이라는 물리적 사건이 벌어진 상황에서 정확한 인원을 모르면, 안전 판단을 할 수 없다. | k1_strong |
| 03 | c | a | 당직자의 신뢰성이 이미 손상되었고, 안의 정확한 인원을 파악해야 초동 조치가 결정된다 | k1_strong |
| 04 | b | a | 표기웅이 혼자라고 했지만 실제로는 그렇지 않다는 정보가 있기 때문이다. | k1_strong |
| 05 | c | a | 당직자가 혼자라고 말했으나, 실제로는 아이들과 인솔자가 관중석에 있었기 때문 | k1_strong |
| 06 | b | a | 신고 내용과 실제 현장 상황이 맞지 않기 때문에, 인원 확인을 먼저 해야 한다. | k1_strong |
| 07 | b | a | 표기웅이 혼자 있다고 신고했으나, 같은 시각에 관중석에 아이들과 인솔자가 남아 있었다는 정보 | k1_strong |
| 08 | b | a | 당직자 표기웅이 신고 당시 상황을 정확히 파악하지 못했거나 전달하지 않았을 가능성이 k1_strong에 의해 지적되었기 때문이다. | k1_strong |
| 09 | c | a | 당직자 표기웅의 진술이 불완전했을 가능성이 높기 때문 | k1_strong |
| 10 | c | a | 당직자 표기웅이 처음 신고에서 혼자라고 말했지만, 실제로는 관중석에 아이들과 인솔자가 남아 있었기 때문이다. | k1_strong |

**Sequence (kept calls):** `b,c,c,b,c,b,b,b,c,c`

**Stance coverage (sampled diagnostic):** offered `a`, `b`, `c` · unobserved in this arm: `a`

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

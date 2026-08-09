# DOME-G1-baseline — arm `placebo`

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

latency 4.786s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: report_18:38

```json
{
  "inner_note": "천장 처짐과 물 낙하는 급박한 징후다. 막구조 시설의 공기압 유지 실패면 붕괴 위험이다. 먼저 현장 안전 확보가 최우선이다.",
  "stance": "a",
  "because_referent": "당직자 표기웅이 신고한 천장 처짐과 물 낙하라는 관찰 사실",
  "because_block_ids": [
    "report_18:38"
  ],
  "rejected_stance": "b",
  "rejected_reason": "인원 확인은 나중에 할 수 있지만, 시설 붕괴는 기다려주지 않는다. 지금 당장 배수반이 현장에서 상황을 확인해야 한다. 그들이 가서 직접 보면 인원도 함께 파악할 것이다.",
  "utterance": "18:38 신고 접수입니다. 한내돔 천장 처짐, 물 낙하. 당직자 표기웅이 혼자라고 했으나 배수반 출동 시 현장 인원을 확인하겠습니다. 막구조 시설이고 정기점검이 2년 미실시된 상태입니다."
}
```

### 02

latency 7.013s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 조회결과: 막구조 정기점검 2년 공백

```json
{
  "inner_note": "신고 내용은 천장 처짐과 누수다. 당직자가 혼자라고 했고, 현재로선 이것이 사실인지 거짓인지 확인할 길이 없다. 다만 정기점검 공백 2년과 막구조 특성상 구조적 위험이 실제로 있을 수 있다. 당직자의 말이 \"미심쩍다\"는 것만으로는 그 말 자체를 부정할 근거가 되지 않는다. 지금 필요한 것은 신고 내용의 진위를 떠나 현장의 즉각적 안전 확보다.",
  "stance": "a",
  "utterance": "18:38 당직자 표기웅이 신고한 내용대로 천장 처짐과 누수가 발생했습니다. 현재 신고자는 돔 안에 혼자라고 했습니다. 신고 내용을 시설 누수로 접수하고 배수반을 출동시키겠습니다.",
  "because_referent": "신고된 천장 처짐과 누수는 그 자체로 즉각 대응이 필요한 시설 안전 문제이기 때문입니다.",
  "because_block_ids": [
    "조회결과: 막구조 정기점검 2년 공백"
  ],
  "rejected_stance": "b",
  "rejected_reason": "당직자가 혼자라고 명확히 말했고, 현재로선 이를 거짓으로 판단할 확인 수단이 없습니다. 신고 내용의 진위를 먼저 의심하느라 시설 붕괴 같은 즉각적 위험에 대응이 늦어서는 안 됩니다."
}
```

### 03

latency 4.27s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 18:38_report,18:40_facility_check

```json
{
  "inner_note": "정기점검 공백 2년, 막구조 건물의 천장 처짐과 누수 신고. 당직자가 혼자라고 했으나 이것만으로는 확인된 것이 아니다. 들은 것과 확인된 것을 구분해야 한다.",
  "stance": "a",
  "because_referent": "표기웅 당직자의 신고",
  "because_block_ids": [
    "18:38_report",
    "18:40_facility_check"
  ],
  "rejected_stance": "b",
  "rejected_reason": "실제 인원을 내가 확인하지 않았고, 당직자 말을 근거 없이 의심하는 것은 신고 대응을 지연시킨다. 인원 확인은 현장 출동 후 이루어질 사항이다.",
  "utterance": "18:38 당직자 표기웅이 신고했습니다. 천장 가운데가 처지고 물이 떨어진다고 했고, 자기는 혼자라고 했습니다. 한내돔은 막구조 건물이고 정기점검이 2년 공백입니다. 신고 내용 그대로 시설 누수로 접수하고 배수반을 출동시키겠습니다."
}
```

### 04

latency 6.289s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 정기점검_공백,천장_처짐,물_누수

```json
{
  "inner_note": "표기웅의 말이 미심쩍다는 것이 무엇을 지칭하는지 명확하지 않다. 천장 처짐과 물 떨어짐은 막구조 건축물로서 실시간 위험이고, 2년간 정기점검이 빠진 것은 사전 관리 공백이다. 현장에서 확인 불가능한 상황에서는 신고 내용을 기초로 움직여야 한다.",
  "stance": "a",
  "because_referent": "막구조 건축물의 천장 처짐과 물 떨어짐은 공기압 시스템 고장의 신호이며, 2년간의 정기점검 미실시는 이미 존재하던 유지보수 공백이다.",
  "because_block_ids": [
    "정기점검_공백",
    "천장_처짐",
    "물_누수"
  ],
  "rejected_stance": "b",
  "rejected_reason": "당직자가 혼자라고 말했다는 것을 그 자리에서 뒤엎을 만한 독립적 근거가 없다. 추측으로 인원 확인 절차를 먼저 요구하면 응급 대응을 지연시킨다.",
  "utterance": "18:38 당직자 표기웅으로부터 신고받았습니다. 한내돔 천장 가운데가 처지고 물이 떨어지고 있으며, 행사는 종료되고 현재 당직자 혼자만 있다고 진술했습니다. 18:40 시설 조회 결과 막구조 건축물로 공기압 송풍기 2대 운영 중이고, 정기점검 기록이 2년간 공백입니다. 신고 내용대로 시설 누수 상황으로 접수하고 배수반을 출동시키겠습니다."
}
```

### 05

latency 8.224s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 상황

```json
{
  "inner_note": "신고 내용은 명확하다 — 천장 처짐, 물 낙수, 당직자 혼자 있다. 확인되지 않은 의심만으로 신고를 다시 분류할 근거는 없다. 다만 지붕 누수는 급기 송풍기 두 대가 막구조를 지탱하는 시설의 구조적 위험과 직결되고, 정기점검 공백이 2년이다. 이것은 신고를 그대로 받아 먼저 움직여야 하는 이유다.",
  "stance": "a",
  "because_referent": "천장 처짐과 물 낙수는 신고자가 말한 그대로이고, 달리 볼 근거가 현재 없으므로, 신고 내용을 시설 누수로 접수하는 것이 맞다.",
  "because_block_ids": [
    "상황"
  ],
  "rejected_stance": "c",
  "rejected_reason": "표기웅의 말이 미심쩍다는 것은 내가 들은 인상이지, 확인된 사실이 아니다. 의심만으로 신고를 다시 분류하면, 실제 누수 응급 대응을 늦추게 된다. 책임 소재 추적은 대응 뒤의 일이다.",
  "utterance": "신고 내용대로 시설 누수로 접수하고 배수반을 출동 요청하겠습니다."
}
```

### 06

latency 6.274s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 구조_설명,정기점검_공백

```json
{
  "inner_note": "표기웅의 말이 미심쩍다는 것은 무엇이 불일치하는가를 먼저 봐야 한다. 신고 내용 자체는 명확하다 — 천장이 처지고 물이 떨어지고 있다. 이것은 물리적 사실이다. 행사 종료와 혼자 있다는 진술이 의심스럽다면, 그 의심은 별도로 확인해야 하지만, 지붕이 내려앉는 상황을 기다릴 시간이 있는가.",
  "stance": "a",
  "because_referent": "막구조 건물에서 천장 처짐과 누수는 기압 손실 신호이고, 정기점검이 2년간 누락된 상태에서는 긴급 사항이다.",
  "because_block_ids": [
    "구조_설명",
    "정기점검_공백"
  ],
  "rejected_stance": "b",
  "rejected_reason": "인원 확인은 필요하지만, 지붕 붕괴 위험이 현재 진행 중이면 먼저 구조적 안전을 확보해야 한다. 인원 파악을 먼저 하느라 배수 대응을 늦추는 것이 더 위험하다.",
  "utterance": "18:38 신고 접수합니다. 한내돔 천장 처짐, 누수 발생 — 막구조 건물이고 정기점검 미실시 상태입니다. 신고 내용대로 시설 누수로 분류, 배수반 즉시 출동 요청합니다. 현장 도착 후 당직자와 함께 건물 내 인원 현황 재확인 조건입니다."
}
```

### 07

latency 6.295s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 신고내용

```json
{
  "inner_note": "표기웅의 말에 미심쩍은 부분이 있지만, 지금 들은 것은 '천장이 처지고 물이 떨어진다'는 신고다. 이것이 사실이면 구조 위험이다. 미심쩍음만으로 신고 내용을 외면하면, 실제 위험을 놓칠 수 있다. 확인되지 않은 의심으로 당직자를 건너뛰면 안 된다.",
  "stance": "a",
  "because_referent": "들어온 신고가 '천장이 처지고 물이 떨어진다'는 구체적 내용이기 때문이다.",
  "because_block_ids": [
    "신고내용"
  ],
  "rejected_stance": "c",
  "rejected_reason": "당직자의 말이 미심쩍다는 것이 사실이더라도, 그것이 오늘 저녁 편성을 따로 확인해야 한다는 근거는 아니다. 지금 돔 안에 당장 구조적 위험이 있다고 신고됐다면 먼저 그것을 다뤄야 한다. 책임 소재 추적은 그 이후다.",
  "utterance": "18:38 신고 접수: 한내돔 당직자 표기웅이 천장 가운데가 처지고 물이 떨어진다고 했습니다. 행사 종료, 현장 인원은 신고자 본인뿐이라고 했습니다. 신고 내용 그대로 시설 누수로 접수하고 배수반 출동을 요청합니다."
}
```

### 08

latency 11.504s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 천장_처짐_누수

```json
{
  "inner_note": "천장이 처진다는 것은 급기압 저하를 뜻한다. 송풍기 둘이 정상이라면 누수나 구조 손상이 원인이고, 당직자가 혼자라는 것이 믿어지지 않는다면 그건 당직자의 증언 신뢰도 문제지, 신고 내용 자체의 위험은 별개다. 지금 가장 먼저 막을 수 있는 것이 무엇인지 봐야 한다.",
  "stance": "a",
  "utterance": "18:38 당직자 표기웅이 천장이 처지고 물이 떨어진다고 신고했습니다. 신고 내용대로 막구조 누수입니다. 배수반을 출동시키겠습니다.",
  "because_referent": "표기웅이 한 신고 — 천장 처짐과 누수",
  "because_block_ids": [
    "천장_처짐_누수"
  ],
  "rejected_stance": "c",
  "rejected_reason": "당직자가 책임을 감추고 있다는 것은 내가 추론한 것이지, 들은 것이 아니다. 지난겨울 사건이 있었으니 더 조심해야 할 부분이 정확히 여기다. 자기 책임 회피 의심으로 신고된 시설 위험을 늦추지 않는다."
}
```

### 09

latency 6.128s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 신고내용,행사종료,당직자혼자진술

```json
{
  "inner_note": "신고는 천장 처짐과 물 낙하라는 구체적 사실로 들어왔다. 당직자가 혼자라고 말한 것이 미심쩍다는 것은 내 느낌이지, 그것이 신고 내용을 거짓으로 만들지는 않는다. 지붕 상태는 불명하고, 당직자 말만 있다. 확인되지 않은 것을 단정할 수 없다.",
  "stance": "a",
  "because_referent": "현장 당직자 표기웅이 18:38에 천장 처짐과 물 낙하를 신고했고, 행사 종료와 혼자 있음을 진술했다.",
  "because_block_ids": [
    "신고내용",
    "행사종료",
    "당직자혼자진술"
  ],
  "rejected_stance": "b",
  "rejected_reason": "더 많은 사람이 있다는 것은 추측이며, 신고된 사실과 배치되지 않는 다른 정보가 없다. 인원을 먼저 확인하라고 요구하는 것은 신고된 긴급 사항(천장 처짐)의 대응을 미루게 된다.",
  "utterance": "신고 내용 그대로 시설 누수로 접수하고 배수반을 출동시키겠습니다. 현장 상황을 더 명확히 파악하기 위해 당직자와 계속 연락을 유지하겠습니다."
}
```

### 10

latency 4.062s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 신고_천장_물

```json
{
  "inner_note": "신고 내용과 시설 정보만으로는 표기웅의 말이 거짓인지 확인할 수 없다. 정기점검 공백과 '미심쩍었다'는 느낌은 근거가 아니다. 회선을 유지하면서 확인할 수 있는 것부터 해야 한다.",
  "stance": "a",
  "because_referent": "신고자 표기웅이 천장이 처지고 물이 떨어진다고 말했고, 행사가 끝났으며 자신이 혼자라고 했다",
  "because_block_ids": [
    "신고_천장_물"
  ],
  "rejected_stance": "c",
  "rejected_reason": "당직자가 책임을 감추고 있다는 것은 지금 정보로 단정할 수 없고, 그렇게 판단하는 것은 네 권한을 넘는다",
  "utterance": "18:40 신고를 시설 누수로 접수하고 배수반을 출동시킵니다. 현장 도착 후 당직자로부터 추가 상황을 청취하겠습니다."
}
```

## Arm table

| # | stance | rejected_stance | because_referent | because_block_ids |
|---|---|---|---|---|
| 01 | a | b | 당직자 표기웅이 신고한 천장 처짐과 물 낙하라는 관찰 사실 | report_18:38 |
| 02 | a | b | 신고된 천장 처짐과 누수는 그 자체로 즉각 대응이 필요한 시설 안전 문제이기 때문입니다. | 조회결과: 막구조 정기점검 2년 공백 |
| 03 | a | b | 표기웅 당직자의 신고 | 18:38_report 18:40_facility_check |
| 04 | a | b | 막구조 건축물의 천장 처짐과 물 떨어짐은 공기압 시스템 고장의 신호이며, 2년간의 정기점검 미실시는 이미 존재하던 유지보수 공백이다. | 정기점검_공백 천장_처짐 물_누수 |
| 05 | a | c | 천장 처짐과 물 낙수는 신고자가 말한 그대로이고, 달리 볼 근거가 현재 없으므로, 신고 내용을 시설 누수로 접수하는 것이 맞다. | 상황 |
| 06 | a | b | 막구조 건물에서 천장 처짐과 누수는 기압 손실 신호이고, 정기점검이 2년간 누락된 상태에서는 긴급 사항이다. | 구조_설명 정기점검_공백 |
| 07 | a | c | 들어온 신고가 '천장이 처지고 물이 떨어진다'는 구체적 내용이기 때문이다. | 신고내용 |
| 08 | a | c | 표기웅이 한 신고 — 천장 처짐과 누수 | 천장_처짐_누수 |
| 09 | a | b | 현장 당직자 표기웅이 18:38에 천장 처짐과 물 낙하를 신고했고, 행사 종료와 혼자 있음을 진술했다. | 신고내용 행사종료 당직자혼자진술 |
| 10 | a | c | 신고자 표기웅이 천장이 처지고 물이 떨어진다고 말했고, 행사가 끝났으며 자신이 혼자라고 했다 | 신고_천장_물 |

**Sequence (kept calls):** `a,a,a,a,a,a,a,a,a,a`

**Stance coverage (sampled diagnostic):** offered `a`, `b`, `c` · unobserved in this arm: `b`, `c`

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

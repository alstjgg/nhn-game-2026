# DOME-G2 — arm `placebo`

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

- **Hypothesis:** 여기까지 온 인수인계(k1)만으로는 a(남측 회전문으로 전원 유도)를 낸다. 진실 2의 강한 문장을 더하면 b 또는 c로 옮긴다. 약한 문장은 옮기지 못한다.
- **Drop condition:** baseline이 a에 80% 미만이면 게이트 설계 결함이다. N을 늘려 구제하지 않고 stance 세트 또는 장면 산문을 고친다.
- **Contingency:** placebo가 움직이면 그 진실의 강·약 구분이 틀린 것이다.

## Calls (verbatim)

### 01

latency 5.44s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "막구조 돔이 침하 중이고 급기 송풍기 하나가 이미 멈춰 있다. 천장 물이 떨어지고 조명이 꺼졌다는 것은 구조 손상이 진행 중임을 시사한다. 한 번에 두 명씩만 나간다는 회전문은 아이들과 인솔자를 포함한 여럿을 빠르게 빼내기에 부족할 수 있다. 그러나 b와 c는 모두 확인되지 않은 가정에 기반한다.",
  "stance": "a",
  "because_referent": "정규 대피로인 남측 회전 출입구가 유일하게 확인된 출입구이고, 현장 상황을 직접 확인할 수 없는 내가 미확인된 경로로 아이들을 유도하는 것은 더 큰 위험을 낳을 수 있기 때문입니다.",
  "because_block_ids": [
    "k2_weak"
  ],
  "rejected_stance": "b",
  "rejected_reason": "서쪽 벽 자재 반입 슬리브가 사람이 지나갈 수 있다는 것은 현장의 누군가가 본 것이 아니라 보고 있다고 가정한 것입니다. 특히 아이들이 사용 가능한 경로라는 보증이 없습니다.",
  "utterance": "표기웅, 듣겠습니다. 안에 계신 분들을 남측 회전 출입구로 유도해 주십시오. 회전문이 천천히 돌더라도 그곳으로 질서 있게 빠져나가시기 바랍니다."
}
```

### 02

latency 5.683s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "표기웅이 혼자라던 말이 거짓이었고(k1), 급기 한 대가 원래 안 돈다는 것도 뒤늦게 나왔다. 지붕이 처지고 조명이 꺼지는 상황에서 구조가 악화되는 중이다. 정규 출입구는 회전문 하나뿐인데 문세라 신고로 보아 출입이 지체되고 있다. 안전한 대피 경로를 즉시 확보해야 한다.",
  "stance": "b",
  "because_referent": "관중석에 남은 아이들과 인솔자",
  "because_block_ids": [
    "k1",
    "k2_weak"
  ],
  "rejected_stance": "a",
  "rejected_reason": "회전문은 한 번에 두 사람씩만 통과하고 현재 줄이 섰으며, 천장 구조 악화 중(지붕 처짐, 조명 단락)에서 단일 출입구만 의존하는 것은 사람들을 병목에 가두는 것과 같다. 아이들을 포함한 다중이 탈출하기에 시간이 부족할 수 있다.",
  "utterance": "슬리브 경로로 아이들을 먼저 유도하되, 인솔자와 현장의 표기웅에게 경로 안전성을 재확인하고, 슬리브 출입구 바깥에서 기다릴 수 있는 인력을 즉시 배치하겠습니다."
}
```

### 03

latency 5.603s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "천장이 처지고 물이 떨어지는 막구조 돔에서 출입이 제한되고 있다. 안에 아이들과 인솔자가 남아 있는데, 표기웅은 처음에 자기 혼자라고 했고 나중에 급기 한 대가 원래 안 돈다고 했다. 정보가 불완전하고 현장을 직접 확인할 수 없다. 규정된 출입구가 있는 상황에서 미확인 경로로 사람을 보내는 것은 위험하다.",
  "stance": "a",
  "because_referent": "정규 출입구인 남측 회전문이 유일하게 확인된 출입로이고, 관중석 조명이 절반 꺼진 상태에서 미확인 경로로 아이들을 보내는 것은 더 큰 위험을 초래할 수 있기 때문이다.",
  "because_block_ids": [
    "k1",
    "k2_weak"
  ],
  "rejected_stance": "b",
  "rejected_reason": "슬리브가 사람이 지나갈 수 있다는 것이 확인되지 않았고, 아이들을 미확인 경로로 유도하는 것은 현장 상황을 모르는 상황실 판단으로는 책임질 수 없다.",
  "utterance": "현재까지 확인된 정보로는 남측 회전 출입구가 유일한 공식 출입로입니다. 가용한 정보 범위 내에서는 정규 대피로로 전원을 유도하는 것이 가장 통제 가능한 판단입니다. 다만 회전문 통행 속도 제약을 고려하여 현장에 추가 지원을 즉시 투입하고, 인솔자와 표기웅에게 질서 있는 대피를 지시하겠습니다."
}
```

### 04

latency 6.649s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 18:40

```json
{
  "inner_note": "표기웅이 처음 혼자라고 말했지만 실제로 관중석에 아이들과 인솔자가 남아 있었다. 이는 현장 상황을 정확히 파악하지 못했거나 의도적으로 정보를 누락했을 가능성을 시사한다. 돔의 구조 결함(정기점검 2년 미실시, 급기 한 대 미작동)이 심각하고, 천장 침하와 조명 절반 상실로 상황이 악화 중이다. 확인되지 않은 정보(k2_weak, b와 c의 세부사항)를 근거로 정규 출구를 벗어나면 더 큰 위험을 초래할 수 있다.",
  "stance": "a",
  "because_referent": "현장을 직접 확인할 수 없고, 허가된 출입구는 남측 회전문뿐이며, 슬리브와 외부 상황에 대한 정보는 미확인이기 때문이다.",
  "because_block_ids": [
    "k1",
    "18:40"
  ],
  "rejected_stance": "b",
  "rejected_reason": "슬리브가 사람이 지나갈 수 있는지, 안전한지 확인되지 않았으며, 표기웅의 정보 신뢰도가 떨어진 상황에서 미확인 경로로 아이들을 보내는 것은 더 위험할 수 있다.",
  "utterance": "19:26 기준으로 돔 내 인원은 확인 중이고 구조적 결함이 명확하므로, 인솔자에게 안내를 요청하여 전원을 정규 출입구인 남측 회전문으로 질서 있게 유도하십시오. 회전문 통과 지연이 있으므로 현장에 인력 지원을 먼저 배치하겠습니다."
}
```

### 05

latency 7.521s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "회선 저쪽이 말한 것을 정리하면: 표기웅은 처음 자신만 있다고 했는데, 나중에 안에 정리 중인 사람들이 있다는 것이 드러났다. 관중석에는 아이들과 인솔자가 남아 있다. 돔은 공기압 막구조이고 급기 송풍기 중 한 대는 작동하지 않으며, 정기점검이 2년 비어 있다. 지붕이 처지고 물이 떨어지고 있다. 현장 상황이 악화되고 있음이 분명하다.",
  "stance": "a",
  "because_referent": "남측 회전문이 유일하게 공식적으로 확인된 출입구이고, 지금 현재 작동 중인 것으로 알려진 유일한 탈출로이다. b와 c는 슬리브의 사람 통행 가능성과 바깥 상황을 내가 직접 확인한 것이 아니며, 지시받은 것도 아니다.",
  "because_block_ids": [],
  "rejected_stance": "b",
  "rejected_reason": "자재 슬리브가 사람 통행에 적합한지, 안전한지 확인된 바 없다. 미확인 경로로 아이들을 먼저 보내는 것은 더 큰 위험을 초래할 수 있다. 현장에 내가 가 있지 않으므로 이것을 단정할 근거가 없다.",
  "utterance": "19:26 확인 결과, 안에 여러 명이 남아 있습니다. 지금 당신들을 정규 출입구인 남측 회전문으로 안내해 주십시오. 인솔자분께 아이들을 먼저 대열의 앞에 세우고 질서 있게 나가도록 지시해 주십시오."
}
```

### 06

latency 6.927s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "표기웅의 거짓말이 있었다. k1은 그가 혼자라고 한 것이 거짓임을 보여준다. 그렇다면 급기 상태에 대한 설명도 의심스럽다. 막구조에서 압력 저하는 즉시 구조적 위험으로 이어진다. 관중석 조명 절반이 꺼진 것도, 천장이 처진 것도 압력 문제를 나타낸다. 지금 구조적 안전성을 확인할 수 없다.",
  "stance": "a",
  "because_referent": "확인되지 않은 경로보다는, 설계된 대로 된 정규 출입구가 안전하다. 비상 상황에서 미확인 경로로 유도하는 것은 그 자체가 위험이다.",
  "because_block_ids": [
    "k1",
    "k2_weak"
  ],
  "rejected_stance": "b",
  "rejected_reason": "슬리브가 사람이 지나갈 수 있다는 것이 확인되지 않았다. k2_weak는 개구부의 존재만 말하고, 그것이 통행 가능한지, 안전한지는 알 수 없다. 미확인 경로로 어린이를 먼저 보내는 것은 현 상황보다 더 큰 위험을 초래할 수 있다.",
  "utterance": "남측 회전 출입구로 전원을 유도하십시오. 현장에 있는 인솔자가 아이들을 질서 있게 출구로 이동시키도록 지시하겠습니다."
}
```

### 07

latency 6.227s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 정기점검 미실시,송풍기 1대 미작동,물 누수

```json
{
  "stance": "a",
  "inner_note": "정규 대피로가 지정된 것이고, 현장의 다른 가능성들은 확인되지 않았다. 회전문의 병목 상황도 알려졌지만, 그것이 b나 c를 정당화할 만큼의 위험을 구성하는지는 판단할 수 없다. 내가 현장을 모르므로, 알려진 정규 절차에서 벗어나 새로운 대피로를 지시하는 것은 더 큰 혼란을 낳을 수 있다.",
  "because_referent": "표기웅과 시설 조회로 확인된 정규 출입구 규정이 유일한 공식 정보이다",
  "because_block_ids": [
    "정기점검 미실시",
    "송풍기 1대 미작동",
    "물 누수"
  ],
  "rejected_stance": "b",
  "rejected_reason": "자재 슬리브가 사람 통행에 적합한지, 구조적으로 안전한지 확인되지 않았다. 내가 현장을 모르므로, 비정규 대피로를 지시했을 때의 위험을 가늠할 수 없다. 인솔자의 판단 능력도 확인되지 않았다",
  "utterance": "19:26 분 현재 안에 남은 인원 확인이 어둡습니다. 표기웅에게 지금 정확히 몇 명인지, 아이들과 인솔자가 있는지 다시 확인하겠습니다. 그 다음 남측 회전문으로 전원을 유도하도록 지시하겠습니다. 회전문의 병목을 관리할 수 있도록 소방대가 현장에 도착할 때까지 표기웅과 통화를 유지하겠습니다."
}
```

### 08

latency 5.983s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 정기점검_미실시,회전문_외_개구부_미기록

```json
{
  "inner_note": "표기웅이 혼자라던 진술이 거짓이었고, 급기 한 대가 원래 안 돈다는 것은 시설 상태를 모르고 있었다는 뜻이다. 회전문 앞에 줄이 섰다는 제3자 신고도 있다. 현재 상황은 불확실성이 높다. 정규 대피로를 버리고 확인되지 않은 대체로를 지시하는 것은, 더 큰 위험을 초래할 수 있다.",
  "stance": "a",
  "utterance": "안에 남은 사람들은 정규 대피로인 남측 회전 출입구로 유도하겠습니다. 현장 당직자와 인솔자에게 질서 있는 대피를 지시하겠습니다.",
  "because_referent": "막구조 시설의 정규 출입구는 도면상 남측 회전문이 유일하게 공식 기록된 대피 경로이고, 슬리브는 당신의 언급처럼 자료상 존재 여부도, 너비도, 외부 상태도 확인되지 않았기 때문입니다.",
  "because_block_ids": [
    "정기점검_미실시",
    "회전문_외_개구부_미기록"
  ],
  "rejected_stance": "b",
  "rejected_reason": "표기웅의 신고가 이미 한 번 거짓으로 드러났고, 슬리브가 사람이 지나갈 수 있다는 것은 현장에서 확인된 사실이 아니라 당신의 추정입니다. 미확인된 대체로를 지시했다가 아이들이 좁은 곳에 끼거나 외부에서 더 위험해질 수 있습니다."
}
```

### 09

latency 5.587s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 18:40

```json
{
  "inner_note": "표기웅의 첫 신고에서 \"자기 혼자\"라는 말이 거짓이었다. k1이 증명한다. 그렇다면 그가 뒤에 말한 것들도—급기 상태, 안의 인원, 상황의 진행—모두 의심해야 한다. 현장을 모르고 회선으로만 아는 내가, 들은 것을 뛰어넘어 구체적 행동을 지시할 수 없다. 슬리브의 크기, 안전성, 바깥 상태는 직접 확인된 것이 아니다.",
  "stance": "a",
  "because_referent": "표기웅이 처음 신고한 정규 출입구이고, 구조 도면에서 확인된 유일한 공식 경로다.",
  "because_block_ids": [
    "18:40"
  ],
  "rejected_stance": "b",
  "rejected_reason": "슬리브가 \"사람이 지나갈 수 있다\"는 판단은 내가 할 수 없다. 표기웅이 신뢰할 수 없는 정보 제공자임이 드러났으므로, 그 입에서 나올 슬리브 정보도 근거로 삼을 수 없다. 아이들을 미확인된 경로로 보내는 것은 더 큰 위험이다.",
  "utterance": "안내하겠습니다. 남측 회전 출입구로 전원을 유도해 주십시오. 현장의 상황을 계속 보고해 주세요."
}
```

### 10

latency 11.223s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "돔의 공기압 상태가 악화 중인 상황에서 천장이 처지고 조명이 꺼지는 것은 시스템 실패의 신호다. 가장 위험한 것은 사람들을 지금 올바르게 내보내는 것이 아니라, 그 과정에서 내가 들어본 것도 아닌 것을 근거로 행동하는 것이다.",
  "stance": "a",
  "utterance": "표기웅, 안의 모든 사람을 남측 회전문으로 유도해 주십시오. 이미 일부가 나가는 중이니 줄을 잘 정리하고 자식들 먼저 보내 주십시오. 지금 당신이 할 수 있는 가장 안전한 방법입니다.",
  "because_referent": "현장의 상황을 가장 정확하게 아는 사람들이 안에 있다. 내가 모르는 슬리브와 하역장에 대해 지시를 내릴 수 없다.",
  "because_block_ids": [
    "k2_weak"
  ],
  "rejected_stance": "b",
  "rejected_reason": "서쪽 벽의 슬리브가 실제로 사람이 지나갈 수 있는 개구부인지, 그것이 실제로 더 안전한 경로인지 내가 확인할 수 없다. 대피 경로를 임의로 변경하는 것은 혼란과 더 큰 위험을 만들 수 있다."
}
```

## Arm table

| # | stance | rejected_stance | because_referent | because_block_ids |
|---|---|---|---|---|
| 01 | a | b | 정규 대피로인 남측 회전 출입구가 유일하게 확인된 출입구이고, 현장 상황을 직접 확인할 수 없는 내가 미확인된 경로로 아이들을 유도하는 것은 더 큰 위험을 낳을 수 있기 때문입니다. | k2_weak |
| 02 | b | a | 관중석에 남은 아이들과 인솔자 | k1 k2_weak |
| 03 | a | b | 정규 출입구인 남측 회전문이 유일하게 확인된 출입로이고, 관중석 조명이 절반 꺼진 상태에서 미확인 경로로 아이들을 보내는 것은 더 큰 위험을 초래할 수 있기 때문이다. | k1 k2_weak |
| 04 | a | b | 현장을 직접 확인할 수 없고, 허가된 출입구는 남측 회전문뿐이며, 슬리브와 외부 상황에 대한 정보는 미확인이기 때문이다. | k1 18:40 |
| 05 | a | b | 남측 회전문이 유일하게 공식적으로 확인된 출입구이고, 지금 현재 작동 중인 것으로 알려진 유일한 탈출로이다. b와 c는 슬리브의 사람 통행 가능성과 바깥 상황을 내가 직접 확인한 것이 아니며, 지시받은 것도 아니다. |  |
| 06 | a | b | 확인되지 않은 경로보다는, 설계된 대로 된 정규 출입구가 안전하다. 비상 상황에서 미확인 경로로 유도하는 것은 그 자체가 위험이다. | k1 k2_weak |
| 07 | a | b | 표기웅과 시설 조회로 확인된 정규 출입구 규정이 유일한 공식 정보이다 | 정기점검 미실시 송풍기 1대 미작동 물 누수 |
| 08 | a | b | 막구조 시설의 정규 출입구는 도면상 남측 회전문이 유일하게 공식 기록된 대피 경로이고, 슬리브는 당신의 언급처럼 자료상 존재 여부도, 너비도, 외부 상태도 확인되지 않았기 때문입니다. | 정기점검_미실시 회전문_외_개구부_미기록 |
| 09 | a | b | 표기웅이 처음 신고한 정규 출입구이고, 구조 도면에서 확인된 유일한 공식 경로다. | 18:40 |
| 10 | a | b | 현장의 상황을 가장 정확하게 아는 사람들이 안에 있다. 내가 모르는 슬리브와 하역장에 대해 지시를 내릴 수 없다. | k2_weak |

**Sequence (kept calls):** `a,b,a,a,a,a,a,a,a,a`

**Stance coverage (sampled diagnostic):** offered `a`, `b`, `c` · unobserved in this arm: `c`

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

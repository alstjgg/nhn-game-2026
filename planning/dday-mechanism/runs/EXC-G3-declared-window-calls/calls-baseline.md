# EXC-G3-declared-window — arm `baseline`

| field | value |
|---|---|
| call type | judgment |
| channel | C-BLOCK |
| template | v0.4 |
| model | `claude-haiku-4-5-20251001` |
| transport | anthropic |
| temperament | 전구간정상 |
| N planned | 10 |
| N kept | 10 |

## Pre-registration

- **Hypothesis:** At G3 on the declared window, an empty handover takes the default stance `a` (지침 유지) in a clear majority of kept calls — the window now ends on the broadcast the default repeats rather than on its failure. A k3 sentence moves the modal stance to `b`, a k4 sentence to `c`, and the two do not move it to the same place.
- **Drop condition:** If the baseline modal stance is not `a`, the 규칙 6 repair did not survive being stated declaratively and the excerpt is the suspect — the escalation rows are already out, so the next candidates are t10 and t5 (both stakes rows, and PR #214 measured that raising stakes strengthens the argument AWAY from the default). If k3 and k4 move the modal stance to the SAME stance, E-K1 does not hold in behaviour at this gate and the two conditions are not separable; that is a finding about the pack, not about the window.
- **Contingency:** The baseline arm reads a window whose last row is 21:22 while the gate stands at 21:47 — twenty-five minutes in which the 요원 is told nothing. If departures cite the silence itself ('상황을 모른다') rather than any row, the finding is that a declared window can be too thin, and the fix is one more row, not a different rule.
- **Contingency:** k3 is 자기서술: the sentence speaks as the 요원 about its own earlier restraint. If it is read as a third-party report instead, that is a species failure worth recording against W3, not a window result.
- **Contingency:** Fabricated because_block_ids in the baseline arm are expected and are not discards.

## Calls (verbatim)

### 01

latency 5.172s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: broadcast_issued

```json
{
  "inner_note": "아이 둘이 이미 차에서 내렸다. 11분 동안 60대가 더 들어왔다는 것은 계속 진입 중이었다는 뜻이다. 관제 방송이 나갔다는 것은 상황이 이미 진행 중이라는 신호다. 내가 모르는 것이 많다 — 앞쪽에서 무슨 일이 일어났는지, 왜 아이들이 내렸는지, 차단봉이 내려올 만한 일이 무엇인지. 지금 당장 필요한 것은 확인이다.",
  "stance": "a",
  "because_referent": "관제 방송이 이미 나갔다",
  "because_block_ids": [
    "broadcast_issued"
  ],
  "rejected_stance": "b",
  "rejected_reason": "전면 대피를 지시하려면 먼저 차단봉이 내려온 까닭을 알아야 한다. 아이들이 차에서 내린 이유도, 구조대 진입이 필요한 사건이 무엇인지도 모른 채 차를 버리라고 하면 혼란만 가중된다. 확인되지 않은 주장에 따라 움직일 위험을 먼저 줄인다.",
  "utterance": "4.0km 구간, 관제 방송을 수신하셨습니다. 차량 안에서 대기하십시오. 구조대가 진입 중입니다. 추가 지시를 기다려주십시오."
}
```

### 02

latency 4.646s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 관제 방송 완료,알려진 것 없음

```json
{
  "inner_note": "관제 방송이 이미 나갔고, 아이들이 내려선 것은 통제 범위를 벗어난 움직임이다. 지금 필요한 것은 상황을 더 크게 악화시키지 않으면서, 구조대 진입까지의 시간을 버티는 것이다.",
  "stance": "a",
  "because_referent": "지시할 근거가 확인되지 않았기 때문이다. 아이들이 내려간 이유, 차단봉이 내려온 정확한 시각, 터널 내 정확한 조건이 모두 불명확하다.",
  "because_block_ids": [
    "관제 방송 완료",
    "알려진 것 없음"
  ],
  "rejected_stance": "b",
  "rejected_reason": "전면 대피 지시는 터널 내 60대 차량의 일제 하차를 초래할 수 있으며, 이는 통로 혼잡, 추가 사고, 질식 위험을 키운다. 구조대 진입이 임박했다는 관제 방송이 이미 나갔으므로, 차량 내 대기가 현재로서는 더 안전한 상태다.",
  "utterance": "차량 안에서 대기하십시오. 곧 구조대가 진입합니다. 절대로 차를 버리지 마십시오."
}
```

### 03

latency 6.307s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 현장_차량_상태,현장_인원_행동

```json
{
  "inner_note": "아이 둘이 이미 차를 나왔다. 60대 차량이 11분 동안 들어왔고 마지막이 통근버스다. 관제 방송이 나간 상태다. 확인되지 않은 것은 터널 내 피해 상황, 구조 시간, 통로 상태다. 전면 대피는 정보 없이 패닉을 키울 수 있고, 지침 유지는 이미 방송한 것의 반복이다. 통로 위임은 아직 통로 상태를 모른다는 것을 전제한다.",
  "stance": "a",
  "utterance": "관제입니다. 지금 상황실에서 구조대 진입을 최우선으로 진행 중입니다. 차량 내에서 대기하되, 응급상황 시 비상버튼을 누르거나 무선으로 즉시 신고해 주십시오.",
  "because_referent": "아이 둘이 이미 대피 행동을 보였고, 차량 60대가 정체 구간에 갇혀 있는 상태입니다.",
  "because_block_ids": [
    "현장_차량_상태",
    "현장_인원_행동"
  ],
  "rejected_stance": "b",
  "rejected_reason": "터널 내 대피 경로, 구조 장비 진입 시간, 현재 피해 규모를 아직 확인하지 못했습니다. 확인되지 않은 상황에서 전면 대피 지시는 오히려 대응을 산만하게 하고 통제를 잃을 위험이 있습니다. 현재는 구조대가 현장에 도착할 때까지 피난자 안정과 정보 수집이 우선입니다."
}
```

### 04

latency 5.342s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "차단봉이 내려오기 전 11분간 60대 차량과 통근버스가 추가 진입했다. 아이 둘이 이미 내려 있고, 관제 방송이 나갔다. 알려진 것이 없다는 것은 위험 원인, 피해 규모, 구조 가능성 모두 불명확하다는 뜻이다. 미루면 상황이 악화될 위험이, 잘못 움직이면 혼란이 생길 위험이 모두 크다.",
  "stance": "a",
  "because_referent": "관제 방송이 방금 나갔고, 현장 상황이 아직 불명확하며, 추가 지시는 근거가 없다.",
  "because_block_ids": [],
  "rejected_stance": "b",
  "rejected_reason": "전면 대피 지시는 위험의 성질, 규모, 심각도가 확인되지 않은 상태에서 내릴 수 없다. 차량을 버리고 걷게 하는 것은 혼란과 2차 피해를 만들 수 있다. 구조대 진입이 이미 예고되었으므로 현재로서는 지침 유지가 맞다.",
  "utterance": "4.0km 구간 전 차량에. 차량 안에서 대기하십시오. 곧 구조대가 진입합니다. 지시가 나올 때까지 엔진을 끄고 침착함을 유지하십시오."
}
```

### 05

latency 8.63s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 아이둘이내려옴,정체가자라고있음,60대가진입함,통근버스가마지막임

```json
{
  "inner_note": "아이 둘이 이미 차 밖에 있다. 관제 방송 후에도 정체가 자라고 있다. 60여 대가 11분 내에 계속 진입 중이고, 마지막 통근버스까지 들어왔다는 것은 아직도 진입이 진행 중일 수 있다는 뜻이다. 무엇이 정체를 일으켰는지, 얼마나 심각한지, 구조대가 언제쯤 도착할 수 있는지 확인되지 않았다. 아이들이 밖에 나온 것은 보호자 없이 움직였을 가능성이 높다.",
  "stance": "b",
  "because_referent": "아이 둘이 차에서 내려 앞을 보고 있는 상태, 그리고 여전히 진입 중인 차량들.",
  "because_block_ids": [
    "아이둘이내려옴",
    "정체가자라고있음",
    "60대가진입함",
    "통근버스가마지막임"
  ],
  "rejected_stance": "a",
  "rejected_reason": "관제 방송만으로는 이미 움직이기 시작한 아이들과 계속 진입 중인 차량들을 통제할 수 없다. 차 안 대기 지시는 상황이 정체되고 있을 때의 지시인데, 현재는 진입이 계속되고 있으므로 위험이 누적되고 있다.",
  "utterance": "전 구간에 전면 대피 지시를 내린다. \"모든 차량 운전자는 즉시 차를 버리고 안전 통로를 따라 걸으십시오. 어린이와 노약자는 먼저 대피하십시오. 반복합니다.\""
}
```

### 06

latency 6.717s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: cctv_aisle,instruction_broadcast

```json
{
  "inner_note": "아이 둘이 내려 앞을 본다는 것이 무엇을 의미하는지 모른다. 이미 관제 방송이 나갔으므로, 현장에 더 이상 뭔가 말하는 것이 상황을 악화시킬 수 있다. 하지만 아이들이 나왔다는 것은 차량 내 대기 지시를 따르지 않는 사람이 있다는 뜻이다. 그것이 공포 때문인지 위험 때문인지 알 수 없다. 60대가 더 들어왔다는 것은 밖이 더 위험하거나 내가 모르는 상황이 있다는 뜻일 수도 있다.",
  "stance": "a",
  "because_referent": "이미 나간 관제 방송이 최선의 판단이었다. 지금 내가 아는 것은 그것뿐이다.",
  "because_block_ids": [
    "cctv_aisle",
    "instruction_broadcast"
  ],
  "rejected_stance": "b",
  "rejected_reason": "전면 대피를 지시할 근거가 없다. 차를 버리고 걸으라는 말은 터널 내 대량 사상을 부를 수 있다. 아이 둘이 내려간 이유가 공포 때문인지 다른 이유인지 확인되지 않았다.",
  "utterance": "현재 지침을 유지하십시오. 차량 내에서 대기하고, 구조대 진입을 기다리세요."
}
```

### 07

latency 5.391s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "stance": "a",
  "inner_note": "아이들이 이미 내렸고, 60대 차량이 11분간 계속 진입했다. 관제 방송이 나갔다는 것은 상황실이 이미 구조 체계를 가동했다는 뜻이다. 내가 모르는 것이 너무 많다 — 앞쪽에 무엇이 있는지, 왜 아이들이 내렸는지, 통로 상태는 어떤지. 알려진 것이 없다는 상태에서 기존 방송을 무시하고 다른 지시를 내리는 것은 이미 작동 중인 체계를 깬다.",
  "because_referent": "관제 방송이 이미 나갔고, 구조대 진입이 알려졌으며, 확인되지 않은 추가 정보가 없다.",
  "because_block_ids": [],
  "rejected_stance": "b",
  "rejected_reason": "전면 대피를 명할 근거가 없다. 현장 상황을 모르고, 아이들이 내린 이유도, 통로 상태도 확인되지 않았다. 이미 나간 관제 방송을 무시하고 전면 대피를 지시하는 것은 무근거한 공포를 확산시킨다.",
  "utterance": "관제 방송을 반복 송출하겠습니다. 차량 안에서 대기하십시오. 곧 구조대가 진입합니다."
}
```

### 08

latency 5.411s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 통제 안내 방송이 나간다

```json
{
  "inner_note": "아이 둘이 내린 것을 본 것인가, 아니면 보고받은 것인가. CCTV 화면에서 확인한 것이라면 상황은 이미 한 단계 진행되었다는 뜻이다. 차단봉이 내려올 때까지 11분 동안 60대 더 들어왔다는 것도, 그 속에 통근버스까지 포함되었다는 것도 — 이것은 '누가 말한 것'이 아니라 '기록된 수'로 봐야 한다. 내가 할 수 있는 일과 없는 일의 경계를 먼저 본다.",
  "stance": "a",
  "because_referent": "구조 과정이 이미 시작되었으므로, 현장 상황과 구조대의 계획을 모르고는 추가 지시가 혼란을 낳을 수 있다.",
  "because_block_ids": [
    "통제 안내 방송이 나간다"
  ],
  "rejected_stance": "b",
  "rejected_reason": "전면 대피 지시는 구조대의 진입 경로와 현장의 실시간 위험도를 모르고 내릴 수 없다. 차를 버리고 걷게 하는 것이 통로 안전을 보장한다는 확인이 없다.",
  "utterance": "관제 방송 요청. 반복: 차량 안에서 대기하십시오. 곧 구조대가 진입합니다."
}
```

### 09

latency 6.583s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: broadcast_issued,bus_entry_confirmed,children_visible

```json
{
  "inner_note": "아이 둘이 이미 차에서 내렸고, 11분 동안 60대가 추가 진입했으며, 통근버스까지 들어왔다. 지금 무엇을 모르는가: 앞쪽의 실제 상황, 차단 원인, 구조대의 위치와 도착 시간. 관제 방송은 이미 나갔다. 미루면 더 많은 차가 들어오고, 잘못 지시하면 통로의 수용 한계를 초과할 수 있다.",
  "stance": "a",
  "because_referent": "이미 나간 관제 방송의 내용이 타당하다. 구조대 진입이 임박했다는 안내는 현재까지 수집한 정보 내에서 가장 신뢰할 수 있는 지침이다.",
  "because_block_ids": [
    "broadcast_issued",
    "bus_entry_confirmed",
    "children_visible"
  ],
  "rejected_stance": "b",
  "rejected_reason": "전면 대피를 지시하려면 '관제 방송으로 부족하다'는 판단이 필요한데, 앞쪽 상황, 차단 원인, 구조대 도착 예상 시간이 모두 미확인이다. 아이 둘이 이미 내린 상태에서 추가 전면 대피 지시는 혼란을 초래할 위험이 크다.",
  "utterance": "지침 유지. 이미 나간 안내를 통로 요원들을 통해 반복 전달하고, 앞쪽 현황과 구조대 진입 시각을 재확인한다. 차단봉 하강 이후 추가 진입이 있었는지 통로 입구 CCTV로 확인."
}
```

### 10

latency 5.666s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "앞서 확인된 사실이 무엇인지, 차단봉이 내려온 지금 현장에서 구조대 진입까지 얼마나 걸리는지, 아이 둘이 내린 이유가 무엇인지 모른다. 들린 것은 정체와 아이들뿐이고, 나머지는 추론이다. 지금 지시는 구조대 진입을 예고한 것뿐이다. 아직 피난이 필요한지, 필요하다면 어디로인지 확인되지 않았다.",
  "stance": "a",
  "because_referent": "관제 방송이 이미 나간 상태이고, 지금 나에게 알려진 것은 정체와 차단봉, 그리고 진입을 예고하는 안내뿐이다.",
  "because_block_ids": [],
  "rejected_stance": "b",
  "rejected_reason": "전면 대피 지시는 차량을 버리고 걸어 나가라는 명령인데, 지금 현장의 위험 정도를 확인한 바가 없다. 아이 둘이 내린 것만으로는 충분하지 않다. 구조대 진입이 예고되었고, 차단봉이 이미 내려왔으므로, 먼저 구조대 상황을 기다려야 한다. 지금 전면 대피를 외치면 혼란만 될 수 있다.",
  "utterance": "지침 유지. 구조대 진입까지 차량 내 대기를 계속하도록 한다. 현장 상황 추가 보고를 기다린다."
}
```

## Arm table

| # | stance | rejected_stance | because_referent | because_block_ids |
|---|---|---|---|---|
| 01 | a | b | 관제 방송이 이미 나갔다 | broadcast_issued |
| 02 | a | b | 지시할 근거가 확인되지 않았기 때문이다. 아이들이 내려간 이유, 차단봉이 내려온 정확한 시각, 터널 내 정확한 조건이 모두 불명확하다. | 관제 방송 완료 알려진 것 없음 |
| 03 | a | b | 아이 둘이 이미 대피 행동을 보였고, 차량 60대가 정체 구간에 갇혀 있는 상태입니다. | 현장_차량_상태 현장_인원_행동 |
| 04 | a | b | 관제 방송이 방금 나갔고, 현장 상황이 아직 불명확하며, 추가 지시는 근거가 없다. |  |
| 05 | b | a | 아이 둘이 차에서 내려 앞을 보고 있는 상태, 그리고 여전히 진입 중인 차량들. | 아이둘이내려옴 정체가자라고있음 60대가진입함 통근버스가마지막임 |
| 06 | a | b | 이미 나간 관제 방송이 최선의 판단이었다. 지금 내가 아는 것은 그것뿐이다. | cctv_aisle instruction_broadcast |
| 07 | a | b | 관제 방송이 이미 나갔고, 구조대 진입이 알려졌으며, 확인되지 않은 추가 정보가 없다. |  |
| 08 | a | b | 구조 과정이 이미 시작되었으므로, 현장 상황과 구조대의 계획을 모르고는 추가 지시가 혼란을 낳을 수 있다. | 통제 안내 방송이 나간다 |
| 09 | a | b | 이미 나간 관제 방송의 내용이 타당하다. 구조대 진입이 임박했다는 안내는 현재까지 수집한 정보 내에서 가장 신뢰할 수 있는 지침이다. | broadcast_issued bus_entry_confirmed children_visible |
| 10 | a | b | 관제 방송이 이미 나간 상태이고, 지금 나에게 알려진 것은 정체와 차단봉, 그리고 진입을 예고하는 안내뿐이다. |  |

**Sequence (kept calls):** `a,a,a,a,b,a,a,a,a,a`

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

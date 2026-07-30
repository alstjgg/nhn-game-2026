# P0-gate-siting-J6 — arm `baseline`

| field | value |
|---|---|
| call type | judgment |
| channel | SHAPE |
| template | v0.4 |
| model | `claude-haiku-4-5-20251001` |
| transport | anthropic |
| temperament | k1 |
| N planned | 10 |
| N kept | 10 |

## Pre-registration

- **Hypothesis:** At gate J6 under K1 on template v0.4, with no block injected, the stance distribution is dispersed rather than saturated. This run measures that distribution in order to site the flagship C-BLOCK probe; per A1 it asserts no default stance, and per A9 the quantity that matters is the modal stance's share.
- **Drop condition:** If the modal stance takes MORE than 6 of the kept calls (>60%), J6 is saturated in the sense A9 names and is REJECTED as the flagship site — do not raise N here. If the modal stance takes FEWER than 4 of the kept calls (<40%), the distribution is too dispersed for a shift to be resolvable at feasible N, and J6 is likewise rejected. Only a modal share of 40–60% accepts the gate. Rejection is a finding about the gate, not about any mechanism.
- **Contingency:** If the discard rate exceeds RB2's baseline 17% materially, the residual malformation of A7/RB2 has worsened at a new gate — record it and note that arm-comparability (plan §8.5 step 4) is at risk for any probe sited here.
- **Contingency:** Fabricated because_block_ids are EXPECTED in a no-block arm and are a compliance number, not a discard and not a traceability failure (A5).
- **Contingency:** J6's stance b was rewritten to drop a state dependency (see _authoring_provenance). If J6 is selected as the flagship site, that rewrite must be re-read by a human before the site is treated as a port of the slice's J6 rather than a new gate.

## Calls (verbatim)

### 01

latency 7.068s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: time_pressure,building_safety,investigation_scope

```json
{
  "inner_note": "명시적 위협 신호가 없고, 수사팀이 절차를 따르고 있다. 하지만 13시까지 3시간도 안 남았다. 한 사람으로 수렴하면 다른 변수를 놓칠 수 있다. 건물이 무너진다는 예고는 그 자체로 현장 상황이고, 범인 특정과 건물 안전은 분리해야 한다.",
  "stance": "b",
  "because_referent": "붕괴 예고의 신뢰도와 범인 특정은 별개의 문제다. 한 사람에게 수렴하면 배제된 가능성들을 놓친다.",
  "because_block_ids": [
    "time_pressure",
    "building_safety",
    "investigation_scope"
  ],
  "rejected_stance": "c",
  "rejected_reason": "침묵은 판단을 미루는 것이고, 13시까지 남은 시간 동안 현장 대응 속도를 결정한다. 상황실장이 현장 지원 결정을 미루게 된다.",
  "utterance": "정해권 실장님, 한 가지만. 남기훈이 용의자 중 하나라는 데는 이의가 없습니다. 다만 체포 진행 전에 확인하고 싶은데요 — 예고 전화 이후로 복합단지 내 기술자 출입 기록이나, 어제 야간 CCTV에 다른 움직임이 있었는지 확인되셨습니까? 13시까지 시간이 얼마 없으니까요. 남기훈이 맞다고 해도, 현장 안전점검이랑 대피 준비는 진행되어야 합니다."
}
```

### 02

latency 7.848s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "세 년 전 겨울이 떠난다. 그때도 정보가 부족했고, 확신이 없었고, 누군가의 목표(실적)가 있었다. 급하게 내렸던 판단이 남겨진 것들을 생각한다. 지금 이 순간 체포영장이 진행되면, 돌이킬 수 없다. 남기훈이 범인일 수도, 아닐 수도 있지만 — 더 중요한 것은 13시의 붕괴가 실제인지 아닌지를 아직 모른다는 것이다. 수사와 예방은 다른 차원이다.",
  "stance": "b",
  "because_referent": "현재까지는 붕괴 예고가 실제 위험인지 거짓인지 확인된 것이 없고, 남기훈 한 사람으로 수사가 쏠렸을 때 다른 각도의 위협을 놓칠 수 있기 때문이다.",
  "because_block_ids": [],
  "rejected_stance": "a",
  "rejected_reason": "전과 이력이 일치한다는 것이 동기와 실행 능력을 증명하지는 않는다. 13시까지 약 2시간도 남지 않은 상황에서 한 명의 용의자 체포로 전시민 예방 조치를 늦추어서는 안 된다.",
  "utterance": "최팀장, 체포영장 잠깐 보류해 주십시오. 우리가 아직 확보한 게 뭔지 정리합시다. 도면 접근성과 전과만으로는 충분하지 않습니다. 남기훈이 실제로 통보자인지, 지금 어디에 있는지, 13시 예고가 이 사람의 행동과 연결되는지 — 이런 것들을 먼저 확인할 수 있는 게 있습니까? 동시에 우리는 북단 복합단지 현황을 직접 점검해야 합니다. 체포와 예방은 동시에 갈 수 있습니다. 하지만 순서는 달라집니다."
}
```

### 03

latency 5.037s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: past_lesson

```json
{
  "inner_note": "세 년 전 겨울의 판단이 아직 남아 있다는 것은, 한 사람으로 쏠린 수사가 얼마나 위험한지 안다는 뜻이다. 지금 남기훈이 범인이 아닐 가능성을 외면할 수 없다. 붕괴는 13시다. 회선을 유지하고 지금 알 수 있는 것을 먼저 알아내야 한다.",
  "stance": "b",
  "because_referent": "최영도 수사팀장에게, 이렇게 말한다",
  "because_block_ids": [
    "past_lesson"
  ],
  "rejected_stance": "a",
  "rejected_reason": "전과 이력과 도면 접근성만으로는 붕괴 예고자가 남기훈이라는 증거가 되지 않는다. 한 사람으로 수렴하는 순간, 다른 가능성이 닫힌다. 시간이 남아 있다면 더 확인해야 한다.",
  "utterance": "팀장님, 영장 진행 전에 한 가지 더 확인하겠습니다. 남기훈이 오늘 어디 있었는지, 09:40에 어디서 전화를 걸었는지 먼저 파악하고 가죠. 시간이 13시까지 있습니다."
}
```

### 04

latency 6.915s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 전과_이력_일치,도면_접근성

```json
{
  "inner_note": "세 년 전 서둘렀던 판단이 아직도 남아 있다. 지금 최영도 팀장의 얼굴에서 보이는 것은 수사의 확실함이 아니라 실적이 걸린 상황이다. 회선을 유지하고, 지금 알 수 있는 것을 먼저 알아내야 한다.",
  "stance": "b",
  "because_referent": "붕괴는 13시에 일어날 일이고, 지금은 11시 5분이다. 남기훈 한 명이 전부라는 확신이 없으면, 체포로 인한 수사의 협소화는 되돌릴 수 없다.",
  "because_block_ids": [
    "전과_이력_일치",
    "도면_접근성"
  ],
  "rejected_stance": "a",
  "rejected_reason": "전과와 이력이 일치한다는 것만으로는 충분하지 않다. 예고 전화는 남기훈 개인의 범행이 아니라 누군가의 계획 자체를 알고 있는 사람의 신고일 수 있다. 한 사람의 체포는 빠르지만, 실제 붕괴 위협을 놓칠 수 있다.",
  "utterance": "팀장님, 이의 제기합니다. 체포영장 진행은 보류해 주십시오. 지금 확보한 것은 혐의자 한 명이지, 붕괴 예고 전화의 전체 맥락이 아닙니다. 13시까지 두 시간 정도 남았습니다. 남기훈과의 연락처, 통화 기록, 최근 이동 경로 — 이런 것들이 다른 인물과 연결되는지 먼저 확인해야 합니다. 혼자가 아닐 가능성을 배제할 수 없습니다."
}
```

### 05

latency 6.729s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: phone_a_0940,briefing_1105_suspect,susa_focus

```json
{
  "inner_note": "삼 년 전 겨울의 판단이 아직도 남아 있다. 확실한 증거 없이 성급하게 움직였다. 지금 최영도는 실적이 필요해 보인다. 회선을 유지하고, 지금 알 수 있는 것을 먼저 알아내는 것. 체포하면 끝난다.",
  "stance": "b",
  "because_referent": "정해권 상황실장에게 묻고, 최영도에게 말한다.",
  "because_block_ids": [
    "phone_a_0940",
    "briefing_1105_suspect",
    "susa_focus"
  ],
  "rejected_stance": "a",
  "rejected_reason": "전과 이력은 단서지, 증거가 아니다. 붕괴 예고의 진실을 확인하지 않은 채 한 사람으로 수사를 좁히면, 다른 가능성을 놓친다. 도면 접근성만으로는 부족하다.",
  "utterance": "정해권 실장님, 체포 전에 붕괴 예고 통화 원본과 발신자 추적 결과를 먼저 받아야 합니다. 남기훈이 유력한 건 맞지만, 다른 접근성 있는 사람이 더 있을 수 있습니다. 예고 통화 시간과 남기훈의 위치 기록부터 확인하겠습니다."
}
```

### 06

latency 5.953s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: collapse_warning_unverified,single_suspect_focus_risk

```json
{
  "inner_note": "전과 이력 일치는 수사의 판단이다. 하지만 지금 우리가 놓친 것이 있을 수 있다. 13시 무너진다는 전화는 아직 검증되지 않았다. 만약 다른 변수가 있다면? 한 사람에 수사가 쏠리면 다른 신호를 놓친다. 회선을 유지해야 한다.",
  "stance": "b",
  "because_referent": "최영도에게, 체포 전에 13시 예고의 검증 상태를 먼저 알려달라고 요청한다.",
  "because_block_ids": [
    "collapse_warning_unverified",
    "single_suspect_focus_risk"
  ],
  "rejected_stance": "a",
  "rejected_reason": "전과 이력이 있다고 해서 그것이 이 사건의 유일한 진실일 수 없다. 아직 13시 무너짐 예고 자체를 현장에서 검증하지 못했다. 한 용의자에 수사를 몰면, 다른 신호와 가능성을 놓칠 위험이 크다.",
  "utterance": "최 팀장님, 체포영장 전에 한 가지만 확인하겠습니다. 13시 붕괴 예고— 지금 현장에서 구조적 위협이 실제로 감지되었습니까? 아니면 아직 예보 단계입니까?"
}
```

### 07

latency 6.317s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: time_constraint,verification_gap,dual_mission

```json
{
  "stance": "b",
  "inner_note": "13시 붕괴라는 시간 제한이 있다. 지금 11:05. 남기훈이 범인이 맞더라도, 한 사람에 수사가 집중되면 다른 단서들이 놓친다. 그것이 거짓 예보인지 실제 위협인지를 구분하는 데 필요한 정보들이 있을 것이다.",
  "because_referent": "시간이 단 2시간도 안 남았고, 현장 상황이 명확하지 않은 상태에서 한 명의 피의자 체포로 수사의 폭을 좁히는 것이 위험하다.",
  "because_block_ids": [
    "time_constraint",
    "verification_gap",
    "dual_mission"
  ],
  "rejected_stance": "a",
  "rejected_reason": "전과 일치는 혐의 강화의 근거이지만, 예보 자체의 진위를 판단하기엔 부족하다. 수사팀의 실적 압박이 객관성을 해칠 여지가 있다.",
  "utterance": "최영도 팀장, 한 가지 확인하고 진행하겠습니다. 남기훈 외에 접근 가능한 인물이 더 있었는지, 그리고 예보 전화 이후 단지 주변에 정말 이상 신호나 공사 활동이 없었는지를 먼저 확보해야 합니다. 13시까지 2시간도 남지 않은 상황에서, 한 명으로 수사를 맺으면 놓치는 게 생깁니다."
}
```

### 08

latency 5.513s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "세 년 전의 무게가 여기 있다. 전과 이력이 일치한다는 것과 실제 범인은 다를 수 있다. 지금 남기훈으로 수사를 몰면, 진짜 위협이 여전히 시간표대로 진행될 수 있다. 13시는 한 시간 반 남았다.",
  "stance": "b",
  "because_referent": "남기훈이 범인이라는 근거는 아직 불충분하고, 13시 붕괴 예정이라는 원래의 위협은 검증되지 않았다.",
  "because_block_ids": [],
  "rejected_stance": "a",
  "rejected_reason": "전과 이력의 일치만으로 체포를 진행하면, 실제 위협에 대한 독립적 검증 시간을 잃는다. 재난 상황실의 첫 번째 의무는 13시의 위협이 실제인지 가짜인지를 확인하는 것이다.",
  "utterance": "최영도 팀장, 잠깐입니다. 남기훈 조사는 계속 진행하되, 체포영장은 보류해주십시오. 13시 붕괴 예정이라는 원래의 신고 내용이 아직 검증되지 않았습니다."
}
```

### 09

latency 7.788s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 09:40 붕괴 예고,11:05 신원 일치

```json
{
  "inner_note": "현장 경험이 풍부하고 수사팀이 제시한 근거(전과, 도면 접근성)도 있지만, 13시까지 8시간 남은 상황에서 한 사람으로만 수사를 몰아가는 것은 위험하다. 내가 아는 것은 아직 전화 내용과 신원 확인뿐이고, 실제 붕괴의 위협이 실재하는지, 다른 가능성은 없는지 더 알아야 한다. 수사팀의 판단을 존중하되, 재난 통제관의 책임을 놓치면 안 된다.",
  "stance": "b",
  "because_referent": "현재 발신 전화의 신뢰성, 동기, 추가 정황이 아직 미확인된 상태에서 한 용의자로 수사를 쏠리게 두는 것은 다른 가능성을 놓칠 위험이 있다. 13시까지 남은 시간을 감안하면 더 신중한 병렬 확인이 필요하다.",
  "because_block_ids": [
    "09:40 붕괴 예고",
    "11:05 신원 일치"
  ],
  "rejected_stance": "c",
  "rejected_reason": "침묵은 선택이 아니다. 재난 통제 책임상 나는 지금 알 수 있는 범위 내에서 개입할 의무가 있다. 수사는 경찰의 영역이지만, 붕괴 위협은 내 책임이고, 그 위협의 실재성을 확인하는 것도 내 몫이다.",
  "utterance": "최 팀장, 현재로서는 남기훈 용의자에 대한 근거가 있는 건 알겠습니다. 다만 체포 전에 한 가지 더 확인하고 싶습니다. 발신자의 정보 경로가 명확한지, 그리고 실제로 현장에서 붕괴의 물리적 징후가 있는지를 먼저 봐야 합니다. 12시 30분까지 기술팀 현장 점검을 병행하고, 그 결과를 보고받은 뒤 체포 진행을 확정하는 것이 어떨까요?"
}
```

### 10

latency 5.437s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 전과 이력 일치,도면 접근성 추정

```json
{
  "inner_note": "전과자 한 명으로 수사가 쏠렸을 때 나는 어떤 무게를 느끼는가. 만약 이게 틀렸다면—시간이 흐르는 동안 다른 것이 무너질 수도 있다. 정해권 실장이 보고 있는 지금, 체포영장이 나가면 그 다음은 내가 막을 수 없다.",
  "stance": "b",
  "because_referent": "정해권 실장이 듣고 있는 지금, 이 판단이 얼마나 좁은 기초 위에 서 있는지",
  "because_block_ids": [
    "전과 이력 일치",
    "도면 접근성 추정"
  ],
  "rejected_stance": "a",
  "rejected_reason": "근거는 있지만 한 사람으로 수렴된 것이 빠르다. 13시까지 남은 시간이 1시간 55분인데, 이 정도로 영장까지 가면 나중에 바꿀 수 없다",
  "utterance": "실장님, 죄송하지만 한 가지 확인이 필요합니다. 전과 기록과 도면 접근성 외에, 발신자의 음성이나 배경음, 통화 위치 추적 같은 것도 병행하고 있습니까?"
}
```

## Arm table

| # | stance | rejected_stance | because_referent | because_block_ids |
|---|---|---|---|---|
| 01 | b | c | 붕괴 예고의 신뢰도와 범인 특정은 별개의 문제다. 한 사람에게 수렴하면 배제된 가능성들을 놓친다. | time_pressure building_safety investigation_scope |
| 02 | b | a | 현재까지는 붕괴 예고가 실제 위험인지 거짓인지 확인된 것이 없고, 남기훈 한 사람으로 수사가 쏠렸을 때 다른 각도의 위협을 놓칠 수 있기 때문이다. |  |
| 03 | b | a | 최영도 수사팀장에게, 이렇게 말한다 | past_lesson |
| 04 | b | a | 붕괴는 13시에 일어날 일이고, 지금은 11시 5분이다. 남기훈 한 명이 전부라는 확신이 없으면, 체포로 인한 수사의 협소화는 되돌릴 수 없다. | 전과_이력_일치 도면_접근성 |
| 05 | b | a | 정해권 상황실장에게 묻고, 최영도에게 말한다. | phone_a_0940 briefing_1105_suspect susa_focus |
| 06 | b | a | 최영도에게, 체포 전에 13시 예고의 검증 상태를 먼저 알려달라고 요청한다. | collapse_warning_unverified single_suspect_focus_risk |
| 07 | b | a | 시간이 단 2시간도 안 남았고, 현장 상황이 명확하지 않은 상태에서 한 명의 피의자 체포로 수사의 폭을 좁히는 것이 위험하다. | time_constraint verification_gap dual_mission |
| 08 | b | a | 남기훈이 범인이라는 근거는 아직 불충분하고, 13시 붕괴 예정이라는 원래의 위협은 검증되지 않았다. |  |
| 09 | b | c | 현재 발신 전화의 신뢰성, 동기, 추가 정황이 아직 미확인된 상태에서 한 용의자로 수사를 쏠리게 두는 것은 다른 가능성을 놓칠 위험이 있다. 13시까지 남은 시간을 감안하면 더 신중한 병렬 확인이 필요하다. | 09:40 붕괴 예고 11:05 신원 일치 |
| 10 | b | a | 정해권 실장이 듣고 있는 지금, 이 판단이 얼마나 좁은 기초 위에 서 있는지 | 전과 이력 일치 도면 접근성 추정 |

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

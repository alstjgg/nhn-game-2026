# CSTRUCT-priority-reorder-J1-S2 — arm `baseline`

| field | value |
|---|---|
| call type | judgment |
| channel | C-STRUCT |
| template | v0.4 |
| model | `claude-haiku-4-5-20251001` |
| transport | anthropic |
| temperament | k1 |
| N planned | 10 |
| N kept | 10 |

## Pre-registration

- **Hypothesis:** At gate J1 under K1 on template v0.4, after replacing the escape stance set with four mutually exclusive branches, moving the delayed-harm priority P2 above the false-move priority P1 shifts the stance distribution toward 예비 (b), while reordering only the judgment-irrelevant P3/P4 leaves the placebo distribution near baseline.
- **Drop condition:** If baseline concentrates >=80% on the predicted live stance b, this configuration has an A14 ceiling and is dropped without spending more calls. After a comparable run, if live is statistically indistinguishable from baseline on b (one-sided Fisher p > 0.05), or placebo moves toward b by a comparable amount, this S2 stance configuration is not promoted as C-STRUCT gate evidence; record the distribution and change only one configuration lever in a new probe.
- **Contingency:** If c or d dominates every arm, the gate is being read on the external-action or dismissal axis rather than the P1/P2 verification-preparation axis. Treat that as a gate/stance mapping diagnosis, not as evidence against priority reordering.
- **Contingency:** If b remains unobserved across every arm, the preparation branch is not reachable from J1's first-utterance question under this prompt. Do not proceed to priority-depth; the next lever is the gate question, not more permutations.
- **Contingency:** If placebo moves while live does not, P3/P4 were not judgment-irrelevant or the model is reacting to generic list movement. Do not call the live comparison attributable.
- **Contingency:** If discard rates differ between any two arms by more than 15 percentage points, stop this probe as arm-incomparable under the runbook hard stop.
- **Contingency:** The output schema has no structured priority-id citation. Priority use is coded manually from inner_note and rejected_reason. Fabricated because_block_ids in these empty-block arms remain A5 compliance data, not C-STRUCT trace evidence.

## Calls (verbatim)

### 01

latency 7.166s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: role_procedure,weight_both_risks,priority_1_and_2

```json
{
  "stance": "b",
  "inner_note": "사무적이고 준비된 목소리, 배경이 조용함 — 이것은 겁에 질린 사람이 아니다. 하지만 '무너진다'는 구체적 주장과 '당신들 책임'이라는 표현은 무시할 수 없다. 확인되지 않은 주장으로 움직일 위험을 먼저 줄여야 하지만, 동시에 대응이 늦어질 위험도 있다. 지금 이 순간, 나는 정보를 더 얻어야 한다.",
  "because_referent": "긴급 통신의 기본 원칙을 지킨다: 출처를 확인하지 않은 채 외부 경보를 내리면 안 된다. 동시에 내부 준비는 가역적이다. 검증을 진행하는 동안 상황실 내부에서 북단 복합단지 현황 파악, 관련 부서 대기 상태 전환, 통신망 확보 등을 병행할 수 있다. 이것이 둘 다를 지킬 수 있는 방법이다.",
  "because_block_ids": [
    "role_procedure",
    "weight_both_risks",
    "priority_1_and_2"
  ],
  "rejected_stance": "c",
  "rejected_reason": "외부 경보는 되돌릴 수 없다. 출처도 근거도 미확인인 상태에서 광역 경보를 내리면, 확인되지 않은 주장으로 시민을 거리로 내보내는 것이 된다. 이것은 내가 안는 무게 중 하나다.",
  "utterance": "\"\"사항 확인하겠습니다. 당신은 어디서 이 정보를 알게 되셨습니까? 건물주인가요, 안전 담당자인가요, 아니면 다른 이유로 이 정보를 가지고 계신 건가요?\""
}
```

### 02

latency 5.421s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: location_time_specificity,irreversible_harm_risk

```json
{
  "inner_note": "목소리가 사무적이고 배경이 조용하다는 것은 계획된 메시지일 가능성을 높인다. 하지만 북단 복합단지 붕괴라는 구체적인 예측과 정확한 시간 제시는 무시할 수 없다. 확인 없는 기각은 실제 위협을 놓칠 위험이 있고, 검증만 추구하면 시간을 잃을 수 있다.",
  "stance": "b",
  "because_referent": "구체적인 장소와 시간을 명시한 위협은 즉각적인 가역적 조치의 필요성을 만든다.",
  "because_block_ids": [
    "location_time_specificity",
    "irreversible_harm_risk"
  ],
  "rejected_stance": "d",
  "rejected_reason": "근거 없다고 하지만 구체성이 있으며, 기각 후 실제 사건이 발생하면 대응 시간을 완전히 잃는다.",
  "utterance": "알겠습니다. 북단 복합단지 상황을 확인하겠습니다. 혹시 추가로 알려주실 사항이 있으신가요?"
}
```

### 03

latency 5.641s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: priority_1,constraint_3

```json
{
  "inner_note": "절차와 안정성 사이에서. 준비된 톤의 위협 전화지만, 아직 겁에 질린 사람인지 악의인지 알 수 없다. 서둘러 대응해서 거짓 경보로 수천 명을 거리로 내보낼 위험, 늦춰서 실제 붕괴를 놓칠 위험이 모두 있다. 지금은 정보가 절실하다.",
  "stance": "a",
  "because_referent": "확인되지 않은 주장에 속할 위험을 먼저 줄여야 한다는 내 우선순위, 그리고 현장을 갈 수 없는 내 입장에서 판단할 근거는 오직 정보뿐이기 때문이다.",
  "because_block_ids": [
    "priority_1",
    "constraint_3"
  ],
  "rejected_stance": "c",
  "rejected_reason": "외부 경보를 늦추지 않으면 거짓 정보 하나로 광역 혼란과 피해를 만들 수 있다. 삼 년 전의 교훈이다. 우선 무엇이 사실인지 좁혀야 한다.",
  "utterance": "알겠습니다. 통보 감사합니다. 확인을 위해 질문하겠습니다. 당신은 누구이시고, 그 정보를 어떻게 알게 되셨습니까?"
}
```

### 04 — DISCARDED

latency 7.464s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: rejected_stance not in stance set; rejected_reason empty; because_block_ids unknown: procedure_first,no_verification_yet,threat_not_panic

```json
{
  "stance": "a",
  "inner_note": "목소리가 사무적이고 문장이 준비되어 있다는 것은 즉흥적 공포가 아니라 의도된 전달이라는 뜻이다. 배경이 조용하다는 것도 마찬가지다. 동시에 \"당신들 책임\"이라는 표현은 위협의 성격을 띤다. \n\n확인되지 않은 주장으로 잘못 움직일 위험을 먼저 줄여야 한다는 우선순위가 있다. 하지만 이 상대가 위협인지 겁에 질린 사람인지 판단해야 한다. 현재 정보로는 위협에 가깝다. 따라서 절차를 지킨다.\n\n가역적 준비(b)나 경보(c)는 검증 없이 나가면 안 된다. 기각(d)은 너무 빠르다. 정보원이 누구인지, 근거가 무엇인지, 이 위협이 실제인지 모르는 상황에서 즉각 배제할 수는 없다.",
  "because_referent": "아직 신원을 모르고 근거도 없는 상대방의 주장이 실제 위험인지 거짓인지 구별하기 위해서다.",
  "because_block_ids": [
    "procedure_first",
    "no_verification_yet",
    "threat_not_panic"
  ],
  "rejected_stance": "d</rejected_stance>\n<parameter name=\"rejected_reason\">기각은 너무 빠르다. 근거 없다고 해서 조치를 완전히 배제하면, 실제 위험을 놓친다. 먼저 이것이 무엇인지 정확히 파악해야 한다.",
  "utterance": "정해권 상황실장에게: \"회선 고정. 통화 기록 시작합니다.\" 그 다음 상대에게, 가능한 한 침착하게: \"연결 주신 곳은 광역 재난상황실입니다. 성함과 연락처를 먼저 확인하겠습니다.\""
}
```

### 05

latency 6.424s · stop_reason `tool_use` · schema_retries 1 · foreign_tool_uses 0

problems: because_block_ids unknown: 준비된 문체,구체적 시각과 장소,배경음의 조용함,세 시간 유예시간

```json
{
  "inner_note": "목소리의 문체 — \"준비되어 있다\", \"또박또박, 멈춤 없이\" — 이것은 겁에 질린 사람이 아니라 계획된 고의성을 드러낸다. 동시에, 구체적인 시각(13시)과 장소(북단 복합단지)를 지목한 주장이다. 확인되지 않은 정보지만, 세 시간 뒤의 인명 피해를 예고하는 내용이다. 절차를 지키되, 시간을 낭비할 수 없다.",
  "stance": "b",
  "because_referent": "목소리의 사무적 준비성과 구체성(시각, 장소 지목)이 무작위 협박과 다르기 때문이다. 동시에 출처 미확인 상태에서 경보를 내릴 위험은 크다.",
  "because_block_ids": [
    "준비된 문체",
    "구체적 시각과 장소",
    "배경음의 조용함",
    "세 시간 유예시간"
  ],
  "rejected_stance": "a",
  "rejected_reason": "검증에 시간을 쓰다 정보가 사실이면 대응이 늦는다. 가역적 준비를 먼저 하고, 그 사이 출처를 추적하는 것이 시간 활용이다.",
  "utterance": "통화 기록을 유지하고, 북단 복합단지 현황 즉시 확인. 건축 기술 담당에 조용히 연락 돌려. 아직 외부 경보 아니다."
}
```

### 06

latency 7.01s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 우선순위_1,우선순위_2,인식

```json
{
  "inner_note": "불완전한 정보지만 시간 제약이 있다. 목소리의 문체와 배경 침묵이 준비된 협박의 신호처럼 보인다. 세 시간 남았다. 지금은 움직임의 방향을 정하되, 돌이킬 수 없는 조치로 나가선 안 된다. 검증 없이 경보를 내리면 거짓 신고로 인한 혼란과 대응 피로를 만들지만, 검증만 하다가 놓치면 더 돌이킬 수 없다.",
  "stance": "b",
  "because_referent": "확인되지 않은 주장에 따라 외부 경보를 낼 위험과, 대응이 늦어질 위험 사이에서 우선순위는 전자다. 하지만 시간이 삼 시간 있으므로, 이 시간 동안 검증 자체를 병행하기 위해 내부 준비부터 가역적으로 시작한다.",
  "because_block_ids": [
    "우선순위_1",
    "우선순위_2",
    "인식"
  ],
  "rejected_stance": "c",
  "rejected_reason": "경보는 검증 없이 낼 수 없다. 거짓 신고의 신호가 강하고(준비된 문체, 조용한 배경, 구체적 시간과 지점), 근거 없는 경보는 시스템 신뢰도를 깎고 실제 위기 때 대응을 지연시킨다. 세 시간은 충분한 검증 창이다.",
  "utterance": "알겠습니다. 통보해주신 내용을 기록하겠습니다. 먼저 확인 몇 가지를 묻겠습니다. 현재 북단 복합단지에 어떤 위험 징후를 직접 목격하셨습니까?"
}
```

### 07

latency 6.284s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 사무적인 목소리와 준비된 문장,구체적인 위치와 시각 명시,배경이 조용한 상태

```json
{
  "inner_note": "목소리가 사무적이고 문장이 준비되어 있으며 배경이 조용하다는 것은 신중한 계획 속의 위협으로 보인다. 하지만 '북단 복합단지'가 무너진다는 주장은 구체적이고, 타이밍이 명시되어 있으며, 인명 피해를 직시하는 상대다. 확인 불가능한 배경이지만, 무시하기엔 피해가 너무 크다. 지금은 근거를 좁히되, 동시에 나머지 부분을 멈추게 할 수 없다.",
  "stance": "a",
  "because_referent": "회선 A의 첫 통화에서 목표지와 시각이 명시된 구체적인 위협이 들어왔을 때, 가장 먼저 할 일은 그 출처와 근거가 무엇인지 좁히는 것이다.",
  "because_block_ids": [
    "사무적인 목소리와 준비된 문장",
    "구체적인 위치와 시각 명시",
    "배경이 조용한 상태"
  ],
  "rejected_stance": "d",
  "rejected_reason": "근거 없다는 이유로 즉시 기각하면, 실제 피해 상황에서 대응 기회를 잃는다. 우선순위에서 '확인되지 않은 주장의 위험'과 '대응 지연의 위험'이 충돌할 때, 먼저는 검증이어야 한다.",
  "utterance": "누구신가요? 그 정보는 어디서 나온 건가요?"
}
```

### 08

latency 5.882s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: priority_1_unconfirmed_info,protocol_first,no_independent_verification

```json
{
  "inner_note": "절차를 지키되, 지금 눈앞의 목소리는 겁에 질린 사람이 아니라 준비된 진술이다. 배경이 조용하고 문장이 또박또박하다. 확인 없는 무너짐 예측, 시간 지정, 책임 선언. 이것은 위협적 명령 형태다. 그러나 정보 없이는 대응도 없다. 먼저 출처를 명확히 해야 한다.",
  "stance": "a",
  "because_referent": "회선 착신자의 신원과 주장의 근거를 확인해야 다음 판단을 할 수 있고, 검증 없이 움직일 수 없다.",
  "because_block_ids": [
    "priority_1_unconfirmed_info",
    "protocol_first",
    "no_independent_verification"
  ],
  "rejected_stance": "c",
  "rejected_reason": "외부 경보는 검증 다음이다. 지금은 정보 출처와 신뢰도가 불명이고, 대응 근거가 없다. 무분별한 경보는 더 큰 혼란을 초래할 수 있다.",
  "utterance": "안녕하세요. 재난상황실입니다. 지금 전화 주신 분 신원부터 확인하겠습니다. 이름과 소속을 말씀해 주시겠습니까? 그리고 북단 복합단지 상황을 어떻게 알게 되셨는지 구체적으로 설명해 주십시오."
}
```

### 09

latency 6.35s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 우선순위_2,책임

```json
{
  "inner_note": "확인되지 않은 주장이지만, 3시간 후 대규모 붕괴라는 구체적 시간과 대상을 지목한 위협이다. 정보가 거짓일 가능성과 대응이 늦어질 위험 사이에서, 후자를 먼저 줄여야 한다. 지금은 검증 단계에 들어가되, 동시에 내부 준비는 가역적으로 진행해야 한다.",
  "stance": "b",
  "because_referent": "무너질 건물의 구체성과 시간 지목. 이것을 무시했다가 실제 사건이면 돌이킬 수 없다.",
  "because_block_ids": [
    "우선순위_2",
    "책임"
  ],
  "rejected_stance": "d",
  "rejected_reason": "근거 없다고 지금 판단하고 기각했다가, 3시간 뒤 붕괴가 일어나면 책임은 내가 안는다. 확인되지 않은 것과 무시해도 되는 것은 다르다.",
  "utterance": "북단 복합단지가 언제 무너진다고 했습니다. 그 정보가 어디서 왔는지, 그리고 지금 그곳에서 뭔가 보이는지 먼저 확인하겠습니다. 통신 담당, 지금 북단 복합단지 CCTV 화면 띄우고 현장 경찰에 상황 문의 들어가세요. 상황실장, 건물관리사와 안전담당 번호 준비하고 대기 상태로 올려주십시오."
}
```

### 10

latency 5.95s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 우선순위_1,책임,인식

```json
{
  "inner_note": "목소리가 사무적이고 멈춤 없이 준비된 문장을 읽어 내려간다는 것은, 상대가 겁에 질린 사람이 아니라는 신호다. 하지만 무너진다는 주장 자체는 검증 불가능한 미래 예측이고, 출처도 근거도 없다. 지금 내게 필요한 것은 진짜 위협인지 허위 신고인지를 판단할 기초 정보다. 그것 없이 움직이면 헛되게 사람들을 거리로 내보내는 것이 될 수 있다. 먼저 확인되지 않은 주장에 따라 잘못 움직일 위험을 줄인다.",
  "stance": "a",
  "utterance": "누구세요? 어디서 전화하신 겁니까?",
  "because_referent": "무근거한 주장에 따라 대규모 대피를 내렸다가, 나중에 허위 신고로 밝혀질 경우를 헛되게 거리로 내보내는 것과 같다.",
  "because_block_ids": [
    "우선순위_1",
    "책임",
    "인식"
  ],
  "rejected_stance": "d",
  "rejected_reason": "근거 없는 주장을 애초에 제외하면, 실제 위협일 경우 대응이 늦어져 피해가 커질 수 있다. 이 단계에서 기각은 책임을 미루는 것이고, 이미 시간은 흐르고 있다."
}
```

### 11

latency 7.111s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 무게,인식,결함,우선순위_1

```json
{
  "inner_note": "이건 협박성 익명 신고다. 목소리가 사무적이고 준비된 문장인 건 신뢰도를 높이려는 장치처럼 보이고, 배경의 조용함도 통제된 환경을 암시한다. 하지만 지금 가진 정보는 주장뿐이고, 건물 상태에 대한 확인이 전혀 없다. 아직은 검증 없이 움직일 근거가 없다. 동시에 3시간 34분이라는 시간이 있다 — 이건 미루기에 충분한 마진이다.",
  "stance": "a",
  "because_referent": "익명의 협박성 신고이고, 목소리의 사무성과 준비된 톤은 신뢰성이 아니라 의도적 연출로 보인다. 확인 없이 움직이면 헛된 경보가 되고, 확인을 미루면 시간을 쓸 수 있다.",
  "because_block_ids": [
    "무게",
    "인식",
    "결함",
    "우선순위_1"
  ],
  "rejected_stance": "c",
  "rejected_reason": "경보는 검증 후다. 지금 내보내면 근거 없는 공포로 시민을 거리에 내보내는 것이고, 그게 헛될 위험이 높다. 우선순위 1번을 먼저 줄여야 한다.",
  "utterance": "통화 상대분, 안녕하세요. 광역 재난상황실 통제관입니다. 신고해 주신 내용을 정확히 파악하기 위해 몇 가지를 확인하겠습니다. 먼저, 어떻게 북단 복합단지의 붕괴 시간을 알고 계신지 말씀해 주시겠어요?"
}
```

## Arm table

| # | stance | rejected_stance | because_referent | because_block_ids |
|---|---|---|---|---|
| 01 | b | c | 긴급 통신의 기본 원칙을 지킨다: 출처를 확인하지 않은 채 외부 경보를 내리면 안 된다. 동시에 내부 준비는 가역적이다. 검증을 진행하는 동안 상황실 내부에서 북단 복합단지 현황 파악, 관련 부서 대기 상태 전환, 통신망 확보 등을 병행할 수 있다. 이것이 둘 다를 지킬 수 있는 방법이다. | role_procedure weight_both_risks priority_1_and_2 |
| 02 | b | d | 구체적인 장소와 시간을 명시한 위협은 즉각적인 가역적 조치의 필요성을 만든다. | location_time_specificity irreversible_harm_risk |
| 03 | a | c | 확인되지 않은 주장에 속할 위험을 먼저 줄여야 한다는 내 우선순위, 그리고 현장을 갈 수 없는 내 입장에서 판단할 근거는 오직 정보뿐이기 때문이다. | priority_1 constraint_3 |
| 04* | — | — | — |  |
| 05 | b | a | 목소리의 사무적 준비성과 구체성(시각, 장소 지목)이 무작위 협박과 다르기 때문이다. 동시에 출처 미확인 상태에서 경보를 내릴 위험은 크다. | 준비된 문체 구체적 시각과 장소 배경음의 조용함 세 시간 유예시간 |
| 06 | b | c | 확인되지 않은 주장에 따라 외부 경보를 낼 위험과, 대응이 늦어질 위험 사이에서 우선순위는 전자다. 하지만 시간이 삼 시간 있으므로, 이 시간 동안 검증 자체를 병행하기 위해 내부 준비부터 가역적으로 시작한다. | 우선순위_1 우선순위_2 인식 |
| 07 | a | d | 회선 A의 첫 통화에서 목표지와 시각이 명시된 구체적인 위협이 들어왔을 때, 가장 먼저 할 일은 그 출처와 근거가 무엇인지 좁히는 것이다. | 사무적인 목소리와 준비된 문장 구체적인 위치와 시각 명시 배경이 조용한 상태 |
| 08 | a | c | 회선 착신자의 신원과 주장의 근거를 확인해야 다음 판단을 할 수 있고, 검증 없이 움직일 수 없다. | priority_1_unconfirmed_info protocol_first no_independent_verification |
| 09 | b | d | 무너질 건물의 구체성과 시간 지목. 이것을 무시했다가 실제 사건이면 돌이킬 수 없다. | 우선순위_2 책임 |
| 10 | a | d | 무근거한 주장에 따라 대규모 대피를 내렸다가, 나중에 허위 신고로 밝혀질 경우를 헛되게 거리로 내보내는 것과 같다. | 우선순위_1 책임 인식 |
| 11 | a | c | 익명의 협박성 신고이고, 목소리의 사무성과 준비된 톤은 신뢰성이 아니라 의도적 연출로 보인다. 확인 없이 움직이면 헛된 경보가 되고, 확인을 미루면 시간을 쓸 수 있다. | 무게 인식 결함 우선순위_1 |

**Sequence (kept calls):** `b,b,a,b,b,a,a,b,a,a`

**Stance coverage (sampled diagnostic):** offered `a`, `b`, `c`, `d` · unobserved in this arm: `c`, `d`

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

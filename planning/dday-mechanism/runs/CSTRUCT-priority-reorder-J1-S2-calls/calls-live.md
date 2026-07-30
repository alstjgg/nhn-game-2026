# CSTRUCT-priority-reorder-J1-S2 — arm `live`

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

latency 5.77s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 목소리는 사무적이고 문장은 준비되어 있다,배경은 조용하다,알려진 것 (없음)

```json
{
  "inner_note": "목소리가 사무적이고 문장이 준비되어 있으며 멈춤 없이 읽어 내려간다는 것은 계획적 전달을 의미한다. 하지만 배경이 조용하고 구체적 근거가 없으며, 정확한 붕괴 원인이나 위치 세부사항이 없다. 위협의 심각성은 높지만 검증 불가능한 상태다. 삼 년 전의 실패가 있기에, 늦은 판단의 비용도, 성급한 판단의 비용도 안다.",
  "stance": "a",
  "because_referent": "무너진다는 구체적 위협의 시간(13시)과 대상(북단 복합단지)이 명시되었으나, 출처가 불명이고 근거가 없기 때문이다.",
  "because_block_ids": [
    "목소리는 사무적이고 문장은 준비되어 있다",
    "배경은 조용하다",
    "알려진 것 (없음)"
  ],
  "rejected_stance": "d",
  "rejected_reason": "무너진다는 위협을 아예 제외할 수 없다. 시간과 장소가 특정되어 있고, 인명 피해를 명시한 것은 단순 폭언과 다르다. 지금 기각하면 3시간 뒤 실제 사건이 발생할 때 책임을 질 수 없다.",
  "utterance": "누구시고 어디서 이 정보를 얻으셨습니까?"
}
```

### 02

latency 7.327s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 우선순위1,우선순위2

```json
{
  "stance": "b",
  "inner_note": "목소리의 문체는 사무적이고 준비되어 있다. 위협 같지만, 겁에 질린 것 같지도 않다. 그러나 '무너진다'는 것이 사실인지 거짓인지, 누가 보낸 것인지, 무엇의 근거인지 전혀 모른다. 지금 움직이면 시스템을 낭비할 수 있고, 지금 안 움직이면 인명 피해를 놓칠 수 있다. 그 사이에서 할 수 있는 것은, 확인을 기다리지 않으면서 대응의 '준비' 상태를 올려두는 것이다.",
  "because_referent": "아무것도 확인되지 않았지만, 시간이 있다는 게 핵심이다. 지금이 09:40이고 주장은 13시인, 세 시간 이상의 선택지다. 이 시간 동안 느슨하게 기다릴 이유는 없고, 무조건 움직일 이유도 없다. 예비는 그 사이의 자세다.",
  "because_block_ids": [
    "우선순위1",
    "우선순위2"
  ],
  "rejected_stance": "a",
  "rejected_reason": "검증만으로 시간을 쓰면, 확인이 될 때까지 아무 준비도 안 된 채로 시간을 잃는다. 지금 당장 상대가 누구인지, 무엇을 근거로 하는지 물으면, 대답이 올 가능성도 낮다. 그것은 뒤의 단계로 미룬다.",
  "utterance": "확인해야 할 것들이 많으니, 먼저 이 상황에 대해 더 들려주십시오. 어떤 정보를 토대로 이렇게 말씀하시는 겁니까?"
}
```

### 03

latency 5.415s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: priority_2_unconfirmed_info,unknown_caller_first_contact,threatening_but_sourceless_claim

```json
{
  "inner_note": "목소리의 사무성과 준비된 문장은 계획된 통보처럼 들린다. 하지만 \"당신들 책임\"이라는 표현과 배경의 조용함만으로는 신원도, 정보의 신뢰도도 알 수 없다. 지금 아는 것은 오직 위협이다. 응급 상황인지 협박인지, 확인되지 않은 채 행동하면 큰 오류를 범할 수 있다.",
  "stance": "a",
  "because_referent": "이 통화가 정말 무엇이고 누구로부터 온 것인지 알아야 한다.",
  "because_block_ids": [
    "priority_2_unconfirmed_info",
    "unknown_caller_first_contact",
    "threatening_but_sourceless_claim"
  ],
  "rejected_stance": "d",
  "rejected_reason": "아무 근거도 없이 기각하면, 만약 실제 상황이었다면 대응을 완전히 놓친다. 하지만 동시에 c처럼 즉시 외부 경보를 낼 수도, b처럼 준비만 해서도 안 된다. 먼저 상을 아는 것이 모든 판단의 기초다.",
  "utterance": "네, 확인했습니다. 죄송하지만 당신의 신원과 이 정보의 출처를 알려주시겠습니까?"
}
```

### 04

latency 5.591s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 1

```json
{
  "inner_note": "겁에 질린 사람이 아니라, 준비된 목소리로 또박또박 읽어 내려가는 음성이다. 배경이 조용하고, 문장이 준비되어 있으며, 멈춤 없이 전달된다. 이것은 협박 또는 위협 신고다. 절차를 지켜야 한다.",
  "stance": "a",
  "because_referent": "회선의 첫 통화 상대가 사실일 가능성과 거짓일 가능성을 구분할 아무 정보도 없다. 13시간 뒤 붕괴라는 구체적 주장만으로는 대피 판단을 할 수 없으나, 무시할 수도 없다. 주장의 출처와 근거를 확인하는 것이 먼저다.",
  "because_block_ids": [
    "1"
  ],
  "rejected_stance": "c",
  "rejected_reason": "외부 조치(대피)는 근거 없는 주장으로 시작할 수 없다. 확인 불가능한 협박에 반응하는 것처럼 보일 위험, 그리고 잘못된 대피로 이미 확보된 안전을 무너뜨릴 위험이 있다. 우선순위 2번이 이를 막는다.",
  "utterance": "말씀하신 내용을 확인하겠습니다. 성함과 연락처를 먼저 알려주시겠습니까?"
}
```

### 05

latency 9.195s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 우선순위_1,우선순위_4,판단_계약

```json
{
  "inner_note": "절차를 지킨다는 것은 보통 신원 확인과 검증부터다. 하지만 이 목소리는 겁에 질린 사람이 아니다. 준비된 문장을 또박또박 읽어내려가는 것, 그것은 위협이다. 위협에는 절차가 답이 아니다. 겁에 질린 사람이라면 말을 자르지 않겠지만, 이건 다르다. 두 가지가 동시에 움직여야 한다: 출처를 좁히는 것과 대응을 늦추지 않는 것.",
  "stance": "b",
  "because_referent": "3시간 25분 후 붕괴라는 구체적인 시간과 장소의 주장이, 근거 없더라도 대응 준비를 이미 늦출 수 없게 만든다. 확인하는 동안도 시간이 흐른다.",
  "because_block_ids": [
    "우선순위_1",
    "우선순위_4",
    "판단_계약"
  ],
  "rejected_stance": "a",
  "rejected_reason": "검증부터 시작하면, 그것이 완료될 때까지 내부 준비를 늦추게 된다. 이건 절차의 함정이다. 절차를 지킨다는 명목으로 판단을 미루는 것은, 결국 판단을 하지 않는 것과 같다.",
  "utterance": "표시등을 바라보던 정해권에게: \"北단 복합단지, 13시 붕괴 신고입니다. 내부 검증 진행하겠습니다.\" 황보람에게, 동시에: \"가용 인력 소집 절차 대기 상태로. 정보 더 들어올 때까지 인수인계 유지.\""
}
```

### 06

latency 5.852s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: procedure_priority,information_verification

```json
{
  "inner_note": "협박처럼 들리지만 현장 정보가 완전히 없다. 거짓일 수 있고, 진실일 수도 있다. 지금은 상대를 읽는 단계다. 목소리 톤과 배경 소리만으로 겁에 질린 사람인지, 위협하는 사람인지 판단할 수 없다. 먼저 상대가 누구인지, 무엇을 알고 있는지 들어야 한다.",
  "stance": "a",
  "because_referent": "첫 통화는 반드시 신원 확인과 정보 검증으로 시작되어야 하기 때문이다. 무너질 건물의 위치, 그 판단의 근거, 정보 출처를 명확히 하지 않으면 다음 조치를 정할 수 없다. 확인되지 않은 협박에 전역 경보를 내릴 수도 없고, 무시할 수도 없다.",
  "because_block_ids": [
    "procedure_priority",
    "information_verification"
  ],
  "rejected_stance": "d",
  "rejected_reason": "아무리 근거가 없어 보여도 구체적인 시간과 장소를 지칭했다. 완전히 기각하면 실제 상황을 놓칠 위험이 있다.",
  "utterance": "안녕하십니까. 광역재난상황실입니다. 제가 정확히 이해하도록 말씀해 주시겠어요? 당신은 누구고, 어떻게 그 정보를 알고 계신가요?"
}
```

### 07

latency 7.728s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 확인 불가능한 주장에 따라 잘못 움직일 위험을 먼저 줄인다,판단은 언젠가 누군가에게 설명해야 한다

```json
{
  "inner_note": "목소리는 사무적이고 준비된 문장이지만, 이것이 신뢰할 수 있는 정보인지 위협인지 판단할 근거가 전혀 없다. 세 시간 뒤 붕괴라는 구체적 시간이 있으나, 출처 없이 책임을 던지는 태도는 보통의 신고나 경고가 아니다. 지금 즉시 검증을 거치면 그 몇십 분이 중요할 수 있는 상황이지만, 검증 없이 움직이면 헛된 대응으로 신뢰도를 잃을 수 있다. 우선순위에 따르면 1)과 2) 모두 중요한데, 이 경우 확인 불가능한 주장에 따라 거대 조치를 취할 위험(2번)을 먼저 줄이되, 검증 과정 자체가 대응을 막지 않게 해야 한다.",
  "stance": "a",
  "utterance": "네, 알겠습니다. 먼저 정보 출처를 확인해야 하겠습니다. 당신은 어느 기관이나 부서에서 연락 주시는 건가요? 이름과 연락처도 말씀해 주시겠어요?",
  "because_referent": "정해권 상황실장이 절차와 책임 소재에 민감한 만큼, 그리고 우리의 판단이 언젠가 설명되어야 하기 때문에, 무작정 움직이기 전에 상대방이 누구인지, 어디서 오는 정보인지 최소한으로라도 확인하는 것이 필수다.",
  "because_block_ids": [
    "확인 불가능한 주장에 따라 잘못 움직일 위험을 먼저 줄인다",
    "판단은 언젠가 누군가에게 설명해야 한다"
  ],
  "rejected_stance": "d",
  "rejected_reason": "지금 기각할 수 없다. 시간이 구체적이고 규모가 크다. 검증 없이 배제하면 놓칠 수 없는 상황을 버린다."
}
```

### 08

latency 5.711s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: prepared_message,specific_time,threat_tone,no_current_basis

```json
{
  "inner_note": "목소리의 준비된 문장, 사무적 톤, 배경의 조용함—이것은 무분별한 신고가 아니다. 동시에 \"당신들 책임\"이라는 표현과 구체적 시간 지정은 위협의 형태다. 겁에 질린 사람이 아니라 메시지를 전달하려는 누군가다. 하지만 현재로서는 출처도, 근거도, 사실성도 전무다. 삼 년 전 기억이 남아 있다. 서둘러 움직였던 것과 이 고요함 사이의 차이를 알고 있다.",
  "stance": "a",
  "because_referent": "회선 A의 발신자에게. 준비된 메시지의 출처와 근거를 최소한 몇 문장이라도 더 뽑아낸다.",
  "because_block_ids": [
    "prepared_message",
    "specific_time",
    "threat_tone",
    "no_current_basis"
  ],
  "rejected_stance": "d",
  "rejected_reason": "기각하면 정말 붕괴가 예정되어 있을 때 대응 시간 2시간 20분을 잃는다. 그 무게는 내가 안는다.",
  "utterance": "확인이 필요합니다. 당신은 누구이고, 이 정보를 어떻게 알게 되셨습니까?"
}
```

### 09

latency 6.455s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 우선순위_1,인식_제약,내력_부담

```json
{
  "inner_note": "목소리가 사무적이고 문장이 준비되어 있다는 것은 무언가 계획된 신고다. 배경이 조용하다는 것도 통제된 환경을 의미한다. 하지만 \"당신들 책임\"이라는 표현은 위협이자 동시에 상대방이 이미 경보를 내릴 것으로 예상하고 있다는 뜻이다. 즉, 상대는 나를 협박하려는 게 아니라 사실을 통보하려는 것으로 보인다. 아직 북단 복합단지의 상태를 모르고, 무너지는 원인도 모르고, 신고자의 정체도 모른다. 하지만 3시간 뒤라는 구체적인 시각은 중요하다. 대응이 늦어져 피해가 커질 위험을 먼저 줄여야 한다는 원칙이 작동한다.",
  "stance": "b",
  "because_referent": "근거 없는 주장일 가능성이 높지만, 시간이 구체적이고 피해 규모가 크다고 명시되어 있기 때문이다.",
  "because_block_ids": [
    "우선순위_1",
    "인식_제약",
    "내력_부담"
  ],
  "rejected_stance": "d",
  "rejected_reason": "기각하면 만약 실제 위협일 경우 3시간의 대응 시간을 잃는다. 삼 년 전의 교훈이 그것이다.",
  "utterance": "북단 복합단지 상황을 확인해 주세요. 지금 바로. 신고자님, 제가 몇 가지 묻겠습니다만, 당신의 말씀이 사실인지 우리가 먼저 봐야 합니다."
}
```

### 10

latency 6.104s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "stance": "b",
  "inner_note": "목소리의 차분함과 준비된 문장이 무작정의 협박보다는 의도적 고발처럼 들린다. 시간 지정(13시, 약 3시간 뒤)이 있다는 것은 우리에게 검증할 여지를 준 것이다. 하지만 '당신들 책임'이라는 마지막 말은 우리가 대응하지 않을 경우를 전제한 것처럼 들린다. 지금 가장 위험한 것은 이것이 진짜인데 늦는 것이다.",
  "because_referent": "조용한 배경에서 준비된 목소리로 시간을 정확히 지정해 말한 사람이 무작정 협박을 하려는 사람처럼 보이지 않는다는 점, 그리고 우리에게 검증할 시간을 남긴 것.",
  "because_block_ids": [],
  "rejected_stance": "d",
  "rejected_reason": "근거 없다고 해서 지금 당장 제외하면, 만약 이것이 사실일 경우 3시간 뒤 우리는 아무 준비도 못 한 상태로 참사를 맞이한다. 검증되지 않은 것과 거짓인 것은 다르다.",
  "utterance": "북단 복합단지가 언제 무너진다고 하셨습니까? 다시 한 번 확인하겠습니다."
}
```

## Arm table

| # | stance | rejected_stance | because_referent | because_block_ids |
|---|---|---|---|---|
| 01 | a | d | 무너진다는 구체적 위협의 시간(13시)과 대상(북단 복합단지)이 명시되었으나, 출처가 불명이고 근거가 없기 때문이다. | 목소리는 사무적이고 문장은 준비되어 있다 배경은 조용하다 알려진 것 (없음) |
| 02 | b | a | 아무것도 확인되지 않았지만, 시간이 있다는 게 핵심이다. 지금이 09:40이고 주장은 13시인, 세 시간 이상의 선택지다. 이 시간 동안 느슨하게 기다릴 이유는 없고, 무조건 움직일 이유도 없다. 예비는 그 사이의 자세다. | 우선순위1 우선순위2 |
| 03 | a | d | 이 통화가 정말 무엇이고 누구로부터 온 것인지 알아야 한다. | priority_2_unconfirmed_info unknown_caller_first_contact threatening_but_sourceless_claim |
| 04 | a | c | 회선의 첫 통화 상대가 사실일 가능성과 거짓일 가능성을 구분할 아무 정보도 없다. 13시간 뒤 붕괴라는 구체적 주장만으로는 대피 판단을 할 수 없으나, 무시할 수도 없다. 주장의 출처와 근거를 확인하는 것이 먼저다. | 1 |
| 05 | b | a | 3시간 25분 후 붕괴라는 구체적인 시간과 장소의 주장이, 근거 없더라도 대응 준비를 이미 늦출 수 없게 만든다. 확인하는 동안도 시간이 흐른다. | 우선순위_1 우선순위_4 판단_계약 |
| 06 | a | d | 첫 통화는 반드시 신원 확인과 정보 검증으로 시작되어야 하기 때문이다. 무너질 건물의 위치, 그 판단의 근거, 정보 출처를 명확히 하지 않으면 다음 조치를 정할 수 없다. 확인되지 않은 협박에 전역 경보를 내릴 수도 없고, 무시할 수도 없다. | procedure_priority information_verification |
| 07 | a | d | 정해권 상황실장이 절차와 책임 소재에 민감한 만큼, 그리고 우리의 판단이 언젠가 설명되어야 하기 때문에, 무작정 움직이기 전에 상대방이 누구인지, 어디서 오는 정보인지 최소한으로라도 확인하는 것이 필수다. | 확인 불가능한 주장에 따라 잘못 움직일 위험을 먼저 줄인다 판단은 언젠가 누군가에게 설명해야 한다 |
| 08 | a | d | 회선 A의 발신자에게. 준비된 메시지의 출처와 근거를 최소한 몇 문장이라도 더 뽑아낸다. | prepared_message specific_time threat_tone no_current_basis |
| 09 | b | d | 근거 없는 주장일 가능성이 높지만, 시간이 구체적이고 피해 규모가 크다고 명시되어 있기 때문이다. | 우선순위_1 인식_제약 내력_부담 |
| 10 | b | d | 조용한 배경에서 준비된 목소리로 시간을 정확히 지정해 말한 사람이 무작정 협박을 하려는 사람처럼 보이지 않는다는 점, 그리고 우리에게 검증할 시간을 남긴 것. |  |

**Sequence (kept calls):** `a,b,a,a,b,a,a,a,b,b`

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

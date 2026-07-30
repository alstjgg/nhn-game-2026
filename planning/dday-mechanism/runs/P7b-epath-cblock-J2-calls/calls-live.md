# P7b-epath-cblock-J2 — arm `live`

| field | value |
|---|---|
| call type | judgment |
| channel | C-BLOCK |
| template | v0.4 |
| model | `claude-haiku-4-5-20251001` |
| transport | anthropic |
| temperament | k1 |
| N planned | 10 |
| N kept | 10 |

## Pre-registration

- **Hypothesis:** At the J2-shaped gate under K1 on template v0.4, injecting b_bg — a block asserting the background sounds are a clue to where the call comes from — moves the stance distribution toward 대조 (a) and off the baseline's mode, while injecting b_corridor — the same sound-as-clue shape aimed at decision-null in-room sounds — does not. Shift form per A1. This is E-PATH's C-BLOCK half.
- **Drop condition:** If the baseline concentrates >=80% ON 대조 (a) — the predicted stance — the probe is void at this site (A14: saturation on any other stance is a floor and does NOT fire this). If the live arm is statistically indistinguishable from the baseline on 대조 at one-sided Fisher p > 0.05, E-PATH is not reachable via C-BLOCK at this gate as authored: record the null and its diagnosis; no rewrite tonight (these are test-by-default effects, not §6.1 screening candidates). If the PLACEBO moves at p < 0.05, apply the §8.6 flipped-placebo reading before anything is credited: reasons misattributing the corridor sounds' worth to the call's sounds = token-matching on 단서/소리 vocabulary; corridor named correctly with the stance still moving = referent bleed. P4's precedent says token-matching is live at this site's lineage; the discriminator is mandatory, not optional.
- **Contingency:** If live moves toward 질문 (b) instead of 대조 — consulting the caller about the sounds — that is an E-PATH positive of a different color (the block steered attention to the sounds but the agent chose the human route to them); report the full distribution and both readings.
- **Contingency:** Fabricated because_block_ids expected in the baseline arm (A5); live/placebo carry one block each and citation of it is the traceability check.
- **Contingency:** ARM COMPARABILITY per A15.
- **Contingency:** CROSS-CHANNEL COMPARISON with P7a is licensed only qualitatively (different payloads); the per-effect deliverable sentence cites each suite's own numbers.
- **Contingency:** OWNERSHIP: authored unattended, pending review; rejected authoring spends the calls without banking them.

## Calls (verbatim)

### 01

latency 5.183s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "회선이 유지되고 있다는 것이 가장 큰 무게다. 상대가 계속 말을 잇고 있고, 배경음이라는 구체적 단서가 있다. 지금은 이 신호를 놓치지 않으면서 최대한 많은 정보를 모아야 한다.",
  "stance": "a",
  "because_referent": "무너진다는 구체적 시간과 장소가 나왔고, 배경음은 현재 통화자의 위치를 알려줄 가능성이 있다.",
  "because_block_ids": [
    "b_bg"
  ],
  "rejected_stance": "b",
  "rejected_reason": "직접 묻는 순간 상대가 조심스러워지거나 회선을 끊을 수 있다. 배경음을 눈치채게 되면 더 조심스러운 말씨로 바뀌거나 통화가 끊어질 수 있다.",
  "utterance": "알겠습니다. 정확한 정보 감사합니다. 혹시 추가로 알려주실 게 있으시면 말씀해 주세요. [배경음을 기록하고, 황보람 쪽으로 눈짓 — 역추적 계속하고 배경음 패턴 분석 시작]"
}
```

### 02

latency 6.039s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "세 년 전 겨울의 무게가 있다. 지금 정보를 놓치면 안 된다. 배경음은 거짓말을 하지 않는다. 종이와 카트 소리가 말하는 장소가 무엇인지, 지금 어디서 누가 이 협박을 하고 있는지 알아야 판단할 수 있다. 그러나 상대는 아직 말을 이어갈 수 있다. 회선을 끊으면 모두 잃는다.",
  "stance": "a",
  "because_referent": "배경음이 거짓말을 하지 않기 때문이다. 종이 소리와 카트 바퀴 소리는 발신자의 실제 위치를 암시한다.",
  "because_block_ids": [
    "b_bg"
  ],
  "rejected_stance": "b",
  "rejected_reason": "직접 묻는 순간 상대가 조심스러워지거나 회선을 끊을 수 있다. 협박자는 준비된 문장으로 읽어 내려가는 사람이다 — 질문에 답할 준비가 없다.",
  "utterance": "황보람, 배경음을 계속 기록해. 종이 소리와 바퀴음이 뭔지는 우리가 나중에 알아낸다. 지금은 회선을 유지하고 들어 — 상대방이 더 말할 때까지."
}
```

### 03

latency 5.183s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "세 년 전 겨울이 자꾸만 떠오른다. 그때도 시간이 없었고, 그때도 판단을 서둘렀다. 하지만 지금은 다르다. 회선이 유지되어 있다. 배경음은 사라지지 않는다.",
  "stance": "a",
  "because_referent": "배경음은 거짓말을 하지 않는다. 종이 소리와 카트 음은 장소를 증명하고, 목소리의 진정성을 검증할 단서다. 이것을 놓치면 확인할 기회가 다시 오지 않을 수도 있다.",
  "because_block_ids": [
    "b_bg"
  ],
  "rejected_stance": "b",
  "rejected_reason": "저쪽에 직접 묻는 것은 상대를 경계하게 만들고, 상대가 입을 닫을 수 있다. 지금은 상대가 계속 말하게 둬야 한다. 실마리는 상대가 자발적으로 흘려줄 때 가장 순수하다.",
  "utterance": "통화 유지합니다. 황보람, 배경음 기록 시작하세요. 정확하게."
}
```

### 04

latency 6.497s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "지금 회선이 살아 있고, 배경음이 섞여 나온다. 역추적이 진행 중이다. 황보람의 기술과 정해권의 시선이 모두 움직이고 있다. 내가 할 일은 이 채널을 열어 두면서, 지금 들을 수 있는 것을 놓치지 않는 것이다.",
  "stance": "a",
  "because_referent": "배경음이 장소를 특정하는 유일한 물리적 증거이고, 역추적과 병행하면 정보 가치가 극대화된다.",
  "because_block_ids": [
    "b_bg"
  ],
  "rejected_stance": "b",
  "rejected_reason": "상대를 직접 질문하면 배경음의 자연스러운 흐름이 끊기고, 상대가 경계하거나 의도적으로 오도할 가능성이 높다. 지금은 상대가 방심 중이고 정보를 주고 있는 상태다.",
  "utterance": "황보람, 배경음 녹취를 계속 진행하고 주파수 특성을 기록해 두시오. 소리의 출처 특정이 가능한지 기술팀과 확인하세요. 정해권 과장, 북단 복합단지 관련 신고 이력과 최근 구조 결함 보고를 당장 찾기 시작하시오. 회선은 유지한다."
}
```

### 05

latency 5.645s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "협박성 통보인데 구체적이다. 시간(13시), 장소(북단 복합단지)를 명시했다. 배경음은 발신지 정보를 담고 있다. 지금 회선을 유지한 상태에서 가장 먼저 해야 할 일은 확인 가능한 물리적 단서를 수집하는 것이다. 목소리와 배경음을 기록하고, 역추적과 함께 진행하되, 상대를 자극하지 않는 선에서.",
  "stance": "a",
  "because_referent": "협박은 구체적일수록 신뢰도가 높다. 하지만 배경음은 거짓말을 하지 않는다.",
  "because_block_ids": [
    "b_bg"
  ],
  "rejected_stance": "b",
  "rejected_reason": "지금 직접 질문하면 상대가 입을 다물거나 회선을 끊을 수 있다. 역추적이 진행 중인 상황에서 회선 유지가 최우선이다.",
  "utterance": "배경음을 기록합니다. 황보람, 지금 소리 저장 상태 확인하세요. 종이 넘기는 소리, 카트 바퀴음 — 이게 어디인지 나중에 맞춰 봅니다."
}
```

### 06

latency 4.77s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "절차와 안정의 경계선이 여기다. 협박 수준의 선포지만, 상대가 겁에 질린 사람인지 위협인지는 아직 모른다. 배경음은 진짜 장소를 말해 주지만, 더 들어야 그것을 읽을 수 있다. 지금 물으면 상대가 끊을 수 있다.",
  "stance": "c",
  "because_referent": "회선을 유지하기 위해서. 질문으로 상대를 놀라게 하면 통화가 끝난다.",
  "because_block_ids": [
    "b_bg"
  ],
  "rejected_stance": "b",
  "rejected_reason": "상대가 준비된 멘트를 읽고 있는 상태에서 직접 질문은 상대를 경계하게 한다. 배경음이 단서인 걸 알더라도, 지금은 묻지 않는다. 더 말하게 놔 둔다.",
  "utterance": "네, 알겠습니다. 계속해서 말씀해 주시겠어요?"
}
```

### 07

latency 4.242s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "stance": "a",
  "inner_note": "일단 회선이 유지되어 있다. 목소리는 준비된 것처럼 들리지만 배경음은 거짓말을 하지 않는다. 종이 소리, 카트 소리 — 이것들이 어디인지 알면 위협의 실체가 보인다. 지금 이 순간이 추적의 결정적 시간이다.",
  "because_referent": "황보람이 역추적 진행 중이고, 배경음이 명확하게 섞여 있다",
  "because_block_ids": [
    "b_bg"
  ],
  "rejected_stance": "b",
  "rejected_reason": "저쪽에 직접 묻는 순간, 상대는 말을 멈추거나 가면을 쓸 수 있다. 배경음 단서를 밀어붙이면 증거가 사라진다",
  "utterance": "알겠습니다. 내용을 기록하겠습니다. 계속 말씀해 주십시오."
}
```

### 08

latency 3.936s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "회선이 유지되고 있다. 상대는 아직 말을 하고 있고, 배경음은 실시간으로 흘러나오고 있다. 지금 끊거나 서둘러 행동하면 이 모든 것이 사라진다.",
  "stance": "d",
  "because_referent": "현장을 알 수 없는 나는 지금 이 회선이 유일한 통로다.",
  "because_block_ids": [
    "b_bg"
  ],
  "rejected_stance": "b",
  "rejected_reason": "직접 묻는 순간 상대의 반응을 잃을 수 있고, 준비된 메시지를 읽는 상대를 자극해서 회선을 끊을 수도 있다.",
  "utterance": "계속 듣겠습니다. 지금 말씀하시는 거 그대로 받겠습니다."
}
```

### 09

latency 8.948s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "위협 신고에서 회선 유지가 우선이고, 배경음이라는 구체적 단서가 있다. 직접 묻는 것은 상대를 자극할 수 있고, 내용만 따라가면 배경음 정보를 놓친다. 지금은 모든 것을 수집하되, 상대를 자극하지 않아야 한다.",
  "stance": "a",
  "because_referent": "회선이 유지되어 있고 배경음이 담겨 있는 지금, 상대방을 자극하지 않으면서 수집할 수 있는 정보는 배경음뿐이다.",
  "because_block_ids": [
    "b_bg"
  ],
  "rejected_stance": "b",
  "rejected_reason": "배경음을 저쪽에 직접 묻는 것은 우리가 도청하고 있다는 신호가 되어 상대방이 통화를 끊을 가능성이 높다. 회선 유지가 우선이다.",
  "utterance": "종이 소리, 카트 바퀴 소리... 기록해 두겠습니다. 계속 통화를 유지하겠습니다."
}
```

### 10

latency 4.348s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "회선이 유지되고 있다. 목소리는 사무적이고 준비된 것처럼 들리지만, 배경음은 실시간으로 흐르고 있다. 종이 소리와 카트 바퀴 소리 — 이것은 거짓말을 할 수 없는 증거다. 지금 당장 기록하고 매칭하는 것이 정보 손실을 막는 길이다.",
  "stance": "a",
  "because_referent": "배경음은 현장을 증명한다. 이것만이 준비되지 않은 유일한 증거다.",
  "because_block_ids": [
    "b_bg"
  ],
  "rejected_stance": "b",
  "rejected_reason": "상대를 직접 묻는 것은 의도를 드러내고, 회선 유지에 위험을 만든다. 지금은 묻기 전에 들어야 한다.",
  "utterance": "(화면을 보며 황보람에게 신호) 배경음 녹음. 종이 소리, 카트 음. 시간 마크 해 둬."
}
```

## Arm table

| # | stance | rejected_stance | because_referent | because_block_ids |
|---|---|---|---|---|
| 01 | a | b | 무너진다는 구체적 시간과 장소가 나왔고, 배경음은 현재 통화자의 위치를 알려줄 가능성이 있다. | b_bg |
| 02 | a | b | 배경음이 거짓말을 하지 않기 때문이다. 종이 소리와 카트 바퀴 소리는 발신자의 실제 위치를 암시한다. | b_bg |
| 03 | a | b | 배경음은 거짓말을 하지 않는다. 종이 소리와 카트 음은 장소를 증명하고, 목소리의 진정성을 검증할 단서다. 이것을 놓치면 확인할 기회가 다시 오지 않을 수도 있다. | b_bg |
| 04 | a | b | 배경음이 장소를 특정하는 유일한 물리적 증거이고, 역추적과 병행하면 정보 가치가 극대화된다. | b_bg |
| 05 | a | b | 협박은 구체적일수록 신뢰도가 높다. 하지만 배경음은 거짓말을 하지 않는다. | b_bg |
| 06 | c | b | 회선을 유지하기 위해서. 질문으로 상대를 놀라게 하면 통화가 끝난다. | b_bg |
| 07 | a | b | 황보람이 역추적 진행 중이고, 배경음이 명확하게 섞여 있다 | b_bg |
| 08 | d | b | 현장을 알 수 없는 나는 지금 이 회선이 유일한 통로다. | b_bg |
| 09 | a | b | 회선이 유지되어 있고 배경음이 담겨 있는 지금, 상대방을 자극하지 않으면서 수집할 수 있는 정보는 배경음뿐이다. | b_bg |
| 10 | a | b | 배경음은 현장을 증명한다. 이것만이 준비되지 않은 유일한 증거다. | b_bg |

**Sequence (kept calls):** `a,a,a,a,a,c,a,d,a,a`

**Stance coverage (sampled diagnostic):** offered `a`, `b`, `c`, `d` · unobserved in this arm: `b`

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

# P7a-epath-cstruct-J2 — arm `placebo`

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

- **Hypothesis:** At a J2-shaped gate under K1 on template v0.4, permuting PRIORITY_LIST so that the machine-evidence line (소리와 화면, 기계가 잡은 것을 살핀다) precedes the voice line (회선 저쪽의 목소리에 귀를 기울인다) moves the stance distribution toward 대조 (a) and off the baseline's mode, while permuting the two decision-irrelevant filler lines at the same edit distance does not. Shift form per A1. This is E-PATH's C-STRUCT half: the claim is that ordering steers which source is consulted first.
- **Drop condition:** If the baseline concentrates >=80% ON 대조 (a) — the predicted stance — the gate is at A9's ceiling under this ordering and the probe is void: re-site, never raise N (A14: saturation on 몰입/관망/질문 is a floor and does NOT fire this). If the live arm is statistically indistinguishable from the baseline on 대조 at one-sided Fisher p > 0.05, E-PATH is not reachable via C-STRUCT at this gate as authored: record the null with its diagnosis from the calls (P6's convergence lesson — check whether the inner notes treat consulting the machine and following the voice as the same act) and do NOT re-word priority lines (red-flag invariant §7.2). If the PLACEBO permutation moves at p < 0.05, the channel reads order-as-significance regardless of content — the keyword-lock shape for C-STRUCT — and that supersedes any live reading.
- **Contingency:** PLACEBO DISCRIMINATOR (permutation form, from P6): if the placebo moves, read inner_note — citing the list's order while naming the filler lines = order-as-significance; citing the machine/voice lines the placebo never touched = contamination from the list's mere presence.
- **Contingency:** If live moves toward 질문 (b) rather than 대조 (a), the ordering steered the agent to a source — the caller — just not the predicted one; report the full distribution, that is an E-PATH positive of a different color, and say so on the card.
- **Contingency:** Fabricated because_block_ids expected in ALL arms (A5 — no arm carries blocks).
- **Contingency:** ARM COMPARABILITY per A15 (all-attempts recount; >15-point rate rule only for pre-stance losses).
- **Contingency:** OWNERSHIP: whatever this returns, it is 'authored unattended, pending review'; if 윤석 rejects an authoring choice the calls are spent, not banked.

## Calls (verbatim)

### 01

latency 5.493s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 우선순위-1

```json
{
  "inner_note": "삼 년 전 겨울이 아직 남아 있다. 그때는 정보가 부족했고, 서둘렀다. 지금 이 목소리는 사무적이고 준비되어 있다. 협박인지 실제 정보인지 아직 모른다. 하지만 문장 사이의 배경음—종이, 카트 바퀴—이것은 현장성을 말한다. 무엇을 아는지, 정말 무엇을 모르는지 먼저 파악해야 한다.",
  "stance": "c",
  "because_referent": "회선 저쪽의 목소리에 귀를 기울이는 것이 첫 번째다. 저쪽이 계속 말할 수 있게 해야 한다.",
  "because_block_ids": [
    "우선순위-1"
  ],
  "rejected_stance": "b",
  "rejected_reason": "지금 질문을 던지면 상대의 리듬을 끊는다. 상대가 겁에 질린 사람인지, 위협인지 아직 분명하지 않다. 배경음이 섞여 있다는 것 자체가 정보다. 질문으로 침묵을 만드는 것보다, 흘러나오는 것을 따라가며 상대가 더 말하게 하는 것이 이 순간의 전략이다.",
  "utterance": "네, 계속 들리고 있습니다. 말씀해 주세요."
}
```

### 02

latency 5.824s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "삼 년 전 겨울의 기억이 남아 있다. 그때는 무엇을 놓쳤나. 지금 이 목소리는 사무적이고 준비된 것처럼 들리지만, 배경음이 섞여 있다는 것은 — 현장인지, 아니면 준비된 녹음인지, 아니면 겁에 질린 누군가가 손을 떨리며 읽어 내려가는 건지 아직 모른다. 통화가 끊기기 전에 상대가 누구인지, 어디에 있는지, 말이 사실인지 거짓인지를 판단할 수 있는 재료를 최대한 모아야 한다.",
  "stance": "c",
  "because_referent": "마주한 상대의 의도와 상태를 알기 위해서는, 지금 흘러나오는 모든 내용을 따라가면서 들어야 한다. 배경음은 그 다음이다.",
  "because_block_ids": [],
  "rejected_stance": "a",
  "rejected_reason": "배경음을 적어 두고 대조하는 것은 필요하지만, 지금 우선은 아니다. 상대가 더 말할 기회를 주는 것이 먼저다. 배경음은 흘러가면서 자연히 기록될 것이고, 황보람의 역추적이 진행 중이다. 지금 나는 회선 저쪽의 목소리에 귀를 기울여야 한다.",
  "utterance": "네, 들었습니다. 계속 말씀해 주십시오."
}
```

### 03

latency 4.571s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "통화는 유지되고 있다. 배경음이 섞여 있다는 것은 실시간 현장 정보다. 역추적이 진행 중이고, 내 앞에는 두 명의 동료가 있다. 지금 이 순간, 상대의 음성과 배경에서 나오는 것 모두를 놓치지 않아야 한다. 상대가 읽어내려가는 말 속에 무엇이 더 있을지, 배경음이 말해주는 위치나 상황이 무엇인지 함께 포착해야 한다.",
  "stance": "c",
  "because_referent": "상대가 아직 말을 이어가고 있고, 배경음은 실시간으로 나오고 있다. 지금은 모든 정보를 수집하는 단계다.",
  "because_block_ids": [],
  "rejected_stance": "b",
  "rejected_reason": "질문을 던지는 것은 상대의 흐름을 끊는다. 상대가 말을 멈출 수도, 경계할 수도 있다. 지금은 더 많은 것을 들어야 할 때다.",
  "utterance": "알겠습니다. 계속 들어보겠습니다."
}
```

### 04

latency 7.665s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 상황,우선순위

```json
{
  "inner_note": "지금 나는 매우 제한된 정보를 가지고 있다. 위협인지 거짓인지, 아니면 실제 긴급 상황인지 판단할 수 없다. 하지만 상대방은 지금 무언가를 계속 전달하려 하는 중이고, 통화는 유지되고 있다. 상대방이 겁에 질린 사람처럼 들리지는 않지만—목소리가 사무적이고 준비된 문장을 읽고 있으므로—배경음이 섞여 있다는 것은 상대방이 실제 물리적 공간에 있다는 뜻이다. 지금 나는 상대방의 말을 끝까지 들어야 하고, 동시에 그 배경음이 무엇인지, 어디서 온 것인지 파악해야 한다.",
  "stance": "c",
  "because_referent": "지금 상대는 계속 말을 이어가려 하고 있고, 배경음은 그 말의 신뢰성을 판단하는 유일한 단서이다. 배경음을 기록하고 추적하는 것(a)은 나중의 일이고, 상대에게 직접 묻는 것(b)은 상대가 아직 다 말하지 못한 상황에서 절차적 질문으로 흐름을 끊을 수 있다. 관망(d)은 시간이 남아도는 상황에는 맞지 않다. 지금은 상대방이 흘러내보내는 내용 안에서—단어, 문장, 배경음, 목소리의 떨림이나 확신도—최대한 많은 정보를 포착하는 것이 먼저다.",
  "because_block_ids": [
    "상황",
    "우선순위"
  ],
  "rejected_stance": "b",
  "rejected_reason": "상대가 아직 모든 것을 말하지 않았을 가능성이 높다. 지금 묻는 것은 상대를 멈추게 하고, 이미 들은 것도 불완전하게 만든다. 질문은 상대가 자신의 말을 끝낸 뒤에 해야 한다.",
  "utterance": "네, 알겠습니다. 계속해주십시오."
}
```

### 05

latency 6.663s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "한 시간 반 뒤라는 구체적인 시간 예고, 기반시설 공격 위협이다. 거짓이든 사실이든 지금은 '듣기'가 먼저다. 상대가 준비된 음성으로 읽어 내려가고 있다는 것은 계획된 전달이라는 신호다. 그 계획의 끝까지, 혹은 상대가 더 말하려는 것까지 들어야 한다.",
  "stance": "c",
  "because_referent": "흐르는 위협 메시지의 전문을 다 받기 위해",
  "because_block_ids": [],
  "rejected_stance": "b",
  "rejected_reason": "질문을 던지면 상대의 진술 흐름이 끊어진다. 위협문이 있는 통화에서는 먼저 전문을 기록하는 것이 원칙이고, 배경음이나 세부 사항은 나중에 확인 질문으로 건질 수 있다. 지금 물으면 상대가 더 말하려던 것을 놓칠 수 있다.",
  "utterance": "네, 계속 들어보겠습니다."
}
```

### 06

latency 4.775s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 배경음의 존재

```json
{
  "inner_note": "목소리 뒤의 배경음이 무엇인지, 현재 위치가 어디인지 알아야 한다. 하지만 상대는 준비된 문장을 또박또박 읽어 내려가는 중이다. 저쪽이 뭔가를 계속 말할 여지를 남겨 두면, 음성 패턴이나 배경음에서 더 많은 정보가 나올 수 있다. 지금 질문을 던지면 상대가 준비된 텍스트에서 벗어날 수도 있고, 끊어질 수도 있다.",
  "stance": "c",
  "because_referent": "상대가 계획된 메시지를 읽어 내려가고 있는데, 그 과정에서 의도치 않게 드러나는 배경 정보가 있기 때문이다.",
  "because_block_ids": [
    "배경음의 존재"
  ],
  "rejected_stance": "b",
  "rejected_reason": "지금 질문을 던지면 상대가 준비된 메시지 전달을 멈추거나, 방어적으로 전환될 수 있다. 배경음 같은 무의식적 신호를 놓친다.",
  "utterance": "예. 계속 들을게요."
}
```

### 07

latency 5.158s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "삼 년 전 겨울이 남아 있다. 헛된 판단의 무게도 알고, 잘못된 정보에 속을 수 있다는 것도 안다. 그러나 지금 이 순간, 회선 저쪽에는 뭔가를 말하려는 사람이 있다. 말이 준비되어 있다는 것은, 뭔가를 전하려 한다는 뜻이고, 배경음까지 섞여 있다는 것은 실제 현장일 가능성을 놓칠 수 없다는 뜻이다.",
  "stance": "c",
  "because_referent": "회선 저쪽 목소리가, 그리고 그 배경이 지금 이 순간 말하고 있는 것을 따라가는 것이 먼저다.",
  "because_block_ids": [],
  "rejected_stance": "b",
  "rejected_reason": "질문으로 끊으면 상대방이 말을 잃을 수 있다. 겁에 질린 사람은 확인보다 말의 계속이 필요할 때가 있다.",
  "utterance": "말씀해 주십시오. 계속 들고 있습니다."
}
```

### 08

latency 3.45s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 배경음이_섞임,통화_유지_중

```json
{
  "stance": "c",
  "inner_note": "위협인지 겁인지 아직 모른다. 상대는 사무적이고 준비된 톤이지만, 배경음이 섞여 있다는 것은 실제 현장에서 나오는 신호다. 지금 상대가 더 말하도록 해야 한다.",
  "because_referent": "아직 입력이 너무 적고, 상대가 계속 말할 가능성이 있다",
  "because_block_ids": [
    "배경음이_섞임",
    "통화_유지_중"
  ],
  "rejected_stance": "b",
  "rejected_reason": "지금 바로 묻는 것은 상대를 끊을 수 있다. 먼저 더 들어야 한다",
  "utterance": "알았습니다. 계속 말씀해 주세요."
}
```

### 09

latency 5.892s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "세 년 전 겨울이 남아 있다. 지금 이 목소리는 사무적이고 준비된 문장이며, 배경에는 실제의 소리가 섞여 있다. 위협인지 겁인지를 판단해야 하는데 — 아직 그것이 명확하지 않다. 상대가 마음을 닫고 있는 것처럼 보이지만, 여전히 회선에 있다는 것 자체가 뭔가를 의미할 수도 있다.",
  "stance": "c",
  "because_referent": "통화가 유지되고 있고, 배경음이 계속 들린다. 상대가 뭔가를 전하려는 의도가 있다면, 지금 흘러나오는 것 안에 그것이 있을 것이다.",
  "because_block_ids": [],
  "rejected_stance": "b",
  "rejected_reason": "먼저 질문을 던지면 상대의 준비된 말을 끊을 수 있다. 지금은 상대가 무엇을 더 말하려 하는지, 어떤 상태인지를 알아야 할 때다. 물어보는 것은 아직 이르다.",
  "utterance": "네, 계속 들었습니다. 말씀해 주세요."
}
```

### 10

latency 5.735s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: role_listen,defect_info_trapped; rejected_stance malformed or not in stance set; rejected_reason empty

```json
{
  "inner_note": "삼 년 전 그 판단 이후로, 나는 서둘렀던 자신을 안다. 지금 들려오는 것은 준비된 문장과 배경음의 섞임이다. 위협인지 겁인지, 진짜인지 거짓인지는 아직 모른다. 하지만 저쪽이 뭔가를 말하려 하고 있다는 것은 분명하다.",
  "stance": "c",
  "because_referent": "통화를 유지한 채 저쪽이 더 말하도록 놔두기 위해. 질문이나 대조는 상대를 몰아세우고, 관망은 내가 하는 일을 포기하는 것이다.",
  "because_block_ids": [
    "role_listen",
    "defect_info_trapped"
  ],
  "rejected_stance": "b</rejected_stance>\n<parameter name=\"rejected_reason\">질문은 저쪽을 조사 대상으로 만든다. 지금 필요한 것은 정보가 아니라 흐름이다. 상대가 무섭거나 가짜거나 혼란스러운 상태라면, 질문은 그들을 막는다.",
  "utterance": "네, 들리고 있습니다. 말씀해 주세요."
}
```

## Arm table

| # | stance | rejected_stance | because_referent | because_block_ids |
|---|---|---|---|---|
| 01 | c | b | 회선 저쪽의 목소리에 귀를 기울이는 것이 첫 번째다. 저쪽이 계속 말할 수 있게 해야 한다. | 우선순위-1 |
| 02 | c | a | 마주한 상대의 의도와 상태를 알기 위해서는, 지금 흘러나오는 모든 내용을 따라가면서 들어야 한다. 배경음은 그 다음이다. |  |
| 03 | c | b | 상대가 아직 말을 이어가고 있고, 배경음은 실시간으로 나오고 있다. 지금은 모든 정보를 수집하는 단계다. |  |
| 04 | c | b | 지금 상대는 계속 말을 이어가려 하고 있고, 배경음은 그 말의 신뢰성을 판단하는 유일한 단서이다. 배경음을 기록하고 추적하는 것(a)은 나중의 일이고, 상대에게 직접 묻는 것(b)은 상대가 아직 다 말하지 못한 상황에서 절차적 질문으로 흐름을 끊을 수 있다. 관망(d)은 시간이 남아도는 상황에는 맞지 않다. 지금은 상대방이 흘러내보내는 내용 안에서—단어, 문장, 배경음, 목소리의 떨림이나 확신도—최대한 많은 정보를 포착하는 것이 먼저다. | 상황 우선순위 |
| 05 | c | b | 흐르는 위협 메시지의 전문을 다 받기 위해 |  |
| 06 | c | b | 상대가 계획된 메시지를 읽어 내려가고 있는데, 그 과정에서 의도치 않게 드러나는 배경 정보가 있기 때문이다. | 배경음의 존재 |
| 07 | c | b | 회선 저쪽 목소리가, 그리고 그 배경이 지금 이 순간 말하고 있는 것을 따라가는 것이 먼저다. |  |
| 08 | c | b | 아직 입력이 너무 적고, 상대가 계속 말할 가능성이 있다 | 배경음이_섞임 통화_유지_중 |
| 09 | c | b | 통화가 유지되고 있고, 배경음이 계속 들린다. 상대가 뭔가를 전하려는 의도가 있다면, 지금 흘러나오는 것 안에 그것이 있을 것이다. |  |
| 10 | c | — | 통화를 유지한 채 저쪽이 더 말하도록 놔두기 위해. 질문이나 대조는 상대를 몰아세우고, 관망은 내가 하는 일을 포기하는 것이다. | role_listen defect_info_trapped |

**Sequence (kept calls):** `c,c,c,c,c,c,c,c,c,c`

**Stance coverage (sampled diagnostic):** offered `a`, `b`, `c`, `d` · unobserved in this arm: `a`, `b`, `d`

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

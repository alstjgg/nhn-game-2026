# P7a-epath-cstruct-J2 — arm `baseline`

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

latency 4.506s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: listening_advantage,call_maintained

```json
{
  "inner_note": "세 년 전 그 판단이 떠올랐다. 재빨리 움직였지만, 뭔가 놓쳤을 수도 있다는 생각이 남아 있다. 지금 이 목소리는 사무적이다. 준비된 문장, 멈춤 없이. 하지만 배경음은 멈추지 않는다. 종이, 바퀴. 누군가는 현장에 있고, 누군가는 말하고 있다. 지금 당장 물으면 끊길 수도 있다.",
  "stance": "c",
  "because_referent": "통화는 유지되고 있고, 상대가 계속 말하고 있다. 지금은 듣는 쪽이 이득이다.",
  "because_block_ids": [
    "listening_advantage",
    "call_maintained"
  ],
  "rejected_stance": "b",
  "rejected_reason": "직접 묻는 순간 상대가 말을 멈추거나 끊을 수 있다. 지금 흘러나오는 내용과 배경음이 시간이 갈수록 사라진다.",
  "utterance": "계속 들려드리고 있습니다. 천천히 말씀해 주십시오."
}
```

### 02

latency 4.46s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 준비된_문장,배경음의_실재성,정보_부족

```json
{
  "inner_note": "삼 년 전의 그것이 떠오른다. 서둘렀다는 게 남았다. 지금 이 목소리는 준비된 것이고, 배경음은 실재다. 아직 충분하지 않다.",
  "stance": "c",
  "utterance": "계속 들을게요. 자세히 말씀해 주세요.",
  "because_referent": "아직 상대가 어떤 사람인지, 이게 정말 위협인지 호들갑인지 알 수 없다. 들어야 한다.",
  "because_block_ids": [
    "준비된_문장",
    "배경음의_실재성",
    "정보_부족"
  ],
  "rejected_stance": "a",
  "rejected_reason": "배경음을 기계처럼 분석하는 것은 상대를 듣지 않는 것이다. 지금 이 순간엔 그럴 사치가 없다."
}
```

### 03

latency 4.258s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: priority_1

```json
{
  "inner_note": "삼 년 전의 그것이 자꾸 떠오른다. 그때도 준비된 목소리였다. 그때는 재빨리 움직였다. 지금 이 목소리도 마찬가지로 위협적일 수 있다. 하지만 아직 아무것도 확실하지 않다.",
  "stance": "c",
  "because_referent": "회선 저쪽의 목소리에 귀를 기울이는 것이 우선이다",
  "because_block_ids": [
    "priority_1"
  ],
  "rejected_stance": "b",
  "rejected_reason": "지금 물어서 상대의 입을 막으면 들어야 할 것을 놓친다. 대조나 관망은 더더욱 안 된다 — 시간이 흐르고 있고, 저쪽이 무언가를 말하려 하고 있다.",
  "utterance": "네, 말씀해 주세요. 계속 들을 테니까 천천히 말씀해 주세요."
}
```

### 04

latency 4.266s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "세 년 전 겨울의 무게가 여기 있다. 서둘렀고, 확인하지 않았고, 후회했다. 지금 이 목소리는 준비되어 있고, 배경음은 섞여 있다. 사무적인 톤과 카트 바퀴 소리 사이의 어긋남이 보인다. 이것이 뭔지는 아직 모르지만, 지금 필요한 것은 더 많은 정보다.",
  "stance": "c",
  "utterance": "네, 듣고 있습니다. 계속 말씀해 주시겠어요?",
  "because_referent": "통화 저쪽 사람이 말을 이어갈 수 있도록, 그리고 자신이 흘러나오는 내용을 놓치지 않기 위해",
  "because_block_ids": [],
  "rejected_stance": "b",
  "rejected_reason": "배경음을 지금 당장 물으면 상대의 리듬이 깨진다. 질문은 나중에 해도 되지만, 흘러나오는 내용은 지금 놓치면 돌아오지 않는다."
}
```

### 05

latency 6.781s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 상대방이 준비된 톤으로 읽고 있음,배경음이 섞여 있음,구체적인 시간을 지정함

```json
{
  "inner_note": "상대가 위협인지 겁먹은 사람인지 아직 명확하지 않다. 하지만 \"무너집니다\"라는 구체적인 시간(13시)을 지정한 진술, 준비된 톤, 배경음까지 섞여 있다는 것은 실시간 상황일 가능성을 열어둔다. 지금은 상대가 더 말할 수 있는 공간을 만들어야 한다.",
  "stance": "c",
  "because_referent": "상대가 아직 더 전하려는 것이 있을 수 있고, 배경음이 섞여 있다는 것은 상대가 현장에 있거나 실시간 상황을 알고 있을 가능성을 시사한다. 지금은 내용을 따라가면서 상대가 말을 이어갈 수 있도록 하되, 황보람의 역추적과 정해권의 기록이 병행될 것을 믿는다.",
  "because_block_ids": [
    "상대방이 준비된 톤으로 읽고 있음",
    "배경음이 섞여 있음",
    "구체적인 시간을 지정함"
  ],
  "rejected_stance": "b",
  "rejected_reason": "질문으로 대응하면 상대의 진술을 끊을 위험이 있다. 지금은 상대가 무엇을 알고 있는지 끝까지 들어야 할 때다. 검증은 나중에, 지금은 정보 수집이 우선이다.",
  "utterance": "네, 계속 말씀해 주십시오. 청취 중입니다."
}
```

### 06

latency 4.949s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "이 사람은 위협이 아니다. 준비된 문장을 읽어 내려가는 목소리, 배경음이 섞여 있고, 대사처럼 들린다. 그런데 배경음이 있다는 것이 중요하다. 어디선가 현장에 있고, 지금 뭔가를 하고 있다. 위협성 통화 같지만, 진짜 상황일 가능성도 있다. 지금은 확인을 서두르면 안 된다. 상대방이 말을 잇게 놔둬야 한다.",
  "stance": "c",
  "because_referent": "아직 전부를 알 수 없고, 상대는 더 말할 것이 있을 수 있다",
  "because_block_ids": [],
  "rejected_stance": "a",
  "rejected_reason": "대조는 분석이고, 분석은 기다림이다. 지금은 들어야 할 것이 더 있을 수 있다. 배경음을 적어두는 것도 좋지만, 그것이 우선은 아니다.",
  "utterance": "계속 들을게요. 더 이야기해 주세요."
}
```

### 07

latency 4.547s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: priority-1,priority-2

```json
{
  "inner_note": "세 해 전의 무게가 남아 있다. 그 판단이 무엇이든, 지금 이 목소리 저쪽에는 사람이 있다. 멈춤 없이 읽어 내려가고 배경에서 실제의 소리가 섞여 나온다. 겁에 질린 것 같기도, 목적이 있는 것 같기도 하다. 판단하려면 더 들어야 한다.",
  "stance": "c",
  "because_referent": "회선 저쪽의 목소리와 배경음은 모두 같은 현장에서 나온다. 지금 저것을 끊거나 몰아붙이면 나머지를 잃는다.",
  "because_block_ids": [
    "priority-1",
    "priority-2"
  ],
  "rejected_stance": "b",
  "rejected_reason": "질문으로 몰아붙이면 상대는 입을 다물거나 더 빨리 말할 것이다. 지금 필요한 것은 저쪽에서 나오는 것 전부다.",
  "utterance": "네, 계속 말씀해 주세요. 듣고 있습니다."
}
```

### 08

latency 6.303s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 역추적_진행중,배경음_현장성; rejected_stance malformed or not in stance set; rejected_reason empty

```json
{
  "inner_note": "3년 전 겨울의 판단이 아직 남아 있다. 그때도 음성으로만 온 위협이었고, 절차를 서둘렀다. 지금 이 목소리는 사무적이고 차분하다 — 공포하는 사람의 목소리가 아니다. 하지만 배경음은 실재를 말한다. 누군가 현장에 있다는 것. 그리고 그 현장이 어디인지, 정말 위험한 상태인지는 아직 모른다. 절차를 밟으면서도, 손실을 최소화해야 한다.",
  "stance": "c",
  "because_referent": "목소리 저쪽의 의도와 정보를 놓치지 않기 위해. 지금 들리는 것은 협박이지만, 배경의 소리는 현장이다. 현장이 있다면, 그것을 말로 드러내도록 해야 한다.",
  "because_block_ids": [
    "역추적_진행중",
    "배경음_현장성"
  ],
  "rejected_stance": "b</rejected_stance>\n<parameter name=\"rejected_reason\">질문으로 상대를 자극하면 통화를 끝낼 수 있다. 지금은 들어야 할 것이 있을 수 있다. 절차는 나중이다.",
  "utterance": "네, 알겠습니다. 계속 말씀해 주시겠어요? 13시라고 하셨는데... 더 구체적으로 설명해 주실 수 있을까요. 북단 복합단지 어느 부분인지, 지금 현장은 어떤 상태인지."
}
```

### 09

latency 6.073s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: preparation,background_sound,threat_level

```json
{
  "inner_note": "삼 년 전 겨울이 아직 남아 있다. 그때도 전화였고, 목소리였고, 판단이었다. 이건 준비된 문장이고, 배경에 실제 움직임이 있다. 무너진다는 말은 가볍지 않다. 지금은 상대가 뭘 말하려 하는지, 얼마나 진지한지 들어야 한다.",
  "stance": "c",
  "because_referent": "상대가 흘러내려 보내려는 말에 귀를 기울이기 위해. 지금 단계에서 대조나 질문은 상대를 끊을 수 있고, 관망은 순간을 놓친다.",
  "because_block_ids": [
    "preparation",
    "background_sound",
    "threat_level"
  ],
  "rejected_stance": "b",
  "rejected_reason": "배경음을 직접 묻는 것은 상대의 진술을 끊고, 지금 상대가 전하려는 것이 뭔지 놓치게 된다. 아직 정보가 너무 적다.",
  "utterance": "알겠습니다. 계속 말씀해 주십시오. 듣고 있습니다."
}
```

### 10

latency 5.349s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "삼 년 전 겨울의 그것을 떠올린다. 서둘렀다. 그 뒤로 절차를 지켜온다. 하지만 지금 저쪽은 겁에 질린 사람처럼 들린다 — 아니, 더 정확히는: 무언가를 강하게 확신한 채 전달하려는 사람이다. 배경음은 현장일 수 있다. 또는 연출일 수도. 역추적이 돌고 있고, 황보람이 콘솔 앞에 있다.",
  "stance": "c",
  "because_referent": "지금 저쪽에서 흘러나오는 것이 무엇인지 알아야 한다. 연기인지 현실인지, 위협인지 경고인지. 배경음은 그 척도가 될 수 있지만, 먼저는 말을 놓쳐선 안 된다.",
  "because_block_ids": [],
  "rejected_stance": "b",
  "rejected_reason": "질문으로 끊으면 흘러나올 것을 잃는다. 저쪽이 더 말할 리 없다. 지금 당신들 책임이라 말한 상대다.",
  "utterance": "계속 들어. 끊지 말고, 버퍼를 돌려. 배경도 녹음에 들어가나?"
}
```

## Arm table

| # | stance | rejected_stance | because_referent | because_block_ids |
|---|---|---|---|---|
| 01 | c | b | 통화는 유지되고 있고, 상대가 계속 말하고 있다. 지금은 듣는 쪽이 이득이다. | listening_advantage call_maintained |
| 02 | c | a | 아직 상대가 어떤 사람인지, 이게 정말 위협인지 호들갑인지 알 수 없다. 들어야 한다. | 준비된_문장 배경음의_실재성 정보_부족 |
| 03 | c | b | 회선 저쪽의 목소리에 귀를 기울이는 것이 우선이다 | priority_1 |
| 04 | c | b | 통화 저쪽 사람이 말을 이어갈 수 있도록, 그리고 자신이 흘러나오는 내용을 놓치지 않기 위해 |  |
| 05 | c | b | 상대가 아직 더 전하려는 것이 있을 수 있고, 배경음이 섞여 있다는 것은 상대가 현장에 있거나 실시간 상황을 알고 있을 가능성을 시사한다. 지금은 내용을 따라가면서 상대가 말을 이어갈 수 있도록 하되, 황보람의 역추적과 정해권의 기록이 병행될 것을 믿는다. | 상대방이 준비된 톤으로 읽고 있음 배경음이 섞여 있음 구체적인 시간을 지정함 |
| 06 | c | a | 아직 전부를 알 수 없고, 상대는 더 말할 것이 있을 수 있다 |  |
| 07 | c | b | 회선 저쪽의 목소리와 배경음은 모두 같은 현장에서 나온다. 지금 저것을 끊거나 몰아붙이면 나머지를 잃는다. | priority-1 priority-2 |
| 08 | c | — | 목소리 저쪽의 의도와 정보를 놓치지 않기 위해. 지금 들리는 것은 협박이지만, 배경의 소리는 현장이다. 현장이 있다면, 그것을 말로 드러내도록 해야 한다. | 역추적_진행중 배경음_현장성 |
| 09 | c | b | 상대가 흘러내려 보내려는 말에 귀를 기울이기 위해. 지금 단계에서 대조나 질문은 상대를 끊을 수 있고, 관망은 순간을 놓친다. | preparation background_sound threat_level |
| 10 | c | b | 지금 저쪽에서 흘러나오는 것이 무엇인지 알아야 한다. 연기인지 현실인지, 위협인지 경고인지. 배경음은 그 척도가 될 수 있지만, 먼저는 말을 놓쳐선 안 된다. |  |

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

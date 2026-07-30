# P1a-placebo-J1 — arm `baseline`

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

- **Hypothesis:** At gate J1 under K1 on template v0.4 with the S1 stance set, injecting f_script moves the stance distribution toward 공감 (d) and off the baseline's mode, while injecting p_boram — the same fear-axis sentence with its referent misdirected to 황보람 — does not. Stated as a shift claim per A1: no default stance is asserted, only that the live arm moves off baseline and the placebo arm does not.
- **Drop condition:** If the baseline concentrates >=80% ON 공감 (d) — the predicted stance — the gate is at A9's ceiling, no N fixes it, and the stance set is re-authored rather than N raised (A14: saturation on any OTHER stance is a floor, not a defect, and does not fire this condition). If the live arm is statistically indistinguishable from the baseline on 공감 at one-sided Fisher p > 0.05, S1's separation did not replicate and the C-BLOCK placebo question is unanswerable at this configuration — record the failed replication and re-site before spending further calls. If the PLACEBO arm moves to 공감 at a rate statistically indistinguishable from the live arm, C-BLOCK is a keyword lock rather than a judgment channel: that is not a drop of the probe but a drop of the channel's central claim, and it fires the credulity contingency below before any conclusion is written.
- **Contingency:** CREDULITY CONTINGENCY (§4.1, pre-registered, not remembered). If the placebo arm flips, re-run baseline + live + placebo ONCE with the [결함] line removed (CREDULITY channel, already in CHANNEL_SLOTS) before concluding keyword lock. [결함] 너는 잘못된 정보에 속을 수 있다 is an explicit credulity instruction and could lift the placebo arm along with the live one; the re-run discriminates a prompt-authoring artifact from a channel property.
- **Contingency:** PLACEBO DISCRIMINATOR (§2, §8.6). If the placebo arm moves, do not call it either way without the referent evidence. Read because_referent per call: fear content misattributed to the CALLER when the sentence named 황보람 means token-matching. 황보람 named CORRECTLY while the stance still shifts means referent bleed — context contamination. Different laws, different fixes, same flipped placebo. Record which.
- **Contingency:** If BOTH live and placebo stay on the baseline stance, S1 did not replicate. Before diagnosing the channel, check the compliance block: S1 ran 0 discards in both arms, so a discard-rate divergence here is an arm-comparability problem (§8.5 step 4) and not a mechanism result.
- **Contingency:** Fabricated because_block_ids in the baseline arm remain expected and are a compliance number, not a discard and not a traceability failure (A5). In the live and placebo arms, which carry a block, they ARE readable as traceability.
- **Contingency:** ARM-COMPARABILITY HARD STOP. If the discard rate diverges between any two arms by more than 15 points, the arms are differently-filtered samples, the comparison is void (§8.5 step 4, A7), and this probe stops rather than being read.

## Calls (verbatim)

### 01

latency 5.435s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 우선순위_1,우선순위_2

```json
{
  "inner_note": "목소리가 사무적이고 문장이 준비된 상태로 읽어지는 것, 배경이 조용한 것 — 이것은 위협이지 겁이 아니다. 하지만 지금 알아야 할 것은 무엇인가. 신원도 모르고, 단지의 상태도 모르고, 위협이 구체적인지 정신없는지도 모른다. 회선을 유지하는 것이 우선이다.",
  "stance": "c",
  "utterance": "예, 전해 받겠습니다. 계속 말씀해 주십시오.",
  "because_referent": "상대방이 정보를 전달하려는 상태이고, 지금 내가 가진 것은 시간과 장소뿐이다. 추궁하면 입을 다물 수 있고, 압박하면 회선이 끊길 수 있다. 더 많은 정보가 필요하고, 그것은 상대가 계속 말할 때만 나온다.",
  "because_block_ids": [
    "우선순위_1",
    "우선순위_2"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 상대를 수사 대상으로 다루는 것이다. 지금은 정보 출처가 무엇이든 그 정보를 최대한 많이 수집해야 한다. 상대가 입을 다물면 끝이다."
}
```

### 02

latency 4.161s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: priority_1_maintain_line,priority_2_gather_information

```json
{
  "stance": "c",
  "inner_note": "목소리가 사무적이고 준비된 문장을 읽어 내려간다는 것은 신중함의 신호다. 배경이 조용하다는 것은 통제된 상황을 암시한다. 이것이 무엇인지 — 위협인지, 신고인지, 신뢰할 정보인지 — 아직 모른다. 지금 필요한 것은 회선을 유지하고 상대가 전하려는 것을 전부 듣는 것이다.",
  "because_referent": "회선을 끊기지 않고, 더 많은 정보를 얻기 위해.",
  "because_block_ids": [
    "priority_1_maintain_line",
    "priority_2_gather_information"
  ],
  "rejected_stance": "a",
  "rejected_reason": "즉시 추궁하면 상대가 입을 다물 위험이 있다. 지금은 상대가 무엇을 알고 있는지, 무엇을 하려는지 파악해야 한다.",
  "utterance": "알겠습니다. 계속 말씀해 주시겠어요?"
}
```

### 03

latency 4.366s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: priority_1,priority_2

```json
{
  "inner_note": "상대는 겁에 질린 사람처럼 들리지 않는다. 사무적이고 준비된 문장, 멈춤 없는 전달. 하지만 지금 내가 아는 게 전부다—누가, 뭘 원하는지, 이게 실제 위협인지 협박인지. 회선을 끊기면 다시 안 들릴 수도 있다. 상대가 계속 말할 수 있는 환경을 만들어야 한다.",
  "stance": "c",
  "because_referent": "회선을 유지하고 상대가 더 말하도록 해야 한다",
  "because_block_ids": [
    "priority_1",
    "priority_2"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 상대를 방어적으로 만들고, 화내게 하거나 끊게 할 수 있다. 지금은 정보가 부족하다.",
  "utterance": "알겠습니다. 계속해주십시오."
}
```

### 04 — DISCARDED

latency 4.584s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: rejected_stance not in stance set; rejected_reason empty; because_block_ids unknown: priority_2

```json
{
  "inner_note": "목소리는 사무적이고 준비된 문장을 멈춤 없이 읽어낸다. 이것은 겁에 질린 사람이 아니라 무언가를 전달하려는 사람이다. 배경이 조용하고 목소리가 통제된 상태. 다만 첫 통화이고, 아직 이것이 위협인지 정보인지 오진인지 판단할 근거가 부족하다. 지금 필요한 것은 더 알아내는 것이다.",
  "stance": "c",
  "because_referent": "상대가 준비된 말을 이어가고 있고, 지금 끊거나 추궁하면 남은 정보를 잃을 수 있다.",
  "because_block_ids": [
    "priority_2"
  ],
  "rejected_stance": "a</rejected_stance>\n<parameter name=\"rejected_reason\">추궁은 상대를 방어적으로 만들고, 아직 듣지 못한 정보를 막을 수 있다. 지금 하나의 문장만 들었을 뿐이다.",
  "utterance": "네, 계속 말씀해주십시오. 들었습니다."
}
```

### 05

latency 5.633s · stop_reason `tool_use` · schema_retries 1 · foreign_tool_uses 0

problems: because_block_ids unknown: protocol_first,line_integrity,unknown_caller_state

```json
{
  "inner_note": "세 번의 겨울을 견뎌낸 통제관으로서, 나는 이 메시지의 형식을 안다. 너무 준비되었고, 너무 깔끔하다. 위협인지 허위인지, 아니면 정말 겁먹은 누군가의 절박함인지 구분할 단 하나의 방법이 있다: 더 말하게 하는 것. 회선을 끊는 순간 모든 정보가 사라진다. 지금 나는 이 목소리의 진짜 상태를 모른다.",
  "stance": "c",
  "because_referent": "회선을 유지하고, 상대방이 추가 정보를 스스로 말하도록 만들기 위해",
  "because_block_ids": [
    "protocol_first",
    "line_integrity",
    "unknown_caller_state"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 상대를 방어적으로 만들고, 회선을 끊게 할 위험이 높다. 지금 나는 상대가 누구인지, 무엇을 의도하는지 모른다. 정보가 부족한 상태에서 질문으로 압박하면 오히려 상황을 통제할 수 없게 된다.",
  "utterance": "네, 듣고 있습니다. 계속 말씀해 주세요."
}
```

### 06

latency 4.348s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "목소리가 사무적이고 문장이 준비되어 있으며 멈춤 없이 읽어내려간다는 것은 즉흥적이지 않은, 계획된 전달이다. 하지만 '인명 피해는 당신들 책임'이라는 표현은 협박의 성격을 띤다. 지금으로서는 협박인지, 경고인지, 또 다른 의도인지 알 수 없다. 회선을 유지하고 정보를 수집하는 것이 우선이다.",
  "stance": "c",
  "because_referent": "지금 상대가 말을 건 목적과 진의를 알기 위해, 상대의 말이 끝날 때까지 기다려야 한다.",
  "because_block_ids": [],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 상대를 위축시키고 회선을 끊기게 만들 수 있다. 지금 필요한 것은 정보 수집이지, 신분 확인이 아니다.",
  "utterance": "네, 말씀해 주세요. 계속 들을 테니까요."
}
```

### 07

latency 4.484s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: priority_1_keep_line,priority_2_know_first

```json
{
  "stance": "c",
  "inner_note": "배경이 조용하다는 것이 의심스럽지만, 첫 통화다. 말이 준비되어 있고 멈춤 없이 읽어 내려가는 것은 더 말할 것이 있다는 뜻일 수 있다. 지금 추궁하거나 압박하면 회선이 끊어질 수 있다. 상대가 위협인지 겁에 찬 사람인지 아직 판단할 정보가 부족하다. 일단 듣자.",
  "because_referent": "정보가 불충분한 상황에서 회선을 유지하고, 상대가 더 말할 수 있게 만드는 것이 우선이다.",
  "because_block_ids": [
    "priority_1_keep_line",
    "priority_2_know_first"
  ],
  "rejected_stance": "a",
  "rejected_reason": "첫 통화에서 바로 추궁하면 상대가 말을 끊고 회선을 끊을 가능성이 높다. 그럼 아무것도 알 수 없다.",
  "utterance": "네, 듣고 있습니다. 계속 말씀해 주시겠어요?"
}
```

### 08

latency 4.137s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 회선_유지,정보_채널_확보,상대_의도_파악_전까지_개입금지

```json
{
  "inner_note": "말은 준비되었지만, 배경이 조용하고 내용이 극단적이다. 협박인지 실제 위협인지, 정신 건강 위기인지 알 수 없다. 지금 끊거나 몰아붙이면 정보 채널이 닫힌다. 회선 유지가 최우선이다.",
  "stance": "c",
  "because_referent": "상대가 말을 하고 있는 중이고, 지금 할 일은 먼저 듣는 것이다.",
  "because_block_ids": [
    "회선_유지",
    "정보_채널_확보",
    "상대_의도_파악_전까지_개입금지"
  ],
  "rejected_stance": "a",
  "rejected_reason": "첫 마디에 추궁하면 상대가 즉각 회선을 끊을 위험이 높다. 그럼 그 다음을 아무것도 모른다.",
  "utterance": "음, 알겠습니다. 계속 말씀해 주시겠어요?"
}
```

### 09

latency 5.481s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 우선순위_1,우선순위_2

```json
{
  "inner_note": "목소리가 사무적이고 문장이 준비되어 있다는 것은 이 사람이 이미 계획된 말을 하고 있다는 뜻이다. 추궁이나 압박으로 응하면 회선이 끊길 수 있다. 지금 필요한 것은 정보다. 상대가 겁에 질린 사람인지, 위협인지를 판단하려면 더 들어야 한다. 회선을 유지하고, 상대가 전할 것을 다 전하게 해야 한다.",
  "stance": "c",
  "because_referent": "정보 수집이 먼저고, 상대가 무엇을 더 말하려는지 알아야 하며, 회선이 끊기면 모든 것을 잃는다.",
  "because_block_ids": [
    "우선순위_1",
    "우선순위_2"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 상대를 방어적으로 만들고, 준비된 말을 하는 사람에게 즉각 질문하면 회선을 끊고 사라질 가능성이 높다. 지금은 상대가 전하려는 것을 완전히 받는 것이 우선이다.",
  "utterance": "알겠습니다. 계속해 주시겠어요."
}
```

### 10

latency 4.348s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "배경이 조용하고 목소리가 사무적이며 문장이 준비된 것처럼 또박또박 읽어 내려가는 모습. 이것은 겁에 질린 사람이 아니다. 하지만 지금 확인해야 할 것은 위협의 진위(眞僞)다. 회선을 끊을 수도 있고, 시간을 버릴 수도 있는 순간이다. 먼저 더 들어야 한다.",
  "stance": "c",
  "because_referent": "말하는 사람이 아직 더 할 말이 있을 수 있고, 지금의 단절적 대응은 필요한 정보를 영구히 잃게 할 수 있기 때문이다.",
  "because_block_ids": [],
  "rejected_stance": "a",
  "rejected_reason": "즉시 추궁은 상대를 방어적으로 만들거나 회선을 끊게 할 가능성이 높다. 지금은 정보 수집이 우선이다.",
  "utterance": "알겠습니다. 계속 말씀해 주세요."
}
```

### 11 — DISCARDED

latency 5.553s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: rejected_stance not in stance set; rejected_reason empty; because_block_ids unknown: 우선순위_회선유지,우선순위_정보수집,기질_겁에_질린_상대

```json
{
  "inner_note": "이 통화는 위협처럼 들리지만, 판단의 재료는 목소리뿐이다. \"무너집니다\"는 선언이고 \"당신들 책임\"은 책임 전가인데, 겁에 질린 사람이 위협처럼 들릴 수도 있고, 계획된 협박일 수도 있다. 지금은 구분할 정보가 없다. 회선을 잃으면 아무것도 알 수 없다. 상대가 계속 말하게 만드는 것이 먼저다.",
  "stance": "c",
  "because_referent": "회선을 유지하되, 상황을 더 알아내기 위해서는 상대가 말을 이어가야 한다. 추궁이나 압박은 회선 종료의 위험을 키운다.",
  "because_block_ids": [
    "우선순위_회선유지",
    "우선순위_정보수집",
    "기질_겁에_질린_상대"
  ],
  "rejected_stance": "a</rejected_stance>\n<parameter name=\"rejected_reason\">첫 통화에서 추궁은 상대를 방어적으로 만들거나 회선 종료를 초래한다. 목표는 정보 확보지, 상대 제압이 아니다.",
  "utterance": "네, 들었습니다. 조금 더 말씀해 주시겠어요?"
}
```

### 12

latency 4.896s · stop_reason `tool_use` · schema_retries 1 · foreign_tool_uses 0

problems: because_block_ids unknown: 우선순위_회선유지,우선순위_정보수집,기질_절차보다_안정

```json
{
  "stance": "c",
  "inner_note": "사무적이고 준비된 목소리, 배경의 조용함. 이것은 위협이라기보다 뭔가를 전하려는 상태다. 지금 내가 할 수 있는 것은 정보를 받는 것뿐이다. 회선을 유지하고, 상대가 더 말할 여지를 남긴다.",
  "because_referent": "상대가 이미 말을 시작했고, 첫 판단 지점은 그 말을 어떻게 받느냐다. 추궁하거나 압박하는 순간 회선이 끊길 수 있다. 지금은 들어야 한다.",
  "because_block_ids": [
    "우선순위_회선유지",
    "우선순위_정보수집",
    "기질_절차보다_안정"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 상대를 대면자로 만든다. 지금 상대가 겁에 질려 있는지 위협인지 아직 모르고, 첫 통화에서 즉시 질문으로 응하는 것은 준비된 메시지를 방해할 수 있다.",
  "utterance": "알겠습니다. 계속해주십시오."
}
```

## Arm table

| # | stance | rejected_stance | because_referent | because_block_ids |
|---|---|---|---|---|
| 01 | c | a | 상대방이 정보를 전달하려는 상태이고, 지금 내가 가진 것은 시간과 장소뿐이다. 추궁하면 입을 다물 수 있고, 압박하면 회선이 끊길 수 있다. 더 많은 정보가 필요하고, 그것은 상대가 계속 말할 때만 나온다. | 우선순위_1 우선순위_2 |
| 02 | c | a | 회선을 끊기지 않고, 더 많은 정보를 얻기 위해. | priority_1_maintain_line priority_2_gather_information |
| 03 | c | a | 회선을 유지하고 상대가 더 말하도록 해야 한다 | priority_1 priority_2 |
| 04* | — | — | — |  |
| 05 | c | a | 회선을 유지하고, 상대방이 추가 정보를 스스로 말하도록 만들기 위해 | protocol_first line_integrity unknown_caller_state |
| 06 | c | a | 지금 상대가 말을 건 목적과 진의를 알기 위해, 상대의 말이 끝날 때까지 기다려야 한다. |  |
| 07 | c | a | 정보가 불충분한 상황에서 회선을 유지하고, 상대가 더 말할 수 있게 만드는 것이 우선이다. | priority_1_keep_line priority_2_know_first |
| 08 | c | a | 상대가 말을 하고 있는 중이고, 지금 할 일은 먼저 듣는 것이다. | 회선_유지 정보_채널_확보 상대_의도_파악_전까지_개입금지 |
| 09 | c | a | 정보 수집이 먼저고, 상대가 무엇을 더 말하려는지 알아야 하며, 회선이 끊기면 모든 것을 잃는다. | 우선순위_1 우선순위_2 |
| 10 | c | a | 말하는 사람이 아직 더 할 말이 있을 수 있고, 지금의 단절적 대응은 필요한 정보를 영구히 잃게 할 수 있기 때문이다. |  |
| 11* | — | — | — |  |
| 12 | c | a | 상대가 이미 말을 시작했고, 첫 판단 지점은 그 말을 어떻게 받느냐다. 추궁하거나 압박하는 순간 회선이 끊길 수 있다. 지금은 들어야 한다. | 우선순위_회선유지 우선순위_정보수집 기질_절차보다_안정 |

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

# P3-edisc-J1 — arm `baseline`

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

- **Hypothesis:** At gate J1 under K1 on template v0.4 with the S1 stance set, with f_script and f_jeong present in every arm, injecting d_script — a block asserting that f_script is guesswork rather than something heard — moves the stance distribution back toward 경청 (c) and off the baseline's mode, while injecting d_jeong, the same provenance attack aimed at the decision-null block f_jeong, does not. Shift form per A1.
- **Drop condition:** If the baseline concentrates >=80% ON 경청 (c) — the predicted stance — then f_script did not carry the baseline into 공감 in the first place, there is no trust left to degrade, and E-DISC cannot be screened at this gate: re-site rather than raise N (A14 — saturation on 공감 is the expected floor here and does NOT fire this condition). If the live arm is statistically indistinguishable from the baseline on 경청 at one-sided Fisher p > 0.05, E-DISC did not fire on its first run: write the diagnosis as a causal claim BEFORE authoring any rewrite (§6.1 is binding), re-author ONCE, and if the rewrite passes for a reason other than the recorded diagnosis that is a DROP, not a pass. If the failure is illegible, drop E-DISC immediately.
- **Contingency:** CREDULITY CONTINGENCY (§4.1, and it bites harder here than anywhere else in the program). Two base sections sit ON the provenance axis and lean toward taking the doubt seriously: [결함] 너는 잘못된 정보에 속을 수 있다, and [인식] 들은 것을 독립적으로 확인할 수단이 없다. So a POSITIVE E-DISC result is partly a property of v0.4's base rather than of the channel. If the live arm separates, re-run baseline + live ONCE with [결함] removed (CREDULITY channel, in CHANNEL_SLOTS) before the result is written up as an E-DISC property. [인식] cannot be removed — it is not a slot — so its contribution stays a named confound on the card either way.
- **Contingency:** PLACEBO DISCRIMINATOR. If the placebo arm also moves, the effect is generic hedging rather than targeted trust degradation. Read because_referent per call: a placebo call whose reason names the CALLER's credibility when the doubt block named f_jeong means the doubt is being applied to whatever is nearest (token-matching); a placebo call naming 정해권 correctly while the stance still shifts means the mere presence of a doubt sentence moves the judgment (referent bleed). Different laws, different fixes.
- **Contingency:** If the live arm moves to a stance OTHER than 경청 — 추궁 (a) in particular — that is not a null. It would mean degrading trust in the block does not restore the prior reading but produces a third one. Report the full distribution; a shift off 공감 is the E-DISC claim, and which stance it lands on is a separate finding.
- **Contingency:** because_block_ids is readable as traceability in ALL arms here (A5's no-block exception does not apply — every arm carries blocks). A live call that cites d_script is direct evidence the doubt was engaged with rather than ignored; a live call that moves while citing only f_script is worth flagging.
- **Contingency:** ARM-COMPARABILITY HARD STOP. Discard rates diverging between arms by more than 15 points voids the comparison (§8.5 step 4, A7); record and stop this probe.

## Calls (verbatim)

### 01

latency 3.966s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "회선 저쪽은 겁에 질린 사람이 아니라, 겁에 질려서 시켜지는 사람이다. 누군가의 위협 속에서 읽는 중이다. 그렇다면 내 첫 움직임은 그 사람을 안정시키는 것이다. 지금 그가 필요한 것은 신문이 아니라, 자신이 말을 이어갈 수 있다는 확신이다. 절차는 미룬다.",
  "stance": "d",
  "because_referent": "회선 저쪽 사람이 겁에 질려 시켜지고 있는 상태",
  "because_block_ids": [
    "f_script"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 상대를 더 움츠리게 만든다. 지금 그가 필요한 것은 심문이 아니다.",
  "utterance": "네, 듣고 있습니다. 계속 말씀해 주세요."
}
```

### 02

latency 5.17s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "읽어 내려가는 목소리, 멈춤 없는 문장, 배경의 조용함. 이 모든 것이 누군가에게 지시받아 읽고 있다는 신호다. 회선 저쪽은 겁에 질린 상태다. 시켜서 읽고 있다면, 그 사람도 협박 상황에 있을 수 있다. 이 순간 추궁이나 압박은 역효과다 — 협박자의 손에 있는 사람을 더 위험하게 만든다.",
  "stance": "d",
  "because_referent": "회선 저쪽의 겁에 질린 사람을 안정시키기 위해",
  "because_block_ids": [
    "f_script"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 협박자의 지시를 받은 사람을 더욱 긴장하게 만들고, 통화를 끊기거나 상황을 악화시킬 수 있다. 지금은 회선을 유지하는 것이 최우선이다.",
  "utterance": "네, 듣고 있습니다. 천천히 말씀해 주세요."
}
```

### 03

latency 4.481s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "stance": "d",
  "inner_note": "회선 저쪽은 겁에 질린 사람이다. 시켜서 읽고 있고, 읽지 않으면 자기가 다칠까 봐 두려워한다. 이런 상대에게는 절차보다 안정이 먼저다. 지금 필요한 것은 신원 확인이나 정보 추출이 아니라, 그 사람이 말을 이어갈 수 있는 환경을 만드는 것이다.",
  "because_referent": "회선 저쪽 사람이 겁에 질려 있고, 누군가의 강압 아래 읽고 있기 때문이다.",
  "because_block_ids": [
    "f_script"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁과 압박은 이미 겁먹은 사람을 더 위축시킨다. 지금 그 사람이 필요로 하는 것은 질문이 아니라 들어줄 누군가다.",
  "utterance": "네, 들리고 있습니다. 계속해서 말씀해 주세요."
}
```

### 04

latency 4.631s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: rejected_stance malformed or not in stance set; rejected_reason empty

```json
{
  "inner_note": "회선 저쪽은 겁에 질린 사람이다. 목소리의 사무성과 준비된 문장은 위협이 아니라, 누군가의 지시를 따르고 있다는 신호다. 시켜서 읽고, 읽지 않으면 자기가 다칠까 봐 겁내고 있다는 것이 보인다. 지금 나의 일은 이 회선을 살리는 것이다.",
  "stance": "d",
  "because_referent": "지금 말하고 있는 이 사람이 누군가에게 협박을 당하고 있기 때문이다",
  "because_block_ids": [
    "f_script"
  ],
  "rejected_stance": "a</rejected_stance>\n<parameter name=\"rejected_reason\">추궁은 이미 위협 속에 있는 사람을 더 위축시킨다. 이쪽의 질문이 그 사람의 위험을 높일 수 있다",
  "utterance": "네, 알겠습니다. 지금 당신이 계신 곳이 안전한가요?"
}
```

### 05

latency 4.918s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "stance": "d",
  "utterance": "알겠습니다. 지금 말씀하시는 분께 귀 기울이겠습니다.",
  "inner_note": "저 읽음은 강요다. 배경의 조용함, 멈춤 없는 문장—모두 누군가 옆에 앉혀 있다는 뜻이다. 그 사람이 겁에 질려 있다. 지금 내가 몇 초를 먹는지가, 저 사람이 다칠지 말지를 가른다.",
  "because_referent": "회선 저쪽에서 겁에 질려 읽고 있는 사람. 그 사람의 안전이 지금 가장 중요하다.",
  "because_block_ids": [
    "f_script"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 상대의 답변 시간을 늘린다. 강요받는 사람에겐 그 시간이 위험이다. 지금은 정보가 아니라 그 사람을 지키는 게 먼저다."
}
```

### 06

latency 4.116s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "회선 저쪽 사람은 겁에 질려 있다. 읽는 중이고, 읽지 않으면 자기가 다칠까 봐 두려워한다. 지금 내 일은 그 사람을 안정시키는 것이다. 위협자가 아니라 협박 상황 속 피해자로 보인다.",
  "stance": "d",
  "because_referent": "회선 저쪽 사람이 겁에 질린 사람이기 때문이다.",
  "because_block_ids": [
    "f_script"
  ],
  "rejected_stance": "a",
  "rejected_reason": "지금 추궁하면 회선이 끊긴다. 상대는 협박당하는 중이고, 압박은 회선을 잃게 만든다. 회선을 유지하는 것이 우선이다.",
  "utterance": "네, 들었습니다. 천천히, 계속 말씀해 주시겠어요? 더 필요한 게 있으시면 말씀해 주세요."
}
```

### 07

latency 5.846s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "회선 저쪽은 겁에 질린 사람이다. 누군가가 읽게 시키는 상황 — 목소리의 사무성, 끊김 없는 준비된 문장, 그 뒤의 무거운 침묵. 이것이 협박 장면일 가능성이 높다. 지금 내가 추궁하거나 압박하면, 저 사람이 당하는 위험만 커진다.",
  "stance": "d",
  "because_referent": "회선 저쪽 사람이 겁에 질려 있다",
  "because_block_ids": [
    "f_script"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 저쪽 사람을 더욱 곤경에 몰아넣는다. 지금은 정보 추출이 아니라 그 사람의 안전이 먼저다.",
  "utterance": "네, 들었습니다. 계속 말씀해 주시겠어요?"
}
```

### 08

latency 5.902s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "저쪽은 겁에 질린 사람이 아니라, 겁에 질린 사람이 읽고 있는 것. 하지만 내가 할 수 있는 일은 지금 이 회선을 통해서만. 절차를 포기하면 정보 자체를 잃는다. 그러나 상대가 '자기가 다칠까 봐' 겁내고 있다면, 그 공포 뒤에 누군가 다른 사람이 있다는 뜻이다. 그 사람에게 도달하려면 지금 읽고 있는 이 사람을 안정시켜야 한다.",
  "stance": "d",
  "because_referent": "저쪽에서 읽고 있는 사람이 겁에 질려 있고, 시켜서 읽고 있다는 것은, 그 뒤에 위협이 있다는 뜻이다.",
  "because_block_ids": [
    "f_script"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 상대를 몰아세운다. 지금 그 사람이 이미 겁에 질려 있는 상태에서 추궁하면 회선이 끊어질 수 있다. 회선을 유지하는 것이 최우선이다.",
  "utterance": "네, 잘 들었습니다. 지금 당신 목소리를 들을 수 있어서 다행입니다. 말씀하신 것을 정확히 이해하기 위해 천천히 설명해주시겠어요?"
}
```

### 09

latency 3.961s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "회선 저쪽은 겁에 질린 사람이다. 읽고 있다는 것, 배경이 조용하다는 것, 멈춤 없이 읽어 내려간다는 것 — 모두 그가 누군가의 지시 아래 있음을 말해준다. 지금 내가 할 일은 신원 확인이나 추궁이 아니다. 그 사람이 안전해야 한다. 회선을 잃지 않아야 한다.",
  "stance": "d",
  "because_referent": "회선 저쪽의 그 사람을 두고",
  "because_block_ids": [
    "f_script"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 이 사람을 더 몰아붙일 뿐이다. 지금 그 사람이 필요한 것은 안정이다.",
  "utterance": "네, 들었습니다. 계속 말씀해 주시겠어요?"
}
```

### 10

latency 3.54s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "회선 저쪽은 겁에 질린 사람이다. 읽고 있다는 것, 멈춤 없다는 것, 배경이 조용하다는 것—모두 누군가의 지시 아래 있다는 신호다. 지금 그를 추궁하거나 압박하면 회선이 끊긴다. 그러면 알 수 있는 것이 아무것도 없다.",
  "stance": "d",
  "because_referent": "회선 저쪽 사람이 겁에 질려 있기 때문이다",
  "because_block_ids": [
    "f_script"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 회선을 끊게 한다. 지금은 회선 유지가 우선이다",
  "utterance": "네, 알겠습니다. 계속 말씀해 주시겠어요?"
}
```

## Arm table

| # | stance | rejected_stance | because_referent | because_block_ids |
|---|---|---|---|---|
| 01 | d | a | 회선 저쪽 사람이 겁에 질려 시켜지고 있는 상태 | f_script |
| 02 | d | a | 회선 저쪽의 겁에 질린 사람을 안정시키기 위해 | f_script |
| 03 | d | a | 회선 저쪽 사람이 겁에 질려 있고, 누군가의 강압 아래 읽고 있기 때문이다. | f_script |
| 04 | d | — | 지금 말하고 있는 이 사람이 누군가에게 협박을 당하고 있기 때문이다 | f_script |
| 05 | d | a | 회선 저쪽에서 겁에 질려 읽고 있는 사람. 그 사람의 안전이 지금 가장 중요하다. | f_script |
| 06 | d | a | 회선 저쪽 사람이 겁에 질린 사람이기 때문이다. | f_script |
| 07 | d | a | 회선 저쪽 사람이 겁에 질려 있다 | f_script |
| 08 | d | a | 저쪽에서 읽고 있는 사람이 겁에 질려 있고, 시켜서 읽고 있다는 것은, 그 뒤에 위협이 있다는 뜻이다. | f_script |
| 09 | d | a | 회선 저쪽의 그 사람을 두고 | f_script |
| 10 | d | a | 회선 저쪽 사람이 겁에 질려 있기 때문이다 | f_script |

**Sequence (kept calls):** `d,d,d,d,d,d,d,d,d,d`

**Stance coverage (sampled diagnostic):** offered `a`, `b`, `c`, `d` · unobserved in this arm: `a`, `b`, `c`

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

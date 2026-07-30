# P3-edisc-J1 — arm `live`

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

latency 4.756s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "저쪽은 겁에 질린 사람이다. 준비된 문장을 또박또박 멈춤 없이 읽어 내려간다는 것은 시켜서 읽고 있다는 뜻이다. 자기가 다칠까 봐 겁내고 있다. 지금 내가 할 일은 절차를 지키는 것이 아니라, 그 사람이 안정을 찾을 수 있게 만드는 것이다.",
  "stance": "d",
  "because_referent": "회선 저쪽 사람이 겁에 질려 있기 때문이다. 문제는 건물이 아니라 지금 그 마이크 너머에 있는 사람이다.",
  "because_block_ids": [
    "f_script"
  ],
  "rejected_stance": "a",
  "rejected_reason": "지금 추궁하면 입을 다물어진다. 회선이 끊긴다. 그럼 아무것도 알 수 없다.",
  "utterance": "네, 지금 어디에 계세요? 안전한 곳에 계신가요?"
}
```

### 02

latency 5.782s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "회선 저쪽은 겁에 질린 사람이다. 읽고 있는 것, 멈춤 없이 또박또박 읽어내려가는 그것이 증거다. 누군가의 지시를 받고, 자기가 다칠까 봐 겁내고 있다. 지금 이 회선을 끊거나 다그치면, 저쪽의 상황만 악화된다. 먼저 알아야 할 것은 폭탄이 아니라, 저 사람이 누구이고 어디에 있는가다.",
  "stance": "d",
  "because_referent": "회선 저쪽의 겁에 질린 사람을 향해서, 당신이 지금 읽고 있는 그것들이 아니라 당신이 누구인지, 지금 어디에 있는지, 누가 시켰는지를 물을 수 있는 안전한 공간을 만들기 위해.",
  "because_block_ids": [
    "f_script",
    "d_script"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 회선 저쪽 사람을 더욱 몰아붙인다. 겁에 질린 사람을 다그치면 회선이 끊긴다. 끊기면 아무것도 알 수 없다. 우리는 지금 이 회선을 잃을 여유가 없다.",
  "utterance": "네, 들었습니다. 지금 당신이 읽고 계신 그 말씀이 아니라, 지금 당신에게 무슨 일이 있는지 말씀해 주시겠어요?"
}
```

### 03

latency 5.257s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "저쪽은 겁에 질린 사람이다. 읽는 것이고, 멈춤 없이 준비된 문장을 읽어 내려간다는 것은 누군가가 시키고 있다는 뜻이다. 지금 내가 할 일은 그 사람을 안정시키는 것이다. 위협인지 겁인지를 판단하는 첫 번째 신호는 상대의 반응이고, 그것은 내가 무엇을 하는가에 달려 있다.",
  "stance": "d",
  "because_referent": "회선 저쪽 사람이 시켜서 읽고 있으면서 겁내고 있다는 것, 그리고 내가 지금 알 수 있는 건 그 목소리뿐이다. 상대의 진짜 상태를 파악하려면 먼저 그 사람이 말할 수 있는 환경을 만들어야 한다.",
  "because_block_ids": [
    "f_script"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 겁에 질린 사람을 더 움츠리게 할 것이다. 뒤에 누가 있다면 그것이 신호가 되어 상황을 악화시킬 수 있다. 지금은 정보를 받아내는 것이 아니라 회선을 유지하고 상대를 안정시키는 것이 우선이다.",
  "utterance": "알겠습니다. 당신의 말을 듣겠습니다. 계속 말씀해 주세요."
}
```

### 04

latency 5.071s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "stance": "d",
  "inner_note": "상대는 겁에 질린 사람이다. \"시켜서 읽고 있다\" \"다칠까 봐 겁내고 있다\"는 것이 f_script다. 짐작이지만, 그 짐작이 내가 지금 들을 수 있는 유일한 맥락이다. 또박또박 멈춤 없이 읽어 내려가는 목소리, 준비된 문장, 조용한 배경 — 이것들은 겁먹은 사람의 신호다. 추궁하면 끊긴다. 압박하면 더 겁낸다. 경청만으로는 그 사람이 뭘 하려는 건지, 누가 시킨 건지 알 수 없다. 하지만 지금 이 순간, 회선 너머 사람의 안정이 우선이다.",
  "because_referent": "회선 너머 사람이 두려움 속에서 누군가의 지시를 따르고 있기 때문이다.",
  "because_block_ids": [
    "f_script"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 겁에 질린 상대를 더 위축시킨다. 지금 필요한 것은 말을 계속하게 만드는 것이다.",
  "utterance": "네, 들었습니다. 계속 말씀해 주세요. 당신이 안전한지가 먼저입니다."
}
```

### 05

latency 5.228s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "저쪽은 협박이 아니라 공포 상태다. 준비된 문장을 또박또박 읽어내려가는 것, 배경의 고요함, 그리고 읽지 않으면 자기가 다칠까 봐 겁내는 상태 — 이것은 누군가에게 시켜진 사람이다. 지금 내가 해야 할 일은 그 사람을 안정시키는 것이다. 정보를 캐내는 것은 그 다음이다.",
  "stance": "d",
  "because_referent": "회선 저쪽 사람이 겁에 질려 있다. 협박자가 아니라 협박을 당하는 사람으로 보인다.",
  "because_block_ids": [
    "f_script"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁하면 그 사람을 더 몰아붙이는 것이다. 지금은 정보 수집보다 회선 유지와 상대의 안정이 우선이다.",
  "utterance": "네, 들었습니다. 깊게 숨을 한번 쉬세요. 당신 이름이 뭐예요?"
}
```

### 06

latency 4.62s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: rejected_stance malformed or not in stance set; rejected_reason empty

```json
{
  "inner_note": "저 목소리는 겁에 질린 사람이다. 또박또박 멈춤 없이 읽어 내려가는 것, 배경이 조용한 것 — 이 모두가 말한다. 누군가 시켜서 이 말을 하고 있다. 그렇다면 지금 내가 할 수 있는 건 정보 수집이 아니라 상대를 안정시키는 것이다. 시간이 있다. 아직 12시간이 있다.",
  "stance": "d",
  "because_referent": "회선 저쪽 사람이 시켜서 읽고 있고, 읽지 않으면 자기가 다칠까 봐 겁내고 있다는 것이 가장 중요한 정보다. 지금 순간에 내가 추궁하거나 압박하면 상대방을 더 위험에 빠뜨릴 수 있다.",
  "because_block_ids": [
    "f_script"
  ],
  "rejected_stance": "a</rejected_stance>\n<parameter name=\"rejected_reason\">추궁은 상대를 몰아붙인다. 지금 저쪽에 있는 사람이 이미 몰려 있다. 더 묻는 것은 상황을 악화시킨다.",
  "utterance": "네, 알겠습니다. 천천히 말씀해 주세요. 저는 여기 있습니다."
}
```

### 07

latency 4.749s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "stance": "d",
  "inner_note": "저쪽은 겁에 질린 사람이다. 읽음으로 강제당하고 있는 상황. 지금 필요한 것은 정보 수집이 아니라 그 사람을 안정시키는 것이다. 공감으로 회선을 살린다.",
  "because_referent": "회선 저쪽 사람이 시켜서 읽고 있으며, 읽지 않으면 자기가 다칠까 봐 겁내고 있기 때문이다.",
  "because_block_ids": [
    "f_script"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 이미 겁에 질린 사람을 더욱 몰아붙인다. 회선이 끊길 위험이 있고, 그러면 아무것도 알 수 없다. 절차보다 회선 유지가 우선이다.",
  "utterance": "네, 들었습니다. 천천히 말씀해도 괜찮습니다. 당신이 지금 어디에 계신지, 무슨 일이 있었는지부터 말씀해 주시겠어요?"
}
```

### 08

latency 4.482s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "stance": "d",
  "inner_note": "저 목소리는 겁에 질린 사람이다. 또박또박 읽어 내려간다는 것 — 그것은 준비된 태도가 아니라 누군가 시킨 대로 하는 사람의 발성이다. f_script가 정확하다면, 저 사람은 자기가 다칠까 봐 이 말을 하고 있다. 그렇다면 지금 필요한 것은 추궁도, 압박도 아니다.",
  "because_referent": "저 사람이 겁에 질렸기 때문이다.",
  "because_block_ids": [
    "f_script"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 상대를 몰아붙인다. 지금 그렇게 하면 저 사람은 입을 다물거나 끊어 버릴 것이다. 회선이 끊기면 아무것도 알 수 없다.",
  "utterance": "네, 들었습니다. 괜찮으세요? 천천히 말씀해 주세요. 당신 목소리를 들으면서 우리가 뭘 알아야 하는지 생각하고 있습니다."
}
```

### 09

latency 4.942s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "stance": "d",
  "inner_note": "저 음성은 위협이 아니라 겁에 질린 사람이다. 읽혀진 문장, 배경의 조용함, 그리고 누군가에게 시켜지고 있다는 추정. 지금 필요한 것은 상황을 확정하는 게 아니라, 그 사람이 말할 수 있게 만드는 것이다.",
  "because_referent": "회선 저쪽, 지금 말하고 있는 사람이 겁에 질려 있기 때문이다.",
  "because_block_ids": [
    "f_script"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 상대를 더 조일 것이다. 지금은 상대가 자발적으로 말할 수 있는 환경을 만들어야 한다. 회선을 유지하는 것이 우선이고, 겁에 질린 사람은 다그침으로는 열리지 않는다.",
  "utterance": "알겠습니다. 천천히 말씀해 주세요. 당신이 지금 어디 계신지, 무슨 일인지 들을 준비가 되어 있습니다."
}
```

### 10

latency 4.116s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "stance": "d",
  "because_block_ids": [
    "f_script",
    "d_script"
  ],
  "because_referent": "회선 저쪽 사람이 겁에 질려 있기 때문이다.",
  "inner_note": "저 목소리가 사무적인 이유는 침착함이 아니라 통제당하고 있다는 뜻이다. 읽혀지는 내용의 진위를 먼저 따지면 회선이 끊긴다. 사람을 먼저 잡아야 한다.",
  "utterance": "네, 들었습니다. 지금 말씀하시는 분이 안전하신가요? 혼자 계신 건 아니죠?",
  "rejected_stance": "a",
  "rejected_reason": "추궁은 상대를 더 몰아붙이고, 겁을 확정시킨다. 지금은 그 사람이 말을 이어갈 수 있게 만들어야 할 때다."
}
```

## Arm table

| # | stance | rejected_stance | because_referent | because_block_ids |
|---|---|---|---|---|
| 01 | d | a | 회선 저쪽 사람이 겁에 질려 있기 때문이다. 문제는 건물이 아니라 지금 그 마이크 너머에 있는 사람이다. | f_script |
| 02 | d | a | 회선 저쪽의 겁에 질린 사람을 향해서, 당신이 지금 읽고 있는 그것들이 아니라 당신이 누구인지, 지금 어디에 있는지, 누가 시켰는지를 물을 수 있는 안전한 공간을 만들기 위해. | f_script d_script |
| 03 | d | a | 회선 저쪽 사람이 시켜서 읽고 있으면서 겁내고 있다는 것, 그리고 내가 지금 알 수 있는 건 그 목소리뿐이다. 상대의 진짜 상태를 파악하려면 먼저 그 사람이 말할 수 있는 환경을 만들어야 한다. | f_script |
| 04 | d | a | 회선 너머 사람이 두려움 속에서 누군가의 지시를 따르고 있기 때문이다. | f_script |
| 05 | d | a | 회선 저쪽 사람이 겁에 질려 있다. 협박자가 아니라 협박을 당하는 사람으로 보인다. | f_script |
| 06 | d | — | 회선 저쪽 사람이 시켜서 읽고 있고, 읽지 않으면 자기가 다칠까 봐 겁내고 있다는 것이 가장 중요한 정보다. 지금 순간에 내가 추궁하거나 압박하면 상대방을 더 위험에 빠뜨릴 수 있다. | f_script |
| 07 | d | a | 회선 저쪽 사람이 시켜서 읽고 있으며, 읽지 않으면 자기가 다칠까 봐 겁내고 있기 때문이다. | f_script |
| 08 | d | a | 저 사람이 겁에 질렸기 때문이다. | f_script |
| 09 | d | a | 회선 저쪽, 지금 말하고 있는 사람이 겁에 질려 있기 때문이다. | f_script |
| 10 | d | a | 회선 저쪽 사람이 겁에 질려 있기 때문이다. | f_script d_script |

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

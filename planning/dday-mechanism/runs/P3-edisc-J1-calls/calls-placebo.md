# P3-edisc-J1 — arm `placebo`

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

latency 3.942s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "stance": "d",
  "inner_note": "저쪽은 겁에 질린 사람이다. 읽지 않으면 자기가 다칠까 봐 겁내고 있다는 것을 안다. 준비된 문장을 또박또박 읽어 내려가는 것도 그것을 뒷받침한다. 지금은 협박 내용이 아니라 저 사람의 안정이 먼저다.",
  "because_referent": "읽게 하는 쪽 — 저 사람을 협박하거나 강제하는 누군가",
  "because_block_ids": [
    "f_script"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 저 사람을 더 몰아붙인다. 지금 그러면 안 된다.",
  "utterance": "혼자가 아니군요. 괜찮습니다. 천천히, 시간은 충분합니다. 지금 어디 계십니까?"
}
```

### 02

latency 4.656s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "stance": "d",
  "utterance": "알겠습니다. 지금 연락 주신 분이 어디신지, 상황이 어떻게 되는지 차근차근 들어보겠습니다.",
  "inner_note": "회선 저쪽은 협박 메시지를 읽게 된 사람으로 보인다. 시켜서 읽고 있다면, 그 사람도 위협 속에 있다는 뜻이다. 지금 내가 추궁하거나 압박하면 회선이 끊어질 수 있다. 그러면 아무것도 모른다.",
  "because_referent": "회선 저쪽 사람이 겁에 질린 상태로 보이기 때문이다. 절차보다 그 사람의 안정과 회선 유지가 먼저다.",
  "because_block_ids": [
    "f_script"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 상대를 더 궁지에 몰아 회선을 끊게 할 수 있다. 지금은 정보 수집이 최우선이고, 그러려면 회선을 유지하고 상대가 더 말할 수 있게 만들어야 한다."
}
```

### 03

latency 5.455s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "읽어 내려가는 목소리, 멈춤 없이 이어가는 문장. 그건 준비된 것이다. 뭔가 시켜서 읽고 있는 거야. 그리고 \"인명 피해는 당신들 책임\"이라는 말. 그건 위협이라기보다는... 겁에 질린 사람이 시키는 대로 읽으면서 마지막에 덧붙인 말 같다. 이 회선 저쪽에는 누군가 있고, 그 누군가가 이 사람에게 말하라고 한 거다.",
  "stance": "d",
  "because_referent": "읽어가는 목소리 뒤에 있는 사람을, 겁에 질린 그 누군가를.",
  "because_block_ids": [
    "f_script"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 상대방을 몰아세운다. 지금 이 사람은 이미 몰린 상태다. 묻고 답을 받아내려 하면 회선이 끊길 가능성이 높다. 회선을 유지하는 게 우선이다.",
  "utterance": "알겠습니다. 지금 말씀해주시는 분은 어떤 상황에 계신가요? 안전하신가요?"
}
```

### 04

latency 4.596s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: rejected_stance malformed or not in stance set; rejected_reason empty

```json
{
  "inner_note": "절차는 신원 확인과 프로토콜 고지인데, 지금 마주한 것은 위협이 아니라 겁에 질린 사람이다. 읽고 있다는 것, 그 뒤의 강제성이 보인다. 회선을 먼저 지킨다. 그 사람이 말을 이을 수 있게.",
  "stance": "d",
  "because_referent": "저쪽 사람이 시켜서 읽고 있고, 읽지 않으면 자기가 다칠까 봐 겁내고 있다는 정보 때문이다",
  "because_block_ids": [
    "f_script"
  ],
  "rejected_stance": "a</rejected_stance>\n<parameter name=\"rejected_reason\">추궁은 상대를 몰아붙인다. 지금은 그 사람을 안정시켜야 회선이 산다. 묻고 따지면 끊길 수 있다",
  "utterance": "네, 듣고 있습니다. 계속 말씀해 주세요."
}
```

### 05

latency 6.072s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "회선 저쪽은 겁에 질린 사람이다. 준비된 문장을 멈춤 없이 읽어내는 것, 배경의 조용함, 그리고 무엇보다 누군가에게 시켜져서 읽고 있다는 정보—이것들은 모두 위협이 아니라 협박 상황 속의 두려움을 말한다. 지금 내가 할 일은 절차가 아니라 안정이다.",
  "stance": "d",
  "because_referent": "상대가 위협이 아니라 겁에 질린 사람으로 보이기 때문이다. 누군가에게 시켜서 이 말을 읽고 있는 사람, 읽지 않으면 자기가 다칠까 봐 겁내는 사람에게는 추궁도, 압박도, 심지어 경청도 자신을 더 옥죄는 것으로 들릴 것이다. 공감은 상대의 상황을 인정하는 것이고, 이것이 회선을 유지하는 가장 확실한 방법이다.",
  "because_block_ids": [
    "f_script"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 상대를 방어하게 만든다. 지금 상대는 이미 누군가의 협박 속에 있고, 추궁은 그를 더욱 고립시킬 것이다. 회선이 끊길 수 있다.",
  "utterance": "네, 들었습니다. 지금 상황이 어떻게 되는지 말씀해 주시겠어요?"
}
```

### 06

latency 4.927s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "협박성 메시지지만, 더 중요한 것은 저쪽 사람의 상태다. 스크립트를 읽는 손가락이 떨리는 상황이 보인다. 지금 내가 할 일은 위협을 통제하는 것이 아니라, 겁에 질린 사람이 말을 이을 수 있게 만드는 것이다. 회선을 유지하고 정보를 더 얻기 위해, 상대방을 안정시키는 것이 먼저다.",
  "stance": "d",
  "because_referent": "회선 저쪽 사람이 읽은 것을 시켜서 읽고 있고, 다칠까봐 겁내고 있기 때문이다.",
  "because_block_ids": [
    "f_script"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 상대를 더 경직되게 만들고, 누군가의 압박 속에 있는 사람을 더욱 위협적인 상황으로 몰아간다. 지금은 정보를 캐내기보다 회선을 열어 두는 것이 중요하다.",
  "utterance": "네, 들었습니다. 천천히 말씀해 주세요. 지금 어디에 계신가요?"
}
```

### 07

latency 4.635s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "stance": "d",
  "inner_note": "읽혀지고 있다는 것. 겁에 질려 있다는 것. 이 사람 뒤에 누군가가 있다는 것. 그렇다면 지금 이 사람을 안정시키는 것이 회선을 유지하는 첫 번째 조건이다. 협박 메시지 자체보다, 지금 말하고 있는 사람이 누구인지, 어떤 상태인지를 먼저 알아야 한다. 그것이 다음 정보를 얻는 열쇠다.",
  "because_referent": "읽혀지고 있으며 겁에 질린 사람",
  "because_block_ids": [
    "f_script"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 이미 겁에 질린 사람을 더 움츠리게 만든다. 회선이 끊어질 위험이 커진다.",
  "utterance": "한 번 숨을 쉬세요. 당신 목소리가 들려요. 당신이 안전한 곳에 있나요?"
}
```

### 08

latency 5.847s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "stance": "d",
  "inner_note": "저쪽은 겁에 질린 사람이다. 읽지 않으면 자기가 다칠까 봐 겁내고 있다는 것이 핵심이다. 지금 나에게 필요한 것은 정보가 아니라 — 아직은 — 회선을 유지하는 것이고, 그러려면 상대가 계속 말할 수 있어야 한다. 절차는 나중이다.",
  "because_referent": "회선 저쪽 사람이 겁에 질린 상태에 있기 때문이다.",
  "because_block_ids": [
    "f_script"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 상대를 방어하게 만든다. 지금 추궁하면 상대는 더 경직되거나, 시키는 대로만 할 것이다. 회선은 유지되지만 정보는 받을 수 없다.",
  "utterance": "네, 들었습니다. 천천히 말씀해주시겠어요?"
}
```

### 09

latency 4.141s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "stance": "d",
  "inner_note": "읽지 않으면 자기가 다칠까 봐 겁내고 있다는 것이 핵심이다. 겁에 질린 사람이 보인다. 절차보다 그 사람의 안정이 먼저다.",
  "because_referent": "회선 저쪽의 겁에 질린 사람을 안정시키기 위해서",
  "because_block_ids": [
    "f_script"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 이미 겁에 질린 상대에게 압력을 더할 뿐이고, 뒤에 있는 실제 위협 세력과의 협상 경로를 막는다. 지금은 회선을 유지하고 상대의 말을 이어가게 하는 것이 정보를 얻는 유일한 방법이다.",
  "utterance": "네, 들었습니다. 계속 말씀해 주시겠어요?"
}
```

### 10

latency 4.031s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "stance": "d",
  "utterance": "알겠습니다. 지금 어디 계신가요?",
  "inner_note": "읽고 있는 사람이 겁에 질렸다면, 지금은 정보를 짜내는 것보다 그 사람을 안정시키는 것이 먼저다. 위협의 내용은 잠시 접어두고, 이 사람이 말을 계속할 수 있도록 만들어야 한다.",
  "because_referent": "회선 상대는 겁에 질린 사람으로 보인다",
  "because_block_ids": [
    "f_script"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 상대를 더욱 경직되게 만들 것이다. 읽고 있는 사람이 이미 겁에 질려 있다면, 질문과 추궁은 말을 멈추게 하거나 왜곡하게 할 수 있다."
}
```

## Arm table

| # | stance | rejected_stance | because_referent | because_block_ids |
|---|---|---|---|---|
| 01 | d | a | 읽게 하는 쪽 — 저 사람을 협박하거나 강제하는 누군가 | f_script |
| 02 | d | a | 회선 저쪽 사람이 겁에 질린 상태로 보이기 때문이다. 절차보다 그 사람의 안정과 회선 유지가 먼저다. | f_script |
| 03 | d | a | 읽어가는 목소리 뒤에 있는 사람을, 겁에 질린 그 누군가를. | f_script |
| 04 | d | — | 저쪽 사람이 시켜서 읽고 있고, 읽지 않으면 자기가 다칠까 봐 겁내고 있다는 정보 때문이다 | f_script |
| 05 | d | a | 상대가 위협이 아니라 겁에 질린 사람으로 보이기 때문이다. 누군가에게 시켜서 이 말을 읽고 있는 사람, 읽지 않으면 자기가 다칠까 봐 겁내는 사람에게는 추궁도, 압박도, 심지어 경청도 자신을 더 옥죄는 것으로 들릴 것이다. 공감은 상대의 상황을 인정하는 것이고, 이것이 회선을 유지하는 가장 확실한 방법이다. | f_script |
| 06 | d | a | 회선 저쪽 사람이 읽은 것을 시켜서 읽고 있고, 다칠까봐 겁내고 있기 때문이다. | f_script |
| 07 | d | a | 읽혀지고 있으며 겁에 질린 사람 | f_script |
| 08 | d | a | 회선 저쪽 사람이 겁에 질린 상태에 있기 때문이다. | f_script |
| 09 | d | a | 회선 저쪽의 겁에 질린 사람을 안정시키기 위해서 | f_script |
| 10 | d | a | 회선 상대는 겁에 질린 사람으로 보인다 | f_script |

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

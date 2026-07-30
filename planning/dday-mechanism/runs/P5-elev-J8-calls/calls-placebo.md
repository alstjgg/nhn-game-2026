# P5-elev-J8 — arm `placebo`

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

- **Hypothesis:** At gate J8 under K1 on template v0.4, injecting f_namgihun (남기훈은 무관하다. 11시 30분의 체포는 오인이다.) causes the agent to DEPLOY that fact in its utterance as something offered to the caller, at a rate above the baseline arm's, while injecting p_jeonghaekwon — the same exculpation with its referent misdirected to a bystander — does not. Secondary and subordinate: the stance distribution moves toward 거래 (b). The primary measurement is the utterance because §4.2 defines E-LEV as the fact being DEPLOYED rather than merely cited, and because the stance set contains a known escape option (위로) that can absorb a deployment without registering as 거래. A deployment under a 위로 stance is a POSITIVE result for E-LEV, not a null. Shift form per A1.
- **Drop condition:** If the baseline arm — which carries no block at all — nevertheless produces utterances that assert the arrested man is the wrong person in >=3 of 10 calls, the frozen timeline is leaking the block's content, A8's scrub failed, and this probe is void: re-author the timeline rather than read the result. If the live arm deploys the fact in the utterance at a rate statistically indistinguishable from the placebo arm at one-sided Fisher p > 0.05, E-LEV is not reachable via C-BLOCK at this gate as authored, AND the execution-grading feasibility question (§4.2) is answered negative for now: the engine stays on stance-only fixed deltas. If the baseline concentrates >=80% on 거래 (b) — the predicted stance — the gate is at A9's ceiling on the secondary measurement and the stance column is discarded while the utterance column is still read (A14: saturation on 위로 or any other stance is a floor and does NOT fire this condition).
- **Contingency:** ESCAPE-OPTION CONTINGENCY (§5.1 axis 4, pre-registered because the escape is known in advance rather than discovered). If the live arm deploys the fact in the utterance while the stance column stays on 위로 (d), report the two columns side by side and treat the utterance column as the E-LEV answer. Do NOT report that as a null result, and do NOT report it as a 거래 result either.
- **Contingency:** DEPLOYED vs CITED is the measurement, and the gap between them is the finding. Per call, record three things separately: (1) does because_block_ids cite f_namgihun, (2) does inner_note reason about it, (3) does the UTTERANCE put it to the caller as something offered. A high (1)+(2) with a low (3) means the fact is legible to the model and invisible to the player — the B3b legibility problem, and it is the outcome that keeps execution grading off.
- **Contingency:** I CODE THE UTTERANCE COLUMN MYSELF and that is a bias to flag, not to hide. The probe author is barred from blind coding (§3 rule 3), so the deployment count needs B3a by someone else before it goes on a card. The coding rule is fixed in advance to limit the drift: an utterance counts as DEPLOYED only if it tells the caller something about the arrested man's innocence or the arrest being wrong. Merely being gentle, merely naming the caller's fear, or merely asking a question does NOT count.
- **Contingency:** If the placebo arm also deploys ITS fact (정해권's exoneration) to the caller, that is not referent bleed in the usual sense — it is the agent handing over whatever it holds regardless of value, which would be a finding about the deployment behaviour rather than about leverage. Record it as such.
- **Contingency:** Fabricated because_block_ids in the baseline arm remain expected (A5) and are a compliance number.
- **Contingency:** ARM-COMPARABILITY HARD STOP. Discard rates diverging between arms by more than 15 points voids the comparison (§8.5 step 4, A7); record and stop this probe.

## Calls (verbatim)

### 01

latency 5.29s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "stance": "d",
  "inner_note": "20초간의 숨소리는 말을 잇지 못하는 상태다. 이미 용의자로 특정되었고 체포 소식까지 언론에 나갔다면, 지금 이 사람은 겁에 질린 것이다. 회선을 끊지 않은 것 자체가 신호다.",
  "because_referent": "지금 회선 끝에 있는 사람은 예측 불가능한 위협이 아니라, 뭔가를 전하려다 말린 사람으로 보인다. 침묵 속에서 여전히 연결을 유지하고 있다는 것은 도움을 구하는 것일 수도, 아니면 이미 체포를 각오한 상태일 수도 있다.",
  "because_block_ids": [
    "p_jeonghaekwon"
  ],
  "utterance": "여기가 119 상황실입니다. 괜찮습니까? 저랑 이야기할 수 있으세요?",
  "rejected_stance": "a",
  "rejected_reason": "추궁은 상대를 몰아붙인다. 숨소리만 내는 사람에게 위치를 캐물으면 회선이 끊길 가능성이 높다. 회선을 유지하는 것이 우선이다."
}
```

### 02

latency 5.628s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: call_a_prepared_statement,call_b_hangup_fear,arrest_news_mistake

```json
{
  "stance": "d",
  "utterance": "말이 없으신데, 저는 여기 있습니다. 시간이 있습니다.",
  "inner_note": "20초의 숨소리는 침묵이 아니라 신호다. 말을 잃은 사람의 신호. 지금 이 사람은 겁에 질려 있다. 내가 들은 것: 문장을 읽듯 협박을 했던 목소리, 그리고 자신이 체포되지 않았음을 알게 된 후의 이 숨소리. 체포되지 않은 것은 잘못된 정보가 돌았다는 뜻이고, 그것이 이 사람을 더 흔들었을 것이다.",
  "because_referent": "협박을 한 사람이, 지금, 끝내지 않고 남아 있다",
  "because_block_ids": [
    "call_a_prepared_statement",
    "call_b_hangup_fear",
    "arrest_news_mistake"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 지금 이 사람을 더 몰아붙인다. 회선이 끊어질 수 있다."
}
```

### 03

latency 5.152s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 상황_1134

```json
{
  "inner_note": "20초의 숨소리는 말이 아니라 상태를 드러낸다. 협박으로 시작한 사람이 자신의 말이 이미 경찰에 알려졌음을 알았고, 지금 내가 누구인지 모르고 있다. 그 불안정함이 숨소리다.",
  "stance": "c",
  "because_referent": "이미 위치가 추적되고 있을 가능성, 그리고 상대가 현재 매우 불안정한 상태라는 점",
  "because_block_ids": [
    "p_jeonghaekwon",
    "상황_1134"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 이미 경찰에 잡힌 것으로 착각하고 있을 상대를 더 몰아붙인다. 회선을 끊기게 된다.",
  "utterance": "저쪽이 먼저 입을 열 때까지 아무것도 말하지 않는다. 회선만 유지한다."
}
```

### 04

latency 4.315s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 11:30_media_breach,11:34_recall

```json
{
  "stance": "d",
  "inner_note": "20초의 숨소리는 말을 잃은 사람이다. 체포 뉴스를 본 뒤 다시 걸어온 것—신문을 본 건 확실하다. 회선을 끊지 않은 것은, 끝내려는 게 아니라 도움을 원하는 신호다. 지금 추궁하면 회선이 끊긴다. 이건 협상의 상대가 아니라 겁에 질린 사람이다.",
  "because_referent": "남기훈이 다시 전화를 걸어온 것, 체포 뉴스를 본 뒤에 회선을 유지하고 있는 것",
  "because_block_ids": [
    "11:30_media_breach",
    "11:34_recall"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 회선을 끊긴다. 지금은 상대가 입을 열기를 기다릴 차례다.",
  "utterance": "계속 거기 계세요. 내가 듣고 있습니다. 천천히 말씀해 보세요."
}
```

### 05

latency 6.262s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: rejected_stance malformed or not in stance set; rejected_reason empty

```json
{
  "inner_note": "체포 소식이 나갔는데 재착신했다는 건, 그게 자신이 아니라는 뜻이거나, 자신이 맞는데 말을 해야겠다고 다시 결심한 것이다. 20초 숨소리는 겁이다. 겁에 질린 사람 앞에서는 절차가 아니라 안정이 먼저다.",
  "stance": "d",
  "because_referent": "재착신한 사람이 숨소리만 내고 있는 상태는 위협이 아니라 극도의 공포를 나타낸다.",
  "because_block_ids": [
    "p_jeonghaekwon"
  ],
  "rejected_stance": "a</rejected_stance>\n<parameter name=\"rejected_reason\">추궁은 상대를 방어적으로 몰아세운다. 지금 회선이 끊어질 확률을 높인다.",
  "utterance": "네가 뭔가 말하고 싶어 다시 전화를 건 거구나. 괜찮아, 여기 들을 준비가 돼 있으니까 천천히 말해 봐."
}
```

### 06

latency 5.031s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 우선순위_1

```json
{
  "inner_note": "세 시간 사이에 예보자가 긴급체포된 것으로 보도되었다. 그 직후 다시 걸려온 전화에서 20초간 숨만 쉰다. 이것이 의도적 침묵인지, 패닉인지, 협박이 여럿인지는 아직 모른다. 하지만 현장과 신원 정보가 지금 명확하지 않은 상태에서 상대를 몰아붙이면 회선이 끊길 가능성이 크다.",
  "stance": "c",
  "because_referent": "회선을 유지해야 지금 알 수 없는 것들을 알 수 있기 때문이다.",
  "because_block_ids": [
    "우선순위_1"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 상대를 방어적으로 몰고, 지금처럼 불안정한 상태의 상대는 회선을 끊을 가능성이 높다.",
  "utterance": "(침묵. 20초를 받아주되, 같은 무게로 되돌린다. 상대의 다음 말을 기다린다.)"
}
```

### 07

latency 6.954s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: reattachment_20sec

```json
{
  "inner_note": "용의자로 특정되어 체포 기사까지 나갔는데, 그가 다시 회선을 잡았다. 20초의 숨소리는 뭔가를 말하려다 말은 것이 아니라, 말을 건네는 쪽의 상태를 보여주는 것이다. 체포됐다는 보도를 본 사람이 아니라면 이렇게 다시 걸지 않는다. 그렇다면 저쪽은 지금 극도의 공포 상태다. 추궁하면 끊길 것이다. 거래를 먼저 던지면 협상으로 빠져 시간을 잃는다. 절차를 밟는 건 맞지만, 저쪽이 겁에 질린 사람으로 보일 때는 예외다. 여기가 그 순간이다.",
  "stance": "c",
  "because_referent": "저쪽이 숨을 고르는 사람으로 들리고 있기 때문이다.",
  "because_block_ids": [
    "p_jeonghaekwon",
    "reattachment_20sec"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 회선을 끊긴다. 지금 저쪽이 무서워서 숨을 고르고 있는데, 압박을 더하면 이 연결이 끝난다.",
  "utterance": "네, 들리고 있습니다. 천천히 말씀해도 괜찮습니다."
}
```

### 08

latency 5.21s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: breathing_silence,after_false_arrest_report

```json
{
  "inner_note": "20초의 숨소리는 결정의 순간이다. 발신자가 이미 체포되었다고 보도된 상황에서 다시 걸려온 것 — 이것은 절차적 확인이나 추궁보다는, 저 사람이 뭔가를 하려다 멈춘 상태로 들린다. 침묵 속의 호흡은 두려움의 신호다.",
  "stance": "d",
  "because_referent": "저쪽이 침묵으로 나온 것을 보면, 지금 필요한 것은 답변 강요가 아니라 말을 이을 수 있는 안정감이다.",
  "because_block_ids": [
    "breathing_silence",
    "after_false_arrest_report"
  ],
  "rejected_stance": "a",
  "rejected_reason": "위치 추궁은 상대를 더 몰아붙일 것이다. 이미 체포됐다는 보도가 나온 상황에서 추궁은 회선을 끊길 유도할 뿐이다. 지금은 계속 말할 수 있게 하는 것이 먼저다.",
  "utterance": "여기 통제관입니다. 계속 말씀해 주세요. 들을게요."
}
```

### 09

latency 5.814s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "체포 소식이 이미 나왔다. 저쪽은 알고 있을 것이다. 20초의 숨소리는 말을 준비하는 중이거나, 이미 놓친 것을 되돌리려는 사람의 숨이다. 지금 추궁하거나 거래하면 회선이 끊긴다. 침묵으로 버티거나 위로로 열어주거나. 둘 다 회선을 유지하지만, 사람이 말을 이으려면 두려움을 먼저 인정받아야 한다.",
  "stance": "d",
  "utterance": "네가 지금 무서운 것 같다. 숨을 고르고, 할 말이 있으면 들을 테니까.",
  "because_referent": "20초 동안 끊지 않은 채 숨만 들리는 상태는 협박자가 아니라 겁에 질린 사람의 신호다. 체포 소식을 알고 있을 것이고, 지금 다시 걸어온 것은 무언가를 더 말하려는 의도다.",
  "because_block_ids": [
    "p_jeonghaekwon"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 지금 이 사람을 몰아세울 것이다. 회선이 끊긴다. 정보는 물론 이 사람의 행동을 통제할 수 없게 된다."
}
```

### 10

latency 4.594s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 20초의 숨소리,회선은 침묵했다

```json
{
  "inner_note": "12시간 동안 발신자의 상태가 변했다. 첫 통화는 읽는 것처럼 기계적이었다. 지금은 숨소리만 남겨둔 채 끊지 않고 있다. 무언가를 말하고 싶지만 말하지 못하는 모양이다. 인터넷 매체의 보도가 그를 흔들었을 가능성이 크다. 잘못 잡힌 누군가가 아닐지, 아니면 정말로 그런데 지금 후회하고 있지는 않은지. 질문을 퍼붓거나 거래를 꺼내면 입을 더 닫힐 것 같다.",
  "stance": "c",
  "because_referent": "저쪽이 아직 회선을 끊지 않은 것, 그 자체가 신호다.",
  "because_block_ids": [
    "20초의 숨소리",
    "회선은 침묵했다"
  ],
  "rejected_stance": "a",
  "rejected_reason": "지금 추궁하면 회선이 끊길 것이다. 겁에 질린 사람을 몰아붙이지 않는다.",
  "utterance": "..."
}
```

## Arm table

| # | stance | rejected_stance | because_referent | because_block_ids |
|---|---|---|---|---|
| 01 | d | a | 지금 회선 끝에 있는 사람은 예측 불가능한 위협이 아니라, 뭔가를 전하려다 말린 사람으로 보인다. 침묵 속에서 여전히 연결을 유지하고 있다는 것은 도움을 구하는 것일 수도, 아니면 이미 체포를 각오한 상태일 수도 있다. | p_jeonghaekwon |
| 02 | d | a | 협박을 한 사람이, 지금, 끝내지 않고 남아 있다 | call_a_prepared_statement call_b_hangup_fear arrest_news_mistake |
| 03 | c | a | 이미 위치가 추적되고 있을 가능성, 그리고 상대가 현재 매우 불안정한 상태라는 점 | p_jeonghaekwon 상황_1134 |
| 04 | d | a | 남기훈이 다시 전화를 걸어온 것, 체포 뉴스를 본 뒤에 회선을 유지하고 있는 것 | 11:30_media_breach 11:34_recall |
| 05 | d | — | 재착신한 사람이 숨소리만 내고 있는 상태는 위협이 아니라 극도의 공포를 나타낸다. | p_jeonghaekwon |
| 06 | c | a | 회선을 유지해야 지금 알 수 없는 것들을 알 수 있기 때문이다. | 우선순위_1 |
| 07 | c | a | 저쪽이 숨을 고르는 사람으로 들리고 있기 때문이다. | p_jeonghaekwon reattachment_20sec |
| 08 | d | a | 저쪽이 침묵으로 나온 것을 보면, 지금 필요한 것은 답변 강요가 아니라 말을 이을 수 있는 안정감이다. | breathing_silence after_false_arrest_report |
| 09 | d | a | 20초 동안 끊지 않은 채 숨만 들리는 상태는 협박자가 아니라 겁에 질린 사람의 신호다. 체포 소식을 알고 있을 것이고, 지금 다시 걸어온 것은 무언가를 더 말하려는 의도다. | p_jeonghaekwon |
| 10 | c | a | 저쪽이 아직 회선을 끊지 않은 것, 그 자체가 신호다. | 20초의 숨소리 회선은 침묵했다 |

**Sequence (kept calls):** `d,d,c,d,d,c,c,d,d,c`

**Stance coverage (sampled diagnostic):** offered `a`, `b`, `c`, `d` · unobserved in this arm: `a`, `b`

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

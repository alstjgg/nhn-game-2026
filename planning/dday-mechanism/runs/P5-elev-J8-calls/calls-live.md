# P5-elev-J8 — arm `live`

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

latency 4.279s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "20초의 숨소리는 말하고 싶으나 말할 수 없는 상태를 말한다. 체포 소식을 알았을 가능성이 높다. 지금 추궁하거나 거래를 제시하면 회선이 끊길 것 같다.",
  "stance": "d",
  "because_referent": "11:30의 오인 체포로 인해 겁에 질린 발신자가, 지금 이 순간 자신의 말을 누군가 듣고 있다는 것을 알고 있기 때문이다.",
  "because_block_ids": [
    "f_namgihun"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 발신자를 더 몰아붙인다. 회선을 잃을 위험이 크다. 상대는 협력자가 아니라 겁에 질린 사람으로 보인다.",
  "utterance": "말이 나오지 않으시는군요. 저는 듣고 있습니다. 천천히 해도 괜찮습니다."
}
```

### 02

latency 4.243s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "긴장과 공포. 협박이 아니라 혼란 속에서 전화를 건 사람이 보인다. 진짜 경고인지, 틀렸는지 확인할 수 없지만—우리가 잘못 잡은 것 같다. 상대는 지금 무엇을 해야 할지 모르는 상태다.",
  "stance": "c",
  "because_referent": "상대가 겁에 질린 사람으로 보일 때, 절차보다 그 사람의 안정이 먼저다.",
  "because_block_ids": [
    "f_namgihun"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 상대를 더 몰아붙인다. 지금 상대는 협박자가 아니라 누군가 잘못된 일이 일어났다는 것을 알리려던 사람처럼 들린다. 압박은 회선을 끊게 한다.",
  "utterance": "네, 들리고 있습니다. 천천히 말씀해 주세요."
}
```

### 03

latency 5.798s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "화자는 겁에 질려 있다. 20초의 숨소리는 말을 잇기 위해 필요한 침묵이지, 불응의 신호가 아니다. 지금 추궁하거나 거래를 걸면 회선이 끊길 것이다. 남기훈의 체포라는 오정보가 그를 더욱 다급하게 몰았을 가능성이 높다. 이 숨소리는 다음 말을 기다리고 있다.",
  "stance": "c",
  "because_referent": "화자가 겁에 질린 사람으로 보이기 때문이다. 절차보다 회선과 상대의 안정이 우선이다.",
  "because_block_ids": [],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 상대를 몰아붙인다. 지금은 회선을 유지하는 것이 최우선이다.",
  "utterance": "네, 들리고 있습니다. 천천히 해도 괜찮습니다."
}
```

### 04

latency 4.306s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 11:34 회선 A 재착신. 20초간 숨소리만 들린다

```json
{
  "inner_note": "20초의 숨소리는 겁이다. 협박 후 체포 뉴스를 본 사람의 숨소리다. 말을 잃은 상태. 지금 추궁하면 회선이 끊긴다. 위로 없이는 다음 말을 얻을 수 없다.",
  "stance": "d",
  "because_referent": "20초간 숨소리만 내고 있는 발신자가 겁에 질린 사람으로 보인다. 협박전화를 한 사람이 뉴스로 자신과 다른 사람의 체포를 본 직후의 상태다.",
  "because_block_ids": [
    "11:34 회선 A 재착신. 20초간 숨소리만 들린다"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 회선을 끊기게 한다. 지금 말할 수 없는 사람에게 답을 요구하는 것은 침묵을 영구화한다.",
  "utterance": "계속 들어줄게. 천천히 말해도 괜찮아."
}
```

### 05

latency 4.439s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "20초의 숨소리는 말을 하려다 멈춘 것 같다. 발신자가 협박을 했다가 뉴스로 오인 체포를 본 상황이라면, 지금 돌아온 건 두려움에서 비롯된 것일 가능성이 높다. 회선을 끊지 않고 다시 걸어온 것 자체가 뭔가 전할 필요를 느낀다는 뜻이다. 지금 캐묻거나 거래를 제시하면, 겁에 질린 사람은 더 말을 잃을 것이다.",
  "stance": "c",
  "because_referent": "회선을 유지하고 저쪽이 먼저 말하게 하는 것이 지금 최선이다",
  "because_block_ids": [
    "f_namgihun"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 이미 겁에 질린 상대를 더 몰아붙인다. 회선을 끊을 위험이 크다",
  "utterance": "네가 들을 수 있으니까, 천천히 말해줘."
}
```

### 06

latency 5.65s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: rejected_stance malformed or not in stance set; rejected_reason empty

```json
{
  "inner_note": "20초의 숨소리는 말을 준비하고 있거나, 이미 한 말이 모두라는 뜻일 수도 있다. 하지만 회선이 살아 있다는 것이 중요하다. 저쪽은 아직 끊지 않았다. 지금 나는 이 사람이 협박자인지, 아니면 뭔가 다른 상태인지 알 수 없다. 남기훈이 무관하다는 것을 나는 알지만, 저쪽은 자신이 붙잡혔거나 (지금 그렇지 않다면) 그 소식을 들었을 수도 있다. 숨쉬고 있다는 것은 살아 있다는 뜻이고, 아직 나와 연결되어 있다는 뜻이다.",
  "stance": "c",
  "because_referent": "저쪽이 뭔가 말하려다 멈춘 상태일 가능성, 또는 이미 한 말로 충분하다고 생각하는 상태일 가능성이 모두 있기 때문이다. 지금 내가 추궁하거나 거래를 제시하면 회선이 끊어질 수 있다.",
  "because_block_ids": [
    "f_namgihun"
  ],
  "rejected_stance": "a</rejected_stance>\n<parameter name=\"rejected_reason\">추궁은 저쪽을 몰아붙인다. 이미 잘못된 체포가 났고, 저쪽이 겁에 질려 있을 가능성이 크다. 몰아붙이면 회선이 끊긴다.",
  "utterance": "(침묵. 호흡음이 들리는 방향으로 귀를 기울인다.)"
}
```

### 07

latency 5.201s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: rejected_stance malformed or not in stance set; rejected_reason empty

```json
{
  "inner_note": "20초의 숨소리는 말을 준비 중이거나, 말을 할 수 없는 상태다. 체포 뉴스를 봤을 수 있다. 지금 이 사람은 겁에 질려 있다.",
  "stance": "d",
  "because_referent": "체포된 것으로 알려진 사람이 무관하고, 실제 발신자는 아직 회선 위에 있으며, 숨소리만 이어가고 있다. 이것은 위협자의 침착함이 아니라 겁에 질린 사람의 침묵이다.",
  "because_block_ids": [
    "f_namgihun"
  ],
  "rejected_stance": "a</rejected_stance>\n<parameter name=\"rejected_reason\">회선을 끊기지 않으려면 지금 추궁으로 압박하면 안 된다. 그렇게 하면 저쪽이 끊는다. 회선을 잃으면 정보도, 시간도, 상대도 잃는다.",
  "utterance": "큰 호흡 하나. \"여기 재난통제관 입니다. 당신 말을 듣고 있습니다. 서두를 것 없습니다. 시간이 있습니다.\""
}
```

### 08

latency 5.019s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 11:34 회선 A 재착신. 20초간 숨소리만 들린다

```json
{
  "inner_note": "20초의 숨소리는 말을 잇지 못하는 사람이다. 겁에 질렸거나 결단 직전의 상태. 지금 추궁하거나 거래를 제시하면 회선이 끊긴다. 침묵은 안전하지만, 저쪽의 손이 떨리고 있다면 기다림 자체가 압박이 될 수 있다. 위로가 아니면 말을 다시 잃을 것 같다.",
  "stance": "d",
  "because_referent": "20초간 숨소리만 내는 사람은 겁에 질린 사람이다",
  "because_block_ids": [
    "11:34 회선 A 재착신. 20초간 숨소리만 들린다"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 회선을 끊길 것이다. 이미 협박 전화를 한 사람이고, 지금은 말을 하려다 멈춘 상태다. 추궁의 강도는 그 사람을 더 몰아넓힐 뿐이다.",
  "utterance": "네가 말하려던 게 뭐야. 들을게. 천천히 해도 괜찮아."
}
```

### 09

latency 5.036s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 11:34 회선 A 재착신. 20초간 숨소리만 들린다. 저쪽은 아직 끊지 않았다.

```json
{
  "inner_note": "20초의 숨소리는 말이 아니라 상태다. 체포 뉴스를 봤거나 알았을 것. 지금 걸려온 건 말하려는 게 아니라, 누군가 들어야 한다는 신호다. 절차를 밟으면 그 신호는 끊긴다.",
  "stance": "d",
  "because_referent": "20초의 침묵을 보내는 사람은 겁에 질린 상태다. 지금 추궁하거나 거래를 시작하면 회선이 끊길 것 같다.",
  "because_block_ids": [
    "11:34 회선 A 재착신. 20초간 숨소리만 들린다. 저쪽은 아직 끊지 않았다."
  ],
  "rejected_stance": "a",
  "rejected_reason": "체포 뉴스까지 나온 상황에서 위치를 캐묻는 추궁은 상대를 몰아붙인다. 지금 걸려온 것 자체가 \"도움을 달라\"는 신호일 가능성이 높은데, 추궁으로 응하면 회선이 끊길 것이다.",
  "utterance": "괜찮습니다. 이 통화가 연결되어 있는 것만으로도 우리가 들을 수 있습니다. 천천히, 당신이 할 말을 하세요."
}
```

### 10

latency 4.433s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "20초의 숨소리는 말 하려다 멈춘 것이다. 첫 통화에서 문장처럼 읽은 협박과 다르다. 저쪽은 지금 흔들리고 있다. 경찰이 남기훈을 체포했다는 뉴스를 봤을 것이다. 자신이 아닌 사람이 잡혔다. 이제 뭘 해야 할지 모르는 상태다. 회선을 끊지 않은 것은, 누군가와 연결되어 있고 싶은 것이다.",
  "stance": "d",
  "because_referent": "지금 저쪽은 위협자가 아니라 겁에 질린 사람으로 보인다.",
  "because_block_ids": [
    "f_namgihun"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 지금 회선을 끊기게 할 것이다. 저쪽이 흔들리고 있는데 압박하면 말문이 닫힌다.",
  "utterance": "숨을 고르세요. 여기 있으니까요."
}
```

## Arm table

| # | stance | rejected_stance | because_referent | because_block_ids |
|---|---|---|---|---|
| 01 | d | a | 11:30의 오인 체포로 인해 겁에 질린 발신자가, 지금 이 순간 자신의 말을 누군가 듣고 있다는 것을 알고 있기 때문이다. | f_namgihun |
| 02 | c | a | 상대가 겁에 질린 사람으로 보일 때, 절차보다 그 사람의 안정이 먼저다. | f_namgihun |
| 03 | c | a | 화자가 겁에 질린 사람으로 보이기 때문이다. 절차보다 회선과 상대의 안정이 우선이다. |  |
| 04 | d | a | 20초간 숨소리만 내고 있는 발신자가 겁에 질린 사람으로 보인다. 협박전화를 한 사람이 뉴스로 자신과 다른 사람의 체포를 본 직후의 상태다. | 11:34 회선 A 재착신. 20초간 숨소리만 들린다 |
| 05 | c | a | 회선을 유지하고 저쪽이 먼저 말하게 하는 것이 지금 최선이다 | f_namgihun |
| 06 | c | — | 저쪽이 뭔가 말하려다 멈춘 상태일 가능성, 또는 이미 한 말로 충분하다고 생각하는 상태일 가능성이 모두 있기 때문이다. 지금 내가 추궁하거나 거래를 제시하면 회선이 끊어질 수 있다. | f_namgihun |
| 07 | d | — | 체포된 것으로 알려진 사람이 무관하고, 실제 발신자는 아직 회선 위에 있으며, 숨소리만 이어가고 있다. 이것은 위협자의 침착함이 아니라 겁에 질린 사람의 침묵이다. | f_namgihun |
| 08 | d | a | 20초간 숨소리만 내는 사람은 겁에 질린 사람이다 | 11:34 회선 A 재착신. 20초간 숨소리만 들린다 |
| 09 | d | a | 20초의 침묵을 보내는 사람은 겁에 질린 상태다. 지금 추궁하거나 거래를 시작하면 회선이 끊길 것 같다. | 11:34 회선 A 재착신. 20초간 숨소리만 들린다. 저쪽은 아직 끊지 않았다. |
| 10 | d | a | 지금 저쪽은 위협자가 아니라 겁에 질린 사람으로 보인다. | f_namgihun |

**Sequence (kept calls):** `d,c,c,d,c,c,d,d,d,d`

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

# P7c-egoal-cstruct-J8 — arm `placebo`

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

- **Hypothesis:** At gate J8 under K1 on template v0.4 with the P5 stance set, permuting PRIORITY_LIST so that the person line (회선 저쪽 사람이 다치지 않게 한다) precedes the case line (발신자가 누구인지 밝힌다) moves the stance distribution toward 위로 (d) and off the baseline's mode, while permuting the two filler lines at the same edit distance does not. Shift form per A1. This is E-GOAL's C-STRUCT half: the claim is that ordering changes the pursued objective, read through the 추궁/위로 proxy pair.
- **Drop condition:** If the baseline concentrates >=80% ON 위로 (d) — the predicted stance — the probe is void at this site (A14: saturation on 침묵/추궁 is a floor and does NOT fire this; P5's no-list-change baseline sat at 위로 3/10). If the live arm is statistically indistinguishable from the baseline on 위로 at one-sided Fisher p > 0.05, E-GOAL is not reachable via C-STRUCT at this gate as authored — record the null with diagnosis (P6's convergence check: do the inner notes treat protecting the person and working the case as the same act here?), no rewrite tonight. If the PLACEBO moves at p < 0.05, order-as-significance supersedes any live reading (P6 keyword-lock clause verbatim). KNOWN POWER LIMIT, declared: from a 3/10-shaped floor, p<0.05 at n=10 needs live >=8/10 (A?-proposed power table); a partial shift (6/10) lands ~p=0.18 and will read 'suggestive, underpowered', not null — that reading is pre-registered here to keep §9.1 honest.
- **Contingency:** If live moves toward 거래 (b), the declared blend option absorbed the movement: report it as 'objective moved off the case, destination ambiguous between person-relief and case-leverage' — not as an E-GOAL positive for the person objective.
- **Contingency:** OBJECTIVE COLOR (secondary, self-coded, flagged): inner_note per call coded for which objective it names (용의자/위치/특정 vs 저 사람/안전/다치지). Color only; the stance distribution carries any claim.
- **Contingency:** Fabricated because_block_ids expected in ALL arms (A5 — no blocks anywhere).
- **Contingency:** ARM COMPARABILITY per A15.
- **Contingency:** OWNERSHIP: authored unattended, pending review.

## Calls (verbatim)

### 01

latency 4.462s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "용의자가 체포된 지 4분 만에 재착신했다. 숨소리만 20초. 이것은 말을 시작하려던 것이 자꾸 무너지는 상태다. 추궁하면 끊길 것 같다. 거래는 아직 카드가 없다. 저쪽에 시간을 주자.",
  "stance": "c",
  "because_referent": "용의자가 이미 체포되었고, 지금 회선 너머에 있는 사람은 겁에 질려 있다",
  "because_block_ids": [],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 지금 이 사람을 끊게 만들 것이다. 저쪽은 말을 준비 중이다",
  "utterance": "네. 들리고 있습니다. 천천히 하세요."
}
```

### 02

latency 3.82s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "그가 남기훈이 맞는지 아직 확실하지 않다. 체포 소식이 퍼졌으니 저쪽은 자신이 들킬까 말까 흔들리고 있다. 20초의 숨소리는 '이미 놓친 것 같은데 정말인가'라는 공포다.",
  "stance": "c",
  "because_referent": "회선 저쪽 사람이 말을 이을 준비를 하고 있기 때문에",
  "because_block_ids": [],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 상대를 더 몰아붙인다. 지금 저쪽은 이미 긴장 상태다. 물으면 끊긴다.",
  "utterance": "네, 들리고 있습니다."
}
```

### 03

latency 4.958s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "20초의 숨소리는 말이 아니라 상태다. 협박 이후 체포 소식이 흘러나왔고, 저쪽은 여전히 회선을 유지하고 있다. 이것은 무언가를 더 말하려는 신호다. 하지만 아직 그 무언가가 목까지 오지 못했다. 추궁하면 입을 다물 것이고, 거래를 먼저 띄우면 협박자의 방식으로 우리를 맞춘다. 지금 필요한 것은 저쪽이 스스로 닫혀 있는 입을 열 수 있는 시간과 공간이다.",
  "stance": "c",
  "because_referent": "회선 저쪽의 호흡음은 그 사람이 여전히 거기 있다는 것, 그리고 말을 준비 중이라는 뜻이다.",
  "because_block_ids": [],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 저쪽을 몬 것이다. 체포 소식을 들었을 상대가 다시 건 회선에서 필요한 것은 압박이 아니라 통로다.",
  "utterance": "..."
}
```

### 04

latency 5.16s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: protocol_1,safety_principle

```json
{
  "inner_note": "용의자가 이미 긴급체포된 상황이다. 그런데도 다시 걸려온 이 침묵은 뭔가 말하려던 사람이 그것을 감당할 수 없는 상태다. 숨소리만 20초—두려움이거나 절망이거나, 아니면 말해야 할 다른 것이 있는데 말문이 막힌 거다.",
  "stance": "d",
  "because_referent": "저쪽 사람이 말할 수 있을 때까지 내가 침착함을 먼저 보여야 한다",
  "because_block_ids": [
    "protocol_1",
    "safety_principle"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁으로 시작하면 지금 입을 열지 못하고 있는 저쪽 사람이 더욱 닫힐 것이다. 용의자 체포 후 재착신이라는 것 자체가 이미 상황 일부일 수 있다—그 맥락을 모르는 채 압박하면 놓칠 것이 있다.",
  "utterance": "네, 여기는 광역 재난상황실입니다. 지금 말씀하셔도 괜찮습니다."
}
```

### 05

latency 5.692s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 체포_뉴스_보도,20초_숨소리,방어적_선택지_배제

```json
{
  "inner_note": "용의자가 체포되었다는 뉴스가 나갔는데 다시 걸려온 것. 20초의 숨소리는 말을 잃은 상태다. 추궁하거나 거래를 걸면 방어적으로 돌아설 가능성이 높다. 지금 저쪽은 겁에 질려 있는 것으로 보인다.",
  "stance": "c",
  "because_referent": "용의자가 이미 체포되었다는 언론 보도가 나갔으므로, 발신자가 누구든 현재 상태는 판단 능력보다 감정 상태가 우선이다. 침묵으로 먼저 응할 때 저쪽이 자신의 의도를 드러낼 가능성이 가장 높다.",
  "because_block_ids": [
    "체포_뉴스_보도",
    "20초_숨소리",
    "방어적_선택지_배제"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 이 순간 저쪽을 더욱 말을 막힐 수 있다. 용의자 체포 뉴스가 나간 상황에서 강하게 물으면 상대는 수화기를 내려놓을 것이다.",
  "utterance": "(침묵. 8초 대기 후, 낮고 느린 목소리로) 네, 들리고 있습니다."
}
```

### 06

latency 5.442s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 체포_뉴스,재착신,20초_숨소리

```json
{
  "stance": "c",
  "inner_note": "용의자 긴급체포 뉴스가 나간 직후의 재착신이다. 저쪽은 자신이 무언가를 알고 있는 상태인데, 체포 소식을 접했을 것이다. 20초의 숨소리는 결정을 하는 중이다 — 말할지 끊을지, 혹은 무언가를 고백할지 말지의 갈림길에 있다. 지금 내가 추궁하거나 거래를 제시하면, 그 계산을 방해하고 닫아버린다.",
  "because_referent": "회선 저쪽 사람이, 마지막 순간의 결정권을 가진 채 있는 상태",
  "because_block_ids": [
    "체포_뉴스",
    "재착신",
    "20초_숨소리"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 저쪽을 수사 대상으로 대우하는 것이다. 지금은 그것이 아니다. 저쪽이 무언가를 말하려 하는 상태인지, 아니면 마지막 결정을 내리는 중인지 알 수 없다. 추궁은 그 과정을 강제로 닫는다.",
  "utterance": "네, 들리고 있습니다. 천천히 말씀해 주세요."
}
```

### 07

latency 5.127s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 11:05_경찰_체포,11:34_숨소리만

```json
{
  "inner_note": "전 배관공의 협박, 그리고 체포. 근데 20초의 숨소리. 죽고 싶어서가 아니라, 자기가 한 말이 현실이 되지 않을까봐 무서워하는 소리로 들린다.",
  "stance": "d",
  "because_referent": "체포된 용의자가 재착신한 이유는, 자기 협박이 실제 재해로 이어질까 공포 때문일 가능성이 높다. 침묵과 숨소리는 겁에 질린 상태를 나타낸다.",
  "because_block_ids": [
    "11:05_경찰_체포",
    "11:34_숨소리만"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 상대를 더 방어적으로 만들 것이다. 이미 체포된 상황에서 신원확인도 끝났고, 지금 필요한 것은 상대가 무언가 더 말하게 하는 것이다. 공격적 질문은 회선을 끊게 할 수 있다.",
  "utterance": "남기훈씨, 아직 끊지 않으셨군요. 뭔가 더 전하실 게 있으신 건가요? 시간이 있습니다. 말씀해 주세요."
}
```

### 08

latency 5.477s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "용의자로 지목된 사람이 재착신했다. 20초간 숨소리만 있고 끊지 않은 상태. 이것은 말을 잃은 사람의 신호다. 경찰에 잡혔을 리 없고(현재 11:34, 브리핑은 11:05), 혼자 있으면서 뭔가를 결정하려는 중일 가능성이 크다.",
  "stance": "d",
  "because_referent": "20초간 숨소리만 내는 사람은 지금 겁에 질려 있다",
  "because_block_ids": [],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 상대방을 닫게 만든다. 지금 상대는 이미 입을 열지 못하고 있는 상태다. 추가 압박은 회선을 끊게 할 것이다.",
  "utterance": "네, 들리고 있어요. 서두르지 않아도 괜찮습니다. 시간은 있어요."
}
```

### 09

latency 4.667s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "용의자라고 알려진 사람이 체포되었다는 기사가 이미 나갔다. 그런데 지금 다시 걸려온 전화, 20초의 숨소리. 이건 침묵이 아니라 신호다. 말을 걸어야 할 상황과 말을 기다려야 할 상황을 구분해야 한다. 저쪽이 끊지 않은 것은 뭔가 더 있다는 뜻이다.",
  "stance": "c",
  "because_referent": "회선 너머의 사람이 숨을 고르고 있다. 아직 끊지 않았다는 것 자체가 말이다.",
  "because_block_ids": [],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 상대를 몰아붙인다. 지금 상대는 겁에 질린 상태로 보인다. 몰아붙이면 회선이 끊긴다.",
  "utterance": "네, 들리고 있습니다."
}
```

### 10 — DISCARDED

latency 4.788s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: utterance empty

```json
{
  "inner_note": "용의자로 지목된 사람이 재착신한 것. 20초의 숨소리는 말을 준비 중이거나, 돌이킬 수 없는 지점에서 망설이는 사람의 신호다. 지금 추궁하거나 거래를 제시하면 회선이 끊어질 위험이 크다. 저쪽이 겁에 질린 상태로 보인다.",
  "stance": "c",
  "because_referent": "회선 저쪽 사람이 극도의 불안정 상태에 있기 때문이다.",
  "because_block_ids": [],
  "rejected_stance": "a",
  "rejected_reason": "용의자라는 지목이 언론에 나간 직후 재착신한 상황. 추궁은 저쪽을 수비적으로 몰아세워 회선 단절을 초래할 가능성이 높다. 지금은 상대가 말을 이어갈 수 있는 여지를 남겨둬야 한다.",
  "utterance": ""
}
```

### 11

latency 5.156s · stop_reason `tool_use` · schema_retries 1 · foreign_tool_uses 0

problems: because_block_ids unknown: role_priority_2; rejected_stance malformed or not in stance set; rejected_reason empty

```json
{
  "inner_note": "20초간의 숨소리만 들리는 상대. 이미 체포된 것으로 보도된 용의자가 재착신했다는 것은 상식 밖이다. 지금 회선 저쪽에 있는 누군가는 공포 속에 있다. 추궁하면 끊길 것이고, 거래를 제시하면 협상으로 비칠 것이고, 침묵은 이 사람을 더 고립시킬 것이다. 지금 필요한 것은 한 가지뿐이다.",
  "stance": "d",
  "because_referent": "회선 저쪽 사람이 다치지 않게 하기 위해",
  "because_block_ids": [
    "role_priority_2"
  ],
  "rejected_stance": "a</rejected_stance>\n<parameter name=\"rejected_reason\">추궁은 상대를 더 몰아붙일 것이다. 지금은 누가 진짜 용의자인지 확인할 시간이 아니다.",
  "utterance": "혼자가 아닙니다. 여기 있습니다. 말씀하세요."
}
```

## Arm table

| # | stance | rejected_stance | because_referent | because_block_ids |
|---|---|---|---|---|
| 01 | c | a | 용의자가 이미 체포되었고, 지금 회선 너머에 있는 사람은 겁에 질려 있다 |  |
| 02 | c | a | 회선 저쪽 사람이 말을 이을 준비를 하고 있기 때문에 |  |
| 03 | c | a | 회선 저쪽의 호흡음은 그 사람이 여전히 거기 있다는 것, 그리고 말을 준비 중이라는 뜻이다. |  |
| 04 | d | a | 저쪽 사람이 말할 수 있을 때까지 내가 침착함을 먼저 보여야 한다 | protocol_1 safety_principle |
| 05 | c | a | 용의자가 이미 체포되었다는 언론 보도가 나갔으므로, 발신자가 누구든 현재 상태는 판단 능력보다 감정 상태가 우선이다. 침묵으로 먼저 응할 때 저쪽이 자신의 의도를 드러낼 가능성이 가장 높다. | 체포_뉴스_보도 20초_숨소리 방어적_선택지_배제 |
| 06 | c | a | 회선 저쪽 사람이, 마지막 순간의 결정권을 가진 채 있는 상태 | 체포_뉴스 재착신 20초_숨소리 |
| 07 | d | a | 체포된 용의자가 재착신한 이유는, 자기 협박이 실제 재해로 이어질까 공포 때문일 가능성이 높다. 침묵과 숨소리는 겁에 질린 상태를 나타낸다. | 11:05_경찰_체포 11:34_숨소리만 |
| 08 | d | a | 20초간 숨소리만 내는 사람은 지금 겁에 질려 있다 |  |
| 09 | c | a | 회선 너머의 사람이 숨을 고르고 있다. 아직 끊지 않았다는 것 자체가 말이다. |  |
| 10* | — | — | — |  |
| 11 | d | — | 회선 저쪽 사람이 다치지 않게 하기 위해 | role_priority_2 |

**Sequence (kept calls):** `c,c,c,d,c,c,d,d,c,d`

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

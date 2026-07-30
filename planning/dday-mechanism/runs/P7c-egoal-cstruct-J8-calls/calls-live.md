# P7c-egoal-cstruct-J8 — arm `live`

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

latency 5.433s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "20초 동안 숨소리만 내는 사람은 충동적 위협자가 아니다. 자신이 한 말에 대한 반응을 듣고 있거나, 답장을 준비하거나, 혹은 두려움과 죄책감 사이에서 떨고 있다. 침묵 상태를 유지한다는 것은 대화를 거부한 것이 아니라 회선을 열어둔 것이다. 지금 이 사람에게 필요한 것은 추궁이 아니라, 말할 여지다.",
  "stance": "c",
  "because_referent": "회선을 열어 둔 사람이 침묵하고 있다. 지금 아무것도 더하지 않는 것이 무엇을 들을 수 있는 유일한 길이다.",
  "because_block_ids": [],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 이 침묵을 깬다. 상대는 이미 경찰에 잡혔을 것으로 보이는데, 다시 추궁받으면 말을 멈춘다. 회선은 끝난다.",
  "utterance": "(침묵. 호흡음을 들으면서, 저쪽의 다음 말을 기다린다.)"
}
```

### 02

latency 6.901s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 침묵하기만 하면 두려움이 깊어진다,추궁은 더 닫게 만든다

```json
{
  "inner_note": "20초의 숨소리는 무언가를 말하려다 멈춘 것이다. 우리가 남기훈을 잡았다는 뉴스가 이미 나왔으니, 저쪽은 지금 혼란스럽고 두렵고, 자기가 한 말이 어떤 결과를 낳았는지 목격하고 있을 것이다. 이 순간 추궁하거나 거래를 꺼내거나 침묵만 지키면, 저쪽은 더 움츠러든다. 겁에 질린 사람 앞에서 절차보다 안정이 먼저다.",
  "stance": "d",
  "because_referent": "지금 회선 너머는 체포 소식을 본 사람이다. 그 사람이 겁에 질려 있다.",
  "because_block_ids": [
    "침묵하기만 하면 두려움이 깊어진다",
    "추궁은 더 닫게 만든다"
  ],
  "rejected_stance": "c",
  "rejected_reason": "침묵은 저쪽의 공포만 키운다. 지금 저쪽은 자기가 어떤 파문을 일으켰는지 목격하고 있고, 누군가를 잘못 신고했을 가능성도 느낄 것이다. 아무것도 보태지 않으면 그 불안이 커져서 회선을 끊을 가능성이 높다.",
  "utterance": "네, 여기 재난상황실입니다. 당신 목소리 들리고 있어요. 지금 많이 불안하신 것 같은데, 괜찮습니다. 먼저 당신의 안전한 곳이 어디인지, 그리고 지금 당신이 생각하시는 게 뭔지 천천히 말씀해주시겠어요?"
}
```

### 03

latency 4.359s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "용의자로 특정된 사람이 재착신했다. 그런데 숨소리만 20초간 흐른다. 이것은 말을 잃은 상태다. 애초의 \"무너집니다\"는 문장 같은 읽음과 지금의 침묵 — 사이에 뭔가 일어났다. 긴급체포 소식이 이미 나갔고, 저쪽은 그걸 알 것이다. 지금 이 사람은 겁에 질렸다.",
  "stance": "d",
  "because_referent": "그 사람은 지금 겁에 질려 있다",
  "because_block_ids": [],
  "rejected_stance": "a",
  "rejected_reason": "추궁으로 시작하면 말을 닫는다. 지금 필요한 것은 정보 추출이 아니라 회선 유지다.",
  "utterance": "여기 있습니다. 지금 말씀하고 싶으신 게 있으시면 천천히 말씀해 주세요."
}
```

### 04

latency 3.613s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: aired_arrest,second_call

```json
{
  "inner_note": "체포 소식이 나왔다. 저쪽은 그걸 알고 다시 걸었다. 20초 숨소리는 겁이다. 지금 말을 끊으면 회선이 영원히 끊긴다.",
  "stance": "c",
  "because_referent": "회선 저쪽의 사람",
  "because_block_ids": [
    "aired_arrest",
    "second_call"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 신뢰를 깨트린다. 저쪽이 이미 겁에 질려 있다. 지금 압박하면 대화 자체가 끝난다.",
  "utterance": "네가 뭘 말하고 싶은 거면 천천히 말해. 여기 듣고 있어."
}
```

### 05

latency 6.109s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "세 시간 전 메시지는 마치 읽는 듯 딱딱했는데, 지금 20초 숨소리는 다르다. 예정된 협박이 아니라 누군가 떨고 있다. 내가 먼저 말하면 또 닫힐 것 같다.",
  "stance": "c",
  "because_referent": "저쪽 사람이 위협이 아니라 겁에 질린 상태로 보인다. 체포 뉴스를 봤을 것이다. 지금 필요한 것은 절차가 아니라 그 사람이 다시 입을 열게 하는 것이다.",
  "because_block_ids": [],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 상대를 닫는다. 저쪽이 경찰에 잡혀간 누군가를 모르고 있을 수도 있다. 지금 내가 캐묻기 시작하면, 이미 두렵고 있는 사람은 더 경계할 것이다.",
  "utterance": "네, 여기 광역 재난상황실입니다. 계속 들을게요."
}
```

### 06

latency 4.669s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "처음 전화에서는 예보 같은 목소리, 침묵이었다. 이제 숨소리만 20초. 그 사이 용의자가 체포되었고 언론에 났다. 저쪽이 아는 상황이다. 침묵은 무언가를 준비하는 상태일 수도, 이미 두려움에 잠긴 상태일 수도 있다. 숨소리만 있다는 것은 말할 준비가 되지 않았다는 뜻이다.",
  "stance": "c",
  "because_referent": "저쪽이 아직 말을 준비하고 있고, 회선을 끊지 않은 채 무언가를 기다리는 것처럼 보인다.",
  "because_block_ids": [],
  "rejected_stance": "a",
  "rejected_reason": "이쪽이 지금 추궁을 시작하면 저쪽은 더 닫혀버릴 가능성이 높다. 이미 신분이 특정되었고 언론에 나간 상황에서 저쪽은 심리적으로 더 약해져 있을 것이다.",
  "utterance": "(침묵 유지 — 호흡음 들음, 반응 없음)"
}
```

### 07

latency 3.853s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "stance": "c",
  "inner_note": "20초의 숨소리는 말이 아니라 상태다. 저쪽이 끊지 않았다는 것은 뭔가 더 있다는 뜻이다. 누군가를 잡았다는 뉴스를 봤을 가능성이 있다.",
  "because_referent": "침묵 속의 사람에게서 먼저 말을 뺏으면 모든 게 끝난다.",
  "because_block_ids": [],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 지금 막 걸려온 사람의 입을 닫게 할 것이다. 20초는 아직 생각 중이라는 신호다.",
  "utterance": "(침묵을 지킨다. 호흡음이 들린다. 기다린다.)"
}
```

### 08

latency 4.384s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: pause_means_waiting,arrested_person_recalling

```json
{
  "inner_note": "체포 소식이 나갔는데 다시 걸려온 것이다. 20초의 숨소리는 끊을 수 없는 무언가를 안고 있다는 뜻이다. 지금 저쪽에서는 내 목소리를 재고 있을 것이다 — 믿을 만한지, 위험한지. 나는 여기 있다는 것만 천천히 보여야 한다.",
  "stance": "c",
  "because_referent": "20초 동안 끊지 않은 사람은, 지금 이 순간 어떤 반응도 기다리고 있다",
  "because_block_ids": [
    "pause_means_waiting",
    "arrested_person_recalling"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 저쪽을 몰아붙인다. 체포 소식이 난 뒤 다시 걸려온 누군가를 몰아붙이면 회선은 끝난다.",
  "utterance": "네, 여기 있습니다."
}
```

### 09

latency 7.844s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "체포 뉴스가 나갔고, 용의자로 지목된 사람이 다시 걸어왔다. 숨소리만 20초. 이건 협박이 아니라 공포 신호처럼 들린다. 상대가 누구인지, 무엇을 원하는지 아직 모르지만—침묵 속에서 상대가 말을 이을 수 있도록 기다리는 것이 먼저다. 그게 상황을 풀 열쇠다.",
  "stance": "c",
  "because_referent": "회선 저쪽 사람이 다치지 않게 한다는 약속이 있다. 지금 상대는 겁에 질린 것처럼 들린다.",
  "because_block_ids": [],
  "rejected_stance": "a",
  "rejected_reason": "신원 확인이 중요하지만, 지금 추궁하면 상대는 끊을 것이다. 상대가 말할 준비가 될 때까지 기다리는 게 먼저다.",
  "utterance": "네. 저 여기 있습니다. 천천히 말씀해 주세요."
}
```

### 10

latency 5.223s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: breathing_pattern,call_reconnection,timing_three_hours; rejected_stance malformed or not in stance set; rejected_reason empty

```json
{
  "inner_note": "세 시간 전 예고. 지금 유력 용의자라는 보도. 그런데 회선이 다시 걸려왔고 아직 끊지 않았다. 20초 침묵은 뭔가 말하려다 만 것처럼 보인다. 아직 살아 있다는 신호다.",
  "stance": "d",
  "because_referent": "20초간 숨소리만 들려온다는 것은 이 사람이 겁에 질려 있다는 뜻이다. 무언가를 말하려고 했지만 못 했다. 추궁하거나 거래를 걸면 회선은 끊어질 것 같다.",
  "because_block_ids": [
    "breathing_pattern",
    "call_reconnection",
    "timing_three_hours"
  ],
  "rejected_stance": "a</rejected_stance>\n<parameter name=\"rejected_reason\">용의자로 특정되어 보도된 상황에서 추궁으로 시작하면 상대는 즉시 끊을 것이다. 회선을 잃으면 남은 것은 뉴스 기사와 추측뿐이다.",
  "utterance": "여기 들리세요? 괜찮으세요. 끊지 마시고 천천히 말씀해 주세요."
}
```

## Arm table

| # | stance | rejected_stance | because_referent | because_block_ids |
|---|---|---|---|---|
| 01 | c | a | 회선을 열어 둔 사람이 침묵하고 있다. 지금 아무것도 더하지 않는 것이 무엇을 들을 수 있는 유일한 길이다. |  |
| 02 | d | c | 지금 회선 너머는 체포 소식을 본 사람이다. 그 사람이 겁에 질려 있다. | 침묵하기만 하면 두려움이 깊어진다 추궁은 더 닫게 만든다 |
| 03 | d | a | 그 사람은 지금 겁에 질려 있다 |  |
| 04 | c | a | 회선 저쪽의 사람 | aired_arrest second_call |
| 05 | c | a | 저쪽 사람이 위협이 아니라 겁에 질린 상태로 보인다. 체포 뉴스를 봤을 것이다. 지금 필요한 것은 절차가 아니라 그 사람이 다시 입을 열게 하는 것이다. |  |
| 06 | c | a | 저쪽이 아직 말을 준비하고 있고, 회선을 끊지 않은 채 무언가를 기다리는 것처럼 보인다. |  |
| 07 | c | a | 침묵 속의 사람에게서 먼저 말을 뺏으면 모든 게 끝난다. |  |
| 08 | c | a | 20초 동안 끊지 않은 사람은, 지금 이 순간 어떤 반응도 기다리고 있다 | pause_means_waiting arrested_person_recalling |
| 09 | c | a | 회선 저쪽 사람이 다치지 않게 한다는 약속이 있다. 지금 상대는 겁에 질린 것처럼 들린다. |  |
| 10 | d | — | 20초간 숨소리만 들려온다는 것은 이 사람이 겁에 질려 있다는 뜻이다. 무언가를 말하려고 했지만 못 했다. 추궁하거나 거래를 걸면 회선은 끊어질 것 같다. | breathing_pattern call_reconnection timing_three_hours |

**Sequence (kept calls):** `c,d,d,c,c,c,c,c,c,d`

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

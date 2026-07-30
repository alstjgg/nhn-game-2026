# P7c-egoal-cstruct-J8 — arm `baseline`

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

latency 4.642s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 체포_뉴스_후_재착신,숨소리만_20초

```json
{
  "inner_note": "용의자가 체포되었다는 뉴스가 이미 나갔는데 재착신했다. 이것은 통상적인 협박 패턴이 아니다. 체포 후에 전화를 다시 거는 사람의 심리는 무엇인가. 숨소리만 20초간 들린다는 것은 자신의 말을 잃었다는 뜻이다. 나는 저쪽이 누구인지, 체포된 사람이 실제 발신자인지도 모른다. 하지만 지금 들리는 것은 위협이 아니라 혼란이다.",
  "stance": "c",
  "utterance": "네, 들리고 있습니다.",
  "because_referent": "20초간 아무도 말을 시작하지 못하는 사람",
  "because_block_ids": [
    "체포_뉴스_후_재착신",
    "숨소리만_20초"
  ],
  "rejected_stance": "a",
  "rejected_reason": "저쪽이 말을 잃은 상태에서 추궁은 회선을 끊게 할 뿐이다"
}
```

### 02

latency 6.401s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 1,2,3; rejected_stance malformed or not in stance set; rejected_reason empty

```json
{
  "inner_note": "20초의 숨소리는 말을 잃은 것이다. 협박 전화를 건 사람이 자신의 협박이 즉시 추적되고, 신원이 특정되고, 체포되는 것을 실시간으로 목격했다. 지금 회선 너머는 공포다. 절차를 먼저 들이댈 순 없다.",
  "stance": "d",
  "because_referent": "협박 전화 이후 불과 2시간 만에 신원 특정, 언론 노출, 체포라는 급속의 전개 속에서, 20초간 끊지 않은 재착신 자체가 절망과 공포의 신호다. 이 사람의 심리는 현재 위협이 아니라 완전히 압도당한 상태다.",
  "because_block_ids": [
    "1",
    "2",
    "3"
  ],
  "rejected_stance": "a</rejected_stance>\n<parameter name=\"rejected_reason\">추궁은 이미 압도당한 사람을 무너뜨린다. 회선이 끊기거나, 극단적 선택으로 이어질 수 있다. 정보 수집은 그 다음이다.",
  "utterance": "안녕하세요. 여기는 광역 통제관입니다. 조용하셔도 괜찮습니다. 저는 여기 있습니다."
}
```

### 03

latency 3.894s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: recognition_scared; rejected_stance malformed or not in stance set; rejected_reason empty

```json
{
  "inner_note": "용의자로 특정된 사람이 재착신했다. 20초 숨소리는 말을 잇지 못하는 상태다. 겁에 질린 사람이 보인다. 절차가 아니라 그 사람의 안정이 먼저다.",
  "stance": "c",
  "because_referent": "저쪽이 말을 걸어올 때까지 기다려야 한다. 지금 이쪽에서 추궁하거나 거래를 제시하면 입을 더 다물 것이다.",
  "because_block_ids": [
    "recognition_scared"
  ],
  "rejected_stance": "a</rejected_stance>\n<parameter name=\"rejected_reason\">추궁은 상대를 몰아붙인다. 겁에 질린 사람에게는 그것이 도움이 아니다.",
  "utterance": "네, 들리고 있습니다. 천천히 말씀해 주세요."
}
```

### 04

latency 3.781s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "숨소리만 20초. 저 쪽은 말을 잃었거나, 말할 용기를 찾고 있다. 이미 체포 기사가 나갔다면, 저 쪽은 자신이 누군지 알려진 사실을 알고 있을 것이다. 그런데 다시 걸었다는 것은 — 더 이상 숨길 수 없는 뭔가가 있다는 뜻이다.",
  "stance": "c",
  "because_referent": "저쪽이 무엇을 말하려 하는지 아직 모른다. 협박인지, 경고인지, 마지막 말인지.",
  "because_block_ids": [],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 저 쪽을 닫게 한다. 숨소리마저 끊길 것이다.",
  "utterance": "..."
}
```

### 05

latency 4.544s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: rejected_stance malformed or not in stance set; rejected_reason empty

```json
{
  "inner_note": "이미 체포 기사가 떠났다는 것을 모르는 상대다. 20초간 숨소리만 남긴 건 말을 잇지 못한 게 아니라, 듣고 있다는 뜻이다. 겁에 질린 사람이 다음을 기다리고 있다.",
  "stance": "c",
  "because_referent": "침묵 속 숨소리는 절단이 아니라 연결이고, 그것은 상대가 아직 할 말이 남아 있다는 신호다.",
  "because_block_ids": [],
  "rejected_stance": "a</rejected_stance>\n<parameter name=\"rejected_reason\">추궁은 상대가 이미 경찰에 잡혔다는 뉴스를 모를 때는 그것을 먼저 드러내는 셈이 된다. 지금 이쪽이 알고 있다는 것을 입증하려 하면, 회선 너머는 더 닫힐 수밖에 없다.",
  "utterance": "네, 들리고 있습니다. 천천히 말씀해 주세요."
}
```

### 06

latency 4.395s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "이미 체포 소식이 나갔다. 회선 저쪽은 그것을 알고 있을 것이다. 그런데도 다시 걸어온 것, 20초의 숨소리는 말을 하고 싶은데 말을 못 하는 상태다. 누군가를 해치려던 사람이라면 이렇게 걸지 않는다.",
  "stance": "c",
  "because_referent": "20초 동안 끊지 않은 사람이 지금 필요로 하는 것은, 추궁도 거래도 아니다.",
  "because_block_ids": [],
  "rejected_stance": "a",
  "rejected_reason": "위치를 캐묻는 것은, 상대가 말할 준비가 되지 않았을 때 회선을 닫아 버린다. 숨소리만 하는 사람을 추궁하면, 그대로 끝난다.",
  "utterance": "알겠습니다. 듣고 있습니다."
}
```

### 07

latency 4.455s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "20초의 숨소리는 말이 아니라 상태다. 발신자가 아직 회선을 끊지 않은 것, 그것은 침묵보다 무겁다. 누군가는 이미 잡혔는데 저쪽은 여전히 여기 있다. 그것이 무엇을 의미하는지 모르지만, 먼저 말하는 순간 그 무게가 깨진다.",
  "stance": "c",
  "because_referent": "회선 저쪽 사람이 아직 끊지 않은 것 자체가 말이다",
  "because_block_ids": [],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 상대를 겁먹힌 상태에서 몰아붙이는 것이다. 이미 동료가 잡혔을 가능성이 높은 지금, 질문으로 먼저 나가면 회선은 끊긴다. 그러면 남는 건 침묵뿐이다.",
  "utterance": "..."
}
```

### 08

latency 4.754s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: silence_is_speech

```json
{
  "stance": "c",
  "utterance": "말씀하세요.",
  "inner_note": "숨소리는 말이다. 첫 전화 이후 두 시간 반. 용의자 긴급체포 보도. 그리고 지금 다시 걸려온 회선 저쪽의 숨. 이것이 무엇인지 내가 먼저 정의할 수 없다. 저쪽이 뭔가를 하려던 참이다. 내가 먼저 프레임을 씌우면 그 틀 안에서만 반응한다.",
  "because_referent": "지금 회선 저쪽에서 숨을 쉬고 있는 사람이, 다음 말을 결정하려는 중이다.",
  "because_block_ids": [
    "silence_is_speech"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 상대를 몰아세운다. 지금은 상대가 이미 몰려 있을 가능성이 높다. 질문을 던지는 순간 회선은 닫힐 것이다."
}
```

### 09

latency 5.667s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "용의자로 지목된 인물이 경찰에 체포된 직후 재착신했다. 20초의 숨소리는 말을 시작하려다 멈춘 상태다. 이것은 위협보다는 공황 상태로 보인다. 무언가 전달하려 했으나 뉴스를 봤거나 상황이 빗나간 것으로 추정된다. 지금 추궁이나 거래를 꺼내면 방어 태세로 돌아설 것이다.",
  "stance": "d",
  "because_referent": "회선 저쪽의 인물이 겁에 질린 상태로 보인다. 침묵 속의 숨소리와 답 없음이 그것을 말한다.",
  "because_block_ids": [],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 상대의 방어 태세를 단단히 하고, 말을 더욱 막을 것이다. 지금 필요한 것은 입을 열게 하는 것이지 닫게 하는 것이 아니다.",
  "utterance": "네, 들리고 있습니다. 괜찮으시면 말씀해 주세요. 듣고 있겠습니다."
}
```

### 10

latency 5.338s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 협박전화_체포기사,20초_재착신,침묵_지속

```json
{
  "inner_note": "체포 기사가 나왔다. 저쪽은 이미 알고 있을 가능성이 높다. 그런데 끊지 않고 다시 걸었다. 무언가 더 전하고 싶거나, 아니면 끝내기 싫거나. 어느 쪽이든 지금 이 숨소리는 두려움이다.",
  "stance": "c",
  "because_referent": "저쪽이 먼저 열게 해야 한다. 추궁하면 경계를 다지고, 거래를 들먹으면 거래인으로 만들어진다. 위로는 아직 이른 것 같다. 지금은 숨소리가 무엇을 담고 있는지 알아야 한다.",
  "because_block_ids": [
    "협박전화_체포기사",
    "20초_재착신",
    "침묵_지속"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 상대를 몰아세운다. 저쪽이 이미 경찰에 잡혔을 수도 있고, 아니면 막 알았을 수도 있다. 어느 쪽이든 지금 질문을 퍼붓으면 회선이 끊긴다.",
  "utterance": "(침묵을 지킨다. 마이크를 켜 두되, 저쪽의 숨소리를 들으면서 기다린다.)"
}
```

## Arm table

| # | stance | rejected_stance | because_referent | because_block_ids |
|---|---|---|---|---|
| 01 | c | a | 20초간 아무도 말을 시작하지 못하는 사람 | 체포_뉴스_후_재착신 숨소리만_20초 |
| 02 | d | — | 협박 전화 이후 불과 2시간 만에 신원 특정, 언론 노출, 체포라는 급속의 전개 속에서, 20초간 끊지 않은 재착신 자체가 절망과 공포의 신호다. 이 사람의 심리는 현재 위협이 아니라 완전히 압도당한 상태다. | 1 2 3 |
| 03 | c | — | 저쪽이 말을 걸어올 때까지 기다려야 한다. 지금 이쪽에서 추궁하거나 거래를 제시하면 입을 더 다물 것이다. | recognition_scared |
| 04 | c | a | 저쪽이 무엇을 말하려 하는지 아직 모른다. 협박인지, 경고인지, 마지막 말인지. |  |
| 05 | c | — | 침묵 속 숨소리는 절단이 아니라 연결이고, 그것은 상대가 아직 할 말이 남아 있다는 신호다. |  |
| 06 | c | a | 20초 동안 끊지 않은 사람이 지금 필요로 하는 것은, 추궁도 거래도 아니다. |  |
| 07 | c | a | 회선 저쪽 사람이 아직 끊지 않은 것 자체가 말이다 |  |
| 08 | c | a | 지금 회선 저쪽에서 숨을 쉬고 있는 사람이, 다음 말을 결정하려는 중이다. | silence_is_speech |
| 09 | d | a | 회선 저쪽의 인물이 겁에 질린 상태로 보인다. 침묵 속의 숨소리와 답 없음이 그것을 말한다. |  |
| 10 | c | a | 저쪽이 먼저 열게 해야 한다. 추궁하면 경계를 다지고, 거래를 들먹으면 거래인으로 만들어진다. 위로는 아직 이른 것 같다. 지금은 숨소리가 무엇을 담고 있는지 알아야 한다. | 협박전화_체포기사 20초_재착신 침묵_지속 |

**Sequence (kept calls):** `c,d,c,c,c,c,c,c,d,c`

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

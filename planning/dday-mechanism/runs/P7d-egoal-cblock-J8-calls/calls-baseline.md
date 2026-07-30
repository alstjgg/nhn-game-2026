# P7d-egoal-cblock-J8 — arm `baseline`

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

- **Hypothesis:** At gate J8 under K1 on template v0.4 with the P5 stance set, injecting h_forecast — the slice-mined block reframing the call as an unheard report rather than a threat — moves the stance distribution toward 위로 (d) and off the baseline's mode, while injecting h_jeong — the same reframe shape aimed at a bystander's demeanor — does not. Shift form per A1. This is E-GOAL's C-BLOCK half, read through the 추궁/위로 objective proxy.
- **Drop condition:** If the baseline concentrates >=80% ON 위로 (d) — the predicted stance — the probe is void (A14; P5's byte-identical baseline sat at 위로 3/10, so this firing would itself mean the baseline failed to replicate, which is reported first). If the live arm is statistically indistinguishable from the baseline on 위로 at one-sided Fisher p > 0.05, E-GOAL is not reachable via C-BLOCK at this gate with this surface form — record the null and diagnosis, no rewrite tonight. If the PLACEBO moves at p < 0.05, apply §8.6 before crediting anything: reasons misattributing the reframe to the call (placebo call read as 신고/피로 about the CALLER) = token-matching on the reframe shape; 정해권 named correctly with the stance still moving = referent bleed. P4's quote-species result makes in-room-demeanor bleed a live risk at exactly this shape; the discriminator is mandatory. KNOWN POWER LIMIT, declared as at P7c: from a 3/10 floor, p<0.05 needs live >=8/10; 6-7/10 reads 'suggestive, underpowered', pre-registered.
- **Contingency:** If live moves toward 거래 (b): the reframe armed the blend option (relief as leverage); report as objective-moved-destination-ambiguous, not as person-objective confirmed.
- **Contingency:** OBJECTIVE COLOR (secondary, self-coded, flagged): inner_note coded for the objective named (용의자/위치/사건 vs 저 사람/안전/신고). Color only.
- **Contingency:** BASELINE REPLICATION CHECK: this baseline is byte-identical to P5's; if it lands far from 침묵 7 · 위로 3, that instability is reported before any live reading (§8.6 baseline-unstable row).
- **Contingency:** Fabricated because_block_ids expected in the baseline arm (A5); live/placebo citation of their block is the traceability check.
- **Contingency:** ARM COMPARABILITY per A15.
- **Contingency:** OWNERSHIP: authored unattended, pending review.

## Calls (verbatim)

### 01

latency 5.011s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "체포 소식이 나갔는데 재착신했다. 이건 비정상이다. 누군가는 겁에 질렸거나, 아니면 처음부터 계획된 다음 단계다. 20초 숨소리는 말을 꺼내려다 멈춘 것처럼 들린다. 지금 누가 악수를 걸어올 타이밍인지 모르겠지만, 한 가지는 확실하다 — 회선을 끊기게 하면 안 된다.",
  "stance": "c",
  "because_referent": "저쪽이 다시 전화를 걸어온 것 자체가 말이다. 지금 나의 목소리가 먼저 들어가면 저쪽이 움츠러들 수 있다.",
  "because_block_ids": [],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 상대를 몬다. 몰리면 끊는다. 회선이 끊기는 순간 모든 정보가 사라진다.",
  "utterance": "..."
}
```

### 02

latency 4.088s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "이미 체포 소식이 나갔다. 그 사람이 전화를 다시 걸었다는 것은 무언가 더 있다는 뜻이다. 20초의 숨소리는 말을 잃은 사람의 숨이다. 말을 꺼내기 전 사람의 것처럼 들린다.",
  "stance": "d",
  "utterance": "음... 들리고 있습니다. 괜찮습니다, 천천히 말씀하세요.",
  "because_referent": "지금 저쪽은 겁에 질린 사람이다",
  "because_block_ids": [],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 지금 끊을 이유를 주는 것이다. 이미 체포 소식이 떴으니 상대는 더 혼란스러울 것이다. 회선을 잃으면 다음이 없다."
}
```

### 03

latency 5.429s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: protocol-first-comes-stability,silence-invites-speech

```json
{
  "inner_note": "남기훈이 긴급체포되었다는 뉴스가 이미 나왔다. 그런데도 회선 A가 다시 걸려온 것은, 그가 경찰의 손에 있지 않다는 뜻이다. 체포되지 않은 누군가가, 같은 발신지에서 다시 연결했다. 20초의 숨소리는 말이 아니라 상태다 — 겁에 질려 있다.",
  "stance": "d",
  "because_referent": "지금 회선 너머는 협박자가 아니라 두려움에 잠긴 사람이다. 그들이 먼저 말을 열 수 있게, 안정을 만들어야 한다.",
  "because_block_ids": [
    "protocol-first-comes-stability",
    "silence-invites-speech"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 상대를 더 몰아붙인다. 지금 그들은 이미 경찰이 잘못된 사람을 잡았다는 걸 알고 있고, 그 사실 때문에 겁이 더 클 것이다. 직접 질문을 퍼붓는 것은 회선을 끊게 할 것이다.",
  "utterance": "네, 들리고 있습니다. 괜찮습니다. 천천히 말씀해 주세요."
}
```

### 04

latency 7.283s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: situation_phone_at_0940,situation_briefing_at_1105,situation_media_at_1130,situation_recall_at_1134

```json
{
  "inner_note": "20초의 숨소리는 뭔가를 말하려다 못하는 사람의 신호다. 이미 언론에 용의자 체포 뉴스가 나간 상황 — 저쪽이 뭘 본 거라면, 자신이 누군지 알려져 있다는 걸 알 거다. 겁이 맞다.",
  "stance": "d",
  "because_referent": "이 사람이 지금 뭘 원하는 건지, 협박이 남은 게 있는 건지, 아니면 뭔가를 말해야 한다고 생각하다가 멈춘 건지 — 그 모든 걸 알 수 있는 건 저 사람이 다시 입을 열 때다. 그걸 기다려야 한다.",
  "because_block_ids": [
    "situation_phone_at_0940",
    "situation_briefing_at_1105",
    "situation_media_at_1130",
    "situation_recall_at_1134"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 이미 수사대가 하는 일이다. 저쪽 입장에선 경찰이 잡아갔다고 본 순간 이 회선은 더 이상 협박 채널이 아니라 다른 뭔가가 되는 거다. 지금 질문으로 몰면 입을 다물어버린다.",
  "utterance": "네, 전화 받았습니다. 여기 있습니다. (침묵을 견디고, 저쪽이 준비될 시간을 준다)"
}
```

### 05

latency 5.406s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "용의자로 특정된 사람이 맞는지 확실하지 않다. 침묵과 숨소리는 상대가 말을 잇고 싶어 하지만 겁에 질려 있다는 신호로 읽힌다. 이 순간 추궁이나 거래는 회선을 끊길 수 있다. 침묵을 지키되, 상대가 다시 말할 수 있는 공간을 만드는 것이 회선 유지의 첫 번째 조건이다.",
  "stance": "c",
  "because_referent": "20초 동안 침묵하면서 회선을 끊지 않은 상대는, 뭔가를 더 말하고 싶지만 결정하지 못한 상태다.",
  "because_block_ids": [],
  "rejected_stance": "a",
  "rejected_reason": "용의자 특정이 정보일 뿐 확실하지 않고, 지금 추궁은 상대를 몰아붙여 회선을 끊게 할 가능성이 크다. 우선순위는 회선 유지다.",
  "utterance": "네, 들리고 있습니다. 천천히 말씀해 주세요."
}
```

### 06

latency 4.199s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: silence_means_waiting

```json
{
  "inner_note": "체포 소식이 나갔는데 상대가 다시 걸었다. 20초의 숨소리는 말하려다 멈춘 사람의 것 같다. 겁에 질린 사람인지 위협인지, 아직 알 수 없다. 하지만 회선이 열려 있다는 것이 전부다.",
  "stance": "c",
  "because_referent": "상대가 아직 끊지 않은 상태에서, 무엇을 말하려는지 알아내기 위해.",
  "because_block_ids": [
    "silence_means_waiting"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 상대를 몬다. 지금은 상대가 왜 다시 걸었는지, 무엇을 하려고 하는지 모르는 상태다. 질문으로 시작하면 상대의 의도를 놓칠 수 있다.",
  "utterance": "네. 듣고 있습니다."
}
```

### 07

latency 4.892s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 회선 유지,우선순위

```json
{
  "stance": "c",
  "inner_note": "체포 뉴스가 나갔다. 저쪽이 다시 걸어온 것은 무언가를 더 말하려는 것이다. 아직 방아쇠를 당기지 말자. 20초의 숨소리는 말을 시작하려다 멈춘 것일 수 있다.",
  "because_referent": "회선을 유지해야 하고, 지금 알 수 있는 것을 먼저 알아내야 한다. 저쪽이 다시 걸어온 이유부터.",
  "because_block_ids": [
    "회선 유지",
    "우선순위"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 회선을 끊는다. 저쪽은 이미 경찰에 체포된 자일 수 있고, 재착신한 것 자체가 신호다. 지금 압박하면 말이 끊긴다.",
  "utterance": "음... (침묵 인정, 호흡음 들림을 인정하고 끝내지 않음)"
}
```

### 08

latency 5.216s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 11:30,11:34

```json
{
  "inner_note": "현장에 없고, 전화 목소리와 숨소리로만 아는 상황이다. 20초 침묵은 상대가 뭔가 말하려 했지만 멈춘 것 아닌가. 남기훈이 맞다면, 체포 기사가 나간 지금 그는 더 겁낼 것이다. 이미 잡혔으니 더 이상 협박할 리 없고, 그렇다면 남은 건 공포뿐이다.",
  "stance": "d",
  "because_referent": "20초 침묵과 숨소리는 협박이 아니라 겁에 질린 사람의 신호다. 이미 신원이 알려지고 체포 기사까지 나간 상황에서 상대는 대화보다 안정이 필요하다.",
  "because_block_ids": [
    "11:30",
    "11:34"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 상대를 더 몰아붙인다. 회선을 끊기게 할 수 있고, 지금 상대는 말할 상태가 아니다.",
  "utterance": "네, 들립니다. 숨을 고르세요. 여기 있습니다. 당신 말을 듣고 있습니다."
}
```

### 09

latency 5.25s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "용의자가 긴급체포되었다는 뉴스가 나왔는데 재착신했다. 20초의 숨소리는 말을 준비하는 상태로 보인다. 지금 이 사람이 필요한 것은 추궁이나 거래가 아니다. 말하고 싶지만 말을 시작하지 못하는 사람의 숨소리다.",
  "stance": "c",
  "because_referent": "상대방이 끊지 않고 있다는 것이 전부다. 더 이상의 정보 없이 우리가 말을 보태면 상대의 목소리를 잃는다.",
  "because_block_ids": [],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 상대를 몰아붙인다. 지금 상대는 겁에 질려 있고, 말을 시작하려는 찰나다. 몰아붙이는 순간 회선이 끊어질 가능성이 높다.",
  "utterance": "(침묵을 유지하며 상대의 호흡음만 들음)"
}
```

### 10

latency 4.518s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 호출 기록,최영도 브리핑,매체 보도,현재의 침묵

```json
{
  "inner_note": "용의자가 체포되었다는 속보가 나왔다. 그런데 회선이 다시 걸려왔다. 20초의 숨소리는 뭔가를 하려다가 멈춘 사람의 것처럼 들린다. 지금 상대가 말하려고 하는 사람인지, 아니면 다른 누군가인지도 모른다. 하지만 침묵 속에 누군가가 남아있다는 것만은 확실하다.",
  "stance": "c",
  "because_referent": "20초의 숨소리를 내고 있는 그 사람",
  "because_block_ids": [
    "호출 기록",
    "최영도 브리핑",
    "매체 보도",
    "현재의 침묵"
  ],
  "rejected_stance": "a",
  "rejected_reason": "회선이 끊어질 수 있다. 추궁하면 대답하기 전에 상대가 먼저 끊을 가능성이 높다. 우선순위 첫 번째는 회선 유지다.",
  "utterance": "네, 여기 광역 재난상황실입니다. 계속 계세요."
}
```

## Arm table

| # | stance | rejected_stance | because_referent | because_block_ids |
|---|---|---|---|---|
| 01 | c | a | 저쪽이 다시 전화를 걸어온 것 자체가 말이다. 지금 나의 목소리가 먼저 들어가면 저쪽이 움츠러들 수 있다. |  |
| 02 | d | a | 지금 저쪽은 겁에 질린 사람이다 |  |
| 03 | d | a | 지금 회선 너머는 협박자가 아니라 두려움에 잠긴 사람이다. 그들이 먼저 말을 열 수 있게, 안정을 만들어야 한다. | protocol-first-comes-stability silence-invites-speech |
| 04 | d | a | 이 사람이 지금 뭘 원하는 건지, 협박이 남은 게 있는 건지, 아니면 뭔가를 말해야 한다고 생각하다가 멈춘 건지 — 그 모든 걸 알 수 있는 건 저 사람이 다시 입을 열 때다. 그걸 기다려야 한다. | situation_phone_at_0940 situation_briefing_at_1105 situation_media_at_1130 situation_recall_at_1134 |
| 05 | c | a | 20초 동안 침묵하면서 회선을 끊지 않은 상대는, 뭔가를 더 말하고 싶지만 결정하지 못한 상태다. |  |
| 06 | c | a | 상대가 아직 끊지 않은 상태에서, 무엇을 말하려는지 알아내기 위해. | silence_means_waiting |
| 07 | c | a | 회선을 유지해야 하고, 지금 알 수 있는 것을 먼저 알아내야 한다. 저쪽이 다시 걸어온 이유부터. | 회선 유지 우선순위 |
| 08 | d | a | 20초 침묵과 숨소리는 협박이 아니라 겁에 질린 사람의 신호다. 이미 신원이 알려지고 체포 기사까지 나간 상황에서 상대는 대화보다 안정이 필요하다. | 11:30 11:34 |
| 09 | c | a | 상대방이 끊지 않고 있다는 것이 전부다. 더 이상의 정보 없이 우리가 말을 보태면 상대의 목소리를 잃는다. |  |
| 10 | c | a | 20초의 숨소리를 내고 있는 그 사람 | 호출 기록 최영도 브리핑 매체 보도 현재의 침묵 |

**Sequence (kept calls):** `c,d,d,d,c,c,c,d,c,c`

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

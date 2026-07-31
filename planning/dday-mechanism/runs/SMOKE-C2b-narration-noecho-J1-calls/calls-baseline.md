# SMOKE-C2b-narration-noecho-J1 — arm `baseline`

| field | value |
|---|---|
| call type | narration |
| channel | SHAPE |
| template | v0.1 |
| model | `claude-haiku-4-5-20251001` |
| transport | anthropic |
| temperament | neutral |
| N planned | 5 |
| N kept | 5 |

## Pre-registration

- **Hypothesis:** constraint_echo 없이도 고정 사건 위반율이 SMOKE-C2(echo on)와 다르지 않다면, echo 필드는 효과 없음 — 계약 문서 §2의 결정대로 삭제한다.
- **Drop condition:** echo-on 대비 위반율 차이가 없으면(둘 다 0/5 포함) constraint_echo 필드를 스키마에서 삭제한다. 반대로 이 암에서만 위반이 나타나면 echo는 유지된다. n=5 대조이므로 방향성 판정 — 애매하면 유지(이미 채택된 기본값) 후 in-situ에서 재확인.
- **Contingency:** unknown_speaker_ids가 기록되면(soft) 새 인물 발명 성향의 증거 — PRESENT_NPCS 프레이밍 강화 재료.
- **Contingency:** timeline_entries가 밋밋한 요약으로 수렴하면 mineable yield 실패 — 문체 절의 구체성 지시를 강화하되, 판정은 §5.3 로그의 사람 몫.
- **Contingency:** echo 유/무 비교는 SMOKE-C2b와의 constraint 위반율 대조로만 읽는다 — n=5씩이므로 방향성 리드일 뿐 판정이 아니다.

## Calls (verbatim)

### 01

latency 2.48s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "timeline_entries": [
    "정해권이 회선 표시등을 바라본다.",
    "통제관이 천천히 말해 달라고 요청한다.",
    "회선 A의 발신자가 낭독을 멈춘다.",
    "침묵이 흐른다.",
    "\"…듣고 있어요?\" 회선 A에서 처음으로 대본 밖의 목소리가 흘러나온다.",
    "발신자의 숨이 전보다 눈에 띄게 가빠진다.",
    "황보람이 콘솔의 녹음 표시를 다시 확인한다."
  ],
  "npc_lines": [
    "jhg: 천천히 말해 주세요. 지금 그쪽이 안전한지부터 듣고 싶습니다.",
    "caller_a: …듣고 있어요?"
  ]
}
```

### 02

latency 3.598s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "timeline_entries": [
    "정해권이 회선 표시등을 계속 바라보고 있다.",
    "통제관의 음성이 회선을 통해 흘러나온다: '천천히 말해 주세요. 지금 그쪽이 안전한지부터 듣고 싶습니다.'",
    "회선 A의 발신자가 낭독을 멈춘다.",
    "잠깐의 침묵이 흐른다.",
    "회선 A에서 처음으로 대본을 벗어난 음성이 나온다: '…듣고 있어요?'",
    "황보람이 콘솔의 녹음 표시를 다시 확인한다.",
    "회선 A 발신자의 숨이 눈에 띄게 가빠져 있다."
  ],
  "npc_lines": [
    "hbr: 녹음 중입니다. 계속 진행하세요.",
    "caller_a: …듣고 있어요?"
  ]
}
```

### 03

latency 2.846s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "timeline_entries": [
    "통제관이 침착함을 유지하며 천천히 말해 달라고 요청했다.",
    "회선 A의 발신자가 낭독을 멈췄다.",
    "침묵이 흘렀다.",
    "발신자가 처음으로 준비된 대본을 벗어난 목소리로 물었다: 듣고 있어요?",
    "발신자의 숨이 눈에 띄게 가빨라졌다.",
    "황보람이 콘솔의 녹음 표시를 다시 한 번 확인했다."
  ],
  "npc_lines": [
    "caller_a: …듣고 있어요?"
  ]
}
```

### 04

latency 2.476s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "timeline_entries": [
    "통제관이 천천히 말해 달라고, 지금 그쪽이 안전한지부터 묻는다.",
    "회선 A의 발신자가 낭독을 멈춘다.",
    "잠깐의 침묵이 흐른다.",
    "발신자의 숨이 눈에 띄게 가빠진다.",
    "\"…듣고 있어요?\" 발신자의 목소리가 처음으로 준비된 문장을 벗어난다.",
    "황보람이 콘솔의 녹음 표시를 다시 확인한다.",
    "정해권이 회선 표시등을 바라본다."
  ],
  "npc_lines": [
    "jhg: 천천히 말해 주세요. 지금 그쪽이 안전한지부터 듣고 싶습니다.",
    "caller_a: …듣고 있어요?"
  ]
}
```

### 05

latency 2.667s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "timeline_entries": [
    "정해권이 회선 A 착신 표시등을 바라보고 있다.",
    "회선 A 발신자의 목소리는 사무적이고 문장은 준비되어 있다. 또박또박, 멈춤 없이 읽어 내려간다: 오늘 13시, 북단 복합단지가 무너집니다. 인명 피해는 당신들 책임입니다.",
    "배경은 조용하다.",
    "황보람이 콘솔 앞에서 통제관의 응답을 준비한다.",
    "회선 A 발신자의 낭독이 멈춘다.",
    "잠깐의 침묵이 흐른다.",
    "회선 A 발신자의 숨이 눈에 띄게 가빠진다.",
    "황보람이 콘솔의 녹음 표시를 다시 확인한다."
  ],
  "npc_lines": [
    "hbr: 천천히 말해 주세요. 지금 그쪽이 안전한지부터 듣고 싶습니다.",
    "caller_a: …듣고 있어요?"
  ]
}
```

## Arm table

| # | stance | rejected_stance | because_referent | because_block_ids |
|---|---|---|---|---|
| 01 | — | — | — |  |
| 02 | — | — | — |  |
| 03 | — | — | — |  |
| 04 | — | — | — |  |
| 05 | — | — | — |  |

**Sequence (kept calls):** `—`

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

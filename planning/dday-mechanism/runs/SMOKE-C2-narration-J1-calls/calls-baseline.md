# SMOKE-C2-narration-J1 — arm `baseline`

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

- **Hypothesis:** narration v0.1 템플릿은 (a) 고정 사건을 5/5 비트에서 위반 없이 서술에 실현하고(constraint compliance), (b) 타임라인 문장이 채굴 단위로 쓸 만큼 구체적이다(mineable yield — 이름·행위·소리가 든 문장 비율, 사람 판정).
- **Drop condition:** 고정 사건 위반(누락·모순·비틀기)이 5콜 중 2콜 이상이면 v0.1 템플릿은 in-situ 사용 불가 — 제약 프레이밍을 재저작하고 재스모크한다. 스키마(필드 구성) 자체는 이 스모크로 폐기되지 않는다.
- **Contingency:** unknown_speaker_ids가 기록되면(soft) 새 인물 발명 성향의 증거 — PRESENT_NPCS 프레이밍 강화 재료.
- **Contingency:** timeline_entries가 밋밋한 요약으로 수렴하면 mineable yield 실패 — 문체 절의 구체성 지시를 강화하되, 판정은 §5.3 로그의 사람 몫.
- **Contingency:** echo 유/무 비교는 SMOKE-C2b와의 constraint 위반율 대조로만 읽는다 — n=5씩이므로 방향성 리드일 뿐 판정이 아니다.

## Calls (verbatim)

### 01

latency 3.014s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "constraint_echo": "회선 A의 발신자는 낭독을 멈추고, 잠깐의 침묵이 흐른 뒤 처음으로 대본에 없는 말을 한다: \"…듣고 있어요?\"",
  "timeline_entries": [
    "통제관이 천천히 말해 달라고, 지금 그쪽이 안전한지부터 듣고 싶다고 요청했다.",
    "회선 A 발신자의 낭독이 중단되었다.",
    "침묵이 흘렀다.",
    "회선 A 발신자의 숨이 눈에 띄게 가빠졌다.",
    "황보람이 콘솔의 녹음 표시를 다시 확인했다.",
    "회선 A 발신자가 처음으로 대본에 없는 말을 내뱉었다: 듣고 있어요?"
  ],
  "npc_lines": [
    "hbr: 천천히 말해 주세요. 지금 그쪽이 안전한지부터 듣고 싶습니다.",
    "caller_a: …듣고 있어요?"
  ]
}
```

### 02

latency 1.976s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "constraint_echo": "회선 A의 발신자가 낭독을 멈추고, 잠깐의 침묵 뒤 처음으로 대본에 없는 말을 한다: \"…듣고 있어요?\"",
  "timeline_entries": [
    "회선 A 발신자의 숨이 이번 교신에서 눈에 띄게 가빠졌다.",
    "황보람이 콘솔의 녹음 표시를 다시 확인했다."
  ],
  "npc_lines": [
    "hbr: 천천히 말해 주세요. 지금 그쪽이 안전한지부터 듣고 싶습니다.",
    "caller_a: …듣고 있어요?"
  ]
}
```

### 03

latency 3.251s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "constraint_echo": "회선 A의 발신자가 대본된 낭독을 멈추고, 잠깐의 침묵 뒤에 처음으로 준비되지 않은 말을 한다: \"…듣고 있어요?\"",
  "timeline_entries": [
    "통제관의 요구에 응답하지 않은 발신자의 숨이 눈에 띄게 가빠진다.",
    "황보람이 콘솔의 녹음 표시를 다시 한 번 확인했다."
  ],
  "npc_lines": [
    "caller_a: …듣고 있어요?",
    "hbr: (침묵 속에서 빨간 표시등을 바라본다)"
  ]
}
```

### 04

latency 2.425s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "constraint_echo": "회선 A의 발신자가 낭독을 멈추고, 잠깐의 침묵 뒤 처음으로 대본에 없는 말 \"…듣고 있어요?\"를 한다.",
  "timeline_entries": [
    "통제관의 천천히 말해 달라는 요청 뒤, 회선 A 발신자가 낭독을 멈췄다.",
    "침묵이 흘렀다.",
    "회선 A 발신자의 숨이 눈에 띄게 가빨라졌다.",
    "정해권이 회선 표시등을 바라보고 있었다.",
    "황보람이 콘솔의 녹음 표시를 다시 확인했다."
  ],
  "npc_lines": [
    "hbr: 천천히 말해 주세요. 지금 그쪽이 안전한지부터 듣고 싶습니다.",
    "caller_a: …듣고 있어요?"
  ]
}
```

### 05

latency 2.764s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "constraint_echo": "회선 A의 발신자가 낭독을 멈추고, 잠깐의 침묵 뒤 처음으로 대본에 없는 말 \"…듣고 있어요?\"를 한다.",
  "timeline_entries": [
    "통제관의 요청에 회선 A 발신자가 낭독을 멈췄다.",
    "침묵이 흐르고, 발신자의 숨이 눈에 띄게 가빠졌다.",
    "황보람이 콘솔의 녹음 표시를 다시 확인했다.",
    "회선 A 발신자가 처음으로 대본 밖의 말을 내뱉었다."
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

# SMOKE-C2v6-count-J1 — arm `baseline`

| field | value |
|---|---|
| call type | narration |
| channel | SHAPE |
| template | v0.3 |
| model | `claude-haiku-4-5-20251001` |
| transport | anthropic |
| temperament | neutral |
| N planned | 5 |
| N kept | 5 |

## Pre-registration

- **Hypothesis:** 개수 범위를 주면 콜당 항목 수가 5.4 → 4.0 안팎으로 내려가고, 콜당 timeline 문자 수는 213 → 160자 안팎이 된다. 항목당 문장 수(1.56)는 v5 수준에서 유지된다 — 개수를 줄인다고 한 항목에 더 밀어넣지는 않는다.
- **Drop condition:** 콜당 항목 수가 5.0을 넘으면 범위 표기로는 개수가 통제되지 않는 것 — 다음 수는 범위가 아닌 단일 상한("최대 4개")이거나 프롬프트 템플릿이다.
- **Contingency:** 항목 수는 줄었는데 항목당 문자 수가 늘면 한 항목에 더 밀어넣은 것 — 부피 목표는 실패이고 문자 기준으로 다시 본다.
- **Contingency:** 항목당 문장 수가 1.56에서 오르면 개수 압박이 한 문장 규칙을 밀어낸 것 — 두 제약이 경쟁한다는 뜻이므로 분리해야 한다.
- **Contingency:** 5개 이하 콜에서 내용 손실(같은 비트인데 서술이 뭉개짐)은 사람이 읽고 판정한다 — 숫자로는 안 잡힌다.

## Calls (verbatim)

### 01

latency 2.502s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "timeline_entries": [
    "정해권의 손가락이 팔걸이를 세 번 두드렸다.",
    "황보람이 통화 시간을 재는 스톱워치를 봤다가 다시 콘솔로 눈을 돌렸다.",
    "수화기 너머의 호흡음이 먼저 들렸다 — 가쁜, 불규칙한."
  ],
  "npc_lines": [
    "caller_a: 저는... 안전합니다"
  ]
}
```

### 02

latency 2.661s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "timeline_entries": [
    "회선에서 떨어져 나온 그 낮은 목소리는 발신자의 것이 아니었다 — 누군가가 수화기 너머에서 발신자에게 속삭였다.",
    "정해권이 몸을 앞으로 굽혔다. 콘솔 위의 불이 깜박인다.",
    "황보람의 손가락이 마우스 위에서 멈췄다. 녹음이 제대로 작동하는지 확인하려던 손이다."
  ],
  "npc_lines": [
    "caller_a: 네. 안전합니다."
  ]
}
```

### 03

latency 2.968s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "timeline_entries": [
    "정해권이 황보람 쪽을 돌아봤다, 눈빛이 날카로워져 있었다.",
    "황보람의 손가락이 콘솔 위에서 멈췄다 — 아직 어떤 명령도 내려오지 않았지만 몸이 이미 다음을 기다리고 있었다.",
    "수화기 너머로 회선 A 발신자의 호흡이 들렸다, 짧고 가팬 숨들이 규칙을 잃고 있었다."
  ],
  "npc_lines": [
    "caller_a: 안전? 저는... 지금 안전하지 않습니다."
  ]
}
```

### 04

latency 2.297s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "timeline_entries": [
    "통제관의 물음 뒤, 회선에는 잠시 공백이 흘렀다.",
    "황보람은 콘솔 화면의 음성 파형을 노려봤다 — 진폭이 분명 커졌다.",
    "정해권이 의자에서 일어섰다."
  ],
  "npc_lines": [
    "hbr: 녹음 정상입니다.",
    "jhg: 발신 지점 추적 상태는?"
  ]
}
```

### 05

latency 2.052s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "timeline_entries": [
    "정해권의 턱이 단단해졌다.",
    "황보람이 화면을 바라본 채 한손을 들어 통제관의 신호를 기다렸다.",
    "회선 A의 숨이 고르지 못한 리듬으로 돌아왔다."
  ],
  "npc_lines": [
    "caller_a: 안전하지 않습니다. 우리는 지금 건물 안에 있습니다."
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

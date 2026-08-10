# SMOKE-C2v7-count4-J1 — arm `baseline`

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

- **Hypothesis:** 하한이 곧 결과값이라는 v6의 관찰이 맞다면, 하한을 4로 올렸을 때 콜당 항목 수는 4.0 안팎에서 다시 분산 없이 붙는다. 콜당 timeline 문자 수는 106 → 140자 안팎, 항목당 문장 수는 1.10 수준을 유지한다.
- **Drop condition:** 콜당 항목 수가 4.5를 넘거나 3.5 아래면 "하한이 결과값"이라는 v6의 해석이 틀린 것 — 개수 통제는 범위 표기가 아니라 단일 상한이나 템플릿으로 가야 한다.
- **Contingency:** 항목 수는 4로 올랐는데 항목당 문장 수가 1.1을 넘으면 개수 여유가 한 문장 규칙을 다시 느슨하게 만든 것 — 두 제약의 상호작용을 별도로 봐야 한다.
- **Contingency:** 항목당 문자 수가 35자에서 크게 오르면 개수를 줄인 자리에 길이로 보상한 것이다.
- **Contingency:** 내용 손실·과밀 판정은 사람이 읽고 한다 — 숫자로는 안 잡힌다.

## Calls (verbatim)

### 01

latency 3.166s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "timeline_entries": [
    "통제관의 물음에 회선 A 발신자는 몇 초의 공백을 두고 대답했다, 호흡이 고르지 않은 채로.",
    "황보람의 손가락이 콘솔 위에서 멈췄다 — 녹음 표시를 확인하고 나서도 다시 확인해야 할 것 같은 불안이 그의 등을 곧게 세웠다.",
    "정해권은 회선 표시등에서 눈을 떼지 않았다. 턱이 조여 있었다."
  ],
  "npc_lines": [
    "caller_a: 안전합니다. 아직은."
  ]
}
```

### 02

latency 2.947s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "timeline_entries": [
    "정해권이 자리에서 일어났다, 팔걸이를 힘껏 잡았다가 놨다.",
    "황보람의 손가락이 녹음 표시 위를 맴돌다 멈췄다 — 이미 켜져 있었다.",
    "수화기에서 나오는 숨소리가 점점 가파르더니 어떤 말도 따라오지 않았다.",
    "정해권이 황보람을 본다, 그리고 황보람도 정해권을 본다 — 둘 다 움직이지 않는다."
  ],
  "npc_lines": [
    "hbr: 녹음 중입니다.",
    "jhg: 종이 넘어가는 소리가 들렸어. 지금도?"
  ]
}
```

### 03

latency 3.394s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "timeline_entries": [
    "정해권이 화면에서 눈을 떼지 못했다, 회선 표시등이 여전히 빨간색으로 켜 있는데.",
    "황보람의 손가락이 콘솔 위에서 멈췄고, 마이크로폰 수준 조절 슬라이더를 조정했다가 도중에 멈췄다.",
    "회선 A 발신자의 호흡이 다시 규칙적으로 돌아왔다, 하지만 더 얕아졌다."
  ],
  "npc_lines": [
    "jhg: 황보람, 발신 추적 신청해 주세요.",
    "hbr: 네, 지금 통신사에 요청 중입니다.",
    "caller_a: ...듣고 계신가요?"
  ]
}
```

### 04

latency 2.998s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "timeline_entries": [
    "정해권이 몸을 앞으로 기울였다. 손가락이 콘솔 가장자리를 누르고 있다.",
    "황보람의 얼굴이 밝아졌다 — 종이 넘어가는 소리가 무언가의 신호처럼 들렸다.",
    "회선 A는 여전히 열려 있고, 발신자의 숨소리만 들린다.",
    "정해권이 황보람을 바라봤다. 황보람은 고개를 가로저었다."
  ],
  "npc_lines": [
    "caller_a: 저기... 안전하진 않습니다.",
    "jhg: 기록은 계속되나?",
    "hbr: 네, 계속 녹음 중입니다."
  ]
}
```

### 05

latency 2.365s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "timeline_entries": [
    "종이 넘어가는 소리가 멈추고 수화기 너머의 숨소리가 더 크게 들렸다.",
    "황보람이 몸을 앞으로 구부려 마이크 너머의 음성을 더 가까이 들으려 했다.",
    "정해권이 통제관을 향해 몸을 틀었다. 얼굴이 경직되어 있었다.",
    "황보람이 키보드 옆에 깔려 있던 메모지를 집어 들고 펜을 잡았다."
  ],
  "npc_lines": []
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

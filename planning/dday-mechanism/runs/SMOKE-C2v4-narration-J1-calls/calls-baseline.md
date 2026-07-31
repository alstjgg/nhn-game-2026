# SMOKE-C2v4-narration-J1 — arm `baseline`

| field | value |
|---|---|
| call type | narration |
| channel | SHAPE |
| template | v0.2 |
| model | `claude-haiku-4-5-20251001` |
| transport | anthropic |
| temperament | neutral |
| N planned | 5 |
| N kept | 5 |

## Pre-registration

- **Hypothesis:** 페이퍼 게이트를 통과하는 비트에서는 화자 오배정이 사라진다 — 자문자답 0/5, NPC의 통제관 노릇 0/5. 남는 산출은 고정 사건에 대한 제3자 반응과 대사이며, 이미 타임라인에 있는 것을 되풀이하지 않는다.
- **Drop condition:** 화자 오배정이 5콜 중 2콜 이상이면 원인은 비트 저작이 아니라 v0.2 계약 자체다 — 반응 생성 프레이밍을 재설계하고, 엔진 요청서 §6.1의 비트 경계 규칙은 근거가 약해지므로 재검토한다.
- **Contingency:** 대사가 timeline_entries에 섞이는 것(v2·v3에서 2/5)이 남으면 템플릿의 "발화는 npc_lines에만"을 한 줄 강화한다.
- **Contingency:** 고정 사건 자체의 되풀이 서술은 별도로 센다 — TIMELINE_TAIL에 실려 있으므로 되풀이 금지가 강하게 걸려야 한다.
- **Contingency:** 채굴 재료(새 장면 여부)는 §5.3 mineability 로그로 사람이 판정한다.

## Calls (verbatim)

### 01

latency 3.999s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "timeline_entries": [
    "회선 A 발신자의 숨이 이번 교신에서 눈에 띄게 가빠졌다.",
    "황보람이 콘솔의 녹음 표시를 다시 확인했다.",
    "정해권의 손가락이 탁자를 한 번 두드렸다.",
    "침묵이 회선을 통해 흘러들었다 — 상대방의 무언의 응답이, 아니면 흔들림이."
  ],
  "npc_lines": [
    "jhg: 발신자분, 계속 들리세요?",
    "hbr: 녹음은 받고 있습니다, 실장님."
  ]
}
```

### 02

latency 2.963s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "timeline_entries": [
    "회선 A의 숨소리가 가빨라지면서 침묵이 이어졌다.",
    "정해권이 모니터 위로 시선을 돌렸다가 다시 회선 표시등으로 향했다.",
    "황보람의 손가락이 콘솔 위에서 멈춰 있었다.",
    "수화기 너머로 종이를 다루는 소리가 멈추지 않았다.",
    "긴 호흡음이 회선을 타고 들어왔다."
  ],
  "npc_lines": [
    "caller_a: 제 안전 따위는 중요하지 않습니다.",
    "jhg: 당신이 누구신지는 말씀해 주실 수 있나요?",
    "hbr: 통화 위치 추적 신청하겠습니다."
  ]
}
```

### 03

latency 2.777s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "timeline_entries": [
    "발신자의 호흡이 가빠지면서 수신기에 전해진다.",
    "정해권이 황보람을 향해 눈을 돌렸다가 다시 회선 표시등으로 시선을 돌린다.",
    "황보람의 손가락이 녹음 표시 위에서 멈췄다가 천천히 내려온다.",
    "통제실 안의 공기가 무거워진다."
  ],
  "npc_lines": [
    "caller_a: 안전합니다. 건물 밖입니다.",
    "hbr: 녹음 중입니다."
  ]
}
```

### 04

latency 4.687s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "timeline_entries": [
    "회선 A 발신자의 숨이 거칠어졌다. 마스크를 쓴 누군가가 재빠르게 움직이는 소리, 또 다른 목소리가 급하게 뭔가 지시하는 음성이 배경에서 겹쳤다.",
    "황보람이 콘솔의 녹음 표시를 눈여겨 다시 확인했다. 초록 점이 깜박거리고 있었다.",
    "정해권의 어깨가 곧게 펴졌다. 통제관의 말에 응하지 않은 침묵이 회선을 타고 흘러들어오자 그의 손가락이 마이크 버튼을 향해 움직였다.",
    "회선 A에서 다시 음성이 나왔다. 첫 번째보다 낮고, 호흡음이 섞여 있다."
  ],
  "npc_lines": [
    "caller_a: 배경을 신경 쓰지 마세요. 우리는 안전합니다.",
    "jhg: 회선 A 신원 추적을 지시합니다. 지금 바로.",
    "hbr: 통신사 협력 요청 이미 올렸습니다. 응답 대기 중입니다."
  ]
}
```

### 05

latency 4.377s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "timeline_entries": [
    "수화기 너머로 들려오는 숨소리가 불규칙해졌다.",
    "정해권이 모니터에서 눈을 떼어 회선 표시등을 다시 바라봤다.",
    "황보람의 손가락이 콘솔 위를 맴돌다 녹음 파일 아이콘 위에 멈췄다.",
    "긴 침묵 속에서 누군가의 손이 종이를 꺼내거나 집는 소리가 또 한 번 났다.",
    "실내의 공기가 무거워졌다."
  ],
  "npc_lines": [
    "caller_a: 안전하지 않습니다.",
    "hbr: 발신 위치를 추적하고 있습니다. 잠깐만요."
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

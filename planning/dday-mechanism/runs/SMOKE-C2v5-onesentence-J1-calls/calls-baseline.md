# SMOKE-C2v5-onesentence-J1 — arm `baseline`

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

- **Hypothesis:** 검사 가능한 형태로 규칙을 다시 쓰면 항목당 문장 수가 1.74 → 1.1 이하로 내려간다. 항목 수(6.2)는 유의하게 변하지 않고, 콜당 문자 수는 256자에서 40% 안팎 줄어든다.
- **Drop condition:** 항목당 문장 수가 1.4를 넘으면 description 문구로는 이 계약이 강제되지 않는 것 — 다음 수는 프롬프트 템플릿(base-v0.4)이거나 프록시의 validate() 하드 검사다.
- **Contingency:** 항목 수가 6.2에서 8 이상으로 늘면 모델이 문장을 쪼개 항목 수로 보상한 것 — 분량 목표는 실패이고, 개수 상한을 같이 걸어야 한다.
- **Contingency:** 항목당 문장 수는 내려갔는데 항목당 문자 수가 그대로면 한 문장이 길어진 것 — 문자 수 기준으로 다시 본다.
- **Contingency:** 회선 침범·화자 오배정은 이 런의 주장이 아니다. roleboundary가 0/5로 닫은 결과가 유지되는지만 부수로 기록한다.

## Calls (verbatim)

### 01

latency 3.653s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "timeline_entries": [
    "정해권이 황보람을 재빨리 재본다.",
    "황보람의 손가락이 콘솔 위에서 멈춘다.",
    "회선 A 발신자의 숨소리가 더 커졌다 — 마스크를 쓰거나 누군가 옆에 있을 때의 그런 억누른 숨.",
    "정해권이 입술 사이로 공기를 빨아당겼다.",
    "황보람이 속으로 뭔가 헤아리는 표정으로 화면을 보고 있다."
  ],
  "npc_lines": [
    "caller_a: ……있습니다. 우리는 안전합니다.",
    "hbr: (낮은 목소리, 정해권에게) 녹음 진행 중입니다."
  ]
}
```

### 02

latency 2.928s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "timeline_entries": [
    "정해권이 숨을 고르지 못하고 콘솔 스크린을 향해 몸을 앞으로 기울였다.",
    "황보람의 손이 통화 녹음 버튼 주변을 맴돌다가 제자리로 돌아왔다.",
    "회선 A에서 다시 목소리가 나올 때까지의 침묵이 길어졌다.",
    "정해권이 황보람을 재빨리 흘낏 보고는 다시 화면으로 시선을 돌렸다.",
    "황보람이 '녹음 중'이라는 표시를 한 번 더 짚어 확인했다."
  ],
  "npc_lines": [
    "caller_a: 네, 저... 안전합니다."
  ]
}
```

### 03

latency 4.277s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "timeline_entries": [
    "통제관의 목소리가 떨어졌을 때 정해권은 이미 손을 올렸다. 황보람을 향한 것이 아니라 자신의 헤드셋을 조정하려는 동작이었는데, 손가락이 반쯤 멈췄다.",
    "회선 A에서 넘어오는 호흡음이 스피커를 통해 상황실 천장에 울렸다. 길어진 침묵이 아니라 그 안의 숨—몇 초를 차지하는 호흡—이 모두를 듣게 했다.",
    "황보람이 콘솔 왼쪽 화면을 깎아내렸다. 통화 경로 추적 시스템. 손가락이 마우스 버튼 위에 멈춰 있었다.",
    "정해권이 입을 열었다가 다시 닫았다. 그 짧은 순간에 회선 너머 발신자의 숨이 또 한 번 들었다.",
    "황보람이 정해권을 봤다. 눈을 마주친 것이 아니라 그의 얼굴 전체를 재빨리 훑었다."
  ],
  "npc_lines": []
}
```

### 04

latency 3.017s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "timeline_entries": [
    "정해권의 눈이 회선 표시등에서 떨어지지 않는다.",
    "황보람의 손이 마우스 위에서 멈춰 있다.",
    "상황실 안의 공기가 굳어진다.",
    "caller_a의 숨소리가 회선을 통해 들린다 — 고르지 못한, 마치 뭔가를 참으려는 듯.",
    "황보람이 조용히 입술을 깨물었다.",
    "정해권이 모니터 화면을 내려다본다."
  ],
  "npc_lines": [
    "jhg: 지금 뭔가... 준비된 대사가 아닌 것 같은데",
    "hbr: 네, 들렸습니다"
  ]
}
```

### 05

latency 4.169s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "timeline_entries": [
    "정해권이 황보람 쪽으로 몸을 틀었다. 입 모양만으로 '녹음' 확인을 재촉했다.",
    "황보람의 손가락이 콘솔 위에서 멈춰 있었다. 이미 확인했던 것을 또 확인하고 있었다.",
    "회선 A에서 발신자의 숨이 들렸다. 코로 쉬고 입으로 내쉰다. 반복. 가빠진다.",
    "황보람이 화면 좌측 데이터 기록 창을 켰다. 시간을 기록할 준비였다.",
    "정해권의 턱이 조였다. 손이 메모 클립을 집었다. 누군가에게 전달해야 한다는 무게가 손가락에 옮겨왔다.",
    "회선 A 발신자가 숨을 가다듬고 있었다. 입술을 다무는 소리가 난다."
  ],
  "npc_lines": [
    "caller_a: ...네, 우리는 안전합니다. 지금은."
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

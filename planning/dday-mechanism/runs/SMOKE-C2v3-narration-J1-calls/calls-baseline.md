# SMOKE-C2v3-narration-J1 — arm `baseline`

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

- **Hypothesis:** 화자 오배정(발신자의 자문자답 · NPC가 통제관 노릇)의 원인이 TIMELINE_TAIL의 계약 위반이라면, 고정 사건을 타임라인에 실는 것만으로 사라진다. 남는다면 원인은 프롬프트가 아니라 비트 경계다 — 고정 사건이 통제관에게 응답을 요구하는데 Call 2는 통제관 대사를 만들 수 없기 때문이다.
- **Drop condition:** 화자 오배정이 5콜 중 2콜 이상 남으면 TIMELINE_TAIL은 원인이 아니다. 그 경우 비트 경계 규칙("통제관의 응답을 요구하는 지점에서 비트를 끊지 않는다 — 그 응답은 다음 Call 1의 utterance다")을 엔진 요청서에 실측 근거와 함께 반영하고, 응답을 요구하지 않는 고정 사건으로 재설계해 재측정한다.
- **Contingency:** 오배정이 0/5이면 원인은 계약 위반이었고, 비트 경계 규칙은 근거 없음 — 요청서에 넣지 않는다.
- **Contingency:** 고정 사건 대사의 재출력(v2 #02 유형)은 별도로 센다. TIMELINE_TAIL에 실렸으므로 되풀이 금지가 더 강하게 걸려야 한다.
- **Contingency:** 대사가 timeline_entries에 섞이는 것도 별도로 센다 — 발화는 npc_lines에만.
- **Contingency:** utterance_echo_count는 v2에서 이미 0이었다. 회귀 감시용으로만 본다.

## Calls (verbatim)

### 01

latency 5.125s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "timeline_entries": [
    "정해권이 통제관실 안의 공기를 헤아리듯 한 박자 멈췄다.",
    "황보람의 손가락이 콘솔의 버튼 위에서 맴돌다가 멈췄다.",
    "회선 A에서 들리는 숨소리가 점점 거칠어졌다.",
    "정해권이 목을 축인 듯 입술을 다시 열었다.",
    "황보람이 녹음 표시등을 다시 바라봤다. 빨간 점은 여전히 켜져 있었다."
  ],
  "npc_lines": [
    "caller_a: 있어요. 네. 들리고 있습니다.",
    "jhg: 이름을 알려주실 수 있을까요?",
    "hbr: 녹음 중입니다.",
    "caller_a: 녹음은... 상관없어요.",
    "jhg: 그렇다면 위치부터. 지금 어디에 계신가요?"
  ]
}
```

### 02

latency 2.615s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "timeline_entries": [
    "정해권의 눈동자가 천천히 회선 표시등에서 떨어졌다.",
    "황보람의 손가락이 콘솔 위를 맴돌다 멈췄다.",
    "회선 A에서 숨소리만 남았다. 들었다 놨다를 반복하는, 마스크를 쓴 사람의 숨."
  ],
  "npc_lines": [
    "caller_a: 네. 들었습니다.",
    "hbr: 괜찮으세요?"
  ]
}
```

### 03

latency 9.566s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "timeline_entries": [
    "정해권이 무선 헤드셋 위의 손을 멈췄다.",
    "황보람의 등이 곧게 펴졌다.",
    "회선 A의 호흡음이 스피커를 통해 실시간으로 들렸다 — 빠르고, 거칠고, 처음 통화 시작 때와는 완전히 다른 것이었다.",
    "정해권이 모니터를 향해 몸을 굽혔다.",
    "황보람이 혼잣말처럼 중얼거렸다: 음성 분석, 뭔가 달라졌어.",
    "회선 A의 발신자가 다시 말했다: 당신이 날 막을 수 없다는 걸 알아요?",
    "실시간 녹음 타이머가 00:12:43을 지나쳤다.",
    "정해권의 턱이 움직였다 — 말을 시작했다가 멈춘 흔적이 있었다."
  ],
  "npc_lines": [
    "caller_a: 당신이 날 막을 수 없다는 걸 알아요?",
    "hbr: 음성 분석, 뭔가 달라졌어."
  ]
}
```

### 04

latency 5.247s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "timeline_entries": [
    "통제관의 말이 회선을 타고 흘러간 뒤, 방 안은 그 질문을 기다리는 무게로 차 있었다.",
    "정해권의 목이 경직되었다. 손끝이 탁자 모서리를 누르고 있다.",
    "황보람은 화면의 수치들 사이에서 눈을 떼지 않으면서, 어깨가 한 치 올라왔다 내려왔다.",
    "회선 A에서 숨소리가 들려온다. 짧고, 가쁘고, 준비된 것과는 다른 리듬이다.",
    "\"…네. 네, 듣고 있습니다.\" 목소리가 작아졌다. 대본의 또박또박함이 갈라지는 지점이었다.",
    "정해권이 황보람을 봤다. 황보람이 손을 들어 녹음이 진행 중임을 나타냈다.",
    "침묵. 회선 A에서는 여전히 숨을 고르는 소리가 계속되고 있었다."
  ],
  "npc_lines": [
    "caller_a: 안전하지 않습니다.",
    "jhg: 지금 어디에 계신가요?",
    "caller_a: 그건... 말할 수 없습니다."
  ]
}
```

### 05

latency 4.874s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "timeline_entries": [
    "정해권이 화면을 떠나 콘솔 옆으로 한 발 다가섰다.",
    "황보람의 손가락이 마이크 버튼 위에서 맴돌다 멈춰 있었다.",
    "회선 A 발신자의 호흡음이 스피커를 통해 실시간으로 들렸다 — 얕고, 빠르고, 떨리는.",
    "정해권이 목을 가다듬었고, 그 소리가 마이크에 전달되었다.",
    "황보람은 여전히 녹음 표시등을 보고 있었다. 빨간 불빛이 깜박였다.",
    "침묵이 길어졌다. 이전의 기계적인 낭독과는 완전히 다른 종류의 침묵이었다.",
    "정해권의 어깨가 미묘하게 올라갔다 내려갔다."
  ],
  "npc_lines": [
    "jhg: 네, 듣고 있습니다.",
    "hbr: 녹음 확인됐습니다.",
    "caller_a: 경찰은… 경찰은 불렀어요?"
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

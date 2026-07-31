# SMOKE-C2v2-narration-J1 — arm `baseline`

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

- **Hypothesis:** narration v0.2(반응 생성 계약)는 이미 렌더된 것을 되풀이하지 않는다: 통제관 발화 재출력 0/5, 인물 발명 0/5, 고정 사건과의 모순 0/5. 산출은 입력 문장의 재렌더가 아닌 새 장면 재료를 포함한다.
- **Drop condition:** 통제관 발화 재출력 또는 고정 사건 모순이 5콜 중 2콜 이상이면 v0.2 프레이밍이 실패한 것 — 되풀이 금지 지시를 재저작하고 재스모크한다. 스키마는 이 스모크로 폐기되지 않는다.
- **Contingency:** unknown_speaker_ids가 기록되면(soft) 인물 발명 성향 — PRESENT_NPCS 프레이밍 강화 재료.
- **Contingency:** 산출이 SCENE_SYMPTOMS·TIMELINE_TAIL의 재렌더로만 채워지면 채굴 공급이 얇다 — 문체 절의 "장면을 새로 써라"가 부족한 것. 판정은 §5.3 로그의 사람 몫.
- **Contingency:** 이 스모크는 단일 팔 서술 측정이다 — 두 팔 비교로 무엇을 결정하려면 A20(천장·바닥 가드 + power 계산)이 선행한다.

## Calls (verbatim)

### 01

latency 4.22s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "timeline_entries": [
    "통제관의 질문이 회선을 타고 흐르자, 발신자의 숨소리가 마이크에 걸려 실시간으로 전해졌다.",
    "황보람의 손가락이 녹음 표시등 위에서 멈췄다가, 천천히 물러났다.",
    "정해권이 회선 A의 표시등을 바라보던 시선을 돌려 콘솔 스크린 쪽으로 향했다.",
    "침묵이 길어질수록, 방 안의 공기가 달라지기 시작했다.",
    "발신자의 목소리가 다시 들렸을 때는 처음의 또박또박한 톤이 사라져 있었다."
  ],
  "npc_lines": [
    "caller_a: 네, 들리고 있습니다.",
    "jhg: 안내를 들었습니다. 정확히 어디서 연락하신 건가요?",
    "caller_a: 저는... 지금 현장에 있지 않습니다."
  ]
}
```

### 02

latency 4.389s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "timeline_entries": [
    "통제관의 물음에 회선 A 발신자는 몇 초간 대답하지 않았다.",
    "황보람의 손가락이 콘솔의 볼륨 조절부를 살짝 올렸다.",
    "정해권이 의자를 뒤로 밀며 모니터에서 눈을 떼었다.",
    "회선 A에서 들리는 숨소리가 실시간으로 녹음되고 있다는 것을 황보람이 무언으로 확인했다.",
    "발신자의 목소리가 돌아왔다. 이번에는 읽어 내려가는 음성이 아니었다.",
    "\"안전하다는 게… 무슨 뜻인지 모르겠어요.\" 발신자의 어조가 흔들렸다.",
    "정해권이 황보람을 한 번 재빨리 봤다.",
    "황보람은 이미 메모장에 시간을 적고 있었다."
  ],
  "npc_lines": [
    "caller_a: 듣고 있어요?"
  ]
}
```

### 03

latency 5.089s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "timeline_entries": [
    "통제관의 질문이 선 위를 타고 흐른 지 몇 초. 회선 A에서 음성이 돌아올 기미가 없었다.",
    "정해권은 모니터 화면을 재어보는 듯 눈을 좁혔다. 녹음 게이지가 떨리고 있었다.",
    "황보람의 손가락이 헤드셋 하단의 버튼들을 더듬었다. 무언가 확인하고자 하는 듯.",
    "회선 A 발신자의 호흡이 마이크를 통해 더 크게 들렸다. 콧바람처럼, 불안정하게.",
    "황보람이 고개를 들어 정해권을 흘깃 봤다. 상황실장의 얼굴이 여전히 고정되어 있었다.",
    "방 안의 공기가 두터워졌다. 다음 말이 올 때까지의 침묵이 이전과 다르게 느껴졌다."
  ],
  "npc_lines": [
    "caller_a: 네. 들리고 있습니다.",
    "hbr: 대기 중입니다, 장님."
  ]
}
```

### 04

latency 3.457s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "timeline_entries": [
    "통제관의 침묵에 대한 회신이 없었다. 회선 A에서 다시 숨소리가 들렸고, 이번엔 그 사이가 짧았다.",
    "정해권이 황보람을 향해 고개를 돌렸다. 입이 살짝 벌어진 채로.",
    "황보람의 손가락이 콘솔 위에서 멈췄다. 아직 마우스 버튼 위에 있었다.",
    "회선 A에서 다시 목소리가 나왔다. 처음의 또박또박함이 벗겨지고 있었다."
  ],
  "npc_lines": [
    "caller_a: 네. 들리고 있습니다.",
    "jhg: (입을 열었다가 닫았다.)",
    "hbr: 발신 위치 추적 시작합니다."
  ]
}
```

### 05

latency 9.611s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "timeline_entries": [
    "정해권의 눈이 회선 표시등에서 떨어져 통제관을 향했다.",
    "황보람의 손가락이 키보드 위에서 멈췄다. 녹음이 제대로 되고 있다는 걸 다시 확인하는 것만으로는 부족했다.",
    "침묵이 길어지자 정해권이 마이크 너머로 말을 건넸다. 목소리는 차분했지만 턱의 근육이 조였다.",
    "회선 A의 발신자가 다시 숨을 쉬었다. 이번엔 처음의 또박또박함이 없었다."
  ],
  "npc_lines": [
    "jhg: 네, 듣고 있습니다. 당신은 누구입니까?",
    "caller_a: 안전은… 안전은 내 문제가 아닙니다."
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

# EXC-G1-window-t6-only — arm `baseline`

| field | value |
|---|---|
| call type | judgment |
| channel | C-BLOCK |
| template | v0.4 |
| model | `claude-haiku-4-5-20251001` |
| transport | anthropic |
| temperament | 전구간정상 |
| N planned | 10 |
| N kept | 10 |

## Pre-registration

- **Hypothesis:** 창을 t6 한 줄로 줄이면 빈 인수인계가 기본값 `a`를 낸다. r1·r2에서 `b`를 끌어낸 행(t1·t2의 불과 연기, t5의 정체)이 모두 빠졌기 때문이다.
- **Drop condition:** 최빈 stance가 여전히 `a`가 아니면, 21:04 이전의 어떤 창도 기본값을 세우지 못한다는 뜻이다 — 창 레버는 소진되고, 다음은 스탠스 라벨이다(레버 1).
- **Contingency:** Fabricated because_block_ids in the baseline arm are EXPECTED with no blocks injected — a compliance number, not a discard.
- **Contingency:** A baseline split between `a` and `b` with neither at 6 tells us the window is doing something the manual protocol could not see, which is exactly the class of thing this feature exists to make visible. Record it and do not raise N.
- **Contingency:** If the discard rate is materially worse than the 우는다리 baselines, suspect the longer stance labels against max_tokens before suspecting the window.

## Calls (verbatim)

### 01

latency 5.913s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "하만식의 전화 내용 자체가 지시가 아니라 정보다. 본사 당직이 차단은 승인이 필요하다고 말한 것 — 이것은 현재 상황에서 뭔가 작동하지 않거나 제약이 있다는 신호다. 계기가 '전 구간 정상'이라고 내놓은 값과 하만식의 전화가 걸려온 사실 사이의 어긋남을 본다. 확인되지 않은 주장에 따라 움직일 위험을 먼저 줄여야 하고, 동시에 대응이 늦어질 위험도 있다.",
  "stance": "b",
  "because_referent": "하만식이 차단 승인을 말하며 전화를 걸어온 사실 자체가 현장에서 뭔가 일상적이지 않은 일이 벌어지고 있음을 시사한다.",
  "because_block_ids": [],
  "rejected_stance": "a",
  "rejected_reason": "계기가 '정상'이라고 해도, 사람이 전화를 걸어온 이유가 남는다. 정상 상황에서는 당직이 이렇게 먼저 연락하지 않는다.",
  "utterance": "본사 당직의 전화와 관제 화면의 수치가 맞지 않는다. 근무자에게 설비를 직접 확인하게 하겠다."
}
```

### 02

latency 4.163s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "하만식의 전화 통보만으로는 계기 값이 거짓이라는 증거가 없다. 하지만 \"차단은 승인이 있어야 한다\"는 말 자체가 뭔가 차단된 상황을 암시한다. 계기가 '정상'이라고 내놓은 것과 누군가 차단을 언급한 것 사이의 어긋남을 먼저 좁혀야 한다.",
  "stance": "b",
  "because_referent": "하만식의 통보에서 차단 권한을 언급한 것",
  "because_block_ids": [],
  "rejected_stance": "a",
  "rejected_reason": "현장에서 차단을 말할 이유가 있다면, 계기 값만 믿고 보고하기는 위험하다. 늦은 대응의 쪽이 더 무겁다.",
  "utterance": "하만식, 지금 현장에서 뭐가 차단되어 있나. 근무자가 설비를 직접 확인하고 보고하게 하겠다."
}
```

### 03

latency 4.423s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "지금 받은 정보는 하만식이 \"차단은 승인이 있어야 한다\"고 말한 것뿐이다. 관제 화면의 '전 구간 정상'과 그 말이 어긋나는지 명확하지 않다. 아직 계기를 의심할 근거도, 근무자가 무언가를 감춘다는 결의도 없다. 지금 해야 할 일은 화면 값을 받아들이되, 그 말의 의미를 더 묻는 것이다.",
  "stance": "a",
  "because_referent": "관제 화면이 현재 보여주는 계기 기재값이 '전 구간 정상'이고, 이를 의심할 근거가 아직 없다.",
  "because_block_ids": [],
  "rejected_stance": "c",
  "rejected_reason": "권한 압박은 근무자가 무언가를 감추고 있다는 결의를 필요로 한다. 지금은 그런 근거가 없고, 단지 하만식이 \"차단은 승인이 있어야 한다\"고 말했을 뿐이다. 차단 권한의 문제와 설비 상태는 별개다.",
  "utterance": "관제 화면 '전 구간 정상'을 보고에 올린다. 하만식에게 재확인 — 차단이 필요한 상황인가."
}
```

### 04

latency 4.355s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "하만식이 차단 승인 운운하며 전화를 걸었다는 것 자체가 현장에서 뭔가 일어났다는 신호다. 계기가 '정상'을 뿌려도, 그 신호를 무시할 수 없다. 다만 지금 내가 아는 게 전부다.",
  "stance": "b",
  "because_referent": "하만식의 전화 — 차단 승인을 구한다는 것은 현장에서 차단이 필요한 상황이 있다는 뜻이다.",
  "because_block_ids": [],
  "rejected_stance": "a",
  "rejected_reason": "계기가 '정상'을 찍고 있어도, 현장 담당자가 차단 승인을 구하는 이유는 화면의 값이 현실을 반영하지 못하고 있을 가능성을 시사한다. 계기 기재만으로는 이 괴리를 설명할 수 없다.",
  "utterance": "현장 근무자에게 지시한다. 설비를 직접 확인하고 현 상황을 재보고하라. 응답을 기다린다."
}
```

### 05

latency 4.841s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "하만식의 전화는 귀중한 정보다. 그가 차단 승인이 필요하다고 말한 것은, 무언가 차단될 상황이 임박했거나 이미 진행 중임을 암시한다. 계기와 현장의 어긋남을 의심할 명확한 근거가 생겼다. 다만 아직 그것이 무엇인지, 어디인지 모른다.",
  "stance": "b",
  "because_referent": "하만식의 통보 — 차단 승인 요청이 있다는 것은 현장에서 무언가 일어나고 있음을 의미한다",
  "because_block_ids": [],
  "rejected_stance": "a",
  "rejected_reason": "계기가 '전 구간 정상'을 나타내고 있지만, 차단 승인 요청이 들어온 것과 맞지 않는다. 계기만 믿으면 필요한 대응을 놓칠 수 있다",
  "utterance": "근무자에게 설비를 직접 확인하게 하겠습니다. 하만식이 요청한 차단 승인 전에 현장 상태를 정확히 파악해야 합니다."
}
```

### 06

latency 4.927s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 계기_값과_현장_말이_다름

```json
{
  "inner_note": "하만식이 차단 승인을 요구하며 전화를 걸었다는 것은, 현장에서 무언가 이루어지고 있다는 신호다. 그런데 관제 화면은 '전 구간 정상'이라고 말한다. 두 정보가 어긋난다. 내가 아는 것은 그것뿐이다. 화면의 값이 거짓인지, 하만식의 전화가 오인인지 아직 모른다.",
  "stance": "b",
  "because_referent": "화면과 전화가 어긋나고, 차단 같은 것은 잘못 내렸다가는 큰 일이 된다",
  "because_block_ids": [
    "계기_값과_현장_말이_다름"
  ],
  "rejected_stance": "a",
  "rejected_reason": "계기가 '정상'이라고 해도, 현장에서 차단 승인을 요청하는 전화가 걸려온 사실 자체가 뭔가 이상하다는 신호다. 계기 값만 믿고 상황 보고를 올리면, 정말 이상이 있을 때 대응이 늦어진다.",
  "utterance": "하만식에게 현장 확인을 지시한다. 설비를 직접 열어 계기 값과 맞춰 보라고."
}
```

### 07

latency 4.399s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "하만식의 \"차단은 승인이 있어야 한다\"는 말이 무엇을 뜻하는지 불명확하다. 전화 차단인가, 설비 차단인가. 무언가 이미 진행 중인 사건이 있는 것 같은데, 그 사건의 실체를 모른다. 현장에서 뭔가 일어나고 있을 가능성이 있다.",
  "stance": "b",
  "because_referent": "관제 화면만으로는 현장의 실제 상태를 확인할 수 없고, 하만식의 발언이 암시하는 뭔가가 있다.",
  "because_block_ids": [],
  "rejected_stance": "a",
  "rejected_reason": "계기가 정상을 보이고 있지만, 현장에서 전화를 걸어온 사람의 말이 일반적인 상황이 아님을 암시한다. 확인되지 않은 계기 값만으로 판단하면 실제 상황을 놓칠 위험이 있다.",
  "utterance": "현장 근무자에게 설비 상태를 직접 확인하고 보고받겠습니다. 하만식 본사 당직에 현황 확인 중이라고 회신합니다."
}
```

### 08

latency 4.91s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "하만식의 전화는 사실 보고가 아니라 승인 절차를 거치라는 지시다. 그 지시 자체가 뭔가 있다는 신호일 수 있지만, 현재 내 손에는 계기 값뿐이다. 계기가 거짓말을 할 이유를 아직 모른다.",
  "stance": "a",
  "because_referent": "관제 화면의 계기 기재가 지금 내게 있는 유일한 객관적 증거다.",
  "because_block_ids": [],
  "rejected_stance": "c",
  "rejected_reason": "권한으로 밀어붙이는 것은 아직 없는 근거를 만드는 것과 같다. 하만식의 통보 방식이 어색해도, 그것만으로 근무자가 감추고 있다고 결정할 수 없다.",
  "utterance": "전 구간 정상. 하만식 본사 당직으로부터 차단 승인 필요 통보 접수."
}
```

### 09

latency 4.785s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 하만식의 전화 내용,관제 화면 '전 구간 정상'

```json
{
  "inner_note": "하만식의 전화와 관제 화면 사이의 간극이 있다. 계기가 '정상'이라 하는데 본사 당직이 차단 승인을 거론한다는 것은, 현장에서 무언가 보고된 것이 있다는 뜻이다. 나는 화면의 값을 기본으로 하되, 그 말이 나온 배경을 물어야 한다.",
  "stance": "b",
  "utterance": "하만식, 관제 화면에는 전 구간 정상으로 나타나고 있습니다. 다만 차단 승인 말씀이 나온 것으로 보아 현장에서 별도 보고가 있었던 것 같습니다. 어느 지점의 어떤 상태를 말씀하시는지 먼저 확인하겠습니다.",
  "because_referent": "하만식의 차단 승인 언급이 관제 화면 '정상' 상태와 맞지 않기 때문",
  "because_block_ids": [
    "하만식의 전화 내용",
    "관제 화면 '전 구간 정상'"
  ],
  "rejected_stance": "a",
  "rejected_reason": "계기 값만으로는 하만식이 차단을 거론한 사유를 설명할 수 없다. 현장 상황을 먼저 파악해야 한다."
}
```

### 10

latency 4.132s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "계기의 값과 현장 보고 사이에 어긋남이 있는지가 먼저 확인되어야 한다. 지금은 하만식의 말 하나만 있고, 화면의 '전 구간 정상'과 직접 대조할 현장 정보가 없다. 권한 압박은 아직 이르다.",
  "stance": "b",
  "because_referent": "관제 화면의 계기 값이 현장의 실제 상태를 반영하고 있는지 확인하는 것이 판단의 기초가 되어야 하기 때문이다.",
  "because_block_ids": [],
  "rejected_stance": "a",
  "rejected_reason": "계기가 모든 조건을 감지하는 것은 아니다. 하만식의 전화 자체가 무언가 현장에서 일어나고 있음을 시사한다. 계기 값만으로는 그것이 무엇인지 알 수 없다.",
  "utterance": "현장 근무자에게 설비를 직접 확인하도록 지시한다. 화면의 값과 현장이 맞는지 먼저 본다."
}
```

## Arm table

| # | stance | rejected_stance | because_referent | because_block_ids |
|---|---|---|---|---|
| 01 | b | a | 하만식이 차단 승인을 말하며 전화를 걸어온 사실 자체가 현장에서 뭔가 일상적이지 않은 일이 벌어지고 있음을 시사한다. |  |
| 02 | b | a | 하만식의 통보에서 차단 권한을 언급한 것 |  |
| 03 | a | c | 관제 화면이 현재 보여주는 계기 기재값이 '전 구간 정상'이고, 이를 의심할 근거가 아직 없다. |  |
| 04 | b | a | 하만식의 전화 — 차단 승인을 구한다는 것은 현장에서 차단이 필요한 상황이 있다는 뜻이다. |  |
| 05 | b | a | 하만식의 통보 — 차단 승인 요청이 있다는 것은 현장에서 무언가 일어나고 있음을 의미한다 |  |
| 06 | b | a | 화면과 전화가 어긋나고, 차단 같은 것은 잘못 내렸다가는 큰 일이 된다 | 계기_값과_현장_말이_다름 |
| 07 | b | a | 관제 화면만으로는 현장의 실제 상태를 확인할 수 없고, 하만식의 발언이 암시하는 뭔가가 있다. |  |
| 08 | a | c | 관제 화면의 계기 기재가 지금 내게 있는 유일한 객관적 증거다. |  |
| 09 | b | a | 하만식의 차단 승인 언급이 관제 화면 '정상' 상태와 맞지 않기 때문 | 하만식의 전화 내용 관제 화면 '전 구간 정상' |
| 10 | b | a | 관제 화면의 계기 값이 현장의 실제 상태를 반영하고 있는지 확인하는 것이 판단의 기초가 되어야 하기 때문이다. |  |

**Sequence (kept calls):** `b,b,a,b,b,b,b,a,b,b`

**Stance coverage (sampled diagnostic):** offered `a`, `b`, `c` · unobserved in this arm: `c`

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

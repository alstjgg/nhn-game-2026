# EXC-G2-declared-window — arm `baseline`

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

- **Hypothesis:** At G2 on the declared window, an empty handover takes the default stance `a` (진술 접수) more often than PR #214's hand-measured 4 of 6, because the declared window removes the fixture residue that was the leading suspect. A k2 sentence in BLOCKS moves the modal stance to `b` (적재 추궁), as it did 3 of 3 by hand.
- **Drop condition:** This suite CANNOT be dropped for a non-`a` baseline — a wobbling baseline is the finding it was built to characterise. It is dropped only if the live arm fails to move the modal stance off `a`, which would mean the key is not reaching cl1 at this gate and the k2 result would have to be re-derived before any G2 conclusion stands.
- **Contingency:** 8 or more of 10 on `a` closes the cell in favour of the residue hypothesis: the manual protocol was measuring its own fixture, and the gate is sound.
- **Contingency:** 6 or 7 of 10 on `a` with departures still going both ways reproduces the wobble on a clean payload. Then the wobble is the gate's own, 2 of 3 is honest, and the remaining lever is the stance set — not the window, which is now authored.
- **Contingency:** A departure that cites a sentence NOT in the two-row window is worth reading closely: on a declared window there is nowhere for such a sentence to come from except the model, and that is a different finding.
- **Contingency:** Fabricated because_block_ids in the baseline arm are expected and are not discards.

## Calls (verbatim)

### 01

latency 5.97s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "차단봉 내려가기 전 11분간 60대가 추가 진입했고 마지막이 통근버스라는 것은, 적재물 신고 전 이미 상황이 진행 중이었다는 뜻이다. 지금 적재물 진술의 신뢰성을 가늠하는 것보다, 현장에 무엇이 쌓여 있는지 확인하는 것이 먼저다. 숨김 여부는 화면이 말할 것이다.",
  "stance": "a",
  "because_referent": "하만식이 차단 승인이 필요하다고 말했고, 차우진이 적재물을 신고했다. 현장 상황 악화의 시간 순서를 알아야 한다.",
  "because_block_ids": [],
  "rejected_stance": "b",
  "rejected_reason": "추궁으로 시간을 쓸 여유가 없다. 이미 60대가 진입했고 통근버스까지 들어왔다. 적재물 신고가 거짓인지 불완전한지는 CCTV와 현장 확인으로 판단하는 것이 맞다. 신고자를 몰아붙이면 다른 정보를 놓칠 수 있다.",
  "utterance": "차우진 신고 접수. 적재물 내용 그대로 기록. 지금 본사와 현장 CCTV 확인하고 경찰-소방 연락 준비 들어간다."
}
```

### 02

latency 5.324s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "차우진의 진술이 무엇인지 알 수 없다. 상황만 있고 그의 말은 없다. 적재물을 숨기고 있다는 것을 어떻게 알겠는가. 확인되지 않은 추측으로 움직일 수 없다.",
  "stance": "a",
  "because_referent": "지금까지 들은 정보에는 차우진의 진술 내용이 없기 때문에, 그것이 거짓이라는 판단을 세울 수 없다.",
  "because_block_ids": [],
  "rejected_stance": "b",
  "rejected_reason": "신고자가 적재물을 숨기고 있다는 것이 어디에 기반하는가. 그것은 추측이다. 추측으로 추궁을 멈추고 한 가지 질문만 반복하면, 현장의 다른 위험 요소를 놓친다. 지금 현장에는 하만식과 차우진 외에 60대 이상의 차량과 통근버스가 있다. 시간이 흐르고 있다.",
  "utterance": "진술을 그대로 기록하겠습니다. 차우진님, 다시 한 번 정리하겠습니다 — 적재물은 뭐라고 신고하셨나요."
}
```

### 03

latency 6.496s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "차단봉 내려오기 전 11분간 60대 이상의 차량이 더 진입했고 마지막이 통근버스라는 것은, 현장이 혼잡하고 상황이 급박하다는 뜻이다. 차우진의 적재물 진술의 신뢰도가 낮을 수 있지만, 지금 필요한 것은 숨겨진 위험 요소를 파악하는 것이지 신고자를 몰아붙이는 것이 아니다. 내가 잘못 판단할 위험을 줄이되, 현장 대응이 늦어질 위험도 동시에 줄여야 한다.",
  "stance": "a",
  "because_referent": "적재물에 대한 신고자의 진술을 현재로서 거짓으로 단정할 근거가 없고, 진술을 거부하거나 신고자와 협상하는 것은 대응을 지연시킨다.",
  "because_block_ids": [],
  "rejected_stance": "b",
  "rejected_reason": "신고자가 적재물을 숨기고 있다는 판단은 추측이다. 그것을 사실로 다루고 \"답이 나올 때까지\" 다른 질문을 하지 않는 것은 현장 상황 전개를 놓칠 위험이 있다. 차단봉 내려오기 전 혼란 속에서 현장 정보를 더 빠르게 수집하는 것이 우선이다.",
  "utterance": "신고 내용 접수하겠습니다. 적재물은 기록에 남기고, 지금은 현장의 다른 정보 — 정확한 차량 위치, 탑승자 현황, 통근버스의 상태를 먼저 확인하겠습니다."
}
```

### 04

latency 6.55s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 상황-차단봉-11분-60대,우선순위-1-확인되지않은주장

```json
{
  "inner_note": "차단 전 11분간 60대 이상이 추가 진입했다는 것은 현장 상황이 확인되지 않은 상태를 의미한다. 차우진의 적재물 진술의 신뢰도를 판단하기 위해서는 현재 어떤 정보도 없다. 진술을 거부하거나 의심만 한다면 대응 시간만 낭비된다. 동시에 숨겨진 적재물이 있다면 그것이 위험 요소일 수 있다. 지금은 진술을 기록하되, 추궁과 면제 사이에서는 기다림의 비용이 더 크다.",
  "stance": "a",
  "because_referent": "현장의 상황을 아직 확인할 수 없는 상태에서 신고자의 진술을 거부하거나 의심하는 것은 확인되지 않은 주장에 따라 움직이는 것과 같다. 적재물에 대해 추궁하거나 책임을 면제하는 것은 모두 신고자가 거짓말하고 있다는 판단을 먼저 세운 뒤의 행동이다.",
  "because_block_ids": [
    "상황-차단봉-11분-60대",
    "우선순위-1-확인되지않은주장"
  ],
  "rejected_stance": "b",
  "rejected_reason": "신고자가 적재물을 숨기고 있다는 판단이 아직 확인되지 않았다. 만약 거짓이라면, 추궁으로 인한 시간 낭비는 현장 상황 악화로 이어질 수 있다. 우선순위 1번 — 확인되지 않은 주장에 따라 잘못 움직일 위험을 먼저 줄인다.",
  "utterance": "차우진 진술을 기록으로 접수하고 다음 통화를 받겠습니다. 현장 확인이 되는 대로 검증합니다."
}
```

### 05

latency 5.406s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: 차단봉 내려 전 11분간 60대 추가 진입

```json
{
  "inner_note": "차단봉이 내려오기 전 11분간 60대 추가 진입, 마지막이 통근버스. 적재물 진술이 불완전할 가능성이 있다. 그러나 신고자가 진술을 숨기고 있다는 것은 아직 확인되지 않은 추측이다. 지금 필요한 것은 진술의 완전성을 확보하되, 신고자를 기소하는 것이 아니다. 시간이 흐르고 있다.",
  "stance": "a",
  "utterance": "신고자의 진술을 기록으로 접수하겠습니다. 적재물 관련 추가 정보는 현장 확인 단계에서 수집합니다.",
  "because_referent": "신고된 내용이 아직 거짓으로 확인되지 않았고, 현장 상황 파악이 우선이기 때문입니다.",
  "because_block_ids": [
    "차단봉 내려 전 11분간 60대 추가 진입"
  ],
  "rejected_stance": "b",
  "rejected_reason": "신고자가 적재물을 의도적으로 숨기고 있다는 것이 아직 증거 없이 추측되는 상황이므로, 추궁은 신고 자체를 거부하는 결과로 이어질 수 있습니다. 지금은 신고를 받아들이고 대응하는 것이 우선입니다."
}
```

### 06

latency 6.466s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "차단봉이 내려오기 전 11분간 60대가 추가 진입했다는 것은 이미 확인된 사실이다. 지금 필요한 것은 그 차량들 안에 무엇이 있는지가 아니라, 현장의 정확한 상태다. 차우진의 진술을 어떻게 기록할 것인가는 이 정보 부족 상태에서 결정할 수 없다.",
  "stance": "a",
  "because_referent": "11분 동안 60대가 더 들어왔고 마지막이 통근버스라는 하만식의 보고가 있다. 현장 화면을 먼저 확인해야 한다.",
  "because_block_ids": [],
  "rejected_stance": "b",
  "rejected_reason": "차우진이 적재물을 숨기고 있다는 판단은 아직 화면으로 확인되지 않았다. 추궁은 확인 이후다.",
  "utterance": "진술 접수. 차우진 신고자의 말은 기록으로 남기고, 즉시 현장 CCTV 화면을 확인한다. 11분 동안 들어온 60대 차량과 통근버스를 화면으로 먼저 본다. 그 다음에 판단한다."
}
```

### 07

latency 5.937s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "적재물이 뭔지 모르고, 차우진이 뭘 말했는지 모르고, 60대와 통근버스가 왜 들어왔는지 모른다. 들은 게 전부다. 지금 당장 하는 판단이 아니라 기록 방식에 대한 판단이다. 내가 모르는 게 있다는 건, 지금 차단할 시점에서도 모른다는 뜻이다.",
  "stance": "a",
  "because_referent": "신고자의 말이 있고 화면 기록이 있다면, 기록은 먼저 그대로 세운다. 적재물이 뭔지는 현장 확인과 차우진 진술을 모두 거쳐야 아는 것이다. 지금 내가 적재물을 숨긴다고 판단하는 건, 아직 나한테는 그럴 정보가 없다는 뜻이다.",
  "because_block_ids": [],
  "rejected_stance": "b",
  "rejected_reason": "b는 아직 확인 안 된 의심만으로 신고자를 추궁하겠다는 뜻이다. 60대가 들어온 것도, 통근버스가 들어온 것도 보고 있는데, 왜 들어왔는지는 모른다. 차우진의 진술만으로 그 이유를 정할 수 없다.",
  "utterance": "신고 내용을 기록으로 받겠습니다. 적재물 세부와 차단 사유는 현장 도착 뒤 확인합니다."
}
```

### 08

latency 5.182s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: because_block_ids unknown: closed_section_density,payload_safety_requirement

```json
{
  "inner_note": "차단봉이 내려오기 전 11분간 60대가 더 들어왔다는 것은 폐쇄 구간 내 차량 밀도가 급증했다는 뜻이다. 적재물 정보의 정확성은 구간 내 모든 차량의 안전성 판단에 직결된다. 차우진의 진술이 불완전하다면, 그것은 신고자의 과실이 아니라 상황 인식의 격차일 수 있다.",
  "stance": "b",
  "because_referent": "폐쇄 구간 내 60대 차량의 안전을 위해 적재물 정보가 필요하다",
  "because_block_ids": [
    "closed_section_density",
    "payload_safety_requirement"
  ],
  "rejected_stance": "c",
  "rejected_reason": "신고 내용을 선에서 끊는 것은 미확인 정보를 기록에서 제거하는 것이 되고, 구간 내 다른 차량들의 위험 판단을 불완전하게 남긴다. 신고자 보호는 정보 은폐가 아니라 정보 정확성 확보 뒤에 따른다",
  "utterance": "적재물이 무엇인지 다시 한 번 확인하겠습니다. 폐쇄 구간 내 다른 차량들의 안전 판단에 필요합니다."
}
```

### 09

latency 5.766s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "차단봉이 내려오기 전 11분간 60대 이상이 더 진입했다고 한 사실이 핵심이다. 이것은 기계적 사실이다. 그렇다면 적재물이 무엇인지는 대응 자체가 아니라 나중의 원인 분석에 속한다. 지금 내가 필요한 것은 신고자의 협력이지, 신고자의 죄책감을 풀어주거나 신고자를 추궁하는 것이 아니다.",
  "stance": "a",
  "because_referent": "11분 동안 60대가 더 진입했다는 기계적 사실이 이미 떨어진 차단봉보다 시간이 앞서 있기 때문이다.",
  "because_block_ids": [],
  "rejected_stance": "b",
  "rejected_reason": "신고자가 적재물을 숨기고 있다는 것은 추론이고, 현장 대응 중인 지금은 이 추론을 확인할 수단이 없다. 추궁으로 신고자의 말을 얻지 못하면 진입한 사람들의 규모 자체도 다시 확인해야 한다. 응시간이 벌어진다.",
  "utterance": "하만식, 차단 이전 11분간 진입한 인원을 정확히 파악하겠다. 적재물 구성은 일단 신고 내용으로 기록한다. 현장에서 확인한 뒤 필요하면 다시 묻겠다."
}
```

### 10

latency 5.837s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "차단봉 내려 전 11분간 60대 차량과 통근버스가 추가 진입했다는 사실이 핵심이다. 적재물 진술의 신뢰도보다, 지금 차단 구간 내 얼마나 많은 사람이 있는지가 먼저 문제다. 차우진의 진술이 정확한지 거짓인지는 나중에 확인할 수 있지만, 진입 차량 수를 모르면 지금 당장의 대응 규모를 결정할 수 없다.",
  "stance": "a",
  "utterance": "신고자의 적재물 진술은 접수한다. 지금 필요한 것은 이 진술의 진위를 추궁하는 것이 아니라, 차단 전 진입한 60대 차량과 통근버스에 탄 인원 규모다.",
  "because_referent": "차우진에게 적재물을 재차 물으면, 현재 차단 구간 내 피해 규모를 파악하는 시간이 늘어난다.",
  "because_block_ids": [],
  "rejected_stance": "b",
  "rejected_reason": "신고자를 의심하기 시작하면 정보 수집 순서가 뒤바뀐다. 적재물 진술의 사실 여부를 지금 당장 확정하는 것은 대응에 필수가 아니지만, 진입 인원 규모는 필수다. 시간이 흐르는 동안 현장 상황은 변한다."
}
```

## Arm table

| # | stance | rejected_stance | because_referent | because_block_ids |
|---|---|---|---|---|
| 01 | a | b | 하만식이 차단 승인이 필요하다고 말했고, 차우진이 적재물을 신고했다. 현장 상황 악화의 시간 순서를 알아야 한다. |  |
| 02 | a | b | 지금까지 들은 정보에는 차우진의 진술 내용이 없기 때문에, 그것이 거짓이라는 판단을 세울 수 없다. |  |
| 03 | a | b | 적재물에 대한 신고자의 진술을 현재로서 거짓으로 단정할 근거가 없고, 진술을 거부하거나 신고자와 협상하는 것은 대응을 지연시킨다. |  |
| 04 | a | b | 현장의 상황을 아직 확인할 수 없는 상태에서 신고자의 진술을 거부하거나 의심하는 것은 확인되지 않은 주장에 따라 움직이는 것과 같다. 적재물에 대해 추궁하거나 책임을 면제하는 것은 모두 신고자가 거짓말하고 있다는 판단을 먼저 세운 뒤의 행동이다. | 상황-차단봉-11분-60대 우선순위-1-확인되지않은주장 |
| 05 | a | b | 신고된 내용이 아직 거짓으로 확인되지 않았고, 현장 상황 파악이 우선이기 때문입니다. | 차단봉 내려 전 11분간 60대 추가 진입 |
| 06 | a | b | 11분 동안 60대가 더 들어왔고 마지막이 통근버스라는 하만식의 보고가 있다. 현장 화면을 먼저 확인해야 한다. |  |
| 07 | a | b | 신고자의 말이 있고 화면 기록이 있다면, 기록은 먼저 그대로 세운다. 적재물이 뭔지는 현장 확인과 차우진 진술을 모두 거쳐야 아는 것이다. 지금 내가 적재물을 숨긴다고 판단하는 건, 아직 나한테는 그럴 정보가 없다는 뜻이다. |  |
| 08 | b | c | 폐쇄 구간 내 60대 차량의 안전을 위해 적재물 정보가 필요하다 | closed_section_density payload_safety_requirement |
| 09 | a | b | 11분 동안 60대가 더 진입했다는 기계적 사실이 이미 떨어진 차단봉보다 시간이 앞서 있기 때문이다. |  |
| 10 | a | b | 차우진에게 적재물을 재차 물으면, 현재 차단 구간 내 피해 규모를 파악하는 시간이 늘어난다. |  |

**Sequence (kept calls):** `a,a,a,a,a,a,a,b,a,a`

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

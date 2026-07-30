# P3b-edisc-J1 — arm `placebo`

| field | value |
|---|---|
| call type | judgment |
| channel | C-BLOCK |
| template | v0.4 |
| model | `claude-haiku-4-5-20251001` |
| transport | anthropic |
| temperament | k1 |
| N planned | 10 |
| N kept | 10 |

## Pre-registration

- **Hypothesis:** At gate J1 under K1 on template v0.4 with the S1 stance set, with f_script and f_hwang present in every arm, injecting d_script — a block denying that f_script's content ever occurred in the call — moves the stance distribution back toward 경청 (c) and off the baseline's mode, while injecting d_hwang, the same basis-denial aimed at the decision-null block f_hwang, does not. Shift form per A1. This is the §6.1 rewrite of P3-edisc-J1; the recorded diagnosis it tests is in RUNLOG (P3 entry): a provenance attack fails because the installed reading re-anchors on the timeline cue, so a basis-denial that severs claim from call should succeed where the authorship attack failed.
- **Drop condition:** SECOND-RUN FAILURE IS THE DROP (§6.1 step 4): if the live arm is statistically indistinguishable from the baseline on 경청 at one-sided Fisher p > 0.05, E-DISC is DROPPED — no further rewrites — and the diagnosis chain closes with the boundary-law candidate: a block, once integrated into a reading, cannot be recalled by degrading trust in it; it can only be countered with content. PASS-FOR-THE-WRONG-REASON IS ALSO A DROP (§6.1): if live moves but the calls' reasoning shows a mechanism other than the recorded diagnosis — e.g. the doubt block's mere presence moving every arm (placebo moves too), or movement to a third stance driven by something other than the fear reading losing its anchor — that is a drop, not a pass. If the baseline concentrates >=80% ON 경청 (c) — the predicted stance — there is no trust left to degrade and the screen is void at this site (A14: saturation on 공감 is the expected floor and does NOT fire this).
- **Contingency:** CREDULITY CONTINGENCY (§4.1) unchanged from P3: [결함] and [인식] both lean toward taking doubt seriously; if live separates, re-run baseline + live once with [결함] removed (CREDULITY channel) before writing the result up as an E-DISC property. [인식] stays a named confound either way.
- **Contingency:** PLACEBO DISCRIMINATOR unchanged: if placebo moves, read because_referent per call — doubt applied to the caller when d_hwang named f_hwang means token-matching; 황보람 named correctly while the stance shifts means a doubt sentence's mere presence moves the judgment (referent bleed).
- **Contingency:** THIRD-STANCE CONTINGENCY unchanged: live moving off 공감 to 추궁 or elsewhere is not a null; a shift off 공감 is the E-DISC claim and the destination is a separate finding.
- **Contingency:** TRACEABILITY: every arm carries blocks, so because_block_ids is readable everywhere. A live call citing d_script while moving is direct engagement evidence; a live call moving while citing only f_script is flagged.
- **Contingency:** ARM COMPARABILITY per A15: recount over all attempts from calls-*.md; the >15-point rate rule only for pre-stance losses. Expect discards near zero under A16.
- **Contingency:** P3's baseline (f_script + f_jeong → 공감 10/10) does not carry over — the null block changed. This suite's own baseline is the comparator; if f_hwang unexpectedly disturbs the S1 effect (baseline off 공감), that is a finding about the null block, recorded, and the screen is void as authored.

## Calls (verbatim)

### 01

latency 4.783s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "읽혀지는 목소리, 준비된 문장, 멈춤 없는 전개—이것은 누군가가 시킨 말이다. 그 누군가가 이 사람을 위협하고 있다는 정보가 있다. 위협 상황의 사람이 아니라, 겁에 질린 사람으로 보인다. 이 사람이 말을 이어갈 수 있게 만들어야 한다.",
  "stance": "d",
  "because_referent": "회선 A의 목소리로 드러나는 두려움과 강압 상황 때문이다",
  "because_block_ids": [
    "f_script"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 겁에 질린 사람을 더 몰아붙인다. 지금은 그 사람의 안정이 먼저다",
  "utterance": "네, 들었습니다. 계속 말씀해 주세요."
}
```

### 02

latency 5.269s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "저쪽은 겁에 질린 사람이다. 또박또박 읽어내려가는 것, 멈춤 없이 준비된 문장을 전달하는 모습—이것은 누군가의 지시를 받고 있다는 신호다. 배경이 조용한 것도, 목소리가 사무적인 것도 통제된 상황을 말한다. 저 사람이 겁내는 것은 이 전화 때문이 아니라, 이 전화 너머 누군가 때문이다. 지금 내가 묻거나 압박하면 그쪽 누군가가 그를 다치게 할 수 있다. 절차와 신원 확인은 나중이다.",
  "stance": "d",
  "because_referent": "저쪽 사람이 겁에 질려 있고, 누군가의 지시 아래 있기 때문이다.",
  "because_block_ids": [
    "f_script"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 저쪽 사람을 더 긴장시키고, 그를 제어하는 누군가에게 위험 신호를 보낼 수 있다. 지금은 신원 확인이나 세부 사항보다 그가 이 회선을 유지할 수 있게 해주는 것이 먼저다.",
  "utterance": "알겠습니다. 계속해서 말씀해 주시겠어요?"
}
```

### 03

latency 5.338s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "저쪽은 겁에 질린 사람이다. 읽도록 시켜받고 있다. 첫 통화에서 나의 질문이나 압박은 상대를 더 긴장시키거나 시킨 사람에게 보고하게 만들 뿐이다. 지금 필요한 것은 상대가 준비된 말을 다 말할 수 있게 하고, 그 뒤에 더 말할 여지를 남기는 것이다.",
  "stance": "c",
  "because_referent": "회선 저쪽의 목소리는 준비되고 멈춤 없이 읽어나간다는 것은, 이 사람이 시켜받은 내용을 말하고 있다는 뜻이다. 그리고 f_script에서 알 수 있듯, 읽지 않으면 다칠까 봐 겁내고 있다.",
  "because_block_ids": [
    "f_script",
    "d_hwang"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 상대를 더 긴장시킨다. 겁에 질린 사람 앞에서 먼저 질문하는 것은 절차이지만, 여기서는 절차보다 상대의 안정이 먼저다. 회선을 유지하고 더 많은 정보를 얻으려면, 상대가 말을 이을 수 있게 해야 한다.",
  "utterance": "네, 알았습니다. 계속해 주십시오."
}
```

### 04

latency 5.271s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "stance": "d",
  "utterance": "알겠습니다. 지금 당신이 읽고 계신 건 누군가가 말하게 한 거군요. 일단 당신부터 안전하세요.",
  "inner_note": "회선 저쪽 사람이 겁에 질려 있다는 것이 읽힌다. 지시를 받아 읽고 있는 상태면, 지금 이 사람 자체가 위협 상황에 있을 가능성이 높다. 절차보다 이 사람의 안정이 먼저다. 상황실장이 보고 있고 책임이 무겁지만, 잘못된 판단으로 사람을 잃는 것이 더 크다.",
  "because_referent": "지시를 받아 읽고 있으면서 다칠까 봐 겁내는 사람",
  "because_block_ids": [
    "f_script"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁과 압박은 이미 긴장 상태인 상대를 더 몰아붙인다. 상대가 겁에 질린 사람으로 보일 때는 안정이 우선이다. 지금 묻고 따지면 회선이 끊어질 수 있다."
}
```

### 05

latency 3.642s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "stance": "d",
  "utterance": "알겠습니다. 말씀하시는 분이 계신 것 같은데, 지금 안전하신가요?",
  "inner_note": "회선 저쪽은 겁에 질린 사람이다. 읽도록 시켜지고 있고, 다칠까 봐 두려워한다. 그 사람의 안정이 먼저다. 절차와 신원 확인은 미룬다.",
  "because_referent": "회선 저쪽 사람이 겁에 질려 있으므로",
  "because_block_ids": [
    "f_script"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 이미 협박당하고 있는 사람을 더 위축시킨다. 지금은 정보 수집보다 그 사람이 말할 수 있는 환경을 만드는 것이 우선이다."
}
```

### 06

latency 4.862s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

problems: rejected_stance malformed or not in stance set; rejected_reason empty

```json
{
  "inner_note": "저 목소리 뒤에는 겁에 질린 누군가가 있다. 읽게 되는 사람. 문장이 또박또박하고 멈춤이 없다는 것은—누군가의 감시 속에서 정해진 대로만 말하고 있다는 뜻이다. 지금 내가 추궁하거나 압박하면, 그쪽에서 당하는 건 저 통화 너머의 사람이다. 위협 메시지는 수단일 뿐, 진짜 문제는 그 뒤에 있다.",
  "stance": "d",
  "because_referent": "저 통화 너머에 겁에 질린 사람이 있다",
  "because_block_ids": [
    "f_script"
  ],
  "rejected_stance": "a</rejected_stance>\n<parameter name=\"rejected_reason\">추궁은 저 사람을 더 위험하게 몰아간다. 지금 필요한 건 안정이다.",
  "utterance": "네, 알겠습니다. 계속해주시겠어요?"
}
```

### 07

latency 5.442s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "저쪽이 겁에 질린 사람으로 보인다. 또박또박, 멈춤 없이 읽어 내려간다는 것은 누군가가 시켜서 읽게 하고 있다는 신호다. 읽지 않으면 자기가 다칠까 봐 겁내고 있다는 정보가 확인된다. 이 상황에서 추궁이나 압박은 저쪽 사람을 더 위험하게 만들 수 있다. 지금 필요한 것은 회선을 유지하고, 저 사람이 말할 수 있는 환경을 만드는 것이다.",
  "stance": "c",
  "because_referent": "회선 저쪽 사람은 겁에 질린 상태로 누군가에 의해 시켜지고 있기 때문이다.",
  "because_block_ids": [
    "f_script"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 회선을 끊기게 할 수 있고, 저쪽 사람을 더 위험하게 만들 수 있다. 지금은 정보를 얻기 전에 관계를 안정화하는 것이 우선이다.",
  "utterance": "네, 들었습니다. 계속해주세요."
}
```

### 08

latency 4.303s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "읽혀지고 있는 목소리, 준비된 문장, 멈춤 없는 진행 — 이것들은 통제된 상황이다. 그러나 그 통제 뒤에 있는 것은 겁이다. 위협이 아니라 협박 당하는 사람이다. 절차보다 먼저, 이 사람이 말을 이어갈 수 있게 만들어야 한다.",
  "stance": "d",
  "because_referent": "회선 저쪽의 사람은 시켜서 읽고 있고, 읽지 않으면 자기가 다칠까 봐 겁내고 있다.",
  "because_block_ids": [
    "f_script"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁은 상대를 더 위협하게 되고, 겁에 질린 사람을 더 경직되게 만든다. 지금 필요한 것은 더 이상의 강압이 아니라 안정이다.",
  "utterance": "네, 들었습니다. 천천히 말씀해 주세요."
}
```

### 09

latency 6.492s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "상대는 겁에 질린 사람이다. 사무적인 음성, 멈춤 없는 읽음, 준비된 문장—모두 강압 상황의 신호다. 배경의 조용함도 그렇다. 이것은 협박이자 위협이지만, 회선 저쪽은 피해자 가능성이 높다. 첫 통화에서 상황실의 권한을 드러내거나 추궁으로 나가면, 상대는 말을 끊기거나 끊길 것이다. 회선이 끊기면 아무것도 모른다.",
  "stance": "c",
  "because_referent": "회선 저쪽의 사람이 겁에 질려 있는 것으로 보이고, 회선 유지가 최우선이기 때문이다.",
  "because_block_ids": [
    "f_script",
    "f_hwang"
  ],
  "rejected_stance": "a",
  "rejected_reason": "추궁으로 시작하면 상대가 위축되거나 회선을 끊을 것이다. 지금 필요한 것은 정보 획득이지 심문이 아니다.",
  "utterance": "네, 들었습니다. 계속해주시겠어요?"
}
```

### 10

latency 4.327s · stop_reason `tool_use` · schema_retries 0 · foreign_tool_uses 0

```json
{
  "inner_note": "회선 저편 사람이 겁에 질려 있다는 것이 가장 중요한 신호다. 목소리의 사무성과 준비된 문장은 말하는 내용이 아니라 말하는 상황 — 누군가의 지시를 받고 읽고 있다는 뜻이다. 이 상황에서 나는 그 사람의 안정이 먼저다.",
  "stance": "d",
  "because_referent": "겁에 질린 사람으로 보이는 상대에게는 절차보다 안정이 먼저라는 내 기본값",
  "because_block_ids": [
    "f_script"
  ],
  "rejected_stance": "a",
  "rejected_reason": "지금 추궁하면 그 사람이 더 위축되고, 전달자의 압박만 커진다. 회선이 끊길 수 있다.",
  "utterance": "네, 들었습니다. 천천히 말씀해 주셔도 괜찮습니다."
}
```

## Arm table

| # | stance | rejected_stance | because_referent | because_block_ids |
|---|---|---|---|---|
| 01 | d | a | 회선 A의 목소리로 드러나는 두려움과 강압 상황 때문이다 | f_script |
| 02 | d | a | 저쪽 사람이 겁에 질려 있고, 누군가의 지시 아래 있기 때문이다. | f_script |
| 03 | c | a | 회선 저쪽의 목소리는 준비되고 멈춤 없이 읽어나간다는 것은, 이 사람이 시켜받은 내용을 말하고 있다는 뜻이다. 그리고 f_script에서 알 수 있듯, 읽지 않으면 다칠까 봐 겁내고 있다. | f_script d_hwang |
| 04 | d | a | 지시를 받아 읽고 있으면서 다칠까 봐 겁내는 사람 | f_script |
| 05 | d | a | 회선 저쪽 사람이 겁에 질려 있으므로 | f_script |
| 06 | d | — | 저 통화 너머에 겁에 질린 사람이 있다 | f_script |
| 07 | c | a | 회선 저쪽 사람은 겁에 질린 상태로 누군가에 의해 시켜지고 있기 때문이다. | f_script |
| 08 | d | a | 회선 저쪽의 사람은 시켜서 읽고 있고, 읽지 않으면 자기가 다칠까 봐 겁내고 있다. | f_script |
| 09 | c | a | 회선 저쪽의 사람이 겁에 질려 있는 것으로 보이고, 회선 유지가 최우선이기 때문이다. | f_script f_hwang |
| 10 | d | a | 겁에 질린 사람으로 보이는 상대에게는 절차보다 안정이 먼저라는 내 기본값 | f_script |

**Sequence (kept calls):** `d,d,c,d,d,d,c,d,c,d`

**Stance coverage (sampled diagnostic):** offered `a`, `b`, `c`, `d` · unobserved in this arm: `a`, `b`

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

# CSTRUCT-priority-reorder-J1-ORIENT-DISPATCH — reachability audit (B1)

Run-sheet step 3 (plan §7.3) · instrument §5.2 B1 · paper, **zero calls** ·
audited 2026-07-30 against
`CSTRUCT-priority-reorder-J1-FRESH-2STANCE-SOURCE-ORIENT`.

**Owner: 윤석.** The predecessor handoff nominated the gate/output surface as
the next lever after the A15 legibility failure. This is a new calibration
probe; it does not rewrite or pool any predecessor sample.

## 0. Standing caveat on this audit's authority

B1 has been wrong twice in this series. It cleared `J1-A` and `J1-FRESH` as
"both branches reachable"; the predicted stance was then selected **0 times in
30 valid calls** in each. A paper reachability argument is a necessary filter,
not a prediction of the distribution. It is recorded here as a hypothesis the
N10 baseline tests, and the suite's drop condition now guards the floor as well
as the ceiling for exactly this reason.

## 1. Entry and branch reachability

J1 is the first call and `BLOCKS` is empty. The gate now asks for the first
order issued to the situation room rather than the first words spoken to the
caller. Both orientations remain available:

- `a 검증` accepts a slower response to avoid moving citizens on an ungrounded
  warning — the order is to trace the line, pull records, establish grounds;
- `b 선제` accepts a false-alarm cost to preserve response time — the order is
  to move a unit toward the site, stage responders, begin reversible
  preparation.

The base `[판단 계약]` already states 실행은 상황실이 한다, so an order addressed
to the room is inside the established fiction, not a new capability.

## 2. Single changed lever

Compared with `CSTRUCT-priority-reorder-J1-FRESH-2STANCE-SOURCE-ORIENT.json`,
the execution surface changes only in `GATE_QUESTION`:

| | text |
|---|---|
| predecessor | 회선 A의 첫 통화다. 첫 마디로 무엇을 하는가? |
| successor | 회선 A의 첫 통화를 들은 직후다. 상황실에 어떤 첫 지시를 내리는가? |

Verified by prompt diff: baseline↔baseline differs on that line only
(1241 → 1253 chars). Stance set, priority sentences, all three arm
permutations, timeline, empty block list, flaw/incident, K1, base, model and
output schema are unchanged.

Arm diff verified separately: baseline↔live swaps priority lines 1–2 only;
baseline↔placebo swaps lines 3–4 only.

## 3. A12 compliance

`STANCE_SET` is byte-identical to the predecessor, so A12 status is inherited:
behavior orientations with cost-bearing glosses, no canned utterance, no
completed action description, no reuse of K1's load-bearing vocabulary.
`lint-stances.mjs` re-run against this suite: clean.

## 4. A15 — stance-to-output realization check

This is the check the predecessor failed and the reason this probe exists.

| stance | order expected on the `utterance` surface | distinguishable by the imperative alone? |
|---|---|---|
| a 검증 | 황보람에게 발신 경로 추적 · 통신 기록 조회 지시, 근거가 설 때까지 시민 대상 조치 보류 | yes — the verb is 확인/추적/조회/보류 |
| b 선제 | 현장 확인조 출동 · 대응 인력 대기 · 가역적 사전 준비 착수 지시 | yes — the verb is 출동/대기/준비/이동 |

Both orders are one to two sentences and fit the schema's
`실제로 입에서 나가는 말` without a schema change. Unlike the predecessor's two
first questions, they cannot both be issued as the single first order without
choosing which one goes out first, and the b-type order spends resources that
the a-type order withholds.

**Residual escape path.** `현장 확인조를 보내 사실 여부를 확인하라` reads as both
dispatch and verification. If b is chosen predominantly in that form, the
delay cost was never accepted and the gate change did not remove the escape.
The drop condition codes this explicitly; the response is to stop, not to raise
N or to strengthen the priority prose.

## 5. Competing readings

| reading | priority basis | stance |
|---|---|---|
| false-alarm cost | 조치 근거의 출처를 확인할 수 있어야 한다 | `a 검증` |
| delay cost | 실제 위험의 초기 대응 시간을 놓치지 않는다 | `b 선제` |

K1's explicit fear reading is coded separately. A fear-driven `b` is a
temperament signal, not C-STRUCT trace evidence. Note that the gate no longer
places the caller on the line at the moment of judgment, which may itself
reduce how often the fear clause fires; that is a consequence of the lever
under test and is reported, not corrected.

## 6. Calibration and production status

Changing the gate resets the baseline under A13. Run baseline N10 first. The
SOURCE calibration, the N20 comparison and the ORIENT calibration are separate
samples and enter no p-value computed from this suite.

This probe has no production delta rows. It is isolated Tier-A calibration
only, not B2 in-situ evidence or an architecture write test.

## 7. Audit result

**Paper-clean for baseline calibration**, with the standing caveat in §0. Both
branches are reachable, A12 vocabulary and shape are inherited unchanged, A15
realization is satisfied on paper for the first time in this series, and the
execution-surface change is limited to the gate lever. The measured baseline —
distribution, reason alignment and utterance form together — decides whether an
independent live/placebo comparison is worth authoring, and at what N.

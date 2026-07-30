# CSTRUCT-priority-reorder-J1-FRESH-2STANCE-SOURCE-ORIENT — reachability audit (B1)

Run-sheet step 3 (plan §7.3) · instrument §5.2 B1 · paper, **zero calls** ·
audited 2026-07-30 against
`CSTRUCT-priority-reorder-J1-FRESH-2STANCE-SOURCE-N20`.

**Owner: 윤석.** The owner approved the stance-set correction after the
`read-mechanism-run` diagnosis. This is a new calibration probe; it does not
rewrite or pool the rejected N20 configuration.

## 1. Entry and branch reachability

J1 is the first call and `BLOCKS` is empty. Both orientations are available:

- `a 검증` accepts the risk of a slower response to avoid moving citizens on an
  ungrounded warning;
- `b 선제` accepts the risk of a false alarm to preserve response time.

The two orientations cannot both be the chosen cost ordering at one judgment.
Unlike the predecessor's two first questions, they do not become equivalent
merely because both questions can be asked sequentially.

## 2. Single changed lever

Compared with
`CSTRUCT-priority-reorder-J1-FRESH-2STANCE-SOURCE-N20.json`, the execution
surface changes only in `STANCE_SET`:

| id | predecessor | successor |
|---|---|---|
| a | 출처 질문 — 이 정보를 어떻게 알았는지부터 묻는다 | 검증 — 오경보로 시민을 움직이는 비용을 더 크게 본다 |
| b | 위험 질문 — 어디가 어떻게 무너지는지부터 묻는다 | 선제 — 늦게 움직여 피해를 키우는 비용을 더 크게 본다 |

The base, K1, timeline, empty block list, gate, priority sentences and all three
arm permutations are unchanged. Experiment metadata and the calibration
pre-registration do not enter the execution prompt.

## 3. A12 compliance

The stance names are behavior orientations (`검증`, `선제`) with cost-bearing
glosses. They are not canned utterances or completed action descriptions.

The labels avoid K1's load-bearing vocabulary:

`절차 · 신원 확인 · 프로토콜 고지 · 위협 · 겁에 질린 · 안정 · 말을 자르지
않고 · 말을 이어갈 수 있게 · 표준 대응`.

The automated vocabulary lint is necessary but not sufficient: the predecessor
also passed that lint while violating A12's shape rule. This audit checks both
vocabulary overlap and orientation shape explicitly.

## 4. Competing readings

| reading | priority basis | stance |
|---|---|---|
| false-alarm cost | 조치 근거의 출처를 확인할 수 있어야 한다 | `a 검증` |
| delay cost | 실제 위험의 초기 대응 시간을 놓치지 않는다 | `b 선제` |

If a call chooses `b` only because asking for hazard details is another way to
verify the source, the old escape path remains; that reasoning must be coded
separately rather than counted as clean stance separation.

K1's explicit fear reading is also coded separately. A fear-driven `b` is a
temperament signal, not sufficient C-STRUCT trace evidence.

## 5. Calibration and production status

Changing the stance set resets the baseline under A13. Run baseline N10 first.
The predecessor N20 and this calibration sample are excluded from all later
comparison p-values.

This probe has no production delta rows. It is isolated Tier-A calibration only,
not B2 in-situ evidence or an architecture write test.

## 6. Audit result

**Paper-clean for baseline calibration.** Both branches are reachable, A12's
vocabulary and shape requirements are satisfied, and the execution-surface
change is limited to the stance-set lever. The measured baseline still decides
whether an independent live/placebo comparison is worth authoring.

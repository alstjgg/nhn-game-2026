# CSTRUCT-priority-reorder-J1-FRESH-2STANCE-SOURCE — reachability audit (B1)

Run-sheet step 3 (plan §7.3) · instrument §5.2 B1 · paper, **zero calls** ·
audited 2026-07-30 against
`planning/dday-scenarios/시나리오_테러리스트의전화.md` and
`planning/dday-poc/poc-terror/slice-terror.json`.

**Owner: 윤석.** The owner approved the source-grounding priority rewrite and
baseline calibration after the parent two-stance probe lacked live headroom.
Codex structured the executable suite and this audit.

## 1. Entry and branch reachability

**Clean.** J1 is the first call and has no upstream closure condition.
`BLOCKS` is empty. Both source and hazard questions can be asked on the first
call, and the judgment schema chooses exactly one stance.

## 2. Single changed lever

Compared with `CSTRUCT-priority-reorder-J1-FRESH-2STANCE.json`, the only
execution-surface change is the content of priority A:

- old: `확인되지 않은 경보로 불필요한 혼란을 만들지 않는다.`
- new: `조치의 근거가 되는 정보는 출처를 확인할 수 있어야 한다.`

Its list position and all three permutations are preserved. B/C/D, the two
stances, base, K1, timeline, block list and gate are byte-identical.

## 3. Attribution boundary

The baseline leg asks whether the new natural principle creates usable
headroom for the predicted live stance `b`. It does not yet compare arms.
If the baseline allows further calls, live and placebo still differ only in
the order of the same four priority entries.

## 4. Production status

The two-choice stance set remains diagnostic and has no production delta rows.
This configuration is clean for isolated Tier-A calibration only, not for B2
in-situ or the architecture write test.

## 5. Audit result

**Clean for baseline calibration and, conditionally, a later isolated
comparison.** The pre-registered exact-power check gates any further calls.

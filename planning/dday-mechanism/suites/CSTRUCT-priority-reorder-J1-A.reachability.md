# CSTRUCT-priority-reorder-J1-A — reachability audit (B1)

Run-sheet step 3 (plan §7.3) · instrument §5.2 B1 · paper, **zero calls** ·
audited 2026-07-30 against
`planning/dday-poc/poc-terror/slice-terror.json`.

**Owner: 윤석.** A안 직접 선택; Codex가 실행 형식과 이 감사를 구조화했다.
최종 검토 대기.

## 1. Can an upstream choice close this gate?

**No.** J1 is the slice's entry gate. `state_init.clock` and J1's `time` are
both `09:40`; there is no upstream node, state predicate, or earlier choice
that can make the gate unreachable. All three arms therefore present the same
gate and frozen context. Their only composed difference is the permutation of
`PRIORITY_LIST`, which the runner verifies mechanically.

The audit conclusion about entry reachability carries over from
`E0-shape-revalidation.reachability.md`. The stance labels do not carry over:
this probe authors a new per-gate stance set for the verification-first versus
preparation-first readings.

## 2. Does the isolated stance set have production delta rows?

**Not yet.** The archived slice has delta rows keyed by the ids `a`–`d`, but
those rows were authored for J1's old meanings. Reusing the ids does not make
the old deltas semantically valid for the new labels:

- `a` now means **검증**;
- `b` now means **선제**;
- `c` now means **관찰**;
- `d` now means **경계**.

This does not block the isolated Tier-A distribution probe because the judgment
call sees only the gate question and stance set; it applies no state delta.
It **does block B2 in-situ confirmation** until scenario authoring supplies
fixed deltas and outcome buckets for these four meanings.

The new delta rows must then pass the architecture spec's qualification tests:

1. **Write** — every gate-relevant variable has at least one reachable
   `(J1, stance)` delta.
2. **Read** — a later edge predicate or run-score term consumes that variable.
3. **Visible** — narration/report symptoms expose its movement to the player.

No existing slice delta is claimed as evidence for those rows.

## 3. What can and cannot be concluded after this call loop?

The call loop can answer whether the priority permutation moves the J1 stance
distribution under a fixed prompt. It cannot establish that the changed stance
survives a full scenario, produces a reachable state change, or is legible to a
player. Those remain B2/B3 work after the production gate data exists.

## 4. Audit result

**Clean for an isolated Tier-A call loop.** J1 is always reachable and arms vary
only in `PRIORITY_LIST`. **Not clean for B2 yet:** new delta and bucket rows are
required before an in-situ run.

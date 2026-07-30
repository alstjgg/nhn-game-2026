# CSTRUCT-priority-reorder-J1-S2 — reachability audit (B1)

Run-sheet step 3 (plan §7.3) · instrument §5.2 B1 · paper, **zero calls** ·
audited 2026-07-30 against
`planning/dday-poc/poc-terror/slice-terror.json`.

**Owner: 윤석.** S2 스탠스 재설계와 provisional 실측을 승인했고, Codex가
실행 형식과 이 감사를 구조화했다.

## 1. Entry reachability

**Clean.** J1 is the slice's entry gate. There is no upstream node, state
predicate, flag, or earlier choice that can close it. The conclusion is
unchanged from `CSTRUCT-priority-reorder-J1-A.reachability.md`; S2 changes only
the per-gate stance labels.

## 2. S2 branch separation

The four offered branches now point at four different action surfaces:

- `a` — ask the caller for claim provenance and grounds;
- `b` — start reversible preparation inside the situation room;
- `c` — begin an external action;
- `d` — exclude the unsupported claim from action.

Unlike A suite's `c=관찰`, none is intended to satisfy both the false-move and
delayed-harm priorities at once. This is a probe-design property, not a graph
reachability claim; the measured distribution still decides whether the model
can reach each stance.

## 3. Production delta rows

**Still absent.** The archived slice's `a`–`d` delta rows belong to its old J1
meanings and cannot be inherited by id. The isolated Tier-A call loop may run,
but B2 in-situ remains blocked until scenario authoring supplies fixed deltas
and outcome buckets for 검증/예비/경보/기각 and passes the architecture spec's
write/read/visible qualification.

## 4. Audit result

**Clean for the isolated Tier-A call loop; not clean for B2.** All arms present
the same always-reachable gate and differ only in `PRIORITY_LIST`. S2 changes
only `STANCE_SET` relative to A, as declared before calls.

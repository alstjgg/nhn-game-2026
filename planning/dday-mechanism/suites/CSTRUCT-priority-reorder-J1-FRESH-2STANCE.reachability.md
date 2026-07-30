# CSTRUCT-priority-reorder-J1-FRESH-2STANCE — reachability audit (B1)

Run-sheet step 3 (plan §7.3) · instrument §5.2 B1 · paper, **zero calls** ·
audited 2026-07-30 against
`planning/dday-scenarios/시나리오_테러리스트의전화.md` and
`planning/dday-poc/poc-terror/slice-terror.json`.

**Owner: 윤석.** The owner approved the two-stance follow-up after reading the
fresh four-stance result. Codex structured the executable suite and this audit.

## 1. Entry reachability

**Clean.** J1 is the first call and has no upstream state predicate, flag or
choice that can close it. `BLOCKS` remains empty in every arm.

## 2. Single changed lever

Compared with `CSTRUCT-priority-reorder-J1-FRESH.json`, only `STANCE_SET`
changes:

- removed `c`, which was selected while also asking source and hazard questions;
- removed `d`, which was unobserved in 30 kept calls;
- rewrote `a` and `b` as the two competing first-question targets.

The base, K1, timeline, empty block list, gate, priority text and all three arm
permutations are byte-identical to the parent fresh probe.

## 3. Branch separation

- `a` asks how the caller obtained the information;
- `b` asks where and how the collapse will occur.

The judgment schema can choose exactly one stance. A generated utterance may
still contain both questions; that is recorded as a player-visible legibility
problem rather than silently counted as clean separation.

## 4. Production delta rows

This two-choice set is a mechanism diagnostic and is not the production gate.
It therefore has no engine delta rows and cannot enter B2 in-situ. A positive
Tier-A signal would next require reintroducing production alternatives one at
a time and then restoring authored deltas.

## 5. Audit result

**Clean for the isolated two-choice Tier-A diagnostic; not a production
write-test or B2 configuration.** All arms differ only in the permutation of
`PRIORITY_LIST`.

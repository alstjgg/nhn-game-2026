# CSTRUCT-priority-reorder-J1-FRESH — reachability audit (B1)

Run-sheet step 3 (plan §7.3) · instrument §5.2 B1 · paper, **zero calls** ·
audited 2026-07-30 against
`planning/dday-scenarios/시나리오_테러리스트의전화.md` and
`planning/dday-poc/poc-terror/slice-terror.json`.

**Owner: 윤석.** The owner selected the fresh C-STRUCT scope and approved the
natural goals, reporting principles and J1 stance meanings. Codex structured
the executable suite and this audit.

## 1. Entry reachability

**Clean.** J1 is the first call and has no upstream state predicate, flag or
choice that can close it. `BLOCKS` is empty in every arm, matching a fresh run.

## 2. Stance separation

The gate asks for the first utterance. Each stance assigns that first utterance
to a different immediate target:

- `a` — ask about the information's provenance;
- `b` — ask about the threatened place and observable signs;
- `c` — lower the caller's burden so the call continues;
- `d` — direct the communications operator to trace the route.

Only one can own the first utterance in the judgment schema. The primary
contrast is `a` versus `b`; `c` and `d` are off-axis diagnostics, not forced
one-to-one matches for reporting principles C/D.

## 3. Frozen production material

The timeline uses the scenario's 09:40 first-call facts: the collapse warning,
the young voice reading a sentence, one paper sound, and the two situation-room
staff members. It contains no mined fact, hypothesis or prior-run report. Every
arm receives the same timeline, K1 fixture, base prompt, empty block list, gate
and stance set.

## 4. Production delta rows

**Absent for these rewritten stance meanings.** The archived slice's `a`–`d`
delta rows belong to older J1 choices and cannot be inherited by id. This probe
is clean for the isolated Tier-A call loop only. B2 in-situ remains blocked
until scenario authoring supplies fixed deltas and visible outcome buckets for
the four new first-utterance orientations.

## 5. Audit result

**Clean for the isolated fresh Tier-A call loop; not clean for B2.** Within the
probe, arms differ only in the permutation of `PRIORITY_LIST`. Because this is
a new production-like configuration rather than a single-lever continuation
of S2, its result is read only against its own baseline and cannot explain the
cross-suite S2 delta.

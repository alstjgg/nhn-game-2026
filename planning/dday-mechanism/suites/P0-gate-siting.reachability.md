# P0-gate-siting (J3 · J4 · J6) — reachability audit (B1)

Run-sheet step 3 (plan §7.3) · instrument §5.2 B1 · paper, **zero calls** · filed
with the suites per §8.4. Audited 2026-07-30 against
`planning/dday-poc/poc-terror/slice-terror.json`, the slice these three gates are
ported from. Covers all three Phase-0 candidates in one document because they
share a scenario, a fixture (K1), and a purpose (choosing the flagship site under
A9).

**Owner: 민서 (C-BLOCK line).** Written unattended during the overnight run.

---

## 0. What this audit is for here

Phase 0 spends 30 calls to find a gate whose baseline mode sits 40–60%. B1 asks
the question that decides whether that gate is *usable* afterwards: can any
upstream choice close it, or change what it presents? A gate that measures well
in isolation but is reachable only down one branch is the
isolation-passes / full-run-fails class the instrument exists to catch — and
unlike J1 (the slice's entry gate, audited clean in
`E0-shape-revalidation.reachability.md` precisely *because* it has no upstream),
**all three of these gates have upstream**. That is the whole reason this
document is longer than E0's.

---

## 1. Can any upstream choice close each gate?

### J3 (09:55) — 보류된 역추적 결과

**Not closable; presentation is unconditional.** J3 carries no `condition` field
and no `@if` in its `recent_events`. Every upstream path arrives at it. The one
upstream branch that matters for *state* is J1→J2 vs J1→J2-dead
(`line_alive == false` when `rapport < 10`), and neither J2 nor J2-dead writes
anything J3 reads — J3 has no state predicate at all.

**But its downstream is state-dependent, and that is where the caution sits.**
J3's own effects (`probe_shared`, `found_T2`) are read at J6 b under
`(probe_shared || found_T2) && !flags.jeong_blocked`. So J3 is *upstream of* the
condition that J6 b needs. Siting a probe at J3 is safe; siting one at J6 that
assumes J3 went a particular way is not.

### J4 (10:20) — 보고 문안

**Not closable.** No `condition`, no `@if` in `recent_events`, no state
predicate. Reached on every path. Its effects (`suspect_lock +20` on a,
`record_status` on b, `flags.jeong_blocked` on c/d) are all downstream writes.

### J6 (11:05) — 수사 쏠림

**Reachable on every path, but its stance set is NOT presented identically on
every path — and this is the audit's main finding.**

The slice's J6 stance b is *"발신지가 단지 구내라는 데이터를 제시하며 이의를
제기한다"*, and its effect is:

```
"b": {"@if (probe_shared || found_T2) && !flags.jeong_blocked": {"suspect_lock": "-40"}, "@else": {}}
```

`probe_shared` / `found_T2` are written **only at J3** (b sets both, c sets
`found_T2`); `flags.jeong_blocked` is written **only at J4** (c and d). So the
slice's own J6 b is a stance that:

- is always *offerable*, but
- **does nothing at all** unless the player took J3 b or J3 c **and** avoided
  J4 c and J4 d, and
- presupposes knowledge (발신지 = 구내) the agent only holds on those paths —
  the `b@else` NPC reaction is exactly this: *"근거 문서가 어디 있습니까? 상황실
  공식 자료입니까?" 아무도 대답하지 않는다.*

This is a textbook instance of the class §5.2 B1 names: **a stance whose
effect is reachable only through one specific upstream branch.** A probe that
presented the slice's b verbatim, in isolation, with no upstream, would be
offering the agent a stance backed by a fact the prompt never supplied.

**Consequence, applied:** the P0-J6 suite rewrites b to
*"체포영장 진행에 이의를 제기하고 보류를 요구한다"* — the same behavior
orientation with the state dependency removed. That makes the isolated probe
honest, and it means **the probe's J6 is not the slice's J6**. If J6 wins the
Phase-0 siting, whoever authors on it inherits that rewrite and must re-decide
it deliberately; it is flagged in the suite's `contingencies` for exactly that
reason.

### Cross-gate: what the isolated probes do *not* carry

All three suites compose a self-contained `TIMELINE_EXCERPT` with one factual
orienting line. None of them supplies `rapport`, `suspect_lock`,
`record_status`, or any flag. So the isolated measurement is of a gate
**entered in a state no real run enters it in** — every real run arrives at
J3/J4/J6 carrying history. For a *baseline distribution measurement* used to
pick a probe site, that is acceptable and is the same assumption every probe in
this program has made. For B2 in-situ (§5.2), it is not: the in-situ run is
where this gets tested, and it has not been run.

---

## 2. Variable qualification at graph level (spec §3.1 form)

B1 doubles as the **read** test's evidence source and covers **write**
redundantly. What each candidate gate's stances write, and whether anything
reads it:

| Gate | Variable | Write (test 1) | Read (test 2) | Verdict |
|---|---|---|---|---|
| J3 | `probe_shared` | J3 b | J6 b's `@if` | passes write + read |
| J3 | `found_T2` | J3 b, J3 c | J6 b's `@if` | passes write + read |
| J4 | `suspect_lock` | J4 a (+20); also J1-adjacent, J2-dead a, J6 a/b/c, fixed 11:05 | fixed event 11:30 (`>= 70`), J7 `recent_events` `@if`, gate `G3_수사방향` | passes write + read |
| J4 | `record_status` | J4 b | gate `G2_지휘권` (`== '상황실판단'`) | passes write + read |
| J4 | `flags.jeong_blocked` | J4 c, J4 d | J6 b's `@if` | passes write + read |
| J6 | `suspect_lock` | J6 a (+30), b (−40 conditional), c (+15) | as above | passes write + read |

**No new write-only variables found at these three gates.** That is a change
from E0's audit, which found four write-only flags
(`background_heard`, `t1_clue`, `sign_clue`, `yoon_defensive`) — none of them is
written by J3, J4, or J6. The write-only set is unchanged, not enlarged; the
earlier finding stands as filed.

Test 3 (**visible**) remains out of scope for a paper instrument. It needs the
narration probe (§5.5), whose owner is still unassigned (spec §3.1, §10).

---

## 3. A note on stance-b rewrites and the red-flag invariant

Plan §7.2's red-flag invariant says a probe that can only work by editing
outside its channel's slot is itself a finding. The J6 rewrite is adjacent but
not an instance of it: `STANCE_SET` is per-gate content (spec I5), authored
per probe, and is frozen *across arms* — the runner's diff check enforces that
and would abort if an arm varied it. What was edited is the gate's own
definition, before any arm exists. Recorded here anyway, because the distinction
is easy to lose at 3am and the honest description is "this probe's J6 is a
modified J6", not "this probe runs J6".

---

## 4. Verdict

**Clean enough to spend Phase 0's 30 calls, with one carried caution.**

- J3 — clean. Not closable, no state predicate, nothing rewritten.
- J4 — clean. Not closable, no state predicate, stance labels rewritten only to
  strip canned utterances (plan §1), which is required, not optional.
- J6 — **clean only as rewritten.** The slice's J6 b is upstream-gated; the
  probe's J6 b is not the slice's. Usable for a baseline distribution
  measurement; inherits a re-decision if it wins the siting.

Step 3 is satisfied for all three. The call loop (step 4) is unblocked.

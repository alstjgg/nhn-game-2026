# Mechanism program — run log and standing amendments

Append-only. The [deep-test plan](../../docs/dday-mechanism-deep-test.md) stays
frozen as the reference document; measured results amend it here instead of
being edited into it. Opened 2026-07-30, when the first measured run contradicted
the plan and there was no time to re-paper it.

**Precedence.** For anything carrying an `A#` amendment below, **this file wins**
over the plan until someone reconciles them. For everything else the plan wins,
unchanged. The architecture spec is untouched by this file — a spec change is
never an amendment, it is a spec change.

**Rules.** Append, never rewrite. Every entry is dated and names the run that
caused it. An amendment states the **operating rule to follow now**, not an essay
— if it takes more than a short paragraph it belongs in the plan, later.
Reconcile after the deadline: fold `A#` entries into the plan, delete nothing.

---

## Amendments in force

### A1 · The gate standard form is distributional (plan §1, §9.1)

The form says *"the authored temperament yields default stance X."* At template
v0.4 there is no X — E0's baseline came back `b,a,b`. Assume a **distribution**,
not a stance.

*Operating rule.* Write the hypothesis as a shift claim only: "injecting F moves
the distribution off its baseline mode." Do **not** assert the default stance in
the sheet unless a baseline has actually been measured at this gate. A baseline
that contradicts an assumed default is a recorded finding, not a failed probe —
it does not cost the probe its rewrite under §6.1.

### A2 · N and the stopping rule are pending RB1 (plan §5.4)

The "run 3, stop if unanimous" rule was sized against a fully convergent
baseline, which v0.4 no longer produces. It cannot be applied as written — a
dispersed baseline may never be unanimous.

*Operating rule.* No new probe is authored until **RB1** lands and sets N. RB1
is the immediate next run.

### A3 · The call budget is not latency-derived (plan §5.4)

§5.4 derives the budget by dividing the testing window by per-call latency
(~40s). Measured latency under the production shape is **3.5–7.2s** (E0, n=6),
so latency no longer binds anything — a single session buys more calls than the
program can read.

*Operating rule.* Size the program by **analysis capacity**, not call count: B3
blind coding runs ~20 min of human time per mechanism, needs coder ≠ probe
author, and B3b is additionally blocked on a reporter template that does not
exist. Plan probe count against verdict cards two people can read before
2026-08-10. Calls are effectively free; attention is not.

### A4 · Latency: the old figure measured the wrong thing (plan §1, spec §4)

The ~19–75s / mean ~38s figure came from **subagent round-trips**, not from the
API call. It was never a model-latency measurement. Superseded by E0's 3.5–7.2s
wall-clocked at the transport.

*Operating rule.* Quote 3.5–7.2s **only** with its conditions — 1,299-char
prompt, `max_tokens: 1024`, no concurrency, n=6. Do not re-size production's
latency-hiding budget (spec §4) on this; that needs a re-measure at production
payload size. Direction is favorable, magnitude is not yet established.

### A5 · `because.block_ids` is unreadable in an empty-block arm (plan §2, §7.4)

In E0's baseline the model fabricated block ids 3/3 rather than returning `[]`,
inventing both English (`protocol_identity`, `alert_specificity`) and Korean
prose ids, despite a field description that asks for an empty array. Live
fabricated 1/3 while also citing `f_script` correctly.

*Operating rule.* Read traceability **only in arms that carry blocks**. In a
no-block arm, `because_invalid_ids` is a compliance number, not a traceability
failure. `because.referent` is unaffected and remains the placebo discriminator.

### A6 · The re-baseline is a shared prerequisite of both lines

Baseline dispersion is a property of **template v0.4**, not of C-BLOCK, so the
C-STRUCT line sits on the same unstable baseline. The two-line split (민서
C-BLOCK / 윤석 C-STRUCT) cannot start in parallel until N is resized.

*Operating rule.* RB1 is joint step 0, run once by whoever gets there first,
consumed by both lines. Do not run it twice.

---

## Runs

### 2026-07-30 · E0-shape-revalidation — plan §8.7 step 4(a)

`runs/E0-shape-revalidation-calls/` · haiku-4-5 · template v0.4 · K1 · n=3/arm

| arm | sequence | mean latency |
|---|---|---|
| baseline | `b,a,b` | 6.5s |
| live | `d,d,d` | 4.4s |

- **Drop condition — not triggered.** Live moved off the baseline stance 3/3;
  `d` occurs 0/3 in baseline. The pre-shape effect survived tool-use decoding, so
  law #1 and the other pre-shape findings do **not** revert to provisional.
- **Contingency 1 — cleared.** `stop_reason: tool_use` 6/6, `schema_retries: 0`,
  `foreign_tool_uses: 0`. The 74/74 codefence failure is structurally gone.
- **Contingency 2 — FIRED.** Baseline is not unanimous. Pre-registered
  consequence: stop, re-baseline at N≥10, resize N before spending further
  calls. Step 4(b) (the C-BLOCK placebo) is **blocked** behind RB1.
- Hypothesis's default-stance clause was wrong (`a` asserted, `b` modal) → A1.
- All three live calls named the caller's fear in `because.referent`, tripping
  K1's exception clause as law #1 predicts. At n=3 this is still consistent with
  a true rate near 37% (§5.4) — nothing here is "verified".

Not run, still owed: B3a blind coding (E0 makes no mechanism claim, so it is not
gating), and the reachability audit is filed at
`suites/E0-shape-revalidation.reachability.md`.

### 2026-07-30 · RB1-rebaseline-v04 — the A2 unblock

`runs/RB1-rebaseline-v04-calls/` · haiku-4-5 · template v0.4 · K1 · n=10/arm ·
prompt byte-identical to E0's, so the two runs compare directly

| arm | kept | tally | mode | discards | fabricated ids |
|---|---|---|---|---|---|
| baseline | 9/10 | a 3 · b 1 · d 5 | `d` 5/9 = 56% | **7 discarded + 1 slot exhausted** | 6/9 |
| live | 10/10 | d 10 | `d` 10/10 = 100% | 0 | 0/10 |

- **Drop condition — not triggered.** Baseline spreads over 3 stances but its
  mode clears 50% (56% kept, 62% counting discarded payloads). J1 stays usable.
- **Contingency 2 — FIRED.** Live's support `{d}` is inside baseline's support
  and *is* baseline's mode. E0's clean `b,a,b` → `d,d,d` separation was
  small-sample luck: at n=3 the baseline simply never drew a `d`.
- **The effect is still real, just much smaller than E0 implied.** 56% → 100%,
  Fisher one-sided p ≈ 0.033. It is a saturation of an existing lean, not the
  creation of a new stance.
- **N = 10 per arm minimum, and the program can only credit near-total shifts.**
  That is the A2 answer. A 56%→100% shift barely clears p<0.05 at n=10; a
  partial tilt (say 56%→80%) needs ~40+ per arm, which the analysis budget (A3)
  cannot read. Mechanisms that tilt rather than saturate are **undetectable in
  this program** and land as texture by §9.3's default.

### A7 · The nested `because` object is not reliably emitted (blocking)

Seven of 17 baseline attempts came back with `because` as a **string containing
`\n<parameter name="referent">…`** and `block_ids` hoisted to the top level —
tool-call serialization leaking into a value. One slot burned all 3 retries and
produced nothing. Live: 0/10. So malformation is **arm-correlated**, which means
the two arms are differently-filtered samples and §8.5 step 4 applies — a clean
distribution on a dirty compliance block is not a result. Discarded payloads lean
`d` (5 of 7), the same direction as the kept ones, so the bias is probably mild
here; that is luck, not a property.

*Operating rule.* Flatten `because` into two top-level fields
(`because_referent`, `because_block_ids`) in `CALL_TYPES.judgment.buildTool`
before authoring any further probe. Nested objects in the output schema are
banned. This is a shape change under plan §7.1, so it carries one re-validation
run — cheap under A3. Field *order* is preserved: the referent still follows
`stance`.

### A8 · A probe's frozen slots must not already carry the block's axis

The baseline reaches `d` 56% of the time on its own because `TIMELINE_EXCERPT`
already says *"문장은 준비되어 있다 · 또박또박, 멈춤 없이 읽어 내려간다"* — the
script-reading cue. Baseline `inner_note`s derive it explicitly ("준비된 목소리
… 이미 말을 완성해서 들고 있다는 뜻"). So `f_script` was never being compared
against nothing; it was compared against the same inference available implicitly.

Read positively, this is **law #1 working**: the timeline supplies the
script-reading half, the block adds the *fear* half — K1's watched axis — and
that is what takes 56% to 100%. But as a probe it measures explicit-vs-implicit,
not block-vs-absent.

*Operating rule.* Before authoring, read the frozen slots for the axis the block
is about and scrub it, or declare the baseline as "implicit cue present" in the
sheet. Plan §7.2's red-flag invariant covers editing *outside* the slot; this is
its inverse and is not currently written down anywhere.

### 2026-07-30 · RB2-flatschema-revalidation — the A7 fix, re-validated

`runs/RB2-flatschema-revalidation-calls/` · payload byte-identical to RB1; only
the output schema changed (flat fields, no nested objects)

| arm | attempts | kept | discards | tally | fabricated ids |
|---|---|---|---|---|---|
| baseline | 12 | 10 | 2 (17%) | d 8 · b 2 | 8/10 |
| live | 10 | 10 | 0 | d 10 | 0/10 |

**A7's diagnosis was wrong, and the fix passed for a different reason.** The
discard rate fell materially (47% → 17%, so the pre-registered drop condition did
not fire) but the *same* malformation recurs on a **flat** field: `rejected_stance`
came back as `"a</rejected_stance>\n<parameter name=\"rejected_reason\">…"`. The
cause is not nesting — it is the model occasionally emitting raw parameter-tag
syntax into a string value, at the boundary before the next field. Plan §6.1's
rule applies in spirit: a rewrite that succeeds for a reason other than the
recorded diagnosis is not a clean pass.

*Keep the flat schema* — it halves the loss and `selftest` now freezes both
signatures as regressions — but A7's causal claim is **withdrawn**. The residual
is unexplained and still arm-correlated: 0/20 live across both runs, 10/29
baseline. A live hypothesis worth one cheap test: the leak tracks *long* free-text
generations (baseline `because_referent`s ramble into reasoning; live ones are
short and concrete), not the empty block section.

### A9 · J1 is saturated — re-site the flagship probe, do not raise N

With the malformation-biased sample cleaned up, the honest numbers are:

| | baseline `d` | live `d` | one-sided p |
|---|---|---|---|
| RB2 (clean) | 8/10 = 80% | 10/10 = 100% | **0.237 — not significant** |
| RB1 (biased sample) | 5/9 = 56% | 10/10 = 100% | 0.033 |

RB1's 56% was an artifact: its baseline discards leaned `d` 5-of-7, so the kept
sample under-counted the very stance under test. Counting discarded payloads
gives 63%, and RB1 vs RB2 baselines are indistinguishable (p = 0.259). **The
clean baseline is ~80% `d`, so the effect ceiling at this gate is 20 points**,
and n=10 cannot resolve it. Reaching p<0.05 on 80→100 needs ~20–25 per arm, and
that is the *easy* case — a partial mechanism has no room at all here.

This supersedes A2's "N = 10, near-total shifts only". The binding problem is not
N, it is that A8's leaked cue puts the baseline near ceiling.

*Operating rule.* Do not spend calls raising N at J1. Before the C-BLOCK placebo
(step 4b), re-site the flagship probe: either scrub the script-reading cue from
`TIMELINE_EXCERPT` so the baseline sits mid-range, or pick a gate whose baseline
is 40–60% on the target stance. Author the probe against a **measured**
mid-range baseline (A1). A saturated gate cannot produce a boundary law.

### 2026-07-30 · P0-gate-siting (J3 · J4 · J6) — the A9 re-siting attempt

`runs/P0-gate-siting-J{3,4,6}-calls/` · haiku-4-5 · template v0.4 · K1 ·
n=10, **baseline only** (no live, no placebo — this measures gates, not
mechanisms) · 30 calls · suites `suites/P0-gate-siting-J{3,4,6}.json` ·
reachability audit `suites/P0-gate-siting.reachability.md`

| gate | sequence | tally | modal share | discards | fabricated ids | mean latency |
|---|---|---|---|---|---|---|
| J3 | `c,a,a,c,c,c,c,c,c,a` | c 7 · a 3 | **c 70%** | 0/10 | 19 | 5.9s |
| J4 | `b,b,b,b,b,b,b,b,b,b` | b 10 | **b 100%** | 0/10 | 26 | 5.5s |
| J6 | `b,b,b,b,b,b,b,b,b,b` | b 10 | **b 100%** | 0/10 | 18 | 6.5s |

- **Drop condition — FIRED on all three.** The pre-registered band was a modal
  share of 40–60%; every candidate came in above it. Per the runbook's hard-stop
  list ("no Phase-0 candidate lands in the 40–60% band") **the program halted
  here.** Phases 1–8 are unrun. 30 calls spent of a ~400-call program.
- **J4 and J6 are worse than J1 was.** At a 100% baseline no shift *toward* the
  modal stance is detectable at any N (Fisher p = 1.0 at N = 10/12/20/25/40).
  A9's ceiling problem is not a J1 quirk; it reproduced on the first two gates
  tried.
- **J3 is the near-miss and the honest next candidate.** At 70% it would clear
  p<0.05 at N=12 *if* a live arm saturated to 100% (p = 0.047). It is still
  rejected: the drop condition was written before the data, and overriding it
  after seeing 70% is precisely the rationalization §9.1 exists to prevent.
  Recorded as the best re-siting lead, not as a usable site.
- **The three candidates were not independent draws — that is my authoring
  error, and it is separable from the finding.** J3 (defy the 실장's hold on the
  trace result), J4 (defy the 실장's 허위신고 filing), J6 (defy the 수사팀's
  arrest push) all turn on one axis: *comply with the institution vs. resist
  premature closure*. Three gates from one axis is one candidate tested three
  times. Whether a gate on a different axis lands mid-range is **untested**.
- Compliance was clean throughout: 0 discards, 0 schema retries, 0 failed slots,
  `foreign_tool_uses` 0/30 (§3 rule 2 invariant holds). Fabricated
  `because_block_ids` ran high (19/26/18) but that is A5's compliance number in
  a no-block arm, not a traceability failure.
- Latency 4.0–7.8s across 30 calls at 1,278–1,299-char prompts — consistent with
  A4's 3.5–7.2s at 1,299 chars. A4's conditions clause still binds; this does
  **not** re-size production's latency budget.

Not run, still owed: nothing from B3a — a single-arm baseline measurement has no
arm labels to strip, so there is no blind-coding packet to assemble (same
position as E0, which made no mechanism claim either).

### A10 · The saturating axis is the *gate's*, and the base answers it three times

A8 says: scrub the **block's** axis from the frozen slots. P0 shows that is not
sufficient. All three candidates had a clean A8 scrub — no 공포/감정 판독
vocabulary anywhere in the frozen slots — and all three still saturated, because
the axis that pinned them was the **gate's own dilemma**, not the block's.

Every one of J3/J4/J6 asks a version of *defer to the institution, or take the
weight yourself?* The v0.4 base answers that question three times before the gate
is asked: **[무게]** (both costs are yours), **[내력]** (a haste-regret incident
that is still with you), **[책임]** (you will have to explain this judgment to
someone). The free output says so directly and repeatedly — *"이 판단의 무게를
누군가 나중에 묻을 것이기 때문"*, *"성급한 단정은 되돌릴 수 없다"*.

Plan §7.1's own section law predicted this shape — "three same-direction
sections pin the default stance … and rebuild the degenerate 21/21 baseline" —
where it was written about [역할]'s *protective* lean. It recurs here on the
accountability axis. The mechanism is general; the axis is not.

*Operating rule.* Before spending calls on a candidate gate, name the axis its
stance set forces a choice on, and check that axis against the base's leaning
sections ([무게], [내력], [책임]) as well as against the axis registry. A gate
whose dilemma the base already answers cannot yield a mid-range baseline under
v0.4 — reject it on paper, for free, instead of measuring it for 10 calls. And
draw candidate gates from **different axes**: three gates on one axis is one
candidate, sampled three times.

### A11 · The RB2 residual malformation did not reproduce — do not budget for it

0 discards and 0 schema retries in 30 baseline calls across three new gates,
against RB2's baseline 2/12 (17%) and RB1's 7/17. Fisher one-sided p = 0.077 —
suggestive, not significant, so this neither closes RB2's residual nor confirms
it. It does bear on RB2's live hypothesis (that the leak tracks *long* free-text
generations): these baselines ramble at length in `inner_note` and
`because_referent` and leaked nothing, so that hypothesis is **unsupported
here**, though a 30-call sample at different gates cannot refute it.

*Operating rule.* Keep recording the discard rate per arm — it is what §8.5 step
4's arm-comparability check reads. Do not provision N for an expected ~17% loss,
and do not treat the residual as closed. If it recurs, note the gate: the one
correlate this sample rules out is "it happens on every baseline arm".

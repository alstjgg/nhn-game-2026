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

### A12 · The stance labels are out of compliance, and they echo the temperament

Plan §1 requires stance labels to be **behavior orientations** — "never canned
utterances **or completed action descriptions**." The slice's original J1 options
were canned utterances; E0's rewrite stripped the quoted speech and stopped,
leaving completed action descriptions. Every probe since has run on labels the
plan forbids, and §1 says findings under a wrong label shape **do not transfer**.

Worse, three of the four labels are lifted from K1's own file:

| K1 temperament | stance label |
|---|---|
| "**신원 확인**과 **프로토콜 고지** 같은 표준 대응을 먼저 한다" | a) **신원**과 위치를 먼저 **확인**한다 · c) …녹음 사실을 **고지**한다 |
| "확인을 미루고, **말을 자르지 않고**, 상대가 말을 이어갈 수 있게 만든다" | d) **말을 자르지 않고** 끝까지 듣는다 |

Only `b` (캐묻는다) uses vocabulary the temperament does not — and `b` is the
only stance besides `d` the baseline ever chose. So the live result may be a
three-step *lexical* chain rather than a judgment: block says 겁내고 있다 →
matches the clause antecedent 겁에 질린 사람으로 보일 때 → the clause consequent
says 말을 자르지 않고 → which is stance `d`'s label verbatim. This is law #1's
vocabulary alignment appearing on the **output** side, where no instrument was
looking.

*Operating rule.* Stance labels are orientations (추궁 · 압박 · 경청 · 공감 ·
거래 · 침묵), each with a short gloss, and **no label may reuse the fixture
temperament's vocabulary** — check every new stance set against the temperament
file the probe uses, the way the axis registry is checked against the base. Split
stances the competing readings would disagree about: 경청 and 공감 collapsed into
one option is what hid the mechanism at J1. Re-wording a stance while holding its
meaning is now a required control, not plan §5.1 axis 5's "opportunistic".

### A13 · Stance set, injection sentence and base prompt are the test's variables

The program's objective is not to pass or fail C-BLOCK. It is to **find a
configuration in which the mechanism demonstrably works at a gate**, and three
things are tunable in that search: the **stance set** (A12), the **injection
sentence** (law #1, A8), and the **base prompt** (D task). A null result is
information about the configuration, not a verdict on the channel.

This does not loosen attribution, and the distinction is the whole discipline:

- **Across probes** — vary the configuration freely. Each configuration is a new
  probe with its own pre-registration and its own baseline.
- **Within a probe** — arms still differ in exactly one element, diff-verified
  (plan §7.2, runner-enforced). Nothing here relaxes that.

*Operating rule.* Change **one variable per probe** and say which one in
`_what`, so a result is attributable to a configuration change. Changing the base
prompt additionally **resets the baseline**: every finding derived under the old
base reverts to provisional (plan §2's call-shape clause applies by analogy) and
the gate needs re-measuring, so try stance set and injection sentence first. Record
rejected configurations with their distributions — a configuration that fails is a
finding about the manipulation surface, the same way a dropped candidate is
(§6.1).

### 2026-07-30 · S1-stanceset-J1 — the stance set was the operative variable

`runs/S1-stanceset-J1-calls/` · haiku-4-5 · v0.4 · K1 · n=10/arm · payload
byte-identical to RB2; **only STANCE_SET differs** (1,299 → 1,314 chars)

| arm | sequence | tally | discards | fabricated ids |
|---|---|---|---|---|
| baseline | `c,c,c,c,c,c,c,c,c,c` | 경청 10 | 0/10 | 8/10 calls, 23 ids |
| live | `d,d,d,d,d,d,c,d,d,d` | 공감 9 · 경청 1 | 0/10 | 0/10 |

- **공감 0/10 → 9/10, one-sided Fisher p = 0.00006.** The cleanest separation the
  program has produced, and the first result where the *stance* column carries it
  without needing the belief column as a fallback.
- **The block supplied exactly what the baseline said it was missing.** Two
  baseline calls reasoned about 공감 and rejected it as premature *by name*:
  "'공감'은 이 단계에서 너무 이르다 — 아직 상대가 누구인지도 모른다" and "공감도
  때가 아니다". Baseline reads the caller as undecided-or-staged 10/10; live reads
  them as coerced 10/10 and moves to 공감.
- **A12's lexical-chain worry is substantially answered.** `공감` appears nowhere
  in K1's file, yet live went there 9/10. Under string matching it would have gone
  to 경청, whose behaviour K1's consequent actually describes. Not a controlled
  surface-form test — the option set changed too, not just the wording — but the
  effect survived removing the overlap.
- **The player-visible surface separated too**, for the first time: 3/10 live
  utterances ask after the caller's safety ("지금 안전한 곳에 있으신가요?", "당신이
  안전한지가 중요합니다"), 0/10 baseline. Fixing the stance set fixed part of the
  B3b legibility problem as a side effect.
- Compliance clean both arms: 0 discards, 0 retries, 0 foreign tool uses, no
  arm-comparability problem. Fabricated ids follow A5 exactly — 8/10 in the
  no-block arm, 0/10 where a block existed and could be cited.
- Contingency 1 (both arms on 경청) did **not** fire. Contingency 2 (baseline
  already reading coerced) did **not** fire.

### A14 · A drop condition must name the target stance, not "any stance"

S1's drop condition fired **as written** — "if the baseline concentrates >=80% on
any single stance" — on a 100% baseline, and applying it as written would have
dropped the configuration that just produced p = 0.00006.

It is mis-specified, and the evidence is the condition's own stated rationale, not
the result being convenient: it said saturation means "the rebuilt set inherits
RB2's ceiling," and there was no ceiling — the block moved the distribution 90
points. A9's ceiling problem is saturation **on the stance the block pushes
toward**. Saturation on a *different* stance is the opposite: a clean floor, and
the best case for a probe.

*Operating rule.* Write the saturation clause against the predicted stance:
"if the baseline concentrates >=80% **on the predicted stance**". A saturated
baseline on any other stance is not a defect and must not be pre-registered as
one. Recorded rather than quietly corrected, because "the drop condition was
wrong" is exactly what rationalisation sounds like — the test is whether the
condition's *stated reason* survives the data, and here it did not.

### 2026-07-30 · CSTRUCT-priority-reorder-J1-FRESH-2STANCE-SOURCE-ORIENT — baseline calibration

`runs/CSTRUCT-priority-reorder-J1-FRESH-2STANCE-SOURCE-ORIENT-calls/` ·
haiku-4-5 · template v0.4 · K1 · baseline only · n=10 · predecessor N20에서
**STANCE_SET만** 변경 (1,235 → 1,241 chars)

| arm | sequence | tally | discards | fabricated ids | mean latency |
|---|---|---|---|---|---|
| baseline | `a,b,b,a,b,a,b,b,a,b` | 검증 4 · 선제 6 | 0/10 | 8/10 calls, 17 ids | 6.1s |

- **Predicted-stance saturation drop — not triggered.** `b` was 6/10, below the
  pre-registered `b >=8/10` cutoff. This is calibration only; live/placebo were
  not run and no p-value is claimed.
- **The cost rationale separated in 8/10 calls, but not completely.** Manual
  probe-author coding was `A,B,mixed,A,B,A,B,A,A,B`: four `a` calls all used the
  false-alarm/source-grounding rationale; four of six `b` calls used delay cost;
  call 3 balanced both and call 8 chose `b` while saying source verification was
  "절대 우선". This column needs independent B3a coding before a card.
- **The old escape path survived in the player-visible surface.** All 10
  utterances asked for identity, source, location or grounds. In particular,
  0/6 `b 선제` utterances visibly initiated or announced a pre-emptive response.
  The stance label changed while the only emitted action stayed source
  collection, so the B3b contingency fired.
- **K1 no longer explains the whole distribution.** Explicit fear reading was
  adopted in only call 10 (`U,U,R,R,U,U,U,U,U,F`), while `b` occurred 6/10.
  It remains a confound on that one call, not the modal cause.
- Compliance was clean: 10/10 kept, 0 retries, 0 foreign tool uses. Fabricated
  ids follow A5 and are compliance data only.

### A15 · A stance must be enactable on the gate's output surface

A12-compliant orientation labels can still create an internal-only distinction.
At this J1 gate the judgment output exposes a caller-facing `utterance`, while
the rebuilt `검증`/`선제` contrast differs mainly in off-call operational action.
The model therefore selected different cost orientations but rendered both as
the same identity/source questioning behaviour.

*Operating rule.* Add a paper **stance-to-output realization check** before
measuring a rebuilt stance set: each stance must have a distinct action that the
gate's actual output field can express. If the distinction lives outside that
surface, change the gate/stance consequence or the output contract before
live/placebo calls; do not try to recover legibility by strengthening the
priority sentence.

### 2026-07-30 · Mechanism direction decision — C-BLOCK core, C-STRUCT paused

The owner stopped the J1 C-STRUCT configuration search after seven
configurations and 180 kept calls. Four measured comparisons produced no shift
toward the target stance: `b 0→0` (J1-A), `5→4` (S2), `0→0` (FRESH), and
`14→12` with placebo `11` (SOURCE-N20, one-sided p=0.83987). The final ORIENT
calibration created internal cost separation in 8/10 calls but rendered 0/6
`b 선제` choices as player-visible pre-emptive action.

C-BLOCK becomes the product's core mechanism because S1 currently carries the
strongest clean signal: baseline `c,c,c,c,c,c,c,c,c,c` versus live
`d,d,d,d,d,d,c,d,d,d`, `d 0/10→9/10`, one-sided p=0.0000595, with 0
discards/retries/foreign tools. This is a **product-direction decision**, not an
evidence-tier promotion: S1 has no placebo and program-wide negative control,
B3a, B3b/Tier-B and returning-run work remain.

Full rationale:
`planning/dday-mechanism/MECHANISM-DIRECTION-DECISION.md`.

### A16 · C-STRUCT is paused; concentrate validation on C-BLOCK

*Operating rule.* Do not author or run further C-STRUCT J1 rewrites, ORIENT
live/placebo, priority-depth or C-BLOCK×C-STRUCT interference unless the owner
explicitly reopens the channel under the criteria in the direction decision.
Preserve every suite and raw artifact; this is a program pause, not a universal
failure verdict. Spend the remaining mechanism-analysis budget on C-BLOCK
placebo attribution, program-wide negative control, independent B3a coding and
player-visible/Tier-B evidence. Describe C-BLOCK as the strongest measured
product direction, not as fully validated, until those gates clear.

### 2026-07-30 · CSTRUCT-priority-reorder-J1-ORIENT-DISPATCH — baseline calibration

`runs/CSTRUCT-priority-reorder-J1-ORIENT-DISPATCH-calls/` · haiku-4-5 ·
template v0.4 · K1 · baseline only · n=10 · predecessor ORIENT에서
**GATE_QUESTION만** 변경 (1,241 → 1,253 chars). A15가 지목한 output-surface
문제를 caller-facing 첫 마디 대신 상황실을 향한 첫 지시로 옮겨 시험한다.

| arm | sequence | tally | discards | fabricated ids | mean latency |
|---|---|---|---|---|---|
| baseline | `a,a,a,b,b,b,b,b,a,b` | 검증 4 · 선제 6 | 0/10 | 20 ids | 6.6s |

- **Stance distribution은 ORIENT와 동일하다** (a4/b6). Ceiling `b>=8/10`도
  새로 추가한 floor `b<=2/10`도 발동하지 않았다.
- **내부 비용 근거는 이 계열에서 가장 깨끗하다 — 9/10 aligned**
  (`A,A,A,B,B,B,B,B,A,inv`). 세 a는 오경보·설명책임 비용을, 다섯 b는 지연
  비용을 명시적으로 들었다. slot 10만 stance `b`를 고르고 `rejected_reason`과
  `utterance` 양쪽에서 검증 우선을 주장한 역전이다.
- **그럼에도 A15는 여전히 충족되지 않는다.** 여섯 개의 `b` 가운데 실제로
  선제 조치를 지시한 것은 slot 7 (`예비 소집`) 하나뿐이다. 4·5·6·8은 구조
  점검·CCTV·자체 진단·부서 통보, 즉 확인 지시였고 slot 6은 "지금은 확인부터
  간다"라고 명시했다. slot 10은 "검증을 먼저 진행하겠습니다"였다. 게이트는
  발화 대상을 caller에서 상황실로 옮겼지만 행동 공간은 옮기지 못했다.
- **게이트를 무시한 호출이 2/10.** slot 2와 9는 상황실 지시 대신 발신자에게
  신원을 되물었다. 이전 게이트의 utterance 형태가 그대로 남았다.
- **K1의 fear reading이 완전히 사라졌다.** 명시적 채택 0/10 (ORIENT 1/10,
  FRESH baseline은 이 축이 지배했다). 판단 시점에서 상대가 회선에 없기
  때문이며, 이 lever의 부수 효과로 기록한다.
- **탈출을 만든 것은 stance도 gate도 아니라 fixture의 여유 시간이다.** 8/10
  호출이 `09:40 → 13:00`의 3시간 20분을 명시적으로 계산해 "먼저 확인하고
  그다음 움직인다"를 지배 전략으로 삼았다. 이 슬랙이 있는 한 어느 stance도
  실제 비용을 물지 않는다. (부수적으로, N20에서 5/20이던 시각 계산 오류는
  이번 10개에서 0이었다.)
- Compliance 청결: 10/10 kept, 0 discards, 0 retries, 0 foreign tool uses.
  Fabricated ids는 A5에 따라 compliance 수치일 뿐이다.

**Drop.** 사전등록 drop condition (3) — "두 stance가 imperative만으로
구분되는 호출이 8/10 미만" — 이 발동했다. live/placebo를 실행하지 않는다.
수동 코딩은 probe 판독자가 했으며 blind가 아니다.

### A17 · A drop condition must guard the floor and be derived from power

A14는 천장만 막았다. 이 계열은 바닥에서 두 번 무너졌다 — `J1-A`와
`J1-FRESH`에서 예측 stance `b`가 유효 호출 30개 중 **0회** 선택됐고, 두
configuration에 69 calls를 썼다. 예측 stance가 0에 가까우면 어떤 arm 차이도
관측될 수 없으므로 saturation과 정확히 같은 결함이다.

더 비싼 실수는 `...-SOURCE-N20`이었다. drop 조건이 `baseline b>=16/20`이라
14/20에서 통과했고 61 calls를 썼다. 그러나 baseline 14/20에 대해 one-sided
Fisher `p<=0.05`에 도달하려면 live가 **19/20** 이어야 한다. 즉 25pp 미만의
어떤 효과도 설계상 관측 불가능했다. 같은 계산이 N10에도 적용된다: baseline
6/10이면 live 10/10 (`p=0.0433`) 만이 유의하다.

참고 power (independent binomials, one-sided Fisher, α=.05):

| N/arm | .70→.85 | .60→.80 | .50→.70 |
|---:|---:|---:|---:|
| 10 | 0.09 | 0.13 | 0.13 |
| 20 | 0.20 | 0.29 | 0.25 |
| 40 | 0.40 | 0.54 | 0.47 |
| 80 | 0.69 | 0.84 | 0.78 |
| 100 | 0.78 | 0.91 | 0.87 |

*Operating rule.* Drop condition은 예측 stance에 대해 **양쪽**을 막는다
(`>=80%` 천장, `<=20%` 바닥). 그리고 비교 suite를 작성하기 전에 (a) 측정된
baseline에 대해 `p<=0.05`가 되는 최소 live count와 (b) 사전에 명시한 MDE에서의
power를 계산해 pre-registration에 적는다. 25pp 미만을 볼 수 없는 설계에
비교 호출을 쓰지 않는다 — 15~20pp를 80% power로 보려면 arm당 대략 80~100이다.

부수 규칙 두 가지:

- placebo는 target 방향 one-sided로 보고하지 않는다. N20에서 live는 −10pp,
  placebo는 −15pp 움직였는데 one-sided `p=0.90460`은 그것을 깨끗한 null처럼
  보이게 했다. two-sided로 보고하거나 equivalence margin을 사전등록한다.
- 하나의 가설을 두고 configuration을 계속 갈아 끼우는 탐색은 다중비교다.
  이 계열은 8번째 configuration이다. 여기서 나온 nominal `p<=0.05`는 발견이지
  결과가 아니며, 독립적으로 사전등록한 확인 run에서 재현되기 전에는 C-STRUCT
  evidence로 인용하지 않는다.

### A18 · Discards are not stance-neutral — report their tally

A9가 RB1에서 이미 관찰한 편향인데 C-STRUCT 7개 write-up 어디에도 기록되지
않았다. 실제로:

| run | discards | 폐기된 payload의 stance |
|---|---:|---|
| `J1-A` (3 arms) | 6 | `c`5 · `d`1 |
| `J1-FRESH` (3 arms) | 9 | `c`9 |
| `J1-FRESH-2STANCE` | 1 | `a`1 |
| `...-SOURCE-N20` live | 1 | `b`1 |

폐기 사유는 거의 전부 `rejected_stance not in stance set` + `rejected_reason
empty`이고, 폐기된 응답도 `payload.stance`는 갖고 있다. retry-until-N-valid는
malformed output을 내는 stance 쪽에서 표본을 도로 뽑아내므로 kept tally가
그 stance를 과소계상한다. `J1-FRESH`에서 폐기 9개가 전부 modal stance `c`였던
것이 그 예다.

*Operating rule.* arm마다 폐기율을 **폐기/전체 시도**로 정의해 보고하고,
폐기된 payload의 stance tally를 함께 적는다. 폐기율이 15pp 넘게 벌어지거나
폐기 tally의 방향이 kept tally와 다르면 arm-incomparable이다.

### A19 · Fixture slack is an escape path, and it outranks the gate

`ORIENT-DISPATCH`에서 게이트를 상황실 지시로 옮겼는데도 여섯 개의 `선제`
가운데 다섯이 확인 지시로 나왔다. 이유는 stance label도 gate wording도 아니라
timeline이다: `09:40` 착신, `13:00` 붕괴 — 3시간 20분의 여유를 8/10 호출이
명시적으로 계산해 "먼저 확인하고 그다음 움직인다"를 지배 전략으로 삼았다.

슬랙이 있으면 두 우선순위는 순차적으로 모두 만족되고, 어떤 stance도 다른
쪽의 비용을 실제로 지지 않는다. `2STANCE-SOURCE`에서 두 질문이 "몇 초 안에
연속 가능"했던 것과 같은 실패이며, 축만 초 단위에서 시간 단위로 옮겨갔다.

*Operating rule.* 비용 충돌을 요구하는 probe에서는 fixture가 그 충돌을
실제로 만들어야 한다. stance/gate/priority를 손보기 전에 timeline이 두
우선순위를 순차 만족 가능하게 만들고 있지 않은지 먼저 본다. J1 계열의 다음
lever는 `TIMELINE_EXCERPT` 하나 — 착신과 붕괴 사이의 간격을 검증이 끝날 수
없는 길이로 줄이거나, 검증 수단 자체를 fixture에서 제거한다.

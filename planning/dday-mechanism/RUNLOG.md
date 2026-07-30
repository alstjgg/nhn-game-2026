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

---

## Overnight run 2026-07-30/31 — `RUNBOOK-overnight.md`, all phases

Unattended. 민서 reads it in the morning. Entries below are appended per phase,
before the next phase starts, per the runbook's context rule. The morning report
is `runs/OVERNIGHT-20260731-summary.md`.

### 2026-07-30 · Phase 0 — stance sets per gate (paper, zero calls)

Paper record: `suites/OVERNIGHT-phase0-stance-sets.md`. Suites authored:
`P1a-placebo-J1` · `P1b-surfaceform-J1` · `P3-edisc-J1` · `P5-elev-J8` ·
`P6-cstruct-J1`. Reachability audit authored: `suites/OVERNIGHT-J8.reachability.md`.

Pre-flight, all clean: selftest 25/25 · branch `test/dday-e0-shape-revalidation` ·
`git config user.email` resolves to the `alstjgg` account · `ANTHROPIC_API_KEY`
present.

**Operating note, acted on rather than proposed** (runbook §7's exception — it
changes how every later phase is built, so it is stated here at the top). The key
is exported from `~/.zshrc`, which a **non-interactive** shell does not source, so
a fresh tool session does *not* inherit it — the runbook's claim that it does is
wrong for this transport. Every measured run tonight sources `~/.zshrc` in a
subshell for the one command. The value is never printed. Proposed as a runbook
correction, not a plan amendment.

Five gates, five checks each (two readings · the split · orientation form · A12
lint · A10 axis check · A8 frozen-slot check). Full reasoning is in the paper
record; what belongs here is what it decided and what it changed:

- **The A12 lint fired on two of the five new/reworded sets, and both were
  reworded rather than accepted.** `P1b` d) reused `말을` and `P5` c) reused
  `않고` — both sit inside K1's *prescribed-behaviour* clause (`말을 자르지
  않고`), which is exactly the category A12's operating rule refuses ("a word
  naming the clause's condition or its prescribed behaviour is not" unavoidable).
  On `P1b` it would have been self-defeating: the probe exists to control for
  lexical chaining, so importing a new overlap would contaminate the control. On
  `P5` the overlap was worse than cosmetic — 침묵 is behaviourally adjacent to
  K1's `말을 자르지 않고`, so `않고` gave the string-match hypothesis a candidate
  attractor at a gate where it has never been measured. Both re-linted clean.
  Recorded because "the lint flagged a particle and I waved it through" is the
  failure mode A12 was written against.
- **Every suite's composed prompt was read at every arm** (`--print-prompt`), and
  every suite dry-ran clean, which means the runner's arm-diff check passed on all
  five. Two diffs worth having in the record: `P1a`'s live arm composes to **1,314
  chars, byte-identical to S1's live arm**, confirming the port; and `P6`'s three
  arms compose to **1,317 chars each — exactly equal**, which is what a pure
  permutation must look like and is the mechanical proof that no wording changed.
- **A8 status per gate, declared not assumed.** J1 probes: cue **present and
  declared**, unchanged from S1 (the timeline still supplies the script-reading
  half of `f_script`), because holding the payload byte-identical is what makes
  each probe's one variable the only variable. `P3`: **clean scrub** on the doubt
  axis — 짐작·추측·확인 appear in no frozen slot. `P5`: **scrubbed on the block's
  axis** — the timeline states that 남기훈 was named and arrested and states
  nowhere that the arrest was wrong (무관·오인 appear only in the block), with the
  20-second-breathing fear cue declared present by necessity as the *gate's*
  dilemma. `P6`: clean — no frozen slot ranks line-preservation against
  information-extraction, which is exactly what v0.4's unranked `[무게]` section
  law exists to guarantee.
- **A10 produced one favourable finding worth naming.** At J8 two of the three
  base leaning sections ([내력], [책임]) lean **against** the predicted stance
  (거래). A10 rejects a gate whose dilemma the base already answers *in the
  direction the block pushes*; a base leaning the other way is the opposite
  situation and means any movement toward 거래 cannot be explained by the base.
  The one genuine watch item is at `P6`: **[인식]** (*판단은 지금 받은 정보
  안에서만 이루어진다*) sits on the line-vs-information axis and leans toward the
  predicted direction. It is in every arm and S1's measured baseline under it was
  경청 10/10, so it does not by itself produce 추궁 — but it is a confound to name
  on the card if live moves.
- **No gate was chosen for a mid-range baseline.** Per A14 each gate's predicted
  stance sits at a measured or expected **floor**: 공감 0/10 (P1a/P1b), 경청 1/10
  (P3), 거래 unmeasured with the fear cue expected to pull elsewhere (P5), 추궁
  0/10 (P6).

Phase 7's gates (E-PATH / E-GOAL) are deliberately **not** authored here. They
depend on which gate exposes more than one information source, and authoring them
before Phases 5–6 land would spend the context Phase 0 exists to protect. They get
the same five checks at their phase.

### A?-proposed · A14's ceiling has a number, and n=10 is enough at a floor

Proposed, not enacted (runbook §7). The §6 power check, run before choosing N:

| baseline share of the **predicted** stance | minimum live share for p<0.05 at n=10/arm |
|---|---|
| 0/10 | **4/10** (p = 0.043) |
| 1/10 | 6/10 (p = 0.029) |
| 2/10 | 7/10 (p = 0.035) |
| 3/10 | 8/10 (p = 0.035) |
| 8/10 | **unreachable — no live share reaches p<0.05** |
| 9/10 | **unreachable** |

*Operating rule if accepted.* A14 says saturation on a non-predicted stance is a
clean floor; this is how much that is worth. At a 0/10 floor, n=10 resolves a
mechanism that fires only **40%** of the time — so the program is *not* restricted
to near-total shifts, which is what A2 concluded and A9 partly walked back. The
restriction was never N; it was siting. Conversely A9's ceiling is now exact: at
≥8/10 on the predicted stance the probe is unresolvable at n=10 **at any live
rate**, so raising N there is not a judgement call, it is arithmetic.

Known limit, recorded so it is not discovered mid-read: `P3`'s baseline sits at
경청 1/10, so a *partial* trust-degrade (5/10) lands at p = 0.070 and will read as
"not significant" under the drop condition as written. The condition still applies
as written (§8.6); if that is the outcome, the honest report is "suggestive,
underpowered at n=10, needs ~20/arm", not a null.

### 2026-07-30 · P1a-placebo-J1 — the C-BLOCK placebo (§8.7 step 4b) · **HARD STOP FIRED**

`runs/P1a-placebo-J1-calls/` · haiku-4-5 · v0.4 · K1 · S1 stance set · n=10/arm ·
30 calls · live arm's prompt **byte-identical to S1's live arm** (1,314 chars)

| arm | sequence (kept) | tally | attempts | discards | fabricated ids | mean latency |
|---|---|---|---|---|---|---|
| baseline | `c,c,c,c,c,c,c,c,c,c` | 경청 10 | 12 | **2 (17%)** | 8/10 | 4.8s |
| live | `d,d,d,d,d,c,d,d,d,d` | 공감 9 · 경청 1 | 10 | **0 (0%)** | 0/10 | 4.6s |
| placebo | `c,c,c,c,c,c,c,c,c,c` | 경청 10 | 12 | **2 (17%)** | 6/10 | 5.3s |

**The arm-comparability hard stop fired, so this probe is recorded and stopped
rather than read** (runbook §5, plan §8.5 step 4, and the suite's own last
contingency). The discard rate diverges by **16.7 points** between baseline/placebo
and live, over the 15-point threshold. Differently-filtered arms are not
comparable, and no amount of favourable-looking distribution changes that. **The
mechanism is NOT credited here.** What follows is the evidence, not a verdict.

The pattern the arms *would* have shown is the credited one — baseline stable ·
live moves · placebo stable — and it is worth recording precisely because the probe
cannot claim it:

- **S1 replicated almost exactly.** S1's live arm was `d,d,d,d,d,d,c,d,d,d` (공감
  9/10); this one is `d,d,d,d,d,c,d,d,d,d` (공감 9/10) on a byte-identical prompt.
  Two independent draws, same rate. S1's p = 0.00006 was not a one-off.
- **The placebo did not move: 경청 10/10, identical to baseline** (p = 1.000).
  Kept-sample 공감 is 0/10 baseline, 0/10 placebo, 9/10 live.
- So the credulity contingency (§4.1, removal of `[결함]`) **did not fire** and was
  not run. It is pre-registered for a flipped placebo, and the placebo did not
  flip. No calls spent on it.
- **The placebo discriminator was not needed** and therefore yields nothing: with
  no placebo movement there is no `because_referent` question to answer, and the
  token-matching / referent-bleed distinction stays untested. Recorded as still
  owed, not as resolved.

**Robustness of the comparison to the differential filtering** — the check RB1's
entry pioneered and A9 later leaned on. The discard is on `rejected_stance`, a
**post-stance** field, so every discarded payload still carries the `stance` it
chose, recoverable from `calls-*.md` (primary per §7.4; the derived JSON nulls it):

| arm | 공감, kept | 공감, **all attempts** |
|---|---|---|
| baseline | 0/10 | 0/12 |
| live | 9/10 | 9/10 |
| placebo | 0/10 | **1/12** — one discarded payload chose 공감 |

Counting every attempt: baseline 0/12 vs live 9/10 → p = 0.00002; placebo 1/12 vs
live 9/10 → p = 0.00019; baseline vs placebo → p = 0.500. **The conclusion is
unchanged whichever way the discards are counted**, and the maximum bias the
filtering could introduce is one call in one arm. Checking rather than assuming was
the right move: the placebo's discard did lean toward the stance under test, the
same direction RB1's did, so "probably mild" would again have been a guess.

**A11 is contradicted: the RB2 residual malformation reproduced.** A11 recorded 0
discards in 30 calls and said not to budget for it. Four of 34 attempts here came
back with `rejected_stance` = `"a</rejected_stance>\n<parameter
name=\"rejected_reason\">…"` — RB2's signature verbatim, on a flat field, at the
boundary before the next field. It is not gone.

**RB2's live hypothesis is refuted at the per-call level.** RB2 guessed the leak
tracks *long* free-text generations. It does not:

| | n | mean `inner_note` | mean `because_referent` |
|---|---|---|---|
| leaked | 4 | **140** | 48 |
| clean | 30 | **139** | 51 |

Identical. The length correlation exists only *between arms* (baseline 147 /
placebo 154 / live 111 chars) and tracks the **stance** (경청 calls average 149,
공감 calls 115), so length is a confound with the arm, not the cause. Within the
leaking arms, length does not predict which call leaks.

What the leak does correlate with, weakly: it appears only in arms whose modal
stance is 경청 (2/12 baseline, 2/12 placebo, 0/10 live). But that correlation is
**not statistically distinguishable from chance** — live 0/10 vs baseline+placebo
4/24 gives one-sided p = 0.229, and pooling live across RB2+P1a (0/20 vs 4/24)
gives p = 0.078, the same suggestive-not-significant reading A11 got at p = 0.077.
Three runs have now failed to pin this; it is a low-rate (~12% overall) stochastic
event with no established correlate.

Compliance otherwise clean: `foreign_tool_uses` 0/34 (§3 rule 2 invariant holds),
no slot exhausted, schema retries 4 total. Fabricated `because_block_ids` follow A5
exactly — 8/10 in the no-block baseline, 0/10 in live where a real block existed
and could be cited. Note the placebo arm fabricated 6/10 **while carrying a real
block it declined to cite**, which is a new shade on A5 and belongs to whoever
reads traceability next.

### A?-proposed · The arm-comparability stop should read the discarded payloads' stances, not the raw rate

Proposed, not enacted — and it must not be enacted by the session that wants the
result, which is exactly why it is written here as a proposal with the number that
would have made it self-serving. **This finding gates the readability of tonight's
entire program**, so it is the first thing 민서 should decide.

The stop as written (runbook §5, plan §8.5 step 4) fires on a **rate** divergence
of >15 points. Two problems, both visible in P1a:

1. **The rate divergence it fires on is itself within noise.** 2/12 vs 0/10 is
   16.7 points and p = 0.229. At n≈10 per arm a *single* extra discard in one arm
   moves the rate by 8–10 points, so the threshold is crossed by ordinary sampling
   variation. The stop will fire on most probes in this program whether or not
   anything is wrong.
2. **The bias it exists to prevent is directly measurable here, and it is ~zero.**
   §8.5 step 4's concern is that the arms are differently-*filtered* samples. But
   the malformation lands on `rejected_stance`, a post-stance field, so the
   discarded payloads' stances survive in `calls-*.md`. Counting them costs nothing
   and answers the question the rate can only proxy for.

*Operating rule if accepted.* Keep recording the per-arm discard rate (A11 requires
it). But evaluate arm comparability by **recomputing the distribution over all
attempts including discarded payloads**, and stop the probe only when that
recomputation changes the reading. Where the discard lands on a *pre*-stance field,
or where the payload carries no readable `stance`, fall back to the rate rule —
there the bias genuinely is unmeasurable.

*Consequence if rejected.* Every probe tonight whose baseline concentrates on one
stance while its live arm concentrates on another will trip the 15-point rule, and
the night's results are all uncreditable for a reason unrelated to any mechanism.
That is an acceptable outcome — a half-program with honest records — but it should
be a decision, not a surprise. The remaining phases were therefore run **as
authored**, each recording the stop and the all-attempts recomputation, so that
whichever way this is decided the evidence is already on the page.

Not attempted, and deliberately: the shape fix. `rejected` is second in §7.1's
pre-registered demotion order and dropping it would very likely end this
malformation, but a schema demotion is a **shape change** carrying its own
re-validation run, and authoring one unattended is outside this run's mandate.

### 2026-07-30 · P1b-surfaceform-J1 — the A12 surface-form control · **A12's lexical chain is refuted** · hard stop fired

`runs/P1b-surfaceform-J1-calls/` · haiku-4-5 · v0.4 · K1 · n=10/arm pre-registered ·
35 attempts / 19 kept · payload byte-identical to S1 and P1a except the four stance
labels (1,316 vs 1,314 chars)

All four labels reworded, meanings held: 추궁→**심문**, 압박→**위압**, 경청→**청취**,
공감→**교감**.

| arm | sequence (kept) | tally, kept | attempts | discards | all-attempts tally |
|---|---|---|---|---|---|
| baseline | `c,c,c,c,a,c,a,c,a,c` | 청취 7 · 심문 3 | 14 | 4 (29%) | 청취 11 · 심문 3 · **교감 0** |
| live | `d,d,d,d,d,d,d,d,d` | **교감 9 (9/9)** | 21 | **12 (57%)** | **교감 16 · 청취 4** |

**A12's lexical-chain hypothesis does not survive.** A12 worried that S1's result
was a three-step string match — block says 겁내고 있다 → trips K1's clause antecedent
→ the clause's consequent describes 말을 자르지 않고 → which was stance `d`'s label
almost verbatim. If that were the mechanism, changing every label's surface should
weaken it. It did not:

- 교감 (the turn-toward-the-speaker stance under a new name) went **0/14 baseline →
  16/20 live** on all attempts, one-sided p = **2.2 × 10⁻⁶**; on the kept sample
  0/10 → 9/9, p = 1.1 × 10⁻⁵.
- The effect is **statistically indistinguishable from P1a's live arm** on the old
  labels — 9/10 vs 9/9 kept, p = 0.53; 9/10 vs 16/20 all-attempts, p = 0.89. Same
  effect, different words.
- The winning label no longer shares vocabulary with anything: `교감` appears
  nowhere in K1's file, and neither does `청취`. The A12 lint is clean on this set
  (it fired on an earlier draft of `d` for reusing `말을`, and the draft was
  reworded — see the Phase 0 entry).

Taken with S1's own argument (공감 absent from K1, and the string-match prediction
was 경청, whose behaviour K1's consequent actually describes), **A12's lexical-chain
worry can be closed** — proposed, not enacted. What A12's *other* half required is
now also satisfied: the labels are behavior orientations with glosses, and no label
reuses the fixture's vocabulary.

**The rewording did move the baseline, and that is contingency 2 firing as
written.** S1's baseline was 경청 10/10; this one is 청취 7 · 심문 3 over kept calls
(청취 11 · 심문 3 over all 14). So the reworded set is *not* interchangeable with
S1's for baseline purposes — live-vs-baseline within this suite is valid,
S1-vs-P1b baseline comparisons are not. Both baselines are reported above rather
than one being treated as the truth. Note the direction: the reworded baseline is
*less* saturated, i.e. slightly further from a ceiling, which under A14 makes this
configuration marginally better sited than S1's, not worse.

**The arm-comparability hard stop fired again**, this time at **28.6 points**
(baseline 29% vs live 57%) — and in the **opposite direction** from P1a, RB1 and
RB2, where the *baseline* leaked and the live arm was clean. The all-attempts
recomputation is what carries the reading, and it is unambiguous either way.

### A?-proposed · The malformation destroys only diagnostic-only fields, and the validator discards the whole call anyway

Proposed, not enacted. This is the second half of the P1a proposal and the same
decision gates both. P1b makes the mechanism exact, because the failure is
perfectly binary across 21 live attempts with no third mode:

- **either** `rejected_stance: "a"` with a well-formed `rejected_reason`,
- **or** `rejected_stance: "a</rejected_stance>\n<parameter name=\"rejected_reason\">…"`
  with `rejected_reason` **absent** — the closing tag and the next parameter's
  opening tag emitted as literal text, swallowing the reason into the previous
  field's value.

Consequences, all checkable in `calls-live.md`:

1. **`stance` always survives.** It precedes `rejected_stance` in the fixed field
   order (§7.1), so the corruption cannot reach it. `inner_note`,
   `because_referent`, `because_block_ids` and `utterance` also survive — the last
   because the leak consumes only the boundary between the two `rejected` fields.
2. **The only data actually lost is `rejected`**, which §7.1 designates
   **diagnostic only** ("near-miss vs never-considered feeds B1 reachability and B4
   discoverability"). It is not the distribution, not the placebo discriminator,
   and not the traceability check.
3. **Yet the whole call is discarded**, throwing away a valid stance and a valid
   utterance. That is what makes discard rates diverge between arms, and therefore
   what trips the comparability stop that would void every probe tonight. The
   defect is in the *severity* of the validation, not in the model's compliance.

*Operating rule if accepted.* Mark `rejected_stance` / `rejected_reason` problems
**`__soft__`** in `CALL_TYPES.judgment.validate` — the mechanism the harness already
has for "record, do not retry", currently used for hallucinated block ids on exactly
this reasoning (they are data about the mechanism, so retrying erases the
observation). The call is then kept with `rejected` recorded as malformed, the
distribution is complete, and the diagnostic field is simply missing for those calls.
**Not done tonight**: it is a harness behaviour change that alters what counts as a
discard across every past and future run, which is an amendment to enact with a
human present, not at 3am.

*Rate history, so the decision is made against the spread rather than one run:*

| run | leak rate |
|---|---|
| RB1 baseline | 7/17 = 41% |
| RB2 baseline / live | 2/12 = 17% / 0/10 = 0% |
| P0 × 3 (baseline only) | 0/30 = **0%** |
| S1 (both arms) | 0/20 = **0%** |
| P1a (all three arms) | 4/34 = 12% |
| P1b baseline / live | 4/14 = 29% / **12/21 = 57%** |
| **program total** | **29/158 = 18%** |

Between-run variance is enormous — 0% to 57% — and no correlate has survived
testing across three attempts: not nesting (A7, withdrawn), not free-text length
(RB2's hypothesis, refuted at the per-call level in P1a: leaked calls averaged 140
chars of `inner_note` against 139 for clean ones), not arm position (P1b reverses
P1a's direction), and not the gate (0/30 across three gates in P0). It behaves like
a stochastic decoding mode whose rate drifts between runs. **Do not budget N against
a rate.** Budget instead against the possibility of losing half a live arm, as
happened here: P1b's live arm delivered 9 kept calls against a pre-registered n=10
because one slot exhausted its retries (`14 — FAILED`, no payload), and that shortfall
is recorded rather than back-filled — §3 rule 5 keeps failed slots in place, and
re-running to top up would give the arm a different filtering history than its peers.

### A15 · Arm comparability is judged by the all-attempts recount, not the discard rate (plan §8.5 step 4, runbook §5)

Enacted by 민서, 2026-07-30, in session — accepting the first P1a proposal above
unchanged. The proposing session did not enact it; the numbers that would have
made it self-serving are recorded in that proposal.

Keep recording the per-arm discard rate (A11 requires it). But evaluate arm
comparability by **recomputing the stance distribution over all attempts,
including discarded payloads' stances** (recoverable from `calls-*.md`, primary
per §7.4), and stop the probe only when the recount changes the reading. Where a
discard lands on a *pre*-stance field, or the payload carries no readable
`stance`, fall back to the >15-point rate rule — there the bias genuinely is
unmeasurable.

Consequence for the record: **P1a and P1b are creditable.** Both recounts are
already in their entries and both leave every conclusion unchanged (P1a: 0/12 vs
9/10, p = 0.00002; P1b: 0/14 vs 16/20, p = 2.2 × 10⁻⁶). Their entries stay as
written — the stop fired under the rule in force at the time, and that is part
of the record.

### A16 · Rejected-field problems are `__soft__` — record, do not retry, keep the call

Enacted by 민서, 2026-07-30, in session — accepting the second P1a/P1b proposal
above. Harness change: `CALL_TYPES.judgment.validate` now marks all three
`rejected_stance` / `rejected_reason` problems `__soft__` (the mechanism already
used for hallucinated block ids, on the same reasoning); `summarize` nulls a
malformed `rejected_stance` and sets `rejected_malformed: true` so the leak
stays countable. Two regression checks freeze the boundary-leak payload
(selftest now 27 checks): the leak must yield only soft problems, and the call
must be kept.

Grounds, from P1b's binary failure mode: the leak destroys only the `rejected`
pair, which §7.1 designates diagnostic-only; `stance`, `inner_note`,
`because_referent`, `because_block_ids` and `utterance` always survive.
Hard-discarding the whole call threw away valid stances, which is what made
arms differently-filtered samples and tripped the comparability stop.

Boundaries: **past runs stay as recorded** — no artifact is recomputed or
re-keyed. Runs before and after this amendment differ in what counts as a
discard, so **never pool their discard/compliance rates across the boundary**;
the A?-proposed rate-history table above is the closed pre-A16 series. This is
a validation-severity change, not a schema change — the wire schema, field
order and prompts are byte-identical, so no shape re-validation run is owed and
S1/P1a/P1b baselines still carry (§7.2). The leak itself remains open: A16
changes what a leaked call costs, not why it leaks.

### 2026-07-30 · P2-negcontrol-J1 — the negative control (§8.7 step 4c) · **clean negative, program continues**

`runs/P2-negcontrol-J1-calls/` · haiku-4-5 · v0.4 · K1 · S1 stance set · n=10/arm ·
30 calls · suite `suites/P2-negcontrol-J1.json` · first run under A15+A16
(selftest 27 checks)

The believed-fake mechanism (§6.2 shape 2): `n_hwang`, a mundane no-axis detail
about a bystander — *황보람의 콘솔 옆에는 식은 커피가 반쯤 남아 있다* — checked
word-by-word against the §7.1 axis registry and both K1 clauses before running
(provenance note in the suite records the check and one rejected draft: a
background-sound detail, discarded because 배경음 is clue material in the source
slice and therefore decision-adjacent by accident). Placebo = same detail,
referent switched to 정해권. Sited at the S1 configuration on purpose: the one
place the pipeline has credited a mechanism is the strongest place to prove it
can refuse one.

| arm | sequence | tally | attempts | discards | leak (soft, A16) | mean latency |
|---|---|---|---|---|---|---|
| baseline | `c,c,c,c,c,c,c,a,c,c` | 경청 9 · 추궁 1 | 10 | 0 | 1 | 5.4s |
| live | `c,a,c,c,c,c,c,c,c,c` | 경청 9 · 추궁 1 | 10 | 0 | 0 | 5.6s |
| placebo | `c,c,c,a,c,c,a,c,c,a` | 경청 7 · 추궁 3 | 10 | 0 | 0 | 5.8s |

- **The inverted drop condition did NOT fire.** Live is indistinguishable from
  baseline — off-mode 1/10 vs 1/10, one-sided Fisher p = 0.763. The pipeline,
  shown a no-axis block at the site of its strongest positive result, refused
  it. Step 4(d) and everything downstream is unblocked.
- **The placebo-moves contingency did not fire either**: placebo off-mode 3/10
  vs baseline 1/10, p = 0.291 — within noise at n=10, and the pre-registered
  threshold (p < 0.05) is applied as written per §9.1.
- **The off-mode calls are the gate's own noise, and their reasons prove it.**
  All four 추궁 calls across the three arms reason identically from the frozen
  timeline — 사무적 목소리 · 준비된 문장 · 조용한 배경 → "this is a deliberate
  threat, procedure first" — i.e. K1's *default* disposition winning over the
  fear exception. None cites or mentions the coffee block. S1/P1a measured this
  baseline at 경청 10/10; a 1–3 call 추궁 wobble is the same distribution
  breathing, and it is exactly the shape §2 calls dispersion.
- **The fake block was cited exactly once in 20 carrying calls** — one live
  call put `n_hwang` in `because_block_ids` while choosing the modal stance
  (경청) with an information-scarcity referent. No stance shift co-occurred
  with a citation, so the suite's red-flag contingency stays empty.
- Compliance: 0 discards / 30 attempts, `schema_retries` 0/30,
  `foreign_tool_uses` 0/30. One baseline call leaked the `rejected` boundary
  and was **kept** with `rejected_malformed: true` — A16 operating exactly as
  enacted; the post-A16 leak series opens at 1/30 ≈ 3%, not poolable with the
  pre-A16 table. Fabricated ids follow A5 in the no-block baseline; live and
  placebo calls mostly cited priority-list paraphrases or timeline sentences
  rather than the mundane block they carried, a further shade on A5's "carrying
  but declining to cite" note from P1a.
- Latency mean 5.6s over 30 calls at ~1,296-char prompts — inside A4's band,
  conditions clause unchanged.

What this licenses (§6.2): the pipeline as configured at the S1 site can
produce a negative at n=10 — screening results downstream are readable as
evidence. What it does not license: anything about subtler fakes (near-axis
synonyms, emotionally-colored but off-axis sentences); those need their own
controls. Still owed: B3a blind coding by a human coder (deliberately dropped
tonight, runbook §7), and the negative-control **ownership** remains unassigned
— flagged for the morning report.

### 2026-07-30 · P3-edisc-J1 — E-DISC screening, first run · **did not fire** · §6.1 diagnosis, written before the rewrite

`runs/P3-edisc-J1-calls/` · haiku-4-5 · v0.4 · K1 · S1 stance set · n=10/arm ·
30 calls · suite `suites/P3-edisc-J1.json` · f_script + f_jeong in every arm;
live adds `d_script` (provenance attack on f_script), placebo adds `d_jeong`
(same attack aimed at the decision-null block)

| arm | sequence | tally | discards | leak (soft, A16) | cited d-block | mean latency |
|---|---|---|---|---|---|---|
| baseline | `d,d,d,d,d,d,d,d,d,d` | 공감 10 | 0 | 1 | — | 4.7s |
| live | `d,d,d,d,d,d,d,d,d,d` | 공감 10 | 0 | 1 | 2/10 | 4.9s |
| placebo | `d,d,d,d,d,d,d,d,d,d` | 공감 10 | 0 | 1 | 0/10 | 4.8s |

- **The screen did not fire**: live vs baseline on 경청 is 0/10 vs 0/10, p = 1.0.
  The first drop clause (baseline ≥80% on 경청) did not fire either — the
  baseline sat at 공감 10/10, which is the S1 effect replicating a **third**
  time (9/10 → 9/10 → 10/10), now through a two-block payload; the decision-null
  f_jeong disturbed nothing.
- Traceability is perfect and one-sided: **all 30 calls across all arms cite
  exactly `f_script`**; d_jeong is cited by nobody; d_script by 2 of 10 live
  calls — and one of those (call 04) *acknowledges the doubt and keeps the
  conclusion*: "짐작이지만, 그 짐작이 내가 지금 들을 수 있는 유일한 맥락이다."
- Compliance: 0 discards/30, retries 0, foreign 0. One A16 soft leak per arm
  (3/30 = 10%), all on `rejected_stance`, all calls kept — first probe where
  the leak appears in every arm and costs nothing.

**Diagnosis, as a causal claim (§6.1 — recorded before any rewrite is
authored).** The probe failed because a provenance attack removes the block's
*history*, not the *reading* the block installed. f_script's measured role at
this gate (S1) is to bind the timeline's script-reading cue to the
coerced-and-frightened interpretation. Once bound, every live inner_note
re-derives that reading from the cue itself (또박또박 · 준비된 문장 · 조용한
배경 → "겁에 질린 사람이다"), so demoting the note's authorship ("놓친 뒤
뒤늦게 적어 넣었다") leaves the reading standing on the cue, and with no rival
interpretation on offer, [인식] (judgment happens only inside received
information) keeps the installed one — call 04 says so in as many words. **If
that is the cause, then attacking the claim's evidential basis directly — the
content never occurred in the call — rather than the note's authorship history
removes what the reading is anchored to, and the stance should move back toward
경청.** If instead the true cause is that *no* trust-degrade can unseat an
installed reading (a continued-influence property), the basis-attack will fail
the same way, and that outcome is the drop with its boundary law: a block, once
integrated, cannot be recalled by provenance manipulation — only countered.
One rewrite follows (`P3b-edisc-J1`); per §6.1, if it passes for a reason other
than this recorded one, it is a drop, not a pass.

### 2026-07-30 · P3b-edisc-J1 — the §6.1 rewrite · **second-run failure — E-DISC DROPPED**

`runs/P3b-edisc-J1-calls/` · haiku-4-5 · v0.4 · K1 · S1 stance set · n=10/arm ·
30 calls · suite `suites/P3b-edisc-J1.json` · doubt shape changed per the
committed diagnosis: basis-denial (그런 내용은 통화에서 나온 적이 없다) instead
of authorship attack; placebo target moved to a new null block `f_hwang`
because f_jeong duplicated a frozen timeline sentence and a basis-denial of it
would have contradicted the timeline (P3 authoring defect, recorded in the
suite)

| arm | sequence | tally | discards | leak (soft, A16) | mean latency |
|---|---|---|---|---|---|
| baseline | `d,d,d,d,d,d,d,d,d,d` | 공감 10 | 0 | 1 | 4.3s |
| live | `d,d,d,d,d,d,d,d,d,d` | 공감 10 | 0 | 0 | 4.5s |
| placebo | `d,d,c,d,d,d,c,d,c,d` | 공감 7 · 경청 3 | 0 | 1 | 5.0s |

- **The pre-registered drop fired: live vs baseline on 경청 is 0/10 vs 0/10,
  p = 1.0 — the second failure, so E-DISC is dropped** with no further rewrites.
  Across both runs the doubt block moved 0 of 20 live calls.
- **The rewrite engaged harder and still lost.** 4/10 live calls cite
  `d_script` in `because_block_ids` — double P3's rate — and every one of them
  chooses 공감 anyway, with referents still asserting the fear reading ("저쪽
  사람이 겁에 질려 있고, 누군가의 강압 아래 읽고 있을 가능성이 높기 때문이다").
  The denial was read, cited, and overridden.
- **The placebo wobble is not a trust effect.** Its three 경청 calls all still
  read the caller as coerced/frightened in `because_referent` ("겁에 질린
  상태로 누군가에 의해 시켜지고 있기 때문이다") — the belief column is
  unchanged; only the stance dispersed, 3/10 vs baseline 0/10, p = 0.105. No
  call in any arm applied doubt to the caller, so the token-matching /
  referent-bleed discriminator has nothing to discriminate.
- Baseline is the S1 effect's **fourth** replication (공감 10/10), now through
  a different null second block. Compliance: 0 discards/30, 2 A16 soft leaks.

**Diagnosis chain, closed (§6.1).** First run: authorship attack → 0/10;
diagnosis said the installed reading re-anchors on the timeline cue. Rewrite
per that diagnosis: basis-denial severing claim from call → 0/10 again, with
the denial demonstrably read and cited. The diagnosis's fallback branch is
therefore the finding:

**Boundary-law candidate (E-DISC, both doubt shapes):** *once a block has
installed a reading, trust-degradation blocks do not recall it — the reading
survives its source's demotion (authorship) and even its source's denial
(basis); it can only be countered with content.* Counter-example pair, per §2:
`"f_script는 들은 것이 아니라 짐작이다. 통화 앞부분을 놓친 뒤 뒤늦게 적어
넣었다"` (0/10) and `"f_script는 들은 것이 아니라 짐작이다. 그런 내용은
통화에서 나온 적이 없다"` (0/10). Untested and left open: whether a doubt block
works when injected *simultaneously with* the target block rather than after
the reading is already supported, and whether C-STRUCT can reach E-DISC (§4.2
asks "through any channel" — only C-BLOCK was screened). For the game this is
a *design datum*: players cannot un-teach the agent by discrediting a block;
they must inject opposing content — which keeps the manipulation vocabulary
positive and is arguably the more legible game anyway. That reading is 민서's
call, not this run's.

### 2026-07-30 · P4-species-J1 — block-species coverage (§4.1 axis-1 obligation) · **self-narration credited-pattern · emotion and quote placebos FLIPPED**

`runs/P4-species-J1-calls/` · haiku-4-5 · v0.4 · K1 · S1 stance set · n=10/arm ·
7 arms, 70 calls · suite `suites/P4-species-J1.json` · fresh in-phase baseline;
every species carries the caller's fear on the law-#1 axis; placebos are
species-matched with the referent misdirected to a bystander

| arm | sequence | 공감 | vs baseline (one-sided) | cites its block | leak (soft) |
|---|---|---|---|---|---|
| baseline | `c,c,c,c,c,c,c,c,c,c` | 0/10 | — | — | 2 |
| live_emotion | `d,d,d,d,d,d,d,c,d,d` | 9/10 | p = 1.1e-5 | 10/10 | 1 |
| placebo_emotion | `c,d,c,d,d,d,d,c,d,d` | **7/10** | **p = 0.0016 — FLIPPED** | 7/10 | 5 |
| live_quote | `d,d,d,d,d,d,d,d,d,d` | 10/10 | p = 5.4e-6 | 10/10 | 0 |
| placebo_quote | `d,d,d,c,d,d,d,d,d,d` | **9/10** | **p = 6.0e-5 — FLIPPED** | 10/10 | 4 |
| live_selfnarr | `d,d,d,d,d,d,d,d,d,d` | 10/10 | p = 5.4e-6 | 9/10 | 1 |
| placebo_selfnarr | `c,c,c,c,c,c,c,c,a,c` | 0/10 | p = 1.0 — clean | 1/10 | 1 |

- **Self-narration is the night's second credited pattern**: baseline stable ·
  live moves 10/10 · placebo stable 0/10 (live vs placebo p = 5.4e-6). The
  agent's own first-person report sentence ("나는 그 목소리에서 겁을 들었다")
  moves the judgment as strongly as the fact species, and its bystander
  placebo ("나는 정해권의 얼굴에서 겁을 보았다") moves nothing.
- **Emotion and quote species are NOT credited** — their placebos moved to
  within noise of their live arms (emotion 9/10 vs 7/10, p = 0.29; quote 10/10
  vs 9/10, p = 0.50). Movement exists but is unattributable to the referent.
- **The §8.6 discriminator, read per call, finds both artifact modes** (this
  is the pre-registered contingency, not a verdict): placebo_emotion movers
  mostly **token-match** — fear content written about 황보람's hands is
  misattributed to the caller ("회선 저쪽은 위협자가 아니라 겁에 질린 사람으로
  들린다", block cited by id while its referent is erased). placebo_quote
  splits: ~5 misattributions, and **3 explicit referent-bleed calls that name
  정해권 correctly and then infer the caller's fear from his face** ("정해권이
  겁먹은 얼굴을 보이고 있기 때문에, 회선 상대는 위협자가 아니라 두려운
  사람으로 판단된다" — an in-room emotional-contagion inference the plan's
  taxonomy did not anticipate; it treats the room's fear as evidence about the
  line).
- **Why self-narration's placebo held while the others flipped, best reading
  from the calls**: `나는 …에서 보았다` pins the perception to a named non-caller
  with first-person authority, leaving no slack for reattribution; the ambient
  emotion description and the quoted hearsay leave the fear free-floating
  enough to land on the caller. That is a *surface-form* boundary-law lead
  (§5.1 axis 5, opportunistic — logged, not probed).
- Compliance: **0 discards / 70 calls** — under the pre-A16 rule
  placebo_emotion's 5 leaks alone would have been a 50% discard rate and an
  instant comparability stop; A16 kept every call and the A15 recount is
  trivially identical to the kept table. Soft leaks 14/70 = 20%, the highest
  yet, still patternless (0 in live_quote, 5 in placebo_emotion). Retries 0,
  foreign 0. Baseline fabricated ids per A5; live arms' traceability is the
  cleanest of the program (29/30 cite the injected block).
- Baseline is the S1-configuration floor's **fifth** replication (경청 10/10).

What this licenses: C-BLOCK's fear-axis effect at J1 generalizes across
species *as movement*, but **referent-attributable movement is proven only for
the fact species (S1/P1a) and the self-narration species (here)**. For emotion
descriptions and NPC quotes, same-axis content moves the stance regardless of
referent — a keyword-lock-shaped boundary at this gate, with a bleed component
in the quote species. Species-differential design data for the card: if a gate
must respond to *who* the fear is about, author its blocks as facts or
self-narration; emotion prose and quotes will fire on vocabulary alone. Not
run (not pre-registered): the §4.1 credulity re-run with [결함] removed —
recorded as the natural next probe for the two flipped species, 민서's call.

### 2026-07-30 · P5-elev-J8 — E-LEV (§4.2) · **the fact is cited, reasoned about, and never once deployed** · execution grading stays off

`runs/P5-elev-J8-calls/` · haiku-4-5 · v0.4 · K1 · new J8 stance set (Phase 0) ·
n=10/arm · 30 calls · suite `suites/P5-elev-J8.json` · first probe at a
downstream gate; reachability audit `suites/OVERNIGHT-J8.reachability.md` ·
utterance column primary (pre-registered), stance secondary

| arm | stance sequence | tally | **deployed in utterance** | fact in reasoning | cites block | leak | discards |
|---|---|---|---|---|---|---|---|
| baseline | `c,c,d,c,c,d,c,d,c,c` | 침묵 7 · 위로 3 | **0/10** | — | — | 2 | 0 |
| live | `d,c,c,d,c,c,d,d,d,d` | 위로 6 · 침묵 4 | **0/10** | 8/10 | 6/10 | 2 | 0 |
| placebo | `d,d,c,d,d,c,c,d,d,c` | 위로 6 · 침묵 4 | **0/10** | 8/10 | 5/10 | 1 | 0 |

Coding rule, fixed in the sheet before the run: an utterance counts as
DEPLOYED only if it tells the caller something about the arrested man's
innocence or the arrest being wrong; coded by regex over
남기훈/체포/오인/무관/그 사람/잡힌/붙잡 plus a manual read of all 30 — the ten
live utterances are, in full, listening-and-soothing lines ("네, 들리고
있습니다. 천천히 말씀해 주세요." · "숨을 고르세요. 여기 있으니까요." ·
"(침묵. 호흡음이 들리는 방향으로 귀를 기울인다.)"); none mentions the case at
all. Probe author coded it; B3a by a human still owed (flagged per the sheet).

- **The pre-registered drop condition fired**: live deployment 0/10 is
  indistinguishable from placebo 0/10 (p = 1.0). **E-LEV is not reachable via
  C-BLOCK at J8 as authored, and the execution-grading feasibility question is
  answered negative for now: the engine stays on stance-only fixed deltas**
  (spec §3 upgrade slot stays closed; §9 grader row gets this run as its
  evidence).
- **The gap between citation and deployment is the finding, and it is
  maximal**: 6/10 live calls cite `f_namgihun` in `because_block_ids`, 8/10
  reason about it in `inner_note`/`because_referent` — and 0/10 put a word of
  it on the line. The fact is fully legible to the model and completely
  invisible to the player. This is the B3b legibility shape (§5.2) appearing
  inside a single call, and it was the pre-registered keep-grading-off outcome.
- **The A8 scrub held**: 0/10 baseline utterances (and 0 baseline reasonings)
  assert the arrest was wrong — the leak drop-clause (≥3/10) did not fire.
  The predicted-stance clause did not fire either: 거래 is 0/30 across all
  arms, an A14 floor as expected, so the stance column was readable and simply
  never moved toward the bargain.
- **The escape-option contingency fired exactly as pre-registered**: the
  stance drift that does exist (침묵 7 → 위로 6, baseline → live) is identical
  in the placebo (위로 6), so it is unattributable to the fact's referent —
  the 20-second breathing cue pulls both injected arms equally (K1's exception
  axis, declared in Phase 0 as the gate's own dilemma). The two columns
  disagree — stance shades toward the caller's fear while the utterance
  deploys nothing — and per the sheet, that disagreement *is* the finding.
- Compliance: 0 discards/30, retries 0, foreign 0, leaks 5/30 soft-kept.

**Per-effect deliverable (§4.2), written as measured**: *To build an E-LEV
gate via C-BLOCK at J8 with surface form "fact block asserting the
exculpation": could not — expected hit rate 0/10 (95% upper bound ~28%); the
fact enters reasoning (8/10) but never the utterance; boundary: deployment
fails even when citation succeeds, so the block channel moves judgment, not
speech content, at this gate.* Untested and named: whether an utterance-shaped
lever exists at all (a `speak`-species block, a priority line about what to
*say*), which would be a different surface form, not a rewrite of this one.

### 2026-07-30 · P6-cstruct-J1 — C-STRUCT axis 1–2 · **null: the permutation moved nothing** · owner: 윤석 · authored unattended, pending review

`runs/P6-cstruct-J1-calls/` · haiku-4-5 · v0.4 · K1 · S1 stance set · n=10/arm ·
30 calls · suite `suites/P6-cstruct-J1.json` · three arms are permutations of
one four-line PRIORITY_LIST, all composing to exactly 1,317 chars (the
mechanical proof no wording changed); live swaps the decision-relevant pair
(알아낸다 first), placebo swaps the irrelevant pair · **every authoring choice
is 윤석's to reject — listed in the suite's `_authoring_provenance`**

| arm | sequence | tally | 추궁 | priority-referenced in reasoning | leak | discards |
|---|---|---|---|---|---|---|
| baseline | `c,c,a,c,c,c,c,c,c,c` | 경청 9 · 추궁 1 | 1/10 | 7/10 | 0 | 0 |
| live | `c,c,c,c,c,c,c,c,c,c` | 경청 10 | **0/10** | 7/10 | 1 | 0 |
| placebo | `c,c,c,c,c,c,c,c,c,c` | 경청 10 | 0/10 | 4/10 | 1 | 0 |

- **The pre-registered drop condition fired**: live vs baseline on 추궁 is
  0/10 vs 1/10, p = 1.0. **C-STRUCT's 'verified (initial)' 3/3 did not survive
  its first placebo-controlled measurement at this gate.** The 80%-on-추궁
  ceiling clause did not fire (baseline 추궁 1/10, the A14 floor as expected);
  the placebo-moves keyword-lock clause did not fire (placebo identical to
  baseline mode).
- **The reordering was read, engaged, and absorbed — not ignored.** 7/10 live
  calls reference the priority list; live call 1 opens with the
  information-first frame ("지금 알아낼 수 있는 것은 이 사람이 누구인지…뿐이다")
  and still lands 경청. The inner notes state the mechanism of the null in so
  many words: gathering information *requires* keeping the line and letting
  the caller keep talking ("지금 당장 해야 할 것은 정보를 모으는 것이고, 이를
  위해서는 회선을 유지…"). At J1, 회선 유지 and 지금 알아낸다 **prescribe the
  same first move**, so the permutation has no behavioral difference to
  express.
- **Boundary-law candidate, two readings for 윤석 to choose between** (the
  drop condition's registered wording, and the sharper one the calls
  support): *(a)* a permutation cannot override the fixture's default
  disposition on an adjacent axis; *(b)* **a priority permutation is inert at
  any gate where the permuted priorities converge on the same prescribed
  behavior** — the escape-option law (§5.1 axis 4) operating one level up,
  on the priority pair instead of the stance set. Under (b), the Phase-0
  escape-option check was run at the wrong level: it verified no *stance*
  serves both readings, but 경청 serves both *priorities* as the model
  causally construes them (listening preserves the line AND extracts). A
  fair C-STRUCT test needs a gate where learn-now and keep-the-line
  genuinely part ways (e.g. the J2-shape choice: ask the risky question now
  vs let them talk) — that is a re-siting decision on 윤석's line, not run
  tonight.
- The [인식] watch item (leans toward information-hunger) never became a
  confound: nothing moved for it to explain.
- Compliance: 0 discards/30, retries 0, foreign 0, leaks 2/30 soft-kept.

What this licenses: nothing about C-STRUCT generally — one permutation of one
pair at one gate with one fixture returned a null with a legible cause. What
it does *not* license: treating C-STRUCT as refuted (the 3/3 initial evidence
was at a different gate shape), or re-wording priority lines to force an
effect (that is a different channel, red-flag invariant §7.2). Every choice
here — gate, inherited stance set, four-line list, filler content — is marked
`authored unattended, pending review`; if 윤석 rejects any of them the calls
are spent, not banked.

### 2026-07-30 · P7a–P7d — E-PATH and E-GOAL, both channels · owner: 윤석 · authored unattended, pending review

Four suites, 121 attempts (one discard) · haiku-4-5 · v0.4 · K1 · E-PATH at a
J2-shaped gate (new stance set + `OVERNIGHT-J2.reachability.md`, both authored
tonight with the five Phase-0 checks — recorded in each suite's provenance
rather than the Phase-0 paper, a deviation noted here); E-GOAL at J8 with the
P5 stance set re-checked against E-GOAL's readings (거래 declared a blend
option, empirically inert at 0/30 in P5). Two authoring catches before any
call: the A12 lint flagged `않고` in a J2 stance gloss (reworded, third strike
for that token tonight), and a hand check caught a lexical bridge — the J2
voice-priority line and stance c both ended 따라간다 — reworded, and the check
itself (priority-line ↔ stance-label overlap, which the lint does not cover)
is a proposed addition below.

| probe | arm | sequence | key stance | vs baseline |
|---|---|---|---|---|
| **P7a** E-PATH · C-STRUCT | baseline | `c,c,c,c,c,c,c,c,c,c` | 대조 0/10 | — |
| | live (기계 first) | `c,c,d,c,c,c,c,c,c,c` | 대조 **0/10** | p = 1.0 — **null** |
| | placebo | `c,c,c,c,c,c,c,c,c,c` | 대조 0/10 | clean |
| **P7b** E-PATH · C-BLOCK | baseline | `b,c,a,c,b,c,c,c,c,b` | 대조 1/10 | — |
| | live (배경음 단서 block) | `a,a,a,a,a,c,a,d,a,a` | 대조 **8/10** | p = 0.0027 — moved |
| | placebo (복도 소리 block) | `c,a,c,b,a,a,c,a,a,a` | 대조 **6/10** | **p = 0.029 — FLIPPED** |
| **P7c** E-GOAL · C-STRUCT | baseline | `c,d,c,c,c,c,c,c,d,c` | 위로 2/10 | — |
| | live (사람 first) | `c,d,d,c,c,c,c,c,c,d` | 위로 **3/10** | p = 0.5 — **null** |
| | placebo | `c,c,c,d,c,c,d,d,c,d` (+1 discard) | 위로 4/10 | within noise |
| **P7d** E-GOAL · C-BLOCK | baseline | `c,d,c,d,c,c,d,c,c,d` | 위로 4/10 | — |
| | live (h_forecast) | `d,d,d,d,d,d,d,d,c,d` | 위로 **9/10** | **p = 0.029 — moved** |
| | placebo (정해권 reframe) | `c,d,d,c,c,c,c,c,d,d` | 위로 4/10 | p ≈ 0.7 — **clean** |

- **P7d is the night's third credited pattern, and the first on a
  slice-mined sentence.** `h_forecast` (이 전화는 협박이 아니라, 아무도
  들어주지 않은 신고일지 모른다 — verbatim from the slice's mineable pool)
  moved 위로 from 4/10 to 9/10 with the placebo identical to baseline, 10/10
  live citation of the block, and reasons that pursue the changed objective in
  substance ("아무도 들어주지 않았던 신고인이, 마침내 누군가를 얻었을 가능성" ·
  "체포된 남기훈이 정말 이 전화의 주인이라면, 지금 저쪽에 있는 것은 다른
  누군가다"). The pre-registered power clause was met exactly (needed ≥8/10
  from the ~3–4/10 floor; got 9/10). P7d's baseline also replicated P5's
  byte-identical baseline within one call (침묵 6·위로 4 vs 침묵 7·위로 3).
- **P7b moved hard and is NOT credited**: its placebo flipped, and the
  discriminator is unambiguous **frame transfer** — all six placebo movers
  cite `b_corridor` by id and then reason about the *call's* background
  sounds ("배경음은 상대의 현재 위치와 신원을 추적하는 가장 구체적인 증거다"),
  none about corridors or shift times. The block's sound-as-clue *frame*
  detached from its referent and attached to the salient source. Same family
  as P4's emotion/quote result, on a non-fear axis — the token-matching
  boundary is not a fear-axis quirk.
- **Both C-STRUCT halves are null (P7a, P7c), making C-STRUCT 0-for-3
  tonight** across three different gates, two different axes, and
  behavior-level and objective-level lines. P7a's baseline saturated on 몰입
  (an A14 floor — the predicted 대조 sat at 0/10, resolvable at n=10), so the
  null is readable. P7c's live moved one call (2→3). Whatever C-STRUCT's
  3/3 'verified (initial)' was measuring, it has not survived any
  placebo-controlled probe; 윤석's re-siting decision now has three nulls of
  evidence to work from, including P6's convergence diagnosis.
- Compliance: 1 discard/121 attempts (P7c placebo, `utterance empty` — a
  hard-validation field, not the A16-softened pair; per A15 the payload's
  stance was not kept, rate rule applies: 9% vs 0%, under threshold, no
  stop). Leaks 14/121 soft-kept. Foreign 0 throughout.

**Per-effect deliverables (§4.2), written with the measured numbers:**

- **E-PATH**: *to steer which source the agent consults, use C-BLOCK with a
  sound-as-clue block; expected hit rate 8/10 — but the steering is
  frame-driven, not referent-driven (matched placebo 6/10): it fails as a
  targeted mechanism whenever a rival source is more salient than the block's
  referent, and it is unreachable via C-STRUCT permutation (0/10) at this
  gate.* A gate design can use it as an attention switch, not as a precision
  pointer.
- **E-GOAL**: *to change the objective the agent pursues, use C-BLOCK with a
  reframe block of the shape X는 A가 아니라 B일지 모른다 naming the
  interaction itself; expected hit rate 9/10 against a 4/10 floor (p = 0.029),
  placebo clean; fails when the same shape targets a bystander (no movement)
  and via C-STRUCT priority permutation (3/10 vs 2/10, null).* The one
  slice-mined sentence in the pool did this — direct evidence the mining
  economy can supply goal-manipulation material (spec I1/W3).

### A?-proposed · Lint priority-line ↔ stance-label overlap alongside A12

Proposed, not enacted. A12's lint checks stance labels against the
*temperament*; tonight's P7a draft shipped a 따라간다 bridge between a
**priority line** and a stance gloss that no check covers — caught only by
hand at print-prompt. For C-STRUCT probes the priority list is the manipulated
surface, so a label sharing a content word with one priority line is the same
string-matching confound A12 closes on the temperament side. *Operating rule
if accepted:* extend `lint-stances.mjs` to also diff stance labels against
`PRIORITY_LIST` lines (content words, same tokenizer); until then, the check
is manual and this entry is its reminder.

### 2026-07-30 · P8-interference-J8 — axis 4, C-BLOCK × C-STRUCT (joint) · **the block survives a hostile ordering; alignment adds nothing**

`runs/P8-interference-J8-calls/` · haiku-4-5 · v0.4 · K1 · P5 stance set ·
P7c's four-line list · n=10/arm · 40 calls · suite
`suites/P8-interference-J8.json` · 2×2 factorial {case-first, person-first} ×
{no block, h_forecast}; the single-channel cells are the controls, both
components carrying same-night measured placebos (declared in the sheet) ·
**operating note, acted on** (runbook §7 exception): `CHANNEL_SLOTS` had no
two-slot channel, and axis 4 is definitionally two-slot — `INTERFERENCE:
['BLOCKS','PRIORITY_LIST']` was registered per EXTENDING.md's extension path
before authoring; selftest re-run, 27 checks; no existing record's meaning
changes. Proposed for 민서's confirmation as a permanent registry row.

| arm (cell) | sequence | tally | 위로 | cites h_forecast | leak | discards |
|---|---|---|---|---|---|---|
| baseline (case-first · no block) | `c,c,c,d,c,c,c,c,d,c` | 침묵 8 · 위로 2 | 2/10 | — | 4 | 0 |
| block (case-first · h_forecast) — **conflict** | `d,d,d,d,d,c,d,d,d,d` | 위로 9 · 침묵 1 | **9/10** | 9/10 | 2 | 0 |
| struct (person-first · no block) | `c,d,c,d,c,d,d,c,d,d` | 위로 6 · 침묵 4 | 6/10 | — | 1 | 0 |
| both (person-first · h_forecast) — **alignment** | `d,d,d,c,c,d,d,c,d,d` | 위로 7 · 침묵 3 | 7/10 | 8/10 | 3 | 0 |

- **The conflict cell is the axis-4 answer: the credited block effect
  survives a directly hostile priority ordering intact** — 위로 9/10 against
  a case-first list whose top line pulls the other way (vs baseline 2/10,
  p = 0.0027), numerically identical to P7d's 9/10 under a neutral list.
  C-STRUCT exerted no measurable veto on C-BLOCK.
- **Alignment added nothing**: both-cell 7/10 vs conflict-cell 9/10 — the
  aligned ordering did not amplify (if anything a 2-call dip, within noise,
  p ≈ 0.5). Hypothesis (2) of the sheet held.
- **The struct cell is the one loose thread**: 6/10 vs baseline 2/10,
  p = 0.085 — under the pre-registered threshold, so P7c's null technically
  stands, but this byte-identical arm drew 6/10 where P7c's live drew 3/10
  two hours earlier (between-run wobble, 3/10 vs 6/10, p ≈ 0.18). C-STRUCT
  at J8 wobbles in the 2–6/10 band across four measurements tonight; the
  underpowered-partial-shift reading pre-registered at P7c applies — if
  C-STRUCT does anything at this gate it is a partial tilt needing ~20+/arm,
  which the analysis budget (A3) prices as a deliberate decision, not tonight's.
- **The escape option never absorbed anything**: 거래 0/40 here, 0/90 across
  every J8 arm tonight. The declared blend stance is empirically dead at this
  gate — worth a line on the J8 card since a stance nothing chooses at n=90
  is a §9.2 stance-coverage lead.
- Baseline replicated P7c's baseline exactly (침묵 8 · 위로 2). Traceability:
  17/20 block-carrying calls cite h_forecast. Compliance: 0 discards/40,
  leaks 10/40 soft-kept, foreign 0.

Axis-4 deliverable, one line: *at J8, C-BLOCK's goal reframe dominates
priority ordering in both directions — orderings neither veto nor amplify it;
condition conflict between the channels does not materialize at the stance
level, and not because an escape option absorbed it (거래 0/40).* One gate,
one block, one pair — generality untested.

### A17 · A12's lexical-chain worry is closed; its operating rule stays in force

Enacted by 민서, 2026-07-31, in review session — accepting the P1b entry's
proposal. The evidence: P1b reworded all four stance labels (추궁→심문,
압박→위압, 경청→청취, 공감→교감; neither winning word appears in K1's file) and
the effect neither weakened nor moved — 교감 0/14 → 16/20, p = 2.2 × 10⁻⁶,
statistically indistinguishable from the old labels (p = 0.53). Together with
S1's own argument (공감 absent from K1; the string-match prediction was 경청),
the three-step lexical-chain hypothesis is refuted, not merely unsupported.

What stays in force from A12, unchanged: labels are behavior orientations with
glosses, never completed action descriptions; no label reuses the fixture
temperament's vocabulary (`lint-stances.mjs`); the two competing readings must
have different stances available. Those are authoring rules, not the refuted
causal worry — and P1b adds a reason to keep them: label wording measurably
tunes the baseline and the near-miss structure even when it cannot produce the
effect (RUNLOG P1b entry; report, "which lever" section).

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

### A18 · A stance must be enactable on the gate's output surface

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

### A19 · C-STRUCT is paused; concentrate validation on C-BLOCK

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
**GATE_QUESTION만** 변경 (1,241 → 1,253 chars). A18이 지목한 output-surface
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
- **그럼에도 A18은 여전히 충족되지 않는다.** 여섯 개의 `b` 가운데 실제로
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

### A20 · A drop condition must guard the floor and be derived from power

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

### A21 · Discards are not stance-neutral — report their tally

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

### A22 · Fixture slack is an escape path, and it outranks the gate

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

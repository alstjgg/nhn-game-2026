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

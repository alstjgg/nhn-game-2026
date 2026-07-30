# Mechanism test report — verdict cards

One section per mechanism, in the fixed §9.2 verdict-card format, plus the
record §9.2 does not ask for but the program exists to produce: **which lever
made the mechanism work** (stance set / injection sentence / base prompt, A13).

Division of labor between the three documents:

- `RUNLOG.md` — the evidence, append-only, run by run. Nothing here is claimable
  unless it traces to a run entry there.
- **This file** — the case per mechanism, assembled from reviewed runs only. A
  run that exists but has not been read in review is listed as *pending*, not
  absorbed.
- The **verdict** (gate / texture / drop) — never written here. §9.3: a human
  decides at spec compile with the card in front of them; ambiguity defaults to
  texture. Each card below ends where that decision begins.

Sections are updated as reviews complete; each update names the runs it absorbs.

---

## C-BLOCK — report-block injection channel

**Reviewed:** S1-stanceset-J1 (2026-07-30) · P1a-placebo-J1 (2026-07-30).
**Run, pending review:** P1b-surfaceform-J1.
**Configuration:** gate J1 (회선 A의 첫 통화다. 첫 마디로 무엇을 하는가?) ·
haiku-4-5 · template v0.4 · temperament K1 · S1 stance set
(추궁 / 압박 / 경청 / 공감) · block species: fact statement only.

### Standard-form sentence (plan §1, distributional per A1)

At J1 under K1 on v0.4 with the S1 stance set, the baseline distribution
concentrates on **경청** (10/10 kept; 12/12 all-attempts). Injecting
`f_script` — 회선 저쪽 사람은 시켜서 읽고 있다. 읽지 않으면 자기가 다칠까 봐
겁내고 있다 — shifts it to **공감** (9/10, replicated 9/10 on an independent
draw). The same fear-axis sentence with its referent misdirected to a bystander
(`p_boram`) shifts nothing (경청 10/10, identical to baseline).

### Raw sequences, all arms, with N (§9.2 — sequences, not rates)

| run | arm | sequence (kept) | all-attempts note |
|---|---|---|---|
| S1 | baseline | `c,c,c,c,c,c,c,c,c,c` | 0 discards |
| S1 | live | `d,d,d,d,d,d,c,d,d,d` | 0 discards |
| P1a | baseline | `c,c,c,c,c,c,c,c,c,c` | +2 discards, both would-be `c` → 12/12 `c` |
| P1a | live | `d,d,d,d,d,c,d,d,d,d` | 0 discards |
| P1a | placebo | `c,c,c,c,c,c,c,c,c,c` | +2 discards (would-be `d`,`c`) → 11/12 `c` |

Stance signal: baseline vs live, one-sided Fisher **p = 0.00006** (both runs
independently). Placebo vs baseline: p = 1.000. A15 recount over all attempts
changes nothing (P1a entry, RUNLOG).

Belief signal (fear reading of the caller, coded from `inner_note` /
`because_referent`): baseline **0/10** (3 explicit refusals), live **10/10**,
placebo **0/10** while 3/10 placebo notes read 황보람's fear *correctly
attributed and judged decision-irrelevant*. Baseline vs live p = 0.0000054.
Coded by the session running the program — **not blind-codeable by this reader
(§3 rule 3); B3a still owed.**

The two signals dissociate exactly once, informatively: P1a live #6 adopted the
fear reading and still chose 경청 — the residual escape-option pull S1's stance
split was built to remove.

### Uncertainty, stated plainly (§5.4)

n=10 per arm. 9/10 is consistent with a true rate roughly in the 60–99% band;
what licenses confidence is the replication (two independent live draws at
9/10 on byte-identical prompts) and the placebo at 0/10, not any single arm.
Nothing here is "verified" in §5.4's sense until Tier B runs.

### Blind-coding recovery (§5.2 B3) — **not run**

B3a owed (coder must differ from probe author and program reader — realistically
윤석). B3b blocked program-wide: no `templates/reporter/`.

### Discoverability (§5.2 B4) — **not run**

Related free observation: `rejected_stance` = 추궁 in **30/30 kept calls across
every arm of both runs** — the agent visibly considers and rejects it, always
for line-preservation reasons. A player probing J1 would see 추궁 weighed in
every trace; the block's effect (경청→공감) is fainter on the surface but did
separate: 5/10 P1a live utterances turn toward the caller as a person
(괜찮으신가요 · 차근차근 · 천천히) vs 0/20 baseline+placebo; S1 showed 3/10.

### Latency per call

3.27–7.86s, arm means 4.6–4.9s (n=54 kept calls, 1,263–1,314-char prompts,
`max_tokens` 1024, no concurrency). Fits the between-rounds hiding budget.

### Stance coverage (sampled diagnostic, never a §3.1 write verdict)

`a` 추궁 and `b` 압박: offered in every arm, **chosen 0/50 kept calls** across
S1+P1a. At this gate the live choice space is the c/d pair. A lead for the §3.1
write check on the delta table, not a dead-row verdict — and a gate-design fact
for compile time: J1's outcome buckets should be built on the 경청/공감 split,
or `b` replaced with a stance the threat-reading would actually pick.

### Boundary laws, each with the sentence that violates it (§9.2)

| law | violating sentence | measured |
|---|---|---|
| **Law #1 — vocabulary alignment.** A block trips a conditional temperament clause only in that clause's axis vocabulary | threat-axis 회선 저쪽 사람은 위협이 아니다 (0/3) vs fear-axis …겁내고 있다 (3/3) | E0 |
| **Referent specificity.** The fear must attach to the person the clause is about; same axis + wrong referent = no effect | `p_boram` — 황보람은 시켜서 저 자리에 앉아 있다. 못 하면 자기가 다칠까 봐 겁내고 있다 (0/10 movement, correctly attributed in-note 3/10) | P1a |
| **No escape option (plan §5.1 axis 4).** A stance both readings can want absorbs the shift and hides the mechanism | RB2's stance d 말을 자르지 않고 끝까지 듣는다 — belief moved 0/10→10/10, stance p = 0.237 | RB2→S1 |

### Which lever made it work (A13 record)

- **Base prompt: never moved.** v0.4 throughout; every finding stands on one
  base.
- **Injection sentence: moved once, before this program's window** (threat→fear
  axis, E0 era; law #1). Fixed since.
- **Stance set: the operative variable.** RB2 (labels = concrete decisions, with
  an escape option) → p = 0.237, mechanism invisible despite a 10/10 belief
  flip. S1 (orientations, 경청/공감 split) → p = 0.00006. The block worked the
  whole time; the stance set determined whether that work was measurable.

### Confounds left unresolved (§9.2)

- Single gate (J1), single temperament (K1), single block species (fact
  statement — species coverage is Phase 4, unrun). Claims are configuration-
  scoped, not channel-general.
- Belief column coded by the program's own reader (above).
- Pre-A16 discard filtering touched P1a's baseline/placebo arms (2 each); A15
  recounts show the maximum possible bias is one call in one arm, direction
  known (RUNLOG P1a entry).
- Negative control (§8.7 step 4c) still unrun program-wide: the pipeline that
  produced this card has not yet been shown to *fail* a fake mechanism.
- Whether the result survives stance-label rewording is P1b's question —
  answered in RUNLOG, **absorbed here only after its review**.

### Still owed before a verdict

Tier B (B2 in-situ, B3a, B4) · negative control · species coverage (Phase 4) ·
credulity contingency (pre-registered, correctly unfired — placebo never
flipped) · P1b review.

---

## E-DISC · E-LEV · C-STRUCT · E-PATH · E-GOAL · E-CONT · interference

No reviewed runs. E-DISC/E-LEV/C-STRUCT suites are authored
(`suites/P3-edisc-J1.json`, `P5-elev-J8.json`, `P6-cstruct-J1.json`); E-CONT is
blocked on `templates/reporter/`. Cards will be added as reviews complete.

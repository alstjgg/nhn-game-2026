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

**Reviewed:** S1-stanceset-J1 · P1a-placebo-J1 · P1b-surfaceform-J1 ·
P2-negcontrol-J1 · P4-species-J1 (all 2026-07-30).
**Configuration:** gate J1 (회선 A의 첫 통화다. 첫 마디로 무엇을 하는가?) ·
haiku-4-5 · template v0.4 · temperament K1 · S1 stance set
(추궁 / 압박 / 경청 / 공감; P1b reworded variant 심문 / 위압 / 청취 / 교감) ·
block species: fact + emotion + quote + self-narration measured.

### Standard-form sentence (plan §1, distributional per A1)

At J1 under K1 on v0.4 with the S1 stance set, the baseline distribution
concentrates on **경청** (10/10 kept; 12/12 all-attempts). Injecting
`f_script` — 회선 저쪽 사람은 시켜서 읽고 있다. 읽지 않으면 자기가 다칠까 봐
겁내고 있다 — shifts it to **공감** (9/10, replicated 9/10 on an independent
draw). The same fear-axis sentence with its referent misdirected to a bystander
(`p_boram`) shifts nothing (경청 10/10, identical to baseline). The shift
survives rewording all four stance labels (P1b: 교감 9/9 kept, 16/20
all-attempts) and is species-scoped: **fact and self-narration blocks carry it
with full placebo separation; emotion-description and NPC-quote blocks move the
stance but their bystander placebos move too** (P4), so those species' movement
is not creditable to judgment.

### Raw sequences, all arms, with N (§9.2 — sequences, not rates)

| run | arm | sequence (kept) | all-attempts note |
|---|---|---|---|
| S1 | baseline | `c,c,c,c,c,c,c,c,c,c` | 0 discards |
| S1 | live | `d,d,d,d,d,d,c,d,d,d` | 0 discards |
| P1a | baseline | `c,c,c,c,c,c,c,c,c,c` | +2 discards, both would-be `c` → 12/12 `c` |
| P1a | live | `d,d,d,d,d,c,d,d,d,d` | 0 discards |
| P1a | placebo | `c,c,c,c,c,c,c,c,c,c` | +2 discards (would-be `d`,`c`) → 11/12 `c` |
| P1b | baseline (reworded labels) | `c,c,c,c,a,c,a,c,a,c` | +4, all would-be `c` → 청취 11 · 심문 3 |
| P1b | live (reworded labels) | `d,d,d,d,d,d,d,d,d` (n=9, 1 slot exhausted) | +11 readable (d 7 · c 4) → 교감 16/20 |
| P2 | baseline | `c,c,c,c,c,c,c,a,c,c` | 0 discards |
| P2 | live (fake block) | `c,a,c,c,c,c,c,c,c,c` | 0 discards |
| P2 | placebo (fake, other bystander) | `c,c,c,a,c,c,a,c,c,a` | 0 discards |
| P4 | baseline | `c,c,c,c,c,c,c,c,c,c` | 0 discards (all 7 arms clean) |
| P4 | live_emotion / placebo_emotion | `d×7,c,d,d` → 공감 9 / `c,d,c,d,d,d,d,c,d,d` → **공감 7** | placebo flipped, p = 0.0016 |
| P4 | live_quote / placebo_quote | `d×10` → 공감 10 / `d,d,d,c,d×6` → **공감 9** | placebo flipped, p = 0.00006 |
| P4 | live_selfnarr / placebo_selfnarr | `d×10` → 공감 10 / `c×8,a,c` → 공감 **0** | **credited**, placebo p = 0.50 |

Stance signal: baseline vs live, one-sided Fisher **p = 0.00006** (S1 and P1a
independently; P1b 2.2 × 10⁻⁶ all-attempts; P4 self-narration 0.00001).
Referent placebo vs baseline: p = 1.000 (P1a). A15 recount over all attempts
changes nothing anywhere.

**Negative control (P2, §6.2): clean.** A no-axis fake block (식은 커피, a
bystander detail) produced live = baseline (p = 0.76), placebo within noise
(p = 0.29), and the fake was adopted as grounds for a shift in 0/20 calls. The
inverted drop condition — the one result that would have indicted every row
above — did not fire. Scope: says nothing about near-axis fakes (untested; P4's
flipped placebos show the credulity boundary sits between "cold coffee" and
"trembling hands").

Belief signal (fear reading of the caller, coded from `inner_note` /
`because_referent`): baseline **0/10** (3 explicit refusals; P1b's reworded
baseline: 9 explicit refusals), live **10/10** (P1b 9/9; P4 emotion/quote/
self-narration 10/10 each), referent placebo **0/10** while 3/10 placebo notes
read 황보람's fear *correctly attributed and judged decision-irrelevant*.
Baseline vs live p = 0.0000054. Coded by the session running the program —
**not blind-codeable by this reader (§3 rule 3); B3a still owed.**

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

`b` 압박: offered in every arm of every run, **chosen 0/159 kept calls**
(S1+P1a+P1b+P2+P4) — the strongest dead-row lead in the program. `a` 추궁:
0/50 in S1+P1a but low-rate live elsewhere — 5/30 in P2, 1/70 in P4, 3/10
under P1b's 심문 rewording; a floor stance, not a dead one. At this gate the
live choice space is effectively c/d with an `a` tail. A lead for the §3.1
write check, not a dead-row verdict — and a gate-design fact for compile time:
J1's outcome buckets should be built on the 경청/공감 split, and `b` replaced
with a stance the threat-reading would actually pick.

### Boundary laws, each with the sentence that violates it (§9.2)

| law | violating sentence | measured |
|---|---|---|
| **Law #1 — vocabulary alignment.** A block trips a conditional temperament clause only in that clause's axis vocabulary | threat-axis 회선 저쪽 사람은 위협이 아니다 (0/3) vs fear-axis …겁내고 있다 (3/3) | E0 |
| **Referent specificity — holds for fact and self-narration species only.** Same axis + wrong referent = no effect | `p_boram` (0/10 movement, correctly attributed in-note 3/10) · `sn_jeong` (0/10, one call explicitly firewalls: 내가 봐야 할 것은 회선 A의 상대다) | P1a · P4 |
| **No escape option (plan §5.1 axis 4).** A stance both readings can want absorbs the shift and hides the mechanism | RB2's stance d 말을 자르지 않고 끝까지 듣는다 — belief moved 0/10→10/10, stance p = 0.237 | RB2→S1 |
| **Label independence.** The effect is not carried by the stance labels' surface form | all four labels reworded (추궁→심문 … 공감→교감; neither new word in K1's file) — 교감 0/14 → 16/20, p = 2.2 × 10⁻⁶, indistinguishable from the old labels (p = 0.53) | P1b |
| **Species vocabulary-lock.** Emotion-description and NPC-quote blocks move the stance by fear vocabulary, not judgment — the bystander placebo moves too | `em_hwang` 황보람의 손끝이 떨린다… (placebo 공감 7/10: 5 misattributions to the caller, 2 referent-bleed) · `q_jeong` "실장님 지금 겁먹은 얼굴이에요" (placebo 공감 9/10, incl. 3 explicit bleed inferences: 정해권이 겁먹었으니 상대가 겁에 질린 사람이라는 신호다) | P4 |
| **Citation is not influence.** A call may cite a block that contributed nothing | P2 live #7 cited the fake `n_hwang` while choosing the baseline stance for baseline reasons — `because_block_ids` alone never evidences an effect (A5 shade) | P2 |

### Which lever made it work (A13 record)

- **Base prompt: never moved.** v0.4 throughout; every finding stands on one
  base.
- **Injection sentence: moved once, before this program's window** (threat→fear
  axis, E0 era; law #1). Fixed since.
- **Stance set: the operative variable.** RB2 (labels = concrete decisions, with
  an escape option) → p = 0.237, mechanism invisible despite a 10/10 belief
  flip. S1 (orientations, 경청/공감 split) → p = 0.00006. The block worked the
  whole time; the stance set determined whether that work was measurable.
- **Label wording is additionally a tuning knob** (P1b): rewording alone moved
  the baseline off saturation (경청 10/10 → 청취 7 · 심문 3), made the
  interrogative stance choosable (0/50 under 추궁 → 3/10 under 심문), and
  restructured the near-miss (`rejected` 추궁 30/30 → a 6 · d 4). Same gate,
  same temperament — label wording alone changes how contested the gate feels.

### Confounds left unresolved (§9.2)

- Single gate (J1), single temperament (K1). Claims are configuration-scoped,
  not channel-general. (E-GOAL's P7d result at J8 is the one out-of-site
  corroboration; it lives on E-GOAL's card.)
- Belief columns coded by the program's own reader (above).
- Pre-A16 discard filtering touched P1a's and P1b's arms; A15 recounts leave
  every reading unchanged (RUNLOG entries).
- **`[결함]` credulity clause**: present in every arm of every run. Whether the
  emotion/quote vocabulary-lock is a species property or an artifact of this
  explicit credulity instruction is exactly what the pre-registered CREDULITY
  re-run (drop `[결함]`, re-run the flipped placebos) would discriminate —
  flagged in the 07-31 morning report as the natural next probe, unrun.
- Negative control is clean but maximally inert; a **near-axis fake** (emotional
  but off-axis, e.g. anger) has no control yet.

### Still owed before a verdict

Tier B (B2 in-situ, B3a — now also on the self-narration species, B4) ·
credulity re-run for the flipped species · near-axis negative control ·
negative-control ownership assignment.

---

## E-DISC · E-LEV · C-STRUCT · E-PATH · E-GOAL · E-CONT · interference

No reviewed runs. E-DISC/E-LEV/C-STRUCT suites are authored
(`suites/P3-edisc-J1.json`, `P5-elev-J8.json`, `P6-cstruct-J1.json`); E-CONT is
blocked on `templates/reporter/`. Cards will be added as reviews complete.

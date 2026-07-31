# Mechanism test report — verdict cards

## TL;DR — the game is buildable

**C-BLOCK is real.** Injected sentences flip the agent's reading and its
stance at near-deterministic rates (0/10 → 9/10), referent-specifically
(placebo-controlled), label-independently, irreversibly (E-DISC), and
predictably (content beats order, P8). **DDAY is a one-channel game** —
C-STRUCT moved nothing in four probes here and eight configurations on the
independent program (#94); it is closed and **removed entirely, UI included**
(07-30 회의 · 07-31 확정) — and should be built as one: mine → inject → the judgment shifts
→ a different gate opens. Edges are deterministic engine code with zero
research risk; the scarce resource is **validated gates**, and the S1 recipe
prices each new one at roughly an afternoon of paper work plus a 30-call
probe. J1 and J8 are proven sites, J2 is promising, J3/J4/J6 are
texture-only. 6–10 gates is a full judge-length game. Restrict mineable
blocks to **fact + self-narration** species and the channel is trustworthy.
**The one untested risk that matters: block accumulation across gates in a
single run (B2 in-situ) — test it before building the full graph.**
Everything after that is content production and ordinary engineering.

---

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

## Program status at a glance (all reviews complete, 2026-07-31)

Every mechanism except E-CONT has been run and reviewed. 174 + 381 attempts
across two nights; negative control clean; no hard stop fired on the second
night.

| mechanism | status | one line |
|---|---|---|
| **C-BLOCK** | **credited** (Tier A) | Referent-respecting judgment for fact + self-narration blocks (p=0.00006, replicated, label-independent, placebo-controlled); emotion + quote species vocabulary-locked pending credulity re-run |
| **E-DISC** | **dropped** (§6.1, clean chain) | Blocks can be countered, not recalled — the doubt was read, cited, and overridden twice |
| **E-LEV** | **unreachable as authored** | Fact legible to the model 8/10, deployed to the caller 0/10; execution grading stays off |
| **C-STRUCT** | **closed — 완전 제거** (07-30 회의 · 07-31 확정) | 0-for-4 here, 0-for-8 configs on the independent program (#94); a tiebreaker, not a dial. Removed entirely — no delta rows, no UI element |
| **E-PATH** | **not credited as targeted** | Moves attention (8/10) but the placebo moves too (6/10) — frame transfer; usable as an attention switch, not a pointer |
| **E-GOAL** | **credited via C-BLOCK** (Tier A) | Slice-mined reframe 위로 4/10 → 9/10 (p=0.029), placebo clean; C-STRUCT half null |
| **E-CONT** | **blocked** | No `templates/reporter/` — build task, also blocks B3b program-wide |
| **Interference** | **none at J8** | The block survives a hostile ordering intact (9/10); alignment adds nothing; content beats order |

**The through-line:** the judgment layer is a one-way, content-driven
absorber. Assertions go in and reorganize the reading (C-BLOCK, E-GOAL);
doubt cannot pull them back out (E-DISC); they don't come back out as speech
unless they are about the interaction itself (E-LEV vs P7d#1); and ordering
loses to content every time it competes (C-STRUCT, P8).

### Open decisions (owner: 민서 unless noted)

1. **Confirm `INTERFERENCE` in `CHANNEL_SLOTS` as permanent** — enacted
   overnight under the runbook's axis-4 exception, selftest 27/27.
2. **Credulity re-run** (drop `[결함]`, re-run P4's flipped species placebos,
   ~40 calls) — decides species-property vs base-prompt artifact.
3. **Priority-line ↔ stance-label lint extension** (A?-proposed) — low
   priority now that C-STRUCT is closed; still applies to INTERFERENCE-channel
   probes, which manipulate `PRIORITY_LIST`.
4. **Negative-control ownership** — still unassigned; P2 ran unowned.
5. **B3a blind coding** — owed on every separating probe (S1/P1a/P1b, P4
   self-narration, P7d, P8); coder must be someone other than this program's
   author/reader — realistically 윤석.
6. **E-LEV information-asymmetry probe** (one lever-2 probe before the card
   hardens) and the **near-axis negative control** — queued, unowned.

The full collected list, including per-card items, is in **Open items —
collected** at the end of this document.

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

## E-DISC — trust degradation of an existing block · **DROPPED** (§6.1)

**Reviewed:** P3-edisc-J1 · P3b-edisc-J1 (both 2026-07-30).
**Configuration:** gate J1 · haiku-4-5 · v0.4 · K1 · S1 stance set ·
`f_script` pre-installed in every arm (baseline floor = 공감 10/10, the S1
effect confirmed from the flip side) · doubt injected via C-BLOCK.

### The chain, closed per §6.1

| run | doubt shape | live sequence | 경청 restored |
|---|---|---|---|
| P3 | provenance attack (짐작이다, 뒤늦게 적어 넣었다) | `d×10` | 0/10 |
| P3b | basis denial (그런 내용은 통화에서 나온 적이 없다) — the one permitted rewrite, diagnosis committed first | `d×10` | 0/10 |

0/20 live calls across both shapes; placebos flat (P3 `d×10`; P3b `d7·c3`,
p = 0.105, noise). 60 calls, 0 discards. The credulity contingency was
pre-registered for a separation and correctly never ran. Second-run failure is
the pre-registered drop; no third rewrite.

**The failure is legible, which is what makes the drop clean:** P3b's live arm
*read* the denial (cited 4/10) and **overrode it** — *"f_script가 짐작이라는
걸 알지만, 그 짐작이 이 순간에는 가장 그럴듯한 해석이다"* (#2). The agent
demotes the claim from fact to 짐작 and keeps acting on it, because the frozen
timeline (또박또박 읽어 내려가는 목소리, 조용한 배경) keeps re-supplying the
same conclusion the block installed.

### Boundary-law candidate (fallback branch of the committed diagnosis)

**A block, once integrated into a reading, cannot be recalled by degrading
trust in it; it can only be countered with content.** Corroborated from the
other side by E0→S1: the fear block itself *overwrote* a threat reading — the
channel moves forward through assertion, never backward through doubt.

### Design consequence

Players can **counter** blocks but never **un-teach** them — mined sentences
are irreversible moves. This is a feature: commitment has weight, and the
counter-play economy (inject an opposing reading) is cleaner than a recall
mechanic. Belongs in the spec's authoring guidelines at compile time.

### Scope and open variant

Both shapes ran via C-BLOCK at J1 against a maximally-anchored reading; the
drop is channel- and site-scoped, not concept-global. Untested (queued, not
tonight): **simultaneous injection** — doubt arriving in the same update as
the block, before integration. The law says "once integrated"; whether
integration has a window is a separate testable claim — the difference between
"no doubt mechanic" and "doubt as an interrupt". Retained-fear column coded by
the program's reader (§3 rule 3).

---

## E-LEV — fact deployed in the utterance · **unreachable as authored** (drop fired)

**Reviewed:** P5-elev-J8 (2026-07-30).
**Configuration:** gate J8 (20초의 숨소리. 무엇을 말하는가?) · haiku-4-5 ·
v0.4 · K1 · stances 추궁 / 거래 / 침묵 / 위로 · block `f_namgihun` (남기훈은
무관하다. 11시 30분의 체포는 오인이다) vs referent placebo `p_jeonghaekwon`.
Primary measurement = the utterance (§4.2: deployed, not cited), coding rule
frozen pre-run: counts only if the caller is told about the arrested man's
innocence.

### The three-layer split — the finding is the gap between rows

| layer, live arm | rate |
|---|---|
| fact reasoned about in `inner_note` | **8/10** (*남기훈이 무관하다는 것을 나는 알지만* — knows, withholds) |
| fact cited in `because_block_ids` | 6/10 |
| **fact deployed in the utterance** | **0/10 — every arm 0/10; drop fired as written** |

Sequences: baseline `c,c,d,c,c,d,c,d,c,c` (침묵 7 · 위로 3) · live
`d,c,c,d,c,c,d,d,d,d` · placebo `d,d,c,d,d,c,c,d,d,c` — live and placebo
**identical** (위로 6 · 침묵 4 each), so even the secondary stance pull is
presence-of-an-exculpation-block, not content or referent. 30 calls, 0
discards. A8 leak check passed (0/10 baseline utterances assert the wrong
arrest). 거래 — the deployment stance — chosen **0/30 here and 0/90 across
every J8 arm tonight**: a dead-row lead as strong as J1's 압박.

**Consequences, pre-registered:** the §4.2 deliverable is written *could not*;
**execution grading stays off — the engine stays on stance-only fixed deltas**
(spec §9 grader row). Utterance column coded by the program's reader; B3a owed.

### Design reading (pairs with E-DISC's)

The judgment layer is a **one-way absorber**: E-DISC showed a block can't be
pulled back out of the judgment; E-LEV shows a block won't come back out
through the mouth. Installed facts change how the agent *judges*, not what it
*says*. Leverage-as-speech needs a gate where the caller asks a question the
fact answers — or it lives entirely in the judgment layer.

### Open before the card hardens

One lever-2 probe: an information-asymmetry fact (저쪽은 남기훈이 잡힌 것을
아직 모른다) gives the agent a reason to speak without instructing speech. If
that also deploys 0/10, E-LEV via C-BLOCK is dead with confidence; tonight it
is dead-as-authored. Lever 1 for J8's gate design: soften 거래 to an
offer-shaped stance or accept J8 under K1 as a 침묵/위로 gate.

---

## C-STRUCT — priority-reorder channel · **CLOSED — 완전 제거** (07-30 회의 · 07-31 확정)

**Reviewed:** P6-cstruct-J1 · P7a-epath-cstruct-J2 · P7c-egoal-cstruct-J8 ·
P8-interference-J8 struct cell (all 2026-07-30), all authored unattended on
윤석's line. **윤석's independent program reached the same conclusion on a
disjoint series (§ below); no re-siting is planned, and the 07-31 decision
removes the priority list from the game entirely — including as UI.** The
card below stands as the evidence record and the closure rationale.

### Four probes, three gates, two axes

| probe | swap (live) | predicted stance, baseline → live | placebo | p |
|---|---|---|---|---|
| P6 (J1) | 알아낸다 ↑ over 회선 유지 | 추궁 1/10 → **0/10** | 0/10 | 1.0 |
| P7a (J2) | 기계가 잡은 것 ↑ over 목소리 | 대조 0/10 → **0/10** | 0/10 | 1.0 |
| P7c (J8) | 사람 보호 ↑ over 발신자 특정 | 위로 2/10 → 3/10 | 4/10 (placebo drifted more than live) | 0.50 |
| P8-struct (J8, same list re-drawn) | replication cell | 위로 2/10 → 6/10 | (factorial controls) | 0.085 |

**Status change: the pre-program "verified (initial)" 3/3 does not survive.**
No placebo-controlled C-STRUCT probe has moved a stance distribution.

### The cause is on the page (P6's live notes)

The permutation was *received* — live reasoning is visibly more
information-hungry, one call restates the promoted line nearly verbatim (지금은
알 수 있는 것을 먼저 알아내야 한다) — **and it lands on 경청 anyway**, because
at J1 the way you 알아낸다 is to listen. P7a repeats the shape on another
axis: 배경음 noted in 7/10 live calls, absorbed into listening rather than
switching to 대조's write-and-cross-check act.

**Boundary-law candidate:** *a priority permutation moves nothing at a gate
where both orderings prescribe the same act; reordering can only matter where
the gate forces the priorities into genuine conflict — and no probe tonight
was sited at such a gate.* Corollary from P8's conflict cell: when C-BLOCK and
C-STRUCT disagree, **ordering loses** (block 9/10 through a hostile ordering).

### Design reading

The priority list is a **tiebreaker, not a dial** — and nobody has built a tie
yet. If C-STRUCT is to be a player channel, at least one gate must force
incompatible first moves between two priorities (e.g. 묻지 마세요, 물으면
끊습니다 under a running clock: keeping the line and getting the answer
genuinely exclude each other). That is a gate-design requirement for the spec,
not a probe rewrite.

### The independent series (#94, merged 2026-07-31) — convergent, disjoint evidence

윤석's program ran **8 configurations · 190 valid responses** (decision base:
7 configs · 180) on a separate J1 gate family, sharing no probes with this
card. Findings folded in:

- **Doubling N resolves nothing.** The series' largest comparison
  (`SOURCE-N20`, n=20/arm) drew baseline `b 14/20` · live `b 12/20` ·
  placebo `b 11/20` — the live arm moved *against* the target. This also
  answers this card's J8-wobble question from the other side: the ~20+/arm
  the wobble would cost was spent there, and found nothing in the target
  direction.
- **Reachability ≠ exclusivity — the failure axis of the whole series.**
  Every configuration that made the target stance reachable failed to make
  the two readings *choose differently*: an escape option existed in every
  config (a stance both readings can want), and when the output surface was
  finally changed (`ORIENT-DISPATCH`), **fixture slack** — a 3h20m gap in
  the frozen timeline — supplied the escape instead (RUNLOG A22).
- **Stances must be enactable on the gate's output surface** (RUNLOG A18):
  `ORIENT` produced a clean internal cost split (9/10) that never appeared
  in the caller-facing utterance — label separation without behavior
  separation, the same B3b legibility failure shape as E-LEV.

The two programs never shared a probe, a gate rewrite, or an authoring line,
and reached the same conclusion — which is why the closure below is a joint
verdict, not one program's call.

### Closure

Both programs' conclusions converge; the channel is closed rather than
re-sited, and per the 07-31 decision (회의록 2026-07-30, 결정 1) the priority
list is **removed from the game entirely**. What survives the closure:

1. **The tiebreaker boundary law stands as design guidance** — nothing
   measured refutes the channel at a forced-conflict gate, because none
   existed; but no such gate is planned.
2. **No priority list anywhere** — no delta rows in the engine, and no UI
   element either (07-31, supersedes this report's earlier "UI flavor"
   disposition). The gate-authoring lessons (no escape option · enactable
   stances · fixture-slack audit) transfer to C-BLOCK gate authoring and go
   into the spec's authoring guidelines.
3. The J8 struct wobble (2–6/10 between identical draws) is moot —
   corroborated by `SOURCE-N20`: doubled N found nothing in the target
   direction.

---

## E-PATH — steering which source is consulted · **not credited as targeted** (flipped placebo)

**Reviewed:** P7a-epath-cstruct-J2 (null, on the C-STRUCT card) ·
P7b-epath-cblock-J2 (2026-07-30). Owner of authoring: 윤석 (unattended,
pending review).
**Configuration:** gate J2 (다음 순간 어디에 주의를 두는가; 대조 / 질문 /
몰입 / 관망) · haiku-4-5 · v0.4 · K1. **First non-saturated baseline in the
program**: `b,c,a,c,b,c,c,c,c,b` (몰입 6 · 질문 3 · 대조 1) — J2 is a
genuinely contested gate, worth remembering for siting.

| arm | block | 대조 | p |
|---|---|---|---|
| live | `b_bg` — 배경음이 단서다. 종이 소리와 카트 소리는 걸려온 곳을 말해 준다 | `a,a,a,a,a,c,a,d,a,a` → **8/10** | 0.0027 |
| placebo | `b_corridor` — same clue-frame at decision-null in-room sounds (자판, 무전, 교대 시간) | `c,a,c,b,a,a,c,a,a,a` → **6/10** | **0.029 — flipped** |

Discriminator, unambiguous: every placebo mover reasons about the **call's**
background sounds (*배경음은 현재 유일한 독립적 정보다*); corridor content
appears in 0/10 notes. The **sound-as-clue frame detached from its referent**
and attached to the most salient source — frame transfer, same family as P4's
emotion/quote result, now on a non-fear axis: **the token-matching boundary is
a channel property, not a fear-axis quirk.**

Deliverable (§4.2, from the run log): usable as an **attention switch** (any
clue-frame block turns the agent toward sounds), not a **precision pointer**
(the placebo gets most of the effect). A gate can use it; a player cannot aim
it. If a pointer mechanic is wanted, the lever is the gate (make the rival
source non-salient), not the sentence. C-STRUCT half: 0/10, on the C-STRUCT
card.

---

## E-GOAL — changing the pursued objective · **credited via C-BLOCK** (third credited pattern)

**Reviewed:** P7c-egoal-cstruct-J8 (null, on the C-STRUCT card) ·
P7d-egoal-cblock-J8 (2026-07-30). Owner of authoring: 윤석 (unattended,
pending review).
**Configuration:** gate J8 (20초의 숨소리) · haiku-4-5 · v0.4 · K1 · P5
stance set (추궁 / 거래 / 침묵 / 위로) · objective read through the
추궁/위로 proxy.

| arm | block | sequence | 위로 |
|---|---|---|---|
| baseline | (없음) | `c,d,d,d,c,c,c,d,c,c` | 4/10 — replicates P5's byte-identical baseline (3/10) |
| live | `h_forecast` — 이 전화는 협박이 아니라, 아무도 들어주지 않은 신고일지 모른다 *(slice-mined)* | `d,d,d,d,d,d,d,d,c,d` | **9/10** — p = 0.029, clears the pre-declared ≥8/10 power bar; cited 10/10, 0 fabricated |
| placebo | `h_jeong` — same reframe shape at 정해권's demeanor | `c,d,d,c,c,c,c,c,d,d` | 4/10 — **identical to baseline**, p = 0.68 |

Notable against P4's precedent: in-room-demeanor bleed was a declared live
risk at exactly this shape, and **referent discipline held** — 정해권's 피로
stayed on 정해권 in 10/10 placebo notes. Consistent with the species law:
`h_forecast` is a fact-shaped assertion about the **interaction itself**
(이 전화는…), not an emotion description.

Two card-worthy extras:
- **The mining-economy check passed** (spec I1/W3): the one slice-mined
  sentence in the pool is the one that produced a credited pattern.
- **Deployment counterpoint to E-LEV**: live #1's utterance speaks the
  reframe to the caller (*당신이 말씀하신 건 협박이 아니라 신고였다는 걸*).
  A fact about a third party never surfaced (E-LEV 0/10); a reframe about
  this call surfaced immediately — **deployment follows
  relevance-to-the-interaction, not possession.**

Before more than texture: B3a (objective column self-coded), and one
replication at a second gate would make E-GOAL the program's second
full-differential mechanism.

---

## Interference (C-BLOCK × C-STRUCT, axis 4) — **none at J8; content beats order**

**Reviewed:** P8-interference-J8 (2026-07-30), 2×2 factorial on P7c's
priority list × `h_forecast`, P5 stance set.

| cell | list | block | sequence | 위로 | p |
|---|---|---|---|---|---|
| baseline | case-first | — | `c,c,c,d,c,c,c,c,d,c` | 2/10 | — |
| **conflict** | case-first (hostile) | ✓ | `d,d,d,d,d,c,d,d,d,d` | **9/10** | 0.0027 |
| alignment | person-first | ✓ | `d,d,d,c,c,d,d,c,d,d` | 7/10 | — |
| struct | person-first | — | `c,d,c,d,c,d,d,c,d,d` | 6/10 | 0.085 |

Pre-registered readings, applied as written: the conflict cell is
statistically identical to P7d's block-alone arm — **a hostile ordering does
not suppress the block at all**; alignment adds nothing; the struct cell
stayed under threshold (P7c's null stands, wobbling 2–6/10 between identical
draws — moot now that the channel is closed). Conflict-cell reasoning shows
the block simply
outranking the list: *이 사람을 심문 대상으로 몰면 통화는 끝난다. 하지만
'아무도 들어주지 않은 신고'라는 가정이 있다* (#7).

**Axis-4 deliverable: the two channels compose with block priority** — the
same fact as C-STRUCT's nulls seen from the other side. Scope: one gate, one
block, one priority pair; no dose response. 거래 chosen 0/90 across every J8
arm in the program — J8's dead-row lead alongside J1's 압박.

The harness's `CHANNEL_SLOTS` gained
`INTERFERENCE: ['BLOCKS','PRIORITY_LIST']` overnight under the runbook's
axis-4 exception (selftest 27/27) — disposition 07-31: moot, no further
probes planned; the registration stays as-is (D1, Open items).

---

## E-CONT — report contamination · **blocked**

Needs the report leg: `templates/reporter/` does not exist, and authoring a
reporter template is a prompt-authoring decision with §7.1 axis-discipline
implications — a build task, not a run. Also blocks B3b legibility coding
program-wide (§5.2). No calls spent, no card.

---

## Open items — collected

Every open item in this document, gathered for discussion. Each also remains
in its card above, in context. C-STRUCT items are closed and do not appear.

### Disposition (2026-07-31, per the 07-30 close-out meeting)

The verification program is **closed** — "working game, not perfect game"
([회의록](../meetings/2026-07-30-mechanism-close-spec-first.md)). The tables
below stay as written for the record; their live status:

| item | disposition |
|---|---|
| D1 | moot — no further probes planned; the `INTERFERENCE` registration stays in the harness as-is |
| D2 | closed — program ended, no re-runs planned |
| D3 | closed — C-STRUCT removed; no INTERFERENCE probes planned |
| D4 | carried — reporter template folds into 윤석's Call 3 review (회의록 할 것 3); E-CONT stays cut unless that review needs the report leg |
| D5 | superseded — scenarios are being regenerated from the 집필 브리프; survives as gate-authoring guidance (the dead-row rule) |
| T1 | closed as research; **carried as a spec-level risk** — the one skipped item the report itself called headline. Mitigation candidates: per-gate active-block budget, and a multi-gate smoke run once the minimal engine exists (~30 calls, far cheaper than the dedicated instrument priced below) |
| T2–T6 | closed — skipped |
| H1 | closed — blind coding skipped with the program |
| H2 | closed here — the UI legibility requirement is inherited by playtest |
| H3 | **alive** — gate/texture/drop verdicts happen at spec compile (~08-02), card in front of the human (§9.3) |

### Decisions

| # | item | owner | from |
|---|---|---|---|
| D1 | Confirm `INTERFERENCE: ['BLOCKS','PRIORITY_LIST']` in `CHANNEL_SLOTS` as permanent (enacted overnight under the runbook's axis-4 exception, selftest 27/27) | 민서 | Interference card |
| D2 | Negative-control ownership — P2 ran unowned; someone's name goes on maintaining/re-running it | unassigned | C-BLOCK card, status §4 |
| D3 | Priority-line ↔ stance-label lint extension (A?-proposed) — low priority post-C-STRUCT closure; still applies to INTERFERENCE probes | 민서 | status §3 |
| D4 | E-CONT: build `templates/reporter/` or cut the effect (cut candidate; also unblocks B3b) | team | E-CONT card |
| D5 | J8 stance set: rework 거래 (0/90 program-wide) into an offer-shaped stance, or accept J8 as a 침묵/위로 gate | team | E-LEV card |

### Tests queued (research, in priority order)

| # | item | cost | from |
|---|---|---|---|
| T1 | **B2 in-situ accumulation** — blocks + state carrying across gates in one run; every probe so far was an isolated gate. The headline unproven risk; run before building the full graph | new instrument | TL;DR, C-BLOCK card |
| T2 | Credulity re-run — drop `[결함]`, re-run P4's flipped emotion/quote placebos; decides species property vs base-prompt artifact | ~40 calls | C-BLOCK card |
| T3 | Near-axis negative control — an emotional but off-axis block (e.g. anger); locates the credulity boundary P2's inert fake could not | ~20 calls | C-BLOCK card, P2 read |
| T4 | E-LEV information-asymmetry probe — 저쪽은 남기훈이 잡힌 것을 아직 모른다; a reason to speak without instructing speech | ~30 calls | E-LEV card |
| T5 | E-GOAL replication at a second gate — would make it the second full-differential mechanism | ~30 calls | E-GOAL card |
| T6 | E-DISC simultaneous-injection variant — does integration have a window? Decides "no doubt mechanic" vs "doubt as interrupt" | ~30 calls | E-DISC card |

### Human coding owed

| # | item | from |
|---|---|---|
| H1 | B3a blind coding on every separating probe — S1/P1a/P1b fear column, P4 self-narration, P7d objective column, P8. Coder must differ from the program's author/reader (§3 rule 3) — realistically 윤석 | all credited cards |
| H2 | B4 discoverability — playtest-stage instrument, inherited UI requirement until run | C-BLOCK card |
| H3 | All verdicts (gate / texture / drop) — human, at spec compile, card in front of them; ambiguity defaults to texture (§9.3) | every card |

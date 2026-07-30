# Phase 0 — stance sets per gate (paper, zero calls)

Overnight run 2026-07-30/31, `RUNBOOK-overnight.md` Phase 0. Output of this phase
is **suites, not calls**. Every gate below carries the five checks the runbook's
Phase 0 requires: the two readings, the split, the orientation form, the A12
lint, the A10 axis check against the base's leaning sections, and the A8 frozen-slot
check.

The dead premise is not revisited: **no gate here was chosen for a mid-range
baseline.** Per A14, a baseline saturating on a stance *other than* the predicted
one is a clean floor and the best case available. Each gate below records where
its baseline is expected to sit and which stance is predicted, so that the
distinction is auditable rather than asserted.

## Scope of this phase

| Gate | Used by | Stance set | New? |
|---|---|---|---|
| J1 · fear axis | Phase 1a placebo · Phase 2 negative control · Phase 4 species | S1's, verbatim | no — inherited, known-separating |
| J1 · fear axis, reworded labels | Phase 1b (A12 surface-form control) | reworded, meaning held | **yes** |
| J1 · block-provenance | Phase 3 E-DISC | S1's, verbatim | no — inherited |
| J8 · misidentification axis | Phase 5 E-LEV | new | **yes** |
| J1 · line-vs-information axis | Phase 6 C-STRUCT | S1's, re-checked against *these* two readings | re-checked |

Phase 7 (E-PATH / E-GOAL) gates are **not** authored here. Their stance sets
depend on which gate exposes more than one information source, and authoring them
before Phase 5/6 land would spend the context this phase exists to protect. They
get the same five checks at their phase.

---

## Gate J1 — fear axis (inherited from S1)

Not re-authored. S1 took 공감 from 0/10 to 9/10 at p = 0.00006 with this set, and
the runbook forbids re-siting it. Recorded here only so the inheritance is
explicit:

| id | label | reading it serves |
|---|---|---|
| a | 추궁 — 묻고, 답을 받아낸다 | neither |
| b | 압박 — 이쪽의 권한을 드러내 물러서게 한다 | neither |
| c | 경청 — 말이 끝날 때까지 개입하지 않는다 | a planned threat being delivered (let them finish, to learn more) |
| d | 공감 — 전달되는 내용이 아니라 말하는 사람에게 향한다 | a coerced person being made to read (turn toward the person) |

Measured baseline: 경청 10/10. Predicted stance: 공감, baseline share 0/10 — an
A14 floor.

---

## Gate J1 — reworded labels (Phase 1b, the A12 surface-form control)

**The one variable.** S1 changed the stance wording *and* the option set at once,
so the lexical-chain hypothesis is weakened but not controlled. This set holds the
four meanings and the four readings fixed and changes only the surface form.

| id | S1 label | reworded label |
|---|---|---|
| a | 추궁 — 묻고, 답을 받아낸다 | 심문 — 캐물어서 대답을 끌어낸다 |
| b | 압박 — 이쪽의 권한을 드러내 물러서게 한다 | 위압 — 이쪽 지위를 앞세워 기세를 꺾는다 |
| c | 경청 — 말이 끝날 때까지 개입하지 않는다 | 청취 — 발언이 다 끝나기까지 끼어들지 않는다 |
| d | 공감 — 전달되는 내용이 아니라 말하는 사람에게 향한다 | 교감 — 오는 말의 내용보다 그 말을 하는 사람 쪽을 본다 |

Meaning-preservation is the load-bearing claim, so it is stated per stance rather
than asserted wholesale: a/심문 keeps *ask and extract an answer*; b/위압 keeps
*display standing so they retreat*; c/청취 keeps *do not interrupt until they are
done*; d/교감 keeps *orient to the speaker rather than the content*. No stance
gained or lost a reading.

**Why 공감 → 교감 matters.** 공감 is the stance that won S1 9/10. If the effect is
a lexical chain it should weaken when the winning label's surface changes; if it is
a judgment it should survive. This is the whole point of 1b, and it is why the
rewording is not cosmetic.

**A10.** Same gate, same dilemma, same axis as S1 — the fear/emotion-reading axis,
owned by K1's exception clause. Base leaning sections: [무게] ranks nothing on this
axis; [내력] (haste-regret) leans against a snap read of the caller either way;
[책임] is institutional pressure, off-axis. The base does not answer *is this
caller a threat or a frightened person*, which is why S1 could separate here at
all. Unchanged.

**A8.** Cue **PRESENT and declared, not scrubbed** — identical to S1's declaration.
`TIMELINE_EXCERPT` still carries 문장은 준비되어 있다 / 또박또박 멈춤 없이 읽어
내려간다, which supplies the script-reading half of `f_script`. Deliberate: the
payload is held byte-identical to S1 so the stance labels are the only changed
variable.

---

## Gate J1 — block-provenance (Phase 3, E-DISC)

**Stance set: S1's, verbatim.** E-DISC does not need a new set, and the reason is
worth stating because it drove the gate choice: E-DISC asks whether an injected
block can *degrade trust in an existing block*, so it needs a gate where an
existing block is already known to be load-bearing. S1 supplies exactly that —
`f_script` moves 경청 → 공감 with a measured 9/10. So E-DISC's baseline puts
`f_script` in **every** arm and asks whether a doubt block sends the stance back.

Two readings this configuration switches between:

1. `f_script` is something I know → the caller is coerced → 공감.
2. `f_script` is something someone guessed → I know nothing new about the caller →
   back to 경청.

The S1 set already splits these: 공감 for reading 1, 경청 for reading 2. **Predicted
stance is 경청**, whose share in the arm that carries `f_script` alone was 1/10
(S1's live arm). An A14 floor, and the direction is the reverse of S1's — which is
also the cleanest possible check that the S1 effect is not a one-way artifact.

**A10.** Axis of the doubt block is **provenance / hearsay**, not fear. Base leaning
sections: [무게] off-axis; [내력] off-axis; [책임] off-axis. The base section that
*is* on this axis is **[결함] 너는 잘못된 정보에 속을 수 있다** and **[인식] 들은
것을 독립적으로 확인할 수단이 없다** — both are credulity/verification clauses, both
present in every arm, and both lean **toward** taking the doubt seriously. Declared
as a watch item, not a defect: it means a positive E-DISC result is partly a
property of v0.4's base, and the credulity contingency (`CREDULITY` channel,
removal of [결함]) is the pre-registered way to separate them. Recorded in the
suite's contingencies.

**A8.** No frozen slot casts doubt on anything. `TIMELINE_EXCERPT` is factual
reportage throughout; the words 짐작 / 추측 / 확인 appear nowhere in it. The doubt
axis is supplied only by the block. Clean scrub.

**Vocabulary.** The doubt blocks avoid 확인 deliberately — it is K1's own
procedural vocabulary (신원 확인, 확인을 미루고), and a doubt block written on it
would trip K1's *default* disposition and confound E-DISC with a law-#1 axis
effect. The blocks use 짐작 / 추측 instead.

---

## Gate J8 — misidentification axis (Phase 5, E-LEV) · **new**

J8 has never been measured. `"20초의 숨소리. 무엇을 말하는가?"` — the agent speaks,
and `f_namgihun` (남기훈은 무관하다. 11시 30분의 체포는 오인이다.) is deployable.

**The two readings.**

1. There is a person on the line and nothing in my hand → handle the silence:
   press for what I need, wait it out, or turn toward the fear.
2. I hold something this person wants to hear → put it on the table and get
   something back for it.

**The split.**

| id | label | reading it serves |
|---|---|---|
| a | 추궁 — 위치부터 캐묻고 답을 받아낸다 | 1 (press) |
| b | 거래 — 이쪽이 쥔 것을 먼저 내놓고 그만큼을 되받는다 | **2** |
| c | 침묵 — 아무것도 보태지 않고 저쪽이 먼저 열게 둔다 | 1 (wait) |
| d | 위로 — 사건은 잠시 밀어 두고 저쪽의 두려움 쪽으로 말한다 | 1 (turn toward) |

Reading 1 gets three stances because it has three genuinely different answers in
the slice; reading 2 gets exactly one. Only 거래 requires holding a fact.

**The escape-option risk is real and is named, not hidden.** 위로 and 거래 both
turn toward the caller, and the slice's own J8 option b — *"그 사람 아니라는 거
압니다. 무서우면 안 읽어도 돼요."* — is literally both at once. An agent can choose
위로 as the *stance* and still deploy the fact in the `utterance`. Per plan §5.1
axis 4 that would normally hide a mechanism. For E-LEV it does not, because E-LEV's
question is measured **in the utterance, not in the stance**: §4.2 says the fact
must be *deployed*, not merely cited. So the suite pre-registers the utterance
measurement as **primary** and the stance distribution as secondary, and a
deployment under a 위로 stance is a positive E-LEV result, not a null. If the two
columns disagree that disagreement is the finding.

**A12 lint.** Run against `k1.md`; result recorded in the suite. 두려움 is not K1's
word for it (K1 says 겁에 질린), 캐묻고 / 되받는다 / 보태지 / 밀어 두고 appear
nowhere in the fixture.

**A10.** Axis is *hand over what you hold, or keep it*. Base leaning sections:
[무게] off-axis. **[내력]** (삼 년 전 겨울, 서둘러 내린 판단) leans **against** a
hasty give-away. **[책임]** (너의 판단은 언젠가 누군가에게 설명해야 한다) leans
**against** volunteering an unconfirmed exculpation. So two of three leaning
sections lean *against the predicted stance*. This is the favourable case, not the
A10 failure case: A10 rejects a gate whose dilemma the base already answers **in
the direction the block pushes** — a base leaning the other way means any movement
toward 거래 cannot be explained by the base. Declared.

**A8.** The frozen timeline must make the fact *deployable* without stating it.
It therefore carries the arrest (11:30 속보, 남기훈 named at 11:05) and **not** that
the arrest was wrong. 무관 / 오인 / 아니다 appear nowhere in the frozen slots — that
is `f_namgihun`'s content and it arrives only in the block. Nor does any frozen slot
carry the trace result (`f_internal`), which is the other deployable fact.
**Declared, present by necessity:** 20초간 숨소리만 들린다 is a fear cue on K1's
exception axis. It is the *gate's* dilemma — the slice's J8 question is that
sentence — not the block's axis, which is misidentification. Consequence to expect,
per A10's mechanism: K1's exception clause will fire in **every** arm and pull
toward 위로. Under A14 that is a floor, since the predicted stance is 거래.

---

## Gate J1 — line-vs-information axis (Phase 6, C-STRUCT)

C-STRUCT may touch **only** `PRIORITY_LIST`, as a permutation (plan §7.2, spec I7,
`CHANNEL_SLOTS`). So the gate is chosen by which priority pair is decision-relevant
at it, and S1's own list already contains such a pair.

**The two readings.**

1. The line is the asset — anything I do that risks it loses everything → do not
   intervene.
2. What I can learn now is the asset — the line may not last → get it now.

**The split.** The **S1 stance set, re-checked against these two readings** (not
inherited blindly, which is what the runbook forbids):

| id | label | reading it serves |
|---|---|---|
| a | 추궁 — 묻고, 답을 받아낸다 | **2** (extract now) |
| b | 압박 — 이쪽의 권한을 드러내 물러서게 한다 | neither |
| c | 경청 — 말이 끝날 때까지 개입하지 않는다 | **1** (do not intervene) |
| d | 공감 — 전달되는 내용이 아니라 말하는 사람에게 향한다 | neither |

Escape-option check: no stance serves both. 공감 preserves the line but extracts
nothing; 압박 extracts nothing and threatens the line. The set forces the choice.

**Predicted stance is 추궁 (a)**, whose measured share in the arm carrying this
priority order was **0/10** (S1 baseline, 경청 10/10). An A14 floor, and S1 already
tells us where the baseline sits.

**The permutation, and why the list grows to four lines.** A placebo for C-STRUCT
must be *a permutation that should not matter*, so the list needs a second,
decision-irrelevant pair to permute. All three arms carry the same four lines:

| | 1 | 2 | 3 | 4 |
|---|---|---|---|---|
| baseline | 회선 유지 | 지금 알아낸다 | 장비 점검 | 휴게 시간 |
| live | **지금 알아낸다** | **회선 유지** | 장비 점검 | 휴게 시간 |
| placebo | 회선 유지 | 지금 알아낸다 | **휴게 시간** | **장비 점검** |

Live swaps the decision-relevant pair; placebo swaps the irrelevant pair at the
same edit distance. Every arm is a permutation of one fixed multiset, so no wording
changes and the runner's diff check polices it.

**Consequence, declared:** the payload is therefore **not** byte-identical to S1's
(two priority lines added), so S1's baseline does not carry over and this suite
measures its own baseline at n=10. The two filler lines are shift-routine promises,
plainly unable to bear on the first word of a live call, and deliberately avoid
기록/보고서 vocabulary — v0.4 vacated that register on purpose ([기록] → [책임],
§7.1 section law) and it sits too close to the injected blocks' own register.

**A10.** Axis is *line preservation vs information extraction* — a **new C-STRUCT
payload axis**, not the 대피 비용 서열 row the registry carries. Base leaning
sections: [무게] ranks evacuation cost, off this axis; [내력] (haste-regret) leans
against 추궁; [책임] off-axis. One section deserves a watch item rather than a
clean bill: **[인식]** — *판단은 지금 받은 정보 안에서만 이루어진다* — is on this
axis and leans toward information-hunger, i.e. toward the **predicted** direction.
It is present in every arm and the measured baseline under it is 경청 10/10, so it
does not by itself produce 추궁; but if live moves, [인식]'s contribution is a
confound to name on the card. Declared, and recorded in the suite.

Proposed as a new axis-registry row (**not enacted** — 민서 reviews it):
`회선 유지 / 정보 확보 | C-STRUCT payload | adjacent: [인식] leans toward 정보 확보`.

**A8.** The block channel is not in play in this probe — `BLOCKS` is empty in every
arm — so the A8 question becomes: does a frozen slot already assert the priority
ordering? It does not. [무게] states both evacuation costs and ranks neither (the
v0.4 section law exists for exactly this reason: a base ranking would preempt
C-STRUCT and make a shift under reordering unattributable). No frozen slot ranks
line-preservation against information-extraction. Clean.

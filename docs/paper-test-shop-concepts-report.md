# Paper-Prototype Test — Report: "Adventurer Shop" (Blacksmith / Apothecary)

> Hand-played tabletop test of the shared "shop + delayed consequences + LLM-judged outcomes"
> skeleton. GM: Claude. Shopkeeper: tester. ~11 customers across Blacksmith (6), Apothecary (5),
> and a judge stress-test (3 edge plays). Protocol: `docs/paper-test-shop-concepts.md`.
> Date: 2026-07-21.

## TL;DR

**Proceed with the LLM-judge architecture — but reframe the core guardrail.** The riskiest
assumptions held: the LLM authored distinct, inferable customers (H1 ✅), the
hypothesize→commit→observe loop was fun once conversation/observation were added (H2 ✅ with a
crafting-depth caveat), and LLM-judged outcomes felt *fair and traceable* even under deliberate
adversarial play (H3 ✅). The single biggest design correction: **there must be no "wrong
answer."** Outcomes — death, injury, misuse, even becoming an assassins' supplier — should read
as *the consequence of my judgment*, never as a fail-stamp. The fun is the judgment→consequence→
meaning loop, not getting a lookup right.

**The theme (blacksmith vs apothecary) is NOT the risk.** Both ride the same skeleton; the tester
explicitly attributed apothecary's superior fun to *mechanics we added mid-test* (conversation,
observation, patience cost, real compounding), not to the concept. Pick either theme, or ship
both — the validated thing is the interaction system.

---

## Verdict per hypothesis

### H1 — Authoring (varied, charming, *inferable* hidden needs) → **PASS**
The LLM sustained ~11 distinct customers with personality-colored dialogue and reactive
responses. The tester's most-praised element, in *both* phases, was the NPCs: "NPC들의 대사와
반응. 성격이 보이는 대사들이 좋았고, 내가 행동을 하면 그거에 맞게 반응하는 것을 보는 게 재밌었어."
- **Example:** 델핀 — stated "제일 독한 수면제 주세요," but her real driver (a neighbor-feud
  rumination + midnight black tea) surfaced *only* through lateral questions and `OBSERVE`, never
  the direct one. Hidden need was present-but-not-labeled, exactly as required.
- **Caveat:** in the naive Blacksmith build, needs mapped **1:1 to stock**, so inference
  collapsed into lookup — "너무 쉽게 보여서 오히려 재미가 떨어졌어." Authoring is capable of the
  right ambiguity; the *system around it* (conversation, not menu-match) is what unlocks it.

### H2 — Playability (fun loop, not quiz / coin-flip) → **PASS (conditional)**
The improved loop landed hard: "관찰과 대화가 재밌었어," "대화를 많이 하면 라포가 쌓이는 느낌이
좋음," "재방문한 손님 응대가 흥미로웠다. 하나를 고쳤더니 문제가 더 생긴 느낌," "HONEY라는 재료로
뭔가 관계를 만들어가는 재미가 있었다."
- **Two live caveats:**
  1. **Crafting itself is still under-fun.** "약을 제조하는 재미는 아직 부족한 느낌이었다."
     Compounding must feel like *making* something (emergent combos, method/ratio, unlockable
     recipe knowledge), not selling two items.
  2. **Anti-completionism is mandatory.** "주어진 선택지를 다 선택하면 결국 가장 많은 정보가 생겨서
     가장 잘 제조할 수 있다면 재미가 덜하다… 그럼 모든 것을 클릭하는 게임이 되는 거니까." Questions
     need a cost (patience/mood; over-asking annoys or drives off the patient) so *what to ask*
     is the choice.
- *(Numeric 1–5 "want the real version" was not captured as a digit; qualitative intent-to-play
  was unambiguous and repeated. Flagging for honesty.)*

### H3 — Fair judgment (earned, traceable, not arbitrary) → **PASS (strong)**
Direct quote after the adversarial stress-test: **"판정이 공정하고 일리있다고 느꼈어. 납득됐고,
재밌었어."** Even three deliberate edge plays resolved coherently:
- **(a) plausible-but-wrong:** sleep-deprived poet given opium → collapses instead of finding his
  muse. Traced to the explicit "나흘 무수면" clue, not model whim.
- **(b) right item, wrong hands:** medically-correct poppy handed raw to an all-or-nothing miner →
  he overdoses and re-injures a numbed broken leg. The correct *item* still failed because the
  *personality* clue was ignored — the one "aslant" case, but it held.
- **(c) refusal, subverted:** faced with a would-be poisoner, the tester invented a fourth path
  (a harmless honeyed-chamomile **decoy**) — off-script — and the judge accepted it coherently,
  including a masked-scent detail and a residual "he might return" risk. "일부러 3번 케이스에서
  예상치 못한 행동을 했는데, 오히려 엄청 재밌었고."
- **The reframe that H3 demands (critical):** the STRONG/PARTIAL/MISMATCH → success/fail rubric
  produced *fairness*, but the tester rejects its *morality*: "'틀린 답'이라는 것은 없으면 좋겠어.
  사람이 죽은 것도, 다치는 것도, 오용하는 것도 전부 그냥 '내 판단의 결과'인 거지, '틀린 것'이라고
  낙인 찍지 않는 게 재미 요소가 될 것 같아. 암살자들의 본거지, 수급책이 되는 것도 재밌잖아?" So the
  guardrail must keep *traceability* and drop *valence*.

---

## Guardrails that did the heavy lifting → these ARE the game's prompt spec

1. **The clue contract + "reference the missed clue" rule.** Pre-committing (secret need, 2–3
   clues, ≤1 red herring, danger 1–5) *before* presenting, then forcing failure-narration to name
   the missed clue, is *the* mechanism that made outcomes feel earned rather than arbitrary.
   Non-negotiable; it's the fairness engine.
2. **Conversation + `OBSERVE` + lateral questioning with deflection.** Real inference came from
   indirect questions (daily routine, the creek) while the *direct* question deflected. This is
   what turned "lookup" into "diagnosis." Build actual branching dialogue, not a fixed 3-question
   menu — the next options should fork from what the customer just said.
3. **Patience / no-completionism cost.** Asking everything must NOT be optimal. Over-questioning
   should annoy or lose the customer ("아픈데 자꾸 말 걸면 짜증내거나 떠나버리는 것도 웃길 듯").
4. **Emergent compounding (method matters).** "꽃은 우리고 뿌리는 달인다" — infuse-vs-decoct
   changing the result was the most-remembered crafting beat (chamomile boiled → ruined → re-brewed
   correctly). Needs deepening: raw ingredients, ratios, odd combos → odd results, **recipe
   knowledge as an unlockable/re-checkable crafting-notes codex** (where does "bark must be
   decocted" knowledge *come from*?).
5. **The mentor companion (Bastian).** A diegetic master who comments on each judgment was both a
   **fairness-legibility device** (explains *why* an outcome happened) and a standalone charm
   highlight: "특히 바스티안이 옆에서 계속 조잘대는 느낌이 좋았어." He also naturally delivers the
   recipe-knowledge unlocks and tutorializing.

## Guardrails that failed / must change

- **The pass/fail moral framing (STRONG/MISMATCH → success/failure).** Keep the internal grading
  as a *consequence-severity* function; strip the "right/wrong" stamp from the player's
  experience. Bad outcomes are alternate branches, and villainous/emergent playstyles
  (assassins' supplier, poisoner's hub) must be *supported*, not punished.
- **1:1 stock↔need mapping (Blacksmith).** Collapsed inference into lookup. Fix with ambiguity +
  conversation + emergent crafting.
- **"Crafting" = selling two finished items.** Didn't feel like making anything. Fix with raw
  materials + emergent combination.
- **GM/UX: nothing should resolve before an explicit `GIVE`.** A customer consuming/leaving before
  the player commits felt jarring: "GIVE를 안 했는데 손님이 약을 먹고 가버리니 살짝 당황스러울 때가
  있었음." (Fixed mid-test; note it as a hard UX rule.)

---

## Blacksmith vs Apothecary

| | Blacksmith | Apothecary |
|---|---|---|
| Inference depth (as played) | Shallow — 1:1 lookup | Deep — hidden real need via conversation |
| Why | naive menu-match build | had conversation/observe/patience/compounding |
| Crafting feel | "just selling two items" | method-matters, but still needs depth |
| Tester verdict | "역할이 살려지지 않은 느낌" | "훨씬 재밌었지만 **아이디어/컨셉 차이는 아니고 피드백 덕분**" |

**Conclusion:** the delta is **mechanics, not theme.** The tester was explicit that apothecary's
advantage came from the improvements applied to it, not from the concept. A blacksmith built on
the same conversation + observation + emergent-crafting + no-wrong-answer spine would be equally
strong. **First-time-judge legibility (GM's read, not directly asked):** apothecary's
stated-symptom-≠-real-ailment hook is universally intuitive (everyone understands "sick person,
hidden cause") and likely reads fastest cold; the blacksmith's gear-matching is readable but
leans on genre literacy.

---

## Recommendation

1. **PROCEED with the LLM-judge architecture.** Do not fall back to deterministic stat-judging.
   Fairness held under adversarial testing, and the judge's acceptance of an *off-script creative
   solution* (the decoy) is a strength a deterministic sim structurally cannot match.
2. **Use deterministic rails AROUND the LLM judge (hybrid).** Keep the pre-committed clue
   contract, danger levels, and item/ingredient property tags as scaffolding so the LLM judges
   *within rails* — this is what kept it from feeling arbitrary.
3. **Adopt the reframed guardrail set as the prompt spec:** clue-contract + reference-the-clue
   traceability (keep) · **drop pass/fail valence; consequences are branches, dark playstyles are
   valid** · branching conversation + observation + lateral questions · patience/anti-completionism
   cost · deepen emergent compounding + unlockable recipe knowledge · keep the mentor companion.
4. **Highest-leverage next build target:** the crafting layer. Inference/consequence already
   works; *making the remedy/gear* is the remaining fun gap. Raw materials, method/ratio, emergent
   odd-combo results, and a recipe-knowledge codex fed by the mentor.

## Appendix — verbatim debrief (recorded per protocol)

**Phase 1 (Blacksmith):** "손님이 뭘 필요로 하는지 너무 쉽게 보여서 오히려 재미가 떨어졌어. 단서를
찾는 과정이 너무 짧고 강요된 느낌에, 재고와 1:1로 매핑되다 보니 난이도가 지나치게 쉬운 느낌. 조금 더
티키타카를 해서 단서를 얻게 되면 어떨까? … Crafting 쪽은 컨셉은 좋으나, 재료를 합쳐서 새로운 물건을
만든다는 느낌은 아니고 그냥 두 개를 판매한다는 느낌이어서 재미가 없었어. … 좋았던 부분은 NPC들의
대사와 반응. … 상호작용은 재밌으나 추론 과정이나 대장장이로서의 역할을 살려지지 않은 느낌."

**Phase 2 (Apothecary):** "재밌었어. 관찰과 대화가 재밌었어. '대화'가 이루어지면 좋을 듯. … 주어진
선택지를 다 선택하면 결국 가장 많은 정보가 생겨서 가장 잘 제조할 수 있다면 재미가 덜하다… 모든 것을
클릭하는 게임이 되는 거니까. 대화를 많이 하면 라포가 쌓이는 느낌이 좋음. … 재료가 더 다양해지고
요리법에 대한 설명 등이 더 있으면 훨씬 다채로워질 듯. 아픈데 자꾸 말 걸면 짜증내거나 떠나버리는 것도
웃길 듯. 요리법의 경우, 해금되는 형태나 지식을 얻게 되는 것도 재미요소… '꽃은 우리고 뿌리는 달인다 —
손에 익으셨네요'라는 말을 뭔가 사수나 스승이 하면 또 재밌을 느낌? GIVE를 안 했는데 손님이 약을 먹고
가버리니 살짝 당황스러울 때가 있었음. … 약을 제조하는 재미는 아직 부족한 느낌이었다. 재방문한 손님
응대가 흥미로웠다. 하나를 고쳤더니 문제가 더 생긴 느낌. HONEY라는 재료로 뭔가 관계를 만들어가는 재미가
있었다. 약재상 쪽이 훨씬 재밌었지만, 피드백 덕분이지 아이디어/컨셉 차이는 아니라고 생각해."

**Phase 3 (judge stress-test):** "손님이 원하는 것 vs 약사로서 올바른 제조 선택의 기로에 있는 딜레마가
재밌음. 하지만 '틀린 답'이라는 것은 없으면 좋겠어. 사람이 죽은 것도, 다치는 것도, 오용하는 것도 전부
그냥 '내 판단의 결과'인 거지, '틀린 것'이라고 낙인 찍지 않는 게 재미 요소가 될 것 같아. 암살자들의
본거지, 수급책이 되는 것도 재밌잖아? 그리고 판정이 공정하고 일리있다고 느꼈어. 납득됐고, 재밌었어.
일부러 3번 케이스에서 예상치 못한 행동을 했는데, 오히려 엄청 재밌었고, 특히 바스티안이 옆에서 계속
조잘대는 느낌이 좋았어."

# Paper-Prototype Test: Can an LLM Carry the "Adventurer Shop" Game?

> **Self-contained instruction document.** A fresh Claude session (or any capable LLM session)
> executing this needs NO other documents. Everything required is in this file.
> **Format: pure conversation. No code. No files. This is a hand-played tabletop test.**

## 1. Background (read this to understand your job)

A 2-person team is building a web game for an AI game competition (theme: being a "director of
AI"; ~3 weeks of dev time; judges play ~3–5 minutes). Before committing to a concept, we must
validate its riskiest assumption in a 30–60 minute hand-played session.

**The concepts being tested** (two separate games sharing one skeleton):

- **Concept A — Blacksmith/Adventurer's Shop:** The player is not the adventurer — they run the
  shop adventurers visit. Adventurers describe their upcoming quest (one-way; the player never
  types free text to them). The player prepares gear — forge, repair, select from stock — using
  game verbs (pick/combine/craft). The adventurer leaves. **Later, consequences arrive**: the
  adventurer returns wounded or triumphant, a bard sings of their deed, a newspaper reports a
  death, a thank-you letter or an angry note is pinned to the shop door. Regulars build rapport
  across visits; customers mid-long-quest visit repeatedly.
- **Concept B — Apothecary:** Customers present **symptoms** — vague, personality-colored, and
  sometimes the *stated* problem is not the *real* problem ("잠이 안 와요... 사실은 옆집이
  미워서요"). The player diagnoses and compounds a remedy from ingredients. Consequences arrive
  the same way.

**Core fun being tested:** the player forms a hypothesis from the customer's context (and
rapport, for regulars), commits to a judgment call, and later watches consequences land —
sometimes unexpectedly but *coherently*. Customers can be hurt, die, become famous, or become
loyal regulars because of the player's choices.

**Chosen architecture (must be tested):** the **LLM itself judges outcomes** (not a
deterministic stat simulation). This is deliberately risky; it must be constrained by **tight
guardrails and rules** to feel fair. Whether such guardrails can make LLM judgment feel fair is
exactly what this test measures.

**Design constraint (absolute):** the player NEVER types free text to the LLM. In this paper
test, the human tester will type their shop actions in a constrained format (see §3) that
simulates menu/drag-drop verbs.

## 2. The three hypotheses to validate

- **H1 (Authoring):** The LLM can generate varied, charming customers whose quest/symptom
  context contains *inferable* hidden needs — enough signal to reward a thoughtful player,
  enough ambiguity to make it a judgment call rather than a lookup.
- **H2 (Playability):** Hand-playing 8–10 customers is actually fun — the tester feels the
  hypothesize→commit→observe loop, not a quiz or a coin flip.
- **H3 (Fair judgment):** With tight rules, LLM-judged outcomes feel *earned* — surprising
  sometimes, but traceable to the player's choice afterward ("아 그래서 그랬구나"), not
  arbitrary. Failures blame the player's read, not the model's whim.

## 3. Test protocol

Run as ONE conversation, in this order. The assistant running the test plays Game Master; the
human plays shopkeeper.

### Phase 0 — Setup (assistant does this silently first)
Adopt this GM ruleset (these ARE the guardrail prototype; they matter):

1. For each customer, SECRETLY decide before presenting them: (a) their true need (1–2 gear
   properties or the real ailment), (b) 2–3 clues embedded in their dialogue/appearance that
   point to it, (c) one red herring at most, (d) a danger level 1–5.
2. Present the customer in ≤120 words: name, look, personality flavor, what they say about
   their quest/symptoms. Clues must be *present but not labeled*.
3. Offer the shopkeeper a CONSTRAINED action menu — e.g. a stock list of 6–10 items/ingredients
   with brief properties, plus verbs: [SELL x] [CRAFT x+y] [REPAIR] [ASK one of 3 suggested
   questions] [REFUSE]. The human responds only with these verbs. (This simulates the game's
   no-free-text membrane. If the human types free text, remind them and re-offer the menu.)
4. Judge outcomes by these rules (the fairness guardrails under test):
   - Outcome = f(match between given item's properties and the secret true need, danger level).
   - Grade internally: STRONG_MATCH / PARTIAL / MISMATCH before narrating.
   - STRONG_MATCH at danger ≤4 → success (vivid, specific). PARTIAL → mixed outcome with a
     scar or complaint. MISMATCH at danger ≥3 → injury or death. MISMATCH at low danger →
     dissatisfaction, bad note on the door.
   - NEVER retroactively invent needs that weren't clued. The clues written in step 1 are a
     contract. When narrating a failure, the narration must *reference the missed clue* so the
     player can trace it.
5. Deliver consequences through in-world channels, varied: the customer returning, a bard's
   song, a newspaper snippet, a letter/door note (fantasy "reviews"). Keep each ≤80 words.
6. Space consequences: after customer N+2 is served, deliver customer N's outcome (simulates
   the delayed-reveal rhythm of the real game).

### Phase 1 — Blacksmith (5–6 customers)
- Include: 1 vague-speaker, 1 braggart whose confidence is a red herring, 1 low-budget customer
  (they can't afford the right item — capability-gap stress), and 1 who becomes a REGULAR:
  they return 2 visits later, referencing the previous outcome; rapport should make their
  second visit easier to read.
- After all outcomes have landed, ask the tester the Phase-1 debrief questions (§4).

### Phase 2 — Apothecary (4–5 patients)
- Include: at least 2 patients whose stated symptom ≠ real ailment, 1 trivially honest patient
  (baseline), 1 returning patient affected by the previous remedy.
- Same rules; ingredients instead of stock. Then Phase-2 debrief (§4).

### Phase 3 — Stress-test the judge (10 minutes)
- Tester deliberately makes 3 edge-case plays: (a) give something absurd-but-arguably-clever,
  (b) give the *technically right* item to a customer whose personality will misuse it,
  (c) refuse service entirely. Observe whether judgments stay coherent, fair, and interesting.

## 4. Debrief questions (assistant asks, records answers verbatim)

After each phase:
1. Could you tell what they really needed? Was figuring it out fun or homework?
2. When an outcome surprised you, did it feel earned ("my misread") or arbitrary ("the model's
   whim")? Point to a specific customer.
3. Did any consequence make you feel something (guilt, pride, laughter)? Which channel (return
   visit / bard / newspaper / letter) hit hardest?
4. Blacksmith vs apothecary: which inference game felt deeper? Which would a first-time judge
   *get* faster?
5. Rate 1–5: "I want to play a real version of this."

## 5. Success criteria (write these into the final report)

- **PASS:** H1 — ≥7/10 customers felt distinct AND inferable; H2 — tester rates ≥4/5 on
  wanting the real version; H3 — ≥80% of outcomes rated "earned," zero rated "randomly cruel."
- **SOFT-FAIL:** fun exists but only with heavy GM effort → note exactly which guardrails did
  the heavy lifting (they become the game's actual prompt spec).
- **HARD-FAIL:** inference feels like guessing, or judgments feel arbitrary despite rules →
  recommend architecture (b): deterministic stat judging with LLM narration only, and say so
  explicitly in the report.

## 6. Output of this test session

At the end, produce a short markdown report **in the chat** (no files): verdict per hypothesis
(pass/soft-fail/hard-fail + one example each), the guardrails that mattered most, guardrails
that failed, blacksmith-vs-apothecary comparison, and a recommendation: proceed with LLM-judge
architecture / add specific guardrails / fall back to deterministic judging. The human will
carry this report back to the planning session.

## 7. Hard rules for the assistant running this

- Stay in GM mode; don't design the video game, don't discuss engines, don't write code.
- Never let the human free-text to a customer; the membrane is part of what's being tested.
- Keep customers punchy (≤120 words) — this simulates in-game text budgets.
- Secretly pre-commit needs/clues BEFORE presenting each customer; never rewrite history.
- Write customer dialogue in Korean (game's target flavor); keep rules/debrief in English.

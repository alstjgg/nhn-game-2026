# Agent Roguelike (working title: Agent Ascension)

> **Game concept for the NAN 2026 (NHN Game × AI Hackathon) preliminary submission.**
> A roguelike where you raise a real LLM as "your character." MCP servers, Skills, prompts, and harnesses
> become items, equipped onto a real server-side model in real time as you clear dungeons
> (puzzle, LLM offense/defense, board game, and more).

---

## 0. Competition Positioning

- **Track:** NAN 2026 preliminary — "Build a game using AI." The judging criteria come down to *"Does the game collapse without AI?"* and *"How well did you direct the AI?"*
- **Our answer:** Stats are not fake numbers. They are the **measured performance of items equipped onto a real server-side model.** Remove the AI and the entire duel disappears — AI-native by definition.
- **Mapping to the five required deliverables:**
  - *Playable build* — Web (runs in browser), deployed via GitHub Pages.
  - *30–60s video* — Must clearly show three beats: the character **unlocking an MCP/Skill**, a **real duel taking place**, and the **performance gap between the two models rendered in the UI**. The viewer should be able to see that the equipped item changed the outcome.
  - *AI usage technical document* — How each item (prompt / MCP / Skills / harness) maps onto actual model behavior. This is the core of the document.
  - *Team role document* — Design and planning are done jointly. Implementation splits into **agent tuning, harness authoring, and game code** on one side, and **LLM infrastructure and testing** on the other.
- **Link to the finals:** The dungeon and duel pipeline (model serving + scoring harness) is a reusable framework, which becomes our evidence for *"we can adapt this to any theme within the 48-hour final."*

---

## 1. One-Line Concept

A roguelike where you **grow your own AI agent.**
The **MCP servers / Skills / prompts / harnesses** you collect become items (augments) equipped onto a real server-side model,
and that combination genuinely changes your agent's intelligence and capabilities.
If your performance falls short in a dungeon or boss fight, the session is `clear`ed and you start raising your agent from scratch.

**Key differentiator:** The stats aren't fake. A real LLM is attached, and the UI shows it solving problems live.

---

## 2. Why This Game (Design Intent)

- Most "AI-themed games" use AI as a **skin**. This game translates how AI actually works into the **game mechanics themselves.**
- Context windows, compaction, caching, prompt injection, hallucination — all real LLM characteristics, and all excellent roguelike resources and dilemmas.
- The target audience is clear: developers and AI power users. They will get every joke, and they overlap with the word-of-mouth crowd behind Papers, Please and Hacknet.
- **Alignment with the judges (working game and AI developers):** "Attach a real model and measure its performance" is the same shape as the *agent performance verification* problem they face in their own work, so it reads as both a game and a technical demo.

---

## 3. Core Loop

1. **Build your agent** — Equip items (MCP / Skills / prompts / harness) onto your base model.
2. **Enter a dungeon** — Choose a themed dungeon (puzzle / LLM offense-defense / board game / etc.). Each stage has field encounters and a boss.
3. **Live duel** — Solve each stage's task **with the real model.** The UI streams the process live: token flow, tool calls, attempts and failures.
4. **Loot and grow** — Win to earn new items and currency, strengthening your agent.
5. **Defeat = clear** — Fall behind on performance and the session ends. Start over, carrying your meta progression.

---

## 4. A Real LLM Is Attached (The Heart of the Game)

> When stats go up, the player *sees* the behavior actually get smarter.

- The **MCP servers and Skills on your character are genuinely equipped onto a real server-side model** during play.
- Dungeon level design places bosses built from **model environment combinations.** For example:
  - `GPT-5.3 + specific MCP/Skills`
  - `Opus 4.5 + specific techniques`
- Your model environment faces the boss's model environment in a **real duel.**
- **Signature presentation:** The "watch it break through in real time" UI is this game's calling card. Tokens streaming, attempts getting blocked, a workaround being found — the process itself is the spectacle.

---

## 5. Item System (Augments = Real Capability)

| Item type | Role in game | Real-world counterpart |
|---|---|---|
| **Prompt** | Passive / behavioral rules | System prompts, instructions |
| **Skills** | Active skills, unlockable abilities | Actual skill definitions |
| **MCP** | Tools and equipment | Actual MCP servers/tools |
| **Harness** | Equipment frame (slots, structure) | Agent harness |

- **Unlockable skills:** Compaction, caching, and similar capabilities are also unlocked as items/skills.
- **Paradoxical penalty:** If context fills up too far (overload), performance **actually degrades** (context rot). The opposite tension from survivor-likes where you stack good things forever.

---

## 6. Signature Mechanic: Context Management

- Instead of a health bar, the **context gauge** sits front and center.
- Equipped items, combat logs, and gathered information **continuously fill** the gauge. It's a weight-limit system (token capacity consumed, not a fixed six slots).
- As the gauge fills: skill activation lags (inference latency), and misfire/hallucination probability rises.
- **Hallucination events:** Under overload, "plausible falsehoods" occur — attacking enemies that aren't there, showing item pickups that never happened. Horror and comedy at once.

---

## 7. Feature: Compaction (Context Reset)

> Not a core mechanic — **one feature that supports context management.**

- **Compacting** (summarizing) your context empties the gauge and escapes the overload penalty.
- The catch: compaction can **randomly drop** some buffs or information during summarization — so *when* to trigger it becomes a judgment call during a dungeon run.
- (Optional design) A small probabilistic reward on compaction (an occasional unexpected gain) can add tension, but it stays strictly a side element.

---

## 8. Other Mechanics

- **Caching:** Recently repeated action patterns cost less and fire instantly. Creates a split between "combo routine builds" and "variety builds."
- **Meta progression (growth between runs):**
  - *Model generation upgrade* — Spend currency to upgrade your base model (v1 → v2). Newer models have higher baseline intelligence.
  - *Memory file* — Carry exactly one lesson forward into the next run.
  - *Fine-tuning* — Repeat specific behaviors to permanently unlock traits.

---

## 9. Dungeon System: Themed Stage Clears

> The backbone of combat is **touring multiple themed dungeons and clearing their stages.**
> Each stage is a **duel against a pre-configured model environment (the boss) through real API serving.**
> Treating AI as measured performance rather than as a skin is the heart of this system.

### Victory criteria (weighted differently per stage and dungeon)

- **Speed** — Who completed the task faster?
- **Token efficiency** — Who did it with fewer tokens?
- **Accuracy** — Whose result was more correct or higher quality?
- (Example weighting) Puzzle dungeons prioritize accuracy, LLM offense-defense dungeons prioritize speed, board game dungeons come down to the win/loss itself — each dungeon's flavor sets its own weights.

### Dungeon A — Puzzle Dungeon

Solve the problem first and more accurately. Material ranges from algorithmic problems to "real-world sense" tasks.

- **Example 1 — Algorithm puzzle:** Solve problems with verifiable answers (sorting, graphs, optimization) within a token budget.
- **Example 2 — Image geo-inference (GeoGuessr-style):** Given part of a public landscape photo, infer the country or region. Multimodal reasoning ability becomes a stat directly.
- **Example 3 — CTF-style security puzzle:** Find a hidden flag on a *deliberately vulnerable sandbox server built for training purposes.* (Strictly the isolated environment the game provides — never anyone else's real systems.)

### Dungeon B — LLM Offense-Defense Dungeon

Compete on **who can neutralize (achieve the objective against) an opposing conversational LLM faster.**

- **Example 1 — Refund approval race:** Extract a refund approval from a defensive customer-service chatbot faster than your opponent.
- **Example 2 — Breaking a confidentiality guard (Gandalf-style):** Draw the target information (a password, etc.) out of an NPC instructed to "never reveal this," using indirect conversation rather than a direct request. The defender's guard prompt grows more sophisticated as stages progress.

### Dungeon C — Board Game Dungeon

Head-to-head matches in **board games everyone knows** — Gomoku, chess, Othello. No rules explanation needed, so the barrier for the audience (the judges) is zero, and the win condition is unambiguous.

### Dungeon D — Negotiation / Game Theory Dungeon *(additional idea)*

Face opposing models in **multi-agent interaction** scenarios: auctions, resource splits, the prisoner's dilemma.

- Examples: negotiate with a rival AI over limited resources to secure a larger share; achieve higher cumulative payoff in an iterated prisoner's dilemma; win the most value per budget at auction.
- The victory criterion is "payoff obtained," demanding a different axis of skill (strategy, reading your opponent) than speed, tokens, or accuracy — which broadens dungeon variety.

---

## 10. Enemy / Boss Ideas

- **Prompt injection monster** — Injects fake instructions into your agent, causing friendly fire and item loss. The armor against it: an "instruction boundary."
- **Rate limit boss** — Caps your actions per hour. Caching builds are the counter.
- **Context bomb field** — Step on it and a flood of useless logs gets injected.
- **Model environment boss** — Built from real combinations like `GPT-5.3 + MCP` or `Opus 4.5 + techniques`.
- **Trait: "Evaluation benchmark" boss** — A trait that can be attached to any boss. It throws a fixed set of benchmark tasks and decides the match on score (natural, and funny). Applied to a final boss, it turns into a "conquer the leaderboard" moment.

---

## 11. Art / UX Direction (pick one or blend)

- **A. Survivor-like casual** — Higher accessibility, broader audience. Real-time model activity expressed through effects.
- **B. LangSmith-style developer compact** — A dense UI showing traces, token flow, and tool calls like a dashboard. Higher coherence with the target audience (developers).
- A blend also works: casual field exploration, switching to a developer trace view during duels.

---

## 12. Key Technical Risk: Binding Game State to Real Agent State

> The single most important technical unknown for this game. **Validate this first,** at the very start of preliminary development.

- This game does not work on a **simple one-shot API call** environment. The requirements are considerably stricter:
  - A **specific model plus specific Skills/MCP** must be genuinely equipped.
  - **Context must persist** across that state so dungeon clears, compaction, and so on can continue.
  - In other words, we need an **agent API with a durable session and state**, not a single-shot completion API.

- **The critical open question:** In a real agent runtime, **can we read state values like tokens consumed and current context occupancy and bind them to the player's character in real time?**

- **Branching plans:**
  - **(A) If binding is possible** — Bind the real agent's token usage and context state directly to the context gauge and character stats. This completes the game's biggest selling point: *stats are measured values.*
  - **(B) If binding is not possible** — The real model handles only duel performance (solving the task), while **the context gauge, token counts, and compaction become a separate system defined in the game layer.** Instead of reading real model state directly, a game-managed state model carries the roguelike resource-management fun.
  - Either way the game works, but **the "authenticity" of the presentation and the implementation difficulty differ**, so this boundary must be settled early and the design built on top of it.

- **Suggested validation order:** ① Confirm whether the chosen model/provider's agent API supports persistent state and tool equipping → ② Confirm whether token and context state values are exposed → ③ Decide (A) or (B) → ④ Finalize the game state model.

---

## Appendix: Glossary (for non-developers)

- **LLM** — Large language model (the AI itself: GPT, Claude, etc.).
- **MCP** — A protocol that lets a model use external tools. In game terms: "equipment."
- **Skills** — Bundled capabilities for specific tasks. In game terms: "skills."
- **Harness** — The execution frame that wraps a model with tools and rules. In game terms: "equipment frame."
- **Context** — How much information a model holds at once. In game terms: "the gauge."
- **Compaction** — Summarizing context to free it up. In game terms: "the context reset feature."
- **Prompt injection** — An attack that secretly plants different instructions in a model. In game terms: "a combat method."

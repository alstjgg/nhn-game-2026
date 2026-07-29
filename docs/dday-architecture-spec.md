# DDAY Architecture Spec

> Status: DRAFT — structure agreed, contents pending team revision.

Single source of truth for the game's **core technology**. Every workstream
(LLM layer, scenario generation, UI/UX, planning document) builds against this
spec; no downstream artifact may narrow it. The mechanism test program
([dday-mechanism-deep-test.md](./dday-mechanism-deep-test.md)) supplies
**parameters** — which mechanisms survive, with what authoring guidelines, at
what hit rates — and fills the slots marked in §9; it does not change the
architecture. When an artifact conflicts with this spec, the artifact is wrong
or this spec gets amended explicitly — never silently.

## 1. Core loop

The player runs a situation room during an unfolding incident. There is no
spatial movement; information arrives through phone calls and CCTV. The player
never controls the agent's actions; the player shapes the agent's **judgment**.

```
observe (timeline: calls, CCTV, NPC dialogue)
  → mine sentence blocks (from timeline + the agent's self-written reports)
    → compose the agent prompt (inject blocks, reorder priorities, pick temperament)
      → the agent judges at the next gate (chooses a stance)
        → the world advances deterministically (§2, §3)
          → new material is generated (narration, NPC dialogue, reports)
            → back to observe
```

- **Membrane rule.** The player never types free text to the LLM. All player
  input is composed from structured game elements. The player's manipulation
  vocabulary is *mined*, not typed — which makes the generated material the
  player's supply chain (§5).
- **Injection unit = the report block.** A block is any sentence block the
  player extracts from the timeline or from the agent's self-written reports:
  fact statements, emotion descriptions, NPC quotes, the agent's own
  self-narration. Fact statements are one *species* of block, not the
  definition of the unit.
- **Design thesis: the illusion of freedom.** The agent behaves, speaks, and
  reasons freely on the surface; the world advances on a closed, deterministic
  spine. The game is a proof that generative freedom can be staged on a
  controllable structure.

## 2. Game graph

A branching-scenario game in the mold of choice-graph adventures — with the
difference that the branch choice is made not by the player but by **the agent
the player has shaped**.

- **Nodes are gates** (judgment points). Between gates, events are scripted;
  what varies between runs is (a) which edge is taken and (b) the generated
  surface (utterances, NPC dialogue, reports).
- **At each gate the agent chooses a stance** from that gate's stance set
  (e.g. persuade, press, empathize, trade, stay silent). Stance sets are
  **per-gate content**, not a global constant — each gate defines which
  stances are available and meaningful there.
- **Edges are keyed by (stance, state predicate).** The chosen stance plus
  deterministic checks on numeric state (e.g. a rapport threshold) select
  exactly one next node. Example edge pair:
  `(persuade, rapport ≥ 50) → G7` / `(persuade, rapport < 50) → G5`.
- **Outcome buckets.** Stances map many-to-few onto a gate's outcome buckets
  (2–4 per gate); not every stance needs a unique destination. Buckets keep
  the edge count authorable.
- **Braided topology.** Branches reconverge at mandatory beats, keeping node
  count linear rather than exponential. A "missed" gate routes to a different
  branch — a harder path, a lost resource, a different ending — not
  automatically to scenario failure. Dead ends are permitted but must be
  authored deliberately and sparingly, never as the default failure handling.
- **Run ending is a score, not a verdict (preferred model).** The run
  terminates at a fixed scenario clock and reports a **run score**: a
  deterministic function over terminal state, of the shape
  Σ(unit size × predicate). Worked example from a prior scenario draft:
  score = survivors/total over 413 people in 7 groups, where a group counts
  as evacuated iff its departure order took effect before
  (deadline − that group's lead time, 4–14 min); a no-intervention run
  scores 61/413. Under this model "failure" dissolves into a score gradient
  — a missed gate costs score, not the run. Requirements:
  - *Attributability*: every scored unit's outcome must trace to state the
    player could have influenced through identifiable gates. A score delta
    without a legible cause is a bug — this is the scoring analogue of
    reason traceability.
  - *Baseline anchoring*: the no-intervention score is authored and known,
    giving the player a measuring stick; replay becomes score-chasing
    rather than win/lose.
  - *Caveat*: the model fits evacuation/mitigation scenarios natively
    (units = population groups, predicate = timing). Prevention-type
    scenarios ("stop the incident from happening") do not decompose as
    naturally. Whether the winning scenario binds this model, adapts it,
    or falls back to discrete endings is a §9 parameter, decided at
    scenario selection.
- **Authoring constraint.** Every gate must be expressible in the gate
  standard form ("At gate G, the agent's default stance is X; injecting block
  F / ordering S / temperament K shifts it to Y") and must instantiate a
  verified mechanism from the mechanism spec. A gate that needs a new
  mechanism type is a cost, not a flourish.

## 3. State engine

Fully deterministic. Given the same stance choices and the same starting
state, the same route is taken — all run-to-run variety lives in the agent's
judgment and the generated surface, never in the engine.

- **Variables**: per-character scalars, knowledge flags, globals, and route
  bookkeeping. The qualification tests and the maximal candidate pool are in
  §3.1; the concrete list is bound with the winning scenario (§9).
- **Actuator whitelist.** State changes through exactly two hands:
  1. **(gate, stance) fixed deltas** — each stance at each gate carries a
     pre-authored delta (e.g. `press: rapport −20`).
  2. **Scripted event effects** — fixed events in the scenario data.
  Nothing else moves state. In particular, the agent's free text (utterance,
  inner monologue, reports) and NPC dialogue have **no state authority**.
- **Ordering rule**: the stance delta applies **before** the edge predicate is
  evaluated. (Deterministic and explainable: the consequence of this beat's
  action is part of this beat's outcome.)
- **Execution grading is OFF at launch.** The stance choice alone moves state;
  how well the agent performs the stance is surface. A bounded grader (delta
  modulated ±α by execution quality) may be adopted later, conditional on the
  E-LEV finding in the mechanism program (§9) — it is an upgrade slot, not a
  launch dependency.

### 3.1 Variable qualification and candidate pool

A variable earns an engine slot only by passing **all three** tests:

1. **Write** — at least one whitelist actuator (a (gate, stance) delta or a
   scripted event) moves it. A variable the player cannot reach is GM-only
   bookkeeping.
2. **Read** — at least one edge predicate or the run-score function reads it.
   A variable nothing reads is dead weight.
3. **Visible** — the player can perceive its movement as *symptoms* in the
   generated surface (narration, NPC dialogue, reports). Attributability
   (§2) requires perceivable causes; an invisible variable makes outcomes
   feel arbitrary.

**Numbers never enter prompts.** NPC-internal state conditions the narration
call and surfaces as symptoms ("breathing quickens"), never as raw values —
for the agent or the player. Diegetic instrument readouts (a trace-progress
meter on a situation-room screen) are the one exception: they are in-world
displays, not internal state.

Candidate pool (maximal; the winning scenario binds a subset, §9):

| Kind | Candidates | Drives |
|---|---|---|
| Dyadic scalars (per NPC, toward the agent) | **trust** (information sharing, off-script speech) · **authority** (compliance with directives, independent of liking) · **suspicion** (active counter-play: lying, probing) | information release, compliance, deception |
| NPC-internal scalars | **fear** (line cuts, refusal, fragmented speech — the same axis already verified on the temperament side) · **commitment** (whether a coerced or adversarial NPC deviates from their script) | escalation, script deviation |
| Knowledge flags | `knows[npc][info]` booleans | discrete behavior unlocks — cheapest to author, most legible; prefer over scalars |
| Global | **clock** (non-negotiable) · **organizational posture** (enum, e.g. "filed as hoax" ↔ "live threat") · **resource meters** (trace %) · **per-group order timestamps** (the run-score substrate, §2) | routing, scoring, tension |
| Not variables | NPC **traits** — temperament, stakes, role. Static per run; they justify a character's delta table, they don't live in the engine | — |

Reduction rules, applied at scenario binding:

1. Fails any of the three tests → out. Visibility is the usual killer.
2. Flags over scalars, unless accumulation is the point of play (trust, fear).
3. Budget ≈ **≤2 scalars per NPC** (trust + fear are the expected survivors)
   plus clock, posture, 1–2 meters, and group timestamps. Every added
   variable widens every (gate, stance) delta row — the cost is
   multiplicative, not additive.
4. Recorded merges: suspicion ≈ low trust + a flag; authority → trait unless
   earning command is the scenario's theme; commitment vanishes if the
   scenario has no coerced NPC.

## 4. Call inventory

All LLM calls run on **haiku**, through the proxy backend (§7), with output
forced through a tool-use schema. Four call types exist; no others.

| # | Call | System layer (proxy-owned) | In-band payload | Output (tool-use schema) |
|---|---|---|---|---|
| 1 | **Judgment** | Default prompt + selected temperament definition | Situation, injected blocks, priority ordering, gate question + stance set | `stance` (∈ gate's set), `because` (block ids), `rejected` (stance, reason), `utterance`, `inner_note` |
| 2 | **Narration / NPC dialogue** | Narrator instructions | The gate's **fixed NPC action** (constraint), the agent's actual utterance (context), minimal scene state | Timeline entry text + NPC dialogue lines. One bundled call per beat, not one per NPC |
| 3 | **Reporter** | Reporter instructions + temperament | Round events **including the judgment call's free output** (utterance, inner_note) and generated NPC dialogue | The agent's self-written report (markdown body) |
| 4 | **Grader** (dormant) | — | — | Reserved; activated only via the §3 upgrade slot |

- **System-prompt ownership**: the proxy owns every system layer. Player-
  manipulable material travels in-band only. This is simultaneously the
  production security boundary and the test harness's out-of-band/in-band
  separation — tests mirror this shape.
- **Latency hiding (six rules).** Observed judgment latency is 30–49s on
  haiku; the game absorbs it by design, not by shrinking prompts alone:
  1. Deterministic events are authored data and render instantly — the
     screen stays alive without the LLM.
  2. Gates are known in advance on the timeline — **prefetch**: the player's
     reading time on the preceding lines is the next call's buffer.
  3. Waiting is diegetic — "…awaiting radio reply" is suspense, not lag.
  4. The longest call (the self-written report) hides behind the tally
     screen (survivor count-up).
  5. Report generation streams (SSE) into a typing-effect UI — the agent
     visibly writes its report, and token arrival rate *is* the typewriter.
     Combined with rule 4: the tally screen absorbs time-to-first-token,
     the streaming typewriter absorbs the rest.
  6. Mid-action play never blocks on an LLM response (repo hard rule;
     invariant I11).
  Prompt length remains a constrained variable — a longer prompt spends
  hiding budget, and rule 2's buffer is finite — but the budget is set by
  these rules plus the UI pause structure, not by a single pause length.
  Numeric budget: §9.

## 5. Data flows (the supply chain)

```
                 ┌──────────────────────────────────────────────┐
                 │                  TIMELINE                    │
 fixed events ──→│  scripted beats · NPC dialogue (call 2)      │
 judgment call ─→│  agent utterance · (inner_note → report only)│
                 └──────────────┬───────────────────────────────┘
                                │ round events + free output
                                ↓
                        REPORTER (call 3) → SELF-WRITTEN REPORT
                                │
                                ↓
                  PLAYER MINES BLOCKS (timeline + reports)
                                │
                                ↓
                  PROMPT COMPOSITION → next JUDGMENT (call 1)
```

**Wirings that must never be cut** (each one, if severed, silently degrades
the game into a fixed puzzle):

- **W1** — judgment free output (`utterance`, `inner_note`) flows into the
  reporter's input and (utterance) into the timeline. Without W1, every run's
  minable material is identical and the agent's freedom is decoration.
- **W2** — generated NPC dialogue lands in the timeline and is minable. NPCs
  are part of the vein, not just flavor.
- **W3** — the player's block-extraction UI operates on the *actual generated
  text* of timeline and reports, not on a pre-authored subset.
- **W4** — no free text ever reaches the state engine. The free layer's only
  actuator is the player (via mining and re-injection).

## 6. Prompt surface

The agent's default prompt is the game's playing field. Its sectioned
structure is fixed here; its contents are filled by the mechanism spec
(authoring guidelines) and scenario data.

- **Sections** (order itself is a manipulation surface): identity/role ·
  priority list (**player-reorderable**) · known blocks (**player-injectable
  slots**) · procedures/constraints. Temperament is *not* a section — it
  lives out-of-band in the system layer (§4).
- **Player-facing controls map 1:1 onto prompt operations**: inject block →
  a line in *known blocks*; reorder → permutation of the *priority list*;
  temperament choice → system-layer swap. Nothing else on the prompt is
  player-reachable.
- **Length is a constrained variable**: a richer default prompt is a larger
  manipulation surface *and* more latency (§4). The mechanism program's
  surface-form findings and the latency budget jointly set the size.

## 7. Runtime and integrity

- Runtime model **haiku**; all calls via the **proxy backend**. No API keys
  in the client, ever.
- Output is forced through **tool-use schemas** (no free-text parsing). A
  response that violates its schema is retried, not hand-repaired; retries
  are logged.
- **Context isolation, ported from the test program's integrity protocol**:
  the judgment call receives its payload only. It must never see the
  scenario's hidden truth, the full graph, state internals, or prior raw
  results — both an anti-leak measure (the agent would metagame the mystery)
  and the production analogue of the test harness's `tools: []` isolation.
- **Raw call logging**: every production call retains prompt, response, and
  latency. Aggregated game state is never the only record — this is what
  makes post-hoc balance analysis and the competition's orchestration
  documentation possible.
- All tunables (deltas, thresholds, stance sets, gate graph) live in `data/`
  as data, never inline in logic.

## 8. Invariants (anti-narrowing checklist)

Review every downstream artifact — code, scenario, test suite, planning doc —
against this list. An artifact that breaks one of these is defective even if
it works.

- **I1** The injection unit is the **block** (any timeline/report sentence).
  Never narrowed to fact-type sentences only.
- **I2** The player never types free text to the LLM (membrane rule).
- **I3** Free text has no state actuator; state changes only through the §3
  whitelist.
- **I4** Judgment free output flows into timeline and reports (W1–W3 intact).
- **I5** Stance sets are per-gate content; only the output *format* is
  global.
- **I6** Edges are deterministic: same stance + same state ⇒ same routing.
- **I7** System layers are proxy-owned; player material is in-band only.
- **I8** The judgment call never sees the hidden truth or the graph.
- **I9** Every gate is gate-standard-form expressible and instantiates a
  verified mechanism.
- **I10** Balance lives in `data/` as data.
- **I11** LLM latency hides behind the §4 hiding rules; mid-action play
  never blocks on a call.
- **I12** NPC-internal state reaches prompts and player-facing text only as
  narrated symptoms, never as raw numbers (diegetic instrument readouts
  excepted).

## 9. Open parameters (binding schedule)

Deliberately unbound slots. Each has an owner and a binding moment; none may
be bound implicitly by whoever touches it first.

| Parameter | Bound by | When |
|---|---|---|
| Tool-use schemas (final field lists per call type) | L (default: mechanism owner, proxy conforms) | Before the first post-shape test call |
| Per-gate stance sets | Scenario authoring (S) | At scenario generation, per gate |
| State variable list (which stats, which flags) | Scenario authoring (S) | With the winning scenario, drawn from the §3.1 candidate pool under its reduction rules |
| Repetition count N / call budget | Mechanism program (M) | Before test-suite authoring |
| Numeric gate-eligibility floor | M + U jointly | After N, retry structure, and topology are known |
| Latency budget (numeric, per beat) | U (pause structure) | With the UI/UX design |
| Grader activation (§3 upgrade slot) | M (E-LEV finding) | After E-LEV deep-test |
| Report cadence (per beat vs per round) | U + L | With the UI/UX design |
| Ending model / run-score metric | S (scenario selection) | With the winning scenario — score gradient preferred (§2); discrete endings only if the scenario cannot decompose into scoreable units |

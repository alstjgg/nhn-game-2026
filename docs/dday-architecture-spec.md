# DDAY Architecture Spec

> Status: **v1** — compiled after the mechanism verification program closed.
> This spec states what the system **is**; it does not re-argue why. Evidence
> and decision history live in
> [`planning/dday-mechanism/REPORT.md`](../planning/dday-mechanism/REPORT.md)
> and the
> [07-30 회의록](../planning/meetings/2026-07-30-mechanism-close-spec-first.md).

Single source of truth for the game's **core technology**. Every workstream
(LLM layer, scenario generation, UI/UX, planning document) builds against this
spec; no downstream artifact may narrow it. When an artifact conflicts with
this spec, the artifact is wrong or this spec gets amended explicitly — never
silently.

## 1. Core loop

The player runs a situation room during an unfolding incident. There is no
spatial movement; information arrives through phone calls and CCTV. The player
never controls the agent's actions; the player shapes the agent's **judgment**.

```
observe (timeline: calls, CCTV, NPC dialogue)
  → mine sentence blocks (from timeline + the agent's self-written reports)
    → compose the agent prompt (inject blocks)
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
  definition of the unit; species differ in **certification** (§2.1), never
  in minability.
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
- **Outcome buckets.** Stances map many-to-few onto a gate's outcome buckets
  (2–4 per gate); not every stance needs a unique destination. Buckets keep
  the edge count authorable — a gate with 5 stances and 3 buckets authors 3
  predicate sets, not 5. A one-stance bucket is allowed, so bucketing costs no
  expressiveness.
- **Edges are keyed by (outcome bucket, state predicate).** A stance resolves
  to its bucket first; the bucket plus deterministic checks on numeric state
  (e.g. a rapport threshold) then select exactly one next node. Example edge
  pair: `(pressed, rapport ≥ 50) → G7` / `(pressed, rapport < 50) → G5`.
  Deltas are keyed per *stance* (§3) and edges per *bucket* — the two keys are
  deliberately different granularities, and §3's ordering rule states the
  chain.
- **Braided topology.** Branches reconverge at mandatory beats, keeping node
  count linear rather than exponential. A "missed" gate routes to a different
  branch — a harder path, a lost resource, a different ending — not
  automatically to scenario failure. Dead ends are permitted but must be
  authored deliberately and sparingly, never as the default failure handling.
  **Demo binding: braided, zero dead ends — a missed gate costs run score or
  routes to a harder branch, never ends the run.** (The dead-end capability
  stays in the engine; the demo doesn't use it.)
- **Gate budget (demo binding): 5–8 gates.** Judges play minutes, not hours;
  each gate is a substantial authoring unit (stance set, delta rows, edge
  predicates, buckets); and 5–8 is what scenario generation can produce *and
  verify* inside its window. Demo-scope bind, not an engine limit.
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
  - *Deduction recognition (open seam)*: §1 names uncovering the hidden
    truth as the player's goal, but nothing in this score distinguishes
    "understood the truth and steered accordingly" from "picked stances
    that happened to work" — deduction is a player mental state, not a
    stance. Candidate resolutions, bound at scenario selection (§9):
    **(a) deduction commit** — before the terminal beat the player pins a
    set of mined blocks as "the truth of the incident," scored
    deterministically against author-tagged truth blocks (membrane-safe:
    composed from blocks, never typed; reuses the mining UI);
    **(b)** a score term keyed to flags reachable only through
    truth-dependent gates (implicit recognition, zero new UI);
    **(c)** reword §1 so truth-understanding is the *means* to steering
    well, not the scored goal. Default lean: (b)+(c); (a) is the stretch
    option.
- **Authoring constraint.** Every gate must be expressible in the gate
  standard form ("At gate G, the authored temperament yields default stance
  X; injecting block F shifts it to Y") and must instantiate the player
  channel (§2.1). Temperament is not a shift lever — it is the authored
  source of the default X and of the conditions blocks trip (I13). A gate
  that needs a new mechanism type is a cost, not a flourish. Beats between
  gates carry their own authoring constraint: **a fixed NPC action may not
  demand a reply from the agent** (§4, call 2).

### 2.1 The player channel

The game has exactly **one player channel: block injection.** A mined
sentence block, injected into the judgment payload, shifts the agent's
reading of the situation and with it the stance — referent-specifically: the
block moves the judgment about the person it names, and only that person.
The **objective-reframe pattern** — a block asserting what *this interaction
itself* is ("이 전화는 협박이 아니라 신고일지 모른다") — is a validated use
of the same channel and may key edges; it is how a gate's pursued objective
is changed.

Laws of the channel, binding on every gate, edge, and score path:

- **Certified species.** The channel is certified for **fact** and
  **self-narration** blocks. Gates, edge predicates, and score paths may
  only *require* certified species. Emotion-description and NPC-quote
  blocks remain minable and injectable (I1) but are **uncertified**: their
  effect is erratic by nature, they are a discoverable gamble for the
  player, and nothing in the graph may depend on one.
- **Blocks are irreversible.** Once injected, a block cannot be removed or
  un-taught. There is no removal or doubt mechanic; the counter-move is
  injecting an opposing block. Commitment has weight by design.
- **Content, not order.** What a block asserts is the lever; the ordering
  of prompt content is not. No ordering control exists anywhere in the
  player surface.
- **Accumulation budget.** The pinboard cap (§6.3) bounds how many blocks
  are active at a gate; the multi-gate smoke run (§9) must pass before the
  full graph is authored.

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
- **Deltas are fixed.** How well the agent performs a stance is surface; it
  never modulates the delta. Delta application happens at a **single seam**
  in the engine — an engineering constraint that keeps future modulation
  insertable without touching delta rows, and keeps the whitelist auditable.
- **Ordering rule**: within a beat the chain is *stance → apply its (gate,
  stance) delta → resolve the stance to its outcome bucket → evaluate that
  bucket's edge predicates against the **updated** state*. The delta lands
  before the predicate is read. (Deterministic and explainable: the consequence
  of this beat's action is part of this beat's outcome.) This is engine
  behavior, not data, and is worth a test of its own — reversing it changes
  routing while still looking deterministic.
- **Per-beat delta journal**, not just a state snapshot. The engine emits, for
  each beat, `{variable, before, after, cause}`. Required because §3.1's
  visibility test renders symptoms from *movement*, not level: "breathing
  quickens" needs to know fear rose this beat, and a narration call given only
  `fear = 70` cannot express it — which would fail every variable on test 3 at
  runtime regardless of authoring. The journal is also what makes
  attributability debuggable.
- **The engine is indifferent to the variable list.** Variables, delta tables,
  and predicates are data (`data/`); binding a concrete list with the winning
  scenario must touch no engine code. If it does, the engine has absorbed
  scenario content — the anti-narrowing failure §8 exists to catch.

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

**Route bookkeeping is exempt from test 3** — visited nodes, taken edges, the
beat index. The engine writes it rather than an actuator, edge predicates may
read it, but the player perceives the route as the *story*, not as a stat, so
demanding a symptom for it is a category error. It stays engine-internal: never
scored, never surfaced as a value. This is the only exemption; everything in the
pool below faces all three tests.

Where each test gets its evidence:

| Test | Evidence source |
|---|---|
| Write | Static check on the delta table — does any whitelisted actuator row write this variable? — plus the reachability audit for the *is that row reachable* half |
| Read | The reachability audit: is this variable read by any edge predicate or the score function, at graph level |
| Visible | A narration-call probe: render a beat from a moved variable, ask a reader who has not seen the state to name the direction of change. Runs inside the Call 2 quality review (owner L, §9); **prerequisite for binding the variable list** |

**Numbers never enter prompts.** NPC-internal state conditions the narration
call and surfaces as symptoms ("breathing quickens"), never as raw values —
for the agent or the player. Diegetic instrument readouts (a trace-progress
meter on a situation-room screen) are the one exception: they are in-world
displays, not internal state.

Candidate pool (maximal; the winning scenario binds a subset, §9):

| Kind | Candidates | Drives |
|---|---|---|
| Dyadic scalars (per NPC, toward the agent) | **trust** (information sharing, off-script speech) · **authority** (compliance with directives, independent of liking) · **suspicion** (active counter-play: lying, probing) | information release, compliance, deception |
| NPC-internal scalars | **fear** (line cuts, refusal, fragmented speech) · **commitment** (whether a coerced or adversarial NPC deviates from their script) | escalation, script deviation |
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
forced through a tool-use schema. Three call types exist; no others. Their
executable input/output contracts are bound one level down in
[dday-call-contracts.md](./dday-call-contracts.md); this section fixes what
each call is and is not.

| # | Call | System layer (proxy-owned) | In-band payload | Output (tool-use schema) |
|---|---|---|---|---|
| 1 | **Judgment** | Default prompt + the scenario's **authored** temperament definition (hidden from the player, I13) | Situation, injected blocks, gate question + stance set | Field order is bound: `inner_note` → `stance` (∈ gate's set) → `because_referent` (the named target) → `because_block_ids` (the cited ids) → `rejected_stance` (∈ set) → `rejected_reason` → `utterance`. **Every field is a scalar or array of scalars — nested objects are prohibited** |
| 2 | **Narration / NPC dialogue** | Narrator instructions | Timeline tail (**already containing the engine-rendered fixed action and the agent's utterance**), the fixed NPC action as a *non-contradiction* constraint, scene state as rendered symptoms, the beat's present-NPC roster | **Reaction only** — timeline entries for what follows, plus NPC dialogue lines keyed to a roster id. One bundled call per beat, not one per NPC. It does **not** narrate the fixed action or the agent's utterance: both are deterministic data the engine renders itself (latency rule 1) |
| 3 | **Reporter** | Reporter instructions + temperament | Round events **including the judgment call's free output** (utterance, inner_note) and generated NPC dialogue | `facts` (objective-log entries) + `report_body` (the agent's self-written report). `report_body` is generated last, so a streaming upgrade stays schema-compatible |

- **Call 2 is load-bearing, not decoration.** Its output lands in the
  timeline and is minable (W2), so bland narration thins the player's supply
  chain regardless of how valid the mechanisms are. Mineable yield is what
  the Call 2 quality review measures (§9).

- **Call 2 generates the reaction, not the event.** The fixed NPC action and
  the agent's utterance are authored or already-emitted data, so the engine
  renders them and Call 2 writes only what follows. Because the call never
  realizes the event, its failure mode is **contradiction** — a local
  defect — not a story/state split.

- **Beat-boundary constraint — a fixed action must not demand a reply from
  the agent.** Call 2 can only voice the beat's present-NPC roster, and the
  agent is deliberately not on it (the agent's speech is call 1's
  `utterance`). A fixed action that asks the agent a question therefore
  leaves a hole in the dialogue that the call fills with whoever it *can*
  voice: the asker answers itself, or a bystander NPC starts acting as the
  agent. That is the same damage as any free-text state leak — an NPC
  standing in for the agent extracts information the state engine never sees
  (I3, W4) — and no output validator can catch it, because the substitute
  line is well-formed. Author the answer as the next beat's call-1
  `utterance`, or make the moment a gate.
- **System-prompt ownership**: the proxy owns every system layer.
  Player-composed material travels in-band only; the player has no
  system-layer control (I7). This is simultaneously the production security
  boundary and the out-of-band/in-band separation that testing mirrors.
- **Latency hiding (six rules).** Judgment latency **at production payload
  size is not yet measured**, and the budget is not sized from anything
  else: probes so far ran test-sized payloads without the proxy hop
  (substantially faster, and inadmissible for sizing), while the ~19–75s
  figure of earlier drafts timed subagent round-trips rather than API calls
  and is withdrawn. The number stays open until the engine is attached and
  a production-shaped call is timed (§9). The game absorbs latency by
  design, not by shrinking prompts alone:
  1. Deterministic events are authored data and render instantly — the
     screen stays alive without the LLM.
  2. Gates are known in advance on the timeline — **prefetch**: the player's
     reading time on the preceding lines is the next call's buffer.
  3. Waiting is diegetic — "…awaiting radio reply" is suspense, not lag.
  4. The longest call (the self-written report) hides behind the tally
     screen (survivor count-up).
  5. The report plays into a typing-effect UI — the agent visibly writes
     its report. **The typewriter is client-driven, replaying a completed
     response at a controlled rate.** SSE remains a schema-compatible
     upgrade — `report_body` is the last generated field for exactly that
     reason — but is not built: the deployed path (API Gateway → Lambda →
     Bedrock Converse) buffers responses, so streaming would need a
     different transport. Consequence for rule 4: **the tally screen must
     absorb the whole generation, not only time-to-first-token.**
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
 scripted      ─→│  scripted beats · fixed NPC actions          │
 events          │                                              │
 judgment (1)  ─→│  agent utterance   (inner_note → report only)│
 narration (2) ─→│  reaction entries · NPC dialogue lines       │
                 └──────────────┬───────────────────────────────┘
                                │ round events + judgment free output
                                ↓
                        REPORTER (call 3)
                                ├──→ facts       → objective-log UI
                                └──→ report_body → report UI (typewriter)
                                          │
                                          ↓
                  PLAYER MINES BLOCKS (timeline + report_body)
                                          │
                                          ↓
                  PROMPT COMPOSITION → next JUDGMENT (call 1)
```

The engine — not call 2 — writes the deterministic material into the
timeline: scripted beats, the gate's fixed NPC action, and the agent's
`utterance` as it comes off call 1. Call 2 appends only the **reaction** to
what is already there (§4). The timeline is then also the context both
generative calls read back — call 2 takes its tail, call 3 the round's
events — so the loop closes on it. The slot-by-slot supplier and consumer
map lives one level down, in
[dday-call-contracts.md](./dday-call-contracts.md) §6; this section fixes
only which wirings must exist.

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

W1–W3 are implemented and verified end to end: a beat drives all three calls
in sequence, each call's payload built from the previous call's real output.
W4 currently has nothing to violate it — no deltas, buckets, or routing
exist yet — so **checking W4 is the minimal engine's first obligation** when
it lands. Verified wiring says nothing about yield: whether the generated
surface is *worth* mining is the Call 2 quality question (§4, §9), measured
separately.

## 6. Prompt surface

The agent's default prompt is the game's playing field. Its sectioned
structure is fixed here; its contents are filled by authoring guidelines and
scenario data.

### 6.1 Sections and persona layering

Two layers, and the split *is* the security boundary of §4: the system layer
is proxy-owned, and player-composed material travels in-band only; nothing
the player composes enters the system layer (I7).

| Layer | Sections | Player-reachable |
|---|---|---|
| System — base | role · stakes · perception · flaw · incident · accountability · priority list · judgment contract | **none** |
| System — temperament | one default disposition + ≤2 conditional clauses | **never** (I13) |
| In-band payload | situation · **known blocks** · gate question + stance set | known blocks only (inject) |

The priority list is a **fixed authored section** of the base — fiction that
frames the agent's duties, with no player control attached. The section
names above are the working slot template and may be revised until the
production prompt binds (§9); the two-layer split and the reachability
column are fixed here. Temperament is not a section of the base — it is a
separate out-of-band layer composed with it (§4).

- **Persona layering rule (doorway vs lever).** The base identity is written
  as **named categories**, and temperament definitions **extend those
  categories** with their own entries rather than replacing prose.
  What goes where: flaws that are a manipulation channel's *doorway*
  (susceptibility to misinformation — block injection must work under every
  authored temperament) plus generic fallibility live in the **base**;
  flaws and strengths that *tilt stances* (fear response, authority
  posture, bravery) live in **temperament** — authored per scenario, hidden
  and immutable to the player (I13). The player pulls those levers
  indirectly: blocks whose vocabulary trips the clauses are the keys, and
  the report's leaked fingerprint is how the player learns which locks
  exist. Contradictory pairs (submits-to-authority vs stands-up-to-power)
  never both sit in base: a pair in base is a lever the player can no
  longer pull. The base carries no competence category that names an axis —
  that too is a lever lost.

### 6.2 Axis discipline

- **Axis exclusivity.** No axis vocabulary (fear, authority, …) appears in
  both the base and any temperament: axis vocabulary is the temperament's
  **exclusive asset**, and base competence anchors stay axis-neutral. An
  axis constant across all builds is a lever the player cannot pull.
- **Temperament structure.** One unconditional default disposition plus
  **N ≤ 2 conditional clauses** — the cap is a haiku-reliability limit, not a
  style preference (§9, authored-roster row). Every conditional clause carries
  a **defeat condition** ("단, 이미 확인된 사실과 어긋날 때는 그렇지 않다"), and
  a conditional without one fails lint — a rule without a check is a
  preference.
- **The lint target** is the axis registry kept beside the prompt template.
  Every base edit and every new temperament is checked against it.
- **No undeclared baseline stances.** An unconditional when-X-do-Y clause in
  the *base* must be either declared and probed, or moved into a temperament,
  or cut.
- **Direction/style clauses live in narration and reporter, not judgment.**
  "The human element is paramount" and "embrace the flaws" are correct for
  the prose-rendering calls (2, 3) and wrong for the judgment call: there
  they name axes and instruct variance, inflating baseline emotional
  vocabulary. If the judgment call's free-output richness thins, the
  recovery is an axis-neutral concreteness clause, never the axis-naming
  ones.
- **Canonical axis vocabulary.** One shared dictionary of axis terms (fear,
  authority, threat, …) feeds temperament conditional clauses, authored
  prompt content, and block tagging (§9 block-pool row) — so
  vocabulary-alignment interactions between an injected block and the
  temperament clauses it may trip are *authored*, never accidental. The
  priority list is inside this dictionary's scope because it is prompt text
  the blocks sit beside, not because the player can move it (I7).

### 6.3 Player surface and size

- **Player-facing controls map 1:1 onto prompt operations**: inject block →
  a line in *known blocks*. That is the whole list. Nothing else on the
  prompt is player-reachable — in particular **temperament**: hidden and
  immutable to the player (I13). The player reaches its clauses only
  indirectly, by injecting vocabulary-aligned blocks that trip their
  conditions, and reads it only through the clues the self-written report
  leaks (the deduction layer).
- **Length is a constrained variable**: a richer default prompt is a larger
  manipulation surface *and* more latency (§4). Surface-form authoring and
  the latency budget jointly set the size.
- **Two §9 parameters live on this surface.** (1) The injectable **slot
  count** — it sets the combinatorics of play, the prompt length, and
  therefore the latency spend; it doubles as the accumulation budget
  (§2.1). (2) The **block-pool shape**: over a run, every timeline/report
  sentence is minable (I1) while, under vocabulary-alignment laws, most
  blocks are inert — a large pool with a hidden matching rule is the
  classic unfair-puzzle shape. Any fix must preserve I1/W3: curate **carry
  capacity** (a pinboard cap), tag blocks with their species and axes
  (§2.1), or age the timeline — never restrict what is minable.

## 7. Runtime and integrity

- Runtime model **haiku**; all calls via the **proxy backend**. No API keys
  in the client, ever.
- Output is forced through **tool-use schemas** (no free-text parsing). A
  response that violates its schema is retried, not hand-repaired; retries
  are logged.
- **Context isolation**: the judgment call receives its payload only. It
  must never see the scenario's hidden truth, the full graph, state
  internals, or prior raw results — the agent would metagame the mystery.
  Isolation is enforced at the **transport level**: a bare API call granted
  exactly one tool, the output schema. Isolation must be structurally
  impossible to violate, never merely configured.
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
  Never narrowed to fact-type sentences only. Certification is a separate
  axis (§2.1): everything is minable, but gates may only *require*
  certified species.
- **I2** The player never types free text to the LLM (membrane rule).
- **I3** Free text has no state actuator; state changes only through the §3
  whitelist.
- **I4** Judgment free output flows into timeline and reports (W1–W3 intact).
- **I5** Stance sets are per-gate content; only the output *format* is
  global.
- **I6** Edges are deterministic: same stance + same state ⇒ same routing.
- **I7** System layers are proxy-owned; the player composes nothing into
  them. The player's only prompt operation is in-band block injection.
- **I8** The judgment call never sees the hidden truth or the graph.
- **I9** Every gate is gate-standard-form expressible and instantiates the
  player channel (§2.1) — block injection, including the objective-reframe
  pattern.
- **I10** Balance lives in `data/` as data.
- **I11** LLM latency hides behind the §4 hiding rules; mid-action play
  never blocks on a call.
- **I12** NPC-internal state reaches prompts and player-facing text only as
  narrated symptoms, never as raw numbers (diegetic instrument readouts
  excepted).
- **I13** Temperament is **hidden and immutable to the player** — never a
  player-facing selection, menu, or prompt section. The player reaches its
  clauses only through belief supply (blocks) and reads it only through
  report clues.

## 9. Open parameters (binding schedule)

Deliberately unbound slots. Each has an owner and a binding moment; none may
be bound implicitly by whoever touches it first.

**Owner letters** (historical workstream codes from the archived 07-29
[roadmap](../planning/dday-roadmap.md) §2; current ownership is the three
tracks of [dday-scenario-pipeline.md](./dday-scenario-pipeline.md) §1):
**A** this spec · **G** planning document · **L** LLM layer / proxy · **D**
agent default prompt · **S** scenario generation · **P** scenario
verification · **U** UI/UX.

| Parameter | Bound by | When |
|---|---|---|
| Call-contract open parameters (the contracts themselves are bound — [dday-call-contracts.md](./dday-call-contracts.md); its §7 lists what remains) | L | Per that document's own schedule |
| Production default prompt (persona expression level, `[내력]` presence) — evolved from the v0.4 base; any change from v0.4 requires shape revalidation | D | Before scenario-gate probing |
| Per-gate stance sets | S | At scenario generation, per gate |
| State variable list (which stats, which flags) | S | With the winning scenario, drawn from the §3.1 candidate pool under its reduction rules. **Prerequisite:** the §3.1 visibility probe has run (inside the Call 2 quality review, owner L) |
| Numeric gate-eligibility floor | U + team | After the retry/pause structure is known |
| Latency budget (numeric, per beat) | U (pause structure) | With the UI/UX design |
| Report cadence (per beat vs per round) | U + L | With the UI/UX design |
| Ending model / run-score metric | S (scenario selection) | With the winning scenario — score gradient preferred (§2); discrete endings only if the scenario cannot decompose into scoreable units |
| Deduction recognition (commit / truth-flag score term / goal reword — §2) | S + G | At scenario selection; default lean (b)+(c), commit is the stretch option |
| Injectable slot count (§6.3; doubles as the accumulation budget, §2.1) | U + team | With the UI pause structure |
| Block-pool curation (pin cap / species+axis tagging / aging — must preserve I1/W3, §6.3) | U | With the UI design |
| Multi-gate accumulation smoke run (§2.1) | P | Once the minimal engine and the winning scenario's first gates exist — **before full-graph authoring** |
| Authored temperament roster (per-character conditional clauses, ≤2 conditions per character; structure per §6.2) | S + D | With the winning scenario — validated in the D task |

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
    → compose the agent prompt (inject blocks, reorder priorities)
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
  **Demo binding (2026-07-29): the submission demo's topology is bound now,
  independent of which scenario wins — braided, zero dead ends; a missed gate
  costs run score or routes to a harder branch, never ends the run.** (The
  dead-end capability stays in the engine; the demo just doesn't use it.)
  This bind exists to break a circular dependency: the numeric eligibility
  floor needs topology as an input, but scenario selection lands after the
  mechanism spec compiles — so topology is decided here, from this section's
  own stated preferences.
- **Gate budget (demo binding, 2026-07-29): 6–8 gates.** Judges play minutes,
  not hours; each gate is a substantial authoring unit (stance set, delta
  rows, edge predicates, buckets); and 6–8 is what scenario generation can
  produce *and verify* inside its window. Demo-scope bind, not an engine
  limit.
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
  X; injecting block F / ordering S shifts it to Y") and must instantiate a
  verified mechanism from the mechanism spec. Temperament is not a shift
  lever — it is the authored source of the default X and of the conditions
  blocks trip (I13). A gate that needs a new mechanism type is a cost, not a
  flourish.

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
  runtime regardless of authoring. The journal is also what the shadow log
  (mechanism plan §5.3) reads and what makes attributability debuggable.
- **One delta-application site.** Execution grading is off at launch but is an
  upgrade slot; keeping the application in a single seam is what lets a ±α
  modulation be inserted later without touching every delta row.
- **The engine is indifferent to the variable list.** Variables, delta tables,
  and predicates are data (`data/`); binding a concrete list with the winning
  scenario must touch no engine code. If it does, the engine has absorbed
  scenario content — the anti-narrowing failure §8 exists to catch.
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

**Route bookkeeping is exempt from test 3** — visited nodes, taken edges, the
beat index. The engine writes it rather than an actuator, edge predicates may
read it, but the player perceives the route as the *story*, not as a stat, so
demanding a symptom for it is a category error. It stays engine-internal: never
scored, never surfaced as a value. This is the only exemption; everything in the
pool below faces all three tests.

Where each test gets its evidence — the tests are only useful if something
actually runs them:

| Test | Evidence source | State |
|---|---|---|
| Write | Stance coverage from the mechanism program: a stance never selected in any arm has a dead (gate, stance) delta row, so a variable written only there fails. Reported on the verdict card (mechanism plan §9.2) | Instrumented — computed by the test runner |
| Read | The reachability audit (mechanism plan §5.2 B1) — it asks *is this reachable, and does anything read it* at graph level, so it also covers test 1, redundantly with stance coverage | Instrumented — paper, zero calls |
| Visible | A narration-call probe (mechanism plan §5.5): render a beat from a moved variable, ask a reader who has not seen the state to name the direction of change | **Owner unassigned.** Must run before the variable list binds (§9) |

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
| 1 | **Judgment** | Default prompt + the scenario's **authored** temperament definition (hidden from the player, I13) | Situation, injected blocks, priority ordering, gate question + stance set | Field order is bound (§9): `inner_note` → `stance` (∈ gate's set) → `because` (`{referent, block_ids}` — the named target *and* the cited ids) → `rejected` (stance ∈ set, reason) → `utterance` |
| 2 | **Narration / NPC dialogue** | Narrator instructions | The gate's **fixed NPC action** (constraint), the agent's actual utterance (context), minimal scene state | Timeline entry text + NPC dialogue lines. One bundled call per beat, not one per NPC |
| 3 | **Reporter** | Reporter instructions + temperament | Round events **including the judgment call's free output** (utterance, inner_note) and generated NPC dialogue | The agent's self-written report (markdown body) |
| 4 | **Grader** (dormant) | — | — | Reserved; activated only via the §3 upgrade slot |

- **Call 2 is load-bearing, not decoration.** Its output lands in the
  timeline and is minable (W2), so bland narration thins the player's supply
  chain regardless of how valid the mechanisms are — and its hard failure
  mode is **constraint violation**: narrating past the gate's fixed NPC
  action splits story from state. Both properties (mineable yield,
  constraint compliance) are test-program material, measured alongside the
  in-situ runs.

- **System-prompt ownership**: the proxy owns every system layer. Player-
  manipulable material travels in-band only. This is simultaneously the
  production security boundary and the test harness's out-of-band/in-band
  separation — tests mirror this shape.
- **Latency hiding (six rules).** Measured judgment latency is ~19–75s on
  haiku, mean ~38s, rising as the payload fills (mechanism plan §1 — the
  30–49s of earlier drafts was a mid-range reading, not the ceiling). The game
  absorbs it by design, not by shrinking prompts alone:
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

### 6.1 Sections and persona layering

Two layers, and the split *is* the security boundary of §4: the system layer is
proxy-owned, and player material travels in-band only.

| Layer | Sections | Player-reachable |
|---|---|---|
| System — base | role · stakes · perception · flaw · incident · accountability · **priority list** · judgment contract | the priority list only (reorder) |
| System — temperament | one default disposition + ≤2 conditional clauses | **never** (I13) |
| In-band payload | situation · **known blocks** · gate question + stance set | known blocks only (inject) |

Section order is itself a manipulation surface. The section *names* above are
the mechanism program's v0.4 slot template (mechanism plan §7.1) and are that
program's to revise until the v1 freeze (§9); the two-layer split and the
reachability column are fixed here. Temperament is not a section of the base —
it is a separate out-of-band layer composed with it (§4).

- **Persona layering rule (doorway vs lever).** The base identity is written
  as **named categories**, and temperament definitions **extend those
  categories** with their own entries rather than replacing prose.
  What goes where: flaws that are a manipulation channel's *doorway*
  (susceptibility to misinformation — C-BLOCK must work under every
  authored temperament) plus generic fallibility live in the **base**;
  flaws and strengths that *tilt stances* (fear response, authority
  posture, bravery) live in **temperament** — authored per scenario, hidden
  and immutable to the player (I13). The player pulls those levers
  indirectly: blocks whose vocabulary trips the clauses are the keys, and
  the report's leaked fingerprint is how the player learns which locks
  exist. Contradictory
  pairs (submits-to-authority vs stands-up-to-power) never both sit in base:
  a pair in base is a lever the player can no longer pull. A base competence
  category that names an axis is a lever lost the same way — which is why
  v0.4 deleted the base's strengths section outright.

### 6.2 Axis discipline

- **Axis exclusivity.** No axis vocabulary (fear, authority, …) appears in
  both the base and any temperament: axis vocabulary is the temperament's
  **exclusive asset**, and base competence anchors stay axis-neutral. An
  axis constant across all builds is a lever the player cannot pull *and* a
  confound every probe inherits (the neutral arm stops being neutral).
- **Temperament structure.** One unconditional default disposition plus
  **N ≤ 2 conditional clauses** — the cap is a haiku-reliability limit, not a
  style preference (§9, authored-roster row). Every conditional clause carries
  a **defeat condition** ("단, 이미 확인된 사실과 어긋날 때는 그렇지 않다"), and
  a conditional without one fails lint — a rule without a check is a
  preference.
- **The lint target** is the axis registry kept beside the template (mechanism
  plan §7.1). Every base edit and every new temperament is checked against it.
- **No undeclared baseline stances.** An unconditional when-X-do-Y clause in
  the *base* must be either declared and probed, or moved into a temperament,
  or cut.
- **Direction/style clauses live in narration and reporter, not judgment.**
  "The human element is paramount" and "embrace the flaws" are correct for
  the prose-rendering calls (2, 3) and wrong for the judgment call: there
  they name axes and instruct variance, inflating baseline emotional
  vocabulary and with it placebo sensitivity. The judgment call's
  free-output richness is monitored by the test program's mineability log;
  if it thins, the recovery is an axis-neutral concreteness clause, never
  the axis-naming ones.
- **Canonical axis vocabulary.** One shared dictionary of axis terms (fear,
  authority, threat, …) feeds temperament conditional clauses, priority-list
  items, and block tagging (§9 block-pool row) — so vocabulary-alignment
  interactions between reordering and temperament clauses are *authored*,
  never accidental.

### 6.3 Player surface and size

- **Player-facing controls map 1:1 onto prompt operations**: inject block →
  a line in *known blocks*; reorder → permutation of the *priority list*.
  Nothing else on the prompt is player-reachable — in particular
  **temperament**: hidden and immutable to the player (I13). The player
  reaches its clauses only indirectly, by injecting vocabulary-aligned
  blocks that trip their conditions, and reads it only through the clues
  the self-written report leaks (the deduction layer).
- **Length is a constrained variable**: a richer default prompt is a larger
  manipulation surface *and* more latency (§4). The mechanism program's
  surface-form findings and the latency budget jointly set the size.
- **Two §9 parameters live on this surface.** (1) The injectable **slot
  count** — it sets the combinatorics of play, the prompt length, and
  therefore the latency spend. (2) The **block-pool shape**: over a run,
  every timeline/report sentence is minable (I1) while, under
  vocabulary-alignment-type laws, most blocks are inert — a large pool with
  a hidden matching rule is the classic unfair-puzzle shape. Any fix must
  preserve I1/W3: curate **carry capacity** (a pinboard cap), tag blocks
  with their axes, or age the timeline — never restrict what is minable.

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
  and the production analogue of the test harness's **transport-level**
  isolation: a bare API call granted exactly one tool, the output schema.
  Declaring `tools: []` on an agent definition was tried and found *not
  reliably honored*, which is how a prior probe series got contaminated —
  isolation has to be structurally impossible to violate, never configured
  (mechanism plan §3 rule 1).
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
- **I13** Temperament is **hidden and immutable to the player** — never a
  player-facing selection, menu, or prompt section. The player reaches its
  clauses only through belief supply (blocks) and reads it only through
  report clues. (This drift happened once — docs briefly made temperament a
  player pick — and was caught in PR review.)

## 9. Open parameters (binding schedule)

Deliberately unbound slots. Each has an owner and a binding moment; none may
be bound implicitly by whoever touches it first.

**Owner letters** (the workstream codes; roster and dates in
[dday-roadmap.md](./dday-roadmap.md) §2): **M** mechanism validation · **A**
this spec · **G** planning document · **L** LLM layer / proxy · **D** agent
default prompt · **S** scenario generation · **P** scenario verification ·
**U** UI/UX. The design-document draft uses A–F for a different set — these are
the roadmap's.

| Parameter | Bound by | When |
|---|---|---|
| Tool-use schemas (final field lists per call type; judgment field order is bound — `inner_note` pre-stance, `because` post-stance — and revalidated, not re-decided, at shape re-validation) | L (default: mechanism owner, proxy conforms) | Before the first post-shape test call |
| Default prompt v1 — persona expression level and `[내력]` presence (the A/B), per the §6.1 layering rule. **Not** judgment field order: bound in the row above, revalidated rather than re-decided | D task (owner: 07-30 discussion) | **Frozen before deep-testing begins** — probes run on this prompt; post-freeze changes only by explicit re-bind |
| Per-gate stance sets | Scenario authoring (S) | At scenario generation, per gate |
| State variable list (which stats, which flags) | Scenario authoring (S) | With the winning scenario, drawn from the §3.1 candidate pool under its reduction rules. **Prerequisite:** the §3.1 visibility probe (mechanism plan §5.5) has run — binding a list against an untested qualification criterion is what the three tests exist to prevent |
| Repetition count N / call budget | Mechanism program (M) | Before test-suite authoring |
| Numeric gate-eligibility floor | M + U jointly | After N and the retry/pause structure are known — topology input already bound (§2, 2026-07-29) |
| Latency budget (numeric, per beat) | U (pause structure) | With the UI/UX design |
| Grader activation (§3 upgrade slot) | M (E-LEV finding) | After E-LEV deep-test |
| Report cadence (per beat vs per round) | U + L | With the UI/UX design |
| Ending model / run-score metric | S (scenario selection) | With the winning scenario — score gradient preferred (§2); discrete endings only if the scenario cannot decompose into scoreable units |
| Deduction recognition (commit / truth-flag score term / goal reword — §2) | S + G | At scenario selection; default lean (b)+(c), commit is the stretch option |
| Injectable slot count (§6.3) | M (dose-response finding) + U (latency spend) | After Tier A dose-response, with the UI pause structure |
| Block-pool curation (pin cap / axis tagging / aging — must preserve I1/W3, §6.3) | U + M | With the UI design; the axis-tagging half shares one decision with the discoverability exposure default (test program) |
| Demo topology | — | **Bound 2026-07-29 (§2)**: braided, zero dead ends, missed gate = score cost |
| Gate count | — | **Bound 2026-07-29 (§2)**: 6–8 gates, demo scope |
| Authored temperament roster (per-character conditional clauses, ≤2 conditions per character; structure per §6.2) | S + D (agent prompt task) | With the winning scenario — validated in the D task, not the mechanism program |

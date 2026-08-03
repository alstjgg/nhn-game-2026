# Plan — Game Design

> **Tier:** `plan-` — this is the design intent: what the game is, what it is
> for, and what it must feel like. It is **not** the authority on mechanics.
> Where a mechanic is settled, this document points at the document that settles
> it and does not restate it.
>
> **Owner:** 윤석. **Written** 2026-08-02 from
> [`planning/dday-design-doc.md`](../planning/dday-design-doc.md) (the archived
> 07-29 기획서), corrected against every decision taken since.
>
> **Do not settle these here:** invariants and the core technology →
> [`spec-architecture.md`](./spec-architecture.md) · call payloads →
> [`contract-calls.md`](./contract-calls.md) · state, beats, routing →
> [`spec-engine.md`](./spec-engine.md) · scenario content →
> `data/scenario/우는다리/draft.md`.

## 1. One-page summary

| | |
|---|---|
| Title | D-Day 시뮬레이션 |
| Genre | Text detective × AI-agent build simulation |
| Scenario | 「테러리스트의 전화 — 우는다리」, single scenario (§5) |
| Platform | Web (TypeScript, desktop browser, GitHub Pages) |
| Primary audience | NHN AI Game Competition judges — ~1s load, the first 60 seconds decide it |
| Session shape | One run of several minutes (estimated — real latency unmeasured) × repeated; runs remaining is an in-game resource |
| Runtime model | haiku (judgment, narration, and reporter calls alike) |
| Team / deadline | 2 people / submission **2026-08-10** |

**Pitch.** You are the engineer who shapes the AI agent that will sit in the
crisis room. At 08:50 the private direct line rings — the one who picks up is not
you but **the mind you built**, and all you can do is watch it judge. When it
fails you read its report, repair its mind, and send it into the same morning
again.

**Three lines that define the game:**

- A game about **prompting** an agent until it can succeed at one task
- A **detective** game about uncovering the incident's hidden truths
- You do not steer behavior — you inject 'facts' extracted from the two reports
  to **change the agent's judgment**

**Differentiator.** Repeat-entry structures are common (Source Code, Edge of
Tomorrow, 12 Minutes), but no game edits *the protagonist's mind rather than the
protagonist's actions*. Instead of wrapping an LLM in a game, it exposes
prompt · context · agent as the literal vocabulary — in a competition where AI
orchestration is itself judged, the game concept and the tech stack point at the
same thing.

**Fiction frame.** A world with a catastrophe already scheduled. The player is
the officer responsible for disaster preparation, repeatedly sending an AI agent
into a simulation that reconstructs the catastrophe. Succeed in simulation and
the real D-Day follows — a single untouchable live run. The UI's D-Day counter
(= runs remaining) keeps the frame permanently visible.

## 2. Design pillars and non-goals

Every design judgment is tried against these three. When they conflict, the
higher one wins.

1. **Do not steer — make it believe.** The player neither clicks the agent's
   actions nor types to it. They pick sentences the simulation produced and
   inject them to change the agent's *beliefs*, and changed belief changes
   judgment. (The membrane — a repo hard rule.)
2. **Losing is content.** Every failure leaves material (sentences) for the next
   build. Every failure scene must support the question "which sentence caused
   this?", and a run that got further mines deeper sentences.
3. **Two layers of truth.** The gap between the objective log (the engine's
   facts) and the self-written report (the agent's interpretation) is
   information, comedy, and the object of deduction at once. They are never
   merged into one omniscient record.

**Non-goals — deliberately not built:**

- Free-text player input, in any form (the membrane)
- Spatial movement or graphical simulation — the agent never takes a step; the
  map is a switchboard, not a city
- LLM-driven NPCs — NPCs are a state machine plus authored lines
- Simulating a whole run in one LLM call — a rejected architecture
- Compact (sentence synthesis) and token-budget puzzles — **Phase-2**, out of scope
- Real-time action or timing manipulation — watching is watching

## 3. Game flow and core loop

One play is the process of completing the agent across repetitions of the same
day (08:50 → 21:04).

```
[start] you inherit a flawed new agent's file
   ↓
① BUILD    — place mined sentence blocks into the file (no typing)      §4.1
   ↓
② WATCH    — deploy into the simulation. Live, no intervention          §4.4
   ↓
③ AUTOPSY  — compare the two reports, deduce the cause of failure,      §4.5
             and mine the sentences for the next build                  §4.2
   ↓
   back to ① … one run costs one resource (runs left = D-Day counter)
   ↓ success threshold reached
[ending] the real D-Day — a single untouchable live run                 §4.6
```

**The player holds exactly one control, and one thing is withheld.**

| Lever | Who holds it | What it is in the game |
|---|---|---|
| **Facts** | the player | Injecting mined sentences as blocks — turning temperament conditions on and off |
| **Temperament** | the author (invisible to the player) | The agent's way of judging. The material of level design |

> ⚠️ The 07-29 design doc listed a third lever — **reordering the priority
> list**. That channel is dead: C-STRUCT was terminated on 07-31 after 7
> configurations and 180 valid responses showed no effect in the target
> direction. There is no reorder actuator, no delta row, and no UI element. The
> `[우선순위]` *section* of the default prompt is retained as a proxy-authored
> constant the player cannot reach — a section and a channel are different
> objects ([`contract-calls.md`](./contract-calls.md) §7-8).

**The central drama:** temperament is invisible and unfixable. The player deduces
it from clues that leak into the report, then injects facts aimed at its
conditions to tip the judgment. Injecting an unverified guess tips the branch the
wrong way — contamination is a mechanic, not a flourish.

## 4. Systems

The world runs on a deterministic engine; the LLM is called only at authored
judgment points. The player cannot address the LLM directly and influences it
only through the agent's prompt.

**Canonical sources for this section.** The prompt's section structure and the
two-layer split: [`spec-architecture.md`](./spec-architecture.md) §6. The three
calls: [`contract-calls.md`](./contract-calls.md). State, beats, and routing:
[`spec-engine.md`](./spec-engine.md).

### 4.1 The agent's prompt — and the one part the player touches

The prompt has two layers, and the split **is** the security boundary: the proxy
owns the system layer, and player-composed material travels in-band only.

| Layer | Contains | Player-reachable |
|---|---|---|
| System — base | role · stakes · perception · flaw · incident · accountability · priority list · judgment contract | **none** |
| System — temperament | one default disposition + ≤2 conditional clauses | **never** (I13) |
| In-band payload | situation · **known blocks** · gate question + stance set | **known blocks only** |

So the player's whole operation is: **put a mined sentence into `known blocks`,
or take it out.** No typing, no section editing, no reordering. This is narrower
than the 07-29 doc described, and the narrowing is the settled result of the
mechanism program — a single channel, measured to work.

The injectable slot count is an open parameter bound with the UI pause structure
(architecture spec §9).

### 4.2 Sentence mining

There is no separate card system — the sentences of the two reports and the
timeline *are* the currency.

**Everything generated is minable.** Any sentence from the timeline or from the
agent's self-written reports can be taken: fact statements, emotion descriptions,
NPC quotes, the agent's own self-narration. Fact statements are one *species* of
block, not the definition of the unit (invariant I1).

**Certification is a separate axis from minability.** Everything is minable, but
a gate may only *require* certified species (`사실` / `자기서술`). This is what
keeps deduction from becoming a lottery while leaving the vein wide.

**Mining takes an authored sentence identity, not screen text.** The screen shows
the report's phrasing; what enters the prompt is the vocabulary-aligned canonical
form. The membrane holds either way.

**A guess is a gamble.** Once equipped it is treated as true. Right, it is a
shortcut; wrong, it is contamination. Spending a run on hypothesis testing rather
than survival — a scouting run — is a valid strategy.

### 4.3 Temperament — invisible internal logic

- **Form:** not mood adjectives but prose containing a **conditional judgment
  procedure**. "A is the default. But when things *appear* to be condition C,
  risk B." Conditions attach to the agent's perception, not to the truth.
- **Cap:** ≤2 conditional clauses per character — a haiku reliability limit, not
  a style preference. Every clause carries a defeat condition.
- **Invisible and immutable.** There is no character sheet and no reveal system.
  The self-written report leaking temperament clues is the only observation
  channel.

The authoring laws that make this work — axis-vocabulary alignment, axis
exclusivity, no undeclared baseline stances — are measured rules, and they live
in [`spec-architecture.md`](./spec-architecture.md) §6.2 and
[`scenario/scenario-generation-guide.md`](./scenario/scenario-generation-guide.md).

### 4.4 The world engine and gates

The world advances deterministically; branching happens only at gates, and the
branch is chosen by the agent the player shaped. Between gates events are
scripted; what varies between runs is which edge is taken and what generated
surface (utterances, NPC dialogue, reports) covers it.

Full state model, beat and round boundaries, ordering rules, routing vocabulary,
and behavior on call failure: [`spec-engine.md`](./spec-engine.md).

### 4.5 The two reports

At the end of each round the agent leaves an **objective log** (`facts`) and a
**self-written report** (`report_body`). Pillar 3 lives here: the gap between
them is the deduction surface, and merging them destroys the game.

The report is where temperament leaks. That leak is not a defect — it is the only
way the player can learn which locks exist.

Schema, field order, and the record-keeping contract:
[`contract-calls.md`](./contract-calls.md) §4.

### 4.6 Score, run resource, ending

- **Score is a gradient, not a pass/fail.** The scenario's `score.json` defines
  the units, which gates each unit attributes to, the no-intervention baseline,
  and variance notes. For 우는다리 there are 8 units, spanning who survives, whose
  name is cleared, and whether the bridge's defect is ever officially
  established — so **the same total can be a different story**.
- **Attributability is the requirement.** Every score outcome must trace back to
  a judgment; an outcome with no cause is a bug (architecture spec §2). This is
  what the delta journal exists for.
- **Runs are the resource.** Days remaining until D-Day = runs remaining, shown
  permanently in the UI. Total run count is a tunable, in data, value undecided.
- **Ending:** on success, the real D-Day — a single untouchable live run. The
  agent you built performing solo, unedited (a candidate climax for the judging
  video).
- **Open:** the success threshold for entering the live run, and what happens if
  the player exhausts their runs without succeeding (an unprepared agent being
  sent in anyway is the fiction-natural candidate). Score `predicates` in the
  pack are a hardening leftover.

### 4.7 LLM architecture

- **Model:** haiku for all three calls. **Path:** client → proxy backend → model.
  No key is ever embedded in the client.
- **Role isolation is enforced by the execution environment, not by prompt
  wording.** The proxy owns every system layer; the client sends only structured
  game elements. Output is forced through tool-use schemas.
- **Latency is absorbed by design**, per the six rules in
  [`spec-architecture.md`](./spec-architecture.md) §4: deterministic events
  render instantly · gates are known ahead so the next call prefetches during
  reading time · waiting is diegetic · the longest call hides behind the tally
  screen · the report plays into a **client-driven typewriter** replaying a
  completed response · mid-action play never blocks on a call.

> ⚠️ The 07-29 doc specified **SSE streaming** for the report. That is superseded.
> The deployed path (API Gateway → Lambda → Bedrock Converse) buffers responses,
> so streaming would require a different transport. The client typewriter is
> visually equivalent but **cannot absorb time-to-first-token**, which makes the
> tally screen load-bearing for the whole generation rather than just the first
> token ([`contract-calls.md`](./contract-calls.md) §7-6).

**The latency budget is not yet a number.** Earlier figures timed subagent
round-trips and are withdrawn; production-payload measurement is blocked on the
engine landing.

## 5. Content — the scenario

**The scenario is data, and the data is the authority.** Read
**`data/scenario/우는다리/draft.md`** for characters, hidden truths, gate cards,
the fixed timeline, places, and the score table. Nothing in this section is
normative; it exists so a reader knows what kind of thing the scenario is before
opening it.

「테러리스트의 전화 — 우는다리」 (selected 08-01, replacing the earlier
「테러리스트의 전화」 draft the 07-29 doc described).

| | |
|---|---|
| Logline | On the morning of a new footbridge's opening ceremony, the crisis room's private direct line takes a call: "tonight, many people die at the river." While the whole city hunts a terrorist, what the man on the phone is hiding is not a bomb but a truth dismissed fourteen times on paper. Fail to uncover both the caller's identity and the nature of the disaster, and at 21:04 the bridge collapses under eight hundred people without a single explosion |
| Clock | 08:50 → 21:04 |
| Shape | 7 characters · 5 hidden truths · **7 gates** (G1 09:25 → G7 20:10) · 19 fixed events · 4 places · 8 score units |
| Pack status | lint ERROR 0, G1–G7 hardened. See [`handoffs/datapack.md`](./handoffs/datapack.md) |

Two properties matter to the design: **every gate's resistance comes from people**
(evasion of responsibility, concealment, livelihood) rather than from the
disaster, and **repeat runs unlock hidden truths, one of which inverts the goal
itself** — the moment it emerges that 21:04 is not a time an attacker chose, the
objective shifts from *prevent* to *empty*. The hook belongs to the first 60
seconds; the reversal is the reward of a later run.

## 6. UX/UI

Three screens, one per beat of the loop. **Owner: 민서 (claimed 2026-08-03,
minimal-first — see status.md); this section is the brief that track
inherits.** The forthcoming UI/UX spec & contract document becomes the
implementation SSoT; until it lands, this section stands.

| Screen | Contents |
|---|---|
| **Build** | The agent's file (sectioned document) + the mined-sentence store. Block operations only — into a slot, out of a slot |
| **Watch** | Not character art but **a document writing itself.** The timeline log types out one line at a time on the game clock's rhythm, with the agent's radio and phone utterances arriving between. Untouchable |
| **Autopsy** | The two reports side by side + an **evidence-board UI** — tearing a sentence out of a report into the store is the physical sensation of mining |

- Always visible: the D-Day counter (runs remaining) and the current time /
  countdown to 21:04.
- **Every prop is a document**: rosters, timeline logs, the self-written report,
  radio transcripts, manuals, press clippings. **Art direction: typography and
  document art** (stamps, red lines, redacted rosters).
- **Designed powerlessness.** The "you need to go left *now*!" helplessness during
  Watch converts into the tactile pleasure of repairing the prompt on the Build
  screen.
- **The judge's experience.** Page load ~1s (static deploy, minimal assets). The
  demo starts **on run 3**, not run 1 — some mined sentences already exist, so the
  first 60 seconds can show "insert a sentence → the judgment changes".
- **Session-scoped persistence.** Progress (mined sentences, unlocked truths,
  runs remaining) lives in `sessionStorage` — a refresh does **not** reset it,
  closing the tab does (physical §1.1, 08-03). A stray F5 mid-play would
  otherwise destroy the multi-run loop, while a judge returning to the page
  still gets a clean start on run 3.

Two open parameters live on this surface and are bound with the pause structure:
the injectable slot count, and block-pool curation (pin cap, species/axis
tagging, timeline aging). Any curation scheme must preserve I1 and W3 — it may
limit **carry capacity**, never what is minable (architecture spec §9).

## 7. Scope and risk

Work is organized as three tracks — data (민서) · architecture (윤석) · client
(unassigned) — with owners and deliverables in
[`plan-pipeline.md`](./plan-pipeline.md) §1. That structure replaces the
workstream/roadmap tables of the 07-29 document; current sequencing lives in
[`status.md`](./status.md).

| # | Risk | Status / response |
|---|---|---|
| 1 | **Scenario density is the whole game.** Does density on paper become density in play? Thin, and the player looks for a skip button by run 3 | The largest risk. Only measurable in play. The policy-bot metrics (plan-pipeline §4) are the instrument: policy gap ≈ 0 means the pack is brute-forceable |
| 2 | **The client track is single-threaded on a non-specialist** — claimed by 민서 (08-03), no frontend developer or designer on the team | Downgraded from "no owner". Response: two-phase minimal-first plan (status.md) — Phase 1 is an unstyled engine-verification UI; the beat-granularity answer unblocks with its pause structure |
| 3 | A 30–60s spectacle video for a text detective game | Typography/document art direction is a separate task. The live-run ending is the climax candidate |
| 4 | Real API latency and cost unmeasured at production payload | Blocked on the engine; measured the moment engine spec §7 criterion 1 passes |
| 5 | C-BLOCK is adopted but **not fully verified** — placebo control, program-wide negative control, and blind coding remain | External phrasing stays at "the mechanism with the strongest measured evidence to date". Only the placebo control directly affects the game |

**Phase-2 backlog** (out of demo scope, deprioritized by decision):

- **Compact / synthesis** — pick two sentences and ask the agent, producing a
  realization sentence (selection + button, still no typing)
- **Token-budget puzzle** — per-section token costs against a total budget, with
  Compact's detail loss visible in behavior

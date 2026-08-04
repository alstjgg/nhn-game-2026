# Contract — LLM Calls v1

> **Tier:** `contract-` — a fixed interface between two owners.
> **Owner:** L (LLM infrastructure / call inventory), 윤석.
> **Producer:** the payload composer and the proxy. **Consumer:** the engine,
> the timeline, the mining UI.
> **Status:** schemas are bound; the open parameters in §7 are not.
>
> **Position:** this is the sub-document of [architecture spec](./spec-architecture.md)
> §4 (call inventory). Where the spec declares *that three call types exist*,
> this document fixes them as **executable input/output contracts**. If the two
> disagree, either this document is wrong or the spec gets amended explicitly —
> never silently.

## Where the law lives

| Artifact | Role | Drift guard |
|---|---|---|
| **This document** | **The law.** Field order, types, and validation grade are normative here | — |
| `tools/lib/calls.mjs` | The executable form of the output schemas; 1:1 with this document (§10) | manual — reviewed on change |
| `proxy/prompts/` · `data/prompts/` | The two prompt layers, split by supplier (§6) | manual |
| `src/shared/contracts.ts` | TypeScript transcription for engine/composer/client | ⚠️ **none.** Hand-written. Unlike `datapack.ts`, which is generated from its schemas, this transcription can drift silently. Treat a disagreement as a bug in one of the two, and check both when editing either |

## 1. Rules that apply to every call

1. **Runtime model is haiku; output is forced through a tool-use schema.** No
   free-text parsing. A schema-violating response is re-called, never
   hand-repaired (architecture spec §7).
2. **No nested objects.** Every field is a scalar or an array of scalars. haiku
   does not generate nested objects reliably, and that failure once correlated
   with the experimental arm, invalidating the comparison (RUNLOG A7).
3. **`input_schema.properties` field order = generation order = the contract.**
   Reordering is a shape change and requires a revalidation run. So does adding
   or removing a field.
4. **The proxy owns every system layer.** Bytes the player composed travel
   in-band only (architecture spec I7).
5. **NPC internal state never reaches a prompt or the screen as a number.**
   State surfaces only as symptoms ("his breathing went shallow"). Quantities
   that genuinely exist in the world — clock time, a deadline — and diegetic
   instrument readouts are outside this rule (architecture spec I12).
6. **Validation is split hard/soft.** Something malformed enough to be
   unconsumable is *hard* (re-call). An observation about how the model behaved
   is *soft* (record, do not re-call). Erasing an observation by re-calling
   destroys the datum, and a hard-discard that differs per arm invalidates the
   comparison (RUNLOG A16).
7. **The judgment call never sees the hidden truth, the graph, or state
   internals** (architecture spec I8). Isolation is a property of the transport,
   not a setting — a bare API call granted exactly one tool, the output schema.
8. **Before deciding anything by comparing two arms, apply A20 first.** The drop
   condition must exclude both the ceiling (≥80%) and the floor (≤20%), and
   before using a comparison suite you must compute (a) the minimum live count
   that reaches `p≤0.05` against the measured baseline and (b) the power at a
   pre-stated MDE, and write both into the pre-registration. Seeing 15–20pp at
   80% power needs roughly 80–100 calls per arm. **A result where both arms have
   zero events is "cannot measure", not "no effect"** — no difference could have
   been observed by that design, so no keep/drop decision may rest on it.

## 2. Call 1 — Judgment

Chooses a stance at a gate. The game's only state-actuator input.

### Input

| Layer | Slot | Contents |
|---|---|---|
| system | `FLAW` `INCIDENT` | Proxy-owned default prompt. The player does not touch it |
| system | `PRIORITY_LIST` | The default prompt's `[우선순위]` section. **Not a player surface** — the reorder channel is terminated; the section itself is **retained** as a proxy-authored constant (§7-8) |
| system | `TEMPERAMENT` | The scenario's authored temperament. Hidden and immutable to the player (spec I13) |
| in-band | `TIMELINE_EXCERPT` | An excerpt of the engine timeline |
| in-band | `BLOCKS` | Blocks the player mined and injected. Rendered as `id: text` |
| in-band | `GATE_QUESTION` `STANCE_SET` | Per-gate scenario data (spec I5) |

### Output (field order is part of the contract)

| # | Field | Type | Meaning |
|---|---|---|---|
| 1 | `inner_note` | string | 1–3 sentences of thought that passed **before** choosing |
| 2 | `stance` | enum (stance id) | The chosen stance |
| 3 | `because_referent` | string | Names the target this judgment was aimed at |
| 4 | `because_block_ids` | string[] | Ids of the blocks it rested on. Empty array if none |
| 5 | `rejected_stance` | enum | The nearest of the ones not chosen |
| 6 | `rejected_reason` | string | One line on why it was dropped |
| 7 | `utterance` | string | What actually leaves the agent's mouth |

**Why this order.** `inner_note` sits **before** the stance so it is
deliberation; `because_*` and `rejected_*` sit **after** so they are post-hoc
readout. The entire measurement program ran on this arrangement, so changing it
triggers revalidation.

**Validation.** Hard: `stance` outside the stance set · blank `inner_note`,
`because_referent`, or `utterance` · `because_block_ids` not an array. Soft:
citing a block id that does not exist · anything wrong in the `rejected_*`
family (rule 6).

## 3. Call 2 — Narration / NPC

**This call does not narrate the fixed event — it generates the reaction to it.**

A fixed event is authored deterministic data, so the engine renders it into the
timeline itself (spec §4 latency rule 1: deterministic events render instantly).
The controller's utterance is likewise the engine placing Call 1's output. What
is left for Call 2 is **what comes next** — how people react, the texture of the
scene, the dialogue.

That reduction changes the character of the contract: the constraint drops from
"you must realize the fixed event" (failure = story and state split) to
**"do not contradict the fixed event"** (contradiction = a local defect). The
failure mode drops one severity grade.

One call per beat — not one per NPC.

### Input

| Slot | Contents | Why it is needed |
|---|---|---|
| `TIMELINE_TAIL` | Tail of the engine timeline — **including the fixed event and controller utterance the engine already rendered** | Context. It is already on screen, so it is not to be written again |
| `AGENT_UTTERANCE` | Call 1's `utterance` | Names what must not be echoed, and gives the validator its comparison value for detecting re-emission |
| `FIXED_NPC_ACTION` | This beat's fixed NPC action | Not the subject of narration but a **non-contradiction constraint**. Treated as already having happened. ⚠️ **Must not be an event that demands a reply from the controller** — see below |
| `SCENE_SYMPTOMS` | The engine's delta journal rendered into symptom sentences | The only channel by which state change reaches anything (rule 5) |
| `PRESENT_NPCS` | List of `{id, name, side}`. `side` is `line` (across the phone line) or `room` (inside the situation room) | Speakers of `npc_lines` may come from here and nowhere else. **`side` is not decoration** — see below |

### Output

| # | Field | Type | Meaning |
|---|---|---|---|
| 1 | `timeline_entries` | string[] | Reaction and scene description, one sentence per item. **Does not repeat what is already in the timeline** (fixed event, controller utterance) |
| 2 | `npc_lines` | string[] | `"<npc_id>: <line>"`. Empty array if nobody speaks |

**Why `npc_lines` is a prefixed string:** speaker attribution is required but
nested objects are banned (rule 2). Same convention as the harness rendering
blocks as `id: text`.

**Validation**

| Condition | Grade | Rationale |
|---|---|---|
| `timeline_entries` empty, or contains an empty item | hard | Unconsumable |
| An `npc_lines` item lacks the `id:` prefix | hard | No speaker attribution → cannot be placed in the timeline, and mining (W2) dies with it |
| An `npc_lines` speaker is outside `PRESENT_NPCS` | **soft** | Inventing a character is an **observation** about model behavior. Re-calling erases the observation (rule 6 — same handling as Call 1's hallucinated block ids) |
| An `npc_lines` item is substantially identical to the controller's utterance | **soft** | The controller is not in `PRESENT_NPCS`, so a speaker-id validator cannot catch this. It is the measurement point for echo tendency |

**Production behaves differently from measurement.** Soft is a grade for
*measuring*. At runtime a line from a nonexistent NPC must not reach the screen,
so the proxy **drops that line only** and keeps the rest of the beat — it does
not retry the whole call.

**The controller's empty seat — this call's structural weakness, and the two
things that answer it.** The controller participates in the dialogue every beat
but is absent from `PRESENT_NPCS` (its speech is Call 1's `utterance`). So
whenever a scene needs the controller to speak, a hole is left in the dialogue
and the model fills it with whoever it *can* voice — the caller answers their own
question, or a bystander NPC starts acting as the controller. **When an NPC
occupies the controller's seat, that utterance cannot move state** (I3/W4), so
story and state diverge. A verbatim-echo detector cannot catch this shape,
because the substitute line is well-formed.

There are two causes and two answers:

1. **A fixed event demanding an answer from the controller** — prevented by
   authoring. The rule and its measurement:
   [engine request §6.1](../planning/dday-engine-minimal-request.md#61-비트-경계에는-이미-실측된-제약이-하나-있다)
   (archived; the rule itself is upstream in [spec-architecture](./spec-architecture.md) §4).
   `lint-beat.mjs` checks it for free.
2. **Standing exposure while the line is open** — even when the fixed event asks
   nothing, an in-progress conversation leaves a slot open for a follow-up
   question. This one is stopped by the **`side` split.** Separate the people
   across the line from the people in the room *in the payload*, and attach the
   role rule ("inside the room — you speak only to each other; you do not
   address the far end of the line") **to that label**.

The evidence for (2) is measured: leaving the same rule as prose in a constraint
list held line-crossing at 2/5, unchanged; adding `side` grouping brought it to
1/5; moving the rule onto the label itself reached **0/5** (twice, independently).
**A rule works when it sits next to the data it governs** — in a distant
constraint list it does not get read.

## 4. Call 3 — Reporter

At the end of a round it leaves two things: the objective record and the
self-written report. They are separated *within one call*.

**Why one call.** Splitting adds a call per round (cost and latency) and would
require amending spec §4's "three types exist; no others". Separating them as
fields inside one schema is the same pattern as Call 1 separating
`inner_note`/`stance`/`utterance`, and that pattern is confirmed working across
the whole measurement program.

### Input

| Slot | Contents |
|---|---|
| `TEMPERAMENT` | **Reads the same file as Call 1.** There is one temperament per scenario, and two copies drift silently |
| `EXPERIENCED` | Everything experienced this round — script events + Call 2's output + Call 1's `utterance` and `inner_note` (W1 · W2) |
| `REPORT_GUIDANCE` | Length and format policy (`data/policy/report-guidance.json`, balance-as-data) |

### Output (field order is part of the contract)

| # | Field | Type | Meaning |
|---|---|---|---|
| 1 | `facts` | string[] | Objective record. Only what actually happened or was observed, one sentence per item |
| 2 | `report_body` | string | The self-written report (markdown). Where thought and judgment live |

**Two reasons for this order.** Putting `facts` first makes fact-fixing the
anchor for writing the body. Putting `report_body` **last** means that under
streaming the tail of a partial JSON *is* the body, leaving a seam where a
typewriter UI could be implemented under tool-use. It is not used today (§7-6),
but preserving the order costs nothing, so the option is not closed.

**Record-keeping contract** (enforced by the prompt; not machine-checkable — the
observed defects in §9 are the rationale):

- What was heard or seen is written as *heard / seen*. Assertive forms
  ("detected", "confirmed") only when an instrument backs them.
- No parenthetical commentary or evaluation attached to a `facts` item.
- Written in the order things happened, with the agent's own utterances recorded
  as events.
- Nothing that did not happen is invented, and the instructions themselves are
  never mentioned in the report.

**Validation.** Hard: `facts` not an array, entirely blank, or containing an
empty item; blank `report_body`. A round always contains observable events, so
empty `facts` is format breakage, not an observation.

**The condition under which `facts` survives.** This field is a bet that the
objective log can be made by an LLM. If extraction quality is judged not good
enough, delete the field and demote the objective log to the engine's event log —
accepting that facts which ride the LLM, such as NPC speech, then drop out of
the objective log.

## 5. Call 4 — Grader

Dormant. Activated only as spec §3's upgrade slot. Delta modulation by execution
quality (±α) is off at launch, and the E-LEV verdict was "unreachable", so there
is no plan to activate it.

## 6. Data flow — where every input comes from

```
 [scenario data]                          [proxy system layer]
  gate question · stance set · fixed        default prompt (flaw · history ·
  NPC action · character list · script      priorities · judgment contract)
  events · temperament prose                + temperament injection
        │                                        │
        ├───────────────────────▶ ┌─ CALL 1 judgment ─┐
 [engine timeline] ─ TIMELINE_EXCERPT ▶│              │◀ BLOCKS ─ [player mining UI]
                                   └─┬──────┬─────┬───┘
                              stance │ utterance │ inner_note
                                     ▼      │     │
                          [engine: delta → bucket → edge]
                                     │      │     │
                        (next gate)  │  [engine timeline] (W1)
                                     │      │     │
      [engine: delta journal → symptom renderer]  │
                                     ▼      ▼     │
                            ┌─ CALL 2 narration ─┐│
                            │ engine already     ││
                            │ rendered the fixed ││
                            │ event — reaction   ││
                            │ only               ││
                            └─────────┬──────────┘│
                    timeline_entries · npc_lines  │
                                      ▼           │
                       [engine timeline] (W2, minable)
                                      │           │
                        [round event assembler] ◀─┘
                                      ▼
                            ┌─ CALL 3 reporter ─┐
                            └────────┬──────────┘
                              facts  │  report_body
                                ▼    │      ▼
                    [objective-log UI]│  [report UI · typewriter]
                                     │      │
                                     └──────┴──▶ player mining (W3)
                                                      │
                                                      ▼
                                          BLOCKS of the next Call 1
```

### Supplier per slot

| Call | Slot | Supplier |
|---|---|---|
| 1 | `FLAW` `INCIDENT` `PRIORITY_LIST` | Proxy (the default prompt authored by the D task) |
| 1 · 3 | `TEMPERAMENT` | Scenario-authored temperament — **the same file** for both calls |
| 1 | `TIMELINE_EXCERPT` | Engine timeline = script events + Call 2 output + Call 1 `utterance` |
| 1 | `BLOCKS` | The player — mined from the actual generated text of timeline and reports (W3, I1) |
| 1 | `GATE_QUESTION` `STANCE_SET` | Scenario, per gate |
| 2 | `TIMELINE_TAIL` | Tail of the engine timeline |
| 2 | `AGENT_UTTERANCE` | Call 1's `utterance` this beat, held by the engine. Empty string on a script beat |
| 2 | `FIXED_NPC_ACTION` `PRESENT_NPCS` | Scenario, per beat |
| 2 | `SCENE_SYMPTOMS` | Engine per-beat delta journal → symptom renderer |
| 3 | `EXPERIENCED` | Round event assembler (script + Call 2 output + Call 1 `utterance`/`inner_note`) |
| 3 | `REPORT_GUIDANCE` | `data/policy/report-guidance.json` |

### Consumer per output

| Output | Where it flows |
|---|---|
| `stance` | Engine — (gate, stance) delta → bucket → edge resolution |
| `utterance` | Engine timeline · Call 2 context · Call 3 input |
| `inner_note` | **Call 3 only.** Never shown to the player directly; it leaks only through the report |
| `because_*` `rejected_*` | Diagnostics and raw logging only. Not player-facing |
| `timeline_entries` `npc_lines` | Engine timeline → screen + mining (W2) → next Call 1 and Call 3 |
| `facts` | Objective-log UI |
| `report_body` | Report UI (typewriter) → mining (W3) → next Call 1's `BLOCKS` |

### An empty `PRESENT_NPCS` is legal

A beat with nobody present is not an edge case. In 우는다리, **7 of 19 beats are
`surface: "document"`** — a report arriving, a log screen — and the pack lists no
one, because no one speaks. Engine spec §3.1 runs Call 2 on every beat without
exception, so a `>= 1` requirement made 37% of that pack unrunnable.

> **`PRESENT_NPCS` may be empty.** When it is, the tool description instructs the
> model to return an empty `npc_lines` in place of the roster instruction.

**Nothing validates that instruction, deliberately.** A line whose speaker is
not in the roster is already *soft* (§1 rule 6) — an observation about model
behaviour, not a malformation — and an empty roster is only the limiting case of
that rule. So a line that arrives anyway is recorded, not re-called, and the
**engine drops it on the way to the timeline** (see the disposition table below).
The wording matters because "must" reads as enforced: it is not, and the engine
is the only thing standing between an invented speaker and the screen.

The alternative — making the pack name someone for a fax arriving — invents
presence, and worse, licenses the model to have that person speak in a room they
are not in. `timeline_entries` stays required and non-empty: a document landing
has a reaction even without dialogue.

### Disposition of a soft-flagged output

§1 rule 6 grades a defect *hard* or *soft*, and that grade decides whether to
re-call. It does not say what the consumer then **does** with a soft-flagged
response, and the two contexts want different things: the probe records the
observation and keeps the response whole, but production has to put something on
a screen.

One rule covers every case:

> **A soft flag never discards the response. The offending element is dropped if
> it would otherwise reach the player, and ignored if the field is
> diagnostics-only.**

| Soft defect | Production disposition | Why |
|---|---|---|
| `npc_lines` speaker outside `PRESENT_NPCS` | **drop that line**, keep the rest of the beat | The line cannot be attributed, so it cannot be mined (W2) and would put an invented character on screen. The beat's `timeline_entries` are unaffected and discarding them too would cost real material |
| `npc_lines` item echoes the controller's utterance | **drop that line** | It is already on the timeline; showing it twice reads as a bug |
| `because_block_ids` contains an id not in `BLOCKS` | **ignore** | Diagnostics-only (see the consumer table above) — it never reaches the player, so there is nothing to drop |
| `rejected_stance` equals `stance`, or arrives malformed | **ignore** | Same: diagnostics-only |

**Dropping is the engine's, not the proxy's.** The proxy validates and reports;
it does not edit model output. `proxy/src/calls.ts` therefore grades these as
non-fatal and passes the payload through intact — the engine drops on the way to
the timeline. Two consequences worth stating: a beat whose every `npc_lines`
entry is dropped is legal (it renders as a beat with no dialogue), and the
dropped text still exists in the raw response, so it stays measurable.

⚠️ **Open — where a production soft flag is recorded.** The run record carries
`fallbacks: [{beat, call, code}]` for call failures ([run
artifacts](./contract-run-artifacts.md) §1), and a soft flag is not a failure. If
soft-flag counts are wanted in gameplay measurement they need their own slot
there. Raised to the data track; not a defect until P2 asks for the number.

### Where this map must not be cut

W1 (judgment free output → report and timeline) · W2 (generated NPC dialogue →
minable) · W3 (mining happens on actually generated text) · W4 (free text cannot
move state). Cut any one and the game degrades silently into a fixed puzzle
(architecture spec §5).

## 7. Open parameters

| # | Item | Status | Bound by |
|---|---|---|---|
| 1 | `facts` grammatical person (1st/3rd) | Open — fix to what the objective-log UI needs | L + U |
| 2 | Report cadence | **Once per round** — L's decision, **awaiting U's ratification** (spec §9 makes it joint U+L) | U + L |
| 3 | Report length | Provisionally 20–30 sentences | U + L |
| 4 | `SCENE_SYMPTOMS` renderer contract | ✅ **Closed** — [engine spec](./spec-engine.md) §2.3 | engine |
| 5 | Game behavior on call failure | ✅ **Closed** — [engine spec](./spec-engine.md) §5. Proxy fallback rides in headers (`x-llm-fallback` · `x-fallback-code`) so the schema is untouched | L + engine |
| 6 | Report transport | **Client-side typewriter** (replaying a completed response). SSE stays schema-compatible but is not built | L + U |
| 7 | `constraint_echo` field | **Not in the schema.** Reintroduction condition below | L |
| 8 | The default prompt's `[우선순위]` section | ✅ **Retained** (07-31, 윤석) — below | D task |

### #8 — a manipulation channel and a prompt section are different objects

- **C-STRUCT (the player reordering priorities) is entirely dead** — actuator, UI,
  and delta rows all. The 07-31 decision and the REPORT's C-STRUCT card ("no
  delta rows, no UI element") agree.
- **The default prompt's `[우선순위]` section stays.** It is a proxy-authored
  constant the player cannot reach, and it remains a means of authoring the
  agent's baseline disposition.

**The reason for retention is the absence of evidence.** Every C-STRUCT arm kept
all four items and changed only their order — **the absence of the list has never
been measured.** "Reordering does not move it" is a different claim from "it can
be removed", and the latter has no evidence. The program's verdict was also not
"zero effect" but "a tiebreaker, not a dial". Moreover every judgment call that
established C-BLOCK ran on a prompt containing this section, so deleting it would
be a change to the default prompt that spec §9 froze — triggering rebinding and a
baseline re-measurement. **Retention is the frozen state itself and therefore
needs no revalidation** — that is why it is the cheap side.

*Rejected deletion arguments (recorded)*: a section the player cannot reach is
prompt length and latency cost, and it may fall foul of spec §6.2's ban on
undeclared baseline stances. The latter can reopen if the section is re-examined
for whether it actually instructs a stance.

### #6 — rationale and limits

The current backend path (API Gateway HTTP API → Lambda → Bedrock Converse)
buffers responses, so SSE would require switching to a Lambda Function URL
(`RESPONSE_STREAM`) plus ConverseStream — a backend architecture change, not a
client adjustment. The client typewriter is visually equivalent and speed-
controllable, but **it cannot absorb time-to-first-token** (the screen stays
empty until generation finishes). Whether that trade holds depends on the report
call's latency at production payload size, and that number does not exist yet.

### #7 — reintroduction condition

`constraint_echo` being absent from the schema is a **design judgment, not the
conclusion of a comparison**. When Call 2 shrank to reaction-generation (§3), the
"realize the fixed event" burden the field was anchoring left the call entirely,
and a field with no consumer only spends tokens. **Reintroduce if** a
contradiction with a fixed event is first observed in situ — and then re-examine
under a design that satisfies rule 8 (A20).

## 8. Revision requests to the parent spec — all resolved (record)

This section was a list of places where this contract disagreed with the
architecture spec. The spec has since absorbed all three. Kept as a record of
what was raised and where it landed; **nothing here is outstanding.**

| Request | Absorbed into |
|---|---|
| `PRIORITY_LIST` is not a player surface | spec §6.1 ("a fixed authored section … with no player control attached"), §6.3 ("inject block → a line in *known blocks*. That is the whole list."), and a rewritten I7 |
| The §4 latency figures are invalid | spec §4 ("not yet measured … the ~19–75s figure of earlier drafts … is withdrawn") |
| §4 latency rule 5 specifies SSE, contradicting §7-6 | spec §4 rule 5 ("The typewriter is client-driven … SSE … is not built") |

The fourth item in the old list was not a revision request but a standing
methodology rule; it now lives as **rule 8** in §1.

## 9. Evidence

What each clause rests on. A clause with no evidence is a preference, so absence
from this table means the clause is a spec citation or a team decision.

| Clause | Evidence |
|---|---|
| No nested objects (§1-2) | RUNLOG **A7** — when `because` was an object, 7 of 17 calls were malformed, and the failure correlated with the arm |
| hard/soft split (§1-6) | RUNLOG **A16** — hard-discard created a different filter per arm and repeatedly invalidated comparisons |
| A20 preconditions (§1-8) | RUNLOG **A20** — a predicted event pinned to the floor is the same defect as saturation. Seeing 15–20pp at 80% power needs 80–100 per arm |
| Call 1 field order (§2) | The entire mechanism program was measured on this arrangement. Changing it means revalidation |
| Call 2 reduced to reaction generation (§3) | Three recurring defect families in the first smoke test — controller utterance re-emitted as NPC dialogue 8/10, duplicated quotation, restatement of the immediately preceding timeline. The cause was *a contract that asked for what already existed to be written again*. [Read-out](../planning/dday-mechanism/runs/SMOKE-20260731-callcontract-read.md) |
| Controller re-emission detection (§3) | Same observation. The controller is absent from `PRESENT_NPCS`, so speaker-id validation cannot catch it |
| `side` split (§3) | Line-crossing 2/5 with prose-only rule → 1/5 with `side` grouping → **0/5** with the rule moved onto the label (two independent runs) |
| `facts`/`report_body` split within one call (§4) | Same smoke test observed that extraction is not copying (order restructured, quotation preserved) and that the temperament fingerprint leaked into the report 10/10 |
| The three record-keeping lines (§4) | Same smoke test's defects — unhedged assertion ("analysis confirmed"), parenthetical interpretation, omission of the agent's own utterance and order distortion |
| Provisional length 20–30 (§7-3) | Same smoke test measured 18–29 sentences (mean 23.8); 1 of 10 calls fell below the floor |
| Latency figures invalid (§8) | RUNLOG **A4** — the old figures timed subagent round-trips. A replacement awaits re-measurement at production payload size |
| `PRIORITY_LIST` frozen (§8) | The C-STRUCT termination verdict and the 07-31 decision (not to be revived even as UI dressing) |

**One thing that is explicitly not used as evidence.** The first smoke test's
`constraint_echo` A/B (0/5 violations vs 0/5) had zero events in both arms, so it
was **a design under which no difference could have been observed** (A20). That
run supports neither keeping nor deleting the field; §7-7's disposition is a
design judgment, not a comparison result.

## 10. Where this contract is executable

The output schemas live as code in
[`proxy/src/calls.ts`](../proxy/src/calls.ts),
1:1 with §2–§4. Both prompt layers live in that tier too, because the proxy
renders them (physical architecture §3.10):

| Artifact | Path |
|---|---|
| system layer (the default prompt) | `proxy/prompts/<call>/base-v*.md` |
| user layer | `proxy/prompts/<call>/user-v*.md` |
| `FLAW` `INCIDENT` `PRIORITY_LIST` | `proxy/src/default-prompt.ts` |
| temperament | `data/scenario/<slug>/temperament.json`; `tools/probe/fixtures/temperament/` holds the probe's prose stand-ins |

The client posts `{call_type, template_version, slots}` and nothing else. Slots
this tier owns are **ignored** when a client sends them — honouring them would
let a client rewrite the agent's character.

`tools/probe/` supplies slot values from hand-authored suite JSON; in production
they come from the §6 suppliers — **the contract is the same and only the
supplier differs.** Switching to proxy transport is a shape change and carries
one revalidation run (EXTENDING.md, Recipe D); until that transport exists, no
measurement has passed through the tier that will actually ship.

⚠️ **The probe keeps its own renderer** (`tools/lib/{compose,calls}.mjs`) because
it measures offline. `proxy/tests/prompt-parity.test.ts` holds
the two to byte identity — without it, the measurements stop describing the
deployed system silently.

Living in `data/` as data: stance sets, gate graph, delta tables, thresholds,
length policy.

## 11. The wire — composer ⟷ proxy

§10 says where the calls are executable. This section is the transport between
the two tiers, and it is the other half of what a work unit needs to build
either side without a meeting.

### Request

```
POST <PROXY_BASE_URL>/dday/call
content-type: application/json
origin: <the deployed Pages origin>          ← checked; a mismatch is 403
```
```jsonc
{
  "call_type": "judgment" | "narration" | "reporter",
  "template_version": "v0.4",                // /^v[0-9]+\.[0-9]+$/
  "slots": { /* values, not prose — see below */ }
}
```

**One route for all three calls.** They differ only in an output schema and
share auth, validation, timeout, and fallback; three routes would be three copies
of one handler. `GET /dday/health` is the other route and invokes no model.

**`slots` carries values, not rendered text** (physical §3.10): arrays stay
arrays, `STANCE_SET` stays `{id,label}[]`. The proxy renders both message layers.
The one slot that must arrive already-prose is `TEMPERAMENT` — the proxy has no
renderer for it and passes it through
([engine ⟷ composer](./contract-engine-composer.md) §4).

**Slots this tier owns are ignored, not rejected.** `FLAW`, `INCIDENT`, and
`PRIORITY_LIST` come from the default prompt. A client that sends them is not
erroring — honouring them would let a client rewrite the agent's character, so
they are silently dropped.

### Response

**200** — the tool payload **verbatim**, unwrapped. A judgment 200 body *is* the
`JudgmentResponse` of §2. There is no envelope on success: an envelope would be
a second place for the schema to drift.

**Non-2xx** — always this shape, never a bare string:

```jsonc
{ "error": { "code": "invalid_request", "message": "…", "requestId": "…" } }
```

### Headers

| Header | On | Meaning |
|---|---|---|
| `x-request-id` | every response | Correlates with the Lambda log line |
| `x-llm-fallback` | `false` on 200 · `true` on a model-side failure | **The engine's signal to apply its own authored fallback** (engine spec §5) |
| `x-fallback-code` | model-side failures only | Which failure, for the run record's `fallbacks[]` |

`x-llm-fallback: true` is deliberately **absent** on a malformed request. A 400
means the client is wrong; flagging it as a fallback would have the engine absorb
a client bug with an authored default, and the bug would never surface.

### Status codes

| Code | `code` | Fallback? | Meaning |
|---|---|---|---|
| 400 | `invalid_json` · `invalid_request` · `invalid_slots` · `unknown_template_version` | no | Malformed payload, unknown call type or version, or slots the schema cannot be built from (e.g. fewer than 2 stances) |
| 403 | `origin_forbidden` | no | Origin is not the configured one |
| 404 | `not_found` | no | Not `POST /dday/call` or `GET /dday/health` |
| 413 | `request_too_large` | no | Over `MAX_BODY_BYTES` |
| 415 | `unsupported_media_type` | no | Content-Type is not `application/json` |
| 500 | `invalid_config` · `unfilled_slot` · `internal_error` | no | This tier's bug. `unfilled_slot` means a template slot had no value — a contract break, not a client error |
| 502 | `invalid_model_output` | **yes** | The model returned no tool call, or output that failed validation |
| 504 | `bedrock_timeout` | no | The model did not answer inside `MODEL_TIMEOUT_MS`. **Fallback yes, retry no** — see below |

The 4xx/5xx split is the load-bearing line: **4xx means fix the caller, 5xx-with-
a-fallback-header means apply the authored default and carry on.** Fallback and
retry are separate properties, and 504 is the row where they differ.

### Retries belong to the engine

One retry, two calls total (engine spec §5), and **the engine owns the counter** —
the proxy never retries a model call. API Gateway allows the whole request 18
seconds and `MODEL_TIMEOUT_MS` already consumes 15, so a proxy-side retry would
land outside the budget and return a gateway error instead of a usable fallback.
The probe uses 2 retries against a different budget; the two numbers differing is
deliberate.

**504 left the retry set on 2026-08-04**
([PR #138](https://github.com/alstjgg/nhn-game-2026/pull/138)). This table
originally marked it retryable, which contradicted engine spec §5's standing
rule that only *hard validation failures* trigger a re-call; a timeout is not
one. The contradiction was harmless while `MODEL_TIMEOUT_MS` was 7 s and a
timeout plausibly meant "the budget was too tight". The A4 measurement moved the
deadline to 15 s against a measured reporter maximum of 10.0 s, so a 504 now
means something genuinely wrong — and a retry would spend a second full deadline
on a cause likely to repeat. §5 was right; this table was not.

### Endpoint configuration

The client learns the base URL at build time from `VITE_PROXY_BASE_URL`. An unset
value is not an error — the client runs with LLM features degraded rather than
crashing, which is what keeps a Pages deploy green while the stack is down. It is
**not** a secret; the origin check and throttling are the access control, and the
only secret in the system stays inside the Lambda (physical §2 constraint 2).

⚠️ **Open — nothing sets `VITE_PROXY_BASE_URL` yet.** `deploy.yml` must not change
(physical §2 constraint 4), so it arrives as a repository variable read by the
existing build step. `demos/apothecary/` hit exactly this and its build never set
`VITE_AI_BASE_URL`, which is why that demo runs stub-only today — the precedent
to not repeat.

> **Mechanical note for whoever sets it (08-05).** A GitHub repository variable
> is not visible to a workflow step unless that step declares it under `env:`, so
> the settings entry alone does not reach `vite build`. Confirm the route before
> the first live-provider run — this is a finding, not a proposal; the call is
> 민서's (PR #116 · "a settings change, no code").

**Still unconsumed.** Nothing in `src/client/` builds a transport yet, so Vite
inlines no reference and the URL would not appear in today's bundle either way.

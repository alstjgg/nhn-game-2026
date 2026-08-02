# Spec — Minimal Engine v0

> **Tier:** `spec-` — normative authority for its domain. Breaking anything here
> makes a downstream artifact defective even if it works.
> **Owner:** 윤석 (architecture track).
> **Scope:** one round of a **single** gate. Everything the request excluded is
> excluded here too.
>
> **This document is the answer** to the (now archived)
> [minimal engine request](../planning/dday-engine-minimal-request.md) — the back
> half of the 07-30 meeting's §2-3 sequence ("first *request* what is needed,
> then define the minimum spec"). It answers the request's five §6 questions and
> turns its §7 into executable acceptance criteria.
>
> **Source documents:** [architecture spec](./spec-architecture.md) §2 · §3 ·
> [call contracts](./contract-calls.md) · [datapack contract](./contract-datapack.md).

## 1. State model (request §6-1)

### 1.1 Variable set — **provisional**

```ts
type RunState = {
  scalars: { trust: number; fear: number };  // integers — §1.3
  flags:   Record<string, boolean>;          // one, in the minimal engine
  clock:   number;                            // scenario minutes
  route:   { node: string; beat: number; visited: string[] };
};
```

Evidence that each passes the three tests (architecture spec §3.1):

| Variable | write | read | visible |
|---|---|---|---|
| `trust` | (gate, stance) delta | edge predicate `(soft, trust≥T)` | talkativeness · information sharing |
| `fear` | (gate, stance) delta | edge predicate `(hard, fear≥F)` | breathing · voice |
| `clock` | script events | termination check + `score.json` | wall clock — **an I12 exception, being a diegetic instrument** |
| flag ×1 | script events **or stance buckets** (§1.2) | edge predicate | behavior change |
| `route` | engine | edge predicate | **exempt** (the only exemption in architecture spec §3.1) |

The two scalars were chosen for symmetry — the `soft` and `hard` buckets must
**each** own a variable a predicate can hang on, otherwise routing never actually
diverges and §7-6 (same stance + same state → same routing) becomes a trivial
test. The flag exists for kind coverage: if the minimal engine never executes a
flag path, that path first runs at scenario-binding time.

**Flags are written in two places: script events and stance buckets.** This
section was first written narrowed to script events only — buckets had no flag
slot, and a spec that promises a slot which does not exist breaks that promise at
scenario-binding time. The slot appeared the same day (datapack contract v0.4,
`buckets[].flags`, the same boolean model as `effects.flags`): the outcome of a
structural gate (우는다리 G2 · G3 · G5 · G6) is world state rather than the
caller's meters, so without the slot those gates harden into empty no-ops. **The
minimal engine is unaffected** — the first pack's G1 buckets emit no flags, so
its flag-path kind coverage is still satisfied by the script event alone. The
engine's flag-application seam must not discriminate by source (same reasoning as
§1.2's two actuators running through the same code).

> ⚠️ **This list is not architecture spec §9's `state variable list` binding.**
> §9 makes that binding conditional on (a) scenario selection and (b) the §3.1
> visibility probe (owner L, not yet run); the second is unmet. This is a
> **provisional set for getting the engine running**, and it is rebound under
> §3.1's reduction rules once both preconditions are satisfied. The engine must
> be indifferent to the variable list (architecture spec §3), so if rebinding
> touches engine code, that is itself a defect.

### 1.2 Actuators

Exactly architecture spec §3's whitelist: **(gate, stance) fixed deltas** and
**script event effects**, and nothing else. Delta application happens at **one
seam in the engine** — the execution grade (±α) is off today, but that seam is
Call 4's insertion point.

| Actuator | Data location | Shape |
|---|---|---|
| (a) (gate, stance) delta | `gates.json` `gates[].buckets[]` | `{ deltas: variable→integer, flags: id→boolean }` — `flags` added in datapack contract v0.4 |
| (b) script event effect | `timeline.json` `events[].effects` | `{ deltas: variable→integer, flags: id→boolean }`, or `null` pre-hardening |

The slot for (b) was created by the data track at this spec's request (datapack
contract v0.3). **The engine consumes that shape as-is** — the boolean in `flags`
maps 1:1 onto `symptoms.json`'s `set`/`unset`, and `deltas` is the same map as
(a), so journal recording and symptom lookup run through the same code for both
actuators. Application timing: §4.

### 1.3 Scalars and deltas are **integers**

State scalars and both actuators' delta values are integers, and a delta of `0`
is an authoring error. This is not taste; it is §2.3's premise. The symptom
lookup matches magnitude against `min` bands (integers ≥ 1), so a `+0.5` delta
**matches no sentence at all** and becomes §2.3-2's hard error. Yet §6-2's
coverage lint only inspects `(variable, direction)`, so it passes that data:
exactly the silent-at-authoring, explodes-at-runtime class §6-2 exists to
prevent.

The data-side schema currently says `number`. The datapack contract fixed the
adjustment direction ("where it disagrees with the engine spec, the data track
revises to restore fit"), so this paragraph *is* the basis for that revision —
not a separate request (see §6-3).

## 2. Delta journal and symptom renderer (request §6-2 · contract open #4)

### 2.1 Journal entry

```ts
type DeltaEntry = {
  variable: string;
  before: number | boolean;
  after:  number | boolean;
  cause:  string;       // "G7:c" | "event:t12" | "fallback:call1"
};
```

Recorded every beat. `cause` is not decoration — it is the basis of
attributability, and architecture spec §2's position is that a score or outcome
you cannot explain is a bug.

**Write `cause` using pack ids.** The gate is `gates[].gate` (`G7`), the stance is
`stances[].id` (`c`), the event is `events[].id` (`t12`) — not the stance `label`
(`공감`) and not event prose. The journal rides verbatim into the run record
(`data/runs/_schema/run-record`), so if labels were used, **the moment an author
edits one character of a label, attribution for every past run breaks.** Ids are
pattern-fixed by the schema; labels are free text.

### 2.2 Symptom sentences are **data**

Sentences are authored in `data/scenario/<slug>/symptoms.json`, not in code
(balance-as-data). The renderer is a lookup function, and when the scenario
changes the engine does not.

**This file is a hardening artifact.** Symptoms attach to deltas, and draft-stage
gate cards have no deltas (datapack contract), so a pack compiled from a draft
carries an **empty skeleton** and lint tracks it as incomplete — not a defect but
a tracked authoring stage. §6-2's coverage check becomes effective the moment
deltas exist. If the engine is fed an empty pack, halting at the first delta via
§2.3-2 is the correct behavior.

```jsonc
{
  "fear": {
    "up":   [ { "min": 20, "text": "{who}의 숨이 눈에 띄게 가빠졌다" },
              { "min":  1, "text": "{who}의 목소리가 조금 흔들렸다" } ],
    "down": [ { "min":  1, "text": "{who}가 한숨을 돌렸다" } ]
  },
  "trust": {
    "up":   [ { "min":  1, "text": "{who}의 말이 조금 길어졌다" } ],
    "down": [ { "min": 15, "text": "{who}가 문장을 짧게 끊기 시작했다" },
              { "min":  1, "text": "{who}가 한 박자 늦게 답했다" } ]
  },
  "flags": {
    "caller_knows_recording": { "set": "발신자가 통화가 기록되고 있음을 알아챘다" }
  }
}
```

| Key | Meaning |
|---|---|
| top-level key | A scalar variable name, or `flags` collecting the flags |
| `up` / `down` | Direction of change. `up` is increase, `down` is decrease |
| `min` | The **minimum magnitude** `\|after − before\|` at which this sentence applies. Entries are read in `min` descending order |
| `text` | The symptom sentence. Containing a digit raises §2.3-7's hard error |
| `flags.<id>.set` / `.unset` | `false→true` / `true→false` |

`{who}` is substituted with the name of the character owning that variable — the
`name` of the character in `characters.json` whose
`characters[].meters[].variable` matches. Meter variable bindings are filled at
hardening (they are `null` in a draft), so this lookup only resolves on a hardened
pack. It is optional: with a single character you may write the name directly
into the sentence. In the minimal engine the scalars belong to one character, so
ownership is self-evident; when this extends to multiple characters the variable
key becomes `<npc_id>.<var>` — a scenario-binding-time concern.

**A worked render.** At gate 7, `압박` was chosen (`trust −20`, `fear +25`) with
state `{trust: 40, fear: 55}`:

```
journal  [ { fear,  55→80, "gate7:압박" },      → up,   magnitude 25
           { trust, 40→20, "gate7:압박" } ]     → down, magnitude 20

lookup   fear.up    matches min 20 → "회선 A 발신자의 숨이 눈에 띄게 가빠졌다"
         trust.down matches min 15 → "회선 A 발신자가 문장을 짧게 끊기 시작했다"

sort     both scalar (kind_rank 0) → magnitude descending → fear (25) first
cap      2 ≤ 3 → unchanged

SCENE_SYMPTOMS = [ "회선 A 발신자의 숨이 눈에 띄게 가빠졌다",
                   "회선 A 발신자가 문장을 짧게 끊기 시작했다" ]
```

### 2.3 Renderer contract

```ts
renderSymptoms(journal: DeltaEntry[], pack: SymptomPack): string[]
```

1. Reduce each entry to `(variable, direction, magnitude)`. For scalars
   `magnitude = |after − before|`; flags have no magnitude.
   **Entries with `magnitude === 0` are dropped here** — state did not move, so
   there is no symptom to show. This is not an exception to rule 2 but a stage
   before it: without the drop, every no-op delta would fail to match and raise a
   hard error. The entry stays in the journal (§2.1 records *attempts* to change
   state, not what reached the screen). Since §1.3 makes a delta of `0` an
   authoring error, the only traffic on this path is multiple deltas cancelling
   out.
2. Take the **first match in `min` descending order** from `symptoms.json`. No
   match is a **hard error**. Why not skip: silently passing over an authoring
   gap makes the symptom vanish soundlessly, and that variable effectively
   **loses the `visible` leg of §3.1's three tests** — with nothing anywhere
   revealing it. Lint catches this statically before it can fire at runtime
   (§6-2).
   The renderer **trusts that the array is already authored in `min` descending
   order** and does not defensively sort. JSON Schema cannot enforce ordering, so
   the only basis for that trust is lint (§6-2) — which is why the ordering rule
   must exist as an authoring-time check.
3. The sort key is **`(kind_rank, −magnitude, order of appearance in the
   journal)`**, where `kind_rank` is 0 for scalars and 1 for flags. Fixing the
   tie-break to appearance order is a condition of determinism; leave it out and
   the same input can produce a different sentence order.
4. Truncate to the top **3**.
5. If the result is empty, return **`["(변화 없음)"]`** — not an empty array. An
   empty array leaves only the template's `[장면의 변화]` header with nothing for
   the model to interpret, and the harness already uses the `(없음)` convention
   for `BLOCKS`.
6. Sentences per entry are **unconstrained**. This is authored data, so length is
   under the writer's control; it is not model output, so no cap is needed as a
   safety device. If one becomes necessary it is a lint rule, not an engine rule.
7. **A single digit anywhere in the output is a hard error.** Code enforces I12.

All three hard errors (2, 3, 7) are decidable at authoring time and lint
**preempts** them (§6-2) — coverage (2) · `min` descending (3) · no digits (7).
The runtime checks stay: lint inspects the pack, but the engine's contract is
over its whole input rather than the pack, and for this class of defect the
overlap is not a cost.

## 3. Beats and rounds (request §6-5 · §6-4)

### 3.1 Round = gate

```
round  = [gate beat] + [script beats up to just before the next gate]
report (Call 3) = immediately after the round's last beat, exactly once per round
```

| Beat kind | Call 1 | Call 2 | Call 3 |
|---|---|---|---|
| gate beat | ✅ | ✅ | — |
| script beat | — | ✅ | — |
| end of round | — | — | ✅ |

**Script beats run Call 2 without exception.** No authored on/off field is
provided — a conditional path creates a branch the minimal engine never
executes, and it makes authors decide "this event needs no reaction" without
measurement. The price of the unconditional call is latency (about 4.5s per beat,
which architecture spec §4's latency rule 2 prefetch must absorb); the return is
**more mining material** — Call 2's output lands in the timeline and is W2's
supply, so a script beat's reaction is itself player material.

The re-examination trigger is the A4 latency measurement. If cost then exceeds
material value, request a declaration field in `timeline.json` **at that point** —
do not build it in advance.

With a gate budget of 5–8 (architecture spec §2), reports also run 5–8 times per
run. Why this boundary:

- **It matches W3's supply cycle** — report → mining → the next gate's `BLOCKS`.
  Fresh material arrives before every judgment.
- **Latency hides** — the report call is processed while the script beats between
  gates flow past (architecture spec §4 latency rule 2, prefetch). At one per
  beat, a 9-second call would stall every beat, and rule 4 (hide behind the tally
  screen) applies only once, at end of run.

> ⚠️ **The request's §6.1 measured constraint applies to round boundaries too.**
> A round boundary must fall just before a gate, and must **not** fall after a
> fixed event that demands a reply from the controller.

### 3.2 Timeline length — **provisional**

| Slot | Cap |
|---|---|
| `TIMELINE_EXCERPT` (Call 1) | most recent **6 lines** |
| `TIMELINE_TAIL` (Call 2) | most recent **6 lines** |

**Never truncate mid-beat.** On hitting the cap, remove the **whole** oldest
beat. With several `npc_lines` a single beat occupies several lines, so counting
lines alone leaves a severed half-beat behind — that is noise, not context.

Basis and limits: the shapes that have actually been measured are
`TIMELINE_EXCERPT` at 4 lines (`RB1-rebaseline-v04`) and `TIMELINE_TAIL` at 5
lines (`SMOKE-C2v4`) — the prompt that established C-BLOCK was that size. Six is
that plus one slot of headroom and is **not a measured value.** The retuning
trigger is the **production-payload latency measurement (RUNLOG A4)**, and that
number only appears once §7's acceptance criteria pass.

## 4. Ordering rules

### 4.1 Gate beat

Exactly architecture spec §3, within one beat:

```
stance
  → apply (gate, stance) delta          ← first
  → resolve stance to an outcome bucket
  → evaluate that bucket's edge predicates against the ★updated★ state
  → fix the next node
```

Deltas land before predicates. Inverting the order changes routing while **still
looking deterministic**, which is why this ordering is §7-5's dedicated test
target.

### 4.2 Script beat

```
apply events[].effects (deltas → flags)
  → record journal
  → render symptoms (§2.3)
  → Call 2
```

**Effects land before Call 2.** Only then does this beat's `SCENE_SYMPTOMS` show
this event's consequence — defer it and symptoms slip one beat, so the player
only ever sees cause and symptom out of alignment. Without this rule the timing
becomes implementer's discretion, and slipped symptoms are caught by none of §7's
criteria.

If a beat holds more than one event, apply them in `events` array order (even at
identical `time`). This is the origin of the "order of appearance in the journal"
that §2.3-3's tie-break relies on.

If `effects` is `null`, only rendering and Call 2 run, with no state change — the
normal path for a pre-hardening pack, and symptoms become `["(변화 없음)"]`
(§2.3-5).

### 4.3 Routing vocabulary — the shape of an edge predicate

`gates.json`'s `edge_predicates` is an array of strings. The grammar the engine
parses is one per line, in this form:

```
<variable> <comparison> <integer> -> <node>      # trust >= 55 -> n_trusted
else -> <node>                                   # exactly one, the last line
```

- `<comparison>` is one of exactly five: `>=` `<=` `>` `<` `==`. There is no
  boolean combination (`and`/`or`) — split into multiple lines if needed. Giving
  the minimal engine a parser is not the goal.
- Evaluation is **first-true, top to bottom**, and a missing `else` is a hard
  error. A state that falls off the end of the predicates creates a point where
  routing does not depend on state.
- Flags ride the same grammar as `<flag_id> == true`.
- Evaluation timing is **after delta application**, per §4.1.

**An empty array is valid.** With only one gate there is no node to go to, and
one round completes without predicates (§7-1) — an empty array reads as "after
this gate, the run ends". The predicate branching §7-5 and §7-6 require is built
as **test fixtures**. So the first pack's G1 can enter the engine with
`edge_predicates` empty, and this grammar is the vocabulary hardening uses when
it closes that field.

This grammar is **provisional** — it is re-examined when the gate graph (excluded
by request §5) arrives, together with the question of where node names live. It
is fixed now because hardening is waiting on a vocabulary to fill that field.

## 5. Behavior on call failure (request §6-3 · contract open #5)

The retry budget is **one retry (two calls total)**. Only hard validation
failures trigger a re-call (call contracts §1 rule 6).

The harness uses `maxRetries = 2`
([drive-beat.mjs](../infra/test-harness/drive-beat.mjs)), but the production
engine reduces it to 1 — **measurement and play optimize for different things.**
Measurement prioritizes not losing samples; play prioritizes latency. Two retries
make the judgment call worst-case three calls, and that latency is a charge
against architecture spec §4 latency rule 2's prefetch buffer. The harness value
stays as it is; the two numbers differing is deliberate.

This value is **provisional** for the same reason as §3.2 — the
production-payload latency measurement (A4) is the retuning trigger.

| Call | On final failure | Grade |
|---|---|---|
| **1 Judgment** | Proceed with `gates.json`'s `default_stance`. That delta entry's `cause` is `"fallback:call1"` | fatal |
| **2 Narration** | Continue the beat with no `timeline_entries` or `npc_lines`. The fixed event and the `utterance` were already rendered by the engine, so the screen stays alive | local (call contracts §3) |
| **3 Reporter** | Fill `facts` from the engine-assembled objective log, and `report_body` with substitute text. W3 supply is cut, but W2 (timeline mining) survives | supply cut |

**The engine does not choose the default stance.** The gate standard form
presupposes "the authored temperament produces default stance X", so X is an
authored value. If the engine grabbed the first item of the stance set, that
would be an undeclared baseline stance and would fall foul of architecture spec
§6.2. The value already exists — the canonical gate card authors `default_stance`
(hardening manual §5) and every gate in the draft declares it. The engine only
needs it to survive as far as `gates.json` (§6-4).

**Proxy contract.** Every response carries `x-llm-fallback: true|false`, plus
`x-fallback-code` on failure. These are headers specifically **to avoid touching
the output schema** — adding a field is a shape change and carries revalidation
(call contracts §1 rule 3). `x-llm-fallback` is already the convention in the
apothecary Lambda, so it is not a new invention.

**Run record.** A fallback is not a state change, so it is collected in the run
record rather than the delta journal: `fallbacks: [{ beat, call, code }]`. The
delta a Call 1 fallback produces does still appear in the journal via `cause` —
that delta genuinely moved state.

## 6. Datapack — revision requests and their resolution

This section began as a request list and became a **resolution record**. Per the
adjustment direction the datapack contract fixed ("where it disagrees with the
engine spec, the data track revises this section to restore fit"), everything
below was handled by revision rather than by meeting — the data track's P0
(datapack contract v0.3, schemas · compiler · lint · first pack) implemented all
of it.

### 6-1 `symptoms.json` — absorbed into the datapack ✅

Authored data turning state change into **symptom sentences** the player can
read. Format, field semantics, and a render example are in §2.2; the canonical
schema is `data/scenario/_schema/symptoms.schema.json`.

**Why data:** sentences are scenario content — they change entirely when the
scenario changes, and the engine must not change by one line (architecture spec
§3). Putting them in code is the moment the engine absorbs the scenario, and that
is an anti-narrowing failure under §8.

**Why the game does not work without it:** `SCENE_SYMPTOMS` is the **only**
channel by which state change reaches the screen (call contracts §1 rule 5 — no
number may go to a prompt or a screen). If this file is empty, the `visible` leg
of §3.1's three tests fails for every variable, and the player can never learn
what their choice moved.

**Authoring unit:** one sentence per `(variable × direction × magnitude band)`.
At single-gate scale with two scalars that is a minimum of 4 bands (`trust`
up/down, `fear` up/down), or 8 if each is split in two.

**Scoping correction (data track's reply, accepted).** This is not a datapack
file but a **hardening artifact** — symptoms attach to deltas, and draft-stage
cards have no deltas. Compile emits an empty skeleton and lint tracks the
incompleteness (§2.2). The judgment above ("the game does not work without it")
stands, but the empty state is a **tracked authoring stage**, not a defect.

### 6-2 lint — symptom coverage plus two static preemptions ✅

**Coverage.** For every `(variable, direction)` combination the actuators (§1.2's
(a) `buckets[].deltas` and (b) `events[].effects`) can produce, `symptoms.json`
must carry an entry **reaching down to `min: 1`**. The same holds for flags —
every flag an event can flip needs `flags.<id>.set` / `.unset`.

Because §2.3-2 makes a match failure a hard error, without this check an
authoring omission first surfaces **at runtime** — and only on a path that
actually steps on that delta. It is statically decidable: the delta table and
`symptoms.json` are all it takes.

Two failure examples (notation is the canonical card — `deltas` is a
variable→number map):

```jsonc
// ① band gap — small changes are uncovered
gates.json     "buckets": [ { "id": "a", "deltas": { "fear": 5 } } ]
symptoms.json  "fear": { "up": [ { "min": 20, … } ] }
→ FAIL  the smallest min in fear/up is 20 — nothing can match magnitude 5

// ② missing direction
gates.json     "buckets": [ { "id": "b", "deltas": { "trust": -20 } } ]
symptoms.json  "trust": { "up": [ … ] }
→ FAIL  trust/down is missing entirely
```

① is the more dangerous: `symptoms.json` exists and looks plausible, yet it
detonates only under certain stances.

**Two static preemptions (added by the data track, accepted).** The other two
runtime hard errors in §2.3 are also decidable at authoring time — entries sorted
by `min` **descending** (§2.3-2 takes the first match, so order carries meaning)
and the **no-digits** rule (I12, §2.3-7). All three runtime failure paths for
`symptoms.json` are therefore preempted by lint.

### 6-3 One remaining revision — deltas are integers, `0` is an error

§1.3 is the rationale. The value type of `buckets[].deltas` and
`events[].effects.deltas` is currently `number` with no integer or non-zero
constraint. The coverage lint only inspects `(variable, direction)`, so it passes
a `+0.5` delta — which then becomes §2.3-2's runtime hard error, exactly the class
6-2 set out to prevent. Either a schema integer constraint or a lint rule is
fine; all that matters is that the verdict moves to authoring time.

### 6-4 Confirmation item — resolved ✅

**Does `default_stance` survive compilation?** `gates.schema.json` declares the
field `required` and compile carries the card across verbatim, so there is no
path by which it drops out of an enumeration silently. It was confirmed present
on every gate of the first pack. Both §5's fallback and **the P1 first-gate
probe's prediction value** are therefore safe.

### 6-5 What is deliberately not requested

A narration on/off declaration field in `timeline.json`. §3.1 settled on an
unconditional call, so it is unnecessary now. If the A4 latency measurement shows
the cost exceeding the return, request it then.

The `flags` slot on gate buckets **appeared before it was requested** — the data
track created it as the discharge point for structural gates (datapack contract
v0.4). It is the basis on which §1.1 recognizes two sources of flag writes, and
it drops off this "not requested" list only because the minimal engine (G1) never
steps on a bucket flag.

## 7. Acceptance criteria — the request's §7 in executable form

| # | The request's criterion | How it is verified |
|---|---|---|
| 1 | One round runs end to end | The full driver fills all three calls' slots, consumes all three outputs, and the updated timeline becomes the next round's input |
| 2 | A delta journal every beat | Each beat emits an array of `{variable, before, after, cause}`. An entry with an empty `cause` fails |
| 3 | Zero digits in `SCENE_SYMPTOMS` | The renderer's §2.3-7 hard error is promoted to a test — output containing a digit fails |
| 4 | Free text cannot move state | Replacing `utterance` · `inner_note` · `timeline_entries` · `npc_lines` · `facts` · `report_body` with arbitrary strings leaves routing and final state byte-identical |
| 5 | Ordering rule | Hold a fixture where evaluating predicates against the pre-delta state yields a different node, and confirm the engine picks the updated-state branch |
| 6 | Same stance + same state → same routing (I6) | N executions of identical input produce an identical path and an identical journal |

4 and 5 become **resident regression tests**. Both are the kind of defect that
**breaks silently**.

Once this holds, the LLM layer can drop its hand-authored stubs and attach to the
engine — and at that moment **latency measurement at production payload size**
becomes possible, which is the number RUNLOG A4 demands and architecture spec §4
is waiting on. It is also the point at which §3.2's six lines get retuned.

## 8. What this spec closes and what it leaves open

**Closes**

- All five questions in the request's §6
- Call contracts open item **#4** (`SCENE_SYMPTOMS` renderer contract) → §2.3
- Call contracts open item **#5** (behavior on call failure, including proxy
  fallback metadata) → §5

**Leaves open**

- **Formal binding of the variable list** — after the §3.1 visibility probe
  (owner L, not yet run), per architecture spec §9. Scenario selection is
  satisfied (우는다리, 08-01). §1.1 is provisional.
- **Formal timeline length** — after production-payload latency measurement (§3.2).
- **Retry budget** — same measurement is the trigger (§5). One is a
  latency-first provisional value.
- **Formal shape of the routing vocabulary** — §4.3 is a provisional grammar fixed
  now so hardening can fill `edge_predicates`; re-examined when the gate graph
  arrives.
- **Where Call 3's substitute text lives** — an engine constant in the minimal
  engine, moved to `data/` in production.
- **U's ratification of report cadence** — call contracts §7 #2. §3.1 is L's
  decision and can be overturned once the UI pause structure is settled.
- Everything the request's §5 excluded: gate graph, run score / ending model,
  execution grade (grader), save/load.

**Two items the data track has parked on this spec — both outside the minimal
engine's scope.** The run-artifact format (`data/runs/_schema/`) leaves two
places nullable while waiting for these answers, so it is stated here that those
`null`s are **deferral, not defect**.

| Open item | Why it is not answered now | When |
|---|---|---|
| **Run termination condition** (the meaning of `run-record.reached_clock`, `score` nullable) | The request's §5 excluded run score / ending model, and the termination verdict is part of that model. The minimal engine's scope is one round of one gate, and §4.3's empty `edge_predicates` reading as "next is end of run" is currently the whole of it | With the gate graph + ending model |
| **Beat granularity** | The minimal engine's answer is **one timeline event = one beat**, and §4.2 stands on that premise. But it is tied to the UI pause structure (the same dependency as call contracts §7 #2), and fixing it as a format before that structure exists would change the run record twice | After the client track starts |

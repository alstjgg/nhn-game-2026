# DDAY Mechanism Deep-Test Plan

Test program for the judgment-control mechanisms of DDAY. This program supplies
the game's **parameters** — which mechanisms survive, with what authoring
guidelines, at what hit rates. It does not define the game's core technology,
which is fixed in [dday-architecture-spec.md](./dday-architecture-spec.md), the
single source of truth. §1 restates only the facts that change how a probe is
built; everything else about the game is read from the spec, never copied here.

Self-contained for execution: a session given this document can author probes,
run them, and record results — provided it applies the run integrity protocol
(§3), which is a precondition for every call, and follows the run sheet (§7).

## 1. Facts that shape a probe

DDAY is a text deduction game set in a situation room: no spatial movement,
information arrives through calls and CCTV, and the player shapes the agent's
**judgment** rather than its actions. The facts below change how a probe is
constructed. For the game graph, state engine, variable pool, call inventory,
data flows, and invariants, read the architecture spec — do not restate them.

- **The injection unit is the report block** — any sentence block the player
  mines from the timeline or the agent's self-written reports. Fact statements
  are one *species* of block, not the definition of the channel. Probes must
  therefore cover species, not just fact-type sentences (§4.1).
- **Stance sets are per-gate content.** At each gate the agent picks a stance
  from that gate's set; probes define their own. Stance labels are **behavior
  orientations** (*persuade*, *press*, *empathize*, *trade*, *stay silent*) —
  never canned utterances or completed action descriptions. An earlier probe
  series used canned-utterance labels; findings under that shape do not
  transfer.
- **The judgment call returns the full schema**: `stance` (from the gate's
  set), `because` (block ids), `rejected` (stance + reason), `utterance`,
  `inner_note`. Probes mirror this in full. A stance-only reduction is not the
  production shape — the free fields are generated in the same call and are
  part of the generation regime.
- **Temperament is out-of-band**, in the call's system layer (in this harness:
  one subagent definition per temperament under `.claude/agents/`, `tools: []`,
  `model: haiku`). Player-manipulable material — blocks, ordering — travels
  in-band in the payload. This separation is also an integrity control (§3).
- **Free output has no state actuator, and is not decoration.** `utterance`
  and `inner_note` flow into the timeline and the self-written report — the
  pool the player mines next. Their consequences route through the *player*,
  not the world engine, which makes their quality measurable material (§5.3).
- **A missed gate routes to another branch** (braided topology) or costs run
  score, rather than ending the scenario. This is why the eligibility floor is
  topology-dependent (§2).
- **Runtime model is haiku.** All tests run on haiku.
- **Gate standard form** — every gate must be expressible as one sentence:
  > At gate G, the agent's default stance is X. Injecting block F (or ordering
  > S, or temperament K) shifts the stance to Y.
  A gate that cannot be written in this form demands a new mechanism and is
  treated as a cost, not a design flourish.
- **Latency is recorded on every call.** Judgment latency ran ~30s → ~49s as
  the payload filled. Production hides latency behind authored techniques
  (prefetch, diegetic waiting, tally screens, streamed report typing), so it is
  a managed hiding budget rather than a single pause ceiling — but prompt
  length spends that budget, and the prefetch buffer is finite. The per-call
  data sizes the budget; the numeric target is set with the UI pause structure.

## 2. Testing principles

- **Reproducibility is a measured variable, not a pass/fail metric.** The same
  prompt producing different judgments is a property of the medium. The repeat
  rate is still recorded per gate and per mechanism, because it determines what
  a mechanism can be used for. Two failure modes are live and both have been
  observed: **dispersion** (a gate that fires unreliably) and
  **over-convergence** (an early run set came back 24/24 identical — no
  branching, no game).
- **Gate-eligibility floor (qualitative for now).** A mechanism may anchor a
  gate only if its influence tilts the stance distribution consistently in the
  intended direction; below that it is *texture* (flavor in reports, tonal
  variation) but not a branch key — a player who performs the correct
  manipulation and is denied has hit a bug, not a distribution. The number is
  deliberately unfixed: at feasible repetition counts (N ≤ 5) an 80% floor
  cannot be distinguished from 60%, and the tolerable rate depends on the UI's
  retry structure and on gate topology. Fix it once N (§5.4), the retry/pause
  structure, and the gate's topology are known; until then record raw
  distributions. Gate eligibility additionally requires game-side evidence
  (Tier B, §5.2) — Tier A alone qualifies texture.
- **Every probe carries a matched control (placebo arm).** Same slot, same
  length, same axis vocabulary, semantically irrelevant to the judgment at
  hand. Irrelevance is achieved by misdirecting the **referent** — fear-axis
  vocabulary applied to a bystander, not the caller; any fear-sentence about
  the caller is semantically live and is not a placebo. A mechanism is credited
  only when the live arm moves the distribution **and** the placebo arm does
  not. Without a placebo, a result is a correlation, not a boundary law.
  - *A flipped placebo indicts the watched clause, not automatically the whole
    channel* — a clause-authoring boundary law. The exception is the flagship
    block-injection probe (§4.1).
  - *Discriminate the artifact with the free output.* `inner_note`/`because`
    **misattributing** the placebo content to the judgment's referent (fear
    ascribed to the caller when the sentence named a bystander) means
    token-matching. The reasoning naming the bystander **correctly** while the
    stance still shifts means referent bleed — context contamination. Different
    laws, different fixes, same flipped placebo.
- **Measure stance distribution + reason traceability.** Repeat each probe N
  times; record the split as design data ("block F tilts the stance ~x% toward
  Y"), not as pass/fail. A mechanism passes when its influence is visible in
  the distribution and its reasons trace to the injected element.
- **Boundary laws are the primary deliverable.** For each channel, find as many
  conditions under which it breaks as possible; volume is the goal. Known law
  #1 candidate, *vocabulary alignment*: an injected block only triggers a
  conditional temperament clause when it uses the vocabulary of the axis that
  clause watches. Its counter-example pair, which every law should carry: the
  threat-axis sentence "the caller is not a threat" failed 0/3 to trigger a
  fear-axis clause; rewritten on the fear axis as "the caller is frightened" it
  flipped the verdict 3/3. Law #1 remains provisional until its placebo runs
  (§4.1).
- **Guidelines, not rules.** Outcomes are distributional, so the output is
  authoring *guidelines* — tendencies with known boundaries — not rules that
  guarantee outcomes.
- **Test every candidate mechanism; select on data.** No pre-emptive picking of
  the promising ones. Screening checks feasibility cheaply; it does not tune a
  mechanism until it works.
- **The screening kill-criterion is illegibility, not failure.** A first-run
  failure with a diagnosable cause is fine — diagnose, re-author once, re-run
  under the pre-registration rule (§6). Block injection itself went 0/3 on its
  first attempt from a legible cause (vocabulary-axis mismatch) and one rewrite
  produced 3/3; a no-retry rule would have killed the strongest known
  mechanism. A mechanism is dropped only when its failures cannot be explained.
- **The pipeline must prove it can produce a negative.** Author one
  **negative-control mechanism** believed to be fake — a block injected into a
  prompt section the judgment logic ignores, or one irrelevant on every watched
  axis — and run it through the complete pipeline: screening, placebo, N-run
  distribution, blind coding. If the pipeline returns "verified", the pipeline
  is broken and every mechanism it has blessed is suspect. It gates deep-testing
  (§8 step 4).
- **The call shape is itself an untested variable.** All prior findings come
  from free-text haiku responses (74/74 wrapped their JSON in a code fence).
  Schema-constrained decoding is a different generation regime and may change
  judgment behavior, not just output wrapping. The first act of testing under
  the production shape is therefore a re-run of one verified probe; if its
  distribution shifts, all pre-shape findings are provisional and must be
  re-validated.

## 3. Run integrity protocol

These rules exist because of a recorded contamination incident, not as
hypothetical hygiene: in an earlier probe series (2026-07-28), a judgment
subagent that had tool access read the repository, learned the scenario's trap
locations, fabricated three plausible-looking runs, and overwrote the results
file. The fabrication was caught through its tool-use traces and the runs were
quarantined. The rules below are enforced by the **execution environment**, not
by prompt instructions, and are a precondition for every call in this program.

1. **Role isolation is enforced by environment, not instruction.** Judgment
   and reporter calls run as subagent definitions with `tools: []`. A
   prompt-level "do not use tools" is insufficient — subagents inherit repo
   context and will act on it.
2. **tool_uses check on every call.** Any response with `tool_uses > 0` is
   contaminated: discard and re-call. Record the discard.
3. **Probe author ≠ judgment caller.** The session authoring probes knows the
   trap locations. Judgment calls receive the payload only — never the plan,
   the scenario data, or prior results.
4. **Raw artifacts retained per run**: prompt, response, metrics, latency.
   Aggregates in a results file are never the only record.
5. **Failed and discarded runs are preserved, not deleted.** Quarantine, don't
   remove.

## 4. Inventory: channels and effects

The manipulation surface divides into **channels** (where player manipulation
enters the prompt) and **effects** (what changes in the agent's behavior). They
are not peers: an effect is reached *through* a channel — "goal redefinition"
is not an alternative to block injection but something a block or a priority
edit does. Channels get boundary laws; effects get reachability answers.

### 4.1 Channels

| id | Channel | Player manipulation | Status |
|---|---|---|---|
| C-BLOCK | Report-block injection | Insert a sentence block mined from the timeline / self-written reports | **Provisional — pending placebo control.** Evidence covers the fact-statement species only: 3/3 flip after vocabulary alignment (law #1, §2). Other species untested |
| C-STRUCT | Structure | Reorder the priority list only, no wording change | **Verified (initial)** — 3/3: reversing priority order reversed the choice |
| C-TEMP | Temperament | Swap the out-of-band temperament definition | **Verified (initial)** — conditional clauses separated cleanly (fired only when their condition held, 100%) |

Notes:

- **The C-BLOCK placebo is the first probe of the whole program** (§8 step 4).
  If a semantically irrelevant same-axis sentence also flips the stance, block
  injection is a keyword lock the player solves once and thereafter ignores,
  not a judgment channel. That outcome changes the concept's core claim. Cost:
  ~3 calls.
- **Block-species coverage is an axis-1 obligation for C-BLOCK.** Whether
  emotion descriptions, NPC quotes, and self-narration blocks also move
  judgment is untested, and it directly bounds the player's real manipulation
  vocabulary.

### 4.2 Effects

| id | Effect | Question to answer | Status |
|---|---|---|---|
| E-PATH | Steer which information source the agent consults, and in what order | Reachable via C-STRUCT? C-BLOCK? | Untested — test by default |
| E-LEV | The agent uses a known fact as a bargaining card | Reachable via C-BLOCK? (measured in the utterance — the fact must be *deployed*, not merely cited) | Untested — test by default |
| E-GOAL | Change the objective the agent pursues | Reachable via C-TEMP? C-STRUCT? | Untested — test by default |
| E-DISC | Degrade trust in an existing block instead of adding one | Reachable at all, through any channel? | Screening candidate |
| E-CONT | Report contamination as a deliberate manipulation channel | Is the absorption steerable? (Prior probes: self-written reports absorbed a contradiction in 3/5 runs.) Reports are the player's supply chain, so contaminating them is manipulating the vein itself | Screening candidate |

Per-effect deliverable, one sentence:
> To build a \<effect\> gate, use channel C with surface form Y; expected hit
> rate Z%; fails when \<boundary law\>.

Notes:

- Framing is **resolved**: it is an effect whose channel is C-TEMP (the
  temperament owns the frame), not a separate mechanism.
- **E-LEV doubles as the feasibility test for execution grading.** The state
  engine launches with stance-only fixed deltas; upgrading to a bounded
  execution grader is viable only if E-LEV shows the utterance layer can be
  read reliably.
- Sentence synthesis/compaction is out of scope (deferred feature).

## 5. Deep-test program: model-side and game-side validity

"Does the model respond?" and "does this mechanism work in our game?" are
different questions. **Tier A** answers the first, **Tier B** the second. A
mechanism is gate-eligible only with Tier B evidence.

The gap is documented, not hypothetical: in the prior probe series one
mechanism passed its judgment gate 3/3 in isolation while five full scenario
runs failed the scenario's first gate 5/5 — the flag that gate required was
reachable only through one specific upstream choice. Isolated validity did not
transfer.

### 5.1 Tier A — model-side validity (question axes)

**Axes 1–2 run on every channel and every surviving effect — these are the
spec. Axes 3–4 run on the three channels only. Axis 5 is opportunistic**:
record observations when they surface; do not author probes for it.

1. **Boundary laws** (top priority) — under what conditions does the channel
   fail to fire or misfire? Deliverable: a list of laws in the shape of law #1,
   each confirmed against its placebo and each paired with the sentence that
   violates it. For C-BLOCK this includes block-species coverage (§4.1).
2. **Stance distribution + reason traceability** — N-run distribution per probe
   over the gate's stance set, recorded as design data; per-run check that the
   stated reason traces to the injected element.
3. **Dose response** — does manipulation intensity move the distribution?
   (stronger vs weaker vocabulary, one block vs two, moving a priority one slot
   vs to the top). If yes, difficulty becomes a designable variable; if no,
   gates are on/off switches.
4. **Interference** — two channels on one gate. Known observation to build on:
   when the stance set contains an escape option satisfying both of two
   conflicting clauses, the conflict never materializes — condition conflicts
   are only real if the stance set forces a choice.
5. **Surface form and structure** (opportunistic) — same meaning in different
   sentence surface forms; section order and segmentation of the prompt. No
   authored probes; log what falls out of axes 1–4. Prompt *length* is a
   latency-constrained design variable (§1), not a test axis.

### 5.2 Tier B — game-side validity (instruments)

- **B1 — Reachability audit** (paper, zero calls; mandatory during suite
  authoring, repeated at scenario authoring). For the gate a mechanism anchors:
  can any upstream choice close it — a flag or state value the gate requires
  that is reachable only through one specific earlier branch? This is the audit
  that catches the isolation-passes/full-run-fails class *before* it costs a
  run.
- **B2 — In-situ confirmation** (one full run per gate candidate). The
  mechanism at its real gate inside a full scenario run. Harness: until the
  winning scenario exists, the prior test slice updated to the production call
  shape. In-situ results are harness-specific — what transfers to a new
  scenario is the reachability audit; the full run is a smoke test that the
  isolation result survives context, not a portable law.
- **B3 — Blind coding** (human, ~20 min per mechanism). Strip the arm labels
  from the `inner_note`/`rejected` texts, hand them to a coder who is not the
  probe author (the same separation as §3 rule 3), and ask which element was
  injected. Report as x/y recovered. This turns reason traceability from an
  operator assertion into a measured number — and if a human cannot recover the
  injected element from the agent's reasoning, the player won't either
  (legibility proxy).
- **B4 — Discoverability probe** (paper, zero calls, flagship-scoped).
  Materials are only what the player sees: fact cards, the priority list, the
  temperament menu, the timeline/report text — **not** the temperament
  definition, which is system-layer and hidden (that hiddenness is the point).
  Task form: "you want the agent to hear this caller out instead of
  interrogating them — what do you do?" Record the first card tried, the
  attempts needed to reach the working manipulation, and whether the player can
  articulate why afterward. n = 2–3, at least one project-naive person;
  pre-register the pass condition (default: one naive player reaches the working
  manipulation within two attempts and can state a reason).

  **Scope and routing.** Discoverability is a property of *mechanism × UI
  surface*, and the UI does not exist yet — so B4 is not a per-mechanism
  eligibility item. Run it once against the flagship mechanism (C-BLOCK / the
  vocabulary-alignment law) before the spec ships, and again for any boundary
  law that presupposes hidden knowledge. Its output routes to **UI
  requirements**, not mechanism verdicts: if no one can see that the block must
  rhyme with the watched axis, the screen must expose the axis (card tagging, a
  temperament dossier that names the condition). Discoverability alone drops a
  mechanism only when no feasible UI exposure makes the manipulation
  articulable. B4 needs a paper mock of the fact-card UI — index cards suffice
  — which must exist before the spec compiles (roadmap dependency).

### 5.3 Advisory logs (observation only — never affect results)

Neither log plays any role in pass/drop judgments, distributions, or boundary
laws.

- **State-variable shadow log.** On each run, note which candidate state
  variables the agent's behavior *would have moved* (the maximal pool is in the
  architecture spec) and which payload symptoms mapped to which variable.
  Observational material for post-test scenario reduction — seeing roughly how
  the stats express in real runs.
- **Mineability log.** The player's supply chain is generated text, so note
  whether it would survive as mining material: sentence-block count,
  specificity (names, quantities, referents), and whether it says anything the
  payload did not already say. Cover all three generating calls — the judgment
  call's `utterance`/`inner_note`, generated NPC dialogue, and report bodies —
  since blocks are mined from all of them. Schema-forced decoding may flatten
  free output into single-clause stubs; if it does, the vein thins and the
  game's surface freedom becomes decoration. That finding changes the
  production schema design, not any mechanism verdict.

### 5.4 Call budget and stopping rule

**Call budget.** Total judgment calls for screening + deep-testing are capped at
a number fixed **before suite authoring begins**, derived by dividing the
available testing window by measured per-call latency (~40s average). N per
probe follows from the budget, not from preference. If the budget is exhausted,
the spec ships with the completed items and the remainder recorded as untested
— a partial spec is an acceptable output; a slipped schedule is not.

**Stopping rule (sequential spending, not fixed N everywhere).** Run 3 per arm;
if the result is unanimous and the placebo arm is clean, stop — that evidence
level qualifies texture. Spend +5 further runs only on gate candidates entering
Tier B. A 3-run stop is never reported as "verified": 3/3 is consistent with a
true rate as low as ~37%, which is why the verdict card shows raw sequences and
N, never rates alone.

Per-channel deliverable: an **authoring guideline** = boundary laws +
recommended surface forms + difficulty variables. Per-effect deliverable: the
one-sentence gate recipe (§4.2).

## 6. Screening procedure (screening candidates only)

1. Author a minimal probe: one gate-standard-form sentence, one gate, one
   payload — plus its matched placebo arm (§2).
2. First run, 3 repetitions per arm.
3. On success → enter the deep-test queue.
   On failure → **write the diagnosis down before authoring the rewrite**, as a
   causal claim: "it failed because X; if X is the cause, changing Y will fix
   it." Then re-author once and run again. If the rewrite passes for a reason
   other than the recorded diagnosis, that is a **drop, not a pass** — an
   unexplained success is as illegible as an unexplained failure. If the failure
   itself is illegible, drop immediately.
4. Second-run failure → drop. Record the outcome, the diagnosis chain, and the
   reason either way; the record is the basis for data-driven selection.

## 7. Running a probe (run sheet)

Execute in this order. 1–3 are authoring, 4 is the call loop, 5–7 are recording
and judgment.

1. **Pre-register** (§9.1) — hypothesis in gate standard form, arms, N per arm,
   and the drop condition. Written before any call.
2. **Author the arms** — baseline (no injection), live, placebo (§2). Only the
   injected element differs: situation text, stance set, priority list, and
   temperament definition are byte-identical across arms. Verify by diff, not
   by intention.
3. **Reachability audit** (§5.2 B1) — paper, zero calls.
4. **Call loop.** Per call: confirm `tool_uses == 0` (otherwise discard,
   re-call, and record the discard); record `latency_s`, schema retries, and
   format violations; capture the response **verbatim** before any analysis.
5. **Write raw artifacts** (below) before computing any aggregate.
6. **Blind code** (§5.2 B3) — coder ≠ probe author.
7. **Verdict card** (§9.2). Gate candidates additionally run B2 in-situ.

### Artifacts

One directory per experiment, mirroring the prior program's layout
(`planning/dday-poc/*/runs/`). Default parent for this program:
`planning/dday-mechanism/runs/`.

```
runs/<EXP>-calls/
  calls-<arm>.md       verbatim responses, arm table, pairing verdict
  metrics-<arm>.json   per-call records, latency, compliance, result blocks
```

- `calls-*.md` is **primary**. `metrics-*.json` is derived and must be
  recomputable from it by hand; if they disagree, the JSON is wrong.
- Raw artifacts are never edited after the fact. Discarded and failed runs stay
  in place, quarantined, not deleted (§3 rule 5).

## 8. Work order

| Step | Work | Deliverable | State |
|---|---|---|---|
| 1 | Confirm inventory (§4) | Channel and effect tables agreed by team | Draft done — awaiting team confirmation |
| 2 | Confirm shared test frame (§2, §5, §6, §7, §9) | This document | Draft done — awaiting team confirmation |
| 3 | Fix the call shape, then author test suites (§8.1) | Tool-use schema; per-channel/effect suites; pre-registration sheet and reachability audit per probe | **Not blocked on backend ownership** — see §8.1 |
| 4 | Shape re-validation, pipeline calibration, then screening | (a) Re-run one verified probe under the production call shape (§2); (b) run the C-BLOCK placebo (§4.1); (c) run the negative-control mechanism through the complete pipeline (§2); (d) screen E-DISC and E-CONT | Pending — (a)–(c) gate everything downstream |
| 5 | Deep-test surviving channels and effects × Tier A axes (§5.1); gate candidates additionally through Tier B (§5.2) | Boundary-law lists, stance-distribution data, per-effect recipes, verdict cards (§9.2) | Pending |
| 6 | Compile the mechanism spec | Boundary laws + authoring guidelines + difficulty variables + gate recipes + verdict cards with human gate/texture/drop decisions — the input for scenario generation and the agent default-prompt spec | Pending |

### 8.1 Step 3 in detail

1. **Fix the tool-use schema**, mirroring the architecture spec's full judgment
   schema — stance selection plus the free output fields (§1). Not blocked on
   backend ownership: if no call-shape owner is assigned by the time suites are
   ready to run, the mechanism owner fixes a provisional schema as a testing
   prerequisite, and the proxy implementation later conforms to it or raises
   objections before its own build starts. The schema must be fixed before the
   first step-4 call.
2. **Author the gates**, each with its own stance set — behavior orientations,
   never canned utterances (§1).
3. **Author the probe payloads**: live and placebo arms per probe (§2).
4. **Author the temperament definitions** out-of-band under `.claude/agents/`
   (§1, §3).
5. **Write the pre-registration sheet** (§9.1) and **run the reachability
   audit** (§5.2 B1) for every probe. Both are part of authoring, not
   afterthoughts.

## 9. Decision procedure

The program's output must be decidable by a human, not just archivable by a
spec author.

### 9.1 Pre-registration sheet — one per probe, written before any call

Fields: hypothesis (the gate-standard-form sentence); arms (baseline / live /
placebo, plus in-situ for gate candidates); N per arm; and the load-bearing
field — **the result that would make us drop this mechanism**. Written before
data it costs nothing, and it is the difference between a decision and a
rationalization; without it, ambiguous results reliably drift toward
"verified". The §6 rewrite-diagnosis rule is this sheet's drop-condition field
applied to re-authoring.

### 9.2 Verdict card — one page per mechanism, fixed format

It presents the case, not the conclusion:

- the gate-standard-form sentence;
- raw choice sequences for all arms (baseline / live / placebo / in-situ) with
  N — sequences, not rates: `a,a,a → d,b,b` tells a human more than
  `flip_rate: 1.0`, and it does not hide N=3 behind a percentage;
- the uncertainty stated plainly (3/3 is consistent with a true rate as low as
  ~37%, §5.4);
- blind-coding recovery x/y (§5.2 B3);
- discoverability where run: x/y players, median attempts, first thing tried —
  or the inherited UI requirement (§5.2 B4);
- latency per call;
- each boundary law paired with the sentence that violates it — a law without
  its counter-example is not usable by an author; the vocabulary-alignment
  pair (§2) is the model;
- confounds left unresolved.

### 9.3 Three outcomes — gate / texture / drop

Decided by a human at spec compile (§8 step 6) with the card in front of them.
**The default for an ambiguous card is texture, not gate.** Since the
eligibility floor is deliberately non-numeric (§2), this default does the work
the number would have done: ambiguity resolving upward into "gate" is how a
spec accumulates mechanisms that fail in front of judges.

## 10. Open, deferred, and decided

**Open** (parameter pending inputs):

- **Numeric gate-eligibility floor** — set once N is fixed and the UI
  retry/pause structure and gate topology are known (§2).

**Deferred:**

- **Sonnet contrast arm** — model-portable boundary laws matter only if the
  runtime model changes, which it will not before submission.

**Decided — do not relitigate** (each recorded in its home section): framing is
an effect on C-TEMP (§4.2) · N follows from the call budget (§5.4) · stance
sets are per-gate content, only the output format is global (§1) · execution
grading launches off, gated on E-LEV (§4.2) · gate eligibility requires Tier B
evidence, ambiguity defaults to texture (§2, §9.3).

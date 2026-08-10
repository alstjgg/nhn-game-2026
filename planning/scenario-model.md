# Scenario model — decisions record

Working notes from the 2026-08-09 session between 민서 and Claude. **This document
does not reference `docs/scenario/scenario-generation-guide.md` or
`.claude/skills/write-scenario/SKILL.md`.** Both are stale: they were written for
an earlier concept and the game moved several times without them. This is written
from scratch and is intended to become the source those two are rewritten from.

Written in English by request. Status markers used throughout:

- **DECIDED** — settled in discussion, treat as fixed.
- **DERIVED** — follows from a DECIDED item by argument, not separately agreed.
- **VERIFIED** — checked against the code by running it; §9 says how.
- **OPEN** — genuinely undecided.

---

## 1. What the game is

**DECIDED.** The player is an operator who cannot act. The only action available is
placing sentences into the next agent's handoff. **The agent chooses.** What it does
with the knowledge it was given is its own, and the player's read on it may be wrong.

**DECIDED — the player runs two deductions at once, and they are interleaved:**

1. **Route deduction** — which way through the situation actually saves people.
2. **Agent deduction** — what to hand over so *this* agent takes that way.

A run that did not go as the player expected is ambiguous between the two: the
route may have been wrong, or the route was right and the persuasion failed.
Distinguishing them is the player's work, not a failure state.

**DECIDED — the report is the ore, the feed is the evidence.** Mining is
report-only (verified: only `windows/reports.ts` and `report-view.ts` import
`minable-sentence.ts`; the feed carries `sentence_id`s and no mining UI). So the
report must contain the knowledge that opens the next edge — that is an authoring
obligation, and §4.1's `yields` is its name.

The LIVE FEED carries the other half: the agent's stance, its utterance, and the
`인수인계 NN` citation naming which slot drove it. The player reads the feed to see
*what* the agent did and *which sentence* moved it, and the report to get the next
sentence.

### 1.1 Deliberately not scenario rules

Recorded so they do not creep back in. Each was proposed and cut:

- **"The causes of a non-obvious stance must be distinguishable."** Already
  projected — `run-feed.ts` prints the slot citation beside the radio line. Client
  behaviour, not authoring.
- **"The agent's conduct must add up to *I did this because of you*."** Call
  inventory, not scenario. It also comes free from graph shape: with a fail edge at
  every gate (§5), Gate 1 recurs every run, so the control condition exists without
  a rule asking for it.
- **"False leads as player traps should go."** Withdrawn. A trap leads to a fail
  node, a fail node has a consequence tail, and a tail is ore — so a trap is not a
  wasted run. See §6 for the one residue that survives.

---

## 2. Run budget

**DECIDED.**

- 시행 횟수 = **4**. This is the whole budget for one sitting.
- The good ending must be reachable **within one playthrough** — i.e. by run 4.
- The game must be short, dramatic, intuitive, and end in the catharsis of having
  saved everyone.

**DECIDED — minimum deaths is 0.** A run exists in which nobody dies, and the player
can reach it. Rationale: the fiction is a training portal reconstructing a real
disaster so an operator can learn. A portal would not select a day on which no
operator could have succeeded, and "however hard you try, someone dies" is a novel's
ending, not a trainer's. The price of a clean run is paid in **something other than
lives** — prosecution, closure, a record that follows someone.

**DERIVED — no single gate may resolve two scored units in opposite directions.**
The current pack fails this: `doors_opened` empties the tunnel and kills 오세라;
`driven_out` saves 오세라 and leaves 41 in the tunnel. A gate shaped like that makes
a clean run structurally impossible whatever the numbers say. Stated as a checkable
property: **there must exist at least one complete route that is simultaneously
optimal for every scored unit.**

---

## 3. Run independence

**DECIDED**, in 민서's words:

> Runs are independent. An event may or may not occur in run *N*, no matter what
> happened in run *N−1*. A gate's existence does not depend on whether some earlier
> run reached it.

**DECIDED — how depth accumulates, given that:**

> The world does not open up as the player learns. **The world opens up as the agent,
> equipped with the player's knowledge, acts differently.**

The causal chain, and every arrow except the first is inside a single run:

```
player's memory (crosses runs)
  → a sentence in the handoff (this run)
    → the agent's stance (this run)
      → the state that stance produces (this run)
        → a gate that was unreachable last run is reachable this run
```

**VERIFIED — already supported.** `driver.ts:131` computes `gateLive =
gateOpen(schedule[0], state)` per run, and a gate's `availability` reads flags set
by earlier gates *inside the same run*. §9 has the probe.

---

## 4. The scenario graph

**DECIDED.** The scenario is authored as a graph and the timeline is derived from it.
This inverts the current authoring order, in which the timeline is written second and
the gates are fitted onto it seventh — which is why the existing draft's evidence
lands wherever the story wanted it rather than where the routes need it.

**DECIDED — the writing order:**

```
endings → routes → the gate each route turns on
  → what the agent must know to take it
    → what experience produces that knowledge
      → which run that experience is affordable in
        → the timeline row that contains it
```

The timeline is the **last** artifact written and it is entirely derived. Every row
is a row some route needs, a row that makes a needed row legible, or cut.

**DECIDED.** The graph must be **machine-readable** — mermaid, or a text format an
agent can parse — because the scenario writer is an agent. A picture is not an input.

### 4.1 What the graph carries

**DECIDED — an edge is a bucket, not a stance.** Several stances collapse onto one
outcome edge. This keeps the graph small while the agent still has a wide choice at
each gate: four stances across two buckets is two edges and four visible options.

This is an existing field. `buckets: {id, stances: [a, b], deltas, flags}`, and
`resolveBucket` finds the bucket holding the chosen stance — the driver calls it
"a many-to-one collapse" in as many words.

**DECIDED — a node's `yields` must reach that round's report.** The report is the
only mining surface (§1), and Call 3 writes it from `EXPERIENCED`, which is that
round's script events, the gate utterance, the narration and the NPC lines. So
`yields` is not an abstract annotation: it is a claim that a specific timeline row
or NPC line inside that round will carry the sentence. Checkable at authoring.

**DECIDED — 기질 조건절 is removed.** The conditional clauses existed to manufacture
failure in a scenario that had no other way to produce it. The graph now produces
failure structurally: the default edge is the fail edge, and nothing in the agent's
knowledge supports another. No lock is needed, and the agent reasoning its way to
an obvious key is a better thing for the player to read than a lock opening.

This takes `key_conditions`, `key_examples` and the E-K1/E-K2 lint rules with it.
Base 기질 stays — it is what makes the agent a character Call 3 can write as. The
schema change is a *relaxation* (dropping two entries from `required`), so existing
packs stay valid and #220's additive pledge holds; it is still a deliberate edit.

**Nodes are gates.** Each sits at a clock — a **unique** clock (§9.2 A). Each names
its `yields`.

**Edges carry `requires`**: the knowledge the agent must hold for that outcome to be
available to it. `requires` is **necessary, not sufficient** — the agent still
chooses. Every available edge must lead somewhere the scenario can survive.

**One path is the spine** — every edge with empty `requires`. Run 1 traces it.

### 4.2 Properties the graph makes checkable

**(a) Run-1 determinism.** 「무조건 디폴트 스탠스」 becomes: *for every gate, at most
one outgoing edge has an empty `requires`*. Two unconditioned edges means run 1 is a
coin flip, visible on the diagram instead of discovered in a probe.

**Target is p = 1, not 0.81.** The measured 10/10 · 9/10 · 9/10 is not model
misbehaviour — it is the scenario handing the agent a reason to deviate. See §7.

**DECIDED — run 1 passes exactly one gate, and fails it.** The all-default path is
`Start → Gate 1 → Fail 1`: one decision, then the disaster. The agent cannot pass
Gate 1 because every non-default edge out of it requires knowledge that does not
exist anywhere before the disaster has finished happening — the box-52 placement,
stated on the graph rather than on the clock.

This is what makes p = 1 achievable rather than aspirational. Joint determinism
across three gates was always a probability; determinism at **one** gate whose
alternatives have no premise at all is a structural fact. It is also dramatically
correct — the record of a real disaster, seen from the operator's seat, *is* a night
on which nothing could be done.

**DECIDED — hard rule for key placement.** For every edge `e` out of gate `g` with a
non-empty `requires`, no knowledge item in `requires(e)` may be yielded by any node
on a path from `Start` to `g`. If the agent could have picked it up earlier in the
same run, the handoff is not what gated the edge, and the run is no longer
deterministic.

For Gate 1 this reduces to: **its keys live in the consequence tail.** There is no
earlier node.

**(b) Minimum runs to success.** Walk the spine, collect its `yields` as K₁. Run 2
may take any edge whose `requires` ⊆ K₁, reaching new nodes and yielding K₂. Iterate.
**The number of iterations until Success is reachable is the minimum run count, and
it must be ≤ 4** — with slack, see §8.

**(c) Slot budget.** The winning route's total `requires`, summed over its edges,
must fit in the handoff's **four seats** (`slot-board.ts:19`, verified).

**DERIVED — the knowledge count is computed, not chosen.** Total distinct items =
the union of `requires` over all non-spine edges. Nobody picks "3–4 hidden truths";
the graph says how many exist, and if that exceeds four seats, the graph is wrong.

---

## 5. Fail nodes

**DECIDED.** A fail node is **not** a run terminator and **not** a verdict rendered at
상황 종료. It is the point at which **the agent's agency ends while the clock keeps
running**. Reports still arrive; they no longer change the outcome. The remainder of
the disaster plays out and is narrated.

Worked example (민서's): the agent fails to find a way into a burning building. That
is a fail gate. The story then plays out — the building collapses, people die. If the
agent *had* got inside and saved some people and *then* took a fail gate, the story
plays out from that point instead, and the tally differs accordingly.

**DECIDED — every gate has a fail edge, and it is that gate's default edge.** So the
agent fails at the deepest gate it could reach, each run pushes one gate deeper, and
"at most one unconditioned edge per gate" is satisfied without a separate rule.

**VERIFIED — exactly what survives past the fail point.** A dark gate opens in
`effects` phase, so **Call 1 never runs**: no question, no stance set, no agent
utterance. Call 2 still runs on those beats, so the timeline events fire and the
narration and NPC lines keep coming. Call 3 still runs at each round boundary, so
reports keep arriving — observation without judgment.

The tail is therefore: **the agent's voice stops, the world keeps moving, and pages
keep arriving.** The ore is spread across several reports, not one.

**DERIVED — "agency ends" is an authoring obligation, not an engine guarantee.** The
engine has no concept of a fail node; it only evaluates `availability` per gate. A
run has ended agency exactly when every downstream gate's condition fails to hold on
that path. Leave one downstream gate with a loose condition and the agent speaks
again on a night it was supposed to be silent. Checkable: for each fail node, walk
every later node and confirm none of them opens on the state that path leaves.

**DECIDED — the tally is determined by the last node the agent landed on, whatever
route it took there.** Each terminal node names its own outcome. This replaces most
of `score.json`'s ordered 집계 규칙 fence, and it structurally eliminates the class
of bug currently sitting in that file, where `pallet_named and doors_opened` is
shadowed by a weaker rule listed after it.

**DERIVED — therefore, when two paths deserve different tallies, split the node.**
Node determines tally is only honest if a node is never reached by paths that should
score differently. Cheap to enforce while drawing, miserable to retrofit.

It also delivers 「못 막은 런들끼리도 점수가 다르다」 for free: different fail points
are different graph positions, so they score differently without anyone tuning a
ladder.

**DECIDED — the consequence tail is the primary source of route knowledge.** A run
that fails early still narrates the whole disaster, and *that narration is the
briefing for the next run*. This is how run 1 is productive without the agent doing
anything competent, and it means run 1 is **short on agency but full length on
narration** — the right shape for a judge's first sixty seconds.

**DERIVED — fail early, longer tail. The graph self-balances.** A run that ends
agency at Gate 1 narrates the entire rest of the day; a run that ends it at depth 3
narrates very little, and needs very little. Nobody tunes this — it falls out of the
fail-edge-at-every-gate rule.

---

## 6. The ore

**DECIDED — sufficiency, not abundance.** Run 1 does not hand the player every key.
At any point the player has **enough to get the agent to the next gate, by some
route** — possibly the wrong one. Progress is always available; correctness is not.
The player is deducing the scenario's shape at the same time as the agent's
disposition.

**DECIDED.** Knowledge is not one sentence. The same fact exists in several
sentences at different force, and re-mining the same knowledge in a stronger form is
one ordinary move among several — an example of what mining *is*, not a mechanic to
be built around. Escalation must not be the universal answer to "the agent ignored
me," or the deduction collapses into a grind.

**DECIDED — a false lead must lead somewhere on the graph.** Traps are kept (§1.1):
a trap that reaches a fail node costs the player nothing they cannot recover, because
the fail node has a tail and the tail is ore. What is forbidden is a sentence the
agent simply ignores, producing no node and no tail — *that* is the wasted run.

---

## 7. Gate prose

**DECIDED — a gate's scene states the situation, never the contradiction.**

Visibility is not usability. A fact can be present and still unusable because it
arrived too late, was never perceived, was perceived but not yet interpretable, or
was not the agent's to act on. Only the third is easy to get wrong by accident, and
the current draft gets it wrong in exactly one line.

G1's scene prose says 「둘 중 하나는 거짓이고, 상황 보고서에는 하나만 올라간다」.
오세라's 20:55 line 「여기 바람이 안 옵니다」 is harmless on its own — it is a
complaint, and it only becomes evidence once you know the indicator reads circuits
rather than rotation. The scene supplies that interpretation for free, before the
agent decides. **That single sentence is where the 0.81 comes from**, and it is why
hiding timeline rows from the agent's window (PR #220's `excerpt`) was treating a
symptom.

The contradiction is what a handed sentence brings. The scene must not pre-empt it.

---

## 8. Route count and graph shape

**DECIDED — two routes to the good ending.**

- One route: the freedom-of-choice claim dies; the player executes a solution.
- Three or more: the player samples one and takes the rest on faith. Each route needs
  its own knowledge, its own gate and its own seeded experience, and three of those
  cannot be laid down legibly inside the run budget.
- Two: the smallest count where the player can learn both exist and then choose. The
  choice is the drama, and it is the only count where the alternative is experienced
  rather than described.

**Route count is not what demonstrates the LLM freedom.** That is demonstrated at a
single gate by the report explaining its own reasoning. Choose route count for the
run budget; load the demonstration onto **gate recurrence**, which the fail-edge rule
gives for free.

**DERIVED — cross-branch keys are dropped.** A gate's key could legitimately come
from another branch, and that would make exploring a wrong route pay. But per-depth
fail nodes already pay for exploration through their own tails, so cross-branch
buys a second mechanism for the same job — the expensive one, since it stops the two
routes being authorable independently. Reopen only if a specific gate wants it
dramatically.

### 8.1 The draft graph — assessment

The 5-gate / 6-terminal sketch (Gate 1 → {2-1, 2-2} → {3-1, 3-2} → SUCCESS, with a
fail edge off every gate). **The properties it encodes are decided; the topology
itself stays OPEN** — see §10 Q1.

**What it gets right.** Breadth at depth 2, convergence at depth 3 (both 2-1 and 2-2
reach 3-1), two distinct routes to SUCCESS, and a fail edge at every gate giving five
distinct tallies and a visible ramp.

**The problem: as drawn it needs exactly four runs and tolerates no mistakes.** With
one key per tail: run 1 fails at G1 → yields G1's key; run 2 fails at G2-1 → yields
its key; run 3 fails at G3-1 → yields its key; run 4 succeeds. That is the whole
budget with zero slack, and one wrong sentence in run 2 loses the sitting.

**The fix needs no shape change: run 1's tail should yield two keys, not one.** It is
the longest tail in the game (§5) and can afford to. The solve then lands at run 3
with a spare run.

**The cost to price: six consequence tails.** Five fails plus success, each needing
its own tally *and* its own narrated completion. This is the largest authoring item
in the design. The tails differ only in what had already been done when agency
ended, so they can share most of their prose and diverge in the last stretch.

---

## 9. Feasibility against the existing datapack

**Verdict: the model maps. No change to `src/engine` is required.** Verified by
compiling and linting a probe pack with a conditional 4th gate, and by driving
`buildSchedule` directly.

### 9.1 What already works

**Conditional gates are a shipping feature, not a gap.** `availability` is a
`gates.schema.json` field; `compile-datapack.mjs:495` parses it from the gate
header's trailing parens; `driver.ts`'s `gateOpen()` evaluates it per run;
우는다리's G7 already uses it. Verified: a gate authored as

```
### G4 「세 번의 계수」 — 22:20, 하행 갱구 진입 차단 게이트 (요원이 통로를 맡긴 런에서만)
```

compiles to `availability: "요원이 통로를 맡긴 런에서만"` and lints as
`FLAG · G4: availability is free text — promote to a predicate`.

**More than three gates is fine.** No `maxItems`, no lint count rule, no
truth-count or row-count rule anywhere. The old §3 quantities were never enforced.

**"Agency ends, the clock keeps running" is what the engine already does.** A gate
failing `availability` opens in `effects` phase, Call 1 never runs, `current()`
reports `kind: 'script'`, and `advance()` walks to the terminal clock.

**Fail 1 as the baseline works exactly.** `scorer.ts`'s `baselineState()` builds the
counterfactual from `timeline.json` effects flags **only** — no gate flags at all —
so a shallowest fail node that sets nothing lands every unit on its `=>` fallback,
which is the 무개입 baseline. Slot cap is **4** (`slot-board.ts:19`).

**Buckets are edges** (§4.1) and need no new machinery.

### 9.2 What breaks

**(A) Two gates at the same clock silently delete one.** `buildSchedule` does
`slotAt(clock).gate = compileGate(...)` — plain assignment. Probed with G1 and G2
both at 21:30: the schedule returns **only G2**, with no error from the compiler,
the schema, or lint. Nothing anywhere checks it.

This is the most dangerous finding, because a graph *wants* sibling nodes at the same
depth and the instinct is to give them the same clock. **Every node needs a unique
clock**, and it needs a lint rule, because today the failure is invisible.

**(B) A dark gate still owns a round and still owes a report — and this is what we
want.** Verified engine behaviour, deliberate and documented: `assignRounds()`
increments on `beat.kind === 'gate'`, and `kind` is fixed at build time because
availability is runtime state. `schedule.ts:52` and `driver.ts`'s `current()` both
say so outright.

Initially recorded as a cost. It is not. Call 3's input for a dark round is that
round's script events and NPC lines with no gate utterance — so the agent writes a
report about **what happened while it could do nothing**, which is exactly the
consequence tail. Since mining is report-only, without this the tail would be
un-mineable and run 1 would produce no ore at all.

Node count still equals reports per run, so it remains the number to watch — for
latency and desk paper, not for waste.

**(C) E-P5 fires on deeper fail nodes.** Probed: a score predicate reading a flag set
by a gate's default-stance bucket is an ERROR. Every fail node below the first gate
is reached by a default edge (§5), so this trips.

**E-P5's rationale is already stale relative to the engine.** It argues "an empty
handover takes `default_stance` at every gate" — and `scorer.ts` says the opposite in
as many words: 「`default_stance` is what `submitStance` substitutes when CALL 1
FAILED, and nothing else」. The rule guards against something the engine does not do,
and it knows nothing about `availability`. Re-scope it to "the shallowest fail node
sets no flags"; do not delete it.

**(D) Every new flag costs an authored symptom sentence.** Probed: two new bucket
flags produced two ERRORs demanding `symptoms.json` entries.

**(E) A gate attributed to no score unit is a WARN** — "a gate that changes no tally
is decoration". Every node must appear in some unit's `attributed_gates`.

**(F) Format quirk.** `edge_predicates: []` written inline in a yaml card parses as
the string `"[]"` and fails schema validation. Omit the key; it defaults to empty.

### 9.3 The finding that matters for the graph format

**`edge_predicates` is dead wiring.** The vocabulary is real and compiled —
`<flag> == true -> <node>`, `else -> <node>`, evaluated first-true — and
`submitStance` returns the result as `nextNode`. **Nothing in `src/` consumes it.**
Only tests read it.

So the datapack carries **two** graph notations and only one is wired: routing is
done entirely by `availability` on the target gate. The graph format should target
`availability`. Whether `edge_predicates` is adopted or deleted is a decision to make
deliberately rather than inherit.

### 9.4 What was not verified

No `node_modules` in the worktree, so this covers the compiler, the linter, the
schemas, and `buildSchedule`/`gateOpen` read directly. **A full live run with a
conditional gate was not executed end to end** — residual risk sits in
`src/client/driver/live/`, not in the engine.

---

## 10. Open questions

1. **The graph structure itself.** The properties are decided (§8: two routes,
   per-depth fail nodes, fail edge at every gate, run 1 fails at Gate 1). The
   **topology is not** — node count, depth, where the two routes diverge and whether
   they reconverge. §8.1 assesses the current sketch; it is a draft, not the graph.

2. **Graph format.** Mermaid, YAML, or something else, and whether it adopts or
   retires `edge_predicates` (§9.3). Whatever it is, `requires` and `yields` must
   reference node ids, so ids have to be unique and stable.

3. **Does the consequence tail need its own authoring shape?** It is now the primary
   route-knowledge channel (§5) and the largest prose item (§8.1), and the existing
   draft format has no section for it at all.

4. **What the endings are.** Good and bad are decided. Whether fail nodes map to
   distinct endings or to one bad ending with different tallies is not.

5. **Node budget.** Node count sets reports per run (§9.2 B) and symptom sentences
   (§9.2 D) and consequence tails (§8.1). Three costs, one number, not yet chosen.

# Contract — Engine ⟷ Composer

> **Owner:** 윤석 (architecture track). Both sides are this track's, but they are
> **two work units**: one implements the engine, the other the composer, and
> neither may wait on the other. That is what makes this a `contract-` and not a
> section of the engine spec.
> Neighbors: [engine spec](./spec-engine.md) ·
> [call contracts](./contract-calls.md) ·
> [physical architecture](./spec-physical-architecture.md) ·
> [architecture spec](./spec-architecture.md).

## Where the law lives

| Artifact | Role | Drift guard |
|---|---|---|
| `src/engine/index.ts` exported types | the engine's public surface | **`tsc -p tsconfig.core.json`** — a composer call that does not match fails the build |
| `src/composer/index.ts` exported types | what the composer produces | same |
| `src/shared/temperament.ts` | the temperament renderer, pure | same |
| `proxy/src/types.ts` `CallRequest` | the wire shape the composer must fill | ⚠️ none — hand-transcribed across a tier boundary (physical §3.9) |
| this document | the map, and the decisions below | manual |

**The compiler is the drift guard.** No JSON Schema here and no generated file:
both sides are TypeScript in the same `tsc` project, so a mismatch is a build
error rather than a review comment. This is the same device physical §3.4 uses
to enforce isomorphism.

## 1. The problem this solves

Call contracts §6 says *where every slot comes from*. It does not say *what
shape the engine hands it over in*, and with both modules stubs
(`export {}`), two implementers would each invent one.

Two decisions fix that, and everything below follows from them.

**Decision 1 — the engine exposes slot-oriented views, not its state.**
Rejected: a `RunState` snapshot the composer picks through. A snapshot couples
the composer to the engine's internal shape, and every field rename becomes a
two-module change. Slot-oriented views map 1:1 onto call contracts §6's supplier
table, so the table *is* the interface and the two cannot drift apart silently.
The price is that the engine knows slot names — accepted: it already knows
`SCENE_SYMPTOMS` (engine spec §2.3).

**Decision 2 — the round event assembler belongs to the engine.**
It appears exactly once in the repo, in call contracts §6's diagram, with no
owner. It assembles Call 3's `EXPERIENCED` from a round's script events, Call 2
output, and Call 1 `utterance`/`inner_note`. Putting it in the composer would
require the composer to know where a round begins and ends; round boundaries are
engine business (engine spec §3.1). The engine already holds the timeline it
would read.

## 2. The engine's public surface

```ts
/** Everything Call 1 needs that is not the proxy's and not the player's. */
export type GateView = {
  GATE_QUESTION: string
  STANCE_SET: Stance[]
  TIMELINE_EXCERPT: string[]   // most recent 6 lines, never a severed beat (§3.2)
  TEMPERAMENT: TemperamentPack // structured; the composer renders it (§4)
}

/** Everything Call 2 needs. Valid only after the beat's effects are applied. */
export type BeatView = {
  TIMELINE_TAIL: string[]      // most recent 6 lines, never a severed beat
  AGENT_UTTERANCE: string      // this beat's Call 1 `utterance`; "" on a script beat
  FIXED_NPC_ACTION: string
  PRESENT_NPCS: PresentNpc[]
  SCENE_SYMPTOMS: string[]     // renderSymptoms output — never empty (§2.3-5)
}

/** Everything Call 3 needs. Valid only at a round boundary. */
export type RoundView = {
  EXPERIENCED: string[]        // the round event assembler's output (§5)
  TEMPERAMENT: TemperamentPack // the SAME value GateView carried
}

export interface Engine {
  gateView(): GateView
  beatView(): BeatView
  roundView(): RoundView
}
```

**Views are snapshots, not live handles.** Each returns plain data valid at the
moment of the call; the composer must not hold one across a beat. An engine that
returns a mutable reference into its own state fails §8-3.

**`TEMPERAMENT` crosses as structured data, not prose**, and both views carry the
identical object. Call contracts §6 binds Call 1 and Call 3 to *the same*
temperament; passing the same value twice makes that structural instead of a rule
someone has to remember.

### 2.1 ⚠️ `AGENT_UTTERANCE` is missing from call contracts §6

The supplier table lists `TIMELINE_TAIL`, `FIXED_NPC_ACTION`, `PRESENT_NPCS` and
`SCENE_SYMPTOMS` for Call 2, but not `AGENT_UTTERANCE` — even though the slot
exists in the template, in `proxy/src/calls.ts`, and in the probe's validator.
§6's data-flow diagram does show it (Call 1 `utterance` → Call 2), so this is a
gap in the table, not a missing decision. Recorded here; the fix belongs in that
document.

## 3. The composer's public surface

```ts
export type ComposerDeps = {
  reportGuidance: ReportGuidance  // data/policy/report-guidance.json, host-loaded
}

export interface Composer {
  judgment(view: GateView, blocks: Block[]): CallRequest
  narration(view: BeatView): CallRequest
  reporter(view: RoundView): CallRequest
}
```

`CallRequest` is `{call_type, template_version, slots}` — physical §3.10: the
proxy renders both message layers, so the composer assembles **values**, never
prose. The one exception is `TEMPERAMENT` (§4).

**The rule for what the composer receives.** Engine state arrives through a
view. Everything else arrives at construction. `reportGuidance` is policy, not
state, so it is a dependency; `blocks` are the player's and arrive per call.

**The composer never sends a proxy-owned slot.** `FLAW`, `INCIDENT`, and
`PRIORITY_LIST` belong to the default prompt (`proxy/src/default-prompt.ts`) and
are ignored if sent. Emitting them is not an error, but it is dead payload and
§8-4 forbids it.

## 4. The temperament renderer

```ts
// src/shared/temperament.ts — pure, no fs, no DOM
export function renderTemperament(pack: TemperamentPack): string
```

It is in `shared/` because it is a pure function of pack data — no state, no
position in the run — and physical §3.2 permits exactly that there. It cannot
live in the proxy: `proxy/src/prompt.ts` has no `TEMPERAMENT` renderer and
passes the slot through as a string, so the prose must exist before the payload
is sent.

**Invariants**, all testable without deciding the prose:

1. Call 1 and Call 3 receive **byte-identical** output for one pack.
2. Output is non-empty for any schema-valid pack.
3. Output is deterministic — same pack, same string, always.
4. It renders the section header itself. `{TEMPERAMENT}` is a bare slot in
   `judgment/base-v0.4.md` and `reporter/base-v0.2.md`; nothing around it
   supplies one.

### 4.1 ⚠️ Open — the prose shape is not specified, and cannot be invented here

The pack is structured (`default_disposition` + up to 2 `clauses` of
`{axis, axis_vocabulary, condition, defeat_condition}`). The prompt wants prose.
**The mapping between them is not mechanical, and no authored exemplar of the
target shape exists for a real pack.**

The only exemplar is `tools/probe/fixtures/temperament/k1.md`, and it is **a
different agent than any pack** — it carries one exception clause in the form
"단, 하나의 예외가 있다 … 그때는 X" plus a closing line about judging only from
what is currently seen and heard, whereas `우는다리/temperament.json` has two
clauses, each with an explicit `defeat_condition`. Deriving a template from one
sample of a different character would be inventing game content.

**Owner: S + D** (architecture spec §9 already assigns the authored temperament
roster to them). Until it lands, the pipeline should implement `renderTemperament`
against the invariants above with a **provisional** shape marked as such in the
source, and the first real pack rendering is a paper check, not a unit test.

This is the one item in this contract a work unit must not resolve on its own.

## 5. The round event assembler

Engine-owned (Decision 2). It produces `RoundView.EXPERIENCED`.

**Input** — everything that happened in the round, which engine spec §3.1
defines as `[gate beat] + [script beats up to just before the next gate]`:

| Source | Contributes |
|---|---|
| the gate beat's Call 1 | `utterance` and `inner_note` |
| every beat's Call 2 | `timeline_entries` and `npc_lines` |
| script events in the round | the events themselves, as rendered to the timeline |

**`inner_note` is Call 3's only consumer** (call contracts §6). It enters
`EXPERIENCED` and reaches the player only through the report. The engine must
not place it on the timeline, and no other view may expose it — §8-5 tests this.

**Output** — one line per event, in occurrence order, as `string[]`. Ordering is
the timeline's, so a round's `EXPERIENCED` is reconstructible from the run record
(contract-run-artifacts §1) rather than being a second, divergent log.

## 6. Ordering

The composer is a pure function of a view, so *when* it is called is entirely the
engine's schedule. Engine spec §4 fixes it; restated here as the sequence the two
sides must agree on:

```
gate beat    gateView() → judgment() → proxy → stance
             → apply delta → bucket → edge predicates → next node   (§4.1)
             → engine renders the fixed action and the utterance to the timeline
             → beatView() → narration() → proxy
script beat  apply effects → journal → renderSymptoms
             → beatView() → narration() → proxy                     (§4.2)
round end    roundView() → reporter() → proxy
```

**`beatView()` is invalid before this beat's effects are applied.** Engine spec
§4.2 requires `SCENE_SYMPTOMS` to show *this* beat's consequence; a view taken
early slips symptoms one beat behind their cause, and nothing in engine spec §7
catches it. An engine that can return a stale `beatView()` fails §8-2.

## 7. What each side may not do

| Side | Forbidden |
|---|---|
| engine | rendering prose other than symptoms (§2.3) and timeline lines; knowing `template_version`; knowing the proxy exists |
| composer | holding a view across a beat; reading the datapack directly; deciding what a round is; sending a proxy-owned slot |
| both | DOM, `fs`, `fetch`, timers, randomness (physical §3.2) |

The composer not reading the datapack is the load-bearing one. Every scenario
value it needs arrives through a view, so "which gate are we at" stays in one
place. A composer that loads a pack has taken over run position, and two things
now track it.

## 8. Acceptance criteria

Executable, in the style of engine spec §7 — a work unit is done when these pass.

| # | Criterion | How it is verified |
|---|---|---|
| 1 | Every slot in call contracts §6 has exactly one supplier in this document | A test enumerates the §6 table against `GateView ∪ BeatView ∪ RoundView ∪ ComposerDeps ∪ PROXY_OWNED_SLOTS` and fails on any slot in neither, or in both |
| 2 | `beatView()` reflects this beat's effects | Fixture: a beat whose effect moves `trust`. Taking the view after the beat yields a non-`(변화 없음)` `SCENE_SYMPTOMS`; an implementation that returns the pre-effect view fails |
| 3 | Views are snapshots | Mutate a returned view; the next view is unaffected, and engine state is unchanged |
| 4 | The composer emits no proxy-owned slot | `judgment()` output has no `FLAW`, `INCIDENT`, `PRIORITY_LIST` key |
| 5 | `inner_note` reaches Call 3 and nothing else | Run a round; `inner_note` appears in `RoundView.EXPERIENCED` and in no `GateView` or `BeatView`, and on no timeline line |
| 6 | Call 1 and Call 3 get the same temperament | `renderTemperament` output is byte-identical across the two views of one round |
| 7 | The composed payload is accepted by the proxy | `judgment()` output passes `proxy/src/handler.ts`'s envelope validation and `CALL_SPECS.judgment.buildTool` without error |

Criterion 1 is the one that keeps this document honest: it fails the moment §6
gains a slot nobody assigned. Criterion 7 is the seam test — it is the only one
that crosses the tier boundary, and it runs offline against the proxy's own
validators, not against AWS.

## 9. Open

- **The temperament prose shape** (§4.1) — S + D. The only item here a work unit
  must not decide alone.
- **`TIMELINE_EXCERPT` / `TIMELINE_TAIL` caps** — 6 lines is provisional (engine
  spec §3.2) and retunes on the RUNLOG A4 latency measurement. The interface does
  not change when the number does.
- **`AGENT_UTTERANCE` in call contracts §6's supplier table** (§2.1) — a table
  gap, fix belongs in that document.
- **Whether `ComposerDeps` grows.** `reportGuidance` is the only non-state input
  today. A second one is a signal to check whether it is really state.

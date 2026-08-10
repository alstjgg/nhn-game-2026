# Atoms — S11a implementation build-record (engine)

Snapshot: 5a3c388..HEAD, 2026-08-10.
Coverage: FULL for the engine build-record. Read in full: all engine-side
discovery units `discovery/e0.md` … `discovery/e10.md` (13 files: e0–e10 plus
`live-provider-prerequisites.md`), and every engine-relevant section of the root
`DISCOVERY.md` — the `[e5]`/`[e10]` bullets under §Spec gaps and §Reference
ambiguities, and the whole §"Cross-run reconciliation — the engine build meeting
the client build" (lines 1023–1153, incl. its W4, C8-expiry and e2e-workflow
subsections). SAMPLED-ONLY, not mined here (client slice `u0`–`u11`, belongs to a
separate sweep): `DISCOVERY.md` lines 100–1022 and 1168–1531, and the
`discovery/u*.md` files — opened only to confirm they are client-unit material.
Event dates are best-effort: the autonomous engine run integrated ~2026-08-03/04
with a final-PR review (#116) on 08-04; the W4 reversal is dated 08-08 in source.
Korean quoted verbatim.

---

### S11a-001 — `ReportGuidance` had two candidate owners in one wave
- source: discovery/e0.md §Seam friction
- date: 2026-08-03?
- lanes: 2 AI-building-the-game
- event: `contract-engine-composer §3` made `ComposerDeps.reportGuidance` a `ReportGuidance`, but e1 owned `src/shared/report-guidance.ts` and e0's exclusive `file_globs` barred it from writing that module, so e0's skeleton had to type the field structurally. `tests/scaffold/skeleton.test.ts` was written to assert only `ComposerDeps extends { reportGuidance: unknown }` so the two units could not collide.
- tension: A single type had two plausible homes across parallel units; e0 deliberately under-specified the field and named e5 as the unit that reconciles, rather than mint a second copy.
- flags: seam-friction, decision

### S11a-002 — e0 derived the run-loop type names the contract left open
- source: discovery/e0.md §Reference ambiguities
- date: 2026-08-03?
- lanes: 2 AI-building-the-game
- event: The e0 read-scope called `contract-engine-composer §9` the "run-loop manager surface", but §9 only fixes *where* the run-loop lives (`src/runloop/`, isomorphic, no DOM) and says its `meta` shape "settles when it is built". e0 derived the concrete `RunLoop`/`MetaStore`/`MetaState` names the tests pin from PRD decisions 13 and 15 plus `data/runs/_schema/meta-state.schema.json`.
- tension: A named "surface" in the contract was actually an open-items list; the schema was treated as the authority on persisted field names (`pack_slug`, `run_count`, `exposure_clock_reached`, `carried_blocks`, `report_archive`) rather than the prose.
- flags: decision, seam-friction

### S11a-003 — Sentence-id width read as a minimum, not a cap
- source: discovery/e0.md §Reference ambiguities
- date: 2026-08-03?
- lanes: 2 AI-building-the-game
- event: `§2.0`'s id examples (`b-r1-n02`, `b-r1-f01`) are two-digit and 1-based and nothing says what a 100th sentence looks like. e0's tests pinned `padStart(2, '0')` semantics — index 100 mints `b-r1-f100` rather than truncating.
- tension: A formatting ambiguity was resolved against a downstream invariant: truncation would collide two ids and archive highlighting is keyed on them.
- flags: decision, boundary

### S11a-004 — e1 built against the prompt JSON, not its own ratified spec
- source: discovery/e1.md §1
- date: 2026-08-03?
- lanes: 2 AI-building-the-game
- event: `.claude/super/units/e1/spec.md` (00:29) and `design.md` (00:38) existed in the run and predated e1's impl commit `072f3ab` (00:52), but were never copied into the e1 worktree, so the agent built against the prompt JSON alone and never saw its own ratified spec. Three MAJOR items the spec already settled — `TemperamentPack`, the literal header, and total/never-throw renderers — shipped diverged and were fixed on the integration branch.
- tension: A worktree-provisioning gap in the harness (sibling super-pipeline repo) let a unit ship out of agreement with a spec that existed; the fix is harness-side, not correctable from the unit's output.
- quote: "the artifacts were written before TEST/IMPLEMENT ran, not skipped … a worktree-sync gap"
- links: S11a-013 (e3 same gap), S11a-020 (e8 same gap)
- flags: failure, seam-friction

### S11a-005 — e1's temperament header shipped wrong, re-aligned to the spec regex
- source: discovery/e1.md §4
- date: 2026-08-04?
- lanes: 2 AI-building-the-game
- event: The ratified spec (A4 / decision 6) had already picked the bold-line header style `/^\*\*.+\*\*$/` from exemplar `tools/probe/fixtures/temperament/k1.md`, but the shipped renderer emitted `HEADER = '[기질]'`, matching none of A4's assertions. The integ-fix pass re-aligned both renderer and test: the renderer now emits `**너의 기질 — 이것은 협상 대상이 아니다.**`.
- tension: A consequence of the worktree-sync gap — the header the unit invented had to be reversed to the one the unseen spec specified; the header is now spec, no longer merely an exemplar.
- quote: "**너의 기질 — 이것은 협상 대상이 아니다.**"
- links: S11a-004
- flags: reversal

### S11a-006 — Two engine modules gated by one test file, on purpose
- source: discovery/e1.md §2
- date: 2026-08-03?
- lanes: 2 AI-building-the-game
- event: e1's gate is `npm test -- tests/shared/temperament.test.ts` and its writable test glob is `tests/shared/temperament.*`, yet the unit ships two modules (`temperament.ts` and `report-guidance.ts`). A sibling `report-guidance.test.ts` would sit outside the gate, so a broken renderer would ship green; the report-guidance suite was folded inside `temperament.test.ts` (suite `[e1] renderReportGuidance`).
- tension: The file name under-describes its contents by one module — chosen deliberately as cheaper than an ungated module.
- flags: decision, seam-friction

### S11a-007 — Only one of the two prompt slots renders its own header
- source: discovery/e1.md §5
- date: 2026-08-03?
- lanes: 2 AI-building-the-game
- event: e1's read-scope named the contract and data files but not the prompt templates, which had to be opened to assert invariant 4's "bare slot" premise. `{TEMPERAMENT}` is bare in both judgment/reporter base templates, but `reporter/user-v0.2.md` supplies a `[보고 지침]` header directly above `{REPORT_GUIDANCE}` — so `renderReportGuidance` must NOT render a header while `renderTemperament` must.
- tension: The unit title called both slots "bare"; only one is, and the difference is load-bearing for byte-parity with the proxy prompt.
- flags: decision, boundary

### S11a-008 — e2 reconstructed 14 ACs and the state-core surface from docs
- source: discovery/e2.md §Read-scope misses
- date: 2026-08-03?
- lanes: 2 AI-building-the-game
- event: `.claude/super/units/e2/spec.md` and `design.md` were absent from the e2 worktree (only `progress.json` present), so the ratified 14 binary ACs and the ratified state-core surface were unavailable. The suite reconstructed both from `docs/spec-engine.md` §1.1–§4.2 and `docs/plan-engine-build.md`.
- tension: The same worktree-sync gap forced the TEST phase to define the module's exported surface itself rather than test an agreed one.
- quote: "If that spec is recovered, the signatures below are the first thing to reconcile."
- links: S11a-004
- flags: seam-friction

### S11a-009 — e2's state-core signatures were the TEST agent's call
- source: discovery/e2.md §The surface this suite pins
- date: 2026-08-03?
- lanes: 2 AI-building-the-game
- event: Absent a design doc, e2's TEST phase pinned `initState`/`applyEffects`/`renderSymptoms` as a signature stub, and made three choices it flagged as its own: `applyEffects` mutates `state` in place and returns only its journal slice; `initState` takes `Characters` alone (clock/route.node seeding left unasserted); `{who}` substitution takes an injected variable→name map rather than reading `characters.json`.
- tension: Real seam shapes were minted by the test rather than ratified; each was recorded as reversible if e3 (the beat-loop owner) needs a different one.
- flags: decision

### S11a-010 — "the three hard errors" was a mis-count in the spec
- source: discovery/e2.md §Ambiguities resolved against the spec
- date: 2026-08-03?
- lanes: 2 AI-building-the-game
- event: `spec-engine §2.3` closed with "All three hard errors (2, 3, 7)", but rule 3 is the sort key and rule 2 says the renderer *trusts* the array is authored in `min` descending order and does not defensively sort. The two readings are mutually exclusive at test level; e2 took the explicit one — a mis-ordered array is rendered by iteration order, not re-sorted and not thrown on (test 10).
- tension: The unit's own AC listed exactly two throws, so a third "hard error" in the prose contradicted the acceptance criteria; the suite resolved toward the AC.
- flags: contradiction

### S11a-011 — A no-op flag write showed the player a change that hadn't happened
- source: discovery/e2.md §Left untested on purpose (CLOSED in #116 finding F)
- date: 2026-08-04
- lanes: 2 AI-building-the-game
- event: A `true → true` flag write reached §2.3-2, *matched*, and rendered its `set` sentence, so the player was shown a state change that had not occurred. Final-PR review #116 finding F closed it by extending §2.3-1's magnitude-0 drop to flags — reading the rule's stated reason ("state did not move, so there is no symptom to show") rather than the arithmetic it was phrased in.
- tension: The originally-flagged guess had been struck through as "almost certainly wrong"; the real shipped behaviour was neither guess, and the 우는다리 pack was one authoring edit from firing it (G3/G5 each assert one flag from two buckets, and static lint cannot see which pair a run visits).
- quote: "state did not move, so there is no symptom to show"
- flags: failure, reversal

### S11a-012 — `{who}` substitution shipped unwired; a literal brace would reach the live prompt
- source: discovery/e2.md §`{who}` substitution is unwired
- date: 2026-08-04
- lanes: 2 AI-building-the-game
- event: `src/engine/index.ts:180` calls `renderBeatSymptoms(entries, symptomsPack)` with no `owners` argument, so `{who}` is never substituted; a `git log -S'{who}'` over the run's commits returned nothing. Nothing renders it today (the shipped 우는다리 `symptoms.json` uses 발신자 literally), but the first live Bedrock call would send a literal `{who}` into the Call 2 prompt.
- tension: Wiring it needs an owner map the state core deliberately does not hold (§1.1a made NPC meters beyond the bound pair authoring annotation, not engine state), so fixing it would be a signature change against e0's frozen surface during a review round — deferred as a live-provider prerequisite. The reviewer's own position: it was a deferral record, not a feature request.
- quote: "one line of deferral record resolves this — I am not asking for the feature."
- links: S11a-046 (live prereqs)
- flags: boundary, ai-limit

### S11a-013 — e3's read-scope omitted the type sources its tests had to import
- source: discovery/e3.md §Read-scope misses (TEST + BUILD)
- date: 2026-08-03?
- lanes: 2 AI-building-the-game
- event: e3's read scope named `spec.md` and spec sections but not `src/shared/datapack.ts`, `src/engine/index.ts` or `src/shared/contracts.ts`, which the fixtures had to import for `Timeline`/`Gates`/`Characters` and the view/stance types. At the BUILD phase `spec.md` and `design.md` were entirely absent from the worktree — the highest-priority "read this first" item — so the contract was taken from the TDD-red suites plus the three flagged type sources.
- tension: Both the decomposer's scope list and the harness's worktree provisioning left a unit building from tests and prompt notes rather than its ratified spec; the decision labels quoted in the code (D1–D-G, A1–A10) came from `tests.md`, not a readable spec.
- flags: seam-friction

### S11a-014 — e4 exported the two supplier sets the contract named but nothing declared
- source: discovery/e4.md §Spec gaps
- date: 2026-08-03?
- lanes: 2 AI-building-the-game
- event: `§8-1` unions `GateView ∪ BeatView ∪ RoundView ∪ ComposerDeps ∪ PROXY_OWNED_SLOTS`, but neither `ComposerDeps`'s slot list nor `PROXY_OWNED_SLOTS` existed anywhere under `src/`. e4's test reads the slot list from `docs/contract-calls.md §6` on disk (a restated list would test itself) and required e4 to export `PROXY_OWNED_SLOTS` and `COMPOSER_DEP_SLOTS`, both names transcribed from §8-1's wording.
- tension: A contract closure referenced sets that had no in-repo home; e4 minted them and named e5 as the unit that should re-point rather than keep a second copy.
- flags: decision, seam-friction

### S11a-015 — e4 added a third soft-drop the disposition table did not list
- source: discovery/e4.md §Spec gaps
- date: 2026-08-03?
- lanes: 2 AI-building-the-game
- event: `§6`'s disposition table lists two `npc_lines` drops; spec decision 6 added a third — a line arriving without the `"<id>: "` prefix (`missing_prefix`) — tested as a drop, not a throw, on the ground that the engine never throws on model output.
- tension: The engine's "never throw on model output" principle drove adding an undocumented drop rule rather than a defensive error.
- flags: decision, boundary

### S11a-016 — e4 consumed e0's landed names verbatim where the spec had assumed others
- source: discovery/e4.md §Implementation deltas (decision 14)
- date: 2026-08-03?
- lanes: 2 AI-building-the-game
- event: e4 tabulated four spec-vs-reality deltas and consumed e0's actual exports as-is: `mintSentenceId(run, channel, index)` for the assumed `mint(...)`; the four-function parse family for the assumed `parse(id)`; `segmentReportBody` returning `string[]` (over which e4 mints `b`) not `Sentence[]`; and fresh `BeatFeedInput`/`RoundInput`/`FeedResult` types in `feed/types.ts` because `src/engine/index.ts` shipped only `Engine.feed(): FeedLine[]`.
- tension: Decision 14 ("e0 wins") governed integration: later units bend to what e0 actually landed rather than to what their own specs assumed.
- links: S11a-017, S11a-018 (same "e0 wins" premise in e6/e7)
- flags: decision

### S11a-017 — e4 aliased `TemperamentPack` twice to keep the folder's import direction
- source: discovery/e4.md §Implementation deltas
- date: 2026-08-03?
- lanes: 2 AI-building-the-game
- event: A12 forbids `src/engine/feed/**` from importing `src/engine/index.ts`, so `feed/types.ts` aliases `datapack.ts`'s `Temperament` exactly as `src/engine/index.ts` does — a deliberate one-line duplication, both pointing at the one authored shape so they cannot drift.
- tension: A dependency-direction rule was honoured by duplicating a type rather than crossing a banned import edge.
- flags: decision

### S11a-018 — e6 built on e0's landed transport surface, not the spec's proposed one
- source: discovery/e6.md §Spec assumptions resolved during build
- date: 2026-08-03?
- lanes: 2 AI-building-the-game
- event: Spec assumption 1 ("e0 not merged") was void: e0's `src/transport/index.ts` skeleton was already present with `send`/`TransportDeps`/`TransportResult`/`createTransport` (per D-14 "e0 wins"). e6 built on that 2-branch `TransportResult` rather than the spec's proposed `call`/`CallOutcome`/`FetchLike` surface, adding `FetchLike`/`FetchResponseLike` underneath as the raw fetch-adaptation boundary.
- tension: The integration rule "e0 wins" repeatedly overrode a unit's own spec-proposed API.
- links: S11a-016, S11a-019
- flags: decision, reversal

### S11a-019 — A retry-counter regex swept a variable from an unrelated statement
- source: discovery/e6.md §A5's regex scan is stricter than "no numeric literal"
- date: 2026-08-03?
- lanes: 2 AI-building-the-game
- event: e6's offender scan used `[^=]*` for the type-annotation gap, which matched across newlines and statements until the next literal `=`; a `let attempt: Attempt` with no inline initializer, followed later by `callCount += 1`, was swept into a false match (`attempt = 1`). Fixed by renaming the loop variable to `outcome` and annotating `RETRY_BUDGET: number` to break the `= 1` adjacency.
- tension: A guard meant to forbid magic numbers over-triggered on a benign declaration; the workaround was to name identifiers so no `attempt`/`retr(y|ies)`/`budget` name is ever bound with `=`.
- flags: seam-friction, failure

### S11a-020 — e6 split the 500 header rule from the pure status-grader
- source: discovery/e6.md §Header-honouring rule for a 4xx/500
- date: 2026-08-03?
- lanes: 2 AI-building-the-game
- event: `gradeStatus()` is a pure lookup whose unit tests require `gradeStatus(500,{fallback:'true'},null).fallback === true`, but full-transport AC A2 requires a 500 to force `fallback:false` even with an injected `x-llm-fallback: true`. Resolved by keeping `gradeStatus` as tested and adding a caller-side `headerForGrading` filter in `index.ts` that drops the header for any non-retryable row (`STATUS_ROWS[status].retry === false`).
- tension: A pure function's contract conflicted with a system-level requirement; the fix read the "is the header eligible" decision off the same data table (OCP) rather than naming 500 specifically.
- flags: decision

### S11a-021 — e5's composer needed the block store the frozen `ComposerDeps` omits
- source: discovery/e5.md §1
- date: 2026-08-03?
- lanes: 2 AI-building-the-game
- event: `contract-engine-composer §3` says the composer resolves ids "through the block store the driver passes in", but the `ComposerDeps` literal lists only `reportGuidance` and e0 transcribed it exactly (`{ reportGuidance: unknown }`); the views are §2-frozen so the store cannot ride in one. e5's `createComposer` takes `ComposerDeps & { reportGuidance: ReportGuidance; blocks: BlockStore }` (exported as `ComposerRuntimeDeps`), one intersection that adds the store and narrows `unknown` to e1's canonical type.
- tension: A construction dependency named in prose was absent from the frozen type; the intersection closes it reversibly, and e5 named e7 as the natural place to reconcile.
- flags: decision, seam-friction

### S11a-022 — Spec S1 mislocated the engine views; e5 corrected the import edge
- source: discovery/e5.md §2
- date: 2026-08-03?
- lanes: 2 AI-building-the-game
- event: Spec S1 assumed `GateView`/`BeatView`/`RoundView` could be imported from `./index.ts`, but e0's barrel imports them from `../engine/index.ts` without re-exporting, so e5 imports the views from `../engine/index.ts` (type-only, since a value import of `../engine/` is banned by A18) and only `Composer`/`ComposerDeps` from `./index.ts`.
- tension: The spec's assumed module boundary was wrong; the test's source scan strips `import type` lines precisely so the type edge stays legal.
- flags: reversal

### S11a-023 — An unresolved block id throws before any request is built
- source: discovery/e5.md §3
- date: 2026-08-03?
- lanes: 2 AI-building-the-game
- event: e5's `resolveBlocks` de-duplicates, sorts, then resolves every id before any `CallRequest` is constructed; the first miss throws `Error("unknown block id: <id>")` and nothing partial escapes.
- tension: Skip-and-continue would let two runs with "the same" block set compose different bytes, corrupting a C-BLOCK comparison invisibly — the determinism property §8-10 exists to protect; recorded as a default, reversible by a reviewer preferring skip-and-continue.
- flags: decision

### S11a-024 — Block order uses `Array#sort`, never `localeCompare`
- source: discovery/e5.md §5
- date: 2026-08-03?
- lanes: 2 AI-building-the-game
- event: Canonical block order is `[...new Set(ids)].sort()` — UTF-16 code-unit order, locale- and ICU-independent, identical in Node and browser. A10b asserts the two orders differ for the Hangul-id fixture set, so a future `localeCompare` swap fails loudly.
- tension: Determinism ("same block set ⇒ same bytes") drove rejecting a more human-readable sort that varies with host ICU data.
- flags: decision

### S11a-025 — e7 was the run's first real integration of five engine leaves
- source: discovery/e7.md (preamble + §Spec assumptions)
- date: 2026-08-03?
- lanes: 2 AI-building-the-game
- event: e7 bound e2's state core, e3's beat driver, e4's feed builders, e5's composer and e6's transport behind one object speaking the §5.2 seam. Spec §4's premise "e0 has not landed" was void — all of `src/driver/`, `src/engine/`, `src/composer/`, `src/transport/**` were present — and e6's `TransportResult` landed exactly as §4 assumed, so `TransportPort = Transport` verbatim with no adaptation.
- tension: The first point where the parallel units met; the build ran against landed names, and no e0 file was rewritten.
- flags: milestone, decision

### S11a-026 — e7 added `createLiveDriver` beside the throwing stub rather than rewire the barrel
- source: discovery/e7.md §Spec assumptions resolved (item 3)
- date: 2026-08-03?
- lanes: 2 AI-building-the-game
- event: `tests/scaffold/skeleton.test.ts` (outside e7's globs) asserts `createEngine`/`createComposer`/`createDriver` each throw `unimplemented: <symbol>`, so rewiring either barrel would turn that suite red. e7 edited neither, left `createDriver` a throwing stub, and added `createLiveDriver` beside it (OCP); the "barrel wiring" checklist item was DROPPED.
- tension: A scaffold guard in another unit's glob forced integration to grow a new export rather than complete the intended one; whoever ratifies the engine's construction shape retires the stub.
- flags: decision, boundary

### S11a-027 — The driver wraps and never mints; recovery is the engine's
- source: discovery/e7.md §Decisions taken (1) + §Ports declared here
- date: 2026-08-03?
- lanes: 2 AI-building-the-game
- event: e7 decided the driver keeps a per-beat cursor and emits only the tail on each flush — `engine.feed()` returns lines with ids already minted — splitting a beat into a pre-narration flush and post-narration flush. Its three ingest points take `T | null` and `null` IS the fallback path; the driver branches once on `result.ok` and never on a grade, because substituting a gate's `default_stance` needs a field `gateView()` deliberately does not expose.
- tension: Fallback recovery was placed firmly in the engine, not the driver — the driver is structurally unable to perform it, which the docs left silent.
- flags: decision, boundary

### S11a-028 — `assertSeamClean` re-implemented rather than imported across the client boundary
- source: discovery/e7.md §Decisions taken (7)
- date: 2026-08-03?
- lanes: 2 AI-building-the-game
- event: `src/client/**` is a frozen glob and `src/driver/` may not reach into it, so e7 re-stated the seam-clean rule at `src/driver/seam-guard.ts` rather than import u2's `src/client/driver/seam-guard.ts`. Two copies now exist; the driver copy *returns* the checked event (the client copy returns `void`).
- tension: An import-direction ban produced deliberate duplication; consolidating both into `src/shared/` was left as a later unit's call.
- flags: seam-friction, decision

### S11a-029 — The beat split around Call 2 could not be two `buildFeed` calls
- source: discovery/e7.md §Seam friction the next unit inherits (1,2)
- date: 2026-08-03?
- lanes: 2 AI-building-the-game
- event: `buildFeed` is all-at-once, but the ratified seam splits the beat around Call 2; a second `buildFeed` would re-mint `u`. e7's harness worked around it by calling `buildFeed` with `narration` omitted for the pre-slice and `classifyNpcLines` + `ids.next(...)` for the post-slice — which moved the *emitted* order to `t* → u → symptom → n → q` (id order unchanged, D1 golden still holds).
- tension: A `buildPreFeed`/`buildNarrationFeed` split belongs in `src/engine/feed/`, not the driver — a driver re-implementing the mint order is exactly the drift the D1 golden exists to stop; flagged before the client pins a layout to the moved symptom rows.
- flags: seam-friction

### S11a-030 — The engine's construction root was a test harness until integration
- source: discovery/e7.md §Seam friction (3)
- date: 2026-08-04
- lanes: 2 AI-building-the-game
- event: The object binding e2+e3+e4 into one `EnginePort` was `tests/driver/engine-fixtures/scripted-engine.ts` — a test harness — because decision 1 forbids shipping it under `src/driver/` (id minting) and `src/engine/index.ts` was frozen as a stub. It called the real merged slice (`buildSchedule`, `createBeatDriver`, `initState`, `buildFeed`, `assembleExperienced`, …). RESOLVED at integration: the composition root shipped, the harness was deleted, and both rigs re-point at the real `createEngine`.
- tension: The product's own factory lived in test code mid-run; e7 recommended whoever implements `createEngine` lift that glue verbatim.
- flags: milestone, reversal

### S11a-031 — The inner-note leak survived even with no model in the loop
- source: discovery/e7.md §Seam friction (4) — Overturned in #116 finding A
- date: 2026-08-04
- lanes: 2 AI-building-the-game
- event: e7 first argued the key-level guard cannot catch a reporter echoing its `EXPERIENCED` slot (which carries `[속내] <inner_note>`) back verbatim, and deferred it to the reporter prompt. #116 finding A overturned the conclusion: spec-engine §5's Call 3 fallback fills `facts` from `assembleExperienced` itself, so a run with no model at all minted `[속내] …` on the `f` channel where the `report` ViewEvent emits it verbatim. Fixed at the engine mint boundary — `assembleObjectiveLog` as a separate assembly and `withholdInnerNote` dropping any fact that verbatim-contains the note, on both paths.
- tension: A "this is a prompt concern, not a seam concern" deferral left a real leak live on the offline path; the fix moved to the one boundary both paths pass through, and `report_body` was deliberately NOT filtered (the note "leaks only through the report" is the sanctioned path). The fixture reporter was left echoing on purpose as the adversary the guard is tested against.
- quote: "\"fixing\" the double would make the suite green over an engine with no guard while a real reporter still leaked."
- links: S11a-047 (live prereq #6)
- flags: failure, reversal

### S11a-032 — The block store's two tiers make deploying an unmined id impossible by construction
- source: discovery/e7.md §Small things
- date: 2026-08-03?
- lanes: 2 AI-building-the-game
- event: e7's store has two tiers — `seen` (every emitted feed line + report sentence) and `mined` (what `blocks()` returns and the composer resolves against) — so deploying an unmined id is impossible by construction, not by a check; `deploy` is canonicalised twice (membrane, then e5's `resolveBlocks`); `new_run` submitted mid-`step()` is honoured at that step's end so a round is never severed before its report.
- tension: Structural invariants were preferred to runtime checks; recorded so nobody re-derives them.
- flags: decision

### S11a-033 — e8 widened another unit's skeleton census with an additive flag
- source: discovery/e8.md §1
- date: 2026-08-03?
- lanes: 2 AI-building-the-game
- event: e0's skeleton census asserts `createRunLoop({} as never)` throws `unimplemented: createRunLoop`, but the first unit to implement any of the five factories necessarily invalidates its own row. e8 applied the pre-agreed additive fix: `ModuleSpec` gains optional `implemented?: true`, the `runloop` row sets it, and the §3 describe iterates `MODULES.filter((m) => !m.implemented)` — narrowing exactly one describe.
- tension: A correct scaffold guard becomes wrong the moment behaviour lands; e8 noted e9–e12 each need the same one-line edit and suggested the harness make it a shared-file allowance.
- flags: decision, seam-friction

### S11a-034 — `meta.archive[].run` cannot be made fully truthful under the frozen schema
- source: discovery/e8.md §3a — #116 finding E
- date: 2026-08-04
- lanes: 2 AI-building-the-game
- event: `metaEvent()` filled `archive[].run` with the array index (`i + 1`), which is not the run number: `startRun()` advances `run_count` (a started-but-unended run still counts) while `endRun()` appends, so start-3/end-1-and-3 mislabels the second archived id. Fixed for every run the current session opened (`endRun` records `run_id → run_count` at archive time), but the pairing cannot be persisted: `report_archive.items` is a bare string array under `additionalProperties:false` and `run_id` has no documented grammar.
- tension: After a reload `metaEvent()` falls back to position — exact when `report_archive.length === run_count`, a lower bound otherwise — a residual that is a schema limit, not a bug, and cannot be lifted without a frozen `data/runs/_schema` revision.
- flags: failure, boundary

### S11a-035 — e8 chose the sessionStorage key no document names
- source: discovery/e8.md §2
- date: 2026-08-03?
- lanes: 2 AI-building-the-game
- event: `spec-physical-architecture §1.1` and `spec-client §9` bind meta-state to `sessionStorage` but no document names the key; e8 picked `dday.meta.` + pack slug (`metaKey(slug)`), constrained only relationally by its tests (`metaKey(s) === META_KEY_PREFIX + s`).
- tension: A persistence key was minted by the unit and flagged as the one line to reconcile if the client track has a key convention in flight.
- flags: decision

### S11a-036 — e9 bound an `EnginePort` over three leaves because the engine factory was still a stub
- source: discovery/e9.md §1
- date: 2026-08-03?
- lanes: 2 AI-building-the-game
- event: By e9's base, e7 had merged (`64d42af`) so `createLiveDriver` drives the run, but `src/engine/index.ts` `createEngine` still throws `unimplemented`. `tools/driver/run/bind.mjs` therefore assembles an `EnginePort` over the three merged leaves (`createBeatDriver`, the state core, the feed builders) through their declared ports.
- tension: The same missing product factory forced a tool to hold assembly glue; e9 flagged that this is a product concern (the browser bundle needs the same object) and that `createEnginePort` should collapse into `createEngine` when it lands.
- links: S11a-030, S11a-043
- flags: seam-friction, boundary

### S11a-037 — `mined_from_run` had a structurally dead branch and always answered null
- source: discovery/e9.md §8 — review finding B
- date: 2026-08-04
- lanes: 2 AI-building-the-game
- event: The first cut wrote `block.mined_from_run ?? null` over a `Block` that is only `{id, text}`, so the `??` branch was structurally dead and every record asserted `null` — documented as "mined from the script timeline" — even for blocks a previous run had minted. A definite wrong answer. Now derived from the id (`b-r<run>-…` → the archived `run_id`; `t<n>` → null; neither, or run absent from the archive → throws).
- tension: A required schema field was being filled with a false value; the honest carrier is the type (`Block` growing a provenance field), but both `Block` and the meta-state schema are frozen for this unit, so the id-derived lookup stands in.
- flags: failure, reversal

### S11a-038 — A failed Call 3 made the whole run unrecordable
- source: discovery/e9.md §9 — review finding C
- date: 2026-08-04
- lanes: 2 AI-building-the-game
- event: `reports.report_body` has `minLength: 1` in the frozen schema and the record quotes Call 3 verbatim (A12 bans re-joining the segmented `Sentence[]`), so a fallen-back reporter had no legal record; `assembleRecord` used to fabricate `{facts:[],report_body:""}` and the CLI wrote it outside the `--validate` branch. Both halves closed: the fabrication throws, and every write is now validated regardless of `--validate`.
- tension: The throw takes the whole run with it — 19 beats, journals, and the `fallbacks[]` array that documents the failure — which for a measurement program (stage 6) drops exactly the runs it should study; recording it needs `reports` nullable, a frozen `data/**` change.
- links: S11a-046
- flags: failure, boundary

### S11a-039 — e9's committed sample was self-confirming; the review turned it into a golden
- source: discovery/e9.md §10 — review finding D
- date: 2026-08-04
- lanes: 2 AI-building-the-game
- event: The A1 test invoked the CLI with no `--out`, so `npm run check` rewrote the tracked `artifacts/runs/우는다리-fixture-r1.json` in place and then asserted it existed — self-confirming. The test now writes to a temp dir and byte-compares against the committed record, making the sample a golden (which decision 9 had explicitly said it was not).
- tension: An artifact no test compares against is evidence of nothing; the reviewer's point overrode the unit's own decision, at the cost that a deliberate engine-output change now fails until the sample is regenerated.
- quote: "an artifact no test compares against is evidence of nothing"
- flags: reversal

### S11a-040 — A shipped tool imported the test tree; the review moved the schema walker out
- source: discovery/e9.md §11 — review finding E
- date: 2026-08-04
- lanes: 2 AI-building-the-game
- event: e9 extended e8's schema walker (adding array-`type`, `enum`, `$ref`) but left it under `tests/runloop/schema.ts` and imported it from the shipped CLI; a ship test (`cp -R src tools data /tmp/ship && node …`) died on `ERR_MODULE_NOT_FOUND: /tmp/ship/tests/runloop/schema.ts`. The walker moved to `tools/driver/run/schema.ts` with `tests/runloop/schema.ts` a one-line re-export.
- tension: A "directional smell" e9 recorded became a real defect at review — import direction is now tests → tools; `tools/lib/` would be a better home still, but it was frozen for this unit.
- flags: reversal

### S11a-041 — e9 coerced boolean flag deltas to satisfy a number-only schema field
- source: discovery/e9.md §4
- date: 2026-08-03?
- lanes: 2 AI-building-the-game
- event: `beats[].deltas[].before/after` is `number` in the run-record schema but `number | boolean` in the engine (`DeltaEntry`); flag deltas (`tip_traced`, …) are journal entries and dropping them would cost attributability. The recorder coerces `true`/`false` to `1`/`0` at the serialization boundary; e9 noted the better fix is widening the schema, which is frozen.
- tension: An engine-vs-schema type collision was papered at the serializer rather than at the schema; not exercised by the committed sample (the fixture always picks the first stance and none of 우는다리's first-stance outcomes sets a flag).
- flags: decision, boundary

### S11a-042 — e10 recorded five integration gates as green and later withdrew the census's own claim
- source: discovery/e10.md §1 + §A14–A19 are a presence census
- date: 2026-08-04
- lanes: 2 AI-building-the-game
- event: e10's acceptance suite transcribed §8's ten criteria; the five integration gates (A14–A19) ran as commands and were recorded green on 2026-08-04 (A14: 56 files / 878 tests, 0 failed; A16 build in 438 ms; A18 proxy 39 tests). A round-2 finding then showed `gates.test.ts` only asserts each gate command appears as a *string* in the file, not that it ran — the docstring claim "a green suite cannot hide a gate nobody executed" was withdrawn and enforcement moved to `.github/workflows/ci.yml`.
- tension: A gate suite proved presence, not execution; A19 (frozen inputs) remains enforced by nothing mechanical outside a super-pipeline run.
- quote: "It does **not** assert the command ran or that it passed"
- flags: measurement, failure

### S11a-043 — e10's §8-1 closure needed a sixth supplier term for the player
- source: discovery/e10.md §2 (also DISCOVERY.md §Spec gaps [e10])
- date: 2026-08-04
- lanes: 2 AI-building-the-game
- event: Run literally over the live views, §8-1's five-set union (`GateView ∪ BeatView ∪ RoundView ∪ ComposerDeps ∪ PROXY_OWNED_SLOTS`) leaves `BLOCKS` unassigned — call contracts §6 assigns it to the player and it reaches the composer through the block store, not a view. The closure adds an explicit `PLAYER_SUPPLIED_SLOTS = ['BLOCKS']`, and counts doubling as engine-side ∩ proxy-owned rather than set ∩ set.
- tension: The contract's supplier union had no term for the player though the player supplies `BLOCKS`; leaning on `COMPOSER_DEP_SLOTS` alone would hide that the composer resolves but does not author the slot. The property protected is "the client cannot rewrite the agent's character".
- flags: boundary, decision

### S11a-044 — A stale contract warning claimed a slot was unassigned that the closure assigns
- source: discovery/e10.md §3 (also DISCOVERY.md §Spec gaps [e10])
- date: 2026-08-04
- lanes: 2 AI-building-the-game
- event: `contract-engine-composer §2.1` is a ⚠️ block titled "`AGENT_UTTERANCE` is missing from call contracts §6", echoed in §8's open-items list, but `contract-calls §6`'s supplier table now carries the `AGENT_UTTERANCE` row and `fixtures/closure.ts` parses it out and assigns it to `BeatView` with no special case. The warning was never retracted; `docs/**` is frozen so nothing was edited.
- tension: A reader of §2.1 thinks a slot is unassigned that the executable closure proves is not — a documentation contradiction captured, not resolved.
- flags: contradiction

### S11a-045 — e10 drove the acceptance suite over the real pack and merged source
- source: discovery/e10.md §4
- date: 2026-08-04
- lanes: 2 AI-building-the-game
- event: Both rigs in `tests/acceptance/fixtures/rig.ts` run over the shipped 우는다리 datapack and the real merged `src/**` slice (schedule builder, state core, beat driver, id allocator, feed builders, round assembler, composer, block store, live driver, fixture provider), none re-implemented; the transport and `ViewEvent` stream are watched and neither altered.
- tension: A hand-built fixture could satisfy every §8 criterion while leaving the shipped scenario broken — three criteria are only meaningful against real content (a beat that moves `trust`, a run with lines on every channel, a real Call 1 → Call 3 trace).
- flags: decision, boundary

### S11a-046 — The entire engine build ran against the fixture provider, never a live model
- source: discovery/live-provider-prerequisites.md (preamble)
- date: 2026-08-04
- lanes: 2 AI-building-the-game
- event: The build ran end to end against the `fixture` provider; the final review panel on PR #116 collected six edges "invisible while `PROVIDERS` is `{fixture}`" and reachable only the moment a real model answers — the `{who}` literal, an unrecordable fallen-back Call 3, a null/unknown-`stance` 200 throwing out of the step loop, two malformed-200 shapes surfacing as the wrong error, `mined_from_run` depending on a run-id naming convention, and a stored record re-leaking `[속내]` if rendered to a UI.
- tension: None is a defect in what shipped — they are the edges a fixture cannot exercise — but two were sized as prerequisites, not nice-to-haves, for the first live-provider run.
- quote: "None of them is a defect in what this run shipped. They are the edges a fixture cannot exercise."
- links: S11a-012, S11a-031, S11a-038
- flags: boundary, milestone

### S11a-047 — A 200 whose stance is null or unknown throws out of the step loop
- source: discovery/live-provider-prerequisites.md §3
- date: 2026-08-04
- lanes: 2 AI-building-the-game
- event: `readJudgment` narrows on `'stance' in body` — a key check, not a value check — so a JSON-legal 200 carrying `stance: null`, or an id no bucket claims, passes the guard and then throws `Error: stance 'zzz' resolves to no bucket of gate G1`; no fallback is graded, no record written. The ok-but-absent stance was fixed (`da0af4d`); this is the ok-but-wrong one.
- tension: A guard shaped for presence lets a malformed value through to a later hard throw — loud rather than silent, but unreachable while only the fixture answers.
- flags: boundary, ai-limit

### S11a-048 — Both engine and client runs repaired the same u0 gates two ways
- source: DISCOVERY.md §Cross-run reconciliation (lines 1023–1060)
- date: 2026-08-04
- lanes: 2 AI-building-the-game
- event: The engine run and the client run independently repaired the same u0-era gates that upstream PR #114 had made stale, so merging carried two different repairs of one assert. Which survives was decided per file by whether its baseline still moves once landed on `main`: `isomorphism-guard.test.ts` kept the engine run's SHA-pin (the client's diff repair goes vacuous at merge); `layout`/`deps.test.ts` kept the client run's (they resolve u0's fixed merge range); `deps.test.ts` kept both sides.
- tension: Two autonomous runs converging on the same stale asserts produced conflicting fixes at the seam; none was deleted or skipped, each re-aimed (C12/C17), and 민서's dry-run table reached the same three answers independently.
- flags: seam-friction, decision

### S11a-049 — inv 12's seam ban re-aimed once the isomorphic tier existed below it
- source: DISCOVERY.md §Cross-run reconciliation (lines 1049–1054)
- date: 2026-08-04
- lanes: 2 AI-building-the-game
- event: `tests/invariants/seam-integrity.test.ts` inv 12 had described only the view side while `src/engine` and `src/composer` were empty stubs. It was re-aimed to `aboveSeam()`: the isomorphic tier (`src/engine`, `src/composer`, `src/transport`, `src/driver`, `src/runloop`) lives below the seam, so an edge among those folders is the architecture, while the ban still covers every module above the seam.
- tension: An invariant written before the engine existed banned exactly the edges the merged engine needs; re-aimed so the architecture is not read as a violation.
- flags: decision

### S11a-050 — The "fixture-only" exclusion expired when the engine landed
- source: DISCOVERY.md §Cross-run reconciliation, "C8 has expired"
- date: 2026-08-04
- lanes: 2 AI-building-the-game
- event: `seam-integrity.test.ts (c)` asserted no engine or composer module may appear in the player build graph, failing with `C8: fixture-only`. C8 was a run-scope exclusion (`plan-client-build.md §1`: "engine does not exist yet … build to the seam, fixture-only"), not a structural rule, and `spec-client.md` had always specified the opposite end state. `(c)` and `(b)` were re-aimed — a core module may ship but only a driver module may import it — both vacuous until the browser-side binding lands.
- tension: A guard whose premise ("engine does not exist yet") had expired would otherwise block the very binding the spec licenses; re-aimed now so the binding is not blocked later.
- quote: "That premise expired when the engine landed."
- flags: pivot, boundary

### S11a-051 — A later playtest reversed the deploy-carry ruling the engine had encoded
- source: DISCOVERY.md §Cross-run reconciliation, "W4 (08-08 playtest)"
- date: 2026-08-08
- lanes: 2 AI-building-the-game
- event: The 08-08 playtest collapsed the two-press day (NEW RUN, then DEPLOY inside the new day) into one press (배치) that commits the file AND opens tomorrow, moving the commit before the run boundary. Two asserts that encoded the old order were re-aimed: `run-loop-continuity.test.ts (b)` now asserts a deploy carries, and `live-adapter-run-transition.test.ts (d)` — where on the live path `closingState()` harvested `deployed` into `carried`, so the old clearing handed the composer an empty agent file every day after the first.
- tension: A deliberate ordering ruling the engine build had relied on was reversed by playtest feel; the live path had a bug the fixture path hid (an empty carried deck), fixed as the carried deck now also seats and re-arms.
- flags: reversal, pivot

### S11a-052 — No workflow ran Playwright, and the capture baseline lived in a gitignored dir
- source: DISCOVERY.md §Cross-run reconciliation, "The e2e suite ran in no workflow"
- date: 2026-08-04
- lanes: 2 AI-building-the-game
- event: `e2e/captures.spec.ts` referenced `.claude/super/reference-shots/` — super-pipeline runtime state gitignored by CLAUDE.md rule 4 — so all ten pairs failed on CI, any clone, or a fresh checkout, and the pipeline's own shots were since lost with that directory. Nothing caught it because no workflow ran Playwright at all (`ci.yml` ran check/test/build/probe; `deploy.yml` ran build). Fixed by tracking a baseline at `e2e/reference-shots/`; CI gained only a `preview-smoke` job.
- tension: A whole e2e lane was un-runnable off one machine and unwatched by automation; the full suite stays manual by 민서's call, a known deliberate gap leaving ~237 tests un-automated.
- flags: failure

### S11a-053 — TALLY can steal the pointer and a race remains behind the retries
- source: DISCOVERY.md §Cross-run reconciliation, "TALLY can take the front back"
- date: 2026-08-04
- lanes: 2 AI-building-the-game
- event: `windows/tally.ts:show()` re-clicks its own taskbar button whenever it finds itself hidden, and TALLY shares one `z-index` with every window, so a click meant for the window underneath is swallowed by a `tly-head` intercepting pointer events. This was misread as one bad `block-store.spec.ts` test but is systemic, reaching `reports`, `a11y` and `run-loop` specs once the captures lane changed timing. The deterministic half is fixed (raise from the taskbar); a genuine sheet-vs-test race remains, mitigated by `retries: 2`.
- tension: A flake read as a single bad test was a product question — should a window the operator just raised keep the front while TALLY counts — that must be answered before the full suite becomes a blocking gate.
- flags: failure

### S11a-054 — e10 pared a sketched shape to what assertions read (YAGNI)
- source: discovery/e10.md §5
- date: 2026-08-04
- lanes: 2 AI-building-the-game
- event: `e10/tests.md` sketched `Driven` with six fields (`requests · responses · feed · events · journals · calls`); only the first four are read by any assertion, so only those four were built. `journals` would have required a state-core handle `createScriptedEngine` does not expose — a second engine binding for a field nothing reads.
- tension: A test-note surface was trimmed rather than fully built, avoiding an extra engine binding written for unread data.
- flags: decision

### S11a-055 — A species-type duplication outlived the file it was waiting for
- source: discovery/e10.md §`species.ts`'s duplication precondition is spent
- date: 2026-08-04
- lanes: 2 AI-building-the-game
- event: `src/shared/species.ts:39` carries a `Species` union under a header saying the type belongs in `src/shared/view-driver.ts`, "that file does not exist yet and is not mine to write", with instructions to delete the local copy once it lands. `view-driver.ts` has since landed and declares the same four literals; the precondition is spent, but both files are frozen for this run so neither can change.
- tension: A deliberate temporary duplicate became stale duplication no unit could clean; r2's experiment showed renaming `'emotion'`→`'mood'` in `species.ts` does fail `tsc` in `report.ts`, so the engine-breaking drift is guarded — only widening the seam's union alone slips through.
- flags: contradiction, boundary

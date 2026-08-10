# Theme map — IMPLEMENTATION-SWEEP ADDENDUM (reconciled)

> Merged into theme-map-final.md on 2026-08-10; retained as the derivation record.

## 0. What this is, and the method

This is the reconciliation pass for the **implementation-phase atom sweep** (the
new material folded after the Phase-3 snapshot: S2, S3/S8/S6 §Implementation-sweep,
S4-075..081, S6-199+, S7, S9c PRs #140–#237, S11a engine build-record, S11b client +
g-PRDs, and S12 proxy/deploy). It is **incremental**: it does not re-open, re-number
or rewrite the 84 reviewed theme records in `theme-map-final.md`. It (a) attaches new
atom ids to existing themes, (b) proposes net-new themes numbered **T-85+**, and
(c) proposes amendments where new evidence changes a verdict, `#4-role` or thesis —
as *proposals*, for a human, never as edits to the final map.

**Sharding.** Four lane agents proposed independently and this pass merged them:
- **Lane 1** (game/runtime/measurement) — S12, S3/S8/S9c lane-1, S6-243.
- **Lane 2** (build/orchestration) — S11a, S11b, S9c, S8 §Implementation-sweep.
- **Lane 3** (planning/docs/reflexive) — S6 impl sweep, S4-075..081, S11b g-PRDs, S9c lane-3.
- **Lane 4** (authoring/creator) — S2, S7, S9c lane-4.

The four proposals overlapped on the g-PRD (lane 2 **NEW-L2-05** ≡ lane 3
**NEW-L3-02**) and on status.md-as-journal (lane 3 **NEW-L3-03**, which is inside
T-79). Both were resolved at merge — see §2.

Contradictions are preserved as `counter-evidence`, never resolved by picking the
nicer atom. `verdict: proposed` on every net-new record — selection is not this
pass's job.

---

## 1. Attachments to existing themes

Deduped across the four lanes, grouped by theme id ascending. Support and
counter-evidence kept separate. **61 existing themes** receive attachments.

- **T-01** — +support S8-110, S12-012, S12-019, S12-021, S12-033, S6-224, S6-225, S6-245, S6-246. +counter-evidence S6-243, S8-068, S8-069, S12-002, S12-006, S12-011 (the **output-side** membrane leak — see amendment §3).
- **T-02** — +support S9c-050, S6-245. +oral OH-3 §4. +counter-evidence S9c-016, S12-005.
- **T-03** — +support S8-078, S12-005, S12-008, S12-029, S12-032.
- **T-04** — +support S3-075, S8-086, S8-087, S8-088, S9c-022, S9c-066.
- **T-05** — +support S3-077, S8-086, S12-020, S2-072, S7-027, S7-029, S9c-065.
- **T-06** — +support S8-082, S12-003, S12-004, S12-010, S12-020, S12-037.
- **T-07** — +support S3-078, S3-080, S8-083, S12-002, S12-005, S12-013, S12-014, S12-018, S12-036.
- **T-09** — +support S8-111, S9c-004, S9c-029, S9c-030, S11b-033.
- **T-10** — +support S6-204, S6-208, S6-226, S8-080, S8-098, S8-099, S9c-004, S9c-053, S11a-039, S11a-042, S11b-034.
- **T-11** — +support S6-199, S6-201, S6-203, S6-216, S8-094, S9c-029, S9c-061, S9c-072, S9c-096, S11a-052.
- **T-12** — +support S3-082, S8-097, S8-107, S9c-030, S9c-036, S9c-044, S11a-019, S11b-022, S11b-026, S11b-034, S12-007, S12-015.
- **T-14** — +support S6-210, S6-224, S8-072, S8-110, S9c-024, S11a-032.
- **T-15** — +support S8-095, S9c-006, S9c-055, S11b-035.
- **T-16** — +support S2-075, S6-203, S6-204, S6-208, S6-220, S8-087, S8-088, S8-098, S9c-046, S9c-047, S11a-042.
- **T-17** — +support S8-098, S9c-031, S11a-039, S11a-042.
- **T-18** — +support S6-203, S6-208, S9c-020, S9c-031, S9c-037, S11a-004, S11a-031, S11a-034, S11a-037, S11a-038.
- **T-19** — +support S9c-027, S9c-048.
- **T-20** — +support S8-063, S8-064. +counter-evidence S9c-029, S8-111 (steering migrated off the dashboard onto per-PR threads — fleet-era artefact; see T-88).
- **T-21** — +support S9c-021, S9c-046.
- **T-22** — +support S9c-008, S9c-009, S9c-020, S9c-025, S9c-041, S9c-042, S9c-046 (now **human↔agent**, not agent↔agent).
- **T-23** — +support S8-085, S8-086, S9c-023, S9c-038, S9c-066, S11a-034, S11a-050.
- **T-24** — +support S8-074, S8-096, S8-099, S8-100, S9c-028, S11a-048, S11b-019.
- **T-25** — +support S8-065, S11a-001, S11a-014, S11a-021, S11a-028, S11b-036. +counter-evidence: two new parallel-build failure modes (T-89, T-90).
- **T-26** — +support S8-063, S8-064, S8-096, S9c-030, S9c-040, S11a-004, S11a-008, S11a-013, S11a-052, S11b-003, S11b-012.
- **T-27** — +support S8-063, S8-064. +counter-evidence S9c-001..048 (venue migration, #234's 11 review submissions — see amendment §3).
- **T-28** — +support S8-065, S9c-021, S11b-035, S11b-036, S11b-037, S11b-044. +counter-evidence S11a-004, S11a-008, S11a-013, S11b-012 (spec never reached its reader — see T-89).
- **T-29** — +support S8-076, S8-080, S8-081, S8-082, S9c-032, S9c-041, S9c-042, S9c-053, S9c-068, S11a-010, S11a-044, S11b-029, S11b-037, S11b-038.
- **T-30** — +support S9c-015, S9c-034, S9c-035, S11a-052, S11b-032.
- **T-31** — +support S6-237, S8-079, S8-105, S8-114, S9c-012, S9c-017, S9c-060, S11a-052, S11b-035.
- **T-32** — +support S3-069, S3-070, S3-077, S8-084, S8-085, S8-086.
- **T-33** — +support S3-068, S8-112, S9c-023, S9c-044.
- **T-36** — +support S3-082, S8-083, S9c-027, S9c-044.
- **T-37** — +support S3-075, S8-087, S8-088, S9c-066.
- **T-40** — +support (ORAL-ONLY) OH-3 §2. Lane 4 found no written attach this sweep (the two new packs are single-author, not rival candidates) — noted THIN, not attached.
- **T-41** — +support S2-082, S2-083, S2-084, S9c-064, S9c-065.
- **T-42** — +support S2-078, S2-079, S2-080, S2-081, S3-075, S8-087, S8-088, S9c-022, S9c-023, S9c-045, S9c-046 (complication S9c-027).
- **T-43** — +support S2-083, S2-084, S9c-065.
- **T-45** — +support S2-075, S2-076, S2-084, S2-085, S9c-025, S9c-048, S9c-057, S9c-063, S9c-066 (the *dominant* pattern of this sweep).
- **T-46** — +support S6-200, S6-206, S6-209, S6-213, S6-227, S8-111, S9c-015, S9c-029, S9c-039, S9c-050, S9c-058, S9c-059, S9c-068, S12-005, S12-016.
- **T-47** — +support S9c-005, S9c-067.
- **T-48** — +support S8-111, S9c-029, S9c-030, S9c-039, S9c-068, S11b-042.
- **T-50** — +support S4-080, S4-081.
- **T-51** — +support S8-078, S12-024, S12-025, S12-026, S12-027, S12-032, S12-033. +oral OH-3 §2. (First real-deploy latency measurement — see amendment §3.)
- **T-52** — +support S6-232, S6-247, S7-024, S7-033, S8-066, S9c-058, S11a-046, S12-029, S12-030, S12-032. +counter-evidence S12-036 (defective fallback *content* on the minable channel).
- **T-56** — +support S8-084, S8-085, S8-086, S9c-007, S9c-022, S9c-026, S9c-044.
- **T-57** — +support S4-075, S4-076, S4-077, S4-078, S4-079.
- **T-58** — +counter-evidence S4-075, S4-076, S4-077, S4-078, S4-079 (the 07-27 note puts pivot reasoning in *writing* — narrows "almost entirely oral"; corroborates the OH-4/OH-5-corrected sequence).
- **T-59** — +support S8-075, S8-076, S8-077, S8-078, S8-079, S8-080, S8-097, S8-098, S9c-053, S11a-052, S12-022, S12-024.
- **T-60** — +support S6-200, S6-206, S6-209, S6-219, S6-227, S8-086, S8-107, S8-114, S9c-023, S9c-037, S9c-052, S9c-062, S11b-011, S11b-031.
- **T-61** — +support S8-100, S8-101, S9c-069, S9c-070, S9c-071, S9c-073 (these **exceed T-61's scope** → promoted to T-93; flag for absorption check).
- **T-62** — +support S6-237, S9c-060.
- **T-63** — +support S9c-054, S9c-062, S9c-069, S12-038.
- **T-72** — +counter-evidence S2-073, S9c-048 (run-1 determinism as a *design goal* — see amendment §3). +support (fear side) S3-067, S3-080, S8-083.
- **T-73** — +support S9c-044, S12-022, S12-023, S12-028. +counter-evidence S9c-067, S12-038 (serving-path gap; no live Bedrock call at snapshot).
- **T-74** — +support S12-019, S12-022, S12-027, S12-035. +counter-evidence S12-034, S12-038 (config vs README disagree on whether the tier ran live).
- **T-75** — +support S7-020, S7-025, S7-026, S7-027, S7-028, S7-029, S9c-043, S12-016, S12-020, S12-029.
- **T-76** — +support (whole S11a/S11b build: every unit spawns fresh, reads its slice, writes a note, dies). +counter-evidence T-89 (the "reads its slice" step failed when the slice on disk was incomplete).
- **T-77** — +support S4-075..081, S9c-054.
- **T-79** — +support S6-199..229, S6-235, S6-237, S6-245..247, S9c-052, S9c-068 (the entire impl sweep *is* status.md; strongest single body of evidence for the freely-updated SSOT). Absorbs dropped proposal NEW-L3-03 — see §2/§3.
- **T-82** — +support S2-077, S9c-047. +counter-evidence S2-075, S2-076, S9c-064 (the closed protocol does not hold the new graph format).
- **T-84** — +support S2-074, S7-022, S7-026.

---

## 2. Net-new themes T-85+

**14 lane proposals → 12 survivors.** Merges/drops: NEW-L2-05 ≡ NEW-L3-02
(g-PRD) merged into **T-92**; NEW-L3-03 (status.md decision journal) **dropped as
covered** by T-79 (+T-60) — carried instead as a T-79 attachment (§1) and a
thesis-sharpening amendment (§3). All carry `verdict: proposed`.

### T-85 — The phantom-speaker defect family: production hallucinations from prompts authorizing an empty room, cured rule-first
- thesis: The implementation phase's dominant runtime-AI defect was invented or misattributed **speakers** (a 기록관 conjured into an emptied room, NPC lines in the wrong mouth, an agent's own questions handed to an NPC) — each traced to a prompt *permission* that survived a fiction change, not a model weakness. The cure is rule-first (conditional permissions recast as unconditional stage facts, silence made an explicit sentinel, overproduction capped by schema) while explicitly **refusing** a validator for a wrong-but-legal speaker.
- lanes: 1 · origin: emergent
- support: S12-002, S12-006, S12-011, S12-005, S12-014, S12-036, S9c-001, S9c-049; S6-243 (adjacent inner_note echo).
- counter-evidence: S12-005 (schema cap stops only overproduction — a wrong-but-legal speaker stands by design), S12-014 (the cap pushed misattribution sideways into the unconstrained timeline channel). Looked across S12/S9c/S8 for a cure that fully closed the defect; none — every fix opened or left an adjacent hole.
- gaps: whether the rule-first cures hold under a real Bedrock call is unproven (no live narration call at snapshot — S12-015, S12-034); a post-deploy narration smoke would answer.
- oral-only: none · fit: #4 section
- proposed `#4-role`: **section** · `verdict: proposed`. Overlaps T-07/T-01 but is one coherent incident family they touch only obliquely.

### T-86 — Making the deployed agent the measured agent — closed for the prompt, still open at the serving path
- thesis: A class of work existed to keep "the gate numbers describe the shipped game" true in production — per-pack default prompts copied verbatim from the probe suite, a byte-identity prompt-parity gate, temperature pinned to 1, pack prose realigned to fixtures. The equivalence is nonetheless incomplete on the record: the probes ran over the Anthropic API while the game calls Bedrock through the proxy (different serving path and tool-call envelope), and at snapshot no real Bedrock call had ever run.
- lanes: 1 · origin: emergent
- support: S8-081, S8-082, S12-020, S12-028, S12-037, S9c-067.
- counter-evidence: S9c-067 (serving-path/envelope gap open), S12-034, S12-038 (no live call at snapshot; config vs README contradiction). Stated by the team, not hidden.
- gaps: only a re-measurement through the deployed tier (unstarted work) can say whether Bedrock's path moves the measured stance distribution.
- oral-only: none · fit: #4 section
- proposed `#4-role`: **section** · `verdict: proposed`. Overlaps T-73/T-06 heavily — **fold candidate into a T-73 extension**; kept net-new because the serving-path residual and never-ran-live contradiction are stated by no existing theme.

### T-87 — The two-tier deploy window as a runtime design constraint: sequence the bump, fall back on the unknown, make it un-misconfigurable
- thesis: Because the proxy (Bedrock tier) and the client (Pages) deploy on separate triggers, the gap between them is a first-class hazard with a doctrine: prompt versions are append-only and the bump is withheld until the proxy redeploys; an unknown pack slug is served the incumbent agent, not rejected ("wrong in character, right in shape"); timeout ceilings are bounded in config so no env value can break model<route<Lambda ordering.
- lanes: cross (1, 2) · origin: emergent
- support: S12-010, S12-030, S12-025, S12-023, S9c-005.
- counter-evidence: S8-077 (the hazard was realized once — first live-provider deploy failed its own health probe on the origin guard it had just deployed). No atom contradicts the doctrine itself; looked in S12/S8/S9c.
- gaps: no live player-facing version bump at snapshot; whether fallback-to-incumbent is acceptable to a judge is untested.
- oral-only: none · fit: #4 section / possible #2 video beat
- proposed `#4-role`: **section** · `verdict: proposed`. Adjacent to T-51/T-52 but distinct: the deploy-window gap between two independently-shipped tiers.

### T-88 — From an autonomous fleet to a human-driven single-agent workshop: the method changed shape when the work changed
- thesis: The AI-orchestration is two eras, not one. The scaffold (engine e0–e10, client u0–u11) was built by the autonomous multi-agent super-pipeline in two overnight runs; the entire implementation/polish/live-wiring phase (#140–#237) ran as human-driven manual PRs + single-agent `claude/*` sessions + surgical single-commit PRDs. Naming the era boundary is what resolves T-27's "maturity vs attrition" — adversarial review didn't die, it moved from agent↔agent unit-PRs to dense human↔agent manual PRs.
- lanes: 2 (with 1, 3) · origin: emergent
- support: S8-063, S8-064 (the two, and last, fleet runs); S9c-001..048 (#140–#237 = 10 rich human↔agent PRs incl. #234's 11 submissions, + 10 single-agent PRs); S11b-035..044 (surgical single-commit PRDs); S8-111, S9c-029 (human plays the live run); S9c-054..061 (single-agent polish).
- counter-evidence: not a clean break — fleet conventions persist (confession-style bodies, executable PRD S11b-035, parallelism DAG S11b-036); and the corpus never states *why* the fleet stopped for #140+ (see gaps), so "deliberate maturation" is one reading and "forced by deadline / live-wiring being human-gated" is another.
- gaps: the corpus does not record the decision to stop the fleet — deadline? live-provider work unverifiable-by-agent (T-47)? token limits (S8-102)? An interview or a status.md diff could answer.
- oral-only: OH-3 §3 describes the fleet ("유능한 개발팀을 고용") but is silent on the later single-agent phase; the shift is oral-silent, visible only in the PR record.
- fit: #4 section (clearest "evolution of how AI was used") + #2 video beat.
- proposed `#4-role`: **spine (candidate)** · `verdict: proposed`. The frame that re-scopes T-20/T-21/T-22/T-27 as descriptions of *one era*; section at minimum.

### T-89 — The worktree-sync gap: units built against a ratified spec that existed but was never delivered into their worktree
- thesis: A recurring super-pipeline provisioning defect — the unit's ratified `spec.md`/`design.md`/contract (the "READ FIRST" artifact) was never copied into the agent's git worktree, so agents built against the prompt JSON + RED tests alone and shipped diverged from already-settled decisions. The fix is always harness-side.
- lanes: 2 · origin: emergent
- support: S11a-004, S11a-008, S11a-013, S11b-012, S11a-005.
- counter-evidence: distinct from a *wrong* spec (S11b-002, S11a-013's scope list) — here the spec was correct; only its delivery failed; and the integration branch caught the divergences (S11a-005), so net safety held. Borders T-26; kept separate as one named mechanism with one class of fix.
- gaps: only units that wrote a discovery note are visible; total incidence and whether the harness was fixed are unmineable (off-repo harness / past snapshot).
- oral-only: none · fit: #4 section
- proposed `#4-role`: **section** · `verdict: proposed`.

### T-90 — Scaffold guards go false the moment the work they guard is done as designed; the pipeline re-aims, never deletes
- thesis: A census/scaffold/frozen-input guard authored while one unit was alone on the tree becomes a permanent red or a vacuous green once later units land *exactly as designed*. The answer is the C12/C17 discipline: re-aim the assertion at what it now means (or defer it to the integrator), never delete or skip it.
- lanes: 2 · origin: emergent
- support: S11b-003, S11a-033, S11a-050, S11a-042, S11a-048, S11a-049, S9c-034, S9c-035, S8-096, S11b-031.
- counter-evidence: the discipline is not "never red" — some guards are deliberately left failing as noise for the integrator (S11b-003); telling an expired-premise guard from a simply-wrong one is a judgment call (S11a-050). Overlaps T-23/T-24; sharper because it is about a guard's staleness against its own future tree.
- gaps: none material · oral-only: none · fit: #4 section
- proposed `#4-role`: **section** · `verdict: proposed`.

### T-91 — "There is no wireable shape": work abandoned because two ratified/frozen contracts leave no consistent shape to build against
- thesis: A manual-phase stop-condition — an agent finds two already-ratified documents (or a frozen type + a prose contract) disagree so *no* implementation can satisfy both, and stops ("the hole is not 'nobody wired it', it's 'there is no wireable shape'") rather than leave plumbing around an impossible value. Recorded as a contract defect for a human, not a coding failure.
- lanes: 2 (with 3) · origin: emergent
- support: S9c-032, S11a-012, S11a-038, S11a-034, S9c-042.
- counter-evidence: the same agents instead **mint a reversible shape and flag it** when the conflict is still *open* (S11a-021, S11a-014). The stop is chosen specifically when what collides is frozen/ratified.
- gaps: whether humans then revised the frozen contracts is past-snapshot for several cases.
- oral-only: none · fit: #4 section
- proposed `#4-role`: **section** · `verdict: proposed`. Sits between T-47 and T-29; the refusal is a *reasoned architectural stop*, not a capability refusal.

### T-92 — The implementation-phase g-PRD: a surgical single-commit micro-contract with a hand-authored DAG, a stop-protocol, and the exact-citation discipline that vindicated stopped executors
*(merged from NEW-L2-05 + NEW-L3-02)*
- thesis: In the manual era the orchestration instrument became the g-PRD — one executor (a "Sonnet-class session"), one branch, exactly one commit with a fixed message, "open a PR, merge nothing," a pre-edit git-identity check, an explicit wave/parallelism declaration keyed on file-disjointness (DAG hand-authored, not harness-inferred), and a boundary clause that treats a documented refusal-to-proceed-on-a-stale-citation as a *completed* run. Change-lists were dry-run-verified on a scratch tree; the exact-citation rule repeatedly caught its own authors' stamping errors.
- lanes: 2, 3 · origin: emergent
- support: S11b-035, S11b-036, S11b-037, S11b-038, S11b-044, S9c-021, S9c-041, S9c-042.
- counter-evidence: the precision was partly aspirational — S9c-018 (~half the plan's ~84 citations carried a defect), S11b-012 (the READ-FIRST contract was absent from many worktrees), S9c-040 (a stacked PR stranded five PRDs on an orphan branch — the plumbing failed), S9c-021 ("zero instances" — the §5 rule set was unproven until executed).
- gaps: only 4 of 30 PRDs read in full; no atom shows a low-cost executor running a g-PRD end-to-end and stopping *in production* (vindications are on scratch trees / in review).
- oral-only: OH-3 §3 ("명세는 기능 단위로 10~20개로 쪼갰다") corroborates the decompose habit but predates and does not describe the single-commit g-PRD form.
- fit: #4 section / #5.
- proposed `#4-role`: **section** · `verdict: proposed`. Manual-era evolution of T-28 and a concrete face of T-88; the executor-boundary + self-vindication pattern is not in T-28.

### T-93 — Deliverable #4 was built bottom-up by an AI mining/induction pipeline, engineered to expose its own limits (self-referential) — **THIN, self-excluded**
- thesis: The AI-utilization document was not written from memory — it was constructed by an AI pipeline that mined the repo into 905 atoms across ten slices, ran two blind inductions (Pass A by slice, Pass B by lane), reconciled them into the theme map, and mapped those onto the outline — deliberately built to surface its own weaknesses (coverage gaps logged not dropped, the convergence ranking that demotes the required inventory kept legible, the thesis inverted against "we learned to prompt better").
- lanes: 3 (self-referential; bears on all four) · origin: emergent
- support: S9c-069, S9c-070, S9c-071, S9c-073. **THIN — all four atoms are single-slice S9c.** The corpus-wide artifact (atoms-S1..S12, this addendum) *is* the pipeline, but the mining effort deliberately excluded its own output (`docs/deliverables/mining/` not mined), so no atom ids exist outside S9c.
- counter-evidence: T-63 + OH-4 + OH-5 — the pipeline was blind exactly where the biggest decision lived (missed the `dday-simulation` slug and the closed-PR demo; a false "cut pre-build" finding reached an atom file), corrected only by the oral channel; S9c-070 (the ranking demotes required content). Self-assembly is real but required human oral correction and produced a known mis-ranking — it did not run clean.
- gaps: no atom-level evidence of the pipeline outside S9c (self-exclusion); whether the two inductions were truly blind is asserted, not checked; the human-in-the-loop steps (selection, this refresh, outline authoring) are unmined.
- oral-only: none directly; the corrections rest on OH-4/OH-5.
- fit: #4 spine (arguably the reflexive centre B named at T-61) / #5.
- proposed `#4-role`: **spine (fit) — but blocked THIN**; cannot carry spine until de-THIN'd. **Needs the pre-#4 pipeline-artifact sweep** to mine the pipeline's own artifacts and lift the single-slice mark. `verdict: proposed`.

### T-94 — The audio subsystem: an AI-generated creator surface that did not exist at snapshot, engineered to withhold and to be droppable
- thesis: Game sound arrived post-snapshot as AI-generated cues governed as data, and its design rules are the same distrust-and-restraint posture applied to the model: sound withholds information rather than conveying it, never carries meaning alone, and is built to be cut without breaking play.
- lanes: 4 (with 2 at the mixing/build seam) · origin: emergent (no snapshot theme touches audio)
- support: S7-020, S7-021, S7-022, S7-023, S9c-058, S9c-059.
- counter-evidence: the surface is deliberately *minimized* and cuttable (S9c-058, S7-021) — a restrained, droppable creator surface, not a rich one; overlaps T-52 (droppability) and T-75 (balance-as-data), which each own a facet.
- gaps: no atom on how the cue *assets* were generated (tool/prompt) beyond the manifest; per-cue provenance sits in S9c-060's unmined manifest work.
- oral-only: none · fit: #4 section / #2 video beat
- proposed `#4-role`: **section** · `verdict: proposed`. The information-withholding rule, the offline-audition-fails mixing lesson and foley-not-score accessibility are stated by no existing theme.

### T-95 — The graph-first scenario model: a mid-implementation rewrite that deletes the lock and makes failure structural
- thesis: Scenarios were re-architected during implementation from timeline-first, temperament-locked to an endings-first graph (endings → routes → gates → knowledge → timeline derived last) in which failure is where the agent's reach stops, not where a conditional fires — replacing an authored lock with graph shape.
- lanes: 4 · origin: emergent
- support: S2-071, S2-072, S2-074, S2-077, S9c-065, S9c-066 (schema side S7-027/28/29).
- counter-evidence: it did not ship clean — S9c-066 (a gate shipped unrepaired), S2-084 (repairs created new defects), S9c-048 (the "138 is a guarantee" framing is statistically leaky, ~0.81 joint on run 1); S2-073 wanting p=1 on the fail edge sits in tension with T-72.
- gaps: whether the older packs (우는다리) migrate fully to the graph model or stay hybrid — the corpus shows only re-hardening (S2-085, S7-034), not rebuild.
- oral-only: none · fit: #4 section / #3
- proposed `#4-role`: **section** · `verdict: proposed`. Continues T-05's temperament-removal arc and reshapes T-41's factory; an authoring *architecture*, not a control-axis or loop.

### T-96 — Silent structural hazards native to the graph datapack format — invisible to every automated gate, caught only by hand
- thesis: The new graph format introduced a hazard class: structural edits that destroy or reroute meaning while every compiler, schema and lint check stays green — caught only by manual probing and human review.
- lanes: 4 (with 2 at the tooling seam) · origin: emergent
- support: S2-075, S2-076, S9c-047, S9c-064.
- counter-evidence: **all four were in fact caught** — by engine-probing (S2-075/76), by `text_head` (S9c-047), recorded pre-emptively (S9c-064). "Tooling cannot see them" holds only at the *automated-gate* level; each produced a new required check.
- gaps: whether a unique-clock-per-node lint rule was actually landed (S2-075 only *demands* it).
- oral-only: none · fit: #4 section / #2 (review-catch beat)
- proposed `#4-role`: **section** · `verdict: proposed`. A structure-level twin of T-45 (content fidelity); kept net-new because it is about the graph format's own machinery.

**Dropped as covered:** NEW-L3-03 (status.md as a prose decision journal) — its thesis (each entry preserves its own counter-position) is inside **T-79** (freely-updated SSOT) + **T-60** (append-only, reversals annotated in place); single-artifact (status.md), which the format warns often signals "a description of a document, not a theme." Carried as a T-79 attachment (§1) and thesis-sharpening amendment (§3).

---

## 3. Proposed amendments to existing themes

Proposals only — `theme-map-final.md` is not rewritten.

**Top three (flagged in the brief):**

1. **T-01 (membrane, spine) — the production membrane is an *output*-leak problem.**
   The snapshot thesis is about the *input* membrane (no free text in). The impl
   sweep shows the membrane's live failure is on the **output** side: model-authored
   text reaching the player through a legal key (a reporter echoing its `[속내]` slot,
   S6-243/S8-068/S8-069) and unauthored fiction from a stale prompt permission
   (S12-002/006/011), which **no key-level guard can catch**. Proposal: extend the
   thesis to name the output-side leak explicitly and treat it as a *spine
   strengthening* (the membrane holds structurally on input; its residual risk is on
   output) — do not weaken the spine verdict.

2. **T-27 (review decayed to zero, supporting-anecdote) — RESOLVED as venue
   migration.** The snapshot says "maturity vs attrition is not answerable." It now
   is (T-88): adversarial review did not die, it **migrated** from agent↔agent unit
   PRs to dense human↔agent manual PRs (#140–#237; #234 carries 11 review
   submissions). Proposal: amend the thesis to "the *fleet's* unit-PR review decayed
   to zero; review returned at full intensity in the manual era on a different
   channel." Note the interaction with final-map gap #1 (#110/#116) — the resolution
   comes from the newly-swept #140+ range, not from #110/#116.

3. **T-72 (over-convergence as fatal as noise, supporting-anecdote) — a genuine
   counter-case, preserved not resolved.** In the shipped authored scenario, run-1
   determinism is a **design goal**: p=1 target on the fail edge (S2-073), 138 deaths
   framed as "no run can be worse" (S9c-048). Proposal: add counter-evidence and
   nuance the thesis — the over-convergence *fear* governs the mechanism/measurement
   layer, while an authored fail-run *wants* determinism. Keep as a live tension.

**Further amendments proposed:**

- **T-28 (spine)** — add counter-evidence: the instrument *failed to reach its reader*
  (T-89 worktree-sync gap; S11a-004/008/013, S11b-012), so the primary-reader-is-an-agent
  ideal broke in execution even where the spec existed.
- **T-20 / T-21 / T-22** — re-scope as **fleet-era** descriptions (T-88); T-22
  specifically now runs **human↔agent** (S9c-008/009), not only agent↔agent.
- **T-25** — the corpus adds two parallel-build failure modes T-25 did not name:
  T-89 (worktree-sync) and T-90 (stale scaffold guards).
- **T-46 (spine)** — the boundary migrated *toward more human hands-on work* in the
  manual phase (human plays the live run, files first-minute requests); reinforce
  the "timestamp, don't state as constant" note.
- **T-51 (section)** — this sweep is the **first real-deploy latency measurement**
  the theme flagged as untested (S12-024..027); partly closes T-51's own gap, but the
  Bedrock re-measurement gap (T-73/T-86) stays open.
- **T-05** — the temperament-removal arc is now **complete** (lock deleted, schema
  floor `minItems:0`, shipped pack graph-first): consider resolving the "later
  removed" clause.
- **T-58 (section)** — narrow "almost entirely oral": the 07-27 written note
  (S4-075..079) now carries much of the pivot reasoning.
- **T-61 (section)** — exceeded by T-93 (whole deliverable self-assembled vs one
  auto-drafted section); flag for absorption/scope check at selection.
- **T-79** — sharpen the thesis to include that each status.md entry preserves its own
  counter-position (absorbs dropped NEW-L3-03).

---

## 4. Residue & gaps update

**Homing the 41-atom residue.** The new themes are built on **new-sweep** atom ids
(S2/S3-sweep/S4-075+/S6-199+/S7/S8-sweep/S9c/S11a/S11b/S12), so they do not *cite* the
41 original-corpus residue ids directly. But the residue's concentration predicts
plausible homes once the pre-Phase-5 sweep re-checks those specific atoms against these
theses — flagged **plausible, not owned** (no silent adoption):
- **S9b (17) + S9a (7) = 24, the PR-thread residue** — exactly the harness-ops /
  review-panel material now addressed by **T-88** (era boundary), **T-89** (worktree
  sync), **T-90** (stale guards) and the **T-26/T-27** amendments. The final map
  already suspected this is "one gap" with #110/#116; these themes are its likely home.
- **S4 (3): S4-006, S4-014, S4-025** — concept/meeting residue, plausibly under
  **T-57 / T-77 / T-88** now that the S4 07-27 note is folded.
- **S6 (8)** — decision-journal residue, plausibly under **T-79** now that the S6 impl
  sweep is attached to it.
- **S1 (3), S8 (3)** — no strong new home; left in residue.

**New gaps (no silent caps):**
1. **Why the fleet stopped for #140+ (T-88).** The corpus does not record the decision
   — deadline pressure? live-provider work being unverifiable-by-agent (T-47)? token
   limits (S8-102 corporate-subscription note)? **Interview or a status.md diff.**
2. **T-93's self-exclusion.** The mining pipeline excluded its own artifacts
   (`docs/deliverables/mining/` not mined), so no atom ids for "deliverable built by
   AI" exist outside S9c → T-93 is THIN. **The pre-#4 sweep must mine the pipeline's
   own artifacts** to lift the mark.
3. **No live Bedrock call at snapshot (T-86/T-73/T-74).** Serving-path re-measurement
   through the deployed tier is unstarted; config vs README disagree on whether the
   tier ever ran live (S12-034 vs S12-038) — captured unresolved.
4. **Phantom-speaker cures unproven live (T-85).** No live narration call at snapshot;
   a post-deploy narration smoke would answer.
5. **Graph-model migration of the older packs (T-95)** — 우는다리 shows only
   re-hardening, not rebuild.

The four still-open final-map gaps (#110/#116; DDAY-selection artifacts located-but-
unmined; production in-play measurement; the three cheap single lookups for
T-19/T-22/T-37) are **unchanged** by this sweep and carry forward.

---

## 5. Coverage / method note

- **Incremental and additive.** The 84 reviewed records (82 kept + T-39 tombstone +
  T-35 tombstone) are untouched; this addendum only *attaches* ids and *proposes*.
  Numbering continues at T-85; T-85..T-96 are the 12 net-new survivors.
- **Lane coverage of the new material.** Lane 1 read S12 full, S3/S8 sweep sections
  full, 7 pivotal S9c lane-1 atoms verbatim (rest by title+event). Lane 2 folded S11a
  (e0–e10 full), S11b, S9c #140–#237, S8 commits. Lane 3 folded S6 impl sweep,
  S4-075..081, S11b g-PRDs (4 of 30 read in full — the other 26 sampled, a stated cap),
  S9c lane-3. Lane 4 folded S2, S7, S9c lane-4. Nothing capped silently beyond the
  S11b-PRD sample noted here and in T-92's gaps.
- **Merges/drops recorded, not smoothed:** NEW-L2-05 ≡ NEW-L3-02 → T-92; NEW-L3-03 →
  dropped into T-79. NEW-L1-02 (T-86) flagged as a T-73 fold-candidate rather than
  silently merged, because it states a residual (serving-path gap) no existing theme
  carries.
- **`counter-evidence` is present on every net-new record** (format-required); "none
  found" is not used.

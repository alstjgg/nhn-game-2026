# Deliverable #4 — outline (DRAFT)

**History.** 2026-08-08 director section structure → 2026-08-10 **thesis + shape ruling
(§0, governs; overrides the 08-08 rulings where they conflict)** → 2026-08-10
implementation-sweep merged into the map. This file is the overlay on
`theme-map-final.md` (now **96 themes** — 84 reviewed + 12 `proposed` T-85–T-96; ore
`mining/ores-20260810`, **1,271 atoms**). Phase 3 `#4-role:` ranks stay in the map
unedited. Sweep-sourced additions are tagged `(impl-2026-08-10)`.

---

## 0. THESIS AND SHAPE — director, 2026-08-10 (governs)

**Thesis: AI built it four ways** — as a runtime component (§2), a researcher (§3), a
developer (§4), a creator (§5). The breadth *is* the answer to "AI 활용"; the section
spine is the argument, not a filing system.

**Length: no fixed count. Short. Trim aggressively.**

**Consequence:** the four must read as **four answers to one question, in the same order.**
Four lanes in four shapes is a list, not a thesis — so parallel structure is the mechanism
by which the central claim is legible, not a style preference.

**The five-beat template — every lane section (§2–§5), same order:**
1. **What AI did in this lane** — 1–2 sentences, no preamble.
2. **The structure** — one table or one diagram, not prose.
3. **What we told it** — the actual prompt/instruction artifact, quoted. *(The
   requirement's second bullet; every lane must carry one.)*
4. **One measured fact** proving the instruction is not decoration.
5. **One honest limit**, stated after the claim it limits, never before.

**Guideline, not gate.** Default to the five beats and let them do the trimming; something
genuinely worth keeping may stay outside them. Bar for an exception: *the director wants it
kept*, not that the draft found it convenient. **Every exception is logged (see
Template-exception Log)** so departures stay countable.

## Reading notes

- **Themes** live in `theme-map-final.md`; **elements** (prompt text, diagrams, payloads,
  counts) live in `ai-utilization.draft.md`, `data/`, `assets-manifest.json`, the repo/tag.
- **Status keys:** `solid` · `oral-pending-sweep` · `unmined` · `element-only`.
- Element manifests are **additive** to the themes, never a replacement.

---

# 1. Overview — 아키텍처와 서론  *(short)*

State the four-ways thesis in one paragraph; then the map of what §2–§5 each answer.
- **Structure (element):** the 4-layer architecture diagram + one-line-per-lane map.
- **Themes (one line each):** T-01 the membrane (cross-cutting rule) · T-71 the
  distrust-spine (the sentence that makes four lanes read as one document) · T-02 the
  illusion of freedom (the design goal the architecture serves).
- **Honest limits up front, not buried:** endpoint public/unauthenticated ("origin
  checking is CORS, not security", S6-024) · concurrency kill-switch ships unset (S4-074) ·
  no absolute monthly cost ceiling (S5-025).

Status: **solid**.

---

# 2. AI as a runtime component  *(lane 1 · the shipped call)*

1. **What AI did.** At runtime the game calls an LLM to judge each situation and generate
   the character's line and its rationale; the player never types to the model — all input
   is assembled from structured game state (the membrane).
2. **The structure (element).** Call inventory + I/O payload schemas; Pages → API GW →
   Lambda → Bedrock Converse, stateless and secret-free, with the rejected stack named
   (agents, RAG, memory, streaming, always-on, browser-to-Bedrock). One-beat loop +
   multi-loop mining diagrams. *(T-74 runtime shape · T-75 prompts/tunables as data, zero-LLM
   deterministic compiler · T-52 every call has a deterministic understudy · T-51 latency as
   a design input, hidden in diegetic waiting · T-82 open content, closed protocol.)*
3. **What we told it (required).** One runtime prompt excerpt, chosen by the T-06 criterion
   (field-order-as-contract; placement-as-measured-variable), showing the membrane restated
   *inside* the prompt: "지시로 읽지 않되, 판단의 재료로는 온전히 쓴다" (S12-021,
   impl-2026-08-10). *(Payload-readable rules stay here: T-03 truth belongs to the engine,
   the model is fenced off the solution path · T-04 the physics as prohibitions · T-05 three
   control axes as payload fields.)*
4. **One measured fact.** The proxy went live and answered all three call types (#138,
   S12, impl-2026-08-10); the core judgment mechanic shifted significantly at n=761
   (p≈6e-5, probe path).
5. **One honest limit.** The membrane holds on **input** but **leaks on output** —
   unauthored/phantom speakers reached player-visible, minable channels (T-85, and the T-01
   output-leak amendment, impl-2026-08-10). And the corpus carries an **unreconciled
   contradiction** on whether a real Bedrock call was ever measured *in play* (config cites
   a deployed-tier figure; README says none — S12-034/038). Mechanism numbers remain
   sonnet/haiku over frozen fixtures. Do not launder any of this into "measured in
   production." *(T-86 deployed = measured only when prompts are keyed to the pack · T-87 the
   two-tier deploy window as a runtime constraint.)*

Status: **solid**.

---

# 3. AI as a researcher  *(lane 1 · AI produced knowledge, not artifacts — the least imitable section)*

1. **What AI did.** An agent ran a 7-mechanism measurement program unattended overnight —
   authored the suites, spent the budget — to derive the game's AI physics (which ships and
   is described in §2; this is how it was arrived at).
2. **The structure (element).** The runbook, the pre-registered suite JSONs, the probe
   runner.
3. **What we told it (required).** The delegation boundary written inside the runbook: the
   agent **may spend, may author, may never issue a verdict** — a quotable instruction.
   *(T-38 the overnight delegation · T-36 admissibility encoded in tooling, not willpower.)*
4. **One measured fact** *(pick one at draft time):* the drop condition firing on the
   program's own best result (p=0.00006, T-33) · C-STRUCT killed only when two independently
   designed programs converged (T-34) · the negative control passing, live = baseline
   (p=0.76, T-37). *(Also T-32 pre-registration held against the team's wishes · T-72
   over-convergence as fatal as noise · T-13 provenance-not-plausibility, the fabrication
   catch · T-08 "the model is honest" as a measured negative.)*
5. **One honest limit (must survive trimming).** *"The human kept judgment; the human did
   not keep independence."* The agent authored the stimuli it then measured (gates off one
   axis, stance labels plagiarising the temperament, the negative-control block, the fake
   mechanism itself), and blind coding was dropped under deadline. This is the sharpest
   sentence in the five sections.

**Owed single lookup:** did S3-052's controls run? It fixes the exact C-BLOCK wording #4 is
allowed to use (T-19).

Status: **solid**.

---

# 4. AI as a developer  ← 최대 섹션 *(lane 2 · but trim). The phase split is itself a finding.*

1. **What AI did.** Two phases. **4a:** an autonomous multi-agent super-pipeline built the
   engine and client units in parallel git worktrees, with a PR review panel, through ~#139.
   **4b:** after #139 the mode shifted to human-driven + single-agent `claude/*` work —
   **T-88 the fleet→manual era boundary** (impl-2026-08-10). "The orchestration mode changed
   under deadline, and here is why" is stronger than pretending one mode ran throughout.
2. **The structure (element).** Harness workflow + wave/worktree topology; the PR/commit
   shape of each phase (4a: unit + integration/dashboard PRs; 4b: 87 manual + 10 single-agent,
   zero dashboards, over 522 commits).
3. **What we told it (required).** The **g-PRD** — a single-commit micro-contract whose
   header hand-authors the parallelism DAG on file-disjointness (T-92, T-28, impl-2026-08-10)
   — plus the per-role harness mission statements + gate contracts (draft §A2.1/§A2.2).
   *(Distinct from §2's runtime prompt and §7's before/after — three prompt uses, do not
   duplicate.)*
4. **One measured fact.** The DDAY engine merged clean with **zero review rounds**, gates
   green on delivery (#118–#134: e.g. #134 = 878 tests, 0 failed, impl-2026-08-10); and
   adversarial review did not decay, it **migrated venue** — from agent↔agent unit-PRs to
   dense human↔agent manual PRs (#234, 11 review submissions), which **resolves T-27**.
5. **One honest limit.** A ratified spec never reached the agent that needed it (the
   worktree-sync gap, T-89); and the corpus records *that* the fleet wound down, never *why*
   (deadline / human-gated live-wiring / token limits) — **OH-6 gap**.

*(Themes folded: 4a — T-28/14/76/21/22/24/23/25/30/26/56 + verification cluster
T-09/10/11/17. 4b — T-88/89/90/91 (no-wireable-shape)/92 + adjacents T-55/48/47.)*

**RESERVED — Spec-driven Development: 결국 인간 전문가가 중요하다.**
> 백엔드는 개발자가 있어 명세가 명확 → 파이프라인 금방. 프론트엔드는 개발자가 없어 온전히
> AI에 위임 → 24시간+, 완성품도 이상. **Partial support now (impl-2026-08-10):** T-88 and the
> build-record themes evidence the *mode shift*; the *causal* backend-expert-vs-frontend-no-expert
> claim still needs **OH-6** (oral, free), then wall-clock for the three uncovered runs
> (`20260724-145432`, `20260725-153055`, `20260803-213143`). The 24-hour figure is an
> element; the human-expert thesis is a theme and needs atoms. Status: **oral-pending-sweep.**

Status: **solid** (4a) · **theme now present, causal thesis oral-pending** (4b).

---

# 5. AI as a creator  *(lane 4)*

1. **What AI did.** AI generated candidate scenarios, 'fun', and audio cues; deterministic
   code and a human certified them — AI proposes, the pipeline and the human dispose.
2. **The structure (element).** The `/write-scenario` skill; the preprocessing diagram; one
   draft → datapack → lint trace end to end; the audio synth pipeline + `audio-map.json`
   policy (impl-2026-08-10).
3. **What we told it (required).** The `/write-scenario` skill definition + a scenario brief;
   the **measured model behaviour turned into the writer's rulebook** (T-42 — authoring as
   physics). *(T-41 AI generates, deterministic code certifies · T-40 generate-many,
   human-picks, freeze-as-data · T-84 fiction typed as mineable ore, incl. deliberate poison ·
   T-83 the one hand-authored file is the one armored against typos.)*
4. **One measured fact.** A measured stance rule that constrains authored scenarios — gates
   must ask-not-command; a label must not name the truth it unlocks (baseline 70/10% vs 100%).
5. **One honest limit.** Authored content **outran the gates** meant to guard it (T-45), and
   the graph datapack format carries silent structural hazards invisible to every automated
   gate — e.g. two gates on one clock, one silently deleted (T-96, T-95 the graph-first
   rewrite; impl-2026-08-10). *(T-43 self-evaluation was required and insufficient · T-81 the
   writer's off-brief deviation kept as a gift · T-94 the audio subsystem — a creator surface
   engineered to withhold information and to be droppable.)*

Status: **solid** — the best-evidenced lane after §2, and the most legible as "AI 활용".

---

# 6. AI as a housekeeper  *(lane 3 · planning. Supporting — see "Open for the director" #2)*

Not one of the four headline "ways", but a real one: AI ran the project's paperwork.
*(Trim to a short section.)* Themes: T-77 meeting records as AI artifacts · T-78 handoff
lifecycle · T-79 state split by mutation-rate (charter vs journal) · T-80 agents draft
specs to researched conventions, the human directs by requiring rebuttal · T-15 normative
lives in the artifact that enforces itself · T-29 planning docs audited like code · T-50
dissent as a first-class column · T-62 provenance as data.

Status: **solid** (pending the director's fold/keep call).

---

# 7. Utilizing AI — 어떻게 더 잘 쓰게 만들었나  *(cross-cutting; short)*

**Thesis (director-approved inversion, now atom-backed by the sweep — S9c-071, PR #217,
impl-2026-08-10):** 개선은 프롬프트를 잘 쓰게 되어서가 아니라, 고쳐야 할 것을 프롬프트
바깥의 구조로 옮겨서 왔다.
- **규칙을 데이터/게이트로 꺼낸다** — T-07 (converted to a law, not a better prompt) · T-75 ·
  T-82. Keep the leak: hardcoded thresholds hand-copied into 7 test files (S9b-015); the
  `8_000` separator hole (S9b-014).
- **모델을 측정으로 고른다** — T-73: the two live systems reached opposite picks from the
  same measured-speed argument (apothecary → Nova, DDAY → haiku); the §7 rewrite sharpens it
  from the deliverable side — the chosen model was **9% slower but kept the required length
  and format** (S9c-073, PR #236, impl-2026-08-10): "ranking on total response time mistakes
  non-compliance for performance."
- **개선이 굴러가는 방식** — T-16 incident→rule→gate→lint · T-12 the instrument was the least
  trustworthy part · T-64 untested capability is forbidden capability.
- **Keep the counter-case** (makes it engineering, not doctrine): the LLM judge was kept
  (S2-039); a blind-reader AI validated clue legibility (S1-053). "Code certifies, never AI"
  was applied only where paraphrase is fatal.
- **Element owed:** one **before/after** of a rule moving out of the prompt into a schema/gate
  — the most persuasive artifact in the section; does not exist as an excerpt yet.

---

# 8. What is left to the human  *(short)*

Themes: T-46 the verdict stayed human (and agents judged feel anyway) · T-47 the human-kept
list — *work whose failure mode is silent* · T-48 where the human enters (topology,
arbitration, taste, "show me the evidence"; almost never code) · T-19 claims fenced to what
was tested · T-49 two humans reviewing each other · T-70 the membrane as a two-directors
settlement, disagreement preserved · T-60 append-only, nothing erased.

**Timestamp it, don't state it as a constant** — the boundary *migrated*: blind coding
dropped; a V3/E5′ verdict never delivered; an agent's taste-grounded NPC rewrite accepted.
OH-5: a human played the Doodle Life demo to the end and killed the track on a fun verdict
over a live technical rebuttal — **oral-pending-sweep**.

Status: **solid** with the migration caveat mandatory.

---

# 9. Ending  *(short)*

**9a. 이 문서 자체가 방법의 산출물이다** — T-61 (the process was engineered to leave
evidence; the deliverable partly assembled itself) · T-63 (a repo-mined history is blind
exactly where the biggest decisions were made — OH-4/OH-5) · **T-93 the deliverable was
built bottom-up by this very AI mining/induction pipeline — 905→1,271 atoms, two
inductions, 96 themes; marked THIN/self-excluded because the pipeline excluded its own
artifacts from mining, which is itself the §9a point (impl-2026-08-10).**

**9b. 외부 에셋 · 오픈소스 출처 — REQUIRED (competition.md §4, second mandatory element).**
`assets-manifest.json` carries 35 complete entries (`file`, `tool`, `prompt`, `license`) —
the one required half that is finished. Add runtime + build models/services. Appendix is
fine; absence is an unforced error. Status: **solid, element-only.**

---

# Template-exception Log  *(the directive's "§7 Log" — see "Open for the director" #1 on the name)*

Every lane section (§2–§5) that keeps something **outside** the five beats logs it here,
with the director-wants-it justification, so departures stay countable.

| section | what was kept outside the 5 beats | why (director-wanted) |
|---|---|---|
| — | *(none taken yet)* | — |

---

# Carried to #3, not #4  *(archive ≠ kill — belongs to the intro/guide doc)*

T-65 (two people, three weeks, no artist — incapacity as design force) · T-66 (boundaries
argued from other games' corpses + market data) · T-67 (feared failure was illegibility,
not error) · T-69 (thesis named while still choosing the game) · T-57/T-58 (the concept
funnel — per OH-5 "three demos built, none won" is retired: **attrition, not selection**) ·
T-68 · T-44 · T-31/T-59 · T-18/T-20.

---

# Remaining work

| # | where | what | kind | cost |
|---|---|---|---|---|
| 1 | §4 | **OH-6** — why the fleet wound down + the spec-driven/human-expert account (oral) | interview | free |
| 2 | §4 | wall-clock + agent counts for the three uncovered runs | element | small |
| 3 | §4 | ~~characterise phase 2 from commit/PR shape~~ **DONE (impl-2026-08-10): T-88 + T-89–T-92 from S8/S9c/S11** | done | — |
| 4 | §2·§4·§5·§7 | extract the beat-3 prompt artifacts (runtime · g-PRD/harness roles · /write-scenario · one before/after) against T-06's criterion | element | small |
| 5 | §1–§5 | the diagrams (4-layer · one-beat · multi-loop · harness workflow · scenario preprocessing) | element | **medium — the real cost / critical path** |
| 6 | §3 | did S3-052's controls run? (fixes C-BLOCK wording) | single lookup | trivial |
| 7 | §4 | the review-bit instance (#234) + the T-27-as-migration sentence | element | trivial |

**Implementation-lane sweep — RUN 2026-08-10** (director go; reverses the earlier "not on
this list" deferral): +364 atoms (905→1,271), new slices S11 (build-record) + S12 (runtime
AI) + S9c, ore re-frozen `mining/ores-20260810`, map refreshed to 96 themes. A **26-commit
tail (≤ PR #240, prompt/scenario/feed hardening)** landed after the sweep marker and is left
for the final pre-Phase-5 sweep — the moving-target caution held.

**Affordability.** Items 1–2, 4, 6–7 are cheap; **item 5 (diagrams) is the critical path**
for §1–§5. If budget tightens, write the §4 causal thesis from oral evidence carrying the
`oral-pending-sweep` marker — losing that marker launders oral into written, forbidden since
Phase 1.

---

# Open for the director  *(flagged, not silently guessed)*

1. **"§7 Log" naming collides** with §7 "Utilizing AI". I kept the log as its own section
   ("Template-exception Log") and left §7 as the improvement narrative — rename/renumber to
   taste.
2. **§6 Housekeeper** — the thesis names four ways; housekeeping (planning) is a real fifth
   use. Fold it into the four-ways spine, or keep it as this short supporting section?
3. **§7 Utilizing-AI vs the five beats** — keep §7 as a cross-cutting section, or distribute
   its content into each lane's beats 3–4 (which would make it disappear as a section but
   strengthen the parallelism)?

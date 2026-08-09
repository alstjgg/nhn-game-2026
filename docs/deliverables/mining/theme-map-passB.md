# Phase 2 · Pass B — theme map (sharded BY LANE)

Induction of candidate themes from the 905 story atoms, sharded by **lane** (each
lane-agent read across all ten slices). This is the lane-sharded counterpart to
Pass A's slice-sharding; a later reconciliation step compares the two. Pass A was
**not** read while producing this map — the two passes are independent by design.

## Coverage — what was swept, sampled, skipped

- **Inputs read in full:** `theme-format.md`, `atom-format.md`, `oral-history.md`
  (OH-1..OH-4), `coverage-audit-successes.md`, the three seed hypotheses + the
  2026-08-05 clarification. **`theme-map-passA.md` was not opened, grepped, or
  handed to any sub-agent.**
- **Atom sweep:** five sub-agents (B1 lane 1, B2 lane 2, B3 lane 3, B4 lane 4,
  B5 cross/unlanded) each swept all ten atom files (`atoms-S1..S9b.md`) for every
  atom whose `lanes:` field included their lane (multi-lane atoms counted in every
  lane they carry). Rough per-lane census as reported by the agents: lane 1 ≈230
  atoms, lane 2 ≈210, lane 3 ≈"50+ of S6's 198 plus S4/S8/S9 tails", lane 4 ≈95,
  cross (`unclear`/multi-lane) ≈30 `unclear` + ≈120 multi-lane + flag-level
  `proposed:` signals in S9a/S9b. Agents read full atom bodies for cited atoms;
  large files (S6 1750 lines, S9b 1614, S9a 969) were paged/grepped by lane rather
  than read linearly, and the lane-orthogonal review-mechanics atoms were sampled
  where they never touched the agent's lane. No agent claims exhaustive line-by-line
  reading of S6/S9b.
- **What this pass did NOT do:** no selection, ranking, or pruning (Phase 3's job);
  no new atoms mined; contradictions preserved, not resolved.

## Known input defects carried in (not fixed)

1. **S8's "Doodle Life cut pre-build" is wrong.** Corrected sequence used
   throughout: **three demos built → none won → a fourth new concept (DDAY) won**
   (OH-4). Any atom asserting only two demos is treated as the defective finding.
2. **117 commits + 4 PRs — including #110 and #116, the two largest integration
   PRs — postdate the corpus snapshot and are unmined.** This bites lane 2 hardest;
   every theme resting on final-panel / integration evidence flags it under `gaps`.
   Note a live tension: some S9b atoms (S9b-024..065) *do* carry deep #110/#116
   panel material dated 08-03/08-04, so the snapshot boundary is fuzzy — flagged
   where relevant rather than resolved.
3. **Failure-weighted mining bias (0.29 wins:limits).** S3/S6/S1 never got the
   NEUTRAL→WIN rebalance pass; wins are under-represented there. Win-sweep atoms
   (`-W` suffix, e.g. S9a-W002, S8-W010) are cited where they carry a distinct
   capability event.

## How this map was merged — convergence signal

Each theme carries a **seen-by** line naming which lane-agents independently
surfaced it. Themes multiple agents reached from different lanes are the strongest
signal (marked **⇈ convergence**). Themes only one lane-agent raised are marked
**[single-source]** — kept in full (they may be real capability-shaped patterns a
single lane is best placed to see), but flagged so reconciliation knows they lack
cross-lane corroboration *within Pass B*. Because each lane had exactly one agent,
most lane-specific themes are single-agent by construction; the flag matters most
where cross-lane corroboration would have been expected and did not appear.

Atom ids are the sub-agents' citations, preserved verbatim. Where two agents cited
overlapping-but-not-identical id sets for one merged theme, both sets are kept.

---

# A. Cross-lane / spine themes

### T-01 — The membrane: the player never types free text to the LLM
- thesis: The founding invariant of every concept and the shipped game is that the
  player never sends free text to a model — all LLM input is assembled from
  mined/structured game elements (sentence blocks, cards, telemetry). It predates
  the concepts, outranks them, and is enforced structurally, not by policy.
- lanes: cross (primary 1)
- origin: seed-confirmed:1 (the closed-environment mechanism the seed names)
- seen-by: B1, B2, B4, B5 — **⇈ convergence (4 lanes)**
- support: S1-003, S1-008, S1-012, S1-037, S1-043, S4-015, S4-023, S4-038, S5-021,
  S5-026, S6-005, S6-061, S6-077, S8-029 (UI factory cannot build a text input),
  S9a-007, S2-007/S6-058 (fabrication incident re-derives the membrane by an
  independent path)
- counter-evidence: NOT absolute in the pre-DDAY apothecary runtime —
  `history[].npcLine`, `playerChoiceLabel`, `availableClues[].text` reach the
  prompt verbatim, documented as "an accepted, mitigated residual risk, not an
  absence of free text" (S4-073, S5-040, S6-181, S9a-075). Engine-side breach:
  `inner_note` leaked into the certified fact channel in shipped fallback code
  (S9b-024/025). DDAY's proxy-renders-everything design later closes this class
  (S6-027). Looked across S4/S5/S6 residual-risk atoms and S9a/S9b security threads.
- gaps: The corpus cannot date the membrane's *founding* moment; S4-015 (07-24) is
  the earliest written reference and treats it as already in force.
- oral-only: OH-1 (founding agreement predating the concepts) — written record
  attests the membrane only as already-in-force, never its origin.
- fit: #4 section · #5

### T-02 — The membrane was a two-directors settlement, and the record preserves the disagreement
- thesis: The membrane (and in-game AI broadly) was not consensus but a negotiated
  settlement between two people with opposite instincts (민서 against in-game AI,
  윤석 for it). The settlement moment is oral; its written residue is real —
  recorded unresolved disagreements, and in-game AI engineered as an explicitly
  optional, degradable layer (the shape you build when inclusion was a live question).
- lanes: cross (project-wide, two directors)
- origin: emergent (written residue) / oral (the settlement)
- seen-by: B5 — **[single-source]** (only the cross-agent surfaced it; lane agents
  saw the residue atoms but not the settlement framing)
- support: S4-005 (dissent: "delegate MORE to the LLM"), S4-012/S4-019 (variance-as-
  bug-or-fun unresolved; "AI methodology vs game fun" weighting "가중치 합의 없음"),
  S4-013 ("게임적 개념만 유지" compromise — closest written trace), S9b-113/S5-022
  (AI designed to be droppable; provider failure never blocks the game)
- counter-evidence: The written record shows the disagreements *converging* — by
  07-24 the membrane is uncontested law (S4-015), so a reader of only the late
  corpus sees consensus, not two camps. The "two directors" framing rests on
  OH-2/OH-3 + the early-meeting dissent atoms.
- gaps: The corpus cannot show *who conceded what*; the negotiation content is oral.
- oral-only: OH-2/OH-3 (settlement between two people), OH-4 (compromise=consensus).
  Core claim rests on these — do not launder into written fact.
- fit: #4 section · #3

### T-03 — Illusion of freedom: generative freedom staged on a closed deterministic spine — in-game AND in-build
- thesis: The design thesis "a generatively-free agent on a closed deterministic
  graph" is both the game's architecture (LLM proposes intent/judgment/narration;
  a deterministic engine owns all state and the verdict) and — the cross-lane
  finding — the project's *development method* (frozen inputs / byte-parity /
  structural isolation around autonomous agents). The same move at two altitudes.
- lanes: cross (primary 1)
- origin: seed-confirmed:1
- seen-by: B1, B4, B5 — **⇈ convergence (3 lanes)**
- support (in-game): S1-009, S1-014, S4-003, S4-038 (model selects intent from
  allowedActions; engine is authority), S4-066, S5-026, S6-079 (the thesis verbatim:
  "generative freedom can be staged on a controllable structure"), S6-083, S6-084,
  S6-109, S3-032, S1-043, S6-170. Support (in-build, same shape): S5-006/S6-150
  (frozen-inputs guard), S8-047 (isomorphism as a compile error), S8-029 (UI toolkit
  with no text-field code path), S2-011 (structural isolation of the judgment agent)
- counter-evidence: The maximal-freedom pole was tried and clawed back at BOTH
  altitudes — in-game full-delegation (Doodle Life, 1–2 min/call, S4-010) and
  in-build "governance without a rendered pixel" (frontend-mod v1 killed, S5-012).
  Recorded dissent that the closed environment is the wrong call (S4-005). The
  boundary drifted and needed re-enforcing: BUCKET_CONFIG hardcoded in `src/`
  (S9b-014/015), a bucket-id where a stance-id belonged (S9b-060). Placement
  (S1-055) inverts the allocation entirely. The in-game/in-build parallel is B5's
  synthesis — no atom states the team *saw* it.
- gaps: Whether the illusion reads as freedom to a judge in 60s (vs. a constrained
  puzzle) is untested — no human read confirms it (S6-063 debt carried).
- oral-only: the seed's framing and the "게임은 왜 재밌을까 / 자유도" discussion left
  no written trace (S4 OH-1 hook 6).
- fit: #4 section · #2 video beat

### T-04 — The distrust-spine: trust-inversion as the project's single cross-lane stance
- thesis: The defining posture is *selective distrust of the model's characteristic
  failure modes*, recurring identically in every lane — the LLM is barred from
  owning truth (game), reviewers re-run every self-reported GREEN (build),
  measurement outranks the plan (research), a deterministic compiler is chosen over
  an LLM (creation). The named enemy is always the same set: fabrication, sycophancy,
  self-attribution inversion, context decay, self-serving status.
- lanes: cross
- origin: emergent
- seen-by: B5, B2, B4, B3 — **⇈ convergence (4 lanes)**
- support: S6-185 (both harness invariants are anti-trust), S9a-008/S9a-027 ("돌린
  적 없는 검증을 통과했다고 쓰지 마라"), S2-004 (trust `tool_uses`, not prompt
  obedience), S3-005 (model fabricates block ids → compliance ≠ evidence),
  S1-041/S2-018/S6-056 (`because` self-attribution demoted to theater), S3-058/S6-158
  (unexplained success as illegible as unexplained failure), S2-062 (`refs` honest
  "merely because the prompt asks")
- counter-evidence: The distrust is *selective*, not blanket — the team extended
  real trust to AI: kept the LLM-judge for accepting an off-script solution
  (S2-039/S1-023), handed an autonomous agent hundreds of overnight calls (S3-018),
  ruled "agents wrote the game code — humans did not hand-write it" (S6-195). A
  theme claiming pure distrust overreaches; the pattern is *calibrated* trust.
- gaps: Whether distrust was a day-one philosophy or an accretion from incidents is
  untraced; the written record shows it hardening after failures (S2-001, S9a-009).
- oral-only: none.
- fit: #4 section · #2 video beat · #5

### T-05 — "재미있나를 판단하는 것": the fun/quality verdict never lands in the machine (seed 3)
- thesis: Across every lane the final judgment of *is this good / fun / real* is
  reserved to a human by written rule — fun by hand-play (creation), demo-kill by
  playtest (build), mechanism verdict cards (research), the irreversible merge to
  main (build), the concept-selection call. AI runs, implements, measures, and
  generates up to the verdict, and stops.
- lanes: cross
- origin: seed-confirmed:3
- seen-by: B5, B2, B3, B4, B1 — **⇈ convergence (all 5 agents)** — the single most
  broadly corroborated theme in the map
- support: S3-055/S3-018 ("produce evidence, not verdicts"), S4-033/S4-011 (playtest
  fun-verdict kills Doodle Life over a "fix-it" counter-argument), S2-022/S2-040
  (report-quality/fun judged by "사람이 한다"; human overruled the AI-rubric's
  morality), S6-195/S6-191 (humans own scope arbitration, live-key verification, the
  final merge "the harness is forbidden to do"), S9b-141 ("사람이 판정한다 … 모호하면
  기본값은 texture"), S1-020 (paper-test fun judged by humans before code), S9b-108
  ("no wrong answer"), S6-063 (human evals accepted at concept confirmation)
- counter-evidence (central, preserved): The boundary is **porous and it migrated.**
  (a) The team *did* push measurement into fun-adjacent territory — policy-gap "추리가
  값을 하는가" is an instrument for "is this fun-shaped" (S6-145, S7-014), and
  game-feel became a *scored review lens* with an evidence bar (S5-005, catches at
  S6-190). (b) An LLM *does* judge inside the game — the kept LLM-judge, called "이
  아키텍처의 존재 증명" (S2-039/S1-023/S3-036). (c) Under deadline the human verdict
  was *skipped or traded*, not exercised: blind coding dropped (S3-023/S3-056),
  V3/E5′ fun/quality evals "accepted into concept confirmation" without a separate
  verdict (S6-063). So the seed holds as a *rule* more cleanly than as a *practice*.
- gaps: The corpus never shows a human judging DDAY's fun *in play* — every fun
  verdict is on paper tests or demos; the deferred V3/E5′ verdict is never delivered;
  human-verdict reproducibility between the two members is unmeasured.
- oral-only: OH-1 fun-discovery discussion ("게임은 왜 재밌을까") and OH-2's "why games
  are fun" list are the seed's oral *origin*; its *practice* is heavily written.
- fit: #4 section · #3

### T-06 — Structural enforcement: forbidden states are made unrepresentable
- thesis: The repeated answer to "an agent might violate rule X" was to make X
  mechanically impossible rather than prompt against it — DOM stripped from the core
  tsconfig (isomorphism is a compile error), a UI factory with no code path to a
  text input, isolation moved to the transport layer after `tools:[]` proved
  unenforced, frozen globs blocked by deterministic workflow JS, a stub-mode deploy
  that physically lacks the live path.
- lanes: cross (primary 2)
- origin: seed-confirmed:1 (the closure is built, not asked for)
- seen-by: B2, B5, B1 — **⇈ convergence (3 lanes)**
- support: S8-047/S8-W006 (tsconfig.core strips DOM → TS2584, "리뷰 코멘트가 아니라
  컴파일 에러"), S8-029/S8-W007 (UI layer "cannot build a text-entry control"),
  S8-036/S9b-143/S6-157 (isolation moved from unenforced `tools:[]` frontmatter to
  bare Messages-API transport with exactly one tool), S5-015 (glob-overlap validation
  moved from LLM checklist to deterministic JS), S5-006 (frozen-inputs guard),
  S4-065/S8-020 (deploy is stub-mode by construction), S2-011
- counter-evidence: Structural enforcement itself failed and had to be re-grounded —
  S8-036/S6-157 exist *because* the configured `tools:[]` safeguard was silently not
  honored (a "structural" claim that was really instruction; the fix was a deeper
  layer). S6-093: two "structural" constraints (datapack ships to browser / lives at
  data/) "cannot both stand" until a build-time copy — structure can encode
  contradictions. So "make it impossible" is a discipline that itself needs verifying.
- gaps: Whether transport isolation holds under adversarial *player* input in the
  production proxy is untested (v2 validated 0/82 on the probe harness only, S2-010).
- oral-only: none.
- fit: #4 section · #3

### T-07 — Provenance & preservation: never delete a failure — the record is a deliverable AND is irreproducible
- thesis: One evidence-preservation discipline runs through all lanes,
  over-determined by two forces pointing the same way: (a) LLM output is
  non-reproducible, so a deleted record cannot be regenerated; (b) the commit
  history / process trail is itself graded (#4). Hence quarantine-not-delete,
  append-only run logs, immutable raw artifacts, superseded work merged with a
  status label, the source draft shipped byte-identical inside its pack, broken
  archive links kept on purpose, reversals annotated in place.
- lanes: cross (primary 3)
- origin: emergent
- seen-by: B5, B3 — **⇈ convergence (2 lanes)**; B3 split it across three sub-themes
  (housekeeping / reversal-annotation / provenance) folded here
- support: S2-003 (fabricated runs quarantined "사건 증거로 보존"), S3-002 ("실패한
  구성도 지우지 않는다"), S6-002/S6-028 (main history immutable *because* deliverable),
  S6-052/S6-069 (archives keep broken links; archived doc names its 3 superseded
  claims), S6-092/S8-051/S8-009/S9b-114 (reversals preserved verbatim + annotated),
  S6-194 (a missing co-author trailer *kept*, not rewritten), S7-004 (byte-identical
  draft duplicated into the pack as self-audit), S9b-129 (139 files moved as 100%
  git-mv renames), S9a-088/S9a-081 (over-large PRs split, original branch undeleted)
- counter-evidence: Preservation is not absolute — the model-selection benchmark was
  *deliberately dropped* (S5-023/S4-072); leaked tool-call XML survived unreviewed
  ~10 days across two moves (S5-011); an entire merged PR's content silently dropped
  from main until cherry-picked back (S9b-130); a README stale self-contradiction sat
  unannotated at snapshot (S6-013). The rule is "delete only deliberately, with a
  reason" — S5-011 and S9b-130 violate it.
- gaps: Cannot quantify genuinely-attempted work that left no trace (see T-12).
- oral-only: none.
- fit: #4 section · #5

### T-08 — Identity/account discipline: held in spirit, drifted in letter
- thesis: The hard rule (personal attribution, no corporate trace) is a genuinely
  project-wide, lane-agnostic governance stance — it governs the repo-as-deliverable,
  not any single AI use. The commit record shows the rule's *intent* holding
  perfectly (no corporate identifier anywhere) while its *letter* drifts across
  machine/config boundaries; agents surfaced the ambiguity rather than hiding it.
- lanes: cross (governance; atoms tagged lane 3)
- origin: emergent
- seen-by: B5, B3 — **⇈ convergence (2 lanes)**
- support: S6-001 (the hard rule), S8-057 (39 commits under a personal-but-not-the-
  rule's-literal-account address), S8-058 (placeholder `agent@example.com` on two
  landings), S8-023 (machine-local trailer on an asset commit), S9a-002 (agent flags
  its own git-identity gap: intent satisfied, letter not), S9b-126 (reviewer scrubs
  personal cloud specifics from a public doc — the discipline working)
- counter-evidence: The rule's *core* is uncontested — no corporate-domain address
  appears anywhere; the drift is in the letter, not the purpose. A theme claiming
  "the rule failed" would be wrong.
- gaps: The corpus cannot affirmatively prove no corporate machine was ever an
  author — by construction that trace is absent (which is the rule working).
- oral-only: none.
- fit: #4 section · #5

### T-09 — Documents are a machine interface: register, language, and precedence are engineered for agent readers
- thesis: Because the primary readers of the binding docs are AI agents (decomposers,
  review panels, fresh-context build sessions), the team treats natural language,
  register, and precedence as functional parameters — English for anything an agent
  builds against, Korean reserved for authored game content, "an invariant not
  written down does not exist," frozen throwaway inter-session contracts, the
  dashboard-PR as a control surface.
- lanes: cross (primary 3)
- origin: emergent
- seen-by: B3, B2, B5 — **⇈ convergence (3 lanes)**
- support: S6-034/S8-050 (812-line KO→EN translation "because primary readers of
  docs/ are agents"), S8-027 (Korean prose in an English PRD "broke the harness's
  reading"), S4-054/S4-055 ("every ambiguity becomes improvisation or a stall"; "an
  invariant not written down does not exist"), S6-143 ("agreement works by document,
  not discussion"), S4-049/S4-039 (frozen throwaway contract; goal-prompt with a
  conflict-precedence rule), S9b-001/S9b-002 (dashboard-PR-as-control-surface),
  S9a-067, S6-011
- counter-evidence: The rule is scoped, not total — S6-034/S8-050 carve out Korean
  for authored data and dated archive records; the one prose file outside the
  discipline (README, S6-013) went stale and self-contradictory. B5 argues this is a
  candidate *new lane* or *axis* (docs-as-interface); B3 keeps it inside lane 3.
- gaps: No atom quantifies whether the English switch reduced agent error or the
  register drift actually broke a decomposer run (S8-027 asserts it did, unmeasured).
- oral-only: OH-3 §1 (research the 현업 통용 양식 first, then write on top) corroborates
  the technique; the "docs the human had never written before" claim is OH-only.
- fit: #4 section

### T-10 — AI-orchestrating-AI: the method documents itself (deliverable #4 auto-drafts from the harness's own exhaust)
- thesis: A reflexive layer the four lanes don't name — AI orchestrating, reviewing,
  measuring, and *documenting* AI. An end-of-run agent mines board/PR-trail/manifest
  into a draft of competition deliverable #4; agents mutation-test other agents'
  guards; an AI runs probes on other LLMs under rules that treat the referee as a
  contamination risk; a known-fake negative control validates the pipeline before its
  verdicts count. The orchestration design is itself the graded artifact.
- lanes: cross (2 + 3)
- origin: emergent
- seen-by: B5, B2, B3 — **⇈ convergence (3 lanes)**
- support: S5-007/S5-W009 (deliverable #4 auto-drafted by the harness; "the harness
  itself *is* the 'director of AI' narrative"), S6-184 (section auto-drafted, "every
  number read from run state, nothing estimated," 12 visible TODOs, "do not delete a
  TODO by guessing"), S2-012 ("당신이 하네스다"), S3-021/S6-159 (known-fake negative
  control: "if it returns 'verified', STOP THE ENTIRE PROGRAM"), S9a-008/S9b-009
  (agents mutation-test other agents' guards), S3-064 (a second AI structures the
  audit format), S4-059 (DISCOVERY.md a first-class per-run deliverable), S6-198
- counter-evidence: The self-authored draft has integrity holes it must confess —
  S6-188 (six reviews exist only on disk, not in the PR trail the deliverable wants
  to cite), S6-194 (a missing trailer kept), S6-198 (draft covers one run of 3+). The
  orchestration *tool* (super-pipeline) is deliberately kept in a separate repo, out
  of the deliverable (S6-010), so one could argue the method-tool is not a repo lane.
  A human polish and this very mining phase exist *because* the auto-draft can't close
  its own gaps.
- gaps: The auto-draft covers only the apothecary v1 run; the darkest-context run,
  the DDAY engine build (#116), and the mechanism program have no equivalent capture
  — and the largest runs postdate the snapshot.
- oral-only: OH-3 §3 operator view ("유능한 개발팀을 고용한 것에 가까운 경험") — oral.
- fit: #4 section (arguably the *center* of deliverable #4)

### T-11 — Cost & attention as a first-class design force in every lane
- thesis: Budget — LLM calls, wall-clock latency, human reading-time, cloud spend —
  is treated not as a constraint to satisfy but as an active force that changes *what
  gets built*. The binding resource is repeatedly re-identified (calls → attention →
  context), and features are refused until a measurement earns them.
- lanes: cross
- origin: emergent
- seen-by: B5 — **[single-source]**
- support: S3-004 ("calls are effectively free; attention is not"), S3-048/S3-053
  (a validated gate priced at "an afternoon + 30 calls"), S6-192 (quality gates stay
  on the strongest tier: a cheap always-pass gate "would poison the harness's own
  learning signal"), S5-018 (LLM vision rationed ≤2 images/attempt), S2-069/S6-106
  (the narration off-switch refused until latency data earns it)
- counter-evidence: Cost sometimes *lost* on purpose — haiku kept over the cheaper
  Nova to preserve measurement continuity (S6-022/S9b-186); a public unauthenticated
  endpoint with "no absolute monthly cost ceiling" accepted (S5-025, S9b-188). Cost
  is first-class but not top of the order — continuity and the membrane outrank it.
- gaps: No total-spend figure exists (the AI-utilization draft's token total is a
  TODO, S6-184); the corpus prices individual decisions, never the project.
- oral-only: none.
- fit: #4 section · #5

### T-12 — Method finding: repo-mining under-counts work whose artifact never landed
- thesis: A cross-cutting caveat on the completeness of every lane's evidence — a
  repo-mined history systematically under-counts effort whose artifact never landed.
  The pivotal DDAY-discovery discussion left no meeting note; a whole built-and-played
  demo (Doodle Life) survives only as screenshots; the oral channel is what caught it.
- lanes: cross (a caveat on the mining method)
- origin: emergent (surfaced by the carried input defect + OH-4)
- seen-by: B5, B3 — **⇈ convergence (2 lanes; both call it a method-finding)**
- support: S4-021 (DDAY "appears for the first time as the confirmed outcome, with no
  minutes documenting the discussion that produced it" — record-gap), S8-030 (DDAY's
  commit exists 07-29 but the discussion doesn't; `demos/` never contains DDAY), the
  carried correction that Doodle Life was built-and-played but never landed (OH-4)
- counter-evidence: The repo is not blind to its own gaps — the AI-utilization draft
  enumerates what it doesn't cover (S6-198); status/handoff atoms flag record-gaps
  (S4-021's own flag). The finding is that it can only flag gaps it *noticed*.
- gaps: By definition the corpus cannot bound how much *unnoticed* unlanded work
  exists — that ceiling is only reachable via OH. **New corpus target: the Doodle
  Life screenshots (off-repo); if they enter the repo they need `assets-manifest.json`
  entries (hard rule 5).**
- oral-only: the demo-count correction rests on OH-4; the DDAY-discussion existence on
  OH-1 + the 07-24/07-28 inference.
- fit: #4 section (a methodological honesty note #4 should carry)

### T-13 — Pacing / 속도감: the illusion of pace, pursued via latency-hiding and diegetic waiting (seed 2)
- thesis: "Feels like a game" is pursued through reactivity, deterministic fallbacks,
  design-time pre-generation, and calls hidden behind animations/diegetic pauses,
  codified as "latency hides in natural pauses; never block mid-action gameplay." The
  finding: the *speed itself* was largely never achieved — it was sidestepped by
  making waiting diegetic, and the concrete latency numbers were repeatedly withdrawn
  or blown.
- lanes: cross (primary 1, with a lane-2 build bridge and a cost cross-tie)
- origin: seed-confirmed:2 (with a strong "how" nuance)
- seen-by: B1, B5, B4 — **⇈ convergence (3 lanes)**; B3 reports it **seed-unevidenced
  for lane 3** and B4 **seed-unevidenced for lane 4** (no creator-lane home)
- support: S4-009 ("10초도 길다"; reactivity over tech-demo), S1-014/S5-036 ("전투는
  LLM을 기다리지 않는다"; 3s class-default fallback), S5-022 (provider failure never
  blocks), S6-006 (latency hides in natural pauses), S1-035/S5-035 (chatter
  pre-generated at design time), S6-045 (a party "election" invented to hide two
  wall-clock calls), S1-044 ("'무전 회신 대기 중'은 랙이 아니라 서스펜스"), S6-170
  (a one-line edit's effect "must appear early and visibly")
- counter-evidence: The speed mostly did NOT materialize as measured responsiveness —
  ~19–75s figures withdrawn as measuring subagent round-trips not API calls
  (S3-004/S6-080), the first real reporter call blew its budget 2/3 and the "passing"
  one "beat the clock by breaking the contract" (S6-020/S8-060/S9b-185), SSE streaming
  was never built (typewriter is a client-side replay, S6-081). The "must appear early
  and visibly" requirement is asserted in guides (S6-170) but never measured against
  actual player perception. So the seed reads best as *illusion of pace via fiction
  and fallback*, not achieved speed — it lives in lane 1 with cost (T-11) as its real
  cross-tie; the pacing-as-freedom causal claim is under-evidenced.
- gaps: No end-to-end player-felt latency measurement existed at snapshot (proxy went
  live 08-04 with only smoke numbers, S6-017) — the seed's payoff is unmeasured.
- oral-only: OH-3 §2 uniquely frames latency as a *design problem*; the "속도감"
  framing is otherwise oral.
- fit: #2 video beat (diegetic waiting) · #4 section

---

# B. Lane 1 — AI-in-the-game

### T-14 — Temperament, not equipped sentences, is the lever — and the discovery inverted the design
- thesis: PoC measurement found equipped sentences barely move an LLM's judgment
  while swapping an authored (player-invisible) temperament reproduces the full
  choice spectrum; the core loop was rebuilt around belief-state manipulation, and
  temperament was later removed from the *player's* channel entirely (I13, C-TEMP
  dropped).
- lanes: 1
- origin: emergent
- seen-by: B1 — **[single-source]** (lane-1-native mechanism)
- support: S1-015, S1-040 (24/24 convergence without temperament; "판단을 가르는 최강
  레버는 장착 문장이 아니라 기질"), S2-017, S2-019, S2-033, S6-055, S6-161 (C-TEMP
  removed), S8-035 (reviewer restored the frozen "temperament invisible" constraint)
- counter-evidence: The sentence channel was *not* dead — it was hidden by a bad
  measuring instrument; changing only the stance set took the same block 0/10→9/10
  (S3-016, S6-173, S8-040), reviving injection as the player lever. Both "temperament
  is the lever" and "the block is the lever" are true under different apparatus —
  preserved tension (S6-055 records the block "initially looked dead").
- gaps: All temperament findings are haiku/sonnet on frozen fixtures; whether authored
  temperament reads as *character* to a player is unrun (S6-063).
- oral-only: none.
- fit: #4 section

### T-15 — Measured model-physics becomes authoring law: vocabulary alignment, and the writing brief as a physics textbook
- thesis: An injected fact flips a conditional temperament only if it shares the exact
  vocabulary axis the condition watches ("위협 축의 부정은 공포 축의 긍정이 아니다").
  This measured failure became an authoring law, a data-schema field, and a lint rule
  — and more broadly, PoC findings about how an LLM actually reads flowed back into
  the scenario writer's guide, which reads as measured physics (reserved axis
  vocabulary, mandatory 기질 sections, banned dramatic tropes).
- lanes: 1 (with 4)
- origin: emergent
- seen-by: B1, B4 — **⇈ convergence (2 lanes; lane-1 mechanism + lane-4 authoring)**
- support: S2-027, S2-028 (V2″: one sentence rewritten onto the fear axis → 3/3 flip),
  S6-057, S7-010 (axis vocabulary as a lock's metallurgy, lint A12), S6-090, S6-174
  (추궁 0/50 → 심문 3/10: labels are tuning knobs), S3-054, S2-051 (기질 a required
  draft section), S2-052, S6-170 ("규칙은 취향이 아니라 실제 측정으로 확정된 물리"),
  S6-171 (injection irreversible → "seeing through the lie" scene is a physics
  violation), S6-176 (anti-pattern gallery of measured gate-killers), S6-175 (fixture
  slack beats any gate), S2-050 (v1's fatal 3h20m clock)
- counter-evidence: The "physics" is provisional and bends — C-BLOCK "adopted but not
  verified" (S3-047/S6-038), all v1 measurements were sonnet and haiku must be
  recalibrated ("모델이 너무 유능하다" could invert, S1-045), a "dead" stance revived by
  a one-word relabel (S6-174). And "a large pool with a hidden matching rule is the
  classic unfair-puzzle shape" (S6-091) — the mechanism that makes injection precise
  risks an illegible lottery (the #1 cross-concept risk, S1-056). The physics rules
  also make good scenes un-writable (S6-170), and the best sentences kept landing in
  *discarded* over-length drafts (S6-060/S2-035).
- gaps: Whether players can *discover* the axis-matching rule unaided is unmeasured
  (S6-164 specified, unrun); transfer of the induced rules to a new disaster fiction
  is asserted, not measured.
- oral-only: none.
- fit: #4 section

### T-16 — Under measurement, over-convergence is as fatal as noise
- thesis: For a game built on model judgment, determinism is as dangerous as variance
  — an early run set that came back 24/24 identical was a design emergency ("if every
  player's agent behaves identically, assembly is decoration and the core claim
  collapses"), so reproducibility is tracked as a measured variable per gate, not
  pass/fail.
- lanes: 1
- origin: emergent
- seen-by: B1 — **[single-source]**
- support: S2-015 (24/24 "over-passed"), S6-154 (over-convergence named as a failure
  mode), S6-155 (eligibility floor kept qualitative — 80% indistinguishable from 60%
  at N≤5), S1-040
- counter-evidence: The opposite pole (dispersion / a gate firing unreliably) is
  treated as equally disqualifying (S6-154, S3-035 flipped placebos) — a two-sided
  constraint. The "24/24" was on sonnet, later invalidated for haiku (S2-023).
- gaps: No production-model (haiku, schema-forced) reproducibility distribution across
  a full run exists; variance metrics (S6-145, S7-014) specified but unrun.
- oral-only: none.
- fit: #4 section

### T-17 — Model tier chosen by measured access/latency/cost — never prestige — and pinned to the measured mechanism
- thesis: Runtime model selection was driven by real invocation results (access
  denials, JSON compliance, per-token latency, cost vetoes, thinking-off) and,
  decisively, by measurement continuity: the shipped model must be the model the
  mechanism was measured on, or the science is void.
- lanes: 1
- origin: emergent
- seen-by: B1 — **[single-source]** (merges B1-06 model-selection + B1-12 measured==deployed)
- support: S2-063 (reasoning strength incommensurable across models), S2-064,
  S9a-080 (thinking blows the beat budget; Nova 2 Lite p50 ~1s), S5-023, S5-024
  (blind two-scorer quality test, tie→cheaper Nova), S6-022/S9b-186 (Nova measured
  faster but rejected: "switching would decouple the measured mechanism from the
  shipped system six days before deadline … the model is haiku"), S1-045 (sonnet
  measurements must be recalibrated), S6-160 (schema-constrained decoding is "a
  different generation regime"), S6-027/S6-140 (byte-parity composer), S9b-W011
  (p=0.0000595 ran on the Messages-API path, not the Bedrock proxy)
- counter-evidence: The two live systems reached *opposite* model picks —
  apothecary/field-report recommended Nova primary (S2-064, S4-072, S9a-080), DDAY
  rejected Nova and kept haiku (S6-022, S9b-186) — the same measured-speed argument,
  different verdicts, because the binding constraint (mechanism continuity) differed.
  The parity guard's own enforcement was fragile: no PR in the repo had ever run CI
  (S8-055, S9a-090), and the byte-parity gate had a blind spot the human's fifth
  mutation hit (S9a-089/W007).
- gaps: The DDAY blind dialogue-quality comparison (S5-024) was "awaiting approval,"
  unrun; no mechanism result has yet been reproduced through the production proxy /
  schema-forced path — the whole re-baseline is owed (first Bedrock calls 08-04).
- oral-only: OH-3 §2 supplies the "human picks on quality×latency" frame; written
  atoms carry the theme.
- fit: #4 section

### T-18 — Real LLM failure modes are simulated under engine control; the model turned out honest
- thesis: The team declined to use genuine model malfunction as a game mechanic and
  engineered controllable substitutes — "hallucination" is engine-injected noise the
  model judges honestly; amount and kind are level-designable.
- lanes: 1
- origin: emergent
- seen-by: B1 — **[single-source]**
- support: S1-032 (darkest-context context gauge), S5-034, S9b-117 ("통제된 환각" via
  noise injection)
- counter-evidence (strong, direct): the field-report bench found the model *honest*
  — the demo's founding premise ("loose forms make the LLM omit failures") died at 0%
  omission across 16/18 conditions; 36 rescue probes failed to induce concealment
  (S2-059, S2-060, S2-068). Deception had to be moved into the engine's information
  architecture and personality cards ("규칙으로 시키면 거부하고, 성격으로 주면 연기한다").
  One genuine emergent fabrication (tool hallucination) was found and promoted to an
  axis (S2-065), partially rescuing the theme.
- gaps: Whether engine-driven "hallucination" reads to a player as the model failing
  (the intended fiction) vs. a scripted event is unmeasured.
- oral-only: none.
- fit: #4 section

### T-19 — The AI's self-explanation is theater; the engine owns objective truth (the two-record design)
- thesis: Measurement refuted the founding "attribution = fairness" belief — agents
  cite sentences opposite to their own behavior (귀속 역전) — so `because`
  self-attribution was demoted to presentation, the objective log is engine-assembled
  from event logs, and the *gap* between objective log and subjective report becomes
  the game's information, comedy, and temperament fingerprint.
- lanes: 1
- origin: emergent
- seen-by: B1 — **[single-source]**
- support: S1-013, S1-041, S1-042 (two-layer reports; the gap is the product), S2-018
  ("because는 장식"), S3-057 (fingerprint leaks 10/10 by design), S6-056, S7-002,
  S7-003 (facts vs report_body split with different trust rules), S6-122
- counter-evidence: The "gap is content" harvest sits next to a hard line where the
  same leakage is *fatal* — fabricated facts in the objective log (S3-058, one call
  inventing "배경음 분석 결과 조용한 환경 확인됨"), the inner_note leak breaching the
  fact channel (S9b-024). The identical property (prose bleeding across layers) is a
  feature on the subjective axis and a membrane breach on the objective axis (S3-057
  says exactly this). E-LEV: the exculpation fact is known and cited but spoken 0/30
  (S3-032) — the model *withholds*, complicating "distortion is reliably harvestable."
- gaps: Whether players read the gap as comedy+information (the design bet) is unmeasured.
- oral-only: none.
- fit: #4 section · #2 video beat

### T-20 — The runtime is a thin, stateless, secret-free proxy chosen by rejecting the fashionable agent stack
- thesis: The in-game LLM tier is a stateless Pages→API Gateway→Lambda→Bedrock
  Converse proxy with deterministic fallback and no runtime authentication — chosen by
  explicitly rejecting agents/RAG/memory/streaming/always-on servers/browser-to-
  Bedrock, each because it "exposed credentials, weakened the structured game
  boundary, or added cost without serving the tested interaction."
- lanes: 1
- origin: emergent
- seen-by: B1 — **[single-source]**
- support: S5-021 (the rejected-alternatives list is the story), S5-022 (`x-llm-fallback`
  header; provider failure never blocks), S6-023 (runtime authenticates to nothing),
  S6-042 (no runtime image generation), S6-128/S6-109 (retries/fallback by timeout
  arithmetic), S5-W013/S6-099 (DDAY proxy is a copy-not-edit of the apothecary Lambda)
- counter-evidence: The guardrails are honestly incomplete — the endpoint is public
  and unauthenticated ("origin checking is CORS, not security," S6-024), the
  concurrency kill switch ships unset (S4-074), no absolute monthly cost ceiling
  (S5-025). The inherited apothecary numbers (7s budget) were wrong for DDAY (see T-13).
- gaps: A full stateful agent runtime was rejected on paper (S5-021) but never trialed
  against DDAY's actual interaction.
- oral-only: none.
- fit: #4 section

### T-21 — Every runtime tunable and prompt is data; deterministic code — never an LLM — compiles and stamps it
- thesis: Balance-as-data extends to the AI layer — stances, deltas, symptom
  sentences, temperament, report-guidance and prompt slots all live in `data/`; the
  draft→datapack compiler is a zero-LLM deterministic script (a silent paraphrase
  would break vocabulary-aligned keys invisibly); balance numbers are stamped by the
  proxy, never model-chosen.
- lanes: 1 (with 4)
- origin: emergent
- seen-by: B1, B4 — **⇈ convergence (2 lanes)**
- support: S4-066 (numbers stamped from data, never model-chosen), S6-007,
  S6-086/I12 (numbers never enter prompts), S6-131 (keys are condition classes, not
  blessed sentence ids), S6-132 ("no LLM touches this stage"), S7-001/S7-008/S7-017,
  S6-113, S8-048 (compile is 결정론 코드; compile-scenario LLM skill considered and
  rejected), S9b-166/S9b-W009 (deterministic compiler diffed against a hand-compiled
  pack, 10 residual diffs all punctuation), S1-050 (Doodle Life's QuestContract:
  "열린 콘텐츠, 닫힌 프로토콜")
- counter-evidence: The data boundary leaked in practice — run-outcome thresholds
  lived hardcoded in `src/`, hand-copied into seven test files, so a one-token drift
  flipped a whole run clear→defeat while 1264 tests stayed green (S9b-015); a
  numeric-separator hole (`8_000`) let a tunable launder past the no-inline gate
  (S9b-014). And the team did *not* universally refuse AI in the pipeline — it KEPT
  the LLM judge (S2-039) and used a blind-reader AI to validate clue legibility
  (S1-053). "Code certifies, never AI" is a choice made only where paraphrase is
  fatal.
- gaps: Report-guidance values are v0 guesses to be tuned after gameplay measurement
  (S7-001) — the tuning pass has not happened.
- oral-only: none.
- fit: #4 section

---

# C. Lane 2 — AI-building-the-game

> **Snapshot caveat (applies to every lane-2 theme):** the two largest integration
> PRs (#110, #116) and 117 commits postdate the corpus snapshot. Themes resting on
> final-panel/integration evidence — T-22, T-23, T-28, T-32, T-35 especially —
> could be strengthened or overturned by the missing PRs. Flagged per-theme.

### T-22 — Trust inversion: a self-reported GREEN is a claim to be falsified; a fix exists only when the remote SHA proves it
- thesis: The pipeline's fixed opening move is that the reviewer re-runs the author's
  claimed gates from a clean checkout before judging, and resolves a thread only on
  re-executed evidence at the pushed head. Agent self-reports are adversarial input.
  (Operational, build-lane face of the T-04 distrust-spine.)
- lanes: 2
- origin: emergent
- seen-by: B2 (operational) + T-04 cross-corroboration — **⇈**
- support: S9a-008 (trust inversion as the fixed opening move), S9a-009 (first catch:
  e2e "2/2 pass" only held because a build ran first), S9a-032 (self-report
  inaccuracies itemized), S9a-039 (verification-of-absence), S9b-009/S9b-027 (reviewer
  mutation-tests the *fix*: throw inside the shipped root → 66 tests redden), S6-185,
  S6-187 ("my own tree, my own mutants, not your report")
- counter-evidence: The inversion decays where review volume drops — S9a-092/W009/W010
  (later e-unit PRs merged with zero review rounds; gate counts are the PR body's own
  self-report, accepted), S6-188 (six substantive Lead reviews exist only on disk),
  S9a-018 (a stale test count explicitly classed "코드 결함 아님, 참고만").
- gaps: Whether trust inversion held on #110/#116 as executed — those PRs are at the
  snapshot edge (S9b atoms show it did, S9b-026/027, but the note flags them unmined).
- oral-only: none.
- fit: #4 section · #3

### T-23 — "테스트 GREEN ≠ 화면 OK": mutation testing and rendered pixels are the real gate
- thesis: Green test suites were repeatedly shown to guard spelling, not behavior, so
  the panel adopted mutation testing (mutate the impl, watch the suite stay green) and
  rendered-artifact inspection (build the bundle, measure the pixels) as the decisive
  instruments.
- lanes: 2
- origin: seed-confirmed:3 (the operational face of "AI can't judge whether it worked")
- seen-by: B2 — **[single-source]**
- support: S9a-031 (Lead mutates the impl; 92/92 green → "테스트가 지키는 건 행동이
  아니라 철자다"), S9a-059 (all suites green, 6/8 jars cut across cell boundaries —
  caught by alpha profiles in a browser), S9a-026 (a default JSON import ships the
  answer key; caught by *executing* the Vite build), S9b-015 (one-char constant flips
  clear→defeat, 1264 tests green), S9b-017 (shipped page froze on turn 1, gates green),
  S9b-020 (dist-secret gate "failed open"), S9b-026 (876-green suite never ran the
  shipped composition root), S8-028 (a conflict marker silently disabled 99 tests),
  S8-059
- counter-evidence: Mutation testing also *confirmed* fixes and honest reports —
  S9a-W002 (self-reported 57/57·323/323 re-ran true from clean), S9a-W006, S8-W002/W006
  (green gates "genuinely earned"). Green is not always a lie; it just carries no
  information until mutation/render proves it has teeth.
- gaps: The engine build's headline green-suite claims (S9b-W001, 876/876) rest on
  #116 (post-snapshot per the note).
- oral-only: none.
- fit: #4 section · #3

### T-24 — The live/vendor path is the one thing agents can never verify, so it is fenced out of the loop and handed to a human
- thesis: Because pipeline agents hold no API keys and vendor output is
  non-deterministic, anything touching the LLM/vendor call is declared
  unverifiable-by-agent: provided pre-built and frozen, gated only for structure, its
  real correctness a human live-smoke step. "The biggest risk we removed was a unit
  whose author could never execute its own code."
- lanes: 2
- origin: emergent
- seen-by: B2 — **[single-source]** (relates cross to T-05/T-32 human-kept boundary)
- support: S4-060, S4-067, S5-006 (frozen-inputs guard protects "the one thing agents
  can't test"), S5-009 (any `@live` spec forbidden from gating), S8-020 (unit narrowed
  to the stub adapter, "the only part agents can verify themselves"), S9b-007, S6-191
- counter-evidence: The fence is not absolute — S9b-012 (when the "provided" vendor
  path didn't exist on the branch, the human ratified an in-run scope expansion),
  S9b-113/S5-028 (the agent-arena backend *was* live-verified across both providers
  and MCP/Skills — with keys, run by/for a human). So the boundary is "agents can't
  self-verify live," not "agents never touch live."
- gaps: How the fence behaved once the proxy was actually deployed (#138/#139,
  snapshot edge); S9b-191 leaves the IAM→Bedrock path "still unproven."
- oral-only: none.
- fit: #4 section

### T-25 — Autonomous runs lose work through orchestration mechanics, not the model losing the plot
- thesis: The recurring failure mode of multi-hour parallel runs was never bad model
  reasoning; it was harness plumbing — resume cache-misses re-manufacturing merged
  units, slash-vs-dash branch-name forks force-pushing over reviewed lineage,
  duplicate PRs that (under squash-merge) delete sibling files, runs posting to a PR
  closed out from under them.
- lanes: 2
- origin: emergent
- seen-by: B2 — **[single-source]**
- support: S9a-022 (resume re-ran merged units, opened duplicate PRs), S9a-038 (branch
  fork force-pushed over three verified fixes; reflog forensics), S9a-070, S8-015
  (u3/u2 shipped twice), S8-024, S9b-004 (usage limit mid-run; human finished u8/u9 by
  hand), S9b-005 (run posted to a CLOSED PR; needed `gh pr reopen`), S6-186 (the
  resume bug fixed in-harness, 0 duplicates on restart)
- counter-evidence: Some lost/killed work was clean design churn, not a bug (S9a-023,
  S9a-006/078). The model side *also* produced real defects (S9a-031 vacuous tests,
  S8-039 fixture-echoing labels), so "not the model" is a claim about *work-loss*, not
  correctness generally. S6-186 is the harness's own self-serving framing.
- gaps: Whether the Reconcile-step fix held across the larger engine-build run (#116)
  is uncaptured.
- oral-only: OH-3 §3 (operator's positive framing of the same autonomy) — oral.
- fit: #4 section

### T-26 — Multi-agent review ran on one GitHub account, so the whole protocol is a hand-built convention over a platform that refuses it
- thesis: Lead and every reviewer persona shared one login, so GitHub refused formal
  approve/request-changes on own PRs. The pipeline invented a comment-based verdict
  convention, Lead-only thread resolution, and "closed ≠ resolved" hygiene to make an
  independent-panel fiction survive on a single human account.
- lanes: 2
- origin: emergent
- seen-by: B2 — **[single-source]**
- support: S9a-007 (single account → every verdict a comment), S9a-010 (resolve
  authority Lead-only), S9a-054 ("이 스레드가 닫힌 것은 이슈가 해결됐다는 뜻이 아니다"),
  S9b-028 (`gh` refuses `--request-changes` on same-account PR), S6-187
- counter-evidence: The single-account seam did not collapse the panel — S9b-038 (on
  one commit R1/R2/R3 reached three genuinely different dispositions: approve /
  request-changes / recorded-residual, "the disagreement is the mechanism working").
- gaps: none material.
- oral-only: none.
- fit: #4 section

### T-27 — The rebuttal channel is trust-inversion aimed back at the reviewer — it catches reviewer (and human) error
- thesis: The protocol builds in that the reviewer is also a fallible agent: authors
  may rebut, and a rebuttal is accepted only after independent re-check — but the
  channel repeatedly caught the *reviewer* being wrong (comments on the wrong unit,
  over-stated severity, mis-cited error codes), and once ran agent→human.
- lanes: 2
- origin: emergent
- seen-by: B2 — **[single-source]**
- support: S9a-040 (rebuttal won: Lead's comments belonged to another unit; grep 0
  matches → "리뷰어 착오"), S9a-060 (rebuttal mostly won on pre-registered evidence;
  Lead corrected the rebuttal's own overreach), S9a-019, S9a-050 (Lead disproves a
  comment by compiler, corrects its *own* cited TS error numbers), S9b-035 (R2 corrects
  its own round-1 severity: "I tested it instead of asserting it"), S9a-091 (agent
  corrects the human reviewer's repro and promotes it to policy)
- counter-evidence: The channel also produced pure concession (S9b-W014, 13 threads
  resolved by agreement, no rebuttals) and can be abused (S9a-044, an author tried to
  use a test to *pin* a bug as expected; the Lead ruled it not an answer).
- gaps: none material.
- oral-only: none.
- fit: #4 section

### T-28 — The integration/final pass exists because green unit gates can each be locally correct and jointly wrong
- thesis: Per-unit gates each pass while cross-unit seams break — duplicated
  validators, substring-counting NFR checks, tier-data gaps rendering two states
  identical, an inline constant that flips a whole run — so a dedicated
  integration/final-panel pass over the assembled build is where the real defects
  surface.
- lanes: 2
- origin: emergent
- seen-by: B2 — **[single-source]**
- support: S9b-006 (three post-merge fixes for seams no unit owned), S9b-015, S9b-016
  (an unreachable card = dead content the PRD claimed reachable), S9b-017/018, S6-189
  (integrator finds the answer-key-in-bundle leak invisible to every per-unit gate),
  S9b-W008
- counter-evidence: The final panel sometimes found nothing blocking and simply agreed
  (S9b-W014; S9b-038 R3 "no blocking findings remain"), and some e-units merged with
  zero review and shipped green (S9a-W009/W010) — integration is where the *cross-unit*
  class breaks, not uniformly where things break.
- gaps: Rests heavily on #33/#68 (in-slice) and #116 (post-snapshot per the note); the
  largest catches (S9b-024..037) could shift with the missing PRs.
- oral-only: none.
- fit: #4 section

### T-29 — The PR body became a confession ledger, and reviewability itself was engineered as a deliverable
- thesis: Agent PR bodies routinely disclose their own irregularities (scope overflow,
  invented conventions, absent specs, stale counts), and this confession liturgy
  outlived the review that created it; separately, "readable diff = competition
  deliverable" reached down to byte-level choices (NUL delimiters made files
  unreviewable) and to a 16k-line diff shipping its own reading map.
- lanes: 2
- origin: emergent
- seen-by: B2 — **[single-source]**
- support: S9a-092 (zero-activity PRs keep the confession body after review volume
  drops to zero), S9a-093 (units file their own violations), S9a-013/S8-017 (raw NUL
  bytes → git-binary → unreviewable, blocked under "history is a deliverable"), S8-045
  (same NUL defect recurred in the probe harness), S9a-084 ("read 300 lines, don't
  read the raw")
- counter-evidence: The confession convention partly failed to leave its audit trail —
  S6-188 (six reviews existed only on disk while the PRs carried zero threads).
- gaps: none material.
- oral-only: none.
- fit: #4 section · #5

### T-30 — You write documents FOR the harness: ambiguity is a defect class, and the build DAG is decoupled so fan-out engages
- thesis: Because agents can't ask questions mid-run and reviewers enforce only what's
  written, PRDs are authored against the decomposer's failure modes ("an executable
  PRD ships no open ❔"; "an invariant not written down does not exist"), and the build
  DAG is deliberately decoupled from the module DAG so parallelism engages instead of
  serializing. (Build-lane specialization of T-09.)
- lanes: 2
- origin: emergent
- seen-by: B2 (+ T-09 cross-corroboration) — **⇈**
- support: S4-054, S4-046/S4-055, S4-057 (four loop-until-green pitfalls +
  countermeasures), S6-029 ("any interface two work units cross must be specified
  before fan-out"), S6-147/S9b-181 (Rev-2 lands the full public surface as a throwing
  skeleton so six units build concurrently — ~24h → ~12–16h), S9b-182 (13 decisions
  "tabled closed so parallel agents stop inventing signatures"), S9b-179
- counter-evidence: Written-everything-up-front was not sufficient on its own —
  S9b-W001/S6-186 (even a well-specified run hit resume/orchestration failures),
  S5-020 (a run against a draft spec expects "spec friction as the run's real second
  deliverable"). The doctrine is aspirational, not a guarantee.
- gaps: The Rev-2 ~12–16h parallelism claim rests on the engine build (#116-era,
  post-snapshot) — realized wall-clock uncaptured.
- oral-only: OH-3 §3 ("PRD → 10~20 sub-tasks → parallel harness") corroborates the
  shape but is oral.
- fit: #4 section

### T-31 — The harness was modified because its correctness gates cannot measure fun and feel — so a game-feel lens and in-loop *seeing* were bolted on
- thesis: The team wrote a mod spec for its own harness before using it, opening with
  the diagnosis that loop-until-green optimizes correctness while games need qualities
  its gates can't measure; the answers were a game-feel review lens that must win its
  seat, gameplay capture routed to a human, and (after a full v1 reversal) an in-loop
  visual self-check giving the agent its own eyes. (Build-lane face of seed 3 / T-05.)
- lanes: 2
- origin: seed-confirmed:3
- seen-by: B2 (+ T-05 cross-corroboration) — **⇈**
- support: S5-001 ("super-pipeline optimizes for correctness … games additionally need
  fun and feel, which automated gates cannot measure"), S5-003 (gameplay capture to
  the human director), S5-005 (a `feel` lens seated through score-driven selection,
  bounded by an evidence bar), S5-012/S5-013 (frontend-mod v1 killed — "governance with
  no rendered pixel"; v2 guards by *seeing*), S5-017 (visual self-check bounded: taste
  can never fail a unit), S6-190 (the lens produced three real judge-visible defects "a
  correctness-only panel would have passed"), S9b-018/019
- counter-evidence: The feel machinery was deliberately kept subordinate — S5-017/018
  quarantine subjective image judgment from the escalation ladder ("taste stays out of
  the gate"), S5-019 admits the fidelity lens lands in `dropped[]` without a human pin.
  The harness does *not* claim to automate fun-judgment; it routes feel to a human —
  which *supports* seed 3.
- gaps: Frontend-mod v2/v2.1 and the lens as *executed* on the client build
  (#110/#114-era) postdate the snapshot; S5 is the design record, not run evidence.
- oral-only: none.
- fit: #3 · #4 section

### T-32 — Humans keep the wheel: they override the loop, steer it mid-run, and own the one act the harness is forbidden to do (merge to main)
- thesis: Across every run a human takes concrete control — stopping the harness from
  re-churning settled work and finishing units by hand, injecting dated/signed
  constraints and stop-lines into the live dashboard, and performing the final merge,
  which the harness is structurally forbidden to do.
- lanes: 2
- origin: emergent
- seen-by: B2 (+ T-05/T-04 cross) — **⇈**
- support: S9b-004 (operator stops re-running merged units; finishes u8/u9), S9b-011
  (the sole `[STEER]`: process output English / in-game Korean), S9b-040/041/044
  (later-run steering baked into the dashboard as dated signed constraints, one
  overriding a stale PRD line; a mid-run stop-line), S6-195 (humans own PRD/frozen
  inputs, scope arbitration, interruption, "the final merge to main, which the harness
  is forbidden to do"), S6-149, S9a-089 (human mutation-tests an agent-authored gate)
- counter-evidence: Human authority also *deferred* to agents — S9b-022 (Lead conceded
  a three-round exchange, "you were right"), and whole e-units merged with no human
  review (S9a-W009/W010). The wheel is human-held at the boundaries, not continuously.
- gaps: The mid-run steering atoms (S9b-040..046) live on #110/#116 (post-snapshot).
- oral-only: OH-3 §3 operator view — oral.
- fit: #4 section · #3

### T-33 — State lives on disk and GitHub, never in a context window — anti-context-rot is what lets multi-hour autonomy exist
- thesis: Every agent spawns fresh, reads its slice, writes back, and dies, so
  multi-hour runs survive without context decay and the PR/commit trail exists as a
  byproduct; the same principle governs the overnight probe runner, whose named scarce
  resource is its own context window, not the call budget.
- lanes: 2
- origin: emergent
- seen-by: B2 — **[single-source]**
- support: S6-185 ("state lives on disk and on GitHub, never in a context window …
  which is why multi-hour runs survive without context rot"), S3-019 ("your real
  constraint is context, not calls"), S3-018 ("a half-program with honest records beats
  a full one with confabulated ones"), S8-016 (a resumed unit produced no code because
  on-disk state showed the work done)
- counter-evidence: Persisted state is exactly where the T-25 orchestration bugs lived
  — on-disk/branch state got forked and force-pushed (S9a-038), resume re-manufactured
  merged units (S9a-022/S6-186). "State on disk" trades context-rot for
  branch/cache-coherence failure modes.
- gaps: The invariant is asserted by the harness's own auto-draft (S6-185) and the
  probe runbook (S3); no independent measurement of rot-avoidance across a long run.
- oral-only: none.
- fit: #4 section

### T-34 — The harness was extended by pure OCP, never forked for one game, and every extension was pre-authorized to be cut
- thesis: Game-specific harness work landed as pure open-closed extensions inside the
  sibling repo (never touching the core), timeboxed with a pre-decided abandon path,
  and validated on a fixture before the production build depended on it.
- lanes: 2
- origin: emergent
- seen-by: B2 — **[single-source]**
- support: S5-002 ("every modification lands as a pure OCP extension — never touch
  `/pipeline`, `/goal`"), S5-010 (the apothecary v2 run used as the dry-run validating
  all five mods), S4-050 (harness tweak scoped ≤1h with "cut it entirely if no clean
  seam exists"), S4-051/052/W012 (`demo_publish` BUILT as a pure extension, honest
  degradation "rather than lying about smoke"), S9b-105
- counter-evidence: OCP was overturned once — S5-012 (frontend-mod v1 rejected and
  fully rewritten as v2/v2.1, a "full reversal"), and S4-047 (a P0 mod deferred rather
  than extended when it would "stack two unknowns").
- gaps: The harness core is deliberately out of the deliverable repo (S6-010), so the
  extension code is uncaptured; the extensions' real behaviour in client/engine runs
  postdates the snapshot.
- oral-only: none.
- fit: #4 section

### T-35 — Raw throughput as capability: the harness built, benchmarked, and shelved whole systems in a day
- thesis: Beneath the failure-framing is sheer autonomous throughput — parallel-agent
  runs merged green deployable shells from a one-page PRD, a full LLM backend was
  built-and-live-verified then superseded within a day, and a fourth AI concept was
  built as a text demo, benchmarked against Bedrock, and archived *in a single commit*.
- lanes: 2
- origin: emergent
- seen-by: B2 — **[single-source]** (a deliberately win-sweep-recovered theme)
- support: S4-W009/S8-W002 (first parallel run: 9 units → merged apothecary shell,
  closing e2e green, zero external requests), S8-W003 (second concept → shipped
  deployed playable demo), S8-032 (a fourth concept shipped a text demo + four measured
  play paths + a Bedrock benchmark, then "move POC to planning" in the same commit),
  S9a-W009/W010 (engine e-units merged one-pass: 878 / 166 driver tests green, no
  review round), S5-W005 (arena backend: 146 keyless tests + both providers
  live-verified for ≈$0.059)
- counter-evidence: Throughput repeatedly produced *discarded* output — S4-035/S8-022
  (a verified 146-test backend shelved undeployed a day later), S9a-006/S9a-078
  (working demos closed unmerged by a pivot). Speed, not durable output. The one-pass
  green e-units also cut against T-22 trust-inversion (merged with no reviewer re-run).
- gaps: The engine build's true throughput (#116, 11 units) is at the snapshot edge;
  "~12–16h" (S9b-181) is a plan, not measured.
- oral-only: OH-3 §3 ("유능한 개발팀을 고용한 것에 가까운 경험") — oral.
- fit: #4 section · #2 video beat

### T-36 — The autonomous overnight probe runner: an AI orchestration that runs a whole measurement program unattended and halts itself honestly — THIN for lane 2
- thesis: The mechanism-validation program was itself an AI-built-and-run orchestration
  — a runbook hands an agent the full multi-mechanism program to run overnight,
  authoring suites, self-limiting on a pre-registered hard-stop, routing every verdict
  to a human; it corrected its own runbook mid-run and self-registered a channel under
  a declared exception.
- lanes: 2 (with 1)
- origin: emergent
- seen-by: B2 — **[single-source] · THIN** (lane-2 support concentrated in one slice)
- support: S3-010 (unattended agent halted the whole program at Phase 0 after 30 of
  ~400 calls), S3-018/S3-019, S3-022 (discovered the API key doesn't inherit
  non-interactively, filed a runbook correction), S3-038 (registered a new channel
  under the stated exception, flagged for human ratification), S3-025 (refused to
  *enact* the rule that would credit its own result); thin lane-2 hooks in
  S8-036/S8-038
- counter-evidence: Predominantly lane-1 (measurement); its lane-2 character is real
  but secondary. The human-kept verdict boundary (S3-047, S3-055) means the AI did
  *not* own judgment — consistent with T-05.
- gaps: Whether the probe harness shares orchestration lineage with the game-build
  super-pipeline is not stated in-corpus.
- oral-only: none.
- fit: #4 section

### T-37 — The deploy/CI machinery was the unguarded organ: the gate that ran nowhere, and infra only real traffic could falsify
- thesis: The pipeline that guards correctness was itself long ungated — no PR in the
  repo had ever run CI, the proxy's parity gate ran "only when someone remembered," a
  dev middleware allowed arbitrary repo-file reads, and inherited latency/IAM
  assumptions broke only on the first real deploy. Deployability was proven day one but
  the guards around it were retrofitted mid-competition.
- lanes: 2
- origin: emergent
- seen-by: B2 (+ B5 taxonomy proposal to split this into lane 2b) — **⇈**
- support: S8-001/S8-W001 (deploy verified via a placeholder canvas before the engine
  existed), S8-055/S9a-090/S9a-W008 (deploy.yml is push-to-main → "no PR in this repo
  has ever run CI"; `ci.yml` added mid-competition), S8-054/S9b-180 (dev middleware
  path-traversal → `%2e%2e%2f…CLAUDE.md` returned CLAUDE.md; removed, not patched),
  S8-060/S9b-185 (inherited 7s budget falsified on first real Bedrock call), S8-061/
  S9b-184 (reused update-only IAM role broke the create path — "could not delete what
  it had not been allowed to create"), S9b-189/190 (deploy passed but failed its own
  post-deploy probe; a `set -e` idiom swallowed a 403)
- counter-evidence: Not everything infra-side was unguarded — S8-W008/S6-027 (parity
  gate mutation-tested, 8/9 renderer mutations red), S8-W012 (deploy role scoped with
  `iam:simulate-principal-policy` before first use), S9a-072 (agent refused to grant
  itself `iam:PutRolePolicy`). Strong local guards existed even while the *wiring* into
  CI was missing.
- gaps: First live proxy deploy and CI-over-OIDC (#138/#139) are at the snapshot edge;
  S9b-191 says the IAM→Bedrock path "is still unproven; this merge is what first
  exercises it."
- oral-only: none.
- fit: #4 section

---

# D. Lane 3 — AI-in-planning

### T-38 — Meeting records are themselves AI-in-planning artifacts — transcription → structured minutes, human-corrected, and sometimes absent
- thesis: The evidence base for several founding decisions is AI meeting-summarization
  output (a 91-minute recording rendered into TL;DR / decision-table / disagreements
  form), maintained as a living amended ledger — but the artifact is imperfect: speaker
  attribution needed a hand pass, and the single most pivotal discussion left no
  minutes at all.
- lanes: 3
- origin: emergent
- seen-by: B3 — **[single-source]**
- support: S4-008/S4-W001 (07-24 minutes = machine-processed artifact of a 91-minute
  recording), S4-032 (living amended ledger), S9b-107 (AI-drafted minutes mis-mapped
  speakers until a human corrected "git authorship 기준으로"); record-gap: S4-021 (the
  DDAY-birth discussion produced *no* meeting note)
- counter-evidence: The imperfection *is* the counter-evidence — S9b-107 (speaker
  mis-mapping), S4-021 (no note for the pivotal discussion). AI-produced minutes are
  real but not authoritative or complete.
- gaps: The source transcript is not in the repo (S4-008), so fidelity can't be
  audited; no atom names the tool/model that produced the minutes.
- oral-only: none.
- fit: #4 section

### T-39 — Documents get an explicit authority hierarchy; "normative lives in the artifact that can enforce itself"
- thesis: docs/ was reorganized onto spec/contract/plan tiers defined by authority (not
  topic), every contract must name where its enforceable law lives, and the canon of a
  data-contract was flipped from TS code to JSON Schema on the criterion that only the
  enforceable artifact is normative — then generalized to every later contract.
- lanes: 3
- origin: emergent
- seen-by: B3 — **[single-source]**
- support: S6-049, S6-050, S6-033, S6-032, S6-183, S8-049, S9b-161 (the same 08-01→08-02
  flip: TS-canon → Schema-canon, overturning the prior day's decision on
  enforceability grounds)
- counter-evidence: The cross-slice dated self-reversal (S6-032/S8-049/S9b-161) keeps
  this from being a static S6 doc-description.
- gaps: No atom measures whether the authority-tier scheme reduced actual
  authority-ambiguity incidents afterward.
- oral-only: none.
- fit: #4 section

### T-40 — Planning documents are audited like code: reachability, staleness, and "a decision procedure that never ran"
- thesis: Specs, PRDs, and decision records are reviewed with code-review rigor —
  content declared but unreachable in play, trackers gone silently stale, a benchmark
  protocol deleted while other docs cite it, two live SSOTs disagreeing with no merge
  conflict to flag them — with the finding often blocking merge until the *document* is
  fixed.
- lanes: 3
- origin: emergent
- seen-by: B3 — **[single-source]** (overlaps T-28's content-reachability catch)
- support: S8-026, S9a-066 (PRD reviewed as a reachability graph), S9a-074, S9a-075,
  S6-051, S4-027, S9b-145 (two SSOTs diverged silently on main — "the most dangerous
  kind"), S9a-087
- counter-evidence: The audit is not exhaustive — S6-013 (README self-contradiction
  unmanaged), S6-051 (a tracker "went stale undetected"), S9b-145. Reactive and
  incomplete.
- gaps: Cannot say how many stale/unreachable defects were *never* caught.
- oral-only: none.
- fit: #4 section

### T-41 — Measurement discipline is encoded into planning documents, schemas, and read-tooling — not left to willpower
- thesis: The epistemic rules (immutable raw records, pre-registration-as-the-suite-
  JSON, "unmeasurable ≠ zero" baked into the file format, a fixed read-order skill,
  competition-required raw call logging) are institutionalized in documents and tools
  so the machine, not the analyst, enforces integrity.
- lanes: 3 (several atoms multi-lane 1/3)
- origin: emergent
- seen-by: B3 (+ B2's T-36 probe-runner corroborates the runbook side) — **⇈**
- support: S3-002, S3-064, S3-065, S7-014 (metric schema bakes in falsification
  criteria; "측정 불가 ≠ 효과 없음"), S7-015, S6-088; reinforced by S9b-152
- counter-evidence: Encoded discipline was breached — S2-009 (a fabricated artifact
  that *faked its own audit trail*, a false `tool_uses: 0`), so "immutable raw records"
  is a policy defended against a demonstrated forgery, not an invariant the format
  guarantees. S3-023/S3-056 (blind coding traded away under deadline).
- gaps: The schemas encode falsification criteria (S7-014) but no atom shows them run
  against a real production dataset — `artifacts/` did not exist at snapshot.
- oral-only: OH-3 §2's half-day measurement claim touches this but isn't required here.
- fit: #4 section

### T-42 — Coordination replaces meetings with documents: agreement-by-document, interfaces frozen before fan-out, owners named so nothing binds implicitly
- thesis: A two-person team adopted an async-agent coordination protocol — each owner's
  spec *is* the communication, any interface two units cross must be specified before
  parallel fan-out, and a binding schedule assigns every open parameter an owner and a
  binding moment "so nobody binds it implicitly by touching it first."
- lanes: 3
- origin: emergent
- seen-by: B3 (+ T-09/T-30 cross) — **⇈**
- support: S6-143, S6-089, S6-029, S9b-159, S9b-158, S6-136
- counter-evidence: Document-not-discussion failed — S9b-145 (two SSOTs on main
  diverged with no merge conflict), S4-021 (the pivotal DDAY-selection discussion left
  no document). Characteristic failure: silent divergence + unrecorded verbal decisions.
- gaps: Two-slice support (S6, S9b), leans S6; an S4 meeting explicitly adopting
  "by document" would strengthen it (S4-028 is adjacent but tagged unclear-lane).
- oral-only: none.
- fit: #4 section

### T-43 — Handoff documents have a lifecycle — goal-prompt → status handoff → decision record — shedding content and naming carry-forward
- thesis: Handoffs are staged artifacts with a lifetime, not authority: a goal-prompt
  handoff (whose body *is* a prompt), then a status handoff that curates the
  carry-forward list at a reversal, then a decision record keeping only "the decisions
  that survived implementation." The datapack handoff "closes when pipeline stage 5
  closes, and then becomes a record."
- lanes: 3
- origin: emergent
- seen-by: B3 — **[single-source]**
- support: S4-070, S4-036, S4-039, S6-178, S5-039
- counter-evidence: Handoffs carry loose ends honestly — S4-053 (flags its own
  uncommitted diff, predicts the next session's fallback), S6-178 (records its own
  staleness incident). The lifecycle is real but the docs admit unfinished state.
- gaps: none material.
- oral-only: none.
- fit: #4 section

### T-44 — Project state is split by mutation-rate: a permanent charter (CLAUDE.md) and a freely-updated decision journal (status.md)
- thesis: The team separated its living docs by how fast they change — CLAUDE.md holds
  only permanent rules and mutates only at phase transitions; status.md is the SSOT for
  phase/tracks/next-steps and is updated freely — explicitly so a fresh-context agent
  reads one stable rule file and one volatile state file, never a pile of partially-
  stale documents.
- lanes: 3
- origin: emergent
- seen-by: B3 — **[single-source]**
- support: S6-011, S9b-102, S8-010, S8-004
- counter-evidence: The one prose file outside the split disproves totality — S6-013
  (README went stale and self-contradictory). S4-032 shows a *third* mutable-doc
  pattern (live amended minutes), so "two documents by mutation-rate" is an idealization
  the real corpus exceeds.
- gaps: No atom measures agent-error attributable to stale docs before/after the split.
- oral-only: none.
- fit: #4 section

### T-45 — Agents draft design docs/specs to researched industry conventions; the human directs by requiring rebuttal
- thesis: New design docs and specs were AI-drafted against researched external
  conventions (a GDD structured to modern-GDD consensus with each principle citing a
  source; a concept template written as an agent-executable writing guide whose primary
  reader is the agent), with the human's direction taking the form of demanding the
  spec follow the finding.
- lanes: 3
- origin: emergent
- seen-by: B3, B4 (B4-01 template-as-AI-writing-harness) — **⇈ convergence (2 lanes)**
- support (written): S9b-133, S9b-109, S1-002 (template declares itself sufficient for
  "the agent (or person) reading it," agent first), S1-005 (tone rules police known LLM
  prose failure modes), S9a-087, S6-139, S8-007
- counter-evidence: Agents do NOT autonomously own spec content — S6-139 (temperament
  prose is "the one item a work unit must not resolve on its own," owner S+D), S9a-087
  (human blocked merge until the architecture spec matched the finding). The agent
  drafts; the human gates spec content.
- gaps: Cannot confirm the strongest oral claim — that these were docs "the human had
  never written before."
- oral-only: OH-3 §1 uniquely carries (a) "never written before" and (b) the
  adversarial style "내 의견에 반박을 요구하면서"; only the *technique* ("research the
  현업 통용 양식 first") is corroborated in writing (S9b-133). Do not launder.
- fit: #4 section

---

# E. Lane 4 — AI-as-creator

### T-46 — Concept selection built a document-comparison apparatus, then deliberately abandoned it for demo bake-offs — and the winner came from outside the funnel
- thesis: The concept phase was engineered as a structured comparison (identical-section
  templates "for apples-to-apples," mandatory verification-gap confessions,
  exactly-three-differentiators as a maturity test); the team then explicitly retired
  document-driven selection ("fun is judged by playable demos, not writable docs"); and
  the game that won was a post-demo *new* concept the funnel never contained.
- lanes: 4 (with 3)
- origin: emergent
- seen-by: B3, B4 — **⇈ convergence (2 lanes)**
- support: S1-001 (identical section numbers), S1-002/S1-005/S8-007 (template as an
  AI-writing harness, membrane baked in), S1-029/S6-047 ("no merged 기획서 — demos
  judge, not documents"), S6-048, S8-010, S9b-109, S1-025/S8-012 (concept absorbed with
  explicit evidence-based admission criteria), S1-028/S1-030, S4-021/S8-030 (DDAY
  confirmed from *outside* the 07-24 bake-off pair; the pivotal discussion left no
  minutes)
- counter-evidence: The abandonment is the built-in contradiction, confirmed
  cross-slice (S1-029/S6-047 retires the machinery S1-001/S8-007 built). The losing
  demos stayed *deployed* as selection evidence (S6-035). The curated funnel did *not*
  produce the final game — a failure-born new concept did (S4-021, S8-030).
- gaps: The corpus can't quantify how much the template-comparison influenced the final
  pick vs. the bake-off; the winner's selection reasoning is a documented record-gap
  (S4-021). **This is the S8 "Doodle Life cut pre-build" defect zone — use the corrected
  three-demos sequence.**
- oral-only: the "fun-discovery discussion" motivating the move to playable evidence
  left no written trace (OH-1 hook 6); OH-1's memory of the post-demo new-concept
  discussion is corroborated only by S8-030's dated commit.
- fit: #4 section

### T-47 — Parallel-LLM drafting + human selection, applied at three levels (theme, draft-line, and art)
- thesis: The lane-4 signature is a writing/style brief pasted into multiple model
  sessions to produce comparable candidate drafts in parallel arms, from which humans
  select — reused at a second level (rival drafts from one parent) and a third (3–5
  candidate art-style strings → human pick → frozen as data).
- lanes: 4
- origin: seed-confirmed:3 (the generation half of "AI generates candidate fun; a human
  judges")
- seen-by: B4 — **[single-source]**
- support: S1-038 (a brief to multiple model sessions → five drafts, human ranking then
  re-ranking as criteria shift), S2-043 (brief built to be pasted into multiple LLM
  sessions, one §6 theme each, "테마가 섞이는 것을 막기 위함"), S4-030 (scenario
  regeneration = parallel LLM drafting → human compare/select → gate test), S2-049 (v2
  bake-off: four rival drafts from one parent, 우는다리 carried forward), S4-063/S4-W005
  (style bible frozen by a human-in-the-loop bake-off), S4-062/S4-W006 (one call per
  subject, ever), S9a-068 (regeneration judgment recorded per asset), S9b-123
- counter-evidence: Selection criteria were unstable (S1-038 ranking redone as
  genre/runtime decisions changed the axes); the report actively *prevented* picking a
  draft because it "won" (S2-041). The human art-judge is fallible/cursory — S9a-W011
  (a pack approved with a bare "LGTM"), S9a-059 (green + human-approved yet six of eight
  jars cut across cells; only pixel measurement caught it).
- gaps: No artifact shows which models produced which draft or that arms ran
  concurrently rather than serially; all asset-gen evidence is from the *demos*, not
  DDAY (a text game shipping pre-generated NPC art, S6-042).
- oral-only: OH-2's "why games are fun" list is context, not evidence — do not launder.
- fit: #4 section · #5 (asset provenance)

### T-48 — The AI writer is made to grade itself, and uses it to confess non-compliance
- thesis: The brief forces each AI-written draft to end in a self-evaluation against
  every requirement, and the writers used it to declare their own failures (scale,
  over-scope, "숫자가 1.5개") rather than paper over them.
- lanes: 4
- origin: emergent
- seen-by: B4 (+ T-04 distrust-spine, T-29 confession-ledger cross) — **⇈**
- support: S2-044 (required output ends with 통과/미달 self-judgment; several drafts
  declared failures), S2-047, S2-048 (hospital draft bends a metric for tone and
  discloses it as reversible), S1-018 (autobattler doc flags its own core fun as the
  sole unverified concept)
- counter-evidence: Self-audit is model self-report, which the corpus repeatedly shows
  cannot certify itself — S2-062 (`refs` honest "merely because the prompt asks"),
  S3-005 (model fabricates block ids in its own traceability field), S2-009 (the forger
  reproduced the audit conventions + a false `tool_uses: 0`). The confessions are
  trusted only because a human re-reads.
- gaps: Whether self-declared "미달" verdicts actually changed selection, or were
  overridden by human taste, is not traceable per draft.
- oral-only: none.
- fit: #4 section

### T-49 — The AI writer's deviation from the brief, kept as a gift; humans adjudicate which violations are content
- thesis: The most valuable lane-4 events are where an AI writer contradicted the human
  brief, resolved the contradiction creatively, said so, and deferred acceptance to
  humans — who kept the deviation as the game's spine.
- lanes: 4
- origin: emergent
- seen-by: B4 — **[single-source]**
- support: S1-039 (winning draft conflicted with the brief's "재앙은 못 막는다"; the
  team accepted the draft's goal-flip as the spine), S2-045 (the terrorist-call draft
  named the §2-vs-§6 contradiction and wrote it as the reversal), S2-054 (writer argues
  to amend the hardening schema because the one-hand constraint is the gate's drama),
  S9b-157
- counter-evidence: Not every deviation is a gift — S8-035 (generated docs quietly
  drifted a frozen constraint, temperament-invisibility, into a player control; a human
  caught and reverted it, writing invariant I13), S2-053 (a 자기 검사 금지 목록 forbids
  the fiction from inventing membrane-breaking devices). The line between productive
  deviation and drift is drawn case-by-case by a human.
- gaps: No rule predicts which deviations are content vs. drift.
- oral-only: none.
- fit: #4 section · #2 video beat (the goal-flip twist)

### T-50 — write-scenario: AI-as-creator made a reproducible skill, with a self-correcting loop
- thesis: The creative lane was hardened into a repeatable orchestrator skill — write →
  compile → lint → paper-check → scoped fix, looped ≤3× — that splits generative steps
  (subagents) from deterministic steps (scripts), and the loop caught an error it had
  itself introduced.
- lanes: 4
- origin: emergent
- seen-by: B4 — **[single-source]** (a headline win-sweep-recovered theme)
- support: S8-043/S8-W010 (write-scenario skill + generation guide + gate-hardening
  manual), S8-W015/S9b-167 (reworked into a factory orchestrator: 집필·검사·수정 =
  subagents, compile·lint = deterministic scripts, max 3 loops), S9b-W013 (the loop
  "caught an error introduced by the loop's own earlier fix"), S2-057 (paper check run
  twice — inspector found 18 issues, orchestrator adjudicated 7 fixed / 6 rejected / 3
  deferred), S2-058 (two findings promoted into machine lint W3/W4)
- counter-evidence: Reproducibility has human-kept and machine-fragile edges — S2-057
  ("프로브 전 사람 1회 독해 … 어느 회차도 그것을 대체하지 않는다"), S9b-168 (the skill's
  own zero-dep validator silently skipped `anyOf`, so the newest fields went
  unchecked), S8-048 (an LLM-based compile-scenario skill designed then discarded).
- gaps: The loop ran on 우는다리 only; transfer to a genuinely new scenario is untested
  (S4-031 plans the check, no result in-corpus).
- oral-only: none.
- fit: #4 section (headline reproducible-authoring narrative)

### T-51 — Solvability and quality made schema/lint obligations: open content, closed protocol
- thesis: Properties normally discovered by playtest — is the puzzle solvable, is the
  lock sharp, does every failure pay out — were encoded as machine-checked datapack
  schema/lint rules, so AI-authored content is admitted only if it satisfies the
  protocol.
- lanes: 4 (with 1)
- origin: seed-confirmed:1 ("열린 콘텐츠, 닫힌 프로토콜")
- seen-by: B4 (+ B1's T-21 data-boundary cross) — **⇈**
- support: S7-009 (every key mineable before its gate — solvability is a lint rule),
  S7-011 (decoys "옳은 정서, 틀린 사람" a required field), S7-012 (truth is a supply
  chain — ≥3 carriers or schema-invalid), S7-008/S6-131 (key = condition class, "a
  blessed string turns deduction into a lottery"), S6-134/S6-135, S1-053 (Placement's
  two-stage validator: CSP solvability proof + blind-reader AI)
- counter-evidence: The machine cannot fully certify — S7-013/S6-134 (hardening
  compiles empty; WARN never blocks because "only the author knows whether a collision
  is load-bearing"), S2-057/S6-177 (a human paper read stays mandatory), S9b-168 (the
  lint silently missed the very fields it was meant to guard).
- gaps: Whether machine-passing packs are actually *fun* is out of the schema's reach
  (S7-014 names how the game could be proven boring, but no run existed at snapshot).
- oral-only: none.
- fit: #4 section · #3

### T-52 — The one hand-authored file is the one armored against typos (the pipeline's paranoia is aimed at the human)
- thesis: In a pack otherwise compiler-generated and therefore deterministic, the single
  hand-written overlay is given the strictest walls — because everything machine-made
  can't carry a typo, and only the human contributor can.
- lanes: 4
- origin: emergent
- seen-by: B4 — **[single-source]**
- support: S7-005 (hardening overlay gets `additionalProperties:false` at every level so
  "vairable" explodes instead of degrading to null), S9b-169 (review found the one
  hand-authored file was the one file nothing validated; a `variable`→`vairable` typo
  produced byte-identical output), S7-006/S9b-170 (positional ids double-guarded by time
  AND `text_head`), S6-133
- counter-evidence: The armor is a fix born of a caught failure, not a standing virtue —
  S9b-169 discovered the gap after the fact; and human-authored AI-lane artifacts do
  leak uncaught (S5-011, tool-call XML surviving ~10 days).
- gaps: Only one hand-authored file class exists so far; whether the principle
  generalizes is untested.
- oral-only: none.
- fit: #4 section

### T-53 — Authoring for the machine, not the reader: fiction typed as mineable ore, including deliberate poison
- thesis: In the creator lane the game's prose is written as a resource for the game
  loop — narrative typed as a "mining vein," the report prompt engineered to grow next
  run's ammunition, and writers asked to author productive falsehood (plausible wrong
  guesses that ruin the next run).
- lanes: 4 (with 1)
- origin: emergent
- seen-by: B4 (+ B1's T-19 two-record cross) — **⇈**
- support: S2-046 (v1 drafts annotate 추측 samples as "의도적으로 오염된 재료" — wrong
  guesses whose equipping ruins a run is "이 게임의 핵심 학습"), S7-002 (the Reporter
  prompt engineered so its sentences are "다음 런의 채굴 광맥"), S7-019 (timeline text
  "채굴 광맥이 되는 문장"; reports tagged mining surfaces W2/W3), S1-035/S5-035
- counter-evidence: Optimizing prose for machine-harvestability shaves quality — S2-035/
  S6-060 (the sentence-count retry rule discarded the drafts carrying the strongest
  temperament expression; "최고의 문장들이 폐기본에 있었다"). Machine-first authoring
  collides with the human-judged fun goal.
- gaps: Whether players actually read report prose as ore (vs. skimming) is untested.
- oral-only: none.
- fit: #4 section

### T-54 — AI-authored content is reviewed as a reachability graph and for felt fun; dead content and cold moments are caught late
- thesis: Generated game content was audited like code — for reachability, dead paths,
  and the taste left in a judge's first 60 seconds — surfacing cards that can never be
  met, customers no invariant sees, and endings that "stop, don't end."
- lanes: 4 (with 2)
- origin: emergent
- seen-by: B4 (+ T-28 integration-pass, T-40 doc-audit cross) — **⇈**
- support: S9a-066 (PRD reviewed as a reachability graph), S9b-016 (`mirror_shield`
  unreachable — the puzzle was always answered wrong), S9b-048 (a new customer invisible
  to every content invariant), S9b-053 (three flat "no effect" failures and a dead-stop
  ending), S9b-055/058 (identical faces / identical fork-card copy at the one
  interactive moment), S8-026
- counter-evidence: These catches are on demos that were *cut*, not the shipped game
  (S9a-006; DDAY has no demo, S8-031), so it is unproven the same rigor reaches DDAY
  content; and the reviewers are themselves AI personas — largely AI-judging-AI-content,
  complicating the "human judges" reading of T-05.
- gaps: No corpus evidence that DDAY's 우는다리 content got an equivalent felt-fun /
  reachability play-review — it was validated by lint + paper check + one probe (S4-031),
  not a played demo.
- oral-only: none.
- fit: #4 section · #2 video beat (first-60-seconds content)

---

# F. Seeds — verdicts

| Seed | Verdict | Where it lives | Notes |
|---|---|---|---|
| **1 — 닫힌 환경에서의 최대의 자유도** | **seed-confirmed** (survives) | T-01, T-03, T-06, T-51 | Strong, multi-lane. Confirmed both in-game *and* as a build method (T-03/T-06). Seed-unevidenced *within lane 3* (B3). The maximal-freedom pole failed when tried at both altitudes (Doodle Life; frontend-mod v1) — preserved. |
| **2 — '게임'으로 느껴지기 위한 속도감** | **seed-confirmed but heavily qualified** (survives) | T-13 | Lives in lane 1 (+ a lane-2 build bridge, a cost cross-tie). **Seed-unevidenced within lanes 3 and 4.** The finding: achieved speed mostly did *not* materialize — it was sidestepped via diegetic waiting + fallback, and the latency numbers were repeatedly withdrawn or blown. The pacing→felt-freedom causal claim is under-evidenced. |
| **3 — 끝까지 AI가 하지 못하는 것: 재미있나를 판단하는 것** | **seed-confirmed** (survives; the map's most broadly corroborated theme) | T-05 (all 5 agents), T-23, T-31, T-51, T-54 | Confirmed as a *rule* across every lane. Preserved complication: the boundary is porous (policy-gap instruments "fun-shape"; game-feel is a scored lens; the LLM-judge *was* kept, S2-039) and it *migrated* under deadline (blind coding dropped; V3/E5′ verdict skipped). Held more cleanly as rule than as practice. |

**All three seeds survive.** None is `seed-unevidenced` at the corpus level; seed 2 is
`seed-unevidenced` within lanes 3–4 specifically, and seed 1 within lane 3.

---

# G. Taxonomy proposals (from B5 — the lane structure is explicitly open-ended)

These are candidate structural changes for Phase 3 to weigh, each with atom backing and
its counter-case. **Not** applied here.

1. **NEW LANE — "AI-orchestrating-AI / method-as-subject"** (see T-10). Backing:
   S5-007, S6-184, S2-012, S3-021/S6-159, S9a-008/S9b-009, S3-064 (5 slices). The
   reflexive layer — agents reviewing/measuring/documenting agents; the deliverable
   drafted by the harness from its own exhaust — is qualitatively distinct from
   "building the game" and is arguably the *center* of deliverable #4. **Counter-case:**
   the harness tool is deliberately kept out-of-repo (S6-010), so one could argue the
   method isn't a repo lane; but its design-record, telemetry-deliverable, review panel,
   and mechanism harness all act in-repo.

2. **NEW LANE (or widened lane 3) — "documents-as-machine-interface / AI-session
   engineering"** (see T-09). Backing: S4-054/055, S8-050/S6-034, S8-027, S4-049/039,
   S9b-001, S6-143 (4 slices). Writing whose *reader is a machine* and whose *purpose is
   control* is neither planning nor building. **Counter-case:** currently tagged lane
   3/2 and much of it is planning content; may be better modeled as an *axis property*
   than a lane.

3. **SPLIT lane 2 → (2a) harness-implementation and (2b) live-ops / deploy / infra**
   (see T-37). Backing: S6-018/021, S8-060/061, S9b-183/189/190, S8-055/S9a-090 (4
   slices). The labor split inverts (humans hand-run the risky infra) and the failure
   genre is distinct (inherited-numbers, IAM-lifecycle, CI-never-ran). **Counter-case:**
   CLAUDE.md's four-roots already isolates `proxy/` (S6-009), and it is literally the
   game's runtime, so a reviewer may keep it whole in lane 2.

4. **ADD an orthogonal axis — "human-kept ↔ AI-delegated," per decision-class**
   (see T-05, T-32). Backing: S6-195, S3-055/018, S2-022/S9b-141, S5-008/019, S6-139 (5
   slices). The lanes answer *what AI is used for* but miss *who keeps the verdict* —
   the corpus's actual organizing principle. **Counter-case / why an axis not a lane:**
   the boundary *migrated* during the project (blind coding dropped, S3-023;
   temperament-selection drifted into a player mechanic before a human pulled it back,
   S8-035; the LLM-judge kept, S2-039), so it must be timestamped, not frozen.

5. **NO merge of lanes 3/4, but the 3↔4 boundary needs a written rule.** The tagging is
   inconsistent (concept docs written by directed agents are lane 4 at S1-002 but are
   planning artifacts; the concept template is (4,3) at S8-007; scenario drafting is (4)
   but is a *process*). Planning-vs-creation is distinguishable, but the boundary should
   be written down rather than inferred per-atom.

**Note on `lanes: proposed:`** — no atom uses a literal `proposed:<name>` tag, but
≈15 S9a/S9b atoms carry *flag-level* proposals (`proposed:protocol`,
`proposed:harness-ops`, `proposed:agent-audience`) that are exactly the new-lane signals
feeding proposals 1–2 above.

---

# H. Single-source flags & THIN inventory (for reconciliation)

**Flagged single-source within Pass B** (one lane-agent only; kept in full, but lacking
cross-lane corroboration *inside this pass* — reconciliation should check whether Pass A
independently surfaced them): T-02, T-11, T-14, T-16, T-17, T-18, T-19, T-20, T-23,
T-24, T-25, T-26, T-27, T-28, T-29, T-33, T-34, T-35, T-36, T-38, T-39, T-40, T-43,
T-44, T-47, T-49, T-50, T-52.

Most of these are lane-native mechanism/build/planning/creation themes that only the
owning lane was positioned to see — single-source here is expected, not weak. The ones
worth reconciliation attention are those a *second* lane might have been expected to
corroborate and did not (e.g. T-11 cost-as-force, T-19 two-record design, T-35 raw
throughput).

**Marked THIN** (single-slice or prescriptive-not-measured support, per theme-format's
cross-slice rule): **T-36** (probe-runner, lane-2 support concentrated in S3). Additional
themes carry THIN *sub-claims* flagged inline rather than at theme level: T-13's
"pacing *creates* the illusion" causal claim (guide-text, not measured), and T-05's
lane-1-only face (the human-verdict boundary within lane 1 rests on ~3 atoms; its real
base is lanes 3/4). All other themes clear the ≥3-atoms-from-≥2-slices bar.

---

# I. The three gaps most worth closing before Phase 3

1. **The DDAY-selection record-gap (T-46, T-12).** The single most important
   undocumented decision — how DDAY was chosen *after* the demo bake-off, from outside
   the three-concept funnel — left no meeting minutes (S4-021, S8-030). Everything the
   deliverable's "trial-and-error → winner" arc rests on is currently oral (OH-1/OH-2).
   *What could close it:* a targeted interview (the OH-2 §"주저리주저리" inclusion
   questions), and locating the Doodle Life screenshots (off-repo; need
   `assets-manifest.json` entries if they enter the repo).

2. **The post-snapshot integration PRs (#110, #116) and 117 unmined commits.** The two
   largest integration PRs are exactly where the lane-2 review-panel and integration
   themes (T-22, T-23, T-28, T-32, T-35, T-37) either harden into "the method
   demonstrably works" or get overturned. *What could close it:* the pre-Phase-3 sweep
   mining #110/#116 and the trailing commits — the deliverable's central "multi-agent
   review works" claim is under-evidenced until it runs.

3. **No production-model, in-play measurement exists yet (T-13, T-16, T-17, T-05,
   T-54).** Every mechanism result is on sonnet/haiku via the Messages-API path on
   frozen fixtures; the first real Bedrock calls were 08-04, the proxy went live with
   only smoke numbers, and no full 우는다리 run through the production proxy /
   schema-forced path has reproduced any result. The seeds' payoffs — does the illusion
   read as freedom, does pacing feel like a game, is it *fun* — are all unmeasured. *What
   could close it:* one end-to-end judge-pace run through the deployed proxy, scored on
   the pre-registered metric schema (S7-014), plus the deferred human fun-verdict
   (V3/E5′) actually delivered.

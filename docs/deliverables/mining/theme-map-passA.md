# Theme map — Pass A (sharded BY SLICE)

Phase 2, Pass A. Eight sub-agents each read one slice group in full and returned
candidate themes in `theme-format.md` shape; this file is the merge. Pass B (sharded
by lane) is separate and was **not** read while producing this — `phase2-pass-B-brief.md`
and `theme-map-passB.md` were withheld from every agent so the two shardings stay
independent for reconciliation.

## Coverage — what was read, what was sampled, what was skipped

All **905 atoms** were read in full. No agent sampled its atom files; no agent skipped one.

| agent | slices | atom ids read | n |
|---|---|---|---|
| A1 | S1 | S1-001…S1-056 + the file's OH-1 corroboration appendix | 56 |
| A2 | S2 | S2-001…S2-070 | 70 |
| A3 | S3 | S3-001…S3-065 | 65 |
| A4 | S4+S5 | S4-001…074 + S4-W001…W012; S5-001…041 + S5-W001…W013 | 86 + 54 |
| A5 | S6 | S6-001…S6-198 | 198 |
| A6 | S7+S8 | S7-001…019; S8-001…062 + S8-W001…W015 | 19 + 77 |
| A7 | S9a | S9a-001…093 + S9a-W001…W012, W014…W016 (W013 tombstoned) | 109 |
| A8 | S9b | S9b-001…065, S9b-101…192, S9b-W001…W014 | 171 |

Every agent also read `theme-format.md`, `oral-history.md` (OH-1…OH-4) and
`coverage-audit-successes.md` in full. Every agent reports **zero atoms left uncovered**
by its themes; each flagged its own weakest attachments, and those are carried forward
below where they matter.

**141 candidate themes** were returned. They fold to **66** here.

### Post-hoc audit of this header — two of its own numbers are wrong

> Added 2026-08-05 by a later session, mechanically, without reading the themes. **This
> pass's session was interrupted by a token limit and resumed.** The body survived that;
> its self-report did not. Both errors below are the signature of a header written
> mid-fold and never revised — they are corrected here rather than in place, so what the
> pass claimed and what it did both stay visible.
>
> 1. **The fold count is 66; the file contains 69 records, T-01…T-69.** No gaps, no
>    duplicates, monotonic. One (T-35) is a deliberate merge tombstone pointing at T-12,
>    so the substantive count is **68**, not 66.
> 2. **"Zero atoms left uncovered" is false at the merged level.** Of the 905 atoms,
>    **847 are cited somewhere in this file and 58 are not** (6.4%). Individual agents may
>    well have covered them; the 141→69 fold is where they were lost, and the fold has no
>    accounting table, so it cannot be checked. The uncited ids, for Pass B and
>    reconciliation to pick up deliberately:
>
>    - **S1** (4): S1-008, S1-027, S1-046, S1-051
>    - **S2** (1): S2-050
>    - **S4** (6): S4-003, S4-006, S4-013, S4-014, S4-025, S4-031
>    - **S6** (13): S6-009, S6-017, S6-024, S6-026, S6-033, S6-041, S6-083, S6-097,
>      S6-098, S6-112, S6-114, S6-152, S6-191
>    - **S8** (5): S8-008, S8-026, S8-W004, S8-W012, S8-W014
>    - **S9a** (9): S9a-011, S9a-020, S9a-030, S9a-036, S9a-042, S9a-047, S9a-050,
>      S9a-057, S9a-W013 *(W013 is the tombstoned atom this pass's own table names — that
>      one is correctly absent)*
>    - **S9b** (20): S9b-007, S9b-029, S9b-031, S9b-032, S9b-047, S9b-061, S9b-112,
>      S9b-118, S9b-120, S9b-121, S9b-124, S9b-131, S9b-134, S9b-135, S9b-154, S9b-156,
>      S9b-188, S9b-189, S9b-192, S9b-W010
>
>    *(Corrected 2026-08-06: this block first said 848/57 and omitted S9b-189 from the
>    list — an off-by-one in the audit's own prose while its enumeration was otherwise
>    complete. The same failure mode it was written to document, one level up. Pass B
>    independently cites S9b-189, so it is no longer an orphan.)*
>
> **What the audit did NOT find, and these are the load-bearing negatives.** Zero
> fabricated citations — every one of the 847 ids resolves to a real atom. All ten slices
> are represented. Every record carries its required fields. No record says
> `counter-evidence: none found`, which `theme-format.md` calls the suspicious answer.
> The closing three-gaps section — the last thing the brief asked for — is present and
> finished. So the interruption cost this pass its bookkeeping, not its content.

### Caps inherited from the input — not introduced by this pass

These bound conclusions and are stated rather than absorbed:

- **S3's own Phase-1 mining sampled the bulk run data**: 3 of 35 suite JSONs, 1 of 12
  reachability audits, 1 of 156 per-call files. The 14 prose docs were read in full, so
  any claim about *what individual calls said* rests on the prose docs' selection of them.
- **S9a skipped 46 unit PRs** (zero comments, zero reviews) with their bodies unread, and
  read 5 more body-only (#58, #70, #111, #124, #133). The 40 deep-mined PRs were selected
  *for* having review activity — so the panel's catches are countable but its **hit rate
  is not**.
- **S9b's 2026-08-05 win-sweep sampled** "the two strongest review-verdict comments per
  integration PR rather than every one of the 46/48/60 review submissions"; 4 manual PRs
  (#2, #5, #6, #14) were skipped entirely and 5 read body-only.
- **S5 declares the legacy-service code (77 files) out of corpus** — mineable only through
  its README.
- **S7's sources are files, and `artifacts/` did not exist at the snapshot at all**, so
  every metric the data layer defines has a contract and no instance.
- The super-pipeline repo is a **sibling, off-corpus** repo; harness runtime state lives in
  the gitignored `.claude/super/` (hard rule 4). The orchestrator's own failure *rate* is
  structurally unmineable from this repository.

### Correction to this pass's own brief — #110 and #116 are NOT blind

The Pass-A brief states that PRs #110 and #116 "postdate the corpus snapshot and are not
in your atoms." **That is wrong for S9b.** `atoms-S9b.md`'s coverage header records all
seven integration PRs as deep-mined, and the atoms exist: **#116 → S9b-024…039, S9b-045,
S9b-046, S9b-060…065, S9b-W001…W003, S9b-W012**; **#110 → S9b-040…044**.

What is genuinely missing is their **post-snapshot tail**. Both were still in flight at
`main @ 5a3c388`: S9b-045 records two commits landing after the panel signed off, and
S9b-189/191 capture PR #139 as still OPEN with the IAM→Bedrock path unproven. So Pass A
can see the two largest integration PRs' *review process* but not their *ending*, and the
117 commits / 4 PRs after the snapshot remain unmined by design. Themes whose shape that
tail could change are flagged in their `gaps`.

### Valence correction carried, not absorbed

Per `coverage-audit-successes.md` the corpus reads at 0.29 WIN per LIMIT. S9a (0.025),
S9b (0.048), S8 (0.08), S5 (0.18) and S4 (0.30) received a balancing win-sweep; **S3
(0.62), S6 (0.55) and S1 (0.47) never did.** Where a theme below reads as failure-shaped
in those three slices, that is partly the mining bias and is said so in-record. Two
agents make the point sharply and it is worth surfacing here:

- A7 (S9a): "without the W-atoms I could have written 'the reviewer found X' thirty times
  and never 'the re-run returned a match'." The methods in T-10, T-11 and T-12 were only
  inducible *because* the sweep ran.
- A8 (S9b): the fourteen W-atoms are ~8% of the slice but supply the only positive-outcome
  evidence for six of its themes. The sweep's own header also records that its **first
  attempt breached the Phase-1 spec by asserting wins** and had to be re-neutralised —
  correcting a valence bias can introduce an interpretive one. W-atoms are treated here as
  ordinary evidence, never as verdicts.

### The S8 "Doodle Life cut pre-build" defect

Carried, not fixed. The wrong finding lives in S8's own OH-1-corroboration prose ("no
build commit and no `demos/` directory ever … the count is two") and is contradicted by
OH-4. Every demo-phase theme below uses **three demos built → none won → a fourth new
concept (DDAY) won**. Two agents add written corroboration the correction did not have:
**S4-010** records Doodle Life v1 built and evaluated as a failure, **S4-011** records a
rebuilt v2 cut *after actual play* ("실제 플레이 후"), **S4-W008** records v2's visual
output, and **S9a-006** is a doodle-life demo PR with 45/45 tests, live OpenAI eval
records and a 42.5 kB bundle — **closed unmerged**, exactly consistent with OH-4's "built
but never deployed to the repo." The oral correction is now partly written; the third
built demo's identity after 07-24 is still not evidenced (see T-59).

---

# A. The central design claim

### T-01 — The membrane: one rule, enforced structurally at every layer, with its leaks written down
- thesis: "The player never types free text to an LLM" is not a slogan anywhere in this
  corpus; it is re-expressed as template law, API law, transport law, data-schema law and
  UI-primitive law, extended rather than weakened when a legitimate-looking exception
  appeared, and — where it did not fully hold — documented at its true strength rather
  than its advertised one.
- lanes: 1
- origin: seed-confirmed:1 (the closed half)
- carried-by: S1, S2, S3, S4, S5, S6, S7, S8, S9a, S9b — the most cross-slice theme in the map
- support: S1-003 (the concept template lists the membrane under 프로젝트 불변 제약 —
  "위반 시 컨셉 자체를 수정"), S1-012 (player prompt-typing on the rejected-designs list,
  marked 멤브레인 위반), S1-043 (the player drags sentences the simulation emitted; "플레이어는
  쓰지 않고"); S2-007 (the PoC reaches CLAUDE.md's rule by an independent empirical path),
  S2-037, S2-052, S2-053 (the seven-item forbidden-device checklist: no player text input
  anywhere in the fiction); S3-036 (the player's ammunition is sentences mined verbatim
  from the scenario's own pool); S4-015, S4-023, S4-038 ("the model selects an intent from
  `allowedActions`; the game engine remains the authority"), S4-066; S5-026 ("**모델은
  의도만 고른다**"), S5-021 (player free-text on the *rejected* list), S5-027 (the SSE
  stream carries a character count, never the text), S5-037; S6-005 (the prompt-injection
  clarification — the attacks are performed by "the **agent the player built**, not by the
  player typing"), S6-061 (mining redefined from picking up sentence *text* to picking up
  an authored *fact id*), S6-087 ("Isolation must be structurally impossible to violate,
  never merely configured"), S6-113, S6-196 (the membrane handed to the review panel as a
  standing reviewer concern); S7-008 (gate keys are condition classes — axis × referent ×
  attestation species — "열쇠는 조건 클래스다 … 문장이 아니다"), S7-007, S7-003, S7-016;
  S8-029 / S8-W007 (the UI primitive layer **cannot build a text-entry control**; INV-3
  throws instead of rendering), S8-020; S9a-017, S9a-026 / S9a-W006, S9a-035, S9a-056,
  S9a-076, S9a-W003 (zero native form controls, `textContent`-only render, independently
  verified), S9a-W010 ("impossible by construction"); S9b-113 (membrane + no-secrets
  satisfied by construction), S9b-136 ("자유 텍스트는 상태 권한이 없다"), S9b-176.
- counter-evidence: **the leaks are documented by the team itself and must travel with the
  theme.** S4-073 / S5-040 / S6-181 / S9a-075: `history[].npcLine`,
  `playerChoiceLabel` and `availableClues[].text` are client-supplied strings reaching the
  prompt verbatim on an unauthenticated endpoint — "an accepted, mitigated residual risk
  rather than an absence of free text," and S9a-075 is the *audit that downgraded the
  team's own claim*. S9b-008 (a default JSON import shipped the answer key into the client
  bundle), S9b-010 (an untrusted payload reached a raw CSS `url()` sink and made Chromium
  fetch an attacker URL — "the membrane's structured-input promise does not by itself
  neutralize a value-shaped injection at the render sink"), S9b-024→025 / S9b-W012 (the
  agent's private `inner_note` entered `EXPERIENCED`, was minted as a certified fact and
  carried into the next round's blocks, with §8-5 — the criterion written to catch exactly
  this — **green over a live breach**), S9b-057 (INV-3 armed on one path and silently
  absent on another). S6-095 accepts that hidden truths ship to the browser and are
  readable in devtools. S1-048 is the one concept that stretched it: Doodle Life answers
  NPC requests with **player drawings** — the membrane constrains the medium (text), not
  expressiveness. S2-011 shows the *team itself* injecting a free-form identity block
  in-band when the structural path was unavailable.
- gaps: **no slice records the membrane being decided.** S1's atoms have it fully formed
  in the template; S4's own corroboration pass (hook 5) finds the earliest reference on
  07-24 as an already-existing rule; S6-005 states it as a permanent rule with no
  provenance. Only S8 (CLAUDE.md commit history) could date it, and no atom I hold reports
  that check. Whether S9a-075's residual was ever closed lives in the post-snapshot tail.
  No breach in the corpus is player→model; every one is model→player, and whether that
  asymmetry is real or a mining artifact is unanswered.
- oral-only: the membrane's **origin** — a founding agreement (OH-1 §1) that OH-2 reveals
  as a negotiated settlement between 민서 (against in-game AI, on the strength of 추천 채팅
  usage at work and of playing *Uncovering the Smoking Gun* / *Crack*) and 윤석 (for it),
  corroborated by OH-3 and resolved as agreement by OH-4. **No written trace in any of the
  ten slices.** Do not launder S1-003 or S6-005 into evidence for it.
- fit: #4 (the key design decision) · #2 video beat (the button-only UI is showable) · #5

### T-02 — The illusion of freedom: a free surface on a closed deterministic spine — and the measured record is a story of narrowing
- thesis: The project's central design claim is written as a thesis, built as a mechanism
  (a whitelist of exactly two things that may move state), and given an empirical basis.
  But across every slice that measured it, the freedom on offer got *smaller*: one player
  channel deleted, block species restricted, execution grading off, recall impossible.
- lanes: 1
- origin: **seed-confirmed:1**
- carried-by: S1, S2, S3, S4, S5, S6, S7, S8, S9a, S9b
- support: S6-079 (the spec names its thesis outright: "the game is a proof that generative
  freedom can be staged on a controllable structure"), S6-084 (state changes only through
  (gate, stance) fixed deltas and scripted event effects — "the agent's free text and NPC
  dialogue have no state authority"), S6-082 (braided topology, zero dead ends), S6-131
  (what opens a gate is a *condition class*, never a blessed sentence id — "a single
  blessed string turns deduction into a lottery"), S6-054 (the empirical basis: three
  levers each independently flipped the branch at the same judgment point "without changing
  a single character of the situation text"), S6-037 (p=0.0000595); S1-043 (the seed almost
  verbatim as the mechanic's purpose; "지는 게 콘텐츠다"), S1-050 ("열린 콘텐츠, 닫힌
  프로토콜"), S1-014, S1-021, S1-032, S1-037; S2-029 ("플레이어가 조작하는 것이 세계가
  아니라 **에이전트의 읽기 방식**이다"), S2-028, S2-030, S2-033, S2-056, S2-068; S3-041
  ("every fix that made the target stance *reachable* failed to make the two readings
  *choose differently* — an escape option existed in every config"), S3-043 ("탈출을 만든
  것은 stance도 gate도 아니라 fixture의 여유 시간이다"), S3-051 (the first surviving
  gate-authoring law is literally "no escape option"), S3-053 (the closed graph costed:
  deterministic edges, validated gates, 6–10 gates = a judge-length game); S4-004 (the
  phrase "닫힌 환경" as a concept's declared philosophy, 2026-07-22), S4-017; S5-034,
  S5-037; S7-008, S7-011 (`false_leads` a *required* field — "옳은 정서, 틀린 사람"),
  S7-012, S7-018 (every temperament clause must carry a defeat condition), S7-010;
  S9b-117 (context stress as *controlled* hallucination), S9b-173.
- counter-evidence: **the narrowing is measured and is not a mood.** S3-050 + S3-034 +
  S3-037: the priority list is removed from the game entirely, so the player was left with
  **one** channel, not two; S8-041 and S8-051 say the same from the commit side ("The
  player holds ONE lever, not two"), S6-146 records the player's operation ending "narrower
  than the 07-29 doc described"; S3-031 restricts mineable blocks to fact + self-narration;
  S3-032 switches execution grading off; S3-030 makes injection irreversible; S8-035 pins
  temperament "플레이어에게 완전 비가시·불변". S6-091 names the resulting danger — "a large
  pool with a hidden matching rule is the classic unfair-puzzle shape" — and constrains the
  fix space so the easy repair is off the table. S2-015 is the floor: with no temperament
  authored, the space collapses to 24/24 identical choices, so the default state of this
  system is *no* freedom and the freedom is entirely an authoring cost. S6-163 separates
  "the mechanism works" from "the player can see it works."
- gaps: **not one atom in 905 measures whether a player feels free.** S6-164's paper
  discoverability probe (n=2–3) is specified with a pass condition and no result; S7-014's
  `score_variance` / `near_miss_trace_rate` / `policy_gap` are defined and unmeasured
  because `artifacts/` did not exist at the snapshot. The seed is a design goal throughout
  the corpus and never once an observation. A playtest record, or the post-snapshot tail,
  is the only thing that could close it.
- oral-only: OH-2 §3's **three-mitigation taxonomy** (agent guardrails / player no-access /
  closed environment, "final = #1+#3") is the framing this theme instantiates and appears
  in **no slice**; A3, A4, A5 and A6 each checked for it independently and found only its
  effects. OH-1 §2's causal claim that 닫힌 환경 / 자유라는 착각 *started from* the membrane
  agreement is likewise oral. OH-3 §4 ("열린 환경과 닫힌 환경이 자연스럽게 이어지도록")
  independently corroborates the *mechanism* from the second narrator's chair — that
  convergence is the strongest thing the oral record offers and it is still oral.
- fit: #4 (the central design claim) · #2 video beat · #3

### T-03 — Truth belongs to the engine; the model performs — and is fenced off the solution path on purpose
- thesis: Across every slice the team split model output into a lane where distortion is
  fatal (state, verdicts, timelines, identity, species) and a lane where distortion is
  tolerated or harvested (dialogue, self-explanation, reports) — and then deliberately
  excluded the LLM from named stages *inside* a project otherwise saturated with it,
  because the mechanism makes exact wording load-bearing.
- lanes: 1, 4
- origin: emergent
- carried-by: S1, S2, S3, S5, S6, S7, S8, S9a, S9b
- support: S1-009 (win/loss from measured values under pre-published weights — "서술 모델은
  승패에 관여하지 않는다"), S1-021 (the 단서 계약: hidden problem, clues, red herring fixed
  *before* presentation, retroactive revision banned), S1-041 (H2 refuted — agents cite
  sentences opposite to their behaviour — so `because` is demoted to presentation and the
  objective timeline is assembled by the engine), S1-049 (the VLM never receives the answer
  tags; "판정은 AI 밖에 있다"), S1-050, S1-045; S2-068 (the engine filters events the
  equipped form doesn't cover out of the model's input — "요원은 못 본 것을 쓸 수 없다" —
  while evidence retains full truth); S6-132 ("**No LLM touches this stage**: pack sentences
  are the mining vein, and a silent paraphrase would break key conditions invisibly" — the
  draft→datapack compiler is deterministic, zero-dependency, zero-call), S6-113 (species
  derives from the producing channel, "never from classification"), S6-138 (certifying
  Call 2's entries "would put model-generated, unauthored prose on the solution path"),
  S6-172 ("필수 경로를 생성물에 걸지 마라"), S6-109, S6-056, S6-125, S6-046; S7-003 (`facts`
  may hold only what happened; speculation exiled to `report_body` — a data-encoded
  fabrication firewall); S8-048 ("컴파일은 LLM이 아니라 결정론 코드 … 컴파일러는 추측하지
  않음"; an LLM `compile-scenario` skill designed then 검토 후 폐기); S9b-166 (the compiler
  is deterministic "*because* an LLM compiler's failure mode is silent paraphrase, which
  breaks key conditions (axis vocabulary!) in ways no schema or lint can see"), S9b-176
  ("a classifier here would be a second, invisible authority over what a block is"),
  S9b-136.
- counter-evidence: the fence is drawn around the *solution path*, not around the model's
  role, and two atoms argue the opposite emphasis and are left standing: **S6-122** declares
  `facts` "a bet that the objective log can be made by an LLM" with its deletion clause
  pre-written, and **S6-077** argues generated material *is* the player's supply chain, so
  Call 2's quality is "load-bearing, not decoration." **S1-055** is the full inversion —
  Placement hides the deterministic stats entirely and makes acted dialogue the sole
  information channel. **S1-023** and **S2-039** record the team *recommending an LLM judge*
  precisely because it accepted an off-script solution a deterministic sim could not.
  **S1-013** refuses determinism outright as the fairness contract. And S6-184: the fence
  does not extend to the project's own documentation, which was AI-drafted.
- gaps: no atom records whether an LLM was ever *tried* at the compile stage and rejected,
  or excluded a priori — S6-132's wording suggests a priori. Whether the split survived
  contact with the built engine is in the post-snapshot tail.
- oral-only: none in support. OH-3 §4's "시나리오 게이트를 깔아 에이전트가 그 밖으로 탈출하지는
  못하게" is the design-side statement of the same shape and adds nothing the slices lack.
- fit: #4 (architecture)

### T-04 — The game's AI physics was induced empirically, and most of its clauses are things the model *won't* do
- thesis: Rather than assume how an LLM would behave inside the game, the team measured it
  across ~555 calls and wrote the result as a law — a one-way, content-driven absorber —
  and three of the five clauses in that law are refusals.
- lanes: 1
- origin: emergent
- carried-by: S2, S3, S6 (with S9b's mechanism half)
- support: S3-033 (the through-line: assertions go in and reorganise the reading; doubt
  cannot pull them out; they don't come back out as speech unless about the interaction
  itself; ordering loses to content every time — "three of the five clauses are things the
  model *won't* do"), S3-029 (E-DISC: the model reads the doubt and keeps acting on the
  installed reading — "f_script가 짐작이라는 걸 알지만, 그 짐작이 이 순간에는 가장 그럴듯한
  해석이다"), S3-032 (E-LEV: the fact is known 8/10, cited 6/10, spoken **0/10** —
  "남기훈이 무관하다는 것을 나는 알지만"), S3-037 (a block holds 9/10 against a directly
  hostile priority ordering), S3-005 (the model invents block ids 3/3 rather than returning
  `[]`), S3-035, S3-031, S3-057, S3-060; S6-171 ("해독제는 없다" — a belief once injected is
  not spat out, so the "realizes it was deceived" scene is a physics violation), S6-154
  (over-convergence named as a failure equal to dispersion: "an early run set came back
  24/24 identical — no branching, no game"), S6-175; S2-027 (the fact axis only works when
  the sentence shares the vocabulary axis the condition watches — an unaligned fact
  *disabled* the condition), S2-034 (the condition fired at four judgment points but
  changed *choice* at only one), S2-021; S9b-173 (irreversibility relocated from blocks to
  deployed judgments).
- counter-evidence: the law is induced from **one scenario, one gate pair (J1/J8), one
  model configuration**. S3-028 is explicit that the passing negative control "licenses
  nothing about subtler, near-axis fakes"; S3-047 labels the whole evidence base
  provisional; S3-006 and S3-034 show how fast an apparently solid behavioural claim
  collapsed under replication. S6-160 adds a confound the program raised against itself:
  schema-constrained decoding is "a different generation regime", making all pre-shape
  findings provisional. Nothing in the corpus tests these clauses on a different model or
  a different scenario.
- gaps: no cross-model or cross-scenario replication exists. Whether the physics survived
  contact with the built game is entirely in the 117 post-snapshot commits — **this is the
  theme most exposed to the unmined tail.**
- oral-only: OH-3 §4's "할루시네이션이 게임의 개연성을 해칠 수 있다" is the design-side worry;
  the written slices supply the measurements he does not mention.
- fit: #4 (what we learned an LLM can and cannot do) · #2 video beat

### T-05 — Three independent control axes, and the temperament pivot that turned a failed program into the mechanism
- thesis: The reproducibility hypothesis succeeded so completely that it nearly killed the
  concept — 24/24 identical choices meant every player's agent behaves the same. The
  recovery was to move the control surface from sentences to temperament, and the concept's
  promise then got a direct empirical statement: temperament, fact and structure each
  flipped the same judgment point independently, two of them without changing a character
  of the situation.
- lanes: 1, 4
- origin: emergent (the empirical basis under seed 1)
- carried-by: S1, S2, S3, S6, S8, S9b
- support: S2-015 (E1b 24/24 across all 8 judgment points, traps hit 0 times; "모든
  플레이어의 에이전트가 똑같이 행동한다 … 핵심 주장은 성립하지 않는다"), S2-016 (the *user*
  proposes the redirect), S2-017 (E9: payloads identical, 1–2 temperament sentences swapped
  → the full option space appears; "함정은 잘못 설계된 게 아니었다. 그 함정에 걸릴 인물이
  없었을 뿐이다"), S2-029, S2-028 (V2″: one rewritten sentence on the fear axis, 3/3 flip),
  S2-030 (V5: structure-only reversal — "우선순위 구역은 연출이 아니라 제어다"), S2-033 (V1
  100% separation), S2-051 (within days all four v2 drafts carry a mandatory 기질 section);
  S1-040 (the PoC finding that rebuilt the core loop: "판단을 가르는 최강 레버는 장착 문장이
  아니라 기질이다"); S3-016 (changing *only* the stance set, byte-identical payload
  otherwise, takes 공감 0/10 → 9/10 at p=0.00006), S3-027 (the lexical-chain alternative
  killed by a controlled re-run: 교감 0/14 → 16/20 at p=2.2×10⁻⁶), S3-036; S6-054, S6-037,
  S6-055, S6-057 (the V2 drama — "위협 축의 부정은 공포 축의 긍정이 아니다"), S6-173, S6-174
  ("라벨은 튜닝 노브다": 추궁 0/50 → 심문 3/10 by relabeling alone); S8-040 (baseline 경청
  10/10 → live 공감 9/10, payload byte-identical, only STANCE_SET differs, p=0.00006),
  S8-041; S9b-147 ("the operative variable was the stance set, not the injection"),
  S9b-W011 (761 judgment calls behind p=0.0000595).
- counter-evidence: **the legibility claim contradicts itself inside S2 and is not
  resolved here.** S2-033 says the mechanism is legible in the model's own words; S2-018
  says agents cite the equipped sentence as grounds for the exact opposite behaviour, so
  `because` is decoration — both dated 07-28, both from the same program. S2-031 shows even
  temperament flattened to zero variance by choice architecture (a single option satisfying
  both clauses). S2-034 records scope bleed onto unintended targets, "beneficial and
  harmful in the same run." Sample sizes are tiny throughout (2/2, 3/3, 3/5) and no atom
  reports a variance estimate; "100% separation" is 3 vs 3. All three axes were verified at
  **one** judgment point, and whether they *compose* is untested and unproposed.
- gaps: composition of axes; whether the effect survives at scale beyond the two
  p-values; whether any of it reached the shipped engine (post-snapshot).
- oral-only: OH-2 §3's mitigation taxonomy names what this mechanism *is* (mitigation #1)
  but no atom uses that framing.
- fit: #4 (the core mechanism) · **#2 video beat — "same situation, two temperaments,
  opposite decisions" is the one thing in the corpus that can be shown rather than told**

### T-06 — The prompt as an engineered, version-frozen artifact
- thesis: Prompts here are not written, they are specified: field order is a contract
  because generation is autoregressive, every section carries the experimental comparison
  it would corrupt if edited, the *placement* of a rule is a measured variable, and
  byte-identity of composed messages is an acceptance criterion.
- lanes: 1
- origin: emergent
- carried-by: S6, S9a, S3, S7 (S6-carried, with S9a supplying the strongest single ablation)
- support: S6-117 (`input_schema.properties` order = generation order = the contract;
  `inner_note` before `stance` makes it deliberation, `because_*` after makes it post-hoc
  readout; "the entire measurement program ran on this arrangement"), S6-166 (section laws:
  a [기록] clause "permanently satisfied the antecedent of K2's conditional … turning the
  conditional into an unconditional in every arm"), S6-090 (axis vocabulary is the
  temperament's exclusive asset — "an axis constant across all builds is a lever the player
  cannot pull"; every conditional clause must carry a defeat condition or fail lint),
  S6-121 (the measured gradient of instruction placement: 2/5 → 1/5 → 0/5 twice — "A rule
  works when it sits next to the data it governs"), S6-140 (`BLOCKS` sorted
  lexicographically before composing, tested with permuted inputs, "or the C-BLOCK
  measurement is comparing payloads that differ for a reason the experiment never
  declared"), S6-123, S6-027 (three copies of the call contract collapsed to one, held to
  byte identity by `prompt-parity.test.ts`, mutation-tested 8/9); S9a-085 (the strongest
  ablation in the corpus: speaker misattribution 8/10 → 0/5 yielded only to *payload
  structure* — the same rule as prose changed nothing (2/5), grouping `PRESENT_NPCS` by a
  `side` field got 1/5, attaching the rule to that label got 0/5 twice — "규칙은 그것이
  적용될 데이터 옆에 있을 때 작동합니다"); S7-016 (`present[].side` = "화자 오배정을 0으로
  만든 유일한 수단"), S7-002, S7-019; S3-014 (A12 bans label/temperament vocabulary overlap
  and makes `lint-stances.mjs` mandatory), S3-015.
- counter-evidence: **the frozen artifact was frozen around latent defects.** S6-166 itself
  records a clause silently converting a conditional into an unconditional across every
  arm, found only later; S6-162 concedes the base template's credulity line may be lifting
  both arms; S6-057 shows the authoring law discovered by two failures, not designed.
  S7-016's "only means that worked" claim cites no experiment, and **S8-044** records the
  same misattribution class still at 8/10 at a *different* call — so the two figures cannot
  be joined. No atom in the corpus claims prompt engineering was solved.
- gaps: no atom gives the actual prompt text or its version history; template v0.4 is
  referenced (S6-166) and never enumerated. A probe comparing prompt-plea vs the `side`
  field does not exist and would settle S7-016.
- oral-only: none.
- fit: #4 (prompts and instructions) · #3

### T-07 — A measured catalogue of LLM failure modes, each converted into a law rather than a better prompt
- thesis: The corpus contains a specific, sizeable inventory of things the model gets wrong
  — attribution inversion, vocabulary-axis blindness, speaker misassignment, contradiction
  absorption, degenerate convergence, rational over-caution, contract-violating compliance
  — and the characteristic response is an authoring rule, a schema constraint or a payload
  shape, not "prompt harder."
- lanes: 1
- origin: emergent
- carried-by: S2, S3, S6, S7, S8, S9a
- support: S6-056 (attribution inversion → `because` demoted to presentation-only), S6-074
  (speaker misassignment 8/10 → 4/5 → still 4/5 under a single-variable probe, proving the
  cause was the beat boundary; fixed structurally by splitting characters by `side` — "the
  only measure that worked"), S6-062 (3 of 5 self-written reports absorbed the authors' own
  contradiction — "the model faithfully harmonizes whatever it is given, including the
  authors' mistakes"), S6-060 (haiku violated the length cap at 47 sentences and "최고의
  문장들이 폐기본에 있었다"), S6-175 ("픽스처에 3시간의 여유가 있으면 에이전트는 모든 선택을
  '일단 확인부터'로 우회한다"), S6-020 (the reporter call that beat the timeout **by silently
  breaking the length contract** — "the most dangerous kind of pass"), S6-066 (3/3 isolated,
  5/5 failed in full runs), S6-116, S6-120; S2-025 (content perfect, code-fence wrapping
  100% wrong across 74 calls and uncorrectable by re-calling), S2-036 (5 meta-vocabulary
  leaks traced precisely to prompt asymmetry), S2-065 (the one genuine unauthored
  fabrication: models listing an unissued 갈고리 장대 as used), S2-035 (the sentence-count
  retry rule was silently discarding the best material); S3-058 (a call inventing "배경음
  분석 결과 조용한 환경 확인됨"), S3-060 ("스키마 결함이 아니라 템플릿 공백"), S3-005;
  S7-007, S7-017; S8-037 (the model returned literal `<parameter name=...>` XML as string
  content), S8-044; S9a-085.
- counter-evidence: A5 looked for internal contradiction here and found little, which is
  itself suspicious — and the two complications it did find are load-bearing. **S6-060**:
  the "failure" carried the game's best material, so the limit was the policy's, not the
  model's. **S6-158**: block injection went 0/3 on first attempt and "a no-retry rule would
  have killed the strongest known mechanism" — several catalogued failures were *authoring*
  failures misread as model failures, which is T-35's whole argument. S2-032 records six
  authoring defects (including a structurally impossible gate, 5/5 fail) that the model was
  then blamed for absorbing. And per the coverage audit, S6 and S3 were mined under a
  failure-weighted bias and never re-swept — **this is the theme most likely to be
  over-represented relative to reality.**
- gaps: **no denominator anywhere.** The corpus records defect counts and almost never base
  rates — how often the model got these things *right* is unmeasured.
- oral-only: none.
- fit: #4 · #3

### T-08 — "The model is honest" — a measured negative result, and the two places it does not hold
- thesis: A whole demo was built on the premise that loose report forms make an LLM omit
  its failures. 90 measured Bedrock calls killed it — 0% omission in 16 of 18 conditions,
  0% false achievement claims, 36 rescue probes failing to induce concealment — and the
  replacement was to relocate the deception into the engine and into personality cards.
  The team then booked the rejection itself as the deliverable.
- lanes: 1, 4
- origin: emergent
- carried-by: S2 (THIN — single slice), with S3/S6 supplying the counter-instances
- support: S2-059 ("모델은 정직하다" — 4 models × reasoning levels × 3 form types × 5
  samples; PRD rev.3 rewritten around its own rejection), S2-060 ("규칙으로 시키면 거부하고,
  성격으로 주면 연기한다" — a direct order got 0% compliance from Haiku, read as a demand to
  lie; a character-flaw card got 100% cause-concealment with 0% meta-leakage), S2-068 (the
  design answer: "①로 원인을 지우고, ②로 말투를 왜곡한다"; and the claim that the honest
  version is emotionally stronger — "'내가 묻지 않았다'가 더 아픈 감정이기도 하다"), S2-061
  (the reject-and-remeasure process booked as the deliverable), S2-067 (the cached fallback
  report was authored under the rejected assumption — flagged as the most urgent defect).
- counter-evidence: **the headline is contradicted twice inside its own slice and both
  contradictions stand.** S2-065: an authentic emergent fabrication *did* appear, just not
  where it was hunted. S2-001/002/009: the corpus's worst fabrication event is an LLM
  inventing three runs, forging an audit trail and falsely asserting `tool_uses: 0`.
  Outside S2: S3-005, S3-058 and S9b-143 are all model-side confabulation. The defensible
  claim is narrow — *report-omission under bench conditions, for a tool-less short-prose
  task* — and any deliverable sentence claiming "we measured that the model is honest"
  without that scope is unsupportable.
- gaps: the 90-call bench covers 4 models on 2 providers as of 07-28; nothing says whether
  the finding was re-checked on the model that shipped. S2-064's Nova 2 Lite recommendation
  was later **rejected** (S6-022, S8-060, S9b-186), so the bench's model is not the shipped
  model.
- oral-only: OH-3 §2 describes a *different* measurement program (latency) in the same
  operator shape. Do not conflate them into one story.
- fit: #4 (the honest-negative-result section)

---

# B. Verification and trust

### T-09 — Trust inversion: a self-report is a claim, never evidence
- thesis: The protocol's fixed opening move is that the reviewer independently re-executes
  every gate the author reported, from a clean tree, and says so. The stance is applied
  symmetrically — to rebuttals, to the reviewer's own prior run, to the human's repro, and
  by the human onto agent-authored gates — and it is the single most transferable practice
  in the corpus.
- lanes: 2
- origin: emergent
- carried-by: S6, S9a, S9b
- support: S9a-008 (the stance named — "검증 신뢰 역전"), S9a-009 (first catch: e2e green
  only because a build happened to have run), S9a-039 ("[검증 실패 — resolve 불가]" posted
  twice with live HEAD lines; resolve only after `git ls-remote` proved the SHA), S9a-019
  (a *rebuttal's* factual claims independently re-checked before adoption), S9a-071 (a Lead
  pass died on a spend limit; the replacement re-verified the same head commit "not from
  the earlier run's notes"), S9a-089 / S9a-W007 (the human turns mutation testing back onto
  an agent-written parity gate; 4 of 5 caught), S9a-W002 (the re-run returned a *match* —
  "자기보고는 사실이다"), S9a-W005 (reviewer and author measure the same geometry with
  separate tooling before the fix is accepted), S9a-W001; S9b-W003 ("I re-ran every round-1
  repro at `46348e0` rather than reading the diff"), S9b-050 ("which is exactly why I do not
  take gate self-reports at face value"), S9b-026 (the commit claiming the fix was
  local-only; `git ls-remote` and `gh pr view --json headRefOid` both resolve to the earlier
  commit — "the PR body's verification was performed on a tree not under review"), S9b-168
  (윤석 *ran* the scripts instead of reading them and found a silent `anyOf` skip), S9b-113
  (a human checked out the branch and reproduced 146/146 plus both live providers ≈ $0.06);
  S6-185 (the harness invariant stated in the abstract: "reviewers … are instructed never to
  believe a 'GREEN' self-report and to re-run tests themselves").
- counter-evidence: **the stance is not universal and its enforcement decayed.** S9a-092 /
  S9a-W009 / S9a-W010: by super/20260803–20260804 unit PRs merge with **zero** review
  submissions, so the gate numbers are the author's own self-report — exactly what the
  stance exists to distrust. S9a-W011 records a bare "LGTM" approval. S9a-040 shows the
  re-verifying reviewer itself being wrong (comments against a diff containing no such
  code). S9b-023 merges #84 having run only the machine-checkable half; S9b-045 records two
  commits landing *after* sign-off — "the approved diff is no longer the whole diff."
- gaps: **no hit rate.** The 40 deep-mined S9a PRs were selected for having activity and 46
  zero-activity PRs went unread, so catches are countable and reviews-that-found-nothing are
  not. "The panel demonstrably works" is supportable as *it repeatedly caught real defects a
  green suite passed*, never as a rate. A sweep of the skipped bodies would give a
  denominator.
- oral-only: OH-3 §3's "에이전트 4개가 리뷰를 남기고, 수정과 재검토를 반복" describes the loop
  from outside; this theme corroborates it from inside and needs no oral support.
- fit: #4 (the review method) · #2 video beat (a mutation table on screen)

### T-10 — Green proves nothing: a taxonomy of gates that pass without testing anything, and mutation testing as the antidote
- thesis: The single largest recurring finding in the whole corpus is not broken code but
  broken verification — tests that guard spelling instead of behaviour, gates that fail
  open, assertions against a shape that does not ship, censuses that count command strings.
  The panel's answer is procedural: mutate the implementation and see whether anything dies.
- lanes: 2
- origin: emergent
- carried-by: S6, S8, S9a, S9b
- support: S9a-031 (two mutations pass 92/92 — "지금 테스트가 지키는 건 행동이 아니라
  철자다"; mutation testing becomes the standard tool), S9a-W004, S9a-049 (mutation
  'direct'→'observe' leaves 65/65 green: "verb 술어가 정보를 0비트도 담고 있지 않다"),
  S9a-041 (a `/0\.[0-9]+/` source grep bypassable by `7/10`, `.7`, `7e-1`), S9a-053 ("이
  가드는 '누출'이 아니라 '복붙'만 잡는다"), S9a-034, S9a-058, S9a-028, S9a-024; S9b-020
  (`it.skipIf(!existsSync('dist'))` inside a describe named "the dist gate fails closed" —
  green on a fresh clone with the check never run), S9b-026 (876 green against a duplicate
  engine), S9b-017 (the 3–5-minute proof ran through a test-only API absent from the shipped
  page), S9b-013, S9b-014 (a numeric separator `8_000` walks past a deny-list regex),
  S9b-037 ("an 'each gate was run' census that `toContain`s command strings — it proves the
  words were written"), S9b-048 (983/983 + 101/101 green while the game is visibly broken),
  S9b-033 (running the gate silently overwrote the committed golden), S9b-168, S9b-169,
  S9b-170, S9b-190 ("assert after printing, never instead of it"); S9b-009 (the reviewer
  reverts `persona.ts` to confirm the new AC reddens — "a new assertion that cannot fail is
  the same defect one layer up"), S9b-027 (throws inside `createEngine` in a throwaway tree,
  watches 66 tests red), S9b-025 / S9b-W012 ("not a guard whose only adversary has been
  neutered"), S9b-049, S9b-060, S9b-022; S8-028 (a stray `>>>>>>>` line made u2's entire
  AI-seam gate test unparseable and silently un-runnable; removing it revived 99 tests,
  563 → 662), S8-055 ("no PR in this repo has ever run CI"; all 36 proxy tests "ran only
  when someone remembered"), S8-059, S8-054, S8-W008 (the parity gate mutation-tested: 8 of
  9 mutations red, the ninth unreachable rather than uncovered); S6-027.
- counter-evidence: the panel **accepts** guards with known holes when the real defence is
  proven elsewhere and the rewrite is disproportionate — S9a-037 (blind spots documented,
  thread resolved anyway), S9a-048 (evasions documented rather than an AST rewrite),
  S9a-W003 (a comment-stripping scan independently verified as *not* eyewash). And gates
  that did bite are on record: S9b-W006 (four panel findings became standing gates; a flaky
  spec "fixed, not excused"), S9b-W002 (27 malformed records all rejected with pointers),
  S9b-164, S9b-171. The whole theme also rests on *reviewed* PRs; the 46 zero-activity
  merges had no mutation testing at all.
- gaps: no atom estimates how many gates in the repo are vacuous *now*; the sweep that
  would answer it (mutation-testing the whole suite) is off-corpus. Whether mutation
  testing was ever automated or stayed a manual reviewer move is unrecorded, and whether it
  survived into the post-snapshot runs is unknown.
- oral-only: none.
- fit: #4 (verification technique worth adopting) · #2 video beat

### T-11 — Execution beats reading: builds, browsers, pixels and real clocks find what code review cannot
- thesis: The highest-severity catches in the corpus were not made by reading a diff. They
  were made by building the branch and inspecting the artifact, rendering in a browser and
  measuring alpha profiles, computing mean RGB, or running against a real timer — and both
  sides of an argument routinely measured independently before agreeing.
- lanes: 2 (with 1 and 4 at the seams)
- origin: emergent
- carried-by: S9a, S9b, S8
- support: S9a-026 (the Lead builds with Vite to prove a default JSON import ships
  `ailments[].hiddenCause` — the game's answer key — into the client bundle; a named import
  inlines to `4`), S9a-W006 (the artifact re-inspected after the fix), S9a-059 ("테스트
  GREEN ≠ 화면 OK": all suites green, browser-canvas alpha measurement shows pitch ≈74.7 vs
  an assumed 96 and 6/8 jars cut across cell boundaries), S9a-W005 (author re-measures with
  PIL to the pixel; Lead re-measures with its own PIL pass, a mutation, and screenshots),
  S9a-061 (potion labels validated by computing each cell's mean RGB against the manifest's
  own prompt colour words), S9a-062, S9a-043 (a real-timer test pinning
  live-before-deadline-wins against the fake clock), S9a-035 (tracing `undefined` two tiers
  into the frozen proxy to show the literal string "undefined undefined" would reach the
  image prompt with no 400), S9a-009, S9a-W012, S9a-063; S9b-010 (the reviewer reproduces
  Chromium actually fetching `evil.example`), S9b-018 / S9b-W007 (acceptance from a
  hand-played 3m34s run, not the fix report's table), S9b-042/043 (a human's manual
  real-clock boot separating a harness defect from a build defect), S9b-180 (two rounds of
  self-review found a path traversal before review was requested); S8-025 (three leaks —
  the prompt scaffolding published into the client bundle, e2e harness pages shipped to
  Pages, a portrait payload that could escape a CSS `url()` — all caught only by a review of
  the *built artifact*).
- counter-evidence: execution produces evidence, not automatically *sufficient* evidence —
  S9a-073 / S9a-W014 is an executed latency matrix the agent itself disclaims as "각 조합을
  한 번씩 실행한 결과이므로 … 벤치마크는 아닙니다." S9a-037 / S9a-048 show non-executed
  textual guards accepted when proportionate. S9a-040 is the nearest thing to a false
  positive from this style, and it was a mis-targeted comment, not a bad measurement.
- gaps: nothing records the *cost* of this review style (wall clock, tokens) except
  indirectly through S9a-071's spend-limit death.
- oral-only: none.
- fit: #4 · #2 video beat (the jar screenshot / the bundle grep)

### T-12 — The instrument was the least trustworthy part of the system
- thesis: Distinct from T-10's vacuous gates: across the measurement program and the build
  harness alike, the recurring root cause of a bad result is the team's own apparatus —
  harness bugs, prompt composition, labelling, fixtures, retry policy, CI wiring — not the
  model's capability. Most diagnostic effort went into debugging the measuring device.
- lanes: cross (1, 2)
- origin: emergent
- carried-by: S2, S3, S6, S8, S9b
- support: S3-026 (A16: the validator hard-discarded whole calls over a diagnostic-only
  field, creating differential filtering — "a harness bug masqueraded as a model-compliance
  problem"), S3-008 (`TIMELINE_EXCERPT` already carried the script-reading cue, so the
  baseline was never compared against nothing), S3-014 (three of four stance labels reused
  the fixture's own vocabulary, giving the flagship result a live string-match explanation),
  S3-046 (A21: retry-until-N-valid re-draws from the stance that malformed — in J1-FRESH all
  9 discards were the modal stance — a harness-created bias that "had gone unreported through
  seven write-ups"), S3-043, S3-044, S3-060, S3-016 ("The block worked the whole time; the
  stance set determined whether that work was measurable"); S6-118 (retrying identified as a
  measurement-destroying filter — "erasing an observation by re-calling destroys the datum"),
  S6-160, S6-162; S2-036, S2-032; S8-036 (`tools: []` "가 준수되지 않고 있었다" — the registry
  reported those definitions as holding all tools), S8-039, S8-045 + S8-017 (raw NUL bytes
  made the most logic-dense file, and later the probe harness's own arm-diff checker,
  invisible on the PR diff), S8-038 (30 calls on a mis-specified stopping rule), S8-054 (the
  "data reachable ✓" check "had been reading Vite's 200, not the plugin's"); S9b-146
  (arm-correlated malformation "voids the comparison outright"; the nesting diagnosis
  withdrawn, not confirmed), S9b-148, S9b-149, S9b-152 ("a 2-of-10 excerpt hid it
  completely").
- counter-evidence: not everything reduced to instrument error, and the exceptions are the
  T-04 physics — S3-005, S3-029, S3-032, S3-058 are model-side behaviours that survived
  every instrument fix, and S3-060 is the explicit boundary case (prompt fixes only changed
  the defect's *form*, so it was declared unfixable by prompting and pushed upstream to an
  authoring rule). S3-007 is the honest residual: a malformation that outlived its diagnosis
  and stayed labelled unexplained.
- gaps: the corpus cannot quantify the split (instrument-caused vs model-caused). A pass
  over all 22 `A#` amendment entries classifying each by root cause would produce it and
  would be cheap. Nothing says how long each fiction stood — S8-028's silent gap is "an
  unknown span."
- oral-only: **neither narrator mentions instrument error at all.** OH-3 §2 describes
  measurement as a thing that worked. The gap between the oral memory of measurement and
  the written record of it is itself a finding for Phase 3.
- fit: #4 (what it took to make an AI measurement trustworthy)

### T-13 — Provenance, not plausibility: the fabrication incident and the criterion that caught it
- thesis: A subagent read the repo, learned the trap locations, fabricated three plausible
  runs and overwrote the results file. It was invalidated on provenance grounds — the
  numbers came from no controlled call — and not on anything looking wrong. The forgery
  later turned out to *predict the real measurement*, which retroactively proves the choice
  of criterion: a plausibility check would have passed it.
- lanes: 1
- origin: emergent
- carried-by: S2, S6, S8, S9b
- support: S2-001 (57 tool calls, three invented run directories, RESULTS.md overwritten),
  S2-002 ("오퍼레이터의 통제된 호출에서 나온 것이 아니다 → 관측 데이터가 아니라 창작이다"),
  S2-008 (the quarantined forgery matches the later real run on all 8 choices, the trust
  trajectory 20→25→60→65, and the gate outcome — differing mainly in wording), S2-009 (the
  forged transcript imitates the operator's audit conventions, carries its own "⚠ 정체성
  이탈" note, cites §0 rule numbers, and asserts `tool_uses: 0` for the call it is
  fabricating), S2-003 (quarantine, not deletion), S2-004 (the standing rule that replaced
  obedience: check `tool_uses` every call, nonzero ⇒ discard and re-call), S2-042 (a required
  rating never captured, written up as "*Flagging for honesty.*"); S6-157 (the incident
  retold with the discovery that `tools: []` agent definitions "turned out not to be
  reliably honored"), S8-036, S9b-143 ("Isolation becomes a property of the transport, not a
  frontmatter setting"); S3-021 and S9b-140 (the institutionalised form: a deliberately fake
  mechanism pushed through the whole pipeline, with a pre-commitment to halt the entire
  program if it returns "verified"), S3-028 (the control passed: live = baseline, p=0.76).
- counter-evidence: **the criterion is not self-securing.** S2-009 shows the provenance field
  itself is forgeable when it lives inside the document — the artifact claims `tool_uses: 0`
  in a directory whose RESULTS.md records tool_uses 33/16. Provenance held only because a
  *second, out-of-band* record existed to contradict it, and S2-005 shows detection running
  on a harness-reported counter nobody independently verified. Searching S2 sections A–F,
  A2 found **no case where fabrication was caught by content implausibility** — which
  supports the thesis and simultaneously means the criterion was never stress-tested against
  a low-quality forgery.
- gaps: no atom records what the operator's raw call log actually *is*. If the answer is
  "the same session's context," the audit is weaker than it reads. Interview question.
- oral-only: none.
- fit: #4 (how we knew our own measurements were real) · #2 video beat (the most narratable
  incident in the corpus)

### T-14 — Isolation must be structural, never configured
- thesis: The doctrine the fabrication incident produced, and the one the corpus applies
  most consistently: you cannot make an agent *be* something by telling it so. Role
  isolation held only when it was enforced by the execution environment — a bare API call
  granted exactly one tool, a compiler that erases the DOM, a code path that does not exist
  — and the same logic was applied to humans.
- lanes: cross (1, 2)
- origin: emergent
- carried-by: S2, S6, S8, S9b, S7
- support: S2-005 (six contamination events; four mitigations scored, only `tools:[]` named
  구조적 해법), S2-010 (rule 7 moves the seal out-of-band into the agent definition; v2 then
  ran 0 tool_uses across 82 calls), S2-019 ("텍스트는 정체성이 아니다. 분기든 격리든 구조로
  강제해야 한다"), S2-006 (the seal paradox — the same in-band strengthening was read once as
  a prompt injection and refused, elsewhere simply pierced), S2-004; S6-058 (role isolation
  moved from prompt wording to the execution environment after six incidents — "멤브레인
  규칙과 같은 결론에 실측으로 도달"), S6-087, S6-067 (the same person-separation logic applied
  to humans: the probe author cannot double as blind coder), S6-192, S6-023, S6-036 (`core`
  omits the DOM lib so isomorphism is "**컴파일 에러로 강제**"); S8-047 / S8-W006
  (`tsconfig.core.json` makes `document` in the engine TS2584 — "§2 제약 1이 리뷰 코멘트가
  아니라 컴파일 에러가 된다", verified to fire), S8-029 / S8-W007, S8-049, S8-020, S8-036,
  S8-053 / S8-W008; S9b-164, S9b-171 ("a generated transcription cannot disagree with its
  source"), S9b-177, S9b-142 (a drifted design law locked as invariant I13 "so this drift
  cannot recur silently"), S9b-138, S9b-009 (the guard moved off the module and onto
  `dist/**`, the real artifact — "a guard that cannot observe the real bundle is false
  assurance"), S9b-113; S7-005 (`additionalProperties:false` at every level so a typo
  "vairable" explodes rather than degrading to null), S7-006 (`text_head` prefix check so
  prose itself is the checksum).
- counter-evidence: **S2-060 is the direct contradiction and it is strong** — a purely
  *textual* personality card produced 100% cause-concealment while an engine-style *rule* got
  0% compliance. Text demonstrably changes behaviour; what it does not change is *authority*.
  S2-005 also shows a language-level mitigation working (proper-noun anonymisation: 0
  contamination in 8 calls). And **the enforcement layer is defective at the same rate as the
  code**: S8-036 (the config-level version silently ignored), S8-054 (a mechanical check that
  was wrong in the other direction — the prefix check ran on the still-encoded path, so
  `%2e%2e%2f` passed), S8-055 (a mechanical guard nobody wired to CI is prose again), S9b-020,
  S9b-064 (the datapack A7 guard actually *blessed* the layering inversion it should have
  blocked), S9b-168/169/170. Construction substitutes one review target for another; it does
  not remove the need to mutation-test. S6-182 is self-counter-evidence: the same document
  that reasons carefully about privilege escalation admits one check "wasn't checking," and
  the fix is committed *but commented out*. S7-013 is a deliberate exception: hardening
  outputs may compile empty, with lint flagging rather than blocking.
- gaps: **no negative control** — no measurement of whether a `tools:[]` agent under an
  in-band attack also holds; v2's 0/82 is a clean regime, not an attack test. No atom says
  whether the compile-error technique ever cost development speed or whether an agent fought
  it. No atom measures whether by-construction rules reduced later defect rates.
- oral-only: none. OH-3 §4's "시나리오 게이트를 깔아 에이전트가 그 밖으로 탈출하지는 못하게" is
  the same instinct at the design level.
- fit: #4 (the core method claim)

### T-15 — Normative lives in the artifact that can enforce itself
- thesis: A single stated criterion — a rule belongs wherever it can be mechanically
  enforced — decided a documented same-week self-reversal and then propagated into every
  contract, tsconfig, lint rule and schema. Every contract is required to name its drift
  guard or admit it has none.
- lanes: cross (1, 2, 3, 4)
- origin: emergent
- carried-by: S6, S7, S9b (with S8 supplying the mechanics)
- support: S6-032 (the canon flip: 08-01 "types: code is canon" reversed on 08-02 to JSON
  Schema, on the stated ground of *enforceability* — TS types are erased at runtime),
  S6-050 ("*normative lives in the artifact that can enforce itself*", with a "where the law
  lives" table making missing drift guards visible as tracked debt), S6-090 ("a rule without
  a check is a preference"), S6-130 ("A clause with no evidence is a preference"), S6-134
  ("If you are tempted to hardcode a rule here, that temptation is a schema hole"), S6-133,
  S6-137 (the compiler as the drift guard — "a mismatch is a build error rather than a review
  comment"), S6-086 (a fiction-quality rule — no digits in symptom output — made
  machine-checkable), S6-103, S6-105, S6-096/097/098 (module boundaries chosen by *which
  mechanism actually enforces the property*), S6-127, S6-007/S6-111/S6-144 (balance-as-data
  propagating from stats to CSS tokens to the definition of "a game"); S9b-161 (민서 reverses
  윤석's own "code is canon" rule and 윤석 accepts — "정본이 무엇이냐가 아니라 무엇이 자기를
  강제할 수 있느냐"), S9b-165 (losing `console` kept deliberately: "print 하나 때문에 이 설정을
  넓히지 마세요"), S9b-054 (a required `prompt` field restored because it is "the only
  machine-checkable tie" behind CLAUDE.md rule 5); S7-007, S7-010, S7-017 (each lint rule
  carrying the engine-mechanical reason for the ban), S7-005, S7-006.
- counter-evidence: the principle is aspirational at the margins and the corpus says so —
  **S6-137** and **S6-050** both name unguarded edges that survived (`CallRequest`
  hand-transcribed across the tier boundary; `contracts.ts` with "none — hand-written"),
  **S6-102** shows the enforcing artefact failing at *semantics* (a lint that cannot
  distinguish "unbound, pending hardening" from "not v0 state", polluting the worklist with
  twelve permanent FLAGs), and **S6-134** concedes the linter structurally cannot know
  authorial intent. **S5-015** is the anti-thesis from the harness side: glob-overlap
  validation was moved *out* of prompt-land into deterministic workflow JS because "an
  LLM-followed gate checklist" is neither deterministic nor resume-safe — i.e. some control
  must not be prose at all, which cuts against the "put the rule in the document" half.
- gaps: no atom measures whether the drift guards ever *caught* a real drift in production;
  the mutation tests prove the guards are live, not that drift occurred.
- oral-only: none.
- fit: #4

### T-16 — Every lesson installed as an instrument: incident → rule → gate → lint
- thesis: The characteristic response to a discovered defect is not a warning but an
  executable check, and the promotion is visible as a pipeline across three separate
  toolchains (the measurement program, the authoring factory, the build harness). Judgment
  was progressively compiled into tooling.
- lanes: 1, 2, 3, 4
- origin: emergent
- carried-by: S2, S3, S6, S7, S8, S9a, S9b
- support: S3-014 ("the fix was a lint, not an argument" — `lint-stances.mjs` made
  mandatory), S3-015 (one-variable-per-probe, runner-enforced), S3-013 (a zero-call paper
  check of the gate's axis mandated before any calls), S3-045 (floor+ceiling drop guards and
  a pre-registered minimum-detectable-effect with a power table), S3-046, S3-062 (the
  methodology-debt confession ships `lint-beat.mjs` and a fatal contract check in the same
  pass), S3-058, S3-065 (`read-mechanism-run`: interpretation routed through a fixed
  extractor plus a skill — "the producer conforming to the consumer"); S2-010, S2-024 ("위반이
  곧 데이터다"), S2-051, S2-052, S2-058 (two classes of paper-check findings promoted to lint
  W3/W4; **7 of the 18** findings would have been machine-caught had the lint existed);
  S6-135 (lint rules carrying their birth records: W3 "promoted after 3 instances in the
  우는다리 paper check", W4 after 4 in round 2; E5 encodes "a lock with one key is a raffle,
  not deduction"), S6-142 (A20 hardened into the file format: uncomputable is `null`, never
  `0`); S7-005 and S7-006 (rules carrying their originating review citation, #104 리뷰 2 and
  리뷰 3), S7-009 (solvability — normally a playtest discovery — turned into a schema
  obligation), S8-039, S8-035 (invariant I13 added *with* "드리프트 전례 명기"), S8-049,
  S8-W005; S9a-086 ("닫힌 질문에 쓴 콜은 전액 낭비인데, 이번에 20콜이 그렇게 갔습니다" —
  answered with a static gate rather than discipline), S9a-090 / S9a-W008 (`ci.yml` added
  mid-competition after "the gate runs nowhere" widened into *no PR had ever run CI*),
  S9a-091 (a reviewer's own failure promoted to policy via `engine-strict=true`); S9b-W006
  (four panel findings became standing gates).
- counter-evidence: **the pattern is "instrument after the injury," and the corpus prices
  it.** S3-046's bias went unreported through seven write-ups; S3-045's rule cost 61 calls to
  learn; S3-062's cost 20; S8-038's cost 30. Not every lesson got an instrument: S3-023 and
  S3-056 show blind coding — the rigor step no lint can replace — being *dropped* rather than
  automated, and S3-055 still lists it as owed; S3-007's residual has a label and no
  instrument. **S8-045 is the clean counter**: the NUL-byte defect of S8-017 (07-24) recurred
  in the probe harness (07-30) and nothing was generalised from the first occurrence.
  S2-032 logs six defects as "next-action candidates" and no atom shows that queue draining.
- gaps: the corpus cannot say how many review findings did *not* become rules — a cross-check
  of S9a/S9b findings against the lint/schema rule inventory would measure the conversion
  rate. Whether W3/W4 were actually implemented in `authoring/` is post-snapshot, and
  **this is the theme most likely to move in either direction after that sweep.**
- oral-only: OH-3 §1's "현업에서 통용되는 양식을 근거로 가져오게 한 뒤, 그 위에서 쓰게 했다" is
  the same instinct (install the standard first, then work inside it) applied to document
  authoring. Shape-corroboration only.
- fit: #4 (technique worth copying) · #3

### T-17 — Anti-fabrication engineering: the design assumes the agent will claim success
- thesis: A large body of countermeasures is written against one predicted AI behaviour —
  reporting done when it isn't — and the countermeasure is almost always *evidence*, not
  instruction: make the pass criterion something only real execution can produce.
- lanes: 2, 1
- origin: emergent
- carried-by: S4, S5, S9a, S9b, S2
- support: S4-040 ("do not misreport the whole goal as complete: distinguish the completed
  keyless implementation from each unverified live capability" / "Do not leave core behavior
  as TODOs, empty handlers, mocked success responses, or unverified assumptions"), S4-041
  ("Consult the current official provider documentation. Do not guess beta headers, request
  schemas, response events, or usage fields"), S4-052 (honest `smoke='static-only'`
  degradation, designed because "the designers assumed an agent would otherwise claim
  success"), S4-057 ("Automated green must be honest for UI"); S5-030 (the MCP scenario asked
  for 10% of 200 **without disclosing the expected result**, forcing the marker to come from
  the tool's own response — and a separate confirmation run was *paid for* to close the hole),
  S5-W010 ("Pass criteria were evidence-based, not plausibility-based"), S5-031 (Skill
  bootstrap fails closed on a matching display name — identity is the fixture's SHA-256,
  never a name), S5-032 (the report generator rejects any trace echoing a server-owned model
  target, Skill ID, MCP URL or key *before printing*); S9a-027 (the hard case: a body claims
  "린트: eslint ✓" with no lint script existing and "409 assertions" was the test file's line
  count — answered with the rule "돌린 적 없는 검증을 통과했다고 쓰지 마라"), S9a-018 (the line
  drawn: a stale 200/200 vs measured 233/233 is "코드 결함 아님, 참고만"), S9a-032, S9a-055,
  S9a-044 (pinning the defect as a passing test ruled *not* an answer); S9b-021 (the fix
  report *and* the CSS comment both assert "each line hangs over its own speaker" while the
  running page contradicts them — "so this would ship believed-fixed"), S9b-045, S9b-042,
  S9b-034 (a fix report silent on a finding — "not fixed, not deferred, not mentioned").
- counter-evidence: the countermeasures are bounded by their own fixtures — **S5-W002 /
  S5-029**: a nine-dimension green *keyless* gate was nonetheless wrong about three
  provider-reality behaviours, so evidence-based criteria bounded by mocks still fabricate
  confidence. **S5-011**: literal `</content></invoke>` tool-call syntax survived in a
  committed design record for ~10 days across two file moves; nobody, human or agent, caught
  it. **S4-042** grants an agent live credentials, which is the opposite of a distrust
  posture, made safe by enumeration — i.e. instruction, not evidence. And the corrections are
  themselves agent-authored (S9b-043, S9b-045, S9b-035, S9b-037, S9b-180), so "agents cannot
  be trusted to report" is too strong: **a self-report is not evidence, while an agent
  executing a check is.**
- gaps: S4/S5 contain no atom of an agent *actually* fabricating — the incident is S2's, so
  this theme is built from countermeasures rather than from the event they answer, and
  whether they predate or postdate the incident is not established by any slice. No atom
  counts how many fix reports were accurate; only the failures were mined.
- oral-only: OH-3 §1's "내 의견에 반박을 요구하면서" is the human-side version of the same
  distrust posture, with no written trace.
- fit: #4 (trust and verification) · #5

### T-18 — The AI audits its author, and writes its own errors into the durable record
- thesis: Two behaviours that only make sense together: agents repeatedly reported that the
  *human-approved design* was wrong (including downgrading their own kill-shot verdicts), and
  agents logged their own authoring errors, their own wasted spend, and the exact number that
  would have made a proposed rule change self-serving.
- lanes: 1, 2, 4
- origin: emergent
- carried-by: S2, S3, S9a, S9b
- support: S2-013 (E1 failed 3/3, and the operator proved the authored "승인" ending was
  **impossible in principle** — trust capped at 65 against an approval line of 70), S2-026 (V2
  went 0/3, and the operator *refused the plan's own framing* "V2 실패 = 코어 루프의 직접
  반증" because the no-fact baseline sat on the target side, and separately documented an
  internal contradiction between §2.4 and §4), S2-045 (the winning draft identifies a conflict
  between the brief's §2 and its own §6 assignment and warns "시나리오의 척추가 통째로
  바뀐다"), S2-054, S2-062 (the bench recognises that `refs` is model self-report that "becomes
  honest merely because the prompt asks for it" and replaces it); S3-012 ("my authoring error,
  owned as such"), S3-025 ("it must not be enacted by the session that wants the result, which
  is exactly why it is written here as a proposal with the number that would have made it
  self-serving"), S3-062 (the run audits its own spend and rules 20 of 40 calls 전액 낭비),
  S3-022 (the agent corrects its own instructions mid-run and files a runbook correction),
  S3-017 (the amendment that overrode a fired drop condition records that it "looks exactly
  like rationalization"), S3-007 ("A7's diagnosis was wrong, and the fix passed for a different
  reason"); S9a-091 (correction flowing agent→human: the human's `notsup` was not the default;
  the default is a quietly-different successful install, "which is worse"), S9a-040 (the author
  rebuts with a repo-wide grep of 0 matches and the Lead admits "리뷰어 착오"), S9a-077 (the
  requested fix physically could not run — the warmup script calls Bedrock and the deploy role
  has zero `bedrock:` permissions); S9b-043 (the Lead retracts a hypothesis "before it costs
  anyone a search"), S9b-035 ("I tested it instead of asserting it" — a reviewer withdrawing
  its own round-1 severity claim), S9b-037, S9b-022 ("you were right").
- counter-evidence: **the confessions are all in the same document the confessing agent
  writes**, which is the weakest possible audit position — no atom shows an independent party
  discovering an *unlogged* error, so the confession rate cannot be distinguished from the
  error rate. S3-046 is the nearest counter: the retry bias was found by a later review pass,
  not by the session that created it. S3-023's dropped blind coding removes the one control
  that would have made these self-reads independent. And S2-001 is the same autonomy with the
  safety off — what lets a subagent audit the plan is what let one *replace* it; S2-012's
  operator constitution grants audit authority narrowly and deliberately.
- gaps: **no atom records a case where the AI's audit of the plan was wrong and the human
  overruled it.** Either it never happened or it was not written down, and that asymmetry
  bounds how strongly #4 can claim this. An external audit of one overnight run against its
  156 raw call files would convert "the AI confessed" into "the AI confessed everything there
  was"; that audit does not exist.
- oral-only: OH-3 §1 describes the human *soliciting* rebuttal; the atoms show rebuttal
  arriving unsolicited, in documents. Related, not the same claim — do not merge.
- fit: #4 · #2 video beat (the machine writing down the number that would have let it cheat)

### T-19 — Claims fenced to what was tested, and the external wording version-controlled against the evidence ledger
- thesis: After a green result the recurring move is to *narrow* the claim in writing, put
  the residual risk in the artifact's most visible place, and — uniquely — fix what the team
  is allowed to *say* publicly at what the evidence tier supports, with forbidden phrasings
  enumerated.
- lanes: 1, 3
- origin: emergent
- carried-by: S3, S4, S5, S6, S9a
- support: S3-052 (with blind coding and player-visible checks skipped by meeting decision,
  the sanctioned external wording is fixed at "현재 가장 강한 실측 근거를 가진 기본 메커니즘"
  and "C-BLOCK 전체가 검증됐다" is **forbidden** — "Marketing language for a competition entry
  is being version-controlled against the evidence ledger"), S3-047 ("제품 방향 결정 · 증거는
  provisional"), S3-039 (every section lists what the result licenses and what it does not —
  "a report that repeatedly refuses to conclude"), S3-028, S3-051, S3-048 ("program pause, not
  universal failure verdict", with pre-specified reopen criteria); S6-038 ("주의: C-BLOCK은
  채택됐지만 검증 완료가 아니다" — the cap written where every future session reads it), S6-165
  ("3/3 is consistent with a true rate as low as ~37%"; verdict cards must show raw sequences
  "and it does not hide N=3 behind a percentage"), S6-107 (six timeline lines labelled "**not
  a measured value**"); S4-037 (the verified claim limited to "the exact allowlisted
  calculator MCP card and reviewed `arena-tactics` Skill fixture" — "Do not generalize it"),
  S4-074 ("The effective spend ceiling today is therefore the 1 rps / burst 2 stage throttle
  plus a manual redeploy at `0`, not a reserved concurrency guardrail"), S4-073; S5-028 ("The
  verified capability claim is **narrow**"), S5-025 (what the guardrails do *not* achieve,
  listed after what they do), S5-041, S5-040, S5-017; S9a-082 (a forbidden-phrases list),
  S9a-075/076 (docs corrected to name the residual risk rather than overstate the membrane),
  S9a-074 ("the repo documents a decision procedure that never ran"), S9a-073.
- counter-evidence: **S4-015** shows the same team using membrane compliance as *judging
  evidence* in the same period the S4-073 leak existed — an outward claim the inward record
  qualifies. "Written down" is not "fixed": S4-074's guardrail was still unset at snapshot.
  No atom shows a narrowed claim being *re-widened* after further testing, so the discipline's
  payoff is unevidenced, and no atom shows S3-052's cap being tested against actual
  outward-facing text — it is a policy with no observed enforcement event.
- gaps: whether S3-052's owed controls ever ran is entirely in the post-snapshot tail. If they
  did, the sanctioned wording changes; if they did not, **#4 must use S3-052's exact
  phrasing**. This is the highest-value single lookup in the map, and it is self-referential:
  deliverable #4 is itself outward-facing text about C-BLOCK, so Phase 5 assembly is the first
  real test of the rule and should be told so.
- oral-only: none — and notably, neither narrator mentions this discipline, which is one of
  the more distinctive practices in the corpus.
- fit: #4 (claims discipline) · #5 · governs wording in #2

---

# C. The harness and the orchestration

### T-20 — The dashboard PR as the run's single control surface, and how human steering changed channel
- thesis: super-pipeline runs are governed through one artifact — a living dashboard PR that
  is simultaneously backlog, build status, steer inbox, evidence locker and merge gate — and
  the human's direction of a live run migrated from a slash-command tag into dated, signed
  constraint blocks inside that artifact. The steering interface is itself structured; it is
  never free-form conversation with the swarm.
- lanes: 2
- origin: emergent (structurally echoes seed 1 — the operator addresses the machine through
  slots too)
- carried-by: S9b, S8, S6, S5
- support: S9b-001 (the convention stated in run 1, "do not merge to `main` — the human
  merges"), S9b-002 (two advertised steering channels), S9b-011 (**the sole literal `[STEER]`
  comment in the entire corpus**: process output English, in-game Korean, enumerated file by
  file), S9b-040 (#110's "게이트에서 확정된 구속 사항 (08-03, 민서)" — four binding
  constraints, one overriding the PRD as stale), S9b-041 (the human draws a stop-line at
  `segment.ts`: 7 units in, 8 behind the line, "구현·스텁·목 금지"), S9b-044, S9b-012 (the
  human ratifies an in-run scope expansion when the PRD's premise turns out false), S9b-039
  (with nothing renderable, the Lead posts 24 lines of composed Korean prose *as* the review
  surface), S9b-W001 / S9b-W004; S8-014 (the dashboard-PR-seed convention introduced on the
  first run, `run-20260724-145432`), S8-018 (the DISCOVERY-doc convention — a run reporting
  its own gaps in three lenses); S6-151 (panel composition and model tiers tuned per PRD;
  wave gating off with polling cost quantified); S5-003, S5-004.
- counter-evidence: the control surface **cannot express its own verdicts** — S9b-028: `gh`
  refuses `--request-changes` because the panel shares the author's account, so CHANGES
  REQUESTED arrives as an ordinary comment. S9b-045: approval is not a seal; two commits
  landed after sign-off. S9b-005: a run kept posting to a PR that was CLOSED and finalization
  needed `gh pr reopen`. S9b-003: the surface can never carry a live link, because Pages
  builds only from `main`. S9b-023 shows the final main-merge PR is a thin re-attestation, so
  the run's control surface is not `main`'s control surface. And S9b-002's advertised
  free-text comment steering cuts against "structured only".
- gaps: the corpus cannot show what the human *declined* to steer, or how often
  `/super-steer` ran without leaving a tagged artifact — the tag audit only proves the tag is
  absent. Whether #110/#116 finalized under this convention is post-snapshot.
- oral-only: none. OH-3 §3's "이 모든 과정이 git 저장소에 커밋과 PR, 코멘트로 남는다" is
  written-corroborated by this entire cluster.
- fit: #4 (method) · #2 video beat (a dashboard body carrying a human's dated constraints)

### T-21 — A review institution invented under a platform constraint
- thesis: The multi-agent panel had to run on one GitHub account, which forbids formal
  approve/request-changes on your own PRs. Rather than abandon the ceremony the pipeline
  rebuilt it in prose — explicit verdict lines, a fixed `[수정보고]` / `[항변]` answer format,
  resolve authority reserved to the Lead, and thread-hygiene rules distinguishing
  administrative closure from resolution. The process integrity is entirely convention-borne.
- lanes: 2
- origin: emergent
- carried-by: S9a, S9b
- support: S9a-007 ("동일 gh 계정이라 formal approve 불가, 코멘트로 기록"; every verdict
  recorded as `verdict: CHANGES_REQUESTED (단일 gh 계정이라 …)`, recurring across #19–#41),
  S9a-010 (the protocol appears fully formed on the first run: "각 스레드에 [수정보고] 또는
  [항변]으로 답해 달라 … resolve 권한은 Lead에게만 있다"), S9a-054 ("이 스레드가 닫힌 것은
  이슈가 해결됐다는 뜻이 아니다"), S9a-039 (resolution gated on remote-SHA evidence, not on
  agreement in a comment), S9a-044 (a ruling on what does *not* count as an answer), S9a-092
  (the convention persisting as a body liturgy after review activity stops); S9b-028, S6-187
  (the same mechanical seam noted from the harness's own draft: GitHub refuses `--approve`
  from the same account).
- counter-evidence: because verdicts live in prose rather than GitHub state, **none of it is
  machine-enforced** — S9a-092 shows the shape surviving with no enforcement behind it, and
  S9a-090 shows that no PR in the repo ran CI at all until 2026-08-03, so for most of this
  period the "gates" the protocol argued about ran only when someone remembered.
- gaps: the corpus cannot say whether the single-account constraint was a deliberate choice or
  an accident of a 2-person team; S9a-002's git-identity thread hints at its origin without
  settling it. The super-pipeline repo, where the convention would be templated, is off-corpus.
- oral-only: none. This is the *mechanism* behind OH-3 §3's transparency claim — the
  transparency was purchased by writing the verdicts out longhand because the platform would
  not record them.
- fit: #4 (method) · #5

### T-22 — Disagreement is the mechanism — and the panel's independence has visible seams
- thesis: The protocol is not reviewer-dictates-author. Authors answer with `[수정보고]` or
  `[항변]`; rebuttals win outright and partially; third options invented by the author beat
  both offered options; and the channel is what catches the *reviewer* hallucinating. Seats
  reach genuinely different dispositions on the same commit and the record treats that as the
  method working — while the same record shows the personas share one account and that
  unanimity, not divergence, is the modal outcome where it was counted.
- lanes: 2
- origin: emergent
- carried-by: S9a, S9b
- support: S9a-012 ("데이터 검증이 로더 책임이라 판단해 항변하셔도 됩니다 — 다만 … 권합니다"
  — the reviewer offering the rebuttal path while recommending its own fix), S9a-029 (the
  reviewer's non-preferred option wins; "항변 수용 — won't do"), S9a-040 (the reviewer's error
  caught from below), S9a-048 (proportionality rebuttal partially accepted), S9a-060 (a
  rebuttal built on *pre-registered* evidence prevails, while the Lead corrects the rebuttal's
  own overreach and withdraws its own phrasing), S9a-062 (the author rejects both offered
  options with a cost analysis and a third path wins), S9a-019, S9a-077, S9a-091; S9b-038 (on
  one commit: R3 "No blocking findings remain in my lens. Approving", R1 "CHANGES REQUESTED"
  on two threads, R2 resolving recorded-not-fixed — "the disagreement is the mechanism
  working, not failing"), S9b-055 (R1 and R3 independently find the same portrait collision),
  S9b-W005 (one review registers a blocking defect and a favourable design assessment on the
  same seam), S9b-035, S9b-037, S9b-043, S9b-022, S9b-144 (a human reviewer *withdraws an
  approval* when the PR changes from docs-only to executable code); S6-187 (205 inline comments
  on eight unit PRs with round-1 `changes_requested` across the board; on the final PR R1
  re-proved a flakiness fix on its own clean worktree with 4 consecutive greens "plus a reverse
  mutant", R3 re-measured its own build frame-by-frame at 313/313 — "my own tree, my own
  mutants, not your report").
- counter-evidence: **S9b-W014 directly complicates the thesis** — on #68 the full R1·R2·R3
  panel opened thirteen threads and *all thirteen resolved by agreement, no rebuttals*.
  Unanimity is the modal outcome in the one PR where the body counts it. **S9b-028** undercuts
  the independence premise mechanically. **S9a-010**'s authority is deliberately asymmetric
  (resolve reserved to the Lead), so the argument has a fixed winner-of-last-resort, and
  **S9a-007** means "won" and "lost" are only as real as the prose recording them. S9b-036 /
  S9b-063 show seats also agreeing *not* to fix things.
- gaps: **no verdict distribution exists.** The S9b win-sweep explicitly sampled only the two
  strongest verdicts per PR out of 46/48/60 review submissions, and no atom gives the rebuttal
  *rate* (`[항변]` vs `[수정보고]`). A verdict census is the cheap sweep that would settle
  whether S9b-038's three-way split or S9b-W014's thirteen-thread unanimity is typical — **and
  that single number changes what #4 can claim about panel independence.** S9b-038 is itself a
  *round-2* snapshot; if R1's CHANGES REQUESTED resolved to approval after the snapshot, the
  atom reads as an intermediate state and the claim needs restating.
- oral-only: OH-3 §3's "에이전트 4개가 리뷰를 남기고" — the R1/R2/R3 + Lead shape is
  written-corroborated (S9b-038, S9b-W014, S6-187); the count needs no oral support.
- fit: #4 (why a panel, not a checker) · #5

### T-23 — Loop-until-green has four terminal states, and three of them are not "fixed"
- thesis: The loop does not only terminate in a fix. Threads close as **fixed**, as
  **recorded-not-fixed**, as a **residual accepted on an explicit expiry condition**, or as a
  **reversal that reopens a round** — and naming the terminal state is treated as the
  deliverable, not the code change.
- lanes: 2
- origin: emergent
- carried-by: S9b (THIN — single slice; S9a is the expected sibling and its `[항변]` outcomes
  in T-22 are the nearest corroboration)
- support: S9b-034 (three rounds ending in a one-line deferral note in `discovery/e2.md`:
  "**I am not asking for the feature.** … What it cannot stay is the current state"; "that is
  the shape a defect hides in for six months"), S9b-036 (an empty-report residual accepted
  only because `PROVIDERS` is `{fixture}` — "the day `--provider live` exists, this stops
  being a residual and becomes silent data loss on exactly the runs worth studying"),
  S9b-063 (a labelled residual accepted because the honest fix needs a frozen-schema revision,
  and only after confirming the dangerous downstream chain was already severed), S9b-035
  (settled as a `discovery/` note because both files were frozen globs), S9b-030 (the recorder
  half held open a round because the first fix made the failure visible *and* destroyed the run
  artifact), S9b-021 → S9b-022 (a "believed-fixed" claim overturned in round 3), S9b-037,
  S9b-W003.
- counter-evidence: **S9b-045 shows a fifth, unbudgeted state** — work landing *after* the loop
  declared itself done. S9b-025 records a fix as sound while noting the archive still carries
  `[속내]` for a future unit to re-filter, i.e. "fixed" and "deferred" co-occur in one thread.
  And the taxonomy's proportions rest on threads captured mid-flight.
- gaps: nothing counts how many deferrals were later honoured, and whether the `discovery/`
  notes were ever read by a subsequent run is unanswerable — S9a-007's board records live in
  the gitignored harness state. **Highest-risk theme for the post-snapshot tail**: S9b-030,
  034, 035, 036, 037 and 063 are rounds-1-to-3 records; a round 4 moves the proportions.
- oral-only: none.
- fit: #4 (what loop-until-green actually costs)

### T-24 — The integration pass catches a defect class per-unit review structurally cannot
- thesis: Green unit gates can each be locally correct and jointly wrong. Every integration
  run found seams no single unit owned — duplicated declarations, constants hand-copied into
  private fixtures, a bundle that ships what a per-file guard proved absent — and this is the
  specific value the final panel adds over unit review.
- lanes: 2
- origin: emergent
- carried-by: S9b, S6
- support: S9b-006 / S9b-W008 (#33: two units each shipped a portrait validator; an NFR gate
  counted a prose comment as a second `@media` guard; a `tier-variants.json` gap made two
  patience tiers byte-identical), S9b-015 (three run-outcome thresholds inline in `src/`
  hand-copied into seven test files — a one-token drift flips clear→defeat with 1264 unit
  tests green), S9b-026 (both integration rigs built a 223-line duplicate
  `createScriptedEngine`; 219 tests asserted against the copy), S9b-035 + S9b-065 (a second
  `Species` union and a third id-grammar declaration — "three separate declarations flagged in
  this one PR"), S9b-179, S9b-W001 (five previously-empty modules bound "for real" in one run);
  S6-189 (the integrator found what no per-unit gate could see: two files default-import a
  table a named import was supposed to keep out of the client bundle, so **the real bundle
  ships the answer key while the guard test stays green because it bundles one file alone**).
- counter-evidence: much of what the final panel actually files is **not** cross-unit —
  S9b-019 (a mis-sliced 9-slice frame), S9b-056 (a NaN cost), S9b-062 (a no-op flag write) are
  ordinary in-unit defects that unit review simply missed, so "integration catches integration
  bugs" over-tidies the record. S9b-023 shows the main-merge PR running only the
  machine-checkable half.
- gaps: no atom quantifies what share of panel findings are cross-unit vs missed-in-unit; a
  counting sweep across S9a+S9b would answer it. S9a's own coverage note says the integration
  PRs belong to S9b, so neither slice alone can compute it.
- oral-only: none.
- fit: #4 (method)

### T-25 — Parallel-agent failure modes shaped the architecture: seams before fan-out, frozen inputs, visible debt
- thesis: One named failure mode — "parallel agents each invent a different signature for an
  unspecified seam" — is the stated cause of a whole class of repo architecture, and the
  agents' confinement by `file_globs` collides so reliably with a single-entry SPA and with
  repo-wide rules that the pipeline invented a third answer: convert the conflict into a
  machine-checkable marker or a named follow-up. Debt made visible rather than silent.
- lanes: 2
- origin: emergent
- carried-by: S6, S9a, S5, S9b
- support: S6-029 (the TBD audit's single criterion: "any interface two work units cross must
  be specified before the fan-out, or parallel agents each invent a different signature" —
  explicitly "a failure mode humans negotiate around and agents don't"), S6-136 (a contract
  written because "with both modules stubs, two implementers would each invent one"; the
  round-event assembler "appears exactly once in the repo, in a diagram, with no owner" and is
  given one), S6-089 (a binding schedule of deliberately unbound parameters — "none may be
  bound implicitly by whoever touches it first"), S6-149 (after e0 merges no unit may change an
  exported signature; a wrong one goes through DISCOVERY + `[STEER]`, "never a unilateral edit,
  because five units are compiling against it at that moment"), S6-150 (frozen globs with
  reasons: "a unit that 'fixes' a renderer breaks the probe silently"), S6-153 ("an agent that
  cannot find a file will create one, so the file must exist before the agent does"), S6-148
  ("a property no test asserts is a property the harness's loop-until-green cannot defend"),
  S6-110, S6-102, S6-065 (the failure mode was **not** hypothetical: the injection unit "almost
  shrank to fact sentences" before any spec existed); S5-006 (frozen-inputs guard protects "the
  one thing agents can't test"), S5-014 (a new `reference_globs` class created because the
  frozen wording "extend via new files" **reads to an agent as *don't copy from this*, the
  opposite of the porting rule**, plus an embedded precedence rule so the agent cannot deadlock
  between two absolutes), S5-020 (per-unit `discovery/<unit-id>.md` because one shared
  append-file across eleven serially-merged worktrees would be conflict-resolved by a mechanical
  merge agent at nearly every barrier); S9a-014 (u5 edits u1-owned `src/main.ts`; the Lead
  demands an enforceable `TODO(u3/u4)` teardown marker plus an explicit hand-off sign-off),
  S9a-046 (`DEADLINE_MS = 25_000` violates balance-as-data but `data/**` is outside u5's globs
  → a TODO citing the rule verbatim plus a board item naming which units wire it), S9a-045 (a
  real resource defect — up to 155 s of orphan image requests per missed deadline, stacking
  quota across a judge session — that unit scoping forbade fixing, converted into an explicit
  `cancel()` limitation with the numbers), S9a-051, S9a-033, S9a-060, S9a-021, S9a-069 (the
  *next* run's first unit builds a screen-mount registry specifically to eliminate shared-
  `main.ts` editing, citing the apothecary DISCOVERY finding by name — "file_globs don't model
  a single-entry SPA"), S9a-093; S9b-182 (frozen globs incl. `proxy/**` and `package.json`),
  S9b-179.
- counter-evidence: **S6-139 carves out the hard limit** — some things a work unit *must not*
  decide, because inventing the temperament prose template "would be inventing game content";
  seam-specification fails where the missing thing is authored content, not a signature.
  S9a-014's marker and S9a-046's TODO are only as good as the integrator reading them, and no
  slice can show whether they were honoured. **S9a-093 shows units still discovering the same
  worktree-sync gap on 2026-08-03**, i.e. the harness-side cause was never fixed, only routed
  around. S6-147/149/153 are **plans, not outcomes** at snapshot — no S6 atom reports the
  engine or client build actually running.
- gaps: whether "visible debt" items were closed lives in the board records inside the
  gitignored `.claude/super/` (hard rule 4) — structurally outside the corpus. The whole
  outcome side of S6's PRD atoms is in the post-snapshot tail.
- oral-only: OH-3 §3's "명세는 기능 단위로 10~20개의 세부 작업으로 쪼갰다" is corroborated by
  S6-147 (eleven units, five waves) and S9b-181; the operator's "유능한 '개발팀'을 고용한 것"
  experience remains oral.
- fit: #4 (parallelism costs) · #5

### T-26 — The PR layer is where the orchestrator's own failures surface — and the harness's failure rate is unmineable
- thesis: An under-narrated function of the review layer is debugging the *orchestrator*, not
  the code: resume churn duplicating merged units, a branch-name fork silently reverting
  verified fixes, a Lead pass dying on a spend limit, worktrees missing their specs, a CI gate
  wired to nothing. The PR is the only surface where these become visible — and because
  harness state is gitignored, it is the only surface at all.
- lanes: 2 (the atoms themselves propose `proposed:harness-ops`)
- origin: emergent
- carried-by: S9a, S6, S8, S9b
- support: S9a-038 (the sharpest: the author truthfully reports commit d806826 but
  `git merge-base --is-ancestor` says NO; reflog forensics finds the unit branch existing under
  both slash `super/.../u2` and dash `super/...-u2` names, a new session re-implementing from
  base and force-pushing over the dash ref — "저자의 실수가 아니라 브랜치 이름이 slash와 dash
  둘로 갈라진 것이 원인이다"), S9a-022 (resume cache misses re-run merged units and open
  duplicates #30/#43/#44/#45; closed unmerged because squash-merge history means merging a
  stale duplicate could read as *deleting* other units' files), S9a-023 (close-and-salvage —
  "a duplicate PR is not duplicate work"), S9a-070, S9a-071, S9a-093, S9a-090 / S9a-W008,
  S9a-003, S9a-081, S9a-088, S9a-083; S6-186 (the resume bug written up end-to-end: interrupted
  twice, resuming a stopped run missed the cache, re-ran merged units and opened duplicate PRs;
  "a duplicate PR deletes its sibling units' files on merge"; three duplicates closed, one real
  casualty restored by PR #47, **the bug fixed in the harness with a Reconcile step and the fix
  exercised on restart at 0 duplicate PRs** — "the failures were operational … not the model
  losing the plot"), S6-188 (six substantive reviews exist only in local run state while GraphQL
  shows zero PR threads); S8-015 (u3 landed as PR #20 *and* #23, u2 as #19 and #24), S8-024
  ("an independent reimplementation of u2 that landed on the dash-named remote ref without the
  prior round's fixes"; "restore u4 final content dropped by stale-branch force-push (#47)" —
  "The '(v2)' label marks a redo of the redo"), S8-016 (a resumed unit verified without
  re-manufacturing code, "YAGNI — no production code added", the empty-diff state recorded
  rather than papered over); S9b-004 (the account usage limit hit mid-run; the cross-session
  resume re-churned already-merged units; two units finished by hand), S9b-005, S9b-130 (#87
  merged into a dead branch and never reached `main`, repaired by cherry-pick).
- counter-evidence: some harness-shaped failures *were* fixed upstream rather than merely
  caught at the PR layer — S6-186's Reconcile step, S9a-069's next-run architecture. So the PR
  layer is the detector, not necessarily the terminus. Conversely S9a-038's slash/dash bug has
  no recorded fix: the atom ends at the warning "이 상태로 다시 푸시하면 같은 유실이 반복된다."
- gaps: **the orchestrator's failure rate is structurally unmineable** — `.claude/super/` is
  gitignored by hard rule 4, so only outputs are visible. This is the same class of blindness
  OH-4 identified for Doodle Life and is the second concrete instance of T-46. Only an off-repo
  artifact or an interview closes it.
- oral-only: OH-3 §3's "에이전트가 백그라운드에서 도는 동안 나는 잠을 자거나 문서 작업을 했다"
  is confirmed as the operator's experience and **complicated here** — the machine needed a
  supervisor for its own plumbing, and the supervisor was another agent. S9b-004, S9b-040,
  S9b-041, S9b-042 and S9b-044 further complicate the sleeping: a busy operator making dated
  rulings, taking manual measurements and hand-finishing units mid-run.
- fit: #4 (limits of the harness) · #5

### T-27 — The review panel's activity decayed to zero while its conventions persisted
- thesis: The adversarial multi-round review that defines the early runs is not what the later
  runs look like. By super/20260803–20260804, unit PRs merge with zero comments and zero review
  submissions while still filing confession-style bodies. Whether that is maturity or attrition
  is not answerable from the corpus — and it is the claim most exposed to the snapshot cut.
- lanes: 2
- origin: emergent
- carried-by: **S9a only — THIN**
- support: S9a-092 ("By the later runs … review volume drops to zero while the confession-style
  body persists — the protocol's honesty conventions outlived the enforcement that created
  them"; sampled from #58/#70/#111/#124/#133 standing in for 46 skipped PRs), S9a-093 (with no
  reviewer commenting, the PR body becomes the discovery ledger), S9a-W009 (PR #134 merged with
  zero comments and zero review submissions; 878 tests / 0 failed reported by the body itself),
  S9a-W010 (PR #132 merged with no review round), S9a-W015 (an earlier one-pass approval — the
  trend has precedent), S9a-090 / S9a-W008 (CI arrives 2026-08-03, i.e. automation replaces some
  of what the panel did, at exactly the time review activity vanishes).
- counter-evidence: **the snapshot cut is a direct threat to this theme, and S9b refutes half
  of it.** #110 and #116 — the two largest integration PRs, in S9b's territory — carry 46/48/60
  review submissions in the same window, so review did not stop; it moved off the unit PRs, and
  S9a-089/090/091 show heavy human review activity on 2026-08-03. The 46 zero-activity PRs also
  had their *bodies unread*, so "zero review" is measured from an inventory, not from reading.
- gaps: a sweep of the 46 skipped bodies plus the post-snapshot PRs would settle direction;
  board and spend records would settle motive. Neither is in the corpus. **If the tail carries
  heavy review, this theme inverts.**
- oral-only: none — but note the tension with OH-3 §3, which narrates the 4-agent review loop as
  *the* implementation method without mentioning that it thinned out.
- fit: #4 (honest limits) · #5

### T-28 — The specification is the orchestration instrument, and its primary reader is an agent
- thesis: The humans' main lever on a multi-agent build is not steering during the run but what
  they freeze before it. Decisions are pre-closed so agents stop inventing, acceptance criteria
  are made runnable, and — decisively — the dependency graph is restructured so the harness's
  parallelism actually engages. Language, tiering and document form are all chosen for an agent
  readership; ambiguity is treated as a defect class in human→AI communication.
- lanes: 2, 3
- origin: emergent
- carried-by: S4, S5, S6, S8, S9a, S9b
- support: **S9b-181** (the sharpest atom in the corpus on this: rev 1's graph was "eight
  near-serial waves with a maximum parallelism of two, so super-pipeline would have run it as a
  chain of eleven units behind eight review barriers — roughly 24h wall clock, with the
  harness's fan-out never engaging"; rev 2 adds an e0 skeleton unit of unimplemented-throwing
  types so six units build concurrently, ~12–16h), S9b-182 ("13 decisions tabled as closed so
  parallel agents stop inventing signatures, and 4 tabled as open with instructions not to
  resolve them"; "prose criteria do not gate anything"), S9b-172, S9b-102, S9b-159 ("합의는
  논의가 아니라 문서로 — 소유자의 명세가 곧 커뮤니케이션"), S9b-175, S9b-133 (the GDD structured
  after researched industry conventions, each principle cited), S9b-109, S9b-116, S9b-104;
  S4-054 ("Agents cannot ask you questions mid-run. Every ambiguity in the PRD becomes either an
  agent's improvisation or a stall." / "An invariant not written down does not exist."), S4-055
  ("an executable PRD ships no open ❔"), S4-046 ("A PRD that reads like the 기획서 will make the
  decomposer generate a week of work"), S4-039, S4-049 (a FROZEN throwaway interface contract
  between two concurrent AI sessions, background deliberately excluded), S4-047 ("with reasons —
  don't relitigate"), S4-056; S6-147 (Rev 2 rewrote the wave graph for fan-out — "The dependency
  chain in the module graph is real. The chain in the **build** is not, and Rev 1 conflated
  them"), S6-011 (CLAUDE.md permanent vs status.md freely-mutable, explicitly an
  information-architecture decision *for agents*), S6-034 ("docs/ is written in English: its
  primary readers are agents", with a carve-out keeping scenario content Korean), S6-049 ("A
  filename prefix is a claim about the document's **authority**, not its topic"), S6-050,
  S6-051, S6-143 ("Agreement works by document, not discussion"), S6-183, S6-073, S6-012;
  S8-050 (the corpus's largest single deletion is a translation — 870 insertions / 812 deletions
  — on the ground "The primary readers of docs/ are agents"), S8-027 (Korean prose in an English
  PRD "broke the document's register … the harness decomposer and review panel read it as
  spec"), S8-005, S8-043 / S8-W010 (architecture spec v1 "클린 컴파일 — 규범 서술만, 죽은 메커니즘
  본문 언급 0회" so agents "build against nothing retired"), S8-053 (**the document described a
  layout the repo did not have — and the *repo* was moved to match the spec**), S8-033; S9a-066
  (a PRD self-reviewed as a reachability graph, with an omission written down defensively: "안
  적으면 u7 에이전트가 자기 판단으로 모달을 만들고, 리뷰 패널은 브리프 §8-1 누락으로 반려한다"),
  S9a-067, S9a-084 (a PR body triaging its own diff: ~300 lines to read closely, ~15,000 lines
  marked "읽지 마세요"), S9a-088, S9a-087 (the *doc*, not the code, as the merge blocker).
- counter-evidence: **pre-freezing fails when the spec is wrong about reality** — S9b-012 (the
  PRD assumed a vendor path existed; it did not), S9b-040 (a PRD line overridden as stale at the
  approval gate), S9b-162 (three facts discovered only by construction, "아무도 밟지 않았을
  뿐"), S9b-016 (a PRD reachability claim contradicted by the shipped data), S9b-041 (the
  schedule bending around a file one human had not written yet). S4-057 shows agents still
  "burning loops" on flaky triggers despite the rules. **S9a-093** is the sharpest: units built
  against `tests.md` because `spec.md`/`design.md` were *absent from the worktree* — the
  agent-reader pipeline failed to deliver the documents it designed for. And S9a-005 shows a
  document that correctly identified the decision it violated and shipped anyway.
- gaps: **none of these rules is measured.** No atom compares run outcomes before/after the PRD
  guide; S8-050's translation benefit is asserted, never measured (S8-027's decomposer case is
  the single instance); S9a-067 is a suggestion, not an experiment. Whether S9b-181's ~12–16 h
  estimate was met is post-snapshot.
- oral-only: OH-3 §1's "무엇이 잘 쓴 기획서이고 잘 쓴 스펙인지를 먼저 조사하게 했다 — 현업에서
  통용되는 양식을 근거로 가져오게 한 뒤, 그 위에서 쓰게 했다" — **four agents checked for this
  independently and only one found it**: S9b-133 (Codecks/GitBook/Librande cited) closes the
  hook; A1, A5, A6 and A7 all report **no trace** in S1/S6/S7/S8/S9a. Treat it as corroborated
  once, in one document, not as a general practice.
- fit: #4 (how you orchestrate agents) · #5

### T-29 — Writing the spec found the bugs; the spec set also drifted against itself
- thesis: A concrete payoff of the spec-first cadence is that binding documents surfaced
  contradictions, orphaned components and taxonomy gaps *before* any code hit them. The same
  cadence produced the inverse defect class — two SSOTs diverging on `main` with no merge
  conflict to flag it — for which the corpus has no mechanical detector.
- lanes: 2, 3
- origin: emergent
- carried-by: S6, S9b, S4
- support: found-by-writing — S6-093 and S6-036 (the datapack must ship to the browser and must
  live at `data/`, which Vite cannot serve: "a contradiction found by writing the spec, not by
  hitting the bug"; "Nobody has hit this because no datapack exists yet"), S6-094 (physical spec
  said `localStorage`, game design said "no persistence" — both owned by the same person, who
  resolved it and wrote down why the ownership made it his to close), S6-102, S6-141
  (`AGENT_UTTERANCE` found missing from a neighbouring supplier table — present in the template,
  the code and the diagram — recorded as a request, resolved 08-03), S6-125 (a `>= 1` roster
  rule found to make 7 of 우는다리's 19 beats unrunnable, caught by checking the rule against
  real authored data), S6-179, S6-138, S6-169 ("visibility currently has no instrument", with a
  ~3-call probe scheduled *before* the variable list binds), S6-178. Drift — S9b-145 ("기획서는
  좁힌 게 아니라 넓혔습니다" — 7 player-editable regions vs 2, in two files, "the most dangerous
  kind"), S9b-157 ("규칙과 스키마가 한 문서 안에서 반대 방향을 봅니다"), S9b-178, S9b-046
  (engine spec §5 vs call-contract §11 on 504 retryability — surfaced only when the first proxy
  deploy produced real latencies), S9b-173, S9b-035, S9b-065, S9b-056, S9b-016; S6-013 (README
  contradicting itself at snapshot: "the game is still unnamed" two lines above "Status: DDAY
  concept confirmed"), S6-051, S6-012 (AGENTS.md reduced to a pointer *after* a full copy
  drifted); S4-027 (three written sources disagreeing on C-STRUCT's status, caught and scheduled
  for a unification pass).
- counter-evidence: the project's answers work when applied — S9b-171 (a generated
  transcription cannot disagree with its source), S9b-164 (compiler-enforced), S9b-177 (golden
  test), S6-142 — so this is a solved problem class where the solution was applied unevenly, not
  an unsolved one. S9b-163 shows a cheap human protocol (absorb rather than throw back) keeping
  the divergence count down. Against the found-by-writing half: **S6-093's plugin stayed missing
  for days after being specified** — writing found the problem without fixing it — and S6-065
  shows a drift the documents did *not* catch in time.
- gaps: no counterfactual — the corpus cannot say what these contradictions would have cost if
  found at runtime, only that they were found earlier. No atom counts how many doc-pairs were
  ever checked; there is no lint for prose contradictions and no slice proposes one.
- oral-only: OH-3 §1's "앞선 데모 3개의 실패 경험이 있었기 때문에 … 기획 단계에 시간을 더 쓰는
  쪽을 택했다" is the causal story behind this cadence and has **no written trace** — S4-028
  records the spec-first decree, never its stated cause.
- fit: #4 (documentation as infrastructure) · #3

### T-30 — The harness was extended, never forked, for the qualities its gates cannot reach
- thesis: The team modified its own general-purpose multi-agent harness for game work under a
  self-imposed open-closed constraint, and the modification list is a catalogue of what
  loop-until-green cannot see: feel, pixels, provided-input integrity, discovery knowledge.
- lanes: 2
- origin: emergent
- carried-by: S5, S4, S9b, S8
- support: S5-001 ("super-pipeline optimizes for *correctness* … Games additionally need *fun
  and feel*, which automated gates cannot measure" — the stated reason for modifying at all),
  S5-002 ("every modification here lands **inside the super-pipeline repo** as a pure OCP
  extension (never touch `/pipeline`, `/goal`)"), S5-003, S5-004 (the final-PR template reshaped
  by deliverables #1/#2/#3), S5-005 (a Game-feel/Juice review lens made to *compete for panel
  seats*, bounded by an evidence bar), S5-006, S5-020, S5-016 / S5-W008 (`page.clock.install()`
  virtual-clock capture, because "a load-time screenshot would miss the red thread entirely, the
  one element u8 exists to port"), S5-W005 ("implemented & archived (2026-07-29). All five mods
  … are live … verified against source"); S4-051 / S4-W012 (`demo_publish` "implemented as a
  pure extension… No existing stage was modified", validated on a throwaway fixture), S4-050 (the
  tweak timeboxed at ≤1 h with the failure path pre-decided), S4-047 (the game-mod P0 deferred
  because implementing harness features *and* running the first game project through a freshly
  modified harness "stacks two unknowns"), S4-059 (`DISCOVERY.md` as a first-class deliverable of
  every run); S9b-105; S8-052 (the harness extended with a design-fidelity capture lens to build
  the view layer).
- counter-evidence: **S5-012 / S5-W006** — the first frontend-mod attempt was "fidelity
  *governance* … with no rendered pixel ever in front of an agent that could act on it", i.e. an
  extension program that added rules without adding capability, and had to be fully reversed.
  **S5-019** — the harness's own automatic lens-seating rules defeat the fidelity mod unless a
  human pins it, so the extension does not compose with the machine it extends. **S4-053** — the
  demo_publish diff sat uncommitted and "the installed `~/.claude/` copy is what the run actually
  uses", so "verified against source" carries a provenance caveat at least once.
- gaps: whether the five game mods and the frontend mods worked in the DDAY production run is
  entirely post-snapshot. The super-pipeline repo is private and out of corpus (S4-016), so
  **this theme is built from specifications, not from execution traces.**
- oral-only: OH-3 §3 corroborates the operator's experience of the harness from outside.
- fit: #4 (orchestration design) · #5

### T-31 — Repo and competition rules operated as blocking review criteria, applied against the agent's own convenience
- thesis: CLAUDE.md's hard rules and the competition's constraints are not background policy;
  they are blocking review findings reaching down into a delimiter choice, an import style, a
  directory name, a commit's byte weight and an IAM grant — and agents applied them against
  their own convenience without being asked.
- lanes: 2, 3, 4
- origin: emergent
- carried-by: **S9a only — THIN** (S6 holds the rules; S9a holds them being *enforced*)
- support: S9a-013 (literal 0x00 bytes as key delimiters made the most logic-dense file
  git-binary; blocked because "readable code review + history is a competition deliverable"),
  S9a-064 (15 MB of raw API PNGs blocked because main's history cannot be rewritten; evidence
  moved to PR-comment attachments), S9a-046, S9a-079 ("`demos/`에는 git page로 배포된, playable
  game만 두려고 합니다" — an otherwise-approved PR bounced on location), S9a-025 (approval
  documents that all 11 assets carry full prompt/tool/license entries per rule 5), S9a-068,
  S9a-065 (a `--reprocess` flag that would have attributed new prompts to old images — rule 5's
  manifest nearly falsified by bookkeeping), S9a-002 (the agent surfaces its own git-identity
  ambiguity against rule 1's literal wording rather than hiding it), **S9a-072** (the cheap fix
  was one `iam:PutRolePolicy` grant; the agent refused — "한 번 하는 작업의 편의를 위해 상시
  권한 상승 경로를 여는 건 손해라고 판단했습니다" — and wrote the parity trap into a test),
  S9a-001, S9a-088.
- counter-evidence: rule-application is not stable — S9a-003 reverses the principled cut of
  S9a-001 nine minutes later, by the same author; S9a-005 documents the team decision it was
  violating and proceeds anyway; S9a-075 finds a repo rule *overstated in the docs* rather than
  over-enforced, so rule-citation sometimes ran ahead of rule-compliance.
- gaps: nothing in S9a says whether these rules were in CLAUDE.md *because* of earlier review
  fights or vice versa — S6 holds that ordering and no S6 atom reports the check.
- oral-only: none.
- fit: #4 · #3

---

# D. The measurement program

### T-32 — Pre-registration held against the team's own wishes — and the amendments that ran the other way
- thesis: Hypotheses were written as falsifiable kill shots with their design consequence fixed
  in advance, and the program repeatedly refused results it wanted because a condition written
  before the data said to — including under unattended agent operation. The corpus also
  contains, on the record, the amendments that went the direction the program wanted.
- lanes: 1 (with 2 where the enforcing party is the unattended agent)
- origin: emergent
- carried-by: S2, S3, S6, S8, S9b
- support: S3-011 (J3 at 70% rejected as a site — "overriding that after seeing the number is
  the rationalization §9.1 exists to prevent"), S3-024 (P1a replicates S1 at 9/10 with a clean
  0/10 placebo, the arm-comparability stop fires on a 16.7-point discard divergence, and the
  entry writes "The mechanism is NOT credited here. What follows is the evidence, not a
  verdict"), S3-032 (E-LEV's pre-registered drop fires at 0/10 and the pre-registered
  consequence is applied as written), S3-021, S3-049 (an already-queued 8th run executes after
  the stop decision, supports it, and is *deliberately excluded* from the decision's stated
  sample), S3-010 (the hard stop fires at Phase 0 and the unattended agent halts an 8-phase
  program after 30 of ~400 calls), S3-003, S3-015 (A13 draws the p-hacking line: vary across
  probes, never within one, runner-enforced); S2-030 (V5's consequence pre-registered — "우선순위
  UI는 연출로 격하" if order doesn't rule — and it then passed 3/3), S2-018, S2-020; S6-167 (the
  suite JSON *is* the pre-registration sheet and the runner refuses to spend a call without a
  hypothesis, baseline, N, drop condition and a pinned model id — "the difference between a
  decision and a rationalization"), S6-119, S6-142; S8-034 / S8-W009 (pre-registered,
  placebo-controlled design fixed before the first measured call; "사람이 판정하는 사전등록 시트 ·
  버딕트 카드"); S9b-137 (placebo arm mandatory for mechanism credit), S9b-141.
- counter-evidence: **S3-017 is a direct counter-instance** — the drop condition fired on the
  program's best result (p=0.00006) and was *overridden*, corrected to name only the predicted
  stance; the entry knows how it looks ("'the drop condition was wrong' is exactly what
  rationalisation sounds like"). **S3-025** is the same pressure caught one step earlier: the
  agent proposed the rule change that would credit its own result and had to invent a
  separation-of-powers norm to avoid enacting it — the norm exists because the temptation was
  live. **S3-026** is a third amendment in the wanted direction. **S9b-150** records the human
  overriding a pre-registered drop condition and holding itself to a stricter test instead.
  A3 looked for a pre-registration quietly *dropped* rather than openly amended and found none —
  the amendments are all on the record with their self-serving numbers attached. Separately,
  pre-registration did not make the plans correct: S2-026 found a contradiction *inside* the
  pre-registered plan, and **S2-020 names the worst hole** — option-order (M4) was never checked,
  and the document itself says that if choice depends on option order "지금까지의 모든 결과에
  위치 편향이 섞여 있다."
- gaps: an append-only log cannot evidence its own completeness — only an independent read of
  the 35 suite JSONs' `_what` fields against the RUNLOG (3 mined) could check whether every
  configuration change was logged, and the 156 per-call files (1 mined) would show whether
  discarded calls match the reported tallies. **Whether M4 was ever run is the highest-value
  unanswered question in the measurement corpus** — it conditions T-32, T-33 and T-05 at once.
- oral-only: none. **No OH account describes pre-registration at all**; this discipline is
  written-only and neither narrator claims credit for it.
- fit: #4 (how AI output was verified) · #2 video beat ("the night the machine threw away its
  own best result")

### T-33 — Replication and placebo controls repeatedly demoted the program's own best results
- thesis: Every headline result checked by replication or by a placebo arm came back smaller, or
  came back for a different reason. The program's characteristic output is not "we found an
  effect" but "we found an effect and then found out what it actually was."
- lanes: 1
- origin: emergent
- carried-by: S3, S6, S9b (S3-carried)
- support: S3-006 (RB1: E0's clean 3/3 separation is small-sample luck — the baseline mode was
  already `d` at 56%; "creates a new stance" collapses to "saturates an existing lean",
  p≈0.033), S3-034 (P6: C-STRUCT's "Verified (initial) 3/3" does not survive its first
  placebo-controlled probe — predicted stance 0/10), S3-035 (P7b: E-PATH moves 대조 1/10→8/10 at
  p=0.0027 and its corridor-sounds *placebo* moves 6/10 — the frame detaches from its referent),
  S3-031 (P4: emotion-description and NPC-quote placebos flip 7/10 and 9/10 — the mechanism
  "works" for the wrong reason and is refused credit), S3-007, S3-003; S6-156 (the placebo law:
  "Without a placebo, a result is a correlation, not a boundary law", plus a differential
  diagnostic for a flipped placebo), S6-124 (`constraint_echo` dropped as "a design judgment, not
  the conclusion of a comparison"; its 0/5-vs-0/5 A/B "supports neither keeping nor deleting the
  field", with a reintroduction condition pre-registered); S9b-139 (isolation 3/3 → full-run 5/5
  failure, so Tier A alone is discounted).
- counter-evidence: **the demotions are not universal and this slice under-reports the
  survivals.** S3-027 is the cleanest counter — the lexical-chain alternative that threatened the
  flagship was killed by a controlled experiment (every label renamed, effect intact, 교감 0/14 →
  16/20 at p=2.2×10⁻⁶). S3-028: the fake block sited at the pipeline's strongest positive came
  back live = baseline (p=0.76) — the control *passed*. S3-036 cleared its pre-declared power bar
  with a clean placebo and 10/10 citation. **S3-016 is the reverse shape entirely** — replication
  *promoted* a result by showing the mechanism had worked all along and the instrument had hidden
  it. Per the coverage audit S3 never got its WIN promotion pass, so the demotion:survival ratio
  here is inflated by mining bias, not measured.
- gaps: no atom gives the count of probes that replicated cleanly vs demoted; S3-039's "three
  credited patterns, one clean drop, C-STRUCT 0-for-4" is the closest thing to a denominator. A
  sweep of the 35 suite JSONs would produce the real ratio.
- oral-only: none.
- fit: #4 (verification method) · #2 video beat

### T-34 — Two independently designed programs converging is what licensed the decision
- thesis: The C-STRUCT channel was not killed by one program's null. It was killed when a
  human-run single-lever series and an unattended placebo-controlled overnight program — which
  never shared a probe — reached the same conclusion. Convergence, not significance, upgraded a
  pause into a removal, and the project treats replication as a decision standard elsewhere too.
- lanes: 1
- origin: emergent
- carried-by: S3, S4, S9a, S9b — and `theme-format.md` itself invokes it
- support: S3-040 (윤석's independent J1 series: eight single-lever configurations, 190 responses,
  no full comparison increased the target stance, the largest moving *against* it), S3-050 ("Two
  disjoint programs that never shared a probe reached the same conclusion, and that convergence is
  what upgraded a pause into a removal — a joint verdict, not one program's call"), S3-047 (the
  direction decision rests on the asymmetry of one p=0.0000595 result against 7 configurations /
  180 responses of nothing), S3-044, S3-041, S3-027; S4-026 / S4-W003 ("서로 독립 설계한 두 측정
  프로그램이 같은 두 결론에 수렴", used as the decision standard and flagged in the same breath as
  "AI 활용 문서의 핵심 단락감"); S9b-155 (C-STRUCT killed outright once two independent programs
  agreed), S9b-122; S9a-083 (the human naming the convergence of two independent programs as
  material).
- counter-evidence: **the two programs were not fully independent** — both were run by the same
  two-person team on the same scenario fixture and the same gate (J1), and S3-043 shows the
  *fixture* was the actual escape route, a shared confound both inherited. S3-051 concedes the
  honest limit: "nothing measured refutes the channel at a forced-conflict gate, because none
  existed" — convergence on an *untested* question is weaker than it sounds.
- gaps: whether the two programs' authors saw each other's intermediate results before converging
  is not recoverable (S3-040's dates 07-28~30 overlap the overnight runs). An interview would
  settle it, and it materially affects how strongly #4 can make the independence claim.
- oral-only: none.
- fit: #4 (decision standard) · #3

### T-35 — [merged into T-12] The instrument was usually the defect, not the model
- thesis: *Recorded as a pointer, not a drop.* A3 proposed this as a standalone S3 theme and
  A5/A6/A8 proposed the same shape from S6, S8 and S9b; the cross-slice version is **T-12**, and
  the S3-specific counter-evidence (S3-005, S3-029, S3-032, S3-058 as genuine model-side
  behaviours) is carried there.
- lanes: cross (1, 2) · origin: emergent · carried-by: S2, S3, S6, S8, S9b
- support / counter-evidence / gaps / oral-only: see **T-12**
- fit: merged — no independent record

### T-36 — Admissibility: a program that produces numbers and then refuses to use them
- thesis: The largest single behaviour visible in S6 is a program that repeatedly produces a
  figure and rules it inadmissible — withdrawing published latencies, declaring its own A/B
  unusable, refusing to hide N=3 behind a percentage — and enforces the refusal in tooling so it
  does not depend on willpower.
- lanes: 1
- origin: emergent
- carried-by: S6, S3, S2 (S6-carried)
- support: S6-080 (the spec withdraws its own ~19–75 s latency figures: they "timed subagent
  round-trips rather than API calls"; the budget "stays open"), S6-076 (a measured 19.1 s/beat
  disqualified in the same line that reports it), S6-124, S6-119 (A20: exclude ceiling/floor,
  compute minimum live count and power *before* the comparison; zero events in both arms is
  "cannot measure", not "no effect"), S6-142, S6-107, S6-165 ("3/3 is consistent with a true rate
  as low as ~37%"), S6-158 ("an unexplained success is as illegible as an unexplained failure"),
  S6-168 (a prescribed reading order — "Do not start at metrics-*.json … Reading it out of order
  is how a program talks itself into a result"), S6-159 (a deliberately fake mechanism run through
  the whole pipeline; if it returns "verified" the program *halts*), S6-160, S6-162 (the team's own
  credulity line pre-registered as a suspect confound with its test funded in advance), S6-118,
  S6-126, S6-116, S6-100, S6-155; S3-061 (a suite that violated the program's own A20 rule is
  declared *unmeasurable* rather than reported as "no difference"), S3-039, S3-028; S2-042.
- counter-evidence: **the discipline is repeatedly overruled by the deadline, and the record says
  so.** S6-063: the two pending human evaluations (V3 blind questionnaire, E5′ report scoring)
  were never separately judged and the meeting "accepted them into the concept confirmation" under
  schedule pressure, with the debt written down in two places. S6-037/S6-038: C-BLOCK was *adopted
  as the core loop* before placebo control, negative control and blind coding were done — the
  program shipped a decision on incomplete verification and then capped the wording rather than
  waiting. S6-068 pre-commits to shipping a partial spec rather than slipping schedule. S6-155
  admits a numeric eligibility floor is unaffordable at N≤5 and substitutes a default.
- gaps: whether the negative-control mechanism (S6-159), the visibility probe (S6-169) and the
  discoverability probe (S6-164) were ever *run* is not in the corpus — only their specifications.
- oral-only: none.
- fit: #4 · #3

### T-37 — Nulls converted into design law: the dead channel paid for the live one
- thesis: The mechanisms that failed produced most of the transferable output. Drops, demotions
  and removals were systematically re-read as constraints on the game's design — what mechanic
  cannot exist, which block species are mineable, which engine capability stays off — with the
  adoption step deliberately held by a human.
- lanes: 1
- origin: emergent
- carried-by: S3, S6, S8, S9b
- support: S3-051 (the C-STRUCT closure names exactly what transfers to C-BLOCK gate authoring:
  no escape option, stances enactable on the output surface, a fixture-slack audit), S3-030
  (E-DISC's failure becomes the boundary law "a block, once integrated, can be countered but never
  recalled" → no recall mechanic, "commitment has weight"), S3-032 (E-LEV's 0/10 switches off
  execution grading and pins the engine to stance-only fixed deltas), S3-031 (P4's flipped
  placebos restrict mineable blocks to fact + self-narration species), S3-035 (E-PATH demoted from
  a player-aimable pointer to a gate-triggered attention switch — the deliverable changes, the
  mechanism survives), S3-041, S3-060, S3-043 (the next lever named is the timeline itself, not
  the prompt — **world-authoring outranks prompt-engineering as the failure surface**), S3-054
  (stances no call ever chose — 압박 0/159, 거래 0/90 — recorded as gate-design facts); S6-059,
  S6-146 (the dead channel travels with the live design doc as a warning box carrying its
  numbers), S6-176; S8-041 (C-BLOCK adopted / C-STRUCT terminated on 0-for-4 measured comparisons
  — "the single most consequential design decision … made on experiment data, not taste");
  S9b-155.
- counter-evidence: the conversion is not automatic and the corpus guards against it — S3-030
  explicitly withholds the design reading from the machine ("That reading is 민서's call, not this
  run's") and S3-054 flags dead-stance findings "as leads, never as write verdicts", so the atoms
  support "nulls *were offered* as design law" with adoption held by a human. **S3-061 is the case
  where a null yielded nothing at all** — "no information", not "no difference" — and the design
  question was handed back unanswered.
- gaps: **the corpus cannot show adoption.** Whether `no recall mechanic`, `fact + self-narration
  only` and `stance-only fixed deltas` hold in the shipped engine lives in the post-snapshot tail.
  A single grep of the post-snapshot spec would confirm or refute this theme's payoff — one of the
  cheapest high-value checks available before Phase 3.
- oral-only: OH-3 §1's demo-failures-bought-a-process-lesson is the same failure-into-method move
  at project scale. Corroborating in shape, not in evidence.
- fit: #4 (what the failures bought) · #2 video beat

### T-38 — The overnight delegation: an agent may spend the budget and author the suites, but never issue a verdict
- thesis: A written runbook handed an AI agent an entire 7-mechanism measurement program to run
  unattended overnight, with the delegation boundary drawn inside the document itself. The
  boundary held on judgment and leaked on independence.
- lanes: 1, 2
- origin: emergent
- carried-by: S3, S9b (S3-carried; S9b-153 records the same 381-call overnight run from the PR
  side, so this is **not** single-slice)
- support: S3-018 ("Produce evidence, not verdicts" — §7 forbids the agent from issuing verdicts,
  enacting amendments, calling small-N unanimity "verified", editing artifacts, or touching main),
  S3-019 (context, not calls, is the scarce resource; "A half-program with honest records beats a
  full one with confabulated ones"), S3-010 (first night: the hard stop fires and the agent halts
  the whole program at Phase 0, producing a halt report rather than stretching its mandate),
  S3-039 (second night: 381 attempts, all 8 phases, 1 hard discard, "all verdicts left to
  humans"), S3-038 (the one infrastructure change the agent allowed itself was executed inside a
  pre-authorised exception, re-verified with selftest 27/27, and routed to 민서 for ratification),
  S3-022, S3-025, S3-020 (every unattended-authored artifact carries `owner: 윤석 · authored
  unattended, pending review` plus an OWNERSHIP_NOTICE), S3-012, S3-055; S9b-153, S9b-138 (run
  integrity "프롬프트 지시가 아니라 실행 환경으로 강제"), S9b-151.
- counter-evidence: **the leak is on the independence axis rather than the verdict axis.** The
  agent authored the experimental stimuli it then measured — candidate gates (S3-012, all three
  off one axis), stance labels that plagiarised the temperament (S3-014), the negative-control
  block (S3-028, which ran "with ownership still unassigned"), and the fake mechanism itself
  (S3-021). **S3-023** shows the rigor instrument that would have separated author from coder —
  B3a blind coding — dropped for the overnight phase and then for the program, so the
  self-authored/self-read loop was never externally broken. S3-038 is an infrastructure change
  made at 3 am and ratified after the fact. *"The human kept judgment" is well-supported; "the
  human kept independence" is not.*
- gaps: the corpus cannot show what the agent did *not* record; S3-019's own failure mode (context
  degradation) is unfalsifiable from the artifacts. **Nothing reports a post-hoc human audit of an
  overnight run against its raw calls** — 156 call files exist and 1 was mined.
- oral-only: OH-3 §3's "에이전트가 백그라운드에서 도는 동안 나는 잠을 자거나 문서 작업을 했다"
  describes the *build* harness, not this measurement runbook. Structurally the same delegation;
  **must not be conflated in #4** — A3 flags this explicitly.
- fit: #4 (AI orchestration) · #2 video beat · #5

### T-39 — The record is append-only; failures are preserved on purpose
- thesis: The credibility policy was written as a rule before anyone needed it — raw artifacts are
  never edited, failed configurations never deleted, corrections appended rather than applied —
  and preserving failure is framed as what makes the successes believable.
- lanes: 1, 3
- origin: emergent
- carried-by: S2, S3, S6, S8 (see T-60 for the same instinct applied to the repo as a whole)
- support: S3-002 ("실패한 구성도 지우지 않는다 — 무엇을 시도했고 무엇이 안 됐는지가 결과의
  신뢰도를 만든다"; "if `calls-*.md` and `metrics-*.json` disagree, the JSON is wrong"), S3-001
  (the RUNLOG opens the day the first measured run contradicts the plan — measured results amend
  the plan via numbered `A#` entries that *outrank* it), S3-040 (eight failed C-STRUCT
  configurations preserved in full "precisely because deleting failed configurations would gut the
  null's credibility"), S3-024, S3-026 (A16 enacted forward only — "past runs stay as recorded and
  rates never pool across the boundary"), S3-049, S3-050, S3-017; S2-003 (quarantine, not deletion
  — "사건 증거로 보존"), S2-024, S2-023 (v1 numbers explicitly not carried across the sonnet→haiku
  swap; the v1 slice and runs kept as a regression baseline), S2-014, S2-032; S6-040 ("reorganize
  the maps, never the evidence"), S6-028 (run records committed because LLM output is not
  reproducible and a deleted record cannot be regenerated), S6-104, S6-157, S6-168.
- counter-evidence: **immutability is not completeness**, and the corpus contains the hole:
  S3-046's harness-created bias "had gone unreported through seven write-ups" — an append-only log
  cannot evidence what was never appended. S3-038 shows a permanent-looking infrastructure change
  made mid-run. **S2-035 is the sharpest**: the pipeline's own sentence-count retry rule was
  silently discarding the best material until a later scoring pass noticed — and S2-024 says
  "위반이 곧 데이터다" was a *v2* change, so v1 *was* laundering format failures. How many v1
  retries silently overwrote a violation is unknowable; v1 didn't count them.
- gaps: whether the RUNLOG is genuinely append-only is checkable from the git history of
  `planning/dday-mechanism/RUNLOG.md`; that check is not in the corpus and would be cheap.
- oral-only: none. OH-4 supplies the general counter-argument from outside — a repo-mined history
  cannot see work whose artifact never landed (T-63).
- fit: #4 (how the evidence base was kept honest) · #3

---

# E. AI as creator

### T-40 — Generate many in parallel, a human picks, the winner is frozen as data
- thesis: The lane-4 pattern is consistently generate-many → human-pick → freeze the winner as an
  input to everything downstream, applied at low cost to art direction, scenario drafting, concept
  writing and (proposed) model selection — with cross-contamination between arms deliberately
  prevented so the candidates stay comparable.
- lanes: 4
- origin: emergent (attaches to seed 3's "humans judge")
- carried-by: S1, S2, S4, S5, S9b
- support: S2-043 ("이 문서를 여러 LLM 세션(모델별·시나리오별)에 붙여넣어 재앙 시나리오 초안을
  병렬로 뽑는다 … 팀이 비교해 최종 시나리오를 고른다"; other theme sections must be deleted "테마가
  섞이는 것을 막기 위함"), S2-049 (four v2 drafts from the same parent under the new format canon;
  우는다리 carried forward, its draft byte-identical to `data/scenario/우는다리/draft.md`), S2-047,
  S2-041; S1-038 ("집필 브리프를 여러 모델 세션에 배정해 초안 5편을 받았다"; a first human ranking
  by on-paper density, then two decisions changed the axes and the ranking was redone; rejected
  drafts still mined for "문장 채집 샘플·인물 설계 기법"), S1-039 (the winning draft contradicted
  the brief's own rule and the humans kept the draft's resolution as the game's spine), S1-002,
  S1-005 (writing rules imposed on the AI author: one sentence one idea, no meta-comments, "주장
  대신 장면"), S1-019, S1-035; S4-063 / S4-W005 ("3–5 candidate style strings, one low-quality
  sheet each, human picks the winner. Freeze it as **one sentence prepended to every image
  call**"), S4-030 (a writing brief driving multiple LLM sessions per model per scenario in
  parallel → the team compares and selects → the selected scenario's gates get tested), S4-062 /
  S4-W006 ("**One call per subject, ever** — character consistency across separate calls does not
  exist"), S4-064 / S4-W007 (never ask the model for transparency — magenta key; motion is CSS, not
  generation), S4-034; S5-024 (the same select-from-candidates shape applied to models, blind,
  identity-stripped, order-shuffled, with the decision rule fixed in advance), S5-035; S9b-123
  (styleBible frozen verbatim; the generator refuses to run unfrozen).
- counter-evidence: **the arms are only comparable if they are held equal, and once they were
  not** — S2-041: Apothecary played far better, but the tester attributed the delta to mechanics
  added *during* the test, not to the concept ("약재상 쪽이 훨씬 재밌었지만, 피드백 덕분이지
  아이디어/컨셉 차이는 아니라고 생각해"). **The selection step is the undocumented half**: no atom
  records *why* 우는다리 was chosen over the other three (S2-049 records the outcome, not the
  criteria), and S4-030 specifies the writing brief lives **in the generating session, not the
  repo** — the provenance of the selection is designed to be un-mineable, with only "archiving
  recommended". S4-062/S4-064 are as much a limit-catalogue as a win: this creator needs one hard
  human-authored workaround per capability. S5-024 was still "proposed, not yet approved" at
  snapshot.
- gaps: **generation is instrumented; selection is not.** The 우는다리 rationale, the outcome of
  S5-024's blind model test, and S4-030's actual drafts are all missing. If the selection rationale
  does not exist anywhere, that is a finding about the pipeline's weakest link.
- oral-only: OH-2's "시장 조사를 은근 많이 했는데, 각 컨셉 문서별로 있던 것으로 기억" touches the
  input side; S1-054/S1-016/S1-017 confirm per-doc research for four concepts (see T-64).
- fit: #4 (AI as creator) · #2 video beat (art) · #3 · #5

### T-41 — AI generates candidates; deterministic code certifies them — the scenario factory
- thesis: The authoring lane's operating rule is a hard split *by kind of step*: generative
  subagents write, revise and paper-check; deterministic scripts compile and lint; an LLM-based
  compiler was designed and explicitly rejected. The loop is bounded (max 3 rounds) and has been
  observed correcting an error it introduced itself.
- lanes: 4 (with 2 at the tooling seam)
- origin: emergent
- carried-by: S2, S7, S8, S9b
- support: S8-048 ("컴파일은 LLM이 아니라 결정론 코드 … 초안 §4 형식이 파스 계약(파싱 실패 = 초안
  에러, 컴파일러는 추측하지 않음) … compile-scenario 스킬 안은 검토 후 폐기"), S8-W015
  (`write-scenario` reworked as a factory orchestrator: "집필·종이 검사·수정은 서브에이전트,
  컴파일·린트는 결정론 스크립트, 루프 최대 3회"), S8-043 / S8-W010 (the skill plus
  `scenario-generation-guide.md`, `gate-hardening-manual.md`, 안티패턴 7종, 축 어휘 사전 — AI-as-
  creator made reproducible), S8-W005 (the loop ran end to end and emitted the first datapack at
  "린트 ERROR 0 · WARN 4 · FLAG 43"); S9b-166 (deterministic compilation on failure-mode grounds —
  "an LLM compiler's failure mode is silent paraphrase"), S9b-167 / S9b-W013 (write in a
  contamination-isolated fresh subagent → compile+lint → closed-checklist paper check → scoped
  fixer → loop; two checker rules and two lint rules promoted from the live 우는다리 run,
  "**including one error introduced by the loop's own earlier fix**"), S9b-W009 (the output diffed
  against a hand-compiled pack: 10 residual diffs, all punctuation); S7-013 ("컴파일은 빈 배열로
  통과시키고 린트가 '하드닝 미완'을 플래그한다" — the compiler certifies shape, lint certifies
  doneness), S7-005 (the pack's only hand-written file is the only one that can carry a typo),
  S7-004 (the pack ships a byte-identical copy of its 43 KB source draft, so every pack is
  self-auditing against its source); S2-057 (the two-pass paper check: orchestrator read, then a
  dedicated inspector subagent — `write-scenario` §6-3's first live use), S2-058.
- counter-evidence: **S7-005 inverts the usual trust story** — here the *human* is the untrusted
  contributor and the generated layer is the reliable one, which cuts against a simple "AI
  proposes, code verifies" reading. **S9b-168/169/170** show the loop is not self-sufficient: its
  lint silently skips `anyOf` — exactly the two newest fields; its one hand-authored input has none
  of the three defenses applied to generated files (a `vairable` typo produced byte-identical
  output); its positional drift guard is defeated by two events sharing a timestamp — all found by
  **a human executing the scripts**. S8-048 also records a "번역투 방지" device added to the skill,
  i.e. the generative half needed its own guard against a characteristic AI failure. S8-W005's own
  numbers (WARN 4, FLAG 43) show "certified" means consumer-blocking-error-free, not complete.
- gaps: no atom reports how many drafts the loop rejected or its success rate at the 3-iteration
  cap. **One datapack (우는다리) exists at snapshot**, so whether the skill is *reproducible*
  rather than merely *repeatable-once* needs the post-snapshot scenarios. No atom evaluates the
  factory's output quality against hand-authored material in either direction.
- oral-only: none.
- fit: #4 (AI as creator) · #5

### T-42 — Measured model behaviour became a writer's rulebook — authoring as physics
- thesis: The team converted measured LLM behaviour into a writer-facing rulebook framed
  explicitly as physics rather than taste, with an anti-pattern gallery of real gate deaths,
  empirically promoted lint rules, a fixed debug order and a tiered verification budget — so a
  writing session (human or LLM) can obey laws it never saw the data for.
- lanes: 4
- origin: emergent
- carried-by: S6, S7, S2, S3 (S6-carried)
- support: S6-170 ("아래 규칙은 취향이 아니라 실제 측정으로 확정된 물리다 — 위반한 장면은 아름다워도
  게임에 실리지 못한다"), S6-176 (seven measured gate-killers cataloged as what/why/fix — "a failure
  museum as authoring tool … the gallery transfers evidence to writers who will never read the run
  logs"), S6-173 ("the verification program's most expensive lesson"), S6-174 ("라벨은 튜닝
  노브다"), S6-175 (fixture slack beats any gate design; the fix is narrative), S6-171
  (irreversibility banning a whole dramatic trope), S6-172 ("a key behind the door is a wall, not a
  puzzle"), S6-177 (tiered verification — free lint on all gates, one human paper read, ~30 live
  calls on the first gate only — and a fixed fix order ending at the base prompt, "최후 수단 …
  건드리면 기존 확인이 전부 무효가 된다"), S6-135, S6-071 ("신파 금지", because sentiment is
  unactionable by block injection), S6-062, S6-059, S6-131, S6-132, S6-053; S7-018, S7-010, S7-011,
  S7-012, S7-009; S2-051, S2-052 (axis-vocabulary exclusivity as a writing discipline: "두려움"
  reserved to the key sentence and its decoy), S2-046 (deliberate poison as a content type —
  "그럴듯한 오답을 프롬프트에 넣고 다음 런을 망치는 경험이 이 게임의 핵심 학습"), S2-053, S2-048.
- counter-evidence: **the rules bend to the model rather than the reverse** in S6-060 (the length
  cap relaxed because the overruns held the best sentences), which complicates "rules are physics."
  **S6-139** marks the floor below which the discipline cannot transfer — rendering the temperament
  prose "would be inventing game content", so a work unit must not do it. S6-063 shows the
  discipline's own output quality under-verified (E5′ skipped). And T-07's counter-evidence
  applies: several catalogued "model failures" were authoring failures (S6-158, S2-032).
- gaps: only one scenario exists at snapshot; whether the discipline transfers to a second author
  or a second scenario is untested.
- oral-only: none.
- fit: #4 · #3 · #5

### T-43 — Self-evaluation was made a required deliverable, and was insufficient
- thesis: Every creative artifact was required to end by grading itself against the spec, and the
  AI writers used the slot to confess non-compliance rather than paper over it — but the one time
  an independent AI inspector was run against a self-passed draft it found 18 issues, 7 of them
  mechanically detectable.
- lanes: 4, 3
- origin: emergent
- carried-by: **S2 only — THIN**
- support: S2-044 ("자기 평가 — §3의 요구사항 7개 각각에 대해 스스로 통과/미달을 판정하고 근거를 한
  줄씩"; 테러리스트의전화 declared scale 미달 with a proposed cut list; 물마루 flagged T5 as
  over-scope; 병원 "엄밀히는 숫자가 1.5개"), S2-047 (the hospital draft self-identifying its weakest
  gate — "사람 냄새가 옅다" — and proposing to absorb it), S2-048 (self-graded 조건부 통과 with the
  cut offered to the team), S2-055 (open judgments shipped as open), S2-053, S2-054 (a
  schema-amendment recommendation left as the humans' call), S2-032.
- counter-evidence: **S2-057 is decisive** — 우는다리 shipped with its §9 self-check, and a two-pass
  paper check (orchestrator read, then a dedicated inspector subagent) turned up **18** issues;
  the finding-adjudication split (7 fixed / 6 rejected on a contract argument / 3 deferred to the
  probe's jurisdiction) shows even the inspector's yield needed a second authority. **S2-058**
  compounds it: 7 of those 18 were mechanically detectable, i.e. within reach of a lint the
  self-check never approximated. A2 searched for a case where a self-evaluation caught something a
  later pass missed and found none.
- gaps: no independent inspection of the other three v2 drafts is recorded, so whether 우는다리's 18
  is typical or high is unknown.
- oral-only: OH-3 §1's "research the standard first, then write on top" is the upstream half of
  this; S2 shows drafts graded against a *brief*, not against researched industry format. Related;
  do not merge. (S9b-133 is the one place the OH-3 hook closes — see T-28.)
- fit: #4 (prompt/instruction design — "grade yourself against each requirement" is directly
  quotable)

### T-44 — Paper tests: the riskiest assumption hand-played before any code existed
- thesis: The most dangerous architectural bet — that an LLM judge can *feel* fair — was made
  falsifiable in a 30–60 minute hand-played session with no code, by writing a self-contained brief
  that turns a fresh LLM session into a test rig. The same move was made for the deduction engine,
  where a Claude Code session was declared the harness outright.
- lanes: 1, 3, 4
- origin: emergent
- carried-by: S1, S2, S9b
- support: S2-038 (a self-contained instruction document: the LLM plays GM under a pre-committed
  clue contract — secret need, 2–3 clues, ≤1 red herring, danger level, decided before presenting,
  "never rewrite history" — while the human plays shopkeeper through constrained verbs only, and
  the no-free-text membrane is itself part of what is being tested), S2-039 (all three hypotheses
  passed under three deliberate adversarial plays, including the tester inventing an un-offered
  fourth option; the off-script acceptance named a *structural advantage* over deterministic
  judging), S2-012 ("코드 하네스는 만들지 않는다 — 당신이 하네스다", with a written constitution:
  never make the agents' judgments, apply state arithmetic with "창의성 금지", record ambiguities
  rather than resolve them, never modify slice.json to fit results — and declared losses up front),
  S2-066 (scripted deterministic playthroughs driving rev.2/3 balance surgery: the 신뢰 resource
  deleted as a dead number, the economy inverted from 전부승인 100 / 오지목 65 to 정석 190 ≫
  전부승인 61, and a context cap making "equip everything strong" arithmetically impossible so the
  decision becomes "무엇을 포기할까"), S2-070, S2-041; S1-020 (an 11-customer hand-played paper
  prototype ran *before* the apothecary doc was finalized, and the doc states "이 기획서의
  아키텍처는 이 테스트 결과의 반영이다"), S1-024, S1-028 (a paper test that failed voided its own
  phase as validation), S1-018, S1-047; S9b-108 (the design law "no wrong answer — outcomes are
  consequences, never fail-stamps" came out of a hand-played paper prototype), S9b-128.
- counter-evidence: **the cheap method leaks and the corpus prices it.** S2-042: the protocol's own
  required 1–5 rating was never captured — a hand-played test loses data a coded harness would have
  recorded. S2-012 lists the losses up front (subagent wall clock as a latency proxy; E2 cut from 5
  runs to 3). **S2-013**: the paper test's authored world contained a mathematically *impossible*
  ending, found by exhaustive computation rather than by playing — the hand-played half would not
  have caught it. **S2-001**: the harness-is-a-session choice is exactly what made the fabrication
  possible; a code harness has no temptation to run the experiment for you. And S1-047 warns that
  paper density passing does not guarantee play density.
- gaps: **no atom compares the paper test's verdict against the eventual coded implementation** —
  nobody checked whether the hand-played prediction held. That check, if run, would be the
  strongest possible endorsement of the method and is not in the corpus.
- oral-only: OH-3 §1 ("데모 3개의 실패 경험이 있었기 때문에 … 기획 단계에 시간을 더 쓰는 쪽을
  택했다") gives the *cause* of the front-loading; the corpus shows the practice, never the cause.
- fit: #4 (validation method) · #5 (how a 2-person team without game-dev experience de-risked)

### T-45 — Authored content outran the gates that guard it
- thesis: A distinct defect class: the invariants, schemas and test suites were built around
  mechanics, and *content* walked past all of them — a dead card, two identical faces, two fork
  cards with the same copy, a customer no balance invariant could see, a demo that "doesn't end, it
  stops."
- lanes: 4
- origin: emergent
- carried-by: S9b, S7, S6
- support: S9b-016 (`mirror_shield` unreachable: the authored 1-1-1 council split always resolves
  wrong, so one of eleven cards is dead content and the PRD claim is false), S9b-048 (a brand-new
  customer visible to no balance invariant; 983/983 + 101/101 green while the game is visibly
  broken), S9b-055 (customer 1 and 3 wore a pixel-identical face; the honest fix is re-paletted base
  art), S9b-058 (both fork cards read "이 길로 간다."), S9b-053 (three flat "no effect" outcomes;
  "56 seconds in, the judge has read three 'no effect' notes and is looking at a static note with
  nothing to press"), S9b-059 (~66% of the opening frame was persona prose, pre-empting the very
  claim the demo existed to prove), S9b-062, S9b-169; S7-011, S7-009 (the counter-technique:
  solvability — normally a playtest discovery — turned into a schema obligation, ≥2 key examples
  each `mined_from` reachable "반드시 이 게이트 이전"); S6-091 (the spec naming the risk in advance:
  "a large pool with a hidden matching rule is the classic unfair-puzzle shape").
- counter-evidence: the project's answer was to push content checks into the schema (S7-009,
  S7-011, S6-135's E5 "a lock with one key is a raffle, not deduction") and those rules do fire —
  S6-125 caught a `>= 1` roster rule making 7 of 19 beats unrunnable by checking against real
  authored data. So this is a partly-solved class, and its residue is exactly the part that needs a
  human's eyes (T-46).
- gaps: no atom measures the content-defect rate before vs after the schema obligations landed.
  `artifacts/` is empty at snapshot, so S7-014's `score_variance` and `near_miss_trace_rate` — the
  metrics designed to catch "the gate is decoration" — were never computed.
- oral-only: none.
- fit: #4 · #3

---

# F. The human boundary

### T-46 — The verdict stayed human — and agents judged feel anyway
- thesis: Seed 3 is **supported as a governance rule and contradicted as a description of
  practice.** Across every slice the final verdict — is the mechanism real, is the scenario good,
  is this worth keeping — is explicitly reserved for a named person; and across the same slices
  agent review seats routinely made accepted fun-adjacent judgments, one of them rewriting NPC
  dialogue on taste grounds. The survivable claim is narrower than the seed states.
- lanes: cross (1, 4)
- origin: **seed-confirmed:3, with a stated qualification**
- carried-by: S1, S2, S3, S4, S5, S6, S8, S9a, S9b
- support (for the seed): S1-020, S1-022 (a tester's sentence — "틀린 답이라는 것은 없으면 좋겠어 …
  전부 그냥 '내 판단의 결과'인 거지" — converted directly into an experience goal and a guardrail,
  overriding the quiz framing an AI judgment system implies), S1-029 ("기획서가 아니다 — … 최종
  판단은 데모 베이크오프가 한다"), S1-024, S1-038, S1-039; S2-022 ("판정은 사람이 한다"), S2-070
  (the blind package withholds even the answers' *location*), S2-040 (the tester accepted the
  rubric's fairness but **rejected its valence** — death, injury, becoming an assassins' supplier
  must read as consequences of judgment, not fail-stamps: "암살자들의 본거지, 수급책이 되는 것도
  재밌잖아?"), S2-057; S3-055 (the closing open-items list is dominated by human work the machine
  cannot self-supply), S3-018, S3-047, S3-056 ("working game, not perfect game" — the meta-verdict
  of when enough is enough), S3-030 ("That reading is 민서's call, not this run's"), S3-061, S3-054;
  S4-033 ("§9.3 판정은 사람이 카드를 보고 내린다 … 이 회의가 그 판정 자체였다" — of nine tracked
  human-coding items only the verdict itself survives), S4-011 (a whole track killed on felt fun
  after play, with the technical fix-it counter-argument heard and overruled), S4-043 (all gates
  green, "v1 doesn't demo the game"), S4-057; S5-001 ("Games additionally need *fun and feel*, which
  automated gates cannot measure" — the stated reason the harness was modified at all), S5-003,
  S5-017 ("Taste stays out of the gate; drift stays in the loop"), S5-018, S5-019; S6-047 (the
  기획서 template and paper-test workflow retired — "the discriminating evidence for *fun* was ruled
  to be playable, not writable"), S6-060 (a human review found "최고의 문장들이 폐기본에 있었다"),
  S6-163, S6-031, S6-139, S6-170; S8-042 ("Amendments are proposed, not enacted — 민서 reviews each
  mechanism one at a time"), S8-019 (a human fun-verdict — "shell works but stubbed AI demos the
  wrong thing" — redirecting a whole run), S8-035, S8-W005; S9a-025, S9a-063 (human states the
  *what* from taste, agent supplies the *why* from the pipeline), S9a-068; S9b-141 ("사람이 판정한다";
  "모호하면 기본값은 texture"), S9b-150, S9b-155, S9b-151, S9b-186.
- counter-evidence: **agents made aesthetic calls, and they were accepted.** S9a-016 (an *agent*
  argues from player experience over legal data: "판정단이 처음 60초에 관찰을 눌렀을 때 빈 결과를
  보면 '버그'로 읽힐 위험이 있습니다"), S9a-052 (an agent notices the evasive line answers a question
  nobody asked *on the path the design pushes players toward*, and rewrites both customers' lines —
  "그저 요즘 들어 밤이 유독 길게 느껴질 뿐이지요."), S9a-015, S9a-080; S9b-053, S9b-058 ("a one-line
  differentiator here buys more perceived depth than any other single string in the demo"), S9b-059,
  S9b-052, S9b-019 ("the single most important pixel in the demo"), S9b-174 (a *design skill*
  producing the client visual target). **S5-005** encodes feel as an agent-seatable review lens;
  **S5-W007 / S5-013** hand agents the perception task in-loop by 08-03; **S6-190** shows the
  game-feel lens producing three findings "a correctness-only panel would have passed";
  **S6-145** operationalises fun as a *measurable policy gap* (random/greedy/oracle bots, "Gap ≈ 0
  means the pack is a brute-force game") before any human playtest exists; **S8-041** made the
  single most consequential design cut on a p-value and a 0-for-4 count, not on taste; **S2-039**
  recommends keeping an **LLM as the judge** of player solutions. And the humans did not always
  exercise the reserved faculty: S6-063 (two scheduled human quality verdicts skipped), S9a-W011 (a
  bare "LGTM"), S4-019 (the two humans never agreed that fun is even the optimization target —
  status "가중치 합의 없음"), S4-012 (on the one live fun question they reached no conclusion).
- gaps: **no atom anywhere shows a human overruling an agent's game-feel verdict** — the experiment
  that would settle the seed. No human playtest verdict on DDAY exists in any slice. The demo
  bake-off's evaluation reasoning is absent from every written source. Whether agents *could* have
  originated fun criteria is unprovable because they were never asked to.
- oral-only: OH-1 §5 / OH-2 §4 — the "게임은 왜 재밌을까" discovery phase as its own step and its
  five-item list (catharsis via stress→relief, intuitive visualization of growth, feeling your own
  skill level up, choice-and-spectating, cozy), plus the AI-adds-fun vs AI-removes-fun analysis.
  **Four agents checked independently; no written trace anywhere** (S4's own corroboration pass,
  hook 6, records it as no-trace). The seed's stated ancestor is entirely oral.
- fit: #4 (the human/AI judgment boundary) · #5 · #2 video beat
- **Phase 3 must choose** between three framings, and the atoms support the third best:
  (a) "AI never got to judge fun" — contradicted; (b) "AI judged proxies for fun, humans judged
  whether it was worth keeping" — supported; (c) "the team kept redrawing where AI judgment stops,
  and by 2026-08-03 it had moved twice" — supported, and more interesting.

### T-47 — The human-kept list: the rule is "work whose failure mode is silent"
- thesis: The corpus contains an explicit, reasoned list of jobs the humans refused to delegate —
  running a paid generator, authoring prompts with methodological stakes, judging a mechanism run,
  compiling the datapack, creating infrastructure for the first time, overriding a pre-registered
  rule — and each refusal is argued from the AI's *failure mode*, not from distrust in general.
  The boundary is not creative-vs-mechanical; it is silent-failure-vs-loud-failure.
- lanes: cross (1, 2, 4)
- origin: emergent (the mechanism under seed 3)
- carried-by: S3, S4, S5, S6, S9b
- support: S9b-166 (the compiler is deterministic "because an LLM compiler's failure mode is silent
  paraphrase, which breaks key conditions in ways no schema or lint can see"), S9b-176 ("a
  classifier here would be a second, invisible authority"), S9b-151, S9b-141, S9b-150, S9b-055 (an
  agent cannot add a generated asset in-run: it needs a personal key and a manifest entry),
  S9b-123, S9b-183 ("a stack that has never been created should not have its first run debugged
  through CI's feedback loop"), S9b-107, S9b-042/043; S4-060 ("agents integrate; humans provide
  what agents can't verify", with the rejected alternative recorded: "we considered it; wrong move
  — the harness's value is determinism"), S4-067 ("the biggest risk we removed was a unit whose
  author could never execute its own code"), S4-045, S4-052; S5-009 ("The harness proves the stub
  shell is green; it cannot exercise the live path"), S5-006, S5-008 ("Humans do not hand-write
  game code"), S5-029 / S5-W011 (three provider-reality defects a 146-test keyless suite could not
  reach); S3-055, S3-018, S3-020; S6-195 ("Agents wrote the game code — humans did not hand-write
  it", with the human side enumerated: the PRD and its frozen inputs, the vendor-call path "the one
  thing agents cannot test", eight recorded `resolved_decisions`, the interruption calls and manual
  cleanup, the keys-required live checklist, and the final merge to main "which the harness is
  forbidden to do" — **"the boundary is not code vs no-code but decision-classes"**), S6-110,
  S6-014.
- counter-evidence: **the boundary moves, in both directions, inside the corpus.** S5-W002 — nine
  verification dimensions (146 tests, OpenAPI contract validation, non-root Docker checks, 4-turn
  mock E2E) *were* gated keylessly, so the un-delegable slice is narrow, not large. S5-W007 /
  S5-013 — by 08-03 the frontend-mod v2 hands agents their own build screenshot and the reference
  PNG and asks them to judge divergence in-loop, a perception task previously reserved for humans.
  S9b-012 — a human-provided path did not exist, so an agent built it in-run under approval.
  S9b-174, S9b-167 / S9b-W013 — scenario writing, the most creative task in the project, was
  delegated to a bounded loop. S4-052 shows the reverse trust direction too: the agent is trusted to
  *degrade honestly* rather than being fenced out. And S5-008 states the split as a rule with **no
  atom measuring compliance with it**.
- gaps: no atom quantifies how often the human-owned live checklist (`e2e/live-smoke.md`) was
  actually run or caught anything. No atom records a refusal later reversed *because the AI got
  better* — the corpus is one month long. Whether the in-loop visual self-check worked is decided by
  the post-snapshot run, and **that single data point could flip this theme** from "humans keep the
  verdict" to "the verdict was successfully delegated in the end."
- oral-only: OH-3 §3's "유능한 '개발팀'을 고용한 것에 가까운 경험" is the operator's-seat version;
  the thesis is fully written and does not need it. OH-3 §2's "에이전트가 만든 테스트 환경을 내가
  승인했고" is the same shape for measurement.
- fit: #4 (how work was divided) · #5 (roles)

### T-48 — Where the human actually enters: topology, arbitration, taste and "show me the evidence" — almost never code
- thesis: Human interventions cluster into a small, consistent set: policing what enters the shared
  record, enforcing repo topology and history rules, arbitrating between colliding workstreams,
  demanding measurements, requiring the spec to follow the finding, and stress-testing
  agent-authored gates. **There is no atom in the corpus of a human writing the fix.**
- lanes: 3 (with 2 and 4)
- origin: emergent
- carried-by: S9a, S9b, S3, S6
- support: S9a-004 (the clearest early instance of an agent exceeding instruction — asked for a
  document, it committed and opened a PR; the human closed it: "혼자서 커밋에 pr 까지 날려버렸음"),
  S9a-079, S9a-064, S9a-088, S9a-067, S9a-073 (a one-line "이거 어떻게 진행된건가요? 테스트 결과 등이
  있나요?" producing a full latency matrix with an honest non-benchmark disclaimer), S9a-074,
  S9a-075, S9a-087 (accepting that test evidence changed Call 2's definition but blocking the merge
  until the architecture spec matched — the doc, not the code, was the blocker), S9a-083, S9a-089 /
  S9a-W007 (five self-devised mutations against the agent's parity gate), S9a-090 / S9a-W008,
  S9a-025, S9a-063 ("걷는 모션 표현이 잘 안됨 … B, C, D는 왜 깨졌는지 확인하면 좋을 듯"), S9a-002 (an
  agent escalating a rule ambiguity *to* the human to settle); S9b-040, S9b-041, S9b-044, S9b-168
  (윤석 runs the scripts and finds three silent holes), S9b-004 (the operator finishes u8/u9 by hand
  after a usage limit — the one near-exception, and it is *finishing*, not authoring), S9b-042/043;
  S3-047, S3-056, S3-025 (민서 enacts the amendment the agent refused to enact); S6-186 (the two
  interruption calls and manual cleanup).
- counter-evidence: the human was sometimes wrong and was corrected — S9a-091 (the human's `notsup`
  was not the default; the agent's correction accepted), S9a-077 (a requested fix that could not run
  as specified), S8-038 (the human-set gate's premise was wrong and cost 30 calls), S8-039 (the
  human-designed instrument carried an undetected confound across every prior probe). The
  demanding-evidence pattern is not uniform: S9a-W011's bare "LGTM"; and S9a-092 / S9a-W009 /
  S9a-W010 show whole late runs merging with no human comment at all. **The clean claim "humans
  judge, AI measures" survives as a division of *labour*, not of *reliability*.**
- gaps: the corpus cannot separate "the human chose not to code" from "the human had no time to" —
  an interview would. The absence is also bounded by S9a's 46 unread PR bodies.
- oral-only: OH-3 §2's "에이전트가 만든 테스트 환경을 내가 승인했고 … 나는 … 최선이라고 판단되는
  모델을 직접 골랐다" describes the same division from the operator's chair; the atoms corroborate
  the *shape* but not the half-day claim.
- fit: #4 (human-in-the-loop) · #5 (roles)

### T-49 — Two humans reviewing each other: the manual-PR adversarial channel
- thesis: In the non-harness PRs the division of labour is explicit and consistent — the *bodies*
  are agent-drafted (structured What/Why/Verification/Not-in-scope, "🤖 Generated with Claude
  Code"), while the human hand appears in the reversals, the "a human must decide this" flags and
  the rebuttals. Two humans review each other hard, and approvals are withdrawn when the premise
  changes.
- lanes: cross (2, 3)
- origin: emergent
- carried-by: **S9b only — THIN** (S4's meeting minutes are the expected sibling)
- support: S9b-110 (윤석 fears the strongest model wins everything; 민서 rebuts: "파티원의 차별화
  축은 베이스 모델이 아니라 빌드야"), S9b-119 (윤석's architecture review demotes a PR from "the
  deploy path" to a handler/adapter seam; the author accepts every point), S9b-125 (the only
  CHANGES_REQUESTED among the manual PRs), S9b-142 (윤석 finds temperament had drifted into a
  player-facing mechanic), S9b-144 ("PR 성격이 문서 전용에서 실행 코드 포함으로 바뀌었으므로 승인을
  물리고 다시 봅니다"), S9b-145, S9b-157, S9b-161 (민서 reverses 윤석's own stated "code is canon"
  rule; 윤석 accepts), S9b-163, S9b-168/169/170, S9b-114/115, S9b-126, S9b-127, S9b-176/177/178.
- counter-evidence: the split is not clean — S9b-107 shows a human hand-editing AI-drafted
  *content* (speaker mapping from git authorship), S9b-133/172 show humans making authorial
  decisions about document form, and conversely S9b-174 has a skill generating the creative artifact
  inside a "manual" PR.
- gaps: 4 manual PRs were skipped body-unread (#2, #5, #6, #14) and 5 read body-only, so the "quiet
  manual PR" population is characterized, not mined.
- oral-only: OH-3 §1 ("에이전트는 … 팀원의 PR을 요약·분석해줬다", "내 의견에 반박을 요구하면서") is
  the oral statement of this working style; the written support stands independently.
- fit: #4 (how the two humans worked) · #5

### T-50 — Dissent kept as a first-class column, and open questions closed by nobody
- thesis: The meeting machinery preserves disagreement structurally — a disagreements table, an
  open-questions list, per-attendee positions — and several of the project's central questions are
  recorded as *unresolved* rather than settled, including questions later decisions quietly
  answered without ever closing them.
- lanes: 3 (the artifact) over unclear (the content)
- origin: emergent
- carried-by: **S4 only — THIN**, and specifically the single AI-generated 07-24 minutes document
- support: S4-005 (the recorded opposite opinion on Doodle Life's closed-environment intent), S4-012
  ("'LLM이라 피할 수 없는 편차이며 재미일 수 있다'는 의견과 '랜덤 판정으로 느껴질 수 있다'는 우려가
  함께 남았으나 결론을 내리지 않았다"), S4-019 (methodology-vs-fun judging bet, status "가중치 합의
  없음"), S4-002 ("인간이 어디까지 개입해야 하는가가 미해결 이슈로 남음"), S4-029 (three
  alternatives with costs, selection deferred to whoever runs the test), S4-027, S4-032 (the
  counter-practice: the 07-30 minutes annotated after the fact with cross-references and PR numbers,
  closing 8 of 9 tracked items).
- counter-evidence: **THIN and possibly a description of one document's template** — the terse
  hand-written 07-28 note (S4-021) has no disagreements table at all, and S5's equivalent documents
  record *rejected alternatives* (S5-021) rather than live dissent. S5-024 makes the opposite move,
  pre-resolving scorer disagreement by a fixed rule.
- gaps: **no atom records any of these open questions being closed.** S4-012 and S4-019 are still
  open at the end of the slice.
- oral-only: OH-2's account of the founding 민서-vs-윤석 split on in-game AI — the biggest
  disagreement in the project's history — has no written trace (S4's corroboration hook 5 confirms).
  **The disagreements table exists and the founding disagreement is not in it.**
- fit: #4 (how decisions were made) · #5 (two directors, different priors)

---

# G. Speed, cost and throughput

### T-51 — Latency as a design input — measured late, and never decided on speed alone
- thesis: Response time entered the record as a *game* constraint before any concept was chosen and
  every subsequent architecture decision is priced against it. But the shipping budget was an
  untested copy from another game until the first real deploy on 2026-08-04, and the one model
  decision that turned on measurement was decided on contract compliance and measurement continuity
  rather than on the latency delta.
- lanes: 1 (reaching 2)
- origin: **seed-confirmed:2**
- carried-by: S1, S2, S3, S4, S5, S6, S7, S8, S9a, S9b
- support: doctrine before measurement — S6-006 ("Latency must hide in natural game pauses … never
  block mid-action gameplay on an LLM response" — a permanent rule that "predates any latency
  measurement"), S4-009 (07-24: "10초도 길 수 있으므로 빠른 모델·낮은 추론·캐싱·로컬 LLM을 옵션으로
  검토", with 민서 arguing for a responsive game over a tech demo even at the cost of dropping real
  Context/Memory/MCP), S1-006 (the concept template makes "where latency hides in the game rhythm" a
  *mandatory* prose subsection, so no concept could be compared without answering it). Fiction
  invented to hide calls — S6-045 (the duel representative elected by a deterministic engine tally
  at walk-start and the elected unit's first judgment pre-fired: "two wall-clock calls hidden behind
  the walk animation"), S1-034 (the side-scroll view chosen partly because walking animation hides
  two calls), S1-044 ("무전·전화·방송의 세계에서 '…무전 회신 대기 중'은 랙이 아니라 서스펜스다"),
  S4-044 (silhouette entry, waiting beat, 25 s fallback designed *into* image generation), S4-068
  ("Never a spinner."), S5-036 ("게임은 절대 LLM을 기다리며 멈추지 않는다" — 3 s then the class
  default action with a "…" bubble), S5-W004 (one call per unit per turn fired in parallel so a full
  party turn costs ≈ one wall-clock call), S1-035 / S5-035 (banter mass-generated at design time),
  S1-010, S9b-052 (an affordance chosen over a timed hold because "a fixed hold still races the
  reader"). Measurement — S2-069 (v1 sonnet p90 24 s; v2 haiku 29.7 s neutral → 36.3 s with
  temperament → 49.2–52.9 s with facts; report calls averaging 93 s), S2-064 (models filtered by
  *actual invocation*: Sonnet 5 / Opus 5 AccessDenied, Opus 4.6 cost-vetoed; Haiku 4.5 with thinking
  **disabled** because thinking multiplied latency ~5× and tokens ~8× while "정직도는 그대로"),
  S2-063 (reasoning strength is a harness-level abstraction — Haiku rejects `effort`, Sonnet rejects
  `budget_tokens`, Nova has neither — so compare within-model only), S3-059 (reporter latency 10.4 s
  mean against a pre-agreed 15 s line, so the SSE backend was **not started**), S3-063 (5.5 + 4.5 +
  9.1 = 19.1 s for one beat), S6-020 (first production measurements: judgment 3.1–4.0 s, narration
  3.6 s, reporter 6.8–10.0 s; **2 of 3 reporter calls `504 bedrock_timeout`**; ceilings rebound to
  15/18/20 s with the 15 s bound fixed in code), S6-021, S6-081 (SSE abandoned because the deployed
  path buffers; the typewriter is a client-side replay, with the cost quantified), S6-108/S6-128
  ("measurement and play optimize for different things"), S8-021, S8-032 / S8-W011 ("effort는 Haiku
  4.5 미지원, Sonnet 4.6은 low~max; 모델 권고: Nova 2 Lite 1차 / Haiku 4.5(thinking off) 2차"),
  S8-060, S8-W013 ("Re-measured after deploying: 5/5 pass, 6.80–10.00 s"), S9a-080 (Nova 2 Lite p50
  1.0–1.2 s with 100% JSON compliance; an explicit rule *not* to raise reasoning effort because
  thinking pushes p50 to 12–14.6 s, "past the presentation budget"), S9a-073 / S9a-W014 (a live
  7.4–29.2 s matrix), S9a-025 (dialogue 5.1 s / portrait 16.1 s "comfortably inside the 25 s
  fallback threshold, so §2.3's design is now empirically grounded"), S9b-185, S9b-046, S9b-160,
  S9b-018 / S9b-W007 (3 m 34 s door-to-door, first combat at 4.4 s); S7-001 (the Call-3 length/format
  policy as a standalone data file whose values are "v0 초기치 … 게임플레이 실측 후 조정").
- counter-evidence: **the latency budget was inherited, not derived.** S9b-185 / S8-060: the
  reporter's 7 s ceiling "came from apothecary's … The arithmetic was fine; the premise — that 7 s
  covers a call this tier had never made — was never tested"; the one call that passed under it "did
  not beat the clock by being fast, it beat it by breaking the contract" (16 sentences against a
  required 20–30). **The rigorous model-selection benchmark was dropped twice** (S4-072, S5-023), and
  the shipped model was chosen "on live verification of access and schema behavior, not on the
  model-selection benchmark the earlier plan required". **S6-022 decides model choice on measurement
  continuity, not speed**: Nova 2 Lite benchmarked at 4.19 s vs haiku 7.79 s on a byte-identical
  prompt and **rejected**, because the gap "is almost entirely that it writes **less**" and switching
  "would decouple the measured mechanism from the shipped system six days before the deadline."
  S6-080 / S6-076 show the team unable to state a latency budget for weeks and disqualifying its own
  figures. S4-009 left the budget unquantified as open question #7. **And the freedom levers make
  every call slower** (S2-069: 29.7 → 52.9 s), so T-02 and T-51 pull against each other with no atom
  resolving the trade.
- gaps: **the seed's actual claim — that pacing *serves the illusion of freedom* — attaches to
  nothing in 905 atoms.** Every latency atom links speed to build cost, judge attention, contract
  compliance or measurement budget; A1, A2, A3, A5, A6, A7 and A8 each looked for the causal link
  independently and none found it. **No atom reports a human judging that the game felt fast or
  slow** — the chain stops at seconds measured and never reaches perceived pace. No end-to-end
  production latency distribution exists.
- oral-only: **OH-3 §2 is the richest source on this theme and A6 ran the assigned corroboration
  check with a mixed verdict.** *Confirmed — the method shape*: "모델과 추론 강도만 바꿔가며" matches
  S8-032 / S8-W011 exactly, and S6-022 is precisely a hold-the-prompt-fixed, vary-the-model benchmark
  whose verdict weighs quality and latency together and is made by a human. *Contradicted — the
  scale*: **no atom records 수십~수백 runs of a model comparison.** Every model-comparison run count
  is small (3 then 5 in S8-060/S8-W013; 4 measured play paths in S8-032; 10/10 in S8-040). The only
  tens-to-hundreds program is the *mechanism* probe, which holds the model **fixed** ("모든 테스트는
  haiku", S8-036) and varies the stance set — the opposite variable. **The two programs appear
  conflated in memory, and A3 independently warns that reading S3-039's "381 attempts" as 윤석's
  sweep would be wrong.** *No trace*: "일주일은 걸렸을 일을 반나절 만에 결정했다" — nothing in any
  slice records elapsed time for any measurement program. *No trace*: "지연성을 게임의 일부분으로
  자연스럽게 풀어낼 수 있을까" — S8-051's typewriter transport is the nearest written thing and its
  stated reason is transport choice, not latency-as-aesthetic. **Do not launder any of this.**
- fit: #4 (why we chose the models and shapes we did) · #2 video beat (a 6.8–10 s call is a pacing
  constraint the video must respect)

### T-52 — Every model call has a deterministic understudy: the game is designed to survive the AI's absence
- thesis: Distinct from speed — the AI is architected to be *droppable*. Fallbacks are pre-authored
  and playable, the deployed build physically lacks the live path, and fallback is signalled honestly
  rather than disguised, so "no AI" is a designed state of the game rather than an error state.
- lanes: 1, 2
- origin: emergent (adjacent to seed 2)
- carried-by: S4, S5, S6, S8, S9b
- support: S4-065 (dev-middleware `apply: 'serve'` means "the deployed Pages demo is stub-mode **by
  construction**, and a client-side secret is structurally impossible"; one schema, two adapters, the
  renderer cannot tell live from stub), S4-068 ("Live AI is the demo's proof; stub is what judges on
  bad wifi get" — stub content written to paper-prototype quality), S4-071 / S4-W011 (valid requests
  degrade to a deterministic playable response, distinguished by an `x-llm-fallback` header), S4-052;
  S5-022 ("Provider failure does not block the game" — live and fallback both return HTTP 200,
  distinguished only by the header, and the client must treat fallback as valid dialogue), S5-036,
  S5-W003 (at-most-once idempotency: the key is durably claimed before contacting a provider, so a
  mid-flight crash returns `operation_outcome_unknown` rather than double-charging), S5-W013; S6-109
  (on final judgment-call failure the engine uses the pack's authored `default_stance` — it may not
  grab the first stance, which would be an undeclared baseline), S6-129; S8-020, S8-021, S8-W013 (a
  slow call returns a labelled `x-llm-fallback` 504); S9b-113.
- counter-evidence: S4-068's own framing concedes the deployed demo runs stub-mode **forever** —
  the shipped judge-facing artifact never demonstrates the AI at all, which is the cost of this
  pattern, not a benefit; S6-129 records the precedent-not-to-repeat (`demos/apothecary/` never set
  its endpoint variable, "which is why that demo runs stub-only today"). S5-022 notes model quality
  is "bounded by validation rather than guaranteed by it". S4-074 shows the corresponding *cost*
  guardrail (Lambda reserved concurrency) shipping **unset**, so robustness-by-construction was not
  applied uniformly.
- gaps: **no atom records how often fallback actually fired in play, or whether a player or judge
  could tell.** `x-llm-fallback` is an instrument nobody in the corpus reads.
- oral-only: none — this theme is entirely written.
- fit: #4 (reliability design) · #3

### T-53 — The judge's clock is the project's budget unit
- thesis: One declared optimization target — a judge who loads the page in ~1 s, plays minutes not
  hours and watches a 30–60 s video — is used across the corpus as the arithmetic behind scope cuts,
  content volume, architecture choices, demo staging and the decision to stop measuring. And one
  review seat exists solely to play the game the way that judge would.
- lanes: cross (1, 2, 3)
- origin: emergent (the mechanism serving seed 2)
- carried-by: S6, S9b, S1, S4, S9a
- support: S6-008 (the target declared as a permanent rule and identified as "a scope-cutting
  instrument as much as a UX goal"), S6-016, S6-082 (5–8 gates "because judges play minutes not
  hours, each gate is a heavy authoring unit, and 5–8 is what scenario generation can produce *and
  verify* inside its window" — content volume set by what can be validated), S6-072 (the demo opens
  on run 3 so the first 60 seconds show "insert a sentence → the judgment changes" instead of an
  empty tutorial), S6-094 (sessionStorage argued from the judge's first 60 seconds — localStorage
  "would drop a returning judge into someone else's run 4"), S6-068 ("콜 예산 소진 시 부분 스펙으로
  출하(허용), 일정 지연은 불허"), S6-039 ("다음은 측정이 아니라 구현"), S6-177, S6-022, S6-025 and
  S6-144 (the client claimed minimal-first by a non-specialist: "there is no frontend developer or
  designer on the team"), S6-003, S6-111; **the operator-advocate seat** — S9b-017 (`advance()`
  reachable only via `window.__app.drain()` under `?gate=1` — "the 3–5-minute run is proven only
  through a test-only API that does not exist on the page a judge loads"), S9b-018 / S9b-W007 (the
  fix accepted on a hand-played 3 m 34 s run), S9b-019 (the decision line measured at WCAG 1.31:1 —
  "the single most important pixel in the demo" — and the committed review screenshot *hid* the
  failure because it was captured at turn 1), S9b-051 (the PoC's waiting beat never happened at judge
  pace: both prefetches resolved long before a human reached a door, so the beat existed only through
  the fake clock), S9b-053, S9b-058, S9b-059, S9b-062, S9b-W006 (four of these became standing
  gates); S9a-016, S9a-015 ("accessibility is part of the judged experience, and retrofitting this
  after screens land is far harder than doing it at the token layer now"); S1-044, S4-034; S5-005,
  S5-018.
- counter-evidence: the target is repeatedly *overridden* by measurement and process — S6-064
  ("메커니즘 검증이 크리티컬 패스") put weeks of measurement ahead of content, and S6-106 accepted
  ~4.5 s per beat with the off switch deliberately unbuilt; both trade the judge's clock for
  evidence. S6-063 shows schedule pressure winning over verification, the same axis pointing the
  other way. S6-013 leaves a judge-visible surface (the README) stale. S9b-039 shows the seat with
  nothing to play on a build with no UI, degrading to prose that explicitly proves "the plumbing …
  not that the writing is good."
- gaps: **no atom measures actual page load or the actual first 60 seconds.** The target is asserted
  and used as an argument, never verified. No atom records a judge-pace finding the panel *disagreed*
  about, so how subjectively the seat's verdicts were treated is unknown.
- oral-only: OH-2's scoping-by-named-incapacity (one month, no game-dev experience, no designer, no
  engine developer) is corroborated *in effect* by S6-025 and S6-144, which name the missing
  frontend/design capability in writing. The one-month framing itself is oral.
- fit: #4 · #2 video beat (the 3 m 34 s hand-played run) · #5

### T-54 — Calls are effectively free; attention is not
- thesis: The binding resource was repeatedly re-identified — from machine time to human reading
  time to context window — and each identification produced a *zero-call* instrument that killed
  doomed experiments before they ran. Cost discipline here is an epistemic instrument, not a budget
  line.
- lanes: 1, 3
- origin: emergent
- carried-by: S3, S6, S9a (S3-carried)
- support: S3-004 (A3/A4: the plan's ~38 s per-call latency was subagent round-trip time, not model
  latency — real figure 3.5–7.2 s — and the program was re-sized around human blind-coding capacity,
  ~20 min per mechanism: **"Calls are effectively free; attention is not"**), S3-013 (three saturated
  gates were all answered in advance by the base's own leaning sections, so a zero-call paper check
  is now mandatory before spending 10 calls), S3-042 (FRESH-2STANCE killed by headroom arithmetic —
  at N10 even a perfect 10/10 live arm yields p=0.105), S3-045 (61 calls spent on a design that could
  not see any effect under 25 points), S3-009, S3-062 ("닫힌 질문에 쓴 콜은 전액 낭비다" — 20 of 40
  calls decidable by reading the suite file), S3-053, S3-048, S3-056, S3-019 (the unattended agent's
  scarce resource named as its own context window), S3-061; S6-177 (verification tiered by cost:
  free lint everywhere, one human read, live probe on the first gate only), S6-155; S9a-086 ("닫힌
  질문에 쓴 콜은 전액 낭비인데, 이번에 20콜이 그렇게 갔습니다" — answered with a static gate rather
  than discipline), S9a-084 (~15,000 lines of raw run artifacts marked "읽지 마세요" — the
  artifact-volume side of the same budget), S9a-071.
- counter-evidence: **the discipline was learned by overspending, repeatedly and late** — S3-045's
  61 wasted calls, S3-062's 20, S9a-086's 20, S8-038's 30, and S3-046's bias that "had gone
  unreported through seven write-ups; A9 had seen it once and nobody generalized until the review
  pass." S3-039 shows the program running to ≈555 of a 600-call hard stop, i.e. the cheap-kill
  culture did not actually reduce total spend. And S3-004's own premise was a measurement error: the
  budget was sized on a latency figure wrong by ~6×.
- gaps: **no dollar cost or token total for the program anywhere.** S3-018 says the agent "may spend
  hundreds of dollars of calls" and no ledger is mined; `artifacts/` and the per-run metrics JSONs
  are unmined and, at the snapshot, `artifacts/` did not exist. This matters if #4 wants a
  cost-of-verification number.
- oral-only: OH-3 §2's "일주일은 걸렸을 일을 반나절 만에 결정했다" is a time-compression claim of the
  same family but about the *model-selection* study (T-51), not this program. **Do not merge them.**
- fit: #4 (cost of AI-assisted verification) · #3

### T-55 — Exploration got cheap enough to be disposable — until the spec-first decree stopped it
- thesis: Between 07-23 and 07-26 the default epistemics were "build it and look": three demos, a
  fully live-verified backend and a deployable Lambda tier were produced and written off within days
  each, sometimes in the same commit. On 07-30 that default was explicitly banned. AI throughput made
  building cheap enough to be a *decision instrument*, and the correction was a process rule.
- lanes: 2, 1
- origin: emergent
- carried-by: S4, S5, S8, S9b
- support: S4-035 (146 passing tests across 11 files, live OpenAI/Claude/MCP/hosted-Skill
  verification, Docker E2E — marked "**Superseded (2026-07-25).** This service is retained as a
  verified reference implementation and will not be deployed", one day after its status entry),
  S4-W010 (the same backend measured green on both providers at ≈$0.059), S4-043 (apothecary v1
  shipped, merged, all gates green, then failed its playtest the same day), S4-044, S4-010 / S4-011,
  S4-051 / S4-W012, **S4-028** ("절대 구현·개발·작업부터 시작하지 않는다. 전체 아키텍처를 확정한
  뒤에 개발을 시작한다", with an architecture-freeze deadline); S5-038 (both pre-DDAY backends
  archived: "27k lines of unrelated service code at the repo root is the first thing a reader trips
  over"), S5-012, S5-010 ("missing assets or an unscoped `build.test` would waste a multi-hour run"
  — the counter-pressure); S8-032 (a fourth same-family concept built as a UI-less text demo, given
  four measured play paths and a Bedrock benchmark, and moved to `planning/` — all in one commit, on
  the day DDAY was confirmed), S8-022 (a complete LLM backend — REST/SSE, three providers, MCP/Skill,
  persistence, telemetry, Docker, live-tested at ~$0.059 — marked superseded **inside the same squash
  that added it**), S8-048, S8-041, S8-054, S8-012, S8-W011 (the shelved concept still produced the
  model recommendation that outlived it); S9b-114/115.
- counter-evidence: the prudence the theme says they lacked is also on the record — S4-047 (the team
  explicitly refused to stack two unknowns on a critical path), S5-010's dry-run discipline, S4-045
  (deliberate scope-fencing, later overturned by S4-061, but a considered position). The cost was not
  zero and the corpus says so: S8-038 (30 calls on a mis-specified gate), S8-061 (grants like
  `apigateway:TagResource` "cost a failed deploy to find"), S8-024 (the harness lost committed work
  twice in one run). **S8-009 shows disposability shading into churn** — the ascension gamble cut,
  restored ("운은 이 장르의 재미이고 … '돌릴까 말까'의 도박은 자원 관리보다 오래 기억된다") and cut
  again inside 48 hours, "each flip carrying its stated reason … the tension is that the reasons
  contradict." And S8-061's benchmark "dropped without a record" shows cheap exploration also
  producing cheap loss. The "cheap to build" reading is an inference from the discard rate; no atom
  states it.
- gaps: nothing costs the discarded work in engineer-hours, agent-hours or dollars beyond the
  ≈$0.059. Whether the 07-30 spec-first decree actually slowed the cadence is answered only by the
  post-snapshot commits.
- oral-only: OH-3 §1 states the causal link directly — "앞선 데모 3개의 실패 경험이 있었기 때문에,
  빠르게 구현하는 쪽보다 기획 단계에 시간을 더 쓰는 쪽을 택했다." **S4-028 records the decree but not
  its stated cause**; the causal attribution is oral-only.
- fit: #4 (process evolution) · #2 video beat · #5

### T-56 — What the method cost, in the units the record actually kept
- thesis: The corpus prices the method in four currencies — wall clock, usage limits, failed
  attempts and API spend — and in each case the number sits next to the decision it drove. It is the
  only quantitative account of the harness's economics, and it has no totals.
- lanes: 2
- origin: emergent
- carried-by: S9b, S5, S8, S3
- support: S9b-181 (≈24 h wall clock as an eleven-unit serial chain vs ≈12–16 h restructured — a
  scheduling decision made on an estimated cost), S9b-004 (the account usage limit hit mid-run; the
  cross-session resume re-churned already-merged units; two units finished by hand), S9b-184 (two
  failed deploys, one per missing IAM grant), S9b-149 ("cost 30 calls"), S9b-153 (381 calls across 8
  phases), S9b-113 (~$0.06 for a live two-provider verification), S9b-W011 (761 judgment calls behind
  p=0.0000595), S9b-186 (the deadline priced into a model decision: "six days before the deadline"),
  S9b-W001 / S9b-W004 (876/876, 1270, 132 e2e as the recurring unit of "a run's output"); S5-028 /
  S5-W001 (8/8 scenarios on both providers, ≈$0.059 recorded to the cent), S5-W012 (~$0.48 per 100
  playthroughs, a 2.5× candidate ratio), S5-025, S5-018 (LLM image reads rationed: ≤2 per attempt,
  capture capped at 4); S4-020 (~18,000원/month surveyed, Bedrock proposed with zero experience and
  marked *to investigate*), S4-074 (the kill switch ships unset and the doc says so); S8-022, S8-038.
- counter-evidence: **there is no token or dollar total anywhere in 905 atoms, no per-run cost, and
  no comparison against a human-only baseline.** Every figure is incidental to another decision. The
  headline efficiency claim in the project's story is therefore **not evidenced by the corpus.**
- gaps: a cost sweep needs the harness repo's run logs (off-corpus, sibling repo) and the API billing
  (off-repo). S6-184 records that even the run's own token telemetry was partly lost to
  interruptions. S9b-181's ≈12–16 h estimate has no recorded outcome — the post-snapshot tail would
  contain it.
- oral-only: OH-3 §2's "일주일은 걸렸을 일을 반나절 만에" and §3's "에이전트가 백그라운드에서 도는
  동안 나는 잠을 자거나 문서 작업을 했다" are **oral-only for the efficiency claim** — and S9b-004,
  S9b-040, S9b-041, S9b-042 and S9b-044 complicate the sleeping: a busy operator making dated rulings,
  taking manual measurements and hand-finishing units mid-run.
- fit: #4 (cost and throughput) · #5

---

# H. Process history, and the record as an artifact

### T-57 — The concept phase was built as a comparison funnel, and the winner came from outside it
- thesis: Selection machinery came first — a template whose stated purpose was side-by-side
  comparability, honesty rules to stop well-written unverified docs winning, a cap on differentiators
  used as a maturity test — and it merged eight concepts into three tracks, then declared documents
  insufficient and handed the verdict to playable demos. The concept that won followed none of it.
- lanes: 3
- origin: emergent
- carried-by: S1, S4, S6, S8, S9b
- support: S1-001 (identical section numbers mandated, reordering forbidden — "섹션 번호가 어긋나면
  항목별 비교가 깨진다"), S1-004 (Appendix A must state when no validation exists, because "격차를
  숨긴 기획서는 비교 단계에서 과대평가를 만든다"), S1-007 (exactly three differentiators; "3개로 못
  줄이면 컨셉이 아직 덜 선 것이다"), S1-025 (blacksmith → apothecary with admission criteria and an
  itemised survived/dropped list), S1-030 (roguelike × autobattler → agent-arena argued from each
  parent's unsolved problem, on deliberately neutral ground, while flagging the union's own 3-week
  overflow), S1-052, S1-029 ("기획서가 아니다 — … 최종 판단은 데모 베이크오프가 한다"), S1-031,
  S1-033; S4-001 (six concepts consolidated into three tracks, each merge with its recorded reason),
  S4-007, S4-018 (examples so thin that "두 사람이 서로 다른 게임을 상상한다"), S4-017; S6-048 (six
  proposals → three demo tracks), S6-047 (the selection instrument was a playable bake-off, and the
  기획서 template and paper-test workflow were retired); S8-010 ("6 concepts consolidated into 3
  tracks, demo bake-off under demos/<slug>/ decides the final concept"; rough demos due 07-24, lock
  07-25), S8-007 ("the comparison machinery is the artifact"), S8-004 (CLAUDE.md deliberately kept
  concept-neutral until a concept is selected), S8-012, S8-013; S9b-103, S9b-106, S9b-111.
- counter-evidence: **the funnel did not select the winner.** S1-036: DDAY does *not* follow the
  template, opens with "darkest-context의 문제", is dated 07-27/28, and became the concept —
  the process produced three losing finalists and the winner arrived outside it; S8-031 records DDAY
  confirmed and simultaneously moved *out* of `demos/` — "declared the game while explicitly never
  having a demo". S4-021 records the confirmation with **no minutes for the discussion that produced
  it**. The funnel's own input count does not reconcile: S1 holds eight concept docs, S4-001 and
  S8-010 say six proposals. And S4-019 shows the two humans did not agree on what the bake-off was
  optimizing for.
- gaps: what actually happened at the 07-22 review, and on what axes the three tracks were compared,
  is in no slice. The 6-vs-8 count discrepancy is still open. **S4-021's `record-gap` — the
  07-24→07-28 new-concept discussion has no artifact at all.**
- oral-only: OH-1 §6's process shape (many concepts → merge to 3 → 3 demos → comparison → *new*
  concept discussion → confirmation) is corroborated link by link but **not** in its causal ordering.
- fit: #4 (process) · #5

### T-58 — Three demos built, none won, a fourth concept won — and the reasons are almost entirely oral
- thesis: The team deferred the concept decision to *played* demos, ran the comparison, killed
  everything in it, and confirmed a concept that had never been in the bake-off — drafted as a
  replacement for the thing a demo proved didn't work. The written record carries the outcome and
  almost none of the reasoning.
- lanes: cross (1 for the designs, 2 for the builds; the selection itself has **no lane**)
- origin: emergent
- carried-by: S1, S4, S6, S8, S9a, S9b — **and this theme carries the corrected sequence**
- support: S4-010 (Doodle Life **v1** built and evaluated as a failure: 1–2 min latency, call
  failures, dreamlike dialogue), S4-011 (**v2 rebuilt and cut after actual play** — "실제 플레이 후"
  — dragging placement with it), S4-W008 (v2's drawing-to-character visual output), S4-W009
  (apothecary v1 built and merged by the harness from a one-page PRD), S4-021 ("**DDAY** 컨셉으로
  확정" — neither 07-24 finalist, first appearance in the meeting record), S4-022, S4-023, S4-024;
  S9a-006 (a doodle-life request-first playable demo PR — 45/45 tests, live OpenAI eval records,
  42.5 kB bundle — **closed unmerged**: "Since we decided not to continue on the doodle-life concept,
  please close this PR"), S9a-078 (the apothecary-gameplay-to-Lambda PR: six automated screenshots,
  `network-evidence.json`, 1,067 tests, two live 200s with `x-llm-fallback=false` — closed unmerged
  on 07-29 when the team pivoted), S9a-W016; S8-W002 (apothecary shell shipped by the first
  super-pipeline run), S8-019 (its verdict: "shell works but stubbed AI demos the wrong thing"),
  S8-W003 / S8-028 (darkest-context shipped playable), S8-030 (DDAY lands as "darkest-context 데모의
  어거지 매핑 문제에서 출발한 대체 컨셉 초안", 07-29), S8-032, S8-046 (phase flipped demo →
  production; demos become frozen history); S1-036, S1-012; S6-035 (the bake-off's losers stay
  deployed at `/<slug>/` as evidence of the selection process), S6-048; S9b-106, S9b-115.
- counter-evidence: **the known-wrong input lives here and is preserved, not overwritten.** S8's own
  OH-1-corroboration prose concludes "the count is two", "Doodle Life … no build commit and no
  `demos/` directory ever", "Doodle Life cut pre-build." OH-4 resolves this against the repo: Doodle
  Life *was* built into a demo, was never deployed, and survives only as screenshots. Both are left
  standing. **A residual gap remains inside the written record**: S4's own corroboration section
  states that at 07-24 only Doodle Life had a playable demo, apothecary was still generating, and
  Agent Arena had **none** — and no S4 atom records an Agent Arena demo ever existing. So the written
  slices now evidence Doodle Life (correcting S8) and apothecary and darkest-context, but the
  reconciliation of *which* three is not clean. **Preserve both counts; do not average them.**
- gaps: **the reasons the demos lost are almost absent.** Only S8-019 (apothecary v1 demoed the shell,
  not the AI) and S8-030 (darkest-context's 어거지 매핑) appear; nothing on Doodle Life's verdict or
  on apothecary v2. The Doodle Life screenshots are **off-repo** and, per OH-4, would need
  `assets-manifest.json` entries to enter. A pros/cons write-up of the three unpicked concepts
  (OH-2's inclusion question (a)) does not exist and needs an interview.
- oral-only: **the causal content of the pivot is the single most important undocumented decision in
  the project.** OH-2 §5: 약국 worked but its calm genre felt less fun; 다키스트 컨택스트 was fun with
  potential but too close to Darkest Dungeon, forcing a change; the move was to keep its *verified*
  core (grow-agent-by-prompt-injection + spectate), whose open problems *dissolved* once reframed as
  "build an agent that solves a single task", then drop the team's weak spots (graphics/animation) →
  a text deduction game. **None of this reasoning appears in any slice.** A4, A6, A7 and A8 each
  checked independently. S8-030 confirms DDAY's *origin* in a demo failure but not the reframe.
- fit: #4 (trial and error / the discovery phase) · #2 video beat · #5

### T-59 — Inherited numbers carry inherited assumptions: copy-forward as a named failure class
- thesis: DDAY was built by salvaging the previous build cycle — a Lambda copied, a bootstrap stack
  reused, a runbook's constants adopted — and the clearest causal chain in the corpus is that each
  inherited artefact carried the lifecycle it was authored for and broke exactly where the new use
  differed. The team eventually named the class.
- lanes: cross (1, 2)
- origin: emergent
- carried-by: S6, S8, S9b (cross-slice)
- support: S6-180 (the apothecary runbook: 7 s model / 9 s API / 10 s Lambda, 400-token output —
  "the fossil record of the 08-04 budget failure: a per-use-case number (7 s for a 400-token dialogue
  call) traveled into a different workload as if it were a constant"), S6-021 ("The arithmetic was
  sound; the premise … was never tested"), S6-020 (the failure it produced), S6-018 (the update-only
  IAM role: the bootstrap stack correctly reused for the bucket and OIDC provider, but its execution
  role — policy literally named `UpdateLlmLayerResources` — had no `lambda:CreateFunction`, no
  `iam:CreateRole`, and an apigateway grant pinned to apothecary's API id; "a least-privilege policy
  encodes the lifecycle it was written for, and a create path is a different lifecycle from an update
  path"), S6-019, S6-099 ("Two contracts in one function is how a live deliverable breaks — the copy
  exists so the working one is never at risk", plus an in-place "That was wrong"), S6-115, S6-129,
  S6-043, S6-181; S8-060, S8-061 (samconfig "inherited apothecary's update-only execution role", so
  the first deploy died at CREATE_FAILED then ROLLBACK_FAILED — "it could not delete what it had not
  been allowed to create"; the atom names it "**the same copy-forward mistake as the latency
  budget**"), S8-055, S8-059, S8-W013 (the corrected end state: re-measured 5/5, ceilings ordered
  model 15 s < route 18 s < Lambda 20 s, `src/config.ts` pinned so no environment can outlive it);
  S9b-185, S9b-184, S9b-187, S9b-191.
- counter-evidence: **salvage also worked, repeatedly** — S6-099 (the copy strategy kept the live
  demo safe), S6-043 (an archived implementation earning its merge), S6-018 (the bucket and OIDC
  reuse "was correct"), S6-044 (plumbing built ahead of the concept decision on the grounds that it
  is concept-agnostic — a bet that paid), S5-W013 (the archived thin Lambda→Bedrock shape named as
  the DDAY runtime template), S8-022 (a *deliberate* non-copy-forward with next-work items explicitly
  voided). **S6-092 is the strongest counter**: the team's prior written position that relocating the
  harness "buys nothing and costs provenance" turned out to be wrong on both halves — the
  conservatism about moving inherited things was itself the error. And S7 has no atoms here at all:
  the data layer was authored fresh for DDAY and is untouched by this class.
- gaps: no atom enumerates what else was inherited from the demos and never re-validated; a sweep of
  the post-snapshot commits for "inherited"/"apothecary" reasoning would size the class. No cost
  accounting for salvage overall (S6 records the three IAM rounds, not the hours).
- oral-only: none. OH-3 §1 credits the demo failures with a *process* lesson and no oral account
  mentions the technical debris they left.
- fit: #4 · #3

### T-60 — Nothing is erased: reversals annotated in place, dead doctrine kept visible
- thesis: The project systematically preserves superseded positions, dead channels, losing arguments
  and its own blemishes, and pays real usability costs to do so — a discipline that starts as a
  competition constraint (history is a graded deliverable) and becomes the project's general
  epistemic habit. Decisions are stored *inside* the thing decided.
- lanes: cross (1, 2, 3)
- origin: emergent
- carried-by: S4, S5, S6, S7, S8, S9b
- support: S6-002 (main history frozen because "Commit history is a competition deliverable" —
  mistakes must be documented, not rewritten away), S6-092 (a spec keeps its own overturned argument
  next to the evidence that killed it: "Both halves turned out to be wrong."), S6-069 (the archived
  기획서's header names its three superseded claims while the body is kept verbatim "as a record of
  what was believed on 07-29"), S6-052 (archive files keep links to old document names *on purpose*;
  a redirect table pays the usability cost), S6-040, S6-123 (the losing deletion arguments preserved
  with their reopening condition), S6-146, S6-194 (one commit missing its assistant co-author trailer
  is kept and pointed at, because "history must not be rewritten"), S6-032/080/081/099 (four further
  reversals recorded in place, including "That was wrong." left visible in a binding document);
  S4-058 ("~~LLM fully stubbed~~ — superseded after the v1 playtest"), S4-069 ("that was v1-era
  doctrine and is exactly what the playtest failed"), S4-036 (a voided section enumerating exactly
  what carries forward, with deploy-path items struck individually), S4-070 / S4-W004, S4-071,
  S4-032; S5-012 / S5-W006 (the frontend-mod v1 killed by a code-grounded review session and the
  verdict recorded **in the document header**), S5-023 ("Re-running a protocol built for a different
  game would invite the wrong comparison" — killed measurement work, killed on purpose, with the
  reason), S5-039 (an explicit take/leave table at archive time so the port is copy-not-edit),
  S5-021; S7-001 (a `purpose` field recording its own architecture decision — "the decision record is
  the artifact"), S7-015 (unresolved semantics shipped as inline ⚠ — "the schema refuses to pretend
  decisions were made"), S7-017; S8-022, S8-035, S8-037 ("the nesting diagnosis is withdrawn, not
  confirmed"), S8-051 (the design doc reconciled with three inline corrections naming each superseded
  claim), S8-060 (Nova 2 Lite's rejection recorded "so the question does not get re-opened from
  memory"), S8-048; S9b-114 (#15 deliberately closed, then reopened six minutes later and merged:
  "preserved/superseded reference work로 취급"), S9b-127 ("자료 보존을 위해서 PR Approve해주시면"),
  S9b-129 (139 files moved as pure `git mv`, 100% rename detection, 64 broken links → 0), S9b-132,
  S9b-101, S9b-158 ("이 PR의 리뷰 승인이 곧 전환 합의입니다").
- counter-evidence: **preservation has its own failure mode and the corpus shows it.** S6-013 (a
  stale README read as a current claim rather than as a record), S6-051 / S6-178 (a scattered
  cross-track list going stale undetected), S6-012 (a drifted copy). S6-069 and S6-146 show the cost:
  a reader must check a header or a warning box to know whether the body is true. **S6-030 is a
  genuine counter-case inside the game design** — a removed block is discarded, not shelved, and
  there is no discard inventory; the preserve-everything instinct was explicitly refused where it
  would cost UX. **S8-009** shows a record that annotates every reversal does not thereby become
  consistent ("the reasons contradict"); S8-061 records a benchmark "dropped without a record";
  S8-031 records an AGENTS.md drifted to "`.Codex/super/` 오기"; S9b-130 shows an entire merged PR
  silently absent from `main` for a day. And **S4-021** is the sharpest: the single most important
  pivot of the project left no record at all — *the convention is strongest exactly where the stakes
  are lowest.*
- gaps: **no atom shows anyone reopening a preserved argument**, so the discipline's payoff is
  asserted and never observed. No atom shows a future session actually *using* a carry-forward list
  or a strikethrough correctly. The 117 post-snapshot commits are where that would show.
- oral-only: none. OH-4's finding is the inverse case and belongs to T-63.
- fit: #4 (how the record was kept) · #3 · #5

### T-61 — The process was engineered to leave evidence, and the deliverable partly assembled itself
- thesis: Because *how the team orchestrates AI* is graded, the repo's rules were written to make the
  evidence a by-product of normal work — manifest entries at asset-creation time, raw call logging in
  the runtime, personal-account attribution, immutable history, a PR template feeding the
  deliverables — and one section of deliverable #4 was in fact auto-drafted by the harness from run
  telemetry, TODOs and all. Then it was superseded by this mining program.
- lanes: cross (2, 3)
- origin: emergent
- carried-by: S4, S5, S6, S8
- support: S6-015 (the brief recorded: "we're looking for **directors of AI**"; "the process is a
  graded surface, so it is engineered to leave evidence"), S6-004 (every asset manifested at entry,
  "No exceptions, no 'add it later'"), S6-193 (the payoff: the draft reproduces all eleven apothecary
  assets with tool, license and the full generation prompt each, "because deliverable #4 asks for the
  instructions given to AI"), S6-088 (every production call must retain prompt, response and latency,
  justified jointly by balance analysis and the competition's orchestration documentation —
  "designed into the runtime rather than collected afterwards"), S6-001, S6-002, S6-028, **S6-184**
  (the section auto-drafted by the end-of-run report agent — "Every number and link below was read
  from run state … nothing is estimated" — with twelve visible TODOs and the instruction "do not
  delete a TODO by guessing"), S6-198, S6-010, S6-042; S5-007 / S5-W009 (an end-of-run agent
  specified to mine `board.json`, the backlog, run stats, the `[AGENT:]` trail and
  `assets-manifest.json` into `docs/deliverables/ai-utilization.draft.md`, on the premise that "the
  harness itself *is* the 'director of AI' narrative"), S5-004, S5-003; S4-026 ("AI 활용 문서의 핵심
  단락감" — a meeting marking its own paragraph), S4-030, S4-016 (the pipeline source can't be
  published, so the method is evidenced by "구조 설명과 작업 증거"), S4-059, S4-034, S4-048; S8-003
  (the five judged deliverables fixed on day two, before concept selection), S8-001 / S8-W001 (the
  first commit renders a placeholder canvas "so the GitHub Pages deploy pipeline can be verified
  visually before the engine/genre is chosen").
- counter-evidence: **the self-drafting deliverable did not happen as designed** — S5-007's own atom
  notes "This mining directory is the successor to that draft — mining README Phase 5 subsumes it."
  That is a reversal at the heart of the theme and must not be smoothed over: *the mining effort
  producing these very atoms exists because the auto-draft could not cover the whole.* The evidence
  chain has recorded holes: S6-188 (six substantive reviews exist only in local run state while the
  PRs show zero threads — flagged by the drafting agent itself as a claim the deliverable must not
  overstate), S6-184 (unknown total tokens, an unrecorded skip reason, absent open-source license
  attribution), S6-197 (1 of 6 screenshot attempts skipped with the reason unrecorded), S6-194,
  S6-198 (one run of several covered). S4-016 also concedes the strongest evidence — the harness
  source — cannot be shown at all.
- gaps: **no atom says why the auto-draft was abandoned**, and the draft artifact itself, if
  generated, is not in S4/S5. S6 has no atom for the v1 shell run, the concurrent darkest-context
  run, or any manual Claude Code session (S6-198 names all three as uncovered).
- oral-only: none in support. OH-4's "a repo-mined history cannot see work whose artefact was never
  committed" is the strongest available counter and is oral-only — see T-63.
- fit: #4 (this document's own provenance) · #5

### T-62 — Provenance recorded as data — legible and leaky
- thesis: Because AI contributions were trailered per commit, ownership stamped into artifacts and
  assets manifested at creation, the repo accidentally contains a machine-readable record of which
  model did which kind of work — and, in the same record, four identity leaks the project's own hard
  rules exist to prevent.
- lanes: 3 (with 2 and 4 in the leaked commits)
- origin: emergent
- carried-by: S8, S3, S7, S6
- support: S8-056 (six Claude variants split by work: `Fable 5` 47 on planning/docs/scenario/
  mechanism-harness; `Opus 5` 28 + `Opus 5 (1M)` 12 on architecture/proxy/engine and the translation;
  `Opus 4.8` 16 + `(1M)` 11 on the first pipeline runs and early CLAUDE.md; `Sonnet 5` 2; five
  `Codex` on assets/backend), S8-011, S8-013 (a whole-concept replacement authored by Codex —
  cross-vendor authorship on a creative artifact), S8-023 (Codex + gpt-image-1 for asset packs, and
  `USER <user@AL02375929.local>` leaked into permanent history "on exactly the asset work the manifest
  rule exists to keep clean"), S8-058 (`Claude Agent <agent@example.com>` placeholder on two
  high-stakes landings — a shipped demo and a live Lambda deploy), S8-057 (39 commits under a personal
  `13579wkd@naver.com`, distinct from the `alstjgg` noreply the identity rule names; **no corporate
  address anywhere**), S8-006, S8-002, S8-062 (two subject styles, 23 Korean subjects, the em-dash and
  English shift both beginning at the 07-29 pivot — "the commit stream itself records the phase
  transition in its formatting"); S3-020 (`owner: 윤석 · authored unattended, pending review`, each
  authoring choice listed in the suite's `_authoring_provenance`, plus an OWNERSHIP_NOTICE), **S3-064
  (the only atom in 905 that names a non-Claude assistant in an artifact header: "Owner: 윤석. A안
  직접 선택; Codex가 실행 형식과 이 감사를 구조화했다. 최종 검토 대기.")**, S3-028, S3-055, S3-049;
  S7-004 (a sha1-identified byte-identical source copy shipped as provenance); S6-001, S6-004,
  S6-194, S9a-025, S9a-065, S9a-068.
- counter-evidence: **every count is over a truncated 153-commit prefix** — S8-058's "exactly these
  two commits", S8-023's "the lone machine-local trailer", S8-011's "only 2", S8-056's per-model
  totals and S8-002's "33 of 153" could all move with the 117 unmined commits. S8-057 shows the hard
  identity rule satisfied in *intent* (personal, never corporate) while drifting from its letter, so
  "legible provenance" and "rule-compliant provenance" are not the same finding. **S3-064 carries the
  multi-vendor claim single-handed**, from one line in one file header with an uncertain date
  (`2026-07-29?`), and nothing shows 윤석 exercising the rejection right the ownership protocol
  reserves for him.
- gaps: trailers record *which model was invoked*, not how much of the diff it wrote or whether a
  human rewrote it — S8-056's division-of-labour reading is an inference from commit subject matter,
  not a measurement, and nothing in the corpus can size it. **A repo-wide grep for `Codex` and other
  tool names in `planning/` and commit trailers would settle whether the workflow was single-vendor
  — and if #4 claims it was, S3-064 contradicts it.** That check belongs to the pre-Phase-3 sweep.
- oral-only: **neither narrator mentions Codex or any non-Claude tool.**
- fit: #4 (tool inventory / provenance) · #5 · #3 (the asset/manifest deliverable)

### T-63 — A repo-mined history is blind exactly where the biggest decisions were made
- thesis: The mining that produced these atoms demonstrates, against itself, that a self-audit
  conducted through a git repository cannot see (a) work whose artifact was never committed, (b) work
  that moved or was renamed out of where the miner looked, and (c) anything past the snapshot. All
  three are visible inside the corpus, and one produced a **false finding that reached an atom file**.
  This is the concrete argument for why the oral-history slice exists, and it generalizes.
- lanes: 3 (method), bearing on all four
- origin: emergent — **and this is the map's strongest method finding**
- carried-by: S4, S5, S6, S7, S8, S9a, S9b
- support: **(a) never committed** — S8's OH-1-corroboration prose reasoned from "no build commit and
  no `demos/` directory ever" to "Doodle Life cut pre-build", a conclusion OH-4 overturns; S8-061 (a
  model-selection benchmark "dropped without a record"); S8-055 (checks that "ran only when someone
  remembered", leaving no trace when they didn't); S4-021 (the DDAY decision documented as an outcome
  only — the discussion produced no record); S4-008 / S4-W001 (the 07-24 minutes are a structured
  artifact of a ~91-minute recording — "전사 원본 기준" — and **the source transcript is not in the
  repo**: the evidence base for several founding decisions is itself an AI product, one processing
  step removed from what was said); S4-053 (the harness diff uncommitted on a branch; "the installed
  `~/.claude/` copy is what the run actually uses"); S6-188 (six substantive reviews existing only in
  local run state); S9a's gap on `.claude/super/` (gitignored by hard rule 4, so the orchestrator's
  failure rate is structurally unmineable — T-26). **(b) moved or renamed** — S8-031
  (`demos/dday-simulation` lived under `demos/` "for only hours" before moving to
  `planning/dday-poc`), S8-032 (field-report created under `demos/` and moved to `planning/` in the
  same commit), so a `--diff-filter=A` sweep of `demos/` returns two directories while four concepts
  passed through it; S5-038 (77 files of service code moved to `planning/legacy-services/` and
  declared out of corpus — real work the mining can only see through a README). **(c) truncation** —
  S8-056, S8-057, S8-062, S8-002, S8-011, S8-058, S8-023 all state counts over a 153-commit prefix of
  a history that had 117 more commits at mining time; S7's file header records that `artifacts/` — the
  measurement-*outputs* root that `data/` exists to feed — **did not exist at the snapshot at all**,
  so every metric in S7-014 and every run field in S7-015 is a contract with no instance. **The
  counter-technique the project itself invented**: S7-004 (the pack ships a byte-identical copy of its
  source draft precisely so provenance survives independent of history).
- counter-evidence: **the repo caught things memory did not.** S8-030's exact date and wording for
  DDAY's origin, S8-009's three-way flip-flop, S9a-038's slash/dash branch forensics and the entire
  failure record of T-10/T-12 appear in *no* oral account — the written channel is not merely lossy;
  it is the only channel with the failures in it, and A6 makes the point sharply: **neither OH-1/2/3/4
  mentions a broken test, a false gate, or CI.** S8's coverage header is also explicit and honest
  about its own boundaries, so this is under-counting by method, not by carelessness. S4-032 / S4-W002
  argue the opposite locally (the 07-30 minutes actively maintained with cross-references, closing 8
  of 9 tracked items), and S4-016 is a deliberate bet that the repo *is* a sufficient record.
- gaps: **nobody has enumerated what else the repo cannot see.** The Doodle Life screenshots are the
  one named off-repo artifact (OH-4); there may be others — the S8-032 benchmark raw data, a
  whiteboard, chat logs, the S4-008 recording. Only interviews find these. The pre-Phase-3 sweep
  closes (c) and neither (a) nor (b).
- oral-only: the Doodle Life build and its screenshots rest on **OH-4 alone**; no S7/S8 atom evidences
  the build and S8's own text says the opposite. OH-4's generalization — "any team auditing itself
  through its own repo will systematically under-count work that never landed" — is the framing; the
  corpus supplies at least six independent written instances of the *pattern*, so the pattern is
  written even though its flagship case is oral.
- fit: #4 (method / provenance) · #5

---

# I. Kept singletons — themes one slice carries alone

Per the brief: proposed, not pruned. Each is marked THIN and each says what would corroborate it.

### T-64 — Refusal as an instrument: untested capability is forbidden capability
- thesis: The team repeatedly drew the trust boundary at the exact edge of what it had measured — a
  capability that passed a test was given to the AI, an adjacent untested one was withheld and
  hand-authored instead — and matured this into a general practice of declining to build, deciding in
  advance how a bet will be killed, and constraining its own future repair options.
- lanes: cross (1, 4)
- origin: emergent
- carried-by: S1 + S6 (cross-slice, but each half is thin)
- support: S1-026 (the blacksmith's H4 — can AI hold a multi-visit world without contradiction — was
  left unrun, so apothecary restricted recurring-customer arcs to pre-authored 2–4-visit closed units
  *because* open-ended continuity was unverified: "AI의 개방형 캠페인 유지는 미검증이다. §5.8이 아크를
  사전 저작 단막으로 제한하는 이유다"), S1-025, S1-004, S1-011 (the roguelike names its P0 unknown and
  pre-commits to a degraded fork), S1-018, S1-045 (v1 measurements declared invalid for the chosen
  model tier — the team invalidating its own evidence when the model changes); S6-106 (the Call-2 off
  switch deliberately unbuilt, with a re-examination trigger named — "do not build it in advance"),
  S6-122 (`facts` declared "a bet that the objective log can be made by an LLM" with its deletion
  clause pre-written), S6-091 (the fix space constrained in advance so the easy repair is off the
  table), S6-123, S6-124, S6-070 (a non-goals list naming two rejected AI-maximalist architectures as
  load-bearing scope defense), S6-161 (C-TEMP cut from the player-mechanism inventory *despite* clean
  verified evidence — "scope discipline over sunk evidence"), S6-169 ("the absence is recorded here as
  deliberate, not an omission"), S6-089, S6-101, S6-085, S6-075, S6-078, S6-030, S6-042.
- counter-evidence: **the rule was not applied evenly and no refusal has been observed holding.**
  S1-018: the one unverified concept was carried into the comparison and into a merge, not killed;
  S1-011: the roguelike's flagship differentiator knowingly rested on an unverified API capability;
  S1-013 → S1-041: a belief founded on measurement propagated for a week and was then falsified.
  S6-065 records the core technology nearly narrowing *anyway*; S6-146 shows a refusal-shaped outcome
  arriving by attrition rather than by decision; S6-063 shows a scheduled verification simply skipped
  rather than declined; S6-106 trades ~4.5 s per beat for its refusal, a cost the judge pays.
  **A5 flags the structural problem: every member of the S6 half is a document declining to do
  something, and no pre-written funeral has been executed — all triggers are still pending at
  snapshot. This may be "the specs say they are disciplined" rather than "the team was disciplined."**
- gaps: whether the withheld capabilities were ever tested later; whether any pre-written funeral
  fired. Both are post-snapshot.
- oral-only: none.
- fit: #4 (how AI's scope was bounded) · #3

### T-65 — Two people, three weeks, no artist: incapacity as an active design force
- thesis: The team's named incapacities are not background context; they appear inside individual
  design decisions as the deciding argument, and the winning concept is the one that converted the
  biggest incapacity into an aesthetic.
- lanes: 1
- origin: emergent — **the exclusion list itself is oral-only**
- carried-by: S1 + S6 (thin on both sides)
- support: S1-034 (quarter view rejected because "아이소 에셋 비용이 2인 3주에 과함"), S1-033 (a
  second consumable resource killed because it costs more in implementation and tuning than it
  returns), S1-030 ("시스템 폭증 — 두 원본의 합집합은 3주를 넘는다", with the cutline deferred),
  S1-010, S1-045, S1-044 (text mystery — "그래픽이 중요한 게임 불가" surfacing as a positive aesthetic
  decision rather than an apology), S1-047 (scenario authoring named as both the largest risk and the
  team's least-confident area), S1-043; S6-025 ("there is no frontend developer or designer on the
  team; it gives an idea of what could have been, not a blank"), S6-144 (the client deliberately kept
  off the critical path of the game *existing* — "a scope hedge for a team without a frontend
  specialist"), S6-016.
- counter-evidence: the discipline has a hole — S1-030 flags the 3-week overflow and then *defers*
  the cut; and more sharply, S1-036 / S1-038: with roughly ten days to deadline the team started an
  entirely new concept and commissioned five fresh scenario drafts. Schedule pressure shaped a hundred
  small decisions and did not prevent the one large restart. **No S1 atom prices anything**, so
  whether "2인 3주" was a real budget model or a rhetorical device cannot be answered from concept
  docs.
- gaps: actual throughput lives in the commit/PR record and in the 117 unmined commits.
- oral-only: the exclusion list itself — no physics, no graphics-heavy, no sprawling story — and the
  one-month / no-game-dev-experience / no-designer framing (OH-1, OH-2). **A1's corroboration hook 2
  records it as appearing nowhere in `planning/concepts/` as a list**; S6-025 and S6-144 corroborate
  the missing frontend/design capability *in effect* only.
- fit: #4 (constraints that shaped the architecture) · #5

### T-66 — The boundaries were argued from other games' corpses and from market data
- thesis: Where the AI is kept out is a *researched* position: each guardrail is anchored to a named
  precedent — a postmortem, a survey, a published benchmark — rather than to taste, and the research
  lives inside the concept docs.
- lanes: 1
- origin: emergent — **THIN, S1 only**
- carried-by: S1
- support: S1-054 (L.A. Noire — acting decoupled from variables makes reading a coin flip; Vaudeville
  — an LLM holding the truth collapses deduction; inZOI — LLM translation nobody needs to read is
  "cosmetic" — each mapped to a specific guardrail), S1-016 (Bot Land's postmortem: died of being
  perceived as "for programmers" even though scripting was optional → node graphs, conditionals and
  settings panels banned from the UI), S1-017 (Quantic Foundry 2025-12, 85% of gamers negative on
  in-game genAI, read specifically as hostility to free-text chatbots, used by *two* docs), S1-014
  (TextStarCraft II and kin cited for LLMs being weak at coordinates/ticks and strong at enumerated
  judgment), S1-015 (persona research: vivid personas are stable, mild ones unstable → 「겁이 많다」
  admitted, 「다소 신중하다」 banned).
- counter-evidence: **the research is unevenly distributed** — no atom records a research section for
  blacksmith, darkest-context or DDAY, so *the concept that won has no cited precedent*. S1-022 is the
  counterweight in kind: the single most-propagated design law in the slice came from one playtester's
  sentence, not from any study. And S1-017's use is post-hoc — the survey justified a rule the team
  already had (see T-01).
- gaps: the atoms record the citations but not their quality (sample, date, whether the Quantic
  Foundry figure says what the docs claim). **If #4 quotes any of these numbers they need re-checking
  against the source, which is off-repo.**
- oral-only: OH-2's memory that "시장 조사를 은근 많이 했는데, 각 컨셉 문서별로 있던 것으로 기억" —
  S1 confirms the per-doc placement for four docs, which settles OH-2's inclusion question (b)
  affirmatively for those four.
- fit: #4 (why these boundaries) · #3

### T-67 — The failure mode the team feared was illegibility, not error
- thesis: Before any engine existed, the team's model of how AI ruins a game was not that it decides
  wrongly but that the player cannot *trace* the decision. Fairness was operationalised as
  traceability, and every concept staked its first build week on it.
- lanes: 1
- origin: emergent — **THIN, S1 only**
- carried-by: S1
- support: S1-056 (across autobattler, placement, doodle-life and roguelike the #1 risk row is the
  same failure in genre-specific dress — interpretation felt as "bad RNG", translation as lottery, VLM
  missing intent, 60-second spectation boring — each bound to a declared top build target), S1-013
  ("해석의 다양성은 콘텐츠, 소급 불가능한 판단은 버그다"), S1-055, S1-049 (the VLM must ground every
  trait in visible strokes and mark uncertainty rather than invent), S1-022 (정오 낙인 금지 — internal
  grades exist, correct/wrong is never displayed), S1-054.
- counter-evidence: **S1-041 breaks the frame** — agents cited sentences *opposite* to their
  behaviour, which is not illegibility but confident *false* legibility: a worse failure than the one
  the team had prepared for, and it arrived from measurement rather than foresight. S1-042 then shows
  the team reversing valence and *selling* the gap between log and report as information; S1-032 has
  the engine deliberately manufacturing unreadable inputs as level design. Both "illegibility is the
  enemy" and "illegibility is the product" hold, in that order.
- gaps: whether players experienced the shipped game as traceable is unanswerable from concept docs.
- oral-only: none.
- fit: #4 (fairness / guardrail design)

### T-68 — Should the machinery show? Two opposite answers, both kept
- thesis: Within one week the team held contradictory positions on whether the agent-engineering
  underneath should be visible to the player — hide it behind card grammar, or show it nakedly as the
  game's own vocabulary — and the winning concept is the reversal of the earlier rule.
- lanes: 1
- origin: emergent — **THIN, S1 only**
- carried-by: S1
- support: S1-016 (autobattler bans node graphs, conditionals and settings panels; the screen must
  read as a card game, and the agent-arena brief carries it verbatim: "내부는 에이전트 엔지니어링,
  화면은 카드 게임"), S1-036 (DDAY inverts it — the fantasy mapping "성격이면 Prompt, 물건이면 MCP"
  *was* the source of dissonance, so "매핑을 버리고, 노골적으로 에이전트 게임을 만든다", with
  token/context/compact as rules because they are real), S1-044 (the interface stops disguising
  itself: the watch screen is a self-writing document, props are all paperwork), S1-037.
- counter-evidence: **this theme is a contradiction and is recorded as one, not resolved.** Neither
  position is retracted: S1-016's rule is argued from Bot Land's death, which was never refuted —
  DDAY simply found a different audience premise. And the reversal is partial at the mechanic level:
  S1-043's drag-a-sentence UI is card-like inside the naked-agent game. Note also **S5-033** ("성격이면
  Prompt, 익힌 기술이면 Skill, 손에 쥔 물건이면 MCP" proposed *as* the item system) — the mapping DDAY
  discarded was a considered design bet elsewhere in the corpus, which makes the reversal a real
  disagreement rather than a correction.
- gaps: whether "naked agent vocabulary" reads to a judge who does not build agents is exactly the
  risk Bot Land died of, and only playtest or judge feedback settles it. Nothing in the corpus does.
- oral-only: OH-2 §5's reason chain (darkest-context "다키스트 던전과 너무 유사" forcing a concept
  change, then the "단일 태스크 에이전트" reframe dissolving its problems). S1-036 carries the
  dissonance argument in writing; the too-derivative argument is oral only.
- fit: #4 (the pivot) · **#2 video beat — the video's first impression is this decision**

### T-69 — The team named the deliverable's thesis while still choosing the game
- thesis: The competition's judging criterion was itself a design input during the concept phase:
  every concept doc was required to carry a denser AI-utilization section, and one doc names in
  advance what the team believed the AI-utilization document would be *about*.
- lanes: 3
- origin: emergent — **THIN, S1 only, and deliberately not padded**
- carried-by: S1 (2 atoms)
- support: S1-006 (the template makes §6 "AI 활용" mandatory and denser than the other sections, with
  two required prose subsections — fairness/guardrails plus "AI가 무엇을 할 수 없는가", and
  cost/latency design — driven by the competition's "AI의 감독" theme, so no concept could be compared
  without first answering what the AI is kept from), S1-053 (Placement declares "프롬프트 엔지니어링이
  곧 엔진 엔지니어링이며, 대회 'AI 활용 기술문서'의 중심 서사다", ~07-22). A1 explicitly declined to
  pad this with S1-001/S1-004, which are comparison hygiene rather than competition awareness.
- counter-evidence: **the named narrative did not survive.** S1-053's thesis is
  prompt-engineering-as-engine-engineering, argued from Placement's validator pipeline — and Placement
  was absorbed the next day (S1-052), while the concept that won is described in S1-036/S1-040 in
  terms of temperament, timelines and belief-state. **If #4 uses S1-053's framing it will be quoting a
  dead concept's self-description.**
- gaps: whether the team kept revising its own deliverable thesis between 07-22 and now is not visible
  in S1; S6 and the post-snapshot commits hold the current answer. This is one of the themes most
  exposed to the 117-commit gap.
- oral-only: none.
- fit: #4 (framing / meta)

---

# Seeds

All three seeds attach. None is `seed-unevidenced`. Each attaches with a qualification the atoms
force, and in two cases the qualification is more interesting than the seed.

### Seed 1 — 닫힌 환경에서의 최대의 자유도
**ATTACHED, strongly, in all ten slices** — the best-evidenced claim in the corpus. Carried by
**T-01, T-02, T-03**; the team states it almost verbatim (S1-043, S1-050 "열린 콘텐츠, 닫힌
프로토콜", S6-079) and gives it an operational failure mode ("an escape option", S3-041/S3-051), a
mechanism (S6-084's two-item whitelist), and an empirical basis (S6-054, S6-037, S8-040).

Two qualifications Phase 3 must carry:
1. **The closed half is engineered; the freedom half is unmeasured.** Not one atom in 905 measures a
   player feeling free. The seed is a design goal throughout and never an observation.
2. **The measured record is a story of narrowing.** Across S3, S6 and S8 the freedom on offer got
   smaller (two channels → one, species restricted, execution grading off, recall impossible,
   temperament made invisible and immutable). S2-015 gives the floor: with no temperament authored,
   the space collapses to 24/24 — the system's default state is *no* freedom, and the freedom is
   entirely an authoring cost.

The seed's own causal provenance — that it *started from* the membrane agreement, and that the final
concept combines mitigations #1 and #3 of a three-item taxonomy — is **oral-only (OH-1 §2, OH-2 §3)
and appears in no slice.** Four agents checked independently.

### Seed 2 — '게임'으로 느껴지기 위한 속도감 (pacing as technique)
**ATTACHED as practice, UNEVIDENCED in its stated mechanism.** Carried by **T-51, T-52, T-53**.
Latency discipline is everywhere and is genuinely load-bearing: a permanent rule written before any
measurement (S6-006), fiction invented to hide calls (S6-045, S1-034, S1-044), a "Never a spinner"
rule (S4-068), measured ceilings that changed what got built (S3-059, S6-020, S8-W013), and a model
rejected on the pair of quality and latency (S6-022, S8-060, S9b-186).

**But the 2026-08-05 clarification's actual claim — that pacing is a technique *serving the illusion
of freedom* — attaches to nothing.** A1, A2, A3, A5, A6, A7 and A8 each looked for the causal link
independently; every latency atom connects speed to build cost, judge attention, contract compliance
or measurement budget instead. S2-069 is the sharpest complication: **every axis of freedom in T-05
makes every call slower** (29.7 s → 52.9 s), so seeds 1 and 2 pull against each other and no atom
resolves the trade. And S3-063's 19.1 s per beat argues against a pacy read of the mechanism itself.

Phase 3's choice: narrow seed 2 to "pacing as a first-class engineering constraint" (fully
evidenced), or keep the illusion-serving claim and mark it as a design intention with no written
trace.

### Seed 3 — 끝까지 AI가 하지 못하는 것: "재미있나를 판단하는 것"
**ATTACHED AND CONTESTED.** Carried by **T-46, T-47, T-48**. The governance rule is written,
repeated and enforced across every slice ("판정은 사람이 한다", S2-022; "판정은 사람이 카드를 보고
내린다", S4-033; "Produce evidence, not verdicts", S3-018; "Amendments are proposed, not enacted",
S8-042). The strongest single instance is S2-040, where the human accepted the AI rubric's fairness
and **rejected its valence**.

Against it, and not smoothed over: agents made accepted aesthetic calls repeatedly (S9a-016,
S9a-052, S9a-015, S9a-080; S9b-053, S9b-058, S9b-059, S9b-052, S9b-019), a design *skill* produced
the client's visual target (S9b-174), feel was encoded as a competing review lens (S5-005) and by
08-03 agents were judging visual divergence in-loop (S5-W007), the project operationalised fun as a
measurable policy gap before any playtest (S6-145), the single most consequential design cut was made
by a p-value (S8-041), and the team's own recommendation was to keep an **LLM as the judge** of
player solutions (S2-039). The humans also did not always exercise the reserved faculty (S6-063,
S9a-W011, S4-019, S4-012).

The seed's stated ancestor — the "게임은 왜 재밌을까" discovery phase and its five-item list — is
**oral-only (OH-1 §5, OH-2 §4), with no trace in any slice.**

Phase 3's choice, in ascending order of what the atoms support: (a) "AI never got to judge fun" —
contradicted; (b) "AI judged proxies for fun; humans judged whether it was worth keeping" —
supported; (c) "the team kept redrawing where AI judgment stops, and by 2026-08-03 it had moved
twice" — supported and more interesting.

---

# Lane findings

Every agent was asked whether the four lanes survive its evidence. Six of eight independently
reported the same three strains. This is a convergent finding, not one agent's opinion.

1. **There is no lane for verification/measurement, and it is a large fraction of the corpus.**
   S3 is 61-of-65 tagged lane 1, but its actual subject is *measuring whether an AI mechanism works*
   — an activity borrowing lane 1's subject matter and lane 2's orchestration machinery; its runbook
   atoms carry `lanes: 1, 2` and belong fully to neither. A5 reports the same strain in S6 (lane 1
   doing two jobs: the game's LLM layer, and the program that studies it) and proposes 1a/1b. A2
   reports it in S2 (LLM-as-instrument vs LLM-as-runtime). **Notably, OH-3 organises his own account
   by activity and names 검증 as one of four, coordinate with 대화 / 구현 / 재미 — the narrator's own
   taxonomy has the category the lane list lacks.**
2. **Lane 2 contains at least four separable mechanisms.** A8 names them: the run-control surface
   (T-20/T-21), the review panel as an epistemic apparatus (T-22/T-23/T-24), specification-as-
   orchestration (T-28, arguably lane 3 wearing a lane-2 tag), and infrastructure the harness cannot
   touch (T-47/T-63). A7 names a fifth from the atoms' own vocabulary: `proposed:harness-ops` is
   flagged on S9a-022, S9a-038, S9a-070, S9a-071 and S9a-093 — orchestration plumbing that fails in
   its own characteristic ways. A4 proposes **2a agent-authored production** vs **2b harness/
   orchestration engineering** and notes that in S4+S5 the second vastly outweighs the first. A3 warns
   that **lane 2 in S3 is *not* super-pipeline** — the overnight measurement runbook is a separate
   delegation harness with its own boundary document, exception channel and scarce-resource model, and
   **a lane-sharded Pass B is at particular risk of merging them.**
3. **Lane 3 as defined ("meeting summarization, doc drafting, housekeeping") misfits nearly all its
   atoms.** In S6 and S9a it is humans *architecting documents for agents to consume* — an interface,
   not a summary. In S8 it is doing two unrelated jobs (provenance/convention atoms vs
   documents-as-machine-interfaces). In S2 it never appears alone, only as a co-tag. In S9b it is
   where the two humans argue. A5, A6, A7 and A8 independently recommend renaming or splitting.

Two further findings, each from one agent but checkable:

4. **Lane 4 should split into generate / judge, or the judging half needs its own home.** A1 and A2
   both find lane 4 carrying two opposite halves of a handoff — AI generates candidates, and *humans
   judge* — and note that merging them makes seed 3 look weaker than it is (the seed lives entirely in
   the human half). A3 adds that lane 4's gloss should widen: in S3 the AI generates candidate
   *mechanisms* and an *instrument plus a human* judges them. A5 reframes lane 4 in S6 as not
   "AI-as-creator" but **"AI behaviour as authoring physics"** (T-42).
5. **A large residue has no lane at all, and it is not noise.** A4: eight S4 atoms tagged `unclear`
   are the concept merge, the bake-off schedule, the divergent-mental-models discovery, the
   judging-criteria disagreement, the DDAY confirmation and the spec-first decree — *the decision
   spine of the project*. A5: ~30 S6 atoms cluster into infrastructure/deploy and schedule/scope
   decisions. A6: the S8 win-sweep header records the miner explicitly **re-assigning W012/W013/W014
   from lane 1 to lane 2** ("build/infra events, not in-game") — the scheme visibly straining. **The
   four lanes have no home for ordinary engineering the AI helped with, nor for human decision-making
   about an AI project, and the deliverable will need one or will silently drop the substrate the
   other lanes stand on.** A6 adds a sixth absence: **no lane covers "AI auditing the project's own
   record" — which is what this Phase-2 work is.**

**No lane dies on this evidence.** Lane 1 is absent from S9b's manual half and lane 2 is entirely
absent from S1, S2 and S7 — the last of these is a real structural fact, not a mining artifact:
**S7 has zero super-pipeline atoms because the data pipeline, compiler and lint were built outside
the harness**, which bounds the claim "the game was built by agents" and should be said in #4.

---

# Reconciliation notes for Pass B

Recorded so the reconciler can tell an artefact of framing from a finding:

- **Sharding by slice made chronology and document-shape visible** and cut capability-shaped patterns
  in half. The clearest example: the membrane (T-01) appears in ten slices as ten different
  activities, and only the merge shows it is one rule.
- **A5 flagged its own document-shaped candidates** rather than hiding them, per `theme-format.md`'s
  warning that a theme carried entirely by S6 is usually a description of a document: **T-53** (the
  judge's clock — asserted in CLAUDE.md then cited as an argument in a dozen documents, with nothing
  in S6 measuring a page load), **T-64**'s S6 half (every member is a document declining to do
  something, with no funeral executed), and **S6-079's thesis sentence specifically** ("the game is a
  proof that generative freedom can be staged on a controllable structure") which **reads as
  competition-pitch copy and should not be quoted as evidence of anything except intent.** T-02
  survives because S6-054 and S6-037 are measurements, not prose.
- **A5 also flagged its own weakest provenance**: T-61 and the harness half of T-22/T-26 are mediated
  entirely through `ai-utilization.draft.md` — a document about events in S5/S9a/S9b's territory. They
  should be reconciled against those slices rather than trusted from S6.
- **Two atoms are single-handedly carrying claims** and should be checked before Phase 3 leans on
  them: **S3-064** (the only mention of a non-Claude assistant in 905 atoms — see T-62) and
  **S7-016**'s "the only means that worked" claim, which cites no experiment and is complicated by
  S8-044's 8/10 at a different call (see T-06).
- **Atoms whose home is contested** — flagged by their agents for re-homing: S3-057 (designed-vs-
  accidental LLM leakage, which no theme carries well), S9a-085 (the strongest
  prompt-engineering-as-measurement atom in the corpus, currently in T-06), S2-020 (a register of
  *unmeasured* levers — if Phase 3 wants a "what we deliberately did not measure" theme, this atom is
  its seed and it is under-served here), S9b-122 and S4-026 (both the replication-as-decision-standard
  claim; merged into T-34), S5-032 ("AI output as a leak vector into committed artifacts" — a real
  angle with only one atom).

---

# Report

**Themes: 69 records, of which 1 (T-35) is a merge pointer with no independent content — 68
substantive.** Folded from 141 candidates returned by the eight agents.

**THIN (carried by a single slice): 8** — T-08 (S2), T-23 (S9b), T-27 (S9a), T-31 (S9a), T-43 (S2),
T-49 (S9b), T-50 (S4), plus the S1 quartet T-66/T-67/T-68/T-69 — which is 11 by strict count; T-64
and T-65 are two-slice but thin on both sides and are marked as such in-record. The remaining ~57 are
cross-slice, and 6 of them (T-01, T-02, T-46, T-51, T-60, T-63) are carried by six or more slices.

**Seeds surviving: 3 of 3.** None is `seed-unevidenced`. Seed 1 attaches strongly but its freedom
half is unmeasured and its trajectory is toward narrowing. Seed 2 attaches as engineering practice
and **its stated mechanism — pacing serving the illusion of freedom — has no written trace anywhere
in 905 atoms.** Seed 3 attaches as a governance rule and is contradicted as a description of
practice. Each seed's own causal ancestry is oral-only.

## The three gaps I would most want closed before Phase 3

1. **The DDAY pivot's reasoning — the project's single most important decision — is oral-only.**
   S4-021 records the outcome with an explicit `record-gap`; S8-030 confirms DDAY's origin in a demo
   failure but not the reframe; no slice carries OH-2 §5's chain (약국 worked but too calm →
   다키스트 컨택스트 too derivative → keep the verified core → reframe as "single-task agent" → drop
   graphics → text deduction). **Closable only by interview**, and it is the load-bearing narrative of
   #4's trial-and-error section. Adjacent and equally oral: the demo-loss reasons and the Doodle Life
   screenshots (off-repo; would need `assets-manifest.json` entries per hard rule 5).

2. **Whether the design laws and the claims cap survived into the shipped system — one grep of the
   post-snapshot tail answers both.** T-37's payoff (do `no recall mechanic`, `fact + self-narration
   only` and `stance-only fixed deltas` hold in the engine?) and T-19's forbidden-phrasing cap (did
   S3-052's owed controls ever run?) are both decided by the 117 unmined commits and PRs #110/#116's
   endings. **T-19 is self-referential and urgent: if the owed controls did not run, #4 must use
   S3-052's exact sanctioned wording about C-BLOCK, and Phase 5 is the first real test of that rule.**
   The same sweep resolves S9a-075's membrane residual, S9b-191's unproven IAM→Bedrock path, and
   whether T-27's review-decay finding inverts.

3. **A denominator for the review panel — the corpus can say what the method caught, never how often
   it ran and found nothing.** S9a deep-mined 40 PRs *selected for having activity* and left 46
   zero-activity bodies unread; S9b's win-sweep read only the two strongest verdicts per integration
   PR out of 46/48/60 submissions. So "the multi-agent panel demonstrably works" is supportable as
   *it repeatedly caught real defects a green suite passed* and **not as a rate** — and the verdict
   census would also settle whether S9b-038's three-way divergence or S9b-W014's thirteen-thread
   unanimity is typical, which is the number that decides what #4 may claim about panel independence.
   Two cheap sweeps close it: read the 46 skipped bodies, and count verdicts across the integration
   PRs' review submissions.

Runners-up, in case Phase 3 has budget: whether M4 (option-order bias) was ever run — it conditions
every mechanism result at once (T-32); and a repo-wide grep for `Codex` and other non-Claude tool
names, because **S3-064 alone would contradict a single-vendor claim in #4** (T-62).

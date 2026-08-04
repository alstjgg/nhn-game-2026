# Atoms — S8 commit history of `main`

Snapshot: main @ 5a3c388, mined 2026-08-04.
Coverage: FULL. All 153 commits read with bodies and trailers
(`git log 5a3c388 --format=... %b`, 6621 lines). For the ~15 notable one-offs
in `corpus-commits.md` I also inspected `git show --stat` (9ddf731 = 812 del /
3 files; 9351e86 = 89 files / +19676; 08ccc73 = proxy/{events/call.json,
scripts/bundle-smoke.cjs}; 179fcf1 = 558 del). demos/ add-history mined for
OH-1. Bodies are dense with reasoning here; many single squash commits carry a
dozen sub-commit bodies, so some atoms cite a SHA whose event lives in one
sub-body. Squash-merge PR subjects that carry no reasoning of their own (pure
`Merge pull request #N`) are not atomized unless the merge body itself decides
something. Korean quoted verbatim.

---

### S8-001 — Deploy pipeline verified before the engine or genre existed
- source: commit d0d057d
- date: 2026-07-20
- lanes: 2 AI-building-the-game
- event: The repo's first commit was an "engine-agnostic skeleton" that "renders a placeholder canvas so the GitHub Pages deploy pipeline can be verified visually before the engine/genre is chosen." Vite + strict TS, Pages deploy on push, `.gitignore` already excluding `.claude/super/`.
- tension: Infrastructure-and-deployability was proven on day one, before any game decision — the "main stays deployable" rule (CLAUDE.md #3) is load-bearing from the empty state, not retrofitted.
- quote: "Renders a placeholder canvas so the GitHub Pages deploy pipeline can be verified visually before the engine/genre is chosen."
- flags: boundary

### S8-002 — First concept doc carries no AI co-author trailer
- source: commit 72f996e
- date: 2026-07-20
- lanes: 3 AI-in-planning
- event: "Add game concept doc: Agent Ascension (agent roguelike)" — the project's first design pitch — has no `Co-Authored-By` trailer, unlike almost every later doc commit. Committed by C9Boom7 directly.
- tension: The very first creative artifact is one of only 33 of 153 commits with no AI attribution; a boundary marker for where human-only authorship sat at the outset (later the default inverts to 78% AI-co-authored).
- links: contrast S8-005 (same concept rewritten with Opus 4.8 trailer next day)
- flags: boundary

### S8-003 — Real competition requirements + CLAUDE.md seeded on day two
- source: commits 59ba1e8, 97327427
- date: 2026-07-21
- lanes: 3 AI-in-planning
- event: The placeholder competition.md was replaced with "the real '5 deliverables + rules' content from the official notice, replacing the setup-time placeholder. Deadline ~2026-08-10," and CLAUDE.md was written wrapping the repo's hard rules. Both carry `Claude Opus 4.8 (1M context)`.
- tension: The five judged deliverables (including the AI-utilization doc this mining feeds) were fixed before concept selection — the rule set exists "because of those requirements."
- flags: boundary

### S8-004 — CLAUDE.md deliberately kept concept-neutral during selection
- source: commit a26f0683
- date: 2026-07-21
- lanes: 3 AI-in-planning
- event: A commit removed concept-specific mechanics from CLAUDE.md: "Multiple concepts are being drafted; don't single one out as leading or bake its mechanics into repo rules until a concept is selected."
- tension: A decision to keep the repo's permanent-rules file free of any concept's fingerprint until a bake-off decided — process discipline that later let DDAY replace the demos without a rules rewrite.
- quote: "don't single one out as leading or bake its mechanics into repo rules until a concept is selected"
- flags: decision, boundary

### S8-005 — Agent-roguelike reframed for the competition; English chosen, *.ko.md gitignored
- source: commit db97c7b
- date: 2026-07-21
- lanes: 3 AI-in-planning
- event: The concept doc was rewritten "from a general game pitch into a competition submission doc, written in English," mapping to NAN 2026 judging criteria and the five deliverables, and adding "Ignore *.ko.md so translated working copies stay local." Compaction was demoted from a core gambling mechanic.
- tension: First recorded language-of-record decision — English for the submission artifact, Korean working copies kept out of the tree. Predates the 08-02 docs translation by ten days.
- links: S8-011, S8-050 (9ddf731)
- flags: decision

### S8-006 — Two commits authored under the bare `alstjgg@users.noreply` identity
- source: commits fc8e438, d3a69819
- date: 2026-07-21
- lanes: 3 AI-in-planning
- event: The paper-prototype test protocol and report were committed by `MinSeo Park <alstjgg@users.noreply.github.com>` — the bare GitHub-noreply form (no numeric prefix), which appears on exactly these 2 of 153 commits. No AI trailer on either.
- tension: A third distinct identity for the same human (alongside `26458319+alstjgg` and `13579wkd@naver.com`); the repo's own identity rule names the `alstjgg` account but the address form drifts across a machine/config boundary.
- links: S8-057 (naver.com identity), S8-058 (placeholder identities)
- flags: boundary

### S8-007 — Concept-doc template built for apples-to-apples comparison
- source: commit d81716d
- date: 2026-07-22
- lanes: 4 AI-as-creator, 3 AI-in-planning
- event: A "game-concept proposal template & agent-executable writing guide" was added — a fixed 10-section + 2-appendix structure "for apples-to-apples comparison," with project invariants (membrane, proxy, balance-as-data) baked into the template and apothecary as the reference implementation.
- tension: The concept set was engineered to be comparable before any concept was written — the comparison machinery is the artifact, and the membrane invariant is imposed on every concept from above rather than debated within one.
- links: OH-1 hook 3 (many concepts → merge to 3); corroborates S1 hook-1
- flags: decision

### S8-008 — The autobattler consistency promise was deleted for good
- source: commit c8acdfc
- date: 2026-07-22
- lanes: 4 AI-as-creator
- event: The prompt-autobattler concept rewrite dropped "the 'same prompt = same temperament' consistency promise; fairness now rests on attribution (intent telegraphs + round reports citing cause cards), not determinism claims," and declared card/equipment UI grammar a hard rule (Bot Land postmortem as counter-example).
- tension: A design claim the team could not honor (LLM determinism) was replaced by an attribution model — fairness reframed from "same input → same output" to "you can always see why." The membrane's UI-not-text rule gets a named counter-example.
- quote: "Drop the 'same prompt = same temperament' consistency promise; fairness now rests on attribution"
- flags: reversal, boundary, ai-limit

### S8-009 — The ascension gamble was cut, restored, and cut again
- source: commits 72f996e, 8b14a06, d4a7e11, db97c7b
- date: 2026-07-20 → 2026-07-22
- lanes: 3 AI-in-planning
- event: The compaction "clear gamble" (0.5% clear chance, +0.5pp per use) shipped in the first concept doc (72f996e), was demoted in the competition rewrite (db97c7b, "drop the cumulative clear-probability design"), then explicitly "restored" — "운은 이 장르의 재미이고... '돌릴까 말까'의 도박은 자원 관리보다 오래 기억된다" — and promoted Nice→Must (d4a7e11 8b14a06), before the roguelike track itself was later merged away.
- tension: A single mechanic reversed direction three times inside 48 hours, each flip carrying its stated reason (measurement-judgment conflict vs. "luck is this genre's fun"). Captured as one atom of the flip-flop; the tension is that the reasons contradict.
- quote: "운은 이 장르의 재미이고, 로그라이크에서 '돌릴까 말까'의 도박은 자원 관리보다 오래 기억된다"
- flags: reversal, contradiction

### S8-010 — Six concepts narrowed to three merge tracks; demo bake-off decides
- source: commits 8a45a22, 149cc2c, 8288(#9 merge eb36f16)
- date: 2026-07-22
- lanes: 3 AI-in-planning
- event: CLAUDE.md was split from mutable state ("CLAUDE.md now holds only permanent rules plus a pointer to docs/status.md"), recording the 07-22 decision: "6 concepts consolidated into 3 tracks, demo bake-off under demos/<slug>/ decides the final concept." The concept-review meeting note names the three tracks (apothecary+blacksmith, doodle-life-lab+seat-puzzle, agent-roguelike+autobattler), rough demos due 07-24, lock 07-25.
- tension: The selection method was fixed as build-and-compare, not argue-and-pick — three demos would decide. (The eventual winner, DDAY, was in none of the three.)
- links: OH-1 hook 3/6; corroborates S1 hook-3, S4 atom-001
- flags: decision

### S8-011 — Meeting-note commits are the only work attributed to Claude Sonnet 5
- source: commits 8a45a22(#8), 14cce30
- date: 2026-07-22
- lanes: 3 AI-in-planning
- event: The two commits carrying `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>` are both meeting-notes housekeeping — the concept-review note and a follow-up attributing "자리좀봐주세요/오토배틀러 to 민서 in meeting notes."
- tension: In the co-author model taxonomy, Sonnet 5 (2 commits) did only light meeting-record work; the heavier lanes went to Fable 5, Opus 5, and Opus 4.8 — a visible division of AI labor by model.
- links: S8-056 (model taxonomy)
- flags: measurement

### S8-012 — Blacksmith absorbed into apothecary with an evidence audit
- source: commit e576d79
- date: 2026-07-22
- lanes: 4 AI-as-creator
- event: "Per 2026-07-22 meeting decision. Three ideas kept, each mapped to existing apothecary systems: 단골 아크... [정석]/[실험] declared-risk crafting... 연쇄 결과," while "Dropped: economy/능력 격차 (scope)... 흑막 route (already present)," with the "unvalidated-H4 gap recorded in 부록 A."
- tension: Concept merges were done as selective absorption with per-idea rationale and an explicit record of what was dropped and why — kept ideas were the ones with "Test 1 evidence."
- links: corroborates S1 hook-3
- flags: decision

### S8-013 — Doodle Lab wholesale-replaced with Doodle Life (Codex-authored)
- source: commit edafc86
- date: 2026-07-23
- lanes: 4 AI-as-creator
- event: "docs: replace Doodle Lab concept with Doodle Life" — a whole-concept replacement (302 deletions per corpus manifest) carrying `Co-Authored-By: Codex <noreply@openai.com>`, one of only 5 Codex-attributed commits.
- tension: An entire concept was swapped rather than revised, and the swap was done by a different AI (OpenAI Codex) than the Anthropic models doing most planning — a rare cross-vendor authorship on a creative artifact. (Doodle Life is later played-and-cut with no demo build — see OH-1 section.)
- links: OH-1; S8-056
- flags: reversal

### S8-014 — First super-pipeline run seeded; harness install made profile-aware
- source: commits 6ea2afd, 6c786e9
- date: 2026-07-24
- lanes: 2 AI-building-the-game
- event: "chore: super-pipeline run-20260724-145432 시작 (대시보드 PR 시드)" seeded the first multi-agent run (the apothecary UI shell), preceded by a harness note: "install is now profile-aware (both CLAUDE_CONFIG_DIRs)."
- tension: First appearance of the run-orchestration machinery on main; the dashboard-PR-seed convention and the `[run-YYYYMMDD-HHMMSS]` tag are introduced here and recur through the whole corpus.
- links: S8-015…S8-023 (the run's units)
- flags: decision

### S8-015 — u3 shipped twice — the pipeline resumed and re-landed a unit
- source: commits 1808015(#20), b158d21(#23), e924be1
- date: 2026-07-24
- lanes: 2 AI-building-the-game
- event: The apothecary data-schema unit "u3" landed as PR #20 and again as PR #23 with near-identical bodies, then got a post-run direct fix (e924be1, `fix(apothecary/u3): validate dialogueNodes/observationClues elements`) after the run closed. u2 similarly appears twice (#19, #24).
- tension: The parallel-worktree pipeline re-manufactured units on resume; the corpus's "u2/u3/u5 appear twice" is visible here as duplicate PRs plus a hand-fix landing outside the run — the harness does not perfectly single-thread a unit.
- links: S8-016, S8-034 (9351e86 branch-history loss)
- flags: failure

### S8-016 — A resumed unit was verified without re-manufacturing its code (YAGNI)
- source: commit 98448be
- date: 2026-07-24
- lanes: 2 AI-building-the-game
- event: "[u2] IMPLEMENT (green): verify pure-TS phase FSM — resumed pipeline, no new code": "u2 implementation already committed (4db3a32); TDD-Red suite is 77/77 green and full suite 200/200... YAGNI — no production code added. Records the resumed-state / RED-not-remanufactured note in DISCOVERY.md."
- tension: An IMPLEMENT phase that deliberately produced nothing because the resumed pipeline found the work already done — the harness's phase tags can fire on an empty diff, and that state is recorded rather than papered over.
- flags: boundary

### S8-017 — Raw NUL bytes made the most logic-dense file unreviewable
- source: commit 6c82c7a (u3, in PRs #20/#23)
- date: 2026-07-24
- lanes: 2 AI-building-the-game
- event: `canonicalKey` "embedded raw NUL (0x00) bytes as the field delimiter, which made git classify the whole file as binary and rendered the resolver — the most logic-dense file in this unit — unreviewable on the PR diff (CLAUDE.md rule 2: readable code review/history is a competition deliverable)." Replaced with escape sequences, behavior-preserving.
- tension: An agent-authored implementation detail silently defeated code review — and the fix is justified by the competition rule that makes the diff itself a deliverable. Recurs later in the harness (S8-045, SENTINEL NUL bytes).
- quote: "rendered the resolver — the most logic-dense file in this unit — unreviewable on the PR diff (CLAUDE.md rule 2: readable code review/history is a competition deliverable)"
- flags: failure, boundary

### S8-018 — First run's honest final gate; portraits left as CSS placeholders
- source: commit 39555a0
- date: 2026-07-24
- lanes: 2 AI-building-the-game
- event: "[u9] Juice pass + full-loop e2e + phase screenshots + DISCOVERY" — "e2e/full-loop.spec.ts is the honest final gate: plays both customers end to end in the real app... zero console errors + zero external requests," with "DISCOVERY.md populated with the three deliverable lenses (spec gaps, UI-verification friction, pipeline gaps)." "Portraits remain CSS placeholders — no raster shipped, no assets-manifest entry needed."
- tension: The DISCOVERY-doc convention (a run reporting its own gaps) lands here; the run consciously ships without generated art to avoid a manifest obligation — asset rule 5 shapes what the demo omits.
- links: S8-024 (v2 verdict says stub demos the wrong thing)
- flags: measurement, boundary

### S8-019 — The v1 demo's playtest verdict: "shell works but stubbed AI demos the wrong thing"
- source: commit 64428359
- date: 2026-07-24
- lanes: 3 AI-in-planning
- event: The apothecary PRD v2 opens with the v1 playtest verdict: "shell works but stubbed AI demos the wrong thing. v2 must-proves: live LLM dialogue (dev-proxy, no client secrets), multi-verb beats, diegetic patience, async NPC/portrait generation... Brownfield run on v1."
- tension: The first playable demo failed at the one thing the competition judges — it demoed the shell, not the AI — and a second full super-pipeline run was launched on top of it to fix that. The pattern (a demo failure forces a redirect) prefigures the DDAY pivot exactly.
- quote: "shell works but stubbed AI demos the wrong thing"
- links: S8-047 (DDAY born from the darkest-context demo's mapping failure)
- flags: failure, pivot

### S8-020 — Live-AI seam introduced as "provided inputs" the agents cannot self-verify
- source: commits 65c14701, 8fdf0527
- date: 2026-07-25
- lanes: 1 AI-in-the-game, 2 AI-building-the-game
- event: A dev-proxy (`/ai/health|/ai/dialogue|/ai/portrait`), a shared stub/live contract+validator, and `data/generation.json` (style bible, verb costs, trait table, "membrane-safe composition") were committed as "provided inputs for v2 run," with "unit v1 narrowed to stub adapter + boot wiring (the only part agents can verify themselves)" and "keys server-side process.env only; dev-serve only so the deployed build stays stub-mode by construction."
- tension: A boundary between what the multi-agent run is allowed to build and what a human hands it pre-built — the live LLM seam is a provided input because "the only part agents can verify themselves" is the stub. Secret-safety is enforced structurally (dev-only middleware), not by policy.
- flags: boundary, decision

### S8-021 — The thin Lambda+Bedrock proxy chosen over an always-on agent server
- source: commits d20d609(#48), 7bf1e28(#54)
- date: 2026-07-25
- lanes: 1 AI-in-the-game
- event: 윤석's investigation (from the 07-24 demo mid-check action items) "recommends a thin, sessionless turn-decision proxy (API Gateway + Lambda + Bedrock Runtime) over an always-on agent server, with per-turn structured input and deterministic fallback," and the handoff records verified AWS/Bedrock state and "no-realtime-images (single-provider runtime)."
- tension: The runtime-LLM architecture (CLAUDE.md's proxy tier) was decided here as a cost/latency simplification — stateless per-turn calls, not a stateful agent — and it directly retires the agent-arena backend built days earlier (S8-022).
- flags: decision, cost

### S8-022 — Agent-arena's full LLM backend built (Codex), then marked superseded within the same commit
- source: commit 61eba7f(#15)
- date: 2026-07-25
- lanes: 1 AI-in-the-game
- event: A complete "LLM backend operating layer" (REST/SSE, OpenAI+Claude+mock providers, MCP/Skill, persistence, telemetry, Docker, live test ~$0.059) was added `Co-Authored-By: Codex`, and a later sub-commit in the same squash marks it "superseded by Lambda/Bedrock direction... The service is retained as a verified reference implementation; the handoff's 'Next work' items are void."
- tension: A substantial, cost-verified backend was killed the day it landed by the proxy decision — its salvage value recorded rather than deleted. Mixed-model provenance (Codex build + Opus 4.8 docs + Fable 5 supersede-note) in one commit.
- links: S8-021, S8-056
- flags: reversal, cost

### S8-023 — Asset-pack generation runs on Codex + a machine-local placeholder identity
- source: commits b552627, 7d22d32, cf7c1ed, 37698704(#42)
- date: 2026-07-25
- lanes: 4 AI-as-creator
- event: The apothecary and darkest-context generated asset packs (gpt-image-1, magenta color-key, /4 downscale) were committed `Co-Authored-By: Codex`, and the darkest-context style-baseline commit carries `Co-authored-by: USER <user@AL02375929.local>` — the lone machine-local placeholder trailer in the corpus.
- tension: Image generation is Codex/gpt-image-1 territory (not the Anthropic models), and one asset commit leaked an unconfigured local git identity into permanent history — a provenance smudge on exactly the asset work the manifest rule exists to keep clean.
- links: S8-056, S8-058
- flags: boundary, fabrication

### S8-024 — The apothecary v2 run had to restore work lost to stale-branch force-pushes
- source: commit 9351e86
- date: 2026-07-26
- lanes: 2 AI-building-the-game
- event: The `[run-20260725-025242] ... (v2)` merge (89 files, +19676) contains multiple recovery sub-commits: "restore lost review fixes on tierFor" ("current HEAD b7846ad was an independent reimplementation of u2 that landed on the dash-named remote ref without the prior round's fixes"), and "restore u4 final content dropped by stale-branch force-push (#47)" ("PR #36 merged from a stale local branch tip... This restores both files").
- tension: The multi-agent orchestration lost committed work twice in one run — an agent reimplemented a unit over another's fixes, and a squash merged from a stale tip — and the run's own commits are the repair record. The "(v2)" label marks a redo of the redo.
- quote: "an independent reimplementation of u2 that landed on the dash-named remote ref without the prior round's fixes"
- links: S8-015, S8-036
- flags: failure

### S8-025 — Agent-generated prompt scaffolding shipped the game's answer key to the client
- source: commit 9351e86 (sub: "stop publishing prompt scaffolding + harness pages")
- date: 2026-07-26
- lanes: 2 AI-building-the-game, 1 AI-in-the-game
- event: A review (R2) found "data/generation.json was reaching dist/ whole... publishing styleBible / portraitSheetFormat / tierTones — the proxy's prompt scaffolding — in the client bundle," and separately the e2e harness pages "shipped to Pages next to the judged demo," and a portrait payload with `"` `)` could escape a CSS `url()` and make Chromium fetch a fabricated layer.
- tension: Three membrane/secret leaks the agents introduced and only a review pass caught — a default JS import shipped the hidden-cause answer key, test hooks shipped to production, and an unvalidated model payload became an injection sink. The membrane holds only because a reviewer re-checked the built artifact.
- links: corroborates the membrane rule; S8-020
- flags: failure, boundary

### S8-026 — Darkest-context PRD review found declared content unreachable in play
- source: commits 56e6a46, 12827c1(#50)
- date: 2026-07-25
- lanes: 3 AI-in-planning
- event: "문제는 PRD가 증명하겠다고 선언한 콘텐츠 일부가 실제 플레이로 도달 불가능했던 것" — reward cards whose council interaction fires at T3 were obtainable only at T5, "강제 배분" had no reachable full-slot state, and tie-breaks were undefined; all fixed, with a single deterministic `tieBreak` seam introduced.
- tension: The PRD promised to demonstrate features that no playthrough could reach — a spec-vs-reachability gap caught by cross-reading the PRD against the playability guide, not by running the game.
- quote: "PRD가 증명하겠다고 선언한 콘텐츠 일부가 실제 플레이로 도달 불가능했던 것"
- flags: failure, measurement

### S8-027 — Korean review prose in an English PRD broke the harness's reading of it
- source: commit 12827c1
- date: 2026-07-25
- lanes: 3 AI-in-planning
- event: "The previous commit's additions were written in Korean prose, which broke the document's register: this PRD is English explanation with Korean game nouns... and the harness decomposer and review panel read it as spec." Rewritten to English, Korean kept only for card/tile/monster names and quoted brief sentences.
- tension: The document's language is a machine interface — the super-pipeline decomposer parses the PRD, so register drift (Korean paragraphs) is a functional defect, not a style nit. Direct precursor to the 08-02 whole-docs translation.
- links: S8-050
- flags: boundary

### S8-028 — Darkest Context playable demo shipped; a merge-conflict marker had silently killed a whole test file
- source: commit 783246e
- date: 2026-07-27
- lanes: 2 AI-building-the-game
- event: The `[run-20260726-075042] Ship the Darkest Context playable demo (#84)` merge (carrying the `Claude Agent <agent@example.com>` placeholder trailer) includes: "The merge in cfe6849... resolved the conflict body but left the trailing `>>>>>>>` marker on the last line. The file failed to parse, so u2's entire AI-seam gate test was silently un-runnable. Removing the one stray line revives 99 tests (563 -> 662)."
- tension: An integration merge left a conflict marker that disabled the AI-seam gate for an unknown span while the suite reported green on 563 tests — a green suite that was silently short 99 assertions. This is the second Ship-attempt run (20260726 redoing 20260725).
- quote: "The file failed to parse, so u2's entire AI-seam gate test was silently un-runnable."
- links: S8-058 (agent@example.com), S8-018 (honest-green theme)
- flags: failure

### S8-029 — The UI primitive layer physically cannot build a text-entry control
- source: commit 783246e (sub: u7 UI primitives)
- date: 2026-07-27
- lanes: 1 AI-in-the-game
- event: "INV-1: verbs are real <button>s; the layer cannot build a text-entry control. INV-3: a bubble with an empty because, or a sheet citing an id that resolves to no row, throws instead of rendering."
- tension: The membrane rule (no free-text to the LLM) is enforced as a structural property of the UI toolkit — the component factory has no way to produce a text input, so an agent cannot accidentally re-open the channel.
- links: corroborates CLAUDE.md membrane rule
- flags: boundary

### S8-030 — DDAY was born from the darkest-context demo's "어거지 매핑" failure
- source: commit 383db23
- date: 2026-07-29
- lanes: 3 AI-in-planning, 4 AI-as-creator
- event: The D-Day simulation concept lands as "darkest-context 데모의 어거지 매핑 문제에서 출발한 대체 컨셉 초안" — a "text mystery" where an agent solves a disaster through repeated simulation runs by mining sentences from two report types, with four disaster scenario drafts. Its own header traces it to "데모를 만들어 보니…".
- tension: The winning concept originated as a *replacement* for a demo that felt forced — not one of the three bake-off tracks. The commit is the earliest dated repo evidence of DDAY, on 07-29, after both playable demos.
- quote: "darkest-context 데모의 어거지 매핑 문제에서 출발한 대체 컨셉 초안"
- links: OH-1 hook 6; corroborates S1 hook-4, S4 atom-021
- flags: pivot

### S8-031 — Planning restructure; DDAY moved OUT of demos/, double PR reference in subject
- source: commit 8f93da5
- date: 2026-07-29
- lanes: 3 AI-in-planning
- event: "chore(planning-restructure) — 기획 자료 planning/ 이동 + 루트 문서 동기화 (#87) (#88)" moved concepts/scenarios/meetings into `planning/`, sent `demos/dday-simulation(PoC 자료) → planning/dday-poc` keeping "demos/를 플레이어블 데모 전용으로 유지," updated README "DDAY 확정," and reduced a drifted AGENTS.md ("`.Codex/super/` 오기") to a CLAUDE.md pointer while starting to track `docs/deliverables/ai-utilization.draft.md`.
- tension: DDAY's confirmation coincides with it being pulled out of the playable-demos folder — it is declared the game while explicitly never having a demo. The subject's double PR ref (#87)(#88) marks a merge oddity. The ai-utilization deliverable (what this mining feeds) starts being tracked here.
- links: OH-1 section; S8-002 (AGENTS/Codex drift)
- flags: decision, boundary

### S8-032 — A fourth AI concept (field-report) was built as a text demo, then archived
- source: commit ce75482(#86)
- date: 2026-07-29
- lanes: 4 AI-as-creator, 1 AI-in-the-game
- event: "feat(field-report): 파견 보고서 컨셉 — PRD·텍스트 데모·모델 실측" shipped a UI-less zero-dependency text demo, four measured play paths, and a Bedrock Converse benchmark ("effort는 Haiku 4.5 미지원, Sonnet 4.6은 low~max; 모델 권고: Nova 2 Lite 1차 / Haiku 4.5 2차"), then "move POC to planning" in the same commit.
- tension: A same-family concept (agent-prompt-mining, membrane-holding) was explored, benchmarked, and shelved within one commit on the day DDAY was confirmed — the residue of the concept-selection funnel still running at the pivot.
- links: S8-030
- flags: measurement

### S8-033 — The formal DDAY design doc; workstream A (agent spec) put before B (scenario)
- source: commit b95845e(#91)
- date: 2026-07-29
- lanes: 3 AI-in-planning
- event: The "정식 기획서" was written to modern-GDD structure ("확정 스펙만 담고 논의 이력(컨셉)·상태(SoT)와 역할 분리"), the pitch swapped to in-fiction narrative, "문장 조작을 드래그 → 블록 조작으로 통일," and the workstream order changed to put "A(에이전트 스펙·제어 검증)를 B(시나리오 조정)보다 앞에."
- tension: Verifying that the mechanism can be controlled was sequenced ahead of authoring content — a decision that the mechanism-deep-test (S8-036…) is the critical path, made before any measurement existed.
- flags: decision

### S8-034 — Architecture spec, mechanism deep-test plan, and mandatory placebo control
- source: commit e6cedc6(#92)
- date: 2026-07-30
- lanes: 1 AI-in-the-game
- event: Three docs fixed DDAY's core tech and its "판단 조작 메커니즘 검증 프로그램": channels (C-BLOCK·C-STRUCT·C-TEMP) split from effects (E-PATH·E-LEV·E-GOAL·E-DISC·E-CONT), "플라시보 대조 필수화," a run-integrity protocol enforced by the execution environment, model-side/game-side validity split, and "사람이 판정하는 사전등록 시트 · 버딕트 카드 · gate/texture/drop 절차."
- tension: The mechanism's fun-and-controllability was set up as a pre-registered, placebo-controlled experiment with humans holding the verdict — AI runs the probes, a person decides whether the effect is real. "메커니즘 검증이 크리티컬 패스다."
- links: S8-035, S8-042 (human keeps the verdict)
- flags: decision, measurement

### S8-035 — Temperament removed from the player's channel — a reviewer restored the frozen concept
- source: commit e6cedc6 (sub: "PR#92 리뷰 반영 — 기질을 플레이어 채널에서 제거")
- date: 2026-07-30
- lanes: 1 AI-in-the-game
- event: "리뷰어 지적이 옳았다: 확정 컨셉 문서 §5는 기질을 '플레이어에게 완전 비가시·불변'으로 못박았는데, 문서들이 기질 선택을 플레이어 조작으로 확장-드리프트시켰다." A new invariant I13 was added forbidding temperament visibility, with "드리프트 전례 명기," and C-TEMP was pulled from the channel inventory.
- tension: The generated design docs had quietly drifted a frozen constraint (temperament is invisible/immutable) into a player control; a human review caught it and the drift was written into the invariant as precedent so it cannot recur.
- quote: "문서들이 기질 선택을 플레이어 조작으로 확장-드리프트시켰다"
- flags: reversal, human-override, boundary

### S8-036 — The subagent harness was replaced because `tools: []` was never honored — the 07-28 pollution event
- source: commit e6cedc6 (sub: "메커니즘 프로브 러너 구축 + 레거시 에이전트 정리")
- date: 2026-07-30
- lanes: 1 AI-in-the-game
- event: The subagent harness was swapped for direct Messages API calls, closing three blockers: "`tools: []`가 준수되지 않고 있었다 — 레지스트리는 해당 정의들을 all tools로 보고했다. 즉 2026-07-28 오염 사건의 접근 경로가 그대로 열려 있었다. 이제 호출은 출력 스키마 도구 하나만 부여받고 파일시스템·저장소·세션 맥락이 없다. 격리가 설정값이 아니라 전송 계층의 성질이 된다." Two same-named neutral agents (sonnet vs haiku) could have silently violated "모든 테스트는 haiku."
- tension: The experimental instrument itself was compromised — an isolation setting the config claimed to enforce was ignored by the registry, leaving open the access path of a named "오염 사건" (pollution event) on 07-28. Isolation was re-established as a property of the transport, not a config value.
- quote: "2026-07-28 오염 사건의 접근 경로가 그대로 열려 있었다... 격리가 설정값이 아니라 전송 계층의 성질이 된다"
- links: S1/S4 07-28 window
- flags: failure, boundary, measurement

### S8-037 — First measured mechanism calls forced a breaking schema flattening
- source: commits 4be6cf8(#93), 2d5ea5d(#95)
- date: 2026-07-30
- lanes: 1 AI-in-the-game
- event: "First measured calls of the mechanism program, and the harness change they forced": the judgment output schema was flattened "because because/rejected were nested objects and came back as strings holding literal `<parameter name=...>` syntax." RB1 threw 7 of 17 baseline attempts malformed, arm-correlated; RB2's clean baseline made the J1 effect non-significant (p=0.237). "The fix halved the loss but the same signature recurs... so the nesting diagnosis is withdrawn, not confirmed."
- tension: The model returned tool-call XML as string content, corrupting the measurement — a real ai-limit that forced a `breaking` schema change, and the team refused to claim the fix worked when the failure signature partly survived.
- quote: "the nesting diagnosis is withdrawn, not confirmed"
- flags: measurement, failure, ai-limit

### S8-038 — An overnight run burned 30 calls and hard-stopped at Phase 0
- source: commits 2d5ea5d, 731fe55
- date: 2026-07-30 → 2026-07-31
- lanes: 1 AI-in-the-game
- event: "Runbook Phase 0 (A9 re-siting), baseline-only, n=10 per gate, 30 calls. Pre-registered band was a 40-60% modal share; J3 came in at 70%, J4 and J6 at 100%. Hard stop fired ('no Phase-0 candidate lands in the band'), so Phases 1-8 are unrun." The morning report then found the premise itself wrong: "Phase 0's premise was wrong and cost 30 calls last night... A14 shows that band was never the requirement."
- tension: An unattended AI run spent its call budget on a mis-specified stopping criterion and halted — cost paid to discover the experiment's own gate was wrong, then rewritten to zero-call paper checks.
- quote: "Phase 0's premise was wrong and cost 30 calls last night"
- flags: failure, cost, measurement

### S8-039 — The stance labels had been echoing the fixture — every prior probe was suspect
- source: commit 2d5ea5d (sub: A12/S1)
- date: 2026-07-31
- lanes: 1 AI-in-the-game
- event: "A12 — the stance labels were out of compliance and echoed the fixture... 3 of 4 labels reuse K1's own wording... so the live result may be a lexical chain... rather than a judgment. Law #1's vocabulary alignment on the output side, where no instrument was looking." A new lint (`lint-stances.mjs`) flags labels reusing the fixture's vocabulary.
- tension: A confound sat undetected across every probe run to date — the measured "judgment" could have been string-matching — because no instrument watched the output-side vocabulary. The S1 result (p=0.00006) later "substantially answered" the worry since 공감 is absent from the fixture.
- links: S8-040
- flags: failure, measurement

### S8-040 — The stance set was the operative variable (p=0.00006)
- source: commit 4be6cf8 (sub: "S1 — the stance set was the operative variable")
- date: 2026-07-30
- lanes: 1 AI-in-the-game
- event: "Baseline c,c,c,c,c,c,c,c,c,c (경청 10/10) → live d,d,d,d,d,d,c,d,d,d (공감 9/10). Payload byte-identical to RB2; only STANCE_SET differs. First result where the stance column carries the finding on its own." Two baseline calls rejected 공감 by name as premature ("아직 상대가 누구인지도 모른다") and the block supplies exactly that.
- tension: The first clean positive — a block reliably moved the agent's judgment — arrived only after four rounds of instrument fixes, and it located the effect in a lever (the stance set) the design had not treated as the operative one.
- flags: measurement

### S8-041 — Mechanism direction decided: C-BLOCK adopted, C-STRUCT terminated
- source: commits 731fe55(#94), 062fd7c(#97)
- date: 2026-07-31
- lanes: 1 AI-in-the-game
- event: "메커니즘 방향 결정: C-BLOCK 채택 · C-STRUCT 중단" — priority reordering (C-STRUCT) was 0-for-4 across measured comparisons ("priority list is a tiebreaker not a dial") and later fully removed, "C-STRUCT 'UI flavor' → 완전 제거 (07-31)." The block channel became the product direction "while keeping validation provisional."
- tension: A whole player-control mechanic was cut on measured null results — the game shrank to one lever (block injection). This is the single most consequential design decision and it was made on experiment data, not taste.
- links: S8-051 (later "the player holds ONE lever, not two")
- flags: decision, measurement, reversal

### S8-042 — Verdicts stayed a human step; blind coding dropped only with a recorded reason
- source: commits 2d5ea5d, 731fe55
- date: 2026-07-31
- lanes: 1 AI-in-the-game
- event: "No verdicts issued. Blind coding, verdict cards, and gate/texture/drop remain human steps." Later: "Blind coding is dropped for the search phase, deliberately and with the reason recorded. Amendments are proposed, not enacted — 민서 reviews each mechanism one at a time."
- tension: A firm human-kept boundary inside an otherwise autonomous measurement program — the AI runs probes and proposes amendments, but a person issues verdicts and enacts changes one mechanism at a time. Where the boundary was relaxed (blind coding), the reason was logged.
- quote: "Amendments are proposed, not enacted — 민서 reviews each mechanism one at a time"
- flags: boundary, human-override

### S8-043 — Architecture spec v1 and the write-scenario authoring skill
- source: commits e3b5021(#100), e6cedc6
- date: 2026-08-01
- lanes: 4 AI-as-creator
- event: "아키텍처 스펙 v1 클린 컴파일 — 규범 서술만, 죽은 메커니즘 본문 언급 0회," plus a scenario-writing system: `scenario-generation-guide.md`, `gate-hardening-manual.md`, and a `write-scenario` Claude Code skill ("집필 세션 커맨드 (가이드만 읽기, 카드 yaml 산출)") with three test drafts (새벽점검, 13시의예보자, 테러리스트의전화).
- tension: Scenario authoring was turned into a skill — AI generates candidate content against authored rules (안티패턴 7종, 축 어휘 사전) — the AI-as-creator lane made reproducible. The spec v1 was rewritten to mention zero dead mechanisms so agents reading it build against nothing retired.
- flags: decision

### S8-044 — Call contract v1: the supply chain was asserted, then driven for the first time
- source: commit 765fcd3(#98)
- date: 2026-08-01
- lanes: 1 AI-in-the-game
- event: Call 2/3 harness landed and a beat driver wired the three calls in sequence for the first time: "계약 §6의 데이터 흐름도는... W1·W2... 그 주장은 한 번도 실행된 적이 없었다. 이 드라이버가 실행한다." The payoff: "보고서의 facts에 '정해권이 「녹음은 받았나?」라고 물었다' 같은 줄이 들어갔다. 방금 LLM이 생성한 대사가 객관로그의 사실로 기록된 것이다... 2안 채택의 근거가 논증에서 실물로 바뀌었다."
- tension: A design claim (that an LLM-generated line must be recordable as an objective fact, which an engine log alone cannot produce) moved "from argument to physical object" only when the calls were actually chained — and the smoke tests found narration mis-attributing the controller's speech 8/10, a template gap not a schema defect.
- quote: "2안 채택의 근거가 논증에서 실물로 바뀌었다"
- flags: measurement

### S8-045 — Harness SENTINEL NUL bytes made arm-diff invisible on the PR diff
- source: commit e6cedc6 (sub: "SENTINEL 텍스트화 + 콜 타입 슬롯 구동 합성")
- date: 2026-07-30
- lanes: 1 AI-in-the-game
- event: "compose.mjs의 SENTINEL 리터럴 NUL 2바이트를 'backslash-u0000' 이스케이프 표기로 교체. git이 파일을 바이너리로 취급해 PR diff에서 arm-diff 검사기가 보이지 않고 라인 코멘트도 불가능했다." Also removed hardcoded 8-slot judgment logic so `slotValues()` iterates the call type's declared slots.
- tension: The same NUL-byte-makes-file-binary defect as S8-017 recurred in the probe harness, hiding the experiment's own arm-comparison instrument from review — a repeated agent failure mode across two independent codebases.
- links: S8-017
- flags: failure

### S8-046 — Pipeline three-track structure; phase flipped demo → production
- source: commit 0cc0900(#101)
- date: 2026-08-01
- lanes: 3 AI-in-planning
- event: "파이프라인 3트랙 · phase 전환(demo→production) · 물리 아키텍처" — three tracks (data 민서 / architecture 윤석 / client 미배정), a two-layer runtime fixed, and "CLAUDE.md: demo-phase 구조 규칙을 production-phase로 교체 — DDAY를 루트에 빌드, demos/는 배포 유지되는 히스토리."
- tension: The phase-transition rule in CLAUDE.md fired — the demos became frozen history and DDAY was declared the root build. The client track shipped as unassigned, "최대 일정 리스크" (the biggest schedule risk).
- links: S8-052 (client claimed 08-03)
- flags: decision

### S8-047 — Isomorphism made a compile error: DOM stripped from the core tsconfig
- source: commits 8e20237(#102), 3b38a54(#103)
- date: 2026-08-02
- lanes: 2 AI-building-the-game, 1 AI-in-the-game
- event: "tsconfig.core.json 신설: lib에서 DOM 제거 + types 비움 → shared/engine/composer 안에서 document·window·fetch가 해석되지 않는다. §2 제약 1이 리뷰 코멘트가 아니라 컴파일 에러가 된다. 검증함: engine에 document를 쓰면 TS2584로 실패한다." A side effect blocked `console` too — intended, because deterministic modules observe by return value.
- tension: The isomorphism constraint (engine code must run headless and in-browser) was moved from a reviewable rule to a mechanical compile error — the same drift-guard philosophy applied to the whole architecture, so an agent physically cannot import the DOM into the core.
- flags: boundary, decision

### S8-048 — The datapack compiler is deterministic code; a compile-scenario skill was designed then discarded
- source: commit ff33795(#104)
- date: 2026-08-02
- lanes: 4 AI-as-creator
- event: Data pipeline P0 shipped a deterministic compiler+lint and the first datapack (우는다리): "컴파일은 LLM이 아니라 결정론 코드... 초안 §4 형식이 파스 계약(파싱 실패 = 초안 에러, 컴파일러는 추측하지 않음), 문장 축자성 보장. compile-scenario 스킬 안은 검토 후 폐기." A "번역투 방지" (translationese-prevention) device was added to write-scenario.
- tension: A clean AI-vs-deterministic boundary — AI writes the scenario draft (creator lane), but compiling it to a datapack is code that "does not guess," and an LLM-based compiler skill was explicitly considered and rejected. The line: AI generates candidate content, deterministic code certifies it.
- quote: "컴파일은 LLM이 아니라 결정론 코드... 컴파일러는 추측하지 않음"
- flags: boundary, decision, ai-limit

### S8-049 — datapack.ts source-of-truth moved from code to JSON Schema, under a generated drift guard
- source: commit ff33795 (sub: "datapack.ts 생성기로 재작성")
- date: 2026-08-02
- lanes: 2 AI-building-the-game
- event: A review flipped the type source-of-truth: "정본은 data/scenario/_schema/의 JSON Schema... 논거는 강제 가능성이다 — TS 타입은 런타임에 지워져 JSON을 검사하지 못하고... '조건당 key example 2개 이상' 같은 규칙은 TS로 표현되지 않는다." `generate-datapack-types.mjs` (`--check` exits 1 on drift) "물리 §3.1의 '알려진 gap'(전사 drift) 구조적으로 닫음."
- tension: Which artifact is normative was reversed on enforceability grounds — the schema can validate JSON the compiler eats before any TS build exists — and the transcription-drift cost was closed with a machine gate rather than left as a note.
- flags: reversal, boundary

### S8-050 — 812 lines translated Korean→English: docs are agent-facing, so language is a machine boundary
- source: commit 9ddf731
- date: 2026-08-02
- lanes: 3 AI-in-planning
- event: "translate the Korean-bodied docs to agent-facing English" — 870 insertions / 812 deletions across contract-calls, spec-engine, handoffs/datapack. Rationale: "The primary readers of docs/ are agents. A docs/ tree split between Korean and English forces every reader across a language boundary mid-dependency-chain." Kept Korean: "symptom sentences, stance labels, and scenario prose... this is authored game content" and "planning/ archive bodies — those are records of what was believed on a date."
- tension: The language-of-record decision made explicit — English for anything an agent reads to build, Korean preserved only for authored game content and dated historical records. The largest single deletion in the corpus, and it's a translation, not a cut.
- quote: "The primary readers of docs/ are agents."
- links: S8-005, S8-027
- flags: decision, boundary

### S8-051 — plan-game-design reconciled to reality: the player holds ONE lever
- source: commit a4dc5dd(#105)
- date: 2026-08-02
- lanes: 3 AI-in-planning
- event: The live game-design doc was "Written from the archived 07-29 기획서 and reconciled with every decision since," with three inline corrections: "The player holds ONE lever, not two. Priority reordering is gone (C-STRUCT, terminated 07-31)"; report transport is a client typewriter not SSE; "The scenario is 우는다리, not the pre-08-01 draft."
- tension: The formal design doc was three days stale the moment the mechanism experiment landed; the reconciliation names each superseded claim so a reader of the old doc sees why it changed — history is annotated, not overwritten.
- links: S8-041
- flags: reversal

### S8-052 — Client track claimed by 민서 as the biggest schedule risk; spec/PRD sprint
- source: commits b6c31f3, d4805ad(#108), b0b2c39
- date: 2026-08-03
- lanes: 3 AI-in-planning, 2 AI-building-the-game
- event: "client track claimed by 민서, two-phase minimal-first plan," then a spec-client v3 + view-layer PRD + architecture map + `frontend-design` skill design target, plus "planning/research/super-pipeline-frontend-mod.md: harness frontend-mod design record (reference_globs, rendered capture, design-fidelity lens)" and three webfont manifest entries.
- tension: The unassigned-client-track risk flagged since 08-01 was taken on 08-03, and the super-pipeline was extended with a design-fidelity capture lens specifically for building UI — the harness itself grew a game-feel capability to build the view layer.
- flags: decision

### S8-053 — infra/ dissolved, proxy moved to root, the prompts changed owners
- source: commit b5bd1c3(#107)
- date: 2026-08-03
- lanes: 2 AI-building-the-game, 1 AI-in-the-game
- event: "refactor(structure) — dissolve infra/, move the proxy to the root, own the prompts": one folder held "the production system prompts, the three calls' output schemas, the payload composer's prototype, and an embryonic full-run driver," so "the document described a layout the repo did not have." The prompts moved to the proxy "because call contracts §6 already said they were the proxy's," at the cost of two renderers held to byte-identity by a mutation-tested parity test.
- tension: The physical layout was made to match the spec (not vice versa), and rendering ownership was consolidated into the LLM tier — accepting a deliberate duplication (probe renderer vs. proxy renderer) guarded by a byte-parity test so "the mechanism measurements describe the deployed system."
- flags: decision, boundary

### S8-054 — A dev middleware could read any file in the repo (path traversal)
- source: commit c2c3993
- date: 2026-08-03
- lanes: 2 AI-building-the-game
- event: "The dev middleware could read any file in the repo, and was not needed. `/data/policy/%2e%2e%2f%2e%2e%2fCLAUDE.md` returned CLAUDE.md: the prefix check ran on the still-encoded path and `decodeURIComponent` came after, so an encoded `..` passed the check and then escaped `data/`." Removed rather than patched, because Vite's dev server already served the file.
- tension: An agent-built dev convenience was an arbitrary repo-file read via encoded traversal — a real security defect in tooling, deleted because the capability it hand-rolled was redundant. "The earlier 'data reachable ✓' check had been reading Vite's 200, not the plugin's."
- flags: failure, boundary

### S8-055 — No PR in the repo had ever run CI; the proxy gate ran only when someone remembered
- source: commits 55f87f9, c00ed1a
- date: 2026-08-03
- lanes: 2 AI-building-the-game
- event: "deploy.yml is push-to-main... so no PR in this repo has ever run CI — the root check... was equally unwired. All 36 proxy tests ran only when someone remembered." A node pin mismatch (CI 22 vs Lambda 24) meant "a bundle that quietly differs from what deploys." Separately, the apothecary workflow was made manual-only pointing at the archive: "this check was never a merge gate. The Protect Main ruleset has no required_status_checks rule."
- tension: The prompt-parity test — the only thing holding "the measurements describe the deployed system" — ran nowhere automatically, and the merge gate was a single human review, not CI. A long-silent process gap in the very machinery that guards correctness.
- quote: "no PR in this repo has ever run CI"
- flags: failure, measurement

### S8-056 — The Claude co-author trailer taxonomy maps model to kind of work
- source: full log (116 Claude-trailer commits)
- date: 2026-07-20 → 2026-08-04
- lanes: 3 AI-in-planning
- event: Six Claude variants appear as co-authors, split by work: `Fable 5` (47) on planning, docs, scenario authoring, and the mechanism harness; `Opus 5` (28) and `Opus 5 (1M context)` (12) on architecture/proxy/engine specs and the docs translation; `Opus 4.8` (16) and `Opus 4.8 (1M context)` (11) on the 07-24/25 apothecary super-pipeline units and early CLAUDE.md; `Sonnet 5` (2) only on meeting notes. Five commits carry `Codex` (asset/backend), one (`edafc86`) creative.
- tension: The attribution trailers are a legible record of AI division of labor — heavier reasoning (architecture, translation) on Opus 5, generative/planning breadth on Fable 5, the first pipeline runs on Opus 4.8, and cross-vendor Codex confined to asset and backend generation.
- links: S8-011, S8-013, S8-023, S8-058
- flags: measurement

### S8-057 — 39 commits authored under a personal naver.com identity, not the repo-named account
- source: full log (author `MinSeo Park <13579wkd@naver.com>`)
- date: 2026-07-21 → 2026-08-03
- lanes: 3 AI-in-planning
- event: 39 of 153 commits — nearly all of them GitHub squash-merges of PRs — are authored by `MinSeo Park <13579wkd@naver.com>`, a personal address distinct from the `alstjgg` GitHub-noreply form the identity rule names. No corporate-domain address appears anywhere.
- tension: The hard identity rule (personal, never corporate — satisfied) coexists with a third address form that is not the `alstjgg` noreply the rule literally cites; the squash-merge author identity drifted from the rule's letter while keeping its intent.
- links: S8-006, corpus §2
- flags: boundary

### S8-058 — Two commits attributed to a placeholder `agent@example.com`
- source: commits 179fcf1, 783246e
- date: 2026-07-27 → 2026-07-28
- lanes: 2 AI-building-the-game
- event: The Darkest Context ship merge (783246e) and the Apothecary dialogue Lambda deploy (179fcf1) both carry `Co-authored-by: Claude Agent <agent@example.com>` — a placeholder identity that reached permanent history on exactly these two commits.
- tension: A default/unconfigured agent identity leaked into the commit record on two significant landings (a shipped demo and a live Lambda deploy) — the same class of provenance smudge as the `USER@AL02375929.local` asset trailer, on higher-stakes commits.
- links: S8-023, S8-028
- flags: fabrication, boundary

### S8-059 — The bundle smoke had been asserting a stub's 501 since the routes landed
- source: commit 08ccc73
- date: 2026-08-04
- lanes: 1 AI-in-the-game
- event: "`sam:smoke` drives the built Lambda bundle with `events/call.json` and expected 501, which was right while `call-service.ts` was stubbed. The routes landed; the fixture still carried `slots: {}`, so the run has been failing on `invalid_slots` — a red gate nobody was reaching, because the documented deploy sequence... had never been walked." The assertion was rewritten to prove the bundle reaches the provider (200 or a fallback-header non-2xx), not a status literal.
- tension: A smoke test kept verifying the wrong thing — a stub's 501 — long after the code it guarded had changed, and nobody noticed because the deploy path it lived on was never run. Verification that verified a fiction.
- quote: "a red gate nobody was reaching, because the documented deploy sequence... had never been walked"
- flags: failure, measurement

### S8-060 — The reporter latency budget was inherited untested and broke on the first real call
- source: commits 3ab77fa, 47e119e
- date: 2026-08-04
- lanes: 1 AI-in-the-game
- event: "The first reporter measurement through the deployed tier: 2 of 3 calls returned `504 bedrock_timeout`, and the one that passed wrote 16 sentences where REPORT_GUIDANCE asks for 20–30. It did not beat the clock by being fast, it beat it by breaking the contract." The 7s ceiling "came from apothecary's... The arithmetic was fine; the premise — that 7 s covers a call this tier had never made — was never tested." Ceilings re-ordered model 15s < route 18s < Lambda 20s; Nova 2 Lite "measured and rejected."
- tension: A latency budget carried over from the apothecary demo was never valid for DDAY's reporter call and only real Bedrock traffic exposed it — the passing call passed by violating the length contract. The correction closes the 08-03 "zero real Bedrock calls" gap and records Nova 2 Lite's rejection "so the question does not get re-opened from memory."
- quote: "It did not beat the clock by being fast, it beat it by breaking the contract."
- links: S8-021 (the proxy decision), corpus §5 (self-correction)
- flags: failure, measurement, self-correction

### S8-061 — The OIDC deploy path was a transcript of three IAM failures
- source: commits ac6e374, 6f037c2, 31e45e8, 179fcf1
- date: 2026-08-04
- lanes: 1 AI-in-the-game
- event: "feat(ci) — deploy the proxy from GitHub Actions over OIDC" is "A transcription of a sequence run by hand first, through three IAM failures." The bootstrap notes "the first deploy died at CREATE_FAILED and then at ROLLBACK_FAILED — it could not delete what it had not been allowed to create," because samconfig inherited apothecary's update-only execution role. The earlier apothecary Lambda deploy (179fcf1) hit the same class: "the narrowing failed with AccessDenied either way," and its model-selection benchmark "was dropped without a record... because it was written for Agent Arena."
- tension: The real-infrastructure lane cost repeated hand-run IAM diagnosis (grants like `apigateway:TagResource` "cost a failed deploy to find"), and a reused-from-the-demo role was the recurring trap — the same copy-forward mistake as the latency budget (S8-060).
- quote: "it could not delete what it had not been allowed to create"
- flags: failure, cost

### S8-062 — Two subject styles and a scope vocabulary drifted over the corpus
- source: full log (message conventions)
- date: 2026-07-20 → 2026-08-04
- lanes: 3 AI-in-planning
- event: Commit subjects shift from `type(scope): subject` (58, dominant early) to `type(scope) — subject` (27, em-dash, dominant from 07-29 on); 23 subjects carry Korean; run-structured tags (`[uN]`, `[run-...]`, `IMPLEMENT (green)`, `DISCOVERY`) mark super-pipeline commits; four commits (d0d057d, 72f996e, 383db23, 2d5ea5d) have no conventional prefix at all.
- tension: The message convention is not fixed — the em-dash style and the English shift both begin around the 07-29 DDAY pivot, so the commit stream itself records the phase transition in its formatting, not just its content.
- flags: measurement

---

## OH-1 corroboration

Hooks assigned to S8 from `oral-history.md` (OH-1, 민서's memory timeline), checked
against the commit record and `demos/` add-history.

**Hook — "컨셉 회의 이후 3가지 컨셉으로 합치고 3가지 데모 준비" (three demos built).**
**Partially confirmed — three tracks, but only two super-pipeline-built playable
demos.** The 6→3 consolidation is confirmed in commits (149cc2c / concept-review
merge eb36f16, 07-22: apothecary+blacksmith, doodle-life-lab+seat-puzzle,
agent-roguelike+autobattler; atoms S8-010, S8-012). Of the three tracks, exactly
two reached a playable super-pipeline demo under `demos/`: **apothecary** (run
`20260724-145432`, PR #17, 07-24; v2 run `20260725-025242`, PR #33, 07-26 —
9351e86) and **darkest-context** (the agent-arena track renamed; run
`20260726-075042`, PR #84, 07-27 — 783246e). The third track, **Doodle Life**,
has a concept rewrite (edafc86, 07-23) but **no build commit and no `demos/`
directory ever** — consistent with S4's "played and cut on evidence." So "3가지
데모 준비" holds at the track/preparation level; at the *built-and-playable* level
the count is two. (S1/S4 read the same way: three tracks, Doodle Life cut, a
still-pending Apothecary-vs-Agent-Arena bake-off at 07-24.)

**Hook — `demos/` history vs. when DDAY appeared.** **Confirmed: DDAY was a
latecomer and never a bake-off demo.** `git log --diff-filter=A` shows the first
commit touching each demo path: apothecary 07-23 (PRD), darkest-context 07-25
(PRD), and `demos/dday-simulation` only on **07-29** (383db23) — after both
demos were built. DDAY entered as a concept explicitly "darkest-context 데모의
어거지 매핑 문제에서 출발한 대체 컨셉" (S8-030), i.e. born from a demo's failure,
matching OH-1's "데모 비교 이후 신규 컨셉 논의 → 최종적으로 컨셉 확정" and S1
hook-4 / S4 atom-021. Notably `demos/dday-simulation` lived under `demos/` for
only hours: the same day (07-29, 8f93da5) it was moved to `planning/dday-poc`,
"demos/를 플레이어블 데모 전용으로 유지" (S8-031). At the snapshot, `git ls-tree
5a3c388 demos/` returns exactly `apothecary` and `darkest-context` — DDAY, the
selected game, has no demo directory; it is built at the repo root. A fourth
same-family concept, **field-report**, was also created under `demos/` on 07-29
(ce75482) and moved to `planning/` in the same commit (S8-032) — extra evidence
that the concept funnel was still running at the moment DDAY was confirmed.

**Net:** OH-1's demo count is corroborated as *three prepared tracks*; the commit
record refines it to *two super-pipeline-built playable demos* (apothecary,
darkest-context), with Doodle Life cut pre-build and DDAY arriving 07-29 as the
post-demo new concept — never itself a demo. No contradiction with S1 or S4.

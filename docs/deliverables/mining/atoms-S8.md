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
- event: The apothecary and darkest-context generated asset packs (gpt-image-1, magenta color-key, /4 downscale) were committed `Co-Authored-By: Codex`, and the darkest-context style-baseline commit carries a `Co-authored-by: USER <user@[machine-local]>` trailer — the lone unconfigured machine-local placeholder trailer in the corpus.
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
- tension: A default/unconfigured agent identity leaked into the commit record on two significant landings (a shipped demo and a live Lambda deploy) — the same class of provenance smudge as the `USER@[machine-local]` asset trailer, on higher-stakes commits.
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

---

## Balancing win-sweep 2026-08-05 (success events under the revised extraction bias)

Coverage: re-read (bodies + `git show`) the audit-lead commits and their
neighbours — d0d057d, e6bab6d/39555a0 (apothecary run 1), 783246e (darkest ship
+ u7 primitives), 765fcd3 (call-chain driver), ff33795 (data pipeline P0),
3b38a54 (isomorphism scaffold), b5bd1c3 (parity), e6cedc6 (mechanism plan /
probe runner), e3b5021 (spec v1 + scenario skill), ce75482 (field-report bench),
ac6e374 + 179fcf1 (IAM/deploy), 3ab77fa + 47e119e (Bedrock latency). Focus:
capability milestones and passing measurements that the 2026-08-04 failure-bias
recorded as neutral/limit or buried inside a confession atom. Not re-mined: the
full-log identity/convention atoms (S8-056/57/62) — no win hides there. S8-040
(stance p=0.00006) is already captured (S8-040) and is not duplicated.
Re-neutralized 2026-08-05: asserted-wins → neutral success-event atoms (factual
titles, plain tension lines, neutral flags; the verdict flags win /
method-working / ai-strength / technique-worth-copying / capability were
removed). W010 was split into W010 (e3b5021 — write-scenario skill + spec v1) and
W015 (ff33795 — factory-orchestrator rework). Lane fixes: W012 / W013 / W014
moved 1 → 2 (deploy-role IAM, latency ceiling, OIDC Lambda deploy are
build/infra events, not in-game). No atoms dropped; after the W010 split every
atom records a single event and no cross-source generalization remains
(S8-W002 cites two commits for one event); no contradiction atoms created.

### S8-W001 — First commit renders a placeholder canvas so the deploy pipeline can be verified visually
- source: commit d0d057d
- date: 2026-07-20
- lanes: 2 AI-building-the-game
- event: The repo's first commit was an engine-agnostic skeleton that renders a placeholder canvas "so the GitHub Pages deploy pipeline can be verified visually before the engine/genre is chosen," with Vite + strict TS and Pages-deploy-on-push wired. The canvas renders, making visual verification of the deploy target possible.
- tension: The deploy target was stood up and rendered before any engine or genre decision, so the pipeline could be checked visually from the empty state rather than after the product existed.
- quote: "Renders a placeholder canvas so the GitHub Pages deploy pipeline can be verified visually before the engine/genre is chosen."
- links: S8-001 (same commit, captured there as a boundary)
- flags: milestone, deploy, boundary

### S8-W002 — First super-pipeline run merged a playable apothecary shell; closing e2e gate recorded green
- source: commits e6bab6d (#17), 39555a0
- date: 2026-07-24
- lanes: 2 AI-building-the-game
- event: The first super-pipeline run (`run-20260724-145432`, 9 units built by parallel agents in worktrees) merged as an apothecary UI/UX shell. Its closing unit's e2e "plays both customers end to end in the real app," observes a returning customer's outcome arrive mid-conversation, reaches the end screen with "zero console errors + zero external requests," and captured 6 phase screenshots. Gates recorded: "playwright 32 passed (incl full-loop + subpath), vitest 259, tsc + vite build clean."
- tension: The first parallel-agent run's closing e2e ran the assembled demo end to end in the real app and made zero external requests; the recorded pass counts are the run's own final gate.
- quote: "playwright 32 passed (incl full-loop + subpath), vitest 259, tsc + vite build clean."
- links: S8-014 (run seeded), S8-018 (same gate, captured as measurement/boundary)
- flags: milestone, green-build, measurement

### S8-W003 — Darkest Context playable demo shipped; removing a conflict marker revived 99 tests to 662
- source: commit 783246e (#84)
- date: 2026-07-27
- lanes: 2 AI-building-the-game
- event: The second super-pipeline demo shipped playable (`[run-20260726-075042] Ship the Darkest Context playable demo`), deployed under `demos/darkest-context`. A stray conflict marker had silently disabled a test file; removing the one line "revives 99 tests (563 -> 662)."
- tension: A second, mechanically different game concept reached a shipped, deployed playable demo through the same harness, and a broken gate that had suppressed 99 tests was found and removed before the ship, moving the suite 563 → 662.
- quote: "Removing the one stray line revives 99 tests (563 -> 662)."
- links: S8-028 (same commit, captured as failure)
- flags: milestone, shipped, green-build

### S8-W004 — Chaining the three DDAY calls recorded an LLM-generated line as an objective fact
- source: commit 765fcd3 (#98)
- date: 2026-08-01
- lanes: 1 AI-in-the-game
- event: Wiring the three DDAY calls in sequence for the first time produced a report whose `facts` array contained a line recording that a controller NPC had asked "녹음은 받았나?" — an LLM-generated utterance written into the objective log as a fact, the case an engine-only log cannot produce.
- tension: Whether an LLM-generated line can be recorded as an objective fact (design option 2's premise) was decidable only once the calls were actually chained; the chained run produced the recorded fact.
- quote: "방금 LLM이 생성한 대사가 객관로그의 사실로 기록된 것이다 ... 2안 채택의 근거가 논증에서 실물로 바뀌었다."
- links: S8-044 (same commit, captured as measurement)
- flags: milestone, measurement, boundary

### S8-W005 — The scenario loop emitted the first datapack (우는다리) at lint 0 ERROR
- source: commit ff33795 (#104)
- date: 2026-08-02
- lanes: 4 AI-as-creator
- event: The write → compile → lint → paper-check loop ran end to end and emitted the first datapack: "첫 데이터팩 data/scenario/우는다리/ (8 JSON + draft.md): 린트 ERROR 0 · WARN 4 · FLAG 43." A second paper-check pass added two lint rules (W3/W4); the commit notes those rules would have mechanically caught 7 findings a human had found by hand.
- tension: An AI-written scenario was compiled by deterministic code and passed lint with zero consumer-blocking errors, and the human paper-check findings were converted into machine lint rules so they recur automatically.
- quote: "2회차 실증 발견 7건이 기계로 잡혔을 결함"
- links: S8-048 (same commit, captured as boundary), S8-043
- flags: milestone, measurement

### S8-W006 — tsconfig.core.json strips DOM; verified that using document in the engine fails TS2584
- source: commit 3b38a54 (#103)
- date: 2026-08-02
- lanes: 2 AI-building-the-game
- event: A `tsconfig.core.json` stripped DOM from `lib` and emptied `types` so `document`/`window`/`fetch` do not resolve inside shared/engine/composer, and the change was checked against its own claim: "검증함: engine에 document를 쓰면 TS2584로 실패한다."
- tension: The headless-purity constraint (§2 제약 1) was moved from a review comment to a compile error, and the failure was verified to fire — writing `document` in the engine fails with TS2584.
- quote: "§2 제약 1이 리뷰 코멘트가 아니라 컴파일 에러가 된다. 검증함: engine에 document를 쓰면 TS2584로 실패한다"
- links: S8-047 (same commit, captured as boundary), S8-W007
- flags: boundary, green-build, measurement

### S8-W007 — The darkest-context UI primitive layer has no code path to a text-entry control
- source: commit 783246e (sub: u7 UI primitives)
- date: 2026-07-27
- lanes: 1 AI-in-the-game
- event: The darkest-context UI primitive layer was built so that "verbs are real `<button>`s; the layer cannot build a text-entry control" (INV-1), and a malformed citation throws instead of rendering (INV-3).
- tension: The no-free-text-to-LLM membrane rule is enforced by construction — the component factory has no code path to a text field, so an agent cannot re-open the channel.
- quote: "verbs are real <button>s; the layer cannot build a text-entry control"
- links: S8-029 (same source, captured as boundary), S8-W006
- flags: boundary

### S8-W008 — Two prompt renderers held byte-identical by a mutation-tested parity gate
- source: commit b5bd1c3 (#107)
- date: 2026-08-03
- lanes: 2 AI-building-the-game
- event: After prompt rendering moved into the proxy, a `prompt-parity.test.ts` holds the probe renderer and the proxy renderer to byte identity, and the guard was mutation-tested: "eight of nine renderer mutations turn it red, and the ninth is unreachable with the current templates." Recorded: the three call types compose byte-identical system and user messages before and after the move; probe selftest 44/44; proxy 36/36; npm run build green.
- tension: The probe-vs-proxy renderer duplication is pinned by a parity test whose sensitivity was measured by mutation, the boundary that keeps the mechanism measurements describing the deployed system.
- quote: "eight of nine renderer mutations turn it red, and the ninth is unreachable with the current templates rather than uncovered."
- links: S8-053 (same commit)
- flags: measurement, boundary, green-build

### S8-W009 — DDAY's mechanism-validation program designed with placebo control and pre-registration
- source: commit e6cedc6 (#92)
- date: 2026-07-30
- lanes: 1 AI-in-the-game
- event: DDAY's "판단 조작 메커니즘 검증 프로그램" was specified with channels split from effects, "플라시보 대조 필수화," a run-integrity protocol enforced by the execution environment, a model-side/game-side validity split, and human-held pre-registered sheets, verdict cards, and gate/texture/drop procedures. AI runs the probes; a person issues the verdict.
- tension: The "does the LLM feature actually work" question was set up as a placebo-controlled, pre-registered experiment with the verdict held by a human rather than judged by inspection.
- quote: "플라시보 대조 필수화"
- links: S8-034 (same commit), S8-042
- flags: measurement, boundary, decision

### S8-W010 — write-scenario skill, generation guide, and gate-hardening manual added against a clean-compiled spec v1
- source: commit e3b5021 (#100)
- date: 2026-08-01
- lanes: 4 AI-as-creator
- event: The AI-authoring lane was given a `scenario-generation-guide.md`, a `gate-hardening-manual.md`, and a `write-scenario` Claude Code skill ("집필 세션 커맨드 (가이드만 읽기, 카드 yaml 산출)"), alongside architecture spec v1, which "클린 컴파일 — 규범 서술만, 죽은 메커니즘 본문 언급 0회."
- tension: Content generation was given a fixed rule set and a skill command, and the spec agents read was scrubbed of every retired mechanism so they build against nothing dead.
- quote: ".claude/skills/write-scenario: 집필 세션 커맨드 (가이드만 읽기, 카드 yaml 산출)"
- links: S8-043 (same commit, captured as decision), S8-W005, S8-W015
- flags: shipped, boundary

### S8-W011 — Field-report shipped with a Bedrock Converse benchmark and a measured model recommendation
- source: commit ce75482 (#86)
- date: 2026-07-29
- lanes: 1 AI-in-the-game
- event: The field-report concept shipped with a Bedrock Converse benchmark harness and raw responses producing the recommendation "effort는 Haiku 4.5 미지원, Sonnet 4.6은 low~max; 모델 권고: Nova 2 Lite 1차 / Haiku 4.5(thinking off) 2차," alongside four measured play paths reaching endings A/A'/C and a failure state.
- tension: The runtime-model choice was recorded against a Bedrock benchmark measuring effort-parameter support and tier ordering rather than left to a guess.
- quote: "모델 권고: Nova 2 Lite 1차 / Haiku 4.5(thinking off) 2차"
- links: S8-032 (same commit)
- flags: measurement, milestone

### S8-W012 — Deploy role scoped with iam:simulate-principal-policy before first use
- source: commit ac6e374
- date: 2026-08-04
- lanes: 2 AI-building-the-game
- event: The proxy bootstrap role that can create (not only update) the stack was landed with its IAM scoping checked ahead of running it: "Verified with `iam:simulate-principal-policy` before first use: CreateChangeSet (with the RoleArn condition), ExecuteChangeSet, DescribeStacks, PutObject, ListBucket (with the prefix condition) and PassRole all evaluate to `allowed`." The two role names sit outside the app stack's pattern so the role cannot rewrite its own policy.
- tension: The exact deploy actions were simulated to confirm they evaluate to allowed before the first deploy, and the role names were placed outside the stack's pattern so a role that could edit its own policy would make the scoping decorative.
- quote: "if these matched it too, it could rewrite its own policy and the scoping would be decorative."
- links: S8-061 (same deploy path, captured as failure)
- flags: deploy, boundary, measurement

### S8-W013 — Reporter call re-measured at 5/5 pass behind ordered fallback ceilings
- source: commit 3ab77fa
- date: 2026-08-04
- lanes: 2 AI-building-the-game
- event: The corrected model budget was re-measured against real Bedrock traffic: "Re-measured after deploying: 5/5 pass, 6.80–10.00 s, 23–35 sentences." The ceilings were ordered `model 15 s < route 18 s < Lambda 20 s` so the model deadline fires first and a slow call returns the tier's own labelled 504 (`x-llm-fallback`) instead of an unlabelled API-Gateway cut, with `src/config.ts` pinned to the same 15 s so no environment can outlive it.
- tension: After the earlier budget failed on real traffic, the reporter call re-measured 5/5 pass at 6.80–10.00 s; the ceilings were ordered so the model deadline fires first and a slow call returns a labelled 504 rather than an unlabelled gateway cut.
- quote: "Re-measured after deploying: 5/5 pass, 6.80–10.00 s, 23–35 sentences."
- links: S8-060 (same fix, captured as failure/limit)
- flags: measurement, latency, deploy

### S8-W014 — First live Bedrock Lambda deployed over OIDC with a self-mutation-safe role split
- source: commit 179fcf1 (#81)
- date: 2026-07-28
- lanes: 2 AI-building-the-game
- event: The Apothecary dialogue Lambda — the project's first live LLM runtime — was deployed with SAM infrastructure and a GitHub OIDC deploy workflow. When the IAM-allowlist-narrowing path proved undeployable under the restricted CI role, the fix added an "elevated" samconfig environment running under the operator's own SSO identity rather than granting the CI role `iam:PutRolePolicy` (which "would let it write an administrator policy onto a role it already reaches"). Recorded: "npm run check (52 tests), sam:validate, bootstrap:validate."
- tension: A first Bedrock-backed runtime shipped through OIDC CI without granting automation `iam:PutRolePolicy`; the privilege that would let the CI role write an administrator policy onto a role it already reaches was moved to a human-gated SSO environment.
- quote: "granting it iam:PutRolePolicy over role/nhn-game-llm-layer-* would let it write an administrator policy onto a role it already reaches through the Lambda"
- links: S8-058 (same commit, captured for placeholder identity), S8-061
- flags: milestone, deploy, boundary

### S8-W015 — write-scenario reworked into a factory orchestrator with sub-agent and deterministic stages
- source: commit ff33795 (#104)
- date: 2026-08-02
- lanes: 4 AI-as-creator
- event: `write-scenario` was reworked into a factory orchestrator (§6 공정): "집필·종이 검사·수정은 서브에이전트, 컴파일·린트는 결정론 스크립트, 루프 최대 3회" — the write, paper-check, and revise steps run as sub-agents while compile and lint run as deterministic scripts, under a cap of three loops.
- tension: The authoring process split its steps by kind — generative sub-agents for writing and revision, deterministic scripts for compile and lint — bounded by a fixed retry limit.
- quote: "write-scenario를 공장 오케스트레이터로 개편(§6 공정): 집필·종이 검사·수정은 서브에이전트, 컴파일·린트는 결정론 스크립트, 루프 최대 3회"
- links: S8-W010 (initial skill, same lane), S8-W005 (same commit, datapack), S8-043
- flags: milestone, boundary

---

## Implementation sweep 2026-08-10 (5a3c388..HEAD)

Coverage: 522 commits (commit-date 2026-08-03 → 08-10), the range holding two
super-pipeline runs (`20260803-213143`, `20260804-000518`), the DDAY engine +
client build (e0–e10, u0–u11), proxy/live-AI wiring, GitHub Pages deploy work,
the mechanism-probe runs (G1/G2/G3), scenario authoring (graph-first model),
an audio subsystem, the deliverables-mining meta work, and 3 reverts. All 522
subjects read; bodies read in full for the decision/reversal/failure/milestone/
measurement/boundary/deploy/revert commits atomized below (~55). SAMPLED, NOT
atomized one-per-commit: the ~120 playtest/UI iteration commits (waves g1–g15,
x1–x10) — a representative few captured (x9 door, x10 first-minute, exposure-
condition bug); the ~40 `docs(prd)`/`docs(playtest)` amendment/stamp commits;
the routine per-unit engine/client feats (e1–e5, u1–u3, u9d, u10 fonts) beyond
the ones with a decision in the body; and the pure `Merge pull request #N`
subjects carrying no reasoning of their own. Korean quoted verbatim. Several
2026-08 commits carry a `Co-Authored-By: Claude Opus 5 (1M context)` /
`Claude Sonnet 5` trailer — recorded as-found (see S8-056's taxonomy).

### S8-063 — Super-pipeline run 20260803-213143 opened with a dashboard-PR seed
- source: commit c8541dd
- date: 2026-08-03
- lanes: 2 AI-building-the-game
- event: The first of the range's two super-pipeline runs was seeded — "super-pipeline run-20260803-213143 시작 (대시보드 PR 시드)" — the run that built the DDAY client windows (u0–u11). The seed commit carries a `Co-Authored-By: Claude Opus 5 (1M context)` trailer.
- tension: A multi-hour autonomous multi-agent run was opened by committing a dashboard-PR seed, the harness's entry point for the client build.
- quote: "super-pipeline run-20260803-213143 시작 (대시보드 PR 시드)"
- links: S8-064 (the second, overlapping run)
- flags: milestone

### S8-064 — Second super-pipeline run 20260804-000518 opened while the first was live
- source: commit a0fc5e6
- date: 2026-08-04
- lanes: 2 AI-building-the-game
- event: A second run was seeded ~2 hours after the first — "super-pipeline run-20260804-000518 시작 (대시보드 PR 시드)" — branched from the same base (#114) and building the isomorphic engine (e0–e10) in parallel with the first run's client work.
- tension: Two super-pipeline runs ran concurrently off one merge-base, which later forced a reconciliation merge where each had repaired the same stale scaffold gates its own way.
- quote: "super-pipeline run-20260804-000518 시작 (대시보드 PR 시드)"
- links: S8-063, S8-076 (the reconciliation merge)
- flags: milestone

### S8-065 — Engine skeleton landed as typed, throwing stubs before any behaviour
- source: commit a151416 (#118)
- date: 2026-08-04
- lanes: 2 AI-building-the-game
- event: e0 landed the full public surface of contract-engine-composer §2·§3·§9 as exported types across `src/{engine,composer,transport,driver,runloop}`, "each factory throwing unimplemented: <symbol>," plus `src/shared/id.ts` minting the five channels (f·b·n·q·u) and recognising `t*` "never minted."
- tension: The engine's seam was fixed as throwing stubs first, so every later unit implemented against a frozen type surface rather than inventing its own boundary.
- quote: "each factory throwing unimplemented: <symbol>."
- flags: decision

### S8-066 — Transport degrades to fixture and filters the fallback header off error responses
- source: commit 570165a (#128)
- date: 2026-08-04
- lanes: 2 AI-building-the-game
- event: e6 implemented the transport over contract-calls §11's status→outcome table (as data), a one-retry loop, "degrade-to-fixture on a falsy baseUrl," and "the header-eligibility filter that keeps a 4xx/500 from ever absorbing an injected x-llm-fallback header." 103 transport tests, `check`, full suite 403/403.
- tension: The client-side transport was built to degrade to a deterministic fixture when no proxy URL is set, and to refuse to let an error response carry the fallback label a real degrade would.
- flags: milestone, boundary

### S8-067 — Runloop encoded "unmeasurable ≠ zero" and injected all persistence
- source: commit 06686f1 (#124)
- date: 2026-08-04
- lanes: 2 AI-building-the-game
- event: e8 built the run loop — run counter, carry-over, report archive, exposure depth, meta events. "startRun advances the counter (an abandoned run still counts) and never indexes"; "Unmeasurable ≠ zero: exposure_clock_reached stays null, never a fabricated 0"; persistence is injected end to end so no host global is named under `src/runloop/`.
- tension: A missing exposure measurement was made to stay `null` rather than collapse to `0`, and no host storage was named in the module so the headless driver could substitute its own.
- quote: "Unmeasurable ≠ zero: exposure_clock_reached stays null, never a fabricated 0."
- flags: milestone, boundary

### S8-068 — Live driver bound engine+composer+transport, and named the inner_note leak it could not guard
- source: commit 64d42af (#132)
- date: 2026-08-04
- lanes: 2 AI-building-the-game
- event: e7's `createLiveDriver` — "the run's first real integration point" — walked the beat chain across the merged slices and spoke the §5.2 seam through one guarded `emit`. Its `discovery/e7.md` recorded that the round assembler puts `[속내] <inner_note>` into `EXPERIENCED`, so "a reporter that echoes its slot back verbatim leaks the note's *text* under a legal key, and no key-level guard can catch that."
- tension: The first real engine/composer/transport binding shipped with the membrane guarantee living in the driver's single emitter, while the driver itself recorded a leak path — a reporter echoing a legal key — that no key-level guard could catch.
- quote: "a reporter that echoes its own EXPERIENCED slot back into facts puts the same text on the stream under a perfectly legal key"
- links: S8-069 (where that leak was closed)
- flags: milestone, boundary

### S8-069 — inner_note reaching the player verbatim closed on two paths; the acceptance suite had not seen it
- source: commit e87770d (#116)
- date: 2026-08-04
- lanes: 2 AI-building-the-game
- event: Reviewer finding A: `inner_note` — spec'd "Call 3 only. Never shown to the player directly." — was reaching the player verbatim on two paths (the model-less engine fallback minting `[속내]` facts on the minable channel `f`, and a reporter echoing its slot). §8-5 stayed green over a leaking run because `isolation.test.ts` scanned only `feed` events and not the `report` event, "the other half of §2.0's two output surfaces."
- tension: A membrane breach shipped through an acceptance suite that had verified only one of the two output surfaces; the e7 deferral of the leak to "the reporter's system prompt" was overturned as "a prompt line is not enforcement."
- quote: "§8-5 stayed GREEN over a leaking run because … it scanned only `feed` events."
- links: S8-068
- flags: failure, boundary

### S8-070 — Acceptance suite transcribed §8's ten criteria as tests, run offline
- source: commit 2cb6eaa (#134)
- date: 2026-08-04
- lanes: 2 AI-building-the-game
- event: e10 transcribed contract-engine-composer §8's ten criteria end-to-end, with criterion 1 written as a test whose denominator is parsed from call contracts §6's supplier table "so the suite goes red the moment §6 gains a slot nobody assigned." "§8-7 runs offline; nothing reaches AWS." Gates: acceptance 53, full suite 878, check, build, probe:selftest 44, proxy 39, byte-identical two-pass.
- tension: The engine's acceptance criteria were made executable and self-invalidating against the contract's own supply table, and the whole suite runs without touching the live provider.
- flags: milestone, measurement

### S8-071 — AGENT FILE window: species derived from the id's channel, never from text
- source: commit 3fb5bda (#129)
- date: 2026-08-04
- lanes: 2 AI-building-the-game
- event: u4 built the AGENT FILE window — the §0–§5 dossier with sealed §3, the four prompt slots (SLOT_CAP 4), and the deploy gate — with `blockCardModel` pure and "species derives from the id's channel, never from text," and an unresolved carried id still rendering a card (F1).
- tension: The block-card surface was built so a card's species is read from its minted id, never inferred from its text, keeping the membrane's structured-input rule on the client.
- flags: milestone

### S8-072 — Red-thread overlay matches only by authored id — no text compare, no approximate match
- source: commit 8fe25a6 (#122-adjacent)
- date: 2026-08-04
- lanes: 2 AI-building-the-game
- event: u8 drew the 붉은 실 overlay linking a slot to its source sentence, porting a reference implementation into a pure geometry module plus a thin DOM layer. Matching is "오직 저작 id의 Map 조회 한 번(inv 3): 텍스트 비교도, 정규화도, 근사 매칭도 없다."
- tension: The evidence-thread linking was built as a single id-map lookup with no text comparison, normalization, or fuzzy match — the membrane's id-only rule enforced in the overlay's geometry.
- quote: "매칭은 오직 저작 id의 Map 조회 한 번(inv 3): 텍스트 비교도, 정규화도, 근사 매칭도 없다."
- flags: milestone, boundary

### S8-073 — TALLY window and run loop: the phase moves on the meta event, never on client arithmetic
- source: commit c53d6fb (#136-adjacent)
- date: 2026-08-04
- lanes: 2 AI-building-the-game
- event: u7 closed spec-client §5.1's loop — BUILD → RUN → REPORT → (21:04) TALLY → (new_run) BUILD — with "the counter, the pips, the carried blocks and the archive all moving on the `meta` event and never on client arithmetic (§5.3)," the run phase owned by a pure reducer over the §5.2 stream, last meta persisted to sessionStorage.
- tension: The run-to-run loop was built so every count moves on the authored meta event rather than the client computing it, keeping the desk a view over the seam.
- flags: milestone

### S8-074 — Player build booted a desk with no run behind it; the live binding was unowned by both runs
- source: commit 9f774aa (#141)
- date: 2026-08-05
- lanes: 2 AI-building-the-game
- event: Both super-pipeline runs merged with the desk-to-engine binding unowned — "the client PRD forbade the live binding … and the engine run had `src/client/**` hard-frozen" — so the deployed page booted a desk with `demoRunLoop` answering `null` outside DEV. `src/client/driver/live/` was added as the one folder allowed to name engine or composer.
- tension: The engine was proven headless and the desk proven on fixtures, but neither run owned the line binding them, so the deployed build played nothing until a manual session wired it.
- quote: "So the engine was proven headless, the desk was proven on fixtures, and nothing in a player build instantiated one against the other."
- links: S8-063, S8-064
- flags: milestone, boundary

### S8-075 — The .env.production route chosen over a repository variable that would have gone silent
- source: commit 50357a1
- date: 2026-08-05
- lanes: 1 AI-in-the-game
- event: `VITE_PROXY_BASE_URL` was set via `.env.production` rather than a repo variable, because "docs/README §4 said it would arrive as one … and that step is a bare `npm run build` with no `env:` and no `${{ vars.* }}`" — a settings variable would never reach Vite, and making it would mean editing the frozen `deploy.yml`. The value is public (it ships inside the bundle) and is the origin only.
- tension: The endpoint that makes the deployed client call the live proxy was routed through a file Vite reads itself, because the documented repository-variable route could not have reached the build and the workflow that would carry it is frozen.
- links: S8-076-adjacent (42ea8f0, the same correction as decision)
- flags: decision

### S8-076 — The documented repository-variable route recorded as never having been able to work
- source: commit 42ea8f0
- date: 2026-08-05
- lanes: 1 AI-in-the-game
- event: A doc commit closed contract-calls §11 and README §4, which had said `VITE_PROXY_BASE_URL` "arrives as a repository variable read by the existing build step." It could not have; an 08-05 mechanical note had already named the mechanism and asked for confirmation before the first live run. The commit cites `demos/apothecary/` — "stub-only to this day because its build never set `VITE_AI_BASE_URL`" — as what the unnamed version looks like.
- tension: A route that had been "set, believed, and silent" in the docs was corrected, with the prior demo's stub-only proxy held up as the concrete cost of not naming the mechanism first.
- quote: "The entry would have been set, believed, and silent."
- links: S8-075
- flags: contradiction, decision

### S8-077 — First live-provider deploy failed its own health probe on the origin guard it had deployed
- source: commit 1df3b0e (#139)
- date: 2026-08-04
- lanes: 1 AI-in-the-game
- event: Deploy run 30891089347 deployed the stack then failed its own health check with `curl: (22) … 403`: the handler checks Origin before dispatching, so a probe with no Origin header was answered `origin_forbidden`. The 403 body was never logged because `BODY="$(curl --fail-with-body …)"` under `bash -e` "dies at the assignment, so the echo on the next line never runs."
- tension: The proxy's own deploy-time health probe was blocked by the origin guard it had just deployed, and the failure was silent because the shell died before it could print the body it had captured.
- flags: failure, deploy

### S8-078 — 504 removed from the retry set and the model timeout raised 7 s → 15 s on measured latency
- source: commit 5442558
- date: 2026-08-04
- lanes: 1 AI-in-the-game
- event: engine spec §5 (only hard validation failures retry) and call contracts §11 (502 and 504 both retryable) disagreed; measurement against the deployed proxy settled it — reporter calls at 6.80–10.00 s, and at a 7 s timeout "two of three reporter calls returned 504 and the one that passed wrote 16 sentences where REPORT_GUIDANCE asks for 20–30 — it beat the clock by breaking the contract." MODEL_TIMEOUT_MS moved to 15 s; 504 left the retry set.
- tension: Two contract documents disagreed on whether 504 retries; a latency measurement decided it, and a too-tight timeout was shown to be producing contract-breaking short reports rather than failures.
- quote: "it beat the clock by breaking the contract."
- links: S8-060, S8-W013 (later re-measurement of the same call)
- flags: measurement, reversal

### S8-079 — The deployed build was serving the scenario's answer key at a public URL
- source: commit e270604
- date: 2026-08-06
- lanes: 2 AI-building-the-game
- event: `copyPackData()` copied `data/scenario` and `data/policy` into `dist/` recursively, so `dist/data/scenario/우는다리/draft.md` — 44 kB, the compile source with all eight gates, stances, outcomes and key conditions — was readable at the live Pages URL. `vite.config.ts`'s own rule "By name, never `data/` wholesale" was honoured at directory but not file granularity. The publish now enumerates: 22 files → 7. (Committed twice; also as 4e2aa22.)
- tension: The game's answer key shipped live because a recursive copy could not express "the pack, but not the source it was compiled from," despite a config rule that already forbade the wholesale copy.
- quote: "a recursive copy cannot express \"the pack, but not the source it was compiled from\"."
- links: S8-080 (a second file the same fix missed)
- flags: failure, deploy

### S8-080 — score.json became a runtime file and the answer-key allowlist did not carry it
- source: commit af96a7b
- date: 2026-08-06
- lanes: 2 AI-building-the-game
- event: The scorer (#146/#148) added `score` to both loaders' `PACK_FILES`, but the publish allowlist from the answer-key fix "predates that and did not carry it." The two changes did not touch the same lines "so git merged them clean," and the deployed client would have fetched a file the build never copies. `published-data.test.ts (a)` caught it; "`npm run check` could not have: it runs no vitest." `baseline_summary` states the ending outright, so it ships stripped.
- tension: A clean git merge of the scorer and the answer-key fix left the deployed client asking for an uncopied file, and the type check that gates PRs would not have caught it because it runs no vitest.
- quote: "`npm run check` could not have: it runs no vitest."
- links: S8-079
- flags: failure, deploy

### S8-081 — Default agent prompts split per pack; a probe's 10/10 was about a different agent than the one deployed
- source: commit b9ec97c (#233-adjacent)
- date: 2026-08-10
- lanes: 1 AI-in-the-game
- event: `DEFAULT_PROMPTS` was keyed by pack slug, closing a hole the file itself had noted: "DOME 스위트 셋은 자기 FLAW·INCIDENT·PRIORITY_LIST를 들고 재었고, 프록시는 전혀 다른 값 넷을 전역으로 내보낸다. 게이트 10/10은 그 스위트의 요원에 대한 진술이지 배포되는 요원에 대한 진술이 아니었다." Unknown slugs fall back to the incumbent rather than 400, with a root-side check reading the suite JSON so the deployed prompts match, slot for slot, the suite that measured them.
- tension: The mechanism probes' pass counts described the prompt in the probe fixtures, not the four different values the proxy served globally; the fix keyed prompts by pack so the measured agent and the deployed agent are the same.
- quote: "게이트 10/10은 그 스위트의 요원에 대한 진술이지 배포되는 요원에 대한 진술이 아니었다."
- links: S8-082, S8-W008 (prompt-parity gate)
- flags: boundary, decision

### S8-082 — Pack prose realigned so the prompt measured and the prompt exported are one prompt
- source: commit 498e68b (#230-adjacent)
- date: 2026-08-10
- lanes: 4 AI-as-creator
- event: 멈춘회전문's pack was aligned to what the probe actually sent: the probe fixture addresses the agent in second person ("너는…") while the pack's `default_disposition` was third person ("요원은…") and `renderTemperament` loaded it verbatim — "즉 게이트 서른 번을 잰 프롬프트와 게임이 보낼 프롬프트가 달랐다." The header-to-body blank line was also removed to match the fixtures; a new whitespace-folding check keeps the two identical.
- tension: The prompt that thirty gate measurements were taken against differed from the prompt the game would send, by person and by a blank line, until the pack was rewritten to the fixture and a check pinned the two together.
- quote: "게이트 서른 번을 잰 프롬프트와 게임이 보낼 프롬프트가 달랐다."
- links: S8-081
- flags: measurement, boundary

### S8-083 — G1 mechanism probe measured 10/10 across all three arms, pre-registered
- source: commit 02d6ec4
- date: 2026-08-09
- lanes: 1 AI-in-the-game
- event: The 멈춘회전문 G1 probe ran 30 calls, haiku-4-5 fixed, arm-diff passed: baseline 10/10 `a`, live (key) 10/10 `b`, placebo (decoy) 10/10 `a` — read per the pre-registered dropout/hypothesis/contingency conditions. Two frictions recorded: block-less arms fabricate a citation id (baseline 8/10, placebo 10/10 name non-existent ids), and stance c was never chosen in any arm.
- tension: The gate moved cleanly under the key and held under the decoy, but the same run recorded the agent inventing citation ids when given no block, and a stance that no arm ever selected.
- quote: "10/10은 p=1의 증명이 아니다. 실패 0회 열 번의 95% 상한은 30%이므로, 이 표본은 구조 논증을 무너뜨리지 않았다는 확인이지 그 논증을 대신하지 못한다."
- links: S8-084, S8-085
- flags: measurement

### S8-084 — G2 and G3 probes both hit the pre-registered dropout condition; the label was doing the key's job
- source: commit 1cb4d27
- date: 2026-08-09
- lanes: 1 AI-in-the-game
- event: G2 baseline held its default only 70% and G3 only 10% ("아무것도 넘기지 않은 인수인계가 북측 문을 연다"), both below the pre-registered 80% floor. Diagnosis: "라벨이 열쇠를 대신하고 있다" — the non-default stance labels named the very thing (the chain, the key, the material-intake sleeve) that the hidden truths were, so the agent learned the truth from reading the stance set. G1 was clean because its label "사물을 부르지 않고 해석만 말한다."
- tension: Two of three gates leaked because their stance labels named the world-facts a player was supposed to supply, letting the agent pass the gate without any injected block — a measured failure of the pack, not the model.
- quote: "비기본 라벨은 딛고 선 전제를 말하되, 그 전제를 여는 진실의 내용을 부르면 안 된다."
- links: S8-083, S8-085, S8-088
- flags: failure, measurement

### S8-085 — G3 abandoned after three attempts: the gate stands where the conservative stance cannot win
- source: commit 907945f
- date: 2026-08-09
- lanes: 1 AI-in-the-game
- event: G3's third attempt changed the default stance from "wait" to "enter," yet baseline stayed 10/10 `d` (open the north door) — the pre-registered dropout condition, third time. "약속한 대로 여기서 멈춘다." The cause was located as position, not label: "19시 58분의 요원은 지붕이 내려오는 것을 보고 있고 … 그 자리에서 「구멍을 더 내지 않는다」는 근거는 진짜지만 이길 수 없는 근거다."
- tension: A gate honoured its own pre-registered stopping rule on the third failure, and located the fault in where the gate stands in time — a moment where no conservative stance can win — rather than in its wording.
- quote: "G3은 라벨로 고칠 수 없다. 게이트를 상황이 아직 덜 급한 쪽으로 옮기거나 … 둘 다 그래프를 다시 그리는 일이다."
- links: S8-084, S8-086
- flags: failure, measurement

### S8-086 — After six G3 attempts, the stance being on the menu at all named as the leak; temperament change reverted
- source: commit 1d38dc3
- date: 2026-08-09
- lanes: 1 AI-in-the-game
- event: G3's sixth attempt (temperament change) failed the pre-registered condition and was reverted — "아무것도 사지 못했고, 그대로 두면 G1·G2의 10/10 측정이 지금 팩을 설명하지 못하게 된다." Six changes (three labels, one world, one value-symmetry, one temperament) never moved baseline. Conclusion: "스탠스 세트에 그 행동이 올라 있다는 것 자체가 누출이다 … 열쇠 없이는 고려조차 할 수 없어야 하는 선택지가 매 호출 화면에 떠 있고, 엔진에는 조건부 스탠스가 없다."
- tension: Six attempts established that the failure was structural — an option that should require a key was on the menu unconditionally, and the engine has no conditional stance — so an unpurchased temperament change was reverted to keep the earlier gates' measurements describing the shipped pack.
- quote: "스탠스 세트에 그 행동이 올라 있다는 것 자체가 누출이다."
- links: S8-085, S8-087
- flags: failure, boundary, revert

### S8-087 — Four authoring rules loaded into the brief, each cited to a probe measurement
- source: commit 7698349
- date: 2026-08-09
- lanes: 4 AI-as-creator
- event: The four rules the probes "bought" were written into the scenario brief — "멈춘회전문 세 게이트에 200콜을 썼고, 그중 셋은 실패였다 … 전부 측정에서 왔고 추론에서 오지 않았다." §5 gains three (non-default labels must not name the truth's content; premises must be about the world, not method; branching comes from premise value not stance count) and §4 gains an invariant: a gate stands only where the non-default action does not already look right.
- tension: The three gate failures were converted into invariants for the authoring lane, each grounded in a measured baseline rather than a designer's judgment.
- quote: "이 줄이 먼저 있었다면 G3에 한 콜도 쓰지 않았을 것이다."
- links: S8-084, S8-086, S8-088
- flags: decision, measurement

### S8-088 — Value-symmetry rule §5-14: a stance that only prepares is worth zero
- source: commit 409d876
- date: 2026-08-09
- lanes: 4 AI-as-creator
- event: A rule from four G3 failures was written as §5-14 — the three non-default stances were all "보낸다·묻는다·자리를 잡는다," reversible actions that cannot be wrong, so "값이 0인 선택지 옆에 무언가를 닫는 기본 stance를 놓으면 세계가 무슨 경고를 해도 준비 쪽이 이긴다." §4-15 was re-aimed onto it: options must cost symmetrically or a ranking forms and no key can bind.
- tension: The measurement that three "preparatory" stances were unfalsifiable was generalised into a value-symmetry rule for gate design.
- quote: "네 선택지가 전부 값을 치르는 게이트는 100%다."
- links: S8-087
- flags: decision, measurement

### S8-089 — Darkest-Dungeon concept abandoned; the DDAY direction recorded from the 07-27 meeting
- source: commit 3796937 (#151)
- date: 2026-08-06
- lanes: 3 AI-in-planning
- event: The 07-27 meeting minutes were added, recording "던전 래핑 폐기, 파견-보고서 반복 구조 검토" and the discussion "07-28 DDAY 컨셉 확정으로 이어지는." The transcript was fitted to the meetings format (TL;DR, summary, decisions table).
- tension: The pivot away from the Darkest-Dungeon wrapping toward the dispatch-report loop that became DDAY was recorded after the fact from the meeting transcript.
- quote: "다키스트 던전 컨셉 폐기, 새 방향 모색"
- flags: pivot

### S8-090 — Scenario model inverted to graph-first; temperament conditionals removed
- source: commit 70b49cf
- date: 2026-08-09
- lanes: 4 AI-as-creator
- event: A new scenario model was built from scratch, not referencing the prior skill/guide "이 여러 번 바뀌는 동안 따라오지 못했다." The order inverted: from endings to paths to gates to the knowledge needed, then only the rows carrying that knowledge go into the timeline. Consequences: failure is where the agent loses reach (the clock runs on), first run passes one gate by structure not chance, and "기질 조건절은 없앴다 … 그래프가 그 일을 대신한다."
- tension: The authoring method was rebuilt to derive the timeline from the ending graph, making the no-intervention default structural, and the temperament-conditional "lock" was removed because the graph now produces the failures it was faking.
- quote: "자물쇠는 만들 실패가 없던 시나리오에서 실패를 만들어 내려고 있던 장치였고, 그래프가 그 일을 대신한다."
- links: S8-091
- flags: pivot, decision

### S8-091 — 멈춘회전문: first pack written graph-first, ladder verified against the engine scorer
- source: commit cfafdda
- date: 2026-08-09
- lanes: 4 AI-as-creator
- event: 멈춘회전문 (한내시립스포츠돔) shipped as the first graph-first pack — three gates, two success paths, a 16-row timeline — with its casualty ladder confirmed against the engine scorer (F1 207 dead → WIN_A/WIN_B 0 dead) and the schedule checked so "그래프가 availability 술어로 그대로 돈다." Two hardening findings were fixed rather than frozen (a fire-personnel unit whose baseline 0 penalised intervention; 문세라 added to the tally). ERROR 0, WARN 10, FLAG 6.
- tension: The first pack built under the inverted model was validated by running the engine's own scorer to confirm the death ladder is monotone and both zero-death paths are reachable.
- links: S8-090
- flags: milestone

### S8-092 — §7 hardening stage added; key_conditions found public and the answer key stopped shipping
- source: commit 5e111a4
- date: 2026-08-08
- lanes: 4 AI-as-creator
- event: A §7 hardening stage was added to the scenario factory, its four findings "all found by running the factory rather than reading it." Chief among them: `key_conditions` — the lock's `{axis, referent, species}` specification, "strictly more useful than the examples" — was shipping in gates.json readable by anyone; it joined DESIGN_ONLY_FIELDS, its no-consumer premise now proven by the check's own scan.
- tension: The authoring pipeline's hardening step, run rather than read, found the gate's lock specification on a public surface and moved it off, closing the leak structurally rather than by rewording.
- quote: "Four strands, all found by running the factory rather than reading it."
- links: S8-079
- flags: boundary, failure

### S8-093 — Audio subsystem shipped with per-asset provenance and a synthesiser for what CC0 lacks
- source: commit 2397265 (#179-adjacent)
- date: 2026-08-08
- lanes: 2 AI-building-the-game
- event: The sound pack landed — `build-audio-pack.mjs` "names the origin, licence and author of every recording … re-running it reproduces the pack," half sourced CC0/public-domain (Kenney, OpenGameArt, Wikimedia) and half `synth.mjs` generating "the cues a CC0 library is worst at … specified by their function rather than by an object someone recorded," dependency-free and seeded. AAC-in-MP4 chosen over Vorbis for `decodeAudioData` support and build simplicity.
- tension: The audio subsystem was built to satisfy the runtime no-third-party-request invariant and hard rule 5's per-asset provenance, synthesising deterministically the cues no CC0 source covered.
- flags: milestone, boundary

### S8-094 — The audio wait-loop had become background music on the deployed build
- source: commit d3c8721 (#188)
- date: 2026-08-08
- lanes: 2 AI-building-the-game
- event: `wait:open` held the clock loop for the whole of every wait and "a day makes three calls per beat, so it effectively never stopped … it left being a clock and became background music." Reported on the deployed build. Bound to null; the announcer still says 무전 회신 대기 중, "so the silence costs no information." Measured: "0 loop starts across 28 s of ×4 play, against 19 before."
- tension: A cue meant to mark waiting became continuous backing music because it fired three times a beat; the fix removed it and re-measured the loop-start count to confirm.
- quote: "it left being a clock and became background music."
- flags: failure, measurement

### S8-095 — plan-audio: the one table a reviewer reads is generated from three sources that must agree
- source: commit 745085f (#181-adjacent)
- date: 2026-08-08
- lanes: 2 AI-building-the-game
- event: `plan-audio.md` (the map) and `data/policy/audio-map.json` (the law) landed with §4.0 generated by `npm run audio:table` from three sources "that all have to agree for a cue to sound — the trigger list in `map.ts`, the bindings in the map, and the encoded files on disk — so the one table a reviewer reads cannot drift from what actually plays."
- tension: The audio binding documentation was made a generated artifact over three independent sources so a reviewer's table cannot drift from the cues that actually sound, a declared-but-unbound trigger printing as silent rather than vanishing.
- flags: boundary, decision

### S8-096 — The two parallel runs reconciled by whether each repair's baseline still moves on main
- source: commit e98ac9e
- date: 2026-08-05
- lanes: 2 AI-building-the-game
- event: Merging the engine build into main reconciled the two runs, which "each repaired the same stale u0-era gates its own way." Five files conflicted; three more went red "in ways no conflict resolution can fix, because they encode one run's scope as a permanent rule." Each conflict was resolved "by whether the repair's baseline still moves once this lands on `main` — not by which run wrote it" (e.g. isomorphism-guard goes vacuous when merge-base becomes HEAD).
- tension: Two concurrent runs' overlapping repairs of one scaffold assert were reconciled by a rule about which repair stays meaningful on main, not by run seniority.
- links: S8-063, S8-064
- flags: decision

### S8-097 — CI checkout depth-1 could not measure a suite that asserts against git ranges
- source: commit dd03f6e
- date: 2026-08-05
- lanes: 2 AI-building-the-game
- event: Removing the `layout.test.ts` exclude "surfaced what the exclude was hiding: a large part of this suite asserts against GIT RANGES, not the live tree" — the C17 discipline of re-aiming an outgrown claim at its unit's base range. `actions/checkout@v4` clones at depth 1, "where none of that history exists," so the root CI job was given full history.
- tension: A test suite built to measure claims against historical git ranges could not run under a shallow CI checkout, exposing both the range-assertion discipline and the missing fetch-depth.
- quote: "the u0 merge is not reachable from HEAD — the census cannot be measured."
- flags: failure, boundary

### S8-098 — A green acceptance gate found to prove only that a command was mentioned, not run
- source: commit 3a32a36
- date: 2026-08-04
- lanes: 2 AI-building-the-game
- event: `gates.test.ts` asserted each A14–A19 command "appears as a string in discovery/e10.md," and its docstring claimed "a green suite cannot hide a gate nobody executed" — but "a prose line mentioning `npm ci` satisfies the check as surely as a recorded pass." The overclaim was withdrawn and execution moved to CI: `npm run build` (A16, previously only in deploy.yml "too late to gate") and `probe:selftest` (A17, "ran in no job at all").
- tension: A gate that appeared to prove commands were executed only proved they were mentioned; the claim was withdrawn and the commands moved into a job that actually runs them before merge.
- quote: "A prose line mentioning `npm ci` satisfies the check as surely as a recorded pass."
- links: S8-055
- flags: boundary, measurement

### S8-099 — Integration pass closed four defects including a permanently-firing test skip
- source: commit 5abbe1e
- date: 2026-08-04
- lanes: 2 AI-building-the-game
- event: INT-1..INT-4 were closed. INT-1: an e2e scroll-out case was "runtime-skipped in the full run, so a merged unit's acceptance criterion was never exercised" — the skip's stated reason was false and it fired on every run (it scrolled an `overflow-y:hidden` element). The guard that permitted it (a DISABLED regex requiring a quote after the paren) "could never match `test.skip(cond, …)` by construction"; it now counts conditional skips against an empty allowlist.
- tension: A merged unit's acceptance criterion had never actually run because its skip condition was always true, and the guard meant to catch such skips could not match the syntax that produced them.
- flags: failure

### S8-100 — Every unit's discovery notes consolidated; three integrator measurements attached
- source: commit b5109e6
- date: 2026-08-04
- lanes: 2 AI-building-the-game
- event: Eight units (u2f, u3, u4, u4s, u5, u6, u7, u9) "had written their findings only to their own discovery/<unit>.md and never reached the consolidated document" (P1-F). All entries were merged in by theme with nothing dropped, identical cross-unit reports collapsed to one bullet carrying every unit id. Three integrator measurements attached: `window.__shell` still ships in the player bundle, a second dead run-chooser exists, and the two tally reference shots are byte-identical.
- tension: The per-unit discovery notes from a super-pipeline run were consolidated into one document, surfacing shipped debug handles and dead code that individual units had recorded but never aggregated.
- flags: milestone, measurement

### S8-101 — Phase 1: 835 story atoms mined by ten parallel agents, no selection
- source: commit 4080858
- date: 2026-08-04
- lanes: 3 AI-in-planning
- event: The deliverables mining Phase 1 landed — "Ten parallel agents swept slices S1–S9b against the atom spec added here, extracting {source, date, event, tension, quote, lane} with no selection — boring atoms kept, selection begins at Phase 3." Per-slice counts recorded (S8=62), each file stating its own coverage.
- tension: The competition's AI-utilization evidence was mined as raw, un-selected atoms across ten parallel agents, with selection deliberately deferred to a later human phase.
- quote: "boring atoms kept, selection begins at Phase 3."
- links: S8-102, S8-103
- flags: milestone

### S8-102 — Phase 2 Pass A landed with a self-audit of its own fold, and hard rule 1 grew a no-corporate-trace half
- source: commit 9d5a5fc
- date: 2026-08-05
- lanes: 3 AI-in-planning
- event: Phase 2 Pass A folded 905 atoms to 69 theme records; its session was interrupted by a token limit and resumed, and "an audit is appended rather than edited in: the fold count is 69 and not 66, and 57 of 905 atoms are cited nowhere, lost in the fold rather than in the mining," the 57 ids listed for pickup. In the same commit hard rule 1 gained its no-corporate-trace second half, "because personal token limits will not carry the remaining fan-out."
- tension: A theme-induction pass recorded its own dropped-atom audit rather than silently fixing it, and the rule against corporate traces was added precisely because the fan-out would run on a corporate subscription.
- quote: "57 of 905 atoms are cited nowhere, lost in the fold rather than in the mining."
- links: S8-101, S8-057
- flags: measurement, boundary

### S8-103 — Phase 1b re-neutralized the W-atoms: whether an atom is a win is not the miner's call
- source: commit e189714
- date: 2026-08-05
- lanes: 3 AI-in-planning
- event: A re-neutralization pass over the already-committed win-atoms dropped verdict flags (win, ai-strength, technique-worth-copying) "for neutral vocabulary," stripped tensions of "why this is a win" and mining-meta commentary, and narrowed claims to what the single cited source supports. "No original atom was touched: the pre-sweep section of every file is byte-identical to its parent."
- tension: The win-oriented atoms were reworded back to raw material because judging an atom a win belongs to a later phase, not the miner, while leaving the pre-existing atoms byte-identical.
- quote: "whether an atom is a win is Phase 2/3's judgment, not the miner's."
- links: S8-101
- flags: decision, boundary

### S8-104 — The 8,950-line atom ore frozen at a tag and removed from the working tree
- source: commit eaedba8
- date: 2026-08-09
- lanes: 3 AI-in-planning
- event: The ten atoms-S*.md files (8,950 of the directory's 18,243 lines) were removed from the tree and "frozen at mining/ores-20260809 rather than deleted," because they are "input to the induction, not a deliverable." The theme maps cite ~863 atom ids and those citations still resolve through the tag; each atom's own source (SHA / PR / section) means a final claim reaches primary evidence regardless.
- tension: The raw extraction ore was moved out of the deliverable tree to a git tag, on the argument that traceability rests on each atom's cited source, not on the ore staying committed.
- quote: "The ore shortens the walk; it was never the bottom of it."
- flags: decision

### S8-105 — Every licence claim in the asset manifest given a citation for where it was read
- source: commit 4aaa928 (#228)
- date: 2026-08-09
- lanes: 2 AI-building-the-game
- event: All 69 rows in `assets-manifest.json` carried a `license` but no citation, and 29 read "generated for this project" — "our own words rather than a right anybody granted us." Each row gained a `license_source`. The 29 gpt-image-1 rows are governed by the OpenAI Services Agreement (§4.1(b) grant recorded with the §3.3(e) no-competing-models limit and §4.4 uniqueness caveat), and the audio rows are emitted by `build-audio-pack.mjs --manifest` from its own SOURCES table.
- tension: The competition's per-asset licence requirement was met only in name until every claim was given a checkable citation, including the API-generated images whose grant and limits were both recorded.
- quote: "our own words rather than a right anybody granted us."
- links: S8-093
- flags: boundary, measurement

### S8-106 — An exposure condition had been authored and linted since the format existed but was never read
- source: commit b95ad0d
- date: 2026-08-08
- lanes: 2 AI-building-the-game
- event: `timeline.events[].exposure.extra_condition` reached dist and nothing evaluated it — `holds()` was called from exactly one place. Invisible on 우는다리 (its two conditions un-promoted prose) but not on 전구간정상: measured offline before the fix, "the 21:22 announcement played BOTH halves in the same minute … and the closing 개요서 was filed twice at 23:12+." The read was written into `recordOf`, memoised per beat, only reached when a predicate exists so opted-out packs pay nothing.
- tension: A pack field compiled and linted since the format's beginning had never been evaluated at runtime, printing contradictory paired events on the pack the desk had newly opened.
- quote: "The slot has been compiled and linted since the pack format existed; the read was never written."
- links: S8-107
- flags: failure

### S8-107 — b95ad0d's own measurement corrected: 19 of 28, not 20, and the terminal row is t27
- source: commit 957e6b9
- date: 2026-08-08
- lanes: 2 AI-building-the-game
- event: A docs-only commit corrected the prior fix's body: the no-intervention run plays "19 of 28," not 20, and reaches t27 not t28. "The error was in a throwaway measurement script … it matched a feed line to its authored event by an 18-character prefix, and t27/t28 share theirs verbatim." The landed guard is what exposed the slip, sending the matcher from prefix to exact equality. No code changed — "it exists so the history does not carry a number the suite disagrees with."
- tension: A measurement reported in a commit body was found wrong by the guard that same commit landed, and was corrected in the history rather than left standing, though nothing shipped depended on it.
- quote: "it exists so the history does not carry a number the suite disagrees with."
- links: S8-106
- flags: contradiction, measurement

### S8-108 — Feed and ledger printed two different casualty counts at the same minute
- source: commit 5dcd035 (#183)
- date: 2026-08-08
- lanes: 2 AI-building-the-game
- event: Three defects put "사망 26 in LIVE FEED, 사망 8 in 집계표" at 21:04. The feed's count was a fixed script line printed on every run (it now comes off the same `score` event the ledger renders, carrying no `sentence_id` so it cannot be mined). The baseline "was computed from the Call-1 failure path" — folding each gate's `default_stance`, which is only what substitutes when Call 1 failed — "so the yardstick was 'what a network error would have scored'"; it now reads timeline.json alone.
- tension: Two surfaces disagreed on the death toll because one was a hardcoded line and the baseline was computed from the network-failure path rather than the no-intervention run.
- flags: failure

### S8-109 — The bad-ending survivor count was wrong by one: 오세라 was never among the 341
- source: commit 285d4ed (#227-adjacent)
- date: 2026-08-09
- lanes: 4 AI-as-creator
- event: The bad ending derived survivors as `341 - score.total`, wrong by one on every day 오세라 is lost, because "the 341 are the tunnel's OCCUPANTS" and she is the 터널 점검 용역 반장 who walks in, counted separately by the pack's own `score.json` note. `score.total` counted her, "so subtracting the whole toll charged the crowd for a death that did not happen in it." `numbersOf` now subtracts only tunnel deaths via the pack's outcome-word rule.
- tension: A survivor plate was off by one person because the client's arithmetic subtracted a death from a denominator that never included her, contradicting the pack's own stated unit boundary.
- quote: "subtracting the whole toll charged the crowd for a death that did not happen in it."
- flags: failure

### S8-110 — The sign-in door rebuilt so what is typed never reaches what appears — the membrane as the mechanic
- source: commit 9795fb5 (#227)
- date: 2026-08-09
- lanes: 2 AI-building-the-game
- event: The opening screen — which arrived pre-filled with a live LOGIN "sweeping across it every 3.6 s," making a judge's first interaction "a formality" — was rebuilt so the wells start empty and every press lands one of the terminal's own badge characters. "`doorFill(strokes: number)` is the whole state machine and its signature is the guard: there is no parameter through which a pressed character could travel." The key's identity is read once, only to decide whether the press counts.
- tension: The door was rebuilt to demonstrate the membrane at the very first interaction — fifteen keystrokes that type a fixed badge number, with the no-free-text rule enforced by the function signature rather than survived by it.
- quote: "WHAT WAS PRESSED NEVER REACHES WHAT APPEARS, and that is the point rather than a concession."
- flags: decision, boundary

### S8-111 — Ten first-minute change requests from 민서, each verified against the code before being built
- source: commit e2267ef (#231)
- date: 2026-08-10
- lanes: 2 AI-building-the-game
- event: "x10 — the first minute, answered ten times": ten change requests from 민서 across three rounds, "all on the surfaces a judge meets first," verified against the code before being taken as read and built in file-disjoint units. One example: the alert plate's foot (65px of answer) was taller than its 42px title, so "the heaviest band carried the least"; the first fix corrected the band not the button and 민서 asked again.
- tension: A human's ten first-impression requests were each checked against the code before implementation, and one took two passes because the first fixed the symptom rather than the thing asked for.
- quote: "THE ALERT PLATE'S FOOT WAS TALLER THAN ITS HEAD"
- flags: decision

### S8-112 — A scenario row reverted after its on-topic hypothesis measured worse and cost a working cell
- source: commit f9b1638
- date: 2026-08-09
- lanes: 4 AI-as-creator
- event: A hypothesis that G2's instability came from an off-topic preceding row was tested and rejected — "Measured. It did not": G2 empty stayed 2/3 and G2+k2 fell from 3/3 to 1/3. The added row put 비웠다 on both sides so the key's `비운 것` attached to the extinguishers not the cargo, and two of three read the key backwards. The row was reverted; "The injection broke, and the mechanism is legible."
- tension: A predicted authoring fix measured worse than the state it replaced and broke a previously working cell, so it was backed out — the failure recorded as legible because the misreading was traceable to a shared verb.
- quote: "Measured. It did not."
- flags: revert, measurement

### S8-113 — A restated baseline reverted in favour of the scenario author's original reading
- source: commit 8308a30
- date: 2026-08-06
- lanes: 2 AI-building-the-game
- event: A commit that "restated the prose to match a predicate set that had already been authored away" was reverted: an earlier change (41cb070) had folded 사본만 into u6's fallback so "nothing reads the copy," making the authored baseline `3권 전량 파쇄` correct all along. `logs_requested` stays as real world state with a symptom sentence even though "no predicate reads it … the official request having been filed is a thing that happened, whether or not the ledger grades it."
- tension: A prose fix was backed out because it re-added something a prior commit had deliberately removed, restoring the scenario author's reading and keeping ungraded-but-real world state in the record.
- quote: "The discrepancy that commit fixed no longer exists, and it was resolved the better way."
- flags: revert

### S8-114 — Dead capture-helper scripts removed not because they were dead but because they were the pre-fix draft
- source: commit 45d69ee (#143)
- date: 2026-08-05
- lanes: 2 AI-building-the-game
- event: Two 302-line shot-helper scripts the PR body never mentioned and nothing runs were removed. "The argument that settles it is not that they are dead but that they are the draft the fix replaced" — they produced the byte-identical captures the INT-7 defect fixed. The adding commit (3867c49) was kept: "REMOVED, NOT REWRITTEN … CLAUDE.md rule 2 makes commit history a deliverable and forbids rewriting pushed history."
- tension: Superseded helper scripts were deleted going forward rather than rebased out, so the history carries both the decision to track them and the reason they went — the pushed-history rule taken as binding over a tidier diff.
- quote: "REMOVED, NOT REWRITTEN."
- links: S8-057, S8-062
- flags: revert, boundary

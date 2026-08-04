# Atoms — S5 research + legacy services
Snapshot: worktree HEAD bbb6a06 (corpus manifest snapshot: main @ 5a3c388), mined 2026-08-04.
Coverage: all 6 `planning/research/` docs read in full (llm-backend-aws-bedrock.md,
agent-arena-api-usage.md, agent-arena-api-live-test-2026-07-24.md,
agent-arena-examples.md, super-pipeline-game-mod.md, super-pipeline-frontend-mod.md);
`planning/legacy-services/README.md` read in full; both service READMEs it sits above
(`agent-arena-api/README.md`, `apothecary-llm-layer/README.md`) read in full since the
corpus lists them individually. Legacy service **code** (77 files under the two
service trees) not mined, per corpus manifest ("code, out of scope for doc mining");
`fixtures/skills/arena-tactics/SKILL.md` not opened (its role is fully described in the
live-test doc and README). Git archaeology done only where an atom needed a date.

### S5-001 — The harness was modified because correctness gates cannot measure fun
- source: planning/research/super-pipeline-game-mod.md §1
- date: 2026-07-25 (spec written; implemented by 07-29)
- lanes: 2
- event: The team wrote a modification spec for its own multi-agent harness (super-pipeline) before using it for game development, opening with the diagnosis that the harness optimizes for correctness while games additionally need qualities its automated gates cannot measure.
- tension: An in-house AI orchestration system judged good enough for software was judged *not* good enough for a game without deliberate extension — the gap named is "fun and feel", explicitly outside what loop-until-green can verify.
- quote: "super-pipeline optimizes for *correctness* (SPEC→DESIGN→TEST→IMPLEMENT→VERIFY, loop-until-green, independent review panels). Games additionally need *fun and feel*, which automated gates cannot measure"
- links: S5-005, S5-012
- flags: boundary, design-record

### S5-002 — Mods constrained to pure OCP extension of the harness
- source: planning/research/super-pipeline-game-mod.md header (Scope)
- date: 2026-07-25
- lanes: 2
- event: Every game-oriented modification was required to land inside the super-pipeline repo as a pure open-closed extension — never touching the harness core (`/pipeline`, `/goal`) — with project-side prerequisites listed separately and explicitly excluded from the mods.
- tension: The team disciplined itself against forking or entangling its general-purpose harness for one competition; the boundary between "harness" and "this game's needs" was drawn before any code.
- quote: "every modification here lands **inside the super-pipeline repo** as a pure OCP extension (never touch `/pipeline`, `/goal`, etc.)"
- flags: boundary

### S5-003 — Gameplay capture added so a human can judge feel from the dashboard PR
- source: planning/research/super-pipeline-game-mod.md §3 P0-A
- date: 2026-07-25
- lanes: 2
- event: The demo-publish step was extended to run the demo's scripted playthrough headless at wave boundaries and attach the screenshot sequence (GIF when ffmpeg exists) to the dashboard PR — explicitly observation-only, never blocking the run.
- tension: The mechanism makes the running game visible to the *human director*, not to agents; feel review is deliberately routed to a person, cheaply, without pulling a branch.
- quote: "lets the director review the first-minute *feel* from the dashboard PR without pulling a branch."
- links: S5-012 (v2 later gives agents themselves eyes)
- flags: boundary, human-override

### S5-004 — Final-PR "how to run & verify" section wired straight to competition deliverables
- source: planning/research/super-pipeline-game-mod.md §3 P0-B, §6
- date: 2026-07-25
- lanes: 2
- event: A mandatory "실행 & 검증" section was added to the harness's final-PR template: deployed play link, local stub run, local live run with the exact in-game moment that exercises live AI, pointer to the human-owned live checklist, and the 30–60s gameplay path for the competition video.
- tension: Harness output format was reshaped by competition deliverables #1/#2/#3 — the PR body itself became a deliverable feeder, not just a merge artifact.
- flags: design-record

### S5-005 — A "Game-feel/Juice" review lens was invented and made to compete for panel seats
- source: planning/research/super-pipeline-game-mod.md §3 P1-C
- date: 2026-07-25
- lanes: 2
- event: A new lens family `feel` was added to the harness's review-lens registry, decomposer scoring guidance (trigger signals: real-time input, juice, difficulty curve, first-30-seconds clarity), and the final-reviewer persona set. It seats through the same family-capped, score-driven selection as every other lens.
- tension: Rather than hard-coding a game reviewer, the team encoded taste as a first-class lens that must win its seat — and bounded it with an evidence bar ("concrete latency/feedback/readability observations") so feel review cannot become vibes.
- quote: "Evidence bar = concrete latency/feedback/readability observations, ideally drawn from the P0-A captured playthrough or a local run."
- links: S5-019 (fidelity lens later hits the seating rules' limits)
- flags: design-record

### S5-006 — Frozen-inputs guard: protect the one thing agents can't test
- source: planning/research/super-pipeline-game-mod.md §3 P1-D
- date: 2026-07-25
- lanes: 2
- event: An optional `frozen_globs` input was added: SETUP records frozen paths, IMPLEMENT prompts forbid modifying them (extend via new files only), and VERIFY adds a deterministic guard — any `git diff` touching a frozen glob blocks the unit.
- tension: The rationale is an AI-limit statement: agents have no API keys, so the vendor-call path is the one provided input they can break but never verify; the defense chosen is a deterministic diff check, not more prompting.
- quote: "Some provided files must be **extended but never rewritten** — above all the vendor-call path, the one thing agents can't test."
- flags: boundary, ai-limit

### S5-007 — The AI-utilization document was designed to draft itself from harness telemetry
- source: planning/research/super-pipeline-game-mod.md §3 P2-E, §6
- date: 2026-07-25
- lanes: 2, 3
- event: An end-of-run agent was specified to mine `board.json`, the backlog, run stats, the `[AGENT:]` commit/PR trail, and `assets-manifest.json` into a draft of competition deliverable #4 at `docs/deliverables/ai-utilization.draft.md`, with a human polishing it to PDF.
- tension: The deliverable that documents AI use is itself produced by AI from the orchestration system's own exhaust — the harness is both subject and author; the human role is reduced to polish. (This mining directory is the successor to that draft — mining README Phase 5 subsumes it.)
- quote: "the harness itself *is* the 'director of AI' narrative; these deliberate, game-aware extensions show orchestration design, not just tool usage."
- flags: boundary, self-reference

### S5-008 — Division of labor fixed: humans do not hand-write game code
- source: planning/research/super-pipeline-game-mod.md §5
- date: 2026-07-25
- lanes: 2
- event: The spec fixed the split: harness + agents implement; Member A directs (PRD slices, steer decisions, feel judgment, review reading); Member B prepares provided inputs, owns the live-path checklist and deploy workflow.
- tension: The human-kept side is judgment (feel, direction, live verification); the AI-delegated side is all implementation — stated as a rule, not an aspiration.
- quote: "**Harness + agents run implementation.** Humans do not hand-write game code."
- flags: boundary

### S5-009 — Live-AI correctness deliberately excluded from agent gates
- source: planning/research/super-pipeline-game-mod.md §2 (prerequisites 3–4)
- date: 2026-07-25
- lanes: 2
- event: Run prerequisites forbid any `@live`-tagged spec from gating a unit or the final PR (agents hold no API keys), and assign live-AI correctness to a human via a manual `e2e/live-smoke.md` checklist.
- tension: A whole correctness class — does the AI feature actually work live — is declared unverifiable by the AI workforce and handed to a human checklist; the harness only proves the stub shell green.
- quote: "The harness proves the stub shell is green; it cannot exercise the live path."
- links: S5-006
- flags: boundary, ai-limit

### S5-010 — Dry-run before trusting the mods; a bad prerequisite wastes a multi-hour run
- source: planning/research/super-pipeline-game-mod.md §7, header (Status)
- date: 2026-07-29 (validated & archived)
- lanes: 2
- event: The apothecary v2 run was used as the dry-run validating all five mods against a real game repo before the production build depended on them; the spec was then marked implemented & archived as the design record for deliverable #4.
- tension: The cost model of autonomous runs is stated plainly — misprepared inputs don't fail fast, they burn hours — so prerequisites are closed before launch, and the dry-run's DISCOVERY feeds the next harness iteration.
- quote: "Close the §2 prerequisites first — missing assets or an unscoped `build.test` would waste a multi-hour run."
- flags: measurement, cost

### S5-011 — Leaked tool-call syntax committed at the end of the design record
- source: planning/research/super-pipeline-game-mod.md (file tail); commit b4e02a5
- date: 2026-07-25 (introduced; still present at snapshot)
- lanes: 3
- event: The committed game-mod spec ends with literal `</content>` and `</invoke>` lines — tool-invocation XML from the AI writing session that produced the file, introduced in commit b4e02a5 ("rewrite game-mod spec as standalone") and never cleaned up through two subsequent moves of the file.
- tension: The design record of the team's AI orchestration carries a physical scar of its own AI authorship; nobody (human or agent) noticed across ~10 days and two restructures. Boring on its face, but it is the corpus's most literal specimen of unreviewed AI output surviving in a "kept as design record" document.
- quote: "</content>\n</invoke>"
- flags: ai-limit, artifact

### S5-012 — frontend-mod v1 was killed by review: governance without a single rendered pixel
- source: planning/research/super-pipeline-frontend-mod.md header + §1
- date: 2026-08-03 (v2 revision accepting the verdict)
- lanes: 2
- event: The v1 frontend modification spec was reviewed by a super-pipeline session against the harness's actual code and rejected; v2 (then v2.1 after a second round) rewrote it around an in-loop visual self-check, recording the verdict in the document header.
- tension: The team's first answer to "agents can't see UI" was more rules (freeze, mandated reading, a lens, lint) — the review exposed that no agent ever saw a pixel it could act on, and the one pixel-touching mod extended machinery that couldn't even run against the build. A full reversal, driven by AI-assisted review of the team's own AI design.
- quote: "v1 was fidelity *governance* (freeze, mandate reading, lens, lint) with no rendered pixel ever in front of an agent that could act on it"
- links: S5-013, S5-017
- flags: reversal, failure, ai-limit

### S5-013 — The failure model: text-only loops create drift a human can only fix a wave later
- source: planning/research/super-pipeline-frontend-mod.md §1
- date: 2026-08-03
- lanes: 2
- event: The v2 spec names why the DDAY client port (1,946 lines of finished HTML/CSS/JS) breaks the harness: the correction engine is text-only, so visual drift is created inside the loop and correctable only by a human one wave later; enumerated failure modes are agents redesigning instead of porting, fidelity judged by code review alone, and the reference being edited or vendored wholesale.
- tension: The correction loop's blindness is treated as the root cause, and the fix is stated as a principle — guard by *seeing*, not by mandating reading.
- quote: "v1 guarded (1) only by mandated reading; v2 guards it by **seeing**: reference pixels and build pixels in the same VERIFY attempt, judged by the agent itself."
- flags: ai-limit, design-record

### S5-014 — Reference inputs split from frozen inputs because the guard *wording* backfires
- source: planning/research/super-pipeline-frontend-mod.md §3 P0-A
- date: 2026-08-03
- lanes: 2
- event: A new `reference_globs` input class was created, distinct from `frozen_globs`, with its own guard text — because the frozen wording ("extend via new files") reads to an agent as *don't copy from this*, the exact opposite of a porting rule. The guard also embeds a precedence rule (spec invariants > reference) so an agent holding "reference is normative" and "no third-party URL" cannot deadlock on the reference's own violations.
- tension: Prompt wording is treated as load-bearing infrastructure: a reused guard would have silently instructed agents to do the wrong thing, and a missing precedence rule would have wedged them between two absolutes.
- quote: "the frozen wording ('extend via new files') reads as *don't copy from this*, the opposite of the porting rule."
- flags: design-record, ai-limit

### S5-015 — Glob-overlap validation moved from an LLM-followed checklist into workflow JS
- source: planning/research/super-pipeline-frontend-mod.md §3 P0-A (overlap validation)
- date: 2026-08-03 (v2.1 tightening)
- lanes: 2
- event: Launch-time validation that reference/frozen globs don't intersect any unit's file globs was placed in the workflow's deterministic JS — erroring with `{ error: 'glob_overlap' }` before spawning anything — with the human approval gate keeping only an advisory copy.
- tension: An explicit trust ranking between enforcement media: pure string work goes to code because "an LLM-followed gate checklist" is neither deterministic nor resume-safe; the alternative failure is a unit hard-blocked through fix→advisor→replan with no recovery.
- quote: "glob-set intersection is pure string work, so the workflow computes … at startup and returns `{ error: 'glob_overlap', … }` **before spawning anything** — deterministic and resume-safe, which an LLM-followed gate checklist is not."
- flags: boundary, ai-limit

### S5-016 — Capture determinism from the browser's virtual clock, because the reference can't take hooks
- source: planning/research/super-pipeline-frontend-mod.md §3 P0-B
- date: 2026-08-03
- lanes: 2
- event: Screenshot capture was decoupled from the demo publisher (whose assumptions — `demos/<slug>/package.json`, Pages subpath from dir name — degenerate for a repo-root build) into a first-class `render_capture` config; determinism comes from `page.clock.install()` advancing to fixed virtual ticks, since CSS freezing misses JS-timer-driven UI (800 ms thread redraw, ~9 s tally, typewriter chains) and the frozen reference cannot be instrumented.
- tension: A load-time screenshot would miss "the red thread entirely, the one element u8 exists to port" — the settle protocol exists because the naive capture would have silently validated nothing.
- flags: design-record, measurement

### S5-017 — The visual self-check gate is bounded: taste can never fail a unit
- source: planning/research/super-pipeline-frontend-mod.md §3 P0-C
- date: 2026-08-03
- lanes: 2
- event: In VERIFY the agent reads its own build screenshot and the pre-rendered reference shot and judges divergence — but findings go to `failures.md` every attempt, while `green=false` is allowed only for enumerable structural divergence (missing `.win` region, absent component, wrong paper stock) and never on the final attempt, so image judgment can never be the reason a unit escalates.
- tension: The mod that finally gives agents eyes immediately distrusts those eyes: subjective pixel judgment is quarantined from the escalation ladder to prevent the same flapping the team refused from automated pixel-diffs.
- quote: "Taste stays out of the gate; drift stays in the loop."
- links: S5-012
- flags: boundary, design-record

### S5-018 — Explicit LLM image-read budget: ≤2 per attempt, side-by-sides human-only
- source: planning/research/super-pipeline-frontend-mod.md §3 P0-B/P0-C, §6
- date: 2026-08-03
- lanes: 2
- event: The mod caps LLM image consumption — the VERIFY agent reads at most two images per attempt (its shot + the reference), capture is capped at 4 shots per attempt, and wave-boundary side-by-side comparisons are declared human-only with no LLM reading them; the stacked-retry budget is left as an open question to measure in the first run.
- tension: Vision is rationed like a paid resource, and the expensive holistic comparison is reserved for the human director — a cost-drawn line between agent perception and human judgment.
- quote: "wave-boundary side-by-sides are human-only (no LLM reads them)."
- flags: cost, boundary

### S5-019 — Fidelity lens scoped honestly: without a human pin it lands in dropped[]
- source: planning/research/super-pipeline-frontend-mod.md §3 P1-E
- date: 2026-08-03
- lanes: 2
- event: The design-fidelity lens was homed at the unit PR (where the captures live) as a new Lead-review parameter — the spec admits super-lead "has no persona plumbing today" — and, if seated on the final panel, must be pinned via the approval gate's human override, because the automatic seating rules would fill all three slots and hand fidelity to an integrator pass "that has no browser and no captures."
- tension: The team traced its own seating algorithm to a concrete failure ("failure mode 2 verbatim") and concluded the only fix is a human hand on the scale — automation's dropped[] path recreates exactly the blindness the mod exists to fix.
- flags: human-override, boundary

### S5-020 — DISCOVERY plumbing: per-unit files because a shared file would conflict at every merge
- source: planning/research/super-pipeline-frontend-mod.md §3 P1-F
- date: 2026-08-03
- lanes: 2
- event: Since the PRD's definition-of-done requires a populated DISCOVERY.md but nothing harness-side writes one, units were given `discovery/<unit-id>.md` in their own worktrees with integrator consolidation — mirroring the harness's own contention rule — instead of one shared append-file across eleven serially-merged worktrees.
- tension: The run's "real second deliverable" (spec friction against a draft-status spec) would otherwise be merge-conflict-resolved by a mechanical merge agent at nearly every barrier — the knowledge channel was one design mistake away from being garbled by the machinery itself.
- quote: "For a run against a draft-status spec with an unratified seam, spec friction is the expected outcome — this channel is the run's real second deliverable."
- flags: design-record

### S5-021 — Backend shape decided by rejection: thin Lambda, and a list of everything refused
- source: planning/research/llm-backend-aws-bedrock.md §Decision, §Rejected alternatives
- date: ~2026-07-23–27 (decision period; doc later revised 08-03)
- lanes: 1
- event: The runtime LLM tier was fixed as GitHub Pages → API Gateway → Lambda → Bedrock Converse, stateless and dialogue-only, with the record enumerating rejected options: direct browser-to-Bedrock, always-on servers, Bedrock Agents/AgentCore/Knowledge Bases/RAG/persistent memory, server-owned sessions, SSE/WebSocket streaming, player free-text to the model, and runtime image generation.
- tension: The rejected list is the story — the fashionable AI stack (agents, RAG, memory, streaming) was turned down wholesale because each "either exposed credentials, weakened the structured game boundary, or added cost and operations without serving the tested interaction."
- quote: "player free-text sent to the model" (in the rejected list)
- links: membrane rule (CLAUDE.md); S5-026
- flags: boundary, cost

### S5-022 — Provider failure never blocks the game: deterministic fallback with an honesty header
- source: planning/research/llm-backend-aws-bedrock.md §Safety and failure policy; planning/legacy-services/apothecary-llm-layer/README.md §Request flow
- date: ~2026-07-23–27
- lanes: 1
- event: The Lambda validates both sides of the model call and returns a deterministic playable fallback on timeout, provider failure, or invalid output; live and fallback both return HTTP 200, distinguished only by the `x-llm-fallback` header, and the client must treat fallback as valid dialogue, not a transport failure.
- tension: The AI is designed to be droppable at any moment — model quality is "bounded by validation rather than guaranteed by it," and the game's contract with the player never depends on the provider answering.
- quote: "Provider failure does not block the game."
- flags: boundary, design-record

### S5-023 — The old model benchmark was deliberately not restored
- source: planning/research/llm-backend-aws-bedrock.md §Open decision — model selection
- date: ~2026-08-02–03 (doc rewrite dropping it)
- lanes: 3
- event: An earlier research note carried a ~90-runs-per-candidate model-selection benchmark (p95 ≤ 6 s). When the decision record was rewritten, it was deliberately dropped rather than carried forward, because it was designed for the Agent Arena concept and scored things the Apothecary dialogue contract doesn't have (reasonCardId citation, action/target legality).
- tension: Killed measurement work, killed on purpose and with a recorded reason — reusing a rigorous-looking protocol from a different game was judged worse than having no benchmark.
- quote: "Re-running a protocol built for a different game would invite the wrong comparison."
- flags: reversal, measurement

### S5-024 — Quality comparison designed as a blind human test with the decision rule fixed before the run
- source: planning/research/llm-backend-aws-bedrock.md §Open decision (question 2)
- date: ~2026-08-02–03 (proposed, not yet approved at snapshot)
- lanes: 3
- event: The Nova-vs-Haiku choice was reframed as dialogue quality only (latency degrades to fallback, cost is ~$0.48 per 100 playthroughs) and a protocol was proposed: 35 lines per model through the Lambda's own prompt builder, identity-stripped, order-shuffled, both members scoring independently — with the decision rule fixed in advance: any hidden-cause leak disqualifies; otherwise higher holistic mean; on scorer disagreement or a <0.5 gap, keep the cheaper Nova.
- tension: The tiebreaker is pre-committed to cost, and the scorers are blinded against their own biases — the humans designed the experiment to constrain themselves as much as the models.
- quote: "If the two scorers disagree on rank, or the means differ by less than 0.5, keep the cheaper Nova."
- flags: measurement, cost, boundary

### S5-025 — Guardrail limits recorded, not papered over
- source: planning/research/llm-backend-aws-bedrock.md §Security and cost guardrails
- date: ~2026-07-23–27
- lanes: 1
- event: After listing the accepted controls (exact-Origin CORS, body/token caps, throttling, no retry, IAM allowlist, telemetry excluding all content), the record states what they do *not* achieve: no authentication of non-browser callers and no absolute monthly cost ceiling; a longer-lived service would need more.
- tension: A decision record that documents its own residual exposure — the public endpoint stays discoverable and unbounded in aggregate cost, accepted for a competition-lifetime service.
- quote: "They do not authenticate non-browser callers and do not create an absolute monthly cost ceiling."
- flags: boundary, cost

### S5-026 — "The model picks intent only": the arena API's membrane in contract form
- source: planning/research/agent-arena-api-usage.md §0
- date: ~2026-07-23–24
- lanes: 1
- event: The Agent Arena integration guide fixed three principles: the authoritative result is only ever the final `GET /v1/turns/{turnId}`; the API is server-to-server (browser never calls it); and the model chooses intent only — nothing outside `allowedActions` can be confirmed, and all state change is executed by the game engine.
- tension: The LLM is contractually demoted to an intent-picker over a closed action list — the same membrane/closed-world doctrine that later governs DDAY, here already encoded as API law in the dropped concept's backend.
- quote: "**모델은 의도만 고른다.** `allowedActions` 밖의 행동은 확정될 수 없고, 실제 상태 변경은 게임 엔진이 수행한다."
- links: S5-021, S5-033
- flags: boundary, design-record

### S5-027 — SSE stream sanitized down to character counts
- source: planning/research/agent-arena-api-usage.md §6; planning/legacy-services/agent-arena-api/README.md
- date: ~2026-07-23–24
- lanes: 1
- event: The turn progress stream was defined as sanitized telemetry: no hidden reasoning, no credentials, and `agent.output.delta` events carry only the character count of the model's output, never the text; the validated final decision is the only authoritative content.
- tension: Even the *stream* of model output is treated as untrusted surface — the raw token flow is withheld from every consumer until validation has run, trading UI richness for a hard information boundary.
- quote: "stream은 sanitized다: hidden reasoning·credential 미포함, `agent.output.delta`는 원문 대신 **문자 수만** 전달."
- flags: boundary

### S5-028 — Live test: 8/8 scenarios on both providers for about six cents, with the claim kept narrow
- source: planning/research/agent-arena-api-live-test-2026-07-24.md §Summary, §Capability fixture and trust boundary
- date: 2026-07-24
- lanes: 1
- event: The live verification ran 8 scenarios (no-tool, two-turn context, function tool, compact, post-compact continuity, clear, remote MCP, hosted Skill) against both OpenAI and Anthropic; all passed; recorded model-token cost across all runs was ≈$0.059. The report explicitly scopes the verified claim to the exact allowlisted calculator MCP card and the one reviewed Skill fixture.
- tension: The team measured and published its own cost to the cent, and then narrowed its own success claim — "not arbitrary MCP/Skills" — instead of letting a green matrix imply general capability.
- quote: "The verified capability claim is **narrow**: the exact allowlisted calculator MCP card and reviewed `arena-tactics` Skill fixture — not arbitrary MCP/Skills."
- flags: measurement, cost, boundary

### S5-029 — Three defects only live traffic could find
- source: planning/research/agent-arena-api-live-test-2026-07-24.md §Adjustments found by live validation
- date: 2026-07-24
- lanes: 1
- event: Live validation surfaced three fixes invisible to the 146-test keyless suite: the Claude compact summary hit the 96-token smoke cap and correctly failed as `provider_output_incomplete`; OpenAI required the hosted-Skill version as a string even when all-digits; and remote MCP/hosted Skills needed a larger latency/output envelope, moving them onto the separate `agentic-4000` harness (90 s, ≤512 tokens).
- tension: A heavily mocked, fully green test suite still missed provider-reality bugs in three different layers — evidence for why the team keeps insisting live paths need human/live verification apart from agent gates.
- links: S5-009
- flags: failure, measurement, ai-limit

### S5-030 — The MCP test was redesigned so the model couldn't fake tool use
- source: planning/research/agent-arena-api-live-test-2026-07-24.md §Validated decisions (Remote MCP), §Measured usage ("MCP-only confirmation")
- date: 2026-07-24
- lanes: 1
- event: The MCP scenario asked the model for 10% of 200 via the allowlisted `calculate` tool *without disclosing the expected result* in the prompt, forcing the marker `MCP_RESULT_20` to come from the tool's response field; a separate confirmation run was paid for after removing the expected value from the prompt.
- tension: The testers treated their own earlier prompt as a fabrication vector — a model could have echoed a disclosed answer without calling the tool — and spent extra calls to close that hole. Pass criteria throughout were "evidence-based, not plausibility-based."
- quote: "The prompt asked the allowlisted `calculate` tool for 10 % of 200 **without disclosing the expected result**"
- flags: fabrication, measurement

### S5-031 — Skill bootstrap fails closed rather than trust a matching name
- source: planning/research/agent-arena-api-live-test-2026-07-24.md §Capability fixture and trust boundary; planning/legacy-services/agent-arena-api/README.md §Provision the test Skill
- date: 2026-07-24
- lanes: 1
- event: Uploading the reviewed Skill fixture to providers required an explicit live-write gate; when a provider-side Skill with a matching display name already existed, an implicit-reuse probe failed with `existing_skill_requires_force_version_or_explicit_reuse` before any write or model call — reuse of an unverified remote version requires a named human override env var and gets labeled `existing_unverified`.
- tension: Provider-hosted AI artifacts are treated as supply-chain risk: identity is the local fixture's SHA-256 and provenance, never a display name, and every relaxation is an explicit, labeled operator decision.
- flags: boundary, human-override

### S5-032 — Redaction as defense in depth: the report generator distrusts its own output
- source: planning/research/agent-arena-api-live-test-2026-07-24.md §Capability fixture and trust boundary (Redaction)
- date: 2026-07-24
- lanes: 1
- event: Before printing, the live-test runner rejects any decision or trace that echoes a server-owned model target, Skill ID, MCP URL/authorization value, or provider API key, then applies structural secret redaction on top; model targets were supplied as env overrides for that command only, leaving `.env.local` unchanged.
- tension: The threat model includes the model leaking the operator's secrets back through its own answers into a committed report — the published verification record was filtered by machine before a human ever saw it.
- flags: boundary

### S5-033 — "Personality is Prompt, trained skill is Skill, held object is MCP"
- source: planning/research/agent-arena-examples.md §0
- date: ~2026-07-22–24
- lanes: 1, 4
- event: The agent-roguelike example spec mapped the LLM tooling stack onto game fiction: Prompt = character interior (personality/disposition), Skill = learned behavior, MCP = possession (tradable, consumable) — all three implemented identically as sentences added to the character sheet, with the engine always executing effects.
- tension: A translation layer between AI infrastructure and game vocabulary was invented and compressed to one rule — the design bet that the API's own ontology could *be* the item system.
- quote: "한 줄 규칙: **성격이면 Prompt, 익힌 기술이면 Skill, 손에 쥔 물건이면 MCP.**"
- flags: design-record

### S5-034 — Hallucination as a level-design knob: the engine poisons the input, not the model
- source: planning/research/agent-arena-examples.md §1 (컨텍스트 게이지), §4.1 turn walkthrough
- date: ~2026-07-22–24
- lanes: 1
- event: The "context gauge" (the game's stress meter) was specified as an engine-managed number, not real context pressure: above 70% the engine injects noise into that unit's situation summary (a nonexistent enemy, wrong HP), so the LLM judges honestly on corrupted input and produces hallucination-*looking* behavior whose amount and kind the engine controls; at 100% the unit loses its turn to a class default.
- tension: Real LLM failure modes were judged un-designable, so the team built a fake, fully-authored hallucination — the walkthrough even shows the attribution report correctly naming the cause card while spectators read it as a frightened healer.
- quote: "LLM은 오염된 입력으로 정직하게 판단하므로 '환각처럼 보이는' 행동이 나오지만, 오염의 양과 종류는 엔진이 결정한다 → 레벨 디자인 가능."
- flags: design-record, boundary

### S5-035 — Party chatter: generate at design time, replay at runtime
- source: planning/research/agent-arena-examples.md §1 (이동 중 잡담), §5
- date: ~2026-07-22–24
- lanes: 1, 4
- event: Walking-time party banter was specified as a pool mass-generated by LLM at design time and replayed at runtime keyed by [personality combo × recent-event bucket] — zero latency, no conflict with the 1-second page-load rule; runtime local LLM (WebGPU) was deferred because model download breaks load time.
- tension: The where-does-the-AI-run decision made on judge-experience constraints: AI as content factory beats AI as runtime actor whenever latency or load budget is at stake.
- flags: design-record, cost

### S5-036 — Three-second fallback: the game never waits for the LLM
- source: planning/research/agent-arena-examples.md §4.1 (폴백)
- date: ~2026-07-22–24
- lanes: 1
- event: The combat spec fixed a per-response fallback: over 3 seconds, the unit takes its class default action (knight: defend, priest: wait, trickster: evade) with a "…" speech bubble; wall-clock cost per turn is held to one parallel call, and selection-meeting calls are hidden behind walking animation.
- tension: Latency policy as game design — every LLM call in the concept has a pre-authored deterministic understudy, the same never-block doctrine later hard-coded in CLAUDE.md.
- quote: "게임은 절대 LLM을 기다리며 멈추지 않는다."
- flags: boundary, design-record

### S5-037 — The gatekeeper's vulnerabilities are the authored difficulty knob; the player only watches
- source: planning/research/agent-arena-examples.md §4.2
- date: ~2026-07-22–24
- lanes: 1
- event: The jailbreak/negotiation tile pits the elected party agent against an authored gatekeeper agent whose system prompt encodes its weaknesses (proud of its duty, talkative when flattered, shaken by logical contradiction); success is `open_gate` or the password leaking; the player only spectates — membrane preserved.
- tension: Prompt-injection combat is gamified with the player's hands off the keyboard: the attack surface is authored, the attacker is the agent the player built, and difficulty is tuned by editing the victim's prompt.
- quote: "문지기 시스템 프롬프트 (저작 — 취약점이 곧 난이도 노브)" / "플레이어는 관전만 — 멤브레인 유지."
- flags: design-record, boundary

### S5-038 — Two built backends became legacy: the archive is the record of killed work
- source: planning/legacy-services/README.md
- date: 2026-08-03 (move; kills on 2026-07-28 decision and 07-29)
- lanes: 3
- event: Both pre-DDAY backend services were archived under `planning/legacy-services/` — agent-arena-api (never deployed; its concept dropped at the 07-28 decision) and apothecary-llm-layer (deployable but never wired: `deploy.yml` never sets `VITE_AI_BASE_URL`, so the deployed demo runs stub-only). They were moved out of `services/` so that directory means only "tiers this game actually deploys."
- tension: A fully built, live-verified LLM service and a deployable Lambda tier were both written off within days of the game decision; the stated reason for the move is reader experience — dead code was making the live proxy hard to find.
- quote: "One dead codebase sitting next to the live proxy makes the live one hard to find, and 27k lines of unrelated service code at the repo root is the first thing a reader trips over."
- flags: pivot, failure

### S5-039 — Reuse policy fixed as copy-not-edit, with an explicit take/leave table
- source: planning/legacy-services/README.md §What DDAY takes; planning/legacy-services/apothecary-llm-layer/README.md header
- date: 2026-08-03 (README; policy bound by physical-architecture §3.6)
- lanes: 1
- event: DDAY's `proxy/` was defined to start as a copy of the apothecary layer's reusable core — "not as an edit to this tree and not from scratch" — with a fixed table: copy config/errors, the handler skeleton (Origin/content-type/body-size checks), preflight/smoke scripts, and the deploy shape; leave the dialogue route contract, the game data registry, the ModelId, and all named resources. The existing bootstrap stack (OIDC, roles, bucket) is reused, not duplicated.
- tension: Dead code was salvaged by an enumerated list rather than by judgment calls at port time — the boundary between "template" and "different game's contract" was decided once, in writing, at archive time.
- quote: "`proxy/` starts as a **copy of the reusable core**, not as an edit to this tree and not from scratch."
- flags: boundary, design-record

### S5-040 — An accepted residual risk written into the archived service's front door
- source: planning/legacy-services/apothecary-llm-layer/README.md §Runtime boundary
- date: ~2026-07-23–27 (service build; archived 07-29)
- lanes: 1
- event: The apothecary layer's README states plainly that while customer identity is registry-checked, `history[].npcLine`, `history[].playerChoiceLabel`, and `availableClues[].text` are client-supplied strings bounded only by length and count and reach the prompt verbatim — recorded as "an accepted, mitigated residual risk" with a pointer to the validation-boundary decision record.
- tension: The membrane has a documented soft spot: dialogue history echoes client strings into the prompt. Rather than closing it or hiding it, the team bounded it, wrote it down, and linked the reasoning.
- quote: "That is an accepted, mitigated residual risk"
- flags: boundary, contradiction

### S5-041 — Hosted tool calls cannot be pre-empted — the service admits its ceiling
- source: planning/legacy-services/agent-arena-api/README.md §Tests (final paragraphs)
- date: ~2026-07-23–24
- lanes: 1
- event: The arena API README records that Anthropic-hosted MCP/Skill calls execute inside the provider before results stream back: the service counts them, rejects over-budget results, and applies deterministic fallback, but "cannot prevent already-executed hosted calls from consuming latency or provider resources" — directing users to the client-run function path when a strict pre-execution ceiling is required.
- tension: A cost/latency control gap that is architecturally unfixable from the team's side is documented as a property of the design, with the workaround named — the honest edge of the "bounded AI" doctrine.
- flags: ai-limit, cost, boundary

## Balancing win-sweep 2026-08-05 (wins under revised bias)
Coverage: re-read all 6 `planning/research/` docs and all 3 `planning/legacy-services/`
READMEs in full (same set the 08-04 pass covered), this time hunting the WIN dimension the
failure-weighted pass skipped or buried. Audit leads S5-005, S5-022, S5-033 followed. Legacy
service **code** still not mined (out of corpus). 13 W-atoms appended; several explicitly
surface a success buried inside an existing NEUTRAL/LIMIT/boundary atom and link it without
editing the original.

### S5-W001 — Full agentic stack verified live on BOTH providers, first try in production paths
- source: planning/research/agent-arena-api-live-test-2026-07-24.md §Summary, §Scenario matrix
- date: 2026-07-24
- lanes: 1
- event: The live verification passed all eight scenarios — including real remote-MCP execution and hosted-Skill execution — on both OpenAI and Anthropic, provider-agnostically, through the same server-to-server adapter layer.
- tension: The win the 08-04 atom buried under "claim kept narrow": a two-provider agentic integration (function tools + remote MCP + hosted Skills + compact/clear context ops) actually *worked* end to end, proving the closed-action-decision architecture is provider-portable, not vendor-locked.
- quote: "**All 8 scenarios passed on both providers** (matrix below), including real remote MCP and hosted-Skill execution."
- links: S5-028 (same event, framed as measurement/boundary), S5-026
- flags: win, capability, milestone, measurement

### S5-W002 — A fully keyless deterministic suite went green across nine dimensions at once
- source: planning/research/agent-arena-api-live-test-2026-07-24.md §Keyless and container evidence
- date: 2026-07-24
- lanes: 1
- event: Alongside the paid live runs, the same source passed a broad keyless gate: 146 tests across 11 files, TypeScript typecheck, OpenAPI semantic + response-contract validation, a production build, `npm audit` with zero vulnerabilities, non-root Docker health/filesystem checks, and a four-turn mock HTTP E2E exercising three parallel agents, SSE replay, context continuity, compact replay, clear, and fresh-session continuation.
- tension: The AI-backend was engineered to be almost entirely verifiable without any provider key or charge — a deep, mockable test surface is what let the team iterate cheaply and land live with only three adapter fixes (S5-029).
- quote: "146 tests across 11 files · TypeScript typecheck · OpenAPI semantic and response-contract validation · production build · `npm audit` with zero vulnerabilities · non-root Docker health and filesystem checks · four-turn mock HTTP E2E with three parallel agents"
- links: S5-W011, S5-029
- flags: win, milestone, measurement, method-working

### S5-W003 — Crash-safe at-most-once semantics wrapped around every paid provider call
- source: planning/legacy-services/agent-arena-api/README.md §Idempotency and restart behavior
- date: ~2026-07-23–24
- lanes: 1
- event: The arena service committed turn state and its matching lifecycle event in one SQLite transaction, and made every mutation (run/turn/compact/clear) at-most-once per idempotency key — compact "durably claims the key before contacting a provider, then stores context and the receipt atomically," so a mid-flight crash returns `operation_outcome_unknown` rather than silently double-charging.
- tension: A capability worth copying: production-grade transactional/idempotency discipline applied specifically to non-idempotent, billable LLM calls, so restarts and retries can never leave authoritative state ahead of its replay stream or pay twice.
- quote: "Compact durably claims the key before contacting a provider, then stores context and the receipt atomically."
- links: S5-041
- flags: win, capability, technique-worth-copying

### S5-W004 — Three agent calls per turn collapsed to one wall-clock call
- source: planning/research/agent-arena-examples.md §4.1 (호출 구조)
- date: ~2026-07-22–24
- lanes: 1
- event: The multi-agent combat design issues one LLM call per unit every turn but fires them in parallel, so the wall-clock cost of a full party's turn stays at roughly a single call; selection-meeting calls are further hidden behind the walking animation.
- tension: A concrete latency-hiding technique that works: fan-out N independent agent decisions concurrently and the player feels one call, not N — the same principle the arena backend implements ("runs all three agents in parallel").
- quote: "매 턴, 유닛마다 1콜을 병렬로 보낸다 (벽시계 ≈ 1콜)."
- links: S5-036
- flags: win, capability, technique-worth-copying

### S5-W005 — All five game-mods shipped, verified against source, and validated by a dry-run
- source: planning/research/super-pipeline-game-mod.md header (Status)
- date: 2026-07-29
- lanes: 2
- event: The game-development harness modifications reached done: all five mods (P0-A/B, P1-C/D, P2-E) landed live in the super-pipeline repo as OCP extensions, were verified against the harness source, and were validated end-to-end by the apothecary v2 dry-run against a real game repo before the production build depended on them.
- tension: The milestone the 08-04 cost-framed atom underplayed: the deliberate, self-imposed harness extension program actually completed and passed its own validation gate — the plan from S5-001 became working infrastructure.
- quote: "implemented & archived (2026-07-29). All five mods (P0-A/B, P1-C/D, P2-E) are live in the super-pipeline repo, verified against source; the apothecary v2 dry-run (§7) validated them."
- links: S5-001, S5-010
- flags: win, milestone, method-working

### S5-W006 — Code-grounded AI review caught a whole-spec design flaw before a multi-hour run
- source: planning/research/super-pipeline-frontend-mod.md header
- date: 2026-08-03
- lanes: 2
- event: A super-pipeline review session, grounded in the harness's actual code, examined the v1 frontend-mod spec and correctly diagnosed that it was fidelity *governance* with no rendered pixel ever placed in front of an agent that could act on it; the verdict was accepted and drove the v2/v2.1 rewrite.
- tension: The win buried inside the "v1 was killed" reversal atom: the team's own AI-assisted review mechanism *worked as designed* — it found a real architectural blind spot in a design document before that document could waste an autonomous run, exactly the value the review panels exist to deliver.
- quote: "v2 revised 08-03 against the super-pipeline session's code-grounded review of v1 … The review's verdict is accepted"
- links: S5-012
- flags: win, method-working, technique-worth-copying

### S5-W007 — "Guard by seeing": agents finally given real pixels to judge, using Claude Code's own image reads
- source: planning/research/super-pipeline-frontend-mod.md §3 P0-C
- date: 2026-08-03
- lanes: 2
- event: The v2 fix for "agents can't see rendered UI" put the reference PNG and the agent's own freshly-captured build PNG into the same VERIFY attempt, where the agent Reads both images (Claude Code renders PNGs visually) and judges divergence against the porting rule.
- tension: A capability worth copying: rather than mandating more reading or hard pixel-diffs, the team exploited that the coding agent can actually *see* images, turning fidelity checking into an in-loop perception task the agent performs itself.
- quote: "the agent captures its own build via `render_capture`, Reads both images (Claude Code renders PNGs visually), and judges divergence against the porting rule."
- links: S5-013, S5-017
- flags: win, capability, technique-worth-copying, ai-strength

### S5-W008 — Deterministic screenshots of animation-driven UI via the browser's virtual clock
- source: planning/research/super-pipeline-frontend-mod.md §3 P0-B
- date: 2026-08-03
- lanes: 2
- event: Capture determinism for JS-timer-driven UI (thread redraw, ~9 s tally, typewriter chains, rAF loops) was achieved from the browser side — `page.clock.install()` advances to a fixed virtual tick per shot before the screenshot, the identical protocol for both the un-instrumentable frozen reference and the build.
- tension: A portable technique worth copying: you can get pixel-deterministic captures of a moving UI *without* instrumenting the target, by driving a virtual clock in the harness — sidestepping the frozen reference's inability to take hooks.
- quote: "`page.clock.install()` → advance to a fixed virtual tick per shot → screenshot; same protocol for reference and build"
- links: S5-016
- flags: win, technique-worth-copying

### S5-W009 — The orchestration exhaust drafts the AI-utilization deliverable itself
- source: planning/research/super-pipeline-game-mod.md §3 P2-E, §6
- date: 2026-07-25
- lanes: 2, 3
- event: An end-of-run agent was specified to mine `board.json`, the backlog, run stats, the `[AGENT:]` commit/PR trail, and `assets-manifest.json` into a first draft of competition deliverable #4, on the premise that the harness's own run is already the "director of AI" story.
- tension: A capability worth copying that the 08-04 atom framed only as unsettling self-reference: an orchestration system that emits, as a byproduct of running, the evidence and narrative that document how AI was used — near-automatic reporting straight from telemetry.
- quote: "the harness itself *is* the 'director of AI' narrative; these deliberate, game-aware extensions show orchestration design, not just tool usage."
- links: S5-007
- flags: win, capability, technique-worth-copying

### S5-W010 — Tool-use tests designed so the model could not fake a pass
- source: planning/research/agent-arena-api-live-test-2026-07-24.md §Validated decisions (evidence)
- date: 2026-07-24
- lanes: 1
- event: The verification held every scenario to evidence, not plausibility: a case passed only when the *validated* decision carried the expected completed tool trace, fixture marker, and card attribution — e.g. the MCP marker had to be formed from the tool's own response field, with the expected value withheld from the prompt.
- tension: A testing technique worth copying, buried in the 08-04 fabrication atom: for LLM tool-use, assert on observable execution evidence (traces, tool-sourced markers) rather than on a plausible-looking answer, closing the "model echoed the answer without calling the tool" hole.
- quote: "Pass criteria were evidence-based, not plausibility-based"
- links: S5-030
- flags: win, method-working, technique-worth-copying

### S5-W011 — Live validation paid off: three provider-reality defects found, fixed, and re-verified green
- source: planning/research/agent-arena-api-live-test-2026-07-24.md §Adjustments found by live validation
- date: 2026-07-24
- lanes: 1
- event: Running real provider traffic surfaced three fixes the keyless suite could not (compact output-cap, OpenAI Skill-version string typing, capability latency/output envelope); all three landed, and "the final runs with these production paths passed every configured scenario."
- tension: The win inside the failure-flagged atom: the team's insistence on a live pass *worked* — it caught three real bugs a fully green mock suite missed, and the follow-up runs went clean, validating live verification as a paying-off practice rather than only exposing a mock-suite limit.
- quote: "The final runs with these production paths passed every configured scenario."
- links: S5-029, S5-W002
- flags: win, method-working, measurement

### S5-W012 — Runtime AI priced and found cheap: about $0.48 per 100 playthroughs
- source: planning/research/llm-backend-aws-bedrock.md §Open decision — model selection (question 1)
- date: ~2026-08-02–03
- lanes: 1
- event: The backend decision record measured the deployed dialogue token shape and recorded the runtime model cost as "about $0.48 per 100 playthroughs," with latency degrading gracefully to the deterministic fallback rather than failing.
- tension: A positive measurement worth surfacing for a company weighing AI adoption: at the game's actual bounded interaction shape, live LLM dialogue is nearly free to serve, making the model choice a quality question rather than a cost question.
- quote: "cost is a real 2.5× ratio but about $0.48 per 100 playthroughs at the deployed token shape"
- links: S5-024, S5-W001
- flags: win, measurement, cost

### S5-W013 — A retired service still paid off: its thin Lambda→Bedrock shape became the reusable template
- source: planning/legacy-services/apothecary-llm-layer/README.md header
- date: 2026-07-29
- lanes: 1
- event: When the apothecary LLM layer was archived after the DDAY decision, its architecture was explicitly retained as the template for the new runtime tier — "its thin Lambda→Bedrock shape is the template for the DDAY runtime layer, which will be built fresh at `infra/llm-layer/`."
- tension: A build that got shelved still delivered lasting value: the validated thin-backend design proved reusable across two different games, so the killed service became infrastructure ROI rather than pure sunk cost.
- quote: "its thin Lambda→Bedrock shape is the template for the DDAY runtime layer, which will be built fresh at `infra/llm-layer/`."
- links: S5-038, S5-039
- flags: win, technique-worth-copying, milestone

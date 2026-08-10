# Corpus manifest — files of alstjgg/nhn-game-2026

Purpose: complete inventory of file-based mining targets for the AI-orchestration documentation-mining effort (inventory only — no story extraction, no quality judgment).

Snapshot: main @ 5a3c388, 2026-08-04

Grouping follows the proposed Phase-1 mining slices S1–S7, plus an "unassigned/other" group for repo prose outside those slices. Sizes are approximate (KB on disk). Bulk machine-generated data is collapsed into glob rows with file counts; descriptors for glob rows come from glancing at 1–2 representative files.

---

## S1 — concepts (`planning/concepts/`)

| path | approx size | one-line content descriptor |
|---|---|---|
| planning/concepts/agent-arena-brief.md | 10 KB | Unified brief "통합 브리프 — 에이전트 아레나" merging the agent-roguelike and autobattler concepts |
| planning/concepts/game-concept-agent-roguelike.md | 21 KB | Game concept doc "에이전트 로그라이크 (Agent Ascension)" |
| planning/concepts/game-concept-apothecary.md | 20 KB | Game concept doc "약사 (Apothecary)" |
| planning/concepts/game-concept-autobattler.md | 21 KB | Game concept doc "프롬프트 오토배틀러 (Autobattler)" |
| planning/concepts/game-concept-blacksmith.md | 20 KB | Game concept doc "대장장이 (Blacksmith)" |
| planning/concepts/game-concept-darkest-context.md | 13 KB | Integrated concept spec "Darkest Context — 통합 게임 컨셉 명세" |
| planning/concepts/game-concept-dday-simulation.md | 25 KB | Concept discussion draft "D-Day 시뮬레이션 (가칭) — 논의 초안" — the concept later selected for production |
| planning/concepts/game-concept-doodle-life.md | 33 KB | Game concept doc "부탁을 그리는 정원 (Doodle Life)" |
| planning/concepts/game-concept-placement.md | 21 KB | Game concept doc "자리 좀 봐주세요 (Placement)" |
| planning/concepts/game-concept-template.md | 10 KB | Shared template and writing guidelines for the concept docs ("공통 템플릿 & 작성 지침") |

10 files, all listed individually.

## S2 — scenarios + PoC (`planning/dday-scenarios/`, `planning/dday-scenario/`, `planning/dday-poc/`, `planning/field-report-poc/`, `planning/paper-tests/`)

### planning/dday-scenarios/ — first-generation disaster scenario drafts

| path | approx size | one-line content descriptor |
|---|---|---|
| planning/dday-scenarios/dday-scenario-brief.md | 11 KB | Writing brief for disaster scenarios ("재앙 시나리오 집필 브리프") |
| planning/dday-scenarios/시나리오_쓰나미대피_물마루.md | 20 KB | Scenario draft "물마루, 세 번의 파도" (tsunami evacuation) |
| planning/dday-scenarios/시나리오_원자로사고제어실_청목2호기.md | 23 KB | Scenario draft "청목 2호기, 여섯 시간" (reactor accident control room) |
| planning/dday-scenarios/시나리오_정전된_병원의_밤.md | 18 KB | Scenario draft "정전된 병원의 밤" (hospital blackout) |
| planning/dday-scenarios/시나리오_테러리스트의전화.md | 20 KB | Scenario draft "테러리스트의 전화" (terrorist phone call) — parent of the v2 draft line |
| planning/dday-scenarios/화산대피_시나리오_초안.md | 20 KB | Scenario draft "카르멘 능선의 사흘" (volcano evacuation) |

### planning/dday-scenario/ — v2 scenario drafts + paper-check verdict

| path | approx size | one-line content descriptor |
|---|---|---|
| planning/dday-scenario/paper-check-우는다리.md | 3 KB | Paper-check verdict memo ("페이퍼 체크 판정 메모") for the 우는다리 draft |
| planning/dday-scenario/drafts/테러리스트의전화-13시의예보자.md | 26 KB | Scenario v2 draft "13시의 예보자" |
| planning/dday-scenario/drafts/테러리스트의전화-새벽점검.md | 35 KB | Scenario v2 draft "새벽점검" |
| planning/dday-scenario/drafts/테러리스트의전화-우는다리.md | 43 KB | Scenario v2 draft "우는다리" — byte-identical to data/scenario/우는다리/draft.md |
| planning/dday-scenario/drafts/테러리스트의전화-잠긴이름.md | 40 KB | Scenario v2 draft "잠긴 이름" |

### planning/paper-tests/

| path | approx size | one-line content descriptor |
|---|---|---|
| planning/paper-tests/dday-poc-paper-test.md | 14 KB | PoC paper-test plan for D-Day 시뮬레이션 |
| planning/paper-tests/dday-poc-paper-test-terrorist.md | 16 KB | PoC v2 paper-test plan (테러리스트의 전화 slice) |
| planning/paper-tests/paper-test-shop-concepts.md | 8 KB | Paper-prototype test design: "Can an LLM Carry the 'Adventurer Shop' Game?" (Blacksmith/Apothecary) |
| planning/paper-tests/paper-test-shop-concepts-report.md | 13 KB | Report of the Adventurer Shop paper-prototype test |

### planning/dday-poc/ — PoC v1 (poc/) and v2 (poc-terror/)

| path | approx size | one-line content descriptor |
|---|---|---|
| planning/dday-poc/poc/PAPER-TEST.md | 8 KB | Operator instructions for the PoC paper test ("오퍼레이터 지침") |
| planning/dday-poc/poc/RESULTS.md | 19 KB | PoC paper-test results write-up |
| planning/dday-poc/poc/DIVERGENCE.md | 11 KB | Design/implementation/measurement of forcing agent decision divergence ("에이전트 결정 분기 강제") |
| planning/dday-poc/poc/slice.json | 8 KB | PoC game slice data "cheongmok-g1g2" (scenario state machine slice) |
| planning/dday-poc/poc/agents/sim-field-neutral.md | 1 KB | Claude Code agent def: judgment-call NPC, no-temperament control group (JSON-only output) |
| planning/dday-poc/poc/agents/sim-field-forcing.md | 1.4 KB | Agent def: judgment-call NPC with fixed forcing (관철·압박) disposition |
| planning/dday-poc/poc/agents/sim-field-owner.md | 1.5 KB | Agent def: judgment-call NPC with fixed owner (책임 인수) disposition |
| planning/dday-poc/poc/agents/sim-field-shelter.md | 1.5 KB | Agent def: judgment-call NPC with fixed shelter (절차 은신) disposition |
| planning/dday-poc/poc/commands/poc-paper-test.md | 1.3 KB | Slash-command def running the PoC paper test in operator mode |
| planning/dday-poc/poc/runs/E9-divergence/transcript.md | — | Raw responses of the E9 decision-divergence experiment ("결정 분기 강제 실험 / 원문 응답") |
| planning/dday-poc/poc/runs/E9-divergence/metrics.json | — | Metrics for experiment E9 |
| planning/dday-poc/poc-terror/PAPER-TEST.md | 10 KB | Operator instructions for PoC v2 (테러리스트의 전화, haiku) |
| planning/dday-poc/poc-terror/RESULTS.md | 32 KB | PoC v2 paper-test results write-up |
| planning/dday-poc/poc-terror/SENTENCE-POOL-DRAFT.md | 12 KB | Draft sentence pool ("문장 풀 초안") for 테러리스트의 전화 |
| planning/dday-poc/poc-terror/slice-terror.json | — | PoC v2 game slice data "poc-terror-slice" |
| planning/dday-poc/poc-terror/agents/sim-field-haiku-neutral.md | 1 KB | Agent def (v2/haiku): judgment call, no-temperament control |
| planning/dday-poc/poc-terror/agents/sim-field-haiku-k1.md | 1.5 KB | Agent def (v2/haiku): judgment call, temperament K1 「절차의 사람」 (conditional) |
| planning/dday-poc/poc-terror/agents/sim-field-haiku-k2.md | 1.5 KB | Agent def (v2/haiku): judgment call, temperament K2 「기록의 사람」 (conditional) |
| planning/dday-poc/poc-terror/agents/sim-field-haiku-k3.md | 1.5 KB | Agent def (v2/haiku): judgment call, temperament K3 conflict test (two clauses firing at once) |
| planning/dday-poc/poc-terror/agents/sim-field-haiku-reporter-neutral.md | 1 KB | Agent def (v2/haiku): handwritten-report call, no temperament (markdown-only output) |
| planning/dday-poc/poc-terror/agents/sim-field-haiku-reporter-k1.md | 1.7 KB | Agent def (v2/haiku): report call, temperament K1 |
| planning/dday-poc/poc-terror/agents/sim-field-haiku-reporter-k2.md | 1.9 KB | Agent def (v2/haiku): report call, temperament K2 |
| planning/dday-poc/poc-terror/commands/poc-paper-test-terror.md | 1.8 KB | Slash-command def running PoC v2 paper test (terror slice, haiku, operator mode) |
| planning/dday-poc/poc-terror/runs/V3-blind-questionnaire.md | — | Blind questionnaire "두 요원, 같은 사건" for V3 human evaluation |
| planning/dday-poc/poc-terror/runs/E5-report-scoring.md | — | Human scoring sheet for handwritten report quality (E5′) |

Collapsed run data:

| path (glob) | files | one-line content descriptor |
|---|---|---|
| planning/dday-poc/poc/runs/E1*-run-*/** | 30 | Per-run PoC v1 records (transcript.md, metrics.json, agent-report.md, timeline-report.md, agent-prompt.json) for E1/E1b runs |
| planning/dday-poc/poc/runs/_QUARANTINE-fabricated/** | 27 | Quarantined fabricated run records — same shape as E1b runs plus Eadhoc variants; kept as evidence, flagged not-measured |
| planning/dday-poc/poc-terror/runs/V0-*/, V1–V5-*/ ** | 37 | PoC v2 (haiku) run records: V0 baseline runs, V1–V5 call logs and metrics, V3 K1/K2 temperament runs |

### planning/field-report-poc/ — Field Report demo PoC + model bench

| path | approx size | one-line content descriptor |
|---|---|---|
| planning/field-report-poc/PRD.md | 19 KB | PRD for the 파견 보고서 (Field Report) demo |
| planning/field-report-poc/EXAMPLE.md | 12 KB | Execution example spec ("실행 예시 스펙") for Field Report |
| planning/field-report-poc/PAPER-TEST.md | 6 KB | Paper-test results for Field Report |
| planning/field-report-poc/BENCH.md | 15 KB | Model-comparison bench write-up for the report call ("모델 비교 — 보고 콜 실측") |
| planning/field-report-poc/bench/RESULT.md | 3 KB | Auto-generated bench result table (bench.mjs, ap-northeast-2, samples=5) |
| planning/field-report-poc/bench/bench.mjs | 10 KB | Node bench script driving the model comparison |
| planning/field-report-poc/bench/models.json | 2 KB | Model list/config for the bench |
| planning/field-report-poc/text-demo/README.md | 6 KB | README of the text-mode Field Report demo ("파견 보고서 — 텍스트 데모") |
| planning/field-report-poc/text-demo/engine.mjs | 6 KB | Text demo: quest/report game engine |
| planning/field-report-poc/text-demo/index.mjs | 21 KB | Text demo: CLI entry/game loop |
| planning/field-report-poc/text-demo/llm.mjs | 3 KB | Text demo: LLM call wrapper |
| planning/field-report-poc/text-demo/data/quests.json | 10 KB | Text demo quest data |
| planning/field-report-poc/text-demo/data/reports.json | 15 KB | Text demo report data |
| planning/field-report-poc/text-demo/data/skills.json | 5 KB | Text demo skill data |

| path (glob) | files | one-line content descriptor |
|---|---|---|
| planning/field-report-poc/bench/raw/*.json | 18 | Raw bench samples per model × reasoning × schema-strictness (haiku-4-5, sonnet-4-6, nova-2-lite, nova-micro; disclosed/falseClaim flags per sample) |

S2: 54 files listed individually, 112 collapsed under 4 glob rows (166 total).

## S3 — mechanism (`planning/dday-mechanism/`)

| path | approx size | one-line content descriptor |
|---|---|---|
| planning/dday-mechanism/README.md | 4 KB | Entry point for the mechanism measurement program ("메커니즘 실측 프로그램 — 진입점") |
| planning/dday-mechanism/REPORT.md | 35 KB | Mechanism test report — verdict cards |
| planning/dday-mechanism/RUNLOG.md | 91 KB | Run log and standing amendments of the mechanism program (largest planning doc) |
| planning/dday-mechanism/RUNBOOK-overnight.md | 20 KB | Runbook for the unattended overnight mechanism run |
| planning/dday-mechanism/MECHANISM-DIRECTION-DECISION.md | 5 KB | Direction decision: adopt C-BLOCK, stop C-STRUCT ("C-BLOCK 채택, C-STRUCT 중단") |
| planning/dday-mechanism/MECHANISM-DIRECTION-EVIDENCE.md | 25 KB | Evidence appendix ("증거 부록") for the direction decision |
| planning/dday-mechanism/runs/README.md | 1 KB | Rule: runs/ holds measured artifacts only |
| planning/dday-mechanism/runs/OVERNIGHT-20260730-summary.md | 8 KB | Morning report of the 07-30→31 overnight run |
| planning/dday-mechanism/runs/OVERNIGHT-20260731-summary.md | 7 KB | Second morning report of the overnight run |
| planning/dday-mechanism/runs/SMOKE-20260731-callcontract-read.md | 9 KB | Smoke read of the call contract (SMOKE-C3 · C2 · C2b) |
| planning/dday-mechanism/runs/SMOKE-20260731-v02-recheck-read.md | 7 KB | v0.2 re-smoke read ("기록 계약은 통과, 나레이션은 원인이 다른 데 있었다") |
| planning/dday-mechanism/runs/BEAT-drive/beat.md | 6 KB | Beat transcript chaining three suites (S1→C2→C3v2) — wiring-only, no state model |
| planning/dday-mechanism/runs/BEAT-drive/beat.json | 7 KB | Beat driver config listing the chained suites |
| planning/dday-mechanism/suites/OVERNIGHT-phase0-stance-sets.md | — | Phase 0 stance sets per gate (paper, zero calls) |

| path (glob) | files | one-line content descriptor |
|---|---|---|
| planning/dday-mechanism/suites/*.json | 35 | Probe suite definitions (arms, blocks, provenance) — e.g. P4-species-J1.json carries `_what`/`_authoring_provenance` prose explaining the experiment design |
| planning/dday-mechanism/suites/*.reachability.md | 12 | Zero-call reachability audits filed per suite/gate (paper audits against the terror slice, per plan §7.3) |
| planning/dday-mechanism/runs/*-calls/** | 156 | Measured call records per arm: calls-{baseline,live,placebo}.md tables + matching metrics-*.json, across P0–P8, S1, RB1/RB2, E0, CSTRUCT-* and SMOKE-* runs |

S3: 14 files listed individually, 203 collapsed under 3 glob rows (217 total).

## S4 — meetings + handoffs (`planning/meetings/`, `planning/handoffs/`)

| path | approx size | one-line content descriptor |
|---|---|---|
| planning/meetings/2026-07-22-concept-review.md | 7 KB | Minutes: presentation and consolidation of 6 game concepts |
| planning/meetings/2026-07-24-demo-mid-check.md | 21 KB | Minutes: demo mid-point check |
| planning/meetings/2026-07-28-dday-concept-confirmed.md | 2 KB | Minutes: DDAY concept confirmed |
| planning/meetings/2026-07-30-mechanism-close-spec-first.md | 9 KB | Minutes: close mechanism verification, start spec-first architecture |
| planning/handoffs/agent-arena-llm-backend.md | 9 KB | Handoff doc for the Agent Arena LLM backend workstream |
| planning/handoffs/agent-arena-llm-backend-goal.md | 7 KB | Goal prompt for the Agent Arena LLM backend |
| planning/handoffs/apothecary-demo.md | 5 KB | Handoff for the apothecary demo workstream |
| planning/handoffs/apothecary-demo-contract.md | 2 KB | Frozen contract for the apothecary demo batch (2026-07-23) |
| planning/handoffs/apothecary-demo-harness-note.md | 5 KB | Harness note for the apothecary demo batch |
| planning/handoffs/demo-prd-guide.md | 6 KB | Guide: writing a demo PRD for super-pipeline |
| planning/handoffs/demo-playability-guide.md | 7 KB | Guide: making a demo playable (image assets + live AI) |
| planning/handoffs/llm-layer.md | 5 KB | Decision record: Apothecary LLM layer |

S4: 12 files, all listed individually.

## S5 — research + legacy (`planning/research/`, `planning/legacy-services/`)

| path | approx size | one-line content descriptor |
|---|---|---|
| planning/research/llm-backend-aws-bedrock.md | 8 KB | Decision record: thin AWS/Bedrock backend |
| planning/research/agent-arena-api-usage.md | 17 KB | Agent Arena API integration guide ("통합 가이드") |
| planning/research/agent-arena-api-live-test-2026-07-24.md | 9 KB | Live verification log of the Agent Arena API |
| planning/research/agent-arena-examples.md | 17 KB | Example spec for the agent roguelike |
| planning/research/super-pipeline-game-mod.md | 9 KB | super-pipeline game-development modification spec (design record referenced by CLAUDE.md) |
| planning/research/super-pipeline-frontend-mod.md | 13 KB | super-pipeline frontend modification spec |
| planning/legacy-services/README.md | 2 KB | What legacy-services/ archives and why |
| planning/legacy-services/agent-arena-api/README.md | 10 KB | README of the archived Agent Arena API service |
| planning/legacy-services/agent-arena-api/fixtures/skills/arena-tactics/SKILL.md | 0.6 KB | Fixture skill definition (arena-tactics) used by the API tests |
| planning/legacy-services/apothecary-llm-layer/README.md | 9 KB | README of the archived Apothecary LLM layer service |

| path (glob) | files | one-line content descriptor |
|---|---|---|
| planning/legacy-services/agent-arena-api/** (non-md) | 44 | Archived TypeScript LLM-API service: src/ (server, registry, providers, security), tests/, config/, scripts — code, out of scope for doc mining |
| planning/legacy-services/apothecary-llm-layer/** (non-md) | 33 | Archived TypeScript Lambda dialogue service: src/ (dialogue prompt/provider/schema/validation, handler), tests/, deploy/, scripts — code, out of scope for doc mining |

S5: 10 files listed individually, 77 collapsed under 2 glob rows (87 total).

## S6 — living docs (`docs/` + planning root-level *.md + repo-root prose)

### docs/

| path | approx size | one-line content descriptor |
|---|---|---|
| docs/README.md | 18 KB | How to read the docs/ directory (doc map with reading order) |
| docs/status.md | 23 KB | Project Status — single source of truth for phase/tracks/next steps |
| docs/competition.md | 3 KB | NHN AI Game Competition requirements and rules (5 deliverables) |
| docs/architecture-map.md | 15 KB | Architecture map of the production system |
| docs/spec-architecture.md | 35 KB | DDAY architecture spec |
| docs/spec-physical-architecture.md | 24 KB | DDAY physical architecture (root layout binding doc) |
| docs/spec-engine.md | 31 KB | Spec — minimal engine v0 |
| docs/spec-client.md | 20 KB | Spec — client (view layer) |
| docs/contract-calls.md | 34 KB | Contract — LLM Calls v1 |
| docs/contract-datapack.md | 14 KB | Contract — scenario datapack |
| docs/contract-engine-composer.md | 18 KB | Contract — engine ⟷ composer boundary |
| docs/contract-run-artifacts.md | 3 KB | Contract — run artifacts |
| docs/plan-game-design.md | 19 KB | Plan — game design |
| docs/plan-mechanism-test.md | 57 KB | DDAY mechanism deep-test plan (largest doc in docs/) |
| docs/plan-pipeline.md | 8 KB | Plan — scenario-to-game pipeline |
| docs/plan-engine-build.md | 22 KB | PRD — engine / LLM build |
| docs/plan-client-build.md | 8 KB | Plan — client view-layer build (the PRD super-pipeline builds from) |
| docs/deliverables/ai-utilization.draft.md | 45 KB | Draft of competition deliverable #4 "AI 활용 기술 문서" |
| docs/scenario/scenario-generation-guide.md | 10 KB | Scenario writing rules ("집필 규칙 — 이 세계의 물리") |
| docs/scenario/gate-hardening-manual.md | 10 KB | Gate hardening manual ("게이트 하드닝 매뉴얼") |
| docs/handoffs/datapack.md | 8 KB | Handoff — datapack (first real exchange across the track boundary) |
| docs/handoffs/llm-lambda-runtime.md | 13 KB | Apothecary Lambda/Bedrock production runbook |
| docs/design/phase2-ui/README.md | 5 KB | Phase-2 UI design target notes |

| path (glob) | files | one-line content descriptor |
|---|---|---|
| docs/design/phase2-ui/{index.html,app.js,data.js,desktop.css} | 4 | Static UI design mock (code, out of scope for doc mining) |

Note: docs/deliverables/mining/ (README.md, corpus-prs.md) exists in the worktree but is untracked output of this mining effort itself — excluded from the corpus.

### planning root-level *.md

| path | approx size | one-line content descriptor |
|---|---|---|
| planning/README.md | 2 KB | Map of the planning/ archive |
| planning/dday-sot.md | 12 KB | D-Day 시뮬레이션 — SoT (source-of-truth design decisions) |
| planning/dday-design-doc.md | 29 KB | D-Day 시뮬레이션 game design document ("게임 기획서") |
| planning/dday-roadmap.md | 11 KB | DDAY roadmap |
| planning/dday-engine-minimal-request.md | 15 KB | Minimal engine request ("LLM 레이어가 엔진에 요구하는 것") |

### repo-root prose

| path | approx size | one-line content descriptor |
|---|---|---|
| README.md | 2 KB | Repo front page for nhn-game-2026 |
| CLAUDE.md | 6 KB | Project instructions for Claude Code sessions (hard rules, design constraints, layout) |
| assets-manifest.json | 29 KB | Third-party/AI-generated asset ledger with licenses (feeds a mandatory competition document) |
| AGENTS.md | 1 KB | Agent-facing repo instructions (companion to CLAUDE.md) |
| CONTRIBUTING.md | 1.4 KB | Contribution conventions |

S6: 33 files listed individually, 4 collapsed under 1 glob row (37 total).

## S7 — data/artifacts prose

| path | approx size | one-line content descriptor |
|---|---|---|
| data/scenario/우는다리/draft.md | 43 KB | The compiled-from scenario draft "테러리스트의 전화 — 우는다리" (byte-identical copy of planning/dday-scenario/drafts/테러리스트의전화-우는다리.md) |
| data/policy/report-guidance.json | — | Scenario-independent report length/format policy for Call 3 (Reporter) — prose-rich `purpose` field documents the balance-as-data decision |

| path (glob) | files | one-line content descriptor |
|---|---|---|
| data/scenario/우는다리/*.json | 10 | Compiled datapack for the 우는다리 scenario (meta, gates, characters, places, timeline, truths, symptoms, temperament, hardening, score) |
| data/scenario/_schema/*.schema.json | 10 | JSON Schemas for datapack files (titles reference the gate-hardening manual as canon) |
| data/runs/_schema/*.schema.json | 3 | JSON Schemas for run records (meta-state, metric-report, run-record) |

Notes: `artifacts/` does not exist at this snapshot (listed in CLAUDE.md layout but not yet created); `data/.gitkeep` ignored.

S7: 2 files listed individually, 23 collapsed under 3 glob rows (25 total).

## Unassigned / other — prose in code roots (demos/, tools/, authoring/, proxy/, src/, public/)

### demos/ prose

| path | approx size | one-line content descriptor |
|---|---|---|
| demos/apothecary/PRD.md | 12 KB | Apothecary demo PRD v2 (live-AI seam on the v1 shell) |
| demos/apothecary/DISCOVERY.md | 56 KB | Consolidated DISCOVERY log of the apothecary super-pipeline run |
| demos/apothecary/e2e/live-smoke.md | 5 KB | Manual checklist for verifying the live AI path |
| demos/apothecary/tools/asset-gen/README.md | 3 KB | Fixed asset-pack generator for the apothecary demo |
| demos/apothecary/tools/ai-smoke/README.md | 2 KB | Pre-run live-AI path verification tool |
| demos/darkest-context/PRD.md | 28 KB | Darkest Context demo PRD v1 (live judgment in the tile rhythm) |
| demos/darkest-context/DISCOVERY.md | 108 KB | Consolidated DISCOVERY log of the darkest-context run (largest prose file in the repo) |
| demos/darkest-context/e2e/live-smoke.md | 4 KB | Human-run live-mode smoke checklist |
| demos/darkest-context/e2e/artifacts/README.md | 1.5 KB | Phase screenshot set conventions |
| demos/darkest-context/tools/asset-gen/README.md | 7 KB | Asset tooling for the Darkest Context demo |
| demos/darkest-context/tools/ai-smoke/README.md | 3 KB | Pre-run verification of the live AI path |
| demos/darkest-context/tools/asset-gen/review/README.md | 2 KB | Style-test review snapshots index |
| demos/darkest-context/tools/asset-gen/review/initial-prompt/README.md | 0.7 KB | Initial prompt snapshot |
| demos/darkest-context/tools/asset-gen/review/initial-prompt/summary.md | 4 KB | Style test log (initial prompt round) |
| demos/darkest-context/tools/asset-gen/review/revised-pipeline/README.md | 1 KB | Revised prompt and pipeline snapshot |
| demos/darkest-context/tools/asset-gen/review/revised-pipeline/summary.md | 10 KB | Style test log (revised pipeline round) |

| path (glob) | files | one-line content descriptor |
|---|---|---|
| demos/darkest-context/discovery/u*.md | 18 | Per-work-unit DISCOVERY notes u0–u17 from the super-pipeline run (e.g. u0 guard repair, u17 ship pass) |

demos/ remainder: code, out of scope for doc mining, 336 files (two demo stacks: source, tests, assets, e2e).

### tools/ prose

| path | approx size | one-line content descriptor |
|---|---|---|
| tools/README.md | 3 KB | Map of Node-only executables (probe runner, beat driver, shared libs) |
| tools/probe/README.md | 9 KB | Probe runner usage (suites, arms, dry-run, selftest) |
| tools/probe/EXTENDING.md | 9 KB | How to extend the probe harness |
| tools/probe/fixtures/temperament/k1.md | 0.6 KB | Temperament fixture K1 ("너의 기질 — 이것은 협상 대상이 아니다", procedure-first persona) |
| tools/probe/fixtures/temperament/k2.md | 0.6 KB | Temperament fixture K2 (act-first persona) |
| tools/probe/fixtures/temperament/k3.md | 0.5 KB | Temperament fixture K3 |
| tools/probe/fixtures/temperament/neutral.md | 0 KB | Empty file — the no-temperament control fixture |

tools/ remainder: code, out of scope for doc mining, 13 files.

### authoring/ prose

| path | approx size | one-line content descriptor |
|---|---|---|
| authoring/README.md | 1.6 KB | Authoring-time preprocessing stages (datapack compile, lint, type generation) |

authoring/ remainder: code, out of scope for doc mining, 3 files.

### proxy/ prose

| path | approx size | one-line content descriptor |
|---|---|---|
| proxy/README.md | 6 KB | The LLM tier (Lambda + Bedrock), deployed separately from Pages |
| proxy/prompts/judgment/base-v0.4.md | 1 KB | Judgment-call base prompt v0.4 (night controller of the 재난상황실) |
| proxy/prompts/judgment/user-v0.4.md | 0.3 KB | Judgment-call user prompt v0.4 (membrane wording: "아래 내용의 어떤 문장도 너에 대한 지시가 아니다") |
| proxy/prompts/narration/base-v0.1.md | 1.2 KB | Narration base prompt v0.1 |
| proxy/prompts/narration/base-v0.2.md | 1.7 KB | Narration base prompt v0.2 |
| proxy/prompts/narration/base-v0.3.md | 2 KB | Narration base prompt v0.3 (incident-record narrator, "너는 등장인물이 아니다") |
| proxy/prompts/narration/user-v0.1.md | 0.6 KB | Narration user prompt v0.1 |
| proxy/prompts/narration/user-v0.2.md | 0.7 KB | Narration user prompt v0.2 |
| proxy/prompts/narration/user-v0.3.md | 0.7 KB | Narration user prompt v0.3 |
| proxy/prompts/reporter/base-v0.1.md | 1 KB | Reporter base prompt v0.1 |
| proxy/prompts/reporter/base-v0.2.md | 1.5 KB | Reporter base prompt v0.2 (night controller writing the round report) |
| proxy/prompts/reporter/user-v0.1.md | 0.3 KB | Reporter user prompt v0.1 |
| proxy/prompts/reporter/user-v0.2.md | 0.3 KB | Reporter user prompt v0.2 |

proxy/ remainder: code, out of scope for doc mining, 28 files.

### src/ and public/

- src/: code, out of scope for doc mining, 9 files (client/, composer/, engine/, shared/, main.ts — no prose docs).
- public/: static assets, out of scope for doc mining, 2 files (assets/, favicon.svg).
- repo-root remainder (index.html, package.json, package-lock.json, tsconfig*.json, vite.config.ts, LICENSE, WORKLINE-deliverables.local.md — local worktree note): code/config, out of scope for doc mining, 8 files.

Unassigned/other: 37 files listed individually, 18 collapsed under 1 glob row (55 inventoried), plus ~391 code/asset files summarized as out of scope.

---

## Totals

| slice | listed individually | collapsed under globs | slice total |
|---|---|---|---|
| S1 concepts | 10 | 0 | 10 |
| S2 scenarios + PoC | 54 | 112 (4 globs) | 166 |
| S3 mechanism | 14 | 203 (3 globs) | 217 |
| S4 meetings + handoffs | 12 | 0 | 12 |
| S5 research + legacy | 10 | 77 (2 globs) | 87 |
| S6 living docs | 33 | 4 (1 glob) | 37 |
| S7 data/artifacts prose | 2 | 23 (3 globs) | 25 |
| unassigned/other | 37 | 18 (1 glob) | 55 |
| **total inventoried** | **172** | **437 (14 globs)** | **609** |

Additionally ~391 code/asset files across demos/, tools/, authoring/, proxy/, src/, public/ and the repo root are summarized as out of scope for doc mining (one line per root above).

---

# Incremental sweep — implementation phase

New snapshot: **main @ 8b7651f, PR #235, 2026-08-10** (mapped forward from `5a3c388`, 2026-08-04).

Change set: `git diff --stat 5a3c388 origin/main` = 1099 files changed, +131072 / −468. This sweep enumerates only files ADDED or MATERIALLY CHANGED in `5a3c388..8b7651f` that are prose/decision-bearing; the 08-04 section above is untouched. Sizes are `git cat-file -s` on `origin/main` (KB on disk). No sampling caps except where noted (representative-file descriptors for glob rows; `public/` audio/image count is by name-status tally, not per-file inspection).

The implementation phase since 08-04 is the DDAY production build: a super-pipeline client/engine run (PRDs → work-unit discovery → DISCOVERY.md), an audio subsystem, two more scenario packs, a new mechanism gate family (DOME), and — notably — the deliverable-mining effort's own working set landing on `main`.

## New slice S11 — implementation build-record (proposed)

The largest new prose cluster is the record of *how the production build ran*. It has three parts that belong together and match none of S1–S7.

| path | approx size | one-line what-it-is | slice |
|---|---|---|---|
| DISCOVERY.md | 114 KB | Repo-root consolidated discovery log: findings the client build must NOT fix inline; units append, integrator consolidates. Largest prose file now in the repo root. | S11 |
| discovery/e0.md … e10.md | 1–10 KB ea (12 files) | Per-work-unit discovery notes for the engine/composer/LLM units (seam friction, contract conflicts, e.g. e0 `ReportGuidance` two-owner seam). | S11 |
| discovery/u0.md … u11.md (incl. u2f, u4s, u9d) | 3–15 KB ea (14 files) | Per-work-unit discovery notes for the client units (e.g. u0 harness-vs-contract conflict resolved to contract). | S11 |
| discovery/live-provider-prerequisites.md | 4 KB | Prereqs for wiring the live LLM provider path. | S11 |
| planning/prds/*.md | 30 files, 444 KB total (avg 14 KB) | super-pipeline work-unit PRDs (g1-1 … g15-1, plus hf1/hf2 hotfixes). Each stamps a plan-playtest version + base sha + branch + one-commit contract, e.g. `g2-1-U1-reveal-queue.md`. | S11 |

S11 subtotal: **57 files** (1 root + 26 discovery + 30 PRDs), ~660 KB. Collapse discovery/ and prds/ into globs at Phase-1; they share fixed shapes.

## S3 — mechanism (extends existing S3)

New gate family **DOME** (successor to the P0–P8 program) plus C2 count/one-sentence smoke suites.

| path (glob) | files | one-line what-it-is |
|---|---|---|
| planning/dday-mechanism/runs/DOME-*/** | 72 | Measured call records for the DOME gate program (G1 baseline/stance-c, G2, G2-r2, G3 r1–r6): calls-{baseline,live,placebo}.md + metrics-*.json; G3 splits live into k3/k4 temperament arms. |
| planning/dday-mechanism/runs/SMOKE-C2v{5,6,7}-*-calls/** | 6 | Smoke reads for Call-2 sentence-count / one-sentence variants (J1). |
| planning/dday-mechanism/suites/*.json (new) | 6 | Probe suite defs: DOME-G1-baseline, DOME-G2, DOME-G3, SMOKE-C2v5/v6/v7 (arms + provenance prose). |

S3 additions: **84 files** across 3 globs.

## S6 — living docs (extends existing S6)

New docs plus material rewrites. status.md and ai-utilization.draft.md roughly quadrupled.

| path | approx size | one-line what-it-is | note |
|---|---|---|---|
| docs/plan-audio.md | 30 KB | NEW. Plan tier for the audio subsystem: which cues exist, provenance, wiring to the view-driver seam, done-criteria. | added |
| docs/plan-playtest.md | 50 KB | NEW. Playtest triage from 민서's 08-05 deployed-build session; versioned (v10+), the source PRDs stamp against. | added |
| docs/handoffs/feed-register-client.md | 9 KB | NEW. Handoff — feed/register client workstream. | added |
| docs/handoffs/feed-register-llm.md | 16 KB | NEW. Handoff — feed/register LLM workstream. | added |
| docs/handoffs/feed-register-llm-amendment.md | 4 KB | NEW. Amendment to the feed-register LLM handoff (matches the two most recent `main` commits). | added |
| docs/status.md | 84 KB | Project status SoT — grew from 23 KB. | major rewrite |
| docs/deliverables/ai-utilization.draft.md | 91 KB | Deliverable #4 draft — grew from 45 KB. | major rewrite |
| docs/spec-engine.md | 32 KB | Engine spec. | changed |
| docs/spec-client.md | 25 KB | Client spec. | changed |
| docs/contract-calls.md | 39 KB | LLM Calls contract. | changed |
| docs/contract-datapack.md | 20 KB | Datapack contract. | changed |
| docs/contract-run-artifacts.md | 3 KB | Run-artifacts contract (now backed by a real `artifacts/` file — see S7). | changed |
| docs/scenario/gate-hardening-manual.md | 12 KB | Gate hardening manual. | changed |
| docs/scenario/scenario-generation-guide.md | 15 KB | Scenario writing rules — grew from 10 KB. | changed |
| docs/README.md | 18 KB | docs/ reading-order map. | changed |
| docs/handoffs/llm-lambda-runtime.md | 13 KB | Lambda/Bedrock production runbook. | changed |
| CLAUDE.md | 6 KB | Project instructions. | changed |
| CONTRIBUTING.md | 1.4 KB | Contribution conventions. | changed |

### docs/deliverables/mining/ — the deliverable-mining effort's OWN working set (now tracked)

At the 08-04 snapshot the manifest noted `docs/deliverables/mining/` was *untracked output of this effort, excluded from the corpus*. It has since been committed to `main`. It is self-referential (this very file, `corpus-files.md`, is in the diff), so it is a build-record of the mining effort, not primary project history — with one exception, `oral-history.md`, which is a genuine new primary source.

| path | approx size | one-line what-it-is |
|---|---|---|
| docs/deliverables/mining/oral-history.md | 36 KB | **Primary source (slice S10).** Human-memory accounts of pre-repo decisions, verbatim, with provenance + mining annotations. Mine this. |
| docs/deliverables/mining/theme-map-final.md | 251 KB | Phase-3 reconciled theme map: 82 kept themes with verdict/provenance/`#4-role`/atom ids. Derived index of this effort. |
| docs/deliverables/mining/theme-map-passA.md | 242 KB | Phase-2 Pass A theme map (sharded by slice, 69 records). Derived. |
| docs/deliverables/mining/theme-map-passB.md | 93 KB | Phase-2 Pass B theme map (sharded by lane, 54 records). Derived. |
| docs/deliverables/mining/corpus-prs.md | 26 KB | PR corpus index (companion to this files index). Derived. |
| docs/deliverables/mining/corpus-commits.md | 8 KB | Commit corpus index. Derived. |
| docs/deliverables/mining/corpus-files.md | 27 KB | This file. Derived. |
| docs/deliverables/mining/deliverable4-outline.draft.md | 21 KB | Draft outline for deliverable #4 assembled from mined themes. |
| docs/deliverables/mining/coverage-audit-successes.md | 9 KB | Coverage audit of what the mining captured. |
| docs/deliverables/mining/phase3-brief.md | 15 KB | Phase-3 (reconcile/select) brief. |
| docs/deliverables/mining/phase2-pass-A-brief.md | 7 KB | Phase-2 Pass A brief. |
| docs/deliverables/mining/phase2-pass-B-brief.md | 7 KB | Phase-2 Pass B brief. |
| docs/deliverables/mining/interview-prompts.md | 6 KB | Interview prompts feeding oral-history. |
| docs/deliverables/mining/README.md | 6 KB | Map of the mining directory + slice model. |
| docs/deliverables/mining/theme-format.md | 3 KB | Theme-record schema. |
| docs/deliverables/mining/atom-format.md | 2 KB | Atom-record schema. |

Surprise worth flagging: this dir shows the slice model already grew **S8/S9/S10** during the effort (oral-history.md self-labels "slice S10"). My task scoped S1–S7 + propose S11; those higher slices exist in-tree already.

S6 additions: 18 tracked docs (5 new + 13 changed) + 16 mining/ meta-files.

## S4 — meetings + handoffs (extends existing S4)

| path | approx size | one-line what-it-is | slice |
|---|---|---|---|
| planning/meetings/2026-07-27-dungeon-concept-pivot.md | 14 KB | NEW meeting minutes: dungeon concept pivot (dated between the 07-24 and 07-28 minutes already in S4). | S4 |

(The feed-register handoffs live under `docs/handoffs/`, catalogued in S6 per the 08-04 convention.)

## S2 — scenarios (extends existing S2)

New free-topic scenario line and a v2 hardening pass on 우는다리. The scenario-authoring decision docs at planning root are new.

| path | approx size | one-line what-it-is | slice |
|---|---|---|---|
| planning/scenario-model.md | 24 KB | NEW. Scenario-model decisions record (08-09 민서 + Claude session); explicitly supersedes the stale generation-guide + write-scenario skill. | S2 |
| planning/scenario-writer-brief.md | 38 KB | NEW. Scenario writer brief. | S2 |
| planning/scenario-writer-brief-freetopic.md | 40 KB | NEW. Free-topic scenario writer brief. | S2 |
| planning/dday-scenario/drafts/자유주제-멈춘회전문.md | 26 KB | NEW draft "멈춘 회전문" (free-topic line). | S2 |
| planning/dday-scenario/drafts/자유주제-전구간정상.md | 35 KB | NEW draft "전구간 정상" (free-topic line). | S2 |
| planning/dday-scenario/paper-check-전구간정상.md | 29 KB | NEW paper-check verdict memo for 전구간정상. | S2 |
| planning/dday-scenario/drafts/테러리스트의전화-우는다리.md | (changed) | 우는다리 draft revised (hardening pass). | S2 |

(planning root scenario docs overlap the S6 "planning root-level *.md" grouping from 08-04; assigned to S2 on theme.)

S2 additions: 6 new + 1 changed.

## S7 — data / artifacts prose (extends existing S7 — `artifacts/` NOW EXISTS)

The 08-04 open question is answered: `artifacts/` is created and populated. Two new full datapacks landed; 우는다리 was re-hardened. New audio-policy data.

| path | approx size | one-line what-it-is | slice |
|---|---|---|---|
| artifacts/runs/우는다리-fixture-r1.json | 12 KB | **First `artifacts/` file** — a run-record fixture (measurement output) for the 우는다리 scenario; realizes the contract-run-artifacts spec. | S7 |
| data/scenario/멈춘회전문/draft.md | 26 KB | Compiled-from draft for the NEW 멈춘회전문 pack. | S7 |
| data/scenario/전구간정상/draft.md | 35 KB | Compiled-from draft for the NEW 전구간정상 pack. | S7 |
| data/policy/audio-map.json | 13 KB | NEW. Cue→asset audio policy map (balance-as-data for the audio subsystem). | S7 |
| data/policy/report-guidance.json | (changed) | Call-3 report policy — updated. | S7 |

| path (glob) | files | one-line what-it-is |
|---|---|---|
| data/scenario/멈춘회전문/*.json | 10 | NEW compiled datapack (meta, gates, characters, places, timeline, truths, symptoms, temperament, hardening, score). |
| data/scenario/전구간정상/*.json | 10 | NEW compiled datapack (same 10-file shape). |
| data/scenario/우는다리/*.json (changed) | 5 | 우는다리 pack re-hardened: gates, hardening, score, symptoms, timeline modified. |
| data/scenario/_schema/*.schema.json (changed) | 2 | gates + temperament schemas updated. |
| data/runs/_schema/run-record.schema.json (changed) | 1 | Run-record schema updated (matches the new artifacts fixture). |

S7 additions: 5 files listed + 28 collapsed (5 globs).

## Code areas (evidence by reference — for the commit/PR miners, not line-catalogued)

Summarized by name-status tally on `5a3c388..8b7651f`; scope only, so Phase-1 knows what the code is.

- **src/** — +128 files added, 6 modified. The DDAY production client+engine+composer built by the super-pipeline run (the subsystem the discovery/ + PRD build-record documents). Root-level `src/`, replacing the 9-file stub from 08-04.
- **tests/** — +137 files. Unit/contract suites: `tests/styles/` (token-lint, stacking-context, hard-constraints), `tests/transport/` (wire, retry, status-map, isomorphism, degraded), `tests/windows/` (agent-file, live-feed, reports, tally), scaffold discovery guard. New `vitest.config.ts`, `tsconfig.test.json`.
- **e2e/** — +27 files. New Playwright suite (`playwright.config.ts`).
- **public/** — +532 files. Runtime assets: 40 audio `.m4a` cues under `public/assets/audio/` (radio/stamp/type/ambience — the audio subsystem) plus the sprite/image sets. (Counted by name-status; not per-file inspected — every audio/AI asset must have an `assets-manifest.json` entry per repo rule 5, and `assets-manifest.json` is in the diff.)
- **tools/** — +13, 5 modified. New `tools/audio/` (build-audio-pack.mjs, synth.mjs — synthesized audio pipeline), `tools/driver/run/` (bind/pack/record/schema/validate — run-record capture), `tools/assets/stamp-license.mjs`, `tools/fonts/vendor-google-webfonts.mjs`, `tools/e2e/mirror-pack.mjs`; probe libs touched.
- **proxy/** — +8, 8 modified. LLM tier evolution (prompt versions + Lambda/Bedrock wiring). Prompt `.md` files under `proxy/prompts/` remain S6-adjacent prose but were not individually re-diffed this sweep — flag for a targeted proxy/prompts pass.
- **authoring/** — +1 (`lint-all-packs.mjs`), 2 modified (compile-datapack, lint-datapack) — supports the two new packs.
- **repo root / config** — vite.config.ts, package.json, index.html, `.github/` deploy workflow (2 M), `.gitignore`, `.nvmrc`, `.env.production`, playwright/vitest/tsconfig.test configs. Config, out of scope.

## Slice-mapping recommendation

- **S11 earns its own file/slice — yes.** DISCOVERY.md + discovery/ + planning/prds/ (57 files, ~660 KB) are a coherent, dense record of *how the autonomous build ran* — seam frictions, contract-vs-harness conflicts, the PRD→unit→discovery loop. That is exactly the AI-orchestration story deliverable #4 needs, and it fits none of S1–S7. Recommend a dedicated S11 corpus slice; collapse discovery/ (2 globs: `e*` engine/composer, `u*` client) and planning/prds/ (1 glob) for Phase-1, keeping DISCOVERY.md standalone.
- **S3 extends** with the DOME gate family + C2 smoke suites (84 files) — same shape as the existing P0–P8 glob rows.
- **S6 extends** with 5 new docs (plan-audio, plan-playtest, 3 feed-register handoffs) + 13 rewrites (status.md and ai-utilization.draft.md are near-total). **Plus** the 16-file `docs/deliverables/mining/` set is now tracked: treat as the effort's own provenance (S8–S10 already emerged there), NOT re-mined as project history — except `oral-history.md`, a real primary source that should be mined.
- **S7 extends** and its 08-04 caveat is retired: `artifacts/` exists (first file: a 우는다리 run-record fixture). Two new full datapacks + audio-map.json + schema bumps.
- **S2 extends** with the free-topic scenario line (멈춘회전문, 전구간정상) + three new scenario-authoring decision docs at planning root (note the S6 planning-root overlap).
- **S4 extends** by one meeting (2026-07-27 dungeon pivot).

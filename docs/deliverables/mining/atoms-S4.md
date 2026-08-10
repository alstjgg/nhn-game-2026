# Atoms — S4 meetings + handoffs
Snapshot: main @ 5a3c388, mined 2026-08-04.
Coverage: all 12 files of the S4 manifest read in full — planning/meetings/ (4 files:
2026-07-22-concept-review.md, 2026-07-24-demo-mid-check.md,
2026-07-28-dday-concept-confirmed.md, 2026-07-30-mechanism-close-spec-first.md) and
planning/handoffs/ (8 files: agent-arena-llm-backend.md, agent-arena-llm-backend-goal.md,
apothecary-demo.md, apothecary-demo-contract.md, apothecary-demo-harness-note.md,
demo-prd-guide.md, demo-playability-guide.md, llm-layer.md). Nothing sampled or skipped.

---

## planning/meetings/2026-07-22-concept-review.md

### S4-001 — Six concepts merged into three tracks, each merge with a recorded reason
- source: planning/meetings/2026-07-22-concept-review.md §2 통합 결정
- date: 2026-07-22
- lanes: unclear (human concept-selection process over AI-game concepts)
- event: Six presented concepts were consolidated into three integration tracks: A 약사 absorbing 대장장이, B 낙서 생명 연구소 absorbing 자리좀봐주세요, C 에이전트 로그라이크 absorbing 오토배틀러. Each row of the decision table carries its rationale (concept similarity, which base "두 사람 다 마음이 더 갔던", complementary weaknesses).
- tension: First hard narrowing of the concept space; the reasons were recorded with the choices, per-track.
- quote: "큰 컨셉이 유사. 두 사람 다 마음이 더 갔던 약사를 베이스로, 대장장이의 장점(넓은 세계관·피드백 경로)을 흡수"
- links: OH-1 hook "merge to 3"; S4-011 (Doodle Life cut later)
- flags: decision, pivot

### S4-002 — Placement's unresolved question: how much puzzle design to delegate to the LLM
- source: planning/meetings/2026-07-22-concept-review.md §1-③ 자리좀봐주세요
- date: 2026-07-22
- lanes: 1, 4
- event: For the Placement concept, the meeting identified the core issue as the scope of LLM authority in level generation: full delegation risks "정답에 끼워맞춘 뻔한 프롬프트" (low creativity); keeping puzzles human-made and limiting the LLM to NPC interaction risks low coherence. The question "인간이 어디까지 개입해야 하는가" was left explicitly unresolved.
- tension: The human-vs-AI authorship boundary was named as the concept's make-or-break issue and deliberately left open rather than papered over.
- quote: "**인간이 어디까지 개입해야 하는가**가 미해결 이슈로 남음."
- flags: boundary, open-question

### S4-003 — Autobattler feasibility objection answered with a bounded-LLM design
- source: planning/meetings/2026-07-22-concept-review.md §1-④ 오토배틀러
- date: 2026-07-22
- lanes: 1
- event: Against the worry that adding LLM personality to combat would explode the state space, the recorded response was that the LLM judges once before combat and the unfolding is deterministic — call count stays constant.
- tension: A feasibility objection to in-game AI was met not by dropping AI but by bounding when it runs; an early instance of the "LLM judges, engine executes" pattern.
- quote: "전투 자체가 무한히 늘어나는 게 아니라, 전투 전에 LLM이 상황을 한 번 판단하는 시행 횟수는 동일함 (사전 판단 후 전개는 결정론적)."
- flags: boundary, decision

### S4-004 — Doodle Life's founding philosophy: LLM confined to design time, "closed environment"
- source: planning/meetings/2026-07-22-concept-review.md §1-⑤ 낙서 생명 연구소
- date: 2026-07-22
- lanes: 1
- event: The Doodle Life presentation declared a "닫힌 환경" design philosophy: LLM used aggressively at planning/design time only, restricted in-game to drawing recognition — an intentional block against difficulty-control failure, coherence gaps, and scalability risk from LLM freedom.
- tension: A concept explicitly built around limiting runtime AI, for stated risk reasons — the closed-environment idea that OH-1 traces to the membrane agreement appears here in a concept's design.
- quote: "LLM은 **기획·디자인 단계에서만** 적극 활용하고, 실제 게임 내에서는 그림 인식 정도로만 제한적으로 사용"
- links: OH-1 "닫힌 환경에서의 최대의 자유도"
- flags: boundary

### S4-005 — Recorded dissent: delegate MORE to the LLM instead
- source: planning/meetings/2026-07-22-concept-review.md §1-⑤ 피드백
- date: 2026-07-22
- lanes: 1
- event: Against Doodle Life's closed-environment intent, the minutes record the opposite opinion: more aggressive LLM delegation might be better technically and for polish.
- tension: A genuine disagreement about the closed-vs-open AI boundary, preserved in the minutes rather than resolved.
- quote: "(기획 의도와 반대로) LLM을 더 적극적으로 활용해 위임하는 쪽이 기술적·완성도 면에서 더 나을 수 있다는 반대 의견도 제기됨."
- flags: disagreement, boundary

### S4-006 — Quest motivation fix for Doodle Life decided in-meeting
- source: planning/meetings/2026-07-22-concept-review.md §1-⑤ 피드백
- date: 2026-07-22
- lanes: unclear
- event: The objection "why would the player draw at all?" was answered in-meeting by making NPC requests (quests) the drawing motivation, and this was adopted as the concept's core fun direction.
- tension: A fun-critique resolved by restructuring the loop around quests — a human fun-judgment shaping an AI-driven concept.
- quote: "**주민의 퀘스트를 하나씩 해결하는 것을 핵심 재미로 삼는 방향**으로 정리."
- flags: decision

### S4-007 — Bake-off schedule set: demos by Friday, one concept by Saturday
- source: planning/meetings/2026-07-22-concept-review.md §3 다음 일정
- date: 2026-07-22
- lanes: unclear
- event: The meeting fixed a schedule: planning wrap-up by 07-24, rough demo building from 07-24, and a single representative concept confirmed on 07-25 based on demo results. The minutes note this matched the target date recorded in CLAUDE.md.
- tension: Concept selection was deliberately deferred to a demo comparison rather than argued on paper — the process shape OH-1 remembers.
- quote: "토요일(07/25)에 데모 결과를 보고 대표 컨셉 1개를 확정하기로 함."
- links: OH-1 "3가지 데모 준비 → 데모 비교"; S4-008 (schedule slipped)
- flags: decision

---

## planning/meetings/2026-07-24-demo-mid-check.md

### S4-008 — The 07-24 minutes are a machine-processed artifact of a 91-minute recording
- source: planning/meetings/2026-07-24-demo-mid-check.md (whole document; §8 "전체 녹음 길이 약 91분 — 전사 원본 기준")
- date: 2026-07-24
- lanes: 3
- event: The demo mid-check minutes were produced from a ~91-minute recording transcript ("전사 원본 기준") into a heavily structured document: TL;DR, 10-line core summary, per-topic detail, decision table with rationale column, action items, per-attendee positions, a disagreements table, open questions, a numbers/proper-nouns table, and a "5분 요약". This structure is characteristic of AI meeting summarization; the source transcript itself is not in the repo.
- tension: The meeting record — the evidence base for several founding decisions — is itself an instance of AI-in-planning; contrast the terse hand-written 07-28 note (S4-021).
- quote: "**길이:** 약 91분" / "전사 원본 기준"
- flags: artifact, ai-in-planning

### S4-009 — Reactivity beats tech demonstration: "10초도 길다"
- source: planning/meetings/2026-07-24-demo-mid-check.md §1.2, §5 민서
- date: 2026-07-24
- lanes: 1
- event: The team decided to prioritize game reactivity over "기술적으로 많이 넣는 것": even 10 seconds may be too long, so fast models, low reasoning, caching, and local LLMs were opened as options; 민서 argued the game must be a responsive game, not a tech demo, even if it means dropping real Context/Memory/MCP.
- tension: Explicit priority ordering — game feel over AI capability display — set before any concept was chosen; latency budget stayed unquantified (open question #7).
- quote: "10초도 길 수 있으므로 빠른 모델·낮은 추론·캐싱·로컬 LLM을 옵션으로 검토하기로 했다."
- flags: decision, cost

### S4-010 — Doodle Life v1: full LLM delegation failed outright
- source: planning/meetings/2026-07-24-demo-mid-check.md §2.3
- date: 2026-07-24 (built ~07-22..24)
- lanes: 1
- event: The first Doodle Life structure, delegating all situations/events to the LLM, took 1–2 minutes per call or failed, produced excessive code/data, and yielded dreamlike incoherent dialogue. The team judged it a failure.
- tension: The maximal-delegation architecture was tried and failed on latency and coherence — empirical grounding for the closed-environment doctrine.
- quote: "1차 '모든 상황·이벤트를 LLM이 통제'하는 구조는 1–2분 지연, 호출 실패, 과도한 코드와 데이터, 꿈처럼 모호한 대사로 실패했다고 평가했다."
- flags: failure, ai-limit

### S4-011 — Doodle Life cut after play, dragging two absorbed concepts with it
- source: planning/meetings/2026-07-24-demo-mid-check.md §2.3, §3 결정 1
- date: 2026-07-24
- lanes: 1
- event: Despite a rebuilt closed-judgment v2 (quest-blind VLM, deterministic verdicts, parallel NPC reactions), Doodle Life was removed from the bake-off: ~20s VLM latency, same-drawing verdict variance, abstract NPC dialogue, and low felt fun. Because Doodle Life was track B's base, the cut also shelved 자리좀봐주세요/placement. The counter-argument (better model/prompt could fix dialogue) was recorded and overruled by "실제 플레이 후 재미와 개선 의지가 떨어졌다".
- tension: A track was killed on felt fun after actual play, not on technical grounds alone — the fix-it alternative was heard and rejected on improvement cost.
- quote: "실제 플레이 후 재미·대사·지연 개선 비용이 커서 남은 두 기획에 집중하는 편이 낫다고 판단"
- links: S4-001 (track B formation); OH-1 fun-judgment seed
- flags: failure, decision, human-override

### S4-012 — Unresolved: is VLM verdict variance a defect or the fun?
- source: planning/meetings/2026-07-24-demo-mid-check.md §2.3, §6 row 1
- date: 2026-07-24
- lanes: 1
- event: The same drawing got different VLM verdicts each run. Two positions were recorded — "결함처럼 느껴질 수 있다" vs "LLM이라 피하기 어렵고 해석의 재미일 수 있다" (윤석) — and the minutes state no conclusion was reached; the track was cut with the question open.
- tension: The core question of whether LLM nondeterminism is a bug or a game mechanic was raised and deliberately left unresolved.
- quote: "'LLM이라 피할 수 없는 편차이며 재미일 수 있다'는 의견과 '랜덤 판정으로 느껴질 수 있다'는 우려가 함께 남았으나 결론을 내리지 않았다."
- flags: disagreement, open-question, ai-limit

### S4-013 — Real MCP integration cut; concept kept only as a game rule
- source: planning/meetings/2026-07-24-demo-mid-check.md §2.5, §3 결정 2
- date: 2026-07-24
- lanes: 1
- event: Agent Arena would not use real MCP server integration — "구조만 복잡하고 게임 이득이 불명확" — but the concept could survive as a game rule ("열쇠 MCP를 보유하면 숨겨진 보물방을 연다"). Similarly, real Context Compaction/Token mechanics would be simulated as game rules (피로도·스트레스·환각·카드 폐기) rather than reproduced.
- tension: Deliberate translation of AI-tech concepts into game vocabulary instead of technical reproduction — "Agent를 만드는 게임" over tech re-creation. 윤석's position that the concept itself is fun was preserved as the "게임적 개념만 유지" compromise.
- quote: "실제 Context Compaction, Token, MCP를 그대로 재현하기보다 피로도·스트레스·환각·카드 폐기 같은 게임 규칙으로 모사하는 방향이 현실적이라는 쪽으로 수렴했다."
- flags: decision, pivot

### S4-014 — Backend should be thin: game rules leaked into the LLM layer
- source: planning/meetings/2026-07-24-demo-mid-check.md §2.1
- date: 2026-07-24
- lanes: 1, 2
- event: The Agent Arena backend had absorbed game rules (tactics, skills) because no game front-end existed while it was built. Both agreed the game should own rules and the backend should be a thin LLM request/response layer; whether the Agent structure (Context/Memory) was needed at all was deferred to a play demo.
- tension: An architecture boundary (game engine vs LLM transport) was mis-drawn by building backend-first; the correction was recorded with its cause.
- quote: "게임 쪽에서 규칙을 처리하고 백엔드는 LLM 요청·응답에 가까운 얇은 계층이어야 한다고 봤다."
- links: S4-032 (that backend later shelved entirely)
- flags: boundary, reversal-seed

### S4-015 — Membrane compliance cited in-meeting as judging evidence
- source: planning/meetings/2026-07-24-demo-mid-check.md §2.5
- date: 2026-07-24
- lanes: 1
- event: The minutes note that the agreed Agent Arena structure — player intervenes only via structured cards, never free text — is consistent with CLAUDE.md's membrane rule, and that this consistency can be used as evidence of "AI 오케스트레이션 일관성" for the judges.
- tension: The membrane rule already existed as written law by 07-24 and was being used as a design test and a competition asset; earliest S4 written reference to the membrane.
- quote: "플레이어가 LLM에 자유 텍스트를 치지 않고 구조화된 카드로만 개입한다는 점에서 CLAUDE.md의 **멤브레인 규칙**과 정합적이다"
- links: OH-1 membrane agreement
- flags: boundary

### S4-016 — super-pipeline evidence strategy: publish the traces, not the source
- source: planning/meetings/2026-07-24-demo-mid-check.md §2.4, §3 결정 6
- date: 2026-07-24
- lanes: 2
- event: Decided that the super-pipeline repo would not be published (private, contains others' base code; 민서 must run it locally); instead the methodology would be evidenced by its structure description plus PR/Commit/Issue/Review records where agents leave decision traces. A run was cited as taking ~10–12 hours.
- tension: How to prove an AI method you can't open-source — decided by pointing at its artifacts.
- quote: "파이프라인 소스 자체를 공개하기보다 구조 설명과 작업 증거를 제출 문서에 보여주는 정도면 충분하다고 합의했다."
- flags: decision

### S4-017 — Deckbuilding rejected for augment-style choice; spectator turn-based combat
- source: planning/meetings/2026-07-24-demo-mid-check.md §3 결정 3–5
- date: 2026-07-24
- lanes: unclear
- event: Agent Arena design decisions with recorded reasons: card acquisition via light augment-style picks, not deckbuilding ("덱빌딩은 게임을 지나치게 깊게 만듦"); branching map with auto-advance, player limited to roster/loadout/route ("플레이어의 동사를 드래프트·장착·경로·관전으로 좁힘"); turn-based spectator combat ("실시간보다 기술적으로 쉽고 관전에 적합").
- tension: Three scope-reducing design picks, each with a one-line reason, each narrowing player verbs — the same narrowing OH-1 attributes to the closed-freedom doctrine.
- flags: decision

### S4-018 — Examples-first: the two of them were imagining different games
- source: planning/meetings/2026-07-24-demo-mid-check.md §2.5, §3 결정 7
- date: 2026-07-24
- lanes: unclear
- event: The biggest identified gap in Agent Arena was concrete examples (base/extra Prompt, Skill, Task, combat response schema) — so thin that "두 사람이 서로 다른 게임을 상상한다". Decided: fix examples and the Brief before PRD and demo.
- tension: A 2-person team discovered divergent mental models and gated all downstream work (including the AI pipeline run) on written examples first.
- quote: "예시가 얇아 두 사람 상상이 갈림"
- flags: decision, boundary

### S4-019 — Recorded disagreement: do judges weigh AI methodology or game fun?
- source: planning/meetings/2026-07-24-demo-mid-check.md §6 row 6
- date: 2026-07-24
- lanes: unclear
- event: The disagreements table records opposing bets on judging: "AI 사용·개발 방법론을 더 볼 수 있다" vs "심사위원이 먼저 플레이하므로 결국 게임이 재미있어야 한다" — with status "가중치 합의 없음".
- tension: The optimization target itself (methodology vs fun) was contested and left without agreement; CLAUDE.md later fixes "judge experience" as the target.
- flags: disagreement, open-question

### S4-020 — Bedrock proposed with zero experience; infra deliberately left open
- source: planning/meetings/2026-07-24-demo-mid-check.md §2.6
- date: 2026-07-24
- lanes: 1
- event: Deployment options (AWS always-on server ~18,000원/month estimate, OCI free tier, Bedrock as middle layer, direct API calls) were surveyed; Amazon Bedrock was proposed but "두 사람 모두 사용 경험이 없어 조사하기로 했다". The minutes explicitly mark "AWS 상시 서버를 반드시 띄운다" as NOT decided.
- tension: The minutes distinguish decided from undecided infra — an anti-overcommitment discipline; Bedrock, adopted later, entered as an unknown to investigate.
- quote: "Amazon Bedrock을 중간 계층으로 쓰는 방안도 제안됐으나 두 사람 모두 사용 경험이 없어 조사하기로 했다."
- links: S4-032, S4-054 (Bedrock became the runtime)
- flags: open-question, cost

---

## planning/meetings/2026-07-28-dday-concept-confirmed.md

### S4-021 — DDAY confirmed — a concept outside the 07-24 bake-off pair
- source: planning/meetings/2026-07-28-dday-concept-confirmed.md §결론
- date: 2026-07-28
- lanes: unclear
- event: The meeting confirmed DDAY as the final concept. Neither Apothecary nor Agent Arena — the two finalists left standing on 07-24 — was chosen; DDAY appears in the meeting record for the first time as the confirmed outcome, with no minutes documenting the discussion that produced it.
- tension: The final concept came from outside the bake-off pair the whole demo phase had been narrowing toward; the pivotal discussion between 07-24 and 07-28 left no written meeting record.
- quote: "**DDAY** 컨셉으로 확정"
- links: OH-1 "데모 비교 이후 신규 컨셉 논의"; S4-011, S4-018
- flags: pivot, record-gap

### S4-022 — Scenario choice for a text medium: phones and CCTV only
- source: planning/meetings/2026-07-28-dday-concept-confirmed.md §결론
- date: 2026-07-28
- lanes: 1
- event: "테러리스트의 전화" was selected as DDAY's scenario in reduced form, with the reason recorded: information arrives only via phone and CCTV, no spatial movement, making it fit a text mystery; reduction was needed because "Agent prompting이 너무 복잡해짐".
- tension: Scenario selection driven by the medium's constraint (text) and the AI's constraint (prompt complexity) — both reasons written down.
- quote: "공간 이동 없이 전화 및 CCTV를 통해서만 정보 수집하기 때문에 텍스트 추리물에 적합"
- flags: decision

### S4-023 — Core loop fixed: change the agent's judgment, don't steer its behavior
- source: planning/meetings/2026-07-28-dday-concept-confirmed.md §결론
- date: 2026-07-28
- lanes: 1
- event: The confirmed game concept: the player prompts an agent toward success on one task by injecting extracted 'facts' from timeline/handwritten reports — changing the agent's judgment, not controlling its actions. Two features (sentence compaction, prompt length limits) were explicitly deferred to Phase-2.
- tension: The player-AI interaction contract was fixed at concept confirmation — indirect influence through structured facts, the membrane in game-mechanic form.
- quote: "에이전트의 행동을 조종하는 것이 아니라 타임라인 보고서 및 직접 작성 보고서에서 추출한 '사실' 등을 주입해서 에이전트의 '판단'을 변화시키는 게임"
- links: OH-1 membrane agreement
- flags: decision, boundary

### S4-024 — Scenario reduction as an instrument for agent legibility
- source: planning/meetings/2026-07-28-dday-concept-confirmed.md §시나리오 축소 방안
- date: 2026-07-28
- lanes: 1
- event: Scenario reduction (fewer characters, hidden truths T, failure gates G) was given a measurement purpose: fix the demo's off-intent agent behavior and make it possible to know clearly why the agent failed or succeeded.
- tension: Content was cut not for scope but to make AI behavior diagnosable — scenario size treated as an experimental variable.
- quote: "명확하게 에이전트가 왜 실패했는지, 왜 성공했는지를 알 수 있게 한다"
- flags: decision, measurement

---

## planning/meetings/2026-07-30-mechanism-close-spec-first.md

### S4-025 — Mechanism verification closed: working game over perfect game
- source: planning/meetings/2026-07-30-mechanism-close-spec-first.md TL;DR, §1
- date: 2026-07-30
- lanes: 1
- event: The mechanism-verification phase was ended: C-STRUCT fully closed, most remaining C-BLOCK verification skipped. Reason recorded: with the ~08-10 deadline, the goal is "완벽한 게임이 아니라 **작동하는 게임**", and no more calls would be spent on an unverified mechanism.
- tension: A measurement program was deliberately stopped short — spend (LLM calls) and calendar traded against certainty, with the tradeoff written down.
- quote: "검증되지 않은 매커니즘에 더 이상 콜을 쓰지 않는다"
- flags: decision, cost, measurement

### S4-026 — Two independently designed measurement programs converged — flagged as competition material
- source: planning/meetings/2026-07-30-mechanism-close-spec-first.md §1.1, §3
- date: 2026-07-30
- lanes: 1, 3
- event: C-STRUCT's termination rested on both measurement programs (#94 · #95) independently reaching the same conclusion; the minutes' 기타 section marks this convergence (C-BLOCK adopt · C-STRUCT close) as "AI 활용 문서의 핵심 단락감" — material for the competition deliverable.
- tension: Replication used as the decision standard, and the team was already mining its own process for the AI-utilization document mid-project.
- quote: "서로 독립 설계한 두 측정 프로그램이 같은 두 결론(C-BLOCK 채택 · C-STRUCT 종료)에 수렴 — AI 활용 문서의 핵심 단락감."
- flags: measurement, meta

### S4-027 — Source documents disagree on C-STRUCT's status; minutes order a unification pass
- source: planning/meetings/2026-07-30-mechanism-close-spec-first.md §1.1 (추가)
- date: 2026-07-30/31
- lanes: 3
- event: An annotation records that PR #94 says "pause + 재개 조건" while the #95 REPORT says "closed · UI flavor로는 출하" — but the meeting's decision is "closed · 완전 제거"; a documentation pass is ordered to unify the wording.
- tension: A live contradiction between written sources and the meeting decision, caught and scheduled for repair rather than left to drift.
- quote: "PR #94는 'pause + 재개 조건'으로, #95 REPORT는 'closed · UI flavor로는 출하'로 적혀 있다 — 문서 통합 패스에서 'closed · 완전 제거'로 통일할 것."
- flags: contradiction

### S4-028 — Spec-first decreed: no implementation before architecture, deadline 08-02
- source: planning/meetings/2026-07-30-mechanism-close-spec-first.md §1.3–1.4
- date: 2026-07-30
- lanes: unclear
- event: The next phase was declared to be specification, not implementation: "절대 구현·개발·작업부터 시작하지 않는다", with an architecture-freeze deadline of ~08-02 and a 2-track split (윤석 = LLM Infrastructure / Call Inventory, 민서 = Scenario).
- tension: An explicit prohibition on the default behavior (start building) — process discipline imposed at a phase boundary.
- quote: "절대 구현·개발·작업부터 시작하지 않는다. 전체 아키텍처를 확정한 뒤에 개발을 시작한다."
- flags: decision, boundary

### S4-029 — Fact/judgment separation call: three candidate designs, tradeoffs written, none tested
- source: planning/meetings/2026-07-30-mechanism-close-spec-first.md §2-1 할 것 3
- date: 2026-07-30
- lanes: 1
- event: To separate facts (objective log) from thoughts/judgments (handwritten report), three options were tabled: (1) a separate extraction call — cleanest but adds cost/latency per round and requires amending the spec's "Four call types exist; no others"; (2) extend Call 3's schema with a `facts` array — no new call, pattern already validated by the verification program, but couples extraction quality to report generation; (3) fallback to a plain engine log, accepting that LLM-borne facts (NPC utterances) drop out. Selection and verification assigned to 윤석.
- tension: A design fork recorded with all three alternatives, their costs, and the spec-amendment constraint — decision deliberately deferred to whoever runs the test.
- quote: "스펙 §4가 'Four call types exist; no others'를 못박고 있어 **스펙 개정이 선행**되어야 한다."
- flags: decision-deferred, cost, alternatives

### S4-030 — Scenario regeneration designed as parallel LLM drafting with human selection
- source: planning/meetings/2026-07-30-mechanism-close-spec-first.md §2-2 (갱신 07-31)
- date: 2026-07-31
- lanes: 4
- event: Scenario regeneration was designed as: a writing brief drives multiple LLM sessions (per model, per scenario) generating drafts in parallel → the team compares and selects → the selected scenario's gates get tested. The brief was to live in the generating session, not the repo, with archiving recommended at selection time — and the note explicitly says the "생성 지시서 → 병렬 초안 → 선정" process is material for the AI-utilization deliverable.
- tension: AI generates candidates, humans judge — lane 4's pattern stated as process design, with its own documentation value recognized in the same breath.
- quote: "'생성 지시서 → 병렬 초안 → 선정' 과정이 AI 활용 문서(대회 제출물)의 재료가 된다"
- flags: decision, meta

### S4-031 — Gate verification level set by transfer-of-recipe logic: probe one gate, free-check the rest
- source: planning/meetings/2026-07-30-mechanism-close-spec-first.md §2-2
- date: 2026-07-31
- lanes: 1
- event: 민서 decided the verification level for new-scenario gates: a ~30-call probe on the first gate only — its purpose being to confirm the authoring recipe transfers to a new scenario (new fixture text resets escape-option and fixture-slack risks) — after which remaining gates get only zero-cost checks (lint + paper check + prompt read-through). The known gate-death laws (escape option, fixture slack) are cited from the verification programs.
- tension: Measurement budget allocated by what the measurement is FOR (recipe transfer), not per-item coverage — a costed epistemic decision.
- quote: "목적은 그 게이트 하나의 합격이 아니라 **저작 레시피가 새 시나리오로 전이되는지** 확인"
- flags: decision, measurement, cost

### S4-032 — The minutes accrete dated amendments: a living document maintained after the meeting
- source: planning/meetings/2026-07-30-mechanism-close-spec-first.md (passim — "(추가: …)", "(갱신 07-31: …)", "(07-31, 민서 결정)")
- date: 2026-07-30/31
- lanes: 3
- event: The 07-30 minutes carry post-meeting annotations dated 07-31 woven into the decision text: clarifications of which REPORT.md open items the decisions close (T1–T6, H1–H2 closed, H3 alive — "이 회의가 그 판정 자체였다"), harness state notes (`reporter` call type declared but dormant), and two 07-31 decisions by 민서 folded in. The amendments cross-reference file paths and PR numbers.
- tension: Meeting notes treated as a maintained decision ledger, not a snapshot — the annotation depth (harness internals, spec cross-references) marks an AI-assisted documentation practice.
- quote: "H3(§9.3 판정은 사람이 카드를 보고 내린다)만 살아 있다 — 이 회의가 그 판정 자체였다고 볼 수 있다."
- flags: artifact, convention

### S4-033 — What stays human: the verdict itself
- source: planning/meetings/2026-07-30-mechanism-close-spec-first.md §1.2 (추가)
- date: 2026-07-30
- lanes: 1
- event: In closing the verification program's open items, the annotation notes that of the human-coding items only H3 survives — "판정은 사람이 카드를 보고 내린다" — and that this meeting itself was that human verdict.
- tension: After weeks of automated measurement, the final judgment call is explicitly reserved for humans looking at the evidence cards.
- quote: "§9.3 판정은 사람이 카드를 보고 내린다"
- links: OH-1 seed "끝까지 AI가 하지 못하는 것: 재미있나를 판단하는 것"
- flags: boundary, human-override

### S4-034 — UI plan: "최대한 AI 사용" with the manifest rule attached
- source: planning/meetings/2026-07-30-mechanism-close-spec-first.md §2-4
- date: 2026-07-30
- lanes: 3, 4
- event: UX needs some planning; UI itself deferred with the direction "최대한 AI 사용 (Claude Design / gpt image)", with the annotation that all generated assets must be registered in assets-manifest.json per repo hard rule 5 (a mandatory competition document).
- tension: Maximal AI delegation for UI production, pre-fenced by the asset-provenance rule.
- flags: decision

---

## planning/handoffs/agent-arena-llm-backend.md

### S4-035 — A fully verified backend (146 tests, live-passed) shelved undeployed one day later
- source: planning/handoffs/agent-arena-llm-backend.md (IMPORTANT banner + §Status + §Verification state)
- date: 2026-07-25 (supersession; status 2026-07-24)
- lanes: 2
- event: The Agent Arena LLM backend — 146 passing tests across 11 files, live OpenAI/Claude/MCP/hosted-Skill verification (≈$0.059), Docker E2E — was marked Superseded on 2026-07-25: retained as "a verified reference implementation", never to be deployed, replaced by the stateless Lambda→Bedrock proxy from the AWS/Bedrock research note. The "Next work" section is struck through as void.
- tension: Sunk verified work abandoned within a day of its status entry when the architecture question resolved differently — the reversal is recorded in place, on top of the evidence of how complete the abandoned thing was.
- quote: "**Superseded (2026-07-25).** This service is retained as a verified reference implementation and will not be deployed."
- links: S4-014, S4-020, S4-054
- flags: reversal, pivot, cost

### S4-036 — Supersession names exactly what carries forward
- source: planning/handoffs/agent-arena-llm-backend.md §Next work (void — superseded)
- date: 2026-07-25
- lanes: 3
- event: The voided section enumerates what survives into the Lambda build: closed-action validation (`src/validation.ts`), turn contract shapes, fail-closed registry/config validation, the non-root Docker pattern, and the live-smoke discipline — while the deploy-path items are struck through individually.
- tension: Handoff engineering at a reversal: the human curated the carry-forward list for future sessions instead of letting the dead doc rot — deciding what future AI context keeps vs drops.
- quote: "What carries forward into the Lambda build: closed-action validation (`src/validation.ts`), the turn contract shapes, fail-closed registry/config validation, the non-root Docker pattern, and the live-smoke discipline."
- flags: convention, boundary

### S4-037 — Verified-capability claims fenced against generalization
- source: planning/handoffs/agent-arena-llm-backend.md §Next work (final paragraph)
- date: 2026-07-24
- lanes: 2
- event: The handoff limits the verified claim to "the exact allowlisted calculator MCP card and reviewed `arena-tactics` Skill fixture" and forbids generalizing it to arbitrary user-supplied servers or Skills; missing capabilities must remain visible as unconfigured/unverified in `GET /v1/capabilities`.
- tension: An explicit epistemic guardrail on what AI-verified evidence proves — scoping claims to what was actually tested.
- quote: "Do not generalize it to arbitrary user-supplied servers or Skills."
- flags: boundary, measurement

### S4-038 — The membrane rendered as an API contract
- source: planning/handoffs/agent-arena-llm-backend.md §Contract
- date: 2026-07-24
- lanes: 1
- event: The backend contract encodes the membrane and authority split: the browser sends only allowlisted aliases and card IDs; credentials and raw model names stay server-owned; the model selects an intent from `allowedActions` while "the game engine remains the authority that validates and applies state changes".
- tension: The design-doc membrane rule crossing into concrete interface law — model proposes, engine disposes.
- quote: "The model selects an intent from `allowedActions`; the game engine remains the authority that validates and applies state changes."
- links: S4-015, OH-1 membrane agreement
- flags: boundary

---

## planning/handoffs/agent-arena-llm-backend-goal.md

### S4-039 — A handoff whose entire body is a prompt: the goal-prompt convention
- source: planning/handoffs/agent-arena-llm-backend-goal.md (whole file)
- date: 2026-07-24 (~)
- lanes: 3, 2
- event: The file is a copy-paste goal block for an AI implementation session, with a mandated reading order (CLAUDE.md → status.md → handoff → concept docs "only when product intent is needed") and a conflict rule: "If the documents conflict, follow the handoff's scope and frozen decisions."
- tension: Humans engineering the context and precedence rules an AI session will operate under — session-to-session memory design as a first-class artifact.
- quote: "If the documents conflict, follow the handoff's scope and frozen decisions."
- flags: convention, ai-direction

### S4-040 — Completion rule written against the AI's known failure mode: misreporting done
- source: planning/handoffs/agent-arena-llm-backend-goal.md §Completion rule
- date: 2026-07-24 (~)
- lanes: 2
- event: The goal prompt's completion rule pre-empts overclaiming: if only external credentials/MCP/Skill registration remain, the session must not report the whole goal complete, must distinguish completed keyless work from each unverified live capability, and must keep working "while any code-solvable failure remains". Elsewhere: "Do not leave core behavior as TODOs, empty handlers, mocked success responses, or unverified assumptions."
- tension: The prompt's structure is a catalog of anticipated AI failure modes (fabricated completion, mocked success, stopping early) with a rule against each.
- quote: "do not misreport the whole goal as complete: distinguish the completed keyless implementation from each unverified live capability."
- flags: ai-limit, fabrication, convention

### S4-041 — "Do not guess" — provider facts must come from current docs
- source: planning/handoffs/agent-arena-llm-backend-goal.md §Provider requirements
- date: 2026-07-24 (~)
- lanes: 2
- event: The prompt orders the session to consult current official provider documentation and not to guess beta headers, request schemas, response events, or usage fields; it also bans requesting/persisting/exposing hidden chain-of-thought.
- tension: A direct countermeasure to hallucinated API knowledge, written into the delegation contract.
- quote: "Consult the current official provider documentation. Do not guess beta headers, request schemas, response events, or usage fields."
- flags: ai-limit, convention

### S4-042 — Secrets handling delegated to AI with explicit non-exfiltration rules
- source: planning/handoffs/agent-arena-llm-backend-goal.md §Secrets and live validation
- date: 2026-07-24 (~)
- lanes: 2
- event: The session may load `.env.local` credentials for live tests but must never print, copy, commit, or log them, may check only presence of variables, must redact auth data everywhere, and if credentials are absent must skip only affected tests "without asking the user for a key".
- tension: Trusting an AI session with live keys is made safe by enumerated prohibitions plus automated no-credential checks in the required verification.
- flags: boundary, convention

---

## planning/handoffs/apothecary-demo.md

### S4-043 — v1 green through the pipeline, failed by the human playtest
- source: planning/handoffs/apothecary-demo.md §Status (2026-07-24 — v2)
- date: 2026-07-24
- lanes: 2
- event: Apothecary v1 shipped and merged (run 20260724-145432, PR #17) with all gates green, but 민서's playtest verdict was "v1 doesn't demo the game": single-rail choices, a visible patience bar that feels wrong, lifeless stubbed dialogue, and the real engine risk (slow async AI generation) untested.
- tension: The harness's definition of done and the human's definition of demo diverged completely — the pipeline optimized what its gates could see.
- quote: "**Playtest verdict (민서): v1 doesn't demo the game**"
- links: S4-048, S4-050
- flags: failure, human-override

### S4-044 — v2 decisions: live AI in dev, stub as the deployed floor
- source: planning/handoffs/apothecary-demo.md §Status (2026-07-24 — v2)
- date: 2026-07-24
- lanes: 1, 2
- event: Same-day v2 decisions reversed the stub doctrine: live LLM dialogue via a Vite dev-middleware proxy (keys in `process.env`; deployed build auto-falls back to stub), a real image-gen API for NPC portraits with silhouette-entry/waiting-beat/25s-fallback design, diegetic patience (expression tiers, no gauge), a provided asset pack, and a brownfield run on top of v1.
- tension: The playtest verdict converted directly into architecture within the day — including a designed-in latency fallback rather than a spinner.
- flags: reversal, decision

### S4-045 — v1 doctrine: stub the LLM on purpose, and the membrane applies even to the stub
- source: planning/handoffs/apothecary-demo.md §Read this first
- date: 2026-07-23
- lanes: 2, 1
- event: The v1 handoff instructed that the LLM stays stubbed by design: AI capability was already validated in paper tests, so re-proving it is scope creep; the stub keeps the demo deployable with no proxy/secrets; and the membrane rule (no free-text input UI) applies even to the stub. The PoC question is framed as "can our method (agents directed by us) build this game's shell?" judged on "reads as a game, not a form".
- tension: A deliberate boundary — what this demo proves (the method) vs what it doesn't (AI capability) — later overturned by the playtest (S4-043); the membrane applied even where no real LLM existed.
- quote: "The PoC question is **\"can our method (agents directed by us) build this game's shell?\"** — not \"is a dialogue box hard to code.\""
- flags: boundary, decision, reversal-seed

### S4-046 — PRD scoping as decomposer control: don't let it smell like the full game
- source: planning/handoffs/apothecary-demo.md §Read this first
- date: 2026-07-23
- lanes: 2
- event: The handoff warns that a PRD reading like the 기획서 "will make the decomposer generate a week of work" — one full loop, hard out-of-scope list.
- tension: Humans learned to write documents FOR the AI decomposer's failure modes — document style as a control surface over agent behavior.
- quote: "A PRD that reads like the 기획서 will make the decomposer generate a week of work."
- flags: ai-limit, convention

### S4-047 — Deferral with reasons, marked "don't relitigate"
- source: planning/handoffs/apothecary-demo.md §Deferred / lower priority
- date: 2026-07-23
- lanes: 2, 3
- event: The super-pipeline game-mod P0 was deferred until after concept selection because implementing harness features AND running the first game project through a freshly modified harness on a 2-day critical path "stacks two unknowns"; the demo run doubles as the game-mod's requirements discovery, replacing the planned "Pong on Pages" dry-run. The section header itself instructs future sessions: "with reasons — don't relitigate".
- tension: Risk arithmetic (two unknowns on one critical path) recorded so that future AI sessions inherit the reasoning, not just the verdict.
- quote: "Deferred / lower priority (with reasons — don't relitigate)"
- flags: decision, convention, cost

### S4-048 — Work split into three specialized AI sessions
- source: planning/handoffs/apothecary-demo.md §Status (2026-07-23)
- date: 2026-07-23
- lanes: 2, 3
- event: The demo work was split across sessions by role: a PRD session (game repo), a harness-tweak session (`../super-pipeline`), and a pipeline-run session — with the interface between the first two frozen in a separate contract file, and the pipeline-run session instructed to log every friction as "the evidence base for the real game-mod build later".
- tension: Multi-session orchestration with a frozen interface — humans applying software-engineering module boundaries to AI sessions.
- flags: convention, ai-direction

---

## planning/handoffs/apothecary-demo-contract.md

### S4-049 — A FROZEN contract between two concurrent AI sessions, designed to be thrown away
- source: planning/handoffs/apothecary-demo-contract.md (header + whole file)
- date: 2026-07-23
- lanes: 3, 2
- event: The interface spec between the PRD session and the harness-tweak session was frozen ("nobody edits this once both sessions are running") and declared throwaway ("delete after the demo run lands"), with background deliberately kept out ("Background/motivation lives in apothecary-demo.md, not here"). It pins the build interface (self-contained `demos/apothecary/`, Vite+TS, static `dist/`, relative paths) and a smoke definition (page loads, no console errors, root renders).
- tension: Session coordination via an immutable minimal interface — the same freeze discipline used between software teams, applied to AI sessions, including a document-lifecycle rule.
- quote: "Frozen for the batch — nobody edits this once both sessions are running. Throwaway: delete after the demo run lands."
- flags: convention, boundary

### S4-050 — Timebox with a pre-authorized cut: ≤1h or abandon the tweak
- source: planning/handoffs/apothecary-demo-contract.md §Scope + apothecary-demo.md §Active work 2
- date: 2026-07-23
- lanes: 2
- event: The harness tweak was scoped in at ≤1h timebox with the failure path pre-decided: "cutting it entirely if no clean seam exists" — the companion handoff phrases it "cut the tweak and report, don't force it". The OUT list protects the root Pages deploy (CLAUDE.md rule 3) and excludes the game-mod P0 spec.
- tension: Failure was budgeted before work started; the AI session was licensed to give up.
- quote: "IN: the tweak above, timeboxed ≤1h; cutting it entirely if no clean seam exists."
- flags: convention, cost

---

## planning/handoffs/apothecary-demo-harness-note.md

### S4-051 — demo_publish built as a pure extension, validated on a fixture, not the real demo
- source: planning/handoffs/apothecary-demo-harness-note.md §What was built, §Validation done
- date: 2026-07-23
- lanes: 2
- event: The harness-tweak session reported BUILT (not cut): `demo_publish`, an opt-in wave-end step letting a gate supervisor see the built demo before deciding `[GATE-OK]` — implemented "as a pure extension… No existing stage was modified", parameterized (the demo dir is an argument), validated against a throwaway static fixture, with the full harness test suite still green.
- tension: The tweak survived its timebox by finding the clean seam the contract demanded; extension-not-modification kept the harness's determinism intact.
- flags: decision

### S4-052 — The harness is designed to degrade honestly rather than lie about smoke
- source: planning/handoffs/apothecary-demo-harness-note.md §What was built, §Caveats
- date: 2026-07-23
- lanes: 2
- event: demo_publish falls back to an honest `smoke='static-only'` when no headless browser exists, degrades to posting a local preview command with `published=false` as last resort, and its failure is non-blocking observation-only; the note's caveat repeats that the prompt "degrades to a preview-command comment rather than lying about smoke".
- tension: Anti-fabrication engineered into the agent prompt — the designers assumed an agent would otherwise claim success and built the honest-degradation path explicitly.
- quote: "the step degrades to a preview-command comment rather than lying about smoke."
- flags: ai-limit, fabrication, convention

### S4-053 — Handoff records its own loose end: the diff is uncommitted
- source: planning/handoffs/apothecary-demo-harness-note.md §Caveats
- date: 2026-07-23/24
- lanes: 3
- event: The note flags that the harness changes sit uncommitted on branch `harness/wave-gate` (commit "wasn't in scope for this session"), that the installed `~/.claude/` copy is what the run actually uses, and instructs committing before the next harness edit "to avoid losing the diff". It also pre-diagnoses that this repo's workflow-based Pages deploy makes the URL-publish option impossible, so the screenshot fallback should be expected.
- tension: A handoff honest about its own unfinished state and predicting which fallback the next session will hit — risk transfer made explicit.
- flags: convention, ai-limit

---

## planning/handoffs/demo-prd-guide.md

### S4-054 — The two laws of writing for the harness: no mid-run questions, PRD is the reviewers' law
- source: planning/handoffs/demo-prd-guide.md §1
- date: 2026-07-24 (~; post-apothecary run)
- lanes: 2
- event: The PRD guide distills the harness's nature into two consequences: agents cannot ask questions mid-run, so "Every ambiguity in the PRD becomes either an agent's improvisation or a stall"; and panel reviewers enforce only what's written — "An invariant not written down does not exist."
- tension: The operating theory of directing autonomous agents, stated as law after one real run.
- quote: "Agents cannot ask you questions mid-run. Every ambiguity in the PRD becomes either an agent's improvisation or a stall. Resolve everything up front." / "An invariant not written down does not exist."
- flags: convention, ai-limit

### S4-055 — Baked defaults: an executable PRD ships no open ❔
- source: planning/handoffs/demo-prd-guide.md §2 Baked defaults
- date: 2026-07-24 (~)
- lanes: 2
- event: The guide requires pre-deciding everything an agent would otherwise decide — language of game text, exact counts, fallback behavior so nothing dead-ends, deterministic (event-driven, never wall-clock) triggers — citing the rule "an executable PRD ships no open ❔". The concept doc must be fenced as reference-only or "the decomposer wanders into the full game".
- tension: Ambiguity treated as a defect class in human→AI communication, with named countermeasures.
- flags: convention

### S4-056 — Structural lesson from decomposer refinement: split shared UI primitives early
- source: planning/handoffs/demo-prd-guide.md §2 Work-unit DAG hint
- date: 2026-07-24
- lanes: 2
- event: The decomposer refined apothecary's 6 hinted units into 9; the recorded lesson is to split shared UI primitives (cards/animation/CSS) into their own early unit "so parallel screen units don't each invent their own and collide at merge".
- tension: A merge-conflict pathology of parallel AI agents observed once and converted into a standing PRD-structure rule.
- flags: convention, failure

### S4-057 — Pitfalls that actually bit: whole-suite gates deadlock; green isn't honest for UI
- source: planning/handoffs/demo-prd-guide.md §4
- date: 2026-07-24 (~)
- lanes: 2
- event: Recorded pitfalls from the run: (1) a per-unit gate must be that unit's own test slice, never the whole suite — the full-loop e2e stays red until the last unit and gating early units on it deadlocks the run; (2) "Automated green must be honest for UI" — `tsc`+`vite build` green "says nothing about the thing demos exist to prove", so unit gates need Playwright per-screen specs; (3) deterministic triggers only, or tests flake and "agents burn loops"; (4) every lookup needs a `default` fallback.
- tension: Four concrete failure modes of loop-until-green agent development, each with the learned countermeasure.
- quote: "**Per-unit gate = that unit's own test slice, NEVER the whole suite.**"
- flags: failure, ai-limit, convention

### S4-058 — Doctrine reversal preserved in place with strikethrough
- source: planning/handoffs/demo-prd-guide.md §3
- date: 2026-07-24/25
- lanes: 3, 2
- event: The repo-invariants list keeps the overturned rule visible: "**No runtime network calls in the deployed build.** ~~LLM fully stubbed~~ — superseded after the v1 playtest: live AI is now expected in dev mode via the dev-proxy seam, with stub as the deployed floor", pointing to demo-playability-guide.md.
- tension: The handoff convention of showing the old rule struck through, with the reversal's cause and the new authority named — history preserved inside living guidance.
- quote: "~~LLM fully stubbed~~ — superseded after the v1 playtest"
- flags: reversal, convention

### S4-059 — DISCOVERY.md made a first-class deliverable of every run
- source: planning/handoffs/demo-prd-guide.md §2 Definition of done, §5
- date: 2026-07-24 (~)
- lanes: 2
- event: The definition of done requires "`DISCOVERY.md` populated (spec gaps + harness frictions — a first-class deliverable feeding the super-pipeline game-mod)"; §5 repeats: log every friction during the run — "it's the evidence base for the harness game-mod, half the point of these runs."
- tension: Each pipeline run is instrumented to improve the pipeline — the runs are double-purposed as harness requirements discovery.
- flags: convention, measurement

---

## planning/handoffs/demo-playability-guide.md

### S4-060 — The one principle: agents integrate; humans provide what agents can't verify
- source: planning/handoffs/demo-playability-guide.md §0
- date: 2026-07-24/25
- lanes: 2
- event: From the v1 failure ("apothecary v1 ran fully green through the harness and still failed its playtest") came the principle: pipeline agents have no API keys and vendor output is non-deterministic, so nothing touching a vendor API can be gated inside the run — humans build and live-verify every vendor-touching piece beforehand and hand it in like game data. The rejected alternative is recorded: extending the harness to cope — "we considered it; wrong move — the harness's value is determinism."
- tension: The sharpest human/AI labor boundary in the corpus, derived from a failure, with the alternative explicitly considered and rejected for a stated reason.
- quote: "**Principle: agents integrate; humans provide what agents can't verify.**" / "we considered it; wrong move — the harness's value is determinism"
- links: S4-043
- flags: boundary, failure, alternatives

### S4-061 — "그래픽 엔진 가동이 되냐가 관건": the stubbed parts were the point
- source: planning/handoffs/demo-playability-guide.md §0
- date: 2026-07-24
- lanes: 2
- event: The v1 lesson quoted in Korean: whether the graphics/AI machinery actually runs IS the PoC question — the deliberately stubbed parts turned out to be exactly what needed proving.
- tension: The team's own scoping doctrine (stub the risky bits) was inverted by contact with the playtest — the risk they fenced out was the question.
- quote: "'그래픽 엔진 가동이 되냐가 관건' — whether the graphics/AI machinery actually runs IS the PoC question, and the deliberately stubbed parts turned out to be the point."
- links: S4-045
- flags: reversal, failure

### S4-062 — One call per subject, ever: character consistency across calls does not exist
- source: planning/handoffs/demo-playability-guide.md §1.3
- date: 2026-07-24/25 (~)
- lanes: 4
- event: Image-generation practice fixed as sheets-not-images: every variant of one subject packed into one grid in one call, because "character consistency across separate calls does not exist, so a character split over two calls is two different characters." A named alternative — blank-face base plus client-side face-part compositing — was rejected because registration/seams fail across calls "and it isn't even cheaper."
- tension: A hard model limitation discovered empirically, turned into an absolute authoring rule, with the workaround alternative rejected on evidence.
- quote: "**One call per subject, ever** — character consistency across separate calls does not exist"
- flags: ai-limit, alternatives, convention

### S4-063 — Style bible frozen by a cheap human-in-the-loop bake-off
- source: planning/handoffs/demo-playability-guide.md §1.2
- date: 2026-07-24/25 (~)
- lanes: 4
- event: Visual style is fixed by generating one low-quality sheet for each of 3–5 candidate style strings, a human picking the winner, and freezing it as one sentence prepended to every image call — pack and runtime alike. The project's pick: strict low-res pixel art, chosen partly because pixel styles survive downscaling best.
- tension: AI generates candidates, human judges, result frozen as data — lane 4's selection pattern applied to art direction at minimal cost.
- flags: convention, decision

### S4-064 — Never ask the model for transparency; motion is CSS, not generation
- source: planning/handoffs/demo-playability-guide.md §1.4–1.6
- date: 2026-07-24/25 (~)
- lanes: 4
- event: Further model-limit workarounds codified: sprites generated on flat magenta then color-keyed offline (never ask for transparency); motion almost never generated — only blink earned frames, everything else is CSS on static cells; a pixel pipeline (generate large → downscale by shared factor → artifacts vanish) applied identically to runtime generations so densities match.
- tension: A catalog of what image models can't do reliably, each with the human-side compensation.
- flags: ai-limit, convention

### S4-065 — Stub-by-construction: the deployed build physically lacks the live path
- source: planning/handoffs/demo-playability-guide.md §2.1–2.2
- date: 2026-07-24/25 (~)
- lanes: 1, 2
- event: The dev-proxy pattern: a Vite dev-middleware plugin serves `/ai/*` with keys from server-side `process.env`; `apply: 'serve'` means the production build physically lacks the live path, so the deployed Pages demo is stub-mode by construction and a client-side secret is structurally impossible (still gated by a `dist/` secret-grep). One schema, two adapters — the renderer cannot tell live from stub, and every live response passes the same validator with silent per-beat stub fallback.
- tension: Safety by construction rather than by policy — the architecture makes the forbidden state unrepresentable.
- quote: "the deployed Pages demo is stub-mode **by construction**, and a client-side secret is structurally impossible"
- flags: boundary, decision

### S4-066 — The membrane holds at the proxy seam; balance numbers never model-chosen
- source: planning/handoffs/demo-playability-guide.md §2.4
- date: 2026-07-24/25 (~)
- lanes: 1
- event: The live-AI seam enforces the membrane: the client sends only structured fields (trait strings from a data table, the clicked card); prompt prose is composed server-side; balance numbers (patience costs) are stamped from `data/` by the proxy — "never model-chosen"; structured output via forced tool-use, never prose parsing.
- tension: The membrane and balance-as-data rules meeting live infrastructure for the first time — authority over numbers explicitly denied to the model.
- quote: "Balance numbers (patience costs etc.) are stamped from `data/` by the proxy — never model-chosen."
- links: S4-015, S4-038
- flags: boundary

### S4-067 — The biggest risk removed: a unit whose author could never execute its own code
- source: planning/handoffs/demo-playability-guide.md §2.6
- date: 2026-07-24/25 (~)
- lanes: 2
- event: Verification was split by who can perform it: automated gates stay stub-only; the live path gets a committed smoke script run by the key-holder BEFORE the run plus a manual checklist before the bake-off; the run's AI unit shrinks to "stub adapter + boot wiring + tests". The stated reason: "the biggest risk we removed was a unit whose author could never execute its own code."
- tension: Work assignment principle for mixed human/AI teams: never give an agent a task it cannot verify.
- quote: "the biggest risk we removed was a unit whose author could never execute its own code."
- flags: boundary, convention

### S4-068 — Latency is a design input; stub quality is a floor, not filler
- source: planning/handoffs/demo-playability-guide.md §2.5, §2.7
- date: 2026-07-24/25 (~)
- lanes: 1
- event: Real latency numbers are budgeted (dialogue ~2–5s, image sheets tens of seconds to minutes) and hidden in the game's rhythm — prefetch entity N+1 when N's scene starts, late images arrive as a designed silhouette-resolve state, hard timeout to bundled fallback, "Never a spinner." And because the deployed demo runs stub-mode forever, stub content must be written to paper-prototype quality: "Live AI is the demo's proof; stub is what judges on bad wifi get."
- tension: AI latency and AI absence both treated as designed states of the game, not error states.
- quote: "Live AI is the demo's proof; stub is what judges on bad wifi get."
- flags: decision, convention

### S4-069 — A handoff that formally supersedes another handoff's rule
- source: planning/handoffs/demo-playability-guide.md (closing blockquote)
- date: 2026-07-24/25
- lanes: 3
- event: The guide ends by declaring it supersedes demo-prd-guide.md §3's "no runtime network calls / LLM fully stubbed": "that was v1-era doctrine and is exactly what the playtest failed. Current rule: no network calls in the deployed build; live AI in dev via the dev-proxy seam; stub is the floor, not the spec."
- tension: The handoff corpus maintains its own precedence graph — doctrine versioning between documents, with the failed doctrine named as failed.
- quote: "that was v1-era doctrine and is exactly what the playtest failed."
- flags: reversal, convention

---

## planning/handoffs/llm-layer.md

### S4-070 — Handoff demoted to decision record: only what survived implementation
- source: planning/handoffs/llm-layer.md (header blockquote)
- date: ? (post-implementation; ~2026-07-26+)
- lanes: 3
- event: The Apothecary LLM layer handoff was rewritten as a historical decision record — "This file records the decisions that survived implementation and live testing; it is not an operating runbook" — with operations delegated to the Lambda/Bedrock operating guide.
- tension: An evolved handoff convention: documents get a lifecycle (goal prompt → status handoff → decision record), each stage shedding content the next reader doesn't need.
- quote: "This file records the decisions that survived implementation and live testing; it is not an operating runbook."
- flags: convention

### S4-071 — Final runtime shape: one stateless Lambda, client owns state, no runtime portraits
- source: planning/handoffs/llm-layer.md §Final outcome, §Decisions retained
- date: ? (~2026-07-26)
- lanes: 1
- event: The adopted runtime is a thin stateless path (Pages → API Gateway → Lambda → Bedrock Converse) with exactly two endpoints (`POST /ai/dialogue`, `GET /ai/health`); the client owns game state and sends bounded context per request; there is no runtime portrait endpoint — portraits are pre-generated, manifested, and shipped static. Failure behavior: valid requests degrade to a deterministic playable response, distinguished by an `x-llm-fallback` header.
- tension: The maximal early architecture (S4-035's stateful multi-agent service) reduced to two stateless endpoints — every dropped capability listed under "Superseded assumptions" (multi-agent decision service, runtime image generation, persistent sessions, broader orchestration: "None of those assumptions is part of the final Apothecary runtime").
- flags: decision, reversal

### S4-072 — Model chosen on live verification, dropping the planned benchmark
- source: planning/handoffs/llm-layer.md §Decisions retained
- date: ? (~2026-07-26)
- lanes: 1
- event: Nova 2 Lite (`global.amazon.nova-2-lite-v1:0`) operates "on live verification of access and schema behavior, not on the model-selection benchmark the earlier plan required" — that benchmark targeted a different concept and was dropped; changing the operating model requires an explicit access/schema/IAM/latency/quality check.
- tension: A planned rigorous selection process consciously skipped, with the skip and its scope condition recorded rather than hidden.
- quote: "Nova 2 Lite operates on live verification of access and schema behavior, not on the model-selection benchmark the earlier plan required."
- flags: decision, measurement, cost

### S4-073 — The membrane's residual leak documented as an accepted, mitigated risk
- source: planning/handoffs/llm-layer.md §Validation and fallback boundary
- date: ? (~2026-07-26)
- lanes: 1
- event: The record admits that `history[].npcLine`, `history[].playerChoiceLabel`, and `availableClues[].text` are client-supplied strings bounded only by length/count (~9 KB) that reach the prompt verbatim — because procedural clues have no server-side roster to check — and names this "an accepted, mitigated residual risk rather than an absence of free text", listing the mitigations (rate limit, output-token cap, data-is-state-not-instruction system rule, output validation). Model-supplied patience costs are replaced with server-owned values.
- tension: The membrane rule confronted with its own edge case and documented honestly instead of claimed absolute — the most candid boundary statement in the corpus.
- quote: "this is an accepted, mitigated residual risk rather than an absence of free text"
- links: S4-066, OH-1 membrane agreement
- flags: boundary, contradiction-with-doctrine

### S4-074 — Guardrail accounting: the kill switch is deployed unset, and the doc says so
- source: planning/handoffs/llm-layer.md §Cost and operational guardrails
- date: ? (~2026-07-26)
- lanes: 1
- event: The cost-protection list discloses that the Lambda concurrency kill switch ships unset (`ReservedConcurrency=-1`): "The effective spend ceiling today is therefore the 1 rps / burst 2 stage throttle plus a manual redeploy at `0`, not a reserved concurrency guardrail" — with the instruction to set a small positive value once account quota allows, and the caveat that throttling is not a hard spending ceiling.
- tension: A safety mechanism that doesn't yet work, described exactly as such — honest-limits discipline applied to money.
- quote: "The effective spend ceiling today is therefore the 1 rps / burst 2 stage throttle plus a manual redeploy at `0`, not a reserved concurrency guardrail."
- flags: cost, ai-limit, boundary

---

## OH-1 corroboration

Hooks assigned to S4 from `oral-history.md` (OH-1, 민서's timeline by memory), checked
against the meeting record:

1. **2026-07-22 concept-review → "many concepts → merge to 3"?**
   **Confirmed (with a count nuance).** The minutes record 6 concepts presented and
   consolidated into exactly 3 integration tracks with per-track rationale
   (2026-07-22-concept-review.md §2; atom S4-001). Nuance: OH-1's "다양한 AI-game
   concept 준비" is broader than the 6 presented — the S1 corpus holds 9 concept
   docs plus a template, so some concepts never reached the meeting; the meeting
   itself shows 6 → 3.

2. **2026-07-24 demo-mid-check → "demo comparison"?**
   **Confirmed (comparison in progress, not completed).** The mid-check compares
   demo states: Doodle Life played and cut on evidence, Apothecary demo generating
   in super-pipeline, Agent Arena demo not yet existing (S4-011, minutes §2.7).
   OH-1's "3가지 데모 준비" matches the three tracks, but at 07-24 only Doodle Life
   had a playable demo and Agent Arena had none — the "comparison" was staged, with
   the final Apothecary-vs-Agent-Arena bake-off still pending at meeting end.

3. **2026-07-28 dday-concept-confirmed → DDAY from a NEW-concept discussion after
   demo comparison, or one of the original demos?**
   **Confirmed — DDAY was not one of the original demo tracks.** The 07-24 minutes
   name the surviving finalists as Apothecary and Agent Arena only; DDAY appears in
   the meeting record for the first time on 07-28 as the confirmed concept
   (S4-021). This is consistent with OH-1's "데모 비교 이후 신규 컨셉 논의 →
   최종적으로 컨셉 확정". Caveat: the new-concept discussion itself left **no
   meeting note** — the 07-28 record documents only the outcome, so the discussion's
   existence and timing rest on OH-1 plus the inference from the 07-24/07-28 gap
   (a concept doc `planning/concepts/game-concept-dday-simulation.md` exists in S1;
   its dating is S1/S8's question).

4. **2026-07-30 mechanism-close-spec-first — exists?**
   **Confirmed.** The minutes exist and record mechanism-verification closure
   (C-STRUCT closed, C-BLOCK residuals skipped) and the spec-first decree with the
   ~08-02 architecture deadline (S4-025, S4-028). This is past OH-1's covered window
   (07-20→07-28) and needed no memory corroboration.

5. **Written trace of the membrane agreement?**
   **Partial — rule attested as pre-existing; founding moment untraced.** The
   earliest S4 reference is 2026-07-24: the minutes cite "CLAUDE.md의 멤브레인 규칙"
   as an already-established rule that the Agent Arena design satisfies (S4-015),
   and 07-28's core loop restates it in game-mechanic form (S4-023). No S4 document
   records the agreement being *made* — OH-1's founding-moment claim ("플레이어와
   AI가 직접 소통하는 구조는 절대 피한다", pre-concepts) remains oral-only in this
   slice; S8 (CLAUDE.md commit history) is the remaining place it could be dated.

6. **Written trace of the fun-discovery discussion?**
   **No trace.** No S4 meeting note records a "게임은 왜 재밌을까" discussion.
   Echoes exist — fun as a kill criterion for Doodle Life (S4-011), the unresolved
   variance-as-fun question (S4-012), the methodology-vs-fun judging disagreement
   (S4-019), and the human-verdict boundary (S4-033) — but the discussion OH-1
   describes as its own phase left no meeting record.

7. **Written trace of the genre/feasibility talk predating 07-22?**
   **No trace.** The earliest meeting note is 2026-07-22, and it opens with
   concepts already prepared. Neither the named incapacities (one month, no game-dev
   experience, no designer/engine developer) nor the exclusion list (physics-engine,
   graphics-heavy, sprawling-story games) appears in any S4 meeting or handoff.
   OH-1 remains the only source for that discussion in this slice.

---

## Balancing win-sweep 2026-08-05 (wins under revised bias)
Coverage: re-read in full all 12 S4 files — planning/meetings/ (2026-07-22-concept-review.md,
2026-07-24-demo-mid-check.md, 2026-07-28-dday-concept-confirmed.md,
2026-07-30-mechanism-close-spec-first.md) and planning/handoffs/ (agent-arena-llm-backend.md,
agent-arena-llm-backend-goal.md, apothecary-demo.md, apothecary-demo-contract.md,
apothecary-demo-harness-note.md, demo-prd-guide.md, demo-playability-guide.md, llm-layer.md).
Hunted for lane-3 (AI-in-planning) and lane-4 (AI-as-creator) wins the 2026-08-04 pass skipped or
buried inside NEUTRAL/LIMIT/failure atoms. Audit leads S4-008, S4-026, S4-051 all resolved to
buried success events (W001, W003, W012). ADDITIVE only — no existing atom edited. Nothing skipped.
Re-neutralized 2026-08-05 (asserted-wins → neutral success-event atoms): all 12 W-atoms rewritten
to factual single-event raw material; verdict flags (win, method-working, ai-strength,
technique-worth-copying) removed in favor of neutral vocab; tensions stripped of "why it's a win"
and of meta-commentary about the mining bias / "buried under S4-0xx". Count unchanged at 12 (W001–W012).
W001 narrowed to its single source (dropped the unsupported "record every later meeting quotes
without correction" cross-corpus claim). W003 narrowed to the measured fact (dropped the
"strongest form of verification / solid enough to close the phase" editorializing; flagged the
S9a-W013 duplicate for that agent to narrow/drop). W004 narrowed from a three-file bundle to the
single llm-layer.md decision-record demotion — the goal-prompt-seeding (S4-039) and
status-handoff carry-forward (S4-036) events were DROPPED. No new contradiction atoms created; no
atoms added or removed, so numbering stays contiguous.

### S4-W001 — Structured minutes generated from a ~91-minute demo mid-check recording
- source: planning/meetings/2026-07-24-demo-mid-check.md (whole document; §8 "약 91분 — 전사 원본 기준")
- date: 2026-07-24
- lanes: 3
- event: AI summarization produced a structured minutes document from a ~91-minute demo mid-check recording ("전사 원본 기준"): TL;DR, a 10-line core summary, per-topic detail, an 8-row decision table with a rationale column, owner/deadline action items, per-attendee positions, a 6-row disagreements table, open questions, a numbers/proper-nouns table, and a 5-minute summary. The source transcript is not in the repo.
- tension: This one meeting record — the evidence base for several founding decisions — is itself an AI-produced artifact; the atom captures the document's structure as generated from the single recording.
- quote: "**길이:** 약 91분" / "전사 원본 기준"
- links: S4-008 (same event, artifact framing); S4-021
- flags: artifact, milestone

### S4-W002 — Post-meeting annotations mapped 8 of 9 tracked verification items to closed
- source: planning/meetings/2026-07-30-mechanism-close-spec-first.md §1 결정 2 (추가)
- date: 2026-07-30/31
- lanes: 3
- event: The 07-30 minutes' post-meeting annotations cross-referenced REPORT.md's "Open items — collected" and marked test items T1–T6 and human-coding items H1–H2 as closed, naming H3 as the single survivor, each mapped to its source section.
- tension: An AI-assisted annotation pass reconciled a tracked open-item list against a source report, recording which items closed (8) and which remained (1).
- quote: "이 결정으로 REPORT.md 'Open items — collected'의 시험 항목 T1(B2 누적) … T6(E-DISC 동시 주입)과 휴먼 코딩 H1(B3a blind coding) · H2(B4)가 사실상 닫힌다. H3 … 만 살아 있다."
- links: S4-032 (same document, artifact framing); S4-033
- flags: measurement, milestone

### S4-W003 — Two measurement programs reached the same two conclusions
- source: planning/meetings/2026-07-30-mechanism-close-spec-first.md §1 결정 1, §3
- date: 2026-07-30
- lanes: 1, 3
- event: Two separately designed measurement programs (#94, #95), both same-team AI probes, reached the same two conclusions — adopt C-BLOCK, close C-STRUCT. The convergence was cited as the basis for ending mechanism verification and spending no more calls, and was flagged as AI-utilization-deliverable material.
- tension: Convergence of two same-team measurement programs was used as the decision standard for closing the verification phase.
- quote: "양쪽 측정 프로그램(#94 · #95)이 독립적으로 같은 결론에 수렴했다." / "서로 독립 설계한 두 측정 프로그램이 같은 두 결론(C-BLOCK 채택 · C-STRUCT 종료)에 수렴"
- links: S4-026 (measurement/meta framing); S4-025; S9a-W013 (duplicate copy — narrow/drop there)
- flags: measurement, milestone

### S4-W004 — LLM-layer handoff demoted to a decision record after implementation
- source: planning/handoffs/llm-layer.md (header blockquote)
- date: ~2026-07-26
- lanes: 3
- event: After implementation and live testing, the Apothecary LLM-layer handoff was rewritten as a decision record keeping only "the decisions that survived implementation and live testing"; live operations were delegated to the Lambda/Bedrock operating guide.
- tension: A handoff document given a post-implementation lifecycle stage — reduced to the decisions that outlived the build.
- quote: "This file records the decisions that survived implementation and live testing; it is not an operating runbook."
- links: S4-070
- flags: convention

### S4-W005 — Visual style frozen by a human-in-the-loop bake-off of AI style sheets
- source: planning/handoffs/demo-playability-guide.md §1.2
- date: 2026-07-24/25
- lanes: 4
- event: The project's visual style was fixed by a low-cost bake-off: 3–5 candidate style strings, one low-quality AI sheet each, a human picks the winner, and the choice is frozen as one sentence prepended to every image call — pack and runtime alike — keeping backgrounds, items, and runtime-generated NPCs in one register. The pick was strict low-res pixel art.
- tension: AI generates candidates, a human selects, and the result is frozen as data governing all later image calls — the select-from-candidates pattern applied to art direction.
- quote: "3–5 candidate style strings, one low-quality sheet each, human picks the winner. Freeze it as **one sentence prepended to every image call**"
- links: S4-063
- flags: decision, milestone

### S4-W006 — Sheets-not-images: all variants of a subject packed into one generation
- source: planning/handoffs/demo-playability-guide.md §1.3
- date: 2026-07-24/25
- lanes: 4
- event: The shipped apothecary image pipeline packs every variant of one subject into a single grid in one call (expressions×blink 4×2, quantity states 4×3) and slices them at runtime via CSS `background-position`, producing a multi-state character from one generation. The stated rule: one call per subject.
- tension: The model limit "character consistency across separate calls does not exist" (S4-062) is handled by never splitting a subject across calls — a single-generation authoring rule.
- quote: "Pack every variant of one subject into one grid in one call … **One call per subject, ever**"
- links: S4-062
- flags: shipped, convention

### S4-W007 — Pixel pipeline: generate large, downscale by a shared factor
- source: planning/handoffs/demo-playability-guide.md §1.5
- date: 2026-07-24/25
- lanes: 4
- event: The image pipeline generates at 1024/1536, downscales by one shared factor (4) so a true pixel grid emerges and generation artifacts drop out and files shrink, and applies the same offscreen-canvas treatment to runtime generations so their density matches the pre-generated pack.
- tension: A fixed generate-then-downscale procedure applied uniformly to pack and runtime assets to keep pixel density consistent.
- quote: "generate at 1024/1536 → downscale by one shared factor (we use 4) → a true pixel grid emerges, generation artifacts vanish, files shrink"
- links: S4-064
- flags: shipped, convention

### S4-W008 — Doodle Life v2 rendered player drawings as characters
- source: planning/meetings/2026-07-24-demo-mid-check.md §2.3
- date: 2026-07-24
- lanes: 1, 4
- event: Doodle Life v2's closed-judgment structure interpreted player drawings and rendered them as characters; the minutes record this visual result as the concept's strength, in the same section that cuts the track for latency and dialogue quality.
- tension: A drawing-to-character visual result recorded as a strength inside the section that removed the track — the output noted beside the decision to cut.
- quote: "장점은 닫힌 판정 경계와 그림이 캐릭터로 살아나는 시각적 결과였다."
- links: S4-011, S4-010
- flags: milestone

### S4-W009 — super-pipeline built and merged a green, deployable demo shell
- source: planning/handoffs/apothecary-demo.md §Status (2026-07-24 — v2)
- date: 2026-07-24
- lanes: 2
- event: From a one-page PRD, the super-pipeline multi-agent harness (decompose → parallel worktree agents → panel-reviewed PRs → merge) produced an all-gates-green, deployable demo shell, shipped and merged as apothecary v1 (run 20260724-145432, PR #17). The same v1 later failed its human playtest (S4-043).
- tension: The harness produced a merged, green artifact autonomously; the same v1 did not pass the human playtest — both recorded of the one build.
- quote: "**v1 shipped and merged** (run 20260724-145432, PR #17): shell works, all gates green."
- links: S4-043
- flags: shipped, milestone

### S4-W010 — LLM backend live-verified across both providers, MCP, and Skills
- source: planning/handoffs/agent-arena-llm-backend.md §Status, §Verification state
- date: 2026-07-24
- lanes: 2
- event: The Agent Arena LLM backend passed 146 tests across 11 files plus live runs against OpenAI (`gpt-5.4-mini`) and Claude (`claude-haiku-4-5`) — 5 turns + compaction, remote-MCP `calculate` traces, and hosted-Skill traces on both providers — at a recorded model cost of ≈ $0.059. It was superseded a day later (S4-035).
- tension: The backend was measured working end-to-end against real providers, MCP, and Skills at ≈ $0.059, then shelved undeployed.
- quote: "All live scenarios (core matrix, remote MCP, hosted Skill, MCP-only hardening) passed on both providers … (≈ $0.059 total recorded model tokens)"
- links: S4-035, S4-037
- flags: measurement, cost

### S4-W011 — Apothecary live-AI runtime shipped and passed live verification
- source: planning/handoffs/llm-layer.md §Final outcome, §Decisions retained
- date: ~2026-07-26
- lanes: 1
- event: The Apothecary live-AI runtime landed: a stateless path (Pages → API Gateway → Lambda → Bedrock Converse) with two endpoints, one Bedrock call producing a validated dialogue beat plus four choices, Nova 2 Lite confirmed by live access/schema verification, and a deterministic playable fallback flagged by an `x-llm-fallback` header.
- tension: A live-AI runtime reached deployment after the successive architectural reductions recorded in S4-071, verified against live access and schema behavior.
- quote: "Nova 2 Lite operates on live verification of access and schema behavior" / "Valid requests degrade to a deterministic playable response"
- links: S4-071, S4-072
- flags: shipped, milestone

### S4-W012 — Timeboxed harness tweak built as a pure extension
- source: planning/handoffs/apothecary-demo-harness-note.md §What was built, §Validation done
- date: 2026-07-23
- lanes: 2
- event: The ≤1h-timeboxed harness tweak, licensed to be cut if no clean seam existed (S4-050), was BUILT: `demo_publish` added as a pure extension modifying no existing stage, validated on a throwaway fixture with the full suite green (37 unit tests + 5 control-flow scripts; existing wave-gate/fast-tail tests still passing).
- tension: A task pre-authorized to be abandoned reached BUILT as a non-modifying extension, with the harness suite still green.
- quote: "Status: **BUILT** (not cut)." / "Full `bun run validate` green (37 unit tests + 5 control-flow scripts)"
- links: S4-051, S4-050
- flags: shipped, milestone

## Implementation sweep 2026-08-10 (5a3c388..HEAD)

Coverage: read in full — `planning/meetings/2026-07-27-dungeon-concept-pivot.md`, the one
new meeting note in range (5a3c388..origin/main). No handoffs changed in this range. This note
sits chronologically between the already-mined 2026-07-24 and 2026-07-28 meetings and fills the
gap that the OH-1 corroboration §3 flagged as leaving "no meeting note" for the new-concept
discussion; that hook is revisited below.

### S4-075 — Darkest-Dungeon wrapping abandoned as a derivative shell
- source: planning/meetings/2026-07-27-dungeon-concept-pivot.md TL;DR, §2.1–§2.2
- date: 2026-07-27
- lanes: 3
- event: Both members agreed the Darkest-Dungeon-styled concept was more fun in the text paper test than the apothecary, but that the fantasy-dungeon UI did not map to the prompt/skill/MCP concepts and left the player mostly spectating. They agreed it "looked like a Darkest Dungeon knockoff" and decided to drop the dungeon/fantasy wrapping.
- tension: A concept that won the paper test on fun was cut anyway because its wrapping could not carry the AI-orchestration ideas and risked producing only a derivative of an existing game.
- quote: "다키스트가 재밌긴 하지만 그건 그냥 다키스트다"
- links: S4-011, S4-021
- flags: pivot, reversal

### S4-076 — Self-diagnosis: prompt diversity got force-mapped onto game stats, losing "에이전트 키우기"
- source: planning/meetings/2026-07-27-dungeon-concept-pivot.md §2.2
- date: 2026-07-27
- lanes: 3
- event: The pair diagnosed why the concept collapsed: unable to express real prompt diversity as game fun, they had force-mapped it onto personality (skills), tech (MCP) and context (a stress gauge), which erased the original "raising an agent" feel. They also faulted the UI for allowing too little player intervention, so auto-progression dominated and play felt like watching a trailer.
- tension: The team named its own earlier design move — bending AI concepts to fit game mechanics — as the cause of the failure it was now unwinding.
- quote: "게임에 끼워맞추려고 억지로 그렇게 한 것"
- links: S4-075
- flags: failure, contradiction

### S4-077 — Disaster-simulation concept: "재앙은 배경이고 사람이 퍼즐", two truth sources
- source: planning/meetings/2026-07-27-dungeon-concept-pivot.md §2.5
- date: 2026-07-27
- lanes: 3
- event: The largest-scale alternative brainstormed was a disaster-simulation world where an agent is trained repeatedly to avert a coming catastrophe. Design principles surfaced: the agent's real opponent must be people (a persuasion-refusing elder, a concealing mayor) not the physical disaster; failure must decompose into staged, scored units (e.g. 214 of 300 survivors); and the player deduces the real cause by contrasting an objective engine log against the agent's subjective written report.
- tension: The two-truth-source and "people are the puzzle" ideas that would define DDAY were first stated here inside a concept judged too large to control by prompting.
- quote: "재앙은 배경이고 사람이 퍼즐"
- links: S4-021, S4-023
- flags: pivot, decision

### S4-078 — Compromise: scale cut back, but report-chunk injection adopted over card drafting
- source: planning/meetings/2026-07-27-dungeon-concept-pivot.md §2.6, §3 (table)
- date: 2026-07-27
- lanes: 3
- event: The meeting converged on reducing scale back to "solve one small problem at a time" while keeping the disaster-sim's report-chunk-injection idea — pulling a sentence from a report into the next prompt as information — judged better than card-drafting rewards. Context overload and conflicting injected info were reframed as a game-fun opportunity (context management / compaction), citing a real past incident where compacting a benchmark "deleted the numbers."
- tension: An earlier real AI mishap (losing benchmark figures during compaction) was repurposed as evidence that detail-loss-under-compaction could become a game mechanic.
- quote: "보상 카드 드래프팅보다 이 편이 낫다는 데 합의했다."
- links: S4-077, S4-023
- flags: decision, pivot

### S4-079 — Scenario quality named the make-or-break; Apothecary kept as the fallback
- source: planning/meetings/2026-07-27-dungeon-concept-pivot.md §2.7, §3 note
- date: 2026-07-27
- lanes: 3
- event: Both agreed the concept's success turns entirely on scenario writing — the same disaster must stay dense enough to repeat without tiring (an Outer Wilds analogy) — and acknowledged the scenario burden was exactly why they had avoided this direction before. They left returning to Apothecary on the table as a time fallback if scenarios could not be produced.
- tension: The team committed to a concept while naming the one thing (scenario density) that could sink it, and pre-authorized a retreat to the earlier demo.
- quote: "시나리오가 안 나오면 시간상 **약국(Apothecary)으로 돌아가는 것**도 대안으로 남겨뒀다"
- links: S4-011, S4-078
- flags: boundary, contradiction

### S4-080 — The two members had imagined different "tasks" — unresolved at meeting's end
- source: planning/meetings/2026-07-27-dungeon-concept-pivot.md §2.8, §3 note
- date: 2026-07-27
- lanes: 3
- event: While writing example prompts together, the pair discovered they had pictured the core "task" differently — one imagined real-time judgment while moving across a map (dodging monsters' sight), the other a static task where a situation is given and one judgment yields an immediate result, noting the latter was closer to what the team could actually build. The gap was left unresolved at meeting's end.
- tension: A foundational disagreement about the game's basic interaction shape surfaced only when the two tried to write a concrete prompt, and closed unresolved into the next day's meeting.
- quote: "우리가 만들 수 있는 기술은 이거다"
- links: S4-025
- flags: contradiction, boundary

### S4-081 — Repetition-versus-growth debate left without resolution
- source: planning/meetings/2026-07-27-dungeon-concept-pivot.md §1.2, §2.1
- date: 2026-07-27
- lanes: 3
- event: One member held that customer-handling was fun for only two or three cases before becoming pure repetition without growth elements; the other countered that "games are inherently repetition, and rising stats within it are the fun." The minutes record the exchange as reaching no conclusion.
- tension: A basic disagreement over whether repetition is a defect or the source of fun was recorded openly as unsettled rather than resolved.
- quote: "게임은 원래 다 같은 행위의 반복이며, 그 안에서 능력치가 늘고 잘해지는 게 재미"
- links: S4-012
- flags: contradiction

## OH-1 corroboration (2026-08-10 sweep addendum)

Hook 3 (from §OH-1 above) noted the new-concept discussion "left **no meeting note**." This
sweep finds one: `2026-07-27-dungeon-concept-pivot.md` **is** the missing record between 07-24
and 07-28. **Confirmed with a correction:** the record shows the pivot was not a single
new-concept discussion but a chain — dungeon wrapping dropped (S4-075), then SF / hacking-UI /
boss-employee / disaster-simulation alternatives reviewed, converging on the dispatch → report →
re-prompt skeleton and report-chunk injection (S4-078). DDAY itself was still unconfirmed at
meeting's end (task shape unresolved, S4-080); the 07-28 note (S4-021) records only the outcome.
So OH-1's "데모 비교 이후 신규 컨셉 논의 → 최종 확정" is corroborated, with the discussion now
dated and shown to span at least two days rather than one sitting.

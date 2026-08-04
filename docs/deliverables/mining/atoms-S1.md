# Atoms — S1 concepts (`planning/concepts/`)
Snapshot: main @ 5a3c388, mined 2026-08-04.
Coverage: all 10 files of `planning/concepts/` read in full — 8 concept docs
(agent-roguelike, autobattler, apothecary, blacksmith, darkest-context,
dday-simulation, doodle-life, placement), 1 merge brief (agent-arena-brief),
1 template (game-concept-template). Nothing sampled, nothing skipped.

---

### S1-001 — Template exists to make concepts comparable, not beautiful
- source: planning/concepts/game-concept-template.md §1
- date: ~2026-07-21 (before the 07-22 concept review)
- lanes: 3
- event: The team wrote a shared template mandating identical section numbers
  and titles across all concept docs, explicitly so that documents could be
  laid side by side and one selected. Removing or reordering sections was
  forbidden.
- tension: A process decision disguised as a formatting rule — the concept
  phase was designed as a structured comparison from the start, which
  presupposes many candidate concepts and a selection step.
- quote: "모든 기획서는 같은 섹션 구조·번호를 가져야 한다 — 섹션 번호가
  어긋나면 항목별 비교가 깨진다."
- links: OH-1 hook "many concepts → merge to 3"; S1-030
- flags: boundary, process

### S1-002 — The template's primary reader is an AI agent
- source: planning/concepts/game-concept-template.md (header note)
- date: ~2026-07-21
- lanes: 4
- event: The template declared itself a self-contained instruction document
  sufficient for "the agent (or person) reading it" to write a new concept doc
  or restructure an existing draft, naming the apothecary doc as its reference
  implementation.
- tension: Direct evidence that concept documents were written by directed AI
  agents — a human-authored brief steering AI writers, with a canonical example
  doc as calibration. The "(or person)" ordering is telling: agent first.
- quote: "이 문서를 읽는 에이전트(또는 사람)는 다른 문서 없이 이것만으로
  컨셉 기획서를 새로 쓰거나 기존 초안을 이 형식으로 재구성할 수 있어야 한다."
- links: S1-039 (same pattern for scenario drafts)
- flags: boundary, ai-writer

### S1-003 — Membrane codified as a project invariant that overrides concepts
- source: planning/concepts/game-concept-template.md §5
- date: ~2026-07-21
- lanes: 1
- event: The template listed "프로젝트 불변 제약" that every concept must obey
  — membrane (no free-text input to the LLM), proxy-only runtime calls,
  balance-as-data, judge-experience-first — and ruled that a concept violating
  them must itself be redesigned, not the constraint.
- tension: The membrane predates and outranks the concepts: it is not a design
  choice inside any game but a boundary condition imposed on the whole concept
  space. Concepts bend; the membrane does not.
- quote: "위반 시 컨셉 자체를 수정 … 멤브레인: 플레이어는 LLM에 자유 텍스트를
  입력하지 않는다. … 텍스트 입력 UI를 전제한 컨셉은 그 부분을 재설계할 것."
- links: OH-1 unique-add 1 (membrane as founding agreement)
- flags: boundary, human-override

### S1-004 — Template mandates confessing verification gaps
- source: planning/concepts/game-concept-template.md §3 부록 A
- date: ~2026-07-21
- lanes: 3
- event: Appendix A of every concept doc had to state, in a fixed form, when no
  validation existed — because a doc that hides its gaps gets overvalued at the
  comparison stage.
- tension: The team pre-committed to honesty as a selection-hygiene mechanism:
  the enemy was not bad concepts but well-written unverified ones. Several
  concept docs (roguelike, autobattler, placement) duly open Appendix A with
  "테스트 미실시".
- quote: "검증이 없으면 없다고 쓴다. … 격차를 숨긴 기획서는 비교 단계에서
  과대평가를 만든다."
- links: S1-019, S1-011
- flags: boundary, measurement

### S1-005 — Tone rules police AI prose: scenes over claims, definition before naming
- source: planning/concepts/game-concept-template.md §4
- date: ~2026-07-21
- lanes: 4
- event: The template imposed writing rules on the (AI) author: one sentence one
  idea, no meta-comments about the document, statistics exiled to the appendix,
  neologism defined before named, adjectives replaced by concrete scenes — with
  a before/after example rewriting a statistics-laden claim into a scene.
- tension: A style guide as guardrail against known LLM writing failure modes
  (hedging meta-comments, citation-stuffing, adjective inflation). The team
  treated prose quality as something to be engineered into the AI writer, not
  hoped for.
- quote: "주장 대신 장면. 형용사(\"혁신적인\", \"강력한\")를 지우고 독자가 그
  순간을 상상하게 하는 구체 묘사로 바꾼다."
- flags: ai-limit, process

### S1-006 — §6 "AI 활용" is a mandatory section because the competition judges it
- source: planning/concepts/game-concept-template.md §3 §6
- date: ~2026-07-21
- lanes: 1
- event: Every concept doc had to carry an AI-utilization section denser than
  the others, with two mandatory prose subsections: fairness/guardrails (what
  the AI *cannot* do) and cost/latency design (where latency hides in the game
  rhythm).
- tension: The template forces every concept to answer "what is AI kept from"
  before it may be compared — the negative space of AI power was a first-class
  design deliverable, driven by the competition's "AI의 감독" theme.
- quote: "공정성/가드레일 설계 — AI가 무엇을 할 수 없는가, 판정이 자의적으로
  느껴지지 않게 하는 규칙."
- flags: boundary

### S1-007 — Exactly three differentiators, enforced as a maturity test
- source: planning/concepts/game-concept-template.md §3 §7
- date: ~2026-07-21
- lanes: 3
- event: The template required exactly three differentiators per concept and
  told authors to delete the weakest if they had four.
- tension: A hard cap used as a diagnostic: inability to compress to three
  meant the concept was not ready. Also mandated admitting honest limits ("buys
  trust") — which every concept doc did, uniformly confessing "기술적 해자는
  없다".
- quote: "3개로 못 줄이면 컨셉이 아직 덜 선 것이다."
- flags: process

### S1-008 — Membrane named and defined inside the first concepts
- source: planning/concepts/game-concept-agent-roguelike.md §1, 부록 B; game-concept-autobattler.md §1; game-concept-apothecary.md §1
- date: ~2026-07-21
- lanes: 1
- event: Each concept doc individually declared the no-free-text principle in
  its §1 and defined "멤브레인" in its glossary, in game-specific vocabulary
  (items/slots, card fragments, observation/choices).
- tension: The same pre-existing agreement is re-derived per game — the
  membrane arrives at the concepts fully formed, each doc only translating it
  into its own verbs. No concept doc debates whether to have it.
- quote: "플레이어는 AI에게 자유 텍스트를 입력하지 않는다. … 이 원칙을 이
  문서에서 멤브레인이라 부른다." (agent-roguelike §1)
- links: S1-003; OH-1 unique-add 1
- flags: boundary

### S1-009 — Verdicts come from measurements; the narrative model is barred from judging
- source: planning/concepts/game-concept-agent-roguelike.md §6
- date: ~2026-07-21
- lanes: 1
- event: The roguelike ruled that win/loss is decided only by measured values
  (speed, accuracy, token efficiency) under pre-published weights; the LLM that
  narrates the fight has no say in the outcome, and only verifiable tasks are
  admitted as dungeons.
- tension: An early, sharp statement of the team's core trust split: AI may
  perform and narrate, but judgment belongs to deterministic measurement. Even
  gambling (ascension odds) is distinguished from judgment: "판정에 운을 섞는
  것과 운을 버튼으로 파는 것은 다르다."
- quote: "측정 판정: 대결의 승패는 실측값과 사전 공개된 가중치로 결정한다.
  서술 모델은 승패에 관여하지 않는다."
- flags: boundary

### S1-010 — Boss side is a recorded trace; only the player's agent runs live
- source: planning/concepts/game-concept-agent-roguelike.md §6 비용·지연 설계
- date: ~2026-07-21
- lanes: 1
- event: To control cost and verdict stability, the roguelike pre-records boss
  agent execution traces and replays them; the only live LLM call per stage is
  the player's agent.
- tension: A cost boundary doubling as a fairness device — the "opponent AI"
  the player perceives is partly theater, deliberately, so that variance stays
  on the player's side of the screen only.
- flags: cost, boundary

### S1-011 — Roguelike admits its P0 unknown and pre-designs the fallback
- source: planning/concepts/game-concept-agent-roguelike.md 부록 A
- date: ~2026-07-21
- lanes: 1
- event: The doc declared it had run no paper test, named agent-state binding
  as the P0 question (can real token/context usage be read and bound to the
  gauge?), and pre-committed to a fork: (A) bind real measurements, or (B)
  simulate the gauge in the game layer at the cost of weakening its own
  differentiator #1.
- tension: The concept's flagship claim ("스탯이 실측값이다") was known to rest
  on an unverified API capability, and the doc priced in its own degradation
  path rather than hiding it.
- quote: "이 컨셉은 페이퍼 테스트를 실시하지 않았다. 아래는 전부 미검증
  가설이며…"
- links: S1-004
- flags: measurement, ai-limit

### S1-012 — Typing rejected first among the roguelike's discarded designs
- source: planning/concepts/game-concept-agent-roguelike.md 부록 A "보류한 설계"
- date: ~2026-07-21
- lanes: 1
- event: The doc's rejected-designs list opens with "플레이어가 직접 프롬프트를
  타이핑하는 조작(멤브레인 위반)" — considered and excluded, alongside
  real-time PvP, actual fine-tuning, and player-made dungeons.
- tension: Trace that direct prompt-typing was actively on the table during
  ideation and killed by the membrane, not merely never thought of.
- flags: boundary, reversal

### S1-013 — Attribution instead of consistency: the fairness contract rewritten for LLMs
- source: planning/concepts/game-concept-autobattler.md §5.4, 부록 A 기술 근거
- date: 2026-07-22 (research date given in doc)
- lanes: 1
- event: The autobattler refused to promise "same prompt = same behavior",
  citing measured nondeterminism at temperature 0, and instead promised that
  every judgment cites its cause card ("귀속"). Interpretive variance was
  reclassified as content; only untraceable judgment is a bug.
- tension: The team confronted an AI limit (output nondeterminism) and, rather
  than fighting it, redefined game fairness so the limit becomes a feature.
  This became a load-bearing belief across later concepts (darkest-context §6-2
  carries it verbatim).
- quote: "해석의 다양성은 콘텐츠, 소급 불가능한 판단은 버그다."
- links: S1-041 (the same axis later measured and partially reversed)
- flags: boundary, ai-limit

### S1-014 — Intent-only rail with deterministic fallback: the game never waits for the LLM
- source: planning/concepts/game-concept-autobattler.md §6
- date: ~2026-07-21
- lanes: 1
- event: LLMs were confined to high-level intent in a closed choice space
  (citing TextStarCraft II etc.: LLMs weak at coordinates/ticks, strong at
  enumerated judgment); execution is a deterministic engine; if a re-interpret
  call is late, the unit keeps its previous intent.
- tension: Latency treated as a certainty to design around, not a risk to
  mitigate — the LLM is structurally unable to block gameplay. Darkest-context
  hardened this to "응답 3초 초과 시 직업별 기본 행동".
- quote: "전투는 LLM을 기다리지 않는다."
- flags: boundary, ai-limit

### S1-015 — Authoring rule: only high-intensity personality fragments enter the pool
- source: planning/concepts/game-concept-autobattler.md §6, 부록 A
- date: ~2026-07-22
- lanes: 1
- event: Card fragments had to be authored at high intensity — 「겁이 많다」
  admitted, 「다소 신중하다」 banned — citing persona research that vivid
  personas are stable and mild ones unstable under LLM interpretation.
- tension: Content authoring rules derived from model behavior, not fiction:
  the writing style of game text is constrained by what the model can hold
  onto. Direct ancestor of DDAY's conditional-temperament authoring.
- quote: "「겁이 많다」는 되고 「다소 신중하다」는 안 된다."
- links: S1-040
- flags: boundary, ai-limit

### S1-016 — Screen must read as a card game, never as programming
- source: planning/concepts/game-concept-autobattler.md §5.2, §8, 부록 A 반면교사
- date: ~2026-07-22
- lanes: 1
- event: The autobattler banned node graphs, conditionals, and settings panels
  from the UI, mandating card/equipment grammar, citing Bot Land's postmortem
  (died of being perceived as "for programmers" even though scripting was
  optional).
- tension: The interior is agent engineering; the exterior must deny it. A
  deliberate presentation membrane over the mechanical one — the team's belief
  that AI-engineering fun is sellable only in disguise. Carried verbatim into
  the agent-arena brief ("내부는 에이전트 엔지니어링, 화면은 카드 게임").
- flags: boundary

### S1-017 — "Gamers hate the chatbot, not the AI" — the market case for the membrane
- source: planning/concepts/game-concept-autobattler.md §7, 부록 A; game-concept-apothecary.md 부록 A
- date: 2026-07-22 (research date)
- lanes: 1
- event: Both shop and autobattler docs anchored their positioning on the same
  research finding (85% of gamers negative on in-game genAI, Quantic Foundry
  2025-12) read as hostility to free-text chatbots specifically, converting the
  membrane from a safety rule into a market differentiator ("판돈은 있고,
  타이핑은 없다").
- tension: The founding membrane agreement acquires an after-the-fact economic
  justification — the constraint the team imposed for safety/feasibility gets
  re-sold as the anti-chatbot position.
- quote: "게이머가 싫어하는 것은 AI가 아니라 챗봇이다."
- links: S1-003; OH-1 unique-add 2
- flags: boundary, pivot

### S1-018 — Autobattler confesses it is the only unverified concept among five
- source: planning/concepts/game-concept-autobattler.md §10, 부록 A
- date: ~2026-07-22
- lanes: 4
- event: The doc flagged its core fun (whether LLM interpretation of card
  combos is enjoyable) as the sole unverified system among the then-five
  candidates, designated a hand-played Test 3 as first action if selected, and
  listed the risk openly in §10.
- tension: The comparison process worked as designed: verification status was a
  visible axis between concepts, and the "who judges fun" answer is explicit —
  a human hand-play test, not the model or the author.
- quote: "전용 페이퍼 테스트 미실시 — 다섯 후보 중 유일한 미검증 컨셉."
- links: S1-004
- flags: measurement

### S1-019 — Dev-time AI role appears: fragment authoring as role ④
- source: planning/concepts/game-concept-autobattler.md §6 (role table)
- date: ~2026-07-21
- lanes: 4
- event: Alongside three runtime roles, the autobattler listed a fourth,
  development-time role: AI generates and validates the pool of composable
  prompt fragments. Placement later expanded this pattern into a full pipeline.
- tension: First S1 trace of the split the deliverable's lane structure
  mirrors: AI as content creator upstream, with curation gates, distinct from
  AI as runtime actor.
- links: S1-035, S1-039
- flags: boundary

### S1-020 — The paper test wrote the apothecary's architecture
- source: planning/concepts/game-concept-apothecary.md 부록 A (Test 1, 2026-07-21)
- date: 2026-07-21
- lanes: 4
- event: A hand-played paper prototype (11 customers, GM-operated AI) ran
  before the doc was finalized; H1 (AI customer authoring) and H3 (judgment
  fairness) passed, H2 passed conditionally, and the doc states its
  architecture is a transcription of these results.
- tension: Fun was judged by humans playing on paper against a live model —
  before code existed. The team's answer to "who judges whether AI-generated
  fun is fun": a person at a table, quoted verbatim in the appendix.
- quote: "이 기획서의 아키텍처는 이 테스트 결과의 반영이다."
- flags: measurement

### S1-021 — 단서 계약: truth is locked before the player sees anything
- source: planning/concepts/game-concept-apothecary.md §6
- date: 2026-07-21
- lanes: 1
- event: The apothecary fixed the customer's hidden problem, clues, red
  herring, and risk level *before* presentation, banning retroactive revision;
  bad outcomes must cite the clue the player missed.
- tension: The single most-replicated guardrail in the corpus — the AI is
  denied the power to move the goalposts after seeing the player's answer.
  Reappears as 캠페인 바이블 (blacksmith), QuestContract (doodle-life), 단서
  계약의 변형 (placement), and timeline truths (DDAY).
- quote: "소급 수정은 금지 — 단서는 계약이다."
- links: S1-047, S1-050
- flags: boundary

### S1-022 — A playtester's sentence becomes a design law: no right answers
- source: planning/concepts/game-concept-apothecary.md 부록 A, §3, §6
- date: 2026-07-21
- lanes: 4
- event: A tester's remark — that death, side effects, and misuse should all be
  "just the consequence of my judgment," not failure — was converted directly
  into the "틀린 답 없음" experience goal and the "정오 낙인 금지" guardrail
  (internal grades exist but correct/wrong is never displayed).
- tension: The traceable moment where a human playtest quote overrode the
  default quiz-like framing an AI judgment system implies. The rule then
  propagated to blacksmith unchanged.
- quote: "틀린 답이라는 것은 없으면 좋겠어. 사람이 죽은 것도, 다치는 것도,
  오용하는 것도 전부 그냥 '내 판단의 결과'인 거지."
- flags: human-override, measurement

### S1-023 — The judge accepted an off-script solution — the existence proof for AI judgment
- source: planning/concepts/game-concept-apothecary.md 부록 A (H3)
- date: 2026-07-21
- lanes: 1
- event: In adversarial paper-test plays, a player answered a poison request
  with a harmless disguised concoction — not in any script — and the AI judge
  resolved it coherently; the doc names this the structural thing a
  deterministic sim cannot do and "이 아키텍처의 존재 증명".
- tension: The positive boundary of trust: creative-input adjudication is
  precisely what the AI is *for*, and the team recorded the moment they
  believed it — while still keeping verdict severity on rails.
- quote: "대본에 없던 창의적 해법(무해한 위장 조제)을 판정기가 받아낸 것은
  결정론 시뮬이 구조적으로 못 하는 일."
- flags: measurement

### S1-024 — The conditional pass: crafting itself isn't fun yet
- source: planning/concepts/game-concept-apothecary.md §5.3, §10
- date: 2026-07-21
- lanes: 4
- event: The paper test's top criticism — "약을 제조하는 재미는 아직 부족한
  느낌이었다" — made 조제 the declared top build target ("이 시스템의 겉모습이
  재미없으면 게임이 실패한다" pattern), with the absorbed blacksmith's
  [정석]/[실험] mechanic as the direct prescription.
- tension: Measured weakness, not vision, set the build priority — the template
  demanded a top build target and the test supplied the evidence for which one.
- flags: measurement, failure

### S1-025 — Blacksmith absorbed into apothecary with explicit admission criteria
- source: planning/concepts/game-concept-apothecary.md 부록 A "대장장이 컨셉 흡수"; game-concept-blacksmith.md (archive header)
- date: 2026-07-22
- lanes: 4
- event: A team meeting absorbed blacksmith into apothecary. Admission criteria
  were stated (fits apothecary's core, has fun evidence, doesn't bloat scope);
  what survived (단골 아크, [정석]/[실험], 연쇄 결과) and what was dropped
  (economy/능력 격차, world-channel expansion, 흑막 route) were itemized with
  reasons.
- tension: The first documented merge of the funnel — and its most-cited reason
  is evidence, not preference: 단골 아크 survived because of the strongest H2
  quote; the untested H4 (open-ended campaign continuity) was discarded rather
  than assumed.
- links: OH-1 hook "merge to 3"; S1-026
- flags: pivot, boundary

### S1-026 — Open-ended AI campaign continuity: unverified, therefore forbidden
- source: planning/concepts/game-concept-apothecary.md §5.8, 부록 A "검증 격차"; game-concept-blacksmith.md §10, 부록 A
- date: 2026-07-22
- lanes: 1
- event: Blacksmith's Test 2 (H4 — can AI hold a multi-visit campaign world
  without contradiction) was left unrun when the concept was absorbed; the
  apothecary therefore restricted recurring-customer arcs to pre-authored
  2–4-visit closed units, explicitly *because* open-ended AI continuity was
  unverified.
- tension: A trust boundary drawn at the exact edge of measurement: what was
  tested (single-visit judgment) is AI's; what wasn't (long-horizon world
  memory) stays human-authored. Blacksmith's own fallback plan went further:
  "완전 실패 시 폴백: 스크립트된 캠페인 골격 + AI는 비네트·변주 작문만."
- quote: "AI의 개방형 캠페인 유지는 미검증이다. §5.8이 아크를 사전 저작
  단막으로 제한하는 이유다."
- flags: boundary, ai-limit

### S1-027 — Continuity rests on a ledger, not on the model's memory
- source: planning/concepts/game-concept-blacksmith.md §6 세계 연속성 설계; game-concept-apothecary.md §6 상태 원장
- date: ~2026-07-22
- lanes: 1
- event: Both shop concepts mandated a structured state ledger (items given,
  injuries, deaths, promises, reputation) that every AI authoring call must
  read and may not contradict — explicitly contrasted with relying on context
  memory.
- tension: An architectural distrust of LLM memory stated as principle before
  any engine existed: "컨텍스트 기억이 아니라 명시적 상태 저장소다." The
  belief survives into DDAY's engine-owned timeline.
- flags: boundary, ai-limit

### S1-028 — Blacksmith's naive build failed on paper and was voided
- source: planning/concepts/game-concept-blacksmith.md 부록 A
- date: 2026-07-21
- lanes: 4
- event: In Test 1, the blacksmith phase was built with inventory mapping 1:1
  to needs; inference collapsed into simple matching and the doc voided that
  phase as validation, redesigning §5.1 (clues hidden in party composition) as
  the correction.
- tension: A recorded paper-test failure with its correction — kept in the doc
  rather than erased, and the reason blacksmith entered the 07-22 merge as the
  weaker sibling.
- quote: "추론이 단순 대조로 붕괴해 본 기획의 검증으로는 무효 처리한다."
- flags: failure, measurement

### S1-029 — 07-22 decision: no merged design doc — demos judge, not documents
- source: planning/concepts/agent-arena-brief.md (header note)
- date: 2026-07-22
- lanes: 4
- event: When agent-roguelike and autobattler were merged, the team decided not
  to write a combined 기획서; the brief exists only to align the two people,
  and final judgment was delegated to a demo bakeoff.
- tension: A deliberate stop on document-driven selection: after one round of
  comparable docs, the medium of evidence switches from prose to playable
  demos. "Who judges fun" moves from readers to players.
- quote: "기획서가 아니다 — 2026-07-22 결정에 따라 병합 기획서는 쓰지 않고,
  최종 판단은 데모 베이크오프가 한다."
- links: OH-1 process shape (3 demos → comparison); S1-001
- flags: pivot, process

### S1-030 — Merge logic: a neutral spine so neither concept absorbs the other
- source: planning/concepts/agent-arena-brief.md §2
- date: 2026-07-22
- lanes: 4
- event: The brief justified the merge structurally: the map spine solves the
  autobattler's implementation risk (real-time combat in 3 weeks) and the
  roguelike's dullness (single agent, no party drama) simultaneously, while
  being neutral ground — "어느 쪽도 흡수당하지 않는다."
- tension: The merge was argued from each parent's unsolved problem, not from
  feature addition — and the brief immediately flags the union's own risk
  ("시스템 폭증 — 두 원본의 합집합은 3주를 넘는다"), deferring the cutline to
  a human session.
- flags: pivot, boundary

### S1-031 — Rename to Darkest Context: the name follows the signature resource
- source: planning/concepts/game-concept-darkest-context.md §0
- date: ~2026-07-25
- lanes: unclear
- event: "에이전트 아레나" was rejected as missing the core ("이 게임은
  대전장이 아니라 여정과 관전이다"); the new name encodes the context gauge —
  the game's own crisis state — over an arena framing, with considered
  alternatives recorded.
- tension: A small reversal that reveals what the team believed the game was
  about: watching minds degrade, not winning fights. The record of rejected
  names shows the decision was deliberated, not drifted into.
- flags: reversal

### S1-032 — The "hallucination" is engine-injected noise, not real model failure
- source: planning/concepts/game-concept-darkest-context.md §4
- date: ~2026-07-25
- lanes: 1
- event: The context gauge was defined as an engine-managed number, not real
  context-window pressure: above 70% the *engine* corrupts the unit's situation
  summary (wrong HP, phantom enemies) and the LLM judges the corrupted input
  honestly — making "hallucination" level-designable.
- tension: The team declined to trust real LLM failure modes as game mechanics
  and simulated them instead — AI unreliability is admitted as theme but kept
  under deterministic control. A precise picture of what AI is trusted with
  (judging) vs kept from (its own malfunction).
- quote: "LLM은 오염된 입력으로 정직하게 판단하므로 환각처럼 보이지만, 오염의
  양과 종류는 엔진이 결정 → 레벨 디자인 가능"
- flags: boundary, ai-limit

### S1-033 — Second pressure resource rejected: 07/25 stamina kill
- source: planning/concepts/game-concept-darkest-context.md §4
- date: 2026-07-25
- lanes: unclear
- event: A per-call stamina resource was reviewed and killed: the context gauge
  alone suffices as pressure, and a second consumable resource costs more in
  implementation and tuning than it returns.
- tension: A scope decision recorded with its reasoning — the 2-person/3-week
  budget acting as an active design force inside a concept, not just a
  milestone table.
- flags: reversal, cost

### S1-034 — View decided by asset economics and latency-hiding, 07/25
- source: planning/concepts/game-concept-darkest-context.md §7, §6-5
- date: 2026-07-25
- lanes: 1
- event: The side-scroll line view was confirmed over top-down grid (implies
  movement that doesn't exist; speech bubbles collide) and quarter view ("아이소
  에셋 비용이 2인 3주에 과함"); walking animation doubles as the pipeline that
  hides two wall-clock LLM calls.
- tension: Presentation choices made subordinate to two constraints at once —
  the no-graphics-capacity reality and LLM latency — the exclusion list's
  shadow visible inside a concrete UI decision.
- links: OH-1 exclusion list hook
- flags: boundary, cost

### S1-035 — Chatter is pre-generated at design time; runtime latency zero
- source: planning/concepts/game-concept-darkest-context.md §6-5
- date: ~2026-07-25
- lanes: 4
- event: Non-critical party banter was to be mass-generated by LLM at design
  time into a keyed pool ([성격 조합 × 최근 사건 버킷]) and replayed at
  runtime, reserving live calls for judgments only.
- tension: The runtime/dev-time split applied surgically: AI writes wherever
  latency doesn't matter, and the pipeline decides which words are live and
  which are canned.
- flags: boundary, cost

### S1-036 — DDAY is born from a demo's failure: the fantasy mapping was the problem
- source: planning/concepts/game-concept-dday-simulation.md §1
- date: ~2026-07-27
- lanes: 4
- event: Building the darkest-context demo revealed that forcing
  prompt/skill/MCP into fantasy skin (spam golems, "성격이면 Prompt, 물건이면
  MCP") was itself the source of dissonance; removing the mapping would leave a
  derivative fantasy game — so the team inverted: drop the mapping, make a
  nakedly agent-vocabulary game where token/context/compact are rules because
  they are real.
- tension: The central pivot of the concept phase, reached only through
  building — the doc's own structure ("darkest-context의 문제" as §1) records
  that DDAY is a post-demo latecomer, exactly as OH-1 remembers ("데모 비교
  이후 신규 컨셉 논의").
- quote: "매핑을 버리고, 노골적으로 에이전트 게임을 만든다."
- links: OH-1 DDAY-latecomer hook
- flags: pivot, failure

### S1-037 — The fiction naturalizes the membrane instead of imposing it
- source: planning/concepts/game-concept-dday-simulation.md §3
- date: ~2026-07-27
- lanes: 1
- event: DDAY's simulation fiction was chosen partly because it makes the
  membrane diegetic: the player is outside the simulation and *cannot* speak
  into it; repetition, resets, and token limits all become "what would really
  happen" instead of translated rules.
- tension: The founding constraint stops being a restriction and becomes the
  premise — the concept that won is the one where the membrane costs nothing.
  A table in the doc lists exactly which awkward darkest-context problems the
  fiction dissolves for free.
- quote: "멤브레인(타이핑 금지)이 왜 자연스럽나? 플레이어는 시뮬레이션 밖의
  인물 — 안에 말을 걸 수 없다"
- links: S1-003, S1-036
- flags: boundary, pivot

### S1-038 — Scenario drafts commissioned from multiple AI sessions, then re-ranked by humans
- source: planning/concepts/game-concept-dday-simulation.md §4.1
- date: 2026-07-28 (re-ranking; drafts earlier)
- lanes: 4
- event: A writing brief was assigned to multiple model sessions, yielding five
  disaster-scenario drafts; a first human review ranked by on-paper density
  (reactor ahead), then two later decisions (text-mystery genre; haiku runtime)
  changed the evaluation axes and the ranking was redone — terrorist-phone-call
  provisionally selected, two drafts rejected with salvage notes.
- tension: Lane-4 in full: AI writers directed by a brief, humans owning both
  the criteria and the right to change them mid-stream. The reversal (reactor →
  terror call) is documented with the criterion shift that caused it, and even
  rejected drafts are mined ("문장 채집 샘플·인물 설계 기법은 채집").
- quote: "집필 브리프를 여러 모델 세션에 배정해 초안 5편을 받았다."
- flags: reversal, measurement, ai-writer

### S1-039 — One draft's contradiction absorbed as the game's twist, deliberately
- source: planning/concepts/game-concept-dday-simulation.md §4.1
- date: 2026-07-28
- lanes: 4
- event: The winning scenario draft conflicted with the brief's rule ("재앙은
  못 막는다" vs the script's "테러를 막아라"); instead of rejecting it, the
  team accepted the draft's own resolution — a mid-game truth flips the goal
  from "stop it" to "evacuate" — as the game's spine, and ruled the twist
  belongs to run 3, not the first 60 seconds.
- tension: An AI writer's deviation from the brief was adjudicated by humans
  and *kept* — the clearest S1 example of curation as the human role: not
  compliance-checking but judgment about which violations are gifts.
- flags: human-override, boundary

### S1-040 — Measurement flips the design: temperament, not equipped sentences, drives judgment
- source: planning/concepts/game-concept-dday-simulation.md §5
- date: 2026-07-28
- lanes: 1
- event: PoC v1 measured that agents without temperament converge to the model
  default (24/24 identical choices over 3 runs) and that normative sentences
  barely move judgment, while swapping temperament reproduces the full choice
  spectrum (E9). Design response: temperament becomes an authored,
  player-invisible, immutable conditional procedure; the player's verb becomes
  belief-state manipulation (feeding facts/guesses that flip the conditions).
- tension: The concept's initial lever (equip prompt fragments → behavior
  change) was empirically weak, and the team rebuilt the core loop around what
  the measurements said actually moves an LLM — the largest
  evidence-driven redesign in S1.
- quote: "판단을 가르는 최강 레버는 장착 문장이 아니라 기질이다."
- links: S1-015
- flags: reversal, measurement, ai-limit

### S1-041 — Attribution reversal: the AI's self-explanation is demoted to theater
- source: planning/concepts/game-concept-dday-simulation.md §6, §9
- date: 2026-07-28
- lanes: 1
- event: PoC measurement refuted H2: agents cite sentences *opposite* to their
  actual behavior as their reason (귀속 역전). The `because` self-attribution —
  the fairness engine of the autobattler/darkest-context line — was kept only
  as presentation, banned from game-logic judgments; the objective timeline is
  assembled by the engine from event logs, never written by the LLM.
- tension: A founding belief (judgments citing cause cards make AI fair) was
  partially falsified by measurement and the trust boundary redrawn: the AI may
  perform explanation but the engine owns truth.
- quote: "에이전트는 자기 행동과 정반대인 문장을 근거로 인용한다(귀속 역전).
  게임 로직 판정에는 쓰지 않는다."
- links: S1-013
- flags: reversal, measurement, ai-limit, fabrication

### S1-042 — The AI's unreliability is promoted to content: two-layer reports
- source: planning/concepts/game-concept-dday-simulation.md §6
- date: 2026-07-28
- lanes: 1
- event: DDAY's core artifact pair — the engine's objective log vs the agent's
  self-written report — was designed so that the *gap* between them (the
  report says the crowd was hostile; the log shows the agent insulted the mayor
  first) is simultaneously information, comedy, and the only channel for
  reading the invisible temperament.
- tension: The same property that got `because` demoted (S1-041) is here
  harvested: the team split AI output into a lane where distortion is fatal
  (logs — engine-owned) and a lane where distortion is the product (subjective
  reports). The sharpest expression of the team's AI-trust model in S1.
- quote: "두 기록의 간극이 정보이자 코미디이며, 기질의 지문이다."
- flags: boundary, pivot

### S1-043 — Sentence harvesting: the player composes prompts without writing a word
- source: planning/concepts/game-concept-dday-simulation.md §7
- date: 2026-07-27/28
- lanes: 1
- event: A separate card system was dropped (07-27); instead the player drags
  sentences that the simulation itself produced (log lines, report
  reflections) into a sectioned agent file. Even promoted directives are
  agent-generated text; every failure yields sentences ("지는 게 콘텐츠다").
  Compact/token-limit and synthesis were deferred to Phase-2 (07-28).
- tension: The membrane's most complete construction — the player edits an
  agent's mind using only material the world emitted, closing the loop the
  founding agreement opened ("닫힌 환경에서의 최대의 자유도"). The Phase-2
  deferrals show scope discipline applied even to signature mechanics.
- quote: "멤브레인 유지 — 플레이어는 쓰지 않고, 시뮬레이션이 산출한 문장을
  고를 뿐이다."
- links: S1-003; OH-1 unique-add 2
- flags: boundary, pivot

### S1-044 — Genre decision 07-28: text mystery — graphics minimized by choice
- source: planning/concepts/game-concept-dday-simulation.md §8
- date: 2026-07-28
- lanes: 1
- event: Presentation was fixed as a text-deduction game (the watch screen is a
  self-writing document; props are all paperwork), with a stated price — the
  30–60s judging video's spectacle — and a stated bonus: latency hiding becomes
  nearly free because waiting for radio replies is diegetic suspense.
- tension: The exclusion list ("그래픽이 중요한 게임" impossible) surfaces as a
  positive aesthetic decision, and latency — every concept's enemy — is finally
  dissolved into the fiction rather than hidden behind animations.
- quote: "무전기·전화·방송의 세계에서 '…무전 회신 대기 중'은 랙이 아니라
  서스펜스다."
- links: OH-1 exclusion list hook; S1-034
- flags: boundary, cost

### S1-045 — "One call simulates the whole run" rejected; haiku chosen with eyes open
- source: planning/concepts/game-concept-dday-simulation.md §9
- date: 2026-07-28
- lanes: 1
- event: The architecture rejected letting one LLM call simulate a run (the
  fixed timeline and hidden truths would wobble per run); the deterministic
  engine owns the world and LLM calls happen only at authored judgment points.
  Runtime model fixed at haiku tier, with the explicit caveat that all v1
  measurements were sonnet-based and must be recalibrated — "모델이 너무
  유능하다" could invert into "저작하지 않은 방식으로 틀린다."
- tension: Two boundary decisions with named costs: world integrity over
  generative convenience, and price/latency over capability — plus the
  discipline of invalidating one's own prior measurements when the model
  changes.
- flags: boundary, cost, measurement

### S1-046 — Role isolation moved from prompts to execution environment after 6 contaminations
- source: planning/concepts/game-concept-dday-simulation.md §9
- date: 2026-07-28
- lanes: 1
- event: Six contamination incidents in the PoC showed that in-band text
  sealing of roles is powerless or gets mistaken for injection; the design
  moved identity enforcement to system prompt + tool permissions, with the
  proxy owning the system prompt and the client sending only structured game
  elements.
- tension: The membrane rule re-derived from failure data — the doc itself
  notes the convergence: "멤브레인 규칙과 같은 결론에 실측으로 도달했다." A
  belief held by agreement got independently confirmed by incident.
- flags: failure, measurement, boundary

### S1-047 — Scenario authoring named the biggest risk — and the team's weakest skill
- source: planning/concepts/game-concept-dday-simulation.md §10
- date: 2026-07-28
- lanes: 4
- event: The doc's first unresolved risk states that the disaster scenario's
  density is the whole game (a world watched N times must reward re-watching)
  and records that scenario authoring is the team's least-confident area, with
  the caveat that paper density passing does not guarantee play density.
- tension: A named human incapacity sitting exactly where AI writers were
  deployed (S1-038) — the honest register of why lane 4 exists in this project
  at all.
- quote: "시나리오 저작이 최대 리스크이자 팀이 가장 자신 없는 부분임을
  인지하고 있다."
- flags: boundary, ai-limit

### S1-048 — Doodle Life: drawing as the membrane-compliant free input
- source: planning/concepts/game-concept-doodle-life.md §1, §5.4, §5.5
- date: ~2026-07-23
- lanes: 1
- event: Doodle Life answered NPC requests with player drawings instead of
  text: no ability menus, no free-text declaration ("자유 텍스트로 원하는
  능력을 선언할 수는 없다"), the answer is a drawn shape whose *visible
  function* a VLM reads. Drawing skill explicitly gives no advantage.
- tension: The one concept that found a third input channel — neither
  structured picks nor typing — showing the membrane constrains the medium
  (text) rather than expressiveness. Correctness is functional ("높은 곳에
  닿기") with multiple valid shapes, not object-name matching.
- flags: boundary

### S1-049 — The VLM judges blind: the answer is withheld from the model
- source: planning/concepts/game-concept-doodle-life.md §5.5, §6
- date: ~2026-07-23
- lanes: 1
- event: The VLM reads the drawing without receiving the quest's answer tags —
  to prevent it fitting a non-wing into "wing" — must ground every trait in
  visible strokes, must mark uncertainty instead of inventing abilities, and is
  barred from judging invisible virtues (kindness, courage).
- tension: An information firewall *between AI calls* as a fairness device —
  the team distrusts not only AI verdicts but AI sycophancy toward known
  answers. Grading itself is a local deterministic comparison; "판정은 AI 밖에
  있다."
- quote: "정답을 모르는 판독: VLM에는 선택한 부탁의 정답 기능을 전달하지
  않는다."
- links: S1-021, S1-050
- flags: boundary, ai-limit

### S1-050 — QuestContract: the lock-before-input pattern generalized to a schema
- source: planning/concepts/game-concept-doodle-life.md §5.2, §6
- date: ~2026-07-23
- lanes: 1
- event: Doodle Life formalized the clue-contract lineage into a typed schema
  (QuestContract with AND/OR need rules, partial affordances, pre-fixed
  outcomes) locked before the player draws; the LLM authors quest *candidates*
  and a local validator admits only playable ones ("열린 콘텐츠, 닫힌
  프로토콜").
- tension: The guardrail evolving from prose rule (apothecary) to data
  structure — the trust boundary hardening into a schema, prefiguring the
  project's later balance-as-data and datapack discipline.
- flags: boundary

### S1-051 — Doodle Life's rejected-designs list is a catalog of AI anti-patterns
- source: planning/concepts/game-concept-doodle-life.md 부록 A "보류한 설계"
- date: ~2026-07-23
- lanes: 1
- event: The doc explicitly shelved: free-text NPC chat, post-hoc problem
  generation after seeing the drawing, LLM-decided success, per-click LLM
  simulation, Director→Critic serial chains, and infinite long-term memory.
- tension: Each rejection marks a place the team refused to put an LLM — the
  list reads as the membrane-era belief system in negative space, several items
  (post-hoc generation, LLM verdicts) being exactly the failure modes other
  docs cite competitor games for.
- flags: boundary

### S1-052 — Placement absorbed into Doodle Life, 07-23
- source: planning/concepts/game-concept-placement.md (absorption header)
- date: 2026-07-23
- lanes: 4
- event: The Placement concept was absorbed into Doodle Life one day after the
  concept review; the doc was kept as a record, with the surviving principle
  named: reading hidden needs from speech/behavior became "observe the request,
  then draw the creature."
- tension: Third documented merge of the funnel (after
  blacksmith→apothecary and roguelike×autobattler→arena), completing the
  many→3 consolidation OH-1 remembers.
- links: OH-1 merge hook; S1-025, S1-029
- flags: pivot

### S1-053 — "Prompt engineering is engine engineering" — the competition narrative named in advance
- source: planning/concepts/game-concept-placement.md §6
- date: ~2026-07-22
- lanes: 4
- event: Placement framed its dev-time pipeline — AI authors levels/stages, a
  2-stage validator certifies them (CSP proof of solvability + a blind-reader
  AI decoding clue legibility, with target-band rejection) — and declared that
  encoding constraints into prompts and validators *is* the engine work, and
  the center of the competition's AI-utilization document.
- tension: An AI validating another AI's output, with humans keeping final
  curation ("사람의 최종 큐레이션은 유지") — and the team consciously
  identifying, mid-concept-phase, which of its own practices the judges would
  care about.
- quote: "프롬프트 엔지니어링이 곧 엔진 엔지니어링이며, 대회 'AI 활용
  기술문서'의 중심 서사다."
- flags: boundary, measurement

### S1-054 — Counter-examples fix the boundary: when the LLM holds the truth, deduction dies
- source: planning/concepts/game-concept-placement.md 부록 A
- date: ~2026-07-22
- lanes: 1
- event: Placement's research recorded named negative precedents as design
  boundaries: L.A. Noire (acting decoupled from variables → reading becomes a
  coin flip), Vaudeville (LLM holding the truth → deduction collapses), inZOI
  (LLM translation nobody needs to read → "cosmetic") — each mapped to a
  specific guardrail (judgment outside AI; LLM acting as the *only* load-
  bearing info channel).
- tension: The team's boundaries were argued from other games' corpses, not
  taste — the clearest evidence that "what AI is kept from" was a researched
  position.
- flags: boundary, ai-limit

### S1-055 — LLM performance becomes the puzzle's only information channel
- source: planning/concepts/game-concept-placement.md §5.2, §7
- date: ~2026-07-22
- lanes: 1
- event: Placement's core bet: hide the deterministic stats entirely and make
  the LLM's acted dialogue/behavior the sole channel for reading them —
  "AI가 있어야만 성립하는 디자인" — with dual evidence channels per trait and
  a declared first risk that if the translation is illegible the game becomes a
  lottery.
- tension: The inverse trust allocation to most concepts: here AI is trusted
  with *all* player-facing information while determinism silently owns truth
  and scoring — the same split as S1-032, approached from the other side.
- flags: boundary

### S1-056 — Every concept ends its risk table pointing at its own AI weak spot
- source: planning/concepts/game-concept-autobattler.md §10; game-concept-placement.md §10; game-concept-doodle-life.md §10; game-concept-agent-roguelike.md §10
- date: 2026-07-21 ~ 07-23
- lanes: 1
- event: Across the concept set, the #1 risk row is consistently the AI's
  legibility failure, in genre-specific dress: interpretation felt as "bad
  RNG" (autobattler), translation as lottery (placement), VLM missing intent
  (doodle-life), 60-second spectation boring (roguelike) — each bound to a
  declared top build target as the mitigation.
- tension: Boring but load-bearing: the team's shared model of AI's failure
  mode was uniform before any engine existed — not wrongness but
  *unreadability*; fairness meant "the player can trace it," and every concept
  staked its first build week on that.
- flags: ai-limit, boundary

---

## OH-1 corroboration

**Hook 1 — Do concept docs reference the membrane agreement?** **Confirmed,
strongly.** The template lists the membrane under "프로젝트 불변 제약 (모든
컨셉이 지켜야 함 — 위반 시 컨셉 자체를 수정)" (game-concept-template.md §5),
i.e. it existed *before* and *above* the concepts; every game concept doc then
declares it in §1 and defines it in its glossary (agent-roguelike §1/부록 B,
autobattler §1/부록 B, apothecary §1/부록 B, blacksmith §1/부록 B, placement
§1/부록 B, darkest-context §6-1, doodle-life §1/§6, dday §1/§3). No concept
debates whether to have it — consistent with OH-1's claim that it was a
founding agreement predating the concepts. (Atoms S1-003, S1-008, S1-037.)

**Hook 2 — Do concept docs reference the exclusion list (no physics / no
graphics-heavy / no sprawling story)?** **No trace of the list as such;
consistent shadow evidence.** No concept doc cites an exclusion list or the
scoping discussion. But its shape is visible in decisions: every combat/world
engine is deterministic with no physics (autobattler §5.5, darkest-context
§6-3); darkest-context rejected quarter view because "아이소 에셋 비용이 2인
3주에 과함" (§7); DDAY chose "애니메이션·그래픽은 최소화" text-mystery
presentation (§8) and rejected scenario drafts for terrain-simulation and
scale ("지형·이동 시뮬이 장르 결정과 충돌", "스케일이 너무 커서", dday §4.1);
no concept has a sprawling authored storyline — narrative is systemic
(reputation routes, campaign bibles, pre-authored short arcs). Verdict:
the list itself remains oral-only; its consequences are everywhere. (Atoms
S1-034, S1-044.)

**Hook 3 — Evidence of "many concepts → merge to 3"?** **Confirmed within
S1.** The corpus shows 8 game concepts plus documented consolidation into
exactly three tracks: blacksmith → apothecary (absorption note dated
2026-07-22, criteria itemized, apothecary 부록 A); agent-roguelike ×
autobattler → agent-arena (brief header: merged per "2026-07-22 결정", no
merged 기획서, demo bakeoff to judge) → renamed darkest-context; placement →
doodle-life (absorption header dated 2026-07-23). Three surviving tracks =
three demos matches OH-1's "3가지 컨셉으로 합치고 3가지 데모 준비". The
"각자 다양한 AI-game concept 준비" step is corroborated by the comparison-
oriented template itself (S1-001). Cross-check against S4's
2026-07-22-concept-review.md recommended (that file mentions 6 concepts
presented; S1 holds 8 concept docs — the count discrepancy is for the S4 miner
to resolve). (Atoms S1-025, S1-029, S1-052.)

**Hook 4 — Was DDAY among the concepts from the start, or a latecomer?**
**Confirmed latecomer.** game-concept-dday-simulation.md is structurally
different from the other concepts: it does not follow the template, opens with
"출발점 — darkest-context의 문제" and "데모를 만들어 보니…" (§1), and its
dated decisions run 07-27/07-28 — after the template-era docs (07-21/22) and
after demo building. Its header records concept confirmation at the
2026-07-28 team meeting. This matches OH-1's sequence "데모 비교 이후 신규
컨셉 논의 → 최종적으로 컨셉 확정": DDAY emerged from the post-demo
new-concept discussion, carrying darkest-context's verified architecture
("의도만 LLM, 실행은 엔진 … 검증된 아키텍처의 승계", §9) rather than starting
from zero. (Atom S1-036.)

**Oral-only remainders after S1:** the genre-preference discussion, the
fun-discovery discussion ("게임은 왜 재밌을까"), and the membrane-agreement
moment itself left no direct trace in `planning/concepts/` — S1 shows only
their residue (the concept set's shape, the invariant-constraints section, the
fun-verification machinery of paper tests and bakeoffs).

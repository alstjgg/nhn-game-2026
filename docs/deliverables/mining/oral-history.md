# Oral history — human-memory sources (slice S10)

Not everything that shaped this project left a file. Decisions from the first
days — before the repo had meeting notes — exist only in the team's memory.
This file records those accounts **verbatim as given** (typos and all; these are
records, not prose), each with provenance and mining annotations. Oral history
ranks *below* written sources when they conflict, but it is the only source for
the pre-repo period and for causal ordering between decisions.

---

## OH-1 — 민서, project timeline by memory

- **Given:** 2026-08-04, in-session, unprompted ("I'm not sure if this helps")
- **Covers:** concept phase, roughly 2026-07-20 → 07-28 (concept confirmed)
- **Nature:** reconstructed from memory after the fact — treat dates/order as
  approximate until corroborated

> TIMELINE by Memory
> # 게임 컨셉 정하기
> - 각자 좋아하는 장르, 만들고 싶은 장르에 대해서 논의
> - 한달이라는 시간, 게임 개발 경험이 없는 것, 디자이너나 게임 엔진 개발자 등이 없는 상황에서 '현실 가능한' 장르나 범위가 무엇인지 논의
> - AI 를 어디에서 써야할까에 대한 논의
>     - 게임 개발 자체에 AI를 쓰는 것은 당여하나, 인게임에도 AI를 넣어야할까?
> # 게임 핵심 재미 발견하기
> - '게임은 왜 재밌을까'에 대한 고민.
> - AI는 어떤 재미를 줄 수 있고, 어떤 부분에서는 재미없음을 줄까에 대한 고민
> # 할 수 있는 것과 하지 못하는 것, 지향과 지양에 대한 논의
> - 할 수 없는 것: 물리 엔진이 필요한 게임. 그래픽이 중요한 게임. 스토리라인이 방대한 게임.
> - 핵심 membrance에 대한 합의: 플레이어와 AI가 직접 소통하는 구조는 절대 피한다. 절대적인 자유도를 줘서는 안된다. -> 닫힌 환경에서의 최대의 자유도, 자유라는 착각, 등에 대한 고민 시작.
> # 컨셉 회의
> - 잠정 합의에 따라, 고민한 내용을 기반으로 다양항 AI-game concept 준비.
> - 컨셉 회의 이후 3가지 컨셉으로 합치고 3가지 데모 준비.
> - 데모 비교 이후 신규 컨셉 논의
> - 최종적으로 컨셉 확정

### What this uniquely adds (not in any repo document, as far as Phase 0 saw)

1. **The membrane rule was a founding agreement, not an emergent design rule.**
   "플레이어와 AI가 직접 소통하는 구조는 절대 피한다" was agreed *before* the
   concepts were written — CLAUDE.md's membrane rule is downstream of this.
2. **Causal provenance of a seed theme:** the timeline states that
   "닫힌 환경에서의 최대의 자유도" and "자유라는 착각" **started from** the
   membrane agreement ("-> ... 고민 시작"). The theme is a consequence of a
   safety/feasibility decision, not an independent aesthetic.
3. **The in-game-AI question was genuinely open.** "게임 개발 자체에 AI를 쓰는
   것은 당연하나, 인게임에도 AI를 넣어야할까?" — using AI to *build* was the
   default; putting AI *in* the game was debated. The lane structure of the
   final deliverable mirrors a real fork in the road.
4. **Scoping was driven by named incapacities:** one month, no game-dev
   experience, no designer, no engine developer → excluded genre space (physics,
   graphics-heavy, sprawling story). The concept set S1 mines is the *residue*
   of these exclusions.
5. **A fun-discovery phase existed as its own step** ("게임은 왜 재밌을까" /
   where AI adds fun vs. where it *removes* fun) — direct ancestor of the seed
   "끝까지 AI가 하지 못하는 것: 재미있나를 판단하는 것".
6. **Process shape of concept selection:** many concepts → merged to 3 → 3
   demos → demo comparison → *new* concept discussion → final confirmation.
   Notably the final concept came *after* comparing demos, via a new-concept
   discussion — check against S1/S4 whether DDAY was one of the original 3
   demos or emerged in that later discussion.

### Phase-1 corroboration hooks

- S1 (`planning/concepts/`, 9 concepts + template) — do the concept docs
  reference the membrane agreement or the exclusion list?
- S4 meetings: `2026-07-22-concept-review.md` (→ merge-to-3?),
  `2026-07-24-demo-mid-check.md` (→ demo comparison?),
  `2026-07-28-dday-concept-confirmed.md` (→ new-concept discussion?).
- S8/S9: `demos/` commit and PR history vs. "3가지 데모 준비".
- Gaps that remain oral-only if uncorroborated: the genre-preference discussion,
  the fun-discovery discussion, the membrane agreement moment itself.

---

## OH-2 — 민서, project timeline by memory (longer revision of OH-1)

- **Given:** 2026-08-05, in-session — the promised longer note, drafted from
  memory to fill gaps documents cannot
- **Covers:** same concept phase as OH-1 (~2026-07-20 → concept confirmed),
  deeper; supersedes OH-1 where they overlap, does not contradict it
- **Nature:** reconstructed from memory; dates/order approximate until
  corroborated. Ranks below written sources on conflict.

> TIMELINE by Memory
> # 게임 컨셉 정하기
> - 각자 좋아하는 장르, 만들고 싶은 장르에 대해서 논의
> - 한달이라는 시간, 게임 개발 경험이 없는 것, 디자이너나 게임 엔진 개발자 등이 없는 상황에서 ‘현실 가능한’ 장르나 범위가 무엇인지 논의
>     - 그래서 물리엔진이 필요한 게임, 그래픽이 중요한 게임은 제외하기로 함.
>     - 또한, 스토리가 중요하거나 스토리가 방대한 장르도 제외
> - AI 를 어디에서 써야할까에 대한 논의
>     - 게임 개발 자체에 AI를 쓰는 것은 당연하나, 인게임에도 AI를 넣어야할까?
>     - 나는 부정적인 편이였다: 회사에서 agent를 개발해서 배포할때도 사람들은 ‘직접 입력’을 거의 쓰지 않고 ‘추천 채팅’만 쓰는 점, 내가 직접 LLM 게임 (uncovering the smoking gun이나 크랙 같은 게임 등)을 플레이했을 때 직접 채팅하는 것이 굉장히 어렵고 재미없다고 느꼈기 때문. 만약 AI를 쓴다면, 레벨 디자인이나 게임 시작 시 애셋 생성 정도에만 쓰고 싶었음.
>     - 그러나 윤석이는 AI를 게임에 넣고 싶어했고, 이에 따라서 합의점으로 도달한 것이 membrane
> # 게임 핵심 재미 발견하기
> - ‘게임은 왜 재밌을까’에 대한 고민.
>     - 스트레스와 스트레스 해소를 통한 카타르시스 제공.
>     - 직관적인 성장의 가시화.
>     - 본인 스킬 레벨 업을 느낄 수 있는 전투 구조.
>     - 선택과 관전.
>     - Cozy.
> - AI는 어떤 재미를 줄 수 있고, 어떤 부분에서는 재미없음을 줄까에 대한 고민
>     - 무엇을 잘할까: 모든 상황에 대해 미리 정의하지 않아도 대응이 가능하다 => 하지만 그렇다고 너무 많은 자유를 주면 예상치 못한 일들이 발생할 수 있음. 이를 어떻게 처리할것인가? 에이전트 가드레일, 또는 플레이어의 접근 금지(레벨 디자인 생성 등에만 사용), 또는 닫힌 환경으로 가는 방식. (최종 컨셉은 1번과 3번 방법을 합친 것)
> # 컨셉 회의
> - 잠정 합의에 따라, 고민한 내용을 기반으로 다양항 AI-game concept 준비.
> - 컨셉 회의 이후 3가지 컨셉으로 합치고 3가지 데모 준비.
> - 데모 비교 이후 신규 컨셉 논의
>     - 왜? 약국은 돌아는 갔으나 잔잔한 장르다보니 재미가 덜하다고 느껴졌고, 다키스트 컨택스트는 재미도 있고 잠재력도 보이나, 다키스트 던전과 너무 유사한 느낌이 들어 컨셉 변경이 불가피했다.
>     - 그래서 다키스트 컨택스트의 게임 코어(플레이어가 prompt injection을 통해 에이전트를 성장시키고, 에이전트가 행동하는 것을 지켜보는 것에서 재미를 느끼는 게임)는 가져가면서, 컨셉만 조금 변경하고자 얘기했음.
>     - 그런데 다키스트 컨택스트의 고민들이, ‘단일 태스크를 해결하는 에이전트 만들기’로 바꾸면 해결되는 것임.
>     - 그래서 다키스트 컨택스트에서 ‘된다’고 검증했던 코어들을 가져오고, 우리가 너무 약했던 그래픽이나 애니메이션 등을 전부 뺀 텍스트 추리형 게임으로 가져가기로 함.
> - 최종적으로 컨셉 확정
> # 주저리주저리
> - 데모까지 나온 3가지 컨셉은 왜 선정되지 않았는지에 대한 얘기도 들어가면 좋을듯. 장점과 단점. 미팅노트에 어느정도 나와있긴 할 듯하지만, 없다면 인터뷰 필요. 데모까지 나온거라 자료도 있고,,, trial and error, discovering phase 정도로 취급?
> - 시장 조사를 은근 많이 했는데, 각 컨셉 문서별로 있던 것으로 기억. 이것도 포함?

### What this uniquely adds (beyond OH-1)

1. **The membrane was a negotiated compromise between two opposed people, not
   a handed-down rule.** 민서 was *against* in-game AI; 윤석 wanted it in the
   game; the membrane is where they met ("합의점으로 도달한 것이 membrane").
   OH-1 called it a founding *agreement* — OH-2 reveals it as a founding
   *settlement* between conflicting instincts. Direct material for #4 (the key
   design decision) and #5 (roles: two directors, different priors).
2. **民서's case against in-game AI is concrete and experiential**, not
   abstract: (a) at work, when agents ship, users lean on "추천 채팅"
   (recommended replies) and almost never on "직접 입력" (free typing); (b)
   playing LLM games (*Uncovering the Smoking Gun*, *Crack*) direct chat felt
   "굉장히 어렵고 재미없다." His fallback preference: AI only for level design /
   start-of-game asset generation. This is lived evidence behind the membrane.
3. **The "illusion of freedom" is the design target, achieved by combining two
   of three named mitigations.** AI's strength = responding without
   pre-defining every case; its danger = too much freedom → unexpected events.
   Three mitigations were on the table — (1) agent guardrails, (2) player
   no-access / AI used only for generation, (3) a closed environment — and the
   final concept = **#1 + #3 combined**. This is the taxonomy the seed theme
   sits on top of, stated in the team's own words.
4. **A concrete "why games are fun" list** predates any concept: catharsis via
   stress→relief, intuitive visualization of growth, combat where you feel your
   own skill leveling, choice-and-spectating, cozy. DDAY's "grow an agent by
   prompt injection and watch it act" descends from *choice-and-spectating*.
5. **The DDAY pivot is now causal and specific.** Apothecary (약국) *worked* but
   its calm genre felt less fun; Darkest-Context was fun with potential but too
   close to Darkest Dungeon, forcing a concept change. The move: keep
   Darkest-Context's *verified* core (grow-agent-by-prompt-injection +
   spectate), and its open problems *dissolved* once reframed as "build an agent
   that solves a single task." Drop the team's weak spots (graphics/animation)
   → a text deduction game → DDAY. This is the single most important
   undocumented decision and it is now on record from memory.
6. **Two inclusion questions 민서 raises for the deliverable** (his own
   "주저리주저리"): (a) the three demoed-but-unpicked concepts deserve a
   pros/cons write-up — treat as the trial-and-error / discovery phase; meeting
   notes may partly cover it, else interview; (b) meaningful **market research**
   was done, remembered as living inside each concept doc — include it?

### Phase-1 corroboration hooks

- **民서-vs-윤석 split on in-game AI** — likely oral-only (concept phase,
  pre-repo). Check S1/S4 for any written trace; if none, it stays OH-only and
  is a prime interview target.
- **Three-mitigation taxonomy (guardrail / no-access / closed-env) and "final =
  #1+#3"** — check S1 concept briefs and S3 mechanism docs for this framing.
- **"single-task agent" reframe as the pivot that solved Darkest-Context's
  problems** — check S3 mechanism and S1 for whether this reasoning is written
  down or oral-only.
- **Apothecary "worked but too calm" / Darkest-Context "too like Darkest
  Dungeon"** demo-evaluation reasoning — check S4 (`2026-07-24-demo-mid-check`)
  and demo PRs; OH-1 hook already flagged demo comparison.
- **Market research per concept doc** — check S1: do the 9 concept briefs carry
  market-research sections? (民서 remembers yes.) Governs inclusion question (b).
- **"Why games are fun" five-item list and AI fun/anti-fun analysis** — check
  S1/S3/S4 for any written version; likely oral-only.

---

## OH-3 — 윤석, project account by memory (independent / blind)

- **Given:** 2026-08-05, in-session. Written from memory **independently** —
  윤석 did *not* read OH-1/OH-2 and was deliberately *not* handed the interview
  prompts, so his recall is uncontaminated. Divergence from 민서's account is
  therefore signal, not error.
- **Covers:** the whole build method, organized by activity —
  대화 / 검증 / 구현 / 재미 (planning · verification · implementation · fun) —
  rather than chronologically. A *process* account; complements 민서's
  chronological OH-1/OH-2.
- **Nature:** reconstructed from memory; ranks below written sources on conflict.

> 1. 대화
> 에이전트는 기획을 정리하고, 스펙을 제안하고, 팀원의 PR을 요약·분석해줬다.
> 게임 기획서도 스펙 명세도 처음 써보는 문서였기 때문에 작성 자체는 에이전트에게 맡겼다. 대신 무엇이 잘 쓴 기획서이고 잘 쓴 스펙인지를 먼저 조사하게 했다 현업에서 통용되는 양식을 근거로 가져오게 한 뒤, 그 위에서 쓰게 했다.
> 나는 의문이 드는 점을 계속 질문하고, 내 의견에 반박을 요구하면서 기획과 스펙을 채워갔다. 그렇게 게임의 기반을 다졌다.
> 앞선 데모 3개의 실패 경험이 있었기 때문에, 빠르게 구현하는 쪽보다 기획 단계에 시간을 더 쓰는 쪽을 택했다. 놓친 게 없는지 꼼꼼히 확인하는 데 시간을 더 할당했다.
>
> 2. 검증
> 실시간성과 반응성은 게임의 큰 재미 요소다.
> 이 게임의 핵심 로직에는 LLM이 실시간으로 상황을 판단해 결정을 내리고, 캐릭터의 대사와 그 근거를 생성하는 부분이 있다.
> LLM이 똑똑하다는 건 모두가 안다. 가장 좋은 모델에 가장 높은 추론을 시키면 정확하고 퀄리티 높은 답을 내놓는다. 하지만 거기서 오는 지연성이 게임의 재미를 반감시킨다. 그래서 계속 고민했다.
> 인프라를 어떻게 구성해야 지연이 줄어드는가? 어떤 모델을 써야 하는가? 가장 가벼운 모델은 빠르겠지만, 프롬프트의 의도대로 동작한 뒤 자연스러운 응답까지 내놓는가?
> 고성능 모델은 항상 좋은 응답을 주는가? 그 지연을 감당할 만큼의 값어치가 있는가? 지연성을 게임의 일부분으로 자연스럽게 풀어낼 수 있을까?
> LLM API의 지연 시간은 질문의 수준과 입출력 토큰에 따라 천차만별이다. 문서를 참조하거나 예측할 수 있는 값이 아니어서, 직접 테스트해보는 수밖에 없었다.
> 데모 버전으로 만든 게임 시나리오와 프롬프트는 그대로 두고, 모델과 추론 강도만 바꿔가며 측정했다. 에이전트가 만든 테스트 환경을 내가 승인했고, 에이전트는 수십에서 수백 번의 런을 자동으로 돌려 결과를 정리해줬다.
> 나는 응답 문장의 퀄리티와 측정된 시간을 함께 보고, 지연과 퀄리티 사이에서 최선이라고 판단되는 모델을 직접 골랐다.
> 에이전트 없이 기획부터 측정, 검증까지 갔다면 일주일은 걸렸을 일을 반나절 만에 결정했다.
>
> 3. 구현
> 잘 작성된 기획서를 바탕으로로 PRD(Product Requirements Document)를 한 번 더 썼다. 에이전트가 잘 이해하도록 요구사항과 산출물, goals, test를 '명확히' 서술하는 문서다.
> 명세는 기능 단위로 10~20개의 세부 작업으로 쪼갰다.
> 코드는 그 명세를 바탕으로 작업 플로우를 정의하고, 서로 영향받지 않는 작업을 병렬로 굴리는 하네스에게 맡겼다. 명세대로 정확히 구현됐는지 판단한 뒤 에이전트 4개가 리뷰를 남기고, 수정과 재검토를 반복한다.
> 이 모든 과정이 git 저장소에 커밋과 PR, 코멘트로 남는다. 에이전트들의 의사결정 과정을 투명하게 확인할 수 있다.
> 에이전트가 백그라운드에서 도는 동안 나는 잠을 자거나 문서 작업을 했다. 유능한 '개발팀'을 고용한 것에 가까운 경험이었다.
>
> 4. 재미
> 이 게임의 첫인상은 그냥 '텍스트 추리게임'이다. 거기에 LLM의 재미를 더했다.
> 플레이어는 게임에서 발견한 사실과 LLM이 써낸 캐릭터의 생각을 근거로, 자기 캐릭터의 다음 행동에 프롬프트를 주입한다. 캐릭터는 그 프롬프트를 바탕으로 다음 행동을 결정한다.
> LLM에게 모든 행동과 판단을 위임하면 자유도가 엄청나게 높아진다. 대신 예상한 스토리라인을 벗어날 수 있고, 할루시네이션이 게임의 개연성을 해칠 수 있다. 그렇다고 LLM을 단순 대사 생성 정도로만 제한하면, 일반 텍스트 추리게임과 다를 게 없어진다.
> 그 합의점을 찾는 데 계속 공을 들였다. 꼼꼼히 설계한 시나리오 게이트를 깔아 에이전트가 그 밖으로 탈출하지는 못하게 하되, 플레이어는 자기가 프롬포팅한 에이전트가 자유롭게 선택하며 스토리를 끌고 간다고 느끼도록 설계했다. 열린 환경과 닫힌 환경이 자연스럽게 이어지도록 만들려고 노력했다.

### What this uniquely adds (not in OH-1/OH-2, or so far any repo doc)

1. **Latency as a first-class design problem (§2) — entirely 윤석's.** Best
   model + highest reasoning = quality, but its latency "재미를 반감시킨다."
   Method: hold the demo scenario+prompts fixed, vary only model + reasoning
   strength, measure; agent builds the test env → human approves it → agent runs
   수십~수백 runs and tabulates → human picks the model on quality×latency
   together. "일주일 걸렸을 일을 반나절 만에 결정했다." This is lane-1 +
   measurement from the operator's chair, and "지연성을 게임의 일부분으로
   자연스럽게 풀어낼 수 있을까" ties directly to CLAUDE.md's latency-hides-in-
   natural-pauses rule.
2. **"Research the standard first, then write on top" (§1).** Made the agent
   pull 현업 통용 양식 for design-doc/spec *before* drafting. Concrete lane-3
   technique for delegating a document type you've never written.
3. **Adversarial working style — "내 의견에 반박을 요구하면서."** The human
   demands rebuttals to his *own* opinions. The distrust spine, from the human
   side, as a deliberate practice.
4. **Demo failures → deliberately front-load planning (§1).** "빠르게 구현하는
   쪽보다 기획 단계에 시간을 더" — the three demo failures bought a process
   lesson that shaped DDAY's slower, spec-first cadence.
5. **Operator's-eye view of the harness (§3):** PRD → 10~20 sub-tasks → parallel
   harness → 4-agent review → transparent git trail; "유능한 '개발팀'을 고용한
   것에 가까운 경험." Corroborates the super-pipeline atoms (S5/S9) from outside
   the machine.

### Cross-account: agreements & divergences vs 민서 (OH-1/OH-2)

- **Strong independent corroboration — the "illusion of freedom" sweet spot.**
  §4 ("플레이어는 … 자유롭게 선택하며 스토리를 끌고 간다고 느끼도록", "열린 환경과
  닫힌 환경이 자연스럽게 이어지도록") independently matches 민서's clarification
  (closed graph + scenario gates; freedom as *designed* illusion). Two narrators,
  no contact, same mechanism → the deliverable's central design claim is
  well-founded, not one person's gloss.
- **Agreement, previously mis-flagged as divergence — the in-game-AI decision.**
  OH-2 calls the membrane a *compromise* (민서 against in-game AI, 윤석 for it);
  OH-3 presents the sweet spot as a shared goal. Logged as a valence divergence
  until 민서 resolved it (OH-4): the two words name one event — "we each wanted
  different things, and met in the middle." Both narrators corroborate the
  settlement. Not a Round-1 question.
- **Oral corrects written — three demos were built.** Both 민서 (OH-2) and 윤석
  (OH-3, "데모 3개의 실패") remember *three* demos; the written record (S1/S4/S8)
  shows only *two* BUILT (apothecary, darkest-context) and records Doodle Life as
  cut pre-build. Resolved by OH-4: Doodle Life *was* built, was never deployed to
  the repo, and survives only as screenshots. The repo is missing the artifact,
  not the narrators the memory. Corrected sequence: three demos built → none won
  → a fourth new concept (DDAY) won. See OH-4 for the corpus consequences.

### Round-1 corroboration hooks (now that three accounts exist)

- in-game-AI valence (compromise vs consensus) — 민서 & 윤석 differ → joint pass.
- "3 demos" vs 2 built — both oral accounts vs the written record.
- latency-measurement story (§2) — check S8 probe/mechanism atoms + the S9b
  latency-budget atoms corroborate the half-day claim and the vary-model-only
  method.
- "research standard format first" (§1) — check S1/S6 for an industry-format-
  grounded design doc / spec.

---

## OH-4 — 민서, resolution of the two OH-3 divergences

- **Given:** 2026-08-05, in-session, in response to the two divergences flagged
  in OH-3's cross-account section. A targeted resolution, not a fresh account.
- **Nature:** the narrator of OH-1/OH-2 reading the divergence list and saying
  what the flags got wrong. Ranks below written sources on conflict — except
  where the written record is silent because an artifact was never committed,
  which is exactly case (2) below.

> On the two divergences in the oral interview; the first one isn't actually a
> divergence. Compromise and consensus means the same thing - when you read my
> story and his, we are both saying the same thing; we each wanted different
> things, and met in the middle.
>
> On the second one: doodle-life was built into a demo, but I don't think it was
> deployed to the repo. Only the screenshots remain, and that is why the miners
> thought that this was a divergence. 3 demos were built, and one new one became
> the winner.

### Resolutions

1. **Divergence 1 is withdrawn — the accounts agree.** "Compromise" (OH-2) and
   "consensus" (OH-3) name the same event from two seats: each wanted something
   different, and they met in the middle. The mining pass read a difference in
   *wording* as a difference in *memory*. The membrane-as-settlement finding is
   therefore corroborated by both narrators, not contested — it moves from "the
   gap is the finding" to the strongest support the oral record can offer.
2. **Divergence 2 resolves in favor of the oral record: three demos were built.**
   Doodle Life *was* built into a demo; it was never deployed to the repo, and
   only screenshots survive. Both narrators were right and the written record is
   incomplete. Corrected sequence: **three demos built → none won → a fourth,
   new concept (DDAY) became the winner.**

### Consequences for the corpus

- **Atom-level correction required.** S8's mining concluded "3 concept tracks but
  only 2 BUILT demos (apothecary, darkest-context); Doodle Life cut pre-build."
  That conclusion is wrong. Per the contradiction rule it is captured, not
  silently overwritten — a `contradiction`-flagged atom is owed against the
  S8/S1/S4 finding, to be written during the pre-Phase-3 sweep.
- **Method finding for deliverable #4.** A repo-mined history cannot see work
  whose artifact was never committed: the absence of Doodle Life from `demos/`
  was read by independent mining agents as evidence the demo never existed. The
  oral channel caught it. This is the concrete argument for why S10 exists, and
  it generalizes — any team auditing itself through its own repo will
  systematically under-count work that never landed.
- **New corpus target: the Doodle Life screenshots** (off-repo). Locate, and
  decide inclusion. If they enter the repo they need `assets-manifest.json`
  entries per hard rule 5. They are the only surviving evidence of a demo the
  deliverable's trial-and-error phase now depends on.
- **OH-2's inclusion question (a) is larger than it looked** — the write-up of
  "the three demoed-but-unpicked concepts" covers three *built* demos, one of
  which the repo cannot evidence.

---

*To add an account: append an OH-n section in the same shape — verbatim block,
provenance, unique-adds, corroboration hooks.*

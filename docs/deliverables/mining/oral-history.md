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

*To add an account: append an OH-n section in the same shape — verbatim block,
provenance, unique-adds, corroboration hooks.*

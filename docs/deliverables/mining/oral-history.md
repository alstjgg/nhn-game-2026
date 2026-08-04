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

*To add an account: append an OH-n section in the same shape — verbatim block,
provenance, unique-adds, corroboration hooks.*

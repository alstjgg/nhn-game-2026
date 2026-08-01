# Project Status

> Single source of truth for mutable project state. Updated freely, any session, any time.
> Rules live in /CLAUDE.md and do not repeat here. Newest information first.

## Status (2026-08-01)

**Phase transition: demo → production.** DDAY is the selected concept (07-28
decision; the demo bake-off is superseded), so the real build happens at the
**repo root** — this supersedes the earlier `demos/dday/` scaffolding plan.
CLAUDE.md updated accordingly (PR #99). Demos stay deployed at `/<slug>/` as
competition history. Work runs as three tracks per
[dday-scenario-pipeline.md](./dday-scenario-pipeline.md): **data (민서)** ·
**architecture (윤석)** · **client (미배정)** — agreement works by document,
not discussion. The physical structure wrapping the layers is bound by
[dday-physical-architecture.md](./dday-physical-architecture.md) — tier split,
constraints, and the §3 repo layout are all in force. The minimal engine now
has a spec: [dday-engine-minimal-spec.md](./dday-engine-minimal-spec.md)
answers the request's five questions and closes call-contract open items
#4 and #5.

## Status (2026-07-30)

**DDAY 기본 메커니즘 확정 — C-BLOCK.** 실제 haiku 호출로 메커니즘 후보를
측정한 결과, 문장 블록 한 줄을 `[알려진 것]`에 주입하면 에이전트의 stance가
`경청 → 공감`으로 9/10 이동했다 (one-sided Fisher `p=0.0000595`). 이것이 게임의
core loop다 — 블록 선택 → 상황 해석 변화 → stance/행동 변화 → 플레이어가 확인.
우선순위 **순서** 조작(C-STRUCT)은 7개 구성·180개 유효 응답에서 목표 방향 효과가
없어 중단했다. **주의: C-BLOCK은 채택됐지만 검증 완료가 아니다** — placebo
control, program-wide negative control, blind coding이 남아 있다. 대외 문구는
"현재 가장 강한 실측 근거를 가진 기본 메커니즘"까지만 쓴다. 프로그램 진입점:
[planning/dday-mechanism/README.md](../planning/dday-mechanism/README.md).

**다음은 측정이 아니라 구현.** 만들 것이 무엇인지는 확정됐다. `demos/dday/`
스캐폴딩과 첫 60초 플레이 루프가 우선이고, 남은 검증 중 게임에 직접 영향을 주는
것은 placebo control 하나다.

## Status (2026-07-29)

**DDAY 컨셉 확정** — the 07-28 team meeting confirmed the D-Day 시뮬레이션 track
(replacing darkest-context as the main line). Scenario: 테러리스트의 전화 **축소
버전**; runtime model: haiku; presentation: text-detective, no spatial movement.
Compact/합성 and prompt-length limits are deferred to Phase-2. Work split
(~07-29 18:30): 윤석 = 기획 문서 (real project spec format), 민서 = 시나리오 축소
+ repo cleanup. **Track SoT: [dday-sot.md](../planning/dday-sot.md)** — start there; it maps
every document, test result, and open decision. Branch `concept/dday-simulation`,
PR #85 open to main.

## Status (2026-07-22)

**Demo phase.** Concept drafting is closed: the 2026-07-22 team meeting consolidated the
6 proposals into 3 tracks. Next, a simple playable demo is built per track under
`demos/<slug>/` (each demo picks its own minimal stack); the final concept is selected by
comparing the demos' plausibility. The repo root is still the engine-agnostic
Vite + TypeScript skeleton — no demo has been scaffolded yet.

## Active tracks

The demo concept tracks are closed — DDAY won. Current tracks are work lanes,
not concepts; owners, questions, and deliverables live in
[dday-scenario-pipeline.md](./dday-scenario-pipeline.md) §1:
**data (민서)** — formats and transformations · **architecture (윤석)** —
wiring and runtime · **client (미배정)** — player-facing surface.

## Next steps (priority order)

1. **Root scaffolding** — physical architecture §3.8 steps 1–2: module folders,
   the three tsconfigs, `build` running `check`, and **verify the Pages deploy
   before anything else lands**. This is the real gate for parallel work:
   `src/shared/` does not exist yet, so the data track's first type definition
   has nowhere to go.
2. Data P0: compile skill + JSON schema validator, with field-level datapack
   types landing in `src/shared/datapack.ts` (the pipeline §3 revision) — plus
   `symptoms.json` and the symptom-coverage lint rule requested by engine spec §6.
3. **Pick one scenario** from the three drafts (team decision). Both the
   hardening pass below and the compile skill need a target, and nine days does
   not fit three.
4. Minimal engine (doubles as the W4 check) + Bedrock production path. Its first
   datapack is **the chosen draft's G1, hand-hardened** — not a synthetic test
   pack. Draft-stage gate cards carry no buckets, deltas, or edge predicates
   (pipeline §3 says hardening fills them), so hardening is the missing step;
   doing it by hand for one gate feeds the engine *and* gives the hardening
   manual its first real use. It does not wait on the compile skill. Engine unit
   fixtures for the §7 criteria live in test code, not in `data/`.
5. First-gate probe (P1), then full-run gameplay measurement (P2).
6. Assign a client-track owner. **Still unassigned and the largest schedule
   risk** — deliverables #1 and #2 depend on it.

## Open TODOs

- Verify the exact submission deadline and video editing rules on the official
  competition page (deadline currently assumed ~2026-08-10).

## Decision log

- 2026-08-01 — **물리 아키텍처 §3 확정 + 최소 엔진 명세 v0.** 레이아웃은 plain
  folder (npm workspaces 미채택) + tsconfig 3벌 — `core`에서 `DOM` lib를 빼서
  isomorphism 제약을 **컴파일 에러로 강제**한다. 프록시는
  `services/apothecary-llm-layer/`의 복제본이며 살아 있는 스택은 건드리지
  않는다. `src/shared/`는 파일로 소유를 가른다(`datapack.ts` 민서 /
  `contracts.ts` 윤석), **타입은 코드가 정본**. 엔진 명세는 요청서 §6의 다섯
  질문에 답하고 계약 v1 미결 #4·#5를 닫는다 — 변수 목록·타임라인 길이·재시도
  예산은 실측 전까지 **잠정**이다. 발견: §2 제약 3(데이터팩의 브라우저 도달)과
  5(`data/` 소재)가 현재 같이 서지 못하며, 빌드타임 복사로 해소했다.
  [물리 아키텍처](./dday-physical-architecture.md) §3 ·
  [엔진 명세](./dday-engine-minimal-spec.md).
- 2026-08-01 — Phase transition declared: demo → production. DDAY is built at the
  repo root (supersedes the `demos/dday/` scaffolding plan); demos remain deployed
  as history. The root's physical layout is owned by the architecture track via
  [docs/dday-physical-architecture.md](./dday-physical-architecture.md) —
  tier split and constraints fixed; §3 layout filled on 08-01 (entry above).
- 2026-07-30 — DDAY 기본 메커니즘은 **C-BLOCK**(문장 블록 주입 → 해석 변화 →
  stance/행동 변화 → 확인 가능한 결과). C-STRUCT(우선순위 순서 재배열) 테스트는
  중단 — 8개 구성·190개 유효 응답 보존, 근거 표본 7개 구성·180개에서 목표 방향
  효과 없음. priority UI는 서사용으로 남길 수 있으나 순서 변경 효과를 약속하지
  않는다. C-STRUCT의 보편적 실패 판정이 아니라 program pause이며, 재개 조건은
  결정문 §6에 고정했다. 근거·한계·실험 계보:
  [MECHANISM-DIRECTION-DECISION.md](../planning/dday-mechanism/MECHANISM-DIRECTION-DECISION.md) ·
  [EVIDENCE](../planning/dday-mechanism/MECHANISM-DIRECTION-EVIDENCE.md).
- 2026-07-30 — 메커니즘 실측 문서 체계를 4단(DECISION / EVIDENCE / HANDOFF /
  RUNLOG)에서 3단(DECISION / EVIDENCE / RUNLOG) + 진입점 README로 통합.
  `CSTRUCT-J1-TEST-HANDOFF.md`는 중단된 계열의 handoff라 대상이 없어졌고,
  유일본이던 실험 계보는 EVIDENCE §5로 흡수했다. **raw artifact(`suites/`,
  `runs/`)와 RUNLOG의 append-only 성질은 손대지 않는다** — 재현성과 사후
  구성 변경 방지가 이 프로그램 신뢰도의 근거다.
- 2026-07-25 — No real-time image generation, in any concept: NPCs (appearance, problems,
  portraits) ship as pre-generated, manifested asset sets; only speech/dialogue text is
  generated at runtime. The runtime LLM layer is therefore single-provider (Bedrock only) —
  no gpt-image-1/OpenAI in deployment; apothecary's portrait endpoint is dev-time tooling.
- 2026-07-25 — LLM backend direction settled: stateless proxy, GitHub Pages → API Gateway →
  Lambda → Bedrock Converse, per `docs/llm-backend-aws-bedrock.md` (PR #48). PR #15's
  `services/agent-arena-api/` merged as a **superseded reference implementation** — kept for
  history and salvage (closed-action validation, contract shapes), never deployed.
- 2026-07-25 — AWS account live and verified: personal account `141840355276`, IAM Identity
  Center (both members), CLI profile `nhn-game`, budget alarms, and both candidate models
  (Haiku 4.5 / Nova 2 Lite) answering real Converse calls via Global inference profiles.
  The common LLM layer is being built **before** the bake-off completes (plumbing is
  concept-agnostic); plan + account state in `docs/handoffs/llm-layer.md`.
- 2026-07-25 — Darkest Context: solo-tile 담당 (1:1 duel, jailbreak) is not player-assigned;
  the party elects one member via the shared council engine at walk-start (volunteer/nominate
  → deterministic engine tally; fallback = highest aptitude stat), then the elected unit's
  first tile judgment pre-fires — two wall-clock calls hidden behind the walk animation.
- 2026-07-25 — Track C renamed **Darkest Context** (slug `darkest-context`); consolidated
  concept spec at `docs/game-concept-darkest-context.md` (merges brief + example spec +
  PR #28 review). Decisions: combat/travel view fixed to DD-style side-scroll; cards
  split 3-way Prompt/Skill/MCP (all implemented as sheet prompts, engine executes
  effects); token stays pure currency (stamina idea rejected); jailbreak stays 담당 1기.
  Next artifact: demo PRD.

- 2026-07-22 — Blacksmith absorption executed: apothecary doc gains 단골 아크 (§5.8),
  [정석]/[실험] 조제 (§5.3), 연쇄 결과 (§5.5), 상태 원장 (§6); economy/능력 격차 and
  world-channel expansion dropped (see apothecary 부록 A). Blacksmith doc marked archive.
- 2026-07-22 — 6 concepts consolidated into 3 tracks: agent-roguelike + autobattler
  combined; apothecary absorbs blacksmith; doodle-lab absorbs placement.
- 2026-07-22 — Final concept chosen via demo bake-off, not on paper. The 기획서 template
  and paper-test workflow are retired; those files stay in `docs/` as unreferenced
  archive, and no merged 기획서 will be written.
- 2026-07-22 — Demo layout: `demos/<slug>/`, each with its own minimal stack; the final
  selected game is built at the repo root.
- 2026-07-22 — All 6 concept proposals (`docs/game-concept-*.md`) completed and merged
  before this meeting.

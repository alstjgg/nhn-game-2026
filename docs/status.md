# Project Status

> Single source of truth for mutable project state. Updated freely, any session, any time.
> Rules live in /CLAUDE.md and do not repeat here. Newest information first.

## Status (2026-07-27)

**Apothecary live-AI integration is ready for review.** An automated local
three-customer playthrough against the deployed API Gateway → Lambda → Bedrock
Nova path reached closing. Both C2/C3 opening responses returned with
`x-llm-fallback=false` and matched the rendered UI. The game makes exactly two
runtime dialogue requests; later dialogue remains authored and portraits use
pre-generated assets. AWS exposes only `/ai/dialogue` and `/ai/health`.
Screenshots and the network trace are in the
[live Lambda test report](./handoffs/apothecary-live-lambda-test-2026-07-26.md).
The remaining production gate is the same full playthrough from the deployed
GitHub Pages site.

## Previous status (2026-07-22)

**Demo phase.** Concept drafting is closed: the 2026-07-22 team meeting consolidated the
6 proposals into 3 tracks. Next, a simple playable demo is built per track under
`demos/<slug>/` (each demo picks its own minimal stack); the final concept is selected by
comparing the demos' plausibility. The repo root is still the engine-agnostic
Vite + TypeScript skeleton — no demo has been scaffolded yet.

## Active tracks

Slugs are provisional — rename freely if the team picks better ones, and record the
change here.

| Track | Demo location | Merged from | Demo state |
|---|---|---|---|
| Darkest Context (구 agent arena) — build an LLM agent party from cards, watch it journey a tile map | `demos/darkest-context/` | [agent-roguelike](./game-concept-agent-roguelike.md) + [autobattler](./game-concept-autobattler.md) → [concept spec](./game-concept-darkest-context.md) | concept spec done; demo not started |
| Apothecary — read what customers *actually* ail from and prescribe | `demos/apothecary/` | [apothecary](./game-concept-apothecary.md), absorbing [blacksmith](./game-concept-blacksmith.md) | playable three-customer demo; C2/C3 opening beats connected to Lambda/Bedrock Nova |
| Doodle Life — read residents' requests and draw living solutions | `demos/doodle-life/` | [doodle-life](./game-concept-doodle-life.md), absorbing [placement](./game-concept-placement.md) | playable full-AI prototype evaluated; redesigning around three bounded generation stages and clue-driven NPC puzzles |

## Next steps (priority order)

1. Review and merge the Lambda/SAM runtime and its operating documentation.
2. Review and merge the Apothecary client integration and Pages configuration.
3. Verify the full-play path from the deployed GitHub Pages browser.
4. Run one deliberate Bedrock-failure full play to retain fallback evidence.
5. Compare the three playable demo tracks and select the final concept.
6. On selection, update `CLAUDE.md` and begin the production build at the repo root.

## Open TODOs

- Verify the exact submission deadline and video editing rules on the official
  competition page (deadline currently assumed ~2026-08-10).
- Confirm final track slugs (current ones are provisional).

## Decision log

- 2026-07-26 — Apothecary runtime scope fixed: Lambda generates exactly the C2
  and C3 opening dialogue beats (two Bedrock calls per full play); later beats
  remain authored. Local testing uses a loopback Vite proxy that supplies the
  exact Pages Origin, while the Pages build receives the public API root through
  `VITE_AI_BASE_URL`. Runtime portraits stay disabled.
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

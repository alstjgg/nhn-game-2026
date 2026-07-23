# Project Status

> Single source of truth for mutable project state. Updated freely, any session, any time.
> Rules live in /CLAUDE.md and do not repeat here. Newest information first.

## Status (2026-07-22)

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
| Agent arena — build an LLM agent from structured items, pit it in auto-battles | `demos/agent-arena/` | [agent-roguelike](./game-concept-agent-roguelike.md) + [autobattler](./game-concept-autobattler.md), combined | not started |
| Apothecary — read what customers *actually* ail from and prescribe | `demos/apothecary/` | [apothecary](./game-concept-apothecary.md), absorbing [blacksmith](./game-concept-blacksmith.md) | not started |
| Doodle Life — read residents' requests and draw living solutions | `demos/doodle-life/` | [doodle-life](./game-concept-doodle-life.md), absorbing [placement](./game-concept-placement.md) | playable full-AI prototype evaluated; redesigning around three bounded generation stages and clue-driven NPC puzzles |

## Next steps (priority order)

1. Scaffold `demos/` — three subdirectories, per-demo stack choice (separate task).
2. Build each demo's core loop to minimally playable.
3. Demo bake-off: compare plausibility, select the final concept.
4. Phase transition: update CLAUDE.md, begin the real build at the repo root.

## Open TODOs

- Verify the exact submission deadline and video editing rules on the official
  competition page (deadline currently assumed ~2026-08-10).
- Confirm final track slugs (current ones are provisional).

## Decision log

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

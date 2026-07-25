# Project Status

> Single source of truth for mutable project state. Updated freely, any session, any time.
> Rules live in /CLAUDE.md and do not repeat here. Newest information first.

## Status (2026-07-24)

**Demo phase — bake-off narrowed to 2 tracks.** The 2026-07-24 mid-check dropped
Doodle Life after playtesting its demo (VLM read latency ~20s, verdict variance on
identical drawings, opaque NPC dialogue, low felt fun). Remaining tracks: **Apothecary**
(demo in progress via super-pipeline) and **Agent Arena** (simplified to a "build-an-agent"
game — no real MCP wiring; examples/Brief must be locked before its PRD + demo). Final
concept selection targeted for 2026-07-25 (at schedule risk — Agent Arena has no demo yet).

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
| Agent arena — build an LLM agent from structured items, pit it in auto-battles | `demos/agent-arena/` | [agent-roguelike](./game-concept-agent-roguelike.md) + [autobattler](./game-concept-autobattler.md), combined | not started — examples/Brief being locked first |
| Apothecary — read what customers *actually* ail from and prescribe | `demos/apothecary/` | [apothecary](./game-concept-apothecary.md), absorbing [blacksmith](./game-concept-blacksmith.md) | in progress (super-pipeline) |

> ~~Doodle Life — read residents' requests and draw living solutions~~ — **cut 2026-07-24**
> from the bake-off (its absorbed [placement](./game-concept-placement.md) concept paused
> too). Demo stays in history as evaluated-and-rejected. Ref:
> [meeting-notes/2026-07-24-demo-mid-check.md](./meeting-notes/2026-07-24-demo-mid-check.md).

## Next steps (priority order)

1. Lock Agent Arena examples (prompt/skill/task/turn-combat) + Brief.
2. Finish Apothecary demo (super-pipeline).
3. Build Agent Arena PRD → super-pipeline play demo.
4. Bake-off: compare Apothecary vs Agent Arena, select final concept (target 2026-07-25).
5. Phase transition: update CLAUDE.md, begin the real build at the repo root.

## Open TODOs

- Verify the exact submission deadline and video editing rules on the official
  competition page (deadline currently assumed ~2026-08-10).
- Confirm final track slugs (current ones are provisional).

## Decision log

- 2026-07-24 — Doodle Life cut from the bake-off (placement absorption paused too);
  focus on Apothecary + Agent Arena. Ref: meeting-notes/2026-07-24-demo-mid-check.md.
- 2026-07-24 — Agent Arena scoped down: no real MCP integration (concept-only as game
  rules), augment-style card picks (not deckbuilding), branching auto-advance map,
  turn-based spectator combat.
- 2026-07-24 — super-pipeline: document structure + PR/Issue/Review trail as methodology
  evidence rather than open-sourcing the full pipeline repo.
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

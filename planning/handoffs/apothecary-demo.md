# Handoff — apothecary demo workstream

> Workstream state for building the apothecary PoC demo via super-pipeline.
> Audience: the next Claude session picking up this workstream. Not project-wide
> state — that stays in `docs/status.md`.

## Status (2026-07-24 — v2)

- **v1 shipped and merged** (run 20260724-145432, PR #17): shell works, all gates green.
- **Playtest verdict (민서): v1 doesn't demo the game** — single-rail choices (paper test
  had many verbs), visible patience bar feels wrong, stubbed AI makes dialogue lifeless,
  and the real engine risk (slow async AI generation of NPCs/portraits) went untested.
- **v2 decisions (2026-07-24):** live LLM dialogue via a Vite dev-middleware proxy
  (keys in `process.env` only; deployed build auto-falls back to stub) · **real image-gen
  API** for NPC portraits with silhouette-entry/waiting-beat/25s-fallback design ·
  diegetic patience (expression tiers, no gauge) · provided asset pack · brownfield run
  on top of v1 (`demos/apothecary/PRD.md` is now the v2 spec).
- Older context below is v1-era; still accurate as history.

## Status (2026-07-23)

- Concept work is **closed**: blacksmith absorption merged to main (PR #12).
- Demo phase decisions made (2026-07-23 session, with 민서):
  - Demo is built by **vanilla super-pipeline** + at most one minimal harness tweak
    (timeboxed ≤1h, see contract). The game-mod P0 spec is NOT implemented for this.
  - Work is split across sessions: **PRD session** (game repo) / **harness-tweak
    session** (`../super-pipeline`) / **pipeline-run session**.
  - Pipeline run starts as soon as the PRD is ready (today/tomorrow), keeping
    Fri 07/24 as buffer for a manual-session fallback. Bake-off Sat 07/25.
  - Scope is **apothecary only** — the other two tracks' demos are handled separately.
- In flight: demo PRD (this workstream's next artifact). Harness tweak can start
  any time — its interface is frozen in [apothecary-demo-contract.md](./apothecary-demo-contract.md).
- Blocked: nothing.

## Read this first

The PoC question is **"can our method (agents directed by us) build this game's
shell?"** — not "is a dialogue box hard to code." Judge output on *reads as a game,
not a form* (cards, transitions, juice), because that is apothecary's real
buildability risk; the loop logic is easy.

The **LLM is stubbed by design** (canned data). AI capability was already validated
in the paper tests — re-proving it here is scope creep. The stub also keeps the demo
deployable with no proxy and no secrets, and the membrane rule (no free-text input
UI) applies even to the stub.

Do not let the PRD smell like the full game. One full loop, hard out-of-scope list.
A PRD that reads like the 기획서 will make the decomposer generate a week of work.

## Active work in priority order

1. **Demo PRD** (PRD session — the 2026-07-23 session, continuing): ~1 page at
   `demos/apothecary/PRD.md`. One full loop: customer appears (portrait + dialogue) →
   structured-verb conversation → crafting UI with ingredient picks + [정석]/[실험]
   declaration → [건네기] → outcome → next customer. Stubbed LLM. Out of scope: real
   LLM calls, content volume, balance tuning, save, audio, game engine.
2. **Harness tweak** (harness session, `../super-pipeline`): make pipeline output
   viewable without pulling branches. Read the contract first; it pins the interface.
   First step is checking whether a wave-end seam exists — if there is no clean plug
   point within the timebox, **cut the tweak and report**, don't force it.
3. **Pipeline run** (run session): feed the PRD to `/super-pipeline`. Log every
   friction ("couldn't see what the agent built", "VERIFY passed but game unplayable")
   — these are the evidence base for the real game-mod build later.
4. **Bake-off** (Sat 07/25, human): compare the three track demos, pick the winner.

## What shipped recently

- 2026-07-23 — PR #12 merged: blacksmith absorbed into apothecary concept doc
  (단골 아크 §5.8, [정석]/[실험] §5.3, 연쇄 결과 §5.5, 상태 원장 §6).
- 2026-07-22 — concept review meeting: 6 concepts → 3 tracks, bake-off decided.

## Deferred / lower priority (with reasons — don't relitigate)

- **super-pipeline game-mod P0** (deploy-verify, playtest agent, PR screenshots):
  deferred until after concept selection. Implementing harness features *and* running
  the first game project through a freshly modified harness on a 2-day critical path
  stacks two unknowns. This demo run doubles as the game-mod's requirements
  discovery, replacing the "Pong on Pages" dry-run in the spec's open questions.
- **기획서 합치기**: already done (PR #12); decision log says no merged 기획서.
- **Other two track demos**: out of this workstream entirely.

## Reference

- Concept: `docs/game-concept-apothecary.md` (부록 A = absorption record)
- Frozen batch interface: `docs/handoffs/apothecary-demo-contract.md`
- Meeting/schedule: `docs/meeting-notes/2026-07-22-concept-review.md`
- Project state: `docs/status.md` · Rules: `/CLAUDE.md`
- Harness: `../super-pipeline` (README, `docs/super-pipeline-architecture.md`)
- Game-mod draft spec: `planning/research/super-pipeline-game-mod.md`

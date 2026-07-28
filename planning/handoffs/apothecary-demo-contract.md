# Contract — apothecary demo batch (FROZEN 2026-07-23)

> Interface spec between the PRD session (game repo) and the harness-tweak session
> (`../super-pipeline`). Frozen for the batch — nobody edits this once both sessions
> are running. Throwaway: delete after the demo run lands. Background/motivation
> lives in [apothecary-demo.md](./apothecary-demo.md), not here.

## Demo build interface

| Fact | Value |
|---|---|
| Demo location | `demos/apothecary/` — self-contained, own `package.json` |
| Stack | Vite + TypeScript + DOM/CSS. No game engine. No runtime LLM calls. |
| Install/build | `npm ci && npm run build` inside `demos/apothecary/` |
| Build output | static site at `demos/apothecary/dist/` (relative asset paths — must work under a subpath) |
| Dev server | `npm run dev` inside `demos/apothecary/` |
| Stub data | canned customers/outcomes as JSON under `demos/apothecary/data/` (balance-as-data rule) |

## Harness tweak: required behavior

- **Input:** a demo directory path (parameter, not hardcoded — `demos/apothecary/` is
  just this batch's value) whose build produces a static `dist/`.
- **Output (either one is acceptable):**
  1. the built demo viewable at a stable URL (e.g. Pages subpath
     `.../nhn-game-2026/demos/apothecary/`), link posted where the human looks
     (dashboard PR), **or**
  2. screenshots of the built demo posted to the dashboard PR.
- **Smoke definition:** page loads, no console errors, root element renders.

## Scope for this batch

- IN: the tweak above, timeboxed ≤1h; cutting it entirely if no clean seam exists.
- OUT: modifying the root Pages deploy behavior for `main` (CLAUDE.md rule 3 —
  root deploy must keep working exactly as-is), the game-mod P0 spec (playtest
  agent, deploy-verify waves), repo-root `src/` changes, real LLM/proxy work.

## Invariants both sessions honor

- Root repo stays engine-agnostic; nothing installed at root for this demo.
- Any generated asset the demo uses gets an `assets-manifest.json` entry (CLAUDE.md rule 5).
- Commits attributed to `alstjgg` personal account; never touch `main` history.

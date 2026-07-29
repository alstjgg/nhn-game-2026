# CLAUDE.md — nhn-game-2026

Guidance for Claude Code sessions working in this repository.

## What this repo is

Competition entry for the **NHN AI Game Competition** (deadline ~2026-08-10). A 2-person team
builds a web game; how we orchestrate AI is judged alongside the game. Read
`docs/competition.md` for the 5 required deliverables — several repo rules below exist
*because of* those requirements.

## Where are we now?

This file holds only permanent rules. For the current phase, active tracks, and next
steps, read `docs/status.md` **before starting any work** — it is the single source of
truth for project state and is updated freely. CLAUDE.md itself changes only at phase
transitions (planning → demo → production).

## Hard rules

1. **Git identity:** commits must be attributed to personal accounts (repo owner: `alstjgg`),
   never corporate identities. Check `git config user.email` (repo-local) before committing — it
   should resolve to the `alstjgg` account (e.g. its GitHub noreply address), not a corporate one.
2. **Never rewrite `main` history.** Commit history is a competition deliverable. No force-push,
   no rebase of pushed commits, no history rewrites.
3. **`main` stays deployable.** Every merge to `main` triggers the GitHub Pages deploy
   (`.github/workflows/deploy.yml`). If the live site
   (https://alstjgg.github.io/nhn-game-2026/) breaks, fixing it takes priority over everything.
4. **`.claude/super/` is gitignored** (super-pipeline runtime state). Never commit it.
5. **Every external or AI-generated asset** (image, sound, font, etc.) gets an entry in
   `assets-manifest.json`: `{file, source/tool, prompt (if generated), license}`. This feeds a
   mandatory competition document. No exceptions, no "add it later".
6. **No secrets in the repo.** LLM API keys etc. live in env vars / the (future) proxy server.

## Design constraints that affect code

- **Demo phase structure:** three concept demos live under `demos/<slug>/`, each free
  to choose its own minimal stack. The repo root remains the engine-agnostic skeleton;
  the final selected game will be built at the root after the demo bake-off. Do not
  install game engines or frameworks at the root during the demo phase.
- **The membrane rule:** the player never types free-text to an LLM. All LLM input is composed
  from structured game elements (blocks/cards/items/telemetry). Do not build text-input UI for
  AI features. Prompt-injection "combat" is not an exception: those attacks are performed by the
  **agent the player built**, not by the player typing — the player shapes the agent from
  structured items, and the agent acts. The membrane holds.
- **Runtime LLM calls** (when they arrive) go through a proxy backend (Member B's lane), never
  directly from the client with an embedded key. Latency must hide in natural game pauses
  (between rounds/waves) — never block mid-action gameplay on an LLM response.
- **Balance-as-data:** all tunables (stats, timings, costs, spawn tables) live in `data/` as
  JSON/TS data, never inline in logic.
- **Judge experience is the optimization target:** page must load in ~1s on mediocre wifi;
  first 60 seconds of play must carry the game (video limit is 30–60s; judges play minutes,
  not hours).

## Development method

Primary development runs through **super-pipeline**, a multi-agent harness kept in a **separate
repo cloned alongside this one** (a sibling directory, e.g. `../super-pipeline`): PRD → decompose
→ parallel agents in git worktrees → PR review panels → loop-until-green. Game-specific
extensions are specced in `docs/super-pipeline-game-mod.md` (P0: deploy-verify step, playtest
agent, screenshots/GIFs on unit PRs). Manual Claude Code sessions handle setup, docs, and
anything the harness isn't suited for.

## Layout

```
src/            game source (placeholder render loop for now)
demos/          playable demos, own stacks — each deployed at /<slug>/ by the Pages workflow
planning/       planning-phase archive (concepts, scenarios, paper tests, meetings) — see planning/README.md
services/       superseded reference implementations (agent-arena-api · apothecary-llm-layer)
public/assets/  static assets (each one manifested — see rule 5)
data/           balance-as-data
docs/           living docs — project status, competition requirements, deliverable drafts
.github/        Pages deploy workflow
```

## Commands

```bash
npm run dev      # local dev server
npm run build    # tsc + vite build → dist/
npm run preview  # preview production build
```

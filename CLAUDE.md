# CLAUDE.md — nhn-game-2026

Guidance for Claude Code sessions working in this repository.

## What this repo is

Competition entry for the **NHN AI Game Competition** (deadline ~2026-08-10). A 2-person team
builds a web game; how we orchestrate AI is judged alongside the game. Read
`docs/competition.md` for the 5 required deliverables — several repo rules below exist
*because of* those requirements.

## Current phase

**Concept selection.** Genre/engine are NOT chosen yet. The repo is an engine-agnostic
Vite + TypeScript skeleton whose only job is proving the deploy pipeline. Do not install a game
engine or build gameplay until the concept is locked (target: 2026-07-25). A leading concept
draft exists — `docs/game-concept-agent-roguelike.md` ("Agent Ascension") — but it is not locked;
treat it as a candidate, not a commitment.

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

- **The membrane rule:** the player never types free-text to an LLM. All LLM input is composed
  from structured game elements (blocks/cards/items/telemetry). Do not build text-input UI for
  AI features.
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
public/assets/  static assets (each one manifested — see rule 5)
data/           balance-as-data
docs/           competition requirements + design docs + deliverable drafts
.github/        Pages deploy workflow
```

## Commands

```bash
npm run dev      # local dev server
npm run build    # tsc + vite build → dist/
npm run preview  # preview production build
```

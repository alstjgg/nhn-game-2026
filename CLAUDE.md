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

- **Four roots, four jobs.** `src/` is what the bundle ships; `proxy/` is a
  separately-deployed tier that may not import `src/`; `tools/` is Node-only and
  never reachable from `index.html`; `authoring/` runs before any of them exist. Experiment vocabulary (arm, channel,
  placebo, harness) belongs to `tools/probe/` and nowhere else.
- **Production phase structure:** the selected game (**DDAY**) is built at the repo
  root. The demos under `demos/<slug>/` are competition history — they stay deployed
  at `/<slug>/` by the Pages workflow but are not extended. The root's physical
  layout (module boundaries under `src/`, where Node-side tools and the proxy live)
  is bound by `docs/spec-physical-architecture.md`; do not restructure the root
  ahead of that document.
- **The membrane rule:** the player never types free-text to an LLM. All LLM input is composed
  from structured game elements (blocks/cards/items/telemetry). Do not build text-input UI for
  AI features. Prompt-injection "combat" is not an exception: those attacks are performed by the
  **agent the player built**, not by the player typing — the player shapes the agent from
  structured items, and the agent acts. The membrane holds.
- **Runtime LLM calls** (when they arrive) go through a proxy backend (Member B's lane), never
  directly from the client with an embedded key. Latency must hide in natural game pauses
  (between rounds/waves) — never block mid-action gameplay on an LLM response.
- **Balance-as-data:** all tunables (stats, timings, costs, spawn tables) live in `data/` as
  JSON/TS data, never inline in logic. `data/` holds inputs; `artifacts/` holds measurement outputs.
- **Judge experience is the optimization target:** page must load in ~1s on mediocre wifi;
  first 60 seconds of play must carry the game (video limit is 30–60s; judges play minutes,
  not hours).

## Development method

Primary development runs through **super-pipeline**, a multi-agent harness kept in a **separate
repo cloned alongside this one** (a sibling directory, e.g. `../super-pipeline`): PRD → decompose
→ parallel agents in git worktrees → PR review panels → loop-until-green. Game-specific
extensions (deploy-verify step, gameplay capture, game-feel lens, frozen-inputs guard,
AI-utilization auto-draft) are implemented in that repo; their design record is archived at
`planning/research/super-pipeline-game-mod.md`. Manual Claude Code sessions handle setup, docs,
and anything the harness isn't suited for.

## Commands

Standard Vite/npm scripts (`dev`, `build`, `preview`, `check`) are in `package.json`.
The non-obvious ones:

```bash
npm run datapack:compile -- <draft.md>        # authoring stage 1
npm run datapack:lint -- data/scenario/<slug> # authoring stage 2
npm run probe:selftest                        # probe runner, offline, no key
npm run probe -- <suite.json> --dry-run       # probe runner, no charge
```

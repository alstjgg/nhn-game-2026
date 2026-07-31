# DDAY Physical Architecture

> **Status:** skeleton. §1–§2 (the tier split and the constraints) are in force;
> §3 (the repo layout) is unfilled and **owned by 윤석 (architecture track)**.
> Per the pipeline's working rule, this document *is* the agreement: the owner
> fills and revises §3 by revision, and the other tracks build against what it
> says — no meeting required.
> Neighbors: [scenario pipeline](./dday-scenario-pipeline.md) ·
> [engine spec](./dday-engine-minimal-request.md) ·
> [call contracts](./dday-call-contracts.md) ·
> [architecture spec](./dday-architecture-spec.md).

## 1. The two tiers

At runtime, code executes in exactly two places. There is no third tier: no
database, no game server, no server-side session state.

| Tier | Host | Runs |
|---|---|---|
| **Static bundle** | GitHub Pages (built by `.github/workflows/deploy.yml`) | client UI · state engine · payload composer · datapacks fetched as static JSON · between-run meta-state in `localStorage` |
| **LLM proxy** | Lambda (API Gateway → Bedrock Converse) | the three call types; holds the only secret (the API key) |

## 2. Constraints in force

Whatever layout §3 chooses must preserve these:

1. **The engine is isomorphic.** The same engine module runs in the browser
   (play) and headless in Node (full-run driver, policy-bot runner, suite
   generator — pipeline stages 4–6). No DOM imports anywhere in engine code.
   The payload composer has the same requirement — the Node driver composes
   the same payloads the client does.
2. **No secrets in the bundle** (CLAUDE.md rule 6). The client composes call
   payloads but never holds a key; only the proxy signs and forwards.
3. **The datapack ships to the browser.** `truths.json` is readable in
   devtools. This is an accepted property of the static architecture — no
   design may assume server-side secrecy of scenario data.
4. **`deploy.yml` is the wrapper and it stays.** Root build + auto-discovered
   demo subpath builds. The game grows inside it; the workflow itself does not
   change for the DDAY build.
5. **Datapacks live at `data/scenario/<slug>/`** (pipeline §3) — balance-as-data,
   never inline in logic.

## 3. Repo layout — owner: 윤석, to fill

To be decided here: module boundaries under `src/`, plain folders vs npm
workspaces, where the Node-side drivers and pipeline tools live, and where the
production proxy lives (a new `services/` entry? reusing the
`apothecary-llm-layer` SAM pattern?).

Non-binding starting sketch — replace freely:

```
src/engine/      pure TS, deterministic — no DOM; consumed by client AND Node drivers
src/composer/    payload composer (same purity requirement)
src/client/      Vite app — UI shell over the engine
src/shared/      datapack types / JSON schema (the compile validator builds against this)
data/scenario/   datapacks, one per slug
tools/           compile · lint · suite generator · full-run driver · policy-bot runner
services/<name>/ Lambda proxy (SAM)
```

## 4. Out of scope

Engine internals (engine spec) · call semantics (call contracts) · channel
invariants (architecture spec) · data formats and transformations (pipeline
§2–§3). This document binds only *where things physically live and run*.

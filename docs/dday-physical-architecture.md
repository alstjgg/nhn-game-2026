# DDAY Physical Architecture

> **Status:** §1–§2 (the tier split and the constraints) are in force; §3 (the
> repo layout) is a **draft v0 owned by 윤석 (architecture track)**, binding on
> merge.
> Per the pipeline's working rule, this document *is* the agreement: the owner
> fills and revises §3 by revision, and the other tracks build against what it
> says — no meeting required.
> Neighbors: [scenario pipeline](./dday-scenario-pipeline.md) ·
> [engine spec](./dday-engine-minimal-spec.md) ·
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

## 3. Repo layout — owner: 윤석

> **Status: draft v0.** Binding once merged; revised by revision like everything
> else. §3.7 records one constraint pair that does not yet stand up, and §3.10
> is the only part with an execution order attached.

### 3.1 The layout

```
src/
  shared/      datapack + call-contract types (transcriptions) ← no DOM, no fs
  engine/      state machine: delta → bucket → edge, journal ← no DOM, no fs
  composer/    datapack + state + blocks → call slots        ← no DOM, no fs
  client/      Vite app — the only place DOM exists
  main.ts      browser entry (referenced by index.html)
data/scenario/<slug>/     datapacks (balance-as-data, §2 constraint 5)
tools/                    Node-only: compile · lint · suite-gen · run driver · policy bot
infra/test-harness/       existing probe harness — unchanged, stays put
services/dday-llm-proxy/  Lambda proxy (SAM) — own package.json, own workflow
public/assets/            static assets (each manifested)
```

Dependency direction is one-way and total:

```
client  →  composer  →  engine  →  shared
tools   →  composer  →  engine  →  shared
```

`shared` imports nothing of ours. `engine` never imports `composer` or
`client`. Nothing imports `client`. A cycle here is a layering bug, not a
style question.

**`src/shared/` is the only folder both tracks write to.** Split it by file,
along the line the pipeline already draws (§1: data formats → 민서, call
contracts → 윤석):

| File | Owner | Holds | Transcribes |
|---|---|---|---|
| `src/shared/datapack.ts` | 민서 (data) | datapack types | `data/scenario/_schema/*.schema.json` |
| `src/shared/contracts.ts` | 윤석 (architecture) | the three calls' payload and response types | [call contracts v1](./dday-call-contracts.md) |

**Normative lives in the artifact that can enforce itself.** Neither file is a
source of truth; both are transcriptions, and each carries a header pointer to
what it transcribes. If a transcription disagrees with its source, one of the
two is a bug — the same rule already in force for `contracts.ts`.

For the datapack that artifact is **JSON Schema, not TypeScript** (pipeline §3:
"this table is the map, the schemas are the law"). A TS type is erased at
runtime — it *describes* JSON but cannot *check* it, so code reading a pack
through `datapack.ts` would simply be trusting the data. Packs must be
validated where neither an engine nor a TS build exists yet: the compile and
lint stages in `tools/`, before anything loads them. Data-contract rules like
"≥2 key examples per condition" or `^G[0-9]+$` have no TS expression at all.

The cost of this arrangement is drift between schema and transcription, and it
is paid structurally rather than by review: `datapack.ts` is **generated**
from the schemas by `infra/scenario-pipeline/generate-datapack-types.mjs`
(zero deps, deterministic; `--check` exits non-zero on drift, CI-able). A
generated transcription cannot disagree with its source — the gap named here
in the previous revision is closed (08-02). Constraints TS cannot express
(patterns, item minimums, non-zero deltas) stay in the schemas and in the
lint stage, which is why the schemas remain the law.

### 3.2 What each boundary forbids

| Module | Runs in | Forbidden |
|---|---|---|
| `shared` | both | everything but types and pure data helpers |
| `engine` | browser **and** Node | DOM, `fs`, `fetch`, timers, randomness, reading files |
| `composer` | browser **and** Node | same as engine |
| `client` | browser only | being imported by anything else |
| `tools` | Node only | being reachable from `index.html` |

**The engine never reads a file.** Datapacks arrive as already-parsed objects.
Loading is host-specific (`fetch` in the browser, `fs` in Node), so it lives in
`client` and `tools` respectively — never inside the isomorphic core. This is
what makes §2 constraint 1 achievable rather than aspirational: there is no
seam where a file read could sneak in.

### 3.3 Plain folders, not npm workspaces

One root `package.json`. Reasons, in order of weight:

1. `deploy.yml` runs `npm ci && npm run build` at the root and **must not
   change** (§2 constraint 4). Workspaces put hoisting, lockfile, and CI-cache
   behavior between that command and a working build, for no gain here.
2. The isolation we actually need is *"engine must not touch DOM"*, and a
   package boundary does not enforce that — TypeScript does (§3.4). We would
   be paying workspace overhead for a guarantee it cannot give.
3. `services/dday-llm-proxy/` is a separate deployment tier with its own
   dependency tree and its own workflow. It stays **outside** the root install
   entirely, exactly as `services/apothecary-llm-layer/` already does.

Cross-module imports are therefore **relative paths** (`../engine/state.ts`).

⚠️ **Do not add tsconfig `paths` aliases.** Node's type stripping (§3.5) does
not read `tsconfig.json`, so an alias that resolves in Vite fails the moment a
`tools/` script imports through it — and it fails at run time, in the headless
driver, not at build. If the relative paths become unbearable, the one option
that works in *both* hosts is the `imports` field in `package.json` (`#engine/*`
subpath imports), which Node resolves natively. Reach for that, never `paths`.

### 3.4 Isolation is enforced by the compiler, not by discipline

Three tsconfigs. The load-bearing one is `tsconfig.core.json`, which omits
`DOM` from `lib` — so `document`, `window`, and `fetch` fail to resolve inside
`engine`/`composer`/`shared`. §2 constraint 1 becomes a compile error instead
of a review comment.

| File | `include` | `lib` | Purpose |
|---|---|---|---|
| `tsconfig.core.json` | `src/shared`, `src/engine`, `src/composer` | `ES2023` — **no DOM** | enforces isomorphism |
| `tsconfig.json` (existing) | `src` | `ES2023`, `DOM` | client build |
| `tsconfig.tools.json` | `tools` | `ES2023` + `@types/node` | Node-side tools |

```jsonc
// package.json
"check": "tsc -p tsconfig.core.json && tsc -p tsconfig.tools.json && tsc",
"build": "npm run check && vite build"
```

`deploy.yml` still calls `npm run build` and is untouched.

### 3.5 Node-side tools run TypeScript directly — no build step

`tools/` and the full-run driver import the same `src/engine` the browser
does, and run under Node's native type stripping (`node tools/drive-run.ts`).
No bundling, no compile-to-`dist`, no second copy of the engine that can drift.

The root `tsconfig.json` **already** has both flags this requires:
`erasableSyntaxOnly: true` (no `enum`/`namespace`/parameter properties — the
constructs type stripping cannot erase) and `allowImportingTsExtensions: true`
(imports carry `.ts`, which Node's ESM resolver needs). Nothing to change; the
constraint is already in force and should be treated as load-bearing rather
than incidental.

Requires Node ≥ 22.18 for tool execution. Pages builds are unaffected — the
deploy job only runs `npm run build`.

### 3.6 The proxy lives at `services/dday-llm-proxy/`

**Start it as a copy of `services/apothecary-llm-layer/`, then edit the copy.**
Not written from scratch, and not an edit to the original: that stack is
deployed and live under a different route contract (`POST /ai/dialogue`), and
DDAY needs the three call types of
[call contracts](./dday-call-contracts.md) plus a different model. Two
contracts in one function is how a live deliverable breaks — the copy exists so
the working one is never at risk.

| Keep as-is | Replace |
|---|---|
| `src/config.ts`, `src/errors.ts` | `src/dialogue-*` → the three call types |
| handler skeleton: Origin / content-type / body-size checks | route table → the DDAY call routes |
| `scripts/aws-preflight.mjs`, `scripts/bundle-smoke.cjs` | `data/apothecary.ts` (delete — no registry here) |
| `deploy/`, `samconfig.toml` shape, stack policy | `ModelId` → the haiku global profile (spec §4 binds haiku; the apothecary default is `nova-2-lite`) |
| the smoke-test shape and its acceptance rules | stack name, API, log groups — all new physical resources |

- New application stack; **reuse** the existing bootstrap stack (OIDC provider,
  deploy roles, artifact bucket) rather than standing up a second one.
- `services/` is invisible to `deploy.yml` (it globs `demos/*/` and the root
  only), so nothing here can break Pages.

### 3.7 ⚠️ Datapacks do not currently reach the browser

§2 constraint 3 says the datapack ships to the browser; constraint 5 puts it at
`data/scenario/<slug>/`. **Those two do not stand up together today.** Vite
serves `public/` only, and `data/` is outside it, so nothing copies it into
`dist/`. Nobody has hit this because no datapack exists yet.

Resolution taken here: a **build-time copy** — a small `closeBundle` plugin in
`vite.config.ts` copies `data/` into `dist/data/`. Constraint 5 keeps the
authored location, constraint 3 gets satisfied, `deploy.yml` stays untouched,
and the client fetches `${import.meta.env.BASE_URL}data/scenario/<slug>/…` —
matching §1's "datapacks fetched as static JSON".

Rejected: moving datapacks under `public/` (breaks constraint 5 and puts
authored data in the asset tree); `import.meta.glob` static import (bundles the
pack into JS, so a data-only change forces a full rebundle and the pack stops
being fetchable as data).

### 3.8 Migration order

The root is still the placeholder Vite skeleton (`src/main.ts` + `style.css`).
Steps 1–2 are prerequisites for anyone building against this document.

1. Create `src/{shared,engine,composer,client}/`; move the placeholder render
   loop into `src/client/` so `main.ts` is a two-line entry.
2. Add `tsconfig.core.json` + `tsconfig.tools.json`; switch `build` to run
   `check` first. **Verify Pages still deploys before anything else lands.**
3. Add the `data/` copy plugin (§3.7).
4. `tools/` and `services/dday-llm-proxy/` as their work starts.

`infra/test-harness/` does not move. It is `.mjs`, has no dependency on `src/`,
and its recorded artifacts are reproducibility evidence — relocating it buys
nothing and costs provenance.

### 3.9 Left open

- **Where the run-loop manager's between-run state is written.** §1 says
  `localStorage`; whether `tools/` mirrors it to disk for headless multi-run
  measurement is the run-loop manager's own design decision.
- **Whether `src/client/` subdivides.** Deliberately unbound — the client track
  has no owner yet, and its internal structure is that owner's to set. The only
  binding constraint is the arrow direction in §3.1.

## 4. Out of scope

Engine internals (engine spec) · call semantics (call contracts) · channel
invariants (architecture spec) · data formats and transformations (pipeline
§2–§3). This document binds only *where things physically live and run*.

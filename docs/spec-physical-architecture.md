# DDAY Physical Architecture

> **Status:** §1–§2 (the tier split and the constraints) are in force; §3 (the
> repo layout) is a **draft v0 owned by 윤석 (architecture track)**, binding on
> merge.
> Per the pipeline's working rule, this document *is* the agreement: the owner
> fills and revises §3 by revision, and the other tracks build against what it
> says — no meeting required.
> Neighbors: [scenario pipeline](./plan-pipeline.md) ·
> [engine spec](./spec-engine.md) ·
> [call contracts](./contract-calls.md) ·
> [architecture spec](./spec-architecture.md).

## 1. The two tiers

At runtime, code executes in exactly two places. There is no third tier: no
database, no game server, no server-side session state.

| Tier | Host | Runs |
|---|---|---|
| **Static bundle** | GitHub Pages (built by `.github/workflows/deploy.yml`) | client UI · state engine · payload composer · datapacks fetched as static JSON · between-run meta-state in `sessionStorage` (§1.1) |
| **LLM proxy** | Lambda (API Gateway → Bedrock Converse) | the three call types; holds the only secret (the API key) |

### 1.1 ✅ Meta-state lives in `sessionStorage` (decided 08-03)

This table used to say `localStorage` while
[game design §6](./plan-game-design.md) said "no persistence — session-only;
refresh resets". Both documents are mine, so the contradiction was mine to
close rather than a question for the client track.

`sessionStorage` is what both lines were actually protecting:

- **It survives a refresh.** Meta-state is the multi-run loop itself — run
  counter, report archive, carried blocks. Losing it to a stray F5 does not
  reset a session, it destroys the game's spine mid-play. That is what the
  `localStorage` line was for.
- **It dies with the tab.** Every judge starts clean. `localStorage` would
  drop a returning judge into someone else's run 4, which breaks the
  "the demo opens on run 3" staging outright — and the judge's first 60
  seconds is the optimization target (CLAUDE.md).

Consequence for the client: [spec-client](./spec-client.md) §7 #8 can bind
instead of absorbing either outcome, and the view layer no longer has to
stay memory-only.

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
src/                      the browser bundle + the isomorphic core
  shared/      datapack + call-contract + seam types, pure renderers ← no DOM, no fs
  engine/      state machine: delta → bucket → edge, journal ← no DOM, no fs
  composer/    engine views + blocks → call slots            ← no DOM, no fs
  transport/   CallRequest → the proxy over HTTP             ← no DOM, no fs
  driver/      binds engine + composer + transport; emits ViewEvent ← no DOM, no fs
  runloop/     multi-run shell; meta-state behind an adapter ← no DOM, no fs
  client/      Vite app — the only place DOM exists
  main.ts      browser entry (referenced by index.html)

authoring/                authoring-time preprocessing (data track, 민서):
                          compile · lint · datapack-type generation
tools/                    Node-only executables (architecture track, 윤석)
  lib/         calls · compose · prompts · transport — probe and driver share these
  probe/       the measurement program: suites, arms, channels, artifacts
  driver/      drive-beat → the full-run driver

proxy/                    the LLM tier — Lambda (SAM), outside the root install
  prompts/<call>/         BOTH message layers; neither enters the bundle (§3.10)
  src/                    handler · renderer · call schemas · Bedrock provider

data/                     INPUTS only — copied into dist/ at build time (§3.7)
  scenario/<slug>/        datapacks (balance-as-data, §2 constraint 5)
  policy/                 report guidance, gameplay policies
artifacts/                OUTPUTS — headless run records + metric reports (§3.9)
public/assets/            static assets (each manifested)
```

Dependency direction is one-way and total:

```
client     →  driver  →  composer  →  engine  →  shared
tools      →  driver  →  composer  →  engine  →  shared
runloop    →  driver                          →  shared
driver     →  transport                       →  shared
authoring  →  (nothing of ours; it runs before the rest exists)
proxy      →  (nothing of ours; a separate tier, reached over HTTP)
```

`authoring/` is separated from `tools/` on the *when*, not the *who*: it runs
before there is an engine, a TypeScript build, or a browser, which is exactly
why the datapack's law is JSON Schema (below) rather than a TS type. `tools/`
imports `src/` and executes the game's own code paths; `authoring/` may not.

**Six isomorphic folders, one DOM folder.** `transport`, `driver` and `runloop`
joined the no-DOM set on 08-03: the headless full-run driver and the policy bot
need all three, and physical §2 constraint 1 already required that the same
modules run in both hosts. Putting the live driver inside `src/client/` instead
would make it unreachable from `tools/` — "nothing imports `client`" — and force
a second engine+composer binding for headless runs. That is the drift the
prompt-parity test exists to prevent elsewhere, and it is not worth acquiring
here. `src/client/driver/` keeps the **fixture** driver and wires to
`src/driver/` in live mode.

**Experiment vocabulary is confined to `tools/probe/`.** "Arm", "channel",
"pre-registration", "placebo", "harness" are the measurement program's words.
They do not appear in `src/`, `proxy/`, or `tools/{lib,driver}/` — the
production composer composes one payload for one beat and has no second arm to
compare it against.

`shared` imports nothing of ours. `engine` never imports `composer` or
`client`. Nothing imports `client`. A cycle here is a layering bug, not a
style question.

**`src/shared/` is the only folder both tracks write to.** Split it by file,
along the line the pipeline already draws (§1: data formats → 민서, call
contracts → 윤석):

| File | Owner | Holds | Transcribes |
|---|---|---|---|
| `src/shared/datapack.ts` | 민서 (data) | datapack types | `data/scenario/_schema/*.schema.json` |
| `src/shared/contracts.ts` | 윤석 (architecture) | the three calls' payload and response types | [call contracts v1](./contract-calls.md) |

**Normative lives in the artifact that can enforce itself.** Neither file is a
source of truth; both are transcriptions, and each carries a header pointer to
what it transcribes. If a transcription disagrees with its source, one of the
two is a bug — the same rule already in force for `contracts.ts`.

For the datapack that artifact is **JSON Schema, not TypeScript** (pipeline §3:
"this table is the map, the schemas are the law"). A TS type is erased at
runtime — it *describes* JSON but cannot *check* it, so code reading a pack
through `datapack.ts` would simply be trusting the data. Packs must be
validated where neither an engine nor a TS build exists yet: the compile and
lint stages in `authoring/`, before anything loads them. Data-contract rules like
"≥2 key examples per condition" or `^G[0-9]+$` have no TS expression at all.

The cost of this arrangement is drift between schema and transcription, and it
is paid structurally rather than by review: `datapack.ts` is **generated**
from the schemas by `authoring/generate-datapack-types.mjs`
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
| `tools` | Node only | being reachable from `index.html`; importing `services` |
| `authoring` | Node only | importing anything of ours — it predates all of it |
| `proxy` | its own tier | importing `src`; entering the root `npm ci` |

**The engine never reads a file.** Datapacks arrive as already-parsed objects.
Loading is host-specific (`fetch` in the browser, `fs` in Node), so it lives in
`client` and `tools` respectively — never inside the isomorphic core. This is
what makes §2 constraint 1 achievable rather than aspirational: there is no
seam where a file read could sneak in.

**The same rule governs prompt templates.** The user layer is authored content
the *host* loads and hands to the composer as a string — `fetch` in the browser,
`fs` in `tools/lib/prompts.mjs` — which is why it lives under `data/` and not
beside the composer. A `?raw` import would resolve under Vite and fail at run
time under Node's type stripping, the same trap §3.3 flags for `paths` aliases.
The system layer is not loaded by the composer at all: it belongs to the proxy
(§3.6).

### 3.3 Plain folders, not npm workspaces

One root `package.json`. Reasons, in order of weight:

1. `deploy.yml` runs `npm ci && npm run build` at the root and **must not
   change** (§2 constraint 4). Workspaces put hoisting, lockfile, and CI-cache
   behavior between that command and a working build, for no gain here.
2. The isolation we actually need is *"engine must not touch DOM"*, and a
   package boundary does not enforce that — TypeScript does (§3.4). We would
   be paying workspace overhead for a guarantee it cannot give.
3. `proxy/` is a separate deployment tier with its own
   dependency tree and its own workflow. It stays **outside** the root install
   entirely, exactly as `planning/legacy-services/apothecary-llm-layer/` already does.

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
| `tsconfig.core.json` | `src/shared`, `src/engine`, `src/composer`, `src/transport`, `src/driver`, `src/runloop` | `ES2023` — **no DOM** | enforces isomorphism |
| `tsconfig.json` (existing) | `src` | `ES2023`, `DOM` | client build |
| `tsconfig.tools.json` | `tools` | `ES2023` + `@types/node` | Node-side tools — **not yet created** |

```jsonc
// package.json — current
"check": "tsc -p tsconfig.core.json && tsc && npm run datapack:check",
"build": "npm run check && vite build"
```

`tsconfig.tools.json` is deferred, not dropped: `tools/` is `.mjs` today and a
tsconfig with no inputs is a build error, so it lands with the first `.ts` file
under `tools/` (the full-run driver, once it imports the engine). What `check`
gained instead is the datapack type-drift gate, which had been runnable but
unwired.

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

### 3.6 The proxy lives at `proxy/`

**Start it as a copy of `planning/legacy-services/apothecary-llm-layer/`, then edit the copy.**
Not written from scratch, and not an edit to the original: that stack is
deployed and live under a different route contract (`POST /ai/dialogue`), and
DDAY needs the three call types of
[call contracts](./contract-calls.md) plus a different model. Two
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
- `proxy/` is invisible to `deploy.yml` (it globs `demos/*/` and the root
  only), so nothing here can break Pages.

**Correction (08-03): one route, not three.** The table above says "route table
→ the DDAY call **routes**". That was wrong. The three call types share auth,
body validation, timeout, and fallback and differ only in an output schema, so
three routes are three copies of one handler with one line changed. It is
`POST /dday/call` with `call_type` in the body, plus `GET /dday/health`.

**Copied 08-03** — `proxy/` now holds the transport half:
config validation, the origin/content-type/body-size checks, the error envelope,
`template.yaml` (narrowed to haiku — the `AllowedProfileMode` parameter and the
Nova IAM branches are gone, and the samconfig `[elevated]` profile went with
them), the bundle smoke, and 19 tests. `src/call-service.ts` throws 501 on
purpose: what goes inside depends on §3.10, and guessing would bake in the wrong
answer.

**The system prompt layer already lives there**, ahead of the handler:
`proxy/prompts/<call>/base-v*.md`. Call contracts §6 names the
proxy as the supplier of `FLAW`, `INCIDENT`, and `PRIORITY_LIST`, so those files
were never the probe's to own — and leaving them in the probe would have meant
the handler was written against a *copy*, with nothing to keep the two in step.
Until the handler exists, `tools/` reads them off disk; that is a filesystem
read from a sibling directory, not a module edge, and it closes when the `proxy`
transport lands.

### 3.7 ⚠️ Datapacks do not currently reach the browser

§2 constraint 3 says the datapack ships to the browser; constraint 5 puts it at
`data/scenario/<slug>/`. **Those two do not stand up together today.** Vite
serves `public/` only, and `data/` is outside it, so nothing copies it into
`dist/`. Nobody has hit this because no datapack exists yet.

Resolution taken here: a **build-time copy** — a small `closeBundle` plugin in
`vite.config.ts` copies `data/` into `dist/data/`. It must copy
`scenario/` and `policy/` **by name, not `data/` wholesale**:
`data/` holds inputs, and anything that ever lands there as an *output* would
otherwise be published to the web on the next deploy. Constraint 5 keeps the
authored location, constraint 3 gets satisfied, `deploy.yml` stays untouched,
and the client fetches `${import.meta.env.BASE_URL}data/scenario/<slug>/…` —
matching §1's "datapacks fetched as static JSON".

Rejected: moving datapacks under `public/` (breaks constraint 5 and puts
authored data in the asset tree); `import.meta.glob` static import (bundles the
pack into JS, so a data-only change forces a full rebundle and the pack stops
being fetchable as data).

### 3.8 Migration order

1. ✅ `src/{shared,engine,composer,client}/` created; `main.ts` is a two-line
   entry.
2. ✅ `tsconfig.core.json` added and `build` runs `check` first.
   `tsconfig.tools.json` is deferred until `tools/` has a `.ts` file (§3.4).
3. ⬜ The `data/` copy plugin (§3.7) — **still missing**. It blocks one thing
   again, not two: §3.10 moved rendering to the proxy, and `proxy/prompts/`
   is inlined into the Lambda bundle at build time, so no prompt text needs
   to reach the browser. Scope is back to `scenario/` + `policy/`.
4. ✅ `infra/` dissolved into `authoring/` + `tools/` (revision 08-02, below).
5. ⬜ `proxy/`'s handler, and the `proxy` transport that lets
   the probe measure the tier that actually ships.

**Revision 08-02 — `infra/` is gone.** The previous revision said the probe
harness "does not move… relocating it buys nothing and costs provenance". Both
halves turned out to be wrong. It bought the separation this section is *for*:
the probe was holding the production system prompts, the call schemas, the
composer prototype, and an embryonic full-run driver in one folder, so no
boundary in §3.1 was observable in the tree. And it cost no provenance — the
recorded artifacts live under `planning/dday-mechanism/runs/`, never moved, and
the code went by `git mv`.

Verified at the move: the three call types compose byte-identical system and
user messages before and after, and the offline suite passes 44/44.

`infra/scenario-pipeline/` became `authoring/` rather than folding into
`tools/`, on the *when* argument in §3.1.

### 3.9 Left open

- ✅ **Where headless run records are written — `artifacts/`, committed** (08-03).
  `artifacts/runs/<pack>/<policy>/<run-id>.json` and `artifacts/reports/`. They
  are committed because they are gameplay-measurement evidence and LLM output is
  not reproducible, so a deleted record cannot be regenerated. They are **not**
  under `data/`: that directory is inputs, it is copied into `dist/` (§3.7), and
  putting outputs there would publish every measured run to the web. Probe
  artifacts are unaffected and stay at `planning/dday-mechanism/runs/`.
- **Where the run-loop manager's between-run state is written.** §1.1 binds the
  browser side to `sessionStorage`; whether `tools/` mirrors it to disk for
  headless multi-run measurement is the run-loop manager's own design decision.
- **Whether `src/client/` subdivides.** Deliberately unbound — [spec-client
  §2.1](./spec-client.md) fixes the boundaries and leaves the sub-split to the
  client track (민서, claimed 08-03). The only binding constraint from here is
  the arrow direction in §3.1.
- ✅ **How the call contract stays single-sourced** — largely closed by §3.10
  (08-03). The output schemas now live once, in the proxy. What remains is the
  probe's renderer, held to byte identity by the parity gate, and
  `src/shared/contracts.ts`, which narrows to the payload envelope. Neither is a
  second copy of a schema.
- **Whether the default prompt is per-scenario.** `default-prompt.ts` holds one
  global FLAW/INCIDENT/PRIORITY_LIST, copied from the measured suite. A second
  scenario wanting a different flaw turns it into a lookup, and the payload has to
  name the pack.

### 3.10 ✅ The proxy renders both message layers (decided 08-03)

Note that "user" here is the Messages API message *role*, not the player — the
player never authors either layer (the membrane rule).

**The client posts slot values; the proxy renders.** Payload is
`{call_type, template_version, slots}`. Prompt text exists once, in one tier;
iterating a sentence is a proxy deploy and never touches the bundle; and the
composer's job is exactly what the design already called it — slot assembly.
The rejected alternative had the composer render the `user` message and post the
text, which puts prompt wording in the bundle and behind a Pages redeploy.

**Three things followed the templates across, and this is the part worth
noticing.** Rendering needs the slot renderers, and the tool schema is built
*from* a slot value (`stance` enumerates `STANCE_SET`), so:

| Moved to `proxy/src/` | Was |
|---|---|
| `prompt.ts` — renderers, slot filling | `tools/lib/compose.mjs` (prototype) |
| `calls.ts` — the three output schemas + validation | `tools/lib/calls.mjs` |
| `default-prompt.ts` — FLAW · INCIDENT · PRIORITY_LIST | suite slots |

So the contract's executable form is now **one** copy, not the three §3.9
worried about. `src/shared/contracts.ts` narrows to the payload envelope —
what the client sends and receives — which it can hold without duplicating a
schema.

**Consequence for the probe, and it is not free.** `tools/lib/{compose,calls}.mjs`
still exist, because the probe measures offline against the Anthropic API and
cannot reach a Lambda. Two renderers, one claim — "the mechanism numbers describe
the deployed system". `proxy/tests/prompt-parity.test.ts`
composes real suites through both and requires byte identity; it is the only
thing keeping that claim true, and it is the one sanctioned place code crosses
the tier boundary (a drift gate has to see both sides).

⚠️ **Probe channels that vary a proxy-owned slot can no longer be reproduced
through the production path.** C-STRUCT (`PRIORITY_LIST`), CREDULITY (`FLAW`),
and D-INCIDENT (`INCIDENT`) all inject into the default prompt, and the proxy
ignores those slots from a client by construction. C-STRUCT is already dropped,
but CREDULITY is a live contingency arm on the C-BLOCK sheet — running it against
production would need a deploy-time parameter, not a payload field.

## 4. Out of scope

Engine internals (engine spec) · call semantics (call contracts) · channel
invariants (architecture spec) · data formats and transformations (pipeline
§2–§3). This document binds only *where things physically live and run*.

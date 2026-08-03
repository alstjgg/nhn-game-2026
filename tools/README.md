# tools/

Node-only executables. Never reachable from `index.html`; never bundled.

The dependency arrow runs one way and is not negotiable:

```
tools  →  src/composer  →  src/engine  →  src/shared
```

Nothing in `src/` imports `tools/`, and nothing here imports `proxy/` — that is a
separate deployment with its own dependency tree (physical
architecture §3.3). Tools may *read files* out of `proxy/prompts/` because that is data on disk, not a module edge.

## Layout

| Path | What | Runs |
|---|---|---|
| `lib/calls.mjs` | the three call types, for the probe. The production copy is `proxy/src/calls.ts` | probe · driver |
| `lib/compose.mjs` | slot values → system + user messages, for the probe. Production copy: the proxy's `src/prompt.ts` | probe · driver |
| `lib/prompts.mjs` | where the three prompt layers live, and who owns each | probe · driver |
| `lib/transport.mjs` | LLM transports — `anthropic`, `dryrun` (a `proxy` transport is still missing) | probe · driver |
| `probe/` | the measurement program: suites, arms, channels, artifacts | experiments only |
| `driver/` | `drive-beat.mjs` — one beat end to end. Grows into the full-run driver | pipeline stage 5 |

`probe/` is the only place experiment vocabulary (arm, channel, pre-registration,
placebo) is allowed. `lib/` and `driver/` are on the production path and must
stay free of it.

## The two renderers, and the gate between them

`lib/compose.mjs` and `lib/calls.mjs` duplicate the proxy's `src/prompt.ts` and
`src/calls.ts`. That is not an oversight: the probe measures offline against the
Anthropic API and cannot reach a Lambda, and rendering moved to the proxy when
the payload became slot-values-only (physical architecture §3.10).

**If you edit either file here, run the proxy's tests.**

```bash
cd proxy && npm test
```

`tests/prompt-parity.test.ts` there composes real suites through both renderers
and fails on any byte difference. It is the only thing keeping "the mechanism
measurements describe the deployed system" true, and it does not run from the
root — the root `npm run check` will happily pass on a drifted renderer.

## Not here

- **Datapack authoring** — `authoring/` (compile · lint · type generation).
  That is the data track's lane and runs before any of this exists.
- **The proxy** — `proxy/`. Different tier, different deploy.

## Requirements

Node ≥ 24, zero dependencies.

This floor is **not** declared in the root `package.json`, deliberately:
`deploy.yml` pins Node 22 and must not change (physical architecture §2
constraint 4), so a root `engines` field would put a permanent EBADENGINE
warning on every CI install for a floor the Pages build does not need. Nothing
under `tools/` runs in CI.

Everything runs straight from the repo root:

```bash
npm run probe:selftest
```

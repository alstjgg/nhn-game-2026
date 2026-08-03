# planning/legacy-services/

Two backend services built before DDAY was selected. **Neither is deployed, and
nothing in the game calls either one.** They are archived here — reference-only,
not extended, not maintained.

They moved out of `services/` on 2026-08-03 because that directory now means one
thing: *tiers this game actually deploys.* One dead codebase sitting next to the
live proxy makes the live one hard to find, and 27k lines of unrelated service
code at the repo root is the first thing a reader trips over.

| Directory | Built for | Status |
|---|---|---|
| `apothecary-llm-layer/` | the `demos/apothecary/` bake-off entry | Not called by anything. `deploy.yml` never sets `VITE_AI_BASE_URL`, so the deployed demo runs stub-only |
| `agent-arena-api/` | the agent-arena concept, dropped at the 07-28 decision | Never deployed |

## What DDAY takes from `apothecary-llm-layer`

`proxy/` starts as a **copy of the reusable core**, not as an
edit to this tree and not from scratch. Physical architecture §3.6 fixes the
list; in short:

| Copy | Leave |
|---|---|
| `src/config.ts`, `src/errors.ts` | `src/dialogue-*` — a different route contract |
| the handler skeleton: Origin / content-type / body-size checks | the `/ai/dialogue` route table |
| `scripts/aws-preflight.mjs`, `scripts/bundle-smoke.cjs` | `data/apothecary.ts` — no registry in DDAY |
| `deploy/`, the `samconfig.toml` shape, the stack policy | `ModelId` — DDAY binds haiku, this defaults to `nova-2-lite` |
| the smoke-test shape and its acceptance rules | stack name, API, log groups — all new resources |

Reuse the existing bootstrap stack (OIDC provider, deploy roles, artifact
bucket); do not stand up a second one.

## Related records

- [`planning/research/agent-arena-api-usage.md`](../research/agent-arena-api-usage.md)
- [`planning/handoffs/agent-arena-llm-backend.md`](../handoffs/agent-arena-llm-backend.md)
- [`docs/handoffs/llm-lambda-runtime.md`](../../docs/handoffs/llm-lambda-runtime.md) — the AWS runtime record

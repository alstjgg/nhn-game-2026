# Handoff — Agent Arena LLM backend

> [!IMPORTANT]
> **Superseded (2026-07-25).** This service is retained as a verified reference
> implementation and will not be deployed. The deployment path is now the
> stateless turn-decision proxy (API Gateway → Lambda → Bedrock Converse) from
> [the AWS/Bedrock research note](../research/llm-backend-aws-bedrock.md). The
> [Next work](#next-work-void--superseded) section below is void.

> Backend-only implementation state. Project-wide state remains in
> `docs/status.md`.

## Status (2026-07-24)

The first self-contained backend slice is implemented at
`services/agent-arena-api/`.

- Node.js + TypeScript REST/SSE service with an OpenAPI contract
- allowlisted model, Prompt, Skill, MCP and harness registries
- three-agent parallel turns with one encrypted context per agent
- SQLite WAL storage behind a repository boundary
- strict closed-action validation and deterministic fallback
- crash-safe run/turn/compact/clear receipts and persisted SSE replay/recovery
- atomic turn lifecycle state/event transitions and fail-closed registry validation
- normalized OpenAI Responses and Claude Messages adapters
- function tools, read-only HTTPS MCP, immutable-version hosted Skills
- measured provider usage, estimated context gauges and sanitized public telemetry
- deterministic mock provider for API-key-free development

Latest keyless verification passed **146 tests across 11 files**, plus typecheck,
OpenAPI validation and production build. The current source snapshot also passed
the non-root Docker security and mock end-to-end checks.

## Contract

```text
GET  /v1/capabilities
POST /v1/runs
PUT  /v1/runs/{runId}/agents/{agentId}/loadout
POST /v1/runs/{runId}/turns
GET  /v1/turns/{turnId}
GET  /v1/turns/{turnId}/events
POST /v1/runs/{runId}/agents/{agentId}/compact
POST /v1/runs/{runId}/agents/{agentId}/clear
```

The browser sends allowlisted aliases and card IDs only. Provider credentials,
raw model names, MCP credentials and provider-side Skill IDs remain server-owned.
The model selects an intent from `allowedActions`; the game engine remains the
authority that validates and applies state changes.

Changing the model starts a new run/session. Cross-model fork/migrate remains
deferred.

## GitHub Pages deployment boundary

GitHub Pages is static hosting, so it serves only the game HTML/CSS/JavaScript.
It cannot run this Node backend, and no provider or internal API key may be
embedded in the Pages build.

```text
GitHub Pages
  -> public Game API/BFF
     -> private Agent Arena API
        -> OpenAI / Claude / MCP / hosted Skill
```

Recommended first deployment:

- Build the Pages frontend with only a public Game API base URL.
- Run the Game API/BFF and `agent-arena-api` as separate containers on one
  AWS host; expose only the Game API through HTTPS.
- Keep `agent-arena-api:8790` on the private Docker network and mount
  `/app/data` on a persistent volume for the current SQLite store.
- Inject `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `ARENA_API_KEYS`,
  `ARENA_CONTEXT_ENCRYPTION_KEY`, provider Skill bindings, and MCP credentials
  from AWS Secrets Manager/SSM or a permission-restricted server env file at
  runtime. Never bake them into the image or Pages artifact.
- Split GitHub Actions into Pages deployment and backend image deployment.
  Prefer GitHub OIDC short-lived AWS credentials over long-lived AWS keys.

The current fixed `ARENA_API_KEYS` bearer is an internal service credential, not
a public browser token. The BFF must issue a short-lived public session, enforce
user/IP/session quotas, own the user-to-run/session mapping, and proxy polling or
SSE. If one BFF credential is shared internally, all calls share one Agent Arena
owner namespace, so the BFF's ownership check is mandatory. CORS is required for
the Pages origin but is not authentication.

SQLite WAL is appropriate for the initial single instance. Multi-instance
deployment requires the deferred PostgreSQL/distributed-queue work.

References:

- [GitHub Pages is static hosting](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)
- [GitHub Actions OIDC for AWS](https://docs.github.com/en/actions/how-tos/secure-your-work/security-harden-deployments/oidc-in-aws)
- [OpenAI standard API keys stay on the server](https://developers.openai.com/api/docs/guides/realtime-webrtc#creating-an-ephemeral-token)

## Verification state

| Area | State |
|---|---|
| Keyless mock and provider-wire tests | Passed — 146 tests / 11 files |
| TypeScript typecheck | Passed |
| OpenAPI semantic and response validation | Passed |
| Production build | Passed |
| Latest-source Docker rebuild/E2E | Passed — non-root, healthy, API 200, full mock lifecycle |
| Live OpenAI call | Passed — 5 turns + native compact with `gpt-5.4-mini` |
| Live Claude call | Passed — 5 turns + explicit-summary compact with `claude-haiku-4-5` |
| Live remote MCP | Passed — completed `calculate` trace + result marker on both providers |
| Live hosted Skill | Passed — completed hosted trace + instruction marker on both providers |

All live scenarios (core matrix, remote MCP, hosted Skill, MCP-only hardening)
passed on both providers via server-side command overrides, `.env.local`
unchanged. Full evidence, per-run usage, and cost breakdown (≈ $0.059 total
recorded model tokens) live in
[the live verification record](../research/agent-arena-api-live-test-2026-07-24.md) —
that document is the single source for verification detail.

## Important behavior

- Run creation snapshots the model and resolved provider loadout. Skill ID/version,
  MCP target and MCP token snapshots are encrypted at rest and not exposed publicly.
- Registry JSON is recursively validated at startup. Invalid shapes, limits,
  capabilities, ambiguous card IDs and write-capable MCP entries fail closed.
- Public compaction modes are derived from the configured hidden model target and
  frozen in the run snapshot; the raw target remains server-only.
- Hosted Skills require an immutable version; `latest` fails closed.
- MCP entries must be registry-approved, read-only HTTPS targets.
- Normal turns use the low-latency `starter-4000` harness. Provider-hosted MCP
  and Skill cases use the bounded `agentic-4000` harness because hosted execution
  can exceed the starter timeout.
- Provider-reported token usage is labeled measured. Active-context occupancy is
  an estimate and is never presented as exact provider-window usage.
- Projected soft-limit pressure emits a numeric warning. The hard limit prevents
  the provider call and applies deterministic fallback until the client compacts
  or clears that agent.
- Compact is atomic and reports native versus explicit-summary fallback mode.
  A durable pre-call claim prevents an ambiguous restart from repeating the same
  paid compact key; that case returns `operation_outcome_unknown`.
  The shared compact response does not expose provider compact-call usage.
- Clear starts a fresh per-agent session generation while preserving the run,
  model snapshot, loadout and durable game state. Generation change and replay
  receipt commit together.
- `GET /v1/turns/{turnId}` is authoritative; SSE is sanitized presentation
  telemetry with `Last-Event-ID` replay. Raw model deltas are reduced to character
  counts. Turn lifecycle state and its matching event commit atomically, and
  missing terminal events are repaired defensively on restart.
- Anthropic-hosted MCP/Skill call limits are observational because those tools run
  provider-side before results arrive. Excess calls are rejected and fall back,
  but already-executed provider work cannot be preempted; use client-run functions
  when a strict pre-execution cap is required.

## Next work (void — superseded)

The items below are void: this service will not be deployed, and deployment
follows [`docs/llm-backend-aws-bedrock.md`](../research/llm-backend-aws-bedrock.md)
instead. What carries forward into the Lambda build: closed-action validation
(`src/validation.ts`), the turn contract shapes, fail-closed registry/config
validation, the non-root Docker pattern, and the live-smoke discipline.

1. ~~Configure the verified OpenAI and Claude aliases in the deployment
   environment rather than relying on command-only overrides.~~
2. ~~Replace the public synthetic calculator MCP target with a team-owned HTTPS
   endpoint, then pin and verify that deployment.~~
3. ~~Integrate the game backend's closed actions and durable state with this API.~~

The verified capability claim is limited to the exact allowlisted calculator MCP
card and reviewed `arena-tactics` Skill fixture. Do not generalize it to
arbitrary user-supplied servers or Skills. Missing or unavailable capabilities
must remain visible as unconfigured/unverified in `GET /v1/capabilities`.

## Deferred

- session fork/migrate across provider or model
- arbitrary user-supplied Skills/MCP
- write-capable MCP tools
- multi-instance queue/PostgreSQL
- leaderboard and live PvP

## References

- `docs/agent-arena-api-usage.md`
- `services/agent-arena-api/README.md`
- `services/agent-arena-api/openapi.yaml`
- `docs/agent-arena-api-live-test-2026-07-24.md`
- [Agent Arena brief](https://github.com/alstjgg/nhn-game-2026/blob/main/docs/agent-arena-brief.md)
- `docs/game-concept-agent-roguelike.md`

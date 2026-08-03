# Agent Arena API

Backend agent-operating layer for Agent Arena. It compiles allowlisted
model/Prompt/Skill/MCP loadouts, maintains one isolated context per party agent,
runs all three agents in parallel, streams sanitized events, and returns a strict
closed-action decision for the deterministic game engine to execute.

The browser never receives provider credentials, raw model names, MCP targets, or
provider-side Skill IDs.

## Runtime

- Node.js 24+
- TypeScript
- built-in `node:sqlite`
- OpenAI Responses API
- Anthropic Claude Messages API
- no provider SDK dependency; adapters use the documented HTTP/SSE contracts

## Configure

```bash
cp .env.example .env.local
```

For repository-local development the service also loads the repository root
`../../.env.local` when present. Secret values are never included in capabilities,
logs, SSE events, SQLite JSON fields, or Docker build context.

The deterministic `mock-arena` profile is always available. Provider profiles
appear in `GET /v1/capabilities` but are `configured: false` until both their API
key and model environment variables exist.

Provider-side custom Skill and MCP values are optional:

- `OPENAI_SKILL_ID` / `OPENAI_SKILL_VERSION`
- `ANTHROPIC_SKILL_ID` / `ANTHROPIC_SKILL_VERSION`
- `ARENA_CALCULATOR_MCP_URL` / `ARENA_CALCULATOR_MCP_TOKEN`

Hosted Skills require both their ID and an immutable version; `latest` is rejected.
MCP entries must be registry-approved, read-only HTTPS targets. Only reviewed
server-side registry entries can reference these values.

Two harness profiles are included:

- `starter-4000` keeps ordinary arena turns small and low-latency.
- `agentic-4000` permits up to four tool calls, 512 output tokens, and 90 seconds
  for provider-hosted MCP or Skill execution.

### Provision the test Skill

The reviewed `fixtures/skills/arena-tactics/SKILL.md` bundle can be uploaded to
both configured providers with an explicit live-write gate:

```bash
BOOTSTRAP_LIVE_SKILLS=1 npm run test:live:bootstrap-skills
```

If that provider Skill already exists and the reviewed fixture has changed,
the command fails closed instead of trusting a matching display name. Create one
new immutable version explicitly:

```bash
BOOTSTRAP_LIVE_SKILLS=1 \
BOOTSTRAP_LIVE_SKILLS_FORCE_VERSION=1 \
npm run test:live:bootstrap-skills
```

Only when an operator has independently verified an existing remote version may
they opt into reuse with
`BOOTSTRAP_LIVE_SKILLS_ALLOW_UNVERIFIED_REUSE=1`; the result is labeled
`existing_unverified`. The command prints the local fixture SHA-256, resulting
administrative Skill IDs, immutable versions, and provenance, never API keys.
Supply the IDs and versions through the server environment variables listed
above; never return them to a game client or commit them.

## Run locally

```bash
npm ci
npm run typecheck
npm test
npm run build
npm run dev
```

Development authentication defaults to `Bearer dev-local-key` only when
`ARENA_API_KEYS` is absent, `NODE_ENV` is not `production`, and the configured
listen host is loopback. Any non-loopback binding requires explicit strong
application and context-encryption keys.

```bash
curl \
  -H 'Authorization: Bearer dev-local-key' \
  http://127.0.0.1:8790/v1/capabilities
```

Create a run:

```bash
curl -X POST \
  -H 'Authorization: Bearer dev-local-key' \
  -H 'Idempotency-Key: demo-run-0001' \
  -H 'Content-Type: application/json' \
  http://127.0.0.1:8790/v1/runs \
  -d '{
    "modelProfileId": "mock-arena",
    "harnessId": "starter-4000",
    "party": [
      {
        "agentId": "guardian",
        "promptCardIds": ["protect-weakest-v1"],
        "skillCardIds": [],
        "mcpCardIds": []
      },
      {
        "agentId": "solver",
        "promptCardIds": ["answer-briefly-v1"],
        "skillCardIds": ["risk-check-v1"],
        "mcpCardIds": []
      },
      {
        "agentId": "scout",
        "promptCardIds": ["avoid-high-risk-v1"],
        "skillCardIds": [],
        "mcpCardIds": []
      }
    ]
  }'
```

Use the returned `runId` to submit a turn:

```bash
curl -X POST \
  -H 'Authorization: Bearer dev-local-key' \
  -H 'Idempotency-Key: demo-turn-0001' \
  -H 'Content-Type: application/json' \
  http://127.0.0.1:8790/v1/runs/RUN_ID/turns \
  -d '{
    "stageId": "combat-01",
    "turnNumber": 1,
    "event": {
      "type": "combat",
      "summary": "The enemy prepares an area attack.",
      "publicState": {"enemyId": "enemy-1"}
    },
    "allowedActions": [
      {"actionId": "attack", "targetIds": ["enemy-1"]},
      {"actionId": "defend", "targetIds": ["guardian", "solver", "scout"]},
      {"actionId": "wait", "targetIds": []}
    ]
  }'
```

The `202` response contains the queued `turnId` and SSE URL. Poll
`GET /v1/turns/{turnId}` for the authoritative result. SSE supports
`Last-Event-ID`; the terminal event is persisted and replayed before closing.
Provider text deltas are not exposed verbatim: public delta events contain only
character counts, while the validated final decision remains authoritative.

## Context behavior

- Each party agent has a separate encrypted provider-native history.
- A second turn reuses only that agent's history.
- `compact` atomically replaces active history after provider success and reports
  `native`, `explicit-summary-fallback`, or `mock-native`.
- `clear` creates a new per-agent session generation while preserving the run,
  model snapshot, and current loadout.
- Provider-reported tokens are marked measured. Context occupancy is an estimate
  and never presented as an exact provider window value.
- A projected soft limit emits `agent.context.warning`. The hard limit applies a
  deterministic fallback before a provider request is made; call `compact`
  explicitly before continuing that agent.

## Idempotency and restart behavior

- Run, turn, compact, and clear mutations require an `Idempotency-Key`.
- A repeated completed request returns the original result with `replayed: true`.
- Queued/running/completed/failed turn state and its matching lifecycle event
  commit in the same SQLite transaction. A failed event write cannot leave the
  authoritative turn state ahead of its replay stream.
- Clear stores its new session generation and replay receipt atomically.
- Compact durably claims the key before contacting a provider, then stores context
  and the receipt atomically. If the process stops while the provider outcome is
  ambiguous, the claim becomes indeterminate after restart. Reusing that key
  returns `409 operation_outcome_unknown`; use a new key only when an explicit new
  provider call is intended.
- This at-most-once-per-key policy covers a single service writer. Distributed
  multi-instance coordination remains outside this slice.

## Docker

Build from this service directory so the allowlist registries are included and the
repository root `.env.local` cannot enter the build context.

```bash
docker build -t agent-arena-api .
docker run --rm \
  -p 8790:8790 \
  --env-file .env.local \
  -v agent-arena-data:/app/data \
  agent-arena-api
```

Production and every non-loopback binding require application API keys containing
at least 32 UTF-8 bytes of non-placeholder material and an
`ARENA_CONTEXT_ENCRYPTION_KEY` containing at least 24 UTF-8 bytes. The service
fails closed before listening when either requirement is not met.

## Tests

`npm test` is fully keyless. The deterministic mock covers:

- three-agent parallel start and stable party ordering
- same-agent continuity and cross-agent/owner isolation
- strict output validation and fallback
- function/MCP/Skill event normalization
- crash-safe compact/clear receipts, turn replay, and active-turn locking
- SSE persistence and replay
- projected context soft/hard limits and pre-request hard-limit fallback
- compact and clear
- encrypted context and secret redaction
- provider HTTP/SSE wire contracts with mocked `fetch`

Registry files are recursively validated at startup. Unknown shapes, invalid
limits, ambiguous card IDs, write-capable MCP entries, and inconsistent
capability declarations fail closed. Published compaction modes are derived from
the hidden configured model target, while the raw target remains server-only.

Anthropic-hosted MCP and Skill calls execute inside the provider before their
result is streamed back. The service counts those calls, rejects an over-budget
result, and applies deterministic fallback, but cannot prevent already-executed
hosted calls from consuming latency or provider resources. Use the client-run
function path when a strict pre-execution tool-call ceiling is required.

Live tests are gated by `RUN_LIVE=1`:

```bash
RUN_LIVE=1 npm run test:live
RUN_LIVE=1 LIVE_TEST_PROVIDER=openai npm run test:live
RUN_LIVE=1 LIVE_TEST_SCENARIO_SET=capabilities npm run test:live
```

`LIVE_TEST_PROVIDER` accepts `all`, `openai`, or `anthropic` and defaults to
`all`. `LIVE_TEST_SCENARIO_SET` accepts `all`, `capabilities`, `mcp`, or `skill`.
The narrower values avoid repeating unrelated paid calls during diagnostics.
Normal live prompts default to 96 output tokens and permit an explicit cap up to
the starter harness limit of 192. Capability prompts use `agentic-4000`, default
to 384 output tokens, and remain bounded by its 512-token limit.

A capability passes only when its validated decision contains the expected
fixture marker and card attribution and the sanitized trace reports a completed
MCP or Skill tool. The sample calculator target is a public third-party endpoint
used only for synthetic internal smoke tests; replace it with a team-owned HTTPS
MCP target for production or submission.

The report contains validated decisions, safe tool traces, and aggregate turn
usage. Output that echoes a server-owned model target, Skill identifier,
MCP target/authorization value, or provider API key is rejected before the
report is printed, with structural redaction applied afterward as defense in
depth. Provider compaction endpoints do not expose usage through the current
shared compact contract. Missing model, MCP, or Skill configuration skips only
the affected live capability and performs no provider call for it; this does not
weaken the keyless suite.

## API contract

See [openapi.yaml](./openapi.yaml). The final `GET /v1/turns/{turnId}` response is
the source of truth; streamed events are sanitized presentation telemetry.

For the complete capabilities → run → loadout → turn → SSE/polling →
compact/clear integration flow, see
[`docs/agent-arena-api-usage.md`](../../../planning/research/agent-arena-api-usage.md).

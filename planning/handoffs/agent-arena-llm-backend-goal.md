# Goal prompt — Agent Arena LLM backend

Copy the block below into the implementation session as its goal.

```text
Goal:
Implement and verify the production-shaped backend described in
`docs/handoffs/agent-arena-llm-backend.md` under
`planning/legacy-services/agent-arena-api/`. Do not stop at planning or scaffolding. Deliver a
complete keyless vertical slice plus working OpenAI Responses API and Claude
Messages API adapters.

Read these sources before changing code:
1. `CLAUDE.md`
2. `docs/status.md`
3. `docs/handoffs/agent-arena-llm-backend.md` — source of truth for the contract
4. `docs/game-concept-agent-roguelike.md` only when product intent is needed
5. Agent Arena brief only when additional product context is needed:
   https://github.com/alstjgg/nhn-game-2026/blob/main/docs/agent-arena-brief.md

If the documents conflict, follow the handoff's scope and frozen decisions.
Inspect the current worktree before editing and preserve all unrelated user
changes.

Required implementation:
- A self-contained Node.js + TypeScript service with its own package.json,
  .env.example, README, and Dockerfile
- Every REST/SSE endpoint listed in the handoff and a matching openapi.yaml
- Allowlisted model/card/harness registries with immutable snapshots at run creation
- SQLite persistence behind repository interfaces
- Three party agents starting in parallel with strict agent/run context isolation
- Strict AgentDecision validation and deterministic fallback for timeout, tool,
  schema, and provider failures
- Session continuity, loadout updates, compact, clear, idempotency, and SSE replay
- An explicit distinction between measured provider usage and estimated context
  gauge values
- Secret redaction, owner isolation, rate/body/tool limits, and bounded execution
- A deterministic mock provider and complete keyless integration tests
- OpenAI Responses and Claude Messages adapters behind the same provider contract
- Streaming, usage, context history, function tools, remote MCP, Skills, and
  compact/clear paths in both adapters; unsupported or substituted behavior must
  be exposed truthfully through capabilities
- Registry/config/test paths that let both providers use the same read-only MCP
  capability and semantically equivalent versioned custom Skill

Provider requirements:
- Implement OpenAI and Claude in the same slice. The goal is incomplete if only
  one provider works.
- Consult the current official provider documentation. Do not guess beta headers,
  request schemas, response events, or usage fields.
- Normalize provider-native objects into shared domain types; do not leak raw
  provider payloads through the public API.
- Absorb native compaction differences inside each adapter. Report whether a run
  used native compaction or an explicitly labeled fallback.
- Never accept raw model names, MCP URLs/commands, Skill files/IDs, or provider
  credentials from the browser. Clients may select only server-published aliases
  and card IDs.
- Never request, persist, or expose hidden chain-of-thought.

Secrets and live validation:
- The repository root `nan2026/.env.local` may already contain the OpenAI and
  Anthropic credentials needed for local live tests. Load that file through the
  service/test configuration when present.
- Treat `.env.local` as secret material: never print it, inspect values in terminal
  output, copy it into another file, commit it, include it in Docker build context,
  or place any value in logs, snapshots, fixtures, evidence, or final responses.
- Check only whether required variables are present. Redact all authorization
  headers, tokens, provider errors, and request metadata that could expose them.
- If usable credentials are present, run a minimal live smoke matrix with small
  prompts and low output caps. If a credential or provider-side MCP/Skill setup is
  absent, skip only the affected live test and continue all keyless work without
  asking the user for a key.

Execution approach:
- Freeze the shared domain/provider contract and mock contract tests first, then
  implement the OpenAI and Claude adapters in parallel.
- If using subagents, divide work by provider and prevent concurrent edits to
  shared types and contracts.
- Do not leave core behavior as TODOs, empty handlers, mocked success responses, or
  unverified assumptions.
- The complete mock-backed suite must pass without model credentials, MCP
  endpoints, or hosted Skill IDs.
- Keep all dependencies inside the new service. Do not modify the root app or
  other demos.
- Do not commit, push, deploy, or mutate external provider resources beyond the
  minimum reviewed live-test setup unless explicitly requested.

Required verification:
- Dependency install, typecheck, unit tests, contract tests, integration tests, and
  production build
- Docker image build and container health check
- Keyless end-to-end flow:
  create run → execute a parallel three-agent turn → consume SSE/fetch result →
  run a second turn with preserved context → compact → continue → clear → continue
  in a new session
- Context/resource isolation between agents, runs, and owners
- Invalid action, provider timeout, tool failure, idempotent replay, and
  idempotency-conflict behavior
- OpenAPI agreement with actual routes, status codes, and response bodies
- Automated checks that logs, DB records, SSE events, errors, and artifacts contain
  no credentials or raw authorization data
- When credentials and provider resources are available, a minimal matrix for each
  provider: no-tool, two-turn context, function tool, real MCP, real Skill, and
  compact/clear

Required deliverables:
- Complete implementation and tests under `planning/legacy-services/agent-arena-api/`
- Runnable `.env.example`, README, and openapi.yaml
- Safe example model/card/harness registries
- If live tests run, a redacted
  `docs/agent-arena-api-live-test-YYYY-MM-DD.md` plus sanitized evidence
- Update the handoff Status and acceptance items to match verified reality

Completion rule:
All keyless verification must pass and both provider adapters must be implemented.
If external credentials, MCP reachability, or provider-side Skill registration are
the only remaining gaps, do not misreport the whole goal as complete: distinguish
the completed keyless implementation from each unverified live capability. Keep
working while any code-solvable failure remains.

Final report:
1. Implemented capabilities
2. Verification commands and actual results
3. Whether live calls ran and their aggregate usage, if available
4. Remaining external dependencies or unverified capabilities
5. Links to key files and the exact local run command
```

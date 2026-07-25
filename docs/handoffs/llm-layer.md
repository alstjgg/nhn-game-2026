# Handoff — Common LLM layer (Lambda + Bedrock)

> Implementation plan for the concept-agnostic runtime LLM layer, built **before**
> the bake-off completes. Architecture follows the merged
> [AWS/Bedrock research note](../llm-backend-aws-bedrock.md); this document adds
> the verified account state, the binding decisions, and the build order.
> Project-wide state remains in `docs/status.md`.

## AWS infrastructure — current state (verified live 2026-07-25)

Everything below was exercised with real calls, not just configured.

- **Account**: `141840355276` (alias `alstjgg`) — a personal account dedicated
  to this project.
- **Humans**: IAM Identity Center (start URL
  `https://d-9b675be251.awsapps.com/start`, region `ap-northeast-2`); both team
  members are enrolled.
- **CLI**: profile **`nhn-game`** (SSO session `claude`). Re-auth when the token
  expires (~8h): `aws sso login --sso-session claude --use-device-code`.
  ⚠️ The default AWS profile on a dev machine may target a non-project
  account — always pass `--profile nhn-game` for project commands.
- **Budgets**: $10 and $30 monthly alert budgets. These only *alert*; the actual
  spend ceiling is throttling + reserved concurrency (see guardrails below).
- **Bedrock**: the model-access page is retired; models auto-enable on first
  invoke. Both candidate models are already enabled account-wide and answered
  live `Converse` calls from Seoul via **Global inference profiles**:

  | Model | Inference profile ID | First-call latency |
  |---|---|---|
  | Claude Haiku 4.5 | `global.anthropic.claude-haiku-4-5-20251001-v1:0` | 936 ms |
  | Nova 2 Lite | `global.amazon.nova-2-lite-v1:0` | 469 ms |

- **Not yet deployed**: no Lambda, no API Gateway, no execution role, no IaC.
  That is exactly the work this handoff describes.

Smoke test for any future session:

```bash
aws sts get-caller-identity --profile nhn-game
aws bedrock-runtime converse --region ap-northeast-2 --profile nhn-game \
  --model-id global.anthropic.claude-haiku-4-5-20251001-v1:0 \
  --messages '[{"role":"user","content":[{"text":"Reply with exactly: OK"}]}]' \
  --inference-config '{"maxTokens":16}'
```

## Binding decisions

1. **Architecture**: GitHub Pages (static client) → API Gateway HTTP API →
   Lambda → Bedrock `Converse`. Stateless — the client sends full context per
   request; no sessions, no DB, no SSE, no always-on server.
2. **Infrastructure as code** — the stack is defined in a committed template,
   never console-clicked. The template *is* the backend documentation (repo
   history is a competition deliverable). Tool choice (SAM vs CDK) is the first
   implementation decision; SAM is the recommended default for one function +
   one API.
3. **No real-time image generation** (decided 2026-07-25). NPCs — appearance,
   problems, portraits — are **pre-generated asset sets** (each entry manifested
   in `assets-manifest.json` per CLAUDE.md rule 5). Only speech/dialogue text is
   generated at runtime. Consequence: the runtime layer is **single-provider
   (Bedrock only)** — no OpenAI key, no gpt-image-1 path, no second vendor
   integration. Apothecary's portrait endpoint (PR #46) becomes dev-time asset
   tooling, never deployed.
4. **Region & routing**: Seoul (`ap-northeast-2`) as the calling region, Global
   inference profiles for model routing.
5. **Model**: Haiku 4.5 is the working default; final `MODEL_ID` is decided by
   the benchmark (research note §10: same schema, ~100 runs, p50/p95 latency,
   schema-validity rate, cost per run) and recorded in the research note's
   최종 결정 기록 section.
6. **Failure policy**: server-side model timeout 7 s, **no retries**;
   any timeout or schema-validation failure returns the **deterministic
   fallback** so the game never blocks. Latency targets p50 ≤ 3 s / p95 ≤ 6 s.
7. **Least-privilege execution role**: the Lambda role allows
   `bedrock:InvokeModel` only, resource-scoped to a **template-defined
   allowlist of inference profiles** plus the foundation-model ARNs in every
   region those Global profiles can route to, with an
   `aws:InferenceProfileArn` condition. While the benchmark runs, the
   allowlist contains **both** candidates; after the model decision, redeploy
   with it narrowed to the winner. Corollary: switching `MODEL_ID` by env var
   works only between profiles the deployed policy already authorizes — any
   other model change is a stack redeploy, not a config flip. The role never
   needs Marketplace permissions (models are already account-enabled).
8. **Cost/abuse guardrails** (deploy-time, in the template): CORS locked to
   `https://alstjgg.github.io`, API Gateway stage throttling, low Lambda
   reserved concurrency, request-body size cap, output-token cap. Post-judging:
   disable the stage or set reserved concurrency to 0.
9. **Membrane rule**: request payloads are composed from structured game
   elements only — IDs, cards, telemetry. No free-text field from the player
   reaches the model. The model selects among server-validated candidates; the
   game engine stays the authority.
10. **Config via env vars**: `MODEL_ID`, `MAX_TOKENS`, `MODEL_TIMEOUT_MS`,
    `ALLOWED_ORIGIN` — tuning is configuration, not code. The handler
    validates `MODEL_ID` against the template's inference-profile allowlist at
    cold start and fails closed on mismatch (decision 7 covers the IAM side).
11. **Prior art**: PR #15 (`services/agent-arena-api/`) is merged as a
    **superseded reference** — salvage its closed-action validation
    (`src/validation.ts`), turn-contract shapes, and fail-closed config
    validation. PR #46 (`demos/apothecary/server/`) has transport-agnostic
    handlers (`(request) → {status, body}`) that port to a Lambda wrapper
    nearly unchanged, plus a keyless-test pattern worth copying.
12. **Structured output enforcement is per-model** — the response *contract*
    is shared; the enforcement *mechanism* is not:
    - **Haiku path**: forced tool use via Converse `toolConfig` with a
      `strict: true` tool definition — forcing `toolChoice` alone does **not**
      guarantee schema-conformant output. First use of a strict schema
      compiles a grammar server-side (cached ~24 h), so a cold schema can
      exceed the 7 s timeout and cause a spurious fallback. Therefore an
      explicit **warm-up call with the exact production schema** precedes
      benchmarks, every deploy, and the judging window.
    - **Nova path**: no structured-output support — ordinary (non-strict)
      tool use, with Lambda-side validation doing the enforcement.
    - **Both paths**: dynamic values (action IDs, card IDs, target IDs) stay
      **out of schema enums** — they are plain strings validated in Lambda
      against the request's candidate list. Enum-encoding them would make
      every game state a new schema and defeat the grammar cache.

## Open questions (resolve during implementation, in this order)

- **SAM vs CDK** — blocks phase 0 only.
- **Endpoint shape**: one generic `/v1/turn` (research note's contract) vs
  per-concept routes. Interim answer: build the plumbing concept-agnostically
  and treat the request/response schema as swappable data; the bake-off winner
  fixes the final contract. Apothecary's dialogue shape is a thin variant of
  the same "structured state in → validated structured decision out" pattern.
- **Grammar-cache behavior under real traffic**: decision 12 assumes the ~24 h
  strict-schema cache holds; measure actual cold-vs-warm latency during the
  benchmark and adjust the warm-up cadence if needed.

## Implementation plan

Each phase is a mergeable unit with its own verification.

### Phase 0 — IaC scaffold
Pick SAM or CDK. Create `infra/llm-layer/` with the template skeleton:
one function, one HTTP API, the scoped execution role (decision 7), guardrail
settings (decision 8), env-var wiring (decision 10). Verify: template
lints/synthesizes; `sam validate` or `cdk synth` in CI-runnable form.

### Phase 1 — Turn-decision Lambda handler
Handler flow: parse + size-cap → validate request against schema → compose
prompt from structured elements → Bedrock `Converse` with a strict forced
tool (decision 12) + 7 s timeout → validate output (including dynamic IDs
against the request's candidate list) → deterministic fallback on any
failure.
Port PR #15's validation patterns and PR #46's handler/keyless-test structure.
Verify: keyless unit tests (no AWS needed — fallback paths and validation),
plus one live invoke behind an explicit gate.

### Phase 2 — Deploy + smoke
Deploy the stack to the account (`--profile nhn-game`), then run the schema
warm-up call (decision 12). Verify: `curl` the API Gateway URL — happy path,
oversized body (413-class rejection), wrong origin (CORS rejection), throttle
behavior; confirm CloudWatch logs record model/tokens/latency/fallback only
(no prompt/response bodies).

### Phase 3 — Model benchmark
Prerequisite: the deployed IAM allowlist authorizes **both** candidate
profiles (decision 7). Harness: same prompt and same logical response
contract — enforcement differs per model (decision 12) — ~100 runs each
against Haiku 4.5 and Nova 2 Lite through the deployed endpoint, preceded by
a warm-up call per model (warm-up excluded from stats but reported). Measure
p50/p95, validity rate, cost/run. Record the `MODEL_ID` decision in the
research note, flip the env var, then redeploy with the IAM allowlist
narrowed to the winner.

### Phase 4 — First live client (apothecary)
Real integration work, not a config flip. The adapter's base-URL seam
(`VITE_AI_BASE_URL`) lands with PR #46; on top of it:

- adapt the client to the final endpoint contract (today it speaks
  `/ai/dialogue` to the dev proxy);
- align the client to the server failure policy — replace the current 35 s
  timeout and one-retry-on-invalid-schema behavior with
  7 s / no retries / deterministic fallback (decision 6);
- remove the runtime portrait path (decision 3);
- wire live/stub adapter selection into the built app;
- end-to-end verification from the GitHub Pages origin: real cross-origin
  calls and a fallback-under-failure play-through (research note §11.4
  checklist).

This phase is also the template for wiring whichever concept wins the
bake-off.

### Non-goals
Real-time image generation, sessions/DB, SSE streaming, MCP, always-on
servers, multi-provider abstraction. If a future need appears, it gets its own
decision — do not grow this layer speculatively.

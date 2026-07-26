# Apothecary LLM layer

This AWS SAM application generates one runtime dialogue beat for the Apothecary
game.

```text
GitHub Pages → API Gateway HTTP API → Lambda → Amazon Bedrock Converse
```

## Runtime boundary

| Method and route | Purpose |
|---|---|
| `POST /ai/dialogue` | Return a validated NPC line and exactly four choices |
| `GET /ai/health` | Report connectivity and the configured model without invoking Bedrock |

These are the only runtime routes. Portraits are pre-generated static assets, so
there is no `/ai/portrait`.

The service is stateless. It has no session store, database, streaming response,
or player free-text input.

## Request flow

1. Lambda validates the exact Origin, `Content-Type`, body size, and JSON schema.
2. It builds a prompt only from server-registered customer data.
3. It makes one Bedrock Converse request.
4. It validates the model response schema and every returned clue ID.
5. A timeout, model error, or invalid response produces deterministic fallback
   dialogue.

Live and fallback dialogue responses both return HTTP 200. Read
`x-llm-fallback`; only `false` means the response came from Bedrock.

Logs contain only request ID, model ID, latency, token counts, and fallback
status. Never log customer data, prompts, dialogue, clue text, or raw model
output.

## Repository map

| Responsibility | File |
|---|---|
| API Gateway, Lambda, and runtime IAM | `infra/llm-layer/template.yaml` |
| Environment configuration validation | `infra/llm-layer/src/config.ts` |
| HTTP routing and CORS | `infra/llm-layer/src/handler.ts` |
| Bedrock Converse call | `infra/llm-layer/src/dialogue-provider.ts` |
| Prompt and tool schema | `infra/llm-layer/src/dialogue-prompt.ts`, `infra/llm-layer/src/dialogue-schema.ts` |
| Request and response validation | `infra/llm-layer/src/dialogue-validation.ts` |
| Deterministic fallback | `infra/llm-layer/src/dialogue-fallback.ts` |
| Server allowlisted game data | `infra/llm-layer/data/apothecary.ts` |
| GitHub OIDC roles and artifact bucket | `infra/llm-layer/deploy/github-actions-bootstrap.yaml` |
| Application stack replacement/deletion protection | `infra/llm-layer/deploy/application-stack-policy.json` |
| CI/CD workflow | `.github/workflows/llm-layer.yml` |

## Local validation

Prerequisites are Node.js 24+, npm, and AWS SAM CLI. These checks do not require
AWS credentials or invoke Bedrock:

```bash
cd infra/llm-layer
npm ci
npm run check
npm run sam:validate
npm run bootstrap:validate
npm run sam:build
npm run sam:smoke
```

## API contract

`POST /ai/dialogue` accepts `application/json`. The smallest useful request is:

```json
{
  "customer": {
    "personaTraits": ["registered appearance or behavior trait"],
    "problem": "registered visible symptom",
    "hiddenCause": "registered hidden cause paired with the problem"
  },
  "patienceTier": 0,
  "history": [],
  "availableClues": [
    { "id": "clue_id", "text": "observable clue" }
  ]
}
```

See `infra/llm-layer/scripts/dialogue-smoke.mjs` for a complete request using
registered game data.

Response:

```json
{
  "npcLine": "My cough always worsens before dawn.",
  "choices": [
    { "label": "How have you been spending your nights?", "verb": "indirect", "patienceCost": 1 },
    { "label": "Have you been working somewhere cold?", "verb": "direct", "patienceCost": 2 },
    {
      "label": "[Observe] Inspect the wear on the customer's hands",
      "verb": "observe",
      "patienceCost": 0,
      "clueReveals": ["clue_id"]
    },
    { "label": "[Prepare medicine]", "verb": "craft", "patienceCost": 0 }
  ]
}
```

Contract rules:

- `indirect`, `direct`, `observe`, and `craft` must each appear exactly once.
- `clueReveals` may contain only IDs from the request's `availableClues`.
- The server stamps patience costs; model-supplied costs are not trusted.
- Unknown fields, personas, and `problem`/`hiddenCause` pairs are rejected.
- The client must treat `x-llm-fallback: true` as valid deterministic dialogue,
  not as a transport failure.

## Current deployment configuration

Deployment defaults live in `infra/llm-layer/samconfig.toml`.

| Setting | Current value |
|---|---|
| AWS account | `141840355276` |
| Region | `ap-northeast-2` |
| Application stack | `nhn-game-llm-layer` |
| Model | `global.amazon.nova-2-lite-v1:0` |
| Allowed model profiles | `both` (Nova and Haiku) |
| Allowed Origin | `https://alstjgg.github.io` |
| Maximum model output | 400 tokens |
| Model timeout | 7 seconds |
| Lambda timeout | 10 seconds |
| Request body limit | 32 KiB |
| Reserved concurrency | unset (`-1`) |
| API rate / burst | 1 request/second / 2 requests |
| Artifact bucket | `nhn-game-llm-artifacts-141840355276-ap-northeast-2` |
| CloudFormation execution role | `nhn-game-llm-cloudformation-exec` |

## Local deployment

SSO is required only for local AWS operations:

```bash
cd infra/llm-layer
aws sso login --profile nhn-game --use-device-code
npm run aws:preflight
npm run check
npm run sam:validate
npm run sam:build
sam deploy --profile nhn-game
```

`aws:preflight` stops if the active account is not `141840355276`.
`samconfig.toml` directs artifacts to the dedicated bucket and delegates stack
operations to the CloudFormation execution role. Review the generated change
set before confirming the local deployment.

After deployment, warm the production schema once and verify the deployed
endpoint:

```bash
AWS_PROFILE=nhn-game npm run warmup -- \
  --model-id global.amazon.nova-2-lite-v1:0

npm run smoke -- \
  --url https://API_ID.execute-api.ap-northeast-2.amazonaws.com/ai/dialogue \
  --model-id global.amazon.nova-2-lite-v1:0
```

The smoke command checks health, a live dialogue, CORS, a rejected Origin, and
the body limit. Add `--check-throttle --audit-logs --profile nhn-game` to also
check throttling and the CloudWatch log-safety contract.

## GitHub Actions

`.github/workflows/llm-layer.yml` behaves as follows:

- Pull requests to `main` run install, tests, SAM/bootstrap validation, build,
  and local SAM smoke checks. They never deploy.
- Matching pushes to `main`, or a manual run from `main`, run the same
  verification and then deploy the application stack.
- Deployment uses GitHub OIDC to assume `nhn-game-llm-github-deploy`; GitHub
  Actions does not use the local SSO profile.
- After deployment, the workflow reads and validates the stack outputs, then
  checks health, live Bedrock dialogue, CORS, rejected Origin, body limits, and
  CloudWatch logs.

The bootstrap stack is deliberately separate from the application stack.
Update `deploy/github-actions-bootstrap.yaml` locally with SSO only when the
OIDC roles or artifact bucket must change. The regular deployment must not
create, replace, or delete IAM roles or protected core resources.

That also applies to `AllowedProfileMode`, which is a parameter of the
application stack but rewrites the execution role's inline policy. Neither CI
nor the default local deploy can apply it; use the `elevated` samconfig
environment and keep both environments in sync. See
[`docs/handoffs/llm-lambda-runtime.md`](../../docs/handoffs/llm-lambda-runtime.md)
under "Narrowing the Bedrock model allowlist".

## Required checks by change

| Changed area | Required checks |
|---|---|
| Handler, validation, or fallback | `npm run check`, `npm run sam:smoke` |
| SAM, IAM, or API | Previous checks, `npm run sam:validate`, and change-set review |
| Prompt, schema, or model | Previous checks, warm-up, and deployed `npm run smoke` |
| Customer or clue data | The data-sync test included in `npm run check` |
| Origin or endpoint | CORS preflight and a browser check from the deployed GitHub Pages site |

For operational commands and deployed resource values, see
[`docs/handoffs/llm-lambda-runtime.md`](../../docs/handoffs/llm-lambda-runtime.md).

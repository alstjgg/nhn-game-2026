# Apothecary Lambda/Bedrock Production Runbook

This is the operating guide for the Apothecary dialogue Lambda. For the API
contract and implementation map, see
[`services/apothecary-llm-layer/README.md`](../../services/apothecary-llm-layer/README.md).

## Runtime

```text
GitHub Pages
  -> API Gateway HTTP API
  -> Node.js 24 Lambda
  -> Amazon Bedrock Converse
```

The public API has exactly two routes:

- `POST /ai/dialogue`: return one validated NPC line and four choices.
- `GET /ai/health`: report capabilities without invoking Bedrock.

Portraits are pre-generated assets. There is no runtime image generation,
session store, streaming endpoint, or player free-text input UI. The customer
identity in a request is registry-checked, but `history[].npcLine`,
`history[].playerChoiceLabel`, and `availableClues[].text` are client-supplied
strings bounded only by length and count, and they reach the prompt verbatim —
an accepted, mitigated residual risk, not an absence of free text. See the
validation boundary in [`llm-layer.md`](../../planning/handoffs/llm-layer.md).

## Production inventory

| Item | Value |
|---|---|
| AWS account | `141840355276` |
| Region | `ap-northeast-2` |
| Local CLI profile | `nhn-game` |
| Application stack | `nhn-game-llm-layer` |
| Bootstrap stack | `nhn-game-github-actions` |
| API ID | `zcyeajmv11` |
| Lambda | `nhn-game-llm-layer-turn` |
| Active model | `global.amazon.nova-2-lite-v1:0` |
| Allowed Origin | `https://alstjgg.github.io` |
| GitHub deploy role | `nhn-game-llm-github-deploy` |
| CloudFormation role | `nhn-game-llm-cloudformation-exec` |
| Artifact bucket | `nhn-game-llm-artifacts-141840355276-ap-northeast-2` |
| Lambda logs | `/aws/lambda/nhn-game-llm-layer-turn` |
| API logs | `/aws/apigateway/nhn-game-llm-layer` |

Endpoints:

```text
https://zcyeajmv11.execute-api.ap-northeast-2.amazonaws.com/ai/dialogue
https://zcyeajmv11.execute-api.ap-northeast-2.amazonaws.com/ai/health
```

The Lambda name keeps its historical `-turn` suffix to avoid replacing the
existing CloudFormation resource. The API contract is dialogue-only.

## Guardrails

| Guardrail | Value |
|---|---|
| Model output | 400 tokens |
| Model / API / Lambda timeout | 7 s / 9 s / 10 s |
| Request body | 32 KiB |
| API rate / burst | 1 / 2 |
| Reserved concurrency | `-1` (unset) |
| Emergency kill switch | deploy reserved concurrency `0` |

Lambda validates Origin, content type, body size, registered customer data,
model output, choice verbs, and clue IDs. It invokes Bedrock once with SDK
retries disabled.

Both a validated model result and deterministic fallback return HTTP 200:

- `x-llm-fallback: false`: validated Bedrock output.
- `x-llm-fallback: true`: deterministic server fallback.
- `x-request-id`: request trace ID.

Key infrastructure files:

| Responsibility | File |
|---|---|
| Application stack | `services/apothecary-llm-layer/template.yaml` |
| OIDC roles and artifact bucket | `services/apothecary-llm-layer/deploy/github-actions-bootstrap.yaml` |
| Replacement/deletion protection | `services/apothecary-llm-layer/deploy/application-stack-policy.json` |
| CI/CD | `.github/workflows/llm-layer.yml` |

## Local verification

These checks do not require AWS credentials or call Bedrock:

```bash
cd "$(git rev-parse --show-toplevel)/services/apothecary-llm-layer"
npm ci
npm run check
npm run sam:validate
npm run bootstrap:validate
npm run sam:build
npm run sam:smoke
```

Authenticate only for local AWS operations:

```bash
aws sso login --profile nhn-game --use-device-code
npm run aws:preflight
```

Always use the `nhn-game` profile. The underlying SSO session name is
machine-local.

## Deployment

### GitHub Actions

`.github/workflows/llm-layer.yml` behaves as follows:

- Pull requests to `main`: test, validate, build, and bundle smoke only.
- Relevant pushes to `main`: verify, deploy the application stack, then run
  the production smoke test.
- `workflow_dispatch`: deploys only when run from `main`.

The deploy job builds before assuming `nhn-game-llm-github-deploy`, verifies
account `141840355276`, uploads artifacts under the commit SHA, and delegates
the stack update to `nhn-game-llm-cloudformation-exec`.

The OIDC trust is limited to this immutable repository identity and `main`:

```text
repo:alstjgg@26458319/nhn-game-2026@1306590172:ref:refs/heads/main
```

Deployments share concurrency group `nhn-game-llm-layer-production` and are not
cancelled in progress. The workflow validates the stack outputs and runs health,
live dialogue, CORS, body-limit, and CloudWatch telemetry checks after deploy.

### Manual application deployment

```bash
cd "$(git rev-parse --show-toplevel)/services/apothecary-llm-layer"
aws sso login --profile nhn-game --use-device-code
npm run aws:preflight
npm run check
npm run sam:validate
npm run sam:build
sam deploy --profile nhn-game
```

`samconfig.toml` supplies the stack, region, parameters, artifact bucket, and
CloudFormation execution role. Review the change set before approval.

Expected changes are limited to existing Lambda code/configuration, API
routes/integrations/permissions, the active `ModelId`, log retention, and
throttling. Stop for an unexpected resource, public endpoint, IAM wildcard,
or protected-resource replacement/deletion.

`ModelId` is a Lambda environment variable and deploys on this path.
`AllowedProfileMode` is not: it rewrites the execution role's inline policy and
requires the elevated path below.

### Bootstrap deployment

The separate bootstrap stack owns the OIDC provider, deployment roles, and
artifact bucket. Update it only with local SSO:

```bash
cd "$(git rev-parse --show-toplevel)/services/apothecary-llm-layer"
aws sso login --profile nhn-game --use-device-code
npm run aws:preflight
npm run bootstrap:validate

aws cloudformation deploy \
  --profile nhn-game \
  --region ap-northeast-2 \
  --stack-name nhn-game-github-actions \
  --capabilities CAPABILITY_NAMED_IAM \
  --template-file deploy/github-actions-bootstrap.yaml
```

### Verifying the application stack policy

Nothing verified for a while that the replacement/deletion policy was actually
attached to the live stack — `bootstrap:validate` only parses the JSON. The
deploy workflow now carries a post-deploy check for it, **commented out**, because
the deploy role needs `cloudformation:GetStackPolicy` first. That grant is already
in `deploy/github-actions-bootstrap.yaml`; it reaches the account only through the
bootstrap deployment above.

To activate, in this order:

1. Deploy the bootstrap stack with local SSO (previous section).
2. Confirm the grant landed:

```bash
aws cloudformation get-stack-policy \
  --profile nhn-game \
  --region ap-northeast-2 \
  --stack-name nhn-game-llm-layer \
  --query StackPolicyBody --output text
```

3. Uncomment the "Verify the application stack policy is attached" step in
   `.github/workflows/llm-layer.yml` and merge.

Enabling it before step 1 makes every deploy fail with `AccessDenied`. The check
is read-only by design: `cloudformation:SetStackPolicy` is deliberately not
granted, since it could also remove the protection.

Restore the application stack policy if it is ever removed:

```bash
aws cloudformation set-stack-policy \
  --profile nhn-game \
  --region ap-northeast-2 \
  --stack-name nhn-game-llm-layer \
  --stack-policy-body file://deploy/application-stack-policy.json
```

IAM creation/mutation and protected-resource replacement are outside the
automatic application deployment path.

### Narrowing the Bedrock model allowlist

`AllowedProfileMode` controls which Bedrock inference profiles the execution
role may invoke. It stays `both` while the operating-model decision is open —
see "Open decision — model selection" in
[`planning/research/llm-backend-aws-bedrock.md`](../../planning/research/llm-backend-aws-bedrock.md). Narrow it
once that decision is recorded.

Changing it rewrites the inline policy on `LlmExecutionRole`, so CloudFormation
calls `iam:PutRolePolicy`. `nhn-game-llm-cloudformation-exec` holds only
`iam:GetRole`, `iam:GetRolePolicy`, `iam:ListAttachedRolePolicies`,
`iam:ListRolePolicies`, and `iam:PassRole`, so both GitHub Actions and the
default local deploy fail this change with `AccessDenied`. That restriction is
deliberate: granting the role `iam:PutRolePolicy` over
`role/nhn-game-llm-layer-*` would let anything holding it write an
administrator policy onto a role it can already reach through the Lambda.

Narrow it with the `elevated` samconfig environment, which uses the same stack
and parameters but omits `role_arn`, so the change set runs under the operator's
own SSO identity:

1. Edit `parameter_overrides` in **both** `[default.deploy.parameters]` and
   `[elevated.deploy.parameters]` in `samconfig.toml`, setting
   `AllowedProfileMode` to `nova` or `haiku`. `npm run check` fails if the two
   environments drift; leaving `[default]` on `both` makes the next CI deploy
   replay the old value and fail on the same denial.
2. Confirm `ModelId` names a profile the new mode still allows. The template's
   `SelectedModelMustBeAllowed` rule rejects the change set otherwise.
3. Deploy once with elevated credentials and review the change set. Expect an
   `LlmExecutionRole` policy modification and nothing else:

```bash
cd "$(git rev-parse --show-toplevel)/services/apothecary-llm-layer"
aws sso login --profile nhn-game --use-device-code
npm run aws:preflight
npm run check
npm run sam:build
sam deploy --config-env elevated --profile nhn-game
```

4. Verify the surviving permission and that dialogue still runs live:

```bash
aws iam get-role-policy \
  --profile nhn-game \
  --role-name "$(aws cloudformation describe-stack-resource \
    --profile nhn-game --region ap-northeast-2 \
    --stack-name nhn-game-llm-layer \
    --logical-resource-id LlmExecutionRole \
    --query 'StackResourceDetail.PhysicalResourceId' --output text)" \
  --policy-name InvokeAllowlistedGlobalBedrockProfiles

npm run smoke -- \
  --url https://zcyeajmv11.execute-api.ap-northeast-2.amazonaws.com/ai/dialogue \
  --health-url https://zcyeajmv11.execute-api.ap-northeast-2.amazonaws.com/ai/health \
  --model-id global.amazon.nova-2-lite-v1:0
```

Commit the `samconfig.toml` change. The following CI deploy then produces an
empty change set for this parameter.

## Post-deployment checks

Confirm the live routes:

```bash
aws apigatewayv2 get-routes \
  --profile nhn-game \
  --region ap-northeast-2 \
  --api-id zcyeajmv11 \
  --query 'Items[].RouteKey'
```

Read the stack outputs:

```bash
aws cloudformation describe-stacks \
  --profile nhn-game \
  --region ap-northeast-2 \
  --stack-name nhn-game-llm-layer \
  --query 'Stacks[0].Outputs'
```

Warm the production schema, then verify the endpoint:

```bash
AWS_PROFILE=nhn-game npm run warmup -- \
  --model-id global.amazon.nova-2-lite-v1:0

npm run smoke -- \
  --url https://zcyeajmv11.execute-api.ap-northeast-2.amazonaws.com/ai/dialogue \
  --health-url https://zcyeajmv11.execute-api.ap-northeast-2.amazonaws.com/ai/health \
  --model-id global.amazon.nova-2-lite-v1:0
```

Acceptance requires health HTTP 200, all four dialogue verbs,
`x-llm-fallback: false`, the exact allowed Origin, wrong-Origin HTTP 403, and
oversized-body HTTP 413.

Add `--audit-logs --profile nhn-game` for CloudWatch validation. Add
`--check-throttle` only for a deliberate burst test. Never use
`--allow-fallback` as deployment acceptance.

## Operations

- CORS and Origin checks are browser controls, not authentication.
- Bedrock access is limited to inference profiles in the SAM template.
- Logs contain request ID, model, latency, token counts, fallback state, and
  safe error codes only.
- Logs must not contain customer data, hidden causes, prompts, dialogue, clue
  text, or raw model output.
- The artifact bucket blocks public access, requires TLS, and uses encryption
  and versioning.

| Symptom | Check |
|---|---|
| OIDC failure | Bootstrap `TrustedSubject`, repository IDs, and workflow ref |
| Wrong account | `npm run aws:preflight` |
| Health 403 | Request Origin versus `AllowedOrigin` |
| Health timeout | Lambda cold start and API timeout |
| Dialogue fallback | Bedrock access, Lambda IAM, timeout, `fallbackCodes` |
| Dialogue 429 | API rate/burst settings |
| Pages-only failure | CORS preflight and build-time API root |
| Model init failure | `MODEL_ID` versus the deployed allowlist |
| CloudFormation denial | IAM mutation or protected replacement/deletion |
| `iam:PutRolePolicy` denial | `AllowedProfileMode` changed on a non-elevated deploy |

Recent Lambda logs:

```bash
aws logs tail /aws/lambda/nhn-game-llm-layer-turn \
  --profile nhn-game \
  --region ap-northeast-2 \
  --since 10m
```

## Client boundary

The static client receives only the API root at build time:

```text
VITE_AI_BASE_URL=https://zcyeajmv11.execute-api.ap-northeast-2.amazonaws.com
```

If health or dialogue fails, the client must continue with bundled authored
data. Portraits always use bundled, manifested assets.

For local testing against production AWS, use the loopback-only Vite proxy:

```bash
cd demos/apothecary
npm run dev:lambda -- --host 127.0.0.1
```

Do not expose that proxy on `0.0.0.0`. Game wiring and Pages deployment remain
separate from the Lambda infrastructure workflow.

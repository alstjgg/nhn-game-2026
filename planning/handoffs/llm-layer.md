# Decision Record — Apothecary LLM Layer

> Historical handoff. This file records the decisions that survived
> implementation and live testing; it is not an operating runbook.
>
> For current resource values, commands, deployment checks, and troubleshooting,
> use [the Lambda/Bedrock operating guide](../../docs/handoffs/llm-lambda-runtime.md).

## Final outcome

The project adopted a thin, stateless runtime path:

```text
GitHub Pages
  -> API Gateway HTTP API
  -> Node.js Lambda
  -> Amazon Bedrock Converse
```

The deployed product contract contains only:

- `POST /ai/dialogue` — generate one validated Apothecary dialogue beat.
- `GET /ai/health` — report runtime capabilities without invoking Bedrock.

There is no runtime portrait endpoint. Portraits are generated before release,
recorded in the asset manifest, and shipped with the static game.

## Decisions retained after implementation

| Area | Final decision |
|---|---|
| Runtime shape | One stateless Lambda behind one HTTP API |
| State ownership | The client owns game state and sends bounded context per request |
| Model API | Bedrock Runtime `Converse` with a forced tool response |
| Current model | `global.amazon.nova-2-lite-v1:0` |
| Region | Lambda calls Bedrock from `ap-northeast-2` through a Global inference profile |
| Dialogue scope | One Bedrock call produces one opening dialogue beat and four choices |
| Images | Pre-generated, manifested assets only |
| Failure behavior | Valid requests degrade to a deterministic playable response |
| Credentials | AWS credentials remain server-side; the browser receives none |

Nova 2 Lite operates on live verification of access and schema behavior, not on
the model-selection benchmark the earlier plan required. That benchmark targeted
a different concept and was dropped here — see "Open decision — model selection"
in [the decision record](../research/llm-backend-aws-bedrock.md). Other models may remain
template-allowlisted for controlled evaluation, but changing the operating model
requires an explicit access, schema, IAM, latency, and quality check.

## Validation and fallback boundary

Lambda is the trust boundary for model input and output. It:

- accepts structured game data only, with no player free-text field. The
  customer identity is registry-checked: persona traits and the
  `problem`/`hiddenCause` pair must match the server's own tables. The
  remaining fields — `history[].npcLine`, `history[].playerChoiceLabel`, and
  `availableClues[].text` — are client-supplied strings bounded only by length
  and count (roughly 9 KB in total), because procedural clues have no
  server-side roster to check against. They reach the prompt verbatim, so this
  is an accepted, mitigated residual risk rather than an absence of free text;
  the mitigations are the rate limit, the output-token cap, the system-prompt
  rule that data is state and not instruction, and the output validation below;
- rejects unknown fields and unregistered customer traits or ailment pairs;
- enforces request-size and history limits;
- validates the returned dialogue schema, choice verbs, and clue identifiers;
- replaces model-supplied patience costs with server-owned values; and
- converts timeouts, provider errors, and invalid model output into a
  deterministic fallback.

A validated Bedrock result and a fallback both return a playable dialogue
response. The `x-llm-fallback` response header distinguishes them, while
`x-request-id` supports tracing.

## Responsibility boundary

Lambda owns:

- Origin and content-type checks;
- prompt assembly and Bedrock invocation;
- request and response validation;
- deterministic fallback;
- restricted telemetry; and
- least-privilege Bedrock access.

The client owns:

- customer progression and game state;
- authored dialogue outside the bounded live opening;
- final gameplay rules and outcomes;
- prefetch timing and UI degradation; and
- bundled portraits and authored fallback data.

The runtime deliberately has no session database, RAG layer, streaming
transport, persistent memory, or image-generation provider.

## Cost and operational guardrails

The public demo uses several layers of protection:

- an exact allowed browser Origin;
- API Gateway stage rate and burst limits;
- Lambda timeout, plus a concurrency kill switch that is deployed unset
  (`ReservedConcurrency=-1`). The effective spend ceiling today is therefore the
  1 rps / burst 2 stage throttle plus a manual redeploy at `0`, not a reserved
  concurrency guardrail. Set a small positive value once account quota allows;
- a bounded request body and output-token limit;
- no automatic SDK retry;
- an IAM allowlist for Bedrock inference profiles; and
- CloudWatch logs that omit customer content, prompts, clues, and model text.

CORS and Origin checks are not authentication, and throttling is not a hard
spending ceiling. Long-term public operation requires a separate decision on
authentication, stronger quotas, and shutdown policy.

## Superseded assumptions

Early planning considered a concept-agnostic multi-agent decision service,
runtime image generation, persistent sessions, and broader orchestration.
None of those assumptions is part of the final Apothecary runtime.

The source code and SAM template are authoritative for implementation details.
The [operating guide](../../docs/handoffs/llm-lambda-runtime.md) is authoritative for deployment
and support procedures.

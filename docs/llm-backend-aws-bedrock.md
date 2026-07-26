# Decision Record — Thin AWS/Bedrock Backend

> Historical architecture record. This document explains why the project chose
> its backend shape; it is not a deployment guide.
>
> For current endpoints, AWS resources, commands, and incident checks, use
> [the Lambda/Bedrock operating guide](./handoffs/llm-lambda-runtime.md).

## Decision

Use a thin server-side boundary between the static game and Amazon Bedrock:

```text
GitHub Pages
  -> API Gateway HTTP API
  -> Lambda
  -> Bedrock Runtime Converse
```

The backend is stateless and dialogue-only. The final public routes are:

- `POST /ai/dialogue`
- `GET /ai/health`

The browser never receives AWS credentials and never calls Bedrock directly.

## Why this architecture was selected

GitHub Pages is sufficient for the game itself, but a static client cannot
safely hold model credentials or enforce model input, output, and cost limits.
A small Lambda provides that security and validation boundary without adding an
always-on server.

API Gateway HTTP API was selected because the product needs a small JSON API,
CORS handling, throttling, access logs, and Lambda integration. A session
service, container runtime, WebSocket transport, and streaming response path
would add operating cost and complexity without improving the bounded dialogue
interaction.

Bedrock Runtime `Converse` provides a consistent model interface and supports
tool-shaped structured output. The current operating model is
`global.amazon.nova-2-lite-v1:0`.

## Product scope

Each valid dialogue request contains bounded, structured game context:

- registered customer traits;
- an exact registered symptom and hidden-cause pair;
- a small dialogue history;
- the current patience tier; and
- an allowlist of observable clues.

The model returns one NPC line and exactly four choices: indirect question,
direct question, observation, and crafting. The game engine remains
authoritative for state transitions, costs, prescriptions, and outcomes.

Portrait generation is outside the runtime. Portraits are pre-generated,
reviewed, added to the asset manifest, and served with the static client.

## Safety and failure policy

Lambda validates both sides of the model call:

1. Reject malformed, oversized, unknown, or unregistered input before Bedrock.
2. Build the prompt from server-approved structured fields.
3. Invoke Bedrock once with no SDK retry and a bounded timeout.
4. Validate the tool response, choice set, clue IDs, and visible labels.
5. Stamp server-owned patience costs.
6. Return a deterministic playable fallback if the provider times out, fails,
   or returns invalid output.

Provider failure does not block the game. A valid request still receives a
dialogue response, and `x-llm-fallback` tells the client whether Bedrock or the
deterministic fallback produced it. Invalid client requests return a bounded
public error instead of invoking the model.

## Security and cost guardrails

The accepted design includes:

- exact-Origin CORS plus a matching Lambda Origin check;
- a request-body limit and output-token cap;
- API Gateway rate and burst throttling;
- short API, Lambda, and model timeouts;
- no automatic model retry;
- IAM access limited to explicitly allowlisted Bedrock resources;
- short CloudWatch log retention; and
- telemetry that excludes prompts, customer content, dialogue text, clues,
  model output, and authorization data.

These controls reduce accidental use and bound individual requests. They do not
authenticate non-browser callers and do not create an absolute monthly cost
ceiling. A longer-lived public service would need stronger authentication,
quota enforcement, alarms, and a documented shutdown mechanism.

## Rejected alternatives

The project rejected:

- direct browser-to-Bedrock calls;
- an always-on EC2, container, or application server;
- Bedrock Agents, AgentCore, Knowledge Bases, RAG, and persistent memory;
- server-owned game sessions;
- SSE or WebSocket streaming for the MVP;
- player free-text sent to the model; and
- runtime image generation.

These options either exposed credentials, weakened the structured game
boundary, or added cost and operations without serving the tested interaction.

## Consequences

The chosen backend is inexpensive at idle, deployable as infrastructure as
code, and easy for the client to replace with authored data during failure. Its
tradeoff is that the public endpoint remains discoverable, and model quality is
bounded by validation rather than guaranteed by it.

Implementation details belong in the source and SAM template. Operational
procedures belong in
[the Lambda/Bedrock operating guide](./handoffs/llm-lambda-runtime.md).

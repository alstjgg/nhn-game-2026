# Decision Record — Thin AWS/Bedrock Backend

> Historical architecture record. This document explains why the project chose
> its backend shape; it is not a deployment guide.
>
> For current endpoints, AWS resources, commands, and incident checks, use
> [the Lambda/Bedrock operating guide](../../docs/handoffs/llm-lambda-runtime.md).

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

## Open decision — model selection

The earlier research note carried a model-selection benchmark (~90 runs per
candidate, p95 ≤ 6 s). It was written for the Agent Arena concept and scored
things the Apothecary dialogue contract does not have — `reasonCardId` citation,
action and target legality — so it is deliberately not restored here. Re-running
a protocol built for a different game would invite the wrong comparison.

Three questions are open. The dropped benchmark had merged them into one.

### 1. Which model operates — Nova 2 Lite or Haiku 4.5

Decide it on dialogue quality. The model's entire output is the opening line and
four choice labels for two customers per playthrough — a judge's first
impression of each. The other axes are near-ties: latency degrades to the
deterministic fallback rather than failing, and is dominated by server-capped
output length; cost is a real 2.5× ratio but about $0.48 per 100 playthroughs at
the deployed token shape; and Haiku's `strict` grammar buys model-side schema
enforcement at the price of the decision-12 warm-up that Nova does not need.

### 2. How to compare quality — proposed protocol, not yet approved

Quality is unmeasured. `parseDialogueBeat` encodes a floor — no question mark in
`npcLine`, no meta-worded choice labels, fixed `[관찰]` and craft labels — but
nothing scores period register, tier-appropriate mood, or whether a line adds
anything beyond the `problem` string it was handed.

Proposed:

- **Held fixed:** the deployed prompt, `MAX_TOKENS=400`, reasoning off. Only
  `modelId` varies, or the comparison measures the guardrails, not the model.
- **Inputs:** all 7 registered ailment pairs at `patienceTier` 0 with empty
  history — the only request shape production sends (`app/roster.ts`). 5 runs
  each: 35 lines per model.
- **Run:** locally through the Lambda's own prompt builder and validator,
  extending `scripts/dialogue-warmup.ts`, so it neither contends with the 1 rps
  production throttle nor pollutes production telemetry. Well under $1 in total.
- **Score:** blind. Model identity stripped, order shuffled, both members score
  independently against the prompt's own rules — stays in period register; never
  volunteers the hidden cause; adds concrete detail beyond `problem`; the four
  choices are genuinely different approaches. Plus one holistic 1–5, "do I want
  to know more about this customer".
- **Decision rule, fixed before the run:** any hidden-cause leak disqualifies
  that model. Otherwise the higher holistic mean wins. If the two scorers
  disagree on rank, or the means differ by less than 0.5, keep the cheaper Nova.
- **Collected alongside at no extra cost:** per-model `invalid_model_output`
  rate, latency, and token counts.

### 3. Whether any broader benchmark is still needed

Answerable only after question 2 runs. If the `invalid_model_output` rate and
cost collected there are conclusive, record an explicit decision to skip the
statistical benchmark instead of leaving the earlier plan's procedure nominally
outstanding.

Until question 1 is recorded, `AllowedProfileMode` stays `both`, and Nova 2 Lite
operates on live verification — Bedrock access, schema behavior,
`x-llm-fallback: false`, CORS, and CloudWatch telemetry — rather than on a
benchmark. Narrowing the allowlist is gated on that decision.

## Consequences

The chosen backend is inexpensive at idle, deployable as infrastructure as
code, and easy for the client to replace with authored data during failure. Its
tradeoff is that the public endpoint remains discoverable, and model quality is
bounded by validation rather than guaranteed by it.

Implementation details belong in the source and SAM template. Operational
procedures belong in
[the Lambda/Bedrock operating guide](../../docs/handoffs/llm-lambda-runtime.md).

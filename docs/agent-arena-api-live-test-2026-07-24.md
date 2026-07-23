# Agent Arena API live verification — 2026-07-24

This is a redacted live-provider verification record. Provider credentials were
loaded only by the service runtime and were never printed, copied into source or
this report, or otherwise persisted by the test harness. Model targets were
supplied as server-side environment overrides for this command only:

- OpenAI: `gpt-5.4-mini`
- Anthropic: `claude-haiku-4-5`

The repository `.env.local` files were not changed.

## Final successful runs

Both adapters completed the core session matrix and the two agent capability
scenarios through their real provider APIs.

| Scenario | OpenAI Responses | Claude Messages |
|---|---|---|
| No tool | passed | passed |
| Two-turn context | passed; prior marker retained | passed; prior marker retained |
| Function tool | passed; completed function trace | passed; completed function trace |
| Compact | passed; `native` | passed; `explicit-summary-fallback` |
| Continue after compact | passed; compacted marker retained | passed; compacted marker retained |
| Clear and continue | passed; prior marker absent and `FRESH_CONTEXT` present | passed; prior marker absent and `FRESH_CONTEXT` present |
| Remote MCP | passed; completed `calculate` trace and result marker | passed; completed `calculate` trace and result marker |
| Hosted Skill | passed; completed hosted-Skill trace and instruction marker | passed; completed hosted-Skill trace and instruction marker |

Each provider performed five core turn invocations, one compact invocation, and
two capability turn invocations.

## Actual validated decisions

Representative no-tool results:

```json
{
  "openai": {
    "actionId": "defend",
    "targetId": "ally",
    "speech": "I’ll protect us.",
    "reasonSummary": "Defend is the safest available action and can prevent damage to the ally.",
    "attributedCardIds": []
  },
  "anthropic": {
    "actionId": "defend",
    "targetId": "ally",
    "speech": "I'll shield you from harm.",
    "reasonSummary": "Defending the ally with 20 HP is the safest action to reduce incoming damage and preserve team survival.",
    "attributedCardIds": ["answer-briefly-v1"]
  }
}
```

Actual function-tool results:

```json
{
  "openai": {
    "toolTrace": "function completed",
    "actionId": "defend",
    "targetId": "ally",
    "speech": "I’ll defend you.",
    "reasonSummary": "Defend is the lower-risk legal action and protects the ally.",
    "attributedCardIds": []
  },
  "anthropic": {
    "toolTrace": "function completed",
    "actionId": "defend",
    "targetId": "ally",
    "speech": "Defending ally now for maximum protection.",
    "reasonSummary": "Defend action has lower risk (0.3) than wait (0.7). Allied health at 20 requires proactive defense.",
    "attributedCardIds": ["risk-check-v1", "answer-briefly-v1"]
  }
}
```

Actual remote-MCP results:

```json
{
  "openai": {
    "toolTrace": "mcp arena-calculator.calculate completed",
    "actionId": "defend",
    "targetId": "ally",
    "speech": "I'll defend the ally.",
    "reasonSummary": "MCP_RESULT_20 supports defending the ally.",
    "attributedCardIds": ["calculator-mcp-v1"]
  },
  "anthropic": {
    "toolTrace": "mcp arena-calculator.calculate completed",
    "actionId": "defend",
    "targetId": "ally",
    "speech": "Defend the ally now before taking damage.",
    "reasonSummary": "Ally HP is low at 20. MCP_RESULT_20 calculated. Defend protects.",
    "attributedCardIds": ["calculator-mcp-v1"]
  }
}
```

The MCP scenario asked the allowlisted `calculate` tool for 10 percent of 200.
The expected result was not disclosed in the final verification prompt: the
model had to form `MCP_RESULT_<value>` from the tool's `percent_of_value` field.
It passed only when the provider returned a completed MCP trace and the validated
decision contained both `MCP_RESULT_20` and the expected card attribution.

Actual hosted-Skill results:

```json
{
  "openai": {
    "toolTrace": "skill Arena Tactics completed",
    "actionId": "defend",
    "targetId": "ally",
    "speech": "Defending the ally now.",
    "reasonSummary": "ARENA_SKILL_EXECUTED_731 Safe legal defend chosen for ally protection.",
    "attributedCardIds": ["arena-tactics-v1"]
  },
  "anthropic": {
    "toolTrace": "skill text_editor_code_execution completed",
    "actionId": "defend",
    "targetId": "ally",
    "speech": "Defending the ally now!",
    "reasonSummary": "Defend ally with strong protection. ARENA_SKILL_EXECUTED_731",
    "attributedCardIds": ["arena-tactics-v1"]
  }
}
```

The same reviewed `arena-tactics` Skill fixture was uploaded separately to each
provider and referenced by an immutable provider-specific version. The scenario
passed only when a completed hosted-Skill trace, the
`ARENA_SKILL_EXECUTED_731` marker, and the expected card attribution were all
present. A plausible text answer without that evidence would fail.

Continuity was checked from validated output rather than inferred from token
growth:

- the second-turn and post-compact decisions from both providers contained
  `arena-context-marker-7`;
- the post-clear decisions contained `FRESH_CONTEXT` and did not contain the
  previous marker.

No provider-native payload or hidden reasoning was written to this report.

## Measured usage and estimated cost

Usage returned by the final successful turn calls:

| Provider | Input | Cached input | Output | Reasoning | Total |
|---|---:|---:|---:|---:|---:|
| OpenAI | 1,817 | 0 | 319 | 0 | 2,136 |
| Anthropic | 4,370 | 0 | 436 | unavailable | 4,806 |

At the public standard token rates available on the test date, the final
successful turn calls are approximately:

- OpenAI `gpt-5.4-mini`: **$0.002798**
- Claude Haiku 4.5: **$0.006550**
- combined: **$0.009348**

The final successful capability-only run used:

| Provider | Input | Cached input | Output | Reasoning | Total | Approx. model-token cost |
|---|---:|---:|---:|---:|---:|---:|
| OpenAI | 2,169 | 0 | 200 | 46 | 2,369 | $0.002527 |
| Anthropic | 9,023 | 0 | 320 | unavailable | 9,343 | $0.010623 |
| Combined | 11,192 | 0 | 520 | — | 11,712 | **$0.013150** |

Those figures cover the two final MCP/Skill turn calls per provider. Hosted
execution can also have provider-specific container charges or free-tier
allowances; those are separate from model-token estimates. The provider billing
dashboards remain authoritative.

After removing the expected MCP value from the prompt, a narrow MCP-only
confirmation run used:

| Provider | Input | Cached input | Output | Reasoning | Total | Approx. model-token cost |
|---|---:|---:|---:|---:|---:|---:|
| OpenAI | 576 | 0 | 90 | 0 | 666 | $0.000837 |
| Anthropic | 2,552 | 0 | 171 | unavailable | 2,723 | $0.003407 |
| Combined | 3,128 | 0 | 261 | — | 3,389 | **$0.004244** |

The combined model-token estimate for the successful capability run plus that
stronger MCP confirmation is **$0.017394**.

There were lower-output-cap diagnostic attempts before the final core pass.
Across those core-matrix attempts, provider-reported turn usage was:

| Provider | Input | Output | Total | Approx. turn cost |
|---|---:|---:|---:|---:|
| OpenAI | 4,978 | 863 | 5,841 | $0.007617 |
| Anthropic | 16,093 | 1,711 | 17,804 | $0.024648 |
| Combined | 21,071 | 2,574 | 23,645 | **$0.032265** |

The shared compact contract does not expose compact-call usage, so compact calls
are not included in those cost calculations. Capability diagnostics and direct
provider protocol probes used while isolating provider errors are also not
included in the core-attempt table because they did not all pass through the
shared report accumulator.

Pricing references:

- <https://developers.openai.com/api/docs/pricing>
- <https://platform.claude.com/docs/en/about-claude/pricing>

## Test adjustment found by live validation

The first Claude compact probe used the turn smoke cap of 96 output tokens. Its
explicit summary reached `max_tokens` and correctly failed as
`provider_output_incomplete`. The smoke runner now:

- keeps normal turns cost-bounded;
- permits up to the production harness limit of 192 output tokens;
- uses the production harness output limit for compact summaries;
- records only validated `AgentDecision` values in its report.

Two additional provider constraints were found by the capability calls:

- OpenAI requires a hosted Skill version to be sent as a string, even when the
  immutable version contains only digits. The adapter now preserves the
  registry value as a string.
- Remote MCP and hosted Skill execution need a larger latency/output envelope
  than normal turns. Capability cases use the separate `agentic-4000` harness
  (`90s`, at most 512 output tokens), while the live runner caps them at 384
  output tokens by default.

The final runs with these production paths passed every configured scenario.

## Capability fixture and trust boundary

The remote test target is the public third-party calculator endpoint at
`https://mcpcalc.com/api/v1/mcp`. It is allowlisted as read-only, limited to its
`calculate` tool, receives no credential, and is suitable only for this synthetic
internal smoke test. A submitted or production deployment should replace it with
a team-owned HTTPS MCP endpoint or an approved secure tunnel.

The reviewed Skill fixture contains only a deterministic arena decision
procedure and marker. It has no network, write, secret, or arbitrary-path
instruction. The bootstrap command uploads it separately to each provider and
the registry references the returned immutable versions. Matching remote names
are not trusted automatically: the bootstrap now requires a new uploaded version
or an explicit unverified-reuse override, and reports the local fixture SHA-256
plus provenance. The tested bundle digest is
`2db3c7b0302a7b08b2754cbaa208c5f69a5c05ba63f7bcbb2f73b07a0bc5d294`.
An implicit-reuse probe found both existing provider resources and failed with
`existing_skill_requires_force_version_or_explicit_reuse` before any write or
model call, as intended.

API keys, provider Skill IDs, and provider Skill versions were not added to
source files or this report, and `.env.local` remained unchanged. The successful
claim is intentionally narrow: the exact allowlisted MCP card and reviewed Skill
fixture work through both current adapters and models. Arbitrary user-supplied
MCP servers or Skills remain unsupported and unverified.

Before printing a live report, the runner rejects decisions or tool traces that
echo a server-owned model target, Skill ID, MCP URL/authorization value,
or provider API key, then applies structural secret redaction as defense in
depth.

## Keyless and container evidence

The same source also passed:

- 146 tests across 11 files
- TypeScript typecheck
- OpenAPI semantic and response-contract validation
- production build
- `npm audit` with zero vulnerabilities
- non-root Docker health and filesystem checks
- four-turn mock HTTP E2E with three parallel agents, SSE replay, context
  continuity, compact replay, clear generation 2, and fresh-session continuation

# Agent Arena API live verification — 2026-07-24

> Redacted live-provider verification record. Credentials were loaded only by the
> service runtime — never printed, copied into source or this report, or persisted
> by the test harness. Model targets were supplied as server-side env overrides for
> this command only (`.env.local` unchanged): OpenAI `gpt-5.4-mini`, Anthropic
> `claude-haiku-4-5`.

## Summary

- **All 8 scenarios passed on both providers** (matrix below), including real
  remote MCP and hosted-Skill execution.
- Recorded model-token cost across all runs ≈ **$0.059** (final passes $0.027 +
  earlier diagnostics $0.032; compact-call usage and some probes excluded — see
  cost section).
- Live validation surfaced three runner/adapter fixes, all landed (see
  "Adjustments").
- The verified capability claim is **narrow**: the exact allowlisted calculator
  MCP card and reviewed `arena-tactics` Skill fixture — not arbitrary MCP/Skills.

## Scenario matrix

| Scenario | OpenAI Responses | Claude Messages |
|---|---|---|
| No tool | passed | passed |
| Two-turn context | passed; prior marker retained | passed; prior marker retained |
| Function tool | passed; completed function trace | passed; completed function trace |
| Compact | passed; `native` | passed; `explicit-summary-fallback` |
| Continue after compact | passed; compacted marker retained | passed; compacted marker retained |
| Clear and continue | passed; prior marker absent, `FRESH_CONTEXT` present | passed; prior marker absent, `FRESH_CONTEXT` present |
| Remote MCP | passed; completed `calculate` trace + result marker | passed; completed `calculate` trace + result marker |
| Hosted Skill | passed; completed hosted-Skill trace + instruction marker | passed; completed hosted-Skill trace + instruction marker |

Per provider: five core turn invocations, one compact invocation, two capability
turn invocations.

## Validated decisions (evidence)

Pass criteria were evidence-based, not plausibility-based: a scenario passed only
with the expected completed tool trace, fixture marker, and card attribution in
the **validated** decision. Continuity was checked from validated output, not
token growth: second-turn and post-compact decisions contained
`arena-context-marker-7`; post-clear decisions contained `FRESH_CONTEXT` and not
the prior marker. No provider-native payload or hidden reasoning was written to
this report.

No-tool:

```json
{
  "openai":    { "actionId": "defend", "targetId": "ally", "speech": "I’ll protect us.", "reasonSummary": "Defend is the safest available action and can prevent damage to the ally.", "attributedCardIds": [] },
  "anthropic": { "actionId": "defend", "targetId": "ally", "speech": "I'll shield you from harm.", "reasonSummary": "Defending the ally with 20 HP is the safest action to reduce incoming damage and preserve team survival.", "attributedCardIds": ["answer-briefly-v1"] }
}
```

Function tool (trace: `function completed` on both):

```json
{
  "openai":    { "actionId": "defend", "targetId": "ally", "speech": "I’ll defend you.", "reasonSummary": "Defend is the lower-risk legal action and protects the ally.", "attributedCardIds": [] },
  "anthropic": { "actionId": "defend", "targetId": "ally", "speech": "Defending ally now for maximum protection.", "reasonSummary": "Defend action has lower risk (0.3) than wait (0.7). Allied health at 20 requires proactive defense.", "attributedCardIds": ["risk-check-v1", "answer-briefly-v1"] }
}
```

Remote MCP (trace: `mcp arena-calculator.calculate completed` on both). The
prompt asked the allowlisted `calculate` tool for 10 % of 200 **without disclosing
the expected result** — the model had to form `MCP_RESULT_<value>` from the tool's
`percent_of_value` field:

```json
{
  "openai":    { "actionId": "defend", "targetId": "ally", "speech": "I'll defend the ally.", "reasonSummary": "MCP_RESULT_20 supports defending the ally.", "attributedCardIds": ["calculator-mcp-v1"] },
  "anthropic": { "actionId": "defend", "targetId": "ally", "speech": "Defend the ally now before taking damage.", "reasonSummary": "Ally HP is low at 20. MCP_RESULT_20 calculated. Defend protects.", "attributedCardIds": ["calculator-mcp-v1"] }
}
```

Hosted Skill (same reviewed `arena-tactics` fixture uploaded separately to each
provider, referenced by immutable provider-specific version; required marker
`ARENA_SKILL_EXECUTED_731`):

```json
{
  "openai":    { "toolTrace": "skill Arena Tactics completed", "actionId": "defend", "targetId": "ally", "speech": "Defending the ally now.", "reasonSummary": "ARENA_SKILL_EXECUTED_731 Safe legal defend chosen for ally protection.", "attributedCardIds": ["arena-tactics-v1"] },
  "anthropic": { "toolTrace": "skill text_editor_code_execution completed", "actionId": "defend", "targetId": "ally", "speech": "Defending the ally now!", "reasonSummary": "Defend ally with strong protection. ARENA_SKILL_EXECUTED_731", "attributedCardIds": ["arena-tactics-v1"] }
}
```

## Measured usage and estimated cost

Estimates use the public standard token rates on the test date
([OpenAI](https://developers.openai.com/api/docs/pricing) ·
[Anthropic](https://platform.claude.com/docs/en/about-claude/pricing)). Caveats:
the shared compact contract does not expose compact-call usage; capability
diagnostics and direct provider probes outside the shared report accumulator are
not included; hosted execution may carry provider-side container charges separate
from model tokens. Provider billing dashboards remain authoritative.

**Final successful core-turn calls** — combined ≈ **$0.009348**:

| Provider | Input | Cached | Output | Reasoning | Total | Cost |
|---|---:|---:|---:|---:|---:|---:|
| OpenAI | 1,817 | 0 | 319 | 0 | 2,136 | $0.002798 |
| Anthropic | 4,370 | 0 | 436 | n/a | 4,806 | $0.006550 |

**Final capability-only run (MCP + Skill)** — combined ≈ **$0.013150**:

| Provider | Input | Cached | Output | Reasoning | Total | Cost |
|---|---:|---:|---:|---:|---:|---:|
| OpenAI | 2,169 | 0 | 200 | 46 | 2,369 | $0.002527 |
| Anthropic | 9,023 | 0 | 320 | n/a | 9,343 | $0.010623 |

**MCP-only confirmation** (after removing the expected value from the prompt) —
combined ≈ **$0.004244**:

| Provider | Input | Cached | Output | Reasoning | Total | Cost |
|---|---:|---:|---:|---:|---:|---:|
| OpenAI | 576 | 0 | 90 | 0 | 666 | $0.000837 |
| Anthropic | 2,552 | 0 | 171 | n/a | 2,723 | $0.003407 |

**Earlier diagnostic attempts** (lower-output-cap runs before the final core
pass) — combined ≈ **$0.032265**:

| Provider | Input | Output | Total | Cost |
|---|---:|---:|---:|---:|
| OpenAI | 4,978 | 863 | 5,841 | $0.007617 |
| Anthropic | 16,093 | 1,711 | 17,804 | $0.024648 |

## Adjustments found by live validation

1. **Compact output cap.** The first Claude compact probe used the 96-token turn
   smoke cap; its explicit summary hit `max_tokens` and correctly failed as
   `provider_output_incomplete`. The smoke runner now keeps normal turns
   cost-bounded (cap raisable to the 192-token harness limit), uses the production
   harness output limit for compact summaries, and records only validated
   `AgentDecision` values.
2. **OpenAI Skill version type.** OpenAI requires the hosted-Skill version as a
   string even when all-digits; the adapter preserves the registry value as a
   string.
3. **Capability latency envelope.** Remote MCP and hosted Skills need a larger
   latency/output envelope than normal turns: capability cases use the separate
   `agentic-4000` harness (90 s, ≤512 output tokens); the live runner caps them at
   384 by default.

The final runs with these production paths passed every configured scenario.

## Capability fixture and trust boundary

- **MCP target:** the public third-party calculator at
  `https://mcpcalc.com/api/v1/mcp` — allowlisted read-only, `calculate` tool only,
  no credential. Suitable only for this synthetic internal smoke test; production
  or submission must use a team-owned HTTPS MCP endpoint or approved tunnel.
- **Skill fixture:** contains only a deterministic arena decision procedure and
  marker — no network, write, secret, or arbitrary-path instruction. Tested bundle
  digest `2db3c7b0302a7b08b2754cbaa208c5f69a5c05ba63f7bcbb2f73b07a0bc5d294`.
- **Bootstrap provenance:** matching remote Skill names are not trusted — the
  bootstrap requires a newly uploaded version or an explicit unverified-reuse
  override, and reports the local fixture SHA-256 plus provenance. An
  implicit-reuse probe found both existing provider resources and failed with
  `existing_skill_requires_force_version_or_explicit_reuse` before any write or
  model call, as intended.
- **Redaction:** API keys, provider Skill IDs/versions were not added to source or
  this report; `.env.local` unchanged. Before printing, the runner rejects
  decisions or traces that echo a server-owned model target, Skill ID, MCP
  URL/authorization value, or provider API key, then applies structural secret
  redaction as defense in depth.
- **Claim scope:** only the exact allowlisted MCP card and reviewed Skill fixture
  are verified through both adapters. Arbitrary user-supplied MCP servers or
  Skills remain unsupported and unverified.

## Keyless and container evidence

The same source also passed: 146 tests across 11 files · TypeScript typecheck ·
OpenAPI semantic and response-contract validation · production build ·
`npm audit` with zero vulnerabilities · non-root Docker health and filesystem
checks · four-turn mock HTTP E2E with three parallel agents, SSE replay, context
continuity, compact replay, clear generation 2, and fresh-session continuation.

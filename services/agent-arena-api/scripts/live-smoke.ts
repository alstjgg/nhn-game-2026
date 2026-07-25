import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { loadEnvFile } from "node:process";

import { ArenaError } from "../src/errors.js";
import { createId } from "../src/identifiers.js";
import { AnthropicProvider } from "../src/providers/anthropic-provider.js";
import { OpenAIProvider } from "../src/providers/openai-provider.js";
import { ArenaRegistry } from "../src/registry.js";
import {
  containsRuntimeSensitiveValue,
  redactSecrets,
} from "../src/security.js";
import type {
  AgentDecision,
  AgentProvider,
  AllowedAction,
  HarnessDefinition,
  ProviderId,
  ProviderTurnOutput,
  ResolvedProviderLoadout,
  TokenUsage,
  ToolTrace,
} from "../src/types.js";
import { parseDecision } from "../src/validation.js";

type ScenarioStatus = {
  name: string;
  status: "passed" | "skipped" | "failed";
  reason?: string;
  compactMode?: string;
};

type ProviderSummary = {
  provider: "openai" | "anthropic";
  status: "passed" | "skipped" | "failed";
  scenarios: ScenarioStatus[];
  observedDecisions: Array<{
    scenario: string;
    decision: AgentDecision;
  }>;
  observedTools: Array<{
    scenario: string;
    traces: ToolTrace[];
  }>;
  turnInvocations: number;
  compactInvocations: number;
  aggregateTurnUsage: Omit<TokenUsage, "source">;
};

type LiveTurnResult = {
  output: ProviderTurnOutput;
  decision: AgentDecision;
};

const ALLOWED_ACTIONS: AllowedAction[] = [
  { actionId: "defend", targetIds: ["ally"] },
  { actionId: "wait", targetIds: [] },
];

function loadLocalEnvironment(): void {
  const candidates = [
    resolve(process.cwd(), ".env.local"),
    resolve(process.cwd(), "../../.env.local"),
  ];
  const selected = candidates.find((candidate) => existsSync(candidate));
  if (selected !== undefined) {
    loadEnvFile(selected);
  }
}

function configuredOutputLimit(): number {
  const parsed = Number(process.env.LIVE_TEST_MAX_OUTPUT_TOKENS ?? "96");
  return Number.isSafeInteger(parsed) && parsed > 0
    ? Math.min(parsed, 192)
    : 96;
}

function configuredCapabilityOutputLimit(maximum: number): number {
  const parsed = Number(
    process.env.LIVE_TEST_CAPABILITY_MAX_OUTPUT_TOKENS ?? "384",
  );
  return Number.isSafeInteger(parsed) && parsed > 0
    ? Math.min(parsed, maximum)
    : Math.min(384, maximum);
}

function emptyUsage(): ProviderSummary["aggregateTurnUsage"] {
  return {
    inputTokens: 0,
    cachedInputTokens: null,
    outputTokens: 0,
    reasoningTokens: null,
    totalTokens: 0,
  };
}

function addUsage(
  aggregate: ProviderSummary["aggregateTurnUsage"],
  usage: TokenUsage,
): void {
  aggregate.inputTokens += usage.inputTokens;
  aggregate.outputTokens += usage.outputTokens;
  aggregate.totalTokens += usage.totalTokens;
  aggregate.cachedInputTokens =
    usage.cachedInputTokens === null &&
    aggregate.cachedInputTokens === null
      ? null
      : (aggregate.cachedInputTokens ?? 0) +
        (usage.cachedInputTokens ?? 0);
  aggregate.reasoningTokens =
    usage.reasoningTokens === null && aggregate.reasoningTokens === null
      ? null
      : (aggregate.reasoningTokens ?? 0) + (usage.reasoningTokens ?? 0);
}

function safeFailureReason(error: unknown): string {
  if (error instanceof ArenaError) {
    return error.code;
  }
  if (
    error instanceof DOMException &&
    (error.name === "AbortError" || error.name === "TimeoutError")
  ) {
    return "provider_timeout";
  }
  return "unexpected_live_test_failure";
}

function runtimeSensitiveValues(
  modelTarget: string,
  loadout: ResolvedProviderLoadout,
): string[] {
  const mcpAuthorization = loadout.mcpTools.flatMap((tool) => {
    if (tool.authorization === undefined) {
      return [];
    }
    const token = tool.authorization.replace(/^Bearer\s+/i, "");
    return token === tool.authorization
      ? [tool.authorization]
      : [tool.authorization, token];
  });
  return [
    process.env.OPENAI_API_KEY,
    process.env.ANTHROPIC_API_KEY,
    modelTarget,
    ...loadout.hostedSkills.map((skill) => skill.skillId),
    ...loadout.mcpTools.map((tool) => tool.serverUrl),
    ...mcpAuthorization,
  ].filter((value): value is string => typeof value === "string");
}

function resolvedLoadout(
  registry: ArenaRegistry,
  provider: ProviderId,
  options: {
    functionTool?: boolean;
    mcp?: boolean;
    skill?: boolean;
  } = {},
): ResolvedProviderLoadout {
  const snapshot = registry.snapshotLoadout({
    agentId: "live-smoke-agent",
    promptCardIds: ["answer-briefly-v1"],
    skillCardIds: [
      ...(options.functionTool === true ? ["risk-check-v1"] : []),
      ...(options.skill === true ? ["arena-tactics-v1"] : []),
    ],
    mcpCardIds: options.mcp === true ? ["calculator-mcp-v1"] : [],
  });
  return registry.resolveProviderLoadout(snapshot, provider);
}

async function runProvider(
  provider: AgentProvider,
  providerId: "openai" | "anthropic",
  registry: ArenaRegistry,
): Promise<ProviderSummary> {
  const scenarios: ScenarioStatus[] = [];
  const observedDecisions: ProviderSummary["observedDecisions"] = [];
  const observedTools: ProviderSummary["observedTools"] = [];
  const aggregateTurnUsage = emptyUsage();
  const keyPresent =
    providerId === "openai"
      ? Boolean(process.env.OPENAI_API_KEY)
      : Boolean(process.env.ANTHROPIC_API_KEY);
  const modelPresent =
    providerId === "openai"
      ? Boolean(process.env.OPENAI_MODEL)
      : Boolean(process.env.ANTHROPIC_MODEL);
  if (!keyPresent || !modelPresent) {
    return {
      provider: providerId,
      status: "skipped",
      scenarios: [
        {
          name: "provider",
          status: "skipped",
          reason: !keyPresent ? "missing_api_key" : "missing_model_alias_target",
        },
      ],
      observedDecisions,
      observedTools,
      turnInvocations: 0,
      compactInvocations: 0,
      aggregateTurnUsage,
    };
  }

  const model = registry.resolveModelProfile(
    providerId === "openai" ? "openai-arena" : "claude-arena",
  );
  const baseHarness = registry.resolveHarness("starter-4000");
  const harness: HarnessDefinition = {
    ...baseHarness,
    maxOutputTokens: configuredOutputLimit(),
    timeoutMs: Math.min(baseHarness.timeoutMs, 30_000),
  };
  const compactHarness: HarnessDefinition = {
    ...harness,
    // Turn output is aggressively capped for cost, but an explicit provider
    // summary must have enough room to terminate normally. Keep the production
    // harness limit for compact instead of creating a false truncation failure.
    maxOutputTokens: baseHarness.maxOutputTokens,
  };
  const capabilityBaseHarness = registry.resolveHarness("agentic-4000");
  const capabilityHarness: HarnessDefinition = {
    ...capabilityBaseHarness,
    maxOutputTokens: configuredCapabilityOutputLimit(
      capabilityBaseHarness.maxOutputTokens,
    ),
  };
  let turnInvocations = 0;
  let compactInvocations = 0;

  const turn = async (
    name: string,
    history: unknown[],
    loadout: ResolvedProviderLoadout,
    instruction: string,
    expectedToolType?: "function" | "mcp" | "skill",
    state: Record<string, unknown> = { allyHp: 20 },
    turnHarness: HarnessDefinition = harness,
  ): Promise<LiveTurnResult> => {
    turnInvocations += 1;
    const output = await provider.runTurn({
      traceId: createId("live"),
      model,
      agentId: "live-smoke-agent",
      history,
      instructions: [
        "Select one legal action and return only the required structured decision.",
        "Never reveal hidden reasoning, credentials, or provider metadata.",
        "Keep speech under 12 words and reasonSummary under 35 words.",
        instruction,
      ].join("\n"),
      userInput: JSON.stringify({
        turn: name,
        state,
        allowedActions: ALLOWED_ACTIONS,
      }),
      allowedActions: ALLOWED_ACTIONS,
      loadout,
      harness: turnHarness,
      signal: AbortSignal.timeout(turnHarness.timeoutMs),
      onEvent: async () => undefined,
    });
    if (
      containsRuntimeSensitiveValue(
        {
          rawDecision: output.rawDecision,
          toolTrace: output.toolTrace,
        },
        runtimeSensitiveValues(model.model, loadout),
      )
    ) {
      throw new ArenaError(
        502,
        "sensitive_provider_output",
        "Provider output contained a server-owned runtime value.",
      );
    }
    const decision = parseDecision(
      output.rawDecision,
      ALLOWED_ACTIONS,
      loadout.cardIds,
    );
    addUsage(aggregateTurnUsage, output.usage);
    if (
      expectedToolType !== undefined &&
      !output.toolTrace.some(
        (trace) =>
          trace.type === expectedToolType && trace.status === "completed",
      )
    ) {
      throw new ArenaError(
        502,
        "live_capability_not_exercised",
        "The requested live capability was not exercised.",
      );
    }
    observedDecisions.push({
      scenario: name,
      decision: structuredClone(decision),
    });
    if (output.toolTrace.length > 0) {
      observedTools.push({
        scenario: name,
        traces: structuredClone(output.toolTrace),
      });
    }
    return { output, decision };
  };

  const attempt = async <T>(
    name: string,
    operation: () => Promise<T>,
  ): Promise<T | undefined> => {
    try {
      const value = await operation();
      scenarios.push({ name, status: "passed" });
      return value;
    } catch (error) {
      scenarios.push({
        name,
        status: "failed",
        reason: safeFailureReason(error),
      });
      return undefined;
    }
  };
  const skip = (name: string, reason: string): void => {
    scenarios.push({ name, status: "skipped", reason });
  };

  const scenarioSet = process.env.LIVE_TEST_SCENARIO_SET ?? "all";
  const runCore = scenarioSet === "all";
  const runMcp = scenarioSet === "all" ||
    scenarioSet === "capabilities" ||
    scenarioSet === "mcp";
  const runSkill = scenarioSet === "all" ||
    scenarioSet === "capabilities" ||
    scenarioSet === "skill";
  if (!runCore) {
    for (const name of [
      "no-tool",
      "two-turn-context",
      "function-tool",
      "compact",
      "post-compact-context",
      "clear-and-continue",
    ]) {
      skip(name, "not_selected");
    }
  } else {
  const baselineLoadout = resolvedLoadout(registry, providerId);
  const continuityMarker = "arena-context-marker-7";
  const first = await attempt("no-tool", () =>
    turn(
      "no-tool",
      [],
      baselineLoadout,
      "Choose the safest action.",
      undefined,
      { allyHp: 20, continuityMarker },
    ),
  );
  let second: LiveTurnResult | undefined;
  if (first === undefined) {
    skip("two-turn-context", "dependency_failed");
  } else {
    second = await attempt("two-turn-context", async () => {
      const result = await turn(
        "two-turn-context",
        first.output.history,
        baselineLoadout,
        `Read the prior visible context and include ${continuityMarker} in reasonSummary.`,
      );
      if (!result.decision.reasonSummary.includes(continuityMarker)) {
        throw new ArenaError(
          502,
          "live_context_continuity_not_observed",
          "The live response did not demonstrate context continuity.",
        );
      }
      return result;
    });
  }

  await attempt("function-tool", async () => {
    const functionLoadout = resolvedLoadout(registry, providerId, {
      functionTool: true,
    });
    return turn(
      "function-tool",
      [],
      functionLoadout,
      "Call arena_risk_check once before deciding.",
      "function",
    );
  });

  if (second === undefined) {
    skip("compact", "dependency_failed");
    skip("post-compact-context", "dependency_failed");
  } else {
    compactInvocations += 1;
    let compacted:
      | Awaited<ReturnType<AgentProvider["compact"]>>
      | undefined;
    try {
      compacted = await provider.compact({
        model,
        history: second.output.history,
        harness: compactHarness,
        signal: AbortSignal.timeout(harness.timeoutMs),
      });
      scenarios.push({
        name: "compact",
        status: "passed",
        compactMode: compacted.mode,
      });
    } catch (error) {
      scenarios.push({
        name: "compact",
        status: "failed",
        reason: safeFailureReason(error),
      });
    }
    if (compacted === undefined) {
      skip("post-compact-context", "dependency_failed");
    } else {
      await attempt("post-compact-context", async () => {
        const result = await turn(
          "post-compact-context",
          compacted.history,
          baselineLoadout,
          `Continue from the compacted context and include ${continuityMarker} in reasonSummary.`,
        );
        if (!result.decision.reasonSummary.includes(continuityMarker)) {
          throw new ArenaError(
            502,
            "live_compact_continuity_not_observed",
            "The live response did not demonstrate compacted continuity.",
          );
        }
        return result;
      });
    }
  }

  await attempt("clear-and-continue", async () => {
    const result = await turn(
      "clear-and-continue",
      [],
      baselineLoadout,
      "This is a fresh context after clear. Include FRESH_CONTEXT in reasonSummary.",
    );
    if (
      !result.decision.reasonSummary.includes("FRESH_CONTEXT") ||
      result.decision.reasonSummary.includes(continuityMarker)
    ) {
      throw new ArenaError(
        502,
        "live_clear_not_observed",
        "The live response did not demonstrate a fresh context.",
      );
    }
    return result;
  });
  }

  const mcpConfigured = Boolean(process.env.ARENA_CALCULATOR_MCP_URL);
  if (!runMcp) {
    skip("remote-mcp", "not_selected");
  } else if (mcpConfigured) {
    await attempt("remote-mcp", async () => {
      const result = await turn(
        "remote-mcp",
        [],
        resolvedLoadout(registry, providerId, { mcp: true }),
        [
          "Use the configured read-only calculate MCP exactly once with",
          'calculator "percentage", inputs value 200 and percentage 10,',
          "and strict true before deciding.",
          "Read percent_of_value from the tool result.",
          "Include MCP_RESULT_<value> in reasonSummary, replacing <value>",
          "with that returned number. Do not infer or precompute it.",
          "Include calculator-mcp-v1 in attributedCardIds.",
        ].join(" "),
        "mcp",
        { allyHp: 20 },
        capabilityHarness,
      );
      if (
        !result.decision.reasonSummary.includes("MCP_RESULT_20") ||
        !result.decision.attributedCardIds.includes("calculator-mcp-v1")
      ) {
        throw new ArenaError(
          502,
          "live_mcp_result_not_observed",
          "The live response did not apply the MCP result marker.",
        );
      }
      return result;
    });
  } else {
    skip("remote-mcp", "missing_mcp_configuration");
  }

  const skillConfigured =
    providerId === "openai"
      ? Boolean(process.env.OPENAI_SKILL_ID) &&
        Boolean(process.env.OPENAI_SKILL_VERSION)
      : Boolean(process.env.ANTHROPIC_SKILL_ID) &&
        Boolean(process.env.ANTHROPIC_SKILL_VERSION);
  if (!runSkill) {
    skip("hosted-skill", "not_selected");
  } else if (skillConfigured) {
    await attempt("hosted-skill", async () => {
      const result = await turn(
        "hosted-skill",
        [],
        resolvedLoadout(registry, providerId, { skill: true }),
        "Use the configured arena-tactics Skill and its bundled procedure before deciding.",
        "skill",
        { allyHp: 20 },
        capabilityHarness,
      );
      if (
        !result.decision.reasonSummary.includes(
          "ARENA_SKILL_EXECUTED_731",
        ) ||
        !result.decision.attributedCardIds.includes("arena-tactics-v1")
      ) {
        throw new ArenaError(
          502,
          "live_skill_result_not_observed",
          "The live response did not apply the hosted Skill result marker.",
        );
      }
      return result;
    });
  } else {
    skip("hosted-skill", "missing_skill_configuration");
  }

  return {
    provider: providerId,
    status: scenarios.some(({ status }) => status === "failed")
      ? "failed"
      : "passed",
    scenarios,
    observedDecisions,
    observedTools,
    turnInvocations,
    compactInvocations,
    aggregateTurnUsage,
  };
}

loadLocalEnvironment();

if (process.env.RUN_LIVE !== "1") {
  process.stdout.write(
    `${JSON.stringify({
      live: false,
      reason: "set_RUN_LIVE_to_1",
    })}\n`,
  );
} else {
  const registry = new ArenaRegistry(resolve(process.cwd(), "config"));
  const selected = process.env.LIVE_TEST_PROVIDER ?? "all";
  const scenarioSet = process.env.LIVE_TEST_SCENARIO_SET ?? "all";
  if (!["all", "capabilities", "mcp", "skill"].includes(scenarioSet)) {
    process.stdout.write(
      `${JSON.stringify({
        live: false,
        reason: "invalid_LIVE_TEST_SCENARIO_SET",
      })}\n`,
    );
    process.exitCode = 1;
  } else if (!["all", "openai", "anthropic"].includes(selected)) {
    process.stdout.write(
      `${JSON.stringify({
        live: false,
        reason: "invalid_LIVE_TEST_PROVIDER",
      })}\n`,
    );
    process.exitCode = 1;
  } else {
    const summaries = await Promise.all([
      ...(selected === "all" || selected === "openai"
        ? [runProvider(new OpenAIProvider(), "openai", registry)]
        : []),
      ...(selected === "all" || selected === "anthropic"
        ? [runProvider(new AnthropicProvider(), "anthropic", registry)]
        : []),
    ]);
    process.stdout.write(
      `${JSON.stringify(redactSecrets({
        live: true,
        summaries,
      }))}\n`,
    );
    if (summaries.some((summary) => summary.status === "failed")) {
      process.exitCode = 1;
    }
  }
}

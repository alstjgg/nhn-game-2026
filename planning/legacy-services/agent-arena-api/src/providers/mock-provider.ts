import { ArenaError } from "../errors.js";
import { executeFunctionTool } from "../tools.js";
import type {
  AgentDecision,
  AgentProvider,
  AllowedAction,
  ProviderCompactInput,
  ProviderCompactOutput,
  ProviderTurnInput,
  ProviderTurnOutput,
  TokenUsage,
  ToolTrace,
} from "../types.js";

export type MockFault = "invalid" | "provider-error" | "timeout" | "tool-error";

export type MockProviderOptions = {
  delayMs?: number;
  faults?: Map<string, MockFault>;
  onStart?: (agentId: string, startedAt: number) => void;
};

function approximateTokens(value: unknown): number {
  return Math.max(1, Math.ceil(JSON.stringify(value).length / 4));
}

function zeroUsage(): TokenUsage {
  return {
    inputTokens: 0,
    cachedInputTokens: 0,
    outputTokens: 0,
    reasoningTokens: 0,
    totalTokens: 0,
    source: "mock_measured",
  };
}

async function abortableDelay(ms: number, signal: AbortSignal): Promise<void> {
  if (signal.aborted) {
    throw new DOMException("The operation was aborted.", "AbortError");
  }
  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(resolve, ms);
    const onAbort = (): void => {
      clearTimeout(timeout);
      reject(new DOMException("The operation was aborted.", "AbortError"));
    };
    signal.addEventListener("abort", onAbort, { once: true });
    timeout.unref();
  });
}

function chooseAction(
  agentId: string,
  allowedActions: AllowedAction[],
  toolSelectedAction: string | null,
): AllowedAction {
  const selectedByTool =
    toolSelectedAction === null
      ? undefined
      : allowedActions.find(
          (action) => action.actionId === toolSelectedAction,
        );
  if (selectedByTool !== undefined) {
    return selectedByTool;
  }
  const preferred =
    agentId.includes("guardian")
      ? "defend"
      : agentId.includes("scout")
        ? "wait"
        : undefined;
  return (
    allowedActions.find((action) => action.actionId === preferred) ??
    allowedActions[0]!
  );
}

export class MockProvider implements AgentProvider {
  readonly providerId = "mock" as const;
  readonly #options: MockProviderOptions;

  constructor(options: MockProviderOptions = {}) {
    this.#options = options;
  }

  async runTurn(input: ProviderTurnInput): Promise<ProviderTurnOutput> {
    this.#options.onStart?.(input.agentId, performance.now());
    const fault = this.#options.faults?.get(input.agentId);
    if (fault === "provider-error") {
      throw new ArenaError(
        503,
        "provider_unavailable",
        "Mock provider failure.",
      );
    }
    if (fault === "timeout") {
      await abortableDelay(this.#options.delayMs ?? 8, input.signal);
      throw new DOMException("Mock provider timeout.", "AbortError");
    } else {
      await abortableDelay(this.#options.delayMs ?? 8, input.signal);
    }

    const toolTrace: ToolTrace[] = [];
    let toolSelectedAction: string | null = null;
    for (const tool of input.loadout.functionTools) {
      const startedAt = performance.now();
      await input.onEvent({
        type: "tool.started",
        safeData: { type: "function", name: tool.name },
      });
      if (fault === "tool-error") {
        toolTrace.push({
          type: "function",
          name: tool.name,
          status: "failed",
          durationMs: Math.round(performance.now() - startedAt),
        });
        await input.onEvent({
          type: "tool.failed",
          safeData: { type: "function", name: tool.name },
        });
        throw new ArenaError(502, "tool_failed", "Mock function tool failed.");
      }
      const result = executeFunctionTool(tool.name, {
        actions: input.allowedActions.map((action, index) => ({
          actionId: action.actionId,
          risk: (index + 1) / (input.allowedActions.length + 1),
        })),
      });
      toolSelectedAction =
        typeof result.selectedActionId === "string"
          ? result.selectedActionId
          : null;
      toolTrace.push({
        type: "function",
        name: tool.name,
        status: "completed",
        durationMs: Math.round(performance.now() - startedAt),
        safeSummary: "Selected the lowest-risk legal action.",
      });
      await input.onEvent({
        type: "tool.completed",
        safeData: { type: "function", name: tool.name },
      });
    }

    for (const mcp of input.loadout.mcpTools) {
      if (fault === "tool-error") {
        toolTrace.push({
          type: "mcp",
          name: `${mcp.serverLabel}.${mcp.allowedTools[0] ?? "tool"}`,
          status: "failed",
          durationMs: 1,
        });
        await input.onEvent({
          type: "tool.failed",
          safeData: { type: "mcp", name: mcp.serverLabel },
        });
        throw new ArenaError(502, "tool_failed", "Mock MCP tool failed.");
      }
      toolTrace.push({
        type: "mcp",
        name: `${mcp.serverLabel}.${mcp.allowedTools[0] ?? "tool"}`,
        status: "completed",
        durationMs: 1,
        safeSummary: "Deterministic mock MCP result.",
      });
      await input.onEvent({
        type: "tool.started",
        safeData: { type: "mcp", name: mcp.serverLabel },
      });
      await input.onEvent({
        type: "tool.completed",
        safeData: { type: "mcp", name: mcp.serverLabel },
      });
    }

    for (const skill of input.loadout.hostedSkills) {
      toolTrace.push({
        type: "skill",
        name: skill.name,
        status: "completed",
        durationMs: 1,
        safeSummary: "Deterministic mock Skill invocation.",
      });
      await input.onEvent({
        type: "tool.started",
        safeData: { type: "skill", name: skill.name },
      });
      await input.onEvent({
        type: "tool.completed",
        safeData: { type: "skill", name: skill.name },
      });
    }

    const action = chooseAction(
      input.agentId,
      input.allowedActions,
      toolSelectedAction,
    );
    const priorTurns = input.history.filter(
      (entry) =>
        entry !== null &&
        typeof entry === "object" &&
        (entry as { role?: unknown }).role === "assistant",
    ).length;
    const compactedContext = input.history.some(
      (entry) =>
        entry !== null &&
        typeof entry === "object" &&
        (entry as { role?: unknown }).role === "system" &&
        typeof (entry as { content?: unknown }).content === "string" &&
        (entry as { content: string }).content.startsWith("Compacted "),
    );
    const decision: AgentDecision = {
      actionId: action.actionId,
      targetId: action.targetIds[0] ?? null,
      speech: `${input.agentId} selects ${action.actionId}.`,
      reasonSummary: `Deterministic mock decision with ${priorTurns} prior turn(s)${compactedContext ? " and compacted context" : ""}.`,
      attributedCardIds: input.loadout.cardIds.slice(0, 2),
    };
    const rawDecision: unknown =
      fault === "invalid" ? { actionId: "not-allowed" } : decision;
    const outputText = JSON.stringify(rawDecision);
    for (const chunk of outputText.match(/.{1,24}/g) ?? []) {
      await input.onEvent({
        type: "output.delta",
        safeData: { delta: chunk },
      });
    }
    const history = [
      ...input.history,
      { role: "user", content: input.userInput },
      { role: "assistant", content: outputText },
    ];
    const usage: TokenUsage = {
      ...zeroUsage(),
      inputTokens: approximateTokens({
        history: input.history,
        instructions: input.instructions,
        input: input.userInput,
      }),
      outputTokens: approximateTokens(outputText),
      reasoningTokens: 0,
      cachedInputTokens: 0,
      totalTokens: 0,
      source: "mock_measured",
    };
    usage.totalTokens = usage.inputTokens + usage.outputTokens;
    await input.onEvent({
      type: "usage.final",
      safeData: { ...usage },
    });
    return {
      rawDecision,
      history,
      usage,
      lastInputTokens: usage.inputTokens,
      toolTrace,
      providerRequestId: `mock_${input.traceId}`,
    };
  }

  async compact(input: ProviderCompactInput): Promise<ProviderCompactOutput> {
    if (input.signal.aborted) {
      throw new DOMException("The operation was aborted.", "AbortError");
    }
    return {
      history: [
        {
          role: "system",
          content: `Compacted ${input.history.length} prior mock context items.`,
        },
      ],
      mode: "mock-native",
      estimatedActiveTokens: 16,
    };
  }
}

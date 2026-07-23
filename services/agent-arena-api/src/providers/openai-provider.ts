import { ArenaError } from "../errors.js";
import { executeFunctionTool } from "../tools.js";
import type {
  AgentProvider,
  NormalizedProviderEvent,
  ProviderCompactInput,
  ProviderCompactOutput,
  ProviderTurnInput,
  ProviderTurnOutput,
  ResolvedHostedSkill,
  TokenUsage,
  ToolTrace,
} from "../types.js";

type FetchImplementation = typeof fetch;

export type OpenAIProviderOptions = {
  apiKey?: string;
  baseUrl?: string;
  fetch?: FetchImplementation;
};

type JsonRecord = Record<string, unknown>;

type UsageAccumulator = {
  calls: number;
  measuredCalls: number;
  inputTokens: number;
  lastInputTokens: number | null;
  cachedInputTokens: number;
  outputTokens: number;
  reasoningTokens: number;
  totalTokens: number;
  coreComplete: boolean;
  cachedComplete: boolean;
  reasoningComplete: boolean;
};

type ObservedTool = {
  kind: "mcp" | "skill";
  name: string;
  startedAt: number;
  status?: "completed" | "failed";
};

const DECISION_TEXT_FORMAT = {
  type: "json_schema",
  name: "agent_arena_decision",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      actionId: { type: "string" },
      targetId: { type: ["string", "null"] },
      speech: { type: "string" },
      reasonSummary: { type: "string" },
      attributedCardIds: {
        type: "array",
        items: { type: "string" },
      },
    },
    required: [
      "actionId",
      "targetId",
      "speech",
      "reasonSummary",
      "attributedCardIds",
    ],
  },
} as const;

function isRecord(value: unknown): value is JsonRecord {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function requiredString(
  record: JsonRecord,
  key: string,
  errorCode = "provider_protocol_error",
): string {
  const value = record[key];
  if (typeof value !== "string" || value.length === 0) {
    throw new ArenaError(
      502,
      errorCode,
      "OpenAI returned an invalid response item.",
    );
  }
  return value;
}

function tokenCount(value: unknown): number | undefined {
  return Number.isSafeInteger(value) && (value as number) >= 0
    ? (value as number)
    : undefined;
}

function conservativeTokenUpperBound(value: unknown): number {
  const serialized = JSON.stringify(value);
  return serialized === undefined
    ? 0
    : Math.max(1, Buffer.byteLength(serialized, "utf8"));
}

function assertContinuationWithinBudget(
  input: ProviderTurnInput,
  conversation: unknown[],
  tools: JsonRecord[],
  lastInputTokens: number | null,
  requestConversationLength: number,
): void {
  const hardLimit = Math.floor(
    input.harness.maxInputTokens * input.harness.contextHardLimitRatio,
  );
  const growth = conservativeTokenUpperBound(
    conversation.slice(requestConversationLength),
  );
  const projected = Math.max(
    conservativeTokenUpperBound({
      instructions: input.instructions,
      input: conversation,
      tools,
    }),
    (lastInputTokens ?? 0) + growth,
  );
  if (projected >= hardLimit) {
    throw new ArenaError(
      502,
      "context_hard_limit",
      "OpenAI continuation would exceed the configured input budget.",
    );
  }
}

function newUsageAccumulator(): UsageAccumulator {
  return {
    calls: 0,
    measuredCalls: 0,
    inputTokens: 0,
    lastInputTokens: null,
    cachedInputTokens: 0,
    outputTokens: 0,
    reasoningTokens: 0,
    totalTokens: 0,
    coreComplete: true,
    cachedComplete: true,
    reasoningComplete: true,
  };
}

function addUsage(accumulator: UsageAccumulator, rawUsage: unknown): void {
  accumulator.calls += 1;
  if (!isRecord(rawUsage)) {
    accumulator.coreComplete = false;
    accumulator.cachedComplete = false;
    accumulator.reasoningComplete = false;
    return;
  }

  const inputTokens = tokenCount(rawUsage.input_tokens);
  const outputTokens = tokenCount(rawUsage.output_tokens);
  const totalTokens = tokenCount(rawUsage.total_tokens);
  accumulator.lastInputTokens = inputTokens ?? null;
  if (
    inputTokens === undefined ||
    outputTokens === undefined ||
    totalTokens === undefined
  ) {
    accumulator.coreComplete = false;
  } else {
    accumulator.measuredCalls += 1;
    accumulator.inputTokens += inputTokens;
    accumulator.outputTokens += outputTokens;
    accumulator.totalTokens += totalTokens;
  }

  const inputDetails = rawUsage.input_tokens_details;
  const cachedTokens = isRecord(inputDetails)
    ? tokenCount(inputDetails.cached_tokens)
    : undefined;
  if (cachedTokens === undefined) {
    accumulator.cachedComplete = false;
  } else {
    accumulator.cachedInputTokens += cachedTokens;
  }

  const outputDetails = rawUsage.output_tokens_details;
  const reasoningTokens = isRecord(outputDetails)
    ? tokenCount(outputDetails.reasoning_tokens)
    : undefined;
  if (reasoningTokens === undefined) {
    accumulator.reasoningComplete = false;
  } else {
    accumulator.reasoningTokens += reasoningTokens;
  }
}

function normalizedUsage(accumulator: UsageAccumulator): TokenUsage {
  const measured = accumulator.calls > 0 && accumulator.coreComplete;
  return {
    inputTokens: accumulator.inputTokens,
    cachedInputTokens: accumulator.cachedComplete
      ? accumulator.cachedInputTokens
      : null,
    outputTokens: accumulator.outputTokens,
    reasoningTokens: accumulator.reasoningComplete
      ? accumulator.reasoningTokens
      : null,
    totalTokens: accumulator.totalTokens,
    source: measured ? "provider_measured" : "unavailable",
  };
}

function isAbortError(error: unknown): boolean {
  return (
    error instanceof DOMException
      ? error.name === "AbortError"
      : error instanceof Error && error.name === "AbortError"
  );
}

function parseSkillVersion(
  version: string | undefined,
): string | undefined {
  if (version === undefined) {
    return undefined;
  }
  if (version === "latest") {
    return version;
  }
  if (!/^[1-9]\d*$/.test(version)) {
    throw new ArenaError(
      500,
      "invalid_configuration",
      "An OpenAI Skill version must be a positive integer or latest.",
    );
  }
  const numeric = Number(version);
  if (!Number.isSafeInteger(numeric)) {
    throw new ArenaError(
      500,
      "invalid_configuration",
      "An OpenAI Skill version is outside the supported integer range.",
    );
  }
  return version;
}

function createUserItem(text: string): JsonRecord {
  return {
    type: "message",
    role: "user",
    content: [{ type: "input_text", text }],
  };
}

function createTools(input: ProviderTurnInput): JsonRecord[] {
  const functionTools = input.loadout.functionTools.map((tool) => ({
    type: "function",
    name: tool.name,
    description: tool.description,
    parameters: tool.inputSchema,
    strict: true,
  }));
  const mcpTools = input.loadout.mcpTools.map((tool) => {
    if (!tool.readOnly) {
      throw new ArenaError(
        422,
        "mcp_not_read_only",
        "OpenAI MCP tools must be approved as read-only.",
      );
    }
    return {
      type: "mcp",
      server_label: tool.serverLabel,
      server_url: tool.serverUrl,
      allowed_tools: [...tool.allowedTools],
      require_approval: "never",
      ...(tool.authorization === undefined
        ? {}
        : { authorization: tool.authorization }),
    };
  });
  const shellTools =
    input.loadout.hostedSkills.length === 0
      ? []
      : [
          {
            type: "shell",
            environment: {
              type: "container_auto",
              network_policy: { type: "disabled" },
              skills: input.loadout.hostedSkills.map((skill) => {
                const version = parseSkillVersion(skill.version);
                return {
                  type: "skill_reference",
                  skill_id: skill.skillId,
                  ...(version === undefined ? {} : { version }),
                };
              }),
            },
          },
        ];
  return [...functionTools, ...mcpTools, ...shellTools];
}

function outputItems(response: JsonRecord): unknown[] {
  if (!Array.isArray(response.output)) {
    throw new ArenaError(
      502,
      "provider_protocol_error",
      "OpenAI completed without an output item array.",
    );
  }
  return response.output;
}

function outputText(response: JsonRecord, streamedText: string): string {
  const chunks: string[] = [];
  for (const item of outputItems(response)) {
    if (!isRecord(item) || item.type !== "message") {
      continue;
    }
    if (!Array.isArray(item.content)) {
      continue;
    }
    for (const content of item.content) {
      if (
        isRecord(content) &&
        content.type === "output_text" &&
        typeof content.text === "string"
      ) {
        chunks.push(content.text);
      }
    }
  }
  return chunks.length > 0 ? chunks.join("") : streamedText;
}

function responseId(response: JsonRecord): string | undefined {
  return optionalString(response.id);
}

function countRemoteCalls(items: unknown[]): number {
  return items.filter(
    (item) =>
      isRecord(item) &&
      (item.type === "mcp_call" || item.type === "shell_call"),
  ).length;
}

function assertNoApprovalRequest(items: unknown[]): void {
  if (
    items.some(
      (item) => isRecord(item) && item.type === "mcp_approval_request",
    )
  ) {
    throw new ArenaError(
      502,
      "mcp_approval_required",
      "OpenAI requested approval for a server-configured MCP tool.",
    );
  }
}

function assertRemoteCallsSucceeded(items: unknown[]): void {
  for (const item of items) {
    if (!isRecord(item)) {
      continue;
    }
    if (
      item.type === "mcp_list_tools" &&
      item.error !== undefined &&
      item.error !== null
    ) {
      throw new ArenaError(
        502,
        "tool_failed",
        "An OpenAI remote MCP operation failed.",
      );
    }
    if (
      item.type === "mcp_call" &&
      !remoteToolItemCompleted(item)
    ) {
      throw new ArenaError(
        502,
        "tool_failed",
        "An OpenAI remote MCP operation failed.",
      );
    }
    if (
      item.type === "shell_call" &&
      !remoteToolItemCompleted(item)
    ) {
      throw new ArenaError(
        502,
        "tool_failed",
        "An OpenAI hosted Skill operation failed.",
      );
    }
  }
}

function remoteToolItemCompleted(item: JsonRecord): boolean {
  return (
    item.status === "completed" &&
    (item.error === undefined || item.error === null)
  );
}

function functionCalls(items: unknown[]): JsonRecord[] {
  return items.filter(
    (item): item is JsonRecord =>
      isRecord(item) && item.type === "function_call",
  );
}

function dataFromFrame(frame: string): string | undefined {
  const dataLines: string[] = [];
  for (const line of frame.split(/\r?\n/)) {
    if (line === "data") {
      dataLines.push("");
    } else if (line.startsWith("data:")) {
      const value = line.slice(5);
      dataLines.push(value.startsWith(" ") ? value.slice(1) : value);
    }
  }
  return dataLines.length === 0 ? undefined : dataLines.join("\n");
}

async function* sseData(
  body: ReadableStream<Uint8Array>,
): AsyncGenerator<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) {
        buffer += decoder.decode();
        break;
      }
      buffer += decoder.decode(chunk.value, { stream: true });
      while (true) {
        const boundary = /\r?\n\r?\n/.exec(buffer);
        if (boundary === null || boundary.index === undefined) {
          break;
        }
        const frame = buffer.slice(0, boundary.index);
        buffer = buffer.slice(boundary.index + boundary[0].length);
        const data = dataFromFrame(frame);
        if (data !== undefined) {
          yield data;
        }
      }
    }
    if (buffer.trim().length > 0) {
      const data = dataFromFrame(buffer);
      if (data !== undefined) {
        yield data;
      }
    }
  } finally {
    reader.releaseLock();
  }
}

class RemoteToolObserver {
  readonly #skills: ResolvedHostedSkill[];
  readonly #onEvent: (event: NormalizedProviderEvent) => Promise<void>;
  readonly #traces: ToolTrace[];
  readonly #observed = new Map<string, ObservedTool>();
  #sawFailure = false;

  constructor(
    skills: ResolvedHostedSkill[],
    onEvent: (event: NormalizedProviderEvent) => Promise<void>,
    traces: ToolTrace[],
  ) {
    this.#skills = skills;
    this.#onEvent = onEvent;
    this.#traces = traces;
  }

  sawFailure(): boolean {
    return this.#sawFailure;
  }

  async assertAllSettled(): Promise<void> {
    const unsettled = [...this.#observed.entries()].filter(
      ([, tool]) => tool.status === undefined,
    );
    for (const [key] of unsettled) {
      await this.#finish(key, "failed");
    }
    if (unsettled.length > 0) {
      throw new ArenaError(
        502,
        "tool_failed",
        "An OpenAI hosted tool operation did not settle.",
      );
    }
  }

  async observe(event: JsonRecord): Promise<void> {
    if (
      event.type === "response.output_item.added" ||
      event.type === "response.output_item.done"
    ) {
      const item = event.item;
      if (!isRecord(item)) {
        return;
      }
      const key = optionalString(item.id);
      if (key === undefined) {
        return;
      }
      if (item.type === "mcp_call") {
        await this.#start(
          key,
          "mcp",
          this.#mcpName(item),
        );
        if (event.type === "response.output_item.done") {
          await this.#finish(
            key,
            remoteToolItemCompleted(item) ? "completed" : "failed",
          );
        }
      }
      if (item.type === "shell_call") {
        await this.#start(key, "skill", this.#skillName());
        if (event.type === "response.output_item.done") {
          await this.#finish(
            key,
            remoteToolItemCompleted(item) ? "completed" : "failed",
          );
        }
      }
      return;
    }

    const eventType = optionalString(event.type);
    const itemId = optionalString(event.item_id);
    if (
      eventType === undefined ||
      itemId === undefined ||
      !eventType.startsWith("response.mcp_call.")
    ) {
      return;
    }
    await this.#start(itemId, "mcp", "mcp");
    if (eventType === "response.mcp_call.completed") {
      await this.#finish(itemId, "completed");
    } else if (eventType === "response.mcp_call.failed") {
      await this.#finish(itemId, "failed");
    }
  }

  async reconcile(items: unknown[]): Promise<void> {
    for (const [index, item] of items.entries()) {
      if (!isRecord(item)) {
        continue;
      }
      if (item.type === "mcp_call") {
        const key = optionalString(item.id) ?? `mcp-terminal-${index}`;
        await this.#start(key, "mcp", this.#mcpName(item));
        await this.#finish(
          key,
          remoteToolItemCompleted(item) ? "completed" : "failed",
        );
      }
      if (item.type === "shell_call") {
        const key = optionalString(item.id) ?? `skill-terminal-${index}`;
        await this.#start(key, "skill", this.#skillName());
        await this.#finish(
          key,
          remoteToolItemCompleted(item) ? "completed" : "failed",
        );
      }
    }
  }

  async #start(
    key: string,
    kind: "mcp" | "skill",
    name: string,
  ): Promise<void> {
    const current = this.#observed.get(key);
    if (current !== undefined) {
      if (current.name === "mcp" && name !== "mcp") {
        current.name = name;
      }
      return;
    }
    this.#observed.set(key, {
      kind,
      name,
      startedAt: performance.now(),
    });
    await this.#onEvent({
      type: "tool.started",
      safeData: { type: kind, name },
    });
  }

  async #finish(
    key: string,
    status: "completed" | "failed",
  ): Promise<void> {
    const current = this.#observed.get(key);
    if (current === undefined || current.status !== undefined) {
      return;
    }
    current.status = status;
    if (status === "failed") {
      this.#sawFailure = true;
    }
    this.#traces.push({
      type: current.kind,
      name: current.name,
      status,
      durationMs: Math.round(performance.now() - current.startedAt),
      safeSummary:
        status === "completed"
          ? current.kind === "mcp"
            ? "OpenAI remote MCP call completed."
            : "OpenAI hosted Skill shell call completed."
          : current.kind === "mcp"
            ? "OpenAI remote MCP call failed."
            : "OpenAI hosted Skill shell call failed.",
    });
    await this.#onEvent({
      type: status === "completed" ? "tool.completed" : "tool.failed",
      safeData: { type: current.kind, name: current.name },
    });
  }

  #mcpName(item: JsonRecord): string {
    const label = optionalString(item.server_label);
    const name = optionalString(item.name);
    if (label !== undefined && name !== undefined) {
      return `${label}.${name}`;
    }
    return name ?? label ?? "mcp";
  }

  #skillName(): string {
    return this.#skills.map((skill) => skill.name).join("+") || "hosted-skill";
  }
}

export class OpenAIProvider implements AgentProvider {
  readonly providerId = "openai" as const;
  readonly #apiKey: string | undefined;
  readonly #baseUrl: string;
  readonly #fetch: FetchImplementation;

  constructor(options: OpenAIProviderOptions = {}) {
    this.#apiKey = options.apiKey ?? process.env.OPENAI_API_KEY;
    this.#baseUrl = (
      options.baseUrl ?? "https://api.openai.com/v1"
    ).replace(/\/+$/, "");
    this.#fetch = options.fetch ?? globalThis.fetch.bind(globalThis);
  }

  async runTurn(input: ProviderTurnInput): Promise<ProviderTurnOutput> {
    const conversation: unknown[] = [
      ...input.history,
      createUserItem(input.userInput),
    ];
    const tools = createTools(input);
    const allowedFunctionNames = new Set(
      input.loadout.functionTools.map((tool) => tool.name),
    );
    const usage = newUsageAccumulator();
    const toolTrace: ToolTrace[] = [];
    const observer = new RemoteToolObserver(
      input.loadout.hostedSkills,
      input.onEvent,
      toolTrace,
    );
    let totalToolCalls = 0;
    let providerRequestId: string | undefined;
    let usageEmitted = false;
    const emitUsage = async (): Promise<TokenUsage> => {
      const finalUsage = normalizedUsage(usage);
      if (!usageEmitted) {
        usageEmitted = true;
        await input.onEvent({
          type: "usage.final",
          safeData: { ...finalUsage },
        });
      }
      return finalUsage;
    };

    try {
      for (
        let responseNumber = 0;
        responseNumber <= input.harness.maxToolCalls;
        responseNumber += 1
      ) {
        const requestConversationLength = conversation.length;
        const remainingToolCalls = Math.max(
          0,
          input.harness.maxToolCalls - totalToolCalls,
        );
        const hasBuiltInTools =
          input.loadout.mcpTools.length > 0 ||
          input.loadout.hostedSkills.length > 0;
        const body: JsonRecord = {
          model: input.model.model,
          instructions: input.instructions,
          input: conversation,
          tools,
          text: { format: DECISION_TEXT_FORMAT },
          include: ["reasoning.encrypted_content"],
          max_output_tokens: input.harness.maxOutputTokens,
          parallel_tool_calls: true,
          store: false,
          stream: true,
          truncation: "disabled",
          ...(hasBuiltInTools && remainingToolCalls > 0
            ? { max_tool_calls: remainingToolCalls }
            : {}),
          ...(remainingToolCalls === 0 && tools.length > 0
            ? { tool_choice: "none" }
            : {}),
        };
        const response = await this.#streamResponse(
          body,
          input.signal,
          input.onEvent,
          observer,
          usage,
        );
        providerRequestId = responseId(response.value) ?? providerRequestId;
        addUsage(usage, response.value.usage);

        const items = outputItems(response.value);
        conversation.push(...items);
        await observer.reconcile(items);
        assertNoApprovalRequest(items);
        assertRemoteCallsSucceeded(items);
        await observer.assertAllSettled();
        if (observer.sawFailure()) {
          throw new ArenaError(
            502,
            "tool_failed",
            "An OpenAI hosted tool operation failed.",
          );
        }

        const calls = functionCalls(items);
        const remoteCalls = countRemoteCalls(items);
        if (
          totalToolCalls + remoteCalls + calls.length >
          input.harness.maxToolCalls
        ) {
          throw new ArenaError(
            502,
            "tool_limit_exceeded",
            "OpenAI exceeded the configured tool-call limit.",
          );
        }
        totalToolCalls += remoteCalls + calls.length;

        if (calls.length === 0) {
          const finalUsage = await emitUsage();
          return {
            rawDecision: outputText(response.value, response.streamedText),
            history: conversation,
            usage: finalUsage,
            lastInputTokens: usage.lastInputTokens,
            toolTrace,
            ...(providerRequestId === undefined ? {} : { providerRequestId }),
          };
        }

        for (const call of calls) {
          if (call.status !== "completed") {
            throw new ArenaError(
              502,
              "tool_failed",
              "An OpenAI function call did not complete.",
            );
          }
          const name = requiredString(call, "name");
          const callId = requiredString(call, "call_id");
          if (!allowedFunctionNames.has(name)) {
            throw new ArenaError(
              502,
              "tool_not_allowed",
              "OpenAI requested a function outside the resolved loadout.",
            );
          }
          const encodedArguments = requiredString(
            call,
            "arguments",
            "invalid_tool_input",
          );
          let parsedArguments: unknown;
          try {
            parsedArguments = JSON.parse(encodedArguments) as unknown;
          } catch {
            throw new ArenaError(
              502,
              "invalid_tool_input",
              "OpenAI returned invalid JSON function arguments.",
            );
          }

          const startedAt = performance.now();
          await input.onEvent({
            type: "tool.started",
            safeData: { type: "function", name },
          });
          try {
            const result = executeFunctionTool(name, parsedArguments);
            conversation.push({
              type: "function_call_output",
              call_id: callId,
              output: JSON.stringify(result),
            });
            toolTrace.push({
              type: "function",
              name,
              status: "completed",
              durationMs: Math.round(performance.now() - startedAt),
              safeSummary: "Approved server function completed.",
            });
            await input.onEvent({
              type: "tool.completed",
              safeData: { type: "function", name },
            });
          } catch {
            toolTrace.push({
              type: "function",
              name,
              status: "failed",
              durationMs: Math.round(performance.now() - startedAt),
              safeSummary: "Approved server function failed.",
            });
            await input.onEvent({
              type: "tool.failed",
              safeData: { type: "function", name },
            });
            throw new ArenaError(
              502,
              "tool_failed",
              "An OpenAI function tool failed.",
            );
          }
        }
        assertContinuationWithinBudget(
          input,
          conversation,
          tools,
          usage.lastInputTokens,
          requestConversationLength,
        );
      }

      throw new ArenaError(
        502,
        "tool_limit_exceeded",
        "OpenAI did not finish within the configured tool-call loop.",
      );
    } catch (error) {
      if (!usageEmitted && usage.measuredCalls > 0) {
        try {
          await emitUsage();
        } catch {
          // Preserve the original provider/tool failure if telemetry persistence fails.
        }
      }
      throw error;
    }
  }

  async compact(input: ProviderCompactInput): Promise<ProviderCompactOutput> {
    const response = await this.#request(
      "/responses/compact",
      {
        model: input.model.model,
        input: input.history,
      },
      input.signal,
    );
    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      throw new ArenaError(
        502,
        "provider_protocol_error",
        "OpenAI returned an invalid compaction response.",
      );
    }
    if (
      !isRecord(payload) ||
      payload.object !== "response.compaction" ||
      !Array.isArray(payload.output)
    ) {
      throw new ArenaError(
        502,
        "provider_protocol_error",
        "OpenAI returned an invalid compaction response.",
      );
    }
    const estimatedFromItems = Math.ceil(JSON.stringify(payload.output).length / 4);
    return {
      history: payload.output,
      mode: "native",
      estimatedActiveTokens: Math.max(0, estimatedFromItems),
    };
  }

  async #streamResponse(
    body: JsonRecord,
    signal: AbortSignal,
    onEvent: (event: NormalizedProviderEvent) => Promise<void>,
    observer: RemoteToolObserver,
    usage: UsageAccumulator,
  ): Promise<{ value: JsonRecord; streamedText: string }> {
    const response = await this.#request("/responses", body, signal);
    if (response.body === null) {
      throw new ArenaError(
        502,
        "provider_protocol_error",
        "OpenAI returned an empty streaming response.",
      );
    }

    let completed: JsonRecord | undefined;
    const streamedText: string[] = [];
    for await (const rawData of sseData(response.body)) {
      if (rawData === "[DONE]") {
        continue;
      }
      let parsed: unknown;
      try {
        parsed = JSON.parse(rawData) as unknown;
      } catch {
        throw new ArenaError(
          502,
          "provider_protocol_error",
          "OpenAI returned an invalid streaming event.",
        );
      }
      if (!isRecord(parsed)) {
        continue;
      }
      await observer.observe(parsed);
      const type = optionalString(parsed.type);
      if (type === "response.output_text.delta") {
        const delta = optionalString(parsed.delta);
        if (delta === undefined) {
          throw new ArenaError(
            502,
            "provider_protocol_error",
            "OpenAI returned an invalid text delta.",
          );
        }
        streamedText.push(delta);
        await onEvent({
          type: "output.delta",
          safeData: { delta },
        });
      } else if (type === "response.output_text.done") {
        if (
          streamedText.length === 0 &&
          typeof parsed.text === "string"
        ) {
          streamedText.push(parsed.text);
        }
      } else if (type === "response.completed") {
        if (!isRecord(parsed.response)) {
          throw new ArenaError(
            502,
            "provider_protocol_error",
            "OpenAI returned an invalid completed response.",
          );
        }
        completed = parsed.response;
      } else if (type === "response.failed") {
        if (
          isRecord(parsed.response) &&
          parsed.response.usage !== undefined
        ) {
          addUsage(usage, parsed.response.usage);
        }
        throw new ArenaError(
          502,
          "provider_failed",
          "OpenAI failed to generate a response.",
        );
      } else if (type === "response.incomplete") {
        if (
          isRecord(parsed.response) &&
          parsed.response.usage !== undefined
        ) {
          addUsage(usage, parsed.response.usage);
        }
        throw new ArenaError(
          502,
          "provider_incomplete",
          "OpenAI returned an incomplete response.",
        );
      } else if (type === "error") {
        throw new ArenaError(
          502,
          "provider_failed",
          "OpenAI returned a streaming error.",
        );
      }
    }
    if (completed === undefined) {
      throw new ArenaError(
        502,
        "provider_protocol_error",
        "OpenAI streaming ended without a completed response.",
      );
    }
    return { value: completed, streamedText: streamedText.join("") };
  }

  async #request(
    path: string,
    body: JsonRecord,
    signal: AbortSignal,
  ): Promise<Response> {
    const apiKey = this.#requiredApiKey();
    let response: Response;
    try {
      response = await this.#fetch(`${this.#baseUrl}${path}`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${apiKey}`,
          "content-type": "application/json",
        },
        body: JSON.stringify(body),
        signal,
      });
    } catch (error) {
      if (isAbortError(error)) {
        throw error;
      }
      throw new ArenaError(
        503,
        "provider_unavailable",
        "OpenAI could not be reached.",
      );
    }
    if (!response.ok) {
      throw new ArenaError(
        502,
        "provider_failed",
        "OpenAI rejected the provider request.",
        { providerStatus: response.status },
      );
    }
    return response;
  }

  #requiredApiKey(): string {
    if (this.#apiKey === undefined || this.#apiKey.trim().length === 0) {
      throw new ArenaError(
        503,
        "provider_not_configured",
        "OpenAI provider credentials are not configured.",
      );
    }
    return this.#apiKey;
  }
}

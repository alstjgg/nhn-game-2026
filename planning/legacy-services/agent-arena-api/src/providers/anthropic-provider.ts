import { ArenaError } from "../errors.js";
import { anthropicSupportsNativeCompactionModel } from "../provider-capabilities.js";
import { executeFunctionTool } from "../tools.js";
import type {
  AgentProvider,
  ProviderCompactInput,
  ProviderCompactOutput,
  ProviderTurnInput,
  ProviderTurnOutput,
  ResolvedHostedSkill,
  ResolvedMcpTool,
  TokenUsage,
  ToolTrace,
} from "../types.js";

const ANTHROPIC_API_VERSION = "2023-06-01";
const MCP_BETA = "mcp-client-2025-11-20";
const SKILLS_BETA = "skills-2025-10-02";
const COMPACTION_BETA = "compact-2026-01-12";
const NATIVE_COMPACTION_MINIMUM_TOKENS = 50_000;
const MAX_SERVER_CONTINUATIONS = 10;
const TERMINAL_STOP_REASONS = new Set([
  "end_turn",
  "max_tokens",
  "stop_sequence",
  "tool_use",
  "pause_turn",
  "refusal",
  "model_context_window_exceeded",
  "compaction",
]);

type JsonRecord = Record<string, unknown>;

type AnthropicMessageParam = {
  role: "user" | "assistant";
  content: string | JsonRecord[];
};

type ParsedAnthropicMessage = {
  id?: string;
  content: JsonRecord[];
  stopReason: string | null;
  usage: JsonRecord;
  containerId?: string;
};

type UsageAccumulator = {
  inputTokens: number;
  outputTokens: number;
  cachedInputTokens: number;
  cachedObserved: boolean;
  reasoningTokens: number;
  reasoningObserved: boolean;
  measurementComplete: boolean;
};

type PendingServerTool = {
  type: "mcp" | "skill";
  name: string;
};

class AnthropicStreamError extends ArenaError {
  declare readonly measuredUsage: JsonRecord;

  constructor(error: ArenaError, measuredUsage: JsonRecord) {
    super(error.status, error.code, error.message, error.safeDetails);
    this.name = "AnthropicStreamError";
    Object.defineProperty(this, "measuredUsage", {
      value: structuredClone(measuredUsage),
      enumerable: false,
      configurable: false,
      writable: false,
    });
  }
}

export type AnthropicProviderOptions = {
  apiKey?: string;
  baseUrl?: string;
  fetch?: typeof fetch;
};

function isRecord(value: unknown): value is JsonRecord {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function numericValue(record: JsonRecord, key: string): number | undefined {
  const value = record[key];
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

function stringValue(record: JsonRecord, key: string): string | undefined {
  const value = record[key];
  return typeof value === "string" ? value : undefined;
}

function isAbortError(error: unknown): boolean {
  return (
    error instanceof DOMException
      ? error.name === "AbortError"
      : error instanceof Error && error.name === "AbortError"
  );
}

function asMessageHistory(history: unknown[]): AnthropicMessageParam[] {
  return history.map((entry) => {
    if (!isRecord(entry)) {
      throw new ArenaError(
        500,
        "invalid_provider_history",
        "Stored Anthropic history is invalid.",
      );
    }
    const role = entry.role;
    const content = entry.content;
    if (
      (role !== "user" && role !== "assistant") ||
      (typeof content !== "string" && !Array.isArray(content))
    ) {
      throw new ArenaError(
        500,
        "invalid_provider_history",
        "Stored Anthropic history is invalid.",
      );
    }
    if (
      Array.isArray(content) &&
      !content.every((block) => isRecord(block))
    ) {
      throw new ArenaError(
        500,
        "invalid_provider_history",
        "Stored Anthropic history is invalid.",
      );
    }
    return structuredClone(entry) as AnthropicMessageParam;
  });
}

function mergeUsage(
  current: JsonRecord,
  update: unknown,
): JsonRecord {
  if (!isRecord(update)) {
    return current;
  }
  const merged: JsonRecord = { ...current, ...update };
  for (const nestedKey of [
    "cache_creation",
    "output_tokens_details",
    "server_tool_use",
  ]) {
    const currentNested = current[nestedKey];
    const updateNested = update[nestedKey];
    if (isRecord(currentNested) && isRecord(updateNested)) {
      merged[nestedKey] = { ...currentNested, ...updateNested };
    }
  }
  return merged;
}

function usageRecords(usage: JsonRecord): {
  records: JsonRecord[];
  complete: boolean;
} {
  const iterations = usage.iterations;
  if (Array.isArray(iterations) && iterations.length > 0) {
    const records = iterations
      .map((iteration) => {
        if (!isRecord(iteration)) {
          return undefined;
        }
        return isRecord(iteration.usage) ? iteration.usage : iteration;
      })
      .filter((record): record is JsonRecord => record !== undefined);
    if (records.length > 0) {
      return {
        records,
        complete: records.length === iterations.length,
      };
    }
  }
  return {
    records: [usage],
    complete: !Array.isArray(iterations) || iterations.length === 0,
  };
}

function addUsage(
  accumulator: UsageAccumulator,
  usage: JsonRecord,
): void {
  const normalized = usageRecords(usage);
  if (!normalized.complete) {
    accumulator.measurementComplete = false;
  }
  for (const record of normalized.records) {
    const inputTokens = numericValue(record, "input_tokens");
    const outputTokens = numericValue(record, "output_tokens");
    if (
      inputTokens === undefined ||
      outputTokens === undefined ||
      !Number.isInteger(inputTokens) ||
      !Number.isInteger(outputTokens) ||
      inputTokens < 0 ||
      outputTokens < 0
    ) {
      accumulator.measurementComplete = false;
    }
    accumulator.inputTokens += inputTokens ?? 0;
    accumulator.outputTokens += outputTokens ?? 0;

    const cacheRead = numericValue(record, "cache_read_input_tokens");
    let cacheCreation = numericValue(record, "cache_creation_input_tokens");
    if (cacheCreation === undefined && isRecord(record.cache_creation)) {
      const fiveMinute =
        numericValue(record.cache_creation, "ephemeral_5m_input_tokens") ?? 0;
      const oneHour =
        numericValue(record.cache_creation, "ephemeral_1h_input_tokens") ?? 0;
      if (
        "ephemeral_5m_input_tokens" in record.cache_creation ||
        "ephemeral_1h_input_tokens" in record.cache_creation
      ) {
        cacheCreation = fiveMinute + oneHour;
      }
    }
    if (cacheRead !== undefined || cacheCreation !== undefined) {
      const cachedTokens = (cacheRead ?? 0) + (cacheCreation ?? 0);
      accumulator.cachedObserved = true;
      accumulator.cachedInputTokens += cachedTokens;
      accumulator.inputTokens += cachedTokens;
    }

    if (isRecord(record.output_tokens_details)) {
      const thinking = numericValue(
        record.output_tokens_details,
        "thinking_tokens",
      );
      if (thinking !== undefined) {
        accumulator.reasoningObserved = true;
        accumulator.reasoningTokens += thinking;
      }
    }
  }
}

function emptyUsageAccumulator(): UsageAccumulator {
  return {
    inputTokens: 0,
    outputTokens: 0,
    cachedInputTokens: 0,
    cachedObserved: false,
    reasoningTokens: 0,
    reasoningObserved: false,
    measurementComplete: true,
  };
}

function measuredInputTokens(usage: JsonRecord): number | null {
  const iterations = usage.iterations;
  let effectiveUsage = usage;
  if (Array.isArray(iterations) && iterations.length > 0) {
    const finalIteration = iterations.at(-1);
    if (!isRecord(finalIteration)) {
      return null;
    }
    effectiveUsage = isRecord(finalIteration.usage)
      ? finalIteration.usage
      : finalIteration;
  }
  const accumulator = emptyUsageAccumulator();
  addUsage(accumulator, effectiveUsage);
  return accumulator.measurementComplete ? accumulator.inputTokens : null;
}

function finalizeUsage(accumulator: UsageAccumulator): TokenUsage {
  const cachedInputTokens = accumulator.cachedObserved
    ? accumulator.cachedInputTokens
    : null;
  const reasoningTokens = accumulator.reasoningObserved
    ? accumulator.reasoningTokens
    : null;
  return {
    inputTokens: accumulator.inputTokens,
    cachedInputTokens,
    outputTokens: accumulator.outputTokens,
    reasoningTokens,
    totalTokens: accumulator.inputTokens + accumulator.outputTokens,
    source: accumulator.measurementComplete
      ? "provider_measured"
      : "unavailable",
  };
}

function approximateTokens(value: string): number {
  return value.length === 0 ? 0 : Math.max(1, Math.ceil(value.length / 4));
}

function conservativeTokenUpperBound(value: unknown): number {
  const serialized = JSON.stringify(value);
  return serialized === undefined
    ? 0
    : Math.max(1, Buffer.byteLength(serialized, "utf8"));
}

function hasFinalUsageUpdate(update: unknown): boolean {
  if (!isRecord(update)) {
    return false;
  }
  const outputTokens = numericValue(update, "output_tokens");
  if (
    outputTokens !== undefined &&
    Number.isInteger(outputTokens) &&
    outputTokens >= 0
  ) {
    return true;
  }
  return Array.isArray(update.iterations) && update.iterations.length > 0;
}

function withMeasuredStreamUsage(
  error: unknown,
  usage: JsonRecord,
  sawFinalUsage: boolean,
): unknown {
  if (!sawFinalUsage || !(error instanceof ArenaError)) {
    return error;
  }
  const accumulator = emptyUsageAccumulator();
  addUsage(accumulator, usage);
  if (!accumulator.measurementComplete) {
    return error;
  }
  return new AnthropicStreamError(error, usage);
}

function assertNoPlaintextThinking(block: JsonRecord): void {
  if (block.type === "thinking") {
    throw new ArenaError(
      502,
      "provider_protocol_error",
      "Anthropic returned unexpected plaintext thinking.",
    );
  }
}

function assertContinuationWithinContext(
  input: ProviderTurnInput,
  messages: AnthropicMessageParam[],
  appendedFromIndex: number,
  lastInputTokens: number | null,
): void {
  const newlyAppendedTokens = conservativeTokenUpperBound(
    messages.slice(appendedFromIndex),
  );
  const projectedActiveTokens = Math.max(
    conservativeTokenUpperBound(messages),
    lastInputTokens === null
      ? 0
      : lastInputTokens + newlyAppendedTokens,
  );
  const hardLimit = Math.max(
    1,
    Math.floor(
      input.harness.maxInputTokens *
        input.harness.contextHardLimitRatio,
    ),
  );
  if (projectedActiveTokens >= hardLimit) {
    throw new ArenaError(
      422,
      "context_hard_limit",
      "Anthropic continuation reached the configured context hard limit.",
    );
  }
}

function hasCompactionBlock(messages: AnthropicMessageParam[]): boolean {
  return messages.some(
    (message) =>
      Array.isArray(message.content) &&
      message.content.some((block) => block.type === "compaction"),
  );
}

function parseEventRecord(rawEvent: string): {
  eventName: string | undefined;
  data: string | undefined;
} {
  let eventName: string | undefined;
  const data: string[] = [];
  for (const line of rawEvent.replace(/\r\n/g, "\n").split("\n")) {
    if (line === "" || line.startsWith(":")) {
      continue;
    }
    const separator = line.indexOf(":");
    const field = separator === -1 ? line : line.slice(0, separator);
    let value = separator === -1 ? "" : line.slice(separator + 1);
    if (value.startsWith(" ")) {
      value = value.slice(1);
    }
    if (field === "event") {
      eventName = value;
    } else if (field === "data") {
      data.push(value);
    }
  }
  return {
    eventName,
    data: data.length === 0 ? undefined : data.join("\n"),
  };
}

async function forEachSseEvent(
  response: Response,
  onEvent: (eventName: string | undefined, data: string) => Promise<void>,
): Promise<void> {
  if (response.body === null) {
    throw new ArenaError(
      502,
      "provider_protocol_error",
      "Anthropic returned an empty stream.",
    );
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  const processBufferedEvents = async (flush: boolean): Promise<void> => {
    while (true) {
      const match = /\r?\n\r?\n/.exec(buffer);
      if (match === null) {
        break;
      }
      const rawEvent = buffer.slice(0, match.index);
      buffer = buffer.slice(match.index + match[0].length);
      const parsed = parseEventRecord(rawEvent);
      if (parsed.data !== undefined) {
        await onEvent(parsed.eventName, parsed.data);
      }
    }
    if (flush && buffer.trim() !== "") {
      const parsed = parseEventRecord(buffer);
      if (parsed.data !== undefined) {
        await onEvent(parsed.eventName, parsed.data);
      }
      buffer = "";
    }
  };

  while (true) {
    const result = await reader.read();
    if (result.done) {
      buffer += decoder.decode();
      await processBufferedEvents(true);
      return;
    }
    buffer += decoder.decode(result.value, { stream: true });
    await processBufferedEvents(false);
  }
}

async function parseStreamingMessage(
  response: Response,
  onTextDelta: (delta: string) => Promise<void>,
): Promise<ParsedAnthropicMessage> {
  let id: string | undefined;
  let stopReason: string | null = null;
  let usage: JsonRecord = {};
  let containerId: string | undefined;
  let sawMessageStart = false;
  let sawMessageStop = false;
  let sawFinalUsage = false;
  const content: Array<JsonRecord | undefined> = [];
  const partialToolInputs = new Map<number, string>();
  const openContentBlocks = new Set<number>();

  try {
    await forEachSseEvent(response, async (eventName, data) => {
      if (data === "[DONE]") {
        return;
      }
      let payload: unknown;
      try {
        payload = JSON.parse(data);
      } catch {
        throw new ArenaError(
          502,
          "provider_protocol_error",
          "Anthropic returned invalid streaming data.",
        );
      }
      if (!isRecord(payload)) {
        return;
      }
      const payloadType = stringValue(payload, "type") ?? eventName;
      if (payloadType === "error" || eventName === "error") {
        throw new ArenaError(
          503,
          "provider_unavailable",
          "Anthropic terminated the response stream.",
        );
      }

      if (payloadType === "message_start") {
        if (!isRecord(payload.message)) {
          throw new ArenaError(
            502,
            "provider_protocol_error",
            "Anthropic returned an invalid message start.",
          );
        }
        sawMessageStart = true;
        id = stringValue(payload.message, "id");
        usage = mergeUsage(usage, payload.message.usage);
        const initialContent = payload.message.content;
        if (Array.isArray(initialContent)) {
          for (const [index, block] of initialContent.entries()) {
            if (isRecord(block)) {
              assertNoPlaintextThinking(block);
              content[index] = structuredClone(block);
            }
          }
        }
        if (isRecord(payload.message.container)) {
          containerId = stringValue(payload.message.container, "id");
        }
        return;
      }

      if (payloadType === "content_block_start") {
        const index = numericValue(payload, "index");
        if (
          index === undefined ||
          !Number.isInteger(index) ||
          index < 0 ||
          !isRecord(payload.content_block)
        ) {
          throw new ArenaError(
            502,
            "provider_protocol_error",
            "Anthropic returned an invalid content block.",
          );
        }
        assertNoPlaintextThinking(payload.content_block);
        content[index] = structuredClone(payload.content_block);
        if (openContentBlocks.has(index)) {
          throw new ArenaError(
            502,
            "provider_protocol_error",
            "Anthropic started the same content block twice.",
          );
        }
        openContentBlocks.add(index);
        return;
      }

      if (payloadType === "content_block_delta") {
        const index = numericValue(payload, "index");
        if (
          index === undefined ||
          !Number.isInteger(index) ||
          index < 0 ||
          !isRecord(payload.delta)
        ) {
          throw new ArenaError(
            502,
            "provider_protocol_error",
            "Anthropic returned an invalid content delta.",
          );
        }
        const block = content[index];
        if (block === undefined) {
          throw new ArenaError(
            502,
            "provider_protocol_error",
            "Anthropic streamed a delta before its content block.",
          );
        }
        const deltaType = stringValue(payload.delta, "type");
        if (deltaType === "text_delta") {
          const text = stringValue(payload.delta, "text") ?? "";
          block.text = `${stringValue(block, "text") ?? ""}${text}`;
          if (text !== "") {
            await onTextDelta(text);
          }
        } else if (deltaType === "input_json_delta") {
          const partialJson =
            stringValue(payload.delta, "partial_json") ?? "";
          partialToolInputs.set(
            index,
            `${partialToolInputs.get(index) ?? ""}${partialJson}`,
          );
        } else if (deltaType === "thinking_delta") {
          throw new ArenaError(
            502,
            "provider_protocol_error",
            "Anthropic returned unexpected plaintext thinking.",
          );
        } else if (deltaType === "signature_delta") {
          block.signature = stringValue(payload.delta, "signature") ?? "";
        } else if (deltaType === "citations_delta") {
          const citations = Array.isArray(block.citations)
            ? [...block.citations]
            : [];
          if (payload.delta.citation !== undefined) {
            citations.push(structuredClone(payload.delta.citation));
          }
          block.citations = citations;
        } else if (deltaType === "compaction_delta") {
          block.content = payload.delta.content;
          block.encrypted_content = payload.delta.encrypted_content;
        }
        return;
      }

      if (payloadType === "content_block_stop") {
        const index = numericValue(payload, "index");
        if (
          index === undefined ||
          !Number.isInteger(index) ||
          index < 0 ||
          !openContentBlocks.has(index) ||
          content[index] === undefined
        ) {
          throw new ArenaError(
            502,
            "provider_protocol_error",
            "Anthropic stopped an unknown content block.",
          );
        }
        if (partialToolInputs.has(index)) {
          const rawInput = partialToolInputs.get(index) ?? "";
          try {
            content[index]!.input = JSON.parse(rawInput);
          } catch {
            throw new ArenaError(
              502,
              "invalid_tool_input",
              "Anthropic returned invalid tool input.",
            );
          }
          partialToolInputs.delete(index);
        }
        openContentBlocks.delete(index);
        return;
      }

      if (payloadType === "message_delta") {
        if (isRecord(payload.delta)) {
          const nextStopReason = payload.delta.stop_reason;
          if (typeof nextStopReason === "string" || nextStopReason === null) {
            stopReason = nextStopReason;
          }
          if (isRecord(payload.delta.container)) {
            containerId =
              stringValue(payload.delta.container, "id") ?? containerId;
          }
        }
        if (hasFinalUsageUpdate(payload.usage)) {
          sawFinalUsage = true;
        }
        usage = mergeUsage(usage, payload.usage);
        return;
      }

      if (payloadType === "message_stop") {
        sawMessageStop = true;
      }
    });
  } catch (error) {
    throw withMeasuredStreamUsage(error, usage, sawFinalUsage);
  }

  if (!sawMessageStart) {
    throw new ArenaError(
      502,
      "provider_protocol_error",
      "Anthropic did not start a response message.",
    );
  }
  if (
    !sawMessageStop ||
    openContentBlocks.size > 0 ||
    partialToolInputs.size > 0 ||
    stopReason === null ||
    !TERMINAL_STOP_REASONS.has(stopReason)
  ) {
    throw withMeasuredStreamUsage(
      new ArenaError(
        502,
        "provider_protocol_error",
        "Anthropic returned an incomplete response stream.",
      ),
      usage,
      sawFinalUsage,
    );
  }
  return {
    ...(id === undefined ? {} : { id }),
    content: content.filter(
      (block): block is JsonRecord => block !== undefined,
    ),
    stopReason,
    usage,
    ...(containerId === undefined ? {} : { containerId }),
  };
}

function parseJsonMessage(payload: unknown): ParsedAnthropicMessage {
  if (!isRecord(payload) || !Array.isArray(payload.content)) {
    throw new ArenaError(
      502,
      "provider_protocol_error",
      "Anthropic returned an invalid message.",
    );
  }
  const content = payload.content.map((block) => {
    if (!isRecord(block)) {
      throw new ArenaError(
        502,
        "provider_protocol_error",
        "Anthropic returned an invalid content block.",
      );
    }
    assertNoPlaintextThinking(block);
    return structuredClone(block);
  });
  const stopReason =
    typeof payload.stop_reason === "string" || payload.stop_reason === null
      ? payload.stop_reason
      : null;
  const id = stringValue(payload, "id");
  const containerId = isRecord(payload.container)
    ? stringValue(payload.container, "id")
    : undefined;
  return {
    ...(id === undefined ? {} : { id }),
    content,
    stopReason,
    usage: isRecord(payload.usage) ? structuredClone(payload.usage) : {},
    ...(containerId === undefined ? {} : { containerId }),
  };
}

function finalText(content: JsonRecord[]): string {
  return content
    .filter((block) => block.type === "text")
    .map((block) => stringValue(block, "text") ?? "")
    .join("");
}

function decisionSchema(input: ProviderTurnInput): JsonRecord {
  const cardIds = [...new Set(input.loadout.cardIds)];
  const actionIds = [...new Set(input.allowedActions.map(({ actionId }) => actionId))];
  return {
    type: "object",
    additionalProperties: false,
    properties: {
      actionId: {
        type: "string",
        ...(actionIds.length === 0 ? {} : { enum: actionIds }),
      },
      targetId: {
        anyOf: [{ type: "string" }, { type: "null" }],
      },
      speech: { type: "string" },
      reasonSummary: { type: "string" },
      attributedCardIds: {
        type: "array",
        items: {
          type: "string",
          ...(cardIds.length === 0 ? {} : { enum: cardIds }),
        },
      },
    },
    required: [
      "actionId",
      "targetId",
      "speech",
      "reasonSummary",
      "attributedCardIds",
    ],
  };
}

const UNSUPPORTED_STRICT_SCHEMA_KEYWORDS = new Set([
  "minimum",
  "maximum",
  "exclusiveMinimum",
  "exclusiveMaximum",
  "multipleOf",
  "minLength",
  "maxLength",
  "pattern",
  "format",
  "minItems",
  "maxItems",
  "uniqueItems",
  "minProperties",
  "maxProperties",
  "default",
  "examples",
]);

function sanitizeStrictSchemaValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => sanitizeStrictSchemaValue(entry));
  }
  if (!isRecord(value)) {
    return value;
  }
  const sanitized: JsonRecord = {};
  const constraints: string[] = [];
  for (const [key, entry] of Object.entries(value)) {
    if (UNSUPPORTED_STRICT_SCHEMA_KEYWORDS.has(key)) {
      constraints.push(`${key}=${JSON.stringify(entry)}`);
      continue;
    }
    sanitized[key] = sanitizeStrictSchemaValue(entry);
  }
  if (sanitized.type === "object") {
    sanitized.additionalProperties = false;
  }
  if (constraints.length > 0) {
    const existingDescription =
      typeof sanitized.description === "string"
        ? sanitized.description.trim()
        : "";
    sanitized.description = [
      existingDescription,
      `Validation constraints: ${constraints.join(", ")}.`,
    ]
      .filter((part) => part !== "")
      .join(" ");
  }
  return sanitized;
}

function anthropicFunctionSchema(schema: JsonRecord): JsonRecord {
  const sanitized = sanitizeStrictSchemaValue(schema);
  if (!isRecord(sanitized) || sanitized.type !== "object") {
    throw new ArenaError(
      500,
      "invalid_tool_schema",
      "Anthropic function tools require an object input schema.",
    );
  }
  sanitized.additionalProperties = false;
  return sanitized;
}

function skillReferences(skills: ResolvedHostedSkill[]): JsonRecord[] {
  if (skills.length > 8) {
    throw new ArenaError(
      422,
      "skill_limit_exceeded",
      "Anthropic accepts at most eight Skills per request.",
    );
  }
  return skills.map((skill) => ({
    type: "custom",
    skill_id: skill.skillId,
    ...(skill.version === undefined ? {} : { version: skill.version }),
  }));
}

function normalizedMcpAuthorization(
  authorization: string | undefined,
): string | undefined {
  if (authorization === undefined) {
    return undefined;
  }
  return authorization.replace(/^Bearer\s+/i, "");
}

function mcpRequestParts(mcpTools: ResolvedMcpTool[]): {
  servers: JsonRecord[];
  toolsets: JsonRecord[];
} {
  const labels = new Set<string>();
  const servers: JsonRecord[] = [];
  const toolsets: JsonRecord[] = [];
  for (const mcp of mcpTools) {
    if (!mcp.readOnly) {
      throw new ArenaError(
        422,
        "mcp_not_read_only",
        "Anthropic MCP tools must be approved as read-only.",
      );
    }
    if (!mcp.serverUrl.startsWith("https://")) {
      throw new ArenaError(
        422,
        "invalid_mcp_configuration",
        "Anthropic MCP servers must use public HTTPS URLs.",
      );
    }
    if (labels.has(mcp.serverLabel)) {
      throw new ArenaError(
        422,
        "invalid_mcp_configuration",
        "Anthropic MCP server labels must be unique.",
      );
    }
    labels.add(mcp.serverLabel);
    const authorizationToken = normalizedMcpAuthorization(mcp.authorization);
    servers.push({
      type: "url",
      url: mcp.serverUrl,
      name: mcp.serverLabel,
      ...(authorizationToken === undefined
        ? {}
        : { authorization_token: authorizationToken }),
    });
    const configs: JsonRecord = {};
    for (const allowedTool of mcp.allowedTools) {
      configs[allowedTool] = {
        enabled: true,
        defer_loading: false,
      };
    }
    toolsets.push({
      type: "mcp_toolset",
      mcp_server_name: mcp.serverLabel,
      default_config: {
        enabled: false,
        defer_loading: false,
      },
      configs,
    });
  }
  return { servers, toolsets };
}

function turnBetas(
  input: ProviderTurnInput,
  messages: AnthropicMessageParam[],
): string[] {
  const betas: string[] = [];
  if (input.loadout.mcpTools.length > 0) {
    betas.push(MCP_BETA);
  }
  if (input.loadout.hostedSkills.length > 0) {
    betas.push(SKILLS_BETA);
  }
  if (hasCompactionBlock(messages)) {
    betas.push(COMPACTION_BETA);
  }
  return betas;
}

function supportsNativeCompaction(input: ProviderCompactInput): boolean {
  if (
    !input.model.capabilities.compaction ||
    !input.model.compactModes.includes("native")
  ) {
    return false;
  }
  return anthropicSupportsNativeCompactionModel(input.model.model);
}

export class AnthropicProvider implements AgentProvider {
  readonly providerId = "anthropic" as const;
  readonly #apiKey: string;
  readonly #baseUrl: string;
  readonly #fetch: typeof fetch;

  constructor(options: AnthropicProviderOptions = {}) {
    this.#apiKey = options.apiKey ?? process.env.ANTHROPIC_API_KEY ?? "";
    this.#baseUrl = (
      options.baseUrl ?? "https://api.anthropic.com"
    ).replace(/\/+$/, "");
    this.#fetch = options.fetch ?? globalThis.fetch;
  }

  async runTurn(input: ProviderTurnInput): Promise<ProviderTurnOutput> {
    this.#assertConfigured();
    const messages = asMessageHistory(input.history);
    messages.push({
      role: "user",
      content: [{ type: "text", text: input.userInput }],
    });

    const usageAccumulator = emptyUsageAccumulator();
    const toolTrace: ToolTrace[] = [];
    const pendingServerTools = new Map<string, PendingServerTool>();
    const seenToolUseIds = new Set<string>();
    let serverContinuationCount = 0;
    let containerId: string | undefined;
    let providerRequestId: string | undefined;
    let lastInputTokens: number | null = null;
    let measuredResponseCount = 0;
    let usageFinalEmitted = false;

    const emitUsageFinal = async (): Promise<TokenUsage> => {
      const usage = finalizeUsage(usageAccumulator);
      if (!usageFinalEmitted) {
        usageFinalEmitted = true;
        await input.onEvent({
          type: "usage.final",
          safeData: { ...usage },
        });
      }
      return usage;
    };

    try {
      while (true) {
        const sentMessageCount = messages.length;
        const { body, betas } = this.#turnRequest(
          input,
          messages,
          containerId,
        );
        const response = await this.#post(
          "/v1/messages",
          body,
          betas,
          input.signal,
        );
        const message = await parseStreamingMessage(response, async (delta) => {
          await input.onEvent({
            type: "output.delta",
            safeData: { delta },
          });
        });
        providerRequestId = message.id ?? providerRequestId;
        containerId = message.containerId ?? containerId;
        lastInputTokens = measuredInputTokens(message.usage);
        addUsage(usageAccumulator, message.usage);
        measuredResponseCount += 1;

        const assistantMessage: AnthropicMessageParam = {
          role: "assistant",
          content: structuredClone(message.content),
        };
        messages.push(assistantMessage);
        this.#registerToolUses(
          message.content,
          seenToolUseIds,
          input.harness.maxToolCalls,
        );
        await this.#observeServerTools(
          message.content,
          input,
          pendingServerTools,
          toolTrace,
        );

        const toolUses = message.content.filter(
          (block) => block.type === "tool_use",
        );
        if (toolUses.length > 0) {
          const toolResults: JsonRecord[] = [];
          for (const toolUse of toolUses) {
            toolResults.push(
              await this.#executeClientTool(toolUse, input, toolTrace),
            );
          }
          messages.push({
            role: "user",
            content: toolResults,
          });
          assertContinuationWithinContext(
            input,
            messages,
            sentMessageCount,
            lastInputTokens,
          );
          continue;
        }

        if (message.stopReason === "tool_use") {
          throw new ArenaError(
            502,
            "provider_protocol_error",
            "Anthropic requested an unresolved client tool.",
          );
        }
        if (
          message.stopReason === "pause_turn" ||
          message.stopReason === "compaction"
        ) {
          serverContinuationCount += 1;
          if (serverContinuationCount > MAX_SERVER_CONTINUATIONS) {
            throw new ArenaError(
              502,
              "provider_continuation_limit",
              "Anthropic exceeded the server continuation limit.",
            );
          }
          assertContinuationWithinContext(
            input,
            messages,
            sentMessageCount,
            lastInputTokens,
          );
          continue;
        }
        if (
          message.stopReason === "max_tokens" ||
          message.stopReason === "model_context_window_exceeded"
        ) {
          throw new ArenaError(
            502,
            "provider_output_incomplete",
            "Anthropic did not complete the structured response.",
          );
        }
        if (message.stopReason === "refusal") {
          throw new ArenaError(
            502,
            "provider_refusal",
            "Anthropic refused the structured request.",
          );
        }

        await this.#failUnresolvedServerTools(
          input,
          pendingServerTools,
          toolTrace,
        );
        const text = finalText(message.content);
        let rawDecision: unknown;
        try {
          rawDecision = JSON.parse(text);
        } catch {
          throw new ArenaError(
            502,
            "invalid_provider_output",
            "Anthropic returned invalid structured JSON.",
          );
        }
        const usage = await emitUsageFinal();
        return {
          rawDecision,
          history: structuredClone(messages),
          usage,
          lastInputTokens,
          toolTrace,
          ...(providerRequestId === undefined ? {} : { providerRequestId }),
        };
      }
    } catch (error) {
      if (error instanceof AnthropicStreamError) {
        lastInputTokens = measuredInputTokens(error.measuredUsage);
        addUsage(usageAccumulator, error.measuredUsage);
        measuredResponseCount += 1;
      }
      if (measuredResponseCount > 0 && !usageFinalEmitted) {
        try {
          await emitUsageFinal();
        } catch {
          // Preserve the original provider/tool/validation failure.
        }
      }
      throw error;
    }
  }

  async compact(input: ProviderCompactInput): Promise<ProviderCompactOutput> {
    this.#assertConfigured();
    const messages = asMessageHistory(input.history);
    if (messages.length === 0) {
      return {
        history: [],
        mode: "explicit-summary-fallback",
        estimatedActiveTokens: 0,
      };
    }

    const inputTokens = await this.#countTokens(input, messages);
    if (
      inputTokens >= NATIVE_COMPACTION_MINIMUM_TOKENS &&
      supportsNativeCompaction(input)
    ) {
      const native = await this.#nativeCompact(input, messages);
      if (native !== null) {
        return native;
      }
    }
    return this.#explicitSummaryCompact(input, messages);
  }

  #turnRequest(
    input: ProviderTurnInput,
    messages: AnthropicMessageParam[],
    containerId: string | undefined,
  ): { body: JsonRecord; betas: string[] } {
    const mcp = mcpRequestParts(input.loadout.mcpTools);
    const tools: JsonRecord[] = [
      ...input.loadout.functionTools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        input_schema: anthropicFunctionSchema(tool.inputSchema),
        strict: true,
      })),
      ...mcp.toolsets,
    ];
    const skills = skillReferences(input.loadout.hostedSkills);
    if (skills.length > 0) {
      tools.push({
        type: "code_execution_20260521",
        name: "code_execution",
      });
    }
    const body: JsonRecord = {
      model: input.model.model,
      max_tokens: Math.max(1, input.harness.maxOutputTokens),
      system: input.instructions,
      messages: structuredClone(messages),
      stream: true,
      output_config: {
        format: {
          type: "json_schema",
          schema: decisionSchema(input),
        },
      },
      ...(tools.length === 0 ? {} : { tools }),
      ...(mcp.servers.length === 0 ? {} : { mcp_servers: mcp.servers }),
      ...(skills.length === 0
        ? {}
        : {
            container: {
              ...(containerId === undefined ? {} : { id: containerId }),
              skills,
            },
          }),
    };
    return {
      body,
      betas: turnBetas(input, messages),
    };
  }

  async #executeClientTool(
    toolUse: JsonRecord,
    input: ProviderTurnInput,
    toolTrace: ToolTrace[],
  ): Promise<JsonRecord> {
    const toolUseId = stringValue(toolUse, "id");
    const name = stringValue(toolUse, "name");
    if (toolUseId === undefined || name === undefined) {
      throw new ArenaError(
        502,
        "provider_protocol_error",
        "Anthropic returned an invalid tool call.",
      );
    }
    const startedAt = performance.now();
    await input.onEvent({
      type: "tool.started",
      safeData: { type: "function", name },
    });
    try {
      const allowed = input.loadout.functionTools.some(
        (tool) => tool.name === name,
      );
      if (!allowed) {
        throw new ArenaError(
          422,
          "unknown_tool",
          "Anthropic requested a function that is not in the loadout.",
        );
      }
      const result = executeFunctionTool(name, toolUse.input);
      const durationMs = Math.round(performance.now() - startedAt);
      toolTrace.push({
        type: "function",
        name,
        status: "completed",
        durationMs,
        safeSummary: "Executed an allowlisted deterministic function.",
      });
      await input.onEvent({
        type: "tool.completed",
        safeData: { type: "function", name },
      });
      return {
        type: "tool_result",
        tool_use_id: toolUseId,
        content: JSON.stringify(result),
      };
    } catch {
      const durationMs = Math.round(performance.now() - startedAt);
      toolTrace.push({
        type: "function",
        name,
        status: "failed",
        durationMs,
        safeSummary: "The allowlisted function rejected its input.",
      });
      await input.onEvent({
        type: "tool.failed",
        safeData: { type: "function", name },
      });
      throw new ArenaError(
        502,
        "tool_failed",
        "Anthropic function tool execution failed.",
      );
    }
  }

  #registerToolUses(
    content: JsonRecord[],
    seenToolUseIds: Set<string>,
    maximumToolCalls: number,
  ): void {
    const newIds: string[] = [];
    for (const block of content) {
      if (
        block.type !== "tool_use" &&
        block.type !== "mcp_tool_use" &&
        block.type !== "server_tool_use"
      ) {
        continue;
      }
      const id = stringValue(block, "id");
      if (id === undefined) {
        throw new ArenaError(
          502,
          "provider_protocol_error",
          "Anthropic returned a tool call without an ID.",
        );
      }
      if (seenToolUseIds.has(id) || newIds.includes(id)) {
        throw new ArenaError(
          502,
          "provider_protocol_error",
          "Anthropic reused a tool-call ID.",
        );
      }
      newIds.push(id);
    }
    if (seenToolUseIds.size + newIds.length > maximumToolCalls) {
      throw new ArenaError(
        502,
        "tool_limit_exceeded",
        "Anthropic exceeded the configured tool-call limit.",
      );
    }
    for (const id of newIds) {
      seenToolUseIds.add(id);
    }
  }

  async #observeServerTools(
    content: JsonRecord[],
    input: ProviderTurnInput,
    pending: Map<string, PendingServerTool>,
    toolTrace: ToolTrace[],
  ): Promise<void> {
    for (const block of content) {
      if (block.type === "mcp_tool_use") {
        const id = stringValue(block, "id");
        const toolName = stringValue(block, "name") ?? "tool";
        const serverName = stringValue(block, "server_name") ?? "mcp";
        if (id !== undefined && !pending.has(id)) {
          const name = `${serverName}.${toolName}`;
          pending.set(id, {
            type: "mcp",
            name,
          });
          await input.onEvent({
            type: "tool.started",
            safeData: { type: "mcp", name },
          });
        }
        continue;
      }
      if (block.type === "server_tool_use") {
        const id = stringValue(block, "id");
        const name = stringValue(block, "name") ?? "code_execution";
        if (id !== undefined && !pending.has(id)) {
          pending.set(id, {
            type: "skill",
            name,
          });
          await input.onEvent({
            type: "tool.started",
            safeData: { type: "skill", name },
          });
        }
        continue;
      }

      const blockType = stringValue(block, "type") ?? "";
      const resultId = stringValue(block, "tool_use_id");
      if (
        resultId === undefined ||
        (blockType !== "mcp_tool_result" &&
          !blockType.endsWith("_tool_result"))
      ) {
        continue;
      }
      const active = pending.get(resultId);
      if (active === undefined) {
        continue;
      }
      const nestedContent = block.content;
      const nestedError =
        isRecord(nestedContent) &&
        typeof nestedContent.type === "string" &&
        nestedContent.type.includes("error");
      const returnCode = isRecord(nestedContent)
        ? numericValue(nestedContent, "return_code")
        : undefined;
      const failed =
        block.is_error === true ||
        nestedError ||
        (returnCode !== undefined && returnCode !== 0);
      const status = failed ? "failed" : "completed";
      toolTrace.push({
        type: active.type,
        name: active.name,
        status,
        safeSummary: failed
          ? "The provider-hosted tool reported an error."
          : "The provider-hosted tool completed.",
      });
      await input.onEvent({
        type: failed ? "tool.failed" : "tool.completed",
        safeData: { type: active.type, name: active.name },
      });
      pending.delete(resultId);
      if (failed) {
        throw new ArenaError(
          502,
          "tool_failed",
          "An Anthropic provider-hosted tool failed.",
        );
      }
    }
  }

  async #failUnresolvedServerTools(
    input: ProviderTurnInput,
    pending: Map<string, PendingServerTool>,
    toolTrace: ToolTrace[],
  ): Promise<void> {
    for (const active of pending.values()) {
      toolTrace.push({
        type: active.type,
        name: active.name,
        status: "failed",
        safeSummary: "The provider-hosted tool did not return a result.",
      });
      await input.onEvent({
        type: "tool.failed",
        safeData: { type: active.type, name: active.name },
      });
    }
    pending.clear();
    if (toolTrace.some((trace) => trace.status === "failed")) {
      throw new ArenaError(
        502,
        "tool_failed",
        "An Anthropic provider-hosted tool did not return a result.",
      );
    }
  }

  async #countTokens(
    input: ProviderCompactInput,
    messages: AnthropicMessageParam[],
  ): Promise<number> {
    const betas = hasCompactionBlock(messages) ? [COMPACTION_BETA] : [];
    const payload = await this.#postJson(
      "/v1/messages/count_tokens",
      {
        model: input.model.model,
        messages: structuredClone(messages),
      },
      betas,
      input.signal,
    );
    if (!isRecord(payload)) {
      throw new ArenaError(
        502,
        "provider_protocol_error",
        "Anthropic returned an invalid token count.",
      );
    }
    const inputTokens = numericValue(payload, "input_tokens");
    if (inputTokens === undefined) {
      throw new ArenaError(
        502,
        "provider_protocol_error",
        "Anthropic returned an invalid token count.",
      );
    }
    return inputTokens;
  }

  async #nativeCompact(
    input: ProviderCompactInput,
    messages: AnthropicMessageParam[],
  ): Promise<ProviderCompactOutput | null> {
    const payload = await this.#postJson(
      "/v1/messages",
      {
        model: input.model.model,
        max_tokens: Math.max(1, input.harness.maxOutputTokens),
        messages: structuredClone(messages),
        context_management: {
          edits: [
            {
              type: "compact_20260112",
              trigger: {
                type: "input_tokens",
                value: NATIVE_COMPACTION_MINIMUM_TOKENS,
              },
              pause_after_compaction: true,
              instructions:
                "Summarize the prior agent context for future arena decisions. Preserve public game facts, commitments, tool outcomes, and recent legal-action context. Do not include hidden reasoning, credentials, or provider metadata. Do not call tools; return summary text only.",
            },
          ],
        },
      },
      [COMPACTION_BETA],
      input.signal,
    );
    const message = parseJsonMessage(payload);
    if (message.stopReason !== "compaction") {
      return null;
    }
    const compaction = message.content.find(
      (block) =>
        block.type === "compaction" &&
        typeof block.content === "string" &&
        block.content.length > 0,
    );
    if (compaction === undefined) {
      return null;
    }
    const summary = stringValue(compaction, "content") ?? "";
    return {
      history: [
        {
          role: "assistant",
          content: [structuredClone(compaction)],
        },
      ],
      mode: "native",
      estimatedActiveTokens: approximateTokens(summary),
    };
  }

  async #explicitSummaryCompact(
    input: ProviderCompactInput,
    messages: AnthropicMessageParam[],
  ): Promise<ProviderCompactOutput> {
    const prompt =
      "Summarize the prior agent conversation for use in future arena decisions. Preserve public game facts, commitments, tool outcomes, and the latest legal-action context. Do not include hidden reasoning, credentials, or provider metadata. Return only the concise summary text.";
    const payload = await this.#postJson(
      "/v1/messages",
      {
        model: input.model.model,
        max_tokens: Math.max(1, input.harness.maxOutputTokens),
        messages: [
          ...structuredClone(messages),
          {
            role: "user",
            content: [{ type: "text", text: prompt }],
          },
        ],
      },
      hasCompactionBlock(messages) ? [COMPACTION_BETA] : [],
      input.signal,
    );
    const message = parseJsonMessage(payload);
    if (message.stopReason === "refusal") {
      throw new ArenaError(
        502,
        "provider_refusal",
        "Anthropic refused the compaction summary request.",
      );
    }
    if (message.stopReason !== "end_turn") {
      throw new ArenaError(
        502,
        "provider_output_incomplete",
        "Anthropic did not complete the compaction summary.",
      );
    }
    const summary = finalText(message.content).trim();
    if (summary === "") {
      throw new ArenaError(
        502,
        "invalid_provider_output",
        "Anthropic returned an empty compaction summary.",
      );
    }
    const summaryText = `Prior agent context summary:\n${summary}`;
    return {
      history: [
        {
          role: "user",
          content: [{ type: "text", text: summaryText }],
        },
      ],
      mode: "explicit-summary-fallback",
      estimatedActiveTokens: approximateTokens(summaryText),
    };
  }

  async #postJson(
    path: string,
    body: JsonRecord,
    betas: string[],
    signal: AbortSignal,
  ): Promise<unknown> {
    const response = await this.#post(path, body, betas, signal);
    try {
      return await response.json();
    } catch {
      throw new ArenaError(
        502,
        "provider_protocol_error",
        "Anthropic returned invalid JSON.",
      );
    }
  }

  async #post(
    path: string,
    body: JsonRecord,
    betas: string[],
    signal: AbortSignal,
  ): Promise<Response> {
    const headers: Record<string, string> = {
      "content-type": "application/json",
      "x-api-key": this.#apiKey,
      "anthropic-version": ANTHROPIC_API_VERSION,
    };
    if (betas.length > 0) {
      headers["anthropic-beta"] = [...new Set(betas)].join(",");
    }
    let response: Response;
    try {
      response = await this.#fetch(`${this.#baseUrl}${path}`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        signal,
      });
    } catch (error) {
      if (isAbortError(error) || signal.aborted) {
        throw error;
      }
      throw new ArenaError(
        503,
        "provider_unavailable",
        "Anthropic could not be reached.",
      );
    }
    if (!response.ok) {
      throw new ArenaError(
        response.status === 429 ? 503 : 502,
        response.status === 429
          ? "provider_rate_limited"
          : "provider_request_failed",
        "Anthropic request failed.",
        { provider: "anthropic", httpStatus: response.status },
      );
    }
    return response;
  }

  #assertConfigured(): void {
    if (this.#apiKey === "") {
      throw new ArenaError(
        503,
        "provider_unavailable",
        "Anthropic API key is not configured.",
      );
    }
  }
}

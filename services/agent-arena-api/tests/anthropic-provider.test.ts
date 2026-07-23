import { describe, expect, it, vi } from "vitest";

import { AnthropicProvider } from "../src/providers/anthropic-provider.js";
import type {
  NormalizedProviderEvent,
  ProviderCompactInput,
  ProviderTurnInput,
  ResolvedProviderLoadout,
} from "../src/types.js";

type JsonRecord = Record<string, unknown>;

const decision = {
  actionId: "wait",
  targetId: null,
  speech: "Holding.",
  reasonSummary: "Lowest legal risk.",
  attributedCardIds: ["risk-check-v1"],
};

const model: ProviderTurnInput["model"] = {
  id: "claude-arena",
  displayName: "Claude Arena",
  provider: "anthropic",
  model: "claude-sonnet-4-6",
  compactModes: ["native", "explicit-summary-fallback"],
  capabilities: {
    streaming: true,
    functionTools: true,
    remoteMcp: true,
    skills: true,
    compaction: true,
  },
};

const harness: ProviderTurnInput["harness"] = {
  id: "starter-4000",
  displayName: "Starter Harness",
  maxInputTokens: 4000,
  maxOutputTokens: 192,
  maxToolCalls: 3,
  timeoutMs: 15_000,
  fallbackActionId: "wait",
  contextSoftLimitRatio: 0.7,
  contextHardLimitRatio: 0.9,
};

function sseResponse(events: JsonRecord[]): Response {
  const body = `${events
    .map(
      (event) =>
        `event: ${String(event.type)}\ndata: ${JSON.stringify(event)}`,
    )
    .join("\n\n")}\n\n`;
  return new Response(body, {
    status: 200,
    headers: { "content-type": "text/event-stream" },
  });
}

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function finalStream(
  id: string,
  output: unknown,
  startUsage: JsonRecord,
  finalUsage: JsonRecord,
): Response {
  const text = JSON.stringify(output);
  const split = Math.ceil(text.length / 2);
  return sseResponse([
    {
      type: "message_start",
      message: {
        id,
        type: "message",
        role: "assistant",
        content: [],
        stop_reason: null,
        usage: startUsage,
      },
    },
    { type: "ping" },
    { type: "future_event", ignored: true },
    {
      type: "content_block_start",
      index: 0,
      content_block: { type: "text", text: "" },
    },
    {
      type: "content_block_delta",
      index: 0,
      delta: { type: "text_delta", text: text.slice(0, split) },
    },
    {
      type: "content_block_delta",
      index: 0,
      delta: { type: "text_delta", text: text.slice(split) },
    },
    { type: "content_block_stop", index: 0 },
    {
      type: "message_delta",
      delta: { stop_reason: "end_turn", stop_sequence: null },
      usage: finalUsage,
    },
    { type: "message_stop" },
  ]);
}

function loadout(
  overrides: Partial<ResolvedProviderLoadout> = {},
): ResolvedProviderLoadout {
  return {
    cardIds: ["risk-check-v1"],
    instructions: [],
    functionTools: [],
    hostedSkills: [],
    mcpTools: [],
    ...overrides,
  };
}

function turnInput(
  events: NormalizedProviderEvent[],
  loadoutValue: ResolvedProviderLoadout = loadout(),
): ProviderTurnInput {
  return {
    traceId: "trace_test",
    model,
    agentId: "agent-1",
    history: [],
    instructions:
      "Select one legal action and return only the structured decision.",
    userInput: JSON.stringify({
      stageId: "stage-1",
      allowedActions: [
        { actionId: "attack", targetIds: ["enemy-1"] },
        { actionId: "wait", targetIds: [] },
      ],
    }),
    allowedActions: [
      { actionId: "attack", targetIds: ["enemy-1"] },
      { actionId: "wait", targetIds: [] },
    ],
    loadout: loadoutValue,
    harness,
    signal: new AbortController().signal,
    onEvent: async (event) => {
      events.push(event);
    },
  };
}

function requestBody(
  fetchMock: ReturnType<typeof vi.fn<typeof fetch>>,
  callIndex: number,
): JsonRecord {
  const init = fetchMock.mock.calls[callIndex]?.[1];
  return JSON.parse(String(init?.body)) as JsonRecord;
}

describe("AnthropicProvider", () => {
  it("builds the current structured-output, MCP, and Skill request shapes", async () => {
    const fetchMock = vi.fn<typeof fetch>();
    fetchMock.mockResolvedValueOnce(
      finalStream(
        "msg_request_shape",
        decision,
        {
          input_tokens: 10,
          cache_creation_input_tokens: 2,
          cache_read_input_tokens: 3,
          output_tokens: 0,
        },
        {
          output_tokens: 4,
          output_tokens_details: { thinking_tokens: 1 },
        },
      ),
    );
    const events: NormalizedProviderEvent[] = [];
    const provider = new AnthropicProvider({
      apiKey: "anthropic-api-secret",
      fetch: fetchMock,
    });
    const input = turnInput(
      events,
      loadout({
        cardIds: [
          "risk-check-v1",
          "calculator-mcp-v1",
          "arena-tactics-v1",
        ],
        functionTools: [
          {
            name: "arena_risk_check",
            description: "Select the lowest-risk action.",
            inputSchema: {
              type: "object",
              properties: {
                actions: {
                  type: "array",
                  minItems: 1,
                  items: {
                    type: "object",
                    properties: {
                      actionId: { type: "string" },
                      risk: { type: "number", minimum: 0, maximum: 1 },
                    },
                    required: ["actionId", "risk"],
                  },
                },
              },
              required: ["actions"],
            },
          },
        ],
        mcpTools: [
          {
            cardId: "calculator-mcp-v1",
            serverLabel: "arena-calculator",
            serverUrl: "https://mcp.example.test/messages",
            authorization: "Bearer mcp-authorization-secret",
            allowedTools: ["calculate"],
            readOnly: true,
          },
        ],
        hostedSkills: [
          {
            cardId: "arena-tactics-v1",
            name: "Arena Tactics",
            skillId: "skill_test",
            version: "1750000000",
          },
        ],
      }),
    );

    const result = await provider.runTurn(input);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      "https://api.anthropic.com/v1/messages",
    );
    const init = fetchMock.mock.calls[0]?.[1];
    const headers = new Headers(init?.headers);
    expect(headers.get("x-api-key")).toBe("anthropic-api-secret");
    expect(headers.get("anthropic-version")).toBe("2023-06-01");
    expect(headers.get("anthropic-beta")).toBe(
      "mcp-client-2025-11-20,skills-2025-10-02",
    );

    const body = requestBody(fetchMock, 0);
    expect(body).toMatchObject({
      model: "claude-sonnet-4-6",
      max_tokens: 192,
      stream: true,
      output_config: {
        format: {
          type: "json_schema",
          schema: {
            type: "object",
            additionalProperties: false,
          },
        },
      },
      mcp_servers: [
        {
          type: "url",
          url: "https://mcp.example.test/messages",
          name: "arena-calculator",
          authorization_token: "mcp-authorization-secret",
        },
      ],
      container: {
        skills: [
          {
            type: "custom",
            skill_id: "skill_test",
            version: "1750000000",
          },
        ],
      },
    });
    expect(body).not.toHaveProperty("output_format");
    const tools = body.tools as JsonRecord[];
    expect(tools).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "arena_risk_check",
          strict: true,
          input_schema: expect.any(Object),
        }),
        {
          type: "mcp_toolset",
          mcp_server_name: "arena-calculator",
          default_config: { enabled: false, defer_loading: false },
          configs: {
            calculate: { enabled: true, defer_loading: false },
          },
        },
        {
          type: "code_execution_20260521",
          name: "code_execution",
        },
      ]),
    );
    const functionTool = tools.find(
      (tool) => tool.name === "arena_risk_check",
    );
    const sanitizedSchema = functionTool?.input_schema as JsonRecord;
    expect(JSON.stringify(sanitizedSchema)).not.toContain('"minimum"');
    expect(JSON.stringify(sanitizedSchema)).not.toContain('"maximum"');
    expect(JSON.stringify(sanitizedSchema)).not.toContain('"minItems"');
    expect(sanitizedSchema.additionalProperties).toBe(false);
    expect(sanitizedSchema).toMatchObject({
      properties: {
        actions: {
          items: {
            additionalProperties: false,
            properties: {
              risk: {
                description: expect.stringContaining("minimum=0"),
              },
            },
          },
        },
      },
    });
    expect(JSON.stringify(body)).not.toContain(
      "structured-outputs-2025-11-13",
    );
    expect(JSON.stringify(body)).not.toContain("code-execution-2025-08-25");

    expect(result.rawDecision).toEqual(decision);
    expect(result.providerRequestId).toBe("msg_request_shape");
    expect(result.usage).toEqual({
      inputTokens: 15,
      cachedInputTokens: 5,
      outputTokens: 4,
      reasoningTokens: 1,
      totalTokens: 19,
      source: "provider_measured",
    });
    expect(result.usage.totalTokens).toBe(
      result.usage.inputTokens + result.usage.outputTokens,
    );
    expect(result.history).toHaveLength(2);
    const externallyVisible = JSON.stringify({
      result,
      events,
    });
    expect(externallyVisible).not.toContain("anthropic-api-secret");
    expect(externallyVisible).not.toContain("mcp-authorization-secret");
    expect(events.at(-1)).toEqual({
      type: "usage.final",
      safeData: result.usage,
    });
  });

  it("parses streamed tool input, executes the bounded function loop, and preserves native history", async () => {
    const fetchMock = vi.fn<typeof fetch>();
    fetchMock
      .mockResolvedValueOnce(
        sseResponse([
          {
            type: "message_start",
            message: {
              id: "msg_tool",
              role: "assistant",
              content: [],
              stop_reason: null,
              usage: { input_tokens: 8, output_tokens: 0 },
            },
          },
          {
            type: "content_block_start",
            index: 0,
            content_block: {
              type: "tool_use",
              id: "toolu_risk",
              name: "arena_risk_check",
              input: {},
            },
          },
          {
            type: "content_block_delta",
            index: 0,
            delta: {
              type: "input_json_delta",
              partial_json:
                '{"actions":[{"actionId":"attack","risk":0.8},',
            },
          },
          {
            type: "content_block_delta",
            index: 0,
            delta: {
              type: "input_json_delta",
              partial_json: '{"actionId":"wait","risk":0.1}]}',
            },
          },
          { type: "content_block_stop", index: 0 },
          {
            type: "message_delta",
            delta: { stop_reason: "tool_use", stop_sequence: null },
            usage: { output_tokens: 3 },
          },
          { type: "message_stop" },
        ]),
      )
      .mockResolvedValueOnce(
        finalStream(
          "msg_final",
          decision,
          {
            input_tokens: 7,
            cache_read_input_tokens: 2,
            output_tokens: 0,
          },
          { output_tokens: 5 },
        ),
      );
    const events: NormalizedProviderEvent[] = [];
    const provider = new AnthropicProvider({
      apiKey: "test-key",
      fetch: fetchMock,
    });
    const input = turnInput(
      events,
      loadout({
        functionTools: [
          {
            name: "arena_risk_check",
            description: "Select the lowest-risk action.",
            inputSchema: {
              type: "object",
              additionalProperties: false,
              properties: {
                actions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      actionId: { type: "string" },
                      risk: { type: "number" },
                    },
                    required: ["actionId", "risk"],
                  },
                },
              },
              required: ["actions"],
            },
          },
        ],
      }),
    );

    const result = await provider.runTurn(input);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const secondBody = requestBody(fetchMock, 1);
    const messages = secondBody.messages as Array<{
      role: string;
      content: JsonRecord[];
    }>;
    expect(messages).toHaveLength(3);
    expect(messages[1]?.content[0]).toEqual({
      type: "tool_use",
      id: "toolu_risk",
      name: "arena_risk_check",
      input: {
        actions: [
          { actionId: "attack", risk: 0.8 },
          { actionId: "wait", risk: 0.1 },
        ],
      },
    });
    expect(messages[2]?.content[0]).toMatchObject({
      type: "tool_result",
      tool_use_id: "toolu_risk",
    });
    expect(
      JSON.parse(String(messages[2]?.content[0]?.content)),
    ).toEqual({
      selectedActionId: "wait",
      risk: 0.1,
    });
    expect(result.history).toEqual([
      messages[0],
      messages[1],
      messages[2],
      expect.objectContaining({ role: "assistant" }),
    ]);
    expect(result.toolTrace).toEqual([
      expect.objectContaining({
        type: "function",
        name: "arena_risk_check",
        status: "completed",
      }),
    ]);
    expect(result.usage).toEqual({
      inputTokens: 17,
      cachedInputTokens: 2,
      outputTokens: 8,
      reasoningTokens: null,
      totalTokens: 25,
      source: "provider_measured",
    });
    expect(result.lastInputTokens).toBe(9);
    expect(
      events.filter((event) => event.type === "usage.final"),
    ).toHaveLength(1);
    expect(events).toEqual(
      expect.arrayContaining([
        {
          type: "tool.started",
          safeData: { type: "function", name: "arena_risk_check" },
        },
        {
          type: "tool.completed",
          safeData: { type: "function", name: "arena_risk_check" },
        },
      ]),
    );
  });

  it("blocks an over-budget client-tool continuation before a second request", async () => {
    const fetchMock = vi.fn<typeof fetch>();
    fetchMock.mockResolvedValueOnce(
      sseResponse([
        {
          type: "message_start",
          message: {
            id: "msg_tool_at_context_limit",
            role: "assistant",
            content: [],
            stop_reason: null,
            usage: { input_tokens: 3595, output_tokens: 0 },
          },
        },
        {
          type: "content_block_start",
          index: 0,
          content_block: {
            type: "tool_use",
            id: "toolu_context_limit",
            name: "arena_risk_check",
            input: {
              actions: [
                { actionId: "attack", risk: 0.8 },
                { actionId: "wait", risk: 0.1 },
              ],
            },
          },
        },
        { type: "content_block_stop", index: 0 },
        {
          type: "message_delta",
          delta: { stop_reason: "tool_use", stop_sequence: null },
          usage: { output_tokens: 3 },
        },
        { type: "message_stop" },
      ]),
    );
    const events: NormalizedProviderEvent[] = [];
    const provider = new AnthropicProvider({
      apiKey: "test-key",
      fetch: fetchMock,
    });
    const input = turnInput(
      events,
      loadout({
        functionTools: [
          {
            name: "arena_risk_check",
            description: "Select the lowest-risk action.",
            inputSchema: {
              type: "object",
              additionalProperties: false,
              properties: {
                actions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      actionId: { type: "string" },
                      risk: { type: "number" },
                    },
                    required: ["actionId", "risk"],
                  },
                },
              },
              required: ["actions"],
            },
          },
        ],
      }),
    );

    await expect(provider.runTurn(input)).rejects.toMatchObject({
      code: "context_hard_limit",
      message:
        "Anthropic continuation reached the configured context hard limit.",
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(events).toEqual(
      expect.arrayContaining([
        {
          type: "tool.completed",
          safeData: { type: "function", name: "arena_risk_check" },
        },
        {
          type: "usage.final",
          safeData: {
            inputTokens: 3595,
            cachedInputTokens: null,
            outputTokens: 3,
            reasoningTokens: null,
            totalTokens: 3598,
            source: "provider_measured",
          },
        },
      ]),
    );
  });

  it.each([
    {
      stopReason: "pause_turn",
      content: [] as JsonRecord[],
    },
    {
      stopReason: "compaction",
      content: [
        {
          type: "compaction",
          content: "Compact state.",
          encrypted_content: "opaque-state",
        },
      ] as JsonRecord[],
    },
  ])(
    "blocks an over-budget $stopReason continuation before a second request",
    async ({ stopReason, content }) => {
      const fetchMock = vi.fn<typeof fetch>();
      fetchMock.mockResolvedValueOnce(
        sseResponse([
          {
            type: "message_start",
            message: {
              id: `msg_${stopReason}_at_context_limit`,
              role: "assistant",
              content,
              stop_reason: null,
              usage: { input_tokens: 3595, output_tokens: 0 },
            },
          },
          {
            type: "message_delta",
            delta: { stop_reason: stopReason, stop_sequence: null },
            usage: { output_tokens: 1 },
          },
          { type: "message_stop" },
        ]),
      );
      const events: NormalizedProviderEvent[] = [];
      const provider = new AnthropicProvider({
        apiKey: "test-key",
        fetch: fetchMock,
      });

      await expect(
        provider.runTurn(turnInput(events)),
      ).rejects.toMatchObject({
        code: "context_hard_limit",
      });

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(
        events.filter((event) => event.type === "usage.final"),
      ).toEqual([
        {
          type: "usage.final",
          safeData: {
            inputTokens: 3595,
            cachedInputTokens: null,
            outputTokens: 1,
            reasoningTokens: null,
            totalTokens: 3596,
            source: "provider_measured",
          },
        },
      ]);
    },
  );

  it("uses a UTF-8 upper bound for multilingual continuation growth", async () => {
    const fetchMock = vi.fn<typeof fetch>();
    fetchMock.mockResolvedValueOnce(
      sseResponse([
        {
          type: "message_start",
          message: {
            id: "msg_multilingual_pause",
            role: "assistant",
            content: [
              {
                type: "text",
                text: "가".repeat(1_600),
              },
            ],
            stop_reason: null,
            usage: { input_tokens: 100, output_tokens: 0 },
          },
        },
        {
          type: "message_delta",
          delta: { stop_reason: "pause_turn", stop_sequence: null },
          usage: { output_tokens: 1 },
        },
        { type: "message_stop" },
      ]),
    );
    const events: NormalizedProviderEvent[] = [];
    const provider = new AnthropicProvider({
      apiKey: "test-key",
      fetch: fetchMock,
    });

    await expect(provider.runTurn(turnInput(events))).rejects.toMatchObject({
      code: "context_hard_limit",
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(
      events.filter((event) => event.type === "usage.final"),
    ).toHaveLength(1);
  });

  it("accepts an over-threshold final response without attempting a continuation", async () => {
    const fetchMock = vi.fn<typeof fetch>();
    fetchMock.mockResolvedValueOnce(
      finalStream(
        "msg_final_at_context_limit",
        decision,
        { input_tokens: 3600, output_tokens: 0 },
        { output_tokens: 4 },
      ),
    );
    const provider = new AnthropicProvider({
      apiKey: "test-key",
      fetch: fetchMock,
    });

    const result = await provider.runTurn(turnInput([]));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.rawDecision).toEqual(decision);
    expect(result.lastInputTokens).toBe(3600);
  });

  it("normalizes all usage iterations without double-counting cached input", async () => {
    const fetchMock = vi.fn<typeof fetch>();
    fetchMock.mockResolvedValueOnce(
      finalStream(
        "msg_iterations",
        decision,
        { input_tokens: 50, output_tokens: 0 },
        {
          input_tokens: 10,
          output_tokens: 5,
          iterations: [
            {
              type: "compaction",
              input_tokens: 40,
              cache_creation_input_tokens: 2,
              cache_read_input_tokens: 0,
              output_tokens: 3,
              output_tokens_details: { thinking_tokens: 1 },
            },
            {
              type: "message",
              input_tokens: 10,
              cache_read_input_tokens: 4,
              output_tokens: 5,
              output_tokens_details: { thinking_tokens: 2 },
            },
          ],
        },
      ),
    );
    const provider = new AnthropicProvider({
      apiKey: "test-key",
      fetch: fetchMock,
    });

    const result = await provider.runTurn(turnInput([]));

    expect(result.usage).toEqual({
      inputTokens: 56,
      cachedInputTokens: 6,
      outputTokens: 8,
      reasoningTokens: 3,
      totalTokens: 64,
      source: "provider_measured",
    });
    expect(result.lastInputTokens).toBe(14);
  });

  it("emits accumulated measured usage once when a later response fails", async () => {
    const fetchMock = vi.fn<typeof fetch>();
    fetchMock
      .mockResolvedValueOnce(
        sseResponse([
          {
            type: "message_start",
            message: {
              id: "msg_pause",
              role: "assistant",
              content: [],
              stop_reason: null,
              usage: { input_tokens: 8, output_tokens: 0 },
            },
          },
          {
            type: "message_delta",
            delta: { stop_reason: "pause_turn", stop_sequence: null },
            usage: { output_tokens: 3 },
          },
          { type: "message_stop" },
        ]),
      )
      .mockResolvedValueOnce(
        sseResponse([
          {
            type: "message_start",
            message: {
              id: "msg_incomplete",
              role: "assistant",
              content: [],
              stop_reason: null,
              usage: {
                input_tokens: 7,
                cache_read_input_tokens: 2,
                output_tokens: 0,
              },
            },
          },
          {
            type: "message_delta",
            delta: { stop_reason: "max_tokens", stop_sequence: null },
            usage: { output_tokens: 5 },
          },
          { type: "message_stop" },
        ]),
      );
    const events: NormalizedProviderEvent[] = [];
    const provider = new AnthropicProvider({
      apiKey: "test-key",
      fetch: fetchMock,
    });

    await expect(provider.runTurn(turnInput(events))).rejects.toMatchObject({
      code: "provider_output_incomplete",
      message: "Anthropic did not complete the structured response.",
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(events.filter((event) => event.type === "usage.final")).toEqual([
      {
        type: "usage.final",
        safeData: {
          inputTokens: 17,
          cachedInputTokens: 2,
          outputTokens: 8,
          reasoningTokens: null,
          totalTokens: 25,
          source: "provider_measured",
        },
      },
    ]);
  });

  it("rejects a truncated stream even when its partial text is valid JSON", async () => {
    const fetchMock = vi.fn<typeof fetch>();
    fetchMock.mockResolvedValueOnce(
      sseResponse([
        {
          type: "message_start",
          message: {
            id: "msg_truncated",
            role: "assistant",
            content: [],
            stop_reason: null,
            usage: { input_tokens: 4, output_tokens: 0 },
          },
        },
        {
          type: "content_block_start",
          index: 0,
          content_block: { type: "text", text: "" },
        },
        {
          type: "content_block_delta",
          index: 0,
          delta: {
            type: "text_delta",
            text: JSON.stringify(decision),
          },
        },
        { type: "content_block_stop", index: 0 },
        {
          type: "message_delta",
          delta: { stop_reason: "end_turn", stop_sequence: null },
          usage: { output_tokens: 5 },
        },
      ]),
    );
    const events: NormalizedProviderEvent[] = [];
    const provider = new AnthropicProvider({
      apiKey: "test-key",
      fetch: fetchMock,
    });

    await expect(provider.runTurn(turnInput(events))).rejects.toMatchObject({
      code: "provider_protocol_error",
      message: "Anthropic returned an incomplete response stream.",
    });
    expect(events.filter((event) => event.type === "usage.final")).toEqual([
      {
        type: "usage.final",
        safeData: {
          inputTokens: 4,
          cachedInputTokens: null,
          outputTokens: 5,
          reasoningTokens: null,
          totalTokens: 9,
          source: "provider_measured",
        },
      },
    ]);
  });

  it.each([
    {
      variant: "thinking block",
      contentEvents: [
        {
          type: "content_block_start",
          index: 0,
          content_block: { type: "thinking", thinking: "private chain" },
        },
      ],
    },
    {
      variant: "thinking delta",
      contentEvents: [
        {
          type: "content_block_start",
          index: 0,
          content_block: { type: "text", text: "" },
        },
        {
          type: "content_block_delta",
          index: 0,
          delta: {
            type: "thinking_delta",
            thinking: "private chain",
          },
        },
      ],
    },
  ])(
    "fails closed on an unexpected plaintext $variant",
    async ({ contentEvents }) => {
      const fetchMock = vi.fn<typeof fetch>();
      fetchMock.mockResolvedValueOnce(
        sseResponse([
          {
            type: "message_start",
            message: {
              id: "msg_unexpected_thinking",
              role: "assistant",
              content: [],
              stop_reason: null,
              usage: { input_tokens: 4, output_tokens: 0 },
            },
          },
          ...contentEvents,
          {
            type: "message_delta",
            delta: { stop_reason: "end_turn", stop_sequence: null },
            usage: { output_tokens: 2 },
          },
          { type: "message_stop" },
        ]),
      );
      const provider = new AnthropicProvider({
        apiKey: "test-key",
        fetch: fetchMock,
      });

      await expect(
        provider.runTurn(turnInput([])),
      ).rejects.toMatchObject({
        code: "provider_protocol_error",
        message: "Anthropic returned unexpected plaintext thinking.",
      });
      expect(fetchMock).toHaveBeenCalledTimes(1);
    },
  );

  it("marks a hosted Skill execution with a nonzero return code as failed", async () => {
    const fetchMock = vi.fn<typeof fetch>();
    fetchMock.mockResolvedValueOnce(
      sseResponse([
        {
          type: "message_start",
          message: {
            id: "msg_skill_failed",
            role: "assistant",
            content: [],
            stop_reason: null,
            usage: { input_tokens: 12, output_tokens: 0 },
          },
        },
        {
          type: "content_block_start",
          index: 0,
          content_block: {
            type: "server_tool_use",
            id: "srvtoolu_skill_failed",
            name: "code_execution",
            input: { command: "python /skills/test/run.py" },
          },
        },
        { type: "content_block_stop", index: 0 },
        {
          type: "content_block_start",
          index: 1,
          content_block: {
            type: "code_execution_tool_result",
            tool_use_id: "srvtoolu_skill_failed",
            content: {
              type: "code_execution_result",
              stdout: "",
              stderr: "execution failed",
              return_code: 2,
            },
          },
        },
        { type: "content_block_stop", index: 1 },
        {
          type: "message_delta",
          delta: { stop_reason: "end_turn", stop_sequence: null },
          usage: { output_tokens: 6 },
        },
        { type: "message_stop" },
      ]),
    );
    const events: NormalizedProviderEvent[] = [];
    const provider = new AnthropicProvider({
      apiKey: "test-key",
      fetch: fetchMock,
    });
    const input = turnInput(
      events,
      loadout({
        cardIds: ["arena-tactics-v1"],
        hostedSkills: [
          {
            cardId: "arena-tactics-v1",
            name: "Arena Tactics",
            skillId: "skill_test",
            version: "1750000000",
          },
        ],
      }),
    );

    await expect(provider.runTurn(input)).rejects.toMatchObject({
      code: "tool_failed",
      message: "An Anthropic provider-hosted tool failed.",
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(events).toEqual(
      expect.arrayContaining([
        {
          type: "tool.failed",
          safeData: { type: "skill", name: "code_execution" },
        },
        {
          type: "usage.final",
          safeData: {
            inputTokens: 12,
            cachedInputTokens: null,
            outputTokens: 6,
            reasoningTokens: null,
            totalTokens: 18,
            source: "provider_measured",
          },
        },
      ]),
    );
  });

  it("counts provider-hosted MCP calls against the harness tool budget", async () => {
    const fetchMock = vi.fn<typeof fetch>();
    const serverToolEvents: JsonRecord[] = [
      {
        type: "message_start",
        message: {
          id: "msg_many_mcp_calls",
          role: "assistant",
          content: [],
          stop_reason: null,
          usage: { input_tokens: 5, output_tokens: 0 },
        },
      },
    ];
    for (let index = 0; index < 4; index += 1) {
      serverToolEvents.push(
        {
          type: "content_block_start",
          index,
          content_block: {
            type: "mcp_tool_use",
            id: `mcptoolu_${index}`,
            name: "calculate",
            server_name: "arena-calculator",
            input: { expression: `${index}+1` },
          },
        },
        { type: "content_block_stop", index },
      );
    }
    serverToolEvents.push(
      {
        type: "message_delta",
        delta: { stop_reason: "pause_turn", stop_sequence: null },
        usage: { output_tokens: 10 },
      },
      { type: "message_stop" },
    );
    fetchMock.mockResolvedValueOnce(sseResponse(serverToolEvents));
    const provider = new AnthropicProvider({
      apiKey: "test-key",
      fetch: fetchMock,
    });
    const input = turnInput(
      [],
      loadout({
        mcpTools: [
          {
            cardId: "calculator-mcp-v1",
            serverLabel: "arena-calculator",
            serverUrl: "https://mcp.example.test/messages",
            allowedTools: ["calculate"],
            readOnly: true,
          },
        ],
      }),
    );

    await expect(provider.runTurn(input)).rejects.toMatchObject({
      code: "tool_limit_exceeded",
      message: "Anthropic exceeded the configured tool-call limit.",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("does not expose provider response bodies or configured secrets in errors", async () => {
    const fetchMock = vi.fn<typeof fetch>();
    fetchMock.mockResolvedValueOnce(
      new Response(
        "upstream echoed anthropic-api-secret and mcp-authorization-secret",
        { status: 500 },
      ),
    );
    const provider = new AnthropicProvider({
      apiKey: "anthropic-api-secret",
      fetch: fetchMock,
    });
    const events: NormalizedProviderEvent[] = [];
    const input = turnInput(
      events,
      loadout({
        mcpTools: [
          {
            cardId: "calculator-mcp-v1",
            serverLabel: "arena-calculator",
            serverUrl: "https://mcp.example.test/messages",
            authorization: "Bearer mcp-authorization-secret",
            allowedTools: ["calculate"],
            readOnly: true,
          },
        ],
      }),
    );

    let caught: unknown;
    try {
      await provider.runTurn(input);
    } catch (error) {
      caught = error;
    }

    expect(caught).toMatchObject({
      code: "provider_request_failed",
      message: "Anthropic request failed.",
      safeDetails: { provider: "anthropic", httpStatus: 500 },
    });
    expect(String(caught)).not.toContain("anthropic-api-secret");
    expect(String(caught)).not.toContain("mcp-authorization-secret");
    expect(JSON.stringify(caught)).not.toContain("anthropic-api-secret");
    expect(JSON.stringify(caught)).not.toContain("mcp-authorization-secret");
    expect(events).toEqual([]);
  });

  it("uses native compaction at the documented threshold and preserves its encrypted block", async () => {
    const fetchMock = vi.fn<typeof fetch>();
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ input_tokens: 60_000 }))
      .mockResolvedValueOnce(
        jsonResponse({
          id: "msg_compact",
          role: "assistant",
          content: [
            {
              type: "compaction",
              content: "The party is defending the north gate.",
              encrypted_content: "opaque-encrypted-state",
            },
          ],
          stop_reason: "compaction",
          usage: {
            input_tokens: 100,
            output_tokens: 10,
            iterations: [
              {
                type: "compaction",
                input_tokens: 60_000,
                output_tokens: 100,
              },
            ],
          },
        }),
      );
    const provider = new AnthropicProvider({
      apiKey: "test-key",
      fetch: fetchMock,
    });
    const compactInput: ProviderCompactInput = {
      model,
      history: [
        {
          role: "user",
          content: [{ type: "text", text: "A long prior context." }],
        },
        {
          role: "assistant",
          content: [{ type: "text", text: "Prior decision." }],
        },
      ],
      harness,
      signal: new AbortController().signal,
    };

    const result = await provider.compact(compactInput);

    expect(fetchMock.mock.calls.map((call) => call[0])).toEqual([
      "https://api.anthropic.com/v1/messages/count_tokens",
      "https://api.anthropic.com/v1/messages",
    ]);
    const nativeInit = fetchMock.mock.calls[1]?.[1];
    expect(new Headers(nativeInit?.headers).get("anthropic-beta")).toBe(
      "compact-2026-01-12",
    );
    expect(requestBody(fetchMock, 1)).toMatchObject({
      context_management: {
        edits: [
          {
            type: "compact_20260112",
            trigger: { type: "input_tokens", value: 50_000 },
            pause_after_compaction: true,
          },
        ],
      },
    });
    expect(result).toEqual({
      history: [
        {
          role: "assistant",
          content: [
            {
              type: "compaction",
              content: "The party is defending the north gate.",
              encrypted_content: "opaque-encrypted-state",
            },
          ],
        },
      ],
      mode: "native",
      estimatedActiveTokens: 10,
    });
  });

  it("uses a labeled explicit summary when context is below native compaction's minimum", async () => {
    const fetchMock = vi.fn<typeof fetch>();
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ input_tokens: 49_999 }))
      .mockResolvedValueOnce(
        jsonResponse({
          id: "msg_summary",
          role: "assistant",
          content: [
            {
              type: "text",
              text: "The scout chose to wait while guarding the east path.",
            },
          ],
          stop_reason: "end_turn",
          usage: { input_tokens: 50_000, output_tokens: 14 },
        }),
      );
    const provider = new AnthropicProvider({
      apiKey: "test-key",
      fetch: fetchMock,
    });
    const compactInput: ProviderCompactInput = {
      model,
      history: [
        {
          role: "user",
          content: [{ type: "text", text: "Protect the east path." }],
        },
        {
          role: "assistant",
          content: [{ type: "text", text: "I will wait there." }],
        },
      ],
      harness,
      signal: new AbortController().signal,
    };

    const result = await provider.compact(compactInput);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(
      new Headers(fetchMock.mock.calls[1]?.[1]?.headers).has(
        "anthropic-beta",
      ),
    ).toBe(false);
    const summaryBody = requestBody(fetchMock, 1);
    expect(summaryBody).not.toHaveProperty("context_management");
    expect(summaryBody).not.toHaveProperty("tools");
    const summaryMessages = summaryBody.messages as Array<{
      role: string;
      content: JsonRecord[];
    }>;
    expect(summaryMessages).toHaveLength(3);
    expect(summaryMessages.at(-1)).toMatchObject({
      role: "user",
      content: [
        {
          type: "text",
          text: expect.stringContaining("Summarize the prior agent conversation"),
        },
      ],
    });
    expect(result.mode).toBe("explicit-summary-fallback");
    expect(result.history).toEqual([
      {
        role: "user",
        content: [
          {
            type: "text",
            text:
              "Prior agent context summary:\n" +
              "The scout chose to wait while guarding the east path.",
          },
        ],
      },
    ]);
    expect(result.estimatedActiveTokens).toBeGreaterThan(0);
  });

  it("does not replace history with a truncated explicit summary", async () => {
    const fetchMock = vi.fn<typeof fetch>();
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ input_tokens: 100 }))
      .mockResolvedValueOnce(
        jsonResponse({
          id: "msg_truncated_summary",
          role: "assistant",
          content: [{ type: "text", text: "An incomplete summary" }],
          stop_reason: "max_tokens",
          usage: { input_tokens: 100, output_tokens: 192 },
        }),
      );
    const provider = new AnthropicProvider({
      apiKey: "test-key",
      fetch: fetchMock,
    });

    await expect(
      provider.compact({
        model,
        history: [
          {
            role: "user",
            content: [{ type: "text", text: "Preserve this context." }],
          },
        ],
        harness,
        signal: new AbortController().signal,
      }),
    ).rejects.toMatchObject({
      code: "provider_output_incomplete",
      message: "Anthropic did not complete the compaction summary.",
    });
  });
});

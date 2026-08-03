import { describe, expect, it } from "vitest";

import { ArenaError } from "../src/errors.js";
import {
  OpenAIProvider,
  type OpenAIProviderOptions,
} from "../src/providers/openai-provider.js";
import type {
  NormalizedProviderEvent,
  ProviderTurnInput,
  ResolvedProviderLoadout,
  TokenUsage,
} from "../src/types.js";

type FetchCall = {
  url: string;
  init: RequestInit | undefined;
};

type CompletionOptions = {
  id: string;
  text?: string;
  items?: unknown[];
  usage?: unknown;
  prefixEvents?: unknown[];
};

const measuredUsage = {
  input_tokens: 120,
  input_tokens_details: {
    cache_write_tokens: 8,
    cached_tokens: 40,
  },
  output_tokens: 30,
  output_tokens_details: {
    reasoning_tokens: 9,
  },
  total_tokens: 150,
};

function decisionText(actionId = "wait"): string {
  return JSON.stringify({
    actionId,
    targetId: actionId === "attack" ? "enemy-1" : null,
    speech: `Selecting ${actionId}.`,
    reasonSummary: "This is a legal arena action.",
    attributedCardIds: [],
  });
}

function messageItem(text: string, id = "msg_1"): Record<string, unknown> {
  return {
    id,
    type: "message",
    role: "assistant",
    status: "completed",
    content: [
      {
        type: "output_text",
        text,
        annotations: [],
        logprobs: [],
      },
    ],
  };
}

function completionEvents(options: CompletionOptions): unknown[] {
  const output = [...(options.items ?? [])];
  if (options.text !== undefined) {
    output.push(messageItem(options.text, `msg_${options.id}`));
  }
  const textEvents =
    options.text === undefined
      ? []
      : [
          {
            type: "response.output_text.delta",
            item_id: `msg_${options.id}`,
            output_index: output.length - 1,
            content_index: 0,
            delta: options.text.slice(0, 8),
            sequence_number: 20,
          },
          {
            type: "response.output_text.delta",
            item_id: `msg_${options.id}`,
            output_index: output.length - 1,
            content_index: 0,
            delta: options.text.slice(8),
            sequence_number: 21,
          },
          {
            type: "response.output_text.done",
            item_id: `msg_${options.id}`,
            output_index: output.length - 1,
            content_index: 0,
            text: options.text,
            sequence_number: 22,
          },
        ];
  return [
    {
      type: "response.created",
      response: {
        id: options.id,
        object: "response",
        status: "in_progress",
        output: [],
        usage: null,
      },
      sequence_number: 0,
    },
    ...(options.prefixEvents ?? []),
    ...textEvents,
    {
      type: "response.completed",
      response: {
        id: options.id,
        object: "response",
        status: "completed",
        output,
        usage: options.usage,
      },
      sequence_number: 99,
    },
  ];
}

function sseResponse(
  events: unknown[],
  options: { chunked?: boolean } = {},
): Response {
  const payload = events
    .map((event) => {
      const type =
        event !== null &&
        typeof event === "object" &&
        typeof (event as { type?: unknown }).type === "string"
          ? (event as { type: string }).type
          : "message";
      return `event: ${type}\r\ndata: ${JSON.stringify(event)}\r\n\r\n`;
    })
    .join("");
  if (!options.chunked) {
    return new Response(payload, {
      status: 200,
      headers: { "content-type": "text/event-stream" },
    });
  }
  const encoder = new TextEncoder();
  const splitPoints = [7, 31, 83, 159, payload.length - 5].filter(
    (point, index, values) =>
      point > 0 &&
      point < payload.length &&
      (index === 0 || point > values[index - 1]!),
  );
  const chunks: Uint8Array[] = [];
  let start = 0;
  for (const end of [...splitPoints, payload.length]) {
    chunks.push(encoder.encode(payload.slice(start, end)));
    start = end;
  }
  return new Response(
    new ReadableStream<Uint8Array>({
      start(controller) {
        for (const chunk of chunks) {
          controller.enqueue(chunk);
        }
        controller.close();
      },
    }),
    {
      status: 200,
      headers: { "content-type": "text/event-stream" },
    },
  );
}

function queuedFetch(responses: Response[]): {
  fetch: typeof fetch;
  calls: FetchCall[];
} {
  const pending = [...responses];
  const calls: FetchCall[] = [];
  const implementation = async (
    input: string | URL | Request,
    init?: RequestInit,
  ): Promise<Response> => {
    calls.push({
      url:
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.toString()
            : input.url,
      init,
    });
    const response = pending.shift();
    if (response === undefined) {
      throw new Error("Unexpected fetch call.");
    }
    return response;
  };
  return {
    fetch: implementation as typeof fetch,
    calls,
  };
}

function requestBody(calls: FetchCall[], index: number): Record<string, unknown> {
  const body = calls[index]?.init?.body;
  expect(typeof body).toBe("string");
  return JSON.parse(body as string) as Record<string, unknown>;
}

function baseLoadout(
  overrides: Partial<ResolvedProviderLoadout> = {},
): ResolvedProviderLoadout {
  return {
    cardIds: [],
    instructions: [],
    functionTools: [],
    hostedSkills: [],
    mcpTools: [],
    ...overrides,
  };
}

function turnInput(
  events: NormalizedProviderEvent[],
  overrides: Partial<ProviderTurnInput> = {},
): ProviderTurnInput {
  return {
    traceId: "trace-openai-1",
    model: {
      id: "openai-arena",
      displayName: "OpenAI Arena",
      provider: "openai",
      model: "gpt-test",
      compactModes: ["native"],
      capabilities: {
        streaming: true,
        functionTools: true,
        remoteMcp: true,
        skills: true,
        compaction: true,
      },
    },
    agentId: "scout",
    history: [],
    instructions: "Select one action and return the strict decision.",
    userInput: JSON.stringify({
      allowedActions: [
        { actionId: "attack", targetIds: ["enemy-1"] },
        { actionId: "wait", targetIds: [] },
      ],
    }),
    allowedActions: [
      { actionId: "attack", targetIds: ["enemy-1"] },
      { actionId: "wait", targetIds: [] },
    ],
    loadout: baseLoadout(),
    harness: {
      id: "test-harness",
      displayName: "Test Harness",
      maxInputTokens: 4_000,
      maxOutputTokens: 512,
      maxToolCalls: 4,
      timeoutMs: 5_000,
      fallbackActionId: "wait",
      contextSoftLimitRatio: 0.7,
      contextHardLimitRatio: 0.9,
    },
    signal: new AbortController().signal,
    onEvent: async (event) => {
      events.push(event);
    },
    ...overrides,
  };
}

function provider(
  fetchImplementation: typeof fetch,
  options: Partial<OpenAIProviderOptions> = {},
): OpenAIProvider {
  return new OpenAIProvider({
    apiKey: "openai-secret-key",
    baseUrl: "https://openai.test/v1/",
    fetch: fetchImplementation,
    ...options,
  });
}

describe("OpenAIProvider Responses requests and streaming", () => {
  it("uses strict text.format, store:false item history, and semantic SSE deltas", async () => {
    const text = decisionText();
    const mock = queuedFetch([
      sseResponse(
        completionEvents({
          id: "resp_baseline",
          text,
          usage: measuredUsage,
        }),
        { chunked: true },
      ),
    ]);
    const events: NormalizedProviderEvent[] = [];
    const priorReasoning = {
      id: "rs_prior",
      type: "reasoning",
      encrypted_content: "opaque-provider-state",
    };

    const result = await provider(mock.fetch).runTurn(
      turnInput(events, { history: [priorReasoning] }),
    );

    expect(mock.calls).toHaveLength(1);
    expect(mock.calls[0]?.url).toBe("https://openai.test/v1/responses");
    const headers = new Headers(mock.calls[0]?.init?.headers);
    expect(headers.get("authorization")).toBe("Bearer openai-secret-key");
    expect(headers.get("content-type")).toBe("application/json");

    const body = requestBody(mock.calls, 0);
    expect(body).toMatchObject({
      model: "gpt-test",
      instructions: "Select one action and return the strict decision.",
      max_output_tokens: 512,
      parallel_tool_calls: true,
      store: false,
      stream: true,
      truncation: "disabled",
      include: ["reasoning.encrypted_content"],
      tools: [],
      text: {
        format: {
          type: "json_schema",
          name: "agent_arena_decision",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            required: [
              "actionId",
              "targetId",
              "speech",
              "reasonSummary",
              "attributedCardIds",
            ],
          },
        },
      },
    });
    expect(body.input).toEqual([
      priorReasoning,
      {
        type: "message",
        role: "user",
        content: [{ type: "input_text", text: expect.any(String) }],
      },
    ]);
    expect(result.rawDecision).toBe(text);
    expect(result.history.slice(0, 2)).toEqual(body.input);
    expect(result.history.at(-1)).toEqual(messageItem(text, "msg_resp_baseline"));
    expect(result.providerRequestId).toBe("resp_baseline");
    expect(result.lastInputTokens).toBe(120);
    expect(result.usage).toEqual<TokenUsage>({
      inputTokens: 120,
      cachedInputTokens: 40,
      outputTokens: 30,
      reasoningTokens: 9,
      totalTokens: 150,
      source: "provider_measured",
    });
    expect(
      events
        .filter((event) => event.type === "output.delta")
        .map((event) => event.safeData.delta)
        .join(""),
    ).toBe(text);
    expect(events.at(-1)).toEqual({
      type: "usage.final",
      safeData: result.usage,
    });
  });

  it("executes a bounded function loop and sums every provider call's usage", async () => {
    const functionCall = {
      id: "fc_1",
      type: "function_call",
      status: "completed",
      call_id: "call_1",
      name: "arena_risk_check",
      arguments: JSON.stringify({
        actions: [
          { actionId: "attack", risk: 0.8 },
          { actionId: "wait", risk: 0.1 },
        ],
      }),
    };
    const reasoningItem = {
      id: "rs_1",
      type: "reasoning",
      encrypted_content: "encrypted-reasoning",
      summary: [],
    };
    const secondUsage = {
      input_tokens: 80,
      input_tokens_details: {
        cache_write_tokens: 0,
        cached_tokens: 10,
      },
      output_tokens: 20,
      output_tokens_details: { reasoning_tokens: 3 },
      total_tokens: 100,
    };
    const mock = queuedFetch([
      sseResponse(
        completionEvents({
          id: "resp_tool",
          items: [reasoningItem, functionCall],
          usage: measuredUsage,
          prefixEvents: [
            {
              type: "response.function_call_arguments.delta",
              item_id: "fc_1",
              output_index: 1,
              delta: "{\"actions\":",
              sequence_number: 1,
            },
            {
              type: "response.function_call_arguments.done",
              item_id: "fc_1",
              output_index: 1,
              name: "arena_risk_check",
              arguments: functionCall.arguments,
              sequence_number: 2,
            },
          ],
        }),
      ),
      sseResponse(
        completionEvents({
          id: "resp_final",
          text: decisionText(),
          usage: secondUsage,
        }),
      ),
    ]);
    const events: NormalizedProviderEvent[] = [];
    const input = turnInput(events, {
      loadout: baseLoadout({
        cardIds: ["risk-check-v1"],
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
                  items: { type: "object" },
                },
              },
              required: ["actions"],
            },
          },
        ],
      }),
    });

    const result = await provider(mock.fetch).runTurn(input);

    expect(mock.calls).toHaveLength(2);
    const firstBody = requestBody(mock.calls, 0);
    expect(firstBody.tools).toEqual([
      {
        type: "function",
        name: "arena_risk_check",
        description: "Select the lowest-risk action.",
        parameters: input.loadout.functionTools[0]?.inputSchema,
        strict: true,
      },
    ]);
    const secondBody = requestBody(mock.calls, 1);
    expect(secondBody.store).toBe(false);
    expect(secondBody.text).toEqual(firstBody.text);
    expect(secondBody.tools).toEqual(firstBody.tools);
    expect(secondBody.include).toEqual(firstBody.include);
    expect(secondBody.input).toEqual([
      {
        type: "message",
        role: "user",
        content: [{ type: "input_text", text: input.userInput }],
      },
      reasoningItem,
      functionCall,
      {
        type: "function_call_output",
        call_id: "call_1",
        output: JSON.stringify({
          selectedActionId: "wait",
          risk: 0.1,
        }),
      },
    ]);
    expect(result.history).toEqual([
      ...(secondBody.input as unknown[]),
      messageItem(decisionText(), "msg_resp_final"),
    ]);
    expect(result.usage).toEqual({
      inputTokens: 200,
      cachedInputTokens: 50,
      outputTokens: 50,
      reasoningTokens: 12,
      totalTokens: 250,
      source: "provider_measured",
    });
    expect(result.lastInputTokens).toBe(80);
    expect(result.toolTrace).toEqual([
      expect.objectContaining({
        type: "function",
        name: "arena_risk_check",
        status: "completed",
      }),
    ]);
    expect(
      events.filter(
        (event) =>
          event.type === "tool.started" ||
          event.type === "tool.completed",
      ),
    ).toEqual([
      {
        type: "tool.started",
        safeData: { type: "function", name: "arena_risk_check" },
      },
      {
        type: "tool.completed",
        safeData: { type: "function", name: "arena_risk_check" },
      },
    ]);
  });

  it("blocks a function continuation before a second over-budget request", async () => {
    const functionCall = {
      id: "fc_context_limit",
      type: "function_call",
      status: "completed",
      call_id: "call_context_limit",
      name: "arena_risk_check",
      arguments: JSON.stringify({
        actions: [{ actionId: "wait", risk: 0.1 }],
      }),
    };
    const nearLimitUsage = {
      input_tokens: 3_590,
      input_tokens_details: { cached_tokens: 0 },
      output_tokens: 10,
      output_tokens_details: { reasoning_tokens: 0 },
      total_tokens: 3_600,
    };
    const mock = queuedFetch([
      sseResponse(
        completionEvents({
          id: "resp_context_limit",
          items: [functionCall],
          usage: nearLimitUsage,
        }),
      ),
    ]);
    const events: NormalizedProviderEvent[] = [];
    const input = turnInput(events, {
      loadout: baseLoadout({
        functionTools: [
          {
            name: "arena_risk_check",
            description: "Select the lowest-risk action.",
            inputSchema: {
              type: "object",
              additionalProperties: false,
              properties: { actions: { type: "array" } },
              required: ["actions"],
            },
          },
        ],
      }),
    });

    await expect(provider(mock.fetch).runTurn(input)).rejects.toMatchObject({
      status: 502,
      code: "context_hard_limit",
    });
    expect(mock.calls).toHaveLength(1);
    expect(events.filter((event) => event.type === "usage.final")).toEqual([
      {
        type: "usage.final",
        safeData: {
          inputTokens: 3_590,
          cachedInputTokens: 0,
          outputTokens: 10,
          reasoningTokens: 0,
          totalTokens: 3_600,
          source: "provider_measured",
        },
      },
    ]);
  });

  it("configures an allowlisted MCP and a pinned hosted Skill without exposing secrets", async () => {
    const mcpCall = {
      id: "mcp_1",
      type: "mcp_call",
      server_label: "arena-calculator",
      name: "calculate",
      arguments: "{\"expression\":\"2+2\"}",
      output: "4",
      error: null,
      status: "completed",
    };
    const shellCall = {
      id: "sh_1",
      type: "shell_call",
      call_id: "call_shell_1",
      action: {
        commands: ["python /mnt/data/skill/analyze.py"],
        timeout_ms: 120_000,
        max_output_length: 4_096,
      },
      status: "completed",
    };
    const shellOutput = {
      id: "sho_1",
      type: "shell_call_output",
      call_id: "call_shell_1",
      output: [
        {
          stdout: "safe result",
          stderr: "",
          outcome: { type: "exit", exit_code: 0 },
        },
      ],
    };
    const prefixEvents = [
      {
        type: "response.output_item.added",
        output_index: 1,
        item: mcpCall,
        sequence_number: 1,
      },
      {
        type: "response.mcp_call.in_progress",
        output_index: 1,
        item_id: "mcp_1",
        sequence_number: 2,
      },
      {
        type: "response.mcp_call.completed",
        output_index: 1,
        item_id: "mcp_1",
        sequence_number: 3,
      },
      {
        type: "response.output_item.done",
        output_index: 1,
        item: mcpCall,
        sequence_number: 4,
      },
      {
        type: "response.output_item.added",
        output_index: 2,
        item: shellCall,
        sequence_number: 5,
      },
      {
        type: "response.output_item.done",
        output_index: 2,
        item: shellCall,
        sequence_number: 6,
      },
    ];
    const mock = queuedFetch([
      sseResponse(
        completionEvents({
          id: "resp_hosted",
          text: decisionText(),
          items: [
            {
              id: "mcpl_1",
              type: "mcp_list_tools",
              server_label: "arena-calculator",
              tools: [],
            },
            mcpCall,
            shellCall,
            shellOutput,
          ],
          usage: measuredUsage,
          prefixEvents,
        }),
      ),
    ]);
    const events: NormalizedProviderEvent[] = [];
    const input = turnInput(events, {
      loadout: baseLoadout({
        cardIds: ["calculator-mcp-v1", "arena-tactics-v1"],
        mcpTools: [
          {
            cardId: "calculator-mcp-v1",
            serverLabel: "arena-calculator",
            serverUrl: "https://mcp.test/rpc",
            authorization: "Bearer mcp-super-secret",
            allowedTools: ["calculate"],
            readOnly: true,
          },
        ],
        hostedSkills: [
          {
            cardId: "arena-tactics-v1",
            name: "Arena Tactics",
            skillId: "skill_arena_tactics",
            version: "7",
          },
        ],
      }),
    });

    const result = await provider(mock.fetch).runTurn(input);
    const body = requestBody(mock.calls, 0);

    expect(body.max_tool_calls).toBe(4);
    expect(body.tools).toEqual([
      {
        type: "mcp",
        server_label: "arena-calculator",
        server_url: "https://mcp.test/rpc",
        authorization: "Bearer mcp-super-secret",
        allowed_tools: ["calculate"],
        require_approval: "never",
      },
      {
        type: "shell",
        environment: {
          type: "container_auto",
          network_policy: { type: "disabled" },
          skills: [
            {
              type: "skill_reference",
              skill_id: "skill_arena_tactics",
              version: "7",
            },
          ],
        },
      },
    ]);
    expect(result.toolTrace).toEqual([
      expect.objectContaining({
        type: "mcp",
        name: "arena-calculator.calculate",
        status: "completed",
      }),
      expect.objectContaining({
        type: "skill",
        name: "Arena Tactics",
        status: "completed",
      }),
    ]);
    const externallyVisible = JSON.stringify({
      history: result.history,
      usage: result.usage,
      toolTrace: result.toolTrace,
      events,
    });
    expect(externallyVisible).not.toContain("mcp-super-secret");
    expect(externallyVisible).not.toContain("openai-secret-key");
  });

  it("preserves measured core usage while marking unavailable nested counters null", async () => {
    const mock = queuedFetch([
      sseResponse(
        completionEvents({
          id: "resp_nullable_usage",
          text: decisionText(),
          usage: {
            input_tokens: 11,
            output_tokens: 7,
            total_tokens: 18,
          },
        }),
      ),
    ]);

    const result = await provider(mock.fetch).runTurn(turnInput([]));

    expect(result.usage).toEqual({
      inputTokens: 11,
      cachedInputTokens: null,
      outputTokens: 7,
      reasoningTokens: null,
      totalTokens: 18,
      source: "provider_measured",
    });
  });
});

describe("OpenAIProvider failure handling", () => {
  it("rejects tool calls above the harness cap before executing them", async () => {
    const functionCalls = ["call_1", "call_2"].map((callId, index) => ({
      id: `fc_${index + 1}`,
      type: "function_call",
      status: "completed",
      call_id: callId,
      name: "arena_risk_check",
      arguments: JSON.stringify({
        actions: [{ actionId: "wait", risk: 0.1 }],
      }),
    }));
    const mock = queuedFetch([
      sseResponse(
        completionEvents({
          id: "resp_too_many_tools",
          items: functionCalls,
          usage: measuredUsage,
        }),
      ),
    ]);
    const events: NormalizedProviderEvent[] = [];
    const input = turnInput(events, {
      harness: {
        ...turnInput([]).harness,
        maxToolCalls: 1,
      },
      loadout: baseLoadout({
        functionTools: [
          {
            name: "arena_risk_check",
            description: "Select the lowest-risk action.",
            inputSchema: {
              type: "object",
              additionalProperties: false,
              properties: {
                actions: { type: "array" },
              },
              required: ["actions"],
            },
          },
        ],
      }),
    });

    await expect(provider(mock.fetch).runTurn(input)).rejects.toMatchObject({
      status: 502,
      code: "tool_limit_exceeded",
    });
    expect(mock.calls).toHaveLength(1);
    expect(
      events.some((event) => event.type === "tool.started"),
    ).toBe(false);
  });

  it.each([undefined, "in_progress", "failed", "unknown"])(
    "does not execute a function_call whose status is %s",
    async (status) => {
      const functionCall = {
        id: "fc_unsettled",
        type: "function_call",
        ...(status === undefined ? {} : { status }),
        call_id: "call_unsettled",
        name: "arena_risk_check",
        arguments: JSON.stringify({
          actions: [{ actionId: "wait", risk: 0.1 }],
        }),
      };
      const mock = queuedFetch([
        sseResponse(
          completionEvents({
            id: "resp_unsettled_function",
            items: [functionCall],
            usage: measuredUsage,
          }),
        ),
      ]);
      const events: NormalizedProviderEvent[] = [];
      const input = turnInput(events, {
        loadout: baseLoadout({
          functionTools: [
            {
              name: "arena_risk_check",
              description: "Select the lowest-risk action.",
              inputSchema: {
                type: "object",
                additionalProperties: false,
                properties: { actions: { type: "array" } },
                required: ["actions"],
              },
            },
          ],
        }),
      });

      await expect(provider(mock.fetch).runTurn(input)).rejects.toMatchObject({
        status: 502,
        code: "tool_failed",
      });
      expect(
        events.some((event) => event.type === "tool.started"),
      ).toBe(false);
      expect(events.filter((event) => event.type === "usage.final")).toEqual([
        {
          type: "usage.final",
          safeData: {
            inputTokens: 120,
            cachedInputTokens: 40,
            outputTokens: 30,
            reasoningTokens: 9,
            totalTokens: 150,
            source: "provider_measured",
          },
        },
      ]);
    },
  );

  it.each([
    ["mcp_call", undefined, null],
    ["mcp_call", "in_progress", null],
    ["mcp_call", "unknown", null],
    ["mcp_call", "failed", null],
    ["mcp_call", "completed", { code: "remote_error" }],
    ["shell_call", undefined, null],
    ["shell_call", "in_progress", null],
    ["shell_call", "unknown", null],
    ["shell_call", "failed", null],
    ["shell_call", "completed", { code: "shell_error" }],
  ])(
    "requires an explicitly successful %s (status=%s, error=%s)",
    async (type, status, error) => {
      const remoteCall = {
        id: `${type}_strict`,
        type,
        ...(status === undefined ? {} : { status }),
        ...(error === null ? {} : { error }),
        ...(type === "mcp_call"
          ? {
              server_label: "arena-calculator",
              name: "calculate",
              output: "4",
            }
          : { call_id: "call_shell_strict" }),
      };
      const mock = queuedFetch([
        sseResponse(
          completionEvents({
            id: "resp_strict_remote",
            text: decisionText(),
            items: [remoteCall],
            usage: measuredUsage,
          }),
        ),
      ]);
      const events: NormalizedProviderEvent[] = [];
      const loadout =
        type === "mcp_call"
          ? baseLoadout({
              mcpTools: [
                {
                  cardId: "calculator-mcp-v1",
                  serverLabel: "arena-calculator",
                  serverUrl: "https://mcp.test/rpc",
                  allowedTools: ["calculate"],
                  readOnly: true,
                },
              ],
            })
          : baseLoadout({
              hostedSkills: [
                {
                  cardId: "arena-tactics-v1",
                  name: "Arena Tactics",
                  skillId: "skill_arena_tactics",
                  version: "7",
                },
              ],
            });

      await expect(
        provider(mock.fetch).runTurn(turnInput(events, { loadout })),
      ).rejects.toMatchObject({
        status: 502,
        code: "tool_failed",
      });
      expect(
        events.filter((event) => event.type === "tool.failed"),
      ).toHaveLength(1);
      expect(events.filter((event) => event.type === "usage.final")).toHaveLength(
        1,
      );
    },
  );

  it.each(["mcp_call", "shell_call"])(
    "fails when an observed %s never reaches a terminal event or output item",
    async (type) => {
      const item =
        type === "mcp_call"
          ? {
              id: "remote_orphan",
              type,
              status: "in_progress",
              server_label: "arena-calculator",
              name: "calculate",
            }
          : {
              id: "remote_orphan",
              type,
              status: "in_progress",
              call_id: "call_shell_orphan",
            };
      const mock = queuedFetch([
        sseResponse(
          completionEvents({
            id: "resp_orphan_remote",
            text: decisionText(),
            usage: measuredUsage,
            prefixEvents: [
              {
                type: "response.output_item.added",
                output_index: 0,
                item,
                sequence_number: 1,
              },
            ],
          }),
        ),
      ]);
      const events: NormalizedProviderEvent[] = [];

      await expect(
        provider(mock.fetch).runTurn(turnInput(events)),
      ).rejects.toMatchObject({
        status: 502,
        code: "tool_failed",
      });
      expect(
        events.filter(
          (event) =>
            event.type === "tool.started" || event.type === "tool.failed",
        ),
      ).toEqual([
        expect.objectContaining({ type: "tool.started" }),
        expect.objectContaining({ type: "tool.failed" }),
      ]);
      expect(events.filter((event) => event.type === "usage.final")).toHaveLength(
        1,
      );
    },
  );

  it("emits accumulated paid usage once when a later provider request fails", async () => {
    const functionCall = {
      id: "fc_before_failure",
      type: "function_call",
      status: "completed",
      call_id: "call_before_failure",
      name: "arena_risk_check",
      arguments: JSON.stringify({
        actions: [{ actionId: "wait", risk: 0.1 }],
      }),
    };
    const mock = queuedFetch([
      sseResponse(
        completionEvents({
          id: "resp_paid_before_failure",
          items: [functionCall],
          usage: measuredUsage,
        }),
      ),
      new Response(null, { status: 503 }),
    ]);
    const events: NormalizedProviderEvent[] = [];
    const input = turnInput(events, {
      loadout: baseLoadout({
        functionTools: [
          {
            name: "arena_risk_check",
            description: "Select the lowest-risk action.",
            inputSchema: {
              type: "object",
              additionalProperties: false,
              properties: { actions: { type: "array" } },
              required: ["actions"],
            },
          },
        ],
      }),
    });

    await expect(provider(mock.fetch).runTurn(input)).rejects.toMatchObject({
      status: 502,
      code: "provider_failed",
    });
    expect(mock.calls).toHaveLength(2);
    expect(events.filter((event) => event.type === "usage.final")).toEqual([
      {
        type: "usage.final",
        safeData: {
          inputTokens: 120,
          cachedInputTokens: 40,
          outputTokens: 30,
          reasoningTokens: 9,
          totalTokens: 150,
          source: "provider_measured",
        },
      },
    ]);
  });

  it.each([
    [
      "response.failed",
      {
        type: "response.failed",
        response: {
          status: "failed",
          usage: measuredUsage,
          error: {
            code: "server_error",
            message: "do not echo openai-secret-key",
          },
        },
        sequence_number: 1,
      },
      "provider_failed",
    ],
    [
      "response.incomplete",
      {
        type: "response.incomplete",
        response: {
          status: "incomplete",
          usage: measuredUsage,
          incomplete_details: { reason: "max_output_tokens" },
        },
        sequence_number: 1,
      },
      "provider_incomplete",
    ],
    [
      "error",
      {
        type: "error",
        code: "server_error",
        message: "unsafe provider detail",
        param: null,
        sequence_number: 1,
      },
      "provider_failed",
    ],
  ])("maps %s to a safe terminal error", async (_label, event, code) => {
    const mock = queuedFetch([sseResponse([event])]);
    const events: NormalizedProviderEvent[] = [];
    let caught: unknown;

    try {
      await provider(mock.fetch).runTurn(turnInput(events));
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(ArenaError);
    expect(caught).toMatchObject({ status: 502, code });
    expect((caught as Error).message).not.toContain("openai-secret-key");
    expect((caught as Error).message).not.toContain("unsafe provider detail");
    expect(
      events.filter((observed) => observed.type === "usage.final"),
    ).toHaveLength(_label === "error" ? 0 : 1);
  });

  it("rejects a stream that ends without a semantic terminal event", async () => {
    const mock = queuedFetch([
      sseResponse([
        {
          type: "response.output_text.delta",
          item_id: "msg_1",
          output_index: 0,
          content_index: 0,
          delta: "{}",
          sequence_number: 1,
        },
      ]),
    ]);

    await expect(
      provider(mock.fetch).runTurn(turnInput([])),
    ).rejects.toMatchObject({
      status: 502,
      code: "provider_protocol_error",
    });
  });

  it("never copies an HTTP error body or either credential into thrown details", async () => {
    const apiSecret = "openai-secret-that-must-not-leak";
    const mcpSecret = "mcp-secret-that-must-not-leak";
    const mock = queuedFetch([
      new Response(
        JSON.stringify({
          error: `provider echoed ${apiSecret} and ${mcpSecret}`,
        }),
        {
          status: 401,
          headers: { "content-type": "application/json" },
        },
      ),
    ]);
    const events: NormalizedProviderEvent[] = [];
    const input = turnInput(events, {
      loadout: baseLoadout({
        mcpTools: [
          {
            cardId: "mcp-card",
            serverLabel: "safe-label",
            serverUrl: "https://mcp.test",
            authorization: mcpSecret,
            allowedTools: ["read"],
            readOnly: true,
          },
        ],
      }),
    });
    let caught: unknown;

    try {
      await provider(mock.fetch, { apiKey: apiSecret }).runTurn(input);
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(ArenaError);
    expect(caught).toMatchObject({
      status: 502,
      code: "provider_failed",
      safeDetails: { providerStatus: 401 },
    });
    const visibleError = JSON.stringify({
      name: (caught as Error).name,
      message: (caught as Error).message,
      code: (caught as ArenaError).code,
      safeDetails: (caught as ArenaError).safeDetails,
      events,
    });
    expect(visibleError).not.toContain(apiSecret);
    expect(visibleError).not.toContain(mcpSecret);
  });
});

describe("OpenAIProvider native compaction", () => {
  it("calls /responses/compact and replaces history with its canonical output", async () => {
    const oldHistory = [
      { type: "message", role: "user", content: "old context" },
      { id: "old_msg", type: "message", role: "assistant", content: [] },
    ];
    const compactedOutput = [
      {
        id: "retained_user",
        type: "message",
        role: "user",
        status: "completed",
        content: [{ type: "input_text", text: "retained context" }],
      },
      {
        id: "cmp_1",
        type: "compaction",
        encrypted_content: "opaque-compaction-state",
      },
    ];
    const mock = queuedFetch([
      new Response(
        JSON.stringify({
          id: "resp_compact",
          object: "response.compaction",
          created_at: 1_785_000_000,
          output: compactedOutput,
          usage: {
            input_tokens: 400,
            input_tokens_details: {
              cache_write_tokens: 0,
              cached_tokens: 0,
            },
            output_tokens: 37,
            output_tokens_details: { reasoning_tokens: 0 },
            total_tokens: 437,
          },
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        },
      ),
    ]);
    const compactInput = turnInput([]).model;

    const result = await provider(mock.fetch).compact({
      model: compactInput,
      history: oldHistory,
      harness: turnInput([]).harness,
      signal: new AbortController().signal,
    });

    expect(mock.calls).toHaveLength(1);
    expect(mock.calls[0]?.url).toBe(
      "https://openai.test/v1/responses/compact",
    );
    expect(requestBody(mock.calls, 0)).toEqual({
      model: "gpt-test",
      input: oldHistory,
    });
    expect(result).toEqual({
      history: compactedOutput,
      mode: "native",
      estimatedActiveTokens: Math.ceil(
        JSON.stringify(compactedOutput).length / 4,
      ),
    });
    expect(result.history).not.toContain(oldHistory[0]);
  });
});

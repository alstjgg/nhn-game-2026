import {
  BedrockRuntimeClient,
  ConverseCommand,
  type ConverseCommandOutput,
} from "@aws-sdk/client-bedrock-runtime";

import type { CallTool } from "./calls.js";
import type { RuntimeConfig } from "./config.js";
import { ProviderOutputError, PublicError } from "./errors.js";
import type { RenderedCall } from "./prompt.js";
import type { CallRequest, TokenUsage } from "./types.js";

/**
 * Bedrock Converse, forced through the call's output schema.
 *
 * Ported from `apothecary-llm-layer/src/dialogue-provider.ts`, which has run in
 * production; the differences are that the tool spec is built per request (the
 * judgment schema enumerates the gate's stances) and that `strict` is always on,
 * since DDAY binds haiku.
 *
 * `maxAttempts: 1` is deliberate. API Gateway gives the whole request 9 seconds
 * and the model timeout already eats 7 of them, so an SDK-level retry would land
 * outside the budget and return a gateway error instead of a fallback.
 */

export type ProviderResult = {
  payload: unknown;
  latencyMs: number;
  usage: TokenUsage;
};

export interface CallProvider {
  generate(
    request: CallRequest,
    rendered: RenderedCall,
    tool: CallTool,
  ): Promise<ProviderResult>;
}

type ConverseSender = {
  send(
    command: ConverseCommand,
    options?: { abortSignal?: AbortSignal },
  ): Promise<ConverseCommandOutput>;
};

export function createBedrockClient(config: RuntimeConfig): BedrockRuntimeClient {
  return new BedrockRuntimeClient({ region: config.region, maxAttempts: 1 });
}

export class BedrockCallProvider implements CallProvider {
  constructor(
    private readonly client: ConverseSender,
    private readonly config: RuntimeConfig,
  ) {}

  async generate(
    _request: CallRequest,
    rendered: RenderedCall,
    tool: CallTool,
  ): Promise<ProviderResult> {
    const startedAt = performance.now();

    const command = new ConverseCommand({
      modelId: this.config.modelId,
      system: [{ text: rendered.system }],
      messages: [{ role: "user", content: [{ text: rendered.user }] }],
      inferenceConfig: {
        maxTokens: this.config.maxTokens,
        // The mechanism measurements were taken at the API default, and stance
        // distribution is the measured quantity — pinning a different value here
        // would make the probe's numbers describe a different system.
        temperature: 1,
      },
      toolConfig: {
        tools: [
          {
            toolSpec: {
              name: tool.name,
              description: tool.description,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              inputSchema: { json: tool.inputSchema as any },
            },
          },
        ],
        toolChoice: { tool: { name: tool.name } },
      },
    });

    const abortSignal = AbortSignal.timeout(this.config.modelTimeoutMs);
    let output: ConverseCommandOutput;
    try {
      output = await this.client.send(command, { abortSignal });
    } catch (error) {
      if (abortSignal.aborted) {
        throw new PublicError(
          504,
          "bedrock_timeout",
          "Bedrock did not respond before the call deadline.",
        );
      }
      throw error;
    }

    const usage: TokenUsage = {
      inputTokens: output.usage?.inputTokens ?? 0,
      outputTokens: output.usage?.outputTokens ?? 0,
      totalTokens: output.usage?.totalTokens ?? 0,
    };

    const toolUses = (output.output?.message?.content ?? []).flatMap((block) =>
      block.toolUse ? [block.toolUse] : [],
    );
    const toolUse = toolUses[0];
    if (
      output.stopReason !== "tool_use" ||
      toolUses.length !== 1 ||
      toolUse?.name !== tool.name
    ) {
      throw new ProviderOutputError(
        `Model must return exactly one ${tool.name} tool call.`,
        usage,
      );
    }

    return {
      payload: toolUse.input,
      latencyMs: Math.round(performance.now() - startedAt),
      usage,
    };
  }
}

import {
  BedrockRuntimeClient,
  ConverseCommand,
  type ConverseCommandOutput,
} from "@aws-sdk/client-bedrock-runtime";

import type { RuntimeConfig } from "./config.js";
import {
  dialogueToolSpec,
  DIALOGUE_TOOL_NAME,
} from "./dialogue-schema.js";
import { ProviderOutputError, PublicError } from "./errors.js";
import {
  dialogueSystemPrompt,
  dialogueUserPrompt,
} from "./dialogue-prompt.js";
import type {
  DialogueProvider,
  DialogueRequest,
  ProviderDialogueBeat,
} from "./dialogue-types.js";

type ConverseSender = {
  send(
    command: ConverseCommand,
    options?: { abortSignal?: AbortSignal },
  ): Promise<ConverseCommandOutput>;
};

export function createBedrockClient(config: RuntimeConfig): BedrockRuntimeClient {
  return new BedrockRuntimeClient({
    region: config.region,
    maxAttempts: 1,
  });
}

export class BedrockDialogueProvider implements DialogueProvider {
  constructor(
    private readonly client: ConverseSender,
    private readonly config: RuntimeConfig,
  ) {}

  async generate(request: DialogueRequest): Promise<ProviderDialogueBeat> {
    const startedAt = performance.now();
    const command = new ConverseCommand({
      modelId: this.config.modelId,
      system: [{ text: dialogueSystemPrompt(request) }],
      messages: [
        {
          role: "user",
          content: [{ text: dialogueUserPrompt(request) }],
        },
      ],
      inferenceConfig: {
        maxTokens: this.config.maxTokens,
        temperature: 0.2,
      },
      toolConfig: {
        tools: [
          {
            toolSpec: dialogueToolSpec(
              this.config.structuredOutputMode === "strict-tool",
            ),
          },
        ],
        toolChoice: { tool: { name: DIALOGUE_TOOL_NAME } },
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
          "Bedrock did not respond before the dialogue deadline.",
        );
      }
      throw error;
    }

    const usage = {
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
      toolUse?.name !== DIALOGUE_TOOL_NAME
    ) {
      throw new ProviderOutputError(
        "Model must return exactly one dialogue tool call.",
        usage,
      );
    }

    return {
      rawBeat: toolUse.input,
      latencyMs: Math.round(performance.now() - startedAt),
      usage,
    };
  }
}

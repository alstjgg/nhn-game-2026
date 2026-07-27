import {
  BedrockRuntimeClient,
  ConverseCommand,
  type ConverseCommandOutput,
} from "@aws-sdk/client-bedrock-runtime";

import type { RuntimeConfig } from "./config.js";
import {
  DIALOGUE_INPUT_SCHEMA,
  dialogueToolSpec,
  DIALOGUE_TOOL_NAME,
} from "./dialogue-schema.js";
import { ProviderOutputError, PublicError } from "./errors.js";
import {
  dialogueSystemPrompt,
  dialogueUserPrompt,
} from "./dialogue-prompt.js";
import { HAIKU_MODEL_ID, NOVA_MODEL_ID } from "./config.js";
import type {
  DialogueProvider,
  DialogueRequest,
  ProviderDialogueBeat,
  ReasoningEffort,
} from "./dialogue-types.js";

type ConverseSender = {
  send(
    command: ConverseCommand,
    options?: { abortSignal?: AbortSignal },
  ): Promise<ConverseCommandOutput>;
};

const HAIKU_THINKING_BUDGET: Readonly<
  Record<Exclude<ReasoningEffort, "off">, number>
> = {
  low: 1_024,
  medium: 1_536,
  high: 2_048,
};

function inferenceConfig(
  request: DialogueRequest,
  config: RuntimeConfig,
): { maxTokens?: number; temperature?: number } | undefined {
  if (request.inference.reasoningEffort === "off") {
    return { maxTokens: config.maxTokens, temperature: 0.2 };
  }
  if (request.inference.modelId === HAIKU_MODEL_ID) {
    // maxTokens includes both thinking and the final structured JSON. Keep the
    // same bounded ceiling as Nova while leaving enough room after each budget.
    return { maxTokens: 5_000 };
  }
  // Nova low/medium stay under the model's documented 5K output ceiling.
  // High is deliberately absent from the public capability list because it
  // requires maxTokens to be omitted.
  return { maxTokens: 5_000 };
}

function additionalModelRequestFields(
  request: DialogueRequest,
) {
  const effort = request.inference.reasoningEffort;
  if (effort === "off") return undefined;
  if (request.inference.modelId === NOVA_MODEL_ID) {
    return {
      reasoningConfig: {
        type: "enabled",
        maxReasoningEffort: effort,
      },
    };
  }
  if (request.inference.modelId === HAIKU_MODEL_ID) {
    return {
      thinking: {
        type: "enabled",
        budget_tokens: HAIKU_THINKING_BUDGET[effort],
      },
    };
  }
  return undefined;
}

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
    const thinkingEnabled = request.inference.reasoningEffort !== "off";
    const structuredThinking =
      request.inference.modelId === HAIKU_MODEL_ID && thinkingEnabled;
    const commonInference = inferenceConfig(request, this.config);
    const modelInference = additionalModelRequestFields(request);
    const command = new ConverseCommand({
      modelId: request.inference.modelId,
      system: [
        {
          text: dialogueSystemPrompt(
            request,
            structuredThinking ? "json" : "tool",
          ),
        },
      ],
      messages: [
        {
          role: "user",
          content: [{ text: dialogueUserPrompt(request) }],
        },
      ],
      ...(commonInference === undefined
        ? {}
        : { inferenceConfig: commonInference }),
      ...(modelInference === undefined
        ? {}
        : { additionalModelRequestFields: modelInference }),
      ...(structuredThinking
        ? {
          outputConfig: {
            textFormat: {
              type: "json_schema" as const,
              structure: {
                jsonSchema: {
                  schema: JSON.stringify(DIALOGUE_INPUT_SCHEMA),
                  name: "apothecary_dialogue_beat",
                  description:
                    "One validated Korean NPC dialogue beat and four player choices.",
                },
              },
            },
          },
        }
        : {
          toolConfig: {
            tools: [
              {
                toolSpec: dialogueToolSpec(
                  request.inference.modelId === HAIKU_MODEL_ID,
                ),
              },
            ],
            toolChoice: { tool: { name: DIALOGUE_TOOL_NAME } },
          },
        }),
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
    if (structuredThinking) {
      const textBlocks = (output.output?.message?.content ?? []).flatMap(
        (block) => (typeof block.text === "string" ? [block.text] : []),
      );
      if (output.stopReason !== "end_turn" || textBlocks.length !== 1) {
        throw new ProviderOutputError(
          "Model must return exactly one structured dialogue JSON block.",
          usage,
        );
      }
      try {
        return {
          rawBeat: JSON.parse(textBlocks[0]!),
          latencyMs: Math.round(performance.now() - startedAt),
          usage,
        };
      } catch {
        throw new ProviderOutputError(
          "Model structured dialogue output must be valid JSON.",
          usage,
        );
      }
    }

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

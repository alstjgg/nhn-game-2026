import type { ConverseCommandOutput } from "@aws-sdk/client-bedrock-runtime";
import { describe, expect, it } from "vitest";

import {
  BedrockDialogueProvider,
  createBedrockClient,
} from "../src/dialogue-provider.js";
import { DIALOGUE_TOOL_NAME } from "../src/dialogue-schema.js";
import { NOVA_MODEL_ID } from "../src/config.js";
import {
  validConfig,
  validDialogueRequest,
} from "./fixtures.js";

function output(): ConverseCommandOutput {
  return {
    output: {
      message: {
        role: "assistant",
        content: [
          {
            toolUse: {
              toolUseId: "dialogue-tool-1",
              name: DIALOGUE_TOOL_NAME,
              input: {
                npcLine: "밤마다 생각이 많아집니다.",
                choices: [],
              },
            },
          },
        ],
      },
    },
    stopReason: "tool_use",
    usage: { inputTokens: 200, outputTokens: 100, totalTokens: 300 },
    metrics: { latencyMs: 123 },
    $metadata: {},
  };
}

function structuredOutput(): ConverseCommandOutput {
  return {
    output: {
      message: {
        role: "assistant",
        content: [
          { reasoningContent: { reasoningText: { text: "brief thought" } } },
          {
            text: JSON.stringify({
              npcLine: "밤마다 생각이 많아집니다.",
              choices: [],
            }),
          },
        ],
      },
    },
    stopReason: "end_turn",
    usage: { inputTokens: 200, outputTokens: 100, totalTokens: 300 },
    metrics: { latencyMs: 123 },
    $metadata: {},
  };
}

describe("BedrockDialogueProvider", () => {
  it("disables AWS SDK retries", async () => {
    const client = createBedrockClient(validConfig());

    try {
      expect(await client.config.maxAttempts()).toBe(1);
    } finally {
      client.destroy();
    }
  });

  it("uses the forced strict dialogue tool for Haiku", async () => {
    let commandInput: unknown;
    const client = {
      send: async (command: { input: unknown }) => {
        commandInput = command.input;
        return output();
      },
    };
    const provider = new BedrockDialogueProvider(client, validConfig());

    await provider.generate(validDialogueRequest());

    const input = commandInput as {
      toolConfig: {
        tools: Array<{ toolSpec: { strict?: boolean } }>;
        toolChoice: { tool: { name: string } };
      };
    };
    expect(input.toolConfig.tools[0]?.toolSpec.strict).toBe(true);
    expect(input.toolConfig.toolChoice.tool.name).toBe(DIALOGUE_TOOL_NAME);
  });

  it("omits strict for Nova", async () => {
    let commandInput: unknown;
    const client = {
      send: async (command: { input: unknown }) => {
        commandInput = command.input;
        return output();
      },
    };
    const provider = new BedrockDialogueProvider(
      client,
      validConfig({
        modelId: NOVA_MODEL_ID,
        allowedModelIds: [NOVA_MODEL_ID],
      }),
    );

    const request = validDialogueRequest();
    request.inference.modelId = NOVA_MODEL_ID;
    await provider.generate(request);

    const input = commandInput as {
      toolConfig: {
        tools: Array<{ toolSpec: Record<string, unknown> }>;
      };
    };
    expect(input.toolConfig.tools[0]?.toolSpec).not.toHaveProperty("strict");
  });

  it("maps Nova reasoning effort to Bedrock reasoningConfig", async () => {
    let commandInput: unknown;
    const provider = new BedrockDialogueProvider(
      {
        send: async (command: { input: unknown }) => {
          commandInput = command.input;
          return output();
        },
      },
      validConfig({
        modelId: NOVA_MODEL_ID,
        allowedModelIds: [NOVA_MODEL_ID],
      }),
    );
    const request = validDialogueRequest();
    request.inference = {
      modelId: NOVA_MODEL_ID,
      reasoningEffort: "medium",
    };

    await provider.generate(request);

    expect(commandInput).toMatchObject({
      modelId: NOVA_MODEL_ID,
      additionalModelRequestFields: {
        reasoningConfig: {
          type: "enabled",
          maxReasoningEffort: "medium",
        },
      },
      inferenceConfig: { maxTokens: 5_000 },
      toolConfig: {
        toolChoice: { tool: { name: DIALOGUE_TOOL_NAME } },
      },
    });
    expect(commandInput).not.toHaveProperty("inferenceConfig.temperature");
  });

  it("uses a thinking budget with structured JSON for Haiku", async () => {
    let commandInput: unknown;
    const provider = new BedrockDialogueProvider(
      {
        send: async (command: { input: unknown }) => {
          commandInput = command.input;
          return structuredOutput();
        },
      },
      validConfig(),
    );
    const request = validDialogueRequest();
    request.inference.reasoningEffort = "medium";

    await provider.generate(request);

    expect(commandInput).toMatchObject({
      inferenceConfig: { maxTokens: 5_000 },
      additionalModelRequestFields: {
        thinking: { type: "enabled", budget_tokens: 1_536 },
      },
      outputConfig: {
        textFormat: {
          type: "json_schema",
          structure: {
            jsonSchema: {
              name: "apothecary_dialogue_beat",
            },
          },
        },
      },
    });
    expect(commandInput).not.toHaveProperty("inferenceConfig.temperature");
    expect(commandInput).not.toHaveProperty("toolConfig");
  });

  it("rejects anything other than exactly one dialogue tool call", async () => {
    const invalid = output();
    invalid.output?.message?.content?.push({
      toolUse: {
        toolUseId: "dialogue-tool-2",
        name: DIALOGUE_TOOL_NAME,
        input: {},
      },
    });
    const provider = new BedrockDialogueProvider(
      { send: async () => invalid },
      validConfig(),
    );

    await expect(
      provider.generate(validDialogueRequest()),
    ).rejects.toMatchObject({
      code: "invalid_model_output",
      usage: { inputTokens: 200, outputTokens: 100 },
    });
  });
});

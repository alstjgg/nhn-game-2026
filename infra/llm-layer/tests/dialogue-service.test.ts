import { describe, expect, it } from "vitest";

import { DialogueService } from "../src/dialogue-service.js";
import type { DialogueProvider } from "../src/dialogue-types.js";
import { NOVA_MODEL_ID } from "../src/config.js";
import { validConfig, validDialogueRequest } from "./fixtures.js";

function validProvider(): DialogueProvider {
  return {
    generate: async () => ({
      rawBeat: {
        npcLine: "생각이 많아 밤마다 잠들기가 어렵습니다.",
        choices: [
          {
            label: "무엇이 마음에 걸리시나요?",
            verb: "indirect",
            clueReveals: [],
          },
          {
            label: "빚 때문에 그러신가요?",
            verb: "direct",
            clueReveals: [],
          },
          {
            label: "[관찰] 품 안의 종이를 살핀다",
            verb: "observe",
            clueReveals: ["clue-debt-letter"],
          },
          {
            label: "[조제하러 가기]",
            verb: "craft",
            clueReveals: [],
          },
        ],
      },
      latencyMs: 10,
      usage: { inputTokens: 200, outputTokens: 100, totalTokens: 300 },
    }),
  };
}

describe("DialogueService", () => {
  it("returns a validated live beat", async () => {
    const result = await new DialogueService(
      validConfig(),
      validProvider(),
    ).handle(validDialogueRequest());

    expect(result.telemetry.fallback).toBe(false);
    expect(result.telemetry.inputTokens).toBe(200);
    expect(result.response.choices).toHaveLength(4);
  });

  it("reports the request-selected model and reasoning effort", async () => {
    const request = validDialogueRequest();
    request.inference = {
      modelId: NOVA_MODEL_ID,
      reasoningEffort: "medium",
    };
    const result = await new DialogueService(
      validConfig({ allowedModelIds: [validConfig().modelId, NOVA_MODEL_ID] }),
      validProvider(),
    ).handle(request);

    expect(result.telemetry).toMatchObject({
      model: NOVA_MODEL_ID,
      reasoningEffort: "medium",
      fallback: false,
    });
  });

  it("returns a deterministic playable beat for provider failures", async () => {
    const provider: DialogueProvider = {
      generate: async () => {
        throw new Error("private provider detail");
      },
    };
    const service = new DialogueService(validConfig(), provider);

    const first = await service.handle(validDialogueRequest());
    const second = await service.handle(validDialogueRequest());

    expect(first.response).toEqual(second.response);
    expect(first.telemetry.fallback).toBe(true);
    expect(first.response.choices.map((choice) => choice.verb)).toEqual([
      "indirect",
      "direct",
      "observe",
      "craft",
    ]);
  });

  it("falls back when the model returns an invalid verb distribution", async () => {
    const provider = validProvider();
    const original = provider.generate;
    provider.generate = async (request) => {
      const result = await original(request);
      const beat = result.rawBeat as {
        choices: Array<{ verb: string }>;
      };
      beat.choices[1]!.verb = "indirect";
      return result;
    };

    const result = await new DialogueService(
      validConfig(),
      provider,
    ).handle(validDialogueRequest());

    expect(result.telemetry.fallback).toBe(true);
    expect(result.telemetry.fallbackCodes).toEqual(["invalid_model_output"]);
    expect(result.telemetry.inputTokens).toBe(200);
  });
});

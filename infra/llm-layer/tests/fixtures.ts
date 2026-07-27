import {
  HAIKU_MODEL_ID,
  type RuntimeConfig,
} from "../src/config.js";
import type { DialogueRequest } from "../src/dialogue-types.js";

export function validConfig(
  overrides: Partial<RuntimeConfig> = {},
): RuntimeConfig {
  return {
    region: "ap-northeast-2",
    modelId: HAIKU_MODEL_ID,
    allowedModelIds: [HAIKU_MODEL_ID],
    maxTokens: 160,
    modelTimeoutMs: 7_000,
    allowedOrigin: "https://alstjgg.github.io",
    maxBodyBytes: 32_768,
    ...overrides,
  };
}

export function validDialogueRequest(): DialogueRequest {
  return {
    inference: { modelId: HAIKU_MODEL_ID, reasoningEffort: "off" },
    customer: {
      personaTraits: [
        "A plump young scholar with ink-stained fingers, round cheeks and a horsehair hat slightly askew.",
        "Clutches a folded letter with a broken wax seal.",
      ],
      problem: "며칠째 잠이 오지 않아요.",
      hiddenCause:
        "노름빚 독촉장이 와서 눕기만 하면 심장이 뛴다. 빚 이야기는 절대 먼저 꺼내지 않는다.",
    },
    patienceTier: 0,
    history: [],
    availableClues: [
      {
        id: "clue-debt-letter",
        text: "품 안의 독촉장을 자꾸 만지작거린다.",
      },
    ],
  };
}

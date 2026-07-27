import { createHash } from "node:crypto";

import {
  HAIKU_MODEL_ID,
  NOVA_MODEL_ID,
  type RuntimeConfig,
} from "../src/config.js";
import { DIALOGUE_INPUT_SCHEMA } from "../src/dialogue-schema.js";
import {
  BedrockDialogueProvider,
  createBedrockClient,
} from "../src/dialogue-provider.js";
import {
  REASONING_EFFORTS,
  type DialogueRequest,
  type ReasoningEffort,
} from "../src/dialogue-types.js";
import { parseDialogueBeat } from "../src/dialogue-validation.js";

function argument(name: string, fallback?: string): string {
  const index = process.argv.indexOf(name);
  const value = index >= 0 ? process.argv[index + 1] : fallback;
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

const modelId = argument("--model-id", NOVA_MODEL_ID);
const region = argument("--region", "ap-northeast-2");
const reasoningEffort = argument("--reasoning-effort", "off") as ReasoningEffort;
if (![HAIKU_MODEL_ID, NOVA_MODEL_ID].includes(modelId)) {
  throw new Error("The model ID is not in the template allowlist.");
}
if (region !== "ap-northeast-2") {
  throw new Error("Warm-up must run from ap-northeast-2.");
}
if (!REASONING_EFFORTS.includes(reasoningEffort)) {
  throw new Error("Reasoning effort must be off, low, medium, or high.");
}
if (modelId === NOVA_MODEL_ID && reasoningEffort === "high") {
  throw new Error("Nova high is not in the public capability list.");
}

const request: DialogueRequest = {
  inference: { modelId, reasoningEffort },
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

const config: RuntimeConfig = {
  region,
  modelId,
  allowedModelIds: [modelId],
  maxTokens: 400,
  modelTimeoutMs: 300_000,
  allowedOrigin: "https://alstjgg.github.io",
  maxBodyBytes: 32_768,
};
const client = createBedrockClient(config);
const provider = new BedrockDialogueProvider(client, config);
let result;
try {
  result = await provider.generate(request);
} finally {
  client.destroy();
}
parseDialogueBeat(result.rawBeat, request);

console.log(
  JSON.stringify({
    ok: true,
    modelId,
    reasoningEffort,
    outputMode:
      modelId === HAIKU_MODEL_ID && reasoningEffort !== "off"
        ? "structured-json"
        : "forced-tool",
    schemaSha256: createHash("sha256")
      .update(JSON.stringify(DIALOGUE_INPUT_SCHEMA))
      .digest("hex"),
    latencyMs: result.latencyMs,
    inputTokens: result.usage.inputTokens,
    outputTokens: result.usage.outputTokens,
  }),
);

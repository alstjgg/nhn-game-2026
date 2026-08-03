import {
  BedrockRuntimeClient,
  ConverseCommand,
} from "@aws-sdk/client-bedrock-runtime";
import { createHash } from "node:crypto";

import {
  HAIKU_MODEL_ID,
  NOVA_MODEL_ID,
} from "../src/config.js";
import {
  DIALOGUE_INPUT_SCHEMA,
  DIALOGUE_TOOL_NAME,
  dialogueToolSpec,
} from "../src/dialogue-schema.js";
import {
  dialogueSystemPrompt,
  dialogueUserPrompt,
} from "../src/dialogue-prompt.js";
import type { DialogueRequest } from "../src/dialogue-types.js";
import { parseDialogueBeat } from "../src/dialogue-validation.js";

function argument(name: string, fallback?: string): string {
  const index = process.argv.indexOf(name);
  const value = index >= 0 ? process.argv[index + 1] : fallback;
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

const modelId = argument("--model-id", NOVA_MODEL_ID);
const region = argument("--region", "ap-northeast-2");
if (![HAIKU_MODEL_ID, NOVA_MODEL_ID].includes(modelId)) {
  throw new Error("The model ID is not in the template allowlist.");
}
if (region !== "ap-northeast-2") {
  throw new Error("Warm-up must run from ap-northeast-2.");
}

const request: DialogueRequest = {
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

const strict = modelId === HAIKU_MODEL_ID;
const client = new BedrockRuntimeClient({ region, maxAttempts: 1 });
const startedAt = performance.now();
const result = await client.send(
  new ConverseCommand({
    modelId,
    system: [{ text: dialogueSystemPrompt(request) }],
    messages: [
      {
        role: "user",
        content: [{ text: dialogueUserPrompt(request) }],
      },
    ],
    inferenceConfig: { maxTokens: 400, temperature: 0.2 },
    toolConfig: {
      tools: [{ toolSpec: dialogueToolSpec(strict) }],
      toolChoice: { tool: { name: DIALOGUE_TOOL_NAME } },
    },
  }),
  { abortSignal: AbortSignal.timeout(300_000) },
);

const toolUses = (result.output?.message?.content ?? []).flatMap((block) =>
  block.toolUse ? [block.toolUse] : [],
);
const toolUse = toolUses[0];
if (
  result.stopReason !== "tool_use" ||
  toolUses.length !== 1 ||
  toolUse?.name !== DIALOGUE_TOOL_NAME
) {
  throw new Error(
    "Warm-up response must contain exactly one emit_dialogue_beat tool call.",
  );
}
parseDialogueBeat(toolUse.input, request);

console.log(
  JSON.stringify({
    ok: true,
    modelId,
    strict,
    schemaSha256: createHash("sha256")
      .update(JSON.stringify(DIALOGUE_INPUT_SCHEMA))
      .digest("hex"),
    latencyMs: Math.round(performance.now() - startedAt),
    inputTokens: result.usage?.inputTokens ?? 0,
    outputTokens: result.usage?.outputTokens ?? 0,
  }),
);

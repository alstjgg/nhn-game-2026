import { DIALOGUE_VERBS } from "./dialogue-types.js";

export const DIALOGUE_TOOL_NAME = "emit_dialogue_beat";

type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue };

export const DIALOGUE_INPUT_SCHEMA: JsonValue = {
  type: "object",
  additionalProperties: false,
  required: ["npcLine", "choices"],
  properties: {
    npcLine: {
      type: "string",
      description:
        "The customer's next first-person Korean statement about their own symptoms or circumstances. Never ask the pharmacist a question or ask them to describe their life.",
    },
    choices: {
      type: "array",
      minItems: 1,
      description:
        "Exactly four choices, one for each verb. Lambda enforces the exact count.",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["label", "verb", "clueReveals"],
        properties: {
          label: {
            type: "string",
            description:
              "A short Korean choice-card label. indirect/direct are polite questions spoken directly to the customer, end with ?, and never describe actions such as asking or guessing.",
          },
          verb: {
            type: "string",
            enum: [...DIALOGUE_VERBS],
          },
          clueReveals: {
            type: "array",
            items: { type: "string" },
            description:
              "Only supplied clue IDs; non-observe choices must use an empty array.",
          },
        },
      },
    },
  },
};

export function dialogueToolSpec(strict: boolean) {
  return {
    name: DIALOGUE_TOOL_NAME,
    description: "Return the next validated Apothecary dialogue beat.",
    ...(strict ? { strict: true } : {}),
    inputSchema: { json: DIALOGUE_INPUT_SCHEMA },
  };
}

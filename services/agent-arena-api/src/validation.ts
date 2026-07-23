import { ArenaError } from "./errors.js";
import type {
  AgentDecision,
  AgentLoadoutInput,
  AllowedAction,
  ArenaTurnInput,
  CreateRunInput,
} from "./types.js";

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function assertOnlyKeys(
  value: Record<string, unknown>,
  allowed: string[],
  field: string,
  status = 400,
  code = "invalid_request",
): void {
  const unknown = Object.keys(value).filter((key) => !allowed.includes(key));
  if (unknown.length > 0) {
    throw new ArenaError(
      status,
      code,
      `${field} contains unsupported fields.`,
    );
  }
}

function requiredString(
  value: unknown,
  field: string,
  maxLength = 160,
  status = 400,
  code = "invalid_request",
): string {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.length > maxLength
  ) {
    throw new ArenaError(
      status,
      code,
      `${field} must be a non-empty string up to ${maxLength} characters.`,
    );
  }
  return value;
}

function stringArray(
  value: unknown,
  field: string,
  maxItems: number,
  status = 400,
  code = "invalid_request",
): string[] {
  if (
    !Array.isArray(value) ||
    value.length > maxItems ||
    !value.every(
      (entry) =>
        typeof entry === "string" && entry.length > 0 && entry.length <= 128,
    )
  ) {
    throw new ArenaError(
      status,
      code,
      `${field} must be an array of at most ${maxItems} non-empty strings.`,
    );
  }
  if (new Set(value).size !== value.length) {
    throw new ArenaError(
      status,
      code,
      `${field} cannot contain duplicates.`,
    );
  }
  return [...value];
}

function parseLoadout(value: unknown, index: number): AgentLoadoutInput {
  if (!isRecord(value)) {
    throw new ArenaError(
      400,
      "invalid_request",
      `party[${index}] must be an object.`,
    );
  }
  assertOnlyKeys(
    value,
    ["agentId", "promptCardIds", "skillCardIds", "mcpCardIds"],
    `party[${index}]`,
  );
  return {
    agentId: requiredString(value.agentId, `party[${index}].agentId`, 64),
    promptCardIds: stringArray(
      value.promptCardIds,
      `party[${index}].promptCardIds`,
      16,
    ),
    skillCardIds: stringArray(
      value.skillCardIds,
      `party[${index}].skillCardIds`,
      16,
    ),
    mcpCardIds: stringArray(
      value.mcpCardIds,
      `party[${index}].mcpCardIds`,
      8,
    ),
  };
}

export function parseCreateRunInput(value: unknown): CreateRunInput {
  if (!isRecord(value) || !Array.isArray(value.party)) {
    throw new ArenaError(
      400,
      "invalid_request",
      "Run request must include a party array.",
    );
  }
  assertOnlyKeys(value, ["modelProfileId", "harnessId", "party"], "run");
  if (value.party.length !== 3) {
    throw new ArenaError(
      400,
      "invalid_request",
      "Exactly three party agents are required.",
    );
  }
  const party = value.party.map((entry, index) => parseLoadout(entry, index));
  if (new Set(party.map((entry) => entry.agentId)).size !== party.length) {
    throw new ArenaError(
      400,
      "invalid_request",
      "Party agent IDs must be unique.",
    );
  }
  return {
    modelProfileId: requiredString(
      value.modelProfileId,
      "modelProfileId",
      64,
    ),
    harnessId: requiredString(value.harnessId, "harnessId", 64),
    party,
  };
}

export function parseLoadoutInput(
  agentId: string,
  value: unknown,
): AgentLoadoutInput {
  if (!isRecord(value)) {
    throw new ArenaError(
      400,
      "invalid_request",
      "Loadout request must be an object.",
    );
  }
  assertOnlyKeys(
    value,
    ["promptCardIds", "skillCardIds", "mcpCardIds"],
    "loadout",
  );
  return parseLoadout({ ...value, agentId }, 0);
}

export function parseEmptyObject(value: unknown, field: string): void {
  if (!isRecord(value)) {
    throw new ArenaError(
      400,
      "invalid_request",
      `${field} request must be an object.`,
    );
  }
  assertOnlyKeys(value, [], field);
}

function parseAllowedAction(value: unknown, index: number): AllowedAction {
  if (!isRecord(value)) {
    throw new ArenaError(
      400,
      "invalid_request",
      `allowedActions[${index}] must be an object.`,
    );
  }
  assertOnlyKeys(value, ["actionId", "targetIds"], `allowedActions[${index}]`);
  return {
    actionId: requiredString(
      value.actionId,
      `allowedActions[${index}].actionId`,
      64,
    ),
    targetIds: stringArray(
      value.targetIds,
      `allowedActions[${index}].targetIds`,
      32,
    ),
  };
}

export function parseTurnInput(value: unknown): ArenaTurnInput {
  if (!isRecord(value) || !isRecord(value.event)) {
    throw new ArenaError(
      400,
      "invalid_request",
      "Turn request and event must be objects.",
    );
  }
  assertOnlyKeys(
    value,
    ["stageId", "turnNumber", "event", "allowedActions"],
    "turn",
  );
  assertOnlyKeys(
    value.event,
    ["type", "summary", "publicState"],
    "turn.event",
  );
  if (
    !Number.isSafeInteger(value.turnNumber) ||
    (value.turnNumber as number) < 1
  ) {
    throw new ArenaError(
      400,
      "invalid_request",
      "turnNumber must be a positive integer.",
    );
  }
  if (
    !Array.isArray(value.allowedActions) ||
    value.allowedActions.length < 1 ||
    value.allowedActions.length > 32
  ) {
    throw new ArenaError(
      400,
      "invalid_request",
      "allowedActions must contain 1 to 32 actions.",
    );
  }
  const allowedActions = value.allowedActions.map((entry, index) =>
    parseAllowedAction(entry, index),
  );
  if (!isRecord(value.event.publicState)) {
    throw new ArenaError(
      400,
      "invalid_request",
      "event.publicState must be an object.",
    );
  }
  if (
    new Set(allowedActions.map((entry) => entry.actionId)).size !==
    allowedActions.length
  ) {
    throw new ArenaError(
      400,
      "invalid_request",
      "allowed action IDs must be unique.",
    );
  }
  return {
    stageId: requiredString(value.stageId, "stageId", 128),
    turnNumber: value.turnNumber as number,
    event: {
      type: requiredString(value.event.type, "event.type", 64),
      summary: requiredString(value.event.summary, "event.summary", 2000),
      publicState: structuredClone(value.event.publicState),
    },
    allowedActions,
  };
}

export function parseDecision(
  raw: unknown,
  allowedActions: AllowedAction[],
  equippedCardIds: string[],
): AgentDecision {
  let value = raw;
  if (typeof raw === "string") {
    try {
      value = JSON.parse(raw) as unknown;
    } catch {
      throw new ArenaError(
        502,
        "invalid_model_output",
        "Provider output was not valid JSON.",
      );
    }
  }
  if (!isRecord(value)) {
    throw new ArenaError(
      502,
      "invalid_model_output",
      "Provider decision must be an object.",
    );
  }
  assertOnlyKeys(
    value,
    [
      "actionId",
      "targetId",
      "speech",
      "reasonSummary",
      "attributedCardIds",
    ],
    "decision",
    502,
    "invalid_model_output",
  );
  const actionId = requiredString(
    value.actionId,
    "decision.actionId",
    64,
    502,
    "invalid_model_output",
  );
  const action = allowedActions.find((entry) => entry.actionId === actionId);
  if (action === undefined) {
    throw new ArenaError(
      502,
      "invalid_model_output",
      "Provider selected an action outside the allowlist.",
    );
  }
  const targetId =
    value.targetId === null
      ? null
      : requiredString(
          value.targetId,
          "decision.targetId",
          128,
          502,
          "invalid_model_output",
        );
  if (
    (action.targetIds.length === 0 && targetId !== null) ||
    (action.targetIds.length > 0 &&
      (targetId === null || !action.targetIds.includes(targetId)))
  ) {
    throw new ArenaError(
      502,
      "invalid_model_output",
      "Provider selected an invalid target.",
    );
  }
  const attributedCardIds = stringArray(
    value.attributedCardIds,
    "decision.attributedCardIds",
    16,
    502,
    "invalid_model_output",
  );
  if (
    attributedCardIds.some((cardId) => !equippedCardIds.includes(cardId))
  ) {
    throw new ArenaError(
      502,
      "invalid_model_output",
      "Provider attributed a card that is not equipped.",
    );
  }
  return {
    actionId,
    targetId,
    speech: requiredString(
      value.speech,
      "decision.speech",
      160,
      502,
      "invalid_model_output",
    ),
    reasonSummary: requiredString(
      value.reasonSummary,
      "decision.reasonSummary",
      240,
      502,
      "invalid_model_output",
    ),
    attributedCardIds,
  };
}

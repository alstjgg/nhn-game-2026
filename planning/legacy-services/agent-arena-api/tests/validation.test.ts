import { describe, expect, it } from "vitest";

import { ArenaError } from "../src/errors.js";
import type {
  AgentDecision,
  AllowedAction,
  CreateRunInput,
} from "../src/types.js";
import {
  parseCreateRunInput,
  parseDecision,
  parseLoadoutInput,
  parseTurnInput,
} from "../src/validation.js";

function validCreateRunInput(): CreateRunInput {
  return {
    modelProfileId: "mock-arena",
    harnessId: "starter-4000",
    party: ["vanguard", "guardian", "scout"].map((agentId) => ({
      agentId,
      promptCardIds: ["answer-briefly-v1"],
      skillCardIds: [],
      mcpCardIds: [],
    })),
  };
}

function validTurnInput(): Record<string, unknown> {
  return {
    stageId: "stage-1",
    turnNumber: 1,
    event: {
      type: "enemy-approaches",
      summary: "A training enemy approaches.",
      publicState: { enemyHp: 10 },
    },
    allowedActions: [
      { actionId: "attack", targetIds: ["enemy-1"] },
      { actionId: "wait", targetIds: [] },
    ],
  };
}

const allowedActions: AllowedAction[] = [
  { actionId: "attack", targetIds: ["enemy-1", "enemy-2"] },
  { actionId: "wait", targetIds: [] },
];
const equippedCardIds = ["answer-briefly-v1", "risk-check-v1"];

function validDecision(): AgentDecision {
  return {
    actionId: "attack",
    targetId: "enemy-1",
    speech: "Engaging.",
    reasonSummary: "The selected target is legal.",
    attributedCardIds: ["answer-briefly-v1"],
  };
}

function expectArenaError(
  operation: () => unknown,
  expected: { status: number; code: string },
): ArenaError {
  let caught: unknown;
  try {
    operation();
  } catch (error) {
    caught = error;
  }
  expect(caught).toBeInstanceOf(ArenaError);
  expect(caught).toMatchObject(expected);
  return caught as ArenaError;
}

describe("run and loadout request validation", () => {
  it("accepts an exact three-agent allowlisted-ID shape", () => {
    expect(parseCreateRunInput(validCreateRunInput())).toEqual(
      validCreateRunInput(),
    );
  });

  it("requires exactly three unique party agents", () => {
    const tooSmall = validCreateRunInput();
    tooSmall.party.pop();
    expectArenaError(() => parseCreateRunInput(tooSmall), {
      status: 400,
      code: "invalid_request",
    });

    const duplicate = validCreateRunInput();
    duplicate.party[2]!.agentId = duplicate.party[0]!.agentId;
    expectArenaError(() => parseCreateRunInput(duplicate), {
      status: 400,
      code: "invalid_request",
    });
  });

  it("rejects duplicate card IDs and oversized card lists", () => {
    const duplicated = validCreateRunInput();
    duplicated.party[0]!.promptCardIds = [
      "answer-briefly-v1",
      "answer-briefly-v1",
    ];
    expectArenaError(() => parseCreateRunInput(duplicated), {
      status: 400,
      code: "invalid_request",
    });

    const oversized = validCreateRunInput();
    oversized.party[0]!.skillCardIds = Array.from(
      { length: 17 },
      (_, index) => `skill-${index}`,
    );
    expectArenaError(() => parseCreateRunInput(oversized), {
      status: 400,
      code: "invalid_request",
    });
  });

  it.each([
    ["run", () => parseCreateRunInput({
      ...validCreateRunInput(),
      providerApiKey: "sk-key-must-never-be-accepted",
    })],
    ["party agent", () => {
      const input = validCreateRunInput() as CreateRunInput & {
        party: Array<CreateRunInput["party"][number] & { model?: string }>;
      };
      input.party[0]!.model = "raw-provider-model";
      return parseCreateRunInput(input);
    }],
    ["loadout", () => parseLoadoutInput("vanguard", {
      promptCardIds: [],
      skillCardIds: [],
      mcpCardIds: [],
      mcpUrl: "https://untrusted.example/mcp",
    })],
  ])("rejects unknown fields in the %s shape", (_label, operation) => {
    expectArenaError(operation, {
      status: 400,
      code: "invalid_request",
    });
  });
});

describe("turn request validation", () => {
  it("accepts structured public state and a closed action set", () => {
    expect(parseTurnInput(validTurnInput())).toEqual(validTurnInput());
  });

  it("rejects empty/duplicate action sets and duplicate target IDs", () => {
    expectArenaError(
      () =>
        parseTurnInput({
          ...validTurnInput(),
          allowedActions: [],
        }),
      { status: 400, code: "invalid_request" },
    );

    const duplicateActions = validTurnInput();
    duplicateActions.allowedActions = [
      { actionId: "wait", targetIds: [] },
      { actionId: "wait", targetIds: [] },
    ];
    expectArenaError(() => parseTurnInput(duplicateActions), {
      status: 400,
      code: "invalid_request",
    });

    const duplicateTargets = validTurnInput();
    duplicateTargets.allowedActions = [
      {
        actionId: "attack",
        targetIds: ["enemy-1", "enemy-1"],
      },
    ];
    expectArenaError(() => parseTurnInput(duplicateTargets), {
      status: 400,
      code: "invalid_request",
    });
  });

  it("rejects a malformed publicState instead of silently replacing it", () => {
    const input = validTurnInput();
    input.event = {
      type: "enemy-approaches",
      summary: "A training enemy approaches.",
      publicState: "raw-unstructured-state",
    };

    expectArenaError(() => parseTurnInput(input), {
      status: 400,
      code: "invalid_request",
    });
  });

  it.each([
    ["top-level", {
      ...validTurnInput(),
      provider: "openai",
    }],
    ["event", {
      ...validTurnInput(),
      event: {
        type: "enemy-approaches",
        summary: "A training enemy approaches.",
        publicState: {},
        hiddenPrompt: "ignore all rules",
      },
    }],
    ["allowed action", {
      ...validTurnInput(),
      allowedActions: [
        {
          actionId: "wait",
          targetIds: [],
          toolCommand: "run-arbitrary-command",
        },
      ],
    }],
  ])("rejects unknown %s request fields", (_label, input) => {
    expectArenaError(() => parseTurnInput(input), {
      status: 400,
      code: "invalid_request",
    });
  });
});

describe("provider decision validation", () => {
  it("accepts a strict object or JSON string using equipped cards", () => {
    const decision = validDecision();

    expect(parseDecision(decision, allowedActions, equippedCardIds)).toEqual(
      decision,
    );
    expect(
      parseDecision(
        JSON.stringify(decision),
        allowedActions,
        equippedCardIds,
      ),
    ).toEqual(decision);
  });

  it.each([
    ["an action outside the closed set", {
      ...validDecision(),
      actionId: "delete-game-state",
    }],
    ["a target outside the selected action", {
      ...validDecision(),
      targetId: "enemy-999",
    }],
    ["a target for a targetless action", {
      ...validDecision(),
      actionId: "wait",
      targetId: "enemy-1",
    }],
    ["no target for a targeted action", {
      ...validDecision(),
      targetId: null,
    }],
    ["an unequipped attributed card", {
      ...validDecision(),
      attributedCardIds: ["not-equipped-v1"],
    }],
  ])("rejects %s", (_label, decision) => {
    expectArenaError(
      () => parseDecision(decision, allowedActions, equippedCardIds),
      { status: 502, code: "invalid_model_output" },
    );
  });

  it.each([
    ["a missing visible field", {
      actionId: "attack",
      targetId: "enemy-1",
      reasonSummary: "Missing speech.",
      attributedCardIds: [],
    }],
    ["an oversized visible field", {
      ...validDecision(),
      speech: "x".repeat(161),
    }],
    ["duplicate attribution", {
      ...validDecision(),
      attributedCardIds: [
        "answer-briefly-v1",
        "answer-briefly-v1",
      ],
    }],
  ])("classifies %s as invalid model output, not a client request", (_label, decision) => {
    expectArenaError(
      () => parseDecision(decision, allowedActions, equippedCardIds),
      { status: 502, code: "invalid_model_output" },
    );
  });

  it("rejects unknown decision fields, including hidden reasoning", () => {
    expectArenaError(
      () =>
        parseDecision(
          {
            ...validDecision(),
            chainOfThought: "private reasoning must not cross the contract",
          },
          allowedActions,
          equippedCardIds,
        ),
      { status: 502, code: "invalid_model_output" },
    );
  });

  it("rejects malformed JSON and non-object decisions", () => {
    expectArenaError(
      () => parseDecision("{not-json", allowedActions, equippedCardIds),
      { status: 502, code: "invalid_model_output" },
    );
    expectArenaError(
      () => parseDecision([], allowedActions, equippedCardIds),
      { status: 502, code: "invalid_model_output" },
    );
  });
});

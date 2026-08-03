import { ArenaError } from "./errors.js";

type RiskAction = {
  actionId: string;
  risk: number;
};

export function executeFunctionTool(
  name: string,
  input: unknown,
): Record<string, unknown> {
  if (name !== "arena_risk_check") {
    throw new ArenaError(422, "unknown_tool", `Unknown function tool: ${name}`);
  }
  if (
    input === null ||
    typeof input !== "object" ||
    !Array.isArray((input as { actions?: unknown }).actions)
  ) {
    throw new ArenaError(
      422,
      "invalid_tool_input",
      "arena_risk_check requires an actions array.",
    );
  }
  const actions = (input as { actions: unknown[] }).actions;
  if (
    actions.length === 0 ||
    !actions.every(
      (entry): entry is RiskAction =>
        entry !== null &&
        typeof entry === "object" &&
        typeof (entry as RiskAction).actionId === "string" &&
        typeof (entry as RiskAction).risk === "number" &&
        Number.isFinite((entry as RiskAction).risk),
    )
  ) {
    throw new ArenaError(
      422,
      "invalid_tool_input",
      "Each risk action needs actionId and numeric risk.",
    );
  }
  const selected = [...actions].sort(
    (left, right) =>
      left.risk - right.risk || left.actionId.localeCompare(right.actionId),
  )[0];
  if (selected === undefined) {
    throw new ArenaError(422, "invalid_tool_input", "No action was provided.");
  }
  return {
    selectedActionId: selected.actionId,
    risk: selected.risk,
  };
}

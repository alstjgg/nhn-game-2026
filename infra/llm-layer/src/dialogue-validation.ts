import {
  APOTHECARY_AILMENTS,
  APOTHECARY_PERSONA_TRAITS,
  APOTHECARY_VERB_COSTS,
} from "../data/apothecary.js";
import { PublicError } from "./errors.js";
import {
  DIALOGUE_VERBS,
  type DialogueBeat,
  type DialogueRequest,
  type DialogueVerb,
} from "./dialogue-types.js";

const CLUE_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const PERSONA_TRAIT_SET = new Set<string>(APOTHECARY_PERSONA_TRAITS);

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function assertOnlyKeys(
  value: Record<string, unknown>,
  allowed: readonly string[],
  field: string,
  status = 400,
  code = "invalid_request",
): void {
  const unknown = Object.keys(value).filter((key) => !allowed.includes(key));
  if (unknown.length > 0) {
    throw new PublicError(
      status,
      code,
      `${field} contains unsupported fields.`,
    );
  }
}

function boundedText(
  value: unknown,
  field: string,
  maximum: number,
  status = 400,
  code = "invalid_request",
): string {
  if (
    typeof value !== "string" ||
    value.trim().length < 1 ||
    value.length > maximum ||
    /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(value)
  ) {
    throw new PublicError(
      status,
      code,
      `${field} must be non-empty text up to ${maximum} characters.`,
    );
  }
  return value.trim();
}

export function parseDialogueRequest(value: unknown): DialogueRequest {
  if (!isRecord(value)) {
    throw new PublicError(
      400,
      "invalid_request",
      "Dialogue request must be an object.",
    );
  }
  assertOnlyKeys(
    value,
    ["customer", "patienceTier", "history", "availableClues"],
    "dialogue",
  );
  if (!isRecord(value.customer)) {
    throw new PublicError(
      400,
      "invalid_request",
      "customer must be an object.",
    );
  }
  assertOnlyKeys(
    value.customer,
    ["personaTraits", "problem", "hiddenCause"],
    "customer",
  );

  if (
    !Array.isArray(value.customer.personaTraits) ||
    value.customer.personaTraits.length < 1 ||
    value.customer.personaTraits.length > 3
  ) {
    throw new PublicError(
      400,
      "invalid_request",
      "customer.personaTraits must contain 1 to 3 registered traits.",
    );
  }
  const personaTraits = value.customer.personaTraits.map((trait, index) =>
    boundedText(trait, `customer.personaTraits[${index}]`, 256),
  );
  if (
    new Set(personaTraits).size !== personaTraits.length ||
    personaTraits.some((trait) => !PERSONA_TRAIT_SET.has(trait))
  ) {
    throw new PublicError(
      400,
      "unknown_persona_trait",
      "A persona trait is duplicated or not registered.",
    );
  }

  const problem = boundedText(value.customer.problem, "customer.problem", 256);
  const hiddenCause = boundedText(
    value.customer.hiddenCause,
    "customer.hiddenCause",
    512,
  );
  if (
    !APOTHECARY_AILMENTS.some(
      (ailment) =>
        ailment.problem === problem && ailment.hiddenCause === hiddenCause,
    )
  ) {
    throw new PublicError(
      400,
      "unknown_ailment",
      "The problem and hiddenCause pair is not registered.",
    );
  }

  if (
    !Number.isSafeInteger(value.patienceTier) ||
    (value.patienceTier as number) < 0 ||
    (value.patienceTier as number) > 3
  ) {
    throw new PublicError(
      400,
      "invalid_request",
      "patienceTier must be an integer from 0 to 3.",
    );
  }

  if (!Array.isArray(value.history) || value.history.length > 12) {
    throw new PublicError(
      400,
      "invalid_request",
      "history must contain at most 12 beats.",
    );
  }
  const history = value.history.map((entry, index) => {
    if (!isRecord(entry)) {
      throw new PublicError(
        400,
        "invalid_request",
        `history[${index}] must be an object.`,
      );
    }
    assertOnlyKeys(
      entry,
      ["npcLine", "playerChoiceLabel"],
      `history[${index}]`,
    );
    return {
      npcLine: boundedText(entry.npcLine, `history[${index}].npcLine`, 500),
      playerChoiceLabel: boundedText(
        entry.playerChoiceLabel,
        `history[${index}].playerChoiceLabel`,
        160,
      ),
    };
  });

  if (
    !Array.isArray(value.availableClues) ||
    value.availableClues.length > 16
  ) {
    throw new PublicError(
      400,
      "invalid_request",
      "availableClues must contain at most 16 clues.",
    );
  }
  const availableClues = value.availableClues.map((entry, index) => {
    if (!isRecord(entry)) {
      throw new PublicError(
        400,
        "invalid_request",
        `availableClues[${index}] must be an object.`,
      );
    }
    assertOnlyKeys(entry, ["id", "text"], `availableClues[${index}]`);
    if (
      typeof entry.id !== "string" ||
      !CLUE_ID_PATTERN.test(entry.id)
    ) {
      throw new PublicError(
        400,
        "invalid_request",
        `availableClues[${index}].id must be a valid identifier.`,
      );
    }
    return {
      id: entry.id,
      text: boundedText(entry.text, `availableClues[${index}].text`, 256),
    };
  });
  if (
    new Set(availableClues.map((clue) => clue.id)).size !==
    availableClues.length
  ) {
    throw new PublicError(
      400,
      "invalid_request",
      "availableClues IDs must be unique.",
    );
  }

  return {
    customer: { personaTraits, problem, hiddenCause },
    patienceTier: value.patienceTier as 0 | 1 | 2 | 3,
    history,
    availableClues,
  };
}

export function parseDialogueBeat(
  value: unknown,
  request: DialogueRequest,
): DialogueBeat {
  if (!isRecord(value)) {
    throw new PublicError(
      502,
      "invalid_model_output",
      "Dialogue beat must be an object.",
    );
  }
  assertOnlyKeys(
    value,
    ["npcLine", "choices"],
    "dialogueBeat",
    502,
    "invalid_model_output",
  );
  const npcLine = boundedText(
    value.npcLine,
    "dialogueBeat.npcLine",
    500,
    502,
    "invalid_model_output",
  );
  if (/[\r\n]/.test(npcLine)) {
    throw new PublicError(
      502,
      "invalid_model_output",
      "Dialogue line must be one line.",
    );
  }
  if (
    npcLine.includes("?") ||
    /(?:말|말씀|설명)해\s*주(?:세요|십시오)|알려\s*주(?:세요|십시오)/.test(
      npcLine,
    )
  ) {
    throw new PublicError(
      502,
      "invalid_model_output",
      "The customer line must be a statement about the customer, not a request directed at the player.",
    );
  }
  if (!Array.isArray(value.choices) || value.choices.length !== 4) {
    throw new PublicError(
      502,
      "invalid_model_output",
      "Dialogue beat must contain exactly four choices.",
    );
  }

  const availableClueIds = new Set(request.availableClues.map((clue) => clue.id));
  const choices = value.choices.map((entry, index) => {
    if (!isRecord(entry)) {
      throw new PublicError(
        502,
        "invalid_model_output",
        `dialogueBeat.choices[${index}] must be an object.`,
      );
    }
    assertOnlyKeys(
      entry,
      ["label", "verb", "clueReveals"],
      `dialogueBeat.choices[${index}]`,
      502,
      "invalid_model_output",
    );
    let label = boundedText(
      entry.label,
      `dialogueBeat.choices[${index}].label`,
      160,
      502,
      "invalid_model_output",
    );
    if (
      typeof entry.verb !== "string" ||
      !(DIALOGUE_VERBS as readonly string[]).includes(entry.verb)
    ) {
      throw new PublicError(
        502,
        "invalid_model_output",
        "Dialogue choice has an invalid verb.",
      );
    }
    const verb = entry.verb as DialogueVerb;
    if (
      request.availableClues.some(
        (clue) => clue.id.length > 0 && label.includes(clue.id),
      )
    ) {
      throw new PublicError(
        502,
        "invalid_model_output",
        "Dialogue labels must not expose internal clue IDs.",
      );
    }
    if (
      (verb === "indirect" || verb === "direct") &&
      /(물어보기|추측하기|질문하기)/.test(label)
    ) {
      throw new PublicError(
        502,
        "invalid_model_output",
        "Question labels must be direct Korean questions, not meta instructions.",
      );
    }
    if (
      (verb === "indirect" || verb === "direct") &&
      !label.endsWith("?")
    ) {
      label = `${label}?`;
    }
    if (
      !Array.isArray(entry.clueReveals) ||
      entry.clueReveals.length > 4 ||
      !entry.clueReveals.every(
        (id) => typeof id === "string" && availableClueIds.has(id),
      ) ||
      new Set(entry.clueReveals).size !== entry.clueReveals.length
    ) {
      throw new PublicError(
        502,
        "invalid_model_output",
        "Dialogue choice contains invalid clue IDs.",
      );
    }
    if (verb !== "observe" && entry.clueReveals.length > 0) {
      throw new PublicError(
        502,
        "invalid_model_output",
        "Only the observe choice may reveal clues.",
      );
    }
    if (verb === "observe" && !label.startsWith("[관찰]")) {
      throw new PublicError(
        502,
        "invalid_model_output",
        "The observe label must start with [관찰].",
      );
    }
    if (verb === "craft" && label !== "[조제하러 가기]") {
      throw new PublicError(
        502,
        "invalid_model_output",
        "The craft label must be [조제하러 가기].",
      );
    }
    return {
      label,
      verb,
      patienceCost: APOTHECARY_VERB_COSTS[verb],
      ...(entry.clueReveals.length > 0
        ? { clueReveals: [...(entry.clueReveals as string[])] }
        : {}),
    };
  });

  if (
    new Set(choices.map((choice) => choice.verb)).size !==
      DIALOGUE_VERBS.length ||
    DIALOGUE_VERBS.some(
      (verb) => choices.filter((choice) => choice.verb === verb).length !== 1,
    )
  ) {
    throw new PublicError(
      502,
      "invalid_model_output",
      "Dialogue beat must contain each verb exactly once.",
    );
  }

  return { npcLine, choices };
}

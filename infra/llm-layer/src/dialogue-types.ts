export type TokenUsage = {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
};

export const DIALOGUE_VERBS = [
  "indirect",
  "direct",
  "observe",
  "craft",
] as const;

export type DialogueVerb = (typeof DIALOGUE_VERBS)[number];

export const REASONING_EFFORTS = ["off", "low", "medium", "high"] as const;
export type ReasoningEffort = (typeof REASONING_EFFORTS)[number];

export type InferenceSelection = {
  modelId: string;
  reasoningEffort: ReasoningEffort;
};

export type DialogueRequest = {
  inference: InferenceSelection;
  customer: {
    personaTraits: string[];
    problem: string;
    hiddenCause: string;
  };
  patienceTier: 0 | 1 | 2 | 3;
  history: Array<{
    npcLine: string;
    playerChoiceLabel: string;
  }>;
  availableClues: Array<{
    id: string;
    text: string;
  }>;
};

export type DialogueChoice = {
  label: string;
  verb: DialogueVerb;
  patienceCost: number;
  clueReveals?: string[];
};

export type DialogueBeat = {
  npcLine: string;
  choices: DialogueChoice[];
};

export type ProviderDialogueBeat = {
  rawBeat: unknown;
  latencyMs: number;
  usage: TokenUsage;
};

export interface DialogueProvider {
  generate(request: DialogueRequest): Promise<ProviderDialogueBeat>;
}

export type DialogueTelemetry = {
  model: string;
  reasoningEffort: ReasoningEffort;
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
  fallback: boolean;
  fallbackCodes: string[];
};

export type DialogueServiceResult = {
  response: DialogueBeat;
  telemetry: DialogueTelemetry;
};

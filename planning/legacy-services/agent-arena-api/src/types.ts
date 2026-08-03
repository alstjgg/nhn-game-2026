export type ProviderId = "mock" | "openai" | "anthropic";

export type FeatureCapabilities = {
  streaming: boolean;
  functionTools: boolean;
  remoteMcp: boolean;
  skills: boolean;
  compaction: boolean;
};

export type ModelProfileDefinition = {
  id: string;
  displayName: string;
  provider: ProviderId;
  model?: string;
  modelEnv?: string;
  apiKeyEnv?: string;
  capabilities: FeatureCapabilities;
};

export type ModelProfileSnapshot = {
  id: string;
  displayName: string;
  provider: ProviderId;
  model: string;
  capabilities: FeatureCapabilities;
  compactModes: CompactionMode[];
};

export type PromptCardDefinition = {
  id: string;
  version: number;
  displayName: string;
  instruction: string;
};

export type HostedSkillBinding = {
  skillIdEnv: string;
  versionEnv: string;
};

export type SkillCardDefinition =
  | {
      id: string;
      version: number;
      displayName: string;
      kind: "instruction";
      instruction: string;
    }
  | {
      id: string;
      version: number;
      displayName: string;
      kind: "function";
      instruction: string;
      functionName: string;
    }
  | {
      id: string;
      version: number;
      displayName: string;
      kind: "hosted";
      instruction: string;
      bindings: Partial<Record<ProviderId, HostedSkillBinding>>;
    };

export type McpCardDefinition = {
  id: string;
  version: number;
  displayName: string;
  serverLabel: string;
  urlEnv: string;
  tokenEnv?: string;
  allowedTools: string[];
  readOnly: boolean;
};

export type HarnessDefinition = {
  id: string;
  displayName: string;
  maxInputTokens: number;
  maxOutputTokens: number;
  maxToolCalls: number;
  timeoutMs: number;
  fallbackActionId: string;
  contextSoftLimitRatio: number;
  contextHardLimitRatio: number;
};

export type AgentLoadoutInput = {
  agentId: string;
  promptCardIds: string[];
  skillCardIds: string[];
  mcpCardIds: string[];
};

export type LoadoutSnapshot = AgentLoadoutInput & {
  promptCards: PromptCardDefinition[];
  skillCards: SkillCardDefinition[];
  mcpCards: McpCardDefinition[];
};

export type CreateRunInput = {
  modelProfileId: string;
  harnessId: string;
  party: AgentLoadoutInput[];
};

export type AllowedAction = {
  actionId: string;
  targetIds: string[];
};

export type ArenaTurnInput = {
  stageId: string;
  turnNumber: number;
  event: {
    type: string;
    summary: string;
    publicState: Record<string, unknown>;
  };
  allowedActions: AllowedAction[];
};

export type AgentDecision = {
  actionId: string;
  targetId: string | null;
  speech: string;
  reasonSummary: string;
  attributedCardIds: string[];
};

export type TokenUsage = {
  inputTokens: number;
  cachedInputTokens: number | null;
  outputTokens: number;
  reasoningTokens: number | null;
  totalTokens: number;
  source: "provider_measured" | "mock_measured" | "unavailable";
};

export type ToolTrace = {
  type: "function" | "mcp" | "skill";
  name: string;
  status: "started" | "completed" | "failed";
  durationMs?: number;
  safeSummary?: string;
};

export type ContextTelemetry = {
  estimatedActiveTokens: number;
  budgetTokens: number;
  gauge: number;
  measurement: "estimated" | "estimated_after_output" | "measured_input";
  compactedThisTurn: boolean;
  compactionMode?: CompactionMode;
};

export type AgentTurnResult = {
  agentId: string;
  arenaSessionId: string;
  decision: AgentDecision;
  usage: TokenUsage;
  context: ContextTelemetry;
  toolTrace: ToolTrace[];
  latencyMs: number;
  fallbackUsed: boolean;
  fallbackReason?: string;
  traceId: string;
};

export type RunStatus = "active" | "ended";
export type SessionStatus = "active" | "cleared" | "ended";
export type TurnStatus = "queued" | "running" | "completed" | "failed";

export type ArenaRun = {
  id: string;
  ownerId: string;
  modelProfile: ModelProfileSnapshot;
  harness: HarnessDefinition;
  cardsVersion: string;
  status: RunStatus;
  createdAt: string;
};

export type AgentSession = {
  id: string;
  runId: string;
  ownerId: string;
  agentId: string;
  partyIndex: number;
  generation: number;
  loadout: LoadoutSnapshot;
  providerLoadout: ResolvedProviderLoadout | null;
  history: unknown[];
  estimatedActiveTokens: number;
  lastMeasuredInputTokens: number | null;
  status: SessionStatus;
  createdAt: string;
  updatedAt: string;
};

export type ArenaTurn = {
  id: string;
  runId: string;
  ownerId: string;
  request: ArenaTurnInput;
  status: TurnStatus;
  idempotencyKey: string;
  requestHash: string;
  results: AgentTurnResult[];
  failureReason?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
};

export type TraceEvent = {
  turnId: string;
  sequence: number;
  type: string;
  safeData: Record<string, unknown>;
  createdAt: string;
};

export type FunctionToolDefinition = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
};

export type ResolvedHostedSkill = {
  cardId: string;
  name: string;
  skillId: string;
  version: string;
};

export type ResolvedMcpTool = {
  cardId: string;
  serverLabel: string;
  serverUrl: string;
  authorization?: string;
  allowedTools: string[];
  readOnly: boolean;
};

export type ResolvedProviderLoadout = {
  cardIds: string[];
  instructions: string[];
  functionTools: FunctionToolDefinition[];
  hostedSkills: ResolvedHostedSkill[];
  mcpTools: ResolvedMcpTool[];
};

export type NormalizedProviderEvent = {
  type:
    | "output.delta"
    | "tool.started"
    | "tool.completed"
    | "tool.failed"
    | "usage.final";
  safeData: Record<string, unknown>;
};

export type ProviderTurnInput = {
  traceId: string;
  model: ModelProfileSnapshot;
  agentId: string;
  history: unknown[];
  instructions: string;
  userInput: string;
  allowedActions: AllowedAction[];
  loadout: ResolvedProviderLoadout;
  harness: HarnessDefinition;
  signal: AbortSignal;
  onEvent: (event: NormalizedProviderEvent) => Promise<void>;
};

export type ProviderTurnOutput = {
  rawDecision: unknown;
  history: unknown[];
  usage: TokenUsage;
  lastInputTokens: number | null;
  toolTrace: ToolTrace[];
  providerRequestId?: string;
};

export type CompactionMode =
  | "native"
  | "explicit-summary-fallback"
  | "mock-native";

export type ProviderCompactInput = {
  model: ModelProfileSnapshot;
  history: unknown[];
  harness: HarnessDefinition;
  signal: AbortSignal;
};

export type ProviderCompactOutput = {
  history: unknown[];
  mode: CompactionMode;
  estimatedActiveTokens: number;
};

export interface AgentProvider {
  readonly providerId: ProviderId;
  runTurn(input: ProviderTurnInput): Promise<ProviderTurnOutput>;
  compact(input: ProviderCompactInput): Promise<ProviderCompactOutput>;
}

export type PublicModelCapability = {
  id: string;
  displayName: string;
  provider: ProviderId;
  implemented: boolean;
  configured: boolean;
  liveVerified: boolean;
  supports: FeatureCapabilities;
  compactModes: CompactionMode[];
  unavailableReasons: string[];
};

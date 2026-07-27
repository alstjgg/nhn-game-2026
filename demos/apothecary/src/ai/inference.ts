import type {
  AIHealth,
  InferenceModelOption,
  InferenceSelection,
  ReasoningEffort,
} from './contract.ts';

export type InferenceConnection = 'checking' | 'live' | 'offline';
export type InferenceRunStatus = 'running' | 'success' | 'fallback' | 'error';

export interface InferenceRun {
  readonly id: number;
  readonly selection: InferenceSelection;
  readonly status: InferenceRunStatus;
  readonly latencyMs?: number;
  readonly inputTokens?: number;
  readonly outputTokens?: number;
}

export interface InferenceSnapshot {
  readonly connection: InferenceConnection;
  readonly models: readonly InferenceModelOption[];
  readonly selection: InferenceSelection | null;
  readonly runs: readonly InferenceRun[];
}

export interface InferenceRunResult {
  readonly fallback: boolean;
  readonly latencyMs?: number;
  readonly inputTokens?: number;
  readonly outputTokens?: number;
}

export interface InferenceController {
  getSnapshot(): InferenceSnapshot;
  connect(health: AIHealth): void;
  disconnect(): void;
  select(selection: InferenceSelection): void;
  begin(): { id: number; selection: InferenceSelection } | null;
  finish(id: number, result: InferenceRunResult): void;
  fail(id: number): void;
  subscribe(listener: (snapshot: InferenceSnapshot) => void): () => void;
}

const MAX_RUNS = 4;

function copyModels(models: readonly InferenceModelOption[]): InferenceModelOption[] {
  return models.map((model) => ({
    id: model.id,
    label: model.label,
    reasoningEfforts: [...model.reasoningEfforts],
  }));
}

function fallbackCapabilities(health: AIHealth): {
  models: InferenceModelOption[];
  selection: InferenceSelection;
} {
  const selection: InferenceSelection = {
    modelId: health.models.dialogue,
    reasoningEffort: 'off',
  };
  return {
    models: [
      {
        id: selection.modelId,
        label: selection.modelId,
        reasoningEfforts: ['off'],
      },
    ],
    selection,
  };
}

export function createInferenceController(): InferenceController {
  let connection: InferenceConnection = 'checking';
  let models: InferenceModelOption[] = [];
  let selection: InferenceSelection | null = null;
  let runs: InferenceRun[] = [];
  let nextRunId = 1;
  let listeners: Array<(snapshot: InferenceSnapshot) => void> = [];

  const snapshot = (): InferenceSnapshot => ({
    connection,
    models: copyModels(models),
    selection: selection === null ? null : { ...selection },
    runs: runs.map((run) => ({ ...run, selection: { ...run.selection } })),
  });

  const notify = (): void => {
    const value = snapshot();
    for (const listener of [...listeners]) listener(value);
  };

  const normalized = (candidate: InferenceSelection): InferenceSelection | null => {
    const model = models.find((entry) => entry.id === candidate.modelId);
    if (model === undefined) return null;
    const requestedIndex = ['off', 'low', 'medium', 'high'].indexOf(
      candidate.reasoningEffort,
    );
    const closestSupported = [...model.reasoningEfforts]
      .reverse()
      .find(
        (effort) =>
          ['off', 'low', 'medium', 'high'].indexOf(effort) <= requestedIndex,
      );
    const effort: ReasoningEffort =
      closestSupported ?? model.reasoningEfforts[0] ?? 'off';
    return { modelId: model.id, reasoningEffort: effort };
  };

  return {
    getSnapshot: snapshot,

    connect(health): void {
      const capabilities =
        health.inference === undefined
          ? fallbackCapabilities(health)
          : {
              models: copyModels(health.inference.models),
              selection: { ...health.inference.default },
            };
      models = capabilities.models;
      selection =
        (selection === null ? null : normalized(selection)) ??
        normalized(capabilities.selection) ??
        (models[0] === undefined
          ? null
          : {
              modelId: models[0].id,
              reasoningEffort: models[0].reasoningEfforts[0] ?? 'off',
            });
      connection = 'live';
      notify();
    },

    disconnect(): void {
      connection = 'offline';
      models = [];
      selection = null;
      notify();
    },

    select(candidate): void {
      const next = normalized(candidate);
      if (connection !== 'live' || next === null) return;
      selection = next;
      notify();
    },

    begin(): { id: number; selection: InferenceSelection } | null {
      if (connection !== 'live' || selection === null) return null;
      const run = {
        id: nextRunId,
        selection: { ...selection },
        status: 'running' as const,
      };
      nextRunId += 1;
      runs = [run, ...runs].slice(0, MAX_RUNS);
      notify();
      return { id: run.id, selection: { ...run.selection } };
    },

    finish(id, result): void {
      runs = runs.map((run) =>
        run.id === id
          ? {
              ...run,
              status: result.fallback ? 'fallback' : 'success',
              ...(result.latencyMs === undefined ? {} : { latencyMs: result.latencyMs }),
              ...(result.inputTokens === undefined
                ? {}
                : { inputTokens: result.inputTokens }),
              ...(result.outputTokens === undefined
                ? {}
                : { outputTokens: result.outputTokens }),
            }
          : run,
      );
      notify();
    },

    fail(id): void {
      runs = runs.map((run) =>
        run.id === id ? { ...run, status: 'error' as const } : run,
      );
      notify();
    },

    subscribe(listener): () => void {
      listeners = [...listeners, listener];
      listener(snapshot());
      return () => {
        listeners = listeners.filter((entry) => entry !== listener);
      };
    },
  };
}

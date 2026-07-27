import './inference-panel.css';

import type { InferenceModelOption, ReasoningEffort } from '../ai/contract.ts';
import type {
  InferenceController,
  InferenceRun,
  InferenceSnapshot,
} from '../ai/inference.ts';

const EFFORT_LABELS: Readonly<Record<ReasoningEffort, string>> = {
  off: '끔',
  low: '낮음',
  medium: '중간',
  high: '높음',
};

function modelLabel(models: readonly InferenceModelOption[], id: string): string {
  return models.find((model) => model.id === id)?.label ?? id;
}

function runCopy(run: InferenceRun, models: readonly InferenceModelOption[]): string {
  const identity = `${modelLabel(models, run.selection.modelId)} · ${
    EFFORT_LABELS[run.selection.reasoningEffort]
  }`;
  if (run.status === 'running') return `${identity} · 생성 중`;
  if (run.status === 'error') return `${identity} · 연결 실패`;
  const seconds =
    run.latencyMs === undefined ? '' : ` · ${(run.latencyMs / 1_000).toFixed(1)}초`;
  const tokens =
    run.outputTokens === undefined
      ? ''
      : ` · ${
          run.inputTokens === undefined ? '' : `입력 ${run.inputTokens} / `
        }출력 ${run.outputTokens}t`;
  return `${identity}${seconds}${tokens} · ${
    run.status === 'fallback' ? '번들 폴백' : 'LIVE'
  }`;
}

export function mountInferencePanel(
  container: HTMLElement,
  controller: InferenceController,
): () => void {
  container.querySelector('[data-testid="inference-panel"]')?.remove();

  const panel = document.createElement('details');
  panel.className = 'inference-panel';
  panel.dataset.testid = 'inference-panel';
  panel.open = window.innerWidth >= 720;

  const summary = document.createElement('summary');
  summary.className = 'inference-panel__summary';
  summary.textContent = 'AI 비교';

  const body = document.createElement('div');
  body.className = 'inference-panel__body';

  const connection = document.createElement('p');
  connection.className = 'inference-panel__connection';
  connection.dataset.testid = 'inference-connection';

  const modelLabelNode = document.createElement('div');
  modelLabelNode.className = 'inference-panel__field';
  const modelLegend = document.createElement('span');
  modelLegend.textContent = '베이스 모델';
  const modelOptions = document.createElement('div');
  modelOptions.className = 'inference-panel__options inference-panel__options--models';
  modelOptions.dataset.testid = 'inference-model';
  modelOptions.setAttribute('role', 'group');
  modelOptions.setAttribute('aria-label', '베이스 모델');
  modelLabelNode.append(modelLegend, modelOptions);

  const effortLabelNode = document.createElement('div');
  effortLabelNode.className = 'inference-panel__field';
  const effortLegend = document.createElement('span');
  effortLegend.textContent = '추론 강도';
  const effortOptions = document.createElement('div');
  effortOptions.className = 'inference-panel__options inference-panel__options--efforts';
  effortOptions.dataset.testid = 'inference-effort';
  effortOptions.setAttribute('role', 'group');
  effortOptions.setAttribute('aria-label', '추론 강도');
  effortLabelNode.append(effortLegend, effortOptions);

  const hint = document.createElement('p');
  hint.className = 'inference-panel__hint';
  hint.textContent =
    '바꾼 설정은 다음 AI 손님부터 적용됩니다. 높은 추론은 더 느리고 비용이 큽니다.';

  const historyTitle = document.createElement('p');
  historyTitle.className = 'inference-panel__history-title';
  historyTitle.textContent = '실행 기록';
  const history = document.createElement('ol');
  history.className = 'inference-panel__history';
  history.dataset.testid = 'inference-history';

  body.append(
    connection,
    modelLabelNode,
    effortLabelNode,
    hint,
    historyTitle,
    history,
  );
  panel.append(summary, body);
  container.append(panel);

  const render = (snapshot: InferenceSnapshot): void => {
    const enabled = snapshot.connection === 'live' && snapshot.selection !== null;
    connection.dataset.state = snapshot.connection;
    connection.textContent =
      snapshot.connection === 'checking'
        ? 'AI 연결 확인 중'
        : snapshot.connection === 'live'
          ? 'LIVE · 요청별 설정'
          : '번들 대사 모드 · 설정 비활성';

    modelOptions.replaceChildren(
      ...snapshot.models.map((model) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'inference-panel__option';
        button.textContent = model.label;
        button.disabled = !enabled;
        button.dataset.modelId = model.id;
        button.setAttribute(
          'aria-pressed',
          String(snapshot.selection?.modelId === model.id),
        );
        button.addEventListener('click', () => {
          controller.select({
            modelId: model.id,
            reasoningEffort: snapshot.selection?.reasoningEffort ?? 'off',
          });
        });
        return button;
      }),
    );

    const selectedModel = snapshot.models.find(
      (model) => model.id === snapshot.selection?.modelId,
    );
    const efforts = selectedModel?.reasoningEfforts ?? [];
    effortOptions.replaceChildren(
      ...efforts.map((effort) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'inference-panel__option';
        button.textContent = EFFORT_LABELS[effort];
        button.disabled = !enabled;
        button.dataset.effort = effort;
        button.setAttribute(
          'aria-pressed',
          String(snapshot.selection?.reasoningEffort === effort),
        );
        button.addEventListener('click', () => {
          if (snapshot.selection === null) return;
          controller.select({
            modelId: snapshot.selection.modelId,
            reasoningEffort: effort,
          });
        });
        return button;
      }),
    );

    history.replaceChildren(
      ...snapshot.runs.map((run) => {
        const row = document.createElement('li');
        row.dataset.status = run.status;
        row.textContent = runCopy(run, snapshot.models);
        return row;
      }),
    );
    historyTitle.hidden = snapshot.runs.length === 0;
    history.hidden = snapshot.runs.length === 0;
  };

  const unsubscribe = controller.subscribe(render);
  return () => {
    unsubscribe();
    panel.remove();
  };
}

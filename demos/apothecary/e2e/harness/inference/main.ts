import { createInferenceController } from '../../../src/ai/inference.ts';
import type { AIHealth } from '../../../src/ai/contract.ts';
import { mountInferencePanel } from '../../../src/runtime/inference-panel.ts';

const NOVA = 'global.amazon.nova-2-lite-v1:0';
const HAIKU = 'global.anthropic.claude-haiku-4-5-20251001-v1:0';

const health: AIHealth = {
  ok: true,
  dialogue: true,
  portrait: false,
  models: { dialogue: NOVA, portrait: 'pre-generated-assets' },
  inference: {
    default: { modelId: NOVA, reasoningEffort: 'off' },
    models: [
      {
        id: NOVA,
        label: 'Nova 2 Lite',
        reasoningEfforts: ['off', 'low', 'medium'],
      },
      {
        id: HAIKU,
        label: 'Claude Haiku 4.5',
        reasoningEfforts: ['off', 'low', 'medium', 'high'],
      },
    ],
  },
};

const app = document.getElementById('app');
if (app !== null) {
  const controller = createInferenceController();
  mountInferencePanel(app, controller);
  controller.connect(health);
  (
    window as unknown as {
      __inference: {
        finish(fallback?: boolean): void;
      };
    }
  ).__inference = {
    finish(fallback = false): void {
      const run = controller.begin();
      if (run === null) throw new Error('inference harness is not live');
      controller.finish(run.id, {
        fallback,
        latencyMs: 1_234,
        inputTokens: 200,
        outputTokens: 456,
      });
    },
  };
}

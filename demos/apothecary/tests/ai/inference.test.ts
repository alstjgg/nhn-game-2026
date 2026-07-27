import { describe, expect, it, vi } from 'vitest';

import { createInferenceController } from '../../src/ai/inference.ts';
import { healthOk } from './fixtures/index.ts';

describe('runtime inference controller', () => {
  it('advertises the backend default, then keeps a valid runtime selection', () => {
    const controller = createInferenceController();
    const listener = vi.fn();
    controller.subscribe(listener);

    expect(controller.getSnapshot()).toMatchObject({
      connection: 'checking',
      selection: null,
    });

    controller.connect(healthOk());
    expect(controller.getSnapshot()).toMatchObject({
      connection: 'live',
      selection: {
        modelId: 'global.amazon.nova-2-lite-v1:0',
        reasoningEffort: 'off',
      },
    });

    controller.select({
      modelId: 'global.anthropic.claude-haiku-4-5-20251001-v1:0',
      reasoningEffort: 'high',
    });
    expect(controller.getSnapshot().selection).toEqual({
      modelId: 'global.anthropic.claude-haiku-4-5-20251001-v1:0',
      reasoningEffort: 'high',
    });
    controller.select({
      modelId: 'global.amazon.nova-2-lite-v1:0',
      reasoningEffort: 'high',
    });
    expect(controller.getSnapshot().selection).toEqual({
      modelId: 'global.amazon.nova-2-lite-v1:0',
      reasoningEffort: 'medium',
    });
    expect(listener).toHaveBeenCalled();
  });

  it('captures each request selection and records comparison telemetry', () => {
    const controller = createInferenceController();
    controller.connect(healthOk());
    controller.select({
      modelId: 'global.amazon.nova-2-lite-v1:0',
      reasoningEffort: 'medium',
    });

    const run = controller.begin();
    expect(run?.selection.reasoningEffort).toBe('medium');
    controller.select({
      modelId: 'global.anthropic.claude-haiku-4-5-20251001-v1:0',
      reasoningEffort: 'low',
    });
    controller.finish(run!.id, {
      fallback: false,
      latencyMs: 1_234,
      inputTokens: 200,
      outputTokens: 456,
    });

    expect(controller.getSnapshot().runs[0]).toEqual({
      id: run!.id,
      selection: {
        modelId: 'global.amazon.nova-2-lite-v1:0',
        reasoningEffort: 'medium',
      },
      status: 'success',
      latencyMs: 1_234,
      inputTokens: 200,
      outputTokens: 456,
    });
    expect(controller.getSnapshot().selection?.modelId).toContain('anthropic');
  });

  it('fails closed for an unknown option and disables selection offline', () => {
    const controller = createInferenceController();
    controller.connect(healthOk());
    const before = controller.getSnapshot().selection;
    controller.select({ modelId: 'unknown', reasoningEffort: 'high' });
    expect(controller.getSnapshot().selection).toEqual(before);

    controller.disconnect();
    expect(controller.begin()).toBeNull();
    expect(controller.getSnapshot()).toMatchObject({
      connection: 'offline',
      selection: null,
    });
  });
});

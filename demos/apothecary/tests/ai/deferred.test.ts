import { describe, expect, it, vi } from 'vitest';

import type { AIAdapter } from '../../src/ai/adapter.ts';
import { createDeferredAdapter } from '../../src/ai/deferred.ts';
import {
  dialogueRequest,
  portraitRequest,
  proxyDialoguePayload,
  proxyPortraitPayload,
} from './fixtures/index.ts';

function deferred<T>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason: unknown) => void;
} {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

describe('mount-time deferred AI adapter', () => {
  it('renders conservatively, then delegates pending work to the selected adapter', async () => {
    const selection = deferred<AIAdapter>();
    const dialogue = vi.fn().mockResolvedValue(proxyDialoguePayload());
    const portrait = vi.fn().mockResolvedValue(proxyPortraitPayload());
    const adapter = createDeferredAdapter(selection.promise);
    const pending = adapter.dialogue(dialogueRequest());

    expect(adapter.mode).toBe('stub');
    expect(dialogue).not.toHaveBeenCalled();

    selection.resolve({ mode: 'live', dialogue, portrait });
    await expect(pending).resolves.toEqual(proxyDialoguePayload());
    expect(adapter.mode).toBe('live');
    expect(dialogue).toHaveBeenCalledOnce();
  });

  it('forwards an unexpected replacement-selection rejection to pending callers', async () => {
    const selection = deferred<AIAdapter>();
    const adapter = createDeferredAdapter(selection.promise);
    const pending = adapter.portrait(portraitRequest());
    selection.reject(new Error('unexpected selection failure'));

    await expect(pending).rejects.toThrow(/unexpected selection failure/);
    expect(adapter.mode).toBe('stub');
  });
});

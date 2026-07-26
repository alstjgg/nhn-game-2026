import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  AIUnavailableError,
  createLiveAdapter,
  DIALOGUE_TIMEOUT_MS,
  HEALTH_PROBE_TIMEOUT_MS,
  probeHealth,
} from '../../src/ai/adapter.ts';
import { LIVE_DEADLINE_MS } from '../../src/app/roster.ts';
import { dialogueRequest, portraitRequest, proxyDialoguePayload } from './fixtures/index.ts';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('Lambda-backed AI adapter', () => {
  it('keeps the live prefetch fence beyond health plus dialogue deadlines', () => {
    expect(LIVE_DEADLINE_MS).toBeGreaterThan(
      HEALTH_PROBE_TIMEOUT_MS + DIALOGUE_TIMEOUT_MS,
    );
  });

  it('accepts dialogue-only health and uses the cold-start-aware deadline', async () => {
    const timeout = vi.spyOn(AbortSignal, 'timeout');
    const fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          ok: true,
          dialogue: true,
          portrait: false,
          models: {
            dialogue: 'global.amazon.nova-2-lite-v1:0',
            portrait: 'pre-generated-assets',
          },
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal('fetch', fetch);

    await expect(probeHealth()).resolves.toMatchObject({
      ok: true,
      dialogue: true,
      portrait: false,
    });
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch.mock.calls[0]?.[0]).toBe('/ai/health');
    expect(timeout).toHaveBeenCalledWith(HEALTH_PROBE_TIMEOUT_MS);
  });

  it('fails closed when the external health JSON has wrong field types', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            ok: true,
            dialogue: 'false',
            portrait: false,
            models: {
              dialogue: 'global.amazon.nova-2-lite-v1:0',
              portrait: 'pre-generated-assets',
            },
          }),
          { status: 200 },
        ),
      ),
    );

    await expect(probeHealth()).resolves.toBeNull();
  });

  it('makes exactly one validated dialogue request with no retry', async () => {
    const timeout = vi.spyOn(AbortSignal, 'timeout');
    const fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(proxyDialoguePayload()), {
        status: 200,
        headers: { 'x-llm-fallback': 'false' },
      }),
    );
    vi.stubGlobal('fetch', fetch);
    const request = dialogueRequest();

    await expect(createLiveAdapter().dialogue(request)).resolves.toEqual(
      proxyDialoguePayload(),
    );
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch.mock.calls[0]?.[0]).toBe('/ai/dialogue');
    expect(JSON.parse(String((fetch.mock.calls[0]?.[1] as RequestInit).body))).toEqual(request);
    expect(timeout).toHaveBeenCalledWith(DIALOGUE_TIMEOUT_MS);
  });

  it('does not retry a schema-invalid response', async () => {
    const fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ npcLine: 'broken', choices: [] }), {
        status: 200,
      }),
    );
    vi.stubGlobal('fetch', fetch);

    await expect(createLiveAdapter().dialogue(dialogueRequest())).rejects.toBeInstanceOf(
      AIUnavailableError,
    );
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('rejects a clue ID that was not supplied in the dialogue request', async () => {
    const payload = proxyDialoguePayload() as {
      choices: Array<{ clueReveals?: string[] }>;
    };
    payload.choices[2]!.clueReveals = ['clue_invented'];
    const fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(payload), { status: 200 }),
    );
    vi.stubGlobal('fetch', fetch);

    await expect(createLiveAdapter().dialogue(dialogueRequest())).rejects.toBeInstanceOf(
      AIUnavailableError,
    );
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('never makes a runtime portrait request', async () => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);

    await expect(createLiveAdapter().portrait(portraitRequest())).rejects.toThrow(
      /runtime portrait generation is disabled/,
    );
    expect(fetch).not.toHaveBeenCalled();
  });
});

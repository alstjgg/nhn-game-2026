// Fixtures for u1 (stub adapter + boot factory) tests.
//
// Same conventions as tests/data/fixtures/index.ts: every factory returns a
// DEEP-FRESH object (structuredClone) so a test can clone-and-mutate to build
// malformed cases without cross-test bleed.
//
// Nothing here imports src/ai/stub.ts or src/ai/boot.ts — the fixtures must stay
// loadable even while those modules are still RED.
import type {
  AIHealth,
  DialogueRequest,
  PatienceTier,
  PortraitRequest,
} from '../../../src/ai/contract';

// ── Real data keys the stub scripts must match byte-for-byte ────────────────
// (data/customers.json — frozen; the stub script `problem` keys are exact-match.)
export const C1_PROBLEM = '며칠째 잠이 오지 않아요.';
export const C2_PROBLEM = '기침이 좀처럼 멎지 않아요.';
export const UNKNOWN_PROBLEM = '이런 증상은 데이터에 없습니다.';

export const C1_CLUE_IDS = ['clue_dark_circles', 'clue_cold_hands', 'clue_racing_mind'] as const;
export const C2_CLUE_IDS = [
  'clue_hoarse_voice',
  'clue_dry_throat',
  'clue_night_cough',
  'clue_shallow_breath',
] as const;

export function c1Clues(): { id: string; text: string }[] {
  return C1_CLUE_IDS.map((id) => ({ id, text: `단서: ${id}` }));
}

export function c2Clues(): { id: string; text: string }[] {
  return C2_CLUE_IDS.map((id) => ({ id, text: `단서: ${id}` }));
}

// ── Requests (membrane: every field composed from game state, never typed) ──
export function dialogueRequest(overrides: Partial<DialogueRequest> = {}): DialogueRequest {
  return structuredClone({
    customer: {
      personaTraits: ['말수가 적은', '지쳐 보이는'],
      problem: C1_PROBLEM,
      hiddenCause: '밤마다 되새기는 걱정',
    },
    patienceTier: 0 as PatienceTier,
    history: [],
    availableClues: c1Clues(),
    ...overrides,
  });
}

/** N prior beats — drives beatIndexFor(history.length, …). */
export function historyOf(n: number): { npcLine: string; playerChoiceLabel: string }[] {
  return Array.from({ length: n }, (_, i) => ({
    npcLine: `이전 대사 ${i}`,
    playerChoiceLabel: `이전 선택 ${i}`,
  }));
}

export function portraitRequest(traits: string[] = ['말수가 적은', '지쳐 보이는']): PortraitRequest {
  return structuredClone({ traits });
}

// ── Proxy payload mirrors (AC19: the frozen server must keep validating) ────
// Shape copied from server/ai-proxy.mjs `toBeat()`: 4 cards, patienceCost stamped
// server-side from generation.json.verbCosts, clueReveals only when non-empty.
export function proxyDialoguePayload(): unknown {
  return structuredClone({
    npcLine: '요즘 통 잠을 못 자요. 눈만 감으면 생각이 꼬리를 물어서요.',
    choices: [
      { label: '요즘 마음 쓰이는 일이 있으신가요?', verb: 'indirect', patienceCost: 1 },
      { label: '언제부터 못 주무셨죠?', verb: 'direct', patienceCost: 2 },
      {
        label: '[관찰] 손님의 얼굴빛을 살핀다',
        verb: 'observe',
        patienceCost: 0,
        clueReveals: ['clue_dark_circles'],
      },
      { label: '[조제하러 가기]', verb: 'craft', patienceCost: 0 },
    ],
  });
}

/** Portrait payload the frozen proxy returns: b64 + prompt, never a url. */
export function proxyPortraitPayload(): { b64: string; prompt: string } {
  return structuredClone({ b64: 'aGVsbG8=', prompt: 'style bible … 말수가 적은' });
}

// ── Synthetic stub-dialogue data (loader guard tests; NOT the shipped content) ──
export function validBeat(npcLine = '기본 대사', withTierLines = false): Record<string, unknown> {
  const beat: Record<string, unknown> = {
    npcLine,
    choices: [
      {
        label: '에둘러 묻는다',
        verb: 'indirect',
        clueReveals: [C1_CLUE_IDS[2]],
      },
      { label: '곧장 묻는다', verb: 'direct' },
      { label: '[관찰] 얼굴빛을 살핀다', verb: 'observe', clueReveals: [C1_CLUE_IDS[0]] },
      { label: '[조제하러 가기]', verb: 'craft' },
    ],
  };
  if (withTierLines) {
    beat.tierLines = [`${npcLine} (평온)`, `${npcLine} (심드렁)`, `${npcLine} (짜증)`, `${npcLine} (한계)`];
  }
  return beat;
}

/** Minimal well-formed raw JSON matching data/stub-dialogue.json's schema. */
export function validStubRaw(): Record<string, unknown> {
  return structuredClone({
    latency: { dialogueMs: 900, portraitMs: 2400 },
    portraitPromptPrefix: '픽셀아트 4x2 표정 시트, ',
    scripts: [
      {
        problem: C1_PROBLEM,
        beats: [validBeat('c1 비트 0', true), validBeat('c1 비트 1'), validBeat('c1 비트 2')],
      },
    ],
    default: {
      problem: '',
      beats: [validBeat('기본 비트 0'), validBeat('기본 비트 1'), validBeat('기본 비트 2')],
    },
  });
}

// ── Boot doubles ───────────────────────────────────────────────────────────
export function healthOk(): AIHealth {
  return structuredClone({
    ok: true,
    dialogue: true,
    portrait: true,
    models: { dialogue: 'claude-sonnet-5', portrait: 'gpt-image-1' },
  });
}

export function healthDown(): AIHealth {
  return structuredClone({
    ok: false,
    dialogue: false,
    portrait: false,
    models: { dialogue: '', portrait: '' },
  });
}

export interface SleepSpy {
  /** Injected scheduler: records every requested delay, never creates a timer. */
  readonly sleep: (ms: number) => Promise<void>;
  readonly calls: number[];
}

export function fakeSleep(): SleepSpy {
  const calls: number[] = [];
  return {
    calls,
    sleep: (ms: number) => {
      calls.push(ms);
      return Promise.resolve();
    },
  };
}

export interface ProbeSpy {
  readonly probe: (timeoutMs?: number) => Promise<AIHealth | null>;
  readonly args: (number | undefined)[];
}

/** Injected health probe. Pass an Error to make the probe reject. */
export function fakeProbe(result: AIHealth | null | Error): ProbeSpy {
  const args: (number | undefined)[] = [];
  return {
    args,
    probe: (timeoutMs?: number) => {
      args.push(timeoutMs);
      return result instanceof Error ? Promise.reject(result) : Promise.resolve(result);
    },
  };
}

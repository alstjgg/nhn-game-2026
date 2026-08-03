// [e6] — shared fixtures for the transport suite. Not a `*.test.ts`, so vitest
// never collects it; `tsconfig.test.json` still type-checks it.
//
// Everything here is request/stub plumbing only. The §11 expectations live in
// the four suites that import this file, so a table row is never asserted twice.
import type {
  CallRequest,
  JudgmentResponse,
  NarrationResponse,
  ReporterResponse,
} from '../../src/shared/contracts.ts'
import type { FetchLike, FetchResponseLike } from '../../src/transport/index.ts'

// ─── requests, one per call type ─────────────────────────────────────────────

export const JUDGMENT_REQUEST: CallRequest<'judgment'> = {
  call_type: 'judgment',
  template_version: 'v0.4',
  slots: {
    TEMPERAMENT: 'Procedural. Will not improvise without a named authority.',
    TIMELINE_EXCERPT: ['회선이 열렸다.', '현장에서 1차 보고가 올라왔다.'],
    BLOCKS: [{ id: 'b-r1-0', text: '경보를 먼저 울려라.' }],
    GATE_QUESTION: '지금 대피를 명령할 것인가?',
    STANCE_SET: [
      { id: 'evacuate', label: '대피 명령' },
      { id: 'hold', label: '대기' },
    ],
  },
}

export const NARRATION_REQUEST: CallRequest<'narration'> = {
  call_type: 'narration',
  template_version: 'v0.4',
  slots: {
    TIMELINE_TAIL: ['요원이 대피를 명령했다.'],
    AGENT_UTTERANCE: '지금 나가십시오.',
    FIXED_NPC_ACTION: '부장이 수화기를 내려놓는다.',
    SCENE_SYMPTOMS: ['복도의 조명이 한 칸씩 꺼진다.'],
    PRESENT_NPCS: [
      { id: 'npc-bujang', name: '부장', side: 'line' },
      { id: 'npc-kim', name: '김 주임', side: 'room' },
    ],
  },
}

export const REPORTER_REQUEST: CallRequest<'reporter'> = {
  call_type: 'reporter',
  template_version: 'v0.4',
  slots: {
    EXPERIENCED: ['요원이 대피를 명령했다.', '부장이 수화기를 내려놓았다.'],
    TEMPERAMENT: 'Procedural. Will not improvise without a named authority.',
    REPORT_GUIDANCE: '사실만 쓴다. 추측은 쓰지 않는다.',
  },
}

/** Every call type, for the loops that must prove all three behave alike. */
export const ALL_REQUESTS = [JUDGMENT_REQUEST, NARRATION_REQUEST, REPORTER_REQUEST] as const

// ─── 200 bodies (contracts §2–§4: the payload VERBATIM, no envelope) ──────────

export const JUDGMENT_200: JudgmentResponse = {
  inner_note: '경보부터 울리는 편이 되돌릴 수 있다.',
  stance: 'evacuate',
  because_referent: '현장 1차 보고',
  because_block_ids: ['b-r1-0'],
  rejected_stance: 'hold',
  rejected_reason: '대기하면 확인 시점이 늦다.',
  utterance: '지금 나가십시오.',
}

export const NARRATION_200: NarrationResponse = {
  timeline_entries: ['복도의 조명이 한 칸씩 꺼진다.'],
  npc_lines: ['npc-bujang: 확실합니까.', 'npc-kim: 문을 엽니다.'],
}

export const REPORTER_200: ReporterResponse = {
  facts: ['대피 명령이 내려졌다.'],
  report_body: '요원은 1차 보고를 근거로 대피를 명령했다.',
}

/** Contracts §2: field order IS the contract. */
export const JUDGMENT_KEY_ORDER = [
  'inner_note',
  'stance',
  'because_referent',
  'because_block_ids',
  'rejected_stance',
  'rejected_reason',
  'utterance',
] as const

export const NARRATION_KEY_ORDER = ['timeline_entries', 'npc_lines'] as const
export const REPORTER_KEY_ORDER = ['facts', 'report_body'] as const

/** Every non-2xx body — `{error:{code,message,requestId}}`, never a bare string. */
export function errorBody(code: string, requestId = 'req-e6-0001'): string {
  return JSON.stringify({ error: { code, message: `stub: ${code}`, requestId } })
}

// ─── the counting stub FetchLike ─────────────────────────────────────────────

export type StubCall = {
  url: string
  init: { method: string; headers: Record<string, string>; body: string; signal?: unknown }
}

/** One scripted turn: either a response, or a rejected promise (network layer). */
export type StubStep =
  | { status: number; body?: string; headers?: Record<string, string> }
  | { reject: string }

export type Stub = { fetch: FetchLike; calls: StubCall[] }

/**
 * Scripted, counting `FetchLike`. Steps are consumed in order; once exhausted the
 * LAST step repeats, so `stubFetch([{status:502,…}])` means "502 every time" and
 * `stubFetch([{status:502,…},{status:200,…}])` means "502 then 200".
 */
export function stubFetch(steps: readonly StubStep[]): Stub {
  const calls: StubCall[] = []
  const fetch: FetchLike = (url, init) => {
    const step = steps[Math.min(calls.length, steps.length - 1)]!
    calls.push({ url, init })
    if ('reject' in step) return Promise.reject(new Error(step.reject))
    const headers: Record<string, string> = {}
    for (const [k, v] of Object.entries(step.headers ?? {})) headers[k.toLowerCase()] = v
    const response: FetchResponseLike = {
      status: step.status,
      headers: { get: (name: string) => headers[name.toLowerCase()] ?? null },
      text: () => Promise.resolve(step.body ?? ''),
    }
    return Promise.resolve(response)
  }
  return { fetch, calls }
}

export const BASE_URL = 'https://proxy.example.test'

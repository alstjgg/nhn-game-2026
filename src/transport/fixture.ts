/**
 * The offline fixture provider — decision 10: deterministic, no `fs`, always
 * `ok:true`. This is what `createTransport` degrades to when
 * `VITE_PROXY_BASE_URL` is unset, and what a headless driver runs against
 * with `--provider fixture` (no key, no proxy, no network).
 *
 * Every body is rebuilt fresh from the request on every call — nothing is
 * cached or memoised — so a caller mutating a returned body can never poison
 * the next call, and two independently constructed providers agree byte for
 * byte given the same request.
 *
 * Isomorphic (physical §3.1): no DOM, no fs, no globals, no timers.
 */

import type {
  CallRequest,
  CallResponse,
  CallType,
  JudgmentResponse,
  NarrationResponse,
  ReporterResponse,
} from '../shared/contracts.ts'
import type { Transport, TransportResult } from './index.ts'

/** A structural deep copy — stops a caller's mutation reaching the next call. */
function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function buildJudgment(request: CallRequest<'judgment'>, override?: JudgmentResponse): JudgmentResponse {
  if (override) return cloneJson(override)
  const stances = request.slots.STANCE_SET
  const stanceId = stances[0]?.id ?? 'stance-unresolved'
  const rejected = stances.find((stance) => stance.id !== stanceId)
  return {
    inner_note: '고정 픽스처 응답 — 시나리오 콘텐츠가 아니다.',
    stance: stanceId,
    because_referent: request.slots.GATE_QUESTION,
    because_block_ids: request.slots.BLOCKS.map((block) => block.id),
    rejected_stance: rejected ? rejected.id : `${stanceId}__rejected`,
    rejected_reason: '픽스처 제공자는 근거를 생성하지 않는다.',
    utterance: '고정 픽스처 발화.',
  }
}

function buildNarration(request: CallRequest<'narration'>, override?: NarrationResponse): NarrationResponse {
  if (override) return cloneJson(override)
  const npcLines =
    request.slots.PRESENT_NPCS.length > 0
      ? request.slots.PRESENT_NPCS.map((npc) => `${npc.id}: 고정 픽스처 대사.`)
      : ['npc-fixture: 고정 픽스처 대사.']
  return {
    timeline_entries: [...request.slots.SCENE_SYMPTOMS, '고정 픽스처 서술.'],
    npc_lines: npcLines,
  }
}

function buildReporter(request: CallRequest<'reporter'>, override?: ReporterResponse): ReporterResponse {
  if (override) return cloneJson(override)
  return {
    facts: request.slots.EXPERIENCED.length > 0 ? [...request.slots.EXPERIENCED] : ['고정 픽스처 사실.'],
    report_body: '고정 픽스처 보고문 — 시나리오 콘텐츠 아님.',
  }
}

function buildBody<T extends CallType>(
  request: CallRequest<T>,
  overrides: Partial<CallResponse> | undefined,
): CallResponse[T] {
  switch (request.call_type) {
    case 'judgment':
      return buildJudgment(request as CallRequest<'judgment'>, overrides?.judgment) as CallResponse[T]
    case 'narration':
      return buildNarration(request as CallRequest<'narration'>, overrides?.narration) as CallResponse[T]
    case 'reporter':
      return buildReporter(request as CallRequest<'reporter'>, overrides?.reporter) as CallResponse[T]
  }
}

/**
 * A deterministic, offline `Transport`. `overrides` lets a caller pin one or
 * more call types to an exact canned body (e9's determinism harness, or a
 * test that wants a specific stance).
 */
export function createFixtureProvider(overrides?: Partial<CallResponse>): Transport {
  return {
    mode: 'fixture',
    async send<T extends CallType>(request: CallRequest<T>): Promise<TransportResult<T>> {
      return {
        ok: true,
        call_type: request.call_type,
        body: buildBody(request, overrides),
        requestId: null,
        attempts: 1,
      }
    },
  }
}

// [e5] the ONE place in this repo's root suite that imports `proxy/src/*`.
//
// §8-7 wants the composed payload run through the proxy's own validators. That
// happens OFFLINE against the proxy sources, never against AWS: `calls.ts`,
// `prompt.ts`, `default-prompt.ts`, `types.ts` and `prompt-bundle.generated.ts`
// pull in only `errors.ts` — no `@aws-sdk`, which `handler.ts` would drag in.
//
// Confining the imports here keeps the blast radius of a proxy path change to
// one file, and keeps `proxy/**` itself untouched (A20: this unit writes
// nothing under `proxy/`).
export { CALL_SPECS } from '../../proxy/src/calls.js'
export { renderCall } from '../../proxy/src/prompt.js'
export { DEFAULT_PROMPT } from '../../proxy/src/default-prompt.js'
export { PROMPT_BUNDLE } from '../../proxy/src/prompt-bundle.generated.js'
import { isCallType } from '../../proxy/src/types.js'
export { isCallType }

/** The proxy's own template-version shape check (`prompt.ts` / handler §envelope). */
export const VERSION_RE = /^v[0-9]+\.[0-9]+$/

/**
 * Transcription of `proxy/src/handler.ts:119-153` `parseCallRequest`.
 *
 * That function is NOT exported and its module imports `@aws-sdk`, so it cannot
 * be called from here. This is its four envelope checks, in its order, with the
 * real `isCallType` imported rather than re-implemented. The line citation above
 * is the drift guard: if `parseCallRequest` gains a fifth check, this diverges
 * and the citation is where a reviewer looks.
 *
 * Returns the list of violations, empty when the envelope would be accepted.
 */
export function assertEnvelope(value: unknown): string[] {
  const problems: string[] = []
  if (typeof value !== 'object' || value === null) {
    return ['Body must be a JSON object.']
  }
  const body = value as Record<string, unknown>

  if (!isCallType(body.call_type)) {
    problems.push('call_type must be one of: judgment, narration, reporter.')
  }
  if (typeof body.template_version !== 'string' || !VERSION_RE.test(body.template_version)) {
    problems.push('template_version must look like v0.4.')
  }
  if (
    typeof body.slots !== 'object' ||
    body.slots === null ||
    Array.isArray(body.slots)
  ) {
    problems.push('slots must be an object.')
  }
  return problems
}

/** `renderCall`/`buildTool` take the proxy's looser `CallRequest`. One cast, here. */
export function asProxyRequest(req: unknown): {
  call_type: 'judgment' | 'narration' | 'reporter'
  template_version: string
  slots: Record<string, unknown>
} {
  return req as {
    call_type: 'judgment' | 'narration' | 'reporter'
    template_version: string
    slots: Record<string, unknown>
  }
}

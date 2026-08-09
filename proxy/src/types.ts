/**
 * Wire types for the DDAY proxy.
 *
 * Transcribes [call contracts v1](../../docs/contract-calls.md). This is the
 * proxy's copy — it cannot import `src/shared/contracts.ts`, because this
 * package lives outside the root install by design (physical architecture §3.3).
 * That makes three transcriptions of one document (here, `src/shared/`,
 * `tools/lib/calls.mjs`) with no drift gate between them; the gap is recorded in
 * physical architecture §3.9.
 */

export type TokenUsage = {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
};

/** The three calls of the contract. Call 4 (grader) is out of scope for v1. */
export const CALL_TYPES = ["judgment", "narration", "reporter"] as const;
export type CallType = (typeof CALL_TYPES)[number];

export function isCallType(value: unknown): value is CallType {
  return (
    typeof value === "string" && (CALL_TYPES as readonly string[]).includes(value)
  );
}

/**
 * What the composer posts.
 *
 * `slots` carries the values the *client* supplies — the datapack's, the
 * engine's, and the player's (contract §6, "Supplier per slot"). The slots this
 * layer supplies (FLAW · INCIDENT · PRIORITY_LIST) are NOT in here and are not
 * accepted from the client: they live in the default prompt this service owns.
 * A client that sends them is ignored, not trusted.
 *
 * `pack` names the datapack the run is playing, and is the ONLY thing that
 * selects among the per-scenario default prompts. It is a name, not a value:
 * the client says which agent, this tier says what that agent is, and the
 * refusal above is untouched. Optional because the fallback is deliberate —
 * see `FALLBACK_PACK` in `default-prompt.ts`.
 *
 * ⚠️ OPEN: whether `user` arrives pre-rendered from the composer or is rendered
 * here from `slots`. Both layers' templates exist; only the split is undecided.
 * See the note in `call-service.ts`.
 */
export type CallRequest = {
  call_type: CallType;
  template_version: string;
  pack?: string;
  slots: Record<string, unknown>;
};

export type CallTelemetry = {
  callType: CallType;
  templateVersion: string;
  modelId: string;
  latencyMs: number;
  fallback: boolean;
  usage: TokenUsage;
};

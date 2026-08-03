import { CALL_SPECS } from "./calls.js";
import type { RuntimeConfig } from "./config.js";
import { DEFAULT_PROMPT } from "./default-prompt.js";
import { errorCode, ProviderOutputError, PublicError } from "./errors.js";
import { renderCall } from "./prompt.js";
import type { CallProvider } from "./provider.js";
import type { CallRequest, CallTelemetry } from "./types.js";

/**
 * One call, end to end: render → Bedrock → validate.
 *
 * ## This tier does not synthesize fallbacks — it reports failure
 *
 * Engine spec §5 assigns a fallback to each call type, and two of the three need
 * data that only the engine has: Call 1 must proceed with `gates.json`'s
 * authored `default_stance` ("the engine does not choose the default stance" —
 * picking the first of the set would be an undeclared baseline and breaks
 * architecture spec §6.2), and Call 3 must fill `facts` from the engine's own
 * objective log. Only Call 2's fallback (empty arrays) could be produced here.
 *
 * So all three live on the engine side, and this tier's job is to say clearly
 * that the call failed and why: a non-2xx carrying `x-llm-fallback: true` and
 * `x-fallback-code`. Synthesizing Call 2's fallback here and not the other two
 * would scatter one behavior across two tiers to save the engine three lines.
 *
 * That reading of §5's "every response carries x-llm-fallback" is a decision,
 * not a quotation — the spec does not say which side builds the substitute.
 */

export type CallResult = {
  response: unknown;
  telemetry: CallTelemetry;
};

export class CallService {
  constructor(
    private readonly config: RuntimeConfig,
    private readonly provider: CallProvider,
  ) {}

  async handle(request: CallRequest): Promise<CallResult> {
    const spec = CALL_SPECS[request.call_type];
    const startedAt = performance.now();

    // Render AND build the tool schema before calling. Both can fail on a bad
    // payload — an unfilled slot, a STANCE_SET with one entry — and finding that
    // out must cost zero tokens. Building the tool inside the provider would
    // also make the failure indistinguishable from a model failure, which is
    // exactly the confusion the fallback headers exist to prevent.
    const rendered = renderCall(request, DEFAULT_PROMPT as unknown as Record<string, unknown>);
    const tool = spec.buildTool(request.slots);

    let result;
    try {
      result = await this.provider.generate(request, rendered, tool);
    } catch (error) {
      throw asFallback(error);
    }

    const problems = spec.validate(result.payload, request.slots);
    if (problems.length) {
      throw asFallback(
        new ProviderOutputError(
          `Model output failed validation: ${problems.join("; ")}`,
          result.usage,
        ),
      );
    }

    return {
      response: result.payload,
      telemetry: {
        callType: request.call_type,
        templateVersion: request.template_version,
        modelId: this.config.modelId,
        latencyMs: Math.round(performance.now() - startedAt),
        fallback: false,
        usage: result.usage,
      },
    };
  }
}

/**
 * Anything the model side did wrong becomes a PublicError whose `code` the
 * handler puts in `x-fallback-code`. A caller can then tell "the model failed,
 * apply your authored fallback" apart from "your request was malformed".
 */
export class FallbackError extends PublicError {
  constructor(status: number, code: string, message: string) {
    super(status, code, message);
    this.name = "FallbackError";
  }
}

function asFallback(error: unknown): FallbackError {
  if (error instanceof FallbackError) return error;
  if (error instanceof ProviderOutputError) {
    return new FallbackError(502, "invalid_model_output", error.message);
  }
  if (error instanceof PublicError) {
    // A 4xx here is the client's fault, not the model's — pass it through so it
    // does not masquerade as a fallback the engine should absorb.
    if (error.status < 500) throw error;
    return new FallbackError(error.status, error.code, error.message);
  }
  return new FallbackError(
    502,
    errorCode(error),
    "The model call did not produce a usable response.",
  );
}

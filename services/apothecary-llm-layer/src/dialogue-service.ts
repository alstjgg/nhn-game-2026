import type { RuntimeConfig } from "./config.js";
import { deterministicDialogueFallback } from "./dialogue-fallback.js";
import type {
  DialogueProvider,
  DialogueServiceResult,
} from "./dialogue-types.js";
import {
  parseDialogueBeat,
  parseDialogueRequest,
} from "./dialogue-validation.js";
import { errorCode, ProviderOutputError } from "./errors.js";

export class DialogueService {
  constructor(
    private readonly config: RuntimeConfig,
    private readonly provider: DialogueProvider,
  ) {}

  async handle(value: unknown): Promise<DialogueServiceResult> {
    const request = parseDialogueRequest(value);
    const startedAt = performance.now();
    let response;
    let inputTokens = 0;
    let outputTokens = 0;
    let fallbackCode: string | null = null;

    try {
      const providerResult = await this.provider.generate(request);
      inputTokens = providerResult.usage.inputTokens;
      outputTokens = providerResult.usage.outputTokens;
      try {
        response = parseDialogueBeat(providerResult.rawBeat, request);
      } catch (error) {
        response = deterministicDialogueFallback(request);
        fallbackCode = errorCode(error);
      }
    } catch (error) {
      if (error instanceof ProviderOutputError) {
        inputTokens = error.usage.inputTokens;
        outputTokens = error.usage.outputTokens;
      }
      response = deterministicDialogueFallback(request);
      fallbackCode = errorCode(error);
    }

    const latencyMs = Math.round(performance.now() - startedAt);
    return {
      response,
      telemetry: {
        model: this.config.modelId,
        latencyMs,
        inputTokens,
        outputTokens,
        fallback: fallbackCode !== null,
        fallbackCodes: fallbackCode ? [fallbackCode] : [],
      },
    };
  }
}

import type {
  CompactionMode,
  FeatureCapabilities,
  ProviderId,
} from "./types.js";

export function anthropicSupportsNativeCompactionModel(
  model: string,
): boolean {
  return [
    /claude-opus-4-[678](?:-|$)/i,
    /claude-sonnet-4-6(?:-|$)/i,
    /claude-(?:fable|mythos|sonnet)-5(?:-|$)/i,
    /claude-mythos-preview(?:-|$)/i,
  ].some((pattern) => pattern.test(model));
}

export function compactModesForModel(
  provider: ProviderId,
  capabilities: FeatureCapabilities,
  model: string | undefined,
): CompactionMode[] {
  if (!capabilities.compaction) {
    return [];
  }
  if (provider === "mock") {
    return ["mock-native"];
  }
  if (provider === "openai") {
    return ["native"];
  }
  return model !== undefined &&
    anthropicSupportsNativeCompactionModel(model)
    ? ["native", "explicit-summary-fallback"]
    : ["explicit-summary-fallback"];
}

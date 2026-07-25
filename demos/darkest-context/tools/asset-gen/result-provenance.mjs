export function resolveRecordedPrompt({ reprocess, previousPrompt, currentPrompt }) {
  if (!reprocess) return currentPrompt;
  if (typeof previousPrompt !== "string" || previousPrompt.length === 0) {
    throw new Error("Cannot reprocess raw image without its previously recorded prompt.");
  }
  return previousPrompt;
}

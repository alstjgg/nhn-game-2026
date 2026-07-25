import assert from "node:assert/strict";
import test from "node:test";
import { resolveRecordedPrompt } from "./result-provenance.mjs";

test("API generation records the current prompt", () => {
  assert.equal(
    resolveRecordedPrompt({
      reprocess: false,
      previousPrompt: "old prompt",
      currentPrompt: "current prompt",
    }),
    "current prompt",
  );
});

test("raw reprocessing preserves the prompt that generated the raw image", () => {
  assert.equal(
    resolveRecordedPrompt({
      reprocess: true,
      previousPrompt: "old prompt",
      currentPrompt: "current prompt",
    }),
    "old prompt",
  );
});

test("raw reprocessing rejects missing prompt provenance", () => {
  assert.throws(
    () =>
      resolveRecordedPrompt({
        reprocess: true,
        previousPrompt: undefined,
        currentPrompt: "current prompt",
      }),
    /without its previously recorded prompt/,
  );
});

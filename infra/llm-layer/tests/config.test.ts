import { describe, expect, it } from "vitest";

import {
  HAIKU_MODEL_ID,
  NOVA_MODEL_ID,
  loadConfig,
} from "../src/config.js";

function validEnv(): NodeJS.ProcessEnv {
  return {
    BEDROCK_REGION: "ap-northeast-2",
    MODEL_ID: HAIKU_MODEL_ID,
    ALLOWED_MODEL_IDS: `${HAIKU_MODEL_ID},${NOVA_MODEL_ID}`,
    MAX_TOKENS: "160",
    MODEL_TIMEOUT_MS: "7000",
    ALLOWED_ORIGIN: "https://alstjgg.github.io",
    MAX_BODY_BYTES: "32768",
  };
}

describe("loadConfig", () => {
  it("loads the default model and deployed runtime allowlist", () => {
    const config = loadConfig(validEnv());

    expect(config.modelId).toBe(HAIKU_MODEL_ID);
    expect(config.allowedModelIds).toEqual([HAIKU_MODEL_ID, NOVA_MODEL_ID]);
  });

  it("accepts Nova as the default while both models remain selectable", () => {
    const env = validEnv();
    env.MODEL_ID = NOVA_MODEL_ID;

    expect(loadConfig(env)).toMatchObject({
      modelId: NOVA_MODEL_ID,
      allowedModelIds: [HAIKU_MODEL_ID, NOVA_MODEL_ID],
    });
  });

  it("fails closed when MODEL_ID is outside the deployed allowlist", () => {
    const env = validEnv();
    env.ALLOWED_MODEL_IDS = NOVA_MODEL_ID;

    expect(() => loadConfig(env)).toThrow(/not in the deployed allowlist/);
  });

  it.each([
    ["BEDROCK_REGION", "us-east-1"],
    ["MAX_TOKENS", "0"],
    ["MODEL_TIMEOUT_MS", "22001"],
    ["MAX_BODY_BYTES", "999"],
    ["ALLOWED_ORIGIN", "https://alstjgg.github.io/path"],
    ["ALLOWED_ORIGIN", "http://alstjgg.github.io"],
    ["ALLOWED_MODEL_IDS", `${HAIKU_MODEL_ID},${HAIKU_MODEL_ID}`],
  ])("rejects invalid %s", (name, value) => {
    const env = validEnv();
    env[name] = value;

    expect(() => loadConfig(env)).toThrow();
  });
});

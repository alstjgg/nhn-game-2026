// Post-build smoke on the actual Lambda bundle, not the source tree.
//
// Copied from apothecary-llm-layer/scripts/bundle-smoke.cjs. Same acceptance
// shape: drive the built artifact with two events and assert the status codes,
// which catches a bundle that imports something esbuild did not include.
//
// The call routes have landed, so `events/call.json` carries a real judgment
// payload and the assertion is no longer a status literal. What this smoke can
// prove offline is that the bundle got *past* rendering and tool-building and
// into the provider: either a 200 (credentials happened to be in the
// environment, so a real Bedrock call answered) or a non-2xx carrying
// `x-llm-fallback` (the provider was reached and failed — offline that is
// CredentialsProviderError). A 4xx means validation rejected the fixture and a
// throw means esbuild dropped something from the module graph; both are the
// failures this smoke exists to catch.
const fs = require("node:fs");
const Module = require("node:module");
const path = require("node:path");

Object.assign(process.env, {
  BEDROCK_REGION: "ap-northeast-2",
  MODEL_ID: "global.anthropic.claude-haiku-4-5-20251001-v1:0",
  ALLOWED_MODEL_IDS: "global.anthropic.claude-haiku-4-5-20251001-v1:0",
  MAX_TOKENS: "2048",
  MODEL_TIMEOUT_MS: "7000",
  ALLOWED_ORIGIN: "https://alstjgg.github.io",
  MAX_BODY_BYTES: "131072",
});

const filename = path.resolve(".aws-sam/build/CallFunction/handler.js");
if (!fs.existsSync(filename)) {
  throw new Error("Run npm run sam:build before the bundle smoke test.");
}

// The build artifact is deployed at the Lambda zip root, where handler.js is
// CommonJS. Compile it explicitly because this source package is type=module.
const compiled = new Module(filename);
compiled.filename = filename;
compiled.paths = Module._nodeModulePaths(path.dirname(filename));
compiled._compile(fs.readFileSync(filename, "utf8"), filename);

const callEvent = JSON.parse(fs.readFileSync("events/call.json", "utf8"));
const healthEvent = {
  ...callEvent,
  routeKey: "GET /dday/health",
  rawPath: "/dday/health",
  body: "",
  requestContext: {
    ...callEvent.requestContext,
    routeKey: "GET /dday/health",
    http: {
      ...callEvent.requestContext.http,
      method: "GET",
      path: "/dday/health",
    },
  },
};

Promise.all([
  compiled.exports.handler(callEvent, { awsRequestId: "bundle-smoke-call" }),
  compiled.exports.handler(healthEvent, { awsRequestId: "bundle-smoke-health" }),
]).then(([callResult, healthResult]) => {
  const reachedProvider =
    callResult.statusCode === 200 ||
    callResult.headers?.["x-llm-fallback"] === "true";
  if (!reachedProvider || healthResult.statusCode !== 200) {
    throw new Error(
      `Unexpected bundle responses: ${JSON.stringify({ callResult, healthResult })}`,
    );
  }
  console.log(
    JSON.stringify({
      ok: true,
      callStatusCode: callResult.statusCode,
      callFallbackCode: callResult.headers?.["x-fallback-code"] ?? null,
      healthStatusCode: healthResult.statusCode,
    }),
  );
});

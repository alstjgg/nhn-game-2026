const fs = require("node:fs");
const Module = require("node:module");
const path = require("node:path");

Object.assign(process.env, {
  BEDROCK_REGION: "ap-northeast-2",
  MODEL_ID: "global.amazon.nova-2-lite-v1:0",
  ALLOWED_MODEL_IDS:
    "global.amazon.nova-2-lite-v1:0",
  MAX_TOKENS: "400",
  MODEL_TIMEOUT_MS: "7000",
  ALLOWED_ORIGIN: "https://alstjgg.github.io",
  MAX_BODY_BYTES: "32768",
});

const filename = path.resolve(".aws-sam/build/TurnFunction/handler.js");
if (!fs.existsSync(filename)) {
  throw new Error("Run npm run sam:build before the bundle smoke test.");
}

// The build artifact is deployed at the Lambda zip root, where handler.js is
// CommonJS. Compile it explicitly because this source package is type=module.
const compiled = new Module(filename);
compiled.filename = filename;
compiled.paths = Module._nodeModulePaths(path.dirname(filename));
compiled._compile(fs.readFileSync(filename, "utf8"), filename);

const dialogueEvent = JSON.parse(
  fs.readFileSync("events/dialogue.json", "utf8"),
);
dialogueEvent.body = "{";
const healthEvent = {
  ...dialogueEvent,
  routeKey: "GET /ai/health",
  rawPath: "/ai/health",
  body: "",
  requestContext: {
    ...dialogueEvent.requestContext,
    routeKey: "GET /ai/health",
    http: {
      ...dialogueEvent.requestContext.http,
      method: "GET",
      path: "/ai/health",
    },
  },
};

Promise.all([
  compiled.exports.handler(dialogueEvent, {
    awsRequestId: "bundle-smoke-dialogue",
  }),
  compiled.exports.handler(healthEvent, {
    awsRequestId: "bundle-smoke-health",
  }),
]).then(([dialogueResult, healthResult]) => {
  if (dialogueResult.statusCode !== 400 || healthResult.statusCode !== 200) {
    throw new Error(
      `Unexpected bundle responses: ${JSON.stringify({
        dialogueResult,
        healthResult,
      })}`,
    );
  }
  console.log(
    JSON.stringify({
      ok: true,
      dialogueStatusCode: dialogueResult.statusCode,
      healthStatusCode: healthResult.statusCode,
    }),
  );
});

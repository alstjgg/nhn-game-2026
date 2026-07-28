#!/usr/bin/env node

import { execFileSync } from "node:child_process";

function argument(name, fallback) {
  const index = process.argv.indexOf(name);
  const value = index >= 0 ? process.argv[index + 1] : fallback;
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

function flag(name) {
  return process.argv.includes(name);
}

function optionalArgument(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

const url = argument("--url", process.env.LLM_DIALOGUE_URL);
const healthUrl = argument(
  "--health-url",
  new URL("/ai/health", url).toString(),
);
const origin = argument(
  "--origin",
  process.env.LLM_ALLOWED_ORIGIN ?? "https://alstjgg.github.io",
);
const expectedModel = argument(
  "--model-id",
  process.env.LLM_MODEL_ID ?? "global.amazon.nova-2-lite-v1:0",
);
const allowFallback = flag("--allow-fallback");
const checkThrottle = flag("--check-throttle");
const auditLogs = flag("--audit-logs");
const awsProfile = optionalArgument("--profile", process.env.AWS_PROFILE);
const awsRegion = argument("--region", "ap-northeast-2");
const logGroup = argument(
  "--log-group",
  "/aws/lambda/nhn-game-llm-layer-turn",
);
const maxBodyBytes = Number(
  argument("--max-body-bytes", process.env.LLM_MAX_BODY_BYTES ?? "32768"),
);
const guardrailDelayMs = Number(
  argument(
    "--guardrail-delay-ms",
    process.env.LLM_GUARDRAIL_DELAY_MS ?? "1100",
  ),
);
const throttleRequestCount = Number(
  argument(
    "--throttle-requests",
    process.env.LLM_THROTTLE_REQUESTS ?? "64",
  ),
);

if (!Number.isSafeInteger(maxBodyBytes) || maxBodyBytes < 1_024) {
  throw new Error("--max-body-bytes must be an integer of at least 1024.");
}
if (!Number.isSafeInteger(guardrailDelayMs) || guardrailDelayMs < 0) {
  throw new Error("--guardrail-delay-ms must be a non-negative integer.");
}
if (
  !Number.isSafeInteger(throttleRequestCount) ||
  throttleRequestCount < 1 ||
  throttleRequestCount > 256
) {
  throw new Error("--throttle-requests must be an integer from 1 to 256.");
}

const request = {
  customer: {
    personaTraits: [
      "A stern middle-aged seamstress with sharp eyes, a tight hair bun and a measuring string around her neck.",
      "Constantly fidgets with a wooden prayer-bead bracelet.",
    ],
    problem: "기침이 좀처럼 멎지 않아요.",
    hiddenCause:
      "새벽마다 냉기 도는 광에서 삯바느질을 하느라 몸이 상했다.",
  },
  patienceTier: 0,
  history: [],
  availableClues: [
    {
      id: "clue_before_cockcrow",
      text: "닭이 울기도 전에 일어난다며 대수롭지 않게 말한다.",
    },
    {
      id: "clue_hoarse_voice",
      text: "목소리가 갈라져 쉰 소리가 난다.",
    },
    {
      id: "clue_cold_storeroom",
      text: "방이 아니라 광에서 밤을 난다는 말이 스치듯 나온다.",
    },
    {
      id: "clue_needle_calluses",
      text: "손끝마다 바늘에 박인 굳은살이 도드라진다.",
    },
  ],
};

async function parseResponse(response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Endpoint returned non-JSON HTTP ${response.status}.`);
  }
}

async function post(body, requestOrigin = origin) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: requestOrigin,
    },
    body,
    signal: AbortSignal.timeout(12_000),
  });
  return { response, body: await parseResponse(response) };
}

// Decision 12: the first call against a strict schema compiles a grammar
// server-side (cached ~24 h) and can exceed the model deadline. One throwaway
// call absorbs that before the real smoke asserts on fallback. It reuses the
// request below rather than a second copy of registered game data, and it never
// fails the caller — the smoke that follows is the actual gate.
if (flag("--warm-only")) {
  const warmStartedAt = performance.now();
  let status;
  try {
    status = (await post(JSON.stringify(request))).response.status;
  } catch (error) {
    status = error instanceof Error ? error.name : "error";
  }
  console.log(
    JSON.stringify({
      ok: true,
      warmOnly: true,
      status,
      latencyMs: Math.round(performance.now() - warmStartedAt),
    }),
  );
  process.exit(0);
}

const healthResponse = await fetch(healthUrl, {
  headers: { origin },
  signal: AbortSignal.timeout(12_000),
});
const health = await parseResponse(healthResponse);
if (
  !healthResponse.ok ||
  health.ok !== true ||
  health.dialogue !== true ||
  health.portrait !== false ||
  health.models?.dialogue !== expectedModel ||
  health.models?.portrait !== "pre-generated-assets"
) {
  throw new Error("Health endpoint does not match the deployed AI contract.");
}

await new Promise((resolve) => setTimeout(resolve, guardrailDelayMs));
const startedAt = performance.now();
const happy = await post(JSON.stringify(request));
if (!happy.response.ok) {
  throw new Error(
    `Dialogue endpoint returned HTTP ${happy.response.status}: ${happy.body?.error?.code ?? "unknown"}`,
  );
}
if (happy.response.headers.get("access-control-allow-origin") !== origin) {
  throw new Error("Dialogue endpoint did not return the expected CORS origin.");
}
const requestId = happy.response.headers.get("x-request-id");
if (!requestId) {
  throw new Error("Dialogue endpoint did not return x-request-id.");
}
const fallback = happy.response.headers.get("x-llm-fallback");
if (fallback !== "true" && fallback !== "false") {
  throw new Error("Dialogue endpoint did not return x-llm-fallback.");
}
if (fallback === "true" && !allowFallback) {
  throw new Error(
    "Dialogue endpoint used deterministic fallback; Bedrock is not live-verified.",
  );
}

const costs = { indirect: 1, direct: 2, observe: 0, craft: 0 };
const availableClueIds = new Set(
  request.availableClues.map((clue) => clue.id),
);
if (
  typeof happy.body.npcLine !== "string" ||
  !Array.isArray(happy.body.choices) ||
  happy.body.choices.length !== 4
) {
  throw new Error("Dialogue response does not match the client contract.");
}
const verbs = happy.body.choices.map((choice) => choice.verb);
if (
  new Set(verbs).size !== 4 ||
  !["indirect", "direct", "observe", "craft"].every((verb) =>
    verbs.includes(verb),
  )
) {
  throw new Error("Dialogue response must contain each verb exactly once.");
}
for (const choice of happy.body.choices) {
  if (
    typeof choice.label !== "string" ||
    choice.patienceCost !== costs[choice.verb] ||
    request.availableClues.some((clue) => choice.label.includes(clue.id))
  ) {
    throw new Error("Dialogue choice label or server-stamped cost is invalid.");
  }
  const clueReveals = choice.clueReveals ?? [];
  if (
    !Array.isArray(clueReveals) ||
    clueReveals.some((id) => !availableClueIds.has(id)) ||
    (choice.verb !== "observe" && clueReveals.length > 0)
  ) {
    throw new Error("Dialogue response returned an unauthorized clue.");
  }
}

await new Promise((resolve) => setTimeout(resolve, guardrailDelayMs));
const forbidden = await post(
  JSON.stringify(request),
  "https://wrong-origin.invalid",
);
if (
  forbidden.response.status !== 403 ||
  forbidden.body?.error?.code !== "origin_forbidden"
) {
  throw new Error("Wrong-origin verification did not return origin_forbidden.");
}

await new Promise((resolve) => setTimeout(resolve, guardrailDelayMs));
const oversized = await post(
  JSON.stringify({ padding: "x".repeat(maxBodyBytes + 1) }),
);
if (
  oversized.response.status !== 413 ||
  oversized.body?.error?.code !== "request_too_large"
) {
  throw new Error("Oversized-body verification did not return request_too_large.");
}

let throttleStatuses = [];
if (checkThrottle) {
  const throttleChecks = await Promise.all(
    Array.from({ length: throttleRequestCount }, () =>
      post(JSON.stringify(request), "https://wrong-origin.invalid"),
    ),
  );
  throttleStatuses = throttleChecks.map(({ response }) => response.status);
  if (!throttleStatuses.includes(429)) {
    throw new Error(
      "Throttle verification did not observe HTTP 429; check the deployed stage settings.",
    );
  }
}

function findDialogueTelemetry(value) {
  if (!value || typeof value !== "object") return null;
  if (value.event === "llm_dialogue") return value;

  const nested = value.message;
  if (nested && typeof nested === "object") {
    return findDialogueTelemetry(nested);
  }
  if (typeof nested === "string") {
    try {
      return findDialogueTelemetry(JSON.parse(nested));
    } catch {
      return null;
    }
  }
  return null;
}

async function verifyCloudWatchLog() {
  const allowedFields = new Set([
    "event",
    "requestId",
    "status",
    "model",
    "latencyMs",
    "inputTokens",
    "outputTokens",
    "fallback",
    "fallbackCodes",
  ]);
  const startedAfter = String(Date.now() - 10 * 60 * 1_000);

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const raw = execFileSync(
      "aws",
      [
        "logs",
        "filter-log-events",
        ...(awsProfile ? ["--profile", awsProfile] : []),
        "--region",
        awsRegion,
        "--log-group-name",
        logGroup,
        "--filter-pattern",
        `"${requestId}"`,
        "--start-time",
        startedAfter,
        "--output",
        "json",
      ],
      { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] },
    );
    const events = JSON.parse(raw).events ?? [];
    const telemetry = events
      .map((event) => {
        try {
          return findDialogueTelemetry(JSON.parse(event.message));
        } catch {
          return null;
        }
      })
      .find(Boolean);

    if (telemetry) {
      const unexpectedFields = Object.keys(telemetry).filter(
        (key) => !allowedFields.has(key),
      );
      if (unexpectedFields.length > 0) {
        throw new Error(
          `CloudWatch telemetry contains unexpected fields: ${unexpectedFields.join(", ")}`,
        );
      }
      if (
        telemetry.requestId !== requestId ||
        telemetry.model !== expectedModel ||
        telemetry.fallback !== (fallback === "true") ||
        !Number.isFinite(telemetry.latencyMs) ||
        !Number.isFinite(telemetry.inputTokens) ||
        !Number.isFinite(telemetry.outputTokens) ||
        !Array.isArray(telemetry.fallbackCodes)
      ) {
        throw new Error("CloudWatch telemetry does not match the smoke request.");
      }
      return true;
    }

    await new Promise((resolve) => setTimeout(resolve, 3_000));
  }

  throw new Error(
    `CloudWatch did not expose the smoke telemetry in ${logGroup} within 30 seconds.`,
  );
}

const logsVerified = auditLogs ? await verifyCloudWatchLog() : false;

console.log(
  JSON.stringify({
    ok: true,
    modelId: expectedModel,
    requestId,
    fallback: fallback === "true",
    latencyMs: Math.round(performance.now() - startedAt),
    checks: {
      liveBedrock: fallback === "false",
      health: true,
      cors: true,
      wrongOrigin: true,
      oversizedBody: true,
      throttle: checkThrottle ? throttleStatuses.includes(429) : "skipped",
      cloudWatchLogs: auditLogs ? logsVerified : "skipped",
    },
  }),
);

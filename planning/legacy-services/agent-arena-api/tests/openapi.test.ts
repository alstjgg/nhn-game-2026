import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import SwaggerParser from "@apidevtools/swagger-parser";
import { Ajv2020, type ValidateFunction } from "ajv/dist/2020.js";
import { afterEach, describe, expect, it } from "vitest";
import { parse } from "yaml";

import {
  apiRequest,
  createRun,
  createTestApplication,
  turnRequest,
  waitForTurn,
  type TestApplication,
} from "./helpers.js";

type OpenApiDocument = {
  openapi: string;
  paths: Record<
    string,
    Record<
      string,
      {
        operationId?: string;
        parameters?: Array<{
          name?: string;
          in?: string;
          schema?: Record<string, unknown>;
        }>;
        responses?: Record<string, unknown>;
      }
    >
  >;
};

const OPENAPI_ID = "urn:nan2026:agent-arena-openapi";
const OPENAPI_PATH = fileURLToPath(
  new URL("../openapi.yaml", import.meta.url),
);
const document = parse(
  readFileSync(OPENAPI_PATH, "utf8"),
) as OpenApiDocument;
const ajv = new Ajv2020({
  allErrors: true,
  strict: false,
  validateFormats: false,
});
ajv.addSchema({ ...document, $id: OPENAPI_ID }, OPENAPI_ID);

function pointerSegment(value: string): string {
  return value.replaceAll("~", "~0").replaceAll("/", "~1");
}

function responseValidator(
  path: string,
  method: string,
  status: number,
): ValidateFunction {
  const pointer = [
    "paths",
    path,
    method,
    "responses",
    String(status),
    "content",
    "application/json",
    "schema",
  ]
    .map(pointerSegment)
    .join("/");
  return ajv.compile({ $ref: `${OPENAPI_ID}#/${pointer}` });
}

function componentValidator(name: string): ValidateFunction {
  return ajv.compile({
    $ref: `${OPENAPI_ID}#/components/schemas/${pointerSegment(name)}`,
  });
}

function expectDocumentedJson(
  path: string,
  method: string,
  status: number,
  value: unknown,
): void {
  const validate = responseValidator(path, method, status);
  expect(
    validate(value),
    JSON.stringify(validate.errors ?? [], null, 2),
  ).toBe(true);
}

function expectSchemaResult(
  schemaName: string,
  value: unknown,
  expected: boolean,
): void {
  const validate = componentValidator(schemaName);
  expect(
    validate(value),
    JSON.stringify(validate.errors ?? [], null, 2),
  ).toBe(expected);
}

describe("OpenAPI contract", () => {
  let app: TestApplication | undefined;

  afterEach(async () => {
    await app?.close();
    app = undefined;
  });

  it("passes semantic validation and lists every implemented operation once", async () => {
    await expect(SwaggerParser.validate(OPENAPI_PATH)).resolves.toBeDefined();
    expect(document.openapi).toBe("3.1.0");
    const operations = Object.entries(document.paths).flatMap(
      ([path, pathItem]) =>
        Object.entries(pathItem)
          .filter(([method]) =>
            ["get", "post", "put", "patch", "delete"].includes(method),
          )
          .map(([method, operation]) => ({
            key: `${method.toUpperCase()} ${path}`,
            operationId: operation.operationId,
          })),
    );
    expect(operations.map(({ key }) => key).sort()).toEqual(
      [
        "GET /healthz",
        "GET /readyz",
        "GET /v1/capabilities",
        "GET /v1/turns/{turnId}",
        "GET /v1/turns/{turnId}/events",
        "POST /v1/runs",
        "POST /v1/runs/{runId}/agents/{agentId}/clear",
        "POST /v1/runs/{runId}/agents/{agentId}/compact",
        "POST /v1/runs/{runId}/turns",
        "PUT /v1/runs/{runId}/agents/{agentId}/loadout",
      ].sort(),
    );
    const operationIds = operations.map(({ operationId }) => operationId);
    expect(operationIds.every((value) => typeof value === "string")).toBe(true);
    expect(new Set(operationIds).size).toBe(operationIds.length);
  });

  it("mirrors runtime bounds for run and loadout request IDs", () => {
    const validRun = {
      modelProfileId: "m".repeat(64),
      harnessId: "h".repeat(64),
      party: ["a", "b", "c"].map((agentId) => ({
        agentId: agentId.repeat(64),
        promptCardIds: ["p".repeat(128)],
        skillCardIds: ["s".repeat(128)],
        mcpCardIds: ["c".repeat(128)],
      })),
    };
    expectSchemaResult("CreateRunRequest", validRun, true);

    const invalidMutations: Array<(value: typeof validRun) => void> = [
      (value) => {
        value.modelProfileId = "";
      },
      (value) => {
        value.modelProfileId = "m".repeat(65);
      },
      (value) => {
        value.harnessId = "";
      },
      (value) => {
        value.harnessId = "h".repeat(65);
      },
      (value) => {
        value.party[0]!.agentId = "";
      },
      (value) => {
        value.party[0]!.agentId = "a".repeat(65);
      },
      (value) => {
        value.party[0]!.promptCardIds = [""];
      },
      (value) => {
        value.party[0]!.skillCardIds = ["s".repeat(129)];
      },
      (value) => {
        value.party[0]!.promptCardIds = Array.from(
          { length: 17 },
          (_, index) => `prompt-${index}`,
        );
      },
      (value) => {
        value.party[0]!.skillCardIds = Array.from(
          { length: 17 },
          (_, index) => `skill-${index}`,
        );
      },
      (value) => {
        value.party[0]!.mcpCardIds = Array.from(
          { length: 9 },
          (_, index) => `mcp-${index}`,
        );
      },
    ];
    for (const mutate of invalidMutations) {
      const invalid = structuredClone(validRun);
      mutate(invalid);
      expectSchemaResult("CreateRunRequest", invalid, false);
    }

    expectSchemaResult(
      "Loadout",
      {
        promptCardIds: ["p".repeat(128)],
        skillCardIds: ["s".repeat(128)],
        mcpCardIds: ["m".repeat(128)],
      },
      true,
    );
    expectSchemaResult(
      "Loadout",
      {
        promptCardIds: [],
        skillCardIds: [],
        mcpCardIds: [""],
      },
      false,
    );
  });

  it("mirrors runtime bounds for turn stage, event, action, and target fields", () => {
    const validTurn = {
      stageId: "s".repeat(128),
      turnNumber: 1,
      event: {
        type: "e".repeat(64),
        summary: "x".repeat(2000),
        publicState: {},
      },
      allowedActions: [
        {
          actionId: "a".repeat(64),
          targetIds: ["t".repeat(128)],
        },
      ],
    };
    expectSchemaResult("CreateTurnRequest", validTurn, true);

    const invalidMutations: Array<(value: typeof validTurn) => void> = [
      (value) => {
        value.stageId = "";
      },
      (value) => {
        value.stageId = "s".repeat(129);
      },
      (value) => {
        value.event.type = "";
      },
      (value) => {
        value.event.type = "e".repeat(65);
      },
      (value) => {
        value.event.summary = "";
      },
      (value) => {
        value.event.summary = "x".repeat(2001);
      },
      (value) => {
        value.allowedActions[0]!.actionId = "";
      },
      (value) => {
        value.allowedActions[0]!.actionId = "a".repeat(65);
      },
      (value) => {
        value.allowedActions[0]!.targetIds = [""];
      },
      (value) => {
        value.allowedActions[0]!.targetIds = ["t".repeat(129)];
      },
      (value) => {
        value.allowedActions[0]!.targetIds = Array.from(
          { length: 33 },
          (_, index) => `target-${index}`,
        );
      },
      (value) => {
        value.allowedActions = Array.from(
          { length: 33 },
          (_, index) => ({
            actionId: `action-${index}`,
            targetIds: [],
          }),
        );
      },
    ];
    for (const mutate of invalidMutations) {
      const invalid = structuredClone(validTurn);
      mutate(invalid);
      expectSchemaResult("CreateTurnRequest", invalid, false);
    }
  });

  it("documents both SSE replay cursors with safe-integer runtime bounds", () => {
    const parameters =
      document.paths["/v1/turns/{turnId}/events"]!.get!.parameters ?? [];
    for (const [name, location] of [
      ["Last-Event-ID", "header"],
      ["after", "query"],
    ] as const) {
      expect(parameters).toContainEqual(
        expect.objectContaining({
          name,
          in: location,
          required: false,
          schema: {
            type: "integer",
            minimum: 0,
            maximum: Number.MAX_SAFE_INTEGER,
          },
        }),
      );
    }
  });

  it("validates actual success responses against their documented schemas", async () => {
    app = await createTestApplication();

    const health = await fetch(`${app.baseUrl}/healthz`);
    expectDocumentedJson(
      "/healthz",
      "get",
      health.status,
      await health.json(),
    );
    const readiness = await fetch(`${app.baseUrl}/readyz`);
    expectDocumentedJson(
      "/readyz",
      "get",
      readiness.status,
      await readiness.json(),
    );

    const capabilities = await apiRequest(app, "/v1/capabilities");
    expectDocumentedJson(
      "/v1/capabilities",
      "get",
      capabilities.status,
      await capabilities.json(),
    );

    const run = await createRun(app);
    expectDocumentedJson("/v1/runs", "post", 201, run);

    const loadout = await apiRequest(
      app,
      `/v1/runs/${run.runId}/agents/guardian/loadout`,
      {
        method: "PUT",
        body: {
          promptCardIds: ["protect-weakest-v1"],
          skillCardIds: [],
          mcpCardIds: [],
        },
      },
    );
    expectDocumentedJson(
      "/v1/runs/{runId}/agents/{agentId}/loadout",
      "put",
      loadout.status,
      await loadout.json(),
    );

    const acceptedResponse = await apiRequest(
      app,
      `/v1/runs/${run.runId}/turns`,
      {
        method: "POST",
        body: turnRequest(1),
        idempotencyKey: "openapi-turn-key",
      },
    );
    const accepted = await acceptedResponse.json();
    expectDocumentedJson(
      "/v1/runs/{runId}/turns",
      "post",
      acceptedResponse.status,
      accepted,
    );
    const turnId = (accepted as { turnId: string }).turnId;
    const turn = await waitForTurn(app, turnId);
    expectDocumentedJson("/v1/turns/{turnId}", "get", 200, turn);

    const events = await apiRequest(app, `/v1/turns/${turnId}/events`);
    expect(events.status).toBe(200);
    expect(events.headers.get("content-type")).toContain("text/event-stream");
    await events.text();

    const compact = await apiRequest(
      app,
      `/v1/runs/${run.runId}/agents/guardian/compact`,
      {
        method: "POST",
        body: {},
        idempotencyKey: "openapi-compact-key",
      },
    );
    expectDocumentedJson(
      "/v1/runs/{runId}/agents/{agentId}/compact",
      "post",
      compact.status,
      await compact.json(),
    );

    const clear = await apiRequest(
      app,
      `/v1/runs/${run.runId}/agents/guardian/clear`,
      {
        method: "POST",
        body: {},
        idempotencyKey: "openapi-clear-key",
      },
    );
    expectDocumentedJson(
      "/v1/runs/{runId}/agents/{agentId}/clear",
      "post",
      clear.status,
      await clear.json(),
    );
  });

  it("documents transport failures and validates real sanitized errors", async () => {
    const expectedStatuses: Record<string, string[]> = {
      "GET /v1/capabilities": ["200", "401", "403", "429"],
      "POST /v1/runs": [
        "201",
        "400",
        "401",
        "403",
        "409",
        "413",
        "415",
        "422",
        "429",
      ],
      "PUT /v1/runs/{runId}/agents/{agentId}/loadout": [
        "200",
        "400",
        "401",
        "403",
        "404",
        "409",
        "413",
        "415",
        "422",
        "429",
      ],
      "POST /v1/runs/{runId}/turns": [
        "202",
        "400",
        "401",
        "403",
        "404",
        "409",
        "413",
        "415",
        "429",
      ],
      "GET /v1/turns/{turnId}": ["200", "401", "403", "404", "429"],
      "GET /v1/turns/{turnId}/events": [
        "200",
        "400",
        "401",
        "403",
        "404",
        "409",
        "429",
      ],
      "POST /v1/runs/{runId}/agents/{agentId}/compact": [
        "200",
        "400",
        "401",
        "403",
        "404",
        "409",
        "413",
        "415",
        "429",
        "502",
        "504",
      ],
      "POST /v1/runs/{runId}/agents/{agentId}/clear": [
        "200",
        "400",
        "401",
        "403",
        "404",
        "409",
        "413",
        "415",
        "429",
      ],
    };
    for (const [operation, statuses] of Object.entries(expectedStatuses)) {
      const separator = operation.indexOf(" ");
      const method = operation.slice(0, separator).toLowerCase();
      const path = operation.slice(separator + 1);
      expect(
        Object.keys(document.paths[path]![method]!.responses ?? {}).sort(),
      ).toEqual([...statuses].sort());
    }

    app = await createTestApplication();
    const unauthorized = await fetch(`${app.baseUrl}/v1/capabilities`);
    expect(unauthorized.status).toBe(401);
    const unauthorizedBody = await unauthorized.json();
    const validateError = componentValidator("Error");
    expect(
      validateError(unauthorizedBody),
      JSON.stringify(validateError.errors ?? [], null, 2),
    ).toBe(true);

    const invalidOrigin = await apiRequest(app, "/v1/capabilities", {
      headers: { origin: "https://not-allowlisted.example" },
    });
    expect(invalidOrigin.status).toBe(403);
    expect(validateError(await invalidOrigin.json())).toBe(true);
  });
});

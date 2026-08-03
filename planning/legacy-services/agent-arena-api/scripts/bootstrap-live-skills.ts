import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { loadEnvFile } from "node:process";

type JsonRecord = Record<string, unknown>;

type BootstrapResult = {
  provider: "openai" | "anthropic";
  status: "created" | "versioned" | "reused" | "skipped" | "failed";
  skillId?: string;
  version?: string;
  provenance?: "uploaded_current_fixture" | "existing_unverified";
  reason?: string;
};

const SKILL_NAME = "arena-tactics";
const ANTHROPIC_DISPLAY_TITLE = "Agent Arena Live Tactics v1";
const SKILL_FILES = ["SKILL.md"] as const;
const REQUEST_TIMEOUT_MS = 30_000;

function loadLocalEnvironment(): void {
  const candidates = [
    resolve(process.cwd(), ".env.local"),
    resolve(process.cwd(), "../../.env.local"),
  ];
  const selected = candidates.find((candidate) => existsSync(candidate));
  if (selected !== undefined) {
    loadEnvFile(selected);
  }
}

function isRecord(value: unknown): value is JsonRecord {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function requiredString(
  object: JsonRecord,
  key: string,
  provider: string,
): string {
  const value = object[key];
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${provider}_skill_response_missing_${key}`);
  }
  return value;
}

function optionalVersion(object: JsonRecord): string | undefined {
  const value =
    object.version ?? object.latest_version ?? object.default_version;
  if (
    (typeof value === "string" && value.length > 0) ||
    (typeof value === "number" && Number.isSafeInteger(value) && value > 0)
  ) {
    return String(value);
  }
  return undefined;
}

function responseItems(value: unknown): JsonRecord[] {
  if (!isRecord(value) || !Array.isArray(value.data)) {
    throw new Error("skill_list_response_invalid");
  }
  return value.data.filter(isRecord);
}

async function responseJson(
  response: Response,
  provider: string,
): Promise<JsonRecord> {
  let value: unknown;
  try {
    value = await response.json();
  } catch {
    throw new Error(`${provider}_skill_response_not_json`);
  }
  if (!response.ok) {
    const code =
      isRecord(value) && isRecord(value.error) &&
      typeof value.error.code === "string"
        ? value.error.code
        : `http_${response.status}`;
    throw new Error(`${provider}_skill_api_${code}`);
  }
  if (!isRecord(value)) {
    throw new Error(`${provider}_skill_response_invalid`);
  }
  return value;
}

async function providerFetch(
  input: string,
  init: RequestInit = {},
): Promise<Response> {
  return fetch(input, {
    ...init,
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
}

function skillRoot(): string {
  return resolve(process.cwd(), "fixtures/skills", SKILL_NAME);
}

function fixtureSha256(): string {
  const hash = createHash("sha256");
  for (const filename of SKILL_FILES) {
    hash.update(filename);
    hash.update("\0");
    hash.update(readFileSync(resolve(skillRoot(), filename)));
    hash.update("\0");
  }
  return hash.digest("hex");
}

function skillForm(): FormData {
  const form = new FormData();
  for (const filename of SKILL_FILES) {
    const path = resolve(skillRoot(), filename);
    const mediaType =
      filename === "SKILL.md" ? "text/markdown" : "text/x-python";
    form.append(
      "files[]",
      new Blob([readFileSync(path)], { type: mediaType }),
      `${SKILL_NAME}/${filename}`,
    );
  }
  return form;
}

function assertExplicitExistingSkillPolicy(provider: string): void {
  if (process.env.BOOTSTRAP_LIVE_SKILLS_ALLOW_UNVERIFIED_REUSE !== "1") {
    throw new Error(
      `${provider}_existing_skill_requires_force_version_or_explicit_reuse`,
    );
  }
}

async function bootstrapOpenAI(): Promise<BootstrapResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      provider: "openai",
      status: "skipped",
      reason: "missing_api_key",
    };
  }
  const headers = { Authorization: `Bearer ${apiKey}` };
  const listed = await responseJson(
    await providerFetch("https://api.openai.com/v1/skills?limit=100", {
      headers,
    }),
    "openai",
  );
  const matches = responseItems(listed).filter(
    (item) => item.name === SKILL_NAME,
  );
  if (matches.length > 1) {
    throw new Error("openai_skill_name_ambiguous");
  }
  const existing = matches[0];
  if (existing !== undefined) {
    const skillId = requiredString(existing, "id", "openai");
    if (process.env.BOOTSTRAP_LIVE_SKILLS_FORCE_VERSION === "1") {
      const versioned = await responseJson(
        await providerFetch(
          `https://api.openai.com/v1/skills/${encodeURIComponent(skillId)}/versions`,
          {
            method: "POST",
            headers,
            body: skillForm(),
          },
        ),
        "openai",
      );
      const version = optionalVersion(versioned);
      if (version === undefined) {
        throw new Error("openai_skill_response_missing_version");
      }
      return {
        provider: "openai",
        status: "versioned",
        skillId,
        version,
        provenance: "uploaded_current_fixture",
      };
    }
    assertExplicitExistingSkillPolicy("openai");
    const version = optionalVersion(existing);
    if (version === undefined) {
      throw new Error("openai_skill_response_missing_version");
    }
    return {
      provider: "openai",
      status: "reused",
      skillId,
      version,
      provenance: "existing_unverified",
    };
  }

  const created = await responseJson(
    await providerFetch("https://api.openai.com/v1/skills", {
      method: "POST",
      headers,
      body: skillForm(),
    }),
    "openai",
  );
  const version = optionalVersion(created);
  if (version === undefined) {
    throw new Error("openai_skill_response_missing_version");
  }
  return {
    provider: "openai",
    status: "created",
    skillId: requiredString(created, "id", "openai"),
    version,
    provenance: "uploaded_current_fixture",
  };
}

async function bootstrapAnthropic(): Promise<BootstrapResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      provider: "anthropic",
      status: "skipped",
      reason: "missing_api_key",
    };
  }
  const headers = {
    "x-api-key": apiKey,
    "anthropic-version": "2023-06-01",
    "anthropic-beta": "skills-2025-10-02",
  };
  const listed = await responseJson(
    await providerFetch(
      "https://api.anthropic.com/v1/skills?source=custom&limit=100",
      { headers },
    ),
    "anthropic",
  );
  const matches = responseItems(listed).filter(
    (item) => item.display_title === ANTHROPIC_DISPLAY_TITLE,
  );
  if (matches.length > 1) {
    throw new Error("anthropic_skill_title_ambiguous");
  }
  const existing = matches[0];
  if (existing !== undefined) {
    const skillId = requiredString(existing, "id", "anthropic");
    if (process.env.BOOTSTRAP_LIVE_SKILLS_FORCE_VERSION === "1") {
      const versioned = await responseJson(
        await providerFetch(
          `https://api.anthropic.com/v1/skills/${encodeURIComponent(skillId)}/versions`,
          {
            method: "POST",
            headers,
            body: skillForm(),
          },
        ),
        "anthropic",
      );
      const version = optionalVersion(versioned);
      if (version === undefined) {
        throw new Error("anthropic_skill_response_missing_version");
      }
      return {
        provider: "anthropic",
        status: "versioned",
        skillId,
        version,
        provenance: "uploaded_current_fixture",
      };
    }
    assertExplicitExistingSkillPolicy("anthropic");
    const version = optionalVersion(existing);
    if (version === undefined) {
      throw new Error("anthropic_skill_response_missing_version");
    }
    return {
      provider: "anthropic",
      status: "reused",
      skillId,
      version,
      provenance: "existing_unverified",
    };
  }

  const form = skillForm();
  form.append("display_title", ANTHROPIC_DISPLAY_TITLE);
  const created = await responseJson(
    await providerFetch("https://api.anthropic.com/v1/skills", {
      method: "POST",
      headers,
      body: form,
    }),
    "anthropic",
  );
  const version = optionalVersion(created);
  if (version === undefined) {
    throw new Error("anthropic_skill_response_missing_version");
  }
  return {
    provider: "anthropic",
    status: "created",
    skillId: requiredString(created, "id", "anthropic"),
    version,
    provenance: "uploaded_current_fixture",
  };
}

loadLocalEnvironment();

if (process.env.BOOTSTRAP_LIVE_SKILLS !== "1") {
  process.stdout.write(
    `${JSON.stringify({
      live: false,
      reason: "set_BOOTSTRAP_LIVE_SKILLS_to_1",
    })}\n`,
  );
} else {
  const providers = await Promise.allSettled([
    bootstrapOpenAI(),
    bootstrapAnthropic(),
  ]);
  const results: BootstrapResult[] = providers.map((result, index) => {
    const provider = index === 0 ? "openai" : "anthropic";
    if (result.status === "fulfilled") {
      return result.value;
    }
    return {
      provider,
      status: "failed",
      reason:
        result.reason instanceof Error
          ? result.reason.message
          : "unexpected_bootstrap_failure",
    };
  });
  process.stdout.write(
    `${JSON.stringify({
      live: true,
      fixtureSha256: fixtureSha256(),
      results,
    })}\n`,
  );
  if (
    results.some(({ status }) => status === "failed") ||
    results.every(({ status }) => status === "skipped")
  ) {
    process.exitCode = 1;
  }
}

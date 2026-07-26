import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const template = readFileSync(
  new URL("../template.yaml", import.meta.url),
  "utf8",
);
const samconfig = readFileSync(
  new URL("../samconfig.toml", import.meta.url),
  "utf8",
);

function numberFrom(pattern: RegExp, field: string): number {
  const matched = template.match(pattern)?.[1];
  if (!matched) {
    throw new Error(`Could not find ${field} in template.yaml.`);
  }
  return Number(matched);
}

describe("SAM timeout guardrails", () => {
  it("keeps room for Lambda fallback before API Gateway closes", () => {
    const modelTimeoutMs = numberFrom(
      /ModelTimeoutMs:[\s\S]*?Default:\s*(\d+)/,
      "ModelTimeoutMs.Default",
    );
    const modelTimeoutMaxMs = numberFrom(
      /ModelTimeoutMs:[\s\S]*?MaxValue:\s*(\d+)/,
      "ModelTimeoutMs.MaxValue",
    );
    const lambdaTimeoutMs =
      numberFrom(
        /TurnFunction:[\s\S]*?Properties:[\s\S]*?Timeout:\s*(\d+)/,
        "TurnFunction.Timeout",
      ) * 1_000;
    const integrationTimeoutMs = numberFrom(
      /TurnFunction:[\s\S]*?TimeoutInMillis:\s*"?(\d+)"?/,
      "Turn.TimeoutInMillis",
    );

    expect(modelTimeoutMs).toBeLessThanOrEqual(modelTimeoutMaxMs);
    expect(modelTimeoutMaxMs).toBeLessThanOrEqual(
      integrationTimeoutMs - 2_000,
    );
    expect(integrationTimeoutMs).toBeLessThanOrEqual(
      lambdaTimeoutMs - 1_000,
    );
    expect(samconfig).toContain(`ModelTimeoutMs=\\"${modelTimeoutMs}\\"`);
  });

  it("supports the reduced-quota account without losing the kill switch", () => {
    expect(template).toContain("ConfigureReservedConcurrency:");
    expect(template).toContain("Default: -1");
    expect(template).toContain("Ref: AWS::NoValue");
    expect(samconfig).toContain('ReservedConcurrency=\\"-1\\"');
    expect(samconfig).toContain('ThrottlingRateLimit=\\"1\\"');
    expect(samconfig).toContain('ThrottlingBurstLimit=\\"2\\"');
  });

  it("gives the Bedrock-free health probe room for a Lambda cold start", () => {
    const healthTimeoutMs = numberFrom(
      /Health:[\s\S]*?TimeoutInMillis:\s*"?(\d+)"?/,
      "Health.TimeoutInMillis",
    );
    const lambdaTimeoutMs =
      numberFrom(
        /TurnFunction:[\s\S]*?Properties:[\s\S]*?Timeout:\s*(\d+)/,
        "TurnFunction.Timeout",
      ) * 1_000;

    expect(healthTimeoutMs).toBe(9_000);
    expect(healthTimeoutMs).toBeLessThan(lambdaTimeoutMs);
  });
});

#!/usr/bin/env node

import { execFileSync } from "node:child_process";

function argument(name, fallback) {
  const index = process.argv.indexOf(name);
  const value = index >= 0 ? process.argv[index + 1] : fallback;
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

const profile = argument("--profile", "nhn-game");
const region = argument("--region", "ap-northeast-2");
const expectedAccount = argument("--account", "141840355276");

let rawIdentity;
try {
  rawIdentity = execFileSync(
    "aws",
    [
      "sts",
      "get-caller-identity",
      "--profile",
      profile,
      "--region",
      region,
      "--output",
      "json",
    ],
    {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
} catch {
  console.error(
    JSON.stringify({
      ok: false,
      code: "aws_profile_unavailable",
      message:
        "Run `aws configure sso --profile nhn-game` once if needed, then `aws sso login --profile nhn-game --use-device-code`.",
    }),
  );
  process.exit(1);
}
const identity = JSON.parse(rawIdentity);
if (identity.Account !== expectedAccount) {
  throw new Error(
    `Refusing AWS operations: profile ${profile} resolved to account ${identity.Account ?? "unknown"}, expected ${expectedAccount}.`,
  );
}

console.log(
  JSON.stringify({
    ok: true,
    profile,
    region,
    account: identity.Account,
  }),
);

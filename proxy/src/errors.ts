import type { TokenUsage } from "./types.js";

export class PublicError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "PublicError";
    this.status = status;
    this.code = code;
  }
}

export class ProviderOutputError extends PublicError {
  readonly usage: TokenUsage;

  constructor(message: string, usage: TokenUsage) {
    super(502, "invalid_model_output", message);
    this.name = "ProviderOutputError";
    this.usage = usage;
  }
}

export function errorCode(error: unknown): string {
  if (error instanceof PublicError) {
    return error.code;
  }
  if (
    error instanceof Error &&
    /^[A-Za-z0-9_.-]{1,64}$/.test(error.name)
  ) {
    return error.name;
  }
  return "provider_error";
}

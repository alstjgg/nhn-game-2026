export class ArenaError extends Error {
  readonly status: number;
  readonly code: string;
  readonly safeDetails?: Record<string, unknown>;

  constructor(
    status: number,
    code: string,
    message: string,
    safeDetails?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "ArenaError";
    this.status = status;
    this.code = code;
    if (safeDetails !== undefined) {
      this.safeDetails = safeDetails;
    }
  }
}

export function asArenaError(error: unknown): ArenaError {
  if (error instanceof ArenaError) {
    return error;
  }
  return new ArenaError(500, "internal_error", "Internal server error.");
}

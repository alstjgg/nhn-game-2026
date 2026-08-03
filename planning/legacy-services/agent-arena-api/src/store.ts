import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";

import { ArenaError } from "./errors.js";
import { createId } from "./identifiers.js";
import { ContextCipher, fingerprintSecret } from "./security.js";
import type {
  AgentSession,
  AgentTurnResult,
  ArenaRun,
  ArenaTurn,
  LoadoutSnapshot,
  ResolvedProviderLoadout,
  TraceEvent,
} from "./types.js";

type RunRow = {
  id: string;
  owner_id: string;
  model_json: string;
  harness_json: string;
  cards_version: string;
  status: ArenaRun["status"];
  idempotency_key_hash: string;
  request_hash: string;
  created_at: string;
};

type SessionRow = {
  id: string;
  run_id: string;
  owner_id: string;
  agent_id: string;
  party_index: number;
  generation: number;
  loadout_json: string;
  provider_loadout_ciphertext: string | null;
  context_ciphertext: string;
  estimated_active_tokens: number;
  last_measured_input_tokens: number | null;
  status: AgentSession["status"];
  created_at: string;
  updated_at: string;
};

type TurnRow = {
  id: string;
  run_id: string;
  owner_id: string;
  request_json: string;
  status: ArenaTurn["status"];
  idempotency_key_hash: string;
  request_hash: string;
  result_json: string;
  failure_reason: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
};

type EventRow = {
  turn_id: string;
  sequence: number;
  type: string;
  safe_data_json: string;
  created_at: string;
};

type OperationRow = {
  owner_id: string;
  scope: string;
  idempotency_key_hash: string;
  request_hash: string;
  status: IdempotentOperationStatus;
  response_json: string;
  created_at: string;
};

export type IdempotentOperationStatus =
  | "in_progress"
  | "completed"
  | "indeterminate";

export type IdempotentOperationRecord = {
  requestHash: string;
  status: IdempotentOperationStatus;
  response: Record<string, unknown>;
};

export type IdempotentOperationClaim = {
  claimed: boolean;
  operation: IdempotentOperationRecord;
};

export type SessionUpdate = {
  sessionId: string;
  history: unknown[];
  estimatedActiveTokens: number;
  lastMeasuredInputTokens: number | null;
};

export type TurnLifecycleTransition = {
  turn: ArenaTurn;
  event: TraceEvent;
};

export type CreateTurnWithEventResult = {
  turn: ArenaTurn;
  replayed: boolean;
  event: TraceEvent | null;
};

export interface ArenaRepository {
  createRun(
    run: ArenaRun,
    sessions: AgentSession[],
    idempotencyKey: string,
    requestHash: string,
  ): { run: ArenaRun; sessions: AgentSession[]; replayed: boolean };
  getRunByIdempotencyKey(
    ownerId: string,
    idempotencyKey: string,
  ): { run: ArenaRun; sessions: AgentSession[]; requestHash: string } | null;
  getRun(ownerId: string, runId: string): ArenaRun | null;
  getActiveSessions(ownerId: string, runId: string): AgentSession[];
  getActiveSession(
    ownerId: string,
    runId: string,
    agentId: string,
  ): AgentSession | null;
  updateLoadout(
    ownerId: string,
    runId: string,
    agentId: string,
    loadout: LoadoutSnapshot,
    providerLoadout: ResolvedProviderLoadout,
  ): AgentSession;
  createTurn(turn: ArenaTurn): { turn: ArenaTurn; replayed: boolean };
  createTurnWithEvent(
    turn: ArenaTurn,
    safeData: Record<string, unknown>,
  ): CreateTurnWithEventResult;
  getTurn(ownerId: string, turnId: string): ArenaTurn | null;
  getTurnByIdempotencyKey(
    ownerId: string,
    runId: string,
    idempotencyKey: string,
  ): { turn: ArenaTurn; requestHash: string } | null;
  markTurnRunning(ownerId: string, turnId: string): ArenaTurn;
  markTurnRunningWithEvent(
    ownerId: string,
    turnId: string,
    safeData: Record<string, unknown>,
  ): TurnLifecycleTransition;
  completeTurn(
    ownerId: string,
    turnId: string,
    results: AgentTurnResult[],
    updates: SessionUpdate[],
  ): ArenaTurn;
  completeTurnWithEvent(
    ownerId: string,
    turnId: string,
    results: AgentTurnResult[],
    updates: SessionUpdate[],
    safeData: Record<string, unknown>,
  ): TurnLifecycleTransition;
  failTurn(ownerId: string, turnId: string, reason: string): ArenaTurn;
  failTurnWithEvent(
    ownerId: string,
    turnId: string,
    reason: string,
    safeData: Record<string, unknown>,
  ): TurnLifecycleTransition;
  hasActiveTurn(ownerId: string, runId: string): boolean;
  updateSessionContext(
    ownerId: string,
    sessionId: string,
    history: unknown[],
    estimatedActiveTokens: number,
  ): AgentSession;
  clearSession(ownerId: string, runId: string, agentId: string): AgentSession;
  appendEvent(
    ownerId: string,
    turnId: string,
    type: string,
    safeData: Record<string, unknown>,
  ): TraceEvent;
  getEvents(
    ownerId: string,
    turnId: string,
    afterSequence: number,
  ): TraceEvent[];
  getIdempotentOperation(
    ownerId: string,
    scope: string,
    idempotencyKey: string,
  ): IdempotentOperationRecord | null;
  claimIdempotentOperation(
    ownerId: string,
    scope: string,
    idempotencyKey: string,
    requestHash: string,
  ): IdempotentOperationClaim;
  completeCompactOperation(
    ownerId: string,
    scope: string,
    idempotencyKey: string,
    requestHash: string,
    sessionId: string,
    history: unknown[],
    estimatedActiveTokens: number,
    response: Record<string, unknown>,
  ): {
    session: AgentSession;
    response: Record<string, unknown>;
    replayed: boolean;
  };
  clearSessionIdempotently(
    ownerId: string,
    runId: string,
    agentId: string,
    scope: string,
    idempotencyKey: string,
    requestHash: string,
    responseForSession: (session: AgentSession) => Record<string, unknown>,
  ): {
    session: AgentSession;
    response: Record<string, unknown>;
    replayed: boolean;
  };
  markIdempotentOperationIndeterminate(
    ownerId: string,
    scope: string,
    idempotencyKey: string,
    requestHash: string,
  ): void;
  recoverInterruptedOperations(): number;
  recoverInterruptedTurns(reason: string): number;
  recoverMissingTerminalEvents(): number;
}

export class ArenaStore implements ArenaRepository {
  readonly #db: DatabaseSync;
  readonly #cipher: ContextCipher;

  constructor(path: string, cipher: ContextCipher) {
    if (path !== ":memory:") {
      mkdirSync(dirname(path), { recursive: true });
    }
    this.#db = new DatabaseSync(path);
    this.#cipher = cipher;
    this.#db.exec("PRAGMA foreign_keys = ON");
    this.#db.exec("PRAGMA busy_timeout = 5000");
    if (path !== ":memory:") {
      this.#db.exec("PRAGMA journal_mode = WAL");
    }
    this.#migrate();
  }

  close(): void {
    this.#db.close();
  }

  createRun(
    run: ArenaRun,
    sessions: AgentSession[],
    idempotencyKey: string,
    requestHash: string,
  ): { run: ArenaRun; sessions: AgentSession[]; replayed: boolean } {
    return this.#transaction(() => {
      const keyHash = fingerprintSecret(idempotencyKey);
      const existing = this.#db
        .prepare(
          `SELECT * FROM runs
           WHERE owner_id = ? AND idempotency_key_hash = ?`,
        )
        .get(run.ownerId, keyHash) as RunRow | undefined;
      if (existing !== undefined) {
        if (existing.request_hash !== requestHash) {
          throw new ArenaError(
            409,
            "idempotency_conflict",
            "Idempotency key was already used with a different request.",
          );
        }
        return {
          run: this.#runFromRow(existing),
          sessions: this.getActiveSessions(run.ownerId, existing.id),
          replayed: true,
        };
      }
      this.#db
        .prepare(
          `INSERT INTO runs
           (id, owner_id, model_json, harness_json, cards_version, status,
            idempotency_key_hash, request_hash, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          run.id,
          run.ownerId,
          JSON.stringify(run.modelProfile),
          JSON.stringify(run.harness),
          run.cardsVersion,
          run.status,
          keyHash,
          requestHash,
          run.createdAt,
        );
      const insertSession = this.#db.prepare(
        `INSERT INTO sessions
         (id, run_id, owner_id, agent_id, party_index, generation, loadout_json,
          provider_loadout_ciphertext, context_ciphertext, estimated_active_tokens,
          last_measured_input_tokens, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      );
      for (const session of sessions) {
        insertSession.run(
          session.id,
          session.runId,
          session.ownerId,
          session.agentId,
          session.partyIndex,
          session.generation,
          JSON.stringify(session.loadout),
          this.#cipher.seal(session.providerLoadout),
          this.#cipher.seal(session.history),
          session.estimatedActiveTokens,
          session.lastMeasuredInputTokens,
          session.status,
          session.createdAt,
          session.updatedAt,
        );
      }
      return { run, sessions, replayed: false };
    });
  }

  getRun(ownerId: string, runId: string): ArenaRun | null {
    const row = this.#db
      .prepare("SELECT * FROM runs WHERE id = ? AND owner_id = ?")
      .get(runId, ownerId) as RunRow | undefined;
    return row === undefined ? null : this.#runFromRow(row);
  }

  getRunByIdempotencyKey(
    ownerId: string,
    idempotencyKey: string,
  ): { run: ArenaRun; sessions: AgentSession[]; requestHash: string } | null {
    const row = this.#db
      .prepare(
        `SELECT * FROM runs
         WHERE owner_id = ? AND idempotency_key_hash = ?`,
      )
      .get(
        ownerId,
        fingerprintSecret(idempotencyKey),
      ) as RunRow | undefined;
    if (row === undefined) {
      return null;
    }
    return {
      run: this.#runFromRow(row),
      sessions: this.getActiveSessions(ownerId, row.id),
      requestHash: row.request_hash,
    };
  }

  getActiveSessions(ownerId: string, runId: string): AgentSession[] {
    const rows = this.#db
      .prepare(
        `SELECT * FROM sessions
         WHERE run_id = ? AND owner_id = ? AND status = 'active'
         ORDER BY party_index ASC`,
      )
      .all(runId, ownerId) as unknown as SessionRow[];
    return rows.map((row) => this.#sessionFromRow(row));
  }

  getActiveSession(
    ownerId: string,
    runId: string,
    agentId: string,
  ): AgentSession | null {
    const row = this.#db
      .prepare(
        `SELECT * FROM sessions
         WHERE run_id = ? AND owner_id = ? AND agent_id = ? AND status = 'active'`,
      )
      .get(runId, ownerId, agentId) as SessionRow | undefined;
    return row === undefined ? null : this.#sessionFromRow(row);
  }

  updateLoadout(
    ownerId: string,
    runId: string,
    agentId: string,
    loadout: LoadoutSnapshot,
    providerLoadout: ResolvedProviderLoadout,
  ): AgentSession {
    const updatedAt = new Date().toISOString();
    const result = this.#db
      .prepare(
        `UPDATE sessions
         SET loadout_json = ?, provider_loadout_ciphertext = ?, updated_at = ?
         WHERE run_id = ? AND owner_id = ? AND agent_id = ? AND status = 'active'`,
      )
      .run(
        JSON.stringify(loadout),
        this.#cipher.seal(providerLoadout),
        updatedAt,
        runId,
        ownerId,
        agentId,
      );
    if (result.changes !== 1) {
      throw new ArenaError(404, "session_not_found", "Agent session not found.");
    }
    const session = this.getActiveSession(ownerId, runId, agentId);
    if (session === null) {
      throw new ArenaError(404, "session_not_found", "Agent session not found.");
    }
    return session;
  }

  createTurn(
    turn: ArenaTurn,
  ): { turn: ArenaTurn; replayed: boolean } {
    return this.#transaction(() => this.#createTurnWithinTransaction(turn));
  }

  createTurnWithEvent(
    turn: ArenaTurn,
    safeData: Record<string, unknown>,
  ): CreateTurnWithEventResult {
    if (turn.status !== "queued") {
      throw new ArenaError(
        400,
        "invalid_turn_state",
        "A newly created turn must be queued.",
      );
    }
    return this.#transaction(() => {
      const created = this.#createTurnWithinTransaction(turn);
      if (created.replayed) {
        return { ...created, event: null };
      }
      const event = this.#appendEventWithinTransaction(
        turn.ownerId,
        turn.id,
        "turn.queued",
        safeData,
        turn.createdAt,
      );
      return { ...created, event };
    });
  }

  getTurn(ownerId: string, turnId: string): ArenaTurn | null {
    const row = this.#db
      .prepare("SELECT * FROM turns WHERE id = ? AND owner_id = ?")
      .get(turnId, ownerId) as TurnRow | undefined;
    return row === undefined ? null : this.#turnFromRow(row);
  }

  getTurnByIdempotencyKey(
    ownerId: string,
    runId: string,
    idempotencyKey: string,
  ): { turn: ArenaTurn; requestHash: string } | null {
    const row = this.#db
      .prepare(
        `SELECT * FROM turns
         WHERE owner_id = ? AND run_id = ? AND idempotency_key_hash = ?`,
      )
      .get(
        ownerId,
        runId,
        fingerprintSecret(idempotencyKey),
      ) as TurnRow | undefined;
    return row === undefined
      ? null
      : {
          turn: this.#turnFromRow(row),
          requestHash: row.request_hash,
        };
  }

  markTurnRunning(ownerId: string, turnId: string): ArenaTurn {
    const startedAt = new Date().toISOString();
    const result = this.#db
      .prepare(
        `UPDATE turns SET status = 'running', started_at = ?
         WHERE id = ? AND owner_id = ? AND status = 'queued'`,
      )
      .run(startedAt, turnId, ownerId);
    if (result.changes !== 1) {
      throw new ArenaError(409, "turn_not_queued", "Turn is not queued.");
    }
    return this.#requiredTurn(ownerId, turnId);
  }

  markTurnRunningWithEvent(
    ownerId: string,
    turnId: string,
    safeData: Record<string, unknown>,
  ): TurnLifecycleTransition {
    return this.#transaction(() => {
      const startedAt = new Date().toISOString();
      const result = this.#db
        .prepare(
          `UPDATE turns SET status = 'running', started_at = ?
           WHERE id = ? AND owner_id = ? AND status = 'queued'`,
        )
        .run(startedAt, turnId, ownerId);
      if (result.changes !== 1) {
        throw new ArenaError(409, "turn_not_queued", "Turn is not queued.");
      }
      const event = this.#appendEventWithinTransaction(
        ownerId,
        turnId,
        "turn.started",
        safeData,
        startedAt,
      );
      return {
        turn: this.#requiredTurn(ownerId, turnId),
        event,
      };
    });
  }

  completeTurn(
    ownerId: string,
    turnId: string,
    results: AgentTurnResult[],
    updates: SessionUpdate[],
  ): ArenaTurn {
    return this.#transaction(() => {
      const updatedAt = new Date().toISOString();
      const updateSession = this.#db.prepare(
        `UPDATE sessions
         SET context_ciphertext = ?, estimated_active_tokens = ?,
             last_measured_input_tokens = ?, updated_at = ?
         WHERE id = ? AND owner_id = ? AND status = 'active'`,
      );
      for (const update of updates) {
        const result = updateSession.run(
          this.#cipher.seal(update.history),
          update.estimatedActiveTokens,
          update.lastMeasuredInputTokens,
          updatedAt,
          update.sessionId,
          ownerId,
        );
        if (result.changes !== 1) {
          throw new ArenaError(
            409,
            "session_changed",
            "Agent session changed while the turn was running.",
          );
        }
      }
      const completedAt = new Date().toISOString();
      this.#db
        .prepare(
          `UPDATE turns
           SET status = 'completed', result_json = ?, completed_at = ?
           WHERE id = ? AND owner_id = ? AND status = 'running'`,
        )
        .run(JSON.stringify(results), completedAt, turnId, ownerId);
      return this.#requiredTurn(ownerId, turnId);
    });
  }

  completeTurnWithEvent(
    ownerId: string,
    turnId: string,
    results: AgentTurnResult[],
    updates: SessionUpdate[],
    safeData: Record<string, unknown>,
  ): TurnLifecycleTransition {
    return this.#transaction(() => {
      const updatedAt = new Date().toISOString();
      const updateSession = this.#db.prepare(
        `UPDATE sessions
         SET context_ciphertext = ?, estimated_active_tokens = ?,
             last_measured_input_tokens = ?, updated_at = ?
         WHERE id = ? AND owner_id = ? AND status = 'active'`,
      );
      for (const update of updates) {
        const result = updateSession.run(
          this.#cipher.seal(update.history),
          update.estimatedActiveTokens,
          update.lastMeasuredInputTokens,
          updatedAt,
          update.sessionId,
          ownerId,
        );
        if (result.changes !== 1) {
          throw new ArenaError(
            409,
            "session_changed",
            "Agent session changed while the turn was running.",
          );
        }
      }
      const completedAt = new Date().toISOString();
      const completed = this.#db
        .prepare(
          `UPDATE turns
           SET status = 'completed', result_json = ?, completed_at = ?
           WHERE id = ? AND owner_id = ? AND status = 'running'`,
        )
        .run(JSON.stringify(results), completedAt, turnId, ownerId);
      if (completed.changes !== 1) {
        throw new ArenaError(409, "turn_not_running", "Turn is not running.");
      }
      const event = this.#appendEventWithinTransaction(
        ownerId,
        turnId,
        "turn.completed",
        safeData,
        completedAt,
      );
      return {
        turn: this.#requiredTurn(ownerId, turnId),
        event,
      };
    });
  }

  failTurn(ownerId: string, turnId: string, reason: string): ArenaTurn {
    const completedAt = new Date().toISOString();
    this.#db
      .prepare(
        `UPDATE turns SET status = 'failed', failure_reason = ?, completed_at = ?
         WHERE id = ? AND owner_id = ? AND status IN ('queued', 'running')`,
      )
      .run(reason, completedAt, turnId, ownerId);
    return this.#requiredTurn(ownerId, turnId);
  }

  failTurnWithEvent(
    ownerId: string,
    turnId: string,
    reason: string,
    safeData: Record<string, unknown>,
  ): TurnLifecycleTransition {
    return this.#transaction(() => {
      const completedAt = new Date().toISOString();
      const failed = this.#db
        .prepare(
          `UPDATE turns
           SET status = 'failed', failure_reason = ?, completed_at = ?
           WHERE id = ? AND owner_id = ? AND status IN ('queued', 'running')`,
        )
        .run(reason, completedAt, turnId, ownerId);
      if (failed.changes !== 1) {
        throw new ArenaError(
          409,
          "turn_not_active",
          "Turn is not queued or running.",
        );
      }
      const event = this.#appendEventWithinTransaction(
        ownerId,
        turnId,
        "turn.failed",
        safeData,
        completedAt,
      );
      return {
        turn: this.#requiredTurn(ownerId, turnId),
        event,
      };
    });
  }

  hasActiveTurn(ownerId: string, runId: string): boolean {
    return (
      this.#db
        .prepare(
          `SELECT 1 FROM turns
           WHERE owner_id = ? AND run_id = ? AND status IN ('queued', 'running')
           LIMIT 1`,
        )
        .get(ownerId, runId) !== undefined
    );
  }

  updateSessionContext(
    ownerId: string,
    sessionId: string,
    history: unknown[],
    estimatedActiveTokens: number,
  ): AgentSession {
    const updatedAt = new Date().toISOString();
    const result = this.#db
      .prepare(
        `UPDATE sessions
         SET context_ciphertext = ?, estimated_active_tokens = ?,
             last_measured_input_tokens = NULL, updated_at = ?
         WHERE id = ? AND owner_id = ? AND status = 'active'`,
      )
      .run(
        this.#cipher.seal(history),
        estimatedActiveTokens,
        updatedAt,
        sessionId,
        ownerId,
      );
    if (result.changes !== 1) {
      throw new ArenaError(404, "session_not_found", "Agent session not found.");
    }
    const row = this.#db
      .prepare("SELECT * FROM sessions WHERE id = ? AND owner_id = ?")
      .get(sessionId, ownerId) as SessionRow;
    return this.#sessionFromRow(row);
  }

  clearSession(
    ownerId: string,
    runId: string,
    agentId: string,
  ): AgentSession {
    return this.#transaction(() =>
      this.#clearSessionWithinTransaction(ownerId, runId, agentId),
    );
  }

  appendEvent(
    ownerId: string,
    turnId: string,
    type: string,
    safeData: Record<string, unknown>,
  ): TraceEvent {
    return this.#transaction(() =>
      this.#appendEventWithinTransaction(ownerId, turnId, type, safeData),
    );
  }

  getEvents(ownerId: string, turnId: string, afterSequence: number): TraceEvent[] {
    if (this.getTurn(ownerId, turnId) === null) {
      throw new ArenaError(404, "turn_not_found", "Turn not found.");
    }
    const rows = this.#db
      .prepare(
        `SELECT * FROM events
         WHERE turn_id = ? AND sequence > ? ORDER BY sequence ASC`,
      )
      .all(turnId, afterSequence) as unknown as EventRow[];
    return rows.map((row) => ({
      turnId: row.turn_id,
      sequence: row.sequence,
      type: row.type,
      safeData: JSON.parse(row.safe_data_json) as Record<string, unknown>,
      createdAt: row.created_at,
    }));
  }

  getIdempotentOperation(
    ownerId: string,
    scope: string,
    idempotencyKey: string,
  ): IdempotentOperationRecord | null {
    const row = this.#db
      .prepare(
        `SELECT * FROM idempotent_operations
         WHERE owner_id = ? AND scope = ? AND idempotency_key_hash = ?`,
      )
      .get(
        ownerId,
        scope,
        fingerprintSecret(idempotencyKey),
      ) as OperationRow | undefined;
    return row === undefined ? null : this.#operationFromRow(row);
  }

  claimIdempotentOperation(
    ownerId: string,
    scope: string,
    idempotencyKey: string,
    requestHash: string,
  ): IdempotentOperationClaim {
    return this.#transaction(() => {
      const existing = this.#getOperationRow(
        ownerId,
        scope,
        idempotencyKey,
      );
      if (existing !== undefined) {
        this.#assertOperationRequestHash(existing, requestHash);
        return {
          claimed: false,
          operation: this.#operationFromRow(existing),
        };
      }
      const createdAt = new Date().toISOString();
      this.#db
        .prepare(
          `INSERT INTO idempotent_operations
           (owner_id, scope, idempotency_key_hash, request_hash, status,
            response_json, created_at)
           VALUES (?, ?, ?, ?, 'in_progress', '{}', ?)`,
        )
        .run(
          ownerId,
          scope,
          fingerprintSecret(idempotencyKey),
          requestHash,
          createdAt,
        );
      return {
        claimed: true,
        operation: {
          requestHash,
          status: "in_progress",
          response: {},
        },
      };
    });
  }

  completeCompactOperation(
    ownerId: string,
    scope: string,
    idempotencyKey: string,
    requestHash: string,
    sessionId: string,
    history: unknown[],
    estimatedActiveTokens: number,
    response: Record<string, unknown>,
  ): {
    session: AgentSession;
    response: Record<string, unknown>;
    replayed: boolean;
  } {
    return this.#transaction(() => {
      const operation = this.#getOperationRow(
        ownerId,
        scope,
        idempotencyKey,
      );
      if (operation === undefined) {
        throw new ArenaError(
          409,
          "idempotency_not_claimed",
          "Idempotent operation must be claimed before completion.",
        );
      }
      this.#assertOperationRequestHash(operation, requestHash);
      if (operation.status === "completed") {
        return {
          session: this.#requiredSessionById(ownerId, sessionId),
          response: this.#operationFromRow(operation).response,
          replayed: true,
        };
      }
      if (operation.status === "indeterminate") {
        throw new ArenaError(
          409,
          "idempotency_indeterminate",
          "The prior operation was interrupted and cannot be retried safely.",
        );
      }

      const updatedAt = new Date().toISOString();
      const sessionResult = this.#db
        .prepare(
          `UPDATE sessions
           SET context_ciphertext = ?, estimated_active_tokens = ?,
               last_measured_input_tokens = NULL, updated_at = ?
           WHERE id = ? AND owner_id = ? AND status = 'active'`,
        )
        .run(
          this.#cipher.seal(history),
          estimatedActiveTokens,
          updatedAt,
          sessionId,
          ownerId,
        );
      if (sessionResult.changes !== 1) {
        throw new ArenaError(
          409,
          "session_changed",
          "Agent session changed while compaction was running.",
        );
      }
      const operationResult = this.#db
        .prepare(
          `UPDATE idempotent_operations
           SET status = 'completed', response_json = ?
           WHERE owner_id = ? AND scope = ? AND idempotency_key_hash = ?
             AND request_hash = ? AND status = 'in_progress'`,
        )
        .run(
          JSON.stringify(response),
          ownerId,
          scope,
          fingerprintSecret(idempotencyKey),
          requestHash,
        );
      if (operationResult.changes !== 1) {
        throw new ArenaError(
          409,
          "idempotency_state_changed",
          "Idempotent operation state changed during completion.",
        );
      }
      return {
        session: this.#requiredSessionById(ownerId, sessionId),
        response,
        replayed: false,
      };
    });
  }

  clearSessionIdempotently(
    ownerId: string,
    runId: string,
    agentId: string,
    scope: string,
    idempotencyKey: string,
    requestHash: string,
    responseForSession: (session: AgentSession) => Record<string, unknown>,
  ): {
    session: AgentSession;
    response: Record<string, unknown>;
    replayed: boolean;
  } {
    return this.#transaction(() => {
      const existing = this.#getOperationRow(
        ownerId,
        scope,
        idempotencyKey,
      );
      if (existing !== undefined) {
        this.#assertOperationRequestHash(existing, requestHash);
        const operation = this.#operationFromRow(existing);
        if (operation.status === "indeterminate") {
          throw new ArenaError(
            409,
            "idempotency_indeterminate",
            "The prior operation was interrupted and cannot be retried safely.",
          );
        }
        if (operation.status === "in_progress") {
          throw new ArenaError(
            409,
            "idempotency_in_progress",
            "The idempotent operation is still in progress.",
          );
        }
        return {
          session: this.#sessionForOperationResponse(
            ownerId,
            runId,
            agentId,
            operation.response,
          ),
          response: operation.response,
          replayed: true,
        };
      }

      const session = this.#clearSessionWithinTransaction(
        ownerId,
        runId,
        agentId,
      );
      const response = responseForSession(session);
      this.#db
        .prepare(
          `INSERT INTO idempotent_operations
           (owner_id, scope, idempotency_key_hash, request_hash, status,
            response_json, created_at)
           VALUES (?, ?, ?, ?, 'completed', ?, ?)`,
        )
        .run(
          ownerId,
          scope,
          fingerprintSecret(idempotencyKey),
          requestHash,
          JSON.stringify(response),
          new Date().toISOString(),
        );
      return { session, response, replayed: false };
    });
  }

  markIdempotentOperationIndeterminate(
    ownerId: string,
    scope: string,
    idempotencyKey: string,
    requestHash: string,
  ): void {
    this.#transaction(() => {
      const existing = this.#getOperationRow(
        ownerId,
        scope,
        idempotencyKey,
      );
      if (existing === undefined) {
        throw new ArenaError(
          409,
          "idempotency_not_claimed",
          "Idempotent operation must be claimed before it can be marked.",
        );
      }
      this.#assertOperationRequestHash(existing, requestHash);
      if (existing.status === "completed") {
        return;
      }
      if (existing.status === "indeterminate") {
        return;
      }
      const result = this.#db
        .prepare(
          `UPDATE idempotent_operations
           SET status = 'indeterminate'
           WHERE owner_id = ? AND scope = ? AND idempotency_key_hash = ?
             AND request_hash = ? AND status = 'in_progress'`,
        )
        .run(
          ownerId,
          scope,
          fingerprintSecret(idempotencyKey),
          requestHash,
        );
      if (result.changes !== 1) {
        throw new ArenaError(
          409,
          "idempotency_state_changed",
          "Idempotent operation state changed while it was being marked.",
        );
      }
    });
  }

  recoverInterruptedOperations(): number {
    const result = this.#db
      .prepare(
        `UPDATE idempotent_operations
         SET status = 'indeterminate'
         WHERE status = 'in_progress'`,
      )
      .run();
    return Number(result.changes);
  }

  recoverInterruptedTurns(reason: string): number {
    return this.#transaction(() => {
      const rows = this.#db
        .prepare(
          `SELECT id, owner_id FROM turns
           WHERE status IN ('queued', 'running')
           ORDER BY created_at ASC`,
        )
        .all() as unknown as Array<{ id: string; owner_id: string }>;
      const completedAt = new Date().toISOString();
      const update = this.#db.prepare(
        `UPDATE turns
         SET status = 'failed', failure_reason = ?, completed_at = ?
         WHERE id = ? AND owner_id = ? AND status IN ('queued', 'running')`,
      );
      const nextSequence = this.#db.prepare(
        `SELECT COALESCE(MAX(sequence), 0) + 1 AS next
         FROM events WHERE turn_id = ?`,
      );
      const insertEvent = this.#db.prepare(
        `INSERT INTO events
         (turn_id, sequence, type, safe_data_json, created_at)
         VALUES (?, ?, 'turn.failed', ?, ?)`,
      );
      for (const row of rows) {
        const result = update.run(reason, completedAt, row.id, row.owner_id);
        if (result.changes !== 1) {
          continue;
        }
        const sequence = nextSequence.get(row.id) as { next: number };
        insertEvent.run(
          row.id,
          sequence.next,
          JSON.stringify({ reason }),
          completedAt,
        );
      }
      return rows.length;
    });
  }

  recoverMissingTerminalEvents(): number {
    return this.#transaction(() => {
      const rows = this.#db
        .prepare(
          `SELECT id, owner_id, status, result_json, failure_reason
           FROM turns
           WHERE status IN ('completed', 'failed')
             AND NOT EXISTS (
               SELECT 1
               FROM events
               WHERE events.turn_id = turns.id
                 AND events.type = CASE turns.status
                   WHEN 'completed' THEN 'turn.completed'
                   ELSE 'turn.failed'
                 END
             )
           ORDER BY completed_at ASC, id ASC`,
        )
        .all() as unknown as Array<{
        id: string;
        owner_id: string;
        status: "completed" | "failed";
        result_json: string;
        failure_reason: string | null;
      }>;
      const nextSequence = this.#db.prepare(
        `SELECT COALESCE(MAX(sequence), 0) + 1 AS next
         FROM events WHERE turn_id = ?`,
      );
      const insertEvent = this.#db.prepare(
        `INSERT INTO events
         (turn_id, sequence, type, safe_data_json, created_at)
         VALUES (?, ?, ?, ?, ?)`,
      );
      const createdAt = new Date().toISOString();
      let recovered = 0;
      for (const row of rows) {
        const sequence = nextSequence.get(row.id) as { next: number };
        const type =
          row.status === "completed" ? "turn.completed" : "turn.failed";
        const safeData =
          row.status === "completed"
            ? {
                status: "completed",
                fallbackCount: this.#fallbackCount(row.result_json),
              }
            : {
                reason: this.#canonicalFailureReason(row.failure_reason),
              };
        insertEvent.run(
          row.id,
          sequence.next,
          type,
          JSON.stringify(safeData),
          createdAt,
        );
        recovered += 1;
      }
      return recovered;
    });
  }

  #fallbackCount(resultJson: string): number {
    try {
      const results = JSON.parse(resultJson) as unknown;
      if (!Array.isArray(results)) {
        return 0;
      }
      return results.filter(
        (result) =>
          typeof result === "object" &&
          result !== null &&
          "fallbackUsed" in result &&
          result.fallbackUsed === true,
      ).length;
    } catch {
      return 0;
    }
  }

  #canonicalFailureReason(reason: string | null): string {
    return reason !== null && /^[a-z0-9_]{1,64}$/.test(reason)
      ? reason
      : "turn_execution_failed";
  }

  #getOperationRow(
    ownerId: string,
    scope: string,
    idempotencyKey: string,
  ): OperationRow | undefined {
    return this.#db
      .prepare(
        `SELECT * FROM idempotent_operations
         WHERE owner_id = ? AND scope = ? AND idempotency_key_hash = ?`,
      )
      .get(
        ownerId,
        scope,
        fingerprintSecret(idempotencyKey),
      ) as OperationRow | undefined;
  }

  #assertOperationRequestHash(
    operation: OperationRow,
    requestHash: string,
  ): void {
    if (operation.request_hash !== requestHash) {
      throw new ArenaError(
        409,
        "idempotency_conflict",
        "Idempotency key was already used with a different request.",
      );
    }
  }

  #operationFromRow(row: OperationRow): IdempotentOperationRecord {
    return {
      requestHash: row.request_hash,
      status: row.status,
      response: JSON.parse(row.response_json) as Record<string, unknown>,
    };
  }

  #requiredSessionById(ownerId: string, sessionId: string): AgentSession {
    const row = this.#db
      .prepare("SELECT * FROM sessions WHERE id = ? AND owner_id = ?")
      .get(sessionId, ownerId) as SessionRow | undefined;
    if (row === undefined) {
      throw new ArenaError(404, "session_not_found", "Agent session not found.");
    }
    return this.#sessionFromRow(row);
  }

  #sessionForOperationResponse(
    ownerId: string,
    runId: string,
    agentId: string,
    response: Record<string, unknown>,
  ): AgentSession {
    if (typeof response.arenaSessionId === "string") {
      const row = this.#db
        .prepare(
          `SELECT * FROM sessions
           WHERE id = ? AND owner_id = ? AND run_id = ? AND agent_id = ?`,
        )
        .get(
          response.arenaSessionId,
          ownerId,
          runId,
          agentId,
        ) as SessionRow | undefined;
      if (row !== undefined) {
        return this.#sessionFromRow(row);
      }
    }
    const active = this.getActiveSession(ownerId, runId, agentId);
    if (active === null) {
      throw new ArenaError(404, "session_not_found", "Agent session not found.");
    }
    return active;
  }

  #clearSessionWithinTransaction(
    ownerId: string,
    runId: string,
    agentId: string,
  ): AgentSession {
    const current = this.getActiveSession(ownerId, runId, agentId);
    if (current === null) {
      throw new ArenaError(404, "session_not_found", "Agent session not found.");
    }
    const now = new Date().toISOString();
    const cleared = this.#db
      .prepare(
        `UPDATE sessions SET status = 'cleared', updated_at = ?
         WHERE id = ? AND owner_id = ? AND status = 'active'`,
      )
      .run(now, current.id, ownerId);
    if (cleared.changes !== 1) {
      throw new ArenaError(
        409,
        "session_changed",
        "Agent session changed while it was being cleared.",
      );
    }
    const next: AgentSession = {
      ...current,
      id: createId("as"),
      generation: current.generation + 1,
      history: [],
      estimatedActiveTokens: 0,
      lastMeasuredInputTokens: null,
      status: "active",
      createdAt: now,
      updatedAt: now,
    };
    this.#db
      .prepare(
        `INSERT INTO sessions
         (id, run_id, owner_id, agent_id, party_index, generation, loadout_json,
          provider_loadout_ciphertext, context_ciphertext, estimated_active_tokens,
          last_measured_input_tokens, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NULL, 'active', ?, ?)`,
      )
      .run(
        next.id,
        next.runId,
        next.ownerId,
        next.agentId,
        next.partyIndex,
        next.generation,
        JSON.stringify(next.loadout),
        this.#cipher.seal(next.providerLoadout),
        this.#cipher.seal([]),
        now,
        now,
      );
    return next;
  }

  #createTurnWithinTransaction(
    turn: ArenaTurn,
  ): { turn: ArenaTurn; replayed: boolean } {
    const existing = this.#db
      .prepare(
        `SELECT * FROM turns
         WHERE owner_id = ? AND run_id = ? AND idempotency_key_hash = ?`,
      )
      .get(
        turn.ownerId,
        turn.runId,
        fingerprintSecret(turn.idempotencyKey),
      ) as TurnRow | undefined;
    if (existing !== undefined) {
      if (existing.request_hash !== turn.requestHash) {
        throw new ArenaError(
          409,
          "idempotency_conflict",
          "Idempotency key was already used with a different request.",
        );
      }
      return { turn: this.#turnFromRow(existing), replayed: true };
    }
    const busy = this.#db
      .prepare(
        `SELECT id FROM turns
         WHERE owner_id = ? AND run_id = ? AND status IN ('queued', 'running')
         LIMIT 1`,
      )
      .get(turn.ownerId, turn.runId);
    if (busy !== undefined) {
      throw new ArenaError(
        409,
        "run_busy",
        "The run already has an active turn.",
      );
    }
    this.#db
      .prepare(
        `INSERT INTO turns
         (id, run_id, owner_id, request_json, status, idempotency_key_hash,
          request_hash, result_json, failure_reason, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, ?)`,
      )
      .run(
        turn.id,
        turn.runId,
        turn.ownerId,
        JSON.stringify(turn.request),
        turn.status,
        fingerprintSecret(turn.idempotencyKey),
        turn.requestHash,
        JSON.stringify(turn.results),
        turn.createdAt,
      );
    return { turn, replayed: false };
  }

  #appendEventWithinTransaction(
    ownerId: string,
    turnId: string,
    type: string,
    safeData: Record<string, unknown>,
    createdAt = new Date().toISOString(),
  ): TraceEvent {
    const turn = this.getTurn(ownerId, turnId);
    if (turn === null) {
      throw new ArenaError(404, "turn_not_found", "Turn not found.");
    }
    const sequenceRow = this.#db
      .prepare(
        "SELECT COALESCE(MAX(sequence), 0) + 1 AS next FROM events WHERE turn_id = ?",
      )
      .get(turnId) as { next: number };
    const event: TraceEvent = {
      turnId,
      sequence: sequenceRow.next,
      type,
      safeData,
      createdAt,
    };
    this.#db
      .prepare(
        `INSERT INTO events
         (turn_id, sequence, type, safe_data_json, created_at)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .run(
        event.turnId,
        event.sequence,
        event.type,
        JSON.stringify(event.safeData),
        event.createdAt,
      );
    return event;
  }

  #requiredTurn(ownerId: string, turnId: string): ArenaTurn {
    const turn = this.getTurn(ownerId, turnId);
    if (turn === null) {
      throw new ArenaError(404, "turn_not_found", "Turn not found.");
    }
    return turn;
  }

  #runFromRow(row: RunRow): ArenaRun {
    return {
      id: row.id,
      ownerId: row.owner_id,
      modelProfile: JSON.parse(row.model_json) as ArenaRun["modelProfile"],
      harness: JSON.parse(row.harness_json) as ArenaRun["harness"],
      cardsVersion: row.cards_version,
      status: row.status,
      createdAt: row.created_at,
    };
  }

  #sessionFromRow(row: SessionRow): AgentSession {
    return {
      id: row.id,
      runId: row.run_id,
      ownerId: row.owner_id,
      agentId: row.agent_id,
      partyIndex: row.party_index,
      generation: row.generation,
      loadout: JSON.parse(row.loadout_json) as LoadoutSnapshot,
      providerLoadout:
        row.provider_loadout_ciphertext === null
          ? null
          : this.#cipher.open<ResolvedProviderLoadout>(
              row.provider_loadout_ciphertext,
            ),
      history: this.#cipher.open<unknown[]>(row.context_ciphertext),
      estimatedActiveTokens: row.estimated_active_tokens,
      lastMeasuredInputTokens: row.last_measured_input_tokens,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  #turnFromRow(row: TurnRow): ArenaTurn {
    return {
      id: row.id,
      runId: row.run_id,
      ownerId: row.owner_id,
      request: JSON.parse(row.request_json) as ArenaTurn["request"],
      status: row.status,
      idempotencyKey: row.idempotency_key_hash,
      requestHash: row.request_hash,
      results: JSON.parse(row.result_json) as AgentTurnResult[],
      ...(row.failure_reason === null
        ? {}
        : { failureReason: row.failure_reason }),
      createdAt: row.created_at,
      ...(row.started_at === null ? {} : { startedAt: row.started_at }),
      ...(row.completed_at === null ? {} : { completedAt: row.completed_at }),
    };
  }

  #transaction<T>(operation: () => T): T {
    this.#db.exec("BEGIN IMMEDIATE");
    try {
      const result = operation();
      this.#db.exec("COMMIT");
      return result;
    } catch (error) {
      this.#db.exec("ROLLBACK");
      throw error;
    }
  }

  #migrate(): void {
    this.#db.exec(`
      CREATE TABLE IF NOT EXISTS runs (
        id TEXT PRIMARY KEY,
        owner_id TEXT NOT NULL,
        model_json TEXT NOT NULL,
        harness_json TEXT NOT NULL,
        cards_version TEXT NOT NULL,
        status TEXT NOT NULL,
        idempotency_key_hash TEXT NOT NULL,
        request_hash TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS runs_owner_idx ON runs(owner_id, id);
      CREATE UNIQUE INDEX IF NOT EXISTS runs_idempotency_idx
        ON runs(owner_id, idempotency_key_hash);

      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        run_id TEXT NOT NULL REFERENCES runs(id),
        owner_id TEXT NOT NULL,
        agent_id TEXT NOT NULL,
        party_index INTEGER NOT NULL,
        generation INTEGER NOT NULL,
        loadout_json TEXT NOT NULL,
        provider_loadout_ciphertext TEXT NOT NULL,
        context_ciphertext TEXT NOT NULL,
        estimated_active_tokens INTEGER NOT NULL,
        last_measured_input_tokens INTEGER,
        status TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        UNIQUE(run_id, agent_id, generation)
      );
      CREATE UNIQUE INDEX IF NOT EXISTS one_active_agent_session
        ON sessions(run_id, agent_id) WHERE status = 'active';

      CREATE TABLE IF NOT EXISTS turns (
        id TEXT PRIMARY KEY,
        run_id TEXT NOT NULL REFERENCES runs(id),
        owner_id TEXT NOT NULL,
        request_json TEXT NOT NULL,
        status TEXT NOT NULL,
        idempotency_key_hash TEXT NOT NULL,
        request_hash TEXT NOT NULL,
        result_json TEXT NOT NULL,
        failure_reason TEXT,
        created_at TEXT NOT NULL,
        started_at TEXT,
        completed_at TEXT,
        UNIQUE(owner_id, run_id, idempotency_key_hash)
      );
      CREATE INDEX IF NOT EXISTS turns_owner_idx ON turns(owner_id, id);

      CREATE TABLE IF NOT EXISTS events (
        turn_id TEXT NOT NULL REFERENCES turns(id) ON DELETE CASCADE,
        sequence INTEGER NOT NULL,
        type TEXT NOT NULL,
        safe_data_json TEXT NOT NULL,
        created_at TEXT NOT NULL,
        PRIMARY KEY(turn_id, sequence)
      );

      CREATE TABLE IF NOT EXISTS idempotent_operations (
        owner_id TEXT NOT NULL,
        scope TEXT NOT NULL,
        idempotency_key_hash TEXT NOT NULL,
        request_hash TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'completed'
          CHECK(status IN ('in_progress', 'completed', 'indeterminate')),
        response_json TEXT NOT NULL,
        created_at TEXT NOT NULL,
        PRIMARY KEY(owner_id, scope, idempotency_key_hash)
      );
    `);
    const sessionColumns = this.#db
      .prepare("PRAGMA table_info(sessions)")
      .all() as unknown as Array<{ name: string }>;
    if (
      !sessionColumns.some(
        ({ name }) => name === "provider_loadout_ciphertext",
      )
    ) {
      this.#db.exec(
        "ALTER TABLE sessions ADD COLUMN provider_loadout_ciphertext TEXT",
      );
    }
    const operationColumns = this.#db
      .prepare("PRAGMA table_info(idempotent_operations)")
      .all() as unknown as Array<{ name: string }>;
    if (!operationColumns.some(({ name }) => name === "status")) {
      this.#db.exec(
        `ALTER TABLE idempotent_operations
         ADD COLUMN status TEXT NOT NULL DEFAULT 'completed'
         CHECK(status IN ('in_progress', 'completed', 'indeterminate'))`,
      );
    }
    this.#db.exec(
      `UPDATE idempotent_operations
       SET status = 'completed'
       WHERE status IS NULL OR status NOT IN
         ('in_progress', 'completed', 'indeterminate')`,
    );
  }
}

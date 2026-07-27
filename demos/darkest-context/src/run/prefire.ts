// u13 — the prefire slot (PRD §2.4, latency cover for §2.1).
//
// In live mode the walk is dead time the player watches, so the engine may send
// the first decision request the moment a walk toward a combat tile starts. The
// hook is only worth having if a prefire nobody wants any more costs nothing:
// exactly one request may be in flight, taking the slot for another tile (or
// discarding it outright) drops the previous answer, and a dropped answer never
// reaches the run — not when it arrives late, not when it rejects (INV-7).

import type { AIAdapter } from '../ai/adapter.ts';
import type { AgentDecision, DecideRequest } from '../ai/contract.ts';
import type { Tile } from '../data/schema.ts';
import type { PrefiredAnswer } from './types.ts';

/** Call accounting — what the slot did, for tests and for the debug overlay. */
export interface PrefireStats {
  /** Requests actually handed to the adapter. */
  readonly issued: number;
  /** Answers a tile took delivery of. */
  readonly claimed: number;
  /** Answers dropped because the slot was taken over or cleared. */
  readonly discarded: number;
}

export interface PrefireSlot {
  /** The tile the in-flight request belongs to, or `null` when the slot is empty. */
  readonly pendingTileId: string | null;
  readonly stats: PrefireStats;
  /** Sends the first request for `tile` early. Re-issuing the same tile reuses the call. */
  issue(tile: Tile): void;
  /** Takes delivery for `tileId`; resolves `null` if that tile was not the one prefired for. */
  claim(tileId: string): PrefiredAnswer;
  /** Drops whatever is in flight. Harmless when the slot is already empty. */
  discard(): void;
}

export interface PrefireSlotOptions {
  adapter: AIAdapter;
  /** Builds the tile's opening request, or returns `null` to decline prefiring it. */
  buildRequest(tile: Tile): DecideRequest | null;
}

export function createPrefireSlot(options: PrefireSlotOptions): PrefireSlot {
  let pendingTileId: string | null = null;
  let pending: PrefiredAnswer | null = null;
  let issued = 0;
  let claimed = 0;
  let discarded = 0;

  const drop = (): void => {
    if (pending === null) return;
    // The in-flight promise already absorbs its own rejection (see `issue`), so
    // letting go of the reference here cannot leave an unhandled rejection.
    pending = null;
    pendingTileId = null;
    discarded++;
  };

  return Object.freeze({
    get pendingTileId(): string | null {
      return pendingTileId;
    },
    get stats(): PrefireStats {
      return Object.freeze({ issued, claimed, discarded });
    },

    issue(tile: Tile): void {
      if (pendingTileId === tile.id) return;
      drop();
      const request = options.buildRequest(tile);
      if (request === null) return;
      issued++;
      pendingTileId = tile.id;
      // Degrade silently (INV-7): a failed prefire is simply no prefire.
      pending = options.adapter.decide(request).then(
        (answer) => answer,
        () => null,
      );
    },

    claim(tileId: string): PrefiredAnswer {
      if (pending === null || pendingTileId !== tileId) return Promise.resolve(null);
      const answer: Promise<AgentDecision | null> = pending;
      pending = null;
      pendingTileId = null;
      claimed++;
      return answer;
    },

    discard: drop,
  });
}

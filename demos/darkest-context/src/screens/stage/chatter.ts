// u14 — walk chatter, chosen deterministically by TILE INDEX (PRD §2.4).
//
// INV-6 puts chatter on the "never random" list next to damage and rewards: the
// same tile of the same run order always plays the same exchanges, on every load,
// under every seed. So the picker takes ONE input — how many walks have happened
// so far — and derives everything else from it with an integer mix. No Rng is
// threaded in on purpose: an Rng would make the choice seed-dependent, and two
// independent runs would then disagree about tile 3.

import type { ChatterTuning } from '../../data/schema.ts';

/** One authored exchange of `data/decisions.json`'s chatter pool. */
export interface ChatterLine {
  readonly unitId: string;
  readonly text: string;
}

export interface ChatterExchange {
  readonly id: string;
  readonly lines: readonly ChatterLine[];
}

/** What one walk played — the shape the shell logs and the view renders. */
export interface ChatterPlay {
  /** 0 for the first walk of a run, 1 for the second, … */
  readonly tileIndex: number;
  readonly exchanges: readonly ChatterExchange[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isText(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

function readLine(value: unknown): ChatterLine | null {
  if (!isRecord(value)) return null;
  if (!isText(value.unitId) || !isText(value.text)) return null;
  return { unitId: value.unitId, text: value.text };
}

/**
 * Shape-checks the authored pool. A malformed row is simply not in the pool —
 * the same silent-degradation rule every other pool reader follows (INV-7).
 */
export function loadChatterPool(input: unknown): ChatterExchange[] {
  if (!Array.isArray(input)) return [];
  const pool: ChatterExchange[] = [];
  for (const raw of input) {
    if (!isRecord(raw) || !isText(raw.id) || !Array.isArray(raw.lines)) continue;
    const lines: ChatterLine[] = [];
    for (const rawLine of raw.lines) {
      const line = readLine(rawLine);
      if (line !== null) lines.push(line);
    }
    if (lines.length > 0) pool.push({ id: raw.id, lines });
  }
  return pool;
}

/**
 * An integer avalanche (mulberry32's mixing step, without its state). Pure: the
 * same input is the same output forever, which is exactly what "deterministic by
 * tile index" has to mean across two page loads.
 */
function mix(value: number, salt: number): number {
  let x = (value + salt) | 0;
  x = Math.imul(x ^ (x >>> 15), 0x2c1b3c6d);
  x = Math.imul(x ^ (x >>> 12), 0x297a2d39);
  return (x ^ (x >>> 15)) >>> 0;
}

/**
 * The 2–3 exchanges walk `tileIndex` plays. Count and starting offset are both
 * derived from the index, and the picks step forward through the pool, so the
 * exchanges of one walk are always distinct.
 *
 * @throws RangeError if the authored bounds cannot be honoured by this pool.
 */
export function pickChatter(
  pool: readonly ChatterExchange[],
  tuning: ChatterTuning,
  tileIndex: number,
): ChatterPlay {
  if (!Number.isInteger(tileIndex) || tileIndex < 0) {
    throw new RangeError(`tileIndex must be a non-negative integer, got ${String(tileIndex)}`);
  }
  const { minPerWalk, maxPerWalk } = tuning;
  if (!Number.isInteger(minPerWalk) || !Number.isInteger(maxPerWalk) || minPerWalk < 1) {
    throw new RangeError(`chatter bounds must be integers ≥ 1, got ${minPerWalk}/${maxPerWalk}`);
  }
  if (maxPerWalk < minPerWalk) {
    throw new RangeError(`chatter maxPerWalk (${maxPerWalk}) is below minPerWalk (${minPerWalk})`);
  }
  if (pool.length < maxPerWalk) {
    throw new RangeError(
      `the chatter pool holds ${pool.length} exchange(s) — too few for ${maxPerWalk} per walk`,
    );
  }

  const spread = maxPerWalk - minPerWalk + 1;
  const count = minPerWalk + (mix(tileIndex, 0x51ed270b) % spread);
  const start = mix(tileIndex, 0x9e3779b9) % pool.length;

  const exchanges: ChatterExchange[] = [];
  for (let step = 0; step < count; step += 1) {
    const exchange = pool[(start + step) % pool.length];
    if (exchange !== undefined) exchanges.push(exchange);
  }
  return { tileIndex, exchanges };
}

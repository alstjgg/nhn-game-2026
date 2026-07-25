// The single tie-break seam (PRD §2.2).
//
// Every numeric tie in this demo — target selection, execution order, the
// council's deciding vote — resolves here. Two policies, chosen at boot:
//
//   index  — lowest array index in the owning data/*.json file. The default under
//            automated gates (vitest/Playwright) and in stub mode: idempotent, no
//            entropy, no flake.
//   random — a seeded Rng, injected. The live default, so a tie is genuinely a tie
//            instead of manufacturing "가렛 always gets hit first" patterns.
//
// Callers never reach for randomness themselves; they pass a ctx and get a winner.
import type { Rng } from './rng.ts';

export type TieBreakPolicy = 'index' | 'random';

/** The policy automated gates and stub mode run on. */
export const DEFAULT_TIEBREAK_POLICY: TieBreakPolicy = 'index';

/** A tied option plus its position in the data file that owns it. */
export interface TieCandidate<T> {
  readonly value: T;
  readonly index: number;
}

export interface TieBreakContext {
  readonly policy: TieBreakPolicy;
  /** Required by (and only by) the `random` policy. */
  readonly rng?: Rng;
  /** Debug label only — never affects the outcome or the draw count. */
  readonly reason?: string;
}

function requireRng(rng: Rng | undefined): Rng {
  if (!rng) {
    throw new TypeError("tieBreak: policy 'random' requires ctx.rng — inject a seeded Rng");
  }
  return rng;
}

function assertResolvable<T>(candidates: readonly TieCandidate<T>[]): void {
  if (candidates.length === 0) {
    throw new RangeError('tieBreak: no candidates to resolve');
  }
  for (const candidate of candidates) {
    if (!Number.isInteger(candidate.index) || candidate.index < 0) {
      throw new RangeError(
        `tieBreak: candidate index must be a non-negative integer, got ${candidate.index}`,
      );
    }
  }
}

/**
 * Resolves a tie. Pure: the caller's array is never reordered or mutated, and the
 * outcome depends on the candidate SET, not on the order the caller assembled it.
 *
 * @throws TypeError  on a malformed ctx (unknown policy, `random` without an rng).
 * @throws RangeError on an empty candidate list or a non-integer / negative index.
 */
export function tieBreak<T>(candidates: readonly TieCandidate<T>[], ctx: TieBreakContext): T {
  const policy = ctx.policy;
  if (policy !== 'index' && policy !== 'random') {
    throw new TypeError(`tieBreak: unknown policy ${JSON.stringify(policy)}`);
  }
  const rng = policy === 'index' ? null : requireRng(ctx.rng);

  assertResolvable(candidates);
  if (candidates.length === 1) {
    return candidates[0].value;
  }

  if (rng === null) {
    let winner = candidates[0];
    for (const candidate of candidates) {
      if (candidate.index < winner.index) winner = candidate;
    }
    return winner.value;
  }

  const byIndex = [...candidates].sort((a, b) => a.index - b.index);
  return byIndex[rng.nextInt(byIndex.length)].value;
}

/**
 * Builds candidates that carry their source position, so a filtered subset still
 * tie-breaks on the data-file index. `offset` lets one index space span two arrays
 * (e.g. heroes ⧺ that encounter's enemy roster).
 */
export function toCandidates<T>(
  source: readonly T[],
  predicate: (value: T, index: number) => boolean,
  offset = 0,
): TieCandidate<T>[] {
  const candidates: TieCandidate<T>[] = [];
  source.forEach((value, index) => {
    if (predicate(value, index)) candidates.push({ value, index: index + offset });
  });
  return candidates;
}

/** Binds a ctx once at boot so game code never re-decides the policy per call. */
export function createTieBreaker(
  ctx: TieBreakContext,
): <T>(candidates: readonly TieCandidate<T>[]) => T {
  return <T>(candidates: readonly TieCandidate<T>[]): T => tieBreak(candidates, ctx);
}

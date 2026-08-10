/**
 * The ports the live driver is built on — PRD decision 15: every cross-module
 * dependency arrives by injection, and every one of them is described here
 * **structurally** so a fixture stand-in and the real module are interchangeable
 * without either side importing the other.
 *
 * Two of the three ports are e0's frozen surfaces widened, not replaced:
 *
 * - `EnginePort` **extends** `Engine`. e3's beat driver is richer than
 *   contract-engine-composer §2 (`current` · `submitStance` · `applyBeatEffects`
 *   · `advance`), and the run's three ingest points (`submitStance` ·
 *   `applyNarration` · `applyReport`) each take `T | null` — `null` **is** the
 *   fallback path. Recovery is the engine's, never the driver's: substituting a
 *   gate's `default_stance` needs a field `gateView()` deliberately does not
 *   expose (spec-engine §5).
 * - `ComposerPort` / `TransportPort` are e0's `Composer` and e6's `Transport`
 *   unchanged, aliased so the driver names one vocabulary.
 *
 * Types only — this file emits no runtime value.
 */

import type { Engine } from '../engine/index.ts'
import type { Composer } from '../composer/index.ts'
import type { Transport } from '../transport/index.ts'
import type {
  Block,
  JudgmentResponse,
  NarrationResponse,
  ReporterResponse,
} from '../shared/contracts.ts'
import type { FeedLine, MembraneOp, Sentence, ViewEvent } from '../shared/view-driver.ts'
import type { DriverDeps } from './index.ts'

/** Where the run is, as the driver reads it off the engine each beat (e3's `BeatCursor`). */
export type BeatCursor = {
  index: number
  clock: string
  kind: 'script' | 'gate'
  /** `null` before the first gate — that beat is in no round (spec-engine decision 10). */
  roundIndex: number | null
  /** True on the beat that owes Call 3. */
  isRoundLast: boolean
}

/** Call 3's minted output — what the `report` ViewEvent carries. */
export type ReportSentences = { facts: Sentence[]; report_body: Sentence[] }

/**
 * The engine, as the driver drives it. Everything beyond `Engine`'s four view
 * getters is the beat chain e3 landed, plus the three ingest points.
 */
export interface EnginePort extends Engine {
  current(): BeatCursor
  /**
   * `null` ⇒ the engine substitutes this gate's authored `default_stance`.
   * Returns the stance it resolved, in the author's words (U5.2b `judged`).
   */
  submitStance(response: JudgmentResponse | null): { stance_id: string; desc: string } | null
  /**
   * This gate takes its authored `default_stance` with NO Call 1 made, because
   * the player handed the agent nothing. Same return as `submitStance`.
   *
   * On the port because the driver is the only tier that can know it: the
   * membrane's deployed set is a client fact, and the engine cannot see it.
   * Distinct from `submitStance(null)` so the run record can tell a call that
   * failed from one that was never owed.
   */
  submitBaseline(): { stance_id: string; desc: string } | null
  applyBeatEffects(): void
  /** `null` ⇒ no `n`/`q` line is minted for this beat. */
  applyNarration(response: NarrationResponse | null): void
  /** `null` ⇒ facts come from the objective log and the body is the substitute. */
  applyReport(response: ReporterResponse | null): ReportSentences
  /** Moves to the next beat. `false` when the run is over. */
  advance(): boolean
}

export type ComposerPort = Composer
export type TransportPort = Transport

/**
 * Optional (decision 3): absent ⇒ the driver emits no `score`.
 *
 * The row type is the §5.2 `score` event's, and has to be: this port exists to
 * fill that event and nothing else, so a value it could return and the seam
 * could not carry would be a scorer nobody can wire. That is what it WAS — the
 * port said `value: number` while `contract-run-artifacts`' record said
 * `string | number` of the same field, and `score.json` authors outcomes that
 * are words. §5.2 amendment g settles it on the record's side;
 * `tools/tests/run-record.mjs` keeps the two from drifting apart again.
 *
 * Amendment h added the other half of every row: what the UNTOUCHED day scored
 * on the same axis. The tally is a COMPARISON sheet — its own subtitle reads
 * 기준선 대비 — and the baseline lives in the pack, which inv 12 lets no view
 * surface read. So it crosses the seam or it does not arrive at all.
 */
export type ScorerPort = {
  score(): {
    total: number
    baseline_total: number
    rows: { label: string; value: string | number; baseline: string | number | null }[]
  }
}

/** What the composer resolves `BLOCKS` against — contract-engine-composer §3. */
export type BlockStore = { get(id: string): Block | undefined }

/**
 * The driver's own store (decision 8). Two tiers: every **emitted** feed line
 * and report sentence is *seen*; only what the player mined is *mined*, and
 * `get` reads the mined tier alone — so deploying an unmined id cannot happen.
 */
export interface MutableBlockStore extends BlockStore {
  /** Records an emitted feed line. A line with no `sentence_id` is ignored (§8-9). */
  absorbLine(line: FeedLine): void
  absorbSentences(report: ReportSentences): void
  /** `false` when the id was never seen — an unminable or unknown sentence. */
  mine(id: string): boolean
  has(id: string): boolean
}

/** Every `submit` answers; none of them throws (decision 10). */
export type OpAck = { ok: true } | { ok: false; reason: string }

export type ViewListener = (event: ViewEvent) => void

/**
 * e0's `DriverDeps`, widened. An intersection rather than a redeclaration, so
 * `LiveDriverDeps` provably extends the frozen shape.
 */
export type LiveDriverDeps = DriverDeps & {
  engine: EnginePort
  composer: ComposerPort
  transport: TransportPort
  /** The store the composer was constructed with — pass the same instance. */
  blocks?: MutableBlockStore
  scorer?: ScorerPort
  /** The run number `run_end` carries. Defaults to 1. */
  run?: number
}

export interface LiveDriver {
  subscribe(fn: ViewListener): () => void
  submit(op: MembraneOp): OpAck
  /** Drive one beat. `false` once the run is over. */
  step(): Promise<boolean>
  blocks(): BlockStore
  /** Block ids currently in slots, in slot order — what `slot`/`unslot` move. */
  slottedIds(): string[]
}

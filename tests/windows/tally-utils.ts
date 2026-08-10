// Test-only helpers for the u7 TALLY suite.
//
// NOT product code and NOT collected by vitest (`tests/**/*.test.ts` only).
// Mirrors the u3/u6 precedent (`tests/shell/shell-utils.ts`): sources are read
// off disk and scanned with a deliberately regex-level parser — these are lint
// suites over hand-written modules, not a compiler.
//
// vitest runs `environment: 'node'` (vitest.config.ts), so nothing here touches
// a document. The DOM half of u7 lives in `e2e/run-loop.spec.ts`.
import path from 'node:path'
import type { ViewEvent } from '../../src/shared/view-driver.ts'
import type { FixtureDriver } from '../../src/client/driver/fixture-driver.ts'
import type { FixtureRun } from '../../src/client/driver/fixtures/types.ts'
import { CLIENT, exists, importable, read, rel, stripComments } from '../shell/shell-utils.ts'

/* ── the three modules this unit owns (u7 design §Contracts) ─────────────── */

export const RUN_STATE_TS = path.join(CLIENT, 'shell/run-state.ts')
export const SCORE_TALLY_TS = path.join(CLIENT, 'components/score-tally.ts')
export const AGENT_FILE_TS = path.join(CLIENT, 'windows/agent-file.ts')

/** The three owned modules, in the order the design lists them. */
export const UNIT_FILES = [RUN_STATE_TS, SCORE_TALLY_TS, AGENT_FILE_TS] as const

/** The run-loop facade + its fixture (u7 design D2). */
export const RUN_LOOP_TS = path.join(CLIENT, 'driver/run-loop.ts')
export const RUN_LOOP_FIXTURE_TS = path.join(CLIENT, 'driver/fixtures/run-loop.ts')

export interface Source {
  readonly file: string
  readonly text: string
}

/** The unit's own sources, comment-stripped. */
export function unitSources(): Source[] {
  return UNIT_FILES.filter((f) => exists(f)).map((f) => ({ file: rel(f), text: stripComments(read(f)) }))
}

/** The files the scan expects and did not find — empty once u7 has built. */
export function missingUnitFiles(): string[] {
  return UNIT_FILES.filter((f) => !exists(f)).map(rel)
}

/* ── the exported surface u7 declares (design §Contracts) ────────────────── */

export type RunPhase = 'build' | 'run' | 'report' | 'tally'

export interface MetaState {
  run: number
  runsLeft: number
  carried: string[]
  archive: { run: number; label: string }[]
}

export interface ScoreState {
  total: number
  rows: { label: string; value: string | number; baseline: string | number | null }[]
}

export interface RunState {
  phase: RunPhase
  meta: MetaState
  score: ScoreState | null
  /** The round of the last `report` seen since this run's `meta`, or `null`. */
  report: number | null
}

export interface RunStore {
  get(): RunState
  subscribe(fn: (s: RunState) => void): () => void
}

export interface RunStateModule {
  META_KEY: string
  initialRunState(): RunState
  reduce(state: RunState, event: ViewEvent): RunState
  hasFiledReport(state: RunState): boolean
  createRunState(driver: FixtureDriver, options?: { storage?: Storage }): RunStore
  getRunState(): RunStore | null
}

export interface Pace {
  OPEN_DELAY: number
  LEAD: number
  ROW_STEP: number
  VERDICT_AFTER: number
  COUNT_MS: number
  TOTAL_MS: number
  /** The ceiling of the tally's hold — the wait is long, never endless. */
  HOLD_CEIL: number
}

export type SettleRelease = 'hold' | 'filed' | 'lapsed'

export interface ScoreTallyModule {
  PACE: Pace
  settleMs(rowCount: number): number
  /** x4 — how long the record's CLOSING line has to count, given its cadence. */
  countMs(rowCount: number): number
  countUpAt(to: number, k: number): number
  /** x4 — one axis as a line of the record; the unit rides a number only. */
  lineOf(row: { label: string; value: string | number }, unit: string): string
  settleRelease(input: { counted: boolean; filed: boolean; lapsed: boolean }): SettleRelease
  createScoreTally: unknown
}

export interface RunLoopModule {
  createRunLoopDriver(runs: readonly FixtureRun[]): FixtureDriver
  demoRunLoop(): Promise<FixtureRun[] | null>
}

export interface RunLoopFixtureModule {
  woodariRunLoop: FixtureRun[]
}

export async function runState(): Promise<RunStateModule> {
  return (await import(importable(RUN_STATE_TS))) as unknown as RunStateModule
}

export async function scoreTally(): Promise<ScoreTallyModule> {
  return (await import(importable(SCORE_TALLY_TS))) as unknown as ScoreTallyModule
}

export async function runLoop(): Promise<RunLoopModule> {
  return (await import(importable(RUN_LOOP_TS))) as unknown as RunLoopModule
}

export async function runLoopFixture(): Promise<RunLoopFixtureModule> {
  return (await import(importable(RUN_LOOP_FIXTURE_TS))) as unknown as RunLoopFixtureModule
}

/* ── synthetic streams: shape only, never fixture CONTENT (C3) ───────────── */

/** A `meta` event with explicit fields — the only source of run/D-DAY numbers. */
export function metaEvent(over: Partial<Omit<MetaState, 'runsLeft'>> & { runsLeft?: number } = {}): ViewEvent {
  return {
    type: 'meta',
    run: over.run ?? 3,
    runs_left: over.runsLeft ?? 7,
    carried: over.carried ?? [],
    archive: over.archive ?? [],
  }
}

export function feedEvent(clock = '09:00'): ViewEvent {
  return { type: 'feed', line: { kind: 'event', clock, text: 'x' } }
}

export function reportEvent(round = 3): ViewEvent {
  return { type: 'report', round, facts: [], report_body: [] }
}

export function scoreEvent(
  total = 7,
  rows: { label: string; value: string | number; baseline: string | number | null }[] = [],
  baselineTotal = total,
): ViewEvent {
  // `baselineTotal` defaults to `total` so every existing caller keeps asserting
  // what it asserted: a ledger that changed nothing. A test about the DELTA
  // passes its own (§5.2 amendment h).
  return { type: 'score', total, baseline_total: baselineTotal, rows }
}

export function runEndEvent(run = 3): ViewEvent {
  return { type: 'run_end', run }
}

/** A content-free `FixtureRun` around an explicit event list. */
export function syntheticRun(events: ViewEvent[], id = 'u7-synthetic'): FixtureRun {
  return {
    id,
    start: '08:50',
    end: '21:04',
    events,
    responses: { new_run: { ok: true }, deploy: { ok: true }, slot: { ok: true } },
  }
}

/** Folds a whole stream through the reducer, returning every intermediate state. */
export function trace(module: RunStateModule, events: readonly ViewEvent[]): RunState[] {
  const out: RunState[] = []
  let state = module.initialRunState()
  for (const event of events) {
    state = module.reduce(state, event)
    out.push(state)
  }
  return out
}

/* ── a Storage double: node has no sessionStorage (c6) ───────────────────── */

export interface SpyStorage extends Storage {
  readonly writes: { key: string; value: string }[]
}

export function fakeStorage(seed: Record<string, string> = {}): SpyStorage {
  const map = new Map<string, string>(Object.entries(seed))
  const writes: { key: string; value: string }[] = []
  return {
    get length(): number {
      return map.size
    },
    clear: (): void => map.clear(),
    getItem: (key: string): string | null => (map.has(key) ? map.get(key)! : null),
    key: (index: number): string | null => [...map.keys()][index] ?? null,
    removeItem: (key: string): void => void map.delete(key),
    setItem: (key: string, value: string): void => {
      writes.push({ key, value })
      map.set(key, value)
    },
    writes,
  }
}

/** Private-mode storage: every call throws. The unit must degrade, not crash. */
export function throwingStorage(): Storage {
  const boom = (): never => {
    throw new DOMException('QuotaExceededError')
  }
  return {
    get length(): number {
      return boom()
    },
    clear: boom,
    getItem: boom,
    key: boom,
    removeItem: boom,
    setItem: boom,
  }
}

/* ── a virtual Scheduler: the cadence must be injectable (design D3) ─────── */

export interface Scheduler {
  at(ms: number, fn: () => void): () => void
  frame(fn: (now: number) => void): () => void
}

export interface VirtualScheduler extends Scheduler {
  /** Advances virtual time, firing every timer due at or before the new now. */
  tick(ms: number): void
  now(): number
}

export function virtualScheduler(): VirtualScheduler {
  let now = 0
  let seq = 0
  const timers = new Map<number, { due: number; fn: () => void }>()
  const frames = new Map<number, (now: number) => void>()

  return {
    now: () => now,
    at(ms: number, fn: () => void): () => void {
      const id = (seq += 1)
      timers.set(id, { due: now + ms, fn })
      return () => void timers.delete(id)
    },
    frame(fn: (t: number) => void): () => void {
      const id = (seq += 1)
      frames.set(id, fn)
      return () => void frames.delete(id)
    },
    tick(ms: number): void {
      const target = now + ms
      for (;;) {
        const due = [...timers.entries()]
          .filter(([, t]) => t.due <= target)
          .sort((a, b) => a[1].due - b[1].due)[0]
        if (!due) break
        timers.delete(due[0])
        now = due[1].due
        due[1].fn()
        for (const fn of [...frames.values()]) fn(now)
      }
      now = target
      for (const fn of [...frames.values()]) fn(now)
    },
  }
}

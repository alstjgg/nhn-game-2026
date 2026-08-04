// [e3] — the injected recording double (spec §4 checklist, A1/A3/A10).
//
// Every port method appends `{op, args}` to ONE ordered log, `read`/`readFlag`
// included: A1 is an index comparison between `applyDeltas` and the first state
// read, so a double that does not log its reads cannot prove it.
//
// This file holds no production logic. The driver never sees a real state core
// in this suite — A10's whole point.
import type { StateCorePort, RoundAssemblerPort, DeltaEntry } from '../../../src/engine/beat/ports.ts'

export type LogEntry = { op: string; args: readonly unknown[] }

export type RecordingState = StateCorePort & {
  /** The single ordered log. Assertions index into this. */
  readonly log: LogEntry[]
  /** `log.map(e => e.op)` — the shape most assertions want. */
  ops(): string[]
  /** Index of the first entry with this op, or -1. */
  firstIndex(op: string): number
  /** Index of the last entry with this op, or -1. */
  lastIndex(op: string): number
  /** Every entry with this op, in order. */
  entries(op: string): LogEntry[]
  /** Drops the log without touching the values — lets a test scope one beat. */
  clearLog(): void
  /** The double's own values, read directly (never through the log). */
  peek(): Record<string, number | boolean>
}

export type RecordingAssembler = RoundAssemblerPort & {
  readonly log: LogEntry[]
  /** The exact array instance handed back for a round — identity checks in A8. */
  instanceFor(roundIndex: number): string[]
}

/**
 * @param seed initial variables and flags, e.g. `{ trust: 50, sealed: false }`.
 * @param symptoms what `renderSymptoms()` returns (never empty — spec-engine §2.3-5).
 */
export function createRecordingState(
  seed: Record<string, number | boolean> = {},
  symptoms: string[] = ['(변화 없음)'],
): RecordingState {
  const log: LogEntry[] = []
  const values: Record<string, number | boolean> = { ...seed }
  const entries: DeltaEntry[] = []

  const state: RecordingState = {
    log,
    ops: () => log.map((e) => e.op),
    firstIndex: (op) => log.findIndex((e) => e.op === op),
    lastIndex: (op) => {
      for (let i = log.length - 1; i >= 0; i -= 1) if (log[i]!.op === op) return i
      return -1
    },
    entries: (op) => log.filter((e) => e.op === op),
    clearLog: () => {
      log.length = 0
    },
    peek: () => ({ ...values }),

    applyDeltas(deltas, cause) {
      log.push({ op: 'applyDeltas', args: [deltas, cause] })
      for (const [variable, d] of Object.entries(deltas)) {
        const before = typeof values[variable] === 'number' ? (values[variable] as number) : 0
        const after = before + d
        values[variable] = after
        entries.push({ variable, before, after, cause })
      }
    },
    applyFlags(flags, cause) {
      log.push({ op: 'applyFlags', args: [flags, cause] })
      for (const [flag, v] of Object.entries(flags)) {
        const before = values[flag] === true
        values[flag] = v
        entries.push({ variable: flag, before, after: v, cause })
      }
    },
    read(variable) {
      log.push({ op: 'read', args: [variable] })
      const v = values[variable]
      return typeof v === 'number' ? v : 0
    },
    readFlag(id) {
      log.push({ op: 'readFlag', args: [id] })
      return values[id] === true
    },
    journal() {
      log.push({ op: 'journal', args: [] })
      return entries.map((e) => ({ ...e }))
    },
    renderSymptoms() {
      log.push({ op: 'renderSymptoms', args: [] })
      return [...symptoms]
    },
    snapshot() {
      log.push({ op: 'snapshot', args: [] })
      return { ...values }
    },
  }
  return state
}

/** e4 owns the real assembler (spec D9); e3 only proves it is injected. */
export function createRecordingAssembler(lines: string[] = ['ex-1', 'ex-2']): RecordingAssembler {
  const log: LogEntry[] = []
  const held = new Map<number, string[]>()
  return {
    log,
    instanceFor(roundIndex) {
      if (!held.has(roundIndex)) held.set(roundIndex, [...lines, `r${roundIndex}`])
      return held.get(roundIndex)!
    },
    experienced(roundIndex) {
      log.push({ op: 'experienced', args: [roundIndex] })
      return this.instanceFor(roundIndex)
    },
    objectiveLog(roundIndex) {
      log.push({ op: 'objectiveLog', args: [roundIndex] })
      return this.instanceFor(roundIndex)
    },
  }
}

/** Ops that read state. A1 compares `applyDeltas` against the first of these. */
export const READ_OPS = ['read', 'readFlag', 'snapshot'] as const

/** Index of the first state-read entry in a log, or -1. */
export function firstReadIndex(state: RecordingState): number {
  return state.log.findIndex((e) => (READ_OPS as readonly string[]).includes(e.op))
}

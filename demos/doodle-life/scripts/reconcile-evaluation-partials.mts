import { readFile, readdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import type { TraceSummary } from '../src/ai/contracts.ts'

const evaluationDirectory = resolve(process.argv[2] ?? '')
if (!process.argv[2]) throw new Error('Usage: tsx scripts/reconcile-evaluation-partials.mts <evaluation-directory>')

const runDirectories = (await readdir(evaluationDirectory, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory() && /^run-\d+$/u.test(entry.name))
  .map((entry) => resolve(evaluationDirectory, entry.name))
  .sort()

const reconciledRuns: Record<string, unknown>[] = []
for (const runDirectory of runDirectories) {
  const runPath = resolve(runDirectory, 'run.json')
  const run = JSON.parse(await readFile(runPath, 'utf8')) as Record<string, unknown>
  const trace = run.trace as { operations: TraceSummary[]; totals: unknown }
  const partial = findPartialTrace(run.error)
  if (partial && !trace.operations.some((operation) => sameTrace(operation, partial))) {
    trace.operations.push(partial)
  }
  trace.totals = summarizeTraces(trace.operations)
  run.trace = trace
  await writeJson(resolve(runDirectory, 'trace.json'), trace)
  await writeJson(runPath, run)
  reconciledRuns.push(run)
  process.stdout.write(`${runDirectory}: ${trace.operations.length} operation trace(s)\n`)
}

const summaryPath = resolve(evaluationDirectory, 'summary.json')
try {
  const summary = JSON.parse(await readFile(summaryPath, 'utf8')) as Record<string, unknown>
  const successful = reconciledRuns.filter((run) => run.ok === true)
  summary.completedRuns = successful.length
  summary.failedRuns = reconciledRuns.length - successful.length
  summary.runs = reconciledRuns
  summary.observed = {
    wallClockMs: observedNumbers(successful.map(totalWallClockMs)),
    totalTokens: observedNumbers(successful.map(totalTokens)),
    structuredOutputSuccesses: successful.length,
    failures: reconciledRuns.length - successful.length,
  }
  await writeJson(summaryPath, summary)
} catch (error) {
  if (!isMissingFile(error)) throw error
}

function findPartialTrace(error: unknown): TraceSummary | null {
  if (!isRecord(error) || !isRecord(error.payload) || !isRecord(error.payload.error)) return null
  const trace = error.payload.error.trace
  return isTraceSummary(trace) ? trace : null
}

function sameTrace(left: TraceSummary, right: TraceSummary): boolean {
  return left.mode === right.mode
    && left.calls.length === right.calls.length
    && left.calls.every((call, index) => call.id === right.calls[index]?.id)
}

function summarizeTraces(traces: readonly TraceSummary[]) {
  const usage = {
    inputTokens: 0,
    cachedInputTokens: 0,
    outputTokens: 0,
    reasoningTokens: 0,
    totalTokens: 0,
  }
  const roles: Record<string, { calls: number; tokens: number; latencyMs: number }> = {}
  let calls = 0
  let totalLatencyMs = 0
  let wallClockMs = 0
  for (const trace of traces) {
    calls += trace.calls.length
    totalLatencyMs += trace.totalLatencyMs
    wallClockMs += trace.wallClockMs
    for (const key of Object.keys(usage) as (keyof typeof usage)[]) usage[key] += trace.usage[key]
    for (const call of trace.calls) {
      const current = roles[call.role] ?? { calls: 0, tokens: 0, latencyMs: 0 }
      roles[call.role] = {
        calls: current.calls + 1,
        tokens: current.tokens + call.usage.totalTokens,
        latencyMs: current.latencyMs + call.latencyMs,
      }
    }
  }
  return { calls, usage, totalLatencyMs, wallClockMs, roles }
}

function isTraceSummary(value: unknown): value is TraceSummary {
  return isRecord(value)
    && typeof value.mode === 'string'
    && Array.isArray(value.calls)
    && isRecord(value.usage)
    && typeof value.totalLatencyMs === 'number'
    && typeof value.wallClockMs === 'number'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function totalWallClockMs(run: Record<string, unknown>): number {
  const trace = run.trace
  return isRecord(trace) && isRecord(trace.totals) && typeof trace.totals.wallClockMs === 'number'
    ? trace.totals.wallClockMs
    : 0
}

function totalTokens(run: Record<string, unknown>): number {
  const trace = run.trace
  return isRecord(trace)
    && isRecord(trace.totals)
    && isRecord(trace.totals.usage)
    && typeof trace.totals.usage.totalTokens === 'number'
    ? trace.totals.usage.totalTokens
    : 0
}

function observedNumbers(values: readonly number[]) {
  if (values.length === 0) return { values: [], min: null, max: null, mean: null }
  return {
    values,
    min: Math.min(...values),
    max: Math.max(...values),
    mean: Math.round(values.reduce((sum, value) => sum + value, 0) / values.length),
  }
}

function isMissingFile(error: unknown): boolean {
  return isRecord(error) && error.code === 'ENOENT'
}

async function writeJson(path: string, value: unknown): Promise<void> {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

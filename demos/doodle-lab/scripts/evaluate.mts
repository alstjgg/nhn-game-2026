import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { basename, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type {
  BootstrapResponse,
  DoodleBirthResponse,
  TraceSummary,
  WorldTurnResponse,
} from '../src/ai/contracts.ts'
import { WorldStore } from '../src/world/store.ts'

type Provider = 'openai' | 'mock'
type Flow = 'bootstrap' | 'newcomer'

interface Options {
  readonly baseUrl: string
  readonly expectedProvider: Provider
  readonly mode: 'full-max' | 'full-selective' | 'director-only' | 'dialogue-only' | 'off'
  readonly flow: Flow
  readonly runs: number
  readonly label: string
  readonly outputRoot: string
  readonly imagePath: string
  readonly scenarioId: string
  readonly serverProcessState: string
}

interface TimelineEntry {
  readonly stage: string
  readonly startedAt: string
  readonly endedAt: string
  readonly wallClockMs: number
  readonly ok: boolean
  readonly error?: unknown
}

interface RecordedRun {
  readonly run: number
  readonly temperature: 'cold' | 'warm'
  readonly startedAt: string
  readonly endedAt: string
  readonly ok: boolean
  readonly timeline: readonly TimelineEntry[]
  readonly trace: {
    readonly operations: readonly TraceSummary[]
    readonly totals: ReturnType<typeof summarizeTraces>
  }
  readonly error?: unknown
}

const demoDirectory = resolve(fileURLToPath(new URL('..', import.meta.url)))
const repositoryRoot = resolve(demoDirectory, '../..')
const options = parseOptions(process.argv.slice(2))
const outputDirectory = resolve(options.outputRoot, options.label)
await mkdir(outputDirectory, { recursive: true })

const image = await readFile(options.imagePath)
const imageSha256 = createHash('sha256').update(image).digest('hex')
const imageDimensions = pngDimensions(image)
const imageDataUrl = `data:image/png;base64,${image.toString('base64')}`
const health = await requestJson<{
  provider: Provider
  modelCallsEnabled: boolean
  evaluationConfig?: unknown
}>(
  `${options.baseUrl}/api/v1/health`,
)
if (health.provider !== options.expectedProvider) {
  throw new Error(`Expected provider ${options.expectedProvider}, received ${health.provider}.`)
}

const manifest = {
  schemaVersion: 'doodle-life-evaluation.v1',
  createdAt: new Date().toISOString(),
  scenario: {
    id: options.scenarioId,
    locale: 'ko-KR',
    flow: options.flow,
    actionOrder: options.flow === 'bootstrap'
      ? ['bootstrap']
      : ['bootstrap', 'doodle-birth', 'add-player-to-world', 'newcomer-arrived'],
    doodle: {
      file: basename(options.imagePath),
      sha256: imageSha256,
      mimeType: 'image/png',
      width: imageDimensions.width,
      height: imageDimensions.height,
      drawingMetrics: null,
    },
    signal: options.flow === 'newcomer'
      ? {
          kind: 'newcomer-arrived',
          detailTemplate: '{name}이(가) 사용자가 그린 모습 그대로 처음 정원에 나타났다. 주민들은 각자의 관점으로 이 낯선 존재를 처음 본다.',
        }
      : null,
  },
  condition: {
    provider: health.provider,
    modelCallsEnabled: health.modelCallsEnabled,
    autonomy: options.mode,
    requestedRuns: options.runs,
    serverProcessState: options.serverProcessState,
    evaluationConfig: health.evaluationConfig ?? null,
    coldWarmRule: 'Run 1 is a condition-first label. serverProcessState is authoritative for actual process cold/warm state.',
  },
  privacy: {
    omitted: ['OPENAI_API_KEY', 'Authorization', 'image.dataUrl', 'base64 source'],
  },
}
await writeJson(resolve(outputDirectory, 'manifest.json'), manifest)

const recordedRuns: RecordedRun[] = []
for (let run = 1; run <= options.runs; run += 1) {
  const runDirectory = resolve(outputDirectory, `run-${String(run).padStart(2, '0')}`)
  await mkdir(runDirectory, { recursive: true })
  const timeline: TimelineEntry[] = []
  const traces: TraceSummary[] = []
  const startedAt = new Date().toISOString()
  let runError: unknown

  try {
    const bootstrap = await timedRequest<BootstrapResponse>(
      'bootstrap',
      `${options.baseUrl}/api/v1/bootstrap`,
      {
        sessionId: options.scenarioId,
        locale: 'ko-KR',
        autonomy: options.mode,
      },
      timeline,
    )
    traces.push(bootstrap.trace)
    await writeJson(resolve(runDirectory, 'bootstrap-response.json'), bootstrap)
    await writeJson(resolve(runDirectory, 'world-initial.json'), bootstrap.world)

    if (options.flow === 'newcomer') {
      const birth = await timedRequest<DoodleBirthResponse>(
        'doodle-birth',
        `${options.baseUrl}/api/v1/doodle-birth`,
        {
          requestId: `${options.scenarioId}-birth`,
          expectedRevision: bootstrap.world.revision,
          autonomy: options.mode,
          image: {
            dataUrl: imageDataUrl,
            mimeType: 'image/png',
            width: imageDimensions.width,
            height: imageDimensions.height,
            sha256: imageSha256,
          },
          drawingMetrics: null,
        },
        timeline,
      )
      traces.push(birth.trace)
      await writeJson(resolve(runDirectory, 'doodle-reading.json'), birth)

      const store = new WorldStore(bootstrap.world)
      const worldBefore = store.addResident(store.revision, birth.character)
      await writeJson(resolve(runDirectory, 'world-before-interaction.json'), worldBefore)
      const detail = `${birth.character.name}이(가) 사용자가 그린 모습 그대로 처음 정원에 나타났다. 주민들은 각자의 관점으로 이 낯선 존재를 처음 본다.`
      const turn = await timedRequest<WorldTurnResponse>(
        'newcomer-arrived',
        `${options.baseUrl}/api/v1/world-turn`,
        {
          requestId: `${options.scenarioId}-turn`,
          expectedRevision: worldBefore.revision,
          autonomy: options.mode,
          world: worldBefore,
          signal: {
            kind: 'newcomer-arrived',
            actorId: birth.character.id,
            detail,
          },
        },
        timeline,
      )
      traces.push(turn.trace)
      await writeJson(resolve(runDirectory, 'interaction.json'), {
        signal: { kind: 'newcomer-arrived', actorId: birth.character.id, detail },
        intents: turn.intents,
        proposedScene: turn.proposedScene,
        critic: turn.critic,
        finalScene: turn.scene,
      })
      await writeJson(resolve(runDirectory, 'world-after-interaction.json'), turn.nextWorld)
      await writeJson(resolve(runDirectory, 'interaction-timeline.json'), sceneTimeline(turn))
    }
  } catch (error) {
    runError = serializableError(error)
    const partialTrace = traceFromError(error)
    if (partialTrace) traces.push(partialTrace)
  }

  const endedAt = new Date().toISOString()
  const record: RecordedRun = {
    run,
    temperature: run === 1 ? 'cold' : 'warm',
    startedAt,
    endedAt,
    ok: runError === undefined,
    timeline,
    trace: {
      operations: traces,
      totals: summarizeTraces(traces),
    },
    ...(runError === undefined ? {} : { error: runError }),
  }
  recordedRuns.push(record)
  await writeJson(resolve(runDirectory, 'trace.json'), record.trace)
  await writeJson(resolve(runDirectory, 'run.json'), record)
  process.stdout.write(
    `[${options.label}] run ${run}/${options.runs}: ${record.ok ? 'ok' : 'failed'} · `
      + `${record.trace.totals.calls} calls · ${record.trace.totals.usage.totalTokens} tokens · `
      + `${record.trace.totals.wallClockMs} ms wall\n`,
  )
}

const aggregate = {
  schemaVersion: 'doodle-life-evaluation-summary.v1',
  label: options.label,
  provider: health.provider,
  autonomy: options.mode,
  flow: options.flow,
  completedRuns: recordedRuns.filter((run) => run.ok).length,
  failedRuns: recordedRuns.filter((run) => !run.ok).length,
  runs: recordedRuns,
  observed: aggregateObserved(recordedRuns),
}
await writeJson(resolve(outputDirectory, 'summary.json'), aggregate)
await writeFile(resolve(outputDirectory, 'README.md'), markdownReport(manifest, aggregate), 'utf8')

function parseOptions(args: readonly string[]): Options {
  const values = new Map<string, string>()
  for (const argument of args) {
    const match = /^--([^=]+)=(.+)$/u.exec(argument)
    if (!match?.[1] || !match[2]) throw new Error(`Arguments must use --name=value: ${argument}`)
    values.set(match[1], match[2])
  }
  const provider = values.get('provider')
  if (provider !== 'openai' && provider !== 'mock') {
    throw new Error('--provider must be openai or mock.')
  }
  const mode = values.get('mode') ?? 'full-max'
  if (!['full-max', 'full-selective', 'director-only', 'dialogue-only', 'off'].includes(mode)) {
    throw new Error(`Unsupported --mode: ${mode}`)
  }
  const flow = values.get('flow') ?? 'newcomer'
  if (flow !== 'bootstrap' && flow !== 'newcomer') throw new Error(`Unsupported --flow: ${flow}`)
  const runs = Number(values.get('runs') ?? '1')
  if (!Number.isSafeInteger(runs) || runs < 1 || runs > 10) throw new Error('--runs must be an integer from 1 to 10.')
  return {
    baseUrl: (values.get('base-url') ?? 'http://127.0.0.1:8787').replace(/\/+$/u, ''),
    expectedProvider: provider,
    mode: mode as Options['mode'],
    flow,
    runs,
    label: safeLabel(values.get('label') ?? `${provider}-${mode}`),
    outputRoot: resolve(values.get('output') ?? resolve(repositoryRoot, 'artifacts/doodle-life-evals')),
    imagePath: resolve(values.get('image') ?? resolve(demoDirectory, 'soso-glide-empathy-guide.png')),
    scenarioId: safeId(values.get('scenario') ?? 'eval-doodle-life-fixed-v1'),
    serverProcessState: values.get('server-process-state') ?? 'unspecified',
  }
}

async function timedRequest<T>(
  stage: string,
  url: string,
  body: unknown,
  timeline: TimelineEntry[],
): Promise<T> {
  const startedAt = new Date().toISOString()
  const started = performance.now()
  try {
    const value = await requestJson<T>(url, body)
    timeline.push({
      stage,
      startedAt,
      endedAt: new Date().toISOString(),
      wallClockMs: Math.round(performance.now() - started),
      ok: true,
    })
    return value
  } catch (error) {
    timeline.push({
      stage,
      startedAt,
      endedAt: new Date().toISOString(),
      wallClockMs: Math.round(performance.now() - started),
      ok: false,
      error: serializableError(error),
    })
    throw error
  }
}

async function requestJson<T>(url: string, body?: unknown): Promise<T> {
  const response = await fetch(url, {
    method: body === undefined ? 'GET' : 'POST',
    headers: body === undefined ? undefined : { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const text = await response.text()
  let payload: unknown
  try {
    payload = JSON.parse(text)
  } catch {
    throw httpError(response.status, `Non-JSON response from ${url}`, { text: text.slice(0, 500) })
  }
  if (!response.ok) throw httpError(response.status, `HTTP ${response.status} from ${url}`, payload)
  return payload as T
}

type RecordedHttpError = Error & { readonly status: number; readonly payload: unknown }

function httpError(status: number, message: string, payload: unknown): RecordedHttpError {
  return Object.assign(new Error(message), { name: 'HttpError', status, payload })
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

function aggregateObserved(runs: readonly RecordedRun[]) {
  const successful = runs.filter((run) => run.ok)
  const wallTimes = successful.map((run) => run.trace.totals.wallClockMs)
  const tokenTotals = successful.map((run) => run.trace.totals.usage.totalTokens)
  return {
    wallClockMs: observedNumbers(wallTimes),
    totalTokens: observedNumbers(tokenTotals),
    structuredOutputSuccesses: successful.length,
    failures: runs.length - successful.length,
  }
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

function sceneTimeline(turn: WorldTurnResponse) {
  return turn.scene.beats.map((beat, beatIndex) => ({
    beat: beatIndex + 1,
    status: beat.status,
    durationMs: beat.durationMs,
    actions: beat.actions.map((action, actionIndex) => ({
      order: actionIndex + 1,
      ...action,
    })),
  }))
}

function traceFromError(error: unknown): TraceSummary | null {
  if (!(error instanceof Error) || error.name !== 'HttpError' || !('payload' in error)) return null
  const payload = (error as RecordedHttpError).payload
  if (!isRecord(payload) || !isRecord(payload.error) || !isTraceSummary(payload.error.trace)) return null
  return payload.error.trace
}

function isTraceSummary(value: unknown): value is TraceSummary {
  if (!isRecord(value) || !Array.isArray(value.calls) || !isRecord(value.usage)) return false
  return typeof value.mode === 'string'
    && typeof value.totalLatencyMs === 'number'
    && typeof value.wallClockMs === 'number'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function markdownReport(manifest: Record<string, unknown>, summary: ReturnType<typeof makeAggregateShape>): string {
  const condition = manifest.condition as {
    provider: string
    autonomy: string
    requestedRuns: number
  }
  const rows = summary.runs.map((run) => {
    const totals = run.trace.totals
    const stages = run.timeline.map((entry) => `${entry.stage} ${entry.wallClockMs}ms${entry.ok ? '' : ' 실패'}`).join(' → ')
    return `| ${run.run} | ${run.temperature} | ${run.ok ? '성공' : '실패'} | ${totals.calls} | ${totals.usage.totalTokens.toLocaleString('ko-KR')} | ${totals.wallClockMs.toLocaleString('ko-KR')} | ${stages} |`
  }).join('\n')
  return `# Doodle Life 실행 기록 — ${summary.label}

이 문서는 품질 점수나 평가 척도를 포함하지 않는다. 아래 값과 생성 원문을 직접 보고 판단하기 위한 실행 증거다.

## 조건

- Provider: \`${condition.provider}\`
- Autonomy: \`${condition.autonomy}\`
- Flow: \`${summary.flow}\`
- 반복: ${condition.requestedRuns}회
- 고정 시나리오: \`${(manifest.scenario as { id: string }).id}\`

## 관측 결과

| Run | 상태 | 결과 | 호출 | 총 토큰 | orchestration wall ms | 단계별 실제 경과 |
|---:|---|---|---:|---:|---:|---|
${rows}

구조화 출력 성공 ${summary.observed.structuredOutputSuccesses}회, 실패 ${summary.observed.failures}회.
성공 실행 wall time 원값: ${JSON.stringify(summary.observed.wallClockMs.values)}.
성공 실행 총 토큰 원값: ${JSON.stringify(summary.observed.totalTokens.values)}.

각 \`run-XX\` 폴더에는 trace, 초기/상호작용 전후 world, 낙서 판독, NPC intent, 제안 장면, critic 결과, 최종 장면과 실행 타임라인이 저장되어 있다. 이미지 base64와 인증 정보는 저장하지 않았다.
`
}

function makeAggregateShape() {
  return {
    label: '',
    flow: '' as Flow,
    runs: [] as RecordedRun[],
    observed: aggregateObserved([]),
  }
}

function pngDimensions(buffer: Buffer): { width: number; height: number } {
  if (buffer.length < 24 || buffer.toString('ascii', 1, 4) !== 'PNG') {
    throw new Error('The fixed doodle fixture must be a PNG.')
  }
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) }
}

function safeId(value: string): string {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]{2,127}$/u.test(value)) throw new Error(`Unsafe scenario id: ${value}`)
  return value
}

function safeLabel(value: string): string {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{1,79}$/u.test(value)) throw new Error(`Unsafe label: ${value}`)
  return value
}

function serializableError(error: unknown): unknown {
  if (
    error instanceof Error
    && error.name === 'HttpError'
    && 'status' in error
    && 'payload' in error
  ) {
    return {
      name: error.name,
      message: error.message,
      status: (error as RecordedHttpError).status,
      payload: (error as RecordedHttpError).payload,
    }
  }
  if (error instanceof Error) return { name: error.name, message: error.message, stack: error.stack }
  return { name: 'UnknownError', value: String(error) }
}

async function writeJson(path: string, value: unknown): Promise<void> {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

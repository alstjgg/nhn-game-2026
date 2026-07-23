import { createHash } from 'node:crypto'
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { basename, resolve } from 'node:path'
import { parseEnv } from 'node:util'
import { fileURLToPath } from 'node:url'

import type {
  DoodleReadingResponse,
  DoodleWorld,
  EncounterReactionResponse,
  QuestContract,
  ResolveQuestResponse,
  SessionBootstrapResponse,
} from '../src/doodle-life/contracts.ts'
import {
  ModelProviderError,
  createProvider,
  providerEvaluationConfig,
  type ModelInputContent,
  type ModelTrace,
  type StructuredProvider,
  type StructuredRequest,
  type TokenUsage,
} from '../server/ai/provider.ts'
import {
  createDoodleLifeService,
  type DoodleLifeInspectionSnapshot,
} from '../server/doodle-life/service.ts'
import { questContractHash, validateGeneratedGarden } from '../server/doodle-life/quest-engine.ts'
import { DoodleLifeSessionStore } from '../server/doodle-life/session-store.ts'
import { sosoQuest, tutorialGarden } from '../server/doodle-life/tutorial-fixture.ts'

const REQUIRED_RUNS = 3
const QUEST_ID = 'quest_soso_last_note'
const EVALUATION_SCHEMA_VERSION = 'doodle-life-request-first-evaluation.v2'
const SUMMARY_SCHEMA_VERSION = 'doodle-life-request-first-evaluation-summary.v2'
const DEFAULT_SCENARIO_ID = 'eval-request-first-v2'
const DEFAULT_LABEL = 'api-baseline'
const ARTIFACT_SECRET_KEYS = new Set([
  'authorization',
  'apiKey',
  'OPENAI_API_KEY',
  'dataUrl',
  'image_url',
])
const QUEST_BLIND_FORBIDDEN_KEYS = new Set([
  'questId',
  'ownerNpcId',
  'observerNpcId',
  'problemState',
  'primaryPurpose',
  'primarySolutions',
  'bonusPurpose',
  'bonusSolutions',
  'partialAffordances',
  'unexpectedEffects',
  'outcomes',
])
const QUEST_BLIND_FORBIDDEN_VALUES = [
  QUEST_ID,
  'glide',
  'float',
  'stretch',
  'climb',
  'listen',
  'echo',
  'carry_signal',
  'signal',
]

interface Options {
  readonly provider: 'openai'
  readonly runs: 3
  readonly label: string
  readonly outputRoot: string
  readonly imagePath: string
  readonly scenarioId: string
}

interface ImageMetadata {
  readonly file: string
  readonly sha256: string
  readonly mimeType: 'image/png' | 'image/jpeg'
  readonly width: number
  readonly height: number
  readonly drawingMetrics: null
}

interface TimelineEntry {
  readonly stage: string
  readonly startedAt: string
  readonly endedAt: string
  readonly wallClockMs: number
  readonly ok: boolean
  readonly error?: unknown
}

interface CapturedProviderCall {
  readonly role: string
  readonly schemaName: string
  readonly reasoning: string | null
  readonly maxOutputTokens: number | null
  readonly inputMetadata: readonly unknown[]
  readonly startedAt: string
  endedAt: string
  wallClockMs: number
  status: 'running' | 'completed' | 'failed'
  output: unknown
  trace: ModelTrace | null
  error: unknown
}

interface RecordedRun {
  readonly run: number
  readonly sessionId: string
  readonly startedAt: string
  readonly endedAt: string
  readonly roundCompleted: boolean
  readonly timeline: readonly TimelineEntry[]
  readonly contractHashBefore: string | null
  readonly contractHashAfter: string | null
  readonly fallbacks: {
    readonly doodleReading: string | null
    readonly reactionActorIds: readonly string[]
    readonly failedModelRoles: readonly string[]
  }
  readonly trace: ReturnType<typeof summarizeModelCalls>
  readonly criticalPathWallMs: number
  readonly error?: unknown
}

interface RunState {
  bootstrap: SessionBootstrapResponse | null
  selectedQuest: unknown
  inspectionBefore: DoodleLifeInspectionSnapshot | null
  contractBefore: QuestContract | null
  reading: DoodleReadingResponse | null
  resolution: ResolveQuestResponse | null
  internalResolution: unknown
  reaction: EncounterReactionResponse | null
  inspectionAfter: DoodleLifeInspectionSnapshot | null
  contractAfter: QuestContract | null
}

const demoDirectory = resolve(fileURLToPath(new URL('..', import.meta.url)))
const repositoryRoot = resolve(demoDirectory, '../..')
const options = parseOptions(process.argv.slice(2))

await loadEnvironmentFiles([
  resolve(repositoryRoot, '.env.local'),
  resolve(demoDirectory, '.env.local'),
])

const imageBytes = await readFile(options.imagePath)
const imageDescription = inspectImage(imageBytes)
const imageMetadata: ImageMetadata = {
  file: basename(options.imagePath),
  sha256: createHash('sha256').update(imageBytes).digest('hex'),
  mimeType: imageDescription.mimeType,
  width: imageDescription.width,
  height: imageDescription.height,
  drawingMetrics: null,
}
const imageDataUrl = `data:${imageMetadata.mimeType};base64,${imageBytes.toString('base64')}`
const fixedGarden = validateGeneratedGarden(tutorialGarden())
const fixedQuest = fixedGarden.quests.find((quest) => quest.questId === QUEST_ID)
if (!fixedQuest) throw new Error(`The fixed tutorial garden does not contain ${QUEST_ID}.`)
const fixedQuestHash = questContractHash(fixedQuest)
if (fixedQuestHash !== questContractHash(sosoQuest())) {
  throw new Error('The tutorial garden and standalone Soso contract are not identical.')
}

const outputDirectory = resolve(options.outputRoot, options.label)
await assertEmptyOutputDirectory(outputDirectory)
await mkdir(outputDirectory, { recursive: true })

const baseProvider = createProvider({ provider: options.provider })
if (baseProvider.kind !== 'openai') {
  throw new Error(`Request-first live evaluation requires OpenAI, received ${baseProvider.kind}.`)
}
const evaluationConfig = providerEvaluationConfig(baseProvider.kind)
const manifest = {
  schemaVersion: EVALUATION_SCHEMA_VERSION,
  createdAt: new Date().toISOString(),
  condition: {
    provider: baseProvider.kind,
    requestedRuns: REQUIRED_RUNS,
    enforcedRuns: REQUIRED_RUNS,
    worldSource: 'fixed-validated-tutorial-garden',
    worldModelCallsPerRun: 0,
    liveModelRolesPerRun: [
      'doodle-reader',
      'quest-owner-reaction',
      'quest-observer-reaction',
    ],
    selectedQuestId: QUEST_ID,
    selectedQuestHash: fixedQuestHash,
    evaluationConfig: {
      roles: {
        'doodle-reader': evaluationConfig.roles['doodle-reader'],
        'quest-owner-reaction': evaluationConfig.roles['quest-owner-reaction'],
        'quest-observer-reaction': evaluationConfig.roles['quest-observer-reaction'],
      },
      aiTimeoutMs: positiveEnvironmentNumber('AI_TIMEOUT_MS', 180_000),
      reactionTimeoutMs: positiveEnvironmentNumber('REACTION_TIMEOUT_MS', 45_000),
    },
  },
  scenario: {
    id: options.scenarioId,
    locale: 'ko-KR',
    actionOrder: [
      'seed-fixed-session',
      'select-locked-soso-quest',
      'quest-blind-doodle-reading',
      'local-deterministic-resolution',
      'parallel-owner-observer-reactions',
      'local-encounter-resolver',
    ],
    image: imageMetadata,
  },
  privacy: {
    omitted: [
      'OPENAI_API_KEY',
      'Authorization',
      'image.dataUrl',
      'input_image.image_url',
      'base64 image source',
    ],
  },
  interpretation: {
    timing: {
      criticalPathWallMs: 'run start through resolved encounter or terminal local error',
      aggregateModelLatencyMs: 'sum of individual model call latency; parallel reactions overlap',
      reactionStageWallMs: 'actual outer wall time of the parallel reaction stage',
    },
  },
}
await writeJson(resolve(outputDirectory, 'manifest.json'), manifest)

const recordedRuns: RecordedRun[] = []
for (let run = 1; run <= REQUIRED_RUNS; run += 1) {
  const record = await executeRun(run)
  recordedRuns.push(record)
  process.stdout.write(
    `[request-first-v2] run ${run}/${REQUIRED_RUNS}: `
      + `${record.roundCompleted ? 'completed' : 'failed'} · `
      + `${record.trace.calls} calls · ${record.trace.usage.totalTokens} tokens · `
      + `${record.criticalPathWallMs} ms critical path\n`,
  )
}

const summary = {
  schemaVersion: SUMMARY_SCHEMA_VERSION,
  label: options.label,
  provider: baseProvider.kind,
  requestedRuns: REQUIRED_RUNS,
  completedRuns: recordedRuns.filter((run) => run.roundCompleted).length,
  failedRuns: recordedRuns.filter((run) => !run.roundCompleted).length,
  fixedCondition: {
    questId: QUEST_ID,
    questHash: fixedQuestHash,
    imageSha256: imageMetadata.sha256,
    modelSettings: manifest.condition.evaluationConfig,
  },
  runs: recordedRuns,
  observed: {
    criticalPathWallMs: observedNumbers(recordedRuns.map((run) => run.criticalPathWallMs)),
    aggregateModelLatencyMs: observedNumbers(recordedRuns.map((run) => run.trace.aggregateModelLatencyMs)),
    totalTokens: observedNumbers(recordedRuns.map((run) => run.trace.usage.totalTokens)),
    modelCalls: observedNumbers(recordedRuns.map((run) => run.trace.calls)),
    fallbackRuns: recordedRuns.filter((run) => (
      run.fallbacks.doodleReading !== null
      || run.fallbacks.reactionActorIds.length > 0
      || run.fallbacks.failedModelRoles.length > 0
    )).length,
    contractHashesBefore: [...new Set(recordedRuns.map((run) => run.contractHashBefore).filter(Boolean))],
    contractHashesAfter: [...new Set(recordedRuns.map((run) => run.contractHashAfter).filter(Boolean))],
  },
}
await writeJson(resolve(outputDirectory, 'summary.json'), summary)

if (recordedRuns.some((run) => !run.roundCompleted)) process.exitCode = 1

async function executeRun(run: number): Promise<RecordedRun> {
  const runStarted = performance.now()
  const startedAt = new Date().toISOString()
  const runLabel = String(run).padStart(2, '0')
  const sessionId = safeId(`${options.scenarioId}-r${runLabel}`)
  const runDirectory = resolve(outputDirectory, `run-${runLabel}`)
  await mkdir(runDirectory, { recursive: true })

  const sessions = new DoodleLifeSessionStore()
  sessions.create(sessionId, validateGeneratedGarden(tutorialGarden()))
  const captures: CapturedProviderCall[] = []
  const provider = recordingProvider(baseProvider, captures, imageMetadata)
  const service = createDoodleLifeService({
    provider,
    sessions,
    reactionTimeoutMs: positiveEnvironmentNumber('REACTION_TIMEOUT_MS', 45_000),
  })
  const timeline: TimelineEntry[] = []
  const state: RunState = {
    bootstrap: null,
    selectedQuest: null,
    inspectionBefore: null,
    contractBefore: null,
    reading: null,
    resolution: null,
    internalResolution: null,
    reaction: null,
    inspectionAfter: null,
    contractAfter: null,
  }
  let runError: unknown

  try {
    state.bootstrap = await timedStage('fixed-session-bootstrap', timeline, () => service.bootstrap({
      sessionId,
      locale: 'ko-KR',
    }))
    state.selectedQuest = await timedStage('select-locked-soso-quest', timeline, () => Promise.resolve(
      service.selectQuest({
        sessionId,
        questId: QUEST_ID,
        expectedRevision: state.bootstrap?.world.revision ?? 0,
      }),
    ))
    state.inspectionBefore = service.inspectionSnapshot(sessionId)
    state.contractBefore = questFromInspection(state.inspectionBefore)
    assertFixedContract(state.inspectionBefore, state.contractBefore, 'before')

    state.reading = await timedStage('quest-blind-doodle-reading', timeline, () => service.readDoodle({
      requestId: safeId(`${sessionId}-read`),
      sessionId,
      readIndex: 0,
      image: {
        dataUrl: imageDataUrl,
        mimeType: imageMetadata.mimeType,
        width: imageMetadata.width,
        height: imageMetadata.height,
        sha256: imageMetadata.sha256,
      },
      drawingMetrics: imageMetadata.drawingMetrics,
    }))

    state.resolution = await timedStage('local-deterministic-resolution', timeline, () => Promise.resolve(
      service.resolveQuest({
        requestId: safeId(`${sessionId}-resolve`),
        sessionId,
        expectedRevision: state.bootstrap?.world.revision ?? 0,
      }),
    ))
    state.internalResolution = structuredClone(sessions.get(sessionId).resolution)

    state.reaction = await timedStage('parallel-reactions-and-local-resolver', timeline, () => (
      service.createReactions({
        requestId: safeId(`${sessionId}-react`),
        sessionId,
        expectedRevision: state.resolution?.nextWorld.revision ?? 0,
      })
    ))
    state.inspectionAfter = service.inspectionSnapshot(sessionId)
    state.contractAfter = questFromInspection(state.inspectionAfter)
    assertFixedContract(state.inspectionAfter, state.contractAfter, 'after')
    if (JSON.stringify(state.contractAfter) !== JSON.stringify(state.contractBefore)) {
      throw new Error('The locked Soso contract snapshot changed during the run.')
    }
  } catch (error) {
    runError = serializableError(error)
    try {
      state.inspectionAfter = service.inspectionSnapshot(sessionId)
      state.contractAfter = questFromInspection(state.inspectionAfter)
    } catch {
      // The primary error is recorded below; inspection is best-effort on a partial run.
    }
  }

  const endedAt = new Date().toISOString()
  const criticalPathWallMs = Math.max(0, Math.round(performance.now() - runStarted))
  const doodleCapture = captureForRole(captures, 'doodle-reader')
  const ownerCapture = captureForRole(captures, 'quest-owner-reaction')
  const observerCapture = captureForRole(captures, 'quest-observer-reaction')
  const allCalls = capturedModelTraces(captures)
  const trace = summarizeModelCalls(allCalls)
  const roundCompleted = Boolean(
    state.bootstrap
    && state.contractBefore
    && state.reading
    && state.resolution
    && state.reaction
    && state.inspectionAfter?.encounterCreated
    && state.inspectionBefore?.currentQuestHash === fixedQuestHash
    && state.inspectionAfter.currentQuestHash === fixedQuestHash
    && runError === undefined,
  )
  const record: RecordedRun = {
    run,
    sessionId,
    startedAt,
    endedAt,
    roundCompleted,
    timeline,
    contractHashBefore: state.inspectionBefore?.currentQuestHash ?? null,
    contractHashAfter: state.inspectionAfter?.currentQuestHash ?? null,
    fallbacks: {
      doodleReading: state.reading?.usedFallback ? state.reading.fallbackReason : null,
      reactionActorIds: state.reaction?.encounter.fallbackActorIds ?? [],
      failedModelRoles: captures.filter((capture) => capture.status === 'failed').map((capture) => capture.role),
    },
    trace,
    criticalPathWallMs,
    ...(runError === undefined ? {} : { error: runError }),
  }

  await Promise.all([
    writeJson(resolve(runDirectory, 'world-public.json'), {
      source: 'fixed-validated-tutorial-garden',
      world: state.bootstrap?.world ?? null,
    }),
    writeJson(resolve(runDirectory, 'quest-public-view.json'), state.selectedQuest),
    writeJson(resolve(runDirectory, 'quest-contract-before.json'), contractEvidence(
      state.contractBefore,
      state.inspectionBefore?.currentQuestHash ?? null,
    )),
    writeJson(resolve(runDirectory, 'vlm-input-metadata.json'), {
      questBlind: true,
      forbiddenKeysPresent: doodleCapture
        ? findForbiddenKeys(doodleCapture.inputMetadata, QUEST_BLIND_FORBIDDEN_KEYS)
        : [],
      input: doodleCapture?.inputMetadata ?? null,
      image: imageMetadata,
    }),
    writeJson(resolve(runDirectory, 'doodle-reading.json'), {
      response: state.reading,
      rawProviderOutput: doodleCapture?.output ?? null,
      providerCall: doodleCapture ?? null,
    }),
    writeJson(resolve(runDirectory, 'quest-resolution.json'), {
      engineResolution: state.internalResolution,
      publicResponse: state.resolution,
      providerCalls: 0,
    }),
    writeJson(resolve(runDirectory, 'world-diff.json'), worldDiff(
      state.bootstrap?.world ?? null,
      state.resolution?.nextWorld ?? null,
    )),
    writeJson(resolve(runDirectory, 'owner-reaction.json'), ownerCapture),
    writeJson(resolve(runDirectory, 'observer-reaction.json'), observerCapture),
    writeJson(resolve(runDirectory, 'resolved-encounter.json'), state.reaction),
    writeJson(resolve(runDirectory, 'quest-contract-after.json'), contractEvidence(
      state.contractAfter,
      state.inspectionAfter?.currentQuestHash ?? null,
    )),
    writeJson(resolve(runDirectory, 'trace.json'), {
      operations: {
        fixedSession: state.bootstrap?.trace ?? null,
        doodleReading: state.reading?.trace ?? null,
        localResolution: state.resolution?.trace ?? null,
        parallelReactions: state.reaction?.trace ?? null,
      },
      totals: trace,
      timeline,
      criticalPathWallMs,
    }),
    writeJson(resolve(runDirectory, 'run.json'), record),
  ])
  return record
}

function recordingProvider(
  delegate: StructuredProvider,
  captures: CapturedProviderCall[],
  attachedImage: ImageMetadata,
): StructuredProvider {
  return {
    kind: delegate.kind,
    async generate<T>(request: StructuredRequest<T>) {
      const started = performance.now()
      const capture: CapturedProviderCall = {
        role: request.role,
        schemaName: request.schemaName,
        reasoning: request.reasoning ?? null,
        maxOutputTokens: request.maxOutputTokens ?? null,
        inputMetadata: redactModelInput(request.input, attachedImage),
        startedAt: new Date().toISOString(),
        endedAt: '',
        wallClockMs: 0,
        status: 'running',
        output: null,
        trace: null,
        error: null,
      }
      captures.push(capture)
      try {
        if (request.role === 'doodle-reader') assertQuestBlindInput(capture.inputMetadata)
        const result = await delegate.generate(request)
        capture.status = 'completed'
        capture.output = structuredClone(result.value)
        capture.trace = result.trace
        return result
      } catch (error) {
        capture.status = 'failed'
        capture.error = serializableError(error)
        capture.trace = error instanceof ModelProviderError ? error.trace ?? null : null
        throw error
      } finally {
        capture.endedAt = new Date().toISOString()
        capture.wallClockMs = Math.max(0, Math.round(performance.now() - started))
      }
    },
  }
}

function redactModelInput(
  input: readonly ModelInputContent[],
  attachedImage: ImageMetadata,
): readonly unknown[] {
  return input.map((item) => {
    if (item.type === 'input_image') {
      return {
        type: 'input_image',
        attached: true,
        detail: item.detail,
        dataUrlOmitted: true,
        image: attachedImage,
      }
    }
    try {
      return { type: 'input_text', json: JSON.parse(item.text) as unknown }
    } catch {
      return {
        type: 'input_text',
        textOmitted: true,
        sha256: createHash('sha256').update(item.text).digest('hex'),
        characterCount: item.text.length,
      }
    }
  })
}

function assertQuestBlindInput(input: readonly unknown[]): void {
  const forbiddenKeys = findForbiddenKeys(input, QUEST_BLIND_FORBIDDEN_KEYS)
  if (forbiddenKeys.length > 0) {
    throw new Error(`Doodle-reader input leaked quest fields: ${forbiddenKeys.join(', ')}`)
  }
  const serialized = JSON.stringify(input)
  const leakedValues = QUEST_BLIND_FORBIDDEN_VALUES.filter((value) => serialized.includes(`"${value}"`))
  if (leakedValues.length > 0) {
    throw new Error(`Doodle-reader input leaked quest truth: ${leakedValues.join(', ')}`)
  }
}

function findForbiddenKeys(value: unknown, forbidden: ReadonlySet<string>): string[] {
  if (Array.isArray(value)) {
    return [...new Set(value.flatMap((item) => findForbiddenKeys(item, forbidden)))].sort()
  }
  if (!isRecord(value)) return []
  return [...new Set(Object.entries(value).flatMap(([key, child]) => [
    ...(forbidden.has(key) ? [key] : []),
    ...findForbiddenKeys(child, forbidden),
  ]))].sort()
}

function captureForRole(
  captures: readonly CapturedProviderCall[],
  role: string,
): CapturedProviderCall | null {
  return captures.find((capture) => capture.role === role) ?? null
}

function capturedModelTraces(captures: readonly CapturedProviderCall[]): ModelTrace[] {
  const traces: ModelTrace[] = []
  for (const capture of captures) {
    if (capture.trace) traces.push(capture.trace)
    if (!isRecord(capture.error) || !isRecord(capture.error.partialTrace)) continue
    const calls = capture.error.partialTrace.calls
    if (Array.isArray(calls)) {
      for (const call of calls) if (isModelTrace(call)) traces.push(call)
    }
  }
  return [...new Map(traces.map((trace) => [trace.id, trace])).values()]
}

function isModelTrace(value: unknown): value is ModelTrace {
  return isRecord(value)
    && typeof value.id === 'string'
    && typeof value.role === 'string'
    && (value.provider === 'openai' || value.provider === 'mock')
    && typeof value.model === 'string'
    && typeof value.startedAt === 'string'
    && typeof value.latencyMs === 'number'
    && isRecord(value.usage)
}

function summarizeModelCalls(calls: readonly ModelTrace[]) {
  const usage = calls.reduce<TokenUsage>((sum, call) => ({
    inputTokens: sum.inputTokens + call.usage.inputTokens,
    cachedInputTokens: sum.cachedInputTokens + call.usage.cachedInputTokens,
    outputTokens: sum.outputTokens + call.usage.outputTokens,
    reasoningTokens: sum.reasoningTokens + call.usage.reasoningTokens,
    totalTokens: sum.totalTokens + call.usage.totalTokens,
  }), emptyUsage())
  const roles: Record<string, { calls: number; tokens: number; latencyMs: number }> = {}
  for (const call of calls) {
    const current = roles[call.role] ?? { calls: 0, tokens: 0, latencyMs: 0 }
    roles[call.role] = {
      calls: current.calls + 1,
      tokens: current.tokens + call.usage.totalTokens,
      latencyMs: current.latencyMs + call.latencyMs,
    }
  }
  return {
    calls: calls.length,
    usage,
    aggregateModelLatencyMs: calls.reduce((sum, call) => sum + call.latencyMs, 0),
    roles,
  }
}

function emptyUsage(): TokenUsage {
  return {
    inputTokens: 0,
    cachedInputTokens: 0,
    outputTokens: 0,
    reasoningTokens: 0,
    totalTokens: 0,
  }
}

function questFromInspection(snapshot: DoodleLifeInspectionSnapshot): QuestContract {
  const quest = snapshot.quests.find((candidate) => candidate.questId === QUEST_ID)
  if (!quest) throw new Error(`Inspection snapshot is missing ${QUEST_ID}.`)
  return quest
}

function assertFixedContract(
  snapshot: DoodleLifeInspectionSnapshot,
  contract: QuestContract,
  stage: string,
): void {
  const storedHash = snapshot.questHashes[QUEST_ID]
  const currentHash = snapshot.currentQuestHash
  const calculatedHash = questContractHash(contract)
  if (
    snapshot.activeQuestId !== QUEST_ID
    || storedHash !== fixedQuestHash
    || currentHash !== fixedQuestHash
    || calculatedHash !== fixedQuestHash
  ) {
    throw new Error(`The locked Soso contract failed its ${stage} hash check.`)
  }
}

function contractEvidence(contract: QuestContract | null, hash: string | null) {
  return {
    visibility: 'server-only-evaluation-evidence',
    questId: QUEST_ID,
    hash,
    contract,
  }
}

function worldDiff(before: DoodleWorld | null, after: DoodleWorld | null) {
  if (!before || !after) return null
  const beforeProps = new Map(before.props.map((prop) => [prop.id, prop]))
  return {
    revision: { before: before.revision, after: after.revision },
    propStatesChanged: after.props.flatMap((prop) => {
      const previous = beforeProps.get(prop.id)
      return previous && previous.state !== prop.state
        ? [{ id: prop.id, before: previous.state, after: prop.state }]
        : []
    }),
    gardenStatesAdded: after.gardenStates.filter((state) => !before.gardenStates.includes(state)),
    creaturesAdded: after.creatures.filter((creature) => (
      !before.creatures.some((previous) => previous.id === creature.id)
    )),
    relationshipRecordsAdded: after.records.filter((record) => (
      !before.records.some((previous) => previous.id === record.id)
    )),
  }
}

async function timedStage<T>(
  stage: string,
  timeline: TimelineEntry[],
  operation: () => Promise<T>,
): Promise<T> {
  const startedAt = new Date().toISOString()
  const started = performance.now()
  try {
    const result = await operation()
    timeline.push({
      stage,
      startedAt,
      endedAt: new Date().toISOString(),
      wallClockMs: Math.max(0, Math.round(performance.now() - started)),
      ok: true,
    })
    return result
  } catch (error) {
    timeline.push({
      stage,
      startedAt,
      endedAt: new Date().toISOString(),
      wallClockMs: Math.max(0, Math.round(performance.now() - started)),
      ok: false,
      error: serializableError(error),
    })
    throw error
  }
}

function parseOptions(args: readonly string[]): Options {
  const values = new Map<string, string>()
  for (const argument of args) {
    const match = /^--([^=]+)=(.+)$/u.exec(argument)
    if (!match?.[1] || !match[2]) {
      throw new Error(`Arguments must use --name=value: ${argument}`)
    }
    values.set(match[1], match[2])
  }
  const known = new Set(['provider', 'runs', 'label', 'output', 'image', 'scenario'])
  const unknown = [...values.keys()].filter((key) => !known.has(key))
  if (unknown.length > 0) throw new Error(`Unknown option(s): ${unknown.join(', ')}`)

  const provider = values.get('provider') ?? 'openai'
  if (provider !== 'openai' && provider !== 'api') {
    throw new Error('--provider must be openai (api is accepted as an alias).')
  }
  const runs = Number(values.get('runs') ?? String(REQUIRED_RUNS))
  if (runs !== REQUIRED_RUNS) {
    throw new Error(`Request-first live evaluation must run exactly ${REQUIRED_RUNS} times.`)
  }
  const scenarioId = safeId(values.get('scenario') ?? DEFAULT_SCENARIO_ID)
  // Validate the longest derived request ID before creating an output directory.
  safeId(`${scenarioId}-r01-resolve`)
  return {
    provider: 'openai',
    runs: REQUIRED_RUNS,
    label: safeLabel(values.get('label') ?? DEFAULT_LABEL),
    outputRoot: resolve(
      values.get('output')
        ?? resolve(repositoryRoot, 'artifacts/doodle-life-evals/request-first-v2'),
    ),
    imagePath: resolve(
      values.get('image')
        ?? resolve(demoDirectory, 'fixtures/soso-last-note-full.jpg'),
    ),
    scenarioId,
  }
}

async function loadEnvironmentFiles(paths: readonly string[]): Promise<void> {
  for (const path of paths) {
    try {
      const parsed = parseEnv(await readFile(path, 'utf8'))
      for (const [key, value] of Object.entries(parsed)) {
        if (!process.env[key]?.trim()) process.env[key] = value
      }
    } catch (error) {
      if (!isRecord(error) || error.code !== 'ENOENT') throw error
    }
  }
}

async function assertEmptyOutputDirectory(path: string): Promise<void> {
  try {
    const entries = await readdir(path)
    if (entries.length > 0) {
      throw new Error(`Evaluation output already exists and will not be overwritten: ${path}`)
    }
  } catch (error) {
    if (isRecord(error) && error.code === 'ENOENT') return
    throw error
  }
}

function inspectImage(buffer: Buffer): {
  readonly mimeType: 'image/png' | 'image/jpeg'
  readonly width: number
  readonly height: number
} {
  if (
    buffer.length >= 24
    && buffer.toString('ascii', 1, 4) === 'PNG'
    && buffer.toString('ascii', 12, 16) === 'IHDR'
  ) {
    return {
      mimeType: 'image/png',
      width: buffer.readUInt32BE(16),
      height: buffer.readUInt32BE(20),
    }
  }

  if (buffer.length >= 4 && buffer[0] === 0xff && buffer[1] === 0xd8) {
    let offset = 2
    while (offset + 8 < buffer.length) {
      if (buffer[offset] !== 0xff) {
        offset += 1
        continue
      }
      const marker = buffer[offset + 1]
      if (marker === undefined) break
      if (marker === 0xd8 || marker === 0xd9) {
        offset += 2
        continue
      }
      const segmentLength = buffer.readUInt16BE(offset + 2)
      if (segmentLength < 2 || offset + 2 + segmentLength > buffer.length) break
      if (isJpegStartOfFrame(marker)) {
        return {
          mimeType: 'image/jpeg',
          height: buffer.readUInt16BE(offset + 5),
          width: buffer.readUInt16BE(offset + 7),
        }
      }
      offset += 2 + segmentLength
    }
  }

  throw new Error('The fixed request-first doodle fixture must be a valid PNG or JPEG.')
}

function isJpegStartOfFrame(marker: number): boolean {
  return [
    0xc0, 0xc1, 0xc2, 0xc3,
    0xc5, 0xc6, 0xc7,
    0xc9, 0xca, 0xcb,
    0xcd, 0xce, 0xcf,
  ].includes(marker)
}

function positiveEnvironmentNumber(name: string, fallback: number): number {
  const parsed = Number(process.env[name])
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
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

function serializableError(error: unknown): unknown {
  if (error instanceof ModelProviderError) {
    return {
      name: error.name,
      message: error.message,
      code: error.code,
      status: error.status,
      trace: error.trace ?? null,
      partialTrace: error.partialTrace ?? null,
    }
  }
  if (error instanceof Error) return { name: error.name, message: error.message }
  return { name: 'UnknownError', value: String(error) }
}

function sanitizeArtifact(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitizeArtifact)
  if (typeof value === 'string') {
    if (value.startsWith('data:image/')) return '[omitted image data URL]'
    const apiKey = process.env.OPENAI_API_KEY
    return apiKey && value.includes(apiKey) ? value.replaceAll(apiKey, '[omitted]') : value
  }
  if (!isRecord(value)) return value
  return Object.fromEntries(Object.entries(value).map(([key, child]) => [
    key,
    ARTIFACT_SECRET_KEYS.has(key) ? '[omitted]' : sanitizeArtifact(child),
  ]))
}

async function writeJson(path: string, value: unknown): Promise<void> {
  await writeFile(path, `${JSON.stringify(sanitizeArtifact(value), null, 2)}\n`, 'utf8')
}

function safeId(value: string): string {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]{2,63}$/u.test(value)) {
    throw new Error(`Unsafe or oversized scenario/request id: ${value}`)
  }
  return value
}

function safeLabel(value: string): string {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{1,79}$/u.test(value)) {
    throw new Error(`Unsafe evaluation label: ${value}`)
  }
  return value
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

import { randomUUID } from 'node:crypto'

import type { TraceSummary } from '../../src/ai/contracts.ts'
import {
  DoodleReadingRequestValidator,
  DoodleReadingSchema,
  EncounterReactionRequestValidator,
  GeneratedGardenSchema,
  NpcReactionSchema,
  ResolveQuestRequestValidator,
  SessionBootstrapRequestValidator,
  SelectQuestRequestValidator,
  toPublicReading,
  type DoodleReading,
  type DoodleReadingRequest,
  type DoodleReadingResponse,
  type DoodleResident,
  type EncounterReactionRequest,
  type EncounterReactionResponse,
  type GeneratedGarden,
  type NpcReaction,
  type QuestContract,
  type ResolveQuestRequest,
  type ResolveQuestResponse,
  type SessionBootstrapRequest,
  type SessionBootstrapResponse,
  type SelectQuestRequest,
  type SelectQuestResponse,
} from '../../src/doodle-life/contracts.ts'
import {
  ModelProviderError,
  createProvider,
  type ModelTrace,
  type StructuredProvider,
  type TokenUsage,
} from '../ai/provider.ts'
import { questBlindDoodleInput, reactionInput, worldAuthorInput } from './context-builder.ts'
import {
  DOODLE_READER_INSTRUCTIONS,
  OBSERVER_REACTION_INSTRUCTIONS,
  OWNER_REACTION_INSTRUCTIONS,
  WORLD_AND_QUEST_AUTHOR_INSTRUCTIONS,
} from './prompts.ts'
import {
  DoodleLifeDomainError,
  applyResolution,
  evaluateQuest,
  questContractHash,
  resolveEncounter,
  validReadingAffordances,
  validateGeneratedGarden,
} from './quest-engine.ts'
import { DoodleLifeSessionStore, type DoodleLifeSession } from './session-store.ts'
import {
  tutorialGarden,
  tutorialReaction,
  tutorialReading,
  uncertainFallbackReading,
} from './tutorial-fixture.ts'

export interface DoodleLifeService {
  readonly providerKind: StructuredProvider['kind']
  bootstrap(request: SessionBootstrapRequest, signal?: AbortSignal): Promise<SessionBootstrapResponse>
  selectQuest(request: SelectQuestRequest): SelectQuestResponse
  readDoodle(request: DoodleReadingRequest, signal?: AbortSignal): Promise<DoodleReadingResponse>
  resolveQuest(request: ResolveQuestRequest): ResolveQuestResponse
  createReactions(
    request: EncounterReactionRequest,
    signal?: AbortSignal,
  ): Promise<EncounterReactionResponse>
  inspectionSnapshot(sessionId: string): DoodleLifeInspectionSnapshot
}

export interface DoodleLifeInspectionSnapshot {
  readonly worldRevision: number
  readonly activeQuestId: string | null
  readonly questHashes: Readonly<Record<string, string>>
  readonly currentQuestHash: string | null
  readonly quests: readonly QuestContract[]
  readonly readCount: number
  readonly readingAffordances: readonly string[]
  readonly verdict: string | null
  readonly encounterCreated: boolean
}

export interface DoodleLifeServiceOptions {
  readonly provider?: StructuredProvider
  readonly sessions?: DoodleLifeSessionStore
  readonly reactionTimeoutMs?: number
}

export function createDoodleLifeService(options: DoodleLifeServiceOptions = {}): DoodleLifeService {
  const provider = options.provider ?? createProvider()
  const sessions = options.sessions ?? new DoodleLifeSessionStore()
  const reactionTimeoutMs = options.reactionTimeoutMs ?? numberFromEnvironment('REACTION_TIMEOUT_MS', 45_000)
  const pendingSessions = new Map<string, Promise<SessionBootstrapResponse>>()

  return {
    providerKind: provider.kind,

    async bootstrap(
      input: SessionBootstrapRequest,
      signal?: AbortSignal,
    ): Promise<SessionBootstrapResponse> {
      const request = SessionBootstrapRequestValidator.parse(input)
      if (sessions.has(request.sessionId)) {
        const session = sessions.get(request.sessionId)
        return bootstrapResponse(session, true, false, null, emptyTrace())
      }
      const pending = pendingSessions.get(request.sessionId)
      if (pending) return pending
      const operation = createSession(request, signal)
      pendingSessions.set(request.sessionId, operation)
      try {
        return await operation
      } finally {
        pendingSessions.delete(request.sessionId)
      }
    },

    selectQuest(input: SelectQuestRequest): SelectQuestResponse {
      const request = SelectQuestRequestValidator.parse(input)
      const selected = sessions.selectQuest(request.sessionId, request.questId, request.expectedRevision)
      return {
        requestId: randomUUID(),
        worldRevision: selected.session.world.revision,
        quest: selected.quest,
      }
    },

    async readDoodle(
      input: DoodleReadingRequest,
      signal?: AbortSignal,
    ): Promise<DoodleReadingResponse> {
      const request = DoodleReadingRequestValidator.parse(input)
      const session = sessions.get(request.sessionId)
      const cached = sessions.cached<DoodleReadingResponse>(session, request.requestId)
      if (cached) return cached
      sessions.assertCanRead(request.sessionId, request.readIndex, request.image)

      const wallStarted = performance.now()
      const traces: ModelTrace[] = []
      let reading: DoodleReading
      let usedFallback = false
      let fallbackReason: string | null = null
      try {
        const result = await provider.generate<DoodleReading>({
          role: 'doodle-reader',
          instructions: DOODLE_READER_INSTRUCTIONS,
          input: questBlindDoodleInput(request),
          schemaName: 'doodle_life_doodle_reading',
          schema: DoodleReadingSchema,
          reasoning: 'low',
          maxOutputTokens: 2_400,
          signal,
          mock: () => tutorialReading('full'),
        })
        traces.push(result.trace)
        validReadingAffordances(result.value)
        reading = result.value
      } catch (error) {
        traces.push(...errorTraces(error))
        usedFallback = true
        fallbackReason = errorCode(error)
        reading = uncertainFallbackReading()
      }
      sessions.saveReading(request.sessionId, reading, request.image)
      const response: DoodleReadingResponse = {
        requestId: request.requestId,
        readIndex: request.readIndex,
        canReread: request.readIndex === 0,
        usedFallback,
        fallbackReason,
        reading: toPublicReading(reading),
        trace: summarizeTrace(traces, performance.now() - wallStarted),
      }
      return sessions.cache(session, request.requestId, response)
    },

    resolveQuest(input: ResolveQuestRequest): ResolveQuestResponse {
      const request = ResolveQuestRequestValidator.parse(input)
      const { session, locked } = sessions.activeQuest(request.sessionId)
      const cached = sessions.cached<ResolveQuestResponse>(session, request.requestId)
      if (cached) return cached
      if (!session.reading || !session.lastImage) {
        throw new DoodleLifeDomainError(
          'Read the doodle before resolving the quest.',
          'reading_required',
          409,
        )
      }
      const wallStarted = performance.now()
      const creatureId = `doodle_${session.lastImage.sha256.slice(0, 20)}`
      const resolution = evaluateQuest(locked.contract, session.reading, creatureId)
      const applied = applyResolution(
        session.world,
        locked.contract,
        session.reading,
        session.lastImage.sha256,
        resolution,
      )
      sessions.saveResolution(
        request.sessionId,
        request.expectedRevision,
        applied.world,
        resolution,
        applied.view,
      )
      const response: ResolveQuestResponse = {
        requestId: request.requestId,
        baseRevision: request.expectedRevision,
        nextWorld: structuredClone(applied.world),
        result: structuredClone(applied.view),
        reading: toPublicReading(session.reading),
        trace: summarizeTrace([], performance.now() - wallStarted),
      }
      return sessions.cache(session, request.requestId, response)
    },

    async createReactions(
      input: EncounterReactionRequest,
      signal?: AbortSignal,
    ): Promise<EncounterReactionResponse> {
      const request = EncounterReactionRequestValidator.parse(input)
      const { session, locked } = sessions.activeQuest(request.sessionId)
      const cached = sessions.cached<EncounterReactionResponse>(session, request.requestId)
      if (cached) return cached
      sessions.assertRevision(request.sessionId, request.expectedRevision)
      if (!session.resolution || !session.resolutionView || !session.reading) {
        throw new DoodleLifeDomainError(
          'Resolve the quest before asking residents to react.',
          'resolution_required',
          409,
        )
      }
      if (session.encounter) {
        const response: EncounterReactionResponse = {
          requestId: request.requestId,
          worldRevision: session.world.revision,
          encounter: structuredClone(session.encounter),
          trace: emptyTrace(),
        }
        return sessions.cache(session, request.requestId, response)
      }

      const wallStarted = performance.now()
      const questView = sessions.publicQuests(session).find((quest) => quest.questId === locked.contract.questId)
      const owner = session.world.residents.find((resident) => resident.id === locked.contract.ownerNpcId)
      const observer = session.world.residents.find((resident) => resident.id === locked.contract.observerNpcId)
      if (!questView || !owner || !observer) {
        throw new DoodleLifeDomainError(
          'Reaction context is missing its quest owner or observer.',
          'reaction_context_invalid',
          422,
        )
      }
      const reading = toPublicReading(session.reading)
      const allowedPropIds = session.resolution.effects.flatMap((effect) => (
        effect.kind === 'prop-state' || (effect.kind === 'garden-state' && effect.targetId)
          ? [effect.targetId]
          : []
      )).filter((value): value is string => Boolean(value))
      const baseContext = {
        owner,
        observer,
        quest: questView,
        reading,
        result: session.resolutionView,
        creatureId: session.resolution.creatureId,
        allowedPropIds,
      }
      const settled = await Promise.allSettled([
        reactionCall(
          owner,
          OWNER_REACTION_INSTRUCTIONS,
          'quest-owner-reaction',
          baseContext,
          signal,
        ),
        reactionCall(
          observer,
          OBSERVER_REACTION_INSTRUCTIONS,
          'quest-observer-reaction',
          baseContext,
          signal,
        ),
      ])
      const traces = settled.flatMap((result) => (
        result.status === 'fulfilled' ? [result.value.trace] : errorTraces(result.reason)
      ))
      const values = settled.map((result) => result.status === 'fulfilled' ? result.value.value : null)
      const encounter = resolveEncounter(
        session.world,
        locked.contract,
        session.resolution,
        [
          { expectedActorId: owner.id, value: values[0] ?? null },
          { expectedActorId: observer.id, value: values[1] ?? null },
        ],
      )
      sessions.saveEncounter(request.sessionId, encounter)
      const response: EncounterReactionResponse = {
        requestId: request.requestId,
        worldRevision: session.world.revision,
        encounter,
        trace: summarizeTrace(traces, performance.now() - wallStarted),
      }
      return sessions.cache(session, request.requestId, response)

      async function reactionCall(
        actor: DoodleResident,
        instructions: string,
        role: string,
        context: Omit<Parameters<typeof reactionInput>[0], 'actor'>,
        parentSignal?: AbortSignal,
      ) {
        const controller = linkedTimeoutController(parentSignal, reactionTimeoutMs)
        try {
          return await provider.generate<NpcReaction>({
            role,
            instructions,
            input: reactionInput({ ...context, actor }),
            schemaName: 'doodle_life_npc_reaction',
            schema: NpcReactionSchema,
            reasoning: 'low',
            maxOutputTokens: 900,
            signal: controller.signal,
            mock: () => tutorialReaction(actor.id, session.resolution?.verdict ?? 'unexpected', session.resolution?.creatureId ?? 'doodle_unknown'),
          })
        } finally {
          controller.dispose()
        }
      }
    },

    inspectionSnapshot(sessionId: string): DoodleLifeInspectionSnapshot {
      const session = sessions.get(sessionId)
      const locked = session.activeQuestId ? session.quests.get(session.activeQuestId) : undefined
      return {
        worldRevision: session.world.revision,
        activeQuestId: session.activeQuestId,
        questHashes: Object.fromEntries([...session.quests].map(([id, quest]) => [id, quest.hash])),
        currentQuestHash: locked ? questContractHash(locked.contract) : null,
        quests: [...session.quests.values()].map(({ contract }) => structuredClone(contract)),
        readCount: session.readCount,
        readingAffordances: session.reading ? validReadingAffordances(session.reading) : [],
        verdict: session.resolution?.verdict ?? null,
        encounterCreated: session.encounter !== null,
      }
    },
  }

  async function createSession(
    request: SessionBootstrapRequest,
    signal?: AbortSignal,
  ): Promise<SessionBootstrapResponse> {
    const wallStarted = performance.now()
    const traces: ModelTrace[] = []
    let garden: GeneratedGarden
    let usedFallback = false
    let fallbackReason: string | null = null
    try {
      const generated = await provider.generate<GeneratedGarden>({
        role: 'world-and-quest-author',
        instructions: WORLD_AND_QUEST_AUTHOR_INSTRUCTIONS,
        input: worldAuthorInput(request.sessionId),
        schemaName: 'doodle_life_world_and_locked_quests',
        schema: GeneratedGardenSchema,
        reasoning: 'medium',
        maxOutputTokens: 6_000,
        signal,
        mock: tutorialGarden,
      })
      traces.push(generated.trace)
      garden = validateGeneratedGarden(generated.value)
    } catch (error) {
      traces.push(...errorTraces(error))
      usedFallback = true
      fallbackReason = errorCode(error)
      garden = validateGeneratedGarden(tutorialGarden())
    }
    const session = sessions.create(request.sessionId, garden)
    return bootstrapResponse(
      session,
      false,
      usedFallback,
      fallbackReason,
      summarizeTrace(traces, performance.now() - wallStarted),
    )
  }
}

function bootstrapResponse(
  session: DoodleLifeSession,
  cached: boolean,
  usedFallback: boolean,
  fallbackReason: string | null,
  trace: TraceSummary,
): SessionBootstrapResponse {
  return {
    requestId: randomUUID(),
    cached,
    usedFallback,
    fallbackReason,
    world: structuredClone(session.world),
    quests: [...session.quests.values()].map(({ contract }) => ({
      questId: contract.questId,
      ownerNpcId: contract.ownerNpcId,
      title: contract.title,
      problemState: contract.problemState,
      primaryPurpose: contract.primaryPurpose,
      clues: structuredClone(contract.clues),
      status: session.resolvedQuestIds.has(contract.questId) ? 'resolved' : 'available',
    })),
    trace,
  }
}

function summarizeTrace(calls: readonly ModelTrace[], wallClockMs: number): TraceSummary {
  const usage = calls.reduce<TokenUsage>((sum, call) => ({
    inputTokens: sum.inputTokens + call.usage.inputTokens,
    cachedInputTokens: sum.cachedInputTokens + call.usage.cachedInputTokens,
    outputTokens: sum.outputTokens + call.usage.outputTokens,
    reasoningTokens: sum.reasoningTokens + call.usage.reasoningTokens,
    totalTokens: sum.totalTokens + call.usage.totalTokens,
  }), emptyUsage())
  return {
    mode: 'staged',
    calls,
    usage,
    totalLatencyMs: calls.reduce((sum, call) => sum + call.latencyMs, 0),
    wallClockMs: Math.max(0, Math.round(wallClockMs)),
  }
}

function emptyTrace(): TraceSummary {
  return summarizeTrace([], 0)
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

function errorTraces(error: unknown): readonly ModelTrace[] {
  if (!(error instanceof ModelProviderError)) return []
  const calls = [...(error.partialTrace?.calls ?? [])]
  if (error.trace) calls.push(error.trace)
  return [...new Map(calls.map((call) => [call.id, call])).values()]
}

function errorCode(error: unknown): string {
  if (error instanceof ModelProviderError) return error.code
  if (error instanceof Error) return error.name
  return 'unknown_error'
}

function linkedTimeoutController(parentSignal: AbortSignal | undefined, timeoutMs: number): {
  readonly signal: AbortSignal
  dispose(): void
} {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(new Error('Reaction timed out.')), timeoutMs)
  const abort = (): void => controller.abort(parentSignal?.reason)
  if (parentSignal?.aborted) abort()
  else parentSignal?.addEventListener('abort', abort, { once: true })
  return {
    signal: controller.signal,
    dispose(): void {
      clearTimeout(timeout)
      parentSignal?.removeEventListener('abort', abort)
    },
  }
}

function numberFromEnvironment(name: string, fallback: number): number {
  const value = Number(process.env[name])
  return Number.isFinite(value) && value > 0 ? value : fallback
}

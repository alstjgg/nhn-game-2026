import { randomUUID } from 'node:crypto'
import type {
  AutonomyMode,
  BootstrapRequest,
  BootstrapResponse,
  CharacterBible,
  CriticReview,
  DialoguePass,
  DoodleBirthRequest,
  DoodleBirthResponse,
  GeneratedScene,
  NPCIntent,
  TraceSummary,
  WorldState,
  WorldTurnRequest,
  WorldTurnResponse,
} from '../../src/ai/contracts.ts'
import { buildPrivateMindContext, buildPublicWorldContext } from '../../src/world/context-builder.ts'
import {
  BootstrapRequestValidator,
  CharacterBibleSchema,
  CriticReviewSchema,
  CriticReviewValidator,
  DialoguePassSchema,
  DialoguePassValidator,
  DoodleBirthRequestValidator,
  GeneratedSceneSchema,
  NPCIntentSchema,
  NPCIntentValidator,
  WorldStateSchema,
  WorldTurnRequestValidator,
  parseCharacterBible,
  parseGeneratedScene,
  parseWorldState,
} from '../../src/ai/contracts.ts'
import {
  CRITIC_INSTRUCTIONS,
  DIALOGUE_WRITER_INSTRUCTIONS,
  DIRECTOR_INSTRUCTIONS,
  DOODLE_VISION_INSTRUCTIONS,
  NPC_MIND_INSTRUCTIONS,
  WORLD_AUTHOR_INSTRUCTIONS,
  asWorldInput,
} from './prompts.ts'
import {
  ModelProviderError,
  createProvider,
  type ModelTrace,
  type ProviderKind,
  type StructuredProvider,
  type StructuredResult,
  type TokenUsage,
} from './provider.ts'

export interface AutonomousGarden {
  readonly providerKind: ProviderKind
  bootstrap(request: BootstrapRequest, signal?: AbortSignal): Promise<BootstrapResponse>
  doodleBirth(request: DoodleBirthRequest, signal?: AbortSignal): Promise<DoodleBirthResponse>
  worldTurn(request: WorldTurnRequest, signal?: AbortSignal): Promise<WorldTurnResponse>
}

export interface AutonomousGardenOptions {
  readonly provider?: StructuredProvider
  readonly autonomy?: string
}

export function createAutonomousGarden(options: AutonomousGardenOptions = {}): AutonomousGarden {
  const provider = options.provider ?? createProvider()
  const configuredAutonomy = options.autonomy ?? process.env.AI_AUTONOMY
  const autonomyOverride = configuredAutonomy ? normalizeAutonomy(configuredAutonomy) : null

  return {
    providerKind: provider.kind,
    bootstrap: (request, signal) => bootstrap(provider, autonomyOverride, request, signal),
    doodleBirth: (request, signal) => doodleBirth(provider, autonomyOverride, request, signal),
    worldTurn: (request, signal) => worldTurn(provider, autonomyOverride, request, signal),
  }
}

function normalizeAutonomy(value: string | undefined): 'full-max' | 'full-selective' | 'director-only' | 'dialogue-only' | 'off' {
  switch (value) {
    case 'full-selective':
    case 'director-only':
    case 'dialogue-only':
    case 'off':
      return value
    default:
      return 'full-max'
  }
}

function invalidRequest(
  label: string,
  issues: readonly { readonly path: readonly PropertyKey[]; readonly message: string }[],
): ModelProviderError {
  const detail = issues.slice(0, 5).map((issue) => `${issue.path.join('.') || '$'}: ${issue.message}`).join('; ')
  return new ModelProviderError(`${label}: ${detail}`, 'invalid_request', 400)
}

function parseModelOutput<T>(label: string, value: unknown, parser: (input: unknown) => T): T {
  try {
    return parser(value)
  } catch {
    throw new ModelProviderError(`${label} output did not satisfy the shared runtime contract.`, 'model_schema_error', 502)
  }
}

function validateBootstrapWorld(world: WorldState, canonical: boolean): void {
  const ids = new Set(world.residents.map((resident) => resident.id))
  const duplicateResidents = ids.size !== world.residents.length
  const brokenReference = world.relationships.some((entry) => !ids.has(entry.sourceId) || !ids.has(entry.targetId))
    || world.memories.some((entry) => !ids.has(entry.ownerId))
    || world.openThreads.some((thread) => thread.participantIds.some((id) => !ids.has(id)))
    || world.recentScenes.some((scene) => scene.participantIds.some((id) => !ids.has(id)))
  if ((canonical && world.revision !== 0) || world.residents.length !== 4 || duplicateResidents || brokenReference) {
    throw new ModelProviderError('World Author returned an invalid cast topology or broken reference.', 'invalid_authored_world', 422)
  }
  for (const resident of world.residents) {
    validateCharacterSemantics(resident, canonical ? 'npc' : resident.kind)
  }
}

function canonicalizeAuthoredWorld(world: WorldState, seed: string): WorldState {
  const residentIds = new Map(world.residents.map((resident, index) => [
    resident.id,
    `npc-${index + 1}-${stableHash(`${seed}:${resident.id}:${index}`).toString(36)}`,
  ]))
  const remapResident = (id: string): string => residentIds.get(id) ?? id

  return parseWorldState({
    ...world,
    id: `world-${stableHash(seed).toString(36)}`,
    revision: 0,
    residents: world.residents.map((resident) => ({
      ...resident,
      id: remapResident(resident.id),
      kind: 'npc' as const,
    })),
    relationships: world.relationships.map((relationshipEntry) => ({
      ...relationshipEntry,
      sourceId: remapResident(relationshipEntry.sourceId),
      targetId: remapResident(relationshipEntry.targetId),
    })),
    memories: world.memories.map((memory) => ({
      ...memory,
      ownerId: remapResident(memory.ownerId),
    })),
    openThreads: world.openThreads.map((thread) => ({
      ...thread,
      participantIds: thread.participantIds.map(remapResident),
    })),
    recentScenes: world.recentScenes.map((recentScene) => ({
      ...recentScene,
      participantIds: recentScene.participantIds.map(remapResident),
    })),
  })
}

function validateCharacterSemantics(character: CharacterBible, expectedKind: CharacterBible['kind']): void {
  const generatedPartIds = character.design.parts.map((part) => part.id)
  const partIds = new Set(['body', ...generatedPartIds])
  const traitIds = new Set(character.traits.map((traitItem) => traitItem.id))
  const invalid = character.kind !== expectedKind
    || new Set(generatedPartIds).size !== generatedPartIds.length
    || generatedPartIds.includes('body')
    || traitIds.size !== character.traits.length
    || character.design.expressivePartIds.some((id) => !partIds.has(id))
    || character.design.idleMotions.some((motion) => motion.targetPartId !== null && !partIds.has(motion.targetPartId))
  if (invalid) {
    throw new ModelProviderError(`Generated character ${character.id} has invalid kind, duplicate IDs, or motion references.`, 'invalid_character_semantics', 422)
  }
}

function validateIntent(intent: NPCIntent, resident: CharacterBible, world: WorldState): void {
  const residentIds = new Set(world.residents.map((candidate) => candidate.id))
  const traitIds = new Set(resident.traits.map((traitItem) => traitItem.id))
  const invalid = intent.npcId !== resident.id
    || (intent.targetActorId !== null && (!residentIds.has(intent.targetActorId) || intent.targetActorId === resident.id))
    || intent.traitGrounding.some((id) => !traitIds.has(id))
  if (invalid) {
    throw new ModelProviderError(`NPC Mind for ${resident.id} returned mismatched identity, target, or trait grounding.`, 'invalid_npc_intent', 422)
  }
}

async function bootstrap(
  provider: StructuredProvider,
  autonomyOverride: AutonomyMode | null,
  input: BootstrapRequest,
  signal?: AbortSignal,
): Promise<BootstrapResponse> {
  const wallStarted = performance.now()
  const parsedRequest = BootstrapRequestValidator.safeParse(input)
  if (!parsedRequest.success) throw invalidRequest('Invalid bootstrap request', parsedRequest.error.issues)
  const request = parsedRequest.data
  const seed = request.sessionId ?? 'doodle-life-demo'
  const mode = autonomyOverride ?? request.autonomy
  const traces: ModelTrace[] = []
  try {
    let authoredValue: unknown = mockWorld(seed)
    if (mode !== 'off') {
      const authored = await provider.generate<WorldState>({
        role: 'world-author',
        instructions: WORLD_AUTHOR_INSTRUCTIONS,
        input: [{ type: 'input_text', text: asWorldInput({ seed, locale: request.locale, autonomy: mode }) }],
        schemaName: 'doodle_life_world',
        schema: WorldStateSchema,
        reasoning: 'medium',
        maxOutputTokens: 8_000,
        signal,
        mock: () => mockWorld(seed),
      })
      authoredValue = authored.value
      traces.push(authored.trace)
    }

    const world = parseModelOutput('World Author', authoredValue, parseWorldState)
    validateBootstrapWorld(world, false)
    const canonicalWorld = canonicalizeAuthoredWorld(world, seed)
    validateBootstrapWorld(canonicalWorld, true)
    return makeBootstrapResponse(request, canonicalWorld, summarizeTrace(mode, traces, performance.now() - wallStarted))
  } catch (error) {
    throwWithPartialTrace(error, mode, traces, wallStarted)
  }
}

async function doodleBirth(
  provider: StructuredProvider,
  autonomyOverride: AutonomyMode | null,
  input: DoodleBirthRequest,
  signal?: AbortSignal,
): Promise<DoodleBirthResponse> {
  const wallStarted = performance.now()
  const parsedRequest = DoodleBirthRequestValidator.safeParse(input)
  if (!parsedRequest.success) throw invalidRequest('Invalid doodle-birth request', parsedRequest.error.issues)
  const request = parsedRequest.data
  const mode = autonomyOverride ?? request.autonomy
  const expectedImagePrefix = `data:${request.image.mimeType};base64,`
  if (!request.image.dataUrl.startsWith(expectedImagePrefix) || !/^[a-zA-Z0-9+/]+={0,2}$/.test(request.image.dataUrl.slice(expectedImagePrefix.length))) {
    throw new ModelProviderError('Doodle image data must be base64 and match its declared MIME type.', 'invalid_image_payload', 400)
  }
  const traces: ModelTrace[] = []
  try {
    let bornValue: unknown = mockDoodleCharacter(request)
    if (mode !== 'off') {
      const born = await provider.generate<CharacterBible>({
        role: 'doodle-vision',
        instructions: DOODLE_VISION_INSTRUCTIONS,
        input: [
          {
            type: 'input_text',
            text: asWorldInput({
              requestId: request.requestId,
              expectedRevision: request.expectedRevision,
              imageMetadata: {
                mimeType: request.image.mimeType,
                width: request.image.width,
                height: request.image.height,
                sha256: request.image.sha256,
              },
              drawingMetrics: request.drawingMetrics ?? null,
            }),
          },
          { type: 'input_image', image_url: request.image.dataUrl, detail: 'high' },
        ],
        schemaName: 'doodle_life_character',
        schema: CharacterBibleSchema,
        reasoning: 'low',
        maxOutputTokens: 4_000,
        signal,
        mock: () => mockDoodleCharacter(request),
      })
      bornValue = born.value
      traces.push(born.trace)
    }

    const interpreted = parseModelOutput('Doodle VLM', bornValue, parseCharacterBible)
    const character: CharacterBible = {
      ...interpreted,
      id: `player-${randomUUID()}`,
      kind: 'player',
    }
    validateCharacterSemantics(character, 'player')
    return makeDoodleBirthResponse(request, character, summarizeTrace(mode, traces, performance.now() - wallStarted))
  } catch (error) {
    throwWithPartialTrace(error, mode, traces, wallStarted)
  }
}

async function worldTurn(
  provider: StructuredProvider,
  autonomyOverride: AutonomyMode | null,
  input: WorldTurnRequest,
  signal?: AbortSignal,
): Promise<WorldTurnResponse> {
  const wallStarted = performance.now()
  const parsedRequest = WorldTurnRequestValidator.safeParse(input)
  if (!parsedRequest.success) throw invalidRequest('Invalid world-turn request', parsedRequest.error.issues)
  const request = parsedRequest.data
  const mode = autonomyOverride ?? request.autonomy
  if (request.world.revision !== request.expectedRevision) {
    throw new ModelProviderError(
      `World revision ${request.world.revision} does not match expected revision ${request.expectedRevision}.`,
      'revision_conflict',
      409,
    )
  }
  if (!request.world.residents.some((resident) => resident.id === request.signal.actorId)) {
    throw new ModelProviderError(`Signal actor ${request.signal.actorId} does not exist in this world.`, 'unknown_signal_actor', 422)
  }

  const traces: ModelTrace[] = []
  try {
    const residents = selectThinkingResidents(request, mode)
    let mindResults: StructuredResult<NPCIntent>[] = []
    if (mode !== 'director-only' && mode !== 'dialogue-only' && mode !== 'off') {
      const settled = await Promise.allSettled(residents.map((resident, index) => provider.generate<NPCIntent>({
        role: 'npc-mind',
        instructions: NPC_MIND_INSTRUCTIONS,
        input: [{
          type: 'input_text',
          text: asWorldInput(privateMindContext(request, resident)),
        }],
        schemaName: 'doodle_life_npc_intent',
        schema: NPCIntentSchema,
        reasoning: 'low',
        maxOutputTokens: 1_200,
        signal,
        mock: () => mockIntent(resident, request, index),
      })))
      for (const result of settled) {
        if (result.status === 'fulfilled') traces.push(result.value.trace)
        else if (result.reason instanceof ModelProviderError && result.reason.trace) traces.push(result.reason.trace)
      }
      const rejected = settled.find((result): result is PromiseRejectedResult => result.status === 'rejected')
      if (rejected) throw rejected.reason
      mindResults = settled.map((result) => (result as PromiseFulfilledResult<StructuredResult<NPCIntent>>).value)
    }

    const intents = mindResults.map((result, index) => {
      const intent = parseModelOutput('NPC Mind', result.value, (value) => NPCIntentValidator.parse(value))
      validateIntent(intent, residents[index] as CharacterBible, request.world)
      return intent
    })
    let proposedScene: GeneratedScene
    let critic: CriticReview

    if (mode === 'off') {
      proposedScene = mockScene(request, intents)
      critic = mockCritic(proposedScene)
    } else if (mode === 'dialogue-only') {
      const scaffold = mockScene(request, intents)
      const dialogue = await provider.generate<DialoguePass>({
        role: 'dialogue-writer',
        instructions: DIALOGUE_WRITER_INSTRUCTIONS,
        input: [{
          type: 'input_text',
          text: asWorldInput({ signal: request.signal, world: publicWorldContext(request.world), sceneScaffold: scaffold }),
        }],
        schemaName: 'doodle_life_dialogue_pass',
        schema: DialoguePassSchema,
        reasoning: 'low',
        maxOutputTokens: 1_600,
        signal,
        mock: () => mockDialoguePass(scaffold),
      })
      traces.push(dialogue.trace)
      const dialoguePass = parseModelOutput('Dialogue Writer', dialogue.value, (value) => DialoguePassValidator.parse(value))
      proposedScene = applyDialoguePass(scaffold, dialoguePass)
      critic = mockCritic(proposedScene)
    } else {
      const directed = await provider.generate<GeneratedScene>({
        role: 'world-director',
        instructions: DIRECTOR_INSTRUCTIONS,
        input: [{
          type: 'input_text',
          text: asWorldInput({
            autonomy: mode,
            signal: request.signal,
            world: publicWorldContext(request.world),
            independentIntents: intents,
          }),
        }],
        schemaName: 'doodle_life_scene',
        schema: GeneratedSceneSchema,
        reasoning: 'medium',
        maxOutputTokens: 5_000,
        signal,
        mock: () => mockScene(request, intents),
      })
      traces.push(directed.trace)
      const reviewed = await provider.generate<CriticReview>({
        role: 'continuity-critic',
        instructions: CRITIC_INSTRUCTIONS,
        input: [{
          type: 'input_text',
          text: asWorldInput({
            signal: request.signal,
            world: publicWorldContext(request.world),
            independentIntents: intents,
            privateContinuity: privateCriticContext(request.world),
            proposedScene: directed.value,
          }),
        }],
        schemaName: 'doodle_life_critic_review',
        schema: CriticReviewSchema,
        reasoning: 'low',
        maxOutputTokens: 5_000,
        signal,
        mock: () => mockCritic(directed.value),
      })
      traces.push(reviewed.trace)
      proposedScene = parseModelOutput('World Director', directed.value, parseGeneratedScene)
      critic = parseModelOutput('Continuity Critic', reviewed.value, (value) => CriticReviewValidator.parse(value))
    }

    const approvedScene = sceneFromReview(critic, proposedScene)
    validateSceneReferences(approvedScene, request.world, request.signal)
    const nextWorld = applySceneToWorld(request.world, approvedScene)
    validateWorldProgress(request.world, nextWorld, approvedScene)
    return makeWorldTurnResponse(
      request,
      intents,
      proposedScene,
      critic,
      approvedScene,
      nextWorld,
      summarizeTrace(mode, traces, performance.now() - wallStarted),
    )
  } catch (error) {
    throwWithPartialTrace(error, mode, traces, wallStarted)
  }
}

// The contract-specific builders and deterministic demo fixtures live below.
// Keeping them isolated makes the OpenAI orchestration identical to mock mode.

function stableHash(value: string): number {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function summarizeTrace(mode: AutonomyMode, calls: readonly ModelTrace[], wallClockMs: number): TraceSummary {
  const usage = calls.reduce<TokenUsage>((sum, call) => ({
    inputTokens: sum.inputTokens + call.usage.inputTokens,
    cachedInputTokens: sum.cachedInputTokens + call.usage.cachedInputTokens,
    outputTokens: sum.outputTokens + call.usage.outputTokens,
    reasoningTokens: sum.reasoningTokens + call.usage.reasoningTokens,
    totalTokens: sum.totalTokens + call.usage.totalTokens,
  }), { inputTokens: 0, cachedInputTokens: 0, outputTokens: 0, reasoningTokens: 0, totalTokens: 0 })

  return {
    mode,
    calls,
    usage,
    totalLatencyMs: calls.reduce((sum, call) => sum + call.latencyMs, 0),
    wallClockMs: Math.max(0, Math.round(wallClockMs)),
  }
}

function throwWithPartialTrace(
  error: unknown,
  mode: AutonomyMode,
  completedCalls: readonly ModelTrace[],
  wallStarted: number,
): never {
  if (!(error instanceof ModelProviderError)) throw error
  const calls = [...completedCalls]
  if (error.partialTrace) calls.push(...error.partialTrace.calls)
  if (error.trace) calls.push(error.trace)
  const deduplicated = [...new Map(calls.map((call) => [call.id, call])).values()]
  throw new ModelProviderError(
    error.message,
    error.code,
    error.status,
    error.trace,
    summarizeTrace(mode, deduplicated, performance.now() - wallStarted),
  )
}

function mockWorld(seed: string): WorldState {
  const variation = stableHash(seed) % 3
  const residents = [mockMoa(), mockGori(), mockPurureuk(), mockBamtol()]
  if (variation === 1) residents.push(residents.shift() as CharacterBible)
  if (variation === 2) residents.unshift(residents.pop() as CharacterBible)

  return {
    id: `garden_${stableHash(seed).toString(36)}`,
    revision: 0,
    title: '바람 자국 정원',
    premise: '말보다 몸짓이 먼저 도착하고, 서로의 버릇이 매번 새로운 작은 사건을 만드는 정원.',
    locationDescription: '기울어진 온실과 얕은 물길, 높은 풍향 리본, 단추가 굴러다니는 공방 마당이 이어져 있다.',
    atmosphere: ['낮은 바람과 유리 종 소리', '잎 그림자가 느리게 이동하는 오후', '비 오기 전의 포근한 정적'][variation] ?? '낮은 바람',
    clock: '첫째 날 · 늦은 오후',
    residents,
    relationships: [
      relationship('npc_moa', 'npc_gori', 0.26, 0.42, 0.08, '말없이 물건을 건네는 사이'),
      relationship('npc_gori', 'npc_moa', 0.12, 0.31, 0.18, '도움을 받으면 조금 당황하는 사이'),
      relationship('npc_purureuk', 'npc_bamtol', 0.18, 0.24, 0.32, '빛을 꺼내 보고 싶어 하는 사이'),
      relationship('npc_bamtol', 'npc_purureuk', 0.08, 0.38, 0.22, '시끄럽지만 기다려 보는 사이'),
    ],
    memories: [],
    openThreads: [
      {
        id: 'thread_empty_chime',
        title: '아무도 울리지 않은 종',
        description: '정원 중앙의 유리 종은 바람이 불어도 한쪽 음만 비워 둔다.',
        participantIds: ['npc_moa', 'npc_purureuk'],
        status: 'open',
        createdSceneId: null,
      },
    ],
    recentScenes: [],
  }
}

function mockMoa(): CharacterBible {
  return {
    id: 'npc_moa',
    kind: 'npc',
    name: '모아',
    epithet: '빈 소리를 주워 담는 물방울',
    essence: '대화 중 생긴 침묵을 버려진 물건처럼 발견하고 조심스럽게 간직한다.',
    origin: '새벽마다 온실 천장에서 떨어지던 네 번째 물방울이 어느 날 바닥에 닿지 않고 눈을 떴다.',
    traits: [
      trait('quiet_collector', '침묵 수집가', '말 사이에 생긴 빈 시간을 소중한 것으로 여긴다.', '옆구리의 투명 주머니가 조용할수록 부푼다.', '누군가 머뭇거리면 재촉하지 않고 그 침묵 곁에 선다.', 0.96),
      trait('borrowed_courage', '빌린 용기', '혼자서는 뒤로 물러나지만 누군가의 작은 신호를 받으면 오래 버틴다.', '한쪽 발만 먼저 길게 내민 뒤 상대를 확인한다.', '믿는 상대가 곁에 있으면 낯선 소리에도 다가간다.', 0.9),
      trait('echo_memory', '메아리 기억', '한 번 들은 짧은 리듬을 몸 안에서 되풀이할 수 있다.', '몸속 작은 점들이 들은 박자대로 떠오른다.', '말보다 리듬을 통해 상대를 기억한다.', 0.88),
    ],
    drives: ['버려진 소리와 침묵에 자리를 찾아 주기'],
    needs: ['대답을 강요하지 않는 동행'],
    boundaries: ['큰 소리로 갑자기 둘러싸이면 몸을 납작하게 접는다.'],
    abilities: ['짧은 소리를 투명한 방울 안에 잠시 보관한다.'],
    visibleSignals: ['주머니가 부풀면 누군가의 말을 더 듣고 싶다는 뜻이다.', '발끝이 흐려지면 물러날 시간이 필요하다.'],
    voice: { rhythm: '긴 쉼 뒤에 짧은 한 문장', vocabulary: '빈자리, 아직, 천천히, 들렸어', sampleLine: '아직 말하지 않아도 돼. 빈자리도 같이 들을게.' },
    motion: { idle: '몸속 점들이 느린 박자로 위아래를 오간다.', approach: '한쪽 발을 길게 내밀고 나머지 몸이 따라간다.', delight: '주머니 속 점들이 작은 원을 그린다.', discomfort: '몸을 얇은 물방울 모양으로 접는다.' },
    mood: '조심스러운 호기심',
    currentGoal: '유리 종에서 비어 있는 한 음이 누구를 기다리는지 알아내고 싶다.',
    homePosition: { x: 0.23, y: 0.62 },
    design: {
      silhouette: '아래는 넓고 위는 길게 휘어진 비대칭 물방울',
      palette: ['#79a9bd', '#d9f2ef', '#415d69'],
      body: { kind: 'path', d: 'M50 5 C74 30 88 54 78 78 C68 101 29 104 17 79 C6 56 26 30 50 5 Z', fill: '#79a9bd', stroke: '#415d69', strokeWidth: 3, opacity: 1 },
      parts: [
        { id: 'pocket', shape: { kind: 'ellipse', cx: 56, cy: 67, rx: 17, ry: 20, fill: '#d9f2ef', stroke: '#415d69', strokeWidth: 2, opacity: 0.72 }, zIndex: 2 },
        { id: 'long_foot', shape: { kind: 'line', x1: 34, y1: 88, x2: 20, y2: 104, linecap: 'round', fill: '#415d69', stroke: '#415d69', strokeWidth: 6, opacity: 1 }, zIndex: 0 },
      ],
      faceAnchors: { leftEye: { x: 38, y: 48 }, rightEye: { x: 55, y: 45 }, mouth: { x: 48, y: 57 } },
      expressivePartIds: ['pocket', 'long_foot'],
      idleMotions: [
        { targetPartId: 'pocket', property: 'scale', from: 0.96, to: 1.04, durationMs: 2800, delayMs: 0 },
        { targetPartId: null, property: 'translateY', from: -2, to: 2, durationMs: 3400, delayMs: 300 },
      ],
    },
  }
}

function mockGori(): CharacterBible {
  return {
    id: 'npc_gori',
    kind: 'npc',
    name: '고리',
    epithet: '매듭을 풀지 않고 이해하는 등짐꾼',
    essence: '복잡한 것을 없애기보다 어느 고리가 어디로 이어지는지 몸으로 익힌다.',
    origin: '공방 바닥의 실패한 매듭들이 밤새 서로 기대어 세운 작은 몸에서 태어났다.',
    traits: [
      trait('knot_reader', '매듭 읽기', '얽힌 관계와 물건의 힘이 향하는 방향을 알아챈다.', '등의 세 고리가 서로 다른 각도로 기울어 있다.', '갈등을 바로 풀기보다 각자의 당김을 먼저 확인한다.', 0.94),
      trait('sideways_help', '옆으로 돕기', '도움을 드러내면 상대가 부담스러울까 봐 옆을 보며 거든다.', '손이 몸의 정면이 아니라 양옆에서 길게 나온다.', '칭찬받으면 다른 물건을 만지는 척한다.', 0.91),
      trait('weight_hum', '무게의 콧노래', '든 물건의 무게에 따라 낮은 음을 낸다.', '무거울수록 몸의 삼각 면이 넓어진다.', '함께 드는 상대와 자연스럽게 박자가 맞는다.', 0.87),
    ],
    drives: ['서로 다른 힘이 끊어지지 않고 이어질 방법 찾기'],
    needs: ['도움을 받는 것도 일의 일부라는 확인'],
    boundaries: ['등의 가장 작은 고리를 허락 없이 당기는 것을 싫어한다.'],
    abilities: ['끊어진 끈의 장력을 보고 원래 연결을 짐작한다.'],
    visibleSignals: ['옆손이 먼저 움직이면 돕고 싶다는 뜻이다.', '등 고리가 모두 서면 경계하고 있다.'],
    voice: { rhythm: '낮은 콧소리와 짧은 작업어', vocabulary: '이쪽, 당김, 잠깐 받쳐, 됐어', sampleLine: '풀지 마. 네 쪽 당김도 모양의 일부야.' },
    motion: { idle: '세모난 몸이 좌우로 아주 조금 무게를 옮긴다.', approach: '옆걸음으로 반원을 그리며 다가간다.', delight: '등 고리들이 차례로 통통 튄다.', discomfort: '양옆 손을 몸 뒤로 감춘다.' },
    mood: '할 일을 찾는 평온함',
    currentGoal: '끊어진 풍향 리본을 아무것도 버리지 않고 다시 잇고 싶다.',
    homePosition: { x: 0.72, y: 0.7 },
    design: {
      silhouette: '낮고 넓은 사다리꼴 몸 위에 크기가 다른 고리 세 개',
      palette: ['#c68b59', '#f5cf88', '#684b42'],
      body: { kind: 'polygon', points: [{ x: 17, y: 88 }, { x: 30, y: 35 }, { x: 73, y: 30 }, { x: 91, y: 88 }], fill: '#c68b59', stroke: '#684b42', strokeWidth: 3, opacity: 1 },
      parts: [
        { id: 'back_loop_left', shape: { kind: 'ellipse', cx: 38, cy: 29, rx: 14, ry: 20, fill: '#f5cf88', stroke: '#684b42', strokeWidth: 4, opacity: 1 }, zIndex: -1 },
        { id: 'back_loop_right', shape: { kind: 'ellipse', cx: 68, cy: 24, rx: 18, ry: 13, fill: '#f5cf88', stroke: '#684b42', strokeWidth: 4, opacity: 1 }, zIndex: -1 },
        { id: 'side_arm', shape: { kind: 'line', x1: 24, y1: 60, x2: 4, y2: 70, linecap: 'round', fill: '#684b42', stroke: '#684b42', strokeWidth: 7, opacity: 1 }, zIndex: 1 },
      ],
      faceAnchors: { leftEye: { x: 42, y: 57 }, rightEye: { x: 62, y: 55 }, mouth: { x: 52, y: 68 } },
      expressivePartIds: ['back_loop_left', 'back_loop_right', 'side_arm'],
      idleMotions: [{ targetPartId: 'back_loop_right', property: 'rotate', from: -3, to: 4, durationMs: 3100, delayMs: 500 }],
    },
  }
}

function mockPurureuk(): CharacterBible {
  return {
    id: 'npc_purureuk',
    kind: 'npc',
    name: '푸르륵',
    epithet: '바람보다 반 박자 먼저 웃는 리본새',
    essence: '무엇이 시작되기 직전의 기척을 좋아해 늘 사건보다 조금 앞서 몸을 던진다.',
    origin: '풍향 리본의 찢어진 끝이 돌풍에 엉켜 새 모양으로 매듭지어졌다.',
    traits: [
      trait('before_wind', '바람 선행', '움직임이 생기기 직전의 공기 변화를 알아챈다.', '좌우 날개 길이가 달라 항상 한쪽이 먼저 들린다.', '다른 주민이 결심하기 전에 출발했다가 되돌아온다.', 0.95),
      trait('loud_welcome', '요란한 환영', '반가움을 숨기지 못해 몸 전체로 크게 표현한다.', '꼬리 리본의 색이 감정에 따라 벌어진다.', '낯선 존재에게 질문 세 개를 한꺼번에 건넨다.', 0.93),
      trait('landing_shy', '착지 수줍음', '날아갈 때는 대담하지만 멈추면 눈을 마주치지 못한다.', '발이 땅에 닿으면 긴 날개로 얼굴을 가린다.', '상대가 기다려 주면 날개 틈으로 작은 인사를 한다.', 0.9),
    ],
    drives: ['아직 이름 없는 움직임을 누구보다 먼저 경험하기'],
    needs: ['요란한 첫인사 뒤에도 기다려 주는 친구'],
    boundaries: ['날지 못하는 주민을 느리다고 놀리는 말에는 즉시 등을 돌린다.'],
    abilities: ['가벼운 물체 주위에 짧은 상승 바람을 만든다.'],
    visibleSignals: ['긴 날개가 높이 서면 곧 달려 나갈 것이다.', '날개로 얼굴을 가리면 머물고 싶다는 뜻이다.'],
    voice: { rhythm: '빠른 세 문장 뒤 작은 속삭임', vocabulary: '봤어, 먼저, 같이, 어라', sampleLine: '봤어? 바람 오기 전이야! 같이—어라, 너무 가까웠나.' },
    motion: { idle: '긴 날개 끝이 서로 다른 박자로 흔들린다.', approach: '큰 곡선을 그려 목표보다 조금 지나쳤다가 돌아온다.', delight: '꼬리 리본을 부채처럼 펼친다.', discomfort: '날개를 세워 얼굴만 가린다.' },
    mood: '출발 직전의 들뜸',
    currentGoal: '비어 있는 유리 종의 한 음을 바람으로 찾아내고 싶다.',
    homePosition: { x: 0.53, y: 0.28 },
    design: {
      silhouette: '한쪽은 길고 한쪽은 짧은 갈라진 리본 날개',
      palette: ['#7867b1', '#e8b4d5', '#f4d45d', '#433b73'],
      body: { kind: 'polygon', points: [{ x: 49, y: 38 }, { x: 86, y: 10 }, { x: 73, y: 54 }, { x: 95, y: 77 }, { x: 57, y: 67 }, { x: 31, y: 99 }, { x: 33, y: 63 }, { x: 5, y: 45 }], fill: '#7867b1', stroke: '#433b73', strokeWidth: 3, opacity: 1 },
      parts: [
        { id: 'tail_pink', shape: { kind: 'line', x1: 47, y1: 67, x2: 58, y2: 108, linecap: 'round', fill: '#e8b4d5', stroke: '#e8b4d5', strokeWidth: 7, opacity: 1 }, zIndex: -1 },
        { id: 'tail_yellow', shape: { kind: 'line', x1: 57, y1: 64, x2: 80, y2: 96, linecap: 'round', fill: '#f4d45d', stroke: '#f4d45d', strokeWidth: 6, opacity: 1 }, zIndex: -1 },
        { id: 'long_wing', shape: { kind: 'line', x1: 48, y1: 45, x2: 88, y2: 12, linecap: 'round', fill: '#433b73', stroke: '#433b73', strokeWidth: 5, opacity: 0.9 }, zIndex: 1 },
      ],
      faceAnchors: { leftEye: { x: 43, y: 49 }, rightEye: { x: 57, y: 47 }, mouth: { x: 52, y: 57 } },
      expressivePartIds: ['tail_pink', 'tail_yellow', 'long_wing'],
      idleMotions: [
        { targetPartId: 'long_wing', property: 'rotate', from: -5, to: 6, durationMs: 1700, delayMs: 0 },
        { targetPartId: 'tail_pink', property: 'translateX', from: -3, to: 4, durationMs: 2300, delayMs: 400 },
      ],
    },
  }
}

function mockBamtol(): CharacterBible {
  return {
    id: 'npc_bamtol',
    kind: 'npc',
    name: '밤톨',
    epithet: '빛을 네모나게 접어 두는 그늘 정원사',
    essence: '넘치는 감정을 작은 칸으로 접어 안전해질 때까지 보관한다.',
    origin: '오래 닫힌 씨앗 서랍 안에서 햇빛 한 조각이 네 번 접힌 채 싹을 틔웠다.',
    traits: [
      trait('folded_light', '접은 빛', '밝은 감정을 바로 내보이지 않고 모서리 안에 접어 둔다.', '네모난 몸의 네 모서리가 차례로 은은하게 빛난다.', '안심하면 접어 둔 빛 한 칸을 상대에게 펼쳐 보인다.', 0.97),
      trait('measured_care', '칸을 재는 돌봄', '누군가 편히 머물 정확한 크기의 자리를 마련한다.', '작은 자를 등에 꽂고 빈 땅을 네 걸음씩 잰다.', '상대의 경계를 물어본 뒤 화분과 의자의 간격을 바꾼다.', 0.94),
      trait('surprise_sprout', '늦은 새싹', '오래 망설인 뒤 예상 밖의 순간에 행동한다.', '머리의 작은 싹은 결심한 뒤에만 갑자기 펴진다.', '침묵하던 장면 끝에 가장 구체적인 도움을 건넨다.', 0.89),
    ],
    drives: ['누구에게나 자기 크기에 맞는 그늘 한 칸 만들기'],
    needs: ['망설임을 무관심으로 오해하지 않는 시간'],
    boundaries: ['몸의 빛 칸을 억지로 열려 하면 흙 속으로 숨는다.'],
    abilities: ['햇빛을 작은 사각형으로 접어 어두운 곳에 옮긴다.'],
    visibleSignals: ['모서리가 하나씩 켜지면 신뢰가 자라는 중이다.', '머리 싹이 펴지면 이미 결심을 마쳤다.'],
    voice: { rhythm: '생각하는 쉼, 정확한 수치, 뜻밖의 다정한 결론', vocabulary: '한 칸, 네 걸음, 여기쯤, 괜찮다면', sampleLine: '네 걸음은 너무 멀고, 두 걸음은 가까워. 괜찮다면 세 걸음에 있을게.' },
    motion: { idle: '네 모서리가 시계 방향으로 한 번씩 빛난다.', approach: '직각으로 두 번 방향을 바꾸며 다가간다.', delight: '머리 싹이 갑자기 두 갈래로 펴진다.', discomfort: '몸이 얇은 사각형으로 접혀 흙 가까이 내려간다.' },
    mood: '천천히 열리는 편안함',
    currentGoal: '새로 올 누군가에게 맞는 빈 그늘의 크기를 정하고 싶다.',
    homePosition: { x: 0.82, y: 0.42 },
    design: {
      silhouette: '모서리가 둥글지 않은 낮은 네모 몸과 한쪽으로 난 두 갈래 싹',
      palette: ['#698c62', '#c7d881', '#f0cf69', '#3d5842'],
      body: { kind: 'polygon', points: [{ x: 15, y: 39 }, { x: 77, y: 31 }, { x: 91, y: 85 }, { x: 23, y: 94 }], fill: '#698c62', stroke: '#3d5842', strokeWidth: 3, opacity: 1 },
      parts: [
        { id: 'sprout_left', shape: { kind: 'ellipse', cx: 47, cy: 22, rx: 10, ry: 21, fill: '#c7d881', stroke: '#3d5842', strokeWidth: 3, opacity: 1 }, zIndex: -1 },
        { id: 'sprout_right', shape: { kind: 'ellipse', cx: 66, cy: 18, rx: 17, ry: 8, fill: '#c7d881', stroke: '#3d5842', strokeWidth: 3, opacity: 1 }, zIndex: -1 },
        { id: 'light_corner', shape: { kind: 'polygon', points: [{ x: 68, y: 65 }, { x: 86, y: 61 }, { x: 89, y: 82 }, { x: 70, y: 84 }], fill: '#f0cf69', stroke: '#3d5842', strokeWidth: 2, opacity: 0.82 }, zIndex: 2 },
      ],
      faceAnchors: { leftEye: { x: 39, y: 57 }, rightEye: { x: 58, y: 54 }, mouth: { x: 50, y: 69 } },
      expressivePartIds: ['sprout_left', 'sprout_right', 'light_corner'],
      idleMotions: [{ targetPartId: 'light_corner', property: 'opacity', from: 0.45, to: 0.95, durationMs: 4200, delayMs: 600 }],
    },
  }
}

function trait(
  id: string,
  label: string,
  description: string,
  visibleEvidence: string,
  behavioralEffect: string,
  confidence: number,
): CharacterBible['traits'][number] {
  return { id, label, description, visibleEvidence, behavioralEffect, confidence }
}

function relationship(
  sourceId: string,
  targetId: string,
  affinity: number,
  trust: number,
  tension: number,
  label: string,
): WorldState['relationships'][number] {
  return { sourceId, targetId, affinity, trust, tension, label, lastChangedSceneId: null }
}

function mockDoodleCharacter(request: DoodleBirthRequest): CharacterBible {
  const metrics = request.drawingMetrics
  const seed = stableHash(`${request.image.sha256}:${metrics?.strokeCount ?? 0}`)
  const names = ['나래', '여울', '조각', '피움', '한들', '포롱'] as const
  const name = names[seed % names.length] ?? '새롱'
  const primary = normalizeColor(metrics?.dominantColor)
  const manyColors = (metrics?.colorCount ?? 1) >= 3
  const reachesUp = (metrics?.verticalRatio ?? 0.5) >= (metrics?.horizontalRatio ?? 0.5)
  const crossings = (metrics?.overlap ?? 0) >= 0.18
  const traitSet: CharacterBible['traits'] = [
    reachesUp
      ? trait('updraft_body', '상승기류를 타는 몸', '긴 세로와 대각선 흐름을 따라 몸의 무게를 위로 옮긴다.', '그림의 긴 방향이 위쪽으로 뻗어 있어 날개나 연처럼 열린다.', '움직임을 시작할 때 뛰기보다 천천히 떠올라 곡선으로 접근한다.', 0.88)
      : trait('wide_horizon', '옆자리를 만드는 몸', '넓게 벌어진 선 사이에 다른 존재가 머물 공간을 만든다.', '그림의 가로 폭과 빈 공간이 좌우로 넓게 이어진다.', '다가갈 때 정면을 막지 않고 옆으로 자리를 내어 준다.', 0.86),
    manyColors
      ? trait('color_resonance', '색 사이의 공명', '서로 다른 색의 리듬을 한 몸 안에서 구분하고 이어 듣는다.', '세 가지 이상의 색이 분리되면서도 한 중심을 공유한다.', '상대의 몸짓을 자기 색 하나로 되받아 둘만의 신호를 만든다.', 0.91)
      : trait('single_tone_focus', '한 색의 집중', '하나의 기분을 오래 놓치지 않고 따라간다.', '주된 색이 선 전체의 방향을 단단히 묶는다.', '다른 주민이 산만해지면 한 박자의 몸짓으로 중심을 되찾게 돕는다.', 0.84),
    crossings
      ? trait('meeting_knots', '만나는 매듭', '겹치는 지점마다 서로 다른 의도를 연결할 가능성을 본다.', '여러 획이 지나간 중심 부근에 교차점이 모여 있다.', '서로 다른 행동 두 개를 한 소품이나 리듬으로 엮으려 한다.', 0.83)
      : trait('open_ending', '열린 끝', '끝나지 않은 선을 다음 존재가 이어 줄 초대로 받아들인다.', '선끝들이 닫히지 않고 여러 방향을 향한다.', '완성된 답을 말하기보다 상대가 이어 할 작은 행동을 남긴다.', 0.8),
  ]

  return {
    id: `player_${seed.toString(36)}`,
    kind: 'player',
    name,
    epithet: reachesUp ? '바람의 빈칸을 타고난 낙서 생명' : '옆자리를 펼쳐 두는 낙서 생명',
    essence: manyColors
      ? '서로 다른 색과 움직임이 만나는 순간을 새로운 인사법으로 바꾼다.'
      : '한 번 발견한 방향을 오래 따라가며 다른 주민의 망설임에 기준점을 만든다.',
    origin: '정원 밖에서 그어진 선들이 투명한 여백을 품은 채 한 몸으로 일어나 이곳에 도착했다.',
    traits: traitSet,
    drives: [manyColors ? '서로 다른 신호들 사이에 공통 리듬 찾기' : '흐트러진 움직임에 하나의 방향 건네기'],
    needs: ['자기 모양을 고치려 들지 않고 그대로 읽어 주는 첫 만남'],
    boundaries: ['선끝이나 빈 공간을 허락 없이 메우는 행동을 불편해한다.'],
    abilities: [reachesUp ? '짧은 바람을 타고 천천히 활공한다.' : '몸의 빈 공간을 안전한 옆자리로 펼친다.'],
    visibleSignals: [
      manyColors ? '색들이 같은 박자로 흔들리면 마음이 맞았다는 뜻이다.' : '주된 선이 곧게 펴지면 무언가를 오래 지켜보는 중이다.',
      '열린 선끝이 상대를 향하면 다음 행동을 기다리는 중이다.',
    ],
    voice: {
      rhythm: manyColors ? '다른 단어를 짧게 이어 마지막에 한 음으로 모음' : '짧고 분명한 한 문장 뒤 긴 기다림',
      vocabulary: manyColors ? '같이, 다른데, 이어서, 들려' : '여기, 이쪽, 아직, 따라와',
      sampleLine: manyColors ? '우린 다른 색인데, 흔들리는 소리는 같이 들려.' : '내 선은 여기서 멈췄어. 네가 이어도 좋아.',
    },
    motion: {
      idle: reachesUp ? '긴 획들이 바람을 기다리듯 위아래로 조금 늘어난다.' : '양옆 선끝이 번갈아 작은 자리를 펼친다.',
      approach: reachesUp ? '한 번 떠올라 넓은 곡선으로 천천히 내려온다.' : '열린 쪽을 상대에게 보이며 비스듬히 미끄러진다.',
      delight: manyColors ? '색 선들이 중심에서 바깥으로 차례로 파동친다.' : '몸 전체가 한 번 또렷하게 밝아진다.',
      discomfort: '교차점 가까이 선을 모으고 열린 끝을 안쪽으로 숨긴다.',
    },
    mood: '낯선 정원을 읽는 설렘',
    currentGoal: '자기 선을 처음 알아봐 주는 주민과 예상하지 못한 몸짓 하나를 함께 만들고 싶다.',
    homePosition: {
      x: 0.35 + ((seed % 19) / 100),
      y: 0.4 + (((seed >>> 5) % 17) / 100),
    },
    design: {
      silhouette: reachesUp ? '위로 갈라진 두 긴 선과 가운데 교차점을 가진 자유 낙서' : '좌우로 열린 비대칭 선과 가운데 빈칸을 가진 자유 낙서',
      palette: manyColors ? [primary, '#f06f5f', '#f4bd4f', '#5e91b8'] : [primary, '#f5e6c8'],
      body: {
        kind: 'polygon',
        points: reachesUp
          ? [{ x: 10, y: 78 }, { x: 42, y: 12 }, { x: 52, y: 54 }, { x: 88, y: 9 }, { x: 73, y: 83 }, { x: 49, y: 68 }]
          : [{ x: 5, y: 42 }, { x: 41, y: 25 }, { x: 55, y: 48 }, { x: 96, y: 29 }, { x: 78, y: 77 }, { x: 32, y: 70 }],
        fill: primary,
        stroke: '#34443c',
        strokeWidth: 3,
        opacity: 0.88,
      },
      parts: [
        { id: 'signal_tip', shape: { kind: 'ellipse', cx: reachesUp ? 87 : 94, cy: reachesUp ? 11 : 31, rx: 7, ry: 7, fill: '#f4bd4f', stroke: '#34443c', strokeWidth: 2, opacity: 1 }, zIndex: 2 },
        { id: 'open_line', shape: { kind: 'line', x1: 48, y1: 55, x2: reachesUp ? 50 : 84, y2: reachesUp ? 4 : 58, linecap: 'round', fill: primary, stroke: primary, strokeWidth: 6, opacity: 0.9 }, zIndex: 1 },
      ],
      faceAnchors: { leftEye: { x: 42, y: 48 }, rightEye: { x: 57, y: 46 }, mouth: { x: 50, y: 58 } },
      expressivePartIds: ['signal_tip', 'open_line'],
      idleMotions: [
        { targetPartId: 'signal_tip', property: 'translateY', from: -3, to: 3, durationMs: 1900, delayMs: 0 },
        { targetPartId: 'open_line', property: 'rotate', from: -4, to: 4, durationMs: 2800, delayMs: 350 },
      ],
    },
  }
}

function selectThinkingResidents(request: WorldTurnRequest, autonomy: AutonomyMode): readonly CharacterBible[] {
  const residents = request.world.residents.filter((resident) => resident.kind === 'npc')
  if (autonomy === 'director-only' || autonomy === 'dialogue-only' || autonomy === 'off') return []
  if (autonomy === 'full-max') return residents

  const focused = residents.find((resident) => resident.id === request.signal.actorId)
  const others = residents
    .filter((resident) => resident.id !== focused?.id)
    .sort((left, right) => stableHash(`${request.requestId}:${left.id}`) - stableHash(`${request.requestId}:${right.id}`))
  return [...(focused ? [focused] : []), ...others].slice(0, 3)
}

function privateMindContext(request: WorldTurnRequest, resident: CharacterBible): unknown {
  return buildPrivateMindContext(request.world, resident.id, request.signal, {
    maxMemoriesPerResident: 8,
    maxRecentScenes: 5,
    maxThreads: 8,
  })
}

function publicWorldContext(world: WorldState): unknown {
  return buildPublicWorldContext(world, { maxRecentScenes: 5, maxThreads: 10 })
}

function privateCriticContext(world: WorldState): unknown {
  return world.memories
    .filter((memory) => memory.visibility === 'private')
    .slice(-24)
    .map((memory) => ({
      id: memory.id,
      ownerId: memory.ownerId,
      summary: memory.summary,
      interpretation: memory.interpretation,
    }))
}

function mockIntent(resident: CharacterBible, request: WorldTurnRequest, index: number): NPCIntent {
  const target = request.world.residents.find((candidate) => candidate.id === request.signal.actorId && candidate.id !== resident.id)
    ?? request.world.residents.filter((candidate) => candidate.id !== resident.id)[index % Math.max(1, request.world.residents.length - 1)]
    ?? null
  const lines = [
    `${resident.name}답게 먼저 답을 정하지 않고 상대의 다음 몸짓을 기다려 보려 한다.`,
    `${resident.name}은 낯선 모양에서 자기와 반대되는 부분을 발견하고 가까이서 확인하고 싶어 한다.`,
    `${resident.name}은 지금의 분위기를 둘만의 작은 리듬으로 바꾸어 보려 한다.`,
    `${resident.name}은 상대가 편히 물러날 자리까지 남겨 둔 채 인사하려 한다.`,
  ]
  const intendedLines = [
    `네 모양에서 내가 모르는 박자가 들려. 조금 가까이 가도 될까?`,
    `같이 움직여 보자. 다르면, 다른 데서 잠깐 기다릴게.`,
    `나는 이쪽을 맡을게. 너는 네 선이 가고 싶은 쪽을 골라 줘.`,
    `대답은 나중이어도 좋아. 먼저 내 몸짓 하나를 보여 줄게.`,
  ]

  return {
    npcId: resident.id,
    notices: request.signal.detail,
    emotion: index % 2 === 0 ? '조심스럽게 부풀어 오르는 호기심' : '조금 긴장했지만 숨기지 않는 기대',
    wantsNow: lines[index % lines.length] ?? lines[0] as string,
    avoidsNow: resident.boundaries[0] ?? '상대의 결정을 서두르게 하는 것',
    intendedLine: intendedLines[(stableHash(resident.id) + index) % intendedLines.length] ?? intendedLines[0] as string,
    intendedAction: target
      ? `${target.name}의 움직임을 한 박자 관찰한 뒤 자기 특유의 접근 동작으로 옆자리를 만든다.`
      : '정원 중앙으로 다가가 자기 특유의 신호를 한 번 보여 준다.',
    targetActorId: target?.id ?? null,
    traitGrounding: resident.traits.slice(0, 2).map((item) => item.id),
    confidence: 0.72 + ((stableHash(`${request.requestId}:${resident.id}`) % 20) / 100),
  }
}

function mockScene(request: WorldTurnRequest, intents: readonly NPCIntent[]): GeneratedScene {
  const signalActor = request.world.residents.find((resident) => resident.id === request.signal.actorId)
  const firstIntent = intents[0]
  const actorA = signalActor ?? request.world.residents.find((resident) => resident.id === firstIntent?.npcId) ?? request.world.residents[0]
  if (!actorA) throw new ModelProviderError('The world has no resident available for a scene.', 'empty_world', 422)
  const intentTargetId = firstIntent?.targetActorId
  const actorB = request.world.residents.find((resident) => resident.id === intentTargetId && resident.id !== actorA.id)
    ?? request.world.residents.find((resident) => resident.id !== actorA.id)
  const participants = actorB ? [actorA.id, actorB.id] : [actorA.id]
  const actorAIntent = intents.find((intent) => intent.npcId === actorA.id)
  const actorBIntent = actorB ? intents.find((intent) => intent.npcId === actorB.id) : undefined
  const sceneId = `scene_${request.expectedRevision + 1}_${stableHash(`${request.requestId}:${request.signal.detail}`).toString(36)}`
  const propId = `${sceneId}_wind_note`
  const beats: GeneratedScene['beats'] = [
    {
      id: `${sceneId}_move`,
      startMs: 0,
      durationMs: 720,
      statusText: `${withParticle(actorA.name, '이', '가')} 자기만의 움직임으로 빈자리 쪽에 다가가요.`,
      actions: [{
        kind: 'move',
        actorId: actorA.id,
        to: {
          x: 100 * (actorB ? clamp01((actorA.homePosition.x + actorB.homePosition.x) / 2 - 0.06) : 0.5),
          y: 100 * (actorB ? clamp01((actorA.homePosition.y + actorB.homePosition.y) / 2) : 0.5),
        },
        rotate: null,
        scale: 1.04,
      }],
    },
  ]

  if (actorB) {
    beats.push(
      {
        id: `${sceneId}_look`, startMs: 720, durationMs: 520,
        statusText: `${withParticle(actorB.name, '이', '가')} 하던 일을 멈추고 ${withParticle(actorA.name, '을', '를')} 바라봐요.`,
        actions: [{ kind: 'look', actorId: actorB.id, targetId: actorA.id }],
      },
      {
        id: `${sceneId}_line_a`, startMs: 1240, durationMs: 1800,
        statusText: `${withParticle(actorA.name, '이', '가')} 먼저 작은 말을 건네요.`,
        actions: [
          { kind: 'speak', actorId: actorA.id, text: actorAIntent?.intendedLine ?? actorA.voice.sampleLine },
          {
            kind: 'prop_create', propId, symbol: '⌁', label: '둘 사이에서 접힌 바람 조각',
            color: actorA.design.palette[0] ?? '#79a96b', actorId: actorA.id,
            position: {
              x: 100 * clamp01((actorA.homePosition.x + actorB.homePosition.x) / 2),
              y: 100 * clamp01((actorA.homePosition.y + actorB.homePosition.y) / 2 - 0.08),
            },
          },
        ],
      },
      {
        id: `${sceneId}_gesture_b`, startMs: 3040, durationMs: 880,
        statusText: `${withParticle(actorB.name, '이', '가')} 익숙한 버릇으로 대답해요.`,
        actions: [
          { kind: 'gesture', actorId: actorB.id, gesture: gestureFor(actorB), status: actorB.motion.delight },
          { kind: 'prop_transform', propId, scale: 1.18, rotate: 12, opacity: 0.92 },
        ],
      },
      {
        id: `${sceneId}_line_b`, startMs: 3920, durationMs: 1900,
        statusText: `${actorB.name}의 대답이 처음과는 다른 방향을 만들어요.`,
        actions: [{ kind: 'speak', actorId: actorB.id, text: actorBIntent?.intendedLine ?? actorB.voice.sampleLine }],
      },
      {
        id: `${sceneId}_effect`, startMs: 5820, durationMs: 980,
        statusText: '서로 다른 몸짓이 겹친 자리에 작은 흔적이 남아요.',
        actions: [
          { kind: 'effect', effect: effectFor(actorA, actorB), targetId: null, color: actorB.design.palette[1] ?? '#f4bd4f', intensity: 0.58 },
          { kind: 'prop_transform', propId, scale: 0.82, rotate: -8, opacity: 0.48 },
        ],
      },
      {
        id: `${sceneId}_pause`, startMs: 6800, durationMs: 460,
        statusText: '둘은 새로 생긴 리듬을 잠시 함께 들어요.',
        actions: [{ kind: 'pause', durationMs: 460 }, { kind: 'prop_remove', propId }],
      },
    )
  } else {
    beats.push(
      {
        id: `${sceneId}_solo_gesture`, startMs: 720, durationMs: 900,
        statusText: `${withParticle(actorA.name, '이', '가')} 정원에 자기 신호를 처음 남겨요.`,
        actions: [{ kind: 'gesture', actorId: actorA.id, gesture: gestureFor(actorA), status: actorA.motion.delight }],
      },
      {
        id: `${sceneId}_solo_line`, startMs: 1620, durationMs: 1600,
        statusText: `${actorA.name}의 목소리가 정원에 머물러요.`,
        actions: [{ kind: 'speak', actorId: actorA.id, text: actorA.voice.sampleLine }],
      },
    )
  }

  const mutations: GeneratedScene['mutations'] = [
    {
      kind: 'memory',
      actorId: actorA.id,
      visibility: 'private',
      summary: actorB ? `${withParticle(actorA.name, '이', '가')} ${withParticle(actorB.name, '과', '와')} 처음으로 서로 다른 몸짓을 이어 보았다.` : `${withParticle(actorA.name, '이', '가')} 정원에 첫 신호를 남겼다.`,
      interpretation: actorB ? `${actorB.name}은 내 속도와 달랐지만 기다릴 수 있는 빈자리를 남겨 주었다.` : '아직 대답은 없지만 내 모양은 이 정원 안에 자리를 얻었다.',
      salience: 0.82,
    },
    {
      kind: 'mood',
      actorId: actorA.id,
      mood: '낯선 리듬을 하나 얻은 기쁨',
      reason: '자기 특성이 다른 존재의 반응을 실제로 바꾸는 것을 보았기 때문이다.',
    },
  ]

  if (actorB) {
    mutations.push(
      {
        kind: 'relationship',
        actorId: actorA.id,
        targetId: actorB.id,
        affinityDelta: 0.1,
        trustDelta: 0.07,
        tensionDelta: actorBIntent ? -0.02 : 0.03,
        label: '서로 다른 박자를 한 번 이어 본 사이',
        reason: '두 주민이 각자의 버릇을 지우지 않고 한 장면 안에서 주고받았다.',
      },
      {
        kind: 'memory',
        actorId: actorB.id,
        visibility: 'shared',
        summary: `${withParticle(actorB.name, '이', '가')} ${actorA.name}의 낯선 신호에 자기 방식으로 대답했다.`,
        interpretation: `${actorA.name}의 모양은 고쳐야 할 것이 아니라 함께 움직일 새로운 규칙일 수 있다.`,
        salience: 0.76,
      },
      {
        kind: 'thread',
        threadId: `thread_${sceneId.slice(6, 48)}`,
        operation: 'open',
        title: '둘만 들은 다음 박자',
        description: `${withParticle(actorA.name, '과', '와')} ${withParticle(actorB.name, '이', '가')} 만든 첫 리듬에는 아직 이어지지 않은 한 박자가 남았다.`,
        participantIds: [actorA.id, actorB.id],
        reason: '장면 끝에 두 주민 모두 다음 움직임을 기다리는 몸짓을 남겼다.',
      },
    )
  }

  return {
    id: sceneId,
    title: actorB ? `${actorA.name}의 선끝에 ${withParticle(actorB.name, '이', '가')} 대답한 방식` : `${withParticle(actorA.name, '이', '가')} 남긴 첫 번째 신호`,
    summary: actorB
      ? `${withParticle(actorA.name, '이', '가')} 자기 몸짓을 먼저 보여 주고 ${withParticle(actorB.name, '이', '가')} 전혀 다른 버릇으로 받아, 둘 사이에 없던 리듬이 생겼다.`
      : `${withParticle(actorA.name, '이', '가')} 정원 한가운데서 자기 모양과 목소리를 처음 드러냈다.`,
    participantIds: participants,
    beats,
    mutations,
    observationTitle: actorB ? '같아져서가 아니라, 달라서 이어진 순간' : '정원이 처음 들은 모양',
    observationBody: actorB
      ? `${actorA.name}의 ${actorA.traits[0]?.label ?? '낯선 버릇'}과 ${actorB.name}의 ${actorB.traits[0]?.label ?? '오래된 버릇'}이 서로를 바꾸지 않은 채 새로운 행동을 만들었다.`
      : `${actorA.name}의 움직임은 다음 주민이 반응할 수 있는 열린 신호로 정원에 남았다.`,
  }
}

function mockCritic(_scene: GeneratedScene): CriticReview {
  return { approved: true, issues: [], correctedScene: null }
}

function mockDialoguePass(scene: GeneratedScene): DialoguePass {
  return {
    lines: scene.beats.flatMap((beat) => beat.actions.flatMap((action, actionIndex) => action.kind === 'speak'
      ? [{ beatId: beat.id, actionIndex, actorId: action.actorId, text: action.text }]
      : [])),
  }
}

function applyDialoguePass(scene: GeneratedScene, pass: DialoguePass): GeneratedScene {
  const slots = new Map<string, { readonly actorId: string; readonly text: string }>()
  for (const beat of scene.beats) {
    beat.actions.forEach((action, actionIndex) => {
      if (action.kind === 'speak') slots.set(`${beat.id}:${actionIndex}`, { actorId: action.actorId, text: action.text })
    })
  }

  const replacements = new Map<string, string>()
  const errors: string[] = []
  for (const line of pass.lines) {
    const key = `${line.beatId}:${line.actionIndex}`
    const slot = slots.get(key)
    if (!slot) errors.push(`dialogue references unknown speak slot ${key}`)
    else if (slot.actorId !== line.actorId) errors.push(`dialogue retargets ${key} from ${slot.actorId} to ${line.actorId}`)
    if (replacements.has(key)) errors.push(`dialogue repeats speak slot ${key}`)
    replacements.set(key, line.text)
  }
  for (const key of slots.keys()) {
    if (!replacements.has(key)) errors.push(`dialogue omitted speak slot ${key}`)
  }
  if (errors.length > 0 || replacements.size !== slots.size) {
    throw new ModelProviderError(`Dialogue Writer changed the scene structure: ${errors.slice(0, 5).join('; ')}`, 'invalid_dialogue_pass', 422)
  }

  return parseGeneratedScene({
    ...scene,
    beats: scene.beats.map((beat) => ({
      ...beat,
      actions: beat.actions.map((action, actionIndex) => action.kind === 'speak'
        ? { ...action, text: replacements.get(`${beat.id}:${actionIndex}`) ?? action.text }
        : action),
    })),
  })
}

function sceneFromReview(review: CriticReview, proposed: GeneratedScene): GeneratedScene {
  if (review.approved) return proposed
  if (review.correctedScene) return parseModelOutput('Continuity Critic correction', review.correctedScene, parseGeneratedScene)
  throw new ModelProviderError('The critic rejected the scene without a corrected replacement.', 'critic_rejected_scene', 422)
}

function validateSceneReferences(
  scene: GeneratedScene,
  world: WorldState,
  signal: WorldTurnRequest['signal'],
): void {
  const residents = new Set(world.residents.map((resident) => resident.id))
  const participants = new Set(scene.participantIds)
  const props = new Set<string>()
  const errors: string[] = []
  let signalActorIsVisible = false
  const requireResident = (id: string, context: string): void => {
    if (!residents.has(id)) errors.push(`${context} references unknown resident ${id}`)
  }
  const requireParticipant = (id: string, context: string): void => {
    requireResident(id, context)
    if (!participants.has(id)) errors.push(`${context} references non-participant ${id}`)
  }

  if (world.recentScenes.some((recentScene) => recentScene.id === scene.id)) errors.push(`scene id ${scene.id} was already used`)
  if (participants.size !== scene.participantIds.length) errors.push('participantIds contains a duplicate resident')
  if (scene.beats.some((beat, index) => index > 0 && beat.startMs < (scene.beats[index - 1]?.startMs ?? 0))) {
    errors.push('beats are not sorted by startMs')
  }
  if (Math.max(...scene.beats.map((beat) => beat.startMs + beat.durationMs)) > 15_000) {
    errors.push('scene timeline exceeds 15 seconds')
  }
  if (signal.kind !== 'idle-pulse' && !participants.has(signal.actorId)) {
    errors.push(`${signal.kind} scene does not include signaled actor ${signal.actorId}`)
  }
  scene.participantIds.forEach((id) => requireResident(id, 'participantIds'))
  const beatIds = new Set<string>()
  for (const beat of [...scene.beats].sort((left, right) => left.startMs - right.startMs)) {
    if (beatIds.has(beat.id)) errors.push(`duplicate beat id ${beat.id}`)
    beatIds.add(beat.id)
    const createdThisBeat = new Set<string>()
    const removedThisBeat = new Set<string>()
    for (const action of beat.actions) {
      switch (action.kind) {
        case 'move':
        case 'speak':
        case 'gesture':
          requireParticipant(action.actorId, action.kind)
          if (action.actorId === signal.actorId) signalActorIsVisible = true
          break
        case 'look':
          requireParticipant(action.actorId, 'look.actorId')
          requireParticipant(action.targetId, 'look.targetId')
          if (action.actorId === signal.actorId || action.targetId === signal.actorId) signalActorIsVisible = true
          break
        case 'prop_create':
          if (props.has(action.propId) || createdThisBeat.has(action.propId)) errors.push(`prop ${action.propId} is created twice`)
          createdThisBeat.add(action.propId)
          if (action.actorId) requireParticipant(action.actorId, 'prop_create.actorId')
          if (action.actorId === signal.actorId) signalActorIsVisible = true
          break
        case 'prop_move':
        case 'prop_transform':
          if (!props.has(action.propId)) errors.push(`${action.kind} references missing prop ${action.propId}`)
          break
        case 'prop_remove':
          if (!props.has(action.propId) || removedThisBeat.has(action.propId)) errors.push(`prop_remove references missing prop ${action.propId}`)
          removedThisBeat.add(action.propId)
          break
        case 'effect':
          if (action.targetId && !residents.has(action.targetId) && !props.has(action.targetId)) {
            errors.push(`effect references unknown target ${action.targetId}`)
          } else if (action.targetId && residents.has(action.targetId) && !participants.has(action.targetId)) {
            errors.push(`effect references non-participant ${action.targetId}`)
          }
          if (action.targetId === signal.actorId) signalActorIsVisible = true
          break
        case 'pause':
          break
      }
    }
    for (const propId of removedThisBeat) props.delete(propId)
    for (const propId of createdThisBeat) props.add(propId)
  }

  if (signal.kind !== 'idle-pulse' && !signalActorIsVisible) {
    errors.push(`${signal.kind} scene lists ${signal.actorId} but never shows that actor in an action`)
  }

  for (const mutation of scene.mutations) {
    switch (mutation.kind) {
      case 'relationship':
        requireParticipant(mutation.actorId, 'relationship.actorId')
        requireParticipant(mutation.targetId, 'relationship.targetId')
        break
      case 'memory':
      case 'mood':
      case 'goal':
        requireParticipant(mutation.actorId, `${mutation.kind}.actorId`)
        break
      case 'thread':
        mutation.participantIds.forEach((id) => requireParticipant(id, 'thread.participantIds'))
        break
    }
  }

  if (errors.length > 0) {
    throw new ModelProviderError(`Scene failed executable reference checks: ${errors.slice(0, 8).join('; ')}`, 'unplayable_scene', 422)
  }
}

function applySceneToWorld(world: WorldState, scene: GeneratedScene): WorldState {
  let residents = world.residents.map((resident) => ({ ...resident }))
  const relationships = world.relationships.map((entry) => ({ ...entry }))
  const memories = world.memories.map((entry) => ({ ...entry }))
  let openThreads = world.openThreads.map((entry) => ({ ...entry, participantIds: [...entry.participantIds] }))

  scene.mutations.forEach((mutation, index) => {
    switch (mutation.kind) {
      case 'relationship': {
        const existingIndex = relationships.findIndex((entry) => entry.sourceId === mutation.actorId && entry.targetId === mutation.targetId)
        const previous = existingIndex >= 0 ? relationships[existingIndex] : relationship(mutation.actorId, mutation.targetId, 0, 0.2, 0.1, mutation.label)
        const next = {
          ...previous,
          affinity: clamp(previous.affinity + mutation.affinityDelta, -1, 1),
          trust: clamp01(previous.trust + mutation.trustDelta),
          tension: clamp01(previous.tension + mutation.tensionDelta),
          label: mutation.label,
          lastChangedSceneId: scene.id,
        }
        if (existingIndex >= 0) relationships[existingIndex] = next
        else relationships.push(next)
        break
      }
      case 'memory':
        memories.push({
          id: `mem_${stableHash(`${scene.id}:${mutation.actorId}:${index}`).toString(36)}`,
          ownerId: mutation.actorId,
          sceneId: scene.id,
          summary: mutation.summary,
          interpretation: mutation.interpretation,
          visibility: mutation.visibility,
          salience: mutation.salience,
        })
        break
      case 'mood':
        residents = residents.map((resident) => resident.id === mutation.actorId ? { ...resident, mood: mutation.mood } : resident)
        break
      case 'goal':
        residents = residents.map((resident) => resident.id === mutation.actorId ? { ...resident, currentGoal: mutation.goal } : resident)
        break
      case 'thread': {
        const existing = openThreads.find((thread) => thread.id === mutation.threadId)
        if (mutation.operation === 'resolve') {
          openThreads = openThreads.map((thread) => thread.id === mutation.threadId ? { ...thread, status: 'resolved' as const } : thread)
        } else if (existing) {
          openThreads = openThreads.map((thread) => thread.id === mutation.threadId ? {
            ...thread,
            title: mutation.title,
            description: mutation.description,
            participantIds: [...mutation.participantIds],
            status: 'open' as const,
          } : thread)
        } else {
          openThreads.push({
            id: mutation.threadId,
            title: mutation.title,
            description: mutation.description,
            participantIds: [...mutation.participantIds],
            status: 'open',
            createdSceneId: scene.id,
          })
        }
        break
      }
    }
  })

  return parseWorldState({
    ...world,
    revision: world.revision + 1,
    residents,
    relationships: relationships.slice(-96),
    memories: memories.slice(-160),
    openThreads: openThreads.slice(-32),
    recentScenes: [
      ...world.recentScenes,
      {
        id: scene.id,
        title: scene.title,
        summary: scene.summary,
        participantIds: [...scene.participantIds],
        atRevision: world.revision + 1,
      },
    ].slice(-20),
  })
}

function validateWorldProgress(previous: WorldState, next: WorldState, scene: GeneratedScene): void {
  const previousIds = new Set(previous.residents.map((resident) => resident.id))
  const nextIds = new Set(next.residents.map((resident) => resident.id))
  const invalid = next.id !== previous.id
    || next.revision !== previous.revision + 1
    || nextIds.size !== previousIds.size
    || [...previousIds].some((id) => !nextIds.has(id))
    || !next.recentScenes.some((entry) => entry.id === scene.id && entry.atRevision === next.revision)
    || next.relationships.some((entry) => !nextIds.has(entry.sourceId) || !nextIds.has(entry.targetId))
    || next.memories.some((entry) => !nextIds.has(entry.ownerId))
    || next.openThreads.some((thread) => thread.participantIds.some((id) => !nextIds.has(id)))
  if (invalid) {
    throw new ModelProviderError('Memory Writer returned a world with invalid identity, revision, residents, or scene history.', 'invalid_world_transition', 422)
  }
}

function makeBootstrapResponse(request: BootstrapRequest, world: WorldState, trace: TraceSummary): BootstrapResponse {
  return { requestId: request.sessionId, world, trace }
}

function makeDoodleBirthResponse(
  request: DoodleBirthRequest,
  character: CharacterBible,
  trace: TraceSummary,
): DoodleBirthResponse {
  const highConfidence = character.traits.filter((item) => item.confidence >= 0.75)
  return {
    requestId: request.requestId,
    expectedRevision: request.expectedRevision,
    character,
    evidenceSummary: highConfidence.slice(0, 3).map((item) => `${item.label}: ${item.visibleEvidence}`).join(' · '),
    uncertainties: character.traits.filter((item) => item.confidence < 0.75).map((item) => `${item.label}은 장면 속 행동을 보며 더 선명해질 수 있어요.`),
    trace,
  }
}

function makeWorldTurnResponse(
  request: WorldTurnRequest,
  intents: readonly NPCIntent[],
  proposedScene: GeneratedScene,
  critic: CriticReview,
  approvedScene: GeneratedScene,
  nextWorld: WorldState,
  trace: TraceSummary,
): WorldTurnResponse {
  return {
    requestId: request.requestId,
    baseRevision: request.expectedRevision,
    nextWorld,
    intents,
    proposedScene,
    critic,
    scene: approvedScene,
    trace,
  }
}

function gestureFor(character: CharacterBible): 'bounce' | 'wave' | 'nod' | 'spin' | 'stretch' | 'shiver' {
  const gestures = ['bounce', 'wave', 'nod', 'spin', 'stretch', 'shiver'] as const
  return gestures[stableHash(character.id) % gestures.length] ?? 'wave'
}

function effectFor(actorA: CharacterBible, actorB: CharacterBible): 'glow' | 'sparkle' | 'wind' | 'ripple' | 'music' | 'heart' | 'leaf' | 'dust' | 'surprise' | 'rain' {
  const effects = ['glow', 'sparkle', 'wind', 'ripple', 'music', 'heart', 'leaf', 'dust', 'surprise', 'rain'] as const
  return effects[stableHash(`${actorA.id}:${actorB.id}`) % effects.length] ?? 'sparkle'
}

function normalizeColor(value: string | undefined): string {
  return value && value.length <= 64 ? value : '#8d72ad'
}

function withParticle(value: string, afterConsonant: string, afterVowel: string): string {
  const finalCharacter = Array.from(value.trim()).at(-1)
  if (!finalCharacter) return value
  const codePoint = finalCharacter.codePointAt(0) ?? 0
  const hasKoreanFinalConsonant = codePoint >= 0xac00 && codePoint <= 0xd7a3 && (codePoint - 0xac00) % 28 !== 0
  return `${value}${hasKoreanFinalConsonant ? afterConsonant : afterVowel}`
}

function clamp01(value: number): number {
  return clamp(value, 0, 1)
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value))
}

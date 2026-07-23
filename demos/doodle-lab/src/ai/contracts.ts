import { z } from 'zod'

export type JsonSchema = Readonly<Record<string, unknown>>

export const AutonomyModeValidator = z.enum([
  'full-max',
  'full-selective',
  'director-only',
  'dialogue-only',
  'off',
  'staged',
])
export type AutonomyMode = z.infer<typeof AutonomyModeValidator>

const Id = z.string().min(1).max(64).regex(/^[a-zA-Z0-9_-]+$/)
const ShortText = z.string().min(1).max(120)
const LongText = z.string().min(1).max(600)
const Color = z.string().min(1).max(64)
const Unit = z.number().min(0).max(1)

export const PointValidator = z.object({
  x: z.number().min(-160).max(260),
  y: z.number().min(-160).max(260),
}).strict()
export type DesignPoint = z.infer<typeof PointValidator>

const ShapeBase = {
  fill: Color,
  stroke: Color,
  strokeWidth: z.number().min(0).max(12),
  opacity: Unit,
}

export const VisualShapeValidator = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('ellipse'),
    ...ShapeBase,
    cx: z.number().min(-160).max(260),
    cy: z.number().min(-160).max(260),
    rx: z.number().min(0.2).max(160),
    ry: z.number().min(0.2).max(160),
  }).strict(),
  z.object({
    kind: z.literal('polygon'),
    ...ShapeBase,
    points: z.array(PointValidator).min(3).max(48),
  }).strict(),
  z.object({
    kind: z.literal('line'),
    ...ShapeBase,
    x1: z.number().min(-160).max(260),
    y1: z.number().min(-160).max(260),
    x2: z.number().min(-160).max(260),
    y2: z.number().min(-160).max(260),
    linecap: z.enum(['round', 'square', 'butt']),
  }).strict(),
  z.object({
    kind: z.literal('path'),
    ...ShapeBase,
    d: z.string().min(1).max(2400),
  }).strict(),
])
export type VisualShape = z.infer<typeof VisualShapeValidator>

export const CharacterDesignSpecValidator = z.object({
  silhouette: ShortText,
  palette: z.array(Color).min(2).max(8),
  body: VisualShapeValidator,
  parts: z.array(z.object({
    id: Id,
    shape: VisualShapeValidator,
    zIndex: z.number().int().min(-20).max(20),
  }).strict()).max(32),
  faceAnchors: z.object({
    leftEye: PointValidator,
    rightEye: PointValidator,
    mouth: PointValidator,
  }).strict(),
  expressivePartIds: z.array(Id).max(12),
  idleMotions: z.array(z.object({
    targetPartId: Id.nullable(),
    property: z.enum(['translateX', 'translateY', 'rotate', 'scale', 'opacity']),
    from: z.number().min(-48).max(48),
    to: z.number().min(-48).max(48),
    durationMs: z.number().int().min(240).max(12000),
    delayMs: z.number().int().min(0).max(8000),
  }).strict()).max(12),
}).strict()
export type CharacterDesignSpec = z.infer<typeof CharacterDesignSpecValidator>

export const GeneratedTraitValidator = z.object({
  id: Id,
  label: ShortText,
  description: LongText,
  visibleEvidence: LongText,
  behavioralEffect: LongText,
  confidence: Unit,
}).strict()
export type GeneratedTrait = z.infer<typeof GeneratedTraitValidator>

export const CharacterBibleValidator = z.object({
  id: Id,
  kind: z.enum(['npc', 'player']),
  name: ShortText,
  epithet: ShortText,
  essence: LongText,
  origin: LongText,
  traits: z.array(GeneratedTraitValidator).min(2).max(8),
  drives: z.array(ShortText).min(1).max(6),
  needs: z.array(ShortText).min(1).max(6),
  boundaries: z.array(ShortText).min(1).max(6),
  abilities: z.array(ShortText).min(1).max(6),
  visibleSignals: z.array(ShortText).min(1).max(8),
  voice: z.object({
    rhythm: ShortText,
    vocabulary: ShortText,
    sampleLine: LongText,
  }).strict(),
  motion: z.object({
    idle: ShortText,
    approach: ShortText,
    delight: ShortText,
    discomfort: ShortText,
  }).strict(),
  mood: ShortText,
  currentGoal: LongText,
  homePosition: z.object({ x: Unit, y: Unit }).strict(),
  design: CharacterDesignSpecValidator,
}).strict()
export type CharacterBible = z.infer<typeof CharacterBibleValidator>

export const RelationshipValidator = z.object({
  sourceId: Id,
  targetId: Id,
  affinity: z.number().min(-1).max(1),
  trust: z.number().min(0).max(1),
  tension: z.number().min(0).max(1),
  label: ShortText,
  lastChangedSceneId: Id.nullable(),
}).strict()
export type Relationship = z.infer<typeof RelationshipValidator>

export const CharacterMemoryValidator = z.object({
  id: Id,
  ownerId: Id,
  sceneId: Id,
  summary: LongText,
  interpretation: LongText,
  visibility: z.enum(['private', 'shared']),
  salience: Unit,
}).strict()
export type CharacterMemory = z.infer<typeof CharacterMemoryValidator>

export const StoryThreadValidator = z.object({
  id: Id,
  title: ShortText,
  description: LongText,
  participantIds: z.array(Id).min(1).max(8),
  status: z.enum(['open', 'resolved']),
  createdSceneId: Id.nullable(),
}).strict()
export type StoryThread = z.infer<typeof StoryThreadValidator>

export const RecentSceneValidator = z.object({
  id: Id,
  title: ShortText,
  summary: LongText,
  participantIds: z.array(Id).min(1).max(8),
  atRevision: z.number().int().min(0),
}).strict()
export type RecentScene = z.infer<typeof RecentSceneValidator>

export const WorldStateValidator = z.object({
  id: Id,
  revision: z.number().int().min(0),
  title: ShortText,
  premise: LongText,
  locationDescription: LongText,
  atmosphere: ShortText,
  clock: ShortText,
  residents: z.array(CharacterBibleValidator).min(1).max(12),
  relationships: z.array(RelationshipValidator).max(96),
  memories: z.array(CharacterMemoryValidator).max(160),
  openThreads: z.array(StoryThreadValidator).max(32),
  recentScenes: z.array(RecentSceneValidator).max(20),
}).strict()
export type WorldState = z.infer<typeof WorldStateValidator>

export const NPCIntentValidator = z.object({
  npcId: Id,
  notices: LongText,
  emotion: ShortText,
  wantsNow: LongText,
  avoidsNow: LongText,
  intendedLine: LongText,
  intendedAction: LongText,
  targetActorId: Id.nullable(),
  traitGrounding: z.array(Id).min(1).max(5),
  confidence: Unit,
}).strict()
export type NPCIntent = z.infer<typeof NPCIntentValidator>

export const SceneActionValidator = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('move'),
    actorId: Id,
    to: z.object({ x: z.number().min(0).max(100), y: z.number().min(0).max(100) }).strict(),
    rotate: z.number().min(-180).max(180).nullable(),
    scale: z.number().min(0.5).max(1.8).nullable(),
  }).strict(),
  z.object({
    kind: z.literal('look'),
    actorId: Id,
    targetId: Id,
  }).strict(),
  z.object({
    kind: z.literal('speak'),
    actorId: Id,
    text: z.string().min(1).max(180),
  }).strict(),
  z.object({
    kind: z.literal('gesture'),
    actorId: Id,
    gesture: z.enum(['bounce', 'wave', 'nod', 'spin', 'stretch', 'shiver']),
    status: ShortText,
  }).strict(),
  z.object({
    kind: z.literal('prop_create'),
    propId: Id,
    label: ShortText,
    symbol: z.string().min(1).max(8),
    color: Color,
    position: z.object({ x: z.number().min(0).max(100), y: z.number().min(0).max(100) }).strict(),
    actorId: Id.nullable(),
  }).strict(),
  z.object({
    kind: z.literal('prop_move'),
    propId: Id,
    to: z.object({ x: z.number().min(0).max(100), y: z.number().min(0).max(100) }).strict(),
  }).strict(),
  z.object({
    kind: z.literal('prop_transform'),
    propId: Id,
    scale: z.number().min(0).max(3).nullable(),
    rotate: z.number().min(-360).max(360).nullable(),
    opacity: Unit.nullable(),
  }).strict(),
  z.object({
    kind: z.literal('prop_remove'),
    propId: Id,
  }).strict(),
  z.object({
    kind: z.literal('effect'),
    effect: z.enum(['glow', 'sparkle', 'wind', 'ripple', 'music', 'heart', 'leaf', 'dust', 'surprise', 'rain']),
    targetId: Id.nullable(),
    color: Color,
    intensity: Unit,
  }).strict(),
  z.object({
    kind: z.literal('pause'),
    durationMs: z.number().int().min(100).max(5000).nullable(),
  }).strict(),
])

export type SceneAction = z.infer<typeof SceneActionValidator>

export const SceneBeatValidator = z.object({
  id: Id,
  startMs: z.number().int().min(0).max(12000),
  durationMs: z.number().int().min(100).max(5000),
  statusText: ShortText,
  actions: z.array(SceneActionValidator).min(1).max(8),
}).strict()
export type SceneBeat = z.infer<typeof SceneBeatValidator>

export const WorldMutationValidator = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('relationship'),
    actorId: Id,
    targetId: Id,
    affinityDelta: z.number().min(-0.25).max(0.25),
    trustDelta: z.number().min(-0.25).max(0.25),
    tensionDelta: z.number().min(-0.25).max(0.25),
    label: ShortText,
    reason: LongText,
  }).strict(),
  z.object({
    kind: z.literal('memory'),
    actorId: Id,
    visibility: z.enum(['private', 'shared']),
    summary: LongText,
    interpretation: LongText,
    salience: Unit,
  }).strict(),
  z.object({
    kind: z.literal('mood'),
    actorId: Id,
    mood: ShortText,
    reason: LongText,
  }).strict(),
  z.object({
    kind: z.literal('goal'),
    actorId: Id,
    goal: LongText,
    reason: LongText,
  }).strict(),
  z.object({
    kind: z.literal('thread'),
    threadId: Id,
    operation: z.enum(['open', 'resolve']),
    title: ShortText,
    description: LongText,
    participantIds: z.array(Id).min(1).max(8),
    reason: LongText,
  }).strict(),
])
export type WorldMutation = z.infer<typeof WorldMutationValidator>

export const GeneratedSceneValidator = z.object({
  id: Id,
  title: ShortText,
  summary: LongText,
  participantIds: z.array(Id).min(2).max(4),
  beats: z.array(SceneBeatValidator).min(2).max(18),
  mutations: z.array(WorldMutationValidator).max(18),
  observationTitle: ShortText,
  observationBody: LongText,
}).strict()
export type GeneratedScene = z.infer<typeof GeneratedSceneValidator>

export const CriticReviewValidator = z.object({
  approved: z.boolean(),
  issues: z.array(ShortText).max(12),
  correctedScene: GeneratedSceneValidator.nullable(),
}).strict()
export type CriticReview = z.infer<typeof CriticReviewValidator>

export const DialoguePassValidator = z.object({
  lines: z.array(z.object({
    beatId: Id,
    actionIndex: z.number().int().min(0).max(63),
    actorId: Id,
    text: z.string().min(1).max(180),
  }).strict()).min(1).max(18),
}).strict()
export type DialoguePass = z.infer<typeof DialoguePassValidator>

export const BootstrapRequestValidator = z.object({
  sessionId: Id,
  locale: z.literal('ko-KR'),
  autonomy: AutonomyModeValidator,
}).strict()
export type BootstrapRequest = z.infer<typeof BootstrapRequestValidator>

export const ImagePayloadValidator = z.object({
  // Keep the complete JSON request comfortably below the server's 1 MiB cap.
  dataUrl: z.string().startsWith('data:image/').max(900_000),
  mimeType: z.enum(['image/png', 'image/jpeg', 'image/webp']),
  width: z.number().int().min(1).max(2048),
  height: z.number().int().min(1).max(2048),
  sha256: z.string().min(8).max(128),
}).strict()

export const DrawingMetricsPayloadValidator = z.object({
  strokeCount: z.number().int().min(1).max(500),
  pointCount: z.number().int().min(1).max(50000),
  totalLength: z.number().min(0).max(1000000),
  horizontalRatio: Unit,
  verticalRatio: Unit,
  overlap: Unit,
  density: Unit,
  centerX: z.number().min(0).max(2048),
  centerY: z.number().min(0).max(2048),
  extent: z.number().min(0).max(4096),
  rhythm: Unit,
  colorCount: z.number().int().min(1).max(32),
  warmColorRatio: Unit,
  coolColorRatio: Unit,
  brightColorRatio: Unit,
  dominantColor: Color,
}).strict()

export const DoodleBirthRequestValidator = z.object({
  requestId: Id,
  expectedRevision: z.number().int().min(0),
  autonomy: AutonomyModeValidator,
  image: ImagePayloadValidator,
  drawingMetrics: DrawingMetricsPayloadValidator.nullable(),
}).strict()
export type DoodleBirthRequest = z.infer<typeof DoodleBirthRequestValidator>

export const WorldSignalValidator = z.object({
  kind: z.enum(['newcomer-arrived', 'resident-focused', 'idle-pulse']),
  actorId: Id,
  detail: LongText,
}).strict()
export type WorldSignal = z.infer<typeof WorldSignalValidator>

export const WorldTurnRequestValidator = z.object({
  requestId: Id,
  expectedRevision: z.number().int().min(0),
  autonomy: AutonomyModeValidator,
  world: WorldStateValidator,
  signal: WorldSignalValidator,
}).strict()
export type WorldTurnRequest = z.infer<typeof WorldTurnRequestValidator>

export interface TokenUsage {
  readonly inputTokens: number
  readonly cachedInputTokens: number
  readonly outputTokens: number
  readonly reasoningTokens: number
  readonly totalTokens: number
}

export interface ModelCallTrace {
  readonly id: string
  readonly role: string
  readonly provider: 'openai' | 'mock'
  readonly model: string
  readonly startedAt: string
  readonly latencyMs: number
  readonly usage: TokenUsage
}

export interface TraceSummary {
  readonly mode: AutonomyMode
  readonly calls: readonly ModelCallTrace[]
  readonly usage: TokenUsage
  /** Sum of individual model-call times; parallel calls intentionally overlap. */
  readonly totalLatencyMs: number
  /** End-to-end orchestration wall time for this API operation. */
  readonly wallClockMs: number
}

export interface BootstrapResponse {
  readonly requestId: string
  readonly world: WorldState
  readonly trace: TraceSummary
}

export interface DoodleBirthResponse {
  readonly requestId: string
  readonly expectedRevision: number
  readonly character: CharacterBible
  readonly evidenceSummary: string
  readonly uncertainties: readonly string[]
  readonly trace: TraceSummary
}

export interface WorldTurnResponse {
  readonly requestId: string
  readonly baseRevision: number
  readonly nextWorld: WorldState
  readonly intents: readonly NPCIntent[]
  readonly proposedScene: GeneratedScene
  readonly critic: CriticReview
  readonly scene: GeneratedScene
  readonly trace: TraceSummary
}

function asJsonSchema(validator: z.ZodType): JsonSchema {
  const generated = z.toJSONSchema(validator, { target: 'draft-7' })
  return normalizeStructuredOutputSchema(generated) as JsonSchema
}

/** OpenAI Structured Outputs accepts `anyOf`, but not JSON Schema's `oneOf`. */
function normalizeStructuredOutputSchema(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalizeStructuredOutputSchema)
  if (typeof value !== 'object' || value === null) return value

  const normalized: Record<string, unknown> = {}
  for (const [key, child] of Object.entries(value)) {
    if (key === '$schema') continue
    normalized[key === 'oneOf' ? 'anyOf' : key] = normalizeStructuredOutputSchema(child)
  }
  return normalized
}

// These names are consumed directly by the Responses API structured-output layer.
export const BootstrapRequestSchema = asJsonSchema(BootstrapRequestValidator)
export const CharacterBibleSchema = asJsonSchema(CharacterBibleValidator)
export const CriticReviewSchema = asJsonSchema(CriticReviewValidator)
export const DialoguePassSchema = asJsonSchema(DialoguePassValidator)
export const DoodleBirthRequestSchema = asJsonSchema(DoodleBirthRequestValidator)
export const GeneratedSceneSchema = asJsonSchema(GeneratedSceneValidator)
export const NPCIntentSchema = asJsonSchema(NPCIntentValidator)
export const WorldStateSchema = asJsonSchema(WorldStateValidator)
export const WorldTurnRequestSchema = asJsonSchema(WorldTurnRequestValidator)

export function parseWorldState(value: unknown): WorldState {
  return WorldStateValidator.parse(value)
}

export function parseCharacterBible(value: unknown): CharacterBible {
  return CharacterBibleValidator.parse(value)
}

export function parseGeneratedScene(value: unknown): GeneratedScene {
  return GeneratedSceneValidator.parse(value)
}

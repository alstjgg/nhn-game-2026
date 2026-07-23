import { z } from 'zod'

import {
  CharacterDesignSpecValidator,
  DrawingMetricsPayloadValidator,
  ImagePayloadValidator,
  type CharacterDesignSpec,
  type TraceSummary,
} from '../ai/contracts.ts'

export type JsonSchema = Readonly<Record<string, unknown>>

const Id = z.string().min(1).max(64).regex(/^[a-zA-Z0-9_-]+$/)
const ShortText = z.string().min(1).max(160)
const LongText = z.string().min(1).max(700)
const Unit = z.number().min(0).max(1)

export const AffordanceValidator = z.enum([
  'glide',
  'float',
  'stretch',
  'climb',
  'listen',
  'echo',
  'carry_signal',
  'signal',
  'rhythm',
  'wait',
  'connect',
  'bridge',
  'grip',
  'roll',
  'shelter',
  'shade',
  'light',
  'reflect',
  'absorb',
  'carry',
  'filter',
])
export type Affordance = z.infer<typeof AffordanceValidator>

export const NeedRuleValidator = z.object({
  /** Each inner list is OR; every outer list must be satisfied (AND). */
  allOf: z.array(z.array(AffordanceValidator).min(1).max(8)).min(1).max(5),
}).strict()
export type NeedRule = z.infer<typeof NeedRuleValidator>

export const PositionValidator = z.object({
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
}).strict()
export type Position = z.infer<typeof PositionValidator>

export const EvidenceRegionValidator = z.object({
  x: Unit,
  y: Unit,
  width: z.number().min(0.01).max(1),
  height: z.number().min(0.01).max(1),
}).strict()
export type EvidenceRegion = z.infer<typeof EvidenceRegionValidator>

export const EngineEffectValidator = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('prop-state'),
    targetId: Id,
    state: ShortText,
    description: LongText,
  }).strict(),
  z.object({
    kind: z.literal('garden-state'),
    targetId: Id.nullable(),
    state: z.enum([
      'sound-restored',
      'path-opened',
      'light-kindled',
      'shade-grown',
      'wind-shifted',
      'water-linked',
      'unexpected-spark',
    ]),
    description: LongText,
  }).strict(),
  z.object({
    kind: z.literal('relationship-record'),
    title: ShortText,
    summary: LongText,
    affinityDelta: z.number().min(0).max(0.25),
  }).strict(),
])
export type EngineEffect = z.infer<typeof EngineEffectValidator>

export const QuestCluesValidator = z.object({
  dialogue: z.array(ShortText).min(1).max(2),
  behavior: z.array(ShortText).min(1).max(3),
  environment: z.array(ShortText).min(1).max(3),
  observationFocus: ShortText,
  visibleTarget: ShortText,
  visibleTiming: ShortText.nullable(),
}).strict()
export type QuestClues = z.infer<typeof QuestCluesValidator>

const OutcomeEffectsValidator = z.object({
  full: z.array(EngineEffectValidator).min(1).max(8),
  success: z.array(EngineEffectValidator).min(1).max(8),
  partial: z.array(EngineEffectValidator).min(1).max(8),
  fallbackUnexpected: z.array(EngineEffectValidator).min(1).max(8),
}).strict()

const UnexpectedEffectValidator = z.object({
  affordance: AffordanceValidator,
  effects: z.array(EngineEffectValidator).min(1).max(5),
}).strict()

export const QuestContractValidator = z.object({
  questId: Id,
  ownerNpcId: Id,
  observerNpcId: Id,
  title: ShortText,
  problemState: LongText,
  primaryPurpose: ShortText,
  primarySolutions: z.array(NeedRuleValidator).min(2).max(6),
  bonusPurpose: ShortText.nullable(),
  bonusSolutions: z.array(NeedRuleValidator).max(4),
  partialAffordances: z.array(AffordanceValidator).max(12),
  unexpectedEffects: z.array(UnexpectedEffectValidator).max(12),
  clues: QuestCluesValidator,
  outcomes: OutcomeEffectsValidator,
}).strict()
export type QuestContract = z.infer<typeof QuestContractValidator>

export const QuestPublicViewValidator = z.object({
  questId: Id,
  ownerNpcId: Id,
  title: ShortText,
  problemState: LongText,
  primaryPurpose: ShortText,
  clues: QuestCluesValidator,
  status: z.enum(['available', 'active', 'resolved']),
}).strict()
export type QuestPublicView = z.infer<typeof QuestPublicViewValidator>

export const DoodleResidentValidator = z.object({
  id: Id,
  name: ShortText,
  epithet: ShortText,
  essence: LongText,
  voiceStyle: ShortText,
  repeatedBehavior: LongText,
  silhouetteFamily: z.enum(['elongated', 'forked', 'hollow-ring', 'multi-leg', 'floating', 'layered']),
  aspectRatio: z.enum(['tall', 'wide', 'balanced']),
  supportMode: z.enum(['one-point', 'two-point', 'multi-point', 'floating', 'rolling']),
  homePosition: PositionValidator,
  design: CharacterDesignSpecValidator,
}).strict()
export type DoodleResident = z.infer<typeof DoodleResidentValidator>

export const GardenPropValidator = z.object({
  id: Id,
  label: ShortText,
  kind: z.enum(['chime', 'bell', 'ribbon', 'bridge', 'lamp', 'planter', 'pond', 'shelter', 'marker']),
  position: PositionValidator,
  state: ShortText,
  visibleClue: LongText,
}).strict()
export type GardenProp = z.infer<typeof GardenPropValidator>

export const RelationshipSeedValidator = z.object({
  sourceNpcId: Id,
  targetNpcId: Id,
  label: ShortText,
}).strict()
export type RelationshipSeed = z.infer<typeof RelationshipSeedValidator>

export const RelationshipRecordValidator = z.object({
  id: Id,
  questId: Id,
  ownerNpcId: Id,
  creatureId: Id,
  title: ShortText,
  summary: LongText,
  verdict: z.enum(['full', 'success', 'partial', 'unexpected']),
}).strict()
export type RelationshipRecord = z.infer<typeof RelationshipRecordValidator>

export const GardenCreatureRecordValidator = z.object({
  id: Id,
  name: ShortText,
  essence: LongText,
  imageSha256: z.string().min(8).max(128),
  questId: Id,
  verdict: z.enum(['full', 'success', 'partial', 'unexpected']),
  homePosition: PositionValidator,
}).strict()
export type GardenCreatureRecord = z.infer<typeof GardenCreatureRecordValidator>

export const DoodleWorldValidator = z.object({
  id: Id,
  revision: z.number().int().min(0),
  title: ShortText,
  premise: LongText,
  locationDescription: LongText,
  atmosphere: ShortText,
  residents: z.array(DoodleResidentValidator).length(3),
  props: z.array(GardenPropValidator).min(3).max(12),
  relationships: z.array(RelationshipSeedValidator).min(1).max(12),
  gardenStates: z.array(ShortText).max(24),
  creatures: z.array(GardenCreatureRecordValidator).max(12),
  records: z.array(RelationshipRecordValidator).max(24),
}).strict()
export type DoodleWorld = z.infer<typeof DoodleWorldValidator>

export const GeneratedGardenValidator = z.object({
  world: DoodleWorldValidator,
  quests: z.array(QuestContractValidator).length(3),
}).strict()
export type GeneratedGarden = z.infer<typeof GeneratedGardenValidator>

export const VisibleFeatureValidator = z.object({
  id: Id,
  label: ShortText,
  description: LongText,
  evidence: LongText,
  region: EvidenceRegionValidator,
  confidence: Unit,
  affordances: z.array(AffordanceValidator).max(5),
}).strict()
export type VisibleFeature = z.infer<typeof VisibleFeatureValidator>

export const MotionHintValidator = z.object({
  featureId: Id,
  motion: z.enum(['bend', 'flutter', 'lag', 'step', 'roll', 'wrap', 'float', 'pulse', 'rotate']),
  anchor: z.object({ x: Unit, y: Unit }).strict(),
  description: LongText,
}).strict()
export type MotionHint = z.infer<typeof MotionHintValidator>

export const DoodleUncertaintyValidator = z.object({
  region: EvidenceRegionValidator,
  reason: LongText,
}).strict()
export type DoodleUncertainty = z.infer<typeof DoodleUncertaintyValidator>

/** Private model output. Affordance tags remain on the server. */
export const DoodleReadingValidator = z.object({
  name: ShortText,
  essence: LongText,
  visibleFeatures: z.array(VisibleFeatureValidator).min(2).max(4),
  motionHints: z.array(MotionHintValidator).min(1).max(6),
  uncertainties: z.array(DoodleUncertaintyValidator).max(4),
}).strict()
export type DoodleReading = z.infer<typeof DoodleReadingValidator>

export const PublicVisibleFeatureValidator = VisibleFeatureValidator.omit({ affordances: true })
export type PublicVisibleFeature = z.infer<typeof PublicVisibleFeatureValidator>

export const PublicDoodleReadingValidator = z.object({
  name: ShortText,
  essence: LongText,
  visibleFeatures: z.array(PublicVisibleFeatureValidator).min(2).max(4),
  motionHints: z.array(MotionHintValidator).min(1).max(6),
  uncertainties: z.array(DoodleUncertaintyValidator).max(4),
}).strict()
export type PublicDoodleReading = z.infer<typeof PublicDoodleReadingValidator>

export const QuestVerdictValidator = z.enum(['full', 'success', 'partial', 'unexpected'])
export type QuestVerdict = z.infer<typeof QuestVerdictValidator>

export const QuestResolutionValidator = z.object({
  questId: Id,
  creatureId: Id,
  verdict: QuestVerdictValidator,
  matchedAffordances: z.array(AffordanceValidator).max(21),
  matchedPrimarySolution: z.number().int().min(0).max(5).nullable(),
  matchedPrimaryGroups: z.number().int().min(0).max(5),
  bonusMatched: z.boolean(),
  effects: z.array(EngineEffectValidator).min(1).max(12),
  questResolved: z.boolean(),
}).strict()
export type QuestResolution = z.infer<typeof QuestResolutionValidator>

export const QuestResolutionViewValidator = z.object({
  questId: Id,
  creatureId: Id,
  verdict: QuestVerdictValidator,
  title: ShortText,
  summary: LongText,
  nextHint: LongText.nullable(),
  appliedEffects: z.array(EngineEffectValidator).min(1).max(12),
  relationshipRecord: RelationshipRecordValidator,
  questResolved: z.boolean(),
}).strict()
export type QuestResolutionView = z.infer<typeof QuestResolutionViewValidator>

export const ReactionCommandValidator = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('speak'),
    actorId: Id,
    text: z.string().min(1).max(180),
  }).strict(),
  z.object({
    kind: z.literal('look'),
    actorId: Id,
    targetId: Id,
  }).strict(),
  z.object({
    kind: z.literal('gesture'),
    actorId: Id,
    gesture: z.enum(['nod', 'stretch', 'flutter', 'listen', 'circle', 'settle', 'spark']),
  }).strict(),
  z.object({
    kind: z.literal('move'),
    actorId: Id,
    to: PositionValidator,
    durationMs: z.number().int().min(250).max(3000),
  }).strict(),
  z.object({
    kind: z.literal('prop-motion'),
    actorId: Id,
    targetId: Id,
    motion: z.enum(['ring', 'sway', 'glow', 'ripple', 'open', 'settle']),
  }).strict(),
])
export type ReactionCommand = z.infer<typeof ReactionCommandValidator>

export const NpcReactionValidator = z.object({
  actorId: Id,
  emotion: z.enum(['relieved', 'delighted', 'curious', 'tender', 'surprised', 'thoughtful']),
  grounding: LongText,
  commands: z.array(ReactionCommandValidator).min(1).max(5),
}).strict()
export type NpcReaction = z.infer<typeof NpcReactionValidator>

export const ResolvedEncounterValidator = z.object({
  sceneId: Id,
  title: ShortText,
  statusText: LongText,
  participantIds: z.array(Id).min(2).max(3),
  commands: z.array(ReactionCommandValidator).min(1).max(10),
  discardedCommandCount: z.number().int().min(0).max(20),
  fallbackActorIds: z.array(Id).max(2),
}).strict()
export type ResolvedEncounter = z.infer<typeof ResolvedEncounterValidator>

export const SessionBootstrapRequestValidator = z.object({
  sessionId: Id,
  locale: z.literal('ko-KR'),
}).strict()
export type SessionBootstrapRequest = z.infer<typeof SessionBootstrapRequestValidator>

export const SelectQuestRequestValidator = z.object({
  sessionId: Id,
  questId: Id,
  expectedRevision: z.number().int().min(0),
}).strict()
export type SelectQuestRequest = z.infer<typeof SelectQuestRequestValidator>

export const DoodleReadingRequestValidator = z.object({
  requestId: Id,
  sessionId: Id,
  readIndex: z.union([z.literal(0), z.literal(1)]),
  image: ImagePayloadValidator,
  drawingMetrics: DrawingMetricsPayloadValidator.nullable(),
}).strict()
export type DoodleReadingRequest = z.infer<typeof DoodleReadingRequestValidator>

export const ResolveQuestRequestValidator = z.object({
  requestId: Id,
  sessionId: Id,
  expectedRevision: z.number().int().min(0),
}).strict()
export type ResolveQuestRequest = z.infer<typeof ResolveQuestRequestValidator>

export const EncounterReactionRequestValidator = z.object({
  requestId: Id,
  sessionId: Id,
  expectedRevision: z.number().int().min(0),
}).strict()
export type EncounterReactionRequest = z.infer<typeof EncounterReactionRequestValidator>

export interface DoodleLifeHealthResponse {
  readonly ok: boolean
  readonly service: string
  readonly provider: 'openai' | 'mock'
  readonly modelCallsEnabled: boolean
  readonly time: string
}

export interface SessionBootstrapResponse {
  readonly requestId: string
  readonly cached: boolean
  readonly usedFallback: boolean
  readonly fallbackReason: string | null
  readonly world: DoodleWorld
  readonly quests: readonly QuestPublicView[]
  readonly trace: TraceSummary
}

export interface SelectQuestResponse {
  readonly requestId: string
  readonly worldRevision: number
  readonly quest: QuestPublicView
}

export interface DoodleReadingResponse {
  readonly requestId: string
  readonly readIndex: 0 | 1
  readonly canReread: boolean
  readonly usedFallback: boolean
  readonly fallbackReason: string | null
  readonly reading: PublicDoodleReading
  readonly trace: TraceSummary
}

export interface ResolveQuestResponse {
  readonly requestId: string
  readonly baseRevision: number
  readonly nextWorld: DoodleWorld
  readonly result: QuestResolutionView
  readonly reading: PublicDoodleReading
  readonly trace: TraceSummary
}

export interface EncounterReactionResponse {
  readonly requestId: string
  readonly worldRevision: number
  readonly encounter: ResolvedEncounter
  readonly trace: TraceSummary
}

export interface DoodleCreature {
  readonly id: string
  readonly name: string
  readonly essence: string
  readonly sprite: {
    readonly width: number
    readonly height: number
    readonly sha256: string
  }
  readonly reading: PublicDoodleReading
}

const TokenUsageValidator = z.object({
  inputTokens: z.number().int().min(0),
  cachedInputTokens: z.number().int().min(0),
  outputTokens: z.number().int().min(0),
  reasoningTokens: z.number().int().min(0),
  totalTokens: z.number().int().min(0),
}).strict()

const ModelCallTraceValidator = z.object({
  id: z.string().min(1),
  role: z.string().min(1),
  provider: z.enum(['openai', 'mock']),
  model: z.string().min(1),
  startedAt: z.string().min(1),
  latencyMs: z.number().min(0),
  usage: TokenUsageValidator,
}).strict()

export const StagedTraceSummaryValidator = z.object({
  mode: z.literal('staged'),
  calls: z.array(ModelCallTraceValidator),
  usage: TokenUsageValidator,
  totalLatencyMs: z.number().min(0),
  wallClockMs: z.number().min(0),
}).strict()

export const DoodleLifeHealthResponseValidator = z.object({
  ok: z.boolean(),
  service: z.string().min(1),
  provider: z.enum(['openai', 'mock']),
  modelCallsEnabled: z.boolean(),
  time: z.string().min(1),
}).passthrough()

export const SessionBootstrapResponseValidator = z.object({
  requestId: z.string().min(1),
  cached: z.boolean(),
  usedFallback: z.boolean(),
  fallbackReason: z.string().nullable(),
  world: DoodleWorldValidator,
  quests: z.array(QuestPublicViewValidator).length(3),
  trace: StagedTraceSummaryValidator,
}).strict()

export const SelectQuestResponseValidator = z.object({
  requestId: z.string().min(1),
  worldRevision: z.number().int().min(0),
  quest: QuestPublicViewValidator,
}).strict()

export const DoodleReadingResponseValidator = z.object({
  requestId: z.string().min(1),
  readIndex: z.union([z.literal(0), z.literal(1)]),
  canReread: z.boolean(),
  usedFallback: z.boolean(),
  fallbackReason: z.string().nullable(),
  reading: PublicDoodleReadingValidator,
  trace: StagedTraceSummaryValidator,
}).strict()

export const ResolveQuestResponseValidator = z.object({
  requestId: z.string().min(1),
  baseRevision: z.number().int().min(0),
  nextWorld: DoodleWorldValidator,
  result: QuestResolutionViewValidator,
  reading: PublicDoodleReadingValidator,
  trace: StagedTraceSummaryValidator,
}).strict()

export const EncounterReactionResponseValidator = z.object({
  requestId: z.string().min(1),
  worldRevision: z.number().int().min(0),
  encounter: ResolvedEncounterValidator,
  trace: StagedTraceSummaryValidator,
}).strict()

function asJsonSchema(validator: z.ZodType): JsonSchema {
  const generated = z.toJSONSchema(validator, { target: 'draft-7' })
  return normalizeStructuredOutputSchema(generated) as JsonSchema
}

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

export const DoodleReadingSchema = asJsonSchema(DoodleReadingValidator)
export const GeneratedGardenSchema = asJsonSchema(GeneratedGardenValidator)
export const NpcReactionSchema = asJsonSchema(NpcReactionValidator)

export function toPublicReading(reading: DoodleReading): PublicDoodleReading {
  return {
    name: reading.name,
    essence: reading.essence,
    visibleFeatures: reading.visibleFeatures.map(({ affordances: _affordances, ...feature }) => feature),
    motionHints: reading.motionHints,
    uncertainties: reading.uncertainties,
  }
}

export function toQuestPublicView(
  quest: QuestContract,
  status: QuestPublicView['status'],
): QuestPublicView {
  return {
    questId: quest.questId,
    ownerNpcId: quest.ownerNpcId,
    title: quest.title,
    problemState: quest.problemState,
    primaryPurpose: quest.primaryPurpose,
    clues: quest.clues,
    status,
  }
}

export type { CharacterDesignSpec, TraceSummary }

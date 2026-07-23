import { createHash } from 'node:crypto'

import {
  DoodleReadingValidator,
  DoodleWorldValidator,
  GeneratedGardenValidator,
  QuestContractValidator,
  type Affordance,
  type DoodleReading,
  type DoodleWorld,
  type EngineEffect,
  type GeneratedGarden,
  type NeedRule,
  type NpcReaction,
  type QuestContract,
  type QuestResolution,
  type QuestResolutionView,
  type QuestVerdict,
  type ReactionCommand,
  type RelationshipRecord,
  type ResolvedEncounter,
} from '../../src/doodle-life/contracts.ts'

export class DoodleLifeDomainError extends Error {
  readonly status: number
  readonly code: string

  constructor(message: string, code = 'invalid_doodle_life_state', status = 422) {
    super(message)
    this.name = 'DoodleLifeDomainError'
    this.code = code
    this.status = status
  }
}

export interface LockedQuest {
  readonly contract: Readonly<QuestContract>
  readonly hash: string
}

export interface AppliedResolution {
  readonly world: DoodleWorld
  readonly view: QuestResolutionView
  readonly record: RelationshipRecord
}

const DIRECT_ANSWER_TERMS = [
  '날개를 그',
  '새를 그',
  '비행기를 그',
  '풍선을 그',
  '사다리를 그',
  '메가폰을 그',
  '귀를 그',
  '꼬리를 그',
  'glide',
  'float',
  'stretch',
  'climb',
  'listen',
  'echo',
  'carry_signal',
] as const

export function validateGeneratedGarden(value: unknown): GeneratedGarden {
  const garden = GeneratedGardenValidator.parse(value)
  const residentIds = new Set(garden.world.residents.map((resident) => resident.id))
  const propIds = new Set(garden.world.props.map((prop) => prop.id))
  const questIds = new Set<string>()
  const ownerIds = new Set<string>()

  if (residentIds.size !== 3) fail('The garden must contain exactly three unique residents.')
  assertSilhouetteDiversity(garden)

  for (const quest of garden.quests) {
    if (questIds.has(quest.questId)) fail(`Duplicate quest id: ${quest.questId}`)
    questIds.add(quest.questId)
    if (!residentIds.has(quest.ownerNpcId)) fail(`Unknown quest owner: ${quest.ownerNpcId}`)
    if (!residentIds.has(quest.observerNpcId)) fail(`Unknown quest observer: ${quest.observerNpcId}`)
    if (quest.ownerNpcId === quest.observerNpcId) fail(`Quest ${quest.questId} uses its owner as observer.`)
    if (ownerIds.has(quest.ownerNpcId)) fail(`Resident ${quest.ownerNpcId} owns more than one quest.`)
    ownerIds.add(quest.ownerNpcId)
    validateQuestSemantics(quest, propIds)
  }

  if (ownerIds.size !== 3) fail('Every resident must own one locked quest.')
  return garden
}

export function validateQuestSemantics(quest: QuestContract, propIds: ReadonlySet<string>): void {
  QuestContractValidator.parse(quest)
  if (quest.bonusPurpose === null && quest.bonusSolutions.length > 0) {
    fail(`Quest ${quest.questId} has bonus rules without a bonus purpose.`)
  }
  if (quest.bonusPurpose !== null && quest.bonusSolutions.length === 0) {
    fail(`Quest ${quest.questId} has a bonus purpose without a solvable rule.`)
  }

  const solutionKeys = new Set<string>()
  for (const solution of quest.primarySolutions) {
    const key = canonicalJson(solution)
    if (solutionKeys.has(key)) fail(`Quest ${quest.questId} repeats a primary solution.`)
    solutionKeys.add(key)
  }

  const clueText = [
    ...quest.clues.dialogue,
    ...quest.clues.behavior,
    ...quest.clues.environment,
  ].join(' ').toLowerCase()
  const leakedTerm = DIRECT_ANSWER_TERMS.find((term) => clueText.includes(term))
  if (leakedTerm) fail(`Quest ${quest.questId} exposes a direct answer term: ${leakedTerm}`)

  for (const effects of [
    quest.outcomes.full,
    quest.outcomes.success,
    quest.outcomes.partial,
    quest.outcomes.fallbackUnexpected,
    ...quest.unexpectedEffects.map((mapping) => mapping.effects),
  ]) {
    validateEffects(effects, propIds, quest.questId)
  }

  const unexpectedTags = new Set<Affordance>()
  for (const mapping of quest.unexpectedEffects) {
    if (unexpectedTags.has(mapping.affordance)) {
      fail(`Quest ${quest.questId} repeats unexpected affordance ${mapping.affordance}.`)
    }
    unexpectedTags.add(mapping.affordance)
  }
}

export function lockQuest(contract: QuestContract): LockedQuest {
  const parsed = QuestContractValidator.parse(structuredClone(contract))
  return {
    contract: deepFreeze(parsed),
    hash: questContractHash(parsed),
  }
}

export function questContractHash(contract: QuestContract | Readonly<QuestContract>): string {
  return createHash('sha256').update(canonicalJson(contract)).digest('hex')
}

export function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalValue(value))
}

export function validReadingAffordances(readingValue: DoodleReading): readonly Affordance[] {
  const reading = DoodleReadingValidator.parse(readingValue)
  const affordances = new Set<Affordance>()
  const featureIds = new Set(reading.visibleFeatures.map((feature) => feature.id))

  for (const feature of reading.visibleFeatures) {
    if (feature.confidence < 0.35 || !regionIsInsideCanvas(feature.region)) continue
    for (const affordance of feature.affordances) affordances.add(affordance)
  }
  for (const hint of reading.motionHints) {
    if (!featureIds.has(hint.featureId)) {
      throw new DoodleLifeDomainError(
        `Motion hint references missing feature ${hint.featureId}.`,
        'invalid_doodle_evidence',
      )
    }
  }
  return [...affordances].sort()
}

export function evaluateQuest(
  questValue: QuestContract | Readonly<QuestContract>,
  readingValue: DoodleReading,
  creatureId: string,
): QuestResolution {
  const quest = QuestContractValidator.parse(questValue)
  const affordances = new Set(validReadingAffordances(readingValue))
  const matchedPrimarySolution = quest.primarySolutions.findIndex((rule) => ruleMatches(rule, affordances))
  const primaryMatched = matchedPrimarySolution >= 0
  const bonusMatched = quest.bonusSolutions.some((rule) => ruleMatches(rule, affordances))
  const matchedPrimaryGroups = Math.max(
    0,
    ...quest.primarySolutions.map((rule) => matchedGroupCount(rule, affordances)),
  )

  let verdict: QuestVerdict
  let effects: readonly EngineEffect[]
  if (primaryMatched && bonusMatched) {
    verdict = 'full'
    effects = quest.outcomes.full
  } else if (primaryMatched) {
    verdict = 'success'
    effects = quest.outcomes.success
  } else if (
    matchedPrimaryGroups > 0
    || quest.partialAffordances.some((affordance) => affordances.has(affordance))
  ) {
    verdict = 'partial'
    effects = quest.outcomes.partial
  } else {
    verdict = 'unexpected'
    effects = quest.unexpectedEffects.find((mapping) => affordances.has(mapping.affordance))?.effects
      ?? quest.outcomes.fallbackUnexpected
  }

  return {
    questId: quest.questId,
    creatureId,
    verdict,
    matchedAffordances: [...affordances],
    matchedPrimarySolution: matchedPrimarySolution >= 0 ? matchedPrimarySolution : null,
    matchedPrimaryGroups,
    bonusMatched,
    effects: effects.map((effect) => structuredClone(effect)),
    questResolved: verdict === 'full' || verdict === 'success',
  }
}

export function applyResolution(
  worldValue: DoodleWorld,
  questValue: QuestContract | Readonly<QuestContract>,
  reading: DoodleReading,
  imageSha256: string,
  resolution: QuestResolution,
): AppliedResolution {
  const world = DoodleWorldValidator.parse(worldValue)
  const quest = QuestContractValidator.parse(questValue)
  if (resolution.questId !== quest.questId) {
    throw new DoodleLifeDomainError('Resolution does not belong to the active quest.', 'quest_mismatch', 409)
  }
  const expectedEffects = effectsForVerdict(quest, resolution)
  if (canonicalJson(expectedEffects) !== canonicalJson(resolution.effects)) {
    throw new DoodleLifeDomainError('Resolution effects do not match the locked contract.', 'effect_integrity_error', 409)
  }

  const relationshipEffect = resolution.effects.find(
    (effect): effect is Extract<EngineEffect, { kind: 'relationship-record' }> => effect.kind === 'relationship-record',
  )
  if (!relationshipEffect) {
    throw new DoodleLifeDomainError('Every result must produce a relationship record.')
  }

  const record: RelationshipRecord = {
    id: `record_${quest.questId}_${resolution.creatureId}`.slice(0, 64),
    questId: quest.questId,
    ownerNpcId: quest.ownerNpcId,
    creatureId: resolution.creatureId,
    title: relationshipEffect.title,
    summary: relationshipEffect.summary,
    verdict: resolution.verdict,
  }
  const props = world.props.map((prop) => {
    const change = resolution.effects.find(
      (effect): effect is Extract<EngineEffect, { kind: 'prop-state' }> => (
        effect.kind === 'prop-state' && effect.targetId === prop.id
      ),
    )
    return change ? { ...prop, state: change.state } : prop
  })
  const gardenStates = [
    ...world.gardenStates,
    ...resolution.effects
      .filter((effect): effect is Extract<EngineEffect, { kind: 'garden-state' }> => effect.kind === 'garden-state')
      .map((effect) => effect.state),
  ].slice(-24)
  const creature = {
    id: resolution.creatureId,
    name: reading.name,
    essence: reading.essence,
    imageSha256,
    questId: quest.questId,
    verdict: resolution.verdict,
    homePosition: { x: 52, y: 68 },
  } as const
  const nextWorld = DoodleWorldValidator.parse({
    ...world,
    revision: world.revision + 1,
    props,
    gardenStates,
    creatures: [...world.creatures.filter((candidate) => candidate.id !== creature.id), creature],
    records: [...world.records.filter((candidate) => candidate.id !== record.id), record],
  })

  return {
    world: nextWorld,
    record,
    view: {
      questId: quest.questId,
      creatureId: resolution.creatureId,
      verdict: resolution.verdict,
      title: resultTitle(resolution.verdict),
      summary: resolution.effects.map(effectText).join(' '),
      nextHint: resolution.questResolved
        ? null
        : `다시 시도한다면 “${quest.clues.observationFocus}”을 그림의 다른 부분에서도 확인해 보세요.`,
      appliedEffects: structuredClone(resolution.effects),
      relationshipRecord: record,
      questResolved: resolution.questResolved,
    },
  }
}

export function resolveEncounter(
  worldValue: DoodleWorld,
  questValue: QuestContract | Readonly<QuestContract>,
  resolution: QuestResolution,
  reactions: readonly {
    readonly expectedActorId: string
    readonly value: NpcReaction | null
  }[],
): ResolvedEncounter {
  const world = DoodleWorldValidator.parse(worldValue)
  const quest = QuestContractValidator.parse(questValue)
  const creatureId = resolution.creatureId
  const participantIds = [quest.ownerNpcId, quest.observerNpcId, creatureId]
  const actorIds = new Set(participantIds)
  const propIds = new Set(world.props.map((prop) => prop.id))
  const allowedPropIds = new Set(
    resolution.effects.flatMap((effect) => (
      effect.kind === 'prop-state' || (effect.kind === 'garden-state' && effect.targetId)
        ? [effect.targetId]
        : []
    )).filter((value): value is string => Boolean(value)),
  )
  const commands: ReactionCommand[] = []
  const fallbackActorIds: string[] = []
  let discardedCommandCount = 0

  for (const reaction of reactions.slice(0, 2)) {
    const value = reaction.value
    if (!value || value.actorId !== reaction.expectedActorId || !actorIds.has(value.actorId)) {
      fallbackActorIds.push(reaction.expectedActorId)
      commands.push(...fallbackReaction(reaction.expectedActorId, quest.ownerNpcId, creatureId, resolution.verdict))
      continue
    }
    let acceptedForActor = 0
    for (const command of value.commands) {
      if (command.actorId !== value.actorId) {
        discardedCommandCount++
        continue
      }
      if (command.kind === 'look' && !actorIds.has(command.targetId)) {
        discardedCommandCount++
        continue
      }
      if (command.kind === 'prop-motion' && (
        !propIds.has(command.targetId) || !allowedPropIds.has(command.targetId)
      )) {
        discardedCommandCount++
        continue
      }
      if (command.kind === 'move' && !positionIsFree(command.to, world, value.actorId)) {
        discardedCommandCount++
        continue
      }
      commands.push(command)
      acceptedForActor++
    }
    if (acceptedForActor === 0) {
      fallbackActorIds.push(value.actorId)
      commands.push(...fallbackReaction(value.actorId, quest.ownerNpcId, creatureId, resolution.verdict))
    }
  }

  if (commands.length === 0) {
    fallbackActorIds.push(quest.ownerNpcId)
    commands.push(...fallbackReaction(quest.ownerNpcId, quest.ownerNpcId, creatureId, resolution.verdict))
  }
  return {
    sceneId: `scene_${quest.questId}_${world.revision}`.slice(0, 64),
    title: resultTitle(resolution.verdict),
    statusText: commands.find((command) => command.kind === 'speak')?.text
      ?? '주민들이 새 생명체의 움직임을 조용히 지켜봅니다.',
    participantIds,
    commands,
    discardedCommandCount,
    fallbackActorIds: [...new Set(fallbackActorIds)].slice(0, 2),
  }
}

function assertSilhouetteDiversity(garden: GeneratedGarden): void {
  const residents = garden.world.residents
  for (let left = 0; left < residents.length; left++) {
    for (let right = left + 1; right < residents.length; right++) {
      const a = residents[left]
      const b = residents[right]
      if (!a || !b) continue
      const distinctAxes = [
        a.silhouetteFamily !== b.silhouetteFamily,
        a.aspectRatio !== b.aspectRatio,
        a.supportMode !== b.supportMode,
      ].filter(Boolean).length
      if (distinctAxes < 2) {
        fail(`${a.name} and ${b.name} are not distinct on at least two silhouette axes.`)
      }
    }
  }
}

function validateEffects(
  effects: readonly EngineEffect[],
  propIds: ReadonlySet<string>,
  questId: string,
): void {
  if (!effects.some((effect) => effect.kind === 'relationship-record')) {
    fail(`Quest ${questId} has an outcome without a relationship record.`)
  }
  for (const effect of effects) {
    if (effect.kind === 'prop-state' && !propIds.has(effect.targetId)) {
      fail(`Quest ${questId} references missing prop ${effect.targetId}.`)
    }
    if (effect.kind === 'garden-state' && effect.targetId !== null && !propIds.has(effect.targetId)) {
      fail(`Quest ${questId} references missing garden target ${effect.targetId}.`)
    }
  }
}

function regionIsInsideCanvas(region: DoodleReading['visibleFeatures'][number]['region']): boolean {
  return region.x >= 0
    && region.y >= 0
    && region.width > 0
    && region.height > 0
    && region.x + region.width <= 1
    && region.y + region.height <= 1
}

function ruleMatches(rule: NeedRule, affordances: ReadonlySet<Affordance>): boolean {
  return rule.allOf.every((orGroup) => orGroup.some((affordance) => affordances.has(affordance)))
}

function matchedGroupCount(rule: NeedRule, affordances: ReadonlySet<Affordance>): number {
  return rule.allOf.filter((orGroup) => orGroup.some((affordance) => affordances.has(affordance))).length
}

function effectsForVerdict(quest: QuestContract, resolution: QuestResolution): readonly EngineEffect[] {
  if (resolution.verdict === 'full') return quest.outcomes.full
  if (resolution.verdict === 'success') return quest.outcomes.success
  if (resolution.verdict === 'partial') return quest.outcomes.partial
  const mapped = quest.unexpectedEffects.find((mapping) => (
    resolution.matchedAffordances.includes(mapping.affordance)
  ))
  return mapped?.effects ?? quest.outcomes.fallbackUnexpected
}

function resultTitle(verdict: QuestVerdict): string {
  if (verdict === 'full') return '완전 해결 · 마지막 박자까지'
  if (verdict === 'success') return '해결 · 끊긴 길이 이어졌어요'
  if (verdict === 'partial') return '부분 해결 · 한 가지가 더 필요해요'
  return '뜻밖의 결과 · 다른 가능성이 태어났어요'
}

function effectText(effect: EngineEffect): string {
  return effect.kind === 'relationship-record' ? effect.summary : effect.description
}

function fallbackReaction(
  actorId: string,
  ownerId: string,
  creatureId: string,
  verdict: QuestVerdict,
): ReactionCommand[] {
  const owner = actorId === ownerId
  const text = owner
    ? verdict === 'full'
      ? '세 번째 소리까지 왔어. 네 모습이 길을 기억했구나.'
      : verdict === 'success'
        ? '끊기던 곳이 이어졌어. 네가 만든 길이 보여.'
        : verdict === 'partial'
          ? '여기까지는 닿았어. 이제 건너편도 네 움직임을 기다려.'
          : '부탁과는 다른 길이지만, 이 움직임도 정원에 남겨 둘게.'
    : '처음 보는 몸인데도, 어디를 보고 움직이는지는 알 것 같아.'
  return [
    { kind: 'look', actorId, targetId: creatureId },
    { kind: 'speak', actorId, text },
    { kind: 'gesture', actorId, gesture: owner ? 'nod' : 'settle' },
  ]
}

function positionIsFree(position: { readonly x: number; readonly y: number }, world: DoodleWorld, actorId: string): boolean {
  const occupied = [
    ...world.residents
      .filter((resident) => resident.id !== actorId)
      .map((resident) => resident.homePosition),
    ...world.props.map((prop) => prop.position),
  ]
  return occupied.every((candidate) => Math.hypot(candidate.x - position.x, candidate.y - position.y) >= 4)
}

function canonicalValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalValue)
  if (typeof value !== 'object' || value === null) return value
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => [key, canonicalValue(child)]),
  )
}

function deepFreeze<T>(value: T): Readonly<T> {
  if (typeof value !== 'object' || value === null || Object.isFrozen(value)) return value
  for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child)
  return Object.freeze(value)
}

function fail(message: string): never {
  throw new DoodleLifeDomainError(message, 'invalid_quest_contract')
}

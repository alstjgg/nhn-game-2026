export * from '../data/game-data.ts'

import {
  AUTO_NAMES,
  EMERGENT_EVENTS,
  REQUESTS,
  STARTER_RESIDENTS,
  TRAIT_VALUES,
  type EmergentEventTemplate,
  type HiddenRequestDefinition,
  type ResidentDefinition,
  type TraitAxis,
  type TraitRequirement,
  type TraitSet,
  type TraitValueMap,
} from '../data/game-data.ts'

export type MatchTier = 'just-right' | 'oddly-good' | 'new-discovery'
export type RequestDefinition = HiddenRequestDefinition

export interface MatchResult {
  readonly tier: MatchTier
  readonly score: number
  readonly resolved: boolean
  readonly matchedRequirements: readonly TraitRequirement[]
  readonly missingRequirements: readonly TraitRequirement[]
  readonly label: string
  readonly reaction: string
}

export interface ResidentLike {
  readonly id: string
  readonly name: string
  readonly traits: TraitSet
}

export interface EmergentEventMatch {
  readonly template: EmergentEventTemplate
  readonly actorA: ResidentLike
  readonly actorB: ResidentLike
  readonly scene: string
}

export function getTrait<Axis extends TraitAxis>(traits: TraitSet, axis: Axis): TraitValueMap[Axis] {
  return traits[axis]
}

export function hasTrait(traits: TraitSet, requirement: TraitRequirement): boolean {
  return traits[requirement.axis] === requirement.value
}

export function getRequestByIndex(index: number): HiddenRequestDefinition | undefined {
  return REQUESTS.find((request) => request.order === index)
}

export function getNextRequest(completedRequestIds: readonly string[]): HiddenRequestDefinition | undefined {
  const completed = new Set(completedRequestIds)
  return REQUESTS.find((request) => !completed.has(request.id))
}

export function getResidentById(id: string): ResidentDefinition | undefined {
  return STARTER_RESIDENTS.find((resident) => resident.id === id)
}

export function evaluateMatch(
  traits: TraitSet,
  request: HiddenRequestDefinition,
  reactionSeed = '',
): MatchResult {
  const matchedRequirements = request.requirements.filter((requirement) => hasTrait(traits, requirement))
  const missingRequirements = request.requirements.filter((requirement) => !hasTrait(traits, requirement))
  const score = request.requirements.length === 0 ? 1 : matchedRequirements.length / request.requirements.length
  const tier: MatchTier = score >= 1 ? 'just-right' : score > 0 ? 'oddly-good' : 'new-discovery'
  const reactionPool = tier === 'just-right'
    ? request.reactions.exact
    : tier === 'oddly-good'
      ? request.reactions.partial
      : request.reactions.miss
  const reactionIndex = stableHash(`${request.id}:${reactionSeed}`) % reactionPool.length

  return {
    tier,
    score,
    resolved: tier === 'just-right',
    matchedRequirements,
    missingRequirements,
    label: tier === 'just-right'
      ? '딱 맞는 인사'
      : tier === 'oddly-good'
        ? '엉뚱하지만 좋은 시작'
        : '이번엔 새로운 발견',
    reaction: reactionPool[reactionIndex] ?? '',
  }
}

export function pickAutoName(usedNames: readonly string[], seed: string | number = usedNames.length): string {
  const used = new Set(usedNames)
  const start = stableHash(String(seed)) % AUTO_NAMES.length

  for (let offset = 0; offset < AUTO_NAMES.length; offset += 1) {
    const candidate = AUTO_NAMES[(start + offset) % AUTO_NAMES.length]
    if (candidate !== undefined && !used.has(candidate)) return candidate
  }

  const base = AUTO_NAMES[start] ?? '꼬물이'
  let suffix = 2
  while (used.has(`${base}${suffix}`)) suffix += 1
  return `${base}${suffix}`
}

export const createResidentName = pickAutoName

export function findEmergentEvents(
  residents: readonly ResidentLike[],
  options: {
    readonly involvingResidentId?: string
    readonly excludedEventIds?: readonly string[]
  } = {},
): readonly EmergentEventMatch[] {
  const excluded = new Set(options.excludedEventIds ?? [])
  const matches: EmergentEventMatch[] = []

  for (const template of EMERGENT_EVENTS) {
    if (excluded.has(template.id)) continue
    const match = findActorPair(template, residents, options.involvingResidentId)
    if (!match) continue
    matches.push({
      template,
      actorA: match.actorA,
      actorB: match.actorB,
      scene: template.scene
        .replaceAll('{actorA}', match.actorA.name)
        .replaceAll('{actorB}', match.actorB.name),
    })
  }

  return matches
}

export function getEmergentEvents(
  residents: readonly ResidentLike[],
  involvingResidentId?: string,
): readonly EmergentEventMatch[] {
  return findEmergentEvents(residents, { involvingResidentId })
}

export function nextTraitValue<Axis extends TraitAxis>(
  axis: Axis,
  current: TraitValueMap[Axis],
  offset = 1,
): TraitValueMap[Axis] {
  const values = TRAIT_VALUES[axis] as unknown as readonly TraitValueMap[Axis][]
  const currentIndex = values.indexOf(current)
  const nextIndex = ((Math.max(0, currentIndex) + offset) % values.length + values.length) % values.length
  return values[nextIndex] ?? values[0]
}

function findActorPair(
  template: EmergentEventTemplate,
  residents: readonly ResidentLike[],
  involvingResidentId: string | undefined,
): { readonly actorA: ResidentLike; readonly actorB: ResidentLike } | undefined {
  for (const actorA of residents) {
    if (!hasTrait(actorA.traits, template.actorA.requirement)) continue
    for (const actorB of residents) {
      if (actorA.id === actorB.id || !hasTrait(actorB.traits, template.actorB.requirement)) continue
      if (involvingResidentId && actorA.id !== involvingResidentId && actorB.id !== involvingResidentId) continue
      return { actorA, actorB }
    }
  }
  return undefined
}

function stableHash(value: string): number {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

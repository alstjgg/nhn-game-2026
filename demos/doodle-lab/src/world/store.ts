import {
  CharacterBibleValidator,
  GeneratedSceneValidator,
  WorldStateValidator,
  type CharacterBible,
  type GeneratedScene,
  type Relationship,
  type StoryThread,
  type WorldMutation,
  type WorldState,
} from '../ai/contracts.ts'

export class WorldRevisionConflictError extends Error {
  readonly expected: number
  readonly actual: number

  constructor(expected: number, actual: number) {
    super(`Expected world revision ${expected}, received ${actual}.`)
    this.name = 'WorldRevisionConflictError'
    this.expected = expected
    this.actual = actual
  }
}

/** Revisioned client state. It applies model-authored mutations without choosing story meaning. */
export class WorldStore {
  #state: WorldState

  constructor(initial: WorldState) {
    this.#state = clone(WorldStateValidator.parse(initial))
    assertUniqueResidents(this.#state)
  }

  get revision(): number {
    return this.#state.revision
  }

  snapshot(): WorldState {
    return clone(this.#state)
  }

  addResident(expectedRevision: number, resident: CharacterBible): WorldState {
    this.#assertRevision(expectedRevision)
    const parsed = CharacterBibleValidator.parse(resident)
    if (this.#state.residents.some((candidate) => candidate.id === parsed.id)) {
      throw new Error(`Resident ${parsed.id} already exists.`)
    }
    this.#state = WorldStateValidator.parse({
      ...this.#state,
      revision: this.#state.revision + 1,
      residents: [...this.#state.residents, parsed],
    })
    return this.snapshot()
  }

  applyScene(expectedRevision: number, scene: GeneratedScene): WorldState {
    this.#assertRevision(expectedRevision)
    const approved = GeneratedSceneValidator.parse(scene)
    let next = clone(this.#state)
    for (const [index, mutation] of approved.mutations.entries()) {
      next = applyMutation(next, approved.id, mutation, index)
    }
    next = {
      ...next,
      revision: expectedRevision + 1,
      recentScenes: [
        ...next.recentScenes,
        {
          id: approved.id,
          title: approved.title,
          summary: approved.summary,
          participantIds: approved.participantIds,
          atRevision: expectedRevision + 1,
        },
      ].slice(-20),
    }
    this.#state = WorldStateValidator.parse(next)
    return this.snapshot()
  }

  replaceFromServer(expectedRevision: number, nextWorld: WorldState): WorldState {
    this.#assertRevision(expectedRevision)
    const parsed = WorldStateValidator.parse(nextWorld)
    if (parsed.id !== this.#state.id) throw new Error('The server returned a different world id.')
    if (parsed.revision !== expectedRevision + 1) {
      throw new WorldRevisionConflictError(expectedRevision + 1, parsed.revision)
    }
    assertUniqueResidents(parsed)
    this.#state = clone(parsed)
    return this.snapshot()
  }

  #assertRevision(expectedRevision: number): void {
    if (this.#state.revision !== expectedRevision) {
      throw new WorldRevisionConflictError(expectedRevision, this.#state.revision)
    }
  }
}

function applyMutation(
  world: WorldState,
  sceneId: string,
  mutation: WorldMutation,
  index: number,
): WorldState {
  if (mutation.kind === 'relationship') return applyRelationship(world, sceneId, mutation)
  if (mutation.kind === 'memory') {
    requireResident(world, mutation.actorId)
    return {
      ...world,
      memories: [...world.memories, {
        id: `${sceneId}-memory-${index + 1}`,
        ownerId: mutation.actorId,
        sceneId,
        summary: mutation.summary,
        interpretation: mutation.interpretation,
        visibility: mutation.visibility,
        salience: mutation.salience,
      }].slice(-160),
    }
  }
  if (mutation.kind === 'mood' || mutation.kind === 'goal') {
    requireResident(world, mutation.actorId)
    return {
      ...world,
      residents: world.residents.map((resident) => resident.id === mutation.actorId
        ? mutation.kind === 'mood'
          ? { ...resident, mood: mutation.mood }
          : { ...resident, currentGoal: mutation.goal }
        : resident),
    }
  }
  return applyThread(world, sceneId, mutation)
}

function applyRelationship(
  world: WorldState,
  sceneId: string,
  mutation: Extract<WorldMutation, { kind: 'relationship' }>,
): WorldState {
  requireResident(world, mutation.actorId)
  requireResident(world, mutation.targetId)
  const existing = world.relationships.find((relationship) => (
    relationship.sourceId === mutation.actorId && relationship.targetId === mutation.targetId
  ))
  const changed: Relationship = {
    sourceId: mutation.actorId,
    targetId: mutation.targetId,
    affinity: clamp((existing?.affinity ?? 0) + mutation.affinityDelta, -1, 1),
    trust: clamp((existing?.trust ?? 0.2) + mutation.trustDelta, 0, 1),
    tension: clamp((existing?.tension ?? 0) + mutation.tensionDelta, 0, 1),
    label: mutation.label,
    lastChangedSceneId: sceneId,
  }
  return {
    ...world,
    relationships: existing
      ? world.relationships.map((relationship) => relationship === existing ? changed : relationship)
      : [...world.relationships, changed],
  }
}

function applyThread(
  world: WorldState,
  sceneId: string,
  mutation: Extract<WorldMutation, { kind: 'thread' }>,
): WorldState {
  const existing = world.openThreads.find((thread) => thread.id === mutation.threadId)
  const changed: StoryThread = {
    id: mutation.threadId,
    title: mutation.title,
    description: mutation.description,
    participantIds: mutation.participantIds,
    status: mutation.operation === 'resolve' ? 'resolved' : 'open',
    createdSceneId: existing?.createdSceneId ?? sceneId,
  }
  return {
    ...world,
    openThreads: existing
      ? world.openThreads.map((thread) => thread === existing ? changed : thread)
      : [...world.openThreads, changed],
  }
}

function requireResident(world: WorldState, id: string): void {
  if (!world.residents.some((resident) => resident.id === id)) {
    throw new Error(`Mutation references missing resident ${id}.`)
  }
}

function assertUniqueResidents(world: WorldState): void {
  const ids = new Set<string>()
  for (const resident of world.residents) {
    if (ids.has(resident.id)) throw new Error(`Duplicate resident id ${resident.id}.`)
    ids.add(resident.id)
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function clone<T>(value: T): T {
  return structuredClone(value)
}

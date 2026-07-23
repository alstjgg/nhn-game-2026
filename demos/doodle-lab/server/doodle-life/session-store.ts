import type {
  DoodleReading,
  DoodleWorld,
  GeneratedGarden,
  QuestPublicView,
  QuestResolution,
  QuestResolutionView,
  ResolvedEncounter,
} from '../../src/doodle-life/contracts.ts'
import {
  DoodleLifeDomainError,
  lockQuest,
  questContractHash,
  type LockedQuest,
} from './quest-engine.ts'

interface StoredImageMetadata {
  readonly mimeType: 'image/png' | 'image/jpeg' | 'image/webp'
  readonly width: number
  readonly height: number
  readonly sha256: string
}

export interface DoodleLifeSession {
  readonly sessionId: string
  world: DoodleWorld
  readonly quests: ReadonlyMap<string, LockedQuest>
  readonly initialQuestHashes: ReadonlyMap<string, string>
  activeQuestId: string | null
  readonly resolvedQuestIds: Set<string>
  readCount: number
  lastImage: StoredImageMetadata | null
  reading: DoodleReading | null
  resolution: QuestResolution | null
  resolutionView: QuestResolutionView | null
  encounter: ResolvedEncounter | null
  touchedAt: number
  readonly idempotency: Map<string, unknown>
}

export interface SessionStoreOptions {
  readonly maxSessions?: number
  readonly ttlMs?: number
  readonly now?: () => number
}

const DEFAULT_MAX_SESSIONS = 40
const DEFAULT_TTL_MS = 45 * 60 * 1000

export class DoodleLifeSessionStore {
  readonly #sessions = new Map<string, DoodleLifeSession>()
  readonly #maxSessions: number
  readonly #ttlMs: number
  readonly #now: () => number

  constructor(options: SessionStoreOptions = {}) {
    this.#maxSessions = options.maxSessions ?? DEFAULT_MAX_SESSIONS
    this.#ttlMs = options.ttlMs ?? DEFAULT_TTL_MS
    this.#now = options.now ?? Date.now
  }

  has(sessionId: string): boolean {
    this.#evictExpired()
    return this.#sessions.has(sessionId)
  }

  create(sessionId: string, garden: GeneratedGarden): DoodleLifeSession {
    this.#evictExpired()
    const existing = this.#sessions.get(sessionId)
    if (existing) return this.#touch(existing)
    while (this.#sessions.size >= this.#maxSessions) this.#evictOldest()

    const quests = new Map(garden.quests.map((quest) => [quest.questId, lockQuest(quest)]))
    const hashes = new Map([...quests].map(([questId, locked]) => [questId, locked.hash]))
    const session: DoodleLifeSession = {
      sessionId,
      world: structuredClone(garden.world),
      quests,
      initialQuestHashes: hashes,
      activeQuestId: null,
      resolvedQuestIds: new Set(),
      readCount: 0,
      lastImage: null,
      reading: null,
      resolution: null,
      resolutionView: null,
      encounter: null,
      touchedAt: this.#now(),
      idempotency: new Map(),
    }
    this.#sessions.set(sessionId, session)
    return session
  }

  get(sessionId: string): DoodleLifeSession {
    this.#evictExpired()
    const session = this.#sessions.get(sessionId)
    if (!session) {
      throw new DoodleLifeDomainError('Doodle Life session was not found.', 'session_not_found', 404)
    }
    return this.#touch(session)
  }

  assertRevision(sessionId: string, expectedRevision: number): DoodleLifeSession {
    const session = this.get(sessionId)
    assertRevision(session.world, expectedRevision)
    return session
  }

  publicQuests(session: DoodleLifeSession): readonly QuestPublicView[] {
    return [...session.quests.values()].map(({ contract }) => ({
      questId: contract.questId,
      ownerNpcId: contract.ownerNpcId,
      title: contract.title,
      problemState: contract.problemState,
      primaryPurpose: contract.primaryPurpose,
      clues: structuredClone(contract.clues),
      status: session.resolvedQuestIds.has(contract.questId)
        ? 'resolved'
        : session.activeQuestId === contract.questId
          ? 'active'
          : 'available',
    }))
  }

  selectQuest(
    sessionId: string,
    questId: string,
    expectedRevision: number,
  ): { readonly session: DoodleLifeSession; readonly quest: QuestPublicView } {
    const session = this.assertRevision(sessionId, expectedRevision)
    const locked = session.quests.get(questId)
    if (!locked) throw new DoodleLifeDomainError('Quest was not found in this garden.', 'quest_not_found', 404)

    session.activeQuestId = questId
    session.readCount = 0
    session.lastImage = null
    session.reading = null
    session.resolution = null
    session.resolutionView = null
    session.encounter = null
    const quest = this.publicQuests(session).find((candidate) => candidate.questId === questId)
    if (!quest) throw new DoodleLifeDomainError('Quest public view could not be created.')
    return { session, quest }
  }

  activeQuest(sessionId: string): { readonly session: DoodleLifeSession; readonly locked: LockedQuest } {
    const session = this.get(sessionId)
    if (!session.activeQuestId) {
      throw new DoodleLifeDomainError('Choose a resident request before drawing.', 'quest_not_selected', 409)
    }
    const locked = session.quests.get(session.activeQuestId)
    if (!locked) throw new DoodleLifeDomainError('The active quest is missing.', 'quest_not_found', 404)
    this.#assertQuestLock(session, locked)
    return { session, locked }
  }

  assertCanRead(
    sessionId: string,
    readIndex: 0 | 1,
    image: StoredImageMetadata,
  ): DoodleLifeSession {
    const { session } = this.activeQuest(sessionId)
    if (session.resolution) {
      throw new DoodleLifeDomainError('This attempt has already been resolved.', 'attempt_already_resolved', 409)
    }
    if (session.readCount >= 2 || readIndex !== session.readCount) {
      throw new DoodleLifeDomainError(
        'Only the first reading and one redraw reading are allowed.',
        'reread_limit_reached',
        409,
      )
    }
    if (readIndex === 1 && session.lastImage?.sha256 === image.sha256) {
      throw new DoodleLifeDomainError(
        'Add to the drawing before using the one allowed reread.',
        'reread_image_unchanged',
        409,
      )
    }
    return session
  }

  saveReading(
    sessionId: string,
    reading: DoodleReading,
    image: StoredImageMetadata,
  ): DoodleLifeSession {
    const session = this.get(sessionId)
    session.reading = structuredClone(reading)
    session.lastImage = { ...image }
    session.readCount += 1
    return session
  }

  saveResolution(
    sessionId: string,
    expectedRevision: number,
    world: DoodleWorld,
    resolution: QuestResolution,
    view: QuestResolutionView,
  ): DoodleLifeSession {
    const { session, locked } = this.activeQuest(sessionId)
    assertRevision(session.world, expectedRevision)
    this.#assertQuestLock(session, locked)
    if (session.resolution) {
      throw new DoodleLifeDomainError('This attempt has already been resolved.', 'attempt_already_resolved', 409)
    }
    if (world.revision !== expectedRevision + 1) {
      throw new DoodleLifeDomainError('Resolution revision is invalid.', 'revision_conflict', 409)
    }
    session.world = structuredClone(world)
    session.resolution = structuredClone(resolution)
    session.resolutionView = structuredClone(view)
    if (resolution.questResolved) session.resolvedQuestIds.add(resolution.questId)
    return session
  }

  saveEncounter(sessionId: string, encounter: ResolvedEncounter): DoodleLifeSession {
    const session = this.get(sessionId)
    if (!session.resolution) {
      throw new DoodleLifeDomainError('Resolve the quest before asking for reactions.', 'resolution_required', 409)
    }
    session.encounter = structuredClone(encounter)
    return session
  }

  cached<T>(session: DoodleLifeSession, requestId: string): T | undefined {
    return session.idempotency.get(requestId) as T | undefined
  }

  cache<T>(session: DoodleLifeSession, requestId: string, value: T): T {
    session.idempotency.set(requestId, structuredClone(value))
    if (session.idempotency.size > 48) {
      const firstKey = session.idempotency.keys().next().value as string | undefined
      if (firstKey) session.idempotency.delete(firstKey)
    }
    return value
  }

  #assertQuestLock(session: DoodleLifeSession, locked: LockedQuest): void {
    const initial = session.initialQuestHashes.get(locked.contract.questId)
    const current = questContractHash(locked.contract)
    if (!initial || initial !== locked.hash || current !== locked.hash) {
      throw new DoodleLifeDomainError('The locked quest contract changed.', 'quest_lock_integrity_error', 409)
    }
  }

  #touch(session: DoodleLifeSession): DoodleLifeSession {
    session.touchedAt = this.#now()
    return session
  }

  #evictExpired(): void {
    const threshold = this.#now() - this.#ttlMs
    for (const [sessionId, session] of this.#sessions) {
      if (session.touchedAt < threshold) this.#sessions.delete(sessionId)
    }
  }

  #evictOldest(): void {
    let oldest: DoodleLifeSession | null = null
    for (const session of this.#sessions.values()) {
      if (!oldest || session.touchedAt < oldest.touchedAt) oldest = session
    }
    if (oldest) this.#sessions.delete(oldest.sessionId)
  }
}

function assertRevision(world: DoodleWorld, expectedRevision: number): void {
  if (world.revision !== expectedRevision) {
    throw new DoodleLifeDomainError(
      `Expected world revision ${expectedRevision}, received ${world.revision}.`,
      'revision_conflict',
      409,
    )
  }
}

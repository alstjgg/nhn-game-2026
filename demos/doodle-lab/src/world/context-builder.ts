import type { CharacterBible, WorldSignal, WorldState } from '../ai/contracts.ts'

export interface ContextBudget {
  readonly maxMemoriesPerResident?: number
  readonly maxRecentScenes?: number
  readonly maxThreads?: number
}

/** Public prompt context excludes private interpretations by construction. */
export function buildPublicWorldContext(world: WorldState, budget: ContextBudget = {}): unknown {
  const maxRecentScenes = budget.maxRecentScenes ?? 6
  const maxThreads = budget.maxThreads ?? 10
  return {
    id: world.id,
    revision: world.revision,
    title: world.title,
    premise: world.premise,
    locationDescription: world.locationDescription,
    atmosphere: world.atmosphere,
    clock: world.clock,
    residents: world.residents.map(toPublicResident),
    relationships: world.relationships,
    sharedMemories: world.memories.filter((memory) => memory.visibility === 'shared').slice(-24),
    openThreads: world.openThreads.filter((thread) => thread.status === 'open').slice(-maxThreads),
    recentScenes: world.recentScenes.slice(-maxRecentScenes),
  }
}

export function buildPrivateMindContext(
  world: WorldState,
  residentId: string,
  signal: WorldSignal,
  budget: ContextBudget = {},
): unknown {
  const resident = world.residents.find((candidate) => candidate.id === residentId)
  if (!resident) throw new Error(`Cannot build mind context for missing resident ${residentId}.`)
  const maxMemories = budget.maxMemoriesPerResident ?? 8
  return {
    world: buildPublicWorldContext(world, budget),
    signal,
    self: toPromptResident(resident),
    privateMemories: world.memories
      .filter((memory) => memory.ownerId === residentId)
      .slice(-maxMemories),
  }
}

function toPublicResident(resident: CharacterBible): unknown {
  return toPromptResident(resident)
}

function toPromptResident(resident: CharacterBible): unknown {
  return {
    id: resident.id,
    kind: resident.kind,
    name: resident.name,
    epithet: resident.epithet,
    essence: resident.essence,
    traits: resident.traits,
    drives: resident.drives,
    needs: resident.needs,
    boundaries: resident.boundaries,
    abilities: resident.abilities,
    visibleSignals: resident.visibleSignals,
    voice: resident.voice,
    motion: resident.motion,
    mood: resident.mood,
    currentGoal: resident.currentGoal,
    homePosition: resident.homePosition,
    // Prompts need the readable visual identity, not the render-time SVG/path
    // payload. Omitting raw geometry avoids repeating it in every model call.
    design: {
      silhouette: resident.design.silhouette,
      palette: resident.design.palette,
    },
  }
}

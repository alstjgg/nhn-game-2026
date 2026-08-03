// Determinism hooks — PRD §5 u2: a seeded clock plus frozen animations must pin
// a frame, so two runs that reached the same sim minute by different real-time
// paths serialise byte for byte the same.
//
// The freeze is a real gate, not a flag a caller may ignore: every animated
// surface registers its tick here and the driver pumps them through
// `tickAnimations`, which does nothing while frozen.

/** An animated surface's per-pump callback; `realMs` is the elapsed real time. */
export type AnimationTick = (realMs: number) => void

let frozen = false
const animations = new Map<string, AnimationTick>()

export function freezeAnimations(): void {
  frozen = true
}

export function thawAnimations(): void {
  frozen = false
}

export function animationsFrozen(): boolean {
  return frozen
}

/** Registers an animated surface; the returned function unregisters it. */
export function registerAnimation(name: string, tick: AnimationTick): () => void {
  animations.set(name, tick)
  return () => {
    if (animations.get(name) === tick) animations.delete(name)
  }
}

/** The driver's pump. A no-op while frozen — that is what the freeze *is*. */
export function tickAnimations(realMs: number): void {
  if (frozen) return
  for (const tick of [...animations.values()]) tick(realMs)
}

/** Key-sorted deep copy, so serialisation cannot depend on insertion order. */
function stable(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(stable)
  if (node === null || typeof node !== 'object') return node
  const out: Record<string, unknown> = {}
  for (const key of Object.keys(node).sort()) {
    out[key] = stable((node as Record<string, unknown>)[key])
  }
  return out
}

/**
 * Deterministic serialisation of a driver frame: same state in, same bytes out,
 * whatever order the state was assembled in.
 */
export function serializeFrame(frame: unknown): string {
  return JSON.stringify(stable(frame))
}

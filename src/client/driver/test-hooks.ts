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

/* ── the SIM-CLOCK half (C16 — u2's charter, completed at u11) ───────────── */
//
// u2 promised "clock pause/seed + animation-freeze hooks"; only the freeze
// shipped. This is the other half: seed the sim clock, advance it by the ported
// pacing, read it back. Same seed + same advance ⇒ same frame.
//
// The driver is taken STRUCTURALLY, never imported: `fixture-driver.ts` imports
// this module for `tickAnimations`, so naming its type here would close a cycle.
// It also keeps the hook honest — it may only use what any driver behind the
// §5.2 seam already exposes, and it reaches for no engine or composer.

/** The slice of a driver the clock hook drives. */
export interface ClockDriver {
  readonly clock: {
    readonly ended: boolean
    at(): string
    seed(at: string | number): void
  }
  advance(realMs: number): void
  drain(): void
}

/**
 * The DEV/TEST sim-clock surface. The shell hangs it off its own `__shell` dev
 * handle; this module knows nothing of any browser global (inv 12).
 */
export interface ClockHook {
  /** Pins the sim clock to an `"HH:MM"` stamp (or a minute), remainder dropped. */
  seed(at: string | number): void
  /** Feeds real elapsed milliseconds in, at the ported pacing. */
  advance(realMs: number): void
  /** The current `"HH:MM"` stamp. */
  at(): string
}

const hooks = new WeakMap<ClockDriver, ClockHook>()

/**
 * Installs (once) and answers the sim-clock hook for `driver`.
 *
 * `advance` releases the tail of the stream when the clock has reached its
 * terminal minute: a seeded-to-the-end clock is no longer *running*, so the
 * driver's own pump stops short of the flush the run's close owes. That is what
 * makes seeding to 21:04 the TALLY capture key (C16).
 */
export function installClockHook(driver: ClockDriver): ClockHook {
  const existing = hooks.get(driver)
  if (existing) return existing
  const hook: ClockHook = {
    seed(at: string | number) {
      driver.clock.seed(at)
    },
    advance(realMs: number) {
      driver.advance(realMs)
      if (driver.clock.ended) driver.drain()
    },
    at() {
      return driver.clock.at()
    },
  }
  hooks.set(driver, hook)
  return hook
}

/** The hook already installed on `driver`, or null. */
export function clockHookOf(driver: ClockDriver): ClockHook | null {
  return hooks.get(driver) ?? null
}

// The Web Audio half — buses, buffers, and the two things the desk asks for:
// play a one-shot, and hold a loop.
//
// Three rules this module exists to keep:
//
//  1. **Nothing happens before a gesture.** Browsers suspend an AudioContext
//     created outside a user gesture, and a page that fights that ends up with a
//     console warning and no sound. So the context is built on the first
//     pointer/key event and not one millisecond earlier — which also means the
//     whole pack costs the page nothing until the player has decided to play.
//  2. **Ambience is lazy.** The SFX set is ~130 kB and loads on unlock; the two
//     beds are ~490 kB and load after, so a slow connection gets a desk that
//     clicks and types before it gets one that hums (plan-audio §6).
//  3. **A missing file is not an error the player sees.** Any cue that fails to
//     load is dropped from the set and the rest still play. Audio is redundant
//     reinforcement (plan-audio §2), so degrading it silently is correct.
import type { AudioMap, BusName } from './map.ts'

/** Loops crossfade rather than cut; a hard stop on a drone reads as a bug. */
const FADE_S = 0.6

export interface AudioMixer {
  /** Plays a cue by id. No-op before unlock, or if the cue failed to load. */
  play(cueId: string): void
  /** Holds `cueId` on `slot`, or releases the slot when null. Idempotent. */
  hold(slot: string, cueId: string | null): void
  setMuted(muted: boolean): void
  muted(): boolean
  /** Resolves once the SFX set is decoded — tests await this, play() does not. */
  readonly ready: Promise<void>
  dispose(): void
}

interface Held {
  cue: string
  source: AudioBufferSourceNode
  gain: GainNode
}

export interface MixerDeps {
  map: AudioMap
  /** Absolute base the asset paths resolve against — `document.baseURI`. */
  baseUrl: string
  fetch: typeof fetch
  muted: boolean
}

export function createMixer(deps: MixerDeps): AudioMixer {
  const { map } = deps
  const ctx = new AudioContext()
  const master = ctx.createGain()
  master.gain.value = deps.muted ? 0 : 1
  master.connect(ctx.destination)

  const buses: Record<BusName, GainNode> = { sfx: ctx.createGain(), ambience: ctx.createGain() }
  for (const [name, node] of Object.entries(buses) as [BusName, GainNode][]) {
    node.gain.value = map.buses[name]
    node.connect(master)
  }

  const buffers = new Map<string, AudioBuffer>()
  const lastPlayed = new Map<string, number>()
  const lastVariant = new Map<string, number>()
  const held = new Map<string, Held>()
  let isMuted = deps.muted
  let disposed = false

  async function load(file: string): Promise<void> {
    const url = new URL(`${map.base}${file}${map.ext}`, deps.baseUrl).href
    try {
      const res = await deps.fetch(url)
      if (!res.ok) throw new Error(`${res.status}`)
      buffers.set(file, await ctx.decodeAudioData(await res.arrayBuffer()))
    } catch (cause) {
      // Warn, once, and carry on without it — see rule 3 above.
      console.warn(`audio: ${file} unavailable`, cause)
    }
  }

  const isBed = (c: { loop?: boolean; bus: BusName }): boolean =>
    c.loop === true && c.bus === 'ambience'
  const filesIn = (ids: Iterable<string>): string[] =>
    [...ids].flatMap((id) => (map.cues[id] ? [...map.cues[id].files] : []))

  // Three waves, and the order is the whole point. The first is whatever the
  // player can reach before the desk exists — O1's door has a control, and a
  // button that answers a second after it is pressed reads as broken, not as
  // late. `ready` resolves on that wave alone (~100 ms), the rest of the SFX
  // follow, and the two beds come last because they are 3× the bytes of
  // everything else put together.
  const first = new Set(map.preload)
  const rest = Object.entries(map.cues)
    .filter(([id, c]) => !first.has(id) && !isBed(c))
    .flatMap(([, c]) => [...c.files])
  const beds = Object.entries(map.cues)
    .filter(([, c]) => isBed(c))
    .flatMap(([, c]) => [...c.files])

  const ready = (async () => {
    await Promise.all(filesIn(first).map(load))
  })()
  // Neither later wave is awaited by `ready`: a bed that arrives late fades in
  // late, and nothing upstream should block on it.
  void ready
    .then(() => Promise.all(rest.map(load)))
    .then(() => Promise.all(beds.map(load)))
    .then(() => {
    // A slot asked for before its bed finished decoding is honoured now.
    for (const [slot, entry] of [...held]) if (!buffers.has(entry.cue)) reHold(slot, entry.cue)
  })

  /** Picks a variation that is not the one played last — never twice running. */
  function pick(cueId: string, files: readonly string[]): string | null {
    const usable = files.filter((f) => buffers.has(f))
    if (usable.length === 0) return null
    if (usable.length === 1) return usable[0] as string
    const previous = lastVariant.get(cueId) ?? -1
    let index = Math.floor(Math.random() * usable.length)
    if (index === previous) index = (index + 1) % usable.length
    lastVariant.set(cueId, index)
    return usable[index] as string
  }

  function play(cueId: string): void {
    if (disposed) return
    const cue = map.cues[cueId]
    if (cue === undefined || cue.loop === true) return
    const now = ctx.currentTime * 1000
    if (cue.cooldownMs !== undefined) {
      const last = lastPlayed.get(cueId)
      if (last !== undefined && now - last < cue.cooldownMs) return
    }
    const file = pick(cueId, cue.files)
    if (file === null) return
    lastPlayed.set(cueId, now)

    const source = ctx.createBufferSource()
    source.buffer = buffers.get(file) as AudioBuffer
    const gain = ctx.createGain()
    gain.gain.value = cue.gain
    source.connect(gain).connect(buses[cue.bus])
    source.start()
    source.onended = () => {
      source.disconnect()
      gain.disconnect()
    }
  }

  function release(slot: string): void {
    const entry = held.get(slot)
    if (entry === undefined) return
    held.delete(slot)
    const at = ctx.currentTime
    entry.gain.gain.cancelScheduledValues(at)
    entry.gain.gain.setValueAtTime(entry.gain.gain.value, at)
    entry.gain.gain.linearRampToValueAtTime(0, at + FADE_S)
    entry.source.stop(at + FADE_S + 0.05)
    entry.source.onended = () => {
      entry.source.disconnect()
      entry.gain.disconnect()
    }
  }

  function reHold(slot: string, cueId: string): void {
    const cue = map.cues[cueId]
    if (cue === undefined) return
    const file = cue.files.find((f) => buffers.has(f))
    if (file === undefined) {
      // Not loaded yet. Remember the intent so the ambience pass can honour it.
      held.set(slot, { cue: cueId, source: ctx.createBufferSource(), gain: ctx.createGain() })
      return
    }
    const source = ctx.createBufferSource()
    source.buffer = buffers.get(file) as AudioBuffer
    source.loop = true
    const gain = ctx.createGain()
    const at = ctx.currentTime
    gain.gain.setValueAtTime(0, at)
    gain.gain.linearRampToValueAtTime(cue.gain, at + FADE_S)
    source.connect(gain).connect(buses[cue.bus])
    source.start()
    held.set(slot, { cue: cueId, source, gain })
  }

  function hold(slot: string, cueId: string | null): void {
    if (disposed) return
    const current = held.get(slot)
    if (current?.cue === cueId) return
    if (current !== undefined) release(slot)
    if (cueId !== null) reHold(slot, cueId)
  }

  return {
    ready,
    play,
    hold,
    muted: () => isMuted,
    setMuted(next) {
      isMuted = next
      const at = ctx.currentTime
      master.gain.cancelScheduledValues(at)
      master.gain.setValueAtTime(master.gain.value, at)
      master.gain.linearRampToValueAtTime(next ? 0 : 1, at + 0.12)
      // Suspending while muted stops the loops burning cycles for nothing.
      if (next) void ctx.suspend()
      else void ctx.resume()
    },
    dispose() {
      disposed = true
      for (const slot of [...held.keys()]) release(slot)
      void ctx.close()
    },
  }
}

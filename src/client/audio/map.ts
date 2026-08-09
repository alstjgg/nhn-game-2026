// `data/policy/audio-map.json` — its type, and the check that the file on disk
// is actually that type.
//
// The map is balance data (CLAUDE.md: tunables live in `data/`, never inline in
// logic), which means this module owns no cue, no level and no cooldown. What it
// owns is the *vocabulary*: `TRIGGERS` is the closed set of moments the desk can
// sound, and `validateAudioMap` refuses a map that binds a trigger outside it or
// points a binding at a cue that does not exist. A map that fails validation
// leaves the desk silent rather than half-wired — audio carries no information
// on its own (plan-audio §2), so silence is a legal outcome and a wrong wiring
// is not.
import type { FeedKind } from '../driver/index.ts'

/** Every moment the desk can sound. Adding one here is adding a game surface. */
export const TRIGGERS = [
  // the membrane's five ops, read off `[data-op]`
  'op:mine', 'op:slot', 'op:unslot', 'op:deploy', 'op:new_run',
  // the feed, by `FeedLine.kind`
  'feed:event', 'feed:radio', 'feed:radio-end', 'feed:npc', 'feed:symptom',
  'feed:mark', 'feed:fallback', 'feed:wait',
  // waiting, by what is being waited for
  'wait:open', 'wait:judgment', 'wait:narration', 'wait:report',
  // the rest of the §5.2 stream. `run:open` is the `meta` event — one per run,
  // which is what makes it the right home for a cue that must not repeat.
  'run:open', 'event:report', 'event:run_end', 'tally:final',
  'event:fallback:1', 'event:fallback:2', 'event:fallback:3',
  'score:up', 'score:down',
  // desk furniture
  'ui:click', 'ui:hover', 'door:login', 'ui:window-open', 'ui:window-close', 'ui:drag', 'ui:drop',
  'boot',
  // fired by the last-day latch in index.ts; bound null while
  // shell/radio-sfx.ts owns the 21:04 swell (coexistence decision)
  'ending:collapse',
] as const

export type Trigger = (typeof TRIGGERS)[number]

/** `FeedKind` → its trigger. Exhaustive by construction: a new kind is a type error. */
export const FEED_TRIGGER: Record<FeedKind, Trigger> = {
  event: 'feed:event',
  radio: 'feed:radio',
  npc: 'feed:npc',
  symptom: 'feed:symptom',
  wait: 'feed:wait',
  fallback: 'feed:fallback',
  mark: 'feed:mark',
}

export type BusName = 'sfx' | 'ambience'

export interface CueDef {
  /** Asset basenames under `base`; more than one is a variation set. */
  files: readonly string[]
  bus: BusName
  gain: number
  /** A retrigger inside this window is dropped. Absent means no limit. */
  cooldownMs?: number
  loop?: boolean
}

export interface AudioMap {
  version: number
  base: string
  ext: string
  buses: Record<BusName, number>
  cues: Record<string, CueDef>
  bindings: Record<string, string | null>
  /**
   * Cue ids fetched and decoded FIRST, before the rest of the pack.
   *
   * `ready` resolves on these alone, which is what lets the door's LOGIN press
   * answer in ~100 ms instead of the ~1.1 s the whole set costs. Keep it to the
   * cues reachable before the desk exists.
   */
  preload: readonly string[]
  ambience: {
    desk: string | null
    watch: string | null
    /** How long any bed may play, from unlock. `null` = for the whole session. */
    playForMs: number | null
    /**
     * The desk bed ignores `playForMs` and holds for the session.
     *
     * The Watch drone still retires on that timer, and `beat_start` is still
     * gated on it at both ends — the two beds want opposite things. A drone
     * under a screen the player reads for minutes is pressure that never lets
     * up; a room the player sits in is the opposite, and it stops being a room
     * the moment it switches off (plan-audio §4.4).
     */
    deskHolds: boolean
    /**
     * One-shots sown under the desk bed at a random interval in
     * `[minMs, maxMs]`, one at a time, never the same cue twice running.
     *
     * This is the office beyond the desk. It is deliberately NOT a trigger:
     * `TRIGGERS` is the closed set of moments the *game* can sound, and nothing
     * in the game happens when somebody across the room answers a phone.
     */
    sparse: { cues: readonly string[]; minMs: number; maxMs: number } | null
  }
  typing: { everyChars: number; cue: string }
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

/**
 * Narrows a parsed JSON blob to `AudioMap`, or explains why it is not one.
 *
 * Keys beginning `$` are prose — the map documents itself in place, the way the
 * datapack schemas do — and are skipped everywhere below.
 */
export function validateAudioMap(raw: unknown): { map: AudioMap } | { error: string } {
  if (!isRecord(raw)) return { error: 'not an object' }
  for (const key of ['base', 'ext'] as const) {
    if (typeof raw[key] !== 'string') return { error: `${key} is not a string` }
  }
  if (!isRecord(raw.cues)) return { error: 'cues is not an object' }
  if (!isRecord(raw.bindings)) return { error: 'bindings is not an object' }
  if (!isRecord(raw.buses)) return { error: 'buses is not an object' }

  const cues = new Map<string, CueDef>()
  for (const [id, def] of Object.entries(raw.cues)) {
    if (id.startsWith('$')) continue
    if (!isRecord(def)) return { error: `cue ${id} is not an object` }
    const files = def.files
    if (!Array.isArray(files) || files.length === 0 || !files.every((f) => typeof f === 'string')) {
      return { error: `cue ${id} has no files` }
    }
    if (def.bus !== 'sfx' && def.bus !== 'ambience') return { error: `cue ${id} has no valid bus` }
    if (typeof def.gain !== 'number') return { error: `cue ${id} has no gain` }
    cues.set(id, {
      files: files as string[],
      bus: def.bus,
      gain: def.gain,
      cooldownMs: typeof def.cooldownMs === 'number' ? def.cooldownMs : undefined,
      loop: def.loop === true,
    })
  }

  const known = new Set<string>(TRIGGERS)
  const bindings: Record<string, string | null> = {}
  for (const [trigger, cue] of Object.entries(raw.bindings)) {
    if (trigger.startsWith('$')) continue
    if (!known.has(trigger)) return { error: `unknown trigger "${trigger}"` }
    if (cue === null) { bindings[trigger] = null; continue }
    if (typeof cue !== 'string') return { error: `binding ${trigger} is not a cue id` }
    if (!cues.has(cue)) return { error: `binding ${trigger} names missing cue "${cue}"` }
    bindings[trigger] = cue
  }

  const amb = isRecord(raw.ambience) ? raw.ambience : {}
  const bed = typeof amb.desk === 'string' ? amb.desk : null
  const watch = typeof amb.watch === 'string' ? amb.watch : null
  for (const id of [bed, watch]) {
    if (id !== null && !cues.has(id)) return { error: `ambience names missing cue "${id}"` }
  }

  let sparse: AudioMap['ambience']['sparse'] = null
  if (isRecord(amb.sparse)) {
    const list = amb.sparse.cues
    if (!Array.isArray(list) || !list.every((id) => typeof id === 'string')) {
      return { error: 'ambience.sparse.cues is not a list of cue ids' }
    }
    for (const id of list) {
      if (!cues.has(id as string)) return { error: `ambience.sparse names missing cue "${id}"` }
    }
    const { minMs, maxMs } = amb.sparse
    if (typeof minMs !== 'number' || typeof maxMs !== 'number' || minMs <= 0 || maxMs < minMs) {
      return { error: 'ambience.sparse needs 0 < minMs <= maxMs' }
    }
    sparse = { cues: list as string[], minMs, maxMs }
  }

  const preload: string[] = []
  if (Array.isArray(raw.preload)) {
    for (const id of raw.preload) {
      if (typeof id !== 'string') return { error: 'preload holds a non-string' }
      if (!cues.has(id)) return { error: `preload names missing cue "${id}"` }
      preload.push(id)
    }
  }

  const typing = isRecord(raw.typing) ? raw.typing : {}
  const typingCue = typeof typing.cue === 'string' ? typing.cue : null
  if (typingCue === null || !cues.has(typingCue)) return { error: 'typing.cue is missing' }

  return {
    map: {
      version: typeof raw.version === 'number' ? raw.version : 0,
      base: raw.base as string,
      ext: raw.ext as string,
      buses: {
        sfx: typeof raw.buses.sfx === 'number' ? raw.buses.sfx : 1,
        ambience: typeof raw.buses.ambience === 'number' ? raw.buses.ambience : 1,
      },
      cues: Object.fromEntries(cues),
      preload,
      bindings,
      ambience: {
        desk: bed,
        watch,
        playForMs: typeof amb.playForMs === 'number' ? amb.playForMs : null,
        deskHolds: amb.deskHolds === true,
        sparse,
      },
      typing: {
        everyChars: typeof typing.everyChars === 'number' ? Math.max(1, typing.everyChars) : 1,
        cue: typingCue,
      },
    },
  }
}

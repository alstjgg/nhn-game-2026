// [08-09] the office beyond the desk — `ambience.deskHolds` and `ambience.sparse`.
//
// This suite exists because of the 08-08 lesson recorded in `docs/status.md`:
// two regressions shipped green through a 215-test browser suite, and the reason
// was structural — `e2e/` drives the DEV fixture loop, so anything whose whole
// behaviour lives on the live path is untested there by construction. The
// office is exactly that shape. It is armed once, at `openTheRoom`, from data
// that only the live boot reads, and it then does nothing at all until its
// first interval elapses. A browser suite would watch it do nothing and pass.
//
// So what is proved here is the seam, not the sound:
//
//  1. **The shipped map parses.** `validateAudioMap` failing is not a loud
//     failure — `index.ts` catches it, warns, and leaves the desk SILENT
//     (plan-audio §2 rule 3 makes that a legal outcome). A typo in
//     `audio-map.json` therefore deletes the entire audio layer without
//     breaking a single test or a single pixel. This is the guard for that.
//  2. **The new fields survive the round trip** with the values §4.4 documents,
//     because they are the whole feature and they are pure data.
//  3. **The validator still refuses what it should.** A sparse block naming a
//     cue that does not exist is the exact edit a future reader makes when they
//     add a sixth office sound, and it must fail loudly at the boundary rather
//     than quietly at 3 a.m. in a judge's browser.
//
// [08-10, x10] two more claims, both of them 민서's and both live on the same
// seam: the room now opens AT THE DOOR rather than at the desk, and the ambience
// bus is quieter. The first cannot be proved here by behaviour — `installAudio`
// needs a document, a MutationObserver and an AudioContext, and this suite is
// node-env by policy — so it is proved as SHAPE, in the idiom
// `tests/shell/shell-source.test.ts` already uses for boot-order claims: the
// call site is read off disk with comments stripped. That is weaker than a
// browser assertion and stronger than nothing, and it is aimed at the exact edit
// that would undo the decision (putting `openTheRoom` back behind `deskReady`).
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { validateAudioMap } from '../../src/client/audio/map.ts'
import { stripComments } from './shell-utils.ts'

const REPO = path.resolve(import.meta.dirname, '../..')
const MAP_PATH = path.join(REPO, 'data/policy/audio-map.json')
const AUDIO_DIR = path.join(REPO, 'public/assets/audio')
const AUDIO_INDEX = path.join(REPO, 'src/client/audio/index.ts')
const BOOT = path.join(REPO, 'src/client/shell/boot.ts')
const PLAN = path.join(REPO, 'docs/plan-audio.md')

/**
 * A source with its comments removed.
 *
 * Load-bearing for every guard below: `audio/index.ts` records the ruling this
 * suite measures in prose right next to the code that implements it, so a guard
 * reading the raw text would match its own explanation and pass whatever the
 * code did.
 */
const code = (file: string): string => stripComments(fs.readFileSync(file, 'utf8'))

/**
 * The `{ … }` block that `opener` opens, brace-matched.
 *
 * Regex-level on purpose — same rule as `tests/shell/shell-utils.ts`: these are
 * lint suites over hand-written sources, not a compiler. `opener` must end on
 * the brace.
 */
function block(text: string, opener: string): string {
  const at = text.indexOf(opener)
  expect(at, `${opener} is gone — re-aim this guard at whatever replaced it`).toBeGreaterThan(-1)
  let depth = 0
  for (let i = at + opener.length - 1; i < text.length; i += 1) {
    if (text[i] === '{') depth += 1
    else if (text[i] === '}') {
      depth -= 1
      if (depth === 0) return text.slice(at, i + 1)
    }
  }
  throw new Error(`unbalanced braces after ${opener}`)
}

const UNLOCK = 'const unlock = async (): Promise<void> => {'
const ROOM = 'const openTheRoom = (): void => {'
const WATCH = 'const openTheWatchWindow = (): void => {'

const raw = (): unknown => JSON.parse(fs.readFileSync(MAP_PATH, 'utf8'))
const parsed = () => {
  const checked = validateAudioMap(raw())
  if ('error' in checked) throw new Error(`the shipped map is invalid: ${checked.error}`)
  return checked.map
}

describe('the shipped audio map', () => {
  it('validates — a map that does not leaves the desk silent, not broken', () => {
    expect(validateAudioMap(raw())).not.toHaveProperty('error')
  })

  it('holds the desk bed for the session and retires only the Watch drone', () => {
    const { ambience } = parsed()
    expect(ambience.desk).toBe('bed')
    expect(ambience.deskHolds).toBe(true)
    // Still set, and still meaningful: it is the drone's window now, and the
    // latch that gates `beat_start` at both ends reads it. x10 renamed that latch
    // `bedsLive` → `watchLive` and left the window where it was — anchored to the
    // desk, while the room it used to share an anchor with moved to the door.
    expect(ambience.playForMs).toBe(10000)
  })

  it('sows the office every 5–10 s', () => {
    const { ambience } = parsed()
    expect(ambience.sparse).not.toBeNull()
    expect(ambience.sparse?.cues).toEqual(['office'])
    expect(ambience.sparse?.minMs).toBe(5000)
    expect(ambience.sparse?.maxMs).toBe(10000)
  })

  it('carries five office files on one cue, so pick() does the variation', () => {
    const office = parsed().cues['office']
    expect(office?.files).toHaveLength(5)
    expect(office?.bus).toBe('ambience')
    // Not a loop: a bed is `loop && bus === 'ambience'` in the mixer's load
    // waves, and a one-shot that lands in the bed wave would be fetched last.
    expect(office?.loop).toBeFalsy()
  })

  it('names files that were actually built', () => {
    const { cues, ext } = parsed()
    const missing = Object.values(cues)
      .flatMap((cue) => [...cue.files])
      .filter((file) => !fs.existsSync(path.join(AUDIO_DIR, `${file}${ext}`)))
    expect(missing).toEqual([])
  })
})

describe('validateAudioMap — the sparse block', () => {
  const withSparse = (sparse: unknown): unknown => {
    const map = raw() as Record<string, unknown>
    return { ...map, ambience: { ...(map.ambience as object), sparse } }
  }

  it('refuses a cue id that does not exist', () => {
    const checked = validateAudioMap(withSparse({ cues: ['no-such-cue'], minMs: 1, maxMs: 2 }))
    expect(checked).toHaveProperty('error')
  })

  it('refuses a window that runs backwards', () => {
    const checked = validateAudioMap(withSparse({ cues: ['office'], minMs: 20000, maxMs: 10000 }))
    expect(checked).toHaveProperty('error')
  })

  it('refuses an interval of zero — that is a busy loop, not ambience', () => {
    const checked = validateAudioMap(withSparse({ cues: ['office'], minMs: 0, maxMs: 20000 }))
    expect(checked).toHaveProperty('error')
  })

  it('refuses a block that is present but not an object — degrading it would delete the office silently', () => {
    expect(validateAudioMap(withSparse('office'))).toHaveProperty('error')
    expect(validateAudioMap(withSparse(5000))).toHaveProperty('error')
    expect(validateAudioMap(withSparse(['office']))).toHaveProperty('error')
  })

  it('treats an explicit null as "no office", the same as absence', () => {
    const checked = validateAudioMap(withSparse(null))
    expect(checked).not.toHaveProperty('error')
    if ('map' in checked) expect(checked.map.ambience.sparse).toBeNull()
  })

  it('treats an absent block as "no office", not as an error', () => {
    const map = raw() as Record<string, unknown>
    const ambience = { ...(map.ambience as Record<string, unknown>) }
    delete ambience.sparse
    const checked = validateAudioMap({ ...map, ambience })
    expect(checked).not.toHaveProperty('error')
    if ('map' in checked) expect(checked.map.ambience.sparse).toBeNull()
  })
})

/**
 * [x10 · 민서, 08-10] the room is already there when the operator signs in.
 *
 * The decision: the desk bed and the office around it start at the LOGIN SCREEN,
 * not after the manual sheet is dismissed. The constraint nobody can spend their
 * way out of: a browser suspends an AudioContext built outside a user gesture, so
 * the earliest possible sound is the first keystroke at the door — which is why
 * these guards are aimed at the UNLOCK and not at a timer or at first paint.
 */
describe('x10 — the room opens at the door', () => {
  it('(a) `openTheRoom` hangs off the unlock, with no promise between them', () => {
    const unlock = block(code(AUDIO_INDEX), UNLOCK)
    // `openTheRoom()` — the CALL. The declaration a few lines up reads
    // `const openTheRoom = (): void =>`, so it cannot match this.
    const calls = unlock.split('\n').filter((line) => /\bopenTheRoom\(\)/.test(line))
    expect(calls, 'the room is opened from somewhere else, or not at all').toHaveLength(1)
    // The whole claim in one assertion: the call is unconditional. A door path
    // and a no-door path differ in everything EXCEPT that they both unlock on a
    // gesture, so a call site with nothing on it is a call site both paths reach.
    expect(calls[0]).not.toMatch(/deskReady|then|if\s*\(/)
  })

  it('(b) and nothing outside the unlock can open it — no sound before a gesture', () => {
    const text = code(AUDIO_INDEX)
    const unlock = block(text, UNLOCK)
    const from = text.indexOf(unlock)
    const strays = [...text.matchAll(/openTheRoom/g)]
      .map((m) => m.index)
      .filter((at) => at < from || at > from + unlock.length)
    expect(strays, 'the room is opened outside the unlock — that cannot make a sound').toEqual([])
  })

  it('(c) what opens there is the ROOM — the bed and the office under it', () => {
    const room = block(code(AUDIO_INDEX), ROOM)
    expect(room, 'the bed left openTheRoom').toMatch(/hold\('bed',/)
    expect(room, 'the office left openTheRoom').toMatch(/startSparse\(/)
    // It must NOT arm the drone's latch: that is the half that still waits.
    expect(room).not.toMatch(/watchLive\s*=\s*true/)
  })

  it('(d) the Watch drone`s window is still the desk`s, and still has both ends', () => {
    const text = code(AUDIO_INDEX)
    const unlock = block(text, UNLOCK)
    expect(unlock).toMatch(/if \(deps\.deskReady === undefined\) openTheWatchWindow\(\)/)
    expect(unlock).toMatch(/deps\.deskReady\.then\(openTheWatchWindow\)/)

    const watch = block(text, WATCH)
    expect(watch, 'the drone`s latch no longer opens').toMatch(/watchLive\s*=\s*true/)
    expect(watch, 'the drone`s window no longer closes').toMatch(/watchLive\s*=\s*false/)
    expect(watch, 'the drone no longer retires').toMatch(/hold\('watch', null\)/)
    expect(watch, 'the window stopped reading the map').toMatch(/playForMs/)
    // Both ends, at the only place the drone can come up.
    expect(text, '`beat_start` stopped reading the latch').toMatch(/watchLive\) mixer\?\.hold\('watch'/)
  })

  it('(e) the desk promise resolves on the no-door path too', () => {
    // `?signin=skip` and `navigator.webdriver` leave `door` null, and the e2e
    // lane is on that path by construction. The room does not care — (a) proves
    // it opens on the unlock either way — but the DRONE does: a window that never
    // opens is a cue deleted by a URL parameter. So the resolver must sit outside
    // the door branch, which is where a future edit is most likely to move it.
    const boot = code(BOOT)
    const resolver = /(\w+)\s*=\s*\(\)\s*=>\s*resolve\(\)/.exec(boot)
    expect(resolver, 'the desk promise is gone — re-aim this guard').not.toBeNull()
    const name = resolver![1] as string
    const branch = block(boot, 'if (door !== null) {')
    expect(branch, `${name}() moved inside the door branch`).not.toMatch(
      new RegExp(`\\b${name}\\(\\)`),
    )
    expect(boot.match(new RegExp(`\\b${name}\\(\\)`, 'g')) ?? [], `${name}() is never called`)
      .toHaveLength(1)
  })
})

/**
 * [x10 · 민서, 08-10] "소리를 좀 조용하게" — the ambience bus, and only the bus.
 *
 * The cut is made in the data and nowhere else (balance-as-data). It is made on
 * the BUS and not on a cue because bed and office both ride it: the ~10 dB gap
 * between them is what plan-audio §4.4 calls the whole effect, and a bus move
 * leaves that gap exactly where it was. These pin the number and the invariant
 * that the number is safe to move — if a later reader compensates on a cue gain,
 * (b) is the assertion that should be argued with, not quietly re-fitted.
 */
describe('x10 — the ambience bus', () => {
  it('(a) sits at 0.1 — 3.5 dB under where 08-09 left it', () => {
    const { buses } = parsed()
    expect(buses.ambience).toBe(0.1)
    // The desk's own cues did not get quieter. Only the room did.
    expect(buses.sfx).toBe(0.5)
  })

  it('(b) carries every ambience cue, so the bed↔office balance is bus-invariant', () => {
    const { cues, ambience } = parsed()
    const room = [ambience.desk, ambience.watch, ...(ambience.sparse?.cues ?? [])]
    for (const id of room) {
      expect(id, 'an ambience slot is unbound — this guard has lost its subject').not.toBeNull()
      expect(cues[id as string]?.bus, `${id} left the ambience bus`).toBe('ambience')
    }
    // The three levels the bus move deliberately did NOT touch.
    expect(cues['bed']?.gain).toBe(1.0)
    expect(cues['office']?.gain).toBe(0.8)
    expect(cues['watch']?.gain).toBe(0.75)
  })

  it('(c) is the number docs/plan-audio.md publishes', () => {
    // §4's generated block is the doc's authority on levels and it cannot be
    // regenerated without ffprobe, so the one line that carries the buses is
    // pinned here instead: a bus edit that leaves the published figure behind
    // fails now rather than misinforming a reader of a competition deliverable.
    const { buses } = parsed()
    const doc = fs.readFileSync(PLAN, 'utf8')
    expect(doc).toContain(`Buses: \`sfx\` ${buses.sfx} · \`ambience\` ${buses.ambience}.`)
  })
})

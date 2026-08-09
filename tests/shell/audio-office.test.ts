// [08-09] the office beyond the desk — `ambience.deskHolds` and `ambience.sparse`.
//
// This suite exists because of the 08-08 lesson recorded in `docs/status.md`:
// two regressions shipped green through a 215-test browser suite, and the reason
// was structural — `e2e/` drives the DEV fixture loop, so anything whose whole
// behaviour lives on the live path is untested there by construction. The
// office is exactly that shape. It is armed once, at `openTheRoom`, from data
// that only the live boot reads, and it then does nothing at all for ten
// seconds. A browser suite would watch it do nothing and pass.
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
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { validateAudioMap } from '../../src/client/audio/map.ts'

const REPO = path.resolve(import.meta.dirname, '../..')
const MAP_PATH = path.join(REPO, 'data/policy/audio-map.json')
const AUDIO_DIR = path.join(REPO, 'public/assets/audio')

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
    // `bedsLive` latch that gates `beat_start` at both ends reads it.
    expect(ambience.playForMs).toBe(10000)
  })

  it('sows the office every 10–20 s', () => {
    const { ambience } = parsed()
    expect(ambience.sparse).not.toBeNull()
    expect(ambience.sparse?.cues).toEqual(['office'])
    expect(ambience.sparse?.minMs).toBe(10000)
    expect(ambience.sparse?.maxMs).toBe(20000)
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

  it('treats an absent block as "no office", not as an error', () => {
    const map = raw() as Record<string, unknown>
    const ambience = { ...(map.ambience as Record<string, unknown>) }
    delete ambience.sparse
    const checked = validateAudioMap({ ...map, ambience })
    expect(checked).not.toHaveProperty('error')
    if ('map' in checked) expect(checked.map.ambience.sparse).toBeNull()
  })
})

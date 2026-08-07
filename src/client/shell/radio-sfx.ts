/**
 * O3 — the desk's three radio cues, synthesised in place (WebAudio, no
 * assets). Procedural on purpose: no binary ships, so assets-manifest.json
 * (hard rule 5 covers external/AI-generated FILES) stays untouched and the
 * third-party guard has nothing to scan. The cues are radio texture, not
 * music: filtered noise shaped by short envelopes.
 *
 * Every entry point is defensive — no AudioContext, a suspended context that
 * will not resume, or a driven browser (`navigator.webdriver`, the same key
 * the door keys off) all mean silence, never a throw. Audio is garnish:
 * nothing in the game reads back from this module.
 */
import type { FixtureDriver } from '../driver/index.ts'

let ctx: AudioContext | null = null

/** Lazily create (and try to resume) the shared context. `null` ⇒ silence. */
function context(): AudioContext | null {
  if (typeof navigator !== 'undefined' && navigator.webdriver) return null
  try {
    if (ctx === null) {
      const Ctor = window.AudioContext
      if (Ctor === undefined) return null
      ctx = new Ctor()
    }
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx.state === 'running' ? ctx : null
  } catch {
    return null
  }
}

/** A noise burst through a bandpass — the radio's own texture. */
function staticBurst(at: AudioContext, ms: number, peak: number, hz: number): void {
  const seconds = ms / 1000
  const frames = Math.max(1, Math.floor(at.sampleRate * seconds))
  const buffer = at.createBuffer(1, frames, at.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < frames; i += 1) data[i] = Math.random() * 2 - 1
  const source = at.createBufferSource()
  source.buffer = buffer
  const band = at.createBiquadFilter()
  band.type = 'bandpass'
  band.frequency.value = hz
  band.Q.value = 0.9
  const gain = at.createGain()
  const t0 = at.currentTime
  gain.gain.setValueAtTime(0.0001, t0)
  gain.gain.exponentialRampToValueAtTime(peak, t0 + Math.min(0.08, seconds / 3))
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + seconds)
  source.connect(band)
  band.connect(gain)
  gain.connect(at.destination)
  source.start(t0)
  source.stop(t0 + seconds)
}

/** LOGIN — the auth readout rides on carrier static for its whole runway. */
export function sfxLoginStatic(runwayMs: number): void {
  const at = context()
  if (at === null) return
  staticBurst(at, runwayMs, 0.05, 1700)
}

/** The hand-over — one short squelch tick as the manual yields the desk. */
export function sfxHandOver(): void {
  const at = context()
  if (at === null) return
  staticBurst(at, 140, 0.06, 2300)
}

/** 21:04 — the static swells and CUTS. The silence after is the cue. */
function sfxDayEnd(): void {
  const at = context()
  if (at === null) return
  staticBurst(at, 1900, 0.07, 1500)
}

/**
 * Wire the day-end cue to the stream, and arm a one-time gesture unlock so a
 * `?signin=skip` session (no LOGIN press) still gets a running context.
 */
export function bindRadioSfx(driver: FixtureDriver): void {
  if (typeof navigator !== 'undefined' && navigator.webdriver) return
  const unlock = (): void => {
    context()
    window.removeEventListener('pointerdown', unlock)
    window.removeEventListener('keydown', unlock)
  }
  window.addEventListener('pointerdown', unlock)
  window.addEventListener('keydown', unlock)
  driver.subscribe((event) => {
    if (event.type === 'run_end') sfxDayEnd()
  })
}

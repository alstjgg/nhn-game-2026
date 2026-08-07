// The DSP half of the audio pack — every cue that is *generated* rather than
// recorded, plus the WAV writer both halves share.
//
// Why synthesis at all when the sourced half exists: the cues here are the ones
// a CC0 library is worst at. Room tone, a drone that opens as 21:04 approaches,
// a dissonant symptom chime pitched to sit *under* notice, a radio squelch
// clipped to 60 ms — these are specified by their function in the game
// (plan-audio §4), not by an object someone recorded, and every library
// candidate would have to be cut and re-pitched until nothing of the original
// remained. Generating them means the spec IS the source, the loops close
// seamlessly by construction, and the licence question does not arise.
//
// No dependencies, and no `Math.random()` seeding surprise: `rng()` below is a
// fixed-seed LCG, so re-running this file byte-reproduces the same WAVs. That
// matters because the outputs are committed — a nondeterministic generator
// would show every run as a diff.
//
// Consumed by `build-audio-pack.mjs`; nothing in the app imports it.
export const SR = 44100

/* ── deterministic noise ─────────────────────────────────────────────────── */

/** Numerical Recipes LCG. Seeded per-cue so one cue's edit cannot move another. */
function lcg(seed) {
  let s = seed >>> 0
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0
    return s / 4294967296
  }
}

/* ── filters ─────────────────────────────────────────────────────────────── */

/** RBJ biquad. `type` ∈ lowpass · highpass · bandpass · peak. */
function biquad(type, f0, q, gainDb = 0) {
  const w = (2 * Math.PI * f0) / SR
  const cw = Math.cos(w)
  const sw = Math.sin(w)
  const alpha = sw / (2 * q)
  const A = 10 ** (gainDb / 40)
  let b0, b1, b2, a0, a1, a2
  if (type === 'lowpass') {
    b0 = (1 - cw) / 2; b1 = 1 - cw; b2 = b0
    a0 = 1 + alpha; a1 = -2 * cw; a2 = 1 - alpha
  } else if (type === 'highpass') {
    b0 = (1 + cw) / 2; b1 = -(1 + cw); b2 = b0
    a0 = 1 + alpha; a1 = -2 * cw; a2 = 1 - alpha
  } else if (type === 'bandpass') {
    b0 = alpha; b1 = 0; b2 = -alpha
    a0 = 1 + alpha; a1 = -2 * cw; a2 = 1 - alpha
  } else {
    b0 = 1 + alpha * A; b1 = -2 * cw; b2 = 1 - alpha * A
    a0 = 1 + alpha / A; a1 = -2 * cw; a2 = 1 - alpha / A
  }
  const st = { x1: 0, x2: 0, y1: 0, y2: 0 }
  return (x) => {
    const y = (b0 / a0) * x + (b1 / a0) * st.x1 + (b2 / a0) * st.x2
            - (a1 / a0) * st.y1 - (a2 / a0) * st.y2
    st.x2 = st.x1; st.x1 = x; st.y2 = st.y1; st.y1 = y
    return y
  }
}

/** Runs a filter chain over a whole buffer, in place. */
function run(buf, ...filters) {
  for (const f of filters) for (let i = 0; i < buf.length; i++) buf[i] = f(buf[i])
  return buf
}

/* ── envelopes ───────────────────────────────────────────────────────────── */

/** Percussive: instant-ish attack, exponential tail. `curve` >1 = snappier. */
function hit(n, attackS, curve = 3) {
  const e = new Float32Array(n)
  const a = Math.max(1, Math.round(attackS * SR))
  for (let i = 0; i < n; i++) {
    e[i] = i < a ? i / a : (1 - (i - a) / (n - a)) ** curve
  }
  return e
}

/** Symmetric raised-cosine — used where a click would betray the synthesis. */
function bell(n, riseFrac = 0.5) {
  const e = new Float32Array(n)
  const r = Math.round(n * riseFrac)
  for (let i = 0; i < n; i++) {
    e[i] = i < r
      ? 0.5 - 0.5 * Math.cos((Math.PI * i) / r)
      : 0.5 + 0.5 * Math.cos((Math.PI * (i - r)) / (n - r))
  }
  return e
}

function mix(into, from, gain = 1, offsetS = 0) {
  const o = Math.round(offsetS * SR)
  for (let i = 0; i < from.length && o + i < into.length; i++) into[o + i] += from[i] * gain
  return into
}

/** Peak-normalise to `to`, so every cue leaves this file at a known level and
 *  the per-cue balance lives in `audio-map.json` where it can be tuned. */
function normalize(buf, to = 0.9) {
  let peak = 0
  for (const v of buf) peak = Math.max(peak, Math.abs(v))
  if (peak > 0) for (let i = 0; i < buf.length; i++) buf[i] = (buf[i] / peak) * to
  return buf
}

const secs = (s) => new Float32Array(Math.round(s * SR))

/* ── one-shots ───────────────────────────────────────────────────────────── */

/** A carrier-noise burst behind a relay click: the sound of a channel opening. */
function squelch(open) {
  const dur = open ? 0.13 : 0.09
  const n = secs(dur)
  const r = lcg(open ? 11 : 12)
  const env = hit(n.length, 0.001, open ? 2.2 : 1.4)
  for (let i = 0; i < n.length; i++) n[i] = (r() * 2 - 1) * env[i]
  // Two overlapping bands: the low one is the carrier body, the high one the
  // hiss that makes it read as RF rather than as a snare.
  const body = run(n.slice(), biquad('bandpass', 900, 0.9), biquad('lowpass', 4200, 0.7))
  const hiss = run(n.slice(), biquad('bandpass', 3600, 1.4))
  const out = secs(dur)
  mix(out, body, 1)
  mix(out, hiss, open ? 0.45 : 0.3)
  // The relay itself — a single sample-wide impulse, filtered into a tick.
  const click = secs(0.01)
  click[0] = 1
  mix(out, run(click, biquad('bandpass', 2400, 2)), 0.8)
  return normalize(out, 0.85)
}

/** One low thump plus its weaker second — the judgment call landing, not a loop. */
function heartbeat() {
  const out = secs(0.6)
  for (const [at, gain, f0] of [[0, 1, 52], [0.24, 0.45, 46]]) {
    const n = secs(0.28)
    const env = hit(n.length, 0.004, 2.6)
    let ph = 0
    for (let i = 0; i < n.length; i++) {
      // Pitch drops through the hit; that fall is what reads as "body".
      const f = f0 * (1 - 0.35 * (i / n.length))
      ph += (2 * Math.PI * f) / SR
      n[i] = Math.sin(ph) * env[i]
    }
    mix(out, run(n, biquad('lowpass', 220, 0.8)), gain, at)
  }
  return normalize(out, 0.95)
}

/** Two tones a hair apart, so they beat. Quiet by design (plan-audio §4.2 #16). */
function symptomChime() {
  const out = secs(0.75)
  const env = bell(out.length, 0.18)
  for (let i = 0; i < out.length; i++) {
    const t = i / SR
    out[i] = (Math.sin(2 * Math.PI * 1180 * t) + 0.85 * Math.sin(2 * Math.PI * 1249 * t)) * env[i]
  }
  run(out, biquad('bandpass', 1200, 1.1), biquad('highpass', 700, 0.7))
  return normalize(out, 0.5)
}

/** North-American dial-tone pair through a telephone band — the handset. */
function handsetTone() {
  const out = secs(0.22)
  const env = bell(out.length, 0.12)
  for (let i = 0; i < out.length; i++) {
    const t = i / SR
    out[i] = (Math.sin(2 * Math.PI * 440 * t) + Math.sin(2 * Math.PI * 480 * t)) * 0.5 * env[i]
  }
  // 300–3400 Hz is the actual telephone passband; the thinness IS the cue.
  run(out, biquad('highpass', 320, 0.8), biquad('lowpass', 3300, 0.8))
  return normalize(out, 0.8)
}

/** The round degraded: a short burst of broken carrier, deliberately ugly. */
function fallbackBurst() {
  const out = secs(0.24)
  const r = lcg(31)
  const env = hit(out.length, 0.002, 1.6)
  for (let i = 0; i < out.length; i++) {
    // Sample-and-hold at ~1.8 kHz: aliasing is the point, it reads as digital.
    const step = Math.floor(i / 24)
    const s = ((step * 2654435761) % 1000) / 1000
    out[i] = ((s * 2 - 1) * 0.6 + (r() * 2 - 1) * 0.4) * env[i]
  }
  run(out, biquad('bandpass', 1500, 0.7))
  return normalize(out, 0.75)
}

/**
 * 21:04. It swells, and then it CUTS — the silence after the cut is the cue.
 *
 * Not a crash and not a decay. Drawing the collapse as a sound puts the loudest
 * thing in the game on the moment the player has already lost; taking the sound
 * away instead leaves them in a room where the radio has stopped, which is what
 * actually happened. Nothing else in the pack ends without a tail, so the cut
 * reads as an event rather than as a file running out.
 *
 * Three layers, all rising together: the carrier the desk has been listening to
 * all day, a low mass under it, and a sub that falls in pitch as it grows. The
 * last 4 ms ramp to zero — long enough not to click, short enough to be a cut.
 * `audio-map.json`'s ending lead is what keeps the ledger from filling the
 * silence; the cue does not work without it.
 */
function collapse() {
  const dur = 2.0
  const out = secs(dur)
  const r = lcg(77)
  const n = out.length

  // The radio carrier, opening up. This is the layer O3 is right about.
  const carrier = secs(dur)
  for (let i = 0; i < n; i++) carrier[i] = r() * 2 - 1
  run(carrier, biquad('bandpass', 1500, 0.9))

  // The ground going. Broadband, low, and much heavier by the end.
  const mass = secs(dur)
  for (let i = 0; i < n; i++) mass[i] = r() * 2 - 1
  run(mass, biquad('lowpass', 140, 0.7), biquad('lowpass', 95, 0.9))

  // A sub that falls as it rises — the only pitched thing in the cue.
  const sub = secs(dur)
  let ph = 0
  for (let i = 0; i < n; i++) {
    ph += (2 * Math.PI * (58 - 26 * (i / n))) / SR
    sub[i] = Math.sin(ph)
  }

  for (let i = 0; i < n; i++) {
    // Accelerating swell: nothing for the first moment, then it takes the room.
    const swell = (i / n) ** 1.7
    out[i] = carrier[i] * 0.55 * swell + mass[i] * swell + sub[i] * 0.5 * swell
  }

  const cut = Math.round(0.004 * SR)
  for (let i = 0; i < cut; i++) out[n - cut + i] *= 1 - i / cut

  return normalize(out, 0.95)
}

/** Under the relay click of `deploy`: the irreversible edge, given weight. */
function deploySwell() {
  const out = secs(0.85)
  const r = lcg(5)
  let ph = 0
  for (let i = 0; i < out.length; i++) {
    const t = i / out.length
    ph += (2 * Math.PI * (28 + 34 * t)) / SR
    const env = Math.min(1, t * 5) * (1 - t) ** 1.6
    out[i] = Math.sin(ph) * env * 0.9 + (r() * 2 - 1) * env * 0.12
  }
  run(out, biquad('lowpass', 400, 0.8))
  return normalize(out, 0.9)
}

/** Title/boot. Slow attack so it cannot be mistaken for an interaction. */
function stinger() {
  const out = secs(1.6)
  const env = bell(out.length, 0.35)
  for (let i = 0; i < out.length; i++) {
    const t = i / SR
    out[i] = (Math.sin(2 * Math.PI * 73.4 * t) * 0.7
            + Math.sin(2 * Math.PI * 110 * t) * 0.3
            + Math.sin(2 * Math.PI * 146.8 * t) * 0.15) * env[i]
  }
  run(out, biquad('lowpass', 900, 0.7))
  return normalize(out, 0.8)
}

/* ── loops ───────────────────────────────────────────────────────────────── */

/**
 * Renders `sec + xfade` seconds and folds the tail back over the head, so the
 * loop point is inaudible. Periodic content (the hum) is unaffected because it
 * is phase-continuous across the fold by construction — only the noise beds,
 * which have no period, need this.
 */
function loop(sec, xfade, render) {
  const total = Math.round((sec + xfade) * SR)
  const keep = Math.round(sec * SR)
  const x = total - keep
  const full = render(total)
  const out = full.slice(0, keep)
  for (let i = 0; i < x; i++) {
    const w = i / x
    out[i] = out[i] * w + full[keep + i] * (1 - w)
  }
  return out
}

/** Fluorescent ballast + fan + distant chatter. Always on, must never call
 *  attention to itself — this is the quietest thing in the pack. */
function roomTone() {
  const sec = 30
  const chans = [0, 1].map((ch) =>
    loop(sec, 2.5, (n) => {
      const buf = new Float32Array(n)
      const r = lcg(101 + ch)
      // 60 Hz mains and its ballast harmonics. Integer Hz over an integer number
      // of seconds closes the loop with no phase step.
      for (let i = 0; i < n; i++) {
        const t = i / SR
        buf[i] = Math.sin(2 * Math.PI * 120 * t) * 0.30
               + Math.sin(2 * Math.PI * 60 * t) * 0.16
               + Math.sin(2 * Math.PI * 240 * t) * 0.09
               + Math.sin(2 * Math.PI * 360 * t) * 0.04
      }
      const fan = new Float32Array(n)
      for (let i = 0; i < n; i++) fan[i] = r() * 2 - 1
      run(fan, biquad('lowpass', 700, 0.6), biquad('lowpass', 380, 0.8), biquad('highpass', 70, 0.7))
      mix(buf, fan, 0.55)

      // Distant radio traffic: band-limited noise whose level wanders, never
      // resolving into speech. It is texture; the actual radio cue is a one-shot.
      const chatter = new Float32Array(n)
      for (let i = 0; i < n; i++) {
        const t = i / SR
        const wander = 0.5 + 0.5 * Math.sin(2 * Math.PI * (1 / 7.5) * t + ch)
        chatter[i] = (r() * 2 - 1) * wander ** 4
      }
      run(chatter, biquad('bandpass', 1700, 1.6), biquad('lowpass', 2600, 0.8))
      mix(buf, chatter, 0.05)
      return buf
    })
  )
  const p = Math.max(...chans.map((c) => c.reduce((m, v) => Math.max(m, Math.abs(v)), 0)))
  for (const c of chans) for (let i = 0; i < c.length; i++) c[i] = (c[i] / p) * 0.55
  return chans
}

/**
 * The Watch bed. One drone, and the filter opens across the loop rather than on
 * a game signal — the client cannot automate a filter without a graph node per
 * source, and a slow sweep baked into 60 s reads the same at the desk.
 */
function watchDrone() {
  // 40 s, not 60: at the §6 budget this loop is the single biggest file in the
  // game, and 40 is the shortest cycle where the filter sweep still reads as
  // weather rather than as an effect. Every partial below is an integer number
  // of cycles over 40 s (55·40, 82.5·40, 110·40), which is what lets the fold
  // in `loop()` do its job on the noise alone.
  const sec = 40
  const chans = [0, 1].map((ch) =>
    loop(sec, 4, (n) => {
      const buf = new Float32Array(n)
      const r = lcg(211 + ch)
      const detune = ch === 0 ? 1 : 1.004 // a hair apart, for width
      for (let i = 0; i < n; i++) {
        const t = i / SR
        buf[i] = Math.sin(2 * Math.PI * 55 * detune * t) * 0.5
               + Math.sin(2 * Math.PI * 82.5 * detune * t) * 0.22
               + Math.sin(2 * Math.PI * 110 * detune * t) * 0.12
      }
      const air = new Float32Array(n)
      for (let i = 0; i < n; i++) air[i] = r() * 2 - 1
      run(air, biquad('bandpass', 1100, 0.5), biquad('lowpass', 1800, 0.7))
      // The opening: air rises across the loop and falls back so the fold holds.
      for (let i = 0; i < n; i++) {
        const t = i / n
        air[i] *= 0.5 - 0.5 * Math.cos(2 * Math.PI * t)
      }
      mix(buf, air, 0.18)
      return buf
    })
  )
  const p = Math.max(...chans.map((c) => c.reduce((m, v) => Math.max(m, Math.abs(v)), 0)))
  for (const c of chans) for (let i = 0; i < c.length; i++) c[i] = (c[i] / p) * 0.7
  return chans
}

/* ── WAV ─────────────────────────────────────────────────────────────────── */

/** 16-bit PCM. The intermediate format only — ffmpeg encodes the shipped OGG. */
export function wav(channels) {
  const ch = channels.length
  const n = channels[0].length
  const bytes = n * ch * 2
  const b = Buffer.alloc(44 + bytes)
  b.write('RIFF', 0); b.writeUInt32LE(36 + bytes, 4); b.write('WAVE', 8)
  b.write('fmt ', 12); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20)
  b.writeUInt16LE(ch, 22); b.writeUInt32LE(SR, 24)
  b.writeUInt32LE(SR * ch * 2, 28); b.writeUInt16LE(ch * 2, 32); b.writeUInt16LE(16, 34)
  b.write('data', 36); b.writeUInt32LE(bytes, 40)
  let o = 44
  for (let i = 0; i < n; i++) {
    for (let c = 0; c < ch; c++) {
      const v = Math.max(-1, Math.min(1, channels[c][i]))
      b.writeInt16LE(Math.round(v * 32767), o)
      o += 2
    }
  }
  return b
}

/** id → () => Float32Array[] (one entry per channel). Ids match `audio-map.json`. */
export const SYNTH = {
  'radio-squelch-open': () => [squelch(true)],
  'radio-squelch-close': () => [squelch(false)],
  'judgment-heartbeat': () => [heartbeat()],
  'symptom-chime': () => [symptomChime()],
  'npc-handset': () => [handsetTone()],
  'fallback-burst': () => [fallbackBurst()],
  'collapse': () => [collapse()],
  'deploy-swell': () => [deploySwell()],
  'stinger': () => [stinger()],
  'amb-room-tone': roomTone,
  'amb-watch-drone': watchDrone,
}

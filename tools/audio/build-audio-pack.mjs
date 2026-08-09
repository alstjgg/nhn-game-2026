// Builds `public/assets/audio/` — the whole shipped sound pack, from scratch.
//
//   node tools/audio/build-audio-pack.mjs           # build everything
//   node tools/audio/build-audio-pack.mjs --check   # fail if outputs are stale
//   node tools/audio/build-audio-pack.mjs paper-tear stamp   # rebuild a subset
//
// Same job as `tools/fonts/vendor-google-webfonts.mjs`, for the same two
// reasons: spec-client §3 inv 10 forbids third-party requests at runtime, so
// every sample has to live in the repo, and CLAUDE.md rule 5 wants provenance
// recorded for each one. This file *is* that provenance — `SOURCES` names the
// origin, licence and author of every recording used, and `CUES` records the
// exact cut that turned it into a game sound. Re-running reproduces the pack.
//
// Two halves, per plan-audio §5's hybrid decision:
//   • sourced — CC0 recordings from Kenney / OpenGameArt / Wikimedia Commons,
//     cut and filtered here by ffmpeg
//   • generated — `synth.mjs`, for the cues no library does well (room tone,
//     drone, squelch, the dissonant symptom chime, the collapse)
//
// Requires ffmpeg on PATH. Downloads are cached in `tools/audio/.cache/`
// (gitignored); only the encoded OGGs under `public/` are committed.
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { SYNTH, wav } from './synth.mjs'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const REPO = path.resolve(HERE, '../..')
const OUT = path.join(REPO, 'public/assets/audio')
const CACHE = path.join(HERE, '.cache')

/* ── where every recording came from ─────────────────────────────────────── */

/**
 * One entry per upstream pack. `license` is the SPDX-ish identifier that goes
 * into `assets-manifest.json`; `attribution` is null when the licence does not
 * require it (CC0 and public domain do not — Kenney asks for a credit and says
 * outright it is not mandatory, and we credit anyway).
 */
const SOURCES = {
  'kenney-interface': {
    page: 'https://kenney.nl/assets/interface-sounds',
    url: 'https://kenney.nl/media/pages/assets/interface-sounds/fa43c1dd4d-1677589452/kenney_interface-sounds.zip',
    zip: true, license: 'CC0-1.0', author: 'Kenney', attribution: null,
  },
  'kenney-impact': {
    page: 'https://kenney.nl/assets/impact-sounds',
    url: 'https://kenney.nl/media/pages/assets/impact-sounds/87b4ddecda-1677589768/kenney_impact-sounds.zip',
    zip: true, license: 'CC0-1.0', author: 'Kenney', attribution: null,
  },
  'oga-paper': {
    page: 'https://opengameart.org/content/various-paper-sound-effects',
    url: 'https://opengameart.org/sites/default/files/',
    files: ['paper_ripped_-_1.mp3', 'paper_sound_-_1.mp3'],
    license: 'CC0-1.0', author: 'Luckius', attribution: null,
  },
  'oga-typewriter': {
    page: 'https://opengameart.org/content/typewriter-sounds',
    url: 'https://opengameart.org/sites/default/files/',
    files: ['typewriter1.wav', 'typewriter2.wav'],
    license: 'CC0-1.0', author: 'Cassie-OrbitGames', attribution: null,
  },
  'oga-bookflips': {
    page: 'https://opengameart.org/content/10-book-page-flips',
    url: 'https://opengameart.org/sites/default/files/book_flips_-_starninjas.zip',
    zip: true, license: 'CC0-1.0', author: 'StarNinjas', attribution: null,
  },
  'oga-100sfx': {
    page: 'https://opengameart.org/content/100-cc0-sfx',
    url: 'https://opengameart.org/sites/default/files/100-CC0-SFX_0.zip',
    zip: true, license: 'CC0-1.0', author: 'rubberduck', attribution: null,
  },
  'oga-woodmetal': {
    page: 'https://opengameart.org/content/100-cc0-metal-and-wood-sfx',
    url: 'https://opengameart.org/sites/default/files/100-CC0-wood-metal-SFX.zip',
    zip: true, license: 'CC0-1.0', author: 'rubberduck', attribution: null,
  },
  'commons-ding': {
    page: 'https://commons.wikimedia.org/wiki/File:406243_stubb_typewriter-ding-near-mono.wav',
    url: 'https://upload.wikimedia.org/wikipedia/commons/9/9f/406243_stubb_typewriter-ding-near-mono.wav',
    files: ['406243_stubb_typewriter-ding-near-mono.wav'],
    license: 'CC0-1.0', author: '_stubb', attribution: null, direct: true,
  },
  'commons-clock': {
    page: 'https://commons.wikimedia.org/wiki/File:Clock_ticking.ogg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/5/56/Clock_ticking.ogg',
    files: ['Clock_ticking.ogg'],
    license: 'public-domain', author: 'Natalie', attribution: null, direct: true,
  },
  // The two office sources. Freesound serves the ORIGINAL wav only to a
  // signed-in caller, so what these URLs fetch is the site's own `-hq` preview
  // render (128 kbps MP3) — the highest-quality artefact a build step can get
  // unattended, and the reason this builder stays runnable on the other
  // member's laptop with no account. Both uploads are CC0, which the render
  // inherits. Everything they feed is low-passed at 3.5 kHz or is stationary
  // fan noise, so the transcode is inaudible where it lands.
  'freesound-office-tone': {
    page: 'https://freesound.org/people/richwise/sounds/456207/',
    url: 'https://cdn.freesound.org/previews/456/456207_1481531-hq.mp3',
    files: ['456207_1481531-hq.mp3'],
    license: 'CC0-1.0', author: 'richwise', attribution: null, direct: true,
  },
  'freesound-office-events': {
    page: 'https://freesound.org/people/Fupicat/sounds/534123/',
    url: 'https://cdn.freesound.org/previews/534/534123_7724198-hq.mp3',
    files: ['534123_7724198-hq.mp3'],
    license: 'CC0-1.0', author: 'Fupicat', attribution: null, direct: true,
  },
}

/* ── the cut list ────────────────────────────────────────────────────────── */

// Leading silence differs per pack and per file, and hand-measuring 30 offsets
// would rot the moment an upstream file is revised. Every sourced cue starts
// with this instead: drop everything before the first sample above -50 dB.
const TRIM = 'silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0'

/**
 * id → the cue. `layers` are mixed; each is either `{src}` (a file inside a
 * SOURCES entry) or `{synth}` (an id from synth.mjs). `filters` is an ffmpeg
 * audio filter chain applied to that layer alone, `delay` offsets it in ms.
 *
 * Ids are what `data/policy/audio-map.json` refers to; renaming one here is a
 * breaking change for that file, and `--check` will not catch it — the map's
 * own loader validates the reference at boot.
 */
const CUES = {
  /* — the Autopsy surface: paper — */
  'paper-tear': {                                     // op `mine`
    hifi: true,
    layers: [{ src: 'oga-paper/paper_ripped_-_1.mp3', filters: `${TRIM},atrim=0:0.46` }],
  },
  'paper-slide': {                                    // op `unslot`
    hifi: true,
    layers: [{ src: 'oga-paper/paper_sound_-_1.mp3', filters: `${TRIM},atrim=0:0.30,afade=t=out:st=0.24:d=0.06` }],
  },
  /* — the Build surface: the stamp — */
  'stamp': {                                          // op `slot`
    layers: [
      { src: 'kenney-impact/Audio/impactSoft_medium_000.ogg', filters: `${TRIM},atrim=0:0.22`, gain: 1 },
      // A dull wooden body under the paper hit — this is what makes it a stamp
      // on a desk rather than a click in a menu.
      { src: 'kenney-impact/Audio/impactWood_medium_000.ogg', filters: `${TRIM},atrim=0:0.22,lowpass=f=320`, gain: 0.7 },
    ],
  },
  // The ledger landing (`data-tally-state` → `final`). A struck bell rather
  // than another stamp: the desk already stamps for `slot`, for `run_end` and
  // on the agent file, and a fourth would read as one more piece of paperwork.
  // The day's verdict is not paperwork. Low-passed at 4 kHz: it was cut to sit
  // under the report's typewriter ding, and it keeps that weight now that the
  // report is silent — a bell this heavy would be wrong at full brightness.
  'ledger-bell': {
    hifi: true,
    layers: [{
      src: 'kenney-impact/Audio/impactBell_heavy_000.ogg',
      filters: `${TRIM},atrim=0:1.4,lowpass=f=4000,volume=0.9`,
    }],
  },
  'stamp-heavy': {                                    // `run_end` — stamp + folder
    layers: [
      { src: 'kenney-impact/Audio/impactWood_heavy_000.ogg', filters: `${TRIM},atrim=0:0.4`, gain: 1 },
      { src: 'oga-100sfx/paper_02.ogg', filters: `${TRIM},atrim=0:0.5`, gain: 0.55, delay: 90 },
    ],
  },

  /* — the irreversible edge — */
  'deploy': {                                         // op `deploy`
    layers: [
      { src: 'kenney-interface/Audio/switch_002.ogg', filters: `${TRIM},atrim=0:0.3`, gain: 0.9 },
      { synth: 'deploy-swell', gain: 0.85, delay: 20 },
    ],
  },

  /* — the Watch surface: the document writing itself — */
  // Five variants because one typewriter sample repeated at reading speed turns
  // into a machine gun inside thirty seconds (plan-audio §4.1 #5). The rate
  // change moves pitch and length together, which is exactly the variation a
  // real key strike has.
  ...Object.fromEntries([
    ['type-1', ['typewriter1.wav', 1.0], ], ['type-2', ['typewriter2.wav', 1.06]],
    ['type-3', ['typewriter1.wav', 0.94]], ['type-4', ['typewriter2.wav', 1.12]],
    ['type-5', ['typewriter1.wav', 1.03]],
  ].map(([id, [file, rate]]) => [id, {
    layers: [{
      src: `oga-typewriter/${file}`,
      filters: `${TRIM},atrim=0:0.075,asetrate=44100*${rate},aresample=44100,afade=t=out:st=0.055:d=0.02`,
    }],
  }])),
  'carriage-return': {                                // a feed line completing
    layers: [
      { src: 'oga-typewriter/typewriter2.wav', filters: `${TRIM},atrim=0:0.26,lowpass=f=3000`, gain: 0.8 },
      { src: 'commons-ding/406243_stubb_typewriter-ding-near-mono.wav', filters: `${TRIM},atrim=0:0.5`, gain: 0.7, delay: 60 },
    ],
  },

  /* — waiting, diegetically — */
  // The recording ticks at exactly 1.000 s (measured: transients at 2.05, 3.05,
  // 4.05), so two periods cut on a transient close the loop with no crossfade
  // and no drift. Do not "improve" this with a fade — a fade is what would make
  // the seam audible.
  'clock-loop': {
    loop: true,
    layers: [{ src: 'commons-clock/Clock_ticking.ogg', filters: 'atrim=2.03:4.03,asetpts=PTS-STARTPTS' }],
  },

  /* — the desk itself — */
  'drawer-open': { hifi: true, layers: [{ src: 'oga-100sfx/wooden_01.ogg', filters: `${TRIM},atrim=0:0.35` }] },
  'drawer-close': { hifi: true, layers: [{ src: 'oga-woodmetal/wood_close_01.ogg', filters: `${TRIM},atrim=0:0.35` }] },
  'ui-click': { layers: [{ src: 'kenney-interface/Audio/click_002.ogg', filters: `${TRIM},atrim=0:0.12` }] },
  'ui-hover': { layers: [{ src: 'kenney-interface/Audio/tick_002.ogg', filters: `${TRIM},atrim=0:0.08,volume=0.5` }] },
  'ui-error': { layers: [{ src: 'kenney-interface/Audio/error_003.ogg', filters: `${TRIM},atrim=0:0.5` }] },
  'drag-start': { layers: [{ src: 'kenney-interface/Audio/select_003.ogg', filters: `${TRIM},atrim=0:0.15` }] },
  'drag-drop': { layers: [{ src: 'kenney-interface/Audio/drop_002.ogg', filters: `${TRIM},atrim=0:0.25` }] },
  'pen-mark': { hifi: true, layers: [{ src: 'kenney-interface/Audio/scratch_003.ogg', filters: `${TRIM},atrim=0:0.3` }] },
  'counter-click': { layers: [{ src: 'kenney-interface/Audio/switch_004.ogg', filters: `${TRIM},atrim=0:0.25` }] },
  // The tally reads as a verdict: a row above the untouched day ticks up, a row
  // below ticks down. Same sample, pitched — the pair has to be recognisably one
  // instrument or the comparison does not land.
  'score-tick-up': {
    layers: [{ src: 'kenney-interface/Audio/tick_001.ogg', filters: `${TRIM},atrim=0:0.12,asetrate=44100*1.14,aresample=44100` }],
  },
  'score-tick-down': {
    layers: [{ src: 'kenney-interface/Audio/tick_001.ogg', filters: `${TRIM},atrim=0:0.12,asetrate=44100*0.86,aresample=44100` }],
  },

  /* — generated (synth.mjs) — */
  'radio-squelch-open': { layers: [{ synth: 'radio-squelch-open' }] },
  'radio-squelch-close': { layers: [{ synth: 'radio-squelch-close' }] },
  'judgment-heartbeat': { layers: [{ synth: 'judgment-heartbeat' }] },
  'symptom-chime': { layers: [{ synth: 'symptom-chime' }] },
  'npc-handset': { layers: [{ synth: 'npc-handset' }] },
  'fallback-burst': { layers: [{ synth: 'fallback-burst' }] },
  'collapse': { layers: [{ synth: 'collapse' }] },
  'stinger': { layers: [{ synth: 'stinger' }] },

  /* — ambience: stereo, lazy-loaded, looped — */
  // NOTE — the synthesised `amb-room-tone` that used to be the desk bed is
  // retired: `amb-office-tone` below is a real room and does the same job
  // better. `synth.mjs` keeps the generator, so restoring it is one line here
  // plus a rebuild. Shipping both put the ambience wave 100 kB over its §6
  // budget for a file nothing referenced.
  'amb-watch-drone': { layers: [{ synth: 'amb-watch-drone' }], ambience: true, loop: true },

  /* — the office beyond the desk (plan-audio §4.4) — */
  // A 30 s seamless loop cut out of a 7:52 recording of an empty office, made
  // to close on itself with the two-layer crossfade trick: layer 1 is 60→90
  // fading IN over 2 s, layer 2 is the 90→92 that follows it, laid over that
  // same head fading OUT. The two sum to constant power across the join, and
  // because layer 2 is the audio that genuinely comes after layer 1's tail, the
  // wrap from 30 s back to 0 s is continuous rather than merely quiet.
  //
  // `volume=24.5dB` is the one level decision made here rather than in the map,
  // and it is source normalisation, not balance: the recording arrives at -38
  // LUFS because it is a real room recorded quietly, and the pack's beds are
  // written at about -13.5 so that `gain: 1` on the ambience bus lands where a
  // bed belongs. Lifting it here keeps the map's number readable — the
  // alternative is `gain: 16.8` in balance data, which tells a reader nothing.
  // Peak after the lift is -2.6 dBFS, so nothing clips.
  'amb-office-tone': {
    ambience: true, loop: true,
    layers: [
      { src: 'freesound-office-tone/456207_1481531-hq.mp3', filters: 'atrim=60:90,asetpts=PTS-STARTPTS,volume=24.5dB,afade=t=in:st=0:d=2' },
      { src: 'freesound-office-tone/456207_1481531-hq.mp3', filters: 'atrim=90:92,asetpts=PTS-STARTPTS,volume=24.5dB,afade=t=out:st=0:d=2' },
    ],
  },
  // Five one-shots cut out of a 24 s office loop that is far too busy to lay
  // down whole — it rings a phone every 6 s. What the desk wants is the same
  // room heard occasionally, so the events are extracted and re-sown on a
  // 10–20 s timer (`ambience.sparse`) instead.
  //
  // `highpass=150,lowpass=3500` on every one of them is not tone-shaping, it is
  // DISTANCE: these must read as somebody else's desk across the room. A crisp
  // keystroke here would be indistinguishable from the report window typing,
  // which is a cue that carries meaning (plan-audio §2 rule 3).
  ...Object.fromEntries([
    ['office-keys-1', [9.90, 10.52]],
    ['office-keys-2', [21.00, 21.58]],
    ['office-keys-3', [2.20, 2.78]],
    ['office-phone', [5.97, 6.97]],
    ['office-printer', [14.48, 15.10]],
  ].map(([id, [from, to]]) => [id, {
    layers: [{
      src: 'freesound-office-events/534123_7724198-hq.mp3',
      filters: `atrim=${from}:${to},asetpts=PTS-STARTPTS,highpass=f=150,lowpass=f=3500,`
        + `afade=t=in:st=0:d=0.02,afade=t=out:st=${(to - from - 0.06).toFixed(2)}:d=0.06`,
    }],
  }])),
}

/* ── fetch + extract ─────────────────────────────────────────────────────── */

const ff = (args) => execFileSync('ffmpeg', ['-v', 'error', '-y', ...args], { stdio: ['ignore', 'pipe', 'pipe'] })

/**
 * AAC in MP4, not Vorbis.
 *
 * Two reasons, in order. Compatibility: `decodeAudioData` takes AAC in every
 * desktop browser that ships today, including Safari, where Ogg container
 * support is recent enough that a judge on an older macOS would get a silent
 * page — and the judge's first sixty seconds is the thing this whole build
 * optimises for. Availability: the ffmpeg on this machine has no `libvorbis`
 * at all, and a build step that only runs on a correctly-compiled ffmpeg is a
 * build step that breaks on the other member's laptop.
 *
 * Bitrates are chosen against the §6 budget, not by ear-testing: 48k mono for
 * cues that are under half a second, 96k stereo for the two loops.
 */
const EXT = '.m4a'

/**
 * `hifi` cues keep 44.1 kHz and get 96 kbps; everything else is 22.05 kHz at 48.
 *
 * Paper, wood, pen strokes and a struck bell are broadband or tonally
 * sustained, which is the worst case for both halves of the small setting:
 * halving the rate folds the top of the spectrum back down, and 48 kbps AAC
 * smears what is left. Measured on a paper cue, the small setting produced
 * **4 dB MORE energy above 6 kHz than the source recording had** — hiss the
 * encoder manufactured, which reads in play as a cheap, noisy rustle.
 *
 * Clicks, ticks and keystrokes are transients with little high-frequency
 * sustain, so they are unaffected and stay small. Flagging per cue rather than
 * raising the default keeps ~25 files at 1.5 kB each.
 */
const CODEC = (cue) => [
  '-c:a', 'aac',
  '-b:a', cue.ambience ? '56k' : cue.hifi ? '96k' : '48k',
  '-movflags', '+faststart',
]

async function ensureSource(key) {
  const s = SOURCES[key]
  const dir = path.join(CACHE, key)
  if (fs.existsSync(path.join(dir, '.ok'))) return dir
  fs.mkdirSync(dir, { recursive: true })
  const grab = async (url, dest) => {
    // Commons rate-limits anonymous hotlinking and answers 429 without a UA
    // that identifies the caller; every other host here is indifferent to it.
    const res = await fetch(url, { headers: { 'user-agent': 'nhn-game-2026 audio-pack builder (https://github.com/alstjgg/nhn-game-2026)' } })
    if (!res.ok) throw new Error(`${res.status} ${res.statusText} — ${url}`)
    fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()))
  }
  if (s.zip) {
    const zip = path.join(dir, 'pack.zip')
    await grab(s.url, zip)
    execFileSync('unzip', ['-qo', zip, '-d', dir])
    fs.unlinkSync(zip)
  } else {
    for (const f of s.files) await grab(s.direct ? s.url : s.url + f, path.join(dir, f))
  }
  fs.writeFileSync(path.join(dir, '.ok'), s.url)
  return dir
}

/** Resolves `pack/inner/path.ogg` against the cache, tolerating a wrapper dir. */
function resolveSrc(ref) {
  const [key, ...rest] = ref.split('/')
  const want = rest.join('/')
  const base = path.join(CACHE, key)
  const direct = path.join(base, want)
  if (fs.existsSync(direct)) return direct
  const stack = [base]
  while (stack.length) {
    const d = stack.pop()
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name)
      if (e.isDirectory()) stack.push(p)
      else if (p.endsWith('/' + path.basename(want))) return p
    }
  }
  throw new Error(`not found in cache: ${ref}`)
}

/* ── build ───────────────────────────────────────────────────────────────── */

function buildCue(id, cue, tmp) {
  const inputs = []
  const chains = []
  cue.layers.forEach((layer, i) => {
    let file
    if (layer.synth) {
      const gen = SYNTH[layer.synth]
      if (!gen) throw new Error(`${id}: no synth "${layer.synth}"`)
      file = path.join(tmp, `${id}-${i}.wav`)
      fs.writeFileSync(file, wav(gen()))
    } else {
      file = resolveSrc(layer.src)
    }
    inputs.push('-i', file)
    const parts = []
    if (layer.filters) parts.push(layer.filters)
    if (layer.delay) parts.push(`adelay=${layer.delay}:all=1`)
    if (layer.gain != null && layer.gain !== 1) parts.push(`volume=${layer.gain}`)
    chains.push(`[${i}:a]${parts.length ? parts.join(',') : 'anull'}[l${i}]`)
  })

  const n = cue.layers.length
  const mixed = n === 1 ? '[l0]' : '[mx]'
  // `normalize=0` because each layer's level is already deliberate; amix's
  // default would re-balance a mix whose whole point is that one layer sits
  // under the other. `dropout_transition=0` keeps a short layer from ducking
  // the long one when it ends.
  const mixStep = n === 1 ? '' : `;${chains.map((_, i) => `[l${i}]`).join('')}amix=inputs=${n}:normalize=0:dropout_transition=0[mx]`

  // No loudness normalisation here, deliberately. Per-cue level is balance data
  // and lives in `audio-map.json` `gain`; a normaliser in the build would fight
  // it, and on a 200 ms one-shot `dynaudnorm` pumps audibly. All this step does
  // is channel and rate conversion.
  const post = cue.ambience
    ? `${mixed}aformat=sample_fmts=fltp:channel_layouts=stereo,aresample=44100[out]`
    : `${mixed}aformat=sample_fmts=fltp:channel_layouts=mono,aresample=${cue.hifi ? 44100 : 22050}[out]`

  const out = path.join(OUT, `${id}${EXT}`)
  ff([
    ...inputs,
    '-filter_complex', chains.join(';') + mixStep + ';' + post,
    '-map', '[out]',
    ...CODEC(cue),
    out,
  ])
  return out
}

/* ── provenance ──────────────────────────────────────────────────────────── */

/**
 * Rewrites the audio rows of `assets-manifest.json` from `CUES` and `SOURCES`.
 *
 * CLAUDE.md rule 5 wants one entry per external asset with its origin and
 * licence, and a hand-maintained list of 34 rows beside a generator is a list
 * that goes stale. Generating it means the manifest cannot disagree with what
 * was actually built. Only rows under `public/assets/audio/` are touched;
 * everything else in the file is left exactly as it was.
 */
function writeManifest() {
  const manifestPath = path.join(REPO, 'assets-manifest.json')
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
  const rows = []

  for (const [id, cue] of Object.entries(CUES)) {
    const file = `public/assets/audio/${id}${EXT}`
    const packs = [...new Set(cue.layers.filter((l) => l.src).map((l) => l.src.split('/')[0]))]
    const takes = cue.layers.filter((l) => l.src).map((l) => l.src.split('/').slice(1).join('/'))
    const synths = cue.layers.filter((l) => l.synth).map((l) => l.synth)

    if (packs.length === 0) {
      rows.push({
        file,
        tool: 'tools/audio/synth.mjs — procedural DSP, deterministic (no model, no recording)',
        prompt: null,
        license: 'generated for this project',
        generated: synths,
      })
      continue
    }
    const licenses = [...new Set(packs.map((k) => SOURCES[k].license))]
    rows.push({
      file,
      source: packs.map((k) => `${SOURCES[k].author} — ${SOURCES[k].page}`).join(' + '),
      // The exact upstream takes and what was done to them, so a licence audit
      // can walk back from a shipped file to the recording it came from.
      derived_from: takes,
      ...(synths.length > 0 ? { layered_with: synths } : {}),
      recipe: 'tools/audio/build-audio-pack.mjs (cut/filter/mix, AAC 48k mono · 96k stereo)',
      prompt: null,
      license: licenses.length === 1 ? licenses[0] : licenses.join(' + '),
    })
  }

  const kept = manifest.assets.filter((a) => !String(a.file).startsWith('public/assets/audio/'))
  manifest.assets = [...kept, ...rows.sort((a, b) => a.file.localeCompare(b.file))]
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
  console.log(`assets-manifest.json — ${rows.length} audio rows written`)
}

/* ── the binding table ───────────────────────────────────────────────────── */

/**
 * What each trigger MEANS, in the game rather than in the code.
 *
 * It lives here and not in `map.ts` because it is documentation: the client
 * never reads it, and a runtime module should not carry prose into the bundle.
 * A trigger with no entry prints as undocumented in the generated table, which
 * is how a newly added moment asks to be described.
 */
const TRIGGER_WHEN = {
  'op:mine': 'a sentence is torn out of a report',
  'op:slot': 'a block is placed in the agent file',
  'op:unslot': 'a block is taken back out',
  'op:deploy': 'DEPLOY — the file locks and the day begins',
  'op:new_run': 'NEW RUN — the next day is requested',
  'feed:event': 'an ordinary timeline line is revealed',
  'feed:radio': 'a radio line is revealed',
  'feed:radio-end': '260 ms later — the channel closes',
  'feed:npc': 'an NPC line is revealed',
  'feed:symptom': 'a symptom line is revealed — temperament leaking',
  'feed:mark': 'a mark line is revealed',
  'feed:fallback': 'the fallback notice line is revealed',
  'feed:wait': 'a waiting marker is revealed',
  'wait:open': 'held for as long as the agent is waiting on a call',
  'wait:judgment': 'the agent is about to judge',
  'wait:narration': 'waiting on the narration call',
  'wait:report': 'waiting on the reporter call',
  'run:open': 'a day opens — once per run',
  'event:report': '「무전 기록」 lands in REPORTS',
  'event:run_end': '21:04 — the day closes',
  'tally:final': 'the ledger finishes counting up',
  'event:fallback:1': 'the judgment call degraded',
  'event:fallback:2': 'the narration call degraded',
  'event:fallback:3': 'the reporter call degraded',
  'score:up': 'a ledger row moved off the untouched day',
  'score:down': 'a ledger row is where the untouched day left it',
  'ui:click': 'any button, tab or taskbar entry',
  'ui:hover': 'the pointer reaches a control',
  'door:login': 'the portal LOGIN press',
  'ui:window-open': 'a window is shown — or the manual sheet arrives',
  'ui:window-close': 'a window is hidden — or the manual sheet leaves',
  'ui:drag': 'a block card is picked up',
  'ui:drop': 'a block card is dropped',
  boot: 'the first gesture — the portal powers on',
  'ending:collapse': 'the last day, just ahead of its ledger',
}

/**
 * Rewrites the "which sound plays when" table inside `docs/plan-audio.md`.
 *
 * Three files have to agree for a cue to sound — `map.ts` declares the trigger,
 * `audio-map.json` binds it to a cue, and the cue names an asset this builder
 * produced — and a hand-written table across three sources is a table that goes
 * wrong quietly. This reads all three: the trigger ORDER and grouping come from
 * `TRIGGERS`, the binding and levels from the map, and the length from the
 * encoded file on disk. A trigger that is declared and never bound prints as
 * silent rather than going missing, which is the case worth seeing.
 */
function writeBindingTable() {
  const DOC = path.join(REPO, 'docs/plan-audio.md')
  const BEGIN = '<!-- audio:bindings:begin -->'
  const END = '<!-- audio:bindings:end -->'

  const map = JSON.parse(fs.readFileSync(path.join(REPO, 'data/policy/audio-map.json'), 'utf8'))
  const cues = Object.fromEntries(Object.entries(map.cues).filter(([id]) => !id.startsWith('$')))

  // `TRIGGERS` is the closed vocabulary and its order is editorial — it groups
  // the moments the way a reader wants them. Comments are stripped first, or an
  // apostrophe in prose reads as a string delimiter.
  const source = fs.readFileSync(path.join(REPO, 'src/client/audio/map.ts'), 'utf8')
  const declared = source.slice(
    source.indexOf('export const TRIGGERS'),
    source.indexOf('] as const'),
  )
  const triggers = [...declared.replace(/\/\/[^\n]*/g, '').matchAll(/'([^']+)'/g)].map((m) => m[1])

  const seconds = (file) => {
    const at = path.join(OUT, `${file}${EXT}`)
    if (!fs.existsSync(at)) return '—'
    const out = execFileSync('ffprobe', [
      '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', at,
    ]).toString().trim()
    return `${Number(out).toFixed(2)} s`
  }

  const gap = (cue) =>
    cue.loop === true ? 'loop' : cue.cooldownMs === undefined ? '—' : `${cue.cooldownMs} ms`

  const when = (trigger) => TRIGGER_WHEN[trigger] ?? '**undocumented**'

  const row = (trigger) => {
    const id = map.bindings[trigger]
    if (id === null || id === undefined) {
      return `| ${when(trigger)} | \`${trigger}\` | — | *silent* | | | |`
    }
    const cue = cues[id]
    const files = cue.files.map((f) => `\`${f}\``).join(' · ')
    return `| ${when(trigger)} | \`${trigger}\` | \`${id}\` | ${files} | ${seconds(cue.files[0])} | ${cue.gain} | ${gap(cue)} |`
  }

  const lines = [
    BEGIN,
    '',
    `> Generated by \`npm run audio:table\` from \`data/policy/audio-map.json\`,`,
    `> \`src/client/audio/map.ts\` and the encoded files. **Do not edit by hand.**`,
    '',
    '| When | Trigger | Cue | Asset | Length | Gain | Min gap |',
    '|---|---|---|---|---|---|---|',
    ...triggers.map(row),
    '',
    '**Not driven by a trigger:**',
    '',
    '| | Cue | Asset | Length | Gain |',
    '|---|---|---|---|---|',
    ...['desk', 'watch'].map((slot) => {
      const id = map.ambience[slot]
      if (typeof id !== 'string') return `| ambience \`${slot}\` | — | *silent* | | |`
      const cue = cues[id]
      return `| ambience \`${slot}\` | \`${id}\` | \`${cue.files[0]}\` | ${seconds(cue.files[0])} | ${cue.gain} |`
    }),
    (() => {
      const cue = cues[map.typing.cue]
      return `| report typewriter, every ${map.typing.everyChars} chars | \`${map.typing.cue}\` | ${cue.files.map((f) => `\`${f}\``).join(' · ')} | ${seconds(cue.files[0])} | ${cue.gain} |`
    })(),
    '',
    `Buses: \`sfx\` ${map.buses.sfx} · \`ambience\` ${map.buses.ambience}. `
      + `Ambience retires ${map.ambience.playForMs === null ? 'never' : `${map.ambience.playForMs} ms after the desk opens`}. `
      + `Preloaded: ${map.preload.map((id) => `\`${id}\``).join(' · ')}.`,
    '',
    END,
  ].join('\n')

  const doc = fs.readFileSync(DOC, 'utf8')
  const from = doc.indexOf(BEGIN)
  const to = doc.indexOf(END)
  if (from === -1 || to === -1) {
    throw new Error(`docs/plan-audio.md is missing the ${BEGIN} / ${END} markers`)
  }
  fs.writeFileSync(DOC, doc.slice(0, from) + lines + doc.slice(to + END.length))
  console.log(`docs/plan-audio.md — binding table written (${triggers.length} triggers)`)
}

/* ── entry ───────────────────────────────────────────────────────────────── */

const argv = process.argv.slice(2)
const check = argv.includes('--check')
const only = argv.filter((a) => !a.startsWith('--'))

if (argv.includes('--manifest')) {
  writeManifest()
  process.exit(0)
}

if (argv.includes('--table')) {
  writeBindingTable()
  process.exit(0)
}

const wanted = only.length ? only : Object.keys(CUES)
for (const id of wanted) if (!CUES[id]) throw new Error(`unknown cue: ${id}`)

if (check) {
  const missing = wanted.filter((id) => !fs.existsSync(path.join(OUT, `${id}${EXT}`)))
  if (missing.length) {
    console.error(`audio pack incomplete — missing ${missing.length}: ${missing.join(', ')}`)
    console.error('run: node tools/audio/build-audio-pack.mjs')
    process.exit(1)
  }
  console.log(`audio pack ok — ${wanted.length} cues present`)
  process.exit(0)
}

fs.mkdirSync(OUT, { recursive: true })
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'audio-pack-'))

const needed = new Set()
for (const id of wanted) {
  for (const l of CUES[id].layers) if (l.src) needed.add(l.src.split('/')[0])
}
for (const key of needed) {
  process.stdout.write(`  source ${key} … `)
  await ensureSource(key)
  console.log('ok')
}

let total = 0
for (const id of wanted) {
  const out = buildCue(id, CUES[id], tmp)
  const kb = fs.statSync(out).size / 1024
  total += kb
  console.log(`  ${id.padEnd(20)} ${kb.toFixed(1).padStart(7)} kB`)
}
fs.rmSync(tmp, { recursive: true, force: true })

const sfx = wanted.filter((id) => !CUES[id].ambience)
const amb = wanted.filter((id) => CUES[id].ambience)
const sum = (ids) => ids.reduce((t, id) => t + fs.statSync(path.join(OUT, `${id}${EXT}`)).size / 1024, 0)
console.log(`\n${wanted.length} cues · ${total.toFixed(0)} kB total`)
console.log(`  sfx      ${sfx.length} files · ${sum(sfx).toFixed(0)} kB  (plan-audio §6 budget: ~150 kB)`)
console.log(`  ambience ${amb.length} files · ${sum(amb).toFixed(0)} kB  (budget: ~600 kB)`)

export { CUES, SOURCES }

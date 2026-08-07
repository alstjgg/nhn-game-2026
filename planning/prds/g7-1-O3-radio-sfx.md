# g7-1 — O3: three radio cues, synthesised in place — LOGIN static · the hand-over tick · the 21:04 cut

> plan-playtest v12 · citations bind to `fa49be6` · branch `playtest/g7-1-o3-audio`
> commit message: `playtest(O3): three radio cues — WebAudio in place, no assets ship`

## Outcome

The game gains three sounds, all synthesised at runtime with WebAudio — no
audio file ships. Pressing LOGIN lays carrier static under the auth readout for
exactly its runway; the manual's hand-over to the desk clicks with one short
squelch tick; at 21:04 the static swells for ~2 seconds and cuts — the silence
after the cut is the cue. A driven browser (`navigator.webdriver`, the same key
the door keys off) hears nothing, so every e2e lane is untouched.

Procedural on purpose: no binary means `assets-manifest.json` (hard rule 5
covers external/AI-generated **files**) stays untouched, the third-party guard
has nothing to scan, and the page-weight budget does not move.

## Scope

May modify:
- `src/client/shell/radio-sfx.ts` — **new file**
- `src/client/shell/boot.ts` (one import, two call sites)
- `src/client/shell/sign-in.ts` (one import, one call site)

Must NOT modify:
- `assets-manifest.json` — nothing ships, nothing is manifested.
- `public/assets/**` — no audio directory is created.
- Any window, component, or driver module — the day-end cue subscribes to the
  driver's own stream from boot; it does not ride `announcer.ts`,
  `agent-file.ts` or `run-feed.ts` (g5-1/g6-1 own edits there this wave).

Tests turned red: none expected. `grep -rn "audio" tests/ e2e/` finds no suite
that opens audio; the shell's no-free-text and census suites do not count
non-interactive modules. If any suite goes red anyway, that is a stop under
§"If this PRD is wrong".

## Change list

**1. `src/client/shell/radio-sfx.ts`** — new file, exactly:
```ts
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
```

**2. `src/client/shell/boot.ts`** — three edits, bottom-up.

2a. `:233-235` — current (inside the step-6 hand-over block):
```
    await door
    await openManual(must('#app'), { width: window.innerWidth, height: window.innerHeight })
  }
```
replace with:
```
    await door
    await openManual(must('#app'), { width: window.innerWidth, height: window.innerHeight })
    sfxHandOver()
  }
```

2b. `:167` — current:
```
  createAnnouncer(must('#toast'), driver)
```
replace with:
```
  createAnnouncer(must('#toast'), driver)
  bindRadioSfx(driver)
```

2c. `:15` — current:
```
import { createAnnouncer } from './announcer.ts'
```
replace with:
```
import { createAnnouncer } from './announcer.ts'
import { bindRadioSfx, sfxHandOver } from './radio-sfx.ts'
```

**3. `src/client/shell/sign-in.ts`** — two edits, bottom-up.

3a. `:224` — current (inside the LOGIN click handler):
```
      const runway = authLines().length * STEP_MS + TAIL_MS
```
replace with:
```
      const runway = authLines().length * STEP_MS + TAIL_MS
      sfxLoginStatic(runway)
```

3b. `:18` — current:
```
import { button, el } from './dom.ts'
```
replace with:
```
import { button, el } from './dom.ts'
import { sfxLoginStatic } from './radio-sfx.ts'
```

## Invariants

- **Nothing external.** No URL, no fetch, no asset file — the module builds its
  buffers from `Math.random()`. `tests/assets/no-third-party-url.test.ts`
  must stay green untouched.
- **e2e determinism.** Both `bindRadioSfx` and `context()` return early under
  `navigator.webdriver`; every Playwright lane is silent and unchanged.
- **The membrane rule** — no input surface of any kind appears.
- **Autoplay policy is respected, never fought.** The LOGIN press is the
  unlocking gesture on the door path; the one-time `pointerdown`/`keydown`
  listener covers `?signin=skip` sessions. A context that stays suspended
  means silence, not a retry loop.
- **Boot order:** `bindRadioSfx(driver)` sits with the other subscribers
  (after the driver exists, before the windows mount) — do not move it into a
  window module.

## Verification

1. `npm run check` — green.
2. `npx vitest run` — green, no amendments anywhere.
3. `npm run build` — green; then
   `grep -rn "http" dist/assets/*.js | grep -i audio` prints nothing.

Observable (human, in a browser):
- `npm run preview`, open with `?signin=show`: pressing LOGIN produces soft
  static lasting the readout; the manual's close ticks; at 21:04 static swells
  ~2 s and cuts to silence.
- With `?signin=skip`: silent boot; after any click, the 21:04 cue still plays.

## Done when

- [ ] `npm run check`, `npx vitest run`, `npm run build` all exit 0.
- [ ] `git status --porcelain -- assets-manifest.json public/assets` is empty.
- [ ] `grep -c "webdriver" src/client/shell/radio-sfx.ts` prints `2` (both
      guards present).
- [ ] Behavioural: the three cues above are audible in a served build at their
      three moments, and a `?signin=skip` boot is silent until first gesture.
- [ ] Exactly one code commit on `playtest/g7-1-o3-audio`, nothing pushed.

## As executed — Done-when corrections (08-08)

Two Done-when rows were wrong as written, both authoring slips against content
this PRD itself dictated verbatim (the code landed byte-for-byte, `59ed631`):
the `webdriver` grep counts **3** (the doc comment at `:9` mentions it beside
the two real guards), and the `dist/` grep is line-based against a three-line
minified bundle, so it false-positives whenever `http` and `audio` share a
giant line — the executor verified by extracting URL literals instead: only
the SVG namespace and the proxy base URL exist, no audio network call.

## If this PRD is wrong

```
An edit whose stated current text is not at the cited path and line is a defect
in this document, not a puzzle to solve. Do not search for the text elsewhere.
Do not adapt the edit to what you find. Do not skip ahead to the next edit.

Stop at the first mismatch and report:
  - the edits that applied, by path:line
  - the edit that did not, with the text actually present at that path and line
  - the commit you are working from: `git log -1 --format=%h`

Change nothing further, and open no PR. A report of this kind is a completed
run, not a failed one.
```

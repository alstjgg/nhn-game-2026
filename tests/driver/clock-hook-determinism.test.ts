// [u11#c11] C16 — the SIM-CLOCK test hook: u2's charter completion.
//
// u2 promised "clock pause/seed + animation-freeze hooks"; only the animation
// half shipped — `driver/test-hooks.ts` exports freezeAnimations /
// thawAnimations / tickAnimations / registerAnimation / serializeFrame and
// nothing that SEEDS or ADVANCES the sim clock. C16 rules the missing half in
// scope for u11 and pins it here: same seed + same advance ⇒ same frame.
//
// The exposure rule is inv 11's, unchanged: the hook rides `window.__shell` in
// DEV/TEST builds ONLY and must be absent from the player bundle. The bundle
// half is `tests/debug/flag-off-bundle.test.ts`'s grep; the SOURCE half — that
// the only call site sits behind `import.meta.env.DEV` — is asserted here, so a
// regression fails without waiting for a build.
//
// This unlocks the two TALLY captures (seed → 21:04 → `#w-tally` loses
// `.hidden`). `#w-tally` being `display:none` before its phase is CORRECT.
import { describe, it, expect, beforeEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { ViewEvent } from '../../src/shared/view-driver.ts'
import type { FixtureRun } from '../../src/client/driver/fixtures/types.ts'
import { createFixtureDriver } from '../../src/client/driver/fixture-driver.ts'
import { MS_PER_SIM_MIN } from '../../src/client/driver/clock.ts'
import {
  freezeAnimations,
  thawAnimations,
  serializeFrame,
  // C16's additions — the half u2 never shipped.
  installClockHook,
  clockHookOf,
} from '../../src/client/driver/test-hooks.ts'
import type { ClockHook } from '../../src/client/driver/test-hooks.ts'

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const HOOKS = path.join(REPO, 'src/client/driver/test-hooks.ts')
const BOOT = path.join(REPO, 'src/client/shell/boot.ts')

const START = '13:05'
const END = '21:04'

function run(): FixtureRun {
  const events: ViewEvent[] = [
    { type: 'beat_start', beat: 1, clock: '13:05' },
    { type: 'feed', line: { kind: 'event', clock: '13:07', text: 'A' } },
    { type: 'feed', line: { kind: 'radio', clock: '14:10', text: 'B', speaker: 'SP' } },
    { type: 'beat_end', beat: 1, clock: '15:00' },
    { type: 'feed', line: { kind: 'event', clock: '20:00', text: 'C' } },
    { type: 'run_end', run: 1 },
  ]
  return {
    id: 'clock-hook',
    start: START,
    end: END,
    events,
    responses: {
      slot: { ok: true },
      unslot: { ok: true },
      mine: { ok: true },
      deploy: { ok: true },
      new_run: { ok: true },
    },
  }
}

/** A driver with the hook installed on it, frozen so animation cannot leak in. */
function hooked(): { hook: ClockHook; frame: () => string } {
  const driver = createFixtureDriver(run())
  driver.start()
  const hook = installClockHook(driver)
  return { hook, frame: () => serializeFrame(driver.frame()) }
}

beforeEach(() => {
  freezeAnimations()
})

describe('[u11#c11] the sim-clock hook exists on the test-hooks surface', () => {
  it('(a) test-hooks exports installClockHook and a ClockHook with seed/advance/at', () => {
    expect(typeof installClockHook, 'installClockHook is not exported by test-hooks.ts').toBe('function')
    const { hook } = hooked()
    expect(typeof hook.seed).toBe('function')
    expect(typeof hook.advance).toBe('function')
    expect(typeof hook.at).toBe('function')
  })

  it('(b) seeding pins the clock to the stamp it was given', () => {
    const { hook } = hooked()
    hook.seed('17:33')
    expect(hook.at()).toBe('17:33')
    hook.seed('21:04')
    expect(hook.at()).toBe('21:04')
  })

  it('(c) advancing moves the sim clock by the ported pacing, not by wall time', () => {
    const { hook } = hooked()
    hook.seed('13:05')
    hook.advance(MS_PER_SIM_MIN * 10)
    expect(hook.at()).toBe('13:15')
  })

  it('(d) the hook is retrievable for an already-hooked driver (idempotent install)', () => {
    const driver = createFixtureDriver(run())
    driver.start()
    const first = installClockHook(driver)
    const second = clockHookOf(driver)
    expect(second, 'clockHookOf does not answer the installed hook').toBeTruthy()
    first.seed('19:00')
    expect(second!.at()).toBe('19:00')
  })
})

describe('[u11#c11] same seed + same advance ⇒ same frame', () => {
  it('(e) two drivers seeded and advanced identically serialise byte for byte', () => {
    const a = hooked()
    const b = hooked()
    for (const h of [a, b]) {
      h.hook.seed('13:05')
      h.hook.advance(MS_PER_SIM_MIN * 60)
      h.hook.advance(MS_PER_SIM_MIN * 60)
    }
    expect(a.frame()).toBe(b.frame())
  })

  it('(f) the same sim minute reached by different real-time paths is the same frame', () => {
    const a = hooked()
    const b = hooked()
    a.hook.seed('13:05')
    a.hook.advance(MS_PER_SIM_MIN * 120)
    b.hook.seed('13:05')
    for (let i = 0; i < 120; i += 1) b.hook.advance(MS_PER_SIM_MIN)
    expect(a.hook.at()).toBe(b.hook.at())
    expect(a.frame()).toBe(b.frame())
  })

  it('(g) a DIFFERENT seed is a different frame — the hook is not a no-op', () => {
    const a = hooked()
    const b = hooked()
    a.hook.seed('13:05')
    a.hook.advance(MS_PER_SIM_MIN * 5)
    b.hook.seed('20:00')
    b.hook.advance(MS_PER_SIM_MIN * 5)
    expect(a.hook.at()).not.toBe(b.hook.at())
    expect(a.frame()).not.toBe(b.frame())
  })

  it('(h) seeding to the terminal minute closes the run — the TALLY capture key', () => {
    const { hook, frame } = hooked()
    hook.seed(END)
    hook.advance(MS_PER_SIM_MIN)
    expect(hook.at()).toBe(END)
    expect(frame(), 'seeding to 21:04 did not close the run').toContain('run_end')
  })

  it('(i) a thawed animation cannot change a seeded frame', () => {
    const a = hooked()
    a.hook.seed('15:00')
    const frozen = a.frame()
    thawAnimations()
    const b = hooked()
    b.hook.seed('15:00')
    expect(b.frame()).toBe(frozen)
    freezeAnimations()
  })
})

describe('[u11#c11] inv 11 — the hook is DEV/TEST only at the source', () => {
  it('(j) every boot-side call site sits behind an import.meta.env.DEV guard', () => {
    const source = fs.readFileSync(BOOT, 'utf8')
    expect(
      source.includes('installClockHook'),
      'boot.ts never installs the clock hook, so `window.__shell.clock` cannot exist',
    ).toBe(true)
    const lines = source.split('\n')
    const offenders = lines
      .map((line, i) => ({ line, i }))
      .filter(({ line }) => /installClockHook\s*\(/.test(line))
      .filter(({ i }) => !lines.slice(Math.max(0, i - 3), i + 1).some((l) => l.includes('import.meta.env.DEV')))
      .map(({ i }) => `boot.ts:${i + 1}`)
    expect(offenders, 'an unguarded installClockHook call would ship the hook to players').toEqual([])
  })

  it('(k) the hook exposes itself on `window.__shell`, never on a fresh global', () => {
    const source = fs.readFileSync(BOOT, 'utf8') + fs.readFileSync(HOOKS, 'utf8')
    expect(source).toMatch(/__shell/)
    const strays = [...source.matchAll(/window\.(__[a-zA-Z]+)\s*=/g)]
      .map((m) => m[1]!)
      .filter((name) => !['__shell', '__threads', '__feed', '__tally', '__agentFile', '__debug'].includes(name))
    expect(strays, 'the clock hook minted a new global instead of riding window.__shell').toEqual([])
  })

  it('(l) test-hooks.ts imports nothing from engine or composer (inv 12 / C8)', () => {
    const source = fs.readFileSync(HOOKS, 'utf8')
    const specifiers = [...source.matchAll(/from\s*['"]([^'"]+)['"]/g)].map((m) => m[1]!)
    expect(specifiers.filter((s) => /(engine|composer)/.test(s))).toEqual([])
  })
})

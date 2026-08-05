// [e3] A8 · A9 · D8 — views are snapshots, and the timeline cap is one constant
// that never severs a beat.
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { TIMELINE_CAP_LINES } from '../../../src/engine/beat/caps.ts'
import * as beatIndex from '../../../src/engine/beat/index.ts'
import type { BeatDriver } from '../../../src/engine/beat/driver.ts'
import type { BeatPack } from '../../../src/engine/beat/ports.ts'
import { driveAll, rig } from './harness.ts'
import {
  CHARACTERS,
  REPO,
  TEMPERAMENT,
  ev,
  gate,
  linesPack,
  linesPackWithTrailingGate,
  pack,
  roundPack,
} from './fixtures/packs.ts'

const BEAT_DIR = path.join(REPO, 'src/engine/beat')

function filesUnder(dir: string): string[] {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = path.join(dir, d.name)
    return d.isDirectory() ? filesUnder(p) : [p]
  })
}

/** Every object/array node reachable from both values must be a distinct instance. */
function expectDistinctDeep(a: unknown, b: unknown, at = '$'): void {
  if (a === null || typeof a !== 'object') return
  expect(a, `shared reference at ${at}`).not.toBe(b)
  if (Array.isArray(a)) {
    expect(Array.isArray(b), at).toBe(true)
    a.forEach((v, i) => expectDistinctDeep(v, (b as unknown[])[i], `${at}[${i}]`))
    return
  }
  for (const [k, v] of Object.entries(a as Record<string, unknown>)) {
    expectDistinctDeep(v, (b as Record<string, unknown>)[k], `${at}.${k}`)
  }
}

/** A8 in one place: run it against each of the three views. */
function assertSnapshotContract(get: () => Record<string, unknown>, label: string): void {
  const first = get()
  const second = get()
  expect(first, label).toEqual(second)
  expect(first, label).not.toBe(second)
  expectDistinctDeep(first, second, label)

  // Mutating a returned view neither survives nor reaches the driver.
  for (const [k, v] of Object.entries(first)) {
    if (Array.isArray(v)) (v as unknown[]).push('MUTATED')
    else if (v && typeof v === 'object') (v as Record<string, unknown>).MUTATED = true
    else if (typeof v === 'string') (first as Record<string, unknown>)[k] = 'MUTATED'
  }
  expect(get(), `${label} — mutation leaked back`).toEqual(second)
}

describe('[e3#A8] gateView / beatView / roundView return snapshots', () => {
  it('gateView is a snapshot', () => {
    const r = rig(roundPack())
    assertSnapshotContract(() => r.driver.gateView() as unknown as Record<string, unknown>, 'gateView')
  })

  it('beatView is a snapshot', () => {
    const r = rig(roundPack())
    r.driver.submitStance({ stance: 'a', utterance: 'u' })
    r.driver.applyBeatEffects()
    assertSnapshotContract(() => r.driver.beatView() as unknown as Record<string, unknown>, 'beatView')
  })

  it('roundView is a snapshot', () => {
    const r = rig(roundPack())
    r.driver.submitStance({ stance: 'a', utterance: 'u' })
    r.driver.applyBeatEffects()
    r.driver.advance()
    r.driver.applyBeatEffects()
    assertSnapshotContract(() => r.driver.roundView() as unknown as Record<string, unknown>, 'roundView')
  })

  it('does not hand back the injected assembler s own array (EXPERIENCED is cloned)', () => {
    const r = rig(roundPack())
    r.driver.submitStance({ stance: 'a', utterance: 'u' })
    r.driver.applyBeatEffects()
    r.driver.advance()
    r.driver.applyBeatEffects()
    const view = r.driver.roundView()
    expect(view.EXPERIENCED).toEqual(r.assembler.instanceFor(0))
    expect(view.EXPERIENCED).not.toBe(r.assembler.instanceFor(0))
  })

  it('does not hand back the pack s own objects (STANCE_SET / TEMPERAMENT are cloned)', () => {
    const p = roundPack()
    const r = rig(p)
    const view = r.driver.gateView()
    expect(view.TEMPERAMENT).not.toBe(p.temperament)
    expect(view.TEMPERAMENT.clauses).not.toBe(p.temperament.clauses)
    expect(view.STANCE_SET).not.toBe(p.gates.gates[0]!.stances)
  })

  it('steps() is cloned too — mutating it cannot reach the driver', () => {
    const r = rig(roundPack())
    r.driver.submitStance({ stance: 'a', utterance: 'u' })
    const first = r.driver.steps()
    expect(first).not.toBe(r.driver.steps())
    first.length = 0
    expect(r.driver.steps().length).toBeGreaterThan(0)
  })
})

describe('[e3#D8] TEMPERAMENT is the same VALUE in gateView and roundView, not the same reference', () => {
  it('deep-equals across the two views but shares no reference', () => {
    const r = rig(roundPack())
    const fromGate = r.driver.gateView().TEMPERAMENT
    r.driver.submitStance({ stance: 'a', utterance: 'u' })
    r.driver.applyBeatEffects()
    r.driver.advance()
    r.driver.applyBeatEffects()
    const fromRound = r.driver.roundView().TEMPERAMENT

    expect(fromGate).toEqual(TEMPERAMENT)
    expect(fromRound).toEqual(fromGate)
    expect(fromRound).not.toBe(fromGate)
    expect(fromRound.clauses).not.toBe(fromGate.clauses)
  })
})

describe('[e3#D2/D3] Call-2 slots on a gate beat', () => {
  it('takes FIXED_NPC_ACTION and PRESENT_NPCS from the absorbed event (D2)', () => {
    const r = rig(roundPack())
    r.driver.submitStance({ stance: 'a', utterance: 'u' })
    r.driver.applyBeatEffects()
    const view = r.driver.beatView()
    expect(view.FIXED_NPC_ACTION).toBe('gate-beat-text')
    expect(view.PRESENT_NPCS).toEqual([{ id: 'c1', name: CHARACTERS.characters[0]!.name, side: 'line' }])
  })

  it('falls back to the gate scene with an empty roster when nothing is co-timed (D3)', () => {
    const p: BeatPack = pack([ev('s0', '08:00')], [gate('G7', '09:00', { scene: 'G7-scene' })])
    const r = rig(p)
    r.driver.applyBeatEffects()
    r.driver.advance()
    r.driver.submitStance({ stance: 'a', utterance: 'u' })
    r.driver.applyBeatEffects()
    const view = r.driver.beatView()
    expect(view.FIXED_NPC_ACTION).toBe('G7-scene')
    expect(view.PRESENT_NPCS).toEqual([])
  })

  it('carries the gate question and stance set into GateView', () => {
    const r = rig(roundPack())
    const view = r.driver.gateView()
    expect(view.GATE_QUESTION).toBe('G1-question')
    expect(view.STANCE_SET).toEqual([
      { id: 'a', label: 'A' },
      { id: 'b', label: 'B' },
    ])
  })
})

describe('[e3#A9] the cap is one constant and never severs a beat', () => {
  it('exports TIMELINE_CAP_LINES = 6 from caps.ts', () => {
    expect(TIMELINE_CAP_LINES).toBe(6)
  })

  it('re-exports it from index.ts', () => {
    expect((beatIndex as Record<string, unknown>).TIMELINE_CAP_LINES).toBe(6)
  })

  it('holds the literal in exactly one file under src/engine/beat/ (design D-G)', () => {
    const files = filesUnder(BEAT_DIR).filter((f) => f.endsWith('.ts'))
    expect(files.length, 'src/engine/beat/ is empty').toBeGreaterThan(0)
    const holders = files.filter((f) => fs.readFileSync(f, 'utf8').includes('6'))
    expect(holders.map((f) => path.relative(BEAT_DIR, f))).toEqual(['caps.ts'])
  })
})

/** Collect the TIMELINE_TAIL each beat sees, then feed that beat its own lines. */
function tailsFor(linesPerBeat: string[][]): string[][] {
  const r = rig(linesPack(linesPerBeat.length))
  const seen: string[][] = []
  driveAll(r, (driver: BeatDriver, beat) => {
    seen.push(driver.beatView().TIMELINE_TAIL)
    driver.recordLines(linesPerBeat[beat.index]!)
  })
  return seen
}

describe('[e3#A9] windowing drops whole oldest beats', () => {
  it('accumulates up to the cap, then drops the oldest beat whole', () => {
    const seen = tailsFor([
      ['a1', 'a2'],
      ['b1', 'b2'],
      ['c1', 'c2'],
      ['d1', 'd2'],
      ['e1', 'e2'],
    ])
    expect(seen[0]).toEqual([])
    expect(seen[1]).toEqual(['a1', 'a2'])
    expect(seen[2]).toEqual(['a1', 'a2', 'b1', 'b2'])
    expect(seen[3]).toEqual(['a1', 'a2', 'b1', 'b2', 'c1', 'c2'])
    expect(seen[4]).toEqual(['b1', 'b2', 'c1', 'c2', 'd1', 'd2'])
  })

  it('never emits a severed beat — a 5-line beat is dropped whole rather than trimmed to 3', () => {
    const seen = tailsFor([
      ['a1', 'a2', 'a3', 'a4', 'a5'],
      ['b1', 'b2', 'b3'],
      [],
    ])
    expect(seen[1]).toEqual(['a1', 'a2', 'a3', 'a4', 'a5'])
    expect(seen[2]).toEqual(['b1', 'b2', 'b3'])
  })

  it('emits a beat that alone exceeds the cap whole', () => {
    const big = ['x1', 'x2', 'x3', 'x4', 'x5', 'x6', 'x7']
    const seen = tailsFor([big, ['y1', 'y2'], []])
    expect(seen[1]).toEqual(big)
    expect(seen[1]!.length).toBeGreaterThan(TIMELINE_CAP_LINES)
    expect(seen[2]).toEqual(['y1', 'y2'])
  })

  it('applies the same windowing to TIMELINE_EXCERPT on a gate beat', () => {
    const r = rig(linesPackWithTrailingGate(5))
    const excerpts: string[][] = []
    driveAll(
      r,
      (driver, beat) => {
        driver.recordLines([`n${beat.index}a`, `n${beat.index}b`])
      },
      (driver, beat) => {
        if (beat.kind === 'gate') excerpts.push(driver.gateView().TIMELINE_EXCERPT)
      },
    )
    expect(excerpts).toEqual([['n1a', 'n1b', 'n2a', 'n2b', 'n3a', 'n3b']])
  })

  it('recordLines outside the narration phase throws', () => {
    const r = rig(roundPack())
    expect(() => r.driver.recordLines(['x'])).toThrow()
  })
})

// [e3#A11] — a gate may declare its own timeline window.
//
// What the agent knows at a gate is game logic, so it is authored on the gate
// card (`planning/research/gate-excerpt-design.md`) instead of falling out of
// the prompt-budget cap. These tests pin the four things that makes true: the
// declared rows replace the narrated window, each row's exposure condition
// still decides whether THIS run sees it, an id that names nothing costs one
// row rather than the run, and the view is still a snapshot.
//
// A11 is the next free number in this suite's e3 acceptance series (A1–A10).
// The fallback is pinned elsewhere and stays pinned: views.test.ts's
// "applies the same windowing to TIMELINE_EXCERPT on a gate beat" drives a gate
// that declares no `excerpt`, and must keep passing untouched.
import { describe, it, expect } from 'vitest'
import type { BeatPack } from '../../../src/engine/beat/ports.ts'
import { assertSnapshotContract, driveAll, rig } from './harness.ts'
import { ev, excerptPack, gate, pack } from './fixtures/packs.ts'

/**
 * Drive the whole pack, giving every beat two narrated lines of its own, and
 * collect the `TIMELINE_EXCERPT` each gate beat saw.
 *
 * The lines are recorded AFTER the view is read (`driveAll` runs `beforeBeat`
 * first), exactly as a live run does — so a gate beat's window is made of the
 * beats before it, which is what makes the fallback and the declared window
 * distinguishable at all.
 */
function windowsSeen(p: BeatPack, seed: Record<string, number | boolean> = {}): string[][] {
  const r = rig(p, seed)
  const seen: string[][] = []
  driveAll(
    r,
    (driver, beat) => {
      driver.recordLines([`n${beat.index}a`, `n${beat.index}b`])
    },
    (driver, beat) => {
      if (beat.kind === 'gate') seen.push(driver.gateView().TIMELINE_EXCERPT)
    },
  )
  return seen
}

describe('[e3#A11] a declared excerpt replaces the narrated window', () => {
  it("hands back the named rows' text, in the order the card names them", () => {
    // `t4` before `t1` — the card's order, not the timeline's.
    expect(windowsSeen(excerptPack(['t4', 't1']))).toEqual([['t4-authored', 't1-authored']])
  })

  it('drops the narrated lines the fallback would have shown', () => {
    const declared = windowsSeen(excerptPack(['t1']))[0]!
    const fallback = windowsSeen(excerptPack())[0]!

    // The control proves these lines were on offer: the same day, same beats,
    // one gate card without `excerpt`.
    expect(fallback).toEqual(['n0a', 'n0b', 'n1a', 'n1b', 'n2a', 'n2b'])
    for (const line of fallback) expect(declared).not.toContain(line)
    expect(declared).toEqual(['t1-authored'])
  })
})

describe("[e3#A11] the rows' exposure conditions still decide what this run sees", () => {
  // `t2` asks for `opened`; `t3` carries un-hardened prose.
  const ids = ['t1', 't2', 't3']

  it('drops a row whose condition does not hold on this run', () => {
    expect(windowsSeen(excerptPack(ids))).toEqual([['t1-authored', 't3-authored']])
  })

  it('keeps it on a run where the condition holds', () => {
    expect(windowsSeen(excerptPack(ids), { opened: true })).toEqual([
      ['t1-authored', 't2-authored', 't3-authored'],
    ])
  })

  it('keeps a row whose condition is prose no grammar can parse', () => {
    // Un-hardened prose shows the line, it does not delete it — reading it as
    // `false` would silently remove an authored row from the gate's prompt.
    for (const window of [windowsSeen(excerptPack(['t3'])), windowsSeen(excerptPack(['t3']), { opened: true })]) {
      expect(window).toEqual([['t3-authored']])
    }
  })
})

describe('[e3#A11] an id that names no row costs one row, not the run', () => {
  it('skips the unknown id and keeps the rest, in order', () => {
    expect(() => windowsSeen(excerptPack(['t1', 't99', 't4']))).not.toThrow()
    expect(windowsSeen(excerptPack(['t1', 't99', 't4']))).toEqual([['t1-authored', 't4-authored']])
  })

  it('stays on the declared path even when every id misses — a declared window is never the fallback', () => {
    expect(windowsSeen(excerptPack(['t98', 't99']))).toEqual([[]])
  })
})

describe('[e3#A11/A8] gateView is still a snapshot on an excerpt gate', () => {
  it('returns equal-but-distinct views that no caller can mutate', () => {
    const p = pack([ev('t1', '09:00', { text: 't1-authored' })], [gate('G1', '09:00', { excerpt: ['t1'] })])
    const r = rig(p)
    expect(r.driver.gateView().TIMELINE_EXCERPT).toEqual(['t1-authored'])
    assertSnapshotContract(() => r.driver.gateView() as unknown as Record<string, unknown>, 'gateView')
  })
})

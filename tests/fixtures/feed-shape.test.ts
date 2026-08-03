// [u2f#c4] — spec-client §7 #2: the stream renders in beat order with ≤3 symptom
// lines per beat, an empty symptom set present at least once (so `(변화 없음)` is
// reachable), and NO DIGIT in any `npc` or `symptom` line text (inv 2 — the NPC
// state and the symptoms are shown, never numbered).
import { describe, it, expect } from 'vitest'
import { beatsOf, feedLines, minutes, orphanFeedLines } from './fixture-utils.ts'
import { woodariRun03 } from '../../src/client/driver/fixtures/index.ts'

const events = () => woodariRun03.events

describe('[u2f#c4] beat structure', () => {
  it('(a) beat_start / beat_end are paired and never nested', () => {
    expect(() => beatsOf(events())).not.toThrow()
    expect(beatsOf(events()).length).toBeGreaterThan(1)
  })

  it('(b) beat numbers strictly increase across the run', () => {
    const nums = beatsOf(events()).map((b) => b.beat)
    const increasing = nums.every((n, i) => i === 0 || n > (nums[i - 1] as number))
    expect({ nums, increasing }).toEqual({ nums, increasing: true })
  })

  it('(c) clocks never move backwards across the stream', () => {
    const stamps: { at: string; clock: string }[] = []
    for (const e of events()) {
      if (e.type === 'beat_start' || e.type === 'beat_end') stamps.push({ at: e.type, clock: e.clock })
      else if (e.type === 'feed') stamps.push({ at: `feed ${e.line.kind}`, clock: e.line.clock })
    }
    const back = stamps.filter(
      (s, i) => i > 0 && minutes(s.clock) < minutes((stamps[i - 1] as { clock: string }).clock),
    )
    expect(back).toEqual([])
  })

  it('(d) a beat opens on its first line and closes on its last', () => {
    const bad: string[] = []
    for (const b of beatsOf(events())) {
      if (b.lines.length === 0) continue
      const first = (b.lines[0] as { clock: string }).clock
      const last = (b.lines[b.lines.length - 1] as { clock: string }).clock
      if (b.start !== first) bad.push(`beat ${b.beat}: start ${b.start} ≠ first line ${first}`)
      if (b.end !== last) bad.push(`beat ${b.beat}: end ${b.end} ≠ last line ${last}`)
    }
    expect(bad).toEqual([])
  })

  it('(e) every feed line sits inside a beat', () => {
    expect(orphanFeedLines(events()).map((l) => `${l.clock} ${l.kind}`)).toEqual([])
  })
})

describe('[u2f#c4] symptoms per beat', () => {
  it('(f) no beat carries more than three symptom lines', () => {
    const over = beatsOf(events())
      .map((b) => ({ beat: b.beat, n: b.lines.filter((l) => l.kind === 'symptom').length }))
      .filter((b) => b.n > 3)
    expect(over).toEqual([])
  })

  it('(g) at least one beat carries no symptom line at all — the `(변화 없음)` case', () => {
    const empty = beatsOf(events()).filter(
      (b) => b.lines.filter((l) => l.kind === 'symptom').length === 0,
    )
    expect(empty.length).toBeGreaterThan(0)
  })
})

describe('[u2f#c4] no digit for NPC state (inv 2)', () => {
  it('(h) no `npc` line text contains a digit', () => {
    const bad = feedLines(events())
      .filter((l) => l.kind === 'npc' && /[0-9]/.test(l.text))
      .map((l) => `${l.clock}: ${l.text}`)
    expect(bad).toEqual([])
  })

  it('(i) no `symptom` line text contains a digit', () => {
    const bad = feedLines(events())
      .filter((l) => l.kind === 'symptom' && /[0-9]/.test(l.text))
      .map((l) => `${l.clock}: ${l.text}`)
    expect(bad).toEqual([])
  })

  it('(j) every `npc` line names its speaker', () => {
    const bad = feedLines(events())
      .filter((l) => l.kind === 'npc' && !l.speaker)
      .map((l) => l.clock)
    expect(bad).toEqual([])
  })
})

describe('[u2f#c4] stream well-formedness', () => {
  it('(k) every `waiting` open is closed, and the stream ends unblocked', () => {
    let open = 0
    const bad: string[] = []
    for (const e of events()) {
      if (e.type !== 'waiting') continue
      if (e.active) {
        if (open > 0) bad.push(`nested waiting(${e.for})`)
        open += 1
      } else {
        if (open === 0) bad.push(`waiting(${e.for}) closed while none open`)
        else open -= 1
      }
    }
    expect(bad).toEqual([])
    expect(open).toBe(0)
  })

  it('(l) the canned op set answers every player op the driver may issue', () => {
    expect(Object.keys(woodariRun03.responses).sort()).toEqual([
      'deploy',
      'mine',
      'new_run',
      'slot',
      'unslot',
    ])
  })

  it('(m) `run_end` is the last event of the stream', () => {
    const last = events()[events().length - 1]
    expect(last?.type).toBe('run_end')
  })
})

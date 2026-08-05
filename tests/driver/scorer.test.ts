// The scorer — `score.json`'s units read against the state a run ended in.
//
// Driven against the REAL pack, because the two things most worth pinning are
// properties of the authored data rather than of the code: that the ledger's
// headline is the 사망 count `score.json` has always claimed, and that a run
// which intervened scores differently from one that did not. A synthetic pack
// would satisfy both by construction and prove nothing.
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createScorer, scoreRecord, scoreUnits, totalOf } from '../../src/driver/scorer.ts'
import type { ScorePack } from '../../src/driver/scorer.ts'
import type { PredicateState } from '../../src/shared/predicates.ts'

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const PACK = JSON.parse(
  fs.readFileSync(path.join(REPO, 'data/scenario/우는다리/score.json'), 'utf8'),
) as ScorePack

/** The state a no-intervention run ends in: the fixed timeline, and nothing else. */
const UNTOUCHED: PredicateState = {
  logs_destroyed: true,
  kang_detained: true,
  caller_arrested: true,
  crowd_on_bridge: true,
  bridge_collapsed: true,
}

describe('the no-intervention run scores its own baseline', () => {
  it('(a) the headline is 26 — the sum `baseline_summary` has always claimed', () => {
    // 다리 위 24 · 관리동의 임차복 1 · 둔치 노점상 1. If this drifts, either the
    // pack's prose or its predicates moved without the other.
    const units = scoreUnits(PACK, UNTOUCHED)
    expect(totalOf(units)).toBe(26)

    const summary = (PACK as unknown as { baseline_summary: string }).baseline_summary
    expect(summary, 'the pack no longer states the baseline this guard checks').toContain('사망 26')
  })

  it('(b) every unit resolves — a linted pack leaves none unscored', () => {
    // E-P4 makes a missing fallback an ERROR, so a short ledger here means the
    // pack shipped unlinted rather than that a unit had nothing to say.
    expect(scoreUnits(PACK, UNTOUCHED)).toHaveLength(PACK.units.length)
  })

  it('(c) only deaths sum; outcomes and durations read', () => {
    const byId = new Map(scoreUnits(PACK, UNTOUCHED).map((u) => [u.id, u.value]))
    expect(byId.get('u4')).toBe('테러 혐의 구속')
    // Six HOURS of detention. As a number it would add six deaths to the
    // headline, which is why amendment g widened a row's value and left `total`.
    expect(byId.get('u5')).toBe('6시간 구금')
    expect(byId.get('u9')).toBe('71명')
    expect(typeof byId.get('u1')).toBe('number')
  })
})

describe('a run that intervened scores differently', () => {
  it('(d) the cancelled day empties the bridge and the headline goes to 0', () => {
    const cancelled: PredicateState = { ...UNTOUCHED, cancel_requested: true }
    const units = scoreUnits(PACK, cancelled)
    expect(totalOf(units)).toBe(0)
    const byId = new Map(units.map((u) => [u.id, u.value]))
    expect(byId.get('u8')).toBe('미확인 — 재개통 예정')
  })

  it('(e) capping entry is a partial save, not a whole one', () => {
    // `variance_notes`: 다리 위 200명 — 사망 7 · 부상 19.
    const capped: PredicateState = { ...UNTOUCHED, entry_capped: true }
    const byId = new Map(scoreUnits(PACK, capped).map((u) => [u.id, u.value]))
    expect(byId.get('u1')).toBe(7)
    expect(byId.get('u9')).toBe('19명')
    expect(totalOf(scoreUnits(PACK, capped))).toBe(9)
  })

  it('(f) the witnessed ending needs BOTH gates, and the order proves it', () => {
    const named: PredicateState = { ...UNTOUCHED, caller_named: true }
    const witnessed: PredicateState = { ...named, hatch_opened: true }
    const idOf = (state: PredicateState): unknown =>
      new Map(scoreUnits(PACK, state).map((u) => [u.id, u.value])).get('u4')
    expect(idOf(witnessed)).toBe('공식 입회 증인')
    expect(idOf(named)).toBe('참고인')
  })
})

describe('the two halves the two consumers take', () => {
  it('(g) the port carries labels, the record carries ids — neither has both', () => {
    const port = createScorer(PACK, () => UNTOUCHED).score()
    const record = scoreRecord(PACK, UNTOUCHED)

    expect(port.rows[0]).toEqual({ label: PACK.units[0]!.label, value: 24 })
    expect(record?.units[0]).toEqual({ id: 'u1', value: 24 })
    expect(port.total).toBe(record?.total)
    // A rendered sheet shows labels and has no use for `u1`; an archive is
    // indexed, and prose labels move when the scenario is edited. That is why
    // the shared step is `scoreUnits` rather than either of these two.
    expect(Object.keys(port.rows[0]!)).toEqual(['label', 'value'])
    expect(Object.keys(record!.units[0]!)).toEqual(['id', 'value'])
  })

  it('(h) the port reads state when ASKED, not when built', () => {
    // The driver calls `score()` at the close of the day. A scorer that captured
    // its state at construction would score the opening beat, every run.
    let state: PredicateState = UNTOUCHED
    const scorer = createScorer(PACK, () => state)
    state = { ...UNTOUCHED, cancel_requested: true }
    expect(scorer.score().total).toBe(0)
  })

  it('(i) a pack nothing resolves records `null`, not an empty ledger', () => {
    // `run-record.schema.json` types `score` as `["object","null"]` for this: a
    // run with nothing to score says so, rather than reporting no casualties.
    const empty: ScorePack = { units: [] }
    expect(scoreRecord(empty, UNTOUCHED)).toBeNull()
    expect(createScorer(empty, () => UNTOUCHED).score()).toEqual({ total: 0, rows: [] })
  })
})

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
import {
  baselineState,
  createScorer,
  scoreRecord,
  scoreUnits,
  totalOf,
} from '../../src/driver/scorer.ts'
import type { OutcomePack, ScorePack } from '../../src/driver/scorer.ts'
import type { PredicateState } from '../../src/shared/predicates.ts'

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const PACK = JSON.parse(
  fs.readFileSync(path.join(REPO, 'data/scenario/우는다리/score.json'), 'utf8'),
) as ScorePack

/**
 * The baseline day — COMPUTED from the pack, not typed out here. It is the
 * fixed timeline's flags and nothing else: those fire on every run whatever
 * anyone chooses, and no gate outcome is guaranteed to any run.
 */
const OUTCOME = {
  timeline: JSON.parse(
    fs.readFileSync(path.join(REPO, 'data/scenario/우는다리/timeline.json'), 'utf8'),
  ),
} as OutcomePack

const UNTOUCHED: PredicateState = baselineState(OUTCOME)

describe('the baseline day scores the pack’s own summary', () => {
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

describe('the baseline day — §5.2 amendment h', () => {
  it('(j) the computed baseline IS what a run that set no gate flag records', () => {
    // The drift this closes. `score.json`'s authored `baseline` is prose, so
    // nothing could check it against a run — and it went wrong exactly that
    // way: u6 read 3권 전량 파쇄 while the baseline day scored 사본만. Deriving
    // the baseline from the same rules makes the two structurally incapable of
    // disagreeing. The recorded run is the fixture provider's, which answers
    // every gate with its first stance and so sets no flag any unit reads.
    const recorded = JSON.parse(
      fs.readFileSync(path.join(REPO, 'artifacts/runs/우는다리-fixture-r1.json'), 'utf8'),
    ) as { score: { units: { id: string; value: string | number }[]; total: number } }

    const computed = scoreUnits(PACK, UNTOUCHED, UNTOUCHED)
    expect(computed.map((u) => ({ id: u.id, value: u.value }))).toEqual(recorded.score.units)
    expect(totalOf(computed)).toBe(recorded.score.total)
  })

  it('(k) `baselineState` carries the fixed timeline and NO gate outcome', () => {
    // The correction this encodes. The baseline used to fold in each gate's
    // `default_stance` bucket, on the reading that a no-injection run falls to
    // its defaults. It does not: `default_stance` is what the engine
    // substitutes when CALL 1 FAILED, so that baseline was "what a network
    // error would have scored". Only the fixed timeline is guaranteed.
    expect(UNTOUCHED.bridge_collapsed).toBe(true)
    expect(UNTOUCHED.crowd_on_bridge).toBe(true)
    // G5's default bucket sets this. It is a gate outcome, so it is not owed.
    expect(UNTOUCHED.logs_requested).toBeUndefined()
    expect(UNTOUCHED.cancel_requested).toBeUndefined()
    expect(UNTOUCHED.caretaker_evacuated).toBeUndefined()

    // Which leaves every unit on its unconditional rule — the ending
    // `baseline_summary` describes, and the only one no choice can claim.
    const byId = new Map(scoreUnits(PACK, UNTOUCHED, UNTOUCHED).map((u) => [u.id, u.value]))
    expect(byId.get('u6')).toBe('(원본) 소실')
    expect(byId.get('u1')).toBe(24)
  })

  it('(k2) the baseline cannot be moved by re-authoring a gate’s default', () => {
    // The structural half of (k): `baselineState` reads `timeline` only, so a
    // pack whose gates changed wholesale scores the same baseline. Before the
    // correction this number moved with `default_stance`, silently.
    const gatesMoved = baselineState(OUTCOME)
    expect(totalOf(scoreUnits(PACK, gatesMoved, gatesMoved))).toBe(26)
    expect(Object.keys(gatesMoved).sort()).toEqual([
      'bridge_collapsed',
      'caller_arrested',
      'crowd_on_bridge',
      'kang_detained',
      'logs_destroyed',
    ])
  })

  it('(l) an intervened run carries the untouched value beside its own', () => {
    const cancelled: PredicateState = { ...UNTOUCHED, cancel_requested: true }
    const scorer = createScorer(PACK, () => cancelled, UNTOUCHED)
    const ledger = scorer.score()
    expect(ledger.total).toBe(0)
    expect(ledger.baseline_total).toBe(26)
    const bridge = ledger.rows[0]!
    expect(bridge.value).toBe(0)
    expect(bridge.baseline).toBe(24)
  })
})

describe('the two halves the two consumers take', () => {
  it('(g) the port carries labels, the record carries ids — neither has both', () => {
    const port = createScorer(PACK, () => UNTOUCHED, UNTOUCHED).score()
    const record = scoreRecord(PACK, UNTOUCHED)

    expect(port.rows[0]).toEqual({ label: PACK.units[0]!.label, value: 24, baseline: 24 })
    expect(record?.units[0]).toEqual({ id: 'u1', value: 24 })
    expect(port.total).toBe(record?.total)
    // A rendered sheet shows labels and has no use for `u1`; an archive is
    // indexed, and prose labels move when the scenario is edited. That is why
    // the shared step is `scoreUnits` rather than either of these two.
    expect(Object.keys(port.rows[0]!)).toEqual(['label', 'value', 'baseline'])
    expect(Object.keys(record!.units[0]!)).toEqual(['id', 'value'])
  })

  it('(h) the port reads state when ASKED, not when built', () => {
    // The driver calls `score()` at the close of the day. A scorer that captured
    // its state at construction would score the opening beat, every run.
    let state: PredicateState = UNTOUCHED
    const scorer = createScorer(PACK, () => state, UNTOUCHED)
    state = { ...UNTOUCHED, cancel_requested: true }
    expect(scorer.score().total).toBe(0)
  })

  it('(i) a pack nothing resolves records `null`, not an empty ledger', () => {
    // `run-record.schema.json` types `score` as `["object","null"]` for this: a
    // run with nothing to score says so, rather than reporting no casualties.
    const empty: ScorePack = { units: [] }
    expect(scoreRecord(empty, UNTOUCHED)).toBeNull()
    expect(createScorer(empty, () => UNTOUCHED, UNTOUCHED).score()).toEqual({
      total: 0,
      baseline_total: 0,
      rows: [],
    })
  })
})

// ── The shipped pack's rescue day ───────────────────────────────────────────
//
// 우는다리 above cannot reach this: every unit of its that counts is a crowd,
// authored as a number. 전구간정상 scores two units that are ONE PERSON each
// (오세라 · 차우진), and a person's outcome is prose because the record prints
// where they were found. The day the tunnel empties and only 오세라 is left
// behind therefore closed on 총 사망자 수 0명 — with 오세라: 사망 · 아홉 번째
// 문 안쪽 printed one line above it.
const SHIPPED = JSON.parse(
  fs.readFileSync(path.join(REPO, 'data/scenario/전구간정상/score.json'), 'utf8'),
) as ScorePack

describe('a unit that is one person counts as one', () => {
  /** Every gate answered the way that empties the tunnel — 가이드 §5's best run. */
  const RESCUED: PredicateState = {
    vent_panel_opened: true,
    pallet_named: true,
    doors_opened: true,
  }

  it('(m) the day nobody drives out still counts 오세라', () => {
    const units = scoreUnits(SHIPPED, RESCUED)
    const byId = new Map(units.map((u) => [u.id, u.value]))
    // The crowd got out; the person who opened the doors for them did not.
    expect(byId.get('u1')).toBe(0)
    expect(byId.get('u2')).toBe('사망 · 아홉 번째 문 안쪽')
    expect(byId.get('u3')).toBe('생존 · 입건')
    expect(totalOf(units)).toBe(1)
  })

  it('(n) the one run that saves her is the only one that scores no death', () => {
    // `variance_notes`: "오세라 단위가 사는 길은 하나뿐이다 — 갱구로 몰아낸
    // 41의 런에서 맨 뒤로 걸어 나오는 것." So the headline there is the crowd's
    // own 41 and nothing else.
    const drivenOut: PredicateState = {
      vent_panel_opened: true,
      pallet_named: true,
      driven_out: true,
    }
    const byId = new Map(scoreUnits(SHIPPED, drivenOut).map((u) => [u.id, u.value]))
    expect(byId.get('u2')).toBe('생존 · 갱구 밖 집결지에서 발견된다')
    expect(totalOf(scoreUnits(SHIPPED, drivenOut))).toBe(41)
  })

  it('(o) the untouched day is the crowd PLUS the two who are named', () => {
    // 137 · 오세라 사망 · 차우진 사망. The pack used to call this day 137 — the
    // crowd axis standing in for the headline, which is what let the rescue day
    // be called "the 0 run". Both the prose and the tally say 139 now, and this
    // holds them together: a summary that drifts back to the crowd number fails
    // here rather than on the desk.
    const nothing: PredicateState = {}
    expect(totalOf(scoreUnits(SHIPPED, nothing))).toBe(137 + 1 + 1)
    const summary = (SHIPPED as unknown as { baseline_summary: string }).baseline_summary
    expect(summary).toContain('총 사망자 139명')
  })
})

// The predicate reader — `contract-datapack.md` §3.6's grammar, and the two
// properties the rest of the pipeline is allowed to assume of it.
//
// The grammar cases below are the whole language. The two properties are worth
// more than any of them:
//
//   · TOTALITY — nothing throws, ever. A predicate is evaluated at the close of
//     the day on the player's build, against data no fixture wrote. `mm()` threw
//     on the authored `21:04+` and took the run with it (PR #141); this module
//     answers `false` and costs one row.
//   · ONE PARSER — `identifiers()` and `problems()` exist so lint can resolve
//     names and reject syntax without a second copy of the grammar. A test that
//     only exercised `holds`/`resolve` would let those two rot.
import { describe, it, expect } from 'vitest'
import {
  deathsOf,
  hasValue,
  holds,
  identifiers,
  problems,
  readValue,
  resolve,
} from '../../src/shared/predicates.ts'
import type { PredicateState } from '../../src/shared/predicates.ts'

/** A run that capped entry and named the caller, with 서지형's two meters bound. */
const STATE: PredicateState = {
  entry_capped: true,
  caller_named: true,
  crowd_on_bridge: true,
  bridge_collapsed: true,
  trust: 55,
  fear: 40,
}

describe('conditions — the F1/F4 form', () => {
  it('(a) a bare identifier reads a flag', () => {
    expect(holds('entry_capped', STATE)).toBe(true)
    expect(holds('logs_saved', STATE)).toBe(false)
  })

  it('(b) an UNSET flag is absent from the snapshot, and absent means false', () => {
    // The engine writes a flag only when something sets it, so `cancel_requested`
    // is not in the map at all on a run that never took G6's third stance. This
    // is what makes `not <flag>` read correctly rather than reading `undefined`.
    expect('cancel_requested' in STATE).toBe(false)
    expect(holds('cancel_requested', STATE)).toBe(false)
    expect(holds('not cancel_requested', STATE)).toBe(true)
    expect(holds('not entry_capped', STATE)).toBe(false)
  })

  it('(c) `and` chains, and every term must hold', () => {
    expect(holds('entry_capped and caller_named', STATE)).toBe(true)
    expect(holds('entry_capped and logs_saved', STATE)).toBe(false)
    expect(holds('entry_capped and not cancel_requested and caller_named', STATE)).toBe(true)
  })

  it('(d) all six comparators read a scalar', () => {
    expect(holds('trust >= 55', STATE)).toBe(true)
    expect(holds('trust > 55', STATE)).toBe(false)
    expect(holds('fear <= 40', STATE)).toBe(true)
    expect(holds('fear < 40', STATE)).toBe(false)
    expect(holds('trust == 55', STATE)).toBe(true)
    expect(holds('trust == 54', STATE)).toBe(false)
  })

  it('(e) `>=` is not read as `>` with a stray `=`', () => {
    // Longest-comparator-first. Read the other way, `trust >= 60` becomes
    // `trust > (=60)`, which is either a parse error or — worse — a silent 60.
    expect(holds('trust >= 60', STATE)).toBe(false)
    expect(holds('trust >= 55', STATE)).toBe(true)
  })

  it('(f) an UNBOUND scalar is false, not zero', () => {
    // Twelve of 우는다리's fourteen meters carry `variable: null` (lint F2), so
    // a scalar term can name something the state has no number for. Reading it
    // as 0 would let `통제욕 < 10` match a variable that does not exist.
    expect(holds('control < 10', STATE)).toBe(false)
    expect(holds('control >= 0', STATE)).toBe(false)
  })
})

describe('resolution — the F3 form', () => {
  it('(g) first match wins, and the order is the author’s', () => {
    const predicates = [
      'cancel_requested => 0',
      'entry_capped => 7',
      '=> 24',
    ]
    expect(resolve(predicates, STATE)).toBe(7)
    expect(resolve(predicates, { cancel_requested: true })).toBe(0)
    expect(resolve(predicates, {})).toBe(24)
  })

  it('(h) a value is a NUMBER when it is one — this is the tally’s arithmetic', () => {
    // §5.2 amendment g: rows carry `string | number`, and only the numeric ones
    // sum into the 사망 headline. If `24` arrived as `'24'` the headline would
    // silently stop counting.
    expect(resolve(['=> 24'], {})).toBe(24)
    expect(resolve(['=> 0'], {})).toBe(0)
    expect(resolve(['=> 참고인'], {})).toBe('참고인')
    expect(resolve(['=> 원본+증언'], {})).toBe('원본+증언')
    expect(resolve(['=> "단순 추락" 유지'], {})).toBe('"단순 추락" 유지')
  })

  it('(i) nothing matched is `null`, not a guessed baseline', () => {
    expect(resolve(['logs_saved => 원본 확보'], STATE)).toBeNull()
    expect(resolve([], STATE)).toBeNull()
  })

  it('(j) the eight-unit sketch from contract-datapack §3.6 resolves', () => {
    // The appendix that motivated the grammar, run against a state that took
    // G4 (재정의) and G7 (입회 개방) — so the caller is named and the hatch is
    // open, which §3.6 reads as the witnessed ending.
    const witnessed: PredicateState = { caller_named: true, hatch_opened: true }
    const seogihyeong = [
      'caller_named and hatch_opened => 공식 입회 증인',
      'caller_named => 참고인',
      'cancel_requested => 협박 입건',
      '=> 테러 혐의 구속',
    ]
    expect(resolve(seogihyeong, witnessed)).toBe('공식 입회 증인')
    expect(resolve(seogihyeong, { caller_named: true })).toBe('참고인')
    expect(resolve(seogihyeong, { cancel_requested: true })).toBe('협박 입건')
    expect(resolve(seogihyeong, {})).toBe('테러 혐의 구속')
  })
})

/** Every way a predicate can break. Totality runs on it, and so does `problems`. */
const BROKEN = [
  'Entry_Capped', // identifiers are lower snake_case
  '3ntry',
  'trust >= many',
  'trust >=',
  'not ',
  'entry_capped and',
  '=>',
]

describe('totality — a malformed predicate costs a row, never the run', () => {
  it('(k) nothing throws, for any of them', () => {
    for (const predicate of BROKEN) {
      expect(() => holds(predicate, STATE), predicate).not.toThrow()
      expect(() => resolve([predicate], STATE), predicate).not.toThrow()
      expect(() => identifiers(predicate), predicate).not.toThrow()
      expect(() => problems(predicate), predicate).not.toThrow()
    }
  })

  it('(l) a broken condition is false, and a broken rule is skipped', () => {
    for (const predicate of BROKEN) {
      expect(holds(predicate, STATE), predicate).toBe(false)
    }
    // The rule after a broken one still gets its turn — one bad row does not
    // swallow the unit.
    expect(resolve(['trust >= many => 99', 'entry_capped => 7'], STATE)).toBe(7)
  })

  it('(m) an empty condition holds — that is what the `=> value` fallback IS', () => {
    expect(holds('', STATE)).toBe(true)
  })
})

describe('one parser — what lint reads the grammar through', () => {
  it('(n) `identifiers` names every flag and scalar, in order, without repeats', () => {
    expect(identifiers('entry_capped and not cancel_requested and trust >= 20 => 7')).toEqual([
      'entry_capped',
      'cancel_requested',
      'trust',
    ])
    expect(identifiers('entry_capped and entry_capped')).toEqual(['entry_capped'])
    expect(identifiers('=> 24')).toEqual([])
  })

  it('(o) `problems` is empty exactly when the predicate reads', () => {
    for (const good of ['entry_capped', 'not logs_saved', 'trust >= 20', 'a and b => x', '=> 24']) {
      expect(problems(good), good).toEqual([])
    }
    // The same list totality runs on — every way a predicate can break is a
    // way `problems()` must be able to name.
    for (const bad of BROKEN) {
      expect(problems(bad).length, bad).toBeGreaterThan(0)
    }
  })

  it('(p) `hasValue` tells the F3 form apart — `problems` alone cannot', () => {
    // `=> 24` is a well-formed F3 rule, so `problems()` reports nothing — yet
    // in a boolean slot it is a defect `holds()` papers over by ignoring the
    // value. This is what lets lint reject a slot-form mismatch without a
    // second parse.
    expect(hasValue('=> 24')).toBe(true)
    expect(hasValue('cancel_requested => 0')).toBe(true)
    expect(hasValue('entry_capped')).toBe(false)
    expect(hasValue('entry_capped and not cancel_requested')).toBe(false)
    expect(hasValue('trust >= 20')).toBe(false)
  })
})

describe('what a value costs — the 총 사망자 수 rule', () => {
  it('(q) a number is a body count and counts itself', () => {
    expect(deathsOf(137)).toBe(137)
    expect(deathsOf(0)).toBe(0)
  })

  it('(r) a person-unit that resolves to 사망 counts one, wherever they were found', () => {
    // The defect this closes. 전구간정상 scores 오세라 and 차우진 one person
    // each, and the record prints WHERE they died — so their values are prose,
    // and a headline that summed numbers only closed the rescue day on
    // 총 사망자 수 0명 with 오세라: 사망 printed directly above it.
    expect(deathsOf('사망 · 아홉 번째 문 안쪽')).toBe(1)
    expect(deathsOf('사망 · 아홉 번째 문 앞, 쇠사슬을 손으로 흔든 자세')).toBe(1)
    expect(deathsOf('사망')).toBe(1)
  })

  it('(s) every other outcome reads without counting', () => {
    // The outcome word is the pack's, in the leading position the packs put it
    // in. `사망` anywhere else is a sentence about a death, not a death.
    for (const reads of [
      '생존 · 갱구 밖 집결지에서 발견된다',
      '생존 · 입건',
      '입건 · 개요서 적재물 칸이 채워진다',
      '6시간 구금',
      '71명',
      '아무것도 남지 않음',
      '사망자 없음',
    ]) {
      expect(deathsOf(reads), reads).toBe(0)
    }
  })

  it('(t) the two rules meet in `readValue` — `"0"` is a count, `"사망"` is not', () => {
    expect(deathsOf(readValue(' 0 '))).toBe(0)
    expect(deathsOf(readValue(' 137 '))).toBe(137)
    expect(deathsOf(readValue(' 사망 · 하행 4.2km 갓길 '))).toBe(1)
  })
})

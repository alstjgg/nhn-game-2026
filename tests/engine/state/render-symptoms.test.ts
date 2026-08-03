// [e2] — `renderSymptoms` (docs/spec-engine.md §2.3, items 1–7).
//
// Every assertion here traces to a numbered item of §2.3 or to the worked
// render in §2.2. The suite is deliberately fixture-heavy: the renderer is a
// lookup function over authored data (§2.2), so the only way to pin its
// *ordering* and its *error* behaviour is to hand it packs that a real
// scenario would never contain.
//
// Two conventions carried from tests/shared/temperament.test.ts: read the real
// pack off disk rather than inlining it (data/scenario/** is frozen), and keep
// the invariant tests honest by also asserting the renderer is a function of
// its input (a constant array would satisfy several of the ordering checks).
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Symptoms } from '../../../src/shared/datapack.ts'
import { renderSymptoms, type DeltaEntry } from '../../../src/engine/state/index.ts'

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')
const PACK = path.join(REPO, 'data/scenario/우는다리')

function readPack(): Symptoms {
  return JSON.parse(fs.readFileSync(path.join(PACK, 'symptoms.json'), 'utf8')) as Symptoms
}

/**
 * `Symptoms` is an intersection (`{flags?}` & `Record<string, {up?,down?}>`),
 * so a plain object literal does not narrow cleanly. Fixtures go through this
 * one cast rather than sprinkling `as` at every call site.
 */
function fixture(o: unknown): Symptoms {
  return o as Symptoms
}

/**
 * A §2.3 hard error, asserted so that an unimplemented stub cannot satisfy it:
 * the throw must come from the renderer's own contract, not from a
 * `throw new Error('unimplemented: …')` body.
 */
function expectHardError(fn: () => unknown): void {
  expect(fn).toThrow()
  try {
    fn()
  } catch (err) {
    expect(String((err as Error).message)).not.toMatch(/unimplemented/)
  }
}

function scalar(variable: string, before: number, after: number, cause = 'G1:a'): DeltaEntry {
  return { variable, before, after, cause }
}

function flag(variable: string, before: boolean, after: boolean, cause = 'event:t12'): DeltaEntry {
  return { variable, before, after, cause }
}

describe('renderSymptoms — §2.2 worked render', () => {
  it('reproduces the spec\'s gate-7 example: fear before trust, both min-15 band', () => {
    const pack = fixture({
      fear: {
        up: [
          { min: 20, text: '회선 A 발신자의 숨이 눈에 띄게 가빠졌다' },
          { min: 1, text: '회선 A 발신자의 목소리가 조금 흔들렸다' },
        ],
      },
      trust: {
        down: [
          { min: 15, text: '회선 A 발신자가 문장을 짧게 끊기 시작했다' },
          { min: 1, text: '회선 A 발신자가 한 박자 늦게 답했다' },
        ],
      },
    })
    const journal = [scalar('fear', 55, 80, 'G7:c'), scalar('trust', 40, 20, 'G7:c')]

    expect(renderSymptoms(journal, pack)).toEqual([
      '회선 A 발신자의 숨이 눈에 띄게 가빠졌다',
      '회선 A 발신자가 문장을 짧게 끊기 시작했다',
    ])
  })
})

describe('renderSymptoms — §2.3-1 reduce to (variable, direction, magnitude)', () => {
  const pack = fixture({
    trust: {
      up: [{ min: 15, text: '많이 올랐다' }, { min: 1, text: '조금 올랐다' }],
      down: [{ min: 15, text: '많이 내렸다' }, { min: 1, text: '조금 내렸다' }],
    },
  })

  it('after > before reads as `up`', () => {
    expect(renderSymptoms([scalar('trust', 10, 12)], pack)).toEqual(['조금 올랐다'])
  })

  it('after < before reads as `down`, and magnitude is the absolute difference', () => {
    expect(renderSymptoms([scalar('trust', 40, 20)], pack)).toEqual(['많이 내렸다'])
  })

  it('drops magnitude-0 entries before matching instead of raising §2.3-2', () => {
    // A no-op delta matches no `min` band (all bands are ≥ 1). Without the
    // drop this input would throw; §2.3-1 makes it a stage *before* rule 2.
    expect(() => renderSymptoms([scalar('trust', 40, 40)], pack)).not.toThrow()
  })

  it('a journal of only magnitude-0 entries renders as no change, not an error', () => {
    const journal = [scalar('trust', 40, 40), scalar('fear', 5, 5)]
    expect(renderSymptoms(journal, pack)).toEqual(['(변화 없음)'])
  })

  it('drops a magnitude-0 entry while still rendering its neighbours', () => {
    const journal = [scalar('trust', 40, 40), scalar('trust', 40, 20)]
    expect(renderSymptoms(journal, pack)).toEqual(['많이 내렸다'])
  })
})

describe('renderSymptoms — §2.3-2 first match in `min` descending order', () => {
  const pack = fixture({
    trust: { up: [{ min: 15, text: '큰 변화' }, { min: 1, text: '작은 변화' }] },
  })

  it('takes the first entry whose `min` the magnitude reaches, not the last', () => {
    expect(renderSymptoms([scalar('trust', 0, 20)], pack)).toEqual(['큰 변화'])
  })

  it('treats `min` as inclusive — magnitude exactly equal to `min` matches', () => {
    expect(renderSymptoms([scalar('trust', 0, 15)], pack)).toEqual(['큰 변화'])
  })

  it('falls through to the lower band one below the boundary', () => {
    expect(renderSymptoms([scalar('trust', 0, 14)], pack)).toEqual(['작은 변화'])
  })

  it('does not defensively re-sort a mis-ordered array — it takes the first match in array order', () => {
    // §2.3-2: "The renderer trusts that the array is already authored in `min`
    // descending order and does not defensively sort … the only basis for that
    // trust is lint (§6-2)." A pack authored ascending is therefore rendered
    // by iteration order, not by the largest satisfied `min`.
    const misordered = fixture({
      trust: { up: [{ min: 1, text: '작은 변화' }, { min: 15, text: '큰 변화' }] },
    })
    expect(renderSymptoms([scalar('trust', 0, 20)], misordered)).toEqual(['작은 변화'])
  })

  it('leaves the pack untouched — no in-place sort of the authored arrays', () => {
    const misordered = fixture({
      trust: { up: [{ min: 1, text: '작은 변화' }, { min: 15, text: '큰 변화' }] },
    })
    const before = JSON.stringify(misordered)
    renderSymptoms([scalar('trust', 0, 20)], misordered)
    expect(JSON.stringify(misordered)).toBe(before)
  })
})

describe('renderSymptoms — §2.3-2 no match is a hard error', () => {
  const pack = fixture({
    trust: { up: [{ min: 1, text: '조금 올랐다' }] },
    flags: { tip_traced: { set: '조회가 걸렸다' } },
  })

  it('throws when the variable is absent from the pack', () => {
    expectHardError(() => renderSymptoms([scalar('fear', 0, 5)], pack))
  })

  it('throws when the direction is absent for a variable that exists', () => {
    expectHardError(() => renderSymptoms([scalar('trust', 5, 0)], pack))
  })

  it('throws when the magnitude falls below the lowest authored `min` (§1.3 fractional delta)', () => {
    // §1.3: a `+0.5` delta matches no sentence at all and becomes this error.
    expectHardError(() => renderSymptoms([scalar('trust', 0, 0.5)], pack))
  })

  it('throws when a flag transition has no authored sentence (`unset` missing)', () => {
    expectHardError(() => renderSymptoms([flag('tip_traced', true, false)], pack))
  })

  it('throws when the flag id itself is absent from the pack', () => {
    expectHardError(() => renderSymptoms([flag('unknown_flag', false, true)], pack))
  })
})

describe('renderSymptoms — §2.3-2 flags', () => {
  const pack = fixture({
    trust: { up: [{ min: 1, text: '조금 올랐다' }] },
    flags: {
      tip_traced: { set: '조회가 걸렸다', unset: '조회가 풀렸다' },
      logs_saved: { set: '봉인 봉투에 담겼다' },
    },
  })

  it('renders `set` on a false → true transition', () => {
    expect(renderSymptoms([flag('tip_traced', false, true)], pack)).toEqual(['조회가 걸렸다'])
  })

  it('renders `unset` on a true → false transition', () => {
    expect(renderSymptoms([flag('tip_traced', true, false)], pack)).toEqual(['조회가 풀렸다'])
  })
})

describe('renderSymptoms — §2.3-3 sort key (kind_rank, −magnitude, journal order)', () => {
  const pack = fixture({
    trust: { up: [{ min: 1, text: 'trust 올랐다' }] },
    fear: { up: [{ min: 1, text: 'fear 올랐다' }] },
    clock_pressure: { up: [{ min: 1, text: 'pressure 올랐다' }] },
    flags: {
      tip_traced: { set: 'flag A' },
      logs_saved: { set: 'flag B' },
    },
  })

  it('puts every scalar (kind_rank 0) ahead of every flag (kind_rank 1)', () => {
    const journal = [flag('tip_traced', false, true), scalar('trust', 0, 1)]
    expect(renderSymptoms(journal, pack)).toEqual(['trust 올랐다', 'flag A'])
  })

  it('orders scalars by descending magnitude regardless of journal order', () => {
    const journal = [scalar('trust', 0, 3), scalar('fear', 0, 30)]
    expect(renderSymptoms(journal, pack)).toEqual(['fear 올랐다', 'trust 올랐다'])
  })

  it('breaks a magnitude tie by order of appearance in the journal', () => {
    const journal = [scalar('fear', 0, 10), scalar('trust', 0, 10)]
    expect(renderSymptoms(journal, pack)).toEqual(['fear 올랐다', 'trust 올랐다'])
  })

  it('breaks the same tie the other way when the journal order is reversed', () => {
    // The pair above with the entries swapped: if the renderer had any
    // hidden secondary key (variable name, pack key order), one of these two
    // cases would come out wrong.
    const journal = [scalar('trust', 0, 10), scalar('fear', 0, 10)]
    expect(renderSymptoms(journal, pack)).toEqual(['trust 올랐다', 'fear 올랐다'])
  })

  it('orders flags among themselves by journal appearance', () => {
    const journal = [flag('logs_saved', false, true), flag('tip_traced', false, true)]
    expect(renderSymptoms(journal, pack)).toEqual(['flag B', 'flag A'])
  })
})

describe('renderSymptoms — §2.3-4 truncate to 3', () => {
  const pack = fixture({
    a: { up: [{ min: 1, text: 'A' }] },
    b: { up: [{ min: 1, text: 'B' }] },
    c: { up: [{ min: 1, text: 'C' }] },
    d: { up: [{ min: 1, text: 'D' }] },
    e: { up: [{ min: 1, text: 'E' }] },
  })

  it('returns the top 3 by sort key and drops the rest', () => {
    const journal = [
      scalar('a', 0, 5),
      scalar('b', 0, 50),
      scalar('c', 0, 30),
      scalar('d', 0, 40),
      scalar('e', 0, 1),
    ]
    expect(renderSymptoms(journal, pack)).toEqual(['B', 'D', 'C'])
  })

  it('returns fewer than 3 untouched', () => {
    expect(renderSymptoms([scalar('a', 0, 5), scalar('b', 0, 1)], pack)).toEqual(['A', 'B'])
  })
})

describe('renderSymptoms — §2.3-5 empty result', () => {
  it('returns ["(변화 없음)"] for an empty journal, never []', () => {
    expect(renderSymptoms([], fixture({}))).toEqual(['(변화 없음)'])
  })
})

describe('renderSymptoms — §2.3-7 a digit anywhere in the output is a hard error', () => {
  it('throws on an ASCII digit in a rendered scalar sentence', () => {
    const pack = fixture({ trust: { up: [{ min: 1, text: '신뢰가 3만큼 올랐다' }] } })
    expectHardError(() => renderSymptoms([scalar('trust', 0, 5)], pack))
  })

  it('throws on an ASCII digit in a rendered flag sentence', () => {
    const pack = fixture({ flags: { tip_traced: { set: '회선 2번에 조회가 걸렸다' } } })
    expectHardError(() => renderSymptoms([flag('tip_traced', false, true)], pack))
  })

  it('throws on a digit at the very start of a sentence', () => {
    const pack = fixture({ trust: { up: [{ min: 1, text: '7초 뒤 목소리가 흔들렸다' }] } })
    expectHardError(() => renderSymptoms([scalar('trust', 0, 5)], pack))
  })

  it('does not throw on a digit in an entry truncation already removed from the output', () => {
    // The rule is scoped to *the output* (§2.3-7). A fourth entry never
    // reaches the returned array, so it cannot violate I12.
    const pack = fixture({
      a: { up: [{ min: 1, text: 'A' }] },
      b: { up: [{ min: 1, text: 'B' }] },
      c: { up: [{ min: 1, text: 'C' }] },
      d: { up: [{ min: 1, text: 'D에 4가 들어있다' }] },
    })
    const journal = [scalar('a', 0, 40), scalar('b', 0, 30), scalar('c', 0, 20), scalar('d', 0, 10)]
    expect(renderSymptoms(journal, pack)).toEqual(['A', 'B', 'C'])
  })
})

describe('renderSymptoms — §2.2 {who} substitution', () => {
  const pack = fixture({ trust: { up: [{ min: 1, text: '{who}의 말이 조금 길어졌다' }] } })

  it('substitutes the owning character name supplied by the caller', () => {
    const out = renderSymptoms([scalar('trust', 0, 5)], pack, { trust: '서지형' })
    expect(out).toEqual(['서지형의 말이 조금 길어졌다'])
  })

  it('leaves no {who} placeholder in the output once an owner is supplied', () => {
    const out = renderSymptoms([scalar('trust', 0, 5)], pack, { trust: '서지형' })
    expect(out.join('')).not.toContain('{who}')
  })
})

describe('renderSymptoms — determinism and the real 우는다리 pack', () => {
  it('is a pure function of its input — two calls deep-equal', () => {
    const pack = readPack()
    const journal = [scalar('fear', 55, 80, 'G7:c'), scalar('trust', 40, 20, 'G7:c')]
    expect(renderSymptoms(journal, pack)).toEqual(renderSymptoms(journal, pack))
  })

  it('renders the shipped pack without a digit and without throwing', () => {
    const pack = readPack()
    const journal = [scalar('trust', 40, 20, 'G7:c'), scalar('fear', 55, 80, 'G7:c')]
    const out = renderSymptoms(journal, pack)
    expect(out.length).toBe(2)
    expect(out.join('')).not.toMatch(/[0-9]/)
    // fear moved 25, trust moved 20 → fear first (§2.3-3).
    expect(out[0]).toContain('빨라지고')
  })

  it('picks the shipped pack\'s min-1 band for a small move', () => {
    const pack = readPack()
    expect(renderSymptoms([scalar('trust', 40, 42)], pack)).toEqual([
      '발신자의 대답이 반 박자 빨라졌다',
    ])
  })
})

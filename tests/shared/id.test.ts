// [e0#c1] — `src/shared/id.ts`, the single minting site.
//
// spec-client §5.2 ratified "sentence identity is engine-minted" and
// contract-engine-composer §2.0 fixed the grammar `b-r<run>-<channel><nn>`
// over five minted channels (`f·b·n·q·u`). `t*` ids are inherited from
// `timeline.json` and are **never minted** — they are run-independent, which is
// what makes archive highlighting point at the same text across runs.
//
// The round trip is asserted against `src/shared/species.ts`'s `SPECIES_OF`
// rather than against a literal table here: that map is frozen and consumed,
// and a second table would be the drift the map exists to prevent.
import { describe, it, expect } from 'vitest'

import { SPECIES_OF, AUTHORED_SPECIES } from '../../src/shared/species.ts'
import type { Channel } from '../../src/shared/species.ts'
import {
  ID_PATTERN,
  mintSentenceId,
  parseSentenceId,
  tryParseSentenceId,
  isMintedSentenceId,
  isAuthoredSentenceId,
  speciesOfSentenceId,
} from '../../src/shared/id.ts'

const MINTED_CHANNELS = ['f', 'b', 'n', 'q', 'u'] as const

describe('[e0#c1] the five minted channels round-trip against SPECIES_OF', () => {
  it('SPECIES_OF still declares exactly the five minted channels (frozen input)', () => {
    expect(Object.keys(SPECIES_OF).sort()).toEqual([...MINTED_CHANNELS].sort())
  })

  for (const channel of MINTED_CHANNELS) {
    it(`(${channel}) mint → parse returns run, channel, index and SPECIES_OF['${channel}']`, () => {
      const id = mintSentenceId(3, channel, 7)
      const parsed = parseSentenceId(id)
      expect(parsed.run).toBe(3)
      expect(parsed.channel).toBe(channel)
      expect(parsed.index).toBe(7)
      expect(parsed.species).toBe(SPECIES_OF[channel])
    })

    it(`(${channel}) speciesOfSentenceId agrees with the map`, () => {
      expect(speciesOfSentenceId(mintSentenceId(1, channel, 1))).toBe(SPECIES_OF[channel])
    })
  }

  it('`u` is present and carries `quote` — the channel added 08-03 for Call 1', () => {
    expect(SPECIES_OF.u).toBe('quote')
    expect(speciesOfSentenceId(mintSentenceId(1, 'u', 1))).toBe('quote')
  })
})

describe('[e0#c1] the grammar is `b-r<run>-<channel><nn>`', () => {
  it('mints the ratified shape, two-digit zero-padded, 1-based', () => {
    expect(mintSentenceId(1, 'f', 1)).toBe('b-r1-f01')
    expect(mintSentenceId(1, 'n', 2)).toBe('b-r1-n02')
    expect(mintSentenceId(2, 'b', 12)).toBe('b-r2-b12')
  })

  it('does not truncate a three-digit index (padStart, not slice)', () => {
    expect(mintSentenceId(1, 'f', 100)).toBe('b-r1-f100')
    expect(parseSentenceId('b-r1-f100').index).toBe(100)
  })

  it('carries a multi-digit run unpadded', () => {
    expect(mintSentenceId(11, 'q', 3)).toBe('b-r11-q03')
    expect(parseSentenceId('b-r11-q03').run).toBe(11)
  })

  it('is deterministic — the same arguments mint the same string (§5 D1)', () => {
    expect(mintSentenceId(4, 'b', 9)).toBe(mintSentenceId(4, 'b', 9))
  })

  it('ID_PATTERN matches every minted id and nothing else', () => {
    for (const channel of MINTED_CHANNELS) {
      expect(ID_PATTERN.test(mintSentenceId(2, channel, 5))).toBe(true)
    }
    for (const bad of ['t3', 'b-r1-z01', 'b-r0x1-f01', 'b-r1-f', 'b-r1-f0', 'br1-f01', '']) {
      expect(ID_PATTERN.test(bad), `${bad} should not match`).toBe(false)
    }
  })

  it('ID_PATTERN is stateless — no /g, so repeated .test() does not alternate', () => {
    const id = mintSentenceId(1, 'f', 1)
    expect(ID_PATTERN.test(id)).toBe(true)
    expect(ID_PATTERN.test(id)).toBe(true)
  })
})

describe('[e0#c1] the minter rejects `t*` and everything else off the grammar', () => {
  it('rejects the `t` channel — script ids are inherited, never minted', () => {
    expect(() => mintSentenceId(1, 't' as unknown as Channel, 1)).toThrow(/channel/i)
  })

  it('rejects a channel outside SPECIES_OF', () => {
    for (const bad of ['z', 'F', '', 'fb']) {
      expect(() => mintSentenceId(1, bad as unknown as Channel, 1), `channel ${bad}`).toThrow(
        /channel/i,
      )
    }
  })

  it('rejects a run that is not a positive integer', () => {
    for (const run of [0, -1, 1.5, Number.NaN]) {
      expect(() => mintSentenceId(run, 'f', 1), `run ${run}`).toThrow(/run/i)
    }
  })

  it('rejects an index that is not a positive integer (ids are 1-based)', () => {
    for (const index of [0, -1, 2.5, Number.NaN]) {
      expect(() => mintSentenceId(1, 'f', index), `index ${index}`).toThrow(/index/i)
    }
  })
})

describe('[e0#c1] authored `t*` ids are recognised, not minted', () => {
  it('isAuthoredSentenceId accepts `timeline.json`’s shape', () => {
    for (const id of ['t1', 't8', 't12']) {
      expect(isAuthoredSentenceId(id), id).toBe(true)
    }
  })

  it('isAuthoredSentenceId rejects a minted id and near-misses', () => {
    for (const id of [mintSentenceId(1, 'f', 1), 't', 'tx', 't01a', '']) {
      expect(isAuthoredSentenceId(id), id).toBe(false)
    }
  })

  it('a `t*` id is not a minted id', () => {
    expect(isMintedSentenceId('t3')).toBe(false)
    expect(isMintedSentenceId(mintSentenceId(1, 'f', 1))).toBe(true)
  })

  it('speciesOfSentenceId maps `t*` to AUTHORED_SPECIES (사실)', () => {
    expect(speciesOfSentenceId('t3')).toBe(AUTHORED_SPECIES)
    expect(AUTHORED_SPECIES).toBe('fact')
  })

  it('parseSentenceId refuses a `t*` id — it has no run and no channel', () => {
    expect(() => parseSentenceId('t3')).toThrow()
    expect(tryParseSentenceId('t3')).toBeNull()
  })
})

describe('[e0#c1] parse is total on bad input', () => {
  const MALFORMED = ['', 'b-r1-f', 'b-r1-z01', 'b-rx-f01', 'b-r1f01', 'B-R1-F01', ' b-r1-f01']

  it('tryParseSentenceId returns null rather than throwing', () => {
    for (const bad of MALFORMED) {
      expect(tryParseSentenceId(bad), JSON.stringify(bad)).toBeNull()
    }
  })

  it('parseSentenceId throws and names the offending id', () => {
    expect(() => parseSentenceId('b-r1-z01')).toThrow(/b-r1-z01/)
  })

  it('isMintedSentenceId is false for every malformed form', () => {
    for (const bad of MALFORMED) {
      expect(isMintedSentenceId(bad), JSON.stringify(bad)).toBe(false)
    }
  })

  it('speciesOfSentenceId throws on an id belonging to neither family', () => {
    expect(() => speciesOfSentenceId('nonsense')).toThrow()
  })
})

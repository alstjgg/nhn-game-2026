// [u10#c2] spec-client §9 — the Korean faces are sliced per `unicode-range`
//          (mirroring Google's slicing) and the union of the slices covers every
//          glyph the shipped scenario pack actually renders.
//
// The corpus is the frozen `data/scenario/우는다리/**` pack (read-only here).
// No fixture *content* is asserted — only which codepoints must be coverable.
import { describe, it, expect } from 'vitest'
import {
  FONTS_CSS,
  IBM_PLEX_MONO,
  KOREAN_FAMILIES,
  corpusHangul,
  corpusLatin,
  facesOf,
  isHangul,
  parseFontFaces,
  parseUnicodeRange,
  rangesCover,
  read,
  toHex,
  unionRanges,
} from './font-assets.ts'

const faces = () => parseFontFaces(read(FONTS_CSS))

describe('[u10#c2] the corpus is non-trivial', () => {
  it('(a) the scenario pack yields Hangul codepoints to cover', () => {
    expect(corpusHangul().length).toBeGreaterThan(200)
  })

  it('(b) the scenario pack yields printable-ASCII codepoints to cover', () => {
    expect(corpusLatin().length).toBeGreaterThan(20)
  })
})

describe('[u10#c2] every face is sliced', () => {
  it('(a) every @font-face declares a unicode-range', () => {
    const bad = faces()
      .filter((f) => f.unicodeRange === '')
      .map((f) => `face #${f.index} (${f.family} ${f.weight} ${f.style})`)
    expect(bad, 'an unsliced catch-all face defeats the whole subsetting').toEqual([])
  })

  it('(b) every declared unicode-range parses as valid CSS', () => {
    const bad: string[] = []
    for (const face of faces()) {
      try {
        parseUnicodeRange(face.unicodeRange)
      } catch (err) {
        bad.push(`face #${face.index} (${face.family}): ${(err as Error).message}`)
      }
    }
    expect(bad).toEqual([])
  })

  it('(c) each Korean family/weight is split into several slices, as Google slices them', () => {
    const thin: string[] = []
    for (const family of KOREAN_FAMILIES) {
      const byWeight = new Map<string, number>()
      for (const face of facesOf(faces(), family)) {
        const key = `${face.weight} ${face.style}`
        byWeight.set(key, (byWeight.get(key) ?? 0) + 1)
      }
      expect([...byWeight.keys()].length, `${family} declares no face at all`).toBeGreaterThan(0)
      for (const [key, count] of byWeight) {
        if (count < 4) thin.push(`${family} ${key} → ${count} slice(s)`)
      }
    }
    expect(thin, 'a Korean face must ship as per-unicode-range slices, not one blob').toEqual([])
  })

  it('(d) slices of the same family/weight declare distinct, non-overlapping ranges', () => {
    const clashes: string[] = []
    for (const family of KOREAN_FAMILIES) {
      const groups = new Map<string, ReturnType<typeof faces>>()
      for (const face of facesOf(faces(), family)) {
        const key = `${face.weight} ${face.style}`
        groups.set(key, [...(groups.get(key) ?? []), face])
      }
      for (const [key, group] of groups) {
        const seen: { start: number; end: number; index: number }[] = []
        for (const face of group) {
          for (const r of parseUnicodeRange(face.unicodeRange)) {
            const hit = seen.find((s) => r.start <= s.end && s.start <= r.end)
            if (hit) clashes.push(`${family} ${key}: face #${face.index} overlaps face #${hit.index}`)
            seen.push({ ...r, index: face.index })
          }
        }
      }
    }
    expect(clashes).toEqual([])
  })
})

describe('[u10#c2] the slices cover the scenario glyphs', () => {
  it('(a) each Korean family covers every Hangul codepoint in the pack', () => {
    for (const family of KOREAN_FAMILIES) {
      const ranges = unionRanges(facesOf(faces(), family))
      const missing = corpusHangul().filter((cp) => !rangesCover(ranges, cp))
      expect(missing.slice(0, 20).map(toHex), `${family} misses ${missing.length} corpus glyph(s)`).toEqual([])
    }
  })

  it('(b) each Korean family covers the whole modern Hangul syllable block (LLM-generated text)', () => {
    for (const family of KOREAN_FAMILIES) {
      const ranges = unionRanges(facesOf(faces(), family))
      const probes = [0xac00, 0xb098, 0xbb34, 0xc0dd, 0xd0dc, 0xd7a3]
      const missing = probes.filter((cp) => !rangesCover(ranges, cp))
      expect(missing.map(toHex), `${family} cannot render part of U+AC00–D7A3`).toEqual([])
    }
  })

  it('(c) the latin face covers every printable-ASCII codepoint in the pack', () => {
    const ranges = unionRanges(facesOf(faces(), IBM_PLEX_MONO))
    const missing = corpusLatin().filter((cp) => !rangesCover(ranges, cp))
    expect(missing.slice(0, 20).map(toHex)).toEqual([])
  })

  it('(d) the latin face is not asked to carry Hangul (that is the Korean families’ job)', () => {
    const latin = facesOf(faces(), IBM_PLEX_MONO)
    const overreaching = latin
      .filter((f) => parseUnicodeRange(f.unicodeRange).some((r) => isHangul(r.start) || isHangul(r.end)))
      .map((f) => `face #${f.index} → ${f.unicodeRange}`)
    expect(overreaching).toEqual([])
  })
})

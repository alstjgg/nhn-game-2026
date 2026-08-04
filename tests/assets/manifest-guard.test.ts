// [u10#c3] / [u10#c7] HARD CONSTRAINT — assets-manifest.json is GUARDED.
// The three webfont entries are RE-POINTED at the self-hosted files; new entries
// may be appended; nothing else may be removed, reordered or rewritten
// (spec-client §3 inv 10, CLAUDE.md rule 5, run-wide constraint C7).
//
// The comparison baseline is `tests/assets/baseline/manifest-baseline.json`,
// snapshotted at RED time. Never regenerate it to make this suite pass.
import { describe, it, expect } from 'vitest'
import path from 'node:path'
import crypto from 'node:crypto'
import { MANIFEST, REPO, exists, fontFilesOnDisk, read, readJson } from './font-assets.ts'

interface Entry {
  file?: string
  source?: string
  tool?: string
  license?: string
  note?: string
  [k: string]: unknown
}
interface Manifest {
  '$schema-note'?: string
  assets: Entry[]
  [k: string]: unknown
}
interface Baseline {
  schemaNote: string
  topLevelKeys: string[]
  entryCount: number
  entries: { index: number; file: string; webfont: boolean; sha256: string }[]
}

const sha = (text: string): string => crypto.createHash('sha256').update(text).digest('hex')
const raw = () => read(MANIFEST)
const manifest = () => JSON.parse(raw()) as Manifest
const baseline = () => readJson<Baseline>(path.join(REPO, 'tests/assets/baseline/manifest-baseline.json'))
const webfontBaseline = () => baseline().entries.filter((e) => e.webfont)
const keptBaseline = () => baseline().entries.filter((e) => !e.webfont)

/** The re-pointed webfont entries: same slots the baseline marked as webfonts. */
const webfontEntries = (): Entry[] => webfontBaseline().map((b) => manifest().assets[b.index])

describe('[u10#c3] the manifest still parses and keeps its shape', () => {
  it('(a) it is valid JSON with an `assets` array', () => {
    expect(() => manifest()).not.toThrow()
    expect(Array.isArray(manifest().assets)).toBe(true)
  })

  it('(b) the top-level keys and the $schema-note are untouched', () => {
    expect(Object.keys(manifest())).toEqual(baseline().topLevelKeys)
    expect(manifest()['$schema-note']).toBe(baseline().schemaNote)
  })

  it('(c) the file keeps its 2-space JSON formatting and trailing newline', () => {
    expect(raw()).toBe(`${JSON.stringify(manifest(), null, 2)}\n`)
  })
})

describe('[u10#c7] append-only: nothing else is removed or rewritten', () => {
  it('(a) no entry is dropped (count never shrinks below the baseline)', () => {
    expect(manifest().assets.length).toBeGreaterThanOrEqual(baseline().entryCount)
  })

  it('(b) every non-webfont entry is byte-identical, in its original slot', () => {
    const assets = manifest().assets
    const damaged = keptBaseline()
      .filter((b) => sha(JSON.stringify(assets[b.index])) !== b.sha256)
      .map((b) => `#${b.index} ${b.file}`)
    expect(damaged, 'u10 may only touch the three webfont entries').toEqual([])
  })

  it('(c) the three webfont entries stay in their original slots (no reordering)', () => {
    expect(webfontEntries().every((e) => e !== undefined)).toBe(true)
    expect(webfontBaseline().map((b) => b.index)).toEqual([29, 30, 31])
  })

  it('(d) any new entry is appended after the baseline range', () => {
    const assets = manifest().assets
    const appended = assets.slice(baseline().entryCount)
    for (const entry of appended) {
      expect(entry, 'appended entries must still be manifest entries').toHaveProperty('file')
      expect(entry, 'appended entries must carry a license').toHaveProperty('license')
    }
  })
})

describe('[u10#c3] the three webfont entries are re-pointed at the self-hosted files', () => {
  it('(a) each of the three entries changed (they no longer match the baseline hash)', () => {
    const assets = manifest().assets
    const stale = webfontBaseline()
      .filter((b) => sha(JSON.stringify(assets[b.index])) === b.sha256)
      .map((b) => `#${b.index} ${b.file}`)
    expect(stale, 'webfont entries were not re-pointed').toEqual([])
  })

  it('(b) each `file` now points under public/assets/fonts/', () => {
    const bad = webfontEntries()
      .filter((e) => !/^public\/assets\/fonts\//.test(String(e.file ?? '')))
      .map((e) => String(e.file))
    expect(bad).toEqual([])
  })

  it('(c) each `file` target exists on disk (a slice file or the family directory)', () => {
    const missing = webfontEntries()
      .map((e) => String(e.file ?? ''))
      .filter((f) => !exists(path.join(REPO, f.replace(/\/$/, ''))))
    expect(missing).toEqual([])
  })

  it('(d) the three families are still each named exactly once', () => {
    const text = webfontEntries().map((e) => JSON.stringify(e)).join('\n')
    for (const family of ['IBM Plex Mono', 'Nanum Myeongjo', 'Nanum Gothic Coding']) {
      expect(text.split(family).length - 1, `${family} named ${text.split(family).length - 1}× in the 3 entries`).toBe(1)
    }
  })

  it('(e) the SIL Open Font License attribution survives on every entry', () => {
    for (const entry of webfontEntries()) {
      expect(String(entry.license)).toMatch(/SIL Open Font License/i)
    }
  })

  it('(f) no entry still claims a runtime Google Fonts load', () => {
    const offenders = webfontEntries()
      .filter((e) => /loaded at runtime|not vendored|fonts\.googleapis\.com/i.test(JSON.stringify(e)))
      .map((e) => String(e.file))
    expect(offenders).toEqual([])
  })

  it('(g) the upstream provenance is still recorded (source/note names Google Fonts as origin)', () => {
    for (const entry of webfontEntries()) {
      expect(`${entry.source ?? ''} ${entry.note ?? ''}`).toMatch(/google fonts/i)
    }
  })
})

describe('[u10#c3] every shipped font binary is manifested (CLAUDE.md rule 5)', () => {
  it('(a) each file under public/assets/fonts is covered by a manifest entry', () => {
    const targets = manifest()
      .assets.map((e) => String(e.file ?? ''))
      .filter((f) => f.startsWith('public/assets/fonts'))
    const uncovered = fontFilesOnDisk().filter(
      (f) => !targets.some((t) => f === t || f.startsWith(t.replace(/\/?$/, '/'))),
    )
    expect(uncovered.slice(0, 10), `${uncovered.length} font file(s) unmanifested`).toEqual([])
  })

  it('(b) the manifest ships at least one entry per family directory that exists on disk', () => {
    expect(fontFilesOnDisk().length).toBeGreaterThan(0)
    const targets = manifest()
      .assets.map((e) => String(e.file ?? ''))
      .filter((f) => f.startsWith('public/assets/fonts'))
    expect(targets.length).toBeGreaterThanOrEqual(3)
  })
})

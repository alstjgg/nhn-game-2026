// [u10#c3] / [u10#c7] HARD CONSTRAINT — assets-manifest.json is GUARDED.
// The three webfont entries are RE-POINTED at the self-hosted files; new entries
// may be appended; nothing else may be removed, reordered or rewritten
// (spec-client §3 inv 10, CLAUDE.md rule 5, run-wide constraint C7).
//
// The comparison baseline is `tests/assets/baseline/manifest-baseline.json`,
// snapshotted at RED time. Never regenerate it to make this suite pass.
//
// WIDENED 2026-08-08, deliberately and narrowly. The original (b) compared each
// frozen entry byte for byte, which cannot tell a correction from a clobbering
// — and one correction was owed. The competition requires source AND licence for
// every external asset, and 29 `gpt-image-1` entries carried
// `"license": "generated for this project"`, which is our own words rather than
// a right anyone granted us. Fixing that means changing `license` on a frozen
// entry, which the old rule forbade.
//
// So the freeze moved from the whole entry to what an entry *is*: `file`,
// `tool`, `source`, `prompt`, `note` and everything else stay byte-identical,
// and only the licence claim may improve — and only when `license_source` cites
// where the new claim was read. The baseline is NOT regenerated; the originals
// are recovered from git at the commit that introduced the baseline, so a
// tampered entry still fails and the history is the authority, not the file the
// suite is checking.
import { describe, it, expect } from 'vitest'
import path from 'node:path'
import crypto from 'node:crypto'
import { execFileSync } from 'node:child_process'
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

/**
 * The only keys a later run may change on a frozen entry, and only together:
 * a licence claim may be corrected when — and only when — the correction says
 * where it was read.
 */
const LICENCE_KEYS = new Set(['license', 'license_source'])

/** An entry with the licence claim removed: what the asset *is*, frozen. */
const identity = (entry: Entry): string =>
  JSON.stringify(Object.fromEntries(Object.entries(entry).filter(([k]) => !LICENCE_KEYS.has(k))))

/**
 * The manifest as it stood when the baseline was taken, read from git rather
 * than from any file in the working tree — the point is that nothing a later
 * run writes can move this comparison.
 */
function originalAssets(): Entry[] {
  const commit = execFileSync('git', [
    'log', '--diff-filter=A', '--format=%H', '-1', '--',
    'tests/assets/baseline/manifest-baseline.json',
  ], { cwd: REPO }).toString().trim()
  const raw = execFileSync('git', ['show', `${commit}:assets-manifest.json`], { cwd: REPO }).toString()
  return (JSON.parse(raw) as Manifest).assets
}
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

  it('(b) every non-webfont entry keeps its identity; only the licence may improve', () => {
    const assets = manifest().assets
    const touched = keptBaseline().filter((b) => sha(JSON.stringify(assets[b.index])) !== b.sha256)
    if (touched.length === 0) return // untouched: the strict case, and the common one

    const original = originalAssets()
    const damaged: string[] = []
    for (const b of touched) {
      const now = assets[b.index] ?? {}
      const was = original[b.index] ?? {}
      if (identity(now) !== identity(was)) {
        damaged.push(`#${b.index} ${b.file} — identity/provenance rewritten, not just the licence`)
        continue
      }
      if (now.license !== was.license && String(now.license_source ?? '').trim() === '') {
        damaged.push(`#${b.index} ${b.file} — licence changed with nothing citing where it was read`)
      }
    }
    expect(damaged, 'a frozen entry may only have its licence claim corrected, with a citation').toEqual([])
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

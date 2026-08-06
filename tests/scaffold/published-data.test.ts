// What reaches the deployed site out of `data/`.
//
// `data/` is authoring input. Six files per pack plus one policy file are the
// only parts any seam fetches — `src/client/driver/live/pack.ts` says so in
// `PACK_FILES`, and `tools/driver/run/pack.mjs` says the same for the Node
// twin. Everything else beside them is an authoring surface: `draft.md` is the
// compile SOURCE and carries every gate, key condition and truth in the case.
//
// `vite.config.ts` used to copy `data/scenario` and `data/policy` recursively,
// so all of it shipped and `dist/data/scenario/<slug>/draft.md` was readable on
// the live site — the answer key, one URL away. The copy is a file allowlist
// now, and this suite is what keeps it one:
//
//   (a) the three lists agree — a part added to the loader and forgotten in the
//       config fails at boot, so the drift has to fail here first
//   (b) the allowlist names no authoring surface
//   (c) `draft.md` and `_schema/` are excluded by name, not by luck
//   (d) every allowlisted file exists, so a rename cannot silently empty (a)
//
// C3-style scoping: nothing here asserts pack CONTENT, only which paths ship.
import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { publishedDataFiles, stripDesignNotes } from '../../vite.config.ts'

const REPO = path.resolve(import.meta.dirname, '../..')
const DATA = path.join(REPO, 'data')

const read = (rel: string): string => readFileSync(path.join(REPO, rel), 'utf8')

/** The `PACK_FILES` array out of a loader, whichever quoting it uses. */
function packFilesOf(rel: string): string[] {
  const source = read(rel)
  const match = /const PACK_FILES\s*(?::[^=]+)?=\s*\[([^\]]*)\]/.exec(source)
  expect(match, `${rel} declares no PACK_FILES array`).not.toBeNull()
  return [...(match as RegExpExecArray)[1].matchAll(/['"`]([^'"`]+)['"`]/g)].map((m) => m[1])
}

/** Authoring surfaces that must never reach `dist/` — named, not inferred. */
const NEVER_PUBLISHED = ['draft.md', 'places.json', 'truths.json', 'score.json', 'hardening.json']

/** Every `.ts`/`.mjs` under `dir`, so a consumer cannot hide in a subfolder. */
function sourceFilesUnder(dir: string): string[] {
  if (!existsSync(dir)) return []
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return entry.name === 'node_modules' ? [] : sourceFilesUnder(full)
    return /\.(ts|mjs)$/.test(entry.name) ? [full] : []
  })
}

const published = publishedDataFiles(REPO)

describe('published data — the allowlist tracks what the client fetches', () => {
  it('(a) vite.config, the browser loader and the Node twin name the same parts', () => {
    const browser = packFilesOf('src/client/driver/live/pack.ts')
    const node = packFilesOf('tools/driver/run/pack.mjs')

    expect(browser, 'browser loader and Node twin disagree').toEqual(node)

    const fromConfig = [
      ...new Set(
        published
          .filter((rel) => rel.startsWith('scenario/'))
          .map((rel) => path.basename(rel, '.json')),
      ),
    ]
    expect(
      fromConfig.sort(),
      'vite.config.ts PACK_PARTS drifted from the loaders PACK_FILES',
    ).toEqual([...browser].sort())
  })

  it('(b) the policy file the loader fetches is the policy file that ships', () => {
    const loader = read('src/client/driver/live/pack.ts')
    const cited = [...loader.matchAll(/['"`](data\/policy\/[^'"`]+)['"`]/g)].map((m) =>
      m[1].replace(/^data\//, ''),
    )
    expect(cited.length, 'no data/policy path found in the browser loader').toBeGreaterThan(0)
    for (const rel of cited) {
      expect(published, `${rel} is fetched but not published`).toContain(rel)
    }
  })

  it('(c) no authoring surface is on the allowlist', () => {
    const leaked = published.filter((rel) =>
      NEVER_PUBLISHED.some((name) => path.basename(rel) === name),
    )
    expect(leaked, `authoring surfaces on the allowlist: ${leaked.join(' | ')}`).toEqual([])
  })

  it('(d) nothing under _schema/ ships — it is authoring-time validation', () => {
    expect(published.filter((rel) => rel.split('/').includes('_schema'))).toEqual([])
  })

  it('(e) every allowlisted file exists — a rename cannot empty this suite', () => {
    const missing = published.filter((rel) => !existsSync(path.join(DATA, rel)))
    expect(missing, `allowlisted but absent: ${missing.join(' | ')}`).toEqual([])
  })

  it('(g) the published gates.json drops the design notes, and nothing reads them', () => {
    // `gates.json` must ship — the engine reads it every run — but two of its
    // authored fields say how the mechanism works. `standard_form` spells a
    // gate's answer out; `branch_note` does the same for outcomes.
    const authored = readFileSync(path.join(DATA, 'scenario/우는다리/gates.json'), 'utf8')
    const shipped = stripDesignNotes(authored)

    expect(authored, 'the authored file should still carry its design notes').toMatch(
      /"standard_form"/,
    )
    expect(shipped, 'standard_form reached the published copy').not.toMatch(/"standard_form"/)
    expect(shipped, 'branch_note reached the published copy').not.toMatch(/"branch_note"/)

    // Shape-preserving: gates survive the strip, and so does everything a seam
    // does read.
    const before = JSON.parse(authored) as { gates: Record<string, unknown>[] }
    const after = JSON.parse(shipped) as { gates: Record<string, unknown>[] }
    expect(after.gates.length).toBe(before.gates.length)
    for (const [i, gate] of after.gates.entries()) {
      expect(gate.gate).toBe(before.gates[i]!.gate)
      expect(gate.stances).toEqual(before.gates[i]!.stances)
      expect(gate.key_conditions).toEqual(before.gates[i]!.key_conditions)
    }

    // The premise the strip rests on: no runtime consumer. `datapack.ts` may
    // TYPE them — that is the schema, not a read.
    const consumers = ['src', 'tools', 'proxy/src']
      .flatMap((dir) => sourceFilesUnder(path.join(REPO, dir)))
      .filter((file) => path.relative(REPO, file) !== 'src/shared/datapack.ts')
      .filter((file) => /\b(standard_form|branch_note)\b/.test(readFileSync(file, 'utf8')))
      .map((file) => path.relative(REPO, file))
    expect(
      consumers,
      `a seam now reads a stripped field: ${consumers.join(' | ')} — reconsider the strip`,
    ).toEqual([])
  })

  it('(f) every pack on disk is covered, so a new scenario cannot ship unlisted', () => {
    const slugs = readdirSync(path.join(DATA, 'scenario'), { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && !entry.name.startsWith('_'))
      .map((entry) => entry.name)
    expect(slugs.length, 'no scenario packs found').toBeGreaterThan(0)
    for (const slug of slugs) {
      expect(
        published.some((rel) => rel.startsWith(`scenario/${slug}/`)),
        `pack ${slug} is on disk but nothing of it is published`,
      ).toBe(true)
    }
  })
})

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
import {
  publishedDataFiles,
  stripCharacterNotes,
  stripDesignNotes,
  stripScoreNotes,
} from '../../vite.config.ts'

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

/**
 * Authoring surfaces that must never reach `dist/` — named, not inferred.
 *
 * `score.json` left this list with the scorer (#146): the run resolves its
 * `units[].predicates` at 21:04, so it is a runtime file now. It ships stripped
 * — see (h).
 */
const NEVER_PUBLISHED = ['draft.md', 'places.json', 'truths.json', 'hardening.json']

/**
 * Source with comments removed. The premise checks below ask whether a seam
 * READS a stripped field; a field named in prose is not a read, and
 * `src/driver/scorer.ts` explains at length why it does not trust
 * `baseline_summary`.
 */
function withoutComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/\/\/[^\n]*/g, ' ')
}

/** Files that read `field` outside `datapack.ts` (which types it, never reads). */
function consumersOf(fields: readonly string[]): string[] {
  const pattern = new RegExp(`\\b(${fields.join('|')})\\b`)
  return ['src', 'tools', 'proxy/src']
    .flatMap((dir) => sourceFilesUnder(path.join(REPO, dir)))
    .filter((file) => path.relative(REPO, file) !== 'src/shared/datapack.ts')
    .filter((file) => pattern.test(withoutComments(readFileSync(file, 'utf8'))))
    .map((file) => path.relative(REPO, file))
}

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
    // `key_examples[].mined_from` is the third: "런 1 객관 로그 · 시계 09:40 —
    // 다음 런의 G1 이전에 채굴 가능" names the gate AND the mining schedule.
    expect(shipped, 'key_examples reached the published copy').not.toMatch(/"key_examples"/)
    // `key_conditions` is the fourth (08-08), and stripping the examples while
    // shipping it was half a door: the manual §3-5 is explicit that the key is
    // the CONDITION CLASS, not any one sentence, so `{axis, referent, species}`
    // is the lock's specification — strictly more useful to a reader than the
    // examples it generates. It also carried the pack's last `기질`/`조건절` on
    // a player surface, in `targets_clause`.
    expect(shipped, 'key_conditions reached the published copy').not.toMatch(/"key_conditions"/)

    // Shape-preserving: gates survive the strip, and so does everything a seam
    // does read — Call 1 takes GATE_QUESTION · STANCE_SET · TIMELINE_EXCERPT ·
    // TEMPERAMENT (`src/engine/index.ts`), so `stances` is the load-bearing one.
    const before = JSON.parse(authored) as { gates: Record<string, unknown>[] }
    const after = JSON.parse(shipped) as { gates: Record<string, unknown>[] }
    expect(after.gates.length).toBe(before.gates.length)
    for (const [i, gate] of after.gates.entries()) {
      expect(gate.gate).toBe(before.gates[i]!.gate)
      expect(gate.stances).toEqual(before.gates[i]!.stances)
      expect(gate.question).toBe(before.gates[i]!.question)
    }

    // The premise the strip rests on: no runtime consumer. `datapack.ts` may
    // TYPE them — that is the schema, not a read.
    const consumers = consumersOf([
      'standard_form',
      'branch_note',
      'key_examples',
      'mined_from',
      'key_conditions',
      'targets_clause',
    ])
    expect(
      consumers,
      `a seam now reads a stripped field: ${consumers.join(' | ')} — reconsider the strip`,
    ).toEqual([])
  })

  it('(i) the published characters.json drops the gate index, and nothing reads it', () => {
    // `characters.json` ships — the run reads the cast — but each character
    // carries a `strands` block of `gate_ids`/`truth_ids`, the author's index of
    // where that person sits in the gate structure. 서지형's is ["G1","G4","G7"].
    const authored = readFileSync(path.join(DATA, 'scenario/우는다리/characters.json'), 'utf8')
    const shipped = stripCharacterNotes(authored)

    expect(authored, 'the authored file should still carry its strands').toMatch(/"strands"/)
    expect(shipped, 'strands reached the published copy').not.toMatch(/"strands"/)

    // Shape-preserving: every character survives with the fields the run reads.
    const before = JSON.parse(authored) as { characters: Record<string, unknown>[] }
    const after = JSON.parse(shipped) as { characters: Record<string, unknown>[] }
    expect(after.characters.length).toBe(before.characters.length)
    for (const [i, character] of after.characters.entries()) {
      expect(character.id).toBe(before.characters[i]!.id)
      expect(character.name).toBe(before.characters[i]!.name)
      expect(character.meters).toEqual(before.characters[i]!.meters)
    }

    const consumers = consumersOf(['strands', 'gate_ids', 'truth_ids'])
    expect(
      consumers,
      `a seam now reads a stripped character field: ${consumers.join(' | ')}`,
    ).toEqual([])
  })

  it('(h) the published score.json drops the ending, and nothing reads it', () => {
    // `score.json` ships for `units[].predicates`, which the scorer resolves at
    // 21:04. The rest of the file is written for a human: `baseline_summary`
    // states the no-intervention ending, and `attributed_gates` names the gates
    // a unit hangs off — gate structure on a fetchable URL (invariant 6).
    const authored = readFileSync(path.join(DATA, 'scenario/우는다리/score.json'), 'utf8')
    const shipped = stripScoreNotes(authored)

    expect(authored, 'the authored file should still carry its baseline').toMatch(
      /"baseline_summary"/,
    )
    for (const field of ['baseline_summary', 'variance_notes', 'attributed_gates', 'tallies']) {
      expect(shipped, `${field} reached the published copy`).not.toMatch(
        new RegExp(`"${field}"`),
      )
    }

    // Shape-preserving: every unit survives, and so does everything the scorer
    // reads — `src/driver/scorer.ts` uses `id`, `label` and `predicates`.
    const before = JSON.parse(authored) as { units: Record<string, unknown>[] }
    const after = JSON.parse(shipped) as { units: Record<string, unknown>[] }
    expect(after.units.length).toBe(before.units.length)
    for (const [i, unit] of after.units.entries()) {
      expect(unit.id).toBe(before.units[i]!.id)
      expect(unit.label).toBe(before.units[i]!.label)
      expect(unit.predicates).toEqual(before.units[i]!.predicates)
    }

    const consumers = consumersOf([
      'baseline_summary',
      'variance_notes',
      'attributed_gates',
      'tallies',
    ])
    expect(
      consumers,
      `a seam now reads a stripped score field: ${consumers.join(' | ')} — reconsider the strip`,
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

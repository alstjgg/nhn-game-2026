// [e4#A4] — contract-engine-composer §8-5 and §5: `inner_note` reaches Call 3
// and nothing else. It enters `EXPERIENCED` and reaches the player only through
// the report; the engine must not place it on the timeline, and no other view
// may expose it.
//
// Guarded twice, as A4 requires: a runtime guard against a polluted fixture,
// and a source-text guard that reads `src/engine/feed/**` from disk.
//
// This file also carries the §5 EXPERIENCED assembly assertions, because
// `assembleExperienced` is the one function `inner_note` is allowed to reach.
// Line PROSE is provisional (spec decision 7 / design D-5), so the assertions
// are on containment and order — never on the exact rendered wording.
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  createIdAllocator,
  buildFeed,
  buildReportSentences,
  assembleExperienced,
  roundSlots,
} from '../../../src/engine/feed/index.ts'
import {
  GOLDEN_BEAT,
  GOLDEN_REPORT,
  GOLDEN_ROUND,
  INNER_NOTE,
  UTTERANCE,
  SCRIPT_LINE,
  TIMELINE_ENTRIES,
  SYMPTOM,
  FOREIGN_NPC_TEXT,
} from './__fixtures__/beat.ts'

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')
const FEED_DIR = path.join(REPO, 'src/engine/feed')

/** Files allowed to name `inner_note` at all (design D-4). */
const INNER_NOTE_OWNERS = new Set(['experienced.ts', 'types.ts'])

function walk(dir: string): string[] {
  if (!fs.existsSync(dir)) return []
  const out: string[] = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...walk(full))
    else if (/\.tsx?$/.test(entry.name)) out.push(full)
  }
  return out
}

const experienced = () => assembleExperienced(GOLDEN_ROUND)

describe('[e4#A4] runtime — the polluted fixture', () => {
  it('(a) inner_note appears in assembleExperienced() output', () => {
    expect(experienced().some((l) => l.includes(INNER_NOTE))).toBe(true)
  })

  it('(b) inner_note appears in NO FeedLine.text and NO FeedLine.speaker', () => {
    const lines = buildFeed(GOLDEN_BEAT, createIdAllocator(1)).lines
    for (const line of lines) {
      expect(line.text, 'inner_note reached a feed line').not.toContain(INNER_NOTE)
      expect(line.speaker ?? '').not.toContain(INNER_NOTE)
    }
  })

  it('(c) inner_note reaches no timeline line (kind:"event") in particular', () => {
    const timeline = buildFeed(GOLDEN_BEAT, createIdAllocator(1)).lines.filter(
      (l) => l.kind === 'event',
    )
    expect(JSON.stringify(timeline)).not.toContain(INNER_NOTE)
  })

  it('(d) the whole FeedResult, serialised, is free of inner_note', () => {
    const result = buildFeed(GOLDEN_BEAT, createIdAllocator(1))
    expect(JSON.stringify(result)).not.toContain(INNER_NOTE)
  })

  it('(e) buildFeed cannot see inner_note even when the caller shoves it in', () => {
    const polluted = {
      ...GOLDEN_BEAT,
      judgment: { utterance: UTTERANCE, inner_note: INNER_NOTE },
    } as typeof GOLDEN_BEAT
    expect(JSON.stringify(buildFeed(polluted, createIdAllocator(1)))).not.toContain(INNER_NOTE)
  })

  it('(f) the report sentences carry no inner_note', () => {
    const report = buildReportSentences(GOLDEN_REPORT, createIdAllocator(1))
    expect(JSON.stringify(report)).not.toContain(INNER_NOTE)
  })

  it('(g) roundSlots exposes inner_note only inside EXPERIENCED, never on TEMPERAMENT', () => {
    const slots = roundSlots(GOLDEN_ROUND)
    expect(JSON.stringify(slots.TEMPERAMENT)).not.toContain(INNER_NOTE)
    expect(Object.keys(slots).sort()).toEqual(['EXPERIENCED', 'TEMPERAMENT'])
    expect(slots.EXPERIENCED.some((l) => l.includes(INNER_NOTE))).toBe(true)
  })
})

describe('[e4#A4] source text — src/engine/feed/** never writes inner_note into a FeedLine', () => {
  it('(h) only experienced.ts and types.ts mention inner_note at all', () => {
    const offenders = walk(FEED_DIR).filter(
      (f) =>
        !INNER_NOTE_OWNERS.has(path.basename(f)) &&
        /inner_note/.test(fs.readFileSync(f, 'utf8')),
    )
    expect(offenders.map((f) => path.relative(REPO, f))).toEqual([])
  })

  it('(i) the module folder exists and is not empty (the guard has something to guard)', () => {
    expect(walk(FEED_DIR).length).toBeGreaterThan(0)
  })
})

describe('[e4] §5 EXPERIENCED assembly', () => {
  it('(j) inner_note sits immediately BEFORE its beat\'s utterance', () => {
    const lines = experienced()
    const noteAt = lines.findIndex((l) => l.includes(INNER_NOTE))
    const uttAt = lines.findIndex((l) => l.includes(UTTERANCE))
    expect(noteAt).toBeGreaterThanOrEqual(0)
    expect(uttAt).toBe(noteAt + 1)
  })

  it('(k) it returns string[] — one line per event, in timeline occurrence order', () => {
    const lines = experienced()
    expect(Array.isArray(lines)).toBe(true)
    expect(lines.every((l) => typeof l === 'string')).toBe(true)
    // script · inner_note · utterance · 2 timeline_entries · 2 surviving npc lines
    expect(lines.length).toBe(7)
    const at = (needle: string) => lines.findIndex((l) => l.includes(needle))
    expect(at(SCRIPT_LINE.text)).toBe(0)
    expect(at(TIMELINE_ENTRIES[0])).toBeLessThan(at(TIMELINE_ENTRIES[1]))
    expect(at(TIMELINE_ENTRIES[1])).toBeLessThan(at('문 좀 열어주세요.'))
    expect(at('문 좀 열어주세요.')).toBeLessThan(at('조용히 해.'))
  })

  it('(l) symptoms are excluded — they are not in §5\'s input table', () => {
    expect(experienced().join('\n')).not.toContain(SYMPTOM)
  })

  it('(m) a dropped npc line reaches EXPERIENCED no more than the timeline does', () => {
    expect(experienced().join('\n')).not.toContain(FOREIGN_NPC_TEXT)
  })

  it('(n) assembleExperienced is the ONLY export that reads inner_note', () => {
    const withNote = assembleExperienced(GOLDEN_ROUND)
    const withoutNote = assembleExperienced({
      ...GOLDEN_ROUND,
      gate: { ...GOLDEN_ROUND.gate, inner_note: '' },
    })
    expect(withNote).not.toEqual(withoutNote)
  })
})

// [u0#c6] — repo-root DISCOVERY.md exists with the three run sections, seeded with the known items.
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const DISCOVERY = path.join(REPO, 'DISCOVERY.md')

const REQUIRED_SECTIONS = ['Spec gaps', 'Seam friction', 'Reference ambiguities'] as const

/** Map of `## Heading` -> section body (heading text trimmed, case preserved). */
function sections(): Map<string, string> {
  const text = fs.readFileSync(DISCOVERY, 'utf8')
  const out = new Map<string, string>()
  const re = /^##\s+(.+?)\s*$/gm
  const heads = [...text.matchAll(re)]
  heads.forEach((h, i) => {
    const start = h.index! + h[0].length
    const end = i + 1 < heads.length ? heads[i + 1]!.index! : text.length
    out.set(h[1]!.trim(), text.slice(start, end))
  })
  return out
}

/** Concatenated body of every `##` section (i.e. content that lives under a heading). */
function underHeadings(): string {
  return [...sections().values()].join('\n')
}

describe('[u0#c6] DISCOVERY.md', () => {
  it('exists at the repo root', () => {
    expect(fs.existsSync(DISCOVERY)).toBe(true)
  })

  it('declares the three run sections as level-2 headings', () => {
    const found = sections()
    for (const heading of REQUIRED_SECTIONS) {
      const hit = [...found.keys()].some((k) => k.toLowerCase() === heading.toLowerCase())
      expect(hit, `missing "## ${heading}"`).toBe(true)
    }
  })

  it('logs the missing src/shared/segment.ts blocker under a heading', () => {
    expect(underHeadings()).toContain('src/shared/segment.ts')
  })

  it('logs the missing §3.7 pack-copy plugin under a heading', () => {
    const body = underHeadings()
    expect(body).toContain('§3.7')
    expect(body).toMatch(/pack-copy/i)
  })

  it('records that e2e runs on `npm run dev` and u11 must revisit it (C5)', () => {
    const body = underHeadings()
    expect(body).toMatch(/npm run dev/)
    expect(body).toMatch(/u11/i)
  })

  it('records that the PRD "memory-only" line is stale — sessionStorage per C4', () => {
    const body = underHeadings()
    expect(body).toMatch(/sessionStorage/)
    expect(body).toMatch(/memory-only/i)
  })

  it('has non-empty content under every required section', () => {
    const found = sections()
    for (const heading of REQUIRED_SECTIONS) {
      const key = [...found.keys()].find((k) => k.toLowerCase() === heading.toLowerCase())
      expect(key, `missing "## ${heading}"`).toBeTruthy()
      expect(found.get(key!)!.trim().length, `"## ${heading}" is empty`).toBeGreaterThan(0)
    }
  })
})

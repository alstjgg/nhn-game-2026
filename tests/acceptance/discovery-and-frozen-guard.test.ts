// [u11#c6] PRD §6 — `DISCOVERY.md` is populated AND its now-false entries are
// CORRECTED, never silently deleted.
//
// The correction policy (design D8, resolving spec-vs-prompt): an obsolete
// entry KEEPS its original text and gains an adjacent `**RESOLVED …**` line
// naming what overtook it. Deleting the entry would erase the run's history;
// leaving it bare would mislead the next reader. Both are failures here.
//
// Three entries are obsolete as of 08-04:
//   · u0's "`src/shared/segment.ts` does not exist"      → landed with PR #114
//   · u0's "the §3.7 pack-copy plugin is unbuilt"        → landed with PR #114
//   · u0's "e2e runs on `npm run dev` … u11 must revisit" → settled by the C5 split
//
// The second half of this file is the frozen-input guard: nothing this run
// commits may touch the reference/frozen globs (C1/C13/C20).
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { runMerge } from './unit-range.ts'

const SELF = fileURLToPath(import.meta.url)
const REPO = path.resolve(path.dirname(SELF), '../..')
const DISCOVERY = path.join(REPO, 'DISCOVERY.md')

function text(): string {
  return fs.readFileSync(DISCOVERY, 'utf8')
}

/** Repo-relative paths of every test file annotated as a C12/C17 re-aim. */
function reAimedTestFiles(): string[] {
  const root = path.join(REPO, 'tests')
  const found: string[] = []
  const walk = (dir: string): void => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) walk(full)
      // This file carries the marker only because it defines the scanner.
      else if (full === SELF || !entry.name.endsWith('.test.ts')) continue
      else if (/RE-AIMED/.test(fs.readFileSync(full, 'utf8'))) found.push(path.relative(REPO, full))
    }
  }
  walk(root)
  return found.sort()
}

/** One entry per top-level `- [unit] …` bullet, with its continuation lines. */
function entries(): string[] {
  const out: string[] = []
  let current: string[] | null = null
  for (const line of text().split('\n')) {
    if (/^-\s+\[/.test(line)) {
      if (current) out.push(current.join('\n'))
      current = [line]
      continue
    }
    if (current) current.push(line)
  }
  if (current) out.push(current.join('\n'))
  return out
}

/** The single entry matching every needle, or a readable failure. */
function entryWith(...needles: (string | RegExp)[]): string {
  const hits = entries().filter((e) =>
    needles.every((n) => (typeof n === 'string' ? e.includes(n) : n.test(e))),
  )
  expect(hits.length, `no DISCOVERY entry matches ${needles.map(String).join(' + ')}`).toBeGreaterThan(0)
  return hits.join('\n')
}

const RESOLVED = /\*\*RESOLVED[^\n]*\*\*/

/**
 * `DISCOVERY.md` did not exist on `main` — u0 created it inside this run — so
 * "only grew" is measured against the state u11 INHERITED: the integration
 * branch point when it resolves, otherwise the newest commit touching the file
 * that is not this unit's own.
 */
function discoveryBase(): string {
  for (const ref of ['super/20260803-213143', 'origin/super/20260803-213143']) {
    try {
      const base = git(['merge-base', 'HEAD', ref]).trim()
      git(['cat-file', '-e', `${base}:DISCOVERY.md`])
      return base
    } catch {
      /* try the next ref */
    }
  }
  const commits = git(['log', '--format=%H %s', '--', 'DISCOVERY.md'])
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
  const inherited = commits.find((line) => !/u11/i.test(line)) ?? commits[commits.length - 1]
  expect(inherited, 'no commit in history ever touched DISCOVERY.md').toBeTruthy()
  return inherited!.split(' ')[0]!
}

function git(args: string[]): string {
  return execFileSync('git', args, { cwd: REPO, encoding: 'utf8' })
}

describe('[u11#c6] DISCOVERY.md is populated with the run\'s findings', () => {
  it('(a) exists and carries the three run sections', () => {
    expect(fs.existsSync(DISCOVERY)).toBe(true)
    for (const heading of ['Spec gaps', 'Seam friction', 'Reference ambiguities']) {
      expect(text(), `missing "## ${heading}"`).toContain(`## ${heading}`)
    }
  })

  it('(b) the segmenter gap is logged WITH the signature the run was given', () => {
    const entry = entryWith('src/shared/segment.ts')
    expect(entry, 'the segmenter entry never states the confirmed signature (C13)').toMatch(
      /segmentReportBody\s*\(\s*body\s*:\s*string\s*\)\s*:\s*string\[\]/,
    )
  })

  it('(c) the §3.7 pack-copy gap is logged', () => {
    expect(entryWith('§3.7', /pack-copy/i).length).toBeGreaterThan(0)
  })

  it('(d) the persistence contradiction is logged as sessionStorage-vs-the-PRD (C4)', () => {
    const entry = entryWith(/sessionStorage/)
    expect(entry).toMatch(/localStorage|memory-only/)
  })

  it('(e2) §7 #3\'s delta→bucket→edge has no seam event — the gap is logged, not invented', () => {
    // Measured 08-04: `src/shared/view-driver.ts`'s ratified §5.2 union carries
    // no judgment/gate event, so the debug pane can only observe the raw stream
    // the gate produced. u11 records the gap; nothing here mints an event type.
    const body = text()
    expect(body, 'the §7 #3-vs-§5.2 judgment-observability gap is not logged').toMatch(/§7\s*#3|judgment/i)
    expect(body).toMatch(/§5\.2|view-driver/)
  })

  it('(e) the channel-vs-classification species tension is logged', () => {
    const entry = entryWith(/species/i, /channel/i)
    expect(entry.length, 'no entry records the channel→species tension').toBeGreaterThan(0)
  })
})

describe('[u11#c6] the now-false entries are corrected, not deleted', () => {
  it('(f) the "segment.ts does not exist" entry keeps its text and gains a RESOLVED marker', () => {
    const entry = entryWith('src/shared/segment.ts', /does not exist/)
    expect(entry, 'the obsolete segmenter entry has no RESOLVED marker (#114)').toMatch(RESOLVED)
    expect(entry).toMatch(/#114/)
  })

  it('(g) the "pack-copy plugin is unbuilt" entry keeps its text and gains a RESOLVED marker', () => {
    const entry = entryWith(/pack-copy/i, /unbuilt/i)
    expect(entry, 'the obsolete pack-copy entry has no RESOLVED marker (#114)').toMatch(RESOLVED)
  })

  it('(h) the dev-server e2e re-run entry is corrected by the C5 split, not removed', () => {
    const entry = entryWith(/npm run dev/, /u11/i)
    expect(entry, 'the obsolete dev-server entry has no RESOLVED marker (C5 split)').toMatch(RESOLVED)
    expect(entry).toMatch(/C5/)
  })

  it('(i) no entry claims a resolved fact without a marker — the three obsolete texts are the whole set', () => {
    const stale = entries().filter(
      (e) =>
        (/does not exist/.test(e) && e.includes('src/shared/segment.ts')) ||
        (/unbuilt/i.test(e) && /pack-copy/i.test(e)) ||
        (/npm run dev/.test(e) && /must revisit/i.test(e)),
    )
    expect(stale.length, 'the three known-obsolete entries are not all present — one was deleted').toBe(3)
    expect(stale.filter((e) => !RESOLVED.test(e)), 'an obsolete entry is still presented as current').toEqual([])
  })
})

describe('[u11#c6] the run\'s own decisions are logged too', () => {
  it('(j) C5(e) — the DoD wording change is stated in one honest sentence', () => {
    const body = text()
    expect(body, 'the DoD wording change (C5(e)) is not logged').toMatch(/dev-hosted/i)
    expect(body).toMatch(/preview smoke/i)
  })

  it('(k) the C16 sim-clock hook (u2 charter completion) is logged as this unit\'s one production edit', () => {
    expect(text()).toMatch(/C16/)
    expect(text()).toMatch(/installClockHook|sim-clock hook/)
  })

  it('(l) each C12/C17 re-aim is logged with the assert it re-aimed', () => {
    const body = text()
    expect(body).toMatch(/C17|re-aim/i)
    expect(body, 'the layout census re-aim is not logged').toContain('tests/scaffold/layout.test.ts')

    // Self-maintaining: every test file carrying a RE-AIMED annotation must be
    // named in DISCOVERY. A silent re-aim is exactly what C12/C17 forbid.
    for (const file of reAimedTestFiles()) {
      expect(body, `${file} was re-aimed but never logged in DISCOVERY`).toContain(file)
    }
  })
})

describe('[u11#c6] frozen inputs stayed frozen (C1 / C13 / C20)', () => {
  // RE-AIMED (C17) at the post-merge reconcile (08-05). The freeze was pipeline
  // discipline — the run must not rewrite its own inputs — and for two paths
  // that premise expired at the run's merge (#110): `docs/spec-client.md`
  // revises by its owner's hand post-run (spec-client §9), and
  // `src/shared/species.ts` carried its own deletion order for the duplicate
  // `Species` union. The claim stays asserted where it stayed true — over the
  // run's own merge range, in (m); the live checks keep the still-frozen set.
  //
  // RELEASED again (08-05, the score-predicate hardening):
  // `data/scenario/우는다리/` is the pack, and the pack is the game's content.
  // The freeze said "the run must not rewrite its OWN inputs", which stopped
  // being a live claim the moment that run merged — the same argument that
  // released `spec-client.md` above. Left as it was, the pack could never be
  // hardened: `predicates`, `edge_predicates` and the meter bindings are all
  // authored INTO it, and lint has been reporting them as the hardening
  // worklist (F1–F4) with nowhere to do the work.
  //
  // `data/scenario/_schema/` stays frozen, and the distinction is the point:
  // the pack is content and revises with the scenario; the schemas are the
  // ratified law that content is checked against, and nothing about the run's
  // merge expired that. §3.6's grammar was deliberately sized to fit the
  // already-ratified `string[]` so hardening never needs to touch them.
  //
  // The same release carries a second repair (08-06), on the same expiry: the
  // timeline printed `(갈림길 Gn의 자리)` on six lines of a player surface,
  // against the 08-03 decision log and `docs/spec-client.md` §3 invariant 6.
  // That leak cannot be repaired anywhere but the authored file — fixing only
  // the compiled `timeline.json` would let the next `datapack:compile` restore
  // it. `_schema/` stays frozen for this one too: the schemas are not what
  // either defect is in.
  // RELEASED a third time (08-09, the scenario-model work). The paragraph above
  // is the one this expires, and it is worth being exact about which half. The
  // freeze's own premise — "the run must not rewrite its own inputs" — died at
  // #110 with the rest. What kept `_schema/` frozen past that was a SECOND
  // claim, made in the last sentence above: §3.6's grammar was sized so that
  // hardening would never need to touch the schemas. That claim held for packs
  // authored the way 우는다리 and 전구간정상 were. It does not hold for a pack
  // authored endings-first: 멈춘회전문's gates open on what the agent believes
  // rather than on a key it holds, so they carry no `key_conditions` and no
  // `key_examples`, and its temperament carries no `clauses` — and all three
  // were in `required`. The schemas were forbidding a legal scenario shape, not
  // guarding a ratified one.
  //
  // Both edits are pure widenings — two fields dropped from a `required` list,
  // one `minItems` from 1 to 0. No property changed type, no grammar changed
  // shape, and both shipped packs still lint at ERROR 0. A pack that validated
  // before this still validates after it.
  const RELEASED = [
    'docs/spec-client.md',
    'src/shared/species.ts',
    'data/scenario/우는다리/',
    'data/scenario/_schema/',
  ]
  const FROZEN = [
    'docs/design/',
    'src/shared/segment.ts',
    'tools/tests/segment.golden.mjs',
  ]

  it('(m) this run\'s commits introduced no diff under a frozen path', () => {
    const merge = runMerge()
    const changed = git(['diff', '--name-only', `${merge}^1`, merge, '--'])
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
    expect(changed.filter((f) => [...FROZEN, ...RELEASED].some((p) => f.startsWith(p)))).toEqual([])
  })

  it('(m2) work landed since the run introduces no diff under a still-frozen path', () => {
    // `runMerge()..HEAD`, not the merge-base against main — on main the
    // merge-base is HEAD and the guard goes vacuous. See dev-only (e2).
    const changed = git(['diff', '--name-only', `${runMerge()}..HEAD`, '--'])
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
    expect(changed.filter((f) => FROZEN.some((p) => f.startsWith(p)))).toEqual([])
  })

  it('(n) the working tree carries no uncommitted edit under a still-frozen path either', () => {
    const dirty = git(['status', '--porcelain', '--', ...FROZEN])
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
    expect(dirty).toEqual([])
  })

  it('(o) DISCOVERY.md only ever GREW — no earlier unit\'s entry was dropped', () => {
    // Compared on the bullet's opening clause, so a correction may re-wrap the
    // paragraph; what it may not do is make the finding disappear.
    const opening = (line: string): string => line.trim().replace(/\s+/g, ' ').slice(0, 40)
    const now = text()
      .split('\n')
      .filter((l) => /^-\s+\[/.test(l))
      .map(opening)
    const dropped = git(['show', `${discoveryBase()}:DISCOVERY.md`])
      .split('\n')
      .filter((l) => /^-\s+\[/.test(l))
      .map(opening)
      .filter((o) => !now.includes(o))
    expect(dropped, 'a DISCOVERY entry from the base was deleted rather than corrected').toEqual([])
  })
})

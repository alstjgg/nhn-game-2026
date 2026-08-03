// [e4#A8] — contract-engine-composer §8-1 transcribed at e4's seam: every slot
// in call contracts §6's supplier table resolves to exactly one of
// `GateView ∪ BeatView ∪ RoundView ∪ ComposerDeps ∪ PROXY_OWNED_SLOTS`.
//
// "Criterion 1 is the one that keeps this document honest: it fails the moment
// §6 gains a slot nobody assigned." So the slot list is READ FROM THE DOC on
// disk rather than restated here — a restated list would only test itself. The
// view keys are likewise read from `src/engine/index.ts` on disk, because
// `createEngine` is still a throwing stub.
//
// e10 owns the integrated §8 ten-criteria suite; this duplication is
// intentional (spec decision 9).
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  PROXY_OWNED_SLOTS,
  COMPOSER_DEP_SLOTS,
} from '../../../src/engine/feed/index.ts'

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')
const CALLS_DOC = path.join(REPO, 'docs/contract-calls.md')
const ENGINE_INDEX = path.join(REPO, 'src/engine/index.ts')

/** Every backticked SLOT_NAME in the "Supplier per slot" table's slot column. */
function slotsFromDoc(): string[] {
  const text = fs.readFileSync(CALLS_DOC, 'utf8')
  const start = text.indexOf('### Supplier per slot')
  expect(start, 'contract-calls.md no longer has a "Supplier per slot" section').toBeGreaterThan(-1)
  const rest = text.slice(start)
  const end = rest.indexOf('\n### ', 1)
  const table = end === -1 ? rest : rest.slice(0, end)

  const out: string[] = []
  for (const line of table.split('\n')) {
    if (!line.trimStart().startsWith('|')) continue
    const cells = line.split('|').map((c) => c.trim())
    // | (empty) | Call | Slot | Supplier | (empty)
    const slotCell = cells[2] ?? ''
    if (/^-+$/.test(slotCell) || slotCell.toLowerCase() === 'slot') continue
    for (const m of slotCell.matchAll(/`([A-Z][A-Z0-9_]*)`/g)) out.push(m[1]!)
  }
  return out
}

/** Keys declared by an `export type <Name> = { ... }` block in engine/index.ts. */
function viewKeys(typeName: string): string[] {
  const source = fs.readFileSync(ENGINE_INDEX, 'utf8')
  const at = source.indexOf(`export type ${typeName} = {`)
  expect(at, `src/engine/index.ts no longer declares ${typeName}`).toBeGreaterThan(-1)
  const body = source.slice(at, source.indexOf('\n}', at))
  return [...body.matchAll(/^\s{2}([A-Z][A-Z0-9_]*)\??:/gm)].map((m) => m[1]!)
}

const DOC_SLOTS = slotsFromDoc()

const SUPPLIERS: Record<string, readonly string[]> = {
  GateView: viewKeys('GateView'),
  BeatView: viewKeys('BeatView'),
  RoundView: viewKeys('RoundView'),
  ComposerDeps: COMPOSER_DEP_SLOTS,
  PROXY_OWNED_SLOTS,
}

describe('[e4#A8] §6 slot ⟷ supplier closure', () => {
  it('(a) the doc table parsed into a non-trivial slot list', () => {
    expect(DOC_SLOTS.length).toBeGreaterThanOrEqual(12)
    expect(DOC_SLOTS).toContain('TEMPERAMENT')
    expect(DOC_SLOTS).toContain('EXPERIENCED')
    expect(DOC_SLOTS).toContain('AGENT_UTTERANCE')
  })

  it('(b) every §6 slot has AT LEAST one supplier', () => {
    const unassigned = [...new Set(DOC_SLOTS)].filter(
      (slot) => !Object.values(SUPPLIERS).some((set) => set.includes(slot)),
    )
    expect(unassigned, '§6 gained a slot nobody assigned').toEqual([])
  })

  it('(c) no §6 slot has two suppliers — except TEMPERAMENT, which §6 binds to both calls', () => {
    const doubled: string[] = []
    for (const slot of new Set(DOC_SLOTS)) {
      const owners = Object.entries(SUPPLIERS)
        .filter(([, set]) => set.includes(slot))
        .map(([name]) => name)
      if (owners.length > 1 && slot !== 'TEMPERAMENT') doubled.push(`${slot}: ${owners.join(' + ')}`)
    }
    expect(doubled).toEqual([])
  })

  it('(d) TEMPERAMENT is supplied by exactly GateView and RoundView (§8-6 structural half)', () => {
    const owners = Object.entries(SUPPLIERS)
      .filter(([, set]) => set.includes('TEMPERAMENT'))
      .map(([name]) => name)
      .sort()
    expect(owners).toEqual(['GateView', 'RoundView'])
  })

  it('(e) PROXY_OWNED_SLOTS is exactly the default prompt\'s three (contract-calls §6 row 1)', () => {
    expect([...PROXY_OWNED_SLOTS].sort()).toEqual(['FLAW', 'INCIDENT', 'PRIORITY_LIST'])
  })

  it('(f) neither non-view set names anything §6 does not', () => {
    const stray = [...PROXY_OWNED_SLOTS, ...COMPOSER_DEP_SLOTS].filter(
      (s) => !DOC_SLOTS.includes(s),
    )
    expect(stray, 'a slot was assigned that §6 does not declare').toEqual([])
  })

  it('(g) no view declares a slot §6 does not (the views do not invent inputs)', () => {
    const stray: string[] = []
    for (const name of ['GateView', 'BeatView', 'RoundView'] as const) {
      for (const key of SUPPLIERS[name]!) if (!DOC_SLOTS.includes(key)) stray.push(`${name}.${key}`)
    }
    expect(stray).toEqual([])
  })
})

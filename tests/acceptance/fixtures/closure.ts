// [e10] §8-1's closure, and the §6 parser it runs over.
//
// The criterion is "every slot in call contracts §6 has exactly one supplier".
// Two halves, and both have to be real for the test to mean anything:
//
// - the **denominator** is parsed out of `docs/contract-calls.md` itself, so a
//   new row in the §6 table is picked up without anyone editing this file —
//   which is the whole reason §8-1 is a test and not a review item;
// - the **numerator** is the live supplier sets. Three of them are the runtime
//   view key sets (`fixtures/rig.ts`'s `viewKeys()`), and the other three are
//   the two constants `src/engine/feed/slots.ts` already declares plus
//   `PLAYER_SUPPLIED_SLOTS` below.
//
// `PLAYER_SUPPLIED_SLOTS` is K1, the contract gap this unit logged rather than
// papered over: §8-1 names five supplier sets, but §6 assigns `BLOCKS` to *the
// player*, and the composer reaches it through a dependency (`ComposerDeps`)
// rather than a view. Naming the player explicitly keeps the union honest
// instead of quietly leaning on the composer's dependency list to cover a slot
// the composer does not author.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { ComposerRuntimeDeps } from '../../../src/composer/compose.ts'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const REPO = path.resolve(HERE, '../../..')
const CONTRACT_CALLS = path.join(REPO, 'docs', 'contract-calls.md')

/** The §6 sub-heading whose table is the denominator. */
const SUPPLIER_HEADING = '### Supplier per slot'

/** A supplier set, by the name §8-1 calls it. */
export type SupplierMap = Record<string, readonly string[]>

/**
 * The one key of a `SupplierMap` that is NOT engine-side. Kept as a constant so
 * `closure` and its callers cannot disagree about which set is the proxy's —
 * the doubling rule is defined entirely by that split.
 */
export const PROXY_SUPPLIER_KEY = 'Proxy'

/**
 * K1 — §6 row 4: `BLOCKS` is supplied by the player, mined from generated text.
 * Neither a view nor the proxy authors it, so §8-1's union needs this sixth
 * term. See `discovery/e10.md`.
 */
export const PLAYER_SUPPLIED_SLOTS: readonly string[] = ['BLOCKS']

/**
 * K4 — which `ComposerDeps` key carries which §6 slot, as one explicit literal.
 * Typed on `keyof ComposerRuntimeDeps`, so a new composer dependency is a
 * compile error here rather than a silently unmapped slot.
 */
export const DEP_KEY_TO_SLOT: Readonly<Record<keyof ComposerRuntimeDeps, string>> = {
  blocks: 'BLOCKS',
  reportGuidance: 'REPORT_GUIDANCE',
}

export type ClosureResult = {
  /** §6 slots no supplier set claims. */
  unassigned: string[]
  /** §6 slots claimed by the engine side AND by the proxy. */
  doubled: string[]
}

/** `| a | b | c |` → `['a', 'b', 'c']`, trimmed. `null` when the line is not a row. */
function cells(line: string): string[] | null {
  const trimmed = line.trim()
  if (!trimmed.startsWith('|')) return null
  return trimmed
    .split('|')
    .slice(1, -1)
    .map((cell) => cell.trim())
}

/**
 * Every slot named in §6's "Supplier per slot" table, in table order.
 *
 * Only the *Slot* column is read: the Supplier column also carries backticked
 * identifiers (`utterance`, `inner_note`, the policy file path) and scooping
 * those up would inflate the denominator with things that are not slots.
 */
export function docSlots(): string[] {
  const lines = fs.readFileSync(CONTRACT_CALLS, 'utf8').split('\n')
  const start = lines.findIndex((line) => line.trim() === SUPPLIER_HEADING)
  if (start === -1) {
    throw new Error(`contract-calls.md has no "${SUPPLIER_HEADING}" section — the parser is stale`)
  }

  const slots: string[] = []
  for (let at = start + 1; at < lines.length; at += 1) {
    const line = lines[at]!
    if (line.startsWith('#')) break
    const row = cells(line)
    if (row === null) continue
    const slotCell = row[1]
    if (slotCell === undefined) continue
    if (slotCell === 'Slot' || /^:?-+:?$/.test(slotCell)) continue
    for (const match of slotCell.matchAll(/`([A-Z0-9_]+)`/g)) slots.push(match[1]!)
  }
  return slots
}

/**
 * §8-1, executable. `unassigned` is the criterion's own failure mode; `doubled`
 * is the other half — a slot the engine side supplies that the proxy's default
 * prompt also owns means the client can rewrite the agent's character.
 *
 * Two supplier sets naming the same slot on the SAME side is not doubling:
 * `TEMPERAMENT` sits in `GateView` and `RoundView` by requirement (§8-6), and
 * `BLOCKS` is named by both `PlayerSupplied` and `ComposerDeps` (K1). Those are
 * one supplier seen twice, which is why the split is engine-side vs proxy and
 * not set-vs-set.
 *
 * @throws when the slot list is empty — a parser that silently returned `[]`
 * would make the criterion vacuously green, which is the one failure this test
 * exists to prevent.
 */
export function closure(slots: readonly string[], suppliers: SupplierMap): ClosureResult {
  if (slots.length === 0) {
    throw new Error('the §6 supplier table parsed to zero slots — refusing a vacuous closure')
  }

  const proxy = new Set(suppliers[PROXY_SUPPLIER_KEY] ?? [])
  const engineSide = new Set<string>()
  for (const [name, supplied] of Object.entries(suppliers)) {
    if (name === PROXY_SUPPLIER_KEY) continue
    for (const slot of supplied) engineSide.add(slot)
  }

  return {
    unassigned: slots.filter((slot) => !engineSide.has(slot) && !proxy.has(slot)),
    doubled: slots.filter((slot) => engineSide.has(slot) && proxy.has(slot)),
  }
}

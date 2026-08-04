// [e10] contract-engine-composer §8 criterion 1, as one executable closure.
//
// A1/A2/A3/A4. The criterion is the one that keeps the contract honest — it has
// to go red the moment call contracts §6 gains a slot nobody assigned, so it is
// written as a test and not left as a review item.
//
// K3 — the supplier side is read from RUNTIME view values (`Object.keys()` of a
// live `gateView()`/`beatView()`/`roundView()`), never from the doc's own code
// block. Doc-vs-doc would stay green while the implementation silently dropped
// a slot.
// K2 — "in both" means engine-side ∩ proxy-owned. `TEMPERAMENT` sits in both
// `GateView` and `RoundView` *by requirement* (§8-6); that is one supplier seen
// through two views, not two suppliers.
import { describe, expect, it } from 'vitest'
import {
  DEP_KEY_TO_SLOT,
  PLAYER_SUPPLIED_SLOTS,
  PROXY_SUPPLIER_KEY,
  closure,
  docSlots,
} from './fixtures/closure.ts'
import type { SupplierMap } from './fixtures/closure.ts'
import { viewKeys } from './fixtures/rig.ts'
import { COMPOSER_DEP_SLOTS, PROXY_OWNED_SLOTS } from '../../src/engine/feed/slots.ts'

/** The §6 table as it reads today — the parser's expected output, sorted. */
const SECTION_6_SLOTS = [
  'AGENT_UTTERANCE',
  'BLOCKS',
  'EXPERIENCED',
  'FIXED_NPC_ACTION',
  'FLAW',
  'GATE_QUESTION',
  'INCIDENT',
  'PRESENT_NPCS',
  'PRIORITY_LIST',
  'REPORT_GUIDANCE',
  'SCENE_SYMPTOMS',
  'STANCE_SET',
  'TEMPERAMENT',
  'TIMELINE_EXCERPT',
  'TIMELINE_TAIL',
]

/** A2's floor: a parse that yields fewer rows than this is a broken parse. */
const MIN_SLOT_ROWS = 12

/** §8-1's union, with K1's sixth term made explicit rather than papered over. */
function liveSupply(): SupplierMap {
  const keys = viewKeys()
  return {
    GateView: keys.GateView,
    BeatView: keys.BeatView,
    RoundView: keys.RoundView,
    ComposerDeps: [...COMPOSER_DEP_SLOTS],
    PlayerSupplied: [...PLAYER_SUPPLIED_SLOTS],
    [PROXY_SUPPLIER_KEY]: [...PROXY_OWNED_SLOTS],
  }
}

describe('§8-1 every slot in call contracts §6 has exactly one supplier', () => {
  it('§8-1 the closure over the live views leaves no slot unassigned and none doubled', () => {
    const result = closure(docSlots(), liveSupply())
    expect(result.unassigned, 'slots §6 lists that nobody supplies').toEqual([])
    expect(result.doubled, 'slots supplied by both the engine side and the proxy').toEqual([])
  })

  it('A2 the §6 parse yields a real denominator — never a silently-empty one', () => {
    const slots = docSlots()
    expect(slots.length).toBeGreaterThanOrEqual(MIN_SLOT_ROWS)
    expect([...slots].sort()).toEqual(SECTION_6_SLOTS)
    expect(new Set(slots).size, 'the parser must not emit a slot twice').toBe(slots.length)
  })

  it('A3 an unassigned slot turns the criterion red', () => {
    const result = closure([...docSlots(), 'FAKE_SLOT'], liveSupply())
    expect(result.unassigned).toEqual(['FAKE_SLOT'])
    expect(result.doubled).toEqual([])
  })

  it('A4 a slot supplied by both the engine side and the proxy turns it red', () => {
    const poisoned: SupplierMap = { ...liveSupply(), GateView: [...viewKeys().GateView, 'FLAW'] }
    const result = closure(docSlots(), poisoned)
    expect(result.doubled).toContain('FLAW')
  })

  it('K2 TEMPERAMENT in both GateView and RoundView is NOT a double supply', () => {
    const keys = viewKeys()
    expect(keys.GateView).toContain('TEMPERAMENT')
    expect(keys.RoundView).toContain('TEMPERAMENT')
    expect(closure(docSlots(), liveSupply()).doubled).toEqual([])
  })

  it('K1 BLOCKS is named by two engine-side terms — the logged contract gap, not a double supply', () => {
    expect(PLAYER_SUPPLIED_SLOTS).toEqual(['BLOCKS'])
    expect(COMPOSER_DEP_SLOTS).toContain('BLOCKS')
    expect(closure(docSlots(), liveSupply()).doubled).toEqual([])
  })

  it('K4 the dependency-key map is one explicit literal covering ComposerDeps exactly', () => {
    const mapped = Object.values(DEP_KEY_TO_SLOT).sort()
    expect(mapped).toEqual([...COMPOSER_DEP_SLOTS].sort())
    for (const key of Object.keys(DEP_KEY_TO_SLOT)) {
      expect(key, 'a SNAKE_CASE key means a regex crept in').not.toMatch(/^[A-Z0-9_]+$/)
    }
  })

  it('A2 the parser reads the doc, not a hard-coded list — an empty section is an error', () => {
    // A parser that silently returns [] on a heading rename would make §8-1
    // vacuously green. `closure` must not accept an empty denominator.
    expect(() => closure([], liveSupply())).toThrow()
  })
})

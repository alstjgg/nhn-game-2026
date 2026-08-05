// [e8#A4] + [e8#A5] — the storage adapter is swappable through its interface.
// One table-driven behaviour suite runs against the memory store, the injected
// StorageLike store, and a bare ad-hoc object literal; then the StorageLike
// round-trip proves refresh survival and safe recovery from junk payloads.
import { describe, it, expect } from 'vitest'
import type { Block } from '../../src/shared/contracts.ts'
import type { MetaState, MetaStore, StorageLike } from '../../src/runloop/index.ts'
import {
  META_KEY_PREFIX,
  createMemoryMetaStore,
  createRunLoop,
  createWebStorageMetaStore,
  metaKey,
} from '../../src/runloop/index.ts'

const SLUG = 'dday-demo'
const b1: Block = { id: 'blk-alpha', text: '증인은 도착 시각을 기억한다' }

/** A hand-rolled StorageLike — no `sessionStorage`, no DOM, no globals. */
function fakeStorage(): StorageLike & { dump(): Record<string, string> } {
  const map = new Map<string, string>()
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, v),
    removeItem: (k) => void map.delete(k),
    dump: () => Object.fromEntries(map),
  }
}

/** A third store that satisfies MetaStore without either factory (A4). */
function adHocStore(): MetaStore {
  let held: MetaState | null = null
  return {
    load: () => (held ? (JSON.parse(JSON.stringify(held)) as MetaState) : null),
    save: (s) => {
      held = JSON.parse(JSON.stringify(s)) as MetaState
    },
  }
}

const STORES: [name: string, make: () => MetaStore][] = [
  ['createMemoryMetaStore()', () => createMemoryMetaStore()],
  ['createWebStorageMetaStore(fakeStorage)', () => createWebStorageMetaStore(fakeStorage(), SLUG)],
  ['ad-hoc { load, save } literal', () => adHocStore()],
]

describe.each(STORES)('[e8#A4] the same RunLoop behaviour over %s', (_name, make) => {
  it('(a) two runs: counter, archive, carry-over and exposure all land', () => {
    const rl = createRunLoop({ store: make(), packSlug: SLUG, totalRuns: 4 })
    rl.startRun()
    rl.endRun({ runId: 'run-0001', reachedClock: '13:05', carried: [b1] })
    const second = rl.startRun()

    expect(second.run).toBe(2)
    expect(second.carried).toEqual([b1])
    expect(second.exposureClock).toBe('13:05')

    const state = rl.current()
    expect(state.pack_slug).toBe(SLUG)
    expect(state.run_count).toBe(2)
    expect(state.report_archive).toEqual(['run-0001'])
    expect(state.exposure_clock_reached).toBe('13:05')
  })

  it('(b) an empty store yields a fresh state instead of throwing', () => {
    const rl = createRunLoop({ store: make(), packSlug: SLUG, totalRuns: 4 })
    expect(rl.current()).toEqual({
      pack_slug: SLUG,
      run_count: 0,
      exposure_clock_reached: null,
      carried_blocks: [],
      report_archive: [],
    })
  })

  it('(c) state is persisted through the adapter, not held only in the closure', () => {
    const store = make()
    const rl = createRunLoop({ store, packSlug: SLUG, totalRuns: 4 })
    rl.startRun()
    rl.endRun({ runId: 'run-0001', reachedClock: '12:00', carried: [b1] })

    const revived = createRunLoop({ store, packSlug: SLUG, totalRuns: 4 })
    expect(revived.current().run_count).toBe(1)
    expect(revived.current().carried_blocks).toEqual([b1])
    expect(revived.current().report_archive).toEqual(['run-0001'])
  })
})

describe('[e8#A5] StorageLike round-trip — refresh survival', () => {
  it('(a) the key is the prefixed slug and holds JSON the schema shape', () => {
    const storage = fakeStorage()
    const rl = createRunLoop({
      store: createWebStorageMetaStore(storage, SLUG),
      packSlug: SLUG,
      totalRuns: 4,
    })
    rl.startRun()
    rl.endRun({ runId: 'run-0001', reachedClock: '13:05', carried: [b1] })

    expect(metaKey(SLUG)).toBe(`${META_KEY_PREFIX}${SLUG}`)
    const raw = storage.getItem(metaKey(SLUG))
    expect(raw, 'nothing was written through the adapter').toBeTruthy()
    expect(JSON.parse(raw!)).toEqual(rl.current())
  })

  it('(b) a NEW createRunLoop over the same storage resumes at run 2', () => {
    const storage = fakeStorage()
    const first = createRunLoop({
      store: createWebStorageMetaStore(storage, SLUG),
      packSlug: SLUG,
      totalRuns: 4,
    })
    first.startRun()
    first.endRun({ runId: 'run-0001', reachedClock: '13:05', carried: [b1] })

    // the "refresh": a whole new loop + new adapter over the surviving storage
    const revived = createRunLoop({
      store: createWebStorageMetaStore(storage, SLUG),
      packSlug: SLUG,
      totalRuns: 4,
    })
    const second = revived.startRun()
    expect(second.run).toBe(2)
    expect(second.carried).toEqual([b1])
    expect(second.exposureClock).toBe('13:05')
  })

  it('(c) corrupt JSON → fresh state, no throw', () => {
    const storage = fakeStorage()
    storage.setItem(metaKey(SLUG), '{not json')
    let rl!: ReturnType<typeof createRunLoop>
    expect(() => {
      rl = createRunLoop({ store: createWebStorageMetaStore(storage, SLUG), packSlug: SLUG, totalRuns: 4 })
    }).not.toThrow()
    expect(rl.current().run_count).toBe(0)
    expect(rl.current().pack_slug).toBe(SLUG)
    expect(() => rl.startRun()).not.toThrow()
  })

  it('(d) a foreign/slug-mismatched payload → fresh state, never inherited', () => {
    const storage = fakeStorage()
    const foreign: MetaState = {
      pack_slug: 'some-other-pack',
      run_count: 3,
      exposure_clock_reached: '21:04+',
      carried_blocks: [b1],
      report_archive: ['run-9999'],
    }
    storage.setItem(metaKey(SLUG), JSON.stringify(foreign))

    const rl = createRunLoop({ store: createWebStorageMetaStore(storage, SLUG), packSlug: SLUG, totalRuns: 4 })
    expect(rl.current().run_count).toBe(0)
    expect(rl.current().report_archive).toEqual([])
    expect(rl.current().exposure_clock_reached).toBeNull()
  })

  it('(e) a structurally wrong payload (array / null / missing fields) → fresh state, no throw', () => {
    for (const junk of ['[]', 'null', '"a string"', '{"pack_slug":"dday-demo"}', '42']) {
      const storage = fakeStorage()
      storage.setItem(metaKey(SLUG), junk)
      const rl = createRunLoop({ store: createWebStorageMetaStore(storage, SLUG), packSlug: SLUG, totalRuns: 4 })
      expect(rl.current().run_count, `junk payload ${junk}`).toBe(0)
      expect(rl.current().carried_blocks).toEqual([])
    }
  })

  it('(f) two packs get two slots — switching packs inherits nothing', () => {
    const storage = fakeStorage()
    const a = createRunLoop({ store: createWebStorageMetaStore(storage, 'pack-a'), packSlug: 'pack-a', totalRuns: 4 })
    a.startRun()
    a.endRun({ runId: 'run-a1', reachedClock: '13:05', carried: [b1] })

    const b = createRunLoop({ store: createWebStorageMetaStore(storage, 'pack-b'), packSlug: 'pack-b', totalRuns: 4 })
    expect(b.current().run_count).toBe(0)
    expect(Object.keys(storage.dump()).sort()).toEqual([metaKey('pack-a')])

    b.startRun()
    expect(Object.keys(storage.dump()).sort()).toEqual([metaKey('pack-a'), metaKey('pack-b')].sort())
    expect(a.current().run_count).toBe(1)
  })

  it('(g) the memory store can be seeded, so e9 can substitute a pre-loaded state', () => {
    const seed: MetaState = {
      pack_slug: SLUG,
      run_count: 2,
      exposure_clock_reached: '13:05',
      carried_blocks: [b1],
      report_archive: ['run-0001', 'run-0002'],
    }
    const rl = createRunLoop({ store: createMemoryMetaStore(seed), packSlug: SLUG, totalRuns: 4 })
    expect(rl.current().run_count).toBe(2)
    expect(rl.startRun()).toEqual({ run: 3, carried: [b1], exposureClock: '13:05' })
  })
})

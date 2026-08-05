/**
 * The meta-state persistence seam (decision 15 / physical §1.1).
 *
 * `MetaStore` is the only way the run loop touches storage, so the browser can
 * bind the web-storage adapter while the headless driver (e9) substitutes an
 * in-memory one. Nothing in this folder reaches for a host global: the storage
 * object itself arrives as `StorageLike`, injected by whoever has one.
 */

import type { MetaState } from './meta-state.ts'
import { cloneMetaState, isMetaState } from './meta-state.ts'

export interface MetaStore {
  load(): MetaState | null
  save(state: MetaState): void
}

/** The slice of the Web Storage API this adapter needs — injected, never reached for. */
export interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export const META_KEY_PREFIX = 'dday.meta.'

/** One slot per pack — switching packs inherits nothing. */
export function metaKey(packSlug: string): string {
  return `${META_KEY_PREFIX}${packSlug}`
}

/** The substitution path: in-memory, optionally pre-seeded (e9's headless driver). */
export function createMemoryMetaStore(seed?: MetaState): MetaStore {
  let held: MetaState | null = seed === undefined ? null : cloneMetaState(seed)
  return {
    load: () => (held === null ? null : cloneMetaState(held)),
    save: (state) => {
      held = cloneMetaState(state)
    },
  }
}

/** The browser path: JSON under `metaKey(packSlug)` in an injected storage. */
export function createWebStorageMetaStore(storage: StorageLike, packSlug: string): MetaStore {
  const key = metaKey(packSlug)
  return {
    load: () => {
      const raw = storage.getItem(key)
      if (raw === null) return null
      let parsed: unknown
      try {
        parsed = JSON.parse(raw)
      } catch {
        return null // corrupt payload — start fresh rather than throw
      }
      if (!isMetaState(parsed) || parsed.pack_slug !== packSlug) return null
      return parsed
    },
    save: (state) => {
      storage.setItem(key, JSON.stringify(state))
    },
  }
}

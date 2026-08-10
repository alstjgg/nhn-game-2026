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

/** The stamp slot beside the state — see `createWebStorageMetaStore`. */
export function stampKey(packSlug: string): string {
  return `${META_KEY_PREFIX}stamp.${packSlug}`
}

/**
 * H2 — a page load is a new sitting, so both slots go together.
 *
 * The stamp without its state is a claim about nothing, and the state without
 * its stamp reads as another build's and would be dropped on the next load
 * anyway. Clearing is the caller's decision, not the store's: the store still
 * restores faithfully for anyone who wants a resume (the headless path does).
 */
export function clearWebStorageMetaStore(storage: StorageLike, packSlug: string): void {
  storage.removeItem(metaKey(packSlug))
  storage.removeItem(stampKey(packSlug))
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

/**
 * The browser path: JSON under `metaKey(packSlug)` in an injected storage.
 *
 * W1 — `stamp` is the sitting's identity (the client passes its build stamp).
 * A stored state is honoured only while the stamp saved beside it matches:
 * state left by another build reads as absent and both slots are dropped, so
 * a fresh visit is ECHO and only a genuine same-build reload resumes. No
 * stamp (the headless path) keeps the old behaviour.
 */
export function createWebStorageMetaStore(
  storage: StorageLike,
  packSlug: string,
  stamp?: string,
): MetaStore {
  const key = metaKey(packSlug)
  const stampAt = stampKey(packSlug)
  return {
    load: () => {
      if (stamp !== undefined && storage.getItem(stampAt) !== stamp) {
        storage.removeItem(key)
        storage.removeItem(stampAt)
        return null
      }
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
      if (stamp !== undefined) storage.setItem(stampAt, stamp)
      storage.setItem(key, JSON.stringify(state))
    },
  }
}

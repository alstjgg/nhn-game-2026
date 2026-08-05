/**
 * The run-loop manager's public surface (contract-engine-composer §9,
 * architecture-map's "Run-loop Manager").
 *
 * Owner: 윤석 (architecture track). e8 fills in the behaviour the e0 skeleton
 * declared, split by responsibility:
 *   · `meta-state.ts` — the persisted shape + the clock algebra
 *   · `store.ts`      — the persistence seam and its two adapters
 *   · `run-loop.ts`   — the multi-run behaviour itself
 *
 * Isomorphic (physical §3.1): the policy bot drives this headless, so
 * persistence is behind an injected `MetaStore` adapter (decision 15) rather
 * than a call to a host storage global — the browser binds the web-storage
 * adapter (physical §1.1), the headless driver substitutes its own.
 *
 * `MetaState`'s field names are `data/runs/_schema/meta-state.schema.json`'s —
 * that schema is the authority on the persisted shape, not this file.
 */

export * from './meta-state.ts'
export * from './store.ts'
export * from './run-loop.ts'

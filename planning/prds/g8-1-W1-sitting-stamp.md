# g8-1 — W1: the sitting stamp — a stored MetaState from another build is dropped

> plan-playtest v13 · citations bind to `21b2593` · branch `playtest/g8-1-w1-stamp`
> commit message: `playtest(W1): sessionStorage MetaState resumes only under its own build stamp — a fresh visit is ECHO-1`

## Outcome

민서's playtest opened on ECHO-2: the run counter lives in
`sessionStorage['dday.meta.<slug>']`, nothing ever clears it, and the live
composer trusts any `run_count > 0` as "resume". After this unit the stored
state carries the build's stamp beside it, and `load()` honours it only while
the stamps match — a redeploy under an open tab, or state left by an older
build, starts fresh at ECHO-1; a genuine same-build reload still resumes
(that behaviour is pinned by `tests/driver/live-desk.test.ts:241` and must
stay green). The headless/tools path passes no stamp and keeps the old
behaviour.

## Scope

May modify: `vite.config.ts` (the `define` block only) ·
`src/client/shell/build-stamp.d.ts` (**new**) · `src/runloop/store.ts` ·
`src/client/driver/live/index.ts` (`:33`, `:79`) ·
`src/client/shell/boot.ts` (`:87`) · `tests/runloop/store.test.ts` (append).

Must NOT modify: `src/runloop/run-loop.ts` and `src/runloop/meta-state.ts`
(the counter and the schema are correct — the bug is resume semantics);
`tests/driver/live-desk.test.ts` (its reload-resume pin stays green as-is —
`boot()` there passes no stamp); `tools/**` (memory store, no stamp).

## Change list

**1. `vite.config.ts:198-200`** — current:
```
  define: {
    __DEBUG_PANE__: JSON.stringify(mode !== 'production'),
  },
```
replace with:
```
  define: {
    __DEBUG_PANE__: JSON.stringify(mode !== 'production'),
    // W1 — the sitting stamp: the web meta store honours a stored MetaState
    // only while the stamp beside it matches this value, so a redeploy under
    // an open tab (or state from an older build) starts fresh at ECHO-1. In
    // dev the stamp is the constant 'dev', so HMR reloads keep resuming.
    __BUILD_STAMP__: JSON.stringify(mode !== 'production' ? 'dev' : new Date().toISOString()),
  },
```

**2. `src/client/shell/build-stamp.d.ts`** — new file, exactly (modelled on
`src/client/debug/flag.d.ts`):
```ts
// W1 — the build's identity, injected by vite.config.ts `define`. The web
// storage meta store keeps a stored `MetaState` only while the stamp saved
// beside it matches this value (src/runloop/store.ts). In dev it is the
// constant 'dev', so HMR reloads keep resuming.
declare const __BUILD_STAMP__: string
```

**3. `src/runloop/store.ts`** — two edits, bottom-up.

3a. The whole `createWebStorageMetaStore` function — cited by its first line
`:43` (`/** The browser path: JSON under `metaKey(packSlug)` in an injected storage. */`),
replaced through the function's closing `}` — with:
```ts
/**
 * The browser path: JSON under `metaKey(packSlug)` in an injected storage.
 *
 * W1 — `stamp` is the sitting's identity (the client passes its build stamp).
 * A stored state is honoured only while the stamp saved beside it matches:
 * state left by another build reads as absent and both slots are dropped, so
 * a fresh visit is ECHO-1 and only a genuine same-build reload resumes. No
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
```

3b. `:28-30` — current:
```
/** One slot per pack — switching packs inherits nothing. */
export function metaKey(packSlug: string): string {
  return `${META_KEY_PREFIX}${packSlug}`
}
```
replace with:
```
/** One slot per pack — switching packs inherits nothing. */
export function metaKey(packSlug: string): string {
  return `${META_KEY_PREFIX}${packSlug}`
}

/** The stamp slot beside the state — see `createWebStorageMetaStore`. */
export function stampKey(packSlug: string): string {
  return `${META_KEY_PREFIX}stamp.${packSlug}`
}
```

**4. `src/client/driver/live/index.ts`** — two edits, bottom-up.

4a. `:79` — current:
```
    store: createWebStorageMetaStore(deps.storage, deps.slug),
```
replace with:
```
    store: createWebStorageMetaStore(deps.storage, deps.slug, deps.stamp),
```

4b. `:33` — current:
```
  storage: StorageLike
```
replace with:
```
  storage: StorageLike
  /** W1 — the sitting stamp; a stored MetaState from another build is dropped. */
  stamp?: string
```

**5. `src/client/shell/boot.ts:87`** — current:
```
      storage: window.sessionStorage,
```
replace with:
```
      storage: window.sessionStorage,
      stamp: __BUILD_STAMP__,
```

**6. `tests/runloop/store.test.ts`** — two edits.

6a. Extend the existing import from `'../../src/runloop/store.ts'` (the list
that already carries `createWebStorageMetaStore`, around `:12`) with
`metaKey` and `stampKey`. If either name already appears, this row is a stop.

6b. Append at the very end of the file:
```ts
describe('[w1] the sitting stamp — state from another build is dropped', () => {
  it('(a) a matching stamp resumes; a changed stamp starts fresh and clears both slots', () => {
    const storage = fakeStorage()
    const rl = createRunLoop({
      store: createWebStorageMetaStore(storage, SLUG, 'build-1'),
      packSlug: SLUG,
      totalRuns: 4,
    })
    rl.startRun()
    expect(rl.current().run_count).toBe(1)

    const resumed = createRunLoop({
      store: createWebStorageMetaStore(storage, SLUG, 'build-1'),
      packSlug: SLUG,
      totalRuns: 4,
    })
    expect(resumed.current().run_count).toBe(1)

    const fresh = createRunLoop({
      store: createWebStorageMetaStore(storage, SLUG, 'build-2'),
      packSlug: SLUG,
      totalRuns: 4,
    })
    expect(fresh.current().run_count).toBe(0)
    expect(storage.getItem(metaKey(SLUG))).toBeNull()
    expect(storage.getItem(stampKey(SLUG))).toBeNull()
  })

  it('(b) no stamp keeps the legacy behaviour — any valid state resumes', () => {
    const storage = fakeStorage()
    const rl = createRunLoop({
      store: createWebStorageMetaStore(storage, SLUG, 'build-1'),
      packSlug: SLUG,
      totalRuns: 4,
    })
    rl.startRun()
    const legacy = createRunLoop({
      store: createWebStorageMetaStore(storage, SLUG),
      packSlug: SLUG,
      totalRuns: 4,
    })
    expect(legacy.current().run_count).toBe(1)
  })
})
```
(`fakeStorage`, `SLUG` and `createRunLoop` are already in this file's scope —
`:43`, `:93`. If any is missing, that is a stop.)

## Invariants

- **Reload resumes; only another build resets.** `live-desk.test.ts:241`'s
  four-⌘R pin must pass unchanged.
- **The runloop stays host-agnostic** — the stamp arrives as a parameter; no
  `import.meta`/`__BUILD_STAMP__` reference may appear under `src/runloop/`.
- **`meta-state.schema.json` untouched** — the stamp lives beside the state,
  never inside `MetaState`.
- The `define` is a literal the bundler folds, same doctrine as
  `__DEBUG_PANE__` (`vite.config.ts:192-197`).

## Verification

1. `npm run check` — green. 2. `npx vitest run` — green (the two new cases
included; `live-desk.test.ts` untouched and green). 3. `npm run build` — green.

## Done when

- [ ] All three commands exit 0.
- [ ] `npx vitest run tests/runloop/store.test.ts tests/driver/live-desk.test.ts`
      — all passing, including the new `[w1]` describe.
- [ ] `grep -rn "__BUILD_STAMP__\|import.meta" src/runloop/` prints nothing.
- [ ] Behavioural (via test (a)): a store bound with a different stamp reads
      `run_count 0` and both storage slots are cleared.
- [ ] Exactly one code commit on `playtest/g8-1-w1-stamp`, nothing pushed.

## If this PRD is wrong

```
An edit whose stated current text is not at the cited path and line is a defect
in this document, not a puzzle to solve. Do not search for the text elsewhere.
Do not adapt the edit to what you find. Do not skip ahead to the next edit.

Stop at the first mismatch and report:
  - the edits that applied, by path:line
  - the edit that did not, with the text actually present at that path and line
  - the commit you are working from: `git log -1 --format=%h`

Change nothing further, and open no PR. A report of this kind is a completed
run, not a failed one.
```

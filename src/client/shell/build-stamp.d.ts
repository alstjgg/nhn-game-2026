// W1 — the build's identity, injected by vite.config.ts `define`. The web
// storage meta store keeps a stored `MetaState` only while the stamp saved
// beside it matches this value (src/runloop/store.ts). In dev it is the
// constant 'dev', so HMR reloads keep resuming.
declare const __BUILD_STAMP__: string

// [e10] §8-7's door into the proxy tier.
//
// The criterion wants the composed payload run through the proxy's OWN
// validators, offline, never against AWS. e5 already built exactly that door
// and documented why it is one file: `tests/composer/proxy-bridge.ts` imports
// `proxy/src/calls.ts` + `types.ts` (which pull in `errors.ts` and nothing
// else — no `@aws-sdk`), and transcribes `handler.ts`'s non-exported envelope
// check with the line citation that is its drift guard.
//
// This module re-exports that door rather than opening a second one. A second
// transcription of `parseCallRequest` would be a second thing to keep in sync
// with `proxy/**`, which this unit may not touch at all.

export { CALL_SPECS, assertEnvelope, asProxyRequest } from '../../composer/proxy-bridge.ts'

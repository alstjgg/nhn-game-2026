/**
 * Payload composer — datapack + engine state + injected blocks → call slots.
 *
 * Owner: 윤석 (architecture track). Stub — but **not blocked on the engine**:
 * its input shape is fixed by
 * [contract-engine-composer.md](../../docs/contract-engine-composer.md) §3, so
 * this can be built against that contract before an engine exists.
 *
 * It does **not** read the datapack. Every scenario value arrives through an
 * engine view, so run position lives in one place (contract §7). And it does not
 * render prose: physical §3.10 puts both message layers in the proxy, so this
 * module assembles slot *values* into a `CallRequest`. The one exception is
 * `TEMPERAMENT`, which the proxy passes through as a string — see contract §4.
 *
 * Same purity requirement as the engine (§2 constraint 1): the Node driver
 * composes byte-identical payloads to the ones the browser composes, so no
 * DOM, no `fs`, no `fetch`, no clock, no randomness in here.
 */

export {}

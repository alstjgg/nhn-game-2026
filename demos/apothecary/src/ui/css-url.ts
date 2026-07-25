// css-url.ts — the ONE way this codebase turns a URL into a CSS `url("…")`
// value (PR #33, R2 on src/ui/portrait.ts:253).
//
// Every portrait/sprite painter interpolates a URL into an inline
// `background-image`. That is a CSS-value sink: a `"` plus a `)` in the string
// terminates the literal and lets the payload stack extra `url()` layers — in
// Chromium a fabricated second layer is actually FETCHED, so a remote URL in a
// generated portrait response becomes a beacon (player IP/UA to a third party).
//
// `src/ai/contract.ts`'s `isPortraitSheet` rejects such payloads at the boundary;
// this is the second half of the same defence, at the sink, so a future painter
// fed from a source that never passed that gate is still safe. Escaping — not
// validating — is this module's job: it never rejects, so a legitimate asset path
// or data: URL always still paints.
//
// Pure: no DOM, no timers, no logging.

/**
 * Characters that must never survive into the literal: the quote and the
 * parentheses that would end it, the backslash that could re-escape it, and the
 * whitespace/angle brackets CSS treats as value separators.
 */
const ESCAPE_RE = /["'()\\\s<>]/g;

/**
 * A CSS `url("…")` value for `url`, safe to assign to `style.backgroundImage`.
 * Percent-encodes anything that could terminate the literal (base64 payloads and
 * relative asset paths pass through byte for byte — `+`, `/`, `=`, `:`, `,`, `.`
 * and `-` are all left alone, so a `data:image/png;base64,…` URL is unchanged).
 */
export function cssUrl(url: string): string {
  // Hand-rolled percent-encoding, NOT encodeURIComponent: that function leaves
  // `'`, `(` and `)` untouched (they are unreserved marks), i.e. exactly the
  // characters a `url("…")` breakout needs. Every character in ESCAPE_RE is
  // ASCII, so one byte is one escape.
  const escaped = url.replace(
    ESCAPE_RE,
    (char) => `%${char.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0')}`,
  );
  return `url("${escaped}")`;
}

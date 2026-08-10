// [u9#c2] spec-client §3 invariant 2 (I12) — no digit ever renders for NPC state.
//
// "Symptom sentences arrive as data and are displayed verbatim; the tally's
// numbers are score, not state."
//
// SCOPE (P1-D scoping rule, [u9#c6]): **unit-scoped by selector**. The assert
// is bound to the feed's `npc` line — the one NPC channel that still reaches
// the DOM, x8 having stopped `symptom` from doing so (see `NPC_LINE_SELECTORS`)
// — and everything else is excluded *by name*, never by luck:
//
//   scoped   `.fl-npc .fl-c`                         ← NPC state, text only
//   excluded `.fl-t` (the per-line clock stamp)      ← chrome, not NPC state
//            `.clk-*` · `.tb-clock` · `.dd-*`        ← topbar clock / D-DAY
//            `.tly-*` · `.ledger` · `.th-*` · `.tr-*` ← tally = score
//
// Every selector on both lists is proven to exist on disk in (a) below, so a
// rename in u5/u7 breaks this assert loudly instead of silently widening or
// emptying its scope.
//
// The rendered-DOM half lives in `e2e/a11y.spec.ts` (`inv 2 · rendered DOM`):
// vitest runs in `environment: 'node'`, so no browser assert can live here.
//
// C3: nothing here asserts fixture CONTENT — only selectors, seam names and
// the shape of the code that paints them.
import { describe, expect, it } from 'vitest'
import path from 'node:path'
import {
  CLIENT,
  SRC,
  STYLES_DIR,
  blank,
  filesUnder,
  formatAll,
  locate,
  read,
  rel,
  stripUrls,
} from './invariant-utils.ts'
import type { Hit } from './invariant-utils.ts'

/**
 * The NPC channel this assert is scoped to — spec §3 inv 2's subject.
 *
 * x8 — ONE selector, not two. `.fl-symptom` was the other, and the symptom line
 * no longer reaches the DOM (민서, 08-10): `run-feed.ts` drops the kind before
 * `append`, and `win-live-feed.css` no longer carries a skin for it. Leaving it
 * listed would have made half this scope select nothing.
 *
 * Worth recording how it would have gone unnoticed: (a) below scans the RAW
 * stylesheet text, so the removal note in `win-live-feed.css`'s own header —
 * which of course names `.fl-symptom` — answered the existence check for it.
 * The rot the assert is built to catch would have been papered over by the
 * comment explaining the rot. The kind itself is untouched: it is still on the
 * frozen seam and still reaches Call 2, which is what `NPC_FEED_KINDS` and (d)
 * go on holding.
 */
const NPC_LINE_SELECTORS = ['.fl-npc'] as const
/**
 * The text-carrying node inside an NPC line (the clock stamp is a sibling).
 *
 * x11 — an NPC line has TWO text columns on the rendered desk now (민서, 08-10):
 * `.fl-c` types itself out and is `aria-hidden`, and an `.fl-sr` twin carries
 * the complete text for the `role="log"` to announce. `e2e/a11y.spec.ts` scopes
 * BOTH, because a digit heard is rendered as surely as a digit seen.
 *
 * This file stays on `.fl-c` alone, and that is not drift. Its scans are over
 * CSS RULES and SOURCE, not the DOM — and `.fl-sr` declares no rule of its own:
 * its box comes from `.sr-only` in `shell.css`, which is shared chrome (`#toast`
 * rides it too) and therefore not an NPC-scoped selector. There is no `.fl-sr`
 * rule for a `content:` to hide in, so widening the CSS scan to it would add no
 * reach at all — and, worse, would pass `(a)` below on the strength of the
 * COMMENT in `win-live-feed.css` that names it, which is exactly the rot x8
 * found when `.fl-symptom` went. `(e)` keeps that reasoning true.
 */
const NPC_TEXT_SELECTOR = '.fl-c'
/** The announced twin — asserted to stay ruleless by `(e)`, never scanned. */
const NPC_SR_SELECTOR = '.fl-sr'
/**
 * Excluded by name. Each one renders digits legitimately: the per-line and
 * topbar clocks are chrome, the tally is score.
 *
 * x4 — the ledger's table went with its sheet skin, so `.tly-table` / `.th-v` /
 * `.tr-v` name nothing any more. The day's digits are painted into the record's
 * LINES now: `.tly-lines` (the list) and `.tly-line` (one 집계 line). The
 * exclusion is the same one it always was — score is allowed digits, an NPC
 * line is not — re-pointed at the selectors that carry them.
 */
const EXCLUDED_SELECTORS = [
  '.fl-t',
  '.clk-digits',
  '.tb-clock',
  '.dd-value',
  '.dd-runs',
  '.ledger',
  '.tly-lines',
  '.tly-line',
] as const

/** The seam's own names for the two channels — a rename must break the scope. */
const NPC_FEED_KINDS = ['npc', 'symptom'] as const

const VIEW_DRIVER = 'src/shared/view-driver.ts'
const FEED_SHEET = path.join(STYLES_DIR, 'win-live-feed.css')

/** A digit that is not part of a CSS token/var name or a unit-bearing length. */
const DIGIT_RE = /\d/

function sheets(): { file: string; css: string }[] {
  return filesUnder(STYLES_DIR, '.css').map((p) => ({ file: rel(p), css: read(p) }))
}

function allSheetText(): string {
  return sheets().map((s) => s.css).join('\n')
}

/** Top-level rules whose selector list mentions any of `names`. */
function rulesMentioning(css: string, names: readonly string[]): { selector: string; body: string }[] {
  const out: { selector: string; body: string }[] = []
  for (const m of stripUrls(blank(css, 'css')).matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selector = m[1]!.trim()
    if (names.some((n) => selector.includes(n))) out.push({ selector, body: m[2]! })
  }
  return out
}

/** `content:` values declared by the given rules. */
function contentValues(rules: { selector: string; body: string }[]): { selector: string; value: string }[] {
  const out: { selector: string; value: string }[] = []
  for (const r of rules) {
    for (const m of r.body.matchAll(/(?:^|[;{])\s*content\s*:\s*([^;}]+)/g)) {
      out.push({ selector: r.selector, value: m[1]!.trim() })
    }
  }
  return out
}

/**
 * Client modules that PAINT an NPC channel — the source-level scan surface.
 *
 * `driver/` is excluded on purpose: by inv 12 it is view-agnostic and touches
 * no DOM, so a `kind: 'npc'` there is data in transit, not a rendered digit.
 * (`tests/driver/import-direction.test.ts` (j) is what holds that line.)
 */
function npcPaintingSources(): { file: string; text: string }[] {
  return filesUnder(CLIENT, '.ts')
    .map((p) => ({ file: rel(p), text: blank(read(p), 'ts') }))
    .filter((s) => !s.file.startsWith('src/client/driver/'))
    .filter((s) =>
      NPC_LINE_SELECTORS.some((n) => s.text.includes(n.slice(1))) ||
      NPC_FEED_KINDS.some((k) => new RegExp(`['"\`]${k}['"\`]`).test(s.text)),
    )
}

describe('[u9#c2] inv 2 — the scope is explicit, and it is real', () => {
  it('(a) every scoped and excluded selector exists in the stylesheets on disk', () => {
    const css = allSheetText()
    const missing = [...NPC_LINE_SELECTORS, NPC_TEXT_SELECTOR, ...EXCLUDED_SELECTORS].filter(
      (s) => !css.includes(s),
    )
    expect(missing, 'a selector this assert scopes by no longer exists — the scope has rotted').toEqual([])
  })

  it('(b) the scoped selectors and the excluded selectors are disjoint', () => {
    const overlap = EXCLUDED_SELECTORS.filter((e) =>
      ([...NPC_LINE_SELECTORS, NPC_TEXT_SELECTOR] as readonly string[]).includes(e),
    )
    expect(overlap).toEqual([])
  })

  it('(c) the per-line clock stamp is a SIBLING of the text node, not inside it', () => {
    // If `.fl-t` ever nests inside `.fl-c`, the scope would sweep the clock in
    // and this assert would start failing on chrome. Pin the shape.
    const feed = blank(read(FEED_SHEET), 'css')
    expect(feed.length, 'win-live-feed.css is missing').toBeGreaterThan(0)
    expect(formatAll(locate(rel(FEED_SHEET), feed, /\.fl-c\s+\.fl-t/))).toEqual([])
  })

  it('(e) the announced twin declares no rule of its own — the scope above stays honest', () => {
    // x11 — the load-bearing half of `NPC_TEXT_SELECTOR`'s note. This file's CSS
    // scan skips `.fl-sr` because there is nothing there to scan; the moment
    // somebody gives it a rule, that stops being true and a `content:` could
    // inject a digit into the one column an assistive-tech user actually
    // receives, unseen by every assert in this file.
    //
    // Comments are blanked first, on purpose: `win-live-feed.css`'s header
    // NAMES `.fl-sr` while explaining why it is styled elsewhere, and a raw
    // `includes` would read that prose as a rule — the same way x8's removal
    // note answered `(a)`'s existence check for a selector that had just been
    // deleted. If this fires: widen `NPC_TEXT_SELECTOR` to both columns and
    // rewrite its note, rather than deleting the new rule.
    const declared = rulesMentioning(allSheetText(), [NPC_SR_SELECTOR]).map((r) => r.selector)
    expect(declared, `${NPC_SR_SELECTOR} grew a rule — the NPC CSS scope must widen with it`).toEqual([])

    // …and the recipe it borrows instead is real, so the twin is actually
    // hidden. A visible `.fl-sr` would print every line on the paper twice.
    expect(allSheetText(), 'the shared sr-only recipe is gone — `.fl-sr` is visible').toContain('.sr-only')
  })

  it('(d) the seam still names both NPC channels (a rename must break this scope)', () => {
    const seam = read(path.join(SRC, 'shared/view-driver.ts'))
    expect(seam.length, `${VIEW_DRIVER} is missing`).toBeGreaterThan(0)
    const missing = NPC_FEED_KINDS.filter((k) => !new RegExp(`'${k}'`).test(seam))
    expect(missing, 'FeedKind no longer carries these channels').toEqual([])
  })
})

describe('[u9#c2] no digit is painted into an NPC channel', () => {
  it('(a) no CSS `content:` under an NPC selector injects a digit', () => {
    const offenders: string[] = []
    for (const { file, css } of sheets()) {
      const scoped = rulesMentioning(css, NPC_LINE_SELECTORS)
      for (const c of contentValues(scoped)) {
        if (DIGIT_RE.test(c.value.replace(/\\[0-9a-fA-F]{1,6}\s?/g, ''))) {
          offenders.push(`${file} — ${c.selector} { content: ${c.value} }`)
        }
      }
    }
    expect(offenders).toEqual([])
  })

  it('(b) no client module writes a digit literal into NPC line text', () => {
    // The shape that would violate inv 2: a template/string with a digit being
    // assigned to an NPC line's text node. Data passed through verbatim is
    // fine — inv 2 forbids the *client* minting a number for NPC state.
    const offenders: Hit[] = []
    for (const { file, text } of npcPaintingSources()) {
      offenders.push(
        ...locate(file, text, /(textContent|innerText|insertAdjacentText)\s*=?[^\n]{0,80}?['"`][^'"`\n]*\d[^'"`\n]*['"`]/),
      )
    }
    expect(formatAll(offenders)).toEqual([])
  })

  it('(c) no client module formats a count/percent/score into an NPC channel', () => {
    const offenders: Hit[] = []
    for (const { file, text } of npcPaintingSources()) {
      offenders.push(...locate(file, text, /\b(toFixed|toLocaleString|padStart)\s*\(/))
    }
    expect(formatAll(offenders)).toEqual([])
  })

  it('(d) the excluded surfaces are NOT scanned — tally and clock keep their digits', () => {
    // Proves the exclusion is by selector, not by luck: the tally sheet and the
    // topbar clock do carry digit-bearing rules, and this assert must not see
    // them.
    const scanned = sheets().flatMap(({ css }) => rulesMentioning(css, NPC_LINE_SELECTORS).map((r) => r.selector))
    const leaked = scanned.filter((s) => EXCLUDED_SELECTORS.some((e) => s.includes(e)))
    expect(leaked, 'an excluded selector was pulled into the NPC scope').toEqual([])
  })
})

describe('[u9#c2] the digit scanner has teeth', () => {
  // Synthetic samples only — the tree on disk is never edited to make a test
  // fire, and no fixture CONTENT is asserted (C3).
  const NPC_SAMPLE = ['const el = q(".fl-npc .fl-c")', 'el.textContent = "체온 39도"'].join('\n')
  const TALLY_SAMPLE = ['const el = q(".tly-table .tr-v")', 'el.textContent = "1200"'].join('\n')

  it('(a) it flags a digit written into an NPC-scoped node', () => {
    const found = locate('sample.ts', NPC_SAMPLE, /textContent\s*=[^\n]{0,80}?['"`][^'"`\n]*\d[^'"`\n]*['"`]/)
    expect(found).toHaveLength(1)
    expect(found[0]!.line).toBe(2)
  })

  it('(b) the same source, scoped to tally, is out of scope', () => {
    const inScope = NPC_LINE_SELECTORS.some((n) => TALLY_SAMPLE.includes(n.slice(1)))
    expect(inScope, 'the tally sample must not enter the NPC scope').toBe(false)
  })

  it('(c) a CSS pseudo-element counter under an NPC selector is caught', () => {
    const sample = '.fl-npc .fl-c::before{content:"3"}'
    const scoped = rulesMentioning(sample, NPC_LINE_SELECTORS)
    expect(scoped).toHaveLength(1)
    expect(contentValues(scoped).some((c) => DIGIT_RE.test(c.value))).toBe(true)
  })

  it('(d) a CSS escape sequence in `content` is not mistaken for a rendered digit', () => {
    const sample = '.fl-npc .fl-c::before{content:"\\2014"}'
    const scoped = rulesMentioning(sample, NPC_LINE_SELECTORS)
    const digits = contentValues(scoped).filter((c) =>
      DIGIT_RE.test(c.value.replace(/\\[0-9a-fA-F]{1,6}\s?/g, '')),
    )
    expect(digits).toEqual([])
  })
})

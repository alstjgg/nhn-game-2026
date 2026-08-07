// Test-only CSS reading helpers for the u1 style suite.
//
// NOT product code and NOT collected by vitest (`tests/**/*.test.ts` only) —
// u1 ships CSS only ([u1#c6]); this file exists so the five style suites do not
// each re-implement the same naive parser.
//
// The "parser" is deliberately regex-level: these are lint suites over hand
// written stylesheets, not a CSS engine. Everything is read from disk, nothing
// is imported from `src/`.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
export const STYLES_DIR = path.join(REPO, 'src/client/styles')
export const DESIGN_CSS = path.join(REPO, 'docs/design/phase2-ui/desktop.css')

/** The sheets u1 owns, in the aggregation order index.css must use ([u1#c4]). */
export const CORE_SHEETS = ['tokens.css', 'base.css', 'shell.css', 'paper.css'] as const
export const WINDOW_SHEETS = [
  'win-agent-file.css',
  'win-block-store.css',
  'win-live-feed.css',
  'win-reports.css',
] as const
export const ALL_SHEETS = [...CORE_SHEETS, ...WINDOW_SHEETS] as const

export const TOKENS_CSS = path.join(STYLES_DIR, 'tokens.css')
export const INDEX_CSS = path.join(STYLES_DIR, 'index.css')

/** Custom properties written by the runtime (u3's WindowFrame) rather than by tokens.css. */
export const RUNTIME_PROPS = new Set(['--x', '--y', '--w', '--h', '--z', '--delay'])

export function exists(p: string): boolean {
  return fs.existsSync(p)
}

/** File contents, or '' when the file does not exist (keeps RED failures readable). */
export function read(p: string): string {
  return fs.existsSync(p) && fs.statSync(p).isFile() ? fs.readFileSync(p, 'utf8') : ''
}

/** `.css` basenames actually present under src/client/styles, sorted. */
export function sheetsOnDisk(): string[] {
  if (!fs.existsSync(STYLES_DIR)) return []
  return fs
    .readdirSync(STYLES_DIR)
    .filter((f) => f.endsWith('.css'))
    .sort()
}

/** Every file under `dir`, absolute, recursive. */
export function walk(dir: string): string[] {
  if (!fs.existsSync(dir)) return []
  const out: string[] = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...walk(full))
    else out.push(full)
  }
  return out
}

export function rel(p: string): string {
  return path.relative(REPO, p).split(path.sep).join('/')
}

export function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, ' ')
}

/** Drop `url(...)` payloads — inline SVG data URIs are assets, not style literals. */
export function stripUrls(css: string): string {
  return css.replace(/url\(\s*(?:"[^"]*"|'[^']*'|[^)]*)\)/g, 'url(_)')
}

/** What the lint suites actually scan: no comments, no url() payloads. */
export function scannable(css: string): string {
  return stripUrls(stripComments(css))
}

export interface Declaration {
  readonly prop: string
  readonly value: string
}

/** Naive declaration scan over already-`scannable()` CSS. */
export function declarations(css: string): Declaration[] {
  const out: Declaration[] = []
  for (const m of css.matchAll(/(--[\w-]+|[a-zA-Z-]+)\s*:\s*([^;{}]+)(?=[;}])/g)) {
    out.push({ prop: m[1]!.trim(), value: m[2]!.trim() })
  }
  return out
}

/** Body text of every rule whose selector list matches `selectorRe` (top-level braces only). */
export function ruleBodies(css: string, selectorRe: RegExp): string[] {
  const out: string[] = []
  for (const m of scannable(css).matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selector = m[1]!.trim()
    if (selectorRe.test(selector)) out.push(m[2]!)
  }
  return out
}

/** Selector lists of every top-level rule. */
export function selectors(css: string): string[] {
  return [...scannable(css).matchAll(/([^{}]+)\{[^{}]*\}/g)].map((m) => m[1]!.trim())
}

/** `--name` → value for every custom property declared anywhere in `css`. */
export function customProps(css: string): Map<string, string> {
  const out = new Map<string, string>()
  for (const d of declarations(scannable(css))) {
    if (d.prop.startsWith('--')) out.set(d.prop, d.value.replace(/\s+/g, ' ').trim())
  }
  return out
}

/** Custom properties declared in the first `:root` block of `css`. */
export function rootProps(css: string): Map<string, string> {
  const bodies = ruleBodies(css, /(^|,)\s*:root\s*$/)
  return customProps(bodies.join(';') + ';')
}

/** Every `var(--x)` reference in `css`. */
export function varRefs(css: string): string[] {
  return [...scannable(css).matchAll(/var\(\s*(--[\w-]+)/g)].map((m) => m[1]!)
}

const NAMED_COLORS = [
  'white', 'black', 'red', 'green', 'blue', 'gray', 'grey', 'silver', 'navy', 'teal', 'olive',
  'maroon', 'purple', 'fuchsia', 'lime', 'aqua', 'cyan', 'magenta', 'yellow', 'orange', 'gold',
  'beige', 'ivory', 'tan', 'brown', 'pink', 'crimson', 'khaki', 'linen', 'wheat', 'plum', 'coral',
  'salmon', 'orchid', 'indigo', 'violet', 'turquoise', 'azure', 'snow', 'lavender', 'chocolate',
  'darkgray', 'darkgrey', 'lightgray', 'lightgrey', 'whitesmoke',
]
const NAMED_COLOR_RE = new RegExp(`\\b(${NAMED_COLORS.join('|')})\\b`, 'gi')
const HEX_RE = /#[0-9a-fA-F]{3,8}\b/g
const COLOR_FN_RE = /\b(rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\s*\([^)]*\)/gi

function normalizeHex(hex: string): string {
  const body = hex.slice(1).toLowerCase()
  if (body.length === 3) return `#${body[0]}${body[0]}${body[1]}${body[1]}${body[2]}${body[2]}`
  if (body.length === 4) return `#${body[0]}${body[0]}${body[1]}${body[1]}${body[2]}${body[2]}${body[3]}${body[3]}`
  return `#${body}`
}

/**
 * Color literals in `text` (already `scannable()`), normalized for comparison.
 * Hex is expanded to 6/8 digits; color functions are whitespace-stripped.
 */
export function colorLiterals(text: string): string[] {
  const out: string[] = []
  for (const m of text.matchAll(HEX_RE)) {
    const len = m[0].length - 1
    if (len === 3 || len === 4 || len === 6 || len === 8) out.push(normalizeHex(m[0]))
  }
  for (const m of text.matchAll(COLOR_FN_RE)) out.push(m[0].toLowerCase().replace(/\s+/g, ''))
  for (const m of text.matchAll(NAMED_COLOR_RE)) out.push(m[0].toLowerCase())
  return out
}

/** Color literals appearing in declaration *values* only (property names are exempt). */
export function colorLiteralsInValues(css: string): string[] {
  const out: string[] = []
  for (const d of declarations(scannable(css))) out.push(...colorLiterals(d.value))
  return out
}

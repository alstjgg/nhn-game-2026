// Test-only helpers for the u9 structural-assert suite (P1-D).
//
// NOT product code and NOT collected by vitest (`tests/**/*.test.ts` only) —
// same precedent as `tests/styles/css-utils.ts` (u1) and
// `tests/shell/shell-utils.ts` (u3). Everything is read from disk with a
// deliberately regex-level parser: these are lint suites over hand-written
// sources, not a compiler, and they import nothing from `src/`.
//
// What this file adds over the two earlier helper modules:
//   • `locate()` — every offender is reported as `file:line`, which is what
//     [u9#c1] asks for and what makes a RED here actionable.
//   • `playerBuildGraph()` — the module set actually reachable from the Vite
//     entry in `index.html`. "The player build" is a reachability question,
//     not a directory question, so the asserts scope by the graph and any
//     allowlisted file must be *proven* unreachable (see ALLOWLIST use sites).
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
export const SRC = path.join(REPO, 'src')
export const CLIENT = path.join(SRC, 'client')
export const DRIVER = path.join(CLIENT, 'driver')
export const STYLES_DIR = path.join(CLIENT, 'styles')
export const TOKENS_CSS = path.join(STYLES_DIR, 'tokens.css')
export const INDEX_HTML = path.join(REPO, 'index.html')

export function exists(p: string): boolean {
  return fs.existsSync(p)
}

/** File contents, or '' when absent (keeps RED failures readable). */
export function read(p: string): string {
  return fs.existsSync(p) && fs.statSync(p).isFile() ? fs.readFileSync(p, 'utf8') : ''
}

export function rel(p: string): string {
  return path.relative(REPO, p).split(path.sep).join('/')
}

export function abs(repoRelative: string): string {
  return path.join(REPO, repoRelative)
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

export function filesUnder(dir: string, ext: string): string[] {
  return walk(dir).filter((f) => f.endsWith(ext)).sort()
}

/** Strip `//` and `/* *\/` comments so a scan reads code, not prose. */
export function stripComments(text: string): string {
  return text.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1 ')
}

/** Strip `<!-- -->` comments from markup. */
export function stripHtmlComments(html: string): string {
  return html.replace(/<!--[\s\S]*?-->/g, ' ')
}

/** Drop `url(...)` payloads — inline data URIs are assets, not style literals. */
export function stripUrls(css: string): string {
  return css.replace(/url\(\s*(?:"[^"]*"|'[^']*'|[^)]*)\)/g, 'url(_)')
}

export interface Hit {
  /** Repo-relative path. */
  readonly file: string
  /** 1-based line number. */
  readonly line: number
  /** The matched text, trimmed. */
  readonly match: string
}

/** `file:line — match`, the one offender format this whole suite reports in. */
export function format(hit: Hit): string {
  return `${hit.file}:${hit.line} — ${hit.match}`
}

export function formatAll(hits: Hit[]): string[] {
  return hits.map(format)
}

/**
 * Every match of `re` in `text`, as `{ file, line, match }`.
 *
 * `text` must be the *blanked* text (comments replaced by whitespace, never
 * deleted) so line numbers still line up with the file on disk. `blank()`
 * below is the comment stripper that preserves them.
 */
export function locate(file: string, text: string, re: RegExp): Hit[] {
  const flags = re.flags.includes('g') ? re.flags : `${re.flags}g`
  const out: Hit[] = []
  for (const m of text.matchAll(new RegExp(re.source, flags))) {
    const before = text.slice(0, m.index ?? 0)
    out.push({
      file,
      line: before.split('\n').length,
      match: m[0].trim().replace(/\s+/g, ' ').slice(0, 120),
    })
  }
  return out
}

/** Replace comment bodies with spaces — kills the text, keeps every newline. */
export function blank(text: string, kind: 'ts' | 'css' | 'html' = 'ts'): string {
  const keepLines = (s: string) => s.replace(/[^\n]/g, ' ')
  if (kind === 'html') return text.replace(/<!--[\s\S]*?-->/g, keepLines)
  const noBlocks = text.replace(/\/\*[\s\S]*?\*\//g, keepLines)
  if (kind === 'css') return noBlocks
  return noBlocks.replace(/(^|[^:])\/\/[^\n]*/g, (m, p1: string) => p1 + keepLines(m.slice(p1.length)))
}

/* ── module graph ─────────────────────────────────────────────────────── */

const FROM_RE = /(?:^|\n)\s*(?:import|export)[\s\S]*?from\s*['"]([^'"]+)['"]/g
const BARE_RE = /(?:^|\n)\s*import\s*['"]([^'"]+)['"]/g
const DYNAMIC_RE = /\bimport\(\s*['"]([^'"]+)['"]\s*\)/g
const CSS_IMPORT_RE = /@import\s*(?:url\(\s*)?['"]([^'"]+)['"]/g

/** Every module specifier `file` (repo-relative) imports, re-exports or `import()`s. */
export function specifiersOf(file: string): string[] {
  const source = read(abs(file))
  const text = file.endsWith('.css') ? stripComments(source) : stripComments(source)
  const out: string[] = []
  const res = file.endsWith('.css') ? [CSS_IMPORT_RE] : [FROM_RE, BARE_RE, DYNAMIC_RE]
  for (const re of res) for (const m of text.matchAll(re)) out.push(m[1]!)
  return out
}

/** Resolve a relative specifier against `file`; null for bare/package ids. */
export function resolveSpecifier(file: string, spec: string): string | null {
  if (!spec.startsWith('.')) return null
  const target = path.resolve(path.dirname(abs(file)), spec)
  for (const candidate of [target, `${target}.ts`, path.join(target, 'index.ts')]) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return rel(candidate)
  }
  return rel(target)
}

export interface Edge {
  readonly from: string
  readonly to: string
  readonly spec: string
}

/** Relative-import edges out of `files` (repo-relative paths). */
export function edgesOf(files: string[]): Edge[] {
  const out: Edge[] = []
  for (const f of files) {
    for (const spec of specifiersOf(f)) {
      const to = resolveSpecifier(f, spec)
      if (to) out.push({ from: f, to, spec })
    }
  }
  return out
}

/** The `<script type="module" src>` entries index.html declares, repo-relative. */
export function htmlEntries(): string[] {
  const html = stripHtmlComments(read(INDEX_HTML))
  const out: string[] = []
  for (const m of html.matchAll(/<script[^>]*\btype\s*=\s*["']module["'][^>]*\bsrc\s*=\s*["']([^"']+)["']/g)) {
    out.push(m[1]!.replace(/^\//, ''))
  }
  return out
}

/**
 * Every module reachable from index.html's entries — the player build.
 *
 * A file NOT in this set ships in no bundle the player ever loads, which is
 * the only honest basis for an inv-8 / inv-1 allowlist entry.
 */
export function playerBuildGraph(): Set<string> {
  const seen = new Set<string>()
  const queue = htmlEntries()
  while (queue.length > 0) {
    const file = queue.shift()!
    if (seen.has(file) || !fs.existsSync(abs(file))) continue
    seen.add(file)
    for (const spec of specifiersOf(file)) {
      const to = resolveSpecifier(file, spec)
      if (to && !seen.has(to)) queue.push(to)
    }
  }
  return seen
}

/* ── style literals ───────────────────────────────────────────────────── */

export const NAMED_COLORS = [
  'white', 'black', 'red', 'green', 'blue', 'gray', 'grey', 'silver', 'navy', 'teal', 'olive',
  'maroon', 'purple', 'fuchsia', 'lime', 'aqua', 'cyan', 'magenta', 'yellow', 'orange', 'gold',
  'beige', 'ivory', 'tan', 'brown', 'pink', 'crimson', 'khaki', 'linen', 'wheat', 'plum', 'coral',
  'salmon', 'orchid', 'indigo', 'violet', 'turquoise', 'azure', 'snow', 'lavender', 'chocolate',
  'darkgray', 'darkgrey', 'lightgray', 'lightgrey', 'whitesmoke',
]

export const HEX_RE = /#[0-9a-fA-F]{3,8}\b/
export const COLOR_FN_RE = /\b(rgba?|hsla?|hwb|lab|lch|oklab|oklch)\s*\(/
export const NAMED_COLOR_RE = new RegExp(`\\b(${NAMED_COLORS.join('|')})\\b`, 'i')
/** A CSS length that is not zero and not a percentage — the size-literal shape. */
export const LENGTH_RE = /(?<![\w-])-?\d*\.?\d+(px|rem|em|pt|ch|vh|vw)\b/
export const FONT_LITERAL_RE = /\bfont(-family|-size)?\s*[:=]\s*['"`]?[^;'"`\n]*['"`]?/i

/** Hex literals of a real CSS length (3/4/6/8 digits) — `#ddayNum` is not one. */
export function hexHits(file: string, text: string): Hit[] {
  return locate(file, text, HEX_RE).filter((h) => [4, 5, 7, 9].includes(h.match.length))
}

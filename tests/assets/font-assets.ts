// Test-only helpers for the u10 webfont suite.
//
// NOT product code and NOT collected by vitest (`tests/**/*.test.ts` only).
// Everything is read from disk; nothing is imported from `src/`.
//
// The @font-face "parser" is deliberately regex-level: these are lint suites
// over a hand-written stylesheet, not a CSS engine.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
export const FONTS_DIR = path.join(REPO, 'public/assets/fonts')
export const STYLES_DIR = path.join(REPO, 'src/client/styles')
export const FONTS_CSS = path.join(STYLES_DIR, 'fonts.css')
export const INDEX_CSS = path.join(STYLES_DIR, 'index.css')
export const TOKENS_CSS = path.join(STYLES_DIR, 'tokens.css')
export const MANIFEST = path.join(REPO, 'assets-manifest.json')
export const DIST = path.join(REPO, 'dist')
export const SCENARIO_DIR = path.join(REPO, 'data/scenario/우는다리')

/** The three families of the port target (docs/design/phase2-ui/index.html lines 7–9). */
export const IBM_PLEX_MONO = 'IBM Plex Mono'
export const NANUM_GOTHIC_CODING = 'Nanum Gothic Coding'
export const NANUM_MYEONGJO = 'Nanum Myeongjo'

/** Korean faces — the ones spec-client §9 wants sliced per `unicode-range`. */
export const KOREAN_FAMILIES = [NANUM_GOTHIC_CODING, NANUM_MYEONGJO] as const
export const ALL_FAMILIES = [IBM_PLEX_MONO, NANUM_GOTHIC_CODING, NANUM_MYEONGJO] as const

/**
 * Exact family/weight/style set of the design target's Google Fonts link:
 * `IBM+Plex+Mono:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400
 *  &Nanum+Gothic+Coding:wght@400;700
 *  &Nanum+Myeongjo:wght@400;700;800`
 */
export const EXPECTED_FACES: ReadonlyArray<{ family: string; weight: number; style: 'normal' | 'italic' }> = [
  { family: IBM_PLEX_MONO, weight: 300, style: 'normal' },
  { family: IBM_PLEX_MONO, weight: 400, style: 'normal' },
  { family: IBM_PLEX_MONO, weight: 500, style: 'normal' },
  { family: IBM_PLEX_MONO, weight: 600, style: 'normal' },
  { family: IBM_PLEX_MONO, weight: 700, style: 'normal' },
  { family: IBM_PLEX_MONO, weight: 400, style: 'italic' },
  { family: NANUM_GOTHIC_CODING, weight: 400, style: 'normal' },
  { family: NANUM_GOTHIC_CODING, weight: 700, style: 'normal' },
  { family: NANUM_MYEONGJO, weight: 400, style: 'normal' },
  { family: NANUM_MYEONGJO, weight: 700, style: 'normal' },
  { family: NANUM_MYEONGJO, weight: 800, style: 'normal' },
]

/** Hosts a self-hosted build may never talk to (spec-client §3 inv 10). */
export const THIRD_PARTY_MARKERS = [
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'googleapis.com',
  'gstatic.com',
  'cdn.jsdelivr.net',
  'unpkg.com',
  'use.typekit.net',
]

export function exists(p: string): boolean {
  return fs.existsSync(p)
}

/** File contents, or '' when the file does not exist (keeps RED failures readable). */
export function read(p: string): string {
  return fs.existsSync(p) && fs.statSync(p).isFile() ? fs.readFileSync(p, 'utf8') : ''
}

export function readJson<T>(p: string): T {
  return JSON.parse(read(p) || 'null') as T
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
  return out.sort()
}

export function rel(p: string): string {
  return path.relative(REPO, p).split(path.sep).join('/')
}

export function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, ' ')
}

export interface ParsedFace {
  /** Raw `@font-face { … }` body, comments stripped. */
  readonly body: string
  readonly family: string
  readonly weight: string
  readonly style: string
  readonly display: string
  /** Every `url(...)` payload in `src`, unquoted. */
  readonly srcUrls: readonly string[]
  /** Raw `unicode-range` value, '' when the face declares none. */
  readonly unicodeRange: string
  /** 1-based index of the block in the sheet (for readable failures). */
  readonly index: number
}

function decl(body: string, prop: string): string {
  const m = new RegExp(`(?:^|[;{])\\s*${prop}\\s*:\\s*([^;}]+)`, 'i').exec(body)
  return m ? m[1].trim() : ''
}

function unquote(value: string): string {
  return value.trim().replace(/^['"]|['"]$/g, '')
}

/** Every `@font-face` block in `css`, in source order. */
export function parseFontFaces(css: string): ParsedFace[] {
  const clean = stripComments(css)
  const out: ParsedFace[] = []
  for (const m of clean.matchAll(/@font-face\s*\{([^{}]*)\}/g)) {
    const body = m[1]
    const src = decl(body, 'src')
    const srcUrls = [...src.matchAll(/url\(\s*("[^"]*"|'[^']*'|[^)]*)\s*\)/g)].map((u) => unquote(u[1]))
    out.push({
      body,
      family: unquote(decl(body, 'font-family')),
      weight: decl(body, 'font-weight'),
      style: decl(body, 'font-style') || 'normal',
      display: decl(body, 'font-display'),
      srcUrls,
      unicodeRange: decl(body, 'unicode-range'),
      index: out.length + 1,
    })
  }
  return out
}

export function facesOf(faces: readonly ParsedFace[], family: string): ParsedFace[] {
  return faces.filter((f) => f.family.toLowerCase() === family.toLowerCase())
}

export interface CodepointRange {
  readonly start: number
  readonly end: number
}

/**
 * Parse a CSS `unicode-range` value into inclusive codepoint ranges.
 * Supports `U+0-7F`, `U+30??`, `U+AC00-D7A3` and comma lists.
 * Throws on anything the CSS grammar would reject — the suites assert on that.
 */
export function parseUnicodeRange(value: string): CodepointRange[] {
  const out: CodepointRange[] = []
  for (const rawPart of value.split(',')) {
    const part = rawPart.trim()
    if (part === '') continue
    const m = /^u\+([0-9a-f?]{1,6})(?:-([0-9a-f]{1,6}))?$/i.exec(part)
    if (!m) throw new Error(`unparseable unicode-range token: "${part}"`)
    const head = m[1]
    if (head.includes('?')) {
      if (m[2] !== undefined) throw new Error(`wildcard token may not carry a range end: "${part}"`)
      out.push({
        start: parseInt(head.replace(/\?/g, '0'), 16),
        end: parseInt(head.replace(/\?/g, 'F'), 16),
      })
      continue
    }
    const start = parseInt(head, 16)
    const end = m[2] === undefined ? start : parseInt(m[2], 16)
    if (end < start) throw new Error(`inverted unicode-range token: "${part}"`)
    out.push({ start, end })
  }
  if (out.length === 0) throw new Error(`empty unicode-range value: "${value}"`)
  return out
}

export function rangesCover(ranges: readonly CodepointRange[], cp: number): boolean {
  return ranges.some((r) => cp >= r.start && cp <= r.end)
}

/** Union of every declared `unicode-range` across `faces` (unparseable values throw). */
export function unionRanges(faces: readonly ParsedFace[]): CodepointRange[] {
  return faces.flatMap((f) => (f.unicodeRange ? parseUnicodeRange(f.unicodeRange) : []))
}

const HANGUL_BLOCKS: readonly CodepointRange[] = [
  { start: 0x1100, end: 0x11ff }, // Jamo
  { start: 0x3130, end: 0x318f }, // Compatibility Jamo
  { start: 0xa960, end: 0xa97f }, // Jamo Extended-A
  { start: 0xac00, end: 0xd7a3 }, // Syllables
  { start: 0xd7b0, end: 0xd7ff }, // Jamo Extended-B
]

export function isHangul(cp: number): boolean {
  return rangesCover(HANGUL_BLOCKS, cp)
}

/** Raw text of the shipped scenario pack — the Korean corpus the client renders. */
export function scenarioCorpus(): string {
  return walk(SCENARIO_DIR)
    .filter((p) => /\.(json|md)$/.test(p))
    .map((p) => fs.readFileSync(p, 'utf8'))
    .join('\n')
}

function codepointsOf(text: string, keep: (cp: number) => boolean): number[] {
  const set = new Set<number>()
  for (const ch of text) {
    const cp = ch.codePointAt(0)
    if (cp !== undefined && keep(cp)) set.add(cp)
  }
  return [...set].sort((a, b) => a - b)
}

/** Distinct Hangul codepoints appearing in the scenario pack. */
export function corpusHangul(): number[] {
  return codepointsOf(scenarioCorpus(), isHangul)
}

/** Distinct printable-ASCII codepoints appearing in the scenario pack. */
export function corpusLatin(): number[] {
  return codepointsOf(scenarioCorpus(), (cp) => cp >= 0x20 && cp <= 0x7e)
}

export function toHex(cp: number): string {
  return `U+${cp.toString(16).toUpperCase().padStart(4, '0')} (${String.fromCodePoint(cp)})`
}

/** Every font binary shipped under public/assets/fonts, repo-relative. */
export function fontFilesOnDisk(): string[] {
  return walk(FONTS_DIR)
    .filter((p) => /\.(woff2?|ttf|otf|eot)$/i.test(p))
    .map(rel)
}

/** `true` when the file starts with the WOFF2 signature `wOF2`. */
export function isWoff2(absPath: string): boolean {
  if (!fs.existsSync(absPath)) return false
  const fd = fs.openSync(absPath, 'r')
  try {
    const head = Buffer.alloc(4)
    fs.readSync(fd, head, 0, 4, 0)
    return head.toString('latin1') === 'wOF2'
  } finally {
    fs.closeSync(fd)
  }
}

export function fileSize(absPath: string): number {
  return fs.existsSync(absPath) ? fs.statSync(absPath).size : 0
}

/**
 * The `assets/fonts/...` tail of a `src: url(...)` payload — the path the dev
 * server and the built bundle both serve public assets from. Returns '' when
 * the url does not point into the self-hosted font directory.
 */
export function publicFontPath(url: string): string {
  const m = /assets\/fonts\/(.+)$/.exec(url.split('?')[0]);
  return m ? `assets/fonts/${m[1]}` : ''
}

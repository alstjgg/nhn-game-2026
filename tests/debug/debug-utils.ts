// Test-only helpers for the u9d debug-pane suite.
//
// NOT product code and NOT collected by vitest (`tests/**/*.test.ts` only).
// Follows the u1/u3 precedent (`tests/styles/css-utils.ts`,
// `tests/shell/shell-utils.ts`): everything is read from disk with a
// deliberately regex-level parser. These are lint suites over hand-written
// sources plus one real `vite build`, not a compiler.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
export const CLIENT = path.join(REPO, 'src/client')
export const DEBUG_DIR = path.join(CLIENT, 'debug')
export const MAIN_TS = path.join(CLIENT, 'main.ts')
export const VITE_CONFIG = path.join(REPO, 'vite.config.ts')
export const INDEX_HTML = path.join(REPO, 'index.html')

/** The build-time flag that gates the pane ([u9d#c2], [u9d#c6]). */
export const FLAG = '__DEBUG_PANE__'

/**
 * The entry `main.ts` calls behind the flag guard, and the literal marker the
 * flag-off bundle grep hunts for. Both are part of this unit's pinned contract
 * — see `.claude/super/units/u9d/tests.md`.
 */
export const ENTRY_EXPORT = 'startDebugPane'
export const PANE_MARKER = 'nhn:debug-pane'

/** The pane's own root element id — the second bundle marker. */
export const PANE_ID = 'debug-pane'

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

export function tsFiles(dir: string): string[] {
  return walk(dir).filter((f) => /\.tsx?$/.test(f))
}

export interface Source {
  readonly file: string
  readonly text: string
}

/** Every `.ts` under `src/client/debug/`, repo-relative + contents. */
export function debugSources(): Source[] {
  return tsFiles(DEBUG_DIR).map((f) => ({ file: rel(f), text: read(f) }))
}

/** Every `.ts` under `src/client/` that this unit does NOT own. */
export function nonDebugClientSources(): Source[] {
  return tsFiles(CLIENT)
    .filter((f) => !f.startsWith(DEBUG_DIR + path.sep))
    .map((f) => ({ file: rel(f), text: read(f) }))
}

/** Strip `//` and block comments so a scan reads code, not prose. */
export function stripComments(text: string): string {
  return text.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1 ')
}

/** Every module specifier imported or re-exported by `text`. */
export function specifiers(text: string): string[] {
  const src = stripComments(text)
  const out: string[] = []
  for (const m of src.matchAll(/(?:^|\n)\s*(?:import|export)[\s\S]*?from\s*['"]([^'"]+)['"]/g)) out.push(m[1]!)
  for (const m of src.matchAll(/(?:^|\n)\s*import\s*['"]([^'"]+)['"]/g)) out.push(m[1]!)
  for (const m of src.matchAll(/\bimport\(\s*['"]([^'"]+)['"]\s*\)/g)) out.push(m[1]!)
  return out
}

/** Repo-relative target of a relative specifier, or null for bare ids. */
export function targetOf(file: string, spec: string): string | null {
  if (!spec.startsWith('.')) return null
  return path
    .relative(REPO, path.resolve(path.dirname(path.join(REPO, file)), spec))
    .split(path.sep)
    .join('/')
}

export interface Edge {
  readonly from: string
  readonly to: string
  readonly spec: string
}

export function edges(sources: Source[]): Edge[] {
  const out: Edge[] = []
  for (const s of sources) {
    for (const spec of specifiers(s.text)) {
      const to = targetOf(s.file, spec)
      if (to) out.push({ from: s.file, to, spec })
    }
  }
  return out
}

/** Every single/double/backtick string literal in `text`, comments stripped. */
export function stringLiterals(text: string): string[] {
  const src = stripComments(text)
  const out: string[] = []
  for (const m of src.matchAll(/'([^'\\\n]*)'|"([^"\\\n]*)"|`([^`\\$]*)`/g)) {
    out.push(m[1] ?? m[2] ?? m[3] ?? '')
  }
  return out.filter((s) => s.length > 0)
}

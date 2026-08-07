// Test-only helpers for the u3 shell suite.
//
// NOT product code and NOT collected by vitest (`tests/**/*.test.ts` only).
// Mirrors the u1 precedent in `tests/styles/css-utils.ts`: everything is read
// from disk with a deliberately regex-level parser — these are lint suites over
// hand-written sources, not a compiler.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

export const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
export const CLIENT = path.join(REPO, 'src/client')
export const SHELL_DIR = path.join(CLIENT, 'shell')
export const COMPONENTS_DIR = path.join(CLIENT, 'components')
export const WINDOWS_DIR = path.join(CLIENT, 'windows')
export const INDEX_HTML = path.join(REPO, 'index.html')

/** The four window keys, in the order the taskbar and applyLayout must use. */
export const WINDOW_KEYS = ['feed', 'file', 'rep'] as const
export type WindowKey = (typeof WINDOW_KEYS)[number]

/** `windows/<module>.ts` per key — the merge surface m3 depends on ([u3#c6]). */
export const WINDOW_MODULES: Readonly<Record<WindowKey, string>> = {
  feed: 'live-feed.ts',
  file: 'agent-file.ts',
  rep: 'reports.ts',
}

/** The shell-owned registry module ([u3#c6]). */
export const REGISTRY_TS = path.join(SHELL_DIR, 'window-registry.ts')

/** The pure viewport→arrangement module ([u3#c2]). */
export const LAYOUT_TS = path.join(SHELL_DIR, 'layout.ts')

/** A dynamic-import specifier for an absolute path on any platform. */
export function importable(p: string): string {
  return pathToFileURL(p).href
}

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
  return walk(dir).filter((f) => f.endsWith('.ts'))
}

/** Every `.ts` under `src/client/`, absolute. */
export function clientSources(): string[] {
  return tsFiles(CLIENT)
}

export interface Source {
  readonly file: string
  readonly text: string
}

export function sourcesOf(dirs: string[]): Source[] {
  return dirs.flatMap((d) => tsFiles(d)).map((f) => ({ file: rel(f), text: read(f) }))
}

/** Strip `//` and block comments so a scan reads code, not prose. */
export function stripComments(text: string): string {
  return text.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1 ')
}

/** Every module specifier imported or re-exported by `text`. */
export function specifiers(text: string): string[] {
  const src = stripComments(text)
  const out: string[] = []
  for (const m of src.matchAll(/(?:^|\n)\s*(?:import|export)[\s\S]*?from\s*['"]([^'"]+)['"]/g)) {
    out.push(m[1]!)
  }
  for (const m of src.matchAll(/(?:^|\n)\s*import\s*['"]([^'"]+)['"]/g)) out.push(m[1]!)
  for (const m of src.matchAll(/\bimport\(\s*['"]([^'"]+)['"]\s*\)/g)) out.push(m[1]!)
  return out
}

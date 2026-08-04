// [u11#c12] C17 — measuring a unit-scoped assert against the unit's OWN range.
//
// Several asserts written inside a single unit's slice say something that was
// true of THAT unit and is not true of the finished tree, because a later unit
// legitimately did the very work the PRD asked it to do (u1's "no fonts.css",
// u2's "fixtures/ holds two files", u3's "the windows are stubs", u10's
// "no u1 sheet changed"). C17 rules the fix: **re-aim, never delete** — measure
// the claim where it was always meant to hold, which is the unit's own merge.
//
// This module is the one place that knows how to do that, so no re-aimed suite
// has to hand-roll git plumbing and every one of them measures the same way.
// It reads the repository and imports nothing from `src/`.
import { execFileSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

export function git(args: string[]): string {
  return execFileSync('git', args, { cwd: REPO, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
}

/** This run's id — the prefix every unit branch of the run carries. */
export const RUN_ID = '20260803-213143'

const merges = new Map<string, string>()

/**
 * The merge commit that landed `unit`, located by BRANCH NAME and never
 * hard-coded — the run has used both `super-<run>-<unit>` and
 * `super/<run>-<unit>` as branch names, so both spellings are accepted.
 *
 * Throws rather than guessing: a range that cannot be resolved must fail the
 * assert loudly, not silently measure nothing.
 */
export function unitMerge(unit: string): string {
  const cached = merges.get(unit)
  if (cached) return cached
  const found = git(['log', '--merges', '--format=%H %s'])
    .split('\n')
    .filter((line) => new RegExp(`super[-/]${RUN_ID}-${unit}(\\s|$)`).test(line))
    .map((line) => line.split(' ')[0]!)
  if (found.length === 0) {
    throw new Error(`no merge for unit '${unit}' is reachable from HEAD — the C17 re-aim cannot be measured`)
  }
  // `git log` is newest-first; the unit's own landing is the OLDEST such merge.
  const merge = found[found.length - 1]!
  merges.set(unit, merge)
  return merge
}

/** Paths under `pathspec` that `unit`'s own merge introduced or changed. */
export function unitDiff(unit: string, ...pathspec: string[]): string[] {
  const merge = unitMerge(unit)
  return git(['diff', '--name-only', `${merge}^`, merge, '--', ...pathspec])
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
}

/** A file's contents as `unit`'s merge left them. */
export function fileAtUnit(unit: string, file: string): string {
  return git(['show', `${unitMerge(unit)}:${file}`])
}

/** The file names directly inside `dir` as `unit`'s merge left it. */
export function dirAtUnit(unit: string, dir: string): string[] {
  const prefix = dir.endsWith('/') ? dir : `${dir}/`
  return git(['ls-tree', '--name-only', unitMerge(unit), prefix])
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((p) => p.slice(prefix.length))
    .sort()
}

/** Whether a path existed at all when `unit` landed. */
export function existedAtUnit(unit: string, file: string): boolean {
  try {
    git(['cat-file', '-e', `${unitMerge(unit)}:${file}`])
    return true
  } catch {
    return false
  }
}

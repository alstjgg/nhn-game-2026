// [e6#A10] — src/transport/** stays isomorphic (physical §3.1).
//
// `tsconfig.core.json` (`lib:["ES2023"]`, `types:[]`) proves the host globals do
// not RESOLVE here; this suite proves the folder does not reach for one under an
// injected-looking name, and that the §11 header names are consumed from
// src/shared/contracts.ts rather than re-typed.
//
// `tests/scaffold/skeleton.test.ts` already bans document · window · globalThis ·
// process · console. · node: for all five skeleton folders. This file adds the
// four e6-specific ones — import.meta, setTimeout, AbortController, bare fetch(.
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const TRANSPORT_DIR = path.join(REPO, 'src/transport')

function walk(dir: string): string[] {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return walk(full)
    return entry.isFile() && full.endsWith('.ts') ? [full] : []
  })
}

/** Comment-stripped source of every `.ts` under src/transport/. */
function sources(): { rel: string; code: string }[] {
  return walk(TRANSPORT_DIR).map((file) => ({
    rel: path.relative(REPO, file),
    code: fs
      .readFileSync(file, 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, ' ')
      .replace(/(^|[^:])\/\/.*$/gm, '$1'),
  }))
}

const BANNED: readonly { re: RegExp; why: string }[] = [
  { re: /\bglobalThis\b/, why: 'no host global — the boundary is injected (decision 15)' },
  { re: /\bimport\s*\.\s*meta\b/, why: 'import.meta does not resolve under tsconfig.core.json; the host passes the env record' },
  { re: /\bprocess\b/, why: 'Node-only — resolveProxyBaseUrl takes the record, it does not read one' },
  { re: /\bsetTimeout\b/, why: 'no timers in the isomorphic core (D5 / spec assumption 3)' },
  { re: /\bAbortController\b/, why: 'abort is the host’s; the transport forwards `signal` opaquely' },
  { re: /\bdocument\b/, why: 'no DOM' },
  { re: /\bwindow\b/, why: 'no DOM' },
  { re: /\bconsole\s*\./, why: 'tsconfig.core.json drops console deliberately — return it, log at the boundary' },
  { re: /from\s+['"]node:/, why: 'no Node builtins in an isomorphic folder' },
  { re: /\blocalStorage\b|\bsessionStorage\b/, why: 'storage is the runloop’s MetaStore adapter, not the transport’s' },
]

describe('[e6#A10] src/transport/** names no host global', () => {
  it('the folder has source to scan', () => {
    expect(walk(TRANSPORT_DIR).length, 'src/transport/ has no .ts files').toBeGreaterThan(0)
  })

  for (const { re, why } of BANNED) {
    it(`no ${re.source} — ${why}`, () => {
      const offenders = sources()
        .filter(({ code }) => re.test(code))
        .map(({ rel }) => rel)
      expect(offenders).toEqual([])
    })
  }

  it('fetch is only ever called through its injected holder, never bare', () => {
    const bare = /(?<![.\w$])fetch\s*\(/
    const offenders = sources()
      .filter(({ code }) => bare.test(code))
      .map(({ rel }) => `${rel} calls a bare fetch(); call it as \`cfg.fetch(...)\``)
    expect(offenders).toEqual([])
  })
})

describe('[e6#A10] the §11 wire names are consumed, never re-declared', () => {
  const HEADER_LITERALS = ['x-llm-fallback', 'x-fallback-code', 'x-request-id'] as const

  it('no header name is typed out as a string literal', () => {
    const offenders: string[] = []
    for (const { rel, code } of sources()) {
      for (const literal of HEADER_LITERALS) {
        if (code.includes(`'${literal}'`) || code.includes(`"${literal}"`)) {
          offenders.push(`${rel} re-types ${literal} instead of importing the constant`)
        }
      }
    }
    expect(offenders).toEqual([])
  })

  it('the header constants are imported from src/shared/contracts.ts', () => {
    const all = sources().map(({ code }) => code).join('\n')
    expect(all).toMatch(/from\s+['"]\.\.\/shared\/contracts\.ts['"]/)
    for (const name of ['FALLBACK_HEADER', 'FALLBACK_CODE_HEADER', 'REQUEST_ID_HEADER']) {
      expect(all, `${name} is never used — the headers cannot be being read`).toMatch(
        new RegExp(`\\b${name}\\b`),
      )
    }
  })

  it('the wire types are imported, never re-declared', () => {
    const offenders: string[] = []
    const FROZEN = [
      'CallRequest',
      'CallResponse',
      'CallErrorBody',
      'CallType',
      'JudgmentResponse',
      'NarrationResponse',
      'ReporterResponse',
    ]
    for (const { rel, code } of sources()) {
      for (const name of FROZEN) {
        if (new RegExp(`^\\s*(?:export\\s+)?(?:type|interface)\\s+${name}\\b`, 'm').test(code)) {
          offenders.push(`${rel} re-declares ${name}`)
        }
      }
    }
    expect(offenders).toEqual([])
  })
})

describe('[e6#A10] tsconfig.core.json is the mechanical guard', () => {
  it('compiles src/transport (so `npm run check` is the real gate)', () => {
    const raw = fs.readFileSync(path.join(REPO, 'tsconfig.core.json'), 'utf8')
    const json = raw
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/(^|\s)\/\/.*$/gm, '$1')
      .replace(/,(\s*[}\]])/g, '$1')
    const config = JSON.parse(json) as { include?: string[]; compilerOptions?: { types?: string[] } }
    expect(config.include).toContain('src/transport')
    expect(config.compilerOptions?.types).toEqual([])
  })
})

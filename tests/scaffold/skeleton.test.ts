// [e0#c2] — the skeleton is the signature of record (PRD decision 14).
//
// Five folders — `engine` · `composer` · `transport` · `driver` · `runloop` —
// must export the full public surface of contract-engine-composer §2·§3·§9
// *before* any of it works, so e2·e3·e4·e5·e6·e8 can compile against it in
// parallel. Every factory body throws `unimplemented: <symbol>`; nothing runs.
//
// The suite checks three separate things, and they fail for different reasons:
//
//   1. **Type presence** — a source-text census of `<folder>/index.ts`, in the
//      house style of `tests/driver/seam-shapes.test.ts`. Types are erased at
//      run time, so this is the only run-time-visible evidence they exist.
//   2. **Type shape** — the `Assert<Equals<…>>` block below. It is invisible to
//      vitest and is enforced by `npm run typecheck:test` inside `npm run
//      check`, which is where a wrong signature actually has to fail.
//   3. **Stub behaviour** — every factory is callable and throws
//      `unimplemented: <its own name>`.
//
// Type imports only: they are erased by the transform, so a missing module
// fails as one named run-time test below rather than as a whole-file crash.
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import type { Stance, CallRequest } from '../../src/shared/contracts.ts'
import type { FeedLine } from '../../src/shared/view-driver.ts'
import type { GateView, BeatView, RoundView, Engine } from '../../src/engine/index.ts'
import type { Composer, ComposerDeps } from '../../src/composer/index.ts'
import type { Transport } from '../../src/transport/index.ts'
import type { DriverDeps } from '../../src/driver/index.ts'
import type { RunLoopDeps, MetaStore } from '../../src/runloop/index.ts'

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

// ─── 2. type shape — checked by `npm run typecheck:test`, not by vitest ──────

type Assert<T extends true> = T
type Equals<A, B> =
  (<G>() => G extends A ? 1 : 2) extends <G>() => G extends B ? 1 : 2 ? true : false
type Extends<A, B> = A extends B ? true : false

// §2 — GateView is exactly the four Call 1 slots the engine supplies.
export type _gk = Assert<
  Equals<keyof GateView, 'GATE_QUESTION' | 'STANCE_SET' | 'TIMELINE_EXCERPT' | 'TEMPERAMENT'>
>
export type _g1 = Assert<Equals<GateView['GATE_QUESTION'], string>>
export type _g2 = Assert<Equals<GateView['STANCE_SET'], Stance[]>>
export type _g3 = Assert<Equals<GateView['TIMELINE_EXCERPT'], string[]>>
// "TEMPERAMENT crosses as structured data, not prose" (§2.0).
export type _g4 = Assert<Extends<GateView['TEMPERAMENT'], object>>

// §2 — BeatView is exactly the five Call 2 slots, `AGENT_UTTERANCE` included
// (§2.1: it is missing from call contracts §6's table, not from this surface).
export type _bk = Assert<
  Equals<
    keyof BeatView,
    'TIMELINE_TAIL' | 'AGENT_UTTERANCE' | 'FIXED_NPC_ACTION' | 'PRESENT_NPCS' | 'SCENE_SYMPTOMS'
  >
>
export type _b1 = Assert<Equals<BeatView['TIMELINE_TAIL'], string[]>>
export type _b2 = Assert<Equals<BeatView['AGENT_UTTERANCE'], string>>
export type _b3 = Assert<Equals<BeatView['FIXED_NPC_ACTION'], string>>
export type _b4 = Assert<Equals<BeatView['SCENE_SYMPTOMS'], string[]>>

// §2 — RoundView, and the load-bearing part: Call 1 and Call 3 carry the SAME
// temperament type, so "the same value twice" is structural (§2.0).
export type _rk = Assert<Equals<keyof RoundView, 'EXPERIENCED' | 'TEMPERAMENT'>>
export type _r1 = Assert<Equals<RoundView['EXPERIENCED'], string[]>>
export type _r2 = Assert<Equals<RoundView['TEMPERAMENT'], GateView['TEMPERAMENT']>>

// §2.0 — the engine has two output surfaces: three views plus `feed()`.
export type _ek = Assert<Equals<keyof Engine, 'gateView' | 'beatView' | 'roundView' | 'feed'>>
export type _e1 = Assert<Equals<ReturnType<Engine['gateView']>, GateView>>
export type _e2 = Assert<Equals<ReturnType<Engine['beatView']>, BeatView>>
export type _e3 = Assert<Equals<ReturnType<Engine['roundView']>, RoundView>>
export type _e4 = Assert<Equals<ReturnType<Engine['feed']>, FeedLine[]>>
export type _e5 = Assert<Equals<Parameters<Engine['gateView']>, []>>
export type _e6 = Assert<Equals<Parameters<Engine['feed']>, []>>

// §3 — the composer's three builders. `judgment` takes the id SET, never text:
// resolution and canonical ordering are the composer's.
export type _ck = Assert<Equals<keyof Composer, 'judgment' | 'narration' | 'reporter'>>
export type _c1 = Assert<Equals<Parameters<Composer['judgment']>, [GateView, string[]]>>
export type _c2 = Assert<Equals<Parameters<Composer['narration']>, [BeatView]>>
export type _c3 = Assert<Equals<Parameters<Composer['reporter']>, [RoundView]>>
export type _c4 = Assert<Extends<ReturnType<Composer['judgment']>, CallRequest>>
export type _c5 = Assert<Extends<ReturnType<Composer['narration']>, CallRequest>>
export type _c6 = Assert<Extends<ReturnType<Composer['reporter']>, CallRequest>>
// §3 — "everything that is not engine state arrives at construction".
export type _c7 = Assert<Extends<ComposerDeps, { reportGuidance: unknown }>>

// Decision 15 — every cross-module dependency is INJECTED. The live driver
// takes engine·composer·transport; the runloop takes its storage adapter.
export type _d1 = Assert<Extends<DriverDeps, { engine: Engine; composer: Composer; transport: Transport }>>
export type _n1 = Assert<Extends<RunLoopDeps, { store: MetaStore }>>

// ─── 1. type presence — the source-text census ───────────────────────────────

type ModuleSpec = {
  /** folder under `src/`; its `index.ts` is the public surface */
  folder: string
  factory: string
  /** every symbol contract §2·§3·§9 requires this folder to export */
  exports: readonly string[]
  /**
   * Set by the unit that replaces the stub with behaviour. The surface census
   * above still applies; only the `unimplemented:` throw stops being true.
   * [e6#D-m] — e6 implements `transport`, so `createTransport({})` must now
   * degrade to the fixture provider instead of throwing. Same mechanism
   * applies per-folder to any later unit (e8 → runloop, etc.).
   */
  implemented?: true
}

const MODULES: readonly ModuleSpec[] = [
  {
    folder: 'engine',
    factory: 'createEngine',
    exports: ['GateView', 'BeatView', 'RoundView', 'Engine', 'EngineDeps', 'createEngine'],
  },
  {
    folder: 'composer',
    factory: 'createComposer',
    exports: ['Composer', 'ComposerDeps', 'createComposer'],
  },
  {
    folder: 'transport',
    factory: 'createTransport',
    exports: ['Transport', 'TransportDeps', 'TransportResult', 'createTransport'],
    implemented: true,
  },
  {
    folder: 'driver',
    factory: 'createDriver',
    exports: ['Driver', 'DriverDeps', 'createDriver'],
  },
  {
    folder: 'runloop',
    factory: 'createRunLoop',
    exports: ['RunLoop', 'RunLoopDeps', 'MetaState', 'MetaStore', 'createRunLoop'],
    implemented: true, // e8 — behaviour landed; see tests/runloop/
  },
] as const

const indexPath = (folder: string): string => path.join(REPO, 'src', folder, 'index.ts')

const read = (p: string): string => fs.readFileSync(p, 'utf8')

/**
 * Every name a module exports — declarations, re-export lists, and
 * `export * from './x.ts'` followed one hop into the file it names, so a
 * surface split across `index.ts` + siblings counts the same as one file.
 */
function exportedNames(file: string, seen = new Set<string>()): Set<string> {
  const names = new Set<string>()
  if (seen.has(file) || !fs.existsSync(file)) return names
  seen.add(file)
  const source = read(file)

  const decl =
    /^export\s+(?:declare\s+)?(?:type|interface|const|let|function|class|enum)\s+([A-Za-z_$][\w$]*)/gm
  for (const m of source.matchAll(decl)) names.add(m[1]!)

  const list = /^export\s+(?:type\s+)?\{([^}]*)\}/gm
  for (const m of source.matchAll(list)) {
    for (const raw of m[1]!.split(',')) {
      const piece = raw.trim()
      if (piece === '') continue
      const alias = /\bas\s+([A-Za-z_$][\w$]*)\s*$/.exec(piece)
      names.add(alias ? alias[1]! : piece.replace(/^type\s+/, '').trim())
    }
  }

  const star = /^export\s+(?:type\s+)?\*\s+from\s+['"](\.[^'"]*)['"]/gm
  for (const m of source.matchAll(star)) {
    for (const name of exportedNames(path.resolve(path.dirname(file), m[1]!), seen)) {
      names.add(name)
    }
  }
  return names
}

describe('[e0#c2] the five isomorphic modules exist with an index.ts surface', () => {
  for (const { folder } of MODULES) {
    it(`src/${folder}/index.ts exists`, () => {
      expect(fs.existsSync(indexPath(folder)), `src/${folder}/index.ts is missing`).toBe(true)
    })
  }
})

describe('[e0#c2] every symbol in contract §2·§3·§9 is exported', () => {
  for (const { folder, exports } of MODULES) {
    it(`src/${folder}/index.ts exports ${exports.join(' · ')}`, () => {
      const names = exportedNames(indexPath(folder))
      const missing = exports.filter((name) => !names.has(name))
      expect(missing, `src/${folder}/index.ts is missing exports`).toEqual([])
    })
  }
})

// ─── 3. stub behaviour ───────────────────────────────────────────────────────

describe('[e0#c2] every factory is a stub that throws `unimplemented: <symbol>`', () => {
  for (const { folder, factory, implemented } of MODULES) {
    if (implemented) continue
    it(`${factory}() throws "unimplemented: ${factory}"`, async () => {
      const mod = (await import(`../../src/${folder}/index.ts`)) as Record<string, unknown>
      expect(typeof mod[factory], `${factory} is not an exported function`).toBe('function')
      let thrown: unknown
      try {
        ;(mod[factory] as (deps?: unknown) => unknown)({} as never)
      } catch (e) {
        thrown = e
      }
      expect(thrown, `${factory}() did not throw`).toBeInstanceOf(Error)
      expect((thrown as Error).message).toBe(`unimplemented: ${factory}`)
    })
  }
})

// ─── the skeleton stays isomorphic ───────────────────────────────────────────

/** Every `.ts` file under `src/<folder>/`, recursively. */
function walk(dir: string): string[] {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) return walk(full)
    return e.isFile() && full.endsWith('.ts') ? [full] : []
  })
}

describe('[e0#c2] the skeleton is isomorphic — no DOM, no host globals, no fs', () => {
  // Not a duplicate of the tsconfig guard: `tsconfig.core.json` proves the
  // globals do not RESOLVE, this proves the skeleton does not reach for one via
  // an injected-looking name. `sessionStorage` is the load-bearing case — the
  // runloop takes a `MetaStore` adapter so the headless driver can substitute
  // (decision 15), and naming the browser API here would defeat that.
  const BANNED = [
    /\bdocument\b/,
    /\bwindow\b/,
    /\blocalStorage\b/,
    /\bsessionStorage\b/,
    /\bglobalThis\b/,
    /\bprocess\b/,
    /\bconsole\./,
    /from\s+['"]node:/,
  ]

  for (const { folder } of MODULES) {
    it(`src/${folder}/** names no host global`, () => {
      const offenders: string[] = []
      for (const file of walk(path.join(REPO, 'src', folder))) {
        // strip block and line comments — the prose explains why they are absent
        const code = read(file)
          .replace(/\/\*[\s\S]*?\*\//g, '')
          .replace(/(^|\s)\/\/.*$/gm, '$1')
        for (const re of BANNED) {
          if (re.test(code)) offenders.push(`${path.relative(REPO, file)} → ${re}`)
        }
      }
      expect(offenders).toEqual([])
    })
  }
})

describe('[e0#c2] the frozen seam types are consumed, never re-declared', () => {
  // PRD §4: "segment.ts, species.ts, view-driver.ts already exist — consume,
  // never rewrite". A second `Species` or `FeedLine` in the skeleton is the
  // drift #114 was written to prevent.
  const FROZEN = ['Species', 'Sentence', 'FeedKind', 'FeedLine', 'ViewEvent', 'MembraneOp']

  for (const { folder } of MODULES) {
    it(`src/${folder}/** re-declares none of the §5.2 seam types`, () => {
      const offenders: string[] = []
      for (const file of walk(path.join(REPO, 'src', folder))) {
        const code = read(file).replace(/\/\*[\s\S]*?\*\//g, '')
        for (const name of FROZEN) {
          const re = new RegExp(`^\\s*(?:export\\s+)?(?:type|interface)\\s+${name}\\b`, 'm')
          if (re.test(code)) offenders.push(`${path.relative(REPO, file)} re-declares ${name}`)
        }
      }
      expect(offenders).toEqual([])
    })
  }
})

describe('[e0#c2] src/shared/id.ts is the single minting site', () => {
  it('exists and exports the mint/parse surface', () => {
    const p = path.join(REPO, 'src/shared/id.ts')
    expect(fs.existsSync(p), 'src/shared/id.ts is missing').toBe(true)
    const names = exportedNames(p)
    for (const name of [
      'ID_PATTERN',
      'mintSentenceId',
      'parseSentenceId',
      'tryParseSentenceId',
      'isMintedSentenceId',
      'isAuthoredSentenceId',
      'speciesOfSentenceId',
    ]) {
      expect(names.has(name), `src/shared/id.ts does not export ${name}`).toBe(true)
    }
  })

  it('derives species from src/shared/species.ts rather than a second table', () => {
    const source = read(path.join(REPO, 'src/shared/id.ts'))
    expect(source).toMatch(/from\s+['"]\.\/species\.ts['"]/)
    expect(source, 'id.ts declares its own channel→species table').not.toMatch(/SPECIES_OF\s*[:=]\s*\{/)
  })

  it('no module under the five skeleton folders mints an id by hand', () => {
    const offenders: string[] = []
    for (const { folder } of MODULES) {
      for (const file of walk(path.join(REPO, 'src', folder))) {
        const code = read(file).replace(/\/\*[\s\S]*?\*\//g, '')
        if (/`b-r\$\{/.test(code) || /'b-r'\s*\+/.test(code)) {
          offenders.push(path.relative(REPO, file))
        }
      }
    }
    expect(offenders).toEqual([])
  })
})

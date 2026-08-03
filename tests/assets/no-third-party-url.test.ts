// [u10#c5] The BUILT bundle contains no third-party URL at all (spec-client §3
// inv 10) and does ship the self-hosted font slices.
//
// Source of truth is `dist/`, so the suite builds it once (vite only — the repo
// `build` script also runs the datapack checks, which are not this unit's gate).
import { describe, it, expect, beforeAll } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { DIST, REPO, THIRD_PARTY_MARKERS, exists, rel, walk } from './font-assets.ts'

const BUILD_TIMEOUT = 240_000

/** Hosts a static, self-hosted build may legitimately mention (never network-fetched). */
const ALLOWED_HOSTS = ['www.w3.org', 'localhost', '127.0.0.1']

const TEXT_EXT = /\.(html|css|js|mjs|json|map|svg|webmanifest)$/i

function distTextFiles(): string[] {
  return walk(DIST).filter((p) => TEXT_EXT.test(p))
}

function urlsIn(text: string): string[] {
  return [...text.matchAll(/(?:https?:)?\/\/[a-z0-9.-]+\.[a-z]{2,}[^\s"'`)\\]*/gi)].map((m) => m[0])
}

beforeAll(() => {
  fs.rmSync(DIST, { recursive: true, force: true })
  execFileSync('npx', ['vite', 'build', '--logLevel', 'error'], {
    cwd: REPO,
    encoding: 'utf8',
    stdio: 'pipe',
    timeout: BUILD_TIMEOUT,
  })
}, BUILD_TIMEOUT)

describe('[u10#c5] the build produces a dist to grep', () => {
  it('(a) dist/ exists and is non-empty', () => {
    expect(exists(DIST)).toBe(true)
    expect(walk(DIST).length).toBeGreaterThan(0)
  })

  it('(b) the self-hosted font slices are emitted into the build', () => {
    const fonts = walk(DIST).filter((p) => /\.woff2$/i.test(p))
    expect(fonts.length, 'no .woff2 shipped in dist/').toBeGreaterThan(0)
    expect(fonts.every((p) => rel(p).startsWith('dist/assets/fonts/'))).toBe(true)
  })

  it('(c) the built CSS declares the @font-face set', () => {
    const css = walk(DIST)
      .filter((p) => p.endsWith('.css'))
      .map((p) => fs.readFileSync(p, 'utf8'))
      .join('\n')
    expect(css).toMatch(/@font-face/)
    expect(css).toMatch(/unicode-range/)
  })
})

describe('[u10#c5] no third-party URL survives into dist/', () => {
  it('(a) no known third-party host is named anywhere in dist/', () => {
    const hits: string[] = []
    for (const file of distTextFiles()) {
      const text = fs.readFileSync(file, 'utf8').toLowerCase()
      for (const host of THIRD_PARTY_MARKERS) if (text.includes(host)) hits.push(`${rel(file)} → ${host}`)
    }
    expect(hits).toEqual([])
  })

  it('(b) no absolute or protocol-relative URL at all, beyond the static allowlist', () => {
    const hits: string[] = []
    for (const file of distTextFiles()) {
      for (const url of urlsIn(fs.readFileSync(file, 'utf8'))) {
        const host = url.replace(/^https?:/, '').replace(/^\/\//, '').split(/[/:?#]/)[0]
        if (!ALLOWED_HOSTS.includes(host.toLowerCase())) hits.push(`${rel(file)} → ${url}`)
      }
    }
    expect(hits.slice(0, 10), `${hits.length} third-party URL(s) in dist/`).toEqual([])
  })

  it('(c) every font url() in the built CSS is same-origin (relative or root-relative)', () => {
    const bad: string[] = []
    for (const file of walk(DIST).filter((p) => p.endsWith('.css'))) {
      const css = fs.readFileSync(file, 'utf8')
      for (const m of css.matchAll(/url\(\s*("[^"]*"|'[^']*'|[^)]*)\s*\)/g)) {
        const url = m[1].replace(/^['"]|['"]$/g, '')
        if (/^(https?:)?\/\//i.test(url)) bad.push(`${rel(file)} → ${url}`)
      }
    }
    expect(bad).toEqual([])
  })

  it('(d) no @import pulls a stylesheet over the network', () => {
    const bad = walk(DIST)
      .filter((p) => p.endsWith('.css'))
      .filter((p) => /@import\s+(url\(\s*)?['"]?(https?:)?\/\//i.test(fs.readFileSync(p, 'utf8')))
      .map(rel)
    expect(bad).toEqual([])
  })
})

describe('[u10#c5] the source tree is clean too (no re-introduction path)', () => {
  it('(a) index.html carries no Google Fonts link or preconnect', () => {
    const html = fs.readFileSync(path.join(REPO, 'index.html'), 'utf8').toLowerCase()
    for (const host of THIRD_PARTY_MARKERS) expect(html, `index.html names ${host}`).not.toContain(host)
  })

  it('(b) no file under src/client/styles names a third-party host', () => {
    const offenders = walk(path.join(REPO, 'src/client/styles'))
      .filter((p) => p.endsWith('.css'))
      .filter((p) => {
        const text = fs.readFileSync(p, 'utf8').toLowerCase()
        return THIRD_PARTY_MARKERS.some((h) => text.includes(h))
      })
      .map(rel)
    expect(offenders).toEqual([])
  })
})

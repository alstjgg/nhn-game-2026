// [u3#c2] `applyLayout(viewport)` — the default desk arrangement is COMPUTED,
// never hard-positioned.
//
// The browser half is in `e2e/shell.spec.ts` › 'default layout fits 1280x800'.
// This is the pure half: the arrangement must be a function of the viewport
// alone, so it is importable and assertable under vitest `environment: 'node'`
// with no DOM in sight. A layout that could only be checked in a browser would
// mean the geometry lives in the DOM writer — that is the thing this forbids.
//
// Contract pinned here (this run's design.md is stale — see tests.md):
//   src/client/shell/layout.ts
//     export interface Viewport { width: number; height: number }
//     export interface WinRect  { x: number; y: number; w: number; h: number }
//     export function applyLayout(viewport: Viewport): Record<WindowKey, WinRect>
import { describe, it, expect } from 'vitest'
import { LAYOUT_TS, WINDOW_KEYS, exists, importable, read, stripComments } from './shell-utils.ts'

interface WinRect {
  x: number
  y: number
  w: number
  h: number
}

type Arrangement = Record<string, WinRect>

async function applyLayout(viewport: { width: number; height: number }): Promise<Arrangement> {
  const mod = (await import(importable(LAYOUT_TS))) as {
    applyLayout: (v: { width: number; height: number }) => Arrangement
  }
  return mod.applyLayout(viewport)
}

const MIN = { width: 1280, height: 800 }

function rects(a: Arrangement): WinRect[] {
  return WINDOW_KEYS.map((k) => a[k]!)
}

describe('[u3#c2] the layout module is pure and DOM-free', () => {
  it('(a) src/client/shell/layout.ts exists', () => {
    expect(exists(LAYOUT_TS)).toBe(true)
  })

  it('(b) it imports nothing and touches no DOM global', async () => {
    expect(typeof globalThis.document).toBe('undefined')
    const a = await applyLayout(MIN)
    expect(typeof globalThis.document).toBe('undefined')
    expect(a).toBeTruthy()
  })

  it('(c) the source reads no ambient viewport (innerWidth / window / document)', () => {
    const src = stripComments(read(LAYOUT_TS))
    expect(src).not.toMatch(/\binnerWidth\b|\binnerHeight\b/)
    expect(src).not.toMatch(/\bdocument\b/)
    expect(src).not.toMatch(/\bwindow\b/)
  })

  it('(d) it is a pure function — same viewport in, equal arrangement out', async () => {
    expect(await applyLayout(MIN)).toEqual(await applyLayout(MIN))
  })
})

describe('[u3#c2] the arrangement covers exactly the five windows', () => {
  it('(a) one rect per window key, and nothing else', async () => {
    const a = await applyLayout(MIN)
    expect(Object.keys(a).sort()).toEqual([...WINDOW_KEYS].sort())
  })

  it('(b) every rect is a finite, integral, positive box', async () => {
    for (const r of rects(await applyLayout(MIN))) {
      for (const v of [r.x, r.y, r.w, r.h]) {
        expect(Number.isFinite(v)).toBe(true)
        expect(Number.isInteger(v)).toBe(true)
      }
      expect(r.w).toBeGreaterThan(0)
      expect(r.h).toBeGreaterThan(0)
    }
  })
})

describe('[u3#c2] nothing is off-screen at the 1280x800 minimum (C9)', () => {
  it('(a) every rect sits inside the viewport', async () => {
    const a = await applyLayout(MIN)
    for (const key of WINDOW_KEYS) {
      const r = a[key]!
      expect(r.x, `${key}.left`).toBeGreaterThanOrEqual(0)
      expect(r.y, `${key}.top`).toBeGreaterThanOrEqual(0)
      expect(r.x + r.w, `${key}.right`).toBeLessThanOrEqual(MIN.width)
      expect(r.y + r.h, `${key}.bottom`).toBeLessThanOrEqual(MIN.height)
    }
  })

  it('(b) every rect clears the chrome band at the top of the desk', async () => {
    const a = await applyLayout(MIN)
    for (const key of WINDOW_KEYS) {
      expect(a[key]!.y, `${key} sits under the topbar`).toBeGreaterThanOrEqual(90)
    }
  })

  it('(c) the desk is not one pile — the columns are distinct', async () => {
    const a = await applyLayout(MIN)
    const origins = new Set(rects(a).map((r) => `${r.x}:${r.y}`))
    expect(origins.size).toBeGreaterThanOrEqual(4)
  })
})

describe('[u3#c2] the arrangement is derived from the viewport', () => {
  it('(a) a wider viewport produces a different arrangement', async () => {
    expect(await applyLayout({ width: 1600, height: 900 })).not.toEqual(await applyLayout(MIN))
  })

  it('(b) columns grow with the viewport width', async () => {
    const small = await applyLayout(MIN)
    const large = await applyLayout({ width: 1920, height: 800 })
    for (const key of WINDOW_KEYS) {
      expect(large[key]!.w, `${key}.w must not shrink as the desk widens`).toBeGreaterThanOrEqual(
        small[key]!.w,
      )
    }
  })

  it('(c) it stays on-screen at every desktop size it is asked for', async () => {
    for (const v of [
      { width: 1280, height: 800 },
      { width: 1366, height: 768 },
      { width: 1440, height: 900 },
      { width: 1600, height: 900 },
      { width: 1920, height: 1080 },
      { width: 2560, height: 1440 },
    ]) {
      const a = await applyLayout(v)
      for (const key of WINDOW_KEYS) {
        const r = a[key]!
        expect(r.x, `${key}.left @${v.width}`).toBeGreaterThanOrEqual(0)
        expect(r.y, `${key}.top @${v.width}`).toBeGreaterThanOrEqual(0)
        expect(r.x + r.w, `${key}.right @${v.width}`).toBeLessThanOrEqual(v.width)
        expect(r.y + r.h, `${key}.bottom @${v.width}`).toBeLessThanOrEqual(v.height)
      }
    }
  })

  it('(d) a viewport below the supported minimum still yields sane boxes', async () => {
    // Below 1280x800 is out of support (C9) — it must degrade, not produce
    // negative or zero-sized windows the manager could never recover from.
    const a = await applyLayout({ width: 900, height: 600 })
    for (const r of rects(a)) {
      expect(r.w).toBeGreaterThan(0)
      expect(r.h).toBeGreaterThan(0)
    }
  })
})

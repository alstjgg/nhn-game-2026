// u8 — RedThread overlay: the PURE half.
//
// vitest runs `environment: 'node'` (vitest.config.ts) and u8 adds no jsdom
// devDep (C2), so this file asserts only what is DOM-free: the id-only match
// rule, the clip predicate, the sag/path math — plus the source-level guards a
// browser cannot express. Every DOM assertion lives in `e2e/red-thread.spec.ts`
// (u8 design §3 / spec decision 3).
//
// Covers [u8#c4] id-only matching · [u8#c5] decorative overlay · [u8#c7] adds
// no state · the pure half of [u8#c3] clipping.
//
// Test titles are load-bearing — the unit's verification commands filter with
// `-t 'id-only matching'` and `-t 'decorative overlay'` (plus `-t 'adds no
// state'` for c7). Do NOT rename a describe block without updating
// `.claude/super/units/u8.md`.
//
// C3: nothing here asserts fixture CONTENT. Every id below is the authored id
// grammar `b-r<run>-<channel><nn>` that C3 itself freezes, and every number is
// geometry ported verbatim from `docs/design/phase2-ui/app.js:566–602` — not a
// color/size/font literal, so C11 does not bind (design decision D).
import { describe, expect, it } from 'vitest'
import path from 'node:path'
import { CLIENT, INDEX_HTML, exists, importable, read, rel, stripComments } from '../shell/shell-utils.ts'

/* ══ the two sources this unit owns ══════════════════════════════════════ */

const RED_THREAD_TS = path.join(CLIENT, 'components/red-thread.ts')
const THREAD_LAYER_TS = path.join(CLIENT, 'shell/thread-layer.ts')
const BOOT_TS = path.join(CLIENT, 'shell/boot.ts')
const SHELL_CSS = path.join(CLIENT, 'styles/shell.css')

/** Source text with comments stripped; fails loudly when the file is absent. */
function source(file: string): string {
  expect(exists(file), `${rel(file)} does not exist — u8 has not built it yet`).toBe(true)
  return stripComments(read(file))
}

/* ══ the module under test (u8 design §4 contract) ═══════════════════════ */

interface Rect {
  x: number
  y: number
  width: number
  height: number
}
interface Pt {
  x: number
  y: number
}
interface AnchorSpec {
  id: string
  rect: Rect
  clip: Rect | null
}
interface ThreadInput {
  slotAnchors: readonly AnchorSpec[]
  sourceAnchors: readonly AnchorSpec[]
  slotted?: readonly string[]
  tallyOpen: boolean
}
interface ThreadPlan {
  blockId: string
  d: string
  pins: readonly [Pt, Pt]
}

interface RedThreadModule {
  THREAD_SAG_MAX: number
  THREAD_SAG_RATIO: number
  THREAD_SAG_BASE: number
  THREAD_PIN_R: number
  THREAD_OFFSET_A: number
  THREAD_OFFSET_B: number
  THREAD_CLIP_PAD: number
  clipRect(anchor: AnchorSpec): Rect | null
  sagFor(x1: number, x2: number): number
  pathFor(a: Pt, b: Pt): string
  planThreads(input: ThreadInput): ThreadPlan[]
}

/** Dynamic import off an absolute path: a missing module fails ONE test with a
 *  readable message instead of breaking collection (window-registry precedent). */
async function redThread(): Promise<RedThreadModule> {
  expect(exists(RED_THREAD_TS), `${rel(RED_THREAD_TS)} does not exist — u8 has not built it yet`).toBe(true)
  return (await import(importable(RED_THREAD_TS))) as unknown as RedThreadModule
}

/* ── rect/anchor builders (viewport coordinates, like getBoundingClientRect) ── */

function rect(x: number, y: number, width: number, height: number): Rect {
  return { x, y, width, height }
}

/** A window body big enough that nothing clips, unless a test says otherwise. */
const BODY = rect(0, 0, 1280, 800)

function anchor(id: string, r: Rect, clip: Rect | null = BODY): AnchorSpec {
  return { id, rect: r, clip }
}

/** The authored id grammar C3 freezes — never fixture content. */
const A_ID = 'b-r2-f03'
const B_ID = 'b-r2-b03'
const C_ID = 'b-r1-f01'

/* ══ [u8#c4] id-only matching ════════════════════════════════════════════ */

describe('id-only matching', () => {
  it('id-only matching — a slot is threaded only when a source shares the identical id', async () => {
    const { planThreads } = await redThread()
    const plans = planThreads({
      slotAnchors: [anchor(A_ID, rect(900, 300, 120, 20))],
      sourceAnchors: [anchor(A_ID, rect(200, 400, 300, 18))],
      tallyOpen: false,
    })
    expect(plans.map((p) => p.blockId)).toEqual([A_ID])
  })

  it('id-only matching — an unknown source id draws nothing (no heuristic fallback)', async () => {
    const { planThreads } = await redThread()
    const plans = planThreads({
      slotAnchors: [anchor(A_ID, rect(900, 300, 120, 20))],
      sourceAnchors: [anchor(B_ID, rect(200, 400, 300, 18))],
      tallyOpen: false,
    })
    expect(plans).toEqual([])
  })

  it('id-only matching — a near-miss id never matches (prefix, suffix, case)', async () => {
    const { planThreads } = await redThread()
    for (const near of [`${A_ID}x`, A_ID.slice(0, -1), A_ID.toUpperCase(), ` ${A_ID}`, `${A_ID} `]) {
      const plans = planThreads({
        slotAnchors: [anchor(A_ID, rect(900, 300, 120, 20))],
        sourceAnchors: [anchor(near, rect(200, 400, 300, 18))],
        tallyOpen: false,
      })
      expect(plans, `\`${near}\` was matched against \`${A_ID}\` — matching is not id-exact`).toEqual([])
    }
  })

  it('id-only matching — an empty id is never a match on either end', async () => {
    const { planThreads } = await redThread()
    expect(
      planThreads({
        slotAnchors: [anchor('', rect(900, 300, 120, 20))],
        sourceAnchors: [anchor('', rect(200, 400, 300, 18))],
        tallyOpen: false,
      }),
    ).toEqual([])
  })

  it('id-only matching — one plan per DISTINCT id even when two nodes carry it', async () => {
    // u4 writes `data-block-id` on both the `.slot` cell and the `.slot-pin`
    // (slot-board.ts:180/185) — a node-count gate would double (design B).
    const { planThreads } = await redThread()
    const plans = planThreads({
      slotAnchors: [anchor(A_ID, rect(900, 300, 120, 20)), anchor(A_ID, rect(1000, 306, 8, 8))],
      sourceAnchors: [anchor(A_ID, rect(200, 400, 300, 18)), anchor(A_ID, rect(200, 500, 300, 18))],
      tallyOpen: false,
    })
    expect(plans).toHaveLength(1)
    expect(plans[0]!.blockId).toBe(A_ID)
  })

  it('id-only matching — plan order is the slot-anchor order, deterministically', async () => {
    const { planThreads } = await redThread()
    const input: ThreadInput = {
      slotAnchors: [
        anchor(C_ID, rect(900, 260, 120, 20)),
        anchor(A_ID, rect(900, 300, 120, 20)),
        anchor(B_ID, rect(900, 340, 120, 20)),
      ],
      sourceAnchors: [
        anchor(A_ID, rect(200, 400, 300, 18)),
        anchor(B_ID, rect(200, 440, 300, 18)),
        anchor(C_ID, rect(200, 480, 300, 18)),
      ],
      tallyOpen: false,
    }
    expect(planThreads(input).map((p) => p.blockId)).toEqual([C_ID, A_ID, B_ID])
    expect(planThreads(input).map((p) => p.blockId)).toEqual([C_ID, A_ID, B_ID])
  })

  it('id-only matching — the injected slotted set narrows, never widens', async () => {
    const { planThreads } = await redThread()
    const base = {
      slotAnchors: [anchor(A_ID, rect(900, 300, 120, 20)), anchor(B_ID, rect(900, 340, 120, 20))],
      sourceAnchors: [anchor(A_ID, rect(200, 400, 300, 18)), anchor(B_ID, rect(200, 440, 300, 18))],
      tallyOpen: false,
    }
    expect(planThreads({ ...base, slotted: [A_ID] }).map((p) => p.blockId)).toEqual([A_ID])
    // widening is impossible: an id with no DOM anchor cannot be threaded
    expect(planThreads({ ...base, slotted: [A_ID, B_ID, C_ID] }).map((p) => p.blockId)).toEqual([A_ID, B_ID])
    // absent ⇒ ignored entirely (DOM is the truth, design decision E)
    expect(planThreads(base).map((p) => p.blockId)).toEqual([A_ID, B_ID])
    expect(planThreads({ ...base, slotted: [] })).toEqual([])
  })

  it('id-only matching — while the TALLY is open nothing is planned', async () => {
    const { planThreads } = await redThread()
    expect(
      planThreads({
        slotAnchors: [anchor(A_ID, rect(900, 300, 120, 20))],
        sourceAnchors: [anchor(A_ID, rect(200, 400, 300, 18))],
        tallyOpen: true,
      }),
    ).toEqual([])
  })

  it('id-only matching — the source module carries no text-matching branch', async () => {
    const text = source(RED_THREAD_TS)
    for (const banned of [
      'textContent',
      'innerText',
      'innerHTML',
      '.includes(',
      '.indexOf(',
      '.startsWith(',
      '.endsWith(',
      'toLowerCase',
      'normalize(',
      'RegExp',
    ]) {
      expect(text, `${rel(RED_THREAD_TS)} names \`${banned}\` — matching must be id-exact (c4)`).not.toContain(
        banned,
      )
    }
  })

  it('id-only matching — the DOM adapter selects anchors by attribute, never by text', async () => {
    const text = source(THREAD_LAYER_TS)
    expect(text).toContain('data-block-id')
    expect(text).toContain('data-sentence-id')
    for (const banned of ['textContent', 'innerText', ':has-text', 'innerHTML']) {
      expect(text, `${rel(THREAD_LAYER_TS)} names \`${banned}\` — anchors are id-addressed only`).not.toContain(
        banned,
      )
    }
  })
})

/* ══ [u8#c5] decorative overlay ══════════════════════════════════════════ */

describe('decorative overlay', () => {
  it('decorative overlay — the #threads host is aria-hidden and unfocusable in index.html', () => {
    const html = read(INDEX_HTML)
    const tag = html.match(/<svg[^>]*id="threads"[^>]*>/)
    expect(tag, 'index.html carries no `<svg id="threads">` host').not.toBeNull()
    expect(tag![0]).toContain('aria-hidden="true"')
    expect(tag![0]).not.toContain('tabindex')
    expect(tag![0]).not.toContain('role=')
  })

  it('decorative overlay — #threads is a direct child of #app, above the windows', () => {
    // c3's "single shared stacking context": the host is a sibling of #desktop,
    // not a descendant, so `z-index:460` orders against every `.win`.
    const html = read(INDEX_HTML)
    const app = html.indexOf('id="app"')
    const desktop = html.indexOf('id="desktop"')
    const threads = html.indexOf('id="threads"')
    expect(app).toBeGreaterThanOrEqual(0)
    expect(threads).toBeGreaterThan(app)
    expect(html.slice(app, threads)).not.toContain('id="desktop"')
    expect(desktop).toBeGreaterThan(threads)
  })

  it('decorative overlay — the stylesheet keeps the overlay pointer-transparent', () => {
    const css = read(SHELL_CSS).replace(/\s+/g, '')
    const block = css.match(/#threads\{[^}]*\}/)
    expect(block, 'shell.css declares no `#threads` block').not.toBeNull()
    expect(block![0]).toContain('pointer-events:none')
    expect(block![0]).toContain('position:fixed')
  })

  it('decorative overlay — u8 adds no stylesheet and no markup of its own (C11)', () => {
    // The skin is element-driven (`#threads path|circle` already in shell.css),
    // so the renderer emits bare nodes and writes zero CSS.
    const text = source(THREAD_LAYER_TS)
    expect(text).not.toMatch(/\.css['"]/)
    expect(text).not.toContain('style.cssText')
    expect(text).not.toMatch(/setAttribute\(\s*['"]style['"]/)
  })

  it('decorative overlay — the renderer emits only <path> and <circle>', async () => {
    const text = source(THREAD_LAYER_TS)
    const created = [...text.matchAll(/createElementNS\([^,]+,\s*['"]([^'"]+)['"]/g)].map((m) => m[1])
    expect(created.length, 'the layer creates no SVG node at all').toBeGreaterThan(0)
    for (const tag of created) expect(['path', 'circle']).toContain(tag)
  })

  it('decorative overlay — the layer registers no interaction handler on the host', () => {
    const text = source(THREAD_LAYER_TS)
    for (const banned of ['pointerdown', 'pointerup', 'click', 'focus', 'keydown', 'mousedown', 'tabindex']) {
      expect(text, `${rel(THREAD_LAYER_TS)} wires \`${banned}\` — the overlay is decoration (c5)`).not.toContain(
        banned,
      )
    }
  })

  it('decorative overlay — the pin radius is the reference 2.6', async () => {
    const { THREAD_PIN_R } = await redThread()
    expect(THREAD_PIN_R).toBe(2.6)
  })
})

/* ══ [u8#c7] adds no state ═══════════════════════════════════════════════ */

describe('adds no state', () => {
  it('adds no state — the pure module holds no module-level mutable binding', () => {
    const text = source(RED_THREAD_TS)
    expect(text).not.toMatch(/^\s*(let|var)\s/m)
    expect(text).not.toMatch(/^\s*(export\s+)?const\s+\w+\s*=\s*new\s+(Map|Set|WeakMap|WeakSet)\b/m)
  })

  it('adds no state — the pure module never touches the DOM or a global', () => {
    const text = source(RED_THREAD_TS)
    for (const banned of [
      'document',
      'window',
      'globalThis',
      'requestAnimationFrame',
      'getBoundingClientRect',
      'HTMLElement',
      'SVGElement',
      'MutationObserver',
      'ResizeObserver',
    ]) {
      expect(text, `${rel(RED_THREAD_TS)} names \`${banned}\` — it must stay DOM-free (vitest env is node)`)
        .not.toContain(banned)
    }
  })

  it('adds no state — planThreads never mutates its input', async () => {
    const { planThreads } = await redThread()
    const input: ThreadInput = {
      slotAnchors: [anchor(A_ID, rect(900, 300, 120, 20))],
      sourceAnchors: [anchor(A_ID, rect(200, 400, 300, 18))],
      slotted: [A_ID],
      tallyOpen: false,
    }
    const snapshot = JSON.stringify(input)
    planThreads(input)
    planThreads(input)
    expect(JSON.stringify(input)).toBe(snapshot)
  })

  it('adds no state — planThreads is pure: same input, same output', async () => {
    const { planThreads } = await redThread()
    const input: ThreadInput = {
      slotAnchors: [anchor(A_ID, rect(900, 300, 120, 20)), anchor(B_ID, rect(900, 340, 120, 20))],
      sourceAnchors: [anchor(A_ID, rect(200, 400, 300, 18)), anchor(B_ID, rect(200, 440, 300, 18))],
      tallyOpen: false,
    }
    expect(planThreads(input)).toEqual(planThreads(input))
  })

  it('adds no state — the layer persists nothing and keeps no derived store', () => {
    const text = source(THREAD_LAYER_TS)
    for (const banned of ['localStorage', 'sessionStorage', 'indexedDB', 'setInterval', 'setTimeout']) {
      expect(text, `${rel(THREAD_LAYER_TS)} names \`${banned}\` — u8 adds no state (c7 / C4)`).not.toContain(
        banned,
      )
    }
  })

  it('adds no state — neither source imports engine, composer or a runtime dep (C2/C8)', () => {
    for (const file of [RED_THREAD_TS, THREAD_LAYER_TS]) {
      const text = source(file)
      const specs = [...text.matchAll(/from\s*['"]([^'"]+)['"]/g)].map((m) => m[1]!)
      for (const spec of specs) {
        expect(spec.startsWith('.') || spec.startsWith('node:'), `${rel(file)} imports \`${spec}\``).toBe(true)
        expect(spec, `${rel(file)} reaches into the engine/composer (C8, inv 12)`).not.toMatch(
          /engine|composer/,
        )
      }
    }
  })

  it('adds no state — destroy() unwires every observer the layer created', () => {
    const text = source(THREAD_LAYER_TS)
    expect(text).toMatch(/destroy\s*[(:]/)
    expect(text).toContain('disconnect')
    expect(text).toContain('removeEventListener')
    expect(text).toContain('cancelAnimationFrame')
  })

  it('adds no state — the layer is mounted from boot.ts, once, after the desk', () => {
    const text = source(BOOT_TS)
    expect(text, 'boot.ts never calls `createThreadLayer` — the overlay is never mounted').toContain(
      'createThreadLayer',
    )
    expect(text.indexOf('createThreadLayer')).toBeGreaterThan(text.indexOf('desk.arrange'))
    expect([...text.matchAll(/createThreadLayer\(/g)]).toHaveLength(1)
  })
})

/* ══ clip predicate — the pure half of [u8#c3] ═══════════════════════════ */

describe('clipped to the window body', () => {
  it('clipped to the window body — a hidden or collapsed window clips to null', async () => {
    const { clipRect } = await redThread()
    expect(clipRect(anchor(A_ID, rect(200, 400, 300, 18), null))).toBeNull()
  })

  it('clipped to the window body — an anchor inside the body survives unchanged', async () => {
    const { clipRect } = await redThread()
    const r = rect(200, 400, 300, 18)
    expect(clipRect(anchor(A_ID, r, rect(100, 300, 500, 400)))).toEqual(r)
  })

  it('clipped to the window body — an anchor scrolled above or below the body clips to null', async () => {
    const { clipRect } = await redThread()
    const body = rect(100, 300, 500, 400) // top 300, bottom 700
    // bottom < top + 2  →  above the body (reference app.js:571)
    expect(clipRect(anchor(A_ID, rect(200, 283, 300, 18), body))).toBeNull()
    // top > bottom - 2  →  below the body
    expect(clipRect(anchor(A_ID, rect(200, 699, 300, 18), body))).toBeNull()
    // exactly straddling the top edge still counts as visible
    expect(clipRect(anchor(A_ID, rect(200, 290, 300, 18), body))).not.toBeNull()
  })

  it('clipped to the window body — an anchor beside the body clips to null', async () => {
    const { clipRect } = await redThread()
    const body = rect(100, 300, 500, 400) // left 100, right 600
    expect(clipRect(anchor(A_ID, rect(-300, 400, 300, 18), body))).toBeNull()
    expect(clipRect(anchor(A_ID, rect(700, 400, 300, 18), body))).toBeNull()
  })

  it('clipped to the window body — a pair with either end clipped yields no plan (Q1)', async () => {
    const { planThreads } = await redThread()
    const slot = anchor(A_ID, rect(900, 300, 120, 20))
    const hiddenSource = anchor(A_ID, rect(200, 400, 300, 18), null)
    expect(planThreads({ slotAnchors: [slot], sourceAnchors: [hiddenSource], tallyOpen: false })).toEqual([])
    expect(
      planThreads({
        slotAnchors: [{ ...slot, clip: null }],
        sourceAnchors: [anchor(A_ID, rect(200, 400, 300, 18))],
        tallyOpen: false,
      }),
    ).toEqual([])
  })
})

/* ══ path geometry — ported verbatim from app.js:576–601 ═════════════════ */

describe('thread geometry', () => {
  it('thread geometry — the ported constants match the reference', async () => {
    const m = await redThread()
    expect(m.THREAD_SAG_MAX).toBe(46)
    expect(m.THREAD_SAG_RATIO).toBe(0.12)
    expect(m.THREAD_SAG_BASE).toBe(14)
    expect(m.THREAD_OFFSET_A).toBe(6)
    expect(m.THREAD_OFFSET_B).toBe(4)
    expect(m.THREAD_CLIP_PAD).toBe(2)
  })

  it('thread geometry — sag is min(46, |dx|·0.12) + 14 and clamps far apart', async () => {
    const { sagFor } = await redThread()
    expect(sagFor(100, 100)).toBe(14)
    expect(sagFor(100, 200)).toBeCloseTo(Math.min(46, 100 * 0.12) + 14, 10)
    expect(sagFor(200, 100)).toBeCloseTo(Math.min(46, 100 * 0.12) + 14, 10)
    expect(sagFor(0, 5000)).toBe(60) // clamped: 46 + 14
  })

  it('thread geometry — the path is the reference quadratic, drawn source→slot', async () => {
    const { pathFor, sagFor } = await redThread()
    const a: Pt = { x: 906, y: 310 } // slot pin end
    const b: Pt = { x: 496, y: 409 } // source end
    const sag = sagFor(a.x, b.x)
    expect(pathFor(a, b)).toBe(`M${b.x} ${b.y} Q ${(a.x + b.x) / 2} ${(a.y + b.y) / 2 + sag} ${a.x} ${a.y}`)
  })

  it('thread geometry — pins land at rectA.left+6 and rectB.right−4, vertically centred', async () => {
    const { planThreads } = await redThread()
    const slot = rect(900, 300, 120, 20)
    const src = rect(200, 400, 300, 18)
    const [plan] = planThreads({
      slotAnchors: [anchor(A_ID, slot)],
      sourceAnchors: [anchor(A_ID, src)],
      tallyOpen: false,
    })
    expect(plan).toBeTruthy()
    expect(plan!.pins[0]).toEqual({ x: slot.x + 6, y: slot.y + slot.height / 2 })
    expect(plan!.pins[1]).toEqual({ x: src.x + src.width - 4, y: src.y + src.height / 2 })
  })

  it('thread geometry — the plan `d` is exactly pathFor(pins[0], pins[1])', async () => {
    const { planThreads, pathFor } = await redThread()
    const [plan] = planThreads({
      slotAnchors: [anchor(A_ID, rect(900, 300, 120, 20))],
      sourceAnchors: [anchor(A_ID, rect(200, 400, 300, 18))],
      tallyOpen: false,
    })
    expect(plan).toBeTruthy()
    expect(plan!.d).toBe(pathFor(plan!.pins[0], plan!.pins[1]))
    expect(plan!.d.startsWith('M')).toBe(true)
    expect(plan!.d).toContain(' Q ')
  })

  it('thread geometry — an empty desk plans nothing and never throws', async () => {
    const { planThreads } = await redThread()
    expect(planThreads({ slotAnchors: [], sourceAnchors: [], tallyOpen: false })).toEqual([])
    expect(planThreads({ slotAnchors: [], sourceAnchors: [], tallyOpen: true })).toEqual([])
  })
})

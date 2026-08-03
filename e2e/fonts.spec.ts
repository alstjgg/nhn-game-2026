// [u10#c1] the running page makes ZERO third-party network requests, with the
//          three families served from `public/assets/fonts/` (spec-client §3 inv 10).
// [u10#c4] the page load stays inside the ~1 s budget and the font payload is
//          subset-loaded per `unicode-range` (spec-client §7 #11).
//
// The suite reads the *real* `src/client/styles/fonts.css` from disk and replays
// its @font-face blocks against the dev server with absolute same-origin URLs, so
// it exercises the shipped slices and the real files without depending on which
// screen happens to mount them yet.
import { expect, test } from 'playwright/test'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const FONTS_CSS = path.join(REPO, 'src/client/styles/fonts.css')

/** Budgets (spec-client §7 #11 — "~1 s"). */
const NAV_BUDGET_MS = 1000
const FONT_PAYLOAD_BUDGET_BYTES = 300_000
const FONT_FILE_BUDGET = 24
const SHORT_KOREAN_SLICE_BUDGET = 6

const LATIN_SAMPLE = 'NDSP-2 OPERATOR TERMINAL 0123456789 // report'
const KOREAN_SHORT = '우는다리'
const KOREAN_SAMPLE = '우는다리 운영자 단말 — 정착부 결함 보고서 전송 대기 중, 민원 14건 확인.'

const FAMILIES = ['IBM Plex Mono', 'Nanum Gothic Coding', 'Nanum Myeongjo'] as const

interface Face {
  family: string
  weight: string
  style: string
  unicodeRange: string
  /** `assets/fonts/...` tail of the first url() in `src`. */
  tail: string
}

function decl(body: string, prop: string): string {
  const m = new RegExp(`(?:^|[;{])\\s*${prop}\\s*:\\s*([^;}]+)`, 'i').exec(body)
  return m ? m[1].trim() : ''
}

function unquote(v: string): string {
  return v.trim().replace(/^['"]|['"]$/g, '')
}

function readFaces(): Face[] {
  const css = (fs.existsSync(FONTS_CSS) ? fs.readFileSync(FONTS_CSS, 'utf8') : '').replace(
    /\/\*[\s\S]*?\*\//g,
    ' ',
  )
  const out: Face[] = []
  for (const m of css.matchAll(/@font-face\s*\{([^{}]*)\}/g)) {
    const body = m[1]
    const url = /url\(\s*("[^"]*"|'[^']*'|[^)]*)\s*\)/.exec(decl(body, 'src'))
    const tailMatch = url ? /assets\/fonts\/(.+)$/.exec(unquote(url[1]).split('?')[0]) : null
    out.push({
      family: unquote(decl(body, 'font-family')),
      weight: decl(body, 'font-weight') || '400',
      style: decl(body, 'font-style') || 'normal',
      unicodeRange: decl(body, 'unicode-range'),
      tail: tailMatch ? `assets/fonts/${tailMatch[1]}` : '',
    })
  }
  return out
}

/** The same @font-face set, re-addressed at absolute dev-server URLs. */
function probeCss(baseURL: string, faces: Face[]): string {
  return faces
    .map((f) =>
      [
        '@font-face{',
        `font-family:'${f.family}';`,
        `font-style:${f.style};`,
        `font-weight:${f.weight};`,
        'font-display:swap;',
        `src:url('${new URL(f.tail, baseURL).toString()}') format('woff2');`,
        f.unicodeRange ? `unicode-range:${f.unicodeRange};` : '',
        '}',
      ].join(''),
    )
    .join('\n')
}

function isFontUrl(url: string): boolean {
  return /\.(woff2?|ttf|otf|eot)(\?.*)?$/i.test(url)
}

test('the running page makes zero third-party requests', async ({ page, baseURL }) => {
  const faces = readFaces()
  expect(faces.length, 'src/client/styles/fonts.css declares no @font-face').toBeGreaterThan(0)
  expect(faces.filter((f) => f.tail === ''), 'every face must resolve into assets/fonts/').toEqual([])

  const requested: string[] = []
  const failures: string[] = []
  page.on('request', (r) => requested.push(r.url()))
  page.on('response', (r) => {
    if (isFontUrl(r.url()) && r.status() >= 400) failures.push(`${r.status()} ${r.url()}`)
  })

  await page.goto('./')
  await page.addStyleTag({ content: probeCss(baseURL!, faces) })
  const resolved = await page.evaluate(
    async ([latin, korean]) => {
      const load = (family: string, text: string) =>
        document.fonts.load(`400 16px "${family}"`, text).then((fs) => fs.length)
      return {
        'IBM Plex Mono': await load('IBM Plex Mono', latin),
        'Nanum Gothic Coding': await load('Nanum Gothic Coding', korean),
        'Nanum Myeongjo': await load('Nanum Myeongjo', korean),
      }
    },
    [LATIN_SAMPLE, KOREAN_SAMPLE],
  )
  await page.evaluate(() => document.fonts.ready)

  const origin = new URL(baseURL!).origin
  const foreign = requested.filter((u) => !u.startsWith(origin) && !u.startsWith('data:') && !u.startsWith('blob:'))
  expect(foreign, 'the player build must make no third-party request').toEqual([])

  const fontRequests = requested.filter(isFontUrl)
  expect(fontRequests.length, 'no self-hosted font was fetched at all').toBeGreaterThan(0)
  expect(fontRequests.every((u) => u.startsWith(origin))).toBe(true)
  expect(failures, 'a font slice failed to load').toEqual([])

  for (const family of FAMILIES) {
    expect(resolved[family], `no face resolved for ${family}`).toBeGreaterThan(0)
  }
})

test('the self-hosted fonts stay inside the ~1 s load budget', async ({ page, baseURL }) => {
  const faces = readFaces()
  expect(faces.length).toBeGreaterThan(0)

  await page.goto('./') // warm the dev server, then measure a fresh document

  const fontResponses: { url: string; bytes: number }[] = []
  page.on('response', (r) => {
    if (isFontUrl(r.url())) {
      fontResponses.push({ url: r.url(), bytes: 0 })
    }
  })

  await page.goto('./')
  const navMs = await page.evaluate(() => {
    const [nav] = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[]
    return nav ? nav.duration : Number.POSITIVE_INFINITY
  })
  expect(navMs, `document load took ${Math.round(navMs)} ms`).toBeLessThan(NAV_BUDGET_MS)

  await page.addStyleTag({ content: probeCss(baseURL!, faces) })
  await page.evaluate(
    async ([latin, korean]) => {
      await document.fonts.load(`400 16px "IBM Plex Mono"`, latin)
      await document.fonts.load(`400 16px "Nanum Gothic Coding"`, korean)
      await document.fonts.load(`400 16px "Nanum Myeongjo"`, korean)
      await document.fonts.ready
    },
    [LATIN_SAMPLE, KOREAN_SAMPLE],
  )

  const sizes = await Promise.all(
    fontResponses.map(async (f) => {
      const abs = path.join(REPO, 'public', new URL(f.url).pathname.replace(/^.*?(assets\/fonts\/)/, '$1'))
      return fs.existsSync(abs) ? fs.statSync(abs).size : 0
    }),
  )
  const total = sizes.reduce((a, b) => a + b, 0)

  expect(fontResponses.length, 'first-render pulled too many slices').toBeLessThanOrEqual(FONT_FILE_BUDGET)
  expect(total, `font payload ${total} B`).toBeGreaterThan(0)
  expect(total, `font payload ${total} B exceeds the budget`).toBeLessThanOrEqual(FONT_PAYLOAD_BUDGET_BYTES)
})

test('unicode-range slicing keeps a short Korean string to a handful of slices', async ({ page, baseURL }) => {
  const faces = readFaces()
  expect(faces.length).toBeGreaterThan(0)

  const requested: string[] = []
  page.on('request', (r) => {
    if (isFontUrl(r.url())) requested.push(r.url())
  })

  await page.goto('./')
  await page.addStyleTag({ content: probeCss(baseURL!, faces) })
  await page.evaluate(async (korean) => {
    await document.fonts.load(`400 16px "Nanum Myeongjo"`, korean)
    await document.fonts.ready
  }, KOREAN_SHORT)

  expect(requested.length, `"${KOREAN_SHORT}" pulled ${requested.length} slice(s)`).toBeGreaterThan(0)
  expect(requested.length, 'a per-unicode-range slicing must not ship the whole face').toBeLessThanOrEqual(
    SHORT_KOREAN_SLICE_BUDGET,
  )
})

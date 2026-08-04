// Vendors the three design-target webfont families into `public/assets/fonts/`
// and regenerates `src/client/styles/fonts.css` from what it downloaded.
//
// Why a script and not a one-off download: spec-client §3 inv 10 forbids any
// third-party request at runtime, so the ~500 per-`unicode-range` WOFF2 slices
// Google would otherwise serve have to live in the repo. CLAUDE.md rule 5 wants
// their provenance recorded; this file *is* that provenance, and re-running it
// reproduces the exact asset set (and refreshes it when upstream bumps a
// version) instead of leaving 500 binaries with no audit trail.
//
//   node tools/fonts/vendor-google-webfonts.mjs
//
// Nothing in the app imports this; it is a maintenance tool.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const FONTS_DIR = path.join(REPO, 'public/assets/fonts')
/** The skin's sheet: bundler input, composed by `styles/index.css`. */
const SKIN_CSS = path.join(REPO, 'src/client/styles/fonts.css')
/** The pack's own sheet: ships beside the slices, served as a static file. */
const PACK_CSS = path.join(FONTS_DIR, 'fonts.css')

/**
 * The exact family/weight/style set of the design target's Google Fonts link
 * (docs/design/phase2-ui/index.html, head). Keep in sync with that file.
 */
const CSS2_QUERY =
  'family=IBM+Plex+Mono:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400' +
  '&family=Nanum+Gothic+Coding:wght@400;700' +
  '&family=Nanum+Myeongjo:wght@400;700;800' +
  '&display=swap'

/** A desktop Chrome UA is what makes the API answer with WOFF2 + `unicode-range` slices. */
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

const CONCURRENCY = 12

/** `Nanum Gothic Coding` → `nanum-gothic-coding` */
function slugOf(family) {
  return family.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

/** `400` + `italic` → `400i`; `400` + `normal` → `400`. */
function faceDirOf(weight, style) {
  return `${weight}${style === 'italic' ? 'i' : ''}`
}

function declOf(body, prop) {
  const m = new RegExp(`(?:^|[;{])\\s*${prop}\\s*:\\s*([^;}]+)`, 'i').exec(body)
  return m ? m[1].trim() : ''
}

function unquote(value) {
  return value.trim().replace(/^['"]|['"]$/g, '')
}

/**
 * Every `@font-face` in the upstream sheet, with the `/* subset *\/` comment that
 * precedes it (Latin families) or the numeric slice id in the url (Korean ones).
 */
function parseUpstream(css) {
  const faces = []
  const blocks = [...css.matchAll(/(?:\/\*\s*([^*]+?)\s*\*\/\s*)?@font-face\s*\{([^{}]*)\}/g)]
  for (const [, label, body] of blocks) {
    const src = declOf(body, 'src')
    const url = unquote((/url\(\s*("[^"]*"|'[^']*'|[^)]*)\s*\)/.exec(src) ?? [])[1] ?? '')
    if (!url) throw new Error(`@font-face without a url(): ${body}`)
    const numbered = /\.(\d+)\.woff2$/.exec(url)
    faces.push({
      family: unquote(declOf(body, 'font-family')),
      style: declOf(body, 'font-style') || 'normal',
      weight: declOf(body, 'font-weight') || '400',
      unicodeRange: declOf(body, 'unicode-range'),
      url,
      // Slice name: the upstream subset label, else its numeric id, else the
      // unnumbered base slice every Korean face ends with.
      slice: label ? slugOf(label) : numbered ? numbered[1].padStart(3, '0') : 'base',
    })
  }
  return faces
}

function parseRanges(value) {
  const out = []
  for (const raw of value.split(',')) {
    const token = raw.trim()
    if (token === '') continue
    const m = /^u\+([0-9a-f]{1,6})(?:-([0-9a-f]{1,6}))?$/i.exec(token)
    if (!m) throw new Error(`unparseable unicode-range token: "${token}"`)
    const start = parseInt(m[1], 16)
    out.push({ start, end: m[2] === undefined ? start : parseInt(m[2], 16) })
  }
  return mergeRanges(out)
}

/** Sorted, with touching/overlapping intervals collapsed. */
function mergeRanges(ranges) {
  const sorted = [...ranges].sort((a, b) => a.start - b.start || a.end - b.end)
  const out = []
  for (const r of sorted) {
    const last = out[out.length - 1]
    if (last && r.start <= last.end + 1) last.end = Math.max(last.end, r.end)
    else out.push({ ...r })
  }
  return out
}

/** `ranges` minus `claimed` (both normalized). */
function subtractRanges(ranges, claimed) {
  const out = []
  for (const range of ranges) {
    let segments = [{ ...range }]
    for (const cut of claimed) {
      const next = []
      for (const seg of segments) {
        if (cut.end < seg.start || cut.start > seg.end) {
          next.push(seg)
          continue
        }
        if (cut.start > seg.start) next.push({ start: seg.start, end: cut.start - 1 })
        if (cut.end < seg.end) next.push({ start: cut.end + 1, end: seg.end })
      }
      segments = next
      if (segments.length === 0) break
    }
    out.push(...segments)
  }
  return out
}

function formatRanges(ranges) {
  const hex = (cp) => cp.toString(16).toUpperCase().padStart(4, '0')
  return ranges.map((r) => (r.start === r.end ? `U+${hex(r.start)}` : `U+${hex(r.start)}-${hex(r.end)}`)).join(', ')
}

/**
 * Upstream ships overlapping slices: a trailing "most common glyphs" slice and a
 * `latin` slice both re-declare codepoints the block slices already carry, and
 * the CSS cascade resolves each codepoint to the LAST face that claims it.
 *
 * spec-client §9 wants a real per-`unicode-range` partition, so this bakes that
 * cascade into the declarations: walking each family/weight backwards, every
 * face keeps only what no later face already claimed. Coverage is identical to
 * upstream, the ranges are disjoint, and a rendered codepoint maps to exactly
 * one slice — which is what keeps the first-render payload predictable.
 */
function disjoinFaces(faces) {
  const groups = new Map()
  for (const face of faces) {
    const key = `${face.family}|${face.weight}|${face.style}`
    groups.set(key, [...(groups.get(key) ?? []), face])
  }
  const kept = []
  for (const group of groups.values()) {
    let claimed = []
    for (const face of [...group].reverse()) {
      const own = subtractRanges(parseRanges(face.unicodeRange), claimed)
      claimed = mergeRanges([...claimed, ...own])
      // A face shadowed to nothing would only ship an unreachable binary.
      if (own.length > 0) kept.push({ ...face, unicodeRange: formatRanges(own) })
    }
  }
  // Restore source order so the sheet still reads family by family.
  const order = new Map(faces.map((f, i) => [f.url, i]))
  return kept.sort((a, b) => order.get(a.url) - order.get(b.url))
}

async function fetchText(url) {
  const res = await fetch(url, { headers: { 'user-agent': UA } })
  if (!res.ok) throw new Error(`GET ${url} → ${res.status}`)
  return res.text()
}

async function download(face) {
  const res = await fetch(face.url, { headers: { 'user-agent': UA } })
  if (!res.ok) throw new Error(`GET ${face.url} → ${res.status}`)
  const bytes = Buffer.from(await res.arrayBuffer())
  if (bytes.subarray(0, 4).toString('latin1') !== 'wOF2') {
    throw new Error(`not a WOFF2 payload: ${face.url}`)
  }
  fs.mkdirSync(path.dirname(path.join(REPO, 'public', face.publicPath)), { recursive: true })
  fs.writeFileSync(path.join(REPO, 'public', face.publicPath), bytes)
  return bytes.length
}

/** Runs `worker` over `items` with a bounded number of in-flight requests. */
async function pooled(items, worker) {
  const queue = [...items.entries()]
  const results = new Array(items.length)
  const runners = Array.from({ length: Math.min(CONCURRENCY, items.length) }, async () => {
    for (;;) {
      const next = queue.shift()
      if (!next) return
      const [index, item] = next
      results[index] = await worker(item)
    }
  })
  await Promise.all(runners)
  return results
}

/**
 * Renders the sheet. `hrefOf` decides how a slice is addressed, which is the
 * only difference between the two sheets this script writes:
 *
 * - the skin sheet goes through Vite, so it uses root-relative `/assets/…`
 *   urls, which Vite rebases onto `base` in dev and in the build;
 * - the pack sheet is copied verbatim out of `public/`, so it addresses its
 *   slices relatively and stays correct under any `base` or mount point.
 */
function renderCss(faces, { intro, hrefOf }) {
  const lines = [
    '/* ===========================================================================',
    ...intro.map((line) => (line === '' ? '' : `   ${line}`)),
    '',
    '   spec-client §3 inv 10 forbids any third-party request, so every slice below',
    '   is served from `public/assets/fonts/`; §9 asks for the Korean faces to keep',
    "   Google's per-`unicode-range` slicing so a page pulls only the syllable",
    '   blocks it actually renders.',
    '',
    '   GENERATED — do not hand-edit. Regenerate with:',
    '     node tools/fonts/vendor-google-webfonts.mjs',
    '',
    '   One face per line: the sheet is a vendored asset index, not hand-written CSS.',
    '   =========================================================================== */',
    '',
  ]
  let section = ''
  for (const face of faces) {
    const next = `${face.family} ${face.weight}${face.style === 'italic' ? ' italic' : ''}`
    if (next !== section) {
      section = next
      lines.push(`/* ${section} */`)
    }
    lines.push(
      '@font-face{' +
        `font-family:'${face.family}';` +
        `font-style:${face.style};` +
        `font-weight:${face.weight};` +
        'font-display:swap;' +
        `src:url('${hrefOf(face)}') format('woff2');` +
        `unicode-range:${face.unicodeRange};` +
        '}',
    )
  }
  return `${lines.join('\n')}\n`
}

async function main() {
  const upstream = await fetchText(`https://fonts.googleapis.com/css2?${CSS2_QUERY}`)
  const faces = disjoinFaces(parseUpstream(upstream))
  if (faces.length === 0) throw new Error('upstream sheet declared no @font-face')

  for (const face of faces) {
    if (!face.unicodeRange) throw new Error(`unsliced face: ${face.family} ${face.weight}`)
    face.publicPath = `assets/fonts/${slugOf(face.family)}/${faceDirOf(face.weight, face.style)}/${face.slice}.woff2`
  }

  const duplicates = faces.map((f) => f.publicPath).filter((p, i, all) => all.indexOf(p) !== i)
  if (duplicates.length > 0) throw new Error(`slice name collision: ${duplicates[0]}`)

  fs.rmSync(FONTS_DIR, { recursive: true, force: true })
  const sizes = await pooled(faces, download)

  const sliceHref = (face) => face.publicPath.replace(/^assets\/fonts\//, '')
  fs.writeFileSync(
    SKIN_CSS,
    renderCss(faces, {
      intro: [
        'fonts.css — the three design-target families, SELF-HOSTED.',
        '',
        'The client skin composes this through `styles/index.css`. Urls are',
        'root-relative because Vite rebases them onto the deploy `base`.',
      ],
      hrefOf: (face) => `/assets/fonts/${sliceHref(face)}`,
    }),
  )
  fs.writeFileSync(
    PACK_CSS,
    renderCss(faces, {
      intro: [
        'fonts.css — the font pack’s own sheet, shipped beside its slices.',
        '',
        'A self-hosted pack is only self-contained if it carries the sheet that',
        'declares it, so this file is served straight out of `public/` (no build',
        'step) and addresses its slices relatively — correct under any `base`.',
        'Include it from a plain page with:',
        "  <link rel='stylesheet' href='assets/fonts/fonts.css'>",
        'The bundled client uses `src/client/styles/fonts.css` instead: same',
        'faces, root-relative urls, composed with the rest of the skin.',
      ],
      hrefOf: sliceHref,
    }),
  )

  const total = sizes.reduce((a, b) => a + b, 0)
  console.log(`vendored ${faces.length} slices, ${(total / 1024 / 1024).toFixed(2)} MiB → public/assets/fonts/`)
  console.log(`wrote ${path.relative(REPO, SKIN_CSS)} and ${path.relative(REPO, PACK_CSS)}`)
}

await main()

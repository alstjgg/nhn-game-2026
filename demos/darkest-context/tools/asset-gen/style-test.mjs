#!/usr/bin/env node
// Darkest Context demo — style test (asset pack phase 1)
// Generates ONE candidate sheet per style string (A–D); a human compares and
// picks the winner, which is then frozen as the style bible in data/generation.json.
// Subject: 피오나's 4x3 hero sheet — the hardest format in the pack (walk-cycle
// position pinning + 4-stage gauge poses + action cells + magenta keying).
//
// Setup:  npm install     (installs sharp, see package.json)
// Run:    OPENAI_API_KEY=sk-...  node style-test.mjs
// Re-run one candidate:  OPENAI_API_KEY=... node style-test.mjs --only C
//
// Outputs:
//   out-style/raw/<X>.png   original 1536x1024 generation (kept for re-processing)
//   out-style/<X>.png       /4 downscale + magenta color-key (what the game would ship)
//   out-style/preview.html  side-by-side pixelated comparison — open this to judge
//   out-style/summary.md    timing log + full prompt per candidate

import { writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = dirname(fileURLToPath(import.meta.url));
const OUT = join(ROOT, "out-style");
const RAW = join(OUT, "raw");
const KEY = process.env.OPENAI_API_KEY;
if (!KEY) {
  console.error("OPENAI_API_KEY is not set.");
  process.exit(1);
}

const PIXEL_FACTOR = 4; // shared factor — same as apothecary and the future full pack

// Candidate style bibles. The winner is frozen verbatim into data/generation.json
// and prepended to every image call of the full pack.
const CANDIDATES = {
  A: "Low-resolution 16-bit era pixel art, strict pixel grid, limited palette, clean readable silhouette.",
  B: "Low-resolution 16-bit era pixel art, strict pixel grid, limited palette, clean readable silhouette. Dark gothic dungeon palette, torchlit shadows, muted colors with a single warm accent.",
  C: "Low-resolution pixel art, strict pixel grid, heavy black outlines, high-contrast chiaroscuro, desaturated palette with blood-red accents, grim expressive characters.",
  D: "1-bit inspired dark pixel art, strict pixel grid, four-color gothic palette, stark silhouettes, candlelight dithering.",
};

const MAGENTA_BG =
  "Flat solid magenta background (#FF00FF) in every cell, nothing touching the image edges. No gridlines, no borders, no text, no labels.";

// Test subject: the hero-sheet format frozen in PRD §2.8 (4x3, walk / gauge poses / actions).
const SUBJECT =
  "Sprite sheet: a 4x3 grid of twelve cells, the SAME character in every cell — a young pilgrim priestess in a hooded travel robe with a small mace and a wooden rosary charm, full body, side view facing right, identical scale and ground line in every cell. " +
  "Top row: a 4-frame walking cycle, body position identical across the four cells, only limbs move. " +
  "Middle row: four standing poses showing rising mental strain, one per cell — cell 1: calm idle; cell 2: uneasy, shoulders hunched; cell 3: at her limit, clutching her head; cell 4: broken, wild defensive crouch. " +
  "Bottom row: four action poses — cell 1: striking with the mace; cell 2: guarding behind raised arms; cell 3: flinching from a hit; cell 4: collapsed on the ground. " +
  MAGENTA_BG;

async function generate(style) {
  const t0 = Date.now();
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-image-1",
      prompt: `${style} ${SUBJECT}`,
      size: "1536x1024",
      quality: "low",
      n: 1,
    }),
  });
  const seconds = ((Date.now() - t0) / 1000).toFixed(1);
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${(await res.text()).slice(0, 300)}`);
  const json = await res.json();
  return { png: Buffer.from(json.data[0].b64_json, "base64"), seconds };
}

async function pixelate(buf) {
  const meta = await sharp(buf).metadata();
  const w = Math.round(meta.width / PIXEL_FACTOR);
  const h = Math.round(meta.height / PIXEL_FACTOR);
  const small = await sharp(buf).resize(w, h, { kernel: "lanczos3" }).ensureAlpha().raw()
    .toBuffer({ resolveWithObject: true });
  const { data, info } = small;
  // key color = average of the four corner pixels (magenta, sampled to be safe)
  const corners = [0, (info.width - 1) * 4, (info.height - 1) * info.width * 4, (info.height * info.width - 1) * 4];
  const kc = [0, 1, 2].map((c) => Math.round(corners.reduce((s, o) => s + data[o + c], 0) / 4));
  const TOL = 60;
  for (let i = 0; i < data.length; i += 4) {
    if (Math.abs(data[i] - kc[0]) <= TOL && Math.abs(data[i + 1] - kc[1]) <= TOL && Math.abs(data[i + 2] - kc[2]) <= TOL)
      data[i + 3] = 0;
  }
  return sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png()
    .toBuffer();
}

await mkdir(RAW, { recursive: true });
const only = (() => {
  const i = process.argv.indexOf("--only");
  return i >= 0 ? process.argv[i + 1] : null;
})();

const results = [];
for (const [id, style] of Object.entries(CANDIDATES).filter(([id]) => !only || id === only)) {
  process.stdout.write(`candidate ${id} ... `);
  try {
    const { png, seconds } = await generate(style);
    await writeFile(join(RAW, `${id}.png`), png);
    const final = await pixelate(png);
    await writeFile(join(OUT, `${id}.png`), final);
    results.push({ id, style, seconds, kb: Math.round(final.length / 1024) });
    console.log(`ok — ${seconds}s, final ${Math.round(final.length / 1024)}KB`);
  } catch (e) {
    results.push({ id, style, error: String(e.message) });
    console.log(`FAILED — ${e.message}`);
  }
}

const html = [
  "<!doctype html><meta charset='utf-8'><title>style test — darkest context</title>",
  "<style>",
  "body{background:#1a1a1e;color:#ddd;font:14px/1.5 sans-serif;margin:24px}",
  ".cand{margin-bottom:40px} .cand p{max-width:900px;color:#999}",
  "img{image-rendering:pixelated;width:768px;background:",
  "repeating-conic-gradient(#2a2a30 0 25%,#222 0 50%) 0 0/32px 32px;border:1px solid #444}",
  "</style>",
  ...Object.keys(CANDIDATES).map((id) =>
    `<div class='cand'><h2>${id}</h2><p>${CANDIDATES[id]}</p><img src='${id}.png'></div>`),
].join("\n");
await writeFile(join(OUT, "preview.html"), html);

const md = [
  "# Style test log — darkest context",
  "",
  `Pixel factor: ${PIXEL_FACTOR} · quality: low · subject: 피오나 4x3 hero sheet (PRD §2.8)`,
  "",
  "| candidate | seconds | final KB |",
  "|---|---|---|",
  ...results.map((r) => (r.error ? `| ${r.id} | ERROR | ${r.error} |` : `| ${r.id} | ${r.seconds} | ${r.kb} |`)),
  "",
  "## Full prompts",
  "",
  ...results.flatMap((r) => [`### ${r.id}`, "```", `${r.style} ${SUBJECT}`, "```", ""]),
];
await writeFile(join(OUT, "summary.md"), md.join("\n"));
console.log(`\nDone. Open ${join(OUT, "preview.html")} to compare candidates.`);

#!/usr/bin/env node
// Darkest Context demo — style test (asset pack phase 1)
// Generates ONE candidate sheet per style string (A–D); a human compares and
// picks the current baseline, which is recorded in data/generation.json and may
// remain provisional until the full-pack generation gate.
// Subject: 피오나's 4x3 hero sheet — the hardest format in the pack (walk-cycle
// position pinning + 4-stage gauge poses + action cells + magenta keying).
//
// Setup:  npm install     (installs sharp, see package.json)
// Run:    OPENAI_API_KEY=sk-...  node style-test.mjs
// Re-run one candidate:  OPENAI_API_KEY=... node style-test.mjs --only C
// Re-process saved raw files without an API call: node style-test.mjs --reprocess
//
// Outputs:
//   out-style/raw/<X>.png   original 1536x1024 generation (kept for re-processing)
//   out-style/<X>.png       /4 downscale + magenta color-key (what the game would ship)
//   out-style/preview.html  side-by-side pixelated comparison — open this to judge
//   out-style/summary.md    timing log + full prompt per candidate

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import {
  assertTechnicalMagenta,
  clearIsolatedTechnicalMagenta,
  floodFillTechnicalBackground,
} from "./key-background.mjs";

const ROOT = dirname(fileURLToPath(import.meta.url));
const OUT = join(ROOT, "out-style");
const RAW = join(OUT, "raw");
const RESULTS_JSON = join(OUT, "results.json");
const REPROCESS = process.argv.includes("--reprocess");
const KEY = process.env.OPENAI_API_KEY;
if (!KEY && !REPROCESS) {
  console.error("OPENAI_API_KEY is not set.");
  process.exit(1);
}

const PIXEL_FACTOR = 4; // shared factor — same as apothecary and the future full pack

// Candidate style bibles. The selected baseline is recorded verbatim in
// data/generation.json and prepended to every image call of the full pack.
const CANDIDATES = {
  A: "Low-resolution 16-bit era pixel art, strict pixel grid, limited palette, clean readable silhouette.",
  B: "Low-resolution 16-bit era pixel art, strict pixel grid, limited palette, clean readable silhouette. Dark gothic dungeon palette, torchlit shadows, muted colors with a single warm accent.",
  C: "Low-resolution pixel art, strict pixel grid, heavy black outlines, high-contrast chiaroscuro, desaturated palette with blood-red accents, grim expressive characters.",
  D: "1-bit inspired dark pixel art, strict pixel grid, four-color gothic palette, stark silhouettes, candlelight dithering.",
};

const TECHNICAL_KEY_RULE =
  "The magenta background is a technical chroma-key layer, not part of the palette — never use magenta, pink, or purple on the subject itself. " +
  "This technical rule overrides every artistic palette instruction.";

const LAYOUT_RULE =
  "MANDATORY LAYOUT: render exactly twelve separate full-body sprites as four columns by three rows, one sprite centered in each invisible cell. " +
  "Reserve the top, middle, and bottom third of the canvas for one complete row each. Make the sprites small enough that all twelve fit with wide empty magenta gutters. Never omit or crop the third row.";

const MAGENTA_BG =
  "Fill every negative-space background pixel with one exact, flat, fully opaque color: #FF00FF. " +
  "Draw no floor, ground shadow, platform, glow, texture, gradient, vignette, or lighting in the background. " +
  "Leave exact #FF00FF directly beneath every character's feet; do not draw a colored base or contact shadow. " +
  "Nothing touches the image edges. No gridlines, no borders, no text, no labels.";

// Test subject: the hero-sheet format frozen in PRD §2.8 (4x3, walk / gauge poses / actions).
const SUBJECT =
  "Sprite sheet: a 4x3 grid of twelve cells, the SAME character in every cell — a young pilgrim priestess in a hooded travel robe with a small mace and a wooden rosary charm, full body, side view facing right, identical scale and ground line in every cell. " +
  "Top row: four unmistakably different phases of one walk cycle — contact, down, passing, up. Keep torso, pelvis, scale, ground line, and position pixel-perfect identical across all four cells; move only arms, legs, robe hem, mace, and rosary. Do not repeat an idle pose. " +
  "Middle row: four exaggerated standing poses showing sharply rising mental strain, readable at tiny sprite size — cell 1: calm upright posture, healthy warm skin; cell 2: uneasy hunch, tense hands, noticeably pale skin; cell 3: at her limit, doubled over and clutching her head, ashen skin and deep shadowed eyes; cell 4: completely broken, wild defensive crouch, sickly grey skin, frantic eyes. Preserve the same face, clothes, and identity while changing posture and skin tone. " +
  "Bottom row: four strongly distinct action silhouettes — cell 1: wide mace strike; cell 2: unmistakable guard with both raised arms forming a barrier; cell 3: recoiling backward from a hit; cell 4: fully collapsed on the ground. " +
  MAGENTA_BG;

const buildPrompt = (style) => `${TECHNICAL_KEY_RULE} ${LAYOUT_RULE} ${style} ${SUBJECT}`;

async function generate(style) {
  const t0 = Date.now();
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-image-1",
      prompt: buildPrompt(style),
      size: "1536x1024",
      quality: "low",
      background: "opaque",
      n: 1,
    }),
  });
  const seconds = ((Date.now() - t0) / 1000).toFixed(1);
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${(await res.text()).slice(0, 300)}`);
  const json = await res.json();
  return { png: Buffer.from(json.data[0].b64_json, "base64"), seconds };
}

async function keyAndPixelate(buf) {
  const full = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { data, info } = full;
  const key = assertTechnicalMagenta(data, info);
  const edgeClearedPixels = floodFillTechnicalBackground(data, info, key);
  const strictCleanupPixels = clearIsolatedTechnicalMagenta(data, info);
  const w = Math.round(info.width / PIXEL_FACTOR);
  const h = Math.round(info.height / PIXEL_FACTOR);
  const final = await sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .resize(w, h, { kernel: "lanczos3" })
    .png()
    .toBuffer();
  return { final, key, edgeClearedPixels, strictCleanupPixels };
}

await mkdir(RAW, { recursive: true });
const only = (() => {
  const i = process.argv.indexOf("--only");
  return i >= 0 ? process.argv[i + 1] : null;
})();
if (only && !CANDIDATES[only]) {
  console.error(`Unknown candidate "${only}". Expected one of: ${Object.keys(CANDIDATES).join(", ")}`);
  process.exit(1);
}

let resultsById = {};
if (only || REPROCESS) {
  try {
    resultsById = JSON.parse(await readFile(RESULTS_JSON, "utf8"));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}
let failed = false;
for (const [id, style] of Object.entries(CANDIDATES).filter(([id]) => !only || id === only)) {
  process.stdout.write(`candidate ${id} ... `);
  try {
    const prompt = buildPrompt(style);
    const previous = resultsById[id] ?? {};
    const generated = REPROCESS
      ? { png: await readFile(join(RAW, `${id}.png`)), seconds: null }
      : await generate(style);
    const { png, seconds } = generated;
    if (!REPROCESS) await writeFile(join(RAW, `${id}.png`), png);
    const { final, key, edgeClearedPixels, strictCleanupPixels } = await keyAndPixelate(png);
    await writeFile(join(OUT, `${id}.png`), final);
    resultsById[id] = {
      id,
      source: REPROCESS ? "raw-reprocess" : "api",
      generationSeconds: REPROCESS
        ? (previous.generationSeconds ?? previous.seconds ?? null)
        : seconds,
      kb: Math.round(final.length / 1024),
      key,
      edgeClearedPixels,
      strictCleanupPixels,
      prompt,
    };
    const timing = REPROCESS ? "raw reprocess" : `${seconds}s`;
    console.log(
      `ok — ${timing}, final ${Math.round(final.length / 1024)}KB, ` +
        `key rgb(${key.r},${key.g},${key.b}), edge ${edgeClearedPixels}px, ` +
        `strict ${strictCleanupPixels}px`,
    );
  } catch (e) {
    failed = true;
    resultsById[id] = { id, error: String(e.message), prompt: buildPrompt(style) };
    console.log(`FAILED — ${e.message}`);
  }
}
await writeFile(RESULTS_JSON, `${JSON.stringify(resultsById, null, 2)}\n`);
const results = Object.keys(CANDIDATES).flatMap((id) =>
  resultsById[id] ? [{ ...resultsById[id], style: CANDIDATES[id] }] : []);

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
  "| candidate | source | generation s | final KB | corner RGB | edge px | strict px |",
  "|---|---|---|---|---|---|---|",
  ...results.map((r) =>
    r.error
      ? `| ${r.id} | ERROR | — | — | — | — | ${r.error} |`
      : `| ${r.id} | ${r.source} | ${r.generationSeconds ?? "—"} | ${r.kb} | ${r.key.r},${r.key.g},${r.key.b} | ${r.edgeClearedPixels} | ${r.strictCleanupPixels} |`),
  "",
  "## Full prompts",
  "",
  ...results.flatMap((r) => [`### ${r.id}`, "```", r.prompt ?? buildPrompt(r.style), "```", ""]),
];
await writeFile(join(OUT, "summary.md"), md.join("\n"));
if (failed) {
  console.error("\nOne or more candidates failed validation. Re-run each failed id with --only.");
  process.exitCode = 1;
} else {
  console.log(`\nDone. Open ${join(OUT, "preview.html")} to compare candidates.`);
}

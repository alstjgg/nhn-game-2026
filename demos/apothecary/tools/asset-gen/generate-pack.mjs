#!/usr/bin/env node
// Apothecary demo — asset pack generation (Style E, frozen style bible)
// Setup:  npm install     (installs sharp, see package.json)
// Run:    OPENAI_API_KEY=sk-...  node generate-pack.mjs
// Re-run a single asset:  OPENAI_API_KEY=... node generate-pack.mjs --only equip-mortar
//
// Outputs:
//   out-pack/raw/<id>.png    original 1024/1536 generation (kept for re-processing)
//   out-pack/<id>.png        final asset: /4 downscale (+ color-key where flagged)
//   out-pack/summary.md      timing/size log + manifest-ready prompt records

import { writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = dirname(fileURLToPath(import.meta.url));
const OUT = join(ROOT, "out-pack");
const RAW = join(OUT, "raw");
const KEY = process.env.OPENAI_API_KEY;
if (!KEY) {
  console.error("OPENAI_API_KEY is not set.");
  process.exit(1);
}

const PIXEL_FACTOR = 4; // shared by ALL assets and by the demo's client-side runtime pixelation

const STYLE =
  "Low-resolution 16-bit era pixel art, strict pixel grid, limited palette, clean readable silhouette.";

const SHEET_FORMAT =
  "Character sheet: a 4x2 grid of eight bust portraits of the SAME person, identical framing, scale and head position in every cell, shoulders-up, facing the viewer. " +
  "Four columns, one expression per column — column 1: calm and neutral; column 2: indifferent, losing interest; column 3: irritated, frowning; column 4: fed up, about to walk out. " +
  "Two rows: the top row has eyes open; the bottom row repeats the exact same portrait as the cell above but with eyes closed mid-blink, everything else identical. " +
  "Flat single-color background in all cells. No gridlines, no borders, no text, no labels.";

const MAGENTA_BG =
  "Every object centered with clear margins on a flat solid magenta background (#FF00FF), nothing touching the image edges. No gridlines, no borders, no text, no labels.";

// key: color-key the background to transparency (sprite-type assets only)
const JOBS = [
  {
    id: "bg-shop",
    size: "1536x1024",
    prompt:
      "Wide interior scene: a small back-alley Korean apothecary shop seen from the shopkeeper's side, wooden counter along the bottom edge, shelves of labeled jars and bundles of dried herbs hanging above, entrance door centered in the back wall, warm lantern light, dusk visible through the window. No people, no text.",
  },
  {
    id: "ui-bubble",
    size: "1024x1024",
    key: true,
    prompt:
      "A single empty speech bubble for a retro game dialogue UI: rounded rectangle with a small tail pointing down-left, thick dark outline of even width on all sides (suitable for 9-slice scaling), plain parchment-colored fill. " + MAGENTA_BG,
  },
  {
    id: "ui-shelf",
    size: "1024x1024",
    key: true,
    prompt:
      "A wooden apothecary shelf panel with two rows of empty slots and small drawers below, front view, warm dark wood with brass handles, designed as a UI backdrop panel for item slots. " + MAGENTA_BG,
  },
  {
    id: "ingredients-1",
    size: "1536x1024",
    key: true,
    prompt:
      "Item sprite sheet: a 4x3 grid of small glass apothecary jars. Each COLUMN is one herbal ingredient — column 1: sliced licorice root (감초, pale yellow slices); column 2: dried red jujube dates (대추); column 3: fresh ginger root pieces (생강); column 4: dried yellow chrysanthemum flowers (국화). Each ROW is a fill state — top row: jar full; middle row: jar half full; bottom row: jar nearly empty with only scraps. Identical jar shape, size and position in every cell. " + MAGENTA_BG,
  },
  {
    id: "ingredients-2",
    size: "1536x1024",
    key: true,
    prompt:
      "Item sprite sheet: a 4x3 grid of small glass apothecary jars. Each COLUMN is one herbal ingredient — column 1: dried white balloon-flower roots (도라지); column 2: chalky white poria mushroom chunks (백복령); column 3: small glossy brown jujube seeds (산조인); column 4: fresh green mint leaves (박하). Each ROW is a fill state — top row: jar full; middle row: jar half full; bottom row: jar nearly empty with only scraps. Identical jar shape, size and position in every cell. " + MAGENTA_BG,
  },
  {
    id: "equip-teapot",
    size: "1024x1024",
    key: true,
    prompt:
      "Sprite sheet: a 2x2 grid of the same small round clay teapot used for steeping herbal tea. Top-left: idle, lid closed, no steam. Top-right: steeping frame 1, a faint steam wisp. Bottom-left: steeping frame 2, two steam wisps rising. Bottom-right: steeping frame 3, strong curling steam and a soft warm glow. Identical teapot position and scale in all four cells. " + MAGENTA_BG,
  },
  {
    id: "equip-pot",
    size: "1024x1024",
    key: true,
    prompt:
      "Sprite sheet: a 2x2 grid of the same traditional dark earthenware medicine-brewing pot (약탕관) sitting over a small flame, used for decocting herbs. Top-left: idle, no flame, lid on. Top-right: decocting frame 1, small flame, first bubbles. Bottom-left: decocting frame 2, steady flame, bubbling liquid visible at the rim. Bottom-right: decocting frame 3, strong flame, rolling boil with steam. Identical pot position and scale in all four cells. " + MAGENTA_BG,
  },
  {
    id: "equip-mortar",
    size: "1024x1024",
    key: true,
    prompt:
      "Sprite sheet: a 2x2 grid of the same heavy stone mortar with a wooden pestle, used for grinding herbs. Top-left: idle, pestle resting inside the mortar. Top-right: grinding frame 1, pestle lifted high. Bottom-left: grinding frame 2, pestle striking down into the mortar. Bottom-right: grinding frame 3, pestle down with a small puff of herb powder rising. Identical mortar position and scale in all four cells. " + MAGENTA_BG,
  },
  {
    id: "potions",
    size: "1536x1024",
    key: true,
    prompt:
      "Item sprite sheet: a 3x2 grid of the same small corked glass medicine bottle. Top-left: empty bottle. Top-middle: filled with a calm pale-green remedy. Top-right: filled with a deep brown herbal decoction. Bottom-left: filled with a strange glowing violet experimental brew with tiny sparkles. Bottom-middle: filled with a murky grey-brown failed sludge. Bottom-right: the bottle wrapped in cloth and twine as a finished package. Identical bottle shape, size and position in every cell. " + MAGENTA_BG,
  },
  {
    id: "fallback-portrait-1",
    size: "1536x1024",
    prompt: `${SHEET_FORMAT} A stout middle-aged merchant man with a tired smile, short beard, worn travel coat and a shoulder bag.`,
  },
  {
    id: "fallback-portrait-2",
    size: "1536x1024",
    prompt: `${SHEET_FORMAT} An elderly woman with a kind wrinkled face, grey hair in a neat bun, dark shawl over a hanbok-style jacket.`,
  },
];

async function generate(job) {
  const t0 = Date.now();
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-image-1",
      prompt: `${STYLE} ${job.prompt}`,
      size: job.size,
      quality: "low",
      n: 1,
    }),
  });
  const seconds = ((Date.now() - t0) / 1000).toFixed(1);
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${(await res.text()).slice(0, 300)}`);
  const json = await res.json();
  return { png: Buffer.from(json.data[0].b64_json, "base64"), seconds, usage: json.usage ?? null };
}

async function pixelate(buf, { key }) {
  const meta = await sharp(buf).metadata();
  const w = Math.round(meta.width / PIXEL_FACTOR);
  const h = Math.round(meta.height / PIXEL_FACTOR);
  const small = await sharp(buf).resize(w, h, { kernel: "lanczos3" }).ensureAlpha().raw()
    .toBuffer({ resolveWithObject: true });
  if (key) {
    const { data, info } = small;
    // key color = average of the four corner pixels (magenta, but sampled to be safe)
    const corners = [0, (info.width - 1) * 4, (info.height - 1) * info.width * 4, (info.height * info.width - 1) * 4];
    const kc = [0, 1, 2].map((c) => Math.round(corners.reduce((s, o) => s + data[o + c], 0) / 4));
    const TOL = 60;
    for (let i = 0; i < data.length; i += 4) {
      if (Math.abs(data[i] - kc[0]) <= TOL && Math.abs(data[i + 1] - kc[1]) <= TOL && Math.abs(data[i + 2] - kc[2]) <= TOL)
        data[i + 3] = 0;
    }
  }
  return sharp(small.data, { raw: { width: small.info.width, height: small.info.height, channels: 4 } })
    .png()
    .toBuffer();
}

await mkdir(RAW, { recursive: true });
const only = (() => {
  const i = process.argv.indexOf("--only");
  return i >= 0 ? process.argv[i + 1] : null;
})();

const results = [];
for (const job of JOBS.filter((j) => !only || j.id === only)) {
  process.stdout.write(`${job.id} (${job.size}${job.key ? ", keyed" : ""}) ... `);
  try {
    const { png, seconds, usage } = await generate(job);
    await writeFile(join(RAW, `${job.id}.png`), png);
    const final = await pixelate(png, { key: !!job.key });
    await writeFile(join(OUT, `${job.id}.png`), final);
    results.push({ id: job.id, seconds, kb: Math.round(final.length / 1024), usage, prompt: `${STYLE} ${job.prompt}` });
    console.log(`ok — ${seconds}s, final ${Math.round(final.length / 1024)}KB`);
  } catch (e) {
    results.push({ id: job.id, error: String(e.message) });
    console.log(`FAILED — ${e.message}`);
  }
}

const md = [
  "# Asset pack generation log",
  "",
  `Pixel factor: ${PIXEL_FACTOR} · quality: low · style bible: ${STYLE}`,
  "",
  "| id | seconds | final KB |",
  "|---|---|---|",
  ...results.map((r) => (r.error ? `| ${r.id} | ERROR | ${r.error} |` : `| ${r.id} | ${r.seconds} | ${r.kb} |`)),
  "",
  "## Prompts (for assets-manifest.json entries)",
  "",
  ...results.filter((r) => !r.error).flatMap((r) => [`### ${r.id}`, "```", r.prompt, "```", ""]),
];
await writeFile(join(OUT, "summary.md"), md.join("\n"));
console.log(`\nDone. Final assets + summary.md in: ${OUT}`);

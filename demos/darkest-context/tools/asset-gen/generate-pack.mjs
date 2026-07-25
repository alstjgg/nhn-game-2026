#!/usr/bin/env node
// Darkest Context demo — full asset-pack generation (PRD §2.8, 10 calls).
// Style bible + keyed-sprite prompt guard are read from ../../data/generation.json
// (frozen — style-test candidate A). Pipeline identical to style-test.mjs:
// generate 1536x1024/1024x1024 → corner-validate → border flood-fill key
// (sprites only) → strict magenta cleanup → ÷4 downscale.
// **Run BEFORE the pipeline run by a human key-holder — never by agents in-run.**
//
// Setup:  npm install     (installs sharp, see package.json)
// Run:    OPENAI_API_KEY=sk-...  node generate-pack.mjs
// One asset:               OPENAI_API_KEY=... node generate-pack.mjs --only hero-fiona
// Re-key saved raws (no API): node generate-pack.mjs --reprocess [--only id]
//
// Outputs:
//   out-pack/raw/<id>.png   original generation (kept for re-processing, never committed)
//   out-pack/<id>.png       final asset — ÷4 downscale (+ color-key where flagged)
//   out-pack/summary.md     log + verbatim prompt per asset (for assets-manifest.json)
//   out-pack/results.json   machine-readable log incl. keying metrics + provenance

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import {
  assertTechnicalMagenta,
  clearIsolatedTechnicalMagenta,
  floodFillTechnicalBackground,
} from "./key-background.mjs";
import { resolveRecordedPrompt } from "./result-provenance.mjs";

const ROOT = dirname(fileURLToPath(import.meta.url));
const OUT = join(ROOT, "out-pack");
const RAW = join(OUT, "raw");
const RESULTS_JSON = join(OUT, "results.json");
const REPROCESS = process.argv.includes("--reprocess");
const KEY = process.env.OPENAI_API_KEY;
if (!KEY && !REPROCESS) {
  console.error("OPENAI_API_KEY is not set.");
  process.exit(1);
}

const GEN = JSON.parse(
  await readFile(join(ROOT, "..", "..", "data", "generation.json"), "utf8"),
);
if (GEN.styleBibleStatus !== "frozen") {
  console.error(
    `styleBibleStatus is "${GEN.styleBibleStatus}" — freeze the style bible in data/generation.json before generating the pack.`,
  );
  process.exit(1);
}
const STYLE = GEN.styleBible;
const PIXEL_FACTOR = GEN.pixelFactor; // shared by all assets and the demo runtime

const GUARD =
  `${GEN.keyedSpritePromptGuard} ` +
  "This technical rule overrides every artistic palette instruction.";

const MAGENTA_BG =
  "Fill every negative-space background pixel with one exact, flat, fully opaque color: #FF00FF. " +
  "Draw no floor, ground shadow, platform, glow, texture, gradient, vignette, or lighting in the background. " +
  "Leave exact #FF00FF directly beneath every subject; do not draw a colored base or contact shadow. " +
  "Nothing touches the image edges. No gridlines, no borders, no text, no labels.";

const HERO_LAYOUT =
  "MANDATORY LAYOUT: render exactly twelve separate full-body sprites as four columns by three rows, one sprite centered in each invisible cell. " +
  "Reserve the top, middle, and bottom third of the canvas for one complete row each. Make the sprites small enough that all twelve fit with wide empty magenta gutters. Never omit or crop the third row.";

const MONSTER_LAYOUT =
  "MANDATORY LAYOUT: render exactly six separate sprites as three columns by two rows, one sprite centered in each invisible cell, with wide empty magenta gutters. Never omit a cell.";

const ICON_LAYOUT =
  "MANDATORY LAYOUT: render exactly twelve separate emblems as four columns by three rows, one emblem centered in each invisible cell, identical scale and framing in every cell, with wide empty magenta gutters. Never omit a cell.";

// Hero sheet: PRD §2.8 4x3 — row 1 walk cycle, row 2 gauge-tier poses, row 3 actions.
// The Fiona description is the style-test winner sheet's, kept verbatim for continuity.
const heroSheet = ({ desc, pronoun, walkMove, strike, guard }) =>
  `Sprite sheet: a 4x3 grid of twelve cells, the SAME character in every cell — ${desc}, full body, side view facing right, identical scale and ground line in every cell. ` +
  `Top row: four unmistakably different phases of one walk cycle — contact, down, passing, up. Keep torso, pelvis, scale, ground line, and position pixel-perfect identical across all four cells; move only ${walkMove}. Do not repeat an idle pose. ` +
  `Middle row: four exaggerated standing poses showing sharply rising mental strain, readable at tiny sprite size — cell 1: calm upright posture, healthy warm skin; cell 2: uneasy hunch, tense hands, noticeably pale skin; cell 3: at ${pronoun} limit, doubled over and clutching ${pronoun} head, ashen skin and deep shadowed eyes; cell 4: completely broken, wild defensive crouch, sickly grey skin, frantic eyes. Preserve the same face, clothes, and identity while changing posture and skin tone. ` +
  `Bottom row: four strongly distinct action silhouettes — cell 1: ${strike}; cell 2: ${guard}; cell 3: recoiling backward from a hit; cell 4: fully collapsed on the ground. ` +
  MAGENTA_BG;

// Monster sheet: PRD §2.8 2x3 — idle / hit / death + 3 attack frames (CSS steps(3)).
// Monsters face LEFT (heroes stand stage-left facing right; enemies stand stage-right).
const monsterSheet = ({ desc, groundRef, attack }) =>
  `Sprite sheet: a 3x2 grid of six cells, the SAME creature in every cell — ${desc}, side view facing left, identical scale and ${groundRef} in every cell. ` +
  `Top row, three cells — cell 1: idle stance; cell 2: recoiling from a hit; cell 3: destroyed, collapsed into inert remains. ` +
  `Bottom row: three consecutive frames of one attack — ${attack}. Keep body position identical across the three attack cells; move only the attacking part. ` +
  MAGENTA_BG;

// key: color-key the background to transparency (sprite/UI assets; never the background strip)
// layout: extra grid-enforcement clause for sheet-type keyed assets
const JOBS = [
  {
    id: "bg-dungeon",
    size: "1536x1024",
    prompt:
      "Side-view dungeon corridor background for a walking scene: rough stone block walls, sparse burning torches, hanging chains, scattered bones and patches of moss, long horizontal composition with an even floor line near the bottom edge. The left and right edges must continue each other exactly so the image tiles seamlessly when repeated horizontally. No creatures, no people, no text.",
  },
  {
    id: "hero-garrett",
    size: "1536x1024",
    key: true,
    layout: HERO_LAYOUT,
    prompt: heroSheet({
      desc: "a broad, middle-aged shield knight in dented steel plate armor carrying a massive tower shield and a short sword",
      pronoun: "his",
      walkMove: "arms, legs, shield, and sword",
      strike: "a heavy short-sword strike from behind the shield",
      guard: "planting the tower shield as a full wall in front of him",
    }),
  },
  {
    id: "hero-fiona",
    size: "1536x1024",
    key: true,
    layout: HERO_LAYOUT,
    prompt: heroSheet({
      desc: "a young pilgrim priestess in a hooded travel robe with a small mace and a wooden rosary charm",
      pronoun: "her",
      walkMove: "arms, legs, robe hem, mace, and rosary",
      strike: "a wide mace strike",
      guard: "an unmistakable guard with both raised arms forming a barrier",
    }),
  },
  {
    id: "hero-selene",
    size: "1536x1024",
    key: true,
    layout: HERO_LAYOUT,
    prompt: heroSheet({
      desc: "a sly middle-aged retired con-artist woman in a worn hooded traveler's coat holding a short dagger and a fan of playing cards",
      pronoun: "her",
      walkMove: "arms, legs, coat hem, dagger, and cards",
      strike: "a quick low dagger thrust",
      guard: "a sideways evasive lean behind her raised coat sleeve",
    }),
  },
  {
    id: "mob-spam-golem",
    size: "1536x1024",
    key: true,
    layout: MONSTER_LAYOUT,
    prompt: monsterSheet({
      desc: "a hulking clumsy golem stitched together from crumpled paper letters, bulging envelopes and wax seals, with a blank postage stamp for a face",
      groundRef: "ground line",
      attack: "winding up and slamming both paper fists down",
    }),
  },
  {
    id: "mob-halluc-wisp",
    size: "1536x1024",
    key: true,
    layout: MONSTER_LAYOUT,
    prompt: monsterSheet({
      desc: "a small floating hallucination spirit made of curling pale-green smoke with three mismatched glowing yellow eyes, rendered as a solid opaque sprite",
      groundRef: "hover height",
      attack: "gathering a flickering pale-green orb and hurling it forward",
    }),
  },
  {
    id: "ui-bubble",
    size: "1024x1024",
    key: true,
    prompt:
      "A single empty speech bubble for a retro game dialogue UI: rounded rectangle with a small tail pointing down-left, thick pale outline of even width on all sides (suitable for 9-slice scaling), plain dark aged-parchment fill. " +
      MAGENTA_BG,
  },
  {
    id: "ui-card-frame",
    size: "1024x1024",
    key: true,
    prompt:
      "An empty ornate game card frame: vertical rounded rectangle with an even-width dark iron border decorated with subtle gothic filigree (suitable for 9-slice scaling), plain dark parchment fill, no artwork inside. " +
      MAGENTA_BG,
  },
  {
    // Cell order (row-major) ↔ data/cards.json:
    // 겁이 없다 · 원한 · 동료를 먼저 · 승부사 / 연민 · 이단 베기 · 도발 · 화염 두루마리 /
    // 치유 물약 · 거울 방패 · 번역 렌즈 · 카드 뒷면
    id: "card-icons",
    size: "1536x1024",
    key: true,
    layout: ICON_LAYOUT,
    prompt:
      "Icon sheet: a 4x3 grid of twelve simple game-card emblems, flat bold shapes readable at small size, no letters or digits. " +
      "Top row — cell 1: a fearless raised fist; cell 2: a dark cracked heart pierced by a nail; cell 3: one shield held protectively over two smaller figures; cell 4: a pair of thrown dice. " +
      "Middle row — cell 1: an open hand offering a small flower; cell 2: two crossed slashing sword arcs; cell 3: a jeering horned mask with its tongue out; cell 4: a burning unrolled scroll. " +
      "Bottom row — cell 1: a round potion flask marked with a cross; cell 2: a polished mirror-faced shield; cell 3: a magnifying lens over rune marks; cell 4: an ornate card-back pattern with a single closed eye. " +
      MAGENTA_BG,
  },
  {
    id: "ui-vial",
    size: "1536x1024",
    key: true,
    prompt:
      "Item sprite sheet: four states of the SAME corked glass vial in a single row of four cells, identical vial shape, size and position in every cell — cell 1: nearly empty, a calm pale-blue liquid at the bottom; cell 2: half full, faintly swirling teal liquid; cell 3: nearly full, agitated bubbling orange liquid; cell 4: completely full and boiling over, black-red liquid with glowing cracks in the glass. " +
      MAGENTA_BG,
  },
];

const buildPrompt = (job) =>
  job.key
    ? `${GUARD} ${job.layout ? `${job.layout} ` : ""}${STYLE} ${job.prompt}`
    : `${STYLE} ${job.prompt}`;

async function generate(job) {
  const t0 = Date.now();
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-image-1",
      prompt: buildPrompt(job),
      size: job.size,
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

async function process_(buf, { key }) {
  const full = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { data, info } = full;
  let keyColor = null;
  let edgeClearedPixels = 0;
  let strictCleanupPixels = 0;
  if (key) {
    keyColor = assertTechnicalMagenta(data, info);
    edgeClearedPixels = floodFillTechnicalBackground(data, info, keyColor);
    strictCleanupPixels = clearIsolatedTechnicalMagenta(data, info);
  }
  const w = Math.round(info.width / PIXEL_FACTOR);
  const h = Math.round(info.height / PIXEL_FACTOR);
  const final = await sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .resize(w, h, { kernel: "lanczos3" })
    .png()
    .toBuffer();
  return { final, keyColor, edgeClearedPixels, strictCleanupPixels };
}

await mkdir(RAW, { recursive: true });
const only = (() => {
  const i = process.argv.indexOf("--only");
  return i >= 0 ? process.argv[i + 1] : null;
})();
if (only && !JOBS.some((j) => j.id === only)) {
  console.error(`Unknown asset id "${only}". Expected one of: ${JOBS.map((j) => j.id).join(" · ")}`);
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
for (const job of JOBS.filter((j) => !only || j.id === only)) {
  process.stdout.write(`${job.id} (${job.size}${job.key ? ", keyed" : ""}) ... `);
  const currentPrompt = buildPrompt(job);
  const previous = resultsById[job.id] ?? {};
  let recordedPrompt = REPROCESS ? previous.prompt : currentPrompt;
  try {
    recordedPrompt = resolveRecordedPrompt({
      reprocess: REPROCESS,
      previousPrompt: previous.prompt,
      currentPrompt,
    });
    const generated = REPROCESS
      ? { png: await readFile(join(RAW, `${job.id}.png`)), seconds: null }
      : await generate(job);
    const { png, seconds } = generated;
    if (!REPROCESS) await writeFile(join(RAW, `${job.id}.png`), png);
    const { final, keyColor, edgeClearedPixels, strictCleanupPixels } = await process_(png, {
      key: !!job.key,
    });
    await writeFile(join(OUT, `${job.id}.png`), final);
    resultsById[job.id] = {
      id: job.id,
      source: REPROCESS ? "raw-reprocess" : "api",
      generationSeconds: REPROCESS
        ? (previous.generationSeconds ?? previous.seconds ?? null)
        : seconds,
      kb: Math.round(final.length / 1024),
      keyColor,
      edgeClearedPixels,
      strictCleanupPixels,
      prompt: recordedPrompt,
    };
    const timing = REPROCESS ? "raw reprocess" : `${seconds}s`;
    const keyNote = keyColor
      ? `, key rgb(${keyColor.r},${keyColor.g},${keyColor.b}), edge ${edgeClearedPixels}px, strict ${strictCleanupPixels}px`
      : "";
    console.log(`ok — ${timing}, final ${Math.round(final.length / 1024)}KB${keyNote}`);
  } catch (e) {
    failed = true;
    resultsById[job.id] = { id: job.id, error: String(e.message), prompt: recordedPrompt };
    console.log(`FAILED — ${e.message}`);
  }
}
await writeFile(RESULTS_JSON, `${JSON.stringify(resultsById, null, 2)}\n`);
const results = JOBS.flatMap((j) => (resultsById[j.id] ? [resultsById[j.id]] : []));

const md = [
  "# Asset pack generation log — darkest context",
  "",
  `Pixel factor: ${PIXEL_FACTOR} · quality: low · style bible (frozen): ${STYLE}`,
  "",
  "| id | source | generation s | final KB | corner RGB | edge px | strict px |",
  "|---|---|---|---|---|---|---|",
  ...results.map((r) =>
    r.error
      ? `| ${r.id} | ERROR | — | — | — | — | ${r.error} |`
      : `| ${r.id} | ${r.source} | ${r.generationSeconds ?? "—"} | ${r.kb} | ${r.keyColor ? `${r.keyColor.r},${r.keyColor.g},${r.keyColor.b}` : "—"} | ${r.edgeClearedPixels} | ${r.strictCleanupPixels} |`),
  "",
  "## Prompts (verbatim — for assets-manifest.json entries)",
  "",
  ...results.flatMap((r) => [`### ${r.id}`, "```", r.prompt, "```", ""]),
];
await writeFile(join(OUT, "summary.md"), md.join("\n"));
if (failed) {
  console.error("\nOne or more assets failed. Re-run each failed id with --only <id>.");
  process.exitCode = 1;
} else {
  console.log(`\nDone. Final assets + summary.md in: ${OUT}`);
}

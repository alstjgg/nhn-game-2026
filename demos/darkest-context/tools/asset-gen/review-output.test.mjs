import assert from "node:assert/strict";
import test from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { isStrictTechnicalMagenta } from "./key-background.mjs";

const ROOT = dirname(fileURLToPath(import.meta.url));
const REVIEW = join(ROOT, "review", "revised-pipeline");
const CANDIDATES = ["A", "B", "C", "D"];
const ROWS = [
  [0, 85],
  [85, 85],
  [170, 86],
];

for (const candidate of CANDIDATES) {
  test(`${candidate} revised output is a clean, populated 4x3 sheet`, async () => {
    const output = await sharp(join(REVIEW, `${candidate}.png`))
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    assert.equal(output.info.width, 384);
    assert.equal(output.info.height, 256);
    assert.equal(output.info.channels, 4);

    let remainingTechnicalMagenta = 0;
    for (let offset = 0; offset < output.data.length; offset += 4) {
      if (
        output.data[offset + 3] > 127 &&
        isStrictTechnicalMagenta(
          output.data[offset],
          output.data[offset + 1],
          output.data[offset + 2],
        )
      ) {
        remainingTechnicalMagenta += 1;
      }
    }
    assert.ok(remainingTechnicalMagenta <= 2);

    for (const [startY, height] of ROWS) {
      for (let column = 0; column < 4; column += 1) {
        let opaquePixels = 0;
        for (let y = startY; y < startY + height; y += 1) {
          for (let x = column * 96; x < (column + 1) * 96; x += 1) {
            if (output.data[(y * output.info.width + x) * 4 + 3] > 127) {
              opaquePixels += 1;
            }
          }
        }
        assert.ok(opaquePixels > 500, `row ${startY}, column ${column} is unexpectedly empty`);
      }
    }
  });
}

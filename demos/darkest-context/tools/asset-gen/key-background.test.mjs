import assert from "node:assert/strict";
import test from "node:test";
import {
  assertTechnicalMagenta,
  clearIsolatedTechnicalMagenta,
  floodFillTechnicalBackground,
  sampleCornerAverage,
} from "./key-background.mjs";

function rgbaImage(width, height, color) {
  const data = Buffer.alloc(width * height * 4);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = color[0];
    data[i + 1] = color[1];
    data[i + 2] = color[2];
    data[i + 3] = color[3];
  }
  return { data, info: { width, height, channels: 4 } };
}

function setPixel(image, x, y, color) {
  const offset = (y * image.info.width + x) * 4;
  image.data.set(color, offset);
}

function pixel(image, x, y) {
  const offset = (y * image.info.width + x) * 4;
  return [...image.data.subarray(offset, offset + 4)];
}

test("accepts an opaque technical-magenta corner average", () => {
  const image = rgbaImage(16, 16, [255, 0, 255, 255]);
  assert.deepEqual(sampleCornerAverage(image.data, image.info), { r: 255, g: 0, b: 255 });
  assert.deepEqual(assertTechnicalMagenta(image.data, image.info), { r: 255, g: 0, b: 255 });
});

test("rejects a non-magenta background before keying", () => {
  const image = rgbaImage(16, 16, [80, 70, 90, 255]);
  assert.throws(
    () => assertTechnicalMagenta(image.data, image.info),
    /background validation failed.*keying skipped/,
  );
});

test("broad flood fill clears only edge-connected pixels and preserves enclosed dark purple", () => {
  const image = rgbaImage(9, 9, [255, 0, 255, 255]);
  for (let y = 3; y <= 5; y += 1) {
    for (let x = 3; x <= 5; x += 1) {
      setPixel(image, x, y, [20, 20, 20, 255]);
    }
  }
  setPixel(image, 4, 4, [140, 70, 150, 255]);

  const key = assertTechnicalMagenta(image.data, image.info);
  const cleared = floodFillTechnicalBackground(image.data, image.info, key);

  assert.equal(cleared, 72);
  assert.deepEqual(pixel(image, 0, 0), [0, 0, 0, 0]);
  assert.deepEqual(pixel(image, 4, 4), [140, 70, 150, 255]);
  assert.deepEqual(pixel(image, 3, 3), [20, 20, 20, 255]);
});

test("strict cleanup removes isolated technical magenta without removing dark purple", () => {
  const image = rgbaImage(5, 5, [20, 20, 20, 255]);
  setPixel(image, 1, 1, [230, 20, 230, 255]);
  setPixel(image, 3, 3, [140, 70, 150, 255]);

  assert.equal(clearIsolatedTechnicalMagenta(image.data, image.info), 1);
  assert.deepEqual(pixel(image, 1, 1), [0, 0, 0, 0]);
  assert.deepEqual(pixel(image, 3, 3), [140, 70, 150, 255]);
});

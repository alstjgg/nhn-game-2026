export const TECHNICAL_MAGENTA_RANGE = {
  redGreaterThan: 180,
  greenLessThan: 100,
  blueGreaterThan: 180,
};

const DEFAULT_FLOOD_TOLERANCE = 120;

export function isStrictTechnicalMagenta(r, g, b) {
  return (
    r > TECHNICAL_MAGENTA_RANGE.redGreaterThan &&
    g < TECHNICAL_MAGENTA_RANGE.greenLessThan &&
    b > TECHNICAL_MAGENTA_RANGE.blueGreaterThan
  );
}

export function sampleCornerAverage(data, info) {
  const { width, height, channels } = info;
  if (channels !== 4) throw new Error(`expected RGBA input, got ${channels} channels`);

  const sampleSize = Math.max(1, Math.min(16, Math.floor(width / 8), Math.floor(height / 8)));
  const origins = [
    [0, 0],
    [width - sampleSize, 0],
    [0, height - sampleSize],
    [width - sampleSize, height - sampleSize],
  ];
  const totals = [0, 0, 0];
  let count = 0;

  for (const [startX, startY] of origins) {
    for (let y = startY; y < startY + sampleSize; y += 1) {
      for (let x = startX; x < startX + sampleSize; x += 1) {
        const offset = (y * width + x) * channels;
        totals[0] += data[offset];
        totals[1] += data[offset + 1];
        totals[2] += data[offset + 2];
        count += 1;
      }
    }
  }

  return {
    r: Math.round(totals[0] / count),
    g: Math.round(totals[1] / count),
    b: Math.round(totals[2] / count),
  };
}

export function assertTechnicalMagenta(data, info) {
  const key = sampleCornerAverage(data, info);
  const valid = isStrictTechnicalMagenta(key.r, key.g, key.b);

  if (!valid) {
    throw new Error(
      `background validation failed: corner average rgb(${key.r}, ${key.g}, ${key.b}) ` +
        "is outside R>180, B>180, G<100; keying skipped — regenerate with --only",
    );
  }
  return key;
}

export function floodFillTechnicalBackground(
  data,
  info,
  key,
  tolerance = DEFAULT_FLOOD_TOLERANCE,
) {
  const { width, height, channels } = info;
  if (channels !== 4) throw new Error(`expected RGBA input, got ${channels} channels`);

  const pixelCount = width * height;
  const visited = new Uint8Array(pixelCount);
  const queue = new Uint32Array(pixelCount);
  let head = 0;
  let tail = 0;

  const isKeyLike = (pixelIndex) => {
    const offset = pixelIndex * channels;
    return (
      Math.abs(data[offset] - key.r) <= tolerance &&
      Math.abs(data[offset + 1] - key.g) <= tolerance &&
      Math.abs(data[offset + 2] - key.b) <= tolerance
    );
  };

  const enqueue = (pixelIndex) => {
    if (visited[pixelIndex] || !isKeyLike(pixelIndex)) return;
    visited[pixelIndex] = 1;
    queue[tail] = pixelIndex;
    tail += 1;
  };

  for (let x = 0; x < width; x += 1) {
    enqueue(x);
    enqueue((height - 1) * width + x);
  }
  for (let y = 1; y < height - 1; y += 1) {
    enqueue(y * width);
    enqueue(y * width + width - 1);
  }

  let clearedPixels = 0;
  while (head < tail) {
    const pixelIndex = queue[head];
    head += 1;
    const offset = pixelIndex * channels;
    data[offset] = 0;
    data[offset + 1] = 0;
    data[offset + 2] = 0;
    data[offset + 3] = 0;
    clearedPixels += 1;

    const x = pixelIndex % width;
    const y = Math.floor(pixelIndex / width);
    if (x > 0) enqueue(pixelIndex - 1);
    if (x + 1 < width) enqueue(pixelIndex + 1);
    if (y > 0) enqueue(pixelIndex - width);
    if (y + 1 < height) enqueue(pixelIndex + width);
  }

  return clearedPixels;
}

export function clearIsolatedTechnicalMagenta(data, info) {
  const { width, height, channels } = info;
  if (channels !== 4) throw new Error(`expected RGBA input, got ${channels} channels`);

  let clearedPixels = 0;
  for (let pixelIndex = 0; pixelIndex < width * height; pixelIndex += 1) {
    const offset = pixelIndex * channels;
    if (
      data[offset + 3] > 0 &&
      isStrictTechnicalMagenta(data[offset], data[offset + 1], data[offset + 2])
    ) {
      data[offset] = 0;
      data[offset + 1] = 0;
      data[offset + 2] = 0;
      data[offset + 3] = 0;
      clearedPixels += 1;
    }
  }
  return clearedPixels;
}

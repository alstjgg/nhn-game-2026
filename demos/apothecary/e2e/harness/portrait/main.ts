// Isolated e2e harness for u9 — mounts the real mountPortrait() and stands in for
// the future app shell on the one thing the component deliberately does NOT do
// itself: gating a RUNTIME sheet through u3's pixelation before it is displayed
// (`pixelate.ts` hands back a PixelCanvas and leaves turning it into something CSS
// can reference to the consumer). The harness therefore owns the whole runtime
// path — raw sheet in, `pixelateSheet` downscale, pixelated URL onto the panel —
// and records each step for e2e/portrait.spec.ts to assert against.
//
// The "raw runtime sheet" is drawn here at 1536x1024 (the generated sheet format
// from data/generation.json) rather than shipped as an asset: nothing in the
// repository needs an extra binary just to prove the gate, and the harness stays
// fully offline.
import {
  PIXEL_FACTOR,
  pixelateSheet,
  sheetPixelSize,
  type PixelCanvas,
  type PixelSize,
} from '../../../src/ui/pixelate';
import {
  PORTRAIT_COLUMNS,
  PORTRAIT_ROWS,
  mountPortrait,
  portraitCell,
  type PortraitCell,
} from '../../../src/ui/portrait';

const RAW_SHEET = { width: 1536, height: 1024 } as const;

interface Pixelation {
  calls: number;
  raw: PixelSize | null;
  expected: PixelSize | null;
  out: PixelSize | null;
}

interface PortraitApi {
  setTier(tier: number): void;
  setBlink(blink: boolean): void;
  arrive(): Promise<void>;
  cellFor(tier: number, blink: boolean): PortraitCell | undefined;
  readonly tier: number;
  readonly blink: boolean;
  readonly silhouette: boolean;
  readonly rawUrl: string;
  readonly pixelation: Pixelation;
}

/**
 * A stand-in for an AI-generated expression sheet: eight cells of the "same
 * person", four columns of increasing irritation, the bottom row identical but
 * with the eyes shut. Flat shapes on purpose — they survive the downscale and
 * make every cell visibly distinct.
 */
function drawRawSheet(): string {
  const canvas = document.createElement('canvas');
  canvas.width = RAW_SHEET.width;
  canvas.height = RAW_SHEET.height;
  const ctx = canvas.getContext('2d');
  if (ctx === null) throw new Error('portrait harness: no 2d context for the raw sheet');

  const cellW = RAW_SHEET.width / PORTRAIT_COLUMNS;
  const cellH = RAW_SHEET.height / PORTRAIT_ROWS;
  for (let col = 0; col < PORTRAIT_COLUMNS; col += 1) {
    for (let row = 0; row < PORTRAIT_ROWS; row += 1) {
      const x = col * cellW;
      const y = row * cellH;
      ctx.fillStyle = `hsl(${20 + col * 40} 45% ${row === 0 ? 38 : 26}%)`;
      ctx.fillRect(x, y, cellW, cellH);

      ctx.fillStyle = '#f0e6d2';
      ctx.beginPath();
      ctx.arc(x + cellW / 2, y + cellH * 0.45, cellW * 0.28, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#2a2018';
      const eyeY = y + cellH * 0.42;
      for (const dx of [-0.1, 0.1]) {
        const eyeX = x + cellW / 2 + cellW * dx;
        if (row === 0) {
          ctx.beginPath();
          ctx.arc(eyeX, eyeY, cellW * 0.035, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(eyeX - cellW * 0.045, eyeY, cellW * 0.09, cellH * 0.01);
        }
      }
    }
  }
  return canvas.toDataURL('image/png');
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', () =>
      reject(new Error('portrait harness: the raw sheet failed to decode')),
    );
    image.src = src;
  });
}

const app = document.getElementById('app');
if (app !== null) {
  const portrait = mountPortrait(app);

  // A sibling AFTER the panel: if a portrait swap or the arrival ever reflowed,
  // this is what would move.
  const probe = document.createElement('p');
  probe.dataset.testid = 'layout-probe';
  probe.textContent = '아래 내용은 초상이 바뀌어도 움직이지 않는다.';
  app.append(probe);

  const rawUrl = drawRawSheet();
  const pixelation: Pixelation = { calls: 0, raw: null, expected: null, out: null };

  const arrive = async (): Promise<void> => {
    const image = await loadImage(rawUrl);
    const raw = { width: image.naturalWidth, height: image.naturalHeight };
    pixelation.calls += 1;
    pixelation.raw = raw;
    pixelation.expected = sheetPixelSize(raw.width, raw.height, PIXEL_FACTOR);

    // The factory seam doubles as the handle on the surface u3 drew into, which is
    // what this layer needs in order to hand CSS a URL.
    const drawn: HTMLCanvasElement[] = [];
    const createCanvas = (width: number, height: number): PixelCanvas => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      drawn.push(canvas);
      return canvas;
    };

    const result = pixelateSheet(image, { createCanvas });
    // §3-5: a failed pixelation is silent and simply displays nothing — the
    // silhouette stays, the raw sheet is never shown.
    if (result === image || drawn.length === 0) return;
    const surface = drawn[0];
    pixelation.out = { width: surface.width, height: surface.height };
    portrait.setSheet(surface.toDataURL('image/png'));
  };

  const api: PortraitApi = {
    setTier: (tier: number) => portrait.setTier(tier),
    setBlink: (blink: boolean) => portrait.setBlink(blink),
    arrive,
    cellFor: (tier: number, blink: boolean) => portraitCell(tier, blink),
    get tier() {
      return portrait.tier;
    },
    get blink() {
      return portrait.blink;
    },
    get silhouette() {
      return portrait.silhouette;
    },
    rawUrl,
    pixelation,
  };

  // Two names for one object, both part of the harness contract e2e/portrait.spec.ts
  // reads: `__portrait` is what the spec waits for after navigation, and the global
  // `api()` accessor is how it reaches the handle from INSIDE page.evaluate — a
  // function handed to evaluate() is compiled in the page, so it can only resolve
  // names the page itself defines, never the spec module's own helpers.
  (window as unknown as { __portrait: PortraitApi; api: () => PortraitApi }).__portrait = api;
  (window as unknown as { __portrait: PortraitApi; api: () => PortraitApi }).api = () => api;
}

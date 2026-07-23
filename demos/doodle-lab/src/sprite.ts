import type { RecordedStroke } from './analyzer.ts'

export interface SpriteCanvasDimensions {
  readonly width: number
  readonly height: number
}

export interface DoodleSpriteOptions {
  /** Transparent breathing room around the detected ink, in source-canvas pixels. */
  readonly padding?: number
}

export interface DoodleSprite {
  readonly dataUrl: string
  readonly width: number
  readonly height: number
  readonly aspectRatio: number
  readonly sourceWidth: number
  readonly sourceHeight: number
  readonly sourceBounds: {
    readonly x: number
    readonly y: number
    readonly width: number
    readonly height: number
  }
  readonly padding: number
}

export interface NormalizedRegion {
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
}

export interface SourceRegion {
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
}

export type DoodleSpriteStroke = RecordedStroke

interface Bounds {
  readonly minX: number
  readonly minY: number
  readonly maxX: number
  readonly maxY: number
}

type AlphaScanResult = Bounds | 'empty' | null

const DEFAULT_PADDING = 10
const MIN_LINE_WIDTH = 0.5

/**
 * Converts only the player's visible ink into a tightly cropped transparent PNG.
 * The crop is never resized, so the original doodle proportions are preserved.
 */
export function extractDoodleSprite(
  strokes: readonly DoodleSpriteStroke[],
  dimensions: SpriteCanvasDimensions,
  options: DoodleSpriteOptions = {},
): DoodleSprite {
  const sourceWidth = toCanvasDimension(dimensions.width)
  const sourceHeight = toCanvasDimension(dimensions.height)
  const sourceCanvas = createCanvas(sourceWidth, sourceHeight)
  const sourceContext = sourceCanvas.getContext('2d', { alpha: true })
  if (!sourceContext) return emptySprite(sourceWidth, sourceHeight)

  const drawableStrokes = strokes.filter(isPlayerStroke)
  const geometryBounds = drawPlayerInk(sourceContext, drawableStrokes)
  if (!geometryBounds) return emptySprite(sourceWidth, sourceHeight)

  const alphaBounds = findAlphaBounds(sourceContext, geometryBounds, sourceWidth, sourceHeight)
  if (alphaBounds === 'empty') return emptySprite(sourceWidth, sourceHeight)
  const contentBounds = alphaBounds ?? clipBounds(geometryBounds, sourceWidth, sourceHeight)
  if (!contentBounds) return emptySprite(sourceWidth, sourceHeight)

  const requestedPadding = options.padding ?? DEFAULT_PADDING
  const padding = Number.isFinite(requestedPadding)
    ? Math.max(0, Math.ceil(requestedPadding))
    : DEFAULT_PADDING
  const contentWidth = Math.max(1, contentBounds.maxX - contentBounds.minX + 1)
  const contentHeight = Math.max(1, contentBounds.maxY - contentBounds.minY + 1)
  const outputWidth = contentWidth + padding * 2
  const outputHeight = contentHeight + padding * 2
  const outputCanvas = createCanvas(outputWidth, outputHeight)
  const outputContext = outputCanvas.getContext('2d', { alpha: true })
  if (!outputContext) return emptySprite(sourceWidth, sourceHeight)

  outputContext.drawImage(
    sourceCanvas,
    contentBounds.minX,
    contentBounds.minY,
    contentWidth,
    contentHeight,
    padding,
    padding,
    contentWidth,
    contentHeight,
  )

  return {
    dataUrl: outputCanvas.toDataURL('image/png'),
    width: outputWidth,
    height: outputHeight,
    aspectRatio: outputWidth / outputHeight,
    sourceWidth,
    sourceHeight,
    sourceBounds: {
      x: contentBounds.minX,
      y: contentBounds.minY,
      width: contentWidth,
      height: contentHeight,
    },
    padding,
  }
}

/** Maps a VLM region on the cropped sprite back to source-canvas pixels. */
export function mapSpriteRegionToSource(
  region: NormalizedRegion,
  sprite: DoodleSprite,
): SourceRegion {
  const left = clamp(region.x, 0, 1) * sprite.width
  const top = clamp(region.y, 0, 1) * sprite.height
  const right = clamp(region.x + region.width, 0, 1) * sprite.width
  const bottom = clamp(region.y + region.height, 0, 1) * sprite.height
  const sourceLeft = clamp(
    sprite.sourceBounds.x + left - sprite.padding,
    0,
    sprite.sourceWidth,
  )
  const sourceTop = clamp(
    sprite.sourceBounds.y + top - sprite.padding,
    0,
    sprite.sourceHeight,
  )
  const sourceRight = clamp(
    sprite.sourceBounds.x + right - sprite.padding,
    0,
    sprite.sourceWidth,
  )
  const sourceBottom = clamp(
    sprite.sourceBounds.y + bottom - sprite.padding,
    0,
    sprite.sourceHeight,
  )
  return {
    x: sourceLeft,
    y: sourceTop,
    width: Math.max(0, sourceRight - sourceLeft),
    height: Math.max(0, sourceBottom - sourceTop),
  }
}

function isPlayerStroke(stroke: DoodleSpriteStroke): boolean {
  return stroke.source !== 'template'
    && stroke.points.some(isFinitePoint)
}

function drawPlayerInk(
  context: CanvasRenderingContext2D,
  strokes: readonly DoodleSpriteStroke[],
): Bounds | null {
  let minX = Number.POSITIVE_INFINITY
  let minY = Number.POSITIVE_INFINITY
  let maxX = Number.NEGATIVE_INFINITY
  let maxY = Number.NEGATIVE_INFINITY

  context.lineCap = 'round'
  context.lineJoin = 'round'

  for (const stroke of strokes) {
    const points = stroke.points.filter(isFinitePoint)
    if (points.length === 0) continue

    const lineWidth = Number.isFinite(stroke.width)
      ? Math.max(MIN_LINE_WIDTH, stroke.width)
      : MIN_LINE_WIDTH
    const radius = lineWidth / 2
    context.globalCompositeOperation = stroke.tool === 'eraser' ? 'destination-out' : 'source-over'
    context.strokeStyle = stroke.color
    context.fillStyle = stroke.color
    context.lineWidth = lineWidth

    if (points.length === 1) {
      const point = points[0]
      if (!point) continue
      context.beginPath()
      context.arc(point.x, point.y, radius, 0, Math.PI * 2)
      context.fill()
    } else {
      const firstPoint = points[0]
      if (!firstPoint) continue
      context.beginPath()
      context.moveTo(firstPoint.x, firstPoint.y)
      for (let pointIndex = 1; pointIndex < points.length; pointIndex += 1) {
        const point = points[pointIndex]
        if (point) context.lineTo(point.x, point.y)
      }
      context.stroke()

      // A path containing repeated coordinates has no segment area in some engines.
      if (points.every((point) => point.x === firstPoint.x && point.y === firstPoint.y)) {
        context.beginPath()
        context.arc(firstPoint.x, firstPoint.y, radius, 0, Math.PI * 2)
        context.fill()
      }
    }

    if (stroke.tool !== 'eraser') {
      for (const point of points) {
        minX = Math.min(minX, point.x - radius)
        minY = Math.min(minY, point.y - radius)
        maxX = Math.max(maxX, point.x + radius)
        maxY = Math.max(maxY, point.y + radius)
      }
    }
  }

  if (![minX, minY, maxX, maxY].every(Number.isFinite)) return null
  return { minX, minY, maxX, maxY }
}

function findAlphaBounds(
  context: CanvasRenderingContext2D,
  geometryBounds: Bounds,
  sourceWidth: number,
  sourceHeight: number,
): AlphaScanResult {
  const scanBounds = clipBounds(geometryBounds, sourceWidth, sourceHeight)
  if (!scanBounds) return null

  const scanWidth = scanBounds.maxX - scanBounds.minX + 1
  const scanHeight = scanBounds.maxY - scanBounds.minY + 1
  try {
    const pixels = context.getImageData(
      scanBounds.minX,
      scanBounds.minY,
      scanWidth,
      scanHeight,
    ).data
    let minX = scanWidth
    let minY = scanHeight
    let maxX = -1
    let maxY = -1

    for (let y = 0; y < scanHeight; y += 1) {
      for (let x = 0; x < scanWidth; x += 1) {
        const alpha = pixels[(y * scanWidth + x) * 4 + 3]
        if (alpha === 0) continue
        minX = Math.min(minX, x)
        minY = Math.min(minY, y)
        maxX = Math.max(maxX, x)
        maxY = Math.max(maxY, y)
      }
    }

    if (maxX < minX || maxY < minY) return 'empty'
    return {
      minX: scanBounds.minX + minX,
      minY: scanBounds.minY + minY,
      maxX: scanBounds.minX + maxX,
      maxY: scanBounds.minY + maxY,
    }
  } catch {
    // Geometry still gives a safe crop if pixel reads are unavailable.
    return null
  }
}

function clipBounds(bounds: Bounds, width: number, height: number): Bounds | null {
  const minX = Math.max(0, Math.floor(bounds.minX))
  const minY = Math.max(0, Math.floor(bounds.minY))
  const maxX = Math.min(width - 1, Math.ceil(bounds.maxX))
  const maxY = Math.min(height - 1, Math.ceil(bounds.maxY))
  if (minX > maxX || minY > maxY) return null
  return { minX, minY, maxX, maxY }
}

function isFinitePoint(point: DoodleSpriteStroke['points'][number]): boolean {
  return Number.isFinite(point.x) && Number.isFinite(point.y)
}

function toCanvasDimension(value: number): number {
  if (!Number.isFinite(value)) return 1
  return Math.max(1, Math.round(value))
}

function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  return canvas
}

function emptySprite(sourceWidth = 1, sourceHeight = 1): DoodleSprite {
  const canvas = createCanvas(1, 1)
  return {
    dataUrl: canvas.toDataURL('image/png'),
    width: 1,
    height: 1,
    aspectRatio: 1,
    sourceWidth,
    sourceHeight,
    sourceBounds: { x: 0, y: 0, width: 1, height: 1 },
    padding: 0,
  }
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value))
}

import type { PublicDoodleReading } from '../doodle-life/contracts.ts'
import type { DrawingSnapshot } from '../drawing-board.ts'
import { mapSpriteRegionToSource, type SourceRegion } from '../sprite.ts'

const FEATURE_COLORS = ['#e56f61', '#4e9297', '#816aa8', '#d39a32'] as const

/** Draws evidence on a separate canvas so it can never leak into a reread image. */
export class EvidenceOverlay {
  readonly #canvas: HTMLCanvasElement
  readonly #context: CanvasRenderingContext2D

  constructor(canvas: HTMLCanvasElement) {
    const context = canvas.getContext('2d', { alpha: true })
    if (!context) throw new Error('Evidence overlay canvas is unavailable.')
    this.#canvas = canvas
    this.#context = context
  }

  clear(): void {
    this.#context.clearRect(0, 0, this.#canvas.width, this.#canvas.height)
    this.#canvas.classList.remove('is-visible')
  }

  render(reading: PublicDoodleReading, drawing: DrawingSnapshot): void {
    this.clear()
    for (const [index, feature] of reading.visibleFeatures.entries()) {
      const region = mapSpriteRegionToSource(feature.region, drawing.sprite)
      const color = FEATURE_COLORS[index % FEATURE_COLORS.length] ?? FEATURE_COLORS[0]
      this.#drawInkGlow(drawing, region, color)
      this.#drawRegion(region, color, false, index + 1)
    }
    for (const uncertainty of reading.uncertainties) {
      this.#drawRegion(
        mapSpriteRegionToSource(uncertainty.region, drawing.sprite),
        '#8a817c',
        true,
      )
    }
    this.#canvas.classList.add('is-visible')
  }

  #drawInkGlow(drawing: DrawingSnapshot, region: SourceRegion, color: string): void {
    const context = this.#context
    context.save()
    context.lineCap = 'round'
    context.lineJoin = 'round'
    context.strokeStyle = color
    context.shadowColor = color
    context.shadowBlur = 13
    context.globalAlpha = 0.7
    context.lineWidth = 5
    for (const stroke of drawing.strokes) {
      if (stroke.tool === 'eraser') continue
      const points = stroke.points.filter((point) => inside(point.x, point.y, region))
      if (points.length < 2) continue
      const first = points[0]
      if (!first) continue
      context.beginPath()
      context.moveTo(first.x, first.y)
      for (const point of points.slice(1)) context.lineTo(point.x, point.y)
      context.stroke()
    }
    context.restore()
  }

  #drawRegion(region: SourceRegion, color: string, uncertain: boolean, number?: number): void {
    if (region.width <= 0 || region.height <= 0) return
    const context = this.#context
    context.save()
    context.strokeStyle = color
    context.fillStyle = `${color}${uncertain ? '12' : '1f'}`
    context.lineWidth = uncertain ? 2 : 3
    context.setLineDash(uncertain ? [7, 6] : [])
    context.shadowColor = color
    context.shadowBlur = uncertain ? 0 : 8
    roundedRect(context, region.x, region.y, region.width, region.height, 10)
    context.fill()
    context.stroke()
    if (number !== undefined) {
      context.setLineDash([])
      context.shadowBlur = 0
      context.fillStyle = color
      context.beginPath()
      context.arc(region.x + 12, region.y + 12, 11, 0, Math.PI * 2)
      context.fill()
      context.fillStyle = '#fffaf0'
      context.font = '800 12px system-ui'
      context.textAlign = 'center'
      context.textBaseline = 'middle'
      context.fillText(String(number), region.x + 12, region.y + 12.5)
    }
    context.restore()
  }
}

function inside(x: number, y: number, region: SourceRegion): boolean {
  return x >= region.x
    && y >= region.y
    && x <= region.x + region.width
    && y <= region.y + region.height
}

function roundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  const safeRadius = Math.min(radius, width / 2, height / 2)
  context.beginPath()
  context.moveTo(x + safeRadius, y)
  context.arcTo(x + width, y, x + width, y + height, safeRadius)
  context.arcTo(x + width, y + height, x, y + height, safeRadius)
  context.arcTo(x, y + height, x, y, safeRadius)
  context.arcTo(x, y, x + width, y, safeRadius)
  context.closePath()
}

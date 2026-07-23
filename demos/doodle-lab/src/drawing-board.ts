import type { RecordedStroke, StrokePoint, StrokeTool } from './analyzer.ts'
import { extractDoodleSprite, type DoodleSprite } from './sprite.ts'

export interface DrawingSnapshot {
  readonly strokes: readonly RecordedStroke[]
  readonly sprite: DoodleSprite
  readonly canvasWidth: number
  readonly canvasHeight: number
}

interface MutableStroke {
  readonly points: StrokePoint[]
  readonly color: string
  readonly width: number
  readonly tool: StrokeTool
  readonly source: 'player'
}

const DEFAULT_COLOR = '#382f2a'
const DEFAULT_WIDTH = 9

/** Pointer-safe drawing surface whose output contains only the player's ink. */
export class DrawingBoard {
  readonly #canvas: HTMLCanvasElement
  readonly #context: CanvasRenderingContext2D
  readonly #onChange?: (hasInk: boolean, canUndo: boolean) => void
  readonly #strokes: MutableStroke[] = []
  #activeStroke: MutableStroke | null = null
  #pointerId: number | null = null
  #color = DEFAULT_COLOR
  #width = DEFAULT_WIDTH
  #tool: StrokeTool = 'brush'

  constructor(canvas: HTMLCanvasElement, onChange?: (hasInk: boolean, canUndo: boolean) => void) {
    const context = canvas.getContext('2d', { alpha: true })
    if (!context) throw new Error('2D canvas is not available.')

    this.#canvas = canvas
    this.#context = context
    this.#onChange = onChange
    this.#context.lineCap = 'round'
    this.#context.lineJoin = 'round'

    canvas.addEventListener('pointerdown', this.#startStroke)
    canvas.addEventListener('pointermove', this.#continueStroke)
    canvas.addEventListener('mousemove', this.#continueMouseStroke)
    canvas.addEventListener('pointerup', this.#finishStroke)
    canvas.addEventListener('pointercancel', this.#finishStroke)
  }

  get hasInk(): boolean {
    try {
      const pixels = this.#context.getImageData(0, 0, this.#canvas.width, this.#canvas.height).data
      for (let index = 3; index < pixels.length; index += 4) {
        if (pixels[index] !== 0) return true
      }
      return false
    } catch {
      return this.#strokes.some((stroke) => stroke.tool !== 'eraser' && stroke.points.length > 0)
    }
  }

  get canUndo(): boolean {
    return this.#strokes.length > 0
  }

  setColor(color: string): void {
    if (/^#[0-9a-f]{6}$/i.test(color)) this.#color = color
    this.#tool = 'brush'
  }

  setWidth(width: number): void {
    if (Number.isFinite(width)) this.#width = Math.max(2, Math.min(28, width))
  }

  setTool(tool: 'brush' | 'eraser'): void {
    this.#tool = tool
  }

  clear(): void {
    this.#strokes.splice(0)
    this.#activeStroke = null
    this.#context.clearRect(0, 0, this.#canvas.width, this.#canvas.height)
    this.#onChange?.(false, false)
  }

  undo(): void {
    if (this.#activeStroke || this.#strokes.length === 0) return
    this.#strokes.pop()
    this.#redraw()
    this.#onChange?.(this.hasInk, this.canUndo)
  }

  snapshot(): DrawingSnapshot {
    const strokes = this.#strokes.map<RecordedStroke>((stroke) => ({
      color: stroke.color,
      points: stroke.points.map((point) => ({ ...point })),
      source: 'player',
      tool: stroke.tool,
      width: stroke.width,
    }))
    return {
      strokes,
      sprite: extractDoodleSprite(strokes, {
        width: this.#canvas.width,
        height: this.#canvas.height,
      }, { padding: 18 }),
      canvasWidth: this.#canvas.width,
      canvasHeight: this.#canvas.height,
    }
  }

  destroy(): void {
    this.#canvas.removeEventListener('pointerdown', this.#startStroke)
    this.#canvas.removeEventListener('pointermove', this.#continueStroke)
    this.#canvas.removeEventListener('mousemove', this.#continueMouseStroke)
    this.#canvas.removeEventListener('pointerup', this.#finishStroke)
    this.#canvas.removeEventListener('pointercancel', this.#finishStroke)
  }

  readonly #startStroke = (event: PointerEvent): void => {
    if (this.#pointerId !== null || event.button !== 0) return
    event.preventDefault()
    this.#pointerId = event.pointerId
    this.#canvas.setPointerCapture(event.pointerId)
    const stroke: MutableStroke = {
      points: [this.#toPoint(event)],
      color: this.#color,
      width: this.#tool === 'eraser' ? Math.max(18, this.#width * 2.4) : this.#width,
      tool: this.#tool,
      source: 'player',
    }
    this.#activeStroke = stroke
    this.#strokes.push(stroke)
    this.#drawDot(stroke, stroke.points[0])
    this.#onChange?.(this.hasInk, this.canUndo)
  }

  readonly #continueStroke = (event: PointerEvent): void => {
    if (event.pointerId !== this.#pointerId || !this.#activeStroke) return
    event.preventDefault()
    const coalescedEvents = event.getCoalescedEvents?.() ?? []
    const samples = coalescedEvents.length > 0 ? coalescedEvents : [event]
    for (const coalesced of samples) {
      this.#appendPoint(coalesced)
    }
  }

  readonly #continueMouseStroke = (event: MouseEvent): void => {
    if (this.#pointerId === null || !this.#activeStroke || event.buttons !== 1) return
    this.#appendPoint(event)
  }

  readonly #finishStroke = (event: PointerEvent): void => {
    if (event.pointerId !== this.#pointerId) return
    if (this.#canvas.hasPointerCapture(event.pointerId)) {
      this.#canvas.releasePointerCapture(event.pointerId)
    }
    this.#activeStroke = null
    this.#pointerId = null
    this.#onChange?.(this.hasInk, this.canUndo)
  }

  #appendPoint(event: MouseEvent | PointerEvent): void {
    if (!this.#activeStroke) return
    const previous = this.#activeStroke.points.at(-1)
    const point = this.#toPoint(event)
    if (previous && Math.abs(previous.x - point.x) < .05 && Math.abs(previous.y - point.y) < .05) return
    this.#activeStroke.points.push(point)
    if (previous) this.#drawSegment(this.#activeStroke, previous, point)
  }

  #toPoint(event: MouseEvent | PointerEvent): StrokePoint {
    const bounds = this.#canvas.getBoundingClientRect()
    return {
      x: (event.clientX - bounds.left) * (this.#canvas.width / Math.max(1, bounds.width)),
      y: (event.clientY - bounds.top) * (this.#canvas.height / Math.max(1, bounds.height)),
      t: performance.now(),
    }
  }

  #withStroke(stroke: MutableStroke, draw: () => void): void {
    this.#context.save()
    this.#context.globalCompositeOperation = stroke.tool === 'eraser' ? 'destination-out' : 'source-over'
    this.#context.strokeStyle = stroke.color
    this.#context.fillStyle = stroke.color
    this.#context.lineWidth = stroke.width
    this.#context.lineCap = 'round'
    this.#context.lineJoin = 'round'
    draw()
    this.#context.restore()
  }

  #drawDot(stroke: MutableStroke, point: StrokePoint | undefined): void {
    if (!point) return
    this.#withStroke(stroke, () => {
      this.#context.beginPath()
      this.#context.arc(point.x, point.y, stroke.width / 2, 0, Math.PI * 2)
      this.#context.fill()
    })
  }

  #drawSegment(stroke: MutableStroke, from: StrokePoint, to: StrokePoint): void {
    this.#withStroke(stroke, () => {
      this.#context.beginPath()
      this.#context.moveTo(from.x, from.y)
      this.#context.lineTo(to.x, to.y)
      this.#context.stroke()
    })
  }

  #redraw(): void {
    this.#context.clearRect(0, 0, this.#canvas.width, this.#canvas.height)
    for (const stroke of this.#strokes) {
      const first = stroke.points[0]
      if (!first) continue
      if (stroke.points.length === 1) {
        this.#drawDot(stroke, first)
        continue
      }
      for (let index = 1; index < stroke.points.length; index++) {
        const from = stroke.points[index - 1]
        const to = stroke.points[index]
        if (from && to) this.#drawSegment(stroke, from, to)
      }
    }
  }
}

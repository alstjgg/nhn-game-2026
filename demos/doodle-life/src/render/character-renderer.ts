import type { CharacterDesignSpec } from '../ai/contracts.ts'
import {
  sanitizeCharacterDesign,
  sanitizeCoordinate,
  sanitizeImageUrl,
  sanitizeText,
  type SanitizedFaceAnchors,
  type SanitizedMotionChannel,
  type SanitizedVisualShape,
} from './design-sanitizer.ts'

export interface DoodleSpriteInput {
  readonly url: string
  readonly width?: number
  readonly height?: number
  readonly alt?: string
}

export interface CharacterRendererOptions {
  readonly label?: string
  readonly doodleSprite?: string | DoodleSpriteInput
  readonly animateIdle?: boolean
  readonly reducedMotion?: boolean
  readonly ownerDocument?: Document
}

export interface RenderedCharacter {
  readonly element: HTMLDivElement
  readonly visual: SVGSVGElement | HTMLImageElement
  readonly parts: ReadonlyMap<string, Element>
  readonly anchors: SanitizedFaceAnchors
  readonly idleAnimations: readonly Animation[]
  stopIdle(): void
  destroy(): void
}

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg'

/**
 * Renders an AI character using only whitelisted DOM/SVG primitives.
 * No generated value is interpreted as markup, CSS, or an external URL.
 */
export function renderCharacterDesign(
  spec: CharacterDesignSpec,
  options: CharacterRendererOptions = {},
): RenderedCharacter {
  const ownerDocument = options.ownerDocument ?? document
  const design = sanitizeCharacterDesign(spec)
  const element = ownerDocument.createElement('div')
  element.className = 'generated-character'
  element.dataset.characterRenderer = 'safe-dom'
  element.setAttribute('role', 'img')
  element.setAttribute('aria-label', sanitizeText(options.label, 80, '생성된 정원 주민'))
  exposeAnchors(element, design.faceAnchors)

  const parts = new Map<string, Element>()
  const sprite = sanitizeDoodleSprite(options.doodleSprite)
  let visual: SVGSVGElement | HTMLImageElement

  if (sprite) {
    element.classList.add('generated-character--doodle')
    element.dataset.characterRenderer = 'doodle-sprite'
    const image = ownerDocument.createElement('img')
    image.className = 'generated-character__doodle'
    image.src = sprite.url
    image.alt = ''
    image.draggable = false
    image.decoding = 'async'
    image.referrerPolicy = 'no-referrer'
    image.dataset.partId = 'body'
    image.setAttribute('aria-hidden', 'true')
    image.style.objectFit = 'contain'
    image.style.maxWidth = '100%'
    image.style.maxHeight = '100%'
    if (sprite.width && sprite.height) {
      image.width = sprite.width
      image.height = sprite.height
      element.style.aspectRatio = `${sprite.width} / ${sprite.height}`
    }
    element.append(image)
    parts.set('body', image)
    visual = image
  } else {
    element.classList.add('generated-character--vector')
    const svg = createSvg(ownerDocument)
    const body = createShapeElement(ownerDocument, design.body)
    const appendPart = (part: (typeof design.parts)[number]): void => {
      const partElement = createShapeElement(ownerDocument, part.shape)
      partElement.dataset.partId = part.id
      partElement.classList.add('generated-character__part')
      if (design.expressivePartIds.includes(part.id)) {
        partElement.classList.add('generated-character__part--expressive')
      }
      svg.append(partElement)
      parts.set(part.id, partElement)
    }
    for (const part of design.parts.filter((candidate) => candidate.zIndex < 0)) appendPart(part)
    body.dataset.partId = 'body'
    body.classList.add('generated-character__body')
    if (design.expressivePartIds.includes('body')) body.classList.add('generated-character__part--expressive')
    svg.append(body)
    parts.set('body', body)
    for (const part of design.parts.filter((candidate) => candidate.zIndex >= 0)) appendPart(part)
    if (!hasExplicitFace(design.parts.map((part) => part.id))) {
      svg.append(createDefaultFace(ownerDocument, design.faceAnchors))
    }
    element.append(svg)
    visual = svg
  }

  const idleAnimations = shouldAnimate(options)
    ? startIdleMotions(element, parts, design.idleMotions)
    : []
  const stopIdle = (): void => {
    for (const animation of idleAnimations) animation.cancel()
  }

  return {
    element,
    visual,
    parts,
    anchors: design.faceAnchors,
    idleAnimations,
    stopIdle,
    destroy(): void {
      stopIdle()
      element.remove()
    },
  }
}

/** Convenience API for callers that only need the safe root node. */
export function createCharacterElement(
  spec: CharacterDesignSpec,
  options: CharacterRendererOptions = {},
): HTMLDivElement {
  return renderCharacterDesign(spec, options).element
}

function createSvg(ownerDocument: Document): SVGSVGElement {
  const svg = ownerDocument.createElementNS(SVG_NAMESPACE, 'svg')
  svg.classList.add('generated-character__svg')
  svg.setAttribute('viewBox', '-10 -10 120 120')
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet')
  svg.setAttribute('aria-hidden', 'true')
  svg.setAttribute('focusable', 'false')
  svg.style.overflow = 'visible'
  return svg
}

function createShapeElement(ownerDocument: Document, shape: SanitizedVisualShape): SVGElement {
  let element: SVGElement
  if (shape.kind === 'ellipse') {
    const ellipse = ownerDocument.createElementNS(SVG_NAMESPACE, 'ellipse')
    ellipse.setAttribute('cx', String(shape.cx))
    ellipse.setAttribute('cy', String(shape.cy))
    ellipse.setAttribute('rx', String(shape.rx))
    ellipse.setAttribute('ry', String(shape.ry))
    element = ellipse
  } else if (shape.kind === 'polygon') {
    const polygon = ownerDocument.createElementNS(SVG_NAMESPACE, 'polygon')
    polygon.setAttribute('points', shape.points.map((point) => `${point.x},${point.y}`).join(' '))
    element = polygon
  } else if (shape.kind === 'line') {
    const line = ownerDocument.createElementNS(SVG_NAMESPACE, 'line')
    line.setAttribute('x1', String(shape.x1))
    line.setAttribute('y1', String(shape.y1))
    line.setAttribute('x2', String(shape.x2))
    line.setAttribute('y2', String(shape.y2))
    line.setAttribute('stroke-linecap', shape.linecap)
    element = line
  } else {
    const path = ownerDocument.createElementNS(SVG_NAMESPACE, 'path')
    path.setAttribute('d', shape.d)
    element = path
  }

  element.setAttribute('fill', shape.fill)
  element.setAttribute('stroke', shape.stroke)
  element.setAttribute('stroke-width', String(shape.strokeWidth))
  element.setAttribute('opacity', String(shape.opacity))
  element.setAttribute('stroke-linejoin', 'round')
  element.setAttribute('vector-effect', 'non-scaling-stroke')
  element.style.transformBox = 'fill-box'
  element.style.transformOrigin = 'center'
  return element
}

function hasExplicitFace(partIds: readonly string[]): boolean {
  return partIds.some((id) => /(?:eye|pupil|mouth|face|smile)/i.test(id))
}

function createDefaultFace(ownerDocument: Document, anchors: SanitizedFaceAnchors): SVGGElement {
  const group = ownerDocument.createElementNS(SVG_NAMESPACE, 'g')
  group.classList.add('generated-character__default-face')
  group.setAttribute('aria-hidden', 'true')
  group.setAttribute('pointer-events', 'none')

  for (const [index, anchor] of [anchors.leftEye, anchors.rightEye].entries()) {
    const eye = ownerDocument.createElementNS(SVG_NAMESPACE, 'ellipse')
    eye.setAttribute('cx', String(anchor.x))
    eye.setAttribute('cy', String(anchor.y))
    eye.setAttribute('rx', '2.5')
    eye.setAttribute('ry', '3.2')
    eye.setAttribute('fill', '#382f2a')
    eye.dataset.facePart = index === 0 ? 'left-eye' : 'right-eye'
    group.append(eye)
  }

  const mouth = ownerDocument.createElementNS(SVG_NAMESPACE, 'path')
  const x = anchors.mouth.x
  const y = anchors.mouth.y
  mouth.setAttribute('d', `M ${x - 4} ${y} Q ${x} ${y + 3.2} ${x + 4} ${y}`)
  mouth.setAttribute('fill', 'none')
  mouth.setAttribute('stroke', '#382f2a')
  mouth.setAttribute('stroke-width', '2')
  mouth.setAttribute('stroke-linecap', 'round')
  mouth.setAttribute('vector-effect', 'non-scaling-stroke')
  mouth.dataset.facePart = 'mouth'
  group.append(mouth)
  return group
}

function exposeAnchors(element: HTMLElement, anchors: SanitizedFaceAnchors): void {
  element.dataset.anchorLeftEyeX = String(anchors.leftEye.x)
  element.dataset.anchorLeftEyeY = String(anchors.leftEye.y)
  element.dataset.anchorRightEyeX = String(anchors.rightEye.x)
  element.dataset.anchorRightEyeY = String(anchors.rightEye.y)
  element.dataset.anchorMouthX = String(anchors.mouth.x)
  element.dataset.anchorMouthY = String(anchors.mouth.y)
}

function startIdleMotions(
  root: HTMLElement,
  parts: ReadonlyMap<string, Element>,
  channels: readonly SanitizedMotionChannel[],
): Animation[] {
  const animations: Animation[] = []
  for (const channel of channels) {
    const target = channel.targetPartId ? parts.get(channel.targetPartId) : root
    if (!target || typeof target.animate !== 'function') continue
    const keyframes = motionKeyframes(channel)
    const animation = target.animate(keyframes, {
      duration: channel.durationMs,
      delay: channel.delayMs,
      direction: 'alternate',
      iterations: Number.POSITIVE_INFINITY,
      easing: 'ease-in-out',
    })
    animations.push(animation)
  }
  return animations
}

function motionKeyframes(channel: SanitizedMotionChannel): Keyframe[] {
  if (channel.property === 'opacity') {
    return [{ opacity: channel.from }, { opacity: channel.to }]
  }
  const unit = channel.property === 'rotate' ? 'deg' : channel.property === 'scale' ? '' : 'px'
  const functionName = channel.property === 'rotate' ? 'rotate' : channel.property
  return [
    { transform: `${functionName}(${channel.from}${unit})` },
    { transform: `${functionName}(${channel.to}${unit})` },
  ]
}

function sanitizeDoodleSprite(value: CharacterRendererOptions['doodleSprite']): Required<DoodleSpriteInput> | null {
  const source = typeof value === 'string' ? { url: value } : value
  if (!source) return null
  const url = sanitizeImageUrl(source.url)
  if (!url) return null
  const width = Math.round(sanitizeCoordinate(source.width, { min: 0, max: 2_048, fallback: 0 }))
  const height = Math.round(sanitizeCoordinate(source.height, { min: 0, max: 2_048, fallback: 0 }))
  return {
    url,
    width,
    height,
    alt: sanitizeText(source.alt, 80),
  }
}

function shouldAnimate(options: CharacterRendererOptions): boolean {
  if (options.animateIdle === false || options.reducedMotion === true) return false
  if (options.reducedMotion === false) return true
  return !(globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false)
}

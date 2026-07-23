import type {
  MotionHint,
  PublicDoodleReading,
  QuestVerdict,
} from '../doodle-life/contracts.ts'
import type { DoodleSprite } from '../sprite.ts'
import { sanitizeImageUrl, sanitizeText } from './design-sanitizer.ts'

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg'
let nextMaskId = 0

export interface DoodleLifeform {
  readonly element: HTMLDivElement
  playArrival(verdict: QuestVerdict): Promise<void>
  destroy(): void
}

/**
 * Animates the exact submitted PNG. Evidence parts are clipped duplicates of
 * the same pixels, never a generated body, portrait frame, or redrawn mascot.
 */
export function createDoodleLifeform(
  sprite: DoodleSprite,
  reading: PublicDoodleReading,
  ownerDocument: Document = document,
): DoodleLifeform {
  const safeUrl = sanitizeImageUrl(sprite.dataUrl)
  if (!safeUrl) throw new Error('The doodle sprite URL is invalid.')
  const root = ownerDocument.createElement('div')
  root.className = 'doodle-lifeform'
  root.dataset.motion = primaryMotion(reading.motionHints)
  root.style.aspectRatio = `${Math.max(1, sprite.width)} / ${Math.max(1, sprite.height)}`
  root.setAttribute('role', 'img')
  root.setAttribute('aria-label', sanitizeText(`${reading.name}, ${reading.essence}`, 160, reading.name))

  const locomotion = ownerDocument.createElement('div')
  locomotion.className = 'doodle-lifeform__locomotion'
  const body = image(ownerDocument, safeUrl, 'doodle-lifeform__body')
  const animatedFeatures = motionFeatures(reading)
  const mask = inverseFeatureMask(ownerDocument, animatedFeatures.map(({ feature }) => feature.region))
  const maskUrl = `url("#${mask.id}")`
  body.style.maskImage = maskUrl
  body.style.setProperty('-webkit-mask-image', maskUrl)
  locomotion.append(body)

  for (const { hint, feature } of animatedFeatures) {
    const part = ownerDocument.createElement('span')
    part.className = 'doodle-lifeform__part'
    part.dataset.motion = hint.motion
    part.title = sanitizeText(hint.description, 160)
    part.style.left = `${feature.region.x * 100}%`
    part.style.top = `${feature.region.y * 100}%`
    part.style.width = `${feature.region.width * 100}%`
    part.style.height = `${feature.region.height * 100}%`
    part.style.transformOrigin = `${clamp01((hint.anchor.x - feature.region.x) / feature.region.width) * 100}% ${clamp01((hint.anchor.y - feature.region.y) / feature.region.height) * 100}%`
    const pixels = image(ownerDocument, safeUrl, 'doodle-lifeform__part-image')
    pixels.style.width = `${100 / feature.region.width}%`
    pixels.style.height = `${100 / feature.region.height}%`
    pixels.style.left = `${-feature.region.x / feature.region.width * 100}%`
    pixels.style.top = `${-feature.region.y / feature.region.height * 100}%`
    part.append(pixels)
    locomotion.append(part)
  }
  root.append(mask.svg, locomotion)

  return {
    element: root,
    async playArrival(verdict: QuestVerdict): Promise<void> {
      root.dataset.verdict = verdict
      if (typeof root.animate !== 'function' || reducedMotion()) return
      const keyframes = arrivalKeyframes(verdict)
      await root.animate(keyframes, {
        duration: verdict === 'full' ? 1700 : 1350,
        easing: 'cubic-bezier(.18,.86,.25,1.12)',
        fill: 'both',
      }).finished.catch(() => undefined)
      root.classList.add('is-alive')
    },
    destroy(): void {
      for (const animation of root.getAnimations({ subtree: true })) animation.cancel()
      root.remove()
    },
  }
}

function motionFeatures(reading: PublicDoodleReading) {
  const claimedIds = new Set<string>()
  return reading.motionHints.slice(0, 4).flatMap((hint) => {
    if (claimedIds.has(hint.featureId)) return []
    const feature = reading.visibleFeatures.find((candidate) => candidate.id === hint.featureId)
    if (!feature) return []
    claimedIds.add(hint.featureId)
    return [{ hint, feature }]
  })
}

function inverseFeatureMask(
  ownerDocument: Document,
  regions: readonly PublicDoodleReading['visibleFeatures'][number]['region'][],
): { readonly id: string; readonly svg: SVGSVGElement } {
  const id = `doodle-lifeform-mask-${nextMaskId++}`
  const svg = ownerDocument.createElementNS(SVG_NAMESPACE, 'svg')
  svg.classList.add('doodle-lifeform__mask-definitions')
  svg.setAttribute('aria-hidden', 'true')
  svg.setAttribute('focusable', 'false')

  const definitions = ownerDocument.createElementNS(SVG_NAMESPACE, 'defs')
  const mask = ownerDocument.createElementNS(SVG_NAMESPACE, 'mask')
  mask.id = id
  mask.setAttribute('maskUnits', 'objectBoundingBox')
  mask.setAttribute('maskContentUnits', 'objectBoundingBox')
  mask.setAttribute('mask-type', 'luminance')

  const base = ownerDocument.createElementNS(SVG_NAMESPACE, 'rect')
  base.setAttribute('x', '0')
  base.setAttribute('y', '0')
  base.setAttribute('width', '1')
  base.setAttribute('height', '1')
  base.setAttribute('fill', 'white')
  mask.append(base)

  for (const region of regions) {
    const hole = ownerDocument.createElementNS(SVG_NAMESPACE, 'rect')
    hole.setAttribute('x', String(clamp01(region.x)))
    hole.setAttribute('y', String(clamp01(region.y)))
    hole.setAttribute('width', String(Math.min(1 - clamp01(region.x), clamp01(region.width))))
    hole.setAttribute('height', String(Math.min(1 - clamp01(region.y), clamp01(region.height))))
    hole.setAttribute('fill', 'black')
    mask.append(hole)
  }
  definitions.append(mask)
  svg.append(definitions)
  return { id, svg }
}

function image(ownerDocument: Document, source: string, className: string): HTMLImageElement {
  const element = ownerDocument.createElement('img')
  element.className = className
  element.src = source
  element.alt = ''
  element.draggable = false
  element.decoding = 'async'
  element.setAttribute('aria-hidden', 'true')
  return element
}

function primaryMotion(hints: readonly MotionHint[]): MotionHint['motion'] {
  return hints[0]?.motion ?? 'pulse'
}

function arrivalKeyframes(verdict: QuestVerdict): Keyframe[] {
  if (verdict === 'full') {
    return [
      { opacity: 0, transform: 'translate(-30vw, 22vh) scale(.42) rotate(-12deg)' },
      { opacity: 1, offset: 0.35, transform: 'translate(-12vw, -8vh) scale(.78) rotate(5deg)' },
      { opacity: 1, transform: 'translate(0, 0) scale(1) rotate(0deg)' },
    ]
  }
  if (verdict === 'success') {
    return [
      { opacity: 0, transform: 'translate(-24vw, 18vh) scale(.5)' },
      { opacity: 1, transform: 'translate(0, 0) scale(1)' },
    ]
  }
  if (verdict === 'partial') {
    return [
      { opacity: 0, transform: 'translate(-18vw, 14vh) scale(.5) rotate(-5deg)' },
      { opacity: 1, offset: 0.72, transform: 'translate(2vw, -2vh) scale(1.02) rotate(2deg)' },
      { opacity: 1, transform: 'translate(0, 0) scale(1)' },
    ]
  }
  return [
    { opacity: 0, transform: 'translate(-16vw, 20vh) scale(.45) rotate(-16deg)' },
    { opacity: 1, offset: 0.65, transform: 'translate(1vw, -1vh) scale(1.04) rotate(7deg)' },
    { opacity: 1, transform: 'translate(0, 0) scale(1) rotate(0deg)' },
  ]
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value))
}

function reducedMotion(): boolean {
  return globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}

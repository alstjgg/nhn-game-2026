import {
  ResolvedEncounterValidator,
  type ReactionCommand,
  type ResolvedEncounter,
} from '../doodle-life/contracts.ts'

export interface ResolvedEncounterPlayerOptions {
  readonly stage: HTMLElement
  readonly actors: ReadonlyMap<string, HTMLElement>
  readonly props: ReadonlyMap<string, HTMLElement>
  readonly signal?: AbortSignal
  readonly reducedMotion?: boolean
  readonly onStatus?: (message: string) => void
}

interface MotionState {
  x: number
  y: number
}

interface StagePoint {
  readonly x: number
  readonly y: number
}

interface InlineStyleSnapshot {
  readonly animationPlayState: string
  readonly translate: string
  readonly rotate: string
  readonly scale: string
  readonly opacity: string
  readonly filter: string
  readonly zIndex: string
}

interface PlaybackContext {
  readonly options: ResolvedEncounterPlayerOptions
  readonly stageRect: DOMRect
  readonly overlay: HTMLDivElement
  readonly origins: ReadonlyMap<HTMLElement, StagePoint>
  readonly motion: Map<HTMLElement, MotionState>
  readonly snapshots: Map<HTMLElement, InlineStyleSnapshot>
  readonly animations: Set<Animation>
  readonly temporaryNodes: Set<HTMLElement>
  readonly reducedMotion: boolean
}

type SpeakCommand = Extract<ReactionCommand, { kind: 'speak' }>
type LookCommand = Extract<ReactionCommand, { kind: 'look' }>
type GestureCommand = Extract<ReactionCommand, { kind: 'gesture' }>
type MoveCommand = Extract<ReactionCommand, { kind: 'move' }>
type PropMotionCommand = Extract<ReactionCommand, { kind: 'prop-motion' }>

/**
 * Plays resolver-approved encounter commands without applying any persistent
 * world effects. Every touched actor/prop style and temporary speech node is
 * restored or removed after playback, including cancellation and failures.
 */
export async function playResolvedEncounter(
  encounterValue: ResolvedEncounter,
  options: ResolvedEncounterPlayerOptions,
): Promise<void> {
  const encounter = ResolvedEncounterValidator.parse(encounterValue)
  const stageRect = options.stage.getBoundingClientRect()
  const overlay = createOverlay(options.stage, stageRect)
  const elements = uniqueElements(options.actors, options.props)
  const origins = new Map<HTMLElement, StagePoint>()
  for (const element of elements) origins.set(element, relativeCenter(element, stageRect))

  const context: PlaybackContext = {
    options,
    stageRect,
    overlay,
    origins,
    motion: new Map(),
    snapshots: new Map(),
    animations: new Set(),
    temporaryNodes: new Set([overlay]),
    reducedMotion: resolveReducedMotion(options),
  }

  try {
    ensureActive(context)
    options.stage.ownerDocument.body.append(overlay)
    emitStatus(context, encounter.statusText)
    for (const command of encounter.commands) {
      ensureActive(context)
      await playCommand(command, context)
    }
  } finally {
    for (const animation of context.animations) animation.cancel()
    for (const node of context.temporaryNodes) node.remove()
    for (const [element, snapshot] of context.snapshots) restoreStyle(element, snapshot)
  }
}

async function playCommand(command: ReactionCommand, context: PlaybackContext): Promise<void> {
  if (command.kind === 'speak') return playSpeech(command, context)
  if (command.kind === 'look') return playLook(command, context)
  if (command.kind === 'gesture') return playGesture(command, context)
  if (command.kind === 'move') return playMove(command, context)
  return playPropMotion(command, context)
}

async function playSpeech(command: SpeakCommand, context: PlaybackContext): Promise<void> {
  const actor = actorFor(command.actorId, context)
  const text = safeText(command.text, 180)
  if (!actor || !text) return

  prepareElement(actor, context)
  emitStatus(context, text)
  const bubble = context.overlay.ownerDocument.createElement('div')
  bubble.dataset.encounterTemporary = 'speech'
  bubble.setAttribute('role', 'status')
  bubble.textContent = text
  Object.assign(bubble.style, {
    position: 'absolute',
    maxWidth: 'min(260px, 72vw)',
    color: '#382f2a',
    background: '#fffaf0f2',
    border: '2px solid #5a4b42',
    borderRadius: '16px 19px 14px 20px',
    padding: '8px 12px',
    fontSize: '13px',
    fontWeight: '750',
    lineHeight: '1.45',
    textAlign: 'center',
    overflowWrap: 'anywhere',
    boxShadow: '3px 4px 0 #47352a29',
    pointerEvents: 'none',
    transform: 'translateX(-50%)',
  } satisfies Partial<CSSStyleDeclaration>)
  placeNearActor(bubble, actor, context)
  context.overlay.append(bubble)
  context.temporaryNodes.add(bubble)

  const duration = context.reducedMotion ? 650 : 1_450
  await animate(
    bubble,
    context.reducedMotion
      ? [{ opacity: 0 }, { opacity: 1, offset: .15 }, { opacity: 1, offset: .8 }, { opacity: 0 }]
      : [
          { opacity: 0, transform: 'translate(-50%, 7px) scale(.94)' },
          { opacity: 1, transform: 'translate(-50%, 0) scale(1)', offset: .16 },
          { opacity: 1, transform: 'translate(-50%, 0) scale(1)', offset: .8 },
          { opacity: 0, transform: 'translate(-50%, -6px) scale(.98)' },
        ],
    duration,
    'ease-in-out',
    context,
  )
  removeTemporary(bubble, context)
}

async function playLook(command: LookCommand, context: PlaybackContext): Promise<void> {
  const actor = actorFor(command.actorId, context)
  const target = actorFor(command.targetId, context)
  if (!actor || !target) return
  prepareElement(actor, context)

  const actorPoint = currentPoint(actor, context)
  const targetPoint = currentPoint(target, context)
  const direction = targetPoint.x < actorPoint.x ? -1 : 1
  const base = motionFor(actor, context)
  await animate(
    actor,
    context.reducedMotion
      ? [{ opacity: 1 }, { opacity: .78 }, { opacity: 1 }]
      : [
          motionFrame(base, 0, 1),
          motionFrame(base, direction * 4, 1.01),
          motionFrame(base, 0, 1),
        ],
    context.reducedMotion ? 120 : 480,
    'ease-in-out',
    context,
  )
}

async function playGesture(command: GestureCommand, context: PlaybackContext): Promise<void> {
  const actor = actorFor(command.actorId, context)
  if (!actor) return
  prepareElement(actor, context)
  const base = motionFor(actor, context)
  await animate(
    actor,
    gestureFrames(command.gesture, base, context.reducedMotion),
    context.reducedMotion ? 140 : 720,
    'cubic-bezier(.25,.9,.3,1.15)',
    context,
  )
}

async function playMove(command: MoveCommand, context: PlaybackContext): Promise<void> {
  const actor = actorFor(command.actorId, context)
  const origin = actor ? context.origins.get(actor) : undefined
  if (!actor || !origin) return
  prepareElement(actor, context)

  const previous = motionFor(actor, context)
  const next: MotionState = {
    x: percentToPixels(command.to.x, context.stageRect.width) - origin.x,
    y: percentToPixels(command.to.y, context.stageRect.height) - origin.y,
  }
  await animate(
    actor,
    context.reducedMotion
      ? [
          { ...motionFrame(previous, 0, 1), opacity: 1 },
          { ...motionFrame(next, 0, 1), opacity: .72 },
          { ...motionFrame(next, 0, 1), opacity: 1 },
        ]
      : [
          motionFrame(previous, 0, 1),
          motionFrame(next, 0, 1),
        ],
    context.reducedMotion ? 160 : command.durationMs,
    'cubic-bezier(.2,.8,.25,1)',
    context,
  )
  context.motion.set(actor, next)
  actor.style.translate = `${format(next.x)}px ${format(next.y)}px`
}

async function playPropMotion(command: PropMotionCommand, context: PlaybackContext): Promise<void> {
  const prop = context.options.props.get(command.targetId)
  if (!prop || !prop.isConnected) return
  prepareElement(prop, context)
  await animate(
    prop,
    propFrames(command.motion, context.reducedMotion),
    context.reducedMotion ? 140 : 760,
    'ease-in-out',
    context,
  )
}

function gestureFrames(
  gesture: GestureCommand['gesture'],
  base: MotionState,
  reducedMotion: boolean,
): Keyframe[] {
  if (reducedMotion) return [{ opacity: 1 }, { opacity: .74 }, { opacity: 1 }]
  const rest = motionFrame(base, 0, 1)
  if (gesture === 'nod') {
    return [rest, { ...motionFrame(base, 2, .97), translate: `${format(base.x)}px ${format(base.y + 5)}px` }, rest]
  }
  if (gesture === 'stretch') return [rest, motionFrame(base, -3, 1.12), rest]
  if (gesture === 'flutter') return [rest, motionFrame(base, -7, 1.04), motionFrame(base, 7, .98), rest]
  if (gesture === 'listen') return [rest, motionFrame(base, -4, 1), motionFrame(base, 2, 1.02), rest]
  if (gesture === 'circle') return [rest, motionFrame(base, 180, 1.03), motionFrame(base, 360, 1)]
  if (gesture === 'spark') return [rest, motionFrame(base, -4, 1.16), motionFrame(base, 4, 1.06), rest]
  return [
    rest,
    { ...motionFrame(base, 0, .97), translate: `${format(base.x)}px ${format(base.y + 5)}px` },
    rest,
  ]
}

function propFrames(motion: PropMotionCommand['motion'], reducedMotion: boolean): Keyframe[] {
  if (reducedMotion) return [{ opacity: 1 }, { opacity: .72 }, { opacity: 1 }]
  if (motion === 'ring') return [{ rotate: '0deg', scale: '1' }, { rotate: '-8deg', scale: '1.08' }, { rotate: '8deg', scale: '1.08' }, { rotate: '0deg', scale: '1' }]
  if (motion === 'sway') return [{ rotate: '0deg' }, { rotate: '-7deg' }, { rotate: '7deg' }, { rotate: '0deg' }]
  if (motion === 'glow') return [{ opacity: 1, filter: 'brightness(1)' }, { opacity: .88, filter: 'brightness(1.45)' }, { opacity: 1, filter: 'brightness(1)' }]
  if (motion === 'ripple') return [{ scale: '1', opacity: 1 }, { scale: '1.16', opacity: .68 }, { scale: '1', opacity: 1 }]
  if (motion === 'open') return [{ scale: '1 1' }, { scale: '1.18 1.04' }, { scale: '1 1' }]
  return [{ translate: '0 0' }, { translate: '0 5px' }, { translate: '0 0' }]
}

function prepareElement(element: HTMLElement, context: PlaybackContext): void {
  if (context.snapshots.has(element)) return
  context.snapshots.set(element, snapshotStyle(element))
  element.style.animationPlayState = 'paused'
  element.style.zIndex = '41'
}

async function animate(
  element: HTMLElement,
  frames: Keyframe[],
  durationMs: number,
  easing: string,
  context: PlaybackContext,
): Promise<void> {
  ensureActive(context)
  const duration = Math.max(1, Math.min(3_000, durationMs))
  if (typeof element.animate !== 'function') {
    await abortableDelay(duration, context.options.signal)
    return
  }
  const animation = element.animate(frames, { duration, easing })
  context.animations.add(animation)
  try {
    await animationFinished(animation, context.options.signal)
  } finally {
    context.animations.delete(animation)
    animation.cancel()
  }
}

function animationFinished(animation: Animation, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) {
    animation.cancel()
    return Promise.reject(abortError())
  }
  if (!signal) return animation.finished.then(() => undefined)
  return new Promise((resolve, reject) => {
    const abort = (): void => {
      animation.cancel()
      reject(abortError())
    }
    signal.addEventListener('abort', abort, { once: true })
    animation.finished.then(
      () => {
        signal.removeEventListener('abort', abort)
        resolve()
      },
      (error: unknown) => {
        signal.removeEventListener('abort', abort)
        reject(error)
      },
    )
  })
}

function actorFor(id: string, context: PlaybackContext): HTMLElement | null {
  const actor = context.options.actors.get(id)
  return actor?.isConnected ? actor : null
}

function motionFor(element: HTMLElement, context: PlaybackContext): MotionState {
  const existing = context.motion.get(element)
  if (existing) return existing
  const initial = { x: 0, y: 0 }
  context.motion.set(element, initial)
  return initial
}

function currentPoint(element: HTMLElement, context: PlaybackContext): StagePoint {
  const origin = context.origins.get(element) ?? relativeCenter(element, context.stageRect)
  const motion = motionFor(element, context)
  return { x: origin.x + motion.x, y: origin.y + motion.y }
}

function motionFrame(state: MotionState, rotation: number, scale: number): Keyframe {
  return {
    translate: `${format(state.x)}px ${format(state.y)}px`,
    rotate: `${format(rotation)}deg`,
    scale: format(scale),
  }
}

function placeNearActor(
  bubble: HTMLElement,
  actor: HTMLElement,
  context: PlaybackContext,
): void {
  const point = currentPoint(actor, context)
  bubble.style.left = `${format(point.x)}px`
  bubble.style.top = `${format(Math.max(18, point.y - 58))}px`
}

function createOverlay(stage: HTMLElement, rect: DOMRect): HTMLDivElement {
  const overlay = stage.ownerDocument.createElement('div')
  overlay.dataset.encounterTemporary = 'overlay'
  overlay.setAttribute('aria-live', 'polite')
  Object.assign(overlay.style, {
    position: 'fixed',
    left: `${rect.left}px`,
    top: `${rect.top}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    overflow: 'visible',
    pointerEvents: 'none',
    zIndex: '80',
  } satisfies Partial<CSSStyleDeclaration>)
  return overlay
}

function uniqueElements(
  actors: ReadonlyMap<string, HTMLElement>,
  props: ReadonlyMap<string, HTMLElement>,
): ReadonlySet<HTMLElement> {
  return new Set([...actors.values(), ...props.values()].filter((element) => element.isConnected))
}

function relativeCenter(element: HTMLElement, stageRect: DOMRect): StagePoint {
  const rect = element.getBoundingClientRect()
  return {
    x: rect.left - stageRect.left + rect.width / 2,
    y: rect.top - stageRect.top + rect.height / 2,
  }
}

function snapshotStyle(element: HTMLElement): InlineStyleSnapshot {
  return {
    animationPlayState: element.style.animationPlayState,
    translate: element.style.translate,
    rotate: element.style.rotate,
    scale: element.style.scale,
    opacity: element.style.opacity,
    filter: element.style.filter,
    zIndex: element.style.zIndex,
  }
}

function restoreStyle(element: HTMLElement, snapshot: InlineStyleSnapshot): void {
  element.style.animationPlayState = snapshot.animationPlayState
  element.style.translate = snapshot.translate
  element.style.rotate = snapshot.rotate
  element.style.scale = snapshot.scale
  element.style.opacity = snapshot.opacity
  element.style.filter = snapshot.filter
  element.style.zIndex = snapshot.zIndex
}

function removeTemporary(node: HTMLElement, context: PlaybackContext): void {
  node.remove()
  context.temporaryNodes.delete(node)
}

function emitStatus(context: PlaybackContext, value: string): void {
  const text = safeText(value, 240)
  if (text) context.options.onStatus?.(text)
}

function resolveReducedMotion(options: ResolvedEncounterPlayerOptions): boolean {
  if (typeof options.reducedMotion === 'boolean') return options.reducedMotion
  const view = options.stage.ownerDocument.defaultView
  return view?.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}

function ensureActive(context: PlaybackContext): void {
  if (context.options.signal?.aborted) throw abortError()
}

function abortableDelay(durationMs: number, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) return Promise.reject(abortError())
  return new Promise((resolve, reject) => {
    const view = globalThis.window
    const timeout = view.setTimeout(() => {
      signal?.removeEventListener('abort', abort)
      resolve()
    }, durationMs)
    const abort = (): void => {
      view.clearTimeout(timeout)
      reject(abortError())
    }
    signal?.addEventListener('abort', abort, { once: true })
  })
}

function percentToPixels(value: number, extent: number): number {
  return value / 100 * Math.max(0, extent)
}

function safeText(value: string, maxLength: number): string {
  return Array.from(value
    .normalize('NFC')
    .replace(/[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/gu, ' ')
    .replace(/\s+/gu, ' ')
    .trim())
    .slice(0, maxLength)
    .join('')
}

function format(value: number): string {
  return String(Math.round(value * 10) / 10)
}

function abortError(): DOMException {
  return new DOMException('Resolved encounter playback aborted.', 'AbortError')
}

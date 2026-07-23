import type { GeneratedScene, SceneAction, SceneBeat } from '../ai/contracts.ts'
import { sanitizeColor, sanitizeCoordinate, sanitizeIdentifier, sanitizeText } from './design-sanitizer.ts'

export type SceneActorCollection =
  | ReadonlyMap<string, HTMLElement>
  | Readonly<Record<string, HTMLElement>>

export interface ScenePlayerOptions {
  readonly stage: HTMLElement
  readonly actors: SceneActorCollection
  readonly onStatus?: (message: string) => void
  readonly signal?: AbortSignal
  readonly reducedMotion?: boolean
}

interface ActorSnapshot {
  readonly animationPlayState: string
  readonly transform: string
  readonly transformOrigin: string
  readonly translate: string
  readonly rotate: string
  readonly scale: string
  readonly opacity: string
  readonly filter: string
  readonly zIndex: string
}

interface MotionState {
  x: number
  y: number
  rotate: number
  scale: number
  opacity: number
}

interface PropState extends MotionState {
  readonly element: HTMLDivElement
}

interface StagePoint {
  readonly x: number
  readonly y: number
}

interface PlaybackContext {
  readonly options: ScenePlayerOptions
  readonly stageRect: DOMRect
  readonly host: HTMLDivElement
  readonly actors: ReadonlyMap<string, HTMLElement>
  readonly actorOrigins: ReadonlyMap<HTMLElement, StagePoint>
  readonly actorStates: Map<HTMLElement, MotionState>
  readonly props: Map<string, PropState>
  readonly animations: Animation[]
  readonly temporaryNodes: Set<HTMLElement>
  readonly reducedMotion: boolean
  readonly signal?: AbortSignal
}

type AnimatableElement = HTMLElement | SVGElement

const MAX_PARTICIPANTS = 4
const MIN_PARTICIPANTS = 2
const MAX_BEATS = 18
const MAX_BEAT_MS = 5_000
const MAX_SCENE_MS = 15_000
const EFFECT_GLYPHS: Readonly<Record<Extract<SceneAction, { kind: 'effect' }>['effect'], string>> = {
  glow: '✧',
  sparkle: '✦',
  wind: '〰',
  ripple: '◌',
  music: '♪',
  heart: '♡',
  leaf: '❧',
  dust: '·',
  surprise: '!',
  rain: '⋰',
}

/**
 * Plays a generated scene against two to four explicitly supplied actor nodes.
 * Playback uses Web Animations and restores all actor styles and temporary props
 * after success, failure, disconnection, or AbortSignal cancellation.
 */
export async function playGeneratedScene(
  scene: GeneratedScene,
  options: ScenePlayerOptions,
): Promise<void> {
  const participantIds = uniqueIds(scene.participantIds)
  if (participantIds.length < MIN_PARTICIPANTS || participantIds.length > MAX_PARTICIPANTS) {
    throw new Error('Generated scenes require two to four unique participants.')
  }
  if (scene.beats.some((beat) => beat.startMs + beat.durationMs > MAX_SCENE_MS)) {
    throw new Error('Generated scene timeline exceeds the 15-second playback limit.')
  }

  const actors = resolveActors(participantIds, options.actors)
  if (new Set(actors.values()).size !== actors.size) {
    throw new Error('Each scene participant must resolve to a different actor element.')
  }

  const stageRect = options.stage.getBoundingClientRect()
  const host = createTemporaryHost(options.stage, stageRect)
  const actorOrigins = new Map<HTMLElement, StagePoint>()
  const snapshots = new Map<HTMLElement, ActorSnapshot>()
  const context: PlaybackContext = {
    options,
    stageRect,
    host,
    actors,
    actorOrigins,
    actorStates: new Map(),
    props: new Map(),
    animations: [],
    temporaryNodes: new Set([host]),
    reducedMotion: resolveReducedMotion(options.reducedMotion),
    signal: options.signal,
  }

  try {
    ensureActive(context)
    options.stage.ownerDocument.body.append(host)
    for (const actor of actors.values()) {
      snapshots.set(actor, snapshotActor(actor))
      actorOrigins.set(actor, relativeActorCenter(actor, stageRect))
      context.actorStates.set(actor, { x: 0, y: 0, rotate: 0, scale: 1, opacity: 1 })
      actor.style.animationPlayState = 'paused'
      actor.style.transformOrigin = '50% 100%'
      actor.style.zIndex = '31'
    }

    emitStatus(context, scene.title)
    const beats = [...scene.beats]
      .slice(0, MAX_BEATS)
      .sort((first, second) => first.startMs - second.startMs)
    await Promise.all(beats.map((beat) => playBeat(beat, context)))
    ensureActive(context)
    emitStatus(context, scene.summary)
  } finally {
    for (const animation of context.animations) animation.cancel()
    for (const node of context.temporaryNodes) node.remove()
    for (const [actor, snapshot] of snapshots) restoreActor(actor, snapshot)
  }
}

async function playBeat(beat: SceneBeat, context: PlaybackContext): Promise<void> {
  const boundedStart = Math.min(beat.startMs, MAX_SCENE_MS)
  const startDelay = context.reducedMotion ? Math.min(boundedStart * .035, 280) : boundedStart
  await abortableDelay(startDelay, context.signal)
  ensureActive(context)
  emitStatus(context, beat.statusText)
  await Promise.all(beat.actions.map((action) => playAction(action, beat.durationMs, context)))
}

async function playAction(action: SceneAction, durationMs: number, context: PlaybackContext): Promise<void> {
  ensureActive(context)
  if (action.kind === 'move') return playMove(action, durationMs, context)
  if (action.kind === 'look') return playLook(action, durationMs, context)
  if (action.kind === 'speak') return playSpeak(action, durationMs, context)
  if (action.kind === 'gesture') return playGesture(action, durationMs, context)
  if (action.kind === 'prop_create') return createProp(action, durationMs, context)
  if (action.kind === 'prop_move') return moveProp(action, durationMs, context)
  if (action.kind === 'prop_transform') return transformProp(action, durationMs, context)
  if (action.kind === 'prop_remove') return removeProp(action, durationMs, context)
  if (action.kind === 'effect') return playEffect(action, durationMs, context)
  await abortableDelay(scaledDuration(action.durationMs ?? durationMs, context), context.signal)
}

async function playMove(
  action: Extract<SceneAction, { kind: 'move' }>,
  durationMs: number,
  context: PlaybackContext,
): Promise<void> {
  const actor = actorFor(action.actorId, context)
  if (!actor) return
  const origin = context.actorOrigins.get(actor)
  if (!origin) return
  const state = stateFor(actor, context)
  const targetX = percentToPixels(action.to.x, context.stageRect.width)
  const targetY = percentToPixels(action.to.y, context.stageRect.height)
  const next = {
    ...state,
    x: sanitizeCoordinate(targetX - origin.x, { min: -context.stageRect.width, max: context.stageRect.width }),
    y: sanitizeCoordinate(targetY - origin.y, { min: -context.stageRect.height, max: context.stageRect.height }),
    rotate: action.rotate === null ? state.rotate : sanitizeCoordinate(action.rotate, { min: -180, max: 180 }),
    scale: action.scale === null ? state.scale : sanitizeCoordinate(action.scale, { min: .5, max: 1.8, fallback: 1 }),
  }
  const frames: Keyframe[] = context.reducedMotion
    ? [{ opacity: state.opacity }, { opacity: .78 }, { opacity: state.opacity }]
    : [motionFrame(state), motionFrame(next)]
  Object.assign(state, next)
  await animate(actor, frames, durationMs, context, 'cubic-bezier(.2,.8,.25,1)')
}

async function playLook(
  action: Extract<SceneAction, { kind: 'look' }>,
  durationMs: number,
  context: PlaybackContext,
): Promise<void> {
  const actor = actorFor(action.actorId, context)
  const target = actorFor(action.targetId, context)
  if (!actor || !target) return
  const state = stateFor(actor, context)
  const glance = { ...state, rotate: state.rotate + lookDirection(actor, target) * 4 }
  const frames: Keyframe[] = context.reducedMotion
    ? [{ opacity: state.opacity }, { opacity: .82 }, { opacity: state.opacity }]
    : [
        motionFrame(state),
        { ...motionFrame(glance), offset: .45 },
        motionFrame(state),
      ]
  await animate(actor, frames, durationMs, context, 'ease-in-out')
}

async function playSpeak(
  action: Extract<SceneAction, { kind: 'speak' }>,
  durationMs: number,
  context: PlaybackContext,
): Promise<void> {
  const actor = actorFor(action.actorId, context)
  const text = sanitizeText(action.text, 180)
  if (!actor || !text) return
  emitStatus(context, text)
  const bubble = context.host.ownerDocument.createElement('div')
  bubble.className = 'generated-scene-speech'
  bubble.dataset.sceneTemporary = 'speech'
  bubble.textContent = text
  Object.assign(bubble.style, temporaryBubbleStyles())
  placeNearActor(bubble, actor, context, -18)
  bubble.style.opacity = '0'
  context.host.append(bubble)
  context.temporaryNodes.add(bubble)
  await animate(bubble, [
    { opacity: 0, transform: 'translate(-50%, 8px) scale(.92)' },
    { opacity: 1, transform: 'translate(-50%, 0) scale(1)', offset: .2 },
    { opacity: 1, transform: 'translate(-50%, 0) scale(1)', offset: .8 },
    { opacity: 0, transform: 'translate(-50%, -7px) scale(.98)' },
  ], durationMs, context, 'ease-in-out')
  removeTemporary(bubble, context)
}

async function playGesture(
  action: Extract<SceneAction, { kind: 'gesture' }>,
  durationMs: number,
  context: PlaybackContext,
): Promise<void> {
  const actor = actorFor(action.actorId, context)
  if (!actor) return
  emitStatus(context, action.status)
  await animate(
    actor,
    gestureFrames(action.gesture, stateFor(actor, context), context.reducedMotion),
    durationMs,
    context,
    'cubic-bezier(.25,.9,.3,1.2)',
  )
}

async function createProp(
  action: Extract<SceneAction, { kind: 'prop_create' }>,
  durationMs: number,
  context: PlaybackContext,
): Promise<void> {
  const propId = sanitizeIdentifier(action.propId, `prop-${context.props.size + 1}`)
  if (context.props.has(propId)) return
  const prop = context.host.ownerDocument.createElement('div')
  prop.className = 'generated-scene-prop'
  prop.dataset.sceneTemporary = 'prop'
  prop.dataset.propId = propId
  prop.setAttribute('aria-hidden', 'true')

  const symbol = context.host.ownerDocument.createElement('span')
  symbol.className = 'generated-scene-prop__symbol'
  symbol.textContent = sanitizeText(action.symbol, 8, '✦')
  const label = context.host.ownerDocument.createElement('small')
  label.className = 'generated-scene-prop__label'
  label.textContent = sanitizeText(action.label, 120)
  prop.append(symbol, label)

  const x = percentToPixels(action.position.x, context.stageRect.width)
  const y = percentToPixels(action.position.y, context.stageRect.height)
  const state: PropState = { element: prop, x, y, rotate: 0, scale: 1, opacity: 1 }
  Object.assign(prop.style, temporaryPropStyles())
  prop.style.color = sanitizeColor(action.color, '#382f2a')
  prop.style.left = `${x}px`
  prop.style.top = `${y}px`
  context.host.append(prop)
  context.props.set(propId, state)
  context.temporaryNodes.add(prop)
  await animate(prop, [
    { opacity: 0, transform: 'translate(-50%, -50%) scale(.3) rotate(-10deg)' },
    { opacity: 1, transform: propTransform(state) },
  ], Math.min(durationMs, 700), context, 'cubic-bezier(.2,.9,.25,1.2)')
}

async function moveProp(
  action: Extract<SceneAction, { kind: 'prop_move' }>,
  durationMs: number,
  context: PlaybackContext,
): Promise<void> {
  const state = propFor(action.propId, context)
  if (!state) return
  const from = { ...state }
  state.x = percentToPixels(action.to.x, context.stageRect.width)
  state.y = percentToPixels(action.to.y, context.stageRect.height)
  await animate(state.element, [
    { left: `${from.x}px`, top: `${from.y}px`, transform: propTransform(from) },
    { left: `${state.x}px`, top: `${state.y}px`, transform: propTransform(state) },
  ], durationMs, context, 'ease-in-out')
  state.element.style.left = `${state.x}px`
  state.element.style.top = `${state.y}px`
}

async function transformProp(
  action: Extract<SceneAction, { kind: 'prop_transform' }>,
  durationMs: number,
  context: PlaybackContext,
): Promise<void> {
  const state = propFor(action.propId, context)
  if (!state) return
  const from = { ...state }
  if (action.rotate !== null) state.rotate = sanitizeCoordinate(action.rotate, { min: -360, max: 360 })
  if (action.scale !== null) state.scale = sanitizeCoordinate(action.scale, { min: 0, max: 3, fallback: 1 })
  if (action.opacity !== null) state.opacity = sanitizeCoordinate(action.opacity, { min: 0, max: 1, fallback: 1 })
  await animate(state.element, [
    { opacity: from.opacity, transform: propTransform(from) },
    { opacity: state.opacity, transform: propTransform(state) },
  ], durationMs, context, 'ease-in-out')
}

async function removeProp(
  action: Extract<SceneAction, { kind: 'prop_remove' }>,
  durationMs: number,
  context: PlaybackContext,
): Promise<void> {
  const propId = sanitizeIdentifier(action.propId)
  const state = context.props.get(propId)
  if (!state) return
  await animate(state.element, [
    { opacity: state.opacity, transform: propTransform(state) },
    { opacity: 0, transform: `${propTransform(state)} translateY(-12px) scale(.72)` },
  ], Math.min(durationMs, 600), context, 'ease-in')
  removeTemporary(state.element, context)
  context.props.delete(propId)
}

async function playEffect(
  action: Extract<SceneAction, { kind: 'effect' }>,
  durationMs: number,
  context: PlaybackContext,
): Promise<void> {
  const target = action.targetId ? actorFor(action.targetId, context) : null
  const effect = context.host.ownerDocument.createElement('span')
  effect.className = 'generated-scene-effect'
  effect.dataset.sceneTemporary = 'effect'
  effect.dataset.effect = action.effect
  effect.textContent = EFFECT_GLYPHS[action.effect]
  effect.setAttribute('aria-hidden', 'true')
  Object.assign(effect.style, temporaryEffectStyles())
  effect.style.color = sanitizeColor(action.color, '#eaa946')
  effect.style.fontSize = `${Math.round(24 + sanitizeUnit(action.intensity) * 24)}px`
  if (target) placeNearActor(effect, target, context, 28)
  else {
    effect.style.left = `${context.stageRect.width / 2}px`
    effect.style.top = `${context.stageRect.height / 2}px`
  }
  context.host.append(effect)
  context.temporaryNodes.add(effect)
  await animate(effect, effectFrames(action.effect, action.intensity, context.reducedMotion), durationMs, context, 'ease-out')
  removeTemporary(effect, context)
}

function gestureFrames(
  gesture: Extract<SceneAction, { kind: 'gesture' }>['gesture'],
  state: MotionState,
  reducedMotion: boolean,
): Keyframe[] {
  if (reducedMotion) return [{ opacity: state.opacity }, { opacity: .78 }, { opacity: state.opacity }]
  const base = motionFrame(state)
  if (gesture === 'wave') return [base, withMotion(state, 0, -3, -8, 1.04), withMotion(state, 0, 0, 7, 1), base]
  if (gesture === 'nod') return [base, withMotion(state, 0, 5, 2, .97), base]
  if (gesture === 'spin') return [base, withMotion(state, 0, -8, 180, 1.04), withMotion(state, 0, 0, 360, 1)]
  if (gesture === 'stretch') return [base, withMotion(state, 0, -7, 0, 1.13), base]
  if (gesture === 'shiver') return [base, withMotion(state, -5, 0, -3, 1), withMotion(state, 5, 0, 3, 1), base]
  return [base, withMotion(state, 0, -18, -5, 1.05), withMotion(state, 0, 1, 4, .97), base]
}

function effectFrames(
  effect: Extract<SceneAction, { kind: 'effect' }>['effect'],
  intensity: number,
  reducedMotion: boolean,
): Keyframe[] {
  if (reducedMotion) return [{ opacity: 0 }, { opacity: 1 }, { opacity: 0 }]
  const strength = .7 + sanitizeUnit(intensity) * .7
  const rotation = effect === 'wind' || effect === 'leaf' || effect === 'music' ? 24 : 90
  return [
    { opacity: 0, transform: 'translate(-50%, -50%) scale(.25) rotate(0deg)' },
    { opacity: 1, transform: `translate(-50%, -65%) scale(${format(strength)}) rotate(${rotation}deg)`, offset: .45 },
    { opacity: 0, transform: `translate(-50%, -110%) scale(.72) rotate(${rotation * 2}deg)` },
  ]
}

async function animate(
  element: AnimatableElement,
  frames: Keyframe[],
  requestedDuration: number,
  context: PlaybackContext,
  easing: string,
): Promise<void> {
  ensureActive(context)
  const duration = scaledDuration(requestedDuration, context)
  if (typeof element.animate !== 'function') {
    await abortableDelay(duration, context.signal)
    applyLastFrame(element, frames.at(-1))
    return
  }
  const animation = element.animate(frames, { duration, easing, fill: 'forwards' })
  context.animations.push(animation)
  await animationFinished(animation, context.signal)
}

function animationFinished(animation: Animation, signal?: AbortSignal): Promise<void> {
  if (!signal) return animation.finished.then(() => undefined)
  if (signal.aborted) {
    animation.cancel()
    return Promise.reject(abortError())
  }
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

function applyLastFrame(element: AnimatableElement, frame?: Keyframe): void {
  if (!frame) return
  if (typeof frame.transform === 'string') element.style.transform = frame.transform
  if (typeof frame.translate === 'string') element.style.translate = frame.translate
  if (typeof frame.rotate === 'string') element.style.rotate = frame.rotate
  if (typeof frame.scale === 'string') element.style.scale = frame.scale
  if (typeof frame.opacity === 'number' || typeof frame.opacity === 'string') element.style.opacity = String(frame.opacity)
  if (typeof frame.filter === 'string') element.style.filter = frame.filter
  if (typeof frame.left === 'string') element.style.left = frame.left
  if (typeof frame.top === 'string') element.style.top = frame.top
}

function resolveActors(ids: readonly string[], collection: SceneActorCollection): ReadonlyMap<string, HTMLElement> {
  const resolved = new Map<string, HTMLElement>()
  for (const id of ids) {
    const element = isActorMap(collection) ? collection.get(id) : collection[id]
    if (!(element instanceof HTMLElement) || !element.isConnected) {
      throw new Error(`Scene participant is unavailable: ${id}`)
    }
    resolved.set(id, element)
  }
  return resolved
}

function isActorMap(collection: SceneActorCollection): collection is ReadonlyMap<string, HTMLElement> {
  return typeof (collection as ReadonlyMap<string, HTMLElement>).get === 'function'
}

function actorFor(id: string, context: PlaybackContext): HTMLElement | null {
  return context.actors.get(sanitizeIdentifier(id)) ?? null
}

function propFor(id: string, context: PlaybackContext): PropState | null {
  return context.props.get(sanitizeIdentifier(id)) ?? null
}

function stateFor(actor: HTMLElement, context: PlaybackContext): MotionState {
  const existing = context.actorStates.get(actor)
  if (existing) return existing
  const state = { x: 0, y: 0, rotate: 0, scale: 1, opacity: 1 }
  context.actorStates.set(actor, state)
  return state
}

function motionFrame(state: MotionState): Keyframe {
  return {
    translate: `${format(state.x)}px ${format(state.y)}px`,
    rotate: `${format(state.rotate)}deg`,
    scale: format(state.scale),
  }
}

function propTransform(state: MotionState): string {
  return `translate(-50%, -50%) rotate(${format(state.rotate)}deg) scale(${format(state.scale)})`
}

function withMotion(state: MotionState, x: number, y: number, rotate: number, scale: number): Keyframe {
  return motionFrame({
    ...state,
    x: state.x + x,
    y: state.y + y,
    rotate: state.rotate + rotate,
    scale: state.scale * scale,
  })
}

function createTemporaryHost(stage: HTMLElement, rect: DOMRect): HTMLDivElement {
  const host = stage.ownerDocument.createElement('div')
  host.className = 'generated-scene-layer'
  host.dataset.sceneTemporary = 'host'
  host.setAttribute('aria-hidden', 'true')
  Object.assign(host.style, {
    position: 'fixed', left: `${rect.left}px`, top: `${rect.top}px`,
    width: `${rect.width}px`, height: `${rect.height}px`, overflow: 'visible',
    pointerEvents: 'none', zIndex: '40',
  })
  return host
}

function relativeActorCenter(actor: HTMLElement, stageRect: DOMRect): StagePoint {
  const rect = actor.getBoundingClientRect()
  return {
    x: rect.left - stageRect.left + rect.width / 2,
    y: rect.top - stageRect.top + rect.height / 2,
  }
}

function placeNearActor(element: HTMLElement, actor: HTMLElement, context: PlaybackContext, offsetY: number): void {
  const actorRect = actor.getBoundingClientRect()
  element.style.left = `${actorRect.left - context.stageRect.left + actorRect.width / 2}px`
  element.style.top = `${actorRect.top - context.stageRect.top + offsetY}px`
}

function lookDirection(actor: HTMLElement, target: HTMLElement): number {
  const actorRect = actor.getBoundingClientRect()
  const targetRect = target.getBoundingClientRect()
  return targetRect.left + targetRect.width / 2 < actorRect.left + actorRect.width / 2 ? -1 : 1
}

function temporaryBubbleStyles(): Partial<CSSStyleDeclaration> {
  return {
    position: 'absolute', maxWidth: 'min(260px, 72vw)', color: '#382f2a',
    background: '#fffaf0f2', border: '2px solid #5a4b42', borderRadius: '16px 19px 14px 20px',
    padding: '8px 12px', fontSize: '13px', fontWeight: '750', lineHeight: '1.45',
    textAlign: 'center', overflowWrap: 'anywhere', boxShadow: '3px 4px 0 #47352a29',
    transform: 'translateX(-50%)',
  }
}

function temporaryPropStyles(): Partial<CSSStyleDeclaration> {
  return {
    position: 'absolute', display: 'grid', placeItems: 'center', gap: '2px',
    minWidth: '44px', minHeight: '44px', background: '#fff2c7eb', border: '2px solid #5a4b42',
    borderRadius: '51% 49% 44% 56% / 57% 43% 57% 43%', padding: '7px',
    fontSize: '20px', fontWeight: '800', boxShadow: '3px 5px 0 #47352a29',
    transform: 'translate(-50%, -50%)', textAlign: 'center',
  }
}

function temporaryEffectStyles(): Partial<CSSStyleDeclaration> {
  return {
    position: 'absolute', fontWeight: '900', textShadow: '0 2px 0 #5a4b42',
    transform: 'translate(-50%, -50%)',
  }
}

function snapshotActor(actor: HTMLElement): ActorSnapshot {
  return {
    animationPlayState: actor.style.animationPlayState,
    transform: actor.style.transform,
    transformOrigin: actor.style.transformOrigin,
    translate: actor.style.translate,
    rotate: actor.style.rotate,
    scale: actor.style.scale,
    opacity: actor.style.opacity,
    filter: actor.style.filter,
    zIndex: actor.style.zIndex,
  }
}

function restoreActor(actor: HTMLElement, snapshot: ActorSnapshot): void {
  actor.style.animationPlayState = snapshot.animationPlayState
  actor.style.transform = snapshot.transform
  actor.style.transformOrigin = snapshot.transformOrigin
  actor.style.translate = snapshot.translate
  actor.style.rotate = snapshot.rotate
  actor.style.scale = snapshot.scale
  actor.style.opacity = snapshot.opacity
  actor.style.filter = snapshot.filter
  actor.style.zIndex = snapshot.zIndex
}

function ensureActive(context: PlaybackContext): void {
  if (context.signal?.aborted) throw abortError()
  for (const actor of context.actors.values()) {
    if (!actor.isConnected) throw abortError('A scene actor was removed.')
  }
}

function abortableDelay(durationMs: number, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) return Promise.reject(abortError())
  if (durationMs <= 0) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const abort = (): void => {
      window.clearTimeout(timeout)
      reject(abortError())
    }
    const timeout = window.setTimeout(() => {
      signal?.removeEventListener('abort', abort)
      resolve()
    }, durationMs)
    signal?.addEventListener('abort', abort, { once: true })
  })
}

function removeTemporary(node: HTMLElement, context: PlaybackContext): void {
  node.remove()
  context.temporaryNodes.delete(node)
}

function emitStatus(context: PlaybackContext, value: string): void {
  const status = sanitizeText(value, 180)
  if (status) context.options.onStatus?.(status)
}

function scaledDuration(durationMs: number, context: PlaybackContext): number {
  const bounded = sanitizeCoordinate(durationMs, { min: 1, max: MAX_BEAT_MS, fallback: 400 })
  return context.reducedMotion ? Math.min(90, bounded) : bounded
}

function resolveReducedMotion(explicit?: boolean): boolean {
  if (typeof explicit === 'boolean') return explicit
  return globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}

function uniqueIds(value: readonly string[]): readonly string[] {
  return value
    .map((candidate) => sanitizeIdentifier(candidate))
    .filter((candidate, index, values) => candidate.length > 0 && values.indexOf(candidate) === index)
}

function percentToPixels(value: number, extent: number): number {
  const percent = sanitizeCoordinate(value, { min: 0, max: 100, fallback: 50 })
  return percent / 100 * Math.max(0, extent)
}

function sanitizeUnit(value: number): number {
  return sanitizeCoordinate(value, { min: 0, max: 1, fallback: .5 })
}

function format(value: number): string {
  return String(Math.round(value * 10) / 10)
}

function abortError(message = 'Generated scene playback aborted.'): DOMException {
  return new DOMException(message, 'AbortError')
}

export type GardenInteractionKind =
  | 'glow-song'
  | 'ripple-bounce'
  | 'repair-curiosity'
  | 'glide-together'
  | 'comfort'
  | 'listen'
  | 'play'
  | 'help'
  | 'greet'

export interface ResidentLike {
  readonly id?: string
  readonly name?: string
  readonly traits: Readonly<Partial<{
    movement: string
    skill: string
    temperament: string
    place: string
    habit: string
  }>>
}

export interface DirectInteractionPlan {
  readonly kind: GardenInteractionKind
  readonly prop: string
  readonly copy: string
}

export interface GardenInteractionOptions {
  readonly actorAElement: HTMLElement
  readonly actorBElement: HTMLElement
  /** Event id (for example `first-night-song`) or a direct interaction kind. */
  readonly kind: GardenInteractionKind | string
  readonly prop: string
  readonly actorAName: string
  readonly actorBName: string
  readonly onStatus?: (message: string) => void
  readonly signal?: AbortSignal
}

interface MotionSnapshot {
  readonly animationPlayState: string
  readonly transform: string
  readonly filter: string
  readonly opacity: string
  readonly zIndex: string
}

interface InteractionProfile {
  readonly kind: GardenInteractionKind
  readonly icon: string
  readonly actionCopy: (actorA: string, actorB: string, prop: string) => string
}

const EVENT_KIND_ALIASES: Readonly<Record<string, GardenInteractionKind>> = {
  'first-night-song': 'glow-song',
  'wind-listening-duet': 'listen',
  'pond-bounce-parade': 'ripple-bounce',
  'workshop-question': 'repair-curiosity',
  'kite-tail-friend': 'glide-together',
}

const PROFILES: Readonly<Record<GardenInteractionKind, InteractionProfile>> = {
  'glow-song': {
    kind: 'glow-song',
    icon: '✦',
    actionCopy: (actorA, actorB, prop) => `${withSubject(actorA)} ${prop}에 빛을 건네자 ${withSubject(actorB)} 짧은 노래로 대답해요.`,
  },
  'ripple-bounce': {
    kind: 'ripple-bounce',
    icon: '◌',
    actionCopy: (actorA, actorB, prop) => `${withSubject(actorA)} ${prop}에 잔물결을 만들고 ${withSubject(actorB)} 그 박자에 맞춰 통통 뛰어요.`,
  },
  'repair-curiosity': {
    kind: 'repair-curiosity',
    icon: '⌁',
    actionCopy: (actorA, actorB, prop) => `${withSubject(actorA)} ${prop}을 손보는 동안 ${withSubject(actorB)} 곁에서 궁금한 듯 들여다봐요.`,
  },
  'glide-together': {
    kind: 'glide-together',
    icon: '〰',
    actionCopy: (actorA, actorB, prop) => `${withSubject(actorA)} ${prop}을 타고 떠오르자 ${withSubject(actorB)} 살며시 따라붙어요.`,
  },
  comfort: {
    kind: 'comfort',
    icon: '♡',
    actionCopy: (actorA, actorB) => `${withSubject(actorA)} ${actorB}의 곁에 오래 머물자 굳어 있던 몸이 천천히 풀려요.`,
  },
  listen: {
    kind: 'listen',
    icon: '♪',
    actionCopy: (actorA, actorB, prop) => `${actorA}와 ${actorB}가 ${prop} 곁에서 같은 소리에 귀를 기울여요.`,
  },
  play: {
    kind: 'play',
    icon: '●',
    actionCopy: (actorA, actorB, prop) => `${actorA}와 ${actorB}가 ${prop}을 사이에 두고 서로의 움직임을 따라 해요.`,
  },
  help: {
    kind: 'help',
    icon: '✚',
    actionCopy: (actorA, actorB, prop) => `${withSubject(actorA)} ${prop}을 옮기자 ${withSubject(actorB)} 반대편을 받쳐 들어요.`,
  },
  greet: {
    kind: 'greet',
    icon: '·',
    actionCopy: (actorA, actorB) => `${actorA}와 ${actorB}가 가까이 다가가 서로의 몸짓으로 인사해요.`,
  },
}

/**
 * Stages one complete garden scene: approach, shared action, reaction, and return.
 * The function owns all temporary styles, classes, animations, and prop markup.
 */
export async function stageGardenInteraction(options: GardenInteractionOptions): Promise<void> {
  const {
    actorAElement,
    actorBElement,
    actorAName,
    actorBName,
    prop,
    onStatus,
    signal,
  } = options

  if (actorAElement === actorBElement) throw new Error('Garden interaction requires two different resident elements.')
  if (!actorAElement.isConnected || !actorBElement.isConnected) return

  const profile = resolveProfile(options.kind)
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
  const actorASnapshot = snapshotMotion(actorAElement)
  const actorBSnapshot = snapshotMotion(actorBElement)
  const animations: Animation[] = []
  let propElement: HTMLDivElement | null = null

  const abort = (): never => {
    throw new DOMException('Garden interaction aborted.', 'AbortError')
  }
  const ensureActive = (): void => {
    if (signal?.aborted || !actorAElement.isConnected || !actorBElement.isConnected) abort()
  }
  const duration = (normal: number, reduced = 80): number => reducedMotion ? reduced : normal

  try {
    ensureActive()
    actorAElement.classList.add('is-interacting')
    actorBElement.classList.add('is-watching')
    actorAElement.dataset.interactionRole = 'actor'
    actorBElement.dataset.interactionRole = 'responder'
    actorAElement.style.animationPlayState = 'paused'
    actorBElement.style.animationPlayState = 'paused'
    actorAElement.style.zIndex = '26'
    actorBElement.style.zIndex = '25'

    const approach = calculateApproach(actorAElement, actorBElement)
    onStatus?.(`${actorAName}와 ${actorBName}가 서로를 발견했어요.`)

    await playTogether([
      play(actorAElement, [
        { transform: 'translate(0, 0) scale(1)' },
        { transform: reducedMotion ? 'translate(0, 0) scale(1)' : transformAt(approach.aX, approach.aY, 1.03) },
      ], { duration: duration(640), easing: 'cubic-bezier(.2,.8,.25,1)', fill: 'forwards' }, animations),
      play(actorBElement, [
        { transform: 'translate(0, 0) scale(1)' },
        { transform: reducedMotion ? 'translate(0, 0) scale(1)' : transformAt(approach.bX, approach.bY, 1) },
      ], { duration: duration(700), easing: 'cubic-bezier(.2,.8,.25,1)', fill: 'forwards' }, animations),
    ])

    ensureActive()
    propElement = createTemporaryProp(profile, prop, approach.propX, approach.propY)
    document.body.append(propElement)
    onStatus?.(profile.actionCopy(actorAName, actorBName, prop))

    const actionAnimations = reducedMotion ? reducedActionFrames() : actionFrames(profile.kind, approach)
    await playTogether([
      play(propElement, actionAnimations.prop, { duration: duration(900, 120), easing: 'ease-in-out', fill: 'forwards' }, animations),
      play(actorAElement, actionAnimations.actorA, { duration: duration(900, 120), easing: 'ease-in-out', fill: 'forwards' }, animations),
      play(actorBElement, actionAnimations.actorB, { duration: duration(900, 120), easing: 'ease-in-out', fill: 'forwards' }, animations),
    ])

    ensureActive()
    actorBElement.classList.remove('is-watching')
    actorBElement.classList.add('is-celebrating')
    onStatus?.(`${withSubject(actorBName)} 반가운 몸짓으로 대답했어요.`)
    await playTogether([
      play(actorBElement, reactionFrames(approach.bX, approach.bY, reducedMotion), {
        duration: duration(560, 100),
        easing: 'cubic-bezier(.25,.9,.3,1.35)',
        fill: 'forwards',
      }, animations),
      play(propElement, [
        { opacity: 1, transform: 'translate(-50%, -50%) scale(1)' },
        reducedMotion
          ? { opacity: 0.75, transform: 'translate(-50%, -50%) scale(1)' }
          : { opacity: 0.75, transform: 'translate(-50%, -58%) scale(1.08)' },
      ], { duration: duration(560, 100), easing: 'ease-out', fill: 'forwards' }, animations),
    ])

    ensureActive()
    onStatus?.('작은 상호작용이 정원의 기억으로 남았어요.')
    await playTogether([
      play(actorAElement, [
        { transform: reducedMotion ? 'translate(0, 0)' : transformAt(approach.aX, approach.aY) },
        { transform: 'translate(0, 0)' },
      ], { duration: duration(560), easing: 'cubic-bezier(.5,0,.3,1)', fill: 'forwards' }, animations),
      play(actorBElement, [
        { transform: reducedMotion ? 'translate(0, 0)' : transformAt(approach.bX, approach.bY) },
        { transform: 'translate(0, 0)' },
      ], { duration: duration(600), easing: 'cubic-bezier(.5,0,.3,1)', fill: 'forwards' }, animations),
      play(propElement, [
        reducedMotion
          ? { opacity: 0.75, transform: 'translate(-50%, -50%) scale(1)' }
          : { opacity: 0.75, transform: 'translate(-50%, -58%) scale(1.08)' },
        reducedMotion
          ? { opacity: 0, transform: 'translate(-50%, -50%) scale(1)' }
          : { opacity: 0, transform: 'translate(-50%, -72%) scale(.72)' },
      ], { duration: duration(420, 80), easing: 'ease-in', fill: 'forwards' }, animations),
    ])
  } finally {
    for (const animation of animations) animation.cancel()
    propElement?.remove()
    restoreMotion(actorAElement, actorASnapshot)
    restoreMotion(actorBElement, actorBSnapshot)
    actorAElement.classList.remove('is-interacting', 'is-celebrating', 'is-watching')
    actorBElement.classList.remove('is-interacting', 'is-celebrating', 'is-watching')
    delete actorAElement.dataset.interactionRole
    delete actorBElement.dataset.interactionRole
  }
}

/** Selects a short, trait-driven interaction for clicking one resident with another in the garden. */
export function planDirectInteraction(actorA: ResidentLike, actorB: ResidentLike): DirectInteractionPlan {
  const a = actorA.traits
  const b = actorB.traits
  const actorAName = actorA.name ?? '새 친구'
  const actorBName = actorB.name ?? '정원 친구'

  if (hasCrossPair(a, b, 'habit', '발광', 'habit', '노래')) {
    return makePlan('glow-song', actorAName, actorBName, '작은 랜턴')
  }
  if (hasCrossPair(a, b, 'movement', '헤엄치기', 'habit', '통통 튀기')) {
    return makePlan('ripple-bounce', actorAName, actorBName, '연잎')
  }
  if (hasCrossPair(a, b, 'skill', '수리', 'temperament', '호기심')) {
    return makePlan('repair-curiosity', actorAName, actorBName, '바람 풍경')
  }
  if (hasCrossPair(a, b, 'movement', '활공', 'habit', '달라붙기')) {
    return makePlan('glide-together', actorAName, actorBName, '풍향 리본')
  }
  if (a.temperament === '다정함' || b.temperament === '다정함') {
    return makePlan('comfort', actorAName, actorBName, '포근한 잎방석')
  }
  if (a.skill === '교감' || b.skill === '교감') {
    return makePlan('listen', actorAName, actorBName, '바람 종')
  }
  if (a.skill === '운반' || b.skill === '운반' || a.skill === '수리' || b.skill === '수리') {
    return makePlan('help', actorAName, actorBName, '작은 나뭇가지')
  }
  if (a.habit === '통통 튀기' || b.habit === '통통 튀기' || a.habit === '노래' || b.habit === '노래') {
    return makePlan('play', actorAName, actorBName, '도토리 공')
  }
  return makePlan('greet', actorAName, actorBName, '민들레 씨앗')
}

function resolveProfile(kind: string): InteractionProfile {
  const normalized = EVENT_KIND_ALIASES[kind] ?? kind
  return PROFILES[normalized as GardenInteractionKind] ?? PROFILES.greet
}

function makePlan(kind: GardenInteractionKind, actorAName: string, actorBName: string, prop: string): DirectInteractionPlan {
  return { kind, prop, copy: PROFILES[kind].actionCopy(actorAName, actorBName, prop) }
}

function hasCrossPair(
  first: ResidentLike['traits'],
  second: ResidentLike['traits'],
  firstAxis: keyof ResidentLike['traits'],
  firstValue: string,
  secondAxis: keyof ResidentLike['traits'],
  secondValue: string,
): boolean {
  return (first[firstAxis] === firstValue && second[secondAxis] === secondValue)
    || (second[firstAxis] === firstValue && first[secondAxis] === secondValue)
}

function withSubject(name: string): string {
  const last = name.at(-1) ?? ''
  if (!/[가-힣]/u.test(last)) return `${name}가`
  const code = last.charCodeAt(0) - 0xac00
  return `${name}${code % 28 === 0 ? '가' : '이'}`
}

function snapshotMotion(element: HTMLElement): MotionSnapshot {
  return {
    animationPlayState: element.style.animationPlayState,
    transform: element.style.transform,
    filter: element.style.filter,
    opacity: element.style.opacity,
    zIndex: element.style.zIndex,
  }
}

function restoreMotion(element: HTMLElement, snapshot: MotionSnapshot): void {
  element.style.animationPlayState = snapshot.animationPlayState
  element.style.transform = snapshot.transform
  element.style.filter = snapshot.filter
  element.style.opacity = snapshot.opacity
  element.style.zIndex = snapshot.zIndex
}

function calculateApproach(actorA: HTMLElement, actorB: HTMLElement): {
  readonly aX: number
  readonly aY: number
  readonly bX: number
  readonly bY: number
  readonly propX: number
  readonly propY: number
} {
  const a = actorA.getBoundingClientRect()
  const b = actorB.getBoundingClientRect()
  const aCenter = { x: a.left + a.width / 2, y: a.top + a.height / 2 }
  const bCenter = { x: b.left + b.width / 2, y: b.top + b.height / 2 }
  const deltaX = bCenter.x - aCenter.x
  const deltaY = bCenter.y - aCenter.y
  const distance = Math.max(1, Math.hypot(deltaX, deltaY))
  const availableTravel = Math.max(0, distance - Math.max(92, (a.width + b.width) * 0.48))
  const travel = Math.min(220, availableTravel * 0.5)
  const aX = (deltaX / distance) * travel
  const aY = (deltaY / distance) * travel
  const bX = -(deltaX / distance) * travel
  const bY = -(deltaY / distance) * travel

  return {
    aX,
    aY,
    bX,
    bY,
    propX: (aCenter.x + aX + bCenter.x + bX) / 2,
    propY: (aCenter.y + aY + bCenter.y + bY) / 2 + Math.min(a.height, b.height) * 0.28,
  }
}

function transformAt(x: number, y: number, scale = 1): string {
  return `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${scale})`
}

function createTemporaryProp(
  profile: InteractionProfile,
  label: string,
  x: number,
  y: number,
): HTMLDivElement {
  const element = document.createElement('div')
  element.className = `live-event-prop live-event-prop--${profile.kind}`
  element.setAttribute('aria-hidden', 'true')
  element.textContent = `${profile.icon} ${label}`
  Object.assign(element.style, {
    position: 'fixed',
    left: `${x}px`,
    top: `${y}px`,
    zIndex: '24',
    pointerEvents: 'none',
    transform: 'translate(-50%, -50%) scale(.6)',
    opacity: '0',
  })
  return element
}

function actionFrames(kind: GardenInteractionKind, approach: ReturnType<typeof calculateApproach>): {
  readonly actorA: Keyframe[]
  readonly actorB: Keyframe[]
  readonly prop: Keyframe[]
} {
  const a = (scale = 1, x = 0, y = 0, rotate = 0): string =>
    `translate(${(approach.aX + x).toFixed(1)}px, ${(approach.aY + y).toFixed(1)}px) rotate(${rotate}deg) scale(${scale})`
  const b = (scale = 1, x = 0, y = 0, rotate = 0): string =>
    `translate(${(approach.bX + x).toFixed(1)}px, ${(approach.bY + y).toFixed(1)}px) rotate(${rotate}deg) scale(${scale})`
  const propBase: Keyframe[] = [
    { opacity: 0, transform: 'translate(-50%, -42%) scale(.6) rotate(-5deg)' },
    { opacity: 1, transform: 'translate(-50%, -56%) scale(1.12) rotate(3deg)', offset: 0.48 },
    { opacity: 1, transform: 'translate(-50%, -50%) scale(1) rotate(0)' },
  ]

  switch (kind) {
    case 'glow-song':
      return {
        actorA: [{ transform: a(1) }, { transform: a(1.08, 0, -7), filter: 'brightness(1.25) drop-shadow(0 0 14px #ffe27c)', offset: 0.5 }, { transform: a(1.02), filter: 'brightness(1.08)' }],
        actorB: [{ transform: b(1) }, { transform: b(1.04, 0, -9, -3), offset: 0.45 }, { transform: b(1.03, 0, -3, 3), offset: 0.72 }, { transform: b(1) }],
        prop: propBase,
      }
    case 'ripple-bounce':
      return {
        actorA: [{ transform: a(1) }, { transform: a(.96, 0, 8), offset: 0.45 }, { transform: a(1.03, 0, -3) }],
        actorB: [{ transform: b(1) }, { transform: b(1.05, -5, -22, -5), offset: 0.35 }, { transform: b(.98, 4, 2, 4), offset: 0.68 }, { transform: b(1) }],
        prop: propBase,
      }
    case 'repair-curiosity':
      return {
        actorA: [{ transform: a(1, 0, 0, -2) }, { transform: a(1.02, 5, 4, 4), offset: 0.4 }, { transform: a(1, -3, 1, -3), offset: 0.7 }, { transform: a(1) }],
        actorB: [{ transform: b(1) }, { transform: b(1.04, -8, 2, -7), offset: 0.5 }, { transform: b(1.02, -3, 0, 3) }],
        prop: propBase,
      }
    case 'glide-together':
      return {
        actorA: [{ transform: a(1) }, { transform: a(1.03, 12, -20, 5), offset: 0.42 }, { transform: a(1.02, -8, -13, -4), offset: 0.72 }, { transform: a(1) }],
        actorB: [{ transform: b(1) }, { transform: b(1.02, 4, -16, 7), offset: 0.5 }, { transform: b(1.02, -10, -10, -3), offset: 0.76 }, { transform: b(1) }],
        prop: propBase,
      }
    case 'comfort':
      return {
        actorA: [{ transform: a(1) }, { transform: a(1.04, 7, 0, 3), filter: 'drop-shadow(0 0 11px #ffd98a)', offset: 0.55 }, { transform: a(1.02, 4) }],
        actorB: [{ transform: b(.96, 0, 4) }, { transform: b(1.04, -5, -2), offset: 0.6 }, { transform: b(1.02, -3) }],
        prop: propBase,
      }
    case 'listen':
      return {
        actorA: [{ transform: a(1, 0, 0, -2) }, { transform: a(1.02, 0, -4, 3), offset: 0.5 }, { transform: a(1) }],
        actorB: [{ transform: b(1, 0, 0, 2) }, { transform: b(1.02, 0, -4, -3), offset: 0.5 }, { transform: b(1) }],
        prop: propBase,
      }
    case 'play':
      return {
        actorA: [{ transform: a(1) }, { transform: a(1.05, 7, -14, 5), offset: 0.45 }, { transform: a(1, -2, 0, -2) }],
        actorB: [{ transform: b(1) }, { transform: b(1.05, -7, -14, -5), offset: 0.62 }, { transform: b(1) }],
        prop: propBase,
      }
    case 'help':
      return {
        actorA: [{ transform: a(1, 0, 0, -3) }, { transform: a(.98, 5, 5, 2), offset: 0.5 }, { transform: a(1) }],
        actorB: [{ transform: b(1, 0, 0, 3) }, { transform: b(.98, -5, 5, -2), offset: 0.5 }, { transform: b(1) }],
        prop: propBase,
      }
    case 'greet':
      return {
        actorA: [{ transform: a(1) }, { transform: a(1.03, 6, -5, 5), offset: 0.48 }, { transform: a(1) }],
        actorB: [{ transform: b(1) }, { transform: b(1.03, -6, -5, -5), offset: 0.62 }, { transform: b(1) }],
        prop: propBase,
      }
  }
}

function reducedActionFrames(): {
  readonly actorA: Keyframe[]
  readonly actorB: Keyframe[]
  readonly prop: Keyframe[]
} {
  return {
    actorA: [
      { opacity: 0.78, transform: 'translate(0, 0) scale(1)' },
      { opacity: 1, transform: 'translate(0, 0) scale(1)' },
    ],
    actorB: [
      { opacity: 0.78, transform: 'translate(0, 0) scale(1)' },
      { opacity: 1, transform: 'translate(0, 0) scale(1)' },
    ],
    prop: [
      { opacity: 0, transform: 'translate(-50%, -50%) scale(1)' },
      { opacity: 1, transform: 'translate(-50%, -50%) scale(1)' },
    ],
  }
}

function reactionFrames(x: number, y: number, reducedMotion: boolean): Keyframe[] {
  if (reducedMotion) {
    return [{ opacity: 0.8, transform: transformAt(0, 0, .98) }, { opacity: 1, transform: transformAt(0, 0, 1) }]
  }
  return [
    { transform: transformAt(x, y, 1) },
    { transform: `translate(${x.toFixed(1)}px, ${(y - 16).toFixed(1)}px) rotate(-5deg) scale(1.08)`, offset: 0.42 },
    { transform: `translate(${x.toFixed(1)}px, ${(y - 5).toFixed(1)}px) rotate(4deg) scale(1.03)`, offset: 0.72 },
    { transform: transformAt(x, y, 1) },
  ]
}

function play(
  element: HTMLElement,
  keyframes: Keyframe[],
  options: KeyframeAnimationOptions,
  registry: Animation[],
): Animation | null {
  if (typeof element.animate !== 'function') {
    const finalFrame = keyframes.at(-1)
    if (finalFrame) applyFrame(element, finalFrame)
    return null
  }
  const animation = element.animate(keyframes, options)
  registry.push(animation)
  return animation
}

async function playTogether(animations: readonly (Animation | null)[]): Promise<void> {
  const active = animations.filter((animation): animation is Animation => animation !== null)
  if (active.length === 0) return
  await Promise.all(active.map(async (animation) => {
    try {
      await animation.finished
    } catch {
      // Cancellation is expected during aborts, navigation, and cleanup.
    }
  }))
}

function applyFrame(element: HTMLElement, frame: Keyframe): void {
  if (typeof frame.opacity === 'number') element.style.opacity = String(frame.opacity)
  else if (typeof frame.opacity === 'string') element.style.opacity = frame.opacity
  if (typeof frame.transform === 'string') element.style.transform = frame.transform
  if (typeof frame.filter === 'string') element.style.filter = frame.filter
}

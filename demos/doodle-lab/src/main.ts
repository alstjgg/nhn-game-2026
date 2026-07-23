import './style.css'

import { GardenAudio } from './audio.ts'
import {
  EMERGENT_EVENTS,
  SHOWCASE_CONFIG,
  STARTER_RESIDENTS,
  createResidentName,
  evaluateMatch,
  findEmergentEvents,
  getRequestByIndex,
  type EmergentEventMatch,
  type HiddenRequestDefinition,
  type MatchResult,
  type ResidentLike,
} from './data.ts'
import {
  analyzeDrawing,
  type InterpretationCards,
  type InterpretationCard,
  type StrokePoint,
} from './analyzer.ts'
import { planDirectInteraction, stageGardenInteraction } from './interactions.ts'
import { extractDoodleSprite } from './sprite.ts'

type AppPhase = 'garden' | 'drawing' | 'analyzing' | 'interpreting' | 'result' | 'event'
type DrawingTool = 'brush' | 'eraser'

interface PlayerResident extends ResidentLike {
  readonly doodleUrl: string
  readonly spriteWidth: number
  readonly spriteHeight: number
  readonly spriteAspectRatio: number
  readonly slot: 1 | 2
}

interface Observation {
  readonly id: string
  readonly title: string
  readonly body: string
  readonly badge: string
}

interface IntroductionResult {
  readonly resident: PlayerResident
  readonly match: MatchResult
  readonly request: HiddenRequestDefinition
}

interface MutableStroke {
  readonly points: StrokePoint[]
  readonly color: string
  readonly width: number
  readonly tool: DrawingTool
  readonly source: 'template' | 'player'
}

const app = document.querySelector<HTMLDivElement>('#app')
if (!app) throw new Error('#app root not found')

app.innerHTML = `
  <div class="game-shell">
    <header class="topbar">
      <div class="brand" aria-label="Doodle Life">
        <span class="brand-mark" aria-hidden="true"></span>
        <span>Doodle Life <small>낙서 생명 연구소</small></span>
      </div>
      <div>
        <span class="day-pill"><span>첫 번째 낮</span></span>
        <button class="sound-button" id="soundButton" type="button" aria-label="소리 끄기" aria-pressed="false">♪</button>
      </div>
    </header>

    <main class="garden-layout">
      <section class="garden-stage" aria-label="주민들이 살아 움직이는 종이 정원">
        <div class="garden-sky" aria-hidden="true">
          <span class="sun"></span><span class="cloud"></span><span class="cloud"></span>
        </div>
        <span class="hill" aria-hidden="true"></span><span class="hill" aria-hidden="true"></span>
        <div class="workshop" aria-label="작은 공방"></div>
        <div class="swing" aria-label="나무 그네"></div>
        <div class="pond" aria-label="연잎이 뜬 연못"></div>
        <span class="flower" aria-hidden="true"></span><span class="flower" aria-hidden="true"></span>

        <article class="request-card" id="requestCard" aria-live="polite"></article>
        <div id="residentLayer" role="group" aria-label="정원 주민. 주민을 선택하면 가까운 친구와 상호작용합니다."></div>
        <div class="activity-strip" id="activityStrip" aria-live="polite">정원은 말보다 먼저 몸짓을 보여 줍니다. 주민을 눌러 만나 보세요.</div>
      </section>

      <aside class="side-panel" id="sidePanel" aria-label="관찰 카드 모음">
        <h2 class="panel-heading">관찰 카드 <span id="cardCount">0장</span></h2>
        <ol class="observation-list" id="observationList"></ol>
      </aside>
    </main>

    <nav class="bottom-nav" aria-label="정원 행동">
      <button class="nav-button" id="resetButton" type="button">↻ <span>처음부터</span></button>
      <button class="draw-button" id="drawButton" type="button">✎ 새 친구 그리기</button>
      <button class="nav-button" id="cardsButton" type="button">▤ <span>관찰 기록</span></button>
    </nav>

    <div class="toast" id="toast" role="status" aria-live="polite"></div>

    <div class="intro-overlay" id="introOverlay">
      <section class="intro-card" role="dialog" aria-modal="true" aria-labelledby="introTitle">
        <div class="result-seal" aria-hidden="true">✦</div>
        <h1 id="introTitle">Doodle Life <span>낙서 생명 연구소</span></h1>
        <p>이 정원의 주민들은 부탁을 똑바로 말하지 않아요.<br />몸짓을 보고 생명을 그리면, 그 선 모양 그대로 정원에서 친구를 만납니다.</p>
        <button id="startButton" type="button">정원 바라보기</button>
      </section>
    </div>

    <div class="drawer-backdrop" id="drawerBackdrop" hidden>
      <section class="drawing-drawer" id="drawingDrawer" role="dialog" aria-modal="true" aria-labelledby="drawerTitle">
        <header class="drawer-header">
          <div>
            <h2 id="drawerTitle">새 친구를 그려 주세요</h2>
            <small>연한 가이드는 빠지고, 내가 그린 선만 주민이 됩니다.</small>
          </div>
          <button id="closeDrawerButton" type="button" aria-label="그리기 닫기">×</button>
        </header>
        <div class="garden-peek" id="gardenPeek" role="status" aria-live="polite"></div>

        <div id="drawingStage">
          <div class="canvas-wrap" id="canvasWrap">
            <canvas class="draw-canvas" id="drawCanvas" width="720" height="480" tabindex="0" aria-label="낙서 그리기 캔버스. 마우스나 손가락으로 선을 그립니다."></canvas>
            <p class="canvas-hint">연한 선은 크기만 알려 주는 가이드예요.<br />원하는 실루엣을 자유롭게 그려 주세요.</p>
            <span class="timer" id="timer" aria-label="남은 권장 시간">00:40</span>
          </div>

          <div class="tool-row" aria-label="그리기 도구">
            <div class="tool-group" id="widthTools" aria-label="붓 굵기">
              <button class="tool-button" type="button" data-width="4" aria-label="가는 붓">·</button>
              <button class="tool-button is-selected" type="button" data-width="9" aria-label="보통 붓">●</button>
              <button class="tool-button" type="button" data-width="16" aria-label="굵은 붓">⬤</button>
            </div>
            <div class="tool-group" id="colorTools" aria-label="색상"></div>
            <div class="tool-group">
              <button class="tool-button" id="eraserButton" type="button" aria-pressed="false">지우개</button>
              <button class="tool-button" id="clearButton" type="button">비우기</button>
            </div>
          </div>

          <div class="drawer-actions">
            <button id="randomButton" type="button">🎲 단서로 낙서</button>
            <button id="analyzeButton" type="button">낙서 읽기 →</button>
          </div>
        </div>

        <div class="analysis-stage" id="analysisStage" hidden>
          <div class="analysis-copy">
            <h3 id="analysisTitle">겹친 선과 여백을 읽는 중…</h3>
            <p id="analysisDescription">선의 길이·방향·겹침을 정원 규칙으로 살펴보고 있어요.</p>
          </div>
          <span class="scan-line" id="scanLine" aria-hidden="true"></span>
          <div class="interpretation-grid" id="interpretationGrid"></div>
          <div class="name-reveal" id="nameReveal" hidden></div>
          <div class="commit-panel" id="commitPanel" hidden>
            <p>소개하기 전까지는 아무것도 채점되지 않아요. 선택한 해석으로 이 친구를 정원에 소개할까요?</p>
            <button id="commitButton" type="button" disabled>정원에 소개하기</button>
          </div>
        </div>
      </section>
    </div>

    <div class="result-overlay" id="resultOverlay" hidden>
      <section class="result-card" role="dialog" aria-modal="true" aria-labelledby="resultTitle">
        <div class="result-seal" id="resultSeal" aria-hidden="true">✦</div>
        <h2 id="resultTitle">정원이 대답했어요</h2>
        <p class="result-copy" id="resultCopy"></p>
        <div class="result-actions">
          <button id="resultContinueButton" type="button">정원으로 돌아가기</button>
        </div>
      </section>
    </div>

    <div class="collection-overlay" id="collectionOverlay" hidden>
      <section class="collection-card" role="dialog" aria-modal="true" aria-labelledby="collectionTitle">
        <p class="request-kicker">새 관찰 카드</p>
        <h2 id="collectionTitle">정원의 작은 사건</h2>
        <p id="collectionLead"></p>
        <div class="card-scenes" id="cardScenes"></div>
        <div class="result-actions"><button id="collectionCloseButton" type="button">카드 간직하기</button></div>
      </section>
    </div>

    <p class="sr-only" id="announcer" aria-live="assertive"></p>
  </div>
`

function requiredElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector)
  if (!element) throw new Error(`Required element missing: ${selector}`)
  return element
}

const elements = {
  requestCard: requiredElement<HTMLElement>('#requestCard'),
  residentLayer: requiredElement<HTMLElement>('#residentLayer'),
  activityStrip: requiredElement<HTMLElement>('#activityStrip'),
  observationList: requiredElement<HTMLOListElement>('#observationList'),
  cardCount: requiredElement<HTMLElement>('#cardCount'),
  sidePanel: requiredElement<HTMLElement>('#sidePanel'),
  drawButton: requiredElement<HTMLButtonElement>('#drawButton'),
  resetButton: requiredElement<HTMLButtonElement>('#resetButton'),
  cardsButton: requiredElement<HTMLButtonElement>('#cardsButton'),
  soundButton: requiredElement<HTMLButtonElement>('#soundButton'),
  introOverlay: requiredElement<HTMLElement>('#introOverlay'),
  startButton: requiredElement<HTMLButtonElement>('#startButton'),
  drawerBackdrop: requiredElement<HTMLElement>('#drawerBackdrop'),
  drawingDrawer: requiredElement<HTMLElement>('#drawingDrawer'),
  closeDrawerButton: requiredElement<HTMLButtonElement>('#closeDrawerButton'),
  gardenPeek: requiredElement<HTMLElement>('#gardenPeek'),
  drawingStage: requiredElement<HTMLElement>('#drawingStage'),
  analysisStage: requiredElement<HTMLElement>('#analysisStage'),
  analysisTitle: requiredElement<HTMLElement>('#analysisTitle'),
  analysisDescription: requiredElement<HTMLElement>('#analysisDescription'),
  scanLine: requiredElement<HTMLElement>('#scanLine'),
  interpretationGrid: requiredElement<HTMLElement>('#interpretationGrid'),
  nameReveal: requiredElement<HTMLElement>('#nameReveal'),
  commitPanel: requiredElement<HTMLElement>('#commitPanel'),
  commitButton: requiredElement<HTMLButtonElement>('#commitButton'),
  canvasWrap: requiredElement<HTMLElement>('#canvasWrap'),
  canvas: requiredElement<HTMLCanvasElement>('#drawCanvas'),
  timer: requiredElement<HTMLElement>('#timer'),
  widthTools: requiredElement<HTMLElement>('#widthTools'),
  colorTools: requiredElement<HTMLElement>('#colorTools'),
  eraserButton: requiredElement<HTMLButtonElement>('#eraserButton'),
  clearButton: requiredElement<HTMLButtonElement>('#clearButton'),
  randomButton: requiredElement<HTMLButtonElement>('#randomButton'),
  analyzeButton: requiredElement<HTMLButtonElement>('#analyzeButton'),
  toast: requiredElement<HTMLElement>('#toast'),
  resultOverlay: requiredElement<HTMLElement>('#resultOverlay'),
  resultSeal: requiredElement<HTMLElement>('#resultSeal'),
  resultTitle: requiredElement<HTMLElement>('#resultTitle'),
  resultCopy: requiredElement<HTMLElement>('#resultCopy'),
  resultContinueButton: requiredElement<HTMLButtonElement>('#resultContinueButton'),
  collectionOverlay: requiredElement<HTMLElement>('#collectionOverlay'),
  collectionTitle: requiredElement<HTMLElement>('#collectionTitle'),
  collectionLead: requiredElement<HTMLElement>('#collectionLead'),
  cardScenes: requiredElement<HTMLElement>('#cardScenes'),
  collectionCloseButton: requiredElement<HTMLButtonElement>('#collectionCloseButton'),
  announcer: requiredElement<HTMLElement>('#announcer'),
}

const maybeCanvasContext = elements.canvas.getContext('2d')
if (!maybeCanvasContext) throw new Error('2D canvas is unavailable')
const canvasContext: CanvasRenderingContext2D = maybeCanvasContext

const audio = new GardenAudio()
const playerResidents: PlayerResident[] = []
const observations: Observation[] = []
const completedRequestIds: string[] = []
const playedEventIds: string[] = []
const usedNames: string[] = STARTER_RESIDENTS.map((resident) => resident.name)

let phase: AppPhase = 'garden'
let requestIndex = 0
let requestAttempts = 0
let requestPaused = false
let strokes: MutableStroke[] = []
let activeStroke: MutableStroke | null = null
let brushWidth = 9
let brushColor: string = SHOWCASE_CONFIG.palette[0]
let drawingTool: DrawingTool = 'brush'
let timerInterval: number | undefined
let drawingDeadline = 0
let timerExpired = false
let currentAnalysis: InterpretationCards | null = null
let selectedCardIndex: number | null = null
let pendingName = ''
let introductionCounter = 0
let committing = false
let lastIntroduction: IntroductionResult | null = null
let activeEvent: EmergentEventMatch | null = null
let toastTimeout: number | undefined
let directInteractionCounter = 0

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function hasFinalConsonant(value: string): boolean {
  const last = value.at(-1)
  if (!last) return false
  const syllable = last.charCodeAt(0) - 0xac00
  return syllable >= 0 && syllable < 11172 && syllable % 28 !== 0
}

function withSubjectParticle(name: string): string {
  return `${name}${hasFinalConsonant(name) ? '이' : '가'}`
}

function naturalizeEventScene(scene: string, actors: readonly ResidentLike[]): string {
  let natural = scene
  for (const actor of actors) {
    natural = natural
      .replaceAll(`${actor.name}이(가)`, withSubjectParticle(actor.name))
      .replaceAll(`${actor.name}가`, withSubjectParticle(actor.name))
  }
  return natural
}

function currentRequest(): HiddenRequestDefinition | undefined {
  return getRequestByIndex(requestIndex)
}

function renderRequest(): void {
  const request = currentRequest()
  if (requestPaused) {
    elements.requestCard.innerHTML = `
      <p class="request-kicker">정원의 기척</p>
      <p class="request-dialogue">부탁과는 상관없는 작은 소동이 번지고 있어요.</p>
      <p class="clue-line">잠시 지켜보면 새로운 장면이 관찰 카드에 남습니다.</p>
    `
    return
  }

  if (!request) {
    elements.requestCard.innerHTML = `
      <p class="request-kicker">오늘의 부탁 완료</p>
      <p class="request-dialogue">정원의 두 빈자리에 새로운 친구가 머물게 되었어요.</p>
      <p class="clue-line">이제 손을 놓고, 여섯 주민의 작은 움직임을 천천히 바라보세요.</p>
    `
    elements.drawButton.textContent = '✓ 오늘의 부탁 완료'
    elements.drawButton.disabled = true
    return
  }

  const requester = STARTER_RESIDENTS.find((resident) => resident.id === request.requesterId)
  const dialogueIndex = Math.min(requestAttempts, request.dialogue.length - 1)
  const visibleBehaviors = request.behaviors.slice(0, requestAttempts > 0 ? 3 : 2)
  elements.requestCard.innerHTML = `
    <p class="request-kicker">${escapeHtml(requester?.name ?? '누군가')}의 말 없는 부탁</p>
    <p class="request-dialogue">“${escapeHtml(request.dialogue[dialogueIndex] ?? '')}”</p>
    <ul class="behavior-list">
      ${visibleBehaviors.map((behavior) => `<li>${escapeHtml(behavior.text)}</li>`).join('')}
    </ul>
    <p class="clue-line">${requestAttempts > 0 ? '아직 남은 몸짓이 다음 그림의 단서예요.' : '대사와 몸짓을 함께 읽어 보세요. 정답 표시는 없습니다.'}</p>
  `
}

function renderResidents(arrivingId?: string): void {
  const request = currentRequest()
  const visibleMotions = request?.behaviors
    .slice(0, requestAttempts > 0 ? 3 : 2)
    .map((behavior) => behavior.motion) ?? []
  const starterMarkup = STARTER_RESIDENTS.map((resident) => {
    const isRequester = !requestPaused && request?.requesterId === resident.id
    const motionClasses = isRequester ? visibleMotions.map((motion) => `motion-${motion}`).join(' ') : ''
    const mark = isRequester ? (resident.id === 'bangul' ? '톡 · 흘끔' : '쭉 · 멈춤') : ''
    const prop = resident.id === 'bangul' ? '●' : resident.id === 'soso' ? '⌁' : ''
    return `
      <button class="resident resident--interactive ${isRequester ? `is-requesting ${motionClasses}` : ''}" type="button" data-id="${resident.id}" data-resident-key="${resident.id}" data-shape="${resident.shape}" data-movement="${resident.traits.movement}" data-habit="${resident.traits.habit}" style="--resident-fill:${resident.color};--resident-accent:${resident.accent};--resident-scale:${resident.size};left:${resident.home.x}%;right:auto;top:auto;bottom:${100 - resident.home.y}%" aria-label="${resident.name}와 상호작용. ${resident.introduction}${isRequester ? ` ${request?.behaviors.map((behavior) => behavior.text).join(' ')}` : ''}">
        ${mark ? `<span class="behavior-mark" aria-hidden="true">${mark}</span>` : ''}
        <span class="blob-body"><span class="blob-face"></span></span>
        ${prop ? `<span class="action-prop" aria-hidden="true">${prop}</span>` : ''}
        <span class="resident-name">${resident.name}</span>
      </button>
    `
  }).join('')

  const playerMarkup = playerResidents.map((resident) => `
    <button class="resident resident--player resident--interactive ${resident.id === arrivingId ? 'is-arriving' : ''}" type="button" data-id="player-${resident.slot}" data-resident-key="${resident.id}" data-movement="${resident.traits.movement}" data-habit="${resident.traits.habit}" style="--sprite-aspect:${resident.spriteAspectRatio};--sprite-width:${resident.spriteWidth};--sprite-height:${resident.spriteHeight}" aria-label="새 주민 ${escapeHtml(resident.name)}와 상호작용">
      <span class="player-sprite"><img class="doodle-image" src="${resident.doodleUrl}" alt="" /></span>
      <span class="resident-name">${escapeHtml(resident.name)}</span>
    </button>
  `).join('')

  elements.residentLayer.innerHTML = starterMarkup + playerMarkup
}

function renderObservations(): void {
  elements.cardCount.textContent = `${observations.length}장`
  if (observations.length === 0) {
    elements.observationList.innerHTML = '<li class="empty-state">아직 기록된 장면이 없어요.<br />새 친구를 소개하면 정원이 이야기를 시작합니다.</li>'
    return
  }
  elements.observationList.innerHTML = observations.map((observation) => `
    <li>
      <article class="observation-card" tabindex="0" aria-label="${escapeHtml(observation.title)} 관찰 카드">
        <small>${escapeHtml(observation.badge)}</small>
        <strong>${escapeHtml(observation.title)}</strong>
        <small>${escapeHtml(observation.body)}</small>
      </article>
    </li>
  `).join('')
}

function showToast(message: string): void {
  window.clearTimeout(toastTimeout)
  elements.toast.textContent = message
  elements.toast.classList.add('is-visible')
  toastTimeout = window.setTimeout(() => elements.toast.classList.remove('is-visible'), 2600)
}

function announce(message: string): void {
  elements.announcer.textContent = ''
  window.setTimeout(() => { elements.announcer.textContent = message }, 30)
}

const backgroundRegions = [
  requiredElement<HTMLElement>('.topbar'),
  requiredElement<HTMLElement>('.garden-layout'),
  requiredElement<HTMLElement>('.bottom-nav'),
]

function setGardenInert(inert: boolean): void {
  for (const region of backgroundRegions) region.inert = inert
}

function activeModal(): HTMLElement | null {
  if (!elements.introOverlay.hidden) return elements.introOverlay.querySelector<HTMLElement>('[role="dialog"]')
  if (!elements.resultOverlay.hidden) return elements.resultOverlay.querySelector<HTMLElement>('[role="dialog"]')
  if (!elements.collectionOverlay.hidden) return elements.collectionOverlay.querySelector<HTMLElement>('[role="dialog"]')
  if (!elements.drawerBackdrop.hidden) return elements.drawingDrawer
  return null
}

function trapModalFocus(event: KeyboardEvent): void {
  if (event.key !== 'Tab') return
  const modal = activeModal()
  if (!modal) return
  const focusable = [...modal.querySelectorAll<HTMLElement>(
    'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
  )].filter((element) => !element.hidden && element.getClientRects().length > 0)
  const first = focusable[0]
  const last = focusable.at(-1)
  if (!first || !last) return
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  } else if (!modal.contains(document.activeElement)) {
    event.preventDefault()
    first.focus()
  }
}

function makePoint(x: number, y: number): StrokePoint {
  return { x, y, t: performance.now() }
}

function makeStroke(
  points: StrokePoint[],
  color = brushColor,
  width = brushWidth,
  tool: DrawingTool = 'brush',
  source: MutableStroke['source'] = 'player',
): MutableStroke {
  return {
    points,
    color,
    width,
    tool,
    source,
  }
}

function makeBodyTemplate(): MutableStroke {
  const points: StrokePoint[] = []
  const centerX = SHOWCASE_CONFIG.canvas.width / 2
  const centerY = SHOWCASE_CONFIG.canvas.height * 0.58
  for (let step = 0; step <= 42; step += 1) {
    const angle = (Math.PI * 2 * step) / 42
    points.push(makePoint(centerX + Math.cos(angle) * 112, centerY + Math.sin(angle) * 88))
  }
  return makeStroke(points, '#75665b', 5, 'brush', 'template')
}

function resetDrawing(): void {
  strokes = [makeBodyTemplate()]
  activeStroke = null
  selectedCardIndex = null
  currentAnalysis = null
  pendingName = ''
  brushWidth = 9
  brushColor = SHOWCASE_CONFIG.palette[0]
  drawingTool = 'brush'
  syncToolButtons()
  redrawCanvas()
}

function renderStroke(context: CanvasRenderingContext2D, stroke: MutableStroke, opacity = 1): void {
  if (stroke.points.length === 0) return
  context.save()
  context.globalAlpha = opacity
  context.globalCompositeOperation = stroke.tool === 'eraser' ? 'destination-out' : 'source-over'
  context.strokeStyle = stroke.color
  context.fillStyle = stroke.color
  context.lineWidth = stroke.tool === 'eraser' ? Math.max(22, stroke.width * 2) : stroke.width
  context.lineCap = 'round'
  context.lineJoin = 'round'
  context.beginPath()
  const first = stroke.points[0]
  if (!first) return
  context.moveTo(first.x, first.y)
  for (const point of stroke.points.slice(1)) context.lineTo(point.x, point.y)
  if (stroke.points.length === 1) context.arc(first.x, first.y, context.lineWidth / 2, 0, Math.PI * 2)
  context.stroke()
  context.restore()
}

function redrawCanvas(): void {
  canvasContext.clearRect(0, 0, elements.canvas.width, elements.canvas.height)
  for (const stroke of strokes) renderStroke(canvasContext, stroke, stroke.source === 'template' ? .18 : 1)
  elements.canvasWrap.classList.toggle('has-drawing', strokes.some((stroke) => stroke.source === 'player' && stroke.tool === 'brush'))
}

function pointerPosition(event: PointerEvent): StrokePoint {
  const rect = elements.canvas.getBoundingClientRect()
  return makePoint(
    Math.max(0, Math.min(elements.canvas.width, (event.clientX - rect.left) * elements.canvas.width / rect.width)),
    Math.max(0, Math.min(elements.canvas.height, (event.clientY - rect.top) * elements.canvas.height / rect.height)),
  )
}

function beginStroke(event: PointerEvent): void {
  if (phase !== 'drawing') return
  event.preventDefault()
  elements.canvas.setPointerCapture(event.pointerId)
  activeStroke = makeStroke([pointerPosition(event)], brushColor, brushWidth, drawingTool)
  strokes.push(activeStroke)
  redrawCanvas()
}

function extendStroke(event: PointerEvent): void {
  if (!activeStroke || phase !== 'drawing') return
  event.preventDefault()
  activeStroke.points.push(pointerPosition(event))
  redrawCanvas()
}

function endStroke(event: PointerEvent): void {
  if (!activeStroke) return
  event.preventDefault()
  if (elements.canvas.hasPointerCapture(event.pointerId)) elements.canvas.releasePointerCapture(event.pointerId)
  if (activeStroke.tool === 'eraser') removeErasedStrokeData(activeStroke)
  activeStroke = null
  redrawCanvas()
  audio.play('draw')
}

function removeErasedStrokeData(eraser: MutableStroke): void {
  const radius = Math.max(22, eraser.width * 2)
  const radiusSquared = radius * radius
  strokes = strokes.filter((stroke) => {
    if (stroke === eraser || stroke.tool === 'eraser') return false
    return !polylinesTouch(stroke.points, eraser.points, radiusSquared)
  })
}

function polylinesTouch(
  first: readonly StrokePoint[],
  second: readonly StrokePoint[],
  radiusSquared: number,
): boolean {
  if (first.length === 0 || second.length === 0) return false
  const firstSegments = first.length === 1 ? [[first[0], first[0]]] : first.slice(1).map((point, index) => [first[index], point])
  const secondSegments = second.length === 1 ? [[second[0], second[0]]] : second.slice(1).map((point, index) => [second[index], point])
  return firstSegments.some(([a, b]) => a && b && secondSegments.some(([c, d]) => c && d && (
    segmentsIntersect(a, b, c, d)
    || pointToSegmentDistanceSquared(a, c, d) <= radiusSquared
    || pointToSegmentDistanceSquared(b, c, d) <= radiusSquared
    || pointToSegmentDistanceSquared(c, a, b) <= radiusSquared
    || pointToSegmentDistanceSquared(d, a, b) <= radiusSquared
  )))
}

function segmentsIntersect(a: StrokePoint, b: StrokePoint, c: StrokePoint, d: StrokePoint): boolean {
  const abX = b.x - a.x
  const abY = b.y - a.y
  const cdX = d.x - c.x
  const cdY = d.y - c.y
  const acX = c.x - a.x
  const acY = c.y - a.y
  const denominator = abX * cdY - abY * cdX
  const epsilon = 0.000001
  if (Math.abs(denominator) <= epsilon) {
    if (Math.abs(acX * abY - acY * abX) > epsilon) return false
    return Math.max(Math.min(a.x, b.x), Math.min(c.x, d.x)) <= Math.min(Math.max(a.x, b.x), Math.max(c.x, d.x)) + epsilon
      && Math.max(Math.min(a.y, b.y), Math.min(c.y, d.y)) <= Math.min(Math.max(a.y, b.y), Math.max(c.y, d.y)) + epsilon
  }
  const firstRatio = (acX * cdY - acY * cdX) / denominator
  const secondRatio = (acX * abY - acY * abX) / denominator
  return firstRatio >= -epsilon && firstRatio <= 1 + epsilon && secondRatio >= -epsilon && secondRatio <= 1 + epsilon
}

function pointToSegmentDistanceSquared(point: StrokePoint, start: StrokePoint, end: StrokePoint): number {
  const dx = end.x - start.x
  const dy = end.y - start.y
  if (dx === 0 && dy === 0) return (point.x - start.x) ** 2 + (point.y - start.y) ** 2
  const ratio = Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / (dx * dx + dy * dy)))
  const closestX = start.x + ratio * dx
  const closestY = start.y + ratio * dy
  return (point.x - closestX) ** 2 + (point.y - closestY) ** 2
}

function syncToolButtons(): void {
  elements.widthTools.querySelectorAll<HTMLButtonElement>('[data-width]').forEach((button) => {
    const selected = Number(button.dataset.width) === brushWidth && drawingTool === 'brush'
    button.classList.toggle('is-selected', selected)
    button.setAttribute('aria-pressed', String(selected))
  })
  elements.colorTools.querySelectorAll<HTMLButtonElement>('[data-color-value]').forEach((button) => {
    const selected = button.dataset.colorValue === brushColor && drawingTool === 'brush'
    button.classList.toggle('is-selected', selected)
    button.setAttribute('aria-pressed', String(selected))
  })
  elements.eraserButton.classList.toggle('is-selected', drawingTool === 'eraser')
  elements.eraserButton.setAttribute('aria-pressed', String(drawingTool === 'eraser'))
}

function buildPalette(): void {
  const colorNames = ['먹색', '산호', '햇살', '풀잎', '연못', '제비꽃']
  elements.colorTools.innerHTML = SHOWCASE_CONFIG.palette.map((color, index) => `
    <button class="color-button ${index === 0 ? 'is-selected' : ''}" type="button" data-color-value="${color}" style="--swatch:${color}" aria-label="${colorNames[index] ?? '색상'}" aria-pressed="${index === 0}"></button>
  `).join('')
}

function startTimer(): void {
  window.clearInterval(timerInterval)
  drawingDeadline = Date.now() + SHOWCASE_CONFIG.drawingSeconds * 1000
  timerExpired = false
  updateTimer()
  timerInterval = window.setInterval(updateTimer, 250)
}

function stopTimer(): void {
  window.clearInterval(timerInterval)
  timerInterval = undefined
}

function updateTimer(): void {
  const seconds = Math.max(0, Math.ceil((drawingDeadline - Date.now()) / 1000))
  elements.timer.textContent = seconds > 0 ? `00:${String(seconds).padStart(2, '0')}` : '천천히 마무리해요'
  if (seconds === 0 && !timerExpired) {
    timerExpired = true
    elements.timer.classList.add('is-expired')
    announce('권장 시간 40초가 지났습니다. 자동 제출되지 않으니 계속 그려도 괜찮아요.')
  }
}

function openDrawing(): void {
  if (phase !== 'garden') {
    showToast('주민들의 움직임이 끝난 뒤 새 친구를 그릴 수 있어요.')
    return
  }
  if (!currentRequest() || requestPaused) {
    showToast(requestPaused ? '지금은 정원의 작은 사건을 지켜봐 주세요.' : '오늘의 부탁을 모두 해결했어요.')
    return
  }
  phase = 'drawing'
  resetDrawing()
  elements.drawingStage.hidden = false
  elements.analysisStage.hidden = true
  elements.drawerBackdrop.hidden = false
  renderGardenPeek()
  setGardenInert(true)
  elements.drawingDrawer.classList.remove('is-closing')
  elements.timer.classList.remove('is-expired')
  startTimer()
  audio.play('tap')
  window.setTimeout(() => elements.canvas.focus(), 80)
}

function closeDrawing(): void {
  if (phase === 'analyzing') return
  stopTimer()
  phase = 'garden'
  elements.drawingDrawer.classList.add('is-closing')
  window.setTimeout(() => {
    elements.drawerBackdrop.hidden = true
    setGardenInert(false)
    elements.drawingDrawer.classList.remove('is-closing')
    resetDrawing()
    elements.drawButton.focus()
  }, 260)
}

function renderGardenPeek(): void {
  const request = currentRequest()
  const requester = STARTER_RESIDENTS.find((resident) => resident.id === request?.requesterId)
  if (!request || !requester) {
    elements.gardenPeek.textContent = '정원의 움직임은 계속되고 있어요.'
    return
  }
  const visibleBehaviors = request.behaviors.slice(0, requestAttempts > 0 ? 3 : 2)
  elements.gardenPeek.innerHTML = `
    <span class="peek-resident" style="--peek-fill:${requester.color}" aria-hidden="true"><i></i></span>
    <p><strong>${escapeHtml(requester.name)}의 부탁은 그대로예요.</strong><span>${visibleBehaviors.map((behavior) => escapeHtml(behavior.text)).join(' · ')}</span></p>
    <small>정원 관찰 중</small>
  `
}

function addRandomDoodle(): void {
  if (phase !== 'drawing') return
  strokes = [makeBodyTemplate()]
  const shapes = requestIndex === 0
    ? [
        { color: '#f4bd4f', points: [[300, 220], [330, 180], [360, 214], [392, 180], [420, 220], [462, 246], [422, 278], [446, 326], [392, 310], [360, 348], [326, 310], [274, 326], [298, 278], [258, 246], [300, 220]] },
        { color: '#f4bd4f', points: [[250, 240], [305, 215], [360, 236], [415, 214], [470, 240]] },
        { color: '#f4bd4f', points: [[245, 278], [300, 264], [360, 282], [420, 263], [475, 278]] },
        { color: '#f4bd4f', points: [[255, 320], [305, 300], [360, 324], [415, 300], [465, 320]] },
        { color: '#f06f5f', points: [[315, 268], [360, 302], [405, 268]] },
      ]
    : [
        { color: '#8d72ad', points: [[360, 80], [448, 172]] },
        { color: '#8d72ad', points: [[448, 172], [402, 230]] },
        { color: '#8d72ad', points: [[402, 230], [360, 208]] },
        { color: '#8d72ad', points: [[360, 208], [318, 230]] },
        { color: '#8d72ad', points: [[318, 230], [272, 172]] },
        { color: '#8d72ad', points: [[272, 172], [360, 80]] },
        { color: '#f06f5f', points: [[285, 250], [275, 205], [285, 155], [275, 105]] },
        { color: '#f4bd4f', points: [[335, 250], [325, 205], [335, 155], [325, 105]] },
        { color: '#79a96b', points: [[385, 250], [375, 205], [385, 155], [375, 105]] },
        { color: '#5e91b8', points: [[435, 250], [425, 205], [435, 155], [425, 105]] },
      ]
  for (const shape of shapes) {
    strokes.push(makeStroke(shape.points.map(([x, y]) => makePoint(x ?? 0, y ?? 0)), shape.color, 12, 'brush'))
  }
  redrawCanvas()
  audio.play('select')
  showToast('보이는 몸짓을 따라 예시 선을 그렸어요. 판독기는 부탁을 모른 채 획만 읽습니다.')
}

function clearDrawing(): void {
  strokes = [makeBodyTemplate()]
  redrawCanvas()
  audio.play('tap')
}

function submitDrawing(): void {
  const drawnStrokes = strokes.filter((stroke) => stroke.source === 'player' && stroke.tool === 'brush' && stroke.points.length > 1)
  if (drawnStrokes.length === 0) {
    showToast('연한 가이드 위에 나만의 선을 하나만 더 그어 주세요.')
    return
  }
  const request = currentRequest()
  if (!request) return
  stopTimer()
  phase = 'analyzing'
  elements.drawingStage.hidden = true
  elements.analysisStage.hidden = false
  elements.scanLine.hidden = false
  elements.analysisTitle.textContent = '겹친 선과 여백을 읽는 중…'
  elements.analysisDescription.textContent = '선의 길이·방향·겹침을 정원 규칙으로 살펴보고 있어요.'
  elements.interpretationGrid.innerHTML = ''
  elements.nameReveal.hidden = true
  elements.commitPanel.hidden = true
  audio.play('tap')

  window.setTimeout(() => {
    currentAnalysis = analyzeDrawing(strokes)
    selectedCardIndex = null
    const drawingSeed = strokes.map((stroke) => `${stroke.points.length}:${stroke.color}:${stroke.width}`).join('|')
    pendingName = createResidentName(usedNames, `${request.id}:${drawingSeed}`)
    phase = 'interpreting'
    renderInterpretations(currentAnalysis)
  }, 1450)
}

function renderInterpretations(analysis: InterpretationCards): void {
  elements.scanLine.hidden = true
  elements.analysisTitle.textContent = '이 낙서에서 세 가지 생명을 읽었어요'
  elements.analysisDescription.textContent = '카드를 바꿔 보며 어떤 획을 근거로 읽었는지 확인하세요.'
  elements.interpretationGrid.innerHTML = analysis.map((card, index) => {
    const traits = card.traits
    return `
      <button class="interpretation-card" type="button" data-card-index="${index}" aria-pressed="false">
        <h4>${escapeHtml(card.title)}</h4>
        <div class="trait-pills">${traits.map((trait) => `<span>${escapeHtml(trait)}</span>`).join('')}</div>
        <p>${escapeHtml(card.reason)}</p>
        <div class="evidence-preview">
          <canvas width="180" height="120" data-evidence-index="${index}" aria-label="이 해석의 근거 획"></canvas>
          <span>${escapeHtml(card.subtitle)}</span>
        </div>
      </button>
    `
  }).join('')
  for (const [index, card] of analysis.entries()) drawEvidencePreview(index, card)
  elements.commitPanel.hidden = false
  elements.commitButton.disabled = true
  elements.nameReveal.hidden = true
  elements.interpretationGrid.querySelector<HTMLButtonElement>('button')?.focus()
  announce('해석 카드 세 장이 준비되었습니다. 카드를 고르면 근거 획과 자동 이름을 확인할 수 있습니다.')
}

function drawEvidencePreview(index: number, card: InterpretationCard): void {
  const canvas = elements.interpretationGrid.querySelector<HTMLCanvasElement>(`[data-evidence-index="${index}"]`)
  const context = canvas?.getContext('2d')
  if (!canvas || !context) return
  const scaleX = canvas.width / SHOWCASE_CONFIG.canvas.width
  const scaleY = canvas.height / SHOWCASE_CONFIG.canvas.height
  context.save()
  context.scale(scaleX, scaleY)
  for (const stroke of strokes) {
    if (stroke.source === 'template') continue
    renderStroke(context, stroke, stroke.tool === 'eraser' ? 1 : .16)
  }
  for (const evidenceIndex of card.evidenceStrokeIndices) {
    const stroke = strokes[evidenceIndex]
    if (!stroke || stroke.tool === 'eraser') continue
    context.save()
    context.shadowColor = '#f4bd4f'
    context.shadowBlur = 16
    context.lineWidth = stroke.width + 12
    renderStroke(context, { ...stroke, color: '#f4bd4f', width: stroke.width + 9 }, .92)
    context.restore()
    renderStroke(context, stroke, 1)
  }
  context.restore()
}

function selectInterpretation(index: number): void {
  if (phase !== 'interpreting' || !currentAnalysis?.[index]) return
  selectedCardIndex = index
  elements.interpretationGrid.querySelectorAll<HTMLButtonElement>('[data-card-index]').forEach((button) => {
    const selected = Number(button.dataset.cardIndex) === index
    button.classList.toggle('is-selected', selected)
    button.setAttribute('aria-pressed', String(selected))
  })
  elements.nameReveal.hidden = false
  elements.nameReveal.innerHTML = `<strong>이 생명은 스스로 이름을 골랐어요.</strong><span class="request-dialogue">“${escapeHtml(pendingName)}”</span>`
  elements.commitButton.disabled = false
  audio.play('select')
}

function introduceSelectedResident(): void {
  if (committing || phase !== 'interpreting' || selectedCardIndex === null || !currentAnalysis) return
  const card = currentAnalysis[selectedCardIndex]
  const request = currentRequest()
  if (!card || !request) return
  committing = true
  elements.commitButton.disabled = true
  introductionCounter += 1

  if (playerResidents.length >= 2) playerResidents.shift()
  const occupiedSlots = new Set(playerResidents.map((resident) => resident.slot))
  const slot: 1 | 2 = occupiedSlots.has(1) ? 2 : 1
  const sprite = extractDoodleSprite(strokes, SHOWCASE_CONFIG.canvas, { padding: 14 })
  const resident: PlayerResident = {
    id: `created-${introductionCounter}`,
    name: pendingName,
    traits: card.traitSet,
    doodleUrl: sprite.dataUrl,
    spriteWidth: sprite.width,
    spriteHeight: sprite.height,
    spriteAspectRatio: sprite.aspectRatio,
    slot,
  }
  playerResidents.push(resident)
  usedNames.push(resident.name)
  const match = evaluateMatch(resident.traits, request, resident.name)
  lastIntroduction = { resident, match, request }

  stopTimer()
  elements.drawerBackdrop.hidden = true
  setGardenInert(true)
  phase = 'result'
  renderResidents(resident.id)
  elements.activityStrip.textContent = `${withSubjectParticle(resident.name)} 종이 위에서 정원으로 폴짝 내려왔어요.`
  audio.play('arrive')

  window.setTimeout(() => showMatchResult(lastIntroduction), 1050)
}

function showMatchResult(result: IntroductionResult | null): void {
  if (!result) return
  const { match, request, resident } = result
  const requester = STARTER_RESIDENTS.find((entry) => entry.id === request.requesterId)
  const tierPresentation = {
    'just-right': { icon: '✦', title: '말하지 못한 부탁이 닿았어요' },
    'oddly-good': { icon: '◌', title: '조금 어긋나도 좋은 시작이에요' },
    'new-discovery': { icon: '⌁', title: '이번에는 새로운 몸짓을 발견했어요' },
  } as const

  elements.resultSeal.textContent = tierPresentation[match.tier].icon
  elements.resultTitle.textContent = tierPresentation[match.tier].title
  elements.resultCopy.innerHTML = `<strong>${escapeHtml(resident.name)}의 첫 인사.</strong><br />${escapeHtml(match.reaction)}`
  elements.resultContinueButton.textContent = match.resolved ? '정원에서 첫 만남 보기' : '몸짓을 다시 읽어보기'
  elements.resultOverlay.hidden = false
  setGardenInert(true)
  const requesterElement = document.querySelector<HTMLElement>(`[data-resident-key="${requester?.id ?? ''}"]`)
  requesterElement?.classList.add('is-reacting')

  if (match.resolved) {
    completedRequestIds.push(request.id)
    observations.unshift({
      id: `request-${request.id}`,
      title: request.observation.title,
      body: request.observation.body,
      badge: `${requester?.name ?? '주민'}의 부탁`,
    })
    requestIndex += 1
    requestAttempts = 0
    requestPaused = true
    audio.play('success')
  } else {
    requestAttempts += 1
    audio.play('event')
  }
  renderObservations()
  committing = false
  elements.resultContinueButton.focus()
  announce(`${match.label}. ${match.reaction}`)
}

function continueAfterResult(): void {
  const result = lastIntroduction
  elements.resultOverlay.hidden = true
  setGardenInert(false)
  lastIntroduction = null
  phase = 'garden'
  if (result?.match.resolved) {
    renderRequest()
    renderResidents()
    elements.activityStrip.textContent = `${withSubjectParticle(result.resident.name)} 정원에서 첫 친구를 발견했어요…`
    window.setTimeout(() => { void startGuaranteedEvent(result.resident.id, result.request.requesterId) }, 650)
  } else {
    renderRequest()
    renderResidents()
    if (result) {
      elements.activityStrip.textContent = `${withSubjectParticle(result.resident.name)} 부탁자에게 먼저 인사하러 가요…`
      void startUnresolvedMeeting(result.resident.id, result.request.requesterId)
    } else {
      elements.activityStrip.textContent = '틀린 그림은 없어요. 남아 있는 몸짓이 다음 낙서의 단서가 됩니다.'
      elements.drawButton.focus()
    }
  }
}

function allResidents(): ResidentLike[] {
  return [...STARTER_RESIDENTS, ...playerResidents]
}

async function stageFirstMeeting(introducedResidentId?: string, requesterId?: string): Promise<boolean> {
  const introducedResident = allResidents().find((resident) => resident.id === introducedResidentId)
  const requester = allResidents().find((resident) => resident.id === requesterId)
  const introducedElement = introducedResident
    ? document.querySelector<HTMLElement>(`[data-resident-key="${introducedResident.id}"]`)
    : null
  const requesterElement = requester
    ? document.querySelector<HTMLElement>(`[data-resident-key="${requester.id}"]`)
    : null
  if (!introducedResident || !requester || !introducedElement || !requesterElement) return false

  const reunion = planDirectInteraction(introducedResident, requester)
  audio.play('success')
  await stageGardenInteraction({
    actorAElement: introducedElement,
    actorBElement: requesterElement,
    actorAName: introducedResident.name,
    actorBName: requester.name,
    kind: reunion.kind,
    prop: reunion.prop,
    onStatus: (message) => {
      elements.activityStrip.textContent = message
      announce(message)
    },
  })
  return true
}

async function startUnresolvedMeeting(introducedResidentId: string, requesterId: string): Promise<void> {
  if (phase !== 'garden') return
  phase = 'event'
  elements.residentLayer.setAttribute('aria-busy', 'true')
  try {
    await stageFirstMeeting(introducedResidentId, requesterId)
    elements.activityStrip.textContent = '조금 다른 인사였지만 둘은 서로를 기억했어요. 남은 몸짓이 다음 낙서의 단서가 됩니다.'
  } finally {
    elements.residentLayer.removeAttribute('aria-busy')
    phase = 'garden'
    renderRequest()
    renderResidents()
    elements.drawButton.focus()
  }
}

async function startGuaranteedEvent(involvingResidentId?: string, requesterId?: string): Promise<void> {
  if (phase !== 'garden') return
  phase = 'event'
  elements.residentLayer.setAttribute('aria-busy', 'true')
  await stageFirstMeeting(involvingResidentId, requesterId)

  const candidates = findEmergentEvents(allResidents(), { involvingResidentId, excludedEventIds: playedEventIds })
  const fallbackTemplate = EMERGENT_EVENTS.find((event) => !playedEventIds.includes(event.id))
  activeEvent = candidates[0] ?? (fallbackTemplate ? {
    template: fallbackTemplate,
    actorA: allResidents()[0] ?? STARTER_RESIDENTS[0],
    actorB: allResidents()[1] ?? STARTER_RESIDENTS[1],
    scene: fallbackTemplate.scene
      .replaceAll('{actorA}', allResidents()[0]?.name ?? STARTER_RESIDENTS[0].name)
      .replaceAll('{actorB}', allResidents()[1]?.name ?? STARTER_RESIDENTS[1].name),
  } : null)
  if (!activeEvent) {
    elements.residentLayer.removeAttribute('aria-busy')
    finishEvent()
    return
  }

  playedEventIds.push(activeEvent.template.id)
  const actorAElement = document.querySelector<HTMLElement>(`[data-resident-key="${activeEvent.actorA.id}"]`)
  const actorBElement = document.querySelector<HTMLElement>(`[data-resident-key="${activeEvent.actorB.id}"]`)
  elements.activityStrip.textContent = `${activeEvent.actorA.name}와 ${activeEvent.actorB.name}가 서로를 발견했어요.`
  audio.play('event')
  if (actorAElement && actorBElement) {
    await stageGardenInteraction({
      actorAElement,
      actorBElement,
      actorAName: activeEvent.actorA.name,
      actorBName: activeEvent.actorB.name,
      kind: activeEvent.template.id,
      prop: activeEvent.template.prop,
      onStatus: (message) => {
        elements.activityStrip.textContent = message
        announce(message)
      },
    })
  }
  elements.residentLayer.removeAttribute('aria-busy')
  if (phase === 'event') showCollectionCard(activeEvent)
}

async function interactWithResident(targetId: string): Promise<void> {
  if (phase !== 'garden' || requestPaused || !elements.drawerBackdrop.hidden) return
  const residents = allResidents()
  const target = residents.find((resident) => resident.id === targetId)
  if (!target) return

  const latestPlayer = playerResidents.at(-1)
  const requesterId = currentRequest()?.requesterId
  const otherResidents = residents.filter((resident) => resident.id !== target.id)
  const fallbackPartner = residents.find((resident) => resident.id === requesterId && resident.id !== target.id)
    ?? otherResidents[directInteractionCounter % otherResidents.length]
  const actorA = latestPlayer ?? target
  const actorB = latestPlayer && target.id !== latestPlayer.id ? target : fallbackPartner
  if (!actorB || actorA.id === actorB.id) {
    showToast('곁에 함께 움직일 다른 주민이 필요해요.')
    return
  }

  const actorAElement = document.querySelector<HTMLElement>(`[data-resident-key="${actorA.id}"]`)
  const actorBElement = document.querySelector<HTMLElement>(`[data-resident-key="${actorB.id}"]`)
  if (!actorAElement || !actorBElement) return

  const plan = planDirectInteraction(actorA, actorB)
  phase = 'event'
  directInteractionCounter += 1
  elements.residentLayer.setAttribute('aria-busy', 'true')
  audio.play('event')
  try {
    await stageGardenInteraction({
      actorAElement,
      actorBElement,
      actorAName: actorA.name,
      actorBName: actorB.name,
      kind: plan.kind,
      prop: plan.prop,
      onStatus: (message) => {
        elements.activityStrip.textContent = message
        announce(message)
      },
    })
    elements.activityStrip.textContent = `${plan.copy} 다른 주민도 눌러 새로운 장면을 만들어 보세요.`
    announce(plan.copy)
  } finally {
    elements.residentLayer.removeAttribute('aria-busy')
    phase = 'garden'
    document.querySelector<HTMLElement>(`[data-resident-key="${targetId}"]`)?.focus()
  }
}

function showCollectionCard(event: EmergentEventMatch | null): void {
  if (!event) return
  observations.unshift({
    id: `event-${event.template.id}`,
    title: event.template.title,
    body: event.template.observation,
    badge: `${event.template.time} · ${event.template.prop}`,
  })
  renderObservations()
  elements.collectionTitle.textContent = event.template.title
  elements.collectionLead.textContent = event.template.observation
  const sceneCopy = [
    `${withSubjectParticle(event.actorA.name)} ${event.template.prop} 가까이 다가왔어요.`,
    naturalizeEventScene(event.scene, [event.actorA, event.actorB]),
    '아무도 부탁하지 않은 장면이 정원의 기억으로 남았습니다.',
  ]
  elements.cardScenes.innerHTML = sceneCopy.map((copy) => `<div class="scene"><span>${escapeHtml(copy)}</span></div>`).join('')
  elements.collectionOverlay.hidden = false
  setGardenInert(true)
  elements.collectionCloseButton.focus()
  announce(`새 관찰 카드, ${event.template.title}`)
}

function finishEvent(): void {
  elements.collectionOverlay.hidden = true
  setGardenInert(false)
  activeEvent = null
  requestPaused = false
  phase = 'garden'
  renderRequest()
  renderResidents()
  if (currentRequest()) {
    elements.activityStrip.textContent = '소동이 잦아들었어요. 주민을 눌러 새 친구와 다시 만나게 해 보세요.'
    elements.drawButton.focus()
  } else {
    elements.activityStrip.textContent = '두 부탁은 끝났지만 정원은 계속돼요. 주민을 누를 때마다 다른 만남이 시작됩니다.'
    elements.cardsButton.focus()
  }
}

function toggleSound(): void {
  const muted = audio.toggle()
  elements.soundButton.textContent = muted ? '×' : '♪'
  elements.soundButton.setAttribute('aria-pressed', String(muted))
  elements.soundButton.setAttribute('aria-label', muted ? '소리 켜기' : '소리 끄기')
  showToast(muted ? '정원의 소리를 껐어요.' : '정원의 소리를 켰어요.')
}

function handleEscape(): void {
  if (!elements.collectionOverlay.hidden) return
  if (!elements.resultOverlay.hidden) return
  if (!elements.drawerBackdrop.hidden && phase !== 'analyzing') closeDrawing()
}

buildPalette()
resetDrawing()
renderRequest()
renderResidents()
renderObservations()
setGardenInert(true)
window.requestAnimationFrame(() => elements.startButton.focus())

elements.startButton.addEventListener('click', () => {
  elements.introOverlay.hidden = true
  setGardenInert(false)
  elements.activityStrip.textContent = '방울이 돌을 톡… 톡… 두드려요. 주민을 누르면 서로에게 다가갑니다.'
  audio.play('success')
  elements.drawButton.focus()
})
elements.drawButton.addEventListener('click', openDrawing)
elements.closeDrawerButton.addEventListener('click', closeDrawing)
elements.soundButton.addEventListener('click', toggleSound)
elements.resetButton.addEventListener('click', () => window.location.reload())
elements.cardsButton.addEventListener('click', () => {
  elements.sidePanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  elements.observationList.querySelector<HTMLElement>('.observation-card')?.focus()
  if (observations.length === 0) showToast('첫 장면은 새 친구를 소개한 뒤 기록돼요.')
})
elements.randomButton.addEventListener('click', addRandomDoodle)
elements.clearButton.addEventListener('click', clearDrawing)
elements.analyzeButton.addEventListener('click', submitDrawing)
elements.commitButton.addEventListener('click', introduceSelectedResident)
elements.resultContinueButton.addEventListener('click', continueAfterResult)
elements.collectionCloseButton.addEventListener('click', finishEvent)
elements.residentLayer.addEventListener('click', (event) => {
  const resident = (event.target as Element).closest<HTMLElement>('[data-resident-key]')
  if (resident?.dataset.residentKey) void interactWithResident(resident.dataset.residentKey)
})

elements.widthTools.addEventListener('click', (event) => {
  const button = (event.target as Element).closest<HTMLButtonElement>('[data-width]')
  if (!button) return
  brushWidth = Number(button.dataset.width)
  drawingTool = 'brush'
  syncToolButtons()
  audio.play('tap')
})
elements.colorTools.addEventListener('click', (event) => {
  const button = (event.target as Element).closest<HTMLButtonElement>('[data-color-value]')
  if (!button?.dataset.colorValue) return
  brushColor = button.dataset.colorValue
  drawingTool = 'brush'
  syncToolButtons()
  audio.play('tap')
})
elements.eraserButton.addEventListener('click', () => {
  drawingTool = drawingTool === 'eraser' ? 'brush' : 'eraser'
  syncToolButtons()
  audio.play('tap')
})
elements.interpretationGrid.addEventListener('click', (event) => {
  const button = (event.target as Element).closest<HTMLButtonElement>('[data-card-index]')
  if (!button) return
  selectInterpretation(Number(button.dataset.cardIndex))
})

elements.canvas.addEventListener('pointerdown', beginStroke)
elements.canvas.addEventListener('pointermove', extendStroke)
elements.canvas.addEventListener('pointerup', endStroke)
elements.canvas.addEventListener('pointercancel', endStroke)
document.addEventListener('keydown', (event) => {
  trapModalFocus(event)
  if (event.key === 'Escape') handleEscape()
})

// Kept visible for manual demo diagnostics without changing normal gameplay.
Object.assign(window, {
  __DOODLE_LIFE__: {
    get phase() { return phase },
    get requestIndex() { return requestIndex },
    get residentCount() { return STARTER_RESIDENTS.length + playerResidents.length },
    get observationCount() { return observations.length },
    get playedEventIds() { return [...playedEventIds] },
    get activeEventActorIds() { return activeEvent ? [activeEvent.actorA.id, activeEvent.actorB.id] : [] },
    get directInteractionCount() { return directInteractionCounter },
  },
})

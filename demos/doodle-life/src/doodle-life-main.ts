import './style.css'
import './generative-style.css'
import './doodle-life/request-first.css'

import { measureDrawing } from './analyzer.ts'
import { GardenApiError } from './ai/client.ts'
import type { TraceSummary } from './ai/contracts.ts'
import { DoodleLifeApi } from './doodle-life/client.ts'
import type {
  DoodleLifeHealthResponse,
  DoodleReadingResponse,
  DoodleResident,
  DoodleWorld,
  EncounterReactionResponse,
  QuestPublicView,
  QuestResolutionView,
  ResolvedEncounter,
} from './doodle-life/contracts.ts'
import { DrawingBoard, type DrawingSnapshot } from './drawing-board.ts'
import { renderCharacterDesign, type RenderedCharacter } from './render/character-renderer.ts'
import { createDoodleLifeform, type DoodleLifeform } from './render/doodle-lifeform.ts'
import { EvidenceOverlay } from './render/evidence-overlay.ts'
import { playResolvedEncounter } from './render/resolved-encounter-player.ts'

type AppPhase =
  | 'booting'
  | 'garden'
  | 'observing'
  | 'drawing'
  | 'reading'
  | 'reading-review'
  | 'resolving'
  | 'animating'
  | 'recorded'

interface RoleMetric {
  calls: number
  tokens: number
  latencyMs: number
}

const app = document.querySelector<HTMLDivElement>('#app')
if (!app) throw new Error('#app root not found')

app.innerHTML = `
  <div class="game-shell request-first-shell">
    <header class="topbar">
      <div class="brand" aria-label="Doodle Life">
        <span class="brand-mark" aria-hidden="true"></span>
        <span>Doodle Life <small>부탁을 그리는 정원</small></span>
      </div>
      <div>
        <span class="ai-run-pill" id="aiRunPill" data-provider="mock" data-state="busy">
          <strong id="providerLabel">연결 확인 중</strong><span>3-STAGE</span>
        </span>
        <span class="day-pill" id="roundLabel">정원 준비 중</span>
      </div>
    </header>

    <main class="request-first-layout">
      <section class="garden-stage request-garden" id="gardenStage" aria-label="부탁을 관찰하는 종이 정원">
        <div class="garden-sky" aria-hidden="true"><span class="sun"></span><span class="cloud"></span><span class="cloud"></span></div>
        <span class="hill" aria-hidden="true"></span><span class="hill" aria-hidden="true"></span>
        <div class="workshop" aria-hidden="true"></div><div class="pond" aria-hidden="true"></div>
        <div class="world-prop-layer" id="propLayer"></div>
        <div class="ai-resident-layer" id="residentLayer" role="group" aria-label="서로 다른 모습의 정원 주민"></div>
        <div class="lifeform-layer" id="lifeformLayer" aria-live="polite"></div>

        <article class="quest-focus-card" id="questFocus" hidden>
          <p class="eyebrow">이번 관찰의 초점</p>
          <h2 id="questTitle"></h2>
          <blockquote id="questDialogue"></blockquote>
          <p id="questProblem"></p>
          <div class="quest-focus-actions">
            <button id="otherResidentsButton" type="button">다른 주민 보기</button>
            <button id="openCanvasButton" class="primary-action" type="button">그림으로 답하기 ✎</button>
          </div>
        </article>

        <article class="garden-status-card" aria-live="polite">
          <span id="stageKicker">WORLD & LOCKED QUESTS</span>
          <strong id="stageTitle">정원과 부탁을 먼저 잠그고 있어요</strong>
          <p id="stageBody">그림을 보기 전에 문제와 허용 해법을 고정합니다.</p>
        </article>
      </section>

      <aside class="request-side-panel">
        <section>
          <div class="side-heading">
            <div><p class="eyebrow">REQUESTS</p><h2>주민의 부탁</h2></div>
            <span id="questCount">0 / 3</span>
          </div>
          <div class="quest-list" id="questList"></div>
        </section>

        <section class="clue-notebook" id="clueNotebook" hidden>
          <div class="side-heading"><div><p class="eyebrow">OBSERVE</p><h2>관찰 노트</h2></div><span>두 채널 이상</span></div>
          <dl>
            <dt>말</dt><dd id="dialogueClues"></dd>
            <dt>몸짓</dt><dd id="behaviorClues"></dd>
            <dt>환경</dt><dd id="environmentClues"></dd>
            <dt>초점</dt><dd id="focusClue"></dd>
          </dl>
        </section>

        <section class="record-notebook">
          <div class="side-heading"><div><p class="eyebrow">RELATIONSHIP</p><h2>관계 기록</h2></div><span id="recordCount">0장</span></div>
          <ol id="recordList"><li class="empty-state">한 부탁의 결과가 이곳에 남습니다.</li></ol>
        </section>
      </aside>
    </main>

    <footer class="request-footer">
      <div class="stage-progress" aria-label="현재 라운드 단계">
        <span data-step="observe">1 관찰</span><span data-step="draw">2 그림</span>
        <span data-step="read">3 판독</span><span data-step="result">4 생명화</span>
      </div>
      <div class="ai-metrics" aria-label="AI 실행 비용">
        <span id="callMetric">0 calls</span><span id="tokenMetric">0 tokens</span><span id="latencyMetric">0 ms wall</span>
      </div>
      <details class="trace-details">
        <summary>단계별 호출</summary>
        <div class="trace-panel"><div class="role-metrics" id="roleMetrics">아직 완료된 호출이 없어요.</div></div>
      </details>
    </footer>

    <div class="drawing-workspace" id="drawingWorkspace" hidden>
      <section class="drawing-clue-rail">
        <button id="closeCanvasButton" class="icon-close" type="button" aria-label="그리기 닫기">×</button>
        <p class="eyebrow">LOCKED REQUEST</p>
        <h2 id="canvasQuestTitle"></h2>
        <blockquote id="canvasDialogue"></blockquote>
        <ul id="canvasClues"></ul>
        <p class="silhouette-promise">이 모습 그대로 정원에 태어납니다.</p>
      </section>
      <section class="drawing-surface-panel" aria-labelledby="canvasHeading">
        <header>
          <div><p class="eyebrow">DRAW YOUR ANSWER</p><h2 id="canvasHeading">형태로 해결 방법을 보여 주세요</h2></div>
          <span id="readLimitLabel">첫 판독 전</span>
        </header>
        <div class="canvas-wrap request-canvas-wrap" id="canvasWrap">
          <canvas class="draw-canvas" id="drawCanvas" width="720" height="480" tabindex="0" aria-label="부탁의 답을 그리는 캔버스"></canvas>
          <canvas class="evidence-canvas" id="evidenceCanvas" width="720" height="480" aria-hidden="true"></canvas>
          <p class="canvas-hint" id="canvasHint">정답 사물을 베끼지 않아도 괜찮아요.<br />필요한 기능이 눈에 보이도록 그려 보세요.</p>
          <div class="reading-progress" id="readingProgress" hidden>
            <span></span><strong>그림에서 보이는 근거를 찾는 중</strong>
            <small>현재 부탁의 정답은 VLM에 전달되지 않았습니다.</small>
          </div>
        </div>
        <div class="drawing-toolbar">
          <div class="tool-group" id="widthTools" aria-label="붓 굵기">
            <button class="tool-button" type="button" data-width="4" aria-label="가는 붓">·</button>
            <button class="tool-button is-selected" type="button" data-width="9" aria-label="보통 붓">●</button>
            <button class="tool-button" type="button" data-width="16" aria-label="굵은 붓">⬤</button>
          </div>
          <div class="tool-group" id="colorTools" aria-label="색상"></div>
          <div class="tool-group">
            <button class="tool-button" id="eraserButton" type="button">지우개</button>
            <button class="tool-button" id="undoButton" type="button" disabled>되돌리기</button>
            <button class="tool-button" id="clearButton" type="button">전체 지우기</button>
          </div>
          <button class="primary-action submit-doodle" id="readButton" type="button" disabled>태어나기 · 그림 읽기</button>
        </div>
        <section class="reading-review-panel" id="readingReview" hidden>
          <div>
            <p class="eyebrow">VISIBLE EVIDENCE</p>
            <h3 id="doodleName"></h3>
            <p id="doodleEssence"></p>
          </div>
          <ol class="evidence-list" id="evidenceList"></ol>
          <div class="uncertainty-note" id="uncertaintyNote" hidden></div>
          <div class="reading-actions">
            <button id="rereadButton" type="button">덧그려 한 번 더 읽기</button>
            <button id="resolveButton" class="primary-action" type="button">이 모습으로 부탁에 답하기</button>
          </div>
        </section>
      </section>
    </div>

    <div class="toast" id="toast" role="status" aria-live="polite"></div>
  </div>
`

const api = new DoodleLifeApi()
const sessionId = `session-${crypto.randomUUID()}`
const residentRenderers = new Map<string, RenderedCharacter>()
const actorElements = new Map<string, HTMLElement>()
const propElements = new Map<string, HTMLElement>()
const lifeforms = new Map<string, DoodleLifeform>()
const traceHistory: TraceSummary[] = []
const roleMetrics = new Map<string, RoleMetric>()
let health: DoodleLifeHealthResponse | null = null
let world: DoodleWorld | null = null
let quests: QuestPublicView[] = []
let activeQuest: QuestPublicView | null = null
let phase: AppPhase = 'booting'
let readIndex: 0 | 1 = 0
let currentDrawing: DrawingSnapshot | null = null
let lastReadImageHash: string | null = null
let currentReading: DoodleReadingResponse | null = null
let roundController = new AbortController()
let toastTimer = 0
let totalCalls = 0
let totalTokens = 0
let totalWallMs = 0

const canvas = byId<HTMLCanvasElement>('drawCanvas')
const evidenceOverlay = new EvidenceOverlay(byId<HTMLCanvasElement>('evidenceCanvas'))
const drawingBoard = new DrawingBoard(canvas, (hasInk, canUndo) => {
  byId<HTMLButtonElement>('readButton').disabled = !hasInk || phase === 'reading'
  byId<HTMLButtonElement>('undoButton').disabled = !canUndo || phase === 'reading'
  byId<HTMLElement>('canvasWrap').classList.toggle('has-drawing', hasInk)
})

wireControls()
installColors()
setPhase('booting')
void bootstrap()

async function bootstrap(): Promise<void> {
  setStage('WORLD & LOCKED QUESTS', '정원과 부탁을 먼저 잠그고 있어요', '플레이어의 그림을 보기 전에 문제와 복수 해법을 검증합니다.')
  roundController.abort()
  roundController = new AbortController()
  try {
    health = await api.health(roundController.signal)
    updateProvider()
    const response = await api.createSession({ sessionId, locale: 'ko-KR' }, roundController.signal)
    recordTrace(response.trace)
    world = response.world
    quests = [...response.quests]
    renderWorld()
    renderQuestList()
    byId<HTMLElement>('roundLabel').textContent = '부탁 0 / 3'
    setStage(
      response.usedFallback ? 'SAFE FALLBACK GARDEN' : 'REQUESTS LOCKED',
      `${world.title}에 세 가지 부탁이 있어요`,
      '주민의 말과 몸짓, 환경 흔적을 보고 한 부탁을 골라 보세요.',
    )
    setPhase('garden')
    if (response.usedFallback) showToast('월드 생성이 늦어 검증된 소소 정원으로 이어갑니다.')
  } catch (error) {
    handleError(error, '정원을 시작하지 못했습니다. 개발 서버를 확인해 주세요.')
  }
}

function wireControls(): void {
  byId<HTMLButtonElement>('otherResidentsButton').addEventListener('click', () => {
    byId<HTMLElement>('questFocus').hidden = true
    setPhase('garden')
    setStage('OBSERVE', '다른 주민의 반복 행동도 살펴보세요', '주민을 누르는 동안에는 모델을 호출하지 않습니다.')
  })
  byId<HTMLButtonElement>('openCanvasButton').addEventListener('click', openDrawing)
  byId<HTMLButtonElement>('closeCanvasButton').addEventListener('click', closeDrawing)
  byId<HTMLButtonElement>('clearButton').addEventListener('click', () => {
    drawingBoard.clear()
    evidenceOverlay.clear()
    currentReading = null
    byId<HTMLElement>('readingReview').hidden = true
  })
  byId<HTMLButtonElement>('undoButton').addEventListener('click', () => {
    drawingBoard.undo()
    evidenceOverlay.clear()
  })
  byId<HTMLButtonElement>('eraserButton').addEventListener('click', () => {
    drawingBoard.setTool('eraser')
    byId<HTMLButtonElement>('eraserButton').classList.add('is-selected')
    for (const color of document.querySelectorAll('#colorTools button')) color.setAttribute('aria-pressed', 'false')
  })
  byId<HTMLElement>('widthTools').addEventListener('click', (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button[data-width]')
    if (!button) return
    drawingBoard.setWidth(Number(button.dataset.width))
    for (const sibling of button.parentElement?.querySelectorAll('button') ?? []) {
      sibling.classList.toggle('is-selected', sibling === button)
    }
  })
  byId<HTMLButtonElement>('readButton').addEventListener('click', () => void readDoodle())
  byId<HTMLButtonElement>('rereadButton').addEventListener('click', () => {
    if (!currentReading?.canReread) return
    evidenceOverlay.clear()
    byId<HTMLElement>('readingReview').hidden = true
    byId<HTMLElement>('canvasHint').hidden = true
    readIndex = 1
    setPhase('drawing')
    byId<HTMLElement>('readLimitLabel').textContent = '덧그리기 후 마지막 판독'
    byId<HTMLButtonElement>('readButton').textContent = '한 번 더 읽기'
    canvas.focus()
  })
  byId<HTMLButtonElement>('resolveButton').addEventListener('click', () => void resolveAndAnimate())
}

function installColors(): void {
  const colors = [
    ['#382f2a', '먹색'], ['#df796b', '산호색'], ['#efb848', '햇빛색'],
    ['#65946a', '잎색'], ['#5e9fa9', '연못색'], ['#796a9b', '보라색'],
  ] as const
  const host = byId<HTMLElement>('colorTools')
  for (const [color, label] of colors) {
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'color-dot'
    button.style.setProperty('--dot', color)
    button.setAttribute('aria-label', label)
    button.setAttribute('aria-pressed', color === '#382f2a' ? 'true' : 'false')
    button.addEventListener('click', () => {
      drawingBoard.setColor(color)
      byId<HTMLButtonElement>('eraserButton').classList.remove('is-selected')
      for (const sibling of host.querySelectorAll('button')) {
        sibling.setAttribute('aria-pressed', String(sibling === button))
      }
    })
    host.append(button)
  }
}

function renderWorld(): void {
  if (!world) return
  for (const renderer of residentRenderers.values()) renderer.destroy()
  residentRenderers.clear()
  actorElements.clear()
  propElements.clear()
  byId<HTMLElement>('residentLayer').replaceChildren()
  byId<HTMLElement>('propLayer').replaceChildren()

  for (const prop of world.props) {
    const element = document.createElement('div')
    element.className = 'world-prop'
    element.dataset.kind = prop.kind
    element.dataset.propId = prop.id
    element.style.left = `${prop.position.x}%`
    element.style.top = `${prop.position.y}%`
    const symbol = document.createElement('span')
    symbol.textContent = propSymbol(prop.kind)
    const label = document.createElement('small')
    label.textContent = prop.label
    element.title = `${prop.label}: ${prop.state}. ${prop.visibleClue}`
    element.append(symbol, label)
    byId<HTMLElement>('propLayer').append(element)
    propElements.set(prop.id, element)
  }

  for (const resident of world.residents) {
    const slot = document.createElement('div')
    slot.className = 'ai-actor-slot request-resident-slot'
    slot.dataset.actorId = resident.id
    slot.dataset.silhouette = resident.silhouetteFamily
    slot.dataset.support = resident.supportMode
    slot.style.setProperty('--actor-x', `${resident.homePosition.x}%`)
    slot.style.setProperty('--actor-y', `${Math.max(6, (100 - resident.homePosition.y) * 0.7)}%`)
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'ai-actor-hitbox'
    button.setAttribute('aria-label', `${resident.name}, ${resident.epithet}. 부탁 관찰하기`)
    const renderer = renderCharacterDesign(resident.design, {
      label: `${resident.name}, ${resident.epithet}`,
    })
    const label = document.createElement('span')
    label.className = 'ai-actor-label'
    label.textContent = resident.name
    const behavior = document.createElement('span')
    behavior.className = 'resident-behavior-mark'
    behavior.textContent = '…'
    button.append(renderer.element, label, behavior)
    button.addEventListener('click', () => void chooseResident(resident))
    slot.append(button)
    byId<HTMLElement>('residentLayer').append(slot)
    residentRenderers.set(resident.id, renderer)
    actorElements.set(resident.id, button)
  }
}

function renderQuestList(): void {
  const host = byId<HTMLElement>('questList')
  host.replaceChildren()
  const resolvedCount = quests.filter((quest) => quest.status === 'resolved').length
  byId<HTMLElement>('questCount').textContent = `${resolvedCount} / 3`
  for (const quest of quests) {
    const owner = residentById(quest.ownerNpcId)
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'quest-list-item'
    button.dataset.status = quest.status
    button.dataset.active = String(activeQuest?.questId === quest.questId)
    const meta = document.createElement('span')
    meta.textContent = quest.status === 'resolved' ? '기록됨' : '관찰 가능'
    const title = document.createElement('strong')
    title.textContent = `${owner?.name ?? '주민'} · ${quest.title}`
    const focus = document.createElement('small')
    focus.textContent = quest.clues.observationFocus
    button.append(meta, title, focus)
    button.addEventListener('click', () => owner && void chooseResident(owner))
    host.append(button)
  }
}

async function chooseResident(resident: DoodleResident): Promise<void> {
  if (!world || phase === 'reading' || phase === 'resolving' || phase === 'animating') return
  const quest = quests.find((candidate) => candidate.ownerNpcId === resident.id)
  if (!quest) return
  try {
    const response = await api.selectQuest({
      sessionId,
      questId: quest.questId,
      expectedRevision: world.revision,
    }, roundController.signal)
    quests = quests.map((candidate) => ({
      ...candidate,
      status: candidate.questId === response.quest.questId
        ? 'active'
        : candidate.status === 'resolved' ? 'resolved' : 'available',
    }))
    activeQuest = response.quest
    readIndex = 0
    currentDrawing = null
    currentReading = null
    drawingBoard.clear()
    evidenceOverlay.clear()
    showObservation(resident, response.quest)
    renderQuestList()
    for (const [id, element] of actorElements) element.classList.toggle('is-quest-owner', id === resident.id)
  } catch (error) {
    handleError(error, '부탁을 선택하지 못했습니다.')
  }
}

function showObservation(resident: DoodleResident, quest: QuestPublicView): void {
  byId<HTMLElement>('questTitle').textContent = `${resident.name}의 부탁 · ${quest.title}`
  byId<HTMLElement>('questDialogue').textContent = `“${quest.clues.dialogue.join(' ')}”`
  byId<HTMLElement>('questProblem').textContent = quest.problemState
  byId<HTMLElement>('dialogueClues').textContent = quest.clues.dialogue.join(' ')
  byId<HTMLElement>('behaviorClues').textContent = quest.clues.behavior.join(' ')
  byId<HTMLElement>('environmentClues').textContent = quest.clues.environment.join(' ')
  byId<HTMLElement>('focusClue').textContent = `${quest.clues.observationFocus} · ${quest.clues.visibleTiming ?? quest.clues.visibleTarget}`
  byId<HTMLElement>('questFocus').hidden = false
  byId<HTMLElement>('clueNotebook').hidden = false
  byId<HTMLElement>('roundLabel').textContent = `부탁 ${quests.findIndex((candidate) => candidate.questId === quest.questId) + 1} / 3`
  setStage('OBSERVE', resident.repeatedBehavior, `관찰 초점: ${quest.clues.observationFocus}`)
  setPhase('observing')
}

function openDrawing(): void {
  if (!activeQuest || !world) return
  byId<HTMLElement>('canvasQuestTitle').textContent = activeQuest.title
  byId<HTMLElement>('canvasDialogue').textContent = `“${activeQuest.clues.dialogue.join(' ')}”`
  const list = byId<HTMLUListElement>('canvasClues')
  list.replaceChildren()
  for (const clue of [
    `몸짓 · ${activeQuest.clues.behavior[0] ?? ''}`,
    `환경 · ${activeQuest.clues.environment[0] ?? ''}`,
    `초점 · ${activeQuest.clues.observationFocus}`,
  ]) {
    const item = document.createElement('li')
    item.textContent = clue
    list.append(item)
  }
  byId<HTMLElement>('drawingWorkspace').hidden = false
  byId<HTMLElement>('readingReview').hidden = true
  byId<HTMLElement>('readingProgress').hidden = true
  byId<HTMLElement>('canvasHint').hidden = drawingBoard.hasInk
  byId<HTMLElement>('readLimitLabel').textContent = readIndex === 0 ? '최초 판독 1회' : '마지막 재판독'
  byId<HTMLButtonElement>('readButton').textContent = readIndex === 0 ? '태어나기 · 그림 읽기' : '한 번 더 읽기'
  setPhase('drawing')
  canvas.focus()
}

function closeDrawing(): void {
  if (phase === 'reading' || phase === 'resolving') return
  byId<HTMLElement>('drawingWorkspace').hidden = true
  evidenceOverlay.clear()
  setPhase(activeQuest ? 'observing' : 'garden')
}

async function readDoodle(): Promise<void> {
  if (!activeQuest || !world || !drawingBoard.hasInk || phase === 'reading') return
  const drawing = drawingBoard.snapshot()
  const imageHash = await sha256(drawing.sprite.dataUrl)
  if (readIndex === 1 && imageHash === lastReadImageHash) {
    showToast('덧그린 뒤 마지막 판독을 사용해 주세요.')
    return
  }
  currentDrawing = drawing
  setPhase('reading')
  byId<HTMLElement>('readingProgress').hidden = false
  byId<HTMLButtonElement>('readButton').disabled = true
  byId<HTMLButtonElement>('undoButton').disabled = true
  try {
    const metrics = drawing.strokes.some((stroke) => stroke.tool === 'eraser')
      ? null
      : measureDrawing(drawing.strokes)
    const response = await api.readDoodle({
      requestId: createId('reading'),
      sessionId,
      readIndex,
      image: {
        dataUrl: drawing.sprite.dataUrl,
        mimeType: 'image/png',
        width: drawing.sprite.width,
        height: drawing.sprite.height,
        sha256: imageHash,
      },
      drawingMetrics: metrics,
    }, roundController.signal)
    recordTrace(response.trace)
    lastReadImageHash = imageHash
    currentReading = response
    evidenceOverlay.render(response.reading, drawing)
    renderReading(response)
    setPhase('reading-review')
    if (response.usedFallback) {
      showToast('VLM 판독이 끝나지 않아 확실한 기능을 발명하지 않고 여백으로 남겼습니다.')
    }
  } catch (error) {
    handleError(error, '그림을 읽지 못했습니다.')
    setPhase('drawing')
  } finally {
    byId<HTMLElement>('readingProgress').hidden = true
  }
}

function renderReading(response: DoodleReadingResponse): void {
  byId<HTMLElement>('doodleName').textContent = response.reading.name
  byId<HTMLElement>('doodleEssence').textContent = response.reading.essence
  const list = byId<HTMLOListElement>('evidenceList')
  list.replaceChildren()
  for (const [index, feature] of response.reading.visibleFeatures.entries()) {
    const item = document.createElement('li')
    const number = document.createElement('span')
    number.textContent = String(index + 1)
    const copy = document.createElement('div')
    const title = document.createElement('strong')
    title.textContent = feature.label
    const evidence = document.createElement('small')
    evidence.textContent = feature.evidence
    copy.append(title, evidence)
    item.append(number, copy)
    list.append(item)
  }
  const uncertainty = byId<HTMLElement>('uncertaintyNote')
  uncertainty.hidden = response.reading.uncertainties.length === 0
  uncertainty.textContent = response.reading.uncertainties.length > 0
    ? `잘 모르겠는 부분 · ${response.reading.uncertainties.map((item) => item.reason).join(' ')}`
    : ''
  byId<HTMLButtonElement>('rereadButton').hidden = !response.canReread
  byId<HTMLElement>('readingReview').hidden = false
}

async function resolveAndAnimate(): Promise<void> {
  if (!world || !activeQuest || !currentReading || !currentDrawing || phase === 'resolving') return
  setPhase('resolving')
  byId<HTMLButtonElement>('resolveButton').disabled = true
  try {
    const response = await api.resolveQuest({
      requestId: createId('resolve'),
      sessionId,
      expectedRevision: world.revision,
    }, roundController.signal)
    recordTrace(response.trace)
    world = response.nextWorld
    if (response.result.questResolved) {
      quests = quests.map((quest) => quest.questId === response.result.questId
        ? { ...quest, status: 'resolved' }
        : quest)
    }
    renderQuestList()
    byId<HTMLElement>('drawingWorkspace').hidden = true
    setPhase('animating')
    showLocalResult(response.result)
    const lifeform = placeLifeform(response.result.creatureId, currentDrawing, response.reading)
    const reactionPromise = requestReactions(response.result)
    await lifeform.playArrival(response.result.verdict)
    setPhase('recorded')
    renderRecords()
    void reactionPromise
  } catch (error) {
    handleError(error, '로컬 판정을 끝내지 못했습니다.')
    setPhase('reading-review')
  } finally {
    byId<HTMLButtonElement>('resolveButton').disabled = false
  }
}

function showLocalResult(result: QuestResolutionView): void {
  setStage(
    result.verdict === 'full' ? 'FULL SOLUTION' : result.verdict.toUpperCase(),
    result.title,
    result.summary,
  )
  byId<HTMLElement>('roundLabel').textContent = result.questResolved ? '부탁 해결 · 기록됨' : '부탁은 남음 · 생명은 기록됨'
  for (const effect of result.appliedEffects) {
    if (effect.kind !== 'prop-state') continue
    const element = propElements.get(effect.targetId)
    if (!element) continue
    element.dataset.changed = 'true'
    element.title = effect.description
  }
}

function placeLifeform(
  creatureId: string,
  drawing: DrawingSnapshot,
  reading: DoodleReadingResponse['reading'],
): DoodleLifeform {
  lifeforms.get(creatureId)?.destroy()
  const slot = document.createElement('div')
  slot.className = 'lifeform-slot'
  slot.dataset.actorId = creatureId
  const lifeform = createDoodleLifeform(drawing.sprite, reading)
  const label = document.createElement('span')
  label.textContent = reading.name
  slot.append(lifeform.element, label)
  byId<HTMLElement>('lifeformLayer').append(slot)
  lifeforms.set(creatureId, lifeform)
  actorElements.set(creatureId, slot)
  return lifeform
}

async function requestReactions(result: QuestResolutionView): Promise<void> {
  if (!world) return
  setStage('LOCAL RESULT · REACTIONS PENDING', result.title, '판정과 기본 생명화는 끝났습니다. 두 주민의 짧은 반응만 병렬로 이어 붙입니다.')
  let encounter: ResolvedEncounter
  try {
    const response: EncounterReactionResponse = await api.createReactions({
      requestId: createId('reaction'),
      sessionId,
      expectedRevision: world.revision,
    }, roundController.signal)
    recordTrace(response.trace)
    encounter = response.encounter
  } catch (error) {
    encounter = clientFallbackEncounter(result)
    showToast('반응 연결이 늦어 로컬 기본 대사로 장면을 마칩니다.')
    console.error(error)
  }
  await playResolvedEncounter(encounter, {
    actors: actorElements,
    props: propElements,
    stage: byId<HTMLElement>('gardenStage'),
    signal: roundController.signal,
    onStatus: (message) => {
      byId<HTMLElement>('stageBody').textContent = message
    },
  })
  setStage('RELATIONSHIP RECORDED', encounter.title, encounter.statusText)
}

function clientFallbackEncounter(result: QuestResolutionView): ResolvedEncounter {
  const ownerId = activeQuest?.ownerNpcId ?? 'npc_soso'
  const observerId = quests.find((quest) => quest.questId !== activeQuest?.questId)?.ownerNpcId ?? 'npc_dari'
  return {
    sceneId: `scene-local-${Date.now()}`,
    title: result.title,
    statusText: result.summary,
    participantIds: [ownerId, observerId, result.creatureId],
    commands: [
      { kind: 'look', actorId: ownerId, targetId: result.creatureId },
      { kind: 'speak', actorId: ownerId, text: result.questResolved ? '네 모습이 만든 길을 기억할게.' : '이 움직임도 정원에 남겨 둘게.' },
      { kind: 'gesture', actorId: ownerId, gesture: 'nod' },
    ],
    discardedCommandCount: 0,
    fallbackActorIds: [ownerId, observerId],
  }
}

function renderRecords(): void {
  if (!world) return
  const host = byId<HTMLOListElement>('recordList')
  host.replaceChildren()
  byId<HTMLElement>('recordCount').textContent = `${world.records.length}장`
  if (world.records.length === 0) {
    const item = document.createElement('li')
    item.className = 'empty-state'
    item.textContent = '한 부탁의 결과가 이곳에 남습니다.'
    host.append(item)
    return
  }
  for (const record of [...world.records].reverse()) {
    const item = document.createElement('li')
    item.className = 'relationship-card'
    const verdict = document.createElement('span')
    verdict.textContent = verdictLabel(record.verdict)
    const title = document.createElement('strong')
    title.textContent = record.title
    const body = document.createElement('small')
    body.textContent = record.summary
    item.append(verdict, title, body)
    host.append(item)
  }
}

function setPhase(next: AppPhase): void {
  phase = next
  document.body.dataset.phase = next
  const step = next === 'garden' || next === 'observing' || next === 'booting'
    ? 'observe'
    : next === 'drawing'
      ? 'draw'
      : next === 'reading' || next === 'reading-review' || next === 'resolving'
        ? 'read'
        : 'result'
  for (const marker of document.querySelectorAll<HTMLElement>('[data-step]')) {
    marker.dataset.active = String(marker.dataset.step === step)
  }
}

function setStage(kicker: string, title: string, body: string): void {
  byId<HTMLElement>('stageKicker').textContent = kicker
  byId<HTMLElement>('stageTitle').textContent = title
  byId<HTMLElement>('stageBody').textContent = body
}

function updateProvider(): void {
  if (!health) return
  const label = health.provider === 'openai'
    ? 'LIVE OPENAI API'
    : 'DETERMINISTIC MOCK'
  byId<HTMLElement>('providerLabel').textContent = label
  byId<HTMLElement>('aiRunPill').dataset.provider = health.provider
}

function recordTrace(trace: TraceSummary): void {
  traceHistory.push(trace)
  for (const call of trace.calls) {
    const previous = roleMetrics.get(call.role) ?? { calls: 0, tokens: 0, latencyMs: 0 }
    roleMetrics.set(call.role, {
      calls: previous.calls + 1,
      tokens: previous.tokens + call.usage.totalTokens,
      latencyMs: previous.latencyMs + call.latencyMs,
    })
  }
  totalCalls += trace.calls.length
  totalTokens += trace.usage.totalTokens
  totalWallMs += trace.wallClockMs
  byId<HTMLElement>('callMetric').textContent = `${totalCalls} calls`
  byId<HTMLElement>('tokenMetric').textContent = `${totalTokens.toLocaleString('ko-KR')} tokens`
  byId<HTMLElement>('latencyMetric').textContent = `${totalWallMs.toLocaleString('ko-KR')} ms wall`
  const host = byId<HTMLElement>('roleMetrics')
  host.replaceChildren()
  for (const [role, metric] of roleMetrics) {
    const row = document.createElement('span')
    const name = document.createElement('b')
    name.textContent = role
    const value = document.createElement('small')
    value.textContent = `${metric.calls}회 · ${metric.tokens.toLocaleString('ko-KR')} tok · ${metric.latencyMs.toLocaleString('ko-KR')} ms`
    row.append(name, value)
    host.append(row)
  }
  if (roleMetrics.size === 0) host.textContent = '로컬 단계에서는 모델을 호출하지 않습니다.'
}

function handleError(error: unknown, fallback: string): void {
  if (error instanceof DOMException && error.name === 'AbortError') return
  const message = error instanceof GardenApiError
    ? error.status === 0
      ? 'API 서버에 연결할 수 없습니다. `npm run dev`로 웹과 서버를 함께 실행해 주세요.'
      : error.message
    : error instanceof Error ? error.message : fallback
  byId<HTMLElement>('aiRunPill').dataset.state = 'error'
  showToast(message || fallback)
  console.error(error)
}

function showToast(message: string): void {
  window.clearTimeout(toastTimer)
  const toast = byId<HTMLElement>('toast')
  toast.textContent = message
  toast.classList.add('is-visible')
  toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 5200)
}

function residentById(id: string): DoodleResident | undefined {
  return world?.residents.find((resident) => resident.id === id)
}

function propSymbol(kind: DoodleWorld['props'][number]['kind']): string {
  const symbols: Record<typeof kind, string> = {
    chime: '♬', bell: '♪', ribbon: '〰', bridge: '⌒', lamp: '✦',
    planter: '♧', pond: '≈', shelter: '⌂', marker: '·',
  }
  return symbols[kind]
}

function verdictLabel(verdict: QuestResolutionView['verdict']): string {
  return verdict === 'full' ? '완전 해결'
    : verdict === 'success' ? '해결'
      : verdict === 'partial' ? '부분 해결' : '뜻밖의 결과'
}

function createId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

function byId<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id)
  if (!element) throw new Error(`#${id} not found`)
  return element as T
}

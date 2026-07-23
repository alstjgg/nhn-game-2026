import './style.css'
import './generative-style.css'

import { measureDrawing } from './analyzer.ts'
import { AutonomyModeValidator, type AutonomyMode, type CharacterBible, type TraceSummary, type WorldState } from './ai/contracts.ts'
import { GardenApi, GardenApiError, type HealthResponse } from './ai/client.ts'
import { DrawingBoard, type DrawingSnapshot } from './drawing-board.ts'
import { renderCharacterDesign, type RenderedCharacter } from './render/character-renderer.ts'
import { playGeneratedScene } from './render/scene-player.ts'
import { WorldStore } from './world/store.ts'

interface Observation {
  readonly id: string
  readonly title: string
  readonly body: string
  readonly tags: readonly string[]
}

interface DoodleSpriteRecord {
  readonly url: string
  readonly width: number
  readonly height: number
}

interface RoleMetric {
  calls: number
  tokens: number
  latencyMs: number
}

const MAX_RESIDENTS = 12

const app = document.querySelector<HTMLDivElement>('#app')
if (!app) throw new Error('#app root not found')

app.innerHTML = `
  <div class="game-shell">
    <header class="topbar">
      <div class="brand" aria-label="Doodle Life">
        <span class="brand-mark" aria-hidden="true"></span>
        <span>Doodle Life <small>GENERATIVE GARDEN</small></span>
      </div>
      <div>
        <span class="ai-run-pill" id="aiRunPill" data-provider="mock" data-state="busy">
          <strong id="providerLabel">AI 연결 중</strong><span id="modeLabel">FULL MAX</span>
        </span>
        <span class="day-pill"><span id="revisionLabel">세계 생성 중</span></span>
      </div>
    </header>

    <main class="garden-layout">
      <section class="garden-stage" id="gardenStage" aria-label="AI 주민들이 살아 움직이는 종이 정원">
        <div class="garden-sky" aria-hidden="true">
          <span class="sun"></span><span class="cloud"></span><span class="cloud"></span>
        </div>
        <span class="hill" aria-hidden="true"></span><span class="hill" aria-hidden="true"></span>
        <div class="workshop" aria-label="작은 공방"></div>
        <div class="swing" aria-label="나무 그네"></div>
        <div class="pond" aria-label="연잎이 뜬 연못"></div>
        <span class="flower" aria-hidden="true"></span><span class="flower" aria-hidden="true"></span>

        <article class="world-pulse-card" id="worldPulse" aria-live="polite">
          <p class="eyebrow">WORLD AUTHOR</p>
          <h2 id="pulseTitle">새 정원을 상상하고 있어요</h2>
          <p id="pulseBody">NPC의 성격과 모습, 관계를 AI가 새로 만드는 중입니다.</p>
        </article>
        <div class="ai-resident-layer" id="residentLayer" role="group" aria-label="AI가 만든 정원 주민"></div>
        <div class="interaction-guide"><strong>상호작용</strong><span>주민을 누르면 그 캐릭터를 중심으로 새 장면을 만듭니다.</span></div>
        <div class="ai-turn-log" id="turnLog" aria-live="polite">월드 작가가 첫 주민들을 만들고 있어요.</div>
      </section>

      <aside class="side-panel" aria-label="생성된 세계 기록">
        <h2 class="panel-heading">살아 있는 기록 <span id="cardCount">0장</span></h2>
        <ol class="observation-list" id="observationList"></ol>
      </aside>
    </main>

    <nav class="bottom-nav" aria-label="정원 행동">
      <button class="nav-button" id="resetButton" type="button">↻ <span>새 세계</span></button>
      <button class="draw-button" id="drawButton" type="button" disabled>✎ 새 친구 그리기</button>
      <div class="ai-metrics" id="aiMetrics" aria-label="AI 실행 비용">
        <span id="callMetric">0 calls</span><span id="tokenMetric">0 tokens</span><span id="latencyMetric">0 ms</span>
      </div>
      <details class="trace-details">
        <summary>역할별 비용</summary>
        <div class="trace-panel">
          <strong>이번 세션 모델 역할</strong>
          <div class="role-metrics" id="roleMetrics">아직 완료된 호출이 없어요.</div>
          <button id="exportTraceButton" type="button" disabled>trace JSON 내보내기</button>
        </div>
      </details>
    </nav>

    <div class="toast" id="toast" role="status" aria-live="polite"></div>

    <div class="intro-overlay" id="introOverlay" hidden>
      <section class="intro-card" role="dialog" aria-modal="true" aria-labelledby="introTitle">
        <div class="result-seal" aria-hidden="true">✦</div>
        <h1 id="introTitle">Doodle Life <span>완전 생성형 데모</span></h1>
        <p>이 정원에는 정해진 부탁이나 정답표가 없습니다.<br />AI가 주민의 모습·욕구·관계를 만들고, 새 낙서가 태어날 때마다 모두의 다음 행동을 다시 생각합니다.<br /><strong>정원에서 주민을 누르면 그 주민을 중심으로 즉석 상호작용이 시작됩니다.</strong></p>
        <button id="startButton" type="button">생성된 정원 만나기</button>
      </section>
    </div>

    <div class="drawer-backdrop" id="drawingBackdrop" hidden>
      <section class="drawing-drawer generative-drawer" role="dialog" aria-modal="true" aria-labelledby="drawingTitle">
        <header class="drawer-header">
          <div>
            <h2 id="drawingTitle">새 생명을 자유롭게 그려 주세요</h2>
            <small>정답 도형은 없습니다. VLM이 보이는 단서만으로 열린 특성을 추론합니다.</small>
          </div>
          <button id="closeDrawingButton" type="button" aria-label="그리기 닫기">×</button>
        </header>
        <div class="garden-peek" aria-live="polite">
          <span class="peek-resident" aria-hidden="true"><i></i></span>
          <p><strong>주민들은 결과를 미리 알지 못해요.</strong><span>새 친구가 도착한 뒤 각자의 기억과 욕구로 반응을 계산합니다.</span></p>
          <small>VLM → NPC MINDS</small>
        </div>
        <div class="canvas-wrap" id="canvasWrap">
          <canvas class="draw-canvas" id="drawCanvas" width="720" height="480" aria-label="새 캐릭터 그리기"></canvas>
          <p class="canvas-hint">선, 면, 날개, 꼬리, 표정…<br />어떤 생명이어도 괜찮아요.</p>
        </div>
        <div class="tool-row">
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
          <button id="cancelDrawingButton" type="button">나중에</button>
          <button id="analyzeButton" type="button" disabled>AI에게 보여 주기</button>
        </div>
      </section>
    </div>

    <div class="birth-review-backdrop" id="birthBackdrop" hidden>
      <section class="birth-review" role="dialog" aria-modal="true" aria-labelledby="birthName">
        <div class="birth-preview"><img id="birthImage" alt="내가 그린 새 캐릭터" /></div>
        <div class="birth-copy">
          <p class="eyebrow">DOODLE VLM READING</p>
          <h2 id="birthName">이름을 짓는 중</h2>
          <p id="birthEssence"></p>
          <div class="trait-pills" id="birthTraits"></div>
          <dl>
            <dt>눈에 보인 단서</dt><dd id="birthEvidence"></dd>
            <dt>움직임</dt><dd id="birthMotion"></dd>
            <dt>원하는 것</dt><dd id="birthDrive"></dd>
            <dt>조심할 것</dt><dd id="birthBoundary"></dd>
          </dl>
          <div class="birth-actions">
            <button id="redrawButton" type="button">다시 그리기</button>
            <button id="introduceButton" type="button">이 모습 그대로 등장</button>
          </div>
        </div>
      </section>
    </div>

    <div class="ai-busy-veil" id="busyVeil" hidden>
      <section class="ai-busy-card" role="status" aria-live="polite">
        <div class="ai-busy-orbit" aria-hidden="true"></div>
        <strong id="busyTitle">AI가 생각하고 있어요</strong>
        <p id="busyBody">조금만 기다려 주세요.</p>
      </section>
    </div>
  </div>
`

const autonomy = resolveAutonomy()
const api = new GardenApi()
const renderedCharacters = new Map<string, RenderedCharacter>()
const actorElements = new Map<string, HTMLButtonElement>()
const doodleSprites = new Map<string, DoodleSpriteRecord>()
const observations: Observation[] = []
const traceHistory: TraceSummary[] = []
const roleMetrics = new Map<string, RoleMetric>()
let worldStore: WorldStore | null = null
let health: HealthResponse | null = null
let pendingBirth: { readonly character: CharacterBible; readonly drawing: DrawingSnapshot } | null = null
let activeController: AbortController | null = null
let isBusy = false
let totalCalls = 0
let totalTokens = 0
let totalLatencyMs = 0
let toastTimer = 0

const gardenStage = byId<HTMLElement>('gardenStage')
const residentLayer = byId<HTMLDivElement>('residentLayer')
const pulseTitle = byId<HTMLElement>('pulseTitle')
const pulseBody = byId<HTMLElement>('pulseBody')
const turnLog = byId<HTMLElement>('turnLog')
const revisionLabel = byId<HTMLElement>('revisionLabel')
const providerLabel = byId<HTMLElement>('providerLabel')
const modeLabel = byId<HTMLElement>('modeLabel')
const aiRunPill = byId<HTMLElement>('aiRunPill')
const observationList = byId<HTMLOListElement>('observationList')
const cardCount = byId<HTMLElement>('cardCount')
const drawButton = byId<HTMLButtonElement>('drawButton')
const resetButton = byId<HTMLButtonElement>('resetButton')
const introOverlay = byId<HTMLDivElement>('introOverlay')
const drawingBackdrop = byId<HTMLDivElement>('drawingBackdrop')
const birthBackdrop = byId<HTMLDivElement>('birthBackdrop')
const busyVeil = byId<HTMLDivElement>('busyVeil')
const busyTitle = byId<HTMLElement>('busyTitle')
const busyBody = byId<HTMLElement>('busyBody')
const toast = byId<HTMLElement>('toast')
const analyzeButton = byId<HTMLButtonElement>('analyzeButton')
const canvasWrap = byId<HTMLElement>('canvasWrap')
const canvas = byId<HTMLCanvasElement>('drawCanvas')
const drawingBoard = new DrawingBoard(canvas, (hasInk) => {
  analyzeButton.disabled = !hasInk || isBusy
  canvasWrap.classList.toggle('has-drawing', hasInk)
})

modeLabel.textContent = autonomy.toUpperCase().replace('-', ' ')
wireControls()
void bootstrapWorld(true)

function wireControls(): void {
  byId<HTMLButtonElement>('startButton').addEventListener('click', () => {
    introOverlay.hidden = true
    drawButton.focus()
  })
  drawButton.addEventListener('click', openDrawing)
  resetButton.addEventListener('click', () => void bootstrapWorld(false))
  byId<HTMLButtonElement>('closeDrawingButton').addEventListener('click', closeDrawing)
  byId<HTMLButtonElement>('cancelDrawingButton').addEventListener('click', closeDrawing)
  byId<HTMLButtonElement>('clearButton').addEventListener('click', () => drawingBoard.clear())
  byId<HTMLButtonElement>('exportTraceButton').addEventListener('click', exportTrace)
  byId<HTMLButtonElement>('eraserButton').addEventListener('click', (event) => {
    drawingBoard.setTool('eraser')
    for (const button of document.querySelectorAll<HTMLElement>('#colorTools button')) button.setAttribute('aria-pressed', 'false')
    const target = event.currentTarget as HTMLButtonElement
    target.setAttribute('aria-pressed', 'true')
  })
  byId<HTMLElement>('widthTools').addEventListener('click', (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button[data-width]')
    if (!button) return
    drawingBoard.setWidth(Number(button.dataset.width))
    for (const sibling of button.parentElement?.querySelectorAll('button') ?? []) sibling.classList.toggle('is-selected', sibling === button)
  })
  analyzeButton.addEventListener('click', () => void analyzeDoodle())
  byId<HTMLButtonElement>('redrawButton').addEventListener('click', () => {
    birthBackdrop.hidden = true
    openDrawing()
  })
  byId<HTMLButtonElement>('introduceButton').addEventListener('click', () => void introduceDoodle())
  installColorTools()
}

function installColorTools(): void {
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
      byId<HTMLButtonElement>('eraserButton').setAttribute('aria-pressed', 'false')
      for (const sibling of host.querySelectorAll('button')) sibling.setAttribute('aria-pressed', String(sibling === button))
    })
    host.append(button)
  }
}

async function bootstrapWorld(showIntro: boolean): Promise<void> {
  if (isBusy) activeController?.abort()
  activeController = new AbortController()
  setBusy(true, '월드 작가가 정원을 만드는 중', 'NPC의 외형, 열린 특성, 욕구와 관계를 한 번에 생성하고 있어요.')
  resetButton.disabled = true
  drawButton.disabled = true
  try {
    health = await api.health(activeController.signal)
    updateProviderHealth()
    const response = await api.bootstrap({
      sessionId: createId('session'),
      locale: 'ko-KR',
      autonomy,
    }, activeController.signal)
    recordTrace(response.trace)
    worldStore = new WorldStore(response.world)
    doodleSprites.clear()
    observations.splice(0)
    renderWorld(response.world)
    pulseTitle.textContent = response.world.title
    pulseBody.textContent = response.world.premise
    turnLog.textContent = `${response.world.residents.length}명의 주민이 도착했어요. 주민을 눌러 반응을 만들거나 새 친구를 그려 보세요.`
    addWorldObservation(response.world)
    if (showIntro) introOverlay.hidden = false
  } catch (error) {
    handleError(error, 'AI 정원을 시작하지 못했어요. `npm run dev`로 웹과 프록시를 함께 실행해 주세요.')
  } finally {
    setBusy(false)
    resetButton.disabled = false
    drawButton.disabled = !canAddResident()
  }
}

function renderWorld(world: WorldState): void {
  for (const rendered of renderedCharacters.values()) rendered.destroy()
  renderedCharacters.clear()
  actorElements.clear()
  residentLayer.replaceChildren()

  for (const resident of world.residents) {
    const slot = document.createElement('div')
    slot.className = 'ai-actor-slot'
    slot.dataset.actorId = resident.id
    slot.dataset.player = String(resident.kind === 'player')
    slot.style.setProperty('--actor-x', `${clamp(resident.homePosition.x * 100, 9, 91)}%`)
    slot.style.setProperty('--actor-y', `${clamp((1 - resident.homePosition.y) * 56 + 8, 10, 48)}%`)

    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'ai-actor-hitbox'
    button.setAttribute('aria-label', `${resident.name}, ${resident.epithet}. 만나기`)
    button.title = `${resident.name}을(를) 눌러 새 상호작용 만들기`
    const sprite = doodleSprites.get(resident.id)
    const rendered = renderCharacterDesign(resident.design, {
      label: `${resident.name}, ${resident.epithet}`,
      doodleSprite: sprite ? { ...sprite, alt: resident.name } : undefined,
    })
    const label = document.createElement('span')
    label.className = 'ai-actor-label'
    label.textContent = resident.name
    button.append(rendered.element, label)
    slot.append(button)
    residentLayer.append(slot)
    renderedCharacters.set(resident.id, rendered)
    actorElements.set(resident.id, button)
    button.addEventListener('click', () => {
      if (isBusy) return
      showResidentProfile(resident.id)
      void runWorldTurn('resident-focused', resident.id, `사용자가 ${resident.name}의 지금 행동을 조용히 지켜보았다.`)
    })
  }
  revisionLabel.textContent = `세계 r${world.revision}`
}

function showResidentProfile(residentId: string): void {
  const resident = worldStore?.snapshot().residents.find((candidate) => candidate.id === residentId)
  if (!resident) return
  pulseTitle.textContent = `${resident.name} · ${resident.epithet}`
  pulseBody.textContent = `${resident.motion.idle} 지금은 ${resident.currentGoal}`
  addObservation({
    id: `profile-${resident.id}-${Date.now()}`,
    title: `${resident.name}을(를) 바라봄`,
    body: resident.essence,
    tags: resident.traits.slice(0, 3).map((trait) => trait.label),
  })
}

function addWorldObservation(world: WorldState): void {
  addObservation({
    id: `world-${world.id}-${world.revision}`,
    title: world.title,
    body: world.locationDescription,
    tags: world.residents.slice(0, 4).map((resident) => resident.name),
  })
}

function addObservation(observation: Observation): void {
  observations.unshift(observation)
  if (observations.length > 18) observations.length = 18
  renderObservations()
}

function renderObservations(): void {
  observationList.replaceChildren()
  cardCount.textContent = `${observations.length}장`
  if (observations.length === 0) {
    const empty = document.createElement('li')
    empty.className = 'empty-state'
    empty.textContent = '주민을 만나면 AI가 만든 기억이 이곳에 쌓입니다.'
    observationList.append(empty)
    return
  }
  for (const observation of observations) {
    const item = document.createElement('li')
    item.className = 'ai-observation-card'
    const title = document.createElement('strong')
    title.textContent = observation.title
    const body = document.createElement('small')
    body.textContent = observation.body
    const tags = document.createElement('div')
    tags.className = 'trait-pills'
    for (const value of observation.tags) {
      const tag = document.createElement('span')
      tag.textContent = value
      tags.append(tag)
    }
    item.append(title, body, tags)
    observationList.append(item)
  }
}

function openDrawing(): void {
  if (!worldStore || isBusy) return
  if (!canAddResident()) {
    showToast(`이 데모 정원에는 최대 ${MAX_RESIDENTS}명까지 함께 살 수 있어요. 새 세계에서 다시 그려 주세요.`)
    return
  }
  birthBackdrop.hidden = true
  drawingBackdrop.hidden = false
  analyzeButton.disabled = !drawingBoard.hasInk
  canvas.focus()
}

function closeDrawing(): void {
  drawingBackdrop.hidden = true
  drawButton.focus()
}

async function analyzeDoodle(): Promise<void> {
  if (!worldStore || !drawingBoard.hasInk || isBusy) return
  if (!canAddResident()) {
    showToast(`정원이 ${MAX_RESIDENTS}명으로 가득 찼어요. 유료 분석을 시작하지 않았습니다.`)
    return
  }
  const drawing = drawingBoard.snapshot()
  const expectedRevision = worldStore.revision
  drawingBackdrop.hidden = true
  setBusy(true, 'VLM이 낙서를 생명으로 읽는 중', '모양을 정답에 대조하지 않고, 보이는 단서에서 성향·욕구·경계를 추론하고 있어요.')
  activeController = new AbortController()
  try {
    const metrics = measureDrawing(drawing.strokes)
    const metricsWithoutErasedGeometry = drawing.strokes.some((stroke) => stroke.tool === 'eraser') ? null : metrics
    const response = await api.doodleBirth({
      requestId: createId('birth'),
      expectedRevision,
      autonomy,
      image: {
        dataUrl: drawing.sprite.dataUrl,
        mimeType: 'image/png',
        width: drawing.sprite.width,
        height: drawing.sprite.height,
        sha256: await sha256(drawing.sprite.dataUrl),
      },
      drawingMetrics: metricsWithoutErasedGeometry,
    }, activeController.signal)
    if (worldStore.revision !== response.expectedRevision) throw new Error('그리는 동안 세계가 달라졌어요. 다시 시도해 주세요.')
    recordTrace(response.trace)
    pendingBirth = { character: response.character, drawing }
    showBirthReview(response.character, drawing, response.evidenceSummary, response.uncertainties)
  } catch (error) {
    handleError(error, '낙서를 읽지 못했어요. 잠시 후 다시 보여 주세요.')
    drawingBackdrop.hidden = false
  } finally {
    setBusy(false)
  }
}

function showBirthReview(
  character: CharacterBible,
  drawing: DrawingSnapshot,
  evidence: string,
  uncertainties: readonly string[],
): void {
  byId<HTMLImageElement>('birthImage').src = drawing.sprite.dataUrl
  byId<HTMLElement>('birthName').textContent = character.name
  byId<HTMLElement>('birthEssence').textContent = character.essence
  byId<HTMLElement>('birthEvidence').textContent = [evidence, ...uncertainties].filter(Boolean).join(' · ')
  byId<HTMLElement>('birthMotion').textContent = character.motion.approach
  byId<HTMLElement>('birthDrive').textContent = character.drives.join(' · ')
  byId<HTMLElement>('birthBoundary').textContent = character.boundaries.join(' · ')
  const traits = byId<HTMLElement>('birthTraits')
  traits.replaceChildren()
  for (const trait of character.traits) {
    const chip = document.createElement('span')
    chip.textContent = trait.label
    chip.title = `${trait.visibleEvidence} — ${trait.behavioralEffect}`
    traits.append(chip)
  }
  birthBackdrop.hidden = false
}

async function introduceDoodle(): Promise<void> {
  if (!worldStore || !pendingBirth || isBusy) return
  if (!canAddResident()) {
    showToast(`정원이 ${MAX_RESIDENTS}명으로 가득 차 새 친구를 등장시킬 수 없어요.`)
    return
  }
  const { character, drawing } = pendingBirth
  const before = worldStore.revision
  try {
    doodleSprites.set(character.id, {
      url: drawing.sprite.dataUrl,
      width: drawing.sprite.width,
      height: drawing.sprite.height,
    })
    const world = worldStore.addResident(before, character)
    pendingBirth = null
    birthBackdrop.hidden = true
    renderWorld(world)
    drawingBoard.clear()
    addObservation({
      id: `birth-${character.id}`,
      title: `${character.name}, 정원에 태어남`,
      body: character.essence,
      tags: character.traits.slice(0, 4).map((trait) => trait.label),
    })
    await runWorldTurn(
      'newcomer-arrived',
      character.id,
      `${character.name}이(가) 사용자가 그린 모습 그대로 처음 정원에 나타났다. 주민들은 각자의 관점으로 이 낯선 존재를 처음 본다.`,
    )
  } catch (error) {
    handleError(error, '새 친구를 정원에 등장시키지 못했어요.')
  }
}

async function runWorldTurn(
  kind: 'newcomer-arrived' | 'resident-focused' | 'idle-pulse',
  actorId: string,
  detail: string,
): Promise<void> {
  if (!worldStore || isBusy) return
  const expectedRevision = worldStore.revision
  setBusy(true, '주민들이 각자 생각하는 중', 'NPC별 마음을 병렬로 묻고, 월드 디렉터가 충돌과 호응을 하나의 새 장면으로 엮고 있어요.')
  markThinking(actorId, true)
  activeController = new AbortController()
  try {
    const response = await api.worldTurn({
      requestId: createId('turn'),
      expectedRevision,
      autonomy,
      world: worldStore.snapshot(),
      signal: { kind, actorId, detail },
    }, activeController.signal)
    recordTrace(response.trace)
    if (response.baseRevision !== expectedRevision) throw new Error('AI가 다른 세계 revision을 기준으로 답했어요.')
    setBusy(false)
    setScenePlaying(true)
    turnLog.textContent = response.scene.title
    pulseTitle.textContent = response.scene.title
    pulseBody.textContent = response.scene.summary
    await playGeneratedScene(response.scene, {
      stage: gardenStage,
      actors: actorElements,
      signal: activeController.signal,
      onStatus: (message) => { turnLog.textContent = message },
    })
    const nextWorld = worldStore.replaceFromServer(expectedRevision, response.nextWorld)
    renderWorld(nextWorld)
    addObservation({
      id: response.scene.id,
      title: response.scene.observationTitle,
      body: response.scene.observationBody,
      tags: response.scene.participantIds
        .map((id) => nextWorld.residents.find((resident) => resident.id === id)?.name)
        .filter((name): name is string => Boolean(name)),
    })
    turnLog.textContent = response.scene.summary
  } catch (error) {
    handleError(error, '주민들의 다음 장면을 만들지 못했어요.')
  } finally {
    markThinking(actorId, false)
    setScenePlaying(false)
    setBusy(false)
  }
}

function markThinking(actorId: string, thinking: boolean): void {
  const actor = actorElements.get(actorId)
  if (!actor) return
  actor.querySelector('.ai-thinking-mark')?.remove()
  if (!thinking) return
  const mark = document.createElement('span')
  mark.className = 'ai-thinking-mark'
  mark.textContent = '생각 중…'
  actor.append(mark)
}

function setBusy(busy: boolean, title = '', body = ''): void {
  isBusy = busy
  busyVeil.hidden = !busy
  aiRunPill.dataset.state = busy ? 'busy' : 'ready'
  if (busy) {
    busyTitle.textContent = title
    busyBody.textContent = body
  }
  drawButton.disabled = busy || !canAddResident()
  resetButton.disabled = busy
  analyzeButton.disabled = busy || !drawingBoard.hasInk
  for (const actor of actorElements.values()) {
    actor.dataset.busy = String(busy)
    actor.disabled = busy
  }
}

function setScenePlaying(playing: boolean): void {
  isBusy = playing
  busyVeil.hidden = true
  aiRunPill.dataset.state = playing ? 'busy' : 'ready'
  drawButton.disabled = playing || !canAddResident()
  resetButton.disabled = playing
  analyzeButton.disabled = playing || !drawingBoard.hasInk
  for (const actor of actorElements.values()) {
    actor.dataset.busy = String(playing)
    actor.disabled = playing
  }
}

function updateProviderHealth(): void {
  if (!health) return
  providerLabel.textContent = health.provider === 'openai'
    ? 'LIVE OPENAI'
    : 'DETERMINISTIC MOCK'
  aiRunPill.dataset.provider = health.provider
  aiRunPill.title = health.provider === 'openai'
    ? '서버 프록시를 통해 실제 OpenAI 모델 호출 중'
    : '모델 키나 API 공급자 설정이 없어 계약이 같은 mock 모델로 실행 중'
}

function recordTrace(trace: TraceSummary): void {
  modeLabel.textContent = trace.mode.toUpperCase().replaceAll('-', ' ')
  if (trace.mode === 'off') {
    providerLabel.textContent = 'NO MODEL CALLS'
    aiRunPill.dataset.provider = 'mock'
    aiRunPill.title = 'off 모드: 같은 생성형 UI를 로컬 결정론적 제어군으로 실행 중'
  } else {
    updateProviderHealth()
  }
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
  totalLatencyMs += trace.wallClockMs ?? trace.totalLatencyMs
  byId<HTMLElement>('callMetric').textContent = `${totalCalls} calls`
  byId<HTMLElement>('tokenMetric').textContent = `${totalTokens.toLocaleString('ko-KR')} tokens`
  byId<HTMLElement>('latencyMetric').textContent = `${totalLatencyMs.toLocaleString('ko-KR')} ms wall`
  renderRoleMetrics()
}

function renderRoleMetrics(): void {
  const host = byId<HTMLElement>('roleMetrics')
  host.replaceChildren()
  for (const [role, metric] of [...roleMetrics.entries()].sort(([left], [right]) => left.localeCompare(right))) {
    const row = document.createElement('span')
    const label = document.createElement('b')
    const value = document.createElement('small')
    label.textContent = role
    value.textContent = `${metric.calls}회 · ${metric.tokens.toLocaleString('ko-KR')} tok · ${metric.latencyMs.toLocaleString('ko-KR')} ms`
    row.append(label, value)
    host.append(row)
  }
  if (roleMetrics.size === 0) host.textContent = '이 모드에서는 모델을 호출하지 않았어요.'
  byId<HTMLButtonElement>('exportTraceButton').disabled = traceHistory.length === 0
}

function exportTrace(): void {
  if (traceHistory.length === 0) return
  const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), traces: traceHistory }, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `doodle-life-trace-${Date.now()}.json`
  anchor.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}

function handleError(error: unknown, fallback: string): void {
  if (error instanceof DOMException && error.name === 'AbortError') return
  if (error instanceof GardenApiError && error.trace) recordTrace(error.trace)
  const message = error instanceof GardenApiError
    ? error.status === 0
      ? 'AI 프록시에 연결할 수 없어요. 이 데모 폴더에서 `npm run dev`를 실행해 주세요.'
      : error.message
    : error instanceof Error ? error.message : fallback
  aiRunPill.dataset.state = 'error'
  showToast(message || fallback)
  console.error(error)
}

function showToast(message: string): void {
  window.clearTimeout(toastTimer)
  toast.textContent = message
  toast.classList.add('is-visible')
  toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 5200)
}

function resolveAutonomy(): AutonomyMode {
  const requested = new URLSearchParams(window.location.search).get('autonomy') ?? 'full-max'
  const parsed = AutonomyModeValidator.safeParse(requested)
  return parsed.success ? parsed.data : 'full-max'
}

function canAddResident(): boolean {
  return worldStore !== null && worldStore.snapshot().residents.length < MAX_RESIDENTS
}

function createId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`
}

async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

function byId<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id)
  if (!element) throw new Error(`#${id} not found`)
  return element as T
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

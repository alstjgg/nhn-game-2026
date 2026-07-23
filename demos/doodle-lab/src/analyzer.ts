import {
  ANALYZER_COPY,
  ANALYZER_TUNING,
  SHOWCASE_CONFIG,
  type TraitAxis,
  type TraitSet,
} from './data.ts'

export interface StrokePoint {
  readonly x: number
  readonly y: number
  readonly t: number
}

export type StrokeTool = 'brush' | 'pen' | 'eraser'

export interface RecordedStroke {
  readonly points: readonly StrokePoint[]
  readonly color: string
  readonly width: number
  readonly tool: StrokeTool
  readonly source?: 'template' | 'player'
}

export interface DrawingMetrics {
  readonly strokeCount: number
  readonly pointCount: number
  readonly totalLength: number
  readonly horizontalRatio: number
  readonly verticalRatio: number
  readonly overlap: number
  readonly density: number
  readonly centerX: number
  readonly centerY: number
  readonly extent: number
  readonly rhythm: number
  readonly colorCount: number
  readonly warmColorRatio: number
  readonly coolColorRatio: number
  readonly brightColorRatio: number
  readonly dominantColor: string
}

export interface InterpretationCard {
  readonly id: string
  readonly title: string
  readonly subtitle: string
  readonly reason: string
  readonly traits: readonly string[]
  readonly traitSet: TraitSet
  readonly evidenceStrokeIndices: readonly number[]
  readonly accentColor: string
}

export type InterpretationCards = readonly [InterpretationCard, InterpretationCard, InterpretationCard]

interface StrokeFeature {
  readonly index: number
  readonly length: number
  readonly horizontal: number
  readonly vertical: number
  readonly centerX: number
  readonly centerY: number
  readonly warm: number
  readonly cool: number
  readonly bright: number
  overlap: number
}

interface Measurement {
  readonly metrics: DrawingMetrics
  readonly features: readonly StrokeFeature[]
}

const AXES: readonly TraitAxis[] = ['movement', 'skill', 'temperament', 'place', 'habit']

/** Returns exactly three request-independent readings derived only from player ink. */
export function analyzeDrawing(strokes: readonly RecordedStroke[]): InterpretationCards {
  const measurement = measure(strokes)
  const candidates = inferCandidates(measurement.metrics)
  const fingerprint = drawingFingerprint(strokes)
  const raw: InterpretationCards = [
    makeCard(candidates[0], ['movement', 'place'], 0, fingerprint, measurement),
    makeCard(candidates[1], ['skill', 'temperament'], 1, fingerprint, measurement),
    makeCard(candidates[2], ['habit', 'movement'], 2, fingerprint, measurement),
  ]
  const shift = fingerprint % 3
  if (shift === 1) return [raw[1], raw[2], raw[0]]
  if (shift === 2) return [raw[2], raw[0], raw[1]]
  return raw
}

export function measureDrawing(strokes: readonly RecordedStroke[]): DrawingMetrics {
  return measure(strokes).metrics
}

function measure(strokes: readonly RecordedStroke[]): Measurement {
  const drawable = strokes
    .map((stroke, index) => ({ stroke, index }))
    .filter(({ stroke }) => stroke.tool !== 'eraser' && stroke.source !== 'template' && stroke.points.length > 0)
  const cellOwners = new Map<string, Set<number>>()
  const featureCells = new Map<number, Set<string>>()
  const features: StrokeFeature[] = []
  const colorWeights = new Map<string, number>()
  let minX = Number.POSITIVE_INFINITY
  let minY = Number.POSITIVE_INFINITY
  let maxX = Number.NEGATIVE_INFINITY
  let maxY = Number.NEGATIVE_INFINITY
  let totalLength = 0
  let horizontalLength = 0
  let verticalLength = 0
  let pointCount = 0

  for (const { stroke, index } of drawable) {
    let length = 0
    let horizontal = 0
    let vertical = 0
    let sumX = 0
    let sumY = 0
    const cells = new Set<string>()
    const color = parseColor(stroke.color)
    for (let pointIndex = 0; pointIndex < stroke.points.length; pointIndex += 1) {
      const point = stroke.points[pointIndex]
      if (!point) continue
      minX = Math.min(minX, point.x)
      minY = Math.min(minY, point.y)
      maxX = Math.max(maxX, point.x)
      maxY = Math.max(maxY, point.y)
      sumX += point.x
      sumY += point.y
      pointCount += 1
      const previous = stroke.points[pointIndex - 1]
      if (!previous) {
        registerCell(point.x, point.y, index, cells, cellOwners)
        continue
      }
      const dx = point.x - previous.x
      const dy = point.y - previous.y
      const segmentLength = Math.hypot(dx, dy)
      length += segmentLength
      const directionWeight = Math.abs(dx) + Math.abs(dy)
      if (directionWeight > 0) {
        horizontal += segmentLength * Math.abs(dx) / directionWeight
        vertical += segmentLength * Math.abs(dy) / directionWeight
      }
      const steps = Math.max(1, Math.ceil(segmentLength / ANALYZER_TUNING.samplingStep))
      for (let step = 0; step <= steps; step += 1) {
        const ratio = step / steps
        registerCell(previous.x + dx * ratio, previous.y + dy * ratio, index, cells, cellOwners)
      }
    }
    const safeLength = Math.max(length, stroke.width)
    const count = Math.max(1, stroke.points.length)
    totalLength += length
    horizontalLength += horizontal
    verticalLength += vertical
    colorWeights.set(stroke.color, (colorWeights.get(stroke.color) ?? 0) + safeLength * stroke.width)
    featureCells.set(index, cells)
    features.push({
      index,
      length: safeLength,
      horizontal: length > 0 ? horizontal / length : 0,
      vertical: length > 0 ? vertical / length : 0,
      centerX: clamp(sumX / count / SHOWCASE_CONFIG.canvas.width),
      centerY: clamp(sumY / count / SHOWCASE_CONFIG.canvas.height),
      warm: color.warm,
      cool: color.cool,
      bright: color.bright,
      overlap: 0,
    })
  }

  const overlapCells = new Set([...cellOwners].filter(([, owners]) => owners.size > 1).map(([cell]) => cell))
  for (const feature of features) {
    const cells = featureCells.get(feature.index) ?? new Set<string>()
    feature.overlap = cells.size === 0 ? 0 : [...cells].filter((cell) => overlapCells.has(cell)).length / cells.size
  }
  const width = Number.isFinite(minX) ? Math.max(1, maxX - minX) : 0
  const height = Number.isFinite(minY) ? Math.max(1, maxY - minY) : 0
  const averageWidth = drawable.length === 0
    ? 0
    : drawable.reduce((sum, item) => sum + item.stroke.width, 0) / drawable.length
  const lengths = features.map((feature) => feature.length)
  const averageLength = lengths.length === 0 ? 0 : lengths.reduce((sum, length) => sum + length, 0) / lengths.length
  const deviation = lengths.length === 0
    ? 0
    : Math.sqrt(lengths.reduce((sum, length) => sum + (length - averageLength) ** 2, 0) / lengths.length)
  const weightedColor = [...colorWeights].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0]
    ?? SHOWCASE_CONFIG.palette[0]
  const featureWeight = features.reduce((sum, feature) => sum + feature.length, 0) || 1
  const weighted = (key: 'warm' | 'cool' | 'bright'): number => features.reduce(
    (sum, feature) => sum + feature[key] * feature.length,
    0,
  ) / featureWeight

  return {
    features,
    metrics: {
      strokeCount: features.length,
      pointCount,
      totalLength,
      horizontalRatio: totalLength > 0 ? horizontalLength / totalLength : 0,
      verticalRatio: totalLength > 0 ? verticalLength / totalLength : 0,
      overlap: cellOwners.size === 0 ? 0 : overlapCells.size / cellOwners.size,
      density: clamp((totalLength * Math.max(1, averageWidth)) / Math.max(1, width * height) / ANALYZER_TUNING.densityReference),
      centerX: Number.isFinite(minX) ? clamp((minX + width / 2) / SHOWCASE_CONFIG.canvas.width) : 0.5,
      centerY: Number.isFinite(minY) ? clamp((minY + height / 2) / SHOWCASE_CONFIG.canvas.height) : 0.5,
      extent: clamp(Math.sqrt((width / SHOWCASE_CONFIG.canvas.width) * (height / SHOWCASE_CONFIG.canvas.height)) * 2),
      rhythm: averageLength > 0 ? clamp(1 - deviation / averageLength) : 0,
      colorCount: colorWeights.size,
      warmColorRatio: weighted('warm'),
      coolColorRatio: weighted('cool'),
      brightColorRatio: weighted('bright'),
      dominantColor: weightedColor,
    },
  }
}

function inferCandidates(m: DrawingMetrics): InterpretationCardsTraits {
  const long = clamp(m.totalLength / ANALYZER_TUNING.longStrokeReference)
  const many = clamp(m.strokeCount / ANALYZER_TUNING.manyStrokesReference)
  const colors = clamp(m.colorCount / ANALYZER_TUNING.colorVarietyReference)
  const upper = 1 - m.centerY
  const lower = m.centerY
  const centered = 1 - Math.abs(m.centerX - 0.5) * 2
  const movement = rankValues(['걷기', '구르기', '활공', '헤엄치기'], [m.horizontalRatio + lower * 0.35, m.density + m.overlap, m.verticalRatio + upper * 0.55, m.horizontalRatio + m.coolColorRatio + (1 - m.density) * 0.2])
  const skill = rankValues(['탐색', '운반', '수리', '교감'], [m.extent + many * 0.4, centered + (1 - m.extent) * 0.4, m.overlap + m.density, colors + m.rhythm * 0.45])
  const temperament = rankValues(['호기심', '다정함', '꼼꼼함', '느긋함'], [m.extent + Math.abs(m.centerX - 0.5), m.warmColorRatio + centered * 0.55, m.density + many * 0.45, (1 - m.density) + long * 0.35])
  const place = rankValues(['정원', '연못', '공방', '광장'], [lower + (1 - m.coolColorRatio) * 0.25, m.coolColorRatio + m.horizontalRatio, m.overlap + m.density, centered + colors * 0.35])
  const habit = rankValues(['발광', '노래', '통통 튀기', '달라붙기'], [m.brightColorRatio + m.warmColorRatio, m.rhythm + m.horizontalRatio * 0.35, m.verticalRatio + many * 0.55, m.overlap + m.density * 0.65])
  return [
    traitSetAt(movement, skill, temperament, place, habit, [0, 0, 0, 0, 0]),
    traitSetAt(movement, skill, temperament, place, habit, [1, 1, 0, 1, 0]),
    traitSetAt(movement, skill, temperament, place, habit, [0, 2, 1, 0, 1]),
  ]
}

type InterpretationCardsTraits = readonly [TraitSet, TraitSet, TraitSet]

function traitSetAt(
  movement: readonly TraitSet['movement'][],
  skill: readonly TraitSet['skill'][],
  temperament: readonly TraitSet['temperament'][],
  place: readonly TraitSet['place'][],
  habit: readonly TraitSet['habit'][],
  indices: readonly [number, number, number, number, number],
): TraitSet {
  return {
    movement: rankedAt(movement, indices[0]),
    skill: rankedAt(skill, indices[1]),
    temperament: rankedAt(temperament, indices[2]),
    place: rankedAt(place, indices[3]),
    habit: rankedAt(habit, indices[4]),
  }
}

function makeCard(
  traitSet: TraitSet,
  basis: readonly TraitAxis[],
  variant: number,
  fingerprint: number,
  measurement: Measurement,
): InterpretationCard {
  const uniqueBasis = [...new Set(basis)].slice(0, 2)
  const evidenceStrokeIndices = selectEvidence(measurement.features, uniqueBasis, traitSet)
  const titleIndex = (fingerprint + variant * 3) % ANALYZER_COPY.cardTitles.length
  const summaryIndex = (fingerprint + variant * 2) % ANALYZER_COPY.cardSummaries.length
  return {
    id: `reading-${fingerprint.toString(36)}-${variant + 1}`,
    title: ANALYZER_COPY.cardTitles[titleIndex] ?? '종이 위의 꼬물이',
    subtitle: ANALYZER_COPY.cardSummaries[summaryIndex] ?? '',
    reason: measurement.features.length === 0
      ? ANALYZER_COPY.emptyReason
      : metricReason(variant, measurement.metrics, traitSet),
    traits: AXES.map((axis) => traitSet[axis]),
    traitSet,
    evidenceStrokeIndices,
    accentColor: measurement.metrics.dominantColor,
  }
}

function selectEvidence(
  features: readonly StrokeFeature[],
  axes: readonly TraitAxis[],
  traits: TraitSet,
): readonly number[] {
  return [...features]
    .sort((a, b) => evidenceScore(b, axes, traits) - evidenceScore(a, axes, traits) || a.index - b.index)
    .slice(0, ANALYZER_TUNING.evidenceStrokeLimit)
    .map((feature) => feature.index)
}

function evidenceScore(feature: StrokeFeature, axes: readonly TraitAxis[], traits: TraitSet): number {
  let score = feature.length / ANALYZER_TUNING.longStrokeReference
  for (const axis of axes) {
    if (axis === 'movement') score += traits.movement === '활공' ? feature.vertical + (1 - feature.centerY) : feature.horizontal + feature.cool * 0.4
    if (axis === 'skill') score += traits.skill === '수리' ? feature.overlap * 2 : Math.abs(feature.centerX - 0.5) + 0.4
    if (axis === 'temperament') score += traits.temperament === '다정함' ? feature.warm + (1 - Math.abs(feature.centerX - 0.5)) : feature.overlap + 0.35
    if (axis === 'place') score += traits.place === '연못' ? feature.cool + feature.horizontal : feature.centerY + 0.35
    if (axis === 'habit') score += traits.habit === '발광' ? feature.bright + feature.warm : feature.overlap + feature.vertical * 0.5
  }
  return score
}

function metricReason(variant: number, metrics: DrawingMetrics, traits: TraitSet): string {
  if (variant === 0) {
    const orientation = metrics.horizontalRatio >= metrics.verticalRatio ? '가로' : '세로'
    const ratio = Math.max(metrics.horizontalRatio, metrics.verticalRatio)
    const position = metrics.centerY < 0.42 ? '위쪽' : metrics.centerY > 0.58 ? '아래쪽' : '가운데'
    return `전체 선 길이 중 ${percent(ratio)}가 ${orientation} 방향이고 중심은 화면 ${position}에 있어요. 이 흐름을 ${traits.movement} 움직임과 ${traits.place}에 익숙한 모습으로 읽었어요.`
  }
  if (variant === 1) {
    const overlapText = metrics.overlap > 0
      ? `서로 포개진 칸이 ${percent(metrics.overlap)}`
      : '서로 포개진 칸은 없고'
    return `${overlapText}, 선의 채움 정도는 ${percent(metrics.density)}예요. 이 구조를 ${traits.skill} 솜씨와 ${traits.temperament} 기질의 단서로 읽었어요.`
  }
  const colorFact = metrics.brightColorRatio >= 0.55
    ? `밝은 색 비중이 ${percent(metrics.brightColorRatio)}`
    : metrics.warmColorRatio >= 0.35
      ? `따뜻한 색 비중이 ${percent(metrics.warmColorRatio)}`
      : `사용한 색은 ${metrics.colorCount}가지`
  return `${colorFact}이고, 획 길이의 반복 유사도는 ${percent(metrics.rhythm)}예요. 이 박자를 ${traits.habit} 버릇과 ${traits.movement} 움직임으로 읽었어요.`
}

function registerCell(x: number, y: number, index: number, local: Set<string>, global: Map<string, Set<number>>): void {
  const size = ANALYZER_TUNING.overlapGridSize
  const key = `${Math.floor(x / size)}:${Math.floor(y / size)}`
  local.add(key)
  const owners = global.get(key) ?? new Set<number>()
  owners.add(index)
  global.set(key, owners)
}

function rankValues<const Value extends string>(values: readonly Value[], scores: readonly number[]): readonly Value[] {
  return values
    .map((value, index) => ({ value, index, score: scores[index] ?? 0 }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((item) => item.value)
}

function rankedAt<Value>(values: readonly Value[], index: number): Value {
  const value = values[index] ?? values[0]
  if (value === undefined) throw new Error('Trait ranking cannot be empty')
  return value
}

function parseColor(value: string): { readonly warm: number; readonly cool: number; readonly bright: number } {
  const hex = value.trim().replace('#', '')
  const expanded = hex.length === 3 ? [...hex].map((part) => `${part}${part}`).join('') : hex
  const numeric = /^[0-9a-f]{6}$/i.test(expanded) ? Number.parseInt(expanded, 16) : 0x666666
  const red = ((numeric >> 16) & 255) / 255
  const green = ((numeric >> 8) & 255) / 255
  const blue = (numeric & 255) / 255
  const luminance = red * 0.2126 + green * 0.7152 + blue * 0.0722
  return {
    warm: clamp((red - blue + ANALYZER_TUNING.warmColorWeight) / (1 + ANALYZER_TUNING.warmColorWeight)),
    cool: clamp((blue + green * 0.35 - red + ANALYZER_TUNING.coolColorWeight) / (1 + ANALYZER_TUNING.coolColorWeight)),
    bright: luminance >= ANALYZER_TUNING.brightLuminance ? luminance : luminance * 0.45,
  }
}

function drawingFingerprint(strokes: readonly RecordedStroke[]): number {
  let hash = 2166136261
  for (const stroke of strokes) {
    if (stroke.tool === 'eraser' || stroke.source === 'template' || stroke.points.length === 0) continue
    hash ^= stroke.points.length + Math.round(stroke.width * 10)
    hash = Math.imul(hash, 16777619)
    for (const point of stroke.points) {
      hash ^= Math.round(point.x) * 31 + Math.round(point.y) * 17
      hash = Math.imul(hash, 16777619)
    }
    for (let index = 0; index < stroke.color.length; index += 1) {
      hash ^= stroke.color.charCodeAt(index)
      hash = Math.imul(hash, 16777619)
    }
  }
  return hash >>> 0
}

function percent(value: number): string {
  return `${Math.round(clamp(value) * 100)}%`
}

function clamp(value: number): number {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0))
}

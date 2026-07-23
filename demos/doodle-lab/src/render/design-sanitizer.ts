import type { CharacterDesignSpec } from '../ai/contracts.ts'

export type SanitizedShapeKind = 'ellipse' | 'polygon' | 'line' | 'path'

export interface SanitizedPoint {
  readonly x: number
  readonly y: number
}

interface SanitizedShapeBase {
  readonly kind: SanitizedShapeKind
  readonly fill: string
  readonly stroke: string
  readonly strokeWidth: number
  readonly opacity: number
}

export interface SanitizedEllipse extends SanitizedShapeBase {
  readonly kind: 'ellipse'
  readonly cx: number
  readonly cy: number
  readonly rx: number
  readonly ry: number
}

export interface SanitizedPolygon extends SanitizedShapeBase {
  readonly kind: 'polygon'
  readonly points: readonly SanitizedPoint[]
}

export interface SanitizedLine extends SanitizedShapeBase {
  readonly kind: 'line'
  readonly x1: number
  readonly y1: number
  readonly x2: number
  readonly y2: number
  readonly linecap: 'round' | 'square' | 'butt'
}

export interface SanitizedPath extends SanitizedShapeBase {
  readonly kind: 'path'
  readonly d: string
}

export type SanitizedVisualShape =
  | SanitizedEllipse
  | SanitizedPolygon
  | SanitizedLine
  | SanitizedPath

export interface SanitizedVisualPart {
  readonly id: string
  readonly shape: SanitizedVisualShape
  readonly zIndex: number
}

export interface SanitizedFaceAnchors {
  readonly leftEye: SanitizedPoint
  readonly rightEye: SanitizedPoint
  readonly mouth: SanitizedPoint
}

export interface SanitizedMotionChannel {
  readonly targetPartId: string | null
  readonly property: 'translateX' | 'translateY' | 'rotate' | 'scale' | 'opacity'
  readonly from: number
  readonly to: number
  readonly durationMs: number
  readonly delayMs: number
}

export interface SanitizedCharacterDesign {
  readonly body: SanitizedVisualShape
  readonly parts: readonly SanitizedVisualPart[]
  readonly palette: readonly string[]
  readonly faceAnchors: SanitizedFaceAnchors
  readonly expressivePartIds: readonly string[]
  readonly idleMotions: readonly SanitizedMotionChannel[]
}

export interface CoordinateLimits {
  readonly min?: number
  readonly max?: number
  readonly fallback?: number
}

const MAX_PARTS = 32
const MAX_POLYGON_POINTS = 48
const MAX_PATH_LENGTH = 2_400
const MAX_TEXT_LENGTH = 120
const MAX_DATA_IMAGE_LENGTH = 900_000
const MIN_COORDINATE = -160
const MAX_COORDINATE = 260
const SVG_COMMAND_OR_NUMBER = /[AaCcHhLlMmQqSsTtVvZz]|[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?/g
const SAFE_PATH_CHARACTERS = /^[AaCcHhLlMmQqSsTtVvZz0-9eE+.,\s-]+$/
const SAFE_IDENTIFIER = /[^a-zA-Z0-9_-]/g
const SAFE_LOCAL_URL = /^(?:\.?\/|\/)?[a-zA-Z0-9_@%+.,/-]+$/
const SAFE_DATA_IMAGE = /^data:image\/(?:png|jpeg|webp);base64,[a-zA-Z0-9+/]+={0,2}$/i
const SAFE_COLOR_FUNCTION = /^(?:rgb|rgba|hsl|hsla)\([\d.%+\-\s,]+\)$/i
const SAFE_NAMED_COLORS = new Set([
  'black', 'white', 'transparent', 'currentcolor', 'none',
  'red', 'orange', 'yellow', 'green', 'blue', 'purple',
  'pink', 'brown', 'gray', 'grey', 'teal', 'navy', 'coral',
])
const FALLBACK_PALETTE = ['#efb46f', '#d16d5d', '#382f2a', '#fffaf0'] as const

export function sanitizeColor(value: unknown, fallback = '#382f2a'): string {
  const safeFallback = normalizeSafeColor(fallback) ?? '#382f2a'
  if (typeof value !== 'string') return safeFallback
  return normalizeSafeColor(value) ?? safeFallback
}

function normalizeSafeColor(value: string): string | null {
  const normalized = value.trim().toLowerCase()
  if (/^#[0-9a-f]{3,4}$/i.test(normalized) || /^#[0-9a-f]{6}(?:[0-9a-f]{2})?$/i.test(normalized)) {
    return normalized
  }
  if (SAFE_NAMED_COLORS.has(normalized) || (normalized.length <= 64 && SAFE_COLOR_FUNCTION.test(normalized))) {
    return normalized
  }
  return null
}

export function sanitizeCoordinate(value: unknown, limits: CoordinateLimits = {}): number {
  const minimum = finiteOr(limits.min, MIN_COORDINATE)
  const maximum = Math.max(minimum, finiteOr(limits.max, MAX_COORDINATE))
  const fallback = clamp(finiteOr(limits.fallback, 0), minimum, maximum)
  return clamp(finiteOr(value, fallback), minimum, maximum)
}

export function sanitizeText(value: unknown, maxLength = MAX_TEXT_LENGTH, fallback = ''): string {
  if (typeof value !== 'string') return fallback
  const safeLimit = Math.round(clamp(maxLength, 0, 500))
  const normalized = value
    .normalize('NFC')
    .replace(/[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/gu, ' ')
    .replace(/\s+/gu, ' ')
    .trim()
  return Array.from(normalized).slice(0, safeLimit).join('') || fallback
}

/** Accepts only local asset paths and bounded PNG/JPEG/WebP data URLs. */
export function sanitizeImageUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const candidate = value.trim()
  if (candidate.length === 0 || candidate.length > MAX_DATA_IMAGE_LENGTH) return null
  if (SAFE_DATA_IMAGE.test(candidate)) return candidate
  if (!SAFE_LOCAL_URL.test(candidate) || candidate.includes('..') || candidate.startsWith('//')) return null
  return candidate
}

/**
 * Keeps only SVG path commands, finite bounded numbers, commas, and whitespace.
 * Invalid command structure is left for the SVG parser, but no CSS/URL/token can pass.
 */
export function sanitizePathData(value: unknown, fallback = ''): string {
  if (typeof value !== 'string') return fallback
  const source = value.trim()
  if (source.length === 0 || source.length > MAX_PATH_LENGTH || !SAFE_PATH_CHARACTERS.test(source)) return fallback
  const tokens = source.match(SVG_COMMAND_OR_NUMBER)
  if (!tokens || !tokens.some((token) => /^[Mm]$/.test(token))) return fallback
  const residue = source.replace(SVG_COMMAND_OR_NUMBER, '').replace(/[\s,]/g, '')
  if (residue.length > 0) return fallback

  return tokens.map((token) => {
    if (/^[A-Za-z]$/.test(token)) return token
    const number = Number(token)
    if (!Number.isFinite(number)) return '0'
    return formatNumber(clamp(number, -1_024, 1_024))
  }).join(' ')
}

export function sanitizeCharacterDesign(spec: CharacterDesignSpec): SanitizedCharacterDesign {
  const record = asRecord(spec)
  const palette = sanitizePalette(record.palette)
  const primary = palette[0] ?? FALLBACK_PALETTE[0]
  const outline = palette[2] ?? FALLBACK_PALETTE[2]
  const body = sanitizeVisualShape(record.body, {
    kind: 'ellipse',
    cx: 50,
    cy: 54,
    rx: 31,
    ry: 36,
    fill: primary,
    stroke: outline,
    strokeWidth: 2.5,
    opacity: 1,
  }, primary, outline)
  const parts = sanitizeParts(record.parts, palette, outline)
  const faceAnchors = sanitizeFaceAnchors(record.faceAnchors)
  const partIds = new Set(['body', ...parts.map((part) => part.id)])
  const expressivePartIds = asArray(record.expressivePartIds)
    .map((value) => sanitizeIdentifier(value))
    .filter((value, index, values) => value.length > 0 && partIds.has(value) && values.indexOf(value) === index)
    .slice(0, 12)
  const idleMotions = sanitizeMotionChannels(record.idleMotions, partIds)

  return { body, parts, palette, faceAnchors, expressivePartIds, idleMotions }
}

export function sanitizeIdentifier(value: unknown, fallback = ''): string {
  const text = sanitizeText(value, 48, fallback).replace(SAFE_IDENTIFIER, '-').replace(/-+/g, '-')
  return text.replace(/^-|-$/g, '') || fallback
}

function sanitizePalette(value: unknown): readonly string[] {
  const colors = asArray(value)
    .map((color, index) => sanitizeColor(color, FALLBACK_PALETTE[index % FALLBACK_PALETTE.length]))
    .filter((color, index, values) => values.indexOf(color) === index)
    .slice(0, 8)
  return colors.length > 0 ? colors : [...FALLBACK_PALETTE]
}

function sanitizeParts(value: unknown, palette: readonly string[], outline: string): readonly SanitizedVisualPart[] {
  const usedIds = new Set<string>(['body'])
  const parts: SanitizedVisualPart[] = []
  for (const [index, candidate] of asArray(value).slice(0, MAX_PARTS).entries()) {
    const record = asRecord(candidate)
    const baseId = sanitizeIdentifier(record.id, `part-${index + 1}`)
    const id = uniqueIdentifier(baseId, usedIds)
    const fallbackFill = palette[(index + 1) % palette.length] ?? FALLBACK_PALETTE[1]
    const shapeSource = record.shape ?? candidate
    const fallback: SanitizedEllipse = {
      kind: 'ellipse', cx: 50, cy: 50, rx: 4, ry: 4,
      fill: fallbackFill, stroke: outline, strokeWidth: 1.5, opacity: 1,
    }
    parts.push({
      id,
      shape: sanitizeVisualShape(shapeSource, fallback, fallbackFill, outline),
      zIndex: Math.round(sanitizeCoordinate(record.zIndex, { min: -20, max: 20, fallback: index })),
    })
  }
  return parts.sort((first, second) => first.zIndex - second.zIndex)
}

function sanitizeVisualShape(
  value: unknown,
  fallback: SanitizedVisualShape,
  fallbackFill: string,
  fallbackStroke: string,
): SanitizedVisualShape {
  const record = asRecord(value)
  const kind = sanitizeShapeKind(record.kind)
  if (!kind) return fallback
  const base = {
    fill: sanitizeColor(record.fill, kind === 'line' ? 'none' : fallbackFill),
    stroke: sanitizeColor(record.stroke, fallbackStroke),
    strokeWidth: sanitizeCoordinate(record.strokeWidth, { min: 0, max: 12, fallback: 2 }),
    opacity: sanitizeCoordinate(record.opacity, { min: 0, max: 1, fallback: 1 }),
  }

  if (kind === 'ellipse') {
    return {
      kind,
      ...base,
      cx: sanitizeCoordinate(record.cx, { min: MIN_COORDINATE, max: MAX_COORDINATE, fallback: 50 }),
      cy: sanitizeCoordinate(record.cy, { min: MIN_COORDINATE, max: MAX_COORDINATE, fallback: 50 }),
      rx: sanitizeCoordinate(record.rx, { min: 0.2, max: 160, fallback: 20 }),
      ry: sanitizeCoordinate(record.ry, { min: 0.2, max: 160, fallback: 20 }),
    }
  }
  if (kind === 'line') {
    const linecap = record.linecap === 'square' || record.linecap === 'butt' ? record.linecap : 'round'
    return {
      kind,
      ...base,
      fill: 'none',
      x1: sanitizeCoordinate(record.x1),
      y1: sanitizeCoordinate(record.y1),
      x2: sanitizeCoordinate(record.x2),
      y2: sanitizeCoordinate(record.y2),
      linecap,
    }
  }
  if (kind === 'polygon') {
    const points = sanitizePoints(record.points)
    return points.length >= 3 ? { kind, ...base, points } : fallback
  }
  const d = sanitizePathData(record.d)
  return d ? { kind, ...base, d } : fallback
}

function sanitizePoints(value: unknown): readonly SanitizedPoint[] {
  const rawPoints = typeof value === 'string'
    ? value.trim().split(/\s+/).map((pair) => pair.split(',').map(Number))
    : asArray(value)
  return rawPoints.slice(0, MAX_POLYGON_POINTS).map((candidate) => sanitizePoint(candidate))
}

function sanitizePoint(value: unknown, fallback: SanitizedPoint = { x: 50, y: 50 }): SanitizedPoint {
  if (Array.isArray(value)) {
    return {
      x: sanitizeCoordinate(value[0], { fallback: fallback.x }),
      y: sanitizeCoordinate(value[1], { fallback: fallback.y }),
    }
  }
  const record = asRecord(value)
  return {
    x: sanitizeCoordinate(record.x, { fallback: fallback.x }),
    y: sanitizeCoordinate(record.y, { fallback: fallback.y }),
  }
}

function sanitizeFaceAnchors(value: unknown): SanitizedFaceAnchors {
  const record = asRecord(value)
  return {
    leftEye: sanitizePoint(record.leftEye, { x: 40, y: 46 }),
    rightEye: sanitizePoint(record.rightEye, { x: 60, y: 46 }),
    mouth: sanitizePoint(record.mouth, { x: 50, y: 60 }),
  }
}

function sanitizeMotionChannels(value: unknown, partIds: ReadonlySet<string>): readonly SanitizedMotionChannel[] {
  const allowedProperties = new Set<SanitizedMotionChannel['property']>([
    'translateX', 'translateY', 'rotate', 'scale', 'opacity',
  ])
  const motions: SanitizedMotionChannel[] = []
  for (const candidate of asArray(value).slice(0, 12)) {
    const record = asRecord(candidate)
    const property = typeof record.property === 'string' && allowedProperties.has(record.property as SanitizedMotionChannel['property'])
      ? record.property as SanitizedMotionChannel['property']
      : null
    if (!property) continue
    const rawTarget = sanitizeIdentifier(record.targetPartId ?? record.partId)
    const targetPartId = rawTarget && partIds.has(rawTarget) ? rawTarget : null
    const propertyLimits = property === 'opacity'
      ? { min: 0, max: 1, fallback: 1 }
      : property === 'scale'
        ? { min: 0.5, max: 1.5, fallback: 1 }
        : { min: -48, max: 48, fallback: 0 }
    motions.push({
      targetPartId,
      property,
      from: sanitizeCoordinate(record.from, propertyLimits),
      to: sanitizeCoordinate(record.to, propertyLimits),
      durationMs: Math.round(sanitizeCoordinate(record.durationMs, { min: 240, max: 12_000, fallback: 2_400 })),
      delayMs: Math.round(sanitizeCoordinate(record.delayMs, { min: 0, max: 8_000, fallback: 0 })),
    })
  }
  return motions
}

function sanitizeShapeKind(value: unknown): SanitizedShapeKind | null {
  return value === 'ellipse' || value === 'polygon' || value === 'line' || value === 'path' ? value : null
}

function uniqueIdentifier(base: string, used: Set<string>): string {
  let candidate = base || 'part'
  let suffix = 2
  while (used.has(candidate)) {
    candidate = `${base}-${suffix}`
    suffix += 1
  }
  used.add(candidate)
  return candidate
}

function asArray(value: unknown): readonly unknown[] {
  return Array.isArray(value) ? value : []
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}
}

function finiteOr(value: unknown, fallback: number): number {
  const number = typeof value === 'number' ? value : Number.NaN
  return Number.isFinite(number) ? number : fallback
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value))
}

function formatNumber(value: number): string {
  return String(Math.round(value * 1_000) / 1_000)
}

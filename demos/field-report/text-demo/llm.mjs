// 보고 콜 어댑터. cached(기본, 의존성 0) / live(프록시 경유 — 클라이언트 키 임베드 금지).
import { buildSystemPrompt, buildUserMessage } from './engine.mjs'

/** 캐시 어댑터 — data/reports.json 의 필드별 저작 응답을 조립 */
export function cachedReport({ reports, skills, quest, variant, equipped }) {
  const fields = {}
  const missing = []
  for (const { skill, version } of equipped) {
    const entry = reports?.[quest.id]?.[variant]?.[skill]?.[version]
    if (entry) {
      fields[skill] = { text: entry.text, refs: entry.refs || [], claims: entry.claims || [] }
    } else {
      missing.push(`${skills[skill].title} ${version}`)
      fields[skill] = { text: `(캐시 없음 — ${skills[skill].title} ${version}. --live 로 실행하면 실제 모델이 채웁니다.)`, refs: [], claims: [] }
    }
  }
  return { report: { fields }, missing, source: 'cache' }
}

/**
 * 라이브 어댑터 — LLM_PROXY_URL 로 POST. 프록시가 Bedrock Converse 를 대행한다.
 * 요청: { system, user, schema } → 응답: { fields, meta }
 */
export async function liveReport({ skills, quest, variant, equipped, note, timeoutMs = 6000 }) {
  const url = process.env.LLM_PROXY_URL
  if (!url) throw new Error('LLM_PROXY_URL 이 설정되지 않았습니다. (--live 없이 실행하면 캐시 모드로 동작합니다)')

  const system = buildSystemPrompt(skills, equipped, note)
  const user = buildUserMessage(quest, variant)
  const schema = {
    type: 'object',
    required: ['fields', 'meta'],
    properties: {
      fields: {
        type: 'object',
        required: equipped.map((e) => e.skill),
        properties: Object.fromEntries(equipped.map((e) => [e.skill, { type: 'string' }])),
      },
      meta: {
        type: 'object',
        required: ['claimed_achievements', 'refs_by_field'],
        properties: {
          claimed_achievements: { type: 'array', items: { type: 'string' } },
          refs_by_field: { type: 'object' },
        },
      },
    },
  }

  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ system, user, schema }),
      signal: ctrl.signal,
    })
    if (!res.ok) throw new Error(`프록시 ${res.status}`)
    const data = await res.json()
    const fields = {}
    for (const { skill } of equipped) {
      fields[skill] = {
        text: data.fields?.[skill] ?? '(응답 없음)',
        refs: data.meta?.refs_by_field?.[skill] ?? [],
        claims: [],
      }
    }
    // 달성 주장은 결과 요약에 귀속시킨다 (검산 시 왜곡 판정의 기준)
    const first = equipped[0]?.skill ?? 'summary'
    if (fields[first]) fields[first].claims = data.meta?.claimed_achievements ?? []
    return { report: { fields }, missing: [], source: 'live' }
  } finally {
    clearTimeout(t)
  }
}

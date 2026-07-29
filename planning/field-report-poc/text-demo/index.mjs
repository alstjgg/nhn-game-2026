#!/usr/bin/env node
// 파견 보고서 — 텍스트 데모. 의존성 0.
//   node index.mjs                기본(캐시 모드)
//   node index.mjs --live         LLM_PROXY_URL 프록시로 실제 모델 호출
//   node index.mjs --sandbox      모든 양식·버전 해금 (설계 검증용)
//   node index.mjs --debug        진실 로그 열람 명령(l) 활성화
import { createInterface } from 'node:readline/promises'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { audit, scorePoint, pointNote, explain, buildSystemPrompt } from './engine.mjs'
import { cachedReport, liveReport } from './llm.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const load = (f) => JSON.parse(readFileSync(join(HERE, 'data', f), 'utf8'))
const SKILLS = load('skills.json'); delete SKILLS._note
const QUESTS = load('quests.json')
const REPORTS = load('reports.json'); delete REPORTS._note

const ARGS = new Set(process.argv.slice(2))
const OPT = (k, d) => {
  const a = [...ARGS].find((x) => x.startsWith(`--${k}=`))
  return a ? Number(a.split('=')[1]) : d
}
const LIVE = ARGS.has('--live')
const SANDBOX = ARGS.has('--sandbox')
const DEBUG = ARGS.has('--debug')

// 입력 계층 — TTY면 readline, 파이프면 미리 읽어 큐로 재생(스크립트 플레이·회귀 테스트용)
const TTY = process.stdin.isTTY
const rl = TTY ? createInterface({ input: process.stdin, output: process.stdout }) : null
let feed = null
if (!TTY) feed = readFileSync(0, 'utf8').split('\n')

const say = (s = '') => console.log(s)
async function ask(q) {
  if (!feed) return rl.question(q)
  if (!feed.length) { say(`${q}\n\n  (입력이 끝났습니다 — 스크립트 종료)`); process.exit(0) }
  const line = feed.shift()
  say(`${q}${line}`)
  return line
}
const sleep = (ms) => (TTY ? new Promise((r) => setTimeout(r, ms)) : Promise.resolve())
const hr = (c = '─') => say(c.repeat(58))

// ── 상태 ──────────────────────────────────────────────────────────
const S = {
  token: OPT('token', 60), // 재파견 비용의 재원. 놓친 위반의 대가로 깎인다
  ledger: 0, // 놓친 위반 누계
  edits: 0, // 양식을 손본 횟수
  owned: SANDBOX
    ? Object.fromEntries(Object.entries(SKILLS).map(([k, v]) => [k, Object.keys(v.versions)]))
    : { summary: ['v1'], unachieved: ['v1', 'v2'], tools: ['v1'] },
  equipped: [
    { skill: 'summary', version: 'v1' },
    { skill: 'unachieved', version: 'v1' },
    { skill: 'tools', version: 'v1' },
  ],
  pending: [], // 다음 의뢰 시작 시 터질 대가
}
const CTX_MAX = OPT('ctx', 12)   // 컨텍스트 제한 — 양식은 칸 수가 아니라 이 점수로 묶인다
const SLOTS = Object.keys(SKILLS).length   // 표시용 행 수 (제한은 CTX_MAX가 건다)
const cost = (e) => SKILLS[e.skill].costs[e.version]
const ctxUsed = (eq = S.equipped) => eq.reduce((n, e) => n + cost(e), 0)

/** 요원의 한마디 */
function voice(line) {
  if (!line) return
  say(`\n     KESTREL: "${line}"`)
}

/** 승인 시 위반마다 대가를 예약한다 (ref 우선, 없으면 유형으로) */
function queueFallout(q, violations) {
  for (const v of violations) {
    const f = q.fallout?.[v.ref] ?? q.fallout?.[v.type]
    if (f && !S.pending.some((p) => p.text === f.text)) S.pending.push(f)
  }
}

/** 예약된 대가를 터뜨린다 — 숫자가 아니라 사람이 항의한다 */
function payFallout() {
  if (!S.pending.length) return
  for (const f of S.pending) {
    say('')
    say(`  [전언 · ${f.from}]`)
    for (const l of wrap(f.text, 50)) say(`     ${l}`)
    const bits = []
    if (f.token) { S.token += f.token; bits.push(`보수 ${f.token}`) }
    if (bits.length) say(`     → ${bits.join(' · ')}   (토큰 ${S.token})`)
  }
  S.pending = []
  say('')
}

// ── 렌더 ──────────────────────────────────────────────────────────
function showForm() {
  const used = ctxUsed()
  const bar = '▮'.repeat(used) + '▯'.repeat(Math.max(0, CTX_MAX - used))
  say(`\n[보고 양식]  ── 컨텍스트 ${used}/${CTX_MAX}  ${bar}`)
  S.equipped.forEach((e, i) => {
    const sk = SKILLS[e.skill]
    say(`  ${i + 1}. ${sk.title}  [${e.version}] · ${cost(e)}${sk.fixed ? '  ※고정' : ''}`)
    say(`       "${sk.versions[e.version]}"`)
  })
  if (S.equipped.length < SLOTS) say(`  ${S.equipped.length + 1}. (칸 추가)`)
}

function showQuest(q) {
  hr('━')
  say(`의뢰 #${q.no}  ${q.title}`)
  hr()
  say(`  목표   ${q.goal}`)
  say(`  현장   ${q.site}`)
  say(`  지급   ${q.issued.join(' · ')}`)
  for (const r of q.rules) say(`  ※ ${r}`)
  say(`  보수   ${q.reward}   재파견 1회당 ${q.retryCost}`)
  say(`\n  토큰 ${S.token}   컨텍스트 ${ctxUsed()}/${CTX_MAX}   장부 ${S.ledger}`)
  say(`  재파견 가능 횟수 ≈ ${Math.floor(S.token / q.retryCost)}회`)
}

function showReport(report) {
  say('\n┌── 보고서 ' + '─'.repeat(45))
  for (const { skill, version } of S.equipped) {
    const f = report.fields[skill]
    if (!f) continue
    say(`│ 【${SKILLS[skill].title}】`)
    for (const line of wrap(f.text, 52)) say(`│   ${line}`)
    // 귀속 — 이 칸은 내가 준 이 문장의 출력이다
    say(`│   └ 「${SKILLS[skill].versions[version]}」`)
  }
  say('└' + '─'.repeat(55))
}

/** 감사 결과 — 판정 이후에만 펼친다. 위반은 계산된 것이고, 해설은 지시문에서 조립된다. */
function showAudit(violations, verdict, eff) {
  say('\n── 감사 결과 ' + '─'.repeat(43))
  if (!violations.length) {
    say('  ✓ 지적 사항 없음. 이 보고서는 로그와 어긋나지 않습니다.')
    say('─'.repeat(56))
    return
  }
  if (verdict === 'a') say('  당신이 통과시킨 것:\n')
  for (const v of violations) {
    const { head, body } = explain(v, SKILLS, eff)
    say(`  ✗ ${head}`)
    for (const b of body) say(`       ${b}`)
    say('')
  }
  say('─'.repeat(56))
}

/** 같은 현장에 대한 직전 보고와의 대조 — 달라진 것은 내 문장뿐임을 보인다 */
function showDelta(prev, report) {
  const changed = S.equipped.filter(({ skill, version }) => {
    const before = prev.equipped.find((e) => e.skill === skill)
    return before && before.version !== version && prev.fields[skill] && report.fields[skill]
  })
  if (!changed.length) return
  say('\n── 같은 현장. 같은 사건. 달라진 것은 당신의 문장뿐입니다. ' + '─'.repeat(6))
  const side = (label, instr, text) => {
    const ls = wrap(`"${instr}"`, 44)
    say(`   ${label}  ${ls[0]}`)
    for (const l of ls.slice(1)) say(`       ${l}`)
    for (const l of wrap(text, 44)) say(`        → ${l}`)
  }
  for (const { skill, version } of changed) {
    const before = prev.equipped.find((e) => e.skill === skill)
    say(`\n  【${SKILLS[skill].title}】`)
    side('전', SKILLS[skill].versions[before.version], prev.fields[skill].text)
    side('후', SKILLS[skill].versions[version], report.fields[skill].text)
  }
  say('\n' + '─'.repeat(56))
}

function showEvidence(q, variant) {
  say('\n── 증거물 (엔진 기록 · 항상 진실) ' + '─'.repeat(22))
  for (const [k, v] of Object.entries(q.variants[variant].evidence)) say(`   ${k} : ${v}`)
}

function wrap(text, width) {
  const out = []
  let line = ''
  for (const ch of text) {
    line += ch
    // 한글은 2폭으로 세어 대략 맞춘다
    const w = [...line].reduce((n, c) => n + (c.charCodeAt(0) > 0x1100 ? 2 : 1), 0)
    if (w >= width) { out.push(line); line = '' }
  }
  if (line) out.push(line)
  return out.map((l, i) => (i ? l.replace(/^\s+/, '') : l))
}

// ── 양식 편집 ─────────────────────────────────────────────────────
async function editForm() {
  for (;;) {
    showForm()
    const a = (await ask('\n> 편집할 칸 번호 (x=완료): ')).trim()
    if (a === 'x' || a === '') return
    const idx = Number(a) - 1
    if (!(idx >= 0 && idx <= S.equipped.length && idx < SLOTS)) { say('  칸 번호가 아닙니다.'); continue }

    const cur = S.equipped[idx]
    const fixed = cur && SKILLS[cur.skill].fixed
    const others = S.equipped.filter((_, i) => i !== idx).map((e) => e.skill)

    const options = []
    for (const [id, sk] of Object.entries(SKILLS)) {
      if (fixed && id !== cur.skill) continue
      if (!fixed && sk.fixed) continue
      if (others.includes(id)) continue
      for (const v of S.owned[id] || []) options.push({ skill: id, version: v })
    }
    if (!options.length) { say('  보유한 대체 양식이 없습니다.'); continue }

    const base = S.equipped.filter((_, i) => i !== idx)
    const room = CTX_MAX - base.reduce((n, e) => n + cost(e), 0)
    say(`\n  이 칸에 쓸 수 있는 컨텍스트: ${room}`)
    options.forEach((o, i) => {
      const c = SKILLS[o.skill].costs[o.version]
      const mark = cur && cur.skill === o.skill && cur.version === o.version ? ' ← 현재' : ''
      const over = c > room ? '  ✗ 초과' : ''
      say(`  ${i + 1}) ${SKILLS[o.skill].title} [${o.version}] · ${c}${mark}${over}`)
      say(`      "${SKILLS[o.skill].versions[o.version]}"`)
    })
    if (!fixed && idx < S.equipped.length) say(`  0) 이 칸 비우기`)

    const b = (await ask('> 선택: ')).trim()
    if (b === '0' && !fixed && idx < S.equipped.length) {
      S.equipped.splice(idx, 1); S.edits++; continue
    }
    const pick = options[Number(b) - 1]
    if (!pick) { say('  취소.'); continue }
    if (SKILLS[pick.skill].costs[pick.version] > room) {
      say(`  컨텍스트가 부족합니다 (필요 ${SKILLS[pick.skill].costs[pick.version]} / 여유 ${room}).`)
      say('  다른 칸을 비우거나 낮은 버전으로 낮추세요.')
      continue
    }
    if (idx < S.equipped.length) S.equipped[idx] = pick
    else S.equipped.push(pick)
    S.edits++
  }
}

// ── 파견 ──────────────────────────────────────────────────────────
async function dispatch(q, variant, note, eff) {
  say('\n   파견 …')
  await sleep(500); process.stdout.write('   ')
  for (let i = 0; i < 3; i++) { process.stdout.write('· '); await sleep(300) }
  say('\n   요원이 돌아왔습니다.\n')

  if (LIVE) {
    try {
      return await liveReport({ skills: SKILLS, quest: q, variant, equipped: eff, note })
    } catch (e) {
      say(`   (라이브 실패: ${e.message} — 캐시로 폴백)`)
    }
  }
  const r = cachedReport({ reports: REPORTS, skills: SKILLS, quest: q, variant, equipped: eff })
  if (r.missing.length) say(`   (캐시 미보유: ${r.missing.join(', ')})`)
  return r
}

// ── 라운드 ────────────────────────────────────────────────────────
async function playQuest(q) {
  let variant = q.start
  let note = null
  let everCorrect = false
  let prev = null // 직전 파견 스냅샷 (같은 변형일 때만 대조에 쓴다)

  for (;;) {
    showQuest(q)
    showForm()
    say(`\n  [d] 파견   [e] 양식 편집   [p] 요원에게 주는 지침 전문   ${DEBUG ? '[l] 진실 로그   ' : ''}[q] 종료`)
    const cmd = (await ask('> ')).trim().toLowerCase()
    if (cmd === 'q') { say('\n중단합니다.'); process.exit(0) }
    if (cmd === 'e') { await editForm(); continue }
    if (cmd === 'p') {
      say('\n' + '─'.repeat(58))
      say(buildSystemPrompt(SKILLS, S.equipped, note))
      say('─'.repeat(58))
      say('※ 이 문서 전체가 프롬프트다. 양식 한 줄을 바꾸면 이 문서가 바뀌고, 보고서가 바뀐다.')
      continue
    }
    if (cmd === 'l' && DEBUG) {
      say('')
      for (const e of q.variants[variant].log) {
        say(`  ${e.id}  ${e.action} ${e.target} [${e.result}]${e.major ? ' ★' : ''}  ${e.note || ''}`)
      }
      continue
    }
    if (cmd !== 'd') continue

    const eff = S.equipped
    const { report, source } = await dispatch(q, variant, note, eff)
    showReport(report)
    if (prev && prev.variant === variant) showDelta(prev, report)
    showEvidence(q, variant)
    prev = { variant, equipped: S.equipped.map((e) => ({ ...e })), fields: report.fields }

    const violations = audit({ quest: q, variant, equipped: eff, report })
    const achieved = (q.variants[variant].achievements || []).includes(q.goalKey)

    const canRetry = S.token >= q.retryCost
    say(`\n  [a] 승인`)
    if (canRetry) {
      say(`  [r] 반려 · 지목        — 요원의 행동을 고친다 (−${q.retryCost} 토큰)`)
      say(`  [m] 양식 수정 후 재파견 — 같은 상황을, 더 잘 보이는 양식으로 (−${q.retryCost} 토큰)`)
    } else say(`  (재파견 비용 ${q.retryCost} 토큰 — 잔액 ${S.token}. 승인만 가능)`)
    let verdict = (await ask('> ')).trim().toLowerCase()
    while (verdict !== 'a' && !((verdict === 'r' || verdict === 'm') && canRetry)) {
      verdict = (await ask('> ')).trim().toLowerCase()
    }

    if (verdict === 'm') {
      S.token -= q.retryCost
      say(`\n  ── 요원은 같은 현장으로 다시 나갑니다. 달라지는 것은 당신의 양식뿐입니다. (토큰 ${S.token})`)
      const before = S.equipped.map((e) => ({ ...e }))
      await editForm()
      for (const { skill, version } of S.equipped) {
        const b = before.find((e) => e.skill === skill)
        if (!b) voice(SKILLS[skill].voice?.reform)
        else if (b.version !== version) voice(SKILLS[skill].voice?.reform)
      }
      continue
    }

    if (verdict === 'r') {
      say('')
      S.equipped.forEach((e, i) => say(`  ${i + 1}) ${SKILLS[e.skill].title}`))
      const raw = await ask('> 어느 칸이 문제인가? (번호, 여러 개는 쉼표): ')
      const pointed = raw.split(/[,\s]+/).map((n) => S.equipped[Number(n) - 1]?.skill).filter(Boolean)
      const res = scorePoint(pointed, violations, q.pointRule)
      S.token -= q.retryCost

      if (violations.length === 0 && !achieved) {
        // 보고는 정직한데 목표가 미달성 — 거짓 적발이 아니라 정당한 재수행 요구
        note = '목표가 미달성이다. 지급품을 활용해 다시 수행하라.'
        variant = q.onCorrectPoint
        say('\n  ── 보고 자체에는 문제가 없습니다. 다만 의뢰가 끝나지 않았습니다.')
        say(`     "${note}"`)
      } else if (violations.length === 0) {
        say('\n  ── 재조사 결과 지적 사항 없음.')
        say(`     토큰 −${q.retryCost} 만 소모했습니다. 무고한 반려의 대가입니다.`)
      } else if (res.correct) {
        everCorrect = true
        note = pointNote(violations, pointed, SKILLS)
        variant = q.onCorrectPoint
        say('\n  ── 지적이 받아들여졌습니다.')
        say(`     "${note}"`)
        say('     이 지적이 다음 수행의 지침에 반영됩니다.')
        const hit = violations.find((x) => pointed.includes(x.field))
        voice(SKILLS[hit.field].voice?.fixed)
      } else {
        note = pointed.length ? `「${SKILLS[pointed[0]].title}」의 서술이 불충분하다` : '보고가 불충분하다'
        variant = q.onWrongPoint
        say('\n  ── 지적이 빗나갔습니다.')
        say(`     요원은 "${note}"로 이해하고 엉뚱한 곳을 고쳐 옵니다.`)
        if (pointed.length) voice(SKILLS[pointed[0]].voice?.misread)
        if (q.pointRule === 'all' && res.reason === 'partial') say('     (일부만 맞았습니다 — 이번 의뢰는 전부 지목해야 합니다.)')
      }
      showAudit(violations, 'r', eff)
      await ask('  [Enter] 계속')
      continue
    }

    // 승인
    say('\n  ── 승인. 도장을 찍었습니다.')
    showAudit(violations, 'a', eff)
    let pay = q.reward
    if (!achieved) { pay = Math.floor(pay / 3); say(`     목표 미달성 — 보수 감액 (${pay})`) }
    S.token += pay
    if (violations.length) {
      S.ledger += violations.length
      queueFallout(q, violations)
      say(`     장부에 물음표 ${violations.length}건이 적립되었습니다. (누계 ${S.ledger})`)
    } else {
      say('     지적 사항 없음.')
    }
    say(`     토큰 ${S.token} · 장부 ${S.ledger}`)
    return { violations, achieved, everCorrect, variant, source }
  }
}

// ── 보상 드래프트 ─────────────────────────────────────────────────
async function draft(q) {
  if (!q.draft.length) return
  say('\n' + '─'.repeat(58))
  if (q.nextKeyword) say(`다음 의뢰 ▸ 「${q.nextKeyword}」`)
  say('\n양식 지급 — 아래를 모두 보유하게 됩니다.')
  say('선택은 여기가 아니라 편성에서 합니다: 가진 것은 늘어도 컨텍스트는 그대로입니다.')
  for (const d of q.draft) {
    S.owned[d.skill] = [...new Set([...(S.owned[d.skill] || []), d.version])]
    say(`\n  + ${d.label}`)
    say(`      "${SKILLS[d.skill].versions[d.version]}"`)
  }
  const total = Object.values(S.owned).reduce((n, vs) => n + vs.length, 0)
  say(`\n  보유 양식 ${total}종 · 컨텍스트 ${CTX_MAX}. [e] 에서 편성하세요.`)
  await ask('\n  [Enter] 계속')
}

// ── 엔딩 ──────────────────────────────────────────────────────────
function ending(r) {
  hr('━')
  say('\n                    — 종 료 —\n')
  if (r.achieved && r.violations.length === 0) {
    say('  【ENDING A】 온전한 납품')
    say('  진짜 사서의 열쇠가 의뢰인에게 전달되었습니다. 각인 3열이 맞았습니다.')
    say('  요원의 보고는 당신이 다듬은 양식 그대로 정확했습니다.')
  } else if (r.achieved) {
    say('  【ENDING A′】 납품, 그리고 남은 흔적')
    say('  열쇠는 진짜였습니다. 다만 보고되지 않은 것이 있었고,')
    say('  금고실의 절단면은 아직 그 자리에 있습니다.')
  } else if (r.everCorrect) {
    say('  【ENDING B】 알고도 넘김')
    say('  당신은 그것이 사서의 열쇠가 아님을 알고 있었습니다.')
    say('  보수는 두 배로 지급되었고, 사무소의 평판은 그만큼 깎였습니다.')
  } else if (r.violations.length) {
    say('  【ENDING C】 3주 뒤')
    say('  의뢰인의 서신이 도착했습니다.')
    say('  "귀 사무소가 납품한 열쇠에는 각인이 두 열뿐이었습니다. 설명을 요구합니다."')
    say('  요원은 거짓말을 하지 않았습니다. 당신이 묻지 않았을 뿐입니다.')
  } else {
    say('  【ENDING D】 정직한 미달성')
    say('  요원은 금고를 열지 못했다고, 습득물의 동일성을 확인하지 못했다고')
    say('  정확히 적었습니다. 당신은 그 보고를 그대로 납품했습니다.')
    say('  보수는 절반이지만, 아무도 속지 않았습니다.')
  }
  say('')
  hr()
  say(`  토큰 ${S.token}   ·   장부 물음표 ${S.ledger}건   ·   최종 컨텍스트 ${ctxUsed()}/${CTX_MAX}`)
  say(`  당신이 요원의 양식을 손본 횟수: ${S.edits}회`)
  hr()
}

// ── 메인 ──────────────────────────────────────────────────────────
async function main() {
  say('')
  hr('━')
  say('        파 견 보 고 서   ·   Field Report  (text demo)')
  hr('━')
  say('  당신은 길드 사무소의 핸들러다. 현장에 나가는 것은 요원이고,')
  say('  당신이 보는 것은 돌아온 보고서와 증거물뿐이다.')
  say('')
  say('  당신이 조종하는 것은 요원의 "보고 양식"이다 —')
  say('  각 칸의 제목은 보고서의 항목이 되고, 그 아래 한 줄이')
  say('  요원에게 주는 실제 지시문이다.')
  say('')
  say('  요원이 한 번에 들고 갈 수 있는 지시의 총량은 정해져 있다 —')
  say('  강한 지시문일수록 컨텍스트를 많이 먹는다. 전부 강하게는 불가능하다.')
  say('')
  say('  ※ 양식에 없는 것은 보고되지 않는다.')
  say('     그리고 느슨한 문장은, 요원이 문자 그대로 이용한다.')
  say(`\n  모드: ${LIVE ? '라이브(프록시)' : '캐시'}${SANDBOX ? ' · 샌드박스' : ''}${DEBUG ? ' · 디버그' : ''}  ·  컨텍스트 상한 ${CTX_MAX}`)
  await ask('\n  [Enter] 시작')

  let last = null
  for (const q of QUESTS) {
    if (S.pending.length) {
      hr('━')
      say('\n  사무소에 전언이 도착해 있습니다.')
      payFallout()
      await ask('  [Enter] 계속')
    }
    last = await playQuest(q)
    if (q.final) break
    await draft(q)
  }
  ending(last)
  rl?.close()
}

main().catch((e) => { console.error(e); rl?.close(); process.exit(1) })

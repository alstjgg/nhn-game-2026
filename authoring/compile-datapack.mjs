#!/usr/bin/env node
// Draft → datapack compiler — pipeline §2 stage 1. Deterministic, zero calls,
// zero deps.
//
//   node compile-datapack.mjs <draft.md> [out-root]     (default out-root: data/scenario)
//
// The draft format (write-scenario skill §4) is a PARSE CONTRACT: sections,
// table columns, bullet labels and shapes are fixed. Anything this script
// cannot parse is an error in the draft, not a case for the compiler to
// guess — compile is extraction, not authoring (pipeline §3). All sentence
// text is carried VERBATIM: the sentences are the mining vein, and a silent
// paraphrase would break key conditions in ways no lint can see.
//
// Non-mechanical mappings are printed as NOTE lines for the session report.

import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from 'node:fs';
import { join, resolve, basename } from 'node:path';

const draftPath = process.argv[2];
const outRoot = process.argv[3] ?? 'data/scenario';
if (!draftPath) {
  console.error('usage: node compile-datapack.mjs <draft.md> [out-root]');
  process.exit(1);
}

const notes = [];
function die(msg) {
  console.error(`✗ compile error: ${msg}`);
  process.exit(1);
}
const stripBold = (s) => s.replaceAll('**', '');
const unquote = (s) => (s.length >= 2 && s.startsWith('"') && s.endsWith('"')) ? s.slice(1, -1) : s;
// strip one trailing sentence period from position fields ("where"), but not
// when the period closes a parenthetical
const stripDot = (s) => (s.endsWith('.') && !s.endsWith('.)')) ? s.slice(0, -1) : s;
const TIME = /([0-2]?[0-9]:[0-5][0-9]\+?)/;

// ---------- read + section split ----------

const src = readFileSync(resolve(draftPath), 'utf8');
const lines = src.split('\n');

const titleLine = lines.find((l) => l.startsWith('# '));
if (!titleLine) die('no H1 title line');
const title = titleLine.slice(2).trim();

const base = basename(draftPath).replace(/\.md$/, '');
const dash = base.indexOf('-');
if (dash < 0) die(`filename "${base}" is not <파일 접두>-<슬러그>.md`);
const slug = base.slice(dash + 1);

const SECTION_NAMES = ['로그라인', '고정 타임라인', '인물', '장소', '숨겨진 진실', '기질 제안', '갈림길', '점수', '자기 검사'];
const sections = {};
let cur = null;
for (const line of lines) {
  const m = line.match(/^## (\d+)\. (.+)$/);
  if (m) { cur = m[2].trim(); sections[cur] = []; continue; }
  if (cur) sections[cur].push(line);
}
for (const name of SECTION_NAMES) {
  if (!sections[name]) die(`missing section "## N. ${name}"`);
}

// ---------- generic parsers ----------

function mdTable(sectionLines, expectedHeader, where) {
  const rows = sectionLines.filter((l) => l.trim().startsWith('|'))
    .map((l) => l.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim()));
  if (rows.length < 2) die(`${where}: no table found`);
  const header = rows[0];
  if (header.join('·') !== expectedHeader.join('·')) {
    die(`${where}: table columns are [${header.join(' | ')}], contract is [${expectedHeader.join(' | ')}]`);
  }
  return rows.slice(2).map((r) => {
    if (r.length !== expectedHeader.length) die(`${where}: row has ${r.length} cells: |${r.join('|')}|`);
    return r;
  });
}

/**
 * The `집계 규칙:` fence in §8 — `Map<unit label, predicate[]>`.
 *
 * Shape (two-space unit, four-space rule):
 *
 *     ```
 *     집계 규칙:
 *       다리 위의 인파:
 *         - cancel_requested => 0
 *         - => 24
 *     ```
 *
 * Not `parseCard`: that one keys on `^[a-z_]+:` and every unit label here is
 * Korean prose. Deliberately dumb — it carries lines across verbatim and judges
 * none of them. Whether a rule is well-formed, names something the pack
 * declares, or ends in a fallback is lint's, through `src/shared/predicates.ts`
 * (contract-datapack §3.6). Compile is extraction, not authoring.
 */
function readScoreRules(sectionLines) {
  const open = sectionLines.findIndex((l) => l.trim() === '```');
  if (open === -1) return { rules: new Map(), rest: sectionLines };
  const close = sectionLines.findIndex((l, i) => i > open && l.trim() === '```');
  if (close === -1) die('점수: 집계 규칙 fence is unterminated');
  const body = sectionLines.slice(open + 1, close);
  if (body[0]?.trim() !== '집계 규칙:') die(`점수: fence does not open with "집계 규칙:"`);

  const rest = [...sectionLines.slice(0, open), ...sectionLines.slice(close + 1)];
  const out = new Map();
  let unit = null;
  for (const line of body.slice(1)) {
    if (!line.trim()) continue;
    const rule = line.match(/^ {4}- (.+)$/);
    if (rule) {
      if (unit === null) die(`점수 집계 규칙: rule before any unit — "${line.trim()}"`);
      out.get(unit).push(rule[1].trim());
      continue;
    }
    const head = line.match(/^ {2}(\S.*):$/);
    if (!head) die(`점수 집계 규칙: unparseable line "${line}"`);
    unit = head[1].trim();
    if (out.has(unit)) die(`점수 집계 규칙: 단위 "${unit}" appears twice`);
    out.set(unit, []);
  }
  return { rules: out, rest };
}

// bullets with indentation: '- ' at depth 0, '  - ' at depth 1; continuation
// lines (indented, no dash) join onto the previous bullet
function parseBullets(sectionLines) {
  const top = [];
  for (const raw of sectionLines) {
    if (!raw.trim()) continue;
    const m = raw.match(/^(\s*)- (.*)$/);
    if (m) {
      const depth = m[1].length === 0 ? 0 : 1;
      const node = { text: m[2].trim(), children: [] };
      if (depth === 0) top.push(node);
      else {
        if (!top.length) die(`indented bullet with no parent: "${raw.trim()}"`);
        top[top.length - 1].children.push(node);
      }
    } else if (/^\s+\S/.test(raw)) {
      const parent = top[top.length - 1];
      if (!parent) continue; // indented prose outside a list — not ours
      const target = parent.children.length ? parent.children[parent.children.length - 1] : parent;
      target.text += ` ${raw.trim()}`;
    }
    // non-indented non-bullet prose: not part of a list — ignore here
  }
  return top;
}

const sentenceSplit = (s) => s.split(/(?<=\.)\s+/).map((x) => x.trim()).filter(Boolean);

// ---------- §4 장소 (parsed first: timeline and gates resolve names here) ----------

const places = [];
{
  const secLines = sections['장소'];
  let place = null;
  for (const raw of secLines) {
    const h = raw.match(/^\*\*(.+?)\*\* — (.+)$/);
    if (h) {
      place = { id: `p${places.length + 1}`, name: h[1].trim(), desc: h[2].trim(), yields: [] };
      places.push(place);
      continue;
    }
    const b = raw.match(/^- (.+)$/);
    if (b && place) {
      const item = b[1].trim();
      const ci = item.indexOf(': ');
      if (ci < 0) die(`장소 ${place.name}: yield bullet without "깊이: 정보" shape — "${item}"`);
      const label = item.slice(0, ci).trim();
      const info = item.slice(ci + 2).trim();
      // a clock is extracted only from an explicit "시계 HH:MM…" label — a
      // time inside a free-text depth note ("17:30 이전에 개입…") is not a gate
      const t = label.startsWith('시계 ') ? label.match(TIME) : null;
      const clock = t ? t[1] : null;
      const depth_note = (clock && label === `시계 ${clock}`) ? null : label;
      place.yields.push({ clock, depth_note, info });
    } else if (/^\s+\S/.test(raw) && place && place.yields.length) {
      place.yields[place.yields.length - 1].info += ` ${raw.trim()}`;
    }
  }
  if (!places.length) die('장소: no place headers (**이름** — 한 줄.) found');
}
function resolvePlace(nameLike, where, { required }) {
  if (!nameLike || nameLike === '—') return null;
  // "위기 대응실(상황실)" answers to 위기 대응실 and 상황실 alike
  const aliases = (p) => {
    const m = p.name.match(/^(.+?)\((.+)\)$/);
    return m ? [p.name, m[1].trim(), m[2].trim()] : [p.name];
  };
  const hit = places.find((p) => p.name === nameLike)
    ?? places.find((p) => aliases(p).some((a) => a.includes(nameLike) || nameLike.includes(a)));
  if (!hit) {
    if (required) die(`${where}: 장소 "${nameLike}" matches no §4 place`);
    notes.push(`${where}: 장소성 표기 "${nameLike}"는 §4 장소가 아님 → place_id null`);
    return null;
  }
  return hit.id;
}

// ---------- §2 timeline ----------

const SURFACE = { '통화': 'call', 'CCTV': 'cctv', '현장': 'onsite', '문서': 'document' };
const events = [];
{
  const rows = mdTable(sections['고정 타임라인'], ['시각', '표면', '장소', '사건', '처음 보이는 런 깊이'], '고정 타임라인');
  for (const [time, surfaceKo, placeKo, text, depth] of rows) {
    const id = `t${events.length + 1}`;
    if (!TIME.test(time) || time.match(TIME)[1] !== time) die(`timeline ${id}: bad 시각 "${time}"`);
    const surface = SURFACE[surfaceKo];
    if (!surface) die(`timeline ${id}: 표면 "${surfaceKo}" not one of ${Object.keys(SURFACE).join('/')}`);
    const place_id = resolvePlace(placeKo, `timeline ${id}`, { required: true });

    const parts = depth.split(' · ').map((p) => p.trim());
    let visible_from;
    const extras = [];
    const head = parts[0];
    if (head.includes('초반 런')) visible_from = null;
    else {
      const m = head.match(/시계 (끝|[0-2]?[0-9]:[0-5][0-9]\+?)까지/);
      if (m) visible_from = m[1] === '끝' ? time : m[1];
      else { visible_from = null; extras.push(head); }
    }
    extras.push(...parts.slice(1));
    events.push({
      id, time, surface, place_id, text,
      exposure: { visible_from, extra_condition: extras.length ? extras.join(' · ') : null },
      // the draft carries only the narrative form of an event; its machine
      // effect (scalar deltas / flags) and beat roster (present) are assigned
      // during gate hardening via the overlay
      effects: null,
      present: null,
    });
  }
  // Ordering is by minute, not by string — a lexical compare cannot rank
  // `21:04+` against `21:04` at all.
  //
  // The trailing `+` is a SUB-MINUTE weight: "immediately after that minute"
  // (decision D7, `src/engine/beat/clock.ts`, and the same reading in
  // `src/client/driver/clock.ts` `mm()`). It is NOT a next-day marker. This
  // once treated it as one — `+1440` — to let a timeline cross midnight, which
  // both invented a second meaning for the token and silenced a guard that was
  // telling the truth: the RUNTIME clock is same-day only. `createClock`'s
  // `isEnded()` is `minute >= endMinute`, so a band of 21:47 → 00:12 is ended
  // at construction and the run never ticks. A pack that crosses midnight
  // compiles into a game that cannot be played.
  //
  // So the refusal below is load-bearing, and it is the compile-time face of a
  // runtime limit. Lift it only together with a day-aware clock.
  const SUB_MINUTE = 0.5;
  const minute = (t) => {
    const [h, m] = t.replace('+', '').split(':').map(Number);
    return h * 60 + m + (t.endsWith('+') ? SUB_MINUTE : 0);
  };
  const keys = events.map((e) => e.time);
  for (let i = 1; i < keys.length; i++) {
    if (minute(keys[i]) < minute(keys[i - 1])) {
      die(
        `timeline: rows out of clock order at ${keys[i]} (after ${keys[i - 1]}) — the clock is same-day only, so a situation that would cross midnight has to be authored earlier in the evening`,
      );
    }
  }
}

// ---------- §3 인물 ----------

const characters = [];
{
  const secLines = sections['인물'];
  const blocks = [];
  for (const raw of secLines) {
    const h = raw.match(/^\*\*(.+?)\*\* \((\d+) · (.+)\)$/);
    if (h) { blocks.push({ name: h[1], age: Number(h[2]), role: h[3].trim(), lines: [] }); continue; }
    if (blocks.length) blocks[blocks.length - 1].lines.push(raw);
  }
  if (!blocks.length) die('인물: no character headers (**이름** (나이 · 역할)) found');
  for (const b of blocks) {
    const id = `c${characters.length + 1}`;
    const bl = parseBullets(b.lines);
    const get = (label) => {
      const hit = bl.find((x) => x.text.startsWith(`${label}:`));
      if (!hit) die(`인물 ${b.name}: missing bullet "- ${label}: …"`);
      return hit.text.slice(label.length + 1).trim();
    };
    const knowsRaw = get('아는 것');
    const ki = knowsRaw.indexOf('모르는 것:');
    if (ki < 0) die(`인물 ${b.name}: 아는 것 bullet has no "모르는 것:" half`);
    // items separate on '·' — commas are indistinguishable from prose commas
    const splitItems = (s) => stripDot(s.trim()).split(' · ').map((x) => x.trim()).filter(Boolean);
    const strandsRaw = get('걸치는 줄기');
    const truth_ids = [...strandsRaw.matchAll(/진실 ([\d·]+)/g)]
      .flatMap((m) => m[1].split('·')).map((n) => `tr${n}`);
    const gate_ids = [...new Set([...strandsRaw.matchAll(/G(\d+)/g)].map((m) => `G${m[1]}`))];
    if (!truth_ids.length && !gate_ids.length) die(`인물 ${b.name}: 걸치는 줄기 has no 진실 N / GN references`);
    characters.push({
      id, name: b.name, age: b.age, role: b.role,
      interest: get('이해관계'),
      knows: splitItems(knowsRaw.slice(0, ki)),
      doesnt_know: splitItems(knowsRaw.slice(ki + '모르는 것:'.length)),
      meters: stripDot(get('눈금 후보')).split(' · ').map((label, i) => ({ id: `m${i + 1}`, label: label.trim(), variable: null, initial: null })),
      strands: { truth_ids: [...new Set(truth_ids)], gate_ids },
    });
  }
}

// ---------- §5 숨겨진 진실 ----------

const truths = [];
{
  const secLines = sections['숨겨진 진실'];
  const blocks = [];
  for (const raw of secLines) {
    const h = raw.match(/^\*\*진실 (\d+) — (.+)\*\*$/);
    if (h) { blocks.push({ n: h[1], statement: h[2].trim(), lines: [] }); continue; }
    if (blocks.length) blocks[blocks.length - 1].lines.push(raw);
  }
  if (!blocks.length) die('숨겨진 진실: no truth headers (**진실 N — …**) found');
  for (const b of blocks) {
    const id = `tr${b.n}`;
    const bl = parseBullets(b.lines);
    const carriers = [];
    const false_leads = [];
    const sentence = (text, where) => {
      const m = text.match(/^"(.+)" — (.+)$/);
      if (!m) die(`${id}: sentence bullet is not "문장" — 자리 : "${text}"`);
      return { text: m[1], where: stripDot(m[2].trim()) };
    };
    for (const item of bl) {
      if (item.text.startsWith('실어 나르는 문장:')) {
        for (const c of item.children) carriers.push({ id: `${id}-s${carriers.length + 1}`, ...sentence(c.text) });
      } else if (item.text.startsWith('거짓 단서:')) {
        const rest = item.text.slice('거짓 단서:'.length).trim();
        if (rest) false_leads.push({ id: `${id}-f${false_leads.length + 1}`, ...sentence(rest) });
        for (const c of item.children) false_leads.push({ id: `${id}-f${false_leads.length + 1}`, ...sentence(c.text) });
      } else die(`${id}: unknown bullet "${item.text.slice(0, 30)}…"`);
    }
    truths.push({ id, statement: b.statement, carriers, false_leads });
  }
}

// ---------- §6 기질 ----------

let temperament;
{
  const secLines = sections['기질 제안'];
  let disposition = null;
  const clauses = [];
  let mode = null; // 'disposition' | 'clause'
  for (const raw of secLines) {
    const d = raw.match(/^\*\*기본 성향\*\* — (.*)$/);
    if (d) { disposition = d[1].trim(); mode = 'disposition'; continue; }
    const c = raw.match(/^\*\*조건절 (\d+) \(축 어휘: (.+?) — (.+)\)\*\*$/);
    if (c) {
      const vocab = [...c[3].matchAll(/'([^']+)'/g)].map((m) => m[1]);
      if (!vocab.length) die(`조건절 ${c[1]}: 축 어휘에 '…' 항목이 없다`);
      clauses.push({ id: `cl${clauses.length + 1}`, axis: c[2].trim(), axis_vocabulary: [c[2].trim(), ...vocab], condition: '', defeat_condition: null });
      mode = 'clause';
      continue;
    }
    if (!raw.trim()) continue;
    if (raw.trim().startsWith('- ')) {
      const bullet = raw.trim().slice(2);
      if (bullet.startsWith('패배 조건:') && mode === 'clause') {
        clauses[clauses.length - 1].defeat_condition = bullet.slice('패배 조건:'.length).trim();
        mode = 'clause-bullets';
      } else if (mode === 'clause-bullets' || mode === 'clause') {
        notes.push(`기질 조건절 ${clauses.length}: 부가 산문 글머리는 팩에 싣지 않음 — "${stripBold(bullet).slice(0, 24)}…" (draft.md에 남는다)`);
        mode = 'clause-bullets';
      }
      continue;
    }
    if (/^\s+\S/.test(raw) && mode === 'clause-bullets') {
      continue; // continuation of an ignored flavor bullet
    }
    if (mode === 'disposition') disposition += ` ${raw.trim()}`;
    else if (mode === 'clause') {
      const cl = clauses[clauses.length - 1];
      cl.condition = cl.condition ? `${cl.condition} ${stripBold(raw.trim())}` : stripBold(raw.trim());
    }
  }
  if (!disposition) die('기질 제안: **기본 성향** — … not found');
  for (const cl of clauses) {
    if (!cl.condition) die(`기질 ${cl.id}: 조건절 본문이 비어 있다`);
    if (!cl.defeat_condition) die(`기질 ${cl.id}: "- 패배 조건: …" 글머리가 없다`);
  }
  temperament = { default_disposition: disposition, clauses };
}

// ---------- §7 갈림길 (yaml card subset parser) ----------

// bracket-aware top-level split — hardened cards nest arrays and maps inside
// inline maps: { id: heard, stances: [c], deltas: { trust: +15 } }
function splitTop(str, where) {
  const parts = [];
  let buf = '', inQ = false, depth = 0;
  for (const ch of str) {
    if (ch === '"') inQ = !inQ;
    if (!inQ) {
      if (ch === '{' || ch === '[') depth++;
      if (ch === '}' || ch === ']') depth--;
      if (ch === ',' && depth === 0) { parts.push(buf); buf = ''; continue; }
    }
    buf += ch;
  }
  if (inQ || depth !== 0) die(`${where}: unbalanced quotes/brackets`);
  parts.push(buf);
  return parts;
}

function parseInlineValue(raw, where) {
  const v = raw.trim();
  if (v.startsWith('{')) return parseInlineMap(v, where);
  if (v.startsWith('[')) {
    return splitTop(v.replace(/^\[/, '').replace(/\]$/, ''), where)
      .map((s) => s.trim()).filter(Boolean).map(unquote);
  }
  return unquote(v);
}

function parseInlineMap(str, where) {
  const inner = str.trim().replace(/^\{/, '').replace(/\}$/, '').trim();
  const obj = {};
  for (const seg of splitTop(inner, where)) {
    if (!seg.trim()) continue;
    const i = seg.indexOf(':');
    if (i < 0) die(`${where}: inline map segment without key — "${seg.trim()}"`);
    obj[seg.slice(0, i).trim()] = parseInlineValue(seg.slice(i + 1), where);
  }
  return obj;
}

function parseCard(cardLines, where) {
  const card = {};
  let i = 0;
  while (i < cardLines.length) {
    const line = cardLines[i];
    if (!line.trim()) { i++; continue; }
    const m = line.match(/^([a-z_]+):(.*)$/);
    if (!m) die(`${where}: unparseable card line "${line}"`);
    const key = m[1];
    const rest = m[2].replace(/\s+#.*$/, '').trim();
    if (rest === '>') {
      i++;
      const buf = [];
      while (i < cardLines.length && /^  \S/.test(cardLines[i]) && !/^  - /.test(cardLines[i])) {
        buf.push(cardLines[i].trim()); i++;
      }
      card[key] = buf.join(' ');
    } else if (rest !== '') {
      card[key] = unquote(rest);
      i++;
    } else {
      i++;
      const items = [];
      while (i < cardLines.length && /^  - /.test(cardLines[i])) {
        const item = cardLines[i].slice(4).trim();
        if (item.startsWith('{')) {
          items.push(parseInlineMap(item, `${where}.${key}[${items.length}]`)); i++;
        } else {
          const bm = item.match(/^([a-z_]+): (.*)$/);
          if (bm) {
            const obj = { [bm[1]]: unquote(bm[2].replace(/\s+#.*$/, '').trim()) };
            i++;
            while (i < cardLines.length) {
              const sub = cardLines[i].match(/^    ([a-z_]+): (.*)$/);
              if (!sub) break;
              obj[sub[1]] = unquote(sub[2].replace(/\s+#.*$/, '').trim());
              i++;
            }
            items.push(obj);
          } else { items.push(unquote(item)); i++; }
        }
      }
      card[key] = items;
    }
  }
  return card;
}

const gates = [];
{
  const secLines = sections['갈림길'];
  const blocks = [];
  for (const raw of secLines) {
    if (raw.startsWith('### ')) { blocks.push({ header: raw, lines: [] }); continue; }
    if (blocks.length) blocks[blocks.length - 1].lines.push(raw);
  }
  if (!blocks.length) die('갈림길: no gate headers (### GN 「…」 — …) found');
  for (const b of blocks) {
    const h = b.header.match(/^### (G\d+) 「(.+)」 — (.+)$/);
    if (!h) die(`갈림길: header is not "### GN 「제목」 — 시각, 장소" : "${b.header}"`);
    let rest = h[3].trim();
    let availability = null;
    const av = rest.match(/\(([^)]+)\)\s*$/);
    if (av) { availability = av[1].trim(); rest = rest.slice(0, av.index).trim(); }
    const [clockPart, ...placeParts] = rest.split(', ');
    const t = clockPart.match(TIME);
    if (!t) die(`${h[1]}: header has no 시각 — "${rest}"`);
    const place_id = resolvePlace(placeParts.join(', ').trim() || null, `${h[1]} header`, { required: false });

    const fenceOpen = b.lines.findIndex((l) => l.trim() === '```yaml');
    const fenceClose = b.lines.findIndex((l, i) => i > fenceOpen && l.trim() === '```');
    if (fenceOpen < 0 || fenceClose < 0) die(`${h[1]}: no \`\`\`yaml card block — 카드 없는 갈림길은 미완성`);
    const prose = (ls) => ls.map((l) => l.trim()).filter(Boolean).map(stripBold).join(' ') || null;
    const card = parseCard(b.lines.slice(fenceOpen + 1, fenceClose), h[1]);

    for (const req of ['gate', 'standard_form', 'question', 'stances', 'default_stance', 'key_conditions', 'key_examples', 'false_leads']) {
      if (!(req in card)) die(`${h[1]}: card missing "${req}"`);
    }
    if (card.gate !== h[1]) die(`${h[1]}: card says gate ${card.gate}`);
    // hardened cards carry buckets — delta values arrive as "+15"/"-20" strings,
    // flag values as "true"/"false" strings
    const buckets = (card.buckets ?? []).map((b) => {
      if (!b.id || !Array.isArray(b.stances)) die(`${h[1]}: bucket needs id and stances[] — got ${JSON.stringify(b)}`);
      const deltas = Object.fromEntries(Object.entries(b.deltas ?? {}).map(([variable, v]) => {
        const n = Number(v);
        if (Number.isNaN(n)) die(`${h[1]} bucket ${b.id}: delta ${variable} is not a number — "${v}"`);
        return [variable, n];
      }));
      const bFlags = Object.fromEntries(Object.entries(b.flags ?? {}).map(([id, v]) => {
        if (v !== 'true' && v !== 'false' && typeof v !== 'boolean') die(`${h[1]} bucket ${b.id}: flag ${id} is not a boolean — "${v}"`);
        return [id, v === true || v === 'true'];
      }));
      return { id: b.id, stances: b.stances, deltas, flags: bFlags };
    });
    gates.push({
      gate: card.gate,
      title: h[2].trim(),
      clock: t[1],
      place_id,
      availability,
      scene: prose(b.lines.slice(0, fenceOpen)),
      branch_note: prose(b.lines.slice(fenceClose + 1)),
      standard_form: card.standard_form,
      question: card.question,
      stances: card.stances,
      default_stance: card.default_stance,
      key_conditions: card.key_conditions,
      key_examples: card.key_examples,
      predicted_shift: card.predicted_shift ?? null,
      false_leads: card.false_leads,
      buckets,
      edge_predicates: card.edge_predicates ?? [],
    });
  }
}

// ---------- §8 점수 ----------

let score;
{
  const secLines = sections['점수'];
  const rows = mdTable(secLines, ['단위', '무엇이 집계되나', '무개입 기준', '소급되는 갈림길'], '점수');
  // The `집계 규칙:` block below the table, keyed by unit label. It lives in a
  // fence rather than a sixth table column because a unit carries three or four
  // ORDERED rules and the values already contain every separator a cell could
  // use (`"단순 추락" 유지 / 재조사 개시`). The table says what is counted; the
  // block says how. Absent ⇒ every unit compiles with `predicates: []`, which
  // is the pre-hardening state lint has always FLAGged (F3).
  // `rest` is the section WITHOUT the fence: the block's own `    - ` lines are
  // indented bullets to `parseBullets`, which reads the baseline summary and the
  // variance notes from the same section and dies on a bullet with no parent.
  const { rules: ruleBlock, rest: prose } = readScoreRules(secLines);

  const units = rows.map(([label, tallies, baseline, gatesCell], i) => {
    const attributed_gates = [...new Set([...gatesCell.matchAll(/G(\d+)/g)].map((m) => `G${m[1]}`))];
    if (!attributed_gates.length) die(`점수 단위 "${label}": 소급되는 갈림길 칸에 GN 표기가 없다`);
    const predicates = ruleBlock.get(label) ?? [];
    ruleBlock.delete(label);
    return { id: `u${i + 1}`, label, tallies, baseline, attributed_gates, predicates };
  });
  // A rule block naming a unit the table does not have is a typo that would
  // otherwise vanish: the unit keeps `predicates: []`, lint FLAGs it as merely
  // un-hardened, and the rules the author wrote go nowhere. Compile is
  // extraction, and extraction that drops its input is a lie.
  if (ruleBlock.size > 0) {
    die(`점수 집계 규칙: 표에 없는 단위 ${[...ruleBlock.keys()].map((k) => JSON.stringify(k)).join(', ')}`);
  }
  const bl = parseBullets(prose).map((b) => stripBold(b.text));
  const find = (label) => {
    const hit = bl.find((t) => t.startsWith(label));
    if (!hit) die(`점수: "- **${label}** …" 글머리가 없다`);
    return hit.slice(label.length).trim();
  };
  score = {
    units,
    baseline_summary: find('무개입 기준 점수(자연 기준):') ? `무개입 기준 점수(자연 기준): ${find('무개입 기준 점수(자연 기준):')}` : null,
    variance_notes: {
      failed_runs: sentenceSplit(find('못 막은 런들끼리도 점수가 다르다:')),
      saved_runs: sentenceSplit(find('막은 런에도 치른 값이 남는다:')),
    },
  };
}

// ---------- meta ----------

const logline = sections['로그라인'].map((l) => l.trim()).filter(Boolean).join(' ');
const meta = {
  slug, title, logline,
  clock: { start: events[0].time, end: events[events.length - 1].time },
  dday: null,
};

const outDir = join(resolve(outRoot), slug);
mkdirSync(outDir, { recursive: true });

// ---------- hardening overlay ----------
// Hand-authored values with no home in the draft (the draft stays in world
// language). Gate machinery (buckets/predicted_shift/edge predicates) lives in
// the draft's canonical cards; everything else — meter variable bindings and
// initials, event effects, symptoms — lives in <pack>/hardening.json and is
// merged here, so recompiling from the draft is always idempotent.

let symptoms = {};
const hardeningPath = join(outDir, 'hardening.json');
if (existsSync(hardeningPath)) {
  let hardening;
  try {
    hardening = JSON.parse(readFileSync(hardeningPath, 'utf8'));
  } catch (e) {
    die(`hardening.json: cannot parse — ${e.message}`);
  }
  for (const [cid, meterSpecs] of Object.entries(hardening.characters ?? {})) {
    const character = characters.find((c) => c.id === cid);
    if (!character) die(`hardening.json: unknown character "${cid}"`);
    for (const [mid, spec] of Object.entries(meterSpecs)) {
      const meter = character.meters.find((m) => m.id === mid);
      if (!meter) die(`hardening.json: ${cid} has no meter "${mid}"`);
      meter.variable = spec.variable ?? null;
      meter.initial = spec.initial ?? null;
    }
  }
  for (const [eid, spec] of Object.entries(hardening.timeline ?? {})) {
    const event = events.find((e) => e.id === eid);
    if (!event) die(`hardening.json: unknown timeline event "${eid}"`);
    // event ids are positional — overlay drift is guarded twice: time catches
    // added/split rows, text_head catches same-time rows swapping places
    // (t4/t5 share 10:40 — time alone never fires there, #104 review 3)
    if (spec.time !== event.time) die(`hardening.json: ${eid} expects time ${spec.time} but event is at ${event.time} — draft rows moved, rekey the overlay`);
    if (!spec.text_head || !event.text.startsWith(spec.text_head)) {
      die(`hardening.json: ${eid} text_head ${JSON.stringify(spec.text_head ?? null)} does not match event text "${event.text.slice(0, 20)}…" — draft rows moved or reworded, rekey the overlay`);
    }
    if (spec.effects) event.effects = { deltas: spec.effects.deltas ?? {}, flags: spec.effects.flags ?? {} };
    if (spec.present) event.present = spec.present;
  }
  symptoms = hardening.symptoms ?? {};
  notes.push(`hardening.json 병합: 인물 ${Object.keys(hardening.characters ?? {}).length} · 타임라인 ${Object.keys(hardening.timeline ?? {}).length} · 증상 변수 ${Object.keys(symptoms).filter((k) => k !== 'flags').length}`);
}

// ---------- write ----------
const writeJSON = (name, obj) => writeFileSync(join(outDir, name), `${JSON.stringify(obj, null, 2)}\n`);
writeJSON('meta.json', meta);
writeJSON('timeline.json', { events });
writeJSON('characters.json', { characters });
writeJSON('places.json', { places });
writeJSON('temperament.json', temperament);
writeJSON('gates.json', { gates });
writeJSON('truths.json', { truths });
writeJSON('score.json', score);
// authored via the hardening overlay; empty skeleton until then (lint flags it)
writeJSON('symptoms.json', symptoms);
// The overlay itself, when the pack has never been hardened. `{}` is the
// schema's own minimum ("최소 오버레이는 빈 객체다"), and lint REQUIRES the file
// — `hardening` is in its FILES list, so a missing one is an ERROR. Without
// this line a freshly compiled pack always fails the factory's machine gate on
// something the draft cannot fix, and §6-5's exit condition (lint ERROR 0) is
// unreachable until a human hand-writes the file. Never overwritten: a hardened
// pack keeps everything it has, which is what makes recompiling idempotent.
if (!existsSync(hardeningPath)) {
  writeJSON('hardening.json', {});
  notes.push('hardening.json 없음 — 빈 오버레이를 생성했다 (하드닝 전 기본 상태)');
}
copyFileSync(resolve(draftPath), join(outDir, 'draft.md'));

console.log(`✓ compiled ${basename(draftPath)} → ${outDir}`);
console.log(`  events ${events.length} · characters ${characters.length} · places ${places.length} · truths ${truths.length} (sentences ${truths.reduce((n, t) => n + t.carriers.length + t.false_leads.length, 0)}) · gates ${gates.length} · score units ${score.units.length}`);
for (const n of notes) console.log(`  NOTE ${n}`);
console.log(`\nnext: node authoring/lint-datapack.mjs ${join(outRoot, slug)}`);

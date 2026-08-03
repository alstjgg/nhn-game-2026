/* ===========================================================================
   DDAY — Phase-2 UI design target · behaviour
   Window manager · sim clock · self-writing feed · sentence mining ·
   block slotting (drag + click) · evidence threads · tally count-up · run loop
   No text input exists anywhere in this file. All player input reduces to
   slot / unslot / mine / deploy.
   =========================================================================== */
(() => {
'use strict';

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const el = (tag, cls, txt) => { const n = document.createElement(tag);
  if (cls) n.className = cls; if (txt != null) n.textContent = txt; return n; };
const mm  = t => (+t.slice(0,2)) * 60 + (+t.slice(3,5));
const hhmm = m => String(Math.floor(m/60)).padStart(2,'0') + ':' + String(m%60).padStart(2,'0');

const T_START = mm(PORTAL.clockStart);      // 08:50
const T_END   = mm(PORTAL.clockEnd);        // 21:04

/* ═══ STATE ══════════════════════════════════════════════════════════════ */
const S = {
  run: RUNSTATE.run,
  remaining: RUNSTATE.remaining,
  clock: mm(RUNSTATE.startAt),
  rate: 1,                       // 0 = paused, 1 = ×1, 4 = ×4
  running: true,
  deployed: true,                // demo opens mid-run: file is locked
  blocks: BLOCKS.map(b => ({...b})),
  slots: new Array(RUNSTATE.slotCap).fill(null),
  mined: new Set(BLOCKS.map(b => b.id)),
  slottedEver: new Set(),
  reports: REPORTS.map(r => ({...r})),
  activeReport: 2,
  feedAt: 0,
  filter: 'all',
  picked: null,
  ended: false,
};
S.blocks.forEach(b => { if (b.slot != null) { S.slots[b.slot] = b.id; S.slottedEver.add(b.id); } });

const MS_PER_SIM_MIN = 105;      // ×1 ≈ 50s of real time for the whole afternoon

/* ═══ TOAST ══════════════════════════════════════════════════════════════ */
let toastT;
function toast(msg){
  const t = $('#toast'); t.textContent = msg; t.classList.add('on');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 2200);
}

/* ═══ WINDOW MANAGER ═════════════════════════════════════════════════════ */
const WINS = {
  feed : { id:'w-feed',  en:'LIVE FEED',   ko:'무전' },
  file : { id:'w-file',  en:'AGENT FILE',  ko:'요원 파일' },
  store: { id:'w-store', en:'BLOCK STORE', ko:'보관함' },
  rep  : { id:'w-rep',   en:'REPORTS',     ko:'부검' },
  tally: { id:'w-tally', en:'TALLY',       ko:'집계' },
};
let zTop = 40;

function buildTaskbar(){
  const bar = $('#taskbar'); bar.innerHTML = '';
  for (const [key, w] of Object.entries(WINS)){
    const b = el('button','task'); b.type = 'button'; b.dataset.win = key;
    b.append(el('b', null, w.en), el('span','t-ko', w.ko));
    b.addEventListener('click', () => toggleWin(key));
    bar.append(b);
  }
  bar.append(el('div','tb-hint','창을 끌어 배치 · 문장을 눌러 채굴'));
  syncTaskbar();
}
function syncTaskbar(){
  $$('.task').forEach(b => {
    const n = $('#' + WINS[b.dataset.win].id);
    b.classList.toggle('open',    !n.classList.contains('hidden'));
    b.classList.toggle('focused',  n.classList.contains('focused'));
  });
}
function focusWin(key){
  const n = $('#' + WINS[key].id);
  $$('.win').forEach(w => w.classList.remove('focused'));
  n.classList.add('focused');
  n.style.setProperty('--z', ++zTop);
  syncTaskbar();
}
function openWin(key){
  const n = $('#' + WINS[key].id);
  n.classList.remove('hidden'); n.classList.remove('collapsed');
  focusWin(key); drawThreads();
}
function toggleWin(key){
  const n = $('#' + WINS[key].id);
  if (n.classList.contains('hidden')) return openWin(key);
  if (!n.classList.contains('focused')) return focusWin(key);
  n.classList.add('hidden'); syncTaskbar(); drawThreads();
}

/* Default desk arrangement, computed from the viewport so nothing hangs off
   the edge. Windows stay freely draggable afterwards. */
function applyLayout(){
  const W = innerWidth, TOP = 94, H = innerHeight - TOP - 14;
  const colA = Math.round(W * 0.265);
  const colB = Math.round(W * 0.395);
  const xB   = 14 + colA + 16;
  const xC   = xB + colB + 16;
  const colC = W - xC - 14;
  const hRep = Math.round(H * 0.565);

  const set = (key, x, y, w, h) => {
    const n = $('#' + WINS[key].id);
    n.style.setProperty('--x', Math.round(x) + 'px');
    n.style.setProperty('--y', Math.round(y) + 'px');
    n.style.setProperty('--w', Math.round(w) + 'px');
    n.style.setProperty('--h', Math.round(h) + 'px');
  };
  set('feed',  14,  TOP, colA, H);
  set('rep',   xB,  TOP, colB, hRep);
  set('store', xB,  TOP + hRep + 14, colB, H - hRep - 14);
  set('file',  xC,  TOP, colC, H);
  set('tally', Math.max(20, (W - 730) / 2), TOP + 16, 730, Math.min(626, H - 16));
}

function initWindows(){
  $$('.win').forEach(n => {
    const key = n.dataset.win;
    n.addEventListener('pointerdown', () => focusWin(key), true);

    /* title-bar drag */
    const bar = $('.win-bar', n);
    bar.addEventListener('pointerdown', e => {
      if (e.target.closest('.wc')) return;
      e.preventDefault();
      const r = n.getBoundingClientRect();
      const ox = e.clientX - r.left, oy = e.clientY - r.top;
      n.classList.add('dragging'); bar.setPointerCapture(e.pointerId);
      const move = ev => {
        n.style.setProperty('--x', Math.max(-40, Math.min(innerWidth - 90,  ev.clientX - ox)) + 'px');
        n.style.setProperty('--y', Math.max( 76, Math.min(innerHeight - 34, ev.clientY - oy)) + 'px');
        drawThreads();
      };
      const up = () => { n.classList.remove('dragging');
        bar.removeEventListener('pointermove', move); bar.removeEventListener('pointerup', up);
        drawThreads(); };
      bar.addEventListener('pointermove', move); bar.addEventListener('pointerup', up);
    });

    /* resize grip */
    const grip = $('.win-grip', n);
    if (grip) grip.addEventListener('pointerdown', e => {
      e.preventDefault(); e.stopPropagation();
      const r = n.getBoundingClientRect();
      const sx = e.clientX, sy = e.clientY, sw = r.width, sh = r.height;
      grip.setPointerCapture(e.pointerId);
      const move = ev => {
        n.style.setProperty('--w', Math.max(300, sw + ev.clientX - sx) + 'px');
        n.style.setProperty('--h', Math.max(140, sh + ev.clientY - sy) + 'px');
        drawThreads();
      };
      const up = () => { grip.removeEventListener('pointermove', move);
        grip.removeEventListener('pointerup', up); drawThreads(); };
      grip.addEventListener('pointermove', move); grip.addEventListener('pointerup', up);
    });

    $('.wc-min',   n).addEventListener('click', e => { e.stopPropagation();
      n.classList.toggle('collapsed'); drawThreads(); });
    $('.wc-close', n).addEventListener('click', e => { e.stopPropagation();
      n.classList.add('hidden'); syncTaskbar(); drawThreads(); });
  });
}

/* ═══ CHROME — clock · d-day ═════════════════════════════════════════════ */
function renderChrome(){
  $('#portalName').textContent = PORTAL.portal;
  $('#portalCode').textContent = PORTAL.portalCode;
  $('#opName').textContent     = PORTAL.operatorId + ' · ' + PORTAL.operator;
  $('#caseName').textContent   = PORTAL.caseSlug + ' · ' + PORTAL.site;
  $('#runNum').textContent     = 'RUN ' + String(S.run).padStart(2,'0');
  $('#ddayNum').textContent    = '−' + String(S.remaining).padStart(2,'0');
  const pips = $('#ddayPips'); pips.innerHTML = '';
  for (let i = 1; i <= RUNSTATE.runsTotal; i++){
    const p = el('i');
    if (i <  S.run) p.className = 'spent';
    if (i === S.run) p.className = 'now';
    pips.append(p);
  }
  paintClock();
}
function paintClock(){
  const d = $('#clockDigits');
  d.textContent = hhmm(S.clock);
  d.classList.remove('tick'); void d.offsetWidth; d.classList.add('tick');
  const pct = Math.min(100, (S.clock - T_START) / (T_END - T_START) * 100);
  $('#clockFill').style.width = pct + '%';
}
function initRate(){
  $$('.rate-btn').forEach(b => b.addEventListener('click', () => {
    S.rate = +b.dataset.rate;
    $$('.rate-btn').forEach(x => x.classList.toggle('is-on', x === b));
  }));
}

/* ═══ WINDOW 1 · AGENT FILE ══════════════════════════════════════════════ */
function renderDossier(){
  const host = $('#dossier'); host.innerHTML = '';
  DOSSIER.forEach(sec => {
    const s = el('div','sect ' + sec.state);
    const hd = el('div','sect-hd');
    hd.append(el('span','sect-no', sec.no), el('h4', null, sec.title));
    const flagText = sec.state === 'operable' ? '조작 가능'
                   : sec.state === 'sealed'   ? '봉인' : '고정';
    hd.append(el('span','sect-flag', flagText));
    s.append(hd);

    if (sec.rows){
      const dl = el('dl','sect-rows');
      sec.rows.forEach(([k,v]) => { dl.append(el('dt',null,k), el('dd',null,v)); });
      s.append(dl);
    } else if (sec.state === 'sealed'){
      const red = el('div','redact');
      [92,54,140,68,110,44,126,80,58,104].forEach((w,i) => {
        const b = el('i'); b.style.width = w + 'px'; b.style.animationDelay = (i*45) + 'ms'; red.append(b);
      });
      s.append(red, el('div','sealed-note', sec.body));
    } else if (sec.state === 'operable'){
      s.append(el('div','sect-body', sec.note));
      s.append(buildSlots());
    } else {
      s.append(el('div','sect-body', sec.body));
    }
    host.append(s);
  });
  syncDeployUI();
}

function buildSlots(){
  const wrap = el('div','slots'); wrap.id = 'slotBoard';
  S.slots.forEach((bid, i) => {
    const slot = el('div','slot');
    slot.dataset.no = String(i+1).padStart(2,'0');
    slot.dataset.slot = i;
    if (S.deployed) slot.classList.add('locked');

    if (bid){
      slot.classList.add('filled');
      const b = S.blocks.find(x => x.id === bid);
      slot.append(cardNode(b, true), el('span','slot-pin'));
      if (!S.deployed){
        const un = el('button','slot-unset','해제'); un.type = 'button';
        un.addEventListener('click', e => { e.stopPropagation(); unslot(i); });
        slot.append(un);
      }
    } else {
      slot.append(el('div','slot-empty', S.deployed ? '— 비어 있음 (잠김)' : '문장 카드를 끌어 놓거나, 카드를 고른 뒤 이 칸을 누르세요'));
    }

    slot.addEventListener('dragover',  e => { if (S.deployed) return;
      e.preventDefault(); slot.classList.add('droppable'); });
    slot.addEventListener('dragleave', () => slot.classList.remove('droppable'));
    slot.addEventListener('drop', e => {
      e.preventDefault(); slot.classList.remove('droppable');
      if (S.deployed) return;
      placeInSlot(e.dataTransfer.getData('text/plain'), i);
    });
    slot.addEventListener('click', () => {
      if (S.deployed) return toast('배치된 파일은 이번 시행 동안 잠깁니다.');
      if (S.picked) placeInSlot(S.picked, i);
    });
    wrap.append(slot);
  });
  return wrap;
}

function placeInSlot(bid, i){
  if (!bid) return;
  const b = S.blocks.find(x => x.id === bid); if (!b) return;
  const prev = S.slots.indexOf(bid); if (prev >= 0) S.slots[prev] = null;
  S.slots[i] = bid;
  S.slottedEver.add(bid);
  S.picked = null;
  renderDossier(); renderStore(); markReportSlots();
  const node = $(`.slot[data-slot="${i}"]`); if (node) { node.classList.add('pop'); }
  drawThreads();
  toast('슬롯 ' + String(i+1).padStart(2,'0') + '에 배치 — ' + speciesKo(b.species));
}
function unslot(i){
  const bid = S.slots[i]; S.slots[i] = null;
  renderDossier(); renderStore(); markReportSlots(); drawThreads();
  if (bid) toast('보관함으로 되돌렸습니다.');
}
function speciesKo(k){ return SPECIES[k] ? SPECIES[k].ko : k; }

function syncDeployUI(){
  const used = S.slots.filter(Boolean).length;
  $('#slotCount').textContent = used + ' / ' + RUNSTATE.slotCap;
  $('#deployState').textContent = S.deployed
    ? '배치됨 — 이번 시행에서 잠김'
    : (used ? '편성 중 — 배치를 기다립니다' : '편성 없음 — 빈 파일로도 배치됩니다');
  const btn = $('#btnDeploy');
  btn.disabled = S.deployed;
  $('#deployStamp').classList.toggle('on', S.deployed);
  if (S.deployed) $('#deployStamp em').textContent =
    'RUN ' + String(S.run).padStart(2,'0') + ' · ' + PORTAL.clockStart;
}

function deploy(){
  if (S.deployed) return;
  S.deployed = true; S.ended = false;
  S.clock = T_START; S.feedAt = 0; S.running = true; S.rate = 1;
  $$('.rate-btn').forEach(x => x.classList.toggle('is-on', x.dataset.rate === '1'));
  $('#feedList').innerHTML = '';
  $('.feed-head div').textContent =
    '연속용지 · 상황실 무전 기록 · 우는다리 RUN ' + String(S.run).padStart(2,'0');
  renderDossier(); paintClock(); openWin('feed'); drawThreads();
  toast('배치 완료 — 요원 파일이 잠겼습니다. 08:50부터 시행합니다.');
}

/* ═══ BLOCK STORE ════════════════════════════════════════════════════════ */
function cardNode(b, inSlot){
  const c = el('div','bcard' + (inSlot ? ' in-slot' : ''));
  c.dataset.block = b.id;
  const sp = SPECIES[b.species] || {ko:b.species, mark:'·', cls:''};

  const top = el('div','bc-top');
  const tag = el('span','bc-sp ' + sp.cls);
  tag.append(el('i', null, sp.mark), document.createTextNode(sp.ko));
  top.append(tag);
  if (b.axis) top.append(el('span','bc-axis', '축 ' + b.axis));
  top.append(el('span','bc-id', b.id.toUpperCase()));

  const src = el('div','bc-src');
  src.append(el('b', null, '런 ' + String(b.run).padStart(2,'0')),
             el('span', null, '· ' + b.at),
             el('span', null, '· ' + b.src));

  c.append(top, el('div','bc-text', b.text), src);

  if (!inSlot){
    c.draggable = !S.deployed;
    c.addEventListener('dragstart', e => {
      e.dataTransfer.setData('text/plain', b.id);
      e.dataTransfer.effectAllowed = 'move';
      c.classList.add('dragging');
    });
    c.addEventListener('dragend', () => c.classList.remove('dragging'));
    c.addEventListener('click', () => {
      if (S.deployed) return toast('배치된 파일은 이번 시행 동안 잠깁니다.');
      S.picked = (S.picked === b.id) ? null : b.id;
      renderStore();
      if (S.picked) toast('카드를 골랐습니다 — 슬롯을 누르세요.');
    });
  } else {
    c.addEventListener('click', e => {
      if (S.deployed) return;
      e.stopPropagation();
      unslot(S.slots.indexOf(b.id));
    });
  }
  return c;
}

function renderFilter(){
  const host = $('#storeFilter'); host.innerHTML = '';
  const opts = [['all','전체','▤'], ...Object.entries(SPECIES).map(([k,v]) => [k, v.ko, v.mark])];
  opts.forEach(([k, ko, mark]) => {
    const n = S.filter === k;
    const b = el('button','fbtn' + (n ? ' on' : '')); b.type = 'button';
    b.append(el('i', null, mark), document.createTextNode(ko));
    const count = k === 'all' ? S.blocks.length : S.blocks.filter(x => x.species === k).length;
    b.append(el('span', null, ' ' + count));
    b.addEventListener('click', () => { S.filter = k; renderStore(); });
    host.append(b);
  });
}

function renderStore(){
  renderFilter();
  const list = $('#storeList'); list.innerHTML = '';
  const shown = S.blocks
    .filter(b => !S.slots.includes(b.id))
    .filter(b => S.filter === 'all' || b.species === S.filter);
  shown.forEach((b, i) => {
    const c = cardNode(b, false);
    c.style.animationDelay = Math.min(i * 40, 320) + 'ms';
    if (S.picked === b.id) c.classList.add('picked');
    if (b.fresh) { c.classList.add('tearing'); delete b.fresh; }
    list.append(c);
  });
  $('#storeEmpty').classList.toggle('on', shown.length === 0);
  syncDeployUI();
  const board = $('#slotBoard'); if (board) { /* slots re-render separately */ }
}

/* store is a drop target — dropping there unslots */
function initStoreDrop(){
  const body = $('#w-store .win-body');
  body.addEventListener('dragover', e => { if (!S.deployed) e.preventDefault(); });
  body.addEventListener('drop', e => {
    e.preventDefault(); if (S.deployed) return;
    const i = S.slots.indexOf(e.dataTransfer.getData('text/plain'));
    if (i >= 0) unslot(i);
  });
}

/* ═══ WINDOW 2 · LIVE FEED ═══════════════════════════════════════════════ */
const MARKS = { event:'▸', radio:'◈', npc:'—', symptom:'·', wait:'', fallback:'※', mark:'' };
let bandFlip = false;

function feedLine(entry, instant){
  const li = el('li','fl fl-' + entry.kind);
  if (instant) li.style.animation = 'none';

  if (entry.kind === 'mark'){
    const c = el('div','fl-c'); c.append(el('span', null, entry.text));
    li.append(c); return li;
  }
  li.append(el('div','fl-t', entry.t));
  const c = el('div','fl-c'); c.dataset.mark = MARKS[entry.kind] || '';

  if (entry.kind === 'radio'){
    c.append(el('b', null, 'ECHO-1 · 무전'), document.createTextNode(entry.text));
  } else if (entry.kind === 'npc'){
    c.append(el('b', null, entry.who + ' '));
    const q = document.createElement('q'); q.textContent = entry.text; c.append(q);
  } else if (entry.kind === 'wait'){
    c.append(document.createTextNode('……' + entry.text));
    const d = el('span','dots'); d.append(el('i'), el('i'), el('i')); c.append(d);
  } else {
    c.textContent = entry.text;
  }
  li.append(c);

  if (entry.kind === 'event' || entry.kind === 'npc'){
    bandFlip = !bandFlip; if (bandFlip) li.classList.add('band');
  }
  return li;
}

function pushFeed(entry, instant){
  const list = $('#feedList');
  if (entry.kind !== 'wait') $$('.fl-wait', list).forEach(n => n.classList.add('resolved'));
  const li = feedLine(entry, instant);
  list.append(li);
  if (!instant){
    const sc = $('#feedScroll');
    sc.scrollTop = sc.scrollHeight;
  }
}

function prefillFeed(){
  const list = $('#feedList'); list.innerHTML = '';
  while (S.feedAt < FEED.length && mm(FEED[S.feedAt].t) < S.clock){
    pushFeed(FEED[S.feedAt++], true);
  }
  requestAnimationFrame(() => { const sc = $('#feedScroll'); sc.scrollTop = sc.scrollHeight; });
}

/* ═══ SIM CLOCK LOOP ═════════════════════════════════════════════════════ */
let acc = 0, last = performance.now();
function loop(now){
  const dt = now - last; last = now;
  if (S.running && S.rate > 0 && S.clock < T_END){
    acc += dt * S.rate;
    while (acc >= MS_PER_SIM_MIN && S.clock < T_END){
      acc -= MS_PER_SIM_MIN; S.clock++;
      while (S.feedAt < FEED.length && mm(FEED[S.feedAt].t) <= S.clock) pushFeed(FEED[S.feedAt++], false);
      paintClock();
      if (S.clock >= T_END) endRun();
    }
  }
  requestAnimationFrame(loop);
}

function endRun(){
  if (S.ended) return;
  S.ended = true; S.running = false;
  while (S.feedAt < FEED.length) pushFeed(FEED[S.feedAt++], false);
  setTimeout(() => { openWin('tally'); runTally(); }, 900);
  $$('.task').forEach(b => { if (b.dataset.win === 'tally') b.classList.add('alert'); });
}

/* ═══ WINDOW 3 · REPORTS ═════════════════════════════════════════════════ */
let typeTimer = null;

function renderArchive(){
  const rail = $('#archRail'); rail.innerHTML = '';
  S.reports.forEach(r => {
    const b = el('button','arch' + (r.run === S.activeReport ? ' on' : '')); b.type = 'button';
    b.append(el('span', null, 'RUN ' + String(r.run).padStart(2,'0')), el('em', null, r.span));
    b.addEventListener('click', () => { S.activeReport = r.run; renderReport(); });
    rail.append(b);
  });
  rail.append(el('div','arch-note','보관 기록 · 시행/시각 순'));
}

function minSpan(s){
  const n = el('span','min sent');
  n.dataset.sent = s.id;
  n.textContent = s.text;
  if (S.mined.has(s.id))       n.classList.add('mined');
  if (S.slottedEver.has(s.id)) n.classList.add('slotted');
  n.addEventListener('click', () => mine(s, n));
  return n;
}

function renderReport(){
  clearTimeout(typeTimer);
  renderArchive();
  const r = S.reports.find(x => x.run === S.activeReport);
  const facts = $('#factsList'); facts.innerHTML = '';
  r.facts.forEach(f => {
    const li = el('li','min-row');
    li.append(el('span','f-t', f.at), minSpan(f));
    facts.append(li);
  });

  const body = $('#bodyList'); body.innerHTML = '';
  typewrite(body, r.body, 0);
  updateMinedCount();
  drawThreads();
}

/* sentence-by-sentence typewriter — the document writes itself */
function typewrite(host, sents, i){
  if (i >= sents.length){ $$('.caret', host).forEach(c => c.remove()); markReportSlots(); drawThreads(); return; }
  const s = sents[i];
  const span = minSpan(s); span.textContent = '';
  const caret = el('span','caret');
  host.append(span, caret, document.createTextNode(' '));
  let k = 0;
  (function step(){
    if (k >= s.text.length){
      caret.remove();
      typeTimer = setTimeout(() => typewrite(host, sents, i + 1), 130);
      return;
    }
    span.textContent += s.text[k++];
    typeTimer = setTimeout(step, 11);
  })();
}

function mine(s, node){
  if (S.mined.has(s.id)) return toast('이미 채굴한 문장입니다.');
  const r = S.reports.find(x => x.run === S.activeReport);
  const fact = r.facts.some(f => f.id === s.id);
  S.mined.add(s.id);
  S.blocks.unshift({
    id: s.id, text: s.text, species: s.species, axis: s.axis || null,
    run: r.run, at: s.at || '보고서', src: fact ? '객관 로그' : '보고서', fresh: true,
  });
  node.classList.add('mined','tear');
  setTimeout(() => node.classList.remove('tear'), 520);
  openWin('store');
  renderStore(); updateMinedCount();
  toast('문장을 뜯어 보관함에 넣었습니다 — ' + speciesKo(s.species));
}

function updateMinedCount(){
  const r = S.reports.find(x => x.run === S.activeReport);
  const ids = [...r.facts, ...r.body].map(x => x.id);
  $('#minedCount').textContent = ids.filter(id => S.mined.has(id)).length;
}
function markReportSlots(){
  $$('.min').forEach(n => n.classList.toggle('slotted', S.slottedEver.has(n.dataset.sent)));
}

/* ═══ EVIDENCE THREADS ═══════════════════════════════════════════════════ */
function visibleRect(node){
  const w = node.closest('.win');
  if (!w || w.classList.contains('hidden') || w.classList.contains('collapsed')) return null;
  const body = w.querySelector('.win-body');
  const r = node.getBoundingClientRect(), b = body.getBoundingClientRect();
  if (r.bottom < b.top + 2 || r.top > b.bottom - 2) return null;
  if (r.right < b.left || r.left > b.right) return null;
  return r;
}
function drawThreads(){
  const svg = $('#threads');
  svg.setAttribute('viewBox', `0 0 ${innerWidth} ${innerHeight}`);
  svg.innerHTML = '';
  /* the tally owns the screen at end of run — no string across it */
  if (!$('#w-tally').classList.contains('hidden')) return;
  S.slots.forEach(bid => {
    if (!bid) return;
    const a = $(`#slotBoard .bcard[data-block="${bid}"]`);
    const b = $(`.min[data-sent="${bid}"]`);
    if (!a || !b) return;
    const ra = visibleRect(a), rb = visibleRect(b);
    if (!ra || !rb) return;
    const x1 = ra.left + 6, y1 = ra.top + ra.height / 2;
    const x2 = rb.right - 4, y2 = rb.top + rb.height / 2;
    const sag = Math.min(46, Math.abs(x1 - x2) * .12) + 14;
    const p = document.createElementNS('http://www.w3.org/2000/svg','path');
    p.setAttribute('d', `M${x2} ${y2} Q ${(x1+x2)/2} ${(y1+y2)/2 + sag} ${x1} ${y1}`);
    svg.append(p);
    [[x1,y1],[x2,y2]].forEach(([cx,cy]) => {
      const c = document.createElementNS('http://www.w3.org/2000/svg','circle');
      c.setAttribute('cx',cx); c.setAttribute('cy',cy); c.setAttribute('r',2.6);
      svg.append(c);
    });
  });
}

/* ═══ WINDOW 4 · TALLY ═══════════════════════════════════════════════════ */
function countUp(node, to, ms){
  const t0 = performance.now();
  (function step(now){
    const k = Math.max(0, Math.min(1, (now - t0) / ms));   // clamp: rAF can lag t0
    const e = 1 - Math.pow(1 - k, 3);
    node.textContent = Math.round(to * e);
    if (k < 1) requestAnimationFrame(step);
  })(t0);
}

function runTally(){
  const rows = $('#tlyRows'); rows.innerHTML = '';
  const big = $('#tlyBig'); big.textContent = '0';
  $('#tlyVerdict').classList.remove('in');
  const wait = $('#tlyWait'); wait.classList.remove('done'); wait.textContent = '……보고서 정리 중';
  $('#btnNewRun').disabled = true;

  countUp(big, TALLY.headline.value, 3400);

  TALLY.rows.forEach((r, i) => {
    const tr = el('tr');
    tr.append(
      el('td','tr-i', String(i+1).padStart(2,'0')),
      el('td','tr-l', r.label),
      el('td','tr-v', r.value),
      el('td','tr-d ' + r.delta, r.delta === 'good' ? '▲' : r.delta === 'bad' ? '▼' : '='),
      el('td','tr-b', '기준 ' + r.baseline),
    );
    rows.append(tr);
    setTimeout(() => tr.classList.add('in'), 500 + i * 640);
  });

  const total = 500 + TALLY.rows.length * 640;
  setTimeout(() => $('#tlyVerdict').classList.add('in'), total + 300);
  setTimeout(() => {
    wait.classList.add('done');
    wait.textContent = 'RUN ' + String(S.run).padStart(2,'0') + ' 보고서가 부검 창에 도착했습니다';
    $('#btnNewRun').disabled = false;
    if (!S.reports.some(r => r.run === 3)) { S.reports.push(REPORT_R3); }
    renderArchive();
  }, total + 1400);
}

function newRun(){
  S.run += 1; S.remaining = Math.max(0, S.remaining - 1);
  S.deployed = false; S.ended = false; S.running = false;
  S.clock = T_START; S.feedAt = 0; S.picked = null;
  $('#feedList').innerHTML = '';
  $('#w-tally').classList.add('hidden');
  $$('.task').forEach(b => b.classList.remove('alert'));
  renderChrome(); renderDossier(); renderStore(); syncTaskbar();
  const dd = $('.dd-value'); dd.classList.remove('bump'); void dd.offsetWidth; dd.classList.add('bump');
  S.activeReport = S.reports[S.reports.length - 1].run;   // newest autopsy on top
  renderReport();
  openWin('file'); openWin('rep');
  drawThreads();
  toast('시행 ' + String(S.run).padStart(2,'0') + ' 준비 — 파일이 열렸습니다. 편성 후 배치하세요.');
}

/* ═══ BOOT ═══════════════════════════════════════════════════════════════ */
function boot(){
  renderChrome();
  buildTaskbar();
  applyLayout();
  initWindows();
  initRate();
  initStoreDrop();
  renderDossier();
  renderStore();
  renderReport();
  prefillFeed();

  $('#btnDeploy').addEventListener('click', deploy);
  $('#btnNewRun').addEventListener('click', newRun);

  $('#feedScroll').addEventListener('scroll', drawThreads, {passive:true});
  $('#w-rep .win-body').addEventListener('scroll', drawThreads, {passive:true, capture:true});
  $('#w-store .win-body').addEventListener('scroll', drawThreads, {passive:true});
  $('#w-file .win-body').addEventListener('scroll', drawThreads, {passive:true});
  addEventListener('resize', drawThreads);

  document.body.classList.remove('booting');
  focusWin('feed');
  requestAnimationFrame(loop);
  setTimeout(drawThreads, 800);
  setTimeout(() => toast('RUN 03 진행 중 · 13:05 — 부검 창의 문장을 눌러 채굴하세요'), 1800);
}

if (document.readyState === 'loading') addEventListener('DOMContentLoaded', boot);
else boot();

})();

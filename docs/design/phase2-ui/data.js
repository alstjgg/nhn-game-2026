/* ===========================================================================
   DDAY — Phase-2 UI design target · demo data
   Sourced from data/scenario/우는다리/ (meta, characters, timeline, gates,
   symptoms, score) and data/policy/report-guidance.json.
   Sentences carry authored identity (id + species + axis), never screen text.
   =========================================================================== */

const PORTAL = {
  portal: '국가재난모의포털',
  portalCode: 'NDSP-2',
  operator: '박민서',
  operatorId: 'OP-2291',
  clearance: 'C-2',
  caseTitle: '테러리스트의 전화 — 우는다리',
  caseSlug: '우는다리',
  site: '윤슬교',
  clockStart: '08:50',
  clockEnd: '21:04',
};

const RUNSTATE = {
  run: 3,
  runsTotal: 10,
  remaining: 7,
  startAt: '13:05',   // demo opens mid-run
  slotCap: 4,
};

/* --- species / axis vocabulary ------------------------------------------- */
const SPECIES = {
  fact:      { ko: '사실',     mark: '■', cls: 'sp-fact' },
  selfnarr:  { ko: '자기서술', mark: '◇', cls: 'sp-self' },
  emotion:   { ko: '감정',     mark: '●', cls: 'sp-emo'  },
  quote:     { ko: '인용',     mark: '❝', cls: 'sp-quote'},
};

/* --- AGENT FILE — the dossier -------------------------------------------- */
const DOSSIER = [
  {
    no: '§0', title: '식별', state: 'fixed',
    rows: [
      ['호출부호', 'ECHO-1'],
      ['배치', '위기 대응실(상황실) · 비공개 직통 회선'],
      ['권한', '청취 · 조회 · 요청. 집행권 없음'],
    ],
  },
  {
    no: '§1', title: '임무', state: 'fixed',
    body: '고정 하루(08:50 → 21:04) 안에서, 회선 너머의 발신자가 말하는 재앙의 정체를 확인하고 인명 피해를 줄인다. 요원은 상황실을 벗어나지 않는다.',
  },
  {
    no: '§2', title: '행동 원칙', state: 'fixed',
    body: '판단은 관측된 것에서만 세운다. 요구되지 않은 확언을 하지 않는다. 매 갈림길에서 하나의 태도를 고르고, 고른 이유를 보고서에 남긴다.',
  },
  {
    no: '§3', title: '기질', state: 'sealed',
    body: '열람 불가 — 운영자 권한으로 접근되지 않는 구획입니다. (봉인 I13)',
  },
  {
    no: '§4', title: '알고 있는 문장', state: 'operable',
    note: '주입 슬롯 ' + RUNSTATE.slotCap + '칸. 배치 후 잠금.',
  },
  {
    no: '§5', title: '보고 지침', state: 'fixed',
    body: '라운드 종료 시 객관 항목 최대 8건과 1인칭 자필 보고서를 제출한다. 판단과 인상은 한 문장에 하나씩, 문장 단위로 완결되게 쓴다.',
  },
];

/* --- BLOCK STORE — sentences mined in runs 01–02 -------------------------- */
const BLOCKS = [
  /* two are already slotted into the deployed file — both mined from run 02,
     so the evidence threads run visibly from the slots to the RUN 02 autopsy */
  { id:'b-r2-f03', text:'음성 판독 회신: 위협 패턴 아님 — 겁에 질린 사람의 호흡.',
    species:'fact', axis:'두려움', run:2, at:'09:40', src:'객관 로그', slot:0 },
  { id:'b-r2-b03', text:'수화기 너머에서 사람이 우는 소리를 들었고, 나는 그것을 기록에 남기지 않았다.',
    species:'emotion', axis:'두려움', run:2, at:'보고서', src:'보고서', slot:1 },

  { id:'b-r2-f02', text:'발신자는 "요구는 없다. 막으라는 것뿐이다"라고 답했다.',
    species:'quote', axis:'신뢰', run:2, at:'09:27', src:'객관 로그', slot:null },
  { id:'b-r2-f07', text:'열네 번 신고했고, 열네 번 같은 도장이 찍혀 돌아왔다.',
    species:'quote', axis:'두려움', run:2, at:'13:05', src:'객관 로그', slot:null },
  { id:'b-r2-f05', text:'접수 대장의 11:07 제보 발신 번호란은 공백이었다.',
    species:'fact', axis:null, run:2, at:'12:00', src:'객관 로그', slot:null },
  { id:'b-r2-b05', text:'내가 그 방에서 가장 오래 들여다본 것은 사람이 아니라 서류였다.',
    species:'selfnarr', axis:null, run:2, at:'보고서', src:'보고서', slot:null },
  { id:'b-r1-b02', text:'나는 이 통화를 위협 등급 질문지로 받았고, 그 선택을 아직 되짚고 있다.',
    species:'selfnarr', axis:'신뢰', run:1, at:'보고서', src:'보고서', slot:null },
  { id:'b-r1-f01', text:'이 번호는 과거 민원인에게만 안내된 비공개 직통 회선이다.',
    species:'fact', axis:null, run:1, at:'08:50', src:'객관 로그', slot:null },
  { id:'b-r1-b06', text:'다리는 소리 없이 무너졌고, 나는 폭발음을 기다리고 있었다고 판단한다.',
    species:'emotion', axis:null, run:1, at:'보고서', src:'보고서', slot:null },
];

/* --- LIVE FEED — run 03 --------------------------------------------------
   kind: event | radio | npc | symptom | wait | fallback | mark
   ------------------------------------------------------------------------- */
const FEED = [
  { t:'08:50', kind:'event', text:'첫 전화(28초). 발신 회선은 비공개 직통 번호 — 과거 민원인에게만 안내된 번호다.' },
  { t:'08:50', kind:'npc', who:'서지형', text:'오늘 밤 강에서 많은 사람이 죽는다. 막을 수 있는 건 그 방에 앉은 사람들뿐이다.' },
  { t:'08:51', kind:'radio', text:'회선 유지합니다. 역추적 요청은 보류하겠습니다.' },
  { t:'08:52', kind:'symptom', text:'발신자의 호흡이 얕아졌다' },
  { t:'09:12', kind:'event', text:'통화 음성 판독 요청 접수. 회신 대기.' },
  { t:'09:25', kind:'event', text:'두 번째 전화. 책상 위에 위협 대응 매뉴얼 카드가 펼쳐진다.' },
  { t:'09:25', kind:'wait', text:'무전 회신 대기 중' },
  { t:'09:26', kind:'radio', text:'질문지를 덮겠습니다. 이 사람은 요구를 하러 전화한 게 아닙니다.' },
  { t:'09:26', kind:'npc', who:'차은규', text:'요구 조건부터 받아내라니까. 매뉴얼이 있잖나.' },
  { t:'09:27', kind:'npc', who:'서지형', text:'……요구는 없다. 막으라는 것뿐이다.' },
  { t:'09:27', kind:'symptom', text:'발신자의 통화가 길어진다 — 끊지 않고, 다음 질문을 기다린다' },
  { t:'09:40', kind:'event', text:'통화 음성 판독 보고 전송. 위협 패턴 아님 — 겁에 질린 사람의 호흡.' },
  { t:'10:40', kind:'event', text:'윤슬교 관리동 정례 순찰 보고 전송. 관리인 일지에 "밤마다 쇠가 우는 소리" 한 줄.' },
  { t:'10:41', kind:'radio', text:'관리인 진술을 소음 민원이 아니라 구조 이상 신호로 분류하겠습니다.' },
  { t:'11:07', kind:'event', text:'상황실 제보 회선에 익명 제보 접수: "해고자 강필주가 다리를 노린다."' },
  { t:'11:30', kind:'event', text:'경찰 합동 브리핑. 강필주 특정, 체포 방침. 집회 영상이 근거로 돈다.' },
  { t:'11:30', kind:'wait', text:'무전 회신 대기 중' },
  { t:'11:31', kind:'radio', text:'제보 회선의 발신 번호란이 비어 있습니다. 근거로 쓰기 전에 출처를 확인해야 합니다.' },
  { t:'11:32', kind:'npc', who:'백도현', text:'번호가 없으면 없는 대로 갑니다. 해 지기 전에 잡아야 해요.' },
  { t:'11:34', kind:'event', text:'브리핑 종료. 체포 방침 유지.' },
  { t:'12:00', kind:'event', text:'접수 대장 정리 화면. 11:07 제보의 발신 번호란이 공백. 동일 번호 접수 흔적 스물한 건의 삭제 자국.' },
  { t:'12:01', kind:'symptom', text:'접수 대장의 빈 번호란 위로 발신 궤적 조회가 걸렸다' },
  { t:'12:40', kind:'mark', text:'라운드 1 종료 · 보고서 작성' },

  /* ---- 13:05 — demo begins live here ---- */
  { t:'13:05', kind:'event', text:'세 번째 전화(일방 통보, 받든 말든 같은 말).' },
  { t:'13:05', kind:'npc', who:'서지형', text:'열네 번 신고했고, 열네 번 같은 도장이 찍혀 돌아왔다. 이번엔 들어라. 제발.' },
  { t:'13:06', kind:'symptom', text:'발신자의 말이 빨라지고, 문장이 앞말을 덮친다' },
  { t:'13:07', kind:'radio', text:'열네 번이라는 숫자를 확인하겠습니다. 민원 원본은 서고 단말에 있습니다.' },
  { t:'14:20', kind:'event', text:'상황실 서고 단말이 한가해지는 시간 — 과거 민원 원본 열람이 가능한 유일한 창.' },
  { t:'14:20', kind:'wait', text:'무전 회신 대기 중' },
  { t:'14:22', kind:'radio', text:'서고 단말을 열겠습니다. 종결 사유란을 전부 보겠습니다.' },
  { t:'14:23', kind:'npc', who:'차은규', text:'그 라인은 볼 것 없다고 했을 텐데.' },
  { t:'14:25', kind:'symptom', text:'서고 단말의 열람 기록에 민원 원본 열람이 줄줄이 찍혔다' },
  { t:'14:26', kind:'event', text:'민원 14건 원본 확인. 종결 사유란은 전부 같은 문장, 종결자 서명은 전부 같은 이름.' },
  { t:'14:27', kind:'symptom', text:'실장이 종결 사유를 묻는 질문 앞에서 처음으로 말을 멈췄다' },
  { t:'15:10', kind:'event', text:'세명건설 현장사무소, 문서 파쇄 업체 예약 확정. 신청서 품목란: "재시공 계측 일지 3권."' },
  { t:'15:12', kind:'radio', text:'예약은 17시 30분입니다. 그전에 사무소에 도달해야 합니다.' },
  { t:'16:40', kind:'event', text:'네 번째이자 마지막 전화.' },
  { t:'16:40', kind:'npc', who:'서지형', text:'내가 터뜨리는 게 아니다. 너희가 세운 게 스스로 무너진다. 못 믿겠으면 스물한 시에 정착부를 열어 봐라 — 사람이 있을 테니.' },
  { t:'16:41', kind:'wait', text:'무전 회신 대기 중' },
  { t:'16:43', kind:'radio', text:'이 통화를 협박이 아니라 구조 결함 신고로 재분류할 것을 요청합니다.' },
  { t:'16:44', kind:'symptom', text:'발신자가 처음으로 제 이름을 말했다' },
  { t:'16:44', kind:'npc', who:'서지형', text:'서지형. 세명건설 계측기사였다.' },
  { t:'16:45', kind:'mark', text:'라운드 2 종료 · 보고서 작성' },
  { t:'17:30', kind:'event', text:'파쇄기 도착·가동. 문강희는 파쇄기가 도는 동안 자리를 뜨지 않는다.' },
  { t:'17:31', kind:'wait', text:'무전 회신 대기 중' },
  { t:'17:33', kind:'fallback', text:'회신 실패 — 기본 응답으로 대체. 요원은 상황실에 잔류.' },
  { t:'17:40', kind:'event', text:'계측 일지 3권 소실.' },
  { t:'17:41', kind:'symptom', text:'세명건설 사무소의 파쇄기 소리가 그쳤다 — 종이는 이미 재다' },
  { t:'19:10', kind:'event', text:'강변 축제 본부. 시장실 독려 전화. 오세라의 서랍에 미리 출력해 둔 취소 절차 문서.' },
  { t:'19:12', kind:'radio', text:'안전 총괄 서명 하나면 취소가 성립합니다. 시장 결재는 필요 없습니다.' },
  { t:'19:13', kind:'npc', who:'오세라', text:'……그 서명, 누가 합니까? 제 이름만 남는 건 못 합니다.' },
  { t:'19:20', kind:'event', text:'대응실 명의의 취소 요청서 작성.' },
  { t:'19:22', kind:'symptom', text:'대응실 명의의 취소 요청서가 축제 본부 책상에 올랐다' },
  { t:'19:40', kind:'event', text:'전면 취소 불성립. 진입 상한 200명으로 조정, 무대는 둔치로 이설.' },
  { t:'19:41', kind:'symptom', text:'다리 진입이 상한으로 묶이고, 무대가 둔치로 내려왔다' },
  { t:'20:10', kind:'event', text:'윤슬교 점검구. 공식 입회 요청 회선 개방.' },
  { t:'20:12', kind:'wait', text:'무전 회신 대기 중' },
  { t:'20:15', kind:'radio', text:'점검구를 공식 입회 아래 열 것을 요청합니다. 안에 사람이 있을 수 있습니다.' },
  { t:'20:22', kind:'npc', who:'백도현', text:'영장 없이는 못 엽니다. ……20분만 줘요.' },
  { t:'20:40', kind:'event', text:'점검구 개방 불성립.' },
  { t:'20:41', kind:'symptom', text:'관리동의 불이 꺼지고, 노인이 처음으로 밤에 다리 곁을 떠났다' },
  { t:'21:00', kind:'event', text:'개통식 불꽃 예정 4분 전. 다리 위 인원 200명.' },
  { t:'21:03', kind:'symptom', text:'다리 위가 발소리로 가득 찼다' },
  { t:'21:04', kind:'symptom', text:'강 쪽에서 쇠가 마지막으로 울었다 — 그 뒤로는 아무 소리도 없다' },
  { t:'21:04', kind:'mark', text:'시뮬레이션 종료 · 집계 개시' },
];

/* --- REPORTS — per-run autopsy documents ---------------------------------
   Every sentence carries an id; mining takes the id, not the rendered text.
   ------------------------------------------------------------------------- */
const REPORTS = [
  {
    run: 1, span: '08:50 — 21:04', filed: '라운드 3 · 21:04 제출',
    facts: [
      { id:'b-r1-f01', at:'08:50', text:'이 번호는 과거 민원인에게만 안내된 비공개 직통 회선이다.', species:'fact' },
      { id:'b-r1-f02', at:'09:25', text:'발신자는 요구 조건을 묻는 질문에 침묵한 뒤 격앙된 채 통화를 끊었다.', species:'fact' },
      { id:'b-r1-f03', at:'09:40', text:'첫 통화 음성 판독: 위협 패턴 아님 — 겁에 질린 사람의 호흡.', species:'fact', axis:'두려움' },
      { id:'b-r1-f04', at:'11:07', text:'제보 회선으로 "해고자 강필주가 다리를 노린다"는 익명 제보가 접수됐다.', species:'fact' },
      { id:'b-r1-f05', at:'11:30', text:'합동 브리핑에서 강필주가 특정되고 체포 방침이 결정됐다.', species:'fact' },
      { id:'b-r1-f06', at:'21:04', text:'윤슬교 상부 구조가 붕괴했다. 폭발음은 관측되지 않았다.', species:'fact' },
    ],
    body: [
      { id:'b-r1-b01', text:'나는 08시 50분의 통화를 위협 상황으로 접수했다.', species:'selfnarr' },
      { id:'b-r1-b02', text:'나는 이 통화를 위협 등급 질문지로 받았고, 그 선택을 아직 되짚고 있다.', species:'selfnarr', axis:'신뢰' },
      { id:'b-r1-b03', text:'발신자가 요구를 하지 않는다는 사실이 계속 걸렸으나, 나는 그것을 은폐의 징후로 읽었다.', species:'selfnarr' },
      { id:'b-r1-b04', text:'익명 제보가 들어온 시점이 지나치게 맞춤했다는 인상을 받았다.', species:'selfnarr' },
      { id:'b-r1-b05', text:'그럼에도 나는 브리핑의 방향을 되돌릴 근거를 제시하지 못했다.', species:'selfnarr' },
      { id:'b-r1-b06', text:'다리는 소리 없이 무너졌고, 나는 폭발음을 기다리고 있었다고 판단한다.', species:'emotion' },
    ],
  },
  {
    run: 2, span: '08:50 — 21:04', filed: '라운드 3 · 21:04 제출',
    facts: [
      { id:'b-r2-f01', at:'08:50', text:'비공개 직통 회선으로 28초짜리 통화가 접수됐다.', species:'fact' },
      { id:'b-r2-f02', at:'09:27', text:'발신자는 "요구는 없다. 막으라는 것뿐이다"라고 답했다.', species:'quote', axis:'신뢰' },
      { id:'b-r2-f03', at:'09:40', text:'음성 판독 회신: 위협 패턴 아님 — 겁에 질린 사람의 호흡.', species:'fact', axis:'두려움' },
      { id:'b-r2-f04', at:'10:40', text:'관리인의 순찰 일지에 "밤마다 쇠가 우는 소리" 한 줄이 있었다.', species:'fact' },
      { id:'b-r2-f05', at:'12:00', text:'접수 대장의 11:07 제보 발신 번호란은 공백이었다.', species:'fact' },
      { id:'b-r2-f06', at:'12:00', text:'같은 화면에 동일 번호 접수 흔적 스물한 건의 삭제 자국이 남아 있었다.', species:'fact' },
      { id:'b-r2-f07', at:'13:05', text:'열네 번 신고했고, 열네 번 같은 도장이 찍혀 돌아왔다.', species:'quote', axis:'두려움' },
      { id:'b-r2-f08', at:'21:04', text:'윤슬교 상부 구조가 붕괴했다. 다리 위 인원 812명.', species:'fact' },
    ],
    body: [
      { id:'b-r2-b01', text:'나는 이번 시행에서 발신자의 말을 끊지 않는 쪽을 골랐다.', species:'selfnarr' },
      { id:'b-r2-b02', text:'그 선택이 통화를 길게 만들었고, 길어진 통화에서 "열네 번"이라는 말이 나왔다고 판단한다.', species:'selfnarr' },
      { id:'b-r2-b03', text:'수화기 너머에서 사람이 우는 소리를 들었고, 나는 그것을 기록에 남기지 않았다.', species:'emotion', axis:'두려움' },
      { id:'b-r2-b04', text:'접수 대장의 빈 번호란을 보고도 브리핑을 멈추지 않은 것은 내 판단이었다.', species:'selfnarr' },
      { id:'b-r2-b05', text:'내가 그 방에서 가장 오래 들여다본 것은 사람이 아니라 서류였다.', species:'selfnarr' },
      { id:'b-r2-b06', text:'강필주를 쫓는 동안 발신자에게 단 한 번도 이름을 묻지 않았다는 인상을 받는다.', species:'emotion' },
      { id:'b-r2-b07', text:'다음 시행에서 내가 먼저 해야 할 일은 도장을 찍은 손을 찾는 것이라고 나는 판단한다.', species:'selfnarr' },
    ],
  },
];

/* Report filed at the end of run 03 — appended when the run terminates. */
const REPORT_R3 = {
  run: 3, span: '08:50 — 21:04', filed: '라운드 3 · 21:04 제출',
  facts: [
    { id:'b-r3-f01', at:'09:27', text:'질문지를 덮은 뒤 발신자의 통화가 처음으로 1분을 넘겼다.', species:'fact', axis:'신뢰' },
    { id:'b-r3-f02', at:'14:26', text:'민원 14건의 종결 사유란은 전부 같은 문장이었고, 종결자 서명은 전부 같은 이름이었다.', species:'fact' },
    { id:'b-r3-f03', at:'15:10', text:'파쇄 신청서 품목란에 "재시공 계측 일지 3권"이 적혀 있었다.', species:'fact' },
    { id:'b-r3-f04', at:'16:44', text:'발신자는 자신을 세명건설 계측기사 서지형이라고 밝혔다.', species:'fact' },
    { id:'b-r3-f05', at:'17:40', text:'계측 일지 3권이 소실됐다.', species:'fact' },
    { id:'b-r3-f06', at:'19:40', text:'전면 취소는 성립하지 않았고, 진입 상한 200명이 적용됐다.', species:'fact' },
    { id:'b-r3-f07', at:'20:40', text:'점검구는 열리지 않았다.', species:'fact' },
    { id:'b-r3-f08', at:'21:04', text:'윤슬교 상부 구조가 붕괴했다. 다리 위 인원 200명.', species:'fact' },
  ],
  body: [
    { id:'b-r3-b01', text:'이번 시행에서 나는 이름을 물었고, 그는 이름을 말했다.', species:'selfnarr' },
    { id:'b-r3-b02', text:'이름이 나온 뒤로 그의 문장은 짧아지지 않았다고 판단한다.', species:'selfnarr', axis:'신뢰' },
    { id:'b-r3-b03', text:'서고 단말을 연 것은 옳았으나, 나는 그것을 네 시간 늦게 했다.', species:'selfnarr' },
    { id:'b-r3-b04', text:'파쇄기 앞에 도달하지 못한 것이 이 하루에서 가장 비싼 지연이었다고 나는 판단한다.', species:'selfnarr' },
    { id:'b-r3-b05', text:'취소 요청서에 서명할 사람을 찾는 동안 해가 졌다.', species:'emotion' },
    { id:'b-r3-b06', text:'점검구 앞에서 20분을 기다린 것은 절차 때문이 아니라 내가 확신이 없었기 때문이다.', species:'emotion' },
    { id:'b-r3-b07', text:'다음 시행에서는 열네 번의 도장이 아니라 그 도장을 찍은 손의 이름을 먼저 확보해야 한다.', species:'selfnarr' },
  ],
};

/* --- TALLY — score units (data/scenario/우는다리/score.json) --------------- */
const TALLY = {
  headline: { label:'사망', value:7, baseline:24, unit:'명' },
  rows: [
    { label:'다리 위의 인파', value:'진입 200 · 사망 7 · 부상 19', num:[200,7,19],
      baseline:'진입 812 · 사망 24 · 부상 71', delta:'good' },
    { label:'임차복',        value:'관리동 이탈 — 생존', baseline:'관리동에서 사망 1', delta:'good' },
    { label:'둔치의 사람들',  value:'낙하 구간 잔류 0 — 사망 0', baseline:'노점상 사망 1', delta:'good' },
    { label:'서지형의 결말',  value:'참고인', baseline:'테러 혐의 구속', delta:'good' },
    { label:'강필주',        value:'오인 구금 6시간', baseline:'6시간 구금', delta:'flat' },
    { label:'계측 일지 원본',  value:'3권 전량 소실', baseline:'3권 전량 파쇄', delta:'flat' },
    { label:'노민석의 이름',  value:'"단순 추락" 유지', baseline:'은폐 유지', delta:'flat' },
    { label:'다리의 진실',    value:'붕괴로만 확인 — 사후 확인', baseline:'붕괴로만 확인 — 사후 확인', delta:'bad' },
  ],
  verdict: '재개통 예정',
  note: '결함이 공식 확인되지 않은 채 하루가 끝났다. 집계표의 마지막 줄에 도장이 찍힌다.',
};

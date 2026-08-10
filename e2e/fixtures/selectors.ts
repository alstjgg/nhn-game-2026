// u11 — the selector vocabulary the acceptance suite speaks.
//
// One place, because §7 is a run-THROUGH: the same twelve items walk every
// window in one page session, and a selector typo in item 9 must not read as a
// shell defect in item 3. Nothing here is new markup — every id/class below is
// already asserted by a unit spec (u3 shell, u4 file, u5 feed, u6 reports,
// u7 tally, u8 threads, u9d pane); u11 only re-uses them (design D3).
export const WINDOWS = {
  feed: '#w-feed',
  file: '#w-file',
  rep: '#w-rep',
} as const

export type WindowKey = keyof typeof WINDOWS

/** The four window ids without the `#`, in default-layout order (C9/C15). */
export const WINDOW_IDS = ['w-feed', 'w-file', 'w-rep'] as const

/* ── chrome (item 1, item 6) ─────────────────────────────────────────────── */
export const CHROME = {
  app: '#app',
  desktop: '#desktop',
  topbar: '#topbar',
  taskbar: '#taskbar',
  caseName: '#caseName',
  runNum: '#runNum',
  ddayNum: '#ddayNum',
  clockDigits: '#clockDigits',
  threads: '#threads',
} as const

/* ── window chrome ops (item 9) ──────────────────────────────────────────── */
export const WIN = {
  any: '.win',
  bar: '.win-bar',
  body: '.win-body',
  grip: '.win-grip',
  collapse: '.wc-min',
  close: '.wc-close',
  task: '.task',
} as const

/* ── feed (items 2, 7) ───────────────────────────────────────────────────── */
export const FEED = {
  list: '#w-feed #feedList',
  scroll: '#w-feed #feedScroll',
  /**
   * The line ROW. x11 — a row is not a text node any more (민서, 08-10): the
   * reveal became a typewriter, so a line is printed twice inside it. `.fl-c`
   * is the column the operator watches fill character by character, carrying
   * `aria-hidden="true"` so a `role="log"` does not re-announce the line once
   * per keystroke; `.fl-sr` is the sr-only sibling holding the COMPLETE text,
   * appended in one go, which is what a reader actually hears.
   *
   * So a caller reading a line's TEXT off this selector has to say which column
   * it means. Reading the row reads both, concatenated with the clock stamp, so
   * a `toContainText` on it keeps passing while measuring a string no surface
   * ever shows, and anything counting occurrences double-counts. Use it to
   * count or classify ROWS; descend to a column to read words.
   */
  line: '#w-feed #feedList .fl',
  /**
   * x11 — BOTH content columns of an NPC line, which is the scope spec §3 inv 2
   * is about: a digit heard is rendered as surely as a digit shown, so a scan
   * that stayed on `.fl-c` would report green while the announced half of every
   * NPC line went unread. Kept in step with `NPC_TEXT_SELECTOR` in
   * `e2e/a11y.spec.ts`, which carries the same pair unprefixed.
   *
   * The clock stamp `.fl-t` is a SIBLING of both and is deliberately outside
   * this scope — it is chrome, and inv 2 is about NPC state.
   */
  npcColumns: '#w-feed #feedList .fl-npc :is(.fl-c, .fl-sr)',
  /** The behind-indicator (U2) — shown only while the feed is NOT following. */
  behind: '#w-feed #feedBehind',
} as const

/* x8 — `EMPTY_SYMPTOM` is gone (민서, 08-10). It named `(변화 없음)`, the copy a
   beat printed when it closed without moving anything, and there is no symptom
   line on the paper to be empty: `run-feed.ts` drops the kind before the DOM,
   the way it already dropped `wait`. The symptoms still exist — they are the
   engine's delta journal and they still reach Call 2 as `SCENE_SYMPTOMS` — so a
   suite that wants to observe one reads it off the stream, as the wait note
   below says, and never off the DOM. `.fl-symptom` selects nothing now. */

/* x6 — `WAIT_PHRASE` and the wait selector are gone (민서, 08-09). There is no
   wait phrasing left to name and no `.fl-wait` node to select: the waiting
   marker was removed outright and a wait now draws nothing at all. `waiting` is
   still on the seam, so a suite that wants to observe one reads it back off the
   stream through `window.__shell.frame().events` — never off the DOM. */

/* ── reports + mining (items 4, 5) ───────────────────────────────────────── */
export const REPORTS = {
  bodyList: '#w-rep #bodyList',
  factsList: '#w-rep #factsList',
  rail: '#w-rep .arch-rail',
  option: '#w-rep .arch-rail [role="option"]',
  minedCount: '#w-rep #minedCount',
  sentence: '#w-rep [data-sentence-id]',
  mineable: '#w-rep .min',
  mined: '#w-rep .min.mined',
} as const

/* ── slots (items 5, 10) ─────────────────────────────────────────────────── */

export const FILE = {
  board: '#w-file #slotBoard',
  slot: '#w-file .slot',
  filled: '#w-file .slot.filled',
  pin: '#w-file .slot-pin',
  slotCount: '#w-file #slotCount',
  deploy: '#w-file #btnDeploy',
  stamp: '#w-file #deployStamp',
  state: '#w-file #deployState',
} as const

/* ── terminal record (U3) ────────────────────────────────────────────────── */
export const RECORD = {
  root: '#w-rep .terminal-record',
  ledger: '#w-rep .terminal-record[data-tally-state]',
  /* x4 — the AXIS lines only. The record's opening (`…시점 집계`) and closing
     (`총 사망자 수 …`) lines are its own head and foot, not scored rows, so a
     caller comparing this against `score.rows.length` must not see them. */
  rows: '#w-rep .terminal-record .tly-line:not(.tl-open):not(.tl-close)',
  big: '#w-rep .terminal-record #tlyBig',
  control: '#w-file #btnDeploy',
} as const

/* ── debug pane (items 3, 5, 12) ─────────────────────────────────────────── */
export const DEBUG = {
  pane: '#debug-pane',
  events: '[data-debug-table="events"]',
  ops: '[data-debug-table="ops"]',
} as const

/** inv 1 — every free-text surface §7 #12 forbids on the player build. */
export const FREE_TEXT = 'input, textarea, select, form, [contenteditable]:not([contenteditable="false"])'

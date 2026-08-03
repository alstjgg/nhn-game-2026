# Phase-2 UI — design target

> **Tier:** design target, not implementation. Produced against the
> [`spec-client.md`](../../spec-client.md) §7 Phase-2 brief. It restyles §5's
> component inventory; it does not restructure it.
>
> Open `index.html` directly in a browser (no build, no server). Desktop only.

Self-contained: `index.html` · `desktop.css` · `app.js` · `data.js`.
`data.js` is populated from `data/scenario/우는다리/` (meta, characters,
timeline, gates, symptoms, score) and `data/policy/report-guidance.json` —
every Korean sentence on screen is authored scenario material, not filler.

## The look

**Dark ink machine-room desktop, paper windows.** The desktop is cold
blue-black with a hairline blueprint elevation of 윤슬교 as wallpaper (the
anchorage marked in seal-red, pulsing). Every window is a different **paper
stock**, which is what carries the "typography and document art" direction:

| Window | Stock | Why |
|---|---|---|
| AGENT FILE | kraft dossier | it is a personnel file — form fields, seal stamp, redaction |
| LIVE FEED | green-bar fanfold, sprocket holes both edges | it is a machine printing as you watch |
| REPORTS | white bond, red margin rule on the report side | two filed documents, side by side |
| TALLY | ruled ledger | it is a 집계표 |
| BLOCK STORE | index-card stock, punch hole per card | the cards are physical chits |

Two accents only: graphite ink and 관인-red (`#b2242c`). Type is **IBM Plex
Mono** for all machine chrome and **Nanum Myeongjo** (명조) for every Korean
document body — the mono/serif split is what separates "the portal" from "the
paper the portal shows you". Grain, vignette and a one-shot scanline sweep on
boot sit over everything.

**The memorable element: red string.** Every filled slot in AGENT FILE is
connected by a literal red thread, drawn over the windows, to the sentence in
REPORTS it was torn from — with pins at both ends. It re-draws while you drag
windows. That is the evidence-board sensation the brief asks for, and it makes
"this run's prompt is built out of last run's report" visible without a word of
explanation.

## What is interactive

Opens mid-run: **RUN 03, 13:05, D-DAY −07**, file deployed and locked, feed
writing itself, RUN 02 autopsy open with two sentences already slotted.

- **Windows** — drag by title bar, resize by corner grip, `—` collapses to the
  title bar, `×` sends to the taskbar, taskbar toggles and raises.
- **Clock** — ticks 08:50 → 21:04 on a fixed schedule (~50 s at ×1, ~13 s at
  ×4, pause). Feed lines land on the clock, not on a timer of their own.
- **Mining** — click any sentence in either REPORTS pane. It tears (red flash,
  strike-through, `채굴` marginal note) and a card animates into BLOCK STORE.
  Archive rail switches between runs; mined and slotted sentences stay marked.
- **Slotting** — drag a card to a slot, or click a card then click a slot;
  click a slotted card (or drag it back to the store) to unslot. Only when the
  file is unlocked.
- **Full loop** — let the clock reach 21:04 → feed closes, TALLY opens and
  counts up over ~9 s → NEW RUN unlocks the file, decrements D-DAY, carries the
  blocks, and files RUN 03's report into the archive.

## Constraints this honours

- **Membrane.** No `<input>`, no `contenteditable`, no free-text surface
  anywhere. Player input is exactly slot / unslot / mine / deploy.
- **I13 — temperament never reaches the view.** §3 기질 renders as animated
  black redaction bars with `열람 불가 — 운영자 권한으로 접근되지 않는 구획`.
  The constraint is used *as* the document art rather than worked around.
- **I12 — no digits for NPC state.** Symptom lines are the only NPC-state
  channel and carry no numbers. The tally does show numbers; those are score,
  not state.
- **I1 — mining takes authored identity.** Every sentence carries an id
  (`b-r2-f03`); cards show it. Clicking hands over the id, never screen text.
  Card ↔ report matching is by id, which is also what the red thread follows.
- **Latency hiding.** Waiting is diegetic (`……무전 회신 대기 중` with three
  breathing dots), never a spinner. The tally's count-up is deliberately paced
  to ~9 s — long enough to cover a report call.
- **Archive segmentation.** Runs are labelled `RUN 01 / 08:50 — 21:04`. No gate
  label appears anywhere on the player surface.

## Notes for whoever implements this

- `applyLayout()` in `app.js` computes the default desk arrangement from the
  viewport; nothing is hard-positioned.
- All `.win` elements must share one stacking context — `#desktop` is
  `display:contents` for exactly that reason (BLOCK STORE lives outside it in
  the markup and would otherwise always paint on top).
- Feed line kinds map 1:1 to `spec-client.md` §5 `RunFeed`:
  `event · radio · npc · symptom · wait · fallback · mark`. The fallback line
  (17:33 in the demo) shows the engine §5 failure rendering.
- Webfonts load from Google Fonts and are entered in `assets-manifest.json`.
  If this face survives into the shipped client, self-host under
  `public/assets/` for the ~1 s load budget and re-point those entries.

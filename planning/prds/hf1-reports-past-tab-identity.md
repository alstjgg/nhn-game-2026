# hf1 — a past sitting's tab is its own: signed by its agent, and there from the start

> plan-playtest v15 · citations bind to `e3c9714` (`origin/main`) · branch `hotfix/reports-past-tab-identity`
> commit message: `fix(reports): a sitting's tab opens with the day and is signed by its own agent`

## Outcome

Two things about a past sitting's tab stop lying.

**The signature follows the sitting, not the desk.** Open ECHO-1's tab while
ECHO-4 is on duty and the 무전 기록 is signed `ECHO-1`, because ECHO-1 wrote it.
Today it is signed by whoever is current, so every archived report claims to be
the work of an agent who never saw it.

**A new sitting has a tab the moment it opens.** Press DEPLOY, the day starts,
and REPORTS immediately offers that day's tab — empty, waiting. Today the tab
appears only when the first report lands, so for the whole first stretch of a
day the rail shows nothing for the day being played.

## Why (author-resolved — do not re-derive)

Both are bugs 민서 filed on 08-08 against the merged g13–g15 desk, and both are
client-only. Neither touches the seam, the membrane or the engine.

The two are one unit because they are one file: both live in
`windows/reports.ts`, and §5.6's pairwise-disjoint rule would forbid them
sharing a wave as two.

## Change list

Three edits, listed bottom-up.

### E1 — `src/client/windows/reports.ts:233`

The `meta` handler brands the whole view to the CURRENT run. That is the defect:
branding belongs to whichever sitting is being READ.

Current text:

```
  driver.subscribe((event) => {
    if (event.type === 'meta') {
      archive = [...event.archive]
      carried = [...event.carried]
      run = event.run
      view.brand(callsignOf(event.run))
      sync()
      return
    }
```

Replacement text:

```
  driver.subscribe((event) => {
    if (event.type === 'meta') {
      archive = [...event.archive]
      carried = [...event.carried]
      run = event.run
      // The callsign is NOT branded here any more. `brand()` re-writes the
      // signature and 무전 기록's subtitle on the document that is mounted, and
      // the mounted document is the SELECTED sitting's — which is not
      // necessarily this event's run. Branding on `meta` signed every archived
      // report with whoever was on duty when it was opened. `drawDocument()`
      // owns it now, because that is where the selection is known.
      sync()
      return
    }
```

### E2 — `src/client/windows/reports.ts:195`

Current text:

```
    const entries = railEntries(archive, [...new Set([...filed.keys(), ...records.keys()])])
```

Replacement text:

```
    // …plus the sitting on the desk right now, which has filed nothing yet and
    // earned no record. Without it a day has no tab of its own until its first
    // report lands, so the rail offers every past sitting and not the one being
    // played. `run` is 0 only before the first `meta`, and a rail entry for run
    // 0 would be a sitting that does not exist.
    const live = run > 0 ? [run] : []
    const entries = railEntries(archive, [...new Set([...filed.keys(), ...records.keys(), ...live])])
```

### E3 — `src/client/windows/reports.ts:159`

Current text:

```
  function drawDocument(): void {
    if (active === null) return
    const model = filed.get(active) ?? { round: active, facts: [], report_body: [] }
```

Replacement text:

```
  function drawDocument(): void {
    if (active === null) return
    // The document being drawn belongs to `active`, so the signature and
    // 무전 기록's subtitle are that sitting's agent — not the desk's current
    // one. This is the only place both facts are known at once, which is why
    // the `meta` handler no longer brands (E1).
    view.brand(callsignOf(active))
    const model = filed.get(active) ?? { round: active, facts: [], report_body: [] }
```

## Invariants

- **`callsignOf` is the one callsign source** (`components/dossier.ts:20`,
  `ECHO-${Math.max(1, run)}`). No new literal is minted; `report-view.ts`'s
  `ECHO-1` initial values are placeholders `brand()` overwrites and stay.
- **The rail carries no gate vocabulary.** `report-archive.ts`'s `REFUSED`
  deny-list and `runLabelOf()` are untouched; a run with no archive label
  renders `{run, label: ''}` exactly as a filed-but-unarchived run already does.
- **The replay is not re-armed.** `drawDocument()`'s `replayed` set and its
  `first` computation are untouched — E3 inserts a line above them and changes
  no control flow, so a round still replays once and then repaints whole
  (R4 on `windows/reports.ts:90`).
- **One record on the page.** `mountRecord()` is untouched.
- **No new empty state.** `drawDocument()` already falls back to
  `{round: active, facts: [], report_body: []}` when a sitting has filed
  nothing; E2 only makes that path reachable one day earlier.

## Verification

- `npm run check` · `npx vitest run` (expect **1608**, unchanged — no vitest
  suite is edited) · `npm run build`.
- Do **not** run playwright. The author runs the browser lanes.

## Done when

- [ ] `npm run check` clean, `npm run build` clean, full vitest green at 1608.
- [ ] `git diff --name-only HEAD` names exactly
      `src/client/windows/reports.ts` and nothing else.
- [ ] `grep -n "view.brand" src/client/windows/reports.ts` returns exactly one
      line, and it is inside `drawDocument()`.
- [ ] **Behavioural:** state in your report what `railEntries` returns for
      `archive = [{run: 1, label: 'a'}]`, `filed = [1]`, `run = 2` — read out of
      a node one-liner or a scratch test against the real function, not guessed.
      Delete any scratch file before committing.

## If this PRD is wrong

An edit whose stated current text is not at the cited path and line is a defect
in this document, not a puzzle to solve. Do not search for the text elsewhere.
Do not adapt the edit to what you find. Do not skip ahead to the next edit.

Stop at the first mismatch and report:
  - the edits that applied, by path:line
  - the edit that did not, with the text actually present at that path and line
  - the commit you are working from: `git log -1 --format=%h`

Change nothing further, and open no PR. A report of this kind is a completed
run, not a failed one.
